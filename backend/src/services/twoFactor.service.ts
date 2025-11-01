/**
 * Two-Factor Authentication Service
 * Handles TOTP (Time-based One-Time Password) and backup codes
 */

import crypto from 'crypto';
import { db } from '../config/database';
import { Logger } from '../utils/logger';
import { encryptionService } from '../security/EncryptionService';

const logger = new Logger('TwoFactorService');

export interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export class TwoFactorService {

  /**
   * Generate a random base32 secret for TOTP
   * Base32 alphabet as per RFC 4648
   */
  private generateSecret(): string {
    const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const secretLength = 32;
    let secret = '';

    for (let i = 0; i < secretLength; i++) {
      const randomIndex = crypto.randomInt(0, base32Chars.length);
      secret += base32Chars[randomIndex];
    }

    return secret;
  }

  /**
   * Generate backup codes for 2FA recovery
   */
  private generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];

    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric code
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }

    return codes;
  }

  /**
   * Generate TOTP code from secret and time
   * Implements RFC 6238 TOTP algorithm
   */
  private generateTOTP(secret: string, timeStep: number = 30): string {
    try {
      // Decode base32 secret
      const key = this.base32Decode(secret);

      // Get current time counter (30-second intervals)
      const counter = Math.floor(Date.now() / 1000 / timeStep);

      // Convert counter to 8-byte buffer (big-endian)
      const counterBuffer = Buffer.alloc(8);
      for (let i = 7; i >= 0; i--) {
        counterBuffer[i] = counter & 0xff;
        counterBuffer[i - 1] = (counter >> 8) & 0xff;
        counterBuffer[i - 2] = (counter >> 16) & 0xff;
        counterBuffer[i - 3] = (counter >> 24) & 0xff;
        break;
      }

      // Generate HMAC-SHA1
      const hmac = crypto.createHmac('sha1', key);
      hmac.update(counterBuffer);
      const hmacResult = hmac.digest();

      // Dynamic truncation
      const offset = hmacResult[hmacResult.length - 1] & 0xf;
      const code = (
        ((hmacResult[offset] & 0x7f) << 24) |
        ((hmacResult[offset + 1] & 0xff) << 16) |
        ((hmacResult[offset + 2] & 0xff) << 8) |
        (hmacResult[offset + 3] & 0xff)
      );

      // Return 6-digit code
      const otp = (code % 1000000).toString().padStart(6, '0');
      return otp;
    } catch (error) {
      logger.error('Failed to generate TOTP', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Decode base32 string to buffer
   */
  private base32Decode(base32: string): Buffer {
    const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const bits: number[] = [];

    for (const char of base32.toUpperCase()) {
      const val = base32Chars.indexOf(char);
      if (val === -1) continue;

      for (let i = 4; i >= 0; i--) {
        bits.push((val >> i) & 1);
      }
    }

    const bytes: number[] = [];
    for (let i = 0; i < bits.length; i += 8) {
      if (i + 8 <= bits.length) {
        let byte = 0;
        for (let j = 0; j < 8; j++) {
          byte = (byte << 1) | bits[i + j];
        }
        bytes.push(byte);
      }
    }

    return Buffer.from(bytes);
  }

  /**
   * Verify TOTP code against secret
   * Allows for time drift (±1 time step)
   */
  verifyTOTP(secret: string, code: string, timeStep: number = 30): boolean {
    try {
      // Check current time window
      const currentCode = this.generateTOTP(secret, timeStep);
      if (code === currentCode) {
        return true;
      }

      // Check previous time window (allow 30s drift)
      const previousCounter = Math.floor(Date.now() / 1000 / timeStep) - 1;
      const previousCode = this.generateTOTP(secret, timeStep);
      if (code === previousCode) {
        return true;
      }

      // Check next time window (allow 30s drift)
      const nextCounter = Math.floor(Date.now() / 1000 / timeStep) + 1;
      const nextCode = this.generateTOTP(secret, timeStep);
      if (code === nextCode) {
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Failed to verify TOTP', {
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * Setup 2FA for a user
   */
  async setup2FA(userId: string, username: string): Promise<TwoFactorSetup> {
    try {
      // Generate secret and backup codes
      const secret = this.generateSecret();
      const backupCodes = this.generateBackupCodes(10);

      // Encrypt secret and backup codes for storage
      const encryptedSecret = encryptionService.encrypt(secret);
      const encryptedBackupCodes = backupCodes.map(code => encryptionService.encrypt(code));

      // Store in database (but don't enable 2FA yet - user must verify first)
      await db.query(
        `UPDATE users
         SET two_factor_secret = $1,
             two_factor_backup_codes = $2,
             updated_at = NOW()
         WHERE id = $3`,
        [encryptedSecret, JSON.stringify(encryptedBackupCodes), userId]
      );

      // Generate QR code data (otpauth:// URL)
      const issuer = 'FANZ';
      const qrCodeData = `otpauth://totp/${issuer}:${username}?secret=${secret}&issuer=${issuer}`;

      logger.info('2FA setup initiated', { userId });

      return {
        secret,
        qrCode: qrCodeData,
        backupCodes
      };
    } catch (error) {
      logger.error('Failed to setup 2FA', {
        error: error instanceof Error ? error.message : String(error),
        userId
      });
      throw error;
    }
  }

  /**
   * Enable 2FA after user verifies they can generate codes
   */
  async enable2FA(userId: string, verificationCode: string): Promise<boolean> {
    try {
      // Get user's 2FA secret
      const result = await db.query(
        `SELECT two_factor_secret FROM users WHERE id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        logger.warn('User not found for 2FA enable', { userId });
        return false;
      }

      const encryptedSecret = result.rows[0].two_factor_secret;

      if (!encryptedSecret) {
        logger.warn('No 2FA secret found for user', { userId });
        return false;
      }

      // Decrypt secret
      const secret = encryptionService.decrypt(encryptedSecret);

      // Verify the code
      const isValid = this.verifyTOTP(secret, verificationCode);

      if (!isValid) {
        logger.warn('Invalid 2FA verification code', { userId });
        return false;
      }

      // Enable 2FA
      await db.query(
        `UPDATE users
         SET two_factor_enabled = true,
             updated_at = NOW()
         WHERE id = $1`,
        [userId]
      );

      logger.info('2FA enabled successfully', { userId });

      return true;
    } catch (error) {
      logger.error('Failed to enable 2FA', {
        error: error instanceof Error ? error.message : String(error),
        userId
      });
      throw error;
    }
  }

  /**
   * Disable 2FA
   */
  async disable2FA(userId: string, verificationCode: string): Promise<boolean> {
    try {
      // Get user's 2FA secret
      const result = await db.query(
        `SELECT two_factor_secret, two_factor_enabled FROM users WHERE id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        logger.warn('User not found for 2FA disable', { userId });
        return false;
      }

      const { two_factor_secret: encryptedSecret, two_factor_enabled: enabled } = result.rows[0];

      if (!enabled) {
        logger.warn('2FA not enabled for user', { userId });
        return false;
      }

      if (!encryptedSecret) {
        logger.warn('No 2FA secret found for user', { userId });
        return false;
      }

      // Decrypt secret
      const secret = encryptionService.decrypt(encryptedSecret);

      // Verify the code
      const isValid = this.verifyTOTP(secret, verificationCode);

      if (!isValid) {
        logger.warn('Invalid 2FA verification code for disable', { userId });
        return false;
      }

      // Disable 2FA and clear secrets
      await db.query(
        `UPDATE users
         SET two_factor_enabled = false,
             two_factor_secret = NULL,
             two_factor_backup_codes = NULL,
             updated_at = NOW()
         WHERE id = $1`,
        [userId]
      );

      logger.info('2FA disabled successfully', { userId });

      return true;
    } catch (error) {
      logger.error('Failed to disable 2FA', {
        error: error instanceof Error ? error.message : String(error),
        userId
      });
      throw error;
    }
  }

  /**
   * Verify 2FA code during login
   */
  async verify2FA(userId: string, code: string): Promise<boolean> {
    try {
      // Get user's 2FA data
      const result = await db.query(
        `SELECT two_factor_secret, two_factor_backup_codes FROM users WHERE id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        logger.warn('User not found for 2FA verify', { userId });
        return false;
      }

      const { two_factor_secret: encryptedSecret, two_factor_backup_codes: encryptedBackupCodesJson } = result.rows[0];

      if (!encryptedSecret) {
        logger.warn('No 2FA secret found for user', { userId });
        return false;
      }

      // Decrypt secret
      const secret = encryptionService.decrypt(encryptedSecret);

      // Try TOTP first
      const isTOTPValid = this.verifyTOTP(secret, code);

      if (isTOTPValid) {
        logger.info('2FA verified with TOTP', { userId });
        return true;
      }

      // Try backup codes
      if (encryptedBackupCodesJson) {
        const encryptedBackupCodes: string[] = JSON.parse(encryptedBackupCodesJson);

        for (let i = 0; i < encryptedBackupCodes.length; i++) {
          const backupCode = encryptionService.decrypt(encryptedBackupCodes[i]);

          if (code.toUpperCase() === backupCode.toUpperCase()) {
            // Remove used backup code
            encryptedBackupCodes.splice(i, 1);

            await db.query(
              `UPDATE users
               SET two_factor_backup_codes = $1,
                   updated_at = NOW()
               WHERE id = $2`,
              [JSON.stringify(encryptedBackupCodes), userId]
            );

            logger.info('2FA verified with backup code', { userId, remainingCodes: encryptedBackupCodes.length });
            return true;
          }
        }
      }

      logger.warn('Invalid 2FA code', { userId });
      return false;
    } catch (error) {
      logger.error('Failed to verify 2FA', {
        error: error instanceof Error ? error.message : String(error),
        userId
      });
      return false;
    }
  }

  /**
   * Check if user has 2FA enabled
   */
  async is2FAEnabled(userId: string): Promise<boolean> {
    try {
      const result = await db.query(
        `SELECT two_factor_enabled FROM users WHERE id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return false;
      }

      return result.rows[0].two_factor_enabled || false;
    } catch (error) {
      logger.error('Failed to check 2FA status', {
        error: error instanceof Error ? error.message : String(error),
        userId
      });
      return false;
    }
  }
}

// Singleton instance
export const twoFactorService = new TwoFactorService();

export default TwoFactorService;
