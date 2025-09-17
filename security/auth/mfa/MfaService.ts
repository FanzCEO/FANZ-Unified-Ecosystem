// 🔐 FANZ Multi-Factor Authentication Service
// Enhanced security with TOTP, SMS, and backup codes for adult platforms

import crypto from 'crypto';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { Request, Response } from 'express';
import Redis from 'ioredis';

interface MfaSetup {
  userId: string;
  secret: string;
  qrCodeUrl?: string;
  backupCodes: string[];
  isEnabled: boolean;
  setupAt?: Date;
  lastUsed?: Date;
}

interface MfaSession {
  userId: string;
  sessionId: string;
  type: 'totp' | 'sms' | 'backup';
  verified: boolean;
  createdAt: Date;
  expiresAt: Date;
}

interface SmsVerification {
  userId: string;
  phoneNumber: string;
  code: string;
  attempts: number;
  createdAt: Date;
  expiresAt: Date;
}

class FanzMfaService {
  private redis: Redis;
  
  // Adult platforms requiring enhanced MFA
  private readonly HIGH_SECURITY_PLATFORMS = [
    'daddyfanz', 'taboofanz', 'fanzcock'
  ];
  
  private readonly MFA_CODE_LENGTH = 6;
  private readonly SMS_CODE_EXPIRY = 5 * 60; // 5 minutes
  private readonly MFA_SESSION_EXPIRY = 10 * 60; // 10 minutes
  private readonly MAX_SMS_ATTEMPTS = 3;
  private readonly BACKUP_CODES_COUNT = 10;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    });
  }

  /**
   * Setup TOTP MFA for user
   */
  public setupTotp = async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      const userEmail = (req as any).user?.email || 'user@fanz.com';
      
      // Generate secret
      const secret = speakeasy.generateSecret({
        name: `FANZ Platform (${userEmail})`,
        issuer: 'FANZ Security',
        length: 32
      });
      
      // Generate backup codes
      const backupCodes = this.generateBackupCodes();
      
      // Generate QR code
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);
      
      // Store MFA setup (not enabled until verified)
      const mfaSetup: MfaSetup = {
        userId,
        secret: secret.base32,
        qrCodeUrl,
        backupCodes,
        isEnabled: false,
        setupAt: new Date()
      };
      
      await this.redis.setex(
        `mfa_setup:${userId}`,
        3600, // 1 hour to complete setup
        JSON.stringify(mfaSetup)
      );
      
      res.json({
        secret: secret.base32,
        qrCodeUrl,
        backupCodes,
        manualEntryKey: secret.base32,
        instructions: {
          step1: 'Install an authenticator app (Google Authenticator, Authy, etc.)',
          step2: 'Scan the QR code or enter the manual key',
          step3: 'Enter a code from your app to verify setup'
        }
      });
      
    } catch (error) {
      console.error('TOTP setup error:', error);
      res.status(500).json({ error: 'MFA setup failed' });
    }
  };

  /**
   * Verify and enable TOTP MFA
   */
  public verifyTotpSetup = async (req: Request, res: Response) => {
    try {
      const { userId, token } = req.body;
      
      // Get MFA setup
      const setupData = await this.redis.get(`mfa_setup:${userId}`);
      if (!setupData) {
        return res.status(404).json({ error: 'MFA setup session not found' });
      }
      
      const mfaSetup: MfaSetup = JSON.parse(setupData);
      
      // Verify TOTP token
      const verified = speakeasy.totp.verify({
        secret: mfaSetup.secret,
        encoding: 'base32',
        token,
        window: 2 // Allow 2 time steps of drift
      });
      
      if (!verified) {
        return res.status(400).json({ error: 'Invalid verification code' });
      }
      
      // Enable MFA
      mfaSetup.isEnabled = true;
      mfaSetup.setupAt = new Date();
      
      // Store enabled MFA settings
      await this.redis.set(`mfa:${userId}`, JSON.stringify(mfaSetup));
      
      // Remove setup session
      await this.redis.del(`mfa_setup:${userId}`);
      
      // Update user MFA status
      await this.redis.set(`user_mfa_enabled:${userId}`, 'true');
      
      res.json({
        success: true,
        message: 'MFA enabled successfully',
        backupCodes: mfaSetup.backupCodes,
        warning: 'Store backup codes in a safe place. They can only be used once.'
      });
      
    } catch (error) {
      console.error('TOTP verification error:', error);
      res.status(500).json({ error: 'MFA verification failed' });
    }
  };

  /**
   * Verify TOTP token during login
   */
  public verifyTotp = async (req: Request, res: Response) => {
    try {
      const { userId, token, sessionId } = req.body;
      
      // Get MFA settings
      const mfaData = await this.redis.get(`mfa:${userId}`);
      if (!mfaData) {
        return res.status(404).json({ error: 'MFA not configured' });
      }
      
      const mfaSetup: MfaSetup = JSON.parse(mfaData);
      
      if (!mfaSetup.isEnabled) {
        return res.status(400).json({ error: 'MFA not enabled' });
      }
      
      let verified = false;
      let usedBackupCode = false;
      
      // Check if it's a backup code
      if (token.length > 6) {
        const backupIndex = mfaSetup.backupCodes.findIndex(code => code === token);
        if (backupIndex !== -1) {
          // Remove used backup code
          mfaSetup.backupCodes.splice(backupIndex, 1);
          verified = true;
          usedBackupCode = true;
          
          // Update MFA settings
          await this.redis.set(`mfa:${userId}`, JSON.stringify(mfaSetup));
        }
      } else {
        // Verify TOTP token
        verified = speakeasy.totp.verify({
          secret: mfaSetup.secret,
          encoding: 'base32',
          token,
          window: 2
        });
      }
      
      if (!verified) {
        // Log failed attempt
        await this.logMfaAttempt(userId, 'totp', false);
        return res.status(400).json({ error: 'Invalid verification code' });
      }
      
      // Create MFA session
      const mfaSession: MfaSession = {
        userId,
        sessionId,
        type: usedBackupCode ? 'backup' : 'totp',
        verified: true,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + this.MFA_SESSION_EXPIRY * 1000)
      };
      
      await this.redis.setex(
        `mfa_session:${sessionId}`,
        this.MFA_SESSION_EXPIRY,
        JSON.stringify(mfaSession)
      );
      
      // Update last used
      mfaSetup.lastUsed = new Date();
      await this.redis.set(`mfa:${userId}`, JSON.stringify(mfaSetup));
      
      // Log successful attempt
      await this.logMfaAttempt(userId, mfaSession.type, true);
      
      res.json({
        success: true,
        message: 'MFA verification successful',
        warningMessage: usedBackupCode ? 
          `Backup code used. ${mfaSetup.backupCodes.length} backup codes remaining.` : 
          undefined
      });
      
    } catch (error) {
      console.error('TOTP verification error:', error);
      res.status(500).json({ error: 'MFA verification failed' });
    }
  };

  /**
   * Send SMS verification code
   */
  public sendSmsCode = async (req: Request, res: Response) => {
    try {
      const { userId, phoneNumber } = req.body;
      
      // Check rate limiting
      const rateLimitKey = `sms_rate_limit:${userId}`;
      const recentAttempts = await this.redis.get(rateLimitKey);
      
      if (recentAttempts && parseInt(recentAttempts) >= 3) {
        return res.status(429).json({ 
          error: 'Too many SMS requests', 
          message: 'Please wait 5 minutes before requesting another code'
        });
      }
      
      // Generate verification code
      const code = this.generateSmsCode();
      
      // Store SMS verification
      const smsVerification: SmsVerification = {
        userId,
        phoneNumber,
        code,
        attempts: 0,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + this.SMS_CODE_EXPIRY * 1000)
      };
      
      await this.redis.setex(
        `sms_verification:${userId}`,
        this.SMS_CODE_EXPIRY,
        JSON.stringify(smsVerification)
      );
      
      // Update rate limiting
      await this.redis.incr(rateLimitKey);
      await this.redis.expire(rateLimitKey, 300); // 5 minutes
      
      // In production, integrate with SMS service (Twilio, AWS SNS, etc.)
      if (process.env.NODE_ENV === 'development') {
        console.log(`📱 SMS Code for ${phoneNumber}: ${code}`);
      } else {
        // await this.sendSms(phoneNumber, `Your FANZ verification code is: ${code}`);
      }
      
      res.json({
        success: true,
        message: 'Verification code sent',
        expiresIn: this.SMS_CODE_EXPIRY
      });
      
    } catch (error) {
      console.error('SMS send error:', error);
      res.status(500).json({ error: 'Failed to send SMS code' });
    }
  };

  /**
   * Verify SMS code
   */
  public verifySmsCode = async (req: Request, res: Response) => {
    try {
      const { userId, code, sessionId } = req.body;
      
      // Get SMS verification
      const smsData = await this.redis.get(`sms_verification:${userId}`);
      if (!smsData) {
        return res.status(404).json({ error: 'SMS verification session not found' });
      }
      
      const smsVerification: SmsVerification = JSON.parse(smsData);
      
      // Check expiry
      if (new Date() > smsVerification.expiresAt) {
        await this.redis.del(`sms_verification:${userId}`);
        return res.status(400).json({ error: 'Verification code expired' });
      }
      
      // Check attempts
      if (smsVerification.attempts >= this.MAX_SMS_ATTEMPTS) {
        await this.redis.del(`sms_verification:${userId}`);
        return res.status(400).json({ error: 'Too many failed attempts' });
      }
      
      // Verify code
      if (smsVerification.code !== code) {
        smsVerification.attempts++;
        await this.redis.setex(
          `sms_verification:${userId}`,
          Math.floor((smsVerification.expiresAt.getTime() - Date.now()) / 1000),
          JSON.stringify(smsVerification)
        );
        
        return res.status(400).json({ 
          error: 'Invalid verification code',
          attemptsRemaining: this.MAX_SMS_ATTEMPTS - smsVerification.attempts
        });
      }
      
      // Create MFA session
      const mfaSession: MfaSession = {
        userId,
        sessionId,
        type: 'sms',
        verified: true,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + this.MFA_SESSION_EXPIRY * 1000)
      };
      
      await this.redis.setex(
        `mfa_session:${sessionId}`,
        this.MFA_SESSION_EXPIRY,
        JSON.stringify(mfaSession)
      );
      
      // Clean up SMS verification
      await this.redis.del(`sms_verification:${userId}`);
      
      // Log successful attempt
      await this.logMfaAttempt(userId, 'sms', true);
      
      res.json({
        success: true,
        message: 'SMS verification successful'
      });
      
    } catch (error) {
      console.error('SMS verification error:', error);
      res.status(500).json({ error: 'SMS verification failed' });
    }
  };

  /**
   * MFA requirement middleware
   */
  public requireMfa = (platformSpecific: boolean = false) => {
    return async (req: any, res: Response, next: any) => {
      try {
        const user = req.user;
        const sessionId = req.headers['x-session-id'];
        
        if (!user || !sessionId) {
          return res.status(401).json({ error: 'Authentication required' });
        }
        
        // Check if MFA is required for this platform
        const platform = req.headers['x-platform'] as string;
        const requireMfaForPlatform = platformSpecific && 
          this.HIGH_SECURITY_PLATFORMS.includes(platform);
        
        // Check if user has MFA enabled
        const mfaEnabled = await this.redis.get(`user_mfa_enabled:${user.userId}`);
        
        if (!mfaEnabled && !requireMfaForPlatform) {
          // MFA not required, continue
          return next();
        }
        
        if (!mfaEnabled && requireMfaForPlatform) {
          return res.status(403).json({
            error: 'MFA setup required',
            message: 'This platform requires multi-factor authentication',
            setupUrl: '/api/auth/mfa/setup'
          });
        }
        
        // Check MFA session
        const mfaSessionData = await this.redis.get(`mfa_session:${sessionId}`);
        if (!mfaSessionData) {
          return res.status(403).json({
            error: 'MFA verification required',
            message: 'Please complete multi-factor authentication',
            verifyUrl: '/api/auth/mfa/verify'
          });
        }
        
        const mfaSession: MfaSession = JSON.parse(mfaSessionData);
        
        // Check session validity
        if (!mfaSession.verified || new Date() > mfaSession.expiresAt) {
          await this.redis.del(`mfa_session:${sessionId}`);
          return res.status(403).json({
            error: 'MFA session expired',
            message: 'Please complete multi-factor authentication again',
            verifyUrl: '/api/auth/mfa/verify'
          });
        }
        
        next();
      } catch (error) {
        console.error('MFA middleware error:', error);
        res.status(500).json({ error: 'MFA verification failed' });
      }
    };
  };

  /**
   * Disable MFA for user
   */
  public disableMfa = async (req: Request, res: Response) => {
    try {
      const { userId, currentPassword, totpToken } = req.body;
      
      // Verify current password (would integrate with user service)
      // const isValidPassword = await this.verifyCurrentPassword(userId, currentPassword);
      
      // Get MFA settings
      const mfaData = await this.redis.get(`mfa:${userId}`);
      if (!mfaData) {
        return res.status(404).json({ error: 'MFA not configured' });
      }
      
      const mfaSetup: MfaSetup = JSON.parse(mfaData);
      
      // Verify TOTP token for security
      const verified = speakeasy.totp.verify({
        secret: mfaSetup.secret,
        encoding: 'base32',
        token: totpToken,
        window: 2
      });
      
      if (!verified) {
        return res.status(400).json({ error: 'Invalid verification code' });
      }
      
      // Disable MFA
      await this.redis.del(`mfa:${userId}`);
      await this.redis.del(`user_mfa_enabled:${userId}`);
      
      // Log MFA disable event
      await this.logMfaAttempt(userId, 'disable', true);
      
      res.json({
        success: true,
        message: 'MFA disabled successfully',
        warning: 'Your account security has been reduced. Consider re-enabling MFA.'
      });
      
    } catch (error) {
      console.error('MFA disable error:', error);
      res.status(500).json({ error: 'Failed to disable MFA' });
    }
  };

  // Private helper methods
  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < this.BACKUP_CODES_COUNT; i++) {
      codes.push(crypto.randomBytes(5).toString('hex').toUpperCase());
    }
    return codes;
  }

  private generateSmsCode(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  private async logMfaAttempt(userId: string, type: string, success: boolean): Promise<void> {
    const logEntry = {
      userId,
      type,
      success,
      timestamp: new Date().toISOString(),
      ip: 'logged_separately' // IP would be logged separately
    };
    
    const logKey = `mfa_log:${userId}:${Date.now()}`;
    await this.redis.setex(logKey, 90 * 24 * 60 * 60, JSON.stringify(logEntry)); // 90 days
  }

  /**
   * Get MFA status for user
   */
  public getMfaStatus = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      // Check if MFA is enabled
      const mfaEnabled = await this.redis.get(`user_mfa_enabled:${userId}`);
      
      if (!mfaEnabled) {
        return res.json({
          enabled: false,
          methods: [],
          backupCodesRemaining: 0
        });
      }
      
      // Get MFA details
      const mfaData = await this.redis.get(`mfa:${userId}`);
      if (!mfaData) {
        return res.json({
          enabled: false,
          methods: [],
          backupCodesRemaining: 0
        });
      }
      
      const mfaSetup: MfaSetup = JSON.parse(mfaData);
      
      res.json({
        enabled: mfaSetup.isEnabled,
        methods: ['totp'],
        backupCodesRemaining: mfaSetup.backupCodes.length,
        lastUsed: mfaSetup.lastUsed,
        setupAt: mfaSetup.setupAt
      });
      
    } catch (error) {
      console.error('MFA status error:', error);
      res.status(500).json({ error: 'Failed to get MFA status' });
    }
  };
}

export default new FanzMfaService();
export { FanzMfaService, MfaSetup, MfaSession };
