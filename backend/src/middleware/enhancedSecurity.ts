import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import bcrypt from 'bcrypt';
import { Logger } from '../utils/logger';
import { SecureRandom } from './secureRandom';

const logger = new Logger('EnhancedSecurity');

// =====================================================
// ENHANCED RATE LIMITING CONFIGURATIONS
// =====================================================

/**
 * Standard API rate limiting - applies to all routes
 */
export const standardRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per 15 minutes per IP
  message: {
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests from this IP, please try again later',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('Standard rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method
    });
    
    res.status(429).json({
      success: false,
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later',
      retryAfter: 900
    });
  }
});

/**
 * Authentication endpoints - strict rate limiting
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 auth attempts per 15 minutes per IP
  skipSuccessfulRequests: true,
  message: {
    success: false,
    error: 'AUTH_RATE_LIMIT_EXCEEDED',
    message: 'Too many authentication attempts, please try again later'
  },
  handler: (req: Request, res: Response) => {
    logger.warn('Authentication rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      email: req.body?.email,
      path: req.path
    });
    
    res.status(429).json({
      success: false,
      error: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later',
      retryAfter: 900
    });
  }
});

/**
 * Payment endpoints - enhanced rate limiting
 */
export const paymentRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 payment requests per hour per IP
  message: {
    success: false,
    error: 'PAYMENT_RATE_LIMIT_EXCEEDED',
    message: 'Too many payment attempts, please contact support'
  },
  handler: (req: Request, res: Response) => {
    logger.error('Payment rate limit exceeded - potential fraud', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: (req as any).user?.userId,
      path: req.path,
      amount: req.body?.amount
    });
    
    res.status(429).json({
      success: false,
      error: 'PAYMENT_RATE_LIMIT_EXCEEDED',
      message: 'Too many payment attempts, please contact support',
      retryAfter: 3600
    });
  }
});

/**
 * Content creation - moderate rate limiting
 */
export const contentRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 content posts per minute per IP
  message: {
    success: false,
    error: 'CONTENT_RATE_LIMIT_EXCEEDED',
    message: 'Too many content submissions, please slow down'
  },
  handler: (req: Request, res: Response) => {
    logger.warn('Content rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: (req as any).user?.userId,
      path: req.path
    });
    
    res.status(429).json({
      success: false,
      error: 'CONTENT_RATE_LIMIT_EXCEEDED',
      message: 'Too many content submissions, please slow down',
      retryAfter: 60
    });
  }
});

/**
 * User interactions - lenient rate limiting
 */
export const userInteractionRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 interactions per minute per IP
  message: {
    success: false,
    error: 'INTERACTION_RATE_LIMIT_EXCEEDED',
    message: 'Too many interactions, please slow down'
  },
  handler: (req: Request, res: Response) => {
    logger.warn('User interaction rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: (req as any).user?.userId,
      path: req.path
    });
    
    res.status(429).json({
      success: false,
      error: 'INTERACTION_RATE_LIMIT_EXCEEDED',
      message: 'Too many interactions, please slow down',
      retryAfter: 60
    });
  }
});

/**
 * Admin operations - very strict rate limiting
 */
export const adminRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 admin operations per minute per IP
  message: {
    success: false,
    error: 'ADMIN_RATE_LIMIT_EXCEEDED',
    message: 'Too many administrative actions, please slow down'
  },
  handler: (req: Request, res: Response) => {
    logger.warn('Admin rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: (req as any).user?.userId,
      path: req.path
    });
    
    res.status(429).json({
      success: false,
      error: 'ADMIN_RATE_LIMIT_EXCEEDED',
      message: 'Too many administrative actions, please slow down',
      retryAfter: 60
    });
  }
});

// =====================================================
// SLOWDOWN MIDDLEWARE
// =====================================================

/**
 * Progressive slowdown middleware
 */
export const progressiveSlowdown = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Allow 50 requests per windowMs without delay
  delayMs: 500, // Add 500ms delay per request after delayAfter
  maxDelayMs: 10000 // Maximum delay of 10 seconds
});

// =====================================================
// SECURE PASSWORD HASHING
// =====================================================

/**
 * Enhanced password hashing with sufficient computational effort
 */
export class SecurePasswordHashing {
  private static readonly SALT_ROUNDS = 12; // Increased from default 10
  private static readonly MIN_ROUNDS = 10;
  private static readonly MAX_ROUNDS = 15;

  /**
   * Hash password with secure bcrypt settings
   */
  static async hashPassword(password: string, customRounds?: number): Promise<string> {
    const rounds = customRounds || this.SALT_ROUNDS;
    
    if (rounds < this.MIN_ROUNDS || rounds > this.MAX_ROUNDS) {
      throw new Error(`Salt rounds must be between ${this.MIN_ROUNDS} and ${this.MAX_ROUNDS}`);
    }

    try {
      const salt = await bcrypt.genSalt(rounds);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      logger.debug('Password hashed successfully', {
        rounds,
        hashLength: hashedPassword.length
      });
      
      return hashedPassword;
    } catch (error) {
      logger.error('Password hashing failed', { error });
      throw new Error('Password hashing failed');
    }
  }

  /**
   * Verify password against hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      const isValid = await bcrypt.compare(password, hash);
      
      logger.debug('Password verification completed', {
        isValid,
        hashLength: hash.length
      });
      
      return isValid;
    } catch (error) {
      logger.error('Password verification failed', { error });
      return false;
    }
  }

  /**
   * Check if hash needs rehashing (e.g., salt rounds changed)
   */
  static needsRehashing(hash: string, customRounds?: number): boolean {
    const targetRounds = customRounds || this.SALT_ROUNDS;
    const currentRounds = bcrypt.getRounds(hash);
    
    return currentRounds < targetRounds;
  }

  /**
   * Generate secure temporary password
   */
  static generateTempPassword(length: number = 12): string {
    return SecureRandom.password(length, {
      includeNumbers: true,
      includeSymbols: true,
      includeLowercase: true,
      includeUppercase: true
    });
  }
}

// =====================================================
// SECURITY VALIDATION MIDDLEWARE
// =====================================================

/**
 * Enhanced input validation with security checks
 */
export const securityValidation = (req: Request, res: Response, next: NextFunction) => {
  // Check for common attack patterns
  const suspiciousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /onload=/gi,
    /onerror=/gi,
    /\bUNION\b.*\bSELECT\b/gi,
    /\bDROP\b.*\bTABLE\b/gi,
    /\bINSERT\b.*\bINTO\b/gi,
    /\bDELETE\b.*\bFROM\b/gi
  ];

  const checkForSuspiciousContent = (obj: any, path: string = ''): boolean => {
    if (typeof obj === 'string') {
      return suspiciousPatterns.some(pattern => pattern.test(obj));
    }

    if (Array.isArray(obj)) {
      return obj.some((item, index) => 
        checkForSuspiciousContent(item, `${path}[${index}]`)
      );
    }

    if (obj && typeof obj === 'object') {
      return Object.entries(obj).some(([key, value]) => 
        checkForSuspiciousContent(value, path ? `${path}.${key}` : key)
      );
    }

    return false;
  };

  // Check request body
  if (req.body && checkForSuspiciousContent(req.body)) {
    logger.warn('Suspicious content detected in request body', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      body: req.body
    });

    return res.status(400).json({
      success: false,
      error: 'SECURITY_VALIDATION_FAILED',
      message: 'Request contains potentially malicious content'
    });
  }

  // Check query parameters
  if (req.query && checkForSuspiciousContent(req.query)) {
    logger.warn('Suspicious content detected in query parameters', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      query: req.query
    });

    return res.status(400).json({
      success: false,
      error: 'SECURITY_VALIDATION_FAILED',
      message: 'Request contains potentially malicious content'
    });
  }

  next();
};

// =====================================================
// COMPREHENSIVE SECURITY MIDDLEWARE APPLICATION
// =====================================================

/**
 * Apply security middleware based on route type
 */
export const applySecurityByRoute = (routeType: 'auth' | 'payment' | 'content' | 'user' | 'admin' | 'standard') => {
  const middlewares: any[] = [securityValidation];

  switch (routeType) {
    case 'auth':
      middlewares.push(authRateLimit);
      break;
    case 'payment':
      middlewares.push(paymentRateLimit);
      break;
    case 'content':
      middlewares.push(contentRateLimit);
      break;
    case 'user':
      middlewares.push(userInteractionRateLimit);
      break;
    case 'admin':
      middlewares.push(adminRateLimit);
      break;
    default:
      middlewares.push(standardRateLimit);
  }

  return middlewares;
};

// All exports are already declared above with export const
