import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { config } from './config/environment';
import { OIDCService } from './services/OIDCService';
import { AuthService } from './services/AuthService';
import { databaseService } from './services/DatabaseService';
import { createAuthRoutes } from './routes/auth';
import { logger } from './utils/logger';
import fs from 'fs';
import path from 'path';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Initialize Express app
const app = express();

// Trust proxy for accurate IP addresses
app.set('trust proxy', true);

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: config.cors.allowedOrigins,
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Cookie parsing
app.use(cookieParser());

// Rate limiting
const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased for auth service
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalRateLimit);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan('combined', { stream: logger.stream }));

// Initialize services
const oidcService = new OIDCService(config, null);
const authService = new AuthService(oidcService);
oidcService.authService = authService;

// Routes
app.use('/auth', createAuthRoutes(authService, oidcService));

// OIDC endpoints
app.get('/oidc/.well-known/openid-configuration', async (req, res) => {
  try {
    const config = await oidcService.getConfiguration();
    res.json(config);
  } catch (error) {
    logger.error('OIDC configuration error:', error);
    res.status(500).json({ error: 'Failed to get OIDC configuration' });
  }
});

app.get('/oidc/jwks', async (req, res) => {
  try {
    const jwks = await oidcService.getJWKS();
    res.json(jwks);
  } catch (error) {
    logger.error('JWKS error:', error);
    res.status(500).json({ error: 'Failed to get JWKS' });
  }
});

app.get('/oidc/authorize', async (req, res) => {
  try {
    const result = await oidcService.handleAuthorizationRequest(req.query);
    if (result.error) {
      return res.status(400).json(result);
    }
    res.redirect(result.redirectUri);
  } catch (error) {
    logger.error('Authorization error:', error);
    res.status(500).json({ error: 'Authorization failed' });
  }
});

app.post('/oidc/token', async (req, res) => {
  try {
    const result = await oidcService.handleTokenRequest(req.body);
    if (result.error) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (error) {
    logger.error('Token error:', error);
    res.status(500).json({ error: 'Token request failed' });
  }
});

app.get('/oidc/userinfo', authService.authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const userInfo = await oidcService.getUserInfo(req.user);
    res.json(userInfo);
  } catch (error) {
    logger.error('UserInfo error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

app.post('/oidc/introspect', async (req, res) => {
  try {
    const result = await oidcService.introspectToken(req.body.token);
    res.json(result);
  } catch (error) {
    logger.error('Token introspection error:', error);
    res.status(500).json({ error: 'Token introspection failed' });
  }
});

app.post('/oidc/revoke', async (req, res) => {
  try {
    await oidcService.revokeToken(req.body.token);
    res.json({ success: true });
  } catch (error) {
    logger.error('Token revocation error:', error);
    res.status(500).json({ error: 'Token revocation failed' });
  }
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const authHealth = await authService.healthCheck();
    const oidcHealth = await oidcService.healthCheck();
    const dbHealth = await databaseService.healthCheck();
    
    res.json({
      status: 'healthy',
      timestamp: new Date(),
      service: 'FanzAuth',
      version: '1.0.0',
      services: {
        auth: authHealth,
        oidc: oidcHealth,
        database: dbHealth,
      },
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date(),
      error: 'Service health check failed',
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'FanzAuth - Unified Identity and Authentication Service',
    version: '1.0.0',
    description: 'Enterprise-grade authentication service for FANZ Ecosystem',
    features: [
      'OAuth 2.0 / OIDC Provider',
      'JWT-based authentication',
      'Cross-cluster SSO',
      'Role-based permissions',
      'Rate limiting & security',
      '9 Platform cluster support',
    ],
    endpoints: {
      health: '/health',
      auth: '/auth',
      oidc: '/oidc',
      wellKnown: '/oidc/.well-known/openid-configuration',
      jwks: '/oidc/jwks',
    },
    clusters: [
      'fanzlab', 'boyfanz', 'girlfanz', 'daddyfanz',
      'pupfanz', 'taboofanz', 'transfanz', 'cougarfanz', 'fanzcock'
    ],
    documentation: 'https://docs.fanz.app/auth',
  });
});

// Error handling middleware
app.use((error: any, req: any, res: any, next: any) => {
  logger.error('Unhandled error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });
  
  res.status(error.status || 500).json({
    success: false,
    error: 'Internal server error',
    message: config.server.environment === 'development' ? error.message : 'Something went wrong',
    timestamp: new Date(),
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date(),
  });
});

// Start server
const server = app.listen(config.server.port, () => {
  logger.info(`🚀 FanzAuth service running on port ${config.server.port}`);
  logger.info(`🌍 Environment: ${config.server.environment}`);
  logger.info(`🔗 Base URL: ${config.server.baseUrl}`);
  logger.info(`📊 CORS enabled for origins: ${config.cors.allowedOrigins.join(', ')}`);
  logger.info(`🔒 Security headers enabled with Helmet`);
  logger.info(`⚡ Rate limiting: ${globalRateLimit.max} requests per ${globalRateLimit.windowMs / 60000} minutes`);
  logger.info(`🏗️  Database initialized and ready`);
  logger.info(`🔐 OIDC provider ready at ${config.server.baseUrl}/oidc`);
  logger.info(`✅ FanzAuth ready to serve 9 platform clusters`);
});

// Graceful shutdown
const shutdown = async (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully`);
  
  server.close(async () => {
    try {
      await databaseService.close();
      logger.info('Database connections closed');
      logger.info('Process terminated gracefully');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default app;