import { IPaymentProcessor } from './interfaces/IPaymentProcessor';
// import { SquareProcessor } from './SquareProcessor'; // TODO: Implement
// import { BraintreeProcessor } from './BraintreeProcessor'; // TODO: Implement
// import { CoinbaseCommerceProcessor } from './CoinbaseCommerceProcessor'; // TODO: Implement
import { MockProcessor } from './MockProcessor';
// import { CCBillProcessor } from './adult-friendly/CCBillProcessor'; // Fixed path but processor incomplete
// import { PaxumPayoutProcessor } from './adult-friendly/PaxumPayoutProcessor'; // Fixed path
// import { SegpayProcessor } from './processors/SegpayProcessor'; // TODO: Fix implementation

export type ProcessorType = 'mock'; // | 'square' | 'braintree' | 'coinbase' | 'ccbill' | 'paxum' | 'segpay'; // Other processors disabled until implemented

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
      // All processors disabled until fully implemented
      // case 'square':
      // case 'braintree':
      // case 'coinbase':
      // case 'ccbill':
      // case 'paxum':
      // case 'segpay':
      case 'mock':
      default:
        return new MockProcessor();
    }
  }

  static getAvailableProcessors(): ProcessorType[] {
    const processors: ProcessorType[] = ['mock'];

    // For now, only mock processor is available
    // TODO: Re-enable when other processors are implemented
    // if (process.env.SQUARE_APPLICATION_ID && process.env.SQUARE_ACCESS_TOKEN) {
    //   processors.push('square');
    // }

    return processors;
  }

  static getDefaultProcessor(): IPaymentProcessor {
    // For now, always return mock processor
    return this.getProcessor('mock');
  }

  static getDefaultPayoutProcessor(): IPaymentProcessor {
    // For now, always return mock processor
    return this.getProcessor('mock');
  }
}