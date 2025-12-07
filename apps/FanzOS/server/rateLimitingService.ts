import { Request, Response, NextFunction } from 'express';
import { redis } from './performanceService';

// In-memory rate limit store as fallback
const memoryRateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

// Advanced rate limiting with Redis
export const createRateLimit = (options: RateLimitOptions) => {
  const {
    windowMs,
    maxRequests,
    keyGenerator = (req) => req.ip,
    skipSuccessfulRequests = false,
    skipFailedRequests = false
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    const key = `rate_limit:${keyGenerator(req)}`;
    const now = Date.now();
    const window = Math.floor(now / windowMs);
    const windowKey = `${key}:${window}`;

    try {
      let count = 0;
      
      if (redis) {
        // Use Redis if available
        const currentCount = await redis.get(windowKey);
        count = parseInt(currentCount || '0');

        // Check if limit exceeded
        if (count >= maxRequests) {
          res.status(429).json({
            error: 'Too Many Requests',
            retryAfter: windowMs - (now % windowMs)
          });
          return;
        }

        // Increment counter
        await redis.incr(windowKey);
        await redis.expire(windowKey, Math.ceil(windowMs / 1000));
      } else {
        // Use in-memory fallback
        const resetTime = now + windowMs;
        const entry = memoryRateLimitStore.get(windowKey);
        
        if (entry && entry.resetTime > now) {
          count = entry.count;
        } else {
          // Reset or create new entry
          memoryRateLimitStore.set(windowKey, { count: 0, resetTime });
          count = 0;
        }
        
        // Check if limit exceeded
        if (count >= maxRequests) {
          res.status(429).json({
            error: 'Too Many Requests',
            retryAfter: windowMs - (now % windowMs)
          });
          return;
        }
        
        // Increment counter
        memoryRateLimitStore.set(windowKey, { count: count + 1, resetTime });
        
        // Clean up old entries periodically
        if (memoryRateLimitStore.size > 1000) {
          const entries = Array.from(memoryRateLimitStore.entries());
          for (const [k, v] of entries) {
            if (v.resetTime < now) {
              memoryRateLimitStore.delete(k);
            }
          }
        }
      }

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - count - 1));
      res.setHeader('X-RateLimit-Reset', now + (windowMs - (now % windowMs)));

      // Handle response counting
      res.on('finish', async () => {
        const shouldSkip = 
          (skipSuccessfulRequests && res.statusCode < 400) ||
          (skipFailedRequests && res.statusCode >= 400);

        if (shouldSkip) {
          if (redis) {
            await redis.decr(windowKey);
          } else {
            const entry = memoryRateLimitStore.get(windowKey);
            if (entry && entry.count > 0) {
              entry.count--;
              memoryRateLimitStore.set(windowKey, entry);
            }
          }
        }
      });

      next();
    } catch (error) {
      console.error('Rate limiting error:', error);
      next(); // Continue on rate limiting service failure
    }
  };
};

// Specific rate limiters for different endpoints
export const apiRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 1000,
});

export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // Strict limit for auth endpoints
});

export const uploadRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10,
});

export const strictRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
});