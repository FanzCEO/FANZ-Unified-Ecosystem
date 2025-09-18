import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { logger } from '../utils/logger.js';
import { config } from '../config/config.js';
import { securityEvents } from '../events/securityEvents.js';
import { generateSecureRandomString } from '../utils/security.js';

/**
 * Secure Error Handling Middleware
 * 
 * Provides comprehensive error handling with:
 * - Secure error responses without information disclosure
 * - Standardized error shape {code, message, requestId}
 * - PII and sensitive data redaction
 * - Security event emission for suspicious errors
 * - Environment-specific error detail exposure
 */

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface ErrorConfig {
  // Error exposure settings
  exposeSensitiveErrors: boolean;
  exposeStackTraces: boolean;
  exposeErrorDetails: boolean;
  
  // Security settings
  enableSecurityEvents: boolean;
  logFullErrors: boolean;
  redactSensitiveFields: boolean;
  
  // Rate limiting for error responses
  enableErrorRateLimit: boolean;
  errorRateLimitWindow: number; // ms
  errorRateLimitMax: number;
  
  // Custom error mappings
  customErrorMappings: Record<string, SecureErrorResponse>;
  
  // Monitoring and alerting
  enableMetrics: boolean;
  alertOnCriticalErrors: boolean;
}

export interface SecureError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
  isSensitive?: boolean;
  metadata?: Record<string, any>;
  requestId?: string;
  userId?: string;
  correlationId?: string;
}

export interface SecureErrorResponse {
  code: string;
  message: string;
  statusCode: number;
  requestId: string;
  timestamp: string;
  details?: any;
  stack?: string;
  metadata?: Record<string, any>;
}

export interface ErrorContext {
  requestId: string;
  userId?: string;
  ip: string;
  userAgent?: string;
  path: string;
  method: string;
  query?: any;
  body?: any;
  headers?: Record<string, string>;
  timestamp: Date;
}

// =============================================================================
// ERROR CLASSIFICATION
// =============================================================================

const ERROR_CLASSIFICATIONS = {
  // Client Errors (4xx)
  BAD_REQUEST: { statusCode: 400, code: 'BAD_REQUEST', message: 'Invalid request' },
  UNAUTHORIZED: { statusCode: 401, code: 'UNAUTHORIZED', message: 'Authentication required' },
  FORBIDDEN: { statusCode: 403, code: 'FORBIDDEN', message: 'Access denied' },
  NOT_FOUND: { statusCode: 404, code: 'NOT_FOUND', message: 'Resource not found' },
  METHOD_NOT_ALLOWED: { statusCode: 405, code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' },
  CONFLICT: { statusCode: 409, code: 'CONFLICT', message: 'Resource conflict' },
  UNPROCESSABLE_ENTITY: { statusCode: 422, code: 'VALIDATION_ERROR', message: 'Validation failed' },
  TOO_MANY_REQUESTS: { statusCode: 429, code: 'RATE_LIMITED', message: 'Too many requests' },
  
  // Server Errors (5xx)
  INTERNAL_SERVER_ERROR: { statusCode: 500, code: 'INTERNAL_ERROR', message: 'Internal server error' },
  NOT_IMPLEMENTED: { statusCode: 501, code: 'NOT_IMPLEMENTED', message: 'Feature not implemented' },
  BAD_GATEWAY: { statusCode: 502, code: 'BAD_GATEWAY', message: 'Bad gateway' },
  SERVICE_UNAVAILABLE: { statusCode: 503, code: 'SERVICE_UNAVAILABLE', message: 'Service temporarily unavailable' },
  GATEWAY_TIMEOUT: { statusCode: 504, code: 'GATEWAY_TIMEOUT', message: 'Gateway timeout' },
  
  // Security-related errors
  CSRF_TOKEN_INVALID: { statusCode: 403, code: 'CSRF_INVALID', message: 'CSRF token invalid' },
  SIGNATURE_INVALID: { statusCode: 401, code: 'SIGNATURE_INVALID', message: 'Signature verification failed' },
  TOKEN_EXPIRED: { statusCode: 401, code: 'TOKEN_EXPIRED', message: 'Token expired' },
  INSUFFICIENT_PERMISSIONS: { statusCode: 403, code: 'INSUFFICIENT_PERMISSIONS', message: 'Insufficient permissions' },
  
  // Operational errors
  DATABASE_ERROR: { statusCode: 500, code: 'DATABASE_ERROR', message: 'Database operation failed' },
  NETWORK_ERROR: { statusCode: 502, code: 'NETWORK_ERROR', message: 'Network error' },
  TIMEOUT_ERROR: { statusCode: 504, code: 'TIMEOUT_ERROR', message: 'Operation timed out' }
} as const;

// =============================================================================
// SENSITIVE FIELD PATTERNS
// =============================================================================

const SENSITIVE_FIELD_PATTERNS = [
  // Authentication & Authorization
  /password/i,
  /token/i,
  /secret/i,
  /key/i,
  /auth/i,
  /bearer/i,
  /jwt/i,
  
  // Personal Information
  /email/i,
  /phone/i,
  /ssn/i,
  /social/i,
  /credit/i,
  /card/i,
  /account/i,
  
  // Financial
  /amount/i,
  /balance/i,
  /payment/i,
  /transaction/i,
  
  // Internal
  /config/i,
  /env/i,
  /database/i,
  /redis/i,
  /connection/i
];

// =============================================================================
// ERROR HANDLER CLASS
// =============================================================================

export class ErrorHandler {
  private config: ErrorConfig;
  private errorCounts: Map<string, number> = new Map();
  
  constructor(userConfig: Partial<ErrorConfig> = {}) {
    this.config = this.mergeConfig(userConfig);
  }
  
  private mergeConfig(userConfig: Partial<ErrorConfig>): ErrorConfig {
    const defaultConfig: ErrorConfig = {
      exposeSensitiveErrors: config.NODE_ENV === 'development',
      exposeStackTraces: config.NODE_ENV === 'development',
      exposeErrorDetails: config.NODE_ENV === 'development',
      enableSecurityEvents: true,
      logFullErrors: true,
      redactSensitiveFields: true,
      enableErrorRateLimit: true,
      errorRateLimitWindow: 60000, // 1 minute
      errorRateLimitMax: 100,
      customErrorMappings: {},
      enableMetrics: true,
      alertOnCriticalErrors: true
    };
    
    return { ...defaultConfig, ...userConfig };
  }
  
  /**
   * Redact sensitive information from objects
   */
  private redactSensitiveData(obj: any, depth = 0): any {
    if (!this.config.redactSensitiveFields || depth > 10) {
      return obj;
    }
    
    if (obj === null || obj === undefined) {
      return obj;
    }
    
    if (typeof obj === 'string') {
      // Check if string looks like sensitive data
      if (obj.length > 20 && (obj.includes('Bearer') || obj.includes('jwt') || obj.includes('key'))) {
        return '[REDACTED]';
      }
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.redactSensitiveData(item, depth + 1));
    }
    
    if (typeof obj === 'object') {
      const redacted: any = {};
      
      for (const [key, value] of Object.entries(obj)) {
        const isKeySensitive = SENSITIVE_FIELD_PATTERNS.some(pattern => 
          pattern.test(key)
        );
        
        if (isKeySensitive) {
          redacted[key] = '[REDACTED]';
        } else {
          redacted[key] = this.redactSensitiveData(value, depth + 1);
        }
      }
      
      return redacted;
    }
    
    return obj;
  }
  
  /**
   * Generate a unique request ID for error tracking
   */
  private generateRequestId(): string {
    return generateSecureRandomString(16, 'hex');
  }
  
  /**
   * Extract error context from request
   */
  private extractErrorContext(req: Request, error: SecureError): ErrorContext {
    return {
      requestId: error.requestId || (req as any).requestId || this.generateRequestId(),
      userId: (req as any).user?.id,
      ip: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
      query: this.config.redactSensitiveFields ? this.redactSensitiveData(req.query) : req.query,
      body: this.config.redactSensitiveFields ? this.redactSensitiveData(req.body) : req.body,
      headers: this.config.redactSensitiveFields ? this.redactSensitiveData(req.headers) : req.headers,
      timestamp: new Date()
    };
  }
  
  /**
   * Classify error and get appropriate response
   */
  private classifyError(error: SecureError): SecureErrorResponse {
    // Check custom mappings first
    if (error.code && this.config.customErrorMappings[error.code]) {
      return this.config.customErrorMappings[error.code];
    }
    
    // Check known error classifications
    const classification = Object.values(ERROR_CLASSIFICATIONS)
      .find(cls => cls.code === error.code || cls.statusCode === error.statusCode);
    
    if (classification) {
      return {
        code: classification.code,
        message: classification.message,
        statusCode: classification.statusCode,
        requestId: error.requestId || this.generateRequestId(),
        timestamp: new Date().toISOString()
      };
    }
    
    // Default to internal server error for unclassified errors
    return {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
      statusCode: error.statusCode || 500,
      requestId: error.requestId || this.generateRequestId(),
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Check if error should trigger security event
   */
  private shouldEmitSecurityEvent(error: SecureError, context: ErrorContext): boolean {
    if (!this.config.enableSecurityEvents) {
      return false;
    }
    
    // Security-related errors
    const securityErrorCodes = [
      'CSRF_INVALID',
      'SIGNATURE_INVALID',
      'TOKEN_EXPIRED',
      'UNAUTHORIZED',
      'FORBIDDEN',
      'INSUFFICIENT_PERMISSIONS'
    ];
    
    if (error.code && securityErrorCodes.includes(error.code)) {
      return true;
    }
    
    // Suspicious patterns
    if (context.path.includes('..') || 
        context.path.includes('<script>') ||
        (context.userAgent && context.userAgent.includes('sqlmap'))) {
      return true;
    }
    
    // High error rates from same IP
    const errorKey = `${context.ip}:${error.code}`;
    const currentCount = this.errorCounts.get(errorKey) || 0;
    this.errorCounts.set(errorKey, currentCount + 1);
    
    // Clean up old counts
    setTimeout(() => {
      this.errorCounts.delete(errorKey);
    }, this.config.errorRateLimitWindow);
    
    return currentCount > this.config.errorRateLimitMax / 2;
  }
  
  /**
   * Emit security event for suspicious errors
   */
  private async emitSecurityEvent(error: SecureError, context: ErrorContext): Promise<void> {
    if (!this.shouldEmitSecurityEvent(error, context)) {
      return;
    }
    
    const severity = this.getErrorSeverity(error);
    
    await securityEvents.emit({
      type: 'error_security_event',
      severity,
      source: 'error-handler',
      userId: context.userId,
      ip: context.ip,
      userAgent: context.userAgent,
      metadata: {
        errorCode: error.code,
        statusCode: error.statusCode,
        path: context.path,
        method: context.method,
        message: error.message,
        isOperational: error.isOperational,
        isSensitive: error.isSensitive,
        requestId: context.requestId
      }
    });
  }
  
  /**
   * Determine error severity for monitoring
   */
  private getErrorSeverity(error: SecureError): 'low' | 'medium' | 'high' | 'critical' {
    if (error.statusCode && error.statusCode >= 500) {
      return 'high';
    }
    
    const criticalErrors = ['CSRF_INVALID', 'SIGNATURE_INVALID', 'DATABASE_ERROR'];
    if (error.code && criticalErrors.includes(error.code)) {
      return 'critical';
    }
    
    const highSeverityErrors = ['UNAUTHORIZED', 'FORBIDDEN', 'TOKEN_EXPIRED'];
    if (error.code && highSeverityErrors.includes(error.code)) {
      return 'high';
    }
    
    return 'medium';
  }
  
  /**
   * Log error with appropriate level and redaction
   */
  private logError(error: SecureError, context: ErrorContext): void {
    const logData = {
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        isOperational: error.isOperational,
        isSensitive: error.isSensitive,
        ...(this.config.exposeStackTraces && { stack: error.stack })
      },
      context: this.config.redactSensitiveFields ? this.redactSensitiveData(context) : context
    };
    
    const severity = this.getErrorSeverity(error);
    
    switch (severity) {
      case 'critical':
        logger.error('Critical error occurred', logData);
        break;
      case 'high':
        logger.error('High severity error', logData);
        break;
      case 'medium':
        logger.warn('Medium severity error', logData);
        break;
      default:
        logger.info('Low severity error', logData);
    }
  }
  
  /**
   * Build secure error response
   */
  private buildErrorResponse(error: SecureError, context: ErrorContext): SecureErrorResponse {
    const baseResponse = this.classifyError(error);
    
    // Add development details if enabled
    if (this.config.exposeErrorDetails && config.NODE_ENV === 'development') {
      baseResponse.details = {
        originalMessage: error.message,
        originalCode: error.code,
        isOperational: error.isOperational,
        metadata: this.redactSensitiveData(error.metadata)
      };
    }
    
    // Add stack trace if enabled
    if (this.config.exposeStackTraces && config.NODE_ENV === 'development') {
      baseResponse.stack = error.stack;
    }
    
    // Override request ID
    baseResponse.requestId = context.requestId;
    
    return baseResponse;
  }
  
  /**
   * Main error handling middleware
   */
  middleware() {
    return async (error: SecureError, req: Request, res: Response, next: NextFunction) => {
      // Skip if response already sent
      if (res.headersSent) {
        return next(error);
      }
      
      try {
        // Extract context
        const context = this.extractErrorContext(req, error);
        
        // Ensure error has required properties
        if (!error.requestId) {
          error.requestId = context.requestId;
        }
        
        // Log error
        if (this.config.logFullErrors) {
          this.logError(error, context);
        }
        
        // Emit security event if needed
        await this.emitSecurityEvent(error, context);
        
        // Build response
        const errorResponse = this.buildErrorResponse(error, context);
        
        // Set security headers
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('Cache-Control', 'no-store');
        
        // Send response
        res.status(errorResponse.statusCode).json(errorResponse);
        
      } catch (handlingError) {
        // Fallback error handling
        logger.error('Error in error handler', {
          originalError: error.message,
          handlingError: handlingError.message
        });
        
        res.status(500).json({
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
          requestId: this.generateRequestId(),
          timestamp: new Date().toISOString()
        });
      }
    };
  }
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Create secure error handler middleware
 */
export function createErrorHandler(config: Partial<ErrorConfig> = {}) {
  const errorHandler = new ErrorHandler(config);
  return errorHandler.middleware();
}

/**
 * Create production error handler (strict settings)
 */
export function createProductionErrorHandler(config: Partial<ErrorConfig> = {}) {
  const productionConfig: Partial<ErrorConfig> = {
    exposeSensitiveErrors: false,
    exposeStackTraces: false,
    exposeErrorDetails: false,
    enableSecurityEvents: true,
    logFullErrors: true,
    redactSensitiveFields: true,
    alertOnCriticalErrors: true,
    ...config
  };
  
  return createErrorHandler(productionConfig);
}

/**
 * Create development error handler (permissive settings)
 */
export function createDevelopmentErrorHandler(config: Partial<ErrorConfig> = {}) {
  const devConfig: Partial<ErrorConfig> = {
    exposeSensitiveErrors: true,
    exposeStackTraces: true,
    exposeErrorDetails: true,
    enableSecurityEvents: false,
    redactSensitiveFields: false,
    ...config
  };
  
  return createErrorHandler(devConfig);
}

/**
 * Create a secure error object
 */
export function createSecureError(
  message: string,
  code: string,
  statusCode: number = 500,
  options: Partial<SecureError> = {}
): SecureError {
  const error = new Error(message) as SecureError;
  error.code = code;
  error.statusCode = statusCode;
  error.isOperational = options.isOperational ?? true;
  error.isSensitive = options.isSensitive ?? false;
  error.metadata = options.metadata;
  error.requestId = options.requestId;
  error.userId = options.userId;
  error.correlationId = options.correlationId;
  
  return error;
}

/**
 * Create secure error response without middleware
 */
export function secureErrorResponse(
  error: SecureError,
  requestId: string = '',
  exposeDetails: boolean = false
): SecureErrorResponse {
  const handler = new ErrorHandler({ exposeErrorDetails: exposeDetails });
  const context: ErrorContext = {
    requestId: requestId || error.requestId || generateSecureRandomString(16, 'hex'),
    ip: 'unknown',
    path: 'unknown',
    method: 'unknown',
    timestamp: new Date()
  };
  
  return (handler as any).buildErrorResponse(error, context);
}

export { ErrorHandler as default };