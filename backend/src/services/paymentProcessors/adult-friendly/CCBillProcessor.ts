import { 
  IPaymentProcessor, 
  PaymentRequest, 
  PaymentResponse, 
  RefundRequest, 
  RefundResponse,
  PayoutRequest,
  PayoutResponse,
  WebhookEvent
} from '../interfaces/IPaymentProcessor';
import axios, { AxiosResponse } from 'axios';
import crypto from 'crypto';

interface CCBillConfig {
  clientAccnum: string;
  clientSubacc: string;
  flexId: string;
  salt: string;
  apiUsername?: string;
  apiPassword?: string;
  environment: 'sandbox' | 'production';
}

export class CCBillProcessor implements IPaymentProcessor {
  private config: CCBillConfig;
  private baseUrl: string;

  constructor(config: CCBillConfig) {
    this.config = config;
    this.baseUrl = config.environment === 'production' 
      ? 'https://api.ccbill.com' 
      : 'https://api.dev.ccbill.com';
  }

  getName(): string {
    return 'CCBill';
  }

  getVersion(): string {
    return '1.0.0';
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // CCBill uses FlexForms for payment processing
      // This creates a payment token/URL for frontend integration
      const paymentData = {
        clientAccnum: this.config.clientAccnum,
        clientSubacc: this.config.clientSubacc,
        formPrice: request.amount.toFixed(2),
        formPeriod: '30', // 30 days for subscriptions
        currencyCode: this.getCurrencyCode(request.currency),
        customerInfo: request.metadata?.customerInfo || {},
        merchantTxnId: request.idempotencyKey,
        ...request.paymentMethod.details
      };

      // Generate security hash
      const securityHash = this.generateSecurityHash(paymentData);
      paymentData.securityHash = securityHash;

      // For CCBill, we typically return a payment URL for redirect
      const paymentUrl = this.generatePaymentUrl(paymentData);

      return {
        success: true,
        transactionId: request.idempotencyKey || this.generateTransactionId(),
        processorTransactionId: paymentData.merchantTxnId,
        status: 'pending',
        amount: request.amount,
        currency: request.currency,
        metadata: {
          paymentUrl,
          redirectRequired: true
        },
        processorResponse: {
          processor: 'ccbill',
          paymentUrl,
          clientAccnum: this.config.clientAccnum,
          clientSubacc: this.config.clientSubacc
        }
      };
    } catch (error) {
      return {
        success: false,
        status: 'failed',
        errorCode: 'PROCESSING_ERROR',
        errorMessage: error instanceof Error ? error.message : 'Payment processing failed',
        processorResponse: {
          processor: 'ccbill',
          error: error
        }
      };
    }
  }

  async processRefund(request: RefundRequest): Promise<RefundResponse> {
    try {
      if (!this.config.apiUsername || !this.config.apiPassword) {
        throw new Error('API credentials required for refunds');
      }

      const refundData = {
        clientAccnum: this.config.clientAccnum,
        clientSubacc: this.config.clientSubacc,
        subscriptionId: request.processorTransactionId,
        refundAmount: request.amount?.toFixed(2) || undefined,
        reason: request.reason || 'Customer request'
      };

      const response = await axios.post(
        `${this.baseUrl}/wap-frontflex/refunds`,
        refundData,
        {
          auth: {
            username: this.config.apiUsername,
            password: this.config.apiPassword
          },
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        return {
          success: true,
          refundId: this.generateTransactionId(),
          processorRefundId: response.data.refundId,
          amount: parseFloat(refundData.refundAmount || '0'),
          currency: 'USD', // CCBill typically processes in USD
          status: 'completed',
          processorResponse: response.data
        };
      } else {
        return {
          success: false,
          status: 'failed',
          errorCode: response.data.errorCode || 'REFUND_FAILED',
          errorMessage: response.data.errorMessage || 'Refund processing failed',
          processorResponse: response.data
        };
      }
    } catch (error) {
      return {
        success: false,
        status: 'failed',
        errorCode: 'API_ERROR',
        errorMessage: error instanceof Error ? error.message : 'Refund API error',
        processorResponse: {
          processor: 'ccbill',
          error: error
        }
      };
    }
  }

  async processPayout(request: PayoutRequest): Promise<PayoutResponse> {
    // CCBill doesn't typically handle payouts directly
    // This would integrate with their merchant settlement or use a separate payout provider
    throw new Error('CCBill does not support direct payouts. Use separate payout provider.');
  }

  async getTransactionStatus(processorTransactionId: string): Promise<PaymentResponse> {
    try {
      if (!this.config.apiUsername || !this.config.apiPassword) {
        throw new Error('API credentials required for status checks');
      }

      const response = await axios.get(
        `${this.baseUrl}/wap-frontflex/subscription/${processorTransactionId}`,
        {
          auth: {
            username: this.config.apiUsername,
            password: this.config.apiPassword
          }
        }
      );

      const subscription = response.data;
      
      return {
        success: true,
        processorTransactionId,
        status: this.mapCCBillStatus(subscription.status),
        amount: parseFloat(subscription.price || '0'),
        currency: 'USD',
        processorResponse: subscription
      };
    } catch (error) {
      return {
        success: false,
        status: 'failed',
        errorCode: 'STATUS_CHECK_FAILED',
        errorMessage: error instanceof Error ? error.message : 'Status check failed'
      };
    }
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      // CCBill webhook verification
      const expectedSignature = crypto
        .createHmac('sha256', this.config.salt)
        .update(payload)
        .digest('hex');
      
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      return false;
    }
  }

  parseWebhookEvent(payload: string): WebhookEvent {
    try {
      const data = JSON.parse(payload);
      
      return {
        id: data.transactionId || data.subscriptionId,
        type: this.mapCCBillEventType(data.eventType),
        data: {
          subscriptionId: data.subscriptionId,
          transactionId: data.transactionId,
          customerId: data.customerId,
          amount: data.amount,
          currency: data.currency || 'USD',
          status: data.status,
          billingDate: data.billingDate,
          processor: 'ccbill'
        },
        timestamp: new Date(data.timestamp || Date.now())
      };
    } catch (error) {
      throw new Error('Invalid CCBill webhook payload');
    }
  }

  async healthCheck(): Promise<{ healthy: boolean; message?: string; details?: Record<string, any> }> {
    try {
      // Basic connectivity test
      const response = await axios.get(`${this.baseUrl}/health`, { timeout: 10000 });
      
      return {
        healthy: true,
        message: 'CCBill processor is operational',
        details: {
          processor: 'ccbill',
          environment: this.config.environment,
          baseUrl: this.baseUrl,
          apiStatus: response.status === 200 ? 'ok' : 'degraded'
        }
      };
    } catch (error) {
      return {
        healthy: false,
        message: 'CCBill processor health check failed',
        details: {
          processor: 'ccbill',
          environment: this.config.environment,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  getSupportedFeatures() {
    return {
      payouts: false, // Use separate payout provider
      refunds: true,
      webhooks: true,
      recurringPayments: true,
      multiCurrency: true,
      cryptoPayments: false
    };
  }

  getSupportedPaymentMethods(): string[] {
    return [
      'credit_card',
      'debit_card',
      'bank_account' // e-check support
    ];
  }

  calculateFees(amount: number, currency: string, paymentMethod: string): { processingFee: number; platformFee?: number } {
    // CCBill typical fee structure (varies by volume)
    let processingFee = 0;
    
    switch (paymentMethod) {
      case 'credit_card':
      case 'debit_card':
        processingFee = Math.round((amount * 0.109 + 0.15) * 100) / 100; // ~10.9% + $0.15
        break;
      case 'bank_account':
        processingFee = Math.round((amount * 0.079 + 0.15) * 100) / 100; // ~7.9% + $0.15 for ACH
        break;
      default:
        processingFee = Math.round((amount * 0.109 + 0.15) * 100) / 100;
    }

    return {
      processingFee,
      platformFee: Math.round(amount * 0.05 * 100) / 100 // 5% platform fee
    };
  }

  // Private helper methods
  private generateSecurityHash(data: any): string {
    const hashString = `${data.formPrice}${data.formPeriod}${data.currencyCode}${this.config.salt}`;
    return crypto.createHash('md5').update(hashString).digest('hex');
  }

  private generatePaymentUrl(data: any): string {
    const basePaymentUrl = this.config.environment === 'production'
      ? 'https://bill.ccbill.com/jpost/signup.cgi'
      : 'https://sandbox-bill.ccbill.com/jpost/signup.cgi';
    
    const params = new URLSearchParams({
      clientAccnum: data.clientAccnum,
      clientSubacc: data.clientSubacc,
      formPrice: data.formPrice,
      formPeriod: data.formPeriod,
      currencyCode: data.currencyCode,
      securityHash: data.securityHash
    });

    return `${basePaymentUrl}?${params.toString()}`;
  }

  private getCurrencyCode(currency: string): string {
    const currencyMap: Record<string, string> = {
      'USD': '840',
      'EUR': '978',
      'GBP': '826',
      'CAD': '124',
      'AUD': '036'
    };
    
    return currencyMap[currency] || '840'; // Default to USD
  }

  private mapCCBillStatus(status: string): 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' {
    const statusMap: Record<string, 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'> = {
      'Active': 'completed',
      'Cancelled': 'cancelled',
      'Expired': 'failed',
      'Pending': 'pending',
      'Processing': 'processing'
    };
    
    return statusMap[status] || 'pending';
  }

  private mapCCBillEventType(eventType: string): string {
    const eventMap: Record<string, string> = {
      'NewSaleSuccess': 'payment.completed',
      'NewSaleFailure': 'payment.failed',
      'Cancellation': 'subscription.cancelled',
      'Refund': 'payment.refunded',
      'Chargeback': 'payment.chargeback'
    };
    
    return eventMap[eventType] || 'payment.updated';
  }

  private generateTransactionId(): string {
    return `ccbill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}