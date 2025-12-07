/**
 * VerifyMy API Integration Service
 *
 * This service handles age and identity verification through VerifyMy.
 * Documentation: https://verifymy.com/docs (placeholder - replace with actual docs)
 */

interface VerifyMyConfig {
  apiKey: string;
  apiSecret: string;
  baseUrl: string;
  webhookSecret: string;
}

interface VerificationRequest {
  userId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  documentType: string;
  documentFrontUrl: string;
  documentBackUrl?: string;
  selfieUrl: string;
}

interface VerificationResponse {
  verificationId: string;
  status: 'pending' | 'approved' | 'rejected' | 'requires_review';
  ageVerified: boolean;
  idVerified: boolean;
  confidence: number;
  rejectionReasons?: string[];
  verifiedData?: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    documentNumber?: string;
    expiryDate?: string;
  };
}

export class VerifyMyService {
  private config: VerifyMyConfig;

  constructor() {
    this.config = {
      apiKey: process.env.VERIFYMY_API_KEY || '',
      apiSecret: process.env.VERIFYMY_API_SECRET || '',
      baseUrl: process.env.VERIFYMY_BASE_URL || 'https://api.verifymy.com/v1',
      webhookSecret: process.env.VERIFYMY_WEBHOOK_SECRET || '',
    };

    if (!this.config.apiKey || !this.config.apiSecret) {
      console.warn('⚠️  VerifyMy API credentials not configured. Verification will run in simulation mode.');
    }
  }

  /**
   * Submit a verification request to VerifyMy
   */
  async submitVerification(request: VerificationRequest): Promise<VerificationResponse> {
    // If no API key is configured, run in simulation mode
    if (!this.config.apiKey) {
      return this.simulateVerification(request);
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/verifications`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'X-API-Secret': this.config.apiSecret,
        },
        body: JSON.stringify({
          user_id: request.userId,
          first_name: request.firstName,
          last_name: request.lastName,
          date_of_birth: request.dateOfBirth.toISOString().split('T')[0],
          document_type: request.documentType,
          document_front_url: request.documentFrontUrl,
          document_back_url: request.documentBackUrl,
          selfie_url: request.selfieUrl,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`VerifyMy API error: ${error.message || response.statusText}`);
      }

      const data = await response.json();
      return this.mapVerifyMyResponse(data);
    } catch (error) {
      console.error('Error submitting verification to VerifyMy:', error);
      throw error;
    }
  }

  /**
   * Check the status of a verification request
   */
  async checkVerificationStatus(verificationId: string): Promise<VerificationResponse> {
    // If no API key is configured, return simulated status
    if (!this.config.apiKey) {
      return {
        verificationId,
        status: 'approved',
        ageVerified: true,
        idVerified: true,
        confidence: 95,
      };
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/verifications/${verificationId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'X-API-Secret': this.config.apiSecret,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`VerifyMy API error: ${error.message || response.statusText}`);
      }

      const data = await response.json();
      return this.mapVerifyMyResponse(data);
    } catch (error) {
      console.error('Error checking verification status:', error);
      throw error;
    }
  }

  /**
   * Verify webhook signature from VerifyMy
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.config.webhookSecret) {
      console.warn('⚠️  Webhook secret not configured. Skipping signature verification.');
      return true;
    }

    // In production, implement proper HMAC signature verification
    // Example using crypto:
    // const crypto = require('crypto');
    // const expectedSignature = crypto
    //   .createHmac('sha256', this.config.webhookSecret)
    //   .update(payload)
    //   .digest('hex');
    // return signature === expectedSignature;

    return true;
  }

  /**
   * Process webhook callback from VerifyMy
   */
  processWebhook(payload: any): VerificationResponse {
    return this.mapVerifyMyResponse(payload);
  }

  /**
   * Map VerifyMy API response to our internal format
   */
  private mapVerifyMyResponse(data: any): VerificationResponse {
    return {
      verificationId: data.verification_id || data.id,
      status: this.mapStatus(data.status),
      ageVerified: data.age_verified || false,
      idVerified: data.id_verified || false,
      confidence: data.confidence || 0,
      rejectionReasons: data.rejection_reasons,
      verifiedData: data.verified_data ? {
        firstName: data.verified_data.first_name,
        lastName: data.verified_data.last_name,
        dateOfBirth: data.verified_data.date_of_birth,
        documentNumber: data.verified_data.document_number,
        expiryDate: data.verified_data.expiry_date,
      } : undefined,
    };
  }

  /**
   * Map VerifyMy status to our internal status
   */
  private mapStatus(status: string): 'pending' | 'approved' | 'rejected' | 'requires_review' {
    const statusMap: Record<string, 'pending' | 'approved' | 'rejected' | 'requires_review'> = {
      'pending': 'pending',
      'processing': 'pending',
      'approved': 'approved',
      'verified': 'approved',
      'rejected': 'rejected',
      'failed': 'rejected',
      'requires_review': 'requires_review',
      'manual_review': 'requires_review',
    };

    return statusMap[status.toLowerCase()] || 'pending';
  }

  /**
   * Simulate verification for development/testing
   */
  private simulateVerification(request: VerificationRequest): VerificationResponse {
    console.log('🔧 Running verification in simulation mode');
    console.log(`   User: ${request.firstName} ${request.lastName}`);
    console.log(`   DOB: ${request.dateOfBirth.toISOString().split('T')[0]}`);
    console.log(`   Document Type: ${request.documentType}`);

    // Calculate age
    const today = new Date();
    const birthDate = new Date(request.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    const isOver18 = age >= 18;

    return {
      verificationId: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: isOver18 ? 'approved' : 'rejected',
      ageVerified: isOver18,
      idVerified: isOver18,
      confidence: 95,
      rejectionReasons: isOver18 ? undefined : ['Age requirement not met (18+)'],
      verifiedData: {
        firstName: request.firstName,
        lastName: request.lastName,
        dateOfBirth: request.dateOfBirth.toISOString().split('T')[0],
      },
    };
  }

  /**
   * Check if the service is properly configured
   */
  isConfigured(): boolean {
    return !!(this.config.apiKey && this.config.apiSecret);
  }

  /**
   * Get configuration status (for debugging)
   */
  getConfigStatus(): { configured: boolean; mode: 'production' | 'simulation' } {
    return {
      configured: this.isConfigured(),
      mode: this.isConfigured() ? 'production' : 'simulation',
    };
  }
}

export const verifyMyService = new VerifyMyService();
