import crypto from 'crypto';
import { z } from 'zod';
import * as ipUtils from 'ip';
import safeRegex from 'safe-regex';

/**
 * Security utility functions for the FANZ ecosystem
 * Provides cryptographic helpers, validation utilities, and common security patterns
 */

// =============================================================================
// CRYPTOGRAPHIC UTILITIES
// =============================================================================

/**
 * Generate cryptographically secure random bytes
 */
export function generateSecureRandom(length: number): Buffer {
  if (length <= 0 || length > 1024) {
    throw new Error('Invalid length: must be between 1 and 1024 bytes');
  }
  return crypto.randomBytes(length);
}

/**
 * Generate a cryptographically secure random string
 */
export function generateSecureRandomString(length: number, encoding: BufferEncoding = 'hex'): string {
  const validEncodings = ['hex', 'base64', 'base64url'] as const;
  if (!validEncodings.includes(encoding as any)) {
    throw new Error(`Invalid encoding: must be one of ${validEncodings.join(', ')}`);
  }
  
  const bytes = generateSecureRandom(Math.ceil(length * 0.5));
  let result = bytes.toString(encoding);
  
  // Trim to exact length if needed
  if (result.length > length) {
    result = result.substring(0, length);
  }
  
  return result;
}

/**
 * Generate a secure nonce for CSP and other security headers
 */
export function generateNonce(length: number = 32): string {
  return generateSecureRandomString(length, 'base64url');
}

/**
 * Generate a secure token for CSRF, API keys, etc.
 */
export function generateToken(length: number = 64): string {
  return generateSecureRandomString(length, 'hex');
}

/**
 * Secure HMAC generation
 */
export function generateHMAC(
  data: string | Buffer,
  secret: string | Buffer,
  algorithm: string = 'sha256'
): string {
  const hmac = crypto.createHmac(algorithm, secret);
  hmac.update(data);
  return hmac.digest('hex');
}

/**
 * Verify HMAC signature
 */
export function verifyHMAC(
  data: string | Buffer,
  signature: string,
  secret: string | Buffer,
  algorithm: string = 'sha256'
): boolean {
  try {
    const expectedSignature = generateHMAC(data, secret, algorithm);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch {
    return false;
  }
}

/**
 * Secure password hashing using scrypt
 */
export async function hashPassword(password: string, saltLength: number = 32): Promise<string> {
  const salt = generateSecureRandom(saltLength);
  const keyLength = 64;
  
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, keyLength, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(`${salt.toString('hex')}:${derivedKey.toString('hex')}`);
    });
  });
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    const [saltHex, keyHex] = hash.split(':');
    if (!saltHex || !keyHex) return false;
    
    const salt = Buffer.from(saltHex, 'hex');
    const key = Buffer.from(keyHex, 'hex');
    const keyLength = key.length;
    
    return new Promise((resolve, reject) => {
      crypto.scrypt(password, salt, keyLength, (err, derivedKey) => {
        if (err) reject(err);
        else resolve(crypto.timingSafeEqual(key, derivedKey));
      });
    });
  } catch {
    return false;
  }
}

// =============================================================================
// SAFE REGEX AND VALIDATION
// =============================================================================

/**
 * Validate and compile a safe regex pattern
 */
export function createSafeRegex(pattern: string, flags?: string): RegExp {
  // Check if the regex is safe (not vulnerable to ReDoS)
  if (!safeRegex(pattern)) {
    throw new Error(`Unsafe regex pattern detected: ${pattern}`);
  }
  
  try {
    return new RegExp(pattern, flags);
  } catch (error) {
    throw new Error(`Invalid regex pattern: ${pattern}`);
  }
}

/**
 * Test string against a safe regex
 */
export function testSafeRegex(input: string, pattern: string, flags?: string): boolean {
  try {
    const regex = createSafeRegex(pattern, flags);
    return regex.test(input);
  } catch {
    return false;
  }
}

/**
 * Common safe regex patterns
 */
export const SAFE_PATTERNS = {
  // Basic patterns
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  USERNAME: /^[a-zA-Z0-9_-]{3,30}$/,
  
  // File and path patterns
  SAFE_FILENAME: /^[a-zA-Z0-9._-]{1,255}$/,
  SAFE_PATH_SEGMENT: /^[a-zA-Z0-9._-]+$/,
  
  // Content patterns
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  NUMERIC: /^\d+$/,
  HEX_COLOR: /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  
  // Currency and financial
  CURRENCY_AMOUNT: /^\d+\.\d{2}$/,
  POSITIVE_INTEGER: /^[1-9]\d*$/,
  
  // URLs (basic - use proper URL parsing for complex cases)
  BASIC_URL: /^https?:\/\/[\w.-]+(?:\.[a-zA-Z]{2,})+(?:\/\S*)?$/,
} as const;

// =============================================================================
// IP ADDRESS VALIDATION AND UTILITIES
// =============================================================================

/**
 * Check if an IP address is in a private range
 */
export function isPrivateIP(ip: string): boolean {
  try {
    return ipUtils.isPrivate(ip);
  } catch {
    return false;
  }
}

/**
 * Check if an IP address is valid
 */
export function isValidIP(ip: string): boolean {
  return ipUtils.isV4Format(ip) || ipUtils.isV6Format(ip);
}

/**
 * Check if an IP is in a loopback range
 */
export function isLoopbackIP(ip: string): boolean {
  try {
    return ipUtils.isLoopback(ip);
  } catch {
    return false;
  }
}

/**
 * Normalize IP address (expand IPv6, etc.)
 */
export function normalizeIP(ip: string): string | null {
  try {
    if (ipUtils.isV4Format(ip)) return ip;
    if (ipUtils.isV6Format(ip)) return ipUtils.toLong(ip).toString();
    return null;
  } catch {
    return null;
  }
}

/**
 * Check if IP is in allowed ranges (for SSRF prevention)
 */
export function isAllowedIP(ip: string, allowPrivate: boolean = false): boolean {
  if (!isValidIP(ip)) return false;
  
  // Always block loopback
  if (isLoopbackIP(ip)) return false;
  
  // Block private ranges unless explicitly allowed
  if (!allowPrivate && isPrivateIP(ip)) return false;
  
  return true;
}

// =============================================================================
// PATH AND FILENAME SECURITY
// =============================================================================

/**
 * Sanitize a filename to prevent directory traversal and other attacks
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    throw new Error('Filename must be a non-empty string');
  }
  
  // Remove or replace dangerous characters
  let sanitized = filename
    .replace(/[\/\\:*?"<>|]/g, '_') // Replace path separators and invalid chars
    .replace(/^\./, '_') // Don't start with dot
    .replace(/\.$/, '_') // Don't end with dot
    .replace(/\s+/g, '_') // Replace whitespace with underscores
    .replace(/_+/g, '_'); // Collapse multiple underscores
  
  // Limit length
  if (sanitized.length > 255) {
    const extension = sanitized.match(/\.[^.]{1,10}$/);
    const maxBase = extension ? 255 - extension[0].length : 255;
    sanitized = sanitized.substring(0, maxBase) + (extension ? extension[0] : '');
  }
  
  // Ensure it's not empty after sanitization
  if (!sanitized || sanitized === '_') {
    sanitized = `file_${generateSecureRandomString(8)}`;
  }
  
  return sanitized;
}

/**
 * Validate and normalize a path to prevent directory traversal
 */
export function sanitizePath(inputPath: string, basePath: string): string | null {
  try {
    const path = require('path');
    
    // Resolve the full path
    const resolvedBase = path.resolve(basePath);
    const resolvedInput = path.resolve(basePath, inputPath);
    
    // Ensure the resolved path is within the base directory
    if (!resolvedInput.startsWith(resolvedBase + path.sep) && resolvedInput !== resolvedBase) {
      return null; // Directory traversal attempt
    }
    
    return resolvedInput;
  } catch {
    return null;
  }
}

// =============================================================================
// CONTENT SECURITY UTILITIES
// =============================================================================

/**
 * Strip potentially dangerous HTML tags and attributes
 */
export function sanitizeHtmlBasic(input: string): string {
  if (typeof input !== 'string') return '';
  
  // Remove script tags and their content
  let sanitized = input.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  
  // Remove dangerous event handlers
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  
  // Remove javascript: urls
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Remove data: urls (can contain embedded scripts)
  sanitized = sanitized.replace(/data:/gi, '');
  
  return sanitized;
}

/**
 * Extract and validate URLs from text content
 */
export function extractSafeUrls(text: string): string[] {
  const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
  const urls = text.match(urlRegex) || [];
  
  return urls.filter(url => {
    try {
      const parsed = new URL(url);
      // Only allow HTTP/HTTPS
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  });
}

// =============================================================================
// TIMING ATTACK PREVENTION
// =============================================================================

/**
 * Compare two strings in constant time to prevent timing attacks
 */
export function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

// =============================================================================
// ZOD VALIDATORS FOR COMMON PATTERNS
// =============================================================================

/**
 * Common zod validators for security-sensitive fields
 */
export const securityValidators = {
  // Basic types
  safeString: (maxLength: number = 1000) => 
    z.string().min(1).max(maxLength).refine(
      (val) => !val.includes('\0'), // No null bytes
      { message: 'String contains invalid characters' }
    ),
  
  // IDs and identifiers
  uuid: () => z.string().regex(SAFE_PATTERNS.UUID, 'Invalid UUID format'),
  slug: () => z.string().regex(SAFE_PATTERNS.SLUG, 'Invalid slug format'),
  username: () => z.string().regex(SAFE_PATTERNS.USERNAME, 'Invalid username format'),
  
  // File handling
  filename: () => z.string().max(255).refine(
    (val) => SAFE_PATTERNS.SAFE_FILENAME.test(val),
    { message: 'Invalid filename format' }
  ).transform(sanitizeFilename),
  
  // Network
  ipAddress: () => z.string().refine(isValidIP, { message: 'Invalid IP address' }),
  allowedIP: (allowPrivate = false) => z.string().refine(
    (ip) => isAllowedIP(ip, allowPrivate),
    { message: 'IP address not allowed' }
  ),
  
  // Financial
  currencyAmount: () => z.string().regex(SAFE_PATTERNS.CURRENCY_AMOUNT, 'Invalid currency format'),
  positiveInteger: () => z.string().regex(SAFE_PATTERNS.POSITIVE_INTEGER, 'Must be positive integer'),
  
  // Content
  safeHtml: (maxLength: number = 10000) => z.string().max(maxLength).transform(sanitizeHtmlBasic),
  
  // Pagination
  pagination: () => z.object({
    page: z.coerce.number().min(1).max(1000).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    offset: z.coerce.number().min(0).optional(),
  }),
};

// =============================================================================
// RATE LIMITING HELPERS
// =============================================================================

/**
 * Generate rate limiting keys for different contexts
 */
export function generateRateLimitKey(
  type: 'ip' | 'user' | 'api_key' | 'global',
  identifier: string,
  action?: string
): string {
  const parts = ['rl', type, identifier];
  if (action) parts.push(action);
  return parts.join(':');
}

/**
 * Calculate exponential backoff delay
 */
export function calculateBackoffDelay(attempt: number, baseDelay: number = 1000, maxDelay: number = 30000): number {
  const delay = baseDelay * Math.pow(2, attempt - 1);
  return Math.min(delay, maxDelay);
}

// =============================================================================
// SECURITY EVENT HELPERS
// =============================================================================

export interface SecurityEventData {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  timestamp?: Date;
}

/**
 * Create a standardized security event object
 */
export function createSecurityEvent(
  type: string,
  severity: SecurityEventData['severity'],
  source: string,
  metadata: Record<string, any> = {},
  context?: {
    userId?: string;
    ip?: string;
    userAgent?: string;
  }
): SecurityEventData {
  return {
    type,
    severity,
    source,
    userId: context?.userId,
    ip: context?.ip,
    userAgent: context?.userAgent,
    metadata,
    timestamp: new Date(),
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  // Cryptographic
  generateSecureRandom,
  generateSecureRandomString,
  generateNonce,
  generateToken,
  generateHMAC,
  verifyHMAC,
  hashPassword,
  verifyPassword,
  
  // Validation
  createSafeRegex,
  testSafeRegex,
  SAFE_PATTERNS,
  securityValidators,
  
  // IP and network
  isPrivateIP,
  isValidIP,
  isLoopbackIP,
  normalizeIP,
  isAllowedIP,
  
  // Path and file safety
  sanitizeFilename,
  sanitizePath,
  
  // Content security
  sanitizeHtmlBasic,
  extractSafeUrls,
  
  // Timing safety
  constantTimeEquals,
  
  // Rate limiting
  generateRateLimitKey,
  calculateBackoffDelay,
  
  // Security events
  createSecurityEvent,
};