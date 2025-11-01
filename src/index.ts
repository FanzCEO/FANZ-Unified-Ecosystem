/**
 * FANZ Unified Ecosystem - Main Entry Point
 * Production-ready server for adult content platform ecosystem
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from 'dotenv';

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security and performance middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || true,
  credentials: true,
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint for DigitalOcean
app.get('/healthz', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'fanz-unified-ecosystem',
  });
});

// System status endpoint
app.get('/system', (req, res) => {
  res.status(200).json({
    status: 'operational',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    platform: 'FANZ-Unified-Ecosystem',
    node_version: process.version,
    environment: process.env.NODE_ENV || 'development',
  });
});

// Main API routes
app.get('/', (req, res) => {
  res.json({
    message: '🔥 FANZ Unified Ecosystem API',
    status: 'active',
    platforms: [
      'BoyFanz',
      'GirlFanz', 
      'PupFanz',
      'DaddiesFanz',
      'CougarFanz',
      'TabooFanz'
    ],
    features: [
      'Creator-first economics',
      'Military-grade security',
      'AI-powered moderation',
      'Blockchain integration',
      'Real-time payments'
    ]
  });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.originalUrl,
    message: 'The requested resource was not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 FANZ Unified Ecosystem running on port ${PORT}`);
  console.log(`💻 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/healthz`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('💤 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('💤 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

export default app;
