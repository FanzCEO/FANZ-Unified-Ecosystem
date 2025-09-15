import { IPaymentProcessor } from './interfaces/IPaymentProcessor';
import { SquareProcessor } from './SquareProcessor';
import { BraintreeProcessor } from './BraintreeProcessor';
import { CoinbaseCommerceProcessor } from './CoinbaseCommerceProcessor';
import { MockProcessor } from './MockProcessor';
import { CCBillProcessor } from './processors/CCBillProcessor';
import { PaxumPayoutProcessor } from './processors/PaxumPayoutProcessor';
import { SegpayProcessor } from './processors/SegpayProcessor';

export type ProcessorType = 'square' | 'braintree' | 'coinbase' | 'mock' | 'ccbill' | 'paxum' | 'segpay';

export class PaymentProcessorFactory {
  private static processors: Map<ProcessorType, IPaymentProcessor> = new Map();

  static getProcessor(type: ProcessorType): IPaymentProcessor {
    if (!this.processors.has(type)) {
      this.processors.set(type, this.createProcessor(type));
    }

    return this.processors.get(type)!;
  }

  private static createProcessor(type: ProcessorType): IPaymentProcessor {
    switch (type) {
      case 'square':
        return new SquareProcessor({
          environment: process.env.SQUARE_ENVIRONMENT || 'sandbox',
          applicationId: process.env.SQUARE_APPLICATION_ID!,
          accessToken: process.env.SQUARE_ACCESS_TOKEN!,
        });

      case 'braintree':
        return new BraintreeProcessor({
          environment: process.env.BRAINTREE_ENVIRONMENT || 'Sandbox',
          merchantId: process.env.BRAINTREE_MERCHANT_ID!,
          publicKey: process.env.BRAINTREE_PUBLIC_KEY!,
          privateKey: process.env.BRAINTREE_PRIVATE_KEY!,
        });

      case 'coinbase':
        return new CoinbaseCommerceProcessor({
          apiKey: process.env.COINBASE_COMMERCE_API_KEY!,
          webhookSecret: process.env.COINBASE_WEBHOOK_SECRET!,
        });

      case 'ccbill':
        return new CCBillProcessor({
          clientAccnum: process.env.CCBILL_CLIENT_ACCNUM!,
          clientSubacc: process.env.CCBILL_CLIENT_SUBACC!,
          flexId: process.env.CCBILL_FLEX_ID!,
          salt: process.env.CCBILL_SALT!,
          apiUsername: process.env.CCBILL_API_USERNAME,
          apiPassword: process.env.CCBILL_API_PASSWORD,
          environment: (process.env.CCBILL_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
        });

      case 'paxum':
        return new PaxumPayoutProcessor({
          apiKey: process.env.PAXUM_API_KEY!,
          apiSecret: process.env.PAXUM_API_SECRET!,
          companyId: process.env.PAXUM_COMPANY_ID!,
          environment: (process.env.PAXUM_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
        });

      case 'segpay':
        return new SegpayProcessor({
          packageId: process.env.SEGPAY_PACKAGE_ID!,
          billerId: process.env.SEGPAY_BILLERID!,
          username: process.env.SEGPAY_USERNAME!,
          password: process.env.SEGPAY_PASSWORD!,
          environment: (process.env.SEGPAY_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
        });

      case 'mock':
      default:
        return new MockProcessor();
    }
  }

  static getAvailableProcessors(): ProcessorType[] {
    const processors: ProcessorType[] = ['mock'];

    // Check if processors are configured
    if (process.env.SQUARE_APPLICATION_ID && process.env.SQUARE_ACCESS_TOKEN) {
      processors.push('square');
    }

    if (process.env.BRAINTREE_MERCHANT_ID && process.env.BRAINTREE_PUBLIC_KEY && process.env.BRAINTREE_PRIVATE_KEY) {
      processors.push('braintree');
    }

    if (process.env.COINBASE_COMMERCE_API_KEY) {
      processors.push('coinbase');
    }

    if (process.env.CCBILL_CLIENT_ACCNUM && process.env.CCBILL_CLIENT_SUBACC && process.env.CCBILL_SALT) {
      processors.push('ccbill');
    }

    if (process.env.PAXUM_API_KEY && process.env.PAXUM_API_SECRET && process.env.PAXUM_COMPANY_ID) {
      processors.push('paxum');
    }

    if (process.env.SEGPAY_PACKAGE_ID && process.env.SEGPAY_USERNAME && process.env.SEGPAY_PASSWORD) {
      processors.push('segpay');
    }

    return processors;
  }

  static getDefaultProcessor(): IPaymentProcessor {
    const availableProcessors = this.getAvailableProcessors();
    
    // Prefer adult-friendly processors first
    if (availableProcessors.includes('ccbill')) {
      return this.getProcessor('ccbill');
    }
    
    if (availableProcessors.includes('segpay')) {
      return this.getProcessor('segpay');
    }
    
    if (availableProcessors.includes('square')) {
      return this.getProcessor('square');
    }
    
    if (availableProcessors.includes('braintree')) {
      return this.getProcessor('braintree');
    }
    
    if (availableProcessors.includes('coinbase')) {
      return this.getProcessor('coinbase');
    }

    return this.getProcessor('mock');
  }

  static getDefaultPayoutProcessor(): IPaymentProcessor {
    const availableProcessors = this.getAvailableProcessors();
    
    // Prefer Paxum for payouts (adult industry standard)
    if (availableProcessors.includes('paxum')) {
      return this.getProcessor('paxum');
    }
    
    // Fallback to mock for testing
    return this.getProcessor('mock');
  }
}