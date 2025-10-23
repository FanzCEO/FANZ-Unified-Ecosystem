import { Router, Request, Response } from 'express';
import { AuthService, AuthRequest, LoginCredentials, RegistrationData } from '../services/AuthService';
import { OIDCService } from '../services/OIDCService';
import { logger } from '../utils/logger';

export function createAuthRoutes(authService: AuthService, oidcService: OIDCService): Router {
  const router = Router();

  /**
   * POST /auth/register
   * Register a new user
   */
  router.post('/register', authService.getRegisterRateLimit(), async (req: Request, res: Response) => {
    try {
      const registrationData: RegistrationData = {
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
        displayName: req.body.displayName,
        primaryCluster: req.body.primaryCluster || 'fanzlab',
        isCreator: req.body.isCreator || false,
        acceptedTerms: req.body.acceptedTerms || false,
      };

      const result = await authService.register(registrationData);

      if (!result.success) {
        return res.status(400).json({
          error: result.error,
          success: false,
        });
      }

      // Don't send password hash in response
      const userResponse = { ...result.user };
      delete userResponse.password_hash;

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: userResponse,
        tokens: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresIn: result.expiresIn,
        },
      });
    } catch (error) {
      logger.error('Registration endpoint error:', error);
      res.status(500).json({
        error: 'Internal server error',
        success: false,
      });
    }
  });

  /**
   * POST /auth/login
   * Authenticate user login
   */
  router.post('/login', authService.getLoginRateLimit(), async (req: Request, res: Response) => {
    try {
      const credentials: LoginCredentials = {
        email: req.body.email,
        password: req.body.password,
        cluster: req.body.cluster,
        rememberMe: req.body.rememberMe || false,
      };

      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');

      const result = await authService.login(credentials, ipAddress, userAgent);

      if (!result.success) {
        return res.status(401).json({
          error: result.error,
          success: false,
        });
      }

      // Don't send password hash in response
      const userResponse = { ...result.user };
      delete userResponse.password_hash;

      res.json({
        success: true,
        message: 'Login successful',
        user: userResponse,
        tokens: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresIn: result.expiresIn,
        },
      });
    } catch (error) {
      logger.error('Login endpoint error:', error);
      res.status(500).json({
        error: 'Internal server error',
        success: false,
      });
    }
  });

  /**
   * POST /auth/logout
   * Logout user and invalidate session
   */
  router.post('/logout', authService.authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (token) {
        await authService.logout(token);
      }

      res.json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      logger.error('Logout endpoint error:', error);
      res.status(500).json({
        error: 'Internal server error',
        success: false,
      });
    }
  });

  /**
   * POST /auth/refresh
   * Refresh access token
   */
  router.post('/refresh', async (req: Request, res: Response) => {
    try {
      const refreshToken = req.body.refreshToken;

      if (!refreshToken) {
        return res.status(400).json({
          error: 'Refresh token is required',
          success: false,
        });
      }

      const result = await authService.refreshToken(refreshToken);

      if (!result.success) {
        return res.status(401).json({
          error: result.error,
          success: false,
        });
      }

      // Don't send password hash in response
      const userResponse = { ...result.user };
      delete userResponse.password_hash;

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        user: userResponse,
        tokens: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresIn: result.expiresIn,
        },
      });
    } catch (error) {
      logger.error('Token refresh endpoint error:', error);
      res.status(500).json({
        error: 'Internal server error',
        success: false,
      });
    }
  });

  /**
   * GET /auth/me
   * Get current user profile
   */
  router.get('/me', authService.authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'User not authenticated',
          success: false,
        });
      }

      // Don't send password hash in response
      const userResponse = { ...req.user };
      delete userResponse.password_hash;

      res.json({
        success: true,
        user: userResponse,
      });
    } catch (error) {
      logger.error('Get user profile endpoint error:', error);
      res.status(500).json({
        error: 'Internal server error',
        success: false,
      });
    }
  });

  /**
   * POST /auth/forgot-password
   * Request password reset
   */
  router.post('/forgot-password', async (req: Request, res: Response) => {
    try {
      const email = req.body.email;

      if (!email) {
        return res.status(400).json({
          error: 'Email is required',
          success: false,
        });
      }

      const result = await authService.createPasswordResetToken(email);

      if (!result.success) {
        return res.status(400).json({
          error: result.error,
          success: false,
        });
      }

      res.json({
        success: true,
        message: 'Password reset instructions sent to your email',
      });
    } catch (error) {
      logger.error('Forgot password endpoint error:', error);
      res.status(500).json({
        error: 'Internal server error',
        success: false,
      });
    }
  });

  /**
   * GET /auth/verify
   * Verify token validity
   */
  router.get('/verify', async (req: Request, res: Response) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        return res.status(400).json({
          error: 'Token is required',
          success: false,
        });
      }

      const verification = await authService.verifyToken(token);

      if (!verification.valid) {
        return res.status(401).json({
          error: 'Invalid or expired token',
          success: false,
          valid: false,
        });
      }

      // Don't send password hash in response
      const userResponse = { ...verification.user };
      delete userResponse.password_hash;

      res.json({
        success: true,
        valid: true,
        user: userResponse,
        payload: verification.payload,
      });
    } catch (error) {
      logger.error('Token verification endpoint error:', error);
      res.status(500).json({
        error: 'Internal server error',
        success: false,
        valid: false,
      });
    }
  });

  /**
   * POST /auth/validate-session
   * Validate session for SSO
   */
  router.post('/validate-session', async (req: Request, res: Response) => {
    try {
      const sessionToken = req.body.sessionToken || req.cookies.sessionToken;

      if (!sessionToken) {
        return res.status(400).json({
          error: 'Session token is required',
          success: false,
        });
      }

      const verification = await authService.verifyToken(sessionToken);

      if (!verification.valid) {
        return res.status(401).json({
          error: 'Invalid or expired session',
          success: false,
          valid: false,
        });
      }

      res.json({
        success: true,
        valid: true,
        user: {
          id: verification.user.id,
          username: verification.user.username,
          email: verification.user.email,
          cluster: verification.user.primary_cluster,
          isCreator: verification.user.is_creator,
          isVerified: verification.user.is_verified,
        },
      });
    } catch (error) {
      logger.error('Session validation endpoint error:', error);
      res.status(500).json({
        error: 'Internal server error',
        success: false,
        valid: false,
      });
    }
  });

  /**
   * GET /auth/health
   * Health check for auth service
   */
  router.get('/health', async (req: Request, res: Response) => {
    try {
      const authHealth = await authService.healthCheck();
      const oidcHealth = await oidcService.healthCheck();

      res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date(),
        services: {
          auth: authHealth,
          oidc: oidcHealth,
        },
      });
    } catch (error) {
      logger.error('Auth health check error:', error);
      res.status(503).json({
        success: false,
        status: 'unhealthy',
        error: 'Service health check failed',
        timestamp: new Date(),
      });
    }
  });

  return router;
}