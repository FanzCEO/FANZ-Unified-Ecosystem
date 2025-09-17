/**
 * 🚀 FANZ Server Integration Example
 * 
 * Example showing how to integrate the vendor access delegation system
 * into your existing Express.js backend server.
 */

import express, { Application } from 'express';
import { Pool } from 'pg';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { 
  createVendorAccessContainer, 
  createVendorAccessRoutes,
  createVendorAccessMiddleware,
  addVendorAccessHealthChecks
} from './routes/vendor-access';

// ============================================
// 🔧 DATABASE CONFIGURATION
// ============================================

/**
 * Create PostgreSQL connection pool
 */
function createDatabasePool(): Pool {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'fanz_unified',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    max: parseInt(process.env.DB_POOL_MAX || '20'),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  // Handle pool errors
  pool.on('error', (err) => {
    console.error('Database pool error:', err);
  });

  return pool;
}

// ============================================
// 🛡️ EXPRESS APP SETUP
// ============================================

/**
 * Create and configure Express application
 */
export function createApp(): Application {
  const app = express();
  
  // ============================================
  // 🔒 SECURITY MIDDLEWARE
  // ============================================
  
  // Security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false
  }));

  // CORS configuration
  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.RATE_LIMIT_MAX ? parseInt(process.env.RATE_LIMIT_MAX) : 100,
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false
  });
  app.use(limiter);

  // Request parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ============================================
  // 🗄️ DATABASE SETUP
  // ============================================
  
  const databasePool = createDatabasePool();
  
  // Test database connection on startup
  databasePool.connect()
    .then(client => {
      console.log('✅ Database connection established');
      client.release();
    })
    .catch(err => {
      console.error('❌ Database connection failed:', err);
      process.exit(1);
    });

  // ============================================
  // 🛡️ VENDOR ACCESS SYSTEM INTEGRATION
  // ============================================
  
  // Create dependency injection container
  const vendorAccessContainer = createVendorAccessContainer(databasePool);
  
  // Create vendor access routes
  const vendorAccessRoutes = createVendorAccessRoutes(vendorAccessContainer);
  
  // Create middleware factory for protecting other routes
  const vendorAccessMiddleware = createVendorAccessMiddleware(vendorAccessContainer);
  
  // Mount vendor access routes
  app.use('/api/vendor-access', vendorAccessRoutes);
  
  // Add health check endpoints
  addVendorAccessHealthChecks(vendorAccessRoutes, vendorAccessContainer);

  // ============================================
  // 🛣️ OTHER API ROUTES (EXAMPLES)
  // ============================================
  
  // Example: Protect payment routes with vendor access
  app.get('/api/payments/dashboard',
    vendorAccessMiddleware.requirePaymentAccess,
    (req, res) => {
      res.json({ 
        message: 'Payment dashboard data',
        vendor: req.vendor // Vendor info added by middleware
      });
    }
  );

  // Example: Protect content moderation routes
  app.get('/api/content/moderate',
    vendorAccessMiddleware.requireContentMod,
    (req, res) => {
      res.json({ 
        message: 'Content moderation tools',
        permissions: req.vendorPermissions
      });
    }
  );

  // Example: Protect admin routes
  app.get('/api/admin/users',
    vendorAccessMiddleware.requireAdmin,
    (req, res) => {
      res.json({ 
        message: 'Admin user management',
        accessLevel: req.vendorAccessLevel
      });
    }
  );

  // Example: Custom permission protection
  app.get('/api/analytics/advanced',
    vendorAccessMiddleware.requirePermission('analytics-readonly', 'full'),
    (req, res) => {
      res.json({ message: 'Advanced analytics data' });
    }
  );

  // ============================================
  // 🏥 HEALTH & STATUS ENDPOINTS
  // ============================================
  
  app.get('/health', async (req, res) => {
    try {
      // Test database connectivity
      const client = await databasePool.connect();
      client.release();
      
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          api: 'healthy',
          database: 'healthy',
          vendorAccess: 'healthy'
        },
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      });
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get('/status', (req, res) => {
    res.json({
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version
    });
  });

  // ============================================
  // 🚨 ERROR HANDLING
  // ============================================
  
  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      error: 'Not Found',
      message: `Route ${req.method} ${req.path} not found`,
      timestamp: new Date().toISOString()
    });
  });

  // Global error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Global error handler:', err);
    
    const statusCode = err.statusCode || err.status || 500;
    const message = err.message || 'Internal Server Error';
    
    res.status(statusCode).json({
      error: statusCode >= 500 ? 'Internal Server Error' : message,
      message: process.env.NODE_ENV === 'production' && statusCode >= 500 ? 
        'An unexpected error occurred' : message,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
  });

  // Graceful shutdown handling
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    databasePool.end(() => {
      console.log('Database pool closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    databasePool.end(() => {
      console.log('Database pool closed');
      process.exit(0);
    });
  });

  return app;
}

// ============================================
// 🚀 SERVER STARTUP
// ============================================

/**
 * Start the server
 */
export function startServer(app: Application): void {
  const PORT = Number(process.env.PORT) || 3000;
  const HOST = process.env.HOST || '*******';

  const server = app.listen(PORT, HOST, () => {
    console.log(`
🚀 FANZ Unified Backend Server Starting
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Server running on: http://${HOST}:${PORT}
🌟 Environment: ${process.env.NODE_ENV || 'development'}
🗄️  Database: ${process.env.DB_NAME || 'fanz_unified'}
🛡️  Vendor Access: Enabled
📊 Health Check: http://${HOST}:${PORT}/health
🔧 Vendor API: http://${HOST}:${PORT}/api/vendor-access

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
  });

  // Handle server errors
  server.on('error', (err) => {
    console.error('Server error:', err);
    process.exit(1);
  });
}

// ============================================
// 🏁 BOOTSTRAP (if run directly)
// ============================================

if (require.main === module) {
  // Load environment variables
  require('dotenv').config();
  
  // Create and start the server
  const app = createApp();
  startServer(app);
}

export default { createApp, startServer };