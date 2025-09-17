// 🔞 FANZ Age Verification & Multi-Factor Authentication System
// Comprehensive identity verification for adult content platforms with legal compliance

import crypto from 'crypto';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { Request, Response, NextFunction } from 'express';

interface AgeVerificationRequest {
  userId: string;
  documentType: 'drivers_license' | 'passport' | 'national_id' | 'military_id';
  documentNumber: string;
  documentCountry: string;
  documentState?: string;
  dateOfBirth: string;
  fullName: string;
  documentImages: {
    front: string; // base64 encoded
    back?: string; // base64 encoded
    selfie: string; // base64 encoded for liveness check
  };
  ipAddress: string;
  userAgent: string;
  platform: string;
}

interface AgeVerificationResult {
  verified: boolean;
  confidence: number;
  method: 'document' | 'database' | 'third_party';
  verificationId: string;
  errors?: string[];
  warnings?: string[];
  documentAnalysis?: DocumentAnalysis;
  ageEstimate?: number;
  complianceFlags?: ComplianceFlag[];
}

interface DocumentAnalysis {
  authentic: boolean;
  confidence: number;
  documentType: string;
  extractedData: {
    name: string;
    dateOfBirth: string;
    documentNumber: string;
    expiryDate: string;
    issuingAuthority: string;
  };
  securityFeatures: {
    hologram: boolean;
    watermark: boolean;
    microprint: boolean;
    rfidChip: boolean;
  };
  tampering: {
    detected: boolean;
    areas: string[];
    confidence: number;
  };
}

interface ComplianceFlag {
  type: 'legal' | 'regulatory' | 'platform';
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  jurisdiction: string;
}

interface MFASetup {
  userId: string;
  method: 'totp' | 'sms' | 'email' | 'biometric';
  secret?: string;
  phoneNumber?: string;
  email?: string;
  backupCodes: string[];
  enabled: boolean;
  verifiedAt?: Date;
}

interface MFAChallenge {
  challengeId: string;
  userId: string;
  method: string;
  code: string;
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
  verified: boolean;
}

class FanzAgeVerificationSystem {
  private readonly MINIMUM_AGE = 18;
  private readonly VERIFICATION_EXPIRY_DAYS = 365; // Annual re-verification
  private readonly MFA_CODE_EXPIRY = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_MFA_ATTEMPTS = 3;
  
  // Legal compliance requirements by jurisdiction
  private readonly complianceRequirements = {
    'US': {
      minimumAge: 18,
      documentTypes: ['drivers_license', 'passport', 'military_id'],
      requiresRecordKeeping: true, // 2257 compliance
      recordRetentionYears: 7,
      biometricConsent: true
    },
    'EU': {
      minimumAge: 18,
      documentTypes: ['passport', 'national_id'],
      requiresRecordKeeping: true, // GDPR compliance
      recordRetentionYears: 5,
      biometricConsent: true,
      gdprCompliance: true
    },
    'UK': {
      minimumAge: 18,
      documentTypes: ['passport', 'drivers_license'],
      requiresRecordKeeping: true,
      recordRetentionYears: 6,
      biometricConsent: true
    },
    'CA': {
      minimumAge: 18,
      documentTypes: ['drivers_license', 'passport'],
      requiresRecordKeeping: true,
      recordRetentionYears: 7,
      biometricConsent: true
    }
  };

  // Adult platform specific requirements
  private readonly adultPlatforms = [
    'boyfanz', 'girlfanz', 'daddyfanz', 'pupfanz', 
    'taboofanz', 'transfanz', 'cougarfanz', 'fanzcock'
  ];

  constructor() {
    console.log('🔞 FANZ Age Verification System initialized');
  }

  /**
   * Initiate age verification process
   */
  public async initiateAgeVerification(
    request: AgeVerificationRequest
  ): Promise<{ verificationId: string; challengeUrl?: string }> {
    
    // Generate unique verification ID
    const verificationId = crypto.randomUUID();
    
    // Create verification record
    const verificationRecord = {
      id: verificationId,
      userId: request.userId,
      status: 'pending',
      submittedAt: new Date(),
      documentType: request.documentType,
      platform: request.platform,
      ipAddress: request.ipAddress,
      userAgent: request.userAgent
    };

    console.log(`🔍 Age verification initiated for user ${request.userId}, verification ID: ${verificationId}`);

    // In production, store in secure database
    // await this.storeVerificationRecord(verificationRecord);

    // Process verification asynchronously
    this.processAgeVerification(request, verificationId).catch(error => {
      console.error('Age verification processing error:', error);
    });

    return {
      verificationId,
      challengeUrl: `/age-verification/challenge/${verificationId}`
    };
  }

  /**
   * Process age verification with document analysis
   */
  private async processAgeVerification(
    request: AgeVerificationRequest,
    verificationId: string
  ): Promise<AgeVerificationResult> {
    
    try {
      // Step 1: Document authenticity check
      const documentAnalysis = await this.analyzeDocument(request);
      
      // Step 2: Age calculation from document
      const ageFromDocument = this.calculateAge(documentAnalysis.extractedData.dateOfBirth);
      
      // Step 3: Biometric liveness check
      const livenessCheck = await this.performLivenessCheck(
        request.documentImages.front,
        request.documentImages.selfie
      );

      // Step 4: Compliance validation
      const complianceFlags = await this.validateCompliance(request, ageFromDocument);
      
      // Step 5: Final verification decision
      const verification: AgeVerificationResult = {
        verified: documentAnalysis.authentic && 
                  ageFromDocument >= this.MINIMUM_AGE && 
                  livenessCheck.passed &&
                  complianceFlags.every(flag => flag.severity !== 'critical'),
        confidence: Math.min(
          documentAnalysis.confidence,
          livenessCheck.confidence
        ),
        method: 'document',
        verificationId,
        documentAnalysis,
        ageEstimate: ageFromDocument,
        complianceFlags,
        errors: [],
        warnings: []
      };

      // Add errors for failed checks
      if (!documentAnalysis.authentic) {
        verification.errors?.push('Document authenticity could not be verified');
      }
      
      if (ageFromDocument < this.MINIMUM_AGE) {
        verification.errors?.push(`Age ${ageFromDocument} is below minimum requirement of ${this.MINIMUM_AGE}`);
      }
      
      if (!livenessCheck.passed) {
        verification.errors?.push('Liveness check failed - please ensure you are physically present');
      }

      // Store verification result
      await this.storeVerificationResult(verificationId, verification);

      // Notify user of result
      await this.notifyVerificationResult(request.userId, verification);

      console.log(`✅ Age verification completed for ${verificationId}: ${verification.verified ? 'APPROVED' : 'REJECTED'}`);
      
      return verification;

    } catch (error) {
      console.error(`❌ Age verification failed for ${verificationId}:`, error);
      
      const failedResult: AgeVerificationResult = {
        verified: false,
        confidence: 0,
        method: 'document',
        verificationId,
        errors: [`Verification process failed: ${error.message}`]
      };

      await this.storeVerificationResult(verificationId, failedResult);
      return failedResult;
    }
  }

  /**
   * Analyze document for authenticity and extract data
   */
  private async analyzeDocument(request: AgeVerificationRequest): Promise<DocumentAnalysis> {
    // In production, this would use ML models and OCR services
    // For demo, simulate document analysis
    
    console.log(`🔍 Analyzing ${request.documentType} for user ${request.userId}`);
    
    // Simulate document analysis with realistic confidence scores
    const mockAnalysis: DocumentAnalysis = {
      authentic: true,
      confidence: 0.95,
      documentType: request.documentType,
      extractedData: {
        name: request.fullName,
        dateOfBirth: request.dateOfBirth,
        documentNumber: request.documentNumber,
        expiryDate: '2025-12-31',
        issuingAuthority: request.documentCountry
      },
      securityFeatures: {
        hologram: true,
        watermark: true,
        microprint: true,
        rfidChip: request.documentType === 'passport'
      },
      tampering: {
        detected: false,
        areas: [],
        confidence: 0.98
      }
    };

    return mockAnalysis;
  }

  /**
   * Perform biometric liveness check
   */
  private async performLivenessCheck(
    documentPhoto: string, 
    selfiePhoto: string
  ): Promise<{ passed: boolean; confidence: number }> {
    // In production, this would use facial recognition APIs
    // to ensure the person in the selfie matches the document photo
    // and that they are physically present (not a photo of a photo)
    
    console.log('🤳 Performing biometric liveness check...');
    
    // Simulate liveness check
    return {
      passed: true,
      confidence: 0.92
    };
  }

  /**
   * Calculate age from date of birth
   */
  private calculateAge(dateOfBirth: string): number {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Validate legal and regulatory compliance
   */
  private async validateCompliance(
    request: AgeVerificationRequest,
    age: number
  ): Promise<ComplianceFlag[]> {
    const flags: ComplianceFlag[] = [];
    
    // Get compliance requirements for country
    const countryReqs = this.complianceRequirements[request.documentCountry as keyof typeof this.complianceRequirements];
    
    if (!countryReqs) {
      flags.push({
        type: 'regulatory',
        code: 'UNSUPPORTED_JURISDICTION',
        message: `Country ${request.documentCountry} not supported for verification`,
        severity: 'critical',
        jurisdiction: request.documentCountry
      });
    } else {
      // Check document type is accepted
      if (!countryReqs.documentTypes.includes(request.documentType)) {
        flags.push({
          type: 'regulatory',
          code: 'INVALID_DOCUMENT_TYPE',
          message: `Document type ${request.documentType} not accepted in ${request.documentCountry}`,
          severity: 'high',
          jurisdiction: request.documentCountry
        });
      }
      
      // Check minimum age
      if (age < countryReqs.minimumAge) {
        flags.push({
          type: 'legal',
          code: 'UNDERAGE',
          message: `Age ${age} is below legal minimum of ${countryReqs.minimumAge}`,
          severity: 'critical',
          jurisdiction: request.documentCountry
        });
      }
      
      // Adult platform specific checks
      if (this.adultPlatforms.includes(request.platform.toLowerCase())) {
        flags.push({
          type: 'platform',
          code: 'ADULT_CONTENT_VERIFICATION',
          message: 'Verification required for adult content platform access',
          severity: 'high',
          jurisdiction: request.documentCountry
        });
        
        // 2257 compliance for US adult content
        if (request.documentCountry === 'US') {
          flags.push({
            type: 'regulatory',
            code: 'USC_2257_COMPLIANCE',
            message: '18 USC 2257 record keeping requirements apply',
            severity: 'medium',
            jurisdiction: 'US'
          });
        }
      }
    }
    
    return flags;
  }

  /**
   * Store verification result securely
   */
  private async storeVerificationResult(
    verificationId: string,
    result: AgeVerificationResult
  ): Promise<void> {
    // In production, store in secure database with encryption
    console.log(`💾 Storing verification result for ${verificationId}`);
    
    // Create audit trail entry
    const auditEntry = {
      verificationId,
      timestamp: new Date(),
      result: result.verified ? 'approved' : 'rejected',
      confidence: result.confidence,
      method: result.method,
      complianceFlags: result.complianceFlags?.length || 0
    };
    
    console.log('📋 Audit entry:', auditEntry);
  }

  /**
   * Notify user of verification result
   */
  private async notifyVerificationResult(
    userId: string,
    result: AgeVerificationResult
  ): Promise<void> {
    console.log(`📧 Notifying user ${userId} of verification result: ${result.verified ? 'APPROVED' : 'REJECTED'}`);
    
    // In production, send secure notification through preferred channel
  }

  /**
   * Setup Multi-Factor Authentication
   */
  public async setupMFA(
    userId: string,
    method: 'totp' | 'sms' | 'email',
    contactInfo?: string
  ): Promise<MFASetup> {
    
    console.log(`🔐 Setting up MFA for user ${userId} with method: ${method}`);
    
    const mfaSetup: MFASetup = {
      userId,
      method,
      backupCodes: this.generateBackupCodes(),
      enabled: false
    };

    switch (method) {
      case 'totp':
        const secret = speakeasy.generateSecret({
          name: `FANZ (${userId})`,
          issuer: 'FANZ Creator Platform',
          length: 32
        });
        
        mfaSetup.secret = secret.base32;
        
        // Generate QR code for authenticator apps
        const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);
        
        return {
          ...mfaSetup,
          qrCode: qrCodeUrl,
          manualEntryKey: secret.base32
        } as any;
        
      case 'sms':
        if (!contactInfo) throw new Error('Phone number required for SMS MFA');
        mfaSetup.phoneNumber = contactInfo;
        break;
        
      case 'email':
        if (!contactInfo) throw new Error('Email address required for Email MFA');
        mfaSetup.email = contactInfo;
        break;
    }

    // Store MFA setup (encrypted in production)
    await this.storeMFASetup(mfaSetup);
    
    return mfaSetup;
  }

  /**
   * Verify MFA setup with test code
   */
  public async verifyMFASetup(
    userId: string,
    testCode: string
  ): Promise<{ verified: boolean; setup: MFASetup }> {
    
    const mfaSetup = await this.getMFASetup(userId);
    if (!mfaSetup) {
      throw new Error('MFA setup not found');
    }

    let verified = false;

    switch (mfaSetup.method) {
      case 'totp':
        verified = speakeasy.totp.verify({
          secret: mfaSetup.secret!,
          encoding: 'base32',
          token: testCode,
          window: 2 // Allow 2 time steps tolerance
        });
        break;
        
      case 'sms':
      case 'email':
        // In production, verify against sent code
        verified = await this.verifyTemporaryCode(userId, testCode);
        break;
    }

    if (verified) {
      mfaSetup.enabled = true;
      mfaSetup.verifiedAt = new Date();
      await this.storeMFASetup(mfaSetup);
      console.log(`✅ MFA setup verified for user ${userId}`);
    }

    return { verified, setup: mfaSetup };
  }

  /**
   * Challenge user with MFA
   */
  public async createMFAChallenge(userId: string): Promise<MFAChallenge> {
    const mfaSetup = await this.getMFASetup(userId);
    if (!mfaSetup || !mfaSetup.enabled) {
      throw new Error('MFA not enabled for user');
    }

    const challengeId = crypto.randomUUID();
    const challenge: MFAChallenge = {
      challengeId,
      userId,
      method: mfaSetup.method,
      code: '',
      expiresAt: new Date(Date.now() + this.MFA_CODE_EXPIRY),
      attempts: 0,
      maxAttempts: this.MAX_MFA_ATTEMPTS,
      verified: false
    };

    // Send challenge based on method
    switch (mfaSetup.method) {
      case 'totp':
        // TOTP doesn't need a sent code
        challenge.code = 'totp_required';
        break;
        
      case 'sms':
        challenge.code = this.generateNumericCode(6);
        await this.sendSMSCode(mfaSetup.phoneNumber!, challenge.code);
        break;
        
      case 'email':
        challenge.code = this.generateNumericCode(6);
        await this.sendEmailCode(mfaSetup.email!, challenge.code);
        break;
    }

    await this.storeMFAChallenge(challenge);
    console.log(`📱 MFA challenge created for user ${userId}: ${challengeId}`);
    
    return challenge;
  }

  /**
   * Verify MFA challenge response
   */
  public async verifyMFAChallenge(
    challengeId: string,
    userCode: string
  ): Promise<{ verified: boolean; attemptsRemaining: number }> {
    
    const challenge = await this.getMFAChallenge(challengeId);
    if (!challenge) {
      throw new Error('Challenge not found');
    }

    if (new Date() > challenge.expiresAt) {
      throw new Error('Challenge expired');
    }

    if (challenge.attempts >= challenge.maxAttempts) {
      throw new Error('Maximum attempts exceeded');
    }

    challenge.attempts++;
    let verified = false;

    const mfaSetup = await this.getMFASetup(challenge.userId);
    if (!mfaSetup) {
      throw new Error('MFA setup not found');
    }

    switch (challenge.method) {
      case 'totp':
        verified = speakeasy.totp.verify({
          secret: mfaSetup.secret!,
          encoding: 'base32',
          token: userCode,
          window: 2
        });
        break;
        
      case 'sms':
      case 'email':
        verified = userCode === challenge.code;
        break;
    }

    challenge.verified = verified;
    await this.storeMFAChallenge(challenge);

    const attemptsRemaining = challenge.maxAttempts - challenge.attempts;
    
    console.log(`🔐 MFA verification for ${challengeId}: ${verified ? 'SUCCESS' : 'FAILED'} (${attemptsRemaining} attempts remaining)`);
    
    return { verified, attemptsRemaining };
  }

  /**
   * Generate secure backup codes
   */
  private generateBackupCodes(count: number = 10): string[] {
    const codes = [];
    for (let i = 0; i < count; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }

  /**
   * Generate numeric code for SMS/Email
   */
  private generateNumericCode(length: number): string {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(Math.random() * (max - min + 1) + min).toString();
  }

  /**
   * Send SMS code (mock implementation)
   */
  private async sendSMSCode(phoneNumber: string, code: string): Promise<void> {
    console.log(`📱 Sending SMS code ${code} to ${phoneNumber}`);
    // In production, integrate with SMS service like Twilio
  }

  /**
   * Send Email code (mock implementation)
   */
  private async sendEmailCode(email: string, code: string): Promise<void> {
    console.log(`📧 Sending email code ${code} to ${email}`);
    // In production, integrate with email service
  }

  // Mock storage methods (in production, use secure database)
  private async storeMFASetup(setup: MFASetup): Promise<void> {
    console.log(`💾 Storing MFA setup for user ${setup.userId}`);
  }

  private async getMFASetup(userId: string): Promise<MFASetup | null> {
    console.log(`🔍 Retrieving MFA setup for user ${userId}`);
    // Mock return - in production, query database
    return null;
  }

  private async storeMFAChallenge(challenge: MFAChallenge): Promise<void> {
    console.log(`💾 Storing MFA challenge ${challenge.challengeId}`);
  }

  private async getMFAChallenge(challengeId: string): Promise<MFAChallenge | null> {
    console.log(`🔍 Retrieving MFA challenge ${challengeId}`);
    // Mock return - in production, query database
    return null;
  }

  private async verifyTemporaryCode(userId: string, code: string): Promise<boolean> {
    // Mock verification for temporary codes
    return code.length === 6 && /^\d+$/.test(code);
  }

  /**
   * Age verification middleware for Express routes
   */
  public requireAgeVerification = (
    req: Request & { user?: any },
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication Required',
        message: 'User must be authenticated for age verification',
        code: 'AUTH_REQUIRED'
      });
      return;
    }

    if (!req.user.ageVerified) {
      res.status(403).json({
        error: 'Age Verification Required',
        message: 'Age verification is required to access this content',
        code: 'AGE_VERIFICATION_REQUIRED',
        verificationUrl: '/age-verification',
        minimumAge: this.MINIMUM_AGE
      });
      return;
    }

    // Check if verification is still valid (annual re-verification)
    const verificationAge = Date.now() - new Date(req.user.ageVerifiedAt).getTime();
    const maxAge = this.VERIFICATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

    if (verificationAge > maxAge) {
      res.status(403).json({
        error: 'Age Verification Expired',
        message: 'Age verification has expired and must be renewed',
        code: 'VERIFICATION_EXPIRED',
        verificationUrl: '/age-verification/renew',
        expiryDate: new Date(new Date(req.user.ageVerifiedAt).getTime() + maxAge).toISOString()
      });
      return;
    }

    next();
  };

  /**
   * MFA requirement middleware
   */
  public requireMFA = (
    req: Request & { user?: any },
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication Required',
        message: 'User must be authenticated for MFA check',
        code: 'AUTH_REQUIRED'
      });
      return;
    }

    if (!req.user.mfaEnabled) {
      res.status(403).json({
        error: 'MFA Required',
        message: 'Multi-factor authentication must be enabled',
        code: 'MFA_SETUP_REQUIRED',
        setupUrl: '/mfa/setup'
      });
      return;
    }

    if (!req.user.mfaVerified) {
      res.status(403).json({
        error: 'MFA Challenge Required',
        message: 'Multi-factor authentication challenge must be completed',
        code: 'MFA_CHALLENGE_REQUIRED',
        challengeUrl: '/mfa/challenge'
      });
      return;
    }

    next();
  };
}

export {
  FanzAgeVerificationSystem,
  AgeVerificationRequest,
  AgeVerificationResult,
  MFASetup,
  MFAChallenge,
  DocumentAnalysis,
  ComplianceFlag
};

export default new FanzAgeVerificationSystem();