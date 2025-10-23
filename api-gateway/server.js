const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = parseInt(process.env.PORT || '8090', 10);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    resetTime: new Date(Date.now() + 15 * 60 * 1000).toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req, res) => req.path === '/api/health'
});

app.use(limiter);

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3030'],
  credentials: true
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    service: 'FANZ API Gateway'
  });
});

// Gateway status endpoint
app.get('/gateway/status', (req, res) => {
  res.json({
    gateway: 'FANZ Unified API Gateway',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    status: 'operational',
    timestamp: new Date().toISOString()
  });
});

// Simple proxy setup for main services
app.use('/api/landing', createProxyMiddleware({
  target: 'http://fanz-landing:3000',
  changeOrigin: true,
  pathRewrite: { '^/api/landing': '' },
  timeout: 30000,
  onError: (err, req, res) => {
    console.error('Proxy error for FanzLanding:', err.message);
    if (!res.headersSent) {
      res.status(502).json({
        error: 'Service Unavailable',
        service: 'FanzLanding',
        message: 'Unable to reach FanzLanding service'
      });
    }
  }
}));

app.use('/api/dash', createProxyMiddleware({
  target: 'http://fanzdash:3030',
  changeOrigin: true,
  pathRewrite: { '^/api/dash': '' },
  timeout: 30000,
  onError: (err, req, res) => {
    console.error('Proxy error for FanzDash:', err.message);
    if (!res.headersSent) {
      res.status(502).json({
        error: 'Service Unavailable',
        service: 'FanzDash',
        message: 'Unable to reach FanzDash service'
      });
    }
  }
}));

// Default route
app.get('/', (req, res) => {
  res.json({
    message: '🚀 FANZ Unified API Gateway',
    version: '1.0.0',
    status: 'operational',
    endpoints: {
      health: '/api/health',
      status: '/gateway/status',
      landing: '/api/landing/*',
      dash: '/api/dash/*'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
    timestamp: new Date().toISOString(),
    path: req.originalUrl
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(error.status || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : error.message,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 FANZ API Gateway started on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
