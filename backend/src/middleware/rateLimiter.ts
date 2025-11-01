import { rateLimit, Options } from 'express-rate-limit';
import { Request, Response, _NextFunction } from 'express';

// Default rate limit configuration
const defaultConfig: Partial<Options> = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: {
      message: 'Too many requests from this IP, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
      statusCode: 429
    }
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: {
        message: 'Too many requests from this IP, please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        statusCode: 429
      }
    });
  }
};

// Export function that creates rate limiter with custom options
export const rateLimiter = (options: Partial<Options> = {}) => {
  const config = { ...defaultConfig, ...options };
  return rateLimit(config);
};

// Pre-configured rate limiters for common use cases
export const strictRateLimit = rateLimiter({ max: 10, windowMs: 15 * 60 * 1000 });
export const moderateRateLimit = rateLimiter({ max: 50, windowMs: 15 * 60 * 1000 });
export const lenientRateLimit = rateLimiter({ max: 200, windowMs: 15 * 60 * 1000 });
