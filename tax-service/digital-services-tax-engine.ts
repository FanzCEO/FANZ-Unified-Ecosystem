/**
 * Digital Services Tax Engine
 * FANZ Unified Ecosystem - Tax Compliance
 * 
 * Handles complex tax scenarios for digital goods, subscriptions, bundling,
 * promotions, gift cards, tips, and donations across all FANZ platforms.
 */

import { Pool } from 'pg';
import { TaxCalculationResult, TaxCalculationRequest } from './tax-calculation-service/tax_engine';
import { ExemptionManagementService, ExemptionValidationRequest } from './exemption-management-service';

// ============================================
// INTERFACES & TYPES
// ============================================

interface DigitalServicesTaxRequest extends TaxCalculationRequest {
  subscriptionContext?: {
    subscriptionId: string;
    renewalNumber: number;
    originalSubscriptionDate: Date;
    billingPeriod: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
    proratedDays?: number;
    gracePeriodDays?: number;
  };
  bundleContext?: {
    bundleId: string;
    bundleType: 'fixed' | 'tiered' | 'custom';
    totalBundlePrice: number;
    allocationMethod: 'proportional' | 'priority' | 'equal' | 'custom';
    itemAllocations?: Record<string, number>; // lineRef -> allocated amount
  };
  promotionContext?: {
    promotionId: string;
    promotionType: 'percentage' | 'fixed_amount' | 'bogo' | 'tiered' | 'bundle';
    discountAmount: number;
    discountPercentage?: number;
    applicableLineRefs: string[]; // Which lines the promotion applies to
    taxableDiscount: boolean; // Whether discount reduces taxable amount
  };
  giftCardContext?: {
    isGiftCardPurchase: boolean;
    isGiftCardRedemption: boolean;
    giftCardId?: string;
    originalPurchaseJurisdiction?: string;
    originalPurchaseDate?: Date;
  };
  tipContext?: {
    isTip: boolean;
    isVoluntary: boolean;
    suggestedAmounts?: number[];
    creatorId?: string;
    platformTipFee?: number;
  };
  donationContext?: {
    isDonation: boolean;
    isCharitable: boolean;
    recipientTaxId?: string;
    platformDonationFee?: number;
  };
}

interface SubscriptionTaxRule {
  jurisdictionId: string;
  productCategoryId: string;
  taxOnRenewal: 'always' | 'never' | 'address_change' | 'jurisdiction_change';
  useCurrentAddress: boolean;
  useOriginalAddress: boolean;
  prorateFirstPeriod: boolean;
  gracePeriodTaxable: boolean;
  midCycleCancellationRefundable: boolean;
  upgradeDowngradeTaxDiff: boolean;
  conditions: {
    minimumSubscriptionDays?: number;
    maximumRenewalGap?: number;
    requiresActiveStatus: boolean;
  };
}

interface BundleTaxRule {
  jurisdictionId: string;
  bundleType: string;
  allocationMethod: 'proportional' | 'priority' | 'equal' | 'highest_tax_first';
  taxMixedBundle: 'separately' | 'highest_rate' | 'blended_rate';
  conditions: {
    requiresSeparateLineItems: boolean;
    allowsPartialTaxability: boolean;
    appliesToDigitalOnly: boolean;
  };
}

interface PromotionTaxRule {
  jurisdictionId: string;
  promotionType: string;
  discountTaxability: 'taxable' | 'non_taxable' | 'follows_product';
  allocationMethod: 'proportional' | 'highest_tax_first' | 'lowest_tax_first';
  conditions: {
    appliesToTax: boolean;
    reducesBase: boolean;
    stacksWithOtherPromotions: boolean;
  };
}

interface TipDonationTaxRule {
  jurisdictionId: string;
  itemType: 'tip' | 'donation';
  taxability: 'always_taxable' | 'never_taxable' | 'conditional';
  conditions: {
    voluntaryTipsExempt: boolean;
    charitableDonationsExempt: boolean;
    platformFeeTaxable: boolean;
    minimumAmountExemption?: number;
    maxExemptionPerTransaction?: number;
  };
}

interface GiftCardTaxRule {
  jurisdictionId: string;
  taxOnPurchase: boolean;
  taxOnRedemption: boolean;
  purchaseJurisdictionApplies: boolean;
  redemptionJurisdictionApplies: boolean;
  conditions: {
    expirationPeriodMonths?: number;
    requiresOriginalPurchaseData: boolean;
    allowsCrossJurisdictionRedemption: boolean;
  };
}

// ============================================
// DIGITAL SERVICES TAX ENGINE
// ============================================

export class DigitalServicesTaxEngine {
  private db: Pool;
  private exemptionService: ExemptionManagementService;

  constructor(db: Pool, exemptionService: ExemptionManagementService) {
    this.db = db;
    this.exemptionService = exemptionService;
  }

  /**
   * Calculate tax for digital services with complex scenarios
   */
  async calculateDigitalServicesTax(request: DigitalServicesTaxRequest): Promise<TaxCalculationResult> {
    try {
      console.log(`Processing digital services tax calculation: ${request.idempotencyKey}`);

      // 1. Pre-process lines for subscriptions
      if (request.subscriptionContext) {
        await this.processSubscriptionTax(request);
      }

      // 2. Handle bundle allocation
      if (request.bundleContext) {
        await this.processBundleTax(request);
      }

      // 3. Apply promotions and discounts
      if (request.promotionContext) {
        await this.processPromotionTax(request);
      }

      // 4. Handle gift card logic
      if (request.giftCardContext) {
        await this.processGiftCardTax(request);
      }

      // 5. Process tips and donations
      if (request.tipContext) {
        await this.processTipTax(request);
      }

      if (request.donationContext) {
        await this.processDonationTax(request);
      }

      // 6. Calculate base tax using standard engine
      const baseTaxResult = await this.calculateBaseTax(request);

      // 7. Apply digital goods specific adjustments
      const adjustedResult = await this.applyDigitalGoodsAdjustments(baseTaxResult, request);

      // 8. Apply exemptions
      const finalResult = await this.applyExemptions(adjustedResult, request);

      console.log(`Digital services tax calculation completed: ${finalResult.id}`);
      return finalResult;

    } catch (error) {
      console.error('Digital services tax calculation failed:', error);
      throw error;
    }
  }

  /**
   * Process subscription tax logic
   */
  private async processSubscriptionTax(request: DigitalServicesTaxRequest): Promise<void> {
    if (!request.subscriptionContext) return;

    const { subscriptionContext } = request;
    console.log(`Processing subscription tax for: ${subscriptionContext.subscriptionId}`);

    // Get subscription tax rules
    const rules = await this.getSubscriptionTaxRules(
      request.destinationAddress.state,
      request.lines[0]?.taxCategory || 'DIGITAL_SUBSCRIPTION'
    );

    for (const rule of rules) {
      // Determine if tax should be recalculated on renewal
      if (subscriptionContext.renewalNumber > 0) {
        await this.handleSubscriptionRenewal(request, rule);
      }

      // Handle proration for partial periods
      if (subscriptionContext.proratedDays) {
        await this.handleSubscriptionProration(request, rule);
      }

      // Handle grace period taxability
      if (subscriptionContext.gracePeriodDays && subscriptionContext.gracePeriodDays > 0) {
        await this.handleGracePeriodTax(request, rule);
      }
    }
  }

  /**
   * Handle subscription renewal tax logic
   */
  private async handleSubscriptionRenewal(
    request: DigitalServicesTaxRequest,
    rule: SubscriptionTaxRule
  ): Promise<void> {
    const { subscriptionContext } = request;
    if (!subscriptionContext) return;

    // Check if we should use current address vs original address
    if (rule.useCurrentAddress) {
      // Address validation should have already occurred in the main tax calculation
      console.log('Using current address for subscription renewal tax');
    }

    // Check for address/jurisdiction changes
    if (rule.taxOnRenewal === 'jurisdiction_change') {
      const originalJurisdiction = await this.getOriginalSubscriptionJurisdiction(
        subscriptionContext.subscriptionId
      );
      
      const currentJurisdiction = request.destinationAddress.state;
      
      if (originalJurisdiction !== currentJurisdiction) {
        console.log(`Jurisdiction change detected: ${originalJurisdiction} -> ${currentJurisdiction}`);
        // Tax will be recalculated with current jurisdiction rules
      } else if (rule.taxOnRenewal === 'never') {
        // Use original jurisdiction's rules
        request.destinationAddress.state = originalJurisdiction;
      }
    }
  }

  /**
   * Handle subscription proration
   */
  private async handleSubscriptionProration(
    request: DigitalServicesTaxRequest,
    rule: SubscriptionTaxRule
  ): Promise<void> {
    const { subscriptionContext } = request;
    if (!subscriptionContext?.proratedDays || !rule.prorateFirstPeriod) return;

    // Calculate proration factor based on billing period
    const totalDaysInPeriod = this.getDaysInBillingPeriod(subscriptionContext.billingPeriod);
    const prorationFactor = subscriptionContext.proratedDays / totalDaysInPeriod;

    // Apply proration to all taxable lines
    for (const line of request.lines) {
      if (line.taxCategory === 'DIGITAL_SUBSCRIPTION') {
        const originalAmount = line.unitPrice * line.quantity;
        const proratedAmount = Math.round(originalAmount * prorationFactor * 100) / 100;
        
        line.unitPrice = proratedAmount / line.quantity;
        console.log(`Prorated subscription line ${line.lineRef}: ${originalAmount} -> ${proratedAmount}`);
      }
    }
  }

  /**
   * Handle grace period tax implications
   */
  private async handleGracePeriodTax(
    request: DigitalServicesTaxRequest,
    rule: SubscriptionTaxRule
  ): Promise<void> {
    const { subscriptionContext } = request;
    if (!subscriptionContext?.gracePeriodDays) return;

    if (!rule.gracePeriodTaxable) {
      // Grace period is not taxable - adjust amounts
      const gracePeriodFactor = subscriptionContext.gracePeriodDays / 
        this.getDaysInBillingPeriod(subscriptionContext.billingPeriod);

      for (const line of request.lines) {
        if (line.taxCategory === 'DIGITAL_SUBSCRIPTION') {
          const gracePeriodAmount = Math.round(line.unitPrice * line.quantity * gracePeriodFactor * 100) / 100;
          line.unitPrice = (line.unitPrice * line.quantity - gracePeriodAmount) / line.quantity;
          console.log(`Removed grace period from taxable amount: ${gracePeriodAmount}`);
        }
      }
    }
  }

  /**
   * Process bundle tax allocation
   */
  private async processBundleTax(request: DigitalServicesTaxRequest): Promise<void> {
    if (!request.bundleContext) return;

    const { bundleContext } = request;
    console.log(`Processing bundle tax allocation: ${bundleContext.bundleId}`);

    // Get bundle tax rules
    const rules = await this.getBundleTaxRules(
      request.destinationAddress.state,
      bundleContext.bundleType
    );

    const rule = rules[0]; // Use first applicable rule
    if (!rule) return;

    // Apply allocation method
    switch (bundleContext.allocationMethod) {
      case 'proportional':
        await this.applyProportionalAllocation(request, bundleContext);
        break;
      case 'priority':
        await this.applyPriorityAllocation(request, bundleContext);
        break;
      case 'equal':
        await this.applyEqualAllocation(request, bundleContext);
        break;
      case 'custom':
        await this.applyCustomAllocation(request, bundleContext);
        break;
    }

    // Handle mixed taxability bundles
    await this.handleMixedTaxabilityBundle(request, rule);
  }

  /**
   * Apply proportional allocation for bundles
   */
  private async applyProportionalAllocation(
    request: DigitalServicesTaxRequest,
    bundleContext: any
  ): Promise<void> {
    const totalStandardPrice = request.lines.reduce((sum, line) => {
      return sum + (line.metadata?.standardPrice || line.unitPrice * line.quantity);
    }, 0);

    const bundleDiscount = totalStandardPrice - bundleContext.totalBundlePrice;

    for (const line of request.lines) {
      const standardPrice = line.metadata?.standardPrice || line.unitPrice * line.quantity;
      const proportion = standardPrice / totalStandardPrice;
      const allocatedDiscount = Math.round(bundleDiscount * proportion * 100) / 100;
      const allocatedPrice = standardPrice - allocatedDiscount;

      line.unitPrice = allocatedPrice / line.quantity;
      line.metadata = { 
        ...line.metadata, 
        bundleAllocation: allocatedPrice,
        bundleDiscount: allocatedDiscount,
        allocationMethod: 'proportional'
      };

      console.log(`Line ${line.lineRef}: ${standardPrice} -> ${allocatedPrice} (discount: ${allocatedDiscount})`);
    }
  }

  /**
   * Apply priority allocation (highest tax rate items first)
   */
  private async applyPriorityAllocation(
    request: DigitalServicesTaxRequest,
    bundleContext: any
  ): Promise<void> {
    // Get tax rates for each line to determine priority
    const linesWithRates = await Promise.all(
      request.lines.map(async (line) => {
        const rate = await this.getTaxRateForLine(line, request.destinationAddress.state);
        return { line, rate };
      })
    );

    // Sort by tax rate (highest first)
    linesWithRates.sort((a, b) => b.rate - a.rate);

    let remainingBundlePrice = bundleContext.totalBundlePrice;

    for (const { line } of linesWithRates) {
      const standardPrice = line.metadata?.standardPrice || line.unitPrice * line.quantity;
      const allocatedPrice = Math.min(standardPrice, remainingBundlePrice);
      
      line.unitPrice = allocatedPrice / line.quantity;
      line.metadata = {
        ...line.metadata,
        bundleAllocation: allocatedPrice,
        allocationMethod: 'priority'
      };

      remainingBundlePrice -= allocatedPrice;

      console.log(`Priority allocation - Line ${line.lineRef}: ${allocatedPrice}`);
      
      if (remainingBundlePrice <= 0) break;
    }
  }

  /**
   * Apply equal allocation across bundle items
   */
  private async applyEqualAllocation(
    request: DigitalServicesTaxRequest,
    bundleContext: any
  ): Promise<void> {
    const itemCount = request.lines.length;
    const equalAllocation = Math.round((bundleContext.totalBundlePrice / itemCount) * 100) / 100;

    for (const line of request.lines) {
      line.unitPrice = equalAllocation / line.quantity;
      line.metadata = {
        ...line.metadata,
        bundleAllocation: equalAllocation,
        allocationMethod: 'equal'
      };

      console.log(`Equal allocation - Line ${line.lineRef}: ${equalAllocation}`);
    }
  }

  /**
   * Apply custom allocation from bundle context
   */
  private async applyCustomAllocation(
    request: DigitalServicesTaxRequest,
    bundleContext: any
  ): Promise<void> {
    if (!bundleContext.itemAllocations) return;

    for (const line of request.lines) {
      const allocatedAmount = bundleContext.itemAllocations[line.lineRef];
      if (allocatedAmount !== undefined) {
        line.unitPrice = allocatedAmount / line.quantity;
        line.metadata = {
          ...line.metadata,
          bundleAllocation: allocatedAmount,
          allocationMethod: 'custom'
        };

        console.log(`Custom allocation - Line ${line.lineRef}: ${allocatedAmount}`);
      }
    }
  }

  /**
   * Handle mixed taxability bundles
   */
  private async handleMixedTaxabilityBundle(
    request: DigitalServicesTaxRequest,
    rule: BundleTaxRule
  ): Promise<void> {
    // Get taxability for each line
    const taxabilityMap = new Map<string, boolean>();
    
    for (const line of request.lines) {
      const isTaxable = await this.isLineTaxable(line, request.destinationAddress.state);
      taxabilityMap.set(line.lineRef, isTaxable);
    }

    // Apply mixed bundle rule
    switch (rule.taxMixedBundle) {
      case 'separately':
        // Each item taxed according to its own rules (default behavior)
        break;
      
      case 'highest_rate':
        // Apply highest tax rate to entire bundle
        const highestRate = await this.getHighestTaxRate(request.lines, request.destinationAddress.state);
        for (const line of request.lines) {
          line.metadata = { ...line.metadata, forcedTaxRate: highestRate };
        }
        break;
      
      case 'blended_rate':
        // Apply weighted average tax rate
        const blendedRate = await this.calculateBlendedTaxRate(request.lines, request.destinationAddress.state);
        for (const line of request.lines) {
          line.metadata = { ...line.metadata, forcedTaxRate: blendedRate };
        }
        break;
    }
  }

  /**
   * Process promotion tax implications
   */
  private async processPromotionTax(request: DigitalServicesTaxRequest): Promise<void> {
    if (!request.promotionContext) return;

    const { promotionContext } = request;
    console.log(`Processing promotion tax: ${promotionContext.promotionId}`);

    // Get promotion tax rules
    const rules = await this.getPromotionTaxRules(
      request.destinationAddress.state,
      promotionContext.promotionType
    );

    const rule = rules[0];
    if (!rule) return;

    // Apply discount based on taxability rules
    if (rule.discountTaxability === 'non_taxable') {
      // Discount doesn't reduce taxable amount
      console.log('Promotion discount is non-taxable - not reducing tax base');
      return;
    }

    // Apply discount allocation
    const applicableLines = request.lines.filter(line => 
      promotionContext.applicableLineRefs.includes(line.lineRef)
    );

    switch (rule.allocationMethod) {
      case 'proportional':
        await this.applyProportionalDiscount(applicableLines, promotionContext);
        break;
      case 'highest_tax_first':
        await this.applyHighestTaxFirstDiscount(applicableLines, promotionContext, request.destinationAddress.state);
        break;
      case 'lowest_tax_first':
        await this.applyLowestTaxFirstDiscount(applicableLines, promotionContext, request.destinationAddress.state);
        break;
    }
  }

  /**
   * Apply proportional discount across applicable lines
   */
  private async applyProportionalDiscount(lines: any[], promotionContext: any): Promise<void> {
    const totalAmount = lines.reduce((sum, line) => sum + (line.unitPrice * line.quantity), 0);
    
    for (const line of lines) {
      const lineAmount = line.unitPrice * line.quantity;
      const proportion = lineAmount / totalAmount;
      const lineDiscount = Math.round(promotionContext.discountAmount * proportion * 100) / 100;
      
      line.unitPrice = Math.max(0, (lineAmount - lineDiscount) / line.quantity);
      line.metadata = {
        ...line.metadata,
        promotionDiscount: lineDiscount,
        promotionId: promotionContext.promotionId
      };

      console.log(`Proportional discount - Line ${line.lineRef}: ${lineDiscount}`);
    }
  }

  /**
   * Process gift card tax logic
   */
  private async processGiftCardTax(request: DigitalServicesTaxRequest): Promise<void> {
    if (!request.giftCardContext) return;

    const { giftCardContext } = request;
    console.log(`Processing gift card tax logic`);

    // Get gift card tax rules
    const rules = await this.getGiftCardTaxRules(request.destinationAddress.state);
    const rule = rules[0];
    if (!rule) return;

    if (giftCardContext.isGiftCardPurchase) {
      // Handle gift card purchase
      if (!rule.taxOnPurchase) {
        // Gift card purchases are not taxable
        for (const line of request.lines) {
          if (line.taxCategory === 'GIFT_CARD') {
            line.metadata = { ...line.metadata, giftCardPurchaseExempt: true };
            console.log(`Gift card purchase exempt from tax: ${line.lineRef}`);
          }
        }
      }
    }

    if (giftCardContext.isGiftCardRedemption) {
      // Handle gift card redemption
      if (rule.taxOnRedemption) {
        if (rule.purchaseJurisdictionApplies && giftCardContext.originalPurchaseJurisdiction) {
          // Use original purchase jurisdiction for tax calculation
          request.destinationAddress.state = giftCardContext.originalPurchaseJurisdiction;
          console.log(`Using original purchase jurisdiction: ${giftCardContext.originalPurchaseJurisdiction}`);
        }
      }
    }
  }

  /**
   * Process tip tax logic
   */
  private async processTipTax(request: DigitalServicesTaxRequest): Promise<void> {
    if (!request.tipContext) return;

    const { tipContext } = request;
    console.log(`Processing tip tax logic`);

    // Get tip tax rules
    const rules = await this.getTipDonationTaxRules(request.destinationAddress.state, 'tip');
    const rule = rules[0];
    if (!rule) return;

    // Process tip lines
    for (const line of request.lines) {
      if (line.taxCategory === 'VOLUNTARY_TIP') {
        if (rule.conditions.voluntaryTipsExempt && tipContext.isVoluntary) {
          // Voluntary tips are exempt
          line.metadata = { ...line.metadata, tipExempt: true };
          console.log(`Voluntary tip exempt from tax: ${line.lineRef}`);
        }

        // Handle platform tip fee
        if (tipContext.platformTipFee && rule.conditions.platformFeeTaxable) {
          // Platform fee is taxable
          const platformFeeLine = {
            lineRef: `${line.lineRef}_platform_fee`,
            sku: 'TIP_PLATFORM_FEE',
            taxCategory: 'PLATFORM_FEE',
            quantity: 1,
            unitPrice: tipContext.platformTipFee,
            metadata: { originalTipLineRef: line.lineRef }
          };
          request.lines.push(platformFeeLine);
          console.log(`Added taxable platform tip fee: ${tipContext.platformTipFee}`);
        }
      }
    }
  }

  /**
   * Process donation tax logic
   */
  private async processDonationTax(request: DigitalServicesTaxRequest): Promise<void> {
    if (!request.donationContext) return;

    const { donationContext } = request;
    console.log(`Processing donation tax logic`);

    // Get donation tax rules
    const rules = await this.getTipDonationTaxRules(request.destinationAddress.state, 'donation');
    const rule = rules[0];
    if (!rule) return;

    // Process donation lines
    for (const line of request.lines) {
      if (line.taxCategory === 'DONATION') {
        if (rule.conditions.charitableDonationsExempt && donationContext.isCharitable) {
          // Charitable donations are exempt
          line.metadata = { ...line.metadata, charitableDonationExempt: true };
          console.log(`Charitable donation exempt from tax: ${line.lineRef}`);
        }

        // Handle platform donation fee
        if (donationContext.platformDonationFee && rule.conditions.platformFeeTaxable) {
          // Platform fee is taxable
          const platformFeeLine = {
            lineRef: `${line.lineRef}_platform_fee`,
            sku: 'DONATION_PLATFORM_FEE',
            taxCategory: 'PLATFORM_FEE',
            quantity: 1,
            unitPrice: donationContext.platformDonationFee,
            metadata: { originalDonationLineRef: line.lineRef }
          };
          request.lines.push(platformFeeLine);
          console.log(`Added taxable platform donation fee: ${donationContext.platformDonationFee}`);
        }
      }
    }
  }

  /**
   * Calculate base tax using standard tax engine
   */
  private async calculateBaseTax(request: TaxCalculationRequest): Promise<TaxCalculationResult> {
    // This would call the main tax calculation engine
    // For now, return a mock implementation
    return {
      id: `calc_${Date.now()}`,
      quoteId: request.idempotencyKey,
      status: 'quoted',
      currency: 'USD',
      subtotalAmount: request.lines.reduce((sum, line) => sum + (line.unitPrice * line.quantity), 0),
      taxableAmount: request.lines.reduce((sum, line) => sum + (line.unitPrice * line.quantity), 0),
      taxAmount: 0, // Will be calculated
      totalAmount: 0, // Will be calculated
      destinationAddress: request.destinationAddress,
      jurisdictions: [],
      lines: [],
      marketplaceFacilitator: {
        isApplicable: true,
        fanzCollects: true,
        fanzRemits: true
      },
      confidence: 0.95,
      processingTimeMs: 0,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    } as TaxCalculationResult;
  }

  /**
   * Apply digital goods specific adjustments
   */
  private async applyDigitalGoodsAdjustments(
    result: TaxCalculationResult,
    request: DigitalServicesTaxRequest
  ): Promise<TaxCalculationResult> {
    // Apply any digital goods specific tax adjustments
    console.log('Applying digital goods adjustments');
    return result;
  }

  /**
   * Apply exemptions to the calculation result
   */
  private async applyExemptions(
    result: TaxCalculationResult,
    request: DigitalServicesTaxRequest
  ): Promise<TaxCalculationResult> {
    if (!request.customer?.id) return result;

    // Check for exemptions
    for (const line of result.lines) {
      const exemptionRequest: ExemptionValidationRequest = {
        userId: request.customer.id,
        jurisdictionId: line.jurisdictionId,
        productCategoryId: line.productCategoryId,
        transactionAmount: line.lineAmount,
        transactionDate: new Date()
      };

      const exemptionResult = await this.exemptionService.validateExemption(exemptionRequest);
      
      if (exemptionResult.isExempt && exemptionResult.exemptionAmount > 0) {
        const originalTaxAmount = line.taxAmount;
        line.taxAmount = Math.max(0, line.taxAmount - exemptionResult.exemptionAmount);
        
        line.metadata = {
          ...line.metadata,
          exemptionApplied: true,
          exemptionAmount: exemptionResult.exemptionAmount,
          exemptionType: exemptionResult.exemptionType,
          certificateId: exemptionResult.certificateId
        };

        console.log(`Applied exemption to line ${line.lineRef}: ${originalTaxAmount} -> ${line.taxAmount}`);
      }
    }

    // Recalculate totals
    result.taxAmount = result.lines.reduce((sum, line) => sum + line.taxAmount, 0);
    result.totalAmount = result.subtotalAmount + result.taxAmount;

    return result;
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private getDaysInBillingPeriod(period: string): number {
    switch (period) {
      case 'daily': return 1;
      case 'weekly': return 7;
      case 'monthly': return 30;
      case 'quarterly': return 90;
      case 'annually': return 365;
      default: return 30;
    }
  }

  private async getOriginalSubscriptionJurisdiction(subscriptionId: string): Promise<string> {
    // Query database for original subscription jurisdiction
    const result = await this.db.query(`
      SELECT original_jurisdiction FROM subscriptions WHERE id = $1
    `, [subscriptionId]);
    
    return result.rows[0]?.original_jurisdiction || 'CA';
  }

  private async getTaxRateForLine(line: any, jurisdiction: string): Promise<number> {
    // Get tax rate for specific line and jurisdiction
    // Mock implementation
    return 0.0725;
  }

  private async isLineTaxable(line: any, jurisdiction: string): Promise<boolean> {
    // Check if line is taxable in jurisdiction
    // Mock implementation
    return !['VOLUNTARY_TIP', 'DONATION'].includes(line.taxCategory);
  }

  private async getHighestTaxRate(lines: any[], jurisdiction: string): Promise<number> {
    // Get highest tax rate among all lines
    // Mock implementation
    return 0.0725;
  }

  private async calculateBlendedTaxRate(lines: any[], jurisdiction: string): Promise<number> {
    // Calculate weighted average tax rate
    // Mock implementation
    return 0.0650;
  }

  // Database query methods (mock implementations)
  private async getSubscriptionTaxRules(jurisdiction: string, category: string): Promise<SubscriptionTaxRule[]> {
    return [{
      jurisdictionId: jurisdiction,
      productCategoryId: category,
      taxOnRenewal: 'address_change',
      useCurrentAddress: true,
      useOriginalAddress: false,
      prorateFirstPeriod: true,
      gracePeriodTaxable: false,
      midCycleCancellationRefundable: true,
      upgradeDowngradeTaxDiff: true,
      conditions: {
        minimumSubscriptionDays: 1,
        maximumRenewalGap: 30,
        requiresActiveStatus: true
      }
    }];
  }

  private async getBundleTaxRules(jurisdiction: string, bundleType: string): Promise<BundleTaxRule[]> {
    return [{
      jurisdictionId: jurisdiction,
      bundleType,
      allocationMethod: 'proportional',
      taxMixedBundle: 'separately',
      conditions: {
        requiresSeparateLineItems: true,
        allowsPartialTaxability: true,
        appliesToDigitalOnly: false
      }
    }];
  }

  private async getPromotionTaxRules(jurisdiction: string, promotionType: string): Promise<PromotionTaxRule[]> {
    return [{
      jurisdictionId: jurisdiction,
      promotionType,
      discountTaxability: 'follows_product',
      allocationMethod: 'proportional',
      conditions: {
        appliesToTax: false,
        reducesBase: true,
        stacksWithOtherPromotions: true
      }
    }];
  }

  private async getGiftCardTaxRules(jurisdiction: string): Promise<GiftCardTaxRule[]> {
    return [{
      jurisdictionId: jurisdiction,
      taxOnPurchase: false,
      taxOnRedemption: true,
      purchaseJurisdictionApplies: false,
      redemptionJurisdictionApplies: true,
      conditions: {
        expirationPeriodMonths: 24,
        requiresOriginalPurchaseData: false,
        allowsCrossJurisdictionRedemption: true
      }
    }];
  }

  private async getTipDonationTaxRules(jurisdiction: string, itemType: 'tip' | 'donation'): Promise<TipDonationTaxRule[]> {
    return [{
      jurisdictionId: jurisdiction,
      itemType,
      taxability: itemType === 'tip' ? 'conditional' : 'conditional',
      conditions: {
        voluntaryTipsExempt: true,
        charitableDonationsExempt: true,
        platformFeeTaxable: true,
        minimumAmountExemption: 0,
        maxExemptionPerTransaction: undefined
      }
    }];
  }

  private async applyHighestTaxFirstDiscount(lines: any[], promotionContext: any, jurisdiction: string): Promise<void> {
    // Sort lines by tax rate (highest first) and apply discount
    const linesWithRates = await Promise.all(
      lines.map(async (line) => {
        const rate = await this.getTaxRateForLine(line, jurisdiction);
        return { line, rate };
      })
    );

    linesWithRates.sort((a, b) => b.rate - a.rate);

    let remainingDiscount = promotionContext.discountAmount;
    
    for (const { line } of linesWithRates) {
      if (remainingDiscount <= 0) break;

      const lineAmount = line.unitPrice * line.quantity;
      const lineDiscount = Math.min(lineAmount, remainingDiscount);
      
      line.unitPrice = Math.max(0, (lineAmount - lineDiscount) / line.quantity);
      line.metadata = {
        ...line.metadata,
        promotionDiscount: lineDiscount,
        promotionId: promotionContext.promotionId
      };

      remainingDiscount -= lineDiscount;
      console.log(`Highest tax first discount - Line ${line.lineRef}: ${lineDiscount}`);
    }
  }

  private async applyLowestTaxFirstDiscount(lines: any[], promotionContext: any, jurisdiction: string): Promise<void> {
    // Sort lines by tax rate (lowest first) and apply discount
    const linesWithRates = await Promise.all(
      lines.map(async (line) => {
        const rate = await this.getTaxRateForLine(line, jurisdiction);
        return { line, rate };
      })
    );

    linesWithRates.sort((a, b) => a.rate - b.rate);

    let remainingDiscount = promotionContext.discountAmount;
    
    for (const { line } of linesWithRates) {
      if (remainingDiscount <= 0) break;

      const lineAmount = line.unitPrice * line.quantity;
      const lineDiscount = Math.min(lineAmount, remainingDiscount);
      
      line.unitPrice = Math.max(0, (lineAmount - lineDiscount) / line.quantity);
      line.metadata = {
        ...line.metadata,
        promotionDiscount: lineDiscount,
        promotionId: promotionContext.promotionId
      };

      remainingDiscount -= lineDiscount;
      console.log(`Lowest tax first discount - Line ${line.lineRef}: ${lineDiscount}`);
    }
  }
}

export default DigitalServicesTaxEngine;
export { 
  DigitalServicesTaxRequest,
  SubscriptionTaxRule,
  BundleTaxRule,
  PromotionTaxRule,
  TipDonationTaxRule,
  GiftCardTaxRule
};