import { BaseRepository } from '../config/database';
import { Logger } from '../utils/logger';
import { 
  ConflictError, 
  NotFoundError, 
  DatabaseError, 
  ValidationError,
  ForbiddenError 
} from '../middleware/errorHandler';

const logger = new Logger('PaymentModel');

// =====================================================
// FanzFinance OS Interfaces
// =====================================================

export interface ChartOfAccounts {
  id: string;
  account_code: string;
  account_name: string;
  account_type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  account_subtype?: string;
  parent_account_id?: string;
  account_level: number;
  is_active: boolean;
  is_system_account: boolean;
  normal_balance: 'debit' | 'credit';
  description?: string;
  tax_category?: string;
  created_at: Date;
  updated_at: Date;
}

export interface JournalEntry {
  id: string;
  entry_number: string;
  entry_type: string;
  description: string;
  reference_id?: string;
  reference_type?: string;
  total_amount: number;
  currency: string;
  status: 'pending' | 'posted' | 'reversed' | 'adjusted';
  posted_by?: string;
  posting_date: Date;
  entry_date: Date;
  reversed_entry_id?: string;
  reversal_reason?: string;
  created_at: Date;
  updated_at: Date;
}

export interface JournalEntryLine {
  id: string;
  journal_entry_id: string;
  account_id: string;
  line_number: number;
  description?: string;
  debit_amount: number;
  credit_amount: number;
  entity_id?: string;
  entity_type?: string;
  cost_center?: string;
  project_id?: string;
  created_at: Date;
}

export interface Transaction {
  id: string;
  transaction_number: string;
  transaction_type: 'subscription' | 'tip' | 'content_purchase' | 'withdrawal' | 'refund' | 'commission' | 'platform_fee' | 'chargeback';
  sender_id?: string;
  recipient_id?: string;
  amount: number;
  currency: string;
  fee_amount: number;
  net_amount: number;
  description?: string;
  reference_id?: string;
  reference_type?: string;
  payment_method?: string;
  payment_method_details: Record<string, any>;
  external_transaction_id?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  journal_entry_id?: string;
  initiated_at: Date;
  completed_at?: Date;
  created_at: Date;
  updated_at: Date;
  metadata: Record<string, any>;
}

export interface UserBalance {
  id: string;
  user_id: string;
  balance_type: 'available' | 'pending' | 'escrow' | 'earnings' | 'tips' | 'subscriptions';
  balance: number;
  currency: string;
  last_transaction_id?: string;
  last_updated_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface SubscriptionPlan {
  id: string;
  creator_id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  billing_cycle: 'monthly' | 'quarterly' | 'yearly' | 'lifetime';
  features: string[];
  benefits: Record<string, any>;
  is_active: boolean;
  max_subscribers?: number;
  trial_period_days: number;
  creator_percentage: number;
  created_at: Date;
  updated_at: Date;
}

export interface UserSubscription {
  id: string;
  subscriber_id: string;
  creator_id: string;
  plan_id: string;
  status: 'pending' | 'active' | 'cancelled' | 'expired' | 'suspended' | 'trial';
  current_period_start: Date;
  current_period_end: Date;
  next_billing_date?: Date;
  trial_start?: Date;
  trial_end?: Date;
  is_trial: boolean;
  cancelled_at?: Date;
  cancellation_reason?: string;
  cancelled_by?: string;
  total_paid: number;
  last_payment_date?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CreatorPayout {
  id: string;
  creator_id: string;
  payout_number: string;
  amount: number;
  currency: string;
  payout_method: 'bank_transfer' | 'paypal' | 'crypto' | 'check' | 'store_credit';
  payout_details: Record<string, any>;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  period_start: Date;
  period_end: Date;
  journal_entry_id?: string;
  external_reference?: string;
  requested_at: Date;
  processed_at?: Date;
  completed_at?: Date;
  failure_reason?: string;
  retry_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateTransactionInput {
  transaction_type: string;
  sender_id?: string;
  recipient_id?: string;
  amount: number;
  currency?: string;
  fee_amount?: number;
  description?: string;
  reference_id?: string;
  reference_type?: string;
  payment_method?: string;
  payment_method_details?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface CreateSubscriptionInput {
  creator_id: string;
  plan_id: string;
  payment_method?: string;
  payment_method_details?: Record<string, any>;
  trial?: boolean;
}

export interface CreatePayoutInput {
  creator_id: string;
  amount: number;
  currency?: string;
  payout_method: string;
  payout_details: Record<string, any>;
  period_start: Date;
  period_end: Date;
}

// =====================================================
// FanzFinance OS Payment Repository
// =====================================================

export class PaymentRepository extends BaseRepository {

  // =====================================================
  // Ledger Management
  // =====================================================

  async getChartOfAccounts(): Promise<ChartOfAccounts[]> {
    try {
      const query = `
        SELECT * FROM chart_of_accounts 
        WHERE is_active = true 
        ORDER BY account_code
      `;
      const result = await this.db.query(query);
      return result.rows;
    } catch (error) {
      logger.error('Failed to get chart of accounts', { error: error.message });
      throw new DatabaseError('Failed to get chart of accounts');
    }
  }

  async getAccountByCode(accountCode: string): Promise<ChartOfAccounts | null> {
    try {
      const query = `
        SELECT * FROM chart_of_accounts 
        WHERE account_code = $1 AND is_active = true
      `;
      const result = await this.db.query(query, [accountCode]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Failed to get account by code', { error: error.message, accountCode });
      throw new DatabaseError('Failed to get account');
    }
  }

  // =====================================================
  // Double-Entry Ledger Operations
  // =====================================================

  async createJournalEntry(entryData: {
    entry_type: string;
    description: string;
    reference_id?: string;
    reference_type?: string;
    posted_by?: string;
    entry_date?: Date;
    lines: Array<{
      account_code: string;
      debit_amount?: number;
      credit_amount?: number;
      description?: string;
      entity_id?: string;
      entity_type?: string;
    }>;
  }): Promise<JournalEntry> {
    try {
      return await this.db.transaction(async (client) => {
        // Generate entry number
        const entryNumber = await this.generateEntryNumber();
        
        // Calculate total amount
        const totalAmount = entryData.lines.reduce((sum, line) => 
          sum + (line.debit_amount || 0) + (line.credit_amount || 0), 0) / 2;

        // Validate double-entry (debits must equal credits)
        const totalDebits = entryData.lines.reduce((sum, line) => sum + (line.debit_amount || 0), 0);
        const totalCredits = entryData.lines.reduce((sum, line) => sum + (line.credit_amount || 0), 0);
        
        if (Math.abs(totalDebits - totalCredits) > 0.01) {
          throw new ValidationError(`Journal entry not balanced: debits ${totalDebits}, credits ${totalCredits}`);
        }

        // Create journal entry
        const entryQuery = `
          INSERT INTO journal_entries (
            entry_number, entry_type, description, reference_id, reference_type,
            total_amount, posted_by, posting_date, entry_date, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING *
        `;

        const entryResult = await client.query(entryQuery, [
          entryNumber,
          entryData.entry_type,
          entryData.description,
          entryData.reference_id,
          entryData.reference_type,
          totalAmount,
          entryData.posted_by,
          new Date(), // posting_date
          entryData.entry_date || new Date(),
          'posted'
        ]);

        const journalEntry = entryResult.rows[0];

        // Create journal entry lines
        let lineNumber = 1;
        for (const lineData of entryData.lines) {
          // Get account ID from code
          const account = await this.getAccountByCode(lineData.account_code);
          if (!account) {
            throw new ValidationError(`Invalid account code: ${lineData.account_code}`);
          }

          const lineQuery = `
            INSERT INTO journal_entry_lines (
              journal_entry_id, account_id, line_number, description,
              debit_amount, credit_amount, entity_id, entity_type
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `;

          await client.query(lineQuery, [
            journalEntry.id,
            account.id,
            lineNumber++,
            lineData.description,
            lineData.debit_amount || 0,
            lineData.credit_amount || 0,
            lineData.entity_id,
            lineData.entity_type
          ]);
        }

        logger.info('Journal entry created successfully', {
          entryId: journalEntry.id,
          entryNumber,
          totalAmount
        });

        return journalEntry;
      });
    } catch (error) {
      logger.error('Failed to create journal entry', {
        error: error.message,
        entryData
      });
      throw error;
    }
  }

  // =====================================================
  // Transaction Management
  // =====================================================

  async createTransaction(transactionData: CreateTransactionInput): Promise<Transaction> {
    try {
      const transactionNumber = await this.generateTransactionNumber();
      const netAmount = transactionData.amount - (transactionData.fee_amount || 0);

      const query = `
        INSERT INTO transactions (
          transaction_number, transaction_type, sender_id, recipient_id,
          amount, currency, fee_amount, net_amount, description,
          reference_id, reference_type, payment_method, payment_method_details,
          status, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *
      `;

      const result = await this.db.query(query, [
        transactionNumber,
        transactionData.transaction_type,
        transactionData.sender_id,
        transactionData.recipient_id,
        transactionData.amount,
        transactionData.currency || 'USD',
        transactionData.fee_amount || 0,
        netAmount,
        transactionData.description,
        transactionData.reference_id,
        transactionData.reference_type,
        transactionData.payment_method,
        JSON.stringify(transactionData.payment_method_details || {}),
        'pending',
        JSON.stringify(transactionData.metadata || {})
      ]);

      const transaction = result.rows[0];

      logger.info('Transaction created', {
        transactionId: transaction.id,
        transactionNumber,
        type: transactionData.transaction_type,
        amount: transactionData.amount
      });

      return transaction;
    } catch (error) {
      logger.error('Failed to create transaction', {
        error: error.message,
        transactionData
      });
      throw error;
    }
  }

  async processTransaction(transactionId: string): Promise<Transaction> {
    try {
      return await this.db.transaction(async (client) => {
        // Get transaction
        const transaction = await this.getTransactionById(transactionId);
        if (!transaction) {
          throw new NotFoundError('Transaction not found');
        }

        if (transaction.status !== 'pending') {
          throw new ValidationError(`Transaction already ${transaction.status}`);
        }

        // Update transaction status
        await client.query(`
          UPDATE transactions 
          SET status = 'processing', updated_at = NOW()
          WHERE id = $1
        `, [transactionId]);

        // Create journal entry based on transaction type
        await this.createTransactionJournalEntry(transaction);

        // Mark transaction as completed
        const completedResult = await client.query(`
          UPDATE transactions 
          SET status = 'completed', completed_at = NOW(), updated_at = NOW()
          WHERE id = $1
          RETURNING *
        `, [transactionId]);

        const completedTransaction = completedResult.rows[0];

        logger.info('Transaction processed successfully', {
          transactionId,
          transactionNumber: transaction.transaction_number,
          amount: transaction.amount
        });

        return completedTransaction;
      });
    } catch (error) {
      // Mark transaction as failed
      await this.db.query(`
        UPDATE transactions 
        SET status = 'failed', updated_at = NOW()
        WHERE id = $1
      `, [transactionId]).catch(() => {}); // Don't throw on this error

      logger.error('Failed to process transaction', {
        error: error.message,
        transactionId
      });
      throw error;
    }
  }

  async getTransactionById(transactionId: string): Promise<Transaction | null> {
    try {
      const query = `SELECT * FROM transactions WHERE id = $1`;
      const result = await this.db.query(query, [transactionId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Failed to get transaction', { error: error.message, transactionId });
      throw new DatabaseError('Failed to get transaction');
    }
  }

  async getUserTransactions(userId: string, options: {
    limit?: number;
    offset?: number;
    type?: string;
    status?: string;
  } = {}): Promise<{ transactions: Transaction[]; total: number }> {
    try {
      const { limit = 20, offset = 0, type, status } = options;

      let whereClause = `WHERE (sender_id = $1 OR recipient_id = $1)`;
      const params = [userId];
      let paramIndex = 2;

      if (type) {
        whereClause += ` AND transaction_type = $${paramIndex}`;
        params.push(type);
        paramIndex++;
      }

      if (status) {
        whereClause += ` AND status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      const transactionsQuery = `
        SELECT * FROM transactions
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      params.push(limit, offset);

      const countQuery = `
        SELECT COUNT(*) as count FROM transactions
        ${whereClause}
      `;

      const [transactionsResult, countResult] = await Promise.all([
        this.db.query(transactionsQuery, params),
        this.db.query(countQuery, params.slice(0, -2))
      ]);

      return {
        transactions: transactionsResult.rows,
        total: parseInt(countResult.rows[0]?.count || '0')
      };
    } catch (error) {
      logger.error('Failed to get user transactions', {
        error: error.message,
        userId
      });
      throw new DatabaseError('Failed to get user transactions');
    }
  }

  // =====================================================
  // Balance Management
  // =====================================================

  async getUserBalance(userId: string, balanceType: string = 'available', currency: string = 'USD'): Promise<UserBalance | null> {
    try {
      const query = `
        SELECT * FROM user_balances 
        WHERE user_id = $1 AND balance_type = $2 AND currency = $3
      `;
      const result = await this.db.query(query, [userId, balanceType, currency]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Failed to get user balance', {
        error: error.message,
        userId,
        balanceType
      });
      throw new DatabaseError('Failed to get user balance');
    }
  }

  async getUserBalances(userId: string): Promise<UserBalance[]> {
    try {
      const query = `
        SELECT * FROM user_balances 
        WHERE user_id = $1
        ORDER BY balance_type, currency
      `;
      const result = await this.db.query(query, [userId]);
      return result.rows;
    } catch (error) {
      logger.error('Failed to get user balances', {
        error: error.message,
        userId
      });
      throw new DatabaseError('Failed to get user balances');
    }
  }

  // =====================================================
  // Subscription Management
  // =====================================================

  async createSubscriptionPlan(creatorId: string, planData: {
    name: string;
    description?: string;
    price: number;
    currency?: string;
    billing_cycle: string;
    features?: string[];
    benefits?: Record<string, any>;
    max_subscribers?: number;
    trial_period_days?: number;
  }): Promise<SubscriptionPlan> {
    try {
      const query = `
        INSERT INTO subscription_plans (
          creator_id, name, description, price, currency, billing_cycle,
          features, benefits, max_subscribers, trial_period_days
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;

      const result = await this.db.query(query, [
        creatorId,
        planData.name,
        planData.description,
        planData.price,
        planData.currency || 'USD',
        planData.billing_cycle,
        JSON.stringify(planData.features || []),
        JSON.stringify(planData.benefits || {}),
        planData.max_subscribers,
        planData.trial_period_days || 0
      ]);

      const plan = result.rows[0];

      logger.info('Subscription plan created', {
        planId: plan.id,
        creatorId,
        name: planData.name,
        price: planData.price
      });

      return plan;
    } catch (error) {
      logger.error('Failed to create subscription plan', {
        error: error.message,
        creatorId,
        planData
      });
      throw error;
    }
  }

  async createSubscription(subscriberId: string, subscriptionData: CreateSubscriptionInput): Promise<UserSubscription> {
    try {
      return await this.db.transaction(async (client) => {
        // Get subscription plan
        const plan = await this.getSubscriptionPlan(subscriptionData.plan_id);
        if (!plan) {
          throw new NotFoundError('Subscription plan not found');
        }

        if (!plan.is_active) {
          throw new ValidationError('Subscription plan is not active');
        }

        // Check if user is already subscribed
        const existing = await this.getUserSubscription(subscriberId, subscriptionData.creator_id);
        if (existing && existing.status === 'active') {
          throw new ConflictError('User is already subscribed to this creator');
        }

        // Calculate dates
        const now = new Date();
        const periodStart = new Date();
        const periodEnd = this.calculateBillingPeriodEnd(periodStart, plan.billing_cycle);
        
        let trialStart, trialEnd, isTrialValue;
        if (subscriptionData.trial && plan.trial_period_days > 0) {
          trialStart = periodStart;
          trialEnd = new Date(periodStart);
          trialEnd.setDate(trialEnd.getDate() + plan.trial_period_days);
          isTrialValue = true;
        }

        // Create subscription
        const subscriptionQuery = `
          INSERT INTO user_subscriptions (
            subscriber_id, creator_id, plan_id, status,
            current_period_start, current_period_end, next_billing_date,
            trial_start, trial_end, is_trial
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING *
        `;

        const subscriptionResult = await client.query(subscriptionQuery, [
          subscriberId,
          subscriptionData.creator_id,
          subscriptionData.plan_id,
          isTrialValue ? 'trial' : 'active',
          periodStart,
          periodEnd,
          isTrialValue ? trialEnd : periodEnd,
          trialStart,
          trialEnd,
          isTrialValue || false
        ]);

        const subscription = subscriptionResult.rows[0];

        // Create initial payment transaction if not trial
        if (!isTrialValue) {
          const transactionData: CreateTransactionInput = {
            transaction_type: 'subscription',
            sender_id: subscriberId,
            recipient_id: subscriptionData.creator_id,
            amount: plan.price,
            currency: plan.currency,
            fee_amount: plan.price * (1 - plan.creator_percentage),
            description: `Subscription to ${plan.name}`,
            reference_id: subscription.id,
            reference_type: 'subscription',
            payment_method: subscriptionData.payment_method,
            payment_method_details: subscriptionData.payment_method_details
          };

          await this.createTransaction(transactionData);
        }

        logger.info('Subscription created successfully', {
          subscriptionId: subscription.id,
          subscriberId,
          creatorId: subscriptionData.creator_id,
          planId: subscriptionData.plan_id,
          isTrial: isTrialValue
        });

        return subscription;
      });
    } catch (error) {
      logger.error('Failed to create subscription', {
        error: error.message,
        subscriberId,
        subscriptionData
      });
      throw error;
    }
  }

  async getSubscriptionPlan(planId: string): Promise<SubscriptionPlan | null> {
    try {
      const query = `SELECT * FROM subscription_plans WHERE id = $1`;
      const result = await this.db.query(query, [planId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Failed to get subscription plan', { error: error.message, planId });
      throw new DatabaseError('Failed to get subscription plan');
    }
  }

  async getUserSubscription(subscriberId: string, creatorId: string): Promise<UserSubscription | null> {
    try {
      const query = `
        SELECT * FROM user_subscriptions 
        WHERE subscriber_id = $1 AND creator_id = $2 
        ORDER BY created_at DESC 
        LIMIT 1
      `;
      const result = await this.db.query(query, [subscriberId, creatorId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Failed to get user subscription', {
        error: error.message,
        subscriberId,
        creatorId
      });
      throw new DatabaseError('Failed to get user subscription');
    }
  }

  // =====================================================
  // Creator Payouts
  // =====================================================

  async createPayout(payoutData: CreatePayoutInput): Promise<CreatorPayout> {
    try {
      const payoutNumber = await this.generatePayoutNumber();

      const query = `
        INSERT INTO creator_payouts (
          creator_id, payout_number, amount, currency, payout_method,
          payout_details, period_start, period_end
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const result = await this.db.query(query, [
        payoutData.creator_id,
        payoutNumber,
        payoutData.amount,
        payoutData.currency || 'USD',
        payoutData.payout_method,
        JSON.stringify(payoutData.payout_details),
        payoutData.period_start,
        payoutData.period_end
      ]);

      const payout = result.rows[0];

      logger.info('Payout created', {
        payoutId: payout.id,
        payoutNumber,
        creatorId: payoutData.creator_id,
        amount: payoutData.amount
      });

      return payout;
    } catch (error) {
      logger.error('Failed to create payout', {
        error: error.message,
        payoutData
      });
      throw error;
    }
  }

  // =====================================================
  // Helper Methods
  // =====================================================

  private async generateEntryNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const query = `
      SELECT COUNT(*) + 1 as next_number 
      FROM journal_entries 
      WHERE EXTRACT(YEAR FROM created_at) = $1
    `;
    const result = await this.db.query(query, [year]);
    const nextNumber = result.rows[0]?.next_number || 1;
    return `JE-${year}-${nextNumber.toString().padStart(6, '0')}`;
  }

  private async generateTransactionNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const query = `
      SELECT COUNT(*) + 1 as next_number 
      FROM transactions 
      WHERE EXTRACT(YEAR FROM created_at) = $1
    `;
    const result = await this.db.query(query, [year]);
    const nextNumber = result.rows[0]?.next_number || 1;
    return `TXN-${year}-${nextNumber.toString().padStart(8, '0')}`;
  }

  private async generatePayoutNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const query = `
      SELECT COUNT(*) + 1 as next_number 
      FROM creator_payouts 
      WHERE EXTRACT(YEAR FROM created_at) = $1
    `;
    const result = await this.db.query(query, [year]);
    const nextNumber = result.rows[0]?.next_number || 1;
    return `PO-${year}-${nextNumber.toString().padStart(6, '0')}`;
  }

  private calculateBillingPeriodEnd(startDate: Date, billingCycle: string): Date {
    const endDate = new Date(startDate);
    
    switch (billingCycle) {
      case 'monthly':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case 'quarterly':
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case 'yearly':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
      case 'lifetime':
        endDate.setFullYear(endDate.getFullYear() + 100); // Far future
        break;
    }
    
    return endDate;
  }

  private async createTransactionJournalEntry(transaction: Transaction): Promise<void> {
    const lines: Array<{
      account_code: string;
      debit_amount?: number;
      credit_amount?: number;
      description?: string;
      entity_id?: string;
      entity_type?: string;
    }> = [];

    // Create journal entries based on transaction type
    switch (transaction.transaction_type) {
      case 'subscription':
      case 'tip':
      case 'content_purchase':
        // Debit: User Balances (Asset) - Money coming into platform
        lines.push({
          account_code: '1100',
          debit_amount: transaction.amount,
          description: `${transaction.transaction_type} payment received`,
          entity_id: transaction.sender_id,
          entity_type: 'user'
        });

        // Credit: Creator earnings
        lines.push({
          account_code: '2200',
          credit_amount: transaction.net_amount,
          description: `Creator earnings for ${transaction.transaction_type}`,
          entity_id: transaction.recipient_id,
          entity_type: 'creator'
        });

        // Credit: Platform fees (if any)
        if (transaction.fee_amount > 0) {
          lines.push({
            account_code: '4000',
            credit_amount: transaction.fee_amount,
            description: `Platform fee for ${transaction.transaction_type}`,
            entity_type: 'platform'
          });
        }
        break;

      case 'withdrawal':
        // Credit: Creator Payouts Payable (Liability) - Reduce amount owed
        lines.push({
          account_code: '2200',
          debit_amount: transaction.amount,
          description: 'Creator payout processed',
          entity_id: transaction.recipient_id,
          entity_type: 'creator'
        });

        // Debit: Cash and Bank (Asset) - Money leaving platform
        lines.push({
          account_code: '1000',
          credit_amount: transaction.amount,
          description: 'Cash withdrawn from platform',
          entity_type: 'platform'
        });
        break;

      case 'refund':
        // Debit: Refunds expense
        lines.push({
          account_code: '5200',
          debit_amount: transaction.amount,
          description: 'Refund processed',
          entity_id: transaction.recipient_id,
          entity_type: 'user'
        });

        // Credit: User Balances
        lines.push({
          account_code: '1100',
          credit_amount: transaction.amount,
          description: 'Refund to user',
          entity_id: transaction.recipient_id,
          entity_type: 'user'
        });
        break;
    }

    if (lines.length > 0) {
      await this.createJournalEntry({
        entry_type: transaction.transaction_type,
        description: transaction.description || `${transaction.transaction_type} - ${transaction.transaction_number}`,
        reference_id: transaction.id,
        reference_type: 'transaction',
        lines
      });
    }
  }
}

// Export singleton instance
export const paymentRepository = new PaymentRepository();
export default PaymentRepository;