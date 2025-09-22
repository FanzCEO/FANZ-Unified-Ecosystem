/**
 * Tax Service API Controller
 * FANZ Unified Ecosystem - Tax Compliance REST API
 * 
 * Provides RESTful endpoints for tax calculation, commitment, voiding,
 * and refunds with JWT authentication and audit logging.
 */

import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { TaxCalculationService } from './tax-calculation-service/tax_engine';
import { AddressValidationService } from './address-service/address_service';

// ============================================
// INTERFACES
// ============================================

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    permissions: string[];
  };
  auditContext?: {
    userId: string;
    sessionId: string;
    ipAddress: string;
    userAgent: string;
  };
}

interface TaxQuoteRequest {
  idempotencyKey: string;
  orderRef: string;
  currency: string;
  customer: {
    id: string;
    taxExempt: boolean;
    exemptionCertificateId?: string;
  };
  seller: {
    entity: string;
    nexusStates: string[];
  };
  destination: {
    country: string;
    state: string;
    city: string;
    postalCode: string;
    line1: string;
    line2?: string;
  };
  lines: Array<{
    lineRef: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    taxCategory: string;
    discountAmount?: number;
    description?: string;
  }>;
  effectiveDate?: string;
}

interface TaxCommitRequest {
  quoteId: string;
  transactionId: string;
  finalizeTransaction: boolean;
}

interface TaxVoidRequest {
  quoteId: string;
  reason: string;
  voidedBy: string;
}

interface TaxRefundRequest {
  originalQuoteId: string;
  refundLines?: Array<{
    lineRef: string;
    quantity?: number;
    amount?: number;
  }>;
  reason: string;
  refundedBy: string;
}

// ============================================
// API CONTROLLER CLASS
// ============================================

export class TaxApiController {
  private taxService: TaxCalculationService;
  private addressService: AddressValidationService;
  private jwtSecret: string;

  constructor(
    taxService: TaxCalculationService,
    addressService: AddressValidationService,
    jwtSecret: string
  ) {
    this.taxService = taxService;
    this.addressService = addressService;
    this.jwtSecret = jwtSecret;
  }

  // ============================================
  // AUTHENTICATION MIDDLEWARE
  // ============================================

  /**
   * JWT Authentication middleware
   */
  authenticate = async (req: AuthenticatedRequest, res: Response, next: Function): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          error: 'Authentication required',
          message: 'Valid JWT token required in Authorization header'
        });
        return;
      }

      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      
      req.user = {
        id: decoded.userId,
        role: decoded.role,
        permissions: decoded.permissions || []
      };

      // Set audit context
      req.auditContext = {
        userId: decoded.userId,
        sessionId: decoded.sessionId || '',
        ipAddress: req.ip || req.connection.remoteAddress || '',
        userAgent: req.headers['user-agent'] || ''
      };

      next();

    } catch (error) {
      res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid or expired JWT token'
      });
    }
  };

  /**
   * Check for required permissions
   */
  requirePermission = (permission: string) => {
    return (req: AuthenticatedRequest, res: Response, next: Function): void => {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      if (!req.user.permissions.includes(permission) && !req.user.permissions.includes('admin')) {
        res.status(403).json({
          error: 'Insufficient permissions',
          required: permission,
          userPermissions: req.user.permissions
        });
        return;
      }

      next();
    };
  };

  // ============================================
  // TAX CALCULATION ENDPOINTS
  // ============================================

  /**
   * POST /tax/quote
   * Calculate tax for a purchase (quote phase)
   */
  quoteTax = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const request: TaxQuoteRequest = req.body;

      // Validate required fields
      const validationErrors = this.validateQuoteRequest(request);
      if (validationErrors.length > 0) {
        res.status(400).json({
          error: 'Invalid request',
          validationErrors
        });
        return;
      }

      // Validate and normalize destination address
      const validatedAddress = await this.addressService.validateAddress(request.destination);
      
      if (validatedAddress.validationConfidence < 0.5) {
        res.status(400).json({
          error: 'Invalid destination address',
          message: 'Unable to validate destination address for tax calculation',
          validationConfidence: validatedAddress.validationConfidence,
          suggestedAddress: validatedAddress
        });
        return;
      }

      // Update request with validated address
      const taxRequest = {
        ...request,
        destination: {
          country: validatedAddress.country || 'US',
          state: validatedAddress.state,
          city: validatedAddress.city,
          postalCode: validatedAddress.postalCode,
          line1: validatedAddress.line1,
          line2: validatedAddress.line2
        }
      };

      // Calculate tax
      const taxResult = await this.taxService.calculateTax(taxRequest);

      // Log audit trail
      await this.logTaxEvent('tax_quote_calculated', {
        quoteId: taxResult.quoteId,
        orderRef: request.orderRef,
        customerId: request.customer.id,
        taxAmount: taxResult.taxAmount,
        processingTimeMs: taxResult.processingTimeMs
      }, req.auditContext!);

      res.json({
        success: true,
        quote: {
          id: taxResult.quoteId,
          status: taxResult.status,
          currency: taxResult.currency,
          subtotal: taxResult.subtotalAmount,
          taxAmount: taxResult.taxAmount,
          total: taxResult.totalAmount,
          breakdown: {
            taxableAmount: taxResult.taxableAmount,
            jurisdictions: taxResult.jurisdictions.map(j => ({
              type: j.type,
              name: j.name,
              code: j.code
            })),
            lines: taxResult.lines.map(line => ({
              lineRef: line.lineRef,
              jurisdiction: line.jurisdictionId,
              taxableAmount: line.taxableAmount,
              rate: line.rate,
              taxAmount: line.taxAmount,
              taxability: line.taxability
            }))
          },
          marketplaceFacilitator: taxResult.marketplaceFacilitator,
          addressValidation: {
            confidence: validatedAddress.validationConfidence,
            service: validatedAddress.validationService,
            validated: validatedAddress.validated
          }
        },
        metadata: {
          confidence: taxResult.confidence,
          processingTime: Date.now() - startTime,
          expiresAt: taxResult.expiresAt,
          calculationId: taxResult.id
        }
      });

    } catch (error) {
      console.error('Tax quote calculation failed:', error);
      
      await this.logTaxEvent('tax_quote_failed', {
        orderRef: req.body.orderRef,
        error: (error as Error).message,
        processingTimeMs: Date.now() - startTime
      }, req.auditContext!);

      res.status(500).json({
        error: 'Tax calculation failed',
        message: (error as Error).message,
        requestId: req.headers['x-request-id'] || 'unknown'
      });
    }
  };

  /**
   * POST /tax/commit
   * Commit a tax calculation (finalize for transaction)
   */
  commitTax = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const request: TaxCommitRequest = req.body;

      if (!request.quoteId || !request.transactionId) {
        res.status(400).json({
          error: 'Invalid request',
          message: 'quoteId and transactionId are required'
        });
        return;
      }

      const committedResult = await this.taxService.commitTaxCalculation(
        request.quoteId,
        request.transactionId
      );

      // Log audit trail
      await this.logTaxEvent('tax_calculation_committed', {
        quoteId: request.quoteId,
        transactionId: request.transactionId,
        taxAmount: committedResult.taxAmount,
        finalizeTransaction: request.finalizeTransaction
      }, req.auditContext!);

      res.json({
        success: true,
        calculation: {
          id: committedResult.id,
          quoteId: committedResult.quoteId,
          status: committedResult.status,
          taxAmount: committedResult.taxAmount,
          totalAmount: committedResult.totalAmount,
          committedAt: new Date().toISOString()
        },
        ledgerEntries: await this.generateLedgerEntries(committedResult),
        nextSteps: {
          createJournalEntries: true,
          updateTransactionRecord: true,
          processPayment: request.finalizeTransaction
        }
      });

    } catch (error) {
      console.error('Tax commit failed:', error);
      
      await this.logTaxEvent('tax_commit_failed', {
        quoteId: req.body.quoteId,
        transactionId: req.body.transactionId,
        error: (error as Error).message
      }, req.auditContext!);

      res.status(500).json({
        error: 'Tax commit failed',
        message: (error as Error).message
      });
    }
  };

  /**
   * POST /tax/void
   * Void a tax calculation
   */
  voidTax = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const request: TaxVoidRequest = req.body;

      if (!request.quoteId || !request.reason) {
        res.status(400).json({
          error: 'Invalid request',
          message: 'quoteId and reason are required'
        });
        return;
      }

      const voidedResult = await this.taxService.voidTaxCalculation(
        request.quoteId,
        request.reason
      );

      // Log audit trail
      await this.logTaxEvent('tax_calculation_voided', {
        quoteId: request.quoteId,
        reason: request.reason,
        voidedBy: request.voidedBy || req.user!.id,
        originalTaxAmount: voidedResult.taxAmount
      }, req.auditContext!);

      res.json({
        success: true,
        voided: {
          quoteId: request.quoteId,
          status: voidedResult.status,
          reason: request.reason,
          voidedAt: new Date().toISOString(),
          voidedBy: request.voidedBy || req.user!.id
        }
      });

    } catch (error) {
      console.error('Tax void failed:', error);
      
      await this.logTaxEvent('tax_void_failed', {
        quoteId: req.body.quoteId,
        error: (error as Error).message
      }, req.auditContext!);

      res.status(500).json({
        error: 'Tax void failed',
        message: (error as Error).message
      });
    }
  };

  /**
   * POST /tax/refund
   * Create refund tax calculation
   */
  refundTax = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const request: TaxRefundRequest = req.body;

      if (!request.originalQuoteId || !request.reason) {
        res.status(400).json({
          error: 'Invalid request',
          message: 'originalQuoteId and reason are required'
        });
        return;
      }

      const refundResult = await this.taxService.createRefundCalculation(
        request.originalQuoteId,
        request.refundLines || [],
        request.reason
      );

      // Log audit trail
      await this.logTaxEvent('tax_refund_created', {
        originalQuoteId: request.originalQuoteId,
        refundQuoteId: refundResult.quoteId,
        reason: request.reason,
        refundedBy: request.refundedBy || req.user!.id,
        refundTaxAmount: refundResult.taxAmount
      }, req.auditContext!);

      res.json({
        success: true,
        refund: {
          id: refundResult.id,
          quoteId: refundResult.quoteId,
          status: refundResult.status,
          originalQuoteId: request.originalQuoteId,
          refundTaxAmount: refundResult.taxAmount,
          refundTotalAmount: refundResult.totalAmount,
          reason: request.reason,
          createdAt: refundResult.createdAt.toISOString()
        },
        ledgerEntries: await this.generateRefundLedgerEntries(refundResult)
      });

    } catch (error) {
      console.error('Tax refund failed:', error);
      
      await this.logTaxEvent('tax_refund_failed', {
        originalQuoteId: req.body.originalQuoteId,
        error: (error as Error).message
      }, req.auditContext!);

      res.status(500).json({
        error: 'Tax refund failed',
        message: (error as Error).message
      });
    }
  };

  // ============================================
  // UTILITY ENDPOINTS
  // ============================================

  /**
   * GET /tax/rates
   * Get tax rates for a jurisdiction and product category
   */
  getTaxRates = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { state, county, city, postalCode, productCategory } = req.query;

      if (!state || !productCategory) {
        res.status(400).json({
          error: 'Invalid request',
          message: 'state and productCategory query parameters are required'
        });
        return;
      }

      // Mock implementation - in production would query database
      const mockRates = [
        {
          jurisdiction: {
            type: 'state',
            name: this.getStateName(state as string),
            code: state as string
          },
          productCategory: productCategory as string,
          rate: state === 'WY' ? 0.04 : 0.0725,
          taxability: 'taxable',
          effectiveDate: '2025-01-01'
        }
      ];

      res.json({
        success: true,
        rates: mockRates,
        query: {
          state,
          county,
          city,
          postalCode,
          productCategory
        }
      });

    } catch (error) {
      res.status(500).json({
        error: 'Failed to retrieve tax rates',
        message: (error as Error).message
      });
    }
  };

  /**
   * GET /tax/nexus/metrics
   * Get nexus metrics and registration status
   */
  getNexusMetrics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Mock implementation - in production would query tax_nexus_metrics table
      const mockMetrics = {
        summary: {
          registeredStates: 1,
          nexusStates: 3,
          approachingThresholdStates: 2
        },
        byState: [
          {
            state: 'WY',
            status: 'registered',
            revenue12Months: 50000,
            transactions12Months: 150,
            thresholds: { revenue: 100000, transactions: 200 },
            nextDueDate: '2025-12-31'
          },
          {
            state: 'CA',
            status: 'approaching_threshold',
            revenue12Months: 450000,
            transactions12Months: null,
            thresholds: { revenue: 500000, transactions: null },
            estimatedThresholdDate: '2025-11-15'
          }
        ]
      };

      res.json({
        success: true,
        nexus: mockMetrics,
        lastUpdated: new Date().toISOString()
      });

    } catch (error) {
      res.status(500).json({
        error: 'Failed to retrieve nexus metrics',
        message: (error as Error).message
      });
    }
  };

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Validate tax quote request
   */
  private validateQuoteRequest(request: TaxQuoteRequest): string[] {
    const errors: string[] = [];

    if (!request.idempotencyKey) errors.push('idempotencyKey is required');
    if (!request.orderRef) errors.push('orderRef is required');
    if (!request.currency) errors.push('currency is required');
    if (!request.customer?.id) errors.push('customer.id is required');
    if (!request.seller?.entity) errors.push('seller.entity is required');
    if (!request.destination?.state) errors.push('destination.state is required');
    if (!request.destination?.postalCode) errors.push('destination.postalCode is required');
    if (!request.lines || request.lines.length === 0) errors.push('lines array is required');

    // Validate line items
    request.lines?.forEach((line, index) => {
      if (!line.lineRef) errors.push(`lines[${index}].lineRef is required`);
      if (!line.sku) errors.push(`lines[${index}].sku is required`);
      if (typeof line.quantity !== 'number' || line.quantity <= 0) {
        errors.push(`lines[${index}].quantity must be a positive number`);
      }
      if (typeof line.unitPrice !== 'number' || line.unitPrice < 0) {
        errors.push(`lines[${index}].unitPrice must be a non-negative number`);
      }
      if (!line.taxCategory) errors.push(`lines[${index}].taxCategory is required`);
    });

    return errors;
  }

  /**
   * Generate ledger entries for committed tax calculation
   */
  private async generateLedgerEntries(calculation: any): Promise<any[]> {
    const entries = [];

    // Revenue entry (debit)
    entries.push({
      account: 'accounts_receivable',
      type: 'debit',
      amount: calculation.subtotalAmount,
      description: 'Revenue from sale',
      transactionId: calculation.id
    });

    // Sales tax payable entries (credit) - one per jurisdiction
    for (const line of calculation.lines) {
      if (line.taxAmount > 0) {
        entries.push({
          account: 'sales_tax_payable',
          type: 'credit',
          amount: line.taxAmount,
          description: `Sales tax - ${line.jurisdictionId}`,
          jurisdiction: line.jurisdictionId,
          transactionId: calculation.id
        });
      }
    }

    return entries;
  }

  /**
   * Generate ledger entries for tax refund
   */
  private async generateRefundLedgerEntries(refundCalculation: any): Promise<any[]> {
    const entries = [];

    // Reverse the original entries with negative amounts
    entries.push({
      account: 'accounts_receivable',
      type: 'credit',  // Reverse of original debit
      amount: Math.abs(refundCalculation.subtotalAmount),
      description: 'Refund - revenue reversal',
      transactionId: refundCalculation.id
    });

    for (const line of refundCalculation.lines) {
      if (line.taxAmount !== 0) {
        entries.push({
          account: 'sales_tax_payable',
          type: 'debit',  // Reverse of original credit
          amount: Math.abs(line.taxAmount),
          description: `Refund - sales tax reversal - ${line.jurisdictionId}`,
          jurisdiction: line.jurisdictionId,
          transactionId: refundCalculation.id
        });
      }
    }

    return entries;
  }

  /**
   * Log tax-related events for audit trail
   */
  private async logTaxEvent(
    eventType: string,
    eventData: any,
    auditContext: {
      userId: string;
      sessionId: string;
      ipAddress: string;
      userAgent: string;
    }
  ): Promise<void> {
    try {
      // In production, this would insert into tax_audit_log table
      const logEntry = {
        eventType,
        eventData,
        userId: auditContext.userId,
        sessionId: auditContext.sessionId,
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
        timestamp: new Date().toISOString()
      };

      console.log('Tax Audit Log:', JSON.stringify(logEntry, null, 2));
      
      // TODO: Implement actual database logging
      
    } catch (error) {
      console.error('Failed to log tax event:', error);
      // Don't throw - audit logging shouldn't break the main flow
    }
  }

  /**
   * Get state name from code
   */
  private getStateName(stateCode: string): string {
    const stateNames: Record<string, string> = {
      'CA': 'California',
      'WY': 'Wyoming',
      'TX': 'Texas',
      'NY': 'New York',
      'FL': 'Florida'
    };
    return stateNames[stateCode.toUpperCase()] || stateCode;
  }
}

export default TaxApiController;