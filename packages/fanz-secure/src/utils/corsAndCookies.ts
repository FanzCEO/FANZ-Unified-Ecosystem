import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Configuration interfaces
export interface CORSConfig {
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  credentials: boolean;
  maxAge: number;
  environment: 'development' | 'staging' | 'production';
}

export interface CookieConfig {
  secure: boolean;
  httpOnly: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  maxAge: number;
  domain?: string;
  path: string;
  signed: boolean;
}

export interface SessionConfig {
  name: string;
  secret: string;
  rotationInterval: number; // minutes
  maxAge: number; // milliseconds
  cookieConfig: CookieConfig;
}

// Environment-specific CORS configurations
export const CORS_CONFIGS: Record<string, CORSConfig> = {
  development: {
    allowedOrigins: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:8080',
      'https://dev.fanz.local'
    ],
    allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-CSRF-Token',
      'X-Request-ID',
      'Accept',
      'Origin'
    ],
    exposedHeaders: ['X-Request-ID', 'X-Rate-Limit-Remaining'],
    credentials: true,
    maxAge: 86400, // 24 hours
    environment: 'development'
  },
  staging: {
    allowedOrigins: [
      'https://staging.fanz.com',
      'https://staging-admin.fanz.com',
      'https://staging-dash.fanz.com'
    ],
    allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-CSRF-Token',
      'X-Request-ID',
      'Accept'
    ],
    exposedHeaders: ['X-Request-ID'],
    credentials: true,
    maxAge: 3600, // 1 hour
    environment: 'staging'
  },
  production: {
    allowedOrigins: [
      'https://fanz.com',
      'https://www.fanz.com',
      'https://admin.fanz.com',
      'https://dash.fanz.com',
      'https://api.fanz.com'
    ],
    allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-CSRF-Token',
      'X-Request-ID'
    ],
    exposedHeaders: ['X-Request-ID'],
    credentials: true,
    maxAge: 3600, // 1 hour
    environment: 'production'
  }
};

// Default secure cookie configurations
export const SECURE_COOKIE_CONFIGS: Record<string, CookieConfig> = {
  session: {
    secure: true,
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/',
    signed: true
  },
  csrf: {
    secure: true,
    httpOnly: false, // CSRF tokens need to be readable by JavaScript
    sameSite: 'strict',
    maxAge: 4 * 60 * 60 * 1000, // 4 hours
    path: '/',
    signed: false
  },
  auth: {
    secure: true,
    httpOnly: true,
    sameSite: 'lax', // Allow for some cross-site scenarios
    maxAge: 15 * 60 * 1000, // 15 minutes
    path: '/',
    signed: true
  },
  refresh: {
    secure: true,
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/auth',
    signed: true
  }
};

// Validation schemas
const OriginSchema = z.string().url().or(z.literal('*'));
const MethodSchema = z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']);

// CORS utilities
export class CORSManager {
  private config: CORSConfig;

  constructor(environment: string = process.env.NODE_ENV || 'development') {
    this.config = CORS_CONFIGS[environment] || CORS_CONFIGS.development;
  }

  /**
   * Validates if an origin is allowed
   */
  isOriginAllowed(origin: string | undefined): boolean {
    if (!origin) return false;

    // Check against allowed origins
    return this.config.allowedOrigins.some(allowed => {
      if (allowed === '*') return true;
      if (allowed === origin) return true;
      
      // Support wildcard subdomains (e.g., *.fanz.com)
      if (allowed.startsWith('*.')) {
        const domain = allowed.slice(2);
        return origin.endsWith('.' + domain) || origin === 'https://' + domain;
      }
      
      return false;
    });
  }

  /**
   * CORS middleware with strict origin validation
   */
  corsMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const origin = req.headers.origin;

      // Always set Vary header
      res.header('Vary', 'Origin');

      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        if (this.isOriginAllowed(origin)) {
          res.header('Access-Control-Allow-Origin', origin);
          res.header('Access-Control-Allow-Methods', this.config.allowedMethods.join(', '));
          res.header('Access-Control-Allow-Headers', this.config.allowedHeaders.join(', '));
          res.header('Access-Control-Max-Age', this.config.maxAge.toString());
          
          if (this.config.credentials) {
            res.header('Access-Control-Allow-Credentials', 'true');
          }
        }
        
        return res.status(204).end();
      }

      // Handle actual requests
      if (this.isOriginAllowed(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
        
        if (this.config.exposedHeaders.length > 0) {
          res.header('Access-Control-Expose-Headers', this.config.exposedHeaders.join(', '));
        }
        
        if (this.config.credentials) {
          res.header('Access-Control-Allow-Credentials', 'true');
        }
      } else if (origin && this.config.environment === 'production') {
        // Log suspicious origin attempts in production
        console.warn(`[CORS] Blocked request from unauthorized origin: ${origin}`);
      }

      next();
    };
  }

  /**
   * Strict CORS middleware that rejects unauthorized origins
   */
  strictCorsMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const origin = req.headers.origin;

      // Always require Origin header for non-GET requests in production
      if (this.config.environment === 'production' && 
          req.method !== 'GET' && 
          req.method !== 'HEAD' && 
          !origin) {
        return res.status(403).json({ 
          error: 'Origin header required',
          code: 'MISSING_ORIGIN'
        });
      }

      if (origin && !this.isOriginAllowed(origin)) {
        return res.status(403).json({ 
          error: 'Origin not allowed',
          code: 'FORBIDDEN_ORIGIN'
        });
      }

      // Apply standard CORS headers
      return this.corsMiddleware()(req, res, next);
    };
  }
}

// Cookie management utilities
export class SecureCookieManager {
  private environment: string;

  constructor(environment: string = process.env.NODE_ENV || 'development') {
    this.environment = environment;
  }

  /**
   * Sets a secure cookie with proper configuration
   */
  setSecureCookie(
    res: Response, 
    name: string, 
    value: string, 
    type: keyof typeof SECURE_COOKIE_CONFIGS = 'session',
    overrides: Partial<CookieConfig> = {}
  ): void {
    const config = { ...SECURE_COOKIE_CONFIGS[type], ...overrides };

    // In development, allow non-HTTPS
    if (this.environment === 'development') {
      config.secure = false;
    }

    const options = {
      httpOnly: config.httpOnly,
      secure: config.secure,
      sameSite: config.sameSite as any,
      maxAge: config.maxAge,
      path: config.path,
      signed: config.signed,
      ...(config.domain && { domain: config.domain })
    };

    res.cookie(name, value, options);
  }

  /**
   * Clears a cookie securely
   */
  clearSecureCookie(
    res: Response, 
    name: string, 
    type: keyof typeof SECURE_COOKIE_CONFIGS = 'session'
  ): void {
    const config = SECURE_COOKIE_CONFIGS[type];
    
    res.clearCookie(name, {
      path: config.path,
      ...(config.domain && { domain: config.domain }),
      secure: this.environment !== 'development',
      httpOnly: config.httpOnly,
      sameSite: config.sameSite as any
    });
  }

  /**
   * Cookie security middleware
   */
  cookieSecurityMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Override res.cookie to enforce security defaults
      const originalCookie = res.cookie;
      
      res.cookie = function(name: string, value: any, options: any = {}) {
        const secureOptions = {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          ...options
        };

        return originalCookie.call(this, name, value, secureOptions);
      };

      next();
    };
  }
}

// Session management utilities
export class SessionManager {
  private config: SessionConfig;
  private activeSessions = new Map<string, { lastRotation: Date; userId: string }>();

  constructor(config: Partial<SessionConfig> = {}) {
    this.config = {
      name: 'fanz-session',
      secret: process.env.SESSION_SECRET || 'dev-secret-key',
      rotationInterval: 30, // 30 minutes
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      cookieConfig: SECURE_COOKIE_CONFIGS.session,
      ...config
    };
  }

  /**
   * Creates a new session
   */
  createSession(res: Response, userId: string): string {
    const sessionId = this.generateSecureSessionId();
    
    this.activeSessions.set(sessionId, {
      lastRotation: new Date(),
      userId
    });

    const cookieManager = new SecureCookieManager();
    cookieManager.setSecureCookie(
      res, 
      this.config.name, 
      sessionId, 
      'session',
      this.config.cookieConfig
    );

    return sessionId;
  }

  /**
   * Validates and rotates session if needed
   */
  validateAndRotateSession(req: Request, res: Response): string | null {
    const sessionId = req.signedCookies?.[this.config.name] || req.cookies?.[this.config.name];
    
    if (!sessionId) return null;

    const session = this.activeSessions.get(sessionId);
    if (!session) return null;

    // Check if session needs rotation
    const now = new Date();
    const timeSinceRotation = now.getTime() - session.lastRotation.getTime();
    const rotationDue = timeSinceRotation > (this.config.rotationInterval * 60 * 1000);

    if (rotationDue) {
      // Rotate session ID
      this.activeSessions.delete(sessionId);
      return this.createSession(res, session.userId);
    }

    return sessionId;
  }

  /**
   * Destroys a session
   */
  destroySession(req: Request, res: Response, sessionId?: string): void {
    const targetSessionId = sessionId || req.signedCookies?.[this.config.name] || req.cookies?.[this.config.name];
    
    if (targetSessionId) {
      this.activeSessions.delete(targetSessionId);
    }

    const cookieManager = new SecureCookieManager();
    cookieManager.clearSecureCookie(res, this.config.name, 'session');
  }

  /**
   * Session management middleware
   */
  sessionMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Validate and potentially rotate session
      const sessionId = this.validateAndRotateSession(req, res);
      
      if (sessionId) {
        req.sessionId = sessionId;
        req.session = this.activeSessions.get(sessionId);
      }

      next();
    };
  }

  /**
   * Generates a cryptographically secure session ID
   */
  private generateSecureSessionId(): string {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Cleanup expired sessions
   */
  cleanupExpiredSessions(): void {
    const now = new Date();
    const maxAge = this.config.maxAge;

    for (const [sessionId, session] of this.activeSessions) {
      const age = now.getTime() - session.lastRotation.getTime();
      if (age > maxAge) {
        this.activeSessions.delete(sessionId);
      }
    }
  }
}

// Cache control utilities
export class CacheControlManager {
  /**
   * Sets no-cache headers for sensitive endpoints
   */
  static noCacheMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      next();
    };
  }

  /**
   * Sets appropriate cache headers based on route type
   */
  static smartCacheMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // No cache for auth/finance endpoints
      if (req.path.includes('/auth') || 
          req.path.includes('/payment') || 
          req.path.includes('/finance') ||
          req.path.includes('/admin')) {
        return CacheControlManager.noCacheMiddleware()(req, res, next);
      }

      // Default caching for other endpoints
      res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes
      next();
    };
  }
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      sessionId?: string;
      session?: { lastRotation: Date; userId: string };
    }
  }
}

// Export utilities
export {
  CORSManager,
  SecureCookieManager,
  SessionManager,
  CacheControlManager
};