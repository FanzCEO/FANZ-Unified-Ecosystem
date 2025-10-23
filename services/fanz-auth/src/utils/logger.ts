import winston from 'winston';
import { config } from '../config/environment';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define level colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Add colors to winston
winston.addColors(colors);

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? '\n' + info.stack : ''}`
  )
);

// Define log transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format,
    level: config.server.environment === 'development' ? 'debug' : 'info',
  }),

  // File transport for errors
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),

  // File transport for all logs
  new winston.transports.File({
    filename: 'logs/combined.log',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
];

// Create logger instance
export const logger = winston.createLogger({
  level: config.server.environment === 'development' ? 'debug' : 'info',
  levels,
  format,
  transports,
  exitOnError: false,
});

// Create stream for HTTP request logging
logger.stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Add request ID to log context
export const addRequestId = (requestId: string) => {
  return logger.child({ requestId });
};

// Export default logger
export default logger;