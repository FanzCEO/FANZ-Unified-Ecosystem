/**
 * @fanz/secure - Advanced Security Logging with Audit Trail
 * Production-ready logging with security event tracking
 */

import pino from 'pino';
import pinoHttp from 'pino-http';
import { config } from '../config.js';
import type { Request, Response } from 'express';

// ===============================
// TYPES
// ===============================

export interface SecurityEvent {
  type: SecurityEventType;
  severity: SecuritySeverity;
  context: SecurityContext;
  details: Record<string, any>;
  timestamp: Date;
}

export type SecurityEventType =
  | 'AUTH_ATTEMPT'
  | 'AUTH_SUCCESS'
  | 'AUTH_FAILURE'
  | 'PERMISSION_DENIED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'SUSPICIOUS_ACTIVITY'
  | 'DATA_BREACH_ATTEMPT'
  | 'SYSTEM_COMPROMISE'
  | 'CSRF_ATTACK'
  | 'XSS_ATTEMPT'
  | 'SQL_INJECTION'
  | 'MALICIOUS_INPUT'
  | 'ACCOUNT_LOCKOUT'
  | 'PASSWORD_CHANGE'
  | 'SESSION_HIJACK'
  | 'API_ABUSE'
  | 'COMPLIANCE_VIOLATION';

export type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical';

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

// ===============================
// CONSTANTS
// ===============================

const SECURITY_REDACTED_PATHS = [
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
];

// ===============================
// BASE LOGGER FACTORY
// ===============================

function createBaseLogger(component: string): pino.Logger {
  const logConfig: pino.LoggerOptions = {
    name: `fanz-secure:${component}`,
    level: config.security.logging.level,
    
    // Production formatting
    ...(config.isProduction ? {
      // Structured JSON for production
      formatters: {
        level: (label: string) => ({ level: label }),
        log: (object: Record<string, any>) => {
          // Redact sensitive fields automatically
          return sanitizeForLogging(object);
        }
      }
    } : {
      // Human-readable for development
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          singleLine: false,
          translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
          ignore: 'pid,hostname',
          messageFormat: '{component} | {msg}'
        }
      }
    }),
    
    // Base fields
    base: {
      service: 'fanz-unified-ecosystem',
      version: process.env.npm_package_version || '1.0.0',
      environment: config.nodeEnv,
      pid: process.pid
    },
    
    // Redaction configuration
    redact: {
      paths: SECURITY_REDACTED_PATHS.map(path => `*.${path}`),
      censor: '[REDACTED]'
    }
  };
  
  return pino(logConfig);
}

// ===============================
// SECURITY EVENT LOGGER
// ===============================

class SecurityLogger {
  private logger: pino.Logger;
  private component: string;

  constructor(component: string) {
    this.component = component;
    this.logger = createBaseLogger(component);
  }

  // Standard logging methods
  trace(message: string, context?: Record<string, any>) {
    this.logger.trace({ component: this.component, ...context }, message);
  }

  debug(message: string, context?: Record<string, any>) {
    this.logger.debug({ component: this.component, ...context }, message);
  }

  info(message: string, context?: Record<string, any>) {
    this.logger.info({ component: this.component, ...context }, message);
  }

  warn(message: string, context?: Record<string, any>) {
    this.logger.warn({ component: this.component, ...context }, message);
  }

  error(message: string, context?: Record<string, any>) {
    this.logger.error({ component: this.component, ...context }, message);
  }

  fatal(message: string, context?: Record<string, any>) {
    this.logger.fatal({ component: this.component, ...context }, message);
  }

  // Security-specific logging methods
  security(event: SecurityEvent) {
    this.logger.warn(
      {
        component: this.component,
        securityEvent: true,
        eventType: event.type,
        severity: event.severity,
        context: event.context,
        details: event.details
      },
      `Security Event: ${event.type}`
    );
  }

  audit(action: string, context: Record<string, any>) {
    if (!config.security.logging.auditLog) {
      return;
    }

    this.logger.info(
      {
        component: this.component,
        auditLog: true,
        action,
        ...context
      },
      `Audit: ${action}`
    );
  }

  performance(operation: string, duration: number, context?: Record<string, any>) {
    this.logger.info(
      {
        component: this.component,
        performanceLog: true,
        operation,
        duration,
        ...context
      },
      `Performance: ${operation} took ${duration}ms`
    );
  }

  // Create child logger with additional context
  child(context: Record<string, any>): SecurityLogger {
    const childLogger = new SecurityLogger(this.component);
    childLogger.logger = this.logger.child(context);
    return childLogger;
  }
}

// ===============================
// HTTP MIDDLEWARE LOGGER
// ===============================

export const createHttpLogger = () => {
  return pinoHttp({
    logger: createBaseLogger('http'),
    
    // Generate or extract correlation ID
    genReqId: (req: Request) => {
      const correlationHeader = config.security.logging.correlationIdHeader;
      return req.headers[correlationHeader] as string || 
             req.headers['x-request-id'] as string ||
             generateCorrelationId();
    },
    
    // Redact sensitive request data
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.body.password',
        'req.body.token',
        'req.body.secret',
        'res.headers.authorization',
        'res.headers.cookie'
      ],
      censor: '[REDACTED]'
    },
    
    // Custom request/response serializers
    serializers: {
      req: (req: Request) => ({
        id: req.id,
        method: req.method,
        url: req.url,
        path: req.path,
        query: req.query,
        params: req.params,
        headers: {
          ...req.headers,
          authorization: req.headers.authorization ? '[REDACTED]' : undefined,
          cookie: req.headers.cookie ? '[REDACTED]' : undefined
        },
        remoteAddress: req.ip,
        userAgent: req.headers['user-agent']
      }),
      
      res: (res: Response) => ({
        statusCode: res.statusCode,
        headers: {
          ...res.getHeaders(),
          authorization: res.getHeader('authorization') ? '[REDACTED]' : undefined,
          cookie: res.getHeader('cookie') ? '[REDACTED]' : undefined
        }
      })
    },
    
    // Custom log level based on status code
    customLogLevel: (req: Request, res: Response, err: Error | undefined) => {
      if (res.statusCode >= 400 && res.statusCode < 500) {
        return 'warn';
      } else if (res.statusCode >= 500 || err) {
        return 'error';
      }
      return 'info';
    },
    
    // Custom success message
    customSuccessMessage: (req: Request, res: Response) => {
      return `${req.method} ${req.url} ${res.statusCode}`;
    },
    
    // Custom error message
    customErrorMessage: (req: Request, res: Response, err: Error) => {
      return `${req.method} ${req.url} ${res.statusCode} - ${err.message}`;
    }
  });
};

// ===============================
// UTILITY FUNCTIONS
// ===============================

function generateCorrelationId(): string {
  return `fanz-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Sanitize object for logging (remove/redact sensitive fields)
 */
export function sanitizeForLogging(obj: any): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const sanitized = Array.isArray(obj) ? [] : {};
  
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    
    // Check if key contains sensitive information
    const isSensitive = SECURITY_REDACTED_PATHS.some(path => 
      lowerKey.includes(path.toLowerCase())
    );
    
    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeForLogging(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Create performance timing wrapper
 */
export function createPerformanceTimer(logger: SecurityLogger, operation: string) {
  const start = Date.now();
  
  return {
    end: (context?: Record<string, any>) => {
      const duration = Date.now() - start;
      logger.performance(operation, duration, context);
      return duration;
    }
  };
}

/**
 * Log security event with correlation
 */
export function logSecurityEvent(
  logger: SecurityLogger,
  event: SecurityEvent,
  correlationId?: string
) {
  const contextWithCorrelation = {
    ...event.context,
    correlationId: correlationId || generateCorrelationId()
  };
  
  logger.security({
    ...event,
    context: contextWithCorrelation
  });
}

// ===============================
// FACTORY FUNCTIONS
// ===============================

/**
 * Create security logger for a specific component
 */
export function createSecurityLogger(component: string): SecurityLogger {
  return new SecurityLogger(component);
}

/**
 * Create audit logger (alias for security logger with audit focus)
 */
export function createAuditLogger(component: string): SecurityLogger {
  const logger = new SecurityLogger(`audit:${component}`);
  return logger;
}

/**
 * Create correlation ID middleware
 */
export function correlationIdMiddleware() {
  const header = config.security.logging.correlationIdHeader;
  
  return (req: Request, res: Response, next: any) => {
    const correlationId = req.headers[header] as string || generateCorrelationId();
    
    // Set correlation ID in request
    (req as any).correlationId = correlationId;
    
    // Set in response header
    res.setHeader(header, correlationId);
    
    // Add to response locals for templates
    res.locals.correlationId = correlationId;
    
    next();
  };
}

// ===============================
// DEFAULT EXPORT
// ===============================

export const logger = createSecurityLogger('main');
export default logger;