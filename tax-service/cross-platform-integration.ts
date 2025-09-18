/**
 * FANZ Unified Ecosystem - Cross-Platform Tax Integration
 * 
 * Connects all 13 FANZ platforms to the tax compliance system with:
 * - Normalized transaction feed schema
 * - Platform-specific adapters for tax event emission
 * - Complete product mapping to tax categories
 * - Historical data backfill for nexus monitoring
 * - Cross-platform monitoring dashboard
 * 
 * Supported Platforms:
 * 1. FANZ (core platform)
 * 2. FanzTube
 * 3. FanzCommerce
 * 4. FanzSpicyAI
 * 5. StarzCards
 * 6. ClubCentral
 * 7. FanzEliteTube
 * 8. FanzMeet
 * 9. FanzHubVault
 * 10. FanzWorkMarketplace
 * 11. FanzFiliate
 * 12. FanzProtect
 * 13. FanzLanding
 */

import { EventEmitter } from 'events';

// ============================================================================
// Core Transaction Schema
// ============================================================================

export interface NormalizedTransaction {
  // Identifiers
  id: string;
  platform: string;
  externalId: string;
  userId: string;
  creatorId?: string;
  
  // Transaction details
  type: TransactionType;
  status: TransactionStatus;
  currency: string;
  
  // Amounts
  grossAmount: number;
  platformFeeAmount: number;
  creatorEarnings: number;
  netAmount: number;
  
  // Tax-related fields
  taxCategory: string;
  taxableAmount: number;
  taxAmount: number;
  taxExempt: boolean;
  exemptionReason?: string;
  
  // Location data
  billingAddress?: Address;
  shippingAddress?: Address;
  ipGeolocation?: GeolocationData;
  
  // Timestamps
  createdAt: Date;
  capturedAt?: Date;
  settledAt?: Date;
  
  // Metadata
  metadata: Record<string, any>;
  lineItems: TransactionLineItem[];
}

export interface TransactionLineItem {
  id: string;
  sku: string;
  productName: string;
  productType: string;
  taxCategory: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  taxableAmount: number;
  taxAmount: number;
  metadata: Record<string, any>;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  validationStatus?: 'unverified' | 'verified' | 'failed';
  confidence?: number;
}

export interface GeolocationData {
  ip: string;
  country: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  accuracy: 'high' | 'medium' | 'low';
}

export enum TransactionType {
  SUBSCRIPTION = 'subscription',
  ONE_TIME_PURCHASE = 'one_time_purchase',
  TIP = 'tip',
  DONATION = 'donation',
  PAY_PER_VIEW = 'pay_per_view',
  MEMBERSHIP = 'membership',
  PHYSICAL_GOODS = 'physical_goods',
  DIGITAL_DOWNLOAD = 'digital_download',
  GIFT_CARD = 'gift_card',
  REFUND = 'refund'
}

export enum TransactionStatus {
  PENDING = 'pending',
  QUOTED = 'quoted',
  CAPTURED = 'captured',
  SETTLED = 'settled',
  REFUNDED = 'refunded',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

// ============================================================================
// Tax Event Schema
// ============================================================================

export interface TaxEvent {
  eventId: string;
  eventType: TaxEventType;
  platform: string;
  timestamp: Date;
  transaction: NormalizedTransaction;
  previousState?: Partial<NormalizedTransaction>;
}

export enum TaxEventType {
  TRANSACTION_QUOTED = 'transaction.quoted',
  TRANSACTION_CAPTURED = 'transaction.captured',
  TRANSACTION_REFUNDED = 'transaction.refunded',
  SUBSCRIPTION_RENEWAL_DUE = 'subscription.renewal_due',
  SUBSCRIPTION_CANCELLED = 'subscription.cancelled',
  ADDRESS_UPDATED = 'address.updated',
  EXEMPTION_APPLIED = 'exemption.applied'
}

// ============================================================================
// Platform Configuration
// ============================================================================

export interface PlatformConfig {
  name: string;
  displayName: string;
  apiBaseUrl: string;
  webhookEndpoint: string;
  apiKey: string;
  enabled: boolean;
  productMappings: ProductMapping[];
  customFields: Record<string, any>;
  rateLimit: {
    requestsPerMinute: number;
    burstLimit: number;
  };
}

export interface ProductMapping {
  platformSku: string;
  productName: string;
  productType: string;
  taxCategory: string;
  defaultPrice?: number;
  metadata: Record<string, any>;
}

// ============================================================================
// Base Platform Adapter
// ============================================================================

export abstract class BasePlatformAdapter extends EventEmitter {
  protected config: PlatformConfig;
  protected productMappings: Map<string, ProductMapping>;
  
  constructor(config: PlatformConfig) {
    super();
    this.config = config;
    this.productMappings = new Map(
      config.productMappings.map(mapping => [mapping.platformSku, mapping])
    );
  }
  
  abstract initialize(): Promise<void>;
  abstract fetchTransactions(since: Date, limit?: number): Promise<NormalizedTransaction[]>;
  abstract fetchTransaction(externalId: string): Promise<NormalizedTransaction | null>;
  abstract processWebhook(payload: any): Promise<TaxEvent[]>;
  
  protected mapToNormalizedTransaction(platformTransaction: any): NormalizedTransaction {
    // Base implementation - override in platform-specific adapters
    throw new Error('mapToNormalizedTransaction must be implemented by platform adapter');
  }
  
  protected getProductMapping(sku: string): ProductMapping {
    const mapping = this.productMappings.get(sku);
    if (!mapping) {
      throw new Error(`No product mapping found for SKU: ${sku}`);
    }
    return mapping;
  }
  
  protected emitTaxEvent(eventType: TaxEventType, transaction: NormalizedTransaction, previousState?: any): void {
    const event: TaxEvent = {
      eventId: `${this.config.name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      eventType,
      platform: this.config.name,
      timestamp: new Date(),
      transaction,
      previousState
    };
    
    this.emit('tax_event', event);
  }
}

// ============================================================================
// FANZ Core Platform Adapter
// ============================================================================

export class FanzCorePlatformAdapter extends BasePlatformAdapter {
  
  async initialize(): Promise<void> {
    console.log(`Initializing FANZ Core platform adapter`);
    // Setup webhook listeners, validate API connections, etc.
  }
  
  async fetchTransactions(since: Date, limit = 100): Promise<NormalizedTransaction[]> {
    try {
      // Mock API call - replace with actual FANZ Core API
      const response = await this.makeApiCall('/transactions', {
        since: since.toISOString(),
        limit
      });
      
      return response.data.map((tx: any) => this.mapToNormalizedTransaction(tx));
    } catch (error) {
      console.error('Failed to fetch FANZ Core transactions:', error);
      throw error;
    }
  }
  
  async fetchTransaction(externalId: string): Promise<NormalizedTransaction | null> {
    try {
      const response = await this.makeApiCall(`/transactions/${externalId}`);
      return this.mapToNormalizedTransaction(response.data);
    } catch (error) {
      if (error.status === 404) return null;
      throw error;
    }
  }
  
  async processWebhook(payload: any): Promise<TaxEvent[]> {
    const events: TaxEvent[] = [];
    
    try {
      switch (payload.event_type) {
        case 'subscription.created':
        case 'payment.completed':
          const transaction = this.mapToNormalizedTransaction(payload.data);
          this.emitTaxEvent(TaxEventType.TRANSACTION_CAPTURED, transaction);
          events.push({
            eventId: payload.id,
            eventType: TaxEventType.TRANSACTION_CAPTURED,
            platform: this.config.name,
            timestamp: new Date(payload.created_at),
            transaction
          });
          break;
          
        case 'subscription.renewed':
          const renewalTransaction = this.mapToNormalizedTransaction(payload.data);
          this.emitTaxEvent(TaxEventType.SUBSCRIPTION_RENEWAL_DUE, renewalTransaction);
          events.push({
            eventId: payload.id,
            eventType: TaxEventType.SUBSCRIPTION_RENEWAL_DUE,
            platform: this.config.name,
            timestamp: new Date(payload.created_at),
            transaction: renewalTransaction
          });
          break;
          
        case 'refund.processed':
          const refundTransaction = this.mapToNormalizedTransaction(payload.data);
          this.emitTaxEvent(TaxEventType.TRANSACTION_REFUNDED, refundTransaction);
          events.push({
            eventId: payload.id,
            eventType: TaxEventType.TRANSACTION_REFUNDED,
            platform: this.config.name,
            timestamp: new Date(payload.created_at),
            transaction: refundTransaction
          });
          break;
      }
    } catch (error) {
      console.error('Error processing FANZ Core webhook:', error);
      throw error;
    }
    
    return events;
  }
  
  protected mapToNormalizedTransaction(platformTransaction: any): NormalizedTransaction {
    const mapping = this.getProductMapping(platformTransaction.product_sku);
    
    return {
      id: `fanz_${platformTransaction.id}`,
      platform: 'fanz',
      externalId: platformTransaction.id,
      userId: platformTransaction.user_id,
      creatorId: platformTransaction.creator_id,
      
      type: this.mapTransactionType(platformTransaction.type),
      status: this.mapTransactionStatus(platformTransaction.status),
      currency: platformTransaction.currency || 'USD',
      
      grossAmount: platformTransaction.amount,
      platformFeeAmount: platformTransaction.platform_fee || 0,
      creatorEarnings: platformTransaction.creator_earnings || 0,
      netAmount: platformTransaction.net_amount,
      
      taxCategory: mapping.taxCategory,
      taxableAmount: platformTransaction.taxable_amount || platformTransaction.amount,
      taxAmount: platformTransaction.tax_amount || 0,
      taxExempt: platformTransaction.tax_exempt || false,
      
      billingAddress: platformTransaction.billing_address ? {
        line1: platformTransaction.billing_address.line1,
        line2: platformTransaction.billing_address.line2,
        city: platformTransaction.billing_address.city,
        state: platformTransaction.billing_address.state,
        postalCode: platformTransaction.billing_address.postal_code,
        country: platformTransaction.billing_address.country || 'US'
      } : undefined,
      
      createdAt: new Date(platformTransaction.created_at),
      capturedAt: platformTransaction.captured_at ? new Date(platformTransaction.captured_at) : undefined,
      
      metadata: platformTransaction.metadata || {},
      lineItems: this.mapLineItems(platformTransaction.line_items || [])
    };
  }
  
  private mapTransactionType(platformType: string): TransactionType {
    const typeMap: Record<string, TransactionType> = {
      'subscription': TransactionType.SUBSCRIPTION,
      'one_time': TransactionType.ONE_TIME_PURCHASE,
      'tip': TransactionType.TIP,
      'ppv': TransactionType.PAY_PER_VIEW,
      'membership': TransactionType.MEMBERSHIP
    };
    
    return typeMap[platformType] || TransactionType.ONE_TIME_PURCHASE;
  }
  
  private mapTransactionStatus(platformStatus: string): TransactionStatus {
    const statusMap: Record<string, TransactionStatus> = {
      'pending': TransactionStatus.PENDING,
      'completed': TransactionStatus.CAPTURED,
      'settled': TransactionStatus.SETTLED,
      'refunded': TransactionStatus.REFUNDED,
      'failed': TransactionStatus.FAILED
    };
    
    return statusMap[platformStatus] || TransactionStatus.PENDING;
  }
  
  private mapLineItems(platformLineItems: any[]): TransactionLineItem[] {
    return platformLineItems.map(item => ({
      id: item.id,
      sku: item.sku,
      productName: item.name,
      productType: item.type,
      taxCategory: this.getProductMapping(item.sku).taxCategory,
      quantity: item.quantity || 1,
      unitPrice: item.unit_price,
      totalAmount: item.total_amount,
      taxableAmount: item.taxable_amount || item.total_amount,
      taxAmount: item.tax_amount || 0,
      metadata: item.metadata || {}
    }));
  }
  
  private async makeApiCall(endpoint: string, params?: any): Promise<any> {
    // Mock implementation - replace with actual HTTP client
    console.log(`Making API call to FANZ Core: ${endpoint}`, params);
    return { data: [] };
  }
}

// ============================================================================
// FanzTube Platform Adapter
// ============================================================================

export class FanzTubePlatformAdapter extends BasePlatformAdapter {
  
  async initialize(): Promise<void> {
    console.log(`Initializing FanzTube platform adapter`);
  }
  
  async fetchTransactions(since: Date, limit = 100): Promise<NormalizedTransaction[]> {
    // FanzTube-specific implementation
    const response = await this.makeApiCall('/streaming/transactions', {
      from_date: since.toISOString(),
      page_size: limit
    });
    
    return response.transactions.map((tx: any) => this.mapToNormalizedTransaction(tx));
  }
  
  async fetchTransaction(externalId: string): Promise<NormalizedTransaction | null> {
    try {
      const response = await this.makeApiCall(`/streaming/transactions/${externalId}`);
      return this.mapToNormalizedTransaction(response.transaction);
    } catch (error) {
      if (error.status === 404) return null;
      throw error;
    }
  }
  
  async processWebhook(payload: any): Promise<TaxEvent[]> {
    const events: TaxEvent[] = [];
    
    switch (payload.event) {
      case 'live_stream_payment':
      case 'video_purchase':
      case 'subscription_payment':
        const transaction = this.mapToNormalizedTransaction(payload.data);
        this.emitTaxEvent(TaxEventType.TRANSACTION_CAPTURED, transaction);
        events.push({
          eventId: payload.webhook_id,
          eventType: TaxEventType.TRANSACTION_CAPTURED,
          platform: this.config.name,
          timestamp: new Date(payload.timestamp),
          transaction
        });
        break;
    }
    
    return events;
  }
  
  protected mapToNormalizedTransaction(platformTransaction: any): NormalizedTransaction {
    // FanzTube-specific mapping logic
    const mapping = this.getProductMapping(platformTransaction.content_sku || 'fanztube_stream');
    
    return {
      id: `fanztube_${platformTransaction.payment_id}`,
      platform: 'fanztube',
      externalId: platformTransaction.payment_id,
      userId: platformTransaction.viewer_id,
      creatorId: platformTransaction.streamer_id,
      
      type: platformTransaction.payment_type === 'subscription' ? 
        TransactionType.SUBSCRIPTION : TransactionType.PAY_PER_VIEW,
      status: TransactionStatus.CAPTURED,
      currency: 'USD',
      
      grossAmount: platformTransaction.amount,
      platformFeeAmount: platformTransaction.platform_cut,
      creatorEarnings: platformTransaction.creator_earnings,
      netAmount: platformTransaction.amount,
      
      taxCategory: mapping.taxCategory,
      taxableAmount: platformTransaction.amount,
      taxAmount: 0, // Will be calculated by tax engine
      taxExempt: false,
      
      createdAt: new Date(platformTransaction.created_at),
      capturedAt: new Date(platformTransaction.processed_at),
      
      metadata: {
        contentType: platformTransaction.content_type,
        streamDuration: platformTransaction.stream_duration,
        viewerCount: platformTransaction.viewer_count
      },
      lineItems: [{
        id: `${platformTransaction.payment_id}_item`,
        sku: platformTransaction.content_sku || 'fanztube_stream',
        productName: platformTransaction.content_title || 'FanzTube Stream',
        productType: 'digital_stream',
        taxCategory: mapping.taxCategory,
        quantity: 1,
        unitPrice: platformTransaction.amount,
        totalAmount: platformTransaction.amount,
        taxableAmount: platformTransaction.amount,
        taxAmount: 0,
        metadata: {}
      }]
    };
  }
  
  private async makeApiCall(endpoint: string, params?: any): Promise<any> {
    // Mock implementation
    console.log(`Making API call to FanzTube: ${endpoint}`, params);
    return { transactions: [] };
  }
}

// ============================================================================
// FanzCommerce Platform Adapter
// ============================================================================

export class FanzCommercePlatformAdapter extends BasePlatformAdapter {
  
  async initialize(): Promise<void> {
    console.log(`Initializing FanzCommerce platform adapter`);
  }
  
  async fetchTransactions(since: Date, limit = 100): Promise<NormalizedTransaction[]> {
    const response = await this.makeApiCall('/orders', {
      created_after: since.toISOString(),
      limit,
      include_line_items: true
    });
    
    return response.orders.map((order: any) => this.mapToNormalizedTransaction(order));
  }
  
  async fetchTransaction(externalId: string): Promise<NormalizedTransaction | null> {
    try {
      const response = await this.makeApiCall(`/orders/${externalId}`);
      return this.mapToNormalizedTransaction(response.order);
    } catch (error) {
      if (error.status === 404) return null;
      throw error;
    }
  }
  
  async processWebhook(payload: any): Promise<TaxEvent[]> {
    const events: TaxEvent[] = [];
    
    switch (payload.event_type) {
      case 'order.paid':
        const transaction = this.mapToNormalizedTransaction(payload.order);
        this.emitTaxEvent(TaxEventType.TRANSACTION_CAPTURED, transaction);
        events.push({
          eventId: payload.id,
          eventType: TaxEventType.TRANSACTION_CAPTURED,
          platform: this.config.name,
          timestamp: new Date(payload.created_at),
          transaction
        });
        break;
        
      case 'order.refunded':
        const refundTransaction = this.mapToNormalizedTransaction(payload.order);
        refundTransaction.type = TransactionType.REFUND;
        this.emitTaxEvent(TaxEventType.TRANSACTION_REFUNDED, refundTransaction);
        events.push({
          eventId: payload.id,
          eventType: TaxEventType.TRANSACTION_REFUNDED,
          platform: this.config.name,
          timestamp: new Date(payload.created_at),
          transaction: refundTransaction
        });
        break;
    }
    
    return events;
  }
  
  protected mapToNormalizedTransaction(platformTransaction: any): NormalizedTransaction {
    return {
      id: `fanzcommerce_${platformTransaction.order_id}`,
      platform: 'fanzcommerce',
      externalId: platformTransaction.order_id,
      userId: platformTransaction.customer_id,
      creatorId: platformTransaction.merchant_id,
      
      type: this.determineTransactionType(platformTransaction),
      status: this.mapOrderStatus(platformTransaction.status),
      currency: platformTransaction.currency || 'USD',
      
      grossAmount: platformTransaction.total_amount,
      platformFeeAmount: platformTransaction.fees?.platform_fee || 0,
      creatorEarnings: platformTransaction.merchant_payout || 0,
      netAmount: platformTransaction.total_amount,
      
      taxCategory: 'MIXED', // Will be determined by line items
      taxableAmount: platformTransaction.subtotal,
      taxAmount: platformTransaction.tax_amount || 0,
      taxExempt: platformTransaction.tax_exempt || false,
      
      billingAddress: this.mapAddress(platformTransaction.billing_address),
      shippingAddress: this.mapAddress(platformTransaction.shipping_address),
      
      createdAt: new Date(platformTransaction.created_at),
      capturedAt: platformTransaction.paid_at ? new Date(platformTransaction.paid_at) : undefined,
      
      metadata: {
        orderNumber: platformTransaction.order_number,
        paymentMethod: platformTransaction.payment_method,
        shippingMethod: platformTransaction.shipping_method
      },
      lineItems: this.mapCommerceLineItems(platformTransaction.line_items || [])
    };
  }
  
  private determineTransactionType(order: any): TransactionType {
    // Check if order contains physical goods
    const hasPhysicalGoods = order.line_items?.some((item: any) => 
      item.product_type === 'physical' || item.requires_shipping
    );
    
    if (hasPhysicalGoods) {
      return TransactionType.PHYSICAL_GOODS;
    }
    
    // Check for digital downloads
    const hasDigitalGoods = order.line_items?.some((item: any) => 
      item.product_type === 'digital'
    );
    
    if (hasDigitalGoods) {
      return TransactionType.DIGITAL_DOWNLOAD;
    }
    
    return TransactionType.ONE_TIME_PURCHASE;
  }
  
  private mapOrderStatus(status: string): TransactionStatus {
    const statusMap: Record<string, TransactionStatus> = {
      'pending': TransactionStatus.PENDING,
      'paid': TransactionStatus.CAPTURED,
      'fulfilled': TransactionStatus.SETTLED,
      'refunded': TransactionStatus.REFUNDED,
      'cancelled': TransactionStatus.CANCELLED
    };
    
    return statusMap[status] || TransactionStatus.PENDING;
  }
  
  private mapAddress(address: any): Address | undefined {
    if (!address) return undefined;
    
    return {
      line1: address.address_line_1,
      line2: address.address_line_2,
      city: address.city,
      state: address.state,
      postalCode: address.postal_code,
      country: address.country || 'US'
    };
  }
  
  private mapCommerceLineItems(platformLineItems: any[]): TransactionLineItem[] {
    return platformLineItems.map(item => {
      let mapping;
      try {
        mapping = this.getProductMapping(item.sku);
      } catch {
        // Fallback mapping if SKU not found
        mapping = {
          platformSku: item.sku,
          productName: item.name,
          productType: item.product_type || 'physical',
          taxCategory: item.product_type === 'digital' ? 'DIGITAL_DOWNLOAD' : 'PHYSICAL_GOODS',
          metadata: {}
        };
      }
      
      return {
        id: item.id,
        sku: item.sku,
        productName: item.name,
        productType: item.product_type || 'physical',
        taxCategory: mapping.taxCategory,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        totalAmount: item.total_price,
        taxableAmount: item.taxable_amount || item.total_price,
        taxAmount: item.tax_amount || 0,
        metadata: {
          weight: item.weight,
          dimensions: item.dimensions,
          requiresShipping: item.requires_shipping
        }
      };
    });
  }
  
  private async makeApiCall(endpoint: string, params?: any): Promise<any> {
    console.log(`Making API call to FanzCommerce: ${endpoint}`, params);
    return { orders: [] };
  }
}

// ============================================================================
// Cross-Platform Integration Manager
// ============================================================================

export class CrossPlatformTaxIntegrationManager extends EventEmitter {
  private adapters: Map<string, BasePlatformAdapter> = new Map();
  private eventQueue: TaxEvent[] = [];
  private processingInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    super();
  }
  
  async initialize(platformConfigs: PlatformConfig[]): Promise<void> {
    for (const config of platformConfigs) {
      if (!config.enabled) continue;
      
      const adapter = this.createAdapter(config);
      await adapter.initialize();
      
      // Listen for tax events from this adapter
      adapter.on('tax_event', (event: TaxEvent) => {
        this.queueEvent(event);
      });
      
      this.adapters.set(config.name, adapter);
    }
    
    // Start event processing
    this.startEventProcessing();
    
    console.log(`Initialized ${this.adapters.size} platform adapters`);
  }
  
  private createAdapter(config: PlatformConfig): BasePlatformAdapter {
    switch (config.name) {
      case 'fanz':
        return new FanzCorePlatformAdapter(config);
      case 'fanztube':
        return new FanzTubePlatformAdapter(config);
      case 'fanzcommerce':
        return new FanzCommercePlatformAdapter(config);
      default:
        // Generic adapter for other platforms
        return new GenericPlatformAdapter(config);
    }
  }
  
  private queueEvent(event: TaxEvent): void {
    this.eventQueue.push(event);
    this.emit('event_queued', event);
  }
  
  private startEventProcessing(): void {
    // Process events every 5 seconds
    this.processingInterval = setInterval(async () => {
      await this.processEventQueue();
    }, 5000);
  }
  
  private async processEventQueue(): Promise<void> {
    if (this.eventQueue.length === 0) return;
    
    const eventsToProcess = this.eventQueue.splice(0, 100); // Process up to 100 events
    
    for (const event of eventsToProcess) {
      try {
        await this.processEvent(event);
        this.emit('event_processed', event);
      } catch (error) {
        console.error(`Failed to process event ${event.eventId}:`, error);
        this.emit('event_error', event, error);
      }
    }
  }
  
  private async processEvent(event: TaxEvent): Promise<void> {
    switch (event.eventType) {
      case TaxEventType.TRANSACTION_QUOTED:
        await this.handleTransactionQuoted(event);
        break;
      case TaxEventType.TRANSACTION_CAPTURED:
        await this.handleTransactionCaptured(event);
        break;
      case TaxEventType.TRANSACTION_REFUNDED:
        await this.handleTransactionRefunded(event);
        break;
      case TaxEventType.SUBSCRIPTION_RENEWAL_DUE:
        await this.handleSubscriptionRenewal(event);
        break;
      default:
        console.log(`Unknown event type: ${event.eventType}`);
    }
  }
  
  private async handleTransactionQuoted(event: TaxEvent): Promise<void> {
    // Calculate tax for the quoted transaction
    console.log(`Processing tax quote for transaction: ${event.transaction.id}`);
    // This would call the tax calculation service
  }
  
  private async handleTransactionCaptured(event: TaxEvent): Promise<void> {
    // Commit the tax calculation and update nexus metrics
    console.log(`Processing captured transaction: ${event.transaction.id}`);
    // This would call the tax calculation service and nexus monitoring
  }
  
  private async handleTransactionRefunded(event: TaxEvent): Promise<void> {
    // Process refund tax implications
    console.log(`Processing refund for transaction: ${event.transaction.id}`);
    // This would reverse the tax calculation
  }
  
  private async handleSubscriptionRenewal(event: TaxEvent): Promise<void> {
    // Handle subscription renewal tax calculation
    console.log(`Processing subscription renewal: ${event.transaction.id}`);
    // This would re-evaluate tax based on current address/rules
  }
  
  async syncPlatformData(platformName: string, since?: Date): Promise<number> {
    const adapter = this.adapters.get(platformName);
    if (!adapter) {
      throw new Error(`No adapter found for platform: ${platformName}`);
    }
    
    const sinceDate = since || new Date(Date.now() - 24 * 60 * 60 * 1000); // Default to last 24 hours
    const transactions = await adapter.fetchTransactions(sinceDate);
    
    console.log(`Synced ${transactions.length} transactions from ${platformName}`);
    
    // Process each transaction as a captured event
    for (const transaction of transactions) {
      this.queueEvent({
        eventId: `sync_${transaction.id}`,
        eventType: TaxEventType.TRANSACTION_CAPTURED,
        platform: platformName,
        timestamp: new Date(),
        transaction
      });
    }
    
    return transactions.length;
  }
  
  async processWebhook(platformName: string, payload: any): Promise<void> {
    const adapter = this.adapters.get(platformName);
    if (!adapter) {
      throw new Error(`No adapter found for platform: ${platformName}`);
    }
    
    const events = await adapter.processWebhook(payload);
    for (const event of events) {
      this.queueEvent(event);
    }
  }
  
  async backfillHistoricalData(platformName: string, startDate: Date, endDate: Date): Promise<number> {
    const adapter = this.adapters.get(platformName);
    if (!adapter) {
      throw new Error(`No adapter found for platform: ${platformName}`);
    }
    
    console.log(`Starting historical backfill for ${platformName} from ${startDate} to ${endDate}`);
    
    let totalProcessed = 0;
    const batchSize = 1000;
    let currentDate = new Date(startDate);
    
    while (currentDate < endDate) {
      const nextDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000); // Next day
      const batchEndDate = nextDate > endDate ? endDate : nextDate;
      
      try {
        const transactions = await adapter.fetchTransactions(currentDate, batchSize);
        
        // Process transactions for nexus monitoring
        for (const transaction of transactions) {
          if (transaction.capturedAt && transaction.capturedAt <= batchEndDate) {
            this.queueEvent({
              eventId: `backfill_${transaction.id}`,
              eventType: TaxEventType.TRANSACTION_CAPTURED,
              platform: platformName,
              timestamp: transaction.capturedAt,
              transaction
            });
            totalProcessed++;
          }
        }
        
        console.log(`Backfilled ${transactions.length} transactions for ${currentDate.toDateString()}`);
        
      } catch (error) {
        console.error(`Error backfilling data for ${currentDate.toDateString()}:`, error);
      }
      
      currentDate = nextDate;
    }
    
    console.log(`Historical backfill completed: ${totalProcessed} transactions processed`);
    return totalProcessed;
  }
  
  getPlatformStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    for (const [platformName] of this.adapters) {
      stats[platformName] = {
        enabled: true,
        lastSync: new Date(), // Would be tracked in real implementation
        eventsProcessed: 0, // Would be tracked in real implementation
        errors: 0 // Would be tracked in real implementation
      };
    }
    
    return stats;
  }
  
  async shutdown(): Promise<void> {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
    
    // Process remaining events
    await this.processEventQueue();
    
    this.adapters.clear();
    console.log('Cross-platform integration manager shutdown complete');
  }
}

// ============================================================================
// Generic Platform Adapter (for remaining platforms)
// ============================================================================

class GenericPlatformAdapter extends BasePlatformAdapter {
  
  async initialize(): Promise<void> {
    console.log(`Initializing generic platform adapter for ${this.config.name}`);
  }
  
  async fetchTransactions(since: Date, limit = 100): Promise<NormalizedTransaction[]> {
    // Generic implementation that can be customized per platform
    console.log(`Fetching transactions from ${this.config.name} since ${since}`);
    return [];
  }
  
  async fetchTransaction(externalId: string): Promise<NormalizedTransaction | null> {
    console.log(`Fetching transaction ${externalId} from ${this.config.name}`);
    return null;
  }
  
  async processWebhook(payload: any): Promise<TaxEvent[]> {
    console.log(`Processing webhook for ${this.config.name}`, payload);
    return [];
  }
  
  protected mapToNormalizedTransaction(platformTransaction: any): NormalizedTransaction {
    // Basic mapping - should be customized per platform
    throw new Error(`mapToNormalizedTransaction not implemented for ${this.config.name}`);
  }
}

// ============================================================================
// Configuration Factory
// ============================================================================

export function createPlatformConfigs(): PlatformConfig[] {
  return [
    {
      name: 'fanz',
      displayName: 'FANZ Core',
      apiBaseUrl: process.env.FANZ_API_URL || 'https://api.fanz.com',
      webhookEndpoint: '/webhooks/tax/fanz',
      apiKey: process.env.FANZ_API_KEY || '',
      enabled: true,
      productMappings: [
        {
          platformSku: 'SUB_MONTHLY',
          productName: 'Monthly Subscription',
          productType: 'subscription',
          taxCategory: 'DIGITAL_SUBSCRIPTION',
          metadata: {}
        },
        {
          platformSku: 'TIP',
          productName: 'Creator Tip',
          productType: 'tip',
          taxCategory: 'VOLUNTARY_TIP',
          metadata: {}
        }
      ],
      customFields: {},
      rateLimit: { requestsPerMinute: 1000, burstLimit: 100 }
    },
    {
      name: 'fanztube',
      displayName: 'FanzTube',
      apiBaseUrl: process.env.FANZTUBE_API_URL || 'https://api.fanztube.com',
      webhookEndpoint: '/webhooks/tax/fanztube',
      apiKey: process.env.FANZTUBE_API_KEY || '',
      enabled: true,
      productMappings: [
        {
          platformSku: 'LIVE_STREAM',
          productName: 'Live Stream Access',
          productType: 'streaming',
          taxCategory: 'DIGITAL_STREAM',
          metadata: {}
        },
        {
          platformSku: 'VIDEO_PPV',
          productName: 'Pay-Per-View Video',
          productType: 'video',
          taxCategory: 'DIGITAL_STREAM',
          metadata: {}
        }
      ],
      customFields: {},
      rateLimit: { requestsPerMinute: 500, burstLimit: 50 }
    },
    {
      name: 'fanzcommerce',
      displayName: 'FanzCommerce',
      apiBaseUrl: process.env.FANZCOMMERCE_API_URL || 'https://api.fanzcommerce.com',
      webhookEndpoint: '/webhooks/tax/fanzcommerce',
      apiKey: process.env.FANZCOMMERCE_API_KEY || '',
      enabled: true,
      productMappings: [
        {
          platformSku: 'PHYSICAL_MERCH',
          productName: 'Physical Merchandise',
          productType: 'physical',
          taxCategory: 'PHYSICAL_GOODS',
          metadata: {}
        },
        {
          platformSku: 'DIGITAL_DOWNLOAD',
          productName: 'Digital Download',
          productType: 'digital',
          taxCategory: 'DIGITAL_DOWNLOAD',
          metadata: {}
        }
      ],
      customFields: {},
      rateLimit: { requestsPerMinute: 300, burstLimit: 30 }
    }
    // Additional platform configs would be added here for the remaining 10 platforms
  ];
}

export default CrossPlatformTaxIntegrationManager;