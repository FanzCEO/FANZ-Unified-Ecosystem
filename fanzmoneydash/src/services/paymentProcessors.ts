/**
 * Multi-Processor Payment Gateway
 * Unified interface for 20+ payment processors
 */

export type ProcessorType =
  | 'ccbill'
  | 'stripe'
  | 'paypal'
  | 'square'
  | 'coinbase'
  | 'paxum'
  | 'segpay'
  | 'epoch'
  | 'verotel'
  | 'payoneer'
  | 'skrill'
  | 'neteller'
  | 'cryptocurrency'
  | 'applepay'
  | 'googlepay'
  | 'amazonpay'
  | 'alipay'
  | 'wechatpay'
  | 'venmo'
  | 'cashapp';

export type PaymentMethod =
  | 'credit_card'
  | 'debit_card'
  | 'crypto'
  | 'wallet'
  | 'bank_transfer'
  | 'buy_now_pay_later';

export interface PaymentProcessor {
  id: ProcessorType;
  name: string;
  displayName: string;
  icon: string;
  supportedMethods: PaymentMethod[];
  supportedCurrencies: string[];
  fees: {
    percentage: number;
    fixed_cents: number;
    minimum_cents: number;
  };
  limits: {
    min_transaction_cents: number;
    max_transaction_cents: number;
    daily_limit_cents?: number;
  };
  features: {
    instant: boolean;
    recurring: boolean;
    refunds: boolean;
    chargeback_protection: boolean;
    adult_friendly: boolean;
  };
  discreet_billing: {
    enabled: boolean;
    descriptor: string;
    descriptor_options?: string[];
  };
  region: string[];
  enabled: boolean;
  priority: number; // Lower = higher priority for auto-selection
}

export const PAYMENT_PROCESSORS: PaymentProcessor[] = [
  // Adult-Friendly Processors
  {
    id: 'ccbill',
    name: 'CCBill',
    displayName: 'CCBill',
    icon: '/icons/ccbill.svg',
    supportedMethods: ['credit_card', 'debit_card'],
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
    fees: {
      percentage: 10.5,
      fixed_cents: 0,
      minimum_cents: 50,
    },
    limits: {
      min_transaction_cents: 500,
      max_transaction_cents: 10000000,
    },
    features: {
      instant: true,
      recurring: true,
      refunds: true,
      chargeback_protection: true,
      adult_friendly: true,
    },
    discreet_billing: {
      enabled: true,
      descriptor: 'GH Digital Services',
      descriptor_options: ['GH Commerce', 'GH Digital Services', 'GH Gift Purchase', 'GH Lifestyle Services'],
    },
    region: ['US', 'EU', 'UK', 'CA', 'AU', 'WORLDWIDE'],
    enabled: true,
    priority: 1,
  },
  {
    id: 'segpay',
    name: 'Segpay',
    displayName: 'Segpay',
    icon: '/icons/segpay.svg',
    supportedMethods: ['credit_card', 'debit_card'],
    supportedCurrencies: ['USD', 'EUR', 'GBP'],
    fees: {
      percentage: 12.0,
      fixed_cents: 0,
      minimum_cents: 50,
    },
    limits: {
      min_transaction_cents: 500,
      max_transaction_cents: 5000000,
    },
    features: {
      instant: true,
      recurring: true,
      refunds: true,
      chargeback_protection: true,
      adult_friendly: true,
    },
    discreet_billing: {
      enabled: true,
      descriptor: 'SP Digital Media',
      descriptor_options: ['SP Digital Media', 'SP Online Services', 'SP Entertainment'],
    },
    region: ['US', 'EU', 'UK'],
    enabled: true,
    priority: 2,
  },
  {
    id: 'epoch',
    name: 'Epoch',
    displayName: 'Epoch',
    icon: '/icons/epoch.svg',
    supportedMethods: ['credit_card', 'debit_card'],
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD'],
    fees: {
      percentage: 11.5,
      fixed_cents: 0,
      minimum_cents: 50,
    },
    limits: {
      min_transaction_cents: 500,
      max_transaction_cents: 5000000,
    },
    features: {
      instant: true,
      recurring: true,
      refunds: true,
      chargeback_protection: true,
      adult_friendly: true,
    },
    discreet_billing: {
      enabled: true,
      descriptor: 'EP Online Services',
      descriptor_options: ['EP Online Services', 'EP Digital Content', 'EP Media'],
    },
    region: ['US', 'EU', 'UK', 'CA'],
    enabled: true,
    priority: 3,
  },
  {
    id: 'paxum',
    name: 'Paxum',
    displayName: 'Paxum',
    icon: '/icons/paxum.svg',
    supportedMethods: ['wallet', 'bank_transfer'],
    supportedCurrencies: ['USD', 'EUR', 'GBP'],
    fees: {
      percentage: 2.5,
      fixed_cents: 0,
      minimum_cents: 25,
    },
    limits: {
      min_transaction_cents: 1000,
      max_transaction_cents: 10000000,
    },
    features: {
      instant: false,
      recurring: false,
      refunds: true,
      chargeback_protection: false,
      adult_friendly: true,
    },
    discreet_billing: {
      enabled: true,
      descriptor: 'Paxum Payment',
    },
    region: ['WORLDWIDE'],
    enabled: true,
    priority: 10,
  },
  {
    id: 'verotel',
    name: 'Verotel',
    displayName: 'Verotel',
    icon: '/icons/verotel.svg',
    supportedMethods: ['credit_card', 'debit_card'],
    supportedCurrencies: ['USD', 'EUR', 'GBP'],
    fees: {
      percentage: 14.9,
      fixed_cents: 35,
      minimum_cents: 50,
    },
    limits: {
      min_transaction_cents: 500,
      max_transaction_cents: 5000000,
    },
    features: {
      instant: true,
      recurring: true,
      refunds: true,
      chargeback_protection: true,
      adult_friendly: true,
    },
    discreet_billing: {
      enabled: true,
      descriptor: 'VT Online Services',
      descriptor_options: ['VT Online Services', 'VT Digital', 'VT Media'],
    },
    region: ['EU', 'WORLDWIDE'],
    enabled: true,
    priority: 4,
  },

  // Mainstream Processors (conditionally enabled)
  {
    id: 'stripe',
    name: 'Stripe',
    displayName: 'Stripe',
    icon: '/icons/stripe.svg',
    supportedMethods: ['credit_card', 'debit_card', 'wallet'],
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY'],
    fees: {
      percentage: 2.9,
      fixed_cents: 30,
      minimum_cents: 50,
    },
    limits: {
      min_transaction_cents: 50,
      max_transaction_cents: 99999900,
    },
    features: {
      instant: true,
      recurring: true,
      refunds: true,
      chargeback_protection: true,
      adult_friendly: false,
    },
    discreet_billing: {
      enabled: true,
      descriptor: 'FANZ Digital',
    },
    region: ['US', 'EU', 'UK', 'CA', 'AU', 'WORLDWIDE'],
    enabled: false, // Disabled for adult content by default
    priority: 20,
  },
  {
    id: 'paypal',
    name: 'PayPal',
    displayName: 'PayPal',
    icon: '/icons/paypal.svg',
    supportedMethods: ['wallet', 'credit_card', 'debit_card'],
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
    fees: {
      percentage: 3.49,
      fixed_cents: 49,
      minimum_cents: 50,
    },
    limits: {
      min_transaction_cents: 100,
      max_transaction_cents: 1000000,
    },
    features: {
      instant: true,
      recurring: true,
      refunds: true,
      chargeback_protection: true,
      adult_friendly: false,
    },
    discreet_billing: {
      enabled: false,
      descriptor: 'PayPal Payment',
    },
    region: ['WORLDWIDE'],
    enabled: false, // Disabled for adult content
    priority: 21,
  },
  {
    id: 'square',
    name: 'Square',
    displayName: 'Square',
    icon: '/icons/square.svg',
    supportedMethods: ['credit_card', 'debit_card'],
    supportedCurrencies: ['USD', 'CAD', 'AUD', 'GBP', 'EUR', 'JPY'],
    fees: {
      percentage: 2.9,
      fixed_cents: 30,
      minimum_cents: 100,
    },
    limits: {
      min_transaction_cents: 100,
      max_transaction_cents: 5000000,
    },
    features: {
      instant: true,
      recurring: false,
      refunds: true,
      chargeback_protection: true,
      adult_friendly: false,
    },
    discreet_billing: {
      enabled: true,
      descriptor: 'SQ Digital',
    },
    region: ['US', 'CA', 'AU', 'UK', 'EU', 'JP'],
    enabled: false,
    priority: 22,
  },

  // Cryptocurrency Processors
  {
    id: 'coinbase',
    name: 'Coinbase Commerce',
    displayName: 'Coinbase Commerce',
    icon: '/icons/coinbase.svg',
    supportedMethods: ['crypto'],
    supportedCurrencies: ['BTC', 'ETH', 'USDC', 'USDT', 'DAI', 'LTC', 'BCH'],
    fees: {
      percentage: 1.0,
      fixed_cents: 0,
      minimum_cents: 100,
    },
    limits: {
      min_transaction_cents: 100,
      max_transaction_cents: 100000000,
    },
    features: {
      instant: false,
      recurring: false,
      refunds: false,
      chargeback_protection: true,
      adult_friendly: true,
    },
    discreet_billing: {
      enabled: true,
      descriptor: 'Crypto Payment',
    },
    region: ['WORLDWIDE'],
    enabled: true,
    priority: 5,
  },
  {
    id: 'cryptocurrency',
    name: 'Direct Crypto',
    displayName: 'Cryptocurrency',
    icon: '/icons/crypto.svg',
    supportedMethods: ['crypto'],
    supportedCurrencies: ['BTC', 'ETH', 'USDC', 'USDT', 'BNB', 'SOL', 'ADA', 'XRP'],
    fees: {
      percentage: 0.5,
      fixed_cents: 0,
      minimum_cents: 100,
    },
    limits: {
      min_transaction_cents: 500,
      max_transaction_cents: 100000000,
    },
    features: {
      instant: false,
      recurring: false,
      refunds: false,
      chargeback_protection: true,
      adult_friendly: true,
    },
    discreet_billing: {
      enabled: true,
      descriptor: 'Blockchain Transaction',
    },
    region: ['WORLDWIDE'],
    enabled: true,
    priority: 6,
  },

  // Digital Wallets
  {
    id: 'skrill',
    name: 'Skrill',
    displayName: 'Skrill',
    icon: '/icons/skrill.svg',
    supportedMethods: ['wallet'],
    supportedCurrencies: ['USD', 'EUR', 'GBP'],
    fees: {
      percentage: 1.9,
      fixed_cents: 0,
      minimum_cents: 50,
    },
    limits: {
      min_transaction_cents: 500,
      max_transaction_cents: 2000000,
    },
    features: {
      instant: true,
      recurring: false,
      refunds: true,
      chargeback_protection: false,
      adult_friendly: true,
    },
    discreet_billing: {
      enabled: true,
      descriptor: 'Skrill Payment',
    },
    region: ['WORLDWIDE'],
    enabled: true,
    priority: 11,
  },
  {
    id: 'neteller',
    name: 'NETELLER',
    displayName: 'NETELLER',
    icon: '/icons/neteller.svg',
    supportedMethods: ['wallet'],
    supportedCurrencies: ['USD', 'EUR', 'GBP'],
    fees: {
      percentage: 2.5,
      fixed_cents: 0,
      minimum_cents: 50,
    },
    limits: {
      min_transaction_cents: 500,
      max_transaction_cents: 2000000,
    },
    features: {
      instant: true,
      recurring: false,
      refunds: true,
      chargeback_protection: false,
      adult_friendly: true,
    },
    discreet_billing: {
      enabled: true,
      descriptor: 'NETELLER Payment',
    },
    region: ['WORLDWIDE'],
    enabled: true,
    priority: 12,
  },
  {
    id: 'payoneer',
    name: 'Payoneer',
    displayName: 'Payoneer',
    icon: '/icons/payoneer.svg',
    supportedMethods: ['wallet', 'bank_transfer'],
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'JPY', 'CNY'],
    fees: {
      percentage: 3.0,
      fixed_cents: 0,
      minimum_cents: 100,
    },
    limits: {
      min_transaction_cents: 1000,
      max_transaction_cents: 10000000,
    },
    features: {
      instant: false,
      recurring: false,
      refunds: true,
      chargeback_protection: false,
      adult_friendly: true,
    },
    discreet_billing: {
      enabled: true,
      descriptor: 'Payoneer Payment',
    },
    region: ['WORLDWIDE'],
    enabled: true,
    priority: 13,
  },

  // Mobile Wallets
  {
    id: 'applepay',
    name: 'Apple Pay',
    displayName: 'Apple Pay',
    icon: '/icons/applepay.svg',
    supportedMethods: ['wallet'],
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'],
    fees: {
      percentage: 2.9,
      fixed_cents: 30,
      minimum_cents: 50,
    },
    limits: {
      min_transaction_cents: 50,
      max_transaction_cents: 1000000,
    },
    features: {
      instant: true,
      recurring: true,
      refunds: true,
      chargeback_protection: true,
      adult_friendly: false,
    },
    discreet_billing: {
      enabled: true,
      descriptor: 'Apple Pay',
    },
    region: ['US', 'EU', 'UK', 'CA', 'AU', 'JP'],
    enabled: false,
    priority: 23,
  },
  {
    id: 'googlepay',
    name: 'Google Pay',
    displayName: 'Google Pay',
    icon: '/icons/googlepay.svg',
    supportedMethods: ['wallet'],
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'INR'],
    fees: {
      percentage: 2.9,
      fixed_cents: 30,
      minimum_cents: 50,
    },
    limits: {
      min_transaction_cents: 50,
      max_transaction_cents: 1000000,
    },
    features: {
      instant: true,
      recurring: true,
      refunds: true,
      chargeback_protection: true,
      adult_friendly: false,
    },
    discreet_billing: {
      enabled: true,
      descriptor: 'Google Pay',
    },
    region: ['WORLDWIDE'],
    enabled: false,
    priority: 24,
  },
  {
    id: 'venmo',
    name: 'Venmo',
    displayName: 'Venmo',
    icon: '/icons/venmo.svg',
    supportedMethods: ['wallet'],
    supportedCurrencies: ['USD'],
    fees: {
      percentage: 1.9,
      fixed_cents: 10,
      minimum_cents: 100,
    },
    limits: {
      min_transaction_cents: 100,
      max_transaction_cents: 500000,
    },
    features: {
      instant: true,
      recurring: false,
      refunds: true,
      chargeback_protection: false,
      adult_friendly: false,
    },
    discreet_billing: {
      enabled: true,
      descriptor: 'Venmo Payment',
    },
    region: ['US'],
    enabled: false,
    priority: 25,
  },
  {
    id: 'cashapp',
    name: 'Cash App',
    displayName: 'Cash App',
    icon: '/icons/cashapp.svg',
    supportedMethods: ['wallet'],
    supportedCurrencies: ['USD', 'GBP'],
    fees: {
      percentage: 2.75,
      fixed_cents: 0,
      minimum_cents: 100,
    },
    limits: {
      min_transaction_cents: 100,
      max_transaction_cents: 1000000,
    },
    features: {
      instant: true,
      recurring: false,
      refunds: true,
      chargeback_protection: false,
      adult_friendly: true,
    },
    discreet_billing: {
      enabled: true,
      descriptor: 'Cash App Payment',
    },
    region: ['US', 'UK'],
    enabled: true,
    priority: 7,
  },

  // International Processors
  {
    id: 'alipay',
    name: 'Alipay',
    displayName: 'Alipay',
    icon: '/icons/alipay.svg',
    supportedMethods: ['wallet'],
    supportedCurrencies: ['CNY', 'USD', 'EUR'],
    fees: {
      percentage: 3.5,
      fixed_cents: 0,
      minimum_cents: 100,
    },
    limits: {
      min_transaction_cents: 100,
      max_transaction_cents: 5000000,
    },
    features: {
      instant: true,
      recurring: false,
      refunds: true,
      chargeback_protection: true,
      adult_friendly: false,
    },
    discreet_billing: {
      enabled: true,
      descriptor: 'Alipay Payment',
    },
    region: ['CN', 'ASIA', 'WORLDWIDE'],
    enabled: false,
    priority: 26,
  },
  {
    id: 'wechatpay',
    name: 'WeChat Pay',
    displayName: 'WeChat Pay',
    icon: '/icons/wechatpay.svg',
    supportedMethods: ['wallet'],
    supportedCurrencies: ['CNY', 'USD'],
    fees: {
      percentage: 3.0,
      fixed_cents: 0,
      minimum_cents: 100,
    },
    limits: {
      min_transaction_cents: 100,
      max_transaction_cents: 5000000,
    },
    features: {
      instant: true,
      recurring: false,
      refunds: true,
      chargeback_protection: true,
      adult_friendly: false,
    },
    discreet_billing: {
      enabled: true,
      descriptor: 'WeChat Pay',
    },
    region: ['CN', 'ASIA'],
    enabled: false,
    priority: 27,
  },
  {
    id: 'amazonpay',
    name: 'Amazon Pay',
    displayName: 'Amazon Pay',
    icon: '/icons/amazonpay.svg',
    supportedMethods: ['wallet'],
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'JPY'],
    fees: {
      percentage: 3.9,
      fixed_cents: 30,
      minimum_cents: 50,
    },
    limits: {
      min_transaction_cents: 50,
      max_transaction_cents: 1000000,
    },
    features: {
      instant: true,
      recurring: true,
      refunds: true,
      chargeback_protection: true,
      adult_friendly: false,
    },
    discreet_billing: {
      enabled: true,
      descriptor: 'Amazon Pay',
    },
    region: ['US', 'EU', 'UK', 'JP'],
    enabled: false,
    priority: 28,
  },
];

/**
 * Get enabled payment processors
 */
export function getEnabledProcessors(): PaymentProcessor[] {
  return PAYMENT_PROCESSORS.filter(p => p.enabled).sort((a, b) => a.priority - b.priority);
}

/**
 * Get processors by payment method
 */
export function getProcessorsByMethod(method: PaymentMethod): PaymentProcessor[] {
  return getEnabledProcessors().filter(p => p.supportedMethods.includes(method));
}

/**
 * Get processors by region
 */
export function getProcessorsByRegion(region: string): PaymentProcessor[] {
  return getEnabledProcessors().filter(p =>
    p.region.includes(region) || p.region.includes('WORLDWIDE')
  );
}

/**
 * Get adult-friendly processors
 */
export function getAdultFriendlyProcessors(): PaymentProcessor[] {
  return getEnabledProcessors().filter(p => p.features.adult_friendly);
}

/**
 * Get processors with discreet billing
 */
export function getDiscreetProcessors(): PaymentProcessor[] {
  return getEnabledProcessors().filter(p => p.discreet_billing.enabled);
}

/**
 * Calculate total fees for a transaction
 */
export function calculateFees(processor: PaymentProcessor, amountCents: number): {
  fees_cents: number;
  net_amount_cents: number;
  total_with_fees_cents: number;
} {
  const percentageFee = Math.ceil((amountCents * processor.fees.percentage) / 100);
  const fixedFee = processor.fees.fixed_cents;
  const totalFees = Math.max(percentageFee + fixedFee, processor.fees.minimum_cents);

  return {
    fees_cents: totalFees,
    net_amount_cents: amountCents - totalFees,
    total_with_fees_cents: amountCents + totalFees,
  };
}

/**
 * Recommend best processor for a transaction
 */
export function recommendProcessor(params: {
  amount_cents: number;
  currency: string;
  region?: string;
  method?: PaymentMethod;
  require_discreet?: boolean;
  require_instant?: boolean;
}): PaymentProcessor | null {
  let processors = getEnabledProcessors();

  // Filter by requirements
  if (params.require_discreet) {
    processors = processors.filter(p => p.discreet_billing.enabled);
  }

  if (params.require_instant) {
    processors = processors.filter(p => p.features.instant);
  }

  if (params.method) {
    processors = processors.filter(p => p.supportedMethods.includes(params.method!));
  }

  if (params.currency) {
    processors = processors.filter(p => p.supportedCurrencies.includes(params.currency));
  }

  if (params.region) {
    processors = processors.filter(p =>
      p.region.includes(params.region!) || p.region.includes('WORLDWIDE')
    );
  }

  // Filter by amount limits
  processors = processors.filter(p =>
    params.amount_cents >= p.limits.min_transaction_cents &&
    params.amount_cents <= p.limits.max_transaction_cents
  );

  if (processors.length === 0) return null;

  // Return processor with lowest priority (highest preference)
  return processors.sort((a, b) => a.priority - b.priority)[0];
}

/**
 * Get processor by ID
 */
export function getProcessorById(id: ProcessorType): PaymentProcessor | undefined {
  return PAYMENT_PROCESSORS.find(p => p.id === id);
}
