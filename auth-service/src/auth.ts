import express from 'express';
import bcrypt from 'bcrypt';
import * as jose from 'jose';
import { Pool } from 'pg';
import redis from 'redis';
import { z } from 'zod';

// Rate limiting imports
import { rateLimitConfig } from './config/rateLimitConfig';
import {
  initializeRateLimitStore,
  createSensitiveLimiterIP,
  createSensitiveLimiterAccount,
  createSensitiveLimiterIPLong,
  createTokenLimiterIP,
  createTokenLimiterUser,
  createTokenLimiterUserLong,
  createStandardLimiterIP,
  applyMultipleRateLimiters
} from './middleware/rateLimit';
import { 
  metricsEndpoint, 
  rateLimitHealthCheck 
} from './monitoring/rateLimitMetrics';

// 🔐 FANZ Unified Authentication Service
// Single Sign-On (SSO) across all 13 consolidated platforms

const app = express();
const redisClient = redis.createClient({ url: process.env.REDIS_URL });

// 🗄️ Database Configuration
const dbPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
});

// 🔧 Authentication Configuration
const AUTH_CONFIG = {
  port: process.env.PORT || 3001,
  jwtSecret: process.env.JWT_SECRET || 'fanz-unified-auth-secret',
  jwtExpiry: process.env.JWT_EXPIRY || '24h',
  refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY || '30d',
  bcryptRounds: 12,
  sessionExpiry: 24 * 60 * 60, // 24 hours in seconds
};

// 📋 Validation Schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  platform: z.string().optional().default('fanz'),
});

const registerSchema = z.object({
  username: z.string().min(3).max(30),
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string(),
  role: z.enum(['fan', 'creator', 'affiliate']).default('fan'),
  platform: z.string().default('fanz'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const platformAccessSchema = z.object({
  platform: z.string(),
  permissions: z.array(z.string()).optional(),
});

// 🎭 User Role and Permission System
enum UserRole {
  FAN = 'fan',
  CREATOR = 'creator',
  AFFILIATE = 'affiliate',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

interface PlatformAccess {
  platform: string;
  accessLevel: 'basic' | 'premium' | 'admin';
  permissions: string[];
  subscribedAt: Date;
  isActive: boolean;
}

interface UserSession {
  userId: string;
  username: string;
  email: string;
  role: UserRole;
  platformAccess: PlatformAccess[];
  lastActivity: Date;
  ipAddress: string;
  userAgent: string;
}

// 🔧 Middleware
// Trust proxy for accurate IP addresses behind gateway/load balancer
app.set('trust proxy', true);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 📊 Health Check
app.get('/health', (req, res) => {
  res.json({
    service: 'fanz-auth-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    ecosystem: 'fanz-unified'
  });
});

// 📈 Metrics Endpoint
app.get('/metrics', metricsEndpoint);

// 🚦 Rate Limit Health Check
app.get('/health/rate-limit', rateLimitHealthCheck);

// 🔐 User Registration
app.post('/api/auth/register', 
  applyMultipleRateLimiters([
    createSensitiveLimiterIP('register'),
    createSensitiveLimiterAccount('register'),
    createSensitiveLimiterIPLong('register')
  ]),
  async (req, res) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const { username, email, password, role, platform } = validatedData;

    // Check if user already exists
    const existingUser = await dbPool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: 'User already exists',
        ecosystem: 'fanz-unified'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, AUTH_CONFIG.bcryptRounds);

    // Create user
    const newUser = await dbPool.query(`
      INSERT INTO users (
        username, email, password_hash, role, 
        platform_registered, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING id, username, email, role, created_at
    `, [username, email, hashedPassword, role, platform]);

    const user = newUser.rows[0];

    // Create platform access entry
    await dbPool.query(`
      INSERT INTO user_platform_access (
        user_id, platform, access_level, permissions, 
        subscribed_at, is_active
      ) VALUES ($1, $2, $3, $4, NOW(), true)
    `, [
      user.id, 
      platform, 
      'basic', 
      JSON.stringify([`${platform}:read`, `${platform}:write`])
    ]);

    // Generate JWT tokens
    const secret = new TextEncoder().encode(AUTH_CONFIG.jwtSecret);
    
    const accessToken = await new jose.SignJWT({
      userId: user.id,
      username: user.username,
      role: user.role
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setIssuer('fanz.eco')
      .setAudience('fanz-auth')
      .setExpirationTime(AUTH_CONFIG.jwtExpiry)
      .sign(secret);

    const refreshToken = await new jose.SignJWT({
      userId: user.id,
      type: 'refresh'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setIssuer('fanz.eco')
      .setAudience('fanz-auth')
      .setExpirationTime(AUTH_CONFIG.refreshTokenExpiry)
      .sign(secret);

    // Store session in Redis
    const sessionData: UserSession = {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      platformAccess: [{
        platform,
        accessLevel: 'basic',
        permissions: [`${platform}:read`, `${platform}:write`],
        subscribedAt: new Date(),
        isActive: true
      }],
      lastActivity: new Date(),
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown'
    };

    await redisClient.setEx(
      `session:${user.id}`,
      AUTH_CONFIG.sessionExpiry,
      JSON.stringify(sessionData)
    );

    // Store refresh token
    await redisClient.setEx(
      `refresh:${user.id}`,
      30 * 24 * 60 * 60, // 30 days
      refreshToken
    );

    return res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.created_at
      },
      tokens: {
        accessToken,
        refreshToken
      },
      platformAccess: sessionData.platformAccess,
      ecosystem: 'fanz-unified'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
        ecosystem: 'fanz-unified'
      });
    }

    console.error('Registration error:', error);
    return res.status(500).json({
      error: 'Registration failed',
      ecosystem: 'fanz-unified'
    });
  }
});

// 🔑 User Login
app.post('/api/auth/login', 
  applyMultipleRateLimiters([
    createSensitiveLimiterIP('login'),
    createSensitiveLimiterAccount('login'),
    createSensitiveLimiterIPLong('login')
  ]),
  async (req, res) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const { email, password, platform } = validatedData;

    // Find user
    const userResult = await dbPool.query(`
      SELECT u.*, 
             array_agg(
               json_build_object(
                 'platform', upa.platform,
                 'accessLevel', upa.access_level,
                 'permissions', upa.permissions,
                 'subscribedAt', upa.subscribed_at,
                 'isActive', upa.is_active
               )
             ) as platform_access
      FROM users u
      LEFT JOIN user_platform_access upa ON u.id = upa.user_id
      WHERE u.email = $1
      GROUP BY u.id
    `, [email]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid credentials',
        ecosystem: 'fanz-unified'
      });
    }

    const user = userResult.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid credentials',
        ecosystem: 'fanz-unified'
      });
    }

    // Update last login
    await dbPool.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    // Generate JWT tokens
    const secret = new TextEncoder().encode(AUTH_CONFIG.jwtSecret);
    
    const accessToken = await new jose.SignJWT({
      userId: user.id,
      username: user.username,
      role: user.role
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setIssuer('fanz.eco')
      .setAudience('fanz-auth')
      .setExpirationTime(AUTH_CONFIG.jwtExpiry)
      .sign(secret);

    const refreshToken = await new jose.SignJWT({
      userId: user.id,
      type: 'refresh'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setIssuer('fanz.eco')
      .setAudience('fanz-auth')
      .setExpirationTime(AUTH_CONFIG.refreshTokenExpiry)
      .sign(secret);

    // Create session data
    const sessionData: UserSession = {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      platformAccess: user.platform_access.filter((pa: any) => pa.platform && pa.isActive),
      lastActivity: new Date(),
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown'
    };

    // Store session in Redis
    await redisClient.setEx(
      `session:${user.id}`,
      AUTH_CONFIG.sessionExpiry,
      JSON.stringify(sessionData)
    );

    // Store refresh token
    await redisClient.setEx(
      `refresh:${user.id}`,
      30 * 24 * 60 * 60,
      refreshToken
    );

    return res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        lastLogin: new Date()
      },
      tokens: {
        accessToken,
        refreshToken
      },
      platformAccess: sessionData.platformAccess,
      availablePlatforms: [
        'fanz', 'fanztube', 'fanzcommerce', 'fanzspicyai',
        'fanzmedia', 'fanzdash', 'fanzlanding', 'fanzfiliate',
        'fanzhub', 'starzcards', 'clubcentral', 'migrationhq', 'fanzos'
      ],
      ecosystem: 'fanz-unified'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
        ecosystem: 'fanz-unified'
      });
    }

    console.error('Login error:', error);
    return res.status(500).json({
      error: 'Login failed',
      ecosystem: 'fanz-unified'
    });
  }
});

// 🔄 Token Refresh
app.post('/api/auth/refresh', 
  applyMultipleRateLimiters([
    createTokenLimiterIP('refresh'),
    createTokenLimiterUser('refresh'),
    createTokenLimiterUserLong('refresh')
  ]),
  async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        error: 'Refresh token required',
        ecosystem: 'fanz-unified'
      });
    }

    // Verify refresh token
    const secret = new TextEncoder().encode(AUTH_CONFIG.jwtSecret);
    
    let decoded: any;
    try {
      const { payload } = await jose.jwtVerify(refreshToken, secret, {
        issuer: 'fanz.eco',
        audience: 'fanz-auth'
      });
      decoded = payload;
    } catch (error) {
      return res.status(401).json({
        error: 'Invalid refresh token',
        ecosystem: 'fanz-unified'
      });
    }
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        error: 'Invalid refresh token',
        ecosystem: 'fanz-unified'
      });
    }

    // Check if refresh token exists in Redis
    const storedRefreshToken = await redisClient.get(`refresh:${decoded.userId}`);
    if (storedRefreshToken !== refreshToken) {
      return res.status(401).json({
        error: 'Refresh token expired or revoked',
        ecosystem: 'fanz-unified'
      });
    }

    // Get user data
    const userResult = await dbPool.query(
      'SELECT id, username, email, role FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        error: 'User not found',
        ecosystem: 'fanz-unified'
      });
    }

    const user = userResult.rows[0];

    // Generate new access token
    const newAccessToken = await new jose.SignJWT({
      userId: user.id,
      username: user.username,
      role: user.role
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setIssuer('fanz.eco')
      .setAudience('fanz-auth')
      .setExpirationTime(AUTH_CONFIG.jwtExpiry)
      .sign(secret);

    return res.json({
      accessToken: newAccessToken,
      ecosystem: 'fanz-unified'
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    return res.status(401).json({
      error: 'Token refresh failed',
      ecosystem: 'fanz-unified'
    });
  }
});

// 💪 Logout
app.post('/api/auth/logout', 
  createStandardLimiterIP('logout'),
  async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      try {
        const secret = new TextEncoder().encode(AUTH_CONFIG.jwtSecret);
        const { payload } = await jose.jwtVerify(token, secret, {
          issuer: 'fanz.eco',
          audience: 'fanz-auth'
        });
        
        // Remove session and refresh token from Redis
        await Promise.all([
          redisClient.del(`session:${payload.userId}`),
          redisClient.del(`refresh:${payload.userId}`)
        ]);
      } catch (error) {
        // Token invalid, but continue with logout anyway
      }
    }

    res.json({
      message: 'Logout successful',
      ecosystem: 'fanz-unified'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.json({
      message: 'Logout completed',
      ecosystem: 'fanz-unified'
    });
  }
});

// 🎫 Platform Access Management
app.post('/api/auth/platform-access', 
  createStandardLimiterIP('platform-access'),
  async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        error: 'Access token required',
        ecosystem: 'fanz-unified'
      });
    }

    let decoded: any;
    try {
      const secret = new TextEncoder().encode(AUTH_CONFIG.jwtSecret);
      const { payload } = await jose.jwtVerify(token, secret, {
        issuer: 'fanz.eco',
        audience: 'fanz-auth'
      });
      decoded = payload;
    } catch (error) {
      return res.status(401).json({
        error: 'Invalid access token',
        ecosystem: 'fanz-unified'
      });
    }
    const validatedData = platformAccessSchema.parse(req.body);

    // Grant platform access
    await dbPool.query(`
      INSERT INTO user_platform_access (
        user_id, platform, access_level, permissions, 
        subscribed_at, is_active
      ) VALUES ($1, $2, $3, $4, NOW(), true)
      ON CONFLICT (user_id, platform) 
      DO UPDATE SET 
        permissions = $4,
        is_active = true,
        subscribed_at = NOW()
    `, [
      decoded.userId, 
      validatedData.platform, 
      'basic',
      JSON.stringify(validatedData.permissions || [`${validatedData.platform}:read`, `${validatedData.platform}:write`])
    ]);

    // Update session in Redis
    const sessionData = await redisClient.get(`session:${decoded.userId}`);
    if (sessionData) {
      const session: UserSession = JSON.parse(sessionData);
      const existingPlatformIndex = session.platformAccess.findIndex(
        pa => pa.platform === validatedData.platform
      );

      const newPlatformAccess: PlatformAccess = {
        platform: validatedData.platform,
        accessLevel: 'basic',
        permissions: validatedData.permissions || [`${validatedData.platform}:read`, `${validatedData.platform}:write`],
        subscribedAt: new Date(),
        isActive: true
      };

      if (existingPlatformIndex >= 0) {
        session.platformAccess[existingPlatformIndex] = newPlatformAccess;
      } else {
        session.platformAccess.push(newPlatformAccess);
      }

      await redisClient.setEx(
        `session:${decoded.userId}`,
        AUTH_CONFIG.sessionExpiry,
        JSON.stringify(session)
      );
    }

    return res.json({
      message: 'Platform access granted',
      platform: validatedData.platform,
      permissions: validatedData.permissions,
      ecosystem: 'fanz-unified'
    });

  } catch (error) {
    console.error('Platform access error:', error);
    return res.status(500).json({
      error: 'Failed to grant platform access',
      ecosystem: 'fanz-unified'
    });
  }
});

// 👤 User Profile
app.get('/api/user/profile', 
  createStandardLimiterIP('profile'),
  async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        error: 'Access token required',
        ecosystem: 'fanz-unified'
      });
    }

    let decoded: any;
    try {
      const secret = new TextEncoder().encode(AUTH_CONFIG.jwtSecret);
      const { payload } = await jose.jwtVerify(token, secret, {
        issuer: 'fanz.eco',
        audience: 'fanz-auth'
      });
      decoded = payload;
    } catch (error) {
      return res.status(401).json({
        error: 'Invalid access token',
        ecosystem: 'fanz-unified'
      });
    }

    // Get session from Redis (includes latest platform access)
    const sessionData = await redisClient.get(`session:${decoded.userId}`);
    if (!sessionData) {
      return res.status(401).json({
        error: 'Session expired',
        ecosystem: 'fanz-unified'
      });
    }

    const session: UserSession = JSON.parse(sessionData);

    return res.json({
      user: {
        id: decoded.userId,
        username: session.username,
        email: session.email,
        role: session.role
      },
      platformAccess: session.platformAccess,
      lastActivity: session.lastActivity,
      ecosystem: 'fanz-unified'
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    return res.status(500).json({
      error: 'Failed to fetch profile',
      ecosystem: 'fanz-unified'
    });
  }
});

// 🔒 Token Validation Endpoint (for other services)
app.post('/api/auth/validate', 
  applyMultipleRateLimiters([
    createTokenLimiterIP('validate'),
    createTokenLimiterUser('validate'),
    createTokenLimiterUserLong('validate')
  ]),
  async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(401).json({
        valid: false,
        error: 'Token required'
      });
    }

    let decoded: any;
    try {
      const secret = new TextEncoder().encode(AUTH_CONFIG.jwtSecret);
      const { payload } = await jose.jwtVerify(token, secret, {
        issuer: 'fanz.eco',
        audience: 'fanz-auth'
      });
      decoded = payload;
    } catch (error) {
      return res.status(401).json({
        valid: false,
        error: 'Invalid token',
        ecosystem: 'fanz-unified'
      });
    }
    
    // Check session exists
    const sessionData = await redisClient.get(`session:${decoded.userId}`);
    if (!sessionData) {
      return res.status(401).json({
        valid: false,
        error: 'Session expired'
      });
    }

    const session: UserSession = JSON.parse(sessionData);

    return res.json({
      valid: true,
      user: {
        id: decoded.userId,
        username: session.username,
        role: session.role
      },
      platformAccess: session.platformAccess,
      ecosystem: 'fanz-unified'
    });

  } catch (error) {
    return res.status(401).json({
      valid: false,
      error: 'Invalid token'
    });
  }
});

// 💥 Initialize Services
const startAuthService = async () => {
  try {
    // Test database connection
    await dbPool.query('SELECT 1');
    console.log('📊 Database connected successfully');

    // Connect to Redis
    await redisClient.connect();
    console.log('💶 Redis connected successfully');
    
    // Initialize rate limiting with Redis store
    initializeRateLimitStore(redisClient as any);
    console.log('🚦 Rate limiting initialized');

    // Start server
    app.listen(AUTH_CONFIG.port, () => {
      console.log(`🔐 FANZ Auth Service running on port ${AUTH_CONFIG.port}`);
      console.log(`🌐 Health Check: http://localhost:${AUTH_CONFIG.port}/health`);
      console.log(`🎯 Ecosystem: fanz-unified`);
    });

  } catch (error) {
    console.error('❌ Failed to start auth service:', error);
    process.exit(1);
  }
};

// 🔄 Graceful Shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Auth service shutting down gracefully...');
  await redisClient.quit();
  await dbPool.end();
  process.exit(0);
});

// Start the service
startAuthService();

export default app;