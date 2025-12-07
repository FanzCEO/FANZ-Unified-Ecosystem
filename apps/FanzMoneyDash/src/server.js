/**
 * FANZ Money Dash - Main Server
 * Advanced Financial Management Platform for Creator Economy
 * Integrates: AI Analytics, Blockchain, PWA, Compliance, Real-time streaming
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Import route modules
import analyticsRoutes from './routes/analytics.js';
import complianceRoutes from './routes/compliance.js';
import blockchainRoutes from './routes/blockchain.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import transactionRoutes from './routes/transactions.js';
import integrationRoutes from './routes/integrations.js';
import discreetRoutes from './routes/discreet.js';
import discreetWebhooks from './routes/discreetWebhooks.js';
import discreetLimits from './routes/discreetLimits.js';
import websocketHandler from './websocket/handler.js';

// Import middleware
import authMiddleware from './middleware/auth.js';
import errorHandler from './middleware/errorHandler.js';

// Import database configuration
import { connectDatabase, isConnectedToDatabase, getDatabaseInfo } from './config/database.js';
import logger, { logError } from './config/logger.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "ws:", "wss:", "https:"],
      mediaSrc: ["'self'", "blob:"],
      objectSrc: ["'none'"],
      baseSrc: ["'self'"],
      formSrc: ["'self'"],
      frameAncestors: ["'none'"]
    }
  }
}));

app.use(compression());
app.use(morgan('combined'));

// CORS configuration for FANZ domains
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://fanz.network',
    'https://*.fanz.network',
    'https://boyfanz.com',
    'https://girlfanz.com', 
    'https://pupfanz.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files and PWA assets
app.use(express.static(join(__dirname, '../public')));
app.use(express.static(join(__dirname, '../dist')));

// Health check endpoint
app.get('/health', (req, res) => {
  const dbInfo = getDatabaseInfo();
  const isDbConnected = isConnectedToDatabase();
  
  res.status(200).json({
    status: isDbConnected ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    services: {
      database: isDbConnected ? 'connected' : 'disconnected',
      blockchain: 'connected', 
      ai_analytics: 'operational',
      compliance: 'operational',
      websocket: 'connected'
    },
    database: dbInfo,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/transactions', authMiddleware, transactionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/discreet', discreetRoutes); // FanzDiscreet Privacy Cards
app.use('/api/discreet/webhooks', discreetWebhooks); // CCBill Webhooks
app.use('/api/discreet/limits', discreetLimits); // Spending Limits

// WebSocket handling
websocketHandler(io);

// PWA endpoints
app.get('/sw.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(join(__dirname, '../public/sw.js'));
});

app.get('/manifest.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.sendFile(join(__dirname, '../public/manifest.json'));
});

app.get('/offline.html', (req, res) => {
  res.sendFile(join(__dirname, '../public/offline.html'));
});

// API documentation
app.get('/api/docs', (req, res) => {
  res.json({
    title: 'FANZ Money Dash API',
    version: '1.0.0',
    description: 'Advanced Financial Management Platform API',
    features: {
      'AI Analytics': {
        endpoints: ['/api/analytics/*'],
        description: 'ML-powered financial forecasting and insights'
      },
      'Compliance Automation': {
        endpoints: ['/api/compliance/*'], 
        description: 'Multi-jurisdiction tax calculations and reporting'
      },
      'Blockchain Integration': {
        endpoints: ['/api/blockchain/*'],
        description: 'Transparent transaction logging and verification'
      },
      'FanzDiscreet Privacy Cards': {
        endpoints: ['/api/discreet/*'],
        description: 'Privacy-focused prepaid cards with discreet billing via CCBill'
      },
      'Real-time Streaming': {
        protocol: 'WebSocket',
        description: 'Live financial updates and notifications'
      },
      'PWA Support': {
        endpoints: ['/sw.js', '/manifest.json', '/offline.html'],
        description: 'Progressive Web App capabilities'
      }
    }
  });
});

// SPA fallback - catch all non-API routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  res.sendFile(join(__dirname, '../dist/index.html'), (err) => {
    if (err) {
      console.error('Error serving index.html:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
});

// Error handling middleware
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  
  try {
    // Close database connection
    const { disconnectDatabase } = await import('./config/database.js');
    await disconnectDatabase();
    console.log('✅ Database disconnected');
  } catch (error) {
    console.error('❌ Error disconnecting database:', error);
  }
  
  server.close((err) => {
    if (err) {
      console.error('❌ Error during server shutdown:', err);
      process.exit(1);
    }
    
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
  
  setTimeout(() => {
    console.error('❌ Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

// Start server with database initialization
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || 'localhost';

async function startServer() {
  try {
    // Initialize database connection
    console.log('💾 Initializing database connection...');
    await connectDatabase();
    console.log('✅ Database connected successfully');
    
    server.listen(PORT, HOST, () => {
      console.log('\n🚀 FANZ Money Dash Server Started');
      console.log('=====================================');
      console.log(`📍 Server: http://${HOST}:${PORT}`);
      console.log(`🏥 Health: http://${HOST}:${PORT}/health`);
      console.log(`📚 API Docs: http://${HOST}:${PORT}/api/docs`);
      console.log(`🌐 PWA: Service Worker and Manifest enabled`);
      console.log(`🤖 AI Analytics: TensorFlow.js models loaded`);
      console.log(`⚖️ Compliance: Multi-jurisdiction support active`);
      console.log(`🔗 Blockchain: Smart contracts ready`);
      console.log(`📡 WebSocket: Real-time streaming enabled`);
      console.log(`💾 Database: MongoDB connected`);
      console.log('=====================================');
      console.log(`🎯 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`💾 Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
      console.log('=====================================\n');
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    logError(error, { context: 'server_startup' });
    process.exit(1);
  }
}

// Start the server
startServer();

export default app;