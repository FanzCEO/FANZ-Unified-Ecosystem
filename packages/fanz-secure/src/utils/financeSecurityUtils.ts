import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { AuditLogger, AuditEvent } from './auditLogger';

// Financial data validation schemas
export const MoneyAmountSchema = z.object({
  amount: z.number()
    .int()
    .nonnegative()
    .max(999999999999) // Max ~$10B in cents
    .describe('Amount in smallest currency unit (e.g., cents)'),
  currency: z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD'])
    .default('USD')
    .describe('ISO 4217 currency code')
});

export const AccountIdSchema = z.string()
  .uuid()
  .describe('UUID v4 account identifier');

export const TransactionIdSchema = z.string()
  .uuid()
  .describe('UUID v4 transaction identifier');

export const ExternalIdSchema = z.string()
  .min(1)
  .max(255)
  .regex(/^[a-zA-Z0-9_-]+$/)
  .describe('External system transaction identifier');

// Transaction and ledger interfaces
export interface MoneyAmount {
  amount: number;
  currency: string;
}

export interface LedgerEntry {
  id: string;
  transactionId: string;
  accountId: string;
  amount: MoneyAmount;
  type: 'debit' | 'credit';
  description: string;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface Transaction {
  id: string;
  externalId: string;
  description: string;
  entries: LedgerEntry[];
  status: 'pending' | 'posted' | 'failed' | 'cancelled';
  createdAt: Date;
  postedAt?: Date;
  metadata?: Record<string, any>;
}

export interface IdempotencyKey {
  key: string;
  accountId: string;
  externalId: string;
  transactionId?: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface BalanceLock {
  accountId: string;
  lockId: string;
  amount: MoneyAmount;
  reason: string;
  lockedAt: Date;
  expiresAt: Date;
}

// Financial RBAC scopes
export enum FinanceScopes {
  // Ledger operations
  LEDGER_READ = 'fanz.finance.ledger:read',
  LEDGER_POST = 'fanz.finance.ledger:post',
  LEDGER_ADMIN = 'fanz.finance.ledger:admin',
  
  // Transaction operations
  TRANSACTION_READ = 'fanz.finance.transaction:read',
  TRANSACTION_CREATE = 'fanz.finance.transaction:create',
  TRANSACTION_CANCEL = 'fanz.finance.transaction:cancel',
  
  // Payout operations
  PAYOUT_READ = 'fanz.finance.payout:read',
  PAYOUT_CREATE = 'fanz.finance.payout:create',
  PAYOUT_APPROVE = 'fanz.finance.payout:approve',
  PAYOUT_EXECUTE = 'fanz.finance.payout:execute',
  
  // Balance operations
  BALANCE_READ = 'fanz.finance.balance:read',
  BALANCE_LOCK = 'fanz.finance.balance:lock',
  BALANCE_UNLOCK = 'fanz.finance.balance:unlock',
  
  // Reporting
  REPORT_BASIC = 'fanz.finance.report:basic',
  REPORT_DETAILED = 'fanz.finance.report:detailed',
  REPORT_ADMIN = 'fanz.finance.report:admin'
}

// Configuration interfaces
export interface FinanceSecurityConfig {
  requireMakerChecker: boolean;
  require2FA: boolean;
  maxTransactionAmount: MoneyAmount;
  idempotencyTTL: number; // seconds
  balanceLockTTL: number; // seconds
  auditAllTransactions: boolean;
  enableRealTimeMonitoring: boolean;
}

export const DEFAULT_FINANCE_CONFIG: FinanceSecurityConfig = {
  requireMakerChecker: true,
  require2FA: true,
  maxTransactionAmount: { amount: 100000000, currency: 'USD' }, // $1M
  idempotencyTTL: 24 * 60 * 60, // 24 hours
  balanceLockTTL: 5 * 60, // 5 minutes
  auditAllTransactions: true,
  enableRealTimeMonitoring: true
};

// Idempotency manager
export class TransactionIdempotency {
  private keys = new Map<string, IdempotencyKey>();
  private config: FinanceSecurityConfig;

  constructor(config: Partial<FinanceSecurityConfig> = {}) {
    this.config = { ...DEFAULT_FINANCE_CONFIG, ...config };
  }

  /**
   * Generate idempotency key from external ID and account ID
   */
  generateKey(externalId: string, accountId: string): string {
    return `${accountId}:${externalId}`;
  }

  /**
   * Check if transaction is idempotent
   */
  checkIdempotency(externalId: string, accountId: string): IdempotencyKey | null {
    const key = this.generateKey(externalId, accountId);
    const existing = this.keys.get(key);
    
    if (!existing) return null;
    
    // Check if expired
    if (existing.expiresAt < new Date()) {
      this.keys.delete(key);
      return null;
    }
    
    return existing;
  }

  /**
   * Create idempotency key
   */
  createIdempotencyKey(externalId: string, accountId: string): IdempotencyKey {
    const key = this.generateKey(externalId, accountId);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.config.idempotencyTTL * 1000);
    
    const idempotencyKey: IdempotencyKey = {
      key,
      accountId,
      externalId,
      createdAt: now,
      expiresAt
    };
    
    this.keys.set(key, idempotencyKey);
    return idempotencyKey;
  }

  /**
   * Update idempotency key with transaction ID
   */
  updateWithTransactionId(key: string, transactionId: string): void {
    const idempotencyKey = this.keys.get(key);
    if (idempotencyKey) {
      idempotencyKey.transactionId = transactionId;
    }
  }

  /**
   * Idempotency middleware
   */
  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const { externalId } = req.body;
      const accountId = req.user?.accountId || req.body.accountId;
      
      if (!externalId || !accountId) {
        return res.status(400).json({
          error: 'External ID and Account ID required for financial operations',
          code: 'MISSING_IDEMPOTENCY_DATA'
        });
      }

      // Check for existing idempotent transaction
      const existingKey = this.checkIdempotency(externalId, accountId);
      if (existingKey && existingKey.transactionId) {
        // Return existing transaction result
        return res.status(200).json({
          transactionId: existingKey.transactionId,
          status: 'duplicate',
          message: 'Transaction already processed'
        });
      }

      // Create or use existing idempotency key
      const idempotencyKey = existingKey || this.createIdempotencyKey(externalId, accountId);
      req.idempotencyKey = idempotencyKey;
      
      next();
    };
  }
}

// Double-entry ledger validator
export class LedgerValidator {
  /**
   * Validates that ledger entries balance to zero
   */
  validateBalance(entries: LedgerEntry[]): boolean {
    const balancesByCurrency = new Map<string, number>();
    
    for (const entry of entries) {
      const currency = entry.amount.currency;
      const currentBalance = balancesByCurrency.get(currency) || 0;
      
      if (entry.type === 'debit') {
        balancesByCurrency.set(currency, currentBalance - entry.amount.amount);
      } else {
        balancesByCurrency.set(currency, currentBalance + entry.amount.amount);
      }
    }
    
    // All balances must be zero
    return Array.from(balancesByCurrency.values()).every(balance => balance === 0);
  }

  /**
   * Validates transaction structure
   */
  validateTransaction(transaction: Partial<Transaction>): string[] {
    const errors: string[] = [];
    
    if (!transaction.entries || transaction.entries.length < 2) {
      errors.push('Transaction must have at least 2 entries');
    }
    
    if (transaction.entries && !this.validateBalance(transaction.entries)) {
      errors.push('Transaction entries do not balance to zero');
    }
    
    if (!transaction.externalId) {
      errors.push('External ID is required');
    }
    
    if (!transaction.description) {
      errors.push('Transaction description is required');
    }
    
    // Validate individual entries
    if (transaction.entries) {
      transaction.entries.forEach((entry, index) => {
        if (!entry.accountId) {
          errors.push(`Entry ${index}: Account ID is required`);
        }
        
        if (!entry.amount || entry.amount.amount <= 0) {
          errors.push(`Entry ${index}: Amount must be positive`);
        }
        
        if (!['debit', 'credit'].includes(entry.type)) {
          errors.push(`Entry ${index}: Type must be 'debit' or 'credit'`);
        }
      });
    }
    
    return errors;
  }

  /**
   * Ledger validation middleware
   */
  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const transaction = req.body;
      const errors = this.validateTransaction(transaction);
      
      if (errors.length > 0) {
        return res.status(400).json({
          error: 'Transaction validation failed',
          code: 'LEDGER_VALIDATION_ERROR',
          details: errors
        });
      }
      
      next();
    };
  }
}

// Balance locking manager
export class BalanceLockManager {
  private locks = new Map<string, BalanceLock>();
  private config: FinanceSecurityConfig;

  constructor(config: Partial<FinanceSecurityConfig> = {}) {
    this.config = { ...DEFAULT_FINANCE_CONFIG, ...config };
  }

  /**
   * Acquire balance lock
   */
  acquireLock(accountId: string, amount: MoneyAmount, reason: string): BalanceLock | null {
    const existingLock = this.getLock(accountId);
    if (existingLock) {
      return null; // Account already locked
    }
    
    const now = new Date();
    const lock: BalanceLock = {
      accountId,
      lockId: randomUUID(),
      amount,
      reason,
      lockedAt: now,
      expiresAt: new Date(now.getTime() + this.config.balanceLockTTL * 1000)
    };
    
    this.locks.set(accountId, lock);
    return lock;
  }

  /**
   * Release balance lock
   */
  releaseLock(accountId: string, lockId: string): boolean {
    const lock = this.locks.get(accountId);
    if (lock && lock.lockId === lockId) {
      this.locks.delete(accountId);
      return true;
    }
    return false;
  }

  /**
   * Get existing lock
   */
  getLock(accountId: string): BalanceLock | null {
    const lock = this.locks.get(accountId);
    if (!lock) return null;
    
    // Check if expired
    if (lock.expiresAt < new Date()) {
      this.locks.delete(accountId);
      return null;
    }
    
    return lock;
  }

  /**
   * Balance locking middleware
   */
  lockingMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const { accountId, amount } = req.body;
      
      if (!accountId || !amount) {
        return res.status(400).json({
          error: 'Account ID and amount required for balance locking',
          code: 'MISSING_LOCK_DATA'
        });
      }

      const lock = this.acquireLock(accountId, amount, 'transaction_processing');
      if (!lock) {
        return res.status(409).json({
          error: 'Account balance is currently locked',
          code: 'BALANCE_LOCKED'
        });
      }

      req.balanceLock = lock;
      
      // Auto-release lock on response
      res.on('finish', () => {
        this.releaseLock(accountId, lock.lockId);
      });
      
      next();
    };
  }
}

// Financial RBAC middleware
export class FinancialRBAC {
  private config: FinanceSecurityConfig;

  constructor(config: Partial<FinanceSecurityConfig> = {}) {
    this.config = { ...DEFAULT_FINANCE_CONFIG, ...config };
  }

  /**
   * Require specific financial scope
   */
  requireScope(scope: FinanceScopes) {
    return (req: Request, res: Response, next: NextFunction) => {
      const userScopes = req.user?.scopes || [];
      
      if (!userScopes.includes(scope)) {
        return res.status(403).json({
          error: 'Insufficient permissions for financial operation',
          code: 'INSUFFICIENT_FINANCE_SCOPE',
          requiredScope: scope
        });
      }
      
      next();
    };
  }

  /**
   * Require 2FA for sensitive operations
   */
  require2FA() {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!this.config.require2FA) {
        return next();
      }

      const has2FA = req.user?.twoFactorVerified || req.headers['x-2fa-verified'] === 'true';
      
      if (!has2FA) {
        return res.status(403).json({
          error: '2FA verification required for this financial operation',
          code: 'REQUIRE_2FA'
        });
      }
      
      next();
    };
  }

  /**
   * Maker-checker pattern for high-risk operations
   */
  requireMakerChecker() {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!this.config.requireMakerChecker) {
        return next();
      }

      const isMakerCheckerApproved = req.headers['x-maker-checker-approved'] === 'true';
      
      if (!isMakerCheckerApproved) {
        return res.status(202).json({
          status: 'pending_approval',
          message: 'Transaction requires maker-checker approval',
          code: 'PENDING_MAKER_CHECKER'
        });
      }
      
      next();
    };
  }

  /**
   * Transaction amount limits
   */
  enforceAmountLimits() {
    return (req: Request, res: Response, next: NextFunction) => {
      const { amount } = req.body;
      
      if (amount && amount.amount > this.config.maxTransactionAmount.amount) {
        return res.status(400).json({
          error: 'Transaction amount exceeds maximum limit',
          code: 'AMOUNT_LIMIT_EXCEEDED',
          maxAmount: this.config.maxTransactionAmount
        });
      }
      
      next();
    };
  }
}

// Financial event monitor
export class FinancialEventMonitor {
  private auditLogger: AuditLogger;
  private config: FinanceSecurityConfig;

  constructor(auditLogger: AuditLogger, config: Partial<FinanceSecurityConfig> = {}) {
    this.auditLogger = auditLogger;
    this.config = { ...DEFAULT_FINANCE_CONFIG, ...config };
  }

  /**
   * Monitor transaction creation
   */
  logTransactionCreated(transaction: Transaction, userId: string, requestId: string): void {
    const event: AuditEvent = {
      id: randomUUID(),
      timestamp: new Date(),
      category: 'FINANCIAL',
      level: 'CRITICAL',
      action: 'TRANSACTION_CREATED',
      userId,
      requestId,
      resourceId: transaction.id,
      resourceType: 'TRANSACTION',
      success: true,
      details: {
        transactionId: transaction.id,
        externalId: transaction.externalId,
        totalAmount: this.calculateTotalAmount(transaction.entries),
        entriesCount: transaction.entries.length,
        accountIds: transaction.entries.map(e => e.accountId)
      },
      metadata: {
        riskLevel: this.assessTransactionRisk(transaction),
        requiresReview: this.requiresManualReview(transaction)
      }
    };
    
    this.auditLogger.log(event);
  }

  /**
   * Monitor balance changes
   */
  logBalanceChange(accountId: string, oldBalance: MoneyAmount, newBalance: MoneyAmount, userId: string, requestId: string): void {
    const event: AuditEvent = {
      id: randomUUID(),
      timestamp: new Date(),
      category: 'FINANCIAL',
      level: 'HIGH',
      action: 'BALANCE_CHANGED',
      userId,
      requestId,
      resourceId: accountId,
      resourceType: 'ACCOUNT',
      success: true,
      details: {
        accountId,
        oldBalance,
        newBalance,
        delta: {
          amount: newBalance.amount - oldBalance.amount,
          currency: newBalance.currency
        }
      }
    };
    
    this.auditLogger.log(event);
  }

  /**
   * Monitor payout operations
   */
  logPayoutOperation(payoutId: string, amount: MoneyAmount, status: string, userId: string, requestId: string): void {
    const event: AuditEvent = {
      id: randomUUID(),
      timestamp: new Date(),
      category: 'FINANCIAL',
      level: 'CRITICAL',
      action: 'PAYOUT_OPERATION',
      userId,
      requestId,
      resourceId: payoutId,
      resourceType: 'PAYOUT',
      success: status === 'success',
      details: {
        payoutId,
        amount,
        status,
        requiresManualReview: amount.amount > 1000000 // >$10k
      }
    };
    
    this.auditLogger.log(event);
  }

  /**
   * Calculate total transaction amount
   */
  private calculateTotalAmount(entries: LedgerEntry[]): MoneyAmount[] {
    const totals = new Map<string, number>();
    
    entries.forEach(entry => {
      const current = totals.get(entry.amount.currency) || 0;
      totals.set(entry.amount.currency, current + entry.amount.amount);
    });
    
    return Array.from(totals.entries()).map(([currency, amount]) => ({ amount, currency }));
  }

  /**
   * Assess transaction risk level
   */
  private assessTransactionRisk(transaction: Transaction): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const totalAmounts = this.calculateTotalAmount(transaction.entries);
    const maxAmount = Math.max(...totalAmounts.map(a => a.amount));
    
    if (maxAmount > 10000000) return 'CRITICAL'; // >$100k
    if (maxAmount > 1000000) return 'HIGH';      // >$10k
    if (maxAmount > 100000) return 'MEDIUM';     // >$1k
    return 'LOW';
  }

  /**
   * Determine if transaction requires manual review
   */
  private requiresManualReview(transaction: Transaction): boolean {
    const totalAmounts = this.calculateTotalAmount(transaction.entries);
    const maxAmount = Math.max(...totalAmounts.map(a => a.amount));
    
    return maxAmount > 5000000 || // >$50k
           transaction.entries.length > 10 || // Complex transaction
           transaction.entries.some(e => e.metadata?.suspicious === true);
  }

  /**
   * Financial monitoring middleware
   */
  monitoringMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const originalSend = res.send;
      
      res.send = function(data: any) {
        // Log successful financial operations
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const userId = req.user?.id || 'system';
          const requestId = req.id || randomUUID();
          
          if (req.path.includes('/transaction') && req.method === 'POST') {
            // Transaction created
            // This would be called after transaction is created in the handler
          }
        }
        
        return originalSend.call(this, data);
      };
      
      next();
    };
  }
}

// Comprehensive finance security middleware
export class FinanceSecurityMiddleware {
  private idempotency: TransactionIdempotency;
  private ledgerValidator: LedgerValidator;
  private balanceLocks: BalanceLockManager;
  private rbac: FinancialRBAC;
  private monitor: FinancialEventMonitor;

  constructor(auditLogger: AuditLogger, config: Partial<FinanceSecurityConfig> = {}) {
    this.idempotency = new TransactionIdempotency(config);
    this.ledgerValidator = new LedgerValidator();
    this.balanceLocks = new BalanceLockManager(config);
    this.rbac = new FinancialRBAC(config);
    this.monitor = new FinancialEventMonitor(auditLogger, config);
  }

  /**
   * Create comprehensive finance middleware chain
   */
  createFinanceChain(scope: FinanceScopes, requireLocking = true) {
    const middleware = [];
    
    // 1. RBAC and permissions
    middleware.push(this.rbac.requireScope(scope));
    
    // 2. 2FA for sensitive operations
    if (this.isSensitiveOperation(scope)) {
      middleware.push(this.rbac.require2FA());
    }
    
    // 3. Amount limits
    middleware.push(this.rbac.enforceAmountLimits());
    
    // 4. Idempotency
    middleware.push(this.idempotency.middleware());
    
    // 5. Ledger validation for transaction operations
    if (scope.includes('ledger') || scope.includes('transaction')) {
      middleware.push(this.ledgerValidator.middleware());
    }
    
    // 6. Balance locking for transaction operations
    if (requireLocking && scope.includes('transaction')) {
      middleware.push(this.balanceLocks.lockingMiddleware());
    }
    
    // 7. Maker-checker for high-risk operations
    if (this.isHighRiskOperation(scope)) {
      middleware.push(this.rbac.requireMakerChecker());
    }
    
    // 8. Monitoring
    middleware.push(this.monitor.monitoringMiddleware());
    
    return middleware;
  }

  private isSensitiveOperation(scope: FinanceScopes): boolean {
    return [
      FinanceScopes.PAYOUT_APPROVE,
      FinanceScopes.PAYOUT_EXECUTE,
      FinanceScopes.LEDGER_ADMIN,
      FinanceScopes.BALANCE_UNLOCK
    ].includes(scope);
  }

  private isHighRiskOperation(scope: FinanceScopes): boolean {
    return [
      FinanceScopes.PAYOUT_APPROVE,
      FinanceScopes.PAYOUT_EXECUTE,
      FinanceScopes.LEDGER_ADMIN
    ].includes(scope);
  }
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      idempotencyKey?: IdempotencyKey;
      balanceLock?: BalanceLock;
    }
  }
}

// Export all financial security utilities
export {
  TransactionIdempotency,
  LedgerValidator,
  BalanceLockManager,
  FinancialRBAC,
  FinancialEventMonitor,
  FinanceSecurityMiddleware
};