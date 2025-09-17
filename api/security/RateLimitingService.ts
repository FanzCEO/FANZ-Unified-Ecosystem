// 📊 FANZ API Rate Limiting Service  
// Advanced rate limiting with adult platform considerations

import Redis from 'ioredis';
import { Request, Response, NextFunction } from 'express';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}

interface RateLimitInfo {
  totalRequests: number;
  remainingRequests: number;
  resetTime: Date;
  retryAfter: number;
}

class FanzRateLimitingService {
  private redis: Redis;
  private readonly REDIS_PREFIX = 'fanz:rate_limit:';

  // Rate limit configurations for different endpoint types
  private readonly configs = {
    // General API endpoints
    general: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 1000,
      message: 'Too many requests. Please slow down.'
    },

    // Adult content endpoints (stricter)
    adultContent: {
      windowMs: 15 * 60 * 1000,
      maxRequests: 500,
      message: 'Adult content rate limit exceeded. Enhanced security measures active.'
    },

    // Authentication endpoints (very strict)
    authentication: {
      windowMs: 15 * 60 * 1000,
      maxRequests: 10,
      message: 'Too many authentication attempts. Please wait before trying again.'
    },

    // Payment processing (extremely strict)
    payment: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 50,
      message: 'Payment processing rate limit exceeded. Contact support if needed.'
    },

    // Content upload (moderate)
    upload: {
      windowMs: 15 * 60 * 1000,
      maxRequests: 100,
      message: 'Content upload rate limit exceeded. Please wait before uploading more.'
    },

    // Search and discovery
    search: {
      windowMs: 1 * 60 * 1000, // 1 minute
      maxRequests: 60,
      message: 'Search rate limit exceeded. Please slow down your search requests.'
    }
  };

  constructor() {
    // Initialize Redis connection
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
    });

    this.redis.on('error', (error) => {
      console.error('Redis connection error:', error);
    });
  }

  // Generate rate limit key based on IP, user ID, and endpoint type
  private generateKey(req: Request, type: string): string {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userId = (req as any).user?.id || 'anonymous';
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    // Create a more sophisticated key that considers multiple factors
    const baseKey = `${this.REDIS_PREFIX}${type}:${ip}:${userId}`;
    
    // Add additional context for adult platforms
    const platform = req.headers['x-platform'] as string;
    if (platform) {
      return `${baseKey}:${platform}`;
    }
    
    return baseKey;
  }

  // Determine rate limit type based on request
  private determineRateLimitType(req: Request): keyof typeof this.configs {
    const path = req.path.toLowerCase();
    const method = req.method.toLowerCase();
    const platform = req.headers['x-platform'] as string;

    // Authentication endpoints
    if (path.includes('/auth/') || path.includes('/login') || path.includes('/register')) {
      return 'authentication';
    }

    // Payment endpoints
    if (path.includes('/payment/') || path.includes('/billing/') || path.includes('/subscribe/')) {
      return 'payment';
    }

    // Content upload endpoints
    if ((method === 'post' || method === 'put') && 
        (path.includes('/upload/') || path.includes('/media/') || path.includes('/content/'))) {
      return 'upload';
    }

    // Search endpoints
    if (path.includes('/search/') || path.includes('/discover/') || path.includes('/explore/')) {
      return 'search';
    }

    // Adult content platforms
    const adultPlatforms = ['boyfanz', 'girlfanz', 'daddyfanz', 'pupfanz', 'taboofanz', 'transfanz', 'cougarfanz', 'fanzcock'];
    if (platform && adultPlatforms.includes(platform.toLowerCase())) {
      return 'adultContent';
    }

    return 'general';
  }

  // Apply rate limiting to request
  public async applyRateLimit(
    req: Request, 
    res: Response, 
    next: NextFunction
  ): Promise<void> {
    try {
      const rateLimitType = this.determineRateLimitType(req);
      const config = this.configs[rateLimitType];
      const key = this.generateKey(req, rateLimitType);

      const rateLimitInfo = await this.checkRateLimit(key, config);

      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': config.maxRequests.toString(),
        'X-RateLimit-Remaining': Math.max(0, rateLimitInfo.remainingRequests).toString(),
        'X-RateLimit-Reset': rateLimitInfo.resetTime.toISOString(),
        'X-RateLimit-Type': rateLimitType
      });

      // Check if rate limit exceeded
      if (rateLimitInfo.remainingRequests < 0) {
        res.set('Retry-After', rateLimitInfo.retryAfter.toString());
        
        // Log rate limit violations
        console.warn(`Rate limit exceeded: ${rateLimitType} - ${req.ip} - ${req.path}`);
        
        res.status(429).json({
          error: 'Rate Limit Exceeded',
          message: config.message,
          type: rateLimitType,
          limit: config.maxRequests,
          remaining: 0,
          resetTime: rateLimitInfo.resetTime,
          retryAfter: rateLimitInfo.retryAfter
        });
        return;
      }

      // Attach rate limit info to request for logging
      (req as any).rateLimit = rateLimitInfo;

      next();
      
    } catch (error) {
      console.error('Rate limiting error:', error);
      // On error, allow request to proceed but log the issue
      next();
    }
  }

  // Check rate limit for a specific key
  private async checkRateLimit(key: string, config: RateLimitConfig): Promise<RateLimitInfo> {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Use Redis pipeline for atomic operations
    const pipeline = this.redis.pipeline();
    
    // Remove old entries outside the current window
    pipeline.zremrangebyscore(key, 0, windowStart);
    
    // Count current requests in window
    pipeline.zcard(key);
    
    // Add current request timestamp
    pipeline.zadd(key, now, now);
    
    // Set expiry on the key
    pipeline.expire(key, Math.ceil(config.windowMs / 1000));
    
    const results = await pipeline.exec();
    
    const currentCount = (results?.[1]?.[1] as number) || 0;
    const remainingRequests = config.maxRequests - currentCount - 1;
    
    const resetTime = new Date(now + config.windowMs);
    const retryAfter = Math.ceil(config.windowMs / 1000);

    return {
      totalRequests: currentCount + 1,
      remainingRequests,
      resetTime,
      retryAfter
    };
  }

  // Get current rate limit status for a request
  public async getRateLimitStatus(req: Request): Promise<RateLimitInfo | null> {
    try {
      const rateLimitType = this.determineRateLimitType(req);
      const config = this.configs[rateLimitType];
      const key = this.generateKey(req, rateLimitType);

      return await this.checkRateLimit(key, config);
      
    } catch (error) {
      console.error('Error getting rate limit status:', error);
      return null;
    }
  }

  // Reset rate limit for a specific key (admin function)
  public async resetRateLimit(key: string): Promise<boolean> {
    try {
      await this.redis.del(`${this.REDIS_PREFIX}${key}`);
      return true;
    } catch (error) {
      console.error('Error resetting rate limit:', error);
      return false;
    }
  }

  // Get rate limit statistics
  public async getStatistics(): Promise<any> {
    try {
      const keys = await this.redis.keys(`${this.REDIS_PREFIX}*`);
      const stats: any = {};

      for (const key of keys) {
        const count = await this.redis.zcard(key);
        const parts = key.replace(this.REDIS_PREFIX, '').split(':');
        const type = parts[0];
        
        if (!stats[type]) {
          stats[type] = { keys: 0, totalRequests: 0 };
        }
        
        stats[type].keys++;
        stats[type].totalRequests += count;
      }

      return stats;
      
    } catch (error) {
      console.error('Error getting rate limit statistics:', error);
      return {};
    }
  }
}

export { FanzRateLimitingService, RateLimitConfig, RateLimitInfo };
export default new FanzRateLimitingService();
