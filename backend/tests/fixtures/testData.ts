// 📊 FANZ Backend - Test Data Fixtures
import { PaymentRequest, RefundRequest, PayoutRequest } from '../../src/types/payments';

export const testUsers = {
  validUser: {
    id: 'user-001',
    email: 'test@example.com',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    country: 'US',
    dateOfBirth: '1990-01-01',
    isVerified: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  
  unverifiedUser: {
    id: 'user-002',
    email: 'unverified@example.com',
    username: 'unverifieduser',
    firstName: 'Unverified',
    lastName: 'User',
    country: 'US',
    dateOfBirth: '1995-01-01',
    isVerified: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  
  adminUser: {
    id: 'admin-001',
    email: 'admin@fanz.network',
    username: 'admin',
    firstName: 'Admin',
    lastName: 'User',
    country: 'US',
    dateOfBirth: '1985-01-01',
    isVerified: true,
    role: 'admin',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  }
};

export const testVendors = {
  approvedVendor: {
    id: 'vendor-001',
    name: 'Test Vendor Corp',
    email: 'vendor@testcorp.com',
    status: 'approved',
    businessType: 'corporation',
    country: 'US',
    taxId: '123456789',
    website: 'https://testcorp.com',
    description: 'A test vendor for automated testing',
    verificationStatus: 'verified',
    riskLevel: 'low',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  
  pendingVendor: {
    id: 'vendor-002',
    name: 'Pending Vendor LLC',
    email: 'pending@vendor.com',
    status: 'pending',
    businessType: 'llc',
    country: 'US',
    taxId: '987654321',
    website: 'https://pendingvendor.com',
    description: 'A vendor with pending approval',
    verificationStatus: 'pending',
    riskLevel: 'medium',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  
  highRiskVendor: {
    id: 'vendor-003',
    name: 'High Risk Vendor Inc',
    email: 'highrisk@vendor.com',
    status: 'approved',
    businessType: 'corporation',
    country: 'XX',
    taxId: '555666777',
    website: 'https://highriskvendor.com',
    description: 'A high-risk vendor for testing compliance',
    verificationStatus: 'flagged',
    riskLevel: 'high',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  }
};

export const testPaymentRequests: Record<string, PaymentRequest> = {
  validPayment: {
    amount: 2999, // $29.99
    currency: 'USD',
    customerId: 'user-001',
    description: 'Test payment for subscription',
    metadata: {
      subscriptionId: 'sub-123',
      planType: 'premium',
      billingCycle: 'monthly'
    }
  },
  
  largePayment: {
    amount: 50000, // $500.00
    currency: 'USD',
    customerId: 'user-001',
    description: 'Large test payment',
    metadata: {
      type: 'large-transaction',
      requiresApproval: true
    }
  },
  
  internationalPayment: {
    amount: 1999,
    currency: 'EUR',
    customerId: 'user-002',
    description: 'International payment test',
    metadata: {
      region: 'EU',
      vatIncluded: true
    }
  },
  
  microPayment: {
    amount: 99, // $0.99
    currency: 'USD',
    customerId: 'user-001',
    description: 'Micro payment test',
    metadata: {
      type: 'tip',
      contentId: 'content-456'
    }
  },
  
  invalidPayment: {
    amount: -100, // Invalid negative amount
    currency: 'USD',
    customerId: 'user-001',
    description: 'Invalid payment for testing error handling'
  }
};

export const testRefundRequests: Record<string, RefundRequest> = {
  fullRefund: {
    transactionId: 'txn-123',
    amount: 2999,
    reason: 'Customer requested full refund'
  },
  
  partialRefund: {
    transactionId: 'txn-124',
    amount: 1000,
    reason: 'Partial refund for defective item'
  },
  
  invalidRefund: {
    transactionId: 'invalid-txn',
    amount: 999,
    reason: 'Refund for non-existent transaction'
  }
};

export const testPayoutRequests: Record<string, PayoutRequest> = {
  validPayout: {
    amount: 8500, // $85.00
    currency: 'USD',
    recipientId: 'vendor-001',
    description: 'Monthly vendor payout',
    metadata: {
      period: '2024-01',
      type: 'monthly-settlement'
    }
  },
  
  largePayout: {
    amount: 150000, // $1,500.00
    currency: 'USD',
    recipientId: 'vendor-001',
    description: 'Large vendor payout',
    metadata: {
      type: 'bonus-payout',
      requiresApproval: true
    }
  },
  
  internationalPayout: {
    amount: 5000,
    currency: 'EUR',
    recipientId: 'vendor-002',
    description: 'International vendor payout',
    metadata: {
      region: 'EU',
      taxWithheld: 500
    }
  }
};

export const testApiKeys = {
  validApiKey: {
    id: 'key-001',
    vendorId: 'vendor-001',
    keyHash: 'hashed-api-key-value',
    name: 'Production API Key',
    permissions: ['payments', 'refunds', 'webhooks'],
    isActive: true,
    expiresAt: '2024-12-31T23:59:59.000Z',
    createdAt: '2024-01-01T00:00:00.000Z',
    lastUsedAt: '2024-01-15T10:30:00.000Z'
  },
  
  expiredApiKey: {
    id: 'key-002',
    vendorId: 'vendor-002',
    keyHash: 'expired-api-key-hash',
    name: 'Expired API Key',
    permissions: ['payments'],
    isActive: true,
    expiresAt: '2023-12-31T23:59:59.000Z',
    createdAt: '2023-01-01T00:00:00.000Z',
    lastUsedAt: '2023-12-30T15:45:00.000Z'
  },
  
  restrictedApiKey: {
    id: 'key-003',
    vendorId: 'vendor-003',
    keyHash: 'restricted-api-key-hash',
    name: 'Restricted API Key',
    permissions: ['payments'], // No refund permissions
    isActive: true,
    expiresAt: '2024-12-31T23:59:59.000Z',
    createdAt: '2024-01-01T00:00:00.000Z',
    lastUsedAt: null
  }
};

export const testTransactions = {
  completedTransaction: {
    id: 'txn-001',
    amount: 2999,
    currency: 'USD',
    status: 'completed',
    customerId: 'user-001',
    vendorId: 'vendor-001',
    processorType: 'mock',
    processorTransactionId: 'mock_123456789',
    description: 'Test completed transaction',
    createdAt: '2024-01-01T10:00:00.000Z',
    completedAt: '2024-01-01T10:00:05.000Z',
    metadata: {
      subscriptionId: 'sub-123'
    }
  },
  
  failedTransaction: {
    id: 'txn-002',
    amount: 4999,
    currency: 'USD',
    status: 'failed',
    customerId: 'user-002',
    vendorId: 'vendor-001',
    processorType: 'mock',
    processorTransactionId: null,
    description: 'Test failed transaction',
    errorMessage: 'Insufficient funds',
    createdAt: '2024-01-01T11:00:00.000Z',
    failedAt: '2024-01-01T11:00:03.000Z'
  },
  
  pendingTransaction: {
    id: 'txn-003',
    amount: 1999,
    currency: 'USD',
    status: 'pending',
    customerId: 'user-001',
    vendorId: 'vendor-002',
    processorType: 'mock',
    processorTransactionId: 'mock_pending_123',
    description: 'Test pending transaction',
    createdAt: '2024-01-01T12:00:00.000Z'
  }
};

export const testWebhookData = {
  paymentCompleted: {
    type: 'payment.completed',
    id: 'webhook-001',
    data: {
      transactionId: 'txn-001',
      amount: 2999,
      currency: 'USD',
      status: 'completed',
      processorTransactionId: 'mock_123456789'
    },
    timestamp: '2024-01-01T10:00:05.000Z'
  },
  
  paymentFailed: {
    type: 'payment.failed',
    id: 'webhook-002',
    data: {
      transactionId: 'txn-002',
      amount: 4999,
      currency: 'USD',
      status: 'failed',
      errorCode: 'insufficient_funds',
      errorMessage: 'Insufficient funds'
    },
    timestamp: '2024-01-01T11:00:03.000Z'
  },
  
  refundCompleted: {
    type: 'refund.completed',
    id: 'webhook-003',
    data: {
      refundId: 'ref-001',
      transactionId: 'txn-001',
      amount: 2999,
      status: 'completed'
    },
    timestamp: '2024-01-01T14:00:00.000Z'
  }
};

export const testConfig = {
  testDatabaseUrl: 'postgresql://test_user:test_password@localhost:5432/fanz_test',
  testRedisUrl: 'redis://localhost:6380/1',
  testJwtSecret: 'test-jwt-secret-for-testing-only',
  testApiTimeout: 5000,
  testRetryCount: 3,
  testDelayBetweenRequests: 100
};

// Helper functions for generating test data
export const generateTestUser = (overrides: Partial<typeof testUsers.validUser> = {}) => {
  return {
    ...testUsers.validUser,
    id: `user-${Math.random().toString(36).substring(2, 15)}`,
    email: `test-${Math.random().toString(36).substring(2, 8)}@example.com`,
    ...overrides
  };
};

export const generateTestPaymentRequest = (overrides: Partial<PaymentRequest> = {}): PaymentRequest => {
  return {
    ...testPaymentRequests.validPayment,
    ...overrides
  };
};

export const generateTestTransaction = (overrides: any = {}) => {
  return {
    ...testTransactions.completedTransaction,
    id: `txn-${Math.random().toString(36).substring(2, 15)}`,
    ...overrides
  };
};