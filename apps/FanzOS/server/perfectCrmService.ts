import { storage } from './storage';
import { monitoringService } from './monitoringService';
import crypto from 'crypto';

export interface PerfectCRMConfig {
  apiEndpoint: string;
  apiKey: string;
  webhookSecret: string;
  syncInterval: number; // minutes
}

export interface CRMContact {
  external_id: string;
  email: string;
  first_name: string;
  last_name: string;
  display_name: string;
  role: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  subscription_price?: number;
  total_earnings?: number;
  subscriber_count?: number;
  is_verified?: boolean;
  is_active?: boolean;
  registration_date?: Date;
  last_login?: Date;
  compliance_status?: string;
  verification_expiry?: Date;
  tags?: string[];
  custom_fields?: { [key: string]: any };
}

export interface CRMSyncResult {
  success: boolean;
  crmContactId?: string;
  error?: string;
  syncedAt: Date;
}

export class PerfectCRMService {
  private config: PerfectCRMConfig;
  private syncQueue: Map<string, any> = new Map();
  private rateLimitWindow: Map<string, Date> = new Map();

  constructor() {
    this.config = {
      apiEndpoint: process.env.PERFECT_CRM_ENDPOINT || '',
      apiKey: process.env.PERFECT_CRM_API_KEY || '',
      webhookSecret: process.env.PERFECT_CRM_WEBHOOK_SECRET || '',
      syncInterval: parseInt(process.env.PERFECT_CRM_SYNC_INTERVAL || '15') // 15 minutes default
    };

    this.initializeSync();
  }

  // Sync user data to Perfect CRM
  async syncUserToCRM(
    userId: string,
    userData: any,
    action: 'create' | 'update' | 'delete' = 'update'
  ): Promise<CRMSyncResult> {
    try {
      // Check rate limiting
      if (this.isRateLimited(userId)) {
        throw new Error('Rate limited - too many sync requests for this user');
      }

      const crmContact = await this.buildCRMContact(userId, userData);
      let result: CRMSyncResult;

      switch (action) {
        case 'create':
          result = await this.createContact(crmContact);
          break;
        case 'update':
          result = await this.updateContact(crmContact);
          break;
        case 'delete':
          result = await this.deleteContact(userId);
          break;
        default:
          result = await this.updateContact(crmContact);
      }

      // Update sync record
      await this.updateSyncRecord(userId, 'users', result);

      console.log(`User synced to Perfect CRM: ${userId} (${action})`);
      monitoringService.trackBusinessMetric('perfect_crm_sync_success', 1, {
        userId,
        action,
        crmContactId: result.crmContactId
      });

      return result;

    } catch (error) {
      const errorResult: CRMSyncResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        syncedAt: new Date()
      };

      await this.updateSyncRecord(userId, 'users', errorResult);

      console.error(`Failed to sync user to Perfect CRM: ${userId}`, error);
      monitoringService.trackBusinessMetric('perfect_crm_sync_failed', 1, {
        userId,
        action,
        error: errorResult.error
      });

      return errorResult;
    }
  }

  // Sync transaction data to CRM
  async syncTransactionToCRM(
    transactionId: string,
    transactionData: any
  ): Promise<CRMSyncResult> {
    try {
      const crmData = {
        external_id: transactionId,
        type: transactionData.type,
        amount: transactionData.amount,
        currency: 'USD',
        description: transactionData.description,
        user_id: transactionData.userId,
        recipient_id: transactionData.recipientId,
        status: 'completed',
        transaction_date: transactionData.createdAt,
        fees: this.calculateFees(transactionData.amount),
        net_amount: this.calculateNetAmount(transactionData.amount),
        payment_method: 'platform_wallet',
        tags: [transactionData.type, 'platform_transaction']
      };

      const result = await this.createTransaction(crmData);
      await this.updateSyncRecord(transactionId, 'transactions', result);

      console.log(`Transaction synced to Perfect CRM: ${transactionId}`);
      monitoringService.trackBusinessMetric('perfect_crm_transaction_sync', 1, {
        transactionId,
        amount: transactionData.amount,
        type: transactionData.type
      });

      return result;

    } catch (error) {
      const errorResult: CRMSyncResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        syncedAt: new Date()
      };

      await this.updateSyncRecord(transactionId, 'transactions', errorResult);
      return errorResult;
    }
  }

  // Sync subscription data to CRM
  async syncSubscriptionToCRM(
    subscriptionId: string,
    subscriptionData: any
  ): Promise<CRMSyncResult> {
    try {
      const crmData = {
        external_id: subscriptionId,
        subscriber_id: subscriptionData.fanId,
        creator_id: subscriptionData.creatorId,
        price: subscriptionData.price,
        status: subscriptionData.isActive ? 'active' : 'inactive',
        start_date: subscriptionData.startDate,
        end_date: subscriptionData.endDate,
        renewal_date: this.calculateNextRenewal(subscriptionData.startDate),
        billing_cycle: 'monthly',
        tags: ['subscription', 'recurring_revenue']
      };

      const result = await this.createSubscription(crmData);
      await this.updateSyncRecord(subscriptionId, 'subscriptions', result);

      console.log(`Subscription synced to Perfect CRM: ${subscriptionId}`);
      monitoringService.trackBusinessMetric('perfect_crm_subscription_sync', 1, {
        subscriptionId,
        price: subscriptionData.price,
        status: subscriptionData.isActive ? 'active' : 'inactive'
      });

      return result;

    } catch (error) {
      const errorResult: CRMSyncResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        syncedAt: new Date()
      };

      await this.updateSyncRecord(subscriptionId, 'subscriptions', errorResult);
      return errorResult;
    }
  }

  // Get CRM dashboard data
  async getCRMDashboardData(userId?: string): Promise<{
    contacts: number;
    revenue: number;
    subscriptions: number;
    growth: { [key: string]: number };
    recentActivity: any[];
  }> {
    try {
      const dashboardUrl = `${this.config.apiEndpoint}/dashboard`;
      const params = userId ? `?user_id=${userId}` : '';

      const response = await fetch(`${dashboardUrl}${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`CRM dashboard request failed: ${response.status}`);
      }

      const dashboardData = await response.json();

      monitoringService.trackBusinessMetric('perfect_crm_dashboard_accessed', 1, {
        userId,
        datapoints: Object.keys(dashboardData).length
      });

      return dashboardData;

    } catch (error) {
      console.error('Failed to fetch CRM dashboard data:', error);
      
      // Return fallback data
      return {
        contacts: 0,
        revenue: 0,
        subscriptions: 0,
        growth: {},
        recentActivity: []
      };
    }
  }

  // Handle Perfect CRM webhooks
  async handleWebhook(payload: any, signature: string): Promise<void> {
    // Verify webhook signature
    if (!this.verifyWebhookSignature(payload, signature)) {
      throw new Error('Invalid webhook signature');
    }

    const { event, data } = payload;

    switch (event) {
      case 'contact.updated':
        await this.handleContactUpdate(data);
        break;
      case 'contact.deleted':
        await this.handleContactDeletion(data);
        break;
      case 'subscription.cancelled':
        await this.handleSubscriptionCancellation(data);
        break;
      case 'payment.failed':
        await this.handlePaymentFailure(data);
        break;
      default:
        console.log(`Unhandled webhook event: ${event}`);
    }

    monitoringService.trackBusinessMetric('perfect_crm_webhook_processed', 1, {
      event,
      dataId: data.id
    });
  }

  // Private methods
  private async buildCRMContact(userId: string, userData: any): Promise<CRMContact> {
    const compliance = await storage.getUserComplianceRecords(userId);
    const latestCompliance = compliance.find((r: any) => r.status === 'approved');

    return {
      external_id: userId,
      email: userData.email,
      first_name: userData.firstName || '',
      last_name: userData.lastName || '',
      display_name: userData.displayName || userData.username,
      role: userData.role,
      phone: latestCompliance?.cellPhone,
      address: latestCompliance?.address,
      city: latestCompliance?.city,
      state: latestCompliance?.state,
      zip_code: latestCompliance?.zipCode,
      subscription_price: parseFloat(userData.subscriptionPrice || '0'),
      total_earnings: parseFloat(userData.totalEarnings || '0'),
      subscriber_count: userData.subscriberCount || 0,
      is_verified: userData.isVerified || false,
      is_active: true,
      registration_date: userData.createdAt,
      last_login: userData.lastLoginAt,
      compliance_status: latestCompliance?.status || 'pending',
      verification_expiry: latestCompliance?.expiresAt,
      tags: [
        userData.role,
        userData.isVerified ? 'verified' : 'unverified',
        latestCompliance?.status === 'approved' ? 'compliant' : 'non_compliant'
      ],
      custom_fields: {
        platform: 'FanzLab',
        account_type: userData.role,
        verification_level: latestCompliance?.verificationType || 'none'
      }
    };
  }

  private async createContact(contact: CRMContact): Promise<CRMSyncResult> {
    const response = await fetch(`${this.config.apiEndpoint}/contacts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(contact)
    });

    if (!response.ok) {
      throw new Error(`Create contact failed: ${response.status}`);
    }

    const result = await response.json();
    return {
      success: true,
      crmContactId: result.id,
      syncedAt: new Date()
    };
  }

  private async updateContact(contact: CRMContact): Promise<CRMSyncResult> {
    const response = await fetch(`${this.config.apiEndpoint}/contacts/${contact.external_id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(contact)
    });

    if (!response.ok) {
      throw new Error(`Update contact failed: ${response.status}`);
    }

    const result = await response.json();
    return {
      success: true,
      crmContactId: result.id,
      syncedAt: new Date()
    };
  }

  private async deleteContact(userId: string): Promise<CRMSyncResult> {
    const response = await fetch(`${this.config.apiEndpoint}/contacts/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`
      }
    });

    if (!response.ok) {
      throw new Error(`Delete contact failed: ${response.status}`);
    }

    return {
      success: true,
      syncedAt: new Date()
    };
  }

  private async createTransaction(transactionData: any): Promise<CRMSyncResult> {
    const response = await fetch(`${this.config.apiEndpoint}/transactions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(transactionData)
    });

    if (!response.ok) {
      throw new Error(`Create transaction failed: ${response.status}`);
    }

    const result = await response.json();
    return {
      success: true,
      crmContactId: result.id,
      syncedAt: new Date()
    };
  }

  private async createSubscription(subscriptionData: any): Promise<CRMSyncResult> {
    const response = await fetch(`${this.config.apiEndpoint}/subscriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(subscriptionData)
    });

    if (!response.ok) {
      throw new Error(`Create subscription failed: ${response.status}`);
    }

    const result = await response.json();
    return {
      success: true,
      crmContactId: result.id,
      syncedAt: new Date()
    };
  }

  private async updateSyncRecord(
    entityId: string,
    entityType: string,
    result: CRMSyncResult
  ): Promise<void> {
    const syncRecord = {
      id: crypto.randomUUID(),
      entityType,
      entityId,
      crmContactId: result.crmContactId,
      syncStatus: result.success ? 'synced' : 'failed',
      lastSyncAt: result.syncedAt,
      syncData: { result },
      errorMessage: result.error,
      retryCount: result.success ? 0 : 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // await storage.createPerfectCrmSyncRecord(syncRecord); // TODO: Implement this method
  }

  private isRateLimited(userId: string): boolean {
    const lastRequest = this.rateLimitWindow.get(userId);
    const now = new Date();
    
    if (lastRequest && (now.getTime() - lastRequest.getTime()) < 60000) { // 1 minute
      return true;
    }
    
    this.rateLimitWindow.set(userId, now);
    return false;
  }

  private calculateFees(amount: number): number {
    return amount * 0.05; // 5% platform fee
  }

  private calculateNetAmount(amount: number): number {
    return amount - this.calculateFees(amount);
  }

  private calculateNextRenewal(startDate: Date): Date {
    const renewal = new Date(startDate);
    renewal.setMonth(renewal.getMonth() + 1);
    return renewal;
  }

  private verifyWebhookSignature(payload: any, signature: string): boolean {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', this.config.webhookSecret)
      .update(JSON.stringify(payload))
      .digest('hex');
    
    return `sha256=${expectedSignature}` === signature;
  }

  private async handleContactUpdate(data: any): Promise<void> {
    // Sync changes back to local database if needed
    console.log('Contact updated in CRM:', data.id);
  }

  private async handleContactDeletion(data: any): Promise<void> {
    // Handle contact deletion
    console.log('Contact deleted in CRM:', data.id);
  }

  private async handleSubscriptionCancellation(data: any): Promise<void> {
    // Update local subscription status
    console.log('Subscription cancelled in CRM:', data.id);
  }

  private async handlePaymentFailure(data: any): Promise<void> {
    // Handle payment failure
    console.log('Payment failed in CRM:', data.id);
  }

  private initializeSync(): void {
    // Start periodic sync process
    setInterval(() => {
      this.processSyncQueue();
    }, this.config.syncInterval * 60 * 1000);
  }

  private async processSyncQueue(): Promise<void> {
    // Process any queued sync operations
    console.log('Processing Perfect CRM sync queue...');
  }

  // Public utility methods
  async getConnectionStatus(): Promise<{ connected: boolean; lastSync?: Date; error?: string }> {
    try {
      const response = await fetch(`${this.config.apiEndpoint}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });

      return {
        connected: response.ok,
        lastSync: new Date(),
        error: response.ok ? undefined : `HTTP ${response.status}`
      };
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async forceSyncUser(userId: string): Promise<CRMSyncResult> {
    const userData = await storage.getUser(userId);
    if (!userData) {
      throw new Error('User not found');
    }

    return await this.syncUserToCRM(userId, userData, 'update');
  }
}

export const perfectCrmService = new PerfectCRMService();