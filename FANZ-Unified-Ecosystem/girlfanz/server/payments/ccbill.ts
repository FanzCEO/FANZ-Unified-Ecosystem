import crypto from 'crypto';
import { storage } from '../storage';

export interface CCBillConfig {
  accountNumber: string;
  clientId: string;
  clientSecret: string;
  formName: string;
  webhookSecret: string;
  sandboxMode: boolean;
}

export interface CCBillSubscriptionParams {
  userId: string;
  creatorId: string;
  pricePerMonth: number;
  currency: string;
  planName: string;
  description: string;
  billingCycle: string;
}

export interface CCBillPurchaseParams {
  userId: string;
  creatorId?: string;
  mediaId?: string;
  amount: number;
  currency: string;
  description: string;
  type: 'purchase' | 'tip';
}

export class CCBillService {
  private config: CCBillConfig;
  private baseUrl: string;

  constructor(config: CCBillConfig) {
    this.config = config;
    this.baseUrl = config.sandboxMode 
      ? 'https://bill.ccbill.com/jpost/billingattest.cgi'
      : 'https://bill.ccbill.com/jpost/billing.cgi';
  }

  // Generate hosted checkout URL for subscriptions
  generateSubscriptionCheckoutUrl(params: CCBillSubscriptionParams): string {
    const formDigest = this.generateFormDigest({
      clientAccnum: this.config.accountNumber,
      clientSubacc: '0000',
      formName: this.config.formName,
      subscriptionTypeId: '1', // Recurring subscription
      price: (params.pricePerMonth / 100).toFixed(2),
      period: '30', // 30 days for monthly
      currencyCode: params.currency === 'USD' ? '840' : '840',
      formDigest: '',
    });

    const queryParams = new URLSearchParams({
      clientAccnum: this.config.accountNumber,
      clientSubacc: '0000',
      formName: this.config.formName,
      subscriptionTypeId: '1',
      price: (params.pricePerMonth / 100).toFixed(2),
      period: '30',
      currencyCode: params.currency === 'USD' ? '840' : '840',
      formDigest,
      // Custom fields for tracking
      customer_fname: 'Fan',
      customer_lname: 'User',
      // Pass through custom data
      UDT1: params.userId, // Fan user ID
      UDT2: params.creatorId, // Creator ID
      UDT3: 'subscription', // Transaction type
      UDT4: params.planName,
    });

    return `${this.baseUrl}?${queryParams.toString()}`;
  }

  // Generate hosted checkout URL for one-time purchases
  generatePurchaseCheckoutUrl(params: CCBillPurchaseParams): string {
    const formDigest = this.generateFormDigest({
      clientAccnum: this.config.accountNumber,
      clientSubacc: '0000',
      formName: this.config.formName,
      initialPrice: (params.amount / 100).toFixed(2),
      currencyCode: params.currency === 'USD' ? '840' : '840',
      formDigest: '',
    });

    const queryParams = new URLSearchParams({
      clientAccnum: this.config.accountNumber,
      clientSubacc: '0000',
      formName: this.config.formName,
      initialPrice: (params.amount / 100).toFixed(2),
      currencyCode: params.currency === 'USD' ? '840' : '840',
      formDigest,
      // Custom fields
      customer_fname: 'Fan',
      customer_lname: 'User',
      // Pass through custom data
      UDT1: params.userId,
      UDT2: params.creatorId || '',
      UDT3: params.type,
      UDT4: params.mediaId || '',
    });

    return `${this.baseUrl}?${queryParams.toString()}`;
  }

  // Generate form digest for security - CCBill specific format
  private generateFormDigest(params: {
    clientAccnum: string;
    clientSubacc: string; 
    formName: string;
    price?: string;
    period?: string;
    initialPrice?: string;
    currencyCode: string;
  }): string {
    // CCBill digest format: clientAccnum + clientSubacc + formName + (price + period OR initialPrice) + currencyCode + salt
    let stringToHash: string;
    
    if (params.price && params.period) {
      // Subscription digest
      stringToHash = params.clientAccnum + params.clientSubacc + params.formName + 
                    params.price + params.period + params.currencyCode + this.config.clientSecret;
    } else if (params.initialPrice) {
      // One-time purchase digest  
      stringToHash = params.clientAccnum + params.clientSubacc + params.formName + 
                    params.initialPrice + params.currencyCode + this.config.clientSecret;
    } else {
      throw new Error('Invalid parameters for digest generation');
    }
    
    // Generate MD5 hash
    return crypto.createHash('md5').update(stringToHash).digest('hex');
  }

  // Verify CCBill webhook using MD5 verification (not HMAC)
  verifyWebhookData(formData: Record<string, string>): boolean {
    // CCBill sends verification via built-in fields
    const { verificationHash, ...data } = formData;
    
    if (!verificationHash) {
      return false;
    }

    // Create verification string from form data
    // CCBill concatenates specific fields for verification
    const verificationString = [
      data.clientAccnum || '',
      data.clientSubacc || '',
      data.subscriptionId || data.transactionId || '',
      this.config.webhookSecret // Verification key
    ].join('');

    const expectedHash = crypto.createHash('md5').update(verificationString).digest('hex');
    
    return expectedHash.toLowerCase() === verificationHash.toLowerCase();
  }

  // Process webhook notification
  async processWebhookNotification(webhookData: any): Promise<void> {
    const { eventType, subscriptionId, transactionId, customerId } = webhookData;
    
    switch (eventType) {
      case 'NewSaleSuccess':
        await this.handleNewSale(webhookData);
        break;
      case 'RenewalSuccess':
        await this.handleRenewalSuccess(webhookData);
        break;
      case 'Cancellation':
        await this.handleCancellation(webhookData);
        break;
      case 'Chargeback':
        await this.handleChargeback(webhookData);
        break;
      case 'Refund':
        await this.handleRefund(webhookData);
        break;
      default:
        console.warn(`Unhandled CCBill webhook event: ${eventType}`);
    }
  }

  private async handleNewSale(data: any): Promise<void> {
    const { 
      subscriptionId, 
      transactionId, 
      initialPrice, 
      accountingInitialPrice,
      UDT1: userId, 
      UDT2: creatorId, 
      UDT3: type,
      UDT4: additionalData,
      currencyCode
    } = data;

    // Create transaction record
    await storage.createTransaction({
      userId,
      creatorId: creatorId || null,
      mediaId: type === 'purchase' ? additionalData : null,
      provider: 'ccbill',
      providerTransactionId: transactionId,
      type,
      status: 'completed',
      amountCents: Math.round(parseFloat(initialPrice) * 100),
      currency: currencyCode === '840' ? 'USD' : 'USD',
      providerFee: Math.round((parseFloat(initialPrice) - parseFloat(accountingInitialPrice)) * 100),
      platformFee: Math.round(parseFloat(accountingInitialPrice) * 0.05 * 100), // 5% platform fee
      creatorEarnings: Math.round(parseFloat(accountingInitialPrice) * 0.95 * 100), // 95% to creator
      metadata: data,
    });

    // If it's a subscription, create or update subscription record
    if (type === 'subscription' && subscriptionId) {
      // Check if subscription already exists
      const existingSubscriptions = await storage.getSubscriptionsAsFan(userId);
      const existingSubscription = existingSubscriptions.find(s => s.providerSubscriptionId === subscriptionId);
      
      if (existingSubscription) {
        // Update existing subscription
        await storage.updateSubscription(existingSubscription.id, {
          status: 'active',
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        });
      } else {
        // Create new subscription
        await storage.createSubscription({
          userId,
          creatorId,
          provider: 'ccbill',
          providerSubscriptionId: subscriptionId,
          status: 'active',
          pricePerMonth: Math.round(parseFloat(initialPrice) * 100),
          currency: 'USD',
          billingCycle: 'monthly',
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Next month
        });
      }
    }

    // Log the transaction
    await storage.createAuditLog({
      actorId: userId,
      action: 'payment_success',
      targetType: 'transaction',
      targetId: transactionId,
      metadata: { provider: 'ccbill', amount: initialPrice, type },
    });
  }

  private async handleRenewalSuccess(data: any): Promise<void> {
    const { subscriptionId, transactionId, billingAmount, accountingAmount } = data;

    // Update subscription next billing date
    const subscription = await storage.getSubscriptionsAsFan(data.UDT1);
    const activeSubscription = subscription.find(s => s.providerSubscriptionId === subscriptionId);

    if (activeSubscription) {
      await storage.updateSubscription(activeSubscription.id, {
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      });

      // Create transaction record for renewal
      await storage.createTransaction({
        userId: activeSubscription.userId,
        creatorId: activeSubscription.creatorId,
        subscriptionId: activeSubscription.id,
        provider: 'ccbill',
        providerTransactionId: transactionId,
        type: 'subscription',
        status: 'completed',
        amountCents: Math.round(parseFloat(billingAmount) * 100),
        currency: 'USD',
        providerFee: Math.round((parseFloat(billingAmount) - parseFloat(accountingAmount)) * 100),
        platformFee: Math.round(parseFloat(accountingAmount) * 0.05 * 100),
        creatorEarnings: Math.round(parseFloat(accountingAmount) * 0.95 * 100),
        metadata: data,
      });
    }
  }

  private async handleCancellation(data: any): Promise<void> {
    const { subscriptionId } = data;
    
    // Find and cancel subscription
    const subscriptions = await storage.getSubscriptionsAsFan(data.UDT1);
    const activeSubscription = subscriptions.find(s => s.providerSubscriptionId === subscriptionId);

    if (activeSubscription) {
      await storage.updateSubscription(activeSubscription.id, {
        status: 'cancelled',
        cancelledAt: new Date(),
      });
    }
  }

  private async handleChargeback(data: any): Promise<void> {
    const { transactionId } = data;
    
    // Update transaction status to chargeback
    const transactions = await storage.getTransactionsAsBuyer(data.UDT1);
    const transaction = transactions.find(t => t.providerTransactionId === transactionId);

    if (transaction) {
      await storage.updateTransaction(transaction.id, {
        status: 'chargeback',
      });
    }
  }

  private async handleRefund(data: any): Promise<void> {
    const { transactionId } = data;
    
    // Update transaction status to refunded
    const transactions = await storage.getTransactionsAsBuyer(data.UDT1);
    const transaction = transactions.find(t => t.providerTransactionId === transactionId);

    if (transaction) {
      await storage.updateTransaction(transaction.id, {
        status: 'refunded',
      });
    }
  }
}

// Export service with environment configuration
export function createCCBillService(): CCBillService {
  const config: CCBillConfig = {
    accountNumber: process.env.CCBILL_ACCOUNT_NUMBER || '',
    clientId: process.env.CCBILL_CLIENT_ID || '',
    clientSecret: process.env.CCBILL_CLIENT_SECRET || '',
    formName: process.env.CCBILL_FORM_NAME || 'cc_form',
    webhookSecret: process.env.CCBILL_WEBHOOK_SECRET || '',
    sandboxMode: process.env.NODE_ENV !== 'production',
  };

  return new CCBillService(config);
}