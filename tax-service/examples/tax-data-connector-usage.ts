/**
 * FANZ Unified Ecosystem - Tax Data Connectors Usage Examples
 * 
 * Demonstrates how to initialize and use the tax data ingestion system
 * for multi-provider tax rate and rule sourcing.
 */

import {
  TaxDataIngestionManager,
  createProviderConfigs,
  initializeTaxDataIngestion
} from '../tax-data-connectors';

/**
 * Example 1: Basic initialization and sync
 */
export async function basicUsageExample(): Promise<void> {
  console.log('🚀 Initializing Tax Data Ingestion System...\n');
  
  // Initialize the manager with default provider configs
  const manager = await initializeTaxDataIngestion();
  
  // Get provider status
  const status = await manager.getProviderStatus();
  console.log('📊 Provider Status:');
  for (const [name, info] of status) {
    console.log(`  ${name}: ${info.healthy ? '✅' : '❌'} ${info.type} (priority: ${info.priority})`);
  }
  console.log('');
  
  // Perform manual sync for primary provider
  console.log('🔄 Starting manual sync...');
  const syncResult = await manager.performSync('primary_commercial', 'on_demand');
  console.log(`Sync result:`, {
    success: syncResult.success,
    duration: `${Math.round((syncResult.completed_at.getTime() - syncResult.started_at.getTime()) / 1000)}s`,
    stats: syncResult.stats
  });
  
  await manager.shutdown();
  console.log('✅ Example completed\n');
}

/**
 * Example 2: Rate reconciliation between providers
 */
export async function reconciliationExample(): Promise<void> {
  console.log('🔍 Running Provider Reconciliation...\n');
  
  const manager = await initializeTaxDataIngestion();
  
  // Perform reconciliation check
  const discrepancies = await manager.performReconciliation();
  
  console.log(`Found ${discrepancies.size} jurisdictions with rate discrepancies:`);
  for (const [jurisdiction, issues] of discrepancies) {
    console.log(`  ${jurisdiction}:`);
    for (const issue of issues) {
      console.log(`    ${issue.provider1} (${issue.rate1}) vs ${issue.provider2} (${issue.rate2})`);
      console.log(`    Difference: ${(issue.difference * 100).toFixed(4)}%`);
    }
  }
  
  await manager.shutdown();
  console.log('✅ Reconciliation example completed\n');
}

/**
 * Example 3: On-demand jurisdiction refresh
 */
export async function jurisdictionRefreshExample(): Promise<void> {
  console.log('🔄 Refreshing Specific Jurisdiction...\n');
  
  const manager = await initializeTaxDataIngestion();
  
  try {
    // Refresh California jurisdiction data
    await manager.refreshJurisdiction('juris_us_ca');
    console.log('✅ California jurisdiction data refreshed');
  } catch (error) {
    console.error('❌ Failed to refresh jurisdiction:', error);
  }
  
  await manager.shutdown();
  console.log('✅ Jurisdiction refresh example completed\n');
}

/**
 * Example 4: Custom provider configuration
 */
export async function customProviderExample(): Promise<void> {
  console.log('⚙️ Custom Provider Configuration...\n');
  
  // Create custom provider configuration
  const customConfigs = [
    {
      name: 'high_priority_provider',
      type: 'commercial_a' as const,
      enabled: true,
      priority: 150, // Higher than default
      api_base_url: 'https://premium.taxprovider.com',
      api_key: process.env.PREMIUM_TAX_API_KEY,
      rate_limit: {
        requests_per_minute: 2000,
        burst_limit: 200
      },
      timeout_ms: 20000,
      circuit_breaker: {
        failure_threshold: 3,
        recovery_timeout_ms: 30000
      }
    },
    {
      name: 'fallback_internal',
      type: 'internal' as const,
      enabled: true,
      priority: 10, // Lower priority fallback
      rate_limit: {
        requests_per_minute: 5000,
        burst_limit: 500
      },
      timeout_ms: 5000,
      circuit_breaker: {
        failure_threshold: 20,
        recovery_timeout_ms: 10000
      }
    }
  ];
  
  const manager = new TaxDataIngestionManager();
  
  // Set up monitoring event listeners
  manager.on('sync_completed', (result) => {
    console.log(`✅ ${result.provider} sync completed:`);
    console.log(`   Jurisdictions: ${result.stats.jurisdictions_processed}`);
    console.log(`   Rates added: ${result.stats.rates_added}`);
    console.log(`   Duration: ${Math.round((result.completed_at.getTime() - result.started_at.getTime()) / 1000)}s`);
  });
  
  manager.on('sync_failed', (result) => {
    console.error(`❌ ${result.provider} sync failed: ${result.error}`);
  });
  
  await manager.initialize(customConfigs);
  
  // Test syncs
  for (const config of customConfigs) {
    if (config.enabled) {
      try {
        await manager.performSync(config.name, 'on_demand');
      } catch (error) {
        console.error(`Sync failed for ${config.name}:`, error);
      }
    }
  }
  
  await manager.shutdown();
  console.log('✅ Custom provider example completed\n');
}

/**
 * Example 5: Monitoring and health checks
 */
export async function monitoringExample(): Promise<void> {
  console.log('🏥 Provider Health Monitoring...\n');
  
  const manager = await initializeTaxDataIngestion();
  
  // Check provider health over time
  const healthChecks = 3;
  for (let i = 1; i <= healthChecks; i++) {
    console.log(`Health check ${i}/${healthChecks}:`);
    
    const status = await manager.getProviderStatus();
    for (const [name, info] of status) {
      const healthIcon = info.healthy ? '✅' : '❌';
      const enabledIcon = info.enabled ? '🟢' : '🔴';
      console.log(`  ${healthIcon} ${enabledIcon} ${name} (${info.type})`);
      console.log(`    Priority: ${info.priority} | Last sync: ${info.last_sync?.toISOString() || 'never'}`);
    }
    
    if (i < healthChecks) {
      console.log('  Waiting 2 seconds...\n');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  await manager.shutdown();
  console.log('✅ Monitoring example completed\n');
}

/**
 * Example 6: Error handling and circuit breaker demonstration
 */
export async function errorHandlingExample(): Promise<void> {
  console.log('⚡ Error Handling and Circuit Breaker Demo...\n');
  
  // Create config with very low failure threshold for testing
  const testConfig = [{
    name: 'fragile_provider',
    type: 'commercial_a' as const,
    enabled: true,
    priority: 100,
    rate_limit: {
      requests_per_minute: 100,
      burst_limit: 10
    },
    timeout_ms: 1000, // Very short timeout to trigger failures
    circuit_breaker: {
      failure_threshold: 2, // Low threshold for demo
      recovery_timeout_ms: 5000
    }
  }];
  
  const manager = new TaxDataIngestionManager();
  await manager.initialize(testConfig);
  
  // Attempt multiple syncs to trigger circuit breaker
  for (let i = 1; i <= 5; i++) {
    console.log(`Attempt ${i}/5:`);
    try {
      const result = await manager.performSync('fragile_provider', 'on_demand');
      console.log(`  ✅ Success: ${result.stats.jurisdictions_processed} jurisdictions`);
    } catch (error) {
      console.log(`  ❌ Failed: ${(error as Error).message}`);
    }
    
    if (i < 5) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log('\nWaiting for circuit breaker recovery...');
  await new Promise(resolve => setTimeout(resolve, 6000));
  
  console.log('Testing recovery attempt:');
  try {
    const result = await manager.performSync('fragile_provider', 'on_demand');
    console.log(`✅ Recovery successful: ${result.stats.jurisdictions_processed} jurisdictions`);
  } catch (error) {
    console.log(`❌ Recovery failed: ${(error as Error).message}`);
  }
  
  await manager.shutdown();
  console.log('✅ Error handling example completed\n');
}

/**
 * Run all examples
 */
export async function runAllExamples(): Promise<void> {
  console.log('🎯 FANZ Tax Data Connectors - Usage Examples\n');
  console.log('=' .repeat(50) + '\n');
  
  try {
    await basicUsageExample();
    await reconciliationExample();
    await jurisdictionRefreshExample();
    await customProviderExample();
    await monitoringExample();
    await errorHandlingExample();
    
    console.log('🎉 All examples completed successfully!');
    
  } catch (error) {
    console.error('❌ Example execution failed:', error);
    process.exit(1);
  }
}

/**
 * Performance testing example
 */
export async function performanceTestExample(): Promise<void> {
  console.log('🚀 Performance Testing...\n');
  
  const manager = await initializeTaxDataIngestion();
  
  // Test concurrent jurisdiction refreshes
  const jurisdictions = ['juris_us_ca', 'juris_us_ny', 'juris_us_tx'];
  const startTime = Date.now();
  
  console.log(`Testing concurrent refresh of ${jurisdictions.length} jurisdictions...`);
  
  const promises = jurisdictions.map(async (jurisdictionId) => {
    const refreshStart = Date.now();
    try {
      await manager.refreshJurisdiction(jurisdictionId);
      const duration = Date.now() - refreshStart;
      console.log(`  ✅ ${jurisdictionId}: ${duration}ms`);
      return { jurisdictionId, success: true, duration };
    } catch (error) {
      const duration = Date.now() - refreshStart;
      console.log(`  ❌ ${jurisdictionId}: ${duration}ms - ${error}`);
      return { jurisdictionId, success: false, duration };
    }
  });
  
  const results = await Promise.all(promises);
  const totalTime = Date.now() - startTime;
  
  console.log(`\nPerformance Summary:`);
  console.log(`  Total time: ${totalTime}ms`);
  console.log(`  Successful: ${results.filter(r => r.success).length}/${results.length}`);
  console.log(`  Avg duration: ${Math.round(results.reduce((sum, r) => sum + r.duration, 0) / results.length)}ms`);
  
  await manager.shutdown();
  console.log('✅ Performance test completed\n');
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}

/**
 * Database integration example (mock implementation)
 */
export class TaxDataDatabase {
  async persistRates(rates: any[], syncId: string): Promise<void> {
    console.log(`📦 Persisting ${rates.length} rates (sync: ${syncId})`);
    // Mock database operations
    // In real implementation, this would insert/update tax_rate table
  }
  
  async persistRules(rules: any[], syncId: string): Promise<void> {
    console.log(`📦 Persisting ${rules.length} rules (sync: ${syncId})`);
    // Mock database operations
    // In real implementation, this would insert/update tax_rule table
  }
  
  async logSyncResult(result: any): Promise<string> {
    const syncId = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`📝 Logging sync result: ${syncId}`);
    // Mock database operations
    // In real implementation, this would call log_sync_result() function
    return syncId;
  }
  
  async getProviderDiscrepancies(): Promise<any[]> {
    console.log('🔍 Querying provider discrepancies');
    // Mock database query
    // In real implementation, this would query v_unresolved_rate_discrepancies view
    return [];
  }
}