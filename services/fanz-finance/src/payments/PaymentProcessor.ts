/**
 * 💳 Payment Processor - Adult-Friendly Payment Gateway Integration
 * 
 * Unified interface for adult content payment processors
 * Supports CCBill, Segpay, Epoch, Verotel, Paxum, and cryptocurrency payments
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { createHash, createHmac } from 'crypto';
import axios, { AxiosInstance } from 'axios';
import { LedgerService } from '../ledger/LedgerService';
import { EventBus } from '../events/EventBus';
import { logger } from '../utils/logger';
import { metrics } from '../monitoring/metrics';

// ===== PAYMENT TYPES & INTERFACES =====

export interface PaymentRequest {
  amount: number;
  currency: string;
  customer_id: string;
  creator_id?: string;
  product_id?: string;
  subscription_id?: string;
  processor: PaymentProcessor;
  payment_method?: PaymentMethod;
  metadata: Record<string, any>;
  idempotency_key?: string;
  success_url?: string;
  cancel_url?: string;
}

export interface PaymentResponse {
  id: string;
  status: PaymentStatus;
  processor_transaction_id?: string;
  redirect_url?: string;
  error_message?: string;
  processor_fees?: number;
  net_amount?: number;
  created_at: Date;
}

export interface WebhookPayload {
  processor: PaymentProcessor;
  event_type: string;
  transaction_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  customer_id?: string;
  subscription_id?: string;
  metadata?: Record<string, any>;
  raw_data: any;
  signature?: string;
  timestamp?: string;
}

export type PaymentProcessor = 
  | 'ccbill' 
  | 'segpay' 
  | 'epoch' 
  | 'verotel' 
  | 'paxum' 
  | 'btcpay' 
  | 'coinpayments';

export type PaymentStatus = 
  | 'pending'
  | 'processing' 
  | 'completed' 
  | 'failed' 
  | 'cancelled' 
  | 'refunded' 
  | 'chargeback';

export type PaymentMethod = 
  | 'credit_card'
  | 'debit_card' 
  | 'bank_transfer'
  | 'crypto'
  | 'wallet'
  | 'gift_card';

// ===== PROCESSOR-SPECIFIC CONFIGURATIONS =====

export interface CCBillConfig {
  clientAccnum: string;
  flexId: string;
  salt: string;
  webhookUrl: string;
  currencies: string[];
  recurringSupport: boolean;
  adultContentFlags: {
    ageVerification: boolean;
    contentWarnings: boolean;
    geographicRestrictions: string[];
  };
}

export interface SegpayConfig {
  packageId: string;
  apiKey: string;
  webhookUrl: string;
  testMode: boolean;
  cryptoSupport: boolean;
}

export interface PaxumConfig {
  apiKey: string;
  apiSecret: string;
  businessId: string;
  webhookUrl: string;
  payoutCurrencies: string[];
}

export interface BTCPayConfig {
  serverUrl: string;
  apiKey: string;
  storeId: string;
  webhookSecret: string;
  supportedCoins: string[];
}

// ===== MAIN PAYMENT PROCESSOR SERVICE =====

export class PaymentProcessorService extends EventEmitter {
  private ledgerService: LedgerService;
  private eventBus: EventBus;
  private httpClients: Map<PaymentProcessor, AxiosInstance> = new Map();
  private processorConfigs: Map<PaymentProcessor, any> = new Map();

  constructor(ledgerService: LedgerService, eventBus: EventBus) {
    super();
    this.ledgerService = ledgerService;
    this.eventBus = eventBus;
    this.initializeProcessors();
  }

  /**
   * Initialize all payment processors
   */
  private initializeProcessors(): void {
    // CCBill Configuration
    if (process.env.CCBILL_CLIENT_ACCNUM) {
      this.processorConfigs.set('ccbill', {
        clientAccnum: process.env.CCBILL_CLIENT_ACCNUM,
        flexId: process.env.CCBILL_FLEX_ID,
        salt: process.env.CCBILL_SALT,
        webhookUrl: `${process.env.API_BASE_URL}/webhooks/ccbill`,
        currencies: ['USD', 'EUR', 'GBP', 'CAD'],
        recurringSupport: true,
        adultContentFlags: {
          ageVerification: true,
          contentWarnings: true,
          geographicRestrictions: process.env.CCBILL_BLOCKED_COUNTRIES?.split(',') || []
        }
      });

      this.httpClients.set('ccbill', axios.create({
        baseURL: 'https://api.ccbill.com',
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'FANZ-Finance-OS/1.0'
        }
      }));
    }

    // Segpay Configuration
    if (process.env.SEGPAY_PACKAGE_ID) {
      this.processorConfigs.set('segpay', {
        packageId: process.env.SEGPAY_PACKAGE_ID,
        apiKey: process.env.SEGPAY_API_KEY,
        webhookUrl: `${process.env.API_BASE_URL}/webhooks/segpay`,
        testMode: process.env.NODE_ENV !== 'production',
        cryptoSupport: true
      });

      this.httpClients.set('segpay', axios.create({
        baseURL: process.env.NODE_ENV === 'production' 
          ? 'https://api.segpay.com' 
          : 'https://test-api.segpay.com',
        timeout: 30000,
        headers: {
          'Authorization': `Bearer ${process.env.SEGPAY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }));
    }

    // Paxum Configuration (for creator payouts)
    if (process.env.PAXUM_API_KEY) {
      this.processorConfigs.set('paxum', {
        apiKey: process.env.PAXUM_API_KEY,
        apiSecret: process.env.PAXUM_API_SECRET,
        businessId: process.env.PAXUM_BUSINESS_ID,
        webhookUrl: `${process.env.API_BASE_URL}/webhooks/paxum`,
        payoutCurrencies: ['USD', 'EUR', 'CAD', 'GBP']
      });

      this.httpClients.set('paxum', axios.create({
        baseURL: 'https://api.paxum.com/v1',
        timeout: 30000,
        headers: {
          'X-API-Key': process.env.PAXUM_API_KEY,
          'Content-Type': 'application/json'
        }
      }));
    }

    // BTCPay Server Configuration (crypto payments)
    if (process.env.BTCPAY_SERVER_URL) {
      this.processorConfigs.set('btcpay', {
        serverUrl: process.env.BTCPAY_SERVER_URL,
        apiKey: process.env.BTCPAY_API_KEY,
        storeId: process.env.BTCPAY_STORE_ID,
        webhookSecret: process.env.BTCPAY_WEBHOOK_SECRET,
        supportedCoins: ['BTC', 'ETH', 'LTC', 'BCH']
      });

      this.httpClients.set('btcpay', axios.create({
        baseURL: process.env.BTCPAY_SERVER_URL,
        timeout: 60000, // Crypto transactions can be slow
        headers: {
          'Authorization': `token ${process.env.BTCPAY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }));
    }

    logger.info(`Payment processors initialized: ${Array.from(this.processorConfigs.keys()).join(', ')}`);
  }

  /**
   * Create a new payment transaction
   */
  public async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    const startTime = Date.now();

    try {
      // Validate request
      this.validatePaymentRequest(request);

      // Check if processor is available
      if (!this.processorConfigs.has(request.processor)) {
        throw new Error(`Payment processor not configured: ${request.processor}`);
      }

      // Create payment based on processor
      let response: PaymentResponse;

      switch (request.processor) {
        case 'ccbill':
          response = await this.createCCBillPayment(request);
          break;
        case 'segpay':
          response = await this.createSegpayPayment(request);
          break;
        case 'paxum':
          response = await this.createPaxumPayment(request);
          break;
        case 'btcpay':
          response = await this.createBTCPayPayment(request);
          break;
        default:
          throw new Error(`Processor not implemented: ${request.processor}`);
      }

      // Record metrics
      const processingTime = Date.now() - startTime;
      metrics.recordPaymentProcessing(request.processor, processingTime, response.status === 'completed');

      // Emit event
      this.eventBus.publish('payment.created', {
        paymentId: response.id,
        processor: request.processor,
        amount: request.amount,
        currency: request.currency,
        status: response.status
      });

      logger.info(`Payment created: ${response.id}`, {
        paymentId: response.id,
        processor: request.processor,
        amount: request.amount,
        currency: request.currency,
        processingTimeMs: processingTime
      });

      return response;

    } catch (error) {
      logger.error('Payment creation failed:', error);
      metrics.recordPaymentError(request.processor, 'payment_creation_failed');
      throw error;
    }
  }

  /**
   * Process incoming webhook from payment processor
   */
  public async processWebhook(processor: PaymentProcessor, payload: any, signature?: string): Promise<void> {
    try {
      // Verify webhook signature
      if (signature && !this.verifyWebhookSignature(processor, payload, signature)) {
        throw new Error('Invalid webhook signature');
      }

      // Normalize webhook payload
      const normalizedPayload = this.normalizeWebhookPayload(processor, payload);

      // Process the webhook based on event type
      await this.handleWebhookEvent(normalizedPayload);

      logger.info(`Webhook processed successfully`, {
        processor,
        eventType: normalizedPayload.event_type,
        transactionId: normalizedPayload.transaction_id
      });

    } catch (error) {
      logger.error('Webhook processing failed:', error);
      metrics.recordPaymentError(processor, 'webhook_processing_failed');
      throw error;
    }
  }

  /**
   * Get payment status from processor
   */
  public async getPaymentStatus(processor: PaymentProcessor, transactionId: string): Promise<PaymentStatus> {
    try {
      switch (processor) {
        case 'ccbill':
          return await this.getCCBillPaymentStatus(transactionId);
        case 'segpay':
          return await this.getSegpayPaymentStatus(transactionId);
        case 'btcpay':
          return await this.getBTCPayPaymentStatus(transactionId);
        default:
          throw new Error(`Status check not implemented for processor: ${processor}`);
      }
    } catch (error) {
      logger.error(`Failed to get payment status for ${transactionId}:`, error);
      return 'failed';
    }
  }

  // ===== CCBILL IMPLEMENTATION =====

  private async createCCBillPayment(request: PaymentRequest): Promise<PaymentResponse> {
    const config = this.processorConfigs.get('ccbill') as CCBillConfig;
    const client = this.httpClients.get('ccbill')!;

    const paymentId = uuidv4();
    const timestamp = Math.floor(Date.now() / 1000);

    // Create form hash for security
    const formHash = this.createCCBillFormHash({
      clientAccnum: config.clientAccnum,
      flexId: config.flexId,
      price: request.amount,
      period: '30', // 30 days for subscriptions
      currencyCode: this.getCCBillCurrencyCode(request.currency),
      salt: config.salt
    });

    // Build redirect URL to CCBill payment form
    const redirectUrl = `https://api.ccbill.com/wap-frontflex/flexforms/${config.flexId}` +
      `?clientAccnum=${config.clientAccnum}` +
      `&price=${request.amount}` +
      `&period=30` +
      `&currencyCode=${this.getCCBillCurrencyCode(request.currency)}` +
      `&formDigest=${formHash}` +
      `&customer_fname=User` +
      `&customer_lname=Customer` +
      `&email=${request.metadata.email || 'user@fanz.com'}` +
      `&phone_number=${request.metadata.phone || '1234567890'}` +
      `&address1=${request.metadata.address || '123 Main St'}` +
      `&city=${request.metadata.city || 'New York'}` +
      `&state=${request.metadata.state || 'NY'}` +
      `&zipcode=${request.metadata.zip || '10001'}` +
      `&country=${request.metadata.country || 'US'}` +
      `&productDesc=${request.metadata.description || 'FANZ Platform Access'}` +
      `&redirectUrl=${request.success_url || ''}`;

    return {
      id: paymentId,
      status: 'pending',
      redirect_url: redirectUrl,
      created_at: new Date()
    };
  }

  private createCCBillFormHash(params: any): string {
    const hashString = `${params.price}${params.period}${params.currencyCode}${params.salt}`;
    return createHash('md5').update(hashString).digest('hex');
  }

  private getCCBillCurrencyCode(currency: string): string {
    const codes: Record<string, string> = {
      'USD': '840',
      'EUR': '978',
      'GBP': '826',
      'CAD': '124'
    };
    return codes[currency] || '840'; // Default to USD
  }

  private async getCCBillPaymentStatus(transactionId: string): Promise<PaymentStatus> {
    // CCBill doesn't provide a direct API for transaction status
    // Status updates come through webhooks only
    return 'pending';
  }

  // ===== SEGPAY IMPLEMENTATION =====

  private async createSegpayPayment(request: PaymentRequest): Promise<PaymentResponse> {
    const config = this.processorConfigs.get('segpay') as SegpayConfig;
    const client = this.httpClients.get('segpay')!;

    const paymentData = {
      packageid: config.packageId,
      price: request.amount,
      currency: request.currency,
      userid: request.customer_id,
      email: request.metadata.email || 'user@fanz.com',
      description: request.metadata.description || 'FANZ Platform Access',
      postbackurl: config.webhookUrl,
      redirect_success: request.success_url,
      redirect_decline: request.cancel_url
    };

    try {
      const response = await client.post('/api/v1/purchase', paymentData);
      
      return {
        id: uuidv4(),
        status: 'pending',
        processor_transaction_id: response.data.transactionId,
        redirect_url: response.data.url,
        created_at: new Date()
      };
    } catch (error) {
      logger.error('Segpay payment creation failed:', error);
      throw error;
    }
  }

  private async getSegpayPaymentStatus(transactionId: string): Promise<PaymentStatus> {
    const client = this.httpClients.get('segpay')!;
    
    try {
      const response = await client.get(`/api/v1/transaction/${transactionId}`);
      
      switch (response.data.status) {
        case 'APPROVED': return 'completed';
        case 'DECLINED': return 'failed';
        case 'PENDING': return 'pending';
        default: return 'failed';
      }
    } catch (error) {
      logger.error(`Failed to get Segpay status for ${transactionId}:`, error);
      return 'failed';
    }
  }

  // ===== PAXUM IMPLEMENTATION (CREATOR PAYOUTS) =====

  private async createPaxumPayment(request: PaymentRequest): Promise<PaymentResponse> {
    const config = this.processorConfigs.get('paxum') as PaxumConfig;
    const client = this.httpClients.get('paxum')!;

    // Paxum is primarily for payouts, not customer payments
    const payoutData = {
      amount: request.amount,
      currency: request.currency,
      email: request.metadata.payee_email,
      description: request.metadata.description || 'Creator Payout',
      reference: request.metadata.reference || uuidv4()
    };

    try {
      const response = await client.post('/payout', payoutData);
      
      return {
        id: uuidv4(),
        status: 'processing',
        processor_transaction_id: response.data.transactionId,
        processor_fees: response.data.fees,
        net_amount: request.amount - (response.data.fees || 0),
        created_at: new Date()
      };
    } catch (error) {
      logger.error('Paxum payout failed:', error);
      throw error;
    }
  }

  // ===== BTCPAY SERVER IMPLEMENTATION (CRYPTO) =====

  private async createBTCPayPayment(request: PaymentRequest): Promise<PaymentResponse> {
    const config = this.processorConfigs.get('btcpay') as BTCPayConfig;
    const client = this.httpClients.get('btcpay')!;

    const invoiceData = {
      amount: request.amount,
      currency: request.currency,
      orderId: request.metadata.order_id || uuidv4(),
      itemDesc: request.metadata.description || 'FANZ Platform Access',
      notificationURL: config.webhookUrl,
      redirectURL: request.success_url,
      buyer: {
        email: request.metadata.email || 'user@fanz.com'
      }
    };

    try {
      const response = await client.post(`/stores/${config.storeId}/invoices`, invoiceData);
      
      return {
        id: uuidv4(),
        status: 'pending',
        processor_transaction_id: response.data.id,
        redirect_url: response.data.url,
        created_at: new Date()
      };
    } catch (error) {
      logger.error('BTCPay payment creation failed:', error);
      throw error;
    }
  }

  private async getBTCPayPaymentStatus(transactionId: string): Promise<PaymentStatus> {
    const config = this.processorConfigs.get('btcpay') as BTCPayConfig;
    const client = this.httpClients.get('btcpay')!;
    
    try {
      const response = await client.get(`/stores/${config.storeId}/invoices/${transactionId}`);
      
      switch (response.data.status) {
        case 'Paid': return 'completed';
        case 'Expired':
        case 'Invalid': return 'failed';
        case 'New':
        case 'Processing': return 'pending';
        default: return 'failed';
      }
    } catch (error) {
      logger.error(`Failed to get BTCPay status for ${transactionId}:`, error);
      return 'failed';
    }
  }

  // ===== WEBHOOK PROCESSING =====

  private normalizeWebhookPayload(processor: PaymentProcessor, payload: any): WebhookPayload {
    switch (processor) {
      case 'ccbill':
        return this.normalizeCCBillWebhook(payload);
      case 'segpay':
        return this.normalizeSegpayWebhook(payload);
      case 'btcpay':
        return this.normalizeBTCPayWebhook(payload);
      default:
        throw new Error(`Webhook normalization not implemented for processor: ${processor}`);
    }
  }

  private normalizeCCBillWebhook(payload: any): WebhookPayload {
    return {
      processor: 'ccbill',
      event_type: payload.eventType || 'payment',
      transaction_id: payload.subscriptionId || payload.transactionId,
      amount: parseFloat(payload.billedAmount || payload.amount),
      currency: payload.billedCurrency || 'USD',
      status: this.mapCCBillStatus(payload.eventType),
      customer_id: payload.clientAccnum,
      subscription_id: payload.subscriptionId,
      raw_data: payload
    };
  }

  private normalizeSegpayWebhook(payload: any): WebhookPayload {
    return {
      processor: 'segpay',
      event_type: payload.action || 'payment',
      transaction_id: payload.transaction_id,
      amount: parseFloat(payload.amount),
      currency: payload.currency || 'USD',
      status: this.mapSegpayStatus(payload.action),
      customer_id: payload.userid,
      raw_data: payload
    };
  }

  private normalizeBTCPayWebhook(payload: any): WebhookPayload {
    return {
      processor: 'btcpay',
      event_type: payload.type,
      transaction_id: payload.invoiceId,
      amount: parseFloat(payload.price),
      currency: payload.currency,
      status: this.mapBTCPayStatus(payload.type),
      raw_data: payload
    };
  }

  private mapCCBillStatus(eventType: string): PaymentStatus {
    switch (eventType) {
      case 'NewSaleSuccess': return 'completed';
      case 'NewSaleFailure': return 'failed';
      case 'Cancellation': return 'cancelled';
      case 'Chargeback': return 'chargeback';
      case 'Refund': return 'refunded';
      default: return 'pending';
    }
  }

  private mapSegpayStatus(action: string): PaymentStatus {
    switch (action) {
      case 'charge': return 'completed';
      case 'decline': return 'failed';
      case 'cancel': return 'cancelled';
      case 'chargeback': return 'chargeback';
      case 'refund': return 'refunded';
      default: return 'pending';
    }
  }

  private mapBTCPayStatus(type: string): PaymentStatus {
    switch (type) {
      case 'InvoicePaymentSettled': return 'completed';
      case 'InvoiceExpired': return 'failed';
      case 'InvoiceInvalid': return 'failed';
      default: return 'pending';
    }
  }

  private async handleWebhookEvent(webhook: WebhookPayload): Promise<void> {
    try {
      // Create ledger entries based on webhook event
      if (webhook.status === 'completed') {
        await this.recordSuccessfulPayment(webhook);
      } else if (webhook.status === 'failed') {
        await this.recordFailedPayment(webhook);
      } else if (webhook.status === 'refunded') {
        await this.recordRefund(webhook);
      } else if (webhook.status === 'chargeback') {
        await this.recordChargeback(webhook);
      }

      // Emit webhook processed event
      this.eventBus.publish('webhook.processed', {
        processor: webhook.processor,
        eventType: webhook.event_type,
        transactionId: webhook.transaction_id,
        status: webhook.status
      });

    } catch (error) {
      logger.error('Failed to handle webhook event:', error);
      throw error;
    }
  }

  private async recordSuccessfulPayment(webhook: WebhookPayload): Promise<void> {
    const processorFee = this.calculateProcessorFee(webhook.processor, webhook.amount);
    const netAmount = webhook.amount - processorFee;
    const creatorShare = netAmount * 0.7; // 70% to creator
    const platformFee = netAmount * 0.2;   // 20% platform fee
    const taxReserve = netAmount * 0.1;    // 10% tax reserve

    await this.ledgerService.createJournalEntry({
      description: `Payment received - ${webhook.processor} ${webhook.transaction_id}`,
      reference: webhook.transaction_id,
      entries: [
        // Receive payment
        { 
          account: `assets:cash:${webhook.processor}`, 
          debit: webhook.amount,
          currency: webhook.currency
        },
        // Record processor fees
        { 
          account: `expenses:processing_fees:${webhook.processor}`, 
          debit: processorFee,
          currency: webhook.currency
        },
        // Creator earnings
        { 
          account: `liabilities:creator:${webhook.customer_id}`, 
          credit: creatorShare,
          currency: webhook.currency
        },
        // Platform revenue
        { 
          account: 'revenue:platform:fees', 
          credit: platformFee,
          currency: webhook.currency
        },
        // Tax withholding
        { 
          account: 'liabilities:tax:withholding', 
          credit: taxReserve,
          currency: webhook.currency
        }
      ],
      metadata: {
        processor: webhook.processor,
        transaction_id: webhook.transaction_id,
        webhook_event: webhook.event_type
      },
      created_by: 'payment-processor'
    });
  }

  private async recordFailedPayment(webhook: WebhookPayload): Promise<void> {
    // Log failed payment for analytics
    logger.info(`Payment failed: ${webhook.transaction_id}`, {
      processor: webhook.processor,
      amount: webhook.amount,
      currency: webhook.currency
    });

    // No ledger entries needed for failed payments
    // Just emit event for tracking
    this.eventBus.publish('payment.failed', {
      processor: webhook.processor,
      transactionId: webhook.transaction_id,
      amount: webhook.amount,
      currency: webhook.currency
    });
  }

  private async recordRefund(webhook: WebhookPayload): Promise<void> {
    await this.ledgerService.createJournalEntry({
      description: `Refund processed - ${webhook.processor} ${webhook.transaction_id}`,
      reference: webhook.transaction_id,
      entries: [
        // Refund payment
        { 
          account: `assets:cash:${webhook.processor}`, 
          credit: webhook.amount,
          currency: webhook.currency
        },
        // Reverse revenue recognition
        { 
          account: 'revenue:platform:fees', 
          debit: webhook.amount * 0.2,
          currency: webhook.currency
        },
        // Reverse creator earnings
        { 
          account: `liabilities:creator:${webhook.customer_id}`, 
          debit: webhook.amount * 0.7,
          currency: webhook.currency
        },
        // Reverse tax reserve
        { 
          account: 'liabilities:tax:withholding', 
          debit: webhook.amount * 0.1,
          currency: webhook.currency
        }
      ],
      metadata: {
        processor: webhook.processor,
        transaction_id: webhook.transaction_id,
        refund_reason: webhook.raw_data.reason
      },
      created_by: 'payment-processor'
    });
  }

  private async recordChargeback(webhook: WebhookPayload): Promise<void> {
    await this.ledgerService.createJournalEntry({
      description: `Chargeback - ${webhook.processor} ${webhook.transaction_id}`,
      reference: webhook.transaction_id,
      entries: [
        // Record chargeback loss
        { 
          account: 'expenses:chargebacks', 
          debit: webhook.amount,
          currency: webhook.currency
        },
        // Reduce cash
        { 
          account: `assets:cash:${webhook.processor}`, 
          credit: webhook.amount,
          currency: webhook.currency
        }
      ],
      metadata: {
        processor: webhook.processor,
        transaction_id: webhook.transaction_id,
        chargeback_reason: webhook.raw_data.reason
      },
      created_by: 'payment-processor'
    });
  }

  // ===== UTILITY METHODS =====

  private calculateProcessorFee(processor: PaymentProcessor, amount: number): number {
    const feeRates: Record<PaymentProcessor, number> = {
      ccbill: 0.085,      // 8.5%
      segpay: 0.079,      // 7.9%
      epoch: 0.089,       // 8.9%
      verotel: 0.085,     // 8.5%
      paxum: 0.025,       // 2.5% (for payouts)
      btcpay: 0.015,      // 1.5% (crypto)
      coinpayments: 0.015 // 1.5% (crypto)
    };

    return amount * (feeRates[processor] || 0.08);
  }

  private validatePaymentRequest(request: PaymentRequest): void {
    if (!request.amount || request.amount <= 0) {
      throw new Error('Payment amount must be greater than 0');
    }

    if (!request.currency) {
      throw new Error('Currency is required');
    }

    if (!request.customer_id) {
      throw new Error('Customer ID is required');
    }

    if (!request.processor) {
      throw new Error('Payment processor is required');
    }

    // Validate minimum amounts per processor
    const minimumAmounts: Record<PaymentProcessor, number> = {
      ccbill: 2.95,
      segpay: 1.00,
      epoch: 2.95,
      verotel: 1.00,
      paxum: 5.00,
      btcpay: 0.01,
      coinpayments: 0.01
    };

    const minimum = minimumAmounts[request.processor];
    if (minimum && request.amount < minimum) {
      throw new Error(`Minimum payment amount for ${request.processor} is ${minimum} ${request.currency}`);
    }
  }

  private verifyWebhookSignature(processor: PaymentProcessor, payload: any, signature: string): boolean {
    switch (processor) {
      case 'ccbill':
        return this.verifyCCBillSignature(payload, signature);
      case 'segpay':
        return this.verifySegpaySignature(payload, signature);
      case 'btcpay':
        return this.verifyBTCPaySignature(payload, signature);
      default:
        return true; // Skip verification for processors that don't support it
    }
  }

  private verifyCCBillSignature(payload: any, signature: string): boolean {
    const config = this.processorConfigs.get('ccbill') as CCBillConfig;
    const expectedHash = createHash('md5')
      .update(`${payload.subscriptionId}1${config.salt}`)
      .digest('hex');
    
    return signature.toLowerCase() === expectedHash.toLowerCase();
  }

  private verifySegpaySignature(payload: any, signature: string): boolean {
    const config = this.processorConfigs.get('segpay') as SegpayConfig;
    const expectedSignature = createHmac('sha256', config.apiKey)
      .update(JSON.stringify(payload))
      .digest('hex');
    
    return signature === expectedSignature;
  }

  private verifyBTCPaySignature(payload: any, signature: string): boolean {
    const config = this.processorConfigs.get('btcpay') as BTCPayConfig;
    const expectedSignature = createHmac('sha256', config.webhookSecret)
      .update(JSON.stringify(payload))
      .digest('hex');
    
    return signature === `sha256=${expectedSignature}`;
  }
}