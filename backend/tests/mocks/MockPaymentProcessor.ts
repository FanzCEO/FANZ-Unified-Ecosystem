// 🎭 FANZ Backend - Mock Payment Processor for Testing
import { 
  PaymentProcessor, 
  PaymentRequest, 
  PaymentResponse, 
  RefundRequest, 
  RefundResponse,
  PayoutRequest,
  PayoutResponse,
  WebhookData,
  PaymentStatus,
  RefundStatus,
  PayoutStatus
} from '../../src/types/payments';

export class MockPaymentProcessor implements PaymentProcessor {
  private transactions = new Map<string, any>();
  private refunds = new Map<string, any>();
  private payouts = new Map<string, any>();
  private successRate: number;
  private simulatedDelay: number;

  constructor(options: { 
    successRate?: number; 
    simulatedDelay?: number;
  } = {}) {
    this.successRate = options.successRate ?? 0.95;
    this.simulatedDelay = options.simulatedDelay ?? 100;
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    await this.delay(this.simulatedDelay);
    
    const transactionId = this.generateTransactionId();
    const shouldSucceed = Math.random() < this.successRate;
    
    if (!shouldSucceed) {
      return {
        success: false,
        transactionId,
        status: PaymentStatus.FAILED,
        errorMessage: 'Mock payment failed',
        processorResponse: {
          code: 'MOCK_FAILURE',
          message: 'Simulated payment failure'
        }
      };
    }

    // Simulate different scenarios based on amount
    if (request.amount > 100000) { // $1000+
      return {
        success: false,
        transactionId,
        status: PaymentStatus.FAILED,
        errorMessage: 'Amount exceeds limit',
        processorResponse: {
          code: 'AMOUNT_EXCEEDED',
          message: 'Transaction amount too high'
        }
      };
    }

    const transaction = {
      id: transactionId,
      amount: request.amount,
      currency: request.currency,
      customerId: request.customerId,
      status: PaymentStatus.COMPLETED,
      createdAt: new Date().toISOString(),
      metadata: request.metadata
    };

    this.transactions.set(transactionId, transaction);

    return {
      success: true,
      transactionId,
      status: PaymentStatus.COMPLETED,
      processorResponse: {
        code: 'SUCCESS',
        message: 'Payment processed successfully',
        transactionId,
        amount: request.amount,
        currency: request.currency
      }
    };
  }

  async refundPayment(request: RefundRequest): Promise<RefundResponse> {
    await this.delay(this.simulatedDelay);
    
    const refundId = this.generateTransactionId();
    const transaction = this.transactions.get(request.transactionId);
    
    if (!transaction) {
      return {
        success: false,
        refundId,
        status: RefundStatus.FAILED,
        errorMessage: 'Original transaction not found',
        processorResponse: {
          code: 'TRANSACTION_NOT_FOUND',
          message: 'Original transaction does not exist'
        }
      };
    }

    if (request.amount > transaction.amount) {
      return {
        success: false,
        refundId,
        status: RefundStatus.FAILED,
        errorMessage: 'Refund amount exceeds original transaction amount',
        processorResponse: {
          code: 'AMOUNT_EXCEEDED',
          message: 'Refund amount too high'
        }
      };
    }

    const shouldSucceed = Math.random() < this.successRate;
    if (!shouldSucceed) {
      return {
        success: false,
        refundId,
        status: RefundStatus.FAILED,
        errorMessage: 'Mock refund failed',
        processorResponse: {
          code: 'MOCK_REFUND_FAILURE',
          message: 'Simulated refund failure'
        }
      };
    }

    const refund = {
      id: refundId,
      transactionId: request.transactionId,
      amount: request.amount,
      status: RefundStatus.COMPLETED,
      createdAt: new Date().toISOString(),
      reason: request.reason
    };

    this.refunds.set(refundId, refund);

    return {
      success: true,
      refundId,
      status: RefundStatus.COMPLETED,
      processorResponse: {
        code: 'SUCCESS',
        message: 'Refund processed successfully',
        refundId,
        amount: request.amount
      }
    };
  }

  async processPayout(request: PayoutRequest): Promise<PayoutResponse> {
    await this.delay(this.simulatedDelay);
    
    const payoutId = this.generateTransactionId();
    const shouldSucceed = Math.random() < this.successRate;
    
    if (!shouldSucceed) {
      return {
        success: false,
        payoutId,
        status: PayoutStatus.FAILED,
        errorMessage: 'Mock payout failed',
        processorResponse: {
          code: 'MOCK_PAYOUT_FAILURE',
          message: 'Simulated payout failure'
        }
      };
    }

    const payout = {
      id: payoutId,
      amount: request.amount,
      currency: request.currency,
      recipientId: request.recipientId,
      status: PayoutStatus.COMPLETED,
      createdAt: new Date().toISOString(),
      metadata: request.metadata
    };

    this.payouts.set(payoutId, payout);

    return {
      success: true,
      payoutId,
      status: PayoutStatus.COMPLETED,
      processorResponse: {
        code: 'SUCCESS',
        message: 'Payout processed successfully',
        payoutId,
        amount: request.amount,
        currency: request.currency
      }
    };
  }

  async handleWebhook(data: WebhookData): Promise<boolean> {
    await this.delay(50); // Small delay to simulate processing
    
    // Mock webhook validation - always return true for testing
    return true;
  }

  // Test helper methods
  getTransaction(transactionId: string) {
    return this.transactions.get(transactionId);
  }

  getRefund(refundId: string) {
    return this.refunds.get(refundId);
  }

  getPayout(payoutId: string) {
    return this.payouts.get(payoutId);
  }

  getAllTransactions() {
    return Array.from(this.transactions.values());
  }

  getAllRefunds() {
    return Array.from(this.refunds.values());
  }

  getAllPayouts() {
    return Array.from(this.payouts.values());
  }

  clearAll() {
    this.transactions.clear();
    this.refunds.clear();
    this.payouts.clear();
  }

  setSuccessRate(rate: number) {
    this.successRate = Math.max(0, Math.min(1, rate));
  }

  setSimulatedDelay(delay: number) {
    this.simulatedDelay = Math.max(0, delay);
  }

  // Simulate specific failure scenarios for testing
  simulateFailure(type: 'payment' | 'refund' | 'payout', reason?: string) {
    const originalRate = this.successRate;
    this.successRate = 0; // Force failure
    
    // Return a function to restore original success rate
    return () => {
      this.successRate = originalRate;
    };
  }

  private generateTransactionId(): string {
    return `mock_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}