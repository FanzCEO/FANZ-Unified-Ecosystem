import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { CCBillProcessor } from '../../../../src/services/payment/processors/CCBillProcessor';
import { PaxumPayoutProcessor } from '../../../../src/services/payment/processors/PaxumPayoutProcessor';
import { SegpayProcessor } from '../../../../src/services/payment/processors/SegpayProcessor';
import { PaymentProcessorFactory } from '../../../../src/services/payment/PaymentProcessorFactory';
import { ComplianceValidationService } from '../../../../src/middleware/ComplianceValidationMiddleware';
import { GeographicRoutingService } from '../../../../src/services/payment/GeographicRoutingService';
import { ProcessorMonitoringService } from '../../../../src/services/monitoring/ProcessorMonitoringService';
import {
  PaymentRequest,
  PayoutRequest,
  RefundRequest,
  WebhookData,
  PaymentMethod
} from '../../../../src/services/paymentProcessors/interfaces/IPaymentProcessor';
import crypto from 'crypto';
import nock from 'nock';

describe('Adult-Friendly Payment Processors', () => {
  let ccbillProcessor: CCBillProcessor;
  let paxumProcessor: PaxumPayoutProcessor;
  let segpayProcessor: SegpayProcessor;
  let complianceService: ComplianceValidationService;
  let routingService: GeographicRoutingService;
  let monitoringService: ProcessorMonitoringService;

  beforeEach(() => {
    // Initialize processors with test configurations
    ccbillProcessor = new CCBillProcessor({
      clientAccnum: '123456',
      clientSubacc: '0000',
      flexId: 'test-flex-id',
      salt: 'test-salt',
      apiUsername: 'test-user',
      apiPassword: 'test-pass',
      environment: 'sandbox'
    });

    paxumProcessor = new PaxumPayoutProcessor({
      apiKey: 'test-api-key',
      apiSecret: 'test-api-secret',
      companyId: 'test-company-id',
      environment: 'sandbox'
    });

    segpayProcessor = new SegpayProcessor({
      packageId: 'test-package-id',
      billerId: 'test-biller-id',
      username: 'test-username',
      password: 'test-password',
      environment: 'sandbox'
    });

    complianceService = new ComplianceValidationService();
    routingService = new GeographicRoutingService();
    monitoringService = new ProcessorMonitoringService({
      healthCheckInterval: 1,
      performanceTrackingEnabled: true
    });

    // Mock external HTTP calls
    nock.cleanAll();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('CCBill Payment Processing', () => {
    const samplePaymentRequest: PaymentRequest = {
      amount: 29.99,
      currency: 'USD',
      customerId: 'customer-123',
      paymentMethod: {
        id: 'test-payment-method',
        type: 'credit_card',
        details: { token: 'test_token' }
      },
      description: 'Monthly subscription',
      contentType: 'adult',
      transactionType: 'subscription',
      successUrl: 'https://fanz.com/payment/success',
      failureUrl: 'https://fanz.com/payment/failure'
    };

    it('should process subscription payments successfully', async () => {
      const result = await ccbillProcessor.processPayment(samplePaymentRequest);

      expect(result.success).toBe(true);
      expect(result.status).toBe('pending');
      expect(result.metadata?.paymentUrl).toBeDefined();
      expect(result.metadata?.requiresRedirect).toBe(true);
      expect(result.metadata?.processor).toBe('ccbill');
    });

    it('should generate correct FlexForms payment URL', async () => {
      const result = await ccbillProcessor.processPayment(samplePaymentRequest);

      expect(result.metadata?.paymentUrl).toContain('ccbill.com');
      expect(result.metadata?.paymentUrl).toContain('currencyCode=840'); // USD
      expect(result.metadata?.paymentUrl).toContain('formPrice=29.99');
      expect(result.metadata?.paymentUrl).toContain('clientAccnum=123456');
    });

    it('should handle payment processing errors gracefully', async () => {
      const invalidRequest: PaymentRequest = { 
        amount: -10,
        currency: 'USD',
        customerId: 'customer-123',
        paymentMethod: {
          id: 'test-payment-method',
          type: 'credit_card',
          details: { token: 'test_token' }
        }
      };
      
      const result = await ccbillProcessor.processPayment(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.status).toBe('failed');
      expect(result.error).toBeDefined();
    });

    it('should verify webhook signatures correctly', () => {
      const webhookPayload = {
        eventType: 'NewSaleSuccess',
        subscriptionId: '12345',
        transactionId: 'test-txn-001',
        accountingAmount: '29.99',
        accountingCurrency: 'USD'
      };

      const payload = JSON.stringify(webhookPayload);
      const timestamp = Date.now().toString();
      
      // Generate test signature
      const expectedSignature = crypto
        .createHmac('sha256', 'test-salt')
        .update(`${payload}${timestamp}`)
        .digest('hex');

      const isValid = ccbillProcessor.verifyWebhookSignature(
        payload, 
        expectedSignature, 
        timestamp
      );

      expect(isValid).toBe(true);
    });

    it('should reject invalid webhook signatures', () => {
      const payload = JSON.stringify({ eventType: 'NewSaleSuccess' });
      const invalidSignature = 'invalid-signature';
      const timestamp = Date.now().toString();

      const isValid = ccbillProcessor.verifyWebhookSignature(
        payload, 
        invalidSignature, 
        timestamp
      );

      expect(isValid).toBe(false);
    });

    it('should handle webhook processing', async () => {
      const webhookData: WebhookData = {
        data: {
          eventType: 'NewSaleSuccess',
          subscriptionId: '12345',
          transactionId: 'test-txn-001'
        },
        rawPayload: JSON.stringify({
          eventType: 'NewSaleSuccess',
          subscriptionId: '12345',
          transactionId: 'test-txn-001'
        }),
        signature: 'valid-signature',
        timestamp: Date.now().toString()
      };

      // Mock signature verification
      jest.spyOn(ccbillProcessor, 'verifyWebhookSignature').mockReturnValue(true);

      const result = await ccbillProcessor.handleWebhook(webhookData);

      expect(result).toBe(true);
    });

    it('should perform health checks', async () => {
      // Mock successful API response
      nock('https://api.ccbill.com')
        .post('/wap-frontflex/flexforms/ping')
        .reply(200, { status: 'ok' });

      const healthCheck = await ccbillProcessor.healthCheck();

      expect(healthCheck.healthy).toBe(true);
      expect(healthCheck.details?.processor).toBe('ccbill');
      expect(healthCheck.details?.responseTime).toBeGreaterThan(0);
    });

    it('should handle refunds', async () => {
      // Mock successful refund response
      nock('https://api.ccbill.com')
        .post('/wap-frontflex/flexforms/refund')
        .reply(200, {
          approved: '1',
          refundTransactionId: 'refund-123'
        });

      const refundRequest: RefundRequest = {
        transactionId: 'test-txn-001',
        amount: 29.99,
        reason: 'Customer request'
      };

      const result = await ccbillProcessor.processRefund(refundRequest);

      expect(result.success).toBe(true);
      expect(result.status).toBe('completed');
      expect(result.refundId).toBeDefined();
    });
  });

  describe('Paxum Payout Processing', () => {
    const samplePayoutRequest: PayoutRequest = {
      payoutId: 'payout-001',
      amount: 250.00,
      currency: 'USD',
      destination: {
        type: 'paxum_ewallet',
        details: {
          email: 'creator@example.com',
          name: 'Jane Creator'
        }
      },
      description: 'Creator earnings payout'
    };

    it('should process e-wallet payouts successfully', async () => {
      // Mock successful payout response
      nock('https://api.paxum.com')
        .post('/api/v2/payout')
        .reply(200, {
          status: 'success',
          payoutId: 'paxum-payout-123',
          transactionId: 'paxum-txn-456'
        });

      const result = await paxumProcessor.processPayout(samplePayoutRequest);

      expect(result.success).toBe(true);
      expect(result.status).toBe('processing');
      expect(result.payoutId).toBeDefined();
      expect(result.metadata?.processor).toBe('paxum');
    });

    it('should validate payout destinations', async () => {
      const invalidRequest = {
        ...samplePayoutRequest,
        destination: {
          type: 'invalid_type' as any,
          details: {}
        }
      };

      const result = await paxumProcessor.processPayout(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid destination type');
    });

    it('should verify webhook signatures for payouts', () => {
      const webhookPayload = {
        event: 'payout_completed',
        payoutId: 'payout-001',
        status: 'completed'
      };

      const payload = JSON.stringify(webhookPayload);
      const expectedSignature = crypto
        .createHmac('sha256', 'test-api-secret')
        .update(payload)
        .digest('hex');

      const isValid = paxumProcessor.verifyWebhookSignature(
        payload, 
        expectedSignature
      );

      expect(isValid).toBe(true);
    });

    it('should handle wire transfer payouts', async () => {
      const wireTransferRequest: PayoutRequest = {
        ...samplePayoutRequest,
        destination: {
          type: 'wire_transfer',
          details: {
            bankName: 'Test Bank',
            accountNumber: '123456789',
            routingNumber: '021000021',
            accountName: 'Jane Creator'
          }
        }
      };

      // Mock successful wire transfer response
      nock('https://api.paxum.com')
        .post('/api/v2/payout')
        .reply(200, {
          status: 'pending',
          payoutId: 'paxum-wire-123'
        });

      const result = await paxumProcessor.processPayout(wireTransferRequest);

      expect(result.success).toBe(true);
      expect(result.status).toBe('processing');
    });
  });

  describe('Segpay Payment Processing', () => {
    const samplePaymentRequest: PaymentRequest = {
      amount: 19.99,
      currency: 'EUR',
      customerId: 'customer-456',
      transactionType: 'one_time',
      contentType: 'adult',
      customerInfo: {
        email: 'european@example.com',
        firstName: 'Hans',
        lastName: 'Mueller',
        country: 'DE'
      },
      paymentMethod: {
        id: 'test-payment-method',
        type: 'credit_card',
        details: { token: 'test_token' }
      }
    };

    it('should process European payments', async () => {
      const result = await segpayProcessor.processPayment(samplePaymentRequest);

      expect(result.success).toBe(true);
      expect(result.status).toBe('pending');
      expect(result.metadata?.paymentUrl).toContain('segpay.com');
    });

    it('should handle different currencies', async () => {
      const gbpRequest = { ...samplePaymentRequest, currency: 'GBP' };
      
      const result = await segpayProcessor.processPayment(gbpRequest);

      expect(result.success).toBe(true);
      expect(result.metadata?.paymentUrl).toContain('x_currency=GBP');
    });

    it('should verify Segpay webhook authentication', () => {
      const webhookPayload = {
        action: 'purchase',
        transaction_id: 'segpay-txn-001',
        amount: '19.99',
        auth_key: crypto
          .createHash('sha256')
          .update('segpay-txn-00119.99test-password')
          .digest('hex')
      };

      const payload = JSON.stringify(webhookPayload);

      const isValid = segpayProcessor.verifyWebhookSignature(payload, '');

      expect(isValid).toBe(true);
    });
  });

  describe('Payment Processor Factory', () => {
    it('should create processor instances correctly', () => {
      const ccbill = PaymentProcessorFactory.getProcessor('ccbill');
      const paxum = PaymentProcessorFactory.getProcessor('paxum');
      const segpay = PaymentProcessorFactory.getProcessor('segpay');

      expect(ccbill).toBeInstanceOf(CCBillProcessor);
      expect(paxum).toBeInstanceOf(PaxumPayoutProcessor);
      expect(segpay).toBeInstanceOf(SegpayProcessor);
    });

    it('should return available adult-friendly processors', async () => {
      const processors = await PaymentProcessorFactory.getAvailableProcessors();

      expect(processors).toContain('ccbill');
      expect(processors).toContain('paxum');
      expect(processors).toContain('segpay');
    });

    it('should get default processor based on preferences', () => {
    const defaultProcessor = PaymentProcessorFactory.getBestProcessor({});

      expect(['ccbill', 'paxum', 'mock']).toContain(defaultProcessor.constructor.name.toLowerCase().replace('processor', ''));
    });
  });

  describe('Compliance Validation', () => {
    const sampleUser = {
      id: 'user-001',
      ageVerified: true,
      ageVerifiedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      age: 25,
      country: 'US',
      verificationLevel: 'premium'
    };

    it('should validate payment compliance for adult content', async () => {
      const paymentRequest: PaymentRequest = {
        transactionId: 'compliance-test-001',
        amount: 49.99,
        currency: 'USD',
        customerId: 'customer-compliance-001',
        contentType: 'adult',
        paymentMethod: {
          id: 'test-card',
          type: 'credit_card',
          details: { token: 'test_token' }
        }
      };

      const result = await complianceService.validatePaymentCompliance(
        paymentRequest,
        sampleUser
      );

      expect(result.passed).toBe(true);
      expect(result.ageVerification.verified).toBe(true);
      expect(result.contentCompliance.isAdultContent).toBe(true);
    });

    it('should reject payments for users without age verification', async () => {
      const unverifiedUser = {
        ...sampleUser,
        ageVerified: false
      };

      const paymentRequest: PaymentRequest = {
        transactionId: 'compliance-test-002',
        amount: 29.99,
        currency: 'USD',
        customerId: 'customer-compliance-002',
        contentType: 'adult',
        paymentMethod: {
          id: 'test-card',
          type: 'credit_card',
          details: { token: 'test_token' }
        }
      };

      // Mock that credit card doesn't provide sufficient age verification
      jest.spyOn(complianceService as any, 'performAgeVerification')
        .mockResolvedValue({
          verified: false,
          method: 'none'
        });

      const result = await complianceService.validatePaymentCompliance(
        paymentRequest,
        unverifiedUser
      );

      expect(result.passed).toBe(false);
      expect(result.errors).toContain('Age verification required for adult content purchases');
    });

    it('should perform risk assessment', async () => {
      const riskUser = {
        ...sampleUser,
        country: 'COUNTRY1', // High risk country from config
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago (new account)
      };

      const paymentRequest: PaymentRequest = {
        transactionId: 'risk-test-001',
        amount: 600, // High amount
        currency: 'USD',
        customerId: 'customer-risk-001',
        contentType: 'adult',
        paymentMethod: {
          id: 'prepaid-card',
          type: 'prepaid_card',
          details: { card_number: 'xxxx-xxxx-xxxx-1234' }
        }
      };

      const result = await complianceService.validatePaymentCompliance(
        paymentRequest,
        riskUser
      );

      expect(['medium', 'high', 'very_high']).toContain(result.riskAssessment.riskLevel);
      expect(result.riskAssessment.factors.length).toBeGreaterThan(0);
    });

    it('should validate creator payout compliance', async () => {
      const creator = {
        id: 'creator-001',
        idVerified: true,
        idVerifiedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        age: 28,
        fullName: 'Jane Creator',
        email: 'creator@example.com',
        country: 'US',
        compliance2257Verified: true,
        compliance2257ExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        taxFormOnFile: true,
        taxFormType: 'W9'
      };

      const payoutRequest: PayoutRequest = {
        payoutId: 'payout-compliance-001',
        amount: 800,
        currency: 'USD',
        destination: {
          type: 'paxum_ewallet',
          details: {
            email: 'creator@example.com',
            name: 'Jane Creator'
          }
        }
      };

      const result = await complianceService.validatePayoutCompliance(
        payoutRequest,
        creator
      );

      expect(result.passed).toBe(true);
      expect(result.ageVerification.verified).toBe(true);
      expect(result.contentCompliance.performerAgeVerified).toBe(true);
    });
  });

  describe('Geographic Routing', () => {
    it('should route US customers to CCBill for subscriptions', async () => {
      const usRequest: PaymentRequest = {
        transactionId: 'routing-us-001',
        amount: 39.99,
        currency: 'USD',
        customerId: 'customer-routing-us-001',
        transactionType: 'subscription',
        customerInfo: {
          email: 'us.customer@example.com',
          country: 'US'
        }
      };

      const decision = await routingService.routePaymentProcessor(usRequest);

      expect(decision.primaryProcessor).toBe('ccbill');
      expect(decision.confidence).toBeGreaterThan(0.8);
    });

    it('should route European customers to Segpay', async () => {
      const euRequest: PaymentRequest = {
        transactionId: 'routing-eu-001',
        amount: 29.99,
        currency: 'EUR',
        customerId: 'customer-routing-eu-001',
        transactionType: 'one_time',
        customerInfo: {
          email: 'eu.customer@example.com',
          country: 'DE'
        }
      };

      const decision = await routingService.routePaymentProcessor(euRequest);

      expect(decision.primaryProcessor).toBe('segpay');
      expect(decision.confidence).toBeGreaterThan(0.8);
    });

    it('should route payouts to Paxum', async () => {
      const payoutRequest: PayoutRequest = {
        payoutId: 'routing-payout-001',
        amount: 500,
        currency: 'USD',
        destination: {
          type: 'paxum_ewallet',
          details: {
            country: 'CA'
          }
        }
      };

      const decision = await routingService.routePayoutProcessor(payoutRequest);

      expect(decision.primaryProcessor).toBe('paxum');
      expect(decision.confidence).toBeGreaterThan(0.8);
    });

    it('should provide fallback processors', async () => {
      const request: PaymentRequest = {
        transactionId: 'routing-fallback-001',
        amount: 19.99,
        currency: 'USD',
        customerId: 'customer-routing-fallback-001',
        customerInfo: {
          email: 'fallback.customer@example.com',
          country: 'US'
        }
      };

      const decision = await routingService.routePaymentProcessor(request);

      expect(decision.secondaryProcessor).toBeDefined();
      expect(decision.tertiaryProcessor).toBeDefined();
    });
  });

  describe('Processor Monitoring', () => {
    it('should monitor processor health', async () => {
      // Mock health check responses
      nock('https://api.ccbill.com')
        .post('/wap-frontflex/flexforms/ping')
        .reply(200, { status: 'ok' });

      await monitoringService.startMonitoring();

      const healthCheck = await monitoringService.checkProcessorHealth('ccbill');

      expect(healthCheck.healthy).toBe(true);
      expect(healthCheck.details?.processor).toBe('ccbill');

      await monitoringService.stopMonitoring();
    });

    it('should record transaction metrics', async () => {
      await monitoringService.startMonitoring();

      await monitoringService.recordTransactionMetrics('ccbill', {
        success: true,
        responseTime: 250,
        amount: 29.99
      });

      const metrics = monitoringService.getProcessorMetric('ccbill');

      expect(metrics?.totalTransactions).toBe(1);
      expect(metrics?.successRate).toBe(100);
      expect(metrics?.errorRate).toBe(0);

      await monitoringService.stopMonitoring();
    });

    it('should generate performance reports', async () => {
      await monitoringService.startMonitoring();

      // Simulate some transactions
      await monitoringService.recordTransactionMetrics('ccbill', {
        success: true,
        responseTime: 200
      });
      await monitoringService.recordTransactionMetrics('ccbill', {
        success: false,
        responseTime: 500,
        errorCode: 'timeout'
      });

      const report = await monitoringService.generatePerformanceReport();

      expect(report.summary.totalProcessors).toBeGreaterThan(0);
      expect(report.summary.totalTransactions).toBe(2);
      expect(report.processors.length).toBeGreaterThan(0);

      await monitoringService.stopMonitoring();
    });

    it('should create alerts for unhealthy processors', async () => {
      await monitoringService.startMonitoring();

      // Simulate an unhealthy processor
      jest.spyOn(ccbillProcessor, 'healthCheck').mockResolvedValue({
        healthy: false,
        message: 'API timeout',
        details: {
          processor: 'ccbill',
          responseTime: Date.now()
        }
      });

      await monitoringService.checkProcessorHealth('ccbill');

      const alerts = monitoringService.getActiveAlerts();
      const healthAlert = alerts.find(alert => 
        alert.processorName === 'ccbill' && 
        alert.alertType === 'health'
      );

      expect(healthAlert).toBeDefined();
      expect(healthAlert?.severity).toBe('critical');

      await monitoringService.stopMonitoring();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle network timeouts gracefully', async () => {
      // Mock network timeout by making the request fail
      nock('https://api.ccbill.com')
        .post('/wap-frontflex/flexforms/ping')
        .replyWithError({ code: 'ETIMEDOUT', message: 'timeout' });

      const healthCheck = await ccbillProcessor.healthCheck();

      expect(healthCheck.healthy).toBe(false);
      expect(healthCheck.message).toContain('timeout');
    });

    it('should handle invalid processor names', () => {
      expect(() => {
        PaymentProcessorFactory.getProcessor('invalid_processor' as any);
      }).toThrow('Unsupported payment processor');
    });

    it('should validate required payment fields', async () => {
      const incompleteRequest = {
        transactionId: 'incomplete-001'
        // Missing required fields
      } as PaymentRequest;

      const result = await ccbillProcessor.processPayment(incompleteRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle webhook replay attacks', () => {
      const payload = JSON.stringify({
        eventType: 'NewSaleSuccess',
        timestamp: Date.now() - 300000 // 5 minutes old
      });

      const signature = crypto
        .createHmac('sha256', 'test-salt')
        .update(`${payload}old-timestamp`)
        .digest('hex');

      const isValid = ccbillProcessor.verifyWebhookSignature(
        payload,
        signature,
        'current-timestamp'
      );

      expect(isValid).toBe(false);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete payment flow with routing and compliance', async () => {
      const paymentRequest: PaymentRequest = {
        transactionId: 'integration-001',
        amount: 49.99,
        currency: 'USD',
        customerId: 'customer-integration-001',
        transactionType: 'subscription',
        contentType: 'adult',
        customerInfo: {
          email: 'integration@example.com',
          firstName: 'Test',
          lastName: 'User',
          country: 'US'
        },
        paymentMethod: {
          id: 'test-card',
          type: 'credit_card',
          details: {
            cardNumber: '****-****-****-1234',
            expiryMonth: '12',
            expiryYear: '2025',
            cvv: '***'
          }
        }
      };

      const userInfo = {
        id: 'user-integration-001',
        ageVerified: true,
        ageVerifiedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        age: 30,
        country: 'US',
        verificationLevel: 'premium'
      };

      // 1. Compliance check
      const complianceResult = await complianceService.validatePaymentCompliance(
        paymentRequest,
        userInfo
      );

      expect(complianceResult.passed).toBe(true);

      // 2. Routing decision
      const routingDecision = await routingService.routePaymentProcessor(paymentRequest);

      expect(routingDecision.primaryProcessor).toBe('ccbill');

      // 3. Process payment
      const processor = PaymentProcessorFactory.getProcessor(routingDecision.primaryProcessor);
      const paymentResult = await processor.processPayment(paymentRequest);

      expect(paymentResult.success).toBe(true);
      expect(paymentResult.status).toBe('pending');

      // 4. Record metrics
      await monitoringService.recordTransactionMetrics(
        routingDecision.primaryProcessor,
        {
          success: paymentResult.success,
          responseTime: 200,
          amount: paymentRequest.amount
        }
      );

      const metrics = monitoringService.getProcessorMetric(routingDecision.primaryProcessor);
      expect(metrics?.totalTransactions).toBeGreaterThan(0);
    });

    it('should handle complete payout flow with compliance', async () => {
      const payoutRequest: PayoutRequest = {
        payoutId: 'integration-payout-001',
        amount: 750,
        currency: 'USD',
        destination: {
          type: 'paxum_ewallet',
          details: {
            email: 'creator@example.com',
            name: 'Test Creator'
          }
        }
      };

      const creatorInfo = {
        id: 'creator-integration-001',
        idVerified: true,
        idVerifiedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        age: 26,
        fullName: 'Test Creator',
        email: 'creator@example.com',
        country: 'US',
        compliance2257Verified: true,
        compliance2257ExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        taxFormOnFile: true,
        taxFormType: 'W9'
      };

      // 1. Compliance check
      const complianceResult = await complianceService.validatePayoutCompliance(
        payoutRequest,
        creatorInfo
      );

      expect(complianceResult.passed).toBe(true);

      // 2. Routing decision
      const routingDecision = await routingService.routePayoutProcessor(payoutRequest);

      expect(routingDecision.primaryProcessor).toBe('paxum');

      // 3. Process payout
      nock('https://api.paxum.com')
        .post('/api/v2/payout')
        .reply(200, {
          status: 'success',
          payoutId: 'paxum-integration-001'
        });

      const processor = PaymentProcessorFactory.getProcessor(routingDecision.primaryProcessor) as PaxumPayoutProcessor;
      const payoutResult = await processor.processPayout(payoutRequest);

      expect(payoutResult.success).toBe(true);
    });
  });
});

// Helper functions and test utilities

function generateTestSignature(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

// Custom Jest matchers
expect.extend({
  toBeOneOf(received: any, expected: any[]) {
    const pass = expected.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${expected.join(', ')}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${expected.join(', ')}`,
        pass: false,
      };
    }
  },
});

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeOneOf(expected: any[]): R;
    }
  }
}