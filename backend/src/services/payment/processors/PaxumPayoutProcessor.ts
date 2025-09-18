import crypto from 'crypto';
import axios from 'axios';
import { IPaymentProcessor } from '../../paymentProcessors/interfaces/IPaymentProcessor';
import {
  PaymentRequest,
  PaymentResponse,
  RefundRequest,
  RefundResponse,
  PayoutRequest,
  PayoutResponse,
  WebhookData
} from '../../paymentProcessors/interfaces/IPaymentProcessor';
import { logger } from '../../../utils/logger';
import { SecureRandom } from '../../../middleware/secureRandom';

interface PaxumConfig {
  apiKey: string;
  apiSecret: string;
  companyId: string;
  environment: 'sandbox' | 'production';
}

interface PaxumPayoutData {
  transactionId: string;
  recipientEmail: string;
  amount: number;
  currency: string;
  description?: string;
  reference?: string;
}

export class PaxumPayoutProcessor implements IPaymentProcessor {
  private config: PaxumConfig;
  private baseUrl: string;

  constructor(config: PaxumConfig) {
    this.config = config;
    this.baseUrl = config.environment === 'production' 
      ? 'https://secure.paxum.com/api'
      : 'https://sandbox.paxum.com/api';
  }

  getName(): string {
    return 'Paxum';
  }

  getVersion(): string {
    return '1.0.0';
  }

  getSupportedFeatures() {
    return {
      payouts: true,
      refunds: false,
      webhooks: true,
      recurringPayments: false,
      multiCurrency: true,
      cryptoPayments: false
    };
  }

  getSupportedPaymentMethods(): string[] {
    return ['paxum_ewallet'];
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    // Paxum is primarily for payouts, not payments
    logger.warn('Paxum is primarily a payout processor');
    
    return {
      success: false,
      status: 'failed',
      errorMessage: 'Paxum is primarily designed for payouts, not payments',
      processorResponse: { processor: 'paxum' }
    };
  }

  async processRefund(request: RefundRequest): Promise<RefundResponse> {
    // Paxum doesn't handle refunds
    logger.warn('Paxum does not support refunds');
    
    return {
      success: false,
      status: 'failed',
      errorMessage: 'Paxum does not support refund processing',
      processorResponse: { processor: 'paxum' }
    };
  }

  async processPayout(request: PayoutRequest): Promise<PayoutResponse> {
    try {
      logger.info('Processing Paxum payout', { 
        amount: request.amount,
        currency: request.currency 
      });

      if (request.amount <= 0) {
        throw new Error('Payout amount must be positive');
      }

      // Generate signature for API authentication
      const timestamp = Date.now().toString();
      const signature = this.generateSignature(timestamp, request);

      const payoutData: PaxumPayoutData = {
        transactionId: request.payoutId || this.generateTransactionId(),
        recipientEmail: request.destination.details.email,
        amount: request.amount,
        currency: request.currency,
        description: request.description || 'Creator payout',
        reference: request.payoutId
      };

      const response = await axios.post(`${this.baseUrl}/payout`, payoutData, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.config.apiKey,
          'X-Timestamp': timestamp,
          'X-Signature': signature
        },
        timeout: 30000
      });

      if (response.data.success) {
        return {
          success: true,
          payoutId: response.data.payoutId || payoutData.transactionId,
          status: 'completed',
          estimatedArrival: 'Instant',
          processorResponse: {
            processor: 'paxum',
            processorPayoutId: response.data.payoutId,
            transactionId: response.data.transactionId
          }
        };
      } else {
        throw new Error(response.data.message || 'Payout failed');
      }

    } catch (error) {
      logger.error('Paxum payout failed', { error, payoutId: request.payoutId });
      return {
        success: false,
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Payout failed',
        processorResponse: { processor: 'paxum' }
      };
    }
  }

  async handleWebhook(data: WebhookData): Promise<boolean> {
    try {
      logger.info('Processing Paxum webhook', { data: data.data });

      // Verify webhook signature
      if (!this.verifyWebhookSignature(JSON.stringify(data.data), data.signature || '')) {
        logger.error('Paxum webhook signature verification failed');
        return false;
      }

      // Process webhook based on event type
      const eventType = data.data.eventType;
      
      switch (eventType) {
        case 'payout_completed':
          await this.handlePayoutCompleted(data.data);
          break;
        case 'payout_failed':
          await this.handlePayoutFailed(data.data);
          break;
        case 'payout_returned':
          await this.handlePayoutReturned(data.data);
          break;
        default:
          logger.warn('Unknown Paxum webhook event', { eventType });
      }

      return true;

    } catch (error) {
      logger.error('Paxum webhook processing failed', { error });
      return false;
    }
  }

  async getTransactionStatus(processorTransactionId: string): Promise<PaymentResponse> {
    try {
      logger.info('Getting Paxum transaction status', { processorTransactionId });

      // For Paxum, we would query their transaction status API
      // For now, returning a basic response
      return {
        success: true,
        processorTransactionId,
        status: 'completed',
        metadata: {
          processor: 'paxum',
          lastChecked: new Date().toISOString()
        }
      };

    } catch (error) {
      logger.error('Paxum transaction status check failed', { error, processorTransactionId });
      return {
        success: false,
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Transaction status check failed',
        processorResponse: { processor: 'paxum' }
      };
    }
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.config.apiSecret)
        .update(payload)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );

    } catch (error) {
      logger.error('Paxum webhook signature verification error', { error });
      return false;
    }
  }

  async healthCheck(): Promise<{ healthy: boolean; message?: string; details?: Record<string, any> }> {
    try {
      const response = await axios.get(`${this.baseUrl}/health`, {
        headers: {
          'X-API-Key': this.config.apiKey
        },
        timeout: 10000
      });

      const isHealthy = response.status === 200;

      return {
        healthy: isHealthy,
        message: isHealthy ? 'Paxum API accessible' : 'Paxum API connection failed',
        details: {
          processor: 'paxum',
          responseTime: Date.now(),
          environment: this.config.environment,
          companyId: this.config.companyId
        }
      };

    } catch (error) {
      return {
        healthy: false,
        message: error instanceof Error ? error.message : 'Health check failed',
        details: { 
          processor: 'paxum',
          responseTime: Date.now(),
          environment: this.config.environment 
        }
      };
    }
  }

  // Private helper methods
  private generateSignature(timestamp: string, request: PayoutRequest): string {
    const dataToSign = `${timestamp}${request.amount}${request.currency}${this.config.companyId}`;
    
    return crypto
      .createHmac('sha256', this.config.apiSecret)
      .update(dataToSign)
      .digest('hex');
  }

  private generateTransactionId(): string {
    return SecureRandom.transactionId('paxum');
  }

  private async handlePayoutCompleted(data: any): Promise<void> {
    logger.info('Processing Paxum payout completed webhook', { 
      payoutId: data.payoutId,
      amount: data.amount 
    });
    
    // Update payout status in database
    // await payoutService.updatePayoutStatus(data.payoutId, 'completed');
  }

  private async handlePayoutFailed(data: any): Promise<void> {
    logger.info('Processing Paxum payout failed webhook', { 
      payoutId: data.payoutId,
      reason: data.reason 
    });
    
    // Update payout status in database
    // await payoutService.updatePayoutStatus(data.payoutId, 'failed', data.reason);
  }

  private async handlePayoutReturned(data: any): Promise<void> {
    logger.info('Processing Paxum payout returned webhook', { 
      payoutId: data.payoutId,
      reason: data.reason 
    });
    
    // Handle returned payout
    // await payoutService.handleReturnedPayout(data.payoutId, data.reason);
  }
}