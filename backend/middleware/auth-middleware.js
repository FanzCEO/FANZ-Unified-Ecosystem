const JWTService = require('../services/auth/JWTService');

/**
 * Extract Bearer token from Authorization header
 */
function extractBearerToken(authHeader) {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
}

/**
 * Admin authentication middleware
 * Validates JWT token for admin users
 */
const authenticateAdmin = async (req, res, next) => {
  try {
    const token = extractBearerToken(req.headers.authorization);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Bearer token not provided',
        timestamp: new Date().toISOString()
      });
    }

    const verification = JWTService.verifyToken(token, 'access');
    
    if (!verification.valid) {
      const status = verification.expired ? 401 : 403;
      return res.status(status).json({
        success: false,
        error: verification.expired ? 'Token expired' : 'Invalid token',
        message: verification.error,
        timestamp: new Date().toISOString()
      });
    }

    // Check if it's an admin token
    if (verification.decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Insufficient privileges',
        message: 'Admin access required',
        timestamp: new Date().toISOString()
      });
    }

    // Add admin info to request object
    req.admin = {
      id: verification.decoded.id,
      email: verification.decoded.email,
      role: verification.decoded.role,
      permissions: verification.decoded.permissions || [],
      token_issued_at: verification.decoded.issued_at
    };

    console.log(`🔐 Admin authenticated: ${req.admin.email} (${req.method} ${req.path})`);
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication error',
      message: 'Internal authentication failure',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Vendor authentication middleware
 * Validates JWT token for vendor access
 */
const authenticateVendor = async (req, res, next) => {
  try {
    const token = extractBearerToken(req.headers.authorization);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Vendor authentication required',
        message: 'Vendor access token not provided',
        timestamp: new Date().toISOString()
      });
    }

    const verification = JWTService.verifyVendorToken(token);
    
    if (!verification.valid) {
      const status = verification.expired ? 401 : 403;
      return res.status(status).json({
        success: false,
        error: verification.expired ? 'Vendor token expired' : 'Invalid vendor token',
        message: verification.error,
        timestamp: new Date().toISOString()
      });
    }

    // Add vendor info to request object
    req.vendor = verification.vendor;
    req.vendorAccess = verification.access;

    console.log(`🏢 Vendor authenticated: ${req.vendor.company} (${req.vendor.name}) - ${req.vendorAccess.level}`);
    next();
  } catch (error) {
    console.error('Vendor authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Vendor authentication error',
      message: 'Internal vendor authentication failure',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Optional authentication middleware
 * Adds user info if token is present but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = extractBearerToken(req.headers.authorization);
    
    if (!token) {
      return next(); // Continue without authentication
    }

    const verification = JWTService.verifyToken(token, 'access');
    
    if (verification.valid) {
      if (verification.decoded.role === 'admin') {
        req.admin = {
          id: verification.decoded.id,
          email: verification.decoded.email,
          role: verification.decoded.role,
          permissions: verification.decoded.permissions || []
        };
      } else if (verification.decoded.type === 'vendor_access') {
        const vendorVerification = JWTService.verifyVendorToken(token);
        if (vendorVerification.valid) {
          req.vendor = vendorVerification.vendor;
          req.vendorAccess = vendorVerification.access;
        }
      }
    }

    next();
  } catch (error) {
    // Log error but continue without authentication
    console.warn('Optional authentication error:', error.message);
    next();
  }
};

/**
 * Permission-based authorization middleware
 * Checks if admin user has required permissions
 */
const requirePermissions = (requiredPermissions) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Admin authentication required for this action',
        timestamp: new Date().toISOString()
      });
    }

    const userPermissions = req.admin.permissions || [];
    
    // Check if user has all required permissions
    const hasPermission = requiredPermissions.every(permission =>
      userPermissions.includes(permission) || userPermissions.includes('admin:manage')
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: `Required permissions: ${requiredPermissions.join(', ')}`,
        user_permissions: userPermissions,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`✅ Permission check passed: ${requiredPermissions.join(', ')} for ${req.admin.email}`);
    next();
  };
};

/**
 * Vendor access level authorization
 * Checks if vendor has required access level
 */
const requireVendorAccess = (requiredLevel) => {
  const accessLevels = {
    'read-only': 1,
    'read-write': 2,
    'admin': 3,
    'full-access': 4
  };

  return (req, res, next) => {
    if (!req.vendor || !req.vendorAccess) {
      return res.status(401).json({
        success: false,
        error: 'Vendor authentication required',
        timestamp: new Date().toISOString()
      });
    }

    const vendorLevel = accessLevels[req.vendorAccess.level] || 0;
    const requiredLevelValue = accessLevels[requiredLevel] || 0;

    if (vendorLevel < requiredLevelValue) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient vendor access level',
        message: `Required level: ${requiredLevel}, current level: ${req.vendorAccess.level}`,
        timestamp: new Date().toISOString()
      });
    }

    next();
  };
};

/**
 * Rate limiting middleware for authentication endpoints
 */
const authRateLimit = (req, res, next) => {
  // Simple in-memory rate limiting (in production, use Redis)
  const clientId = req.ip;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5;

  if (!global.authAttempts) {
    global.authAttempts = new Map();
  }

  const attempts = global.authAttempts.get(clientId) || [];
  const recentAttempts = attempts.filter(time => now - time < windowMs);

  if (recentAttempts.length >= maxAttempts) {
    return res.status(429).json({
      success: false,
      error: 'Too many authentication attempts',
      message: 'Please try again in 15 minutes',
      retry_after: Math.ceil((recentAttempts[0] + windowMs - now) / 1000),
      timestamp: new Date().toISOString()
    });
  }

  // Track this attempt
  recentAttempts.push(now);
  global.authAttempts.set(clientId, recentAttempts);

  next();
};

module.exports = {
  authenticateAdmin,
  authenticateVendor,
  optionalAuth,
  requirePermissions,
  requireVendorAccess,
  authRateLimit,
  extractBearerToken
};