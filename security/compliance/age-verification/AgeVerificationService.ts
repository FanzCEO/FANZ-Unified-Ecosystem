// 🔞 FANZ Age Verification Service
// Comprehensive age verification for adult content platforms

import crypto from 'crypto';
import { Request, Response } from 'express';
import Redis from 'ioredis';

interface VerificationDocument {
  type: 'passport' | 'drivers_license' | 'national_id' | 'military_id';
  number: string;
  issuingCountry: string;
  issuingState?: string;
  expirationDate: string;
  imageUrl?: string;
}

interface VerificationData {
  userId: string;
  dateOfBirth: string;
  firstName: string;
  lastName: string;
  documents: VerificationDocument[];
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  verificationMethod: 'document' | 'credit_card' | 'phone' | 'third_party';
  status: 'pending' | 'verified' | 'rejected' | 'expired';
  verifierNotes?: string;
}

interface AgeGateSettings {
  platform: string;
  minimumAge: number;
  requireDocuments: boolean;
  allowedDocuments: string[];
  requireSecondaryVerification: boolean;
  complianceRegion: 'US' | 'EU' | 'UK' | 'CA' | 'GLOBAL';
  record2257Required: boolean;
}

class FanzAgeVerificationService {
  private redis: Redis;
  
  // Platform-specific age verification settings
  private readonly PLATFORM_SETTINGS: Record<string, AgeGateSettings> = {
    boyfanz: {
      platform: 'boyfanz',
      minimumAge: 18,
      requireDocuments: true,
      allowedDocuments: ['passport', 'drivers_license', 'national_id'],
      requireSecondaryVerification: true,
      complianceRegion: 'US',
      record2257Required: true
    },
    girlfanz: {
      platform: 'girlfanz',
      minimumAge: 18,
      requireDocuments: true,
      allowedDocuments: ['passport', 'drivers_license', 'national_id'],
      requireSecondaryVerification: true,
      complianceRegion: 'US',
      record2257Required: true
    },
    daddyfanz: {
      platform: 'daddyfanz',
      minimumAge: 21,
      requireDocuments: true,
      allowedDocuments: ['passport', 'drivers_license', 'national_id', 'military_id'],
      requireSecondaryVerification: true,
      complianceRegion: 'US',
      record2257Required: true
    },
    pupfanz: {
      platform: 'pupfanz',
      minimumAge: 18,
      requireDocuments: true,
      allowedDocuments: ['passport', 'drivers_license', 'national_id'],
      requireSecondaryVerification: true,
      complianceRegion: 'US',
      record2257Required: true
    },
    taboofanz: {
      platform: 'taboofanz',
      minimumAge: 21,
      requireDocuments: true,
      allowedDocuments: ['passport', 'drivers_license', 'national_id'],
      requireSecondaryVerification: true,
      complianceRegion: 'US',
      record2257Required: true
    },
    transfanz: {
      platform: 'transfanz',
      minimumAge: 18,
      requireDocuments: true,
      allowedDocuments: ['passport', 'drivers_license', 'national_id'],
      requireSecondaryVerification: true,
      complianceRegion: 'US',
      record2257Required: true
    },
    cougarfanz: {
      platform: 'cougarfanz',
      minimumAge: 18,
      requireDocuments: true,
      allowedDocuments: ['passport', 'drivers_license', 'national_id'],
      requireSecondaryVerification: true,
      complianceRegion: 'US',
      record2257Required: true
    },
    fanzcock: {
      platform: 'fanzcock',
      minimumAge: 21,
      requireDocuments: true,
      allowedDocuments: ['passport', 'drivers_license', 'national_id'],
      requireSecondaryVerification: true,
      complianceRegion: 'US',
      record2257Required: true
    }
  };

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    });
  }

  /**
   * Initialize age verification for user
   */
  public initializeVerification = async (req: Request, res: Response) => {
    try {
      const { userId, platform } = req.body;
      const settings = this.PLATFORM_SETTINGS[platform] || this.PLATFORM_SETTINGS.boyfanz;
      
      // Generate verification session
      const sessionId = this.generateVerificationId();
      const session = {
        sessionId,
        userId,
        platform,
        settings,
        status: 'pending',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      };
      
      // Store session
      await this.redis.setex(`age_verification:${sessionId}`, 86400, JSON.stringify(session));
      
      res.json({
        sessionId,
        settings: {
          minimumAge: settings.minimumAge,
          requireDocuments: settings.requireDocuments,
          allowedDocuments: settings.allowedDocuments,
          requireSecondaryVerification: settings.requireSecondaryVerification
        },
        steps: this.getVerificationSteps(settings)
      });
      
    } catch (error) {
      console.error('Age verification initialization error:', error);
      res.status(500).json({ error: 'Verification initialization failed' });
    }
  };

  /**
   * Submit verification documents
   */
  public submitVerification = async (req: Request, res: Response) => {
    try {
      const { sessionId, dateOfBirth, firstName, lastName, documents } = req.body;
      
      // Get verification session
      const sessionData = await this.redis.get(`age_verification:${sessionId}`);
      if (!sessionData) {
        return res.status(404).json({ error: 'Verification session not found' });
      }
      
      const session = JSON.parse(sessionData);
      const settings = session.settings;
      
      // Validate age
      const age = this.calculateAge(dateOfBirth);
      if (age < settings.minimumAge) {
        await this.recordVerificationAttempt(session.userId, 'rejected', 'Age below minimum');
        return res.status(403).json({
          error: 'Age verification failed',
          message: `Minimum age of ${settings.minimumAge} required`
        });
      }
      
      // Validate documents
      const documentValidation = await this.validateDocuments(documents, settings);
      if (!documentValidation.valid) {
        return res.status(400).json({
          error: 'Document validation failed',
          details: documentValidation.errors
        });
      }
      
      // Create verification record
      const verificationData: VerificationData = {
        userId: session.userId,
        dateOfBirth,
        firstName: this.hashPII(firstName),
        lastName: this.hashPII(lastName),
        documents: documents.map((doc: any) => ({
          ...doc,
          number: this.hashPII(doc.number)
        })),
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        timestamp: new Date(),
        verificationMethod: 'document',
        status: 'pending',
        verifierNotes: 'Submitted for manual review'
      };
      
      // Store verification record
      const verificationId = this.generateVerificationId();
      await this.redis.setex(
        `verification:${verificationId}`,
        30 * 24 * 60 * 60, // 30 days
        JSON.stringify(verificationData)
      );
      
      // Update session
      session.verificationId = verificationId;
      session.status = 'submitted';
      await this.redis.setex(`age_verification:${sessionId}`, 86400, JSON.stringify(session));
      
      // For demo purposes, auto-approve (in production, this would go to manual review)
      if (process.env.NODE_ENV === 'development' || process.env.AUTO_APPROVE_VERIFICATION === 'true') {
        await this.approveVerification(verificationId, 'Auto-approved in development');
      }
      
      res.json({
        message: 'Verification submitted successfully',
        verificationId,
        status: 'pending',
        estimatedReviewTime: '2-4 hours'
      });
      
    } catch (error) {
      console.error('Age verification submission error:', error);
      res.status(500).json({ error: 'Verification submission failed' });
    }
  };

  /**
   * Check verification status
   */
  public checkVerificationStatus = async (req: Request, res: Response) => {
    try {
      const { userId, sessionId, verificationId } = req.query;
      
      let verification;
      
      if (verificationId) {
        const verificationData = await this.redis.get(`verification:${verificationId}`);
        verification = verificationData ? JSON.parse(verificationData) : null;
      } else if (sessionId) {
        const sessionData = await this.redis.get(`age_verification:${sessionId}`);
        if (sessionData) {
          const session = JSON.parse(sessionData);
          if (session.verificationId) {
            const verificationData = await this.redis.get(`verification:${session.verificationId}`);
            verification = verificationData ? JSON.parse(verificationData) : null;
          }
        }
      } else if (userId) {
        // Find latest verification for user
        verification = await this.getLatestVerificationForUser(userId as string);
      }
      
      if (!verification) {
        return res.status(404).json({ error: 'Verification not found' });
      }
      
      // Return sanitized verification status
      res.json({
        status: verification.status,
        timestamp: verification.timestamp,
        verificationMethod: verification.verificationMethod,
        isAgeVerified: verification.status === 'verified',
        expiresAt: this.calculateVerificationExpiry(verification),
        nextSteps: this.getNextSteps(verification.status)
      });
      
    } catch (error) {
      console.error('Verification status check error:', error);
      res.status(500).json({ error: 'Status check failed' });
    }
  };

  /**
   * Age gate middleware for protecting adult content
   */
  public ageGateMiddleware = (platform: string) => {
    return async (req: any, res: Response, next: any) => {
      try {
        const user = req.user;
        
        if (!user) {
          return res.status(401).json({ error: 'Authentication required' });
        }
        
        // Check if user has valid age verification
        const isVerified = await this.isUserAgeVerified(user.userId, platform);
        
        if (!isVerified) {
          return res.status(451).json({
            error: 'Age verification required',
            message: 'Access to adult content requires age verification',
            code: 'AGE_GATE_BLOCKED',
            verificationUrl: `/api/auth/age-verification/init`,
            platform
          });
        }
        
        // Log access for compliance
        await this.logAdultContentAccess(user.userId, platform, req.path);
        
        next();
      } catch (error) {
        console.error('Age gate middleware error:', error);
        res.status(500).json({ error: 'Age verification check failed' });
      }
    };
  };

  /**
   * Manual verification approval (admin endpoint)
   */
  public approveVerification = async (verificationId: string, approverNotes?: string) => {
    try {
      const verificationData = await this.redis.get(`verification:${verificationId}`);
      if (!verificationData) {
        throw new Error('Verification not found');
      }
      
      const verification = JSON.parse(verificationData);
      verification.status = 'verified';
      verification.approvedAt = new Date().toISOString();
      verification.approverNotes = approverNotes || 'Manually approved';
      
      // Update verification record
      await this.redis.setex(
        `verification:${verificationId}`,
        365 * 24 * 60 * 60, // 1 year
        JSON.stringify(verification)
      );
      
      // Update user verification status
      await this.redis.setex(
        `user_verification:${verification.userId}`,
        365 * 24 * 60 * 60, // 1 year
        JSON.stringify({
          userId: verification.userId,
          isVerified: true,
          verificationId,
          verifiedAt: verification.approvedAt,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        })
      );
      
      console.log(`✅ Age verification approved for user ${verification.userId}`);
      return true;
    } catch (error) {
      console.error('Verification approval error:', error);
      return false;
    }
  };

  // Private helper methods
  private calculateAge(dateOfBirth: string): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  private async validateDocuments(documents: VerificationDocument[], settings: AgeGateSettings): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];
    
    if (settings.requireDocuments && documents.length === 0) {
      errors.push('At least one document is required');
    }
    
    for (const doc of documents) {
      if (!settings.allowedDocuments.includes(doc.type)) {
        errors.push(`Document type '${doc.type}' is not allowed`);
      }
      
      if (!doc.number || doc.number.length < 5) {
        errors.push('Document number is required and must be at least 5 characters');
      }
      
      if (new Date(doc.expirationDate) <= new Date()) {
        errors.push('Document has expired');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  private hashPII(data: string): string {
    return crypto.createHash('sha256').update(data + process.env.PII_SALT || 'fanz-salt').digest('hex');
  }

  private generateVerificationId(): string {
    return `ver_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  private getVerificationSteps(settings: AgeGateSettings): string[] {
    const steps = ['Enter personal information'];
    
    if (settings.requireDocuments) {
      steps.push('Upload valid identification documents');
    }
    
    if (settings.requireSecondaryVerification) {
      steps.push('Complete secondary verification');
    }
    
    steps.push('Manual review and approval');
    
    return steps;
  }

  private async isUserAgeVerified(userId: string, platform: string): Promise<boolean> {
    const userVerification = await this.redis.get(`user_verification:${userId}`);
    
    if (!userVerification) return false;
    
    const verification = JSON.parse(userVerification);
    
    // Check if verification is still valid
    if (new Date(verification.expiresAt) <= new Date()) {
      return false;
    }
    
    return verification.isVerified;
  }

  private async logAdultContentAccess(userId: string, platform: string, path: string): Promise<void> {
    const accessLog = {
      userId,
      platform,
      path,
      timestamp: new Date().toISOString(),
      ipAddress: 'logged_separately' // IP would be logged separately for privacy
    };
    
    // Store access log for compliance
    const logKey = `access_log:${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    await this.redis.setex(logKey, 90 * 24 * 60 * 60, JSON.stringify(accessLog)); // 90 days
  }

  private calculateVerificationExpiry(verification: VerificationData): string {
    // Verifications expire after 1 year
    const verifiedDate = new Date(verification.timestamp);
    const expiryDate = new Date(verifiedDate.getTime() + 365 * 24 * 60 * 60 * 1000);
    return expiryDate.toISOString();
  }

  private getNextSteps(status: string): string[] {
    switch (status) {
      case 'pending':
        return ['Wait for manual review', 'Check status in 2-4 hours'];
      case 'verified':
        return ['Age verification complete', 'Access granted to adult content'];
      case 'rejected':
        return ['Review rejection reason', 'Submit new verification with correct documents'];
      case 'expired':
        return ['Previous verification expired', 'Submit new age verification'];
      default:
        return [];
    }
  }

  private async recordVerificationAttempt(userId: string, status: string, reason: string): Promise<void> {
    const attempt = {
      userId,
      status,
      reason,
      timestamp: new Date().toISOString()
    };
    
    const attemptKey = `verification_attempt:${userId}:${Date.now()}`;
    await this.redis.setex(attemptKey, 90 * 24 * 60 * 60, JSON.stringify(attempt)); // 90 days
  }

  private async getLatestVerificationForUser(userId: string): Promise<VerificationData | null> {
    const userVerification = await this.redis.get(`user_verification:${userId}`);
    
    if (!userVerification) return null;
    
    const userVerInfo = JSON.parse(userVerification);
    const verificationData = await this.redis.get(`verification:${userVerInfo.verificationId}`);
    
    return verificationData ? JSON.parse(verificationData) : null;
  }
}

export default new FanzAgeVerificationService();
export { FanzAgeVerificationService, VerificationData, AgeGateSettings };
