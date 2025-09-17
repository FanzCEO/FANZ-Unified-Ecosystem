import { Request, Response, NextFunction } from 'express';
import rateLimit, { RateLimitRequestHandler, Options } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import * as jose from 'jose';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      rateLimit?: {
        limit: number;
        remaining: number;
        resetTime: number;
      };
    }
  }
}
import { RedisClientType } from 'redis';
import { rateLimitConfig } from '../config/rateLimitConfig';
import { 
  generateIPKey, 
  generateAccountKey, 
  generateUserKey,
  extractLoggingMetadata,
  maskForLogging 
} from './keyGenerators';
import { rateLimitMetrics } from '../monitoring/rateLimitMetrics';

// 🚦 Centralized Rate Limiter Factory for FANZ Auth Service
// Provides Redis-backed, configurable rate limiting with bypass logic

export interface RateLimiterOptions {
  windowMs: number;
  max: number;
  keyGenerator?: (req: Request) => string;
  category: 'sensitive' | 'token' | 'standard';
  name: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

let redisStore: RedisStore | undefined;

/**
 * Initialize the Redis store for rate limiting
 * Should be called after Redis client is ready
 */
export const initializeRateLimitStore = (redisClient: RedisClientType): void => {
  try {
    redisStore = new RedisStore({
      // Use the existing Redis client instance
      sendCommand: (...args: string[]) => redisClient.sendCommand(args),
      prefix: rateLimitConfig.redisPrefix,
    });
    
    if (rateLimitConfig.logging.enabled) {
      console.log('✅ Rate limit Redis store initialized successfully');
    }
  } catch (error) {
    console.error('❌ Failed to initialize rate limit Redis store:', error);
    // Continue without Redis store - will use memory store as fallback
  }
};

/**
 * Check if request should bypass rate limiting
 * Supports FanzFinance OS and other internal services
 */
const shouldBypassRateLimit = (req: Request): boolean => {
  if (!rateLimitConfig.bypass.enabled) {
    return false;
  }
  
  let bypassReason: string | undefined;
  
  // Check for API key bypass
  const apiKey = req.headers['x-api-key'] as string;
  if (apiKey && rateLimitConfig.bypass.apiKeyAllowlist.includes(apiKey)) {
    bypassReason = 'api-key';
  }
  
  // Check JWT-based bypass
  if (!bypassReason) {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];
      
      if (token) {
        try {
          const decoded = jose.decodeJwt(token);
          
          // Check for trusted audience
          if (decoded?.aud && rateLimitConfig.bypass.trustedAudiences.includes(decoded.aud as string)) {
            bypassReason = `jwt-audience-${decoded.aud}`;
          }
          
          // Check for service claim
          if (!bypassReason && decoded?.svc && decoded.svc === rateLimitConfig.bypass.serviceClaimValue) {
            bypassReason = `jwt-service-${decoded.svc}`;
          }
          
          // Check for internal service issuer
          if (!bypassReason && decoded?.iss && rateLimitConfig.bypass.trustedAudiences.includes(decoded.iss as string)) {
            bypassReason = `jwt-issuer-${decoded.iss}`;
          }
        } catch (error) {
          // Token parsing failed, continue with normal rate limiting
        }
      }
    } catch (error) {
      // Token parsing failed, continue with normal rate limiting
    }
  }
  
  if (bypassReason) {
    // Record bypass event
    const decoded = extractBypassUserId(req);
    rateLimitMetrics.recordRateLimitBypass(
      req.path,
      req.ip || 'unknown',
      bypassReason,
      decoded?.userId
    );
    return true;
  }
  
  return false;
};

const extractBypassUserId = (req: Request): { userId?: string } | null => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
      return jose.decodeJwt(token) as any;
    }
  } catch (error) {
    // Ignore
  }
  return null;
};

/**
 * Create standardized error handler for rate limit violations
 */
const createRateLimitHandler = (category: string, name: string) => {
  return (req: Request, res: Response) => {
    const metadata = extractLoggingMetadata(req);
    const resetTime = new Date(Date.now() + (req.rateLimit?.resetTime || 0));
    const retryAfterMs = resetTime.getTime() - Date.now();
    
    // Record metrics
    rateLimitMetrics.recordRateLimitExceeded({
      timestamp: new Date().toISOString(),
      category: category as 'sensitive' | 'token' | 'standard',
      endpoint: name,
      ip: req.ip || 'unknown',
      userId: metadata.userId,
      limit: req.rateLimit?.limit || 0,
      remaining: req.rateLimit?.remaining || 0,
      resetTime: resetTime.toISOString(),
      userAgent: metadata.userAgent
    });
    
    // Log rate limit exceeded event
    if (rateLimitConfig.logging.enabled) {
      const logLevel = rateLimitConfig.logging.level;
      const logMessage = `Rate limit exceeded: ${name}`;
      const logData = {
        ...metadata,
        category,
        limitName: name,
        limit: req.rateLimit?.limit || 'unknown',
        remaining: req.rateLimit?.remaining || 0,
        resetTime: resetTime.toISOString(),
        retryAfterMs
      };
      
      // Remove sensitive data from logs
      if (logData.userId) {
        logData.userId = maskForLogging(logData.userId, 6);
      }
      
      switch (logLevel) {
        case 'error':
          console.error(logMessage, logData);
          break;
        case 'warn':
          console.warn(logMessage, logData);
          break;
        case 'info':
          console.info(logMessage, logData);
          break;
        case 'debug':
          console.debug(logMessage, logData);
          break;
      }
    }
    
    // Send structured error response
    res.status(429).json({
      error: 'Rate limit exceeded',
      code: 'RATE_LIMITED',
      message: getCategoryMessage(category),
      category,
      retryAfterMs: Math.max(0, retryAfterMs),
      meta: {
        route: name,
        limit: req.rateLimit?.limit,
        windowMs: req.rateLimit?.resetTime,
        resetTime: resetTime.toISOString()
      },
      ecosystem: 'fanz-unified'
    });
  };
};

/**
 * Get human-readable message based on rate limit category
 */
const getCategoryMessage = (category: string): string => {
  switch (category) {
    case 'sensitive':
      return 'Too many authentication attempts. Please wait before trying again.';
    case 'token':
      return 'Too many token requests. Please wait before trying again.';
    case 'standard':
      return 'Too many requests. Please wait before trying again.';
    default:
      return 'Rate limit exceeded. Please wait before trying again.';
  }
};

/**
 * Create a rate limiter with standardized configuration
 */
export const createRateLimiter = (options: RateLimiterOptions): RateLimitRequestHandler => {
  const {
    windowMs,
    max,
    keyGenerator = (req) => generateIPKey({ req }),
    category,
    name,
    skipSuccessfulRequests = false,
    skipFailedRequests = false
  } = options;
  
  const rateLimiterOptions: Partial<Options> = {
    windowMs,
    max,
    keyGenerator,
    standardHeaders: true, // Send standard RateLimit-* headers
    legacyHeaders: true,   // Also send X-RateLimit-* headers for compatibility
    skipSuccessfulRequests,
    skipFailedRequests,
    skip: shouldBypassRateLimit,
    handler: createRateLimitHandler(category, name),
    store: redisStore, // Will use memory store if Redis not available
    // Request property name for rate limit info
    requestPropertyName: 'rateLimit',
  };
  
  return rateLimit(rateLimiterOptions);
};

// 📊 Pre-configured Rate Limiters for Common Use Cases

/**
 * Sensitive operations limiter (IP-based)
 * For login, registration, password resets
 */
export const createSensitiveLimiterIP = (name: string): RateLimitRequestHandler => {
  return createRateLimiter({
    windowMs: rateLimitConfig.sensitive.windowMs,
    max: rateLimitConfig.sensitive.maxPerIP,
    keyGenerator: (req) => generateIPKey({ req, prefix: 'sensitive:' }),
    category: 'sensitive',
    name: `${name}:ip`,
    skipSuccessfulRequests: false // Always count attempts for security
  });
};

/**
 * Sensitive operations limiter (Account-based)
 * For login, registration based on email/username
 */
export const createSensitiveLimiterAccount = (name: string): RateLimitRequestHandler => {
  return createRateLimiter({
    windowMs: rateLimitConfig.sensitive.windowMs,
    max: rateLimitConfig.sensitive.maxPerAccount,
    keyGenerator: (req) => generateAccountKey({ req, prefix: 'sensitive:' }),
    category: 'sensitive',
    name: `${name}:account`,
    skipSuccessfulRequests: false
  });
};

/**
 * Long window sensitive operations limiter (IP-based)
 * Secondary protection against distributed attacks
 */
export const createSensitiveLimiterIPLong = (name: string): RateLimitRequestHandler => {
  return createRateLimiter({
    windowMs: rateLimitConfig.sensitive.longWindowMs,
    max: rateLimitConfig.sensitive.longMaxPerIP,
    keyGenerator: (req) => generateIPKey({ req, prefix: 'sensitive:long:' }),
    category: 'sensitive',
    name: `${name}:ip:long`,
    skipSuccessfulRequests: false
  });
};

/**
 * Token operations limiter (IP-based)
 * For token refresh, validation
 */
export const createTokenLimiterIP = (name: string): RateLimitRequestHandler => {
  return createRateLimiter({
    windowMs: rateLimitConfig.token.windowMs,
    max: rateLimitConfig.token.maxPerIP,
    keyGenerator: (req) => generateIPKey({ req, prefix: 'token:' }),
    category: 'token',
    name: `${name}:ip`
  });
};

/**
 * Token operations limiter (User-based)
 * For authenticated token operations
 */
export const createTokenLimiterUser = (name: string): RateLimitRequestHandler => {
  return createRateLimiter({
    windowMs: rateLimitConfig.token.windowMs,
    max: rateLimitConfig.token.maxPerUser,
    keyGenerator: (req) => generateUserKey({ req, prefix: 'token:' }),
    category: 'token',
    name: `${name}:user`
  });
};

/**
 * Long window token operations limiter (User-based)
 * Secondary protection for high-frequency token operations
 */
export const createTokenLimiterUserLong = (name: string): RateLimitRequestHandler => {
  return createRateLimiter({
    windowMs: rateLimitConfig.token.longWindowMs,
    max: rateLimitConfig.token.longMaxPerUser,
    keyGenerator: (req) => generateUserKey({ req, prefix: 'token:long:' }),
    category: 'token',
    name: `${name}:user:long`
  });
};

/**
 * Standard operations limiter (IP-based)
 * For logout, profile access, platform management
 */
export const createStandardLimiterIP = (name: string): RateLimitRequestHandler => {
  return createRateLimiter({
    windowMs: rateLimitConfig.standard.windowMs,
    max: rateLimitConfig.standard.maxPerIP,
    keyGenerator: (req) => generateIPKey({ req, prefix: 'standard:' }),
    category: 'standard',
    name: `${name}:ip`
  });
};

/**
 * Utility to apply multiple rate limiters to a route
 * All limiters must pass for the request to proceed
 */
export const applyMultipleRateLimiters = (
  limiters: RateLimitRequestHandler[]
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!rateLimitConfig.enabled) {
      return next();
    }
    
    let currentIndex = 0;
    
    const runNextLimiter = (error?: any) => {
      if (error) {
        // If any limiter rejects the request, stop here
        return;
      }
      
      if (currentIndex >= limiters.length) {
        // All limiters passed, proceed
        return next();
      }
      
      const limiter = limiters[currentIndex++];
      if (limiter) {
        limiter(req, res, runNextLimiter);
      } else {
        runNextLimiter();
      }
    };
    
    runNextLimiter();
  };
};

export default {
  createRateLimiter,
  createSensitiveLimiterIP,
  createSensitiveLimiterAccount,
  createSensitiveLimiterIPLong,
  createTokenLimiterIP,
  createTokenLimiterUser,
  createTokenLimiterUserLong,
  createStandardLimiterIP,
  applyMultipleRateLimiters,
  initializeRateLimitStore
};
