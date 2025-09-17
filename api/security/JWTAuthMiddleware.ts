// 🔐 FANZ JWT Authentication Middleware
// Adult content platform JWT validation with enhanced security

import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    ageVerified: boolean;
    paymentVerified: boolean;
    platforms: string[];
    permissions: string[];
  };
  rateLimit?: {
    remaining: number;
    reset: Date;
  };
}

interface JWTPayload {
  userId: string;
  email: string;
  role: 'creator' | 'fan' | 'admin' | 'moderator';
  ageVerified: boolean;
  paymentVerified: boolean;
  platforms: string[];
  permissions: string[];
  iat: number;
  exp: number;
  aud: string;
  iss: string;
}

class FanzJWTAuthMiddleware {
  private readonly JWT_SECRET: string;
  private readonly JWT_ISSUER = 'fanz.com';
  private readonly JWT_AUDIENCE = 'fanz-api';
  private readonly ADULT_PLATFORMS = [
    'boyfanz', 'girlfanz', 'daddyfanz', 'pupfanz', 
    'taboofanz', 'transfanz', 'cougarfanz', 'fanzcock'
  ];

  // Rate limiting configurations
  private readonly rateLimiters = {
    // Standard API rate limit
    standard: rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // 1000 requests per 15 minutes
      message: {
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: '15 minutes'
      },
      standardHeaders: true,
      legacyHeaders: false,
    }),

    // Strict rate limit for adult content APIs
    adultContent: rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 500, // Stricter limit for adult content
      message: {
        error: 'Adult content rate limit exceeded',
        message: 'Too many adult content requests. Enhanced security limits applied.',
        retryAfter: '15 minutes'
      }
    }),

    // Authentication endpoints
    auth: rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 10, // Very strict for auth endpoints
      message: {
        error: 'Authentication rate limit exceeded',
        message: 'Too many authentication attempts. Please wait before trying again.',
        retryAfter: '15 minutes'
      }
    }),

    // Payment processing endpoints
    payment: rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour window
      max: 50, // Very conservative for payments
      message: {
        error: 'Payment processing rate limit exceeded',
        message: 'Too many payment requests. Contact support if needed.',
        retryAfter: '1 hour'
      }
    })
  };

  constructor() {
    this.JWT_SECRET = process.env.JWT_SECRET || 'fanz-super-secure-secret-key';
    
    if (this.JWT_SECRET === 'fanz-super-secure-secret-key') {
      console.warn('⚠️ WARNING: Using default JWT secret in production is insecure!');
    }
  }

  // Helmet security headers configuration
  public readonly securityHeaders = helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false, // Needed for adult content embeds
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  });

  // CORS configuration for adult platforms
  public readonly corsOptions = {
    origin: (origin: string | undefined, callback: Function) => {
      // Allow requests from FANZ domains
      const allowedOrigins = [
        'https://fanz.com',
        'https://www.fanz.com',
        'https://boyfanz.com',
        'https://girlfanz.com',
        'https://daddyfanz.com',
        'https://pupfanz.com',
        'https://taboofanz.com',
        'https://transfanz.com',
        'https://cougarfanz.com',
        'https://fanzcock.com',
        'https://dashboard.fanz.com',
        // Development origins
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:8080'
      ];

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS policy'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-API-Key',
      'X-Platform',
      'X-Age-Verified',
      'X-Request-ID'
    ],
    exposedHeaders: [
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset'
    ]
  };

  // Rate limiter selector based on endpoint
  public selectRateLimit = (req: Request): any => {
    const path = req.path.toLowerCase();
    
    if (path.includes('/auth/') || path.includes('/login') || path.includes('/register')) {
      return this.rateLimiters.auth;
    }
    
    if (path.includes('/payment/') || path.includes('/billing/') || path.includes('/subscribe/')) {
      return this.rateLimiters.payment;
    }
    
    // Check if requesting adult content
    const platform = req.headers['x-platform'] as string;
    if (platform && this.ADULT_PLATFORMS.includes(platform.toLowerCase())) {
      return this.rateLimiters.adultContent;
    }
    
    return this.rateLimiters.standard;
  };

  // JWT validation middleware
  public authenticateToken = async (
    req: AuthenticatedRequest, 
    res: Response, 
    next: NextFunction
  ): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      const apiKey = req.headers['x-api-key'] as string;
      
      // Check for Bearer token
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Missing or invalid authorization header',
          code: 'INVALID_AUTH_HEADER'
        });
        return;
      }

      const token = authHeader.substring(7);

      // Verify JWT token
      const payload = jwt.verify(token, this.JWT_SECRET, {
        issuer: this.JWT_ISSUER,
        audience: this.JWT_AUDIENCE
      }) as JWTPayload;

      // Enhanced validation for adult platforms
      const platform = req.headers['x-platform'] as string;
      if (platform && this.ADULT_PLATFORMS.includes(platform.toLowerCase())) {
        
        // Age verification required for adult platforms
        if (!payload.ageVerified) {
          res.status(403).json({
            error: 'Age Verification Required',
            message: 'Age verification is required to access adult content platforms',
            code: 'AGE_VERIFICATION_REQUIRED',
            redirectUrl: '/age-verification'
          });
          return;
        }

        // Check platform permissions
        if (!payload.platforms.includes(platform.toLowerCase())) {
          res.status(403).json({
            error: 'Platform Access Denied',
            message: `Access to ${platform} platform not authorized`,
            code: 'PLATFORM_ACCESS_DENIED'
          });
          return;
        }
      }

      // Payment verification for premium features
      const isPremiumEndpoint = req.path.includes('/premium/') || 
                               req.path.includes('/subscription/') ||
                               req.path.includes('/exclusive/');
                               
      if (isPremiumEndpoint && !payload.paymentVerified) {
        res.status(402).json({
          error: 'Payment Required',
          message: 'Valid payment method required for premium features',
          code: 'PAYMENT_VERIFICATION_REQUIRED',
          redirectUrl: '/billing/setup'
        });
        return;
      }

      // Attach user info to request
      req.user = {
        id: payload.userId,
        email: payload.email,
        role: payload.role,
        ageVerified: payload.ageVerified,
        paymentVerified: payload.paymentVerified,
        platforms: payload.platforms,
        permissions: payload.permissions
      };

      next();
      
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({
          error: 'Token Expired',
          message: 'Your session has expired. Please log in again.',
          code: 'TOKEN_EXPIRED'
        });
        return;
      }

      if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({
          error: 'Invalid Token',
          message: 'Invalid authentication token',
          code: 'INVALID_TOKEN'
        });
        return;
      }

      console.error('JWT Authentication Error:', error);
      res.status(500).json({
        error: 'Authentication Error',
        message: 'An error occurred during authentication',
        code: 'AUTH_ERROR'
      });
    }
  };

  // Role-based authorization middleware
  public requireRole = (allowedRoles: string[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
        return;
      }

      if (!allowedRoles.includes(req.user.role)) {
        res.status(403).json({
          error: 'Insufficient Permissions',
          message: `Role '${req.user.role}' is not authorized for this action`,
          code: 'INSUFFICIENT_PERMISSIONS',
          requiredRoles: allowedRoles
        });
        return;
      }

      next();
    };
  };

  // Permission-based authorization middleware
  public requirePermission = (requiredPermission: string) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
        return;
      }

      if (!req.user.permissions.includes(requiredPermission)) {
        res.status(403).json({
          error: 'Insufficient Permissions',
          message: `Permission '${requiredPermission}' required`,
          code: 'PERMISSION_DENIED',
          requiredPermission
        });
        return;
      }

      next();
    };
  };

  // Adult content access validation
  public requireAdultAccess = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required for adult content',
        code: 'AUTH_REQUIRED'
      });
      return;
    }

    if (!req.user.ageVerified) {
      res.status(403).json({
        error: 'Age Verification Required',
        message: 'Age verification is required to access adult content',
        code: 'AGE_VERIFICATION_REQUIRED',
        redirectUrl: '/age-verification'
      });
      return;
    }

    // Additional adult content logging for compliance
    console.log(`Adult content access: User ${req.user.id}, Platform: ${req.headers['x-platform']}, Endpoint: ${req.path}`);
    
    next();
  };

  // API key validation for server-to-server communication
  public validateAPIKey = (req: Request, res: Response, next: NextFunction): void => {
    const apiKey = req.headers['x-api-key'] as string;
    const validAPIKeys = process.env.FANZ_API_KEYS?.split(',') || [];

    if (!apiKey) {
      res.status(401).json({
        error: 'API Key Required',
        message: 'X-API-Key header is required for this endpoint',
        code: 'API_KEY_REQUIRED'
      });
      return;
    }

    if (!validAPIKeys.includes(apiKey)) {
      res.status(401).json({
        error: 'Invalid API Key',
        message: 'The provided API key is not valid',
        code: 'INVALID_API_KEY'
      });
      return;
    }

    next();
  };
}

export { FanzJWTAuthMiddleware, AuthenticatedRequest };
export default new FanzJWTAuthMiddleware();
