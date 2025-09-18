#!/usr/bin/env node

/**
 * 🚀 FanzGPT AI Assistant - Express Server
 * 
 * Main server implementation providing REST API endpoints for the FanzGPT service.
 * Integrates with the FANZ ecosystem and provides AI capabilities for adult content creators.
 * 
 * @author FANZ Engineering Team
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';

import FanzGPTService, { FanzGPTConfig } from './FanzGPTService';

// Load environment variables
dotenv.config();

// Types
interface CustomError extends Error {
  statusCode?: number;
  code?: string;
}

interface HealthCheckResponse {
  status: string;
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    database: string;
    redis: string;
    openai: string;
    anthropic: string;
  };
}

class FanzGPTServer {
  private app: Application;
  private server: any;
  private fanzGPT: FanzGPTService;
  private readonly port: number;
  private readonly version = '1.0.0';

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3100', 10);
    
    this.setupMiddleware();
    this.initializeFanzGPT();
    this.setupRoutes();
    this.setupErrorHandling();
  }

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
      crossOriginEmbedderPolicy: false,
    }));

    // CORS configuration
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3001', 'http://localhost:3000'],
      credentials: true,
      optionsSuccessStatus: 200,
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.API_RATE_LIMIT || '100', 10),
      message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes',
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api/', limiter);

    // Body parsing and compression
    this.app.use(compression());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

    // Request ID middleware
    this.app.use((req: Request, _res: Response, next: NextFunction) => {
      (req as any).id = this.generateRequestId();
      next();
    });
  }

  private initializeFanzGPT(): void {
    const config: FanzGPTConfig = {
      providers: {
        openai: {
          enabled: true,
          apiKey: process.env.OPENAI_API_KEY || '',
          organization: process.env.OPENAI_ORG,
          project: process.env.OPENAI_PROJECT,
          model: process.env.OPENAI_MODEL_PRIMARY || 'gpt-4-turbo-preview',
          priority: 1,
          rateLimit: {
            requestsPerMinute: parseInt(process.env.OPENAI_REQUESTS_PER_MINUTE || '50', 10),
            tokensPerMinute: parseInt(process.env.OPENAI_TOKENS_PER_MINUTE || '50000', 10),
            requestsPerDay: parseInt(process.env.OPENAI_REQUESTS_PER_DAY || '10000', 10),
            tokensPerDay: parseInt(process.env.OPENAI_TOKENS_PER_DAY || '1000000', 10),
          },
        },
        anthropic: {
          enabled: Boolean(process.env.ANTHROPIC_API_KEY),
          apiKey: process.env.ANTHROPIC_API_KEY || '',
          model: process.env.ANTHROPIC_MODEL_PRIMARY || 'claude-3-sonnet-20240229',
          priority: 2,
          rateLimit: {
            requestsPerMinute: parseInt(process.env.ANTHROPIC_REQUESTS_PER_MINUTE || '40', 10),
            tokensPerMinute: parseInt(process.env.ANTHROPIC_TOKENS_PER_MINUTE || '40000', 10),
            requestsPerDay: parseInt(process.env.ANTHROPIC_REQUESTS_PER_DAY || '8000', 10),
            tokensPerDay: parseInt(process.env.ANTHROPIC_TOKENS_PER_DAY || '800000', 10),
          },
        },
      },
      cache: {
        enabled: process.env.CACHE_ENABLED === 'true',
        maxSize: parseInt(process.env.CACHE_MAX_SIZE || '1000', 10),
        maxAge: parseInt(process.env.CACHE_MAX_AGE || '3600000', 10),
        redis: {
          host: process.env.REDIS_HOST || 'redis-dev',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
          password: process.env.REDIS_PASSWORD || 'dev_redis_password',
        },
      },
      moderation: {
        enabled: true,
        strictMode: process.env.CONTENT_MODERATION_STRICT === 'true',
        adultContentAllowed: process.env.ADULT_CONTENT_ALLOWED === 'true',
        customFilters: process.env.CUSTOM_CONTENT_FILTERS?.split(',') || [],
      },
      analytics: {
        enabled: process.env.ANALYTICS_ENABLED === 'true',
        trackUsage: process.env.USAGE_TRACKING === 'true',
        trackPerformance: process.env.PERFORMANCE_TRACKING === 'true',
        retentionDays: parseInt(process.env.RETENTION_DAYS || '90', 10),
      },
      features: {
        contentGeneration: process.env.FEATURE_CONTENT_GENERATION === 'true',
        chatAssistance: process.env.FEATURE_CHAT_ASSISTANCE === 'true',
        imageAnalysis: process.env.FEATURE_IMAGE_ANALYSIS === 'true',
        voiceProcessing: process.env.FEATURE_VOICE_PROCESSING === 'true',
        creatorTools: process.env.FEATURE_CREATOR_TOOLS === 'true',
      },
    };

    this.fanzGPT = new FanzGPTService(config);
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', this.handleHealthCheck.bind(this));
    this.app.get('/api/health', this.handleHealthCheck.bind(this));

    // API routes
    this.app.use('/api/v1/content', this.createContentRoutes());
    this.app.use('/api/v1/chat', this.createChatRoutes());
    this.app.use('/api/v1/media', this.createMediaRoutes());
    this.app.use('/api/v1/voice', this.createVoiceRoutes());
    this.app.use('/api/v1/creator', this.createCreatorRoutes());
    this.app.use('/api/v1/analytics', this.createAnalyticsRoutes());

    // Root endpoint
    this.app.get('/', (_req: Request, res: Response) => {
      res.json({
        name: 'FanzGPT AI Assistant',
        version: this.version,
        description: 'AI-powered content generation and assistance for adult content creators',
        endpoints: {
          health: '/health',
          api: '/api/v1',
          docs: '/api/docs',
        },
        features: [
          'Content Generation',
          'Chat Assistance',
          'Media Analysis',
          'Voice Processing',
          'Creator Tools',
          'Adult Content Compliance',
        ],
      });
    });

    // 404 handler
    this.app.use('*', (_req: Request, res: Response) => {
      res.status(404).json({
        error: 'Endpoint not found',
        message: 'The requested endpoint does not exist',
      });
    });
  }

  private createContentRoutes(): express.Router {
    const router = express.Router();

    // Generate social media posts
    router.post('/social-post', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { userId, topic, platform, options } = req.body;
        
        if (!userId || !topic || !platform) {
          return res.status(400).json({
            error: 'Missing required fields',
            required: ['userId', 'topic', 'platform'],
          });
        }

        const post = await this.fanzGPT.generateSocialPost(userId, topic, platform, options);
        
        res.json({
          success: true,
          data: { post },
          metadata: {
            userId,
            topic,
            platform,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (error) {
        next(error);
      }
    });

    // Generate personalized messages
    router.post('/personalized-message', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { userId, recipientId, context, relationship } = req.body;
        
        if (!userId || !recipientId || !context || !relationship) {
          return res.status(400).json({
            error: 'Missing required fields',
            required: ['userId', 'recipientId', 'context', 'relationship'],
          });
        }

        const message = await this.fanzGPT.generatePersonalizedMessage(
          userId,
          recipientId,
          context,
          relationship
        );
        
        res.json({
          success: true,
          data: { message },
          metadata: {
            userId,
            recipientId,
            context,
            relationship,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (error) {
        next(error);
      }
    });

    return router;
  }

  private createChatRoutes(): express.Router {
    const router = express.Router();

    // Generate chat response
    router.post('/response', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { userId, message, history, options } = req.body;
        
        if (!userId || !message) {
          return res.status(400).json({
            error: 'Missing required fields',
            required: ['userId', 'message'],
          });
        }

        const response = await this.fanzGPT.generateChatResponse(
          userId,
          message,
          history || [],
          options
        );
        
        res.json({
          success: true,
          data: { response },
          metadata: {
            userId,
            messageLength: message.length,
            historyLength: history?.length || 0,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (error) {
        next(error);
      }
    });

    // Generate conversation starters
    router.post('/starters', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { userId, context, count = 5 } = req.body;
        
        if (!userId) {
          return res.status(400).json({
            error: 'Missing required fields',
            required: ['userId'],
          });
        }

        const starters = await this.fanzGPT.generateConversationStarters(
          userId,
          context,
          count
        );
        
        res.json({
          success: true,
          data: { starters },
          metadata: {
            userId,
            context,
            count: starters.length,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (error) {
        next(error);
      }
    });

    return router;
  }

  private createMediaRoutes(): express.Router {
    const router = express.Router();

    // Analyze image
    router.post('/analyze-image', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { userId, imageUrl, analysisType } = req.body;
        
        if (!userId || !imageUrl || !analysisType) {
          return res.status(400).json({
            error: 'Missing required fields',
            required: ['userId', 'imageUrl', 'analysisType'],
          });
        }

        const analysis = await this.fanzGPT.analyzeImage(userId, imageUrl, analysisType);
        
        res.json({
          success: true,
          data: { analysis },
          metadata: {
            userId,
            imageUrl,
            analysisType,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (error) {
        next(error);
      }
    });

    return router;
  }

  private createVoiceRoutes(): express.Router {
    const router = express.Router();

    // Synthesize voice
    router.post('/synthesize', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { userId, text, voice, options } = req.body;
        
        if (!userId || !text || !voice) {
          return res.status(400).json({
            error: 'Missing required fields',
            required: ['userId', 'text', 'voice'],
          });
        }

        const result = await this.fanzGPT.synthesizeVoice(userId, text, voice, options);
        
        res.json({
          success: true,
          data: { result },
          metadata: {
            userId,
            textLength: text.length,
            voice,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (error) {
        next(error);
      }
    });

    return router;
  }

  private createCreatorRoutes(): express.Router {
    const router = express.Router();

    // Generate content calendar
    router.post('/content-calendar', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { userId, timeframe, preferences } = req.body;
        
        if (!userId || !timeframe || !preferences) {
          return res.status(400).json({
            error: 'Missing required fields',
            required: ['userId', 'timeframe', 'preferences'],
          });
        }

        const calendar = await this.fanzGPT.generateContentCalendar(
          userId,
          timeframe,
          preferences
        );
        
        res.json({
          success: true,
          data: { calendar },
          metadata: {
            userId,
            timeframe,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (error) {
        next(error);
      }
    });

    // Analyze creator performance
    router.post('/performance-analysis', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { userId, timeframe } = req.body;
        
        if (!userId || !timeframe) {
          return res.status(400).json({
            error: 'Missing required fields',
            required: ['userId', 'timeframe'],
          });
        }

        const analysis = await this.fanzGPT.analyzeCreatorPerformance(userId, timeframe);
        
        res.json({
          success: true,
          data: { analysis },
          metadata: {
            userId,
            timeframe,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (error) {
        next(error);
      }
    });

    return router;
  }

  private createAnalyticsRoutes(): express.Router {
    const router = express.Router();

    // Get usage statistics
    router.get('/usage', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { timeframe = 'LAST_30_DAYS' } = req.query;
        
        const stats = await this.fanzGPT.getUsageStats(timeframe as string);
        
        res.json({
          success: true,
          data: { stats },
          metadata: {
            timeframe,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (error) {
        next(error);
      }
    });

    return router;
  }

  private async handleHealthCheck(_req: Request, res: Response): Promise<void> {
    try {
      const health: HealthCheckResponse = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: this.version,
        uptime: process.uptime(),
        services: {
          database: 'connected',
          redis: 'connected',
          openai: process.env.OPENAI_API_KEY ? 'configured' : 'not configured',
          anthropic: process.env.ANTHROPIC_API_KEY ? 'configured' : 'not configured',
        },
      };

      res.json(health);
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        version: this.version,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private setupErrorHandling(): void {
    this.app.use((error: CustomError, req: Request, res: Response, next: NextFunction) => {
      console.error(`[${new Date().toISOString()}] Error in ${req.method} ${req.path}:`, error);

      const statusCode = error.statusCode || 500;
      const message = error.message || 'Internal server error';

      res.status(statusCode).json({
        error: message,
        requestId: (req as any).id,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
      });

      next();
    });

    // Graceful shutdown handling
    process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      this.gracefulShutdown('EXCEPTION');
    });
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      this.gracefulShutdown('REJECTION');
    });
  }

  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private gracefulShutdown(signal: string): void {
    console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

    if (this.server) {
      this.server.close(() => {
        console.log('✅ HTTP server closed');
        process.exit(0);
      });

      // Force close after timeout
      setTimeout(() => {
        console.log('⏰ Forcing shutdown due to timeout');
        process.exit(1);
      }, 10000);
    } else {
      process.exit(0);
    }
  }

  public start(): void {
    this.server = createServer(this.app);
    
    this.server.listen(this.port, () => {
      console.log(`
🤖 FanzGPT AI Assistant Server Started
======================================
Port: ${this.port}
Environment: ${process.env.NODE_ENV}
Version: ${this.version}

🔗 Endpoints:
  Health: http://localhost:${this.port}/health
  API: http://localhost:${this.port}/api/v1
  
🌟 Features:
  ✅ Content Generation
  ✅ Chat Assistance  
  ✅ Media Analysis
  ✅ Voice Processing
  ✅ Creator Tools
  ✅ Adult Content Compliance
  
🚀 Ready to assist creators!
      `);
    });

    this.server.on('error', (error: CustomError) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${this.port} is already in use`);
      } else {
        console.error('❌ Server error:', error);
      }
      process.exit(1);
    });
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const server = new FanzGPTServer();
  server.start();
}

export default FanzGPTServer;