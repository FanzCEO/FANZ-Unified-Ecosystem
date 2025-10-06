export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  metadata?: Record<string, any>;
  traceId?: string;
}

export class Logger {
  private serviceName: string;
  private minLevel: LogLevel;
  private isDevelopment: boolean;

  constructor(
    serviceName: string,
    minLevel: LogLevel = LogLevel.INFO,
    isDevelopment: boolean = process.env.NODE_ENV === 'development'
  ) {
    this.serviceName = serviceName;
    this.minLevel = minLevel;
    this.isDevelopment = isDevelopment;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }

  private formatLog(level: LogLevel, message: string, metadata?: Record<string, any>): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      message,
      metadata,
      traceId: this.generateTraceId()
    };
  }

  private generateTraceId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private output(logEntry: LogEntry): void {
    if (this.isDevelopment) {
      // Pretty print for development
      const color = this.getColorForLevel(logEntry.level);
      console.log(
        `\x1b[${color}m[${logEntry.timestamp}] [${logEntry.level.toUpperCase()}] [${logEntry.service}]\x1b[0m ${logEntry.message}`,
        logEntry.metadata ? JSON.stringify(logEntry.metadata, null, 2) : ''
      );
    } else {
      // JSON output for production
      console.log(JSON.stringify(logEntry));
    }
  }

  private getColorForLevel(level: LogLevel): number {
    switch (level) {
      case LogLevel.DEBUG: return 36; // Cyan
      case LogLevel.INFO: return 32;  // Green
      case LogLevel.WARN: return 33;  // Yellow
      case LogLevel.ERROR: return 31; // Red
      default: return 37;            // White
    }
  }

  debug(message: string, metadata?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const logEntry = this.formatLog(LogLevel.DEBUG, message, metadata);
      this.output(logEntry);
    }
  }

  info(message: string, metadata?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.INFO)) {
      const logEntry = this.formatLog(LogLevel.INFO, message, metadata);
      this.output(logEntry);
    }
  }

  warn(message: string, metadata?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.WARN)) {
      const logEntry = this.formatLog(LogLevel.WARN, message, metadata);
      this.output(logEntry);
    }
  }

  error(message: string, metadata?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const logEntry = this.formatLog(LogLevel.ERROR, message, metadata);
      this.output(logEntry);
    }
  }

  // Performance logging
  time(label: string): void {
    console.time(`[${this.serviceName}] ${label}`);
  }

  timeEnd(label: string): void {
    console.timeEnd(`[${this.serviceName}] ${label}`);
  }

  // Structured logging for specific use cases
  logRequest(method: string, path: string, statusCode: number, responseTime: number, metadata?: Record<string, any>): void {
    this.info('HTTP Request', {
      method,
      path,
      statusCode,
      responseTime,
      ...metadata
    });
  }

  logError(error: Error, context?: Record<string, any>): void {
    this.error(error.message, {
      stack: error.stack,
      name: error.name,
      ...context
    });
  }

  logPerformance(operation: string, duration: number, metadata?: Record<string, any>): void {
    this.info('Performance Metric', {
      operation,
      duration,
      ...metadata
    });
  }
}