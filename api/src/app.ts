// 🚀 FANZ UNIFIED ECOSYSTEM - MAIN API APPLICATION
// Revolutionary creator economy platform API

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import { loggingMiddleware } from './middleware/logging';
import { validationMiddleware } from './middleware/validation';

// Import controllers
import { authController } from './controllers/authController';
import { userController } from './controllers/userController';
import { creatorController } from './controllers/creatorController';
import { contentController } from './controllers/contentController';
import { paymentController } from './controllers/paymentController';
import { blockchainController } from './controllers/blockchainController';
import { metaverseController } from './controllers/metaverseController';
import { quantumController } from './controllers/quantumController';
import { analyticsController } from './controllers/analyticsController';
import { adminController } from './controllers/adminController';

// Import services
import { DatabaseService } from './services/DatabaseService';
import { RedisService } from './services/RedisService';
import { BlockchainService } from './services/BlockchainService';
import { MetaverseService } from './services/MetaverseService';
import { QuantumService } from './services/QuantumService';
import { PaymentService } from './services/PaymentService';

// Environment configuration
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const API_RATE_LIMIT = parseInt(process.env.API_RATE_LIMIT || '100');
const CORS_ORIGIN = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3001', 'http://localhost:3002'];

// 🏗️ Create Express application
const app = express();
const server = createServer(app);

// 🌐 Setup Socket.IO for real-time communication
const io = new SocketIOServer(server, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// 🔒 Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// 🌐 CORS configuration
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 📦 General middleware
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(loggingMiddleware);

// ⚡ Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: API_RATE_LIMIT, // requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// 📚 Swagger API Documentation
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FANZ Unified Ecosystem API',
      version: '1.0.0',
      description: 'Revolutionary Creator Economy Platform - Complete API Documentation',
      contact: {
        name: 'FANZ Development Team',
        email: 'dev@fanz.eco'
      }
    },
    servers: [
      {
        url: NODE_ENV === 'production' ? 'https://api.fanz.eco' : `http://localhost:${PORT}`,
        description: NODE_ENV === 'production' ? 'Production Server' : 'Development Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/controllers/*.ts', './src/routes/*.ts'], // paths to files containing OpenAPI definitions
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'FANZ API Documentation'
}));

// 🏥 Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: NODE_ENV,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    services: {
      database: DatabaseService.isHealthy(),
      redis: RedisService.isHealthy(),
      blockchain: BlockchainService.isHealthy(),
      metaverse: MetaverseService.isHealthy(),
      quantum: QuantumService.isHealthy()
    }
  });
});

// 🔍 API status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    api: 'FANZ Unified Ecosystem',
    version: '1.0.0',
    status: 'operational',
    features: {
      blockchain: true,
      metaverse: true,
      quantumAI: true,
      creators: true,
      payments: true,
      analytics: true
    },
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      creators: '/api/creators',
      content: '/api/content',
      payments: '/api/payments',
      blockchain: '/api/blockchain',
      metaverse: '/api/metaverse',
      quantum: '/api/quantum',
      analytics: '/api/analytics',
      admin: '/api/admin'
    }
  });
});

// 🔐 Authentication routes (public)
app.use('/api/auth', authController);

// 👤 User management routes
app.use('/api/users', authMiddleware, userController);

// 🎭 Creator routes
app.use('/api/creators', authMiddleware, creatorController);

// 📱 Content management routes
app.use('/api/content', authMiddleware, contentController);

// 💰 Payment routes
app.use('/api/payments', authMiddleware, paymentController);

// ⛓️ Blockchain routes
app.use('/api/blockchain', authMiddleware, blockchainController);

// 🌐 Metaverse routes
app.use('/api/metaverse', authMiddleware, metaverseController);

// 🔬 Quantum AI routes
app.use('/api/quantum', authMiddleware, quantumController);

// 📊 Analytics routes
app.use('/api/analytics', authMiddleware, analyticsController);

// 🛡️ Admin routes (special permissions)
app.use('/api/admin', authMiddleware, adminController);

// 🌐 Socket.IO real-time event handlers
io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // 👤 User events
  socket.on('user:join', async (data) => {
    try {
      socket.join(`user:${data.userId}`);
      socket.emit('user:joined', { success: true });
    } catch (error) {
      socket.emit('error', { message: 'Failed to join user room' });
    }
  });

  // 🎭 Creator events
  socket.on('creator:live', async (data) => {
    try {
      socket.join(`creator:${data.creatorId}`);
      socket.to(`creator:${data.creatorId}`).emit('creator:wentLive', data);
    } catch (error) {
      socket.emit('error', { message: 'Failed to broadcast live status' });
    }
  });

  // 🌐 Metaverse events
  socket.on('metaverse:joinSpace', async (data) => {
    try {
      socket.join(`metaverse:${data.spaceId}`);
      socket.to(`metaverse:${data.spaceId}`).emit('metaverse:userJoined', {
        userId: data.userId,
        avatar: data.avatar,
        timestamp: new Date()
      });
    } catch (error) {
      socket.emit('error', { message: 'Failed to join metaverse space' });
    }
  });

  // 💰 Payment events
  socket.on('payment:tip', async (data) => {
    try {
      socket.to(`creator:${data.creatorId}`).emit('payment:tipReceived', {
        amount: data.amount,
        message: data.message,
        fromUser: data.fromUser,
        timestamp: new Date()
      });
    } catch (error) {
      socket.emit('error', { message: 'Failed to process tip' });
    }
  });

  // ⛓️ Blockchain events
  socket.on('blockchain:tokenPurchase', async (data) => {
    try {
      socket.to(`creator:${data.creatorId}`).emit('blockchain:tokenPurchased', {
        buyer: data.buyer,
        amount: data.amount,
        price: data.price,
        timestamp: new Date()
      });
    } catch (error) {
      socket.emit('error', { message: 'Failed to process token purchase' });
    }
  });

  // 🔬 Quantum AI events
  socket.on('quantum:optimize', async (data) => {
    try {
      // Trigger quantum optimization
      const result = await QuantumService.optimizeContent(data.contentId, data.parameters);
      socket.emit('quantum:optimizationComplete', result);
    } catch (error) {
      socket.emit('error', { message: 'Quantum optimization failed' });
    }
  });

  // 📱 Content events
  socket.on('content:interaction', async (data) => {
    try {
      socket.to(`content:${data.contentId}`).emit('content:interactionUpdate', {
        type: data.interactionType,
        userId: data.userId,
        timestamp: new Date()
      });
    } catch (error) {
      socket.emit('error', { message: 'Failed to broadcast interaction' });
    }
  });

  // 🔌 Disconnection
  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });

  // ❌ Error handling
  socket.on('error', (error) => {
    console.error(`🔌 Socket error for ${socket.id}:`, error);
  });
});

// ❌ 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `The endpoint ${req.method} ${req.originalUrl} does not exist`,
    availableEndpoints: {
      documentation: '/api/docs',
      status: '/api/status',
      health: '/health'
    }
  });
});

// 🛡️ Global error handler (must be last)
app.use(errorHandler);

// 🚀 Initialize services and start server
async function startServer() {
  try {
    console.log('🚀 Initializing FANZ Unified Ecosystem API...');

    // Initialize database
    console.log('🗄️  Connecting to database...');
    await DatabaseService.initialize();
    console.log('✅ Database connected');

    // Initialize Redis
    console.log('🔥 Connecting to Redis...');
    await RedisService.initialize();
    console.log('✅ Redis connected');

    // Initialize Blockchain service
    console.log('⛓️  Connecting to blockchain...');
    await BlockchainService.initialize();
    console.log('✅ Blockchain connected');

    // Initialize Metaverse service
    console.log('🌐 Initializing Metaverse service...');
    await MetaverseService.initialize();
    console.log('✅ Metaverse service ready');

    // Initialize Quantum service
    console.log('🔬 Initializing Quantum AI service...');
    await QuantumService.initialize();
    console.log('✅ Quantum AI service ready');

    // Initialize Payment service
    console.log('💰 Initializing Payment service...');
    await PaymentService.initialize();
    console.log('✅ Payment service ready');

    // Start HTTP server
    server.listen(PORT, () => {
      console.log(`🌟 FANZ Unified Ecosystem API is running!`);
      console.log(`📡 Server: http://localhost:${PORT}`);
      console.log(`📚 API Docs: http://localhost:${PORT}/api/docs`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
      console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
      console.log(`🌍 Environment: ${NODE_ENV}`);
      console.log(`⚡ Rate Limit: ${API_RATE_LIMIT} requests/15min`);
    });

    // Graceful shutdown handler
    const gracefulShutdown = async (signal: string) => {
      console.log(`🛑 Received ${signal}. Starting graceful shutdown...`);
      
      server.close(async (err) => {
        if (err) {
          console.error('❌ Error during server shutdown:', err);
          process.exit(1);
        }

        try {
          // Close service connections
          await DatabaseService.close();
          await RedisService.close();
          await BlockchainService.close();
          await MetaverseService.close();
          await QuantumService.close();
          await PaymentService.close();
          
          console.log('✅ Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error during service shutdown:', error);
          process.exit(1);
        }
      });
    };

    // Handle process termination
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // nodemon restart

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// 🎯 Start the server
if (require.main === module) {
  startServer();
}

export { app, server, io };

// 🌟 REVOLUTIONARY API FEATURES:
// ✅ Express.js with TypeScript
// ✅ Real-time Socket.IO integration
// ✅ Comprehensive security (Helmet, CORS, Rate Limiting)
// ✅ Auto-generated Swagger API documentation
// ✅ Health check and status endpoints
// ✅ Graceful shutdown handling
// ✅ Multi-service integration (DB, Redis, Blockchain, Metaverse, Quantum)
// ✅ Real-time event broadcasting
// ✅ Error handling and validation
// ✅ Authentication middleware
// ✅ Logging and monitoring
// ✅ Development and production optimizations