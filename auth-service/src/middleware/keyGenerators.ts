import crypto from 'crypto';
import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { rateLimitConfig } from '../config/rateLimitConfig';

// 🔑 Privacy-Preserving Key Generators for Rate Limiting
// Ensures no PII is stored in Redis while maintaining effective rate limiting

export interface KeyGeneratorOptions {
  req: Request;
  prefix?: string;
}

/**
 * Generate IP-based rate limit key
 * Uses req.ip which should be properly set with trust proxy configuration
 */
export const generateIPKey = ({ req, prefix = '' }: KeyGeneratorOptions): string => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  return `${rateLimitConfig.redisPrefix}${prefix}ip:${ip}`;
};

/**
 * Generate account-based rate limit key for sensitive operations
 * Uses HMAC to hash account identifiers (email/username) to prevent PII storage
 */
export const generateAccountKey = ({ req, prefix = '' }: KeyGeneratorOptions): string => {
  const email = req.body?.email?.trim()?.toLowerCase();
  const username = req.body?.username?.trim()?.toLowerCase();
  
  // Use email if available, otherwise username
  const identifier = email || username;
  
  if (!identifier) {
    // Fallback to IP if no account identifier available
    return generateIPKey({ req, prefix: `${prefix}fallback:` });
  }
  
  // Create HMAC hash of the identifier to avoid storing PII
  const hash = crypto
    .createHmac('sha256', rateLimitConfig.hmacSecret)
    .update(identifier)
    .digest('hex');
  
  return `${rateLimitConfig.redisPrefix}${prefix}account:${hash}`;
};

/**
 * Generate user-based rate limit key for authenticated operations
 * Uses user ID from JWT token when available, falls back to IP
 */
export const generateUserKey = ({ req, prefix = '' }: KeyGeneratorOptions): string => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      // Don't verify the token here - just extract the userId if present
      // Verification will be handled by auth middleware later
      const decoded = jwt.decode(token) as any;
      if (decoded && decoded.userId) {
        return `${rateLimitConfig.redisPrefix}${prefix}user:${decoded.userId}`;
      }
    }
  } catch (error) {
    // If token parsing fails, fall back to IP-based limiting
    // This ensures rate limiting still works even with invalid tokens
  }
  
  // Fallback to IP-based limiting
  return generateIPKey({ req, prefix: `${prefix}fallback:` });
};

/**
 * Generate tenant-based rate limit key for multi-tenant scenarios
 * Incorporates tenant information when available in headers or JWT claims
 */
export const generateTenantKey = ({ req, prefix = '' }: KeyGeneratorOptions): string => {
  // Check for tenant in custom header first
  const tenantHeader = req.headers['x-tenant-id'] as string;
  if (tenantHeader) {
    return `${rateLimitConfig.redisPrefix}${prefix}tenant:${tenantHeader}`;
  }
  
  // Check for tenant in JWT token
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      const decoded = jwt.decode(token) as any;
      if (decoded && decoded.tenantId) {
        return `${rateLimitConfig.redisPrefix}${prefix}tenant:${decoded.tenantId}`;
      }
    }
  } catch (error) {
    // Ignore token parsing errors
  }
  
  // Fallback to IP-based limiting
  return generateIPKey({ req, prefix: `${prefix}fallback:` });
};

/**
 * Generate composite key combining multiple identifiers
 * Useful for complex rate limiting scenarios
 */
export const generateCompositeKey = (
  { req, prefix = '' }: KeyGeneratorOptions,
  keyTypes: ('ip' | 'account' | 'user' | 'tenant')[]
): string => {
  const keyParts: string[] = [];
  
  keyTypes.forEach(keyType => {
    switch (keyType) {
      case 'ip':
        keyParts.push(`ip:${req.ip || 'unknown'}`);
        break;
      case 'account':
        const email = req.body?.email?.trim()?.toLowerCase();
        const username = req.body?.username?.trim()?.toLowerCase();
        const identifier = email || username;
        if (identifier) {
          const hash = crypto
            .createHmac('sha256', rateLimitConfig.hmacSecret)
            .update(identifier)
            .digest('hex')
            .substring(0, 8); // Shorter hash for composite keys
          keyParts.push(`acc:${hash}`);
        }
        break;
      case 'user':
        try {
          const authHeader = req.headers.authorization;
          const token = authHeader && authHeader.split(' ')[1];
          if (token) {
            const decoded = jwt.decode(token) as any;
            if (decoded && decoded.userId) {
              keyParts.push(`user:${decoded.userId}`);
            }
          }
        } catch (error) {
          // Ignore errors
        }
        break;
      case 'tenant':
        const tenantId = req.headers['x-tenant-id'] as string;
        if (tenantId) {
          keyParts.push(`tenant:${tenantId}`);
        }
        break;
    }
  });
  
  const compositeKey = keyParts.join('+');
  return `${rateLimitConfig.redisPrefix}${prefix}composite:${compositeKey}`;
};

/**
 * Utility to mask sensitive data for logging
 * Shows only last few characters to aid debugging without exposing PII
 */
export const maskForLogging = (value: string, visibleChars: number = 4): string => {
  if (value.length <= visibleChars) {
    return '*'.repeat(value.length);
  }
  
  const masked = '*'.repeat(value.length - visibleChars);
  const visible = value.slice(-visibleChars);
  return `${masked}${visible}`;
};

/**
 * Extract sanitized metadata for rate limit logging
 * Removes PII while preserving useful debugging information
 */
export const extractLoggingMetadata = (req: Request) => {
  const authHeader = req.headers.authorization;
  let userId: string | undefined;
  let userRole: string | undefined;
  
  if (authHeader) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.decode(token) as any;
      userId = decoded?.userId;
      userRole = decoded?.role;
    } catch (error) {
      // Ignore token parsing errors
    }
  }
  
  return {
    method: req.method,
    path: req.path,
    ip: req.ip || 'unknown',
    userAgent: req.get('User-Agent') || 'unknown',
    userId: userId || undefined,
    userRole: userRole || undefined,
    hasEmail: !!req.body?.email,
    hasUsername: !!req.body?.username,
    tenantId: req.headers['x-tenant-id'] as string || undefined,
    timestamp: new Date().toISOString()
  };
};