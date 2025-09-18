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

// Security headers middleware exports
export {
  SecurityHeaders,
  createSecurityHeaders,
  createStrictSecurityHeaders,
  createDevelopmentHeaders,
  getNonce,
  nonceScript,
  nonceStyle,
  type SecurityHeadersConfig,
  type RequestWithNonce
} from './middleware/headers.js';

// Error handling middleware exports
export {
  ErrorHandler,
  createErrorHandler,
  createProductionErrorHandler,
  createDevelopmentErrorHandler,
  createSecureError,
  secureErrorResponse,
  type ErrorConfig,
  type SecureError,
  type SecureErrorResponse,
  type ErrorContext
} from './middleware/errorHandler.js';

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

// SQL Safety utilities exports
export {
  SQLSafety,
  createSQLSafety,
  createStrictSQLSafety,
  createDevelopmentSQLSafety,
  sql,
  validateSQL,
  type QueryConfig,
  type SafeQuery,
  type QueryValidationResult
} from './utils/sqlSafety.js';

// Audit logging utilities exports
export {
  AuditLogger,
  createAuditLogger,
  createProductionAuditLogger,
  createDevelopmentAuditLogger,
  type AuditConfig,
  type AuditEvent,
  type AuditContext,
  type AuditLevel,
  type AuditCategory,
  type AuditQuery
} from './utils/auditLogger.js';

// File system safety utilities exports
export {
  PathSafety,
  FileUploadSafety,
  StaticFileSafety,
  fileSystemUtils,
  DEFAULT_UPLOAD_CONFIG,
  DEFAULT_STATIC_CONFIG,
  type FileUploadConfig,
  type StaticServeConfig,
  type FileMetadata
} from './utils/fileSystemSafety.js';

// CORS and cookie utilities exports
export {
  CORSManager,
  SecureCookieManager,
  SessionManager,
  CacheControlManager,
  CORS_CONFIGS,
  SECURE_COOKIE_CONFIGS,
  type CORSConfig,
  type CookieConfig,
  type SessionConfig
} from './utils/corsAndCookies.js';

// OWASP Top 10 protections exports
export {
  SSRFProtection,
  CommandInjectionProtection,
  DeserializationSecurity,
  DoSProtection,
  OWASPProtections,
  DEFAULT_SSRF_CONFIG,
  DEFAULT_DOS_CONFIG,
  type SSRFConfig,
  type CommandInjectionConfig,
  type DeserializationConfig,
  type DoSConfig
} from './utils/owaspProtections.js';

// Financial security utilities exports
export {
  TransactionIdempotency,
  LedgerValidator,
  BalanceLockManager,
  FinancialRBAC,
  FinancialEventMonitor,
  FinanceSecurityMiddleware,
  FinanceScopes,
  DEFAULT_FINANCE_CONFIG,
  MoneyAmountSchema,
  AccountIdSchema,
  TransactionIdSchema,
  ExternalIdSchema,
  type MoneyAmount,
  type LedgerEntry,
  type Transaction,
  type IdempotencyKey,
  type BalanceLock,
  type FinanceSecurityConfig
} from './utils/financeSecurityUtils.js';

// Security monitoring and alerting exports
export {
  SecurityMonitoringSystem,
  SecurityEventType,
  SecurityThreatLevel,
  AutoResponseAction,
  DEFAULT_MONITORING_CONFIG,
  DEFAULT_DETECTION_RULES,
  type SecurityEvent,
  type DetectionRule,
  type SecurityMetric,
  type ThreatIntelligence,
  type SecurityMonitoringConfig
} from './utils/securityMonitoring.js';

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
  
  // 1. Correlation ID and audit logging (first for tracing)
  const auditLogger = createAuditLogger();
  middleware.push(auditLogger.correlationMiddleware());
  
  // 2. Rate limiting
  if (config.rateLimiter !== false) {
    middleware.push(createRateLimiter('standard'));
  }
  
  // 3. Security headers early in the chain
  middleware.push(createSecurityHeaders());
  
  // 4. SQL safety middleware
  const sqlSafety = createSQLSafety();
  middleware.push(sqlSafety.middleware());
  
  // 5. Input validation
  if (config.validation !== false) {
    middleware.push(createValidator());
  }
  
  // 6. Authentication
  if (config.authentication !== false) {
    middleware.push(createAuthenticator());
  }
  
  // 7. Authorization
  if (config.authorization !== false) {
    middleware.push(createAuthorizer());
  }
  
  // 8. CSRF protection
  if (config.csrf !== false) {
    middleware.push(createCSRFMiddleware());
  }
  
  // 9. Audit middleware for request logging
  middleware.push(auditLogger.auditMiddleware());
  
  // 10. Error handler should be last
  if (config.errorHandler !== false) {
    middleware.push(createErrorHandler());
  }
  
  return middleware;
}

/**
 * Authentication route security chain
 */
export function createAuthChain(redisClient?: any) {
  const auditLogger = createAuditLogger({}, redisClient);
  const sqlSafety = createSQLSafety();
  
  return [
    auditLogger.correlationMiddleware(),
    createRateLimiter('auth'),
    createSecurityHeaders(),
    sqlSafety.middleware(),
    createValidator(),
    createCSRFMiddleware(),
    auditLogger.auditMiddleware(),
    createErrorHandler()
  ];
}

/**
 * Payment route security chain (strictest)
 */
export function createPaymentChain(allowedTables: string[] = [], redisClient?: any) {
  const auditLogger = createProductionAuditLogger(redisClient);
  const sqlSafety = createStrictSQLSafety(allowedTables);
  
  return [
    auditLogger.correlationMiddleware(),
    createRateLimiter('payment'),
    createStrictSecurityHeaders(), // Use strictest headers for payments
    sqlSafety.middleware(), // Strict SQL safety for financial operations
    createValidator(),
    createAuthenticator(),
    createAuthorizer(),
    createCSRFMiddleware(),
    auditLogger.auditMiddleware(), // Critical audit logging for payments
    createProductionErrorHandler() // Use production error handler for payments
  ];
}

/**
 * Financial transaction chain with comprehensive security
 */
export function createFinanceChain(scope: FinanceScopes, config?: Partial<FinanceSecurityConfig>, redisClient?: any) {
  const auditLogger = createProductionAuditLogger(redisClient);
  const financeSecurityMiddleware = new FinanceSecurityMiddleware(auditLogger, config);
  
  return [
    auditLogger.correlationMiddleware(),
    createRateLimiter('payment'), // Use payment rate limiter for finance operations
    createStrictSecurityHeaders(),
    createValidator(),
    createAuthenticator(),
    createAuthorizer(),
    ...financeSecurityMiddleware.createFinanceChain(scope), // Comprehensive financial security
    auditLogger.auditMiddleware(),
    createProductionErrorHandler()
  ];
}

/**
 * Ledger operation chain with double-entry validation
 */
export function createLedgerChain(redisClient?: any) {
  return createFinanceChain(FinanceScopes.LEDGER_POST, {
    requireMakerChecker: true,
    require2FA: true,
    auditAllTransactions: true
  }, redisClient);
}

/**
 * Payout chain with maximum security controls
 */
export function createPayoutChain(redisClient?: any) {
  return createFinanceChain(FinanceScopes.PAYOUT_EXECUTE, {
    requireMakerChecker: true,
    require2FA: true,
    maxTransactionAmount: { amount: 50000000, currency: 'USD' }, // $500k limit
    auditAllTransactions: true,
    enableRealTimeMonitoring: true
  }, redisClient);
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
  createFinanceChain,
  createLedgerChain,
  createPayoutChain,
  
  // Core utilities
  config,
  logger,
  securityEvents,
  
  // Package info
  PACKAGE_INFO
};
