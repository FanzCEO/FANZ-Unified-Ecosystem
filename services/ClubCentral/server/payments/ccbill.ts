import crypto from 'crypto';

export interface CCBillConfig {
  clientAccount: string;
  clientSubAccount: string;
  formName: string;
  flexFormId: string;
  salt: string;
}

export interface CCBillPaymentOptions {
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  amount: string;
  period: number; // billing period in days
  currencyCode?: string;
  description: string;
  recurringBilling?: boolean;
}

export class CCBillService {
  private config: CCBillConfig;

  constructor(config: CCBillConfig) {
    this.config = config;
  }

  /**
   * Generate a payment link for CCBill subscription
   */
  generatePaymentLink(options: CCBillPaymentOptions): string {
    const {
      customerFirstName,
      customerLastName,
      customerEmail,
      amount,
      period,
      currencyCode = '840', // USD
      description,
      recurringBilling = true
    } = options;

    // Generate timestamp for security
    const timestamp = Math.floor(Date.now() / 1000);
    
    // Create hash for security
    const hashString = `${amount}${period}${currencyCode}${this.config.salt}`;
    const hash = crypto.createHash('md5').update(hashString).digest('hex');

    const params = new URLSearchParams({
      clientAccnum: this.config.clientAccount,
      clientSubacc: this.config.clientSubAccount,
      formName: this.config.formName,
      allowedTypes: '1', // Credit cards only
      currencyCode,
      formPrice: amount,
      formPeriod: period.toString(),
      formRecurring: recurringBilling ? '1' : '0',
      customer_fname: customerFirstName,
      customer_lname: customerLastName,
      email: customerEmail,
      productDesc: description,
      timestamp: timestamp.toString(),
      hash: hash
    });

    return `https://api.ccbill.com/wap-frontflex/flexforms/${this.config.flexFormId}?${params.toString()}`;
  }

  /**
   * Verify webhook signature from CCBill
   */
  verifyWebhook(payload: string, signature: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', this.config.salt)
      .update(payload)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  /**
   * Process webhook data from CCBill
   */
  processWebhook(data: any): {
    type: 'subscription_success' | 'subscription_cancellation' | 'renewal' | 'chargeback';
    subscriptionId: string;
    amount: string;
    currency: string;
    customerEmail: string;
    transactionId: string;
  } {
    return {
      type: this.getWebhookType(data.eventType),
      subscriptionId: data.subscriptionId,
      amount: data.billedAmount,
      currency: data.currency,
      customerEmail: data.email,
      transactionId: data.transactionId
    };
  }

  private getWebhookType(eventType: string): 'subscription_success' | 'subscription_cancellation' | 'renewal' | 'chargeback' {
    switch (eventType) {
      case 'NewSaleSuccess':
        return 'subscription_success';
      case 'Cancellation':
        return 'subscription_cancellation';
      case 'RenewalSuccess':
        return 'renewal';
      case 'Chargeback':
        return 'chargeback';
      default:
        return 'subscription_success';
    }
  }

  /**
   * Generate one-time payment link (for tips)
   */
  generateTipPaymentLink(options: Omit<CCBillPaymentOptions, 'period' | 'recurringBilling'>): string {
    const {
      customerFirstName,
      customerLastName,
      customerEmail,
      amount,
      currencyCode = '840',
      description
    } = options;

    const timestamp = Math.floor(Date.now() / 1000);
    const hashString = `${amount}99${currencyCode}${this.config.salt}`; // 99 = one-time billing
    const hash = crypto.createHash('md5').update(hashString).digest('hex');

    const params = new URLSearchParams({
      clientAccnum: this.config.clientAccount,
      clientSubacc: this.config.clientSubAccount,
      formName: this.config.formName,
      allowedTypes: '1',
      currencyCode,
      formPrice: amount,
      formPeriod: '99', // One-time billing
      formRecurring: '0',
      customer_fname: customerFirstName,
      customer_lname: customerLastName,
      email: customerEmail,
      productDesc: description,
      timestamp: timestamp.toString(),
      hash: hash
    });

    return `https://api.ccbill.com/wap-frontflex/flexforms/${this.config.flexFormId}?${params.toString()}`;
  }
}