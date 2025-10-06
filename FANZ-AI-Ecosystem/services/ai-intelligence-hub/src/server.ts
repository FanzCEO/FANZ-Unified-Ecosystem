import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { AnalyticsEngine } from './core/AnalyticsEngine';
import { ModerationEngine } from './core/ModerationEngine';
import { Logger } from '../../../shared/utils/Logger';

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"]
  }
});

const logger = new Logger('AI-Intelligence-Hub');
const analyticsEngine = new AnalyticsEngine();
const moderationEngine = new ModerationEngine();

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
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      analytics: 'operational',
      moderation: 'operational'
    }
  });
});

// Analytics Routes
app.post('/api/analytics/content/:contentId', async (req, res) => {
  try {
    const { contentId } = req.params;
    const content = req.body;
    
    const analysis = await analyticsEngine.analyzeContent(contentId, content);
    res.json(analysis);
  } catch (error) {
    logger.error('Content analysis failed', { error, contentId: req.params.contentId });
    res.status(500).json({ error: 'Content analysis failed' });
  }
});

app.get('/api/analytics/predictions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { timeframe = 'week' } = req.query;
    
    const predictions = await analyticsEngine.generatePredictiveAnalytics(
      userId, 
      timeframe as 'day' | 'week' | 'month' | 'quarter'
    );
    res.json(predictions);
  } catch (error) {
    logger.error('Prediction generation failed', { error, userId: req.params.userId });
    res.status(500).json({ error: 'Prediction generation failed' });
  }
});

app.get('/api/analytics/patterns/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const patterns = await analyticsEngine.detectUserBehaviorPatterns(userId);
    res.json(patterns);
  } catch (error) {
    logger.error('Pattern detection failed', { error, userId: req.params.userId });
    res.status(500).json({ error: 'Pattern detection failed' });
  }
});

app.get('/api/analytics/model-performance', async (req, res) => {
  try {
    const performance = await analyticsEngine.getModelPerformance();
    res.json(performance);
  } catch (error) {
    logger.error('Model performance retrieval failed', { error });
    res.status(500).json({ error: 'Model performance retrieval failed' });
  }
});

// Moderation Routes
app.post('/api/moderation/content/:contentId', async (req, res) => {
  try {
    const { contentId } = req.params;
    const { content, userId } = req.body;
    
    const result = await moderationEngine.moderateContent(contentId, content, userId);
    res.json(result);
  } catch (error) {
    logger.error('Content moderation failed', { error, contentId: req.params.contentId });
    res.status(500).json({ error: 'Content moderation failed' });
  }
});

app.post('/api/moderation/batch', async (req, res) => {
  try {
    const { contents } = req.body;
    
    if (!Array.isArray(contents)) {
      return res.status(400).json({ error: 'Contents must be an array' });
    }
    
    const results = await moderationEngine.batchModerateContent(contents);
    res.json(results);
  } catch (error) {
    logger.error('Batch moderation failed', { error });
    res.status(500).json({ error: 'Batch moderation failed' });
  }
});

app.get('/api/moderation/stats', (req, res) => {
  try {
    const stats = moderationEngine.getModerationStats();
    res.json(stats);
  } catch (error) {
    logger.error('Moderation stats retrieval failed', { error });
    res.status(500).json({ error: 'Moderation stats retrieval failed' });
  }
});

app.post('/api/moderation/rules', async (req, res) => {
  try {
    const rule = req.body;
    await moderationEngine.addModerationRule(rule);
    res.json({ message: 'Rule added successfully' });
  } catch (error) {
    logger.error('Rule addition failed', { error });
    res.status(500).json({ error: 'Rule addition failed' });
  }
});

app.put('/api/moderation/rules/:ruleId', async (req, res) => {
  try {
    const { ruleId } = req.params;
    const updates = req.body;
    
    await moderationEngine.updateModerationRule(ruleId, updates);
    res.json({ message: 'Rule updated successfully' });
  } catch (error) {
    logger.error('Rule update failed', { error, ruleId: req.params.ruleId });
    res.status(500).json({ error: 'Rule update failed' });
  }
});

app.delete('/api/moderation/rules/:ruleId', async (req, res) => {
  try {
    const { ruleId } = req.params;
    await moderationEngine.removeModerationRule(ruleId);
    res.json({ message: 'Rule removed successfully' });
  } catch (error) {
    logger.error('Rule removal failed', { error, ruleId: req.params.ruleId });
    res.status(500).json({ error: 'Rule removal failed' });
  }
});

// WebSocket connections for real-time updates
io.on('connection', (socket) => {
  logger.info('Client connected', { socketId: socket.id });

  // Join analytics room for real-time updates
  socket.on('join-analytics', (userId: string) => {
    socket.join(`analytics-${userId}`);
    logger.info('Client joined analytics room', { socketId: socket.id, userId });
  });

  // Join moderation room for real-time updates
  socket.on('join-moderation', (userId: string) => {
    socket.join(`moderation-${userId}`);
    logger.info('Client joined moderation room', { socketId: socket.id, userId });
  });

  socket.on('disconnect', () => {
    logger.info('Client disconnected', { socketId: socket.id });
  });
});

// Real-time event handlers
analyticsEngine.on('content-analyzed', (analysis) => {
  io.to(`analytics-${analysis.contentId}`).emit('analysis-complete', analysis);
});

analyticsEngine.on('analytics-generated', (analytics) => {
  io.to(`analytics-${analytics.userId}`).emit('predictions-updated', analytics);
});

analyticsEngine.on('patterns-detected', (patterns) => {
  patterns.forEach(pattern => {
    io.to(`analytics-${pattern.userId}`).emit('pattern-detected', pattern);
  });
});

moderationEngine.on('content-moderated', (result) => {
  io.to(`moderation-${result.userId}`).emit('moderation-complete', result);
});

moderationEngine.on('action-executed', (action) => {
  io.to(`moderation-${action.userId}`).emit('action-executed', action);
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', { 
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
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  logger.info(`AI Intelligence Hub running on port ${PORT}`);
  logger.info('Services initialized:', {
    analytics: 'ready',
    moderation: 'ready',
    websocket: 'ready'
  });
});

export { app, server, io };