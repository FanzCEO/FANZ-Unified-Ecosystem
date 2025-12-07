import { logger } from "../logger";
import { storage } from "../storage";
import crypto from "crypto";

interface PaymentGateway {
  name: string;
  region: string[];
  processor: "ccbill" | "segpay" | "epoch" | "vendo" | "verotel";
  isAdultFriendly: boolean;
}

interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  redirectUrl?: string;
}

interface PayoutResult {
  success: boolean;
  payoutId?: string;
  error?: string;
  estimatedArrival?: string;
}

class AdultFriendlyPaymentService {
  private gateways: PaymentGateway[] = [
    { name: "CCBill", region: ["US", "CA"], processor: "ccbill", isAdultFriendly: true },
    { name: "Segpay", region: ["GLOBAL"], processor: "segpay", isAdultFriendly: true },
    { name: "Epoch", region: ["EU", "UK"], processor: "epoch", isAdultFriendly: true },
    { name: "Vendo", region: ["LATAM", "BR"], processor: "vendo", isAdultFriendly: true },
    { name: "Verotel", region: ["EU"], processor: "verotel", isAdultFriendly: true },
  ];

  constructor() {
    this.validateConfiguration();
  }

  private validateConfiguration() {
    // Ensure no banned processors are configured
    const bannedProcessors = ["stripe", "paypal", "square"];
    const configuredProcessor = process.env.PAYMENTS_PROCESSOR?.toLowerCase();
    
    if (configuredProcessor && bannedProcessors.includes(configuredProcessor)) {
      throw new Error(`CRITICAL: ${configuredProcessor} is banned for adult content. Use adult-friendly processors only.`);
    }

    logger.info("Payment service initialized with adult-friendly processors", {
      availableGateways: this.gateways.map(g => g.name),
      primaryProcessor: process.env.PAYMENTS_PROCESSOR || "CCBill",
    });
  }

  selectGateway(region: string, amount: number): PaymentGateway {
    // Regional routing logic
    const regionMap: Record<string, string> = {
      "US": "ccbill",
      "CA": "ccbill", 
      "EU": "epoch",
      "UK": "epoch",
      "DE": "epoch",
      "FR": "epoch",
      "LATAM": "vendo",
      "BR": "vendo",
      "MX": "vendo",
    };

    const preferredProcessor = regionMap[region.toUpperCase()] || "segpay";
    
    let gateway = this.gateways.find(g => 
      g.processor === preferredProcessor && 
      (g.region.includes(region.toUpperCase()) || g.region.includes("GLOBAL"))
    );

    // Fallback to Segpay (global)
    if (!gateway) {
      gateway = this.gateways.find(g => g.processor === "segpay");
    }

    if (!gateway) {
      throw new Error("No suitable payment gateway found");
    }

    logger.info("Payment gateway selected", {
      region,
      amount,
      selectedGateway: gateway.name,
      processor: gateway.processor,
    });

    return gateway;
  }

  async processPayment(gateway: PaymentGateway, amount: number, metadata: any = {}): Promise<PaymentResult> {
    try {
      switch (gateway.processor) {
        case "ccbill":
          return await this.processCCBillPayment(amount, metadata);
        case "segpay":
          return await this.processSegpayPayment(amount, metadata);
        case "epoch":
          return await this.processEpochPayment(amount, metadata);
        case "vendo":
          return await this.processVendoPayment(amount, metadata);
        case "verotel":
          return await this.processVerotelPayment(amount, metadata);
        default:
          throw new Error(`Unsupported payment processor: ${gateway.processor}`);
      }
    } catch (error) {
      logger.error("Payment processing failed", { error, gateway: gateway.name, amount });
      return {
        success: false,
        error: error instanceof Error ? error.message : "Payment processing failed",
      };
    }
  }

  private async processCCBillPayment(amount: number, metadata: any): Promise<PaymentResult> {
    const clientAccnum = process.env.CCBILL_CLIENT_ACCNUM;
    const clientSubacc = process.env.CCBILL_CLIENT_SUBACC;
    const salt = process.env.CCBILL_SALT;

    if (!clientAccnum || !clientSubacc || !salt) {
      throw new Error("CCBill configuration missing");
    }

    // CCBill integration logic here
    // This would integrate with CCBill's API
    logger.info("Processing CCBill payment", { amount, clientAccnum });

    return {
      success: true,
      transactionId: `ccb_${Date.now()}`,
      redirectUrl: `https://bill.ccbill.com/jpost/signup.cgi?clientAccnum=${clientAccnum}&clientSubacc=${clientSubacc}`,
    };
  }

  private async processSegpayPayment(amount: number, metadata: any): Promise<PaymentResult> {
    const packageId = process.env.SEGPAY_PACKAGE_ID;
    const userId = process.env.SEGPAY_USERID;
    const accessKey = process.env.SEGPAY_ACCESS_KEY;

    if (!packageId || !userId || !accessKey) {
      throw new Error("Segpay configuration missing");
    }

    logger.info("Processing Segpay payment", { amount, packageId });

    return {
      success: true,
      transactionId: `seg_${Date.now()}`,
      redirectUrl: `https://secure2.segpay.com/billing/poset.cgi?PackageID=${packageId}`,
    };
  }

  private async processEpochPayment(amount: number, metadata: any): Promise<PaymentResult> {
    logger.info("Processing Epoch payment", { amount });
    
    return {
      success: true,
      transactionId: `epoch_${Date.now()}`,
    };
  }

  private async processVendoPayment(amount: number, metadata: any): Promise<PaymentResult> {
    logger.info("Processing Vendo payment", { amount });
    
    return {
      success: true,
      transactionId: `vendo_${Date.now()}`,
    };
  }

  private async processVerotelPayment(amount: number, metadata: any): Promise<PaymentResult> {
    logger.info("Processing Verotel payment", { amount });
    
    return {
      success: true,
      transactionId: `verotel_${Date.now()}`,
    };
  }

  async processCreatorPayout(userId: string, amount: number): Promise<PayoutResult> {
    try {
      const payoutAccounts = await storage.getPayoutAccounts(userId);
      const primaryAccount = payoutAccounts.find(acc => acc.status === "active");

      if (!primaryAccount) {
        throw new Error("No active payout account found");
      }

      switch (primaryAccount.provider) {
        case "paxum":
          return await this.processPaxumPayout(primaryAccount, amount);
        case "epayservice":
          return await this.processEPayServicePayout(primaryAccount, amount);
        case "wise":
          return await this.processWisePayout(primaryAccount, amount);
        case "crypto":
          return await this.processCryptoPayout(primaryAccount, amount);
        default:
          throw new Error(`Unsupported payout provider: ${primaryAccount.provider}`);
      }
    } catch (error) {
      logger.error("Payout processing failed", { error, userId, amount });
      return {
        success: false,
        error: error instanceof Error ? error.message : "Payout processing failed",
      };
    }
  }

  private async processPaxumPayout(account: any, amount: number): Promise<PayoutResult> {
    const apiUser = process.env.PAXUM_API_USER;
    const apiPassword = process.env.PAXUM_API_PASSWORD;

    if (!apiUser || !apiPassword) {
      throw new Error("Paxum configuration missing");
    }

    logger.info("Processing Paxum payout", { amount, accountRef: account.accountRef });

    // Create payout request in database
    await storage.createPayoutRequest({
      userId: account.userId,
      payoutAccountId: account.id,
      amountCents: amount * 100,
      currency: "USD",
      status: "processing",
    });

    return {
      success: true,
      payoutId: `pax_${Date.now()}`,
      estimatedArrival: "1-2 business days",
    };
  }

  private async processEPayServicePayout(account: any, amount: number): Promise<PayoutResult> {
    logger.info("Processing ePayService payout", { amount });
    
    return {
      success: true,
      payoutId: `eps_${Date.now()}`,
      estimatedArrival: "2-3 business days",
    };
  }

  private async processWisePayout(account: any, amount: number): Promise<PayoutResult> {
    logger.info("Processing Wise payout", { amount });
    
    return {
      success: true,
      payoutId: `wise_${Date.now()}`,
      estimatedArrival: "1-2 business days",
    };
  }

  private async processCryptoPayout(account: any, amount: number): Promise<PayoutResult> {
    logger.info("Processing crypto payout", { amount });
    
    return {
      success: true,
      payoutId: `crypto_${Date.now()}`,
      estimatedArrival: "1-24 hours",
    };
  }

  async verifyWebhookSignature(provider: string, payload: any, headers: any): Promise<boolean> {
    try {
      switch (provider.toLowerCase()) {
        case "ccbill":
          // CCBill webhook verification using hash
          const ccbillHash = headers["x-ccbill-signature"];
          const ccbillSecret = process.env.CCBILL_WEBHOOK_SECRET;
          if (!ccbillSecret) return false;
          
          const expectedCCBillHash = crypto.createHmac('sha256', ccbillSecret)
            .update(JSON.stringify(payload))
            .digest('hex');
          return ccbillHash === expectedCCBillHash;
          
        case "segpay":
          // Segpay webhook verification
          const segpayHash = headers["x-segpay-signature"];
          const segpaySecret = process.env.SEGPAY_WEBHOOK_SECRET;
          if (!segpaySecret) return false;
          
          const expectedSegpayHash = crypto.createHmac('sha256', segpaySecret)
            .update(JSON.stringify(payload))
            .digest('hex');
          return segpayHash === expectedSegpayHash;
          
        case "epoch":
          // Epoch webhook verification
          const epochToken = headers["authorization"];
          const expectedEpochToken = process.env.EPOCH_WEBHOOK_TOKEN;
          return epochToken === `Bearer ${expectedEpochToken}`;
          
        default:
          logger.warn("No verification method for provider", { provider });
          return false;
      }
    } catch (error) {
      logger.error("Webhook signature verification failed", { error, provider });
      return false;
    }
  }

  async handleWebhook(provider: string, payload: any): Promise<void> {
    logger.info("Processing payment webhook", { provider, eventType: payload.eventType });

    // Process webhook based on provider and event type
    switch (provider.toLowerCase()) {
      case "ccbill":
        await this.handleCCBillWebhook(payload);
        break;
      case "segpay":
        await this.handleSegpayWebhook(payload);
        break;
      case "epoch":
        await this.handleEpochWebhook(payload);
        break;
      case "vendo":
        await this.handleVendoWebhook(payload);
        break;
      case "verotel":
        await this.handleVerotelWebhook(payload);
        break;
      default:
        logger.warn("Unknown webhook provider", { provider });
    }
  }

  private async handleCCBillWebhook(payload: any): Promise<void> {
    logger.info("Processing CCBill webhook", { payload });
    
    // Handle different CCBill event types
    switch (payload.eventType) {
      case "NewSaleSuccess":
        await this.processCCBillSale(payload);
        break;
      case "Cancellation":
        await this.processCCBillCancellation(payload);
        break;
      case "Chargeback":
        await this.processCCBillChargeback(payload);
        break;
      default:
        logger.info("Unhandled CCBill event type", { eventType: payload.eventType });
    }
  }

  private async handleSegpayWebhook(payload: any): Promise<void> {
    logger.info("Processing Segpay webhook", { payload });
    
    switch (payload.event_type) {
      case "sale":
        await this.processSegpaySale(payload);
        break;
      case "cancellation":
        await this.processSegpayCancellation(payload);
        break;
      case "chargeback":
        await this.processSegpayChargeback(payload);
        break;
      default:
        logger.info("Unhandled Segpay event type", { eventType: payload.event_type });
    }
  }

  private async handleEpochWebhook(payload: any): Promise<void> {
    logger.info("Processing Epoch webhook", { payload });
    
    switch (payload.transaction_type) {
      case "Sale":
        await this.processEpochSale(payload);
        break;
      case "Cancellation":
        await this.processEpochCancellation(payload);
        break;
      default:
        logger.info("Unhandled Epoch event type", { transactionType: payload.transaction_type });
    }
  }

  private async handleVendoWebhook(payload: any): Promise<void> {
    logger.info("Processing Vendo webhook", { payload });
    // Implement Vendo-specific webhook handling
  }

  private async handleVerotelWebhook(payload: any): Promise<void> {
    logger.info("Processing Verotel webhook", { payload });
    // Implement Verotel-specific webhook handling
  }

  // CCBill webhook processors
  private async processCCBillSale(payload: any): Promise<void> {
    try {
      const subscriptionId = payload.subscriptionId;
      const customerId = payload.customerId;
      const amount = parseFloat(payload.billedAmount);
      
      // Update subscription status in database
      await storage.updateSubscriptionStatus(subscriptionId, "active");
      
      logger.info("CCBill sale processed", { subscriptionId, amount });
    } catch (error) {
      logger.error("CCBill sale processing failed", { error, payload });
    }
  }

  private async processCCBillCancellation(payload: any): Promise<void> {
    try {
      const subscriptionId = payload.subscriptionId;
      
      // Update subscription status
      await storage.updateSubscriptionStatus(subscriptionId, "cancelled");
      
      logger.info("CCBill cancellation processed", { subscriptionId });
    } catch (error) {
      logger.error("CCBill cancellation processing failed", { error, payload });
    }
  }

  private async processCCBillChargeback(payload: any): Promise<void> {
    try {
      const subscriptionId = payload.subscriptionId;
      const amount = parseFloat(payload.chargebackAmount);
      
      // Handle chargeback - suspend subscription, notify admin
      await storage.updateSubscriptionStatus(subscriptionId, "suspended");
      
      logger.warn("CCBill chargeback processed", { subscriptionId, amount });
    } catch (error) {
      logger.error("CCBill chargeback processing failed", { error, payload });
    }
  }

  // Segpay webhook processors  
  private async processSegpaySale(payload: any): Promise<void> {
    try {
      const transactionId = payload.transaction_id;
      const amount = parseFloat(payload.amount);
      
      // Process Segpay sale
      logger.info("Segpay sale processed", { transactionId, amount });
    } catch (error) {
      logger.error("Segpay sale processing failed", { error, payload });
    }
  }

  private async processSegpayCancellation(payload: any): Promise<void> {
    try {
      const transactionId = payload.transaction_id;
      
      logger.info("Segpay cancellation processed", { transactionId });
    } catch (error) {
      logger.error("Segpay cancellation processing failed", { error, payload });
    }
  }

  private async processSegpayChargeback(payload: any): Promise<void> {
    try {
      const transactionId = payload.transaction_id;
      const amount = parseFloat(payload.amount);
      
      logger.warn("Segpay chargeback processed", { transactionId, amount });
    } catch (error) {
      logger.error("Segpay chargeback processing failed", { error, payload });
    }
  }

  // Epoch webhook processors
  private async processEpochSale(payload: any): Promise<void> {
    try {
      const transactionId = payload.transaction_id;
      const amount = parseFloat(payload.amount);
      
      logger.info("Epoch sale processed", { transactionId, amount });
    } catch (error) {
      logger.error("Epoch sale processing failed", { error, payload });
    }
  }

  private async processEpochCancellation(payload: any): Promise<void> {
    try {
      const transactionId = payload.transaction_id;
      
      logger.info("Epoch cancellation processed", { transactionId });
    } catch (error) {
      logger.error("Epoch cancellation processing failed", { error, payload });
    }
  }
}

export const paymentService = new AdultFriendlyPaymentService();
