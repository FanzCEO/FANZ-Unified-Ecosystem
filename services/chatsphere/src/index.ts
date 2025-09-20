/**
 * 🚀 ChatSphere Server - Main Application Entry Point
 * 
 * Real-time communication server for the FANZ ecosystem.
 * Handles WebSocket connections, HTTP API endpoints, and WebRTC signaling.
 * 
 * @author FANZ Engineering Team
 * @version 1.0.0
 */

import express from 'express';
import { createServer } from 'http';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { Redis } from 'ioredis';
import dotenv from 'dotenv';
import winston from 'winston';
import { register as promRegistry } from 'prom-client';

import ChatSphereService, { ChatSphereConfig, ModerationLevel } from './ChatSphereService';
import WebRTCService, { WebRTCConfig } from './WebRTCService';
import { setupRoutes } from './routes';
import { setupMiddleware } from './middleware';
import { setupMonitoring } from './monitoring';
import { errorHandler } from './utils/errorHandler';
import { validateConfig } from './utils/configValidator';

// Load environment variables
dotenv.config();

// ===== CONFIGURATION =====

const config = {
  server: {
    port: parseInt(process.env.PORT || '3003'),
    host: process.env.HOST || '0.0.0.0',
    environment: process.env.NODE_ENV || 'development'
  },
  chatSphere: {
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      database: parseInt(process.env.REDIS_CHATSPHERE_DB || '8')
    },
    security: {
      enableEncryption: process.env.ENABLE_ENCRYPTION === 'true',
      enableModeration: process.env.ENABLE_MODERATION === 'true',
      maxMessageLength: parseInt(process.env.MAX_MESSAGE_LENGTH || '10000'),
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '104857600'), // 100MB
      allowedFileTypes: (process.env.ALLOWED_FILE_TYPES || 'image/*,video/*,audio/*,application/pdf').split(',')
    },
    features: {
      enableVoiceCalls: process.env.ENABLE_VOICE_CALLS === 'true',
      enableVideoCalls: process.env.ENABLE_VIDEO_CALLS === 'true',
      enableScreenShare: process.env.ENABLE_SCREEN_SHARE === 'true',
      enableFileSharing: process.env.ENABLE_FILE_SHARING === 'true',
      enableGifts: process.env.ENABLE_GIFTS === 'true',
      enableTips: process.env.ENABLE_TIPS === 'true'
    },
    moderation: {
      enableAIModeration: process.env.ENABLE_AI_MODERATION === 'true',
      defaultModerationLevel: (process.env.DEFAULT_MODERATION_LEVEL as ModerationLevel) || ModerationLevel.MEDIUM,
      maxReportsPerUser: parseInt(process.env.MAX_REPORTS_PER_USER || '10'),
      autoModerationThreshold: parseFloat(process.env.AUTO_MODERATION_THRESHOLD || '0.8')
    },
    performance: {
      maxClientsPerInstance: parseInt(process.env.MAX_CLIENTS_PER_INSTANCE || '10000'),
      heartbeatInterval: parseInt(process.env.HEARTBEAT_INTERVAL || '30000'),
      presenceUpdateInterval: parseInt(process.env.PRESENCE_UPDATE_INTERVAL || '60000'),
      messageArchiveInterval: parseInt(process.env.MESSAGE_ARCHIVE_INTERVAL || '86400000')
    }
  } as ChatSphereConfig,
  webrtc: {
    iceServers: [
      { urls: process.env.STUN_SERVER || 'stun:stun.l.google.com:19302' },
      {
        urls: process.env.TURN_SERVER || 'turn:your-turn-server.com:3478',
        username: process.env.TURN_USERNAME,
        credential: process.env.TURN_CREDENTIAL
      }
    ].filter(server => server.urls && !server.urls.includes('your-')),
    enableRecording: process.env.ENABLE_CALL_RECORDING === 'true',
    maxCallDuration: parseInt(process.env.MAX_CALL_DURATION || '240'), // 4 hours
    qualityMonitoringInterval: parseInt(process.env.QUALITY_MONITORING_INTERVAL || '5'),
    reconnectionAttempts: parseInt(process.env.RECONNECTION_ATTEMPTS || '3'),
    reconnectionDelay: parseInt(process.env.RECONNECTION_DELAY || '5')
  } as WebRTCConfig,
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'your-super-secure-jwt-secret',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  monitoring: {
    enableMetrics: process.env.ENABLE_METRICS === 'true',
    metricsPort: parseInt(process.env.METRICS_PORT || '9090'),
    enableHealthChecks: process.env.ENABLE_HEALTH_CHECKS === 'true'
  }
};

// ===== LOGGING SETUP =====

const logger = winston.createLogger({
  level: config.server.environment === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'chatsphere' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// ===== MAIN APPLICATION CLASS =====

class ChatSphereServer {
  private app: express.Application;
  private server: any;
  private chatSphereService: ChatSphereService;
  private webrtcService: WebRTCService;
  private redis: Redis;
  private rateLimiter: RateLimiterRedis;

  constructor() {
    this.app = express();
    this.setupRedis();
    this.setupExpress();
    this.setupRateLimiting();
  }

  private setupRedis(): void {
    this.redis = new Redis({
      host: config.chatSphere.redis.host,
      port: config.chatSphere.redis.port,
      password: config.chatSphere.redis.password,
      db: config.chatSphere.redis.database,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true
    });

    this.redis.on('connect', () => {
      logger.info('Connected to Redis');
    });

    this.redis.on('error', (error) => {
      logger.error('Redis connection error:', error);
    });

    this.redis.on('reconnecting', () => {
      logger.info('Reconnecting to Redis...');
    });
  }

  private setupExpress(): void {
    // Security headers
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
          mediaSrc: ["'self'", "https:"],
          frameSrc: ["'none'"]
        }
      },
      crossOriginEmbedderPolicy: false
    }));

    // CORS configuration
    this.app.use(cors({
      origin: this.getAllowedOrigins(),
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-User-ID', 'X-Cluster-ID'],
      credentials: true,
      maxAge: 86400 // 24 hours
    }));

    // Compression and parsing
    this.app.use(compression());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use((req, res, next) => {
      logger.debug(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.headers['x-user-id']
      });
      next();
    });
  }

  private setupRateLimiting(): void {
    this.rateLimiter = new RateLimiterRedis({
      storeClient: this.redis,
      keyPrefix: 'chatsphere_rl',
      points: 100, // Number of requests
      duration: 60, // Per 60 seconds
      blockDuration: 60, // Block for 60 seconds if limit exceeded
      execEvenly: true
    });

    // Apply rate limiting middleware
    this.app.use(async (req, res, next) => {
      try {
        const key = req.ip + ':' + (req.headers['x-user-id'] || 'anonymous');
        await this.rateLimiter.consume(key);
        next();
      } catch (rejRes: any) {
        const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
        res.set('Retry-After', String(secs));
        res.status(429).json({
          error: 'Rate limit exceeded',
          retryAfter: secs
        });
      }
    });
  }

  private getAllowedOrigins(): string[] {
    const origins = process.env.ALLOWED_ORIGINS?.split(',') || [];
    
    // Add default origins for development
    if (config.server.environment === 'development') {
      origins.push(
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:8080'
      );
    }

    // Return specific origins only - never use wildcard for security
    if (origins.length === 0) {
      // Default to localhost for development, empty array for production
      return config.server.environment === 'development' 
        ? ['http://localhost:3000'] 
        : [];
    }
    return origins;
  }

  private async setupServices(): Promise<void> {
    // Create HTTP server
    this.server = createServer(this.app);

    // Initialize ChatSphere service
    this.chatSphereService = new ChatSphereService(this.server, config.chatSphere);
    
    // Initialize WebRTC service
    this.webrtcService = new WebRTCService(config.webrtc);

    // Connect services
    this.connectServices();

    // Setup middleware
    setupMiddleware(this.app, {
      jwtSecret: config.auth.jwtSecret,
      redis: this.redis
    });

    // Setup routes
    setupRoutes(this.app, {
      chatSphere: this.chatSphereService,
      webrtc: this.webrtcService,
      redis: this.redis
    });

    // Setup monitoring
    if (config.monitoring.enableMetrics) {
      setupMonitoring(this.app, {
        chatSphere: this.chatSphereService,
        webrtc: this.webrtcService,
        registry: promRegistry
      });
    }

    // Error handling
    this.app.use(errorHandler);

    logger.info('Services initialized successfully');
  }

  private connectServices(): void {
    // Connect ChatSphere and WebRTC services
    this.chatSphereService.on('call_invitation', (data) => {
      // Handle call invitations through WebRTC service
      logger.debug('Call invitation received:', data);
    });

    this.webrtcService.on('signaling_message', (message) => {
      // Forward WebRTC signaling messages through ChatSphere
      logger.debug('WebRTC signaling message:', message);
    });

    this.chatSphereService.on('message_sent', (message) => {
      logger.debug('Message sent:', { 
        messageId: message.id, 
        roomId: message.roomId,
        type: message.type 
      });
    });

    this.webrtcService.on('call_started', (call) => {
      logger.info('Call started:', { 
        callId: call.callId, 
        type: call.type,
        participants: call.participants.length 
      });
    });

    this.webrtcService.on('call_ended', (call) => {
      logger.info('Call ended:', { 
        callId: call.callId, 
        duration: call.duration,
        participants: call.participants.length 
      });
    });

    this.chatSphereService.on('error', (error) => {
      logger.error('ChatSphere service error:', error);
    });

    this.webrtcService.on('error', (error) => {
      logger.error('WebRTC service error:', error);
    });
  }

  private setupHealthChecks(): void {
    // Health check endpoint
    this.app.get('/health', async (req, res) => {
      try {
        // Check Redis connection
        const redisStatus = this.redis.status;
        
        // Check service status
        const servicesHealth = {
          redis: redisStatus === 'ready' ? 'healthy' : 'unhealthy',
          chatSphere: 'healthy', // Could add more detailed health checks
          webrtc: 'healthy',
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          timestamp: new Date().toISOString()
        };

        const isHealthy = Object.values(servicesHealth).every(status => 
          status === 'healthy' || typeof status !== 'string'
        );

        res.status(isHealthy ? 200 : 503).json({
          status: isHealthy ? 'healthy' : 'unhealthy',
          services: servicesHealth
        });

      } catch (error) {
        logger.error('Health check failed:', error);
        res.status(503).json({
          status: 'unhealthy',
          error: 'Health check failed'
        });
      }
    });

    // Ready check endpoint
    this.app.get('/ready', (req, res) => {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString()
      });
    });
  }

  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);

      try {
        // Close HTTP server
        if (this.server) {
          await new Promise<void>((resolve, reject) => {
            this.server.close((error: any) => {
              if (error) reject(error);
              else resolve();
            });
          });
          logger.info('HTTP server closed');
        }

        // Close Redis connection
        if (this.redis) {
          await this.redis.quit();
          logger.info('Redis connection closed');
        }

        // Close services (if they have cleanup methods)
        logger.info('Services cleaned up');

        process.exit(0);
      } catch (error) {
        logger.error('Error during graceful shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception:', error);
      shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection:', { reason, promise });
      shutdown('unhandledRejection');
    });
  }

  public async start(): Promise<void> {
    try {
      // Validate configuration
      validateConfig(config);

      // Setup services
      await this.setupServices();

      // Setup health checks
      if (config.monitoring.enableHealthChecks) {
        this.setupHealthChecks();
      }

      // Setup graceful shutdown
      this.setupGracefulShutdown();

      // Start server
      this.server.listen(config.server.port, config.server.host, () => {
        logger.info(`🚀 ChatSphere server started successfully!`);
        logger.info(`📡 Server listening on ${config.server.host}:${config.server.port}`);
        logger.info(`🌐 Environment: ${config.server.environment}`);
        logger.info(`💬 WebSocket endpoint: ws://${config.server.host}:${config.server.port}/chatsphere`);
        
        if (config.monitoring.enableMetrics) {
          logger.info(`📊 Metrics available at http://${config.server.host}:${config.monitoring.metricsPort}/metrics`);
        }
        
        if (config.monitoring.enableHealthChecks) {
          logger.info(`❤️  Health checks at http://${config.server.host}:${config.server.port}/health`);
        }
      });

    } catch (error) {
      logger.error('Failed to start ChatSphere server:', error);
      process.exit(1);
    }
  }
}

// ===== STARTUP =====

async function main() {
  logger.info('🚀 Starting ChatSphere Server...');
  logger.info(`📊 Node.js ${process.version}`);
  logger.info(`🔧 Environment: ${config.server.environment}`);

  const server = new ChatSphereServer();
  await server.start();
}

// Start the server if this file is run directly
if (require.main === module) {
  main().catch((error) => {
    logger.error('Failed to start server:', error);
    process.exit(1);
  });
}

export default ChatSphereServer;