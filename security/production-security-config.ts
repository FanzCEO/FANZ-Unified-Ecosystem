/**
 * FANZ Production Security Configuration
 * Centralized security settings for all FANZ ecosystem services
 */

export interface SecurityConfig {
  auth: {
    jwt: {
      accessTokenExpiry: string;
      refreshTokenExpiry: string;
      algorithm: string;
      issuer: string;
    };
    session: {
      maxAge: number;
      secure: boolean;
      httpOnly: boolean;
      sameSite: 'strict' | 'lax' | 'none';
    };
    rateLimit: {
      windowMs: number;
      max: number;
      skipSuccessfulRequests: boolean;
    };
  };
  
  encryption: {
    algorithm: string;
    keyLength: number;
    ivLength: number;
  };
  
  headers: {
    hsts: {
      maxAge: number;
      includeSubDomains: boolean;
      preload: boolean;
    };
    contentSecurityPolicy: {
      directives: Record<string, string[]>;
    };
    frameOptions: string;
    noSniff: boolean;
    xssProtection: boolean;
  };
  
  cors: {
    allowedOrigins: string[];
    credentials: boolean;
    maxAge: number;
    allowedMethods: string[];
    allowedHeaders: string[];
  };
  
  validation: {
    maxPayloadSize: string;
    maxFileSize: string;
    allowedFileTypes: string[];
    maxRequestsPerMinute: number;
  };
  
  monitoring: {
    enableRequestLogging: boolean;
    enableErrorTracking: boolean;
    enablePerformanceMonitoring: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
  };
}

// Production Security Configuration
export const PRODUCTION_SECURITY_CONFIG: SecurityConfig = {
  auth: {
    jwt: {
      accessTokenExpiry: '15m',
      refreshTokenExpiry: '7d',
      algorithm: 'HS256',
      issuer: 'fanz.network',
    },
    session: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      secure: true, // HTTPS only
      httpOnly: true, // No JS access
      sameSite: 'strict', // CSRF protection
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // requests per window
      skipSuccessfulRequests: false,
    },
  },
  
  encryption: {
    algorithm: 'aes-256-gcm',
    keyLength: 32, // 256 bits
    ivLength: 12, // 96 bits for GCM
  },
  
  headers: {
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    contentSecurityPolicy: {
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'", 'https://js.stripe.com'],
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        'font-src': ["'self'", 'https://fonts.gstatic.com'],
        'img-src': ["'self'", 'data:', 'https:'],
        'media-src': ["'self'", 'https:'],
        'connect-src': ["'self'", 'https://api.fanz.network', 'https://api.openai.com', 'https://api.anthropic.com'],
        'frame-ancestors': ["'none'"],
        'base-uri': ["'self'"],
        'object-src': ["'none'"],
        'upgrade-insecure-requests': [],
      },
    },
    frameOptions: 'DENY',
    noSniff: true,
    xssProtection: true,
  },
  
  cors: {
    allowedOrigins: [
      'https://boyfanz.com',
      'https://girlfanz.com', 
      'https://pupfanz.com',
      'https://taboofanz.com',
      'https://fanz.network',
      'https://admin.fanz.network',
    ],
    credentials: true,
    maxAge: 86400, // 24 hours
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
  },
  
  validation: {
    maxPayloadSize: '10mb',
    maxFileSize: '100mb', // For video uploads
    allowedFileTypes: [
      'image/jpeg',
      'image/png', 
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
      'audio/mpeg',
      'audio/wav',
      'application/pdf',
    ],
    maxRequestsPerMinute: 60,
  },
  
  monitoring: {
    enableRequestLogging: true,
    enableErrorTracking: true, 
    enablePerformanceMonitoring: true,
    logLevel: 'info',
  },
};

// Development Security Configuration (less restrictive)
export const DEVELOPMENT_SECURITY_CONFIG: SecurityConfig = {
  ...PRODUCTION_SECURITY_CONFIG,
  
  auth: {
    ...PRODUCTION_SECURITY_CONFIG.auth,
    session: {
      ...PRODUCTION_SECURITY_CONFIG.auth.session,
      secure: false, // Allow HTTP in development
    },
  },
  
  headers: {
    ...PRODUCTION_SECURITY_CONFIG.headers,
    contentSecurityPolicy: {
      directives: {
        ...PRODUCTION_SECURITY_CONFIG.headers.contentSecurityPolicy.directives,
        'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Allow eval for hot reload
      },
    },
  },
  
  cors: {
    ...PRODUCTION_SECURITY_CONFIG.cors,
    allowedOrigins: [
      'http://localhost:3000',
      'http://localhost:3001', 
      'http://localhost:3002',
      'http://localhost:5000',
      'http://127.0.0.1:3000',
      ...PRODUCTION_SECURITY_CONFIG.cors.allowedOrigins,
    ],
  },
  
  monitoring: {
    ...PRODUCTION_SECURITY_CONFIG.monitoring,
    logLevel: 'debug',
  },
};

// Security Middleware Factory
export function createSecurityMiddleware(config: SecurityConfig) {
  return {
    // Helmet configuration
    helmet: {
      contentSecurityPolicy: {
        directives: config.headers.contentSecurityPolicy.directives,
      },
      hsts: config.headers.hsts,
      frameguard: { 
        action: config.headers.frameOptions.toLowerCase() as 'deny' | 'sameorigin' 
      },
      noSniff: config.headers.noSniff,
      xssFilter: config.headers.xssProtection,
    },
    
    // CORS configuration
    cors: {
      origin: config.cors.allowedOrigins,
      credentials: config.cors.credentials,
      maxAge: config.cors.maxAge,
      methods: config.cors.allowedMethods,
      allowedHeaders: config.cors.allowedHeaders,
    },
    
    // Rate limiting configuration
    rateLimit: {
      windowMs: config.auth.rateLimit.windowMs,
      max: config.auth.rateLimit.max,
      skip: config.auth.rateLimit.skipSuccessfulRequests 
        ? (req: any, res: any) => res.statusCode < 400
        : undefined,
      handler: (req: any, res: any) => {
        res.status(429).json({
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.round(config.auth.rateLimit.windowMs / 1000),
        });
      },
    },
    
    // Session configuration
    session: {
      cookie: {
        maxAge: config.auth.session.maxAge,
        secure: config.auth.session.secure,
        httpOnly: config.auth.session.httpOnly,
        sameSite: config.auth.session.sameSite,
      },
    },
    
    // Body parser limits
    bodyParser: {
      limit: config.validation.maxPayloadSize,
    },
  };
}

// Export configurations based on environment
export const getSecurityConfig = (): SecurityConfig => {
  return process.env.NODE_ENV === 'production' 
    ? PRODUCTION_SECURITY_CONFIG 
    : DEVELOPMENT_SECURITY_CONFIG;
};

// Security headers validation
export const validateSecurityHeaders = (headers: Record<string, string>): boolean => {
  const requiredHeaders = [
    'x-frame-options',
    'x-content-type-options', 
    'x-xss-protection',
    'strict-transport-security',
    'content-security-policy',
  ];
  
  return requiredHeaders.every(header => 
    headers[header] !== undefined
  );
};

// Input sanitization helpers
export const sanitizeInput = {
  // Remove HTML tags and dangerous characters
  text: (input: string): string => {
    return input
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/[<>'"&]/g, '') // Remove dangerous characters
      .trim();
  },
  
  // Validate email format
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  // Validate URL format
  url: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },
  
  // Validate file type
  fileType: (mimeType: string, allowedTypes: string[]): boolean => {
    return allowedTypes.includes(mimeType);
  },
};

// Security audit logging
export const auditLog = {
  // Log security events
  logSecurityEvent: (event: {
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    userId?: string;
    ip?: string;
    userAgent?: string;
    timestamp?: Date;
  }) => {
    const logEntry = {
      ...event,
      timestamp: event.timestamp || new Date(),
      service: 'fanz-security',
    };
    
    console.log('[SECURITY_AUDIT]', JSON.stringify(logEntry));
  },
  
  // Log authentication attempts
  logAuthAttempt: (success: boolean, userId?: string, ip?: string) => {
    auditLog.logSecurityEvent({
      type: 'authentication',
      severity: success ? 'low' : 'medium',
      message: success ? 'Successful login' : 'Failed login attempt',
      userId,
      ip,
    });
  },
  
  // Log permission violations
  logPermissionViolation: (userId: string, resource: string, action: string, ip?: string) => {
    auditLog.logSecurityEvent({
      type: 'authorization',
      severity: 'high',
      message: `Unauthorized access attempt to ${resource} with action ${action}`,
      userId,
      ip,
    });
  },
};

export default {
  PRODUCTION_SECURITY_CONFIG,
  DEVELOPMENT_SECURITY_CONFIG,
  getSecurityConfig,
  createSecurityMiddleware,
  validateSecurityHeaders,
  sanitizeInput,
  auditLog,
};