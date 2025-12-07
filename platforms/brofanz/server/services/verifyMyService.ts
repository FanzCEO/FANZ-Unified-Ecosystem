/**
 * VerifyMy Integration Service for BroFanz
 *
 * Handles age verification and identity verification through VerifyMy
 * Supports:
 * - Age verification for all users (18+ gate)
 * - Identity verification for creators (2257 compliance)
 * - Document verification
 * - Liveness checks
 */

import crypto from 'crypto';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface VerifyMyConfig {
  apiKey: string;
  apiSecret: string;
  baseUrl: string;
  webhookSecret: string;
  environment: 'sandbox' | 'production';
}

export interface AgeVerificationRequest {
  userId: string;
  method: 'id_scan' | 'credit_card' | 'database_check' | 'redirect';
  redirectUrl?: string;
  metadata?: Record<string, any>;
}

export interface AgeVerificationResponse {
  verificationId: string;
  status: 'pending' | 'processing' | 'verified' | 'rejected';
  redirectUrl?: string;
  expiresAt?: Date;
}

export interface IdentityVerificationRequest {
  userId: string;
  documentType: 'passport' | 'drivers_license' | 'national_id';
  includeAddress: boolean;
  includeSelfie: boolean;
  includeLivenessCheck: boolean;
  redirectUrl?: string;
  metadata?: Record<string, any>;
}

export interface IdentityVerificationResponse {
  verificationId: string;
  status: 'pending' | 'processing' | 'verified' | 'rejected';
  redirectUrl?: string;
  documentData?: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    documentNumber?: string;
    documentCountry?: string;
    expirationDate?: string;
  };
  selfieData?: {
    matchScore?: number;
    livenessScore?: number;
  };
}

export interface VerificationWebhookPayload {
  event: string;
  verificationId: string;
  userId: string;
  status: string;
  result?: any;
  timestamp: string;
  signature: string;
}

export interface CreatorComplianceData {
  userId: string;
  legalFirstName: string;
  legalLastName: string;
  dateOfBirth: string;
  address: string;
  documentType: string;
  documentNumber: string;
  documentCountry: string;
  consentFormSigned: boolean;
  consentSignedAt: Date;
  custodianRecordId: string;
}

// ============================================================================
// VERIFYMYAGE SERVICE
// ============================================================================

class VerifyMyService {
  private config: VerifyMyConfig;
  private encryptionKey: Buffer;

  constructor() {
    this.config = {
      apiKey: process.env.VERIFYMYAGE_API_KEY || '',
      apiSecret: process.env.VERIFYMYAGE_API_SECRET || '',
      baseUrl: process.env.VERIFYMYAGE_BASE_URL || 'https://api.verifymyage.com/v1',
      webhookSecret: process.env.VERIFYMYAGE_WEBHOOK_SECRET || '',
      environment: (process.env.VERIFYMYAGE_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox'
    };

    // Encryption key for storing sensitive PII
    const encKey = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
    this.encryptionKey = Buffer.from(encKey, 'hex');
  }

  // ============================================================================
  // AGE VERIFICATION
  // ============================================================================

  /**
   * Initiate age verification for a user
   */
  async initiateAgeVerification(request: AgeVerificationRequest): Promise<AgeVerificationResponse> {
    try {
      const payload = {
        external_user_id: request.userId,
        verification_method: request.method,
        redirect_url: request.redirectUrl || `${process.env.APP_URL}/verify/age/callback`,
        webhook_url: `${process.env.API_URL}/webhooks/verifymyage`,
        metadata: request.metadata || {},
        settings: {
          min_age: 18,
          require_document: request.method === 'id_scan',
          allow_retry: true,
          max_retries: 3
        }
      };

      // In production, make actual API call
      if (this.config.environment === 'production' && this.config.apiKey) {
        const response = await fetch(`${this.config.baseUrl}/age-verification/initiate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`,
            'X-API-Secret': this.config.apiSecret
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(`VerifyMy API error: ${error.message}`);
        }

        const data = await response.json();
        return {
          verificationId: data.verification_id,
          status: data.status,
          redirectUrl: data.redirect_url,
          expiresAt: new Date(data.expires_at)
        };
      }

      // Sandbox/development mode - return mock response
      const mockVerificationId = `age_${crypto.randomUUID()}`;
      return {
        verificationId: mockVerificationId,
        status: 'pending',
        redirectUrl: `${process.env.APP_URL}/verify/age/mock?vid=${mockVerificationId}`,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
      };

    } catch (error) {
      console.error('Age verification initiation failed:', error);
      throw error;
    }
  }

  /**
   * Check age verification status
   */
  async checkAgeVerificationStatus(verificationId: string): Promise<AgeVerificationResponse> {
    try {
      if (this.config.environment === 'production' && this.config.apiKey) {
        const response = await fetch(`${this.config.baseUrl}/age-verification/${verificationId}`, {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'X-API-Secret': this.config.apiSecret
          }
        });

        if (!response.ok) {
          throw new Error('Failed to check verification status');
        }

        const data = await response.json();
        return {
          verificationId: data.verification_id,
          status: data.status,
          expiresAt: data.expires_at ? new Date(data.expires_at) : undefined
        };
      }

      // Mock response for development
      return {
        verificationId,
        status: 'verified'
      };

    } catch (error) {
      console.error('Age verification status check failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // IDENTITY VERIFICATION (CREATORS - 2257 COMPLIANCE)
  // ============================================================================

  /**
   * Initiate identity verification for creators
   * Required for 2257 compliance
   */
  async initiateIdentityVerification(request: IdentityVerificationRequest): Promise<IdentityVerificationResponse> {
    try {
      const payload = {
        external_user_id: request.userId,
        document_type: request.documentType,
        settings: {
          include_address: request.includeAddress,
          include_selfie: request.includeSelfie,
          include_liveness_check: request.includeLivenessCheck,
          require_document_front: true,
          require_document_back: request.documentType !== 'passport',
          min_selfie_match_score: 0.8,
          min_liveness_score: 0.9
        },
        redirect_url: request.redirectUrl || `${process.env.APP_URL}/verify/identity/callback`,
        webhook_url: `${process.env.API_URL}/webhooks/verifymyid`,
        metadata: {
          ...request.metadata,
          purpose: '2257_compliance',
          platform: 'brofanz'
        }
      };

      if (this.config.environment === 'production' && this.config.apiKey) {
        const response = await fetch(`${this.config.baseUrl}/identity-verification/initiate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`,
            'X-API-Secret': this.config.apiSecret
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(`VerifyMy API error: ${error.message}`);
        }

        const data = await response.json();
        return {
          verificationId: data.verification_id,
          status: data.status,
          redirectUrl: data.redirect_url
        };
      }

      // Mock response for development
      const mockVerificationId = `id_${crypto.randomUUID()}`;
      return {
        verificationId: mockVerificationId,
        status: 'pending',
        redirectUrl: `${process.env.APP_URL}/verify/identity/mock?vid=${mockVerificationId}`
      };

    } catch (error) {
      console.error('Identity verification initiation failed:', error);
      throw error;
    }
  }

  /**
   * Check identity verification status and retrieve results
   */
  async checkIdentityVerificationStatus(verificationId: string): Promise<IdentityVerificationResponse> {
    try {
      if (this.config.environment === 'production' && this.config.apiKey) {
        const response = await fetch(`${this.config.baseUrl}/identity-verification/${verificationId}`, {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'X-API-Secret': this.config.apiSecret
          }
        });

        if (!response.ok) {
          throw new Error('Failed to check verification status');
        }

        const data = await response.json();
        return {
          verificationId: data.verification_id,
          status: data.status,
          documentData: data.document_data ? {
            firstName: data.document_data.first_name,
            lastName: data.document_data.last_name,
            dateOfBirth: data.document_data.date_of_birth,
            documentNumber: data.document_data.document_number,
            documentCountry: data.document_data.document_country,
            expirationDate: data.document_data.expiration_date
          } : undefined,
          selfieData: data.selfie_data ? {
            matchScore: data.selfie_data.match_score,
            livenessScore: data.selfie_data.liveness_score
          } : undefined
        };
      }

      // Mock response for development
      return {
        verificationId,
        status: 'verified',
        documentData: {
          firstName: 'Test',
          lastName: 'User',
          dateOfBirth: '1990-01-01',
          documentNumber: 'MOCK123456',
          documentCountry: 'US'
        },
        selfieData: {
          matchScore: 0.95,
          livenessScore: 0.98
        }
      };

    } catch (error) {
      console.error('Identity verification status check failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // WEBHOOK HANDLING
  // ============================================================================

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', this.config.webhookSecret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Process age verification webhook
   */
  async processAgeVerificationWebhook(payload: VerificationWebhookPayload): Promise<{
    userId: string;
    verified: boolean;
    expiresAt?: Date;
  }> {
    // Verify this is a valid age verification event
    if (!payload.event.startsWith('age_verification.')) {
      throw new Error('Invalid webhook event type');
    }

    const isVerified = payload.status === 'verified';
    const expiresAt = isVerified ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : undefined; // 1 year

    return {
      userId: payload.userId,
      verified: isVerified,
      expiresAt
    };
  }

  /**
   * Process identity verification webhook
   */
  async processIdentityVerificationWebhook(payload: VerificationWebhookPayload): Promise<{
    userId: string;
    verified: boolean;
    complianceData?: Partial<CreatorComplianceData>;
  }> {
    if (!payload.event.startsWith('identity_verification.')) {
      throw new Error('Invalid webhook event type');
    }

    const isVerified = payload.status === 'verified';
    let complianceData: Partial<CreatorComplianceData> | undefined;

    if (isVerified && payload.result) {
      complianceData = {
        userId: payload.userId,
        legalFirstName: payload.result.document_data?.first_name,
        legalLastName: payload.result.document_data?.last_name,
        dateOfBirth: payload.result.document_data?.date_of_birth,
        documentType: payload.result.document_data?.document_type,
        documentNumber: payload.result.document_data?.document_number,
        documentCountry: payload.result.document_data?.document_country,
        custodianRecordId: `COR_${payload.verificationId}`
      };
    }

    return {
      userId: payload.userId,
      verified: isVerified,
      complianceData
    };
  }

  // ============================================================================
  // ENCRYPTION UTILITIES
  // ============================================================================

  /**
   * Encrypt sensitive PII for storage
   */
  encryptPII(data: string): Buffer {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);

    let encrypted = cipher.update(data, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    const authTag = cipher.getAuthTag();

    // Return iv + authTag + encrypted data
    return Buffer.concat([iv, authTag, encrypted]);
  }

  /**
   * Decrypt sensitive PII
   */
  decryptPII(encryptedData: Buffer): string {
    const iv = encryptedData.subarray(0, 16);
    const authTag = encryptedData.subarray(16, 32);
    const encrypted = encryptedData.subarray(32);

    const decipher = crypto.createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString('utf8');
  }

  /**
   * Hash data for storage (one-way, for verification comparison)
   */
  hashData(data: string): string {
    return crypto
      .createHash('sha256')
      .update(data + (process.env.HASH_SALT || 'brofanz_salt'))
      .digest('hex');
  }

  // ============================================================================
  // 2257 COMPLIANCE UTILITIES
  // ============================================================================

  /**
   * Generate 2257 compliant custodian record ID
   */
  generateCustodianRecordId(userId: string, verificationId: string): string {
    const timestamp = Date.now().toString(36);
    const hash = crypto
      .createHash('md5')
      .update(`${userId}:${verificationId}:${timestamp}`)
      .digest('hex')
      .substring(0, 8)
      .toUpperCase();

    return `COR-${timestamp}-${hash}`;
  }

  /**
   * Check if a creator's verification is still valid
   */
  isVerificationValid(expiresAt: Date | null): boolean {
    if (!expiresAt) return false;
    return new Date() < new Date(expiresAt);
  }

  /**
   * Get verification requirements for creator signup
   */
  getCreatorVerificationRequirements(): {
    ageVerification: boolean;
    identityVerification: boolean;
    selfieVerification: boolean;
    livenessCheck: boolean;
    addressVerification: boolean;
    consentForm: boolean;
  } {
    return {
      ageVerification: true,
      identityVerification: true,
      selfieVerification: true,
      livenessCheck: true,
      addressVerification: true,
      consentForm: true
    };
  }
}

// Export singleton instance
export const verifyMyService = new VerifyMyService();

// ============================================================================
// EXPRESS ROUTES FOR VERIFICATION
// ============================================================================

import { Router, Request, Response, NextFunction } from 'express';

export const verificationRouter = Router();

/**
 * Initiate age verification
 * POST /api/verify/age
 */
verificationRouter.post('/age', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, method = 'redirect' } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const result = await verifyMyService.initiateAgeVerification({
      userId,
      method,
      redirectUrl: `${process.env.APP_URL}/verify/age/complete`,
      metadata: {
        platform: 'brofanz',
        timestamp: new Date().toISOString()
      }
    });

    res.json({
      success: true,
      verificationId: result.verificationId,
      redirectUrl: result.redirectUrl,
      expiresAt: result.expiresAt
    });

  } catch (error) {
    next(error);
  }
});

/**
 * Check age verification status
 * GET /api/verify/age/:verificationId
 */
verificationRouter.get('/age/:verificationId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { verificationId } = req.params;

    const result = await verifyMyService.checkAgeVerificationStatus(verificationId);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    next(error);
  }
});

/**
 * Initiate identity verification (creators only)
 * POST /api/verify/identity
 */
verificationRouter.post('/identity', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, documentType = 'drivers_license' } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const result = await verifyMyService.initiateIdentityVerification({
      userId,
      documentType,
      includeAddress: true,
      includeSelfie: true,
      includeLivenessCheck: true,
      redirectUrl: `${process.env.APP_URL}/verify/identity/complete`,
      metadata: {
        platform: 'brofanz',
        purpose: 'creator_verification',
        timestamp: new Date().toISOString()
      }
    });

    res.json({
      success: true,
      verificationId: result.verificationId,
      redirectUrl: result.redirectUrl
    });

  } catch (error) {
    next(error);
  }
});

/**
 * Check identity verification status
 * GET /api/verify/identity/:verificationId
 */
verificationRouter.get('/identity/:verificationId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { verificationId } = req.params;

    const result = await verifyMyService.checkIdentityVerificationStatus(verificationId);

    // Don't expose sensitive document data in response
    res.json({
      success: true,
      verificationId: result.verificationId,
      status: result.status,
      selfieVerified: result.selfieData ? result.selfieData.matchScore >= 0.8 : undefined,
      livenessVerified: result.selfieData ? result.selfieData.livenessScore >= 0.9 : undefined
    });

  } catch (error) {
    next(error);
  }
});

/**
 * Get creator verification requirements
 * GET /api/verify/requirements
 */
verificationRouter.get('/requirements', (_req: Request, res: Response) => {
  const requirements = verifyMyService.getCreatorVerificationRequirements();
  res.json({
    success: true,
    requirements
  });
});

/**
 * VerifyMy webhook handler
 * POST /api/webhooks/verifymyage
 * POST /api/webhooks/verifymyid
 */
export const verificationWebhookHandler = async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-verifymyage-signature'] as string;
    const rawBody = JSON.stringify(req.body);

    // Verify signature
    if (!verifyMyService.verifyWebhookSignature(rawBody, signature || '')) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const payload = req.body as VerificationWebhookPayload;
    const path = req.path;

    if (path.includes('verifymyage')) {
      // Process age verification webhook
      const result = await verifyMyService.processAgeVerificationWebhook(payload);

      // TODO: Update user's age_verified status in database
      console.log('Age verification result:', result);

    } else if (path.includes('verifymyid')) {
      // Process identity verification webhook
      const result = await verifyMyService.processIdentityVerificationWebhook(payload);

      // TODO: Update creator's identity_verified status and store compliance data
      console.log('Identity verification result:', result);
    }

    res.json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

export default verifyMyService;
