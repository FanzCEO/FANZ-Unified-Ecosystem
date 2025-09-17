import { BaseRepository } from '../config/database';
import { Logger } from '../utils/logger';
import { ConflictError, NotFoundError, DatabaseError, ValidationError } from '../middleware/errorHandler';

const logger = new Logger('UserModel');

// User interfaces
export interface User {
  id: string;
  email: string;
  username: string;
  password_hash: string;
  role: string;
  email_verified: boolean;
  phone_verified: boolean;
  two_factor_enabled: boolean;
  account_status: 'active' | 'suspended' | 'banned' | 'pending_verification';
  last_login_at?: Date;
  failed_login_attempts: number;
  locked_until?: Date;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
  bio?: string;
  avatar_url?: string;
  cover_image_url?: string;
  birth_date?: Date;
  location?: string;
  website?: string;
  social_links: Record<string, string>;
  privacy_settings: Record<string, any>;
  notification_settings: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface CreatorProfile {
  id: string;
  user_id: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  verification_documents: string[];
  content_categories: string[];
  subscription_price?: number;
  tip_minimum?: number;
  commission_rate: number;
  payout_method?: Record<string, any>;
  social_links: Record<string, string>;
  branding: Record<string, any>;
  analytics_enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserWithProfile extends User {
  profile: UserProfile;
}

export interface CreateUserInput {
  email: string;
  username: string;
  password_hash: string;
  role: string;
  profile: {
    display_name: string;
    bio?: string;
    birth_date?: Date;
    location?: string;
    website?: string;
    social_links?: Record<string, string>;
  };
}

export interface UserStats {
  total_content: number;
  total_followers: number;
  total_following: number;
  total_revenue?: number;
  total_tips_received?: number;
  total_subscriptions?: number;
  engagement_rate?: number;
  last_activity?: Date;
}

export class UserRepository extends BaseRepository {
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly LOCK_DURATION = 30 * 60 * 1000; // 30 minutes

  // Create new user with profile
  async createUser(userData: CreateUserInput): Promise<UserWithProfile> {
    try {
      // Check if email already exists
      const existingEmail = await this.findByEmail(userData.email);
      if (existingEmail) {
        throw new ConflictError('Email already registered');
      }

      // Check if username already exists
      const existingUsername = await this.findByUsername(userData.username);
      if (existingUsername) {
        throw new ConflictError('Username already taken');
      }

      // Start transaction
      const result = await this.db.transaction(async (client) => {
        // Create user
        const userQuery = `
          INSERT INTO users (
            email, username, password_hash, role,
            email_verified, account_status, failed_login_attempts
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `;
        
        const userResult = await client.query(userQuery, [
          userData.email,
          userData.username,
          userData.password_hash,
          userData.role,
          false, // email_verified
          'active', // account_status
          0 // failed_login_attempts
        ]);

        const user = userResult.rows[0];

        // Create user profile
        const profileQuery = `
          INSERT INTO user_profiles (
            user_id, display_name, bio, birth_date, 
            location, website, social_links,
            privacy_settings, notification_settings
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *
        `;

        const defaultPrivacySettings = {
          profile_visibility: 'public',
          email_visibility: 'private',
          show_online_status: true,
          allow_direct_messages: true
        };

        const defaultNotificationSettings = {
          email_notifications: true,
          push_notifications: true,
          marketing_emails: false,
          activity_notifications: true
        };

        const profileResult = await client.query(profileQuery, [
          user.id,
          userData.profile.display_name,
          userData.profile.bio || null,
          userData.profile.birth_date || null,
          userData.profile.location || null,
          userData.profile.website || null,
          JSON.stringify(userData.profile.social_links || {}),
          JSON.stringify(defaultPrivacySettings),
          JSON.stringify(defaultNotificationSettings)
        ]);

        const profile = profileResult.rows[0];

        // If creator, create creator profile
        if (userData.role === 'creator') {
          const creatorQuery = `
            INSERT INTO creator_profiles (
              user_id, verification_status, content_categories,
              commission_rate, analytics_enabled
            ) VALUES ($1, $2, $3, $4, $5)
            RETURNING *
          `;

          await client.query(creatorQuery, [
            user.id,
            'pending',
            JSON.stringify([]),
            0.20, // 20% platform commission
            true
          ]);
        }

        return { ...user, profile };
      });

      logger.info('User created successfully', {
        userId: result.id,
        email: result.email,
        role: result.role
      });

      return result;
    } catch (error) {
      logger.error('Failed to create user', {
        error: error.message,
        email: userData.email
      });
      throw error;
    }
  }

  // Find user by email
  async findByEmail(email: string): Promise<User | null> {
    try {
      const query = `
        SELECT * FROM users 
        WHERE email = $1 AND deleted_at IS NULL
      `;
      const result = await this.db.query(query, [email.toLowerCase()]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Failed to find user by email', {
        error: error.message,
        email
      });
      throw new DatabaseError('Failed to find user');
    }
  }

  // Find user by username
  async findByUsername(username: string): Promise<User | null> {
    try {
      const query = `
        SELECT * FROM users 
        WHERE username = $1 AND deleted_at IS NULL
      `;
      const result = await this.db.query(query, [username.toLowerCase()]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Failed to find user by username', {
        error: error.message,
        username
      });
      throw new DatabaseError('Failed to find user');
    }
  }

  // Find user by ID with profile
  async findByIdWithProfile(userId: string): Promise<UserWithProfile | null> {
    try {
      const query = `
        SELECT 
          u.*,
          p.id as profile_id,
          p.display_name,
          p.bio,
          p.avatar_url,
          p.cover_image_url,
          p.birth_date,
          p.location,
          p.website,
          p.social_links,
          p.privacy_settings,
          p.notification_settings,
          p.created_at as profile_created_at,
          p.updated_at as profile_updated_at
        FROM users u
        LEFT JOIN user_profiles p ON u.id = p.user_id
        WHERE u.id = $1 AND u.deleted_at IS NULL
      `;
      
      const result = await this.db.query(query, [userId]);
      const row = result.rows[0];
      
      if (!row) return null;

      // Structure the response
      const user: UserWithProfile = {
        id: row.id,
        email: row.email,
        username: row.username,
        password_hash: row.password_hash,
        role: row.role,
        email_verified: row.email_verified,
        phone_verified: row.phone_verified,
        two_factor_enabled: row.two_factor_enabled,
        account_status: row.account_status,
        last_login_at: row.last_login_at,
        failed_login_attempts: row.failed_login_attempts,
        locked_until: row.locked_until,
        created_at: row.created_at,
        updated_at: row.updated_at,
        deleted_at: row.deleted_at,
        profile: {
          id: row.profile_id,
          user_id: row.id,
          display_name: row.display_name,
          bio: row.bio,
          avatar_url: row.avatar_url,
          cover_image_url: row.cover_image_url,
          birth_date: row.birth_date,
          location: row.location,
          website: row.website,
          social_links: row.social_links || {},
          privacy_settings: row.privacy_settings || {},
          notification_settings: row.notification_settings || {},
          created_at: row.profile_created_at,
          updated_at: row.profile_updated_at
        }
      };

      return user;
    } catch (error) {
      logger.error('Failed to find user by ID with profile', {
        error: error.message,
        userId
      });
      throw new DatabaseError('Failed to find user');
    }
  }

  // Get creator profile
  async getCreatorProfile(userId: string): Promise<CreatorProfile | null> {
    try {
      const query = `
        SELECT * FROM creator_profiles 
        WHERE user_id = $1
      `;
      const result = await this.db.query(query, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Failed to get creator profile', {
        error: error.message,
        userId
      });
      return null;
    }
  }

  // Update user profile
  async updateProfile(userId: string, profileData: Partial<UserProfile>): Promise<UserProfile | null> {
    try {
      const setFields = [];
      const values = [];
      let valueIndex = 1;

      // Build dynamic update query
      Object.entries(profileData).forEach(([key, value]) => {
        if (key !== 'id' && key !== 'user_id' && key !== 'created_at') {
          if (key === 'social_links' || key === 'privacy_settings' || key === 'notification_settings') {
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
        throw new ValidationError('No valid fields to update');
      }

      const query = `
        UPDATE user_profiles 
        SET ${setFields.join(', ')}, updated_at = NOW()
        WHERE user_id = $${valueIndex}
        RETURNING *
      `;
      values.push(userId);

      const result = await this.db.query(query, values);
      
      logger.info('User profile updated', { userId });
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Failed to update user profile', {
        error: error.message,
        userId
      });
      throw error;
    }
  }

  // Update login attempt
  async updateLoginAttempt(userId: string, success: boolean): Promise<void> {
    try {
      if (success) {
        // Reset failed attempts on successful login
        const query = `
          UPDATE users 
          SET failed_login_attempts = 0, 
              locked_until = NULL,
              last_login_at = NOW(),
              updated_at = NOW()
          WHERE id = $1
        `;
        await this.db.query(query, [userId]);
      } else {
        // Increment failed attempts
        const query = `
          UPDATE users 
          SET failed_login_attempts = failed_login_attempts + 1,
              locked_until = CASE 
                WHEN failed_login_attempts + 1 >= $2 
                THEN NOW() + INTERVAL '${this.LOCK_DURATION} milliseconds'
                ELSE locked_until
              END,
              updated_at = NOW()
          WHERE id = $1
        `;
        await this.db.query(query, [userId, this.MAX_FAILED_ATTEMPTS]);
      }
    } catch (error) {
      logger.error('Failed to update login attempt', {
        error: error.message,
        userId,
        success
      });
    }
  }

  // Check if user is locked
  async isUserLocked(userId: string): Promise<boolean> {
    try {
      const query = `
        SELECT locked_until FROM users 
        WHERE id = $1 AND locked_until > NOW()
      `;
      const result = await this.db.query(query, [userId]);
      return result.rows.length > 0;
    } catch (error) {
      logger.error('Failed to check user lock status', {
        error: error.message,
        userId
      });
      return false;
    }
  }

  // Get user statistics
  async getUserStats(userId: string): Promise<UserStats> {
    try {
      const queries = await Promise.allSettled([
        // Total content
        this.db.query(`
          SELECT COUNT(*) as count FROM content 
          WHERE creator_id = $1 AND deleted_at IS NULL
        `, [userId]),
        
        // Total followers
        this.db.query(`
          SELECT COUNT(*) as count FROM follows 
          WHERE followed_user_id = $1 AND unfollowed_at IS NULL
        `, [userId]),
        
        // Total following
        this.db.query(`
          SELECT COUNT(*) as count FROM follows 
          WHERE follower_user_id = $1 AND unfollowed_at IS NULL
        `, [userId]),
        
        // Total revenue (for creators)
        this.db.query(`
          SELECT COALESCE(SUM(amount), 0) as total FROM transactions 
          WHERE recipient_id = $1 AND status = 'completed' 
          AND type IN ('tip', 'subscription', 'content_purchase')
        `, [userId]),
        
        // Last activity
        this.db.query(`
          SELECT MAX(created_at) as last_activity FROM (
            SELECT created_at FROM content WHERE creator_id = $1
            UNION ALL
            SELECT created_at FROM transactions WHERE sender_id = $1 OR recipient_id = $1
            UNION ALL
            SELECT created_at FROM follows WHERE follower_user_id = $1
          ) as activities
        `, [userId])
      ]);

      // Extract results safely
      const stats: UserStats = {
        total_content: 0,
        total_followers: 0,
        total_following: 0,
        total_revenue: 0,
        last_activity: null
      };

      if (queries[0].status === 'fulfilled') {
        stats.total_content = parseInt(queries[0].value.rows[0]?.count || '0');
      }
      
      if (queries[1].status === 'fulfilled') {
        stats.total_followers = parseInt(queries[1].value.rows[0]?.count || '0');
      }
      
      if (queries[2].status === 'fulfilled') {
        stats.total_following = parseInt(queries[2].value.rows[0]?.count || '0');
      }
      
      if (queries[3].status === 'fulfilled') {
        stats.total_revenue = parseFloat(queries[3].value.rows[0]?.total || '0');
      }
      
      if (queries[4].status === 'fulfilled') {
        stats.last_activity = queries[4].value.rows[0]?.last_activity || null;
      }

      return stats;
    } catch (error) {
      logger.error('Failed to get user stats', {
        error: error.message,
        userId
      });
      // Return default stats on error
      return {
        total_content: 0,
        total_followers: 0,
        total_following: 0,
        total_revenue: 0
      };
    }
  }

  // Search users
  async searchUsers(query: string, options: {
    role?: string;
    verified?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ users: UserWithProfile[]; total: number }> {
    try {
      const { role, verified, limit = 20, offset = 0 } = options;
      
      let whereClause = 'WHERE u.deleted_at IS NULL';
      const params = [`%${query}%`];
      let paramIndex = 2;

      // Add role filter
      if (role) {
        whereClause += ` AND u.role = $${paramIndex}`;
        params.push(role);
        paramIndex++;
      }

      // Add verification filter
      if (verified !== undefined) {
        whereClause += ` AND u.email_verified = $${paramIndex}`;
        params.push(String(verified));
        paramIndex++;
      }

      // Search query
      const searchQuery = `
        SELECT 
          u.*,
          p.id as profile_id,
          p.display_name,
          p.bio,
          p.avatar_url,
          p.cover_image_url,
          p.location,
          p.website,
          p.social_links,
          COUNT(*) OVER() as total_count
        FROM users u
        LEFT JOIN user_profiles p ON u.id = p.user_id
        ${whereClause}
        AND (
          u.username ILIKE $1 OR 
          u.email ILIKE $1 OR 
          p.display_name ILIKE $1
        )
        ORDER BY 
          CASE 
            WHEN u.username ILIKE $1 THEN 1
            WHEN p.display_name ILIKE $1 THEN 2
            ELSE 3
          END,
          u.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      
      params.push(String(limit), String(offset));
      const result = await this.db.query(searchQuery, params);

      const users = result.rows.map(row => ({
        id: row.id,
        email: row.email,
        username: row.username,
        password_hash: row.password_hash,
        role: row.role,
        email_verified: row.email_verified,
        phone_verified: row.phone_verified,
        two_factor_enabled: row.two_factor_enabled,
        account_status: row.account_status,
        last_login_at: row.last_login_at,
        failed_login_attempts: row.failed_login_attempts,
        locked_until: row.locked_until,
        created_at: row.created_at,
        updated_at: row.updated_at,
        profile: {
          id: row.profile_id,
          user_id: row.id,
          display_name: row.display_name,
          bio: row.bio,
          avatar_url: row.avatar_url,
          cover_image_url: row.cover_image_url,
          birth_date: null,
          location: row.location,
          website: row.website,
          social_links: row.social_links || {},
          privacy_settings: {},
          notification_settings: {},
          created_at: row.created_at,
          updated_at: row.updated_at
        }
      }));

      const total = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;

      return { users, total };
    } catch (error) {
      logger.error('Failed to search users', {
        error: error.message,
        query
      });
      throw new DatabaseError('Failed to search users');
    }
  }

  // Soft delete user
  async deleteUser(userId: string): Promise<boolean> {
    try {
      const query = `
        UPDATE users 
        SET deleted_at = NOW(), updated_at = NOW()
        WHERE id = $1 AND deleted_at IS NULL
      `;
      
      const result = await this.db.query(query, [userId]);
      
      logger.info('User soft deleted', { userId });
      return result.rowCount > 0;
    } catch (error) {
      logger.error('Failed to delete user', {
        error: error.message,
        userId
      });
      throw new DatabaseError('Failed to delete user');
    }
  }
}

// Export singleton instance
export const userRepository = new UserRepository();
export default UserRepository;