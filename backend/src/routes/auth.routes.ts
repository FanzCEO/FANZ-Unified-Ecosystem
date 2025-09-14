import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { 
  authenticate, 
  optionalAuth, 
  rateLimitByUser 
} from '../middleware/auth';
import { metricsMiddleware } from '../middleware/metrics';

const router = Router();

// Apply metrics middleware to all auth routes
router.use(metricsMiddleware);

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user account
 * @access  Public
 * @body    { email, username, password, role, profile }
 */
router.post('/register', authController.register);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user and return JWT tokens
 * @access  Public
 * @body    { email, password }
 */
router.post('/login', authController.login);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 * @body    { refresh_token }
 */
router.post('/refresh', authController.refreshToken);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout current session (blacklist current token)
 * @access  Private
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @route   POST /api/v1/auth/logout-all
 * @desc    Logout from all devices (revoke all tokens)
 * @access  Private
 */
router.post('/logout-all', authenticate, authController.logoutAll);

/**
 * @route   GET /api/v1/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticate, authController.getProfile);

/**
 * @route   GET /api/v1/auth/sessions
 * @desc    Get all user sessions
 * @access  Private
 */
router.get('/sessions', authenticate, authController.getSessions);

/**
 * @route   GET /api/v1/auth/validate
 * @desc    Validate current token (for debugging/testing)
 * @access  Private
 */
router.get('/validate', authenticate, authController.validateToken);

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Change user password
 * @access  Private
 * @body    { current_password, new_password }
 */
router.post('/change-password', 
  authenticate,
  rateLimitByUser(5, 15 * 60 * 1000), // 5 attempts per 15 minutes
  authController.changePassword
);

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Request password reset email
 * @access  Public
 * @body    { email }
 */
router.post('/reset-password', 
  rateLimitByUser(3, 60 * 60 * 1000), // 3 attempts per hour
  authController.requestPasswordReset
);

export default router;