import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// This file provides compatibility with the main auth middleware
// Import the proper JWTPayload from auth service
import { JWTPayload } from '../services/auth.service';

// Extend the JWTPayload to include additional user fields for compatibility
interface ExtendedUser extends JWTPayload {
  // Additional fields from the legacy user interface
  id?: string; // Alias for userId
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
    const mockUserId = 'user-' + Math.random().toString(36).substr(2, 9);
    req.user = {
      userId: mockUserId,
      id: mockUserId, // Legacy compatibility
      email: 'user@example.com',
      username: 'mockuser',
      role: 'user',
      ageVerified: true,
      ageVerifiedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      age: 25,
      country: 'US',
      verificationLevel: 'premium',
      createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // 90 days ago
    } as ExtendedUser;

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
      const mockCreatorId = 'creator-' + Math.random().toString(36).substr(2, 9);
      req.user = {
        userId: mockCreatorId,
        id: mockCreatorId, // Legacy compatibility
        email: 'creator@example.com',
        username: 'mockcreator',
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
      } as ExtendedUser;
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