import { Request, Response, NextFunction } from 'express';
import { EventEmitter } from 'events';
import { z } from 'zod';
import { randomUUID } from 'crypto';

// Security event types
export enum SecurityEventType {
  // Authentication events
  AUTH_FAILURE = 'AUTH_FAILURE',
  AUTH_SUCCESS = 'AUTH_SUCCESS',
  AUTH_LOCKOUT = 'AUTH_LOCKOUT',
  
  // Authorization events
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  PRIVILEGE_ESCALATION = 'PRIVILEGE_ESCALATION',
  
  // Rate limiting events
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  RATE_LIMIT_ABUSE = 'RATE_LIMIT_ABUSE',
  
  // CSRF and security violations
  CSRF_VIOLATION = 'CSRF_VIOLATION',
  INVALID_TOKEN = 'INVALID_TOKEN',
  
  // Webhook security
  WEBHOOK_SIGNATURE_FAILURE = 'WEBHOOK_SIGNATURE_FAILURE',
  WEBHOOK_REPLAY_ATTEMPT = 'WEBHOOK_REPLAY_ATTEMPT',
  
  // Payment and financial anomalies
  ABNORMAL_PAYMENT_PATTERN = 'ABNORMAL_PAYMENT_PATTERN',
  HIGH_VALUE_TRANSACTION = 'HIGH_VALUE_TRANSACTION',
  SUSPICIOUS_PAYOUT = 'SUSPICIOUS_PAYOUT',
  
  // General security
  SUSPICIOUS_USER_AGENT = 'SUSPICIOUS_USER_AGENT',
  GEO_ANOMALY = 'GEO_ANOMALY',
  BRUTE_FORCE_ATTEMPT = 'BRUTE_FORCE_ATTEMPT',
  
  // System events
  SECURITY_BYPASS_ATTEMPT = 'SECURITY_BYPASS_ATTEMPT',
  ANOMALOUS_BEHAVIOR = 'ANOMALOUS_BEHAVIOR'
}

export enum SecurityThreatLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum AutoResponseAction {
  NONE = 'NONE',
  LOG_ONLY = 'LOG_ONLY',
  THROTTLE_IP = 'THROTTLE_IP',
  THROTTLE_USER = 'THROTTLE_USER',
  BLOCK_IP = 'BLOCK_IP',
  BLOCK_USER = 'BLOCK_USER',
  ALERT_ADMIN = 'ALERT_ADMIN',
  ESCALATE = 'ESCALATE'
}

// Interfaces
export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  timestamp: Date;
  severity: SecurityThreatLevel;
  source: {
    ip: string;
    userAgent?: string;
    userId?: string;
    sessionId?: string;
    location?: {
      country?: string;
      city?: string;
      coords?: { lat: number; lng: number };
    };
  };
  details: {
    endpoint?: string;
    method?: string;
    requestId?: string;
    userRole?: string;
    attemptedAction?: string;
    errorMessage?: string;
    metadata?: Record<string, any>;
  };
  context: {
    previousEvents: number;
    timeWindow: string;
    riskScore: number;
    confidence: number;
  };
}

export interface DetectionRule {
  id: string;
  name: string;
  description: string;
  eventType: SecurityEventType;
  enabled: boolean;
  threshold: {
    count: number;
    timeWindowSeconds: number;
  };
  conditions: {
    field: string;
    operator: 'equals' | 'contains' | 'regex' | 'gt' | 'lt';
    value: any;
  }[];
  severity: SecurityThreatLevel;
  autoResponse: AutoResponseAction;
  alertChannels: ('dashboard' | 'email' | 'slack' | 'webhook')[];
}

export interface SecurityMetric {
  name: string;
  value: number;
  timestamp: Date;
  labels: Record<string, string>;
  type: 'counter' | 'gauge' | 'histogram';
}

export interface ThreatIntelligence {
  maliciousIPs: Set<string>;
  suspiciousUserAgents: RegExp[];
  knownAttackPatterns: RegExp[];
  geoRiskCountries: Set<string>;
  lastUpdated: Date;
}

// Configuration
export interface SecurityMonitoringConfig {
  enableRealTimeMonitoring: boolean;
  enableAutoResponse: boolean;
  metricsCollectionInterval: number; // seconds
  threatIntelligenceUpdateInterval: number; // seconds
  maxEventHistory: number;
  dashboardUpdateInterval: number; // seconds
  alertingEnabled: boolean;
  webhookEndpoint?: string;
  emailAlerts?: {
    enabled: boolean;
    recipients: string[];
    smtpConfig: any;
  };
  slackIntegration?: {
    enabled: boolean;
    webhookUrl: string;
    channel: string;
  };
}

export const DEFAULT_MONITORING_CONFIG: SecurityMonitoringConfig = {
  enableRealTimeMonitoring: true,
  enableAutoResponse: true,
  metricsCollectionInterval: 60, // 1 minute
  threatIntelligenceUpdateInterval: 3600, // 1 hour
  maxEventHistory: 10000,
  dashboardUpdateInterval: 30, // 30 seconds
  alertingEnabled: true
};

// Default detection rules
export const DEFAULT_DETECTION_RULES: DetectionRule[] = [
  {
    id: 'auth-failure-threshold',
    name: 'Authentication Failure Threshold',
    description: 'Detect repeated authentication failures from same IP',
    eventType: SecurityEventType.AUTH_FAILURE,
    enabled: true,
    threshold: { count: 5, timeWindowSeconds: 300 }, // 5 failures in 5 minutes
    conditions: [],
    severity: SecurityThreatLevel.MEDIUM,
    autoResponse: AutoResponseAction.THROTTLE_IP,
    alertChannels: ['dashboard', 'email']
  },
  {
    id: 'brute-force-detection',
    name: 'Brute Force Attack Detection',
    description: 'Detect brute force attacks based on rapid authentication attempts',
    eventType: SecurityEventType.AUTH_FAILURE,
    enabled: true,
    threshold: { count: 20, timeWindowSeconds: 300 }, // 20 failures in 5 minutes
    conditions: [],
    severity: SecurityThreatLevel.HIGH,
    autoResponse: AutoResponseAction.BLOCK_IP,
    alertChannels: ['dashboard', 'email', 'slack']
  },
  {
    id: 'rate-limit-abuse',
    name: 'Rate Limit Abuse Detection',
    description: 'Detect repeated rate limit violations',
    eventType: SecurityEventType.RATE_LIMIT_EXCEEDED,
    enabled: true,
    threshold: { count: 10, timeWindowSeconds: 300 },
    conditions: [],
    severity: SecurityThreatLevel.MEDIUM,
    autoResponse: AutoResponseAction.THROTTLE_IP,
    alertChannels: ['dashboard']
  },
  {
    id: 'privilege-escalation',
    name: 'Privilege Escalation Attempt',
    description: 'Detect attempts to access higher privilege resources',
    eventType: SecurityEventType.PRIVILEGE_ESCALATION,
    enabled: true,
    threshold: { count: 3, timeWindowSeconds: 600 },
    conditions: [],
    severity: SecurityThreatLevel.HIGH,
    autoResponse: AutoResponseAction.ALERT_ADMIN,
    alertChannels: ['dashboard', 'email', 'slack']
  },
  {
    id: 'abnormal-payment-pattern',
    name: 'Abnormal Payment Pattern',
    description: 'Detect unusual payment transaction patterns',
    eventType: SecurityEventType.ABNORMAL_PAYMENT_PATTERN,
    enabled: true,
    threshold: { count: 1, timeWindowSeconds: 0 }, // Immediate alert
    conditions: [],
    severity: SecurityThreatLevel.CRITICAL,
    autoResponse: AutoResponseAction.ESCALATE,
    alertChannels: ['dashboard', 'email', 'slack', 'webhook']
  },
  {
    id: 'csrf-violation',
    name: 'CSRF Violation Detection',
    description: 'Detect CSRF token validation failures',
    eventType: SecurityEventType.CSRF_VIOLATION,
    enabled: true,
    threshold: { count: 5, timeWindowSeconds: 300 },
    conditions: [],
    severity: SecurityThreatLevel.MEDIUM,
    autoResponse: AutoResponseAction.THROTTLE_IP,
    alertChannels: ['dashboard']
  }
];

// Security monitoring system
export class SecurityMonitoringSystem extends EventEmitter {
  private config: SecurityMonitoringConfig;
  private events: Map<string, SecurityEvent[]> = new Map();
  private rules: Map<string, DetectionRule> = new Map();
  private metrics: SecurityMetric[] = [];
  private threatIntel: ThreatIntelligence;
  private blockedIPs: Set<string> = new Set();
  private throttledIPs: Map<string, Date> = new Map();
  private throttledUsers: Map<string, Date> = new Map();

  constructor(config: Partial<SecurityMonitoringConfig> = {}) {
    super();
    this.config = { ...DEFAULT_MONITORING_CONFIG, ...config };
    
    // Initialize default rules
    DEFAULT_DETECTION_RULES.forEach(rule => {
      this.rules.set(rule.id, rule);
    });

    // Initialize threat intelligence
    this.threatIntel = {
      maliciousIPs: new Set(),
      suspiciousUserAgents: [
        /sqlmap/i,
        /nmap/i,
        /nikto/i,
        /burp/i,
        /dirbuster/i
      ],
      knownAttackPatterns: [
        /union\s+select/i,
        /<script/i,
        /javascript:/i,
        /eval\s*\(/i
      ],
      geoRiskCountries: new Set(['XX', 'TOR']), // Placeholder for high-risk countries
      lastUpdated: new Date()
    };

    // Start monitoring loops
    if (this.config.enableRealTimeMonitoring) {
      this.startMonitoring();
    }
  }

  /**
   * Record security event
   */
  recordEvent(eventData: Partial<SecurityEvent>): SecurityEvent {
    const event: SecurityEvent = {
      id: randomUUID(),
      type: eventData.type!,
      timestamp: new Date(),
      severity: eventData.severity || SecurityThreatLevel.LOW,
      source: eventData.source!,
      details: eventData.details || {},
      context: {
        previousEvents: this.countPreviousEvents(eventData.type!, eventData.source?.ip!, 3600),
        timeWindow: '1h',
        riskScore: this.calculateRiskScore(eventData),
        confidence: this.calculateConfidence(eventData)
      }
    };

    // Store event
    const ipKey = event.source.ip;
    if (!this.events.has(ipKey)) {
      this.events.set(ipKey, []);
    }
    this.events.get(ipKey)!.push(event);

    // Trim history
    this.trimEventHistory(ipKey);

    // Process detection rules
    this.processDetectionRules(event);

    // Emit event for real-time processing
    this.emit('securityEvent', event);

    // Update metrics
    this.updateMetrics(event);

    return event;
  }

  /**
   * Process detection rules against event
   */
  private processDetectionRules(event: SecurityEvent): void {
    for (const rule of this.rules.values()) {
      if (!rule.enabled || rule.eventType !== event.type) {
        continue;
      }

      // Check if rule conditions match
      if (!this.evaluateRuleConditions(rule, event)) {
        continue;
      }

      // Check threshold
      const recentEvents = this.getRecentEvents(
        event.source.ip,
        rule.eventType,
        rule.threshold.timeWindowSeconds
      );

      if (recentEvents.length >= rule.threshold.count) {
        this.triggerRuleViolation(rule, event, recentEvents);
      }
    }
  }

  /**
   * Evaluate rule conditions
   */
  private evaluateRuleConditions(rule: DetectionRule, event: SecurityEvent): boolean {
    if (rule.conditions.length === 0) return true;

    return rule.conditions.every(condition => {
      const fieldValue = this.getFieldValue(event, condition.field);
      
      switch (condition.operator) {
        case 'equals':
          return fieldValue === condition.value;
        case 'contains':
          return String(fieldValue).includes(condition.value);
        case 'regex':
          return new RegExp(condition.value).test(String(fieldValue));
        case 'gt':
          return Number(fieldValue) > Number(condition.value);
        case 'lt':
          return Number(fieldValue) < Number(condition.value);
        default:
          return false;
      }
    });
  }

  /**
   * Get field value from event
   */
  private getFieldValue(event: SecurityEvent, field: string): any {
    const parts = field.split('.');
    let value: any = event;
    
    for (const part of parts) {
      value = value?.[part];
    }
    
    return value;
  }

  /**
   * Trigger rule violation
   */
  private triggerRuleViolation(rule: DetectionRule, event: SecurityEvent, events: SecurityEvent[]): void {
    console.warn(`[SecurityMonitoring] Rule violation: ${rule.name}`, {
      ruleId: rule.id,
      eventCount: events.length,
      source: event.source,
      severity: rule.severity
    });

    // Execute auto-response
    if (this.config.enableAutoResponse) {
      this.executeAutoResponse(rule.autoResponse, event);
    }

    // Send alerts
    this.sendAlerts(rule, event, events);

    // Emit rule violation event
    this.emit('ruleViolation', { rule, event, events });
  }

  /**
   * Execute automatic response
   */
  private executeAutoResponse(action: AutoResponseAction, event: SecurityEvent): void {
    const ip = event.source.ip;
    const userId = event.source.userId;

    switch (action) {
      case AutoResponseAction.THROTTLE_IP:
        this.throttledIPs.set(ip, new Date(Date.now() + 15 * 60 * 1000)); // 15 minutes
        console.log(`[SecurityMonitoring] Throttled IP: ${ip}`);
        break;

      case AutoResponseAction.THROTTLE_USER:
        if (userId) {
          this.throttledUsers.set(userId, new Date(Date.now() + 30 * 60 * 1000)); // 30 minutes
          console.log(`[SecurityMonitoring] Throttled User: ${userId}`);
        }
        break;

      case AutoResponseAction.BLOCK_IP:
        this.blockedIPs.add(ip);
        console.log(`[SecurityMonitoring] Blocked IP: ${ip}`);
        break;

      case AutoResponseAction.BLOCK_USER:
        if (userId) {
          // This would integrate with user management system
          console.log(`[SecurityMonitoring] User blocking requested: ${userId}`);
        }
        break;

      case AutoResponseAction.ALERT_ADMIN:
        this.emit('adminAlert', { event, action: 'IMMEDIATE_ATTENTION' });
        break;

      case AutoResponseAction.ESCALATE:
        this.emit('escalation', { event, action: 'CRITICAL_RESPONSE' });
        break;
    }
  }

  /**
   * Send alerts to configured channels
   */
  private sendAlerts(rule: DetectionRule, event: SecurityEvent, events: SecurityEvent[]): void {
    const alertData = {
      rule: rule.name,
      severity: rule.severity,
      event,
      eventCount: events.length,
      timestamp: new Date()
    };

    for (const channel of rule.alertChannels) {
      switch (channel) {
        case 'dashboard':
          this.emit('dashboardAlert', alertData);
          break;
        case 'email':
          this.emit('emailAlert', alertData);
          break;
        case 'slack':
          this.emit('slackAlert', alertData);
          break;
        case 'webhook':
          this.emit('webhookAlert', alertData);
          break;
      }
    }
  }

  /**
   * Start monitoring loops
   */
  private startMonitoring(): void {
    // Metrics collection loop
    setInterval(() => {
      this.collectMetrics();
    }, this.config.metricsCollectionInterval * 1000);

    // Threat intelligence update loop
    setInterval(() => {
      this.updateThreatIntelligence();
    }, this.config.threatIntelligenceUpdateInterval * 1000);

    // Cleanup loop
    setInterval(() => {
      this.cleanup();
    }, 300 * 1000); // Every 5 minutes
  }

  /**
   * Collect security metrics
   */
  private collectMetrics(): void {
    const now = new Date();
    
    // Event count metrics
    for (const [eventType, count] of this.getEventCounts()) {
      this.metrics.push({
        name: 'security_events_total',
        value: count,
        timestamp: now,
        labels: { event_type: eventType },
        type: 'counter'
      });
    }

    // Active blocks/throttles
    this.metrics.push({
      name: 'security_blocked_ips',
      value: this.blockedIPs.size,
      timestamp: now,
      labels: {},
      type: 'gauge'
    });

    this.metrics.push({
      name: 'security_throttled_ips',
      value: this.throttledIPs.size,
      timestamp: now,
      labels: {},
      type: 'gauge'
    });

    // Trim metrics history
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    this.metrics = this.metrics.filter(m => 
      now.getTime() - m.timestamp.getTime() < maxAge
    );
  }

  /**
   * Get event counts by type
   */
  private getEventCounts(): Map<string, number> {
    const counts = new Map<string, number>();
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);

    for (const events of this.events.values()) {
      for (const event of events) {
        if (event.timestamp >= hourAgo) {
          const current = counts.get(event.type) || 0;
          counts.set(event.type, current + 1);
        }
      }
    }

    return counts;
  }

  /**
   * Update threat intelligence
   */
  private updateThreatIntelligence(): void {
    // This would integrate with threat intelligence feeds
    console.log('[SecurityMonitoring] Updating threat intelligence...');
    this.threatIntel.lastUpdated = new Date();
  }

  /**
   * Cleanup expired data
   */
  private cleanup(): void {
    const now = new Date();

    // Clean up throttled IPs
    for (const [ip, expiry] of this.throttledIPs.entries()) {
      if (expiry < now) {
        this.throttledIPs.delete(ip);
      }
    }

    // Clean up throttled users
    for (const [userId, expiry] of this.throttledUsers.entries()) {
      if (expiry < now) {
        this.throttledUsers.delete(userId);
      }
    }
  }

  /**
   * Middleware for security monitoring
   */
  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Check if IP is blocked
      const clientIP = req.ip || req.connection.remoteAddress || '';
      
      if (this.blockedIPs.has(clientIP)) {
        return res.status(403).json({
          error: 'Access denied',
          code: 'IP_BLOCKED'
        });
      }

      // Check if IP is throttled
      const throttleExpiry = this.throttledIPs.get(clientIP);
      if (throttleExpiry && throttleExpiry > new Date()) {
        return res.status(429).json({
          error: 'Request throttled due to security concerns',
          code: 'IP_THROTTLED',
          retryAfter: Math.ceil((throttleExpiry.getTime() - Date.now()) / 1000)
        });
      }

      // Check if user is throttled
      const userId = req.user?.id;
      if (userId) {
        const userThrottleExpiry = this.throttledUsers.get(userId);
        if (userThrottleExpiry && userThrottleExpiry > new Date()) {
          return res.status(429).json({
            error: 'User throttled due to security concerns',
            code: 'USER_THROTTLED',
            retryAfter: Math.ceil((userThrottleExpiry.getTime() - Date.now()) / 1000)
          });
        }
      }

      // Monitor request
      const startTime = Date.now();
      
      // Hook into response to capture events
      const originalSend = res.send;
      res.send = (data: any) => {
        const responseTime = Date.now() - startTime;
        
        // Record security events based on response
        if (res.statusCode === 401) {
          this.recordEvent({
            type: SecurityEventType.AUTH_FAILURE,
            severity: SecurityThreatLevel.MEDIUM,
            source: {
              ip: clientIP,
              userAgent: req.headers['user-agent'],
              userId,
              sessionId: req.sessionId
            },
            details: {
              endpoint: req.path,
              method: req.method,
              requestId: req.id
            }
          });
        } else if (res.statusCode === 403) {
          this.recordEvent({
            type: SecurityEventType.INSUFFICIENT_PERMISSIONS,
            severity: SecurityThreatLevel.MEDIUM,
            source: {
              ip: clientIP,
              userAgent: req.headers['user-agent'],
              userId,
              sessionId: req.sessionId
            },
            details: {
              endpoint: req.path,
              method: req.method,
              requestId: req.id,
              userRole: req.user?.role
            }
          });
        } else if (res.statusCode === 429) {
          this.recordEvent({
            type: SecurityEventType.RATE_LIMIT_EXCEEDED,
            severity: SecurityThreatLevel.LOW,
            source: {
              ip: clientIP,
              userAgent: req.headers['user-agent'],
              userId,
              sessionId: req.sessionId
            },
            details: {
              endpoint: req.path,
              method: req.method,
              requestId: req.id
            }
          });
        }

        return originalSend.call(this, data);
      };

      next();
    };
  }

  // Utility methods
  private countPreviousEvents(type: SecurityEventType, ip: string, timeWindowSeconds: number): number {
    const events = this.events.get(ip) || [];
    const cutoff = new Date(Date.now() - timeWindowSeconds * 1000);
    
    return events.filter(e => e.type === type && e.timestamp >= cutoff).length;
  }

  private getRecentEvents(ip: string, type: SecurityEventType, timeWindowSeconds: number): SecurityEvent[] {
    const events = this.events.get(ip) || [];
    const cutoff = new Date(Date.now() - timeWindowSeconds * 1000);
    
    return events.filter(e => e.type === type && e.timestamp >= cutoff);
  }

  private trimEventHistory(ip: string): void {
    const events = this.events.get(ip);
    if (events && events.length > 100) {
      events.splice(0, events.length - 100);
    }
  }

  private calculateRiskScore(eventData: Partial<SecurityEvent>): number {
    let score = 0;
    
    // Base score by event type
    switch (eventData.type) {
      case SecurityEventType.AUTH_FAILURE:
        score += 10;
        break;
      case SecurityEventType.PRIVILEGE_ESCALATION:
        score += 50;
        break;
      case SecurityEventType.ABNORMAL_PAYMENT_PATTERN:
        score += 80;
        break;
      default:
        score += 5;
    }
    
    // Additional risk factors
    if (eventData.source?.userAgent) {
      const ua = eventData.source.userAgent;
      if (this.threatIntel.suspiciousUserAgents.some(pattern => pattern.test(ua))) {
        score += 30;
      }
    }
    
    return Math.min(score, 100);
  }

  private calculateConfidence(eventData: Partial<SecurityEvent>): number {
    // Simplified confidence calculation
    return 75 + Math.random() * 20; // 75-95% confidence
  }

  // Public API methods
  public getMetrics(): SecurityMetric[] {
    return [...this.metrics];
  }

  public getEvents(ip?: string, limit = 100): SecurityEvent[] {
    if (ip) {
      return (this.events.get(ip) || []).slice(-limit);
    }
    
    const allEvents: SecurityEvent[] = [];
    for (const events of this.events.values()) {
      allEvents.push(...events);
    }
    
    return allEvents
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  public addDetectionRule(rule: DetectionRule): void {
    this.rules.set(rule.id, rule);
  }

  public removeDetectionRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  public getDetectionRules(): DetectionRule[] {
    return Array.from(this.rules.values());
  }

  public unblockIP(ip: string): boolean {
    return this.blockedIPs.delete(ip);
  }

  public unthrottleIP(ip: string): boolean {
    return this.throttledIPs.delete(ip);
  }

  public unthrottleUser(userId: string): boolean {
    return this.throttledUsers.delete(userId);
  }
}

// Export utilities
export { SecurityMonitoringSystem };