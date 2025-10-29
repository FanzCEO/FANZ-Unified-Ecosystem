/**
 * Encryption Service
 * Provides encryption and decryption functionality for sensitive data
 */

import crypto from 'crypto';
import { Logger } from '../utils/logger';
import { config } from '../config';

const logger = new Logger('EncryptionService');

export interface EncryptionOptions {
  algorithm?: string;
  encoding?: BufferEncoding;
}

export class EncryptionService {
  private algorithm: string;
  private key: Buffer;
  private ivLength: number;

  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.ivLength = 16;

    // Use encryption key from config or generate one
    const encryptionKey = config.ENCRYPTION_KEY || this.generateKey();
    this.key = Buffer.from(encryptionKey, 'hex');

    if (this.key.length !== 32) {
      throw new Error('Encryption key must be 32 bytes (64 hex characters)');
    }
  }

  /**
   * Generate a random encryption key
   */
  private generateKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Encrypt data
   */
  public encrypt(plaintext: string): string {
    try {
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      // Combine iv + authTag + encrypted data
      const result = iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;

      logger.debug('Data encrypted successfully');
      return result;
    } catch (error) {
      logger.error('Encryption failed', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Decrypt data
   */
  public decrypt(ciphertext: string): string {
    try {
      const parts = ciphertext.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid ciphertext format');
      }

      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];

      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      logger.debug('Data decrypted successfully');
      return decrypted;
    } catch (error) {
      logger.error('Decryption failed', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Hash data (one-way)
   */
  public hash(data: string, algorithm: string = 'sha256'): string {
    try {
      const hash = crypto.createHash(algorithm);
      hash.update(data);
      return hash.digest('hex');
    } catch (error) {
      logger.error('Hashing failed', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Generate HMAC
   */
  public hmac(data: string, secret: string, algorithm: string = 'sha256'): string {
    try {
      const hmac = crypto.createHmac(algorithm, secret);
      hmac.update(data);
      return hmac.digest('hex');
    } catch (error) {
      logger.error('HMAC generation failed', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Generate random token
   */
  public generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Encrypt object (JSON)
   */
  public encryptObject<T>(obj: T): string {
    const json = JSON.stringify(obj);
    return this.encrypt(json);
  }

  /**
   * Decrypt object (JSON)
   */
  public decryptObject<T>(ciphertext: string): T {
    const json = this.decrypt(ciphertext);
    return JSON.parse(json);
  }
}

// Singleton instance
export const encryptionService = new EncryptionService();

export default EncryptionService;
