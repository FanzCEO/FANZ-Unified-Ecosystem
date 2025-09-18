/**
 * @fanz/secure - Core Security Types and Interfaces
 * Enterprise-grade security middleware for FANZ Unified Ecosystem
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// ===============================
// CORE TYPES
// ===============================

export interface SecurityConfig {
  cors: CorsConfig;
  csp: CspConfig;
  rateLimiting: RateLimitConfig;
  csrf: CsrfConfig;
  validation: ValidationConfig;
  logging: LoggingConfig;
  helmet: HelmetConfig;
}

export interface CorsConfig {
  origins: string[];
  credentials: boolean;
  methods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  maxAge: number;
  preflightContinue: boolean;
}

export interface CspConfig {
  nonce: boolean;
  directives: Record<string, string[]>;
  reportOnly: boolean;
  reportUri?: string;
}

export interface RateLimitConfig {
  tiers: {
    auth: RateLimitTier;
    payment: RateLimitTier;
    standard: RateLimitTier;
    webhook: RateLimitTier;
  };
  redis?: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
  skipSuccessfulRequests: boolean;
  skipFailedRequests: boolean;
}

export interface RateLimitTier {
  points: number; // Number of requests allowed
  duration: number; // Time window in seconds
  blockDuration: number; // Block duration in seconds after limit exceeded
  execEvenly: boolean; // Spread requests evenly across the duration
}

export interface CsrfConfig {
  enabled: boolean;
  cookieName: string;
  headerName: string;
  secret: string;
  sessionKey: string;
  ignoredMethods: string[];
  excludedPaths: string[];
}

export interface ValidationConfig {
  stripUnknown: boolean;
  abortEarly: boolean;
  maxDepth: number;
  maxArrayLength: number;
  maxStringLength: number;
  sanitization: {
    html: boolean;
    sql: boolean;
    xss: boolean;
  };
}

export interface LoggingConfig {
  level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  redactedFields: string[];
  correlationIdHeader: string;
  auditLog: boolean;
  securityEvents: boolean;
}

export interface HelmetConfig {
  contentSecurityPolicy: boolean;
  hsts: boolean;
  noSniff: boolean;
  frameguard: boolean;
  xssFilter: boolean;
  dnsPrefetchControl: boolean;
  hidePoweredBy: boolean;
  ieNoOpen: boolean;
  noCache: boolean;
  originAgentCluster: boolean;
  permittedCrossDomainPolicies: boolean;
  referrerPolicy: boolean;
}

// ===============================
// MIDDLEWARE TYPES
// ===============================

export interface SecurityMiddleware {
  (req: Request, res: Response, next: NextFunction): void | Promise<void>;
}

export interface AsyncSecurityMiddleware {
  (req: Request, res: Response, next: NextFunction): Promise<void>;
}

export interface SecurityContext {
  requestId: string;
  userId?: string;
  sessionId?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  path: string;
  method: string;
}

export interface SecurityEvent {
  type: SecurityEventType;
  severity: SecuritySeverity;
  context: SecurityContext;
  details: Record<string, any>;
  timestamp: Date;
}

export type SecurityEventType = 
  | 'AUTH_FAILURE'
  | 'RATE_LIMIT_EXCEEDED'
  | 'VALIDATION_FAILED'
  | 'CSRF_VIOLATION'
  | 'SUSPICIOUS_ACTIVITY'
  | 'UNAUTHORIZED_ACCESS'
  | 'INPUT_INJECTION_ATTEMPT'
  | 'WEBHOOK_SIGNATURE_FAILED'
  | 'SESSION_ANOMALY'
  | 'PRIVILEGE_ESCALATION';

export type SecuritySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

// ===============================
// VALIDATION SCHEMAS
// ===============================

export const SecurityConfigSchema = z.object({
  cors: z.object({
    origins: z.array(z.string().url()),
    credentials: z.boolean(),
    methods: z.array(z.string()),
    allowedHeaders: z.array(z.string()),
    exposedHeaders: z.array(z.string()),
    maxAge: z.number().positive(),
    preflightContinue: z.boolean()
  }),
  
  csp: z.object({
    nonce: z.boolean(),
    directives: z.record(z.array(z.string())),
    reportOnly: z.boolean(),
    reportUri: z.string().url().optional()
  }),
  
  rateLimiting: z.object({
    tiers: z.object({
      auth: z.object({
        points: z.number().positive(),
        duration: z.number().positive(),
        blockDuration: z.number().positive(),
        execEvenly: z.boolean()
      }),
      payment: z.object({
        points: z.number().positive(),
        duration: z.number().positive(),
        blockDuration: z.number().positive(),
        execEvenly: z.boolean()
      }),
      standard: z.object({
        points: z.number().positive(),
        duration: z.number().positive(),
        blockDuration: z.number().positive(),
        execEvenly: z.boolean()
      }),
      webhook: z.object({
        points: z.number().positive(),
        duration: z.number().positive(),
        blockDuration: z.number().positive(),
        execEvenly: z.boolean()
      })
    }),
    redis: z.object({
      host: z.string(),
      port: z.number().positive(),
      password: z.string().optional(),
      db: z.number().optional()
    }).optional(),
    skipSuccessfulRequests: z.boolean(),
    skipFailedRequests: z.boolean()
  })
});

// ===============================
// UTILITY TYPES
// ===============================

export interface ValidatedRequest<
  TParams = any,
  TQuery = any,
  TBody = any
> extends Request {
  validatedParams: TParams;
  validatedQuery: TQuery;
  validatedBody: TBody;
  security: SecurityContext;
}

export interface SecurityError extends Error {
  code: string;
  statusCode: number;
  severity: SecuritySeverity;
  context?: SecurityContext;
  details?: Record<string, any>;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
  tier: string;
}

export interface CsrfTokens {
  token: string;
  hashedToken: string;
  timestamp: number;
}

// ===============================
// COMMON VALIDATION SCHEMAS
// ===============================

export const CommonSchemas = {
  // UUIDs
  uuid: z.string().uuid(),
  
  // Email addresses
  email: z.string().email().max(254),
  
  // URLs
  url: z.string().url().max(2048),
  
  // Pagination
  pagination: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sortBy: z.string().max(100).optional(),
    sortOrder: z.enum(['asc', 'desc']).default('asc')
  }),
  
  // Currency amounts (in cents to avoid floating point issues)
  currencyAmount: z.number().int().min(0).max(99999999), // Up to $999,999.99
  
  // ISO dates
  isoDate: z.string().datetime({ offset: true }),
  
  // Safe file names
  filename: z.string()
    .max(255)
    .regex(/^[a-zA-Z0-9._-]+$/, 'Invalid filename format'),
  
  // Path segments
  pathSegment: z.string()
    .max(100)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid path segment'),
  
  // Slugs
  slug: z.string()
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format'),
  
  // Content text with HTML sanitization
  contentText: z.string().max(10000).transform((val) => {
    // This will be implemented in the sanitization module
    return val.trim();
  })
};

// ===============================
// EXPORTS
// ===============================

export type SecurityMiddlewareChain = SecurityMiddleware[];
export type SecurityConfigPartial = Partial<SecurityConfig>;