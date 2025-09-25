/**
 * FANZ Unified API Gateway
 * 
 * Central routing and orchestration point for the entire FANZ ecosystem.
 * Handles authentication, authorization, rate limiting, and routing.
 * 
 * Architecture Flow:
 * FanzLanding → Auth (SSO) → API Gateway → Platforms (BoyFanz, GirlFanz, PupFanz)
 * All platform requests flow through this gateway for unified security and monitoring.
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { Redis } from 'ioredis';
import FanzEventBus from '../fanz-central-command/src/EventBus';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
    role: string;
    platform?: string;
    subscriptions?: string[];
  };
}

interface PlatformRoute {
  path: string;
  target: string;
  platform: string;
  requiresAuth: boolean;
  requiresAdultVerification: boolean;
  rateLimit?: {
    windowMs: number;
    max: number;
  };
}

interface GatewayConfig {
  port: number;
  jwt: {
    secret: string;
    expiresIn: string;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
  };
  platforms: PlatformRoute[];
  adultContent: {
    enabled: boolean;
    verificationRequired: boolean;
    ageGateway: boolean;
  };
  cors: {
    origin: string[];
    credentials: boolean;
  };
}

/**
 * FANZ Unified API Gateway
 * 
 * Routes traffic between:
 * - FanzLanding (marketing/onboarding)
 * - Auth Service (SSO/OAuth2)
 * - Core Platforms (BoyFanz, GirlFanz, PupFanz)
 * - Support Services (Media Hub, Finance, Analytics)
 * 
 * Features:
 * - JWT-based authentication
 * - Adult content age verification
 * - Rate limiting and DDoS protection
 * - Request/response logging
 * - Platform-specific routing
 * - Real-time metrics via Event Bus
 */
export class FanzApiGateway {
  private app: Application;
  private redis: Redis;
  private eventBus: FanzEventBus;
  private platforms: Map<string, PlatformRoute> = new Map();

  constructor(private config: GatewayConfig, eventBus: FanzEventBus) {
    this.app = express();
    this.eventBus = eventBus;
    
    // Initialize Redis for session management and caching
    this.redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
    });

    // Load platform routes
    this.loadPlatformRoutes();
    
    // Setup middleware
    this.setupMiddleware();
    
    // Setup routes
    this.setupRoutes();
  }

  /**
   * Load platform routing configuration
   */
  private loadPlatformRoutes(): void {
    // Default FANZ ecosystem platform routes
    const defaultPlatforms: PlatformRoute[] = [
      {
        path: '/api/boyfanz/*',
        target: 'http://boyfanz-service:3001',
        platform: 'BoyFanz',
        requiresAuth: true,
        requiresAdultVerification: true,
        rateLimit: { windowMs: 15 * 60 * 1000, max: 1000 } // 1000 requests per 15 minutes
      },
      {
        path: '/api/girlfanz/*',
        target: 'http://girlfanz-service:3002',
        platform: 'GirlFanz', 
        requiresAuth: true,
        requiresAdultVerification: true,
        rateLimit: { windowMs: 15 * 60 * 1000, max: 1000 }
      },
      {
        path: '/api/pupfanz/*',
        target: 'http://pupfanz-service:3003',
        platform: 'PupFanz',
        requiresAuth: true,
        requiresAdultVerification: true,
        rateLimit: { windowMs: 15 * 60 * 1000, max: 1000 }
      },
      {
        path: '/api/media/*',
        target: 'http://media-hub:3010',
        platform: 'MediaHub',
        requiresAuth: true,
        requiresAdultVerification: false,
        rateLimit: { windowMs: 5 * 60 * 1000, max: 50 } // 50 uploads per 5 minutes
      },
      {
        path: '/api/finance/*',
        target: 'http://fanz-finance:3020',
        platform: 'FanzFinance',
        requiresAuth: true,
        requiresAdultVerification: false,
        rateLimit: { windowMs: 15 * 60 * 1000, max: 200 } // 200 requests per 15 minutes
      },
      {
        path: '/api/dash/*',
        target: 'http://fanz-dash:3030',
        platform: 'FanzDash',
        requiresAuth: true,
        requiresAdultVerification: false,
        rateLimit: { windowMs: 15 * 60 * 1000, max: 500 } // 500 requests per 15 minutes
      },
      {
        path: '/api/auth/*',
        target: 'http://auth-service:3040',
        platform: 'Auth',
        requiresAuth: false,
        requiresAdultVerification: false,
        rateLimit: { windowMs: 15 * 60 * 1000, max: 100 } // 100 auth requests per 15 minutes
      }
    ];

    // Merge with config platforms
    const allPlatforms = [...defaultPlatforms, ...this.config.platforms];
    
    allPlatforms.forEach(platform => {
      this.platforms.set(platform.path, platform);
      console.log(`🔗 Registered platform route: ${platform.path} → ${platform.target}`);
    });
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware(): void {
    // Security headers
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
        },
      },
    }));

    // CORS configuration for FANZ ecosystem
    this.app.use(cors({
      origin: this.config.cors.origin,
      credentials: this.config.cors.credentials,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Platform', 'X-Adult-Verified'],
    }));

    // Request parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Global rate limiting
    const globalLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5000, // 5000 requests per window
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use(globalLimiter);

    // Request logging and metrics
    this.app.use(this.requestLogger.bind(this));
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'operational',
        service: 'fanz-api-gateway',
        timestamp: new Date(),
        version: '1.0.0'
      });
    });

    // System status endpoint
    this.app.get('/system', this.authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
      try {
        // Only allow admin access to system status
        if (req.user?.role !== 'admin') {
          return res.status(403).json({ error: 'Admin access required' });
        }

        const systemHealth = await this.eventBus.getSystemHealth();
        const gatewayMetrics = await this.getGatewayMetrics();

        res.json({
          status: 'operational',
          components: {
            gateway: gatewayMetrics,
            eventBus: systemHealth,
            platforms: await this.getPlatformStatus()
          },
          timestamp: new Date()
        });
      } catch (error) {
        res.status(500).json({ error: 'Failed to get system status' });
      }
    });

    // Adult content age verification
    this.app.post('/api/verify-age', this.verifyAge.bind(this));

    // Platform routing with authentication and adult verification
    this.setupPlatformRoutes();

    // 404 handler
    this.app.use('*', (req: Request, res: Response) => {
      res.status(404).json({
        error: 'Endpoint not found',
        message: 'The requested endpoint does not exist in the FANZ API ecosystem'
      });
    });

    // Global error handler
    this.app.use(this.errorHandler.bind(this));
  }

  /**
   * Setup dynamic platform routes with proxying
   */
  private setupPlatformRoutes(): void {
    this.platforms.forEach((platformConfig, path) => {
      // Create rate limiter for this platform if specified
      const platformLimiter = platformConfig.rateLimit ? rateLimit({
        windowMs: platformConfig.rateLimit.windowMs,
        max: platformConfig.rateLimit.max,
        message: `Too many requests to ${platformConfig.platform}, please try again later.`,
      }) : (req: Request, res: Response, next: NextFunction) => next();

      // Create proxy middleware
      const proxyOptions: Options = {
        target: platformConfig.target,
        changeOrigin: true,
        pathRewrite: (path, req) => {
          // Remove the platform prefix from the path
          return path.replace(new RegExp(`^/api/${platformConfig.platform.toLowerCase()}`), '');
        },
        onProxyReq: (proxyReq, req: AuthenticatedRequest, res) => {
          // Add user context to proxied requests
          if (req.user) {
            proxyReq.setHeader('X-User-ID', req.user.id);
            proxyReq.setHeader('X-User-Role', req.user.role);
            proxyReq.setHeader('X-Platform', platformConfig.platform);
          }
        },
        onProxyRes: (proxyRes, req: AuthenticatedRequest, res) => {
          // Log platform responses for monitoring
          this.logPlatformResponse(platformConfig.platform, proxyRes.statusCode || 0, req.user?.id);
        },
        onError: (err, req, res) => {
          console.error(`Proxy error for ${platformConfig.platform}:`, err);
          res.status(503).json({
            error: 'Service temporarily unavailable',
            platform: platformConfig.platform,
            message: 'The requested service is currently unavailable. Please try again later.'
          });
        }
      };

      const proxy = createProxyMiddleware(proxyOptions);

      // Setup middleware chain for this platform
      const middlewareChain = [platformLimiter];

      // Add authentication if required
      if (platformConfig.requiresAuth) {
        middlewareChain.push(this.authenticateToken);
      }

      // Add adult verification if required
      if (platformConfig.requiresAdultVerification) {
        middlewareChain.push(this.requireAdultVerification);
      }

      // Add the proxy as final middleware
      middlewareChain.push(proxy);

      // Register the route
      this.app.use(path, ...middlewareChain);

      console.log(`🚀 Platform route configured: ${path} → ${platformConfig.target}`);
    });
  }

  /**
   * JWT Authentication middleware
   */
  private authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please provide a valid authentication token'
      });
    }

    jwt.verify(token, this.config.jwt.secret, (err: any, user: any) => {
      if (err) {
        return res.status(403).json({
          error: 'Invalid token',
          message: 'The provided authentication token is invalid or expired'
        });
      }

      req.user = user;
      next();
    });
  };

  /**
   * Adult content verification middleware
   */
  private requireAdultVerification = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!this.config.adultContent.enabled) {
      return next();
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required for adult content'
      });
    }

    // Check if user has verified age
    const verificationStatus = await this.redis.get(`adult_verified:${userId}`);
    
    if (!verificationStatus || verificationStatus !== 'verified') {
      return res.status(451).json({
        error: 'Adult verification required',
        message: 'You must verify your age before accessing adult content',
        verificationUrl: '/api/verify-age'
      });
    }

    next();
  };

  /**
   * Age verification endpoint
   */
  private async verifyAge(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { birthDate, verificationMethod, documentId } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!birthDate) {
        return res.status(400).json({ error: 'Birth date is required' });
      }

      // Calculate age
      const birth = new Date(birthDate);
      const today = new Date();
      const age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }

      if (age < 18) {
        return res.status(403).json({
          error: 'Age verification failed',
          message: 'You must be at least 18 years old to access adult content'
        });
      }

      // Store verification in Redis with 1 year expiration
      await this.redis.setex(`adult_verified:${userId}`, 365 * 24 * 60 * 60, 'verified');

      // Log verification event
      await this.eventBus.publishEvent({
        id: `age_verification_${userId}_${Date.now()}`,
        type: 'user_age_verified',
        source: 'fanz-api-gateway',
        timestamp: new Date(),
        version: '1.0',
        data: {
          userId,
          age,
          verificationMethod: verificationMethod || 'birthdate',
          timestamp: new Date()
        }
      });

      res.json({
        status: 'verified',
        message: 'Age verification successful',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      });

    } catch (error) {
      console.error('Age verification error:', error);
      res.status(500).json({ error: 'Age verification failed' });
    }
  }

  /**
   * Request logging middleware
   */
  private async requestLogger(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const startTime = Date.now();

    // Log request
    console.log(`📥 ${req.method} ${req.path} from ${req.ip} (User: ${req.user?.id || 'anonymous'})`);

    // Capture response
    res.on('finish', async () => {
      const duration = Date.now() - startTime;
      
      // Log response
      console.log(`📤 ${req.method} ${req.path} → ${res.statusCode} (${duration}ms)`);

      // Send metrics to Event Bus
      await this.eventBus.publishEvent({
        id: `request_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'api_request_processed',
        source: 'fanz-api-gateway',
        timestamp: new Date(),
        version: '1.0',
        data: {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration,
          userId: req.user?.id,
          userAgent: req.headers['user-agent'],
          ip: req.ip
        }
      });
    });

    next();
  }

  /**
   * Log platform responses for monitoring
   */
  private async logPlatformResponse(platform: string, statusCode: number, userId?: string): Promise<void> {
    await this.eventBus.publishEvent({
      id: `platform_response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'platform_response_logged',
      source: 'fanz-api-gateway',
      timestamp: new Date(),
      version: '1.0',
      data: {
        platform,
        statusCode,
        userId,
        timestamp: new Date()
      }
    });
  }

  /**
   * Error handler middleware
   */
  private errorHandler(error: any, req: Request, res: Response, next: NextFunction): void {
    console.error('🚨 Gateway Error:', error);

    // Log error event
    this.eventBus.publishEvent({
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'gateway_error',
      source: 'fanz-api-gateway',
      timestamp: new Date(),
      version: '1.0',
      data: {
        error: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method
      }
    });

    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred. Please try again later.'
    });
  }

  /**
   * Get gateway metrics
   */
  private async getGatewayMetrics(): Promise<any> {
    const connections = await this.redis.get('gateway:connections') || '0';
    const requests = await this.redis.get('gateway:requests') || '0';

    return {
      status: 'operational',
      activeConnections: parseInt(connections),
      totalRequests: parseInt(requests),
      platformsRegistered: this.platforms.size,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    };
  }

  /**
   * Get platform status
   */
  private async getPlatformStatus(): Promise<any> {
    const platformStatus: any = {};

    for (const [path, platform] of this.platforms) {
      // Simple health check (in production, implement proper health checks)
      platformStatus[platform.platform] = {
        target: platform.target,
        requiresAuth: platform.requiresAuth,
        requiresAdultVerification: platform.requiresAdultVerification,
        status: 'unknown' // Would implement actual health checks
      };
    }

    return platformStatus;
  }

  /**
   * Start the API Gateway server
   */
  async start(): Promise<void> {
    try {
      // Initialize Event Bus connection
      this.eventBus.setupCoreHandlers();

      // Start server
      this.app.listen(this.config.port, () => {
        console.log('🚀 FANZ Unified API Gateway started successfully');
        console.log(`📡 Server running on port ${this.config.port}`);
        console.log(`🔗 ${this.platforms.size} platform routes configured`);
        console.log(`🔒 Adult verification: ${this.config.adultContent.enabled ? 'enabled' : 'disabled'}`);
        console.log('');
        console.log('🌟 FANZ ecosystem is ready to serve fans and creators worldwide!');
      });

      // Log startup event
      await this.eventBus.publishEvent({
        id: `gateway_startup_${Date.now()}`,
        type: 'system_gateway_started',
        source: 'fanz-api-gateway',
        timestamp: new Date(),
        version: '1.0',
        data: {
          port: this.config.port,
          platformsCount: this.platforms.size,
          adultContentEnabled: this.config.adultContent.enabled
        }
      });

    } catch (error) {
      console.error('❌ Failed to start FANZ API Gateway:', error);
      throw error;
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down FANZ API Gateway...');
    
    await this.redis.disconnect();
    await this.eventBus.shutdown();
    
    console.log('✅ Gateway shutdown complete');
  }
}

export default FanzApiGateway;