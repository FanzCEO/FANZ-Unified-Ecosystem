import { Request, Response } from 'express';
import { paymentRepository } from '../models/payment.model';
import { Logger } from '../utils/logger';
import { MetricsCollector } from '../middleware/metrics';
import { 
  ValidationError, 
  AuthenticationError, 
  NotFoundError,
  ForbiddenError 
} from '../middleware/errorHandler';
import { asyncHandler } from '../middleware/errorHandler';
import Joi from 'joi';

const logger = new Logger('FinancialReportsController');

// Validation schemas
const reportPeriodSchema = Joi.object({
  period_type: Joi.string().valid('monthly', 'quarterly', 'yearly', 'custom').default('monthly'),
  start_date: Joi.date().when('period_type', {
    is: 'custom',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  end_date: Joi.date().when('period_type', {
    is: 'custom',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  currency: Joi.string().length(3).default('USD'),
  format: Joi.string().valid('json', 'csv', 'pdf').default('json')
});

const analyticsQuerySchema = Joi.object({
  metric_type: Joi.string().valid(
    'revenue_trend', 'user_growth', 'creator_performance', 'subscription_metrics', 
    'geographic_distribution', 'payment_methods', 'retention_rates'
  ).required(),
  period: Joi.string().valid('7d', '30d', '90d', '1y').default('30d'),
  granularity: Joi.string().valid('daily', 'weekly', 'monthly').default('daily'),
  filters: Joi.object().optional()
});

export class FinancialReportsController {

  // =====================================================
  // Profit & Loss Reports
  // =====================================================

  // Generate P&L statement
  generateProfitLossStatement = asyncHandler(async (req: Request, res: Response) => {
    try {
      const user = req.user;
      
      if (!user || user.role !== 'admin') {
        throw new ForbiddenError('Admin access required');
      }

      // Validate input
      const { error, value } = reportPeriodSchema.validate(req.query);
      if (error) {
        throw new ValidationError(error.details[0].message);
      }

      const { periodStart, periodEnd } = this.calculatePeriodDates(value.period_type, value.start_date, value.end_date);

      // Revenue calculation
      const revenueQuery = `
        SELECT 
          COALESCE(SUM(CASE WHEN t.transaction_type = 'subscription' THEN t.fee_amount ELSE 0 END), 0) as subscription_revenue,
          COALESCE(SUM(CASE WHEN t.transaction_type = 'tip' THEN t.fee_amount ELSE 0 END), 0) as tip_revenue,
          COALESCE(SUM(CASE WHEN t.transaction_type = 'content_purchase' THEN t.fee_amount ELSE 0 END), 0) as content_revenue,
          COALESCE(SUM(t.fee_amount), 0) as total_revenue
        FROM transactions t
        WHERE t.status = 'completed'
          AND t.created_at >= $1
          AND t.created_at <= $2
          AND t.currency = $3
      `;

      // Operating expenses (for a digital platform)
      const expensesQuery = `
        SELECT 
          COALESCE(SUM(CASE WHEN t.transaction_type = 'withdrawal' THEN t.fee_amount ELSE 0 END), 0) as processing_fees,
          COALESCE(SUM(CASE WHEN t.transaction_type = 'refund' THEN t.amount ELSE 0 END), 0) as refunds,
          COALESCE(SUM(CASE WHEN t.transaction_type = 'chargeback' THEN t.amount ELSE 0 END), 0) as chargebacks
        FROM transactions t
        WHERE t.status = 'completed'
          AND t.created_at >= $1
          AND t.created_at <= $2
          AND t.currency = $3
      `;

      // User acquisition and platform costs (estimated based on activity)
      const operatingMetricsQuery = `
        SELECT 
          COUNT(DISTINCT t.sender_id) as active_users,
          COUNT(DISTINCT t.recipient_id) as active_creators,
          COUNT(*) as total_transactions,
          AVG(t.amount) as avg_transaction_value
        FROM transactions t
        WHERE t.status = 'completed'
          AND t.created_at >= $1
          AND t.created_at <= $2
      `;

      const [revenueResult, expensesResult, metricsResult] = await Promise.all([
        paymentRepository.db.query(revenueQuery, [periodStart, periodEnd, value.currency]),
        paymentRepository.db.query(expensesQuery, [periodStart, periodEnd, value.currency]),
        paymentRepository.db.query(operatingMetricsQuery, [periodStart, periodEnd])
      ]);

      const revenue = revenueResult.rows[0];
      const expenses = expensesResult.rows[0];
      const metrics = metricsResult.rows[0];

      // Calculate estimated operating expenses (as percentage of revenue)
      const totalRevenue = parseFloat(revenue.total_revenue);
      const estimatedOperatingExpenses = {
        server_costs: totalRevenue * 0.05,        // 5% of revenue
        support_costs: totalRevenue * 0.08,       // 8% of revenue
        marketing_costs: totalRevenue * 0.15,     // 15% of revenue
        legal_compliance: totalRevenue * 0.03,    // 3% of revenue
        payment_processing: parseFloat(expenses.processing_fees)
      };

      const totalOperatingExpenses = Object.values(estimatedOperatingExpenses)
        .reduce((sum, cost) => sum + cost, 0);

      // P&L Statement
      const profitLossStatement = {
        period: {
          start_date: periodStart.toISOString().split('T')[0],
          end_date: periodEnd.toISOString().split('T')[0],
          period_type: value.period_type,
          currency: value.currency
        },
        revenue: {
          subscription_revenue: parseFloat(revenue.subscription_revenue),
          tip_revenue: parseFloat(revenue.tip_revenue),
          content_revenue: parseFloat(revenue.content_revenue),
          total_revenue: totalRevenue
        },
        cost_of_revenue: {
          refunds: parseFloat(expenses.refunds),
          chargebacks: parseFloat(expenses.chargebacks),
          payment_processing: parseFloat(expenses.processing_fees),
          total_cost_of_revenue: parseFloat(expenses.refunds) + 
                                parseFloat(expenses.chargebacks) + 
                                parseFloat(expenses.processing_fees)
        },
        gross_profit: totalRevenue - (parseFloat(expenses.refunds) + parseFloat(expenses.chargebacks) + parseFloat(expenses.processing_fees)),
        operating_expenses: estimatedOperatingExpenses,
        total_operating_expenses: totalOperatingExpenses,
        operating_income: totalRevenue - totalOperatingExpenses,
        net_income: totalRevenue - totalOperatingExpenses, // Simplified (no tax calculation)
        metrics: {
          active_users: parseInt(metrics.active_users),
          active_creators: parseInt(metrics.active_creators),
          total_transactions: parseInt(metrics.total_transactions),
          avg_transaction_value: parseFloat(metrics.avg_transaction_value),
          revenue_per_user: totalRevenue / parseInt(metrics.active_users),
          profit_margin: ((totalRevenue - totalOperatingExpenses) / totalRevenue * 100).toFixed(2) + '%'
        }
      };

      logger.info('P&L statement generated', {
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        totalRevenue,
        netIncome: profitLossStatement.net_income
      });

      // Record business metric
      MetricsCollector.recordBusinessEvent('report_generated', 'profit_loss');

      res.status(200).json({
        success: true,
        data: { profit_loss_statement: profitLossStatement }
      });

    } catch (error) {
      logger.error('Generate P&L statement failed', {
        error: error.message,
        userId: req.user?.userId
      });
      throw error;
    }
  });

  // =====================================================
  // Balance Sheet Reports
  // =====================================================

  // Generate balance sheet
  generateBalanceSheet = asyncHandler(async (req: Request, res: Response) => {
    try {
      const user = req.user;
      
      if (!user || user.role !== 'admin') {
        throw new ForbiddenError('Admin access required');
      }

      // Validate input
      const { error, value } = reportPeriodSchema.validate(req.query);
      if (error) {
        throw new ValidationError(error.details[0].message);
      }

      const { periodEnd } = this.calculatePeriodDates(value.period_type, value.start_date, value.end_date);

      // Assets calculation
      const assetsQuery = `
        SELECT 
          COALESCE(SUM(CASE WHEN balance_type = 'available' THEN balance ELSE 0 END), 0) as cash_available,
          COALESCE(SUM(CASE WHEN balance_type = 'pending' THEN balance ELSE 0 END), 0) as cash_pending,
          COALESCE(SUM(CASE WHEN balance_type = 'escrow' THEN balance ELSE 0 END), 0) as cash_escrow,
          COALESCE(SUM(balance), 0) as total_user_balances
        FROM user_balances
        WHERE currency = $1
          AND updated_at <= $2
      `;

      // Liabilities calculation (amounts owed to creators)
      const liabilitiesQuery = `
        SELECT 
          COALESCE(SUM(CASE WHEN balance_type = 'earnings' THEN balance ELSE 0 END), 0) as creator_earnings_payable,
          COALESCE(SUM(CASE WHEN p.status = 'pending' THEN p.amount ELSE 0 END), 0) as pending_payouts
        FROM user_balances ub
        LEFT JOIN payouts p ON p.creator_id = ub.user_id AND p.status = 'pending'
        WHERE ub.currency = $1
          AND ub.updated_at <= $2
      `;

      // Platform reserve calculation
      const reserveQuery = `
        SELECT 
          COALESCE(SUM(fee_amount), 0) as total_fees_collected,
          COALESCE(SUM(CASE WHEN status = 'completed' THEN fee_amount ELSE 0 END), 0) as realized_fees
        FROM transactions
        WHERE currency = $1
          AND created_at <= $2
      `;

      const [assetsResult, liabilitiesResult, reserveResult] = await Promise.all([
        paymentRepository.db.query(assetsQuery, [value.currency, periodEnd]),
        paymentRepository.db.query(liabilitiesQuery, [value.currency, periodEnd]),
        paymentRepository.db.query(reserveQuery, [value.currency, periodEnd])
      ]);

      const assets = assetsResult.rows[0];
      const liabilities = liabilitiesResult.rows[0];
      const reserves = reserveResult.rows[0];

      // Balance Sheet Structure
      const balanceSheet = {
        as_of_date: periodEnd.toISOString().split('T')[0],
        currency: value.currency,
        assets: {
          current_assets: {
            cash_and_cash_equivalents: {
              available_cash: parseFloat(assets.cash_available),
              pending_settlements: parseFloat(assets.cash_pending),
              escrow_funds: parseFloat(assets.cash_escrow),
              total_cash: parseFloat(assets.cash_available) + parseFloat(assets.cash_pending) + parseFloat(assets.cash_escrow)
            },
            platform_reserves: parseFloat(reserves.realized_fees),
            total_current_assets: parseFloat(assets.total_user_balances) + parseFloat(reserves.realized_fees)
          },
          total_assets: parseFloat(assets.total_user_balances) + parseFloat(reserves.realized_fees)
        },
        liabilities: {
          current_liabilities: {
            creator_payables: parseFloat(liabilities.creator_earnings_payable),
            pending_payouts: parseFloat(liabilities.pending_payouts),
            user_wallet_balances: parseFloat(assets.cash_available),
            total_current_liabilities: parseFloat(liabilities.creator_earnings_payable) + 
                                     parseFloat(liabilities.pending_payouts) + 
                                     parseFloat(assets.cash_available)
          },
          total_liabilities: parseFloat(liabilities.creator_earnings_payable) + 
                           parseFloat(liabilities.pending_payouts) + 
                           parseFloat(assets.cash_available)
        },
        equity: {
          retained_earnings: parseFloat(reserves.realized_fees),
          total_equity: parseFloat(reserves.realized_fees)
        },
        verification: {
          total_liabilities_and_equity: parseFloat(reserves.realized_fees) + 
                                       parseFloat(liabilities.creator_earnings_payable) + 
                                       parseFloat(liabilities.pending_payouts) + 
                                       parseFloat(assets.cash_available),
          is_balanced: Math.abs(
            (parseFloat(assets.total_user_balances) + parseFloat(reserves.realized_fees)) -
            (parseFloat(reserves.realized_fees) + parseFloat(liabilities.creator_earnings_payable) + 
             parseFloat(liabilities.pending_payouts) + parseFloat(assets.cash_available))
          ) < 0.01
        }
      };

      logger.info('Balance sheet generated', {
        asOfDate: periodEnd.toISOString(),
        totalAssets: balanceSheet.assets.total_assets,
        isBalanced: balanceSheet.verification.is_balanced
      });

      // Record business metric
      MetricsCollector.recordBusinessEvent('report_generated', 'balance_sheet');

      res.status(200).json({
        success: true,
        data: { balance_sheet: balanceSheet }
      });

    } catch (error) {
      logger.error('Generate balance sheet failed', {
        error: error.message,
        userId: req.user?.userId
      });
      throw error;
    }
  });

  // =====================================================
  // Cash Flow Reports
  // =====================================================

  // Generate cash flow statement
  generateCashFlowStatement = asyncHandler(async (req: Request, res: Response) => {
    try {
      const user = req.user;
      
      if (!user || user.role !== 'admin') {
        throw new ForbiddenError('Admin access required');
      }

      // Validate input
      const { error, value } = reportPeriodSchema.validate(req.query);
      if (error) {
        throw new ValidationError(error.details[0].message);
      }

      const { periodStart, periodEnd } = this.calculatePeriodDates(value.period_type, value.start_date, value.end_date);

      // Operating cash flows
      const operatingCashFlowQuery = `
        SELECT 
          COALESCE(SUM(CASE WHEN t.transaction_type IN ('subscription', 'tip', 'content_purchase') THEN t.fee_amount ELSE 0 END), 0) as cash_from_fees,
          COALESCE(SUM(CASE WHEN t.transaction_type = 'withdrawal' AND t.recipient_id IS NULL THEN -t.amount ELSE 0 END), 0) as creator_payouts,
          COALESCE(SUM(CASE WHEN t.transaction_type = 'refund' THEN -t.amount ELSE 0 END), 0) as refunds_paid,
          COALESCE(SUM(CASE WHEN t.transaction_type = 'chargeback' THEN -t.amount ELSE 0 END), 0) as chargebacks
        FROM transactions t
        WHERE t.status = 'completed'
          AND t.created_at >= $1
          AND t.created_at <= $2
          AND t.currency = $3
      `;

      // User deposit/withdrawal flows
      const userFlowsQuery = `
        SELECT 
          COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as user_deposits,
          COALESCE(SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END), 0) as user_withdrawals
        FROM user_balance_changes
        WHERE change_type = 'deposit' OR change_type = 'withdrawal'
          AND created_at >= $1
          AND created_at <= $2
          AND currency = $3
      `;

      // Platform operational flows
      const operationalFlowsQuery = `
        SELECT 
          COUNT(DISTINCT sender_id) as new_users,
          COUNT(DISTINCT recipient_id) as new_creators,
          COUNT(*) as total_transactions
        FROM transactions
        WHERE status = 'completed'
          AND created_at >= $1
          AND created_at <= $2
      `;

      const [operatingResult, userFlowsResult, operationalResult] = await Promise.all([
        paymentRepository.db.query(operatingCashFlowQuery, [periodStart, periodEnd, value.currency]),
        paymentRepository.db.query(userFlowsQuery, [periodStart, periodEnd, value.currency]),
        paymentRepository.db.query(operationalFlowsQuery, [periodStart, periodEnd])
      ]);

      const operating = operatingResult.rows[0];
      const userFlows = userFlowsResult.rows[0];
      const operational = operationalResult.rows[0];

      // Cash Flow Statement
      const cashFlowStatement = {
        period: {
          start_date: periodStart.toISOString().split('T')[0],
          end_date: periodEnd.toISOString().split('T')[0],
          period_type: value.period_type,
          currency: value.currency
        },
        operating_activities: {
          cash_receipts: {
            platform_fees_collected: parseFloat(operating.cash_from_fees),
            user_deposits: parseFloat(userFlows.user_deposits),
            total_cash_receipts: parseFloat(operating.cash_from_fees) + parseFloat(userFlows.user_deposits)
          },
          cash_payments: {
            creator_payouts: Math.abs(parseFloat(operating.creator_payouts)),
            refunds_paid: Math.abs(parseFloat(operating.refunds_paid)),
            chargebacks: Math.abs(parseFloat(operating.chargebacks)),
            user_withdrawals: Math.abs(parseFloat(userFlows.user_withdrawals)),
            total_cash_payments: Math.abs(parseFloat(operating.creator_payouts)) + 
                               Math.abs(parseFloat(operating.refunds_paid)) + 
                               Math.abs(parseFloat(operating.chargebacks)) + 
                               Math.abs(parseFloat(userFlows.user_withdrawals))
          },
          net_operating_cash_flow: (parseFloat(operating.cash_from_fees) + parseFloat(userFlows.user_deposits)) -
                                  (Math.abs(parseFloat(operating.creator_payouts)) + 
                                   Math.abs(parseFloat(operating.refunds_paid)) + 
                                   Math.abs(parseFloat(operating.chargebacks)) + 
                                   Math.abs(parseFloat(userFlows.user_withdrawals)))
        },
        investing_activities: {
          platform_development: 0, // Would be actual investment data
          net_investing_cash_flow: 0
        },
        financing_activities: {
          funding_received: 0, // Would be actual funding data
          dividends_paid: 0,
          net_financing_cash_flow: 0
        },
        net_change_in_cash: (parseFloat(operating.cash_from_fees) + parseFloat(userFlows.user_deposits)) -
                           (Math.abs(parseFloat(operating.creator_payouts)) + 
                            Math.abs(parseFloat(operating.refunds_paid)) + 
                            Math.abs(parseFloat(operating.chargebacks)) + 
                            Math.abs(parseFloat(userFlows.user_withdrawals))),
        operational_metrics: {
          new_users: parseInt(operational.new_users),
          new_creators: parseInt(operational.new_creators),
          total_transactions: parseInt(operational.total_transactions),
          avg_transaction_size: parseFloat(operating.cash_from_fees) / parseInt(operational.total_transactions) || 0
        }
      };

      logger.info('Cash flow statement generated', {
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        netOperatingCashFlow: cashFlowStatement.operating_activities.net_operating_cash_flow
      });

      // Record business metric
      MetricsCollector.recordBusinessEvent('report_generated', 'cash_flow');

      res.status(200).json({
        success: true,
        data: { cash_flow_statement: cashFlowStatement }
      });

    } catch (error) {
      logger.error('Generate cash flow statement failed', {
        error: error.message,
        userId: req.user?.userId
      });
      throw error;
    }
  });

  // =====================================================
  // Financial Analytics
  // =====================================================

  // Get financial analytics
  getFinancialAnalytics = asyncHandler(async (req: Request, res: Response) => {
    try {
      const user = req.user;
      
      if (!user || (user.role !== 'admin' && user.role !== 'creator')) {
        throw new ForbiddenError('Access denied');
      }

      // Validate input
      const { error, value } = analyticsQuerySchema.validate(req.query);
      if (error) {
        throw new ValidationError(error.details[0].message);
      }

      const analytics = await this.generateAnalytics(value.metric_type, value.period, value.granularity, value.filters, user);

      logger.info('Financial analytics generated', {
        metricType: value.metric_type,
        period: value.period,
        userId: user.userId
      });

      // Record business metric
      MetricsCollector.recordBusinessEvent('analytics_generated', value.metric_type);

      res.status(200).json({
        success: true,
        data: { analytics }
      });

    } catch (error) {
      logger.error('Get financial analytics failed', {
        error: error.message,
        userId: req.user?.userId
      });
      throw error;
    }
  });

  // =====================================================
  // Comprehensive Financial Dashboard
  // =====================================================

  // Get executive financial dashboard
  getExecutiveDashboard = asyncHandler(async (req: Request, res: Response) => {
    try {
      const user = req.user;
      
      if (!user || user.role !== 'admin') {
        throw new ForbiddenError('Admin access required');
      }

      const { period = '30d' } = req.query;
      const days = this.parsePeriodDays(period as string);
      const days2 = days * 2;

      // Validate days parameter to prevent SQL injection
      if (isNaN(days) || days < 0 || days > 3650) {
        throw new ValidationError('Invalid period parameter. Must be a number between 0 and 3650 days.');
      }

      // Key financial metrics - using parameterized interval to prevent SQL injection
      const kpiQuery = `
        SELECT
          COALESCE(SUM(fee_amount), 0) as total_revenue,
          COALESCE(SUM(amount), 0) as gross_volume,
          COUNT(*) as total_transactions,
          COUNT(DISTINCT sender_id) as active_users,
          COUNT(DISTINCT recipient_id) as active_creators,
          AVG(amount) as avg_transaction_value,
          COALESCE(SUM(CASE WHEN transaction_type = 'subscription' THEN fee_amount ELSE 0 END), 0) as subscription_revenue,
          COALESCE(SUM(CASE WHEN transaction_type = 'tip' THEN fee_amount ELSE 0 END), 0) as tip_revenue
        FROM transactions
        WHERE status = 'completed'
          AND created_at >= NOW() - make_interval(days => $1)
      `;

      // Growth metrics (compare to previous period) - using parameterized interval to prevent SQL injection
      const growthQuery = `
        WITH current_period AS (
          SELECT
            SUM(fee_amount) as revenue,
            COUNT(*) as transactions,
            COUNT(DISTINCT sender_id) as users
          FROM transactions
          WHERE status = 'completed'
            AND created_at >= NOW() - make_interval(days => $1)
        ),
        previous_period AS (
          SELECT
            SUM(fee_amount) as revenue,
            COUNT(*) as transactions,
            COUNT(DISTINCT sender_id) as users
          FROM transactions
          WHERE status = 'completed'
            AND created_at >= NOW() - make_interval(days => $2)
            AND created_at < NOW() - make_interval(days => $1)
        )
        SELECT
          cp.revenue as current_revenue,
          pp.revenue as previous_revenue,
          cp.transactions as current_transactions,
          pp.transactions as previous_transactions,
          cp.users as current_users,
          pp.users as previous_users
        FROM current_period cp, previous_period pp
      `;

      // Top performers - using parameterized interval to prevent SQL injection
      const topPerformersQuery = `
        SELECT
          u.username,
          up.display_name,
          COALESCE(SUM(t.net_amount), 0) as total_earnings,
          COUNT(t.id) as transaction_count,
          AVG(t.net_amount) as avg_earning_per_transaction
        FROM users u
        JOIN user_profiles up ON u.id = up.user_id
        JOIN transactions t ON u.id = t.recipient_id
        WHERE t.status = 'completed'
          AND t.created_at >= NOW() - make_interval(days => $1)
          AND u.role = 'creator'
        GROUP BY u.id, u.username, up.display_name
        ORDER BY total_earnings DESC
        LIMIT 10
      `;

      const [kpiResult, growthResult, topPerformersResult] = await Promise.all([
        paymentRepository.db.query(kpiQuery, [days]),
        paymentRepository.db.query(growthQuery, [days, days2]),
        paymentRepository.db.query(topPerformersQuery, [days])
      ]);

      const kpis = kpiResult.rows[0];
      const growth = growthResult.rows[0];
      const topPerformers = topPerformersResult.rows;

      // Calculate growth rates
      const revenueGrowth = growth.previous_revenue > 0 
        ? ((growth.current_revenue - growth.previous_revenue) / growth.previous_revenue * 100).toFixed(2)
        : 'N/A';
      const transactionGrowth = growth.previous_transactions > 0
        ? ((growth.current_transactions - growth.previous_transactions) / growth.previous_transactions * 100).toFixed(2)
        : 'N/A';
      const userGrowth = growth.previous_users > 0
        ? ((growth.current_users - growth.previous_users) / growth.previous_users * 100).toFixed(2)
        : 'N/A';

      const executiveDashboard = {
        period: `${days} days`,
        key_metrics: {
          total_revenue: parseFloat(kpis.total_revenue),
          gross_volume: parseFloat(kpis.gross_volume),
          total_transactions: parseInt(kpis.total_transactions),
          active_users: parseInt(kpis.active_users),
          active_creators: parseInt(kpis.active_creators),
          avg_transaction_value: parseFloat(kpis.avg_transaction_value),
          revenue_per_user: parseFloat(kpis.total_revenue) / parseInt(kpis.active_users) || 0
        },
        revenue_breakdown: {
          subscription_revenue: parseFloat(kpis.subscription_revenue),
          tip_revenue: parseFloat(kpis.tip_revenue),
          subscription_percentage: (parseFloat(kpis.subscription_revenue) / parseFloat(kpis.total_revenue) * 100).toFixed(2) + '%',
          tip_percentage: (parseFloat(kpis.tip_revenue) / parseFloat(kpis.total_revenue) * 100).toFixed(2) + '%'
        },
        growth_metrics: {
          revenue_growth: revenueGrowth + '%',
          transaction_growth: transactionGrowth + '%',
          user_growth: userGrowth + '%'
        },
        top_creators: topPerformers.map(creator => ({
          username: creator.username,
          display_name: creator.display_name,
          total_earnings: parseFloat(creator.total_earnings),
          transaction_count: parseInt(creator.transaction_count),
          avg_earning: parseFloat(creator.avg_earning_per_transaction)
        })),
        health_indicators: {
          platform_take_rate: (parseFloat(kpis.total_revenue) / parseFloat(kpis.gross_volume) * 100).toFixed(2) + '%',
          creator_retention: 'High', // Would calculate from actual retention data
          user_satisfaction: 'Good',  // Would integrate with customer satisfaction surveys
          financial_health: parseFloat(kpis.total_revenue) > 0 ? 'Strong' : 'Weak'
        }
      };

      logger.info('Executive dashboard generated', {
        period: days,
        totalRevenue: kpis.total_revenue,
        activeUsers: kpis.active_users
      });

      // Record business metric
      MetricsCollector.recordBusinessEvent('dashboard_viewed', 'executive');

      res.status(200).json({
        success: true,
        data: { executive_dashboard: executiveDashboard }
      });

    } catch (error) {
      logger.error('Get executive dashboard failed', {
        error: error.message,
        userId: req.user?.userId
      });
      throw error;
    }
  });

  // =====================================================
  // Helper Methods
  // =====================================================

  private calculatePeriodDates(periodType: string, startDate?: Date, endDate?: Date): { periodStart: Date; periodEnd: Date } {
    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date = endDate || now;

    switch (periodType) {
      case 'monthly':
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarterly':
        const quarter = Math.floor(now.getMonth() / 3);
        periodStart = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'yearly':
        periodStart = new Date(now.getFullYear(), 0, 1);
        break;
      case 'custom':
        periodStart = startDate || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return { periodStart, periodEnd };
  }

  private parsePeriodDays(period: string): number {
    const periodMap: Record<string, number> = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    };
    return periodMap[period] || 30;
  }

  private async generateAnalytics(metricType: string, period: string, granularity: string, filters: any, user: any) {
    const days = this.parsePeriodDays(period);
    
    switch (metricType) {
      case 'revenue_trend':
        return await this.getRevenueTrend(days, granularity);
      case 'user_growth':
        return await this.getUserGrowthMetrics(days, granularity);
      case 'creator_performance':
        return await this.getCreatorPerformanceMetrics(days, user);
      case 'subscription_metrics':
        return await this.getSubscriptionMetrics(days);
      default:
        return { message: 'Analytics type not yet implemented' };
    }
  }

  private async getRevenueTrend(days: number, granularity: string) {
    // Validate granularity to prevent SQL injection
    const validGranularities = ['daily', 'weekly', 'monthly'];
    const safeGranularity = validGranularities.includes(granularity) ? granularity : 'daily';
    const dateTruncPeriod = safeGranularity === 'daily' ? 'day' : safeGranularity === 'weekly' ? 'week' : 'month';

    // Validate days parameter to prevent SQL injection
    if (isNaN(days) || days < 0 || days > 3650) {
      throw new ValidationError('Invalid period parameter. Must be a number between 0 and 3650 days.');
    }

    const query = `
      SELECT
        DATE_TRUNC($1, created_at) as period,
        SUM(fee_amount) as revenue,
        COUNT(*) as transactions
      FROM transactions
      WHERE status = 'completed'
        AND created_at >= NOW() - make_interval(days => $2)
      GROUP BY period
      ORDER BY period
    `;

    const result = await paymentRepository.db.query(query, [dateTruncPeriod, days]);
    return result.rows.map(row => ({
      period: row.period,
      revenue: parseFloat(row.revenue),
      transactions: parseInt(row.transactions)
    }));
  }

  private async getUserGrowthMetrics(days: number, granularity: string) {
    // Validate granularity to prevent SQL injection
    const validGranularities = ['daily', 'weekly', 'monthly'];
    const safeGranularity = validGranularities.includes(granularity) ? granularity : 'daily';
    const dateTruncPeriod = safeGranularity === 'daily' ? 'day' : safeGranularity === 'weekly' ? 'week' : 'month';

    // Validate days parameter to prevent SQL injection
    if (isNaN(days) || days < 0 || days > 3650) {
      throw new ValidationError('Invalid period parameter. Must be a number between 0 and 3650 days.');
    }

    const query = `
      SELECT
        DATE_TRUNC($1, created_at) as period,
        COUNT(DISTINCT sender_id) as active_users,
        COUNT(DISTINCT recipient_id) as active_creators
      FROM transactions
      WHERE status = 'completed'
        AND created_at >= NOW() - make_interval(days => $2)
      GROUP BY period
      ORDER BY period
    `;

    const result = await paymentRepository.db.query(query, [dateTruncPeriod, days]);
    return result.rows.map(row => ({
      period: row.period,
      active_users: parseInt(row.active_users),
      active_creators: parseInt(row.active_creators)
    }));
  }

  private async getCreatorPerformanceMetrics(days: number, user: any) {
    // Validate days parameter to prevent SQL injection
    if (isNaN(days) || days < 0 || days > 3650) {
      throw new ValidationError('Invalid period parameter. Must be a number between 0 and 3650 days.');
    }

    // Use parameterized query to prevent SQL injection
    let query: string;
    let queryParams: any[];

    if (user.role === 'creator') {
      query = `
        SELECT
          u.username,
          up.display_name,
          SUM(t.net_amount) as total_earnings,
          COUNT(t.id) as transaction_count,
          COUNT(DISTINCT t.sender_id) as unique_supporters,
          AVG(t.net_amount) as avg_transaction_value
        FROM users u
        JOIN user_profiles up ON u.id = up.user_id
        JOIN transactions t ON u.id = t.recipient_id
        WHERE t.status = 'completed'
          AND t.created_at >= NOW() - make_interval(days => $1)
          AND u.role = 'creator'
          AND t.recipient_id = $2
        GROUP BY u.id, u.username, up.display_name
        ORDER BY total_earnings DESC
        LIMIT 20
      `;
      queryParams = [days, user.userId];
    } else {
      query = `
        SELECT
          u.username,
          up.display_name,
          SUM(t.net_amount) as total_earnings,
          COUNT(t.id) as transaction_count,
          COUNT(DISTINCT t.sender_id) as unique_supporters,
          AVG(t.net_amount) as avg_transaction_value
        FROM users u
        JOIN user_profiles up ON u.id = up.user_id
        JOIN transactions t ON u.id = t.recipient_id
        WHERE t.status = 'completed'
          AND t.created_at >= NOW() - make_interval(days => $1)
          AND u.role = 'creator'
        GROUP BY u.id, u.username, up.display_name
        ORDER BY total_earnings DESC
        LIMIT 20
      `;
      queryParams = [days];
    }

    const result = await paymentRepository.db.query(query, queryParams);
    return result.rows.map(row => ({
      username: row.username,
      display_name: row.display_name,
      total_earnings: parseFloat(row.total_earnings),
      transaction_count: parseInt(row.transaction_count),
      unique_supporters: parseInt(row.unique_supporters),
      avg_transaction_value: parseFloat(row.avg_transaction_value)
    }));
  }

  private async getSubscriptionMetrics(days: number) {
    // Validate days parameter to prevent SQL injection
    if (isNaN(days) || days < 0 || days > 3650) {
      throw new ValidationError('Invalid period parameter. Must be a number between 0 and 3650 days.');
    }

    const query = `
      SELECT
        sp.name as plan_name,
        sp.price,
        sp.billing_cycle,
        COUNT(us.id) as subscriber_count,
        SUM(sp.price) as total_revenue,
        COUNT(CASE WHEN us.is_trial THEN 1 END) as trial_subscribers,
        COUNT(CASE WHEN us.status = 'active' THEN 1 END) as active_subscribers,
        COUNT(CASE WHEN us.status = 'cancelled' THEN 1 END) as cancelled_subscribers
      FROM subscription_plans sp
      LEFT JOIN user_subscriptions us ON sp.id = us.plan_id
        AND us.created_at >= NOW() - make_interval(days => $1)
      GROUP BY sp.id, sp.name, sp.price, sp.billing_cycle
      ORDER BY subscriber_count DESC
    `;

    const result = await paymentRepository.db.query(query, [days]);
    return result.rows.map(row => ({
      plan_name: row.plan_name,
      price: parseFloat(row.price),
      billing_cycle: row.billing_cycle,
      subscriber_count: parseInt(row.subscriber_count),
      total_revenue: parseFloat(row.total_revenue),
      trial_subscribers: parseInt(row.trial_subscribers),
      active_subscribers: parseInt(row.active_subscribers),
      cancelled_subscribers: parseInt(row.cancelled_subscribers)
    }));
  }
}

// Export singleton instance
export const financialReportsController = new FinancialReportsController();
export default FinancialReportsController;