/**
 * FANZ SSO Middleware
 * Authentication and validation middleware for SSO service
 */

const jwt = require('jsonwebtoken');

// Validate incoming requests
const validateRequest = (req, res, next) => {
  // Rate limiting could be implemented here
  // For now, just basic validation
  
  // Check for required headers
  if (req.method === 'POST' && !req.headers['content-type']) {
    return res.status(400).json({
      error: 'missing_content_type',
      message: 'Content-Type header is required for POST requests'
    });
  }

  // Add request ID for tracking
  req.requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  next();
};

// Require authentication
const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      error: 'missing_token',
      message: 'Authorization token is required'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-jwt-secret');
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      name: decoded.name,
      platforms: decoded.platform_access || [],
      creator_status: decoded.creator_status,
      age_verified: decoded.age_verified,
      roles: decoded.roles || ['user']
    };
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'invalid_token',
      message: 'Token is invalid or expired'
    });
  }
};

// Require admin role
const requireAdmin = (req, res, next) => {
  // First check authentication
  requireAuth(req, res, (error) => {
    if (error) return;
    
    // Check if user has admin role
    if (!req.user.roles.includes('admin') && !req.user.roles.includes('super_admin')) {
      return res.status(403).json({
        error: 'insufficient_permissions',
        message: 'Admin access required'
      });
    }
    
    next();
  });
};

// Platform-specific middleware
const requirePlatformAccess = (platform) => {
  return (req, res, next) => {
    requireAuth(req, res, (error) => {
      if (error) return;
      
      // Check if user has access to the requested platform
      if (!req.user.platforms.includes(platform)) {
        return res.status(403).json({
          error: 'platform_access_denied',
          message: `Access to ${platform} is not authorized`
        });
      }
      
      next();
    });
  };
};

// CORS middleware (if needed beyond express cors)
const corsHeaders = (req, res, next) => {
  const allowedOrigins = [
    'https://FanzSSO.com',
    'https://girlfanz.com',
    'https://pupfanz.com',
    'https://taboofanz.com',
    'https://transfanz.com',
    'https://daddiesfanz.com',
    'https://cougarfanz.com',
    'https://fanz.foundation',
    'http://localhost:3000',
    'http://localhost:3100'
  ];

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,POST,PUT,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Access-Control-Allow-Headers, Origin, Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
};

// Logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.url} - ${res.statusCode} (${duration}ms) [${req.requestId || 'no-id'}]`);
  });
  
  next();
};

// Error handling middleware
const errorHandler = (error, req, res, next) => {
  console.error('SSO Middleware Error:', error);
  
  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'token_expired',
      message: 'Token has expired'
    });
  }
  
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'invalid_token',
      message: 'Token is malformed'
    });
  }
  
  // Default error
  res.status(500).json({
    error: 'internal_server_error',
    message: 'An unexpected error occurred',
    request_id: req.requestId
  });
};

module.exports = {
  validateRequest,
  requireAuth,
  requireAdmin,
  requirePlatformAccess,
  corsHeaders,
  requestLogger,
  errorHandler
};