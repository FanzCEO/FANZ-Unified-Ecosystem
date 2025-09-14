import { BaseRepository } from '../config/database';
import { Logger } from '../utils/logger';
import { 
  ConflictError, 
  NotFoundError, 
  DatabaseError, 
  ValidationError,
  ForbiddenError 
} from '../middleware/errorHandler';

const logger = new Logger('ContentModel');

// =====================================================
// Content Interfaces
// =====================================================

export interface ContentPost {
  id: string;
  creator_id: string;
  title?: string;
  description?: string;
  content_type: 'post' | 'image' | 'video' | 'audio' | 'live_stream' | 'story' | 'poll' | 'article';
  content_text?: string;
  category_id?: string;
  tags: string[];
  visibility: 'public' | 'followers_only' | 'subscribers_only' | 'premium' | 'private';
  age_restriction: 'all' | '13+' | '16+' | '18+';
  is_premium: boolean;
  price: number;
  tip_enabled: boolean;
  is_featured: boolean;
  is_pinned: boolean;
  allows_comments: boolean;
  allows_likes: boolean;
  allows_sharing: boolean;
  moderation_status: 'pending' | 'approved' | 'rejected' | 'reported' | 'removed';
  moderation_reason?: string;
  moderated_by?: string;
  moderated_at?: Date;
  view_count: number;
  like_count: number;
  comment_count: number;
  share_count: number;
  tip_count: number;
  total_tips: number;
  published_at?: Date;
  scheduled_for?: Date;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface ContentMedia {
  id: string;
  post_id: string;
  media_type: 'image' | 'video' | 'audio' | 'document' | 'thumbnail';
  file_name: string;
  file_size: number;
  file_url: string;
  cdn_url?: string;
  mime_type: string;
  duration?: number;
  width?: number;
  height?: number;
  quality: string;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  processing_progress: number;
  processing_error?: string;
  sort_order: number;
  is_thumbnail: boolean;
  is_preview: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ContentInteraction {
  id: string;
  post_id: string;
  user_id: string;
  interaction_type: 'like' | 'love' | 'wow' | 'sad' | 'angry' | 'view' | 'share' | 'bookmark' | 'report';
  interaction_value: number;
  metadata: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

export interface ContentComment {
  id: string;
  post_id: string;
  user_id: string;
  parent_comment_id?: string;
  comment_text: string;
  comment_html?: string;
  is_pinned: boolean;
  is_edited: boolean;
  edit_reason?: string;
  is_approved: boolean;
  is_reported: boolean;
  moderation_reason?: string;
  moderated_by?: string;
  moderated_at?: Date;
  like_count: number;
  reply_count: number;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface ContentCollection {
  id: string;
  creator_id: string;
  title: string;
  description?: string;
  cover_image_url?: string;
  visibility: 'public' | 'private' | 'unlisted';
  is_premium: boolean;
  price: number;
  sort_order: number;
  post_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface ContentCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon_url?: string;
  color_code?: string;
  parent_category_id?: string;
  is_active: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface PostWithDetails extends ContentPost {
  creator_username: string;
  creator_display_name: string;
  creator_avatar_url?: string;
  creator_verification_status?: string;
  category_name?: string;
  media: ContentMedia[];
  user_interaction?: ContentInteraction;
  is_following_creator: boolean;
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

export interface CreatePostInput {
  title?: string;
  description?: string;
  content_type: string;
  content_text?: string;
  category_id?: string;
  tags?: string[];
  visibility?: string;
  age_restriction?: string;
  is_premium?: boolean;
  price?: number;
  tip_enabled?: boolean;
  allows_comments?: boolean;
  allows_likes?: boolean;
  allows_sharing?: boolean;
  scheduled_for?: Date;
  media_urls?: string[];
}

export interface FeedOptions {
  user_id?: string;
  algorithm?: 'chronological' | 'engagement' | 'personalized' | 'balanced';
  content_types?: string[];
  categories?: string[];
  following_only?: boolean;
  premium_only?: boolean;
  hide_seen?: boolean;
  limit?: number;
  offset?: number;
}

export interface PostAnalytics {
  views: number;
  unique_views: number;
  likes: number;
  comments: number;
  shares: number;
  tips_count: number;
  tips_amount: number;
  engagement_rate: number;
  avg_watch_time: number;
  completion_rate: number;
  demographics: Record<string, any>;
  traffic_sources: Record<string, any>;
}

// =====================================================
// Content Repository
// =====================================================

export class ContentRepository extends BaseRepository {
  
  // =====================================================
  // Content Creation & Management
  // =====================================================

  async createPost(creatorId: string, postData: CreatePostInput): Promise<PostWithDetails> {
    try {
      const result = await this.db.transaction(async (client) => {
        // Create the post
        const postQuery = `
          INSERT INTO content_posts (
            creator_id, title, description, content_type, content_text,
            category_id, tags, visibility, age_restriction, is_premium,
            price, tip_enabled, allows_comments, allows_likes, allows_sharing,
            scheduled_for, published_at, moderation_status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
          RETURNING *
        `;

        const publishedAt = postData.scheduled_for ? null : new Date();
        const moderationStatus = postData.content_type === 'live_stream' ? 'pending' : 'approved';

        const postResult = await client.query(postQuery, [
          creatorId,
          postData.title,
          postData.description,
          postData.content_type,
          postData.content_text,
          postData.category_id,
          JSON.stringify(postData.tags || []),
          postData.visibility || 'public',
          postData.age_restriction || 'all',
          postData.is_premium || false,
          postData.price || 0,
          postData.tip_enabled !== false,
          postData.allows_comments !== false,
          postData.allows_likes !== false,
          postData.allows_sharing !== false,
          postData.scheduled_for,
          publishedAt,
          moderationStatus
        ]);

        const post = postResult.rows[0];

        // Handle media if provided
        if (postData.media_urls && postData.media_urls.length > 0) {
          for (let i = 0; i < postData.media_urls.length; i++) {
            const mediaUrl = postData.media_urls[i];
            await this.createMediaRecord(client, post.id, mediaUrl, i);
          }
        }

        // If scheduled, create scheduled post record
        if (postData.scheduled_for) {
          await client.query(`
            INSERT INTO scheduled_posts (post_id, creator_id, scheduled_for, status)
            VALUES ($1, $2, $3, 'scheduled')
          `, [post.id, creatorId, postData.scheduled_for]);
        }

        return post;
      });

      logger.info('Post created successfully', {
        postId: result.id,
        creatorId,
        contentType: result.content_type
      });

      // Return full post details
      return await this.getPostById(result.id, creatorId);
    } catch (error) {
      logger.error('Failed to create post', {
        error: error.message,
        creatorId,
        postData
      });
      throw error;
    }
  }

  async updatePost(postId: string, userId: string, updateData: Partial<CreatePostInput>): Promise<PostWithDetails | null> {
    try {
      // Check ownership
      const post = await this.getPostById(postId);
      if (!post) {
        throw new NotFoundError('Post not found');
      }

      if (post.creator_id !== userId) {
        throw new ForbiddenError('Can only edit your own posts');
      }

      // Build update query
      const setFields = [];
      const values = [];
      let valueIndex = 1;

      Object.entries(updateData).forEach(([key, value]) => {
        if (key !== 'media_urls' && value !== undefined) {
          if (key === 'tags') {
            setFields.push(`${key} = $${valueIndex}`);
            values.push(JSON.stringify(value));
          } else {
            setFields.push(`${key} = $${valueIndex}`);
            values.push(value);
          }
          valueIndex++;
        }
      });

      if (setFields.length === 0) {
        return post;
      }

      const query = `
        UPDATE content_posts 
        SET ${setFields.join(', ')}, updated_at = NOW()
        WHERE id = $${valueIndex}
        RETURNING *
      `;
      values.push(postId);

      await this.db.query(query, values);

      logger.info('Post updated successfully', {
        postId,
        userId,
        updatedFields: Object.keys(updateData)
      });

      return await this.getPostById(postId, userId);
    } catch (error) {
      logger.error('Failed to update post', {
        error: error.message,
        postId,
        userId
      });
      throw error;
    }
  }

  async deletePost(postId: string, userId: string): Promise<boolean> {
    try {
      const query = `
        UPDATE content_posts 
        SET deleted_at = NOW(), updated_at = NOW()
        WHERE id = $1 AND creator_id = $2 AND deleted_at IS NULL
        RETURNING id
      `;

      const result = await this.db.query(query, [postId, userId]);

      if (result.rows.length === 0) {
        throw new ForbiddenError('Post not found or access denied');
      }

      logger.info('Post deleted successfully', { postId, userId });
      return true;
    } catch (error) {
      logger.error('Failed to delete post', {
        error: error.message,
        postId,
        userId
      });
      throw error;
    }
  }

  // =====================================================
  // Content Retrieval
  // =====================================================

  async getPostById(postId: string, viewerId?: string): Promise<PostWithDetails | null> {
    try {
      const query = `
        SELECT 
          p.*,
          u.username as creator_username,
          up.display_name as creator_display_name,
          up.avatar_url as creator_avatar_url,
          cp.verification_status as creator_verification_status,
          cc.name as category_name,
          COALESCE(
            (SELECT interaction_type FROM content_interactions 
             WHERE post_id = p.id AND user_id = $2 LIMIT 1), 
            null
          ) as user_interaction_type,
          CASE 
            WHEN $2 IS NULL THEN false
            ELSE EXISTS(SELECT 1 FROM follows 
                       WHERE follower_user_id = $2 AND followed_user_id = p.creator_id 
                       AND unfollowed_at IS NULL)
          END as is_following_creator
        FROM content_posts p
        JOIN users u ON p.creator_id = u.id
        LEFT JOIN user_profiles up ON u.id = up.user_id
        LEFT JOIN creator_profiles cp ON u.id = cp.user_id
        LEFT JOIN content_categories cc ON p.category_id = cc.id
        WHERE p.id = $1 AND p.deleted_at IS NULL
      `;

      const result = await this.db.query(query, [postId, viewerId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];

      // Get media
      const media = await this.getPostMedia(postId);

      // Check permissions
      const canView = this.canViewPost(row, viewerId);
      const canEdit = viewerId === row.creator_id;
      const canDelete = viewerId === row.creator_id;

      const post: PostWithDetails = {
        id: row.id,
        creator_id: row.creator_id,
        title: row.title,
        description: row.description,
        content_type: row.content_type,
        content_text: row.content_text,
        category_id: row.category_id,
        tags: row.tags || [],
        visibility: row.visibility,
        age_restriction: row.age_restriction,
        is_premium: row.is_premium,
        price: parseFloat(row.price),
        tip_enabled: row.tip_enabled,
        is_featured: row.is_featured,
        is_pinned: row.is_pinned,
        allows_comments: row.allows_comments,
        allows_likes: row.allows_likes,
        allows_sharing: row.allows_sharing,
        moderation_status: row.moderation_status,
        moderation_reason: row.moderation_reason,
        moderated_by: row.moderated_by,
        moderated_at: row.moderated_at,
        view_count: row.view_count,
        like_count: row.like_count,
        comment_count: row.comment_count,
        share_count: row.share_count,
        tip_count: row.tip_count,
        total_tips: parseFloat(row.total_tips),
        published_at: row.published_at,
        scheduled_for: row.scheduled_for,
        created_at: row.created_at,
        updated_at: row.updated_at,
        deleted_at: row.deleted_at,
        creator_username: row.creator_username,
        creator_display_name: row.creator_display_name,
        creator_avatar_url: row.creator_avatar_url,
        creator_verification_status: row.creator_verification_status,
        category_name: row.category_name,
        media,
        user_interaction: row.user_interaction_type ? {
          interaction_type: row.user_interaction_type
        } as any : undefined,
        is_following_creator: row.is_following_creator,
        can_view: canView,
        can_edit: canEdit,
        can_delete: canDelete
      };

      return post;
    } catch (error) {
      logger.error('Failed to get post by ID', {
        error: error.message,
        postId
      });
      throw error;
    }
  }

  async getFeed(options: FeedOptions): Promise<{ posts: PostWithDetails[]; total: number; hasMore: boolean }> {
    try {
      const {
        user_id,
        algorithm = 'balanced',
        content_types = [],
        categories = [],
        following_only = false,
        premium_only = false,
        hide_seen = false,
        limit = 20,
        offset = 0
      } = options;

      let baseQuery = `
        FROM content_posts p
        JOIN users u ON p.creator_id = u.id
        LEFT JOIN user_profiles up ON u.id = up.user_id
        LEFT JOIN creator_profiles cp ON u.id = cp.user_id
        LEFT JOIN content_categories cc ON p.category_id = cc.id
        WHERE p.published_at IS NOT NULL 
          AND p.published_at <= NOW()
          AND p.deleted_at IS NULL
          AND p.moderation_status = 'approved'
          AND u.account_status = 'active'
      `;

      const params = [];
      let paramIndex = 1;

      // Add filters
      if (following_only && user_id) {
        baseQuery += ` AND p.creator_id IN (
          SELECT followed_user_id FROM follows 
          WHERE follower_user_id = $${paramIndex} AND unfollowed_at IS NULL
        )`;
        params.push(user_id);
        paramIndex++;
      }

      if (content_types.length > 0) {
        baseQuery += ` AND p.content_type = ANY($${paramIndex})`;
        params.push(content_types);
        paramIndex++;
      }

      if (categories.length > 0) {
        baseQuery += ` AND cc.slug = ANY($${paramIndex})`;
        params.push(categories);
        paramIndex++;
      }

      if (premium_only) {
        baseQuery += ` AND p.is_premium = true`;
      }

      if (hide_seen && user_id) {
        baseQuery += ` AND NOT EXISTS (
          SELECT 1 FROM content_interactions ci 
          WHERE ci.post_id = p.id AND ci.user_id = $${paramIndex} 
          AND ci.interaction_type = 'view'
        )`;
        params.push(user_id);
        paramIndex++;
      }

      // Add visibility filter based on user
      if (user_id) {
        baseQuery += ` AND (
          p.visibility = 'public' 
          OR (p.visibility = 'followers_only' AND EXISTS(
            SELECT 1 FROM follows WHERE follower_user_id = $${paramIndex} 
            AND followed_user_id = p.creator_id AND unfollowed_at IS NULL
          ))
          OR p.creator_id = $${paramIndex}
        )`;
        params.push(user_id, user_id);
        paramIndex += 2;
      } else {
        baseQuery += ` AND p.visibility = 'public'`;
      }

      // Order by algorithm
      let orderClause = '';
      switch (algorithm) {
        case 'chronological':
          orderClause = 'ORDER BY p.published_at DESC';
          break;
        case 'engagement':
          orderClause = `ORDER BY (
            COALESCE(p.like_count, 0) * 1.0 +
            COALESCE(p.comment_count, 0) * 2.0 +
            COALESCE(p.share_count, 0) * 3.0
          ) DESC`;
          break;
        case 'balanced':
        default:
          orderClause = `ORDER BY (
            (COALESCE(p.like_count, 0) * 1.0 +
             COALESCE(p.comment_count, 0) * 2.0 +
             COALESCE(p.share_count, 0) * 3.0) / 
            GREATEST(EXTRACT(EPOCH FROM (NOW() - p.published_at)) / 3600, 1)
          ) DESC`;
          break;
      }

      // Get posts
      const postsQuery = `
        SELECT 
          p.*,
          u.username as creator_username,
          up.display_name as creator_display_name,
          up.avatar_url as creator_avatar_url,
          cp.verification_status as creator_verification_status,
          cc.name as category_name,
          ${user_id ? `
            COALESCE(
              (SELECT interaction_type FROM content_interactions 
               WHERE post_id = p.id AND user_id = $${paramIndex} LIMIT 1), 
              null
            ) as user_interaction_type,
            EXISTS(SELECT 1 FROM follows 
                   WHERE follower_user_id = $${paramIndex} AND followed_user_id = p.creator_id 
                   AND unfollowed_at IS NULL) as is_following_creator
          ` : `
            null as user_interaction_type,
            false as is_following_creator
          `}
        ${baseQuery}
        ${orderClause}
        LIMIT $${paramIndex + (user_id ? 1 : 0)} OFFSET $${paramIndex + (user_id ? 2 : 1)}
      `;

      if (user_id) {
        params.push(user_id, user_id);
      }
      params.push(limit, offset);

      const result = await this.db.query(postsQuery, params);

      // Get media for all posts
      const posts: PostWithDetails[] = [];
      for (const row of result.rows) {
        const media = await this.getPostMedia(row.id);
        const canView = this.canViewPost(row, user_id);

        const post: PostWithDetails = {
          id: row.id,
          creator_id: row.creator_id,
          title: row.title,
          description: row.description,
          content_type: row.content_type,
          content_text: row.content_text,
          category_id: row.category_id,
          tags: row.tags || [],
          visibility: row.visibility,
          age_restriction: row.age_restriction,
          is_premium: row.is_premium,
          price: parseFloat(row.price),
          tip_enabled: row.tip_enabled,
          is_featured: row.is_featured,
          is_pinned: row.is_pinned,
          allows_comments: row.allows_comments,
          allows_likes: row.allows_likes,
          allows_sharing: row.allows_sharing,
          moderation_status: row.moderation_status,
          moderation_reason: row.moderation_reason,
          moderated_by: row.moderated_by,
          moderated_at: row.moderated_at,
          view_count: row.view_count,
          like_count: row.like_count,
          comment_count: row.comment_count,
          share_count: row.share_count,
          tip_count: row.tip_count,
          total_tips: parseFloat(row.total_tips),
          published_at: row.published_at,
          scheduled_for: row.scheduled_for,
          created_at: row.created_at,
          updated_at: row.updated_at,
          deleted_at: row.deleted_at,
          creator_username: row.creator_username,
          creator_display_name: row.creator_display_name,
          creator_avatar_url: row.creator_avatar_url,
          creator_verification_status: row.creator_verification_status,
          category_name: row.category_name,
          media,
          user_interaction: row.user_interaction_type ? {
            interaction_type: row.user_interaction_type
          } as any : undefined,
          is_following_creator: row.is_following_creator,
          can_view: canView,
          can_edit: user_id === row.creator_id,
          can_delete: user_id === row.creator_id
        };

        if (canView) {
          posts.push(post);
        }
      }

      // Get total count (simplified for performance)
      const countQuery = `SELECT COUNT(*) as count ${baseQuery}`;
      const countResult = await this.db.query(countQuery, params.slice(0, -2)); // Remove limit/offset
      const total = parseInt(countResult.rows[0]?.count || '0');

      return {
        posts,
        total,
        hasMore: offset + posts.length < total
      };
    } catch (error) {
      logger.error('Failed to get feed', {
        error: error.message,
        options
      });
      throw error;
    }
  }

  // =====================================================
  // Content Interactions
  // =====================================================

  async addInteraction(postId: string, userId: string, interactionType: string, metadata?: Record<string, any>): Promise<ContentInteraction> {
    try {
      const query = `
        INSERT INTO content_interactions (post_id, user_id, interaction_type, metadata, ip_address, user_agent)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (post_id, user_id, interaction_type) 
        DO UPDATE SET created_at = NOW(), metadata = EXCLUDED.metadata
        RETURNING *
      `;

      const result = await this.db.query(query, [
        postId,
        userId,
        interactionType,
        JSON.stringify(metadata || {}),
        null, // IP address - can be passed from controller
        null  // User agent - can be passed from controller
      ]);

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to add interaction', {
        error: error.message,
        postId,
        userId,
        interactionType
      });
      throw error;
    }
  }

  async removeInteraction(postId: string, userId: string, interactionType: string): Promise<boolean> {
    try {
      const query = `
        DELETE FROM content_interactions 
        WHERE post_id = $1 AND user_id = $2 AND interaction_type = $3
        RETURNING id
      `;

      const result = await this.db.query(query, [postId, userId, interactionType]);
      return result.rows.length > 0;
    } catch (error) {
      logger.error('Failed to remove interaction', {
        error: error.message,
        postId,
        userId,
        interactionType
      });
      throw error;
    }
  }

  // =====================================================
  // Comments
  // =====================================================

  async addComment(postId: string, userId: string, commentText: string, parentCommentId?: string): Promise<ContentComment> {
    try {
      const query = `
        INSERT INTO content_comments (post_id, user_id, parent_comment_id, comment_text)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;

      const result = await this.db.query(query, [postId, userId, parentCommentId, commentText]);

      logger.info('Comment added successfully', {
        commentId: result.rows[0].id,
        postId,
        userId
      });

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to add comment', {
        error: error.message,
        postId,
        userId
      });
      throw error;
    }
  }

  async getComments(postId: string, options: { limit?: number; offset?: number; sort?: 'newest' | 'oldest' | 'popular' } = {}): Promise<ContentComment[]> {
    try {
      const { limit = 20, offset = 0, sort = 'newest' } = options;

      let orderClause = '';
      switch (sort) {
        case 'oldest':
          orderClause = 'ORDER BY c.created_at ASC';
          break;
        case 'popular':
          orderClause = 'ORDER BY c.like_count DESC, c.created_at DESC';
          break;
        case 'newest':
        default:
          orderClause = 'ORDER BY c.created_at DESC';
          break;
      }

      const query = `
        SELECT 
          c.*,
          u.username,
          up.display_name,
          up.avatar_url
        FROM content_comments c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE c.post_id = $1 
          AND c.deleted_at IS NULL 
          AND c.is_approved = true
          AND c.parent_comment_id IS NULL
        ${orderClause}
        LIMIT $2 OFFSET $3
      `;

      const result = await this.db.query(query, [postId, limit, offset]);
      return result.rows;
    } catch (error) {
      logger.error('Failed to get comments', {
        error: error.message,
        postId
      });
      throw error;
    }
  }

  // =====================================================
  // Categories
  // =====================================================

  async getCategories(): Promise<ContentCategory[]> {
    try {
      const query = `
        SELECT * FROM content_categories 
        WHERE is_active = true 
        ORDER BY sort_order, name
      `;

      const result = await this.db.query(query);
      return result.rows;
    } catch (error) {
      logger.error('Failed to get categories', {
        error: error.message
      });
      throw error;
    }
  }

  // =====================================================
  // Helper Methods
  // =====================================================

  private async getPostMedia(postId: string): Promise<ContentMedia[]> {
    const query = `
      SELECT * FROM content_media 
      WHERE post_id = $1 
      ORDER BY sort_order, created_at
    `;

    const result = await this.db.query(query, [postId]);
    return result.rows;
  }

  private async createMediaRecord(client: any, postId: string, mediaUrl: string, sortOrder: number): Promise<void> {
    // Extract media type from URL (simplified)
    const mediaType = this.getMediaTypeFromUrl(mediaUrl);

    const query = `
      INSERT INTO content_media (
        post_id, media_type, file_name, file_url, sort_order, processing_status
      ) VALUES ($1, $2, $3, $4, $5, 'completed')
    `;

    await client.query(query, [
      postId,
      mediaType,
      this.getFileNameFromUrl(mediaUrl),
      mediaUrl,
      sortOrder
    ]);
  }

  private getMediaTypeFromUrl(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension!)) {
      return 'image';
    } else if (['mp4', 'avi', 'mov', 'webm'].includes(extension!)) {
      return 'video';
    } else if (['mp3', 'wav', 'ogg'].includes(extension!)) {
      return 'audio';
    }
    
    return 'document';
  }

  private getFileNameFromUrl(url: string): string {
    return url.split('/').pop() || 'unknown';
  }

  private canViewPost(post: any, viewerId?: string): boolean {
    // Public posts are always viewable
    if (post.visibility === 'public') {
      return true;
    }

    // Private posts only viewable by creator
    if (post.visibility === 'private') {
      return viewerId === post.creator_id;
    }

    // For other visibility levels, user must be logged in
    if (!viewerId) {
      return false;
    }

    // Creator can always view their own posts
    if (viewerId === post.creator_id) {
      return true;
    }

    // Followers-only posts require following
    if (post.visibility === 'followers_only') {
      return post.is_following_creator;
    }

    // Premium and subscribers-only posts require subscription (to be implemented)
    if (post.visibility === 'subscribers_only' || post.visibility === 'premium') {
      // TODO: Check subscription status
      return false;
    }

    return false;
  }
}

// Export singleton instance
export const contentRepository = new ContentRepository();
export default ContentRepository;