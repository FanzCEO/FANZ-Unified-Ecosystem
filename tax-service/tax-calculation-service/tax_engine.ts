/**
 * Real-time Tax Calculation Microservice
 * FANZ Unified Ecosystem - Tax Compliance Engine
 * 
 * Provides real-time tax calculation with P99 <150ms performance,
 * supports marketplace facilitator rules, and maintains audit trails.
 */

import crypto from 'crypto';

// ============================================
// INTERFACES AND TYPES
// ============================================

interface Address {
  country: string;
  state: string;
  city: string;
  postalCode: string;
  line1: string;
  line2?: string;
}

interface Customer {
  id: string;
  taxExempt: boolean;
  exemptionCertificateId?: string;
}

interface Seller {
  entity: string;
  nexusStates: string[];
}

interface LineItem {
  lineRef: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  taxCategory: string;
  discountAmount?: number;
  description?: string;
}

interface TaxQuoteRequest {
  idempotencyKey: string;
  orderRef: string;
  currency: string;
  customer: Customer;
  seller: Seller;
  destination: Address;
  lines: LineItem[];
  effectiveDate?: string;
}

interface Jurisdiction {
  id: string;
  type: 'state' | 'county' | 'city' | 'special';
  name: string;
  code: string;
  fips?: string;
  parentId?: string;
}

interface TaxRate {
  jurisdictionId: string;
  productCategoryId: string;
  rate: number;
  taxability: 'taxable' | 'exempt' | 'reduced';
  effectiveFrom: string;
  effectiveTo?: string;
  ruleRef?: string;
}

interface TaxRule {
  id: string;
  jurisdictionId: string;
  productCategoryId?: string;
  ruleType: string;
  priority: number;
  conditions: Record<string, any>;
  actions: Record<string, any>;
  effectiveFrom: string;
  effectiveTo?: string;
}

interface TaxCalculationLine {
  lineRef: string;
  jurisdictionId: string;
  productCategoryId: string;
  quantity: number;
  unitPrice: number;
  lineAmount: number;
  discountAmount: number;
  taxableAmount: number;
  rate: number;
  taxAmount: number;
  taxability: 'taxable' | 'exempt' | 'reduced';
  appliedRules: string[];
}

interface TaxCalculationResult {
  id: string;
  quoteId: string;
  status: 'quoted' | 'committed' | 'voided' | 'refunded';
  currency: string;
  subtotalAmount: number;
  taxableAmount: number;
  taxAmount: number;
  totalAmount: number;
  destinationAddress: Address;
  jurisdictions: Jurisdiction[];
  lines: TaxCalculationLine[];
  marketplaceFacilitator: {
    isApplicable: boolean;
    fanzCollects: boolean;
    fanzRemits: boolean;
  };
  confidence: number;
  processingTimeMs: number;
  createdAt: Date;
  expiresAt: Date;
}

interface TaxEngineConfig {
  database: {
    connectionString: string;
  };
  cache: {
    enabled: boolean;
    ttlSeconds: number;
    maxSize: number;
  };
  rounding: {
    method: 'bankers' | 'half_up' | 'truncate';
    precision: number;
  };
  performance: {
    timeoutMs: number;
    maxConcurrency: number;
  };
  marketplace: {
    companyEntity: string;
    homeState: string;
    facilitatorStates: string[];
  };
}

// ============================================
// TAX RULES ENGINE
// ============================================

class TaxRulesEngine {
  private config: TaxEngineConfig;
  private jurisdictionCache = new Map<string, Jurisdiction[]>();
  private rateCache = new Map<string, TaxRate[]>();
  private ruleCache = new Map<string, TaxRule[]>();

  constructor(config: TaxEngineConfig) {
    this.config = config;
  }

  /**
   * Evaluate tax rules for a given context
   */
  async evaluateRules(
    jurisdictions: Jurisdiction[],
    lineItem: LineItem,
    customer: Customer,
    seller: Seller,
    destination: Address
  ): Promise<{
    taxableAmount: number;
    rate: number;
    taxAmount: number;
    taxability: 'taxable' | 'exempt' | 'reduced';
    appliedRules: string[];
  }> {
    const appliedRules: string[] = [];
    let taxableAmount = (lineItem.quantity * lineItem.unitPrice) - (lineItem.discountAmount || 0);
    let finalRate = 0;
    let taxability: 'taxable' | 'exempt' | 'reduced' = 'taxable';

    // Check customer exemptions first
    if (customer.taxExempt) {
      return {
        taxableAmount: 0,
        rate: 0,
        taxAmount: 0,
        taxability: 'exempt',
        appliedRules: ['customer_exempt']
      };
    }

    // Marketplace facilitator rules
    const facilitatorRules = await this.evaluateMarketplaceFacilitatorRules(
      destination.state,
      seller,
      lineItem
    );

    if (facilitatorRules.exempt) {
      return {
        taxableAmount: 0,
        rate: 0,
        taxAmount: 0,
        taxability: 'exempt',
        appliedRules: facilitatorRules.appliedRules
      };
    }

    // Apply jurisdiction-specific rules in hierarchy order
    for (const jurisdiction of jurisdictions) {
      const jurisdictionRules = await this.getJurisdictionRules(jurisdiction.id, lineItem.taxCategory);
      
      for (const rule of jurisdictionRules) {
        if (this.evaluateRuleConditions(rule, {
          lineItem,
          customer,
          seller,
          destination,
          jurisdiction
        })) {
          const ruleResult = this.applyRule(rule, taxableAmount, finalRate);
          taxableAmount = ruleResult.taxableAmount;
          finalRate += ruleResult.additionalRate;
          
          if (ruleResult.taxability) {
            taxability = ruleResult.taxability;
          }

          appliedRules.push(rule.id);
        }
      }

      // Get base tax rate for this jurisdiction and product category
      const baseRate = await this.getBaseRate(jurisdiction.id, lineItem.taxCategory);
      if (baseRate && baseRate.taxability === 'taxable') {
        finalRate += baseRate.rate;
      } else if (baseRate && baseRate.taxability === 'exempt') {
        taxability = 'exempt';
        taxableAmount = 0;
        finalRate = 0;
        break;
      }
    }

    const taxAmount = this.roundAmount(taxableAmount * finalRate);

    return {
      taxableAmount,
      rate: finalRate,
      taxAmount,
      taxability,
      appliedRules
    };
  }

  /**
   * Evaluate marketplace facilitator rules
   */
  private async evaluateMarketplaceFacilitatorRules(
    state: string,
    seller: Seller,
    lineItem: LineItem
  ): Promise<{ exempt: boolean; appliedRules: string[] }> {
    const appliedRules: string[] = [];

    // Check if state has marketplace facilitator law
    if (!this.config.marketplace.facilitatorStates.includes(state)) {
      return { exempt: false, appliedRules };
    }

    // FANZ operates as marketplace facilitator in applicable states
    if (seller.entity === this.config.marketplace.companyEntity) {
      appliedRules.push('marketplace_facilitator');

      // Apply category-specific marketplace rules
      switch (lineItem.taxCategory) {
        case 'VOLUNTARY_TIP':
        case 'DONATION':
          appliedRules.push('tip_donation_exempt');
          return { exempt: true, appliedRules };
        
        case 'GIFT_CARD':
          appliedRules.push('gift_card_exempt_at_sale');
          return { exempt: true, appliedRules };
      }
    }

    return { exempt: false, appliedRules };
  }

  /**
   * Evaluate rule conditions
   */
  private evaluateRuleConditions(
    rule: TaxRule,
    context: {
      lineItem: LineItem;
      customer: Customer;
      seller: Seller;
      destination: Address;
      jurisdiction: Jurisdiction;
    }
  ): boolean {
    // Simplified rule condition evaluation
    // In production, this would be a more sophisticated DSL parser
    
    if (rule.conditions.minAmount && context.lineItem.unitPrice < rule.conditions.minAmount) {
      return false;
    }

    if (rule.conditions.maxAmount && context.lineItem.unitPrice > rule.conditions.maxAmount) {
      return false;
    }

    if (rule.conditions.productCategories && 
        !rule.conditions.productCategories.includes(context.lineItem.taxCategory)) {
      return false;
    }

    if (rule.conditions.excludeStates && 
        rule.conditions.excludeStates.includes(context.destination.state)) {
      return false;
    }

    return true;
  }

  /**
   * Apply rule actions
   */
  private applyRule(
    rule: TaxRule,
    currentTaxableAmount: number,
    currentRate: number
  ): {
    taxableAmount: number;
    additionalRate: number;
    taxability?: 'taxable' | 'exempt' | 'reduced';
  } {
    let taxableAmount = currentTaxableAmount;
    let additionalRate = 0;
    let taxability: 'taxable' | 'exempt' | 'reduced' | undefined;

    switch (rule.actions.type) {
      case 'exempt':
        taxability = 'exempt';
        taxableAmount = 0;
        break;
      
      case 'reduce_rate':
        additionalRate = -(rule.actions.amount || 0);
        break;
      
      case 'add_rate':
        additionalRate = rule.actions.amount || 0;
        break;
      
      case 'cap_amount':
        taxableAmount = Math.min(taxableAmount, rule.actions.maxAmount || taxableAmount);
        break;
    }

    return { taxableAmount, additionalRate, taxability };
  }

  /**
   * Get jurisdiction-specific tax rules
   */
  private async getJurisdictionRules(jurisdictionId: string, productCategory: string): Promise<TaxRule[]> {
    const cacheKey = `rules_${jurisdictionId}_${productCategory}`;
    
    if (this.config.cache.enabled && this.ruleCache.has(cacheKey)) {
      return this.ruleCache.get(cacheKey)!;
    }

    // Mock database query - in production, this would query tax_rule table
    const rules: TaxRule[] = [];
    
    if (this.config.cache.enabled) {
      this.ruleCache.set(cacheKey, rules);
    }

    return rules;
  }

  /**
   * Get base tax rate for jurisdiction and product category
   */
  private async getBaseRate(jurisdictionId: string, productCategory: string): Promise<TaxRate | null> {
    const cacheKey = `rate_${jurisdictionId}_${productCategory}`;
    
    if (this.config.cache.enabled && this.rateCache.has(cacheKey)) {
      const rates = this.rateCache.get(cacheKey)!;
      return rates.length > 0 ? rates[0] : null;
    }

    // Mock database query - in production, this would query tax_rate table
    let mockRate: TaxRate | null = null;

    // Wyoming - digital goods exempt
    if (jurisdictionId.includes('WY')) {
      if (['DIGITAL_DOWNLOAD', 'DIGITAL_STREAM', 'DIGITAL_SUBSCRIPTION'].includes(productCategory)) {
        mockRate = {
          jurisdictionId,
          productCategoryId: productCategory,
          rate: 0,
          taxability: 'exempt',
          effectiveFrom: '2025-01-01'
        };
      } else if (productCategory === 'PHYSICAL_GOODS') {
        mockRate = {
          jurisdictionId,
          productCategoryId: productCategory,
          rate: 0.04,
          taxability: 'taxable',
          effectiveFrom: '2025-01-01'
        };
      }
    }

    // California - digital goods taxable
    if (jurisdictionId.includes('CA')) {
      mockRate = {
        jurisdictionId,
        productCategoryId: productCategory,
        rate: 0.0725,
        taxability: 'taxable',
        effectiveFrom: '2025-01-01'
      };
    }

    const rates = mockRate ? [mockRate] : [];
    
    if (this.config.cache.enabled) {
      this.rateCache.set(cacheKey, rates);
    }

    return mockRate;
  }

  /**
   * Round tax amount using configured method
   */
  private roundAmount(amount: number): number {
    const factor = Math.pow(10, this.config.rounding.precision);
    
    switch (this.config.rounding.method) {
      case 'bankers':
        // Banker's rounding (round half to even)
        const scaled = amount * factor;
        const rounded = Math.round(scaled);
        const fraction = scaled - Math.floor(scaled);
        
        if (Math.abs(fraction - 0.5) < Number.EPSILON) {
          // Exactly half - round to even
          return (rounded % 2 === 0 ? rounded : rounded - 1) / factor;
        }
        return rounded / factor;
        
      case 'half_up':
        return Math.round(amount * factor) / factor;
        
      case 'truncate':
        return Math.floor(amount * factor) / factor;
        
      default:
        return Math.round(amount * factor) / factor;
    }
  }
}

// ============================================
// TAX CALCULATION SERVICE
// ============================================

export class TaxCalculationService {
  private rulesEngine: TaxRulesEngine;
  private config: TaxEngineConfig;
  private calculationCache = new Map<string, TaxCalculationResult>();

  constructor(config: TaxEngineConfig) {
    this.config = config;
    this.rulesEngine = new TaxRulesEngine(config);
  }

  /**
   * Calculate taxes for a quote request
   */
  async calculateTax(request: TaxQuoteRequest): Promise<TaxCalculationResult> {
    const startTime = Date.now();

    try {
      // Check for cached result using idempotency key
      if (this.config.cache.enabled && this.calculationCache.has(request.idempotencyKey)) {
        const cached = this.calculationCache.get(request.idempotencyKey)!;
        if (cached.expiresAt > new Date()) {
          return cached;
        }
      }

      // Resolve jurisdictions for destination address
      const jurisdictions = await this.resolveJurisdictions(request.destination);

      // Check nexus - must have nexus in destination state to collect tax
      const hasNexus = request.seller.nexusStates.includes(request.destination.state);
      if (!hasNexus) {
        return this.createZeroTaxResult(request, jurisdictions, 'no_nexus', startTime);
      }

      // Calculate tax for each line item
      const calculationLines: TaxCalculationLine[] = [];
      let subtotalAmount = 0;
      let totalTaxableAmount = 0;
      let totalTaxAmount = 0;

      for (const lineItem of request.lines) {
        const lineAmount = lineItem.quantity * lineItem.unitPrice;
        const discountAmount = lineItem.discountAmount || 0;
        subtotalAmount += lineAmount - discountAmount;

        // Get product category mapping
        const productCategory = await this.getProductCategory(lineItem.sku, lineItem.taxCategory);

        // Apply tax rules for each jurisdiction
        for (const jurisdiction of jurisdictions) {
          const ruleResult = await this.rulesEngine.evaluateRules(
            [jurisdiction], // Single jurisdiction for line calculation
            lineItem,
            request.customer,
            request.seller,
            request.destination
          );

          if (ruleResult.taxAmount > 0) {
            calculationLines.push({
              lineRef: lineItem.lineRef,
              jurisdictionId: jurisdiction.id,
              productCategoryId: productCategory,
              quantity: lineItem.quantity,
              unitPrice: lineItem.unitPrice,
              lineAmount,
              discountAmount,
              taxableAmount: ruleResult.taxableAmount,
              rate: ruleResult.rate,
              taxAmount: ruleResult.taxAmount,
              taxability: ruleResult.taxability,
              appliedRules: ruleResult.appliedRules
            });

            totalTaxableAmount += ruleResult.taxableAmount;
            totalTaxAmount += ruleResult.taxAmount;
          }
        }
      }

      // Create calculation result
      const result: TaxCalculationResult = {
        id: crypto.randomUUID(),
        quoteId: `quote_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        status: 'quoted',
        currency: request.currency,
        subtotalAmount,
        taxableAmount: totalTaxableAmount,
        taxAmount: totalTaxAmount,
        totalAmount: subtotalAmount + totalTaxAmount,
        destinationAddress: request.destination,
        jurisdictions,
        lines: calculationLines,
        marketplaceFacilitator: {
          isApplicable: this.config.marketplace.facilitatorStates.includes(request.destination.state),
          fanzCollects: request.seller.entity === this.config.marketplace.companyEntity,
          fanzRemits: request.seller.entity === this.config.marketplace.companyEntity
        },
        confidence: this.calculateConfidence(calculationLines),
        processingTimeMs: Date.now() - startTime,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + (24 * 60 * 60 * 1000)) // 24 hour expiry
      };

      // Cache result
      if (this.config.cache.enabled) {
        this.calculationCache.set(request.idempotencyKey, result);
      }

      return result;

    } catch (error) {
      console.error('Tax calculation failed:', error);
      throw new Error(`Tax calculation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Commit a tax calculation (convert quote to committed)
   */
  async commitTaxCalculation(
    quoteId: string,
    transactionId: string
  ): Promise<TaxCalculationResult> {
    // Find the quoted calculation
    const quotedCalculation = Array.from(this.calculationCache.values())
      .find(calc => calc.quoteId === quoteId);

    if (!quotedCalculation) {
      throw new Error('Tax quote not found or expired');
    }

    if (quotedCalculation.status !== 'quoted') {
      throw new Error('Tax calculation already committed or invalid status');
    }

    // Create committed version
    const committedCalculation: TaxCalculationResult = {
      ...quotedCalculation,
      status: 'committed',
      // In production, this would be persisted to database
    };

    // Update cache
    if (this.config.cache.enabled) {
      this.calculationCache.set(quoteId, committedCalculation);
    }

    return committedCalculation;
  }

  /**
   * Void a tax calculation
   */
  async voidTaxCalculation(quoteId: string, reason: string): Promise<TaxCalculationResult> {
    const calculation = Array.from(this.calculationCache.values())
      .find(calc => calc.quoteId === quoteId);

    if (!calculation) {
      throw new Error('Tax calculation not found');
    }

    const voidedCalculation: TaxCalculationResult = {
      ...calculation,
      status: 'voided'
    };

    if (this.config.cache.enabled) {
      this.calculationCache.set(quoteId, voidedCalculation);
    }

    return voidedCalculation;
  }

  /**
   * Create adjustment/refund calculation
   */
  async createRefundCalculation(
    originalQuoteId: string,
    refundLines: Partial<LineItem>[],
    refundReason: string
  ): Promise<TaxCalculationResult> {
    const originalCalculation = Array.from(this.calculationCache.values())
      .find(calc => calc.quoteId === originalQuoteId);

    if (!originalCalculation) {
      throw new Error('Original tax calculation not found');
    }

    // Create refund calculation with negative amounts
    const refundCalculation: TaxCalculationResult = {
      ...originalCalculation,
      id: crypto.randomUUID(),
      quoteId: `refund_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      status: 'refunded',
      taxAmount: -originalCalculation.taxAmount,
      totalAmount: -originalCalculation.totalAmount,
      lines: originalCalculation.lines.map(line => ({
        ...line,
        taxAmount: -line.taxAmount,
        lineAmount: -line.lineAmount
      })),
      createdAt: new Date()
    };

    return refundCalculation;
  }

  /**
   * Resolve tax jurisdictions for address
   */
  private async resolveJurisdictions(address: Address): Promise<Jurisdiction[]> {
    // Mock implementation - in production would call AddressValidationService
    const jurisdictions: Jurisdiction[] = [];

    // Add state jurisdiction
    jurisdictions.push({
      id: `state_${address.state.toLowerCase()}`,
      type: 'state',
      name: this.getStateName(address.state),
      code: address.state,
      fips: this.getStateFips(address.state)
    });

    // Add mock county jurisdiction for major cities
    const majorCities = ['san francisco', 'los angeles', 'new york', 'chicago'];
    if (majorCities.includes(address.city.toLowerCase())) {
      jurisdictions.push({
        id: `county_${address.city.toLowerCase().replace(' ', '_')}`,
        type: 'county',
        name: `${address.city} County`,
        code: 'COUNTY',
        parentId: jurisdictions[0].id
      });
    }

    return jurisdictions;
  }

  /**
   * Get product category for SKU
   */
  private async getProductCategory(sku: string, fallbackCategory: string): Promise<string> {
    // Mock implementation - in production would query tax_product_mapping table
    return fallbackCategory;
  }

  /**
   * Create zero tax result for no-nexus scenarios
   */
  private createZeroTaxResult(
    request: TaxQuoteRequest,
    jurisdictions: Jurisdiction[],
    reason: string,
    startTime: number
  ): TaxCalculationResult {
    const subtotalAmount = request.lines.reduce((sum, line) => 
      sum + (line.quantity * line.unitPrice) - (line.discountAmount || 0), 0
    );

    return {
      id: crypto.randomUUID(),
      quoteId: `quote_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      status: 'quoted',
      currency: request.currency,
      subtotalAmount,
      taxableAmount: 0,
      taxAmount: 0,
      totalAmount: subtotalAmount,
      destinationAddress: request.destination,
      jurisdictions,
      lines: [],
      marketplaceFacilitator: {
        isApplicable: false,
        fanzCollects: false,
        fanzRemits: false
      },
      confidence: 1.0,
      processingTimeMs: Date.now() - startTime,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + (24 * 60 * 60 * 1000))
    };
  }

  /**
   * Calculate confidence score based on calculation factors
   */
  private calculateConfidence(lines: TaxCalculationLine[]): number {
    if (lines.length === 0) return 1.0;

    // High confidence for straightforward calculations
    // Lower confidence for complex multi-jurisdiction scenarios
    const hasMultipleJurisdictions = new Set(lines.map(l => l.jurisdictionId)).size > 1;
    const hasComplexRules = lines.some(l => l.appliedRules.length > 2);

    if (!hasMultipleJurisdictions && !hasComplexRules) return 0.95;
    if (hasMultipleJurisdictions && !hasComplexRules) return 0.85;
    if (!hasMultipleJurisdictions && hasComplexRules) return 0.80;
    return 0.70;
  }

  /**
   * Helper method to get state name from code
   */
  private getStateName(stateCode: string): string {
    const stateNames: Record<string, string> = {
      'CA': 'California', 'WY': 'Wyoming', 'TX': 'Texas', 'NY': 'New York', 'FL': 'Florida'
      // ... other states
    };
    return stateNames[stateCode] || stateCode;
  }

  /**
   * Helper method to get state FIPS code
   */
  private getStateFips(stateCode: string): string {
    const stateFips: Record<string, string> = {
      'CA': '06', 'WY': '56', 'TX': '48', 'NY': '36', 'FL': '12'
      // ... other states
    };
    return stateFips[stateCode] || '00';
  }
}

export default TaxCalculationService;