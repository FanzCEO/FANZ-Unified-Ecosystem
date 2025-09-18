import { Request, Response, NextFunction } from 'express';
import { logger } from './logger.js';
import { generateSecureRandomString } from './security.js';
import { config } from '../config/config.js';

/**
 * Audit Logging and Trail System
 * 
 * Provides comprehensive audit logging with:
 * - Correlation IDs for request tracing
 * - Immutable audit trail for sensitive operations
 * - Structured logging with PII redaction
 * - Real-time event streaming to FanzDash
 * - Append-only storage with integrity checks
 */

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface AuditConfig {
  enableCorrelationIds: boolean;
  enableImmutableTrail: boolean;
  enablePIIRedaction: boolean;
  enableIntegrityChecks: boolean;
  enableRealTimeStreaming: boolean;
  auditStorageProvider: 'redis' | 'database' | 'file' | 'stream';
  correlationIdHeader: string;
  auditLevels: AuditLevel[];
  sensitiveFields: string[];
  retentionDays: number;
}

export type AuditLevel = 'low' | 'medium' | 'high' | 'critical';

export interface AuditEvent {
  id: string;
  timestamp: Date;
  correlationId: string;
  level: AuditLevel;
  category: AuditCategory;
  action: string;
  userId?: string;
  sessionId?: string;
  ip: string;
  userAgent?: string;
  resource?: string;
  metadata: Record<string, any>;
  integrity?: {
    hash: string;
    previousHash?: string;
    signature?: string;
  };
}

export type AuditCategory = 
  | 'authentication'
  | 'authorization'
  | 'financial'
  | 'data_access'
  | 'configuration'
  | 'security'
  | 'system'
  | 'user_action';

export interface AuditContext {
  correlationId: string;
  userId?: string;
  sessionId?: string;
  ip: string;
  userAgent?: string;
  timestamp: Date;
  traceId?: string;
  spanId?: string;
}

export interface AuditQuery {
  correlationId?: string;
  userId?: string;
  category?: AuditCategory;
  level?: AuditLevel;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

// =============================================================================
// AUDIT LOGGER CLASS
// =============================================================================

export class AuditLogger {
  private config: AuditConfig;
  private previousHash: string = '';
  private redis: any;
  private auditStream: any;
  
  constructor(config: Partial<AuditConfig> = {}, redisClient?: any) {
    this.config = {
      enableCorrelationIds: true,
      enableImmutableTrail: true,
      enablePIIRedaction: true,
      enableIntegrityChecks: true,
      enableRealTimeStreaming: true,
      auditStorageProvider: 'redis',
      correlationIdHeader: 'x-correlation-id',
      auditLevels: ['low', 'medium', 'high', 'critical'],
      sensitiveFields: [
        'password', 'token', 'secret', 'key', 'auth', 'email', 'phone',
        'ssn', 'credit_card', 'account_number', 'api_key', 'bearer'
      ],
      retentionDays: 90,
      ...config
    };
    
    this.redis = redisClient;
    this.initializeAuditStream();
  }
  
  /**
   * Initialize audit stream for real-time processing
   */
  private initializeAuditStream(): void {
    if (this.config.enableRealTimeStreaming && this.redis) {
      // Create Redis stream for audit events
      this.auditStream = 'audit:events';
    }
  }
  
  /**
   * Generate correlation ID for request tracing
   */
  generateCorrelationId(): string {
    return `req-${Date.now()}-${generateSecureRandomString(12, 'hex')}`;
  }
  
  /**
   * Create audit context from request
   */
  createAuditContext(req: Request): AuditContext {
    const correlationId = this.extractCorrelationId(req) || this.generateCorrelationId();
    
    return {
      correlationId,
      userId: (req as any).user?.id,
      sessionId: (req as any).sessionId,
      ip: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent'),
      timestamp: new Date(),
      traceId: req.get('x-trace-id'),
      spanId: req.get('x-span-id')
    };
  }
  
  /**
   * Log audit event
   */
  async logEvent(
    category: AuditCategory,
    action: string,
    level: AuditLevel,
    context: Partial<AuditContext>,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const auditEvent: AuditEvent = {
      id: generateSecureRandomString(32, 'hex'),
      timestamp: new Date(),
      correlationId: context.correlationId || this.generateCorrelationId(),
      level,
      category,
      action,
      userId: context.userId,
      sessionId: context.sessionId,
      ip: context.ip || 'unknown',
      userAgent: context.userAgent,
      resource: metadata.resource,
      metadata: this.config.enablePIIRedaction ? this.redactPII(metadata) : metadata
    };
    
    // Add integrity check if enabled
    if (this.config.enableImmutableTrail && this.config.enableIntegrityChecks) {
      auditEvent.integrity = await this.generateIntegrity(auditEvent);
    }
    
    // Store audit event
    await this.storeAuditEvent(auditEvent);
    
    // Stream to FanzDash if enabled
    if (this.config.enableRealTimeStreaming) {
      await this.streamAuditEvent(auditEvent);
    }
    
    // Log to application logger
    this.logToApplication(auditEvent);
  }
  
  /**
   * Log authentication events
   */
  async logAuthentication(
    action: 'login' | 'logout' | 'token_refresh' | 'password_change' | '2fa_enable' | '2fa_disable',
    context: AuditContext,
    success: boolean,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    await this.logEvent(
      'authentication',
      action,
      success ? 'medium' : 'high',
      context,
      {
        success,
        ...metadata
      }
    );
  }
  
  /**
   * Log authorization events
   */
  async logAuthorization(
    action: 'access_granted' | 'access_denied' | 'permission_check' | 'role_change',
    context: AuditContext,
    resource: string,
    success: boolean,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    await this.logEvent(
      'authorization',
      action,
      success ? 'low' : 'high',
      context,
      {
        resource,
        success,
        ...metadata
      }
    );
  }
  
  /**
   * Log financial events (critical level)
   */
  async logFinancial(
    action: 'transaction' | 'payout' | 'balance_change' | 'ledger_entry' | 'withdrawal' | 'deposit',
    context: AuditContext,
    metadata: Record<string, any>
  ): Promise<void> {
    await this.logEvent(
      'financial',
      action,
      'critical',
      context,
      {
        immutable: true,
        requiresApproval: true,
        ...metadata
      }
    );
  }
  
  /**
   * Log data access events
   */
  async logDataAccess(
    action: 'read' | 'write' | 'delete' | 'export' | 'import',
    context: AuditContext,
    resource: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const level: AuditLevel = action === 'delete' || action === 'export' ? 'high' : 'medium';
    
    await this.logEvent(
      'data_access',
      action,
      level,
      context,
      {
        resource,
        ...metadata
      }
    );
  }
  
  /**
   * Log security events
   */
  async logSecurity(
    action: string,
    context: AuditContext,
    level: AuditLevel,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    await this.logEvent(
      'security',
      action,
      level,
      context,
      {
        securityEvent: true,
        alertRequired: level === 'critical' || level === 'high',
        ...metadata
      }
    );
  }
  
  /**
   * Log configuration changes
   */
  async logConfiguration(
    action: 'create' | 'update' | 'delete' | 'deploy',
    context: AuditContext,
    resource: string,
    changes: Record<string, any>,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    await this.logEvent(
      'configuration',
      action,
      'high',
      context,
      {
        resource,
        changes: this.config.enablePIIRedaction ? this.redactPII(changes) : changes,
        requiresReview: true,
        ...metadata
      }
    );
  }
  
  /**
   * Query audit trail
   */
  async queryAuditTrail(query: AuditQuery): Promise<AuditEvent[]> {
    switch (this.config.auditStorageProvider) {
      case 'redis':
        return this.queryFromRedis(query);
      case 'database':
        return this.queryFromDatabase(query);
      case 'file':
        return this.queryFromFile(query);
      default:
        throw new Error(`Unsupported audit storage provider: ${this.config.auditStorageProvider}`);
    }
  }
  
  /**
   * Verify audit trail integrity
   */
  async verifyIntegrity(events: AuditEvent[]): Promise<boolean> {
    if (!this.config.enableIntegrityChecks) {
      return true;
    }
    
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const expectedHash = await this.calculateHash(event);
      
      if (event.integrity?.hash !== expectedHash) {
        logger.error('Audit trail integrity check failed', {
          eventId: event.id,
          expected: expectedHash,
          actual: event.integrity?.hash
        });
        return false;
      }
      
      // Check chain integrity
      if (i > 0 && event.integrity?.previousHash !== events[i - 1].integrity?.hash) {
        logger.error('Audit chain integrity check failed', {
          eventId: event.id,
          previousEventId: events[i - 1].id
        });
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Express middleware for correlation ID injection
   */
  correlationMiddleware() {
    return (req: Request & { correlationId?: string }, res: Response, next: NextFunction) => {
      const correlationId = this.extractCorrelationId(req) || this.generateCorrelationId();
      
      // Add correlation ID to request
      req.correlationId = correlationId;
      
      // Add correlation ID to response headers
      res.setHeader(this.config.correlationIdHeader, correlationId);
      
      // Add to logger context
      logger.defaultMeta = { ...logger.defaultMeta, correlationId };
      
      next();
    };
  }
  
  /**
   * Express middleware for audit logging
   */
  auditMiddleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      const context = this.createAuditContext(req);
      
      // Log request start
      await this.logEvent(
        'system',
        'request_start',
        'low',
        context,
        {
          method: req.method,
          path: req.path,
          query: req.query,
          body: this.redactPII(req.body || {})
        }
      );
      
      // Intercept response end
      const originalEnd = res.end;
      res.end = function(this: Response, ...args: any[]) {
        const duration = Date.now() - startTime;
        
        // Log request completion
        void this.logEvent(
          'system',
          'request_end',
          'low',
          context,
          {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration
          }
        ).catch(error => {
          logger.error('Failed to log audit event', { error: error.message });
        });
        
        originalEnd.apply(this, args);
      }.bind(this);
      
      next();
    };
  }
  
  // Private helper methods
  private extractCorrelationId(req: Request): string | undefined {
    return req.get(this.config.correlationIdHeader) || 
           req.get('x-request-id') || 
           req.get('x-correlation-id');
  }
  
  private redactPII(data: any): any {
    if (!this.config.enablePIIRedaction || !data) {
      return data;
    }
    
    if (typeof data === 'string') {
      return data;
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.redactPII(item));
    }
    
    if (typeof data === 'object') {
      const redacted: any = {};
      
      for (const [key, value] of Object.entries(data)) {
        const isKeySensitive = this.config.sensitiveFields.some(
          field => key.toLowerCase().includes(field.toLowerCase())
        );
        
        if (isKeySensitive) {
          redacted[key] = '[REDACTED]';
        } else {
          redacted[key] = this.redactPII(value);
        }
      }
      
      return redacted;
    }
    
    return data;
  }
  
  private async generateIntegrity(event: AuditEvent): Promise<AuditEvent['integrity']> {
    const hash = await this.calculateHash(event);
    
    return {
      hash,
      previousHash: this.previousHash || undefined,
      signature: await this.signEvent(event)
    };
  }
  
  private async calculateHash(event: AuditEvent): Promise<string> {
    const crypto = await import('crypto');
    
    // Create a consistent string representation
    const eventString = JSON.stringify({
      id: event.id,
      timestamp: event.timestamp.toISOString(),
      correlationId: event.correlationId,
      level: event.level,
      category: event.category,
      action: event.action,
      userId: event.userId,
      metadata: event.metadata
    });
    
    return crypto.createHash('sha256').update(eventString).digest('hex');
  }
  
  private async signEvent(event: AuditEvent): Promise<string> {
    // Placeholder for cryptographic signing
    // In production, use proper signing with private keys
    return 'signature_placeholder';
  }
  
  private async storeAuditEvent(event: AuditEvent): Promise<void> {
    switch (this.config.auditStorageProvider) {
      case 'redis':
        await this.storeInRedis(event);
        break;
      case 'database':
        await this.storeInDatabase(event);
        break;
      case 'file':
        await this.storeInFile(event);
        break;
    }
  }
  
  private async storeInRedis(event: AuditEvent): Promise<void> {
    if (!this.redis) return;
    
    try {
      // Store in Redis with TTL
      const key = `audit:${event.category}:${event.id}`;
      const ttlSeconds = this.config.retentionDays * 24 * 60 * 60;
      
      await this.redis.setex(key, ttlSeconds, JSON.stringify(event));
      
      // Add to sorted set for querying
      await this.redis.zadd(
        `audit:timeline:${event.category}`,
        event.timestamp.getTime(),
        event.id
      );
    } catch (error) {
      logger.error('Failed to store audit event in Redis', {
        error: error.message,
        eventId: event.id
      });
    }
  }
  
  private async storeInDatabase(event: AuditEvent): Promise<void> {
    // Placeholder for database storage
    logger.info('Storing audit event in database', { eventId: event.id });
  }
  
  private async storeInFile(event: AuditEvent): Promise<void> {
    // Placeholder for file storage
    logger.info('Storing audit event in file', { eventId: event.id });
  }
  
  private async streamAuditEvent(event: AuditEvent): Promise<void> {
    if (!this.redis || !this.auditStream) return;
    
    try {
      await this.redis.xadd(
        this.auditStream,
        '*',
        'event', JSON.stringify(event)
      );
    } catch (error) {
      logger.error('Failed to stream audit event', {
        error: error.message,
        eventId: event.id
      });
    }
  }
  
  private logToApplication(event: AuditEvent): void {
    const logData = {
      audit: true,
      ...event,
      timestamp: event.timestamp.toISOString()
    };
    
    switch (event.level) {
      case 'critical':
        logger.error('Critical audit event', logData);
        break;
      case 'high':
        logger.warn('High-level audit event', logData);
        break;
      case 'medium':
        logger.info('Medium-level audit event', logData);
        break;
      default:
        logger.debug('Low-level audit event', logData);
    }
  }
  
  private async queryFromRedis(query: AuditQuery): Promise<AuditEvent[]> {
    // Placeholder for Redis querying
    return [];
  }
  
  private async queryFromDatabase(query: AuditQuery): Promise<AuditEvent[]> {
    // Placeholder for database querying
    return [];
  }
  
  private async queryFromFile(query: AuditQuery): Promise<AuditEvent[]> {
    // Placeholder for file querying
    return [];
  }
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Create audit logger with default configuration
 */
export function createAuditLogger(config: Partial<AuditConfig> = {}, redisClient?: any) {
  return new AuditLogger(config, redisClient);
}

/**
 * Create production audit logger with strict settings
 */
export function createProductionAuditLogger(redisClient?: any) {
  return new AuditLogger({
    enableCorrelationIds: true,
    enableImmutableTrail: true,
    enablePIIRedaction: true,
    enableIntegrityChecks: true,
    enableRealTimeStreaming: true,
    auditStorageProvider: 'redis',
    retentionDays: 2555 // 7 years for compliance
  }, redisClient);
}

/**
 * Create development audit logger with permissive settings
 */
export function createDevelopmentAuditLogger(redisClient?: any) {
  return new AuditLogger({
    enableCorrelationIds: true,
    enableImmutableTrail: false,
    enablePIIRedaction: false,
    enableIntegrityChecks: false,
    enableRealTimeStreaming: false,
    auditStorageProvider: 'file',
    retentionDays: 7
  }, redisClient);
}

export { AuditLogger as default };