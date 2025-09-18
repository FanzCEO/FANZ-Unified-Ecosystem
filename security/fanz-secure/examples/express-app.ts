/**
 * @fanz/secure - Example Express App Integration
 * Demonstrates how to use @fanz/secure in FANZ Unified Ecosystem services
 */

import express from 'express';
import { 
  applySecurityMiddleware,
  createAuthSecurityMiddleware,
  createPaymentSecurityMiddleware,
  createWebhookSecurityMiddleware,
  createSecurityErrorHandler,
  createSecurityHealthCheck,
  validate,
  validatePagination,
  validateUuidParam,
  validateTransaction,
  validateContent,
  authRateLimit,
  paymentRateLimit,
  CommonSchemas,
  createSecurityLogger,
  emitSecurityEvent
} from '@fanz/secure';
import { z } from 'zod';

// ===============================
// EXAMPLE FANZ SERVICE
// ===============================

const app = express();
const logger = createSecurityLogger('ExampleService');

// ===============================
// APPLY SECURITY MIDDLEWARE
// ===============================

// Apply standard security middleware to all routes
applySecurityMiddleware(app);

// Body parsing (after security middleware)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===============================
// HEALTH CHECK ENDPOINT
// ===============================

app.get('/health', createSecurityHealthCheck());

// ===============================
// PUBLIC ROUTES
// ===============================

// Basic public endpoint with validation
app.get(
  '/api/public/posts',
  validatePagination,
  async (req, res) => {
    const validatedReq = req as any; // ValidatedRequest type
    const { page, limit } = validatedReq.validatedQuery;
    
    logger.info('Fetching public posts', {
      page,
      limit,
      requestId: validatedReq.security.requestId
    });
    
    res.json({
      posts: [],
      pagination: { page, limit, total: 0 }
    });
  }
);

// ===============================
// AUTHENTICATION ROUTES
// ===============================

// Apply stricter security for auth routes
const authRouter = express.Router();
authRouter.use(...createAuthSecurityMiddleware());

// Login endpoint with validation
authRouter.post(
  '/login',
  validate({
    body: z.object({
      email: CommonSchemas.email,
      password: z.string().min(8).max(128),
      rememberMe: z.boolean().optional().default(false),
      deviceInfo: z.object({
        userAgent: z.string().optional(),
        ipAddress: z.string().optional()
      }).optional()
    })
  }),
  async (req, res, next) => {
    try {
      const validatedReq = req as any;
      const { email, password, rememberMe, deviceInfo } = validatedReq.validatedBody;
      
      logger.audit('Login attempt', {
        email,
        rememberMe,
        ip: validatedReq.security.ipAddress,
        userAgent: validatedReq.security.userAgent
      });
      
      // Simulate authentication logic
      if (email === 'admin@fanz.eco' && password === 'correctpassword') {
        res.json({
          success: true,
          token: 'jwt-token-here',
          refreshToken: 'refresh-token-here',
          user: { id: 'user-123', email, role: 'admin' }
        });
      } else {
        // Emit security event for failed login
        await emitSecurityEvent({
          type: 'AUTH_FAILURE',
          severity: 'MEDIUM',
          context: validatedReq.security,
          details: {
            email,
            reason: 'Invalid credentials'
          },
          timestamp: new Date()
        });
        
        res.status(401).json({
          error: 'Invalid credentials',
          code: 'AUTH_FAILED'
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

// Registration endpoint
authRouter.post(
  '/register',
  validate({
    body: z.object({
      email: CommonSchemas.email,
      username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/, 'Invalid username format'),
      password: z.string().min(8).max(128)
        .regex(/(?=.*[a-z])/, 'Must contain lowercase letter')
        .regex(/(?=.*[A-Z])/, 'Must contain uppercase letter') 
        .regex(/(?=.*\d)/, 'Must contain number'),
      dateOfBirth: CommonSchemas.isoDate,
      acceptTerms: z.boolean().refine(val => val === true, 'Must accept terms'),
      marketingConsent: z.boolean().optional().default(false)
    })
  }),
  async (req, res, next) => {
    try {
      const validatedReq = req as any;
      const userData = validatedReq.validatedBody;
      
      logger.audit('User registration', {
        email: userData.email,
        username: userData.username,
        ip: validatedReq.security.ipAddress
      });
      
      // Simulate registration logic
      res.status(201).json({
        success: true,
        message: 'Registration successful',
        userId: 'user-new-123'
      });
    } catch (error) {
      next(error);
    }
  }
);

app.use('/api/auth', authRouter);

// ===============================
// PAYMENT ROUTES
// ===============================

const paymentsRouter = express.Router();
paymentsRouter.use(...createPaymentSecurityMiddleware());

// Create transaction endpoint
paymentsRouter.post(
  '/transactions',
  validateTransaction,
  async (req, res, next) => {
    try {
      const validatedReq = req as any;
      const transaction = validatedReq.validatedBody;
      
      logger.audit('Transaction created', {
        amount: transaction.amount,
        currency: transaction.currency,
        userId: validatedReq.security.userId,
        ip: validatedReq.security.ipAddress
      });
      
      // Simulate transaction processing
      res.json({
        id: 'txn-123456',
        status: 'pending',
        ...transaction,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get transaction by ID
paymentsRouter.get(
  '/transactions/:id',
  validateUuidParam('id'),
  async (req, res, next) => {
    try {
      const validatedReq = req as any;
      const { id } = validatedReq.validatedParams;
      
      logger.info('Transaction retrieved', {
        transactionId: id,
        userId: validatedReq.security.userId
      });
      
      res.json({
        id,
        status: 'completed',
        amount: 2500, // $25.00 in cents
        currency: 'USD',
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);

app.use('/api/payments', paymentsRouter);

// ===============================
// CONTENT ROUTES
// ===============================

const contentRouter = express.Router();

// Create content with validation
contentRouter.post(
  '/posts',
  validateContent,
  async (req, res, next) => {
    try {
      const validatedReq = req as any;
      const content = validatedReq.validatedBody;
      
      logger.audit('Content created', {
        title: content.title,
        category: content.category,
        isNSFW: content.isNSFW,
        userId: validatedReq.security.userId
      });
      
      res.status(201).json({
        id: 'post-123',
        ...content,
        authorId: validatedReq.security.userId,
        createdAt: new Date().toISOString(),
        status: 'published'
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get posts with pagination
contentRouter.get(
  '/posts',
  validatePagination,
  async (req, res) => {
    const validatedReq = req as any;
    const { page, limit, sortBy, sortOrder } = validatedReq.validatedQuery;
    
    res.json({
      posts: [
        {
          id: 'post-123',
          title: 'Sample Post',
          content: 'This is a sample post',
          authorId: 'user-123',
          createdAt: new Date().toISOString()
        }
      ],
      pagination: {
        page,
        limit,
        total: 1,
        pages: 1,
        sortBy,
        sortOrder
      }
    });
  }
);

app.use('/api/content', contentRouter);

// ===============================
// WEBHOOK ROUTES
// ===============================

const webhooksRouter = express.Router();
webhooksRouter.use(...createWebhookSecurityMiddleware());

// Webhook endpoint with signature verification
webhooksRouter.post(
  '/ccbill',
  // Raw body parser for webhook signature verification
  express.raw({ type: 'application/x-www-form-urlencoded' }),
  async (req, res, next) => {
    try {
      // In real implementation, verify webhook signature here
      const signature = req.headers['x-ccbill-signature'];
      
      if (!signature) {
        await emitSecurityEvent({
          type: 'WEBHOOK_SIGNATURE_FAILED',
          severity: 'HIGH',
          context: {
            requestId: (req as any).id,
            ipAddress: req.ip || 'unknown',
            userAgent: req.headers['user-agent'] || 'unknown',
            timestamp: new Date(),
            path: req.path,
            method: req.method
          },
          details: {
            reason: 'Missing signature header',
            webhook: 'ccbill'
          },
          timestamp: new Date()
        });
        
        return res.status(401).json({ error: 'Missing signature' });
      }
      
      logger.audit('Webhook received', {
        webhook: 'ccbill',
        signature: signature ? '[PRESENT]' : '[MISSING]',
        contentLength: req.headers['content-length']
      });
      
      res.json({ received: true });
    } catch (error) {
      next(error);
    }
  }
);

app.use('/api/webhooks', webhooksRouter);

// ===============================
// ERROR HANDLING
// ===============================

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Security error handler (must be last)
app.use(createSecurityErrorHandler());

// ===============================
// SERVER STARTUP
// ===============================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`🚀 FANZ Service started`, {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    securityEnabled: true
  });
});

export default app;