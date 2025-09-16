import { logger } from '../utils/logger';
import { IPGeolocationService } from './IPGeolocationService';
import { VPNDetectionService } from './VPNDetectionService';

export interface AccessRequest {
  ip: string;
  userAgent?: string;
  userId?: string;
  contentId?: string;
  contentType: ContentType;
  requestedAction: 'view' | 'upload' | 'purchase' | 'interact';
  timestamp: Date;
}

export interface AccessDecision {
  allowed: boolean;
  reason: string;
  jurisdiction: string;
  restrictions: ContentRestriction[];
  warnings: string[];
  alternativeActions?: string[];
  appealOptions?: AppealOption[];
}

export interface ContentRestriction {
  type: 'age_gate' | 'geo_block' | 'time_restriction' | 'content_warning' | 'payment_restriction';
  severity: 'block' | 'warn' | 'redirect' | 'require_verification';
  message: string;
  jurisdiction: string;
  legalBasis: string;
  expiresAt?: Date;
}

export interface AppealOption {
  type: 'manual_review' | 'age_verification' | 'vpn_disable' | 'legal_contact';
  description: string;
  url?: string;
}

export interface JurisdictionRule {
  jurisdiction: string;
  country: string;
  state?: string;
  city?: string;
  contentRestrictions: ContentRestrictionRule[];
  ageRequirements: AgeRequirement[];
  timeRestrictions: TimeRestriction[];
  paymentRestrictions: PaymentRestriction[];
  legalContacts: LegalContact[];
  lastUpdated: Date;
}

export interface ContentRestrictionRule {
  contentTypes: ContentType[];
  action: 'block' | 'age_gate' | 'warning' | 'redirect';
  conditions: RestrictionCondition[];
  exemptions: Exemption[];
  legalBasis: string;
}

export interface AgeRequirement {
  minimumAge: number;
  verificationRequired: boolean;
  verificationMethods: string[];
  gracePeriod?: number; // days
}

export interface TimeRestriction {
  startTime: string; // HH:MM format
  endTime: string;
  timezone: string;
  daysOfWeek: number[]; // 0=Sunday, 6=Saturday
  contentTypes: ContentType[];
}

export interface PaymentRestriction {
  blockedMethods: string[];
  requiredVerification: string[];
  maximumAmount?: number;
  currency: string;
}

export interface LegalContact {
  type: 'general' | 'privacy' | 'compliance' | 'appeals';
  email: string;
  phone?: string;
  address?: string;
}

export interface RestrictionCondition {
  type: 'age' | 'verification_status' | 'user_type' | 'content_rating' | 'time' | 'payment_method';
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains';
  value: any;
}

export interface Exemption {
  type: 'verified_user' | 'creator_account' | 'educational' | 'artistic' | 'news';
  conditions: RestrictionCondition[];
}

export enum ContentType {
  ADULT_VIDEO = 'adult_video',
  ADULT_PHOTO = 'adult_photo',
  ADULT_LIVE = 'adult_live',
  ADULT_TEXT = 'adult_text',
  EDUCATIONAL = 'educational',
  ARTISTIC = 'artistic',
  NEWS = 'news',
  GENERAL = 'general',
}

/**
 * Comprehensive geo-blocking service that enforces jurisdiction-specific
 * content restrictions and access controls for adult content platforms
 */
export class GeoblockingService {
  private geoService: IPGeolocationService;
  private vpnService: VPNDetectionService;
  private jurisdictionRules: Map<string, JurisdictionRule> = new Map();

  constructor(geoService: IPGeolocationService, vpnService: VPNDetectionService) {
    this.geoService = geoService;
    this.vpnService = vpnService;
    this.loadJurisdictionRules();
  }

  private loadJurisdictionRules(): void {
    const rules: JurisdictionRule[] = [
      // United States - Texas (HB 1181)
      {
        jurisdiction: 'US-TX',
        country: 'US',
        state: 'TX',
        contentRestrictions: [
          {
            contentTypes: [ContentType.ADULT_VIDEO, ContentType.ADULT_PHOTO, ContentType.ADULT_LIVE],
            action: 'age_gate',
            conditions: [
              { type: 'age', operator: 'less_than', value: 18 },
              { type: 'verification_status', operator: 'equals', value: 'unverified' }
            ],
            exemptions: [],
            legalBasis: 'Texas HB 1181 - Protecting Minors from Harmful Material'
          }
        ],
        ageRequirements: [{
          minimumAge: 18,
          verificationRequired: true,
          verificationMethods: ['government_id', 'digital_wallet', 'credit_card']
        }],
        timeRestrictions: [],
        paymentRestrictions: [{
          blockedMethods: [],
          requiredVerification: ['government_id'],
          currency: 'USD'
        }],
        legalContacts: [
          { type: 'compliance', email: 'texas-compliance@fanz.app' }
        ],
        lastUpdated: new Date('2023-09-01')
      },

      // United States - Louisiana (Act 440)
      {
        jurisdiction: 'US-LA',
        country: 'US',
        state: 'LA',
        contentRestrictions: [
          {
            contentTypes: [ContentType.ADULT_VIDEO, ContentType.ADULT_PHOTO, ContentType.ADULT_LIVE],
            action: 'age_gate',
            conditions: [
              { type: 'verification_status', operator: 'equals', value: 'unverified' }
            ],
            exemptions: [],
            legalBasis: 'Louisiana Act 440 - Age Verification Requirements'
          }
        ],
        ageRequirements: [{
          minimumAge: 18,
          verificationRequired: true,
          verificationMethods: ['government_id', 'device_verification']
        }],
        timeRestrictions: [],
        paymentRestrictions: [{
          blockedMethods: [],
          requiredVerification: ['age_verification'],
          currency: 'USD'
        }],
        legalContacts: [
          { type: 'compliance', email: 'louisiana-compliance@fanz.app' }
        ],
        lastUpdated: new Date('2023-01-01')
      },

      // United Kingdom
      {
        jurisdiction: 'GB',
        country: 'GB',
        contentRestrictions: [
          {
            contentTypes: [ContentType.ADULT_VIDEO, ContentType.ADULT_PHOTO, ContentType.ADULT_LIVE],
            action: 'age_gate',
            conditions: [
              { type: 'verification_status', operator: 'equals', value: 'unverified' }
            ],
            exemptions: [
              { type: 'educational', conditions: [{ type: 'content_rating', operator: 'equals', value: 'educational' }] }
            ],
            legalBasis: 'UK Age Verification Regulations'
          }
        ],
        ageRequirements: [{
          minimumAge: 18,
          verificationRequired: true,
          verificationMethods: ['government_id', 'credit_check', 'mobile_verification']
        }],
        timeRestrictions: [],
        paymentRestrictions: [{
          blockedMethods: [],
          requiredVerification: ['age_verification', 'financial_verification'],
          currency: 'GBP'
        }],
        legalContacts: [
          { type: 'compliance', email: 'uk-compliance@fanz.app' },
          { type: 'appeals', email: 'uk-appeals@fanz.app' }
        ],
        lastUpdated: new Date('2023-07-01')
      },

      // European Union - Germany (JMStV)
      {
        jurisdiction: 'DE',
        country: 'DE',
        contentRestrictions: [
          {
            contentTypes: [ContentType.ADULT_VIDEO, ContentType.ADULT_PHOTO, ContentType.ADULT_LIVE],
            action: 'age_gate',
            conditions: [
              { type: 'verification_status', operator: 'equals', value: 'unverified' }
            ],
            exemptions: [],
            legalBasis: 'Jugendmedienschutz-Staatsvertrag (JMStV)'
          }
        ],
        ageRequirements: [{
          minimumAge: 18,
          verificationRequired: true,
          verificationMethods: ['personalausweis', 'eid_verification']
        }],
        timeRestrictions: [
          {
            startTime: '22:00',
            endTime: '06:00',
            timezone: 'Europe/Berlin',
            daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
            contentTypes: [ContentType.ADULT_VIDEO, ContentType.ADULT_LIVE]
          }
        ],
        paymentRestrictions: [{
          blockedMethods: [],
          requiredVerification: ['eid_verification'],
          currency: 'EUR'
        }],
        legalContacts: [
          { type: 'compliance', email: 'germany-compliance@fanz.app' }
        ],
        lastUpdated: new Date('2023-05-01')
      },

      // Australia
      {
        jurisdiction: 'AU',
        country: 'AU',
        contentRestrictions: [
          {
            contentTypes: [ContentType.ADULT_VIDEO, ContentType.ADULT_PHOTO, ContentType.ADULT_LIVE],
            action: 'age_gate',
            conditions: [
              { type: 'verification_status', operator: 'equals', value: 'unverified' }
            ],
            exemptions: [],
            legalBasis: 'eSafety Commissioner Requirements'
          }
        ],
        ageRequirements: [{
          minimumAge: 18,
          verificationRequired: true,
          verificationMethods: ['government_id', 'passport']
        }],
        timeRestrictions: [],
        paymentRestrictions: [{
          blockedMethods: [],
          requiredVerification: ['age_verification'],
          currency: 'AUD'
        }],
        legalContacts: [
          { type: 'compliance', email: 'australia-compliance@fanz.app' }
        ],
        lastUpdated: new Date('2023-06-01')
      },

      // Complete ban jurisdictions
      {
        jurisdiction: 'CN',
        country: 'CN',
        contentRestrictions: [
          {
            contentTypes: [ContentType.ADULT_VIDEO, ContentType.ADULT_PHOTO, ContentType.ADULT_LIVE, ContentType.ADULT_TEXT],
            action: 'block',
            conditions: [],
            exemptions: [],
            legalBasis: 'Cybersecurity Law of the People\'s Republic of China'
          }
        ],
        ageRequirements: [],
        timeRestrictions: [],
        paymentRestrictions: [{
          blockedMethods: ['all'],
          requiredVerification: [],
          currency: 'CNY'
        }],
        legalContacts: [],
        lastUpdated: new Date('2023-01-01')
      },

      // UAE - Complete ban
      {
        jurisdiction: 'AE',
        country: 'AE',
        contentRestrictions: [
          {
            contentTypes: [ContentType.ADULT_VIDEO, ContentType.ADULT_PHOTO, ContentType.ADULT_LIVE, ContentType.ADULT_TEXT],
            action: 'block',
            conditions: [],
            exemptions: [],
            legalBasis: 'UAE Federal Penal Code'
          }
        ],
        ageRequirements: [],
        timeRestrictions: [],
        paymentRestrictions: [{
          blockedMethods: ['all'],
          requiredVerification: [],
          currency: 'AED'
        }],
        legalContacts: [],
        lastUpdated: new Date('2023-01-01')
      }
    ];

    // Load rules into map
    rules.forEach(rule => {
      this.jurisdictionRules.set(rule.jurisdiction, rule);
    });

    logger.info(`Loaded ${rules.length} jurisdiction rules`);
  }

  /**
   * Check if access should be allowed based on jurisdiction and content
   */
  async checkAccess(request: AccessRequest): Promise<AccessDecision> {
    try {
      logger.info(`Checking access for IP ${request.ip} to ${request.contentType} content`);

      // Detect location
      const location = await this.geoService.getLocation(request.ip);
      const jurisdiction = this.determineJurisdiction(location);

      // Check for VPN usage
      const vpnDetection = await this.vpnService.detectVPN(request.ip);
      if (vpnDetection.isVPN) {
        logger.warn(`VPN detected for IP ${request.ip}: ${vpnDetection.provider}`);
        
        return {
          allowed: false,
          reason: 'VPN usage detected. Please disable VPN and try again.',
          jurisdiction,
          restrictions: [{
            type: 'geo_block',
            severity: 'block',
            message: 'VPN or proxy usage is not permitted for age verification compliance',
            jurisdiction,
            legalBasis: 'Age verification requirements'
          }],
          warnings: ['VPN detected'],
          appealOptions: [{
            type: 'vpn_disable',
            description: 'Disable VPN/proxy and retry access',
          }]
        };
      }

      // Get jurisdiction rules
      const rules = this.getJurisdictionRules(jurisdiction);
      if (!rules) {
        // Default to allowing with warnings for unknown jurisdictions
        return {
          allowed: true,
          reason: 'Unknown jurisdiction, applying default restrictions',
          jurisdiction,
          restrictions: [{
            type: 'age_gate',
            severity: 'require_verification',
            message: 'Age verification required',
            jurisdiction,
            legalBasis: 'Default safety measures'
          }],
          warnings: ['Unknown jurisdiction detected']
        };
      }

      // Check content restrictions
      const restrictions = this.evaluateContentRestrictions(request, rules);
      const allowed = restrictions.every(r => r.severity !== 'block');

      // Generate decision
      const decision: AccessDecision = {
        allowed,
        reason: allowed 
          ? 'Access permitted with applicable restrictions' 
          : 'Access denied due to jurisdiction restrictions',
        jurisdiction,
        restrictions,
        warnings: this.generateWarnings(request, rules),
        appealOptions: allowed ? undefined : this.generateAppealOptions(rules)
      };

      // Log decision
      logger.info(`Access decision for ${request.ip} in ${jurisdiction}: ${allowed ? 'ALLOWED' : 'DENIED'}`);

      return decision;
    } catch (error) {
      logger.error('Access check failed:', error);
      
      // Fail securely - deny access on error
      return {
        allowed: false,
        reason: 'Unable to verify jurisdiction compliance',
        jurisdiction: 'unknown',
        restrictions: [{
          type: 'geo_block',
          severity: 'block',
          message: 'Technical error during compliance check',
          jurisdiction: 'unknown',
          legalBasis: 'Safety precaution'
        }],
        warnings: ['Technical error occurred'],
        appealOptions: [{
          type: 'manual_review',
          description: 'Contact support for manual verification',
          url: 'https://support.fanz.app/compliance'
        }]
      };
    }
  }

  private determineJurisdiction(location: any): string {
    if (!location) return 'unknown';

    // Build jurisdiction identifier
    let jurisdiction = location.country || 'unknown';
    
    // Add state for US
    if (location.country === 'US' && location.region) {
      jurisdiction = `US-${location.region}`;
    }

    // Add specific handling for other federal countries
    if (location.country === 'CA' && location.region) {
      jurisdiction = `CA-${location.region}`;
    }

    return jurisdiction;
  }

  private getJurisdictionRules(jurisdiction: string): JurisdictionRule | undefined {
    // Try exact match first
    let rules = this.jurisdictionRules.get(jurisdiction);
    
    // If not found, try parent jurisdiction (e.g., US-TX -> US)
    if (!rules && jurisdiction.includes('-')) {
      const parentJurisdiction = jurisdiction.split('-')[0];
      rules = this.jurisdictionRules.get(parentJurisdiction);
    }

    return rules;
  }

  private evaluateContentRestrictions(request: AccessRequest, rules: JurisdictionRule): ContentRestriction[] {
    const restrictions: ContentRestriction[] = [];

    for (const rule of rules.contentRestrictions) {
      // Check if content type matches
      if (!rule.contentTypes.includes(request.contentType)) {
        continue;
      }

      // Check conditions
      const conditionsMet = rule.conditions.every(condition => 
        this.evaluateCondition(condition, request)
      );

      // Check exemptions
      const exemptionApplies = rule.exemptions.some(exemption =>
        exemption.conditions.every(condition => this.evaluateCondition(condition, request))
      );

      // Apply restriction if conditions met and no exemption applies
      if (conditionsMet && !exemptionApplies) {
        restrictions.push({
          type: this.mapActionToRestrictionType(rule.action),
          severity: rule.action,
          message: this.generateRestrictionMessage(rule),
          jurisdiction: rules.jurisdiction,
          legalBasis: rule.legalBasis
        });
      }
    }

    // Add time restrictions
    restrictions.push(...this.evaluateTimeRestrictions(request, rules));

    return restrictions;
  }

  private evaluateCondition(condition: RestrictionCondition, request: AccessRequest): boolean {
    // This would need actual user data to properly evaluate
    // For now, return default behavior based on condition type
    switch (condition.type) {
      case 'age':
        // Would need user's verified age
        return false; // Assume unverified
      case 'verification_status':
        // Would need user's verification status
        return condition.value === 'unverified'; // Assume unverified
      case 'user_type':
        // Would need user's account type
        return false;
      case 'content_rating':
        // Would need content's rating
        return false;
      default:
        return false;
    }
  }

  private evaluateTimeRestrictions(request: AccessRequest, rules: JurisdictionRule): ContentRestriction[] {
    const restrictions: ContentRestriction[] = [];
    const now = new Date();

    for (const timeRestriction of rules.timeRestrictions) {
      if (!timeRestriction.contentTypes.includes(request.contentType)) {
        continue;
      }

      // Check if current time falls within restricted hours
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTime = currentHour * 60 + currentMinute;

      const [startHour, startMinute] = timeRestriction.startTime.split(':').map(Number);
      const [endHour, endMinute] = timeRestriction.endTime.split(':').map(Number);
      const startTime = startHour * 60 + startMinute;
      const endTime = endHour * 60 + endMinute;

      const isRestrictedTime = (startTime <= endTime) 
        ? (currentTime >= startTime && currentTime <= endTime)
        : (currentTime >= startTime || currentTime <= endTime);

      const isRestrictedDay = timeRestriction.daysOfWeek.includes(now.getDay());

      if (isRestrictedTime && isRestrictedDay) {
        restrictions.push({
          type: 'time_restriction',
          severity: 'block',
          message: `Content access is restricted between ${timeRestriction.startTime} and ${timeRestriction.endTime}`,
          jurisdiction: rules.jurisdiction,
          legalBasis: 'Time-based content restrictions',
          expiresAt: this.calculateNextAllowedTime(timeRestriction, now)
        });
      }
    }

    return restrictions;
  }

  private mapActionToRestrictionType(action: string): ContentRestriction['type'] {
    switch (action) {
      case 'block': return 'geo_block';
      case 'age_gate': return 'age_gate';
      case 'warning': return 'content_warning';
      default: return 'content_warning';
    }
  }

  private generateRestrictionMessage(rule: ContentRestrictionRule): string {
    switch (rule.action) {
      case 'block':
        return 'This content is not available in your region';
      case 'age_gate':
        return 'Age verification required to access this content';
      case 'warning':
        return 'This content may not be suitable for all audiences';
      default:
        return 'Content access restrictions apply';
    }
  }

  private generateWarnings(request: AccessRequest, rules: JurisdictionRule): string[] {
    const warnings: string[] = [];

    if (rules.ageRequirements.length > 0) {
      const minAge = Math.max(...rules.ageRequirements.map(req => req.minimumAge));
      warnings.push(`Content restricted to users ${minAge} years and older`);
    }

    if (rules.timeRestrictions.length > 0) {
      warnings.push('Time-based content restrictions may apply');
    }

    if (rules.paymentRestrictions.some(pr => pr.blockedMethods.includes('all'))) {
      warnings.push('Payment processing not available in this region');
    }

    return warnings;
  }

  private generateAppealOptions(rules: JurisdictionRule): AppealOption[] {
    const options: AppealOption[] = [];

    // Add age verification if required
    if (rules.ageRequirements.some(req => req.verificationRequired)) {
      options.push({
        type: 'age_verification',
        description: 'Complete age verification to access content',
        url: '/verify-age'
      });
    }

    // Add legal contact if available
    const legalContact = rules.legalContacts.find(contact => contact.type === 'appeals' || contact.type === 'compliance');
    if (legalContact) {
      options.push({
        type: 'legal_contact',
        description: 'Contact our legal team for assistance',
        url: `mailto:${legalContact.email}`
      });
    }

    // Always offer manual review
    options.push({
      type: 'manual_review',
      description: 'Request manual review of this decision',
      url: '/appeal-restriction'
    });

    return options;
  }

  private calculateNextAllowedTime(timeRestriction: TimeRestriction, now: Date): Date {
    const nextAllowed = new Date(now);
    const [endHour, endMinute] = timeRestriction.endTime.split(':').map(Number);
    
    nextAllowed.setHours(endHour, endMinute, 0, 0);
    
    // If end time is tomorrow, add a day
    if (nextAllowed <= now) {
      nextAllowed.setDate(nextAllowed.getDate() + 1);
    }
    
    return nextAllowed;
  }

  /**
   * Update jurisdiction rules (for admin use)
   */
  async updateJurisdictionRules(jurisdiction: string, rules: JurisdictionRule): Promise<void> {
    rules.lastUpdated = new Date();
    this.jurisdictionRules.set(jurisdiction, rules);
    logger.info(`Updated rules for jurisdiction ${jurisdiction}`);
  }

  /**
   * Get all supported jurisdictions
   */
  getSupportedJurisdictions(): string[] {
    return Array.from(this.jurisdictionRules.keys());
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(jurisdiction: string, startDate: Date, endDate: Date): Promise<any> {
    const rules = this.jurisdictionRules.get(jurisdiction);
    if (!rules) {
      throw new Error(`No rules found for jurisdiction: ${jurisdiction}`);
    }

    return {
      jurisdiction,
      period: { startDate, endDate },
      rules: {
        contentRestrictions: rules.contentRestrictions.length,
        ageRequirements: rules.ageRequirements,
        timeRestrictions: rules.timeRestrictions.length,
        paymentRestrictions: rules.paymentRestrictions.length
      },
      lastUpdated: rules.lastUpdated,
      legalContacts: rules.legalContacts
    };
  }
}