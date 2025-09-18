/**
 * @fanz/secure - Security Events Utility
 * Centralized security event handling and FanzDash integration
 */

import { createClient } from 'redis';
import { config } from '../config.js';
import { SecurityEvent, SecurityEventType, SecuritySeverity } from '../types.js';
import { createSecurityLogger } from './logger.js';

// ===============================
// TYPES & INTERFACES
// ===============================

interface SecurityEventHandler {
  (event: SecurityEvent): Promise<void>;
}

interface SecurityEventBatch {
  events: SecurityEvent[];
  timestamp: Date;
  batchId: string;
}

interface FanzDashAlert {
  id: string;
  event: SecurityEvent;
  severity: SecuritySeverity;
  timestamp: Date;
  acknowledged: boolean;
  assignee?: string;
}

// ===============================
// SECURITY EVENT MANAGER
// ===============================

class SecurityEventManager {
  private redisClient?: any;
  private handlers: Map<SecurityEventType | 'ALL', SecurityEventHandler[]> = new Map();
  private eventBuffer: SecurityEvent[] = [];
  private batchSize = 100;
  private batchTimeout = 5000; // 5 seconds
  private batchTimer?: NodeJS.Timeout;
  private logger = createSecurityLogger('SecurityEvents');

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      // Initialize Redis for event streaming
      if (config.redisUrl || config.security.rateLimiting.redis) {
        await this.initializeRedis();
      }

      // Setup default handlers
      this.setupDefaultHandlers();

      // Start batch processing
      this.startBatchProcessing();

      this.logger.info('Security Event Manager initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Security Event Manager', { error: error.message });
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
      
      this.logger.info('Redis connection established for security events');
    } catch (error) {
      this.logger.warn('Redis connection failed for security events', {
        error: error.message
      });
      this.redisClient = undefined;
    }
  }

  // ===============================
  // EVENT HANDLING
  // ===============================

  /**
   * Emit a security event
   */
  async emit(event: SecurityEvent): Promise<void> {
    try {
      // Add to buffer for batch processing
      this.eventBuffer.push(event);

      // Log the event
      this.logger.security(event);

      // Trigger immediate handlers for critical events
      if (event.severity === 'CRITICAL') {
        await this.processCriticalEvent(event);
      }

      // Process buffer if it's full
      if (this.eventBuffer.length >= this.batchSize) {
        await this.processBatch();
      }

    } catch (error) {
      this.logger.error('Failed to emit security event', {
        error: error.message,
        eventType: event.type
      });
    }
  }

  /**
   * Register an event handler
   */
  on(eventType: SecurityEventType | 'ALL', handler: SecurityEventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }

  /**
   * Remove an event handler
   */
  off(eventType: SecurityEventType | 'ALL', handler: SecurityEventHandler): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  // ===============================
  // BATCH PROCESSING
  // ===============================

  private startBatchProcessing() {
    this.batchTimer = setTimeout(async () => {
      if (this.eventBuffer.length > 0) {
        await this.processBatch();
      }
      this.startBatchProcessing(); // Restart timer
    }, this.batchTimeout);
  }

  private async processBatch(): Promise<void> {
    if (this.eventBuffer.length === 0) {
      return;
    }

    const batch: SecurityEventBatch = {
      events: [...this.eventBuffer],
      timestamp: new Date(),
      batchId: `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    // Clear buffer
    this.eventBuffer = [];

    try {
      // Process events through handlers
      await this.executeHandlers(batch.events);

      // Store in Redis for FanzDash
      await this.storeBatch(batch);

      // Send to FanzDash if configured
      await this.sendToFanzDash(batch);

      this.logger.debug('Processed security event batch', {
        batchId: batch.batchId,
        eventCount: batch.events.length
      });

    } catch (error) {
      this.logger.error('Failed to process security event batch', {
        error: error.message,
        batchId: batch.batchId
      });
    }
  }

  private async executeHandlers(events: SecurityEvent[]): Promise<void> {
    for (const event of events) {
      try {
        const eventHandlers = this.handlers.get(event.type) || [];
        const allHandlers = this.handlers.get('ALL') || [];

        for (const handler of [...eventHandlers, ...allHandlers]) {
          await handler(event);
        }
      } catch (error) {
        this.logger.error('Failed to execute event handler', {
          error: error.message,
          eventType: event.type
        });
      }
    }
  }

  private async processCriticalEvent(event: SecurityEvent): Promise<void> {
    try {
      // Execute critical event handlers immediately
      const criticalHandlers = this.handlers.get(event.type) || [];
      const allHandlers = this.handlers.get('ALL') || [];

      for (const handler of [...criticalHandlers, ...allHandlers]) {
        await handler(event);
      }

      // Send immediate alert to FanzDash
      await this.sendCriticalAlert(event);

    } catch (error) {
      this.logger.error('Failed to process critical security event', {
        error: error.message,
        eventType: event.type
      });
    }
  }

  // ===============================
  // STORAGE & FANZDASH INTEGRATION
  // ===============================

  private async storeBatch(batch: SecurityEventBatch): Promise<void> {
    if (!this.redisClient) {
      return;
    }

    try {
      // Store in Redis streams for real-time processing
      await this.redisClient.xAdd('fanz:security:events', '*', {
        batchId: batch.batchId,
        timestamp: batch.timestamp.toISOString(),
        eventCount: batch.events.length.toString(),
        events: JSON.stringify(batch.events)
      });

      // Store individual events for querying
      for (const event of batch.events) {
        await this.redisClient.hSet(`fanz:security:event:${event.context.requestId}`, {
          type: event.type,
          severity: event.severity,
          timestamp: event.timestamp.toISOString(),
          context: JSON.stringify(event.context),
          details: JSON.stringify(event.details)
        });

        // Set expiration (24 hours for events, 7 days for critical)
        const ttl = event.severity === 'CRITICAL' ? 7 * 24 * 60 * 60 : 24 * 60 * 60;
        await this.redisClient.expire(`fanz:security:event:${event.context.requestId}`, ttl);
      }

    } catch (error) {
      this.logger.error('Failed to store security event batch', {
        error: error.message,
        batchId: batch.batchId
      });
    }
  }

  private async sendToFanzDash(batch: SecurityEventBatch): Promise<void> {
    if (!config.fanzDashApiUrl || !config.fanzDashSecretToken) {
      return;
    }

    try {
      const response = await fetch(`${config.fanzDashApiUrl}/api/security/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.fanzDashSecretToken}`,
          'X-Service': 'fanz-secure'
        },
        body: JSON.stringify({
          batch: {
            id: batch.batchId,
            timestamp: batch.timestamp.toISOString(),
            eventCount: batch.events.length
          },
          events: batch.events.map(event => ({
            type: event.type,
            severity: event.severity,
            timestamp: event.timestamp.toISOString(),
            context: event.context,
            details: event.details
          }))
        })
      });

      if (!response.ok) {
        throw new Error(`FanzDash API responded with ${response.status}`);
      }

      this.logger.debug('Security events sent to FanzDash', {
        batchId: batch.batchId,
        eventCount: batch.events.length
      });

    } catch (error) {
      this.logger.error('Failed to send events to FanzDash', {
        error: error.message,
        batchId: batch.batchId
      });
    }
  }

  private async sendCriticalAlert(event: SecurityEvent): Promise<void> {
    if (!config.fanzDashApiUrl || !config.fanzDashSecretToken) {
      return;
    }

    try {
      const alert: FanzDashAlert = {
        id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        event,
        severity: event.severity,
        timestamp: new Date(),
        acknowledged: false
      };

      const response = await fetch(`${config.fanzDashApiUrl}/api/security/alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.fanzDashSecretToken}`,
          'X-Service': 'fanz-secure',
          'X-Alert-Priority': 'CRITICAL'
        },
        body: JSON.stringify(alert)
      });

      if (!response.ok) {
        throw new Error(`FanzDash Alert API responded with ${response.status}`);
      }

      this.logger.warn('Critical security alert sent to FanzDash', {
        alertId: alert.id,
        eventType: event.type
      });

    } catch (error) {
      this.logger.error('Failed to send critical alert to FanzDash', {
        error: error.message,
        eventType: event.type
      });
    }
  }

  // ===============================
  // DEFAULT HANDLERS
  // ===============================

  private setupDefaultHandlers() {
    // Rate limit violation handler
    this.on('RATE_LIMIT_EXCEEDED', async (event) => {
      // Update rate limit metrics
      await this.updateMetrics('rate_limit_violations', event);
    });

    // Authentication failure handler
    this.on('AUTH_FAILURE', async (event) => {
      // Track authentication failures for brute force detection
      await this.trackAuthFailure(event);
    });

    // Input injection attempt handler
    this.on('INPUT_INJECTION_ATTEMPT', async (event) => {
      // Log injection attempts and potentially block IP
      await this.handleInjectionAttempt(event);
    });

    // CSRF violation handler
    this.on('CSRF_VIOLATION', async (event) => {
      // Track CSRF violations
      await this.updateMetrics('csrf_violations', event);
    });

    // Suspicious activity handler
    this.on('SUSPICIOUS_ACTIVITY', async (event) => {
      // Analyze patterns and escalate if needed
      await this.analyzeSuspiciousActivity(event);
    });
  }

  private async updateMetrics(metricName: string, event: SecurityEvent): Promise<void> {
    if (!this.redisClient) {
      return;
    }

    try {
      const key = `fanz:security:metrics:${metricName}`;
      const hour = new Date().getHours();
      
      await this.redisClient.hIncrBy(key, `hour_${hour}`, 1);
      await this.redisClient.hIncrBy(key, 'total', 1);
      await this.redisClient.expire(key, 24 * 60 * 60); // 24 hours

    } catch (error) {
      this.logger.error('Failed to update security metrics', {
        error: error.message,
        metric: metricName
      });
    }
  }

  private async trackAuthFailure(event: SecurityEvent): Promise<void> {
    if (!this.redisClient || !event.context.ipAddress) {
      return;
    }

    try {
      const key = `fanz:auth:failures:${event.context.ipAddress}`;
      const count = await this.redisClient.incr(key);
      await this.redisClient.expire(key, 15 * 60); // 15 minutes

      // Trigger brute force detection after 5 failures
      if (count >= 5) {
        await this.emit({
          type: 'SUSPICIOUS_ACTIVITY',
          severity: 'HIGH',
          context: event.context,
          details: {
            reason: 'Brute force attack detected',
            failureCount: count,
            ipAddress: event.context.ipAddress
          },
          timestamp: new Date()
        });
      }

    } catch (error) {
      this.logger.error('Failed to track authentication failure', {
        error: error.message,
        ip: event.context.ipAddress
      });
    }
  }

  private async handleInjectionAttempt(event: SecurityEvent): Promise<void> {
    // This would implement injection attempt handling logic
    this.logger.warn('Injection attempt detected', {
      ip: event.context.ipAddress,
      path: event.context.path,
      details: event.details
    });
  }

  private async analyzeSuspiciousActivity(event: SecurityEvent): Promise<void> {
    // This would implement pattern analysis and escalation logic
    this.logger.warn('Suspicious activity detected', {
      ip: event.context.ipAddress,
      userId: event.context.userId,
      details: event.details
    });
  }

  // ===============================
  // PUBLIC API
  // ===============================

  /**
   * Get security event statistics
   */
  async getStats(): Promise<Record<string, any>> {
    if (!this.redisClient) {
      return { error: 'Redis not available' };
    }

    try {
      const stats: Record<string, any> = {};

      // Get metrics for different event types
      const metricKeys = await this.redisClient.keys('fanz:security:metrics:*');
      
      for (const key of metricKeys) {
        const metricName = key.split(':').pop();
        const metrics = await this.redisClient.hGetAll(key);
        stats[metricName] = metrics;
      }

      return stats;
    } catch (error) {
      this.logger.error('Failed to get security event stats', { error: error.message });
      return { error: error.message };
    }
  }

  /**
   * Shutdown the event manager gracefully
   */
  async shutdown(): Promise<void> {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    // Process remaining events
    if (this.eventBuffer.length > 0) {
      await this.processBatch();
    }

    // Close Redis connection
    if (this.redisClient) {
      await this.redisClient.quit();
    }

    this.logger.info('Security Event Manager shutdown complete');
  }
}

// ===============================
// SINGLETON INSTANCE
// ===============================

const securityEventManager = new SecurityEventManager();

// ===============================
// EXPORTED FUNCTIONS
// ===============================

/**
 * Emit a security event
 */\nexport async function emitSecurityEvent(event: SecurityEvent): Promise<void> {\n  return securityEventManager.emit(event);\n}\n\n/**\n * Register a security event handler\n */\nexport function onSecurityEvent(\n  eventType: SecurityEventType | 'ALL', \n  handler: SecurityEventHandler\n): void {\n  securityEventManager.on(eventType, handler);\n}\n\n/**\n * Remove a security event handler\n */\nexport function offSecurityEvent(\n  eventType: SecurityEventType | 'ALL', \n  handler: SecurityEventHandler\n): void {\n  securityEventManager.off(eventType, handler);\n}\n\n/**\n * Get security event statistics\n */\nexport async function getSecurityEventStats(): Promise<Record<string, any>> {\n  return securityEventManager.getStats();\n}\n\n/**\n * Create a security event with current context\n */\nexport function createSecurityEvent(\n  type: SecurityEventType,\n  severity: SecuritySeverity,\n  context: Partial<any>,\n  details: Record<string, any> = {}\n): SecurityEvent {\n  return {\n    type,\n    severity,\n    context: {\n      requestId: context.requestId || `event-${Date.now()}`,\n      userId: context.userId,\n      sessionId: context.sessionId,\n      ipAddress: context.ipAddress || 'unknown',\n      userAgent: context.userAgent || 'unknown',\n      timestamp: new Date(),\n      path: context.path || '/unknown',\n      method: context.method || 'UNKNOWN'\n    },\n    details,\n    timestamp: new Date()\n  };\n}\n\n/**\n * Shutdown the security event manager\n */\nexport async function shutdownSecurityEvents(): Promise<void> {\n  return securityEventManager.shutdown();\n}\n\n// ===============================\n// PROCESS CLEANUP\n// ===============================\n\nprocess.on('SIGTERM', async () => {\n  await shutdownSecurityEvents();\n});\n\nprocess.on('SIGINT', async () => {\n  await shutdownSecurityEvents();\n});\n\nexport default securityEventManager;