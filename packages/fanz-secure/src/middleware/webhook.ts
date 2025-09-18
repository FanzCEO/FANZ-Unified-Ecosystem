import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';
import { securityEvents } from '../events/securityEvents.js';
import { generateHMAC, verifyHMAC, constantTimeEquals } from '../utils/security.js';
import type { SecurityContext } from '../types/index.js';

/**
 * Webhook Security Middleware
 * 
 * Provides comprehensive security for webhook endpoints including:
 * - HMAC signature verification
 * - Replay attack prevention 
 * - Timestamp validation
 * - Idempotency enforcement
 * - IP allowlist support
 * - Rate limiting integration
 */

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface WebhookConfig {
  // Signature verification
  secret: string;
  signatureHeader: string; // e.g., 'x-fanz-signature'
  algorithm: string; // e.g., 'sha256'
  signaturePrefix?: string; // e.g., 'sha256='
  
  // Timestamp validation
  timestampHeader?: string; // e.g., 'x-fanz-timestamp'
  timestampToleranceMs: number; // e.g., 300000 (5 minutes)
  
  // Replay prevention
  enableReplayPrevention: boolean;
  replayWindowMs: number; // e.g., 86400000 (24 hours)
  eventIdHeader?: string; // e.g., 'x-fanz-event-id'
  
  // Idempotency
  requireIdempotencyKey: boolean;
  idempotencyHeader: string; // e.g., 'x-idempotency-key'
  idempotencyWindowMs: number;
  
  // IP allowlist
  enableIpAllowlist: boolean;
  allowedIps: string[];
  allowPrivateIps: boolean;
  
  // Error handling
  exposePrimaryErrors: boolean;
  logFailedRequests: boolean;
}

export interface WebhookValidationResult {
  valid: boolean;
  errors: string[];
  metadata: {
    signatureValid?: boolean;
    timestampValid?: boolean;
    replayDetected?: boolean;
    ipAllowed?: boolean;
    idempotencyValid?: boolean;
    eventId?: string;
    timestamp?: number;
  };
}

export interface ProcessedWebhookRequest extends Request {
  webhook: {
    verified: boolean;
    eventId: string;
    timestamp?: Date;
    signature: string;
    idempotencyKey?: string;
  };
}

// =============================================================================
// WEBHOOK VALIDATION SCHEMAS
// =============================================================================

const webhookConfigSchema = z.object({
  secret: z.string().min(32, 'Webhook secret must be at least 32 characters'),
  signatureHeader: z.string().min(1),
  algorithm: z.string().default('sha256'),
  signaturePrefix: z.string().optional(),
  timestampHeader: z.string().optional(),
  timestampToleranceMs: z.number().min(0).default(300000),
  enableReplayPrevention: z.boolean().default(true),
  replayWindowMs: z.number().min(0).default(86400000),
  eventIdHeader: z.string().optional(),
  requireIdempotencyKey: z.boolean().default(false),
  idempotencyHeader: z.string().default('x-idempotency-key'),
  idempotencyWindowMs: z.number().min(0).default(86400000),
  enableIpAllowlist: z.boolean().default(false),
  allowedIps: z.array(z.string()).default([]),
  allowPrivateIps: z.boolean().default(false),
  exposePrimaryErrors: z.boolean().default(false),
  logFailedRequests: z.boolean().default(true),
});

// =============================================================================
// WEBHOOK SECURITY CLASS
// =============================================================================

export class WebhookSecurity {
  private config: WebhookConfig;
  private redis: any; // Redis client for replay prevention and idempotency
  
  constructor(webhookConfig: Partial<WebhookConfig>, redisClient?: any) {
    this.config = webhookConfigSchema.parse(webhookConfig);
    this.redis = redisClient;
    
    if ((this.config.enableReplayPrevention || this.config.requireIdempotencyKey) && !this.redis) {
      logger.warn('Redis client not provided - replay prevention and idempotency will use memory store');
    }
  }
  
  /**
   * Verify webhook signature using HMAC
   */
  private verifySignature(payload: string, signature: string): boolean {
    try {
      let cleanSignature = signature;
      
      // Remove prefix if configured
      if (this.config.signaturePrefix) {
        if (!signature.startsWith(this.config.signaturePrefix)) {
          return false;
        }
        cleanSignature = signature.substring(this.config.signaturePrefix.length);
      }
      
      return verifyHMAC(payload, cleanSignature, this.config.secret, this.config.algorithm);
    } catch (error) {
      logger.debug('Signature verification failed', { error: error.message });
      return false;
    }
  }
  
  /**
   * Validate timestamp to prevent replay attacks
   */
  private validateTimestamp(timestamp: string): boolean {
    try {
      const webhookTime = parseInt(timestamp, 10) * 1000; // Assume Unix timestamp in seconds
      const currentTime = Date.now();
      const timeDiff = Math.abs(currentTime - webhookTime);
      
      return timeDiff <= this.config.timestampToleranceMs;
    } catch {
      return false;
    }
  }
  
  /**
   * Check for replay attacks using event ID
   */
  private async checkReplay(eventId: string): Promise<boolean> {
    if (!this.config.enableReplayPrevention) return false;
    
    const key = `webhook:replay:${eventId}`;
    
    try {
      if (this.redis) {
        const exists = await this.redis.exists(key);
        if (exists) return true;
        
        // Store event ID with TTL
        await this.redis.setex(key, Math.floor(this.config.replayWindowMs / 1000), '1');
        return false;
      } else {
        // Memory fallback (not recommended for production)
        if (this.memoryStore.has(key)) return true;
        
        this.memoryStore.set(key, true);
        setTimeout(() => this.memoryStore.delete(key), this.config.replayWindowMs);
        return false;
      }
    } catch (error) {
      logger.error('Replay check failed', { error: error.message, eventId });
      return false;
    }
  }
  
  /**
   * Check idempotency key
   */
  private async checkIdempotency(idempotencyKey: string, payload: string): Promise<boolean> {
    if (!this.config.requireIdempotencyKey) return true;
    
    const key = `webhook:idempotency:${idempotencyKey}`;
    const payloadHash = crypto.createHash('sha256').update(payload).digest('hex');
    
    try {
      if (this.redis) {
        const storedHash = await this.redis.get(key);
        
        if (storedHash) {
          // Idempotency key exists - check if payload matches
          return constantTimeEquals(storedHash, payloadHash);
        }
        
        // Store new idempotency key
        await this.redis.setex(key, Math.floor(this.config.idempotencyWindowMs / 1000), payloadHash);
        return true;
      } else {
        // Memory fallback
        const storedHash = this.memoryStore.get(key);
        
        if (storedHash) {
          return constantTimeEquals(storedHash, payloadHash);
        }
        
        this.memoryStore.set(key, payloadHash);
        setTimeout(() => this.memoryStore.delete(key), this.config.idempotencyWindowMs);
        return true;
      }
    } catch (error) {
      logger.error('Idempotency check failed', { error: error.message, idempotencyKey });
      return false;
    }
  }
  
  /**
   * Validate IP address against allowlist
   */
  private validateIpAddress(ip: string): boolean {
    if (!this.config.enableIpAllowlist) return true;
    if (this.config.allowedIps.length === 0) return true;
    
    // Check exact matches first
    if (this.config.allowedIps.includes(ip)) return true;
    
    // Check CIDR ranges (basic implementation)
    for (const allowedIp of this.config.allowedIps) {
      if (allowedIp.includes('/')) {
        // TODO: Implement proper CIDR matching
        logger.warn('CIDR matching not fully implemented', { allowedIp, clientIp: ip });
      }
    }
    
    return false;
  }
  
  /**
   * Comprehensive webhook validation
   */
  private async validateWebhook(
    req: Request,
    payload: string
  ): Promise<WebhookValidationResult> {
    const errors: string[] = [];
    const metadata: WebhookValidationResult['metadata'] = {};
    
    // Get headers
    const signature = req.get(this.config.signatureHeader);
    const timestamp = this.config.timestampHeader ? req.get(this.config.timestampHeader) : undefined;
    const eventId = this.config.eventIdHeader ? req.get(this.config.eventIdHeader) : undefined;
    const idempotencyKey = this.config.requireIdempotencyKey ? req.get(this.config.idempotencyHeader) : undefined;
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    
    // Validate signature (required)
    if (!signature) {
      errors.push('Missing signature header');
    } else {
      const signatureValid = this.verifySignature(payload, signature);
      metadata.signatureValid = signatureValid;
      if (!signatureValid) {
        errors.push('Invalid signature');
      }
    }
    
    // Validate timestamp (if configured)
    if (this.config.timestampHeader && timestamp) {
      const timestampValid = this.validateTimestamp(timestamp);
      metadata.timestampValid = timestampValid;
      metadata.timestamp = parseInt(timestamp, 10);
      if (!timestampValid) {
        errors.push('Invalid timestamp');
      }
    } else if (this.config.timestampHeader) {
      errors.push('Missing timestamp header');
    }
    
    // Check for replay attacks
    if (eventId) {
      metadata.eventId = eventId;
      const replayDetected = await this.checkReplay(eventId);
      metadata.replayDetected = replayDetected;
      if (replayDetected) {
        errors.push('Replay attack detected');
      }
    } else if (this.config.enableReplayPrevention && this.config.eventIdHeader) {
      errors.push('Missing event ID header for replay prevention');
    }
    
    // Validate idempotency key
    if (this.config.requireIdempotencyKey) {
      if (!idempotencyKey) {
        errors.push('Missing idempotency key');
      } else {
        const idempotencyValid = await this.checkIdempotency(idempotencyKey, payload);
        metadata.idempotencyValid = idempotencyValid;
        if (!idempotencyValid) {
          errors.push('Idempotency key conflict');
        }
      }
    }
    
    // Validate IP address
    const ipAllowed = this.validateIpAddress(clientIp);
    metadata.ipAllowed = ipAllowed;
    if (!ipAllowed) {
      errors.push('IP address not allowed');
    }
    
    return {
      valid: errors.length === 0,
      errors,
      metadata
    };
  }
  
  // Memory store fallback (use Redis in production)
  private memoryStore = new Map<string, any>();
  
  /**
   * Create webhook middleware
   */
  middleware() {
    return async (req: Request & Partial<ProcessedWebhookRequest>, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      
      try {
        // Get raw body (should be preserved by previous middleware)
        const rawBody = (req as any).rawBody || (req as any).body || '';
        const payload = typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody);
        
        if (!payload) {
          logger.warn('Webhook received with empty payload', { url: req.url });
          return res.status(400).json({
            error: 'Empty payload',
            code: 'WEBHOOK_EMPTY_PAYLOAD'
          });
        }
        
        // Validate webhook
        const validation = await this.validateWebhook(req, payload);
        
        // Log validation results
        if (this.config.logFailedRequests && !validation.valid) {
          logger.warn('Webhook validation failed', {
            url: req.url,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            errors: validation.errors,
            metadata: validation.metadata
          });
        }
        
        // Emit security event for failed validation
        if (!validation.valid) {
          await securityEvents.emit({
            type: 'webhook_validation_failed',
            severity: 'high',
            source: 'webhook-middleware',
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            metadata: {
              url: req.url,
              errors: validation.errors,
              validationMetadata: validation.metadata
            }
          });
          
          // Return error response
          const errorMessage = this.config.exposePrimaryErrors 
            ? validation.errors.join(', ')
            : 'Webhook validation failed';
            
          return res.status(401).json({
            error: errorMessage,
            code: 'WEBHOOK_VALIDATION_FAILED'
          });
        }
        
        // Add webhook metadata to request
        req.webhook = {
          verified: true,
          eventId: validation.metadata.eventId || 'unknown',
          timestamp: validation.metadata.timestamp ? new Date(validation.metadata.timestamp * 1000) : undefined,
          signature: req.get(this.config.signatureHeader) || '',
          idempotencyKey: req.get(this.config.idempotencyHeader)
        };
        
        // Add timing
        const processingTime = Date.now() - startTime;
        logger.debug('Webhook validated successfully', {
          url: req.url,
          eventId: req.webhook.eventId,
          processingTime
        });
        
        next();
      } catch (error) {
        logger.error('Webhook validation error', {
          error: error.message,
          stack: error.stack,
          url: req.url
        });
        
        await securityEvents.emit({
          type: 'webhook_validation_error',
          severity: 'critical',
          source: 'webhook-middleware',
          metadata: {
            error: error.message,
            url: req.url
          }
        });
        
        return res.status(500).json({
          error: 'Internal server error',
          code: 'WEBHOOK_INTERNAL_ERROR'
        });
      }
    };
  }
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Create webhook middleware with default configuration
 */
export function createWebhookMiddleware(
  secret: string,
  options: Partial<WebhookConfig> = {},
  redisClient?: any
) {
  const webhookSecurity = new WebhookSecurity({
    secret,
    signatureHeader: 'x-fanz-signature',
    algorithm: 'sha256',
    signaturePrefix: 'sha256=',
    timestampHeader: 'x-fanz-timestamp',
    timestampToleranceMs: 300000, // 5 minutes
    enableReplayPrevention: true,
    replayWindowMs: 86400000, // 24 hours
    eventIdHeader: 'x-fanz-event-id',
    requireIdempotencyKey: false,
    idempotencyHeader: 'x-idempotency-key',
    idempotencyWindowMs: 86400000,
    enableIpAllowlist: false,
    allowedIps: [],
    allowPrivateIps: false,
    exposePrimaryErrors: config.NODE_ENV !== 'production',
    logFailedRequests: true,
    ...options
  }, redisClient);
  
  return webhookSecurity.middleware();
}

/**
 * Create payment webhook middleware (stricter settings)
 */
export function createPaymentWebhookMiddleware(
  secret: string,
  options: Partial<WebhookConfig> = {},
  redisClient?: any
) {
  return createWebhookMiddleware(secret, {
    requireIdempotencyKey: true,
    timestampToleranceMs: 180000, // 3 minutes (stricter)
    enableIpAllowlist: true,
    exposePrimaryErrors: false, // Never expose errors for payments
    ...options
  }, redisClient);
}

/**
 * Generate webhook signature for testing
 */
export function generateWebhookSignature(
  payload: string,
  secret: string,
  algorithm: string = 'sha256',
  prefix: string = 'sha256='
): string {
  const signature = generateHMAC(payload, secret, algorithm);
  return `${prefix}${signature}`;
}

/**
 * Test webhook signature locally
 */
export function testWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
  algorithm: string = 'sha256',
  prefix?: string
): boolean {
  let cleanSignature = signature;
  
  if (prefix && signature.startsWith(prefix)) {
    cleanSignature = signature.substring(prefix.length);
  }
  
  return verifyHMAC(payload, cleanSignature, secret, algorithm);
}

export { WebhookSecurity as default };