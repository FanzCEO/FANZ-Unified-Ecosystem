/**
 * @fanz/secure - Enterprise Security Middleware Package
 * 
 * Comprehensive security middleware package for the FANZ Unified Ecosystem
 * providing authentication, authorization, CSRF protection, input validation,
 * webhook security, rate limiting, and security utilities.
 */

// =============================================================================
// CORE CONFIGURATION AND UTILITIES
// =============================================================================

// Configuration exports
export {
  config,
  getConfig,
  validateConfig,
  createConfigSchema,
  type ConfigSchema,
  type SecurityConfig
} from './config/config.js';

// Logger exports
export {
  logger,
  createLogger,
  redactSensitiveData,
  type LogLevel,
  type LogContext
} from './utils/logger.js';

// Security Events exports
export {
  securityEvents,
  SecurityEventManager,
  type SecurityEvent,
  type SecurityEventHandler,
  type SecurityEventBatch
} from './events/securityEvents.js';

// =============================================================================
// MIDDLEWARE EXPORTS
// =============================================================================

// Rate limiting middleware exports
export {
  RateLimiter,
  createRateLimiter,
  createAuthRateLimiter,
  createPaymentRateLimiter,
  createWebhookRateLimiter,
  type RateLimitConfig,
  type RateLimitTier,
  type RateLimitResult
} from './middleware/rateLimiter.js';

// Input validation middleware exports
export {
  InputValidator,
  createValidator,
  validateQuery,
  validateParams,
  validateBody,
  type ValidatorConfig,
  type ValidationSchema,
  type ValidationResult
} from './middleware/validator.js';

// Error handling middleware exports
export {
  ErrorHandler,
  createErrorHandler,
  secureErrorResponse,
  type ErrorConfig,
  type SecureError,
  type ErrorContext
} from './middleware/errorHandler.js';

// Health check middleware exports
export {
  HealthChecker,
  createHealthChecker,
  type HealthConfig,
  type HealthStatus,
  type HealthCheck
} from './middleware/health.js';

// Auth middleware exports
export {
  AuthenticationMiddleware,
  AuthorizationMiddleware,
  createAuthenticator,
  createAuthorizer,
  requireRole,
  requireScope,
  require2FA,
  type AuthConfig,
  type AuthContext,
  type User,
  type Role,
  type Permission,
  type AuthPolicy,
  type AuthResult
} from './middleware/auth.js';

// CSRF middleware exports
export {
  CSRFProtection,
  createCSRFMiddleware,
  type CSRFConfig,
  type CSRFTokenPair
} from './middleware/csrf.js';

// Webhook middleware exports
export {
  WebhookSecurity,
  createWebhookMiddleware,
  createPaymentWebhookMiddleware,
  generateWebhookSignature,
  testWebhookSignature,
  type WebhookConfig,
  type WebhookValidationResult,
  type ProcessedWebhookRequest
} from './middleware/webhook.js';

// =============================================================================
// SECURITY UTILITIES
// =============================================================================

// Security utilities exports
export {
  // Cryptographic utilities
  generateSecureRandom,
  generateSecureRandomString,
  generateNonce,
  generateToken,
  generateHMAC,
  verifyHMAC,
  hashPassword,
  verifyPassword,
  
  // Safe regex and validation
  createSafeRegex,
  testSafeRegex,
  SAFE_PATTERNS,
  
  // IP and network utilities
  isPrivateIP,
  isValidIP,
  isLoopbackIP,
  normalizeIP,
  isAllowedIP,
  
  // Path and file safety
  sanitizeFilename,
  sanitizePath,
  
  // Content security utilities
  sanitizeHtmlBasic,
  extractSafeUrls,
  
  // Timing safety
  constantTimeEquals,
  
  // Rate limiting helpers
  generateRateLimitKey,
  calculateBackoffDelay,
  
  // Security events
  createSecurityEvent,
  
  // Validators
  securityValidators,
  
  // Types
  type SecurityEventData
} from './utils/security.js';

// =============================================================================
// MIDDLEWARE CHAINS
// =============================================================================

/**
 * Security middleware chains for different route types
 */
export interface MiddlewareChainConfig {
  rateLimiter?: boolean;
  validation?: boolean;
  authentication?: boolean;
  authorization?: boolean;
  csrf?: boolean;
  errorHandler?: boolean;
}

/**
 * Standard security middleware chain
 */
export function createSecurityChain(config: MiddlewareChainConfig = {}) {
  const middleware = [];
  
  // Order matters - this is the recommended sequence
  if (config.rateLimiter !== false) {
    middleware.push(createRateLimiter('standard'));
  }
  
  if (config.validation !== false) {
    middleware.push(createValidator());
  }
  
  if (config.authentication !== false) {
    middleware.push(createAuthenticator());
  }
  
  if (config.authorization !== false) {
    middleware.push(createAuthorizer());
  }
  
  if (config.csrf !== false) {
    middleware.push(createCSRFMiddleware());
  }
  
  if (config.errorHandler !== false) {
    middleware.push(createErrorHandler());
  }
  
  return middleware;
}

/**
 * Authentication route security chain
 */
export function createAuthChain() {
  return [
    createRateLimiter('auth'),
    createValidator(),
    createCSRFMiddleware(),
    createErrorHandler()
  ];
}

/**
 * Payment route security chain (strictest)
 */
export function createPaymentChain() {
  return [
    createRateLimiter('payment'),
    createValidator(),
    createAuthenticator(),
    createAuthorizer(),
    createCSRFMiddleware(),
    createErrorHandler()
  ];
}

/**
 * Webhook route security chain
 */
export function createWebhookChain(secret: string, options?: any) {
  return [
    createWebhookMiddleware(secret, options),
    createRateLimiter('webhook'),
    createErrorHandler()
  ];
}

/**
 * Static asset security chain (minimal)
 */
export function createStaticChain() {
  return [
    createRateLimiter('standard'),
    createErrorHandler()
  ];
}

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/**
 * Main security context interface
 */
export interface SecurityContext {
  requestId: string;
  userId?: string;
  sessionId?: string;
  ip: string;
  userAgent?: string;
  roles?: string[];
  scopes?: string[];
  csrfToken?: string;
  rateLimitRemaining?: number;
  authenticated: boolean;
  authorized: boolean;
  securityLevel: 'low' | 'medium' | 'high' | 'critical';
  metadata: Record<string, any>;
}

/**
 * Security middleware options
 */
export interface SecurityOptions {
  enabled: boolean;
  level: 'permissive' | 'standard' | 'strict' | 'paranoid';
  rateLimiting: {
    enabled: boolean;
    tier: RateLimitTier;
    customLimits?: Record<string, number>;
  };
  authentication: {
    enabled: boolean;
    required: boolean;
    methods: ('jwt' | 'session' | 'api-key')[];
    twoFactorRequired?: boolean;
  };
  authorization: {
    enabled: boolean;
    defaultPolicy: 'deny' | 'allow';
    roleBasedAccess: boolean;
    attributeBasedAccess: boolean;
  };
  validation: {
    enabled: boolean;
    strict: boolean;
    sanitization: boolean;
    customSchemas?: Record<string, any>;
  };
  csrf: {
    enabled: boolean;
    cookieOptions?: any;
    excludePaths?: string[];
  };
  webhook: {
    enabled: boolean;
    signatureVerification: boolean;
    replayPrevention: boolean;
    timestampValidation: boolean;
  };
  logging: {
    enabled: boolean;
    level: LogLevel;
    redaction: boolean;
    auditTrail: boolean;
  };
  monitoring: {
    enabled: boolean;
    metricsCollection: boolean;
    alerting: boolean;
    dashboardIntegration: boolean;
  };
}

/**
 * Complete security setup function
 */
export function setupSecurity(options: Partial<SecurityOptions> = {}) {
  const defaultOptions: SecurityOptions = {
    enabled: true,
    level: 'standard',
    rateLimiting: {
      enabled: true,
      tier: 'standard'
    },
    authentication: {
      enabled: true,
      required: false,
      methods: ['jwt']
    },
    authorization: {
      enabled: true,
      defaultPolicy: 'deny',
      roleBasedAccess: true,
      attributeBasedAccess: false
    },
    validation: {
      enabled: true,
      strict: false,
      sanitization: true
    },
    csrf: {
      enabled: true
    },
    webhook: {
      enabled: false,
      signatureVerification: true,
      replayPrevention: true,
      timestampValidation: true
    },
    logging: {
      enabled: true,
      level: 'info',
      redaction: true,
      auditTrail: true
    },
    monitoring: {
      enabled: true,
      metricsCollection: true,
      alerting: true,
      dashboardIntegration: true
    }
  };

  const config = { ...defaultOptions, ...options };
  
  logger.info('Security setup initialized', { 
    level: config.level,
    features: Object.keys(config).filter(key => config[key as keyof SecurityOptions]?.enabled === true)
  });

  return config;
}

/**
 * Package version and metadata
 */
export const PACKAGE_INFO = {
  name: '@fanz/secure',
  version: '1.0.0',
  description: 'Enterprise Security Middleware Package for FANZ Unified Ecosystem',
  features: [
    'Authentication & Authorization',
    'CSRF Protection', 
    'Input Validation & Sanitization',
    'Rate Limiting (Tiered)',
    'Webhook Security',
    'Security Event Management',
    'Cryptographic Utilities',
    'Security Monitoring',
    'FanzDash Integration'
  ],
  compliance: [
    'OWASP Top 10',
    'SOC 2 Type II',
    'GDPR',
    'CCPA',
    'PCI DSS',
    'HIPAA Ready'
  ]
};

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

export default {
  // Setup functions
  setupSecurity,
  
  // Middleware chains
  createSecurityChain,
  createAuthChain,
  createPaymentChain,
  createWebhookChain,
  createStaticChain,
  
  // Core utilities
  config,
  logger,
  securityEvents,
  
  // Package info
  PACKAGE_INFO
};