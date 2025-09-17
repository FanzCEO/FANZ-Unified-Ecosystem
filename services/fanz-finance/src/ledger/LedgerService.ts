/**
 * 💰 Core Ledger Service - Double-Entry Accounting System
 * 
 * Immutable journal with real-time balance calculations
 * Maintains financial integrity across all FANZ platform operations
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
import { DatabaseService } from '../database/DatabaseService';
import { CacheService } from '../cache/CacheService';
import { EventBus } from '../events/EventBus';
import { logger } from '../utils/logger';
import { metrics } from '../monitoring/metrics';

// ===== TYPE DEFINITIONS =====

export interface LedgerEntry {
  id: string;
  journal_id: string;
  account: string;
  debit: number | null;
  credit: number | null;
  currency: string;
  created_at: Date;
  metadata?: Record<string, any>;
}

export interface JournalEntry {
  id: string;
  description: string;
  reference: string | null;
  transaction_date: Date;
  entries: LedgerEntry[];
  status: 'pending' | 'posted' | 'cancelled';
  created_by: string;
  created_at: Date;
  posted_at: Date | null;
  metadata?: Record<string, any>;
  checksum: string;
}

export interface Account {
  id: string;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  parent_account?: string;
  currency: string;
  is_active: boolean;
  created_at: Date;
  metadata?: Record<string, any>;
}

export interface AccountBalance {
  account_id: string;
  account_code: string;
  balance: number;
  currency: string;
  last_updated: Date;
  available_balance: number;
  pending_balance: number;
  reserved_balance: number;
}

export interface CreateJournalEntryRequest {
  description: string;
  reference?: string;
  transaction_date?: Date;
  entries: Array<{
    account: string;
    debit?: number;
    credit?: number;
    currency?: string;
    metadata?: Record<string, any>;
  }>;
  metadata?: Record<string, any>;
  created_by: string;
  idempotency_key?: string;
}

// ===== MAIN LEDGER SERVICE =====

export class LedgerService extends EventEmitter {
  private db: DatabaseService;
  private cache: CacheService;
  private eventBus: EventBus;
  private baseCurrency: string = 'USD';
  
  constructor(
    db: DatabaseService, 
    cache: CacheService, 
    eventBus: EventBus
  ) {
    super();
    this.db = db;
    this.cache = cache;
    this.eventBus = eventBus;
    this.baseCurrency = process.env.FANZ_BASE_CURRENCY || 'USD';
  }

  /**
   * Create a new journal entry with double-entry validation
   */
  public async createJournalEntry(request: CreateJournalEntryRequest): Promise<JournalEntry> {
    const startTime = Date.now();
    
    try {
      // Validate the journal entry
      this.validateJournalEntry(request);

      // Check idempotency
      if (request.idempotency_key) {
        const existing = await this.getJournalEntryByIdempotencyKey(request.idempotency_key);
        if (existing) {
          logger.info(`Returning existing journal entry for idempotency key: ${request.idempotency_key}`);
          return existing;
        }
      }

      // Start database transaction
      return await this.db.transaction(async (trx) => {
        // Create journal entry
        const journalId = uuidv4();
        const transactionDate = request.transaction_date || new Date();
        
        const journalEntry: JournalEntry = {
          id: journalId,
          description: request.description,
          reference: request.reference || null,
          transaction_date: transactionDate,
          entries: [],
          status: 'pending',
          created_by: request.created_by,
          created_at: new Date(),
          posted_at: null,
          metadata: request.metadata,
          checksum: ''
        };

        // Insert journal entry
        await trx('journal_entries').insert({
          id: journalEntry.id,
          description: journalEntry.description,
          reference: journalEntry.reference,
          transaction_date: journalEntry.transaction_date,
          status: journalEntry.status,
          created_by: journalEntry.created_by,
          created_at: journalEntry.created_at,
          metadata: JSON.stringify(journalEntry.metadata || {}),
          idempotency_key: request.idempotency_key
        });

        // Create ledger entries
        const ledgerEntries: LedgerEntry[] = [];
        
        for (const entryData of request.entries) {
          const entryId = uuidv4();
          const currency = entryData.currency || this.baseCurrency;
          
          // Validate account exists
          const account = await this.getAccountByCode(entryData.account, trx);
          if (!account) {
            throw new Error(`Account not found: ${entryData.account}`);
          }

          const ledgerEntry: LedgerEntry = {
            id: entryId,
            journal_id: journalId,
            account: account.id,
            debit: entryData.debit || null,
            credit: entryData.credit || null,
            currency,
            created_at: new Date(),
            metadata: entryData.metadata
          };

          // Insert ledger entry
          await trx('ledger_entries').insert({
            id: ledgerEntry.id,
            journal_id: ledgerEntry.journal_id,
            account_id: ledgerEntry.account,
            debit_amount: ledgerEntry.debit,
            credit_amount: ledgerEntry.credit,
            currency: ledgerEntry.currency,
            created_at: ledgerEntry.created_at,
            metadata: JSON.stringify(ledgerEntry.metadata || {})
          });

          ledgerEntries.push(ledgerEntry);
        }

        // Calculate checksum for integrity
        const checksum = this.calculateJournalChecksum(journalEntry, ledgerEntries);
        
        // Update journal with checksum and post it
        await trx('journal_entries')
          .where('id', journalId)
          .update({
            status: 'posted',
            posted_at: new Date(),
            checksum
          });

        journalEntry.entries = ledgerEntries;
        journalEntry.status = 'posted';
        journalEntry.posted_at = new Date();
        journalEntry.checksum = checksum;

        // Update account balances
        await this.updateAccountBalances(ledgerEntries, trx);

        // Clear relevant caches
        await this.invalidateBalanceCaches(ledgerEntries);

        // Emit events
        this.eventBus.publish('journal.entry.created', {
          journalId: journalEntry.id,
          amount: this.getJournalEntryAmount(ledgerEntries),
          currency: this.baseCurrency,
          description: journalEntry.description
        });

        // Record metrics
        const processingTime = Date.now() - startTime;
        metrics.recordLedgerOperation('journal_entry_created', processingTime);

        logger.info(`Journal entry created: ${journalId}`, {
          journalId,
          description: request.description,
          entriesCount: ledgerEntries.length,
          processingTimeMs: processingTime
        });

        return journalEntry;
      });

    } catch (error) {
      logger.error('Failed to create journal entry:', error);
      metrics.recordLedgerError('journal_entry_creation_failed');
      throw error;
    }
  }

  /**
   * Get account balance with caching
   */
  public async getAccountBalance(accountCode: string, currency?: string): Promise<AccountBalance | null> {
    try {
      const cacheKey = `balance:${accountCode}:${currency || this.baseCurrency}`;
      
      // Try cache first
      const cachedBalance = await this.cache.get(cacheKey);
      if (cachedBalance) {
        return JSON.parse(cachedBalance);
      }

      // Calculate balance from ledger
      const account = await this.getAccountByCode(accountCode);
      if (!account) {
        return null;
      }

      const balance = await this.calculateAccountBalance(account.id, currency || this.baseCurrency);
      
      // Cache for 1 minute (balances change frequently)
      await this.cache.setEx(cacheKey, 60, JSON.stringify(balance));

      return balance;

    } catch (error) {
      logger.error(`Failed to get account balance for ${accountCode}:`, error);
      return null;
    }
  }

  /**
   * Get multiple account balances efficiently
   */
  public async getAccountBalances(accountCodes: string[], currency?: string): Promise<AccountBalance[]> {
    const balances: AccountBalance[] = [];
    
    for (const accountCode of accountCodes) {
      const balance = await this.getAccountBalance(accountCode, currency);
      if (balance) {
        balances.push(balance);
      }
    }

    return balances;
  }

  /**
   * Get transaction history for an account
   */
  public async getAccountTransactions(
    accountCode: string,
    options: {
      limit?: number;
      offset?: number;
      startDate?: Date;
      endDate?: Date;
      currency?: string;
    } = {}
  ): Promise<LedgerEntry[]> {
    try {
      const account = await this.getAccountByCode(accountCode);
      if (!account) {
        throw new Error(`Account not found: ${accountCode}`);
      }

      const query = this.db.getKnex()
        .select([
          'le.id',
          'le.journal_id',
          'le.account_id as account',
          'le.debit_amount as debit',
          'le.credit_amount as credit',
          'le.currency',
          'le.created_at',
          'le.metadata',
          'je.description',
          'je.reference'
        ])
        .from('ledger_entries as le')
        .join('journal_entries as je', 'le.journal_id', 'je.id')
        .where('le.account_id', account.id)
        .orderBy('le.created_at', 'desc');

      if (options.startDate) {
        query.where('le.created_at', '>=', options.startDate);
      }

      if (options.endDate) {
        query.where('le.created_at', '<=', options.endDate);
      }

      if (options.currency) {
        query.where('le.currency', options.currency);
      }

      if (options.limit) {
        query.limit(options.limit);
      }

      if (options.offset) {
        query.offset(options.offset);
      }

      const results = await query;

      return results.map(row => ({
        id: row.id,
        journal_id: row.journal_id,
        account: row.account,
        debit: row.debit,
        credit: row.credit,
        currency: row.currency,
        created_at: row.created_at,
        metadata: row.metadata ? JSON.parse(row.metadata) : undefined
      }));

    } catch (error) {
      logger.error(`Failed to get transactions for account ${accountCode}:`, error);
      throw error;
    }
  }

  /**
   * Perform daily reconciliation
   */
  public async performReconciliation(date: Date = new Date()): Promise<{
    success: boolean;
    totalDebits: number;
    totalCredits: number;
    imbalances: Array<{ account: string; imbalance: number }>;
  }> {
    try {
      logger.info(`Starting reconciliation for date: ${date.toISOString()}`);

      const reconciliationResults = await this.db.transaction(async (trx) => {
        // Get all transactions for the date
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        // Calculate total debits and credits
        const totals = await trx('ledger_entries')
          .select(
            trx.raw('SUM(debit_amount) as total_debits'),
            trx.raw('SUM(credit_amount) as total_credits')
          )
          .whereBetween('created_at', [startOfDay, endOfDay])
          .first();

        const totalDebits = parseFloat(totals.total_debits || '0');
        const totalCredits = parseFloat(totals.total_credits || '0');

        // Check for imbalances by account
        const accountImbalances = await trx('ledger_entries')
          .select('account_id')
          .select(
            trx.raw('(SUM(COALESCE(debit_amount, 0)) - SUM(COALESCE(credit_amount, 0))) as imbalance')
          )
          .whereBetween('created_at', [startOfDay, endOfDay])
          .groupBy('account_id')
          .having(trx.raw('ABS(SUM(COALESCE(debit_amount, 0)) - SUM(COALESCE(credit_amount, 0))) > 0.01'));

        // Record reconciliation result
        await trx('reconciliations').insert({
          id: uuidv4(),
          reconciliation_date: date,
          total_debits: totalDebits,
          total_credits: totalCredits,
          is_balanced: Math.abs(totalDebits - totalCredits) < 0.01,
          imbalances_count: accountImbalances.length,
          created_at: new Date()
        });

        return {
          success: Math.abs(totalDebits - totalCredits) < 0.01,
          totalDebits,
          totalCredits,
          imbalances: accountImbalances
        };
      });

      // Emit reconciliation event
      this.eventBus.publish('ledger.reconciliation.completed', {
        date: date.toISOString(),
        success: reconciliationResults.success,
        totalDebits: reconciliationResults.totalDebits,
        totalCredits: reconciliationResults.totalCredits
      });

      logger.info(`Reconciliation completed for ${date.toISOString()}`, reconciliationResults);

      return reconciliationResults;

    } catch (error) {
      logger.error('Reconciliation failed:', error);
      throw error;
    }
  }

  /**
   * Create account if it doesn't exist
   */
  public async createAccount(accountData: {
    code: string;
    name: string;
    type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
    parent_account?: string;
    currency?: string;
    metadata?: Record<string, any>;
  }): Promise<Account> {
    try {
      const accountId = uuidv4();
      
      const account: Account = {
        id: accountId,
        code: accountData.code,
        name: accountData.name,
        type: accountData.type,
        parent_account: accountData.parent_account,
        currency: accountData.currency || this.baseCurrency,
        is_active: true,
        created_at: new Date(),
        metadata: accountData.metadata
      };

      await this.db.getKnex()('accounts').insert({
        id: account.id,
        code: account.code,
        name: account.name,
        type: account.type,
        parent_account_id: account.parent_account,
        currency: account.currency,
        is_active: account.is_active,
        created_at: account.created_at,
        metadata: JSON.stringify(account.metadata || {})
      });

      // Clear account cache
      await this.cache.del(`account:${accountData.code}`);

      logger.info(`Account created: ${account.code} (${account.name})`);

      return account;

    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new Error(`Account code already exists: ${accountData.code}`);
      }
      logger.error('Failed to create account:', error);
      throw error;
    }
  }

  // ===== PRIVATE HELPER METHODS =====

  private validateJournalEntry(request: CreateJournalEntryRequest): void {
    if (!request.entries || request.entries.length === 0) {
      throw new Error('Journal entry must have at least one ledger entry');
    }

    if (request.entries.length === 1) {
      throw new Error('Journal entry must have at least two ledger entries for double-entry');
    }

    let totalDebits = 0;
    let totalCredits = 0;

    for (const entry of request.entries) {
      if (!entry.account) {
        throw new Error('Account is required for each ledger entry');
      }

      const hasDebit = entry.debit !== undefined && entry.debit !== null;
      const hasCredit = entry.credit !== undefined && entry.credit !== null;

      if (hasDebit && hasCredit) {
        throw new Error('Ledger entry cannot have both debit and credit amounts');
      }

      if (!hasDebit && !hasCredit) {
        throw new Error('Ledger entry must have either debit or credit amount');
      }

      if (hasDebit && entry.debit! <= 0) {
        throw new Error('Debit amount must be positive');
      }

      if (hasCredit && entry.credit! <= 0) {
        throw new Error('Credit amount must be positive');
      }

      totalDebits += entry.debit || 0;
      totalCredits += entry.credit || 0;
    }

    // Check if debits equal credits (within 0.01 for floating point precision)
    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      throw new Error(`Journal entry is not balanced: debits=${totalDebits}, credits=${totalCredits}`);
    }
  }

  private async getAccountByCode(code: string, trx?: any): Promise<Account | null> {
    const cacheKey = `account:${code}`;
    
    // Try cache first
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Query database
    const db = trx || this.db.getKnex();
    const result = await db('accounts')
      .where('code', code)
      .where('is_active', true)
      .first();

    if (!result) {
      return null;
    }

    const account: Account = {
      id: result.id,
      code: result.code,
      name: result.name,
      type: result.type,
      parent_account: result.parent_account_id,
      currency: result.currency,
      is_active: result.is_active,
      created_at: result.created_at,
      metadata: result.metadata ? JSON.parse(result.metadata) : undefined
    };

    // Cache for 5 minutes
    await this.cache.setEx(cacheKey, 300, JSON.stringify(account));

    return account;
  }

  private async calculateAccountBalance(accountId: string, currency: string): Promise<AccountBalance> {
    const result = await this.db.getKnex()('ledger_entries')
      .select(
        this.db.getKnex().raw('SUM(COALESCE(debit_amount, 0)) - SUM(COALESCE(credit_amount, 0)) as balance'),
        this.db.getKnex().raw('MAX(created_at) as last_updated')
      )
      .where('account_id', accountId)
      .where('currency', currency)
      .first();

    const balance = parseFloat(result?.balance || '0');
    const lastUpdated = result?.last_updated || new Date();

    // Get account info
    const account = await this.db.getKnex()('accounts')
      .where('id', accountId)
      .first();

    return {
      account_id: accountId,
      account_code: account?.code || '',
      balance,
      currency,
      last_updated: lastUpdated,
      available_balance: balance, // TODO: Implement holds/reserves
      pending_balance: 0,
      reserved_balance: 0
    };
  }

  private async updateAccountBalances(entries: LedgerEntry[], trx: any): Promise<void> {
    // Group entries by account and currency
    const balanceUpdates = new Map<string, { debit: number; credit: number }>();

    for (const entry of entries) {
      const key = `${entry.account}:${entry.currency}`;
      const existing = balanceUpdates.get(key) || { debit: 0, credit: 0 };
      
      existing.debit += entry.debit || 0;
      existing.credit += entry.credit || 0;
      
      balanceUpdates.set(key, existing);
    }

    // Update account balance cache (will be recalculated on next access)
    for (const [key, update] of balanceUpdates) {
      const [accountId, currency] = key.split(':');
      
      // You might want to update a balance summary table here for performance
      // This is a simplified version that relies on calculation from ledger entries
    }
  }

  private calculateJournalChecksum(journal: JournalEntry, entries: LedgerEntry[]): string {
    const data = {
      journal_id: journal.id,
      description: journal.description,
      transaction_date: journal.transaction_date.toISOString(),
      entries: entries.map(e => ({
        account: e.account,
        debit: e.debit,
        credit: e.credit,
        currency: e.currency
      }))
    };

    return createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex');
  }

  private getJournalEntryAmount(entries: LedgerEntry[]): number {
    return entries.reduce((sum, entry) => sum + (entry.debit || entry.credit || 0), 0) / 2;
  }

  private async invalidateBalanceCaches(entries: LedgerEntry[]): Promise<void> {
    const accountIds = [...new Set(entries.map(e => e.account))];
    
    for (const accountId of accountIds) {
      // Get account code for cache key
      const account = await this.db.getKnex()('accounts')
        .where('id', accountId)
        .first();
      
      if (account) {
        await this.cache.del(`balance:${account.code}:${this.baseCurrency}`);
        await this.cache.del(`account:${account.code}`);
      }
    }
  }

  private async getJournalEntryByIdempotencyKey(idempotencyKey: string): Promise<JournalEntry | null> {
    const result = await this.db.getKnex()('journal_entries')
      .where('idempotency_key', idempotencyKey)
      .first();

    if (!result) {
      return null;
    }

    // Load entries
    const entries = await this.db.getKnex()('ledger_entries')
      .where('journal_id', result.id);

    return {
      id: result.id,
      description: result.description,
      reference: result.reference,
      transaction_date: result.transaction_date,
      entries: entries.map(e => ({
        id: e.id,
        journal_id: e.journal_id,
        account: e.account_id,
        debit: e.debit_amount,
        credit: e.credit_amount,
        currency: e.currency,
        created_at: e.created_at,
        metadata: e.metadata ? JSON.parse(e.metadata) : undefined
      })),
      status: result.status,
      created_by: result.created_by,
      created_at: result.created_at,
      posted_at: result.posted_at,
      metadata: result.metadata ? JSON.parse(result.metadata) : undefined,
      checksum: result.checksum
    };
  }
}