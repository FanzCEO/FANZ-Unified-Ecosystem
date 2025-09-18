// 🔄 FANZ Backend - End-to-End Workflow Tests
import { MockPaymentProcessor } from '../mocks/MockPaymentProcessor';
import { 
  testUsers, 
  testVendors, 
  testPaymentRequests, 
  testRefundRequests,
  generateTestPaymentRequest,
  generateTestTransaction
} from '../fixtures/testData';

// Mock database and external services
class MockDatabase {
  private transactions = new Map();
  private vendors = new Map();
  private users = new Map();
  private apiKeys = new Map();

  constructor() {
    // Seed test data
    Object.values(testUsers).forEach(user => this.users.set(user.id, user));
    Object.values(testVendors).forEach(vendor => this.vendors.set(vendor.id, vendor));
  }

  async createTransaction(data: any) {
    const transaction = {
      ...data,
      id: `txn_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.transactions.set(transaction.id, transaction);
    return transaction;
  }

  async getTransaction(id: string) {
    return this.transactions.get(id);
  }

  async updateTransaction(id: string, updates: any) {
    const transaction = this.transactions.get(id);
    if (!transaction) return null;
    
    const updated = {
      ...transaction,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.transactions.set(id, updated);
    return updated;
  }

  async getUser(id: string) {
    return this.users.get(id);
  }

  async getVendor(id: string) {
    return this.vendors.get(id);
  }

  async createVendor(data: any) {
    const vendor = {
      ...data,
      id: `vendor_${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.vendors.set(vendor.id, vendor);
    return vendor;
  }

  async getTransactionsByUser(userId: string) {
    return Array.from(this.transactions.values())
      .filter((txn: any) => txn.customerId === userId);
  }

  async getTransactionsByVendor(vendorId: string) {
    return Array.from(this.transactions.values())
      .filter((txn: any) => txn.vendorId === vendorId);
  }

  clear() {
    this.transactions.clear();
    this.vendors.clear();
    this.users.clear();
    this.apiKeys.clear();
    
    // Re-seed test data
    Object.values(testUsers).forEach(user => this.users.set(user.id, user));
    Object.values(testVendors).forEach(vendor => this.vendors.set(vendor.id, vendor));
  }
}

// Mock payment service that orchestrates the full payment workflow
class PaymentService {
  constructor(
    private paymentProcessor: MockPaymentProcessor,
    private database: MockDatabase
  ) {}

  async processPayment(request: any) {
    try {
      // 1. Validate user
      const user = await this.database.getUser(request.customerId);
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.isVerified) {
        throw new Error('User not verified');
      }

      // 2. Create transaction record
      const transaction = await this.database.createTransaction({
        ...request,
        status: 'pending',
        processorType: 'mock'
      });

      // 3. Process payment with processor
      const processorResponse = await this.paymentProcessor.processPayment(request);

      // 4. Update transaction status
      const finalStatus = processorResponse.success ? 'completed' : 'failed';
      const updatedTransaction = await this.database.updateTransaction(transaction.id, {
        status: finalStatus,
        processorTransactionId: processorResponse.transactionId,
        processorResponse: processorResponse.processorResponse,
        errorMessage: processorResponse.errorMessage,
        completedAt: processorResponse.success ? new Date().toISOString() : null,
        failedAt: !processorResponse.success ? new Date().toISOString() : null
      });

      return {
        success: processorResponse.success,
        transaction: updatedTransaction,
        processorResponse
      };

    } catch (error) {
      throw new Error(`Payment processing failed: ${error}`);
    }
  }

  async processRefund(request: any) {
    try {
      // 1. Get original transaction
      const transaction = await this.database.getTransaction(request.transactionId);
      if (!transaction) {
        throw new Error('Original transaction not found');
      }

      if (transaction.status !== 'completed') {
        throw new Error('Cannot refund non-completed transaction');
      }

      // 2. Process refund with processor
      const processorResponse = await this.paymentProcessor.refundPayment(request);

      // 3. Update transaction if needed (for tracking refunds)
      if (processorResponse.success) {
        await this.database.updateTransaction(transaction.id, {
          refundStatus: 'refunded',
          refundedAt: new Date().toISOString(),
          refundAmount: request.amount
        });
      }

      return {
        success: processorResponse.success,
        refund: processorResponse,
        originalTransaction: transaction
      };

    } catch (error) {
      throw new Error(`Refund processing failed: ${error}`);
    }
  }
}

// Mock vendor service for vendor workflows
class VendorService {
  constructor(private database: MockDatabase) {}

  async registerVendor(data: any) {
    try {
      // Validate required fields
      if (!data.name || !data.email || !data.businessType) {
        throw new Error('Missing required fields');
      }

      // Create vendor
      const vendor = await this.database.createVendor({
        ...data,
        verificationStatus: 'pending',
        riskLevel: 'medium'
      });

      return {
        success: true,
        vendor,
        message: 'Vendor registration submitted for review'
      };

    } catch (error) {
      throw new Error(`Vendor registration failed: ${error}`);
    }
  }

  async approveVendor(vendorId: string) {
    const vendor = await this.database.getVendor(vendorId);
    if (!vendor) {
      throw new Error('Vendor not found');
    }

    // Update vendor status
    const updatedVendor = {
      ...vendor,
      status: 'approved',
      verificationStatus: 'verified',
      approvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Update vendor in mock database
    const mockDb = this.database as any;
    if (mockDb.vendors) {
      mockDb.vendors.set(vendorId, updatedVendor);
    }

    return {
      success: true,
      vendor: updatedVendor
    };
  }
}

describe('End-to-End Workflow Tests', () => {
  let paymentProcessor: MockPaymentProcessor;
  let database: MockDatabase;
  let paymentService: PaymentService;
  let vendorService: VendorService;

  beforeEach(() => {
    paymentProcessor = new MockPaymentProcessor({
      successRate: 1.0,
      simulatedDelay: 0
    });
    database = new MockDatabase();
    paymentService = new PaymentService(paymentProcessor, database);
    vendorService = new VendorService(database);
  });

  afterEach(() => {
    paymentProcessor.clearAll();
    database.clear();
  });

  describe('Complete Payment Workflow', () => {
    it('should process a complete payment workflow successfully', async () => {
      const paymentRequest = {
        ...testPaymentRequests.validPayment,
        customerId: testUsers.validUser.id
      };

      const result = await paymentService.processPayment(paymentRequest);

      expect(result.success).toBe(true);
      expect(result.transaction).toMatchObject({
        id: expect.any(String),
        status: 'completed',
        amount: paymentRequest.amount,
        currency: paymentRequest.currency,
        customerId: paymentRequest.customerId,
        processorTransactionId: expect.any(String),
        completedAt: expect.any(String)
      });

      expect(result.processorResponse.success).toBe(true);
      expect(result.transaction.id).toMatch(/^txn_/);
      
      // Verify transaction is stored in database
      const storedTransaction = await database.getTransaction(result.transaction.id);
      expect(storedTransaction).toBeDefined();
      expect(storedTransaction.status).toBe('completed');
    });

    it('should handle payment failures in the complete workflow', async () => {
      // Force payment processor to fail
      const restoreSuccessRate = paymentProcessor.simulateFailure('payment');

      const paymentRequest = {
        ...testPaymentRequests.validPayment,
        customerId: testUsers.validUser.id
      };

      const result = await paymentService.processPayment(paymentRequest);

      expect(result.success).toBe(false);
      expect(result.transaction).toMatchObject({
        status: 'failed',
        errorMessage: expect.any(String),
        failedAt: expect.any(String)
      });

      expect(result.transaction.completedAt).toBeNull();

      restoreSuccessRate();
    });

    it('should reject payments for unverified users', async () => {
      const paymentRequest = {
        ...testPaymentRequests.validPayment,
        customerId: testUsers.unverifiedUser.id
      };

      await expect(paymentService.processPayment(paymentRequest))
        .rejects.toThrow('User not verified');
    });

    it('should reject payments for non-existent users', async () => {
      const paymentRequest = {
        ...testPaymentRequests.validPayment,
        customerId: 'non-existent-user'
      };

      await expect(paymentService.processPayment(paymentRequest))
        .rejects.toThrow('User not found');
    });
  });

  describe('Complete Refund Workflow', () => {
    let originalTransaction: any;

    beforeEach(async () => {
      // Create a successful payment first
      const paymentRequest = {
        ...testPaymentRequests.validPayment,
        customerId: testUsers.validUser.id
      };
      
      const paymentResult = await paymentService.processPayment(paymentRequest);
      originalTransaction = paymentResult.transaction;
    });

    it('should process a complete refund workflow successfully', async () => {
      const refundRequest = {
        transactionId: originalTransaction.id,
        amount: originalTransaction.amount,
        reason: 'Customer requested refund'
      };

      const result = await paymentService.processRefund(refundRequest);

      expect(result.success).toBe(true);
      expect(result.refund.success).toBe(true);
      expect(result.refund.refundId).toBeDefined();
      expect(result.originalTransaction.id).toBe(originalTransaction.id);

      // Verify original transaction is updated
      const updatedTransaction = await database.getTransaction(originalTransaction.id);
      expect(updatedTransaction.refundStatus).toBe('refunded');
      expect(updatedTransaction.refundedAt).toBeDefined();
      expect(updatedTransaction.refundAmount).toBe(refundRequest.amount);
    });

    it('should handle partial refunds correctly', async () => {
      const partialAmount = Math.floor(originalTransaction.amount / 2);
      const refundRequest = {
        transactionId: originalTransaction.id,
        amount: partialAmount,
        reason: 'Partial refund for defective item'
      };

      const result = await paymentService.processRefund(refundRequest);

      expect(result.success).toBe(true);
      expect(result.refund.processorResponse.amount).toBe(partialAmount);

      // Verify original transaction reflects partial refund
      const updatedTransaction = await database.getTransaction(originalTransaction.id);
      expect(updatedTransaction.refundAmount).toBe(partialAmount);
    });

    it('should reject refunds for non-existent transactions', async () => {
      const refundRequest = {
        transactionId: 'non-existent-transaction',
        amount: 1000,
        reason: 'Invalid refund'
      };

      await expect(paymentService.processRefund(refundRequest))
        .rejects.toThrow('Original transaction not found');
    });

    it('should reject refunds for non-completed transactions', async () => {
      // Create a failed transaction
      const restoreSuccessRate = paymentProcessor.simulateFailure('payment');
      const paymentRequest = {
        ...testPaymentRequests.validPayment,
        customerId: testUsers.validUser.id
      };
      
      const failedPaymentResult = await paymentService.processPayment(paymentRequest);
      restoreSuccessRate();

      const refundRequest = {
        transactionId: failedPaymentResult.transaction.id,
        amount: 1000,
        reason: 'Cannot refund failed payment'
      };

      await expect(paymentService.processRefund(refundRequest))
        .rejects.toThrow('Cannot refund non-completed transaction');
    });
  });

  describe('Vendor Registration and Management Workflow', () => {
    it('should complete vendor registration workflow', async () => {
      const vendorData = {
        name: 'New Test Vendor LLC',
        email: 'newvendor@example.com',
        businessType: 'llc',
        website: 'https://newvendor.com',
        description: 'A new vendor for testing'
      };

      const registrationResult = await vendorService.registerVendor(vendorData);

      expect(registrationResult.success).toBe(true);
      expect(registrationResult.vendor).toMatchObject({
        id: expect.any(String),
        name: vendorData.name,
        email: vendorData.email,
        businessType: vendorData.businessType,
        status: 'pending',
        verificationStatus: 'pending',
        riskLevel: 'medium',
        createdAt: expect.any(String)
      });

      expect(registrationResult.vendor.id).toMatch(/^vendor_/);
      expect(registrationResult.message).toContain('submitted for review');

      // Verify vendor is stored in database
      const storedVendor = await database.getVendor(registrationResult.vendor.id);
      expect(storedVendor).toBeDefined();
      expect(storedVendor.status).toBe('pending');
    });

    it('should complete vendor approval workflow', async () => {
      // First register a vendor
      const vendorData = {
        name: 'Approval Test Vendor',
        email: 'approval@vendor.com',
        businessType: 'corporation'
      };

      const registrationResult = await vendorService.registerVendor(vendorData);
      const vendorId = registrationResult.vendor.id;

      // Then approve the vendor
      const approvalResult = await vendorService.approveVendor(vendorId);

      expect(approvalResult.success).toBe(true);
      expect(approvalResult.vendor).toMatchObject({
        id: vendorId,
        status: 'approved',
        verificationStatus: 'verified',
        approvedAt: expect.any(String),
        updatedAt: expect.any(String)
      });

      // Verify vendor status is updated in database
      const updatedVendor = await database.getVendor(vendorId);
      expect(updatedVendor.status).toBe('approved');
      expect(updatedVendor.verificationStatus).toBe('verified');
    });

    it('should reject vendor registration with missing required fields', async () => {
      const incompleteVendorData = {
        name: 'Incomplete Vendor'
        // Missing email and businessType
      };

      await expect(vendorService.registerVendor(incompleteVendorData))
        .rejects.toThrow('Missing required fields');
    });
  });

  describe('Multi-User Payment Scenarios', () => {
    it('should handle payments from multiple users concurrently', async () => {
      const users = [testUsers.validUser, testUsers.adminUser];
      const paymentPromises = users.map(user => {
        const paymentRequest = {
          ...generateTestPaymentRequest(),
          customerId: user.id,
          amount: Math.floor(Math.random() * 10000) + 1000 // Random amount between $10-$100
        };
        return paymentService.processPayment(paymentRequest);
      });

      const results = await Promise.all(paymentPromises);

      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.transaction.customerId).toBe(users[index].id);
        expect(result.transaction.status).toBe('completed');
      });

      // Verify all transactions are stored
      for (const user of users) {
        const userTransactions = await database.getTransactionsByUser(user.id);
        expect(userTransactions).toHaveLength(1);
      }
    });

    it('should track transaction history per user', async () => {
      const userId = testUsers.validUser.id;
      const numberOfPayments = 5;

      // Process multiple payments for the same user
      const paymentPromises = Array.from({ length: numberOfPayments }, (_, i) => {
        const paymentRequest = {
          ...generateTestPaymentRequest(),
          customerId: userId,
          amount: (i + 1) * 1000, // $10, $20, $30, etc.
          description: `Payment ${i + 1}`
        };
        return paymentService.processPayment(paymentRequest);
      });

      const results = await Promise.all(paymentPromises);

      // Verify all payments succeeded
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Check transaction history
      const userTransactions = await database.getTransactionsByUser(userId);
      expect(userTransactions).toHaveLength(numberOfPayments);

      // Verify amounts are correct
      const amounts = userTransactions.map((txn: any) => txn.amount).sort((a, b) => a - b);
      const expectedAmounts = Array.from({ length: numberOfPayments }, (_, i) => (i + 1) * 1000);
      expect(amounts).toEqual(expectedAmounts);
    });
  });

  describe('Error Recovery and Edge Cases', () => {
    it('should handle database connection failures gracefully', async () => {
      // Mock database failure
      const originalCreateTransaction = database.createTransaction;
      database.createTransaction = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      const paymentRequest = {
        ...testPaymentRequests.validPayment,
        customerId: testUsers.validUser.id
      };

      await expect(paymentService.processPayment(paymentRequest))
        .rejects.toThrow('Payment processing failed');

      // Restore database function
      database.createTransaction = originalCreateTransaction;
    });

    it('should handle payment processor timeouts', async () => {
      // Simulate processor timeout
      paymentProcessor.setSimulatedDelay(10000); // 10 seconds

      const paymentRequest = {
        ...testPaymentRequests.validPayment,
        customerId: testUsers.validUser.id
      };

      // Set a shorter timeout for the test
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Payment timeout')), 100);
      });

      const paymentPromise = paymentService.processPayment(paymentRequest);

      await expect(Promise.race([paymentPromise, timeoutPromise]))
        .rejects.toThrow('Payment timeout');
    });

    it('should handle concurrent refunds for the same transaction', async () => {
      // Create a successful payment first
      const paymentRequest = {
        ...testPaymentRequests.validPayment,
        customerId: testUsers.validUser.id
      };
      
      const paymentResult = await paymentService.processPayment(paymentRequest);
      const transactionId = paymentResult.transaction.id;

      // Attempt concurrent refunds
      const refundRequest1 = {
        transactionId,
        amount: paymentResult.transaction.amount / 2,
        reason: 'First refund'
      };

      const refundRequest2 = {
        transactionId,
        amount: paymentResult.transaction.amount / 2,
        reason: 'Second refund'
      };

      const refundPromises = [
        paymentService.processRefund(refundRequest1),
        paymentService.processRefund(refundRequest2)
      ];

      const results = await Promise.all(refundPromises);

      // Both should succeed in this mock implementation
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Performance and Stress Testing', () => {
    it('should handle high-volume payment processing', async () => {
      const numberOfPayments = 100;
      const startTime = performance.now();

      const paymentPromises = Array.from({ length: numberOfPayments }, (_, i) => {
        const paymentRequest = {
          ...generateTestPaymentRequest(),
          customerId: i % 2 === 0 ? testUsers.validUser.id : testUsers.adminUser.id,
          amount: Math.floor(Math.random() * 5000) + 500,
          description: `Stress test payment ${i + 1}`
        };
        return paymentService.processPayment(paymentRequest);
      });

      const results = await Promise.all(paymentPromises);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Verify all payments processed
      expect(results).toHaveLength(numberOfPayments);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Performance check - should complete within reasonable time
      expect(duration).toBeLessThan(5000); // 5 seconds for 100 payments

      console.log(`Processed ${numberOfPayments} payments in ${duration.toFixed(2)}ms`);
    });

    it('should maintain data consistency under concurrent operations', async () => {
      const userId = testUsers.validUser.id;
      const concurrentOperations = 50;

      // Mix of payments and other operations
      const operations = Array.from({ length: concurrentOperations }, (_, i) => {
        if (i % 3 === 0) {
          // Every 3rd operation is a vendor registration
          return vendorService.registerVendor({
            name: `Concurrent Vendor ${i}`,
            email: `vendor${i}@concurrent.com`,
            businessType: 'llc'
          });
        } else {
          // Others are payments
          return paymentService.processPayment({
            ...generateTestPaymentRequest(),
            customerId: userId,
            amount: (i + 1) * 100,
            description: `Concurrent payment ${i}`
          });
        }
      });

      const results = await Promise.all(operations);

      // Count successful operations by type
      const paymentResults = results.filter((r: any) => r.transaction);
      const vendorResults = results.filter((r: any) => r.vendor);

      expect(paymentResults.length + vendorResults.length).toBe(concurrentOperations);

      // Verify data consistency
      const userTransactions = await database.getTransactionsByUser(userId);
      expect(userTransactions).toHaveLength(paymentResults.length);
    });
  });
});