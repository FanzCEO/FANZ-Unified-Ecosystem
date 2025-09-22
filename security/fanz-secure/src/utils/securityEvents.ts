/**
 * @fanz/secure - Security Event Management & Monitoring
 * Centralized security event handling with real-time alerting
 */

import { EventEmitter } from 'events';
import { SecurityEvent, SecurityEventType, SecuritySeverity, SecurityContext, createSecurityLogger } from './logger.js';

// ===============================
// TYPES
// ===============================

export interface SecurityEventHandler {
  (event: SecurityEvent): Promise<void> | void;
}

export interface SecurityAlert {
  id: string;
  timestamp: Date;
  severity: SecuritySeverity;
  events: SecurityEvent[];
  alertType: SecurityAlertType;
  threshold: number;
  timeWindow: number; // minutes
  resolved: boolean;
}

export type SecurityAlertType = 
  | 'BRUTE_FORCE_ATTACK'
  | 'RATE_LIMIT_BREACH'
  | 'MULTIPLE_FAILURES'
  | 'SUSPICIOUS_PATTERN'
  | 'COMPLIANCE_VIOLATION'
  | 'SYSTEM_COMPROMISE'
  | 'DATA_BREACH_ATTEMPT';

// ===============================
// SECURITY EVENT MANAGER
// ===============================

class SecurityEventManager extends EventEmitter {
  private logger = createSecurityLogger('security-events');
  private eventBuffer: Map<string, SecurityEvent[]> = new Map();
  private alerts: Map<string, SecurityAlert> = new Map();
  private eventStats: Map<SecurityEventType, number> = new Map();
  private handlers: Map<SecurityEventType | 'ALL', SecurityEventHandler[]> = new Map();
  
  // Alert thresholds
  private readonly alertThresholds: Record<SecurityAlertType, {
    eventTypes: SecurityEventType[];
    threshold: number;
    timeWindow: number; // minutes
    severity: SecuritySeverity;
  }> = {
    BRUTE_FORCE_ATTACK: {
      eventTypes: ['AUTH_FAILURE'],
      threshold: 5,
      timeWindow: 10,
      severity: 'high'
    },
    RATE_LIMIT_BREACH: {
      eventTypes: ['RATE_LIMIT_EXCEEDED'],
      threshold: 10,
      timeWindow: 5,
      severity: 'medium'
    },
    MULTIPLE_FAILURES: {
      eventTypes: ['AUTH_FAILURE', 'PERMISSION_DENIED'],
      threshold: 15,
      timeWindow: 15,
      severity: 'medium'
    },
    SUSPICIOUS_PATTERN: {
      eventTypes: ['SUSPICIOUS_ACTIVITY', 'MALICIOUS_INPUT'],
      threshold: 3,
      timeWindow: 30,
      severity: 'high'
    },
    COMPLIANCE_VIOLATION: {
      eventTypes: ['COMPLIANCE_VIOLATION'],
      threshold: 1,
      timeWindow: 1,
      severity: 'critical'
    },
    SYSTEM_COMPROMISE: {
      eventTypes: ['SYSTEM_COMPROMISE', 'DATA_BREACH_ATTEMPT'],
      threshold: 1,
      timeWindow: 1,
      severity: 'critical'
    },
    DATA_BREACH_ATTEMPT: {
      eventTypes: ['DATA_BREACH_ATTEMPT', 'SQL_INJECTION', 'XSS_ATTEMPT'],
      threshold: 2,
      timeWindow: 5,
      severity: 'critical'
    }
  };

  constructor() {
    super();
    this.setupEventCleanup();
    this.setupAlertProcessing();
  }

  /**
   * Emit a security event
   */
  async emit(event: SecurityEvent): Promise<void> {
    try {
      // Log the event
      this.logger.security(event);
      
      // Update statistics
      this.updateStats(event);
      
      // Buffer event for pattern analysis
      await this.bufferEvent(event);
      
      // Check for alert conditions
      await this.checkAlertConditions(event);
      
      // Emit to registered handlers
      await this.notifyHandlers(event);
      
      // Emit to base EventEmitter
      super.emit('security-event', event);
      super.emit(event.type, event);
      
    } catch (error) {
      this.logger.error('Failed to process security event', {
        event: event.type,
        error: error.message
      });
    }
  }

  /**
   * Register event handler
   */
  on(eventType: SecurityEventType | 'ALL', handler: SecurityEventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }

  /**
   * Remove event handler
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

  /**
   * Get security event statistics
   */
  async getStats(): Promise<Record<string, any>> {
    const totalEvents = Array.from(this.eventStats.values()).reduce((sum, count) => sum + count, 0);
    const activeAlerts = Array.from(this.alerts.values()).filter(alert => !alert.resolved);
    
    return {
      totalEvents,
      eventsByType: Object.fromEntries(this.eventStats),
      activeAlerts: activeAlerts.length,
      totalAlerts: this.alerts.size,
      alertsByType: this.groupAlertsByType(),
      recentEvents: this.getRecentEvents(50),
      threatLevel: this.calculateThreatLevel()
    };
  }

  /**
   * Get recent events
   */
  private getRecentEvents(limit: number): SecurityEvent[] {
    const allEvents: SecurityEvent[] = [];
    
    for (const events of this.eventBuffer.values()) {
      allEvents.push(...events);
    }
    
    return allEvents
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Calculate overall threat level
   */
  private calculateThreatLevel(): 'low' | 'medium' | 'high' | 'critical' {
    const activeAlerts = Array.from(this.alerts.values()).filter(alert => !alert.resolved);
    
    if (activeAlerts.some(alert => alert.severity === 'critical')) {
      return 'critical';
    }
    
    if (activeAlerts.some(alert => alert.severity === 'high') || activeAlerts.length > 5) {
      return 'high';
    }
    
    if (activeAlerts.some(alert => alert.severity === 'medium') || activeAlerts.length > 2) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Group alerts by type
   */
  private groupAlertsByType(): Record<string, number> {
    const groups: Record<string, number> = {};
    
    for (const alert of this.alerts.values()) {
      groups[alert.alertType] = (groups[alert.alertType] || 0) + 1;
    }
    
    return groups;
  }

  /**
   * Update event statistics
   */
  private updateStats(event: SecurityEvent): void {
    const current = this.eventStats.get(event.type) || 0;
    this.eventStats.set(event.type, current + 1);
  }

  /**
   * Buffer event for pattern analysis
   */
  private async bufferEvent(event: SecurityEvent): Promise<void> {
    const bufferKey = `${event.context.ipAddress}:${event.context.userId || 'anonymous'}`;
    
    if (!this.eventBuffer.has(bufferKey)) {
      this.eventBuffer.set(bufferKey, []);
    }
    
    const buffer = this.eventBuffer.get(bufferKey)!;
    buffer.push(event);
    
    // Keep only recent events (last 24 hours)
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const filtered = buffer.filter(e => e.timestamp > cutoff);
    this.eventBuffer.set(bufferKey, filtered);
  }

  /**
   * Check for alert conditions
   */
  private async checkAlertConditions(event: SecurityEvent): Promise<void> {
    for (const [alertType, config] of Object.entries(this.alertThresholds)) {
      if (config.eventTypes.includes(event.type)) {
        await this.evaluateAlert(alertType as SecurityAlertType, config, event);
      }
    }
  }

  /**
   * Evaluate specific alert condition
   */
  private async evaluateAlert(
    alertType: SecurityAlertType,
    config: typeof this.alertThresholds[SecurityAlertType],
    triggerEvent: SecurityEvent
  ): Promise<void> {
    const bufferKey = `${triggerEvent.context.ipAddress}:${triggerEvent.context.userId || 'anonymous'}`;
    const events = this.eventBuffer.get(bufferKey) || [];
    
    // Check time window
    const windowStart = new Date(Date.now() - config.timeWindow * 60 * 1000);
    const relevantEvents = events.filter(event => 
      event.timestamp > windowStart && 
      config.eventTypes.includes(event.type)
    );
    
    if (relevantEvents.length >= config.threshold) {
      await this.createAlert(alertType, config, relevantEvents, triggerEvent.context);
    }
  }

  /**
   * Create security alert
   */
  private async createAlert(
    alertType: SecurityAlertType,
    config: typeof this.alertThresholds[SecurityAlertType],
    events: SecurityEvent[],
    context: SecurityContext
  ): Promise<void> {
    const alertId = `${alertType}_${context.ipAddress}_${Date.now()}`;
    
    // Check if similar alert already exists
    const existingAlert = Array.from(this.alerts.values()).find(alert =>
      alert.alertType === alertType &&
      alert.events.some(e => e.context.ipAddress === context.ipAddress) &&
      !alert.resolved &&
      (Date.now() - alert.timestamp.getTime()) < config.timeWindow * 60 * 1000
    );
    
    if (existingAlert) {
      return; // Don't create duplicate alerts
    }
    
    const alert: SecurityAlert = {
      id: alertId,
      timestamp: new Date(),
      severity: config.severity,
      events,
      alertType,
      threshold: config.threshold,
      timeWindow: config.timeWindow,
      resolved: false
    };
    
    this.alerts.set(alertId, alert);
    
    // Log the alert
    this.logger.warn('Security alert triggered', {
      alertId,
      alertType,
      severity: config.severity,
      eventCount: events.length,
      threshold: config.threshold,
      context: {
        ipAddress: context.ipAddress,
        userId: context.userId
      }
    });
    
    // Emit alert event
    super.emit('security-alert', alert);
    
    // Take immediate action for critical alerts
    if (config.severity === 'critical') {
      await this.handleCriticalAlert(alert);
    }
  }

  /**
   * Handle critical security alerts
   */
  private async handleCriticalAlert(alert: SecurityAlert): Promise<void> {
    this.logger.fatal('CRITICAL SECURITY ALERT', {
      alertId: alert.id,
      alertType: alert.alertType,
      eventCount: alert.events.length,
      affectedIPs: [...new Set(alert.events.map(e => e.context.ipAddress))]
    });
    
    // In production, integrate with:
    // - Incident response system
    // - Security team notifications
    // - Automatic blocking/quarantine
    // - Compliance reporting
  }

  /**
   * Notify registered handlers
   */
  private async notifyHandlers(event: SecurityEvent): Promise<void> {
    // Notify specific event type handlers
    const specificHandlers = this.handlers.get(event.type) || [];
    const allHandlers = this.handlers.get('ALL') || [];
    
    const handlers = [...specificHandlers, ...allHandlers];
    
    for (const handler of handlers) {
      try {
        await handler(event);
      } catch (error) {
        this.logger.error('Security event handler failed', {
          eventType: event.type,
          handlerError: error.message
        });
      }
    }
  }

  /**
   * Setup periodic event cleanup
   */
  private setupEventCleanup(): void {
    // Clean up old events every hour
    setInterval(() => {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      for (const [key, events] of this.eventBuffer.entries()) {
        const filtered = events.filter(e => e.timestamp > cutoff);
        
        if (filtered.length === 0) {
          this.eventBuffer.delete(key);
        } else {
          this.eventBuffer.set(key, filtered);
        }
      }
      
      this.logger.debug('Cleaned up old security events', {
        activeBuffers: this.eventBuffer.size
      });
    }, 60 * 60 * 1000); // 1 hour
  }

  /**
   * Setup alert processing
   */
  private setupAlertProcessing(): void {
    // Process and resolve old alerts every 30 minutes
    setInterval(() => {
      const cutoff = new Date(Date.now() - 4 * 60 * 60 * 1000); // 4 hours
      let resolvedCount = 0;
      
      for (const [alertId, alert] of this.alerts.entries()) {
        if (!alert.resolved && alert.timestamp < cutoff) {
          alert.resolved = true;
          resolvedCount++;
        }
      }
      
      if (resolvedCount > 0) {
        this.logger.info('Auto-resolved old security alerts', {
          resolvedCount
        });
      }
    }, 30 * 60 * 1000); // 30 minutes
  }

  /**
   * Shutdown the event manager
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down security event manager', {
      bufferedEvents: Array.from(this.eventBuffer.values()).flat().length,
      activeAlerts: Array.from(this.alerts.values()).filter(a => !a.resolved).length
    });
    
    this.removeAllListeners();
    this.eventBuffer.clear();
  }
}

// ===============================
// SINGLETON INSTANCE
// ===============================

const securityEventManager = new SecurityEventManager();

// ===============================
// PUBLIC API
// ===============================

/**
 * Emit a security event
 */
export async function emitSecurityEvent(event: SecurityEvent): Promise<void> {
  return securityEventManager.emit(event);
}

/**
 * Register a security event handler
 */
export function onSecurityEvent(
  eventType: SecurityEventType | 'ALL', 
  handler: SecurityEventHandler
): void {
  securityEventManager.on(eventType, handler);
}

/**
 * Remove a security event handler
 */
export function offSecurityEvent(
  eventType: SecurityEventType | 'ALL', 
  handler: SecurityEventHandler
): void {
  securityEventManager.off(eventType, handler);
}

/**
 * Get security event statistics
 */
export async function getSecurityEventStats(): Promise<Record<string, any>> {
  return securityEventManager.getStats();
}

/**
 * Create a security event with current context
 */
export function createSecurityEvent(
  type: SecurityEventType,
  severity: SecuritySeverity,
  context: Partial<SecurityContext>,
  details: Record<string, any> = {}
): SecurityEvent {
  return {
    type,
    severity,
    context: {
      requestId: context.requestId || `event-${Date.now()}`,
      userId: context.userId,
      sessionId: context.sessionId,
      ipAddress: context.ipAddress || 'unknown',
      userAgent: context.userAgent || 'unknown',
      timestamp: new Date(),
      path: context.path || '/unknown',
      method: context.method || 'UNKNOWN'
    },
    details,
    timestamp: new Date()
  };
}

/**
 * Shutdown the security event manager
 */
export async function shutdownSecurityEvents(): Promise<void> {
  return securityEventManager.shutdown();
}

// ===============================
// PROCESS CLEANUP
// ===============================

process.on('SIGTERM', async () => {
  await shutdownSecurityEvents();
});

process.on('SIGINT', async () => {
  await shutdownSecurityEvents();
});

export default securityEventManager;