import { Request, Response } from 'express';
import { contentRepository, CreatePostInput, FeedOptions } from '../models/content.model';
import { Logger } from '../utils/logger';
import { MetricsCollector } from '../middleware/metrics';
import { 
  ValidationError, 
  AuthenticationError, 
  NotFoundError,
  ForbiddenError,
  ConflictError 
} from '../middleware/errorHandler';
import { asyncHandler } from '../middleware/errorHandler';
import Joi from 'joi';

const logger = new Logger('ContentController');

// Validation schemas
const createPostSchema = Joi.object({
  title: Joi.string().min(1).max(500).optional().allow(''),
  description: Joi.string().max(2000).optional().allow(''),
  content_type: Joi.string().valid(
    'post', 'image', 'video', 'audio', 'live_stream', 'story', 'poll', 'article'
  ).required(),
  content_text: Joi.string().max(10000).optional().allow(''),
  category_id: Joi.string().uuid().optional(),
  tags: Joi.array().items(Joi.string().max(50)).max(20).optional(),
  visibility: Joi.string().valid('public', 'followers_only', 'subscribers_only', 'premium', 'private').default('public'),
  age_restriction: Joi.string().valid('all', '13+', '16+', '18+').default('all'),
  is_premium: Joi.boolean().default(false),
  price: Joi.number().min(0).max(999.99).default(0),
  tip_enabled: Joi.boolean().default(true),
  allows_comments: Joi.boolean().default(true),
  allows_likes: Joi.boolean().default(true),
  allows_sharing: Joi.boolean().default(true),
  scheduled_for: Joi.date().min('now').optional(),
  media_urls: Joi.array().items(Joi.string().uri()).max(10).optional()
});

const updatePostSchema = Joi.object({
  title: Joi.string().min(1).max(500).optional().allow(''),
  description: Joi.string().max(2000).optional().allow(''),
  content_text: Joi.string().max(10000).optional().allow(''),
  category_id: Joi.string().uuid().optional().allow(null),
  tags: Joi.array().items(Joi.string().max(50)).max(20).optional(),
  visibility: Joi.string().valid('public', 'followers_only', 'subscribers_only', 'premium', 'private').optional(),
  age_restriction: Joi.string().valid('all', '13+', '16+', '18+').optional(),
  is_premium: Joi.boolean().optional(),
  price: Joi.number().min(0).max(999.99).optional(),
  tip_enabled: Joi.boolean().optional(),
  allows_comments: Joi.boolean().optional(),
  allows_likes: Joi.boolean().optional(),
  allows_sharing: Joi.boolean().optional(),
  scheduled_for: Joi.date().min('now').optional().allow(null)
});

const feedQuerySchema = Joi.object({
  algorithm: Joi.string().valid('chronological', 'engagement', 'personalized', 'balanced').default('balanced'),
  content_types: Joi.string().optional(), // Will be split by comma
  categories: Joi.string().optional(), // Will be split by comma
  following_only: Joi.boolean().default(false),
  premium_only: Joi.boolean().default(false),
  hide_seen: Joi.boolean().default(false),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20)
});

const addCommentSchema = Joi.object({
  comment_text: Joi.string().min(1).max(2000).required(),
  parent_comment_id: Joi.string().uuid().optional()
});

export class ContentController {

  // =====================================================
  // Content Creation & Management
  // =====================================================

  // Create new post
  createPost = asyncHandler(async (req: Request, res: Response) => {
    try {
      const user = req.user;
      
      if (!user) {
        throw new AuthenticationError('Authentication required');
      }

      // Validate input
      const { error, value } = createPostSchema.validate(req.body);
      if (error) {
        throw new ValidationError(error.details[0].message);
      }

      // Check if user can create this type of content
      if (value.content_type === 'live_stream' && user.role !== 'creator') {
        throw new ForbiddenError('Only creators can create live streams');
      }

      if (value.is_premium && user.role !== 'creator') {
        throw new ForbiddenError('Only creators can create premium content');
      }

      // Create post
      const post = await contentRepository.createPost(user.userId, value as CreatePostInput);

      logger.info('Post created successfully', {
        postId: post.id,
        creatorId: user.userId,
        contentType: post.content_type,
        visibility: post.visibility
      });

      // Record business metric
      MetricsCollector.recordBusinessEvent('content_created', post.content_type);

      res.status(201).json({
        success: true,
        message: 'Post created successfully',
        data: { post }
      });

    } catch (error) {
      logger.error('Create post failed', {
        error: (error instanceof Error ? error.message : String(error)),
        userId: req.user?.userId
      });
      throw error;
    }
  });

  // Update post
  updatePost = asyncHandler(async (req: Request, res: Response) => {
    try {
      const user = req.user;
      const { postId } = req.params;
      
      if (!user) {
        throw new AuthenticationError('Authentication required');
      }

      // Validate input
      const { error, value } = updatePostSchema.validate(req.body);
      if (error) {
        throw new ValidationError(error.details[0].message);
      }

      // Update post
      const post = await contentRepository.updatePost(postId, user.userId, value);

      if (!post) {
        throw new NotFoundError('Post not found');
      }

      logger.info('Post updated successfully', {
        postId,
        userId: user.userId,
        updatedFields: Object.keys(value)
      });

      res.status(200).json({
        success: true,
        message: 'Post updated successfully',
        data: { post }
      });

    } catch (error) {
      logger.error('Update post failed', {
        error: (error instanceof Error ? error.message : String(error)),
        postId: req.params.postId,
        userId: req.user?.userId
      });
      throw error;
    }
  });

  // Delete post
  deletePost = asyncHandler(async (req: Request, res: Response) => {
    try {
      const user = req.user;
      const { postId } = req.params;
      
      if (!user) {
        throw new AuthenticationError('Authentication required');
      }

      // Delete post
      const deleted = await contentRepository.deletePost(postId, user.userId);

      if (!deleted) {
        throw new NotFoundError('Post not found or access denied');
      }

      logger.info('Post deleted successfully', {
        postId,
        userId: user.userId
      });

      res.status(200).json({
        success: true,
        message: 'Post deleted successfully'
      });

    } catch (error) {
      logger.error('Delete post failed', {
        error: (error instanceof Error ? error.message : String(error)),
        postId: req.params.postId,
        userId: req.user?.userId
      });
      throw error;
    }
  });

  // =====================================================
  // Content Retrieval
  // =====================================================

  // Get single post
  getPost = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { postId } = req.params;
      const viewerId = req.user?.userId;

      const post = await contentRepository.getPostById(postId, viewerId);

      if (!post) {
        throw new NotFoundError('Post not found');
      }

      if (!post.can_view) {
        throw new ForbiddenError('Access denied to this post');
      }

      // Record view if user is logged in
      if (viewerId && viewerId !== post.creator_id) {
        await contentRepository.addInteraction(postId, viewerId, 'view', {
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      }

      res.status(200).json({
        success: true,
        data: { post }
      });

    } catch (error) {
      logger.error('Get post failed', {
        error: (error instanceof Error ? error.message : String(error)),
        postId: req.params.postId
      });
      throw error;
    }
  });

  // Get feed
  getFeed = asyncHandler(async (req: Request, res: Response) => {
    try {
      // Validate query parameters
      const { error, value } = feedQuerySchema.validate(req.query);
      if (error) {
        throw new ValidationError(error.details[0].message);
      }

      const userId = req.user?.userId;
      const { page, limit, algorithm, following_only, premium_only, hide_seen } = value;
      const offset = (page - 1) * limit;

      // Parse comma-separated arrays
      const content_types = value.content_types ? value.content_types.split(',').map((t: string) => t.trim()) : [];
      const categories = value.categories ? value.categories.split(',').map((c: string) => c.trim()) : [];

      const feedOptions: FeedOptions = {
        user_id: userId,
        algorithm,
        content_types,
        categories,
        following_only,
        premium_only,
        hide_seen,
        limit,
        offset
      };

      const feedResult = await contentRepository.getFeed(feedOptions);

      res.status(200).json({
        success: true,
        data: {
          posts: feedResult.posts,
          pagination: {
            page,
            limit,
            total: feedResult.total,
            totalPages: Math.ceil(feedResult.total / limit),
            hasMore: feedResult.hasMore
          }
        }
      });

    } catch (error) {
      logger.error('Get feed failed', {
        error: (error instanceof Error ? error.message : String(error)),
        query: req.query
      });
      throw error;
    }
  });

  // Get trending posts
  getTrending = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      // Use trending view from database
      const query = `
        SELECT * FROM trending_posts
        WHERE published_at >= NOW() - INTERVAL '24 hours'
        LIMIT $1 OFFSET $2
      `;

      const result = await contentRepository.db.query(query, [limit, offset]);
      const posts = result.rows;

      res.status(200).json({
        success: true,
        data: {
          posts,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            hasMore: posts.length === Number(limit)
          }
        }
      });

    } catch (error) {
      logger.error('Get trending failed', {
        error: (error instanceof Error ? error.message : String(error)),
        query: req.query
      });
      throw error;
    }
  });

  // =====================================================
  // Content Interactions
  // =====================================================

  // Like post
  likePost = asyncHandler(async (req: Request, res: Response) => {
    try {
      const user = req.user;
      const { postId } = req.params;
      
      if (!user) {
        throw new AuthenticationError('Authentication required');
      }

      // Check if post exists and user can view it
      const post = await contentRepository.getPostById(postId, user.userId);
      if (!post) {
        throw new NotFoundError('Post not found');
      }

      if (!post.can_view || !post.allows_likes) {
        throw new ForbiddenError('Cannot like this post');
      }

      // Add like interaction
      await contentRepository.addInteraction(postId, user.userId, 'like', {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      logger.info('Post liked successfully', {
        postId,
        userId: user.userId
      });

      // Record business metric
      MetricsCollector.recordBusinessEvent('content_liked', post.content_type);

      res.status(200).json({
        success: true,
        message: 'Post liked successfully'
      });

    } catch (error) {
      logger.error('Like post failed', {
        error: (error instanceof Error ? error.message : String(error)),
        postId: req.params.postId,
        userId: req.user?.userId
      });
      throw error;
    }
  });

  // Unlike post
  unlikePost = asyncHandler(async (req: Request, res: Response) => {
    try {
      const user = req.user;
      const { postId } = req.params;
      
      if (!user) {
        throw new AuthenticationError('Authentication required');
      }

      // Remove like interaction
      const removed = await contentRepository.removeInteraction(postId, user.userId, 'like');

      if (!removed) {
        throw new ConflictError('Post was not liked');
      }

      logger.info('Post unliked successfully', {
        postId,
        userId: user.userId
      });

      res.status(200).json({
        success: true,
        message: 'Post unliked successfully'
      });

    } catch (error) {
      logger.error('Unlike post failed', {
        error: (error instanceof Error ? error.message : String(error)),
        postId: req.params.postId,
        userId: req.user?.userId
      });
      throw error;
    }
  });

  // Share post
  sharePost = asyncHandler(async (req: Request, res: Response) => {
    try {
      const user = req.user;
      const { postId } = req.params;
      
      if (!user) {
        throw new AuthenticationError('Authentication required');
      }

      // Check if post exists and user can view it
      const post = await contentRepository.getPostById(postId, user.userId);
      if (!post) {
        throw new NotFoundError('Post not found');
      }

      if (!post.can_view || !post.allows_sharing) {
        throw new ForbiddenError('Cannot share this post');
      }

      // Add share interaction
      await contentRepository.addInteraction(postId, user.userId, 'share', {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      logger.info('Post shared successfully', {
        postId,
        userId: user.userId
      });

      // Record business metric
      MetricsCollector.recordBusinessEvent('content_shared', post.content_type);

      res.status(200).json({
        success: true,
        message: 'Post shared successfully'
      });

    } catch (error) {
      logger.error('Share post failed', {
        error: (error instanceof Error ? error.message : String(error)),
        postId: req.params.postId,
        userId: req.user?.userId
      });
      throw error;
    }
  });

  // =====================================================
  // Comments
  // =====================================================

  // Get post comments
  getComments = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { postId } = req.params;
      const { page = 1, limit = 20, sort = 'newest' } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      // Check if post exists and allows comments
      const post = await contentRepository.getPostById(postId, req.user?.userId);
      if (!post) {
        throw new NotFoundError('Post not found');
      }

      if (!post.can_view || !post.allows_comments) {
        throw new ForbiddenError('Cannot view comments for this post');
      }

      const comments = await contentRepository.getComments(postId, {
        limit: Number(limit),
        offset,
        sort: sort as 'newest' | 'oldest' | 'popular'
      });

      res.status(200).json({
        success: true,
        data: {
          comments,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            hasMore: comments.length === Number(limit)
          }
        }
      });

    } catch (error) {
      logger.error('Get comments failed', {
        error: (error instanceof Error ? error.message : String(error)),
        postId: req.params.postId
      });
      throw error;
    }
  });

  // Add comment
  addComment = asyncHandler(async (req: Request, res: Response) => {
    try {
      const user = req.user;
      const { postId } = req.params;
      
      if (!user) {
        throw new AuthenticationError('Authentication required');
      }

      // Validate input
      const { error, value } = addCommentSchema.validate(req.body);
      if (error) {
        throw new ValidationError(error.details[0].message);
      }

      // Check if post exists and allows comments
      const post = await contentRepository.getPostById(postId, user.userId);
      if (!post) {
        throw new NotFoundError('Post not found');
      }

      if (!post.can_view || !post.allows_comments) {
        throw new ForbiddenError('Cannot comment on this post');
      }

      // Add comment
      const comment = await contentRepository.addComment(
        postId, 
        user.userId, 
        value.comment_text,
        value.parent_comment_id
      );

      logger.info('Comment added successfully', {
        commentId: comment.id,
        postId,
        userId: user.userId
      });

      // Record business metric
      MetricsCollector.recordBusinessEvent('comment_added', 'comment');

      res.status(201).json({
        success: true,
        message: 'Comment added successfully',
        data: { comment }
      });

    } catch (error) {
      logger.error('Add comment failed', {
        error: (error instanceof Error ? error.message : String(error)),
        postId: req.params.postId,
        userId: req.user?.userId
      });
      throw error;
    }
  });

  // =====================================================
  // Categories & Discovery
  // =====================================================

  // Get content categories
  getCategories = asyncHandler(async (req: Request, res: Response) => {
    try {
      const categories = await contentRepository.getCategories();

      res.status(200).json({
        success: true,
        data: { categories }
      });

    } catch (error) {
      logger.error('Get categories failed', {
        error: (error instanceof Error ? error.message : String(error))
      });
      throw error;
    }
  });

  // Get popular creators
  getPopularCreators = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      // Use popular creators view from database
      const query = `
        SELECT * FROM popular_creators
        LIMIT $1 OFFSET $2
      `;

      const result = await contentRepository.db.query(query, [limit, offset]);
      const creators = result.rows;

      res.status(200).json({
        success: true,
        data: {
          creators,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            hasMore: creators.length === Number(limit)
          }
        }
      });

    } catch (error) {
      logger.error('Get popular creators failed', {
        error: (error instanceof Error ? error.message : String(error)),
        query: req.query
      });
      throw error;
    }
  });

  // Search content
  searchContent = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { q, content_type, category, page = 1, limit = 20 } = req.query;

      if (!q || typeof q !== 'string' || q.trim().length < 2) {
        throw new ValidationError('Search query must be at least 2 characters long');
      }

      const searchTerm = `%${q.trim()}%`;
      const offset = (Number(page) - 1) * Number(limit);

      let whereClause = `
        WHERE (p.title ILIKE $1 OR p.description ILIKE $1 OR p.content_text ILIKE $1 OR $1 = ANY(p.tags))
        AND p.published_at IS NOT NULL 
        AND p.published_at <= NOW()
        AND p.deleted_at IS NULL
        AND p.moderation_status = 'approved'
        AND p.visibility = 'public'
        AND u.account_status = 'active'
      `;

      const params = [searchTerm];
      let paramIndex = 2;

      if (content_type && typeof content_type === 'string') {
        whereClause += ` AND p.content_type = $${paramIndex}`;
        params.push(content_type);
        paramIndex++;
      }

      if (category && typeof category === 'string') {
        whereClause += ` AND cc.slug = $${paramIndex}`;
        params.push(category);
        paramIndex++;
      }

      const searchQuery = `
        SELECT 
          p.*,
          u.username as creator_username,
          up.display_name as creator_display_name,
          up.avatar_url as creator_avatar_url,
          cc.name as category_name
        FROM content_posts p
        JOIN users u ON p.creator_id = u.id
        LEFT JOIN user_profiles up ON u.id = up.user_id
        LEFT JOIN content_categories cc ON p.category_id = cc.id
        ${whereClause}
        ORDER BY p.published_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(String(Number(limit)), String(offset));

      const result = await contentRepository.db.query(searchQuery, params);
      const posts = result.rows;

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as count
        FROM content_posts p
        JOIN users u ON p.creator_id = u.id
        LEFT JOIN content_categories cc ON p.category_id = cc.id
        ${whereClause}
      `;

      const countResult = await contentRepository.db.query(countQuery, params.slice(0, -2));
      const total = parseInt(countResult.rows[0]?.count || '0');

      res.status(200).json({
        success: true,
        data: {
          posts,
          query: q,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit))
          }
        }
      });

    } catch (error) {
      logger.error('Search content failed', {
        error: (error instanceof Error ? error.message : String(error)),
        query: req.query
      });
      throw error;
    }
  });

  // =====================================================
  // Creator Content Management
  // =====================================================

  // Get creator's posts
  getCreatorPosts = asyncHandler(async (req: Request, res: Response) => {
    try {
      const user = req.user;
      
      if (!user) {
        throw new AuthenticationError('Authentication required');
      }

      const { page = 1, limit = 20, status = 'all' } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      let statusFilter = '';
      const __params = [user.userId];

      if (status === 'published') {
        statusFilter = 'AND p.published_at IS NOT NULL AND p.deleted_at IS NULL';
      } else if (status === 'draft') {
        statusFilter = 'AND p.published_at IS NULL AND p.deleted_at IS NULL';
      } else if (status === 'scheduled') {
        statusFilter = 'AND p.scheduled_for IS NOT NULL AND p.published_at IS NULL AND p.deleted_at IS NULL';
      } else if (status === 'deleted') {
        statusFilter = 'AND p.deleted_at IS NOT NULL';
      } else {
        statusFilter = ''; // All posts
      }

      const query = `
        SELECT 
          p.*,
          cc.name as category_name,
          (SELECT COUNT(*) FROM content_media WHERE post_id = p.id) as media_count
        FROM content_posts p
        LEFT JOIN content_categories cc ON p.category_id = cc.id
        WHERE p.creator_id = $1 ${statusFilter}
        ORDER BY p.created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await contentRepository.db.query(query, [user.userId, Number(limit), offset]);
      const posts = result.rows;

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as count
        FROM content_posts p
        WHERE p.creator_id = $1 ${statusFilter}
      `;

      const countResult = await contentRepository.db.query(countQuery, [user.userId]);
      const total = parseInt(countResult.rows[0]?.count || '0');

      res.status(200).json({
        success: true,
        data: {
          posts,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit))
          }
        }
      });

    } catch (error) {
      logger.error('Get creator posts failed', {
        error: (error instanceof Error ? error.message : String(error)),
        userId: req.user?.userId
      });
      throw error;
    }
  });

  // Get post analytics
  getPostAnalytics = asyncHandler(async (req: Request, res: Response) => {
    try {
      const user = req.user;
      const { postId } = req.params;
      
      if (!user) {
        throw new AuthenticationError('Authentication required');
      }

      // Check if user owns the post
      const post = await contentRepository.getPostById(postId, user.userId);
      if (!post) {
        throw new NotFoundError('Post not found');
      }

      if (!post.can_edit) {
        throw new ForbiddenError('Access denied');
      }

      // Get analytics data
      const analyticsQuery = `
        SELECT 
          date_recorded,
          views_count,
          unique_views_count,
          likes_count,
          comments_count,
          shares_count,
          tips_count,
          tips_amount,
          avg_watch_time,
          completion_rate,
          traffic_sources,
          demographics
        FROM content_analytics 
        WHERE post_id = $1 
        ORDER BY date_recorded DESC
        LIMIT 30
      `;

      const analyticsResult = await contentRepository.db.query(analyticsQuery, [postId]);
      const analytics = analyticsResult.rows;

      // Get engagement summary
      const summaryQuery = `
        SELECT 
          SUM(views_count) as total_views,
          SUM(unique_views_count) as total_unique_views,
          SUM(likes_count) as total_likes,
          SUM(comments_count) as total_comments,
          SUM(shares_count) as total_shares,
          SUM(tips_count) as total_tips,
          SUM(tips_amount) as total_tips_amount,
          AVG(avg_watch_time) as avg_watch_time,
          AVG(completion_rate) as avg_completion_rate
        FROM content_analytics 
        WHERE post_id = $1
      `;

      const summaryResult = await contentRepository.db.query(summaryQuery, [postId]);
      const summary = summaryResult.rows[0];

      res.status(200).json({
        success: true,
        data: {
          post_id: postId,
          summary: {
            total_views: parseInt(summary?.total_views || '0'),
            total_unique_views: parseInt(summary?.total_unique_views || '0'),
            total_likes: parseInt(summary?.total_likes || '0'),
            total_comments: parseInt(summary?.total_comments || '0'),
            total_shares: parseInt(summary?.total_shares || '0'),
            total_tips: parseInt(summary?.total_tips || '0'),
            total_tips_amount: parseFloat(summary?.total_tips_amount || '0'),
            avg_watch_time: parseFloat(summary?.avg_watch_time || '0'),
            avg_completion_rate: parseFloat(summary?.avg_completion_rate || '0'),
            engagement_rate: summary?.total_views > 0 
              ? ((parseInt(summary?.total_likes || '0') + parseInt(summary?.total_comments || '0') + parseInt(summary?.total_shares || '0')) / parseInt(summary?.total_views)) * 100 
              : 0
          },
          daily_analytics: analytics
        }
      });

    } catch (error) {
      logger.error('Get post analytics failed', {
        error: (error instanceof Error ? error.message : String(error)),
        postId: req.params.postId,
        userId: req.user?.userId
      });
      throw error;
    }
  });
}

// Export singleton instance
export const contentController = new ContentController();
export default ContentController;