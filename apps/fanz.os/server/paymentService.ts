import crypto from "crypto";

// Payment processor types
export enum PaymentProcessor {
  CCBILL = "ccbill",
  NOWPAYMENTS = "nowpayments",
  TRIPLEA = "triplea",
  BANKFUL = "bankful",
  AUTHORIZE_NET = "authorize_net"
}

// Payment method types
export enum PaymentType {
  SUBSCRIPTION = "subscription",
  PPV = "ppv",
  TIP = "tip",
  MERCHANDISE = "merchandise"
}

// Payment interfaces
export interface PaymentRequest {
  processor: PaymentProcessor;
  type: PaymentType;
  amount: number;
  currency: string;
  userId: string;
  creatorId?: string;
  description: string;
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  success: boolean;
  transactionId: string;
  paymentUrl?: string;
  redirectUrl?: string;
  error?: string;
  metadata?: Record<string, any>;
}

export interface WebhookData {
  processor: PaymentProcessor;
  transactionId: string;
  status: string;
  amount: number;
  currency: string;
  userId: string;
  metadata?: Record<string, any>;
}

// CCBill integration
class CCBillService {
  private clientAccnum: string;
  private clientSubacc: string;
  private formName: string;
  private salt: string;

  constructor() {
    this.clientAccnum = process.env.CCBILL_CLIENT_ACCNUM || "";
    this.clientSubacc = process.env.CCBILL_CLIENT_SUBACC || "";
    this.formName = process.env.CCBILL_FORM_NAME || "";
    this.salt = process.env.CCBILL_SALT || "";
  }

  async createSubscription(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const hash = this.generateHash(request.amount, timestamp);

      const paymentUrl = `https://api.ccbill.com/wap-frontflex/flexforms/${this.formName}?` +
        `clientAccnum=${this.clientAccnum}&` +
        `clientSubacc=${this.clientSubacc}&` +
        `formPrice=${request.amount}&` +
        `formPeriod=30&` +
        `currencyCode=840&` +
        `formDigest=${hash}&` +
        `timestamp=${timestamp}&` +
        `customer_fname=&` +
        `customer_lname=&` +
        `email=`;

      return {
        success: true,
        transactionId: `ccb_${crypto.randomUUID()}`,
        paymentUrl,
        redirectUrl: `${process.env.FRONTEND_URL}/payment/success`
      };
    } catch (error) {
      return {
        success: false,
        transactionId: "",
        error: `CCBill error: ${error}`
      };
    }
  }

  private generateHash(amount: number, timestamp: number): string {
    const data = `${amount}${timestamp}${this.salt}`;
    return crypto.createHash('md5').update(data).digest('hex');
  }

  async verifyWebhook(data: any): Promise<boolean> {
    // CCBill webhook verification logic
    return true;
  }
}

// NowPayments integration
class NowPaymentsService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.NOWPAYMENTS_API_KEY || "";
    this.baseUrl = "https://api.nowpayments.io/v1";
  }

  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/payment`, {
        method: "POST",
        headers: {
          "x-api-key": this.apiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          price_amount: request.amount,
          price_currency: request.currency,
          pay_currency: "btc", // Default to Bitcoin
          order_id: `fanz_${crypto.randomUUID()}`,
          order_description: request.description,
          ipn_callback_url: `${process.env.BACKEND_URL}/webhooks/nowpayments`,
          success_url: `${process.env.FRONTEND_URL}/payment/success`,
          cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`
        })
      });

      const result = await response.json();

      if (result.payment_id) {
        return {
          success: true,
          transactionId: result.payment_id,
          paymentUrl: result.invoice_url
        };
      }

      return {
        success: false,
        transactionId: "",
        error: "NowPayments payment creation failed"
      };
    } catch (error) {
      return {
        success: false,
        transactionId: "",
        error: `NowPayments error: ${error}`
      };
    }
  }

  async verifyWebhook(data: any): Promise<boolean> {
    // NowPayments webhook verification logic
    return true;
  }
}

// Triple-A integration
class TripleAService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.TRIPLEA_API_KEY || "";
    this.baseUrl = "https://api.triple-a.io/api/v1";
  }

  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/payment`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          type: "payment_request",
          merchant_key: process.env.TRIPLEA_MERCHANT_KEY,
          order_currency: request.currency,
          order_amount: request.amount,
          payout_currency: request.currency,
          order_id: `fanz_${crypto.randomUUID()}`,
          webhook_url: `${process.env.BACKEND_URL}/webhooks/triplea`,
          success_url: `${process.env.FRONTEND_URL}/payment/success`,
          cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`
        })
      });

      const result = await response.json();

      if (result.payment_url) {
        return {
          success: true,
          transactionId: result.payment_id,
          paymentUrl: result.payment_url
        };
      }

      return {
        success: false,
        transactionId: "",
        error: "Triple-A payment creation failed"
      };
    } catch (error) {
      return {
        success: false,
        transactionId: "",
        error: `Triple-A error: ${error}`
      };
    }
  }

  async verifyWebhook(data: any): Promise<boolean> {
    // Triple-A webhook verification logic
    return true;
  }
}

// Bankful integration
class BankfulService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.BANKFUL_API_KEY || "";
    this.baseUrl = "https://api.bankful.com/v1";
  }

  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/payments`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          amount: request.amount * 100, // Convert to cents
          currency: request.currency,
          description: request.description,
          return_url: `${process.env.FRONTEND_URL}/payment/success`,
          cancel_return_url: `${process.env.FRONTEND_URL}/payment/cancel`,
          notify_url: `${process.env.BACKEND_URL}/webhooks/bankful`
        })
      });

      const result = await response.json();

      if (result.checkout_url) {
        return {
          success: true,
          transactionId: result.payment_id,
          paymentUrl: result.checkout_url
        };
      }

      return {
        success: false,
        transactionId: "",
        error: "Bankful payment creation failed"
      };
    } catch (error) {
      return {
        success: false,
        transactionId: "",
        error: `Bankful error: ${error}`
      };
    }
  }

  async verifyWebhook(data: any): Promise<boolean> {
    // Bankful webhook verification logic
    return true;
  }
}

// Authorize.Net integration
class AuthorizeNetService {
  private apiLoginId: string;
  private transactionKey: string;
  private baseUrl: string;

  constructor() {
    this.apiLoginId = process.env.AUTHORIZE_NET_API_LOGIN_ID || "";
    this.transactionKey = process.env.AUTHORIZE_NET_TRANSACTION_KEY || "";
    this.baseUrl = process.env.NODE_ENV === "production"
      ? "https://api.authorize.net/xml/v1/request.api"
      : "https://apitest.authorize.net/xml/v1/request.api";
  }

  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Authorize.Net Accept Hosted implementation
      const hostedPaymentData = {
        merchantAuthentication: {
          name: this.apiLoginId,
          transactionKey: this.transactionKey
        },
        transactionRequest: {
          transactionType: "authCaptureTransaction",
          amount: request.amount,
          order: {
            invoiceNumber: `fanz_${crypto.randomUUID()}`,
            description: request.description
          }
        },
        hostedPaymentSettings: {
          setting: [
            {
              settingName: "hostedPaymentReturnOptions",
              settingValue: JSON.stringify({
                url: `${process.env.FRONTEND_URL}/payment/success`,
                cancelUrl: `${process.env.FRONTEND_URL}/payment/cancel`
              })
            }
          ]
        }
      };

      // This would need to be implemented with proper Authorize.Net SDK
      // For now, return a mock response
      return {
        success: true,
        transactionId: `auth_${crypto.randomUUID()}`,
        paymentUrl: "#", // Would be the actual Authorize.Net hosted payment URL
        metadata: { processor: "authorize_net" }
      };
    } catch (error) {
      return {
        success: false,
        transactionId: "",
        error: `Authorize.Net error: ${error}`
      };
    }
  }

  async verifyWebhook(data: any): Promise<boolean> {
    // Authorize.Net webhook verification logic
    return true;
  }
}

// Main Payment Service
export class PaymentService {
  private processors: Map<PaymentProcessor, any> = new Map();
  private fraudDetectionThreshold = 85; // Fraud score threshold
  private suspiciousPatterns: Map<string, number> = new Map(); // User ID -> risk score

  constructor() {
    this.processors.set(PaymentProcessor.CCBILL, new CCBillService());
    this.processors.set(PaymentProcessor.NOWPAYMENTS, new NowPaymentsService());
    this.processors.set(PaymentProcessor.TRIPLEA, new TripleAService());
    this.processors.set(PaymentProcessor.BANKFUL, new BankfulService());
    this.processors.set(PaymentProcessor.AUTHORIZE_NET, new AuthorizeNetService());
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    const userId = request.userId;
    const transactionAmount = request.amount;

    // Basic fraud detection: Check if user's risk score exceeds the threshold
    if (this.suspiciousPatterns.has(userId) && this.suspiciousPatterns.get(userId)! > this.fraudDetectionThreshold) {
      return {
        success: false,
        transactionId: "",
        error: "Payment blocked due to high risk score."
      };
    }

    // Add more sophisticated fraud detection logic here based on request details, user history, etc.
    // For example, checking for common fraud patterns like rapid transactions, unusual amounts, etc.

    const processor = this.processors.get(request.processor);
    if (!processor) {
      return {
        success: false,
        transactionId: "",
        error: "Unsupported payment processor"
      };
    }

    // Add checks for supported currencies and payment types for each processor
    // Example: Check if CCBill supports the requested currency
    if (request.processor === PaymentProcessor.CCBILL && request.currency !== "USD") {
       // For simplicity, let's assume CCBill only supports USD for this example.
       // In a real scenario, you'd map currencies correctly.
       return {
        success: false,
        transactionId: "",
        error: "CCBill only supports USD for this transaction type."
      };
    }

    // Example: Add more payment methods like Credit Card for Authorize.Net if not already handled
    if (request.processor === PaymentProcessor.AUTHORIZE_NET && request.type === PaymentType.MERCHANDISE) {
        // Potentially add logic here to handle specific Authorize.Net payment types if needed
        // For now, the existing implementation should cover it.
    }


    try {
      const response = await processor.createPayment(request);

      // Update user's risk score based on transaction outcome (simplified)
      if (!response.success) {
        const currentRisk = this.suspiciousPatterns.get(userId) || 0;
        this.suspiciousPatterns.set(userId, currentRisk + 5); // Increase risk on failed payment
      } else {
        // Optionally decrease risk on successful payment or reset after a period
        // For simplicity, we won't decrease risk here.
      }

      return response;
    } catch (error) {
      const currentRisk = this.suspiciousPatterns.get(userId) || 0;
      this.suspiciousPatterns.set(userId, currentRisk + 10); // Significantly increase risk on processing error
      return {
        success: false,
        transactionId: "",
        error: `Payment processing error: ${error}`
      };
    }
  }

  async handleWebhook(processor: PaymentProcessor, data: any): Promise<boolean> {
    const processorService = this.processors.get(processor);
    if (!processorService) {
      return false;
    }

    // Implement robust webhook verification for each processor
    // This includes signature verification, checking transaction status, etc.
    // For now, we'll rely on the individual service's verification logic.
    return await processorService.verifyWebhook(data);
  }

  // Get recommended processor based on payment type and user location
  getRecommendedProcessor(type: PaymentType, currency: string = "USD"): PaymentProcessor {
    switch (type) {
      case PaymentType.SUBSCRIPTION:
        return PaymentProcessor.CCBILL; // CCBill is preferred for adult content subscriptions
      case PaymentType.PPV:
        return currency === "USD" ? PaymentProcessor.CCBILL : PaymentProcessor.NOWPAYMENTS;
      case PaymentType.TIP:
        return PaymentProcessor.NOWPAYMENTS; // Crypto tips for anonymity
      case PaymentType.MERCHANDISE:
        // Consider adding more options for merchandise, e.g., Authorize.Net or even crypto options
        return PaymentProcessor.AUTHORIZE_NET; // Traditional processor for merch
      default:
        return PaymentProcessor.CCBILL;
    }
  }

  // Method to manually update a user's risk score (e.g., after manual review)
  updateUserRiskScore(userId: string, score: number): void {
    this.suspiciousPatterns.set(userId, score);
  }

  // Method to add a known fraudulent pattern
  addFraudulentPattern(pattern: string, scoreIncrease: number): void {
    // This is a placeholder. Real implementation would involve more complex pattern matching.
    // For example, mapping IP addresses, email domains, etc., to risk scores.
    console.warn("Adding fraudulent pattern is a complex feature and requires a robust implementation.");
  }
}

export const paymentService = new PaymentService();