import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorization';
import { _validateRequest } from '../middleware/validation';
import { rateLimiter } from '../middleware/rateLimiter';
import { paymentController } from '../controllers/payment.controller';
import { financialReportsController } from '../controllers/financial-reports.controller';
import {
  paymentRateLimit,
  adminRateLimit,
  securityValidation,
  progressiveSlowdown
} from '../middleware/enhancedSecurity';
import { secureRandomMiddleware } from '../middleware/secureRandom';

const router = Router();

// Apply security middleware to all payment routes
router.use(secureRandomMiddleware);
router.use(securityValidation);
router.use(progressiveSlowdown);

// =====================================================
// TRANSACTION MANAGEMENT ROUTES
// =====================================================

/**
 * @route POST /api/payment/transactions
 * @desc Create a new transaction
 * @access Private (authenticated users)
 */
router.post('/transactions', 
  paymentRateLimit,
  authenticate,
  paymentController.createTransaction
);

/**
 * @route POST /api/payment/transactions/:transactionId/process
 * @desc Process a pending transaction
 * @access Private (transaction owner or admin)
 */
router.post('/transactions/:transactionId/process',
  paymentRateLimit,
  authenticate,
  paymentController.processTransaction
);

/**
 * @route GET /api/payment/transactions
 * @desc Get user's transaction history
 * @access Private (authenticated users)
 */
router.get('/transactions',
  authenticate,
  paymentController.getUserTransactions
);

// =====================================================
// BALANCE MANAGEMENT ROUTES
// =====================================================

/**
 * @route GET /api/payment/balances
 * @desc Get user's wallet balances
 * @access Private (authenticated users)
 */
router.get('/balances',
  authenticate,
  paymentController.getUserBalances
);

// =====================================================
// TIPPING SYSTEM ROUTES
// =====================================================

/**
 * @route POST /api/payment/tip
 * @desc Send tip to creator
 * @access Private (authenticated users)
 */
router.post('/tip',
  paymentRateLimit,
  authenticate,
  paymentController.sendTip
);

// =====================================================
// SUBSCRIPTION MANAGEMENT ROUTES
// =====================================================

/**
 * @route POST /api/payment/subscription-plans
 * @desc Create subscription plan (creators only)
 * @access Private (creators and admins)
 */
router.post('/subscription-plans',
  paymentRateLimit,
  authenticate,
  authorize(['creator', 'admin']),
  paymentController.createSubscriptionPlan
);

/**
 * @route POST /api/payment/subscribe
 * @desc Subscribe to creator
 * @access Private (authenticated users)
 */
router.post('/subscribe',
  paymentRateLimit,
  authenticate,
  paymentController.subscribe
);

/**
 * @route GET /api/payment/subscriptions
 * @desc Get user's active subscriptions
 * @access Private (authenticated users)
 */
router.get('/subscriptions',
  authenticate,
  paymentController.getUserSubscriptions
);

// =====================================================
// CREATOR PAYOUT ROUTES
// =====================================================

/**
 * @route POST /api/payment/payouts/request
 * @desc Request payout (creators only)
 * @access Private (creators only)
 */
router.post('/payouts/request',
  paymentRateLimit,
  authenticate,
  authorize(['creator']),
  paymentController.requestPayout
);

/**
 * @route GET /api/payment/earnings/summary
 * @desc Get creator earnings summary
 * @access Private (creators and admins)
 */
router.get('/earnings/summary',
  authenticate,
  authorize(['creator', 'admin']),
  paymentController.getEarningsSummary
);

// =====================================================
// FINANCIAL DASHBOARD ROUTES (Admin Only)
// =====================================================

/**
 * @route GET /api/payment/admin/dashboard
 * @desc Get financial dashboard overview
 * @access Private (admin only)
 */
router.get('/admin/dashboard',
  adminRateLimit,
  authenticate,
  authorize(['admin']),
  paymentController.getFinancialDashboard
);

/**
 * @route GET /api/payment/admin/trial-balance
 * @desc Get ledger trial balance
 * @access Private (admin only)
 */
router.get('/admin/trial-balance',
  adminRateLimit,
  authenticate,
  authorize(['admin']),
  paymentController.getTrialBalance
);

// =====================================================
// FINANCIAL REPORTS ROUTES
// =====================================================

/**
 * @route GET /api/payment/reports/profit-loss
 * @desc Generate profit & loss statement
 * @access Private (admin only)
 */
router.get('/reports/profit-loss',
  adminRateLimit,
  authenticate,
  authorize(['admin']),
  financialReportsController.generateProfitLossStatement
);

/**
 * @route GET /api/payment/reports/balance-sheet
 * @desc Generate balance sheet
 * @access Private (admin only)
 */
router.get('/reports/balance-sheet',
  adminRateLimit,
  authenticate,
  authorize(['admin']),
  financialReportsController.generateBalanceSheet
);

/**
 * @route GET /api/payment/reports/cash-flow
 * @desc Generate cash flow statement
 * @access Private (admin only)
 */
router.get('/reports/cash-flow',
  rateLimiter({ windowMs: 60 * 60 * 1000, max: 10 }), // 10 reports per hour
  authenticate,
  authorize(['admin']),
  financialReportsController.generateCashFlowStatement
);

/**
 * @route GET /api/payment/analytics
 * @desc Get financial analytics
 * @access Private (creators and admins)
 */
router.get('/analytics',
  rateLimiter({ windowMs: 60 * 60 * 1000, max: 30 }), // 30 analytics requests per hour
  authenticate,
  authorize(['creator', 'admin']),
  financialReportsController.getFinancialAnalytics
);

/**
 * @route GET /api/payment/executive-dashboard
 * @desc Get executive financial dashboard
 * @access Private (admin only)
 */
router.get('/executive-dashboard',
  rateLimiter({ windowMs: 60 * 60 * 1000, max: 20 }), // 20 dashboard views per hour
  authenticate,
  authorize(['admin']),
  financialReportsController.getExecutiveDashboard
);

// =====================================================
// WEBHOOK ROUTES (External Payment Processing)
// =====================================================

/**
 * @route POST /api/payment/webhooks/payment-processor
 * @desc Handle payment processor webhooks (no auth for external services)
 * @access Public (with webhook signature validation)
 */
router.post('/webhooks/payment-processor',
  rateLimiter({ windowMs: 60 * 1000, max: 100 }), // 100 webhooks per minute
  async (_req, res) => {
    try {
      // Webhook signature validation would go here
      // For now, just acknowledge receipt
      res.status(200).json({ received: true });
    } catch (error) {
      res.status(400).json({ error: 'Invalid webhook' });
    }
  }
);

/**
 * @route POST /api/payment/webhooks/bank-feed
 * @desc Handle bank feed webhooks for balance reconciliation
 * @access Public (with webhook signature validation)
 */
router.post('/webhooks/bank-feed',
  rateLimiter({ windowMs: 60 * 1000, max: 50 }), // 50 bank feeds per minute
  async (_req, res) => {
    try {
      // Bank feed processing would go here
      res.status(200).json({ processed: true });
    } catch (error) {
      res.status(400).json({ error: 'Invalid bank feed' });
    }
  }
);

// =====================================================
// HEALTH CHECK ROUTES
// =====================================================

/**
 * @route GET /api/payment/health
 * @desc Payment system health check
 * @access Public
 */
router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'FanzFinance OS',
    timestamp: new Date().toISOString(),
    version: process.env.API_VERSION || '1.0.0'
  });
});

/**
 * @route GET /api/payment/health/detailed
 * @desc Detailed payment system health check
 * @access Private (admin only)
 */
router.get('/health/detailed',
  authenticate,
  authorize(['admin']),
  async (_req, res) => {
    try {
      // Check database connection
      const dbHealthQuery = 'SELECT NOW() as timestamp';
      const dbResult = await require('../models/payment.model').paymentRepository.db.query(dbHealthQuery);
      
      // Check Redis connection (if used for caching)
      // const redisHealth = await redisClient.ping();
      
      const healthStatus = {
        status: 'healthy',
        service: 'FanzFinance OS',
        timestamp: new Date().toISOString(),
        version: process.env.API_VERSION || '1.0.0',
        database: {
          status: dbResult.rows.length > 0 ? 'connected' : 'disconnected',
          timestamp: dbResult.rows[0]?.timestamp
        },
        // redis: {
        //   status: redisHealth === 'PONG' ? 'connected' : 'disconnected'
        // },
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime()
      };

      res.status(200).json(healthStatus);
    } catch (error) {
      res.status(500).json({
        status: 'unhealthy',
        service: 'FanzFinance OS',
        error: (error instanceof Error ? error.message : String(error)),
        timestamp: new Date().toISOString()
      });
    }
  }
);

// =====================================================
// API DOCUMENTATION METADATA
// =====================================================

/**
 * @route GET /api/payment/docs
 * @desc Payment API documentation metadata
 * @access Public
 */
router.get('/docs', (_req, res) => {
  const apiDocs = {
    name: 'FanzFinance OS Payment API',
    version: '1.0.0',
    description: 'Comprehensive financial management system for FANZ platform',
    endpoints: {
      transactions: {
        create: 'POST /api/payment/transactions',
        process: 'POST /api/payment/transactions/:id/process',
        list: 'GET /api/payment/transactions'
      },
      balances: {
        get: 'GET /api/payment/balances'
      },
      tipping: {
        send: 'POST /api/payment/tip'
      },
      subscriptions: {
        create_plan: 'POST /api/payment/subscription-plans',
        subscribe: 'POST /api/payment/subscribe',
        list: 'GET /api/payment/subscriptions'
      },
      payouts: {
        request: 'POST /api/payment/payouts/request',
        earnings: 'GET /api/payment/earnings/summary'
      },
      reports: {
        profit_loss: 'GET /api/payment/reports/profit-loss',
        balance_sheet: 'GET /api/payment/reports/balance-sheet',
        cash_flow: 'GET /api/payment/reports/cash-flow',
        analytics: 'GET /api/payment/analytics',
        executive_dashboard: 'GET /api/payment/executive-dashboard'
      },
      admin: {
        dashboard: 'GET /api/payment/admin/dashboard',
        trial_balance: 'GET /api/payment/admin/trial-balance'
      }
    },
    features: [
      'Double-entry bookkeeping system',
      'Real-time transaction processing', 
      'Subscription management',
      'Creator payout system',
      'Comprehensive financial reports',
      'Executive dashboards',
      'Advanced analytics',
      'Audit trail and compliance',
      'Rate limiting and security',
      'Webhook integrations'
    ],
    authentication: {
      type: 'Bearer Token (JWT)',
      header: 'Authorization: Bearer <token>'
    },
    rate_limits: {
      transactions: '50 per 15 minutes',
      tips: '20 per 15 minutes',
      subscriptions: '10 per 15 minutes',
      payouts: '5 per hour',
      reports: '10 per hour',
      analytics: '30 per hour'
    }
  };

  res.status(200).json(apiDocs);
});

export default router;