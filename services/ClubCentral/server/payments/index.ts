import { CCBillService, CCBillConfig } from './ccbill';
import { PaxumService, PaxumConfig } from './paxum';

export interface PaymentConfig {
  provider: 'ccbill' | 'paxum';
  ccbill?: CCBillConfig;
  paxum?: PaxumConfig;
}

export class PaymentService {
  private ccbill?: CCBillService;
  private paxum?: PaxumService;
  private defaultProvider: 'ccbill' | 'paxum';

  constructor(config: PaymentConfig) {
    this.defaultProvider = config.provider;

    if (config.ccbill) {
      this.ccbill = new CCBillService(config.ccbill);
    }

    if (config.paxum) {
      this.paxum = new PaxumService(config.paxum);
    }
  }

  /**
   * Create a subscription payment link
   */
  createSubscriptionPayment(options: {
    creatorId: string;
    fanId: string;
    fanName: string;
    fanEmail: string;
    amount: string;
    period: 'monthly' | 'yearly';
    description: string;
  }) {
    const { fanName, fanEmail, amount, period, description } = options;
    const [firstName, ...lastNameParts] = fanName.split(' ');
    const lastName = lastNameParts.join(' ') || '';

    const periodDays = period === 'monthly' ? 30 : 365;

    if (this.defaultProvider === 'ccbill' && this.ccbill) {
      return {
        provider: 'ccbill',
        paymentUrl: this.ccbill.generatePaymentLink({
          customerFirstName: firstName,
          customerLastName: lastName,
          customerEmail: fanEmail,
          amount,
          period: periodDays,
          description,
          recurringBilling: true
        })
      };
    }

    if (this.defaultProvider === 'paxum' && this.paxum) {
      return {
        provider: 'paxum',
        formData: this.paxum.generateSubscriptionForm({
          amount,
          description,
          customerEmail: fanEmail,
          orderId: `sub_${options.creatorId}_${options.fanId}_${Date.now()}`,
          billingCycle: period === 'monthly' ? 'monthly' : 'yearly'
        })
      };
    }

    throw new Error('No payment provider configured');
  }

  /**
   * Create a tip payment link
   */
  createTipPayment(options: {
    creatorId: string;
    fanId: string;
    fanName: string;
    fanEmail: string;
    amount: string;
    message?: string;
  }) {
    const { fanName, fanEmail, amount, message } = options;
    const [firstName, ...lastNameParts] = fanName.split(' ');
    const lastName = lastNameParts.join(' ') || '';
    const description = `Tip${message ? ` - ${message}` : ''}`;

    if (this.defaultProvider === 'ccbill' && this.ccbill) {
      return {
        provider: 'ccbill',
        paymentUrl: this.ccbill.generateTipPaymentLink({
          customerFirstName: firstName,
          customerLastName: lastName,
          customerEmail: fanEmail,
          amount,
          description
        })
      };
    }

    if (this.defaultProvider === 'paxum' && this.paxum) {
      return {
        provider: 'paxum',
        formData: this.paxum.generatePaymentForm({
          amount,
          description,
          customerEmail: fanEmail,
          orderId: `tip_${options.creatorId}_${options.fanId}_${Date.now()}`,
          subscriptionType: 'one-time'
        })
      };
    }

    throw new Error('No payment provider configured');
  }

  /**
   * Process webhook from payment providers
   */
  processWebhook(provider: 'ccbill' | 'paxum', data: any, signature?: string) {
    if (provider === 'ccbill' && this.ccbill) {
      if (signature && !this.ccbill.verifyWebhook(JSON.stringify(data), signature)) {
        throw new Error('Invalid webhook signature');
      }
      return this.ccbill.processWebhook(data);
    }

    if (provider === 'paxum' && this.paxum) {
      if (!this.paxum.verifyWebhook(data)) {
        throw new Error('Invalid webhook signature');
      }
      return this.paxum.processWebhook(data);
    }

    throw new Error(`Unsupported payment provider: ${provider}`);
  }
}

// Export payment service configuration
export const paymentConfig: PaymentConfig = {
  provider: (process.env.PAYMENT_PROVIDER as 'ccbill' | 'paxum') || 'ccbill',
  ccbill: process.env.CCBILL_CLIENT_ACCOUNT ? {
    clientAccount: process.env.CCBILL_CLIENT_ACCOUNT!,
    clientSubAccount: process.env.CCBILL_CLIENT_SUBACCOUNT!,
    formName: process.env.CCBILL_FORM_NAME!,
    flexFormId: process.env.CCBILL_FLEX_FORM_ID!,
    salt: process.env.CCBILL_SALT!
  } : undefined,
  paxum: process.env.PAXUM_BUSINESS_EMAIL ? {
    businessEmail: process.env.PAXUM_BUSINESS_EMAIL!,
    secretKey: process.env.PAXUM_SECRET_KEY!,
    returnUrl: `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost'}/payment/success`,
    cancelUrl: `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost'}/payment/cancel`
  } : undefined
};

export const paymentService = new PaymentService(paymentConfig);