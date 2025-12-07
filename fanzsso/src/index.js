/**
 * FANZ SSO Service - Main Entry Point
 * Unified authentication for all FANZ platforms
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { Provider } = require('oidc-provider');
const Redis = require('redis');
const config = require('./config/sso-config');
const routes = require('./routes');
const middleware = require('./middleware');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}));

// CORS configuration for FANZ platforms
app.use(cors({
  origin: [
    'https://FanzSSO.com',
    'https://girlfanz.com', 
    'https://pupfanz.com',
    'https://taboofanz.com',
    'https://transfanz.com',
    'https://daddiesfanz.com',
    'https://cougarfanz.com',
    'https://fanz.foundation',
    'http://localhost:3000', // Development
    'http://localhost:3100'  // Development
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Redis for session storage
const redisClient = Redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

// Initialize OIDC Provider
const oidc = new Provider(process.env.FANZ_SSO_ISSUER || 'http://localhost:3001', config.oidcConfig);

// Custom middleware
app.use('/auth', middleware.validateRequest);
app.use('/profile', middleware.requireAuth);
app.use('/admin', middleware.requireAdmin);

// Routes
app.use('/auth', routes.auth);
app.use('/profile', routes.profile);
app.use('/admin', routes.admin);

// OIDC endpoints
app.use('/oidc', oidc.callback());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'FanzSSO',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    platforms: [
      'FanzSSO', 'GirlFanz', 'PupFanz', 'TabooFanz', 
      'TransFanz', 'DaddyFanz', 'CougarFanz'
    ]
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('SSO Error:', err);
  res.status(err.status || 500).json({
    error: 'Authentication service error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Start server
const startServer = async () => {
  try {
    await redisClient.connect();
    console.log('✅ Redis connected');
    
    app.listen(PORT, () => {
      console.log(`🚀 FanzSSO Service running on port ${PORT}`);
      console.log(`🔐 OIDC Issuer: ${process.env.FANZ_SSO_ISSUER || 'http://localhost:3001'}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start FanzSSO service:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;