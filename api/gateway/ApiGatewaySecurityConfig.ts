// 🛡️ FANZ API Gateway Security Configuration
// Centralized security policy enforcement for adult content platforms
// Provides request validation, response filtering, and compliance checks

import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import Joi from 'joi';
import validator from 'validator';
import DOMPurify from 'isomorphic-dompurify';

interface SecurityConfig {
  contentSecurityPolicy: {
    enabled: boolean;
    directives: Record<string, string[]>;
    reportOnly: boolean;
  };
  adultContentFiltering: {
    enabled: boolean;
    ageGateRequired: boolean;
    contentClassification: boolean;
    complianceLogging: boolean;
  };
  requestValidation: {
    maxPayloadSize: string;
    allowedMethods: string[];
    requiredHeaders: string[];
    blockedUserAgents: RegExp[];
  };
  responseFiltering: {
    removeHeaders: string[];
    addSecurityHeaders: boolean;
    contentSanitization: boolean;
    dataLeakPrevention: boolean;
  };
}

interface ProxyTarget {
  id: string;
  name: string;
  target: string;
  pathRewrite?: Record<string, string>;
  changeOrigin: boolean;
  secure: boolean;
  platform: string;
  adultContent: boolean;
  requiresAuth: boolean;
  rateLimit?: {
    windowMs: number;
    max: number;
  };
}

interface RequestValidationRule {
  path: string;
  method: string;
  schema: Joi.ObjectSchema;
  adultContentCheck: boolean;
  ageVerificationRequired: boolean;
}

interface ResponseFilter {
  platform: string;
  contentType: string[];
  transformations: {
    removeFields?: string[];
    sanitizeHtml?: boolean;
    encryptPii?: boolean;
    addWatermark?: boolean;
  };
}

class FanzApiGatewaySecurityConfig {
  private readonly ADULT_PLATFORMS = [
    'boyfanz', 'girlfanz', 'daddyfanz', 'pupfanz',
    'taboofanz', 'transfanz', 'cougarfanz', 'fanzcock'
  ];

  // Security configuration for adult content platforms
  private readonly securityConfig: SecurityConfig = {
    contentSecurityPolicy: {
      enabled: true,
      reportOnly: false,
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'", 'https://www.google.com', 'https://www.gstatic.com'],
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        'font-src': ["'self'", 'https://fonts.gstatic.com'],
        'img-src': ["'self'", 'data:', 'https:', 'blob:'],
        'media-src': ["'self'", 'https:', 'blob:'],
        'object-src': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'frame-ancestors': ["'none'"],
        'upgrade-insecure-requests': []
      }
    },
    adultContentFiltering: {
      enabled: true,
      ageGateRequired: true,
      contentClassification: true,
      complianceLogging: true
    },
    requestValidation: {
      maxPayloadSize: '50mb',
      allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      requiredHeaders: ['User-Agent', 'Accept'],
      blockedUserAgents: [
        /bot/i,
        /crawler/i,
        /scraper/i,
        /spider/i
      ]
    },
    responseFiltering: {
      removeHeaders: [
        'X-Powered-By',
        'Server',
        'X-AspNet-Version',
        'X-AspNetMvc-Version'
      ],
      addSecurityHeaders: true,
      contentSanitization: true,
      dataLeakPrevention: true
    }
  };

  // Proxy targets for different FANZ services
  private readonly proxyTargets: ProxyTarget[] = [
    {
      id: 'fanz-main',
      name: 'FANZ Main Platform',
      target: 'http://localhost:3001',
      pathRewrite: { '^/api/main': '' },
      changeOrigin: true,
      secure: true,
      platform: 'fanz',
      adultContent: false,
      requiresAuth: true
    },
    {
      id: 'boyfanz',
      name: 'BoyFanz Adult Platform',
      target: 'http://localhost:3002',
      pathRewrite: { '^/api/boyfanz': '' },
      changeOrigin: true,
      secure: true,
      platform: 'boyfanz',
      adultContent: true,
      requiresAuth: true,
      rateLimit: {
        windowMs: 15 * 60 * 1000,
        max: 500
      }
    },
    {
      id: 'girlfanz',
      name: 'GirlFanz Adult Platform',
      target: 'http://localhost:3003',
      pathRewrite: { '^/api/girlfanz': '' },
      changeOrigin: true,
      secure: true,
      platform: 'girlfanz',
      adultContent: true,
      requiresAuth: true,
      rateLimit: {
        windowMs: 15 * 60 * 1000,
        max: 500
      }
    },
    {
      id: 'payment-service',
      name: 'Payment Processing Service',
      target: 'http://localhost:3004',
      pathRewrite: { '^/api/payments': '' },
      changeOrigin: true,
      secure: true,
      platform: 'payment',
      adultContent: false,
      requiresAuth: true,
      rateLimit: {
        windowMs: 60 * 60 * 1000,
        max: 50
      }
    },
    {
      id: 'media-service',
      name: 'Media Processing Service',
      target: 'http://localhost:3005',
      pathRewrite: { '^/api/media': '' },
      changeOrigin: true,
      secure: true,
      platform: 'media',
      adultContent: true,
      requiresAuth: true
    }
  ];

  // Request validation schemas
  private readonly validationRules: RequestValidationRule[] = [
    {
      path: '/api/*/auth/login',
      method: 'POST',
      schema: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(8).required(),
        platform: Joi.string().valid(...this.ADULT_PLATFORMS, 'fanz').required(),
        rememberMe: Joi.boolean().optional()
      }),
      adultContentCheck: true,
      ageVerificationRequired: false
    },
    {
      path: '/api/*/users/register',
      method: 'POST',
      schema: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required(),
        dateOfBirth: Joi.date().max('now').required(),
        platform: Joi.string().valid(...this.ADULT_PLATFORMS, 'fanz').required(),
        termsAccepted: Joi.boolean().valid(true).required(),
        ageVerified: Joi.boolean().valid(true).when('platform', {
          is: Joi.string().valid(...this.ADULT_PLATFORMS),
          then: Joi.required()
        })
      }),
      adultContentCheck: true,
      ageVerificationRequired: true
    },
    {
      path: '/api/*/content/upload',
      method: 'POST',
      schema: Joi.object({
        title: Joi.string().min(1).max(200).required(),
        description: Joi.string().max(2000).optional(),
        tags: Joi.array().items(Joi.string().max(50)).max(20).optional(),
        platform: Joi.string().required(),
        adultContent: Joi.boolean().required(),
        ageRestricted: Joi.boolean().when('adultContent', {
          is: true,
          then: Joi.required()
        })
      }),
      adultContentCheck: true,
      ageVerificationRequired: true
    },
    {
      path: '/api/payments/*',
      method: 'POST',
      schema: Joi.object({
        amount: Joi.number().positive().precision(2).required(),
        currency: Joi.string().valid('USD', 'EUR', 'GBP', 'CAD', 'AUD').required(),
        processor: Joi.string().valid('ccbill', 'paxum', 'segpay').required(),
        platform: Joi.string().required()
      }),
      adultContentCheck: false,
      ageVerificationRequired: true
    }
  ];

  // Response filtering rules
  private readonly responseFilters: ResponseFilter[] = [
    {
      platform: 'all',
      contentType: ['application/json'],
      transformations: {
        removeFields: ['password', 'secret', 'token', 'key'],
        sanitizeHtml: true,
        encryptPii: true
      }
    },
    {
      platform: 'adult',
      contentType: ['application/json', 'text/html'],
      transformations: {
        addWatermark: true,
        removeFields: ['internal_id', 'raw_data'],
        sanitizeHtml: true
      }
    }
  ];

  /**
   * Initialize API Gateway with security configurations
   */
  public configureGateway(app: express.Application): void {
    console.log('🛡️ Configuring FANZ API Gateway Security...');

    // Trust proxy for proper IP detection
    app.set('trust proxy', 1);

    // Compression with security considerations
    app.use(compression({
      filter: (req, res) => {
        // Don't compress responses for sensitive endpoints
        if (req.path.includes('/api/auth/') || req.path.includes('/api/payments/')) {
          return false;
        }
        return compression.filter(req, res);
      }
    }));

    // Security headers
    this.configureSecurityHeaders(app);

    // Request validation and sanitization
    this.configureRequestValidation(app);

    // Rate limiting
    this.configureRateLimiting(app);

    // Adult content filtering
    this.configureAdultContentFiltering(app);

    // Proxy configuration
    this.configureProxies(app);

    // Response filtering
    this.configureResponseFiltering(app);

    // Error handling
    this.configureErrorHandling(app);

    console.log('✅ API Gateway Security Configuration Complete');
  }

  /**
   * Configure security headers with adult content considerations
   */
  private configureSecurityHeaders(app: express.Application): void {
    app.use(helmet({
      contentSecurityPolicy: {
        directives: this.securityConfig.contentSecurityPolicy.directives,
        reportOnly: this.securityConfig.contentSecurityPolicy.reportOnly
      },
      crossOriginEmbedderPolicy: false, // Allow adult content embeds
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      },
      noSniff: true,
      xssFilter: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
    }));

    // Custom adult content headers
    app.use((req: Request, res: Response, next: NextFunction) => {
      const platform = this.extractPlatform(req);
      
      if (this.ADULT_PLATFORMS.includes(platform)) {
        res.setHeader('X-Adult-Content', 'true');
        res.setHeader('X-Age-Verification-Required', 'true');
        res.setHeader('Content-Warning', 'adult-content');
        res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
      }

      // Remove identifying headers
      this.securityConfig.responseFiltering.removeHeaders.forEach(header => {
        res.removeHeader(header);
      });

      next();
    });
  }

  /**
   * Configure request validation and sanitization
   */
  private configureRequestValidation(app: express.Application): void {
    // Body parsing with size limits
    app.use(express.json({ 
      limit: this.securityConfig.requestValidation.maxPayloadSize,
      verify: (req: any, res, buf) => {
        // Store raw body for webhook signature verification
        req.rawBody = buf;
      }
    }));
    
    app.use(express.urlencoded({ 
      extended: true, 
      limit: this.securityConfig.requestValidation.maxPayloadSize 
    }));

    // Request validation middleware
    app.use(this.validateRequest.bind(this));
  }

  /**
   * Configure rate limiting with platform-specific rules
   */
  private configureRateLimiting(app: express.Application): void {
    // General rate limiting
    const generalRateLimit = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000,
      message: {
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: '15 minutes'
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req: Request) => {
        const ip = req.ip || 'unknown';
        const platform = this.extractPlatform(req);
        return `${ip}:${platform}`;
      }
    });

    app.use('/api/', generalRateLimit);

    // Adult platform specific rate limiting
    this.ADULT_PLATFORMS.forEach(platform => {
      const adultRateLimit = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 500, // Stricter limit for adult content
        message: {
          error: 'Adult Content Rate Limit Exceeded',
          message: 'Enhanced security limits active for adult content platforms.',
          retryAfter: '15 minutes'
        }
      });

      app.use(`/api/${platform}`, adultRateLimit);
    });

    // Payment endpoint strict rate limiting
    const paymentRateLimit = rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 50,
      message: {
        error: 'Payment Rate Limit Exceeded',
        message: 'Too many payment requests. Contact support if needed.',
        retryAfter: '1 hour'
      }
    });

    app.use('/api/payments', paymentRateLimit);
  }

  /**
   * Configure adult content filtering and compliance
   */
  private configureAdultContentFiltering(app: express.Application): void {
    app.use(async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
      const platform = this.extractPlatform(req);
      
      // Adult content platform checks
      if (this.ADULT_PLATFORMS.includes(platform)) {
        
        // Age verification requirement
        if (!req.user?.ageVerified) {
          return res.status(403).json({
            error: 'Age Verification Required',
            message: 'Age verification is required to access adult content',
            code: 'AGE_VERIFICATION_REQUIRED',
            verificationUrl: '/age-verification',
            platform
          });
        }

        // Content classification logging for compliance
        if (this.securityConfig.adultContentFiltering.complianceLogging) {
          console.log(`Adult content access: User ${req.user?.id}, Platform: ${platform}, Path: ${req.path}, IP: ${req.ip}`);
        }

        // Add adult content headers
        res.setHeader('X-Adult-Platform', platform);
        res.setHeader('X-Content-Classification', 'adult');
        res.setHeader('X-Compliance-Logged', 'true');
      }

      next();
    });
  }

  /**
   * Configure service proxies with security
   */
  private configureProxies(app: express.Application): void {
    this.proxyTargets.forEach(target => {
      const proxyOptions: Options = {
        target: target.target,
        changeOrigin: target.changeOrigin,
        secure: target.secure,
        pathRewrite: target.pathRewrite,
        
        // Security event handlers
        onProxyReq: (proxyReq, req: Request & { user?: any }) => {
          // Add security headers to proxied requests
          if (req.user?.id) {
            proxyReq.setHeader('X-User-ID', req.user.id);
          }
          proxyReq.setHeader('X-Gateway-Timestamp', Date.now().toString());
          proxyReq.setHeader('X-Platform', target.platform);
          
          // Adult content specific headers
          if (target.adultContent) {
            proxyReq.setHeader('X-Adult-Content', 'true');
            proxyReq.setHeader('X-Age-Verified', req.user?.ageVerified?.toString() || 'false');
          }
        },

        onProxyRes: (proxyRes, req, res) => {
          // Filter response headers for security
          this.securityConfig.responseFiltering.removeHeaders.forEach(header => {
            delete proxyRes.headers[header.toLowerCase()];
          });

          // Log adult content responses for compliance
          if (target.adultContent) {
            console.log(`Adult content response: ${target.platform}, Status: ${proxyRes.statusCode}, User: ${(req as any).user?.id}`);
          }
        },

        onError: (err, req, res) => {
          console.error(`Proxy error for ${target.name}:`, err);
          res.status(502).json({
            error: 'Bad Gateway',
            message: 'Service temporarily unavailable',
            service: target.name
          });
        }
      };

      // Apply target-specific rate limiting
      if (target.rateLimit) {
        const targetRateLimit = rateLimit({
          windowMs: target.rateLimit.windowMs,
          max: target.rateLimit.max,
          message: {
            error: 'Service Rate Limit Exceeded',
            message: `Rate limit exceeded for ${target.name}`,
            service: target.name
          }
        });

        const pathPattern = Object.keys(target.pathRewrite || {})[0] || `/${target.id}`;
        app.use(pathPattern, targetRateLimit);
      }

      // Create and apply proxy middleware
      const pathPattern = Object.keys(target.pathRewrite || {})[0] || `/${target.id}`;
      app.use(pathPattern, createProxyMiddleware(proxyOptions));
    });
  }

  /**
   * Configure response filtering and sanitization
   */
  private configureResponseFiltering(app: express.Application): void {
    // Response transformation middleware
    app.use((req: Request, res: Response, next: NextFunction) => {
      const originalSend = res.send;
      const platform = this.extractPlatform(req);

      res.send = function(body: any) {
        if (body && typeof body === 'object') {
          body = this.filterResponse(body, platform);
        }
        return originalSend.call(this, body);
      }.bind(this);

      next();
    });
  }

  /**
   * Configure comprehensive error handling
   */
  private configureErrorHandling(app: express.Application): void {
    // 404 handler
    app.use('*', (req: Request, res: Response) => {
      res.status(404).json({
        error: 'Not Found',
        message: 'The requested resource was not found',
        path: req.path,
        timestamp: new Date().toISOString()
      });
    });

    // Error handler
    app.use((error: any, req: Request, res: Response, next: NextFunction) => {
      console.error('API Gateway Error:', error);

      // Don't leak error details in production
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      res.status(error.status || 500).json({
        error: error.name || 'Internal Server Error',
        message: isDevelopment ? error.message : 'An internal error occurred',
        ...(isDevelopment && { stack: error.stack }),
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
      });
    });
  }

  /**
   * Validate incoming requests
   */
  private validateRequest(req: Request, res: Response, next: NextFunction): void {
    // Method validation
    if (!this.securityConfig.requestValidation.allowedMethods.includes(req.method)) {
      return res.status(405).json({
        error: 'Method Not Allowed',
        message: `HTTP method ${req.method} is not allowed`,
        allowedMethods: this.securityConfig.requestValidation.allowedMethods
      });
    }

    // User agent validation
    const userAgent = req.headers['user-agent'] || '';
    const isBlocked = this.securityConfig.requestValidation.blockedUserAgents.some(pattern => 
      pattern.test(userAgent)
    );

    if (isBlocked) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Request blocked by security policy',
        code: 'BLOCKED_USER_AGENT'
      });
    }

    // Required headers validation
    const missingHeaders = this.securityConfig.requestValidation.requiredHeaders.filter(header => 
      !req.headers[header.toLowerCase()]
    );

    if (missingHeaders.length > 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required headers',
        missingHeaders
      });
    }

    // Schema validation for specific endpoints
    const matchedRule = this.validationRules.find(rule => 
      req.path.match(new RegExp(rule.path.replace(/\*/g, '[^/]*'))) && 
      req.method === rule.method
    );

    if (matchedRule) {
      const { error, value } = matchedRule.schema.validate(req.body);
      
      if (error) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Request body validation failed',
          details: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }))
        });
      }

      // Sanitize validated data
      req.body = this.sanitizeInput(value);
    }

    next();
  }

  /**
   * Filter and sanitize response data
   */
  private filterResponse(data: any, platform: string): any {
    const filters = this.responseFilters.filter(f => 
      f.platform === 'all' || 
      f.platform === platform || 
      (f.platform === 'adult' && this.ADULT_PLATFORMS.includes(platform))
    );

    filters.forEach(filter => {
      const transforms = filter.transformations;

      // Remove sensitive fields
      if (transforms.removeFields) {
        data = this.removeFields(data, transforms.removeFields);
      }

      // Sanitize HTML content
      if (transforms.sanitizeHtml && typeof data === 'object') {
        data = this.sanitizeHtmlInObject(data);
      }

      // Add watermarks for adult content
      if (transforms.addWatermark && this.ADULT_PLATFORMS.includes(platform)) {
        data = { ...data, _watermark: `FANZ-${platform.toUpperCase()}-${Date.now()}` };
      }
    });

    return data;
  }

  /**
   * Sanitize input data
   */
  private sanitizeInput(data: any): any {
    if (typeof data === 'string') {
      return validator.escape(DOMPurify.sanitize(data));
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized: any = Array.isArray(data) ? [] : {};
      
      for (const [key, value] of Object.entries(data)) {
        sanitized[validator.escape(key)] = this.sanitizeInput(value);
      }
      
      return sanitized;
    }
    
    return data;
  }

  /**
   * Remove sensitive fields from response
   */
  private removeFields(obj: any, fields: string[]): any {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    const result = Array.isArray(obj) ? [] : {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (!fields.includes(key)) {
        (result as any)[key] = typeof value === 'object' ? this.removeFields(value, fields) : value;
      }
    }
    
    return result;
  }

  /**
   * Sanitize HTML in object properties
   */
  private sanitizeHtmlInObject(obj: any): any {
    if (typeof obj === 'string') {
      return DOMPurify.sanitize(obj);
    }
    
    if (typeof obj === 'object' && obj !== null) {
      const sanitized: any = Array.isArray(obj) ? [] : {};
      
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = this.sanitizeHtmlInObject(value);
      }
      
      return sanitized;
    }
    
    return obj;
  }

  /**
   * Extract platform from request
   */
  private extractPlatform(req: Request): string {
    // Try header first
    const headerPlatform = req.headers['x-platform'] as string;
    if (headerPlatform) return headerPlatform.toLowerCase();

    // Try path-based detection
    const pathMatch = req.path.match(/^\/api\/([^\/]+)/);
    if (pathMatch) return pathMatch[1].toLowerCase();

    // Default to main platform
    return 'fanz';
  }

  /**
   * Get security metrics for monitoring
   */
  public getSecurityMetrics(): any {
    return {
      configuredServices: this.proxyTargets.length,
      adultPlatforms: this.ADULT_PLATFORMS.length,
      validationRules: this.validationRules.length,
      responseFilters: this.responseFilters.length,
      securityFeatures: {
        cspEnabled: this.securityConfig.contentSecurityPolicy.enabled,
        adultContentFiltering: this.securityConfig.adultContentFiltering.enabled,
        requestValidation: true,
        responseFiltering: this.securityConfig.responseFiltering.contentSanitization
      }
    };
  }
}

export {
  FanzApiGatewaySecurityConfig,
  SecurityConfig,
  ProxyTarget,
  RequestValidationRule,
  ResponseFilter
};

export default new FanzApiGatewaySecurityConfig();