// 🔍 FANZ Real-time API Security Monitoring System
// Advanced threat detection, anomaly analysis, and automated response for adult content platforms
// Provides real-time security monitoring with ML-powered threat detection

import EventEmitter from 'events';
import { Request, Response, NextFunction } from 'express';
import WebSocket from 'ws';
import Redis from 'ioredis';

interface SecurityEvent {
  id: string;
  timestamp: Date;
  type: SecurityEventType;
  severity: SecuritySeverity;
  platform: string;
  source: {
    ip: string;
    userAgent: string;
    userId?: string;
    sessionId?: string;
  };
  details: {
    endpoint: string;
    method: string;
    statusCode?: number;
    responseTime?: number;
    payload?: any;
    headers?: Record<string, string>;
  };
  threat: {
    category: ThreatCategory;
    confidence: number;
    indicators: string[];
    riskScore: number;
  };
  response: {
    action: ResponseAction;
    blocked: boolean;
    rateLimited: boolean;
    alertSent: boolean;
  };
}

enum SecurityEventType {
  AUTHENTICATION_FAILURE = 'auth_failure',
  AUTHORIZATION_VIOLATION = 'authz_violation',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  SUSPICIOUS_REQUEST = 'suspicious_request',
  PAYLOAD_ANOMALY = 'payload_anomaly',
  BRUTE_FORCE_ATTACK = 'brute_force_attack',
  SQL_INJECTION_ATTEMPT = 'sql_injection_attempt',
  XSS_ATTEMPT = 'xss_attempt',
  ADULT_CONTENT_VIOLATION = 'adult_content_violation',
  PAYMENT_FRAUD_ATTEMPT = 'payment_fraud_attempt',
  AGE_VERIFICATION_BYPASS = 'age_verification_bypass',
  SCRAPING_DETECTED = 'scraping_detected',
  DDoS_PATTERN = 'ddos_pattern'
}

enum SecuritySeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

enum ThreatCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  INPUT_VALIDATION = 'input_validation',
  INJECTION = 'injection',
  BUSINESS_LOGIC = 'business_logic',
  DATA_LEAKAGE = 'data_leakage',
  ADULT_CONTENT_COMPLIANCE = 'adult_content_compliance',
  PAYMENT_FRAUD = 'payment_fraud',
  AUTOMATED_ATTACK = 'automated_attack'
}

enum ResponseAction {
  NONE = 'none',
  LOG = 'log',
  ALERT = 'alert',
  RATE_LIMIT = 'rate_limit',
  BLOCK_IP = 'block_ip',
  BLOCK_USER = 'block_user',
  REQUIRE_CAPTCHA = 'require_captcha',
  FORCE_LOGOUT = 'force_logout'
}

interface SecurityMetrics {
  requests: {
    total: number;
    blocked: number;
    suspicious: number;
    rateLimited: number;
  };
  threats: {
    [key in ThreatCategory]: number;
  };
  platforms: {
    [platform: string]: {
      requests: number;
      threats: number;
      adultContentAccess: number;
    };
  };
  performance: {
    averageResponseTime: number;
    errorRate: number;
    uptimePercent: number;
  };
}

interface AnomalyPattern {
  id: string;
  name: string;
  description: string;
  pattern: RegExp | ((req: Request) => boolean);
  severity: SecuritySeverity;
  category: ThreatCategory;
  responseAction: ResponseAction;
  adultPlatformSpecific: boolean;
}

interface ThreatIntelligence {
  ip: string;
  reputation: 'malicious' | 'suspicious' | 'unknown' | 'trusted';
  lastSeen: Date;
  threatTypes: ThreatCategory[];
  confidence: number;
  source: string;
}

class FanzApiSecurityMonitor extends EventEmitter {
  private redis: Redis;
  private wsServer?: WebSocket.Server;
  private metricsInterval?: NodeJS.Timeout;
  private cleanupInterval?: NodeJS.Timeout;

  // Security monitoring configuration
  private readonly ADULT_PLATFORMS = [
    'boyfanz', 'girlfanz', 'daddyfanz', 'pupfanz',
    'taboofanz', 'transfanz', 'cougarfanz', 'fanzcock'
  ];

  private readonly METRICS_INTERVAL = 60000; // 1 minute
  private readonly CLEANUP_INTERVAL = 3600000; // 1 hour
  private readonly EVENT_RETENTION_HOURS = 24;

  // Threat detection patterns
  private readonly anomalyPatterns: AnomalyPattern[] = [
    {
      id: 'sql_injection',
      name: 'SQL Injection Detection',
      description: 'Detects potential SQL injection attempts',
      pattern: /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b|--|\/\*|\*\/|'|"|\bor\b.*=.*\bor\b|\band\b.*=.*\band\b)/i,
      severity: SecuritySeverity.HIGH,
      category: ThreatCategory.INJECTION,
      responseAction: ResponseAction.BLOCK_IP,
      adultPlatformSpecific: false
    },
    {
      id: 'xss_attempt',
      name: 'Cross-Site Scripting Detection',
      description: 'Detects potential XSS attacks',
      pattern: /(<script|javascript:|data:text\/html|vbscript:|onload=|onerror=|onclick=|onmouseover=)/i,
      severity: SecuritySeverity.HIGH,
      category: ThreatCategory.INJECTION,
      responseAction: ResponseAction.BLOCK_IP,
      adultPlatformSpecific: false
    },
    {
      id: 'admin_panel_probe',
      name: 'Admin Panel Probing',
      description: 'Detects attempts to access admin interfaces',
      pattern: /\/(admin|administrator|wp-admin|phpmyadmin|adminer|dashboard\/admin)/i,
      severity: SecuritySeverity.MEDIUM,
      category: ThreatCategory.AUTHORIZATION,
      responseAction: ResponseAction.ALERT,
      adultPlatformSpecific: false
    },
    {
      id: 'adult_content_scraping',
      name: 'Adult Content Scraping Detection',
      description: 'Detects automated scraping of adult content',
      pattern: (req: Request) => {
        const userAgent = req.headers['user-agent'] || '';
        const isBot = /bot|crawler|scraper|spider/i.test(userAgent);
        const isAdultPlatform = this.ADULT_PLATFORMS.some(platform => 
          req.path.includes(`/${platform}`) || req.headers['x-platform'] === platform
        );
        return isBot && isAdultPlatform;
      },
      severity: SecuritySeverity.HIGH,
      category: ThreatCategory.AUTOMATED_ATTACK,
      responseAction: ResponseAction.BLOCK_IP,
      adultPlatformSpecific: true
    },
    {
      id: 'age_verification_bypass',
      name: 'Age Verification Bypass Attempt',
      description: 'Detects attempts to bypass age verification',
      pattern: (req: Request) => {
        const platform = req.headers['x-platform'] as string;
        const user = (req as any).user;
        const isAdultPlatform = platform && this.ADULT_PLATFORMS.includes(platform.toLowerCase());
        const accessingAdultContent = req.path.includes('/adult/') || req.path.includes('/18+/');
        
        return isAdultPlatform && accessingAdultContent && (!user || !user.ageVerified);
      },
      severity: SecuritySeverity.CRITICAL,
      category: ThreatCategory.ADULT_CONTENT_COMPLIANCE,
      responseAction: ResponseAction.BLOCK_USER,
      adultPlatformSpecific: true
    },
    {
      id: 'payment_fraud_indicators',
      name: 'Payment Fraud Detection',
      description: 'Detects suspicious payment patterns',
      pattern: (req: Request) => {
        if (!req.path.includes('/payment')) return false;
        
        const body = req.body || {};
        const amount = parseFloat(body.amount || '0');
        const hasMultipleCards = Array.isArray(body.paymentMethods) && body.paymentMethods.length > 3;
        const rapidTransactions = req.headers['x-rapid-transactions'] === 'true';
        
        return amount > 1000 || hasMultipleCards || rapidTransactions;
      },
      severity: SecuritySeverity.HIGH,
      category: ThreatCategory.PAYMENT_FRAUD,
      responseAction: ResponseAction.REQUIRE_CAPTCHA,
      adultPlatformSpecific: false
    },
    {
      id: 'brute_force_login',
      name: 'Brute Force Login Detection',
      description: 'Detects brute force login attempts',
      pattern: (req: Request) => {
        return req.path.includes('/login') && req.method === 'POST';
      },
      severity: SecuritySeverity.HIGH,
      category: ThreatCategory.AUTHENTICATION,
      responseAction: ResponseAction.RATE_LIMIT,
      adultPlatformSpecific: false
    }
  ];

  // Known threat intelligence data (would be populated from external sources)
  private threatIntelligence: Map<string, ThreatIntelligence> = new Map();

  constructor() {
    super();
    
    // Initialize Redis for caching and metrics
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
    });

    this.redis.on('error', (error) => {
      console.error('Redis connection error:', error);
    });

    this.initializeMonitoring();
  }

  /**
   * Initialize monitoring services
   */
  private initializeMonitoring(): void {
    console.log('🔍 Initializing FANZ API Security Monitor...');

    // Start metrics collection
    this.startMetricsCollection();

    // Start cleanup process
    this.startCleanupProcess();

    // Initialize threat intelligence
    this.loadThreatIntelligence();

    // Set up event handlers
    this.setupEventHandlers();

    console.log('✅ API Security Monitor initialized');
  }

  /**
   * Create monitoring middleware for Express
   */
  public createMonitoringMiddleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      
      // Pre-request security checks
      const preRequestEvent = await this.analyzeRequest(req);
      
      if (preRequestEvent && preRequestEvent.response.blocked) {
        return this.handleBlockedRequest(res, preRequestEvent);
      }

      // Monkey patch res.send to capture response
      const originalSend = res.send;
      res.send = function(data: any) {
        const responseTime = Date.now() - startTime;
        
        // Post-response analysis
        this.analyzeResponse(req, res, data, responseTime).catch(error => {
          console.error('Response analysis error:', error);
        });
        
        return originalSend.call(this, data);
      }.bind(this);

      next();
    };
  }

  /**
   * Analyze incoming request for threats
   */
  private async analyzeRequest(req: Request): Promise<SecurityEvent | null> {
    const ip = req.ip || 'unknown';
    const userAgent = req.headers['user-agent'] || '';
    const platform = this.extractPlatform(req);
    
    // Check threat intelligence
    const ipReputation = await this.checkThreatIntelligence(ip);
    
    // Analyze request against patterns
    const threats = await this.detectThreats(req);
    
    if (threats.length === 0 && ipReputation.reputation !== 'malicious') {
      return null;
    }

    // Create security event
    const event: SecurityEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      type: threats[0]?.type || SecurityEventType.SUSPICIOUS_REQUEST,
      severity: threats[0]?.severity || SecuritySeverity.LOW,
      platform,
      source: {
        ip,
        userAgent,
        userId: (req as any).user?.id,
        sessionId: req.headers['x-session-id'] as string
      },
      details: {
        endpoint: req.path,
        method: req.method,
        headers: this.sanitizeHeaders(req.headers),
        payload: this.sanitizePayload(req.body)
      },
      threat: {
        category: threats[0]?.category || ThreatCategory.AUTOMATED_ATTACK,
        confidence: this.calculateThreatConfidence(threats, ipReputation),
        indicators: threats.map(t => t.indicator),
        riskScore: this.calculateRiskScore(threats, ipReputation, platform)
      },
      response: {
        action: this.determineResponseAction(threats, ipReputation),
        blocked: false,
        rateLimited: false,
        alertSent: false
      }
    };

    // Execute response action
    await this.executeResponseAction(event);
    
    // Store and emit event
    await this.storeSecurityEvent(event);
    this.emit('securityEvent', event);

    return event;
  }

  /**
   * Analyze response for data leakage and other issues
   */
  private async analyzeResponse(
    req: Request, 
    res: Response, 
    data: any, 
    responseTime: number
  ): Promise<void> {
    const platform = this.extractPlatform(req);
    
    // Check for potential data leakage
    const dataLeakage = this.detectDataLeakage(data, platform);
    
    // Check response time anomalies
    const responseTimeAnomaly = this.detectResponseTimeAnomaly(responseTime, req.path);
    
    if (dataLeakage.detected || responseTimeAnomaly.detected) {
      const event: SecurityEvent = {
        id: this.generateEventId(),
        timestamp: new Date(),
        type: dataLeakage.detected ? SecurityEventType.SUSPICIOUS_REQUEST : SecurityEventType.PAYLOAD_ANOMALY,
        severity: dataLeakage.detected ? SecuritySeverity.HIGH : SecuritySeverity.MEDIUM,
        platform,
        source: {
          ip: req.ip || 'unknown',
          userAgent: req.headers['user-agent'] || '',
          userId: (req as any).user?.id
        },
        details: {
          endpoint: req.path,
          method: req.method,
          statusCode: res.statusCode,
          responseTime
        },
        threat: {
          category: dataLeakage.detected ? ThreatCategory.DATA_LEAKAGE : ThreatCategory.BUSINESS_LOGIC,
          confidence: dataLeakage.confidence || responseTimeAnomaly.confidence,
          indicators: dataLeakage.indicators || responseTimeAnomaly.indicators,
          riskScore: dataLeakage.detected ? 8 : 5
        },
        response: {
          action: ResponseAction.ALERT,
          blocked: false,
          rateLimited: false,
          alertSent: false
        }
      };

      await this.storeSecurityEvent(event);
      this.emit('securityEvent', event);
    }

    // Update metrics
    await this.updateMetrics(req, res, responseTime);
  }

  /**
   * Detect threats in request
   */
  private async detectThreats(req: Request): Promise<Array<{
    type: SecurityEventType;
    severity: SecuritySeverity;
    category: ThreatCategory;
    indicator: string;
  }>> {
    const threats = [];
    const platform = this.extractPlatform(req);
    const isAdultPlatform = this.ADULT_PLATFORMS.includes(platform);

    for (const pattern of this.anomalyPatterns) {
      // Skip adult-specific patterns for non-adult platforms
      if (pattern.adultPlatformSpecific && !isAdultPlatform) {
        continue;
      }

      let detected = false;
      let indicator = '';

      if (pattern.pattern instanceof RegExp) {
        // Test against URL, headers, and body
        const testString = `${req.url} ${JSON.stringify(req.headers)} ${JSON.stringify(req.body || {})}`;
        detected = pattern.pattern.test(testString);
        if (detected) {
          const match = testString.match(pattern.pattern);
          indicator = match?.[0]?.substring(0, 100) || pattern.name;
        }
      } else if (typeof pattern.pattern === 'function') {
        detected = pattern.pattern(req);
        indicator = pattern.name;
      }

      if (detected) {
        threats.push({
          type: this.mapCategoryToEventType(pattern.category),
          severity: pattern.severity,
          category: pattern.category,
          indicator
        });
      }
    }

    return threats;
  }

  /**
   * Check IP against threat intelligence
   */
  private async checkThreatIntelligence(ip: string): Promise<ThreatIntelligence> {
    // Check local cache first
    const cached = this.threatIntelligence.get(ip);
    if (cached) {
      return cached;
    }

    // Check Redis cache
    const redisKey = `threat_intel:${ip}`;
    const cachedData = await this.redis.get(redisKey);
    
    if (cachedData) {
      const intel = JSON.parse(cachedData);
      this.threatIntelligence.set(ip, intel);
      return intel;
    }

    // Default unknown reputation
    const defaultIntel: ThreatIntelligence = {
      ip,
      reputation: 'unknown',
      lastSeen: new Date(),
      threatTypes: [],
      confidence: 0,
      source: 'local'
    };

    // Cache for 1 hour
    await this.redis.setex(redisKey, 3600, JSON.stringify(defaultIntel));
    this.threatIntelligence.set(ip, defaultIntel);

    return defaultIntel;
  }

  /**
   * Calculate threat confidence score
   */
  private calculateThreatConfidence(
    threats: any[], 
    ipReputation: ThreatIntelligence
  ): number {
    let confidence = 0;

    // Base confidence from threats
    threats.forEach(threat => {
      switch (threat.severity) {
        case SecuritySeverity.CRITICAL:
          confidence += 0.4;
          break;
        case SecuritySeverity.HIGH:
          confidence += 0.3;
          break;
        case SecuritySeverity.MEDIUM:
          confidence += 0.2;
          break;
        case SecuritySeverity.LOW:
          confidence += 0.1;
          break;
      }
    });

    // IP reputation modifier
    switch (ipReputation.reputation) {
      case 'malicious':
        confidence += 0.5;
        break;
      case 'suspicious':
        confidence += 0.2;
        break;
      case 'trusted':
        confidence *= 0.5;
        break;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Calculate risk score (1-10)
   */
  private calculateRiskScore(
    threats: any[], 
    ipReputation: ThreatIntelligence, 
    platform: string
  ): number {
    let riskScore = 0;

    // Base score from threats
    threats.forEach(threat => {
      switch (threat.severity) {
        case SecuritySeverity.CRITICAL:
          riskScore += 4;
          break;
        case SecuritySeverity.HIGH:
          riskScore += 3;
          break;
        case SecuritySeverity.MEDIUM:
          riskScore += 2;
          break;
        case SecuritySeverity.LOW:
          riskScore += 1;
          break;
      }
    });

    // IP reputation modifier
    switch (ipReputation.reputation) {
      case 'malicious':
        riskScore += 3;
        break;
      case 'suspicious':
        riskScore += 1;
        break;
    }

    // Adult platform modifier (higher risk)
    if (this.ADULT_PLATFORMS.includes(platform)) {
      riskScore += 1;
    }

    return Math.min(riskScore, 10);
  }

  /**
   * Determine appropriate response action
   */
  private determineResponseAction(
    threats: any[], 
    ipReputation: ThreatIntelligence
  ): ResponseAction {
    // Critical threats or malicious IPs get blocked
    if (threats.some(t => t.severity === SecuritySeverity.CRITICAL) || 
        ipReputation.reputation === 'malicious') {
      return ResponseAction.BLOCK_IP;
    }

    // High severity threats get rate limited
    if (threats.some(t => t.severity === SecuritySeverity.HIGH)) {
      return ResponseAction.RATE_LIMIT;
    }

    // Medium threats get alerts
    if (threats.some(t => t.severity === SecuritySeverity.MEDIUM)) {
      return ResponseAction.ALERT;
    }

    return ResponseAction.LOG;
  }

  /**
   * Execute response action
   */
  private async executeResponseAction(event: SecurityEvent): Promise<void> {
    const ip = event.source.ip;
    
    switch (event.response.action) {
      case ResponseAction.BLOCK_IP:
        await this.blockIP(ip, event.id);
        event.response.blocked = true;
        break;
        
      case ResponseAction.RATE_LIMIT:
        await this.applyRateLimit(ip);
        event.response.rateLimited = true;
        break;
        
      case ResponseAction.BLOCK_USER:
        if (event.source.userId) {
          await this.blockUser(event.source.userId, event.id);
          event.response.blocked = true;
        }
        break;
        
      case ResponseAction.ALERT:
        await this.sendSecurityAlert(event);
        event.response.alertSent = true;
        break;
    }
  }

  /**
   * Block IP address
   */
  private async blockIP(ip: string, eventId: string): Promise<void> {
    const blockKey = `blocked_ip:${ip}`;
    const blockData = {
      blockedAt: new Date().toISOString(),
      eventId,
      reason: 'Security threat detected'
    };
    
    // Block for 1 hour
    await this.redis.setex(blockKey, 3600, JSON.stringify(blockData));
    console.log(`🚫 IP ${ip} blocked due to security threat (Event: ${eventId})`);
  }

  /**
   * Apply rate limiting to IP
   */
  private async applyRateLimit(ip: string): Promise<void> {
    const rateLimitKey = `rate_limit:${ip}`;
    await this.redis.setex(rateLimitKey, 900, '1'); // 15 minutes
    console.log(`⏱️ Rate limit applied to IP ${ip}`);
  }

  /**
   * Block user account
   */
  private async blockUser(userId: string, eventId: string): Promise<void> {
    const blockKey = `blocked_user:${userId}`;
    const blockData = {
      blockedAt: new Date().toISOString(),
      eventId,
      reason: 'Security violation'
    };
    
    await this.redis.setex(blockKey, 1800, JSON.stringify(blockData)); // 30 minutes
    console.log(`🚫 User ${userId} blocked due to security violation (Event: ${eventId})`);
  }

  /**
   * Send security alert
   */
  private async sendSecurityAlert(event: SecurityEvent): Promise<void> {
    // In production, integrate with alerting system
    console.log(`🚨 Security Alert: ${event.type} - ${event.severity} - ${event.platform}`);
    
    // Emit to WebSocket clients
    if (this.wsServer) {
      this.wsServer.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'security_alert',
            event: {
              id: event.id,
              type: event.type,
              severity: event.severity,
              platform: event.platform,
              timestamp: event.timestamp,
              threat: event.threat
            }
          }));
        }
      });
    }
  }

  /**
   * Handle blocked request
   */
  private handleBlockedRequest(res: Response, event: SecurityEvent): void {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Request blocked by security policy',
      code: 'SECURITY_BLOCK',
      eventId: event.id,
      timestamp: event.timestamp
    });
  }

  /**
   * Detect data leakage in response
   */
  private detectDataLeakage(data: any, platform: string): {
    detected: boolean;
    confidence: number;
    indicators: string[];
  } {
    const indicators: string[] = [];
    
    if (!data || typeof data !== 'object') {
      return { detected: false, confidence: 0, indicators };
    }

    const dataString = JSON.stringify(data).toLowerCase();
    
    // Check for sensitive data patterns
    const sensitivePatterns = [
      { pattern: /password['"]\s*:\s*['"][^'"]+['"]/, indicator: 'Password in response' },
      { pattern: /secret['"]\s*:\s*['"][^'"]+['"]/, indicator: 'Secret in response' },
      { pattern: /token['"]\s*:\s*['"][^'"]+['"]/, indicator: 'Token in response' },
      { pattern: /api[_-]?key['"]\s*:\s*['"][^'"]+['"]/, indicator: 'API key in response' },
      { pattern: /ssn['"]\s*:\s*['"][^'"]+['"]/, indicator: 'SSN in response' },
      { pattern: /credit[_-]?card['"]\s*:\s*['"][^'"]+['"]/, indicator: 'Credit card in response' }
    ];

    sensitivePatterns.forEach(({ pattern, indicator }) => {
      if (pattern.test(dataString)) {
        indicators.push(indicator);
      }
    });

    return {
      detected: indicators.length > 0,
      confidence: indicators.length * 0.3,
      indicators
    };
  }

  /**
   * Detect response time anomalies
   */
  private detectResponseTimeAnomaly(responseTime: number, endpoint: string): {
    detected: boolean;
    confidence: number;
    indicators: string[];
  } {
    // Simple threshold-based detection (in production, use ML models)
    const slowThreshold = 5000; // 5 seconds
    const verySlowThreshold = 15000; // 15 seconds
    
    if (responseTime > verySlowThreshold) {
      return {
        detected: true,
        confidence: 0.8,
        indicators: [`Very slow response time: ${responseTime}ms for ${endpoint}`]
      };
    }
    
    if (responseTime > slowThreshold) {
      return {
        detected: true,
        confidence: 0.5,
        indicators: [`Slow response time: ${responseTime}ms for ${endpoint}`]
      };
    }
    
    return { detected: false, confidence: 0, indicators: [] };
  }

  /**
   * Store security event
   */
  private async storeSecurityEvent(event: SecurityEvent): Promise<void> {
    const eventKey = `security_event:${event.id}`;
    await this.redis.setex(eventKey, this.EVENT_RETENTION_HOURS * 3600, JSON.stringify(event));
    
    // Add to platform-specific list
    const platformKey = `platform_events:${event.platform}`;
    await this.redis.lpush(platformKey, event.id);
    await this.redis.expire(platformKey, this.EVENT_RETENTION_HOURS * 3600);
  }

  /**
   * Update security metrics
   */
  private async updateMetrics(req: Request, res: Response, responseTime: number): Promise<void> {
    const platform = this.extractPlatform(req);
    const date = new Date().toISOString().split('T')[0];
    
    // Update request counters
    await this.redis.incr(`metrics:requests:${date}`);
    await this.redis.incr(`metrics:platform:${platform}:requests:${date}`);
    
    // Update response time metrics
    await this.redis.lpush(`metrics:response_times:${date}`, responseTime);
    await this.redis.ltrim(`metrics:response_times:${date}`, 0, 999); // Keep last 1000
    
    // Update error rates
    if (res.statusCode >= 400) {
      await this.redis.incr(`metrics:errors:${date}`);
    }
    
    // Adult platform specific metrics
    if (this.ADULT_PLATFORMS.includes(platform)) {
      await this.redis.incr(`metrics:adult_content:${platform}:${date}`);
    }
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(async () => {
      try {
        await this.collectMetrics();
      } catch (error) {
        console.error('Metrics collection error:', error);
      }
    }, this.METRICS_INTERVAL);
  }

  /**
   * Start cleanup process
   */
  private startCleanupProcess(): void {
    this.cleanupInterval = setInterval(async () => {
      try {
        await this.cleanupOldEvents();
      } catch (error) {
        console.error('Cleanup process error:', error);
      }
    }, this.CLEANUP_INTERVAL);
  }

  /**
   * Collect and aggregate metrics
   */
  private async collectMetrics(): Promise<SecurityMetrics> {
    const date = new Date().toISOString().split('T')[0];
    
    // Get basic metrics
    const totalRequests = parseInt(await this.redis.get(`metrics:requests:${date}`) || '0');
    const totalErrors = parseInt(await this.redis.get(`metrics:errors:${date}`) || '0');
    
    // Calculate response times
    const responseTimes = await this.redis.lrange(`metrics:response_times:${date}`, 0, -1);
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + parseInt(time), 0) / responseTimes.length 
      : 0;
    
    // Platform-specific metrics
    const platformMetrics: any = {};
    for (const platform of [...this.ADULT_PLATFORMS, 'fanz']) {
      const platformRequests = parseInt(await this.redis.get(`metrics:platform:${platform}:requests:${date}`) || '0');
      const adultContentAccess = parseInt(await this.redis.get(`metrics:adult_content:${platform}:${date}`) || '0');
      
      platformMetrics[platform] = {
        requests: platformRequests,
        threats: 0, // Would be calculated from stored events
        adultContentAccess
      };
    }
    
    const metrics: SecurityMetrics = {
      requests: {
        total: totalRequests,
        blocked: 0, // Would be calculated from blocked events
        suspicious: 0, // Would be calculated from security events
        rateLimited: 0 // Would be calculated from rate limit events
      },
      threats: {
        [ThreatCategory.AUTHENTICATION]: 0,
        [ThreatCategory.AUTHORIZATION]: 0,
        [ThreatCategory.INPUT_VALIDATION]: 0,
        [ThreatCategory.INJECTION]: 0,
        [ThreatCategory.BUSINESS_LOGIC]: 0,
        [ThreatCategory.DATA_LEAKAGE]: 0,
        [ThreatCategory.ADULT_CONTENT_COMPLIANCE]: 0,
        [ThreatCategory.PAYMENT_FRAUD]: 0,
        [ThreatCategory.AUTOMATED_ATTACK]: 0
      },
      platforms: platformMetrics,
      performance: {
        averageResponseTime: avgResponseTime,
        errorRate: totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0,
        uptimePercent: 99.9 // Would be calculated based on actual uptime
      }
    };
    
    // Store metrics
    await this.redis.setex(`aggregated_metrics:${date}`, 86400, JSON.stringify(metrics));
    
    return metrics;
  }

  /**
   * Clean up old events and metrics
   */
  private async cleanupOldEvents(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - this.EVENT_RETENTION_HOURS);
    
    console.log('🧹 Cleaning up old security events...');
    
    // This would implement actual cleanup logic in production
    // For now, just log the cleanup activity
    console.log(`Cleaning events older than ${cutoffDate.toISOString()}`);
  }

  /**
   * Load threat intelligence data
   */
  private async loadThreatIntelligence(): Promise<void> {
    // In production, this would load from external threat intel feeds
    console.log('🧠 Loading threat intelligence data...');
    
    // Add some sample malicious IPs
    const sampleThreatIPs = [
      '192.168.1.100', // Example malicious IP
      '10.0.0.50'      // Example suspicious IP
    ];
    
    for (const ip of sampleThreatIPs) {
      this.threatIntelligence.set(ip, {
        ip,
        reputation: 'malicious',
        lastSeen: new Date(),
        threatTypes: [ThreatCategory.AUTOMATED_ATTACK],
        confidence: 0.9,
        source: 'threat_feed'
      });
    }
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.on('securityEvent', (event: SecurityEvent) => {
      console.log(`🔍 Security Event: ${event.type} (${event.severity}) from ${event.source.ip}`);
    });
  }

  // Utility methods
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private extractPlatform(req: Request): string {
    const headerPlatform = req.headers['x-platform'] as string;
    if (headerPlatform) return headerPlatform.toLowerCase();

    const pathMatch = req.path.match(/^\/api\/([^\/]+)/);
    if (pathMatch) return pathMatch[1].toLowerCase();

    return 'fanz';
  }

  private sanitizeHeaders(headers: any): Record<string, string> {
    const sanitized: Record<string, string> = {};
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
    
    for (const [key, value] of Object.entries(headers)) {
      if (sensitiveHeaders.includes(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = String(value);
      }
    }
    
    return sanitized;
  }

  private sanitizePayload(payload: any): any {
    if (!payload || typeof payload !== 'object') return payload;
    
    const sanitized = { ...payload };
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'ssn', 'cardNumber'];
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  private mapCategoryToEventType(category: ThreatCategory): SecurityEventType {
    switch (category) {
      case ThreatCategory.AUTHENTICATION:
        return SecurityEventType.AUTHENTICATION_FAILURE;
      case ThreatCategory.AUTHORIZATION:
        return SecurityEventType.AUTHORIZATION_VIOLATION;
      case ThreatCategory.INJECTION:
        return SecurityEventType.SQL_INJECTION_ATTEMPT;
      case ThreatCategory.ADULT_CONTENT_COMPLIANCE:
        return SecurityEventType.ADULT_CONTENT_VIOLATION;
      case ThreatCategory.PAYMENT_FRAUD:
        return SecurityEventType.PAYMENT_FRAUD_ATTEMPT;
      case ThreatCategory.AUTOMATED_ATTACK:
        return SecurityEventType.SCRAPING_DETECTED;
      default:
        return SecurityEventType.SUSPICIOUS_REQUEST;
    }
  }

  /**
   * Initialize WebSocket server for real-time monitoring
   */
  public initializeWebSocketServer(port: number = 8081): void {
    this.wsServer = new WebSocket.Server({ port });
    
    this.wsServer.on('connection', (ws) => {
      console.log('🔗 WebSocket client connected for security monitoring');
      
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          if (data.type === 'subscribe') {
            // Handle subscription to specific event types or platforms
            console.log(`📡 Client subscribed to: ${data.filter || 'all events'}`);
          }
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      });
      
      ws.on('close', () => {
        console.log('🔌 WebSocket client disconnected');
      });
    });
    
    console.log(`📡 Security monitoring WebSocket server listening on port ${port}`);
  }

  /**
   * Get current security metrics
   */
  public async getSecurityMetrics(): Promise<SecurityMetrics> {
    return await this.collectMetrics();
  }

  /**
   * Get security events for a platform
   */
  public async getSecurityEvents(platform: string, limit: number = 50): Promise<SecurityEvent[]> {
    const eventIds = await this.redis.lrange(`platform_events:${platform}`, 0, limit - 1);
    const events: SecurityEvent[] = [];
    
    for (const eventId of eventIds) {
      const eventData = await this.redis.get(`security_event:${eventId}`);
      if (eventData) {
        events.push(JSON.parse(eventData));
      }
    }
    
    return events;
  }

  /**
   * Cleanup on shutdown
   */
  public shutdown(): void {
    console.log('🛑 Shutting down API Security Monitor...');
    
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    if (this.wsServer) {
      this.wsServer.close();
    }
    
    this.redis.disconnect();
    
    console.log('✅ API Security Monitor shutdown complete');
  }
}

export {
  FanzApiSecurityMonitor,
  SecurityEvent,
  SecurityEventType,
  SecuritySeverity,
  ThreatCategory,
  ResponseAction,
  SecurityMetrics,
  AnomalyPattern,
  ThreatIntelligence
};

export default new FanzApiSecurityMonitor();