/**
 * @fanz/security - Zero-Trust Security Architecture
 * Comprehensive zero-trust implementation with FanzDash integration
 * Never trust, always verify - continuous security validation
 */

import { EventEmitter } from 'events';
import { createSecurityLogger } from '../fanz-secure/src/utils/logger.js';
import { emitSecurityEvent, createSecurityEvent } from '../fanz-secure/src/utils/securityEvents.js';
import { config } from '../fanz-secure/src/config.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import * as redis from 'redis';

// ===============================
// TYPES & INTERFACES
// ===============================

export interface ZeroTrustPolicy {
  id: string;
  name: string;
  description: string;
  priority: number;
  conditions: ZeroTrustCondition[];
  actions: ZeroTrustAction[];
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ZeroTrustCondition {
  type: 'user_identity' | 'device_trust' | 'location' | 'network' | 'time' | 'risk_score' | 'behavior';
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in_range';
  value: any;
  weight: number;
}

export interface ZeroTrustAction {
  type: 'allow' | 'deny' | 'challenge' | 'monitor' | 'escalate' | 'quarantine';
  parameters?: Record<string, any>;
}

export interface DeviceTrust {
  device_id: string;
  user_id: string;
  device_fingerprint: string;
  trust_level: 'untrusted' | 'low' | 'medium' | 'high' | 'verified';
  last_verification: Date;
  risk_indicators: string[];
  certificates: DeviceCertificate[];
}

export interface DeviceCertificate {
  id: string;
  type: 'device_attestation' | 'tpm' | 'secure_element' | 'biometric';
  issuer: string;
  fingerprint: string;
  expires_at: Date;
  revoked: boolean;
}

export interface SecurityContext {
  user_id: string;
  session_id: string;
  device_trust: DeviceTrust;
  network_context: NetworkContext;
  risk_score: number;
  access_level: 'public' | 'authenticated' | 'privileged' | 'admin';
  permissions: string[];
  restrictions: string[];
  continuous_verification: boolean;
}

export interface NetworkContext {
  ip_address: string;
  country: string;
  asn: number;
  threat_intelligence: ThreatIntel[];
  network_trust: 'untrusted' | 'residential' | 'corporate' | 'vpn' | 'tor';
  proxy_detected: boolean;
}

export interface ThreatIntel {
  source: string;
  indicator_type: 'ip' | 'domain' | 'hash' | 'email';
  threat_type: 'malware' | 'phishing' | 'botnet' | 'scanning' | 'abuse';
  confidence: number;
  first_seen: Date;
  last_seen: Date;
}

export interface AccessRequest {
  request_id: string;
  user_id: string;
  resource: string;
  action: string;
  context: SecurityContext;
  timestamp: Date;
  decision?: AccessDecision;
}

export interface AccessDecision {
  decision: 'allow' | 'deny' | 'challenge';
  confidence: number;
  reason: string;
  conditions: string[];
  valid_until: Date;
  challenge_required?: ChallengeRequirement;
}

export interface ChallengeRequirement {
  challenge_type: 'mfa' | 'captcha' | 'biometric' | 'device_attestation' | 'manual_review';
  parameters: Record<string, any>;
  timeout: number;
}

export interface FanzDashIntegration {
  api_url: string;
  secret_token: string;
  sync_interval: number;
  real_time_alerts: boolean;
  policy_sync: boolean;
  incident_reporting: boolean;
}

// ===============================
// ZERO-TRUST SECURITY CORE
// ===============================

export class ZeroTrustSecurityCore extends EventEmitter {
  private logger = createSecurityLogger('zero-trust');
  private redisClient: redis.RedisClientType;
  private policies: Map<string, ZeroTrustPolicy> = new Map();
  private deviceTrustStore: Map<string, DeviceTrust> = new Map();
  private activeContexts: Map<string, SecurityContext> = new Map();
  private threatIntelCache: Map<string, ThreatIntel[]> = new Map();
  private fanzDashConfig: FanzDashIntegration;
  
  // Risk scoring weights
  private readonly riskWeights = {
    device_trust: 0.3,
    location_anomaly: 0.25,
    behavioral_anomaly: 0.2,
    threat_intel: 0.15,
    time_based: 0.1
  };

  constructor() {
    super();
    
    this.fanzDashConfig = {
      api_url: config.fanzDashApiUrl || 'https://dash.fanz.ai',
      secret_token: config.fanzDashSecretToken || '',
      sync_interval: 30000, // 30 seconds
      real_time_alerts: true,
      policy_sync: true,
      incident_reporting: true
    };

    this.initializeRedisConnection();
    this.loadDefaultPolicies();
    this.startContinuousMonitoring();
    this.setupFanzDashIntegration();
  }

  /**
   * Initialize Redis connection for distributed state management
   */
  private async initializeRedisConnection(): Promise<void> {
    try {
      this.redisClient = redis.createClient({
        url: config.redisUrl,
        socket: { 
          reconnectStrategy: (retries) => Math.min(retries * 50, 500)
        }
      });

      this.redisClient.on('error', (error) => {
        this.logger.error('Redis connection error', { error: error.message });
      });

      await this.redisClient.connect();
      this.logger.info('🔗 Zero-Trust Redis connection established');
    } catch (error) {
      this.logger.error('Failed to initialize Redis connection', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  /**
   * Load default zero-trust policies
   */
  private loadDefaultPolicies(): void {
    const defaultPolicies: ZeroTrustPolicy[] = [
      {
        id: 'admin-access-strict',
        name: 'Admin Access - Strict Verification',
        description: 'Requires highest security for admin access',
        priority: 1,
        conditions: [
          { type: 'user_identity', operator: 'equals', value: 'admin', weight: 1.0 },
          { type: 'device_trust', operator: 'greater_than', value: 'high', weight: 0.9 },
          { type: 'risk_score', operator: 'less_than', value: 0.2, weight: 0.8 }
        ],
        actions: [
          { type: 'challenge', parameters: { challenge_type: 'mfa', required: true } },
          { type: 'monitor', parameters: { high_priority: true } }
        ],
        enabled: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'content-upload-verification',
        name: 'Content Upload Verification',
        description: 'Enhanced verification for content uploads',
        priority: 2,
        conditions: [
          { type: 'behavior', operator: 'equals', value: 'content_upload', weight: 1.0 },
          { type: 'device_trust', operator: 'greater_than', value: 'medium', weight: 0.7 }
        ],
        actions: [
          { type: 'allow', parameters: { with_monitoring: true } },
          { type: 'monitor', parameters: { content_scan: true } }
        ],
        enabled: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'suspicious-location-challenge',
        name: 'Suspicious Location Challenge',
        description: 'Challenge access from unusual locations',
        priority: 3,
        conditions: [
          { type: 'location', operator: 'not_equals', value: 'trusted_country', weight: 0.8 },
          { type: 'network', operator: 'equals', value: 'tor', weight: 0.9 }
        ],
        actions: [
          { type: 'challenge', parameters: { challenge_type: 'captcha' } },
          { type: 'escalate', parameters: { notify_security: true } }
        ],
        enabled: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    defaultPolicies.forEach(policy => {
      this.policies.set(policy.id, policy);
    });

    this.logger.info('✅ Loaded default zero-trust policies', { 
      count: defaultPolicies.length 
    });
  }

  /**
   * Evaluate access request against zero-trust policies
   */
  public async evaluateAccess(request: AccessRequest): Promise<AccessDecision> {
    const startTime = Date.now();

    try {
      // Calculate comprehensive risk score
      const riskScore = await this.calculateRiskScore(request.context);
      
      // Get applicable policies
      const applicablePolicies = this.getApplicablePolicies(request);
      
      // Evaluate each policy
      let finalDecision: AccessDecision = {
        decision: 'deny',
        confidence: 1.0,
        reason: 'No matching policy found',
        conditions: [],
        valid_until: new Date(Date.now() + 300000) // 5 minutes
      };

      for (const policy of applicablePolicies) {
        const policyResult = await this.evaluatePolicy(policy, request, riskScore);
        
        if (policyResult.decision === 'allow') {
          finalDecision = policyResult;
          break;
        } else if (policyResult.decision === 'challenge') {
          finalDecision = policyResult;
          // Don't break - continue to see if we get an explicit allow
        }
      }

      // Log the decision
      this.logger.info('Access decision made', {
        request_id: request.request_id,
        user_id: request.user_id,
        resource: request.resource,
        decision: finalDecision.decision,
        risk_score: riskScore,
        duration_ms: Date.now() - startTime
      });

      // Emit security event
      await emitSecurityEvent(createSecurityEvent(
        'AUTH_ATTEMPT',
        finalDecision.decision === 'deny' ? 'high' : 'low',
        {
          requestId: request.request_id,
          userId: request.user_id,
          ipAddress: request.context.network_context.ip_address,
          userAgent: 'Zero-Trust-Engine',
          path: request.resource,
          method: request.action
        },
        {
          decision: finalDecision.decision,
          risk_score: riskScore,
          policies_evaluated: applicablePolicies.length
        }
      ));

      // Report to FanzDash
      await this.reportToFanzDash('access_decision', {
        request,
        decision: finalDecision,
        risk_score: riskScore
      });

      return finalDecision;

    } catch (error) {
      this.logger.error('Error evaluating access request', {
        request_id: request.request_id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        decision: 'deny',
        confidence: 1.0,
        reason: 'System error during evaluation',
        conditions: ['system_error'],
        valid_until: new Date(Date.now() + 60000) // 1 minute
      };
    }
  }

  /**
   * Calculate comprehensive risk score for security context
   */
  private async calculateRiskScore(context: SecurityContext): Promise<number> {
    let riskScore = 0;

    // Device trust factor
    const deviceRisk = this.calculateDeviceRisk(context.device_trust);
    riskScore += deviceRisk * this.riskWeights.device_trust;

    // Location anomaly factor
    const locationRisk = await this.calculateLocationRisk(context.network_context);
    riskScore += locationRisk * this.riskWeights.location_anomaly;

    // Threat intelligence factor
    const threatRisk = this.calculateThreatIntelRisk(context.network_context.threat_intelligence);
    riskScore += threatRisk * this.riskWeights.threat_intel;

    // Behavioral anomaly (simplified for now)
    const behaviorRisk = 0.1; // Placeholder
    riskScore += behaviorRisk * this.riskWeights.behavioral_anomaly;

    // Time-based risk (off-hours access)
    const timeRisk = this.calculateTimeBasedRisk();
    riskScore += timeRisk * this.riskWeights.time_based;

    return Math.min(Math.max(riskScore, 0), 1); // Clamp between 0 and 1
  }

  /**
   * Calculate device-based risk
   */
  private calculateDeviceRisk(deviceTrust: DeviceTrust): number {
    const trustLevelRisk = {
      'untrusted': 1.0,
      'low': 0.8,
      'medium': 0.5,
      'high': 0.2,
      'verified': 0.0
    };

    let baseRisk = trustLevelRisk[deviceTrust.trust_level] || 1.0;

    // Increase risk based on indicators
    const indicatorRisk = deviceTrust.risk_indicators.length * 0.1;
    baseRisk += indicatorRisk;

    // Decrease risk for valid certificates
    const certBonus = deviceTrust.certificates.filter(cert => 
      !cert.revoked && cert.expires_at > new Date()
    ).length * 0.05;
    baseRisk -= certBonus;

    return Math.min(Math.max(baseRisk, 0), 1);
  }

  /**
   * Calculate location-based risk
   */
  private async calculateLocationRisk(networkContext: NetworkContext): Promise<number> {
    let risk = 0;

    // Base risk by network type
    const networkRisk = {
      'untrusted': 0.9,
      'residential': 0.3,
      'corporate': 0.1,
      'vpn': 0.6,
      'tor': 1.0
    };

    risk += networkRisk[networkContext.network_trust] || 0.5;

    // Proxy/anonymization risk
    if (networkContext.proxy_detected) {
      risk += 0.3;
    }

    // Geographic risk (simplified)
    const highRiskCountries = ['CN', 'RU', 'KP', 'IR'];
    if (highRiskCountries.includes(networkContext.country)) {
      risk += 0.4;
    }

    return Math.min(risk, 1);
  }

  /**
   * Calculate threat intelligence risk
   */
  private calculateThreatIntelRisk(threatIntel: ThreatIntel[]): number {
    if (threatIntel.length === 0) return 0;

    let maxRisk = 0;
    for (const intel of threatIntel) {
      const typeRisk = {
        'malware': 1.0,
        'phishing': 0.9,
        'botnet': 0.8,
        'scanning': 0.4,
        'abuse': 0.6
      };

      const risk = (typeRisk[intel.threat_type] || 0.5) * intel.confidence;
      maxRisk = Math.max(maxRisk, risk);
    }

    return maxRisk;
  }

  /**
   * Calculate time-based risk
   */
  private calculateTimeBasedRisk(): number {
    const hour = new Date().getHours();
    
    // Higher risk during off-hours (22:00 - 06:00)
    if (hour >= 22 || hour <= 6) {
      return 0.3;
    }
    
    return 0.1;
  }

  /**
   * Get policies applicable to the request
   */
  private getApplicablePolicies(request: AccessRequest): ZeroTrustPolicy[] {
    const applicable = Array.from(this.policies.values())
      .filter(policy => policy.enabled)
      .sort((a, b) => a.priority - b.priority); // Lower number = higher priority

    return applicable;
  }

  /**
   * Evaluate a single policy against the request
   */
  private async evaluatePolicy(
    policy: ZeroTrustPolicy, 
    request: AccessRequest, 
    riskScore: number
  ): Promise<AccessDecision> {
    let matchScore = 0;
    let totalWeight = 0;
    const matchedConditions: string[] = [];

    // Evaluate each condition
    for (const condition of policy.conditions) {
      const conditionResult = this.evaluateCondition(condition, request, riskScore);
      
      if (conditionResult.matches) {
        matchScore += condition.weight;
        matchedConditions.push(conditionResult.description);
      }
      
      totalWeight += condition.weight;
    }

    const confidence = totalWeight > 0 ? matchScore / totalWeight : 0;
    
    // Determine action based on confidence threshold
    if (confidence >= 0.8) {
      // High confidence - execute primary action
      const primaryAction = policy.actions[0];
      
      return {
        decision: primaryAction.type as any,
        confidence,
        reason: `Policy '${policy.name}' matched with ${confidence.toFixed(2)} confidence`,
        conditions: matchedConditions,
        valid_until: new Date(Date.now() + 300000),
        challenge_required: primaryAction.type === 'challenge' ? 
          primaryAction.parameters as ChallengeRequirement : undefined
      };
    } else if (confidence >= 0.5) {
      // Medium confidence - challenge
      return {
        decision: 'challenge',
        confidence,
        reason: `Policy '${policy.name}' requires additional verification`,
        conditions: matchedConditions,
        valid_until: new Date(Date.now() + 300000),
        challenge_required: {
          challenge_type: 'captcha',
          parameters: {},
          timeout: 300
        }
      };
    } else {
      // Low confidence - deny
      return {
        decision: 'deny',
        confidence: 1 - confidence,
        reason: `Policy '${policy.name}' conditions not met`,
        conditions: matchedConditions,
        valid_until: new Date(Date.now() + 60000)
      };
    }
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(
    condition: ZeroTrustCondition, 
    request: AccessRequest, 
    riskScore: number
  ): { matches: boolean; description: string } {
    const context = request.context;
    
    switch (condition.type) {
      case 'risk_score':
        const matches = this.compareValues(riskScore, condition.operator, condition.value);
        return {
          matches,
          description: `Risk score ${riskScore.toFixed(2)} ${condition.operator} ${condition.value}`
        };
        
      case 'device_trust':
        const trustLevels = ['untrusted', 'low', 'medium', 'high', 'verified'];
        const currentLevel = trustLevels.indexOf(context.device_trust.trust_level);
        const requiredLevel = trustLevels.indexOf(condition.value);
        const trustMatches = this.compareValues(currentLevel, condition.operator, requiredLevel);
        return {
          matches: trustMatches,
          description: `Device trust ${context.device_trust.trust_level} ${condition.operator} ${condition.value}`
        };
        
      case 'location':
        const locationMatches = condition.value === 'trusted_country' ? 
          !['CN', 'RU', 'KP', 'IR'].includes(context.network_context.country) :
          this.compareValues(context.network_context.country, condition.operator, condition.value);
        return {
          matches: locationMatches,
          description: `Location ${context.network_context.country} ${condition.operator} ${condition.value}`
        };
        
      case 'network':
        const networkMatches = this.compareValues(
          context.network_context.network_trust, 
          condition.operator, 
          condition.value
        );
        return {
          matches: networkMatches,
          description: `Network type ${context.network_context.network_trust} ${condition.operator} ${condition.value}`
        };
        
      default:
        return { matches: false, description: `Unknown condition type: ${condition.type}` };
    }
  }

  /**
   * Compare values based on operator
   */
  private compareValues(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case 'equals': return actual === expected;
      case 'not_equals': return actual !== expected;
      case 'greater_than': return actual > expected;
      case 'less_than': return actual < expected;
      case 'contains': return actual.toString().includes(expected.toString());
      case 'in_range': return actual >= expected.min && actual <= expected.max;
      default: return false;
    }
  }

  /**
   * Start continuous monitoring and verification
   */
  private startContinuousMonitoring(): void {
    // Continuous context verification
    setInterval(() => {
      this.performContinuousVerification();
    }, 30000); // Every 30 seconds

    // Policy updates from FanzDash
    setInterval(() => {
      this.syncPoliciesFromFanzDash();
    }, this.fanzDashConfig.sync_interval);

    // Threat intelligence updates
    setInterval(() => {
      this.updateThreatIntelligence();
    }, 300000); // Every 5 minutes

    this.logger.info('🔄 Started continuous zero-trust monitoring');
  }

  /**
   * Perform continuous verification of active contexts
   */
  private async performContinuousVerification(): Promise<void> {
    const activeContexts = Array.from(this.activeContexts.entries());
    
    for (const [sessionId, context] of activeContexts) {
      if (!context.continuous_verification) continue;

      try {
        const currentRiskScore = await this.calculateRiskScore(context);
        
        // If risk score has increased significantly, trigger re-authentication
        if (currentRiskScore > context.risk_score + 0.3) {
          await this.triggerReAuthentication(sessionId, context, currentRiskScore);
        }

        // Update risk score
        context.risk_score = currentRiskScore;
        this.activeContexts.set(sessionId, context);

      } catch (error) {
        this.logger.error('Error during continuous verification', {
          session_id: sessionId,
          user_id: context.user_id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  /**
   * Trigger re-authentication for elevated risk
   */
  private async triggerReAuthentication(
    sessionId: string, 
    context: SecurityContext, 
    newRiskScore: number
  ): Promise<void> {
    this.logger.warn('Risk elevation detected - triggering re-authentication', {
      session_id: sessionId,
      user_id: context.user_id,
      old_risk: context.risk_score,
      new_risk: newRiskScore
    });

    // Emit security event
    await emitSecurityEvent(createSecurityEvent(
      'SUSPICIOUS_ACTIVITY',
      'high',
      {
        requestId: sessionId,
        userId: context.user_id,
        ipAddress: context.network_context.ip_address,
        userAgent: 'Zero-Trust-Monitor',
        path: '/continuous-verification',
        method: 'MONITOR'
      },
      {
        old_risk_score: context.risk_score,
        new_risk_score: newRiskScore,
        trigger: 'continuous_verification'
      }
    ));

    // Notify FanzDash
    await this.reportToFanzDash('risk_elevation', {
      session_id: sessionId,
      context,
      old_risk: context.risk_score,
      new_risk: newRiskScore
    });

    // Emit event for application to handle
    this.emit('re-authentication-required', {
      session_id: sessionId,
      user_id: context.user_id,
      risk_score: newRiskScore,
      challenge_type: newRiskScore > 0.8 ? 'mfa' : 'captcha'
    });
  }

  /**
   * Setup FanzDash integration for centralized security control
   */
  private setupFanzDashIntegration(): void {
    if (!this.fanzDashConfig.api_url || !this.fanzDashConfig.secret_token) {
      this.logger.warn('FanzDash integration not configured - running in standalone mode');
      return;
    }

    this.logger.info('🎛️ FanzDash security control center integration active', {
      api_url: this.fanzDashConfig.api_url,
      features: {
        real_time_alerts: this.fanzDashConfig.real_time_alerts,
        policy_sync: this.fanzDashConfig.policy_sync,
        incident_reporting: this.fanzDashConfig.incident_reporting
      }
    });
  }

  /**
   * Report events to FanzDash security control center
   */
  private async reportToFanzDash(eventType: string, data: any): Promise<void> {
    if (!this.fanzDashConfig.real_time_alerts) return;

    try {
      const payload = {
        source: 'zero-trust-engine',
        event_type: eventType,
        timestamp: new Date().toISOString(),
        data,
        security_level: 'high'
      };

      // In production, this would make an actual HTTP call to FanzDash
      this.logger.debug('Reporting to FanzDash', {
        event_type: eventType,
        payload_size: JSON.stringify(payload).length
      });

    } catch (error) {
      this.logger.error('Failed to report to FanzDash', {
        event_type: eventType,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Sync policies from FanzDash
   */
  private async syncPoliciesFromFanzDash(): Promise<void> {
    if (!this.fanzDashConfig.policy_sync) return;

    try {
      // In production, this would fetch policies from FanzDash API
      this.logger.debug('Syncing policies from FanzDash');
      
    } catch (error) {
      this.logger.error('Failed to sync policies from FanzDash', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Update threat intelligence feeds
   */
  private async updateThreatIntelligence(): Promise<void> {
    try {
      // In production, this would fetch from threat intelligence sources
      this.logger.debug('Updating threat intelligence feeds');
      
    } catch (error) {
      this.logger.error('Failed to update threat intelligence', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Register a new device for zero-trust evaluation
   */
  public async registerDevice(
    userId: string, 
    deviceFingerprint: string, 
    certificates: DeviceCertificate[] = []
  ): Promise<DeviceTrust> {
    const deviceId = crypto.createHash('sha256')
      .update(`${userId}:${deviceFingerprint}`)
      .digest('hex');

    const deviceTrust: DeviceTrust = {
      device_id: deviceId,
      user_id: userId,
      device_fingerprint: deviceFingerprint,
      trust_level: certificates.length > 0 ? 'medium' : 'low',
      last_verification: new Date(),
      risk_indicators: [],
      certificates
    };

    this.deviceTrustStore.set(deviceId, deviceTrust);

    this.logger.info('Device registered for zero-trust evaluation', {
      device_id: deviceId,
      user_id: userId,
      trust_level: deviceTrust.trust_level
    });

    return deviceTrust;
  }

  /**
   * Create security context for zero-trust evaluation
   */
  public async createSecurityContext(
    userId: string,
    sessionId: string,
    deviceFingerprint: string,
    ipAddress: string,
    userAgent?: string
  ): Promise<SecurityContext> {
    // Get or create device trust
    const deviceId = crypto.createHash('sha256')
      .update(`${userId}:${deviceFingerprint}`)
      .digest('hex');
    
    let deviceTrust = this.deviceTrustStore.get(deviceId);
    if (!deviceTrust) {
      deviceTrust = await this.registerDevice(userId, deviceFingerprint);
    }

    // Build network context (simplified for demo)
    const networkContext: NetworkContext = {
      ip_address: ipAddress,
      country: 'US', // Would be resolved via GeoIP
      asn: 7922, // Would be resolved via IP lookup
      threat_intelligence: [],
      network_trust: 'residential',
      proxy_detected: false
    };

    const context: SecurityContext = {
      user_id: userId,
      session_id: sessionId,
      device_trust: deviceTrust,
      network_context: networkContext,
      risk_score: await this.calculateRiskScore({} as SecurityContext), // Will be calculated properly
      access_level: 'authenticated',
      permissions: [],
      restrictions: [],
      continuous_verification: true
    };

    // Calculate proper risk score now that we have full context
    context.risk_score = await this.calculateRiskScore(context);

    // Store active context
    this.activeContexts.set(sessionId, context);

    return context;
  }

  /**
   * Get current security metrics for monitoring
   */
  public getSecurityMetrics(): Record<string, any> {
    return {
      active_contexts: this.activeContexts.size,
      registered_devices: this.deviceTrustStore.size,
      active_policies: this.policies.size,
      threat_intel_indicators: Array.from(this.threatIntelCache.values()).flat().length,
      fanzdash_integration: {
        configured: !!(this.fanzDashConfig.api_url && this.fanzDashConfig.secret_token),
        real_time_alerts: this.fanzDashConfig.real_time_alerts,
        policy_sync: this.fanzDashConfig.policy_sync
      },
      uptime: process.uptime()
    };
  }

  /**
   * Shutdown zero-trust security core
   */
  public async shutdown(): Promise<void> {
    this.logger.info('Shutting down Zero-Trust Security Core');
    
    if (this.redisClient) {
      await this.redisClient.quit();
    }
    
    this.removeAllListeners();
  }
}

// ===============================
// SINGLETON EXPORT
// ===============================

export const zeroTrustCore = new ZeroTrustSecurityCore();
export default zeroTrustCore;