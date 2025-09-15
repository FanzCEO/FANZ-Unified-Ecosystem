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
import axios from 'axios';
import crypto from 'crypto';

interface PaxumConfig {
  apiKey: string;
  apiSecret: string;
  companyId: string;
  environment: 'sandbox' | 'production';
}

export class PaxumPayoutProcessor implements IPaymentProcessor {
  private config: PaxumConfig;
  private baseUrl: string;

  constructor(config: PaxumConfig) {
    this.config = config;
    this.baseUrl = config.environment === 'production' 
      ? 'https://api.paxum.com' 
      : 'https://sandbox-api.paxum.com';
  }

  getName(): string {
    return 'Paxum Payouts';
  }

  getVersion(): string {
    return '1.0.0';
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    // Paxum is primarily for payouts, not payment processing
    throw new Error('Paxum is designed for payouts, not payment processing. Use a payment processor like CCBill.');
  }

  async processRefund(request: RefundRequest): Promise<RefundResponse> {
    // Paxum doesn't typically handle refunds for payment processing
    throw new Error('Paxum does not support refunds. Handle refunds through your payment processor.');
  }

  async processPayout(request: PayoutRequest): Promise<PayoutResponse> {
    try {
      const payoutData = {
        companyId: this.config.companyId,
        amount: request.amount.toFixed(2),
        currency: request.currency,
        recipientEmail: request.destination.details.email,
        recipientName: request.destination.details.name || '',
        description: request.description || 'Creator payout',
        reference: request.metadata?.reference || this.generateReference(),
        notifyRecipient: request.metadata?.notifyRecipient || true,
        ...request.destination.details
      };

      // Generate authentication signature
      const signature = this.generateSignature(payoutData);
      
      const response = await axios.post(
        `${this.baseUrl}/v2/payouts`,
        payoutData,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'X-Paxum-Signature': signature,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        // Calculate Paxum fees (typically $0.50 - $2.00 depending on region)
        const processingFee = this.calculatePaxumFee(request.amount, request.currency, request.destination.details);

        return {
          success: true,
          payoutId: this.generateTransactionId(),
          processorPayoutId: response.data.payoutId,
          status: 'processing',
          amount: request.amount,
          currency: request.currency,
          processingFee,
          estimatedArrival: this.getEstimatedArrival(request.destination.details),
          processorResponse: {
            processor: 'paxum',
            payoutId: response.data.payoutId,
            status: response.data.status,
            recipientEmail: payoutData.recipientEmail,
            fees: response.data.fees
          }
        };
      } else {
        return {
          success: false,
          status: 'failed',
          errorCode: response.data.errorCode || 'PAYOUT_FAILED',
          errorMessage: response.data.errorMessage || 'Payout processing failed',
          processorResponse: response.data
        };
      }
    } catch (error) {
      return {
        success: false,
        status: 'failed',
        errorCode: 'API_ERROR',
        errorMessage: error instanceof Error ? error.message : 'Payout API error',
        processorResponse: {
          processor: 'paxum',
          error: error
        }
      };
    }
  }

  async getTransactionStatus(processorTransactionId: string): Promise<PaymentResponse> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/v2/payouts/${processorTransactionId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const payout = response.data;
      
      return {
        success: true,
        processorTransactionId,
        status: this.mapPaxumStatus(payout.status),
        amount: parseFloat(payout.amount || '0'),
        currency: payout.currency || 'USD',
        processingFee: parseFloat(payout.fees?.total || '0'),
        processorResponse: payout
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
      const expectedSignature = crypto
        .createHmac('sha256', this.config.apiSecret)
        .update(payload)
        .digest('hex');
      
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(`sha256=${expectedSignature}`)
      );
    } catch (error) {
      return false;
    }
  }

  parseWebhookEvent(payload: string): WebhookEvent {
    try {
      const data = JSON.parse(payload);
      
      return {
        id: data.payoutId || data.transactionId,
        type: this.mapPaxumEventType(data.eventType),
        data: {
          payoutId: data.payoutId,
          transactionId: data.transactionId,
          recipientEmail: data.recipientEmail,
          amount: data.amount,
          currency: data.currency || 'USD',
          status: data.status,
          fees: data.fees,
          processor: 'paxum'
        },
        timestamp: new Date(data.timestamp || Date.now())
      };
    } catch (error) {
      throw new Error('Invalid Paxum webhook payload');
    }
  }

  async healthCheck(): Promise<{ healthy: boolean; message?: string; details?: Record<string, any> }> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/v2/health`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          },
          timeout: 10000
        }
      );
      
      return {
        healthy: true,
        message: 'Paxum processor is operational',
        details: {
          processor: 'paxum',
          environment: this.config.environment,
          baseUrl: this.baseUrl,
          apiStatus: response.status === 200 ? 'ok' : 'degraded'
        }
      };
    } catch (error) {
      return {
        healthy: false,
        message: 'Paxum processor health check failed',
        details: {
          processor: 'paxum',
          environment: this.config.environment,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  getSupportedFeatures() {
    return {
      payouts: true, // Primary feature
      refunds: false,
      webhooks: true,
      recurringPayments: false,
      multiCurrency: true,
      cryptoPayments: false
    };
  }

  getSupportedPaymentMethods(): string[] {
    return [
      'paxum_ewallet', // Paxum e-wallet
      'bank_transfer',  // Wire transfer
      'prepaid_card'    // Paxum prepaid card
    ];
  }

  calculateFees(amount: number, currency: string, paymentMethod: string): { processingFee: number; platformFee?: number } {
    return {
      processingFee: this.calculatePaxumFee(amount, currency, { paymentMethod }),
      platformFee: 0 // No platform fee for payouts
    };
  }

  // Private helper methods
  private generateSignature(data: any): string {
    const sortedKeys = Object.keys(data).sort();
    const signatureString = sortedKeys
      .map(key => `${key}=${data[key]}`)
      .join('&');
    
    return crypto
      .createHmac('sha256', this.config.apiSecret)
      .update(signatureString)
      .digest('hex');
  }

  private calculatePaxumFee(amount: number, currency: string, destinationDetails: any): number {
    // Paxum fee structure (simplified - actual fees vary by region and volume)
    const paymentMethod = destinationDetails.paymentMethod || destinationDetails.type;
    
    switch (paymentMethod) {
      case 'paxum_ewallet':
        return 0.50; // $0.50 for Paxum to Paxum transfers
      
      case 'bank_transfer':
        // Wire transfer fees vary by region
        const region = destinationDetails.country || 'US';
        if (region === 'US') {
          return 25.00; // Domestic wire
        } else if (['CA', 'MX'].includes(region)) {
          return 35.00; // North America
        } else {
          return 45.00; // International wire
        }
      
      case 'prepaid_card':
        return 2.00; // $2.00 for card loading
      
      default:
        return 1.00; // Default fee
    }
  }

  private getEstimatedArrival(destinationDetails: any): Date {
    const arrivalDate = new Date();
    const paymentMethod = destinationDetails.paymentMethod || destinationDetails.type;
    
    switch (paymentMethod) {
      case 'paxum_ewallet':
        // Instant for Paxum to Paxum
        break;
      
      case 'bank_transfer':
        // 1-5 business days for wires
        arrivalDate.setDate(arrivalDate.getDate() + Math.floor(Math.random() * 5) + 1);
        break;
      
      case 'prepaid_card':
        // 1-2 business days for card loading
        arrivalDate.setDate(arrivalDate.getDate() + Math.floor(Math.random() * 2) + 1);
        break;
      
      default:
        arrivalDate.setDate(arrivalDate.getDate() + 2);
    }
    
    return arrivalDate;
  }

  private mapPaxumStatus(status: string): 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' {
    const statusMap: Record<string, 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'> = {
      'Pending': 'pending',
      'Processing': 'processing',
      'Completed': 'completed',
      'Sent': 'completed',
      'Failed': 'failed',
      'Cancelled': 'cancelled',
      'Declined': 'failed'
    };
    
    return statusMap[status] || 'processing';
  }

  private mapPaxumEventType(eventType: string): string {
    const eventMap: Record<string, string> = {
      'PayoutCompleted': 'payout.completed',
      'PayoutFailed': 'payout.failed',
      'PayoutPending': 'payout.pending',
      'PayoutCancelled': 'payout.cancelled'
    };
    
    return eventMap[eventType] || 'payout.updated';
  }

  private generateReference(): string {
    return `PX${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }

  private generateTransactionId(): string {
    return `paxum_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public utility methods for Paxum-specific features
  public async getRecipientInfo(email: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/v2/recipients/${encodeURIComponent(email)}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to get recipient info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async validateRecipientEmail(email: string): Promise<boolean> {
    try {
      const recipientInfo = await this.getRecipientInfo(email);
      return recipientInfo.exists && recipientInfo.verified;
    } catch (error) {
      return false;
    }
  }

  // Get payout methods available for a recipient
  public async getAvailablePayoutMethods(email: string): Promise<string[]> {
    try {
      const recipientInfo = await this.getRecipientInfo(email);
      return recipientInfo.availablePayoutMethods || ['paxum_ewallet'];
    } catch (error) {
      return ['paxum_ewallet']; // Default to e-wallet
    }
  }
}