import { 
  createMockRequest, 
  createMockResponse, 
  mockUser, 
  mockCreator, 
  mockAdmin, 
  mockTransaction,
  mockSubscriptionPlan,
  mockBalance,
  mockDb 
} from '../setup';
import { PaymentController } from '../../controllers/payment.controller';

// Mock dependencies
jest.mock('../../models/payment.model', () => ({
  paymentRepository: {
    db: mockDb,
    createTransaction: jest.fn(),
    processTransaction: jest.fn(),
    getUserTransactions: jest.fn(),
    getUserBalances: jest.fn(),
    getUserBalance: jest.fn(),
    createSubscriptionPlan: jest.fn(),
    getSubscriptionPlan: jest.fn(),
    createSubscription: jest.fn(),
    createPayout: jest.fn(),
    getTransactionById: jest.fn()
  }
}));

jest.mock('../../utils/logger', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }))
}));

jest.mock('../../middleware/metrics', () => ({
  MetricsCollector: {
    recordBusinessEvent: jest.fn()
  }
}));

import { paymentRepository } from '../../models/payment.model';

describe('PaymentController', () => {
  let paymentController: PaymentController;
  let mockRequest: any;
  let mockResponse: any;
  let mockNext: any;

  beforeEach(() => {
    paymentController = new PaymentController();
    mockRequest = createMockRequest();
    mockResponse = createMockResponse();
    mockNext = jest.fn();
  });

  describe('createTransaction', () => {
    const validTransactionData = {
      transaction_type: 'tip',
      recipient_id: 'creator-123',
      amount: 10.00,
      currency: 'USD',
      description: 'Test tip'
    };

    it('should create a transaction successfully', async () => {
      mockRequest.body = validTransactionData;
      mockRequest.user = mockUser;

      // Mock balance check
      (paymentRepository.getUserBalance as jest.Mock).mockResolvedValue({
        balance: 100.00
      });

      // Mock transaction creation
      (paymentRepository.createTransaction as jest.Mock).mockResolvedValue(mockTransaction);

      await paymentController.createTransaction(mockRequest, mockResponse, mockNext);

      expect(paymentRepository.getUserBalance).toHaveBeenCalledWith(
        mockUser.userId, 'available', 'USD'
      );
      expect(paymentRepository.createTransaction).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Transaction created successfully',
        data: { transaction: mockTransaction }
      });
    });

    it('should fail when user has insufficient balance', async () => {
      mockRequest.body = validTransactionData;
      mockRequest.user = mockUser;

      // Mock insufficient balance
      (paymentRepository.getUserBalance as jest.Mock).mockResolvedValue({
        balance: 5.00 // Less than the transaction amount
      });

      await expect(
        paymentController.createTransaction(mockRequest, mockResponse, mockNext)
      ).rejects.toThrow('Insufficient balance');
    });

    it('should fail when user is not authenticated', async () => {
      mockRequest.body = validTransactionData;
      mockRequest.user = null;

      await expect(
        paymentController.createTransaction(mockRequest, mockResponse, mockNext)
      ).rejects.toThrow('Authentication required');
    });

    it('should validate transaction type', async () => {
      mockRequest.body = {
        ...validTransactionData,
        transaction_type: 'invalid_type'
      };
      mockRequest.user = mockUser;

      await expect(
        paymentController.createTransaction(mockRequest, mockResponse, mockNext)
      ).rejects.toThrow();
    });
  });

  describe('sendTip', () => {
    const validTipData = {
      creator_id: 'creator-123',
      amount: 5.00,
      currency: 'USD',
      message: 'Great content!'
    };

    it('should send a tip successfully', async () => {
      mockRequest.body = validTipData;
      mockRequest.user = mockUser;

      // Mock balance check
      (paymentRepository.getUserBalance as jest.Mock).mockResolvedValue({
        balance: 100.00
      });

      // Mock transaction creation and processing
      (paymentRepository.createTransaction as jest.Mock).mockResolvedValue(mockTransaction);
      (paymentRepository.processTransaction as jest.Mock).mockResolvedValue(mockTransaction);

      await paymentController.sendTip(mockRequest, mockResponse, mockNext);

      expect(paymentRepository.createTransaction).toHaveBeenCalled();
      expect(paymentRepository.processTransaction).toHaveBeenCalledWith(mockTransaction.id);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Tip sent successfully',
        data: { transaction: mockTransaction }
      });
    });

    it('should fail when tip amount is invalid', async () => {
      mockRequest.body = {
        ...validTipData,
        amount: -5.00 // Negative amount
      };
      mockRequest.user = mockUser;

      await expect(
        paymentController.sendTip(mockRequest, mockResponse, mockNext)
      ).rejects.toThrow();
    });
  });

  describe('createSubscriptionPlan', () => {
    const validPlanData = {
      name: 'Premium Plan',
      description: 'Access to premium content',
      price: 9.99,
      currency: 'USD',
      billing_cycle: 'monthly',
      trial_period_days: 7
    };

    it('should create subscription plan successfully for creator', async () => {
      mockRequest.body = validPlanData;
      mockRequest.user = mockCreator;

      (paymentRepository.createSubscriptionPlan as jest.Mock).mockResolvedValue(mockSubscriptionPlan);

      await paymentController.createSubscriptionPlan(mockRequest, mockResponse, mockNext);

      expect(paymentRepository.createSubscriptionPlan).toHaveBeenCalledWith(
        mockCreator.userId, 
        validPlanData
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Subscription plan created successfully',
        data: { plan: mockSubscriptionPlan }
      });
    });

    it('should fail when user is not a creator', async () => {
      mockRequest.body = validPlanData;
      mockRequest.user = mockUser; // Regular user, not creator

      await expect(
        paymentController.createSubscriptionPlan(mockRequest, mockResponse, mockNext)
      ).rejects.toThrow('Only creators can create subscription plans');
    });

    it('should validate plan price', async () => {
      mockRequest.body = {
        ...validPlanData,
        price: -1 // Invalid price
      };
      mockRequest.user = mockCreator;

      await expect(
        paymentController.createSubscriptionPlan(mockRequest, mockResponse, mockNext)
      ).rejects.toThrow();
    });
  });

  describe('subscribe', () => {
    const validSubscribeData = {
      creator_id: 'creator-123',
      plan_id: 'plan-123',
      trial: false
    };

    it('should subscribe to creator successfully', async () => {
      mockRequest.body = validSubscribeData;
      mockRequest.user = mockUser;

      // Mock plan lookup
      (paymentRepository.getSubscriptionPlan as jest.Mock).mockResolvedValue(mockSubscriptionPlan);

      // Mock balance check
      (paymentRepository.getUserBalance as jest.Mock).mockResolvedValue({
        balance: 100.00
      });

      const mockSubscription = {
        id: 'sub-123',
        subscriber_id: mockUser.userId,
        ...validSubscribeData,
        status: 'active',
        is_trial: false
      };
      (paymentRepository.createSubscription as jest.Mock).mockResolvedValue(mockSubscription);

      await paymentController.subscribe(mockRequest, mockResponse, mockNext);

      expect(paymentRepository.getSubscriptionPlan).toHaveBeenCalledWith(validSubscribeData.plan_id);
      expect(paymentRepository.createSubscription).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });

    it('should fail when subscription plan not found', async () => {
      mockRequest.body = validSubscribeData;
      mockRequest.user = mockUser;

      (paymentRepository.getSubscriptionPlan as jest.Mock).mockResolvedValue(null);

      await expect(
        paymentController.subscribe(mockRequest, mockResponse, mockNext)
      ).rejects.toThrow('Subscription plan not found');
    });
  });

  describe('getUserBalances', () => {
    it('should return user balances successfully', async () => {
      mockRequest.user = mockUser;

      const mockBalances = [
        { ...mockBalance, balance_type: 'available', balance: 100.00 },
        { ...mockBalance, balance_type: 'pending', balance: 25.00 },
        { ...mockBalance, balance_type: 'earnings', balance: 150.00 }
      ];

      (paymentRepository.getUserBalances as jest.Mock).mockResolvedValue(mockBalances);

      await paymentController.getUserBalances(mockRequest, mockResponse, mockNext);

      expect(paymentRepository.getUserBalances).toHaveBeenCalledWith(mockUser.userId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          balances: mockBalances,
          total_available: 100.00,
          currencies: ['USD']
        }
      });
    });
  });

  describe('requestPayout', () => {
    const validPayoutData = {
      amount: 50.00,
      currency: 'USD',
      payout_method: 'bank_transfer',
      payout_details: { account_id: 'acc-123' }
    };

    it('should request payout successfully for creator', async () => {
      mockRequest.body = validPayoutData;
      mockRequest.user = mockCreator;

      // Mock earnings balance check
      (paymentRepository.getUserBalance as jest.Mock).mockResolvedValue({
        balance: 100.00 // Sufficient earnings
      });

      const mockPayout = {
        id: 'payout-123',
        creator_id: mockCreator.userId,
        ...validPayoutData,
        status: 'pending'
      };
      (paymentRepository.createPayout as jest.Mock).mockResolvedValue(mockPayout);

      await paymentController.requestPayout(mockRequest, mockResponse, mockNext);

      expect(paymentRepository.getUserBalance).toHaveBeenCalledWith(
        mockCreator.userId, 'earnings', 'USD'
      );
      expect(paymentRepository.createPayout).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });

    it('should fail when user is not a creator', async () => {
      mockRequest.body = validPayoutData;
      mockRequest.user = mockUser; // Regular user

      await expect(
        paymentController.requestPayout(mockRequest, mockResponse, mockNext)
      ).rejects.toThrow('Only creators can request payouts');
    });

    it('should fail when insufficient earnings balance', async () => {
      mockRequest.body = validPayoutData;
      mockRequest.user = mockCreator;

      (paymentRepository.getUserBalance as jest.Mock).mockResolvedValue({
        balance: 25.00 // Less than payout amount
      });

      await expect(
        paymentController.requestPayout(mockRequest, mockResponse, mockNext)
      ).rejects.toThrow('Insufficient earnings balance');
    });
  });

  describe('getFinancialDashboard', () => {
    it('should return financial dashboard for admin', async () => {
      mockRequest.user = mockAdmin;
      mockRequest.query = { period: '30' };

      const mockDashboardData = {
        gross_revenue: 1000.00,
        platform_fees: 150.00,
        creator_payouts: 850.00,
        total_transactions: 100,
        active_users: 50,
        active_creators: 10
      };

      const mockSubscriptionData = {
        total_subscriptions: 25,
        active_subscriptions: 20,
        trial_subscriptions: 5,
        cancelled_subscriptions: 3
      };

      mockDb.query
        .mockResolvedValueOnce({ rows: [mockDashboardData] })
        .mockResolvedValueOnce({ rows: [mockSubscriptionData] });

      await paymentController.getFinancialDashboard(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          period_days: 30,
          financial_summary: expect.any(Object),
          subscription_stats: expect.any(Object)
        })
      });
    });

    it('should fail when user is not admin', async () => {
      mockRequest.user = mockUser; // Regular user

      await expect(
        paymentController.getFinancialDashboard(mockRequest, mockResponse, mockNext)
      ).rejects.toThrow('Admin access required');
    });
  });

  describe('processTransaction', () => {
    it('should process transaction successfully for owner', async () => {
      mockRequest.params = { transactionId: 'tx-123' };
      mockRequest.user = mockUser;

      const mockTx = { ...mockTransaction, sender_id: mockUser.userId };
      (paymentRepository.getTransactionById as jest.Mock).mockResolvedValue(mockTx);
      (paymentRepository.processTransaction as jest.Mock).mockResolvedValue(mockTx);

      await paymentController.processTransaction(mockRequest, mockResponse, mockNext);

      expect(paymentRepository.getTransactionById).toHaveBeenCalledWith('tx-123');
      expect(paymentRepository.processTransaction).toHaveBeenCalledWith('tx-123');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should fail when transaction not found', async () => {
      mockRequest.params = { transactionId: 'nonexistent' };
      mockRequest.user = mockUser;

      (paymentRepository.getTransactionById as jest.Mock).mockResolvedValue(null);

      await expect(
        paymentController.processTransaction(mockRequest, mockResponse, mockNext)
      ).rejects.toThrow('Transaction not found');
    });

    it('should fail when user does not own transaction', async () => {
      mockRequest.params = { transactionId: 'tx-123' };
      mockRequest.user = mockUser;

      const mockTx = { ...mockTransaction, sender_id: 'different-user' };
      (paymentRepository.getTransactionById as jest.Mock).mockResolvedValue(mockTx);

      await expect(
        paymentController.processTransaction(mockRequest, mockResponse, mockNext)
      ).rejects.toThrow('Access denied to this transaction');
    });

    it('should allow admin to process any transaction', async () => {
      mockRequest.params = { transactionId: 'tx-123' };
      mockRequest.user = mockAdmin;

      const mockTx = { ...mockTransaction, sender_id: 'different-user' };
      (paymentRepository.getTransactionById as jest.Mock).mockResolvedValue(mockTx);
      (paymentRepository.processTransaction as jest.Mock).mockResolvedValue(mockTx);

      await paymentController.processTransaction(mockRequest, mockResponse, mockNext);

      expect(paymentRepository.processTransaction).toHaveBeenCalledWith('tx-123');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  describe('calculatePlatformFee', () => {
    it('should calculate subscription fee correctly', () => {
      const controller = new PaymentController();
      const fee = (controller as any).calculatePlatformFee(100, 'subscription');
      expect(fee).toBe(15); // 15% of 100
    });

    it('should calculate tip fee correctly', () => {
      const controller = new PaymentController();
      const fee = (controller as any).calculatePlatformFee(100, 'tip');
      expect(fee).toBe(10); // 10% of 100
    });

    it('should calculate content purchase fee correctly', () => {
      const controller = new PaymentController();
      const fee = (controller as any).calculatePlatformFee(100, 'content_purchase');
      expect(fee).toBe(20); // 20% of 100
    });

    it('should return flat fee for withdrawals', () => {
      const controller = new PaymentController();
      const fee = (controller as any).calculatePlatformFee(100, 'withdrawal');
      expect(fee).toBe(2.50); // Flat $2.50 fee
    });

    it('should use default fee for unknown transaction types', () => {
      const controller = new PaymentController();
      const fee = (controller as any).calculatePlatformFee(100, 'unknown');
      expect(fee).toBe(15); // Default 15%
    });
  });
});