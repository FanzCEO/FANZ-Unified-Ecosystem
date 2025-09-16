import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger';
import { authService, JWTPayload } from '../services/auth.service';
import { AuthenticationError, AuthorizationError } from './errorHandler';

const logger = new Logger('AuthMiddleware');

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      token?: string;
    }
  }
}

// Extract token from request headers
function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return null;
  }
  
  // Check for Bearer token format
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    return parts[1];
  }
  
  return null;
}

// Authentication middleware - requires valid JWT
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      throw new AuthenticationError('No authentication token provided');
    }
    
    // Verify the token
    const payload = await authService.verifyToken(token, false);
    
    // Attach user info to request
    req.user = payload;
    req.token = token;
    
    logger.debug('User authenticated successfully', { 
      userId: payload.userId,
      role: payload.role 
    });
    
    next();
  } catch (error) {
    logger.warn('Authentication failed', { 
      error: error.message,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    if (error instanceof AuthenticationError) {
      return res.status(401).json({
        error: {
          message: error.message,
          code: 'AUTHENTICATION_ERROR',
          statusCode: 401
        }
      });
    }
    
    next(error);
  }
};

// Optional authentication - continues even if token is invalid
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = extractToken(req);
    
    if (token) {
      try {
        const payload = await authService.verifyToken(token, false);
        req.user = payload;
        req.token = token;
        
        logger.debug('Optional auth - user authenticated', { 
          userId: payload.userId 
        });
      } catch (error) {
        logger.debug('Optional auth - invalid token ignored', { 
          error: error.message 
        });
        // Continue without setting user
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

// Role-based authorization middleware
export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      logger.warn('Authorization attempted without authentication', { 
        roles: allowedRoles,
        ip: req.ip 
      });
      return res.status(401).json({
        error: {
          message: 'Authentication required',
          code: 'AUTHENTICATION_ERROR',
          statusCode: 401
        }
      });
    }
    
    const userRole = req.user.role;
    
    if (!allowedRoles.includes(userRole)) {
      logger.warn('Access denied - insufficient permissions', {
        userId: req.user.userId,
        userRole,
        requiredRoles: allowedRoles
      });
      
      return res.status(403).json({
        error: {
          message: 'Insufficient permissions',
          code: 'AUTHORIZATION_ERROR',
          statusCode: 403
        }
      });
    }
    
    logger.debug('Authorization successful', {
      userId: req.user.userId,
      userRole,
      endpoint: req.originalUrl
    });
    
    next();
  };
};

// Check if user owns the resource
export const authorizeOwnership = (resourceUserIdParam: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: {
          message: 'Authentication required',
          code: 'AUTHENTICATION_ERROR',
          statusCode: 401
        }
      });
    }
    
    const resourceUserId = req.params[resourceUserIdParam];
    const currentUserId = req.user.userId;
    const userRole = req.user.role;
    
    // Admins and moderators can access any resource
    if (['admin', 'super_admin', 'moderator'].includes(userRole)) {
      return next();
    }
    
    // Check if user owns the resource
    if (resourceUserId !== currentUserId) {
      logger.warn('Access denied - resource ownership check failed', {
        currentUserId,
        resourceUserId,
        userRole
      });
      
      return res.status(403).json({
        error: {
          message: 'You can only access your own resources',
          code: 'OWNERSHIP_ERROR',
          statusCode: 403
        }
      });
    }
    
    next();
  };
};

// Admin-only middleware
export const requireAdmin = authorize('admin', 'super_admin');

// Moderator+ middleware
export const requireModerator = authorize('admin', 'super_admin', 'moderator');

// Creator-only middleware
export const requireCreator = authorize('creator', 'admin', 'super_admin');

// Role-based requirement function
export const requireRole = (...roles: string[]) => authorize(...roles);

// Ownership requirement function 
export const requireOwnership = (param?: string) => authorizeOwnership(param);

// Premium user middleware
export const requirePremium = authorize('premium_fan', 'creator', 'admin', 'super_admin');

// Rate limiting by user ID
export const rateLimitByUser = (maxRequests: number, windowMs: number) => {
  const userLimits = new Map<string, { count: number; resetTime: number }>();
  
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(); // Skip rate limiting for unauthenticated users
    }
    
    const userId = req.user.userId;
    const now = Date.now();
    const userLimit = userLimits.get(userId);
    
    if (!userLimit || now > userLimit.resetTime) {
      // Reset or initialize limit
      userLimits.set(userId, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }
    
    if (userLimit.count >= maxRequests) {
      logger.warn('User rate limit exceeded', {
        userId,
        count: userLimit.count,
        limit: maxRequests
      });
      
      return res.status(429).json({
        error: {
          message: 'Rate limit exceeded',
          code: 'RATE_LIMIT_ERROR',
          statusCode: 429,
          retryAfter: Math.ceil((userLimit.resetTime - now) / 1000)
        }
      });
    }
    
    userLimit.count++;
    next();
  };
};

// Setup authentication (legacy function for compatibility)
export const setupAuth = () => {
  logger.info('Authentication middleware initialized');
  return authenticate;
};

export default authenticate;
