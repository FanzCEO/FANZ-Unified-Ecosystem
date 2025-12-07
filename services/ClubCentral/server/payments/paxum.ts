import crypto from 'crypto';

export interface PaxumConfig {
  businessEmail: string;
  secretKey: string;
  returnUrl: string;
  cancelUrl: string;
}

export interface PaxumPaymentOptions {
  amount: string;
  currency?: string;
  description: string;
  customerEmail: string;
  orderId: string;
  subscriptionType?: 'monthly' | 'yearly' | 'one-time';
}

export class PaxumService {
  private config: PaxumConfig;

  constructor(config: PaxumConfig) {
    this.config = config;
  }

  /**
   * Generate payment form data for Paxum
   */
  generatePaymentForm(options: PaxumPaymentOptions): {
    action: string;
    fields: Record<string, string>;
  } {
    const {
      amount,
      currency = 'USD',
      description,
      customerEmail,
      orderId,
      subscriptionType = 'one-time'
    } = options;

    const fields = {
      business_email: this.config.businessEmail,
      currency_code: currency,
      amount: amount,
      item_name: description,
      item_id: orderId,
      buyer_email: customerEmail,
      return_url: this.config.returnUrl,
      cancel_url: this.config.cancelUrl,
      notify_url: `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost'}/api/webhooks/paxum`,
      subscription_type: subscriptionType,
      // Security hash
      secure_hash: this.generateSecureHash({
        business_email: this.config.businessEmail,
        currency_code: currency,
        amount: amount,
        item_id: orderId
      })
    };

    return {
      action: 'https://www.paxum.com/payment/phrame.php',
      fields
    };
  }

  /**
   * Generate secure hash for Paxum payments
   */
  private generateSecureHash(data: Record<string, string>): string {
    const sortedKeys = Object.keys(data).sort();
    const signatureString = sortedKeys
      .map(key => `${key}=${data[key]}`)
      .join('&') + this.config.secretKey;
    
    return crypto.createHash('sha256').update(signatureString).digest('hex');
  }

  /**
   * Verify Paxum webhook
   */
  verifyWebhook(payload: Record<string, string>): boolean {
    const receivedHash = payload.secure_hash;
    delete payload.secure_hash;
    
    const expectedHash = this.generateSecureHash(payload);
    return receivedHash === expectedHash;
  }

  /**
   * Process Paxum webhook
   */
  processWebhook(data: Record<string, string>): {
    type: 'payment_success' | 'payment_failed' | 'subscription_success' | 'subscription_cancelled';
    orderId: string;
    amount: string;
    currency: string;
    customerEmail: string;
    transactionId: string;
    status: string;
  } {
    return {
      type: this.getWebhookType(data.transaction_status),
      orderId: data.item_id,
      amount: data.amount,
      currency: data.currency_code,
      customerEmail: data.buyer_email,
      transactionId: data.transaction_id,
      status: data.transaction_status
    };
  }

  private getWebhookType(status: string): 'payment_success' | 'payment_failed' | 'subscription_success' | 'subscription_cancelled' {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'success':
        return 'payment_success';
      case 'failed':
      case 'cancelled':
        return 'payment_failed';
      case 'subscription_created':
        return 'subscription_success';
      case 'subscription_cancelled':
        return 'subscription_cancelled';
      default:
        return 'payment_failed';
    }
  }

  /**
   * Generate subscription payment form
   */
  generateSubscriptionForm(options: PaxumPaymentOptions & { billingCycle: 'monthly' | 'yearly' }): {
    action: string;
    fields: Record<string, string>;
  } {
    const subscriptionOptions = {
      ...options,
      subscriptionType: options.billingCycle
    };

    return this.generatePaymentForm(subscriptionOptions);
  }
}