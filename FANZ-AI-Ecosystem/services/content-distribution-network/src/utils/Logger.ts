/**
 * FANZ Advanced Logger Utility
 * 
 * Professional logging system with:
 * - Structured JSON logging
 * - Multiple log levels
 * - Performance tracking
 * - Error tracking and alerting
 * - Development and production modes
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4
}

interface LogEntry {
  timestamp: string;
  level: string;
  service: string;
  message: string;
  data?: any;
  duration?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  requestId?: string;
  userId?: string;
}

export class Logger {
  private service: string;
  private logLevel: LogLevel;
  private isDevelopment: boolean;

  constructor(service: string, logLevel: LogLevel = LogLevel.INFO) {
    this.service = service;
    this.logLevel = logLevel;
    this.isDevelopment = process.env.NODE_ENV !== 'production';
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | any, data?: any): void {
    if (this.logLevel >= LogLevel.ERROR) {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        service: this.service,
        message,
        data
      };

      if (error) {
        if (error instanceof Error) {
          entry.error = {
            name: error.name,
            message: error.message,
            stack: error.stack
          };
        } else {
          entry.error = { name: 'Unknown', message: String(error) };
        }
      }

      this.output(entry);
    }
  }

  /**
   * Log warning message
   */
  warn(message: string, data?: any): void {
    if (this.logLevel >= LogLevel.WARN) {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: 'WARN',
        service: this.service,
        message,
        data
      };
      this.output(entry);
    }
  }

  /**
   * Log info message
   */
  info(message: string, data?: any): void {
    if (this.logLevel >= LogLevel.INFO) {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: 'INFO',
        service: this.service,
        message,
        data
      };
      this.output(entry);
    }
  }

  /**
   * Log debug message
   */
  debug(message: string, data?: any): void {
    if (this.logLevel >= LogLevel.DEBUG) {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: 'DEBUG',
        service: this.service,
        message,
        data
      };
      this.output(entry);
    }
  }

  /**
   * Log trace message
   */
  trace(message: string, data?: any): void {
    if (this.logLevel >= LogLevel.TRACE) {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: 'TRACE',
        service: this.service,
        message,
        data
      };
      this.output(entry);
    }
  }

  /**
   * Time a function execution
   */
  time<T>(label: string, fn: () => T | Promise<T>): T | Promise<T> {
    const start = Date.now();
    
    const logResult = (duration: number) => {
      this.info(`${label} completed`, { duration: `${duration}ms` });
    };

    try {
      const result = fn();
      
      if (result instanceof Promise) {
        return result.then((value) => {
          logResult(Date.now() - start);
          return value;
        }).catch((error) => {
          const duration = Date.now() - start;
          this.error(`${label} failed after ${duration}ms`, error);
          throw error;
        });
      } else {
        logResult(Date.now() - start);
        return result;
      }
    } catch (error) {
      const duration = Date.now() - start;
      this.error(`${label} failed after ${duration}ms`, error);
      throw error;
    }
  }

  /**
   * Create child logger with context
   */
  child(context: { requestId?: string; userId?: string; [key: string]: any }): Logger {
    const childLogger = new Logger(this.service, this.logLevel);
    
    // Override output to include context
    const originalOutput = childLogger.output.bind(childLogger);
    childLogger.output = (entry: LogEntry) => {
      originalOutput({ ...entry, ...context });
    };
    
    return childLogger;
  }

  /**
   * Set log level dynamically
   */
  setLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * Output log entry
   */
  private output(entry: LogEntry): void {
    if (this.isDevelopment) {
      // Pretty print for development
      const color = this.getColorForLevel(entry.level);
      const timestamp = new Date(entry.timestamp).toLocaleTimeString();
      
      console.log(
        `${color}[${timestamp}] ${entry.level.padEnd(5)} ${this.service}: ${entry.message}\x1b[0m`
      );
      
      if (entry.data) {
        console.log('  Data:', JSON.stringify(entry.data, null, 2));
      }
      
      if (entry.error) {
        console.log('  Error:', entry.error);
        if (entry.error.stack) {
          console.log('  Stack:', entry.error.stack);
        }
      }
    } else {
      // JSON output for production
      console.log(JSON.stringify(entry));
    }
  }

  /**
   * Get ANSI color code for log level
   */
  private getColorForLevel(level: string): string {
    const colors: { [key: string]: string } = {
      'ERROR': '\x1b[31m', // Red
      'WARN': '\x1b[33m',  // Yellow
      'INFO': '\x1b[36m',  // Cyan
      'DEBUG': '\x1b[35m', // Magenta
      'TRACE': '\x1b[37m'  // White
    };
    return colors[level] || '\x1b[0m';
  }
}