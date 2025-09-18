import { Router, Request, Response } from 'express';
import { PaymentProcessorFactory } from '..REDACTED_AWS_SECRET_KEYssorFactory';
import { ComplianceValidationService } from '..REDACTED_AWS_SECRET_KEYre';
import { GeographicRoutingService } from '..REDACTED_AWS_SECRET_KEYce';
import { ProcessorMonitoringService } from '..REDACTED_AWS_SECRET_KEYService';
import {
  PaymentRequest as BasePaymentRequest,
  PayoutRequest as BasePayoutRequest,
  RefundRequest,
  WebhookData
} from '..REDACTED_AWS_SECRET_KEYPaymentProcessor';

// Extended PaymentRequest for route handling
interface PaymentRequest extends BasePaymentRequest {
  transactionId?: string;
  contentType?: 'general' | 'adult';
  transactionType?: 'one_time' | 'subscription' | 'tip';
  customerInfo?: {
    email: string;
    firstName?: string;
    lastName?: string;
    country?: string;
  };
  successUrl?: string;
  failureUrl?: string;
}

// Extended PayoutRequest for route handling
interface PayoutRequest extends BasePayoutRequest {
  payoutId?: string;
  creatorId?: string;
}
import { logger } from '../utils/logger';
import { asyncHandler } from '../utils/asyncHandler';
import { validateRequest } from '../middleware/validation';
import { authenticateUser, authenticateCreator } from '../middleware/authentication';
const { body, param, query } = require('express-validator');

const router = Router();
const complianceService = new ComplianceValidationService();
const routingService = new GeographicRoutingService();
const monitoringService = new ProcessorMonitoringService();

// Initialize monitoring service
monitoringService.startMonitoring().catch(error => {
  logger.error('Failed to start payment monitoring', { error });
});

/**
 * POST /payments/process
 * Process a payment with compliance validation and intelligent routing
 */
router.post('/process',
  authenticateUser,
  [
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    body('currency').isISO4217().withMessage('Invalid currency code'),
    body('contentType').isIn(['general', 'adult']).withMessage('Invalid content type'),
    body('transactionType').isIn(['one_time', 'subscription', 'tip']).withMessage('Invalid transaction type'),
    body('customerInfo.email').isEmail().withMessage('Invalid email'),
    body('paymentMethod.type').isIn(['credit_card', 'debit_card', 'bank_transfer', 'crypto']).withMessage('Invalid payment method type')
  ],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    
    try {
      const paymentRequest: PaymentRequest = {
        transactionId: req.body.transactionId || `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        amount: req.body.amount,
        currency: req.body.currency,
        transactionType: req.body.transactionType,
        contentType: req.body.contentType,
        customerInfo: req.body.customerInfo,
        paymentMethod: req.body.paymentMethod,
        description: req.body.description,
        metadata: req.body.metadata,
        successUrl: req.body.successUrl,
        failureUrl: req.body.failureUrl,
        customerId: req.user?.id as string
      };

      // 1. Compliance Validation
      logger.info('Starting payment compliance validation', {
        transactionId: paymentRequest.transactionId,
        userId: req.user?.id,
        amount: paymentRequest.amount,
        contentType: paymentRequest.contentType
      });

      const complianceResult = await complianceService.validatePaymentCompliance(
        paymentRequest,
        req.user
      );

      if (!complianceResult.passed) {
        logger.warn('Payment compliance validation failed', {
          transactionId: paymentRequest.transactionId,
          errors: complianceResult.errors,
          warnings: complianceResult.warnings
        });

        return res.status(400).json({
          success: false,
          error: 'Payment compliance validation failed',
          details: {
            errors: complianceResult.errors,
            warnings: complianceResult.warnings,
            riskAssessment: complianceResult.riskAssessment
          }
        });
      }

      // 2. Geographic Routing
      const routingDecision = await routingService.routePaymentProcessor(paymentRequest);
      
      logger.info('Payment processor routing completed', {
        transactionId: paymentRequest.transactionId,
        primaryProcessor: routingDecision.primaryProcessor,
        confidence: routingDecision.confidence,
        reason: routingDecision.reason
      });

      // 3. Process Payment
      let paymentResult;
      let usedProcessor = routingDecision.primaryProcessor;

      try {
        const processor = PaymentProcessorFactory.getProcessor('mock'); // Only mock processor available currently
        paymentResult = await processor.processPayment(paymentRequest);

        if (!paymentResult.success && routingDecision.secondaryProcessor) {
          // Try secondary processor
          logger.info('Trying secondary processor', {
            transactionId: paymentRequest.transactionId,
            secondaryProcessor: routingDecision.secondaryProcessor
          });

          const secondaryProcessor = PaymentProcessorFactory.getProcessor('mock'); // Only mock processor available currently
          paymentResult = await secondaryProcessor.processPayment(paymentRequest);
          usedProcessor = routingDecision.secondaryProcessor;
        }

      } catch (processorError) {
        logger.error('Payment processor error', {
          transactionId: paymentRequest.transactionId,
          processor: routingDecision.primaryProcessor,
          error: processorError
        });

        // Try fallback processor if available
        if (routingDecision.secondaryProcessor) {
          try {
            const fallbackProcessor = PaymentProcessorFactory.getProcessor('mock'); // Only mock processor available currently
            paymentResult = await fallbackProcessor.processPayment(paymentRequest);
            usedProcessor = routingDecision.secondaryProcessor;
          } catch (fallbackError) {
            throw processorError; // Throw original error
          }
        } else {
          throw processorError;
        }
      }

      // 4. Record Metrics
      const responseTime = Date.now() - startTime;
      await monitoringService.recordTransactionMetrics(usedProcessor, {
        success: paymentResult.success,
        responseTime,
        amount: paymentRequest.amount,
        errorCode: paymentResult.success ? undefined : paymentResult.error
      });

      // 5. Store Transaction (would integrate with database service)
      // await transactionService.createTransaction({
      //   ...paymentRequest,
      //   processorName: usedProcessor,
      //   processorTransactionId: paymentResult.processorTransactionId,
      //   status: paymentResult.status,
      //   complianceData: complianceResult,
      //   routingData: routingDecision
      // });

      logger.info('Payment processing completed', {
        transactionId: paymentRequest.transactionId,
        success: paymentResult.success,
        status: paymentResult.status,
        processor: usedProcessor,
        responseTime
      });

      res.json({
        success: paymentResult.success,
        transactionId: paymentRequest.transactionId,
        status: paymentResult.status,
        processor: usedProcessor,
        paymentUrl: paymentResult.metadata?.paymentUrl,
        requiresRedirect: paymentResult.metadata?.requiresRedirect || false,
        compliance: {
          passed: complianceResult.passed,
          riskLevel: complianceResult.riskAssessment.riskLevel,
          requiresManualReview: complianceResult.riskAssessment.requiresManualReview
        },
        routing: {
          confidence: routingDecision.confidence,
          reason: routingDecision.reason
        },
        metadata: paymentResult.metadata
      });

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      logger.error('Payment processing failed', {
        transactionId: req.body.transactionId,
        userId: req.user?.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime
      });

      res.status(500).json({
        success: false,
        error: 'Payment processing failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  })
);

/**
 * POST /payments/payouts
 * Process creator payouts with compliance validation
 */
router.post('/payouts',
  authenticateCreator,
  [
    body('amount').isFloat({ min: 10.00 }).withMessage('Minimum payout amount is $10'),
    body('currency').isISO4217().withMessage('Invalid currency code'),
    body('destination.type').isIn(['paxum_ewallet', 'wire_transfer', 'bank_transfer']).withMessage('Invalid destination type'),
    body('destination.details.email').optional().isEmail().withMessage('Invalid email')
  ],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();

    try {
      const payoutRequest: PayoutRequest = {
        payoutId: req.body.payoutId || `payout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        amount: req.body.amount,
        currency: req.body.currency,
        destination: req.body.destination,
        description: req.body.description || 'Creator earnings payout',
        metadata: req.body.metadata,
        creatorId: req.user?.id as string
      };

      // 1. Compliance Validation for Payouts
      const complianceResult = await complianceService.validatePayoutCompliance(
        payoutRequest,
        req.user
      );

      if (!complianceResult.passed) {
        return res.status(400).json({
          success: false,
          error: 'Payout compliance validation failed',
          details: {
            errors: complianceResult.errors,
            warnings: complianceResult.warnings
          }
        });
      }

      // 2. Routing for Payouts
      const routingDecision = await routingService.routePayoutProcessor(payoutRequest);

      // 3. Process Payout
      const processor = PaymentProcessorFactory.getProcessor('mock'); // Only mock processor available currently
      const payoutResult = await processor.processPayout!(payoutRequest);

      // 4. Record Metrics
      const responseTime = Date.now() - startTime;
      await monitoringService.recordTransactionMetrics(routingDecision.primaryProcessor, {
        success: payoutResult.success,
        responseTime,
        amount: payoutRequest.amount
      });

      logger.info('Payout processing completed', {
        payoutId: payoutRequest.payoutId,
        creatorId: req.user?.id,
        success: payoutResult.success,
        status: payoutResult.status,
        processor: routingDecision.primaryProcessor
      });

      res.json({
        success: payoutResult.success,
        payoutId: payoutRequest.payoutId,
        status: payoutResult.status,
        processor: routingDecision.primaryProcessor,
        estimatedArrival: payoutResult.estimatedArrival,
        compliance: {
          passed: complianceResult.passed
        },
        processorResponse: payoutResult.processorResponse
      });

    } catch (error) {
      logger.error('Payout processing failed', {
        payoutId: req.body.payoutId,
        creatorId: req.user?.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        error: 'Payout processing failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  })
);

/**
 * POST /payments/refunds
 * Process refunds
 */
router.post('/refunds',
  authenticateUser,
  [
    body('originalTransactionId').notEmpty().withMessage('Original transaction ID required'),
    body('amount').optional().isFloat({ min: 0.01 }).withMessage('Refund amount must be positive'),
    body('reason').optional().isLength({ max: 500 }).withMessage('Reason too long')
  ],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const refundRequest: RefundRequest = {
        transactionId: req.body.originalTransactionId,
        processorTransactionId: req.body.processorTransactionId || req.body.originalTransactionId,
        amount: req.body.amount,
        reason: req.body.reason || 'Customer request',
        metadata: req.body.metadata
      };

      // Get original transaction details (would query database)
      // const originalTransaction = await transactionService.getTransaction(refundRequest.originalTransactionId);
      
      // For now, assume we need to determine processor from transaction ID or use routing
      const processorName = req.body.processor || 'ccbill'; // Would be determined from original transaction
      
      const processor = PaymentProcessorFactory.getProcessor('mock'); // Only mock processor available currently
      const refundResult = await processor.processRefund(refundRequest);

      logger.info('Refund processing completed', {
        originalTransactionId: refundRequest.transactionId,
        refundId: refundResult.refundId,
        success: refundResult.success,
        status: refundResult.status
      });

      res.json({
        success: refundResult.success,
        refundId: refundResult.refundId,
        status: refundResult.status,
        message: refundResult.success ? 'Refund processed successfully' : refundResult.errorMessage
      });

    } catch (error) {
      logger.error('Refund processing failed', {
        originalTransactionId: req.body.originalTransactionId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        error: 'Refund processing failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  })
);

/**
 * POST /payments/webhooks/:processor
 * Handle webhooks from payment processors
 */
router.post('/webhooks/:processor',
  [
    param('processor').isIn(['ccbill', 'paxum', 'segpay']).withMessage('Invalid processor')
  ],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const processorName = req.params.processor;
    const signature = req.get('X-Signature') || req.get('Authorization') || '';
    const timestamp = req.get('X-Timestamp') || Date.now().toString();

    try {
      const processor = PaymentProcessorFactory.getProcessor('mock'); // Only mock processor available currently
      
      const webhookData: WebhookData = {
        id: req.body.id || 'webhook-' + Date.now(),
        type: req.body.eventType || req.body.event || req.body.action || 'unknown',
        data: req.body,
        timestamp: new Date(parseInt(timestamp) || Date.now()),
        signature
      };

      // Mock webhook validation for now
      const isValid = processor.verifyWebhookSignature ? 
        processor.verifyWebhookSignature(JSON.stringify(req.body), signature) : true;

      if (isValid) {
        logger.info('Webhook processed successfully', {
          processor: processorName,
          eventType: req.body.eventType || req.body.event || req.body.action,
          transactionId: req.body.transactionId || req.body.transaction_id
        });

        res.status(200).json({ success: true, message: 'Webhook processed' });
      } else {
        logger.warn('Webhook validation failed', {
          processor: processorName,
          signature: signature.substring(0, 10) + '...'
        });

        res.status(400).json({ success: false, error: 'Invalid webhook signature' });
      }

    } catch (error) {
      logger.error('Webhook processing failed', {
        processor: processorName,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({ success: false, error: 'Webhook processing failed' });
    }
  })
);

/**
 * GET /payments/processors
 * Get available payment processors and their health status
 */
router.get('/processors',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const availableProcessors = PaymentProcessorFactory.getAvailableProcessors();
      const processorMetrics = monitoringService.getProcessorMetrics();
      const processorHealth = await Promise.all(
        availableProcessors.map(async (processorName: string) => {
          const health = await monitoringService.checkProcessorHealth(processorName);
          const metrics = processorMetrics.find(m => m.processorName === processorName);
          
          return {
            name: processorName,
            healthy: health.healthy,
            uptime: metrics?.uptime || 0,
            responseTime: health.details?.responseTime || 0,
            successRate: metrics?.successRate || 0,
            lastCheck: new Date().toISOString()
          };
        })
      );

      res.json({
        success: true,
        processors: processorHealth,
        default: {
          payment: PaymentProcessorFactory.getDefaultProcessor().constructor.name.toLowerCase().replace('processor', ''),
          payout: PaymentProcessorFactory.getDefaultPayoutProcessor().constructor.name.toLowerCase().replace('processor', '')
        }
      });

    } catch (error) {
      logger.error('Failed to get processor status', { error });
      
      res.status(500).json({
        success: false,
        error: 'Failed to get processor status'
      });
    }
  })
);

/**
 * GET /payments/monitoring/dashboard
 * Get monitoring dashboard data
 */
router.get('/monitoring/dashboard',
  asyncHandler(async (req: Request, res: Response) => {
    const hours = parseInt(req.query.hours as string) || 24;

    try {
      const report = await monitoringService.generatePerformanceReport(hours);
      const alerts = monitoringService.getActiveAlerts();

      res.json({
        success: true,
        timeframe: `${hours} hours`,
        summary: report.summary,
        processors: report.processors,
        alerts: alerts,
        generatedAt: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Failed to generate monitoring dashboard', { error });
      
      res.status(500).json({
        success: false,
        error: 'Failed to generate monitoring dashboard'
      });
    }
  })
);

/**
 * GET /payments/transactions/:id/status
 * Get transaction status
 */
router.get('/transactions/:id/status',
  authenticateUser,
  [
    param('id').notEmpty().withMessage('Transaction ID required')
  ],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const transactionId = req.params.id;

    try {
      // This would typically query the database for the transaction
      // and then check status with the appropriate processor
      
      // For now, assume we can determine processor from transaction ID pattern
      let processorName = 'ccbill';
      if (transactionId.startsWith('paxum_')) processorName = 'paxum';
      if (transactionId.startsWith('segpay_')) processorName = 'segpay';

      const processor = PaymentProcessorFactory.getProcessor('mock'); // Only mock processor available currently
      const statusResult = await processor.getTransactionStatus(transactionId);

      res.json({
        success: true,
        transactionId,
        status: statusResult.status,
        processor: processorName,
        lastUpdated: new Date().toISOString(),
        metadata: statusResult.metadata
      });

    } catch (error) {
      logger.error('Failed to get transaction status', {
        transactionId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get transaction status'
      });
    }
  })
);

export default router;