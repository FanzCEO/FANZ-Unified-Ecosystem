/**
 * @fanz/secure - CSRF Protection Middleware
 * Double-submit cookie CSRF protection with secure token generation
 */

import { Request, Response, NextFunction } from 'express';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { config } from '../config.js';
import { createSecurityLogger } from '../utils/logger.js';
import { emitSecurityEvent } from '../utils/securityEvents.js';
import { SecurityError } from '../types.js';

// ===============================
// TYPES & INTERFACES
// ===============================

interface CsrfOptions {
  enabled?: boolean;
  cookieName?: string;
  headerName?: string;
  secret?: string;
  sessionKey?: string;
  ignoredMethods?: string[];
  excludedPaths?: string[];
  tokenLength?: number;
  maxAge?: number;
  sameSite?: 'strict' | 'lax' | 'none';
  secure?: boolean;
  httpOnly?: boolean;
}

interface CsrfToken {
  token: string;
  hashedToken: string;
  timestamp: number;
  sessionId?: string;
  userId?: string;
}

interface CsrfRequest extends Request {
  csrfToken?: () => string;
  csrfValid?: boolean;
}

// ===============================
// CSRF TOKEN GENERATOR
// ===============================

class CsrfTokenGenerator {
  private logger = createSecurityLogger('CsrfTokenGenerator');
  private secret: string;
  private tokenLength: number;

  constructor(secret: string, tokenLength: number = 32) {
    this.secret = secret;
    this.tokenLength = tokenLength;
  }

  /**
   * Generate a CSRF token
   */
  generateToken(sessionId?: string, userId?: string): CsrfToken {
    const token = randomBytes(this.tokenLength).toString('hex');
    const timestamp = Date.now();
    
    // Create HMAC hash of the token with additional context
    const hmac = createHmac('sha256', this.secret);
    hmac.update(token);
    hmac.update(timestamp.toString());
    
    if (sessionId) {
      hmac.update(sessionId);
    }
    
    if (userId) {
      hmac.update(userId);
    }
    
    const hashedToken = hmac.digest('hex');

    this.logger.debug('CSRF token generated', {
      tokenLength: token.length,
      hasSessionId: !!sessionId,
      hasUserId: !!userId,
      timestamp
    });

    return {
      token,
      hashedToken,
      timestamp,
      sessionId,
      userId
    };
  }

  /**
   * Validate a CSRF token
   */
  validateToken(
    token: string, 
    hashedToken: string, 
    timestamp: number,
    sessionId?: string,
    userId?: string,
    maxAge: number = 24 * 60 * 60 * 1000 // 24 hours
  ): boolean {
    try {
      // Check if token is expired
      if (Date.now() - timestamp > maxAge) {
        this.logger.warn('CSRF token expired', {
          tokenAge: Date.now() - timestamp,
          maxAge
        });
        return false;
      }

      // Recreate the HMAC hash
      const hmac = createHmac('sha256', this.secret);
      hmac.update(token);
      hmac.update(timestamp.toString());
      
      if (sessionId) {
        hmac.update(sessionId);
      }
      
      if (userId) {
        hmac.update(userId);
      }
      
      const expectedHash = hmac.digest('hex');

      // Use timing-safe comparison to prevent timing attacks
      const expectedBuffer = Buffer.from(expectedHash, 'hex');
      const actualBuffer = Buffer.from(hashedToken, 'hex');

      if (expectedBuffer.length !== actualBuffer.length) {
        return false;
      }

      const isValid = timingSafeEqual(expectedBuffer, actualBuffer);

      this.logger.debug('CSRF token validation', {
        isValid,
        tokenAge: Date.now() - timestamp,
        hasSessionId: !!sessionId,
        hasUserId: !!userId
      });

      return isValid;
    } catch (error) {
      this.logger.error('CSRF token validation error', {
        error: error.message
      });
      return false;
    }
  }
}

// ===============================
// CSRF MIDDLEWARE
// ===============================

class CsrfProtection {
  private tokenGenerator: CsrfTokenGenerator;
  private logger = createSecurityLogger('CsrfProtection');
  private options: Required<CsrfOptions>;

  constructor(options: CsrfOptions = {}) {
    this.options = {
      enabled: options.enabled ?? config.security.csrf.enabled,
      cookieName: options.cookieName ?? config.security.csrf.cookieName,
      headerName: options.headerName ?? config.security.csrf.headerName,
      secret: options.secret ?? config.security.csrf.secret,
      sessionKey: options.sessionKey ?? config.security.csrf.sessionKey,
      ignoredMethods: options.ignoredMethods ?? config.security.csrf.ignoredMethods,
      excludedPaths: options.excludedPaths ?? config.security.csrf.excludedPaths,
      tokenLength: options.tokenLength ?? 32,
      maxAge: options.maxAge ?? 24 * 60 * 60 * 1000, // 24 hours
      sameSite: options.sameSite ?? 'strict',
      secure: options.secure ?? config.isProduction,
      httpOnly: options.httpOnly ?? true
    };

    this.tokenGenerator = new CsrfTokenGenerator(
      this.options.secret,
      this.options.tokenLength
    );
  }

  /**
   * CSRF middleware factory
   */
  middleware() {
    return (req: CsrfRequest, res: Response, next: NextFunction) => {
      // Skip if CSRF is disabled
      if (!this.options.enabled) {
        return next();
      }

      // Skip for excluded paths
      if (this.isExcludedPath(req.path)) {
        return next();
      }

      // Skip for ignored methods (GET, HEAD, OPTIONS)
      if (this.options.ignoredMethods.includes(req.method)) {
        this.generateTokenIfNeeded(req, res);
        return next();
      }

      // Validate CSRF token for state-changing methods
      this.validateCsrfToken(req, res, next);
    };
  }

  /**
   * Generate CSRF token and set cookie
   */
  private generateTokenIfNeeded(req: CsrfRequest, res: Response) {
    const existingToken = req.cookies?.[this.options.cookieName];
    const sessionId = (req as any).sessionId;
    const userId = (req as any).user?.id;

    // Generate new token if none exists or invalid
    if (!existingToken || !this.isValidTokenStructure(existingToken)) {
      const csrfToken = this.tokenGenerator.generateToken(sessionId, userId);
      const tokenData = this.encodeToken(csrfToken);

      // Set CSRF cookie
      res.cookie(this.options.cookieName, tokenData, {
        httpOnly: this.options.httpOnly,
        secure: this.options.secure,
        sameSite: this.options.sameSite,
        maxAge: this.options.maxAge,
        path: '/'
      });

      // Add token generator function to request
      req.csrfToken = () => csrfToken.token;

      this.logger.debug('New CSRF token generated and set', {
        cookieName: this.options.cookieName,
        sessionId,
        userId
      });
    } else {
      // Use existing token
      const decodedToken = this.decodeToken(existingToken);
      if (decodedToken) {
        req.csrfToken = () => decodedToken.token;
      }
    }
  }

  /**
   * Validate CSRF token for state-changing requests
   */
  private async validateCsrfToken(req: CsrfRequest, res: Response, next: NextFunction) {
    try {
      const cookieToken = req.cookies?.[this.options.cookieName];
      const headerToken = req.headers[this.options.headerName.toLowerCase()] as string;

      if (!cookieToken || !headerToken) {
        await this.handleCsrfViolation(req, 'Missing CSRF token');
        return this.sendCsrfError(res, 'CSRF token required');
      }

      const decodedCookieToken = this.decodeToken(cookieToken);
      if (!decodedCookieToken) {
        await this.handleCsrfViolation(req, 'Invalid cookie token format');
        return this.sendCsrfError(res, 'Invalid CSRF token');
      }

      // Validate that header token matches cookie token
      if (headerToken !== decodedCookieToken.token) {
        await this.handleCsrfViolation(req, 'Token mismatch');
        return this.sendCsrfError(res, 'CSRF token mismatch');
      }

      // Validate token signature and expiration
      const sessionId = (req as any).sessionId;
      const userId = (req as any).user?.id;

      const isValid = this.tokenGenerator.validateToken(
        decodedCookieToken.token,
        decodedCookieToken.hashedToken,
        decodedCookieToken.timestamp,
        sessionId,
        userId,
        this.options.maxAge
      );

      if (!isValid) {
        await this.handleCsrfViolation(req, 'Token validation failed');
        return this.sendCsrfError(res, 'Invalid or expired CSRF token');
      }

      // CSRF validation passed
      req.csrfValid = true;
      req.csrfToken = () => decodedCookieToken.token;

      this.logger.debug('CSRF token validation successful', {
        path: req.path,
        method: req.method,
        sessionId,
        userId
      });

      next();
    } catch (error) {
      this.logger.error('CSRF validation error', {
        error: error.message,
        path: req.path,
        method: req.method
      });

      await this.handleCsrfViolation(req, `Validation error: ${error.message}`);
      this.sendCsrfError(res, 'CSRF validation failed');
    }
  }

  /**
   * Handle CSRF violation
   */
  private async handleCsrfViolation(req: Request, reason: string) {
    await emitSecurityEvent({
      type: 'CSRF_VIOLATION',
      severity: 'HIGH',
      context: {
        requestId: (req as any).id || 'unknown',
        userId: (req as any).user?.id,
        sessionId: (req as any).sessionId,
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        timestamp: new Date(),
        path: req.path,
        method: req.method
      },
      details: {
        reason,
        referer: req.headers.referer,
        origin: req.headers.origin,
        cookies: Object.keys(req.cookies || {}),
        hasHeaderToken: !!(req.headers[this.options.headerName.toLowerCase()]),
        hasCookieToken: !!(req.cookies?.[this.options.cookieName])
      },
      timestamp: new Date()
    });

    this.logger.warn('CSRF violation detected', {
      reason,
      path: req.path,
      method: req.method,
      ip: req.ip,
      referer: req.headers.referer,
      origin: req.headers.origin
    });
  }

  /**
   * Send CSRF error response
   */
  private sendCsrfError(res: Response, message: string) {
    const error: SecurityError = new Error(message) as SecurityError;
    error.code = 'CSRF_TOKEN_MISMATCH';
    error.statusCode = 403;
    error.severity = 'HIGH';

    res.status(403).json({
      error: 'Forbidden',
      message,
      code: 'CSRF_TOKEN_MISMATCH',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Check if path is excluded from CSRF protection
   */
  private isExcludedPath(path: string): boolean {
    return this.options.excludedPaths.some(excludedPath => {
      if (excludedPath.endsWith('/')) {
        return path.startsWith(excludedPath);
      }
      return path === excludedPath || path.startsWith(excludedPath + '/');
    });
  }

  /**
   * Encode token for cookie storage
   */
  private encodeToken(csrfToken: CsrfToken): string {
    const tokenData = {
      t: csrfToken.token,
      h: csrfToken.hashedToken,
      ts: csrfToken.timestamp,
      ...(csrfToken.sessionId && { s: csrfToken.sessionId }),
      ...(csrfToken.userId && { u: csrfToken.userId })
    };

    return Buffer.from(JSON.stringify(tokenData)).toString('base64');
  }

  /**
   * Decode token from cookie
   */
  private decodeToken(encodedToken: string): CsrfToken | null {
    try {
      const tokenData = JSON.parse(Buffer.from(encodedToken, 'base64').toString());
      
      if (!tokenData.t || !tokenData.h || !tokenData.ts) {
        return null;
      }

      return {
        token: tokenData.t,
        hashedToken: tokenData.h,
        timestamp: tokenData.ts,
        sessionId: tokenData.s,
        userId: tokenData.u
      };
    } catch (error) {
      this.logger.debug('Failed to decode CSRF token', {
        error: error.message
      });
      return null;
    }
  }

  /**
   * Check if token has valid structure
   */
  private isValidTokenStructure(encodedToken: string): boolean {
    const decoded = this.decodeToken(encodedToken);
    return decoded !== null;
  }

  /**
   * Generate token for API response
   */
  getToken(req: CsrfRequest): string | null {
    if (req.csrfToken) {
      return req.csrfToken();
    }

    // Generate new token if needed
    const sessionId = (req as any).sessionId;
    const userId = (req as any).user?.id;
    const csrfToken = this.tokenGenerator.generateToken(sessionId, userId);
    
    return csrfToken.token;
  }
}

// ===============================
// MIDDLEWARE FACTORY FUNCTIONS
// ===============================

const defaultCsrfProtection = new CsrfProtection();

/**
 * Create CSRF protection middleware with default options
 */
export function csrfProtection(options?: CsrfOptions) {
  if (options) {
    const customCsrf = new CsrfProtection(options);
    return customCsrf.middleware();
  }
  
  return defaultCsrfProtection.middleware();
}

/**
 * CSRF middleware that ignores specific paths
 */
export function csrfProtectionWithExclusions(excludedPaths: string[]) {
  const customCsrf = new CsrfProtection({
    excludedPaths: [...config.security.csrf.excludedPaths, ...excludedPaths]
  });
  
  return customCsrf.middleware();
}

/**
 * Get CSRF token for API responses
 */
export function getCsrfToken(req: CsrfRequest): string | null {
  return defaultCsrfProtection.getToken(req);
}

/**
 * Middleware to add CSRF token to response locals
 */
export function csrfTokenMiddleware() {
  return (req: CsrfRequest, res: Response, next: NextFunction) => {
    // Add CSRF token to response locals for templates
    res.locals.csrfToken = getCsrfToken(req);
    next();
  };
}

/**
 * CSRF protection specifically for API endpoints
 */
export function apiCsrfProtection() {
  return new CsrfProtection({
    httpOnly: false, // Allow JavaScript access for API calls
    sameSite: 'lax', // More lenient for API usage
    excludedPaths: [
      '/api/webhooks/',
      '/api/health',
      '/api/ready',
      '/api/metrics'
    ]
  }).middleware();
}

/**
 * CSRF protection for browser-based forms
 */
export function formCsrfProtection() {
  return new CsrfProtection({
    httpOnly: true,
    sameSite: 'strict',
    secure: config.isProduction
  }).middleware();
}

// ===============================
// UTILITY FUNCTIONS
// ===============================

/**
 * Generate CSRF token for manual use
 */
export function generateCsrfToken(sessionId?: string, userId?: string): string {
  const generator = new CsrfTokenGenerator(config.security.csrf.secret);
  const token = generator.generateToken(sessionId, userId);
  return token.token;
}

/**
 * Validate CSRF token manually
 */
export function validateCsrfToken(
  token: string,
  hashedToken: string,
  timestamp: number,
  sessionId?: string,
  userId?: string
): boolean {
  const generator = new CsrfTokenGenerator(config.security.csrf.secret);
  return generator.validateToken(token, hashedToken, timestamp, sessionId, userId);
}

// ===============================
// EXPRESS INTEGRATION HELPERS
// ===============================

/**
 * Add CSRF token to JSON responses
 */
export function csrfTokenResponse() {
  return (req: CsrfRequest, res: Response, next: NextFunction) => {
    const originalJson = res.json;
    
    res.json = function(data: any) {
      const csrfToken = getCsrfToken(req);
      
      if (csrfToken && typeof data === 'object' && data !== null) {
        data._csrf = csrfToken;
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  };
}

/**
 * CSRF token endpoint for SPA applications
 */
export function csrfTokenEndpoint() {
  return (req: CsrfRequest, res: Response) => {
    const token = getCsrfToken(req);
    
    if (!token) {
      return res.status(500).json({
        error: 'Failed to generate CSRF token'
      });
    }
    
    res.json({
      csrfToken: token,
      headerName: config.security.csrf.headerName,
      timestamp: new Date().toISOString()
    });
  };
}

// ===============================
// EXPORTS
// ===============================

export {
  CsrfProtection,
  CsrfTokenGenerator,
  type CsrfOptions,
  type CsrfToken,
  type CsrfRequest
};

export default csrfProtection;