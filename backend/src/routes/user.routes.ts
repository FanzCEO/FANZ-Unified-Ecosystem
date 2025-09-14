import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { 
  authenticate, 
  requireRole,
  requireOwnership,
  rateLimitByUser 
} from '../middleware/auth';
import { metricsMiddleware } from '../middleware/metrics';

const router = Router();

// Apply metrics middleware to all user routes
router.use(metricsMiddleware);

/**
 * @route   GET /api/v1/users/search
 * @desc    Search for users by username, email, or display name
 * @access  Public (but authenticated users get more results)
 * @query   { query, role?, verified?, page?, limit? }
 */
router.get('/search', userController.searchUsers);

/**
 * @route   GET /api/v1/users/profile
 * @desc    Get current user's own profile (authenticated)
 * @access  Private
 */
router.get('/profile', authenticate, userController.getUserProfile);

/**
 * @route   PUT /api/v1/users/profile
 * @desc    Update current user's profile
 * @access  Private
 * @body    { display_name?, bio?, location?, website?, social_links?, privacy_settings?, notification_settings? }
 */
router.put('/profile', 
  authenticate,
  rateLimitByUser(10, 60 * 1000), // 10 updates per minute
  userController.updateProfile
);

/**
 * @route   GET /api/v1/users/:identifier
 * @desc    Get user profile by ID or username (public/private based on settings)
 * @access  Public (some data may be restricted)
 * @params  identifier - User ID (UUID) or username
 */
router.get('/:identifier', userController.getUserProfile);

/**
 * @route   POST /api/v1/users/:userId/follow
 * @desc    Follow a user
 * @access  Private
 * @params  userId - User ID to follow
 */
router.post('/:userId/follow', 
  authenticate,
  rateLimitByUser(20, 60 * 1000), // 20 follows per minute
  userController.followUser
);

/**
 * @route   DELETE /api/v1/users/:userId/follow
 * @desc    Unfollow a user
 * @access  Private  
 * @params  userId - User ID to unfollow
 */
router.delete('/:userId/follow', 
  authenticate,
  rateLimitByUser(20, 60 * 1000), // 20 unfollows per minute
  userController.unfollowUser
);

/**
 * @route   GET /api/v1/users/:userId/followers
 * @desc    Get user's followers list
 * @access  Public (subject to privacy settings)
 * @params  userId - User ID
 * @query   { page?, limit? }
 */
router.get('/:userId/followers', userController.getFollowers);

/**
 * @route   GET /api/v1/users/:userId/following
 * @desc    Get list of users that this user is following
 * @access  Public (subject to privacy settings)
 * @params  userId - User ID
 * @query   { page?, limit? }
 */
router.get('/:userId/following', userController.getFollowing);

/**
 * Creator Profile Management
 */

/**
 * @route   PUT /api/v1/users/creator-profile
 * @desc    Update creator profile (creators only)
 * @access  Private (Creators only)
 * @body    { content_categories?, subscription_price?, tip_minimum?, payout_method?, social_links?, branding?, analytics_enabled? }
 */
router.put('/creator-profile', 
  authenticate,
  requireRole(['creator']),
  rateLimitByUser(5, 60 * 1000), // 5 updates per minute
  userController.updateCreatorProfile
);

/**
 * Admin Routes
 */

/**
 * @route   GET /api/v1/users/admin/all
 * @desc    Get all users (admin/moderator only)
 * @access  Private (Admin/Moderator)
 * @query   { page?, limit?, role?, status? }
 */
router.get('/admin/all', 
  authenticate,
  requireRole(['admin', 'moderator']),
  userController.getAllUsers
);

/**
 * @route   PUT /api/v1/users/admin/:userId/status
 * @desc    Update user account status (admin only)
 * @access  Private (Admin only)
 * @params  userId - User ID to update
 * @body    { status: 'active' | 'suspended' | 'banned', reason: string }
 */
router.put('/admin/:userId/status', 
  authenticate,
  requireRole(['admin']),
  rateLimitByUser(10, 60 * 1000), // 10 status changes per minute
  userController.updateUserStatus
);

/**
 * Verification Routes (for future implementation)
 */

/**
 * @route   POST /api/v1/users/verify-email
 * @desc    Verify email address with token
 * @access  Public
 * @body    { token }
 * TODO: Implement email verification
 */
// router.post('/verify-email', userController.verifyEmail);

/**
 * @route   POST /api/v1/users/resend-verification
 * @desc    Resend email verification
 * @access  Private
 * TODO: Implement email verification resend
 */
// router.post('/resend-verification', 
//   authenticate,
//   rateLimitByUser(3, 60 * 60 * 1000), // 3 attempts per hour
//   userController.resendVerification
// );

/**
 * Creator Verification Routes (for future implementation)
 */

/**
 * @route   POST /api/v1/users/creator-verification
 * @desc    Submit creator verification documents
 * @access  Private (Creators only)
 * @body    { documents: string[] }
 * TODO: Implement creator verification
 */
// router.post('/creator-verification',
//   authenticate,
//   requireRole(['creator']),
//   rateLimitByUser(3, 24 * 60 * 60 * 1000), // 3 submissions per day
//   userController.submitCreatorVerification
// );

/**
 * Two-Factor Authentication Routes (for future implementation)
 */

/**
 * @route   POST /api/v1/users/2fa/enable
 * @desc    Enable two-factor authentication
 * @access  Private
 * TODO: Implement 2FA
 */
// router.post('/2fa/enable', 
//   authenticate,
//   userController.enable2FA
// );

/**
 * @route   POST /api/v1/users/2fa/disable
 * @desc    Disable two-factor authentication
 * @access  Private
 * TODO: Implement 2FA
 */
// router.post('/2fa/disable', 
//   authenticate,
//   userController.disable2FA
// );

/**
 * Privacy & Settings Routes
 */

/**
 * @route   PUT /api/v1/users/privacy-settings
 * @desc    Update privacy settings
 * @access  Private
 * @body    { profile_visibility?, email_visibility?, show_online_status?, allow_direct_messages? }
 */
router.put('/privacy-settings', 
  authenticate,
  rateLimitByUser(5, 60 * 1000), // 5 updates per minute
  userController.updateProfile // Reuses profile update with privacy settings
);

/**
 * @route   PUT /api/v1/users/notification-settings
 * @desc    Update notification preferences
 * @access  Private
 * @body    { email_notifications?, push_notifications?, marketing_emails?, activity_notifications? }
 */
router.put('/notification-settings', 
  authenticate,
  rateLimitByUser(5, 60 * 1000), // 5 updates per minute
  userController.updateProfile // Reuses profile update with notification settings
);

/**
 * Account Management Routes
 */

/**
 * @route   POST /api/v1/users/deactivate-account
 * @desc    Deactivate user account (soft delete)
 * @access  Private
 * @body    { confirmation: 'DEACTIVATE', reason?: string }
 * TODO: Implement account deactivation
 */
// router.post('/deactivate-account',
//   authenticate,
//   rateLimitByUser(1, 24 * 60 * 60 * 1000), // 1 attempt per day
//   userController.deactivateAccount
// );

/**
 * @route   POST /api/v1/users/reactivate-account
 * @desc    Reactivate deactivated account
 * @access  Public
 * @body    { email, password }
 * TODO: Implement account reactivation
 */
// router.post('/reactivate-account',
//   rateLimitByUser(3, 60 * 60 * 1000), // 3 attempts per hour
//   userController.reactivateAccount
// );

/**
 * Data Export Routes (GDPR Compliance - for future implementation)
 */

/**
 * @route   POST /api/v1/users/export-data
 * @desc    Request data export (GDPR compliance)
 * @access  Private
 * TODO: Implement data export
 */
// router.post('/export-data',
//   authenticate,
//   rateLimitByUser(1, 24 * 60 * 60 * 1000), // 1 request per day
//   userController.requestDataExport
// );

/**
 * @route   GET /api/v1/users/export-data/:exportId
 * @desc    Download data export
 * @access  Private
 * TODO: Implement data export download
 */
// router.get('/export-data/:exportId',
//   authenticate,
//   userController.downloadDataExport
// );

export default router;