import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { Logger } from '../utils/logger';
import { createHash, randomBytes } from 'crypto';

const logger = new Logger('SecurityHardening');

// =====================================================
// SECURITY HEADERS CONFIGURATION
// =====================================================

/**
 * Comprehensive security headers middleware using Helmet
 */
export const securityHeaders = helmet({
  // Strict Transport Security - Force HTTPS
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },

  // Content Security Policy - Prevent XSS
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Required for some React apps
        "https://checkout.ccbill.com",
        "https://secure.paxum.com",
        "https://checkout.segpay.com"
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https:",
        "blob:"
      ],
      connectSrc: [
        "'self'",
        "https://api.fanz.com",
        "https://ccbill.com",
        "https://paxum.com",
        "https://segpay.com"
      ],
      frameSrc: [
        "'self'",
        "https://checkout.ccbill.com",
        "https://secure.paxum.com"
      ],
      mediaSrc: ["'self'", "https:", "blob:"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    },
    reportOnly: false
  },

  // Frame Options - Prevent clickjacking
  frameguard: {
    action: 'deny'
  },

  // Content Type Options - Prevent MIME sniffing
  noSniff: true,

  // Referrer Policy - Control referrer information
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  },

  // Cross-Origin Embedder Policy
  crossOriginEmbedderPolicy: {
    policy: 'require-corp'
  },

  // Cross-Origin Opener Policy  
  crossOriginOpenerPolicy: {
    policy: 'same-origin'
  },

  // Cross-Origin Resource Policy
  crossOriginResourcePolicy: {
    policy: 'cross-origin'
  },

  // Remove X-Powered-By header
  hidePoweredBy: true
});

// =====================================================
// CSRF PROTECTION
// =====================================================

interface CSRFTokenStore {
  [sessionId: string]: {
    token: string;
    expires: number;
  };
}

const csrfTokens: CSRFTokenStore = {};

/**
 * Generate CSRF token for session
 */
export const generateCSRFToken = (sessionId: string): string => {
  const token = randomBytes(32).toString('hex');
  const expires = Date.now() + (60 * 60 * 1000); // 1 hour

  csrfTokens[sessionId] = { token, expires };
  
  // Clean up expired tokens
  Object.keys(csrfTokens).forEach(id => {
    if (csrfTokens[id].expires < Date.now()) {
      delete csrfTokens[id];
    }
  });

  return token;
};

/**
 * CSRF protection middleware
 */
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  // Skip for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip for API routes with proper API key authentication
  if (req.path.startsWith('/api/webhooks/')) {
    return next();
  }

  const sessionId = (req as any).session?.id || req.headers['x-session-id'] as string;
  const providedToken = req.headers['x-csrf-token'] as string || req.body._csrf;

  if (!sessionId) {
    logger.warn('CSRF protection: No session ID found', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path
    });
    return res.status(403).json({
      success: false,
      error: 'CSRF_NO_SESSION',
      message: 'Session required for state-changing operations'
    });
  }

  const storedToken = csrfTokens[sessionId];
  
  if (!storedToken || storedToken.expires < Date.now()) {
    logger.warn('CSRF protection: Invalid or expired token', {
      sessionId,
      ip: req.ip,
      path: req.path
    });
    return res.status(403).json({
      success: false,
      error: 'CSRF_INVALID_TOKEN',
      message: 'Invalid or expired CSRF token'
    });
  }

  if (storedToken.token !== providedToken) {
    logger.warn('CSRF protection: Token mismatch', {
      sessionId,
      ip: req.ip,
      path: req.path,
      providedTokenHash: createHash('sha256').update(providedToken || '').digest('hex').substring(0, 8)
    });
    return res.status(403).json({
      success: false,
      error: 'CSRF_TOKEN_MISMATCH',
      message: 'CSRF token validation failed'
    });
  }

  next();
};

// =====================================================
// RATE LIMITING & DDOS PROTECTION
// =====================================================

/**
 * General API rate limiting
 */
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests from this IP, please try again later',
    retryAfter: 900 // 15 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method
    });
    
    res.status(429).json({
      success: false,
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later',
      retryAfter: 900
    });
  }
});

/**
 * Authentication endpoints - stricter rate limiting
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 auth attempts per windowMs
  message: {
    success: false,
    error: 'AUTH_RATE_LIMIT_EXCEEDED',
    message: 'Too many authentication attempts, account temporarily locked'
  },
  skipSuccessfulRequests: true,
  handler: (req: Request, res: Response) => {
    logger.warn('Authentication rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      email: req.body?.email,
      path: req.path
    });
    
    res.status(429).json({
      success: false,
      error: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, account temporarily locked',
      retryAfter: 900
    });
  }
});

/**
 * Payment endpoints - enhanced rate limiting
 */
export const paymentRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Limit each IP to 50 payment requests per hour
  message: {
    success: false,
    error: 'PAYMENT_RATE_LIMIT_EXCEEDED',
    message: 'Too many payment attempts, please contact support'
  },
  handler: (req: Request, res: Response) => {
    logger.error('Payment rate limit exceeded - potential fraud', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.userId,
      path: req.path,
      amount: req.body?.amount
    });
    
    res.status(429).json({
      success: false,
      error: 'PAYMENT_RATE_LIMIT_EXCEEDED',
      message: 'Too many payment attempts, please contact support',
      retryAfter: 3600
    });
  }
});

/**
 * Slow down middleware for additional protection
 */
export const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Allow 50 requests per windowMs without delay
  delayMs: 500, // Add 500ms delay per request after delayAfter
  maxDelayMs: 10000 // Maximum delay of 10 seconds
});

// =====================================================
// INPUT VALIDATION & SANITIZATION
// =====================================================

/**
 * Input sanitization middleware
 */
export const inputSanitization = (req: Request, res: Response, next: NextFunction) => {
  const sanitizeValue = (value: any): any => {
    if (typeof value === 'string') {
      // Remove potentially dangerous characters
      return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
    }
    
    if (Array.isArray(value)) {
      return value.map(sanitizeValue);
    }
    
    if (value && typeof value === 'object') {
      const sanitized: any = {};
      for (const key in value) {
        sanitized[key] = sanitizeValue(value[key]);
      }
      return sanitized;
    }
    
    return value;
  };

  // Sanitize request body
  if (req.body) {
    req.body = sanitizeValue(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeValue(req.query);
  }

  next();
};

// =====================================================
// SSRF PROTECTION
// =====================================================

const ALLOWED_DOMAINS = [
  'fanz.com',
  'api.fanz.com',
  'ccbill.com',
  'api.ccbill.com',
  'paxum.com',
  'api.paxum.com',
  'segpay.com',
  'api.segpay.com',
  'amazonaws.com' // For S3, etc.
];

/**
 * SSRF protection - validate outgoing requests
 */
export const validateOutgoingRequest = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    
    // Block private IP ranges
    const hostname = parsedUrl.hostname;
    const privateIPRegex = /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.|169\.254\.|::1|localhost)$/i;
    
    if (privateIPRegex.test(hostname)) {
      logger.warn('SSRF attempt blocked: Private IP', { url, hostname });
      return false;
    }

    // Only allow HTTPS for external requests
    if (parsedUrl.protocol !== 'https:') {
      logger.warn('SSRF attempt blocked: Non-HTTPS', { url, protocol: parsedUrl.protocol });
      return false;
    }

    // Check against allowed domains
    const isAllowed = ALLOWED_DOMAINS.some(domain => 
      hostname === domain || hostname.endsWith(`.${domain}`)
    );
    
    if (!isAllowed) {
      logger.warn('SSRF attempt blocked: Unauthorized domain', { url, hostname });
      return false;
    }

    return true;
  } catch (error) {
    logger.warn('SSRF validation error', { url, error: (error instanceof Error ? error.message : String(error)) });
    return false;
  }
};

// =====================================================
// SECURITY EVENT LOGGING
// =====================================================

interface SecurityEvent {
  type: 'CSRF_VIOLATION' | 'RATE_LIMIT_EXCEEDED' | 'SUSPICIOUS_REQUEST' | 'SSRF_ATTEMPT' | 'XSS_ATTEMPT';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  ip: string;
  userAgent?: string;
  userId?: string;
  details: Record<string, any>;
  timestamp: Date;
}

/**
 * Log security events for analysis
 */
export const logSecurityEvent = (event: Omit<SecurityEvent, 'timestamp'>) => {
  const securityEvent: SecurityEvent = {
    ...event,
    timestamp: new Date()
  };

  logger.warn('Security event detected', securityEvent);

  // Here you could integrate with SIEM, send alerts, etc.
  if (event.severity === 'CRITICAL' || event.severity === 'HIGH') {
    // Send alert to security team
    logger.error('High-severity security event requires attention', securityEvent);
  }
};

// =====================================================
// COMPREHENSIVE SECURITY MIDDLEWARE
// =====================================================

/**
 * Apply all security hardening measures
 */
export const applySecurityHardening = (app: any) => {
  // Security headers
  app.use(securityHeaders);

  // Input sanitization
  app.use(inputSanitization);

  // Speed limiter (apply before rate limiters)
  app.use(speedLimiter);

  // General rate limiting
  app.use('/api/', apiRateLimit);

  // Stricter rate limiting for sensitive endpoints
  app.use('/api/auth/', authRateLimit);
  app.use('/api/payments/', paymentRateLimit);

  // CSRF protection (apply after session middleware)
  app.use(csrfProtection);

  logger.info('Security hardening measures applied successfully');
};

// All exports are already declared above
