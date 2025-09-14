import request from 'supertest';
import express from 'express';
import paymentRoutes from '../../routes/payment.routes';
import { 
  mockUser, 
  mockCreator, 
  mockAdmin, 
  mockTransaction,
  mockSubscriptionPlan 
} from '../setup';

// Mock dependencies
jest.mock('../../middleware/auth', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.user = mockUser; // Default to regular user
    next();
  }
}));

jest.mock('../../middleware/authorization', () => ({
  authorize: (roles: string[]) => (req: any, res: any, next: any) => {
    if (roles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({ error: 'Access denied' });
    }
  }
}));

jest.mock('../../middleware/rateLimiter', () => ({
  rateLimiter: () => (req: any, res: any, next: any) => next()
}));

jest.mock('../../controllers/payment.controller', () => ({
  paymentController: {
    createTransaction: jest.fn(),
    processTransaction: jest.fn(),
    getUserTransactions: jest.fn(),
    getUserBalances: jest.fn(),
    sendTip: jest.fn(),
    createSubscriptionPlan: jest.fn(),
    subscribe: jest.fn(),
    getUserSubscriptions: jest.fn(),
    requestPayout: jest.fn(),
    getEarningsSummary: jest.fn(),
    getFinancialDashboard: jest.fn(),
    getTrialBalance: jest.fn()
  }
}));

jest.mock('../../controllers/financial-reports.controller', () => ({
  financialReportsController: {
    generateProfitLossStatement: jest.fn(),
    generateBalanceSheet: jest.fn(),
    generateCashFlowStatement: jest.fn(),
    getFinancialAnalytics: jest.fn(),
    getExecutiveDashboard: jest.fn()
  }
}));

import { paymentController } from '../../controllers/payment.controller';
import { financialReportsController } from '../../controllers/financial-reports.controller';

describe('Payment Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/payment', paymentRoutes);
    
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('Transaction Management Routes', () => {
    describe('POST /api/payment/transactions', () => {
      it('should create a transaction successfully', async () => {
        const transactionData = {
          transaction_type: 'tip',
          recipient_id: 'creator-123',
          amount: 10.00,
          currency: 'USD'
        };

        (paymentController.createTransaction as jest.Mock).mockImplementation((req, res) => {
          res.status(201).json({
            success: true,
            message: 'Transaction created successfully',
            data: { transaction: mockTransaction }
          });
        });

        const response = await request(app)
          .post('/api/payment/transactions')
          .send(transactionData);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.transaction).toBeDefined();
        expect(paymentController.createTransaction).toHaveBeenCalled();
      });

      it('should handle validation errors', async () => {
        const invalidData = {
          transaction_type: 'invalid_type'
        };

        (paymentController.createTransaction as jest.Mock).mockImplementation((req, res) => {
          res.status(400).json({
            success: false,
            error: 'Invalid transaction type'
          });
        });

        const response = await request(app)
          .post('/api/payment/transactions')
          .send(invalidData);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });

    describe('POST /api/payment/transactions/:transactionId/process', () => {
      it('should process a transaction successfully', async () => {
        (paymentController.processTransaction as jest.Mock).mockImplementation((req, res) => {
          res.status(200).json({
            success: true,
            message: 'Transaction processed successfully',
            data: { transaction: mockTransaction }
          });
        });

        const response = await request(app)
          .post('/api/payment/transactions/tx-123/process');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(paymentController.processTransaction).toHaveBeenCalled();
      });
    });

    describe('GET /api/payment/transactions', () => {
      it('should return user transactions', async () => {
        (paymentController.getUserTransactions as jest.Mock).mockImplementation((req, res) => {
          res.status(200).json({
            success: true,
            data: {
              transactions: [mockTransaction],
              pagination: {
                page: 1,
                limit: 20,
                total: 1,
                totalPages: 1
              }
            }
          });
        });

        const response = await request(app)
          .get('/api/payment/transactions');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.transactions).toBeInstanceOf(Array);
        expect(paymentController.getUserTransactions).toHaveBeenCalled();
      });
    });
  });

  describe('Balance Management Routes', () => {
    describe('GET /api/payment/balances', () => {
      it('should return user balances', async () => {
        const mockBalances = [
          { balance_type: 'available', balance: 100.00, currency: 'USD' },
          { balance_type: 'earnings', balance: 50.00, currency: 'USD' }
        ];

        (paymentController.getUserBalances as jest.Mock).mockImplementation((req, res) => {
          res.status(200).json({
            success: true,
            data: {
              balances: mockBalances,
              total_available: 100.00,
              currencies: ['USD']
            }
          });
        });

        const response = await request(app)
          .get('/api/payment/balances');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.balances).toBeInstanceOf(Array);
        expect(paymentController.getUserBalances).toHaveBeenCalled();
      });
    });
  });

  describe('Tipping Routes', () => {
    describe('POST /api/payment/tip', () => {
      it('should send a tip successfully', async () => {
        const tipData = {
          creator_id: 'creator-123',
          amount: 5.00,
          currency: 'USD',
          message: 'Great content!'
        };

        (paymentController.sendTip as jest.Mock).mockImplementation((req, res) => {
          res.status(201).json({
            success: true,
            message: 'Tip sent successfully',
            data: { transaction: mockTransaction }
          });
        });

        const response = await request(app)
          .post('/api/payment/tip')
          .send(tipData);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(paymentController.sendTip).toHaveBeenCalled();
      });
    });
  });

  describe('Subscription Management Routes', () => {
    describe('POST /api/payment/subscription-plans', () => {
      it('should create subscription plan for creator', async () => {
        // Mock creator user
        const authenticate = require('../../middleware/auth').authenticate;
        authenticate.mockImplementation((req: any, res: any, next: any) => {
          req.user = mockCreator;
          next();
        });

        const planData = {
          name: 'Premium Plan',
          description: 'Access to premium content',
          price: 9.99,
          currency: 'USD',
          billing_cycle: 'monthly'
        };

        (paymentController.createSubscriptionPlan as jest.Mock).mockImplementation((req, res) => {
          res.status(201).json({
            success: true,
            message: 'Subscription plan created successfully',
            data: { plan: mockSubscriptionPlan }
          });
        });

        const response = await request(app)
          .post('/api/payment/subscription-plans')
          .send(planData);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(paymentController.createSubscriptionPlan).toHaveBeenCalled();
      });

      it('should deny access to regular users', async () => {
        const planData = {
          name: 'Premium Plan',
          price: 9.99,
          billing_cycle: 'monthly'
        };

        const response = await request(app)
          .post('/api/payment/subscription-plans')
          .send(planData);

        expect(response.status).toBe(403);
        expect(response.body.error).toBe('Access denied');
      });
    });

    describe('POST /api/payment/subscribe', () => {
      it('should subscribe to creator successfully', async () => {
        const subscribeData = {
          creator_id: 'creator-123',
          plan_id: 'plan-123'
        };

        (paymentController.subscribe as jest.Mock).mockImplementation((req, res) => {
          res.status(201).json({
            success: true,
            message: 'Subscription created successfully',
            data: { subscription: { id: 'sub-123', ...subscribeData } }
          });
        });

        const response = await request(app)
          .post('/api/payment/subscribe')
          .send(subscribeData);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(paymentController.subscribe).toHaveBeenCalled();
      });
    });

    describe('GET /api/payment/subscriptions', () => {
      it('should return user subscriptions', async () => {
        (paymentController.getUserSubscriptions as jest.Mock).mockImplementation((req, res) => {
          res.status(200).json({
            success: true,
            data: {
              subscriptions: [
                { id: 'sub-123', plan_name: 'Premium Plan', status: 'active' }
              ],
              pagination: { page: 1, limit: 20, hasMore: false }
            }
          });
        });

        const response = await request(app)
          .get('/api/payment/subscriptions');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.subscriptions).toBeInstanceOf(Array);
        expect(paymentController.getUserSubscriptions).toHaveBeenCalled();
      });
    });
  });

  describe('Creator Payout Routes', () => {
    describe('POST /api/payment/payouts/request', () => {
      it('should request payout for creator', async () => {
        // Mock creator user
        const authenticate = require('../../middleware/auth').authenticate;
        authenticate.mockImplementation((req: any, res: any, next: any) => {
          req.user = mockCreator;
          next();
        });

        const payoutData = {
          amount: 100.00,
          currency: 'USD',
          payout_method: 'bank_transfer',
          payout_details: { account_id: 'acc-123' }
        };

        (paymentController.requestPayout as jest.Mock).mockImplementation((req, res) => {
          res.status(201).json({
            success: true,
            message: 'Payout requested successfully',
            data: { payout: { id: 'payout-123', ...payoutData } }
          });
        });

        const response = await request(app)
          .post('/api/payment/payouts/request')
          .send(payoutData);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(paymentController.requestPayout).toHaveBeenCalled();
      });

      it('should deny access to regular users', async () => {
        const payoutData = {
          amount: 100.00,
          payout_method: 'bank_transfer'
        };

        const response = await request(app)
          .post('/api/payment/payouts/request')
          .send(payoutData);

        expect(response.status).toBe(403);
        expect(response.body.error).toBe('Access denied');
      });
    });

    describe('GET /api/payment/earnings/summary', () => {
      it('should return earnings summary for creator', async () => {
        // Mock creator user
        const authenticate = require('../../middleware/auth').authenticate;
        authenticate.mockImplementation((req: any, res: any, next: any) => {
          req.user = mockCreator;
          next();
        });

        (paymentController.getEarningsSummary as jest.Mock).mockImplementation((req, res) => {
          res.status(200).json({
            success: true,
            data: {
              period_days: 30,
              earnings_summary: {
                total_earnings: 500.00,
                subscription_earnings: 300.00,
                tip_earnings: 200.00
              },
              balances: {
                available: 100.00,
                earnings: 400.00
              }
            }
          });
        });

        const response = await request(app)
          .get('/api/payment/earnings/summary');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.earnings_summary).toBeDefined();
        expect(paymentController.getEarningsSummary).toHaveBeenCalled();
      });
    });
  });

  describe('Admin Routes', () => {
    describe('GET /api/payment/admin/dashboard', () => {
      it('should return financial dashboard for admin', async () => {
        // Mock admin user
        const authenticate = require('../../middleware/auth').authenticate;
        authenticate.mockImplementation((req: any, res: any, next: any) => {
          req.user = mockAdmin;
          next();
        });

        (paymentController.getFinancialDashboard as jest.Mock).mockImplementation((req, res) => {
          res.status(200).json({
            success: true,
            data: {
              period_days: 30,
              financial_summary: {
                gross_revenue: 10000.00,
                platform_fees: 1500.00,
                creator_payouts: 8500.00
              }
            }
          });
        });

        const response = await request(app)
          .get('/api/payment/admin/dashboard');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(paymentController.getFinancialDashboard).toHaveBeenCalled();
      });

      it('should deny access to regular users', async () => {
        const response = await request(app)
          .get('/api/payment/admin/dashboard');

        expect(response.status).toBe(403);
        expect(response.body.error).toBe('Access denied');
      });
    });

    describe('GET /api/payment/admin/trial-balance', () => {
      it('should return trial balance for admin', async () => {
        // Mock admin user
        const authenticate = require('../../middleware/auth').authenticate;
        authenticate.mockImplementation((req: any, res: any, next: any) => {
          req.user = mockAdmin;
          next();
        });

        (paymentController.getTrialBalance as jest.Mock).mockImplementation((req, res) => {
          res.status(200).json({
            success: true,
            data: {
              trial_balance: [
                { account_code: '1001', account_name: 'Cash', total_debits: 50000, total_credits: 0 }
              ],
              summary: {
                total_debits: 50000,
                total_credits: 50000,
                is_balanced: true
              }
            }
          });
        });

        const response = await request(app)
          .get('/api/payment/admin/trial-balance');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(paymentController.getTrialBalance).toHaveBeenCalled();
      });
    });
  });

  describe('Financial Reports Routes', () => {
    describe('GET /api/payment/reports/profit-loss', () => {
      it('should generate P&L statement for admin', async () => {
        // Mock admin user
        const authenticate = require('../../middleware/auth').authenticate;
        authenticate.mockImplementation((req: any, res: any, next: any) => {
          req.user = mockAdmin;
          next();
        });

        (financialReportsController.generateProfitLossStatement as jest.Mock).mockImplementation((req, res) => {
          res.status(200).json({
            success: true,
            data: {
              profit_loss_statement: {
                period: { period_type: 'monthly' },
                revenue: { total_revenue: 10000.00 },
                net_income: 2000.00
              }
            }
          });
        });

        const response = await request(app)
          .get('/api/payment/reports/profit-loss');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(financialReportsController.generateProfitLossStatement).toHaveBeenCalled();
      });
    });

    describe('GET /api/payment/reports/balance-sheet', () => {
      it('should generate balance sheet for admin', async () => {
        // Mock admin user
        const authenticate = require('../../middleware/auth').authenticate;
        authenticate.mockImplementation((req: any, res: any, next: any) => {
          req.user = mockAdmin;
          next();
        });

        (financialReportsController.generateBalanceSheet as jest.Mock).mockImplementation((req, res) => {
          res.status(200).json({
            success: true,
            data: {
              balance_sheet: {
                assets: { total_assets: 100000.00 },
                liabilities: { total_liabilities: 80000.00 },
                equity: { total_equity: 20000.00 }
              }
            }
          });
        });

        const response = await request(app)
          .get('/api/payment/reports/balance-sheet');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(financialReportsController.generateBalanceSheet).toHaveBeenCalled();
      });
    });

    describe('GET /api/payment/analytics', () => {
      it('should return financial analytics for admin', async () => {
        // Mock admin user
        const authenticate = require('../../middleware/auth').authenticate;
        authenticate.mockImplementation((req: any, res: any, next: any) => {
          req.user = mockAdmin;
          next();
        });

        (financialReportsController.getFinancialAnalytics as jest.Mock).mockImplementation((req, res) => {
          res.status(200).json({
            success: true,
            data: {
              analytics: [
                { period: '2023-01-01', revenue: 100.00, transactions: 5 }
              ]
            }
          });
        });

        const response = await request(app)
          .get('/api/payment/analytics?metric_type=revenue_trend');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(financialReportsController.getFinancialAnalytics).toHaveBeenCalled();
      });
    });
  });

  describe('Webhook Routes', () => {
    describe('POST /api/payment/webhooks/payment-processor', () => {
      it('should handle payment processor webhook', async () => {
        const webhookData = {
          event_type: 'payment.completed',
          payment_id: 'pay-123',
          amount: 50.00
        };

        const response = await request(app)
          .post('/api/payment/webhooks/payment-processor')
          .send(webhookData);

        expect(response.status).toBe(200);
        expect(response.body.received).toBe(true);
      });
    });

    describe('POST /api/payment/webhooks/bank-feed', () => {
      it('should handle bank feed webhook', async () => {
        const bankFeedData = {
          account_id: 'acc-123',
          transactions: [
            { amount: 100.00, type: 'credit', description: 'Platform fee' }
          ]
        };

        const response = await request(app)
          .post('/api/payment/webhooks/bank-feed')
          .send(bankFeedData);

        expect(response.status).toBe(200);
        expect(response.body.processed).toBe(true);
      });
    });
  });

  describe('Health Check Routes', () => {
    describe('GET /api/payment/health', () => {
      it('should return health status', async () => {
        const response = await request(app)
          .get('/api/payment/health');

        expect(response.status).toBe(200);
        expect(response.body.status).toBe('healthy');
        expect(response.body.service).toBe('FanzFinance OS');
        expect(response.body.timestamp).toBeDefined();
      });
    });

    describe('GET /api/payment/health/detailed', () => {
      it('should return detailed health status for admin', async () => {
        // Mock admin user
        const authenticate = require('../../middleware/auth').authenticate;
        authenticate.mockImplementation((req: any, res: any, next: any) => {
          req.user = mockAdmin;
          next();
        });

        const response = await request(app)
          .get('/api/payment/health/detailed');

        expect(response.status).toBe(200);
        expect(response.body.status).toBe('healthy');
        expect(response.body.database).toBeDefined();
        expect(response.body.uptime).toBeDefined();
      });
    });
  });

  describe('API Documentation Route', () => {
    describe('GET /api/payment/docs', () => {
      it('should return API documentation', async () => {
        const response = await request(app)
          .get('/api/payment/docs');

        expect(response.status).toBe(200);
        expect(response.body.name).toBe('FanzFinance OS Payment API');
        expect(response.body.version).toBe('1.0.0');
        expect(response.body.endpoints).toBeDefined();
        expect(response.body.features).toBeInstanceOf(Array);
        expect(response.body.authentication).toBeDefined();
        expect(response.body.rate_limits).toBeDefined();
      });
    });
  });
});