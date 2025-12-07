import { Request, Response, NextFunction } from "express";
import { logger } from "../logger";
import { AuthenticatedUser } from "./auth";

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
  message?: string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private options: Required<RateLimitOptions>;

  constructor(options: RateLimitOptions) {
    this.options = {
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      keyGenerator: (req) => req.ip || "anonymous",
      message: "Too many requests",
      ...options,
    };

    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime <= now) {
        this.store.delete(key);
      }
    }
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const key = this.options.keyGenerator(req);
      const now = Date.now();
      const resetTime = now + this.options.windowMs;

      let entry = this.store.get(key);
      if (!entry || entry.resetTime <= now) {
        entry = { count: 0, resetTime };
        this.store.set(key, entry);
      }

      entry.count++;

      // Set rate limit headers
      res.set({
        "X-RateLimit-Limit": this.options.maxRequests.toString(),
        "X-RateLimit-Remaining": Math.max(0, this.options.maxRequests - entry.count).toString(),
        "X-RateLimit-Reset": new Date(entry.resetTime).toISOString(),
      });

      if (entry.count > this.options.maxRequests) {
        logger.warn(`Rate limit exceeded for ${key}: ${entry.count}/${this.options.maxRequests} from ${req.ip} (${req.get("user-agent")})`);

        res.status(429).json({
          error: "Too Many Requests",
          message: this.options.message,
          retryAfter: Math.ceil((entry.resetTime - now) / 1000),
        });
        return;
      }

      // Track rate limit hits for analytics
      if (entry.count > this.options.maxRequests * 0.8) {
        logger.info(`Rate limit warning for ${key}: ${entry.count}/${this.options.maxRequests} (${(entry.count / this.options.maxRequests * 100).toFixed(1)}%)`);
      }

      next();
    };
  }
}

// Create rate limiters for different endpoints
export const globalRateLimit = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: process.env.NODE_ENV === "production" ? 1000 : 10000,
  keyGenerator: (req) => req.ip || "anonymous",
}).middleware();

export const authRateLimit = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 attempts per 15 minutes
  keyGenerator: (req) => `auth:${req.ip}`,
  message: "Too many authentication attempts, please try again later",
}).middleware();

export const apiRateLimit = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // 100 API calls per minute
  keyGenerator: (req) => `api:${(req.user as AuthenticatedUser)?.id || req.ip}`,
}).middleware();

export const uploadRateLimit = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 50, // 50 uploads per hour
  keyGenerator: (req) => `upload:${(req.user as AuthenticatedUser)?.id || req.ip}`,
  message: "Upload limit exceeded, please try again later",
}).middleware();
