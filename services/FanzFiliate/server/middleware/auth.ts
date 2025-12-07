import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { storage } from '../storage';
import type { User } from '@shared/schema';

// Environment validation
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_ISS = process.env.JWT_ISS;
const JWT_AUD = process.env.JWT_AUD;

if (!JWT_SECRET || !JWT_ISS || !JWT_AUD) {
  throw new Error('JWT configuration missing: JWT_SECRET, JWT_ISS, JWT_AUD are required');
}

// JWT payload schema
const JWTPayloadSchema = z.object({
  sub: z.string(), // user ID
  email: z.string().email(),
  role: z.enum(['affiliate', 'advertiser', 'admin']),
  ssoUserId: z.string().optional(),
  iss: z.string(),
  aud: z.string(),
  exp: z.number(),
  iat: z.number(),
});

type JWTPayload = z.infer<typeof JWTPayloadSchema>;

// Extend Request type to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: User;
      userId?: string;
    }
  }
}

/**
 * JWT Authentication Middleware
 * Validates JWT tokens and loads user data
 */
export const authenticateJWT = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      res.status(401).json({ 
        error: 'Authentication required', 
        code: 'MISSING_TOKEN' 
      });
      return;
    }

    // Verify and decode JWT
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: JWT_ISS,
      audience: JWT_AUD,
    }) as any;

    // Validate JWT payload structure
    const payload = JWTPayloadSchema.parse(decoded);

    // Load user from database
    const user = await storage.getUser(payload.sub);
    if (!user || !user.isActive) {
      res.status(401).json({ 
        error: 'Invalid user or user deactivated', 
        code: 'USER_INVALID' 
      });
      return;
    }

    // Attach user to request
    req.user = user;
    req.userId = user.id;

    next();
  } catch (error) {
    console.error('JWT Authentication error:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ 
        error: 'Invalid token', 
        code: 'INVALID_TOKEN' 
      });
    } else if (error instanceof z.ZodError) {
      res.status(401).json({ 
        error: 'Malformed token payload', 
        code: 'MALFORMED_TOKEN' 
      });
    } else {
      res.status(500).json({ 
        error: 'Authentication service error', 
        code: 'AUTH_ERROR' 
      });
    }
  }
};

/**
 * Role-based Authorization Middleware Factory
 */
export const requireRole = (...roles: Array<'affiliate' | 'advertiser' | 'admin'>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ 
        error: 'Authentication required', 
        code: 'NOT_AUTHENTICATED' 
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ 
        error: 'Insufficient permissions', 
        code: 'INSUFFICIENT_ROLE',
        required: roles,
        current: req.user.role
      });
      return;
    }

    next();
  };
};

/**
 * KYC Status Validation Middleware
 */
export const requireKYCStatus = (minStatus: 'unverified' | 'initiated' | 'in_review' | 'approved') => {
  const statusOrder = ['unverified', 'initiated', 'in_review', 'approved'];
  const minIndex = statusOrder.indexOf(minStatus);

  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ 
        error: 'Authentication required', 
        code: 'NOT_AUTHENTICATED' 
      });
      return;
    }

    const userStatusIndex = statusOrder.indexOf(req.user.kycStatus);
    if (userStatusIndex < minIndex) {
      res.status(403).json({ 
        error: 'KYC verification required', 
        code: 'KYC_REQUIRED',
        required: minStatus,
        current: req.user.kycStatus,
        kycTier: req.user.kycTier
      });
      return;
    }

    next();
  };
};

/**
 * KYC Tier Validation Middleware
 */
export const requireKYCTier = (minTier: number) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ 
        error: 'Authentication required', 
        code: 'NOT_AUTHENTICATED' 
      });
      return;
    }

    if (req.user.kycTier < minTier) {
      res.status(403).json({ 
        error: `KYC Tier ${minTier} required`, 
        code: 'KYC_TIER_REQUIRED',
        required: minTier,
        current: req.user.kycTier
      });
      return;
    }

    next();
  };
};

/**
 * Affiliate Self-Access Validation
 * Ensures affiliates can only access their own data
 */
export const requireAffiliateAccess = (paramName: string = 'affiliateId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ 
        error: 'Authentication required', 
        code: 'NOT_AUTHENTICATED' 
      });
      return;
    }

    const requestedId = req.params[paramName] || req.query[paramName] || req.body[paramName];
    
    // Admins can access any affiliate data
    if (req.user.role === 'admin') {
      next();
      return;
    }

    // Affiliates can only access their own data
    if (req.user.role === 'affiliate' && req.user.id !== requestedId) {
      res.status(403).json({ 
        error: 'Access denied: Can only access own data', 
        code: 'ACCESS_DENIED' 
      });
      return;
    }

    next();
  };
};

/**
 * Optional Authentication Middleware
 * Loads user if token is present but doesn't require it
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      next();
      return;
    }

    // Verify and decode JWT
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: JWT_ISS,
      audience: JWT_AUD,
    }) as any;

    // Validate JWT payload structure
    const payload = JWTPayloadSchema.parse(decoded);

    // Load user from database
    const user = await storage.getUser(payload.sub);
    if (user && user.isActive) {
      req.user = user;
      req.userId = user.id;
    }

    next();
  } catch (error) {
    // Silently continue without user for optional auth
    next();
  }
};

/**
 * Generate JWT Token for User
 */
export const generateTokens = (user: User) => {
  const payload: Omit<JWTPayload, 'exp' | 'iat'> = {
    sub: user.id,
    email: user.email,
    role: user.role,
    ssoUserId: user.ssoUserId || undefined,
    iss: JWT_ISS!,
    aud: JWT_AUD!,
  };

  const accessTTL = process.env.JWT_ACCESS_TTL || '15m';
  const refreshTTL = process.env.JWT_REFRESH_TTL || '7d';

  const accessToken = jwt.sign(payload, JWT_SECRET!, {
    expiresIn: accessTTL,
  } as jwt.SignOptions);

  const refreshToken = jwt.sign(payload, JWT_SECRET!, {
    expiresIn: refreshTTL,
  } as jwt.SignOptions);

  return {
    accessToken,
    refreshToken,
    expiresIn: accessTTL,
  };
};

/**
 * API Rate Limiting Middleware
 * Simple in-memory rate limiting by IP and user
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export const rateLimit = (maxRequests: number = 100, windowMs: number = 60000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.user?.id || req.ip || 'unknown';
    const now = Date.now();
    
    const record = rateLimitStore.get(key);
    
    if (!record || now > record.resetTime) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      next();
      return;
    }
    
    if (record.count >= maxRequests) {
      res.status(429).json({
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT',
        retryAfter: Math.ceil((record.resetTime - now) / 1000)
      });
      return;
    }
    
    record.count++;
    next();
  };
};

/**
 * HMAC Webhook Signature Validation
 */
export const validateWebhookSignature = (secretEnvVar: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const secret = process.env[secretEnvVar];
    if (!secret) {
      res.status(500).json({ 
        error: 'Webhook secret not configured', 
        code: 'CONFIG_ERROR' 
      });
      return;
    }

    const signature = req.headers['x-signature'] || req.headers['x-hub-signature-256'];
    if (!signature) {
      res.status(401).json({ 
        error: 'Missing webhook signature', 
        code: 'MISSING_SIGNATURE' 
      });
      return;
    }

    // Implementation would depend on specific webhook provider
    // This is a placeholder for HMAC validation
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    const providedSignature = Array.isArray(signature) ? signature[0] : signature;
    const cleanSignature = providedSignature.replace(/^sha256=/, '');

    if (!crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(cleanSignature, 'hex')
    )) {
      res.status(401).json({ 
        error: 'Invalid webhook signature', 
        code: 'INVALID_SIGNATURE' 
      });
      return;
    }

    next();
  };
};
