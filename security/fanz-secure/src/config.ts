/**
 * @fanz/secure - Centralized Configuration & Secret Management
 * Fail-fast configuration validation with strict typing
 */

import { z } from 'zod';
import { SecurityConfig, SecurityConfigSchema } from './types.js';

// ===============================
// ENVIRONMENT SCHEMA
// ===============================

const EnvironmentSchema = z.object({
  // Core Application
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  
  // Security Secrets
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  CSRF_SECRET: z.string().min(32, 'CSRF secret must be at least 32 characters'),
  ENCRYPTION_KEY: z.string().min(32, 'Encryption key must be at least 32 characters'),
  
  // Database
  DATABASE_URL: z.string().url('Invalid database URL'),
  
  // Redis
  REDIS_URL: z.string().url('Invalid Redis URL').optional(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().int().min(1).max(65535).default(6379),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.coerce.number().int().min(0).max(15).default(0),
  
  // CORS Origins (comma-separated)
  CORS_ORIGINS: z.string().transform((val) => val.split(',').map(s => s.trim())),
  
  // Rate Limiting
  RATE_LIMIT_AUTH_POINTS: z.coerce.number().int().positive().default(10),
  RATE_LIMIT_AUTH_DURATION: z.coerce.number().int().positive().default(60), // seconds
  RATE_LIMIT_PAYMENT_POINTS: z.coerce.number().int().positive().default(60),
  RATE_LIMIT_PAYMENT_DURATION: z.coerce.number().int().positive().default(60),
  RATE_LIMIT_STANDARD_POINTS: z.coerce.number().int().positive().default(300),
  RATE_LIMIT_STANDARD_DURATION: z.coerce.number().int().positive().default(300),
  
  // CSP Reporting
  CSP_REPORT_URI: z.string().url().optional(),
  
  // Logging
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  LOG_CORRELATION_HEADER: z.string().default('x-request-id'),
  
  // FanzDash Integration
  FANZDASH_API_URL: z.string().url().optional(),
  FANZDASH_SECRET_TOKEN: z.string().optional(),
  
  // Payment Processors (Non-Stripe/PayPal per rules)
  CCBILL_CLIENT_ACCNUM: z.string().optional(),
  CCBILL_FLEX_ID: z.string().optional(),
  CCBILL_SALT: z.string().optional(),
  PAXUM_API_KEY: z.string().optional(),
  PAXUM_API_SECRET: z.string().optional(),
  SEGPAY_PACKAGE_ID: z.string().optional(),
  
  // External Services
  EMAIL_SERVICE_URL: z.string().url().optional(),
  SMS_SERVICE_URL: z.string().url().optional(),
  NOTIFICATION_SERVICE_URL: z.string().url().optional(),
  
  // Feature Flags
  FEATURE_CSRF_ENABLED: z.coerce.boolean().default(true),
  FEATURE_RATE_LIMITING_ENABLED: z.coerce.boolean().default(true),
  FEATURE_AUDIT_LOGGING_ENABLED: z.coerce.boolean().default(true),
  FEATURE_SECURITY_HEADERS_ENABLED: z.coerce.boolean().default(true),
});\n\n// ===============================\n// CONFIGURATION CLASS\n// ===============================\n\nclass FanzSecureConfig {\n  private readonly _config: z.infer<typeof EnvironmentSchema>;\n  private readonly _securityConfig: SecurityConfig;\n  private readonly _isProduction: boolean;\n  private readonly _redactedFields = new Set([\n    'JWT_SECRET',\n    'CSRF_SECRET', \n    'ENCRYPTION_KEY',\n    'REDIS_PASSWORD',\n    'CCBILL_SALT',\n    'PAXUM_API_SECRET',\n    'FANZDASH_SECRET_TOKEN'\n  ]);\n\n  constructor() {\n    this._config = this.validateEnvironment();\n    this._isProduction = this._config.NODE_ENV === 'production';\n    this._securityConfig = this.buildSecurityConfig();\n    \n    // Freeze the config to prevent runtime modifications\n    Object.freeze(this._config);\n    Object.freeze(this._securityConfig);\n  }\n\n  private validateEnvironment(): z.infer<typeof EnvironmentSchema> {\n    const result = EnvironmentSchema.safeParse(process.env);\n    \n    if (!result.success) {\n      const errors = result.error.errors.map(err => \n        `${err.path.join('.')}: ${err.message}`\n      ).join('\\n');\n      \n      throw new Error(`❌ Environment validation failed:\\n${errors}`);\n    }\n    \n    return result.data;\n  }\n\n  private buildSecurityConfig(): SecurityConfig {\n    return {\n      cors: {\n        origins: this._config.CORS_ORIGINS,\n        credentials: true,\n        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],\n        allowedHeaders: [\n          'Content-Type',\n          'Authorization', \n          'X-Requested-With',\n          'X-CSRF-Token',\n          this._config.LOG_CORRELATION_HEADER\n        ],\n        exposedHeaders: [\n          'X-Rate-Limit-Remaining',\n          'X-Rate-Limit-Reset',\n          'X-Rate-Limit-Tier'\n        ],\n        maxAge: 86400, // 24 hours\n        preflightContinue: false\n      },\n      \n      csp: {\n        nonce: true,\n        reportOnly: !this._isProduction,\n        reportUri: this._config.CSP_REPORT_URI,\n        directives: {\n          'default-src': [\"'none'\"],\n          'base-uri': [\"'none'\"],\n          'frame-ancestors': [\"'none'\"],\n          'script-src': [\"'self'\", \"'nonce-{nonce}\"],\n          'style-src': [\"'self'\"],\n          'connect-src': [\"'self'\", 'api.fanz.*', 'wss:'],\n          'img-src': [\"'self'\", 'data:', 'https:'],\n          'font-src': [\"'self'\"],\n          'media-src': [\"'self'\"],\n          'object-src': [\"'none'\"],\n          'frame-src': this._isProduction ? [\"'none'\"] : [\"'self'\"],\n        }\n      },\n      \n      rateLimiting: {\n        tiers: {\n          auth: {\n            points: this._config.RATE_LIMIT_AUTH_POINTS,\n            duration: this._config.RATE_LIMIT_AUTH_DURATION,\n            blockDuration: this._config.RATE_LIMIT_AUTH_DURATION * 10, // 10x block duration\n            execEvenly: true\n          },\n          payment: {\n            points: this._config.RATE_LIMIT_PAYMENT_POINTS,\n            duration: this._config.RATE_LIMIT_PAYMENT_DURATION,\n            blockDuration: this._config.RATE_LIMIT_PAYMENT_DURATION * 5,\n            execEvenly: true\n          },\n          standard: {\n            points: this._config.RATE_LIMIT_STANDARD_POINTS,\n            duration: this._config.RATE_LIMIT_STANDARD_DURATION,\n            blockDuration: this._config.RATE_LIMIT_STANDARD_DURATION * 2,\n            execEvenly: false\n          },\n          webhook: {\n            points: 100,\n            duration: 60,\n            blockDuration: 300, // 5 minutes\n            execEvenly: false\n          }\n        },\n        redis: this._config.REDIS_URL ? undefined : {\n          host: this._config.REDIS_HOST,\n          port: this._config.REDIS_PORT,\n          password: this._config.REDIS_PASSWORD,\n          db: this._config.REDIS_DB\n        },\n        skipSuccessfulRequests: false,\n        skipFailedRequests: false\n      },\n      \n      csrf: {\n        enabled: this._config.FEATURE_CSRF_ENABLED,\n        cookieName: '__fanz-csrf',\n        headerName: 'X-CSRF-Token',\n        secret: this._config.CSRF_SECRET,\n        sessionKey: 'csrf',\n        ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],\n        excludedPaths: [\n          '/api/webhooks/',\n          '/api/health',\n          '/api/ready',\n          '/api/metrics'\n        ]\n      },\n      \n      validation: {\n        stripUnknown: true,\n        abortEarly: false,\n        maxDepth: 10,\n        maxArrayLength: 1000,\n        maxStringLength: 100000,\n        sanitization: {\n          html: true,\n          sql: true,\n          xss: true\n        }\n      },\n      \n      logging: {\n        level: this._config.LOG_LEVEL,\n        redactedFields: [\n          'password',\n          'token',\n          'secret',\n          'key',\n          'authorization',\n          'cookie',\n          'session',\n          'csrf',\n          'ssn',\n          'creditCard',\n          'email',\n          'phone'\n        ],\n        correlationIdHeader: this._config.LOG_CORRELATION_HEADER,\n        auditLog: this._config.FEATURE_AUDIT_LOGGING_ENABLED,\n        securityEvents: true\n      },\n      \n      helmet: {\n        contentSecurityPolicy: this._config.FEATURE_SECURITY_HEADERS_ENABLED,\n        hsts: this._isProduction,\n        noSniff: true,\n        frameguard: true,\n        xssFilter: true,\n        dnsPrefetchControl: true,\n        hidePoweredBy: true,\n        ieNoOpen: true,\n        noCache: false,\n        originAgentCluster: true,\n        permittedCrossDomainPolicies: false,\n        referrerPolicy: true\n      }\n    };\n  }\n\n  // ===============================\n  // PUBLIC GETTERS\n  // ===============================\n\n  get nodeEnv(): string {\n    return this._config.NODE_ENV;\n  }\n\n  get port(): number {\n    return this._config.PORT;\n  }\n\n  get isProduction(): boolean {\n    return this._isProduction;\n  }\n\n  get isDevelopment(): boolean {\n    return this._config.NODE_ENV === 'development';\n  }\n\n  get isStaging(): boolean {\n    return this._config.NODE_ENV === 'staging';\n  }\n\n  get security(): SecurityConfig {\n    return this._securityConfig;\n  }\n\n  get databaseUrl(): string {\n    return this._config.DATABASE_URL;\n  }\n\n  get redisUrl(): string | undefined {\n    return this._config.REDIS_URL;\n  }\n\n  get jwtSecret(): string {\n    return this._config.JWT_SECRET;\n  }\n\n  get encryptionKey(): string {\n    return this._config.ENCRYPTION_KEY;\n  }\n\n  // FanzDash Integration\n  get fanzDashApiUrl(): string | undefined {\n    return this._config.FANZDASH_API_URL;\n  }\n\n  get fanzDashSecretToken(): string | undefined {\n    return this._config.FANZDASH_SECRET_TOKEN;\n  }\n\n  // Payment Processors (Non-Stripe/PayPal)\n  get ccBillConfig() {\n    return {\n      clientAccnum: this._config.CCBILL_CLIENT_ACCNUM,\n      flexId: this._config.CCBILL_FLEX_ID,\n      salt: this._config.CCBILL_SALT\n    };\n  }\n\n  get paxumConfig() {\n    return {\n      apiKey: this._config.PAXUM_API_KEY,\n      apiSecret: this._config.PAXUM_API_SECRET\n    };\n  }\n\n  get segpayConfig() {\n    return {\n      packageId: this._config.SEGPAY_PACKAGE_ID\n    };\n  }\n\n  // External Services\n  get externalServices() {\n    return {\n      email: this._config.EMAIL_SERVICE_URL,\n      sms: this._config.SMS_SERVICE_URL,\n      notification: this._config.NOTIFICATION_SERVICE_URL\n    };\n  }\n\n  // Feature Flags\n  get features() {\n    return {\n      csrfEnabled: this._config.FEATURE_CSRF_ENABLED,\n      rateLimitingEnabled: this._config.FEATURE_RATE_LIMITING_ENABLED,\n      auditLoggingEnabled: this._config.FEATURE_AUDIT_LOGGING_ENABLED,\n      securityHeadersEnabled: this._config.FEATURE_SECURITY_HEADERS_ENABLED\n    };\n  }\n\n  // ===============================\n  // UTILITY METHODS\n  // ===============================\n\n  /**\n   * Get a safe config object for logging (secrets redacted)\n   */\n  toSafeObject(): Record<string, any> {\n    const safe: Record<string, any> = {};\n    \n    for (const [key, value] of Object.entries(this._config)) {\n      if (this._redactedFields.has(key)) {\n        safe[key] = '[REDACTED]';\n      } else {\n        safe[key] = value;\n      }\n    }\n    \n    return safe;\n  }\n\n  /**\n   * Validate that all required secrets are present\n   */\n  validateSecrets(): void {\n    const requiredSecrets = ['JWT_SECRET', 'CSRF_SECRET', 'ENCRYPTION_KEY'];\n    const missing = requiredSecrets.filter(secret => !this._config[secret as keyof typeof this._config]);\n    \n    if (missing.length > 0) {\n      throw new Error(`❌ Missing required secrets: ${missing.join(', ')}`);\n    }\n  }\n\n  /**\n   * Get configuration for a specific service\n   */\n  getServiceConfig(serviceName: string): Record<string, any> {\n    const serviceConfigs = {\n      'api-gateway': {\n        port: this._config.PORT,\n        cors: this._securityConfig.cors,\n        rateLimiting: this._securityConfig.rateLimiting\n      },\n      'auth-service': {\n        jwtSecret: this._config.JWT_SECRET,\n        rateLimiting: {\n          auth: this._securityConfig.rateLimiting.tiers.auth\n        }\n      },\n      'payment-service': {\n        rateLimiting: {\n          payment: this._securityConfig.rateLimiting.tiers.payment\n        },\n        processors: {\n          ccbill: this.ccBillConfig,\n          paxum: this.paxumConfig,\n          segpay: this.segpayConfig\n        }\n      },\n      'content-service': {\n        validation: this._securityConfig.validation,\n        rateLimiting: {\n          standard: this._securityConfig.rateLimiting.tiers.standard\n        }\n      },\n      'fanzdash': {\n        apiUrl: this._config.FANZDASH_API_URL,\n        secretToken: this._config.FANZDASH_SECRET_TOKEN,\n        security: this._securityConfig\n      }\n    };\n\n    return serviceConfigs[serviceName] || {};\n  }\n}\n\n// ===============================\n// SINGLETON EXPORT\n// ===============================\n\nexport const config = new FanzSecureConfig();\n\n// Validate secrets on module load\nconfig.validateSecrets();\n\n// Log successful initialization (with redacted secrets)\nconsole.log('🔐 FANZ Security Configuration initialized:', {\n  environment: config.nodeEnv,\n  features: config.features,\n  // config: config.toSafeObject() // Uncomment for debugging\n});\n\nexport default config;