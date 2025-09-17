/**
 * 🚀 FANZ Unified API Gateway - Main Server
 * 
 * The central orchestrator that brings together all gateway components:
 * - Service discovery and registration
 * - Advanced middleware stack
 * - Request routing and load balancing
 * - Real-time monitoring and health checks
 * - Graceful shutdown and error handling
 * 
 * This server acts as the single entry point for the entire FANZ ecosystem.
 */

import express, { Express, Request, Response } from 'express';
import cluster from 'cluster';
import os from 'os';
import http from 'http';
import https from 'https';
import fs from 'fs';
import { createProxyMiddleware } from 'http-proxy-middleware';
import helmet from 'helmet';
import compression from 'compression';

// Import FANZ Gateway Components
import { FanzApiGateway } from './src/gateway';
import { UnifiedAPIGateway } from './core/UnifiedAPIGateway';
import ServiceDiscovery from './core/ServiceDiscovery';
import GatewayMiddleware, { AuthenticatedRequest } from './middleware/GatewayMiddleware';
import configManager from './config/gateway.config';

// =============================================================================
// MAIN GATEWAY SERVER CLASS
// =============================================================================

export class FanzGatewayServer {
  private app: Express;
  private server: http.Server | https.Server;
  private unifiedGateway: UnifiedAPIGateway;
  private serviceDiscovery: ServiceDiscovery;
  private middleware: GatewayMiddleware;
  private config: any;

  constructor() {
    this.config = configManager.getConfig();
    this.app = express();
    
    this.initializeComponents();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private initializeComponents(): void {
    console.log('🔧 Initializing Gateway Components...');
    
    // Initialize Service Discovery
    this.serviceDiscovery = new ServiceDiscovery(configManager.getDiscoveryConfig());
    
    // Initialize Unified API Gateway
    this.unifiedGateway = new UnifiedAPIGateway();
    
    // Initialize Middleware Stack
    this.middleware = new GatewayMiddleware(configManager.getMiddlewareConfig());
    
    console.log('✅ Gateway components initialized');
  }

  private setupMiddleware(): void {
    console.log('🛡️ Setting up middleware stack...');
    
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: this.config.security.headers.csp ? {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          connectSrc: ["'self'", 'wss:', 'https:']
        }
      } : false,
      hsts: this.config.security.headers.hsts ? {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      } : false
    }));

    // Compression
    this.app.use(compression());

    // Custom middleware stack
    this.app.use(this.middleware.cors);
    this.app.use(this.middleware.securityHeaders);
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    this.app.use(this.middleware.requestLogger);
    this.app.use(this.middleware.rateLimit);

    console.log('✅ Middleware stack configured');
  }

  private setupRoutes(): void {
    console.log('🛣️ Setting up API routes...');

    // Gateway status endpoints
    this.setupGatewayRoutes();
    
    // Service-specific routes
    this.setupServiceRoutes();
    
    // Health check endpoint
    this.app.get('/health', this.healthCheckHandler.bind(this));
    
    // Metrics endpoint for Prometheus
    if (this.config.monitoring.prometheus.enabled) {
      this.app.get(this.config.monitoring.prometheus.endpoint, this.metricsHandler.bind(this));
    }

    console.log('✅ Routes configured');
  }

  private setupGatewayRoutes(): void {
    // Gateway status and management
    this.app.get('/gateway/status', this.gatewayStatusHandler.bind(this));
    this.app.get('/gateway/services', this.serviceDiscoveryHandler.bind(this));
    this.app.get('/gateway/config', this.middleware.authenticate, this.middleware.authorize(['admin']), this.configHandler.bind(this));
    this.app.post('/gateway/config', this.middleware.authenticate, this.middleware.authorize(['admin']), this.updateConfigHandler.bind(this));
    
    // Service discovery endpoints
    this.app.get('/discovery/topology', this.topologyHandler.bind(this));
    this.app.get('/discovery/metrics', this.discoveryMetricsHandler.bind(this));
  }

  private setupServiceRoutes(): void {
    const services = this.config.services;
    
    for (const [serviceName, serviceConfig] of Object.entries(services)) {
      console.log(`🔗 Setting up routes for ${serviceConfig.name} at ${serviceConfig.base_path}`);
      
      // Create service-specific middleware stack
      const serviceMiddleware = [
        // Authentication middleware (if required)
        ...(serviceConfig.routing.auth_required ? [this.middleware.authenticate] : [this.middleware.optionalAuthenticate]),
        
        // Service-specific proxy
        this.createServiceProxy(serviceName, serviceConfig)
      ];

      // Apply middleware stack to service base path
      this.app.use(serviceConfig.base_path, ...serviceMiddleware);
    }
  }

  private createServiceProxy(serviceName: string, serviceConfig: any) {
    const selectTarget = async () => {
      // Use service discovery to get healthy instance
      const instance = await this.serviceDiscovery.selectServiceInstance(serviceName);
      if (instance) {
        return `${serviceConfig.upstream.protocol}://${instance.host}:${instance.port}`;
      }
      
      // Fallback to configured hosts
      const hostIndex = Math.floor(Math.random() * serviceConfig.upstream.hosts.length);
      return `${serviceConfig.upstream.protocol}://${serviceConfig.upstream.hosts[hostIndex]}`;
    };

    return createProxyMiddleware({
      target: selectTarget,
      changeOrigin: true,
      pathRewrite: (path) => {
        return path.replace(serviceConfig.base_path, '');
      },
      timeout: serviceConfig.routing.timeout_ms,
      onProxyReq: (proxyReq, req: AuthenticatedRequest) => {
        // Add gateway headers
        proxyReq.setHeader('X-Gateway-Service', serviceName);
        proxyReq.setHeader('X-Gateway-Version', '1.0.0');
        proxyReq.setHeader('X-Request-ID', req.metrics?.request_id || 'unknown');
        
        // Forward user context
        if (req.user) {
          proxyReq.setHeader('X-User-ID', req.user.id);
          proxyReq.setHeader('X-User-Role', req.user.role);
          proxyReq.setHeader('X-User-Tier', req.user.subscription_tier);
        }
      },
      onProxyRes: (proxyRes, req, res) => {
        // Add response headers
        proxyRes.headers['x-powered-by'] = 'FANZ-Gateway';
        proxyRes.headers['x-service'] = serviceName;
      },
      onError: (err, req, res) => {
        console.error(`❌ Proxy error for ${serviceName}:`, err);
        
        if (!res.headersSent) {
          res.status(502).json({
            error: 'Bad Gateway',
            service: serviceName,
            message: 'Service temporarily unavailable',
            timestamp: new Date().toISOString()
          });
        }
      }
    });
  }

  private setupErrorHandling(): void {
    // 404 handler
    this.app.use('*', (req: Request, res: Response) => {
      res.status(404).json({
        error: 'Not Found',
        message: 'The requested endpoint does not exist',
        timestamp: new Date().toISOString(),
        path: req.originalUrl
      });
    });

    // Global error handler
    this.app.use((error: any, req: Request, res: Response, next: any) => {
      console.error('💥 Unhandled error:', error);
      
      res.status(error.status || 500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : error.message,
        timestamp: new Date().toISOString()
      });
    });
  }

  // =============================================================================
  // ROUTE HANDLERS
  // =============================================================================

  private async healthCheckHandler(req: Request, res: Response): Promise<void> {
    try {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0',
        services: await this.checkServicesHealth(),
        system: {
          memory: process.memoryUsage(),
          cpu: process.cpuUsage(),
          platform: process.platform,
          version: process.version
        }
      };

      const allHealthy = Object.values(health.services).every((s: any) => s.status === 'healthy');
      res.status(allHealthy ? 200 : 503).json(health);
    } catch (error) {
      res.status(500).json({
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  private gatewayStatusHandler(req: Request, res: Response): void {
    const status = this.unifiedGateway.getGatewayStatus();
    res.json({
      gateway: 'FANZ Unified API Gateway',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'production',
      ...status
    });
  }

  private serviceDiscoveryHandler(req: Request, res: Response): void {
    const topology = this.serviceDiscovery.getServiceTopology();
    res.json({
      services: Array.from(topology.services.values()),
      instances: Object.fromEntries(topology.instances),
      total_services: topology.services.size,
      total_instances: Array.from(topology.instances.values()).reduce((sum, instances) => sum + instances.length, 0)
    });
  }

  private topologyHandler(req: Request, res: Response): void {
    const topology = this.serviceDiscovery.getServiceTopology();
    res.json(topology);
  }

  private discoveryMetricsHandler(req: Request, res: Response): void {
    const metrics = this.serviceDiscovery.getServiceMetrics();
    res.json(metrics);
  }

  private configHandler(req: Request, res: Response): void {
    res.json({
      config: this.config,
      environment: process.env.NODE_ENV || 'production',
      last_updated: new Date().toISOString()
    });
  }

  private updateConfigHandler(req: AuthenticatedRequest, res: Response): void {
    try {
      const updates = req.body;
      configManager.updateConfig(updates);
      
      res.json({
        success: true,
        message: 'Configuration updated successfully',
        updated_by: req.user?.id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(400).json({
        error: 'Configuration update failed',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  private async metricsHandler(req: Request, res: Response): Promise<void> {
    try {
      const prometheus = await import('prom-client');
      res.set('Content-Type', prometheus.register.contentType);
      const metrics = await prometheus.register.metrics();
      res.send(metrics);
    } catch (error) {
      res.status(500).json({ error: 'Metrics collection failed' });
    }
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  private async checkServicesHealth(): Promise<Record<string, any>> {
    const services = this.config.services;
    const healthPromises = Object.entries(services).map(async ([serviceName, serviceConfig]: [string, any]) => {
      try {
        const instance = await this.serviceDiscovery.selectServiceInstance(serviceName);
        if (!instance) {
          return [serviceName, { status: 'unavailable', error: 'No healthy instances' }];
        }

        const healthUrl = `${serviceConfig.upstream.protocol}://${instance.host}:${instance.port}${serviceConfig.upstream.health_check}`;
        const response = await fetch(healthUrl, { 
          timeout: 5000,
          signal: AbortSignal.timeout(5000)
        });
        
        return [serviceName, {
          status: response.ok ? 'healthy' : 'unhealthy',
          response_time: Date.now(),
          instance: `${instance.host}:${instance.port}`
        }];
      } catch (error) {
        return [serviceName, { 
          status: 'error', 
          error: error.message 
        }];
      }
    });

    const results = await Promise.allSettled(healthPromises);
    return Object.fromEntries(
      results.map((result, index) => {
        const serviceName = Object.keys(services)[index];
        return result.status === 'fulfilled' 
          ? result.value 
          : [serviceName, { status: 'error', error: 'Health check failed' }];
      })
    );
  }

  // =============================================================================
  // SERVER LIFECYCLE
  // =============================================================================

  public async start(): Promise<void> {
    try {
      const validation = configManager.validateConfig();
      if (!validation.valid) {
        console.error('❌ Configuration validation failed:');
        validation.errors.forEach(error => console.error(`  - ${error}`));
        process.exit(1);
      }

      // Create HTTP/HTTPS server
      if (this.config.server.ssl.enabled) {
        const sslOptions = {
          key: fs.readFileSync(this.config.server.ssl.key_path),
          cert: fs.readFileSync(this.config.server.ssl.cert_path)
        };
        this.server = https.createServer(sslOptions, this.app);
      } else {
        this.server = http.createServer(this.app);
      }

      // Start server
      const port = this.config.server.ssl.enabled ? this.config.server.ssl.port : this.config.server.port;
      await new Promise<void>((resolve) => {
        this.server.listen(port, this.config.server.host, () => {
          console.log(`🚀 FANZ API Gateway started`);
          console.log(`📡 Server: ${this.config.server.ssl.enabled ? 'https' : 'http'}://${this.config.server.host}:${port}`);
          console.log(`🌐 Environment: ${process.env.NODE_ENV || 'production'}`);
          console.log(`🏗️ Services: ${Object.keys(this.config.services).length} configured`);
          resolve();
        });
      });

      // Setup graceful shutdown
      this.setupGracefulShutdown();

    } catch (error) {
      console.error('❌ Failed to start gateway:', error);
      process.exit(1);
    }
  }

  public async stop(): Promise<void> {
    console.log('🛑 Shutting down FANZ API Gateway...');

    // Close server
    if (this.server) {
      await new Promise<void>((resolve) => {
        this.server.close(() => resolve());
      });
    }

    // Shutdown components
    await this.serviceDiscovery.shutdown();
    await this.middleware.shutdown();

    console.log('✅ Gateway shutdown complete');
  }

  private setupGracefulShutdown(): void {
    const signals = ['SIGINT', 'SIGTERM'];
    
    signals.forEach(signal => {
      process.on(signal, async () => {
        console.log(`\n🔄 Received ${signal}, shutting down gracefully...`);
        await this.stop();
        process.exit(0);
      });
    });

    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason) => {
      console.error('💥 Unhandled rejection:', reason);
      process.exit(1);
    });
  }
}

// =============================================================================
// CLUSTER MANAGEMENT
// =============================================================================

export function startGatewayCluster(): void {
  const config = configManager.getConfig();
  
  if (config.server.cluster.enabled && cluster.isPrimary) {
    const numWorkers = config.server.cluster.workers || os.cpus().length;
    
    console.log(`🚀 Starting FANZ Gateway cluster with ${numWorkers} workers`);
    
    // Fork workers
    for (let i = 0; i < numWorkers; i++) {
      cluster.fork();
    }

    // Handle worker events
    cluster.on('exit', (worker, code, signal) => {
      console.log(`⚰️ Worker ${worker.process.pid} died (${signal || code}). Restarting...`);
      cluster.fork();
    });

    cluster.on('online', (worker) => {
      console.log(`👷 Worker ${worker.process.pid} is online`);
    });

  } else {
    // Worker process or single process mode
    const gateway = new FanzGatewayServer();
    gateway.start();
  }
}

// =============================================================================
// START THE GATEWAY
// =============================================================================

if (require.main === module) {
  console.log('🌟 FANZ Unified API Gateway');
  console.log('===========================');
  startGatewayCluster();
}

export default FanzGatewayServer;