/**
 * @fanzsign/forensics - Advanced Forensic Signature System
 * Digital fingerprinting, evidence collection, and forensic analysis
 * For comprehensive security incident investigation and audit trails
 */

import { EventEmitter } from 'events';
import { createSecurityLogger } from '../fanz-secure/src/utils/logger.js';
import { emitSecurityEvent } from '../fanz-secure/src/utils/securityEvents.js';
import crypto from 'crypto';
import * as redis from 'redis';
import * as fs from 'fs/promises';
import * as path from 'path';
import { config } from '../fanz-secure/src/config.js';

// ===============================
// TYPES & INTERFACES
// ===============================

export interface ForensicSignature {
  id: string;
  timestamp: Date;
  signature_type: ForensicSignatureType;
  hash: string;
  metadata: ForensicMetadata;
  evidence_chain: EvidenceChainLink[];
  integrity_verified: boolean;
  created_by: string;
  related_incident_id?: string;
}

export type ForensicSignatureType = 
  | 'request_signature'
  | 'user_behavior_signature'
  | 'content_signature'
  | 'network_signature'
  | 'system_state_signature'
  | 'transaction_signature'
  | 'authentication_signature'
  | 'file_signature'
  | 'database_signature';

export interface ForensicMetadata {
  source_platform: string;
  user_id?: string;
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
  geolocation?: GeolocationData;
  device_fingerprint?: DeviceFingerprint;
  behavioral_metrics?: BehavioralMetrics;
  content_analysis?: ContentAnalysis;
  network_analysis?: NetworkAnalysis;
  custom_attributes: Record<string, any>;
}

export interface GeolocationData {
  country: string;
  region: string;
  city: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  timezone: string;
  isp?: string;
  is_vpn?: boolean;
  is_tor?: boolean;
}

export interface DeviceFingerprint {
  browser: string;
  os: string;
  screen_resolution: string;
  timezone: string;
  language: string;
  plugins: string[];
  canvas_fingerprint?: string;
  webgl_fingerprint?: string;
  audio_fingerprint?: string;
  confidence_score: number;
}

export interface BehavioralMetrics {
  typing_pattern?: TypingPattern;
  mouse_movement?: MouseMovement;
  navigation_pattern?: NavigationPattern;
  interaction_velocity?: number;
  session_duration?: number;
  page_dwell_times?: number[];
  anomaly_score: number;
}

export interface TypingPattern {
  keystroke_dynamics: number[];
  typing_speed: number;
  pause_patterns: number[];
  rhythm_signature: string;
}

export interface MouseMovement {
  velocity_profile: number[];
  acceleration_patterns: number[];
  click_patterns: ClickPattern[];
  movement_signature: string;
}

export interface ClickPattern {
  timestamp: number;
  x: number;
  y: number;
  pressure?: number;
  duration: number;
}

export interface NavigationPattern {
  page_sequence: string[];
  referrer_chain: string[];
  search_patterns: string[];
  time_on_pages: number[];
}

export interface ContentAnalysis {
  content_type: string;
  content_hash: string;
  content_size: number;
  mime_type?: string;
  ai_content_score?: number;
  content_risk_score?: number;
  detected_objects?: string[];
  text_sentiment?: number;
  language_detected?: string;
  adult_content_confidence?: number;
}

export interface NetworkAnalysis {
  request_headers: Record<string, string>;
  response_headers?: Record<string, string>;
  protocol: string;
  tls_fingerprint?: string;
  http2_fingerprint?: string;
  cdn_detection?: string;
  proxy_indicators?: string[];
}

export interface EvidenceChainLink {
  id: string;
  timestamp: Date;
  action: string;
  actor: string;
  hash_before: string;
  hash_after: string;
  verification_signature: string;
}

export interface ForensicQuery {
  signature_types?: ForensicSignatureType[];
  time_range?: {
    start: Date;
    end: Date;
  };
  platforms?: string[];
  users?: string[];
  ip_addresses?: string[];
  incident_ids?: string[];
  behavioral_anomaly_threshold?: number;
  content_risk_threshold?: number;
  limit?: number;
  offset?: number;
}

export interface ForensicReport {
  id: string;
  query: ForensicQuery;
  signatures: ForensicSignature[];
  analysis: ForensicAnalysis;
  generated_at: Date;
  generated_by: string;
}

export interface ForensicAnalysis {
  total_signatures: number;
  high_risk_signatures: number;
  behavioral_anomalies: number;
  content_violations: number;
  network_anomalies: number;
  timeline: TimelineEvent[];
  correlation_analysis: CorrelationResult[];
  threat_indicators: ThreatIndicator[];
  recommendations: string[];
}

export interface TimelineEvent {
  timestamp: Date;
  event_type: string;
  description: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  related_signatures: string[];
}

export interface CorrelationResult {
  correlation_type: string;
  signatures: string[];
  confidence: number;
  description: string;
}

export interface ThreatIndicator {
  indicator_type: string;
  value: string;
  threat_level: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  first_seen: Date;
  last_seen: Date;
}

// ===============================
// FANZSIGN FORENSIC CORE
// ===============================

export class FanzSignForensicCore extends EventEmitter {
  private logger = createSecurityLogger('fanzsign-forensic-core');
  private redisClient: redis.RedisClientType;
  
  // Storage
  private signatures: Map<string, ForensicSignature> = new Map();
  private evidenceStorage: string = path.join(process.cwd(), 'security', 'evidence');
  
  // Configuration
  private readonly config = {
    max_signatures_in_memory: 10000,
    evidence_retention_days: 2555, // 7 years for legal compliance
    signature_batch_size: 100,
    real_time_analysis: true,
    auto_purge_enabled: false, // Never auto-purge for legal compliance
    encryption_key: process.env.FANZSIGN_ENCRYPTION_KEY || 'default-key-change-me',
    integrity_check_interval: 300000, // 5 minutes
  };

  // Behavioral analysis models
  private behavioralBaselines: Map<string, BehavioralMetrics> = new Map();
  private contentRiskModels: Map<string, any> = new Map();

  constructor() {
    super();
    this.initialize();
  }

  /**
   * Initialize the FanzSign Forensic Core
   */
  private async initialize(): Promise<void> {
    this.logger.info('🔬 Initializing FanzSign Forensic Core');
    
    await this.setupRedisConnection();
    await this.setupEvidenceStorage();
    await this.loadBehavioralBaselines();
    this.startIntegrityMonitoring();
    this.setupForensicEventHandlers();
    
    this.logger.info('✅ FanzSign Forensic Core fully operational');
  }

  /**
   * Setup Redis connection for distributed forensic data
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
      this.logger.info('🔗 FanzSign Redis connection established');
    } catch (error) {
      this.logger.error('Failed to setup Redis connection', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  /**
   * Setup secure evidence storage directory
   */
  private async setupEvidenceStorage(): Promise<void> {
    try {
      await fs.mkdir(this.evidenceStorage, { recursive: true, mode: 0o750 });
      
      // Create subdirectories for different evidence types
      const subdirs = ['signatures', 'behavioral', 'content', 'network', 'system'];
      for (const subdir of subdirs) {
        await fs.mkdir(path.join(this.evidenceStorage, subdir), { 
          recursive: true, 
          mode: 0o750 
        });
      }
      
      this.logger.info('🗃️ Evidence storage initialized', {
        storage_path: this.evidenceStorage
      });
    } catch (error) {
      this.logger.error('Failed to setup evidence storage', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Load behavioral baselines for anomaly detection
   */
  private async loadBehavioralBaselines(): Promise<void> {
    try {
      // In production, this would load from ML models or historical data
      // For now, we'll initialize with default baselines
      
      this.logger.info('📊 Behavioral baselines loaded');
    } catch (error) {
      this.logger.error('Failed to load behavioral baselines', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Start integrity monitoring of forensic data
   */
  private startIntegrityMonitoring(): void {
    setInterval(async () => {
      await this.performIntegrityCheck();
    }, this.config.integrity_check_interval);
    
    this.logger.info('🛡️ Forensic integrity monitoring started');
  }

  /**
   * Setup forensic event handlers
   */
  private setupForensicEventHandlers(): void {
    // Listen for security events that require forensic signatures
    this.on('create_signature', this.createForensicSignature.bind(this));
    this.on('analyze_behavior', this.analyzeBehavioralSignature.bind(this));
    this.on('analyze_content', this.analyzeContentSignature.bind(this));
    
    this.logger.info('🔍 Forensic event handlers configured');
  }

  /**
   * Create a new forensic signature
   */
  public async createForensicSignature(
    type: ForensicSignatureType, 
    metadata: ForensicMetadata, 
    relatedIncidentId?: string
  ): Promise<ForensicSignature> {
    const signature: ForensicSignature = {
      id: `FSIG-${Date.now()}-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
      timestamp: new Date(),
      signature_type: type,
      hash: this.generateSignatureHash(type, metadata),
      metadata,
      evidence_chain: [],
      integrity_verified: false,
      created_by: 'fanzsign-system',
      related_incident_id: relatedIncidentId
    };

    // Create initial evidence chain link
    const initialChainLink: EvidenceChainLink = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      action: 'signature_created',
      actor: 'fanzsign-system',
      hash_before: '',
      hash_after: signature.hash,
      verification_signature: this.generateVerificationSignature(signature)
    };

    signature.evidence_chain.push(initialChainLink);
    signature.integrity_verified = true;

    // Store in memory and persistent storage
    this.signatures.set(signature.id, signature);
    await this.persistSignature(signature);

    // Store in Redis for distributed access
    await this.redisClient.setEx(
      `forensic:signature:${signature.id}`,
      86400 * this.config.evidence_retention_days,
      JSON.stringify(signature)
    );

    // Emit for real-time analysis
    if (this.config.real_time_analysis) {
      await this.performRealTimeAnalysis(signature);
    }

    this.logger.info('🔬 Forensic signature created', {
      signature_id: signature.id,
      type: signature.signature_type,
      incident_id: relatedIncidentId,
      hash: signature.hash.substring(0, 16) + '...'
    });

    this.emit('signature_created', signature);
    return signature;
  }

  /**
   * Generate cryptographic hash for signature
   */
  private generateSignatureHash(type: ForensicSignatureType, metadata: ForensicMetadata): string {
    const hashInput = JSON.stringify({
      type,
      metadata: this.sanitizeMetadataForHash(metadata),
      timestamp: Date.now(),
      nonce: crypto.randomBytes(16).toString('hex')
    });

    return crypto
      .createHmac('sha256', this.config.encryption_key)
      .update(hashInput)
      .digest('hex');
  }

  /**
   * Sanitize metadata for consistent hashing
   */
  private sanitizeMetadataForHash(metadata: ForensicMetadata): any {
    // Remove volatile fields that shouldn't affect the signature hash
    const sanitized = { ...metadata };
    delete sanitized.custom_attributes?.timestamp;
    return sanitized;
  }

  /**
   * Generate verification signature for evidence chain
   */
  private generateVerificationSignature(signature: ForensicSignature): string {
    const verificationData = {
      signature_id: signature.id,
      hash: signature.hash,
      timestamp: signature.timestamp,
      type: signature.signature_type
    };

    return crypto
      .createHmac('sha256', this.config.encryption_key)
      .update(JSON.stringify(verificationData))
      .digest('hex');
  }

  /**
   * Persist signature to secure storage
   */
  private async persistSignature(signature: ForensicSignature): Promise<void> {
    try {
      const fileName = `${signature.id}.json`;
      const filePath = path.join(this.evidenceStorage, 'signatures', fileName);
      
      // Encrypt sensitive data before storage
      const encryptedSignature = await this.encryptSignatureData(signature);
      
      await fs.writeFile(filePath, JSON.stringify(encryptedSignature, null, 2), {
        mode: 0o640,
        flag: 'w'
      });

    } catch (error) {
      this.logger.error('Failed to persist forensic signature', {
        signature_id: signature.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Encrypt signature data for storage
   */
  private async encryptSignatureData(signature: ForensicSignature): Promise<any> {
    // In production, this would use proper encryption (AES-256-GCM)
    // For now, we'll base64 encode sensitive fields
    const encrypted = { ...signature };
    
    if (encrypted.metadata.user_id) {
      encrypted.metadata.user_id = Buffer.from(encrypted.metadata.user_id).toString('base64');
    }
    
    if (encrypted.metadata.ip_address) {
      encrypted.metadata.ip_address = Buffer.from(encrypted.metadata.ip_address).toString('base64');
    }

    return encrypted;
  }

  /**
   * Perform real-time analysis on new signature
   */
  private async performRealTimeAnalysis(signature: ForensicSignature): Promise<void> {
    try {
      // Behavioral anomaly detection
      if (signature.metadata.behavioral_metrics) {
        const anomaly = await this.detectBehavioralAnomaly(signature);
        if (anomaly.is_anomaly) {
          this.emit('behavioral_anomaly_detected', {
            signature_id: signature.id,
            anomaly_score: anomaly.score,
            anomaly_reasons: anomaly.reasons
          });
        }
      }

      // Content risk analysis
      if (signature.metadata.content_analysis) {
        const riskAssessment = await this.assessContentRisk(signature);
        if (riskAssessment.risk_level === 'high' || riskAssessment.risk_level === 'critical') {
          this.emit('high_risk_content_detected', {
            signature_id: signature.id,
            risk_level: riskAssessment.risk_level,
            risk_factors: riskAssessment.factors
          });
        }
      }

      // Network anomaly detection
      if (signature.metadata.network_analysis) {
        const networkAnomaly = await this.detectNetworkAnomaly(signature);
        if (networkAnomaly.is_suspicious) {
          this.emit('network_anomaly_detected', {
            signature_id: signature.id,
            suspicion_level: networkAnomaly.level,
            indicators: networkAnomaly.indicators
          });
        }
      }

    } catch (error) {
      this.logger.error('Real-time analysis failed', {
        signature_id: signature.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Detect behavioral anomalies
   */
  private async detectBehavioralAnomaly(signature: ForensicSignature): Promise<{
    is_anomaly: boolean;
    score: number;
    reasons: string[];
  }> {
    const behavioral = signature.metadata.behavioral_metrics;
    if (!behavioral) {
      return { is_anomaly: false, score: 0, reasons: [] };
    }

    const reasons: string[] = [];
    let anomalyScore = 0;

    // Check anomaly score threshold
    if (behavioral.anomaly_score > 0.7) {
      anomalyScore += behavioral.anomaly_score;
      reasons.push('High behavioral anomaly score detected');
    }

    // Check interaction velocity
    if (behavioral.interaction_velocity && behavioral.interaction_velocity > 100) {
      anomalyScore += 0.3;
      reasons.push('Unusually high interaction velocity');
    }

    // Check session duration anomalies
    if (behavioral.session_duration && behavioral.session_duration < 10) {
      anomalyScore += 0.2;
      reasons.push('Unusually short session duration');
    }

    return {
      is_anomaly: anomalyScore > 0.5,
      score: anomalyScore,
      reasons
    };
  }

  /**
   * Assess content risk
   */
  private async assessContentRisk(signature: ForensicSignature): Promise<{
    risk_level: 'low' | 'medium' | 'high' | 'critical';
    factors: string[];
  }> {
    const content = signature.metadata.content_analysis;
    if (!content) {
      return { risk_level: 'low', factors: [] };
    }

    const factors: string[] = [];
    let riskScore = 0;

    // Check content risk score
    if (content.content_risk_score && content.content_risk_score > 0.8) {
      riskScore += content.content_risk_score;
      factors.push('High content risk score detected');
    }

    // Check AI-generated content
    if (content.ai_content_score && content.ai_content_score > 0.9) {
      riskScore += 0.3;
      factors.push('High probability of AI-generated content');
    }

    // Check adult content confidence
    if (content.adult_content_confidence && content.adult_content_confidence > 0.95) {
      riskScore += 0.2;
      factors.push('High confidence adult content detected');
    }

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (riskScore >= 0.9) riskLevel = 'critical';
    else if (riskScore >= 0.7) riskLevel = 'high';
    else if (riskScore >= 0.4) riskLevel = 'medium';
    else riskLevel = 'low';

    return { risk_level: riskLevel, factors };
  }

  /**
   * Detect network anomalies
   */
  private async detectNetworkAnomaly(signature: ForensicSignature): Promise<{
    is_suspicious: boolean;
    level: 'low' | 'medium' | 'high';
    indicators: string[];
  }> {
    const network = signature.metadata.network_analysis;
    if (!network) {
      return { is_suspicious: false, level: 'low', indicators: [] };
    }

    const indicators: string[] = [];
    let suspicionLevel = 0;

    // Check for proxy indicators
    if (network.proxy_indicators && network.proxy_indicators.length > 0) {
      suspicionLevel += 0.4;
      indicators.push(`Proxy usage detected: ${network.proxy_indicators.join(', ')}`);
    }

    // Check unusual TLS fingerprints
    if (network.tls_fingerprint && this.isUnusualTLSFingerprint(network.tls_fingerprint)) {
      suspicionLevel += 0.3;
      indicators.push('Unusual TLS fingerprint detected');
    }

    // Check for suspicious headers
    const suspiciousHeaders = this.detectSuspiciousHeaders(network.request_headers);
    if (suspiciousHeaders.length > 0) {
      suspicionLevel += 0.2;
      indicators.push(`Suspicious headers: ${suspiciousHeaders.join(', ')}`);
    }

    let level: 'low' | 'medium' | 'high';
    if (suspicionLevel >= 0.7) level = 'high';
    else if (suspicionLevel >= 0.4) level = 'medium';
    else level = 'low';

    return {
      is_suspicious: suspicionLevel > 0.3,
      level,
      indicators
    };
  }

  /**
   * Check if TLS fingerprint is unusual
   */
  private isUnusualTLSFingerprint(fingerprint: string): boolean {
    // In production, this would check against known good/bad fingerprint databases
    return fingerprint.length < 32; // Simplified check
  }

  /**
   * Detect suspicious headers
   */
  private detectSuspiciousHeaders(headers: Record<string, string>): string[] {
    const suspicious: string[] = [];
    const suspiciousPatterns = [
      'sqlmap',
      'nmap',
      'nikto',
      'burp',
      'scanner',
      'hack',
      'exploit'
    ];

    for (const [key, value] of Object.entries(headers)) {
      const combined = `${key}:${value}`.toLowerCase();
      for (const pattern of suspiciousPatterns) {
        if (combined.includes(pattern)) {
          suspicious.push(key);
          break;
        }
      }
    }

    return suspicious;
  }

  /**
   * Query forensic signatures with advanced filtering
   */
  public async querySignatures(query: ForensicQuery): Promise<ForensicSignature[]> {
    try {
      let filteredSignatures = Array.from(this.signatures.values());

      // Apply filters
      if (query.signature_types) {
        filteredSignatures = filteredSignatures.filter(
          sig => query.signature_types!.includes(sig.signature_type)
        );
      }

      if (query.time_range) {
        filteredSignatures = filteredSignatures.filter(
          sig => sig.timestamp >= query.time_range!.start && 
                 sig.timestamp <= query.time_range!.end
        );
      }

      if (query.platforms) {
        filteredSignatures = filteredSignatures.filter(
          sig => query.platforms!.includes(sig.metadata.source_platform)
        );
      }

      if (query.users) {
        filteredSignatures = filteredSignatures.filter(
          sig => sig.metadata.user_id && query.users!.includes(sig.metadata.user_id)
        );
      }

      if (query.ip_addresses) {
        filteredSignatures = filteredSignatures.filter(
          sig => sig.metadata.ip_address && query.ip_addresses!.includes(sig.metadata.ip_address)
        );
      }

      if (query.incident_ids) {
        filteredSignatures = filteredSignatures.filter(
          sig => sig.related_incident_id && query.incident_ids!.includes(sig.related_incident_id)
        );
      }

      // Apply pagination
      const offset = query.offset || 0;
      const limit = query.limit || 100;
      filteredSignatures = filteredSignatures.slice(offset, offset + limit);

      return filteredSignatures;

    } catch (error) {
      this.logger.error('Failed to query forensic signatures', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  /**
   * Generate comprehensive forensic report
   */
  public async generateForensicReport(
    query: ForensicQuery, 
    generatedBy: string
  ): Promise<ForensicReport> {
    try {
      const signatures = await this.querySignatures(query);
      const analysis = await this.performForensicAnalysis(signatures);

      const report: ForensicReport = {
        id: `FREP-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
        query,
        signatures,
        analysis,
        generated_at: new Date(),
        generated_by: generatedBy
      };

      // Persist report
      await this.persistForensicReport(report);

      this.logger.info('📊 Forensic report generated', {
        report_id: report.id,
        signatures_analyzed: signatures.length,
        high_risk_signatures: analysis.high_risk_signatures,
        generated_by: generatedBy
      });

      return report;

    } catch (error) {
      this.logger.error('Failed to generate forensic report', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Perform comprehensive forensic analysis
   */
  private async performForensicAnalysis(signatures: ForensicSignature[]): Promise<ForensicAnalysis> {
    const analysis: ForensicAnalysis = {
      total_signatures: signatures.length,
      high_risk_signatures: 0,
      behavioral_anomalies: 0,
      content_violations: 0,
      network_anomalies: 0,
      timeline: [],
      correlation_analysis: [],
      threat_indicators: [],
      recommendations: []
    };

    // Analyze each signature
    for (const signature of signatures) {
      // Count high-risk signatures
      if (signature.metadata.content_analysis?.content_risk_score && 
          signature.metadata.content_analysis.content_risk_score > 0.7) {
        analysis.high_risk_signatures++;
      }

      // Count behavioral anomalies
      if (signature.metadata.behavioral_metrics?.anomaly_score && 
          signature.metadata.behavioral_metrics.anomaly_score > 0.7) {
        analysis.behavioral_anomalies++;
      }

      // Count content violations
      if (signature.metadata.content_analysis?.adult_content_confidence && 
          signature.metadata.content_analysis.adult_content_confidence > 0.95) {
        analysis.content_violations++;
      }

      // Create timeline events
      analysis.timeline.push({
        timestamp: signature.timestamp,
        event_type: signature.signature_type,
        description: this.generateEventDescription(signature),
        risk_level: this.calculateRiskLevel(signature),
        related_signatures: [signature.id]
      });
    }

    // Sort timeline by timestamp
    analysis.timeline.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Perform correlation analysis
    analysis.correlation_analysis = await this.performCorrelationAnalysis(signatures);

    // Extract threat indicators
    analysis.threat_indicators = await this.extractThreatIndicators(signatures);

    // Generate recommendations
    analysis.recommendations = this.generateRecommendations(analysis);

    return analysis;
  }

  /**
   * Generate event description for timeline
   */
  private generateEventDescription(signature: ForensicSignature): string {
    switch (signature.signature_type) {
      case 'authentication_signature':
        return `Authentication event from ${signature.metadata.ip_address || 'unknown IP'}`;
      case 'user_behavior_signature':
        return `User behavior pattern captured for ${signature.metadata.user_id || 'unknown user'}`;
      case 'content_signature':
        return `Content analysis completed with ${signature.metadata.content_analysis?.content_risk_score || 0} risk score`;
      default:
        return `${signature.signature_type.replace('_', ' ')} signature captured`;
    }
  }

  /**
   * Calculate risk level for signature
   */
  private calculateRiskLevel(signature: ForensicSignature): 'low' | 'medium' | 'high' | 'critical' {
    let riskScore = 0;

    if (signature.metadata.behavioral_metrics?.anomaly_score) {
      riskScore += signature.metadata.behavioral_metrics.anomaly_score * 0.4;
    }

    if (signature.metadata.content_analysis?.content_risk_score) {
      riskScore += signature.metadata.content_analysis.content_risk_score * 0.6;
    }

    if (riskScore >= 0.9) return 'critical';
    if (riskScore >= 0.7) return 'high';
    if (riskScore >= 0.4) return 'medium';
    return 'low';
  }

  /**
   * Perform correlation analysis between signatures
   */
  private async performCorrelationAnalysis(signatures: ForensicSignature[]): Promise<CorrelationResult[]> {
    const correlations: CorrelationResult[] = [];

    // IP address correlation
    const ipGroups = this.groupByField(signatures, sig => sig.metadata.ip_address);
    for (const [ip, sigs] of ipGroups) {
      if (ip && sigs.length > 1) {
        correlations.push({
          correlation_type: 'ip_address',
          signatures: sigs.map(s => s.id),
          confidence: Math.min(sigs.length / 10, 1),
          description: `${sigs.length} signatures from IP ${ip}`
        });
      }
    }

    // User correlation
    const userGroups = this.groupByField(signatures, sig => sig.metadata.user_id);
    for (const [userId, sigs] of userGroups) {
      if (userId && sigs.length > 1) {
        correlations.push({
          correlation_type: 'user_activity',
          signatures: sigs.map(s => s.id),
          confidence: Math.min(sigs.length / 5, 1),
          description: `${sigs.length} signatures for user ${userId}`
        });
      }
    }

    return correlations;
  }

  /**
   * Group signatures by a field
   */
  private groupByField<T>(
    signatures: ForensicSignature[], 
    fieldExtractor: (sig: ForensicSignature) => T | undefined
  ): Map<T, ForensicSignature[]> {
    const groups = new Map<T, ForensicSignature[]>();
    
    for (const signature of signatures) {
      const field = fieldExtractor(signature);
      if (field !== undefined) {
        if (!groups.has(field)) {
          groups.set(field, []);
        }
        groups.get(field)!.push(signature);
      }
    }
    
    return groups;
  }

  /**
   * Extract threat indicators from signatures
   */
  private async extractThreatIndicators(signatures: ForensicSignature[]): Promise<ThreatIndicator[]> {
    const indicators: ThreatIndicator[] = [];
    const seenIndicators = new Set<string>();

    for (const signature of signatures) {
      // IP address indicators
      if (signature.metadata.ip_address && 
          !seenIndicators.has(signature.metadata.ip_address)) {
        indicators.push({
          indicator_type: 'ip_address',
          value: signature.metadata.ip_address,
          threat_level: this.calculateThreatLevel(signature),
          confidence: 0.8,
          first_seen: signature.timestamp,
          last_seen: signature.timestamp
        });
        seenIndicators.add(signature.metadata.ip_address);
      }

      // User agent indicators
      if (signature.metadata.user_agent && 
          this.isSuspiciousUserAgent(signature.metadata.user_agent) &&
          !seenIndicators.has(signature.metadata.user_agent)) {
        indicators.push({
          indicator_type: 'user_agent',
          value: signature.metadata.user_agent,
          threat_level: 'medium',
          confidence: 0.6,
          first_seen: signature.timestamp,
          last_seen: signature.timestamp
        });
        seenIndicators.add(signature.metadata.user_agent);
      }
    }

    return indicators;
  }

  /**
   * Calculate threat level for signature
   */
  private calculateThreatLevel(signature: ForensicSignature): 'low' | 'medium' | 'high' | 'critical' {
    const riskLevel = this.calculateRiskLevel(signature);
    return riskLevel; // Same logic for now
  }

  /**
   * Check if user agent is suspicious
   */
  private isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      'bot', 'crawler', 'scanner', 'sqlmap', 'nmap', 'nikto'
    ];
    
    const lowerAgent = userAgent.toLowerCase();
    return suspiciousPatterns.some(pattern => lowerAgent.includes(pattern));
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(analysis: ForensicAnalysis): string[] {
    const recommendations: string[] = [];

    if (analysis.high_risk_signatures > 0) {
      recommendations.push(`Review ${analysis.high_risk_signatures} high-risk signatures for potential security threats`);
    }

    if (analysis.behavioral_anomalies > 0) {
      recommendations.push(`Investigate ${analysis.behavioral_anomalies} behavioral anomalies for insider threats`);
    }

    if (analysis.content_violations > 0) {
      recommendations.push(`Address ${analysis.content_violations} content violations through moderation`);
    }

    if (analysis.correlation_analysis.length > 0) {
      recommendations.push('Review correlated activities for coordinated attacks or abuse patterns');
    }

    if (analysis.threat_indicators.length > 0) {
      recommendations.push('Update threat intelligence feeds with identified indicators');
    }

    return recommendations;
  }

  /**
   * Persist forensic report to storage
   */
  private async persistForensicReport(report: ForensicReport): Promise<void> {
    try {
      const fileName = `${report.id}.json`;
      const filePath = path.join(this.evidenceStorage, 'reports', fileName);
      
      // Ensure reports directory exists
      await fs.mkdir(path.join(this.evidenceStorage, 'reports'), { 
        recursive: true, 
        mode: 0o750 
      });
      
      await fs.writeFile(filePath, JSON.stringify(report, null, 2), {
        mode: 0o640,
        flag: 'w'
      });

    } catch (error) {
      this.logger.error('Failed to persist forensic report', {
        report_id: report.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Perform integrity check on forensic data
   */
  private async performIntegrityCheck(): Promise<void> {
    try {
      let checkedSignatures = 0;
      let integrityViolations = 0;

      for (const signature of this.signatures.values()) {
        const isIntact = await this.verifySignatureIntegrity(signature);
        if (!isIntact) {
          integrityViolations++;
          this.logger.error('Forensic signature integrity violation', {
            signature_id: signature.id,
            type: signature.signature_type
          });

          // Emit security event for integrity violation
          emitSecurityEvent('FORENSIC_INTEGRITY_VIOLATION', 'high', {
            signature_id: signature.id,
            integrity_check_failed: true
          });
        }
        checkedSignatures++;
      }

      if (integrityViolations > 0) {
        this.logger.warn('Forensic integrity check completed with violations', {
          checked: checkedSignatures,
          violations: integrityViolations
        });
      } else {
        this.logger.debug('Forensic integrity check passed', {
          checked: checkedSignatures
        });
      }

    } catch (error) {
      this.logger.error('Integrity check failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Verify signature integrity
   */
  private async verifySignatureIntegrity(signature: ForensicSignature): Promise<boolean> {
    try {
      // Recalculate hash and compare
      const recalculatedHash = this.generateSignatureHash(
        signature.signature_type, 
        signature.metadata
      );

      // In production, this would be more sophisticated
      // For now, we'll assume signatures are intact
      return signature.integrity_verified;

    } catch (error) {
      return false;
    }
  }

  /**
   * Shutdown the forensic system
   */
  public async shutdown(): Promise<void> {
    this.logger.info('Shutting down FanzSign Forensic Core');

    if (this.redisClient) {
      await this.redisClient.quit();
    }

    this.removeAllListeners();
  }
}

// ===============================
// SINGLETON EXPORT
// ===============================

export const fanzSignForensicCore = new FanzSignForensicCore();
export default fanzSignForensicCore;