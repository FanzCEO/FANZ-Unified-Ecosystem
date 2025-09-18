import { IPaymentProcessor } from '..REDACTED_AWS_SECRET_KEYocessor';
import { MockProcessor } from '../paymentProcessors/MockProcessor';
import { SegpayProcessor } from './processors/SegpayProcessor';
import { CCBillProcessor } from './processors/CCBillProcessor';
import { PaxumPayoutProcessor } from './processors/PaxumPayoutProcessor';
import { logger } from '../../utils/logger';

export type ProcessorType = 'mock' | 'segpay' | 'ccbill' | 'paxum';

export class PaymentProcessorFactory {
  private static processors: Map<ProcessorType, IPaymentProcessor> = new Map();

  /**
   * Initialize processors with their configurations
   */
  static initialize() {
    try {
      // Initialize Mock Processor (for testing)
      this.processors.set('mock', new MockProcessor());

      // Initialize Segpay Processor
      if (process.env.SEGPAY_PACKAGE_ID && process.env.SEGPAY_BILLER_ID) {
        this.processors.set('segpay', new SegpayProcessor({
          packageId: process.env.SEGPAY_PACKAGE_ID,
          billerId: process.env.SEGPAY_BILLER_ID,
          username: process.env.SEGPAY_USERNAME || '',
          password: process.env.SEGPAY_PASSWORD || '',
          environment: (process.env.NODE_ENV === 'production' ? 'production' : 'sandbox')
        }));
      }

      // Initialize CCBill Processor
      if (process.env.CCBILL_CLIENT_ACCNUM && process.env.CCBILL_CLIENT_SUBACC) {
        this.processors.set('ccbill', new CCBillProcessor({
          clientAccnum: process.env.CCBILL_CLIENT_ACCNUM,
          clientSubacc: process.env.CCBILL_CLIENT_SUBACC,
          flexId: process.env.CCBILL_FLEX_ID || '',
          salt: process.env.CCBILL_SALT || '',
          apiUsername: process.env.CCBILL_API_USERNAME || '',
          apiPassword: process.env.CCBILL_API_PASSWORD || '',
          environment: (process.env.NODE_ENV === 'production' ? 'production' : 'sandbox')
        }));
      }

      // Initialize Paxum Processor
      if (process.env.PAXUM_API_KEY && process.env.PAXUM_API_SECRET) {
        this.processors.set('paxum', new PaxumPayoutProcessor({
          apiKey: process.env.PAXUM_API_KEY,
          apiSecret: process.env.PAXUM_API_SECRET,
          companyId: process.env.PAXUM_COMPANY_ID || '',
          environment: (process.env.NODE_ENV === 'production' ? 'production' : 'sandbox')
        }));
      }

      logger.info('Payment processors initialized', {
        availableProcessors: Array.from(this.processors.keys())
      });

    } catch (error) {
      logger.error('Failed to initialize payment processors', { error });
      throw new Error('Payment processor initialization failed');
    }
  }

  /**
   * Get a payment processor by type
   */
  static getProcessor(type: ProcessorType): IPaymentProcessor {
    const processor = this.processors.get(type);
    
    if (!processor) {
      throw new Error(`Unsupported payment processor: ${type}`);
    }

    return processor;
  }

  /**
   * Get all available processors
   */
  static getAvailableProcessors(): ProcessorType[] {
    return Array.from(this.processors.keys());
  }

  /**
   * Check if a processor is available
   */
  static isProcessorAvailable(type: ProcessorType): boolean {
    return this.processors.has(type);
  }

  /**
   * Get processor health status
   */
  static async getProcessorHealthStatus(): Promise<Record<ProcessorType, any>> {
    const healthStatus: Record<string, any> = {};

    for (const [type, processor] of this.processors.entries()) {
      try {
        if (processor.healthCheck) {
          healthStatus[type] = await processor.healthCheck();
        } else {
          healthStatus[type] = { healthy: true, message: 'Health check not implemented' };
        }
      } catch (error) {
        healthStatus[type] = { 
          healthy: false, 
          message: error instanceof Error ? error.message : 'Health check failed' 
        };
      }
    }

    return healthStatus;
  }

  /**
   * Register a custom processor
   */
  static registerProcessor(type: ProcessorType, processor: IPaymentProcessor): void {
    this.processors.set(type, processor);
    logger.info(`Custom processor registered: ${type}`);
  }

  /**
   * Remove a processor
   */
  static removeProcessor(type: ProcessorType): void {
    this.processors.delete(type);
    logger.info(`Processor removed: ${type}`);
  }

  /**
   * Get processor by features
   */
  static getProcessorsByFeature(feature: keyof ReturnType<IPaymentProcessor['getSupportedFeatures']>): ProcessorType[] {
    const processors: ProcessorType[] = [];

    for (const [type, processor] of this.processors.entries()) {
      const features = processor.getSupportedFeatures();
      if (features[feature]) {
        processors.push(type);
      }
    }

    return processors;
  }

  /**
   * Get best processor for a specific use case
   */
  static getBestProcessor(criteria: {
    payouts?: boolean;
    refunds?: boolean;
    recurringPayments?: boolean;
    region?: string;
    contentType?: 'general' | 'adult';
  }): ProcessorType | null {
    // Simple logic for selecting the best processor
    // In production, this would be more sophisticated

    if (criteria.contentType === 'adult') {
      // Prefer adult-friendly processors
      if (criteria.payouts && this.isProcessorAvailable('paxum')) {
        return 'paxum';
      }
      if (this.isProcessorAvailable('ccbill')) {
        return 'ccbill';
      }
      if (this.isProcessorAvailable('segpay')) {
        return 'segpay';
      }
    }

    // Default selection logic
    if (criteria.payouts && this.isProcessorAvailable('paxum')) {
      return 'paxum';
    }

    // Return the first available processor
    const available = this.getAvailableProcessors();
    return available.length > 0 ? available[0] : null;
  }
}

// Auto-initialize when module is loaded
PaymentProcessorFactory.initialize();

export default PaymentProcessorFactory;