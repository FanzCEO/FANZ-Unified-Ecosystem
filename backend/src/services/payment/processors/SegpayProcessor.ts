import crypto from 'crypto';
import axios from 'axios';
import { IPaymentProcessor, IPayoutProcessor } from '../interfaces/IPaymentProcessor';
import {
  PaymentRequest,
  PaymentResult,
  RefundRequest,
  RefundResult,
  PayoutRequest,
  PayoutResult,
  WebhookData,
  ProcessorHealthCheck
} from '../types/PaymentTypes';
import { logger } from '../../../utils/logger';

interface SegpayConfig {
  packageId: string;
  billerId: string;
  username: string;
  password: string;
  postUrl?: string;
  environment: 'sandbox' | 'production';
}

interface SegpayTransactionRequest {
  x_bill_id: string;
  x_package_id: string;
  x_username: string;
  x_password: string;
  x_amount: string;
  x_currency: string;
  x_description: string;
  x_customer_email: string;
  x_customer_firstname: string;
  x_customer_lastname: string;
  x_customer_phone?: string;
  x_zip_code?: string;
  x_country?: string;
  x_member_id?: string;
  x_url_success: string;
  x_url_decline: string;
  x_url_postback: string;
  x_version: string;
}

interface SegpayWebhookPayload {
  action: 'purchase' | 'rebill' | 'cancel' | 'refund' | 'chargeback';
  transaction_id: string;
  package_id: string;
  biller_id: string;
  amount: string;
  currency: string;
  email: string;
  timestamp: string;
  auth_key: string;
  member_id?: string;
  x_trans_id?: string;
}

export class SegpayProcessor implements IPaymentProcessor, IPayoutProcessor {
  private config: SegpayConfig;
  private baseUrl: string;

  constructor(config: SegpayConfig) {
    this.config = config;
    this.baseUrl = config.environment === 'production' 
      ? 'https://secure2.segpay.com'
      : 'https://test.segpay.com';
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    try {
      logger.info('Processing Segpay payment', { 
        transactionId: request.transactionId,
        amount: request.amount 
      });

      // Segpay uses hosted payment pages, so we create a redirect URL
      const transactionRequest: SegpayTransactionRequest = {
        x_bill_id: this.config.billerId,
        x_package_id: this.config.packageId,
        x_username: this.config.username,
        x_password: this.config.password,
        x_amount: request.amount.toFixed(2),
        x_currency: request.currency,
        x_description: request.description || 'FANZ Content Purchase',
        x_customer_email: request.customerInfo?.email || '',
        x_customer_firstname: request.customerInfo?.firstName || '',
        x_customer_lastname: request.customerInfo?.lastName || '',
        x_customer_phone: request.customerInfo?.phone,
        x_zip_code: request.customerInfo?.zipCode,
        x_country: request.customerInfo?.country,
        x_member_id: request.customerId,
        x_url_success: request.successUrl || `${process.env.APP_BASE_URL}/payment/success`,
        x_url_decline: request.failureUrl || `${process.env.APP_BASE_URL}/payment/failure`,
        x_url_postback: `${process.env.APP_BASE_URL}/webhooks/segpay`,
        x_version: '1.0'
      };

      // Generate payment URL with query parameters
      const paymentUrl = this.generatePaymentUrl(transactionRequest);

      return {
        success: true,
        transactionId: request.transactionId || this.generateTransactionId(),
        status: 'pending',
        processorTransactionId: request.transactionId,
        metadata: {
          paymentUrl,
          processor: 'segpay',
          requiresRedirect: true
        }
      };

    } catch (error) {
      logger.error('Segpay payment processing failed', { error, requestId: request.transactionId });
      return {
        success: false,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: { processor: 'segpay' }
      };
    }
  }

  async processRefund(request: RefundRequest): Promise<RefundResult> {
    try {
      logger.info('Processing Segpay refund', { 
        transactionId: request.originalTransactionId,
        amount: request.amount 
      });

      // Segpay refunds are typically processed via their merchant portal
      // or through direct API calls to their refund endpoint
      const refundData = {
        username: this.config.username,
        password: this.config.password,
        transaction_id: request.originalTransactionId,
        amount: request.amount?.toFixed(2),
        reason: request.reason || 'Customer request'
      };

      const response = await axios.post(`${this.baseUrl}/api/refund`, refundData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 30000
      });

      if (response.data.status === 'success') {
        return {
          success: true,
          refundId: response.data.refund_id || this.generateTransactionId(),
          status: 'completed',
          metadata: {
            processor: 'segpay',
            processorRefundId: response.data.refund_id
          }
        };
      } else {
        throw new Error(response.data.message || 'Refund failed');
      }

    } catch (error) {
      logger.error('Segpay refund failed', { error, requestId: request.originalTransactionId });
      return {
        success: false,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Refund failed',
        metadata: { processor: 'segpay' }
      };
    }
  }

  async processPayout(request: PayoutRequest): Promise<PayoutResult> {
    // Segpay primarily focuses on payment processing
    // Payouts are typically handled through their merchant portal
    logger.warn('Segpay does not support automated payouts - use merchant portal');
    
    return {
      success: false,
      status: 'failed',
      error: 'Segpay does not support automated payouts',
      metadata: { processor: 'segpay' }
    };
  }

  async getTransactionStatus(transactionId: string): Promise<PaymentResult> {
    try {
      const response = await axios.post(`${this.baseUrl}/api/transaction/status`, {
        username: this.config.username,
        password: this.config.password,
        transaction_id: transactionId
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 15000
      });

      const status = this.mapSegpayStatus(response.data.status);

      return {
        success: true,
        transactionId,
        status,
        processorTransactionId: response.data.transaction_id,
        metadata: {
          processor: 'segpay',
          processorStatus: response.data.status,
          amount: response.data.amount,
          currency: response.data.currency
        }
      };

    } catch (error) {
      logger.error('Failed to get Segpay transaction status', { error, transactionId });
      return {
        success: false,
        status: 'unknown',
        error: error instanceof Error ? error.message : 'Status check failed',
        metadata: { processor: 'segpay' }
      };
    }
  }

  async handleWebhook(data: WebhookData): Promise<boolean> {
    try {
      const payload = data.payload as SegpayWebhookPayload;
      
      // Verify webhook authenticity
      if (!this.verifyWebhookSignature(data.rawPayload, data.signature || '')) {
        logger.error('Segpay webhook signature verification failed');
        return false;
      }

      logger.info('Processing Segpay webhook', { 
        action: payload.action,
        transactionId: payload.transaction_id 
      });

      // Process different webhook events
      switch (payload.action) {
        case 'purchase':
          await this.handlePurchaseWebhook(payload);
          break;
        case 'rebill':
          await this.handleRebillWebhook(payload);
          break;
        case 'cancel':
          await this.handleCancelWebhook(payload);
          break;
        case 'refund':
          await this.handleRefundWebhook(payload);
          break;
        case 'chargeback':
          await this.handleChargebackWebhook(payload);
          break;
        default:
          logger.warn('Unknown Segpay webhook action', { action: payload.action });
      }

      return true;

    } catch (error) {
      logger.error('Segpay webhook processing failed', { error });
      return false;
    }
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      // Segpay uses auth_key for webhook verification
      const webhookData = JSON.parse(payload) as SegpayWebhookPayload;
      
      // Generate expected auth key
      const expectedAuthKey = crypto
        .createHash('sha256')
        .update(`${webhookData.transaction_id}${webhookData.amount}${this.config.password}`)
        .digest('hex');

      return webhookData.auth_key === expectedAuthKey;

    } catch (error) {
      logger.error('Segpay webhook signature verification error', { error });
      return false;
    }
  }

  async healthCheck(): Promise<ProcessorHealthCheck> {
    try {
      // Test API connectivity with a simple authentication check
      const response = await axios.post(`${this.baseUrl}/api/test`, {
        username: this.config.username,
        password: this.config.password
      }, {
        timeout: 10000
      });

      const isHealthy = response.status === 200;

      return {
        processor: 'segpay',
        healthy: isHealthy,
        message: isHealthy ? 'Segpay API accessible' : 'Segpay API connection failed',
        responseTime: Date.now(),
        metadata: {
          environment: this.config.environment,
          packageId: this.config.packageId
        }
      };

    } catch (error) {
      return {
        processor: 'segpay',
        healthy: false,
        message: error instanceof Error ? error.message : 'Health check failed',
        responseTime: Date.now(),
        metadata: { environment: this.config.environment }
      };
    }
  }

  // Private helper methods
  private generatePaymentUrl(request: SegpayTransactionRequest): string {
    const params = new URLSearchParams();
    
    Object.entries(request).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    return `${this.baseUrl}/payment/process?${params.toString()}`;
  }

  private generateTransactionId(): string {
    return `segpay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private mapSegpayStatus(segpayStatus: string): PaymentResult['status'] {
    const statusMap: Record<string, PaymentResult['status']> = {
      'approved': 'completed',
      'declined': 'failed',
      'pending': 'pending',
      'cancelled': 'cancelled',
      'refunded': 'refunded',
      'chargeback': 'disputed'
    };

    return statusMap[segpayStatus.toLowerCase()] || 'unknown';
  }

  private async handlePurchaseWebhook(payload: SegpayWebhookPayload): Promise<void> {
    // Update transaction status in database
    logger.info('Processing Segpay purchase webhook', { 
      transactionId: payload.transaction_id,
      amount: payload.amount 
    });
  }

  private async handleRebillWebhook(payload: SegpayWebhookPayload): Promise<void> {
    // Handle subscription rebill
    logger.info('Processing Segpay rebill webhook', { 
      transactionId: payload.transaction_id,
      amount: payload.amount 
    });
  }

  private async handleCancelWebhook(payload: SegpayWebhookPayload): Promise<void> {
    // Handle subscription cancellation
    logger.info('Processing Segpay cancel webhook', { 
      transactionId: payload.transaction_id 
    });
  }

  private async handleRefundWebhook(payload: SegpayWebhookPayload): Promise<void> {
    // Handle refund notification
    logger.info('Processing Segpay refund webhook', { 
      transactionId: payload.transaction_id,
      amount: payload.amount 
    });
  }

  private async handleChargebackWebhook(payload: SegpayWebhookPayload): Promise<void> {
    // Handle chargeback notification
    logger.info('Processing Segpay chargeback webhook', { 
      transactionId: payload.transaction_id,
      amount: payload.amount 
    });
  }
}