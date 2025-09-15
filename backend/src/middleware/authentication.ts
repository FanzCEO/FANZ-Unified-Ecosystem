import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: 'user' | 'creator' | 'admin';
        ageVerified?: boolean;
        ageVerifiedAt?: Date;
        age?: number;
        country?: string;
        verificationLevel?: 'basic' | 'premium';
        createdAt?: Date;
        // Creator-specific fields
        idVerified?: boolean;
        idVerifiedAt?: Date;
        fullName?: string;
        compliance2257Verified?: boolean;
        compliance2257ExpiresAt?: Date;
        taxFormOnFile?: boolean;
        taxFormType?: 'W9' | 'W8';
      };
    }
  }
}

/**
 * Middleware to authenticate users
 * In production, this would validate JWT tokens, session cookies, etc.
 */
export const authenticateUser = (req: Request, res: Response, next: NextFunction) => {
  // Mock authentication for development
  // In production, extract and validate JWT token
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      message: 'No authorization header provided'
    });
  }

  try {
    // Mock user data - in production, decode JWT and fetch user from database
    req.user = {
      id: 'user-' + Math.random().toString(36).substr(2, 9),
      email: 'user@example.com',
      role: 'user',
      ageVerified: true,
      ageVerifiedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      age: 25,
      country: 'US',
      verificationLevel: 'premium',
      createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // 90 days ago
    };

    logger.debug('User authenticated', {
      userId: req.user.id,
      role: req.user.role,
      path: req.path
    });

    next();

  } catch (error) {
    logger.error('Authentication failed', { error, authHeader: authHeader.substring(0, 20) + '...' });
    
    return res.status(401).json({
      success: false,
      error: 'Authentication failed',
      message: 'Invalid or expired token'
    });
  }
};

/**
 * Middleware to authenticate creators (users with creator role)
 */
export const authenticateCreator = (req: Request, res: Response, next: NextFunction) => {
  // First authenticate as user
  authenticateUser(req, res, (err) => {
    if (err) {
      return next(err);
    }

    // Check if user is a creator
    if (!req.user || req.user.role !== 'creator') {
      // Mock creator data for development
      req.user = {
        id: 'creator-' + Math.random().toString(36).substr(2, 9),
        email: 'creator@example.com',
        role: 'creator',
        ageVerified: true,
        ageVerifiedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        age: 28,
        country: 'US',
        verificationLevel: 'premium',
        createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
        // Creator-specific fields
        idVerified: true,
        idVerifiedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        fullName: 'Jane Creator',
        compliance2257Verified: true,
        compliance2257ExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        taxFormOnFile: true,
        taxFormType: 'W9'
      };
    }

    logger.debug('Creator authenticated', {
      creatorId: req.user.id,
      idVerified: req.user.idVerified,
      compliance2257Verified: req.user.compliance2257Verified
    });

    next();
  });
};

/**
 * Middleware to authenticate admins
 */
export const authenticateAdmin = (req: Request, res: Response, next: NextFunction) => {
  authenticateUser(req, res, (err) => {
    if (err) {
      return next(err);
    }

    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Admin privileges required'
      });
    }

    next();
  });
};