import { Request, Response } from 'express';
import { userRepository, UserRepository } from '../models/user.model';
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

const logger = new Logger('UserController');

// Validation schemas
const updateProfileSchema = Joi.object({
  display_name: Joi.string().min(1).max(100).optional(),
  bio: Joi.string().max(500).optional().allow(''),
  location: Joi.string().max(100).optional().allow(''),
  website: Joi.string().uri().optional().allow(''),
  social_links: Joi.object().pattern(
    Joi.string(), 
    Joi.string().uri()
  ).optional(),
  privacy_settings: Joi.object({
    profile_visibility: Joi.string().valid('public', 'private', 'followers_only').optional(),
    email_visibility: Joi.string().valid('public', 'private', 'followers_only').optional(),
    show_online_status: Joi.boolean().optional(),
    allow_direct_messages: Joi.boolean().optional()
  }).optional(),
  notification_settings: Joi.object({
    email_notifications: Joi.boolean().optional(),
    push_notifications: Joi.boolean().optional(),
    marketing_emails: Joi.boolean().optional(),
    activity_notifications: Joi.boolean().optional()
  }).optional()
});

const searchUsersSchema = Joi.object({
  query: Joi.string().min(1).max(100).required(),
  role: Joi.string().valid('fan', 'creator', 'admin', 'moderator').optional(),
  verified: Joi.boolean().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20)
});

const updateCreatorProfileSchema = Joi.object({
  content_categories: Joi.array().items(Joi.string()).optional(),
  subscription_price: Joi.number().min(0).optional(),
  tip_minimum: Joi.number().min(0).optional(),
  payout_method: Joi.object().optional(),
  social_links: Joi.object().pattern(
    Joi.string(), 
    Joi.string().uri()
  ).optional(),
  branding: Joi.object().optional(),
  analytics_enabled: Joi.boolean().optional()
});

export class UserController {

  // Get user profile by ID or username
  getUserProfile = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { identifier } = req.params;
      const currentUser = req.user;
      
      // Find user by ID or username
      let user;
      if (identifier.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        // UUID format - search by ID
        user = await userRepository.findByIdWithProfile(identifier);
      } else {
        // Search by username
        const userByUsername = await userRepository.findByUsername(identifier);
        if (userByUsername) {
          user = await userRepository.findByIdWithProfile(userByUsername.id);
        }
      }

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Check privacy settings
      const isOwnProfile = currentUser?.userId === user.id;
      const isFollowing = currentUser ? await this.checkFollowingStatus(currentUser.userId, user.id) : false;
      
      if (!this.canViewProfile(user, isOwnProfile, isFollowing, currentUser)) {
        throw new ForbiddenError('Profile is private');
      }

      // Get creator profile if user is a creator
      let creatorProfile = null;
      if (user.role === 'creator') {
        creatorProfile = await userRepository.getCreatorProfile(user.id);
      }

      // Get user statistics (only for own profile or if allowed)
      let stats = null;
      if (isOwnProfile || user.profile.privacy_settings?.show_stats !== false) {
        stats = await userRepository.getUserStats(user.id);
      }

      // Get follow counts
      const followStats = await this.getFollowStats(user.id);

      // Remove sensitive information
      const publicUser = {
        id: user.id,
        username: user.username,
        role: user.role,
        email_verified: user.email_verified,
        account_status: user.account_status,
        created_at: user.created_at,
        profile: {
          ...user.profile,
          // Remove email from profile unless it's own profile or email is public
          ...(isOwnProfile || user.profile.privacy_settings?.email_visibility === 'public' 
            ? {} 
            : { email: undefined })
        },
        creator_profile: creatorProfile,
        statistics: stats,
        follow_stats: followStats,
        is_following: isFollowing,
        is_own_profile: isOwnProfile
      };

      res.status(200).json({
        success: true,
        data: { user: publicUser }
      });

    } catch (error) {
      logger.error('Get user profile failed', {
        error: error.message,
        identifier: req.params.identifier
      });
      throw error;
    }
  });

  // Update current user's profile
  updateProfile = asyncHandler(async (req: Request, res: Response) => {
    try {
      const user = req.user;
      
      if (!user) {
        throw new AuthenticationError('Authentication required');
      }

      // Validate input
      const { error, value } = updateProfileSchema.validate(req.body);
      if (error) {
        throw new ValidationError(error.details[0].message);
      }

      // Update profile
      const updatedProfile = await userRepository.updateProfile(user.userId, value);
      if (!updatedProfile) {
        throw new NotFoundError('User profile not found');
      }

      logger.info('User profile updated', {
        userId: user.userId,
        updatedFields: Object.keys(value)
      });

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: { profile: updatedProfile }
      });

    } catch (error) {
      logger.error('Update profile failed', {
        error: error.message,
        userId: req.user?.userId
      });
      throw error;
    }
  });

  // Search users
  searchUsers = asyncHandler(async (req: Request, res: Response) => {
    try {
      // Validate query parameters
      const { error, value } = searchUsersSchema.validate(req.query);
      if (error) {
        throw new ValidationError(error.details[0].message);
      }

      const { query, role, verified, page, limit } = value;
      const offset = (page - 1) * limit;

      // Search users
      const result = await userRepository.searchUsers(query, {
        role,
        verified,
        limit,
        offset
      });

      // Remove sensitive information from results
      const publicUsers = result.users.map(user => ({
        id: user.id,
        username: user.username,
        role: user.role,
        email_verified: user.email_verified,
        account_status: user.account_status,
        created_at: user.created_at,
        profile: {
          id: user.profile.id,
          display_name: user.profile.display_name,
          bio: user.profile.bio,
          avatar_url: user.profile.avatar_url,
          location: user.profile.location,
          website: user.profile.website
        }
      }));

      res.status(200).json({
        success: true,
        data: {
          users: publicUsers,
          pagination: {
            page,
            limit,
            total: result.total,
            totalPages: Math.ceil(result.total / limit)
          }
        }
      });

    } catch (error) {
      logger.error('Search users failed', {
        error: error.message,
        query: req.query
      });
      throw error;
    }
  });

  // Follow a user
  followUser = asyncHandler(async (req: Request, res: Response) => {
    try {
      const user = req.user;
      const { userId } = req.params;
      
      if (!user) {
        throw new AuthenticationError('Authentication required');
      }

      if (user.userId === userId) {
        throw new ValidationError('Cannot follow yourself');
      }

      // Check if target user exists
      const targetUser = await userRepository.findByIdWithProfile(userId);
      if (!targetUser) {
        throw new NotFoundError('User not found');
      }

      // Check if already following
      const isAlreadyFollowing = await this.checkFollowingStatus(user.userId, userId);
      if (isAlreadyFollowing) {
        throw new ConflictError('Already following this user');
      }

      // Create follow relationship
      await this.createFollowRelationship(user.userId, userId);

      logger.info('User followed successfully', {
        followerId: user.userId,
        followedUserId: userId
      });

      // Record business metric
      MetricsCollector.recordBusinessEvent('user_follow', targetUser.role);

      res.status(200).json({
        success: true,
        message: 'User followed successfully'
      });

    } catch (error) {
      logger.error('Follow user failed', {
        error: error.message,
        followerId: req.user?.userId,
        targetUserId: req.params.userId
      });
      throw error;
    }
  });

  // Unfollow a user
  unfollowUser = asyncHandler(async (req: Request, res: Response) => {
    try {
      const user = req.user;
      const { userId } = req.params;
      
      if (!user) {
        throw new AuthenticationError('Authentication required');
      }

      if (user.userId === userId) {
        throw new ValidationError('Cannot unfollow yourself');
      }

      // Check if currently following
      const isFollowing = await this.checkFollowingStatus(user.userId, userId);
      if (!isFollowing) {
        throw new ConflictError('Not following this user');
      }

      // Remove follow relationship
      await this.removeFollowRelationship(user.userId, userId);

      logger.info('User unfollowed successfully', {
        followerId: user.userId,
        unfollowedUserId: userId
      });

      res.status(200).json({
        success: true,
        message: 'User unfollowed successfully'
      });

    } catch (error) {
      logger.error('Unfollow user failed', {
        error: error.message,
        followerId: req.user?.userId,
        targetUserId: req.params.userId
      });
      throw error;
    }
  });

  // Get user's followers
  getFollowers = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      // Check if user exists
      const targetUser = await userRepository.findByIdWithProfile(userId);
      if (!targetUser) {
        throw new NotFoundError('User not found');
      }

      // Get followers
      const followers = await this.getFollowersList(userId, Number(limit), offset);

      res.status(200).json({
        success: true,
        data: {
          followers: followers.users,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: followers.total,
            totalPages: Math.ceil(followers.total / Number(limit))
          }
        }
      });

    } catch (error) {
      logger.error('Get followers failed', {
        error: error.message,
        userId: req.params.userId
      });
      throw error;
    }
  });

  // Get users that a user is following
  getFollowing = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      // Check if user exists
      const targetUser = await userRepository.findByIdWithProfile(userId);
      if (!targetUser) {
        throw new NotFoundError('User not found');
      }

      // Get following
      const following = await this.getFollowingList(userId, Number(limit), offset);

      res.status(200).json({
        success: true,
        data: {
          following: following.users,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: following.total,
            totalPages: Math.ceil(following.total / Number(limit))
          }
        }
      });

    } catch (error) {
      logger.error('Get following failed', {
        error: error.message,
        userId: req.params.userId
      });
      throw error;
    }
  });

  // Update creator profile (creators only)
  updateCreatorProfile = asyncHandler(async (req: Request, res: Response) => {
    try {
      const user = req.user;
      
      if (!user) {
        throw new AuthenticationError('Authentication required');
      }

      if (user.role !== 'creator') {
        throw new ForbiddenError('Only creators can update creator profile');
      }

      // Validate input
      const { error, value } = updateCreatorProfileSchema.validate(req.body);
      if (error) {
        throw new ValidationError(error.details[0].message);
      }

      // Get current creator profile
      const currentProfile = await userRepository.getCreatorProfile(user.userId);
      if (!currentProfile) {
        throw new NotFoundError('Creator profile not found');
      }

      // Update creator profile
      const updatedProfile = await this.updateCreatorProfileData(user.userId, value);

      logger.info('Creator profile updated', {
        userId: user.userId,
        updatedFields: Object.keys(value)
      });

      res.status(200).json({
        success: true,
        message: 'Creator profile updated successfully',
        data: { creator_profile: updatedProfile }
      });

    } catch (error) {
      logger.error('Update creator profile failed', {
        error: error.message,
        userId: req.user?.userId
      });
      throw error;
    }
  });

  // Admin: Get all users
  getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    try {
      const user = req.user;
      
      if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
        throw new ForbiddenError('Admin access required');
      }

      const { page = 1, limit = 20, role, status } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const users = await this.getAdminUsersList(Number(limit), offset, {
        role: role as string,
        status: status as string
      });

      res.status(200).json({
        success: true,
        data: {
          users: users.users,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: users.total,
            totalPages: Math.ceil(users.total / Number(limit))
          }
        }
      });

    } catch (error) {
      logger.error('Get all users failed', {
        error: error.message,
        adminUserId: req.user?.userId
      });
      throw error;
    }
  });

  // Admin: Update user status
  updateUserStatus = asyncHandler(async (req: Request, res: Response) => {
    try {
      const user = req.user;
      const { userId } = req.params;
      const { status, reason } = req.body;
      
      if (!user || user.role !== 'admin') {
        throw new ForbiddenError('Admin access required');
      }

      if (!['active', 'suspended', 'banned'].includes(status)) {
        throw new ValidationError('Invalid status. Must be: active, suspended, or banned');
      }

      // Update user status
      await this.updateUserStatusData(userId, status, reason, user.userId);

      logger.info('User status updated by admin', {
        adminUserId: user.userId,
        targetUserId: userId,
        newStatus: status,
        reason
      });

      res.status(200).json({
        success: true,
        message: `User status updated to ${status}`
      });

    } catch (error) {
      logger.error('Update user status failed', {
        error: error.message,
        adminUserId: req.user?.userId,
        targetUserId: req.params.userId
      });
      throw error;
    }
  });

  // Helper methods
  private canViewProfile(user: any, isOwnProfile: boolean, isFollowing: boolean, currentUser: any): boolean {
    // Own profile - always viewable
    if (isOwnProfile) return true;

    // Admin/moderator access
    if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'moderator')) {
      return true;
    }

    // Public profiles
    if (user.profile.privacy_settings?.profile_visibility === 'public') {
      return true;
    }

    // Followers only
    if (user.profile.privacy_settings?.profile_visibility === 'followers_only' && isFollowing) {
      return true;
    }

    // Private profiles
    return false;
  }

  private async checkFollowingStatus(followerId: string, followedUserId: string): Promise<boolean> {
    try {
      const query = `
        SELECT id FROM follows 
        WHERE follower_user_id = $1 AND followed_user_id = $2 AND unfollowed_at IS NULL
      `;
      const result = await userRepository.db.query(query, [followerId, followedUserId]);
      return result.rows.length > 0;
    } catch (error) {
      logger.error('Failed to check following status', { error: error.message });
      return false;
    }
  }

  private async getFollowStats(userId: string): Promise<{ followers: number; following: number }> {
    try {
      const [followersResult, followingResult] = await Promise.all([
        userRepository.db.query(`
          SELECT COUNT(*) as count FROM follows 
          WHERE followed_user_id = $1 AND unfollowed_at IS NULL
        `, [userId]),
        userRepository.db.query(`
          SELECT COUNT(*) as count FROM follows 
          WHERE follower_user_id = $1 AND unfollowed_at IS NULL
        `, [userId])
      ]);

      return {
        followers: parseInt(followersResult.rows[0]?.count || '0'),
        following: parseInt(followingResult.rows[0]?.count || '0')
      };
    } catch (error) {
      logger.error('Failed to get follow stats', { error: error.message });
      return { followers: 0, following: 0 };
    }
  }

  private async createFollowRelationship(followerId: string, followedUserId: string): Promise<void> {
    const query = `
      INSERT INTO follows (follower_user_id, followed_user_id, created_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (follower_user_id, followed_user_id) 
      DO UPDATE SET unfollowed_at = NULL, created_at = NOW()
    `;
    await userRepository.db.query(query, [followerId, followedUserId]);
  }

  private async removeFollowRelationship(followerId: string, followedUserId: string): Promise<void> {
    const query = `
      UPDATE follows 
      SET unfollowed_at = NOW()
      WHERE follower_user_id = $1 AND followed_user_id = $2
    `;
    await userRepository.db.query(query, [followerId, followedUserId]);
  }

  private async getFollowersList(userId: string, limit: number, offset: number): Promise<{ users: any[]; total: number }> {
    const query = `
      SELECT 
        u.id, u.username, u.role, u.created_at,
        p.display_name, p.avatar_url, p.bio,
        COUNT(*) OVER() as total_count
      FROM follows f
      JOIN users u ON f.follower_user_id = u.id
      LEFT JOIN user_profiles p ON u.id = p.user_id
      WHERE f.followed_user_id = $1 AND f.unfollowed_at IS NULL
      ORDER BY f.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await userRepository.db.query(query, [userId, limit, offset]);
    const users = result.rows.map(row => ({
      id: row.id,
      username: row.username,
      role: row.role,
      created_at: row.created_at,
      profile: {
        display_name: row.display_name,
        avatar_url: row.avatar_url,
        bio: row.bio
      }
    }));

    const total = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;
    return { users, total };
  }

  private async getFollowingList(userId: string, limit: number, offset: number): Promise<{ users: any[]; total: number }> {
    const query = `
      SELECT 
        u.id, u.username, u.role, u.created_at,
        p.display_name, p.avatar_url, p.bio,
        COUNT(*) OVER() as total_count
      FROM follows f
      JOIN users u ON f.followed_user_id = u.id
      LEFT JOIN user_profiles p ON u.id = p.user_id
      WHERE f.follower_user_id = $1 AND f.unfollowed_at IS NULL
      ORDER BY f.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await userRepository.db.query(query, [userId, limit, offset]);
    const users = result.rows.map(row => ({
      id: row.id,
      username: row.username,
      role: row.role,
      created_at: row.created_at,
      profile: {
        display_name: row.display_name,
        avatar_url: row.avatar_url,
        bio: row.bio
      }
    }));

    const total = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;
    return { users, total };
  }

  private async updateCreatorProfileData(userId: string, updateData: any): Promise<any> {
    const setFields = [];
    const values = [];
    let valueIndex = 1;

    Object.entries(updateData).forEach(([key, value]) => {
      if (['content_categories', 'payout_method', 'social_links', 'branding'].includes(key)) {
        setFields.push(`${key} = $${valueIndex}`);
        values.push(JSON.stringify(value));
      } else {
        setFields.push(`${key} = $${valueIndex}`);
        values.push(value);
      }
      valueIndex++;
    });

    const query = `
      UPDATE creator_profiles 
      SET ${setFields.join(', ')}, updated_at = NOW()
      WHERE user_id = $${valueIndex}
      RETURNING *
    `;
    values.push(userId);

    const result = await userRepository.db.query(query, values);
    return result.rows[0];
  }

  private async getAdminUsersList(limit: number, offset: number, filters: { role?: string; status?: string }): Promise<{ users: any[]; total: number }> {
    let whereClause = 'WHERE u.deleted_at IS NULL';
    const params = [];
    let paramIndex = 1;

    if (filters.role) {
      whereClause += ` AND u.role = $${paramIndex}`;
      params.push(filters.role);
      paramIndex++;
    }

    if (filters.status) {
      whereClause += ` AND u.account_status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    const query = `
      SELECT 
        u.*, p.display_name, p.avatar_url,
        COUNT(*) OVER() as total_count
      FROM users u
      LEFT JOIN user_profiles p ON u.id = p.user_id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limit, offset);

    const result = await userRepository.db.query(query, params);
    const users = result.rows.map(row => ({
      id: row.id,
      email: row.email,
      username: row.username,
      role: row.role,
      account_status: row.account_status,
      email_verified: row.email_verified,
      created_at: row.created_at,
      last_login_at: row.last_login_at,
      profile: {
        display_name: row.display_name,
        avatar_url: row.avatar_url
      }
    }));

    const total = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;
    return { users, total };
  }

  private async updateUserStatusData(userId: string, status: string, reason: string, adminUserId: string): Promise<void> {
    await userRepository.db.transaction(async (client) => {
      // Update user status
      await client.query(`
        UPDATE users 
        SET account_status = $1, updated_at = NOW()
        WHERE id = $2
      `, [status, userId]);

      // Log the action
      await client.query(`
        INSERT INTO admin_actions (admin_user_id, target_user_id, action_type, details, created_at)
        VALUES ($1, $2, $3, $4, NOW())
      `, [adminUserId, userId, `status_change_${status}`, JSON.stringify({ reason })]);
    });
  }
}

// Export singleton instance
export const userController = new UserController();
export default UserController;