/**
 * Tax Service Server
 * FANZ Unified Ecosystem - Tax Compliance Service
 * 
 * Express.js server with tax calculation, address validation, and
 * compliance endpoints integrated with FanzDash authentication.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import { TaxCalculationService } from './tax-calculation-service/tax_engine';
import { AddressValidationService, AddressController } from './address-service/address_service';
import { TaxApiController } from './tax-api-controller';

// ============================================
// CONFIGURATION
// ============================================

interface ServiceConfig {
  server: {
    port: number;
    host: string;
    environment: string;
  };
  database: {
    connectionString: string;
    maxConnections: number;
  };
  auth: {
    jwtSecret: string;
    tokenExpiry: string;
  };
  tax: {
    cache: {
      enabled: boolean;
      ttlSeconds: number;
      maxSize: number;
    };
    rounding: {
      method: 'bankers' | 'half_up' | 'truncate';
      precision: number;
    };
    performance: {
      timeoutMs: number;
      maxConcurrency: number;
    };
    marketplace: {
      companyEntity: string;
      homeState: string;
      facilitatorStates: string[];
    };
  };
  address: {
    usps: {
      enabled: boolean;
      apiKey?: string;
      endpoint: string;
    };
    smarty: {
      enabled: boolean;
      authId?: string;
      authToken?: string;
      endpoint: string;
    };
    fallbackChain: ('usps' | 'smarty' | 'geocoding')[];
    cacheEnabled: boolean;
    cacheTtlSeconds: number;
  };
  monitoring: {
    metricsEnabled: boolean;
    healthCheckPath: string;
    requestLogging: boolean;
  };
  rateLimiting: {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests: boolean;
  };
}

// Default configuration
const defaultConfig: ServiceConfig = {
  server: {
    port: parseInt(process.env.TAX_SERVICE_PORT || '8080'),
    host: process.env.TAX_SERVICE_HOST || '0.0.0.0',
    environment: process.env.NODE_ENV || 'development'
  },
  database: {
    connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/fanz_unified',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20')
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret_here',
    tokenExpiry: process.env.JWT_EXPIRY || '24h'
  },
  tax: {
    cache: {
      enabled: process.env.TAX_CACHE_ENABLED === 'true',
      ttlSeconds: parseInt(process.env.TAX_CACHE_TTL || '3600'),
      maxSize: parseInt(process.env.TAX_CACHE_MAX_SIZE || '10000')
    },
    rounding: {
      method: (process.env.TAX_ROUNDING_METHOD as any) || 'bankers',
      precision: parseInt(process.env.TAX_ROUNDING_PRECISION || '2')
    },
    performance: {
      timeoutMs: parseInt(process.env.TAX_TIMEOUT_MS || '5000'),
      maxConcurrency: parseInt(process.env.TAX_MAX_CONCURRENCY || '100')
    },
    marketplace: {
      companyEntity: 'FANZ',
      homeState: 'WY',
      facilitatorStates: ['WY', 'CA', 'TX', 'NY', 'FL'] // States where FANZ acts as marketplace facilitator
    }
  },
  address: {
    usps: {
      enabled: process.env.USPS_ENABLED === 'true',
      apiKey: process.env.USPS_API_KEY,
      endpoint: 'https://secure.shippingapis.com/ShippingAPI.dll'
    },
    smarty: {
      enabled: process.env.SMARTY_ENABLED === 'true',
      authId: process.env.SMARTY_AUTH_ID,
      authToken: process.env.SMARTY_AUTH_TOKEN,
      endpoint: 'https://us-street.api.smartystreets.com/street-address'
    },
    fallbackChain: ['usps', 'smarty', 'geocoding'],
    cacheEnabled: true,
    cacheTtlSeconds: 86400 // 24 hours
  },
  monitoring: {
    metricsEnabled: process.env.METRICS_ENABLED === 'true',
    healthCheckPath: '/health',
    requestLogging: process.env.REQUEST_LOGGING === 'true'
  },
  rateLimiting: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000,
    skipSuccessfulRequests: false
  }
};

// ============================================
// SERVER SETUP
// ============================================

class TaxService {
  private app: express.Application;
  private config: ServiceConfig;
  private taxController: TaxApiController;
  private addressController: AddressController;

  constructor(config: ServiceConfig = defaultConfig) {
    this.config = config;
    this.app = express();
    
    this.initializeServices();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Initialize tax and address services
   */
  private initializeServices(): void {
    // Initialize tax calculation service
    const taxService = new TaxCalculationService({
      database: {
        connectionString: this.config.database.connectionString
      },
      cache: this.config.tax.cache,
      rounding: this.config.tax.rounding,
      performance: this.config.tax.performance,
      marketplace: this.config.tax.marketplace
    });

    // Initialize address validation service
    const addressService = new AddressValidationService(this.config.address);

    // Initialize controllers
    this.taxController = new TaxApiController(
      taxService,
      addressService,
      this.config.auth.jwtSecret
    );

    this.addressController = new AddressController(this.config.address);
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: this.config.rateLimiting.windowMs,
      max: this.config.rateLimiting.maxRequests,
      message: {
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.'
      },
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => {
        // Skip rate limiting for health checks
        return req.path === this.config.monitoring.healthCheckPath;
      }
    });
    this.app.use(limiter);

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    if (this.config.monitoring.requestLogging) {
      this.app.use((req, res, next) => {
        const startTime = Date.now();
        
        res.on('finish', () => {
          const duration = Date.now() - startTime;
          console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
        });
        
        next();
      });
    }

    // Request ID middleware
    this.app.use((req, res, next) => {
      req.headers['x-request-id'] = req.headers['x-request-id'] || 
        `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      res.setHeader('X-Request-ID', req.headers['x-request-id'] as string);
      next();
    });
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    // Health check endpoint
    this.app.get(this.config.monitoring.healthCheckPath, (req, res) => {
      res.json({
        status: 'healthy',
        service: 'fanz-tax-service',
        version: process.env.SERVICE_VERSION || '1.0.0',
        environment: this.config.server.environment,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage()
      });
    });

    // API info endpoint
    this.app.get('/api/info', (req, res) => {
      res.json({
        service: 'FANZ Tax Compliance Service',
        version: '1.0.0',
        description: 'Real-time tax calculation and compliance for FANZ ecosystem',
        endpoints: {
          tax: {
            quote: 'POST /tax/quote',
            commit: 'POST /tax/commit',
            void: 'POST /tax/void',
            refund: 'POST /tax/refund',
            rates: 'GET /tax/rates'
          },
          address: {
            validate: 'POST /address/validate',
            resolveJurisdictions: 'POST /address/resolve-jurisdictions',
            getById: 'GET /address/:id'
          },
          nexus: {
            metrics: 'GET /nexus/metrics',
            register: 'POST /nexus/register'
          }
        },
        authentication: 'JWT Bearer token required',
        rateLimit: `${this.config.rateLimiting.maxRequests} requests per ${this.config.rateLimiting.windowMs/60000} minutes`
      });
    });

    // Tax calculation endpoints (authenticated)
    const taxRouter = express.Router();
    taxRouter.use(this.taxController.authenticate);
    
    taxRouter.post('/quote', 
      this.taxController.requirePermission('tax:calculate'),
      this.taxController.quoteTax
    );
    
    taxRouter.post('/commit',
      this.taxController.requirePermission('tax:commit'),
      this.taxController.commitTax
    );
    
    taxRouter.post('/void',
      this.taxController.requirePermission('tax:void'),
      this.taxController.voidTax
    );
    
    taxRouter.post('/refund',
      this.taxController.requirePermission('tax:refund'),
      this.taxController.refundTax
    );
    
    taxRouter.get('/rates',
      this.taxController.requirePermission('tax:read'),
      this.taxController.getTaxRates
    );

    this.app.use('/tax', taxRouter);

    // Address validation endpoints (authenticated)
    const addressRouter = express.Router();
    addressRouter.use(this.taxController.authenticate);
    
    addressRouter.post('/validate',
      this.taxController.requirePermission('address:validate'),
      this.addressController.validateAddress.bind(this.addressController)
    );
    
    addressRouter.post('/resolve-jurisdictions',
      this.taxController.requirePermission('address:resolve'),
      this.addressController.resolveJurisdictions.bind(this.addressController)
    );
    
    addressRouter.get('/:id',
      this.taxController.requirePermission('address:read'),
      this.addressController.getAddress.bind(this.addressController)
    );

    this.app.use('/address', addressRouter);

    // Nexus monitoring endpoints (authenticated)
    const nexusRouter = express.Router();
    nexusRouter.use(this.taxController.authenticate);
    
    nexusRouter.get('/metrics',
      this.taxController.requirePermission('nexus:read'),
      this.taxController.getNexusMetrics
    );

    this.app.use('/nexus', nexusRouter);

    // Catch-all for undefined routes
    this.app.all('*', (req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
        availableEndpoints: '/api/info'
      });
    });
  }

  /**
   * Setup error handling middleware
   */
  private setupErrorHandling(): void {
    // Global error handler
    this.app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Unhandled error:', err);
      
      // Don't leak error details in production
      const isDevelopment = this.config.server.environment === 'development';
      
      res.status(err.status || 500).json({
        error: 'Internal Server Error',
        message: isDevelopment ? err.message : 'An unexpected error occurred',
        requestId: req.headers['x-request-id'],
        timestamp: new Date().toISOString(),
        ...(isDevelopment && { stack: err.stack })
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      process.exit(0);
    });

    process.on('SIGINT', () => {
      console.log('SIGINT received, shutting down gracefully');
      process.exit(0);
    });
  }

  /**
   * Start the server
   */
  public start(): void {
    const server = this.app.listen(this.config.server.port, this.config.server.host, () => {
      console.log('🚀 FANZ Tax Service started successfully');
      console.log(`📍 Server running on ${this.config.server.host}:${this.config.server.port}`);
      console.log(`🌍 Environment: ${this.config.server.environment}`);
      console.log(`💾 Database: ${this.config.database.connectionString.split('@')[1] || 'configured'}`);
      console.log(`🔐 Auth: JWT enabled`);
      console.log(`📊 Cache: ${this.config.tax.cache.enabled ? 'enabled' : 'disabled'}`);
      console.log(`📍 Address validation: ${this.config.address.usps.enabled ? 'USPS' : ''} ${this.config.address.smarty.enabled ? 'SmartyStreets' : ''}`);
      console.log(`🏛️  Marketplace facilitator states: ${this.config.tax.marketplace.facilitatorStates.join(', ')}`);
      console.log(`🏠 Home state: ${this.config.tax.marketplace.homeState}`);
      console.log('✅ Ready to process tax calculations');
    });

    // Server timeout configuration
    server.timeout = this.config.tax.performance.timeoutMs;
    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;
  }

  /**
   * Get the Express app instance
   */
  public getApp(): express.Application {
    return this.app;
  }
}

// ============================================
// STARTUP
// ============================================

// Start the service if this file is run directly
if (require.main === module) {
  try {
    const service = new TaxService();
    service.start();
  } catch (error) {
    console.error('Failed to start tax service:', error);
    process.exit(1);
  }
}

export default TaxService;
export { ServiceConfig };