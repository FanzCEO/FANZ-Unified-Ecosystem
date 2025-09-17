/**
 * FANZ Unified Ecosystem - Cross-Platform Tax Integration Monitoring Service
 * 
 * Background service that monitors platform health, processes alerts,
 * and maintains sync operations for the tax integration system.
 */

import { Pool } from 'pg';
import cron from 'node-cron';
import { EventEmitter } from 'events';

// ============================================================================
// Configuration and Setup
// ============================================================================

const pool = new Pool({
  connectionString: process.env.TAX_DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

class TaxMonitoringService extends EventEmitter {
  private isRunning = false;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private alertProcessingInterval: NodeJS.Timeout | null = null;
  private syncMonitoringInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.setupEventHandlers();
  }

  // ============================================================================
  // Service Lifecycle
  // ============================================================================

  async start() {
    if (this.isRunning) {
      console.log('Tax monitoring service is already running');
      return;
    }

    console.log('Starting FANZ Tax Integration Monitoring Service...');
    this.isRunning = true;

    try {
      // Test database connection
      await pool.query('SELECT NOW()');
      console.log('Database connection established');

      // Start monitoring intervals
      this.startHealthChecks();
      this.startAlertProcessing();
      this.startSyncMonitoring();

      // Schedule periodic tasks
      this.scheduleCronJobs();

      console.log('Tax monitoring service started successfully');
      this.emit('service_started');
    } catch (error) {
      console.error('Failed to start tax monitoring service:', error);
      this.isRunning = false;
      throw error;
    }
  }

  async stop() {
    if (!this.isRunning) {
      console.log('Tax monitoring service is not running');
      return;
    }

    console.log('Stopping Tax monitoring service...');
    this.isRunning = false;

    // Clear intervals
    if (this.healthCheckInterval) clearInterval(this.healthCheckInterval);
    if (this.alertProcessingInterval) clearInterval(this.alertProcessingInterval);
    if (this.syncMonitoringInterval) clearInterval(this.syncMonitoringInterval);

    // Close database connection
    await pool.end();

    console.log('Tax monitoring service stopped');
    this.emit('service_stopped');
  }

  // ============================================================================
  // Health Monitoring
  // ============================================================================

  private startHealthChecks() {
    // Run health checks every 2 minutes
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.performHealthChecks();
      } catch (error) {
        console.error('Error during health checks:', error);
        this.emit('health_check_failed', error);
      }
    }, 2 * 60 * 1000);

    console.log('Health check monitoring started');
  }

  private async performHealthChecks() {
    const platforms = await this.getActivePlatforms();
    
    for (const platform of platforms) {
      try {
        const health = await this.checkPlatformHealth(platform);
        await this.updatePlatformHealth(platform.name, health);
        
        if (health.status !== 'healthy') {
          this.emit('platform_unhealthy', { platform: platform.name, health });
        }
      } catch (error) {
        console.error(`Health check failed for platform ${platform.name}:`, error);
        await this.updatePlatformHealth(platform.name, {
          status: 'unhealthy',
          lastError: error.message,
          lastCheckedAt: new Date()
        });
      }
    }
  }

  private async getActivePlatforms() {
    const result = await pool.query(`
      SELECT id, name, display_name, api_endpoint, health_check_url, enabled
      FROM platform_configurations 
      WHERE enabled = true
    `);
    
    return result.rows;
  }

  private async checkPlatformHealth(platform: any) {
    // Check recent transaction activity
    const transactionCheck = await pool.query(`
      SELECT 
        COUNT(*) as recent_transactions,
        MAX(created_at) as latest_transaction
      FROM normalized_transactions 
      WHERE platform_name = $1 
        AND created_at >= NOW() - INTERVAL '1 hour'
    `, [platform.name]);

    // Check for errors in event processing
    const errorCheck = await pool.query(`
      SELECT COUNT(*) as error_count
      FROM tax_event_queue 
      WHERE platform_name = $1 
        AND status = 'failed' 
        AND created_at >= NOW() - INTERVAL '1 hour'
    `, [platform.name]);

    // Check sync status
    const syncCheck = await pool.query(`
      SELECT 
        status,
        started_at,
        completed_at,
        errors_encountered
      FROM platform_sync_status 
      WHERE platform_name = $1 
      ORDER BY started_at DESC 
      LIMIT 1
    `, [platform.name]);

    const recentTransactions = parseInt(transactionCheck.rows[0].recent_transactions);
    const errorCount = parseInt(errorCheck.rows[0].error_count);
    const latestSync = syncCheck.rows[0];

    // Determine health status
    let status = 'healthy';
    let issues = [];

    if (errorCount > 10) {
      status = 'degraded';
      issues.push(`High error rate: ${errorCount} errors in the last hour`);
    }

    if (errorCount > 50) {
      status = 'unhealthy';
      issues.push(`Critical error rate: ${errorCount} errors in the last hour`);
    }

    if (latestSync && latestSync.status === 'failed') {
      status = 'degraded';
      issues.push('Last sync operation failed');
    }

    if (!transactionCheck.rows[0].latest_transaction || 
        new Date(transactionCheck.rows[0].latest_transaction) < new Date(Date.now() - 2 * 60 * 60 * 1000)) {
      if (status === 'healthy') status = 'stale';
      issues.push('No recent transaction activity');
    }

    return {
      status,
      issues,
      metrics: {
        recentTransactions,
        errorCount,
        latestTransaction: transactionCheck.rows[0].latest_transaction,
        lastSyncStatus: latestSync?.status
      },
      lastCheckedAt: new Date()
    };
  }

  private async updatePlatformHealth(platformName: string, health: any) {
    await pool.query(`
      UPDATE platform_configurations 
      SET 
        health_status = $1,
        health_details = $2,
        last_health_check = $3
      WHERE name = $4
    `, [
      health.status,
      JSON.stringify({
        issues: health.issues || [],
        metrics: health.metrics || {},
        lastError: health.lastError
      }),
      health.lastCheckedAt,
      platformName
    ]);
  }

  // ============================================================================
  // Alert Processing
  // ============================================================================

  private startAlertProcessing() {
    // Process alerts every 30 seconds
    this.alertProcessingInterval = setInterval(async () => {
      try {
        await this.processAlerts();
      } catch (error) {
        console.error('Error processing alerts:', error);
      }
    }, 30 * 1000);

    console.log('Alert processing started');
  }

  private async processAlerts() {
    // Check for new critical issues
    await this.checkCriticalErrors();
    await this.checkSyncFailures();
    await this.checkCoverageIssues();
    await this.checkPerformanceIssues();
  }

  private async checkCriticalErrors() {
    const result = await pool.query(`
      SELECT 
        platform_name,
        COUNT(*) as error_count,
        array_agg(DISTINCT error_message) as error_messages
      FROM tax_event_queue 
      WHERE status = 'failed' 
        AND created_at >= NOW() - INTERVAL '15 minutes'
        AND created_at > COALESCE((
          SELECT last_processed_at 
          FROM alert_tracking 
          WHERE alert_type = 'critical_errors'
        ), NOW() - INTERVAL '1 hour')
      GROUP BY platform_name
      HAVING COUNT(*) >= 5
    `);

    for (const row of result.rows) {
      await this.createAlert('critical_errors', {
        platform: row.platform_name,
        errorCount: row.error_count,
        errorMessages: row.error_messages,
        severity: 'critical'
      });
    }

    if (result.rows.length > 0) {
      await this.updateAlertTracking('critical_errors', new Date());
    }
  }

  private async checkSyncFailures() {
    const result = await pool.query(`
      SELECT 
        platform_name,
        id,
        started_at,
        errors_encountered,
        error_details
      FROM platform_sync_status 
      WHERE status = 'failed'
        AND started_at > COALESCE((
          SELECT last_processed_at 
          FROM alert_tracking 
          WHERE alert_type = 'sync_failures'
        ), NOW() - INTERVAL '1 hour')
    `);

    for (const row of result.rows) {
      await this.createAlert('sync_failures', {
        platform: row.platform_name,
        syncId: row.id,
        startedAt: row.started_at,
        errorsEncountered: row.errors_encountered,
        errorDetails: row.error_details,
        severity: 'high'
      });
    }

    if (result.rows.length > 0) {
      await this.updateAlertTracking('sync_failures', new Date());
    }
  }

  private async checkCoverageIssues() {
    const result = await pool.query(`
      SELECT 
        platform_name,
        COUNT(*) as total_transactions,
        COUNT(CASE WHEN tax_amount IS NULL THEN 1 END) as missing_tax,
        COUNT(CASE WHEN billing_address IS NULL THEN 1 END) as missing_address
      FROM normalized_transactions 
      WHERE created_at >= NOW() - INTERVAL '1 hour'
      GROUP BY platform_name
      HAVING 
        COUNT(CASE WHEN tax_amount IS NULL THEN 1 END)::float / COUNT(*) > 0.05 OR
        COUNT(CASE WHEN billing_address IS NULL THEN 1 END)::float / COUNT(*) > 0.1
    `);

    for (const row of result.rows) {
      const taxCoverage = ((row.total_transactions - row.missing_tax) / row.total_transactions * 100).toFixed(1);
      const addressCoverage = ((row.total_transactions - row.missing_address) / row.total_transactions * 100).toFixed(1);

      await this.createAlert('coverage_issues', {
        platform: row.platform_name,
        totalTransactions: row.total_transactions,
        taxCoverage: taxCoverage + '%',
        addressCoverage: addressCoverage + '%',
        severity: 'medium'
      });
    }
  }

  private async checkPerformanceIssues() {
    const result = await pool.query(`
      SELECT 
        platform_name,
        COUNT(*) as total_events,
        AVG(EXTRACT(epoch FROM (processed_at - created_at))) as avg_processing_time
      FROM tax_event_queue 
      WHERE status = 'processed'
        AND processed_at >= NOW() - INTERVAL '30 minutes'
        AND created_at >= NOW() - INTERVAL '30 minutes'
      GROUP BY platform_name
      HAVING AVG(EXTRACT(epoch FROM (processed_at - created_at))) > 30
    `);

    for (const row of result.rows) {
      await this.createAlert('performance_issues', {
        platform: row.platform_name,
        totalEvents: row.total_events,
        avgProcessingTime: parseFloat(row.avg_processing_time).toFixed(1) + 's',
        severity: 'medium'
      });
    }
  }

  private async createAlert(alertType: string, details: any) {
    try {
      await pool.query(`
        INSERT INTO tax_alerts (
          alert_type,
          platform_name,
          severity,
          message,
          details,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())
      `, [
        alertType,
        details.platform,
        details.severity,
        this.generateAlertMessage(alertType, details),
        JSON.stringify(details)
      ]);

      console.log(`Alert created: ${alertType} for ${details.platform}`);
      this.emit('alert_created', { type: alertType, details });
    } catch (error) {
      console.error('Failed to create alert:', error);
    }
  }

  private generateAlertMessage(alertType: string, details: any): string {
    switch (alertType) {
      case 'critical_errors':
        return `Critical error rate detected on ${details.platform}: ${details.errorCount} errors in 15 minutes`;
      case 'sync_failures':
        return `Sync operation failed for ${details.platform} with ${details.errorsEncountered} errors`;
      case 'coverage_issues':
        return `Tax coverage issues on ${details.platform}: Tax ${details.taxCoverage}, Address ${details.addressCoverage}`;
      case 'performance_issues':
        return `Performance degradation on ${details.platform}: Average processing time ${details.avgProcessingTime}`;
      default:
        return `Alert: ${alertType} for ${details.platform}`;
    }
  }

  private async updateAlertTracking(alertType: string, processedAt: Date) {
    await pool.query(`
      INSERT INTO alert_tracking (alert_type, last_processed_at)
      VALUES ($1, $2)
      ON CONFLICT (alert_type) 
      DO UPDATE SET last_processed_at = $2
    `, [alertType, processedAt]);
  }

  // ============================================================================
  // Sync Monitoring
  // ============================================================================

  private startSyncMonitoring() {
    // Monitor sync operations every minute
    this.syncMonitoringInterval = setInterval(async () => {
      try {
        await this.monitorSyncOperations();
      } catch (error) {
        console.error('Error monitoring sync operations:', error);
      }
    }, 60 * 1000);

    console.log('Sync monitoring started');
  }

  private async monitorSyncOperations() {
    // Check for long-running syncs
    const longRunningSyncs = await pool.query(`
      SELECT 
        id,
        platform_name,
        sync_type,
        started_at,
        transactions_processed
      FROM platform_sync_status 
      WHERE status = 'running'
        AND started_at < NOW() - INTERVAL '30 minutes'
    `);

    for (const sync of longRunningSyncs.rows) {
      console.warn(`Long-running sync detected: ${sync.platform_name} (${sync.id})`);
      this.emit('long_running_sync', sync);
    }

    // Check for stuck syncs (no progress in 10 minutes)
    const stuckSyncs = await pool.query(`
      SELECT 
        id,
        platform_name,
        sync_type,
        started_at,
        transactions_processed,
        updated_at
      FROM platform_sync_status 
      WHERE status = 'running'
        AND (updated_at < NOW() - INTERVAL '10 minutes' OR updated_at IS NULL)
    `);

    for (const sync of stuckSyncs.rows) {
      console.error(`Stuck sync detected: ${sync.platform_name} (${sync.id})`);
      
      // Mark as failed
      await pool.query(`
        UPDATE platform_sync_status 
        SET 
          status = 'failed',
          completed_at = NOW(),
          error_details = 'Sync appears to be stuck - automatically failed by monitoring service'
        WHERE id = $1
      `, [sync.id]);

      this.emit('stuck_sync_failed', sync);
    }
  }

  // ============================================================================
  // Scheduled Jobs
  // ============================================================================

  private scheduleCronJobs() {
    // Clean up old data daily at 2 AM
    cron.schedule('0 2 * * *', async () => {
      try {
        await this.cleanupOldData();
        console.log('Daily cleanup completed');
      } catch (error) {
        console.error('Daily cleanup failed:', error);
      }
    });

    // Generate coverage reports daily at 6 AM
    cron.schedule('0 6 * * *', async () => {
      try {
        await this.generateCoverageReports();
        console.log('Daily coverage reports generated');
      } catch (error) {
        console.error('Coverage report generation failed:', error);
      }
    });

    console.log('Cron jobs scheduled');
  }

  private async cleanupOldData() {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Clean up old alerts (>30 days)
      await client.query(`
        DELETE FROM tax_alerts 
        WHERE created_at < NOW() - INTERVAL '30 days'
      `);

      // Clean up old sync status records (>90 days)
      await client.query(`
        DELETE FROM platform_sync_status 
        WHERE started_at < NOW() - INTERVAL '90 days'
      `);

      // Clean up old processed events (>7 days)
      await client.query(`
        DELETE FROM tax_event_queue 
        WHERE status = 'processed' 
          AND processed_at < NOW() - INTERVAL '7 days'
      `);

      // Update coverage statistics
      await client.query(`
        INSERT INTO platform_coverage_stats (
          platform_name,
          date,
          total_transactions,
          tax_coverage_pct,
          address_coverage_pct,
          updated_at
        )
        SELECT 
          platform_name,
          CURRENT_DATE - INTERVAL '1 day',
          COUNT(*),
          AVG(CASE WHEN tax_amount IS NOT NULL THEN 100.0 ELSE 0.0 END),
          AVG(CASE WHEN billing_address IS NOT NULL THEN 100.0 ELSE 0.0 END),
          NOW()
        FROM normalized_transactions 
        WHERE DATE(created_at) = CURRENT_DATE - INTERVAL '1 day'
        GROUP BY platform_name
        ON CONFLICT (platform_name, date) DO UPDATE SET
          total_transactions = EXCLUDED.total_transactions,
          tax_coverage_pct = EXCLUDED.tax_coverage_pct,
          address_coverage_pct = EXCLUDED.address_coverage_pct,
          updated_at = EXCLUDED.updated_at
      `);

      await client.query('COMMIT');
      console.log('Old data cleanup completed successfully');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async generateCoverageReports() {
    const platforms = await this.getActivePlatforms();
    
    for (const platform of platforms) {
      try {
        const coverageData = await pool.query(`
          WITH yesterday_data AS (
            SELECT 
              COUNT(*) as total_transactions,
              COUNT(CASE WHEN tax_amount IS NOT NULL THEN 1 END) as taxed_transactions,
              COUNT(CASE WHEN billing_address IS NOT NULL THEN 1 END) as addressed_transactions,
              SUM(amount) as total_revenue,
              SUM(tax_amount) as total_tax_collected
            FROM normalized_transactions 
            WHERE platform_name = $1 
              AND DATE(created_at) = CURRENT_DATE - INTERVAL '1 day'
          )
          SELECT 
            *,
            CASE WHEN total_transactions > 0 THEN (taxed_transactions::float / total_transactions * 100) ELSE 0 END as tax_coverage,
            CASE WHEN total_transactions > 0 THEN (addressed_transactions::float / total_transactions * 100) ELSE 0 END as address_coverage
          FROM yesterday_data
        `, [platform.name]);

        if (coverageData.rows[0].total_transactions > 0) {
          console.log(`Coverage report for ${platform.name}:`, {
            transactions: coverageData.rows[0].total_transactions,
            taxCoverage: parseFloat(coverageData.rows[0].tax_coverage).toFixed(1) + '%',
            addressCoverage: parseFloat(coverageData.rows[0].address_coverage).toFixed(1) + '%'
          });
        }
      } catch (error) {
        console.error(`Failed to generate coverage report for ${platform.name}:`, error);
      }
    }
  }

  // ============================================================================
  // Event Handlers
  // ============================================================================

  private setupEventHandlers() {
    this.on('platform_unhealthy', (data) => {
      console.warn(`Platform ${data.platform} is unhealthy:`, data.health.issues);
    });

    this.on('alert_created', (data) => {
      console.log(`Alert created: ${data.type} for ${data.details.platform}`);
    });

    this.on('long_running_sync', (sync) => {
      console.warn(`Long-running sync: ${sync.platform_name} running for ${Math.round((Date.now() - sync.started_at) / 60000)} minutes`);
    });

    this.on('stuck_sync_failed', (sync) => {
      console.error(`Automatically failed stuck sync for ${sync.platform_name}`);
    });
  }
}

// ============================================================================
// Export and Initialization
// ============================================================================

export const taxMonitoringService = new TaxMonitoringService();

// Start the service if running as main module
if (require.main === module) {
  const service = new TaxMonitoringService();
  
  service.start().catch(error => {
    console.error('Failed to start monitoring service:', error);
    process.exit(1);
  });

  // Handle graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    await service.stop();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully...');
    await service.stop();
    process.exit(0);
  });
}

export default TaxMonitoringService;