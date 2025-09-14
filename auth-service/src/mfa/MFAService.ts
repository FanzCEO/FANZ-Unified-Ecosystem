import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';

// 🔐 FANZ MFA Service - Multi-Factor Authentication System
// Comprehensive MFA with TOTP, SMS, WebAuthn, and Hardware Keys

export interface MFAConfig {
  issuer: string;
  serviceName: string;
  qrCodeSize: number;
  totpWindow: number;
  smsProvider: 'twilio' | 'aws' | 'mock';
  recoveryCodes: {
    count: number;
    length: number;
  };
  webauthn: {
    rpId: string;
    rpName: string;
    origin: string;
  };
}

export interface MFADevice {
  id: string;
  userId: string;
  type: MFAType;
  name: string;
  secret?: string; // For TOTP
  credentialId?: string; // For WebAuthn
  publicKey?: string; // For WebAuthn
  phoneNumber?: string; // For SMS
  isActive: boolean;
  createdAt: Date;
  lastUsedAt?: Date;
  metadata: Record<string, any>;
}

export interface MFAChallenge {
  id: string;
  userId: string;
  deviceId: string;
  type: MFAType;
  code?: string; // For TOTP/SMS
  challenge?: string; // For WebAuthn
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
  isCompleted: boolean;
  metadata: Record<string, any>;
}

export enum MFAType {
  TOTP = 'totp',
  SMS = 'sms',
  WEBAUTHN = 'webauthn',
  RECOVERY_CODE = 'recovery_code'
}

export enum MFAVerificationResult {
  SUCCESS = 'success',
  INVALID_CODE = 'invalid_code',
  EXPIRED = 'expired',
  TOO_MANY_ATTEMPTS = 'too_many_attempts',
  DEVICE_NOT_FOUND = 'device_not_found',
  USER_NOT_FOUND = 'user_not_found'
}

export class MFAService extends EventEmitter {
  private devices: Map<string, MFADevice> = new Map();
  private challenges: Map<string, MFAChallenge> = new Map();
  private recoveryCodes: Map<string, Set<string>> = new Map(); // userId -> set of codes
  private userDevices: Map<string, Set<string>> = new Map(); // userId -> deviceIds
  
  private readonly config: MFAConfig = {
    issuer: 'FANZ',
    serviceName: 'FANZ Unified Platform',
    qrCodeSize: 256,
    totpWindow: 1,
    smsProvider: 'mock',
    recoveryCodes: {
      count: 10,
      length: 8
    },
    webauthn: {
      rpId: 'fanz.com',
      rpName: 'FANZ Platform',
      origin: 'https://fanz.com'
    }
  };

  constructor(config?: Partial<MFAConfig>) {
    super();
    this.config = { ...this.config, ...config };
    this.startCleanupInterval();
  }

  /**
   * Setup TOTP authenticator for user
   */
  async setupTOTP(userId: string, deviceName: string): Promise<{
    device: MFADevice;
    secret: string;
    qrCodeUrl: string;
    backupCodes: string[];
  }> {
    // Generate secret
    const secret = speakeasy.generateSecret({
      issuer: this.config.issuer,
      name: `${this.config.serviceName}:${userId}`,
      length: 32
    });

    // Create device
    const device: MFADevice = {
      id: uuidv4(),
      userId,
      type: MFAType.TOTP,
      name: deviceName,
      secret: secret.base32,
      isActive: false, // Will be activated after verification
      createdAt: new Date(),
      metadata: {
        algorithm: 'SHA1',
        digits: 6,
        period: 30
      }
    };

    this.devices.set(device.id, device);
    this.addDeviceToUser(userId, device.id);

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!, {
      width: this.config.qrCodeSize
    });

    // Generate recovery codes
    const backupCodes = this.generateRecoveryCodes(userId);

    this.emit('totpSetupStarted', { userId, deviceId: device.id });

    return {
      device,
      secret: secret.base32!,
      qrCodeUrl,
      backupCodes
    };
  }

  /**
   * Verify TOTP setup and activate device
   */
  async verifyTOTPSetup(userId: string, deviceId: string, token: string): Promise<boolean> {
    const device = this.devices.get(deviceId);
    if (!device || device.userId !== userId || device.type !== MFAType.TOTP) {
      return false;
    }

    const verified = speakeasy.totp.verify({
      secret: device.secret!,
      encoding: 'base32',
      token,
      window: this.config.totpWindow
    });

    if (verified) {
      device.isActive = true;
      device.lastUsedAt = new Date();
      this.devices.set(deviceId, device);

      this.emit('totpActivated', { userId, deviceId });
      console.log('✅ TOTP Device Activated:', { userId, deviceId, deviceName: device.name });
      return true;
    }

    return false;
  }

  /**
   * Setup SMS MFA for user
   */
  async setupSMS(userId: string, phoneNumber: string, deviceName: string): Promise<{
    device: MFADevice;
    verificationSent: boolean;
  }> {
    // Validate phone number format
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber)) {
      throw new Error('Invalid phone number format. Use E.164 format (+1234567890)');
    }

    const device: MFADevice = {
      id: uuidv4(),
      userId,
      type: MFAType.SMS,
      name: deviceName,
      phoneNumber,
      isActive: false,
      createdAt: new Date(),
      metadata: {
        verified: false,
        country: phoneNumber.substring(0, 3) // Basic country code extraction
      }
    };

    this.devices.set(device.id, device);
    this.addDeviceToUser(userId, device.id);

    // Send verification SMS
    const verificationCode = this.generateSMSCode();
    const sent = await this.sendSMS(phoneNumber, `Your FANZ verification code is: ${verificationCode}. Valid for 5 minutes.`);

    if (sent) {
      // Store verification challenge
      const challenge: MFAChallenge = {
        id: uuidv4(),
        userId,
        deviceId: device.id,
        type: MFAType.SMS,
        code: verificationCode,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        attempts: 0,
        maxAttempts: 3,
        isCompleted: false,
        metadata: { setupVerification: true }
      };

      this.challenges.set(challenge.id, challenge);
    }

    this.emit('smsSetupStarted', { userId, deviceId: device.id, phoneNumber });

    return {
      device,
      verificationSent: sent
    };
  }

  /**
   * Verify SMS setup
   */
  async verifySMSSetup(userId: string, deviceId: string, code: string): Promise<boolean> {
    const device = this.devices.get(deviceId);
    if (!device || device.userId !== userId || device.type !== MFAType.SMS) {
      return false;
    }

    // Find setup verification challenge
    const challenge = Array.from(this.challenges.values()).find(c => 
      c.deviceId === deviceId && 
      c.type === MFAType.SMS && 
      c.metadata.setupVerification === true &&
      !c.isCompleted
    );

    if (!challenge) {
      return false;
    }

    if (challenge.expiresAt < new Date()) {
      this.challenges.delete(challenge.id);
      return false;
    }

    if (challenge.attempts >= challenge.maxAttempts) {
      this.challenges.delete(challenge.id);
      return false;
    }

    challenge.attempts++;

    if (challenge.code === code) {
      challenge.isCompleted = true;
      device.isActive = true;
      device.lastUsedAt = new Date();
      device.metadata.verified = true;

      this.devices.set(deviceId, device);
      this.challenges.delete(challenge.id);

      this.emit('smsActivated', { userId, deviceId, phoneNumber: device.phoneNumber });
      console.log('✅ SMS Device Activated:', { userId, deviceId, phoneNumber: device.phoneNumber });
      return true;
    } else {
      this.challenges.set(challenge.id, challenge);
      return false;
    }
  }

  /**
   * Setup WebAuthn authenticator
   */
  async setupWebAuthn(userId: string, deviceName: string): Promise<{
    device: MFADevice;
    challenge: string;
    options: any;
  }> {
    const device: MFADevice = {
      id: uuidv4(),
      userId,
      type: MFAType.WEBAUTHN,
      name: deviceName,
      isActive: false,
      createdAt: new Date(),
      metadata: {
        attestationType: 'none',
        transport: []
      }
    };

    this.devices.set(device.id, device);
    this.addDeviceToUser(userId, device.id);

    // Generate WebAuthn challenge
    const challengeBytes = crypto.randomBytes(32);
    const challenge = challengeBytes.toString('base64url');

    // Create WebAuthn registration options
    const options = {
      challenge,
      rp: {
        id: this.config.webauthn.rpId,
        name: this.config.webauthn.rpName
      },
      user: {
        id: Buffer.from(userId).toString('base64url'),
        name: userId,
        displayName: `User ${userId}`
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' }, // ES256
        { alg: -257, type: 'public-key' } // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'cross-platform',
        userVerification: 'preferred',
        residentKey: 'preferred'
      },
      timeout: 60000,
      attestation: 'none'
    };

    // Store challenge for verification
    const mfaChallenge: MFAChallenge = {
      id: uuidv4(),
      userId,
      deviceId: device.id,
      type: MFAType.WEBAUTHN,
      challenge,
      expiresAt: new Date(Date.now() + 60 * 1000), // 1 minute
      attempts: 0,
      maxAttempts: 3,
      isCompleted: false,
      metadata: { setupVerification: true, options }
    };

    this.challenges.set(mfaChallenge.id, mfaChallenge);

    this.emit('webauthnSetupStarted', { userId, deviceId: device.id });

    return {
      device,
      challenge,
      options
    };
  }

  /**
   * Verify WebAuthn setup (simplified - in production would verify attestation)
   */
  async verifyWebAuthnSetup(
    userId: string, 
    deviceId: string, 
    credentialId: string, 
    publicKey: string
  ): Promise<boolean> {
    const device = this.devices.get(deviceId);
    if (!device || device.userId !== userId || device.type !== MFAType.WEBAUTHN) {
      return false;
    }

    // Find setup verification challenge
    const challenge = Array.from(this.challenges.values()).find(c => 
      c.deviceId === deviceId && 
      c.type === MFAType.WEBAUTHN && 
      c.metadata.setupVerification === true &&
      !c.isCompleted
    );

    if (!challenge || challenge.expiresAt < new Date()) {
      return false;
    }

    // In production, you would verify the attestation here
    // For now, we'll accept the credential
    device.credentialId = credentialId;
    device.publicKey = publicKey;
    device.isActive = true;
    device.lastUsedAt = new Date();

    this.devices.set(deviceId, device);
    this.challenges.delete(challenge.id);

    this.emit('webauthnActivated', { userId, deviceId, credentialId });
    console.log('✅ WebAuthn Device Activated:', { userId, deviceId, deviceName: device.name });
    return true;
  }

  /**
   * Initiate MFA challenge for authentication
   */
  async createMFAChallenge(userId: string, deviceId?: string): Promise<{
    challengeId: string;
    type: MFAType;
    deviceName: string;
    phoneNumber?: string;
    options?: any; // For WebAuthn
  }> {
    const userDeviceIds = this.userDevices.get(userId);
    if (!userDeviceIds || userDeviceIds.size === 0) {
      throw new Error('No MFA devices found for user');
    }

    let device: MFADevice | undefined;

    if (deviceId) {
      device = this.devices.get(deviceId);
      if (!device || device.userId !== userId || !device.isActive) {
        throw new Error('Invalid or inactive MFA device');
      }
    } else {
      // Use first active device
      for (const id of userDeviceIds) {
        const d = this.devices.get(id);
        if (d && d.isActive) {
          device = d;
          break;
        }
      }
    }

    if (!device) {
      throw new Error('No active MFA devices found');
    }

    const challengeId = uuidv4();
    const challenge: MFAChallenge = {
      id: challengeId,
      userId,
      deviceId: device.id,
      type: device.type,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      attempts: 0,
      maxAttempts: 3,
      isCompleted: false,
      metadata: {}
    };

    // Handle type-specific challenge creation
    switch (device.type) {
      case MFAType.SMS:
        const smsCode = this.generateSMSCode();
        challenge.code = smsCode;
        await this.sendSMS(device.phoneNumber!, `Your FANZ login code is: ${smsCode}. Valid for 5 minutes.`);
        break;

      case MFAType.WEBAUTHN:
        const webauthnChallenge = crypto.randomBytes(32).toString('base64url');
        challenge.challenge = webauthnChallenge;
        challenge.metadata.options = {
          challenge: webauthnChallenge,
          timeout: 60000,
          rpId: this.config.webauthn.rpId,
          allowCredentials: [{
            type: 'public-key',
            id: device.credentialId
          }]
        };
        break;

      case MFAType.TOTP:
        // No additional setup needed - user provides code from authenticator
        break;
    }

    this.challenges.set(challengeId, challenge);

    this.emit('mfaChallengeCreated', { userId, deviceId: device.id, type: device.type });

    return {
      challengeId,
      type: device.type,
      deviceName: device.name,
      phoneNumber: device.type === MFAType.SMS ? this.maskPhoneNumber(device.phoneNumber!) : undefined,
      options: challenge.metadata.options
    };
  }

  /**
   * Verify MFA challenge
   */
  async verifyMFAChallenge(challengeId: string, code: string): Promise<{
    result: MFAVerificationResult;
    remainingAttempts?: number;
  }> {
    const challenge = this.challenges.get(challengeId);
    if (!challenge) {
      return { result: MFAVerificationResult.INVALID_CODE };
    }

    if (challenge.expiresAt < new Date()) {
      this.challenges.delete(challengeId);
      return { result: MFAVerificationResult.EXPIRED };
    }

    if (challenge.attempts >= challenge.maxAttempts) {
      this.challenges.delete(challengeId);
      return { result: MFAVerificationResult.TOO_MANY_ATTEMPTS };
    }

    challenge.attempts++;

    const device = this.devices.get(challenge.deviceId);
    if (!device) {
      return { result: MFAVerificationResult.DEVICE_NOT_FOUND };
    }

    let verified = false;

    switch (challenge.type) {
      case MFAType.TOTP:
        verified = speakeasy.totp.verify({
          secret: device.secret!,
          encoding: 'base32',
          token: code,
          window: this.config.totpWindow
        });
        break;

      case MFAType.SMS:
        verified = challenge.code === code;
        break;

      case MFAType.RECOVERY_CODE:
        verified = this.verifyRecoveryCode(challenge.userId, code);
        break;

      case MFAType.WEBAUTHN:
        // In production, verify WebAuthn assertion
        // For now, accept any non-empty code
        verified = code.length > 0;
        break;
    }

    if (verified) {
      challenge.isCompleted = true;
      device.lastUsedAt = new Date();
      
      this.devices.set(device.id, device);
      this.challenges.delete(challengeId);

      this.emit('mfaVerificationSuccess', { 
        userId: challenge.userId, 
        deviceId: device.id, 
        type: device.type 
      });

      return { result: MFAVerificationResult.SUCCESS };
    } else {
      this.challenges.set(challengeId, challenge);
      return { 
        result: MFAVerificationResult.INVALID_CODE,
        remainingAttempts: challenge.maxAttempts - challenge.attempts
      };
    }
  }

  /**
   * Get user's MFA devices
   */
  getUserDevices(userId: string): MFADevice[] {
    const deviceIds = this.userDevices.get(userId);
    if (!deviceIds) return [];

    return Array.from(deviceIds)
      .map(id => this.devices.get(id))
      .filter(device => device !== undefined)
      .map(device => ({
        ...device!,
        secret: undefined, // Don't expose secrets
        publicKey: undefined // Don't expose keys
      }));
  }

  /**
   * Remove MFA device
   */
  async removeMFADevice(userId: string, deviceId: string): Promise<boolean> {
    const device = this.devices.get(deviceId);
    if (!device || device.userId !== userId) {
      return false;
    }

    this.devices.delete(deviceId);
    const userDeviceIds = this.userDevices.get(userId);
    if (userDeviceIds) {
      userDeviceIds.delete(deviceId);
    }

    this.emit('mfaDeviceRemoved', { userId, deviceId, type: device.type });
    console.log('🗑️ MFA Device Removed:', { userId, deviceId, deviceName: device.name });
    return true;
  }

  /**
   * Check if user has MFA enabled
   */
  hasMFAEnabled(userId: string): boolean {
    const deviceIds = this.userDevices.get(userId);
    if (!deviceIds) return false;

    return Array.from(deviceIds).some(id => {
      const device = this.devices.get(id);
      return device && device.isActive;
    });
  }

  /**
   * Generate recovery codes for user
   */
  private generateRecoveryCodes(userId: string): string[] {
    const codes: string[] = [];
    const codeSet = new Set<string>();

    for (let i = 0; i < this.config.recoveryCodes.count; i++) {
      let code: string;
      do {
        code = this.generateRandomCode(this.config.recoveryCodes.length);
      } while (codeSet.has(code));
      
      codes.push(code);
      codeSet.add(code);
    }

    this.recoveryCodes.set(userId, codeSet);
    return codes;
  }

  /**
   * Verify recovery code
   */
  private verifyRecoveryCode(userId: string, code: string): boolean {
    const codes = this.recoveryCodes.get(userId);
    if (!codes || !codes.has(code)) {
      return false;
    }

    // Remove used code
    codes.delete(code);
    if (codes.size === 0) {
      this.recoveryCodes.delete(userId);
    }

    return true;
  }

  /**
   * Generate SMS verification code
   */
  private generateSMSCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Generate random recovery code
   */
  private generateRandomCode(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Send SMS (mock implementation)
   */
  private async sendSMS(phoneNumber: string, message: string): Promise<boolean> {
    if (this.config.smsProvider === 'mock') {
      console.log('📱 Mock SMS:', { phoneNumber: this.maskPhoneNumber(phoneNumber), message });
      return true;
    }

    // In production, integrate with Twilio, AWS SNS, etc.
    throw new Error('SMS provider not implemented');
  }

  /**
   * Mask phone number for privacy
   */
  private maskPhoneNumber(phoneNumber: string): string {
    if (phoneNumber.length <= 4) return phoneNumber;
    return phoneNumber.substring(0, 3) + '****' + phoneNumber.substring(phoneNumber.length - 2);
  }

  /**
   * Add device to user's device list
   */
  private addDeviceToUser(userId: string, deviceId: string): void {
    if (!this.userDevices.has(userId)) {
      this.userDevices.set(userId, new Set());
    }
    this.userDevices.get(userId)!.add(deviceId);
  }

  /**
   * Cleanup expired challenges
   */
  private startCleanupInterval(): void {
    setInterval(() => {
      const now = new Date();
      for (const [id, challenge] of this.challenges) {
        if (challenge.expiresAt < now) {
          this.challenges.delete(id);
        }
      }
    }, 60 * 1000); // Every minute
  }

  /**
   * Get MFA statistics
   */
  getMFAStats(): {
    totalUsers: number;
    totalDevices: number;
    devicesByType: Record<MFAType, number>;
    activeChallenges: number;
  } {
    const stats = {
      totalUsers: this.userDevices.size,
      totalDevices: this.devices.size,
      devicesByType: {} as Record<MFAType, number>,
      activeChallenges: this.challenges.size
    };

    // Initialize counters
    Object.values(MFAType).forEach(type => {
      stats.devicesByType[type] = 0;
    });

    // Count devices by type
    for (const device of this.devices.values()) {
      if (device.isActive) {
        stats.devicesByType[device.type]++;
      }
    }

    return stats;
  }
}

export default MFAService;