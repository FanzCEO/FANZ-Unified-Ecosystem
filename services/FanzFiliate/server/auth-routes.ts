import type { Express } from "express";
import { z } from "zod";
import { storage } from "./storage";
import { generateTokens, authenticateJWT, rateLimit } from "./middleware/auth";
import type { InsertUser } from "@shared/schema";
import { fanzDashService } from "./services/fanzdash";
import { fanzSSOService } from "./services/sso";
import { securityService } from "./services/security";
import { fraudDetectionService } from "./services/fraud-detection";

// Login/Registration schemas
const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const SSOLoginSchema = z.object({
  ssoToken: z.string(),
  ssoUserId: z.string(),
});

const RegisterSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(50),
  name: z.string().min(1).max(100),
  role: z.enum(['affiliate', 'advertiser']).default('affiliate'),
  password: z.string().min(8),
  ssoUserId: z.string().optional(),
});

const RefreshTokenSchema = z.object({
  refreshToken: z.string(),
});

/**
 * Register authentication routes
 */
export function registerAuthRoutes(app: Express) {
  
  // Apply rate limiting to auth routes
  const authRateLimit = rateLimit(10, 60000); // 10 requests per minute

  /**
   * SSO Login/Register - Primary authentication method
   * Integrates with FanzSSO for unified authentication
   */
  app.post("/api/auth/sso", authRateLimit, async (req, res) => {
    try {
      const { ssoToken, ssoUserId } = SSOLoginSchema.parse(req.body);
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';

      // Validate the SSO token with FanzSSO service
      const ssoValidation = await fanzSSOService.validateSSOToken(ssoToken, ssoUserId);
      
      if (!ssoValidation.valid || !ssoValidation.user) {
        // Record failed login attempt
        await securityService.recordLoginAttempt(
          ssoValidation.user?.email || 'unknown',
          ipAddress,
          userAgent,
          false,
          undefined,
          'invalid_sso_token'
        );
        
        return res.status(401).json({ 
          error: ssoValidation.error || "Invalid SSO token", 
          code: "INVALID_SSO_TOKEN" 
        });
      }

      // Try to find existing user by SSO ID
      let user = await storage.getUserBySsoId(ssoUserId);

      if (!user) {
        // Auto-register user from SSO data
        const newUser: InsertUser = {
          ssoUserId,
          email: ssoValidation.user.email,
          username: ssoValidation.user.username || ssoValidation.user.email.split('@')[0],
          name: ssoValidation.user.name || ssoValidation.user.username || 'Unknown User',
          role: ssoValidation.user.role || 'affiliate',
          kycStatus: ssoValidation.user.kycStatus || 'unverified',
          kycTier: ssoValidation.user.kycTier || 0,
        };

        user = await storage.createUser(newUser);
        
        // Create initial balance record for affiliates
        if (user.role === 'affiliate') {
          await storage.createOrUpdateBalance({
            userId: user.id,
            availableBalance: '0.00',
            pendingBalance: '0.00',
            totalEarnings: '0.00',
          });
        }
        
        // Log user registration to SSO
        await fanzSSOService.logActivity(ssoUserId, {
          type: 'user_registered',
          details: {
            platform: 'fanzfiliate',
            userId: user.id,
            role: user.role,
          }
        });
        
        // Publish user registration event to FanzDash
        await fanzDashService.publishUserRegistration(user);
      } else {
        // Update existing user with latest SSO data if needed
        const updates: Record<string, any> = {};
        
        if (ssoValidation.user.kycStatus && ssoValidation.user.kycStatus !== user.kycStatus) {
          updates.kycStatus = ssoValidation.user.kycStatus;
        }
        
        if (ssoValidation.user.kycTier !== undefined && ssoValidation.user.kycTier !== user.kycTier) {
          updates.kycTier = ssoValidation.user.kycTier;
        }
        
        if (ssoValidation.user.name && ssoValidation.user.name !== user.name) {
          updates.name = ssoValidation.user.name;
        }
        
        if (Object.keys(updates).length > 0) {
          user = await storage.updateUser(user.id, updates);
        }
        
        // Log user login to SSO
        await fanzSSOService.logActivity(ssoUserId, {
          type: 'user_login',
          details: {
            platform: 'fanzfiliate',
            method: 'sso',
          }
        });
      }

      if (!user.isActive) {
        // Record failed login attempt for inactive account
        await securityService.recordLoginAttempt(
          user.email,
          ipAddress,
          userAgent,
          false,
          user.id,
          'account_deactivated'
        );
        
        return res.status(401).json({ 
          error: "Account deactivated", 
          code: "ACCOUNT_DEACTIVATED" 
        });
      }

      // Track device and analyze for fraud
      const deviceFingerprint = req.get('X-Device-Fingerprint') || `${userAgent}_${ipAddress}`;
      const deviceInfo = {
        name: req.get('X-Device-Name') || 'Unknown Device',
        type: (/mobile|android|iphone/i.test(userAgent) ? 'mobile' : 
               /tablet|ipad/i.test(userAgent) ? 'tablet' : 'desktop') as 'desktop' | 'mobile' | 'tablet',
        browser: userAgent.split(' ')[0] || 'Unknown',
        os: (/windows/i.test(userAgent) ? 'Windows' :
             /mac/i.test(userAgent) ? 'macOS' :
             /linux/i.test(userAgent) ? 'Linux' : 'Unknown'),
        ipAddress,
      };

      const { isNewDevice } = await securityService.trackUserDevice(
        user.id,
        deviceFingerprint,
        deviceInfo
      );

      // Analyze login for fraud indicators
      const fraudAnalysis = await fraudDetectionService.analyzeClick({
        affiliateId: user.id,
        offerId: 'login', // Special identifier for login events
        ip: ipAddress,
        userAgent,
        timestamp: new Date(),
      });

      if (fraudAnalysis.score > 80) {
        // High-risk login - require additional verification
        await securityService.recordLoginAttempt(
          user.email,
          ipAddress,
          userAgent,
          false,
          user.id,
          'high_fraud_risk'
        );
        
        return res.status(403).json({
          error: "Additional verification required",
          code: "HIGH_RISK_LOGIN",
          requiresVerification: true,
          riskScore: fraudAnalysis.score,
          riskFactors: fraudAnalysis.reasons,
        });
      }

      // Record successful login attempt
      await securityService.recordLoginAttempt(
        user.email,
        ipAddress,
        userAgent,
        true,
        user.id
      );

      // Generate JWT tokens
      const tokens = generateTokens(user);

      // Return user data and tokens with security context
      res.json({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          name: user.name,
          role: user.role,
          kycStatus: user.kycStatus,
          kycTier: user.kycTier,
        },
        security: {
          isNewDevice,
          riskScore: fraudAnalysis.score,
          requiresEmailVerification: false, // Could be dynamic based on risk
          requires2FA: false, // Could be dynamic based on user settings
        },
        ...tokens,
      });

    } catch (error) {
      console.error('SSO login error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid request data", 
          details: error.errors,
          code: "VALIDATION_ERROR" 
        });
      }
      
      res.status(500).json({ 
        error: "Authentication service error", 
        code: "AUTH_SERVICE_ERROR" 
      });
    }
  });

  /**
   * Traditional Email/Password Login (backup method)
   */
  app.post("/api/auth/login", authRateLimit, async (req, res) => {
    try {
      const { email, password } = LoginSchema.parse(req.body);
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';

      // In a real implementation, you'd hash and compare passwords
      // For now, this is a placeholder that works with seed data
      const user = await storage.getUserByEmail?.(email);
      
      if (!user || !user.isActive) {
        // Record failed login attempt
        await securityService.recordLoginAttempt(
          email,
          ipAddress,
          userAgent,
          false,
          user?.id,
          'invalid_credentials'
        );
        
        return res.status(401).json({ 
          error: "Invalid credentials", 
          code: "INVALID_CREDENTIALS" 
        });
      }

      // Track device and analyze for fraud
      const deviceFingerprint = req.get('X-Device-Fingerprint') || `${userAgent}_${ipAddress}`;
      const deviceInfo = {
        name: req.get('X-Device-Name') || 'Unknown Device',
        type: (/mobile|android|iphone/i.test(userAgent) ? 'mobile' : 
               /tablet|ipad/i.test(userAgent) ? 'tablet' : 'desktop') as 'desktop' | 'mobile' | 'tablet',
        browser: userAgent.split(' ')[0] || 'Unknown',
        os: (/windows/i.test(userAgent) ? 'Windows' :
             /mac/i.test(userAgent) ? 'macOS' :
             /linux/i.test(userAgent) ? 'Linux' : 'Unknown'),
        ipAddress,
      };

      const { isNewDevice } = await securityService.trackUserDevice(
        user.id,
        deviceFingerprint,
        deviceInfo
      );

      // Analyze login for fraud indicators
      const fraudAnalysis = await fraudDetectionService.analyzeClick({
        affiliateId: user.id,
        offerId: 'login', // Special identifier for login events
        ip: ipAddress,
        userAgent,
        timestamp: new Date(),
      });

      if (fraudAnalysis.score > 80) {
        // High-risk login - require additional verification
        await securityService.recordLoginAttempt(
          user.email,
          ipAddress,
          userAgent,
          false,
          user.id,
          'high_fraud_risk'
        );
        
        return res.status(403).json({
          error: "Additional verification required",
          code: "HIGH_RISK_LOGIN",
          requiresVerification: true,
          riskScore: fraudAnalysis.score,
          riskFactors: fraudAnalysis.reasons,
        });
      }

      // Record successful login attempt
      await securityService.recordLoginAttempt(
        user.email,
        ipAddress,
        userAgent,
        true,
        user.id
      );

      // Generate JWT tokens
      const tokens = generateTokens(user);

      res.json({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          name: user.name,
          role: user.role,
          kycStatus: user.kycStatus,
          kycTier: user.kycTier,
        },
        security: {
          isNewDevice,
          riskScore: fraudAnalysis.score,
          requiresEmailVerification: false,
          requires2FA: false,
        },
        ...tokens,
      });

    } catch (error) {
      console.error('Login error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid request data", 
          details: error.errors,
          code: "VALIDATION_ERROR" 
        });
      }
      
      res.status(500).json({ 
        error: "Authentication service error", 
        code: "AUTH_SERVICE_ERROR" 
      });
    }
  });

  /**
   * User Registration (backup method)
   */
  app.post("/api/auth/register", authRateLimit, async (req, res) => {
    try {
      const userData = RegisterSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByEmail?.(userData.email);
      if (existingUser) {
        return res.status(409).json({ 
          error: "Email already registered", 
          code: "EMAIL_EXISTS" 
        });
      }

      // Create user
      const user = await storage.createUser(userData);
      
      // Create initial balance record for affiliates
      if (user.role === 'affiliate') {
        await storage.createOrUpdateBalance({
          userId: user.id,
          availableBalance: '0.00',
          pendingBalance: '0.00',
          totalEarnings: '0.00',
        });
      }

      // Generate JWT tokens
      const tokens = generateTokens(user);

      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          name: user.name,
          role: user.role,
          kycStatus: user.kycStatus,
          kycTier: user.kycTier,
        },
        ...tokens,
      });

    } catch (error) {
      console.error('Registration error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid request data", 
          details: error.errors,
          code: "VALIDATION_ERROR" 
        });
      }
      
      res.status(500).json({ 
        error: "Registration service error", 
        code: "REGISTRATION_ERROR" 
      });
    }
  });

  /**
   * Token Refresh
   */
  app.post("/api/auth/refresh", authRateLimit, async (req, res) => {
    try {
      const { refreshToken } = RefreshTokenSchema.parse(req.body);

      // Validate refresh token and extract user ID
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET, {
        issuer: process.env.JWT_ISS,
        audience: process.env.JWT_AUD,
      });

      // Load user from database
      const user = await storage.getUser(decoded.sub);
      if (!user || !user.isActive) {
        return res.status(401).json({ 
          error: "Invalid user", 
          code: "USER_INVALID" 
        });
      }

      // Generate new tokens
      const tokens = generateTokens(user);

      res.json(tokens);

    } catch (error) {
      console.error('Token refresh error:', error);
      
      res.status(401).json({ 
        error: "Invalid refresh token", 
        code: "INVALID_REFRESH_TOKEN" 
      });
    }
  });

  /**
   * Get Current User Profile
   */
  app.get("/api/auth/me", authenticateJWT, async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: "Not authenticated", 
        code: "NOT_AUTHENTICATED" 
      });
    }

    // Get user balance for affiliates
    let balance = null;
    if (req.user.role === 'affiliate') {
      balance = await storage.getUserBalance(req.user.id);
    }

    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        username: req.user.username,
        name: req.user.name,
        role: req.user.role,
        kycStatus: req.user.kycStatus,
        kycTier: req.user.kycTier,
        createdAt: req.user.createdAt,
      },
      balance,
    });
  });

  /**
   * Logout (token revocation would require a blacklist in production)
   */
  app.post("/api/auth/logout", authenticateJWT, async (req, res) => {
    // In a production system, you would add the token to a blacklist
    // or maintain a whitelist of valid tokens per user
    
    res.json({ 
      message: "Logged out successfully",
      code: "LOGOUT_SUCCESS"
    });
  });

  /**
   * Update User Profile
   */
  app.put("/api/auth/profile", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          error: "Not authenticated", 
          code: "NOT_AUTHENTICATED" 
        });
      }

      const updateSchema = z.object({
        name: z.string().min(1).max(100).optional(),
        username: z.string().min(3).max(50).optional(),
      });

      const updates = updateSchema.parse(req.body);
      const updatedUser = await storage.updateUser(req.user.id, updates);

      res.json({
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          username: updatedUser.username,
          name: updatedUser.name,
          role: updatedUser.role,
          kycStatus: updatedUser.kycStatus,
          kycTier: updatedUser.kycTier,
        },
      });

    } catch (error) {
      console.error('Profile update error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid request data", 
          details: error.errors,
          code: "VALIDATION_ERROR" 
        });
      }
      
      res.status(500).json({ 
        error: "Profile update failed", 
        code: "UPDATE_ERROR" 
      });
    }
  });

  /**
   * Password Reset Request
   */
  app.post("/api/auth/password-reset", authRateLimit, async (req, res) => {
    try {
      const schema = z.object({
        email: z.string().email(),
      });

      const { email } = schema.parse(req.body);
      const result = await securityService.initiatePasswordReset(email);

      res.json(result);
    } catch (error) {
      console.error('Password reset error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid request data", 
          details: error.errors,
          code: "VALIDATION_ERROR" 
        });
      }
      
      res.status(500).json({ 
        error: "Password reset service error", 
        code: "RESET_ERROR" 
      });
    }
  });

  /**
   * Password Reset Completion
   */
  app.post("/api/auth/password-reset/complete", authRateLimit, async (req, res) => {
    try {
      const schema = z.object({
        token: z.string(),
        newPassword: z.string().min(8),
      });

      const { token, newPassword } = schema.parse(req.body);
      const result = await securityService.resetPassword(token, newPassword);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Password reset completion error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid request data", 
          details: error.errors,
          code: "VALIDATION_ERROR" 
        });
      }
      
      res.status(500).json({ 
        error: "Password reset service error", 
        code: "RESET_ERROR" 
      });
    }
  });

  /**
   * Send Email Verification
   */
  app.post("/api/auth/verify-email", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          error: "Not authenticated", 
          code: "NOT_AUTHENTICATED" 
        });
      }

      await securityService.sendEmailVerification(req.user.id, req.user.email);

      res.json({
        success: true,
        message: "Verification email sent successfully.",
      });
    } catch (error) {
      console.error('Email verification error:', error);
      
      res.status(500).json({ 
        error: "Email verification service error", 
        code: "EMAIL_VERIFICATION_ERROR" 
      });
    }
  });

  /**
   * Verify Email with Token
   */
  app.get("/api/auth/verify-email/:token", async (req, res) => {
    try {
      const token = req.params.token;
      const result = await securityService.verifyEmail(token);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Email verification completion error:', error);
      
      res.status(500).json({ 
        error: "Email verification service error", 
        code: "EMAIL_VERIFICATION_ERROR" 
      });
    }
  });

  /**
   * Setup Two-Factor Authentication
   */
  app.post("/api/auth/2fa/setup", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          error: "Not authenticated", 
          code: "NOT_AUTHENTICATED" 
        });
      }

      const schema = z.object({
        method: z.enum(['totp', 'sms', 'email']).default('totp'),
        phoneNumber: z.string().optional(),
        email: z.string().email().optional(),
      });

      const { method, phoneNumber, email } = schema.parse(req.body);
      const result = await securityService.setup2FA(req.user.id, method, phoneNumber, email);

      res.json({
        success: true,
        method,
        ...result,
      });
    } catch (error) {
      console.error('2FA setup error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid request data", 
          details: error.errors,
          code: "VALIDATION_ERROR" 
        });
      }
      
      res.status(500).json({ 
        error: "2FA setup service error", 
        code: "2FA_SETUP_ERROR" 
      });
    }
  });

  /**
   * Verify Two-Factor Authentication Code
   */
  app.post("/api/auth/2fa/verify", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          error: "Not authenticated", 
          code: "NOT_AUTHENTICATED" 
        });
      }

      const schema = z.object({
        code: z.string().min(4).max(8),
      });

      const { code } = schema.parse(req.body);
      const isValid = await securityService.verify2FA(req.user.id, code);

      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: "Invalid verification code.",
          code: "INVALID_2FA_CODE",
        });
      }

      res.json({
        success: true,
        message: "2FA verified successfully.",
      });
    } catch (error) {
      console.error('2FA verification error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid request data", 
          details: error.errors,
          code: "VALIDATION_ERROR" 
        });
      }
      
      res.status(500).json({ 
        error: "2FA verification service error", 
        code: "2FA_VERIFICATION_ERROR" 
      });
    }
  });

  /**
   * Disable Two-Factor Authentication
   */
  app.delete("/api/auth/2fa", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          error: "Not authenticated", 
          code: "NOT_AUTHENTICATED" 
        });
      }

      await securityService.disable2FA(req.user.id);

      res.json({
        success: true,
        message: "2FA disabled successfully.",
      });
    } catch (error) {
      console.error('2FA disable error:', error);
      
      res.status(500).json({ 
        error: "2FA disable service error", 
        code: "2FA_DISABLE_ERROR" 
      });
    }
  });

  /**
   * Get Security Overview
   */
  app.get("/api/auth/security", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          error: "Not authenticated", 
          code: "NOT_AUTHENTICATED" 
        });
      }

      const overview = await securityService.getSecurityOverview(req.user.id);
      const notifications = await securityService.getUserSecurityNotifications(req.user.id);

      res.json({
        overview,
        notifications: notifications.slice(0, 10), // Latest 10 notifications
      });
    } catch (error) {
      console.error('Security overview error:', error);
      
      res.status(500).json({ 
        error: "Security overview service error", 
        code: "SECURITY_OVERVIEW_ERROR" 
      });
    }
  });

  /**
   * Get Security Notifications
   */
  app.get("/api/auth/notifications", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          error: "Not authenticated", 
          code: "NOT_AUTHENTICATED" 
        });
      }

      const unreadOnly = req.query.unread === 'true';
      const notifications = await securityService.getUserSecurityNotifications(req.user.id, unreadOnly);

      res.json({
        notifications,
        unreadCount: notifications.filter(n => !n.isRead).length,
      });
    } catch (error) {
      console.error('Security notifications error:', error);
      
      res.status(500).json({ 
        error: "Security notifications service error", 
        code: "SECURITY_NOTIFICATIONS_ERROR" 
      });
    }
  });

  /**
   * Mark Security Notification as Read
   */
  app.put("/api/auth/notifications/:id/read", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          error: "Not authenticated", 
          code: "NOT_AUTHENTICATED" 
        });
      }

      const notificationId = req.params.id;
      await securityService.markNotificationAsRead(notificationId, req.user.id);

      res.json({
        success: true,
        message: "Notification marked as read.",
      });
    } catch (error) {
      console.error('Mark notification read error:', error);
      
      res.status(500).json({ 
        error: "Mark notification service error", 
        code: "MARK_NOTIFICATION_ERROR" 
      });
    }
  });
}

// SSO validation is now handled by the fanzSSOService
