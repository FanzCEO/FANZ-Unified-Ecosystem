import { Application } from 'express';
import { Logger } from '../utils/logger';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import contentRoutes from './content.routes';
import { optionalAuth } from '../middleware/auth';

const logger = new Logger('Routes');

// API route setup
export const setupRoutes = (app: Application) => {
  logger.info('Setting up API routes');
  
  // API v1 base route
  const apiV1 = '/api/v1';
  
  // Health check and test endpoints
  app.get(`${apiV1}/test`, optionalAuth, (req, res) => {
    res.json({
      success: true,
      message: 'FANZ Unified Ecosystem API is running!',
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      authenticated: !!req.user,
      user: req.user ? {
        id: req.user.userId,
        role: req.user.role
      } : null
    });
  });

  // Authentication routes
  app.use(`${apiV1}/auth`, authRoutes);
  
  // User management routes
  app.use(`${apiV1}/users`, userRoutes);
  
  // Content management routes
  app.use(`${apiV1}/content`, contentRoutes);
  
  // Health status endpoint with more details
  app.get(`${apiV1}/status`, (req, res) => {
    res.json({
      success: true,
      status: 'operational',
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      features: {
        authentication: true,
        websockets: process.env.ENABLE_WEBSOCKETS === 'true',
        blockchain: process.env.ENABLE_BLOCKCHAIN === 'true',
        aiFeatures: process.env.ENABLE_AI_FEATURES === 'true'
      },
      endpoints: {
        auth: `${apiV1}/auth`,
        users: `${apiV1}/users`,
        content: `${apiV1}/content`,
        test: `${apiV1}/test`,
        health: '/health',
        metrics: '/metrics'
      }
    });
  });

  // 404 handler for API routes
  app.use(`${apiV1}/*`, (req, res) => {
    res.status(404).json({
      success: false,
      error: {
        message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
        code: 'ENDPOINT_NOT_FOUND',
        statusCode: 404,
        timestamp: new Date().toISOString()
      }
    });
  });

  logger.info('API routes setup completed', {
    routes: [
      `${apiV1}/auth/*`,
      `${apiV1}/users/*`,
      `${apiV1}/content/*`,
      `${apiV1}/test`,
      `${apiV1}/status`
    ]
  });
};

export default setupRoutes;
