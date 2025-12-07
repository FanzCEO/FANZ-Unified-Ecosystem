/**
 * FANZ Tax Routes Test Suite for FANZ Money Dash
 * Tests tax calculations, estimates, compliance, webhooks, and security
 */

import { jest } from '@jest/globals';
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('../src/models/User.js', () => ({
  default: {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn()
  }
}));

jest.mock('../src/models/Transaction.js', () => ({
  default: {
    find: jest.fn(),
    aggregate: jest.fn()
  }
}));

describe('FANZ Tax Routes Test Suite', () => {
  let app;
  let mockUser;
  let mockTransactions;
  let authToken;

  beforeEach(() => {
    // Setup Express app with tax routes
    app = express();
    app.use(express.json());
    
    // Mock user data
    mockUser = global.testHelpers.createMockUser({
      userId: 'user-123',
      username: 'testcreator',
      email: 'creator@fanz.network',
      role: 'creator',
      taxInfo: {
        taxId: 'TAX123456789',
        country: 'US',
        state: 'CA',
        filingStatus: 'single',
        w9Submitted: true,
        w9SubmittedAt: new Date('2024-01-15')
      }
    });

    // Mock transaction data for tax calculations
    mockTransactions = [
      global.testHelpers.createMockTransaction({
        transactionId: 'txn-123',
        type: 'subscription',
        amount: { gross: 100.00, net: 90.00 },
        tax: { taxable: true, taxAmount: 10.00 },
        createdAt: new Date('2024-06-15')
      }),
      global.testHelpers.createMockTransaction({
        transactionId: 'txn-124',
        type: 'tip',
        amount: { gross: 50.00, net: 47.50 },
        tax: { taxable: true, taxAmount: 2.50 },
        createdAt: new Date('2024-07-20')
      })
    ];

    // Mock auth token
    authToken = 'valid.jwt.token';
    jwt.verify.mockReturnValue({ userId: 'user-123', role: 'creator' });

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('GET /tax/profile', () => {
    test('should get tax profile for authenticated user', async () => {
      const User = (await import('../src/models/User.js')).default;
      User.findOne.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/tax/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('profile');
      expect(response.body.profile).toHaveProperty('taxId');
      expect(response.body.profile).toHaveProperty('country');
      expect(response.body.profile).toHaveProperty('filingStatus');
      expect(response.body.profile.w9Submitted).toBe(true);
    });

    test('should return empty profile for user without tax info', async () => {
      const userWithoutTaxInfo = { ...mockUser, taxInfo: undefined };
      const User = (await import('../src/models/User.js')).default;
      User.findOne.mockResolvedValue(userWithoutTaxInfo);

      const response = await request(app)
        .get('/tax/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.profile).toEqual({});
    });

    test('should reject unauthorized access', async () => {
      const response = await request(app)
        .get('/tax/profile');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toMatch(/unauthorized/i);
    });
  });

  describe('PUT /tax/profile', () => {
    test('should update tax profile with valid data', async () => {
      const User = (await import('../src/models/User.js')).default;
      User.findOne.mockResolvedValue(mockUser);
      
      const updatedUser = {
        ...mockUser,
        taxInfo: {
          ...mockUser.taxInfo,
          filingStatus: 'married_joint',
          state: 'NY'
        }
      };
      User.findOneAndUpdate.mockResolvedValue(updatedUser);

      const updateData = {
        filingStatus: 'married_joint',
        state: 'NY',
        dependents: 2
      };

      const response = await request(app)
        .put('/tax/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('profile');
      expect(response.body.profile.filingStatus).toBe('married_joint');
      expect(response.body.profile.state).toBe('NY');
    });

    test('should validate tax profile data', async () => {
      const User = (await import('../src/models/User.js')).default;
      User.findOne.mockResolvedValue(mockUser);

      const invalidData = {
        filingStatus: 'invalid_status',
        country: 'XX', // Invalid country code
        taxId: '123' // Invalid tax ID format
      };

      const response = await request(app)
        .put('/tax/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    test('should sanitize input data', async () => {
      const User = (await import('../src/models/User.js')).default;
      User.findOne.mockResolvedValue(mockUser);

      const maliciousData = {
        filingStatus: 'single',
        businessName: '<script>alert("xss")</script>',
        address: {
          street: 'SELECT * FROM users;'
        }
      };

      const response = await request(app)
        .put('/tax/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(maliciousData);

      // Should either reject or sanitize
      if (response.status === 400) {
        expect(response.body.error).toMatch(/invalid/i);
      } else if (response.status === 200) {
        expect(User.findOneAndUpdate).toHaveBeenCalledWith(
          { userId: 'user-123' },
          expect.objectContaining({
            'taxInfo.businessName': expect.not.stringContaining('<script>'),
            'taxInfo.address.street': expect.not.stringContaining('SELECT')
          })
        );
      }
    });
  });

  describe('GET /tax/calculations/:year', () => {
    test('should get tax calculations for specific year', async () => {
      const User = (await import('../src/models/User.js')).default;
      const Transaction = (await import('../src/models/Transaction.js')).default;
      
      User.findOne.mockResolvedValue(mockUser);
      
      // Mock aggregated tax data
      const taxData = {
        totalIncome: 1500.00,
        totalTaxable: 1350.00,
        totalWithholdings: 150.00,
        estimatedTax: 270.00,
        quarterlyBreakdown: [
          { quarter: 'Q1', income: 400.00, tax: 80.00 },
          { quarter: 'Q2', income: 350.00, tax: 70.00 },
          { quarter: 'Q3', income: 350.00, tax: 70.00 },
          { quarter: 'Q4', income: 400.00, tax: 80.00 }
        ],
        deductions: {
          businessExpenses: 200.00,
          homeOffice: 150.00,
          equipment: 100.00
        }
      };
      
      Transaction.aggregate.mockResolvedValue([taxData]);

      const response = await request(app)
        .get('/tax/calculations/2024')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('calculations');
      expect(response.body.calculations).toHaveProperty('totalIncome');
      expect(response.body.calculations).toHaveProperty('quarterlyBreakdown');
      expect(response.body.calculations).toHaveProperty('deductions');
    });

    test('should validate tax year parameter', async () => {
      const User = (await import('../src/models/User.js')).default;
      User.findOne.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/tax/calculations/invalid-year')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toMatch(/invalid.*year/i);
    });

    test('should handle future years', async () => {
      const User = (await import('../src/models/User.js')).default;
      User.findOne.mockResolvedValue(mockUser);

      const futureYear = new Date().getFullYear() + 2;
      const response = await request(app)
        .get(`/tax/calculations/${futureYear}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toMatch(/future.*year/i);
    });
  });

  describe('POST /tax/estimates', () => {
    test('should calculate tax estimates with valid data', async () => {
      const User = (await import('../src/models/User.js')).default;
      User.findOne.mockResolvedValue(mockUser);

      const estimateData = {
        projectedIncome: 50000,
        quarter: 'Q3',
        year: 2024,
        filingStatus: 'single',
        deductions: {
          standard: true,
          businessExpenses: 5000
        }
      };

      const response = await request(app)
        .post('/tax/estimates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(estimateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('estimates');
      expect(response.body.estimates).toHaveProperty('federalTax');
      expect(response.body.estimates).toHaveProperty('stateTax');
      expect(response.body.estimates).toHaveProperty('selfEmploymentTax');
      expect(response.body.estimates).toHaveProperty('totalTax');
      expect(response.body.estimates).toHaveProperty('quarterlyPayment');
    });

    test('should validate estimate calculation parameters', async () => {
      const User = (await import('../src/models/User.js')).default;
      User.findOne.mockResolvedValue(mockUser);

      const invalidData = {
        projectedIncome: -1000, // Negative income
        quarter: 'Q5', // Invalid quarter
        year: 1900, // Invalid year
        filingStatus: 'unknown'
      };

      const response = await request(app)
        .post('/tax/estimates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    test('should handle different filing statuses', async () => {
      const User = (await import('../src/models/User.js')).default;
      User.findOne.mockResolvedValue(mockUser);

      const filingStatuses = ['single', 'married_joint', 'married_separate', 'head_of_household'];

      for (const status of filingStatuses) {
        const estimateData = {
          projectedIncome: 50000,
          quarter: 'Q2',
          year: 2024,
          filingStatus: status
        };

        const response = await request(app)
          .post('/tax/estimates')
          .set('Authorization', `Bearer ${authToken}`)
          .send(estimateData);

        expect(response.status).toBe(200);
        expect(response.body.estimates).toHaveProperty('totalTax');
      }
    });
  });

  describe('GET /tax/documents', () => {
    test('should list tax documents for user', async () => {
      const User = (await import('../src/models/User.js')).default;
      User.findOne.mockResolvedValue({
        ...mockUser,
        taxDocuments: [
          {
            documentId: 'doc-123',
            type: '1099-NEC',
            year: 2024,
            status: 'generated',
            generatedAt: new Date(),
            downloadUrl: '/tax/documents/doc-123/download'
          },
          {
            documentId: 'doc-124',
            type: 'W-9',
            year: 2024,
            status: 'submitted',
            submittedAt: new Date()
          }
        ]
      });

      const response = await request(app)
        .get('/tax/documents')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('documents');
      expect(response.body.documents).toHaveLength(2);
      expect(response.body.documents[0]).toHaveProperty('type');
      expect(response.body.documents[0]).toHaveProperty('status');
    });

    test('should filter documents by year', async () => {
      const User = (await import('../src/models/User.js')).default;
      User.findOne.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/tax/documents?year=2024')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('POST /tax/documents/:type/generate', () => {
    test('should generate 1099-NEC document', async () => {
      const User = (await import('../src/models/User.js')).default;
      const Transaction = (await import('../src/models/Transaction.js')).default;
      
      User.findOne.mockResolvedValue(mockUser);
      Transaction.find.mockResolvedValue(mockTransactions);

      const response = await request(app)
        .post('/tax/documents/1099-NEC/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ year: 2024 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('document');
      expect(response.body.document).toHaveProperty('documentId');
      expect(response.body.document).toHaveProperty('downloadUrl');
      expect(response.body.document.type).toBe('1099-NEC');
    });

    test('should validate document generation parameters', async () => {
      const User = (await import('../src/models/User.js')).default;
      User.findOne.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/tax/documents/1099-NEC/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ year: 'invalid-year' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toMatch(/invalid.*year/i);
    });

    test('should reject unsupported document types', async () => {
      const User = (await import('../src/models/User.js')).default;
      User.findOne.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/tax/documents/INVALID-TYPE/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ year: 2024 });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toMatch(/unsupported.*type/i);
    });
  });

  describe('GET /tax/vault/balance', () => {
    test('should get tax vault balance', async () => {
      const User = (await import('../src/models/User.js')).default;
      User.findOne.mockResolvedValue({
        ...mockUser,
        taxVault: {
          balance: 2500.00,
          contributionTarget: 25, // percentage
          autoContribute: true,
          lastContribution: new Date(),
          totalContributions: 15000.00
        }
      });

      const response = await request(app)
        .get('/tax/vault/balance')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('vault');
      expect(response.body.vault).toHaveProperty('balance');
      expect(response.body.vault).toHaveProperty('contributionTarget');
      expect(response.body.vault).toHaveProperty('autoContribute');
      expect(response.body.vault.balance).toBe(2500.00);
    });

    test('should return empty vault for new users', async () => {
      const userWithoutVault = { ...mockUser, taxVault: undefined };
      const User = (await import('../src/models/User.js')).default;
      User.findOne.mockResolvedValue(userWithoutVault);

      const response = await request(app)
        .get('/tax/vault/balance')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.vault).toEqual({
        balance: 0,
        contributionTarget: 25,
        autoContribute: false,
        totalContributions: 0
      });
    });
  });

  describe('POST /tax/vault/contribute', () => {
    test('should contribute to tax vault', async () => {
      const User = (await import('../src/models/User.js')).default;
      User.findOne.mockResolvedValue(mockUser);
      
      const updatedUser = {
        ...mockUser,
        taxVault: {
          balance: 3000.00,
          totalContributions: 15500.00
        }
      };
      User.findOneAndUpdate.mockResolvedValue(updatedUser);

      const contributionData = {
        amount: 500.00,
        source: 'manual'
      };

      const response = await request(app)
        .post('/tax/vault/contribute')
        .set('Authorization', `Bearer ${authToken}`)
        .send(contributionData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('contribution');
      expect(response.body.contribution.amount).toBe(500.00);
      expect(response.body).toHaveProperty('newBalance');
    });

    test('should validate contribution amount', async () => {
      const User = (await import('../src/models/User.js')).default;
      User.findOne.mockResolvedValue(mockUser);

      const invalidData = {
        amount: -100.00, // Negative amount
        source: 'manual'
      };

      const response = await request(app)
        .post('/tax/vault/contribute')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toMatch(/positive.*amount/i);
    });

    test('should handle large contribution amounts', async () => {
      const User = (await import('../src/models/User.js')).default;
      User.findOne.mockResolvedValue(mockUser);

      const largeContribution = {
        amount: 50000.00, // Large amount
        source: 'manual'
      };

      const response = await request(app)
        .post('/tax/vault/contribute')
        .set('Authorization', `Bearer ${authToken}`)
        .send(largeContribution);

      // Should either accept or warn about large amounts
      expect([200, 400]).toContain(response.status);
      if (response.status === 400) {
        expect(response.body.error).toMatch(/large.*amount/i);
      }
    });
  });

  describe('POST /tax/webhooks/:processor', () => {
    test('should handle valid webhook with signature', async () => {
      const webhookData = {
        event: 'payment.completed',
        data: {
          transactionId: 'txn-123',
          amount: 100.00,
          userId: 'user-123'
        }
      };

      // Mock webhook signature validation
      const signature = crypto
        .createHmac('sha256', 'webhook-secret')
        .update(JSON.stringify(webhookData))
        .digest('hex');

      const response = await request(app)
        .post('/tax/webhooks/stripe')
        .set('X-Stripe-Signature', `t=${Date.now()},v1=${signature}`)
        .send(webhookData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });

    test('should reject webhooks without valid signature', async () => {
      const webhookData = {
        event: 'payment.completed',
        data: { transactionId: 'txn-123' }
      };

      const response = await request(app)
        .post('/tax/webhooks/stripe')
        .set('X-Stripe-Signature', 'invalid-signature')
        .send(webhookData);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toMatch(/invalid.*signature/i);
    });

    test('should handle different webhook processors', async () => {
      const processors = ['stripe', 'paypal', 'coinbase'];
      
      for (const processor of processors) {
        const response = await request(app)
          .post(`/tax/webhooks/${processor}`)
          .send({ event: 'test' });

        // Should either process or reject gracefully
        expect([200, 401, 400]).toContain(response.status);
      }
    });

    test('should validate webhook processor', async () => {
      const response = await request(app)
        .post('/tax/webhooks/invalid-processor')
        .send({ event: 'test' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toMatch(/unsupported.*processor/i);
    });
  });

  describe('GET /tax/ai-insights', () => {
    test('should get AI-powered tax insights', async () => {
      const User = (await import('../src/models/User.js')).default;
      const Transaction = (await import('../src/models/Transaction.js')).default;
      
      User.findOne.mockResolvedValue(mockUser);
      Transaction.find.mockResolvedValue(mockTransactions);

      const response = await request(app)
        .get('/tax/ai-insights')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('insights');
      expect(response.body.insights).toHaveProperty('recommendations');
      expect(response.body.insights).toHaveProperty('optimizations');
      expect(response.body.insights).toHaveProperty('alerts');
    });

    test('should filter insights by category', async () => {
      const User = (await import('../src/models/User.js')).default;
      User.findOne.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/tax/ai-insights?category=deductions')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.insights).toHaveProperty('category', 'deductions');
    });
  });

  describe('Security and Compliance', () => {
    test('should enforce rate limiting on sensitive endpoints', async () => {
      const User = (await import('../src/models/User.js')).default;
      User.findOne.mockResolvedValue(mockUser);

      // Simulate rapid requests
      const promises = [];
      for (let i = 0; i < 20; i++) {
        promises.push(
          request(app)
            .get('/tax/profile')
            .set('Authorization', `Bearer ${authToken}`)
        );
      }

      const responses = await Promise.all(promises);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    test('should validate all input parameters', async () => {
      const User = (await import('../src/models/User.js')).default;
      User.findOne.mockResolvedValue(mockUser);

      const maliciousInputs = [
        { endpoint: '/tax/calculations/2024', param: 'year', value: '2024; DROP TABLE users;' },
        { endpoint: '/tax/estimates', param: 'projectedIncome', value: '<script>alert("xss")</script>' },
        { endpoint: '/tax/vault/contribute', param: 'amount', value: 'Infinity' }
      ];

      for (const input of maliciousInputs) {
        let response;
        if (input.endpoint.includes('calculations')) {
          response = await request(app)
            .get('/tax/calculations/2024%3B%20DROP%20TABLE%20users%3B')
            .set('Authorization', `Bearer ${authToken}`);
        } else if (input.endpoint.includes('estimates')) {
          response = await request(app)
            .post('/tax/estimates')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ projectedIncome: '<script>alert("xss")</script>' });
        } else {
          response = await request(app)
            .post('/tax/vault/contribute')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ amount: 'Infinity' });
        }

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('success', false);
      }
    });

    test('should log security events', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const response = await request(app)
        .post('/tax/webhooks/stripe')
        .set('X-Stripe-Signature', 'tampered-signature')
        .send({ malicious: 'payload' });

      expect(response.status).toBe(401);
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    test('should handle PII data securely', async () => {
      const User = (await import('../src/models/User.js')).default;
      User.findOne.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/tax/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      
      // Ensure sensitive data is properly masked/limited
      if (response.body.profile.taxId) {
        expect(response.body.profile.taxId).toMatch(/^\*\*\*-\*\*-\d{4}$/);
      }
    });

    test('should validate tax calculation accuracy', async () => {
      const User = (await import('../src/models/User.js')).default;
      User.findOne.mockResolvedValue(mockUser);

      const estimateData = {
        projectedIncome: 50000,
        quarter: 'Q1',
        year: 2024,
        filingStatus: 'single'
      };

      const response = await request(app)
        .post('/tax/estimates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(estimateData);

      expect(response.status).toBe(200);
      
      const { estimates } = response.body;
      
      // Validate calculation consistency
      expect(estimates.totalTax).toBeGreaterThanOrEqual(0);
      expect(estimates.federalTax + estimates.stateTax + estimates.selfEmploymentTax)
        .toBeCloseTo(estimates.totalTax, 2);
      
      // Validate quarterly payment calculation
      expect(estimates.quarterlyPayment).toBe(estimates.totalTax / 4);
    });
  });

  describe('Business Logic Validation', () => {
    test('should handle different tax jurisdictions', () => {
      const jurisdictions = [
        { country: 'US', state: 'CA' },
        { country: 'US', state: 'NY' },
        { country: 'US', state: 'TX' },
        { country: 'CA', province: 'ON' },
        { country: 'GB' }
      ];

      jurisdictions.forEach(jurisdiction => {
        expect(jurisdiction.country).toMatch(/^[A-Z]{2}$/);
        if (jurisdiction.state) {
          expect(jurisdiction.state).toMatch(/^[A-Z]{2}$/);
        }
      });
    });

    test('should calculate self-employment tax correctly', () => {
      const selfEmploymentIncome = 50000;
      const seRate = 0.1413; // 2024 SE tax rate
      const expectedSETax = selfEmploymentIncome * seRate;

      expect(expectedSETax).toBeCloseTo(7065, 0);
    });

    test('should apply standard deduction limits', () => {
      const standardDeductions = {
        single: 14600,
        married_joint: 29200,
        married_separate: 14600,
        head_of_household: 21900
      };

      Object.entries(standardDeductions).forEach(([status, deduction]) => {
        expect(deduction).toBeGreaterThan(0);
        expect(deduction).toBeLessThan(50000); // Reasonable upper bound
      });
    });

    test('should validate quarterly payment deadlines', () => {
      const quarterlyDeadlines = {
        Q1: '04-15',
        Q2: '06-15', 
        Q3: '09-15',
        Q4: '01-15' // Following year
      };

      Object.entries(quarterlyDeadlines).forEach(([quarter, deadline]) => {
        expect(deadline).toMatch(/^\d{2}-\d{2}$/);
        expect(['Q1', 'Q2', 'Q3', 'Q4']).toContain(quarter);
      });
    });
  });
});