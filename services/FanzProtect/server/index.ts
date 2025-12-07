import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

import { db } from './db/connection.js';
import { setupRoutes } from './routes/index.js';
import { setupWebSocket } from './websocket/index.js';
import { setupMiddleware } from './middleware/index.js';
import { validateEnvironment } from './utils/env-validation.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFoundHandler } from './middleware/not-found.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Validate environment variables on startup
validateEnvironment();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// =============================================
// SECURITY & MIDDLEWARE SETUP
// =============================================

// Security headers
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration for FANZ ecosystem
app.use(cors({
  origin: [
    'http://localhost:5173', // Vite dev server
    'https://protect.myfanz.network',
    'https://dash.myfanz.network', // FanzDash integration
    'https://sso.myfanz.network', // FanzSSO
    'https://myfanz.network', // Main ecosystem
    ...(process.env.CORS_ORIGINS?.split(',') || [])
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Case-ID', 'X-Evidence-Hash']
}));

// Rate limiting - stricter for legal operations
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const legalOperationsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit legal operations to prevent abuse
  message: 'Too many legal operations from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit auth attempts
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth', authLimiter);
app.use('/api/cases', legalOperationsLimiter);
app.use('/api/dmca', legalOperationsLimiter);
app.use('/api/templates/render', legalOperationsLimiter);
app.use(generalLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' })); // Larger limit for evidence uploads
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request ID and logging
app.use((req, res, next) => {
  req.id = crypto.randomUUID();
  req.startTime = Date.now();
  
  // Log all requests
  logger.info('HTTP Request', {
    id: req.id,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });
  
  next();
});

// Custom middleware setup
setupMiddleware(app);

// =============================================
// WEBSOCKET SETUP
// =============================================

const wss = new WebSocketServer({ 
  server,
  path: '/ws',
  clientTracking: true
});

setupWebSocket(wss);

logger.info('WebSocket server initialized', {
  path: '/ws',
  clientTracking: true
});

// =============================================
// API ROUTES SETUP
// =============================================

// Health check endpoint (before auth)
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    await db.execute('SELECT 1');
    
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: NODE_ENV,
      uptime: process.uptime(),
      services: {
        database: 'healthy',
        websocket: wss.clients.size > 0 ? 'active' : 'idle',
        redis: 'healthy', // TODO: Add Redis health check
      },
      ecosystem: {
        fanzSSO: process.env.FANZSSO_API_URL ? 'configured' : 'not configured',
        fanzFinance: process.env.FANZFINANCE_API_URL ? 'configured' : 'not configured',
        fanzMedia: process.env.FANZMEDIA_API_URL ? 'configured' : 'not configured',
        fanzDash: process.env.FANZDASH_API_URL ? 'configured' : 'not configured',
      }
    };

    res.json(healthData);
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed'
    });
  }
});

// System info endpoint
app.get('/api/system', (req, res) => {
  res.json({
    service: 'FanzProtect Legal Platform',
    version: process.env.npm_package_version || '1.0.0',
    environment: NODE_ENV,
    platform: 'protect.myfanz.network',
    tier: 'Specialized Legal Protection',
    ecosystem: 'FANZ Unified Network',
    features: [
      'DMCA Takedown Engine',
      'Legal Case Management', 
      'Evidence Chain-of-Custody',
      'Document Template System',
      'Real-time Notifications',
      'Legal Counsel Integration'
    ],
    integrations: [
      'FanzSSO Authentication',
      'FanzFinance OS Billing',
      'FanzMediaCore Evidence Storage',
      'FanzDash Admin Dashboard',
      'FanzSecurityCompDash Compliance'
    ],
    compliance: [
      'Adult Content Industry Standards',
      'DMCA Safe Harbor Provisions',
      'GDPR Data Protection',
      'CCPA Privacy Rights',
      'Multi-jurisdictional Legal Framework'
    ]
  });
});

// Setup API routes
setupRoutes(app);

// =============================================
// STATIC FILE SERVING (PRODUCTION)
// =============================================

if (NODE_ENV === 'production') {
  // Serve static files from the dist directory
  app.use(express.static(path.join(__dirname, '../dist/public')));
  
  // Handle client-side routing - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/ws')) {
      res.sendFile(path.join(__dirname, '../dist/public/index.html'));
    } else {
      next();
    }
  });
}

// =============================================
// ERROR HANDLING
// =============================================

// 404 handler for API routes
app.use('/api/*', notFoundHandler);

// Global error handler
app.use(errorHandler);

// =============================================
// GRACEFUL SHUTDOWN
// =============================================

const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  server.close(() => {
    logger.info('HTTP server closed');
    
    // Close WebSocket connections
    wss.clients.forEach((ws) => {
      ws.close(1001, 'Server shutting down');
    });
    
    // Close database connections
    // Note: Drizzle with serverless doesn't require explicit closing
    
    logger.info('Graceful shutdown completed');
    process.exit(0);
  });
  
  // Force close after 30 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled promise rejection', { reason, promise });
  process.exit(1);
});

// =============================================
// SERVER STARTUP
// =============================================

server.listen(PORT, () => {
  logger.info('🛡️ FanzProtect Legal Platform Started', {
    port: PORT,
    environment: NODE_ENV,
    platform: 'protect.myfanz.network',
    pid: process.pid,
    nodeVersion: process.version,
    websocket: '/ws',
    healthCheck: '/api/health',
    ecosystem: 'FANZ Unified Network'
  });

  // Log ecosystem service connections
  if (process.env.FANZSSO_API_URL) {
    logger.info('🔐 FanzSSO integration configured', { 
      endpoint: process.env.FANZSSO_API_URL 
    });
  }
  
  if (process.env.FANZFINANCE_API_URL) {
    logger.info('💰 FanzFinance OS integration configured', { 
      endpoint: process.env.FANZFINANCE_API_URL 
    });
  }
  
  if (process.env.FANZMEDIA_API_URL) {
    logger.info('📁 FanzMediaCore integration configured', { 
      endpoint: process.env.FANZMEDIA_API_URL 
    });
  }
  
  if (process.env.FANZDASH_API_URL) {
    logger.info('📊 FanzDash integration configured', { 
      endpoint: process.env.FANZDASH_API_URL 
    });
  }
});

export { app, server, wss };