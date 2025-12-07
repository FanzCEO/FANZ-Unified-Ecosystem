// FanzProtect Tax Compliance Service
// Wyoming-based company serving nationwide creators

import { z } from 'zod';

// Tax jurisdiction data
export const TAX_JURISDICTIONS = {
  // No sales tax states
  NO_TAX_STATES: ['WY', 'AK', 'DE', 'MT', 'NH', 'OR'],
  
  // Economic nexus thresholds by state
  NEXUS_THRESHOLDS: {
    CA: { salesThreshold: 500000, transactionThreshold: null, rate: 0.0975 }, // Average CA rate
    TX: { salesThreshold: 500000, transactionThreshold: null, rate: 0.0725 },
    FL: { salesThreshold: 100000, transactionThreshold: null, rate: 0.0725 },
    NY: { salesThreshold: 500000, transactionThreshold: 100, rate: 0.08 },
    IL: { salesThreshold: 100000, transactionThreshold: 200, rate: 0.0875 },
    PA: { salesThreshold: 100000, transactionThreshold: null, rate: 0.07 },
    OH: { salesThreshold: 100000, transactionThreshold: 200, rate: 0.0675 },
    GA: { salesThreshold: 100000, transactionThreshold: 200, rate: 0.065 },
    NC: { salesThreshold: 100000, transactionThreshold: 200, rate: 0.0625 },
    MI: { salesThreshold: 100000, transactionThreshold: 200, rate: 0.06 },
    // Add more states as needed
  } as const,
  
  // Legal service tax exemptions by state
  LEGAL_SERVICE_EXEMPTIONS: {
    CA: { dmca: true, legal_advice: true, document_prep: false },
    TX: { dmca: true, legal_advice: true, document_prep: false },
    FL: { dmca: true, legal_advice: true, document_prep: true },
    NY: { dmca: true, legal_advice: true, document_prep: false },
    // Wyoming (home state) - no sales tax
    WY: { dmca: true, legal_advice: true, document_prep: true },
  } as const
};

// Service type definitions
export const ServiceType = z.enum([
  'dmca_takedown',
  'legal_consultation', 
  'court_filing',
  'document_generation',
  'evidence_storage',
  'case_management',
  'legal_research',
  'cease_desist'
]);

// Customer location schema
export const CustomerLocation = z.object({
  state: z.string().length(2),
  city: z.string(),
  zipCode: z.string(),
  country: z.string().default('US')
});

// Service pricing schema
export const ServicePricing = z.object({
  serviceType: ServiceType,
  basePrice: z.number().min(0),
  customerLocation: CustomerLocation,
  billingPeriod: z.enum(['monthly', 'quarterly', 'annual', 'one_time'])
});

// Tax calculation result
export const TaxCalculation = z.object({
  basePrice: z.number(),
  taxRate: z.number(),
  taxAmount: z.number(),
  totalPrice: z.number(),
  taxJurisdiction: z.string(),
  exemptionApplied: z.boolean(),
  exemptionReason: z.string().optional(),
  nexusRequired: z.boolean(),
  complianceNotes: z.array(z.string())
});

export type ServiceTypeEnum = z.infer<typeof ServiceType>;
export type CustomerLocationData = z.infer<typeof CustomerLocation>;
export type ServicePricingData = z.infer<typeof ServicePricing>;
export type TaxCalculationResult = z.infer<typeof TaxCalculation>;

export class FanzProtectTaxCalculator {
  private wyomingAnnualRevenue = 0; // Track for nexus thresholds
  
  constructor(private currentAnnualRevenue: number = 0) {
    this.wyomingAnnualRevenue = currentAnnualRevenue;
  }

  /**
   * Calculate tax for FanzProtect legal services
   */
  async calculateTax(pricing: ServicePricingData): Promise<TaxCalculationResult> {
    const { serviceType, basePrice, customerLocation } = pricing;
    const state = customerLocation.state.toUpperCase();

    // Wyoming home state - no sales tax
    if (state === 'WY') {
      return this.createNoTaxResult(basePrice, 'Wyoming home state - no sales tax');
    }

    // Check if state has no sales tax
    if (TAX_JURISDICTIONS.NO_TAX_STATES.includes(state)) {
      return this.createNoTaxResult(basePrice, `${state} has no state sales tax`);
    }

    // Check for legal service exemptions
    const exemption = this.checkLegalServiceExemption(state, serviceType);
    if (exemption.exempt) {
      return this.createNoTaxResult(basePrice, exemption.reason);
    }

    // Check economic nexus
    const nexusCheck = this.checkEconomicNexus(state);
    if (!nexusCheck.hasNexus) {
      return this.createNoTaxResult(basePrice, `No economic nexus in ${state}`);
    }

    // Calculate tax for taxable services
    const jurisdiction = TAX_JURISDICTIONS.NEXUS_THRESHOLDS[state as keyof typeof TAX_JURISDICTIONS.NEXUS_THRESHOLDS];
    if (!jurisdiction) {
      return this.createNoTaxResult(basePrice, `Tax rates not configured for ${state}`);
    }

    const taxRate = jurisdiction.rate;
    const taxAmount = basePrice * taxRate;
    const totalPrice = basePrice + taxAmount;

    return {
      basePrice,
      taxRate,
      taxAmount: Math.round(taxAmount * 100) / 100, // Round to cents
      totalPrice: Math.round(totalPrice * 100) / 100,
      taxJurisdiction: state,
      exemptionApplied: false,
      nexusRequired: true,
      complianceNotes: [
        `${state} sales tax applied at ${(taxRate * 100).toFixed(2)}%`,
        `Economic nexus threshold met in ${state}`,
        'Legal service partially taxable based on automation component'
      ]
    };
  }

  /**
   * Check if legal service is exempt from sales tax
   */
  private checkLegalServiceExemption(state: string, serviceType: ServiceTypeEnum): {
    exempt: boolean;
    reason: string;
  } {
    const stateExemptions = TAX_JURISDICTIONS.LEGAL_SERVICE_EXEMPTIONS[
      state as keyof typeof TAX_JURISDICTIONS.LEGAL_SERVICE_EXEMPTIONS
    ];

    if (!stateExemptions) {
      // Default to conservative approach - apply tax if unknown
      return { exempt: false, reason: 'State exemptions not configured' };
    }

    switch (serviceType) {
      case 'dmca_takedown':
        return {
          exempt: stateExemptions.dmca,
          reason: stateExemptions.dmca 
            ? 'DMCA takedown classified as legal services - exempt'
            : 'DMCA automation component may be taxable'
        };

      case 'legal_consultation':
      case 'court_filing':
      case 'legal_research':
      case 'cease_desist':
        return {
          exempt: stateExemptions.legal_advice,
          reason: stateExemptions.legal_advice
            ? 'Professional legal services - exempt from sales tax'
            : 'Legal services taxable in this jurisdiction'
        };

      case 'document_generation':
        return {
          exempt: stateExemptions.document_prep,
          reason: stateExemptions.document_prep
            ? 'Document preparation by attorney - exempt'
            : 'Automated document generation - software service taxable'
        };

      case 'evidence_storage':
      case 'case_management':
        // These are more like software services
        return {
          exempt: false,
          reason: 'Digital services generally subject to sales tax'
        };

      default:
        return {
          exempt: false,
          reason: 'Service type not classified for tax exemption'
        };
    }
  }

  /**
   * Check if we have economic nexus in a state
   */
  private checkEconomicNexus(state: string): {
    hasNexus: boolean;
    reason: string;
  } {
    const threshold = TAX_JURISDICTIONS.NEXUS_THRESHOLDS[
      state as keyof typeof TAX_JURISDICTIONS.NEXUS_THRESHOLDS
    ];

    if (!threshold) {
      return { hasNexus: false, reason: 'No nexus thresholds configured' };
    }

    // For new platform, conservative approach - assume we'll hit thresholds
    // In production, this would check actual revenue data
    if (this.wyomingAnnualRevenue >= threshold.salesThreshold) {
      return { hasNexus: true, reason: 'Sales threshold exceeded' };
    }

    // If transaction threshold exists and we're a growing platform
    if (threshold.transactionThreshold && this.wyomingAnnualRevenue > 50000) {
      return { hasNexus: true, reason: 'Likely to exceed transaction threshold' };
    }

    return { hasNexus: false, reason: 'Below economic nexus thresholds' };
  }

  /**
   * Create no-tax result
   */
  private createNoTaxResult(basePrice: number, reason: string): TaxCalculationResult {
    return {
      basePrice,
      taxRate: 0,
      taxAmount: 0,
      totalPrice: basePrice,
      taxJurisdiction: 'WY',
      exemptionApplied: true,
      exemptionReason: reason,
      nexusRequired: false,
      complianceNotes: [reason]
    };
  }

  /**
   * Get service pricing with tax for FanzProtect tiers
   */
  async getFanzProtectPricing(
    tier: 'basic' | 'professional' | 'enterprise',
    customerLocation: CustomerLocationData
  ): Promise<{
    tier: string;
    services: Array<{
      service: string;
      pricing: TaxCalculationResult;
    }>;
    monthlyTotal: TaxCalculationResult;
  }> {
    const tierPricing = {
      basic: {
        dmca_takedown: 29.00,
        case_management: 0, // Included
        document_generation: 0 // Included
      },
      professional: {
        dmca_takedown: 49.00,
        legal_consultation: 25.00,
        evidence_storage: 15.00,
        case_management: 10.00
      },
      enterprise: {
        dmca_takedown: 99.00,
        legal_consultation: 50.00,
        court_filing: 75.00,
        evidence_storage: 25.00,
        case_management: 20.00,
        legal_research: 40.00
      }
    };

    const services = tierPricing[tier];
    const servicePricings: Array<{
      service: string;
      pricing: TaxCalculationResult;
    }> = [];

    let totalBase = 0;
    let totalTax = 0;

    for (const [serviceType, basePrice] of Object.entries(services)) {
      if (basePrice > 0) {
        const pricing = await this.calculateTax({
          serviceType: serviceType as ServiceTypeEnum,
          basePrice,
          customerLocation,
          billingPeriod: 'monthly'
        });

        servicePricings.push({
          service: serviceType,
          pricing
        });

        totalBase += pricing.basePrice;
        totalTax += pricing.taxAmount;
      }
    }

    const monthlyTotal: TaxCalculationResult = {
      basePrice: totalBase,
      taxRate: totalBase > 0 ? totalTax / totalBase : 0,
      taxAmount: totalTax,
      totalPrice: totalBase + totalTax,
      taxJurisdiction: customerLocation.state,
      exemptionApplied: totalTax === 0,
      nexusRequired: totalTax > 0,
      complianceNotes: [`Total ${tier} tier monthly pricing for ${customerLocation.state}`]
    };

    return {
      tier,
      services: servicePricings,
      monthlyTotal
    };
  }
}

// Tax reporting utilities
export class TaxReportingService {
  /**
   * Generate state tax liability report
   */
  static generateStateTaxReport(transactions: Array<{
    state: string;
    taxAmount: number;
    baseAmount: number;
    date: Date;
  }>) {
    const stateReports = new Map<string, {
      totalSales: number;
      totalTax: number;
      transactionCount: number;
    }>();

    transactions.forEach(tx => {
      const existing = stateReports.get(tx.state) || {
        totalSales: 0,
        totalTax: 0,
        transactionCount: 0
      };

      existing.totalSales += tx.baseAmount;
      existing.totalTax += tx.taxAmount;
      existing.transactionCount += 1;

      stateReports.set(tx.state, existing);
    });

    return Object.fromEntries(stateReports);
  }

  /**
   * Check nexus status for all states
   */
  static checkNexusStatus(annualRevenue: number, transactionCounts: Record<string, number>) {
    const nexusStatus: Record<string, boolean> = {};

    Object.entries(TAX_JURISDICTIONS.NEXUS_THRESHOLDS).forEach(([state, threshold]) => {
      const meetsRevenueThreshold = annualRevenue >= threshold.salesThreshold;
      const meetsTransactionThreshold = threshold.transactionThreshold 
        ? (transactionCounts[state] || 0) >= threshold.transactionThreshold
        : true;

      nexusStatus[state] = meetsRevenueThreshold && meetsTransactionThreshold;
    });

    return nexusStatus;
  }
}