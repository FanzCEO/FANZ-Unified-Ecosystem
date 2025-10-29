import { Request, Response } from 'express';
import { paymentRepository, CreateTransactionInput, CreateSubscriptionInput } from '../models/payment.model';
import { Logger } from '../utils/logger';
import { MetricsCollector } from '../middleware/metrics';
import { 
  ValidationError, 
  AuthenticationError, 
  NotFoundError,
  ForbiddenError,
  ConflictError 
} from '../middleware/errorHandler';
import { asyncHandler } from '../middleware/errorHandler';
import Joi from 'joi';

const logger = new Logger('PaymentController');

// Validation schemas
const createTransactionSchema = Joi.object({
  transaction_type: Joi.string().valid(
    'subscription', 'tip', 'content_purchase', 'withdrawal', 'refund', 'commission', 'platform_fee', 'chargeback'
  ).required(),
  recipient_id: Joi.string().uuid().when('transaction_type', {
    is: Joi.string().valid('tip', 'content_purchase', 'subscription'),
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  amount: Joi.number().positive().required(),
  currency: Joi.string().length(3).default('USD'),
  description: Joi.string().max(500).optional(),
  reference_id: Joi.string().uuid().optional(),
  reference_type: Joi.string().optional(),
  payment_method: Joi.string().optional(),
  payment_method_details: Joi.object().optional(),
  metadata: Joi.object().optional()
});

const createSubscriptionPlanSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(2000).optional(),
  price: Joi.number().min(0).max(9999.99).required(),
  currency: Joi.string().length(3).default('USD'),
  billing_cycle: Joi.string().valid('monthly', 'quarterly', 'yearly', 'lifetime').required(),
  features: Joi.array().items(Joi.string()).optional(),
  benefits: Joi.object().optional(),
  max_subscribers: Joi.number().integer().min(1).optional(),
  trial_period_days: Joi.number().integer().min(0).max(365).default(0)
});

const subscribeSchema = Joi.object({
  creator_id: Joi.string().uuid().required(),
  plan_id: Joi.string().uuid().required(),
  payment_method: Joi.string().optional(),
  payment_method_details: Joi.object().optional(),
  trial: Joi.boolean().default(false)
});

const tipSchema = Joi.object({
  creator_id: Joi.string().uuid().required(),
  amount: Joi.number().positive().required(),
  currency: Joi.string().length(3).default('USD'),
  message: Joi.string().max(500).optional(),
  content_id: Joi.string().uuid().optional(),
  payment_method: Joi.string().optional(),
  payment_method_details: Joi.object().optional()
});

const payoutRequestSchema = Joi.object({
  amount: Joi.number().positive().required(),
  currency: Joi.string().length(3).default('USD'),
  payout_method: Joi.string().valid('bank_transfer', 'paxum', 'crypto', 'check', 'store_credit').required(),
  payout_details: Joi.object().required()
});

export class PaymentController {

  // =====================================================
  // Transaction Management
  // =====================================================

  // Create new transaction
  createTransaction = asyncHandler(async (req: Request, res: Response) => {
    try {
      const user = req.user;
      
      if (!user) {
        throw new AuthenticationError('Authentication required');
      }

      // Validate input
      const { error, value } = createTransactionSchema.validate(req.body);
      if (error) {
        throw new ValidationError(error.details[0].message);
      }

      // Check if user has sufficient balance for outgoing transactions
      if (['tip', 'content_purchase', 'subscription'].includes(value.transaction_type)) {
        const balance = await paymentRepository.getUserBalance(user.userId, 'available', value.currency);
        if (!balance || balance.balance < value.amount) {
          throw new ValidationError('Insufficient balance');
        }
      }

      // Create transaction
      const transactionData: CreateTransactionInput = {
        ...value,
        sender_id: user.userId,
        fee_amount: this.calculatePlatformFee(value.amount, value.transaction_type)
      };

      const transaction = await paymentRepository.createTransaction(transactionData);

      logger.info('Transaction created successfully', {
        transactionId: transaction.id,
        userId: user.userId,
        type: value.transaction_type,
        amount: value.amount
      });

      // Record business metric
      MetricsCollector.recordBusinessEvent('transaction_created', value.transaction_type);

      res.status(201).json({
        success: true,
        message: 'Transaction created successfully',
        data: { transaction }
      });

    } catch (error) {
      logger.error('Create transaction failed', {
        error: (error instanceof Error ? error.message : String(error)),
        userId: req.user?.userId
      });
      throw error;
    }
  });

  // Process pending transaction
  processTransaction = asyncHandler(async (req: Request, res: Response) => {
    try {
      const user = req.user;
      const { transactionId } = req.params;
      
      if (!user) {
        throw new AuthenticationError('Authentication required');
      }

      // Check if user owns the transaction or is admin
      const transaction = await paymentRepository.getTransactionById(transactionId);
      if (!transaction) {
        throw new NotFoundError('Transaction not found');
      }

      if (transaction.sender_id !== user.userId && user.role !== 'admin') {
        throw new ForbiddenError('Access denied to this transaction');
      }

      // Process transaction
      const processedTransaction = await paymentRepository.processTransaction(transactionId);

      logger.info('Transaction processed successfully', {
        transactionId,
        userId: user.userId,
        amount: processedTransaction.amount
      });

      // Record business metric
      MetricsCollector.recordBusinessEvent('transaction_processed', processedTransaction.transaction_type);

      res.status(200).json({
        success: true,
        message: 'Transaction processed successfully',
        data: { transaction: processedTransaction }
      });

    } catch (error) {
      logger.error('Process transaction failed', {
        error: (error instanceof Error ? error.message : String(error)),
        transactionId: req.params.transactionId,
        userId: req.user?.userId
      });
      throw error;
    }
  });

  // Get user's transactions
  getUserTransactions = asyncHandler(async (req: Request, res: Response) => {
    try {
      const user = req.user;
      
      if (!user) {
        throw new AuthenticationError('Authentication required');
      }

      const { page = 1, limit = 20, type, status } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const result = await paymentRepository.getUserTransactions(user.userId, {
        limit: Number(limit),
        offset,
        type: type as string,
        status: status as string
      });

      res.status(200).json({
        success: true,
        data: {
          transactions: result.transactions,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: result.total,
            totalPages: Math.ceil(result.total / Number(limit))
          }
        }
      });

    } catch (error) {
      logger.error('Get user transactions failed', {
        error: (error instanceof Error ? error.message : String(error)),
        userId: req.user?.userId
      });
      throw error;
    }
  });

  // =====================================================
  // Balance Management
  // =====================================================

  // Get user balances
  getUserBalances = asyncHandler(async (req: Request, res: Response) => {
    try {
      const user = req.user;
      
      if (!user) {
        throw new AuthenticationError('Authentication required');
      }

      const balances = await paymentRepository.getUserBalances(user.userId);

      // Calculate total balance
      const totalBalance = balances
        .filter(b => b.balance_type === 'available')
        .reduce((sum, b) => sum + b.balance, 0);

      res.status(200).json({
        success: true,
        data: {
          balances,
          total_available: totalBalance,
          currencies: [...new Set(balances.map(b => b.currency))]
        }
      });

    } catch (error) {
      logger.error('Get user balances failed', {
        error: (error instanceof Error ? error.message : String(error)),
        userId: req.user?.userId
      });
      throw error;
    }
  });

  // =====================================================
  // Tipping System
  // =====================================================

  // Send tip to creator
  sendTip = asyncHandler(async (req: Request, res: Response) => {
    try {
      const user = req.user;
      
      if (!user) {
        throw new AuthenticationError('Authentication required');
      }

      // Validate input
      const { error, value } = tipSchema.validate(req.body);
      if (error) {
        throw new ValidationError(error.details[0].message);
      }

      // Check if user has sufficient balance
      const balance = await paymentRepository.getUserBalance(user.userId, 'available', value.currency);
      if (!balance || balance.balance < value.amount) {
        throw new ValidationError('Insufficient balance');
      }

      // Create tip transaction
      const feeAmount = this.calculatePlatformFee(value.amount, 'tip');
      const transactionData: CreateTransactionInput = {
        transaction_type: 'tip',
        sender_id: user.userId,
        recipient_id: value.creator_id,
        amount: value.amount,
        currency: value.currency,
        fee_amount: feeAmount,
        description: value.message || `Tip from ${user.username}`,
        reference_id: value.content_id,
        reference_type: value.content_id ? 'content_post' : 'profile',
        payment_method: value.payment_method,
        payment_method_details: value.payment_method_details,
        metadata: { message: value.message }
      };

      const transaction = await paymentRepository.createTransaction(transactionData);

      // Process transaction immediately for tips
      await paymentRepository.processTransaction(transaction.id);

      logger.info('Tip sent successfully', {
        transactionId: transaction.id,
        senderId: user.userId,
        recipientId: value.creator_id,
        amount: value.amount
      });

      // Record business metric
      MetricsCollector.recordBusinessEvent('tip_sent', 'tip');

      res.status(201).json({
        success: true,
        message: 'Tip sent successfully',
        data: { transaction }
      });

    } catch (error) {
      logger.error('Send tip failed', {
        error: (error instanceof Error ? error.message : String(error)),
        userId: req.user?.userId
      });
      throw error;
    }
  });

  // =====================================================
  // Subscription Management
  // =====================================================

  // Create subscription plan (creators only)
  createSubscriptionPlan = asyncHandler(async (req: Request, res: Response) => {
    try {
      const user = req.user;
      
      if (!user) {
        throw new AuthenticationError('Authentication required');
      }

      if (user.role !== 'creator' && user.role !== 'admin') {
        throw new ForbiddenError('Only creators can create subscription plans');
      }

      // Validate input
      const { error, value } = createSubscriptionPlanSchema.validate(req.body);
      if (error) {
        throw new ValidationError(error.details[0].message);
      }

      // Create subscription plan
      const plan = await paymentRepository.createSubscriptionPlan(user.userId, value);

      logger.info('Subscription plan created successfully', {
        planId: plan.id,
        creatorId: user.userId,
        name: plan.name,
        price: plan.price
      });

      // Record business metric
      MetricsCollector.recordBusinessEvent('subscription_plan_created', 'subscription');

      res.status(201).json({
        success: true,
        message: 'Subscription plan created successfully',
        data: { plan }
      });

    } catch (error) {
      logger.error('Create subscription plan failed', {
        error: (error instanceof Error ? error.message : String(error)),
        userId: req.user?.userId
      });
      throw error;
    }
  });

  // Subscribe to creator
  subscribe = asyncHandler(async (req: Request, res: Response) => {
    try {
      const user = req.user;
      
      if (!user) {
        throw new AuthenticationError('Authentication required');
      }

      // Validate input
      const { error, value } = subscribeSchema.validate(req.body);
      if (error) {
        throw new ValidationError(error.details[0].message);
      }

      // Get subscription plan to check price
      const plan = await paymentRepository.getSubscriptionPlan(value.plan_id);
      if (!plan) {
        throw new NotFoundError('Subscription plan not found');
      }

      // Check balance if not trial
      if (!value.trial || plan.trial_period_days === 0) {
        const balance = await paymentRepository.getUserBalance(user.userId, 'available', plan.currency);
        if (!balance || balance.balance < plan.price) {
          throw new ValidationError('Insufficient balance for subscription');
        }
      }

      // Create subscription
      const subscriptionData: CreateSubscriptionInput = {
        creator_id: value.creator_id,
        plan_id: value.plan_id,
        payment_method: value.payment_method,
        payment_method_details: value.payment_method_details,
        trial: value.trial && plan.trial_period_days > 0
      };

      const subscription = await paymentRepository.createSubscription(user.userId, subscriptionData);

      logger.info('Subscription created successfully', {
        subscriptionId: subscription.id,
        subscriberId: user.userId,
        creatorId: value.creator_id,
        planId: value.plan_id
      });

      // Record business metric
      MetricsCollector.recordBusinessEvent('subscription_created', subscription.is_trial ? 'trial' : 'paid');

      res.status(201).json({
        success: true,
        message: 'Subscription created successfully',
        data: { subscription }
      });

    } catch (error) {
      logger.error('Subscribe failed', {
        error: (error instanceof Error ? error.message : String(error)),
        userId: req.user?.userId
      });
      throw error;
    }
  });

  // Get user's subscriptions
  getUserSubscriptions = asyncHandler(async (req: Request, res: Response) => {
    try {
      const user = req.user;
      
      if (!user) {
        throw new AuthenticationError('Authentication required');
      }

      const { page = 1, limit = 20 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const query = `
        SELECT 
          s.*,
          sp.name as plan_name,
          sp.price as plan_price,
          sp.billing_cycle,
          u.username as creator_username,
          up.display_name as creator_display_name,
          up.avatar_url as creator_avatar_url
        FROM user_subscriptions s
        JOIN subscription_plans sp ON s.plan_id = sp.id
        JOIN users u ON s.creator_id = u.id
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE s.subscriber_id = $1
        ORDER BY s.created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await paymentRepository.db.query(query, [user.userId, Number(limit), offset]);
      const subscriptions = result.rows;

      res.status(200).json({
        success: true,
        data: {
          subscriptions,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            hasMore: subscriptions.length === Number(limit)
          }
        }
      });

    } catch (error) {
      logger.error('Get user subscriptions failed', {
        error: (error instanceof Error ? error.message : String(error)),
        userId: req.user?.userId
      });
      throw error;
    }
  });

  // =====================================================
  // Creator Payout Management
  // =====================================================

  // Request payout (creators only)
  requestPayout = asyncHandler(async (req: Request, res: Response) => {
    try {
      const user = req.user;
      
      if (!user) {
        throw new AuthenticationError('Authentication required');
      }

      if (user.role !== 'creator') {
        throw new ForbiddenError('Only creators can request payouts');
      }

      // Validate input
      const { error, value } = payoutRequestSchema.validate(req.body);
      if (error) {
        throw new ValidationError(error.details[0].message);
      }

      // Check available earnings balance
      const balance = await paymentRepository.getUserBalance(user.userId, 'earnings', value.currency);
      if (!balance || balance.balance < value.amount) {
        throw new ValidationError('Insufficient earnings balance');
      }

      // Calculate payout period (last 30 days)
      const periodEnd = new Date();
      const periodStart = new Date();
      periodStart.setDate(periodStart.getDate() - 30);

      // Create payout request
      const payout = await paymentRepository.createPayout({
        creator_id: user.userId,
        amount: value.amount,
        currency: value.currency,
        payout_method: value.payout_method,
        payout_details: value.payout_details,
        period_start: periodStart,
        period_end: periodEnd
      });

      logger.info('Payout requested successfully', {
        payoutId: payout.id,
        creatorId: user.userId,
        amount: value.amount,
        method: value.payout_method
      });

      // Record business metric
      MetricsCollector.recordBusinessEvent('payout_requested', value.payout_method);

      res.status(201).json({
        success: true,
        message: 'Payout requested successfully',
        data: { payout }
      });

    } catch (error) {
      logger.error('Request payout failed', {
        error: (error instanceof Error ? error.message : String(error)),
        userId: req.user?.userId
      });
      throw error;
    }
  });

  // Get creator earnings summary
  getEarningsSummary = asyncHandler(async (req: Request, res: Response) => {
    try {
      const user = req.user;
      
      if (!user) {
        throw new AuthenticationError('Authentication required');
      }

      if (user.role !== 'creator' && user.role !== 'admin') {
        throw new ForbiddenError('Access denied');
      }

      const { period = '30' } = req.query;
      const days = parseInt(period as string);

      // Validate days parameter to prevent SQL injection
      if (isNaN(days) || days < 0 || days > 3650) {
        throw new ValidationError('Invalid period parameter. Must be a number between 0 and 3650 days.');
      }

      // Get earnings summary - using parameterized interval to prevent SQL injection
      const summaryQuery = `
        SELECT
          COALESCE(SUM(CASE WHEN t.transaction_type = 'subscription' THEN t.net_amount ELSE 0 END), 0) as subscription_earnings,
          COALESCE(SUM(CASE WHEN t.transaction_type = 'tip' THEN t.net_amount ELSE 0 END), 0) as tip_earnings,
          COALESCE(SUM(CASE WHEN t.transaction_type = 'content_purchase' THEN t.net_amount ELSE 0 END), 0) as content_earnings,
          COALESCE(SUM(t.net_amount), 0) as total_earnings,
          COALESCE(SUM(t.fee_amount), 0) as total_fees,
          COUNT(*) as total_transactions
        FROM transactions t
        WHERE t.recipient_id = $1
          AND t.status = 'completed'
          AND t.created_at >= NOW() - make_interval(days => $2)
      `;

      const balanceQuery = `
        SELECT balance_type, balance, currency
        FROM user_balances
        WHERE user_id = $1
      `;

      const [summaryResult, balanceResult] = await Promise.all([
        paymentRepository.db.query(summaryQuery, [user.userId, days]),
        paymentRepository.db.query(balanceQuery, [user.userId])
      ]);

      const summary = summaryResult.rows[0];
      const balances = balanceResult.rows;

      res.status(200).json({
        success: true,
        data: {
          period_days: days,
          earnings_summary: {
            subscription_earnings: parseFloat(summary.subscription_earnings),
            tip_earnings: parseFloat(summary.tip_earnings),
            content_earnings: parseFloat(summary.content_earnings),
            total_earnings: parseFloat(summary.total_earnings),
            total_fees: parseFloat(summary.total_fees),
            total_transactions: parseInt(summary.total_transactions)
          },
          balances: balances.reduce((acc, balance) => {
            acc[balance.balance_type] = parseFloat(balance.balance);
            return acc;
          }, {} as Record<string, number>)
        }
      });

    } catch (error) {
      logger.error('Get earnings summary failed', {
        error: (error instanceof Error ? error.message : String(error)),
        userId: req.user?.userId
      });
      throw error;
    }
  });

  // =====================================================
  // Financial Reporting
  // =====================================================

  // Get financial dashboard (admin only)
  getFinancialDashboard = asyncHandler(async (req: Request, res: Response) => {
    try {
      const user = req.user;
      
      if (!user || user.role !== 'admin') {
        throw new ForbiddenError('Admin access required');
      }

      const { period = '30' } = req.query;
      const days = parseInt(period as string);

      // Validate days parameter to prevent SQL injection
      if (isNaN(days) || days < 0 || days > 3650) {
        throw new ValidationError('Invalid period parameter. Must be a number between 0 and 3650 days.');
      }

      // Get platform financial summary - using parameterized interval to prevent SQL injection
      const dashboardQuery = `
        SELECT
          COALESCE(SUM(t.amount), 0) as gross_revenue,
          COALESCE(SUM(t.fee_amount), 0) as platform_fees,
          COALESCE(SUM(t.net_amount), 0) as creator_payouts,
          COUNT(*) as total_transactions,
          COUNT(DISTINCT t.sender_id) as active_users,
          COUNT(DISTINCT t.recipient_id) as active_creators,
          COALESCE(SUM(CASE WHEN t.transaction_type = 'subscription' THEN t.amount ELSE 0 END), 0) as subscription_volume,
          COALESCE(SUM(CASE WHEN t.transaction_type = 'tip' THEN t.amount ELSE 0 END), 0) as tip_volume,
          COALESCE(SUM(CASE WHEN t.transaction_type = 'content_purchase' THEN t.amount ELSE 0 END), 0) as content_volume
        FROM transactions t
        WHERE t.status = 'completed'
          AND t.created_at >= NOW() - make_interval(days => $1)
      `;

      const subscriptionStatsQuery = `
        SELECT
          COUNT(*) as total_subscriptions,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_subscriptions,
          COUNT(CASE WHEN status = 'trial' THEN 1 END) as trial_subscriptions,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_subscriptions
        FROM user_subscriptions
        WHERE created_at >= NOW() - make_interval(days => $1)
      `;

      const [dashboardResult, subscriptionResult] = await Promise.all([
        paymentRepository.db.query(dashboardQuery, [days]),
        paymentRepository.db.query(subscriptionStatsQuery, [days])
      ]);

      const dashboard = dashboardResult.rows[0];
      const subscriptionStats = subscriptionResult.rows[0];

      res.status(200).json({
        success: true,
        data: {
          period_days: days,
          financial_summary: {
            gross_revenue: parseFloat(dashboard.gross_revenue),
            platform_fees: parseFloat(dashboard.platform_fees),
            creator_payouts: parseFloat(dashboard.creator_payouts),
            net_revenue: parseFloat(dashboard.platform_fees), // Platform's net revenue
            total_transactions: parseInt(dashboard.total_transactions),
            active_users: parseInt(dashboard.active_users),
            active_creators: parseInt(dashboard.active_creators)
          },
          revenue_breakdown: {
            subscription_volume: parseFloat(dashboard.subscription_volume),
            tip_volume: parseFloat(dashboard.tip_volume),
            content_volume: parseFloat(dashboard.content_volume)
          },
          subscription_stats: {
            total_subscriptions: parseInt(subscriptionStats.total_subscriptions),
            active_subscriptions: parseInt(subscriptionStats.active_subscriptions),
            trial_subscriptions: parseInt(subscriptionStats.trial_subscriptions),
            cancelled_subscriptions: parseInt(subscriptionStats.cancelled_subscriptions)
          }
        }
      });

    } catch (error) {
      logger.error('Get financial dashboard failed', {
        error: (error instanceof Error ? error.message : String(error)),
        userId: req.user?.userId
      });
      throw error;
    }
  });

  // Get ledger trial balance (admin only)
  getTrialBalance = asyncHandler(async (req: Request, res: Response) => {
    try {
      const user = req.user;
      
      if (!user || user.role !== 'admin') {
        throw new ForbiddenError('Admin access required');
      }

      // Get trial balance from database view
      const query = `SELECT * FROM account_balances ORDER BY account_code`;
      const result = await paymentRepository.db.query(query);

      const trialBalance = result.rows;
      const totalDebits = trialBalance.reduce((sum, acc) => sum + parseFloat(acc.total_debits), 0);
      const totalCredits = trialBalance.reduce((sum, acc) => sum + parseFloat(acc.total_credits), 0);

      res.status(200).json({
        success: true,
        data: {
          trial_balance: trialBalance,
          summary: {
            total_debits: totalDebits,
            total_credits: totalCredits,
            is_balanced: Math.abs(totalDebits - totalCredits) < 0.01
          }
        }
      });

    } catch (error) {
      logger.error('Get trial balance failed', {
        error: (error instanceof Error ? error.message : String(error)),
        userId: req.user?.userId
      });
      throw error;
    }
  });

  // =====================================================
  // Helper Methods
  // =====================================================

  private calculatePlatformFee(amount: number, transactionType: string): number {
    // Platform fee calculation based on transaction type
    const feeRates = {
      subscription: 0.15, // 15% platform fee
      tip: 0.10,          // 10% platform fee
      content_purchase: 0.20, // 20% platform fee
      withdrawal: 2.50,   // $2.50 flat fee
      default: 0.15       // Default 15%
    };

    const rate = feeRates[transactionType as keyof typeof feeRates] || feeRates.default;
    
    if (transactionType === 'withdrawal') {
      return rate; // Flat fee
    }
    
    return amount * rate; // Percentage fee
  }
}

// Export singleton instance
export const paymentController = new PaymentController();
export default PaymentController;