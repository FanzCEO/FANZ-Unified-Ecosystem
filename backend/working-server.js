const express = require('express');
const cors = require('cors');
const db = require('./simple-db-v2');

const app = express();
const PORT = process.env.PORT || 3000;

// Basic middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check route with database connectivity
app.get('/health', async (req, res) => {
  try {
    const dbStatus = await db.testConnection();
    res.json({ 
      status: 'ok', 
      message: 'FANZ Backend Server is running',
      timestamp: new Date().toISOString(),
      database: dbStatus
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Enhanced API status route with real database stats
app.get('/api/status', async (req, res) => {
  try {
    const dbStatus = await db.testConnection();
    const stats = dbStatus.connected ? await db.getDatabaseStats() : null;
    
    res.json({
      service: 'FANZ Unified Ecosystem Backend',
      version: '1.0.0',
      status: 'operational',
      timestamp: new Date().toISOString(),
      database: {
        connected: dbStatus.connected,
        status: dbStatus.connected ? 'connected' : 'disconnected',
        error: dbStatus.error || null,
        stats: stats
      },
      vendor_access: {
        enabled: true,
        status: 'configured',
        active_vendors: stats?.active_vendors || 0,
        active_grants: stats?.active_grants || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      service: 'FANZ Unified Ecosystem Backend',
      version: '1.0.0',
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Real vendor access endpoints

// Vendor access health check
app.get('/api/vendor-access/health', async (req, res) => {
  try {
    const dbStatus = await db.testConnection();
    res.json({
      status: 'ok',
      message: 'Vendor access system is operational',
      database_connected: dbStatus.connected,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Vendor access system error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get all vendor profiles (REAL DATA!)
app.get('/api/vendor-access/profiles', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    
    const result = await db.getVendorProfiles(parseInt(limit), parseInt(offset));
    
    res.json({
      success: true,
      data: result,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.total,
        pages: Math.ceil(result.total / limit)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching vendor profiles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vendor profiles',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get specific vendor profile by ID
app.get('/api/vendor-access/profiles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || !id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid vendor ID format',
        timestamp: new Date().toISOString()
      });
    }
    
    const profile = await db.getVendorProfileById(id);
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Vendor profile not found',
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      data: profile,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching vendor profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vendor profile',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get access grants for a vendor
app.get('/api/vendor-access/profiles/:id/grants', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    
    if (!id || !id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid vendor ID format',
        timestamp: new Date().toISOString()
      });
    }
    
    const grants = await db.getAccessGrantsForVendor(id, parseInt(limit), parseInt(offset));
    
    res.json({
      success: true,
      data: {
        grants: grants,
        vendor_id: id,
        total: grants.length
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching access grants:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch access grants',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get vendor access statistics (REAL DATA!)
app.get('/api/vendor-access/stats', async (req, res) => {
  try {
    const stats = await db.getDatabaseStats();
    
    res.json({
      success: true,
      data: {
        overview: {
          total_vendors: stats.total_vendors,
          active_vendors: stats.active_vendors,
          total_grants: stats.total_grants,
          active_grants: stats.active_grants,
          total_tokens: stats.total_tokens
        },
        health: {
          database_connected: true,
          system_status: 'operational'
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching vendor access stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`
🚀 FANZ Working Backend Server Started Successfully!

   Server: http://localhost:${PORT}
   Health: http://localhost:${PORT}/health
   Status: http://localhost:${PORT}/api/status
   
   📊 Vendor Access Endpoints:
   • Profiles: http://localhost:${PORT}/api/vendor-access/profiles
   • Stats:    http://localhost:${PORT}/api/vendor-access/stats
   • Health:   http://localhost:${PORT}/api/vendor-access/health
   
   Environment: ${process.env.NODE_ENV || 'development'}
   Timestamp: ${new Date().toISOString()}
  `);
  
  // Test database connection on startup
  try {
    const dbStatus = await db.testConnection();
    if (dbStatus.connected) {
      console.log('✅ Database connection verified on startup');
      const stats = await db.getDatabaseStats();
      console.log(`📊 Database Stats: ${stats.active_vendors} active vendors, ${stats.active_grants} active grants`);
    } else {
      console.log('❌ Database connection failed on startup:', dbStatus.error);
    }
  } catch (error) {
    console.error('❌ Database startup test failed:', error.message);
  }
});

module.exports = app;