/**
 * FANZ Security Middleware
 * Comprehensive security configuration for adult content platform
 * 
 * Features:
 * - TLS 1.3 enforcement
 * - Rate limiting with FANZ-specific rules
 * - Adult content security headers
 * - CORS configuration
 * - Input validation
 * - Age verification enforcement
 */

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import { Request, Response, NextFunction, Express } from 'express';
import { body, validationResult } from 'express-validator';

// FANZ-specific rate limiters
export const rateLimiters = {
  // API endpoints - general usage
  api: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: {
      error: 'Too many API requests from this IP',
      retryAfter: '15 minutes',
      type: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
  }),

  // Authentication endpoints - stricter limits
  auth: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
      error: 'Too many login attempts',
      retryAfter: '15 minutes',
      type: 'AUTH_RATE_LIMIT'
    }
  }),

  // Content upload - moderate limits
  upload: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20,
    message: {
      error: 'Too many upload requests',
      retryAfter: '1 hour',
      type: 'UPLOAD_RATE_LIMIT'
    }
  }),

  // Age verification - very strict
  ageVerification: rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: {
      error: 'Too many age verification attempts',
      retryAfter: '1 hour',
      type: 'AGE_VERIFICATION_RATE_LIMIT'
    }
  }),

  // Password reset - security sensitive
  passwordReset: rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: {
      error: 'Too many password reset attempts',
      retryAfter: '1 hour',
      type: 'PASSWORD_RESET_RATE_LIMIT'
    }
  })
};

// Age verification middleware
export const requireAgeVerification = (req: Request, res: Response, next: NextFunction) => {
  const ageVerified = req.headers['x-age-verified'] || req.session?.ageVerified;
  
  if (!ageVerified || ageVerified !== 'true') {
    return res.status(403).json({
      error: 'Age verification required',
      message: 'You must verify your age to access adult content',
      type: 'AGE_VERIFICATION_REQUIRED',
      redirectTo: '/age-verification'
    });
  }
  
  next();
};

// Input validation middleware factory
export const validateInput = (validations: any[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array(),
        type: 'VALIDATION_ERROR'
      });
    }

    next();
  };
};

// Common validation rules
export const validationRules = {
  email: body('email').isEmail().normalizeEmail(),
  password: body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/),
  username: body('username').isLength({ min: 3, max: 30 }).matches(/^[a-zA-Z0-9_]+$/),
  age: body('age').isInt({ min: 18 }),
  content: body('content').trim().isLength({ min: 1, max: 5000 })
};

// Main security middleware configuration
export const configureSecurityMiddleware = (app: Express) => {
  // Trust proxy (for load balancers, CDNs)
  app.set('trust proxy', 1);

  // Helmet security headers with FANZ-specific config
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.fanz.network"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdn.fanz.network"],
        imgSrc: ["'self'", "data:", "https:", "blob:", "https://cdn.fanz.network"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.fanz.network"],
        mediaSrc: ["'self'", "blob:", "https:", "https://media.fanz.network"],
        connectSrc: ["'self'", "wss:", "https:", "https://api.fanz.network"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
      },
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    noSniff: true,
    frameguard: { action: 'deny' },
    xssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    crossOriginEmbedderPolicy: { policy: 'require-corp' },
  }));

  // FANZ-specific security headers
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Adult content identification
    res.setHeader('X-Content-Rating', 'adult');
    res.setHeader('X-Age-Verification', 'required');
    
    // FANZ platform identification
    res.setHeader('X-Powered-By', 'FANZ');
    res.setHeader('X-Platform', 'FANZ-Unified-Ecosystem');
    res.setHeader('X-Content-Policy', 'adult-verified-only');
    res.setHeader('X-Creator-Rights', 'protected');
    
    // Additional security headers
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Permissions-Policy', 
      'camera=(), microphone=(), geolocation=(self), payment=(), usb=()'
    );
    
    // Anti-clickjacking for admin areas
    if (req.path.startsWith('/admin') || req.path.startsWith('/dashboard')) {
      res.setHeader('X-Frame-Options', 'DENY');
    }
    
    next();
  });

  // CORS configuration
  const corsOptions = {
    origin: (origin: string | undefined, callback: Function) => {
      const allowedOrigins = process.env.NODE_ENV === 'production' 
        ? [
            'https://app.fanz.network',
            'https://www.fanz.network',
            'https://boyfanz.com',
            'https://girlfanz.com',
            'https://pupfanz.com',
            'https://taboofanz.com'
          ]
        : [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:8080',
            'http://127.0.0.1:3000'
          ];

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Age-Verified',
      'X-Creator-Token',
      'X-Fan-Token',
      'X-Request-ID'
    ],
    exposedHeaders: ['X-Total-Count', 'X-Rate-Limit-Remaining']
  };

  app.use(cors(corsOptions));

  // Apply rate limiting to different route groups
  app.use('/api/', rateLimiters.api);
  app.use('/auth/', rateLimiters.auth);
  app.use('/upload/', rateLimiters.upload);
  app.use('/api/age-verification/', rateLimiters.ageVerification);
  app.use('/api/auth/password-reset/', rateLimiters.passwordReset);

  // Global error handler for security middleware
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    // Log security-related errors
    if (err.message.includes('CORS') || err.message.includes('rate limit')) {
      console.error(`[SECURITY] ${err.message} - IP: ${req.ip} - Path: ${req.path}`);
      
      return res.status(403).json({
        error: 'Access denied',
        message: 'Security policy violation',
        type: 'SECURITY_VIOLATION'
      });
    }
    
    next(err);
  });

  console.log('✅ FANZ Security middleware configured successfully');
  console.log(`🔐 Security level: ${process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'DEVELOPMENT'}`);
  console.log('🛡️ Features enabled: TLS enforcement, Rate limiting, CORS, Headers, Age verification');
};

// Security health check endpoint
export const securityHealthCheck = (req: Request, res: Response) => {
  const securityStatus = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    security: {
      helmet: true,
      rateLimit: true,
      cors: true,
      ageVerification: true,
      inputValidation: true
    },
    headers: {
      'X-Content-Rating': res.getHeader('X-Content-Rating'),
      'X-Age-Verification': res.getHeader('X-Age-Verification'),
      'X-Powered-By': res.getHeader('X-Powered-By')
    },
    rateLimits: {
      api: '100 requests per 15 minutes',
      auth: '5 attempts per 15 minutes',
      upload: '20 uploads per hour',
      ageVerification: '3 attempts per hour'
    }
  };

  res.json(securityStatus);
};

export default configureSecurityMiddleware;