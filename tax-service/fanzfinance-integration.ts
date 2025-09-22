/**
 * FanzFinance OS Integration
 * FANZ Unified Ecosystem - Tax & Ledger Integration
 * 
 * Integrates tax calculations with the double-entry ledger system,
 * ensuring every transaction has proper GL entries and audit trails.
 */

import { TaxCalculationResult } from './tax-calculation-service/tax_engine';

// ============================================
// INTERFACES
// ============================================

interface LedgerEntry {
  id: string;
  transactionId: string;
  account: string;
  type: 'debit' | 'credit';
  amount: number;
  currency: string;
  description: string;
  jurisdiction?: string;
  taxCalculationId?: string;
  metadata: Record<string, any>;
  createdAt: Date;
}

interface JournalEntry {
  id: string;
  transactionId: string;
  taxCalculationId: string;
  entries: LedgerEntry[];
  totalDebits: number;
  totalCredits: number;
  balanced: boolean;
  status: 'draft' | 'posted' | 'reversed';
  description: string;
  createdBy: string;
  postedAt?: Date;
}

interface PayoutCalculation {
  creatorId: string;
  grossAmount: number;
  platformFee: number;
  platformFeeRate: number;
  salesTaxAmount: number;
  netPayoutAmount: number;
  taxWithholding?: number;
  backupWithholding?: number;
  finalNetAmount: number;
}

interface TransactionLifecycleEvent {
  type: 'pre_auth' | 'capture' | 'refund' | 'chargeback' | 'dispute';
  transactionId: string;
  orderId: string;
  amount: number;
  taxAmount: number;
  customerId: string;
  creatorId?: string;
  platform: string;
  timestamp: Date;
}

// ============================================
// FANZFINANCE INTEGRATION SERVICE
// ============================================

export class FanzFinanceIntegration {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  /**
   * Hook into transaction pre-authorization phase
   */
  async handlePreAuth(event: TransactionLifecycleEvent): Promise<{
    taxQuoteId: string;
    estimatedTax: number;
    journalEntryId?: string;
  }> {
    try {
      console.log(`Processing pre-auth for transaction ${event.transactionId}`);

      // This would call the tax calculation service
      // For now, return a mock response
      return {
        taxQuoteId: `quote_${Date.now()}_${event.transactionId}`,
        estimatedTax: event.taxAmount,
        journalEntryId: undefined // No GL entries until capture
      };

    } catch (error) {
      console.error('Pre-auth tax processing failed:', error);
      throw error;
    }
  }

  /**
   * Hook into transaction capture phase - commits tax and creates GL entries
   */
  async handleCapture(event: TransactionLifecycleEvent, taxQuoteId: string): Promise<{
    taxCalculationId: string;
    journalEntryId: string;
    ledgerEntries: LedgerEntry[];
    payoutCalculation?: PayoutCalculation;
  }> {
    try {
      console.log(`Processing capture for transaction ${event.transactionId}`);

      // 1. Commit the tax calculation
      const taxCalculation = await this.commitTaxCalculation(taxQuoteId, event.transactionId);

      // 2. Generate ledger entries
      const ledgerEntries = await this.generateLedgerEntries(taxCalculation, event);

      // 3. Create journal entry
      const journalEntry = await this.createJournalEntry(ledgerEntries, event);

      // 4. Calculate creator payout (if applicable)
      let payoutCalculation: PayoutCalculation | undefined;
      if (event.creatorId) {
        payoutCalculation = await this.calculateCreatorPayout(event, taxCalculation);
      }

      // 5. Post the journal entry to the ledger
      await this.postJournalEntry(journalEntry);

      // 6. Link tax calculation to transaction
      await this.linkTaxToTransaction(taxCalculation.id, event.transactionId);

      return {
        taxCalculationId: taxCalculation.id,
        journalEntryId: journalEntry.id,
        ledgerEntries,
        payoutCalculation
      };

    } catch (error) {
      console.error('Capture tax processing failed:', error);
      throw error;
    }
  }

  /**
   * Handle refunds and chargebacks
   */
  async handleRefund(event: TransactionLifecycleEvent, originalTaxCalculationId: string): Promise<{
    refundTaxCalculationId: string;
    reversalJournalEntryId: string;
    adjustedPayoutCalculation?: PayoutCalculation;
  }> {
    try {
      console.log(`Processing refund for transaction ${event.transactionId}`);

      // 1. Create refund tax calculation
      const refundTaxCalculation = await this.createRefundTaxCalculation(
        originalTaxCalculationId,
        event
      );

      // 2. Generate reversal ledger entries
      const reversalEntries = await this.generateRefundLedgerEntries(
        refundTaxCalculation,
        event
      );

      // 3. Create reversal journal entry
      const reversalJournal = await this.createJournalEntry(reversalEntries, event);

      // 4. Adjust creator payout (if applicable)
      let adjustedPayoutCalculation: PayoutCalculation | undefined;
      if (event.creatorId) {
        adjustedPayoutCalculation = await this.adjustCreatorPayoutForRefund(
          event,
          refundTaxCalculation
        );
      }

      // 5. Post the reversal journal entry
      await this.postJournalEntry(reversalJournal);

      return {
        refundTaxCalculationId: refundTaxCalculation.id,
        reversalJournalEntryId: reversalJournal.id,
        adjustedPayoutCalculation
      };

    } catch (error) {
      console.error('Refund tax processing failed:', error);
      throw error;
    }
  }

  /**
   * Generate ledger entries for a tax calculation
   */
  private async generateLedgerEntries(
    taxCalculation: TaxCalculationResult,
    event: TransactionLifecycleEvent
  ): Promise<LedgerEntry[]> {
    const entries: LedgerEntry[] = [];

    // Revenue entry (Debit Accounts Receivable, Credit Revenue)
    entries.push({
      id: `entry_${Date.now()}_revenue_debit`,
      transactionId: event.transactionId,
      account: 'accounts_receivable',
      type: 'debit',
      amount: taxCalculation.totalAmount, // Including tax
      currency: taxCalculation.currency,
      description: `Revenue from ${event.platform} transaction`,
      taxCalculationId: taxCalculation.id,
      metadata: {
        platform: event.platform,
        customerId: event.customerId,
        creatorId: event.creatorId,
        eventType: event.type
      },
      createdAt: new Date()
    });

    entries.push({
      id: `entry_${Date.now()}_revenue_credit`,
      transactionId: event.transactionId,
      account: 'revenue',
      type: 'credit',
      amount: taxCalculation.subtotalAmount, // Excluding tax
      currency: taxCalculation.currency,
      description: `Revenue from ${event.platform} transaction`,
      taxCalculationId: taxCalculation.id,
      metadata: {
        platform: event.platform,
        customerId: event.customerId,
        creatorId: event.creatorId,
        eventType: event.type
      },
      createdAt: new Date()
    });

    // Sales tax payable entries (Credit per jurisdiction)
    for (const line of taxCalculation.lines) {
      if (line.taxAmount > 0) {
        const jurisdiction = taxCalculation.jurisdictions.find(j => j.id === line.jurisdictionId);
        
        entries.push({
          id: `entry_${Date.now()}_tax_${line.jurisdictionId}`,
          transactionId: event.transactionId,
          account: 'sales_tax_payable',
          type: 'credit',
          amount: line.taxAmount,
          currency: taxCalculation.currency,
          description: `Sales tax payable - ${jurisdiction?.name || line.jurisdictionId}`,
          jurisdiction: line.jurisdictionId,
          taxCalculationId: taxCalculation.id,
          metadata: {
            jurisdictionType: jurisdiction?.type,
            jurisdictionName: jurisdiction?.name,
            jurisdictionCode: jurisdiction?.code,
            productCategory: line.productCategoryId,
            taxRate: line.rate,
            taxability: line.taxability,
            appliedRules: line.appliedRules,
            platform: event.platform
          },
          createdAt: new Date()
        });
      }
    }

    return entries;
  }

  /**
   * Generate refund ledger entries (reversal of original entries)
   */
  private async generateRefundLedgerEntries(
    refundTaxCalculation: TaxCalculationResult,
    event: TransactionLifecycleEvent
  ): Promise<LedgerEntry[]> {
    const entries: LedgerEntry[] = [];

    // Reverse revenue entries
    entries.push({
      id: `entry_${Date.now()}_refund_revenue_credit`,
      transactionId: event.transactionId,
      account: 'accounts_receivable',
      type: 'credit', // Reverse of original debit
      amount: Math.abs(refundTaxCalculation.totalAmount),
      currency: refundTaxCalculation.currency,
      description: `Refund reversal - ${event.platform} transaction`,
      taxCalculationId: refundTaxCalculation.id,
      metadata: {
        platform: event.platform,
        refundType: event.type,
        originalAmount: refundTaxCalculation.totalAmount
      },
      createdAt: new Date()
    });

    entries.push({
      id: `entry_${Date.now()}_refund_revenue_debit`,
      transactionId: event.transactionId,
      account: 'revenue',
      type: 'debit', // Reverse of original credit
      amount: Math.abs(refundTaxCalculation.subtotalAmount),
      currency: refundTaxCalculation.currency,
      description: `Refund reversal - ${event.platform} transaction`,
      taxCalculationId: refundTaxCalculation.id,
      metadata: {
        platform: event.platform,
        refundType: event.type,
        originalAmount: refundTaxCalculation.subtotalAmount
      },
      createdAt: new Date()
    });

    // Reverse sales tax entries
    for (const line of refundTaxCalculation.lines) {
      if (line.taxAmount !== 0) {
        const jurisdiction = refundTaxCalculation.jurisdictions.find(j => j.id === line.jurisdictionId);
        
        entries.push({
          id: `entry_${Date.now()}_refund_tax_${line.jurisdictionId}`,
          transactionId: event.transactionId,
          account: 'sales_tax_payable',
          type: 'debit', // Reverse of original credit
          amount: Math.abs(line.taxAmount),
          currency: refundTaxCalculation.currency,
          description: `Refund tax reversal - ${jurisdiction?.name || line.jurisdictionId}`,
          jurisdiction: line.jurisdictionId,
          taxCalculationId: refundTaxCalculation.id,
          metadata: {
            jurisdictionType: jurisdiction?.type,
            jurisdictionName: jurisdiction?.name,
            refundType: event.type,
            originalTaxAmount: line.taxAmount
          },
          createdAt: new Date()
        });
      }
    }

    return entries;
  }

  /**
   * Create a journal entry from ledger entries
   */
  private async createJournalEntry(
    entries: LedgerEntry[],
    event: TransactionLifecycleEvent
  ): Promise<JournalEntry> {
    const totalDebits = entries
      .filter(e => e.type === 'debit')
      .reduce((sum, e) => sum + e.amount, 0);

    const totalCredits = entries
      .filter(e => e.type === 'credit')
      .reduce((sum, e) => sum + e.amount, 0);

    const journalEntry: JournalEntry = {
      id: `journal_${Date.now()}_${event.transactionId}`,
      transactionId: event.transactionId,
      taxCalculationId: entries[0]?.taxCalculationId || '',
      entries,
      totalDebits: Math.round(totalDebits * 100) / 100,
      totalCredits: Math.round(totalCredits * 100) / 100,
      balanced: Math.abs(totalDebits - totalCredits) < 0.01, // Allow for rounding
      status: 'draft',
      description: `${event.type} transaction - ${event.platform}`,
      createdBy: 'tax_service',
      createdAt: new Date()
    };

    if (!journalEntry.balanced) {
      throw new Error(`Journal entry not balanced: Debits ${totalDebits} != Credits ${totalCredits}`);
    }

    return journalEntry;
  }

  /**
   * Calculate creator payout considering tax implications
   */
  private async calculateCreatorPayout(
    event: TransactionLifecycleEvent,
    taxCalculation: TaxCalculationResult
  ): Promise<PayoutCalculation> {
    // Platform fee calculation (e.g., 10% of gross)
    const platformFeeRate = 0.10; // 10% platform fee
    const platformFee = Math.round(taxCalculation.subtotalAmount * platformFeeRate * 100) / 100;

    // Sales tax is FANZ's responsibility (marketplace facilitator)
    const salesTaxAmount = taxCalculation.taxAmount;

    // Net payout to creator (gross - platform fee, sales tax handled by FANZ)
    const netPayoutAmount = taxCalculation.subtotalAmount - platformFee;

    // Check if backup withholding is required
    const taxWithholding = 0; // Would be calculated based on creator's W-9 status
    const backupWithholding = 0; // 24% backup withholding if no valid TIN

    const finalNetAmount = netPayoutAmount - taxWithholding - backupWithholding;

    return {
      creatorId: event.creatorId!,
      grossAmount: taxCalculation.subtotalAmount,
      platformFee,
      platformFeeRate,
      salesTaxAmount,
      netPayoutAmount,
      taxWithholding: taxWithholding > 0 ? taxWithholding : undefined,
      backupWithholding: backupWithholding > 0 ? backupWithholding : undefined,
      finalNetAmount
    };
  }

  /**
   * Adjust creator payout for refunds
   */
  private async adjustCreatorPayoutForRefund(
    event: TransactionLifecycleEvent,
    refundTaxCalculation: TaxCalculationResult
  ): Promise<PayoutCalculation> {
    const platformFeeRate = 0.10;
    const platformFeeRefund = Math.round(Math.abs(refundTaxCalculation.subtotalAmount) * platformFeeRate * 100) / 100;

    // Refund adjustments are negative
    const adjustedNetAmount = Math.abs(refundTaxCalculation.subtotalAmount) - platformFeeRefund;

    return {
      creatorId: event.creatorId!,
      grossAmount: -Math.abs(refundTaxCalculation.subtotalAmount), // Negative for refund
      platformFee: -platformFeeRefund, // Negative for refund
      platformFeeRate,
      salesTaxAmount: -Math.abs(refundTaxCalculation.taxAmount), // FANZ handles refund
      netPayoutAmount: -adjustedNetAmount, // Negative adjustment to payout
      finalNetAmount: -adjustedNetAmount
    };
  }

  /**
   * Mock implementations for external service calls
   */
  private async commitTaxCalculation(quoteId: string, transactionId: string): Promise<TaxCalculationResult> {
    // This would call the actual tax service
    return {
      id: `calc_${Date.now()}`,
      quoteId,
      status: 'committed',
      currency: 'USD',
      subtotalAmount: 19.99,
      taxableAmount: 19.99,
      taxAmount: 1.45,
      totalAmount: 21.44,
      destinationAddress: {
        country: 'US',
        state: 'CA',
        city: 'San Francisco',
        postalCode: '94105',
        line1: '1 Market St'
      },
      jurisdictions: [{
        id: 'state_ca',
        type: 'state',
        name: 'California',
        code: 'CA'
      }],
      lines: [{
        lineRef: 'L1',
        jurisdictionId: 'state_ca',
        productCategoryId: 'DIGITAL_SUBSCRIPTION',
        quantity: 1,
        unitPrice: 19.99,
        lineAmount: 19.99,
        discountAmount: 0,
        taxableAmount: 19.99,
        rate: 0.0725,
        taxAmount: 1.45,
        taxability: 'taxable',
        appliedRules: ['marketplace_facilitator']
      }],
      marketplaceFacilitator: {
        isApplicable: true,
        fanzCollects: true,
        fanzRemits: true
      },
      confidence: 0.95,
      processingTimeMs: 87,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    } as TaxCalculationResult;
  }

  private async createRefundTaxCalculation(originalId: string, event: TransactionLifecycleEvent): Promise<TaxCalculationResult> {
    // This would call the tax service to create a refund calculation
    const original = await this.commitTaxCalculation('', '');
    
    return {
      ...original,
      id: `refund_calc_${Date.now()}`,
      quoteId: `refund_quote_${Date.now()}`,
      status: 'refunded',
      subtotalAmount: -original.subtotalAmount,
      taxAmount: -original.taxAmount,
      totalAmount: -original.totalAmount,
      lines: original.lines.map(line => ({
        ...line,
        lineAmount: -line.lineAmount,
        taxableAmount: -line.taxableAmount,
        taxAmount: -line.taxAmount
      }))
    } as TaxCalculationResult;
  }

  private async postJournalEntry(journalEntry: JournalEntry): Promise<void> {
    // This would post to the FanzFinance OS ledger
    console.log(`Posting journal entry ${journalEntry.id} with ${journalEntry.entries.length} entries`);
    
    // Mark as posted
    journalEntry.status = 'posted';
    journalEntry.postedAt = new Date();
  }

  private async linkTaxToTransaction(taxCalculationId: string, transactionId: string): Promise<void> {
    // This would create the link in tax_transaction_link table
    console.log(`Linking tax calculation ${taxCalculationId} to transaction ${transactionId}`);
  }
}

/**
 * Transaction Event Handler
 * Listens for transaction lifecycle events and triggers tax processing
 */
export class TransactionTaxHandler {
  private fanzFinanceIntegration: FanzFinanceIntegration;
  private activeQuotes = new Map<string, string>(); // transactionId -> quoteId

  constructor(fanzFinanceIntegration: FanzFinanceIntegration) {
    this.fanzFinanceIntegration = fanzFinanceIntegration;
  }

  /**
   * Handle transaction lifecycle events
   */
  async handleTransactionEvent(event: TransactionLifecycleEvent): Promise<void> {
    try {
      switch (event.type) {
        case 'pre_auth':
          const preAuthResult = await this.fanzFinanceIntegration.handlePreAuth(event);
          this.activeQuotes.set(event.transactionId, preAuthResult.taxQuoteId);
          console.log(`Pre-auth complete for ${event.transactionId}, quote: ${preAuthResult.taxQuoteId}`);
          break;

        case 'capture':
          const quoteId = this.activeQuotes.get(event.transactionId);
          if (!quoteId) {
            throw new Error(`No tax quote found for transaction ${event.transactionId}`);
          }
          
          const captureResult = await this.fanzFinanceIntegration.handleCapture(event, quoteId);
          this.activeQuotes.delete(event.transactionId);
          
          console.log(`Capture complete for ${event.transactionId}`);
          console.log(`Journal entry: ${captureResult.journalEntryId}`);
          console.log(`Tax calculation: ${captureResult.taxCalculationId}`);
          
          if (captureResult.payoutCalculation) {
            console.log(`Creator payout: $${captureResult.payoutCalculation.finalNetAmount}`);
          }
          break;

        case 'refund':
        case 'chargeback':
          // Find the original tax calculation ID (would query database)
          const originalTaxId = `calc_${event.transactionId}_original`;
          
          const refundResult = await this.fanzFinanceIntegration.handleRefund(event, originalTaxId);
          
          console.log(`${event.type} complete for ${event.transactionId}`);
          console.log(`Reversal journal: ${refundResult.reversalJournalEntryId}`);
          console.log(`Refund tax calc: ${refundResult.refundTaxCalculationId}`);
          break;

        default:
          console.warn(`Unhandled transaction event type: ${event.type}`);
      }

    } catch (error) {
      console.error(`Failed to handle transaction event ${event.type} for ${event.transactionId}:`, error);
      throw error;
    }
  }
}

export default FanzFinanceIntegration;
export { TransactionLifecycleEvent, TransactionTaxHandler, PayoutCalculation, LedgerEntry, JournalEntry };