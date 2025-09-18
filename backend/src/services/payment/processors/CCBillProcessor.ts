import crypto from 'crypto';
import axios from 'axios';
import { IPaymentProcessor } from '../..REDACTED_AWS_SECRET_KEYocessor';
import {
  PaymentRequest,
  PaymentResponse,
  RefundRequest,
  RefundResponse,
  PayoutRequest,
  PayoutResponse,
  WebhookData
} from '../..REDACTED_AWS_SECRET_KEYocessor';
import { logger } from '../../../utils/logger';
import { SecureRandom } from '../../../middleware/secureRandom';

interface CCBillConfig {
  clientAccnum: string;
  clientSubacc: string;
  flexId: string;
  salt: string;
  apiUsername: string;
  apiPassword: string;
  environment: 'sandbox' | 'production';
}

interface CCBillWebhookPayload {
  eventType: string;
  subscriptionId: string;
  transactionId: string;
  accountingAmount: string;
  accountingCurrency: string;
  timestamp?: string;
}

export class CCBillProcessor implements IPaymentProcessor {
  private config: CCBillConfig;
  private baseUrl: string;

  constructor(config: CCBillConfig) {
    this.config = config;
    this.baseUrl = config.environment === 'production' 
      ? 'https://api.ccbill.com'
      : 'https://sandbox-api.ccbill.com';
  }

  getName(): string {
    return 'CCBill';
  }

  getVersion(): string {
    return '1.0.0';
  }

  getSupportedFeatures() {
    return {
      payouts: false,
      refunds: true,
      webhooks: true,
      recurringPayments: true,
      multiCurrency: true,
      cryptoPayments: false
    };
  }

  getSupportedPaymentMethods(): string[] {
    return ['credit_card', 'debit_card'];
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      logger.info('Processing CCBill payment', { 
        customerId: request.customerId,
        amount: request.amount 
      });

      // Validate amount is positive
      if (request.amount <= 0) {
        throw new Error('Payment amount must be positive');
      }

      // CCBill uses FlexForms for hosted payment pages
      const flexFormUrl = this.generateFlexFormUrl(request);
      const transactionId = request.customerId || this.generateTransactionId();

      return {
        success: true,
        transactionId,
        status: 'pending',
        processorTransactionId: transactionId,
        metadata: {
          paymentUrl: flexFormUrl,
          processor: 'ccbill',
          requiresRedirect: true
        }
      };

    } catch (error) {
      logger.error('CCBill payment processing failed', { error, requestId: request.customerId });
      return {
        success: false,
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Payment processing failed',
        processorResponse: { processor: 'ccbill' }
      };
    }
  }

  async processRefund(request: RefundRequest): Promise<RefundResponse> {
    try {
      logger.info('Processing CCBill refund', { 
        transactionId: request.transactionId,
        amount: request.amount 
      });

      // CCBill refunds are processed via API
      const refundData = {
        username: this.config.apiUsername,
        password: this.config.apiPassword,
        transactionId: request.transactionId,
        amount: request.amount?.toFixed(2),
        reason: request.reason || 'Customer request'
      };

      const response = await axios.post(`${this.baseUrl}/wap-frontflex/refund`, refundData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 30000
      });

      if (response.data.results && response.data.results.length > 0) {
        const result = response.data.results[0];
        
        return {
          success: true,
          refundId: result.refundId || this.generateTransactionId(),
          status: 'completed',
          processorResponse: {
            processor: 'ccbill',
            processorRefundId: result.refundId
          }
        };
      } else {
        throw new Error('Refund failed - no results returned');
      }

    } catch (error) {
      logger.error('CCBill refund failed', { error, requestId: request.transactionId });
      return {
        success: false,
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Refund failed',
        processorResponse: { processor: 'ccbill' }
      };
    }
  }

  async processPayout?(request: PayoutRequest): Promise<PayoutResponse> {
    // CCBill doesn't support automated payouts
    logger.warn('CCBill does not support automated payouts');
    
    return {
      success: false,
      status: 'failed',
      errorMessage: 'CCBill does not support automated payouts',
      processorResponse: { processor: 'ccbill' }
    };
  }

  async handleWebhook(data: WebhookData): Promise<boolean> {
    try {
      const payload = data.data as CCBillWebhookPayload;
      
      // Verify webhook authenticity
      if (!this.verifyWebhookSignature(JSON.stringify(data.data), data.signature || '')) {
        logger.error('CCBill webhook signature verification failed');
        return false;
      }

      logger.info('Processing CCBill webhook', { 
        eventType: payload.eventType,
        transactionId: payload.transactionId 
      });

      // Process different webhook events
      switch (payload.eventType) {
        case 'NewSaleSuccess':
          await this.handleSuccessfulPayment(payload);
          break;
        case 'Cancellation':
          await this.handleCancellation(payload);
          break;
        case 'Refund':
          await this.handleRefund(payload);
          break;
        case 'Chargeback':
          await this.handleChargeback(payload);
          break;
        default:
          logger.warn('Unknown CCBill webhook event', { eventType: payload.eventType });
      }

      return true;

    } catch (error) {
      logger.error('CCBill webhook processing failed', { error });
      return false;
    }
  }

  verifyWebhookSignature(payload: string, signature: string, timestamp?: string): boolean {
    try {
      // Generate expected signature using HMAC-SHA256
      const expectedSignature = crypto
        .createHmac('sha256', this.config.salt)
        .update(`${payload}${timestamp || ''}`)
        .digest('hex');

      // Use timing-safe comparison
      try {
        return crypto.timingSafeEqual(
          Buffer.from(signature, 'hex'),
          Buffer.from(expectedSignature, 'hex')
        );
      } catch {
        return false;
      }

    } catch (error) {
      logger.error('CCBill webhook signature verification error', { error });
      return false;
    }
  }

  async healthCheck(): Promise<{ healthy: boolean; message?: string; details?: Record<string, any> }> {
    try {
      const response = await axios.post(`${this.baseUrl}/wap-frontflex/flexforms/ping`, {
        username: this.config.apiUsername,
        password: this.config.apiPassword
      }, {
        timeout: 10000
      });

      const isHealthy = response.status === 200;

      return {
        healthy: isHealthy,
        message: isHealthy ? 'CCBill API accessible' : 'CCBill API connection failed',
        details: {
          processor: 'ccbill',
          responseTime: Date.now(),
          environment: this.config.environment,
          clientAccnum: this.config.clientAccnum
        }
      };

    } catch (error) {
      return {
        healthy: false,
        message: error instanceof Error ? error.message : 'Health check failed',
        details: { 
          processor: 'ccbill',
          responseTime: Date.now(),
          environment: this.config.environment 
        }
      };
    }
  }

  // Private helper methods
  private generateFlexFormUrl(request: PaymentRequest): string {
    const currencyCode = this.getCurrencyCode(request.currency);
    
    const params = new URLSearchParams({
      clientAccnum: this.config.clientAccnum,
      clientSubacc: this.config.clientSubacc,
      flexId: this.config.flexId,
      formPrice: request.amount.toFixed(2),
      currencyCode: currencyCode.toString(),
      formPeriod: '30', // Default to monthly subscription
      email: request.customerId,
      successUrl: `${process.env.APP_BASE_URL}/payment/success`,
      declineUrl: `${process.env.APP_BASE_URL}/payment/failure`,
      webhookUrl: `${process.env.APP_BASE_URL}/webhooks/ccbill`
    });

    return `https://api.ccbill.com/wap-frontflex/flexforms/${this.config.flexId}?${params.toString()}`;
  }

  private generateTransactionId(): string {
    return SecureRandom.transactionId('ccbill');
  }

  private getCurrencyCode(currency: string): number {
    const currencyCodes: Record<string, number> = {
      'USD': 840,
      'EUR': 978,
      'GBP': 826,
      'CAD': 124,
      'AUD': 36,
      'JPY': 392
    };
    
    return currencyCodes[currency.toUpperCase()] || 840; // Default to USD
  }

  private async handleSuccessfulPayment(payload: CCBillWebhookPayload): Promise<void> {
    logger.info('Processing CCBill successful payment webhook', { 
      transactionId: payload.transactionId,
      amount: payload.accountingAmount 
    });
  }

  private async handleCancellation(payload: CCBillWebhookPayload): Promise<void> {
    logger.info('Processing CCBill cancellation webhook', { 
      subscriptionId: payload.subscriptionId 
    });
  }

  private async handleRefund(payload: CCBillWebhookPayload): Promise<void> {
    logger.info('Processing CCBill refund webhook', { 
      transactionId: payload.transactionId,
      amount: payload.accountingAmount 
    });
  }

  private async handleChargeback(payload: CCBillWebhookPayload): Promise<void> {
    logger.info('Processing CCBill chargeback webhook', { 
      transactionId: payload.transactionId,
      amount: payload.accountingAmount 
    });
  }
}