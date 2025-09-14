import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import CoreLedgerService, { JournalEntry } from '../ledger/LedgerService';

// 🔄 FanzFinance OS - Transaction Processing Engine
// Automated journal entry generation for all FANZ platform transactions

export interface Transaction {
  id: string;
  type: TransactionType;
  platform: string;
  userId?: string;
  creatorId?: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  metadata: Record<string, any>;
  createdAt: Date;
  processedAt?: Date;
  failedAt?: Date;
  error?: string;
  journalEntryId?: string;
  reconciliationStatus: ReconciliationStatus;
}

export enum TransactionType {
  SUBSCRIPTION_PAYMENT = 'subscription_payment',
  TIP_PAYMENT = 'tip_payment',
  CONTENT_PURCHASE = 'content_purchase',
  NFT_PURCHASE = 'nft_purchase',
  CREATOR_PAYOUT = 'creator_payout',
  REFUND = 'refund',
  CHARGEBACK = 'chargeback',
  PLATFORM_FEE = 'platform_fee',
  TAX_WITHHOLDING = 'tax_withholding',
  CRYPTO_DEPOSIT = 'crypto_deposit',
  CRYPTO_WITHDRAWAL = 'crypto_withdrawal'
}

export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing', 
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum ReconciliationStatus {
  PENDING = 'pending',
  RECONCILED = 'reconciled',
  DISCREPANCY = 'discrepancy',
  MANUAL_REVIEW = 'manual_review'
}

interface TransactionRule {
  type: TransactionType;
  platformFeePercent: number;
  taxWithholdingPercent?: number;
  processingFeeFlat?: number;
  processingFeePercent?: number;
  minimumAmount?: number;
  maximumAmount?: number;
  allowedCurrencies: string[];
  requiresKYC?: boolean;
}

export class TransactionProcessor extends EventEmitter {
  private transactions: Map<string, Transaction> = new Map();
  private processingQueue: Transaction[] = [];
  private isProcessing = false;
  
  // Transaction processing rules by type and platform
  private readonly TRANSACTION_RULES: Record<string, TransactionRule> = {
    subscription_payment: {
      type: TransactionType.SUBSCRIPTION_PAYMENT,
      platformFeePercent: 10,
      processingFeePercent: 2.9,
      processingFeeFlat: 0.30,
      allowedCurrencies: ['USD', 'EUR', 'BTC', 'ETH'],
      minimumAmount: 1.00
    },
    tip_payment: {
      type: TransactionType.TIP_PAYMENT,
      platformFeePercent: 5,
      processingFeePercent: 2.9,
      processingFeeFlat: 0.30,
      allowedCurrencies: ['USD', 'EUR', 'BTC', 'ETH'],
      minimumAmount: 1.00
    },
    content_purchase: {
      type: TransactionType.CONTENT_PURCHASE,
      platformFeePercent: 15,
      processingFeePercent: 2.9,
      processingFeeFlat: 0.30,
      allowedCurrencies: ['USD', 'EUR', 'BTC', 'ETH'],
      minimumAmount: 0.99
    },
    nft_purchase: {
      type: TransactionType.NFT_PURCHASE,
      platformFeePercent: 2.5,
      processingFeePercent: 0, // Crypto transactions
      allowedCurrencies: ['BTC', 'ETH'],
      minimumAmount: 0.001,
      requiresKYC: true
    },
    creator_payout: {
      type: TransactionType.CREATOR_PAYOUT,
      platformFeePercent: 0,
      processingFeeFlat: 1.00, // Payout fee
      allowedCurrencies: ['USD', 'EUR', 'BTC', 'ETH'],
      minimumAmount: 50.00, // Minimum payout threshold
      requiresKYC: true
    }
  };

  constructor(private ledgerService: CoreLedgerService) {
    super();
    this.startProcessingLoop();
  }

  /**
   * Submit a transaction for processing
   */
  async submitTransaction(params: {
    type: TransactionType;
    platform: string;
    userId?: string;
    creatorId?: string;
    amount: number;
    currency: string;
    metadata: Record<string, any>;
  }): Promise<Transaction> {
    const { type, platform, userId, creatorId, amount, currency, metadata } = params;

    // Validate transaction
    const validation = this.validateTransaction({ type, amount, currency, userId, creatorId });
    if (!validation.isValid) {
      throw new Error(`Transaction validation failed: ${validation.errors.join(', ')}`);
    }

    const transaction: Transaction = {
      id: uuidv4(),
      type,
      platform,
      userId,
      creatorId,
      amount,
      currency,
      status: TransactionStatus.PENDING,
      metadata: {
        ...metadata,
        submittedAt: new Date().toISOString(),
        validationPassed: true
      },
      createdAt: new Date(),
      reconciliationStatus: ReconciliationStatus.PENDING
    };

    this.transactions.set(transaction.id, transaction);
    this.processingQueue.push(transaction);

    this.emit('transactionSubmitted', transaction);
    console.log('💳 Transaction Submitted:', {
      id: transaction.id,
      type: transaction.type,
      platform: transaction.platform,
      amount: `${transaction.amount} ${transaction.currency}`
    });

    return transaction;
  }

  /**
   * Process transactions in the queue
   */
  private async startProcessingLoop(): void {
    if (this.isProcessing) return;
    this.isProcessing = true;

    const processNext = async () => {
      if (this.processingQueue.length === 0) {
        setTimeout(processNext, 1000); // Check again in 1 second
        return;
      }

      const transaction = this.processingQueue.shift()!;
      
      try {
        await this.processTransaction(transaction);
      } catch (error) {
        console.error('Transaction processing failed:', error);
        this.handleTransactionError(transaction, error as Error);
      }

      // Process next transaction
      setImmediate(processNext);
    };

    processNext();
  }

  /**
   * Process a single transaction
   */
  private async processTransaction(transaction: Transaction): Promise<void> {
    transaction.status = TransactionStatus.PROCESSING;
    this.transactions.set(transaction.id, transaction);

    this.emit('transactionProcessing', transaction);

    try {
      let journalEntry: JournalEntry;

      switch (transaction.type) {
        case TransactionType.SUBSCRIPTION_PAYMENT:
          journalEntry = await this.processSubscriptionPayment(transaction);
          break;

        case TransactionType.TIP_PAYMENT:
          journalEntry = await this.processTipPayment(transaction);
          break;

        case TransactionType.CONTENT_PURCHASE:
          journalEntry = await this.processContentPurchase(transaction);
          break;

        case TransactionType.NFT_PURCHASE:
          journalEntry = await this.processNFTPurchase(transaction);
          break;

        case TransactionType.CREATOR_PAYOUT:
          journalEntry = await this.processCreatorPayout(transaction);
          break;

        case TransactionType.REFUND:
          journalEntry = await this.processRefund(transaction);
          break;

        default:
          throw new Error(`Unsupported transaction type: ${transaction.type}`);
      }

      // Post the journal entry
      await this.ledgerService.postJournalEntry(journalEntry.id);

      // Mark transaction as completed
      transaction.status = TransactionStatus.COMPLETED;
      transaction.processedAt = new Date();
      transaction.journalEntryId = journalEntry.id;
      transaction.reconciliationStatus = ReconciliationStatus.RECONCILED;

      this.transactions.set(transaction.id, transaction);
      this.emit('transactionCompleted', transaction);

      console.log('✅ Transaction Processed:', {
        id: transaction.id,
        type: transaction.type,
        journalEntryId: journalEntry.id,
        status: transaction.status
      });

    } catch (error) {
      throw error; // Re-throw to be handled by error handler
    }
  }

  /**
   * Process subscription payment transaction
   */
  private async processSubscriptionPayment(transaction: Transaction): Promise<JournalEntry> {
    if (!transaction.userId || !transaction.creatorId) {
      throw new Error('Subscription payment requires both userId and creatorId');
    }

    const rule = this.TRANSACTION_RULES.subscription_payment;
    
    return this.ledgerService.recordSubscriptionPayment({
      userId: transaction.userId,
      creatorId: transaction.creatorId,
      amount: transaction.amount,
      currency: transaction.currency,
      platform: transaction.platform,
      subscriptionId: transaction.id,
      platformFeePercent: rule.platformFeePercent
    });
  }

  /**
   * Process tip payment transaction
   */
  private async processTipPayment(transaction: Transaction): Promise<JournalEntry> {
    if (!transaction.userId || !transaction.creatorId) {
      throw new Error('Tip payment requires both userId and creatorId');
    }

    const rule = this.TRANSACTION_RULES.tip_payment;
    const platformFee = transaction.amount * (rule.platformFeePercent / 100);
    const creatorPayout = transaction.amount - platformFee;

    // Get required accounts
    const cashAccount = this.ledgerService.getAccountByCode(`1001.${transaction.currency}`);
    const tipRevenueAccount = this.ledgerService.getAccountByCode(`4200.${transaction.currency}`);
    const payoutLiabilityAccount = this.ledgerService.getAccountByCode(`2200.${transaction.currency}`);
    const feeRevenueAccount = this.ledgerService.getAccountByCode(`4400.${transaction.currency}`);
    const creatorExpenseAccount = this.ledgerService.getAccountByCode(`5100.${transaction.currency}`);

    if (!cashAccount || !tipRevenueAccount || !payoutLiabilityAccount || !feeRevenueAccount || !creatorExpenseAccount) {
      throw new Error(`Required accounts not found for currency ${transaction.currency}`);
    }

    return this.ledgerService.createJournalEntry({
      transactionId: transaction.id,
      description: `Tip payment from ${transaction.userId} to ${transaction.creatorId}`,
      platform: transaction.platform,
      userId: transaction.userId,
      lineItems: [
        // Debit: Cash
        {
          id: uuidv4(),
          accountId: cashAccount.id,
          debitAmount: transaction.amount,
          creditAmount: 0,
          currency: transaction.currency,
          description: 'Tip payment received',
          metadata: { userId: transaction.userId, creatorId: transaction.creatorId }
        },
        // Credit: Tip Revenue
        {
          id: uuidv4(),
          accountId: tipRevenueAccount.id,
          debitAmount: 0,
          creditAmount: transaction.amount,
          currency: transaction.currency,
          description: 'Tip revenue recognized',
          metadata: { userId: transaction.userId, creatorId: transaction.creatorId }
        },
        // Debit: Creator Expense
        {
          id: uuidv4(),
          accountId: creatorExpenseAccount.id,
          debitAmount: creatorPayout,
          creditAmount: 0,
          currency: transaction.currency,
          description: 'Creator tip payout expense',
          metadata: { creatorId: transaction.creatorId }
        },
        // Credit: Creator Payouts Pending
        {
          id: uuidv4(),
          accountId: payoutLiabilityAccount.id,
          debitAmount: 0,
          creditAmount: creatorPayout,
          currency: transaction.currency,
          description: 'Creator tip payout liability',
          metadata: { creatorId: transaction.creatorId }
        },
        // Credit: Platform Fee Revenue
        {
          id: uuidv4(),
          accountId: feeRevenueAccount.id,
          debitAmount: 0,
          creditAmount: platformFee,
          currency: transaction.currency,
          description: 'Platform fee revenue from tip',
          metadata: { feePercent: rule.platformFeePercent }
        }
      ],
      metadata: {
        transactionType: 'tip_payment',
        userId: transaction.userId,
        creatorId: transaction.creatorId,
        originalAmount: transaction.amount,
        platformFee,
        creatorPayout
      }
    });
  }

  /**
   * Process content purchase transaction
   */
  private async processContentPurchase(transaction: Transaction): Promise<JournalEntry> {
    if (!transaction.userId || !transaction.creatorId) {
      throw new Error('Content purchase requires both userId and creatorId');
    }

    const rule = this.TRANSACTION_RULES.content_purchase;
    const platformFee = transaction.amount * (rule.platformFeePercent / 100);
    const creatorPayout = transaction.amount - platformFee;

    const cashAccount = this.ledgerService.getAccountByCode(`1001.${transaction.currency}`);
    const contentRevenueAccount = this.ledgerService.getAccountByCode(`4300.${transaction.currency}`);
    const payoutLiabilityAccount = this.ledgerService.getAccountByCode(`2200.${transaction.currency}`);
    const feeRevenueAccount = this.ledgerService.getAccountByCode(`4400.${transaction.currency}`);
    const creatorExpenseAccount = this.ledgerService.getAccountByCode(`5100.${transaction.currency}`);

    if (!cashAccount || !contentRevenueAccount || !payoutLiabilityAccount || !feeRevenueAccount || !creatorExpenseAccount) {
      throw new Error(`Required accounts not found for currency ${transaction.currency}`);
    }

    return this.ledgerService.createJournalEntry({
      transactionId: transaction.id,
      description: `Content purchase by ${transaction.userId} from ${transaction.creatorId}`,
      platform: transaction.platform,
      userId: transaction.userId,
      lineItems: [
        // Debit: Cash
        {
          id: uuidv4(),
          accountId: cashAccount.id,
          debitAmount: transaction.amount,
          creditAmount: 0,
          currency: transaction.currency,
          description: 'Content purchase payment received',
          metadata: { 
            userId: transaction.userId, 
            creatorId: transaction.creatorId,
            contentId: transaction.metadata.contentId
          }
        },
        // Credit: Content Sales Revenue
        {
          id: uuidv4(),
          accountId: contentRevenueAccount.id,
          debitAmount: 0,
          creditAmount: transaction.amount,
          currency: transaction.currency,
          description: 'Content sales revenue recognized',
          metadata: { 
            userId: transaction.userId, 
            creatorId: transaction.creatorId,
            contentId: transaction.metadata.contentId
          }
        },
        // Debit: Creator Payout Expense
        {
          id: uuidv4(),
          accountId: creatorExpenseAccount.id,
          debitAmount: creatorPayout,
          creditAmount: 0,
          currency: transaction.currency,
          description: 'Creator content sales payout expense',
          metadata: { creatorId: transaction.creatorId }
        },
        // Credit: Creator Payouts Pending
        {
          id: uuidv4(),
          accountId: payoutLiabilityAccount.id,
          debitAmount: 0,
          creditAmount: creatorPayout,
          currency: transaction.currency,
          description: 'Creator content sales payout liability',
          metadata: { creatorId: transaction.creatorId }
        },
        // Credit: Platform Fee Revenue
        {
          id: uuidv4(),
          accountId: feeRevenueAccount.id,
          debitAmount: 0,
          creditAmount: platformFee,
          currency: transaction.currency,
          description: 'Platform fee revenue from content sale',
          metadata: { feePercent: rule.platformFeePercent }
        }
      ],
      metadata: {
        transactionType: 'content_purchase',
        userId: transaction.userId,
        creatorId: transaction.creatorId,
        contentId: transaction.metadata.contentId,
        originalAmount: transaction.amount,
        platformFee,
        creatorPayout
      }
    });
  }

  /**
   * Process NFT purchase transaction
   */
  private async processNFTPurchase(transaction: Transaction): Promise<JournalEntry> {
    if (!transaction.userId || !transaction.creatorId) {
      throw new Error('NFT purchase requires both userId and creatorId');
    }

    const rule = this.TRANSACTION_RULES.nft_purchase;
    const platformFee = transaction.amount * (rule.platformFeePercent / 100);
    const creatorPayout = transaction.amount - platformFee;

    const cryptoAccount = this.ledgerService.getAccountByCode(`101${transaction.currency === 'BTC' ? '1' : '2'}.${transaction.currency}`);
    const nftRevenueAccount = this.ledgerService.getAccountByCode(`4500.${transaction.currency}`);
    const payoutLiabilityAccount = this.ledgerService.getAccountByCode(`2200.${transaction.currency}`);
    const feeRevenueAccount = this.ledgerService.getAccountByCode(`4400.${transaction.currency}`);
    const creatorExpenseAccount = this.ledgerService.getAccountByCode(`5100.${transaction.currency}`);

    if (!cryptoAccount || !nftRevenueAccount || !payoutLiabilityAccount || !feeRevenueAccount || !creatorExpenseAccount) {
      throw new Error(`Required accounts not found for currency ${transaction.currency}`);
    }

    return this.ledgerService.createJournalEntry({
      transactionId: transaction.id,
      description: `NFT purchase by ${transaction.userId} from ${transaction.creatorId}`,
      platform: transaction.platform,
      userId: transaction.userId,
      lineItems: [
        // Debit: Crypto Holdings
        {
          id: uuidv4(),
          accountId: cryptoAccount.id,
          debitAmount: transaction.amount,
          creditAmount: 0,
          currency: transaction.currency,
          description: 'NFT purchase crypto received',
          metadata: { 
            userId: transaction.userId, 
            creatorId: transaction.creatorId,
            nftId: transaction.metadata.nftId,
            tokenId: transaction.metadata.tokenId
          }
        },
        // Credit: NFT Sales Revenue
        {
          id: uuidv4(),
          accountId: nftRevenueAccount.id,
          debitAmount: 0,
          creditAmount: transaction.amount,
          currency: transaction.currency,
          description: 'NFT sales revenue recognized',
          metadata: { 
            userId: transaction.userId, 
            creatorId: transaction.creatorId,
            nftId: transaction.metadata.nftId
          }
        },
        // Debit: Creator Payout Expense
        {
          id: uuidv4(),
          accountId: creatorExpenseAccount.id,
          debitAmount: creatorPayout,
          creditAmount: 0,
          currency: transaction.currency,
          description: 'Creator NFT sales payout expense',
          metadata: { creatorId: transaction.creatorId }
        },
        // Credit: Creator Payouts Pending
        {
          id: uuidv4(),
          accountId: payoutLiabilityAccount.id,
          debitAmount: 0,
          creditAmount: creatorPayout,
          currency: transaction.currency,
          description: 'Creator NFT sales payout liability',
          metadata: { creatorId: transaction.creatorId }
        },
        // Credit: Platform Fee Revenue
        {
          id: uuidv4(),
          accountId: feeRevenueAccount.id,
          debitAmount: 0,
          creditAmount: platformFee,
          currency: transaction.currency,
          description: 'Platform fee revenue from NFT sale',
          metadata: { feePercent: rule.platformFeePercent }
        }
      ],
      metadata: {
        transactionType: 'nft_purchase',
        userId: transaction.userId,
        creatorId: transaction.creatorId,
        nftId: transaction.metadata.nftId,
        tokenId: transaction.metadata.tokenId,
        originalAmount: transaction.amount,
        platformFee,
        creatorPayout
      }
    });
  }

  /**
   * Process creator payout transaction
   */
  private async processCreatorPayout(transaction: Transaction): Promise<JournalEntry> {
    if (!transaction.creatorId) {
      throw new Error('Creator payout requires creatorId');
    }

    return this.ledgerService.recordCreatorPayout({
      creatorId: transaction.creatorId,
      amount: transaction.amount,
      currency: transaction.currency,
      paymentMethod: transaction.metadata.paymentMethod || 'bank_transfer',
      platform: transaction.platform,
      payoutId: transaction.id
    });
  }

  /**
   * Process refund transaction
   */
  private async processRefund(transaction: Transaction): Promise<JournalEntry> {
    const originalTransactionId = transaction.metadata.originalTransactionId;
    if (!originalTransactionId) {
      throw new Error('Refund transaction requires originalTransactionId');
    }

    // In a real implementation, you would reverse the original transaction
    // For now, we'll create a basic refund entry
    const cashAccount = this.ledgerService.getAccountByCode(`1001.${transaction.currency}`);
    const refundExpenseAccount = this.ledgerService.getAccountByCode(`5300.${transaction.currency}`); // Platform Operating Expenses

    if (!cashAccount || !refundExpenseAccount) {
      throw new Error(`Required accounts not found for currency ${transaction.currency}`);
    }

    return this.ledgerService.createJournalEntry({
      transactionId: transaction.id,
      description: `Refund for transaction ${originalTransactionId}`,
      platform: transaction.platform,
      userId: transaction.userId,
      lineItems: [
        // Debit: Platform Operating Expenses (Refund)
        {
          id: uuidv4(),
          accountId: refundExpenseAccount.id,
          debitAmount: transaction.amount,
          creditAmount: 0,
          currency: transaction.currency,
          description: 'Refund expense',
          metadata: { originalTransactionId, userId: transaction.userId }
        },
        // Credit: Cash
        {
          id: uuidv4(),
          accountId: cashAccount.id,
          debitAmount: 0,
          creditAmount: transaction.amount,
          currency: transaction.currency,
          description: 'Cash refunded to customer',
          metadata: { originalTransactionId, userId: transaction.userId }
        }
      ],
      metadata: {
        transactionType: 'refund',
        originalTransactionId,
        userId: transaction.userId,
        refundAmount: transaction.amount
      }
    });
  }

  /**
   * Validate transaction before processing
   */
  private validateTransaction(params: {
    type: TransactionType;
    amount: number;
    currency: string;
    userId?: string;
    creatorId?: string;
  }): { isValid: boolean; errors: string[] } {
    const { type, amount, currency, userId, creatorId } = params;
    const errors: string[] = [];

    const rule = this.TRANSACTION_RULES[type];
    if (!rule) {
      errors.push(`No processing rule found for transaction type: ${type}`);
      return { isValid: false, errors };
    }

    // Check currency support
    if (!rule.allowedCurrencies.includes(currency)) {
      errors.push(`Currency ${currency} not supported for ${type}`);
    }

    // Check amount limits
    if (rule.minimumAmount && amount < rule.minimumAmount) {
      errors.push(`Amount ${amount} below minimum ${rule.minimumAmount} for ${type}`);
    }

    if (rule.maximumAmount && amount > rule.maximumAmount) {
      errors.push(`Amount ${amount} above maximum ${rule.maximumAmount} for ${type}`);
    }

    // Check required fields based on transaction type
    if ([TransactionType.SUBSCRIPTION_PAYMENT, TransactionType.TIP_PAYMENT, TransactionType.CONTENT_PURCHASE, TransactionType.NFT_PURCHASE].includes(type)) {
      if (!userId) errors.push('userId required for payment transactions');
      if (!creatorId) errors.push('creatorId required for payment transactions');
    }

    if (type === TransactionType.CREATOR_PAYOUT && !creatorId) {
      errors.push('creatorId required for creator payout');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Handle transaction processing errors
   */
  private handleTransactionError(transaction: Transaction, error: Error): void {
    transaction.status = TransactionStatus.FAILED;
    transaction.failedAt = new Date();
    transaction.error = error.message;

    this.transactions.set(transaction.id, transaction);
    this.emit('transactionFailed', { transaction, error });

    console.error('❌ Transaction Failed:', {
      id: transaction.id,
      type: transaction.type,
      error: error.message
    });
  }

  /**
   * Get transaction by ID
   */
  getTransaction(id: string): Transaction | undefined {
    return this.transactions.get(id);
  }

  /**
   * Get all transactions for a user
   */
  getUserTransactions(userId: string): Transaction[] {
    return Array.from(this.transactions.values())
      .filter(t => t.userId === userId || t.creatorId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get transaction statistics
   */
  getTransactionStats(): {
    total: number;
    byStatus: Record<TransactionStatus, number>;
    byType: Record<TransactionType, number>;
    totalVolume: Record<string, number>;
  } {
    const stats = {
      total: this.transactions.size,
      byStatus: {} as Record<TransactionStatus, number>,
      byType: {} as Record<TransactionType, number>,
      totalVolume: {} as Record<string, number>
    };

    Object.values(TransactionStatus).forEach(status => {
      stats.byStatus[status] = 0;
    });

    Object.values(TransactionType).forEach(type => {
      stats.byType[type] = 0;
    });

    for (const transaction of this.transactions.values()) {
      stats.byStatus[transaction.status]++;
      stats.byType[transaction.type]++;
      
      const key = `${transaction.currency}_volume`;
      stats.totalVolume[key] = (stats.totalVolume[key] || 0) + transaction.amount;
    }

    return stats;
  }
}

export default TransactionProcessor;