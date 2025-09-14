import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

// 💰 FanzFinance OS - Core Ledger Service
// Double-entry bookkeeping system with real-time balance calculations

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  parentAccountId?: string;
  currency: Currency;
  isActive: boolean;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export enum AccountType {
  ASSET = 'asset',
  LIABILITY = 'liability',
  EQUITY = 'equity',
  REVENUE = 'revenue',
  EXPENSE = 'expense'
}

export interface Currency {
  code: string; // USD, EUR, BTC, ETH, etc.
  symbol: string;
  decimals: number;
  type: 'fiat' | 'crypto';
}

export interface JournalEntry {
  id: string;
  transactionId: string;
  description: string;
  reference?: string;
  platform: string; // Which FANZ platform generated this
  userId?: string;
  createdAt: Date;
  postedAt?: Date;
  reversedAt?: Date;
  lineItems: LedgerLine[];
  status: EntryStatus;
  metadata: Record<string, any>;
}

export enum EntryStatus {
  DRAFT = 'draft',
  POSTED = 'posted',
  REVERSED = 'reversed'
}

export interface LedgerLine {
  id: string;
  accountId: string;
  debitAmount: number;
  creditAmount: number;
  currency: string;
  description: string;
  metadata: Record<string, any>;
}

export interface Balance {
  accountId: string;
  currency: string;
  debitBalance: number;
  creditBalance: number;
  netBalance: number;
  asOfDate: Date;
}

export interface BalanceCalculationResult {
  balances: Balance[];
  calculatedAt: Date;
  totalAssets: Record<string, number>;
  totalLiabilities: Record<string, number>;
  totalEquity: Record<string, number>;
  isBalanced: boolean;
}

export class CoreLedgerService extends EventEmitter {
  private accounts: Map<string, Account> = new Map();
  private journalEntries: Map<string, JournalEntry> = new Map();
  private balanceCache: Map<string, Balance> = new Map();
  
  // Standard Chart of Accounts for Creator Economy
  private readonly STANDARD_ACCOUNTS = {
    // Assets
    CASH_USD: { code: '1001', name: 'Cash - USD', type: AccountType.ASSET },
    CASH_EUR: { code: '1002', name: 'Cash - EUR', type: AccountType.ASSET },
    CRYPTO_BTC: { code: '1011', name: 'Bitcoin Holdings', type: AccountType.ASSET },
    CRYPTO_ETH: { code: '1012', name: 'Ethereum Holdings', type: AccountType.ASSET },
    ACCOUNTS_RECEIVABLE: { code: '1100', name: 'Accounts Receivable', type: AccountType.ASSET },
    CREATOR_ADVANCES: { code: '1200', name: 'Creator Advance Payments', type: AccountType.ASSET },
    
    // Liabilities
    ACCOUNTS_PAYABLE: { code: '2100', name: 'Accounts Payable', type: AccountType.LIABILITY },
    CREATOR_PAYOUTS_PENDING: { code: '2200', name: 'Creator Payouts Pending', type: AccountType.LIABILITY },
    PLATFORM_FEES_PAYABLE: { code: '2300', name: 'Platform Fees Payable', type: AccountType.LIABILITY },
    TAX_WITHHOLDING: { code: '2400', name: 'Tax Withholding Payable', type: AccountType.LIABILITY },
    
    // Equity
    RETAINED_EARNINGS: { code: '3100', name: 'Retained Earnings', type: AccountType.EQUITY },
    PLATFORM_EQUITY: { code: '3200', name: 'Platform Equity', type: AccountType.EQUITY },
    
    // Revenue
    SUBSCRIPTION_REVENUE: { code: '4100', name: 'Subscription Revenue', type: AccountType.REVENUE },
    TIP_REVENUE: { code: '4200', name: 'Tip Revenue', type: AccountType.REVENUE },
    CONTENT_SALES: { code: '4300', name: 'Content Sales Revenue', type: AccountType.REVENUE },
    PLATFORM_FEES: { code: '4400', name: 'Platform Fee Revenue', type: AccountType.REVENUE },
    NFT_SALES: { code: '4500', name: 'NFT Sales Revenue', type: AccountType.REVENUE },
    
    // Expenses
    CREATOR_PAYOUTS: { code: '5100', name: 'Creator Payout Expense', type: AccountType.EXPENSE },
    PAYMENT_PROCESSING: { code: '5200', name: 'Payment Processing Fees', type: AccountType.EXPENSE },
    PLATFORM_OPERATING: { code: '5300', name: 'Platform Operating Expenses', type: AccountType.EXPENSE },
    TAX_EXPENSE: { code: '5400', name: 'Tax Expense', type: AccountType.EXPENSE }
  };

  constructor() {
    super();
    this.initializeStandardAccounts();
  }

  private initializeStandardAccounts(): void {
    Object.entries(this.STANDARD_ACCOUNTS).forEach(([key, accountDef]) => {
      const currencies: Currency[] = [
        { code: 'USD', symbol: '$', decimals: 2, type: 'fiat' },
        { code: 'EUR', symbol: '€', decimals: 2, type: 'fiat' },
        { code: 'BTC', symbol: '₿', decimals: 8, type: 'crypto' },
        { code: 'ETH', symbol: 'Ξ', decimals: 18, type: 'crypto' }
      ];

      // Create account for each supported currency
      currencies.forEach(currency => {
        const account: Account = {
          id: uuidv4(),
          code: `${accountDef.code}.${currency.code}`,
          name: `${accountDef.name} (${currency.code})`,
          type: accountDef.type,
          currency,
          isActive: true,
          metadata: { standardAccount: key },
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.accounts.set(account.id, account);
      });
    });

    console.log('✅ FanzFinance OS: Standard Chart of Accounts initialized');
    this.emit('accountsInitialized', { accountCount: this.accounts.size });
  }

  /**
   * Create a journal entry for any financial transaction across FANZ platforms
   */
  async createJournalEntry(entry: Omit<JournalEntry, 'id' | 'status' | 'createdAt'>): Promise<JournalEntry> {
    // Validate double-entry bookkeeping rules
    const validation = this.validateJournalEntry(entry.lineItems);
    if (!validation.isValid) {
      throw new Error(`Invalid journal entry: ${validation.errors.join(', ')}`);
    }

    const journalEntry: JournalEntry = {
      ...entry,
      id: uuidv4(),
      status: EntryStatus.DRAFT,
      createdAt: new Date()
    };

    this.journalEntries.set(journalEntry.id, journalEntry);

    this.emit('journalEntryCreated', journalEntry);
    console.log('📝 Journal Entry Created:', {
      id: journalEntry.id,
      platform: journalEntry.platform,
      description: journalEntry.description,
      lineItemCount: journalEntry.lineItems.length
    });

    return journalEntry;
  }

  /**
   * Post a journal entry to update balances
   */
  async postJournalEntry(entryId: string): Promise<void> {
    const entry = this.journalEntries.get(entryId);
    if (!entry) {
      throw new Error(`Journal entry ${entryId} not found`);
    }

    if (entry.status !== EntryStatus.DRAFT) {
      throw new Error(`Cannot post journal entry with status: ${entry.status}`);
    }

    // Update the entry status
    entry.status = EntryStatus.POSTED;
    entry.postedAt = new Date();

    // Invalidate balance cache for affected accounts
    entry.lineItems.forEach(line => {
      const cacheKey = `${line.accountId}-${line.currency}`;
      this.balanceCache.delete(cacheKey);
    });

    this.emit('journalEntryPosted', entry);
    console.log('✅ Journal Entry Posted:', {
      id: entry.id,
      platform: entry.platform,
      description: entry.description
    });
  }

  /**
   * Calculate real-time balances for all accounts
   */
  async calculateBalances(asOfDate?: Date): Promise<BalanceCalculationResult> {
    const calculationDate = asOfDate || new Date();
    const balances: Balance[] = [];
    const totals = {
      assets: {} as Record<string, number>,
      liabilities: {} as Record<string, number>,
      equity: {} as Record<string, number>
    };

    // Calculate balance for each account
    for (const [accountId, account] of this.accounts) {
      if (!account.isActive) continue;

      const balance = await this.calculateAccountBalance(accountId, account.currency.code, calculationDate);
      balances.push(balance);

      // Aggregate totals by account type and currency
      const amount = balance.netBalance;
      const currency = account.currency.code;

      switch (account.type) {
        case AccountType.ASSET:
          totals.assets[currency] = (totals.assets[currency] || 0) + amount;
          break;
        case AccountType.LIABILITY:
          totals.liabilities[currency] = (totals.liabilities[currency] || 0) + amount;
          break;
        case AccountType.EQUITY:
        case AccountType.REVENUE:
          totals.equity[currency] = (totals.equity[currency] || 0) + amount;
          break;
        case AccountType.EXPENSE:
          totals.equity[currency] = (totals.equity[currency] || 0) - amount;
          break;
      }
    }

    // Check if books are balanced (Assets = Liabilities + Equity)
    const isBalanced = this.checkBooksBalanced(totals.assets, totals.liabilities, totals.equity);

    const result: BalanceCalculationResult = {
      balances,
      calculatedAt: calculationDate,
      totalAssets: totals.assets,
      totalLiabilities: totals.liabilities,
      totalEquity: totals.equity,
      isBalanced
    };

    this.emit('balancesCalculated', result);
    return result;
  }

  /**
   * Calculate balance for a specific account
   */
  private async calculateAccountBalance(accountId: string, currency: string, asOfDate: Date): Promise<Balance> {
    const cacheKey = `${accountId}-${currency}-${asOfDate.toISOString()}`;
    const cached = this.balanceCache.get(cacheKey);
    if (cached) return cached;

    let debitTotal = 0;
    let creditTotal = 0;

    // Sum all posted journal entries for this account up to the as-of date
    for (const [_, entry] of this.journalEntries) {
      if (entry.status !== EntryStatus.POSTED) continue;
      if (!entry.postedAt || entry.postedAt > asOfDate) continue;

      entry.lineItems.forEach(line => {
        if (line.accountId === accountId && line.currency === currency) {
          debitTotal += line.debitAmount;
          creditTotal += line.creditAmount;
        }
      });
    }

    const balance: Balance = {
      accountId,
      currency,
      debitBalance: debitTotal,
      creditBalance: creditTotal,
      netBalance: debitTotal - creditTotal,
      asOfDate
    };

    this.balanceCache.set(cacheKey, balance);
    return balance;
  }

  /**
   * Validate journal entry follows double-entry bookkeeping rules
   */
  private validateJournalEntry(lineItems: LedgerLine[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (lineItems.length < 2) {
      errors.push('Journal entry must have at least 2 line items');
    }

    // Group by currency and check if debits = credits
    const currencyTotals: Record<string, { debits: number; credits: number }> = {};

    lineItems.forEach(line => {
      if (!currencyTotals[line.currency]) {
        currencyTotals[line.currency] = { debits: 0, credits: 0 };
      }
      currencyTotals[line.currency].debits += line.debitAmount;
      currencyTotals[line.currency].credits += line.creditAmount;

      // Validate that each line has either debit OR credit, not both
      if ((line.debitAmount > 0 && line.creditAmount > 0) || 
          (line.debitAmount === 0 && line.creditAmount === 0)) {
        errors.push(`Line item ${line.id} must have either debit or credit amount, not both or neither`);
      }

      // Validate account exists
      const accountExists = Array.from(this.accounts.values()).some(acc => acc.id === line.accountId);
      if (!accountExists) {
        errors.push(`Account ${line.accountId} does not exist`);
      }
    });

    // Check balance for each currency
    Object.entries(currencyTotals).forEach(([currency, totals]) => {
      const difference = Math.abs(totals.debits - totals.credits);
      if (difference > 0.001) { // Allow for small rounding differences
        errors.push(`Debits (${totals.debits}) must equal credits (${totals.credits}) for ${currency}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if the books are balanced across all currencies
   */
  private checkBooksBalanced(
    assets: Record<string, number>,
    liabilities: Record<string, number>,
    equity: Record<string, number>
  ): boolean {
    const currencies = new Set([...Object.keys(assets), ...Object.keys(liabilities), ...Object.keys(equity)]);
    
    for (const currency of currencies) {
      const assetTotal = assets[currency] || 0;
      const liabilityTotal = liabilities[currency] || 0;
      const equityTotal = equity[currency] || 0;
      
      const difference = Math.abs(assetTotal - (liabilityTotal + equityTotal));
      if (difference > 0.001) { // Allow for small rounding differences
        console.warn(`Books not balanced for ${currency}: Assets=${assetTotal}, Liabilities+Equity=${liabilityTotal + equityTotal}`);
        return false;
      }
    }
    
    return true;
  }

  /**
   * Get account by code (for easy lookup)
   */
  getAccountByCode(code: string): Account | undefined {
    return Array.from(this.accounts.values()).find(acc => acc.code === code);
  }

  /**
   * Get all accounts of a specific type
   */
  getAccountsByType(type: AccountType): Account[] {
    return Array.from(this.accounts.values()).filter(acc => acc.type === type && acc.isActive);
  }

  /**
   * Create standard journal entries for common FANZ platform transactions
   */
  async recordSubscriptionPayment(params: {
    userId: string;
    creatorId: string;
    amount: number;
    currency: string;
    platform: string;
    subscriptionId: string;
    platformFeePercent: number;
  }): Promise<JournalEntry> {
    const { userId, creatorId, amount, currency, platform, subscriptionId, platformFeePercent } = params;
    
    const platformFee = amount * (platformFeePercent / 100);
    const creatorPayout = amount - platformFee;

    const cashAccount = this.getAccountByCode(`1001.${currency}`);
    const revenueAccount = this.getAccountByCode(`4100.${currency}`);
    const payoutLiabilityAccount = this.getAccountByCode(`2200.${currency}`);
    const feeRevenueAccount = this.getAccountByCode(`4400.${currency}`);

    if (!cashAccount || !revenueAccount || !payoutLiabilityAccount || !feeRevenueAccount) {
      throw new Error(`Required accounts not found for currency ${currency}`);
    }

    return this.createJournalEntry({
      transactionId: subscriptionId,
      description: `Subscription payment from user ${userId} to creator ${creatorId}`,
      reference: subscriptionId,
      platform,
      userId,
      lineItems: [
        // Debit: Cash (Asset increases)
        {
          id: uuidv4(),
          accountId: cashAccount.id,
          debitAmount: amount,
          creditAmount: 0,
          currency,
          description: 'Subscription payment received',
          metadata: { userId, creatorId }
        },
        // Credit: Subscription Revenue
        {
          id: uuidv4(),
          accountId: revenueAccount.id,
          debitAmount: 0,
          creditAmount: amount,
          currency,
          description: 'Subscription revenue recognized',
          metadata: { userId, creatorId }
        },
        // Debit: Creator Payout Expense
        {
          id: uuidv4(),
          accountId: this.getAccountByCode(`5100.${currency}`)!.id,
          debitAmount: creatorPayout,
          creditAmount: 0,
          currency,
          description: 'Creator payout expense',
          metadata: { creatorId }
        },
        // Credit: Creator Payouts Pending (Liability)
        {
          id: uuidv4(),
          accountId: payoutLiabilityAccount.id,
          debitAmount: 0,
          creditAmount: creatorPayout,
          currency,
          description: 'Creator payout liability',
          metadata: { creatorId }
        },
        // Credit: Platform Fee Revenue
        {
          id: uuidv4(),
          accountId: feeRevenueAccount.id,
          debitAmount: 0,
          creditAmount: platformFee,
          currency,
          description: 'Platform fee revenue',
          metadata: { feePercent: platformFeePercent }
        }
      ],
      metadata: {
        transactionType: 'subscription_payment',
        userId,
        creatorId,
        originalAmount: amount,
        platformFee,
        creatorPayout
      }
    });
  }

  /**
   * Record creator payout when processed
   */
  async recordCreatorPayout(params: {
    creatorId: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    platform: string;
    payoutId: string;
  }): Promise<JournalEntry> {
    const { creatorId, amount, currency, paymentMethod, platform, payoutId } = params;

    const payoutLiabilityAccount = this.getAccountByCode(`2200.${currency}`);
    const cashAccount = this.getAccountByCode(`1001.${currency}`);

    if (!payoutLiabilityAccount || !cashAccount) {
      throw new Error(`Required accounts not found for currency ${currency}`);
    }

    return this.createJournalEntry({
      transactionId: payoutId,
      description: `Creator payout to ${creatorId} via ${paymentMethod}`,
      reference: payoutId,
      platform,
      lineItems: [
        // Debit: Creator Payouts Pending (Liability decreases)
        {
          id: uuidv4(),
          accountId: payoutLiabilityAccount.id,
          debitAmount: amount,
          creditAmount: 0,
          currency,
          description: 'Creator payout liability settled',
          metadata: { creatorId, paymentMethod }
        },
        // Credit: Cash (Asset decreases)
        {
          id: uuidv4(),
          accountId: cashAccount.id,
          debitAmount: 0,
          creditAmount: amount,
          currency,
          description: 'Cash paid to creator',
          metadata: { creatorId, paymentMethod }
        }
      ],
      metadata: {
        transactionType: 'creator_payout',
        creatorId,
        paymentMethod,
        payoutId
      }
    });
  }
}

export default CoreLedgerService;