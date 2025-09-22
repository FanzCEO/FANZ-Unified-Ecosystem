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
});

// ===============================
// CONFIGURATION CLASS
// ===============================

class FanzSecureConfig {
  private readonly _config: z.infer<typeof EnvironmentSchema>;
  private readonly _securityConfig: SecurityConfig;
  private readonly _isProduction: boolean;
  private readonly _redactedFields = new Set([
    'JWT_SECRET',
    'CSRF_SECRET', 
    'ENCRYPTION_KEY',
    'REDIS_PASSWORD',
    'CCBILL_SALT',
    'PAXUM_API_SECRET',
    'FANZDASH_SECRET_TOKEN'
  ]);

  constructor() {
    this._config = this.validateEnvironment();
    this._isProduction = this._config.NODE_ENV === 'production';
    this._securityConfig = this.buildSecurityConfig();
    
    // Freeze the config to prevent runtime modifications
    Object.freeze(this._config);
    Object.freeze(this._securityConfig);
  }

  private validateEnvironment(): z.infer<typeof EnvironmentSchema> {
    const result = EnvironmentSchema.safeParse(process.env);
    
    if (!result.success) {
      const errors = result.error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join('\n');
      
      throw new Error(`❌ Environment validation failed:\n${errors}`);
    }
    
    return result.data;
  }

  private buildSecurityConfig(): SecurityConfig {
    return {
      cors: {
        origins: this._config.CORS_ORIGINS,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: [
          'Content-Type',
          'Authorization', 
          'X-Requested-With',
          'X-CSRF-Token',
          this._config.LOG_CORRELATION_HEADER
        ],
        exposedHeaders: [
          'X-Rate-Limit-Remaining',
          'X-Rate-Limit-Reset',
          'X-Rate-Limit-Tier'
        ],
        maxAge: 86400, // 24 hours
        preflightContinue: false
      },
      
      csp: {
        nonce: true,
        reportOnly: !this._isProduction,
        reportUri: this._config.CSP_REPORT_URI,
        directives: {
          'default-src': ["'none'"],
          'base-uri': ["'none'"],
          'frame-ancestors': ["'none'"],
          'script-src': ["'self'", "'nonce-{nonce}"],
          'style-src': ["'self'"],
          'connect-src': ["'self'", 'api.fanz.*', 'wss:'],
          'img-src': ["'self'", 'data:', 'https:'],
          'font-src': ["'self'"],
          'media-src': ["'self'"],
          'object-src': ["'none'"],
          'frame-src': this._isProduction ? ["'none'"] : ["'self'"]
        }
      },
      
      rateLimiting: {
        tiers: {
          auth: {
            points: this._config.RATE_LIMIT_AUTH_POINTS,
            duration: this._config.RATE_LIMIT_AUTH_DURATION,
            blockDuration: this._config.RATE_LIMIT_AUTH_DURATION * 10, // 10x block duration
            execEvenly: true
          },
          payment: {
            points: this._config.RATE_LIMIT_PAYMENT_POINTS,
            duration: this._config.RATE_LIMIT_PAYMENT_DURATION,
            blockDuration: this._config.RATE_LIMIT_PAYMENT_DURATION * 5,
            execEvenly: true
          },
          standard: {
            points: this._config.RATE_LIMIT_STANDARD_POINTS,
            duration: this._config.RATE_LIMIT_STANDARD_DURATION,
            blockDuration: this._config.RATE_LIMIT_STANDARD_DURATION * 2,
            execEvenly: false
          },
          webhook: {
            points: 100,
            duration: 60,
            blockDuration: 300, // 5 minutes
            execEvenly: false
          }
        },
        redis: this._config.REDIS_URL ? undefined : {
          host: this._config.REDIS_HOST,
          port: this._config.REDIS_PORT,
          password: this._config.REDIS_PASSWORD,
          db: this._config.REDIS_DB
        },
        skipSuccessfulRequests: false,
        skipFailedRequests: false
      },
      
      csrf: {
        enabled: this._config.FEATURE_CSRF_ENABLED,
        cookieName: '__fanz-csrf',
        headerName: 'X-CSRF-Token',
        secret: this._config.CSRF_SECRET,
        sessionKey: 'csrf',
        ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
        excludedPaths: [
          '/api/webhooks/',
          '/api/health',
          '/api/ready',
          '/api/metrics'
        ]
      },
      
      validation: {
        stripUnknown: true,
        abortEarly: false,
        maxDepth: 10,
        maxArrayLength: 1000,
        maxStringLength: 100000,
        sanitization: {
          html: true,
          sql: true,
          xss: true
        }
      },
      
      logging: {
        level: this._config.LOG_LEVEL,
        redactedFields: [
          'password',
          'token',
          'secret',
          'key',
          'authorization',
          'cookie',
          'session',
          'csrf',
          'ssn',
          'creditCard',
          'email',
          'phone'
        ],
        correlationIdHeader: this._config.LOG_CORRELATION_HEADER,
        auditLog: this._config.FEATURE_AUDIT_LOGGING_ENABLED,
        securityEvents: true
      },
      
      helmet: {
        contentSecurityPolicy: this._config.FEATURE_SECURITY_HEADERS_ENABLED,
        hsts: this._isProduction,
        noSniff: true,
        frameguard: true,
        xssFilter: true,
        dnsPrefetchControl: true,
        hidePoweredBy: true,
        ieNoOpen: true,
        noCache: false,
        originAgentCluster: true,
        permittedCrossDomainPolicies: false,
        referrerPolicy: true
      }
    };
  }

  // ===============================
  // PUBLIC GETTERS
  // ===============================

  get nodeEnv(): string {
    return this._config.NODE_ENV;
  }

  get port(): number {
    return this._config.PORT;
  }

  get isProduction(): boolean {
    return this._isProduction;
  }

  get isDevelopment(): boolean {
    return this._config.NODE_ENV === 'development';
  }

  get isStaging(): boolean {
    return this._config.NODE_ENV === 'staging';
  }

  get security(): SecurityConfig {
    return this._securityConfig;
  }

  get databaseUrl(): string {
    return this._config.DATABASE_URL;
  }

  get redisUrl(): string | undefined {
    return this._config.REDIS_URL;
  }

  get jwtSecret(): string {
    return this._config.JWT_SECRET;
  }

  get encryptionKey(): string {
    return this._config.ENCRYPTION_KEY;
  }

  // FanzDash Integration
  get fanzDashApiUrl(): string | undefined {
    return this._config.FANZDASH_API_URL;
  }

  get fanzDashSecretToken(): string | undefined {
    return this._config.FANZDASH_SECRET_TOKEN;
  }

  // Payment Processors (Non-Stripe/PayPal)
  get ccBillConfig() {
    return {
      clientAccnum: this._config.CCBILL_CLIENT_ACCNUM,
      flexId: this._config.CCBILL_FLEX_ID,
      salt: this._config.CCBILL_SALT
    };
  }

  get paxumConfig() {
    return {
      apiKey: this._config.PAXUM_API_KEY,
      apiSecret: this._config.PAXUM_API_SECRET
    };
  }

  get segpayConfig() {
    return {
      packageId: this._config.SEGPAY_PACKAGE_ID
    };
  }

  // External Services
  get externalServices() {
    return {
      email: this._config.EMAIL_SERVICE_URL,
      sms: this._config.SMS_SERVICE_URL,
      notification: this._config.NOTIFICATION_SERVICE_URL
    };
  }

  // Feature Flags
  get features() {
    return {
      csrfEnabled: this._config.FEATURE_CSRF_ENABLED,
      rateLimitingEnabled: this._config.FEATURE_RATE_LIMITING_ENABLED,
      auditLoggingEnabled: this._config.FEATURE_AUDIT_LOGGING_ENABLED,
      securityHeadersEnabled: this._config.FEATURE_SECURITY_HEADERS_ENABLED
    };
  }

  // ===============================
  // UTILITY METHODS
  // ===============================

  /**
   * Get a safe config object for logging (secrets redacted)
   */
  toSafeObject(): Record<string, any> {
    const safe: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(this._config)) {
      if (this._redactedFields.has(key)) {
        safe[key] = '[REDACTED]';
      } else {
        safe[key] = value;
      }
    }
    
    return safe;
  }

  /**
   * Validate that all required secrets are present
   */
  validateSecrets(): void {
    const requiredSecrets = ['JWT_SECRET', 'CSRF_SECRET', 'ENCRYPTION_KEY'];
    const missing = requiredSecrets.filter(secret => !this._config[secret as keyof typeof this._config]);
    
    if (missing.length > 0) {
      throw new Error(`❌ Missing required secrets: ${missing.join(', ')}`);
    }
  }

  /**
   * Get configuration for a specific service
   */
  getServiceConfig(serviceName: string): Record<string, any> {
    const serviceConfigs = {
      'api-gateway': {
        port: this._config.PORT,
        cors: this._securityConfig.cors,
        rateLimiting: this._securityConfig.rateLimiting
      },
      'auth-service': {
        jwtSecret: this._config.JWT_SECRET,
        rateLimiting: {
          auth: this._securityConfig.rateLimiting.tiers.auth
        }
      },
      'payment-service': {
        rateLimiting: {
          payment: this._securityConfig.rateLimiting.tiers.payment
        },
        processors: {
          ccbill: this.ccBillConfig,
          paxum: this.paxumConfig,
          segpay: this.segpayConfig
        }
      },
      'content-service': {
        validation: this._securityConfig.validation,
        rateLimiting: {
          standard: this._securityConfig.rateLimiting.tiers.standard
        }
      },
      'fanzdash': {
        apiUrl: this._config.FANZDASH_API_URL,
        secretToken: this._config.FANZDASH_SECRET_TOKEN,
        security: this._securityConfig
      }
    };

    return serviceConfigs[serviceName] || {};
  }
}

// ===============================
// SINGLETON EXPORT
// ===============================

export const config = new FanzSecureConfig();

// Validate secrets on module load
config.validateSecrets();

// Log successful initialization (with redacted secrets)
console.log('🔐 FANZ Security Configuration initialized:', {
  environment: config.nodeEnv,
  features: config.features,
  // config: config.toSafeObject() // Uncomment for debugging
});

export default config;
