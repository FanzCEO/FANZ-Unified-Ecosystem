import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import jwt from 'jsonwebtoken';
import redis from 'redis';
import { WebSocketServer } from 'ws';
import rateLimit from 'express-rate-limit';

// 🚀 FANZ Unified API Gateway
// Central hub connecting all 13 consolidated platforms

const app = express();
const redisClient = redis.createClient({ url: process.env.REDIS_URL });

// 🔧 Gateway Configuration
const GATEWAY_CONFIG = {
  port: process.env.PORT || 8080,
  jwtSecret: process.env.JWT_SECRET || 'fanz-unified-secret',
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['*'],
  rateLimitWindow: 15 * 60 * 1000, // 15 minutes
  rateLimitMax: process.env.NODE_ENV === 'production' ? 1000 : 10000,
};

// 🌐 Platform Service Registry
const PLATFORM_SERVICES = {
  // Core Infrastructure
  auth: {
    url: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    prefix: '/api/auth',
    healthCheck: '/health'
  },
  
  // Content & Media Platforms
  fanz: {
    url: process.env.FANZ_SOCIAL_URL || 'http://localhost:3002',
    prefix: '/api/fanz',
    healthCheck: '/health',
    description: 'Social networking and community features'
  },
  
  fanztube: {
    url: process.env.FANZTUBE_URL || 'http://localhost:3003',
    prefix: '/api/tube',
    healthCheck: '/health',
    description: 'Video streaming and content management'
  },
  
  fanzcommerce: {
    url: process.env.FANZCOMMERCE_URL || 'http://localhost:3004',
    prefix: '/api/commerce',
    healthCheck: '/health',
    description: 'E-commerce and marketplace'
  },
  
  fanzspicyai: {
    url: process.env.FANZSPICYAI_URL || 'http://localhost:3005',
    prefix: '/api/ai',
    healthCheck: '/health',
    description: 'AI-powered content creation and automation'
  },
  
  fanzmedia: {
    url: process.env.FANZMEDIA_URL || 'http://localhost:3006',
    prefix: '/api/media',
    healthCheck: '/health',
    description: 'Media processing and CDN'
  },
  
  fanzdash: {
    url: process.env.FANZDASH_URL || 'http://localhost:3007',
    prefix: '/api/dashboard',
    healthCheck: '/health',
    description: 'Unified dashboard and analytics'
  },
  
  fanzlanding: {
    url: process.env.FANZLANDING_URL || 'http://localhost:3008',
    prefix: '/api/landing',
    healthCheck: '/health',
    description: 'Landing pages and marketing'
  },
  
  fanzfiliate: {
    url: process.env.FANZFILIATE_URL || 'http://localhost:3009',
    prefix: '/api/affiliate',
    healthCheck: '/health',
    description: 'Affiliate marketing and referrals'
  },
  
  fanzhub: {
    url: process.env.FANZHUB_URL || 'http://localhost:3010',
    prefix: '/api/hub',
    healthCheck: '/health',
    description: 'Content storage and management'
  },
  
  starzcards: {
    url: process.env.STARZCARDS_URL || 'http://localhost:3011',
    prefix: '/api/cards',
    healthCheck: '/health',
    description: 'Digital collectibles and NFTs'
  },
  
  clubcentral: {
    url: process.env.CLUBCENTRAL_URL || 'http://localhost:3012',
    prefix: '/api/clubs',
    healthCheck: '/health',
    description: 'Private clubs and group management'
  },
  
  migrationhq: {
    url: process.env.MIGRATION_HQ_URL || 'http://localhost:3013',
    prefix: '/api/migration',
    healthCheck: '/health',
    description: 'Data migration and platform tools'
  },
  
  fanzos: {
    url: process.env.FANZOS_URL || 'http://localhost:3014',
    prefix: '/api/os',
    healthCheck: '/health',
    description: 'Core operating system and microservices'
  }
};

// 🔐 Authentication Middleware
const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      error: 'Access token required',
      ecosystem: 'fanz-unified'
    });
  }

  try {
    const decoded = jwt.verify(token, GATEWAY_CONFIG.jwtSecret) as any;
    
    // Check if user session exists in Redis
    const userSession = await redisClient.get(`session:${decoded.userId}`);
    if (!userSession) {
      return res.status(401).json({ 
        error: 'Session expired',
        ecosystem: 'fanz-unified'
      });
    }

    req.user = decoded;
    req.sessionData = JSON.parse(userSession);
    next();
  } catch (error) {
    res.status(403).json({ 
      error: 'Invalid token',
      ecosystem: 'fanz-unified'
    });
  }
};

// 🚦 Rate Limiting
const createRateLimit = (windowMs: number, max: number) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'Too many requests',
      ecosystem: 'fanz-unified',
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// 🔧 Middleware Setup
app.use(cors({
  origin: GATEWAY_CONFIG.corsOrigins,
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Apply rate limiting
app.use(createRateLimit(GATEWAY_CONFIG.rateLimitWindow, GATEWAY_CONFIG.rateLimitMax));

// 📊 Health Check & Service Discovery
app.get('/api/health', async (req, res) => {
  const serviceHealth: Record<string, any> = {};
  
  for (const [serviceName, config] of Object.entries(PLATFORM_SERVICES)) {
    try {
      const response = await fetch(`${config.url}${config.healthCheck}`, {
        method: 'GET',
        timeout: 5000
      });
      serviceHealth[serviceName] = {
        status: response.ok ? 'healthy' : 'unhealthy',
        url: config.url,
        description: config.description || 'Service description not available',
        responseTime: Date.now()
      };
    } catch (error) {
      serviceHealth[serviceName] = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        url: config.url
      };
    }
  }
  
  const healthyServices = Object.values(serviceHealth).filter(s => s.status === 'healthy').length;
  const totalServices = Object.keys(serviceHealth).length;
  
  res.json({
    ecosystem: 'fanz-unified',
    gateway: 'healthy',
    timestamp: new Date().toISOString(),
    services: serviceHealth,
    summary: {
      totalServices,
      healthyServices,
      healthPercentage: Math.round((healthyServices / totalServices) * 100)
    }
  });
});

// 🔍 Service Discovery Endpoint
app.get('/api/services', (req, res) => {
  const services = Object.entries(PLATFORM_SERVICES).map(([name, config]) => ({
    name,
    url: config.url,
    prefix: config.prefix,
    description: config.description || 'No description available'
  }));
  
  res.json({
    ecosystem: 'fanz-unified',
    totalServices: services.length,
    services
  });
});

// 🔐 Unified Authentication Routes
app.post('/api/auth/login', async (req, res) => {
  try {
    // Proxy to auth service
    const authResponse = await fetch(`${PLATFORM_SERVICES.auth.url}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body)
    });

    const authData = await authResponse.json();

    if (authResponse.ok && authData.token) {
      // Store session in Redis for cross-platform access
      const sessionData = {
        userId: authData.user.id,
        username: authData.user.username,
        email: authData.user.email,
        role: authData.user.role,
        platforms: authData.user.platforms || [],
        createdAt: new Date().toISOString()
      };

      await redisClient.setEx(
        `session:${authData.user.id}`,
        24 * 60 * 60, // 24 hours
        JSON.stringify(sessionData)
      );

      res.json({
        ...authData,
        ecosystem: 'fanz-unified',
        availablePlatforms: Object.keys(PLATFORM_SERVICES).filter(s => s !== 'auth')
      });
    } else {
      res.status(authResponse.status).json(authData);
    }
  } catch (error) {
    res.status(500).json({
      error: 'Authentication service unavailable',
      ecosystem: 'fanz-unified'
    });
  }
});

// 🔄 Cross-Platform User Data Sync
app.get('/api/user/unified-profile', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const unifiedProfile: any = {
      basic: req.sessionData,
      platforms: {}
    };

    // Collect data from all platforms in parallel
    const platformPromises = Object.entries(PLATFORM_SERVICES)
      .filter(([name]) => name !== 'auth')
      .map(async ([platformName, config]) => {
        try {
          const response = await fetch(`${config.url}/api/user/profile`, {
            headers: {
              'Authorization': req.headers.authorization,
              'X-Platform-Source': 'gateway'
            }
          });
          
          if (response.ok) {
            const platformData = await response.json();
            return [platformName, platformData];
          }
        } catch (error) {
          console.log(`Error fetching ${platformName} profile:`, error);
        }
        return [platformName, { error: 'Service unavailable' }];
      });

    const platformResults = await Promise.all(platformPromises);
    
    platformResults.forEach(([platformName, data]) => {
      unifiedProfile.platforms[platformName as string] = data;
    });

    res.json({
      ecosystem: 'fanz-unified',
      profile: unifiedProfile
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch unified profile',
      ecosystem: 'fanz-unified'
    });
  }
});

// 📊 Cross-Platform Analytics
app.get('/api/analytics/unified', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const timeRange = req.query.timeRange || '30d';
    
    const analyticsPromises = [
      'fanz', 'fanztube', 'fanzcommerce', 'fanzdash'
    ].map(async (platform) => {
      try {
        const service = PLATFORM_SERVICES[platform as keyof typeof PLATFORM_SERVICES];
        const response = await fetch(`${service.url}/api/analytics/user?timeRange=${timeRange}`, {
          headers: {
            'Authorization': req.headers.authorization,
            'X-Platform-Source': 'gateway'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          return [platform, data];
        }
      } catch (error) {
        console.log(`Analytics error for ${platform}:`, error);
      }
      return [platform, { metrics: {} }];
    });

    const analyticsResults = await Promise.all(analyticsPromises);
    const unifiedAnalytics: any = {
      timeRange,
      platforms: {},
      summary: {
        totalViews: 0,
        totalEarnings: 0,
        totalFollowers: 0,
        totalContent: 0
      }
    };

    analyticsResults.forEach(([platform, data]) => {
      unifiedAnalytics.platforms[platform as string] = data;
      
      // Aggregate summary metrics
      if (data.metrics) {
        unifiedAnalytics.summary.totalViews += data.metrics.views || 0;
        unifiedAnalytics.summary.totalEarnings += data.metrics.earnings || 0;
        unifiedAnalytics.summary.totalFollowers += data.metrics.followers || 0;
        unifiedAnalytics.summary.totalContent += data.metrics.contentCount || 0;
      }
    });

    res.json({
      ecosystem: 'fanz-unified',
      analytics: unifiedAnalytics
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch unified analytics',
      ecosystem: 'fanz-unified'
    });
  }
});

// 🔀 Platform Proxy Routes - Dynamic routing to all services
Object.entries(PLATFORM_SERVICES).forEach(([serviceName, config]) => {
  if (serviceName === 'auth') return; // Auth routes are handled specially
  
  app.use(config.prefix, createProxyMiddleware({
    target: config.url,
    changeOrigin: true,
    pathRewrite: {
      [`^${config.prefix}`]: ''
    },
    onProxyReq: (proxyReq, req: any) => {
      // Add ecosystem headers
      proxyReq.setHeader('X-Ecosystem', 'fanz-unified');
      proxyReq.setHeader('X-Gateway-Source', 'api-gateway');
      proxyReq.setHeader('X-Platform-Target', serviceName);
      
      // Forward user session data
      if (req.user) {
        proxyReq.setHeader('X-User-ID', req.user.userId);
        proxyReq.setHeader('X-User-Role', req.user.role);
      }
    },
    onProxyRes: (proxyRes, req, res) => {
      // Add ecosystem response headers
      res.setHeader('X-Ecosystem', 'fanz-unified');
      res.setHeader('X-Service', serviceName);
    },
    onError: (err, req, res) => {
      console.error(`Proxy error for ${serviceName}:`, err);
      (res as any).status(503).json({
        error: `${serviceName} service unavailable`,
        ecosystem: 'fanz-unified',
        service: serviceName
      });
    }
  }));
});

// 📡 WebSocket Support for Real-time Features
const server = app.listen(GATEWAY_CONFIG.port, () => {
  console.log(`🚀 FANZ Unified API Gateway running on port ${GATEWAY_CONFIG.port}`);
  console.log(`🌐 Connected Services: ${Object.keys(PLATFORM_SERVICES).length}`);
  console.log(`🔐 Authentication: JWT with Redis sessions`);
  console.log(`📊 Health Check: http://localhost:${GATEWAY_CONFIG.port}/api/health`);
});

// WebSocket server for real-time cross-platform events
const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection established');
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString());
      
      // Handle cross-platform real-time events
      if (data.type === 'subscribe') {
        // Subscribe to platform-specific events
        ws.send(JSON.stringify({
          type: 'subscribed',
          platforms: data.platforms || [],
          ecosystem: 'fanz-unified'
        }));
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
});

// 🔌 Initialize Redis Connection
redisClient.connect().then(() => {
  console.log('📦 Redis connected for session management');
}).catch(console.error);

// 🔄 Graceful Shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 FANZ Gateway shutting down gracefully...');
  await redisClient.quit();
  server.close();
});

export default app;