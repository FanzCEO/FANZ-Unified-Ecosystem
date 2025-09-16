import { logger } from '../utils/logger';
import { JurisdictionRequirements } from '../models/JurisdictionRequirements';
import { VerificationProvider } from '../providers/VerificationProvider';
import { JumioProvider } from '../providers/JumioProvider';
import { OnfidoProvider } from '../providers/OnfidoProvider';
import { AcuantProvider } from '../providers/AcuantProvider';
import { IDologyProvider } from '../providers/IDologyProvider';
import { ShuftiProProvider } from '../providers/ShuftiProProvider';

export interface AgeVerificationRequest {
  userId: string;
  jurisdiction: string;
  ipAddress: string;
  userAgent?: string;
  documents?: IdentityDocument[];
  phoneNumber?: string;
  dateOfBirth?: Date;
  fullName?: string;
}

export interface IdentityDocument {
  type: 'passport' | 'drivers_license' | 'national_id' | 'government_id';
  country: string;
  images: DocumentImage[];
  extractedData?: ExtractedDocumentData;
}

export interface DocumentImage {
  type: 'front' | 'back' | 'selfie';
  imageData: string; // base64 encoded
  format: 'jpeg' | 'png' | 'pdf';
}

export interface ExtractedDocumentData {
  documentNumber: string;
  fullName: string;
  dateOfBirth: Date;
  expirationDate?: Date;
  issuingAuthority?: string;
  address?: string;
}

export interface AgeVerificationResult {
  userId: string;
  isVerified: boolean;
  ageVerified: boolean;
  estimatedAge?: number;
  verificationLevel: VerificationLevel;
  providerResults: ProviderVerificationResult[];
  jurisdiction: string;
  verificationDate: Date;
  expirationDate: Date;
  complianceFlags: ComplianceFlag[];
  auditTrail: AuditEntry[];
  riskScore: number;
  recommendations: string[];
}

export interface ProviderVerificationResult {
  providerId: string;
  success: boolean;
  ageVerified: boolean;
  confidenceScore: number;
  extractedAge?: number;
  documentValidated?: boolean;
  biometricMatch?: boolean;
  livenessPassed?: boolean;
  errorCode?: string;
  errorMessage?: string;
  processingTime: number;
}

export interface ComplianceFlag {
  type: 'warning' | 'error' | 'info';
  code: string;
  message: string;
  jurisdiction: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface AuditEntry {
  timestamp: Date;
  action: string;
  userId: string;
  providerId?: string;
  details: any;
  ipAddress: string;
  userAgent?: string;
}

export enum VerificationLevel {
  NONE = 0,
  BASIC = 1,        // Simple age check
  STANDARD = 2,     // ID document verification
  ENHANCED = 3,     // ID + biometric verification
  PREMIUM = 4,      // Multiple methods + ongoing monitoring
}

/**
 * Comprehensive age verification service supporting multiple jurisdictions
 * and verification methods to ensure compliance with adult content laws
 */
export class AgeVerificationService {
  private providers: Map<string, VerificationProvider> = new Map();
  private jurisdictionRequirements: Map<string, JurisdictionRequirements> = new Map();

  constructor() {
    this.initializeProviders();
    this.loadJurisdictionRequirements();
  }

  private initializeProviders(): void {
    // Initialize verification providers
    this.providers.set('jumio', new JumioProvider());
    this.providers.set('onfido', new OnfidoProvider());
    this.providers.set('acuant', new AcuantProvider());
    this.providers.set('idology', new IDologyProvider());
    this.providers.set('shufti_pro', new ShuftiProProvider());

    logger.info('Age verification providers initialized');
  }

  private loadJurisdictionRequirements(): void {
    // Load jurisdiction-specific requirements
    const requirements = [
      // United States - Federal
      {
        jurisdiction: 'US',
        minimumAge: 18,
        verificationLevel: VerificationLevel.ENHANCED,
        requiredMethods: ['government_id', 'selfie'],
        acceptedDocuments: ['passport', 'drivers_license', 'national_id'],
        retentionPeriod: 2557, // 7 years in days for USC 2257
        additionalChecks: ['liveness_detection', 'document_authentication'],
        complianceStandards: ['USC_2257', 'COPPA'],
      },
      // California - CCPA/CPRA
      {
        jurisdiction: 'US-CA',
        minimumAge: 18,
        verificationLevel: VerificationLevel.PREMIUM,
        requiredMethods: ['government_id', 'selfie', 'biometric'],
        acceptedDocuments: ['passport', 'drivers_license', 'california_id'],
        retentionPeriod: 2557,
        additionalChecks: ['liveness_detection', 'document_authentication', 'background_check'],
        complianceStandards: ['USC_2257', 'CCPA', 'CPRA'],
        privacyEnhanced: true,
      },
      // Texas - HB 1181
      {
        jurisdiction: 'US-TX',
        minimumAge: 18,
        verificationLevel: VerificationLevel.ENHANCED,
        requiredMethods: ['government_id', 'age_estimation'],
        acceptedDocuments: ['passport', 'drivers_license', 'texas_id'],
        retentionPeriod: 2557,
        additionalChecks: ['document_authentication', 'digital_id_verification'],
        complianceStandards: ['USC_2257', 'TX_HB_1181'],
        mandatoryWarnings: true,
      },
      // Louisiana - Act 440
      {
        jurisdiction: 'US-LA',
        minimumAge: 18,
        verificationLevel: VerificationLevel.STANDARD,
        requiredMethods: ['government_id'],
        acceptedDocuments: ['passport', 'drivers_license', 'louisiana_id'],
        retentionPeriod: 2557,
        additionalChecks: ['document_authentication'],
        complianceStandards: ['USC_2257', 'LA_ACT_440'],
        ageGatingRequired: true,
      },
      // European Union - GDPR
      {
        jurisdiction: 'EU',
        minimumAge: 18,
        verificationLevel: VerificationLevel.STANDARD,
        requiredMethods: ['government_id'],
        acceptedDocuments: ['passport', 'national_id', 'eu_id'],
        retentionPeriod: 1095, // 3 years max under GDPR
        additionalChecks: ['document_authentication'],
        complianceStandards: ['GDPR', 'DSA', 'AVMSD'],
        dataMinimization: true,
        rightToErasure: true,
      },
      // Germany - JMStV
      {
        jurisdiction: 'DE',
        minimumAge: 18,
        verificationLevel: VerificationLevel.ENHANCED,
        requiredMethods: ['government_id', 'eid_verification'],
        acceptedDocuments: ['passport', 'personalausweis', 'eu_id'],
        retentionPeriod: 1095,
        additionalChecks: ['document_authentication', 'eid_validation'],
        complianceStandards: ['GDPR', 'JMStV', 'BDSG'],
        germanSpecificAuth: true,
      },
      // United Kingdom - Age Verification
      {
        jurisdiction: 'GB',
        minimumAge: 18,
        verificationLevel: VerificationLevel.ENHANCED,
        requiredMethods: ['government_id', 'credit_check'],
        acceptedDocuments: ['passport', 'driving_licence', 'national_insurance'],
        retentionPeriod: 2190, // 6 years
        additionalChecks: ['document_authentication', 'credit_verification'],
        complianceStandards: ['UK_GDPR', 'AGE_VERIFICATION_ACT'],
        bbfcCompliance: true,
      },
      // Australia - eSafety Commissioner
      {
        jurisdiction: 'AU',
        minimumAge: 18,
        verificationLevel: VerificationLevel.STANDARD,
        requiredMethods: ['government_id'],
        acceptedDocuments: ['passport', 'drivers_licence', 'proof_of_age'],
        retentionPeriod: 2555, // 7 years
        additionalChecks: ['document_authentication'],
        complianceStandards: ['PRIVACY_ACT', 'ESAFETY_REQUIREMENTS'],
      },
    ];

    requirements.forEach(req => {
      this.jurisdictionRequirements.set(req.jurisdiction, req as JurisdictionRequirements);
    });

    logger.info(`Loaded ${requirements.length} jurisdiction requirements`);
  }

  /**
   * Verify user age based on jurisdiction requirements
   */
  async verifyAge(request: AgeVerificationRequest): Promise<AgeVerificationResult> {
    const startTime = Date.now();
    
    try {
      logger.info(`Starting age verification for user ${request.userId} in jurisdiction ${request.jurisdiction}`);

      // Get jurisdiction requirements
      const requirements = this.getJurisdictionRequirements(request.jurisdiction);
      if (!requirements) {
        throw new Error(`No requirements found for jurisdiction: ${request.jurisdiction}`);
      }

      // Validate request meets minimum requirements
      this.validateRequest(request, requirements);

      // Perform verification with multiple providers
      const providerResults = await this.runProviderVerifications(request, requirements);

      // Evaluate results and generate final decision
      const result = this.evaluateVerificationResults(
        request,
        requirements,
        providerResults,
        Date.now() - startTime
      );

      // Store audit trail
      await this.storeAuditEntry({
        timestamp: new Date(),
        action: 'age_verification_completed',
        userId: request.userId,
        details: {
          jurisdiction: request.jurisdiction,
          verificationLevel: result.verificationLevel,
          isVerified: result.isVerified,
          riskScore: result.riskScore,
        },
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
      });

      logger.info(`Age verification completed for user ${request.userId}: ${result.isVerified ? 'VERIFIED' : 'REJECTED'}`);

      return result;
    } catch (error) {
      logger.error(`Age verification failed for user ${request.userId}:`, error);
      
      return {
        userId: request.userId,
        isVerified: false,
        ageVerified: false,
        verificationLevel: VerificationLevel.NONE,
        providerResults: [],
        jurisdiction: request.jurisdiction,
        verificationDate: new Date(),
        expirationDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        complianceFlags: [{
          type: 'error',
          code: 'VERIFICATION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
          jurisdiction: request.jurisdiction,
          severity: 'critical',
        }],
        auditTrail: [],
        riskScore: 100, // Maximum risk
        recommendations: ['Contact support for manual verification'],
      };
    }
  }

  private getJurisdictionRequirements(jurisdiction: string): JurisdictionRequirements | undefined {
    // Try exact match first
    let requirements = this.jurisdictionRequirements.get(jurisdiction);
    
    // If not found, try parent jurisdiction (e.g., US-CA -> US)
    if (!requirements && jurisdiction.includes('-')) {
      const parentJurisdiction = jurisdiction.split('-')[0];
      requirements = this.jurisdictionRequirements.get(parentJurisdiction);
    }
    
    // Default to US requirements if nothing found
    if (!requirements) {
      requirements = this.jurisdictionRequirements.get('US');
    }

    return requirements;
  }

  private validateRequest(request: AgeVerificationRequest, requirements: JurisdictionRequirements): void {
    if (!request.userId) {
      throw new Error('User ID is required');
    }

    if (!request.jurisdiction) {
      throw new Error('Jurisdiction is required');
    }

    if (!request.ipAddress) {
      throw new Error('IP address is required for geo-verification');
    }

    // Check if required documents are provided
    if (requirements.requiredMethods.includes('government_id') && (!request.documents || request.documents.length === 0)) {
      throw new Error('Government ID document is required for this jurisdiction');
    }

    // Validate document types
    if (request.documents) {
      for (const doc of request.documents) {
        if (!requirements.acceptedDocuments.includes(doc.type)) {
          throw new Error(`Document type ${doc.type} is not accepted in jurisdiction ${request.jurisdiction}`);
        }
      }
    }
  }

  private async runProviderVerifications(
    request: AgeVerificationRequest,
    requirements: JurisdictionRequirements
  ): Promise<ProviderVerificationResult[]> {
    const results: ProviderVerificationResult[] = [];
    const providers = this.selectProviders(requirements);

    // Run verifications in parallel for speed
    const verificationPromises = providers.map(async (providerId) => {
      const provider = this.providers.get(providerId);
      if (!provider) {
        logger.warn(`Provider ${providerId} not available`);
        return null;
      }

      try {
        const startTime = Date.now();
        const result = await provider.verifyAge({
          userId: request.userId,
          documents: request.documents || [],
          jurisdiction: request.jurisdiction,
          requirements: requirements,
        });

        return {
          providerId,
          success: result.success,
          ageVerified: result.ageVerified,
          confidenceScore: result.confidenceScore,
          extractedAge: result.extractedAge,
          documentValidated: result.documentValidated,
          biometricMatch: result.biometricMatch,
          livenessPassed: result.livenessPassed,
          errorCode: result.errorCode,
          errorMessage: result.errorMessage,
          processingTime: Date.now() - startTime,
        };
      } catch (error) {
        logger.error(`Provider ${providerId} verification failed:`, error);
        return {
          providerId,
          success: false,
          ageVerified: false,
          confidenceScore: 0,
          errorCode: 'PROVIDER_ERROR',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          processingTime: Date.now() - Date.now(),
        };
      }
    });

    const providerResults = await Promise.all(verificationPromises);
    
    // Filter out null results and add to results array
    providerResults.forEach(result => {
      if (result) {
        results.push(result);
      }
    });

    return results;
  }

  private selectProviders(requirements: JurisdictionRequirements): string[] {
    const providers: string[] = [];

    // Select providers based on jurisdiction and requirements
    switch (requirements.jurisdiction) {
      case 'US':
      case 'US-CA':
      case 'US-TX':
      case 'US-LA':
        providers.push('jumio', 'onfido', 'acuant'); // US-focused providers
        break;
      case 'EU':
      case 'DE':
      case 'GB':
        providers.push('onfido', 'jumio', 'shufti_pro'); // EU-compliant providers
        break;
      case 'AU':
        providers.push('onfido', 'shufti_pro'); // Global providers with AU support
        break;
      default:
        providers.push('onfido', 'shufti_pro'); // Global fallback
    }

    // Always include at least one knowledge-based provider
    if (requirements.additionalChecks?.includes('background_check')) {
      providers.push('idology');
    }

    return providers;
  }

  private evaluateVerificationResults(
    request: AgeVerificationRequest,
    requirements: JurisdictionRequirements,
    providerResults: ProviderVerificationResult[],
    processingTime: number
  ): AgeVerificationResult {
    const complianceFlags: ComplianceFlag[] = [];
    const auditTrail: AuditEntry[] = [];
    let riskScore = 0;
    let isVerified = false;
    let ageVerified = false;
    let estimatedAge: number | undefined;

    // Analyze provider results
    const successfulResults = providerResults.filter(r => r.success && r.ageVerified);
    const verifiedCount = successfulResults.length;
    const totalCount = providerResults.length;

    if (verifiedCount === 0) {
      riskScore = 100;
      complianceFlags.push({
        type: 'error',
        code: 'NO_SUCCESSFUL_VERIFICATION',
        message: 'No provider successfully verified user age',
        jurisdiction: request.jurisdiction,
        severity: 'critical',
      });
    } else if (verifiedCount < totalCount / 2) {
      riskScore = 75;
      complianceFlags.push({
        type: 'warning',
        code: 'LOW_CONFIDENCE_VERIFICATION',
        message: 'Less than half of providers verified user age',
        jurisdiction: request.jurisdiction,
        severity: 'high',
      });
    } else {
      riskScore = Math.max(0, 50 - (verifiedCount * 10));
      isVerified = true;
      ageVerified = true;
      
      // Calculate estimated age from successful verifications
      const ages = successfulResults
        .map(r => r.extractedAge)
        .filter(age => age !== undefined) as number[];
      
      if (ages.length > 0) {
        estimatedAge = Math.round(ages.reduce((a, b) => a + b, 0) / ages.length);
      }
    }

    // Check minimum age requirement
    if (estimatedAge && estimatedAge < requirements.minimumAge) {
      isVerified = false;
      ageVerified = false;
      riskScore = 100;
      complianceFlags.push({
        type: 'error',
        code: 'UNDER_MINIMUM_AGE',
        message: `User age ${estimatedAge} is below minimum age ${requirements.minimumAge}`,
        jurisdiction: request.jurisdiction,
        severity: 'critical',
      });
    }

    // Determine verification level achieved
    let verificationLevel = VerificationLevel.NONE;
    if (isVerified) {
      const hasDocument = successfulResults.some(r => r.documentValidated);
      const hasBiometric = successfulResults.some(r => r.biometricMatch);
      const hasLiveness = successfulResults.some(r => r.livenessPassed);

      if (hasDocument && hasBiometric && hasLiveness) {
        verificationLevel = VerificationLevel.PREMIUM;
      } else if (hasDocument && hasBiometric) {
        verificationLevel = VerificationLevel.ENHANCED;
      } else if (hasDocument) {
        verificationLevel = VerificationLevel.STANDARD;
      } else {
        verificationLevel = VerificationLevel.BASIC;
      }
    }

    // Check if verification level meets requirements
    if (verificationLevel < requirements.verificationLevel) {
      isVerified = false;
      complianceFlags.push({
        type: 'error',
        code: 'INSUFFICIENT_VERIFICATION_LEVEL',
        message: `Verification level ${verificationLevel} does not meet requirement ${requirements.verificationLevel}`,
        jurisdiction: request.jurisdiction,
        severity: 'high',
      });
    }

    // Generate recommendations
    const recommendations: string[] = [];
    if (!isVerified) {
      recommendations.push('Provide additional identity documents');
      recommendations.push('Ensure documents are clear and readable');
      recommendations.push('Complete biometric verification if required');
    }

    if (riskScore > 50) {
      recommendations.push('Consider manual review');
      recommendations.push('Request additional verification methods');
    }

    // Set expiration date based on jurisdiction requirements
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + (isVerified ? 365 : 1)); // 1 year if verified, 1 day if not

    return {
      userId: request.userId,
      isVerified,
      ageVerified,
      estimatedAge,
      verificationLevel,
      providerResults,
      jurisdiction: request.jurisdiction,
      verificationDate: new Date(),
      expirationDate,
      complianceFlags,
      auditTrail,
      riskScore,
      recommendations,
    };
  }

  private async storeAuditEntry(entry: AuditEntry): Promise<void> {
    try {
      // Store in database or audit log system
      logger.info('Audit entry stored:', {
        userId: entry.userId,
        action: entry.action,
        timestamp: entry.timestamp,
      });
    } catch (error) {
      logger.error('Failed to store audit entry:', error);
    }
  }

  /**
   * Get verification status for a user
   */
  async getVerificationStatus(userId: string): Promise<AgeVerificationResult | null> {
    // Implementation would retrieve from database
    logger.info(`Retrieving verification status for user ${userId}`);
    return null; // Placeholder
  }

  /**
   * Renew expired verification
   */
  async renewVerification(userId: string, jurisdiction: string): Promise<AgeVerificationResult> {
    logger.info(`Renewing verification for user ${userId} in jurisdiction ${jurisdiction}`);
    
    // Get existing verification data
    const existingVerification = await this.getVerificationStatus(userId);
    
    // Create renewal request with minimal data
    const renewalRequest: AgeVerificationRequest = {
      userId,
      jurisdiction,
      ipAddress: 'renewal', // Special flag for renewals
    };

    return this.verifyAge(renewalRequest);
  }

  /**
   * Generate compliance report for jurisdiction
   */
  async generateComplianceReport(jurisdiction: string, startDate: Date, endDate: Date): Promise<any> {
    logger.info(`Generating compliance report for jurisdiction ${jurisdiction}`);
    
    return {
      jurisdiction,
      period: { startDate, endDate },
      totalVerifications: 0,
      successfulVerifications: 0,
      failedVerifications: 0,
      averageProcessingTime: 0,
      complianceFlags: [],
      recommendations: [],
    };
  }
}