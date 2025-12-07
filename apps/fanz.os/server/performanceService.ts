import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';

// Initialize Redis for caching and rate limiting with fallback
let redis: Redis | null = null;

try {
  if (process.env.REDIS_URL || process.env.NODE_ENV === 'development') {
    redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    redis.on('error', (err) => {
      console.log('Redis connection error (non-fatal):', err.message);
      redis = null;
    });
  }
} catch (error) {
  console.log('Redis not available, using in-memory fallback');
  redis = null;
}

// In-memory cache fallback
const memoryCache = new Map<string, { data: any; expires: number }>();

// Performance monitoring middleware
export const performanceMonitor = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      duration,
      statusCode: res.statusCode,
      timestamp: new Date().toISOString()
    };

    // Log performance metrics
    console.log(`${req.method} ${req.url} - ${duration}ms [${res.statusCode}]`);

    // Log slow requests for optimization
    if (duration > 1000) {
      console.warn(`🐌 Slow request: ${req.method} ${req.url} - ${duration}ms`);
    }

    // Store metrics in Redis for analytics (if available)
    if (redis) {
      redis.lpush('performance_metrics', JSON.stringify(logData)).catch(() => {});
      redis.ltrim('performance_metrics', 0, 999).catch(() => {}); // Keep last 1000 entries
    }
  });

  next();
};

// Response caching middleware
export const cacheResponse = (duration: number = 300) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = `cache:${req.originalUrl}`;
    
    try {
      // Try Redis first, fallback to memory cache
      let cachedResponse: string | null = null;
      
      if (redis) {
        cachedResponse = await redis.get(cacheKey);
      } else {
        // Use memory cache fallback
        const cached = memoryCache.get(cacheKey);
        if (cached && cached.expires > Date.now()) {
          cachedResponse = JSON.stringify(cached.data);
        } else if (cached) {
          memoryCache.delete(cacheKey);
        }
      }
      
      if (cachedResponse) {
        const parsed = JSON.parse(cachedResponse);
        res.set(parsed.headers);
        res.status(parsed.statusCode).send(parsed.body);
        return;
      }
    } catch (error) {
      // Continue without cache on error
    }

    // Override res.send to cache the response
    const originalSend = res.send;
    res.send = function(body) {
      // Cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const cacheData = {
          statusCode: res.statusCode,
          headers: res.getHeaders(),
          body: body
        };
        
        if (redis) {
          redis.setex(cacheKey, duration, JSON.stringify(cacheData))
            .catch(() => {});
        } else {
          // Use memory cache fallback
          memoryCache.set(cacheKey, {
            data: cacheData,
            expires: Date.now() + (duration * 1000)
          });
          
          // Clean up expired entries periodically
          if (memoryCache.size > 100) {
            const now = Date.now();
            const entries = Array.from(memoryCache.entries());
            for (const [key, value] of entries) {
              if (value.expires < now) {
                memoryCache.delete(key);
              }
            }
          }
        }
      }
      
      return originalSend.call(this, body);
    };

    next();
  };
};

// Request compression and optimization
export const optimizeRequest = (req: Request, res: Response, next: NextFunction) => {
  // Set security and performance headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';");
  
  // Enable gzip compression for text responses
  if (req.headers['accept-encoding']?.includes('gzip')) {
    res.setHeader('Content-Encoding', 'gzip');
  }

  next();
};

// Memory usage monitoring
export const monitorMemory = () => {
  setInterval(() => {
    const memUsage = process.memoryUsage();
    const memData = {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024),
      timestamp: new Date().toISOString()
    };

    // Log memory usage
    if (memData.heapUsed > 500) { // Alert if heap usage > 500MB
      console.warn(`⚠️  High memory usage: ${memData.heapUsed}MB heap used`);
    }

    // Store in Redis for monitoring (if available)
    if (redis) {
      redis.lpush('memory_metrics', JSON.stringify(memData)).catch(() => {});
      redis.ltrim('memory_metrics', 0, 99).catch(() => {}); // Keep last 100 entries
    }
  }, 30000); // Check every 30 seconds
};

export { redis };