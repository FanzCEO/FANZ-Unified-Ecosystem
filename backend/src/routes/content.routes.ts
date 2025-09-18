import { Router } from 'express';
import { contentController } from '../controllers/content.controller';
import { 
  authenticate, 
  optionalAuth,
  requireRole,
  rateLimitByUser 
} from '../middleware/auth';
import { metricsMiddleware } from '../middleware/metrics';
import {
  contentRateLimit,
  userInteractionRateLimit,
  securityValidation,
  progressiveSlowdown
} from '../middleware/enhancedSecurity';
import { secureRandomMiddleware } from '../middleware/secureRandom';

const router = Router();

// Apply security middleware to all content routes
router.use(metricsMiddleware);
router.use(secureRandomMiddleware);
router.use(securityValidation);
router.use(progressiveSlowdown);

/**
 * =====================================================
 * Public Content Discovery Routes
 * =====================================================
 */

/**
 * @route   GET /api/v1/content/feed
 * @desc    Get personalized content feed
 * @access  Public (but better with authentication)
 * @query   { algorithm?, content_types?, categories?, following_only?, premium_only?, hide_seen?, page?, limit? }
 */
router.get('/feed', optionalAuth, contentController.getFeed);

/**
 * @route   GET /api/v1/content/trending
 * @desc    Get trending posts
 * @access  Public
 * @query   { page?, limit? }
 */
router.get('/trending', contentController.getTrending);

/**
 * @route   GET /api/v1/content/popular-creators
 * @desc    Get popular creators
 * @access  Public
 * @query   { page?, limit? }
 */
router.get('/popular-creators', contentController.getPopularCreators);

/**
 * @route   GET /api/v1/content/categories
 * @desc    Get all content categories
 * @access  Public
 */
router.get('/categories', contentController.getCategories);

/**
 * @route   GET /api/v1/content/search
 * @desc    Search content by title, description, tags
 * @access  Public
 * @query   { q, content_type?, category?, page?, limit? }
 */
router.get('/search', userInteractionRateLimit, contentController.searchContent);

/**
 * =====================================================
 * Content CRUD Routes
 * =====================================================
 */

/**
 * @route   POST /api/v1/content/posts
 * @desc    Create new content post
 * @access  Private
 * @body    { title?, description?, content_type, content_text?, category_id?, tags?, visibility?, age_restriction?, is_premium?, price?, tip_enabled?, allows_comments?, allows_likes?, allows_sharing?, scheduled_for?, media_urls? }
 */
router.post('/posts', 
  contentRateLimit,
  authenticate,
  contentController.createPost
);

/**
 * @route   GET /api/v1/content/posts/:postId
 * @desc    Get single post by ID
 * @access  Public (subject to privacy settings)
 * @params  postId - Post UUID
 */
router.get('/posts/:postId', optionalAuth, contentController.getPost);

/**
 * @route   PUT /api/v1/content/posts/:postId
 * @desc    Update existing post (creator only)
 * @access  Private (Creator only)
 * @params  postId - Post UUID
 * @body    { title?, description?, content_text?, category_id?, tags?, visibility?, age_restriction?, is_premium?, price?, tip_enabled?, allows_comments?, allows_likes?, allows_sharing?, scheduled_for? }
 */
router.put('/posts/:postId', 
  contentRateLimit,
  authenticate,
  contentController.updatePost
);

/**
 * @route   DELETE /api/v1/content/posts/:postId
 * @desc    Delete post (creator only)
 * @access  Private (Creator only)
 * @params  postId - Post UUID
 */
router.delete('/posts/:postId', 
  contentRateLimit,
  authenticate,
  contentController.deletePost
);

/**
 * =====================================================
 * Content Interactions Routes
 * =====================================================
 */

/**
 * @route   POST /api/v1/content/posts/:postId/like
 * @desc    Like a post
 * @access  Private
 * @params  postId - Post UUID
 */
router.post('/posts/:postId/like', 
  userInteractionRateLimit,
  authenticate,
  contentController.likePost
);

/**
 * @route   DELETE /api/v1/content/posts/:postId/like
 * @desc    Unlike a post
 * @access  Private
 * @params  postId - Post UUID
 */
router.delete('/posts/:postId/like', 
  userInteractionRateLimit,
  authenticate,
  contentController.unlikePost
);

/**
 * @route   POST /api/v1/content/posts/:postId/share
 * @desc    Share a post
 * @access  Private
 * @params  postId - Post UUID
 */
router.post('/posts/:postId/share', 
  userInteractionRateLimit,
  authenticate,
  contentController.sharePost
);

/**
 * =====================================================
 * Comments Routes
 * =====================================================
 */

/**
 * @route   GET /api/v1/content/posts/:postId/comments
 * @desc    Get comments for a post
 * @access  Public (subject to post privacy)
 * @params  postId - Post UUID
 * @query   { page?, limit?, sort? }
 */
router.get('/posts/:postId/comments', 
  optionalAuth,
  contentController.getComments
);

/**
 * @route   POST /api/v1/content/posts/:postId/comments
 * @desc    Add comment to a post
 * @access  Private
 * @params  postId - Post UUID
 * @body    { comment_text, parent_comment_id? }
 */
router.post('/posts/:postId/comments', 
  contentRateLimit,
  authenticate,
  contentController.addComment
);

/**
 * =====================================================
 * Creator Management Routes
 * =====================================================
 */

/**
 * @route   GET /api/v1/content/my-posts
 * @desc    Get current user's posts
 * @access  Private
 * @query   { page?, limit?, status? }
 */
router.get('/my-posts', 
  authenticate,
  contentController.getCreatorPosts
);

/**
 * @route   GET /api/v1/content/posts/:postId/analytics
 * @desc    Get post analytics (creator only)
 * @access  Private (Creator only)
 * @params  postId - Post UUID
 */
router.get('/posts/:postId/analytics', 
  authenticate,
  rateLimitByUser(60, 60 * 1000), // 60 analytics requests per minute
  contentController.getPostAnalytics
);

/**
 * =====================================================
 * Advanced Content Routes (Future Implementation)
 * =====================================================
 */

/**
 * @route   POST /api/v1/content/posts/:postId/bookmark
 * @desc    Bookmark a post
 * @access  Private
 * @params  postId - Post UUID
 * TODO: Implement bookmark functionality
 */
// router.post('/posts/:postId/bookmark', 
//   authenticate,
//   rateLimitByUser(100, 60 * 1000),
//   contentController.bookmarkPost
// );

/**
 * @route   DELETE /api/v1/content/posts/:postId/bookmark
 * @desc    Remove bookmark from a post
 * @access  Private
 * @params  postId - Post UUID
 * TODO: Implement unbookmark functionality
 */
// router.delete('/posts/:postId/bookmark', 
//   authenticate,
//   rateLimitByUser(100, 60 * 1000),
//   contentController.unbookmarkPost
// );

/**
 * @route   GET /api/v1/content/bookmarks
 * @desc    Get user's bookmarked posts
 * @access  Private
 * @query   { page?, limit? }
 * TODO: Implement get bookmarks
 */
// router.get('/bookmarks', 
//   authenticate,
//   contentController.getBookmarks
// );

/**
 * @route   POST /api/v1/content/posts/:postId/report
 * @desc    Report inappropriate content
 * @access  Private
 * @params  postId - Post UUID
 * @body    { reason, description? }
 * TODO: Implement content reporting
 */
// router.post('/posts/:postId/report', 
//   authenticate,
//   rateLimitByUser(10, 60 * 60 * 1000), // 10 reports per hour
//   contentController.reportPost
// );

/**
 * @route   GET /api/v1/content/collections
 * @desc    Get user's content collections/playlists
 * @access  Private
 * @query   { page?, limit? }
 * TODO: Implement collections
 */
// router.get('/collections', 
//   authenticate,
//   contentController.getCollections
// );

/**
 * @route   POST /api/v1/content/collections
 * @desc    Create content collection/playlist
 * @access  Private
 * @body    { title, description?, cover_image_url?, visibility?, is_premium?, price? }
 * TODO: Implement collection creation
 */
// router.post('/collections', 
//   authenticate,
//   rateLimitByUser(10, 60 * 60 * 1000), // 10 collections per hour
//   contentController.createCollection
// );

/**
 * @route   POST /api/v1/content/collections/:collectionId/posts/:postId
 * @desc    Add post to collection
 * @access  Private
 * @params  collectionId - Collection UUID, postId - Post UUID
 * TODO: Implement add to collection
 */
// router.post('/collections/:collectionId/posts/:postId', 
//   authenticate,
//   contentController.addToCollection
// );

/**
 * Live Streaming Routes (Future Implementation)
 */

/**
 * @route   POST /api/v1/content/live/start
 * @desc    Start live stream
 * @access  Private (Creators only)
 * @body    { title, description?, category_id?, tags?, visibility? }
 * TODO: Implement live streaming
 */
// router.post('/live/start', 
//   authenticate,
//   requireRole(['creator']),
//   rateLimitByUser(5, 60 * 60 * 1000), // 5 streams per hour
//   contentController.startLiveStream
// );

/**
 * @route   POST /api/v1/content/live/:streamId/end
 * @desc    End live stream
 * @access  Private (Creator only)
 * @params  streamId - Stream UUID
 * TODO: Implement stream ending
 */
// router.post('/live/:streamId/end', 
//   authenticate,
//   contentController.endLiveStream
// );

/**
 * @route   GET /api/v1/content/live/active
 * @desc    Get currently active live streams
 * @access  Public
 * @query   { page?, limit? }
 * TODO: Implement active streams listing
 */
// router.get('/live/active', 
//   optionalAuth,
//   contentController.getActiveLiveStreams
// );

/**
 * Moderation Routes (Admin/Moderator only)
 */

/**
 * @route   GET /api/v1/content/admin/reported
 * @desc    Get reported content for moderation
 * @access  Private (Admin/Moderator only)
 * @query   { page?, limit?, status? }
 * TODO: Implement moderation dashboard
 */
// router.get('/admin/reported', 
//   authenticate,
//   requireRole(['admin', 'moderator']),
//   contentController.getReportedContent
// );

/**
 * @route   PUT /api/v1/content/admin/posts/:postId/moderate
 * @desc    Moderate content (approve/reject/remove)
 * @access  Private (Admin/Moderator only)
 * @params  postId - Post UUID
 * @body    { action: 'approve' | 'reject' | 'remove', reason? }
 * TODO: Implement content moderation actions
 */
// router.put('/admin/posts/:postId/moderate', 
//   authenticate,
//   requireRole(['admin', 'moderator']),
//   rateLimitByUser(100, 60 * 1000),
//   contentController.moderatePost
// );

/**
 * Analytics Routes (Creator/Admin)
 */

/**
 * @route   GET /api/v1/content/analytics/overview
 * @desc    Get content analytics overview for creator
 * @access  Private (Creator only)
 * @query   { period?, content_type? }
 * TODO: Implement analytics overview
 */
// router.get('/analytics/overview', 
//   authenticate,
//   requireRole(['creator', 'admin']),
//   contentController.getAnalyticsOverview
// );

/**
 * @route   GET /api/v1/content/analytics/trending-tags
 * @desc    Get trending content tags
 * @access  Private (Creator/Admin)
 * @query   { period?, limit? }
 * TODO: Implement trending tags analytics
 */
// router.get('/analytics/trending-tags', 
//   authenticate,
//   requireRole(['creator', 'admin']),
//   contentController.getTrendingTags
// );

export default router;