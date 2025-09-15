import { 
  IPaymentProcessor, 
  PaymentRequest, 
  PaymentResponse, 
  RefundRequest, 
  RefundResponse,
  PayoutRequest,
  PayoutResponse,
  WebhookEvent
} from './interfaces/IPaymentProcessor';
import { v4 as uuidv4 } from 'uuid';

export class MockProcessor implements IPaymentProcessor {
  private transactions: Map<string, any> = new Map();
  private failureRate: number = 0; // 0-100, percentage of transactions that should fail
  private delay: number = 1000; // Delay in ms to simulate processing time

  constructor(options?: { failureRate?: number; delay?: number }) {
    this.failureRate = options?.failureRate || 0;
    this.delay = options?.delay || 1000;
  }

  getName(): string {
    return 'Mock Payment Processor';
  }

  getVersion(): string {
    return '1.0.0';
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    // Simulate processing delay
    await this.simulateDelay();

    const processorTransactionId = `mock_txn_${uuidv4()}`;
    const shouldFail = Math.random() * 100 < this.failureRate;

    // Simulate different failure scenarios
    if (shouldFail) {
      const failures = [
        { code: 'INSUFFICIENT_FUNDS', message: 'Insufficient funds' },
        { code: 'CARD_DECLINED', message: 'Card was declined' },
        { code: 'INVALID_CARD', message: 'Invalid card details' },
        { code: 'PROCESSING_ERROR', message: 'Processing error occurred' }
      ];
      
      const failure = failures[Math.floor(Math.random() * failures.length)];
      
      return {
        success: false,
        processorTransactionId,
        status: 'failed',
        errorCode: failure.code,
        errorMessage: failure.message,
        processorResponse: {
          processor: 'mock',
          timestamp: new Date().toISOString(),
          error: failure
        }
      };
    }

    // Calculate mock processing fee (2.9% + $0.30)
    const processingFee = Math.round((request.amount * 0.029 + 0.30) * 100) / 100;

    // Store transaction for later retrieval
    const transaction = {
      id: processorTransactionId,
      amount: request.amount,
      currency: request.currency,
      status: 'completed',
      processingFee,
      createdAt: new Date(),
      paymentMethod: request.paymentMethod
    };

    this.transactions.set(processorTransactionId, transaction);

    return {
      success: true,
      transactionId: request.idempotencyKey || uuidv4(),
      processorTransactionId,
      status: 'completed',
      amount: request.amount,
      currency: request.currency,
      processingFee,
      processorResponse: {
        processor: 'mock',
        timestamp: new Date().toISOString(),
        transactionId: processorTransactionId,
        status: 'completed'
      }
    };
  }

  async processRefund(request: RefundRequest): Promise<RefundResponse> {
    await this.simulateDelay();

    const transaction = this.transactions.get(request.processorTransactionId);
    
    if (!transaction) {
      return {
        success: false,
        status: 'failed',
        errorCode: 'TRANSACTION_NOT_FOUND',
        errorMessage: 'Original transaction not found'
      };
    }

    const refundAmount = request.amount || transaction.amount;
    const processorRefundId = `mock_refund_${uuidv4()}`;

    // Simulate occasional refund failures
    const shouldFail = Math.random() * 100 < (this.failureRate / 2);
    
    if (shouldFail) {
      return {
        success: false,
        status: 'failed',
        errorCode: 'REFUND_FAILED',
        errorMessage: 'Refund processing failed',
        processorResponse: {
          processor: 'mock',
          refundId: processorRefundId,
          error: 'Processing error'
        }
      };
    }

    return {
      success: true,
      refundId: processorRefundId,
      processorRefundId,
      amount: refundAmount,
      currency: transaction.currency,
      status: 'completed',
      processorResponse: {
        processor: 'mock',
        refundId: processorRefundId,
        status: 'completed',
        timestamp: new Date().toISOString()
      }
    };
  }

  async processPayout(request: PayoutRequest): Promise<PayoutResponse> {
    await this.simulateDelay();

    const processorPayoutId = `mock_payout_${uuidv4()}`;
    const shouldFail = Math.random() * 100 < (this.failureRate / 3);

    if (shouldFail) {
      return {
        success: false,
        status: 'failed',
        errorCode: 'PAYOUT_FAILED',
        errorMessage: 'Payout processing failed'
      };
    }

    // Calculate payout fee (typically $0.25 for bank transfers)
    const processingFee = request.destination.type === 'bank_account' ? 0.25 : 0;
    
    // Estimate arrival time (1-3 business days for bank transfers)
    const estimatedArrival = new Date();
    estimatedArrival.setDate(estimatedArrival.getDate() + Math.floor(Math.random() * 3) + 1);

    return {
      success: true,
      payoutId: uuidv4(),
      processorPayoutId,
      status: 'processing',
      amount: request.amount,
      currency: request.currency,
      processingFee,
      estimatedArrival,
      processorResponse: {
        processor: 'mock',
        payoutId: processorPayoutId,
        status: 'processing',
        estimatedArrival: estimatedArrival.toISOString()
      }
    };
  }

  async getTransactionStatus(processorTransactionId: string): Promise<PaymentResponse> {
    await this.simulateDelay(200); // Shorter delay for status checks

    const transaction = this.transactions.get(processorTransactionId);
    
    if (!transaction) {
      return {
        success: false,
        status: 'failed',
        errorCode: 'TRANSACTION_NOT_FOUND',
        errorMessage: 'Transaction not found'
      };
    }

    return {
      success: true,
      processorTransactionId,
      status: transaction.status,
      amount: transaction.amount,
      currency: transaction.currency,
      processingFee: transaction.processingFee,
      processorResponse: {
        processor: 'mock',
        transaction: transaction
      }
    };
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    // Mock verification - in real implementation, verify actual signature
    return signature.startsWith('mock_signature_');
  }

  parseWebhookEvent(payload: string): WebhookEvent {
    try {
      const data = JSON.parse(payload);
      return {
        id: data.id || uuidv4(),
        type: data.type || 'payment.completed',
        data: data.data || {},
        timestamp: new Date(data.timestamp || Date.now())
      };
    } catch (error) {
      throw new Error('Invalid webhook payload');
    }
  }

  async healthCheck(): Promise<{ healthy: boolean; message?: string; details?: Record<string, any> }> {
    await this.simulateDelay(100);

    return {
      healthy: true,
      message: 'Mock processor is operational',
      details: {
        processor: 'mock',
        version: this.getVersion(),
        transactionCount: this.transactions.size,
        failureRate: this.failureRate,
        uptime: '100%'
      }
    };
  }

  getSupportedFeatures() {
    return {
      payouts: true,
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
      'bank_account',
      'digital_wallet'
    ];
  }

  calculateFees(amount: number, currency: string, paymentMethod: string): { processingFee: number; platformFee?: number } {
    // Mock fee structure similar to standard processors
    let processingFee = 0;
    
    switch (paymentMethod) {
      case 'credit_card':
        processingFee = Math.round((amount * 0.029 + 0.30) * 100) / 100;
        break;
      case 'bank_account':
        processingFee = Math.round((amount * 0.008 + 0.00) * 100) / 100;
        break;
      case 'digital_wallet':
        processingFee = Math.round((amount * 0.034 + 0.30) * 100) / 100;
        break;
      default:
        processingFee = Math.round((amount * 0.029 + 0.30) * 100) / 100;
    }

    return {
      processingFee,
      platformFee: Math.round(amount * 0.05 * 100) / 100 // 5% platform fee
    };
  }

  // Helper methods
  private async simulateDelay(customDelay?: number): Promise<void> {
    const delay = customDelay || this.delay;
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Test utilities
  setFailureRate(rate: number): void {
    this.failureRate = Math.max(0, Math.min(100, rate));
  }

  setDelay(delay: number): void {
    this.delay = Math.max(0, delay);
  }

  clearTransactions(): void {
    this.transactions.clear();
  }

  getTransactionCount(): number {
    return this.transactions.size;
  }

  // Simulate webhook events for testing
  simulateWebhookEvent(type: string, transactionId: string, data?: Record<string, any>): WebhookEvent {
    return {
      id: `mock_event_${uuidv4()}`,
      type,
      data: {
        transactionId,
        processor: 'mock',
        timestamp: new Date().toISOString(),
        ...data
      },
      timestamp: new Date(),
      signature: `mock_signature_${uuidv4()}`
    };
  }
}