/**
 * @fanzsecurity/integration - Security System Orchestrator
 * Central coordination layer for all FANZ security systems
 * Seamless integration between Zero-Trust, FanzDash, FanzSign, and Monitoring
 */

import { EventEmitter } from 'events';
import { createSecurityLogger } from '../fanz-secure/src/utils/logger.js';
import { emitSecurityEvent, createSecurityEvent } from '../fanz-secure/src/utils/securityEvents.js';

// Import all security systems
import { zeroTrustCore } from '../zero-trust/ZeroTrustSecurityCore.js';
import { fanzDashSecurityCenter } from '../fanzdash-control/FanzDashSecurityCenter.js';
import { fanzSignForensicCore } from '../fanzsign/FanzSignForensicCore.js';
import { securityMonitoring } from '../monitoring/SecurityMonitoringCore.js';

import * as redis from 'redis';
import crypto from 'crypto';
import { config } from '../fanz-secure/src/config.js';

// ===============================
// TYPES & INTERFACES
// ===============================

export interface SecurityContext {
  user_id?: string;
  session_id: string;
  platform: string;
  ip_address: string;
  user_agent: string;
  timestamp: Date;
  request_metadata: RequestMetadata;
  security_state: SecurityState;
}

export interface RequestMetadata {
  method: string;
  path: string;
  headers: Record<string, string>;
  body_hash?: string;
  content_type?: string;
  content_length?: number;
  geolocation?: any;
  device_fingerprint?: any;
}

export interface SecurityState {
  zero_trust_score: number;
  behavioral_score: number;
  content_risk_score: number;
  network_risk_score: number;
  overall_risk_score: number;
  trust_level: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  requires_challenge: boolean;
  challenge_type?: string;
  blocked: boolean;
  block_reason?: string;
}

export interface SecurityDecision {
  action: 'allow' | 'challenge' | 'block' | 'escalate';
  reason: string;
  confidence: number;
  metadata: Record<string, any>;
  required_actions?: SecurityAction[];
  expires_at?: Date;
}

export interface SecurityAction {
  type: 'log_event' | 'create_incident' | 'create_signature' | 'update_metrics' | 'send_alert';
  priority: 'low' | 'medium' | 'high' | 'critical';
  data: Record<string, any>;
}

export interface IntegrationConfig {
  zero_trust_enabled: boolean;
  forensic_signatures_enabled: boolean;
  real_time_monitoring: boolean;
  incident_auto_creation: boolean;
  threat_intelligence_enabled: boolean;
  compliance_monitoring: boolean;
  auto_escalation_enabled: boolean;
  dashboard_integration: boolean;
}

export interface SecurityEvent {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  platform: string;
  context: SecurityContext;
  details: Record<string, any>;
  processed_by: string[];
  actions_taken: SecurityAction[];
}

export interface SystemHealth {
  zero_trust: { status: string; last_check: Date; errors: number };
  fanzdash: { status: string; last_check: Date; errors: number };
  fanzsign: { status: string; last_check: Date; errors: number };
  monitoring: { status: string; last_check: Date; errors: number };
  overall_status: 'healthy' | 'degraded' | 'critical' | 'offline';
  integration_errors: number;
}

// ===============================
// SECURITY ORCHESTRATOR
// ===============================

export class SecurityOrchestrator extends EventEmitter {
  private logger = createSecurityLogger('security-orchestrator');
  private redisClient: redis.RedisClientType;
  
  // Integration configuration
  private config: IntegrationConfig = {
    zero_trust_enabled: true,
    forensic_signatures_enabled: true,
    real_time_monitoring: true,
    incident_auto_creation: true,
    threat_intelligence_enabled: true,
    compliance_monitoring: true,
    auto_escalation_enabled: true,
    dashboard_integration: true
  };
  
  // System health tracking
  private systemHealth: SystemHealth = {
    zero_trust: { status: 'unknown', last_check: new Date(), errors: 0 },
    fanzdash: { status: 'unknown', last_check: new Date(), errors: 0 },
    fanzsign: { status: 'unknown', last_check: new Date(), errors: 0 },
    monitoring: { status: 'unknown', last_check: new Date(), errors: 0 },
    overall_status: 'unknown',
    integration_errors: 0
  };
  
  // Event processing
  private eventQueue: SecurityEvent[] = [];
  private processingEvents = false;
  
  // Metrics
  private processedEvents = 0;
  private errorCount = 0;
  private lastHealthCheck = new Date();

  constructor() {
    super();
    this.initialize();
  }

  /**
   * Initialize the Security Orchestrator
   */
  private async initialize(): Promise<void> {
    this.logger.info('🎭 Initializing Security System Orchestrator');
    
    await this.setupRedisConnection();
    this.setupSystemIntegrations();
    this.startHealthMonitoring();
    this.startEventProcessing();
    
    this.logger.info('✅ Security Orchestrator fully operational');
  }

  /**
   * Setup Redis connection for coordination
   */
  private async setupRedisConnection(): Promise<void> {
    try {
      this.redisClient = redis.createClient({
        url: config.redisUrl,
        socket: { 
          reconnectStrategy: (retries) => Math.min(retries * 50, 500)
        }
      });

      await this.redisClient.connect();
      this.logger.info('🔗 Orchestrator Redis connection established');
    } catch (error) {
      this.logger.error('Failed to setup Redis connection', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  /**
   * Setup integrations with all security systems
   */
  private setupSystemIntegrations(): void {
    // Zero Trust integration
    if (this.config.zero_trust_enabled) {
      zeroTrustCore.on('evaluation_complete', (data) => {
        this.handleZeroTrustEvaluation(data);
      });
      
      zeroTrustCore.on('challenge_required', (data) => {
        this.handleZeroTrustChallenge(data);
      });
      
      zeroTrustCore.on('re-authentication-required', (data) => {
        this.handleReAuthenticationRequired(data);
      });
    }

    // FanzDash Control Center integration
    if (this.config.dashboard_integration) {
      fanzDashSecurityCenter.on('incident_created', (incident) => {
        this.handleIncidentCreated(incident);
      });
      
      fanzDashSecurityCenter.on('alert_triggered', (alert) => {
        this.handleAlertTriggered(alert);
      });
    }

    // FanzSign Forensics integration
    if (this.config.forensic_signatures_enabled) {
      fanzSignForensicCore.on('signature_created', (signature) => {
        this.handleForensicSignatureCreated(signature);
      });
      
      fanzSignForensicCore.on('behavioral_anomaly_detected', (anomaly) => {
        this.handleBehavioralAnomaly(anomaly);
      });
      
      fanzSignForensicCore.on('high_risk_content_detected', (content) => {
        this.handleHighRiskContent(content);
      });
      
      fanzSignForensicCore.on('network_anomaly_detected', (anomaly) => {
        this.handleNetworkAnomaly(anomaly);
      });
    }

    // Security Monitoring integration
    if (this.config.real_time_monitoring) {
      securityMonitoring.on('alert_triggered', (alert) => {
        this.handleMonitoringAlert(alert);
      });
      
      securityMonitoring.on('metric_threshold_exceeded', (data) => {
        this.handleMetricThreshold(data);
      });
    }

    this.logger.info('🔗 Security system integrations configured', {
      zero_trust: this.config.zero_trust_enabled,
      forensics: this.config.forensic_signatures_enabled,
      monitoring: this.config.real_time_monitoring,
      dashboard: this.config.dashboard_integration
    });
  }

  /**
   * Process incoming security request through all systems
   */
  public async processSecurityRequest(context: SecurityContext): Promise<SecurityDecision> {
    try {
      this.logger.debug('Processing security request', {
        session_id: context.session_id,
        platform: context.platform,
        ip_address: context.ip_address
      });

      // Initialize security state
      context.security_state = {
        zero_trust_score: 0,
        behavioral_score: 0,
        content_risk_score: 0,
        network_risk_score: 0,
        overall_risk_score: 0,
        trust_level: 'medium',
        requires_challenge: false,
        blocked: false
      };

      // Step 1: Zero Trust Evaluation
      if (this.config.zero_trust_enabled) {
        const ztResult = await this.performZeroTrustEvaluation(context);
        context.security_state.zero_trust_score = ztResult.risk_score;
        context.security_state.requires_challenge = ztResult.requires_challenge;
        context.security_state.challenge_type = ztResult.challenge_type;
      }

      // Step 2: Create Forensic Signature
      if (this.config.forensic_signatures_enabled) {
        await this.createForensicSignature(context);
      }

      // Step 3: Update Monitoring Metrics
      if (this.config.real_time_monitoring) {
        this.updateSecurityMetrics(context);
      }

      // Step 4: Calculate Overall Risk Score
      const overallRiskScore = this.calculateOverallRiskScore(context);
      context.security_state.overall_risk_score = overallRiskScore;
      context.security_state.trust_level = this.determineTrustLevel(overallRiskScore);

      // Step 5: Make Security Decision
      const decision = this.makeSecurityDecision(context);

      // Step 6: Execute Required Actions
      await this.executeSecurityActions(decision.required_actions || [], context);

      // Step 7: Log Security Event
      await this.logSecurityEvent(context, decision);

      this.processedEvents++;
      return decision;

    } catch (error) {
      this.errorCount++;
      this.logger.error('Security request processing failed', {
        session_id: context.session_id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Return safe default decision
      return {
        action: 'block',
        reason: 'Security processing error',
        confidence: 1.0,
        metadata: { error: true },
        required_actions: [{
          type: 'create_incident',
          priority: 'high',
          data: { reason: 'Security processing failure' }
        }]
      };
    }
  }

  /**
   * Perform Zero Trust evaluation
   */
  private async performZeroTrustEvaluation(context: SecurityContext): Promise<any> {
    try {
      // Create zero trust context
      const ztContext = {
        userId: context.user_id,
        sessionId: context.session_id,
        ipAddress: context.ip_address,
        userAgent: context.user_agent,
        platform: context.platform,
        timestamp: context.timestamp,
        deviceFingerprint: context.request_metadata.device_fingerprint,
        geolocation: context.request_metadata.geolocation
      };

      const evaluation = await zeroTrustCore.evaluateAccess(ztContext);
      
      // Update monitoring metrics
      securityMonitoring.recordZeroTrustEvaluation(context.platform, evaluation.decision);
      if (evaluation.risk_score > 0.5) {
        securityMonitoring.updateZeroTrustRiskScore(
          context.user_id || 'anonymous',
          context.session_id,
          evaluation.risk_score
        );
      }

      return evaluation;

    } catch (error) {
      this.systemHealth.zero_trust.errors++;
      this.logger.error('Zero Trust evaluation failed', {
        session_id: context.session_id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return { risk_score: 0.5, requires_challenge: false, decision: 'allow' };
    }
  }

  /**
   * Create forensic signature for the request
   */
  private async createForensicSignature(context: SecurityContext): Promise<void> {
    try {
      const metadata = {
        source_platform: context.platform,
        user_id: context.user_id,
        session_id: context.session_id,
        ip_address: context.ip_address,
        user_agent: context.user_agent,
        device_fingerprint: context.request_metadata.device_fingerprint,
        network_analysis: {
          request_headers: context.request_metadata.headers,
          protocol: 'https',
          proxy_indicators: []
        },
        custom_attributes: {
          method: context.request_metadata.method,
          path: context.request_metadata.path,
          timestamp: context.timestamp
        }
      };

      await fanzSignForensicCore.createForensicSignature(
        'request_signature',
        metadata
      );

      // Update monitoring metrics
      securityMonitoring.recordForensicSignature('request_signature', context.platform);

    } catch (error) {
      this.systemHealth.fanzsign.errors++;
      this.logger.error('Forensic signature creation failed', {
        session_id: context.session_id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Update security monitoring metrics
   */
  private updateSecurityMetrics(context: SecurityContext): void {
    try {
      // Record authentication attempt if this is auth-related
      if (context.request_metadata.path.includes('/auth/')) {
        const result = context.security_state.blocked ? 'failure' : 'success';
        securityMonitoring.recordAuthAttempt(context.platform, 'password', result);
      }

      // Record suspicious requests
      if (context.security_state.overall_risk_score > 0.7) {
        securityMonitoring.metrics.suspicious_requests_total.inc({
          platform: context.platform,
          type: 'high_risk',
          action: context.security_state.blocked ? 'blocked' : 'allowed'
        });
      }

      // Update platform metrics
      const responseTime = Date.now() - context.timestamp.getTime();
      securityMonitoring.metrics.platform_response_time.observe(
        { platform: context.platform, endpoint: context.request_metadata.path },
        responseTime / 1000
      );

    } catch (error) {
      this.systemHealth.monitoring.errors++;
      this.logger.error('Metrics update failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Calculate overall risk score from all systems
   */
  private calculateOverallRiskScore(context: SecurityContext): number {
    const weights = {
      zero_trust: 0.4,
      behavioral: 0.2,
      content: 0.2,
      network: 0.2
    };

    const weightedScore = 
      (context.security_state.zero_trust_score * weights.zero_trust) +
      (context.security_state.behavioral_score * weights.behavioral) +
      (context.security_state.content_risk_score * weights.content) +
      (context.security_state.network_risk_score * weights.network);

    return Math.min(1.0, Math.max(0.0, weightedScore));
  }

  /**
   * Determine trust level from risk score
   */
  private determineTrustLevel(riskScore: number): SecurityState['trust_level'] {
    if (riskScore >= 0.9) return 'very_low';
    if (riskScore >= 0.7) return 'low';
    if (riskScore >= 0.4) return 'medium';
    if (riskScore >= 0.2) return 'high';
    return 'very_high';
  }

  /**
   * Make final security decision
   */
  private makeSecurityDecision(context: SecurityContext): SecurityDecision {
    const riskScore = context.security_state.overall_risk_score;
    const actions: SecurityAction[] = [];

    // Critical risk - block immediately
    if (riskScore >= 0.9) {
      context.security_state.blocked = true;
      context.security_state.block_reason = 'Critical security risk detected';
      
      actions.push({
        type: 'create_incident',
        priority: 'critical',
        data: {
          type: 'high_risk_request_blocked',
          risk_score: riskScore,
          platform: context.platform,
          user_id: context.user_id
        }
      });

      return {
        action: 'block',
        reason: 'Critical security risk detected',
        confidence: 0.95,
        metadata: { risk_score: riskScore, blocked_by: 'orchestrator' },
        required_actions: actions
      };
    }

    // High risk - challenge required
    if (riskScore >= 0.7 || context.security_state.requires_challenge) {
      actions.push({
        type: 'update_metrics',
        priority: 'medium',
        data: { metric: 'challenges_issued', platform: context.platform }
      });

      return {
        action: 'challenge',
        reason: context.security_state.requires_challenge ? 
          'Zero trust challenge required' : 'High risk score detected',
        confidence: 0.8,
        metadata: {
          risk_score: riskScore,
          challenge_type: context.security_state.challenge_type || 'mfa'
        },
        required_actions: actions,
        expires_at: new Date(Date.now() + 300000) // 5 minutes
      };
    }

    // Medium risk - allow but monitor
    if (riskScore >= 0.4) {
      actions.push({
        type: 'log_event',
        priority: 'low',
        data: {
          event_type: 'medium_risk_request',
          risk_score: riskScore,
          platform: context.platform
        }
      });

      return {
        action: 'allow',
        reason: 'Medium risk - monitoring enabled',
        confidence: 0.7,
        metadata: { risk_score: riskScore, enhanced_monitoring: true },
        required_actions: actions
      };
    }

    // Low risk - allow normally
    return {
      action: 'allow',
      reason: 'Low security risk',
      confidence: 0.9,
      metadata: { risk_score: riskScore },
      required_actions: []
    };
  }

  /**
   * Execute required security actions
   */
  private async executeSecurityActions(actions: SecurityAction[], context: SecurityContext): Promise<void> {
    for (const action of actions) {
      try {
        switch (action.type) {
          case 'log_event':
            this.logger.info('Security event logged', {
              ...action.data,
              session_id: context.session_id
            });
            break;

          case 'create_incident':
            if (this.config.incident_auto_creation) {
              // This would integrate with FanzDash to create an incident
              await emitSecurityEvent('SECURITY_INCIDENT', action.priority, {
                ...action.data,
                session_id: context.session_id,
                created_by: 'orchestrator'
              });
            }
            break;

          case 'create_signature':
            if (this.config.forensic_signatures_enabled) {
              // Additional forensic signature if needed
            }
            break;

          case 'update_metrics':
            if (this.config.real_time_monitoring) {
              // Update specific metrics
            }
            break;

          case 'send_alert':
            // Send alert through monitoring system
            this.emit('alert_required', {
              ...action.data,
              session_id: context.session_id,
              priority: action.priority
            });
            break;
        }
      } catch (error) {
        this.logger.error('Failed to execute security action', {
          action_type: action.type,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  /**
   * Log comprehensive security event
   */
  private async logSecurityEvent(context: SecurityContext, decision: SecurityDecision): Promise<void> {
    const event: SecurityEvent = {
      id: crypto.randomUUID(),
      type: 'security_request_processed',
      severity: decision.action === 'block' ? 'high' : 
               decision.action === 'challenge' ? 'medium' : 'low',
      timestamp: new Date(),
      platform: context.platform,
      context,
      details: {
        decision,
        risk_scores: {
          zero_trust: context.security_state.zero_trust_score,
          overall: context.security_state.overall_risk_score
        },
        trust_level: context.security_state.trust_level
      },
      processed_by: ['orchestrator'],
      actions_taken: decision.required_actions || []
    };

    // Store in event queue for processing
    this.eventQueue.push(event);

    // Emit for other systems
    this.emit('security_event_processed', event);
  }

  /**
   * Event handlers for system integrations
   */
  private handleZeroTrustEvaluation(data: any): void {
    this.logger.debug('Zero Trust evaluation received', {
      session_id: data.session_id,
      decision: data.decision,
      risk_score: data.risk_score
    });
    
    this.systemHealth.zero_trust.status = 'healthy';
    this.systemHealth.zero_trust.last_check = new Date();
  }

  private handleZeroTrustChallenge(data: any): void {
    this.logger.info('Zero Trust challenge issued', {
      session_id: data.session_id,
      challenge_type: data.challenge_type,
      reason: data.reason
    });

    // Record challenge metrics
    if (this.config.real_time_monitoring) {
      securityMonitoring.recordZeroTrustChallenge(data.challenge_type, data.reason);
    }
  }

  private handleReAuthenticationRequired(data: any): void {
    this.logger.warn('Re-authentication required', {
      session_id: data.session_id,
      user_id: data.user_id,
      risk_score: data.risk_score
    });

    // This event is already handled by FanzDash, so we just log it
  }

  private handleIncidentCreated(incident: any): void {
    this.logger.warn('Security incident created', {
      incident_id: incident.id,
      severity: incident.severity,
      type: incident.type
    });

    this.systemHealth.fanzdash.status = 'healthy';
    this.systemHealth.fanzdash.last_check = new Date();
  }

  private handleAlertTriggered(alert: any): void {
    this.logger.warn('Security alert triggered', {
      alert_id: alert.id,
      severity: alert.severity,
      rule_name: alert.rule_name
    });
  }

  private handleForensicSignatureCreated(signature: any): void {
    this.logger.debug('Forensic signature created', {
      signature_id: signature.id,
      type: signature.signature_type
    });

    this.systemHealth.fanzsign.status = 'healthy';
    this.systemHealth.fanzsign.last_check = new Date();
  }

  private handleBehavioralAnomaly(anomaly: any): void {
    this.logger.info('Behavioral anomaly detected', {
      signature_id: anomaly.signature_id,
      anomaly_score: anomaly.anomaly_score
    });

    // Record in monitoring
    if (this.config.real_time_monitoring) {
      securityMonitoring.recordBehavioralAnomaly('user_behavior', 'medium');
    }
  }

  private handleHighRiskContent(content: any): void {
    this.logger.warn('High risk content detected', {
      signature_id: content.signature_id,
      risk_level: content.risk_level
    });

    // Record content violation
    if (this.config.real_time_monitoring) {
      securityMonitoring.recordContentViolation('unknown', 'high_risk', content.risk_level);
    }
  }

  private handleNetworkAnomaly(anomaly: any): void {
    this.logger.info('Network anomaly detected', {
      signature_id: anomaly.signature_id,
      suspicion_level: anomaly.suspicion_level
    });
  }

  private handleMonitoringAlert(alert: any): void {
    this.logger.warn('Monitoring alert triggered', {
      alert_id: alert.id,
      metric: alert.metric,
      value: alert.value
    });

    this.systemHealth.monitoring.status = 'healthy';
    this.systemHealth.monitoring.last_check = new Date();
  }

  private handleMetricThreshold(data: any): void {
    this.logger.info('Metric threshold exceeded', {
      metric: data.metric,
      current_value: data.current_value,
      threshold: data.threshold
    });
  }

  /**
   * Start health monitoring of all systems
   */
  private startHealthMonitoring(): void {
    setInterval(async () => {
      await this.performHealthCheck();
    }, 60000); // Every minute

    this.logger.info('🏥 System health monitoring started');
  }

  /**
   * Perform health check on all systems
   */
  private async performHealthCheck(): Promise<void> {
    try {
      const now = new Date();
      let healthyCount = 0;
      let totalSystems = 4;

      // Check each system's health
      const systems = ['zero_trust', 'fanzdash', 'fanzsign', 'monitoring'] as const;
      
      for (const system of systems) {
        const timeSinceLastCheck = now.getTime() - this.systemHealth[system].last_check.getTime();
        
        if (timeSinceLastCheck < 120000 && this.systemHealth[system].errors < 5) { // 2 minutes
          this.systemHealth[system].status = 'healthy';
          healthyCount++;
        } else if (timeSinceLastCheck < 300000) { // 5 minutes
          this.systemHealth[system].status = 'degraded';
        } else {
          this.systemHealth[system].status = 'critical';
        }
      }

      // Determine overall status
      if (healthyCount === totalSystems) {
        this.systemHealth.overall_status = 'healthy';
      } else if (healthyCount >= totalSystems * 0.75) {
        this.systemHealth.overall_status = 'degraded';
      } else if (healthyCount > 0) {
        this.systemHealth.overall_status = 'critical';
      } else {
        this.systemHealth.overall_status = 'offline';
      }

      this.lastHealthCheck = now;

      // Log health status if not healthy
      if (this.systemHealth.overall_status !== 'healthy') {
        this.logger.warn('System health degraded', {
          overall_status: this.systemHealth.overall_status,
          healthy_systems: healthyCount,
          total_systems: totalSystems,
          integration_errors: this.systemHealth.integration_errors
        });
      }

    } catch (error) {
      this.logger.error('Health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Start event processing queue
   */
  private startEventProcessing(): void {
    setInterval(() => {
      if (!this.processingEvents && this.eventQueue.length > 0) {
        this.processEventQueue();
      }
    }, 5000); // Every 5 seconds

    this.logger.info('📋 Event processing queue started');
  }

  /**
   * Process queued security events
   */
  private async processEventQueue(): Promise<void> {
    if (this.processingEvents || this.eventQueue.length === 0) return;

    this.processingEvents = true;
    
    try {
      const batchSize = 10;
      const batch = this.eventQueue.splice(0, batchSize);

      for (const event of batch) {
        // Store events in Redis for historical analysis
        await this.redisClient.setEx(
          `security:event:${event.id}`,
          86400, // 24 hours
          JSON.stringify(event)
        );

        // Emit for other systems to consume
        await emitSecurityEvent(event.type, event.severity, event.details);
      }

      this.logger.debug('Processed event batch', {
        batch_size: batch.length,
        remaining_queue: this.eventQueue.length
      });

    } catch (error) {
      this.logger.error('Event processing failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      this.processingEvents = false;
    }
  }

  /**
   * Get orchestrator status and metrics
   */
  public getStatus(): any {
    return {
      system_health: this.systemHealth,
      integration_config: this.config,
      processed_events: this.processedEvents,
      error_count: this.errorCount,
      event_queue_length: this.eventQueue.length,
      last_health_check: this.lastHealthCheck,
      uptime: process.uptime()
    };
  }

  /**
   * Update integration configuration
   */
  public updateConfig(newConfig: Partial<IntegrationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logger.info('Integration configuration updated', { config: this.config });
  }

  /**
   * Shutdown the orchestrator
   */
  public async shutdown(): Promise<void> {
    this.logger.info('Shutting down Security System Orchestrator');

    // Process remaining events
    if (this.eventQueue.length > 0) {
      await this.processEventQueue();
    }

    if (this.redisClient) {
      await this.redisClient.quit();
    }

    this.removeAllListeners();
  }
}

// ===============================
// SINGLETON EXPORT
// ===============================

export const securityOrchestrator = new SecurityOrchestrator();
export default securityOrchestrator;