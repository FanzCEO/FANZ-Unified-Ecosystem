import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '../config';
import { Logger } from '../utils/logger';
import { redis } from '../config/redis';
import { 
  AuthenticationError, 
  ValidationError, 
  ConflictError,
  NotFoundError 
} from '../middleware/errorHandler';

const logger = new Logger('AuthService');

// JWT payload interface
export interface JWTPayload {
  userId: string;
  email: string;
  username: string;
  role: string;
  tokenFamily?: string;
  sessionId?: string;
}

// Token pair interface
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

// Authentication result interface
export interface AuthResult {
  user: {
    id: string;
    email: string;
    username: string;
    role: string;
    profile: any;
  };
  tokens: TokenPair;
  isNewUser?: boolean;
}

// Password requirements interface
interface PasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
}

export class AuthService {
  private readonly passwordRequirements: PasswordRequirements = {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true
  };

  // Generate JWT access token
  generateAccessToken(payload: JWTPayload): string {
    try {
      const token = jwt.sign(payload, config.JWT_SECRET, {
        expiresIn: config.JWT_EXPIRES_IN,
        issuer: 'fanz.eco',
        audience: 'fanz-api',
        algorithm: 'HS256'
      });

      logger.debug('Access token generated', { userId: payload.userId });
      return token;
    } catch (error) {
      logger.error('Failed to generate access token', { 
        error: error.message,
        userId: payload.userId 
      });
      throw new AuthenticationError('Token generation failed');
    }
  }

  // Generate JWT refresh token
  generateRefreshToken(payload: JWTPayload): string {
    try {
      const refreshPayload = {
        ...payload,
        tokenFamily: this.generateTokenFamily(),
        type: 'refresh'
      };

      const token = jwt.sign(refreshPayload, config.REFRESH_TOKEN_SECRET, {
        expiresIn: config.REFRESH_TOKEN_EXPIRES_IN,
        issuer: 'fanz.eco',
        audience: 'fanz-api',
        algorithm: 'HS256'
      });

      logger.debug('Refresh token generated', { userId: payload.userId });
      return token;
    } catch (error) {
      logger.error('Failed to generate refresh token', { 
        error: error.message,
        userId: payload.userId 
      });
      throw new AuthenticationError('Refresh token generation failed');
    }
  }

  // Verify JWT token
  async verifyToken(token: string, isRefreshToken: boolean = false): Promise<JWTPayload> {
    try {
      const secret = isRefreshToken ? config.REFRESH_TOKEN_SECRET : config.JWT_SECRET;
      
      const decoded = jwt.verify(token, secret, {
        issuer: 'fanz.eco',
        audience: 'fanz-api'
      }) as JWTPayload;

      // Check if token is blacklisted
      const isBlacklisted = await this.isTokenBlacklisted(token);
      if (isBlacklisted) {
        throw new AuthenticationError('Token has been revoked');
      }

      logger.debug('Token verified successfully', { 
        userId: decoded.userId,
        tokenType: isRefreshToken ? 'refresh' : 'access'
      });

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        logger.warn('Token expired', { token: token.substring(0, 20) + '...' });
        throw new AuthenticationError('Token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        logger.warn('Invalid token', { token: token.substring(0, 20) + '...' });
        throw new AuthenticationError('Invalid token');
      } else {
        logger.error('Token verification failed', { error: error.message });
        throw error;
      }
    }
  }

  // Generate token pair
  async generateTokenPair(user: any): Promise<TokenPair> {
    const sessionId = this.generateSessionId();
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      sessionId
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    // Store session in Redis
    await this.storeUserSession(user.id, sessionId, {
      accessToken: accessToken.substring(-10), // Store only last 10 chars for reference
      refreshToken: refreshToken.substring(-10),
      createdAt: new Date(),
      deviceInfo: null // Can be populated from request headers
    });

    // Calculate expiration time
    const expiresIn = this.parseExpirationTime(config.JWT_EXPIRES_IN);

    return {
      accessToken,
      refreshToken,
      expiresIn,
      tokenType: 'Bearer'
    };
  }

  // Refresh access token
  async refreshAccessToken(refreshToken: string): Promise<TokenPair> {
    try {
      const decoded = await this.verifyToken(refreshToken, true);
      
      // Check if refresh token family is still valid (for token rotation)
      const isValidFamily = await this.isValidTokenFamily(decoded.userId, decoded.tokenFamily);
      if (!isValidFamily) {
        // Possible token reuse attack - revoke all tokens
        await this.revokeAllUserTokens(decoded.userId);
        throw new AuthenticationError('Token reuse detected - all tokens revoked');
      }

      // Invalidate old refresh token
      await this.blacklistToken(refreshToken);

      // Generate new token pair
      const newPayload: JWTPayload = {
        userId: decoded.userId,
        email: decoded.email,
        username: decoded.username,
        role: decoded.role,
        sessionId: decoded.sessionId
      };

      const accessToken = this.generateAccessToken(newPayload);
      const newRefreshToken = this.generateRefreshToken(newPayload);

      // Update session
      await this.updateUserSession(decoded.userId, decoded.sessionId, {
        accessToken: accessToken.substring(-10),
        refreshToken: newRefreshToken.substring(-10),
        refreshedAt: new Date()
      });

      const expiresIn = this.parseExpirationTime(config.JWT_EXPIRES_IN);

      logger.info('Token refreshed successfully', { userId: decoded.userId });

      return {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn,
        tokenType: 'Bearer'
      };
    } catch (error) {
      logger.error('Token refresh failed', { error: error.message });
      throw error;
    }
  }

  // Hash password
  async hashPassword(password: string): Promise<string> {
    try {
      this.validatePassword(password);
      
      const saltRounds = config.BCRYPT_ROUNDS;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      logger.debug('Password hashed successfully');
      return hashedPassword;
    } catch (error) {
      logger.error('Password hashing failed', { error: error.message });
      throw error;
    }
  }

  // Verify password
  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      const isValid = await bcrypt.compare(plainPassword, hashedPassword);
      logger.debug('Password verification completed', { isValid });
      return isValid;
    } catch (error) {
      logger.error('Password verification failed', { error: error.message });
      return false;
    }
  }

  // Validate password strength
  validatePassword(password: string): void {
    const errors: string[] = [];

    if (password.length < this.passwordRequirements.minLength) {
      errors.push(`Password must be at least ${this.passwordRequirements.minLength} characters long`);
    }

    if (this.passwordRequirements.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (this.passwordRequirements.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (this.passwordRequirements.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (this.passwordRequirements.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    if (errors.length > 0) {
      throw new ValidationError('Password does not meet requirements: ' + errors.join(', '));
    }
  }

  // Blacklist token
  async blacklistToken(token: string): Promise<void> {
    try {
      const key = `blacklist:${this.hashToken(token)}`;
      const expiration = this.getTokenExpiration(token);
      const ttl = Math.max(0, Math.floor((expiration - Date.now()) / 1000));
      
      if (ttl > 0) {
        await redis.set(key, '1', ttl);
        logger.debug('Token blacklisted', { ttl });
      }
    } catch (error) {
      logger.error('Failed to blacklist token', { error: error.message });
    }
  }

  // Check if token is blacklisted
  async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      const key = `blacklist:${this.hashToken(token)}`;
      const result = await redis.get(key);
      return result !== null;
    } catch (error) {
      logger.error('Failed to check token blacklist', { error: error.message });
      return false;
    }
  }

  // Revoke all user tokens
  async revokeAllUserTokens(userId: string): Promise<void> {
    try {
      // Remove all user sessions
      await redis.del(`sessions:${userId}`);
      
      // Invalidate token families
      await redis.del(`token_families:${userId}`);
      
      logger.info('All user tokens revoked', { userId });
    } catch (error) {
      logger.error('Failed to revoke user tokens', { userId, error: error.message });
    }
  }

  // Store user session
  async storeUserSession(userId: string, sessionId: string, sessionData: any): Promise<void> {
    try {
      const key = `sessions:${userId}`;
      await redis.hset(key, sessionId, JSON.stringify(sessionData));
      await redis.expire(key, 7 * 24 * 60 * 60); // 7 days
      
      logger.debug('User session stored', { userId, sessionId });
    } catch (error) {
      logger.error('Failed to store user session', { userId, error: error.message });
    }
  }

  // Update user session
  async updateUserSession(userId: string, sessionId: string, updateData: any): Promise<void> {
    try {
      const key = `sessions:${userId}`;
      const existingData = await redis.hget(key, sessionId);
      
      if (existingData) {
        const sessionData = JSON.parse(existingData);
        const updatedData = { ...sessionData, ...updateData };
        await redis.hset(key, sessionId, JSON.stringify(updatedData));
        
        logger.debug('User session updated', { userId, sessionId });
      }
    } catch (error) {
      logger.error('Failed to update user session', { userId, error: error.message });
    }
  }

  // Get user sessions
  async getUserSessions(userId: string): Promise<any[]> {
    try {
      const key = `sessions:${userId}`;
      const sessions = await redis.hgetall(key);
      
      return Object.entries(sessions).map(([sessionId, data]) => ({
        sessionId,
        ...JSON.parse(data)
      }));
    } catch (error) {
      logger.error('Failed to get user sessions', { userId, error: error.message });
      return [];
    }
  }

  // Validate token family (for refresh token rotation)
  async isValidTokenFamily(userId: string, tokenFamily?: string): Promise<boolean> {
    if (!tokenFamily) return true;
    
    try {
      const key = `token_families:${userId}`;
      const validFamilies = await redis.smembers(key);
      return validFamilies.includes(tokenFamily);
    } catch (error) {
      logger.error('Failed to validate token family', { userId, error: error.message });
      return false;
    }
  }

  // Generate unique session ID
  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  // Generate unique token family
  private generateTokenFamily(): string {
    return `fam_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  // Hash token for storage (security)
  private hashToken(token: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // Get token expiration time
  private getTokenExpiration(token: string): number {
    try {
      const decoded = jwt.decode(token) as any;
      return decoded.exp * 1000;
    } catch {
      return 0;
    }
  }

  // Parse expiration time string to seconds
  private parseExpirationTime(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 900; // Default 15 minutes
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    const multipliers = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400
    };
    
    return value * (multipliers[unit as keyof typeof multipliers] || 60);
  }
}

// Export singleton instance
export const authService = new AuthService();
export default AuthService;