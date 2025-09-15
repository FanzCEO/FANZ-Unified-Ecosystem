import { IPaymentProcessor } from './interfaces/IPaymentProcessor';
import { SquareProcessor } from './SquareProcessor';
import { BraintreeProcessor } from './BraintreeProcessor';
import { CoinbaseCommerceProcessor } from './CoinbaseCommerceProcessor';
import { MockProcessor } from './MockProcessor';

export type ProcessorType = 'square' | 'braintree' | 'coinbase' | 'mock';

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

    return processors;
  }

  static getDefaultProcessor(): IPaymentProcessor {
    const availableProcessors = this.getAvailableProcessors();
    
    // Prefer configured processors over mock
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
}