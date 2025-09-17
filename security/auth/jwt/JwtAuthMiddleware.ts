// 🔐 FANZ JWT Authentication Middleware
// Secure token validation with adult content platform support

import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  platform: string;
  ageVerified: boolean;
  permissions: string[];
  sessionId: string;
  iat: number;
  exp: number;
}

interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
  token?: string;
}

class FanzJwtAuthMiddleware {
  private redis: Redis;
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'fanz-super-secure-secret-key';
  private readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fanz-refresh-secret-key';
  
  // Adult platforms requiring age verification
  private readonly ADULT_PLATFORMS = [
    'boyfanz', 'girlfanz', 'daddyfanz', 'pupfanz',
    'taboofanz', 'transfanz', 'cougarfanz', 'fanzcock'
  ];

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    });
  }

  /**
   * Main authentication middleware
   */
  public authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const token = this.extractToken(req);
      
      if (!token) {
        return this.unauthorizedResponse(res, 'No token provided');
      }

      // Verify token
      const decoded = jwt.verify(token, this.JWT_SECRET) as JwtPayload;
      
      // Check if token is blacklisted
      const isBlacklisted = await this.isTokenBlacklisted(token);
      if (isBlacklisted) {
        return this.unauthorizedResponse(res, 'Token is invalid');
      }

      // Validate session
      const isValidSession = await this.validateSession(decoded.sessionId, decoded.userId);
      if (!isValidSession) {
        return this.unauthorizedResponse(res, 'Session is invalid');
      }

      // Adult platform age verification
      const platform = req.headers['x-platform'] as string || decoded.platform;
      if (this.ADULT_PLATFORMS.includes(platform) && !decoded.ageVerified) {
        return this.forbiddenResponse(res, 'Age verification required');
      }

      // Add user info to request
      req.user = decoded;
      req.token = token;
      
      // Update last activity
      await this.updateLastActivity(decoded.sessionId);
      
      next();
    } catch (error) {
      console.error('JWT Auth Error:', error);
      
      if (error instanceof jwt.JsonWebTokenError) {
        return this.unauthorizedResponse(res, 'Invalid token');
      }
      
      if (error instanceof jwt.TokenExpiredError) {
        return this.unauthorizedResponse(res, 'Token expired');
      }
      
      return this.unauthorizedResponse(res, 'Authentication failed');
    }
  };

  /**
   * Role-based authorization middleware
   */
  public authorize = (allowedRoles: string[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const user = req.user;
      
      if (!user) {
        return this.unauthorizedResponse(res, 'Authentication required');
      }

      if (!allowedRoles.includes(user.role)) {
        return this.forbiddenResponse(res, 'Insufficient permissions');
      }

      next();
    };
  };

  /**
   * Permission-based authorization
   */
  public requirePermission = (permission: string) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const user = req.user;
      
      if (!user) {
        return this.unauthorizedResponse(res, 'Authentication required');
      }

      if (!user.permissions.includes(permission)) {
        return this.forbiddenResponse(res, `Permission ${permission} required`);
      }

      next();
    };
  };

  /**
   * Adult content access verification
   */
  public requireAgeVerification = () => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const user = req.user;
      
      if (!user) {
        return this.unauthorizedResponse(res, 'Authentication required');
      }

      if (!user.ageVerified) {
        return res.status(451).json({
          error: 'Age Verification Required',
          message: 'Access to adult content requires age verification',
          code: 'AGE_VERIFICATION_REQUIRED',
          verificationUrl: '/api/auth/verify-age'
        });
      }

      next();
    };
  };

  /**
   * Generate JWT token
   */
  public generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: '24h',
      issuer: 'fanz-security',
      audience: payload.platform
    });
  }

  /**
   * Generate refresh token
   */
  public generateRefreshToken(userId: string, sessionId: string): string {
    return jwt.sign(
      { userId, sessionId, type: 'refresh' },
      this.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
  }

  /**
   * Refresh access token
   */
  public refreshToken = async (req: Request, res: Response) => {
    try {
      const refreshToken = req.body.refreshToken;
      
      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token required' });
      }

      const decoded = jwt.verify(refreshToken, this.JWT_REFRESH_SECRET) as any;
      
      if (decoded.type !== 'refresh') {
        return res.status(400).json({ error: 'Invalid token type' });
      }

      // Validate session
      const isValidSession = await this.validateSession(decoded.sessionId, decoded.userId);
      if (!isValidSession) {
        return res.status(401).json({ error: 'Session expired' });
      }

      // Get user data from session
      const userKey = `session:${decoded.sessionId}`;
      const userData = await this.redis.get(userKey);
      
      if (!userData) {
        return res.status(401).json({ error: 'Session not found' });
      }

      const user = JSON.parse(userData);
      
      // Generate new access token
      const newToken = this.generateToken({
        userId: user.userId,
        email: user.email,
        role: user.role,
        platform: user.platform,
        ageVerified: user.ageVerified,
        permissions: user.permissions,
        sessionId: decoded.sessionId
      });

      res.json({
        accessToken: newToken,
        tokenType: 'Bearer',
        expiresIn: '24h'
      });

    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(401).json({ error: 'Invalid refresh token' });
    }
  };

  /**
   * Logout and blacklist token
   */
  public logout = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const token = req.token;
      const user = req.user;

      if (token) {
        // Blacklist the token
        await this.blacklistToken(token);
      }

      if (user?.sessionId) {
        // Remove session
        await this.invalidateSession(user.sessionId);
      }

      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  };

  // Private helper methods
  private extractToken(req: Request): string | null {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    // Check for token in cookies
    return req.cookies?.token || null;
  }

  private async isTokenBlacklisted(token: string): Promise<boolean> {
    const blacklisted = await this.redis.get(`blacklist:${token}`);
    return blacklisted !== null;
  }

  private async blacklistToken(token: string): Promise<void> {
    // Blacklist for remaining token lifetime
    const decoded = jwt.decode(token) as any;
    const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
    
    if (expiresIn > 0) {
      await this.redis.setex(`blacklist:${token}`, expiresIn, 'true');
    }
  }

  private async validateSession(sessionId: string, userId: string): Promise<boolean> {
    const sessionKey = `session:${sessionId}`;
    const sessionData = await this.redis.get(sessionKey);
    
    if (!sessionData) return false;
    
    const session = JSON.parse(sessionData);
    return session.userId === userId && session.active;
  }

  private async invalidateSession(sessionId: string): Promise<void> {
    await this.redis.del(`session:${sessionId}`);
  }

  private async updateLastActivity(sessionId: string): Promise<void> {
    const sessionKey = `session:${sessionId}`;
    const sessionData = await this.redis.get(sessionKey);
    
    if (sessionData) {
      const session = JSON.parse(sessionData);
      session.lastActivity = new Date().toISOString();
      
      await this.redis.setex(sessionKey, 86400, JSON.stringify(session)); // 24 hours
    }
  }

  private unauthorizedResponse(res: Response, message: string) {
    return res.status(401).json({
      error: 'Unauthorized',
      message,
      code: 'AUTH_REQUIRED'
    });
  }

  private forbiddenResponse(res: Response, message: string) {
    return res.status(403).json({
      error: 'Forbidden',
      message,
      code: 'ACCESS_DENIED'
    });
  }
}

export default new FanzJwtAuthMiddleware();
export { FanzJwtAuthMiddleware, JwtPayload, AuthenticatedRequest };
