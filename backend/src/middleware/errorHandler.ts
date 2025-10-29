import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger';
import { config } from '../config';

const logger = new Logger('ErrorHandler');

// Custom error types
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public errorCode?: string;

  constructor(message: string, statusCode: number = 500, errorCode?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errorCode = errorCode;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, _details?: any) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access forbidden') {
    super(message, 403, 'FORBIDDEN_ERROR');
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND_ERROR');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT_ERROR');
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed') {
    super(message, 500, 'DATABASE_ERROR');
    this.name = 'DatabaseError';
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message?: string) {
    super(message || `${service} service is unavailable`, 502, 'EXTERNAL_SERVICE_ERROR');
    this.name = 'ExternalServiceError';
  }
}

// Error response formatter
interface ErrorResponse {
  error: {
    message: string;
    code?: string;
    statusCode: number;
    details?: any;
    requestId?: string;
    timestamp: string;
  };
}

function formatErrorResponse(error: Error, req: Request): ErrorResponse {
  const isAppError = error instanceof AppError;
  const statusCode = isAppError ? error.statusCode : 500;
  const errorCode = isAppError ? error.errorCode : 'INTERNAL_SERVER_ERROR';

  const response: ErrorResponse = {
    error: {
      message: isAppError ? error.message : 'Internal server error',
      code: errorCode,
      statusCode,
      requestId: req.headers['x-request-id'] as string,
      timestamp: new Date().toISOString()
    }
  };

  // Include stack trace in development
  if (config.NODE_ENV === 'development') {
    (response.error as any).stack = error.stack;
  }

  return response;
}

// Main error handler middleware
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error with context
  const errorContext = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id,
    requestId: req.headers['x-request-id'],
    body: req.method !== 'GET' ? req.body : undefined,
    params: req.params,
    query: req.query
  };

  if (error instanceof AppError) {
    // Log operational errors as warnings
    logger.warn('Operational Error', {
      error: error.message,
      statusCode: error.statusCode,
      errorCode: error.errorCode,
      ...errorContext
    });
  } else {
    // Log programming errors as errors
    logger.error('Programming Error', {
      error: error.message,
      stack: error.stack,
      ...errorContext
    });
  }

  // Handle specific error types
  let statusCode = 500;
  let __message = 'Internal server error';
  let __errorCode = 'INTERNAL_SERVER_ERROR';

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    errorCode = error.errorCode || 'APP_ERROR';
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errorCode = 'VALIDATION_ERROR';
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized';
    errorCode = 'UNAUTHORIZED_ERROR';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    errorCode = 'INVALID_TOKEN_ERROR';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    errorCode = 'TOKEN_EXPIRED_ERROR';
  } else if (error.name === 'CastError' || error.name === 'ValidatorError') {
    statusCode = 400;
    message = 'Invalid data format';
    errorCode = 'INVALID_DATA_ERROR';
  } else if (error.name === 'MongoServerError' && (error as any).code === 11000) {
    statusCode = 409;
    message = 'Duplicate entry';
    errorCode = 'DUPLICATE_ENTRY_ERROR';
  }

  // PostgreSQL specific errors
  if ((error as any).code) {
    const pgError = error as any;
    switch (pgError.code) {
      case '23505': // Unique violation
        statusCode = 409;
        message = 'Duplicate entry';
        errorCode = 'DUPLICATE_ENTRY_ERROR';
        break;
      case '23503': // Foreign key violation
        statusCode = 400;
        message = 'Invalid reference';
        errorCode = 'INVALID_REFERENCE_ERROR';
        break;
      case '23502': // Not null violation
        statusCode = 400;
        message = 'Required field missing';
        errorCode = 'REQUIRED_FIELD_ERROR';
        break;
      case '23514': // Check violation
        statusCode = 400;
        message = 'Invalid data value';
        errorCode = 'INVALID_VALUE_ERROR';
        break;
    }
  }

  // Send error response
  const errorResponse = formatErrorResponse(error, req);
  res.status(statusCode).json(errorResponse);
};

// Async error handler wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new NotFoundError(`Route ${req.originalUrl}`);
  next(error);
};

// Graceful shutdown error handler
export const shutdownHandler = (error: Error) => {
  logger.error('Unhandled error during shutdown', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
};

// Global error handlers
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception - Shutting down...', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Promise Rejection', {
    reason: reason?.message || reason,
    stack: reason?.stack
  });
  // Let the application handle it gracefully instead of crashing immediately
});

export default errorHandler;