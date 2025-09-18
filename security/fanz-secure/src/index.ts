/**
 * @fanz/secure - Enterprise Security Middleware Package
 * Main entry point for FANZ Unified Ecosystem security components
 */

// ===============================
// CORE EXPORTS
// ===============================

export { config } from './config.js';
export * from './types.js';

// ===============================
// MIDDLEWARE EXPORTS
// ===============================

// Rate Limiting
export {
  createRateLimitMiddleware,
  authRateLimit,
  paymentRateLimit,
  standardRateLimit,
  webhookRateLimit,
  getRateLimitStats,
  resetUserRateLimit,
  emergencyBlockUser,
  rateLimiter
} from './middleware/rateLimiter.js';

// Input Validation & Sanitization
export {
  validate,
  validatePagination,
  validateUuidParam,
  validateFileUpload,
  validateTransaction,
  validateContent,
  createRegexValidator,
  createSanitizedString,
  createEmailValidator,
  validateWithRateLimit,
  inputValidator,
  CommonSchemas,
  type ValidationSchemas,
  type ValidationOptions,
  type SanitizationConfig
} from './middleware/validation.js';

// CSRF Protection
export {
  csrfProtection,
  csrfProtectionWithExclusions,
  getCsrfToken,
  csrfTokenMiddleware,
  apiCsrfProtection,
  formCsrfProtection,
  generateCsrfToken,
  validateCsrfToken,
  csrfTokenResponse,
  csrfTokenEndpoint,
  CsrfProtection,
  CsrfTokenGenerator,
  type CsrfOptions,
  type CsrfToken,
  type CsrfRequest
} from './middleware/csrf.js';

// Authentication & Authorization
export {
  authenticate,
  authorize,
  requireRole,
  requireScope,
  require2FA,
  AuthenticationService,
  AuthorizationService,
  type AuthenticatedRequest,
  type AuthUser,
  type AuthToken,
  type AuthSession,
  type AuthPolicy,
  type UserRole,
  type UserStatus
} from './middleware/auth.js';

// ===============================
// UTILITIES
// ===============================

// Logging
export {
  createSecurityLogger,
  createAuditLogger,
  createHttpLogger,
  correlationIdMiddleware,
  sanitizeForLogging,
  createPerformanceTimer,
  logSecurityEvent,
  logger
} from './utils/logger.js';

// Security Events
export {
  emitSecurityEvent,
  onSecurityEvent,
  offSecurityEvent,
  getSecurityEventStats,
  createSecurityEvent,
  shutdownSecurityEvents
} from './utils/securityEvents.js';

// ===============================
// MIDDLEWARE CHAIN BUILDER
// ===============================

import { Request, Response, NextFunction, Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import hpp from 'hpp';
import { v4 as uuidv4 } from 'uuid';
import { createHttpLogger, correlationIdMiddleware } from './utils/logger.js';
import { standardRateLimit, authRateLimit, paymentRateLimit } from './middleware/rateLimiter.js';
import { csrfProtection } from './middleware/csrf.js';
import { authenticate } from './middleware/auth.js';
import { config } from './config.js';

/**
 * Request ID middleware - generates or uses existing correlation ID
 */
function requestIdMiddleware() {
  const header = config.security.logging.correlationIdHeader;
  
  return (req: Request, res: Response, next: NextFunction) => {
    const requestId = req.headers[header] as string || 
                     req.headers['x-request-id'] as string ||
                     `fanz-${Date.now()}-${uuidv4()}`;
    
    // Set on request object
    (req as any).id = requestId;
    
    // Set in response header
    res.setHeader(header, requestId);
    res.setHeader('X-Request-ID', requestId);
    
    next();
  };
}

/**
 * Trust proxy middleware - configure proxy trust
 */
function trustProxyMiddleware(app: Application) {
  if (config.isProduction) {
    app.set('trust proxy', 1); // Trust first proxy
  } else {
    app.set('trust proxy', true); // Trust all proxies in development
  }
}

/**
 * Body size limits middleware
 */
function bodySizeLimitMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const maxSize = config.isProduction ? '10mb' : '50mb';
    
    // This would typically be handled by express.json() and express.urlencoded()
    // but we can add additional checks here
    next();
  };
}

/**
 * Security headers middleware with nonce-based CSP
 */
function securityHeadersMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Generate nonce for this request
    const nonce = `nonce-${Buffer.from(uuidv4()).toString('base64').substring(0, 16)}`;
    (req as any).nonce = nonce;
    
    // Set nonce in response locals for templates
    res.locals.nonce = nonce;
    
    // Apply Helmet with our configuration
    const helmetConfig = config.security.helmet;
    const cspConfig = config.security.csp;
    
    helmet({
      contentSecurityPolicy: helmetConfig.contentSecurityPolicy ? {
        directives: {
          ...Object.fromEntries(
            Object.entries(cspConfig.directives).map(([key, values]) => [
              key,
              values.map(val => val.replace('{nonce}', nonce))
            ])
          )
        },
        reportOnly: cspConfig.reportOnly,
        reportUri: cspConfig.reportUri
      } : false,
      
      hsts: helmetConfig.hsts ? {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
      } : false,
      
      noSniff: helmetConfig.noSniff,
      frameguard: helmetConfig.frameguard ? { action: 'deny' } : false,
      xssFilter: helmetConfig.xssFilter,
      dnsPrefetchControl: helmetConfig.dnsPrefetchControl,
      hidePoweredBy: helmetConfig.hidePoweredBy,
      ieNoOpen: helmetConfig.ieNoOpen,
      originAgentCluster: helmetConfig.originAgentCluster,
      permittedCrossDomainPolicies: helmetConfig.permittedCrossDomainPolicies ? { permittedPolicies: 'none' } : false,
      referrerPolicy: helmetConfig.referrerPolicy ? { policy: 'no-referrer' } : false
    })(req, res, next);
  };
}

/**
 * CORS middleware with configuration
 */
function corsMiddleware() {
  const corsConfig = config.security.cors;
  
  return cors({
    origin: corsConfig.origins,
    credentials: corsConfig.credentials,
    methods: corsConfig.methods,
    allowedHeaders: corsConfig.allowedHeaders,
    exposedHeaders: corsConfig.exposedHeaders,
    maxAge: corsConfig.maxAge,
    preflightContinue: corsConfig.preflightContinue
  });
}

/**
 * Standard security middleware chain
 */
export function createSecurityMiddleware() {
  return [
    requestIdMiddleware(),
    correlationIdMiddleware(),
    createHttpLogger(),
    bodySizeLimitMiddleware(),
    standardRateLimit,
    corsMiddleware(),
    hpp(),
    securityHeadersMiddleware()
  ];
}

/**
 * Apply security middleware to Express app
 */
export function applySecurityMiddleware(app: Application) {
  // Configure trust proxy first
  trustProxyMiddleware(app);
  
  // Apply security middleware chain
  const middlewares = createSecurityMiddleware();
  middlewares.forEach(middleware => {
    app.use(middleware);
  });
  
  return app;
}

// ===============================
// SPECIALIZED MIDDLEWARE CHAINS
// ===============================

/**
 * Authentication route security (stricter)
 */
export function createAuthSecurityMiddleware() {
  return [
    requestIdMiddleware(),
    correlationIdMiddleware(),
    createHttpLogger(),
    authRateLimit, // Stricter rate limiting
    corsMiddleware(),
    hpp(),
    securityHeadersMiddleware(),
    csrfProtection() // CSRF protection for auth routes
  ];
}

/**
 * Payment route security (strictest)
 */
export function createPaymentSecurityMiddleware() {
  return [
    requestIdMiddleware(),
    correlationIdMiddleware(),
    createHttpLogger(),
    paymentRateLimit, // Strictest rate limiting
    corsMiddleware(),
    hpp(),
    securityHeadersMiddleware(),
    authenticate(), // Authentication required for payments
    csrfProtection() // CSRF protection for payments
  ];
}

/**
 * Webhook security (different requirements)
 */
export function createWebhookSecurityMiddleware() {
  return [
    requestIdMiddleware(),
    correlationIdMiddleware(),
    createHttpLogger(),
    webhookRateLimit,
    // Note: No CORS for webhooks, different CSRF handling
    hpp(),
    securityHeadersMiddleware()
  ];
}

/**
 * Static asset security
 */
export function createStaticSecurityMiddleware() {
  return [
    requestIdMiddleware(),
    // No rate limiting for static assets typically
    corsMiddleware(),
    securityHeadersMiddleware()
  ];
}

// ===============================
// ERROR HANDLING
// ===============================

/**
 * Security error handler
 */
export function createSecurityErrorHandler() {
  return (error: any, req: Request, res: Response, next: NextFunction) => {
    const logger = createSecurityLogger('ErrorHandler');
    
    // Log the error securely
    logger.error('Security error occurred', {
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
      path: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Determine response based on error type and environment
    const isDevelopment = config.isDevelopment;
    const statusCode = error.statusCode || 500;
    const requestId = (req as any).id || 'unknown';

    // Standard error response
    const errorResponse: any = {
      error: true,
      code: error.code || 'SECURITY_ERROR',
      message: isDevelopment ? error.message : 'An error occurred',
      requestId,
      timestamp: new Date().toISOString()
    };

    // Add stack trace in development only
    if (isDevelopment && error.stack) {
      errorResponse.stack = error.stack;
    }

    // Send appropriate cache headers for errors
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.status(statusCode).json(errorResponse);
  };
}

// ===============================
// HEALTH CHECK
// ===============================

/**
 * Security-aware health check
 */
export function createSecurityHealthCheck() {
  return async (req: Request, res: Response) => {
    try {
      const stats = await getSecurityEventStats();
      const rateLimitStats = await getRateLimitStats();
      
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        security: {
          events: stats,
          rateLimiting: rateLimitStats,
          config: {
            environment: config.nodeEnv,
            features: config.features
          }
        },
        version: '1.0.0'
      });
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Security health check failed'
      });
    }
  };
}

// ===============================
// DEFAULT EXPORT
// ===============================

export default {
  config,
  createSecurityMiddleware,
  applySecurityMiddleware,
  createAuthSecurityMiddleware,
  createPaymentSecurityMiddleware,
  createWebhookSecurityMiddleware,
  createStaticSecurityMiddleware,
  createSecurityErrorHandler,
  createSecurityHealthCheck
};