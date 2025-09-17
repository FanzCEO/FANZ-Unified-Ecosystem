const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const { optionalAuth } = require('./middleware/auth-middleware');
const { trackVendorActivity, trackAdminActivity } = require('./middleware/activity-tracker-middleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Create direct database connection pool
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

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const userAgent = req.get('User-Agent') || 'Unknown';
  const ip = req.ip || req.connection.remoteAddress || 'Unknown';
  
  console.log(`[${timestamp}] ${method} ${url} - IP: ${ip.substring(0, 15)} - ${userAgent.substring(0, 50)}`);
  next();
});

// Mount authentication routes
app.use('/api/auth', authRoutes);

// Mount admin management routes (protected with activity tracking)
app.use('/api/admin', trackAdminActivity, adminRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Check database connectivity
    const dbCheck = await dbConnection.query('SELECT NOW() as current_time, version() as db_version');
    const dbTime = dbCheck.rows[0].current_time;
    const dbVersion = dbCheck.rows[0].db_version;

    // Check admin users table
    const adminCheck = await dbConnection.query('SELECT COUNT(*) as admin_count FROM admin_users WHERE status = $1', ['active']);
    const adminCount = parseInt(adminCheck.rows[0].admin_count);

    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        server_time: dbTime,
        version: dbVersion.split(' ').slice(0, 2).join(' '),
        admin_users: adminCount
      },
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        node_version: process.version,
        environment: process.env.NODE_ENV || 'development'
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: 'Database connection failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Database status endpoint (with optional auth info)
app.get('/api/status', optionalAuth, async (req, res) => {
  try {
    // Basic database stats
    const tableStats = await dbConnection.query(`
      SELECT schemaname, tablename, n_tup_ins as inserts, n_tup_upd as updates, n_tup_del as deletes
      FROM pg_stat_user_tables 
      WHERE tablename IN ('vendor_profiles', 'vendor_access_tokens', 'admin_users', 'access_grants')
      ORDER BY tablename
    `);

    // Vendor statistics
    const vendorStats = await dbConnection.query(`
      SELECT 
        COUNT(*) as total_vendors,
        COUNT(*) FILTER (WHERE status = 'approved') as approved_vendors,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_vendors,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected_vendors
      FROM vendor_profiles
    `);

    // Token statistics  
    const tokenStats = await dbConnection.query(`
      SELECT 
        COUNT(*) as total_tokens,
        COUNT(*) FILTER (WHERE expires_at > NOW() AND revoked = false) as valid_tokens,
        COUNT(*) FILTER (WHERE last_used > NOW() - INTERVAL '24 hours') as used_recently
      FROM vendor_access_tokens
    `);

    // Admin statistics
    const adminStats = await dbConnection.query(`
      SELECT 
        COUNT(*) as total_admins,
        COUNT(*) FILTER (WHERE status = 'active') as active_admins,
        COUNT(*) FILTER (WHERE last_login_at > NOW() - INTERVAL '30 days') as recent_logins
      FROM admin_users
    `);

    // Access grants statistics
    const grantsStats = await dbConnection.query(`
      SELECT 
        COUNT(*) as total_grants,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_grants,
        COUNT(*) FILTER (WHERE status = 'approved') as approved_grants,
        COUNT(*) FILTER (WHERE status = 'active') as active_grants
      FROM access_grants
    `);

    const response = {
      success: true,
      database: {
        connected: true,
        table_stats: tableStats.rows,
        vendor_stats: vendorStats.rows[0],
        token_stats: tokenStats.rows[0],
        admin_stats: adminStats.rows[0],
        grants_stats: grantsStats.rows[0]
      },
      timestamp: new Date().toISOString()
    };

    // Add user context if authenticated
    if (req.admin) {
      response.authenticated_user = {
        type: 'admin',
        email: req.admin.email,
        permissions: req.admin.permissions
      };
    } else if (req.vendor) {
      response.authenticated_user = {
        type: 'vendor',
        company: req.vendor.company,
        name: req.vendor.name,
        access_level: req.vendorAccess.level
      };
    }

    res.json(response);
  } catch (error) {
    console.error('Status check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve system status',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get vendor profiles (public endpoint)
app.get('/api/vendors', async (req, res) => {
  try {
    const { limit = 50, offset = 0, status = 'approved' } = req.query;
    
    const vendors = await dbConnection.query(`
      SELECT id, name, company, email, vendor_type, contact_info, 
             status, created_at, updated_at
      FROM vendor_profiles 
      WHERE status = $1
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `, [status, parseInt(limit), parseInt(offset)]);

    const total = await dbConnection.query(
      'SELECT COUNT(*) as count FROM vendor_profiles WHERE status = $1', 
      [status]
    );

    res.json({
      success: true,
      vendors: vendors.rows,
      pagination: {
        total: parseInt(total.rows[0].count),
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: (parseInt(offset) + vendors.rows.length) < parseInt(total.rows[0].count)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vendor profiles',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Vendor statistics endpoint (must come before :id route)
app.get('/api/vendors/stats', async (req, res) => {
  try {
    const stats = await dbConnection.query(`
      SELECT 
        COUNT(*) as total_vendors,
        COUNT(*) FILTER (WHERE status = 'approved') as approved_vendors,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_vendors,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected_vendors,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as new_this_month,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as new_this_week,
        COUNT(DISTINCT vendor_type) as unique_vendor_types
      FROM vendor_profiles
    `);

    const typeBreakdown = await dbConnection.query(`
      SELECT vendor_type, COUNT(*) as count
      FROM vendor_profiles 
      WHERE status = 'approved' AND vendor_type IS NOT NULL
      GROUP BY vendor_type 
      ORDER BY count DESC 
      LIMIT 10
    `);

    res.json({
      success: true,
      stats: stats.rows[0],
      type_breakdown: typeBreakdown.rows,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching vendor stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vendor statistics',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get specific vendor profile
app.get('/api/vendors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const vendor = await dbConnection.query(`
      SELECT id, name, company, email, vendor_type, contact_info, 
             status, created_at, updated_at
      FROM vendor_profiles 
      WHERE id = $1 AND status = 'approved'
    `, [id]);

    if (vendor.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found',
        message: 'Vendor profile not found or not approved',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      vendor: vendor.rows[0],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching vendor:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vendor profile',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API Documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    success: true,
    title: 'FANZ Enhanced Vendor Management API',
    version: '2.0.0',
    description: 'Complete vendor access management system with JWT authentication',
    
    authentication: {
      type: 'Bearer JWT',
      login_endpoint: 'POST /api/auth/admin/login',
      token_validation: 'POST /api/auth/validate',
      example: 'Authorization: Bearer {{YOUR_JWT_TOKEN}}'
    },

    public_endpoints: {
      'GET /api/health': 'System health check',
      'GET /api/status': 'Database and system status',
      'GET /api/vendors': 'List approved vendor profiles',
      'GET /api/vendors/stats': 'Vendor statistics',
      'GET /api/vendors/:id': 'Get specific vendor profile',
      'GET /api/docs': 'This documentation'
    },

    authentication_endpoints: {
      'POST /api/auth/admin/login': 'Admin login with email/password',
      'POST /api/auth/admin/refresh': 'Refresh access token',
      'GET /api/auth/admin/profile': 'Get admin profile (requires auth)',
      'POST /api/auth/admin/create': 'Create new admin user (requires auth + permissions)',
      'POST /api/auth/vendor/login': 'Vendor authentication',
      'POST /api/auth/validate': 'Validate any token',
      'POST /api/auth/logout': 'Logout (admin)'
    },

    admin_vendor_management: {
      'GET /api/admin/vendors': 'List all vendors (admin view)',
      'POST /api/admin/vendors': 'Create new vendor profile',
      'GET /api/admin/vendors/:id': 'Get detailed vendor profile',
      'PUT /api/admin/vendors/:id': 'Update vendor profile',
      'DELETE /api/admin/vendors/:id': 'Delete vendor profile'
    },

    admin_grants_management: {
      'GET /api/admin/grants': 'List all access grants',
      'POST /api/admin/grants': 'Create new access grant',
      'GET /api/admin/grants/:id': 'Get detailed access grant',
      'POST /api/admin/grants/:id/approve': 'Approve access grant',
      'POST /api/admin/grants/:id/revoke': 'Revoke access grant',
      'POST /api/admin/grants/:id/extend': 'Extend access grant'
    },

    admin_dashboard: {
      'GET /api/admin/dashboard': 'Admin dashboard overview',
      'GET /api/admin/health': 'Detailed system health (admin)',
      'GET /api/admin/audit-log': 'Admin activity audit log',
      'GET /api/admin/analytics': 'System analytics and trends'
    },

    admin_activity_monitoring: {
      'GET /api/admin/activity/activities': 'List vendor activities with filtering',
      'GET /api/admin/activity/sessions': 'List vendor sessions with status',
      'GET /api/admin/activity/summary/:vendor_id': 'Get vendor activity summary',
      'GET /api/admin/activity/risk-analytics': 'Risk analytics and trends',
      'GET /api/admin/activity/live-feed': 'Real-time activity feed',
      'POST /api/admin/activity/sessions/:id/end': 'Terminate vendor session'
    },

    permissions: {
      'admin:manage': 'Create/manage other admin users',
      'vendor:manage': 'Full vendor management (create, edit, delete, grants, session control)',
      'vendor:view': 'View vendor profiles and stats',
      'analytics:view': 'View system analytics and reports',
      'system:admin': 'System administration tasks',
      'audit:view': 'View audit logs, security events, and activity monitoring'
    },

    response_format: {
      success_response: {
        success: true,
        data: '...',
        timestamp: 'ISO 8601 timestamp'
      },
      error_response: {
        success: false,
        error: 'Error type',
        message: 'Human readable error message',
        timestamp: 'ISO 8601 timestamp'
      }
    },

    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `${req.method} ${req.url} is not a valid endpoint`,
    available_endpoints: '/api/docs',
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\\n🛑 Received SIGINT, shutting down gracefully...');
  
  try {
    await dbConnection.end();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
  }
  
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\\n🛑 Received SIGTERM, shutting down gracefully...');
  
  try {
    await dbConnection.end();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
  }
  
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log('\\n🚀 FANZ Enhanced Vendor Management System');
  console.log('='.repeat(70));
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
  console.log('\\n🔐 Authentication Endpoints:');
  console.log(`   POST /api/auth/admin/login      - Admin login`);
  console.log(`   POST /api/auth/vendor/login     - Vendor login`);
  console.log(`   POST /api/auth/admin/refresh    - Refresh admin token`);
  console.log(`   GET  /api/auth/admin/profile    - Get admin profile`);
  console.log(`   POST /api/auth/validate         - Validate any token`);
  console.log(`   POST /api/auth/logout           - Logout (admin)`);
  console.log('\\n👤 Admin Vendor Management:');
  console.log(`   GET    /api/admin/vendors       - List all vendors`);
  console.log(`   POST   /api/admin/vendors       - Create vendor`);
  console.log(`   GET    /api/admin/vendors/:id   - Get vendor details`);
  console.log(`   PUT    /api/admin/vendors/:id   - Update vendor`);
  console.log(`   DELETE /api/admin/vendors/:id   - Delete vendor`);
  console.log('\\n🔑 Admin Access Grants:');
  console.log(`   GET  /api/admin/grants          - List all grants`);
  console.log(`   POST /api/admin/grants          - Create grant`);
  console.log(`   POST /api/admin/grants/:id/approve - Approve grant`);
  console.log(`   POST /api/admin/grants/:id/revoke  - Revoke grant`);
  console.log(`   POST /api/admin/grants/:id/extend  - Extend grant`);
  console.log('\\n📊 Admin Dashboard:');
  console.log(`   GET  /api/admin/dashboard       - Dashboard overview`);
  console.log(`   GET  /api/admin/health          - System health`);
  console.log(`   GET  /api/admin/audit-log       - Activity audit log`);
  console.log(`   GET  /api/admin/analytics       - System analytics`);
  console.log('\\n🔍 Admin Activity Monitoring:');
  console.log(`   GET  /api/admin/activity/activities    - Vendor activities`);
  console.log(`   GET  /api/admin/activity/sessions      - Vendor sessions`);
  console.log(`   GET  /api/admin/activity/summary/:id   - Vendor activity summary`);
  console.log(`   GET  /api/admin/activity/risk-analytics - Risk analytics`);
  console.log(`   GET  /api/admin/activity/live-feed     - Real-time activity`);
  console.log(`   POST /api/admin/activity/sessions/:id/end - Terminate session`);
  console.log('\\n📊 Public Endpoints:');
  console.log(`   GET  /api/vendors               - List vendor profiles`);
  console.log(`   GET  /api/vendors/:id           - Get specific vendor`);
  console.log(`   GET  /api/vendors/stats         - Vendor statistics`);
  console.log(`   GET  /api/status                - System status`);
  console.log('\\n👤 Default Admin Credentials:');
  console.log(`   Email: admin@fanz.com`);
  console.log(`   Password: admin123`);
  console.log('\\n⚠️  Remember to change default credentials in production!');
  console.log('='.repeat(70));
});

module.exports = app;