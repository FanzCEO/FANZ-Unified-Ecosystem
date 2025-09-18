/**
 * @fanz/secure - Security Logger
 * Structured logging with PII redaction and correlation IDs
 */

import pino from 'pino';
import pinoHttp from 'pino-http';
import { Request, Response } from 'express';
import { config } from '../config.js';
import { SecurityEvent } from '../types.js';

// ===============================
// REDACTION CONFIGURATION
// ===============================

const DEFAULT_REDACTED_PATHS = [
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
  'phone',
  'req.headers.authorization',
  'req.headers.cookie',
  'req.body.password',
  'req.body.token',
  'req.body.secret',
  'res.headers.authorization',
  'res.headers.cookie'
];

const SECURITY_REDACTED_PATHS = [
  ...DEFAULT_REDACTED_PATHS,
  'JWT_SECRET',
  'CSRF_SECRET',
  'ENCRYPTION_KEY',
  'REDIS_PASSWORD',
  'CCBILL_SALT',
  'PAXUM_API_SECRET',
  'FANZDASH_SECRET_TOKEN',
  'apiKey',
  'apiSecret',
  'privateKey',
  'accessToken',
  'refreshToken'
];

// ===============================
// LOGGER CONFIGURATION
// ===============================

const createBaseLogger = (name: string) => {
  return pino({
    name: `fanz-secure:${name}`,
    level: config.security.logging.level,
    
    // Redact sensitive fields
    redact: {
      paths: config.security.logging.redactedFields.length > 0 
        ? config.security.logging.redactedFields 
        : SECURITY_REDACTED_PATHS,
      censor: '[REDACTED]'
    },
    
    // Structured logging format
    formatters: {
      level: (label) => ({ level: label }),
      log: (object) => {
        // Add timestamp and environment info
        return {
          ...object,
          environment: config.nodeEnv,
          service: 'fanz-secure',
          version: '1.0.0'
        };
      }
    },
    
    // Development pretty printing
    transport: config.isDevelopment ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'hostname,pid'
      }
    } : undefined,
    
    // Production JSON logging
    timestamp: pino.stdTimeFunctions.isoTime,
    
    // Base context
    base: {
      pid: process.pid,
      hostname: require('os').hostname()
    }
  });
};\n\n// ===============================\n// SECURITY EVENT LOGGER\n// ===============================\n\nclass SecurityLogger {\n  private logger: pino.Logger;\n  private component: string;\n\n  constructor(component: string) {\n    this.component = component;\n    this.logger = createBaseLogger(component);\n  }\n\n  // Standard logging methods\n  trace(message: string, context?: Record<string, any>) {\n    this.logger.trace({ component: this.component, ...context }, message);\n  }\n\n  debug(message: string, context?: Record<string, any>) {\n    this.logger.debug({ component: this.component, ...context }, message);\n  }\n\n  info(message: string, context?: Record<string, any>) {\n    this.logger.info({ component: this.component, ...context }, message);\n  }\n\n  warn(message: string, context?: Record<string, any>) {\n    this.logger.warn({ component: this.component, ...context }, message);\n  }\n\n  error(message: string, context?: Record<string, any>) {\n    this.logger.error({ component: this.component, ...context }, message);\n  }\n\n  fatal(message: string, context?: Record<string, any>) {\n    this.logger.fatal({ component: this.component, ...context }, message);\n  }\n\n  // Security-specific logging methods\n  security(event: SecurityEvent) {\n    this.logger.warn(\n      {\n        component: this.component,\n        securityEvent: true,\n        eventType: event.type,\n        severity: event.severity,\n        context: event.context,\n        details: event.details\n      },\n      `Security Event: ${event.type}`\n    );\n  }\n\n  audit(action: string, context: Record<string, any>) {\n    if (!config.security.logging.auditLog) {\n      return;\n    }\n\n    this.logger.info(\n      {\n        component: this.component,\n        auditLog: true,\n        action,\n        ...context\n      },\n      `Audit: ${action}`\n    );\n  }\n\n  performance(operation: string, duration: number, context?: Record<string, any>) {\n    this.logger.info(\n      {\n        component: this.component,\n        performanceLog: true,\n        operation,\n        duration,\n        ...context\n      },\n      `Performance: ${operation} took ${duration}ms`\n    );\n  }\n\n  // Create child logger with additional context\n  child(context: Record<string, any>): SecurityLogger {\n    const childLogger = new SecurityLogger(this.component);\n    childLogger.logger = this.logger.child(context);\n    return childLogger;\n  }\n}\n\n// ===============================\n// HTTP MIDDLEWARE LOGGER\n// ===============================\n\nexport const createHttpLogger = () => {\n  return pinoHttp({\n    logger: createBaseLogger('http'),\n    \n    // Generate or extract correlation ID\n    genReqId: (req: Request) => {\n      const correlationHeader = config.security.logging.correlationIdHeader;\n      return req.headers[correlationHeader] as string || \n             req.headers['x-request-id'] as string ||\n             generateCorrelationId();\n    },\n    \n    // Redact sensitive request data\n    redact: {\n      paths: [\n        'req.headers.authorization',\n        'req.headers.cookie',\n        'req.body.password',\n        'req.body.token',\n        'req.body.secret',\n        'res.headers.authorization',\n        'res.headers.cookie'\n      ],\n      censor: '[REDACTED]'\n    },\n    \n    // Custom request/response serializers\n    serializers: {\n      req: (req: Request) => ({\n        id: req.id,\n        method: req.method,\n        url: req.url,\n        path: req.path,\n        query: req.query,\n        params: req.params,\n        headers: {\n          ...req.headers,\n          authorization: req.headers.authorization ? '[REDACTED]' : undefined,\n          cookie: req.headers.cookie ? '[REDACTED]' : undefined\n        },\n        remoteAddress: req.ip,\n        userAgent: req.headers['user-agent']\n      }),\n      \n      res: (res: Response) => ({\n        statusCode: res.statusCode,\n        headers: {\n          ...res.getHeaders(),\n          authorization: res.getHeader('authorization') ? '[REDACTED]' : undefined,\n          cookie: res.getHeader('cookie') ? '[REDACTED]' : undefined\n        }\n      })\n    },\n    \n    // Custom log level based on status code\n    customLogLevel: (req: Request, res: Response, err: Error | undefined) => {\n      if (res.statusCode >= 400 && res.statusCode < 500) {\n        return 'warn';\n      } else if (res.statusCode >= 500 || err) {\n        return 'error';\n      }\n      return 'info';\n    },\n    \n    // Custom success message\n    customSuccessMessage: (req: Request, res: Response) => {\n      return `${req.method} ${req.url} ${res.statusCode}`;\n    },\n    \n    // Custom error message\n    customErrorMessage: (req: Request, res: Response, err: Error) => {\n      return `${req.method} ${req.url} ${res.statusCode} - ${err.message}`;\n    }\n  });\n};\n\n// ===============================\n// UTILITY FUNCTIONS\n// ===============================\n\nfunction generateCorrelationId(): string {\n  return `fanz-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;\n}\n\n/**\n * Sanitize object for logging (remove/redact sensitive fields)\n */\nexport function sanitizeForLogging(obj: any): any {\n  if (!obj || typeof obj !== 'object') {\n    return obj;\n  }\n\n  const sanitized = Array.isArray(obj) ? [] : {};\n  \n  for (const [key, value] of Object.entries(obj)) {\n    const lowerKey = key.toLowerCase();\n    \n    // Check if key contains sensitive information\n    const isSensitive = SECURITY_REDACTED_PATHS.some(path => \n      lowerKey.includes(path.toLowerCase())\n    );\n    \n    if (isSensitive) {\n      sanitized[key] = '[REDACTED]';\n    } else if (typeof value === 'object' && value !== null) {\n      sanitized[key] = sanitizeForLogging(value);\n    } else {\n      sanitized[key] = value;\n    }\n  }\n  \n  return sanitized;\n}\n\n/**\n * Create performance timing wrapper\n */\nexport function createPerformanceTimer(logger: SecurityLogger, operation: string) {\n  const start = Date.now();\n  \n  return {\n    end: (context?: Record<string, any>) => {\n      const duration = Date.now() - start;\n      logger.performance(operation, duration, context);\n      return duration;\n    }\n  };\n}\n\n/**\n * Log security event with correlation\n */\nexport function logSecurityEvent(\n  logger: SecurityLogger,\n  event: SecurityEvent,\n  correlationId?: string\n) {\n  const contextWithCorrelation = {\n    ...event.context,\n    correlationId: correlationId || generateCorrelationId()\n  };\n  \n  logger.security({\n    ...event,\n    context: contextWithCorrelation\n  });\n}\n\n// ===============================\n// FACTORY FUNCTIONS\n// ===============================\n\n/**\n * Create security logger for a specific component\n */\nexport function createSecurityLogger(component: string): SecurityLogger {\n  return new SecurityLogger(component);\n}\n\n/**\n * Create audit logger (alias for security logger with audit focus)\n */\nexport function createAuditLogger(component: string): SecurityLogger {\n  const logger = new SecurityLogger(`audit:${component}`);\n  return logger;\n}\n\n/**\n * Create correlation ID middleware\n */\nexport function correlationIdMiddleware() {\n  const header = config.security.logging.correlationIdHeader;\n  \n  return (req: Request, res: Response, next: any) => {\n    const correlationId = req.headers[header] as string || generateCorrelationId();\n    \n    // Set correlation ID in request\n    (req as any).correlationId = correlationId;\n    \n    // Set in response header\n    res.setHeader(header, correlationId);\n    \n    // Add to response locals for templates\n    res.locals.correlationId = correlationId;\n    \n    next();\n  };\n}\n\n// ===============================\n// DEFAULT EXPORT\n// ===============================\n\nexport const logger = createSecurityLogger('main');\nexport default logger;