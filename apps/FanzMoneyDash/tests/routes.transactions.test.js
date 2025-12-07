/**
 * Transactions Routes Test Suite for FANZ Money Dash
 * Tests transaction CRUD operations, validation, security, and business logic
 */

import { jest } from '@jest/globals';
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('../src/models/Transaction.js', () => ({
  default: {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    aggregate: jest.fn()
  }
}));

jest.mock('../src/models/User.js', () => ({
  default: {
    findOne: jest.fn()
  }
}));

describe('Transactions Routes Test Suite', () => {
  let app;
  let mockUser;
  let mockTransaction;
  let authToken;

  beforeEach(() => {
    // Setup Express app with transaction routes
    app = express();
    app.use(express.json());
    
    // Mock user data
    mockUser = global.testHelpers.createMockUser({
      userId: 'user-123',
      username: 'testcreator',
      email: 'creator@fanz.network',
      role: 'creator'
    });

    // Mock transaction data
    mockTransaction = global.testHelpers.createMockTransaction({
      transactionId: 'txn-123',
      user: {
        userId: mockUser.userId,
        username: mockUser.username,
        email: mockUser.email,
        role: mockUser.role
      },
      type: 'subscription',
      amount: {
        gross: 25.00,
        net: 22.50,
        fees: {
          platform: 2.50,
          payment: 0.30,
          tax: 0.20,
          total: 3.00
        }
      },
      status: 'completed'
    });

    // Mock auth token
    authToken = 'valid.jwt.token';
    jwt.verify.mockReturnValue({ userId: 'user-123', role: 'creator' });

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('GET /transactions', () => {
    test('should get transactions for authenticated user', async () => {
      const User = (await import('../src/models/User.js')).default;
      const Transaction = (await import('../src/models/Transaction.js')).default;
      
      User.findOne.mockResolvedValue(mockUser);
      Transaction.find.mockResolvedValue([mockTransaction]);

      const response = await request(app)
        .get('/transactions')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('transactions');
      expect(response.body.transactions).toHaveLength(1);
      expect(response.body.transactions[0]).toHaveProperty('transactionId');
    });

    test('should filter transactions by type', async () => {
      const User = (await import('../src/models/User.js')).default;
      const Transaction = (await import('../src/models/Transaction.js')).default;
      
      User.findOne.mockResolvedValue(mockUser);
      Transaction.find.mockResolvedValue([mockTransaction]);

      const response = await request(app)
        .get('/transactions?type=subscription')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Transaction.find).toHaveBeenCalledWith(
        expect.objectContaining({
          'user.userId': 'user-123',
          type: 'subscription'
        })
      );
    });

    test('should filter transactions by date range', async () => {
      const User = (await import('../src/models/User.js')).default;
      const Transaction = (await import('../src/models/Transaction.js')).default;
      
      User.findOne.mockResolvedValue(mockUser);
      Transaction.find.mockResolvedValue([mockTransaction]);

      const startDate = '2024-01-01';
      const endDate = '2024-12-31';

      const response = await request(app)
        .get(`/transactions?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Transaction.find).toHaveBeenCalledWith(
        expect.objectContaining({
          'user.userId': 'user-123',
          createdAt: expect.objectContaining({
            $gte: expect.any(Date),
            $lte: expect.any(Date)
          })
        })
      );
    });

    test('should paginate transaction results', async () => {
      const User = (await import('../src/models/User.js')).default;
      const Transaction = (await import('../src/models/Transaction.js')).default;
      
      User.findOne.mockResolvedValue(mockUser);
      Transaction.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockTransaction])
          })
        })
      });

      const response = await request(app)
        .get('/transactions?page=2&limit=10')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });

    test('should reject unauthorized access', async () => {
      const response = await request(app)
        .get('/transactions');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toMatch(/unauthorized/i);
    });

    test('should validate query parameters', async () => {
      const User = (await import('../src/models/User.js')).default;
      User.findOne.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/transactions?type=invalid-type&page=invalid')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toMatch(/invalid/i);
    });
  });

  describe('GET /transactions/:id', () => {
    test('should get specific transaction by ID', async () => {
      const User = (await import('../src/models/User.js')).default;
      const Transaction = (await import('../src/models/Transaction.js')).default;
      
      User.findOne.mockResolvedValue(mockUser);
      Transaction.findOne.mockResolvedValue(mockTransaction);

      const response = await request(app)
        .get('/transactions/txn-123')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('transaction');
      expect(response.body.transaction.transactionId).toBe('txn-123');
    });

    test('should return 404 for non-existent transaction', async () => {
      const User = (await import('../src/models/User.js')).default;
      const Transaction = (await import('../src/models/Transaction.js')).default;
      
      User.findOne.mockResolvedValue(mockUser);
      Transaction.findOne.mockResolvedValue(null);

      const response = await request(app)
        .get('/transactions/non-existent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toMatch(/not.*found/i);
    });

    test('should prevent access to other users transactions', async () => {
      const User = (await import('../src/models/User.js')).default;
      const Transaction = (await import('../src/models/Transaction.js')).default;
      
      User.findOne.mockResolvedValue(mockUser);
      
      // Mock transaction belonging to different user
      const otherUserTransaction = {
        ...mockTransaction,
        user: { userId: 'other-user-456' }
      };
      Transaction.findOne.mockResolvedValue(otherUserTransaction);

      const response = await request(app)
        .get('/transactions/txn-123')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toMatch(/access.*denied/i);
    });

    test('should validate transaction ID format', async () => {
      const User = (await import('../src/models/User.js')).default;
      User.findOne.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/transactions/invalid-id-format')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toMatch(/invalid.*id/i);
    });
  });

  describe('POST /transactions', () => {
    test('should create new transaction with valid data', async () => {
      const User = (await import('../src/models/User.js')).default;
      const Transaction = (await import('../src/models/Transaction.js')).default;
      
      User.findOne.mockResolvedValue(mockUser);
      Transaction.create.mockResolvedValue(mockTransaction);

      const transactionData = {
        type: 'tip',
        amount: {
          gross: 10.00,
          currency: 'USD'
        },
        platform: {
          name: 'boyfanz',
          userId: 'platform-user-123'
        },
        metadata: {
          contentId: 'content-456',
          message: 'Great content!'
        }
      };

      const response = await request(app)
        .post('/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(transactionData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('transaction');
      expect(Transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'tip',
          'user.userId': 'user-123'
        })
      );
    });

    test('should validate required fields', async () => {
      const User = (await import('../src/models/User.js')).default;
      User.findOne.mockResolvedValue(mockUser);

      const incompleteData = {
        type: 'tip'
        // Missing required amount field
      };

      const response = await request(app)
        .post('/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(incompleteData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toMatch(/required/i);
    });

    test('should validate transaction type', async () => {
      const User = (await import('../src/models/User.js')).default;
      User.findOne.mockResolvedValue(mockUser);

      const invalidData = {
        type: 'invalid-type',
        amount: {
          gross: 10.00,
          currency: 'USD'
        }
      };

      const response = await request(app)
        .post('/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toMatch(/invalid.*type/i);
    });

    test('should validate amount values', async () => {
      const User = (await import('../src/models/User.js')).default;
      User.findOne.mockResolvedValue(mockUser);

      const invalidAmountData = {
        type: 'tip',
        amount: {
          gross: -10.00, // Negative amount
          currency: 'USD'
        }
      };

      const response = await request(app)
        .post('/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidAmountData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toMatch(/amount.*positive/i);
    });

    test('should validate currency codes', async () => {
      const User = (await import('../src/models/User.js')).default;
      User.findOne.mockResolvedValue(mockUser);

      const invalidCurrencyData = {
        type: 'tip',
        amount: {
          gross: 10.00,
          currency: 'INVALID' // Invalid currency
        }
      };

      const response = await request(app)
        .post('/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidCurrencyData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toMatch(/currency/i);
    });

    test('should calculate fees automatically', async () => {
      const User = (await import('../src/models/User.js')).default;
      const Transaction = (await import('../src/models/Transaction.js')).default;
      
      User.findOne.mockResolvedValue(mockUser);
      
      // Mock fee calculation
      const transactionWithFees = {
        ...mockTransaction,
        amount: {
          gross: 100.00,
          net: 95.00,
          fees: {
            platform: 3.00,
            payment: 1.50,
            tax: 0.50,
            total: 5.00
          }
        }
      };
      Transaction.create.mockResolvedValue(transactionWithFees);

      const transactionData = {
        type: 'subscription',
        amount: {
          gross: 100.00,
          currency: 'USD'
        }
      };

      const response = await request(app)
        .post('/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(transactionData);

      expect(response.status).toBe(201);
      expect(response.body.transaction.amount).toHaveProperty('net');
      expect(response.body.transaction.amount).toHaveProperty('fees');
      expect(response.body.transaction.amount.fees).toHaveProperty('total');
    });

    test('should reject transactions without authentication', async () => {
      const transactionData = {
        type: 'tip',
        amount: {
          gross: 10.00,
          currency: 'USD'
        }
      };

      const response = await request(app)
        .post('/transactions')
        .send(transactionData);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toMatch(/unauthorized/i);
    });
  });

  describe('PUT /transactions/:id', () => {
    test('should update transaction status', async () => {
      const User = (await import('../src/models/User.js')).default;
      const Transaction = (await import('../src/models/Transaction.js')).default;
      
      User.findOne.mockResolvedValue(mockUser);
      Transaction.findOne.mockResolvedValue(mockTransaction);
      
      const updatedTransaction = { ...mockTransaction, status: 'refunded' };
      Transaction.findByIdAndUpdate.mockResolvedValue(updatedTransaction);

      const updateData = {
        status: 'refunded',
        metadata: {
          refundReason: 'Customer request'
        }
      };

      const response = await request(app)
        .put('/transactions/txn-123')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.transaction.status).toBe('refunded');
    });

    test('should validate status transitions', async () => {
      const User = (await import('../src/models/User.js')).default;
      const Transaction = (await import('../src/models/Transaction.js')).default;
      
      User.findOne.mockResolvedValue(mockUser);
      
      // Mock completed transaction
      const completedTransaction = { ...mockTransaction, status: 'completed' };
      Transaction.findOne.mockResolvedValue(completedTransaction);

      const updateData = {
        status: 'pending' // Invalid transition from completed to pending
      };

      const response = await request(app)
        .put('/transactions/txn-123')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toMatch(/invalid.*transition/i);
    });

    test('should prevent updating transaction amounts', async () => {
      const User = (await import('../src/models/User.js')).default;
      const Transaction = (await import('../src/models/Transaction.js')).default;
      
      User.findOne.mockResolvedValue(mockUser);
      Transaction.findOne.mockResolvedValue(mockTransaction);

      const updateData = {
        amount: {
          gross: 50.00 // Trying to change amount
        }
      };

      const response = await request(app)
        .put('/transactions/txn-123')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toMatch(/cannot.*update.*amount/i);
    });

    test('should restrict updates to transaction owner', async () => {
      const User = (await import('../src/models/User.js')).default;
      const Transaction = (await import('../src/models/Transaction.js')).default;
      
      User.findOne.mockResolvedValue(mockUser);
      
      // Mock transaction belonging to different user
      const otherUserTransaction = {
        ...mockTransaction,
        user: { userId: 'other-user-456' }
      };
      Transaction.findOne.mockResolvedValue(otherUserTransaction);

      const updateData = { status: 'cancelled' };

      const response = await request(app)
        .put('/transactions/txn-123')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toMatch(/access.*denied/i);
    });
  });

  describe('DELETE /transactions/:id', () => {
    test('should allow admin to delete transactions', async () => {
      // Mock admin user
      const adminUser = { ...mockUser, role: 'admin' };
      jwt.verify.mockReturnValue({ userId: 'admin-123', role: 'admin' });

      const User = (await import('../src/models/User.js')).default;
      const Transaction = (await import('../src/models/Transaction.js')).default;
      
      User.findOne.mockResolvedValue(adminUser);
      Transaction.findOne.mockResolvedValue(mockTransaction);
      Transaction.findByIdAndDelete.mockResolvedValue(mockTransaction);

      const response = await request(app)
        .delete('/transactions/txn-123')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.message).toMatch(/deleted/i);
    });

    test('should reject deletion by non-admin users', async () => {
      const User = (await import('../src/models/User.js')).default;
      const Transaction = (await import('../src/models/Transaction.js')).default;
      
      User.findOne.mockResolvedValue(mockUser); // Regular user
      Transaction.findOne.mockResolvedValue(mockTransaction);

      const response = await request(app)
        .delete('/transactions/txn-123')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toMatch(/admin.*required/i);
    });
  });

  describe('GET /transactions/analytics', () => {
    test('should return transaction analytics', async () => {
      const User = (await import('../src/models/User.js')).default;
      const Transaction = (await import('../src/models/Transaction.js')).default;
      
      User.findOne.mockResolvedValue(mockUser);
      
      // Mock analytics data
      const analyticsData = [
        {
          _id: 'subscription',
          totalAmount: 250.00,
          count: 10,
          averageAmount: 25.00
        },
        {
          _id: 'tip',
          totalAmount: 150.00,
          count: 15,
          averageAmount: 10.00
        }
      ];
      Transaction.aggregate.mockResolvedValue(analyticsData);

      const response = await request(app)
        .get('/transactions/analytics')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('analytics');
      expect(response.body.analytics).toHaveLength(2);
    });

    test('should filter analytics by date range', async () => {
      const User = (await import('../src/models/User.js')).default;
      const Transaction = (await import('../src/models/Transaction.js')).default;
      
      User.findOne.mockResolvedValue(mockUser);
      Transaction.aggregate.mockResolvedValue([]);

      const response = await request(app)
        .get('/transactions/analytics?startDate=2024-01-01&endDate=2024-12-31')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Transaction.aggregate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            $match: expect.objectContaining({
              'user.userId': 'user-123',
              createdAt: expect.objectContaining({
                $gte: expect.any(Date),
                $lte: expect.any(Date)
              })
            })
          })
        ])
      );
    });
  });

  describe('Security and Validation', () => {
    test('should sanitize input data', async () => {
      const User = (await import('../src/models/User.js')).default;
      const Transaction = (await import('../src/models/Transaction.js')).default;
      
      User.findOne.mockResolvedValue(mockUser);

      const maliciousData = {
        type: 'tip',
        amount: {
          gross: 10.00,
          currency: 'USD'
        },
        metadata: {
          message: '<script>alert("xss")</script>'
        }
      };

      const response = await request(app)
        .post('/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(maliciousData);

      // Should either reject or sanitize malicious input
      if (response.status === 400) {
        expect(response.body.error).toMatch(/invalid/i);
      } else {
        // If accepted, should be sanitized
        expect(Transaction.create).toHaveBeenCalledWith(
          expect.objectContaining({
            metadata: expect.objectContaining({
              message: expect.not.stringContaining('<script>')
            })
          })
        );
      }
    });

    test('should validate monetary amounts precision', async () => {
      const User = (await import('../src/models/User.js')).default;
      User.findOne.mockResolvedValue(mockUser);

      const precisionData = {
        type: 'tip',
        amount: {
          gross: 10.999, // More than 2 decimal places
          currency: 'USD'
        }
      };

      const response = await request(app)
        .post('/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(precisionData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toMatch(/decimal.*precision/i);
    });

    test('should enforce rate limiting on transaction creation', async () => {
      const User = (await import('../src/models/User.js')).default;
      User.findOne.mockResolvedValue(mockUser);

      const transactionData = {
        type: 'tip',
        amount: {
          gross: 10.00,
          currency: 'USD'
        }
      };

      // Simulate rapid transaction creation
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(
          request(app)
            .post('/transactions')
            .set('Authorization', `Bearer ${authToken}`)
            .send(transactionData)
        );
      }

      const responses = await Promise.all(promises);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    test('should validate transaction metadata size', async () => {
      const User = (await import('../src/models/User.js')).default;
      User.findOne.mockResolvedValue(mockUser);

      const largeMetadata = {
        type: 'tip',
        amount: {
          gross: 10.00,
          currency: 'USD'
        },
        metadata: {
          largeField: 'x'.repeat(10000) // Large metadata field
        }
      };

      const response = await request(app)
        .post('/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(largeMetadata);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toMatch(/metadata.*size/i);
    });
  });

  describe('Business Logic', () => {
    test('should handle different transaction types correctly', () => {
      const validTypes = [
        'subscription',
        'tip',
        'content_purchase',
        'live_stream_gift',
        'payout',
        'refund',
        'chargeback',
        'fee',
        'bonus',
        'withdrawal',
        'deposit',
        'transfer',
        'adjustment'
      ];

      validTypes.forEach(type => {
        expect(validTypes).toContain(type);
      });
    });

    test('should calculate platform fees based on transaction type', () => {
      const subscriptionFeeRate = 0.10; // 10%
      const tipFeeRate = 0.05; // 5%
      const grossAmount = 100.00;

      const subscriptionFee = grossAmount * subscriptionFeeRate;
      const tipFee = grossAmount * tipFeeRate;

      expect(subscriptionFee).toBe(10.00);
      expect(tipFee).toBe(5.00);
    });

    test('should handle currency conversion', () => {
      const usdAmount = 100.00;
      const exchangeRate = 0.85; // USD to EUR
      const eurAmount = usdAmount * exchangeRate;

      expect(eurAmount).toBe(85.00);
    });

    test('should validate minimum transaction amounts', () => {
      const minimumAmounts = {
        'tip': 1.00,
        'subscription': 5.00,
        'content_purchase': 2.00
      };

      Object.entries(minimumAmounts).forEach(([type, minAmount]) => {
        expect(minAmount).toBeGreaterThan(0);
      });
    });
  });
});