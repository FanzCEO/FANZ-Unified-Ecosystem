import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { 
  authenticate, 
  _optionalAuth, 
  _rateLimitByUser 
} from '../middleware/auth';
import { metricsMiddleware } from '../middleware/metrics';
import { 
  authRateLimit,
  securityValidation,
  progressiveSlowdown
} from '../middleware/enhancedSecurity';
import { secureRandomMiddleware } from '../middleware/secureRandom';

const router = Router();

// Apply security middleware to all auth routes
router.use(metricsMiddleware);
router.use(secureRandomMiddleware);
router.use(securityValidation);
router.use(progressiveSlowdown);

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user account
 * @access  Public
 * @body    { email, username, password, role, profile }
 */
router.post('/register', authRateLimit, authController.register);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user and return JWT tokens
 * @access  Public
 * @body    { email, password }
 */
router.post('/login', authRateLimit, authController.login);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 * @body    { refresh_token }
 */
router.post('/refresh', authRateLimit, authController.refreshToken);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout current session (blacklist current token)
 * @access  Private
 */
router.post('/logout', authRateLimit, authenticate, authController.logout);

/**
 * @route   POST /api/v1/auth/logout-all
 * @desc    Logout from all devices (revoke all tokens)
 * @access  Private
 */
router.post('/logout-all', authRateLimit, authenticate, authController.logoutAll);

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
  authRateLimit,
  authenticate,
  authController.changePassword
);

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Request password reset email
 * @access  Public
 * @body    { email }
 */
router.post('/reset-password',
  authRateLimit,
  authController.requestPasswordReset
);

/**
 * @route   POST /api/v1/auth/reset-password/confirm
 * @desc    Reset password with token
 * @access  Public
 * @body    { token, new_password }
 */
router.post('/reset-password/confirm',
  authRateLimit,
  authController.resetPassword
);

/**
 * @route   POST /api/v1/auth/verify-email
 * @desc    Verify email address with token
 * @access  Public
 * @body    { token }
 */
router.post('/verify-email',
  authRateLimit,
  authController.verifyEmail
);

/**
 * @route   POST /api/v1/auth/resend-verification
 * @desc    Resend email verification
 * @access  Private
 */
router.post('/resend-verification',
  authRateLimit,
  authenticate,
  authController.resendVerification
);

export default router;