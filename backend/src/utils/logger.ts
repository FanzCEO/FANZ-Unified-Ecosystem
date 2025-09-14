import winston from 'winston';
import { config } from '../config';

// Define log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Define colors for each log level
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue'
};

winston.addColors(logColors);

// Custom format for development logs
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
    const metaString = Object.keys(meta).length > 0 
      ? `\n${JSON.stringify(meta, null, 2)}` 
      : '';
    
    return `${timestamp} [${service || 'FANZ'}] ${level}: ${message}${metaString}`;
  })
);

// Custom format for production logs (JSON)
const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf((info) => {
    return JSON.stringify({
      timestamp: info.timestamp,
      level: info.level,
      service: info.service || 'fanz-api',
      message: info.message,
      ...info,
      // Remove duplicated fields
      timestamp: undefined,
      level: undefined,
      service: undefined,
      message: undefined
    });
  })
);

// Create winston logger instance
const winstonLogger = winston.createLogger({
  levels: logLevels,
  level: config.LOG_LEVEL,
  format: config.NODE_ENV === 'production' 
    ? productionFormat 
    : developmentFormat,
  defaultMeta: {
    service: 'fanz-api',
    environment: config.NODE_ENV,
    version: process.env.APP_VERSION || '1.0.0'
  },
  transports: [
    // Console transport
    new winston.transports.Console({
      handleExceptions: true,
      handleRejections: true
    }),

    // File transports for production
    ...(config.NODE_ENV === 'production' ? [
      // Error logs
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        maxsize: 50 * 1024 * 1024, // 50MB
        maxFiles: 5,
        tailable: true
      }),

      // Combined logs
      new winston.transports.File({
        filename: 'logs/combined.log',
        maxsize: 100 * 1024 * 1024, // 100MB
        maxFiles: 10,
        tailable: true
      })
    ] : [])
  ],
  exitOnError: false
});

// Create stream for Morgan HTTP logging
export const logStream = {
  write: (message: string) => {
    winstonLogger.http(message.trim());
  }
};

// Logger class for structured logging
export class Logger {
  private service: string;
  private context: Record<string, any>;

  constructor(service: string = 'FANZ', context: Record<string, any> = {}) {
    this.service = service;
    this.context = context;
  }

  // Add persistent context to logger
  addContext(context: Record<string, any>): Logger {
    return new Logger(this.service, { ...this.context, ...context });
  }

  // Error logging
  error(message: string, meta: Record<string, any> = {}) {
    winstonLogger.error(message, {
      service: this.service,
      ...this.context,
      ...meta
    });
  }

  // Warning logging
  warn(message: string, meta: Record<string, any> = {}) {
    winstonLogger.warn(message, {
      service: this.service,
      ...this.context,
      ...meta
    });
  }

  // Info logging
  info(message: string, meta: Record<string, any> = {}) {
    winstonLogger.info(message, {
      service: this.service,
      ...this.context,
      ...meta
    });
  }

  // HTTP logging
  http(message: string, meta: Record<string, any> = {}) {
    winstonLogger.http(message, {
      service: this.service,
      ...this.context,
      ...meta
    });
  }

  // Debug logging
  debug(message: string, meta: Record<string, any> = {}) {
    winstonLogger.debug(message, {
      service: this.service,
      ...this.context,
      ...meta
    });
  }

  // Structured logging methods for common scenarios
  
  // API request logging
  apiRequest(req: any, meta: Record<string, any> = {}) {
    this.info('API Request', {
      method: req.method,
      url: req.originalUrl || req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      ...meta
    });
  }

  // API response logging
  apiResponse(req: any, res: any, responseTime: number, meta: Record<string, any> = {}) {
    const level = res.statusCode >= 400 ? 'error' : 'info';
    
    this[level]('API Response', {
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      responseTime,
      ip: req.ip,
      userId: req.user?.id,
      ...meta
    });
  }

  // Database query logging
  dbQuery(query: string, duration: number, rowCount?: number, meta: Record<string, any> = {}) {
    this.debug('Database Query', {
      query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
      duration,
      rowCount,
      ...meta
    });
  }

  // Cache operation logging
  cacheOperation(operation: string, key: string, hit?: boolean, meta: Record<string, any> = {}) {
    this.debug('Cache Operation', {
      operation,
      key,
      hit,
      ...meta
    });
  }

  // External API call logging
  externalApiCall(service: string, endpoint: string, method: string, statusCode?: number, duration?: number, meta: Record<string, any> = {}) {
    const level = statusCode && statusCode >= 400 ? 'error' : 'info';
    
    this[level]('External API Call', {
      service,
      endpoint,
      method,
      statusCode,
      duration,
      ...meta
    });
  }

  // Authentication logging
  auth(event: string, userId?: string, success?: boolean, meta: Record<string, any> = {}) {
    const level = success === false ? 'warn' : 'info';
    
    this[level]('Authentication Event', {
      event,
      userId,
      success,
      ...meta
    });
  }

  // Security event logging
  security(event: string, severity: 'low' | 'medium' | 'high' | 'critical', meta: Record<string, any> = {}) {
    const level = ['high', 'critical'].includes(severity) ? 'error' : 'warn';
    
    this[level]('Security Event', {
      event,
      severity,
      ...meta
    });
  }

  // Business logic logging
  business(event: string, meta: Record<string, any> = {}) {
    this.info('Business Event', {
      event,
      ...meta
    });
  }

  // Performance monitoring
  performance(operation: string, duration: number, meta: Record<string, any> = {}) {
    const level = duration > 5000 ? 'warn' : duration > 1000 ? 'info' : 'debug';
    
    this[level]('Performance Metric', {
      operation,
      duration,
      ...meta
    });
  }
}

// Middleware for automatic request/response logging
export class LoggerMiddleware {
  private logger: Logger;

  constructor(service: string = 'API') {
    this.logger = new Logger(service);
  }

  // Express middleware for logging requests and responses
  middleware() {
    return (req: any, res: any, next: any) => {
      const startTime = Date.now();

      // Log incoming request
      this.logger.apiRequest(req);

      // Override res.json to capture response data
      const originalJson = res.json;
      res.json = function(data: any) {
        const responseTime = Date.now() - startTime;
        
        // Log outgoing response
        new Logger('API').apiResponse(req, res, responseTime, {
          responseSize: JSON.stringify(data).length
        });

        return originalJson.call(this, data);
      };

      // Handle response finish event
      res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        
        if (!res.headersSent) {
          this.logger.apiResponse(req, res, responseTime);
        }
      });

      next();
    };
  }
}

// Singleton logger instance
export const logger = new Logger('FANZ');

// Create directory for logs if in production
if (config.NODE_ENV === 'production') {
  const fs = require('fs');
  const path = require('path');
  
  const logsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
}

export default Logger;