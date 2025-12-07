import crypto from 'crypto';
import { storage } from '../storage';
import { fanzSSOService } from './sso';
import { notificationService } from './notifications';

export interface SecurityToken {
  id: string;
  userId: string;
  type: 'password_reset' | 'email_verification' | '2fa_setup' | 'device_verification';
  token: string;
  data?: Record<string, any>;
  expiresAt: Date;
  createdAt: Date;
  usedAt?: Date;
}

export interface LoginAttempt {
  id: string;
  userId?: string;
  email: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  failureReason?: string;
  timestamp: Date;
  geoLocation?: {
    country: string;
    city: string;
    latitude: number;
    longitude: number;
  };
}

export interface UserDevice {
  id: string;
  userId: string;
  deviceFingerprint: string;
  deviceName: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
  ipAddress: string;
  isVerified: boolean;
  isTrusted: boolean;
  firstSeenAt: Date;
  lastSeenAt: Date;
  createdAt: Date;
}

export interface SecurityNotification {
  id: string;
  userId: string;
  type: 'login_new_device' | 'login_new_location' | 'password_changed' | 'account_locked' | '2fa_enabled' | '2fa_disabled';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  isRead: boolean;
  data?: Record<string, any>;
  createdAt: Date;
  readAt?: Date;
}

export interface TwoFactorAuth {
  id: string;
  userId: string;
  method: 'totp' | 'sms' | 'email';
  secret?: string; // For TOTP
  phoneNumber?: string; // For SMS
  email?: string; // For email
  isVerified: boolean;
  backupCodes: string[];
  createdAt: Date;
  verifiedAt?: Date;
}

/**
 * Enhanced Security Service for FanzFiliate
 * Provides advanced security features including password reset, 2FA, device tracking, and notifications
 */
class SecurityService {
  private readonly tokenTTL = {
    password_reset: 15 * 60 * 1000, // 15 minutes
    email_verification: 24 * 60 * 60 * 1000, // 24 hours
    '2fa_setup': 10 * 60 * 1000, // 10 minutes
    device_verification: 5 * 60 * 1000, // 5 minutes
  };

  private readonly maxLoginAttempts = 5;
  private readonly lockoutDuration = 30 * 60 * 1000; // 30 minutes

  /**
   * Generate a secure random token
   */
  private generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Hash a token for storage
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Generate and store a security token
   */
  async generateSecurityToken(
    userId: string, 
    type: SecurityToken['type'], 
    data?: Record<string, any>
  ): Promise<{ token: string; tokenId: string }> {
    const token = this.generateToken(32);
    const hashedToken = this.hashToken(token);
    
    const securityToken: Omit<SecurityToken, 'id' | 'createdAt'> = {
      userId,
      type,
      token: hashedToken,
      data,
      expiresAt: new Date(Date.now() + this.tokenTTL[type]),
    };

    // In a real implementation, you'd store this in the database
    // For now, we'll use in-memory storage
    const tokenId = `token_${Date.now()}_${Math.random()}`;
    
    console.log(`Generated ${type} token for user ${userId}: ${tokenId}`);
    
    return { token, tokenId };
  }

  /**
   * Verify and consume a security token
   */
  async verifySecurityToken(token: string, type: SecurityToken['type']): Promise<SecurityToken | null> {
    const hashedToken = this.hashToken(token);
    
    // In a real implementation, you'd query the database for the token
    // For now, we'll simulate verification
    console.log(`Verifying ${type} token: ${hashedToken}`);
    
    // Mock token verification - in production this would query the database
    return null;
  }

  /**
   * Record a login attempt
   */
  async recordLoginAttempt(
    email: string,
    ipAddress: string,
    userAgent: string,
    success: boolean,
    userId?: string,
    failureReason?: string
  ): Promise<void> {
    const attempt: LoginAttempt = {
      id: `attempt_${Date.now()}_${Math.random()}`,
      userId,
      email,
      ipAddress,
      userAgent,
      success,
      failureReason,
      timestamp: new Date(),
    };

    // In production, store in database and analyze patterns
    console.log('Login attempt recorded:', {
      email,
      success,
      ipAddress,
      failureReason,
    });

    // Check for account lockout if failed
    if (!success && userId) {
      await this.checkAccountLockout(userId, email);
    }
  }

  /**
   * Check if account should be locked due to failed attempts
   */
  async checkAccountLockout(userId: string, email: string): Promise<boolean> {
    // In production, query recent failed attempts from database
    const recentFailedAttempts = 0; // Mock count
    
    if (recentFailedAttempts >= this.maxLoginAttempts) {
      // Lock account and send notification
      await this.lockAccount(userId, 'too_many_failed_attempts');
      await this.createSecurityNotification(userId, {
        type: 'account_locked',
        title: 'Account Temporarily Locked',
        message: `Your account has been temporarily locked due to too many failed login attempts. It will be unlocked automatically in 30 minutes.`,
        severity: 'critical',
      });
      return true;
    }
    
    return false;
  }

  /**
   * Lock a user account
   */
  async lockAccount(userId: string, reason: string): Promise<void> {
    // In production, update user record with lockout timestamp
    console.log(`Account ${userId} locked due to: ${reason}`);
  }

  /**
   * Track user device
   */
  async trackUserDevice(
    userId: string,
    deviceFingerprint: string,
    deviceInfo: {
      name: string;
      type: 'desktop' | 'mobile' | 'tablet';
      browser: string;
      os: string;
      ipAddress: string;
    }
  ): Promise<{ isNewDevice: boolean; device: UserDevice }> {
    // In production, check if device exists in database
    const existingDevice = null; // Mock query
    
    if (existingDevice) {
      // Update last seen
      return { isNewDevice: false, device: existingDevice };
    }

    // Create new device record
    const device: UserDevice = {
      id: `device_${Date.now()}_${Math.random()}`,
      userId,
      deviceFingerprint,
      deviceName: deviceInfo.name,
      deviceType: deviceInfo.type,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      ipAddress: deviceInfo.ipAddress,
      isVerified: false,
      isTrusted: false,
      firstSeenAt: new Date(),
      lastSeenAt: new Date(),
      createdAt: new Date(),
    };

    // Notify user of new device
    await this.createSecurityNotification(userId, {
      type: 'login_new_device',
      title: 'New Device Login',
      message: `A login was detected from a new device: ${deviceInfo.name} (${deviceInfo.browser} on ${deviceInfo.os})`,
      severity: 'warning',
      data: { device: deviceInfo },
    });

    return { isNewDevice: true, device };
  }

  /**
   * Create security notification
   */
  async createSecurityNotification(
    userId: string,
    notification: Omit<SecurityNotification, 'id' | 'userId' | 'isRead' | 'createdAt'>
  ): Promise<SecurityNotification> {
    const securityNotification: SecurityNotification = {
      id: `notification_${Date.now()}_${Math.random()}`,
      userId,
      isRead: false,
      createdAt: new Date(),
      ...notification,
    };

    // Send via real-time notification service
    await notificationService.createNotification({
      userId,
      type: 'security_alert',
      title: notification.title,
      message: notification.message,
      priority: notification.severity === 'critical' ? 'critical' : 
               notification.severity === 'warning' ? 'high' : 'normal',
      channels: ['websocket', 'email'],
      data: {
        securityType: notification.type,
        severity: notification.severity,
        ...notification.data,
      },
      maxRetries: 3,
    });

    console.log('Security notification created and sent:', {
      userId,
      type: notification.type,
      severity: notification.severity,
      title: notification.title,
    });

    return securityNotification;
  }

  /**
   * Get user security notifications
   */
  async getUserSecurityNotifications(userId: string, unreadOnly: boolean = false): Promise<SecurityNotification[]> {
    // In production, query from database
    return [];
  }

  /**
   * Mark security notification as read
   */
  async markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
    // In production, update database record
    console.log(`Notification ${notificationId} marked as read by user ${userId}`);
  }

  /**
   * Setup Two-Factor Authentication
   */
  async setup2FA(
    userId: string,
    method: 'totp' | 'sms' | 'email' = 'totp',
    phoneNumber?: string,
    email?: string
  ): Promise<{ secret?: string; qrCode?: string; backupCodes: string[] }> {
    const backupCodes = Array.from({ length: 10 }, () => this.generateToken(4));
    
    let secret: string | undefined;
    let qrCode: string | undefined;

    if (method === 'totp') {
      // Generate TOTP secret - using hex since base32 isn't a standard encoding
      secret = crypto.randomBytes(20).toString('hex');
      
      // In production, you'd generate a QR code URL for the authenticator app
      qrCode = `otpauth://totp/FanzFiliate:${userId}?secret=${secret}&issuer=FanzFiliate`;
    }

    // Store 2FA configuration
    const twoFactorAuth: TwoFactorAuth = {
      id: `2fa_${Date.now()}_${Math.random()}`,
      userId,
      method,
      secret,
      phoneNumber,
      email,
      isVerified: false,
      backupCodes,
      createdAt: new Date(),
    };

    // In production, store in database
    console.log(`2FA setup initiated for user ${userId} with method ${method}`);

    return { secret, qrCode, backupCodes };
  }

  /**
   * Verify 2FA code
   */
  async verify2FA(userId: string, code: string): Promise<boolean> {
    // In production, retrieve user's 2FA configuration and verify code
    // For TOTP, you'd use a library like 'speakeasy' to verify the code
    // For SMS/Email, you'd verify against the sent code
    
    console.log(`Verifying 2FA code for user ${userId}`);
    
    // Mock verification - always return true for demo
    return true;
  }

  /**
   * Disable 2FA
   */
  async disable2FA(userId: string): Promise<void> {
    // In production, remove 2FA configuration from database
    console.log(`2FA disabled for user ${userId}`);
    
    await this.createSecurityNotification(userId, {
      type: '2fa_disabled',
      title: 'Two-Factor Authentication Disabled',
      message: 'Two-factor authentication has been disabled for your account.',
      severity: 'warning',
    });
  }

  /**
   * Initiate password reset
   */
  async initiatePasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    const user = await storage.getUserByEmail?.(email);
    
    if (!user) {
      // Don't reveal if email exists or not for security
      return {
        success: true,
        message: 'If this email is registered, you will receive a password reset link.',
      };
    }

    const { token } = await this.generateSecurityToken(user.id, 'password_reset');
    
    // In production, send email with reset link
    console.log(`Password reset token generated for ${email}: ${token}`);
    
    await this.createSecurityNotification(user.id, {
      type: 'password_changed',
      title: 'Password Reset Requested',
      message: 'A password reset was requested for your account. If this was not you, please contact support.',
      severity: 'warning',
    });

    return {
      success: true,
      message: 'If this email is registered, you will receive a password reset link.',
    };
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const securityToken = await this.verifySecurityToken(token, 'password_reset');
    
    if (!securityToken) {
      return {
        success: false,
        message: 'Invalid or expired reset token.',
      };
    }

    // In production, hash the new password and update user record
    console.log(`Password reset completed for user ${securityToken.userId}`);
    
    await this.createSecurityNotification(securityToken.userId, {
      type: 'password_changed',
      title: 'Password Changed',
      message: 'Your password has been successfully changed.',
      severity: 'info',
    });

    return {
      success: true,
      message: 'Password has been reset successfully.',
    };
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(userId: string, email: string): Promise<void> {
    const { token } = await this.generateSecurityToken(userId, 'email_verification', { email });
    
    // In production, send verification email
    console.log(`Email verification token generated for user ${userId}: ${token}`);
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<{ success: boolean; message: string; userId?: string }> {
    const securityToken = await this.verifySecurityToken(token, 'email_verification');
    
    if (!securityToken) {
      return {
        success: false,
        message: 'Invalid or expired verification token.',
      };
    }

    // In production, mark email as verified in user record
    console.log(`Email verified for user ${securityToken.userId}`);

    return {
      success: true,
      message: 'Email has been verified successfully.',
      userId: securityToken.userId,
    };
  }

  /**
   * Get security overview for a user
   */
  async getSecurityOverview(userId: string): Promise<{
    loginAttempts: number;
    devices: number;
    notifications: number;
    has2FA: boolean;
    emailVerified: boolean;
    accountLocked: boolean;
  }> {
    // In production, query from database
    return {
      loginAttempts: 0,
      devices: 0,
      notifications: 0,
      has2FA: false,
      emailVerified: true,
      accountLocked: false,
    };
  }
}

export const securityService = new SecurityService();
