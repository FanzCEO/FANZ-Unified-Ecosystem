/**
 * Verification Service
 * Handles email verification tokens, password reset tokens, and 2FA setup tokens
 */

import crypto from 'crypto';
import { db } from '../config/database';
import { Logger } from '../utils/logger';
import { emailService } from './email.service';
import { config } from '../config';

const logger = new Logger('VerificationService');

export type TokenType = 'email_verification' | 'password_reset' | '2fa_setup';

export interface VerificationToken {
  id: string;
  userId: string;
  token: string;
  type: TokenType;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

export class VerificationService {

  /**
   * Generate a secure random token
   */
  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create a verification token
   */
  async createVerificationToken(
    userId: string,
    type: TokenType,
    expirationHours: number = 24
  ): Promise<VerificationToken> {
    try {
      const token = this.generateToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expirationHours);

      const result = await db.query(
        `INSERT INTO verification_tokens (user_id, token, type, expires_at)
         VALUES ($1, $2, $3, $4)
         RETURNING id, user_id as "userId", token, type, expires_at as "expiresAt",
                   used_at as "usedAt", created_at as "createdAt"`,
        [userId, token, type, expiresAt]
      );

      logger.info('Verification token created', { userId, type, expiresAt });

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to create verification token', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        type
      });
      throw error;
    }
  }

  /**
   * Verify and consume a token
   */
  async verifyToken(token: string, type: TokenType): Promise<VerificationToken | null> {
    try {
      // Find the token
      const result = await db.query(
        `SELECT id, user_id as "userId", token, type, expires_at as "expiresAt",
                used_at as "usedAt", created_at as "createdAt"
         FROM verification_tokens
         WHERE token = $1 AND type = $2`,
        [token, type]
      );

      if (result.rows.length === 0) {
        logger.warn('Verification token not found', { token: token.substring(0, 8), type });
        return null;
      }

      const tokenData: VerificationToken = result.rows[0];

      // Check if token is already used
      if (tokenData.usedAt) {
        logger.warn('Verification token already used', {
          tokenId: tokenData.id,
          usedAt: tokenData.usedAt
        });
        return null;
      }

      // Check if token is expired
      if (new Date() > new Date(tokenData.expiresAt)) {
        logger.warn('Verification token expired', {
          tokenId: tokenData.id,
          expiresAt: tokenData.expiresAt
        });
        return null;
      }

      // Mark token as used
      await db.query(
        `UPDATE verification_tokens
         SET used_at = NOW()
         WHERE id = $1`,
        [tokenData.id]
      );

      logger.info('Verification token verified successfully', {
        tokenId: tokenData.id,
        userId: tokenData.userId,
        type
      });

      return tokenData;
    } catch (error) {
      logger.error('Failed to verify token', {
        error: error instanceof Error ? error.message : String(error),
        type
      });
      throw error;
    }
  }

  /**
   * Invalidate all tokens for a user of a specific type
   */
  async invalidateUserTokens(userId: string, type: TokenType): Promise<void> {
    try {
      await db.query(
        `UPDATE verification_tokens
         SET used_at = NOW()
         WHERE user_id = $1 AND type = $2 AND used_at IS NULL`,
        [userId, type]
      );

      logger.info('User tokens invalidated', { userId, type });
    } catch (error) {
      logger.error('Failed to invalidate user tokens', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        type
      });
      throw error;
    }
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(userId: string, email: string, username: string): Promise<void> {
    try {
      // Invalidate any existing email verification tokens
      await this.invalidateUserTokens(userId, 'email_verification');

      // Create new verification token
      const tokenData = await this.createVerificationToken(userId, 'email_verification', 24);

      // Build verification URL
      const verificationUrl = `${config.FRONTEND_URL}/verify-email?token=${tokenData.token}`;

      // Send email
      await emailService.sendVerificationEmail(email, {
        username,
        verificationUrl,
        expirationHours: 24
      });

      logger.info('Email verification sent', { userId, email });
    } catch (error) {
      logger.error('Failed to send email verification', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        email
      });
      throw error;
    }
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<{ success: boolean; userId?: string; message: string }> {
    try {
      // Verify the token
      const tokenData = await this.verifyToken(token, 'email_verification');

      if (!tokenData) {
        return {
          success: false,
          message: 'Invalid or expired verification token'
        };
      }

      // Update user's email_verified status
      await db.query(
        `UPDATE users
         SET email_verified = true, updated_at = NOW()
         WHERE id = $1`,
        [tokenData.userId]
      );

      // Get user info for welcome email
      const userResult = await db.query(
        `SELECT email, username FROM users WHERE id = $1`,
        [tokenData.userId]
      );

      if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        // Send welcome email
        await emailService.sendWelcomeEmail(user.email, user.username);
      }

      logger.info('Email verified successfully', { userId: tokenData.userId });

      return {
        success: true,
        userId: tokenData.userId,
        message: 'Email verified successfully'
      };
    } catch (error) {
      logger.error('Email verification failed', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(userId: string, email: string, username: string): Promise<void> {
    try {
      // Invalidate any existing password reset tokens
      await this.invalidateUserTokens(userId, 'password_reset');

      // Create new password reset token (expires in 1 hour)
      const tokenData = await this.createVerificationToken(userId, 'password_reset', 1);

      // Build reset URL
      const resetUrl = `${config.FRONTEND_URL}/reset-password?token=${tokenData.token}`;

      // Send email
      await emailService.sendPasswordResetEmail(email, {
        username,
        resetUrl,
        expirationHours: 1
      });

      logger.info('Password reset email sent', { userId, email });
    } catch (error) {
      logger.error('Failed to send password reset email', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        email
      });
      throw error;
    }
  }

  /**
   * Verify password reset token
   */
  async verifyPasswordResetToken(token: string): Promise<{ success: boolean; userId?: string; message: string }> {
    try {
      // Verify the token
      const tokenData = await this.verifyToken(token, 'password_reset');

      if (!tokenData) {
        return {
          success: false,
          message: 'Invalid or expired password reset token'
        };
      }

      return {
        success: true,
        userId: tokenData.userId,
        message: 'Token verified successfully'
      };
    } catch (error) {
      logger.error('Password reset token verification failed', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Clean up expired tokens (should be run periodically)
   */
  async cleanupExpiredTokens(): Promise<number> {
    try {
      const result = await db.query(
        `DELETE FROM verification_tokens
         WHERE expires_at < NOW() - INTERVAL '7 days'`
      );

      logger.info('Expired tokens cleaned up', { count: result.rowCount });

      return result.rowCount || 0;
    } catch (error) {
      logger.error('Failed to clean up expired tokens', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Get token statistics for monitoring
   */
  async getTokenStats(): Promise<{
    active: number;
    expired: number;
    used: number;
    byType: Record<TokenType, number>;
  }> {
    try {
      const result = await db.query(`
        SELECT
          COUNT(*) FILTER (WHERE used_at IS NULL AND expires_at > NOW()) as active,
          COUNT(*) FILTER (WHERE used_at IS NULL AND expires_at <= NOW()) as expired,
          COUNT(*) FILTER (WHERE used_at IS NOT NULL) as used,
          COUNT(*) FILTER (WHERE type = 'email_verification') as email_verification,
          COUNT(*) FILTER (WHERE type = 'password_reset') as password_reset,
          COUNT(*) FILTER (WHERE type = '2fa_setup') as "2fa_setup"
        FROM verification_tokens
      `);

      const row = result.rows[0];

      return {
        active: parseInt(row.active),
        expired: parseInt(row.expired),
        used: parseInt(row.used),
        byType: {
          email_verification: parseInt(row.email_verification),
          password_reset: parseInt(row.password_reset),
          '2fa_setup': parseInt(row['2fa_setup'])
        }
      };
    } catch (error) {
      logger.error('Failed to get token stats', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
}

// Singleton instance
export const verificationService = new VerificationService();

export default VerificationService;
