/**
 * FANZ Unified Ecosystem - Tax Data Ingestion Connectors
 * 
 * Provides abstraction layer for sourcing tax rates and rules from multiple providers:
 * - Provider A: Commercial tax automation service (e.g., Avalara, TaxJar)
 * - Provider B: Alternative commercial vendor (e.g., Vertex, Sovos)
 * - Provider C: Internal curated dataset from public sources
 * 
 * Features:
 * - Multi-provider support with feature flags for runtime switching
 * - Nightly sync for rate changes with audit diffs
 * - On-demand refresh for specific jurisdictions
 * - Reconciliation and monitoring dashboards
 * - Fallback and circuit breaker patterns
 */

import { EventEmitter } from 'events';

// ============================================================================
// Core Interfaces
// ============================================================================

export interface TaxRate {
  id: string;
  jurisdiction_id: string;
  product_category_id?: string;
  rate: number;
  taxability: 'taxable' | 'exempt' | 'reduced';
  effective_from: Date;
  effective_to?: Date;
  rule_ref?: string;
  provider_source: string;
  last_updated: Date;
}

export interface TaxRule {
  id: string;
  jurisdiction_id: string;
  product_category_id?: string;
  rule_type: 'exemption' | 'threshold' | 'bundling' | 'sourcing' | 'rounding';
  json_rules: Record<string, any>;
  effective_from: Date;
  effective_to?: Date;
  provider_source: string;
  last_updated: Date;
}

export interface TaxJurisdiction {
  id: string;
  country_code: string;
  state_code: string;
  type: 'state' | 'county' | 'city' | 'special';
  name: string;
  code?: string;
  parent_id?: string;
  fips?: string;
  gnis?: string;
  effective_from: Date;
  effective_to?: Date;
  provider_source: string;
}

export interface RateChangeEvent {
  jurisdiction_id: string;
  product_category_id?: string;
  old_rate?: number;
  new_rate: number;
  effective_date: Date;
  provider: string;
  change_reason?: string;
}

export interface SyncResult {
  provider: string;
  sync_type: 'nightly' | 'on_demand' | 'reconciliation';
  started_at: Date;
  completed_at: Date;
  success: boolean;
  error?: string;
  stats: {
    jurisdictions_processed: number;
    rates_updated: number;
    rates_added: number;
    rates_removed: number;
    rules_updated: number;
    rules_added: number;
    discrepancies_found: number;
  };
}

export interface ProviderConfig {
  name: string;
  type: 'commercial_a' | 'commercial_b' | 'internal';
  enabled: boolean;
  priority: number;
  api_base_url?: string;
  api_key?: string;
  rate_limit: {
    requests_per_minute: number;
    burst_limit: number;
  };
  timeout_ms: number;
  circuit_breaker: {
    failure_threshold: number;
    recovery_timeout_ms: number;
  };
}

// ============================================================================
// Provider Interface
// ============================================================================

export interface TaxDataProvider {
  name: string;
  initialize(config: ProviderConfig): Promise<void>;
  fetchJurisdictions(country_code?: string, state_code?: string): Promise<TaxJurisdiction[]>;
  fetchRates(jurisdiction_id: string, effective_date?: Date): Promise<TaxRate[]>;
  fetchRules(jurisdiction_id: string, effective_date?: Date): Promise<TaxRule[]>;
  getRateChanges(since: Date): Promise<RateChangeEvent[]>;
  healthCheck(): Promise<boolean>;
  getLastSyncTime(): Promise<Date | null>;
}

// ============================================================================
// Commercial Provider A Implementation
// ============================================================================

export class CommercialProviderA implements TaxDataProvider {
  name = 'CommercialProviderA';
  private config!: ProviderConfig;
  private circuitBreakerOpen = false;
  private lastFailureTime?: Date;
  private consecutiveFailures = 0;

  async initialize(config: ProviderConfig): Promise<void> {
    this.config = config;
    console.log(`Initializing ${this.name} with config:`, { 
      api_base_url: config.api_base_url,
      enabled: config.enabled 
    });
  }

  async fetchJurisdictions(country_code = 'US', state_code?: string): Promise<TaxJurisdiction[]> {
    this.checkCircuitBreaker();
    
    try {
      // Mock implementation - replace with actual API calls
      const jurisdictions: TaxJurisdiction[] = [
        {
          id: 'juris_us_ca',
          country_code: 'US',
          state_code: 'CA',
          type: 'state',
          name: 'California',
          code: 'CA',
          effective_from: new Date('2020-01-01'),
          provider_source: this.name
        },
        {
          id: 'juris_us_ca_sf',
          country_code: 'US',
          state_code: 'CA',
          type: 'city',
          name: 'San Francisco',
          code: 'SF',
          parent_id: 'juris_us_ca',
          fips: '06075',
          effective_from: new Date('2020-01-01'),
          provider_source: this.name
        }
      ];

      if (state_code) {
        return jurisdictions.filter(j => j.state_code === state_code);
      }

      this.recordSuccess();
      return jurisdictions;
    } catch (error) {
      this.recordFailure();
      throw new Error(`${this.name} jurisdiction fetch failed: ${error}`);
    }
  }

  async fetchRates(jurisdiction_id: string, effective_date = new Date()): Promise<TaxRate[]> {
    this.checkCircuitBreaker();

    try {
      // Mock implementation - replace with actual API calls
      const rates: TaxRate[] = [
        {
          id: `rate_${jurisdiction_id}_general`,
          jurisdiction_id,
          rate: 0.0875, // 8.75%
          taxability: 'taxable',
          effective_from: new Date('2024-01-01'),
          provider_source: this.name,
          last_updated: new Date()
        },
        {
          id: `rate_${jurisdiction_id}_digital`,
          jurisdiction_id,
          product_category_id: 'cat_digital_goods',
          rate: 0.0875,
          taxability: 'taxable',
          effective_from: new Date('2024-01-01'),
          provider_source: this.name,
          last_updated: new Date()
        }
      ];

      this.recordSuccess();
      return rates;
    } catch (error) {
      this.recordFailure();
      throw new Error(`${this.name} rates fetch failed: ${error}`);
    }
  }

  async fetchRules(jurisdiction_id: string, effective_date = new Date()): Promise<TaxRule[]> {
    this.checkCircuitBreaker();

    try {
      // Mock implementation
      const rules: TaxRule[] = [
        {
          id: `rule_${jurisdiction_id}_digital_threshold`,
          jurisdiction_id,
          product_category_id: 'cat_digital_goods',
          rule_type: 'threshold',
          json_rules: {
            min_taxable_amount: 0.01,
            marketplace_facilitator: true,
            sourcing: 'destination'
          },
          effective_from: new Date('2024-01-01'),
          provider_source: this.name,
          last_updated: new Date()
        }
      ];

      this.recordSuccess();
      return rules;
    } catch (error) {
      this.recordFailure();
      throw new Error(`${this.name} rules fetch failed: ${error}`);
    }
  }

  async getRateChanges(since: Date): Promise<RateChangeEvent[]> {
    this.checkCircuitBreaker();

    try {
      // Mock implementation
      const changes: RateChangeEvent[] = [
        {
          jurisdiction_id: 'juris_us_ca',
          old_rate: 0.0825,
          new_rate: 0.0875,
          effective_date: new Date('2024-01-01'),
          provider: this.name,
          change_reason: 'Annual rate adjustment'
        }
      ];

      this.recordSuccess();
      return changes.filter(change => change.effective_date >= since);
    } catch (error) {
      this.recordFailure();
      throw new Error(`${this.name} rate changes fetch failed: ${error}`);
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Mock health check - replace with actual API ping
      if (this.circuitBreakerOpen) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  async getLastSyncTime(): Promise<Date | null> {
    // Mock implementation - would query provider's last sync endpoint
    return new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
  }

  private checkCircuitBreaker(): void {
    if (this.circuitBreakerOpen) {
      const timeSinceFailure = this.lastFailureTime 
        ? Date.now() - this.lastFailureTime.getTime()
        : 0;
      
      if (timeSinceFailure > this.config.circuit_breaker.recovery_timeout_ms) {
        this.circuitBreakerOpen = false;
        this.consecutiveFailures = 0;
        console.log(`${this.name} circuit breaker reset`);
      } else {
        throw new Error(`${this.name} circuit breaker is open`);
      }
    }
  }

  private recordSuccess(): void {
    this.consecutiveFailures = 0;
    if (this.circuitBreakerOpen) {
      this.circuitBreakerOpen = false;
      console.log(`${this.name} circuit breaker closed after successful call`);
    }
  }

  private recordFailure(): void {
    this.consecutiveFailures++;
    this.lastFailureTime = new Date();
    
    if (this.consecutiveFailures >= this.config.circuit_breaker.failure_threshold) {
      this.circuitBreakerOpen = true;
      console.log(`${this.name} circuit breaker opened after ${this.consecutiveFailures} failures`);
    }
  }
}

// ============================================================================
// Alternative Commercial Provider B
// ============================================================================

export class CommercialProviderB implements TaxDataProvider {
  name = 'CommercialProviderB';
  private config!: ProviderConfig;
  private circuitBreakerOpen = false;

  async initialize(config: ProviderConfig): Promise<void> {
    this.config = config;
    console.log(`Initializing ${this.name}`);
  }

  async fetchJurisdictions(country_code = 'US', state_code?: string): Promise<TaxJurisdiction[]> {
    // Similar implementation to Provider A but with different API structure
    throw new Error(`${this.name} not yet implemented`);
  }

  async fetchRates(jurisdiction_id: string, effective_date = new Date()): Promise<TaxRate[]> {
    throw new Error(`${this.name} not yet implemented`);
  }

  async fetchRules(jurisdiction_id: string, effective_date = new Date()): Promise<TaxRule[]> {
    throw new Error(`${this.name} not yet implemented`);
  }

  async getRateChanges(since: Date): Promise<RateChangeEvent[]> {
    throw new Error(`${this.name} not yet implemented`);
  }

  async healthCheck(): Promise<boolean> {
    return false;
  }

  async getLastSyncTime(): Promise<Date | null> {
    return null;
  }
}

// ============================================================================
// Internal Provider (Curated Dataset)
// ============================================================================

export class InternalTaxDataProvider implements TaxDataProvider {
  name = 'InternalProvider';
  private config!: ProviderConfig;
  private dataStore: Map<string, any> = new Map();

  async initialize(config: ProviderConfig): Promise<void> {
    this.config = config;
    await this.loadCuratedData();
    console.log(`Initialized ${this.name} with curated datasets`);
  }

  private async loadCuratedData(): Promise<void> {
    // Load from internal files, databases, or public sources
    // This would be populated from public tax authority sources
    const curatedJurisdictions: TaxJurisdiction[] = [
      {
        id: 'juris_us_wy',
        country_code: 'US',
        state_code: 'WY',
        type: 'state',
        name: 'Wyoming',
        code: 'WY',
        effective_from: new Date('2020-01-01'),
        provider_source: this.name
      }
    ];

    const curatedRates: TaxRate[] = [
      {
        id: 'rate_wy_state',
        jurisdiction_id: 'juris_us_wy',
        rate: 0.04, // 4% Wyoming state rate
        taxability: 'taxable',
        effective_from: new Date('2024-01-01'),
        provider_source: this.name,
        last_updated: new Date()
      }
    ];

    this.dataStore.set('jurisdictions', curatedJurisdictions);
    this.dataStore.set('rates', curatedRates);
    this.dataStore.set('rules', []);
  }

  async fetchJurisdictions(country_code = 'US', state_code?: string): Promise<TaxJurisdiction[]> {
    const jurisdictions = this.dataStore.get('jurisdictions') || [];
    
    if (state_code) {
      return jurisdictions.filter((j: TaxJurisdiction) => j.state_code === state_code);
    }
    
    return jurisdictions.filter((j: TaxJurisdiction) => j.country_code === country_code);
  }

  async fetchRates(jurisdiction_id: string, effective_date = new Date()): Promise<TaxRate[]> {
    const rates = this.dataStore.get('rates') || [];
    return rates.filter((r: TaxRate) => 
      r.jurisdiction_id === jurisdiction_id &&
      r.effective_from <= effective_date &&
      (!r.effective_to || r.effective_to > effective_date)
    );
  }

  async fetchRules(jurisdiction_id: string, effective_date = new Date()): Promise<TaxRule[]> {
    const rules = this.dataStore.get('rules') || [];
    return rules.filter((r: TaxRule) => 
      r.jurisdiction_id === jurisdiction_id &&
      r.effective_from <= effective_date &&
      (!r.effective_to || r.effective_to > effective_date)
    );
  }

  async getRateChanges(since: Date): Promise<RateChangeEvent[]> {
    // Internal provider tracks changes through version control
    return [];
  }

  async healthCheck(): Promise<boolean> {
    return this.dataStore.size > 0;
  }

  async getLastSyncTime(): Promise<Date | null> {
    // Internal provider updates are manual/scheduled
    return new Date();
  }
}

// ============================================================================
// Tax Data Ingestion Manager
// ============================================================================

export class TaxDataIngestionManager extends EventEmitter {
  private providers: Map<string, TaxDataProvider> = new Map();
  private configs: Map<string, ProviderConfig> = new Map();
  private syncSchedule: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    super();
  }

  async initialize(providerConfigs: ProviderConfig[]): Promise<void> {
    // Initialize all configured providers
    for (const config of providerConfigs) {
      if (!config.enabled) continue;

      let provider: TaxDataProvider;
      
      switch (config.type) {
        case 'commercial_a':
          provider = new CommercialProviderA();
          break;
        case 'commercial_b':
          provider = new CommercialProviderB();
          break;
        case 'internal':
          provider = new InternalTaxDataProvider();
          break;
        default:
          throw new Error(`Unknown provider type: ${config.type}`);
      }

      await provider.initialize(config);
      this.providers.set(config.name, provider);
      this.configs.set(config.name, config);
      
      // Schedule nightly sync for this provider
      this.scheduleNightlySync(config.name);
    }

    console.log(`Tax data ingestion manager initialized with ${this.providers.size} providers`);
  }

  async performSync(providerName: string, syncType: 'nightly' | 'on_demand' = 'nightly'): Promise<SyncResult> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Provider not found: ${providerName}`);
    }

    const result: SyncResult = {
      provider: providerName,
      sync_type: syncType,
      started_at: new Date(),
      completed_at: new Date(),
      success: false,
      stats: {
        jurisdictions_processed: 0,
        rates_updated: 0,
        rates_added: 0,
        rates_removed: 0,
        rules_updated: 0,
        rules_added: 0,
        discrepancies_found: 0
      }
    };

    try {
      // Check provider health
      const isHealthy = await provider.healthCheck();
      if (!isHealthy) {
        throw new Error(`Provider ${providerName} failed health check`);
      }

      // Fetch and process jurisdictions
      const jurisdictions = await provider.fetchJurisdictions();
      result.stats.jurisdictions_processed = jurisdictions.length;

      // Process each jurisdiction's rates and rules
      for (const jurisdiction of jurisdictions) {
        const rates = await provider.fetchRates(jurisdiction.id);
        const rules = await provider.fetchRules(jurisdiction.id);
        
        // Mock database persistence - replace with actual DB operations
        console.log(`Processing ${rates.length} rates and ${rules.length} rules for ${jurisdiction.name}`);
        
        result.stats.rates_added += rates.length;
        result.stats.rules_added += rules.length;
      }

      result.success = true;
      result.completed_at = new Date();

      this.emit('sync_completed', result);
      console.log(`Sync completed for ${providerName}:`, result.stats);

    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown error';
      result.completed_at = new Date();
      
      this.emit('sync_failed', result);
      console.error(`Sync failed for ${providerName}:`, error);
    }

    // Persist sync result to database
    await this.persistSyncResult(result);
    
    return result;
  }

  async performReconciliation(): Promise<Map<string, any[]>> {
    const discrepancies = new Map<string, any[]>();
    const providerNames = Array.from(this.providers.keys());
    
    if (providerNames.length < 2) {
      console.log('Need at least 2 providers for reconciliation');
      return discrepancies;
    }

    // Compare rates across providers for key jurisdictions
    const testJurisdictions = ['juris_us_ca', 'juris_us_ny', 'juris_us_tx'];
    
    for (const jurisdictionId of testJurisdictions) {
      const providerRates: Map<string, TaxRate[]> = new Map();
      
      // Fetch rates from all providers
      for (const providerName of providerNames) {
        const provider = this.providers.get(providerName);
        if (provider) {
          try {
            const rates = await provider.fetchRates(jurisdictionId);
            providerRates.set(providerName, rates);
          } catch (error) {
            console.error(`Failed to fetch rates from ${providerName}:`, error);
          }
        }
      }
      
      // Compare rates and identify discrepancies
      const jurisdictionDiscrepancies = this.compareProviderRates(providerRates, jurisdictionId);
      if (jurisdictionDiscrepancies.length > 0) {
        discrepancies.set(jurisdictionId, jurisdictionDiscrepancies);
      }
    }

    this.emit('reconciliation_completed', { 
      jurisdictions_checked: testJurisdictions.length,
      discrepancies_found: discrepancies.size 
    });

    return discrepancies;
  }

  async refreshJurisdiction(jurisdictionId: string, force = false): Promise<void> {
    const primaryProvider = this.getPrimaryProvider();
    if (!primaryProvider) {
      throw new Error('No primary provider available');
    }

    try {
      const rates = await primaryProvider.fetchRates(jurisdictionId);
      const rules = await primaryProvider.fetchRules(jurisdictionId);
      
      // Update database with fresh data
      console.log(`Refreshed ${jurisdictionId}: ${rates.length} rates, ${rules.length} rules`);
      
      this.emit('jurisdiction_refreshed', { 
        jurisdiction_id: jurisdictionId, 
        rates_count: rates.length,
        rules_count: rules.length 
      });
      
    } catch (error) {
      console.error(`Failed to refresh jurisdiction ${jurisdictionId}:`, error);
      throw error;
    }
  }

  private scheduleNightlySync(providerName: string): void {
    // Schedule sync at 2 AM local time
    const now = new Date();
    const nextSync = new Date(now);
    nextSync.setHours(2, 0, 0, 0);
    
    if (nextSync <= now) {
      nextSync.setDate(nextSync.getDate() + 1);
    }
    
    const timeUntilSync = nextSync.getTime() - now.getTime();
    
    const timeout = setTimeout(async () => {
      await this.performSync(providerName, 'nightly');
      
      // Reschedule for next day
      this.scheduleNightlySync(providerName);
    }, timeUntilSync);
    
    this.syncSchedule.set(providerName, timeout);
    
    console.log(`Scheduled nightly sync for ${providerName} at ${nextSync.toISOString()}`);
  }

  private compareProviderRates(providerRates: Map<string, TaxRate[]>, jurisdictionId: string): any[] {
    const discrepancies: any[] = [];
    const providers = Array.from(providerRates.keys());
    
    if (providers.length < 2) return discrepancies;

    // Compare rates between first two providers (extend for more providers)
    const rates1 = providerRates.get(providers[0]) || [];
    const rates2 = providerRates.get(providers[1]) || [];
    
    for (const rate1 of rates1) {
      const matchingRate2 = rates2.find(r2 => 
        r2.product_category_id === rate1.product_category_id
      );
      
      if (matchingRate2 && Math.abs(rate1.rate - matchingRate2.rate) > 0.0001) {
        discrepancies.push({
          jurisdiction_id: jurisdictionId,
          product_category_id: rate1.product_category_id,
          provider1: providers[0],
          rate1: rate1.rate,
          provider2: providers[1],
          rate2: matchingRate2.rate,
          difference: Math.abs(rate1.rate - matchingRate2.rate)
        });
      }
    }
    
    return discrepancies;
  }

  private getPrimaryProvider(): TaxDataProvider | null {
    // Return highest priority enabled provider
    let primaryProvider: TaxDataProvider | null = null;
    let highestPriority = -1;
    
    for (const [name, config] of this.configs) {
      if (config.enabled && config.priority > highestPriority) {
        highestPriority = config.priority;
        primaryProvider = this.providers.get(name) || null;
      }
    }
    
    return primaryProvider;
  }

  private async persistSyncResult(result: SyncResult): Promise<void> {
    // Mock implementation - replace with actual database persistence
    console.log('Persisting sync result:', {
      provider: result.provider,
      success: result.success,
      stats: result.stats
    });
  }

  async getProviderStatus(): Promise<Map<string, any>> {
    const status = new Map();
    
    for (const [name, provider] of this.providers) {
      const config = this.configs.get(name);
      const isHealthy = await provider.healthCheck();
      const lastSync = await provider.getLastSyncTime();
      
      status.set(name, {
        name,
        type: config?.type,
        enabled: config?.enabled,
        priority: config?.priority,
        healthy: isHealthy,
        last_sync: lastSync
      });
    }
    
    return status;
  }

  async shutdown(): Promise<void> {
    // Clear all scheduled syncs
    for (const timeout of this.syncSchedule.values()) {
      clearTimeout(timeout);
    }
    
    this.syncSchedule.clear();
    this.providers.clear();
    this.configs.clear();
    
    console.log('Tax data ingestion manager shutdown complete');
  }
}

// ============================================================================
// Configuration Factory
// ============================================================================

export function createProviderConfigs(): ProviderConfig[] {
  return [
    {
      name: 'primary_commercial',
      type: 'commercial_a',
      enabled: true,
      priority: 100,
      api_base_url: process.env.TAX_PROVIDER_A_URL || 'https://api.taxprovider-a.com',
      api_key: process.env.TAX_PROVIDER_A_KEY,
      rate_limit: {
        requests_per_minute: 1000,
        burst_limit: 100
      },
      timeout_ms: 30000,
      circuit_breaker: {
        failure_threshold: 5,
        recovery_timeout_ms: 60000
      }
    },
    {
      name: 'backup_commercial',
      type: 'commercial_b',
      enabled: false, // Enable when implemented
      priority: 80,
      api_base_url: process.env.TAX_PROVIDER_B_URL,
      api_key: process.env.TAX_PROVIDER_B_KEY,
      rate_limit: {
        requests_per_minute: 500,
        burst_limit: 50
      },
      timeout_ms: 45000,
      circuit_breaker: {
        failure_threshold: 3,
        recovery_timeout_ms: 120000
      }
    },
    {
      name: 'internal_curated',
      type: 'internal',
      enabled: true,
      priority: 60,
      rate_limit: {
        requests_per_minute: 10000,
        burst_limit: 1000
      },
      timeout_ms: 5000,
      circuit_breaker: {
        failure_threshold: 10,
        recovery_timeout_ms: 30000
      }
    }
  ];
}

// ============================================================================
// Usage Example
// ============================================================================

export async function initializeTaxDataIngestion(): Promise<TaxDataIngestionManager> {
  const manager = new TaxDataIngestionManager();
  const configs = createProviderConfigs();
  
  // Set up event listeners
  manager.on('sync_completed', (result) => {
    console.log(`✅ Sync completed for ${result.provider}:`, result.stats);
  });
  
  manager.on('sync_failed', (result) => {
    console.error(`❌ Sync failed for ${result.provider}:`, result.error);
  });
  
  manager.on('reconciliation_completed', (summary) => {
    console.log(`🔍 Reconciliation completed:`, summary);
  });
  
  await manager.initialize(configs);
  
  return manager;
}