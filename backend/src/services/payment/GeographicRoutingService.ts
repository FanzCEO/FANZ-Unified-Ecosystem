import { PaymentRequest, PayoutRequest } from '..REDACTED_AWS_SECRET_KEYocessor';
import { logger } from '../../utils/logger';

interface ProcessorRoutingRule {
  processor: string;
  priority: number;
  regions: string[];
  transactionTypes: string[];
  minAmount: number;
  maxAmount: number;
  isEnabled: boolean;
  environment: string;
  conditions?: {
    currencies?: string[];
    excludeCountries?: string[];
    requiresCompliance?: boolean;
    adultContentSupport?: boolean;
  };
}

interface RoutingDecision {
  primaryProcessor: string;
  secondaryProcessor?: string;
  tertiaryProcessor?: string;
  reason: string;
  confidence: number; // 0-1 scale
  metadata: Record<string, any>;
}

export class GeographicRoutingService {
  private routingRules: ProcessorRoutingRule[];
  private countryToRegionMap: Record<string, string>;

  constructor() {
    this.initializeRoutingRules();
    this.initializeCountryMapping();
  }

  /**
   * Select the best payment processor based on geographic and transaction criteria
   */
  async routePaymentProcessor(request: PaymentRequest): Promise<RoutingDecision> {
    const userCountry = request.customerInfo?.country || 'US';
    const region = this.getRegionForCountry(userCountry);
    const amount = request.amount;
    const transactionType = request.transactionType || 'one_time';
    const currency = request.currency;

    logger.info('Routing payment processor', {
      userCountry,
      region,
      amount,
      transactionType,
      currency
    });

    // Get applicable processors based on routing rules
    const applicableProcessors = this.getApplicableProcessors({
      region,
      amount,
      transactionType,
      currency,
      country: userCountry,
      isAdultContent: request.contentType === 'adult'
    });

    if (applicableProcessors.length === 0) {
      logger.warn('No applicable processors found, falling back to mock');
      return {
        primaryProcessor: 'mock',
        reason: 'No processors matched criteria - using fallback',
        confidence: 0.1,
        metadata: { fallbackUsed: true, originalCountry: userCountry }
      };
    }

    // Apply intelligent routing logic
    const routingDecision = this.applyIntelligentRouting(
      applicableProcessors,
      {
        userCountry,
        region,
        amount,
        transactionType,
        currency,
        isSubscription: transactionType === 'subscription',
        isHighValue: amount > 100,
        isAdultContent: request.contentType === 'adult'
      }
    );

    logger.info('Processor routing decision', routingDecision);
    return routingDecision;
  }

  /**
   * Select the best payout processor based on geographic and payout criteria
   */
  async routePayoutProcessor(request: PayoutRequest): Promise<RoutingDecision> {
    const recipientCountry = request.destination.details?.country || 'US';
    const region = this.getRegionForCountry(recipientCountry);
    const amount = request.amount;
    const currency = request.currency;
    const payoutMethod = request.destination.type;

    logger.info('Routing payout processor', {
      recipientCountry,
      region,
      amount,
      currency,
      payoutMethod
    });

    // Payout-specific routing rules
    const payoutProcessors = this.getPayoutProcessors({
      region,
      amount,
      currency,
      country: recipientCountry,
      payoutMethod
    });

    if (payoutProcessors.length === 0) {
      logger.warn('No payout processors available');
      return {
        primaryProcessor: 'mock',
        reason: 'No payout processors available - using fallback',
        confidence: 0.1,
        metadata: { fallbackUsed: true, payoutMethod }
      };
    }

    return this.applyPayoutRouting(payoutProcessors, {
      recipientCountry,
      region,
      amount,
      currency,
      payoutMethod,
      isHighValue: amount > 1000
    });
  }

  /**
   * Get processor availability and health status for routing decisions
   */
  async getProcessorAvailability(): Promise<Record<string, boolean>> {
    // This would integrate with processor health monitoring
    // For now, return static availability based on environment
    const availability: Record<string, boolean> = {};
    
    for (const rule of this.routingRules) {
      if (rule.environment === process.env.NODE_ENV || rule.environment === 'all') {
        availability[rule.processor] = rule.isEnabled;
      }
    }

    return availability;
  }

  /**
   * Update routing rules dynamically (for A/B testing or configuration changes)
   */
  updateRoutingRules(newRules: Partial<ProcessorRoutingRule>[]): void {
    // Update or add routing rules
    for (const newRule of newRules) {
      if (newRule.processor) {
        const existingRuleIndex = this.routingRules.findIndex(
          rule => rule.processor === newRule.processor
        );

        if (existingRuleIndex >= 0) {
          this.routingRules[existingRuleIndex] = {
            ...this.routingRules[existingRuleIndex],
            ...newRule
          };
        } else if (this.isCompleteRule(newRule)) {
          this.routingRules.push(newRule as ProcessorRoutingRule);
        }
      }
    }

    // Re-sort rules by priority
    this.routingRules.sort((a, b) => a.priority - b.priority);
    logger.info('Routing rules updated', { ruleCount: this.routingRules.length });
  }

  // Private methods

  private initializeRoutingRules(): void {
    this.routingRules = [
      // CCBill - Primary for North America and Europe
      {
        processor: 'ccbill',
        priority: 5,
        regions: ['NORTH_AMERICA', 'EUROPE', 'OCEANIA'],
        transactionTypes: ['subscription', 'one_time', 'tip'],
        minAmount: 1.00,
        maxAmount: 1000.00,
        isEnabled: true,
        environment: 'all',
        conditions: {
          currencies: ['USD', 'EUR', 'CAD', 'GBP', 'AUD'],
          adultContentSupport: true,
          requiresCompliance: true
        }
      },

      // Segpay - Primary for Europe, secondary for others
      {
        processor: 'segpay',
        priority: 10,
        regions: ['EUROPE'],
        transactionTypes: ['subscription', 'one_time'],
        minAmount: 1.00,
        maxAmount: 500.00,
        isEnabled: true,
        environment: 'all',
        conditions: {
          currencies: ['EUR', 'USD', 'GBP'],
          adultContentSupport: true,
          requiresCompliance: true
        }
      },

      // Segpay - Fallback for North America
      {
        processor: 'segpay',
        priority: 20,
        regions: ['NORTH_AMERICA'],
        transactionTypes: ['subscription', 'one_time'],
        minAmount: 1.00,
        maxAmount: 300.00,
        isEnabled: true,
        environment: 'all',
        conditions: {
          currencies: ['USD', 'CAD'],
          adultContentSupport: true
        }
      },

      // Paxum - Primary for payouts globally
      {
        processor: 'paxum',
        priority: 5,
        regions: ['GLOBAL'],
        transactionTypes: ['payout', 'withdrawal'],
        minAmount: 10.00,
        maxAmount: 10000.00,
        isEnabled: true,
        environment: 'all',
        conditions: {
          currencies: ['USD', 'EUR', 'CAD', 'GBP'],
          adultContentSupport: true
        }
      },

      // Mock processor for development and fallback
      {
        processor: 'mock',
        priority: 1000,
        regions: ['GLOBAL'],
        transactionTypes: ['subscription', 'one_time', 'tip', 'payout', 'withdrawal'],
        minAmount: 0.01,
        maxAmount: 99999.99,
        isEnabled: true,
        environment: 'all'
      }
    ];
  }

  private initializeCountryMapping(): void {
    this.countryToRegionMap = {
      // North America
      'US': 'NORTH_AMERICA',
      'CA': 'NORTH_AMERICA',
      'MX': 'NORTH_AMERICA',

      // Europe
      'GB': 'EUROPE',
      'DE': 'EUROPE',
      'FR': 'EUROPE',
      'IT': 'EUROPE',
      'ES': 'EUROPE',
      'NL': 'EUROPE',
      'BE': 'EUROPE',
      'CH': 'EUROPE',
      'AT': 'EUROPE',
      'SE': 'EUROPE',
      'NO': 'EUROPE',
      'DK': 'EUROPE',
      'FI': 'EUROPE',
      'PL': 'EUROPE',
      'CZ': 'EUROPE',
      'HU': 'EUROPE',
      'PT': 'EUROPE',
      'GR': 'EUROPE',
      'IE': 'EUROPE',

      // Asia-Pacific
      'AU': 'OCEANIA',
      'NZ': 'OCEANIA',
      'JP': 'ASIA',
      'SG': 'ASIA',
      'HK': 'ASIA',
      'KR': 'ASIA',
      'TH': 'ASIA',
      'MY': 'ASIA',

      // Latin America
      'BR': 'LATIN_AMERICA',
      'AR': 'LATIN_AMERICA',
      'CL': 'LATIN_AMERICA',
      'CO': 'LATIN_AMERICA',
      'PE': 'LATIN_AMERICA'
    };
  }

  private getRegionForCountry(countryCode: string): string {
    return this.countryToRegionMap[countryCode.toUpperCase()] || 'OTHER';
  }

  private getApplicableProcessors(criteria: {
    region: string;
    amount: number;
    transactionType: string;
    currency: string;
    country: string;
    isAdultContent?: boolean;
  }): ProcessorRoutingRule[] {
    return this.routingRules.filter(rule => {
      // Check if processor is enabled
      if (!rule.isEnabled) return false;

      // Check environment
      if (rule.environment !== 'all' && rule.environment !== process.env.NODE_ENV) {
        return false;
      }

      // Check regions
      if (!rule.regions.includes('GLOBAL') && !rule.regions.includes(criteria.region)) {
        return false;
      }

      // Check transaction types
      if (!rule.transactionTypes.includes(criteria.transactionType) && 
          !rule.transactionTypes.includes('all')) {
        return false;
      }

      // Check amount limits
      if (criteria.amount < rule.minAmount || criteria.amount > rule.maxAmount) {
        return false;
      }

      // Check additional conditions
      if (rule.conditions) {
        // Currency support
        if (rule.conditions.currencies && 
            !rule.conditions.currencies.includes(criteria.currency)) {
          return false;
        }

        // Excluded countries
        if (rule.conditions.excludeCountries && 
            rule.conditions.excludeCountries.includes(criteria.country)) {
          return false;
        }

        // Adult content support requirement
        if (criteria.isAdultContent && !rule.conditions.adultContentSupport) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => a.priority - b.priority);
  }

  private getPayoutProcessors(criteria: {
    region: string;
    amount: number;
    currency: string;
    country: string;
    payoutMethod?: string;
  }): ProcessorRoutingRule[] {
    return this.getApplicableProcessors({
      ...criteria,
      transactionType: 'payout',
      isAdultContent: true // Assume adult content for creator payouts
    });
  }

  private applyIntelligentRouting(
    processors: ProcessorRoutingRule[],
    context: {
      userCountry: string;
      region: string;
      amount: number;
      transactionType: string;
      currency: string;
      isSubscription: boolean;
      isHighValue: boolean;
      isAdultContent?: boolean;
    }
  ): RoutingDecision {
    // Primary routing logic
    let primaryProcessor = processors[0].processor;
    let confidence = 0.8;
    let reason = `Selected based on priority and region (${context.region})`;

    // Adjust for specific scenarios
    if (context.isSubscription) {
      // Prefer CCBill for all subscriptions, especially in North America
      const ccbillRule = processors.find(p => p.processor === 'ccbill');
      if (ccbillRule) {
        primaryProcessor = 'ccbill';
        confidence = context.amount > 50 ? 0.9 : 0.85;
        reason = context.amount > 50 ? 'CCBill preferred for high-value subscriptions' : 'CCBill preferred for subscriptions';
      }
    } else if (context.region === 'EUROPE') {
      // Prefer Segpay for European transactions
      const segpayRule = processors.find(p => p.processor === 'segpay');
      if (segpayRule) {
        primaryProcessor = 'segpay';
        confidence = 0.85;
        reason = 'Segpay preferred for European market';
      }
    } else if (context.amount < 10) {
      // For small amounts, prefer processors with lower fixed fees
      const lowFeeProcessors = processors.filter(p => 
        ['segpay', 'ccbill'].includes(p.processor)
      );
      if (lowFeeProcessors.length > 0) {
        primaryProcessor = lowFeeProcessors[0].processor;
        reason = 'Selected processor with favorable fee structure for small amounts';
      }
    }

    // Select secondary and tertiary processors
    const remainingProcessors = processors.filter(p => p.processor !== primaryProcessor);
    const secondaryProcessor = remainingProcessors.length > 0 ? remainingProcessors[0].processor : undefined;
    const tertiaryProcessor = remainingProcessors.length > 1 ? remainingProcessors[1].processor : undefined;

    return {
      primaryProcessor,
      secondaryProcessor,
      tertiaryProcessor,
      reason,
      confidence,
      metadata: {
        region: context.region,
        country: context.userCountry,
        processorCount: processors.length,
        routingFactors: {
          isSubscription: context.isSubscription,
          isHighValue: context.isHighValue,
          amount: context.amount,
          currency: context.currency
        }
      }
    };
  }

  private applyPayoutRouting(
    processors: ProcessorRoutingRule[],
    context: {
      recipientCountry: string;
      region: string;
      amount: number;
      currency: string;
      payoutMethod?: string;
      isHighValue: boolean;
    }
  ): RoutingDecision {
    // Paxum is typically the primary choice for creator payouts
    let primaryProcessor = 'paxum';
    let confidence = 0.9;
    let reason = 'Paxum is industry standard for adult content creator payouts';

    // Check if Paxum is available in the processor list
    const paxumAvailable = processors.some(p => p.processor === 'paxum');
    if (!paxumAvailable && processors.length > 0) {
      primaryProcessor = processors[0].processor;
      confidence = 0.7;
      reason = 'Paxum not available, using best alternative';
    }

    // For high-value payouts, prefer bank transfers if available
    if (context.isHighValue && context.payoutMethod === 'bank_transfer') {
      confidence = 0.95;
      reason = 'Bank transfer preferred for high-value payouts';
    }

    const remainingProcessors = processors.filter(p => p.processor !== primaryProcessor);

    return {
      primaryProcessor,
      secondaryProcessor: remainingProcessors.length > 0 ? remainingProcessors[0].processor : undefined,
      reason,
      confidence,
      metadata: {
        region: context.region,
        country: context.recipientCountry,
        payoutMethod: context.payoutMethod,
        isHighValue: context.isHighValue,
        amount: context.amount
      }
    };
  }

  private isCompleteRule(rule: Partial<ProcessorRoutingRule>): rule is ProcessorRoutingRule {
    return !!(
      rule.processor &&
      rule.priority !== undefined &&
      rule.regions &&
      rule.transactionTypes &&
      rule.minAmount !== undefined &&
      rule.maxAmount !== undefined &&
      rule.isEnabled !== undefined &&
      rule.environment
    );
  }
}