import { z } from 'zod';
import crypto from 'crypto';

// Fraud detection schemas
const ClickAnalysisSchema = z.object({
  ip: z.string(),
  userAgent: z.string(),
  referrer: z.string().optional(),
  timestamp: z.date(),
  affiliateId: z.string(),
  offerId: z.string(),
  subIds: z.record(z.string()).optional(),
  geoLocation: z.object({
    country: z.string(),
    region: z.string(),
    city: z.string(),
    timezone: z.string(),
  }).optional(),
});

const ConversionAnalysisSchema = z.object({
  transactionId: z.string(),
  clickId: z.string(),
  value: z.number(),
  currency: z.string(),
  timestamp: z.date(),
  conversionDelay: z.number(), // seconds between click and conversion
  customerData: z.object({
    email: z.string().optional(),
    phone: z.string().optional(),
    deviceId: z.string().optional(),
  }).optional(),
});

const DeviceFingerprintSchema = z.object({
  screenResolution: z.string(),
  timezone: z.string(),
  language: z.string(),
  platform: z.string(),
  cookiesEnabled: z.boolean(),
  doNotTrack: z.boolean(),
  plugins: z.array(z.string()),
  canvas: z.string(), // Canvas fingerprint hash
  webgl: z.string(), // WebGL fingerprint hash
});

type ClickAnalysis = z.infer<typeof ClickAnalysisSchema>;
type ConversionAnalysis = z.infer<typeof ConversionAnalysisSchema>;
type DeviceFingerprint = z.infer<typeof DeviceFingerprintSchema>;

interface FraudScore {
  score: number; // 0-100, higher = more suspicious
  risk: 'low' | 'medium' | 'high' | 'critical';
  reasons: string[];
  confidence: number; // 0-1
  recommendations: string[];
}

interface IPReputation {
  reputation: number; // 0-100, higher = better reputation
  isProxy: boolean;
  isVPN: boolean;
  isTor: boolean;
  isDataCenter: boolean;
  isMalicious: boolean;
  country: string;
  provider: string;
}

interface BehaviorPattern {
  clickFrequency: number;
  conversionRate: number;
  avgTimeToConversion: number;
  deviceConsistency: number;
  geoConsistency: number;
  suspiciousPatterns: string[];
}

/**
 * Advanced Fraud Detection Service
 * Uses ML algorithms and heuristics to detect fraudulent activity
 */
export class FraudDetectionService {
  private static instance: FraudDetectionService;
  private ipReputationCache = new Map<string, IPReputation>();
  private deviceFingerprintCache = new Map<string, DeviceFingerprint>();
  private behaviorPatterns = new Map<string, BehaviorPattern>();
  private suspiciousIPs = new Set<string>();
  private trustedIPs = new Set<string>();

  // Fraud detection thresholds
  private readonly THRESHOLDS = {
    HIGH_RISK_SCORE: 70,
    MEDIUM_RISK_SCORE: 40,
    MAX_CLICKS_PER_IP_HOUR: 100,
    MAX_CONVERSIONS_PER_IP_HOUR: 10,
    MIN_TIME_TO_CONVERSION: 5, // seconds
    MAX_TIME_TO_CONVERSION: 2592000, // 30 days
    SUSPICIOUS_CONVERSION_RATE: 0.8, // 80%+ conversion rate is suspicious
    MIN_DEVICE_CONSISTENCY: 0.3, // Device fingerprint similarity threshold
  };

  private constructor() {
    this.initializeFraudDetection();
  }

  public static getInstance(): FraudDetectionService {
    if (!FraudDetectionService.instance) {
      FraudDetectionService.instance = new FraudDetectionService();
    }
    return FraudDetectionService.instance;
  }

  /**
   * Analyze click for fraud indicators
   */
  public async analyzeClick(clickData: ClickAnalysis): Promise<FraudScore> {
    const reasons: string[] = [];
    let score = 0;
    const recommendations: string[] = [];

    // IP-based analysis
    const ipReputation = await this.getIPReputation(clickData.ip);
    if (ipReputation.isProxy || ipReputation.isVPN) {
      score += 25;
      reasons.push('Traffic from proxy/VPN detected');
      recommendations.push('Consider blocking proxy traffic');
    }

    if (ipReputation.isMalicious) {
      score += 40;
      reasons.push('Traffic from known malicious IP');
      recommendations.push('Block this IP immediately');
    }

    if (ipReputation.isDataCenter) {
      score += 30;
      reasons.push('Traffic from data center IP');
      recommendations.push('Monitor for bot activity');
    }

    // Click frequency analysis
    const clickFrequency = await this.getRecentClickFrequency(clickData.ip, clickData.affiliateId);
    if (clickFrequency > this.THRESHOLDS.MAX_CLICKS_PER_IP_HOUR) {
      score += 35;
      reasons.push(`Excessive click frequency: ${clickFrequency} clicks/hour`);
      recommendations.push('Implement rate limiting');
    }

    // User agent analysis
    if (this.isSuspiciousUserAgent(clickData.userAgent)) {
      score += 20;
      reasons.push('Suspicious or bot-like user agent');
      recommendations.push('Verify legitimate traffic source');
    }

    // Referrer analysis
    if (this.isSuspiciousReferrer(clickData.referrer)) {
      score += 15;
      reasons.push('Suspicious or missing referrer');
      recommendations.push('Verify traffic source legitimacy');
    }

    // Geo-location consistency
    if (clickData.geoLocation) {
      const geoConsistency = await this.analyzeGeoConsistency(
        clickData.affiliateId, 
        clickData.geoLocation
      );
      if (geoConsistency < 0.3) {
        score += 20;
        reasons.push('Inconsistent geographic patterns');
        recommendations.push('Review affiliate traffic sources');
      }
    }

    return {
      score: Math.min(score, 100),
      risk: this.calculateRiskLevel(score),
      reasons,
      confidence: this.calculateConfidence(score, reasons.length),
      recommendations,
    };
  }

  /**
   * Analyze conversion for fraud indicators
   */
  public async analyzeConversion(conversionData: ConversionAnalysis): Promise<FraudScore> {
    const reasons: string[] = [];
    let score = 0;
    const recommendations: string[] = [];

    // Time-based analysis
    if (conversionData.conversionDelay < this.THRESHOLDS.MIN_TIME_TO_CONVERSION) {
      score += 45;
      reasons.push(`Conversion too fast: ${conversionData.conversionDelay}s`);
      recommendations.push('Implement minimum conversion delay');
    }

    if (conversionData.conversionDelay > this.THRESHOLDS.MAX_TIME_TO_CONVERSION) {
      score += 25;
      reasons.push(`Conversion suspiciously delayed: ${conversionData.conversionDelay}s`);
      recommendations.push('Review long-delayed conversions');
    }

    // Value-based analysis
    if (await this.isAnomalousValue(conversionData.value, conversionData.clickId)) {
      score += 30;
      reasons.push('Conversion value anomaly detected');
      recommendations.push('Manual review of high-value conversions');
    }

    // Duplicate transaction analysis
    if (await this.isDuplicateTransaction(conversionData.transactionId)) {
      score += 60;
      reasons.push('Duplicate transaction ID detected');
      recommendations.push('Block duplicate transactions');
    }

    // Customer data analysis
    if (conversionData.customerData) {
      const customerRisk = await this.analyzeCustomerData(conversionData.customerData);
      score += customerRisk;
      if (customerRisk > 20) {
        reasons.push('Suspicious customer data patterns');
        recommendations.push('Enhanced customer verification required');
      }
    }

    // Affiliate behavior analysis
    const affiliateBehavior = await this.analyzeAffiliateBehavior(conversionData.clickId);
    score += affiliateBehavior.riskScore;
    reasons.push(...affiliateBehavior.reasons);
    recommendations.push(...affiliateBehavior.recommendations);

    return {
      score: Math.min(score, 100),
      risk: this.calculateRiskLevel(score),
      reasons,
      confidence: this.calculateConfidence(score, reasons.length),
      recommendations,
    };
  }

  /**
   * Generate device fingerprint
   */
  public generateDeviceFingerprint(fingerprintData: DeviceFingerprint): string {
    const dataString = JSON.stringify({
      screen: fingerprintData.screenResolution,
      tz: fingerprintData.timezone,
      lang: fingerprintData.language,
      platform: fingerprintData.platform,
      cookies: fingerprintData.cookiesEnabled,
      dnt: fingerprintData.doNotTrack,
      plugins: fingerprintData.plugins.sort().join(','),
      canvas: fingerprintData.canvas,
      webgl: fingerprintData.webgl,
    });

    const hash = crypto.createHash('sha256').update(dataString).digest('hex');
    this.deviceFingerprintCache.set(hash, fingerprintData);
    return hash;
  }

  /**
   * Analyze device fingerprint for fraud
   */
  public async analyzeDeviceFingerprint(fingerprint: string, ip: string): Promise<FraudScore> {
    const reasons: string[] = [];
    let score = 0;
    const recommendations: string[] = [];

    // Check for device fingerprint reuse across IPs
    const deviceUsage = await this.getDeviceUsageAcrossIPs(fingerprint);
    if (deviceUsage.uniqueIPs > 10) {
      score += 30;
      reasons.push(`Device used across ${deviceUsage.uniqueIPs} different IPs`);
      recommendations.push('Monitor for device sharing/fraud');
    }

    // Check for IP sharing across devices
    const ipUsage = await this.getIPUsageAcrossDevices(ip);
    if (ipUsage.uniqueDevices > 50) {
      score += 25;
      reasons.push(`IP used by ${ipUsage.uniqueDevices} different devices`);
      recommendations.push('Possible bot farm or proxy detected');
    }

    // Analyze fingerprint consistency
    const fingerprintData = this.deviceFingerprintCache.get(fingerprint);
    if (fingerprintData && this.isSuspiciousFingerprint(fingerprintData)) {
      score += 35;
      reasons.push('Suspicious device fingerprint characteristics');
      recommendations.push('Enhanced device verification needed');
    }

    return {
      score: Math.min(score, 100),
      risk: this.calculateRiskLevel(score),
      reasons,
      confidence: this.calculateConfidence(score, reasons.length),
      recommendations,
    };
  }

  /**
   * Update affiliate behavior patterns
   */
  public updateAffiliateBehavior(
    affiliateId: string, 
    clickCount: number, 
    conversionCount: number,
    avgTimeToConversion: number
  ): void {
    const existing = this.behaviorPatterns.get(affiliateId) || {
      clickFrequency: 0,
      conversionRate: 0,
      avgTimeToConversion: 0,
      deviceConsistency: 1,
      geoConsistency: 1,
      suspiciousPatterns: [],
    };

    existing.clickFrequency = clickCount;
    existing.conversionRate = conversionCount / Math.max(clickCount, 1);
    existing.avgTimeToConversion = avgTimeToConversion;

    // Detect suspicious patterns
    existing.suspiciousPatterns = [];
    if (existing.conversionRate > this.THRESHOLDS.SUSPICIOUS_CONVERSION_RATE) {
      existing.suspiciousPatterns.push('abnormally_high_conversion_rate');
    }

    if (avgTimeToConversion < 10) {
      existing.suspiciousPatterns.push('extremely_fast_conversions');
    }

    this.behaviorPatterns.set(affiliateId, existing);
  }

  /**
   * Get fraud statistics for monitoring
   */
  public getFraudStatistics(): {
    totalAnalyses: number;
    highRiskDetected: number;
    blockedIPs: number;
    trustedIPs: number;
    deviceFingerprints: number;
  } {
    return {
      totalAnalyses: this.ipReputationCache.size,
      highRiskDetected: Array.from(this.behaviorPatterns.values())
        .filter(b => b.suspiciousPatterns.length > 0).length,
      blockedIPs: this.suspiciousIPs.size,
      trustedIPs: this.trustedIPs.size,
      deviceFingerprints: this.deviceFingerprintCache.size,
    };
  }

  /**
   * Initialize fraud detection system
   */
  private initializeFraudDetection(): void {
    console.log('🛡️ Initializing Advanced Fraud Detection System');
    
    // Load known malicious IPs (in production, this would be from a service)
    const knownMaliciousIPs = [
      '192.168.1.1', // Example - replace with real malicious IP feeds
    ];
    
    knownMaliciousIPs.forEach(ip => this.suspiciousIPs.add(ip));
    
    // Start cleanup intervals
    setInterval(() => this.cleanupCache(), 3600000); // 1 hour
    setInterval(() => this.updateIPReputations(), 1800000); // 30 minutes
  }

  /**
   * Get IP reputation (cached with external service integration)
   */
  private async getIPReputation(ip: string): Promise<IPReputation> {
    if (this.ipReputationCache.has(ip)) {
      return this.ipReputationCache.get(ip)!;
    }

    // In production, integrate with IP reputation services like:
    // AbuseIPDB, IPQualityScore, MaxMind, etc.
    const reputation: IPReputation = {
      reputation: 50, // Default neutral reputation
      isProxy: false,
      isVPN: false,
      isTor: false,
      isDataCenter: false,
      isMalicious: this.suspiciousIPs.has(ip),
      country: 'Unknown',
      provider: 'Unknown',
    };

    // Mock reputation logic based on IP patterns
    if (ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('172.')) {
      reputation.reputation = 30; // Private IPs are less trusted for affiliate marketing
    }

    this.ipReputationCache.set(ip, reputation);
    return reputation;
  }

  /**
   * Get recent click frequency for IP/affiliate combination
   */
  private async getRecentClickFrequency(ip: string, affiliateId: string): Promise<number> {
    // In production, query from database/cache
    // Mock implementation
    const key = `${ip}:${affiliateId}`;
    return Math.floor(Math.random() * 20); // Mock frequency
  }

  /**
   * Analyze suspicious user agents
   */
  private isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /^curl/i,
      /^wget/i,
      /python/i,
      /java/i,
    ];

    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }

  /**
   * Analyze suspicious referrers
   */
  private isSuspiciousReferrer(referrer?: string): boolean {
    if (!referrer) return true; // Missing referrer is suspicious

    const suspiciousDomains = [
      'bit.ly',
      't.co',
      'tinyurl.com',
      // Add more suspicious domains
    ];

    return suspiciousDomains.some(domain => referrer.includes(domain));
  }

  /**
   * Analyze geographic consistency
   */
  private async analyzeGeoConsistency(
    affiliateId: string, 
    currentGeo: { country: string; region: string; city: string }
  ): Promise<number> {
    // Mock implementation - in production, analyze historical geo patterns
    return Math.random(); // Return consistency score 0-1
  }

  /**
   * Check for anomalous conversion values
   */
  private async isAnomalousValue(value: number, clickId: string): Promise<boolean> {
    // Mock implementation - analyze value distributions
    return value > 1000; // Values over $1000 are flagged
  }

  /**
   * Check for duplicate transactions
   */
  private async isDuplicateTransaction(transactionId: string): Promise<boolean> {
    // Mock implementation - check transaction ID uniqueness
    return false;
  }

  /**
   * Analyze customer data for fraud indicators
   */
  private async analyzeCustomerData(customerData: {
    email?: string;
    phone?: string;
    deviceId?: string;
  }): Promise<number> {
    let riskScore = 0;

    if (customerData.email) {
      // Check for disposable email domains
      const disposableDomains = ['10minutemail.com', 'tempmail.org'];
      if (disposableDomains.some(domain => customerData.email!.includes(domain))) {
        riskScore += 20;
      }
    }

    if (customerData.phone) {
      // Check for VOIP/virtual numbers
      if (customerData.phone.startsWith('+1555')) { // Mock VOIP pattern
        riskScore += 15;
      }
    }

    return riskScore;
  }

  /**
   * Analyze affiliate behavior patterns
   */
  private async analyzeAffiliateBehavior(clickId: string): Promise<{
    riskScore: number;
    reasons: string[];
    recommendations: string[];
  }> {
    // Mock implementation - analyze affiliate patterns
    return {
      riskScore: 0,
      reasons: [],
      recommendations: [],
    };
  }

  /**
   * Get device usage statistics across IPs
   */
  private async getDeviceUsageAcrossIPs(fingerprint: string): Promise<{
    uniqueIPs: number;
  }> {
    // Mock implementation
    return { uniqueIPs: Math.floor(Math.random() * 20) };
  }

  /**
   * Get IP usage statistics across devices
   */
  private async getIPUsageAcrossDevices(ip: string): Promise<{
    uniqueDevices: number;
  }> {
    // Mock implementation
    return { uniqueDevices: Math.floor(Math.random() * 100) };
  }

  /**
   * Check if device fingerprint is suspicious
   */
  private isSuspiciousFingerprint(fingerprint: DeviceFingerprint): boolean {
    // Check for common bot characteristics
    if (fingerprint.plugins.length === 0) return true;
    if (!fingerprint.cookiesEnabled) return true;
    if (fingerprint.language === 'en') return false; // This is just an example

    return false;
  }

  /**
   * Calculate risk level from score
   */
  private calculateRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 80) return 'critical';
    if (score >= this.THRESHOLDS.HIGH_RISK_SCORE) return 'high';
    if (score >= this.THRESHOLDS.MEDIUM_RISK_SCORE) return 'medium';
    return 'low';
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(score: number, reasonCount: number): number {
    const baseConfidence = Math.min(score / 100, 1);
    const reasonBonus = Math.min(reasonCount * 0.1, 0.3);
    return Math.min(baseConfidence + reasonBonus, 1);
  }

  /**
   * Clean up cached data
   */
  private cleanupCache(): void {
    // Implement cache cleanup logic
    console.log('🧹 Cleaning up fraud detection cache');
  }

  /**
   * Update IP reputations from external services
   */
  private async updateIPReputations(): Promise<void> {
    // Implement IP reputation updates
    console.log('🔄 Updating IP reputation data');
  }
}

// Export singleton instance
export const fraudDetectionService = FraudDetectionService.getInstance();
