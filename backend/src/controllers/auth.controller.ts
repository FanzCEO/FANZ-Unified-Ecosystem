import { Request, Response } from 'express';
import { authService, AuthResult } from '../services/auth.service';
import { userRepository, CreateUserInput } from '../models/user.model';
import { Logger } from '../utils/logger';
import { MetricsCollector } from '../middleware/metrics';
import { 
  ValidationError, 
  AuthenticationError, 
  ConflictError,
  NotFoundError 
} from '../middleware/errorHandler';
import { asyncHandler } from '../middleware/errorHandler';
import Joi from 'joi';

const logger = new Logger('AuthController');

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  username: Joi.string().alphanum().min(3).max(30).required().messages({
    'string.alphanum': 'Username must contain only letters and numbers',
    'string.min': 'Username must be at least 3 characters long',
    'string.max': 'Username must be less than 30 characters',
    'any.required': 'Username is required'
  }),
  password: Joi.string().min(8).required().messages({
    'string.min': 'Password must be at least 8 characters long',
    'any.required': 'Password is required'
  }),
  role: Joi.string().valid('fan', 'creator').default('fan').messages({
    'any.only': 'Role must be either fan or creator'
  }),
  profile: Joi.object({
    display_name: Joi.string().min(1).max(100).required().messages({
      'string.min': 'Display name is required',
      'string.max': 'Display name must be less than 100 characters',
      'any.required': 'Display name is required'
    }),
    bio: Joi.string().max(500).optional().messages({
      'string.max': 'Bio must be less than 500 characters'
    }),
    birth_date: Joi.date().max('now').optional().messages({
      'date.max': 'Birth date cannot be in the future'
    }),
    location: Joi.string().max(100).optional(),
    website: Joi.string().uri().optional().messages({
      'string.uri': 'Website must be a valid URL'
    })
  }).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required'
  })
});

const refreshTokenSchema = Joi.object({
  refresh_token: Joi.string().required().messages({
    'any.required': 'Refresh token is required'
  })
});

export class AuthController {
  
  // Register new user
  register = asyncHandler(async (req: Request, res: Response) => {
    try {
      // Validate input
      const { error, value } = registerSchema.validate(req.body);
      if (error) {
        throw new ValidationError(error.details[0].message);
      }

      const { email, username, password, role, profile } = value;

      // Hash password
      const passwordHash = await authService.hashPassword(password);

      // Create user data
      const userData: CreateUserInput = {
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        password_hash: passwordHash,
        role,
        profile
      };

      // Create user
      const user = await userRepository.createUser(userData);

      // Generate tokens
      const tokens = await authService.generateTokenPair(user);

      // Prepare response
      const authResult: AuthResult = {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          profile: user.profile
        },
        tokens,
        isNewUser: true
      };

      // Log successful registration
      logger.info('User registered successfully', {
        userId: user.id,
        email: user.email,
        role: user.role,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Record business metric
      MetricsCollector.recordBusinessEvent('user_registration', role);

      res.status(201).json({
        success: true,
        message: 'Account created successfully',
        data: authResult
      });

    } catch (error) {
      logger.error('Registration failed', {
        error: (error instanceof Error ? error.message : String(error)),
        email: req.body?.email,
        ip: req.ip
      });
      throw error;
    }
  });

  // Login user
  login = asyncHandler(async (req: Request, res: Response) => {
    try {
      // Validate input
      const { error, value } = loginSchema.validate(req.body);
      if (error) {
        throw new ValidationError(error.details[0].message);
      }

      const { email, password } = value;

      // Find user by email
      const user = await userRepository.findByEmail(email);
      if (!user) {
        throw new AuthenticationError('Invalid email or password');
      }

      // Check if user is locked
      const isLocked = await userRepository.isUserLocked(user.id);
      if (isLocked) {
        throw new AuthenticationError('Account is temporarily locked due to multiple failed login attempts');
      }

      // Verify password
      const isValidPassword = await authService.verifyPassword(password, user.password_hash);
      if (!isValidPassword) {
        // Update failed login attempt
        await userRepository.updateLoginAttempt(user.id, false);
        throw new AuthenticationError('Invalid email or password');
      }

      // Update successful login
      await userRepository.updateLoginAttempt(user.id, true);

      // Get user with profile
      const userWithProfile = await userRepository.findByIdWithProfile(user.id);
      if (!userWithProfile) {
        throw new NotFoundError('User profile');
      }

      // Generate tokens
      const tokens = await authService.generateTokenPair(userWithProfile);

      // Prepare response
      const authResult: AuthResult = {
        user: {
          id: userWithProfile.id,
          email: userWithProfile.email,
          username: userWithProfile.username,
          role: userWithProfile.role,
          profile: userWithProfile.profile
        },
        tokens
      };

      // Log successful login
      logger.info('User logged in successfully', {
        userId: user.id,
        email: user.email,
        role: user.role,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Record business metric
      MetricsCollector.recordBusinessEvent('user_login', user.role);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: authResult
      });

    } catch (error) {
      logger.warn('Login failed', {
        error: (error instanceof Error ? error.message : String(error)),
        email: req.body?.email,
        ip: req.ip
      });
      throw error;
    }
  });

  // Refresh access token
  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    try {
      // Validate input
      const { error, value } = refreshTokenSchema.validate(req.body);
      if (error) {
        throw new ValidationError(error.details[0].message);
      }

      const { refresh_token } = value;

      // Refresh tokens
      const newTokens = await authService.refreshAccessToken(refresh_token);

      logger.info('Token refreshed successfully', {
        ip: req.ip
      });

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          tokens: newTokens
        }
      });

    } catch (error) {
      logger.warn('Token refresh failed', {
        error: (error instanceof Error ? error.message : String(error)),
        ip: req.ip
      });
      throw error;
    }
  });

  // Logout user
  logout = asyncHandler(async (req: Request, res: Response) => {
    try {
      const token = req.token;
      const user = req.user;

      if (token) {
        // Blacklist the current token
        await authService.blacklistToken(token);
        
        logger.info('User logged out successfully', {
          userId: user?.userId,
          ip: req.ip
        });
      }

      res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });

    } catch (error) {
      logger.error('Logout failed', {
        error: (error instanceof Error ? error.message : String(error)),
        userId: req.user?.userId,
        ip: req.ip
      });
      throw error;
    }
  });

  // Logout from all devices
  logoutAll = asyncHandler(async (req: Request, res: Response) => {
    try {
      const user = req.user;
      
      if (!user) {
        throw new AuthenticationError('Authentication required');
      }

      // Revoke all user tokens
      await authService.revokeAllUserTokens(user.userId);
      
      logger.info('User logged out from all devices', {
        userId: user.userId,
        ip: req.ip
      });

      res.status(200).json({
        success: true,
        message: 'Logged out from all devices successfully'
      });

    } catch (error) {
      logger.error('Logout all failed', {
        error: (error instanceof Error ? error.message : String(error)),
        userId: req.user?.userId,
        ip: req.ip
      });
      throw error;
    }
  });

  // Get current user profile
  getProfile = asyncHandler(async (req: Request, res: Response) => {
    try {
      const user = req.user;
      
      if (!user) {
        throw new AuthenticationError('Authentication required');
      }

      // Get user with profile
      const userWithProfile = await userRepository.findByIdWithProfile(user.userId);
      if (!userWithProfile) {
        throw new NotFoundError('User profile');
      }

      // Get creator profile if user is a creator
      let creatorProfile = null;
      if (userWithProfile.role === 'creator') {
        creatorProfile = await userRepository.getCreatorProfile(userWithProfile.id);
      }

      // Get user statistics
      const stats = await userRepository.getUserStats(userWithProfile.id);

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: userWithProfile.id,
            email: userWithProfile.email,
            username: userWithProfile.username,
            role: userWithProfile.role,
            profile: userWithProfile.profile,
            creator_profile: creatorProfile,
            statistics: stats
          }
        }
      });

    } catch (error) {
      logger.error('Get profile failed', {
        error: (error instanceof Error ? error.message : String(error)),
        userId: req.user?.userId
      });
      throw error;
    }
  });

  // Get user sessions
  getSessions = asyncHandler(async (req: Request, res: Response) => {
    try {
      const user = req.user;
      
      if (!user) {
        throw new AuthenticationError('Authentication required');
      }

      // Get user sessions
      const sessions = await authService.getUserSessions(user.userId);

      res.status(200).json({
        success: true,
        data: {
          sessions
        }
      });

    } catch (error) {
      logger.error('Get sessions failed', {
        error: (error instanceof Error ? error.message : String(error)),
        userId: req.user?.userId
      });
      throw error;
    }
  });

  // Validate token (for testing/debugging)
  validateToken = asyncHandler(async (req: Request, res: Response) => {
    try {
      const user = req.user;
      
      if (!user) {
        throw new AuthenticationError('Authentication required');
      }

      res.status(200).json({
        success: true,
        message: 'Token is valid',
        data: {
          user: {
            userId: user.userId,
            email: user.email,
            username: user.username,
            role: user.role,
            sessionId: user.sessionId
          },
          issuedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('Token validation failed', {
        error: (error instanceof Error ? error.message : String(error))
      });
      throw error;
    }
  });

  // Change password
  changePassword = asyncHandler(async (req: Request, res: Response) => {
    try {
      const user = req.user;
      
      if (!user) {
        throw new AuthenticationError('Authentication required');
      }

      const { current_password, new_password } = req.body;

      if (!current_password || !new_password) {
        throw new ValidationError('Current password and new password are required');
      }

      // Get user from database
      const dbUser = await userRepository.findByEmail(user.email);
      if (!dbUser) {
        throw new NotFoundError('User');
      }

      // Verify current password
      const isValidPassword = await authService.verifyPassword(current_password, dbUser.password_hash);
      if (!isValidPassword) {
        throw new AuthenticationError('Current password is incorrect');
      }

      // Hash new password
      const newPasswordHash = await authService.hashPassword(new_password);

      // Update password in database
      await userRepository.db.query(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
        [newPasswordHash, user.userId]
      );

      // Revoke all existing tokens (force re-login)
      await authService.revokeAllUserTokens(user.userId);

      logger.info('Password changed successfully', {
        userId: user.userId,
        ip: req.ip
      });

      res.status(200).json({
        success: true,
        message: 'Password changed successfully. Please login again with your new password.'
      });

    } catch (error) {
      logger.error('Change password failed', {
        error: (error instanceof Error ? error.message : String(error)),
        userId: req.user?.userId
      });
      throw error;
    }
  });

  // Request password reset (placeholder)
  requestPasswordReset = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        throw new ValidationError('Email is required');
      }

      // Always return success to prevent email enumeration
      // In a real implementation, send reset email if user exists
      logger.info('Password reset requested', { 
        email,
        ip: req.ip 
      });

      res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });

    } catch (error) {
      logger.error('Password reset request failed', {
        error: (error instanceof Error ? error.message : String(error)),
        ip: req.ip
      });
      throw error;
    }
  });
}

// Export singleton instance
export const authController = new AuthController();
export default AuthController;