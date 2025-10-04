/**
 * FANZ Content Distribution Network Server
 * 
 * Revolutionary multi-platform content distribution system with:
 * - Intelligent content syndication
 * - Real-time optimization and CDN deployment
 * - Advanced analytics and monitoring
 * - Live streaming support
 * - Global edge computing
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { DistributionEngine } from './core/DistributionEngine';
import { 
  CDNConfiguration, 
  ContentMetadata, 
  DistributionTarget,
  LiveStreamConfig,
  SyndicationRule,
  FanzPlatform
} from './types';
import { Logger } from './utils/Logger';

// Initialize logger
const logger = new Logger('CDN-Server');

// CDN Configuration
const cdnConfig: CDNConfiguration = {
  enableGlobalDistribution: true,
  enableAdaptiveStreaming: true,
  enableEdgeComputing: true,
  enableRealTimeOptimization: true,
  maxFileSize: 5000, // 5GB in MB
  supportedFormats: ['mp4', 'webm', 'mov', 'avi', 'jpg', 'png', 'webp', 'gif', 'mp3', 'aac', 'wav'],
  qualityPresets: {
    '4k': { width: 3840, height: 2160, bitrate: 8000, fps: 30 },
    '1080p': { width: 1920, height: 1080, bitrate: 4000, fps: 30 },
    '720p': { width: 1280, height: 720, bitrate: 2000, fps: 30 },
    '480p': { width: 854, height: 480, bitrate: 1000, fps: 30 },
    '360p': { width: 640, height: 360, bitrate: 500, fps: 30 }
  },
  cachingRules: {
    static: 86400, // 24 hours
    dynamic: 3600,  // 1 hour
    streaming: 0    // No cache for live streams
  },
  securityRules: {
    enableHotlinkProtection: true,
    enableTokenAuthentication: true,
    enableGeoBlocking: false,
    allowedDomains: ['*.fanz.network', '*.boyfanz.com', '*.girlfanz.com', '*.pupfanz.com'],
    blockedCountries: []
  }
};

// Initialize Distribution Engine
const distributionEngine = new DistributionEngine(cdnConfig);

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const childLogger = logger.child({ 
    requestId: `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
    method: req.method,
    path: req.path,
    userAgent: req.get('User-Agent')
  });
  
  (req as any).logger = childLogger;
  childLogger.info(`${req.method} ${req.path}`);
  
  next();
});

// Error handling middleware
const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  const reqLogger = (req as any).logger || logger;
  reqLogger.error('Request failed', error);
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
};

// API Routes

/**
 * Health check endpoint
 */
app.get('/health', (req: Request, res: Response) => {
  const health = distributionEngine.getHealthStatus();
  const status = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 206 : 503;
  
  res.status(status).json({
    success: true,
    data: health,
    timestamp: new Date().toISOString()
  });
});

/**
 * System status and metrics
 */
app.get('/api/status', (req: Request, res: Response) => {
  const health = distributionEngine.getHealthStatus();
  const edgeLocations = distributionEngine.getEdgeLocations();
  const activeJobs = distributionEngine.getActiveJobs();
  
  res.json({
    success: true,
    data: {
      health,
      edgeLocations: edgeLocations.length,
      activeJobs: activeJobs.length,
      configuration: {
        globalDistribution: cdnConfig.enableGlobalDistribution,
        adaptiveStreaming: cdnConfig.enableAdaptiveStreaming,
        maxFileSize: cdnConfig.maxFileSize,
        supportedFormats: cdnConfig.supportedFormats.length
      }
    }
  });
});

/**
 * Distribute content to multiple platforms
 */
app.post('/api/distribute', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content, targets }: { content: ContentMetadata; targets: DistributionTarget[] } = req.body;
    const reqLogger = (req as any).logger;
    
    reqLogger.info(`Starting distribution for content ${content.id} to ${targets.length} platforms`);
    
    // Validate input
    if (!content || !content.id || !targets || targets.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'Content metadata and targets are required'
      });
    }
    
    // Start distribution
    const job = await distributionEngine.distributeContent(content, targets);
    
    reqLogger.info(`Distribution job ${job.id} created successfully`);
    
    res.status(201).json({
      success: true,
      data: job
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * Get distribution job status
 */
app.get('/api/jobs/:jobId', (req: Request, res: Response) => {
  const { jobId } = req.params;
  const job = distributionEngine.getJobStatus(jobId);
  
  if (!job) {
    return res.status(404).json({
      success: false,
      error: 'Job not found',
      message: `Distribution job ${jobId} not found`
    });
  }
  
  res.json({
    success: true,
    data: job
  });
});

/**
 * Get all active distribution jobs
 */
app.get('/api/jobs', (req: Request, res: Response) => {
  const jobs = distributionEngine.getActiveJobs();
  
  res.json({
    success: true,
    data: jobs,
    count: jobs.length
  });
});

/**
 * Create syndication rule
 */
app.post('/api/syndication/rules', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ruleData: Omit<SyndicationRule, 'id' | 'createdAt'> = req.body;
    const reqLogger = (req as any).logger;
    
    reqLogger.info(`Creating syndication rule for creator ${ruleData.creator}`);
    
    const rule = await distributionEngine.createSyndicationRule(ruleData);
    
    res.status(201).json({
      success: true,
      data: rule
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * Get syndication rules for creator
 */
app.get('/api/syndication/rules/:creatorId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { creatorId } = req.params;
    const rules = await distributionEngine.getSyndicationRules(creatorId);
    
    res.json({
      success: true,
      data: rules,
      count: rules.length
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * Start live stream
 */
app.post('/api/streams/start', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const streamConfig: LiveStreamConfig = req.body;
    const reqLogger = (req as any).logger;
    
    reqLogger.info(`Starting live stream ${streamConfig.id} for creator ${streamConfig.creator}`);
    
    const stream = await distributionEngine.startLiveStream(streamConfig);
    
    res.status(201).json({
      success: true,
      data: stream
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * Stop live stream
 */
app.post('/api/streams/:streamId/stop', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { streamId } = req.params;
    const reqLogger = (req as any).logger;
    
    reqLogger.info(`Stopping live stream ${streamId}`);
    
    await distributionEngine.stopLiveStream(streamId);
    
    res.json({
      success: true,
      message: `Live stream ${streamId} stopped successfully`
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * Get content analytics
 */
app.get('/api/analytics/content/:contentId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { contentId } = req.params;
    const analytics = await distributionEngine.getContentAnalytics(contentId);
    
    res.json({
      success: true,
      data: analytics,
      count: analytics.length
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * Get platform analytics
 */
app.get('/api/analytics/platform/:platform', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { platform } = req.params as { platform: FanzPlatform };
    const analytics = await distributionEngine.getPlatformMetrics(platform);
    
    res.json({
      success: true,
      data: analytics,
      count: analytics.length
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * Get edge locations
 */
app.get('/api/edge-locations', (req: Request, res: Response) => {
  const { lat, lng } = req.query;
  const locations = distributionEngine.getEdgeLocations();
  
  // If coordinates provided, find optimal location
  if (lat && lng) {
    const userLocation = { 
      lat: parseFloat(lat as string), 
      lng: parseFloat(lng as string) 
    };
    const optimal = distributionEngine.getOptimalEdgeLocation(userLocation);
    
    return res.json({
      success: true,
      data: {
        all: locations,
        optimal,
        userLocation
      }
    });
  }
  
  res.json({
    success: true,
    data: locations,
    count: locations.length
  });
});

/**
 * Update CDN configuration
 */
app.put('/api/config', (req: Request, res: Response) => {
  const configUpdate: Partial<CDNConfiguration> = req.body;
  const reqLogger = (req as any).logger;
  
  reqLogger.info('Updating CDN configuration', configUpdate);
  
  distributionEngine.updateConfiguration(configUpdate);
  
  res.json({
    success: true,
    message: 'CDN configuration updated successfully'
  });
});

/**
 * Get CDN configuration
 */
app.get('/api/config', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: cdnConfig
  });
});

// Apply error handler
app.use(errorHandler);

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Event handlers for Distribution Engine
distributionEngine.on('jobCreated', (job) => {
  logger.info(`Distribution job created: ${job.id}`, { jobId: job.id, targets: job.targets.length });
});

distributionEngine.on('jobCompleted', (job) => {
  logger.info(`Distribution job completed: ${job.id}`, { 
    jobId: job.id, 
    duration: job.completedAt && job.startedAt ? 
      job.completedAt.getTime() - job.startedAt.getTime() : 0 
  });
});

distributionEngine.on('jobFailed', (job) => {
  logger.error(`Distribution job failed: ${job.id}`, undefined, { 
    jobId: job.id, 
    errors: job.errors 
  });
});

distributionEngine.on('liveStreamStarted', (stream) => {
  logger.info(`Live stream started: ${stream.id}`, { 
    streamId: stream.id, 
    creator: stream.creator,
    platform: stream.platform 
  });
});

distributionEngine.on('liveStreamEnded', (stream) => {
  logger.info(`Live stream ended: ${stream.id}`, { 
    streamId: stream.id, 
    creator: stream.creator 
  });
});

// Start server
const server = app.listen(PORT, () => {
  logger.info(`🚀 FANZ Content Distribution Network started on port ${PORT}`);
  logger.info(`🌐 Global CDN with ${distributionEngine.getEdgeLocations().length} edge locations`);
  logger.info(`📊 Health check: http://localhost:${PORT}/health`);
  logger.info(`📚 API docs: http://localhost:${PORT}/api/status`);
});

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export { app, server };