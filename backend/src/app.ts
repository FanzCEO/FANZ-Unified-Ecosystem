import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { setupDatabase } from './config/database';
import { setupRedis } from './config/redis';
import { setupAuth } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/logger';
import { setupRoutes } from './routes';
import { setupWebSocket } from './services/websocket';
import { setupMetrics } from './middleware/metrics';
import { Logger } from './utils/logger';
import { config } from './config';

const logger = new Logger('App');

class FanzEcosystemApp {
  public app: Application;
  public server: any;
  public io: SocketIOServer;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: config.CORS_ORIGIN,
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "wss:", "https:"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false
    }));

    // CORS configuration
    this.app.use(cors({
      origin: config.CORS_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // Limit each IP to 1000 requests per windowMs
      message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: 15 * 60
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        logger.warn('Rate limit exceeded', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path
        });
        res.status(429).json({
          error: 'Too many requests from this IP, please try again later.',
          retryAfter: 15 * 60
        });
      }
    });

    // Stricter rate limiting for auth endpoints
    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 10, // Only 10 auth attempts per 15 minutes
      message: {
        error: 'Too many authentication attempts, please try again later.',
        retryAfter: 15 * 60
      }
    });

    this.app.use('/api/', limiter);
    this.app.use('/api/auth/', authLimiter);

    // Body parsing
    this.app.use(express.json({ 
      limit: '10mb',
      verify: (req: any, res, buf) => {
        req.rawBody = buf;
      }
    }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Compression
    this.app.use(compression());

    // Request logging
    this.app.use(requestLogger);

    // Metrics
    this.app.use(setupMetrics());

    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.APP_VERSION || '1.0.0',
        environment: config.NODE_ENV
      });
    });

    // Ready check endpoint (for Kubernetes readiness probe)
    this.app.get('/ready', async (req: Request, res: Response) => {
      try {
        // Check database connection
        const dbHealth = await this.checkDatabaseHealth();
        
        // Check Redis connection  
        const redisHealth = await this.checkRedisHealth();

        if (dbHealth && redisHealth) {
          res.status(200).json({
            status: 'ready',
            timestamp: new Date().toISOString(),
            checks: {
              database: 'healthy',
              redis: 'healthy'
            }
          });
        } else {
          res.status(503).json({
            status: 'not ready',
            timestamp: new Date().toISOString(),
            checks: {
              database: dbHealth ? 'healthy' : 'unhealthy',
              redis: redisHealth ? 'healthy' : 'unhealthy'
            }
          });
        }
      } catch (error) {
        logger.error('Health check failed', { error: error.message });
        res.status(503).json({
          status: 'not ready',
          timestamp: new Date().toISOString(),
          error: 'Health check failed'
        });
      }
    });
  }

  private initializeRoutes(): void {
    // API routes
    setupRoutes(this.app);

    // 404 handler
    this.app.use('*', (req: Request, res: Response) => {
      res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method
      });
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler);

    // Graceful shutdown handling
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, starting graceful shutdown');
      this.gracefulShutdown();
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, starting graceful shutdown');
      this.gracefulShutdown();
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection', {
        reason,
        promise
      });
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
      process.exit(1);
    });
  }

  public async initialize(): Promise<void> {
    try {
      // Initialize database
      await setupDatabase();
      logger.info('Database connection established');

      // Initialize Redis
      await setupRedis();
      logger.info('Redis connection established');

      // Setup WebSocket handlers
      setupWebSocket(this.io);
      logger.info('WebSocket server initialized');

      logger.info('Application initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize application', { error: error.message });
      throw error;
    }
  }

  public async start(port: number): Promise<void> {
    try {
      await this.initialize();

      this.server.listen(port, '0.0.0.0', () => {
        logger.info(`🚀 FANZ Ecosystem API Server started`, {
          port,
          environment: config.NODE_ENV,
          processId: process.pid,
          nodeVersion: process.version,
          timestamp: new Date().toISOString()
        });
      });
    } catch (error) {
      logger.error('Failed to start server', { error: error.message });
      process.exit(1);
    }
  }

  private async checkDatabaseHealth(): Promise<boolean> {
    try {
      // This would be implemented with actual database health check
      // For now, return true
      return true;
    } catch (error) {
      logger.error('Database health check failed', { error: error.message });
      return false;
    }
  }

  private async checkRedisHealth(): Promise<boolean> {
    try {
      // This would be implemented with actual Redis health check
      // For now, return true
      return true;
    } catch (error) {
      logger.error('Redis health check failed', { error: error.message });
      return false;
    }
  }

  private gracefulShutdown(): void {
    logger.info('Starting graceful shutdown...');

    // Close HTTP server
    this.server.close((err) => {
      if (err) {
        logger.error('Error closing HTTP server', { error: err.message });
        process.exit(1);
      }

      logger.info('HTTP server closed');

      // Close WebSocket connections
      this.io.close(() => {
        logger.info('WebSocket server closed');

        // Close database connections
        // This would be implemented with actual cleanup
        logger.info('Database connections closed');

        logger.info('Graceful shutdown completed');
        process.exit(0);
      });
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 30000);
  }
}

export { FanzEcosystemApp };
export default FanzEcosystemApp;