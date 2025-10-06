import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { CurationEngine } from './core/CurationEngine';
import { Logger } from '../../../shared/utils/Logger';

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"]
  }
});

const logger = new Logger('Content-Curation-Engine');
const curationEngine = new CurationEngine();

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
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
  const stats = curationEngine.getStats();
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      curation: 'operational',
      algorithms: 'active'
    },
    stats
  });
});

// Content Curation
app.post('/api/curation/curate/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { preferences, limit = 20, options = {} } = req.body;
    
    if (!preferences) {
      return res.status(400).json({ error: 'User preferences are required' });
    }
    
    logger.time(`Content curation for ${userId}`);
    const result = await curationEngine.curateContent(userId, preferences, limit, options);
    logger.timeEnd(`Content curation for ${userId}`);
    
    res.json(result);
  } catch (error) {
    logger.error('Content curation failed', { 
      error: error instanceof Error ? error.message : error,
      userId: req.params.userId 
    });
    res.status(500).json({ error: 'Content curation failed' });
  }
});

// Trending Discovery
app.get('/api/curation/trending', async (req, res) => {
  try {
    const { category, timeRange = 'day', limit = 50 } = req.query;
    
    logger.time('Trending discovery');
    const trending = await curationEngine.discoverTrending(
      category as string,
      timeRange as 'hour' | 'day' | 'week',
      parseInt(limit as string) || 50
    );
    logger.timeEnd('Trending discovery');
    
    res.json(trending);
  } catch (error) {
    logger.error('Trending discovery failed', { error });
    res.status(500).json({ error: 'Trending discovery failed' });
  }
});

// Content Quality Analysis
app.post('/api/curation/analyze-quality', async (req, res) => {
  try {
    const content = req.body;
    
    if (!content || !content.id) {
      return res.status(400).json({ error: 'Content object with id is required' });
    }
    
    logger.time(`Quality analysis for ${content.id}`);
    const metrics = await curationEngine.analyzeContentQuality(content);
    logger.timeEnd(`Quality analysis for ${content.id}`);
    
    res.json(metrics);
  } catch (error) {
    logger.error('Quality analysis failed', { error });
    res.status(500).json({ error: 'Quality analysis failed' });
  }
});

// Personalization
app.post('/api/curation/personalize/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { content, context } = req.body;
    
    if (!Array.isArray(content)) {
      return res.status(400).json({ error: 'Content array is required' });
    }
    
    logger.time(`Personalization for ${userId}`);
    const personalized = await curationEngine.personalizeForUser(userId, content, context);
    logger.timeEnd(`Personalization for ${userId}`);
    
    res.json(personalized);
  } catch (error) {
    logger.error('Personalization failed', { 
      error: error instanceof Error ? error.message : error,
      userId: req.params.userId 
    });
    res.status(500).json({ error: 'Personalization failed' });
  }
});

// User Preference Updates
app.post('/api/curation/preferences/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { interactions } = req.body;
    
    if (!Array.isArray(interactions)) {
      return res.status(400).json({ error: 'Interactions array is required' });
    }
    
    await curationEngine.updateUserPreferences(userId, interactions);
    res.json({ message: 'Preferences updated successfully' });
  } catch (error) {
    logger.error('Preference update failed', { 
      error: error instanceof Error ? error.message : error,
      userId: req.params.userId 
    });
    res.status(500).json({ error: 'Preference update failed' });
  }
});

// Recommendation Explanation
app.get('/api/curation/explain/:userId/:contentId', async (req, res) => {
  try {
    const { userId, contentId } = req.params;
    
    const explanation = await curationEngine.getRecommendationExplanation(userId, contentId);
    res.json(explanation);
  } catch (error) {
    logger.error('Explanation generation failed', { 
      error: error instanceof Error ? error.message : error,
      userId: req.params.userId,
      contentId: req.params.contentId
    });
    res.status(500).json({ error: 'Explanation generation failed' });
  }
});

// Batch Quality Analysis
app.post('/api/curation/batch-analyze', async (req, res) => {
  try {
    const { contents } = req.body;
    
    if (!Array.isArray(contents)) {
      return res.status(400).json({ error: 'Contents array is required' });
    }
    
    if (contents.length > 50) {
      return res.status(400).json({ error: 'Maximum 50 contents per batch request' });
    }
    
    logger.time('Batch quality analysis');
    const results = await Promise.allSettled(
      contents.map((content: any) => curationEngine.analyzeContentQuality(content))
    );
    logger.timeEnd('Batch quality analysis');
    
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
    logger.error('Batch analysis failed', { error });
    res.status(500).json({ error: 'Batch analysis failed' });
  }
});

// Algorithm Performance
app.get('/api/curation/algorithms/performance', async (req, res) => {
  try {
    // Mock algorithm performance data
    const performance = {
      collaborative: { accuracy: 0.85, responseTime: 45, lastUpdated: new Date() },
      'content-based': { accuracy: 0.82, responseTime: 32, lastUpdated: new Date() },
      trending: { accuracy: 0.78, responseTime: 28, lastUpdated: new Date() },
      'ai-enhanced': { accuracy: 0.91, responseTime: 67, lastUpdated: new Date() }
    };
    
    res.json(performance);
  } catch (error) {
    logger.error('Algorithm performance retrieval failed', { error });
    res.status(500).json({ error: 'Algorithm performance retrieval failed' });
  }
});

// System Statistics
app.get('/api/curation/stats', (req, res) => {
  try {
    const stats = curationEngine.getStats();
    const extended = {
      ...stats,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      timestamp: new Date()
    };
    
    res.json(extended);
  } catch (error) {
    logger.error('Stats retrieval failed', { error });
    res.status(500).json({ error: 'Stats retrieval failed' });
  }
});

// WebSocket connections for real-time curation updates
io.on('connection', (socket) => {
  logger.info('Client connected to Curation Engine', { socketId: socket.id });

  socket.on('join-curation', (userId: string) => {
    socket.join(`curation-${userId}`);
    logger.info('Client joined curation room', { socketId: socket.id, userId });
  });

  socket.on('request-curation', async (data: { userId: string; preferences: any; limit?: number; options?: any }) => {
    try {
      const result = await curationEngine.curateContent(
        data.userId,
        data.preferences,
        data.limit || 20,
        data.options || {}
      );
      socket.emit('curation-ready', result);
    } catch (error) {
      socket.emit('curation-error', { error: 'Failed to curate content' });
    }
  });

  socket.on('request-trending', async (data: { category?: string; timeRange?: 'hour' | 'day' | 'week'; limit?: number }) => {
    try {
      const trending = await curationEngine.discoverTrending(
        data.category,
        data.timeRange || 'day',
        data.limit || 50
      );
      socket.emit('trending-ready', trending);
    } catch (error) {
      socket.emit('trending-error', { error: 'Failed to discover trending content' });
    }
  });

  socket.on('update-preferences', async (data: { userId: string; interactions: any[] }) => {
    try {
      await curationEngine.updateUserPreferences(data.userId, data.interactions);
      socket.emit('preferences-updated', { success: true });
    } catch (error) {
      socket.emit('preferences-error', { error: 'Failed to update preferences' });
    }
  });

  socket.on('disconnect', () => {
    logger.info('Client disconnected from Curation Engine', { socketId: socket.id });
  });
});

// Real-time event handlers
curationEngine.on('content-curated', (result) => {
  io.to(`curation-${result.userId}`).emit('live-curation', result);
});

curationEngine.on('trending-discovered', (data) => {
  io.emit('live-trending-update', data);
});

curationEngine.on('trending-updated', (data) => {
  io.emit('trending-refresh', data);
});

curationEngine.on('quality-analyzed', (metrics) => {
  io.emit('quality-analysis-complete', metrics);
});

curationEngine.on('content-personalized', (data) => {
  io.to(`curation-${data.userId}`).emit('personalization-update', data);
});

curationEngine.on('preferences-updated', (data) => {
  io.to(`curation-${data.userId}`).emit('preferences-synced', data);
});

curationEngine.on('algorithms-initialized', (algorithms) => {
  logger.info('Curation algorithms initialized', { count: algorithms.length });
  io.emit('algorithms-ready', algorithms);
});

curationEngine.on('curation-error', (error) => {
  logger.error('Curation engine error', error);
  if (error.userId) {
    io.to(`curation-${error.userId}`).emit('curation-error', error);
  }
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error in Curation Engine', { 
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
  logger.info('SIGTERM received, shutting down Curation Engine gracefully');
  server.close(() => {
    logger.info('Curation Engine process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down Curation Engine gracefully');
  server.close(() => {
    logger.info('Curation Engine process terminated');
    process.exit(0);
  });
});

const PORT = process.env.PORT || 3003;

server.listen(PORT, () => {
  logger.info(`Content Curation Engine running on port ${PORT}`);
  logger.info('Curation Engine services initialized:', {
    curation_algorithms: 'ready',
    trending_analysis: 'active',
    personalization: 'enabled',
    quality_analysis: 'operational',
    websocket: 'ready',
    real_time_features: 'enabled'
  });
});

export { app, server, io };