const express = require('express');
const bcrypt = require('bcryptjs');
const JWTService = require('../services/auth/JWTService');
const { authenticateAdmin, requirePermissions, authRateLimit } = require('../middleware/auth-middleware');
// Import database connection - create a Pool instance
const { Pool } = require('pg');
const dbConnection = new Pool({
  user: process.env.DB_USER || 'fanz_user',
  host: process.env.DB_HOST || 'localhost', 
  database: process.env.DB_NAME || 'fanz_unified',
  password: process.env.DB_PASSWORD || 'FanzDB_2024_Secure!',
  port: process.env.DB_PORT || 5432,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

const router = express.Router();

/**
 * Admin Login
 * POST /api/auth/admin/login
 */
router.post('/admin/login', authRateLimit, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing credentials',
        message: 'Email and password are required',
        timestamp: new Date().toISOString()
      });
    }

    // Get admin from database (you'll need to create an admin users table)
    const adminQuery = `
      SELECT id, email, password_hash, permissions, status, last_login_at
      FROM admin_users 
      WHERE email = $1 AND status = 'active'
    `;
    
    const result = await dbConnection.query(adminQuery, [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Email or password is incorrect',
        timestamp: new Date().toISOString()
      });
    }

    const admin = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Email or password is incorrect',
        timestamp: new Date().toISOString()
      });
    }

    // Generate JWT tokens
    const tokens = JWTService.generateAdminTokens({
      id: admin.id,
      email: admin.email,
      permissions: admin.permissions || []
    });

    // Update last login
    await dbConnection.query(
      'UPDATE admin_users SET last_login_at = NOW() WHERE id = $1',
      [admin.id]
    );

    console.log(`🔐 Admin login successful: ${admin.email}`);

    res.json({
      success: true,
      message: 'Login successful',
      tokens,
      admin: {
        id: admin.id,
        email: admin.email,
        permissions: admin.permissions || [],
        last_login: admin.last_login_at
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
      message: 'Internal server error during authentication',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Refresh Admin Token
 * POST /api/auth/admin/refresh
 */
router.post('/admin/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token required',
        timestamp: new Date().toISOString()
      });
    }

    const verification = JWTService.verifyToken(refresh_token, 'refresh');

    if (!verification.valid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
        message: verification.error,
        timestamp: new Date().toISOString()
      });
    }

    // Generate new access token
    const newTokens = JWTService.generateAdminTokens({
      id: verification.decoded.id,
      email: verification.decoded.email,
      permissions: verification.decoded.permissions || []
    });

    console.log(`🔄 Token refreshed for admin: ${verification.decoded.email}`);

    res.json({
      success: true,
      tokens: newTokens,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'Token refresh failed',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Vendor Login (Generate vendor access token)
 * POST /api/auth/vendor/login
 */
router.post('/vendor/login', authRateLimit, async (req, res) => {
  try {
    const { vendor_id, access_key } = req.body;

    if (!vendor_id || !access_key) {
      return res.status(400).json({
        success: false,
        error: 'Missing credentials',
        message: 'Vendor ID and access key are required',
        timestamp: new Date().toISOString()
      });
    }

    // Get vendor and access details
    const vendorQuery = `
      SELECT 
        v.id, v.name, v.company, v.email, v.status as vendor_status,
        vat.id as token_id, vat.access_level, vat.permissions, 
        vat.expires_at, vat.status as token_status
      FROM vendors v
      INNER JOIN vendor_access_tokens vat ON v.id = vat.vendor_id
      WHERE v.id = $1 AND vat.access_key = $2 
        AND v.status = 'approved' 
        AND vat.status = 'active'
        AND vat.expires_at > NOW()
    `;

    const result = await dbConnection.query(vendorQuery, [vendor_id, access_key]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid vendor credentials',
        message: 'Vendor ID, access key, or credentials may be expired/inactive',
        timestamp: new Date().toISOString()
      });
    }

    const vendorData = result.rows[0];

    // Generate vendor JWT token
    const token = JWTService.generateVendorToken(
      {
        id: vendorData.id,
        name: vendorData.name,
        company: vendorData.company,
        email: vendorData.email
      },
      {
        level: vendorData.access_level,
        permissions: vendorData.permissions || [],
        token_id: vendorData.token_id,
        expires_at: vendorData.expires_at
      }
    );

    // Update last used timestamp
    await dbConnection.query(
      'UPDATE vendor_access_tokens SET last_used_at = NOW() WHERE id = $1',
      [vendorData.token_id]
    );

    console.log(`🏢 Vendor login successful: ${vendorData.company} (${vendorData.name})`);

    res.json({
      success: true,
      message: 'Vendor authentication successful',
      token,
      vendor: {
        id: vendorData.id,
        name: vendorData.name,
        company: vendorData.company,
        email: vendorData.email
      },
      access: {
        level: vendorData.access_level,
        permissions: vendorData.permissions || [],
        expires_at: vendorData.expires_at
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Vendor login error:', error);
    res.status(500).json({
      success: false,
      error: 'Vendor authentication failed',
      message: 'Internal server error during vendor authentication',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Create Admin User
 * POST /api/auth/admin/create
 * Requires admin authentication and proper permissions
 */
router.post('/admin/create', 
  authenticateAdmin,
  requirePermissions(['admin:manage']),
  async (req, res) => {
    try {
      const { email, password, permissions = [] } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: 'Email and password are required',
          timestamp: new Date().toISOString()
        });
      }

      // Check if admin already exists
      const existingQuery = 'SELECT id FROM admin_users WHERE email = $1';
      const existing = await dbConnection.query(existingQuery, [email]);

      if (existing.rows.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'Admin already exists',
          message: 'An admin user with this email already exists',
          timestamp: new Date().toISOString()
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create admin user
      const createQuery = `
        INSERT INTO admin_users (email, password_hash, permissions, status, created_by)
        VALUES ($1, $2, $3, 'active', $4)
        RETURNING id, email, permissions, created_at
      `;

      const result = await dbConnection.query(createQuery, [
        email,
        passwordHash,
        JSON.stringify(permissions),
        req.admin.id
      ]);

      const newAdmin = result.rows[0];

      console.log(`👤 New admin created: ${newAdmin.email} by ${req.admin.email}`);

      res.status(201).json({
        success: true,
        message: 'Admin user created successfully',
        admin: {
          id: newAdmin.id,
          email: newAdmin.email,
          permissions: permissions,
          created_at: newAdmin.created_at
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Admin creation error:', error);
      res.status(500).json({
        success: false,
        error: 'Admin creation failed',
        message: 'Internal server error during admin creation',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * Validate Token
 * POST /api/auth/validate
 */
router.post('/validate', async (req, res) => {
  try {
    const { token, token_type = 'access' } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token required',
        timestamp: new Date().toISOString()
      });
    }

    let verification;
    
    if (token_type === 'vendor') {
      verification = JWTService.verifyVendorToken(token);
    } else {
      verification = JWTService.verifyToken(token, token_type);
    }

    res.json({
      success: true,
      valid: verification.valid,
      expired: verification.expired,
      decoded: verification.valid ? verification.decoded : null,
      error: verification.error || null,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Token validation failed',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Logout (Blacklist token)
 * POST /api/auth/logout
 */
router.post('/logout', authenticateAdmin, async (req, res) => {
  try {
    // In a full implementation, you'd blacklist the token
    // For now, just acknowledge the logout
    
    console.log(`🚪 Admin logout: ${req.admin.email}`);

    res.json({
      success: true,
      message: 'Logged out successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Get current admin profile
 * GET /api/auth/admin/profile
 */
router.get('/admin/profile', authenticateAdmin, async (req, res) => {
  try {
    const profileQuery = `
      SELECT id, email, permissions, created_at, last_login_at, status
      FROM admin_users
      WHERE id = $1
    `;
    
    const result = await dbConnection.query(profileQuery, [req.admin.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Admin not found',
        timestamp: new Date().toISOString()
      });
    }

    const profile = result.rows[0];

    res.json({
      success: true,
      profile: {
        id: profile.id,
        email: profile.email,
        permissions: profile.permissions || [],
        created_at: profile.created_at,
        last_login_at: profile.last_login_at,
        status: profile.status
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;