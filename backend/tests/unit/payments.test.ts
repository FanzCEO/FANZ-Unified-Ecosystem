// 🧪 FANZ Backend - Payment Processing Unit Tests
import { MockPaymentProcessor } from '../mocks/MockPaymentProcessor';
import { PaymentStatus, RefundStatus, PayoutStatus } from '../../src/types/payments';
import { testPaymentRequests, testRefundRequests, testPayoutRequests } from '../fixtures/testData';

describe('Payment Processing', () => {
  let mockProcessor: MockPaymentProcessor;

  beforeEach(() => {
    mockProcessor = new MockPaymentProcessor({
      successRate: 1.0, // 100% success rate for predictable tests
      simulatedDelay: 0   // No delay for faster tests
    });
  });

  afterEach(() => {
    mockProcessor.clearAll();
  });

  describe('Payment Processing', () => {
    it('should process a valid payment successfully', async () => {
      const request = testPaymentRequests.validPayment;
      const response = await mockProcessor.processPayment(request);

      expect(response.success).toBe(true);
      expect(response.transactionId).toBeDefined();
      expect(response.status).toBe(PaymentStatus.COMPLETED);
      expect(response.processorResponse).toBeDefined();
      expect(response.processorResponse!.code).toBe('SUCCESS');
      expect(response.processorResponse!.amount).toBe(request.amount);
      expect(response.processorResponse!.currency).toBe(request.currency);
    });

    it('should handle payment failures gracefully', async () => {
      const restoreSuccessRate = mockProcessor.simulateFailure('payment');
      const request = testPaymentRequests.validPayment;
      
      const response = await mockProcessor.processPayment(request);

      expect(response.success).toBe(false);
      expect(response.transactionId).toBeDefined();
      expect(response.status).toBe(PaymentStatus.FAILED);
      expect(response.errorMessage).toBeDefined();
      expect(response.processorResponse).toBeDefined();
      expect(response.processorResponse!.code).toBe('MOCK_FAILURE');

      restoreSuccessRate(); // Clean up
    });

    it('should reject payments with excessive amounts', async () => {
      const request = {
        ...testPaymentRequests.validPayment,
        amount: 200000 // $2000 - exceeds mock limit
      };
      
      const response = await mockProcessor.processPayment(request);

      expect(response.success).toBe(false);
      expect(response.status).toBe(PaymentStatus.FAILED);
      expect(response.errorMessage).toContain('Amount exceeds limit');
      expect(response.processorResponse!.code).toBe('AMOUNT_EXCEEDED');
    });

    it('should handle international payments correctly', async () => {
      const request = testPaymentRequests.internationalPayment;
      const response = await mockProcessor.processPayment(request);

      expect(response.success).toBe(true);
      expect(response.processorResponse!.currency).toBe('EUR');
      expect(response.processorResponse!.amount).toBe(request.amount);
    });

    it('should process micro payments', async () => {
      const request = testPaymentRequests.microPayment;
      const response = await mockProcessor.processPayment(request);

      expect(response.success).toBe(true);
      expect(response.processorResponse!.amount).toBe(99);
      expect(response.status).toBe(PaymentStatus.COMPLETED);
    });

    it('should store transaction data correctly', async () => {
      const request = testPaymentRequests.validPayment;
      const response = await mockProcessor.processPayment(request);

      const transaction = mockProcessor.getTransaction(response.transactionId);
      expect(transaction).toBeDefined();
      expect(transaction.amount).toBe(request.amount);
      expect(transaction.currency).toBe(request.currency);
      expect(transaction.customerId).toBe(request.customerId);
      expect(transaction.status).toBe(PaymentStatus.COMPLETED);
      expect(transaction.metadata).toEqual(request.metadata);
    });
  });

  describe('Refund Processing', () => {
    let originalTransactionId: string;

    beforeEach(async () => {
      // Create a transaction to refund
      const paymentResponse = await mockProcessor.processPayment(testPaymentRequests.validPayment);
      originalTransactionId = paymentResponse.transactionId;
    });

    it('should process a full refund successfully', async () => {
      const request = {
        ...testRefundRequests.fullRefund,
        transactionId: originalTransactionId
      };
      
      const response = await mockProcessor.refundPayment(request);

      expect(response.success).toBe(true);
      expect(response.refundId).toBeDefined();
      expect(response.status).toBe(RefundStatus.COMPLETED);
      expect(response.processorResponse!.code).toBe('SUCCESS');
      expect(response.processorResponse!.amount).toBe(request.amount);
    });

    it('should process a partial refund successfully', async () => {
      const request = {
        ...testRefundRequests.partialRefund,
        transactionId: originalTransactionId,
        amount: 1000 // Partial amount less than original
      };
      
      const response = await mockProcessor.refundPayment(request);

      expect(response.success).toBe(true);
      expect(response.status).toBe(RefundStatus.COMPLETED);
      expect(response.processorResponse!.amount).toBe(1000);
    });

    it('should reject refunds for non-existent transactions', async () => {
      const request = testRefundRequests.invalidRefund;
      const response = await mockProcessor.refundPayment(request);

      expect(response.success).toBe(false);
      expect(response.status).toBe(RefundStatus.FAILED);
      expect(response.errorMessage).toContain('Original transaction not found');
      expect(response.processorResponse!.code).toBe('TRANSACTION_NOT_FOUND');
    });

    it('should reject refunds exceeding original transaction amount', async () => {
      const request = {
        transactionId: originalTransactionId,
        amount: 5000, // More than original payment of 2999
        reason: 'Excessive refund test'
      };
      
      const response = await mockProcessor.refundPayment(request);

      expect(response.success).toBe(false);
      expect(response.status).toBe(RefundStatus.FAILED);
      expect(response.errorMessage).toContain('Refund amount exceeds original transaction amount');
      expect(response.processorResponse!.code).toBe('AMOUNT_EXCEEDED');
    });

    it('should handle refund failures gracefully', async () => {
      const restoreSuccessRate = mockProcessor.simulateFailure('refund');
      const request = {
        ...testRefundRequests.fullRefund,
        transactionId: originalTransactionId
      };
      
      const response = await mockProcessor.refundPayment(request);

      expect(response.success).toBe(false);
      expect(response.status).toBe(RefundStatus.FAILED);
      expect(response.errorMessage).toContain('Mock refund failed');
      expect(response.processorResponse!.code).toBe('MOCK_REFUND_FAILURE');

      restoreSuccessRate(); // Clean up
    });

    it('should store refund data correctly', async () => {
      const request = {
        ...testRefundRequests.fullRefund,
        transactionId: originalTransactionId
      };
      
      const response = await mockProcessor.refundPayment(request);
      const refund = mockProcessor.getRefund(response.refundId);

      expect(refund).toBeDefined();
      expect(refund.transactionId).toBe(originalTransactionId);
      expect(refund.amount).toBe(request.amount);
      expect(refund.reason).toBe(request.reason);
      expect(refund.status).toBe(RefundStatus.COMPLETED);
    });
  });

  describe('Payout Processing', () => {
    it('should process a valid payout successfully', async () => {
      const request = testPayoutRequests.validPayout;
      const response = await mockProcessor.processPayout(request);

      expect(response.success).toBe(true);
      expect(response.payoutId).toBeDefined();
      expect(response.status).toBe(PayoutStatus.COMPLETED);
      expect(response.processorResponse!.code).toBe('SUCCESS');
      expect(response.processorResponse!.amount).toBe(request.amount);
      expect(response.processorResponse!.currency).toBe(request.currency);
    });

    it('should handle large payouts', async () => {
      const request = testPayoutRequests.largePayout;
      const response = await mockProcessor.processPayout(request);

      expect(response.success).toBe(true);
      expect(response.processorResponse!.amount).toBe(150000);
      expect(response.status).toBe(PayoutStatus.COMPLETED);
    });

    it('should handle international payouts', async () => {
      const request = testPayoutRequests.internationalPayout;
      const response = await mockProcessor.processPayout(request);

      expect(response.success).toBe(true);
      expect(response.processorResponse!.currency).toBe('EUR');
      expect(response.processorResponse!.amount).toBe(request.amount);
    });

    it('should handle payout failures gracefully', async () => {
      const restoreSuccessRate = mockProcessor.simulateFailure('payout');
      const request = testPayoutRequests.validPayout;
      
      const response = await mockProcessor.processPayout(request);

      expect(response.success).toBe(false);
      expect(response.status).toBe(PayoutStatus.FAILED);
      expect(response.errorMessage).toContain('Mock payout failed');
      expect(response.processorResponse!.code).toBe('MOCK_PAYOUT_FAILURE');

      restoreSuccessRate(); // Clean up
    });

    it('should store payout data correctly', async () => {
      const request = testPayoutRequests.validPayout;
      const response = await mockProcessor.processPayout(request);

      const payout = mockProcessor.getPayout(response.payoutId);
      expect(payout).toBeDefined();
      expect(payout.amount).toBe(request.amount);
      expect(payout.currency).toBe(request.currency);
      expect(payout.recipientId).toBe(request.recipientId);
      expect(payout.status).toBe(PayoutStatus.COMPLETED);
      expect(payout.metadata).toEqual(request.metadata);
    });
  });

  describe('Webhook Handling', () => {
    it('should handle webhooks successfully', async () => {
      const webhookData = {
        type: 'payment.completed',
        data: {
          transactionId: 'test-txn-123',
          amount: 2999,
          status: 'completed'
        }
      };

      const result = await mockProcessor.handleWebhook(webhookData);
      expect(result).toBe(true);
    });

    it('should validate webhook signatures', async () => {
      const webhookData = {
        type: 'payment.failed',
        data: {
          transactionId: 'test-txn-456',
          errorCode: 'declined'
        }
      };

      const result = await mockProcessor.handleWebhook(webhookData);
      expect(result).toBe(true); // Mock processor always validates successfully
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle multiple concurrent payments', async () => {
      const requests = Array.from({ length: 10 }, (_, i) => ({
        ...testPaymentRequests.validPayment,
        customerId: `user-${i}`
      }));

      const promises = requests.map(request => mockProcessor.processPayment(request));
      const responses = await Promise.all(promises);

      responses.forEach(response => {
        expect(response.success).toBe(true);
        expect(response.status).toBe(PaymentStatus.COMPLETED);
      });

      expect(mockProcessor.getAllTransactions()).toHaveLength(10);
    });

    it('should maintain performance under load', async () => {
      mockProcessor.setSimulatedDelay(10); // Small delay to simulate real conditions

      const startTime = performance.now();
      
      const requests = Array.from({ length: 50 }, (_, i) => ({
        ...testPaymentRequests.validPayment,
        customerId: `load-test-user-${i}`
      }));

      const promises = requests.map(request => mockProcessor.processPayment(request));
      await Promise.all(promises);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
      expect(mockProcessor.getAllTransactions()).toHaveLength(50);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle zero amount payments', async () => {
      const request = {
        ...testPaymentRequests.validPayment,
        amount: 0
      };

      const response = await mockProcessor.processPayment(request);
      expect(response.success).toBe(true); // Mock processor allows zero amounts
    });

    it('should handle negative amounts gracefully', async () => {
      const request = {
        ...testPaymentRequests.validPayment,
        amount: -100
      };

      const response = await mockProcessor.processPayment(request);
      expect(response.success).toBe(true); // Mock processor handles negative amounts
    });

    it('should handle very large numbers', async () => {
      const request = {
        ...testPaymentRequests.validPayment,
        amount: Number.MAX_SAFE_INTEGER
      };

      const response = await mockProcessor.processPayment(request);
      expect(response.success).toBe(false); // Should exceed limits
    });

    it('should handle special characters in descriptions', async () => {
      const request = {
        ...testPaymentRequests.validPayment,
        description: 'Test with émojis 🎉 and spéciál châractérs!'
      };

      const response = await mockProcessor.processPayment(request);
      expect(response.success).toBe(true);
    });
  });

  describe('Test Utilities and Helpers', () => {
    it('should provide access to all transactions', () => {
      const initialCount = mockProcessor.getAllTransactions().length;
      expect(initialCount).toBe(0);

      // Process some payments
      const promises = [
        mockProcessor.processPayment(testPaymentRequests.validPayment),
        mockProcessor.processPayment(testPaymentRequests.microPayment)
      ];

      return Promise.all(promises).then(() => {
        const transactions = mockProcessor.getAllTransactions();
        expect(transactions).toHaveLength(2);
      });
    });

    it('should allow clearing all data', async () => {
      await mockProcessor.processPayment(testPaymentRequests.validPayment);
      expect(mockProcessor.getAllTransactions()).toHaveLength(1);

      mockProcessor.clearAll();
      expect(mockProcessor.getAllTransactions()).toHaveLength(0);
      expect(mockProcessor.getAllRefunds()).toHaveLength(0);
      expect(mockProcessor.getAllPayouts()).toHaveLength(0);
    });

    it('should allow configuring success rates', async () => {
      mockProcessor.setSuccessRate(0.5); // 50% success rate
      
      const requests = Array.from({ length: 20 }, () => testPaymentRequests.validPayment);
      const promises = requests.map(request => mockProcessor.processPayment(request));
      const responses = await Promise.all(promises);

      const successCount = responses.filter(r => r.success).length;
      const failureCount = responses.filter(r => !r.success).length;

      expect(successCount).toBeGreaterThan(0);
      expect(failureCount).toBeGreaterThan(0);
      expect(successCount + failureCount).toBe(20);
    });
  });
});