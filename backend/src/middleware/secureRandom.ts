import { randomBytes, randomUUID } from 'crypto';
import { Logger } from '../utils/logger';

const logger = new Logger('SecureRandom');

/**
 * Secure random generation utilities
 * Replaces all instances of Math.random() with cryptographically secure alternatives
 */
export class SecureRandom {
  /**
   * Generate cryptographically secure random bytes
   */
  static bytes(length: number): Buffer {
    try {
      return randomBytes(length);
    } catch (error) {
      logger.error('Failed to generate secure random bytes', { error, length });
      throw new Error('Failed to generate secure random bytes');
    }
  }

  /**
   * Generate cryptographically secure random string
   */
  static string(length: number = 16, encoding: BufferEncoding = 'hex'): string {
    try {
      return this.bytes(Math.ceil(length / 2)).toString(encoding).slice(0, length);
    } catch (error) {
      logger.error('Failed to generate secure random string', { error, length });
      throw new Error('Failed to generate secure random string');
    }
  }

  /**
   * Generate cryptographically secure random integer between min and max (inclusive)
   */
  static integer(min: number = 0, max: number = Number.MAX_SAFE_INTEGER): number {
    if (min >= max) {
      throw new Error('Min must be less than max');
    }

    const range = max - min + 1;
    const bytesNeeded = Math.ceil(Math.log2(range) / 8);
    const maxValidValue = Math.floor(256 ** bytesNeeded / range) * range - 1;

    let randomValue: number;
    do {
      const buffer = this.bytes(bytesNeeded);
      randomValue = buffer.readUIntBE(0, bytesNeeded);
    } while (randomValue > maxValidValue);

    return min + (randomValue % range);
  }

  /**
   * Generate cryptographically secure UUID
   */
  static uuid(): string {
    try {
      return randomUUID();
    } catch (error) {
      logger.error('Failed to generate secure UUID', { error });
      throw new Error('Failed to generate secure UUID');
    }
  }

  /**
   * Generate cryptographically secure transaction ID
   */
  static transactionId(prefix: string = 'txn'): string {
    const timestamp = Date.now();
    const randomPart = this.string(12, 'hex');
    return `${prefix}_${timestamp}_${randomPart}`;
  }

  /**
   * Generate cryptographically secure session token
   */
  static sessionToken(length: number = 32): string {
    return this.string(length, 'base64url').replace(/[^a-zA-Z0-9]/g, '').slice(0, length);
  }

  /**
   * Generate cryptographically secure API key
   */
  static apiKey(length: number = 40): string {
    return this.string(length, 'hex');
  }

  /**
   * Generate cryptographically secure nonce for CSRF protection
   */
  static nonce(length: number = 16): string {
    return this.string(length, 'base64url');
  }

  /**
   * Generate cryptographically secure OTP code
   */
  static otpCode(length: number = 6): string {
    const digits = '0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = this.integer(0, digits.length - 1);
      result += digits[randomIndex];
    }
    
    return result;
  }

  /**
   * Generate cryptographically secure password
   */
  static password(
    length: number = 16,
    options: {
      includeNumbers?: boolean;
      includeSymbols?: boolean;
      includeLowercase?: boolean;
      includeUppercase?: boolean;
    } = {}
  ): string {
    const {
      includeNumbers = true,
      includeSymbols = true,
      includeLowercase = true,
      includeUppercase = true
    } = options;

    let charset = '';
    if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeNumbers) charset += '0123456789';
    if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (!charset) {
      throw new Error('At least one character type must be included');
    }

    let result = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = this.integer(0, charset.length - 1);
      result += charset[randomIndex];
    }

    return result;
  }

  /**
   * Shuffle array using Fisher-Yates algorithm with secure randomness
   */
  static shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    
    for (let i = shuffled.length - 1; i > 0; i--) {
      const randomIndex = this.integer(0, i);
      [shuffled[i], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[i]];
    }
    
    return shuffled;
  }

  /**
   * Generate cryptographically secure boolean
   */
  static boolean(): boolean {
    return this.integer(0, 1) === 1;
  }

  /**
   * Generate cryptographically secure float between 0 and 1
   */
  static float(): number {
    const buffer = this.bytes(8);
    const uint64 = buffer.readBigUInt64BE(0);
    return Number(uint64) / Number(0xFFFFFFFFFFFFFFFFn);
  }
}

/**
 * Middleware to replace Math.random with secure alternative in request context
 */
export const secureRandomMiddleware = (req: any, res: any, next: any) => {
  // Attach secure random utilities to request object
  req.secureRandom = SecureRandom;
  
  // Log warning if Math.random is used (for development/testing)
  if (process.env.NODE_ENV === 'development') {
    const originalRandom = Math.random;
    Math.random = () => {
      logger.warn('Math.random() used instead of SecureRandom', {
        stack: new Error().stack
      });
      return originalRandom();
    };
  }
  
  next();
};

export default SecureRandom;