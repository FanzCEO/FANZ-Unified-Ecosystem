/**
 * FanzProtect Paddle Payment Integration with Tax Compliance
 * Wyoming-based legal services with automated tax calculation
 * 
 * Paddle is chosen as it supports:
 * - B2B and B2C payments globally
 * - Adult content industry friendly
 * - Strong API for custom tax handling
 * - Compliance with adult industry requirements
 */

import { TaxCalculator } from '../tax/tax-calculator';
import { TaxCalculationResult } from '../../types/tax';
import crypto from 'crypto';
import fetch from 'node-fetch';

interface PaddleConfig {
  vendorId: string;
  apiKey: string;
  webhookSecret: string;
  sandboxMode: boolean;
}

interface PaddleSubscriptionRequest {
  planId: string;
  customerId: string;
  customerEmail: string;
  customerLocation: {
    state: string;
    city?: string;
    zipCode?: string;
    country: string;
  };
  subscriptionTier: 'basic' | 'professional' | 'enterprise';
  discountCode?: string;
}

interface PaddleOneTimeRequest {
  productId: string;
  customerId: string;
  customerEmail: string;
  customerLocation: {
    state: string;
    city?: string;
    zipCode?: string;
    country: string;
  };
  serviceType: string;
  basePrice: number;
}

export class PaddlePaymentService {
  private config: PaddleConfig;
  private taxCalculator: TaxCalculator;
  private baseUrl: string;

  constructor(taxCalculator: TaxCalculator) {
    this.config = {
      vendorId: process.env.PADDLE_VENDOR_ID || '',
      apiKey: process.env.PADDLE_API_KEY || '',
      webhookSecret: process.env.PADDLE_WEBHOOK_SECRET || '',
      sandboxMode: process.env.NODE_ENV !== 'production'
    };

    this.taxCalculator = taxCalculator;
    this.baseUrl = this.config.sandboxMode 
      ? 'https://sandbox-vendors.paddle.com/api'
      : 'https://vendors.paddle.com/api';

    if (!this.config.vendorId || !this.config.apiKey) {
      throw new Error('Paddle configuration missing. Please set PADDLE_VENDOR_ID and PADDLE_API_KEY');
    }
  }

  /**
   * Create subscription with Wyoming tax optimization
   */
  async createSubscription(request: PaddleSubscriptionRequest): Promise<any> {
    try {
      // Calculate tax using Wyoming legal service exemptions
      const taxCalculation = await this.taxCalculator.calculateServiceTierPricing(
        request.subscriptionTier,
        request.customerLocation
      );

      // Create Paddle subscription with tax-optimized pricing
      const subscriptionData = {
        vendor_id: this.config.vendorId,
        vendor_auth_code: this.config.apiKey,
        plan_id: request.planId,
        user_email: request.customerEmail,
        user_country: request.customerLocation.country,
        postcode: request.customerLocation.zipCode,
        
        // Wyoming legal services pricing optimization
        custom_message: `Wyoming-based legal services - Tax optimized pricing`,
        passthrough: JSON.stringify({
          customerId: request.customerId,
          subscriptionTier: request.subscriptionTier,
          wyomingLegalEntity: true,
          taxCalculation: taxCalculation.totals,
          legalServiceExemption: taxCalculation.services.filter(s => s.isExempt).length
        }),
        
        // Override pricing with tax-calculated amounts
        override_prices: taxCalculation.services.map(service => ({
          product_id: this.getProductId(service.service),
          price: service.totalPrice.toFixed(2),
          currency: 'USD'
        })),
        
        // Customer location for tax calculation
        customer_postcode: request.customerLocation.zipCode,
        customer_country: request.customerLocation.country,
        
        // Marketing consent for adult industry compliance
        marketing_consent: false, // Conservative approach for adult content
        
        // Custom fields for tax compliance
        custom_data: JSON.stringify({
          wyomingBusinessEntity: true,
          legalServiceClassification: 'professional_legal_services',
          taxExemptAmount: taxCalculation.totals.basePrice - taxCalculation.totals.taxAmount,
          nexusState: request.customerLocation.state,
          calculationTimestamp: new Date().toISOString()
        })
      };

      const response = await this.paddleRequest('2.0/subscription/users', subscriptionData);
      
      // Log successful subscription for nexus tracking
      await this.taxCalculator.updateNexusTracking(
        request.customerLocation.state,
        taxCalculation.totals.totalPrice,
        1
      );

      return {
        success: true,
        subscriptionId: response.subscription_id,
        customerId: request.customerId,
        totalAmount: taxCalculation.totals.totalPrice,
        taxAmount: taxCalculation.totals.taxAmount,
        exemptAmount: taxCalculation.totals.basePrice - taxCalculation.totals.taxAmount,
        wyomingAdvantage: {
          effectiveTaxRate: (taxCalculation.totals.taxAmount / taxCalculation.totals.basePrice) * 100,
          legalServiceExemptions: taxCalculation.services.filter(s => s.isExempt).length,
          competitiveAdvantage: 'Wyoming-based legal entity provides maximum tax exemptions'
        },
        paddleResponse: response
      };

    } catch (error) {
      console.error('Paddle subscription creation failed:', error);
      throw new Error(`Subscription creation failed: ${error.message}`);
    }
  }

  /**
   * Process one-time payment with tax calculation
   */
  async createOneTimePayment(request: PaddleOneTimeRequest): Promise<any> {
    try {
      // Calculate tax for one-time legal service
      const taxCalculation = await this.taxCalculator.calculateTax({
        serviceType: request.serviceType,
        basePrice: request.basePrice,
        customerLocation: request.customerLocation,
        billingPeriod: 'one-time'
      });

      // Create Paddle checkout with Wyoming tax optimization
      const checkoutData = {
        vendor_id: this.config.vendorId,
        vendor_auth_code: this.config.apiKey,
        product_id: request.productId,
        customer_email: request.customerEmail,
        customer_country: request.customerLocation.country,
        customer_postcode: request.customerLocation.zipCode,
        
        // Override with tax-calculated price
        override_price: taxCalculation.totalPrice.toFixed(2),
        currency: 'USD',
        
        // Wyoming legal service messaging
        title: `FanzProtect ${this.getServiceDisplayName(request.serviceType)}`,
        custom_message: 'Wyoming-based professional legal services',
        
        // Tax compliance data
        passthrough: JSON.stringify({
          customerId: request.customerId,
          serviceType: request.serviceType,
          wyomingLegalEntity: true,
          taxExempt: taxCalculation.isExempt,
          taxAmount: taxCalculation.taxAmount,
          exemptionReason: taxCalculation.exemptionReason,
          legalServiceClassification: 'professional_legal_advocacy'
        }),
        
        // Custom fields for compliance
        custom_data: JSON.stringify({
          basePrice: request.basePrice,
          taxCalculation: taxCalculation,
          wyomingAdvantage: taxCalculation.isExempt,
          nexusState: request.customerLocation.state,
          complianceTimestamp: new Date().toISOString()
        })
      };

      const response = await this.paddleRequest('2.0/product/generate_pay_link', checkoutData);
      
      // Track for nexus monitoring
      await this.taxCalculator.updateNexusTracking(
        request.customerLocation.state,
        taxCalculation.totalPrice,
        1
      );

      return {
        success: true,
        checkoutUrl: response.url,
        paymentId: response.id,
        customerId: request.customerId,
        totalAmount: taxCalculation.totalPrice,
        taxAmount: taxCalculation.taxAmount,
        exemptionStatus: {
          isExempt: taxCalculation.isExempt,
          exemptionReason: taxCalculation.exemptionReason,
          wyomingAdvantage: taxCalculation.isExempt ? 'Legal service exemption applied' : 'Standard tax rate'
        },
        paddleResponse: response
      };

    } catch (error) {
      console.error('Paddle one-time payment creation failed:', error);
      throw new Error(`Payment creation failed: ${error.message}`);
    }
  }

  /**
   * Handle Paddle webhooks with tax compliance logging
   */
  async handleWebhook(rawBody: string, signature: string): Promise<any> {
    try {
      // Verify webhook signature
      const isValid = this.verifyWebhookSignature(rawBody, signature);
      if (!isValid) {
        throw new Error('Invalid webhook signature');
      }

      const webhookData = JSON.parse(rawBody);
      const eventType = webhookData.alert_name;

      switch (eventType) {
        case 'subscription_created':
          return await this.handleSubscriptionCreated(webhookData);
        
        case 'subscription_updated':
          return await this.handleSubscriptionUpdated(webhookData);
        
        case 'subscription_cancelled':
          return await this.handleSubscriptionCancelled(webhookData);
        
        case 'payment_succeeded':
          return await this.handlePaymentSucceeded(webhookData);
        
        case 'payment_failed':
          return await this.handlePaymentFailed(webhookData);
        
        case 'subscription_payment_succeeded':
          return await this.handleSubscriptionPaymentSucceeded(webhookData);
        
        default:
          console.log(`Unhandled webhook event: ${eventType}`);
          return { success: true, message: 'Event logged' };
      }

    } catch (error) {
      console.error('Webhook processing failed:', error);
      throw error;
    }
  }

  /**
   * Get subscription details with tax breakdown
   */
  async getSubscription(subscriptionId: string): Promise<any> {
    try {
      const data = {
        vendor_id: this.config.vendorId,
        vendor_auth_code: this.config.apiKey,
        subscription_id: subscriptionId
      };

      const response = await this.paddleRequest('2.0/subscription/users', data);
      
      // Add Wyoming tax advantage information
      if (response && response.length > 0) {
        const subscription = response[0];
        const passthroughData = subscription.passthrough ? JSON.parse(subscription.passthrough) : {};
        
        return {
          ...subscription,
          wyomingTaxAdvantage: {
            legalEntityBased: passthroughData.wyomingLegalEntity || false,
            taxOptimized: passthroughData.taxCalculation || null,
            exemptServices: passthroughData.legalServiceExemption || 0,
            effectiveTaxRate: this.calculateEffectiveTaxRate(subscription),
            competitiveAdvantage: 'Wyoming-based legal services provide maximum tax exemptions'
          }
        };
      }

      return response;

    } catch (error) {
      console.error('Get subscription failed:', error);
      throw error;
    }
  }

  /**
   * Cancel subscription with tax compliance cleanup
   */
  async cancelSubscription(subscriptionId: string, reason?: string): Promise<any> {
    try {
      const data = {
        vendor_id: this.config.vendorId,
        vendor_auth_code: this.config.apiKey,
        subscription_id: subscriptionId
      };

      const response = await this.paddleRequest('2.0/subscription/users_cancel', data);
      
      // Log cancellation for compliance
      console.log(`Subscription cancelled: ${subscriptionId}`, {
        reason: reason || 'No reason provided',
        timestamp: new Date().toISOString(),
        wyomingCompliance: 'Cancellation logged for tax reporting'
      });

      return {
        success: true,
        subscriptionId,
        cancelledAt: new Date().toISOString(),
        reason: reason || 'Customer request',
        paddleResponse: response
      };

    } catch (error) {
      console.error('Subscription cancellation failed:', error);
      throw error;
    }
  }

  // Private helper methods

  private async paddleRequest(endpoint: string, data: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams(data).toString()
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Paddle API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(`Paddle API error: ${JSON.stringify(result.error)}`);
    }

    return result.response;
  }

  private verifyWebhookSignature(rawBody: string, signature: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha1', this.config.webhookSecret)
      .update(rawBody)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature.replace('sha1=', '')),
      Buffer.from(expectedSignature)
    );
  }

  private async handleSubscriptionCreated(webhookData: any): Promise<any> {
    const passthroughData = JSON.parse(webhookData.passthrough || '{}');
    
    // Log subscription creation for tax compliance
    console.log('Subscription created with Wyoming tax optimization:', {
      subscriptionId: webhookData.subscription_id,
      customerId: passthroughData.customerId,
      wyomingEntity: passthroughData.wyomingLegalEntity,
      taxOptimized: passthroughData.taxCalculation,
      legalExemptions: passthroughData.legalServiceExemption
    });

    // Update nexus tracking
    if (passthroughData.nexusState && webhookData.next_payment_amount) {
      await this.taxCalculator.updateNexusTracking(
        passthroughData.nexusState,
        parseFloat(webhookData.next_payment_amount),
        1
      );
    }

    return { success: true, processed: 'subscription_created' };
  }

  private async handleSubscriptionPaymentSucceeded(webhookData: any): Promise<any> {
    const passthroughData = JSON.parse(webhookData.passthrough || '{}');
    
    // Track recurring payment for nexus monitoring
    if (passthroughData.nexusState && webhookData.payment_gross) {
      await this.taxCalculator.updateNexusTracking(
        passthroughData.nexusState,
        parseFloat(webhookData.payment_gross),
        1
      );
    }

    return { success: true, processed: 'subscription_payment_succeeded' };
  }

  private async handlePaymentSucceeded(webhookData: any): Promise<any> {
    const passthroughData = JSON.parse(webhookData.passthrough || '{}');
    
    console.log('One-time payment succeeded with tax compliance:', {
      paymentId: webhookData.order_id,
      customerId: passthroughData.customerId,
      serviceType: passthroughData.serviceType,
      taxExempt: passthroughData.taxExempt,
      wyomingAdvantage: passthroughData.wyomingAdvantage
    });

    return { success: true, processed: 'payment_succeeded' };
  }

  private async handlePaymentFailed(webhookData: any): Promise<any> {
    console.log('Payment failed:', {
      orderId: webhookData.order_id,
      reason: webhookData.payment_method,
      timestamp: new Date().toISOString()
    });

    return { success: true, processed: 'payment_failed' };
  }

  private async handleSubscriptionUpdated(webhookData: any): Promise<any> {
    return { success: true, processed: 'subscription_updated' };
  }

  private async handleSubscriptionCancelled(webhookData: any): Promise<any> {
    console.log('Subscription cancelled via webhook:', {
      subscriptionId: webhookData.subscription_id,
      reason: 'Paddle webhook notification'
    });

    return { success: true, processed: 'subscription_cancelled' };
  }

  private getProductId(serviceType: string): string {
    const productMap = {
      'dmca_takedown': 'prod_dmca_basic',
      'legal_consultation': 'prod_legal_consult',
      'evidence_storage': 'prod_evidence_store',
      'case_management': 'prod_case_mgmt',
      'priority_support': 'prod_priority_support',
      'legal_research': 'prod_legal_research'
    };

    return productMap[serviceType] || 'prod_default';
  }

  private getServiceDisplayName(serviceType: string): string {
    const nameMap = {
      'dmca_takedown': 'DMCA Takedown Service',
      'legal_consultation': 'Legal Consultation',
      'evidence_storage': 'Evidence Storage',
      'case_management': 'Case Management',
      'priority_support': 'Priority Support',
      'legal_research': 'Legal Research'
    };

    return nameMap[serviceType] || 'Legal Service';
  }

  private calculateEffectiveTaxRate(subscription: any): number {
    // Calculate effective tax rate based on subscription data
    const taxAmount = parseFloat(subscription.next_payment_tax || '0');
    const baseAmount = parseFloat(subscription.next_payment_amount || '0');
    
    if (baseAmount === 0) return 0;
    
    return (taxAmount / (baseAmount + taxAmount)) * 100;
  }
}