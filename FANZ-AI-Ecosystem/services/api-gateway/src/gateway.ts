import express from 'express';
import httpProxy from 'http-proxy-middleware';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { Logger } from '../../shared/utils/Logger';
import { EventEmitter } from 'events';

/**
 * FANZ AI Ecosystem API Gateway
 * Central routing and service mesh orchestration
 */

export interface ServiceRoute {
  path: string;
  target: string;
  healthCheck: string;
  rateLimit?: {
    windowMs: number;
    max: number;
  };
  auth?: boolean;
  cache?: {
    enabled: boolean;
    ttl: number;
  };
}

export interface GatewayConfig {
  port: number;
  services: Record<string, ServiceRoute>;
  cors: {
    origins: string[];
    credentials: boolean;
  };
  rateLimit: {
    windowMs: number;
    max: number;
  };
  auth: {
    enabled: boolean;
    jwtSecret: string;
  };
  monitoring: {
    enabled: boolean;
    metricsPath: string;
  };
}

export class APIGateway extends EventEmitter {
  private app: express.Application;
  private config: GatewayConfig;
  private logger: Logger;
  private serviceHealth: Map<string, boolean> = new Map();
  private requestMetrics: Map<string, number> = new Map();

  constructor(config: GatewayConfig) {
    super();
    this.config = config;
    this.app = express();
    this.logger = new Logger('APIGateway');
    
    this.setupMiddleware();
    this.setupRoutes();
    this.startHealthChecks();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "wss:", "ws:"]
        }
      },
      crossOriginEmbedderPolicy: false
    }));

    // CORS configuration
    this.app.use(cors({
      origin: this.config.cors.origins,
      credentials: this.config.cors.credentials,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Correlation-ID']
    }));

    // Request parsing and compression
    this.app.use(compression());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Global rate limiting
    const globalRateLimit = rateLimit({
      windowMs: this.config.rateLimit.windowMs,
      max: this.config.rateLimit.max,
      message: {
        error: 'Too many requests from this IP',
        retryAfter: Math.ceil(this.config.rateLimit.windowMs / 1000)
      },
      standardHeaders: true,
      legacyHeaders: false
    });
    this.app.use(globalRateLimit);

    // Request logging and correlation ID
    this.app.use((req, res, next) => {
      const correlationId = req.headers['x-correlation-id'] as string || 
        `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      req.headers['x-correlation-id'] = correlationId;
      res.setHeader('X-Correlation-ID', correlationId);

      const startTime = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        const route = req.route?.path || req.path;
        
        this.logger.info('Request completed', {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration,
          correlationId,
          userAgent: req.get('user-agent'),
          ip: req.ip
        });

        // Update metrics
        const metricKey = `${req.method}:${route}`;
        this.requestMetrics.set(metricKey, (this.requestMetrics.get(metricKey) || 0) + 1);
      });

      next();
    });

    // Authentication middleware (when enabled)
    if (this.config.auth.enabled) {
      this.app.use('/api', this.authenticateRequest.bind(this));
    }
  }

  private async authenticateRequest(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    try {
      const token = authHeader.substring(7);
      // TODO: Implement JWT verification
      // const decoded = jwt.verify(token, this.config.auth.jwtSecret);
      // req.user = decoded;
      
      next();
    } catch (error) {
      this.logger.error('Authentication failed', { error });
      res.status(401).json({ error: 'Invalid token' });
    }
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      const healthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: Object.fromEntries(this.serviceHealth),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || '1.0.0'
      };

      const allServicesHealthy = Array.from(this.serviceHealth.values()).every(healthy => healthy);
      res.status(allServicesHealthy ? 200 : 503).json(healthStatus);
    });

    // Metrics endpoint
    if (this.config.monitoring.enabled) {
      this.app.get(this.config.monitoring.metricsPath, (req, res) => {
        const metrics = {
          requests: Object.fromEntries(this.requestMetrics),
          serviceHealth: Object.fromEntries(this.serviceHealth),
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          timestamp: new Date().toISOString()
        };

        res.json(metrics);
      });
    }

    // Service discovery endpoint
    this.app.get('/api/services', (req, res) => {
      const services = Object.entries(this.config.services).map(([name, config]) => ({
        name,
        path: config.path,
        healthy: this.serviceHealth.get(name) || false,
        target: config.target
      }));

      res.json({ services });
    });

    // Setup service proxies
    Object.entries(this.config.services).forEach(([serviceName, serviceConfig]) => {
      this.setupServiceProxy(serviceName, serviceConfig);
    });

    // Catch-all error handler
    this.app.use((req, res) => {
      res.status(404).json({
        error: 'Service not found',
        path: req.path,
        availableServices: Object.keys(this.config.services)
      });
    });

    // Global error handler
    this.app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      this.logger.error('Unhandled error', { error: error.message, stack: error.stack });
      
      res.status(500).json({
        error: 'Internal server error',
        correlationId: req.headers['x-correlation-id']
      });
    });
  }

  private setupServiceProxy(serviceName: string, config: ServiceRoute): void {
    // Service-specific rate limiting
    let serviceRateLimit: express.RequestHandler | undefined;
    if (config.rateLimit) {
      serviceRateLimit = rateLimit({
        windowMs: config.rateLimit.windowMs,
        max: config.rateLimit.max,
        message: {
          error: `Too many requests to ${serviceName}`,
          service: serviceName,
          retryAfter: Math.ceil(config.rateLimit.windowMs / 1000)
        }
      });
    }

    // Create proxy middleware
    const proxyMiddleware = createProxyMiddleware({
      target: config.target,
      changeOrigin: true,
      pathRewrite: {
        [`^${config.path}`]: ''
      },
      onProxyReq: (proxyReq, req, res) => {
        // Add service name and correlation ID headers
        proxyReq.setHeader('X-Service-Name', serviceName);
        proxyReq.setHeader('X-Correlation-ID', req.headers['x-correlation-id'] as string);
        proxyReq.setHeader('X-Forwarded-For', req.ip);
      },
      onProxyRes: (proxyRes, req, res) => {
        // Add CORS headers to proxied responses
        proxyRes.headers['Access-Control-Allow-Origin'] = this.config.cors.origins.join(',');
        proxyRes.headers['Access-Control-Allow-Credentials'] = this.config.cors.credentials.toString();
      },
      onError: (error, req, res) => {
        this.logger.error(`Proxy error for ${serviceName}`, { error: error.message });
        
        // Mark service as unhealthy
        this.serviceHealth.set(serviceName, false);
        
        if (!res.headersSent) {
          res.status(502).json({
            error: `Service ${serviceName} unavailable`,
            correlationId: req.headers['x-correlation-id']
          });
        }
      }
    });

    // Setup route with optional rate limiting
    const middlewares = [
      ...(serviceRateLimit ? [serviceRateLimit] : []),
      proxyMiddleware
    ];

    this.app.use(config.path, ...middlewares);
    
    this.logger.info(`Configured proxy for ${serviceName}`, {
      path: config.path,
      target: config.target,
      rateLimit: config.rateLimit
    });
  }

  private startHealthChecks(): void {
    const checkInterval = 30000; // 30 seconds
    
    setInterval(() => {
      this.checkServiceHealth();
    }, checkInterval);

    // Initial health check
    this.checkServiceHealth();
  }

  private async checkServiceHealth(): Promise<void> {
    const healthPromises = Object.entries(this.config.services).map(async ([serviceName, config]) => {
      try {
        const response = await fetch(`${config.target}${config.healthCheck}`, {
          method: 'GET',
          timeout: 5000,
          headers: {
            'User-Agent': 'FANZ-API-Gateway-HealthCheck/1.0'
          }
        });

        const isHealthy = response.ok;
        this.serviceHealth.set(serviceName, isHealthy);

        if (!isHealthy) {
          this.logger.warn(`Service ${serviceName} health check failed`, {
            status: response.status,
            target: config.target
          });
        }

        return { serviceName, healthy: isHealthy };
      } catch (error) {
        this.serviceHealth.set(serviceName, false);
        this.logger.error(`Service ${serviceName} health check error`, { error });
        return { serviceName, healthy: false };
      }
    });

    const results = await Promise.all(healthPromises);
    
    // Emit health status events
    results.forEach(({ serviceName, healthy }) => {
      this.emit('serviceHealth', { serviceName, healthy });
    });
  }

  public async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      const server = this.app.listen(this.config.port, () => {
        this.logger.info(`API Gateway started on port ${this.config.port}`, {
          services: Object.keys(this.config.services),
          cors: this.config.cors.origins,
          monitoring: this.config.monitoring.enabled
        });
        resolve();
      });

      server.on('error', (error) => {
        this.logger.error('Failed to start API Gateway', { error });
        reject(error);
      });

      // Graceful shutdown
      process.on('SIGTERM', () => {
        this.logger.info('Received SIGTERM, shutting down gracefully');
        server.close(() => {
          this.logger.info('API Gateway shut down complete');
          process.exit(0);
        });
      });

      process.on('SIGINT', () => {
        this.logger.info('Received SIGINT, shutting down gracefully');
        server.close(() => {
          this.logger.info('API Gateway shut down complete');
          process.exit(0);
        });
      });
    });
  }

  public getServiceHealth(serviceName: string): boolean {
    return this.serviceHealth.get(serviceName) || false;
  }

  public getMetrics(): Record<string, any> {
    return {
      requests: Object.fromEntries(this.requestMetrics),
      serviceHealth: Object.fromEntries(this.serviceHealth),
      uptime: process.uptime(),
      memory: process.memoryUsage()
    };
  }
}