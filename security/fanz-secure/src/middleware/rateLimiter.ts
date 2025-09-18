/**
 * @fanz/secure - Enterprise Rate Limiting Middleware
 * Tiered rate limiting with Redis backend and FanzDash integration
 */

import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis, RateLimiterMemory } from 'rate-limiter-flexible';
import { createClient } from 'redis';
import { config } from '../config.js';
import { SecurityEvent, SecurityEventType, SecuritySeverity, RateLimitInfo } from '../types.js';
import { createSecurityLogger } from '../utils/logger.js';
import { emitSecurityEvent } from '../utils/securityEvents.js';

// ===============================
// TYPES & INTERFACES
// ===============================

interface RateLimitTierConfig {
  name: string;
  points: number;
  duration: number;
  blockDuration: number;
  execEvenly: boolean;
}

interface RateLimitKey {
  ip: string;
  userId?: string;
  sessionId?: string;
  deviceId?: string;
}

interface RateLimitResult {
  allowed: boolean;
  tier: string;
  limit: number;
  remaining: number;
  resetTime: Date;
  blockDuration?: number;
}

type RateLimitTierName = 'auth' | 'payment' | 'standard' | 'webhook';

// ===============================
// RATE LIMITER CLASS
// ===============================

class FanzRateLimiter {
  private limiters: Map<string, RateLimiterRedis | RateLimiterMemory> = new Map();
  private redisClient?: any;
  private logger = createSecurityLogger('RateLimiter');
  
  constructor() {
    this.initializeRateLimiters();
  }

  private async initializeRateLimiters() {
    try {
      // Initialize Redis client if configured
      if (config.redisUrl || config.security.rateLimiting.redis) {
        await this.initializeRedis();
      }

      // Create rate limiters for each tier
      const { tiers } = config.security.rateLimiting;
      
      for (const [tierName, tierConfig] of Object.entries(tiers)) {
        this.createRateLimiter(tierName as RateLimitTierName, tierConfig);
      }

      this.logger.info('🚦 Rate limiters initialized successfully', {
        tiers: Object.keys(tiers),
        backend: this.redisClient ? 'Redis' : 'Memory'
      });
    } catch (error) {
      this.logger.error('❌ Failed to initialize rate limiters', { error: error.message });
      throw error;
    }
  }

  private async initializeRedis() {
    try {
      const redisConfig = config.security.rateLimiting.redis;
      
      this.redisClient = createClient({
        url: config.redisUrl,
        socket: redisConfig ? {
          host: redisConfig.host,
          port: redisConfig.port
        } : undefined,
        password: redisConfig?.password,
        database: redisConfig?.db || 0
      });

      await this.redisClient.connect();
      
      this.logger.info('✅ Redis connection established for rate limiting');
    } catch (error) {
      this.logger.warn('⚠️  Redis connection failed, falling back to memory', {
        error: error.message
      });
      this.redisClient = undefined;
    }
  }

  private createRateLimiter(tierName: RateLimitTierName, tierConfig: any) {
    const baseOptions = {
      keyPrefix: `fanz_rl_${tierName}`,
      points: tierConfig.points,
      duration: tierConfig.duration,
      blockDuration: tierConfig.blockDuration,
      execEvenly: tierConfig.execEvenly,
    };

    let limiter;
    
    if (this.redisClient) {
      limiter = new RateLimiterRedis({
        ...baseOptions,
        storeClient: this.redisClient,
        // Additional Redis-specific options
        timeoutMs: 5000, // 5 second timeout
        execEvenly: tierConfig.execEvenly,
        enableDurationMs: true,
        customDuration: tierConfig.duration * 1000, // Convert to ms
      });
    } else {
      limiter = new RateLimiterMemory(baseOptions);
    }

    this.limiters.set(tierName, limiter);
    
    this.logger.debug(`Created ${tierName} rate limiter`, {
      points: tierConfig.points,
      duration: tierConfig.duration,
      blockDuration: tierConfig.blockDuration
    });
  }

  // ===============================
  // PUBLIC METHODS
  // ===============================

  /**
   * Check rate limit for a request
   */
  async checkRateLimit(
    key: RateLimitKey, 
    tier: RateLimitTierName, 
    req: Request
  ): Promise<RateLimitResult> {
    const limiter = this.limiters.get(tier);
    if (!limiter) {
      throw new Error(`Rate limiter for tier '${tier}' not found`);
    }

    const rateLimitKey = this.buildRateLimitKey(key, tier);
    
    try {
      const result = await limiter.consume(rateLimitKey, 1);
      
      return {
        allowed: true,
        tier,
        limit: limiter.points,
        remaining: result.remainingHits || 0,
        resetTime: new Date(Date.now() + (result.msBeforeNext || 0)),
      };
    } catch (rejRes: any) {
      // Rate limit exceeded
      const blockDuration = rejRes.msBeforeNext || config.security.rateLimiting.tiers[tier].blockDuration * 1000;
      
      await this.handleRateLimitViolation({
        tier,
        key,
        blockDuration,
        req
      });

      return {
        allowed: false,
        tier,
        limit: limiter.points,
        remaining: 0,
        resetTime: new Date(Date.now() + blockDuration),
        blockDuration
      };
    }
  }

  /**
   * Get current rate limit status without consuming
   */
  async getRateLimitStatus(
    key: RateLimitKey, 
    tier: RateLimitTierName
  ): Promise<RateLimitInfo> {
    const limiter = this.limiters.get(tier);
    if (!limiter) {
      throw new Error(`Rate limiter for tier '${tier}' not found`);
    }

    const rateLimitKey = this.buildRateLimitKey(key, tier);
    
    try {
      const result = await limiter.get(rateLimitKey);
      
      return {
        limit: limiter.points,
        remaining: result?.remainingHits || limiter.points,
        reset: new Date(Date.now() + (result?.msBeforeNext || 0)),
        tier
      };
    } catch (error) {
      this.logger.error('Failed to get rate limit status', { error: error.message, key: rateLimitKey });
      
      // Return default status on error
      return {
        limit: limiter.points,
        remaining: limiter.points,
        reset: new Date(Date.now() + config.security.rateLimiting.tiers[tier].duration * 1000),
        tier
      };
    }
  }

  /**
   * Reset rate limit for a specific key (admin function)
   */
  async resetRateLimit(key: RateLimitKey, tier: RateLimitTierName): Promise<void> {
    const limiter = this.limiters.get(tier);
    if (!limiter) {
      throw new Error(`Rate limiter for tier '${tier}' not found`);
    }

    const rateLimitKey = this.buildRateLimitKey(key, tier);
    
    try {
      await limiter.delete(rateLimitKey);
      
      this.logger.info('Rate limit reset', { 
        key: this.sanitizeKey(rateLimitKey), 
        tier 
      });
    } catch (error) {
      this.logger.error('Failed to reset rate limit', { 
        error: error.message, 
        key: this.sanitizeKey(rateLimitKey) 
      });
      throw error;
    }
  }

  /**
   * Block IP/user immediately (emergency function)
   */
  async emergencyBlock(key: RateLimitKey, duration: number, reason: string): Promise<void> {
    const blockKey = `emergency_block:${key.ip}${key.userId ? ':' + key.userId : ''}`;
    
    if (this.redisClient) {
      await this.redisClient.setEx(blockKey, duration, reason);
    }
    
    await emitSecurityEvent({
      type: 'RATE_LIMIT_EXCEEDED' as SecurityEventType,
      severity: 'HIGH' as SecuritySeverity,
      context: {
        requestId: 'emergency-block',
        ipAddress: key.ip,
        userId: key.userId,
        userAgent: 'system',
        timestamp: new Date(),
        path: '/emergency-block',
        method: 'BLOCK'
      },
      details: { reason, duration, blockKey },
      timestamp: new Date()
    });

    this.logger.warn('🚨 Emergency block activated', {
      key: this.sanitizeKey(blockKey),
      duration,
      reason
    });
  }

  /**
   * Check if IP/user is emergency blocked
   */
  async isEmergencyBlocked(key: RateLimitKey): Promise<boolean> {
    if (!this.redisClient) {
      return false;
    }

    const blockKey = `emergency_block:${key.ip}${key.userId ? ':' + key.userId : ''}`;
    
    try {
      const result = await this.redisClient.get(blockKey);
      return !!result;
    } catch (error) {
      this.logger.error('Failed to check emergency block', { error: error.message });
      return false;
    }
  }

  // ===============================
  // PRIVATE METHODS
  // ===============================

  private buildRateLimitKey(key: RateLimitKey, tier: string): string {
    const parts = [tier, key.ip];
    
    if (key.userId) {
      parts.push('user', key.userId);
    }
    
    if (key.sessionId) {
      parts.push('session', key.sessionId);
    }
    
    if (key.deviceId) {
      parts.push('device', key.deviceId);
    }
    
    return parts.join(':');
  }

  private sanitizeKey(key: string): string {
    // Remove sensitive information from keys for logging
    return key.replace(/user:[^:]+/g, 'user:[REDACTED]')
              .replace(/session:[^:]+/g, 'session:[REDACTED]')
              .replace(/device:[^:]+/g, 'device:[REDACTED]');
  }

  private async handleRateLimitViolation(params: {
    tier: string;
    key: RateLimitKey;
    blockDuration: number;
    req: Request;
  }) {
    const { tier, key, blockDuration, req } = params;
    
    // Emit security event
    await emitSecurityEvent({
      type: 'RATE_LIMIT_EXCEEDED' as SecurityEventType,
      severity: this.getSeverityForTier(tier) as SecuritySeverity,
      context: {
        requestId: req.headers['x-request-id'] as string || 'unknown',
        ipAddress: key.ip,
        userId: key.userId,
        userAgent: req.headers['user-agent'] || 'unknown',
        timestamp: new Date(),
        path: req.path,
        method: req.method
      },
      details: {
        tier,
        blockDuration,
        rateLimitKey: this.sanitizeKey(this.buildRateLimitKey(key, tier))
      },
      timestamp: new Date()
    });

    this.logger.warn('🚦 Rate limit exceeded', {
      tier,
      ip: key.ip,
      userId: key.userId,
      path: req.path,
      blockDuration
    });
  }

  private getSeverityForTier(tier: string): string {
    const severityMap: Record<string, string> = {
      auth: 'HIGH',
      payment: 'HIGH', 
      standard: 'MEDIUM',
      webhook: 'MEDIUM'
    };
    
    return severityMap[tier] || 'MEDIUM';
  }
}

// ===============================
// MIDDLEWARE FACTORY
// ===============================

const rateLimiter = new FanzRateLimiter();

/**
 * Create rate limiting middleware for a specific tier
 */
export function createRateLimitMiddleware(tier: RateLimitTierName) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Build rate limit key from request
      const key: RateLimitKey = {
        ip: req.ip || req.connection.remoteAddress || 'unknown',
        userId: (req as any).user?.id,
        sessionId: (req as any).sessionId,
        deviceId: req.headers['x-device-id'] as string
      };

      // Check for emergency block first
      const isBlocked = await rateLimiter.isEmergencyBlocked(key);
      if (isBlocked) {
        return res.status(429).json({
          error: 'Access temporarily blocked',
          code: 'EMERGENCY_BLOCK',
          retryAfter: 3600 // 1 hour
        });
      }

      // Check rate limit
      const result = await rateLimiter.checkRateLimit(key, tier, req);
      
      // Set rate limit headers
      res.set({
        'X-Rate-Limit-Tier': result.tier,
        'X-Rate-Limit-Limit': result.limit.toString(),
        'X-Rate-Limit-Remaining': result.remaining.toString(),
        'X-Rate-Limit-Reset': result.resetTime.toISOString(),
      });

      if (!result.allowed) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          tier: result.tier,
          retryAfter: Math.ceil((result.blockDuration || 0) / 1000),
          resetTime: result.resetTime
        });
      }

      next();
    } catch (error) {
      const logger = createSecurityLogger('RateLimitMiddleware');
      logger.error('Rate limit middleware error', { error: error.message });
      
      // Fail open in case of errors (but log them)
      next();
    }
  };
}

// ===============================
// SPECIFIC MIDDLEWARE EXPORTS
// ===============================

export const authRateLimit = createRateLimitMiddleware('auth');
export const paymentRateLimit = createRateLimitMiddleware('payment');
export const standardRateLimit = createRateLimitMiddleware('standard');
export const webhookRateLimit = createRateLimitMiddleware('webhook');

// ===============================
// ADMIN FUNCTIONS
// ===============================

/**
 * Get rate limit statistics (for FanzDash)
 */
export async function getRateLimitStats(): Promise<Record<string, any>> {
  try {
    const stats: Record<string, any> = {};
    
    // This would be implemented with actual Redis queries
    // For now, return basic structure
    stats.tiers = Object.keys(config.security.rateLimiting.tiers);
    stats.totalRequests = 0;
    stats.totalBlocked = 0;
    stats.backend = rateLimiter['redisClient'] ? 'Redis' : 'Memory';
    
    return stats;
  } catch (error) {
    throw new Error(`Failed to get rate limit stats: ${error.message}`);
  }
}

/**
 * Reset rate limits for user (admin function)
 */
export async function resetUserRateLimit(userId: string, ip?: string): Promise<void> {
  const key: RateLimitKey = { ip: ip || 'unknown', userId };
  
  for (const tier of ['auth', 'payment', 'standard', 'webhook'] as RateLimitTierName[]) {
    await rateLimiter.resetRateLimit(key, tier);
  }
}

/**
 * Emergency block user/IP (admin function)
 */
export async function emergencyBlockUser(
  userId?: string, 
  ip?: string, 
  duration: number = 3600,
  reason: string = 'Manual admin block'
): Promise<void> {
  if (!userId && !ip) {
    throw new Error('Either userId or IP must be provided');
  }
  
  const key: RateLimitKey = { ip: ip || 'unknown', userId };
  await rateLimiter.emergencyBlock(key, duration, reason);
}

export { rateLimiter };