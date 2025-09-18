import { Request, Response, NextFunction } from 'express';
import { PaymentRequest as BasePaymentRequest, PayoutRequest as BasePayoutRequest } from '..REDACTED_AWS_SECRET_KEYPaymentProcessor';
import { logger } from '../utils/logger';
import crypto from 'crypto';

// Extended interfaces for compliance validation
interface PaymentRequest extends BasePaymentRequest {
  transactionId?: string;
  contentType?: 'adult' | 'general';
  transactionType?: 'one_time' | 'subscription' | 'tip';
}

interface PayoutRequest extends BasePayoutRequest {
  payoutId?: string;
}

interface AgeVerificationResult {
  verified: boolean;
  method: 'government_id' | 'credit_card' | 'third_party' | 'none';
  verificationId?: string;
  age?: number;
  verifiedAt?: Date;
  expiresAt?: Date;
}

interface RiskAssessmentResult {
  riskScore: number; // 0-100, higher = more risky
  riskLevel: 'low' | 'medium' | 'high' | 'very_high';
  factors: string[];
  recommendations: string[];
  requiresManualReview: boolean;
  blockedCountries?: string[];
  deviceFingerprint?: string;
}

interface ComplianceCheckResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
  ageVerification: AgeVerificationResult;
  riskAssessment: RiskAssessmentResult;
  contentCompliance: {
    isAdultContent: boolean;
    contentCategory?: string;
    requires2257Compliance: boolean;
    performerAgeVerified?: boolean;
  };
  metadata: Record<string, any>;
}

interface ComplianceConfig {
  ageVerificationRequired: boolean;
  minimumAge: number;
  blockedCountries: string[];
  riskThresholds: {
    low: number;
    medium: number;
    high: number;
  };
  contentCategories: {
    [key: string]: {
      requires2257: boolean;
      minimumAge: number;
      additionalRestrictions?: string[];
    };
  };
}

export class ComplianceValidationService {
  private config: ComplianceConfig;

  constructor() {
    this.initializeConfig();
  }

  /**
   * Validate payment compliance before processing
   */
  async validatePaymentCompliance(
    request: PaymentRequest,
    userInfo: any
  ): Promise<ComplianceCheckResult> {
    logger.info('Starting payment compliance validation', {
      transactionId: request.transactionId,
      amount: request.amount,
      contentType: request.contentType
    });

    const result: ComplianceCheckResult = {
      passed: false,
      errors: [],
      warnings: [],
      ageVerification: { verified: false, method: 'none' },
      riskAssessment: {
        riskScore: 0,
        riskLevel: 'low',
        factors: [],
        recommendations: [],
        requiresManualReview: false
      },
      contentCompliance: {
        isAdultContent: request.contentType === 'adult',
        requires2257Compliance: false,
        performerAgeVerified: false
      },
      metadata: {}
    };

    try {
      // 1. Age Verification Check
      result.ageVerification = await this.performAgeVerification(userInfo, request);
      if (!result.ageVerification.verified && this.requiresAgeVerification(request)) {
        result.errors.push('Age verification required for adult content purchases');
      }

      // 2. Content Compliance Check
      result.contentCompliance = await this.validateContentCompliance(request, userInfo);
      if (result.contentCompliance.requires2257Compliance && !result.contentCompliance.performerAgeVerified) {
        result.errors.push('2257 compliance documentation required');
      }

      // 3. Risk Assessment
      result.riskAssessment = await this.performRiskAssessment(request, userInfo);
      if (result.riskAssessment.riskLevel === 'very_high') {
        result.errors.push('Transaction blocked due to high risk score');
      } else if (result.riskAssessment.requiresManualReview) {
        result.warnings.push('Transaction requires manual review');
      }

      // 4. Geographic Compliance Check
      const geoCompliance = await this.validateGeographicCompliance(request, userInfo);
      if (!geoCompliance.allowed) {
        result.errors.push(`Transactions not allowed from ${userInfo.country}: ${geoCompliance.reason}`);
      }

      // 5. Transaction Limits Check
      const limitsCheck = await this.validateTransactionLimits(request, userInfo);
      if (!limitsCheck.allowed) {
        result.errors.push(`Transaction exceeds limits: ${limitsCheck.reason}`);
      }

      // Final compliance determination
      result.passed = result.errors.length === 0;

      logger.info('Compliance validation completed', {
        transactionId: request.transactionId,
        passed: result.passed,
        errors: result.errors.length,
        warnings: result.warnings.length,
        riskLevel: result.riskAssessment.riskLevel
      });

      return result;

    } catch (error) {
      logger.error('Compliance validation failed', { error, transactionId: request.transactionId });
      result.errors.push('Compliance validation system error');
      return result;
    }
  }

  /**
   * Validate payout compliance for creator payments
   */
  async validatePayoutCompliance(
    request: PayoutRequest,
    creatorInfo: any
  ): Promise<ComplianceCheckResult> {
    logger.info('Starting payout compliance validation', {
      payoutId: request.payoutId,
      amount: request.amount,
      recipientCountry: creatorInfo.country
    });

    const result: ComplianceCheckResult = {
      passed: false,
      errors: [],
      warnings: [],
      ageVerification: { verified: false, method: 'none' },
      riskAssessment: {
        riskScore: 0,
        riskLevel: 'low',
        factors: [],
        recommendations: [],
        requiresManualReview: false
      },
      contentCompliance: {
        isAdultContent: true, // Assume adult content for creator payouts
        requires2257Compliance: true,
        performerAgeVerified: false
      },
      metadata: {}
    };

    try {
      // 1. Creator Age Verification (Required for adult content)
      result.ageVerification = await this.performCreatorAgeVerification(creatorInfo);
      if (!result.ageVerification.verified) {
        result.errors.push('Creator age verification required for payouts');
      }

      // 2. 2257 Compliance Check
      const has2257Documentation = await this.verify2257Compliance(creatorInfo);
      result.contentCompliance.performerAgeVerified = has2257Documentation;
      if (!has2257Documentation) {
        result.errors.push('2257 record keeping compliance documentation required');
      }

      // 3. Tax Compliance Check
      const taxCompliance = await this.validateTaxCompliance(creatorInfo, request);
      if (!taxCompliance.compliant) {
        result.errors.push(`Tax compliance issue: ${taxCompliance.reason}`);
      }

      // 4. Payout Destination Validation
      const destinationValidation = await this.validatePayoutDestination(request, creatorInfo);
      if (!destinationValidation.valid) {
        result.errors.push(`Invalid payout destination: ${destinationValidation.reason}`);
      }

      // 5. Anti-Money Laundering (AML) Check
      const amlCheck = await this.performAMLCheck(creatorInfo, request);
      if (!amlCheck.passed) {
        result.errors.push('AML compliance check failed');
      }

      result.passed = result.errors.length === 0;

      logger.info('Payout compliance validation completed', {
        payoutId: request.payoutId,
        passed: result.passed,
        errors: result.errors.length
      });

      return result;

    } catch (error) {
      logger.error('Payout compliance validation failed', { error, payoutId: request.payoutId });
      result.errors.push('Payout compliance validation system error');
      return result;
    }
  }

  // Private methods for individual compliance checks

  private async performAgeVerification(userInfo: any, request: PaymentRequest): Promise<AgeVerificationResult> {
    // Check if user has existing age verification
    if (userInfo.ageVerified && userInfo.ageVerifiedAt) {
      const verificationAge = Math.floor(
        (Date.now() - new Date(userInfo.ageVerifiedAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // Age verification expires after 365 days
      if (verificationAge < 365) {
        return {
          verified: true,
          method: userInfo.ageVerificationMethod || 'credit_card',
          verificationId: userInfo.ageVerificationId,
          age: userInfo.age,
          verifiedAt: new Date(userInfo.ageVerifiedAt),
          expiresAt: new Date(Date.now() + (365 - verificationAge) * 24 * 60 * 60 * 1000)
        };
      }
    }

    // For credit card payments, the payment method itself provides age verification
    if (request.paymentMethod?.type === 'credit_card') {
      return {
        verified: true,
        method: 'credit_card',
        verificationId: `cc_${Date.now()}`,
        verifiedAt: new Date()
      };
    }

    return {
      verified: false,
      method: 'none'
    };
  }

  private async performCreatorAgeVerification(creatorInfo: any): Promise<AgeVerificationResult> {
    // Creators must have government ID verification
    if (creatorInfo.idVerified && creatorInfo.age && creatorInfo.age >= 18) {
      return {
        verified: true,
        method: 'government_id',
        verificationId: creatorInfo.idVerificationId,
        age: creatorInfo.age,
        verifiedAt: new Date(creatorInfo.idVerifiedAt)
      };
    }

    return {
      verified: false,
      method: 'none'
    };
  }

  private async performRiskAssessment(request: PaymentRequest, userInfo: any): Promise<RiskAssessmentResult> {
    let riskScore = 0;
    const factors: string[] = [];
    const recommendations: string[] = [];

    // Country risk assessment
    const highRiskCountries = ['COUNTRY1', 'COUNTRY2']; // Replace with actual list
    if (highRiskCountries.includes(userInfo.country)) {
      riskScore += 30;
      factors.push('High-risk country');
    }

    // Transaction amount assessment
    if (request.amount > 500) {
      riskScore += 20;
      factors.push('High transaction amount');
    }

    // Velocity check (multiple transactions in short period)
    const recentTransactions = await this.getRecentTransactionCount(userInfo.id);
    if (recentTransactions > 5) {
      riskScore += 25;
      factors.push('High transaction velocity');
    }

    // New account risk
    const accountAge = Math.floor(
      (Date.now() - new Date(userInfo.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (accountAge < 7) {
      riskScore += 15;
      factors.push('New account');
    }

    // Device fingerprinting (simplified)
    const deviceFingerprint = this.generateDeviceFingerprint(request);
    const suspiciousDevice = await this.checkDeviceReputation(deviceFingerprint);
    if (suspiciousDevice) {
      riskScore += 35;
      factors.push('Suspicious device signature');
    }

    // Payment method risk
    if (request.paymentMethod?.type === 'prepaid_card') {
      riskScore += 10;
      factors.push('Prepaid payment method');
    }

    // Determine risk level
    let riskLevel: RiskAssessmentResult['riskLevel'] = 'low';
    let requiresManualReview = false;

    if (riskScore >= this.config.riskThresholds.high) {
      riskLevel = 'very_high';
      requiresManualReview = true;
      recommendations.push('Block transaction and require manual review');
    } else if (riskScore >= this.config.riskThresholds.medium) {
      riskLevel = 'high';
      requiresManualReview = true;
      recommendations.push('Require manual review before processing');
    } else if (riskScore >= this.config.riskThresholds.low) {
      riskLevel = 'medium';
      recommendations.push('Additional verification recommended');
    } else {
      recommendations.push('Normal processing');
    }

    return {
      riskScore,
      riskLevel,
      factors,
      recommendations,
      requiresManualReview,
      deviceFingerprint
    };
  }

  private async validateContentCompliance(request: PaymentRequest, userInfo: any) {
    const isAdultContent = request.contentType === 'adult';
    const contentCategory = request.metadata?.contentCategory || 'general';
    
    let requires2257Compliance = false;
    let performerAgeVerified = false;

    if (isAdultContent) {
      const categoryConfig = this.config.contentCategories[contentCategory];
      requires2257Compliance = categoryConfig?.requires2257 || true;

      // Check if performer age verification is documented
      if (request.metadata?.performerId) {
        performerAgeVerified = await this.checkPerformerAgeVerification(request.metadata.performerId);
      }
    }

    return {
      isAdultContent,
      contentCategory,
      requires2257Compliance,
      performerAgeVerified
    };
  }

  private async validateGeographicCompliance(request: PaymentRequest, userInfo: any) {
    const userCountry = userInfo.country || 'US';
    
    if (this.config.blockedCountries.includes(userCountry)) {
      return {
        allowed: false,
        reason: 'Country blocked for adult content transactions'
      };
    }

    // Additional geographic restrictions could be added here
    return {
      allowed: true,
      reason: 'Geographic compliance passed'
    };
  }

  private async validateTransactionLimits(request: PaymentRequest, userInfo: any) {
    // Daily transaction limit
    const dailyTotal = await this.getDailyTransactionTotal(userInfo.id);
    const dailyLimit = userInfo.verificationLevel === 'premium' ? 5000 : 1000;

    if (dailyTotal + request.amount > dailyLimit) {
      return {
        allowed: false,
        reason: `Daily transaction limit exceeded (${dailyLimit})`
      };
    }

    // Single transaction limit
    const maxSingleTransaction = userInfo.verificationLevel === 'premium' ? 2000 : 500;
    if (request.amount > maxSingleTransaction) {
      return {
        allowed: false,
        reason: `Single transaction limit exceeded (${maxSingleTransaction})`
      };
    }

    return {
      allowed: true,
      reason: 'Transaction limits passed'
    };
  }

  private async verify2257Compliance(creatorInfo: any): Promise<boolean> {
    // Check if creator has uploaded 2257 documentation
    return !!(creatorInfo.compliance2257Verified && creatorInfo.compliance2257ExpiresAt > new Date());
  }

  private async validateTaxCompliance(creatorInfo: any, request: PayoutRequest) {
    // Check if tax forms are on file
    const hasTaxDocumentation = !!(creatorInfo.taxFormOnFile && 
                                   (creatorInfo.taxFormType === 'W9' || creatorInfo.taxFormType === 'W8'));

    if (!hasTaxDocumentation && request.amount > 600) {
      return {
        compliant: false,
        reason: 'Tax form required for payouts over $600'
      };
    }

    return {
      compliant: true,
      reason: 'Tax compliance verified'
    };
  }

  private async validatePayoutDestination(request: PayoutRequest, creatorInfo: any) {
    // Validate that payout destination belongs to the creator
    const destinationType = request.destination.type;
    const destinationDetails = request.destination.details;

    switch (destinationType) {
      case 'bank_transfer':
        // Verify bank account ownership
        if (!destinationDetails?.accountName || 
            !this.namesMatch(destinationDetails.accountName, creatorInfo.fullName)) {
          return {
            valid: false,
            reason: 'Bank account name does not match creator name'
          };
        }
        break;

      case 'paxum_ewallet':
        // Verify Paxum account email matches creator
        if (!destinationDetails?.email || destinationDetails.email !== creatorInfo.email) {
          return {
            valid: false,
            reason: 'Paxum account email does not match creator account'
          };
        }
        break;

      default:
        return {
          valid: false,
          reason: 'Unsupported payout destination type'
        };
    }

    return {
      valid: true,
      reason: 'Payout destination validated'
    };
  }

  private async performAMLCheck(creatorInfo: any, request: PayoutRequest) {
    // Basic AML checks
    let passed = true;

    // Check against sanctions lists (simplified)
    const isSanctioned = await this.checkSanctionsList(creatorInfo.fullName, creatorInfo.country);
    if (isSanctioned) {
      passed = false;
    }

    // Unusual payout patterns
    const payoutFrequency = await this.getPayoutFrequency(creatorInfo.id);
    if (payoutFrequency > 10) { // More than 10 payouts per month
      passed = false;
    }

    return {
      passed,
      metadata: {
        sanctionsCheck: !isSanctioned,
        payoutFrequency
      }
    };
  }

  // Helper methods

  private requiresAgeVerification(request: PaymentRequest): boolean {
    return this.config.ageVerificationRequired && request.contentType === 'adult';
  }

  private generateDeviceFingerprint(request: PaymentRequest): string {
    const userAgent = request.metadata?.userAgent || '';
    const ipAddress = request.metadata?.ipAddress || '';
    return crypto.createHash('md5').update(`${userAgent}${ipAddress}`).digest('hex');
  }

  private namesMatch(name1: string, name2: string): boolean {
    // Simplified name matching - production should use more sophisticated matching
    const normalize = (name: string) => name.toLowerCase().replace(/[^a-z ]/g, '').trim();
    return normalize(name1) === normalize(name2);
  }

  // Database query helpers (to be implemented with actual DB)
  private async getRecentTransactionCount(userId: string): Promise<number> {
    // Query database for transactions in last 24 hours
    return 0; // Placeholder
  }

  private async checkDeviceReputation(fingerprint: string): Promise<boolean> {
    // Check device fingerprint against reputation database
    return false; // Placeholder
  }

  private async checkPerformerAgeVerification(performerId: string): Promise<boolean> {
    // Check if performer has age verification on file
    return true; // Placeholder
  }

  private async getDailyTransactionTotal(userId: string): Promise<number> {
    // Get sum of transactions for user today
    return 0; // Placeholder
  }

  private async getPayoutFrequency(creatorId: string): Promise<number> {
    // Get payout count for creator this month
    return 0; // Placeholder
  }

  private async checkSanctionsList(name: string, country: string): Promise<boolean> {
    // Check against OFAC and other sanctions lists
    return false; // Placeholder
  }

  private initializeConfig(): void {
    this.config = {
      ageVerificationRequired: true,
      minimumAge: 18,
      blockedCountries: [], // Countries where adult content transactions are not allowed
      riskThresholds: {
        low: 20,
        medium: 40,
        high: 70
      },
      contentCategories: {
        'adult': {
          requires2257: true,
          minimumAge: 18
        },
        'adult_premium': {
          requires2257: true,
          minimumAge: 21,
          additionalRestrictions: ['enhanced_verification']
        },
        'general': {
          requires2257: false,
          minimumAge: 13
        }
      }
    };
  }
}

// Express middleware wrapper
export const complianceValidationMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Attach compliance service to request
  req.complianceService = new ComplianceValidationService();
  next();
};

// Type augmentation for Express Request
declare global {
  namespace Express {
    interface Request {
      complianceService?: ComplianceValidationService;
    }
  }
}