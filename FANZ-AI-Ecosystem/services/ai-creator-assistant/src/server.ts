import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { AssistantEngine } from './core/AssistantEngine';
import { Logger } from '../../../shared/utils/Logger';

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"]
  }
});

const logger = new Logger('AI-Creator-Assistant');
const assistantEngine = new AssistantEngine();

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 500 requests per windowMs for AI endpoints
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      assistant: 'operational',
      ai_models: 'ready'
    }
  });
});

// Content Suggestions
app.post('/api/assistant/suggestions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { preferences, context } = req.body;
    
    logger.time(`Content suggestions for ${userId}`);
    const suggestions = await assistantEngine.generateContentSuggestions(userId, preferences, context);
    logger.timeEnd(`Content suggestions for ${userId}`);
    
    res.json(suggestions);
  } catch (error) {
    logger.error('Content suggestion generation failed', { 
      error: error instanceof Error ? error.message : error,
      userId: req.params.userId 
    });
    res.status(500).json({ error: 'Content suggestion generation failed' });
  }
});

// Revenue Optimization
app.post('/api/assistant/optimize-revenue/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { currentMetrics, goals } = req.body;
    
    if (!currentMetrics) {
      return res.status(400).json({ error: 'Current metrics are required' });
    }
    
    logger.time(`Revenue optimization for ${userId}`);
    const optimization = await assistantEngine.optimizeRevenue(userId, currentMetrics, goals);
    logger.timeEnd(`Revenue optimization for ${userId}`);
    
    res.json(optimization);
  } catch (error) {
    logger.error('Revenue optimization failed', { 
      error: error instanceof Error ? error.message : error,
      userId: req.params.userId 
    });
    res.status(500).json({ error: 'Revenue optimization failed' });
  }
});

// Audience Analysis
app.post('/api/assistant/analyze-audience/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { audienceData } = req.body;
    
    if (!audienceData) {
      return res.status(400).json({ error: 'Audience data is required' });
    }
    
    logger.time(`Audience analysis for ${userId}`);
    const insight = await assistantEngine.analyzeAudience(userId, audienceData);
    logger.timeEnd(`Audience analysis for ${userId}`);
    
    res.json(insight);
  } catch (error) {
    logger.error('Audience analysis failed', { 
      error: error instanceof Error ? error.message : error,
      userId: req.params.userId 
    });
    res.status(500).json({ error: 'Audience analysis failed' });
  }
});

// Creative Tools
app.post('/api/assistant/creative-tools/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { contentType, requirements } = req.body;
    
    if (!contentType) {
      return res.status(400).json({ error: 'Content type is required' });
    }
    
    if (!['video', 'image', 'text'].includes(contentType)) {
      return res.status(400).json({ error: 'Invalid content type. Must be video, image, or text' });
    }
    
    logger.time(`Creative tools for ${userId}`);
    const tools = await assistantEngine.generateCreativeTools(userId, contentType, requirements || {});
    logger.timeEnd(`Creative tools for ${userId}`);
    
    res.json(tools);
  } catch (error) {
    logger.error('Creative tools generation failed', { 
      error: error instanceof Error ? error.message : error,
      userId: req.params.userId 
    });
    res.status(500).json({ error: 'Creative tools generation failed' });
  }
});

// Performance Tracking
app.post('/api/assistant/track-performance/:userId/:contentId', async (req, res) => {
  try {
    const { userId, contentId } = req.params;
    const metrics = req.body;
    
    if (!metrics) {
      return res.status(400).json({ error: 'Performance metrics are required' });
    }
    
    const performance = await assistantEngine.trackPerformance(userId, contentId, metrics);
    res.json(performance);
  } catch (error) {
    logger.error('Performance tracking failed', { 
      error: error instanceof Error ? error.message : error,
      userId: req.params.userId,
      contentId: req.params.contentId
    });
    res.status(500).json({ error: 'Performance tracking failed' });
  }
});

// Batch Content Analysis
app.post('/api/assistant/batch-analyze/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { contents } = req.body;
    
    if (!Array.isArray(contents)) {
      return res.status(400).json({ error: 'Contents must be an array' });
    }
    
    if (contents.length > 10) {
      return res.status(400).json({ error: 'Maximum 10 contents per batch request' });
    }
    
    logger.time(`Batch analysis for ${userId}`);
    const results = await Promise.allSettled(
      contents.map((content: any) => 
        assistantEngine.generateContentSuggestions(userId, content.preferences, content.context)
      )
    );
    logger.timeEnd(`Batch analysis for ${userId}`);
    
    const successful = results
      .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
      .map(result => result.value);
    
    const failed = results.filter(result => result.status === 'rejected').length;
    
    res.json({
      successful,
      totalProcessed: contents.length,
      successCount: successful.length,
      failureCount: failed
    });
  } catch (error) {
    logger.error('Batch analysis failed', { 
      error: error instanceof Error ? error.message : error,
      userId: req.params.userId 
    });
    res.status(500).json({ error: 'Batch analysis failed' });
  }
});

// AI Model Status
app.get('/api/assistant/models/status', async (req, res) => {
  try {
    // This would return real model status in production
    const modelStatus = {
      'content-generator': { status: 'active', accuracy: 0.92, lastTrained: new Date() },
      'revenue-optimizer': { status: 'active', accuracy: 0.88, lastTrained: new Date() },
      'audience-analyzer': { status: 'active', accuracy: 0.85, lastTrained: new Date() },
      'trend-predictor': { status: 'active', accuracy: 0.89, lastTrained: new Date() },
      'creative-enhancer': { status: 'active', accuracy: 0.91, lastTrained: new Date() }
    };
    
    res.json(modelStatus);
  } catch (error) {
    logger.error('Model status retrieval failed', { error });
    res.status(500).json({ error: 'Model status retrieval failed' });
  }
});

// WebSocket connections for real-time updates
io.on('connection', (socket) => {
  logger.info('Client connected to AI Assistant', { socketId: socket.id });

  socket.on('join-assistant', (userId: string) => {
    socket.join(`assistant-${userId}`);
    logger.info('Client joined assistant room', { socketId: socket.id, userId });
  });

  socket.on('request-suggestions', async (data: { userId: string; preferences: any; context?: any }) => {
    try {
      const suggestions = await assistantEngine.generateContentSuggestions(
        data.userId,
        data.preferences,
        data.context
      );
      socket.emit('suggestions-ready', suggestions);
    } catch (error) {
      socket.emit('suggestions-error', { error: 'Failed to generate suggestions' });
    }
  });

  socket.on('request-revenue-optimization', async (data: { userId: string; metrics: any; goals?: any }) => {
    try {
      const optimization = await assistantEngine.optimizeRevenue(
        data.userId,
        data.metrics,
        data.goals
      );
      socket.emit('optimization-ready', optimization);
    } catch (error) {
      socket.emit('optimization-error', { error: 'Failed to optimize revenue' });
    }
  });

  socket.on('disconnect', () => {
    logger.info('Client disconnected from AI Assistant', { socketId: socket.id });
  });
});

// Real-time event handlers
assistantEngine.on('suggestions-generated', (data) => {
  io.to(`assistant-${data.userId}`).emit('live-suggestions', data.suggestions);
});

assistantEngine.on('revenue-optimization', (optimization) => {
  io.to(`assistant-${optimization.userId}`).emit('live-optimization', optimization);
});

assistantEngine.on('audience-analyzed', (insight) => {
  io.to(`assistant-${insight.userId}`).emit('live-audience-insight', insight);
});

assistantEngine.on('creative-tools-generated', (tools) => {
  io.to(`assistant-${tools.userId}`).emit('live-creative-tools', tools);
});

assistantEngine.on('performance-tracked', (performance) => {
  io.to(`assistant-${performance.userId}`).emit('live-performance-update', performance);
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error in AI Assistant', { 
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down AI Assistant gracefully');
  server.close(() => {
    logger.info('AI Assistant process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down AI Assistant gracefully');
  server.close(() => {
    logger.info('AI Assistant process terminated');
    process.exit(0);
  });
});

const PORT = process.env.PORT || 3002;

server.listen(PORT, () => {
  logger.info(`AI Creator Assistant running on port ${PORT}`);
  logger.info('AI Assistant services initialized:', {
    assistant_engine: 'ready',
    ai_models: 'loaded',
    websocket: 'ready',
    real_time_features: 'enabled'
  });
});

export { app, server, io };