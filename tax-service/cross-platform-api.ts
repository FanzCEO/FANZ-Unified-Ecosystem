/**
 * FANZ Unified Ecosystem - Cross-Platform Tax Integration API Service
 * 
 * Backend service for the cross-platform tax integration monitoring dashboard
 * providing real-time data about platform status, transactions, and sync operations.
 */

import express from 'express';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// ============================================================================
// Database Configuration
// ============================================================================

const pool = new Pool({
  connectionString: process.env.TAX_DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// ============================================================================
// Middleware
// ============================================================================

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(limiter);

// Auth middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'dev-secret', (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    
    // Check if user has dashboard access permission
    if (!user.permissions?.includes('dashboard.view') && !user.roles?.includes('admin')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    req.user = user;
    next();
  });
};

router.use(authenticateToken);

// ============================================================================
// Types and Interfaces
// ============================================================================

interface PlatformStatus {
  platformName: string;
  displayName: string;
  enabled: boolean;
  healthStatus: string;
  lastSync: Date | null;
  transactionsToday: number;
  eventsProcessed: number;
  errors: number;
  taxCoverage: number;
  addressCoverage: number;
}

interface TransactionSummary {
  platform: string;
  totalTransactions: number;
  capturedTransactions: number;
  taxableTransactions: number;
  totalRevenue: number;
  taxCollected: number;
  avgTaxRate: number;
  latestTransaction: Date;
}

interface EventProcessingStatus {
  platform: string;
  eventType: string;
  totalEvents: number;
  processedEvents: number;
  failedEvents: number;
  pendingEvents: number;
  successRate: number;
  avgProcessingTime: number;
}

// ============================================================================
// API Endpoints
// ============================================================================

/**
 * GET /api/cross-platform/status
 * Get overall platform health and sync status
 */
router.get('/status', async (req, res) => {
  try {
    const timeframe = req.query.timeframe || '24h';
    let timeCondition = '';
    
    switch (timeframe) {
      case '1h':
        timeCondition = "AND created_at >= NOW() - INTERVAL '1 hour'";
        break;
      case '7d':
        timeCondition = "AND created_at >= NOW() - INTERVAL '7 days'";
        break;
      case '30d':
        timeCondition = "AND created_at >= NOW() - INTERVAL '30 days'";
        break;
      default:
        timeCondition = "AND created_at >= NOW() - INTERVAL '24 hours'";
    }

    const query = `
      WITH platform_stats AS (
        SELECT 
          p.name as platform_name,
          p.display_name,
          p.enabled,
          p.last_sync_at,
          CASE 
            WHEN NOT p.enabled THEN 'disabled'
            WHEN p.last_sync_at IS NULL THEN 'never_synced'
            WHEN p.last_sync_at < NOW() - INTERVAL '1 hour' THEN 'stale'
            WHEN p.health_status = 'healthy' THEN 'healthy'
            WHEN p.health_status = 'degraded' THEN 'degraded'
            ELSE 'unhealthy'
          END as health_status,
          COALESCE(COUNT(t.id), 0) as transactions_today,
          COALESCE(SUM(CASE WHEN t.status = 'processed' THEN 1 ELSE 0 END), 0) as events_processed,
          COALESCE(SUM(CASE WHEN t.status = 'failed' THEN 1 ELSE 0 END), 0) as errors
        FROM platform_configurations p
        LEFT JOIN normalized_transactions t ON p.name = t.platform_name ${timeCondition}
        GROUP BY p.id, p.name, p.display_name, p.enabled, p.last_sync_at, p.health_status
      ),
      coverage_stats AS (
        SELECT 
          platform_name,
          AVG(CASE WHEN tax_amount IS NOT NULL THEN 100.0 ELSE 0.0 END) as tax_coverage,
          AVG(CASE WHEN billing_address IS NOT NULL THEN 100.0 ELSE 0.0 END) as address_coverage
        FROM normalized_transactions 
        WHERE created_at >= NOW() - INTERVAL '24 hours'
        GROUP BY platform_name
      )
      SELECT 
        ps.*,
        COALESCE(cs.tax_coverage, 0) as tax_coverage,
        COALESCE(cs.address_coverage, 0) as address_coverage
      FROM platform_stats ps
      LEFT JOIN coverage_stats cs ON ps.platform_name = cs.platform_name
      ORDER BY ps.platform_name
    `;

    const result = await pool.query(query);
    
    const platformStatuses: PlatformStatus[] = result.rows.map(row => ({
      platformName: row.platform_name,
      displayName: row.display_name,
      enabled: row.enabled,
      healthStatus: row.health_status,
      lastSync: row.last_sync_at,
      transactionsToday: parseInt(row.transactions_today),
      eventsProcessed: parseInt(row.events_processed),
      errors: parseInt(row.errors),
      taxCoverage: parseFloat(row.tax_coverage),
      addressCoverage: parseFloat(row.address_coverage)
    }));

    res.json({ platformStatuses });
  } catch (error) {
    console.error('Error fetching platform status:', error);
    res.status(500).json({ error: 'Failed to fetch platform status' });
  }
});

/**
 * GET /api/cross-platform/transactions
 * Get transaction summaries by platform
 */
router.get('/transactions', async (req, res) => {
  try {
    const timeframe = req.query.timeframe || '24h';
    let timeCondition = '';
    
    switch (timeframe) {
      case '1h':
        timeCondition = "WHERE t.created_at >= NOW() - INTERVAL '1 hour'";
        break;
      case '7d':
        timeCondition = "WHERE t.created_at >= NOW() - INTERVAL '7 days'";
        break;
      case '30d':
        timeCondition = "WHERE t.created_at >= NOW() - INTERVAL '30 days'";
        break;
      default:
        timeCondition = "WHERE t.created_at >= NOW() - INTERVAL '24 hours'";
    }

    const query = `
      SELECT 
        t.platform_name as platform,
        COUNT(*) as total_transactions,
        COUNT(CASE WHEN t.status = 'captured' THEN 1 END) as captured_transactions,
        COUNT(CASE WHEN t.tax_amount > 0 THEN 1 END) as taxable_transactions,
        COALESCE(SUM(t.amount), 0) as total_revenue,
        COALESCE(SUM(t.tax_amount), 0) as tax_collected,
        CASE WHEN SUM(t.amount) > 0 THEN (SUM(t.tax_amount) / SUM(t.amount) * 100) ELSE 0 END as avg_tax_rate,
        MAX(t.created_at) as latest_transaction
      FROM normalized_transactions t
      ${timeCondition}
      GROUP BY t.platform_name
      ORDER BY total_revenue DESC
    `;

    const result = await pool.query(query);
    
    const transactionSummaries: TransactionSummary[] = result.rows.map(row => ({
      platform: row.platform,
      totalTransactions: parseInt(row.total_transactions),
      capturedTransactions: parseInt(row.captured_transactions),
      taxableTransactions: parseInt(row.taxable_transactions),
      totalRevenue: parseFloat(row.total_revenue),
      taxCollected: parseFloat(row.tax_collected),
      avgTaxRate: parseFloat(row.avg_tax_rate),
      latestTransaction: row.latest_transaction
    }));

    res.json({ transactionSummaries });
  } catch (error) {
    console.error('Error fetching transaction summaries:', error);
    res.status(500).json({ error: 'Failed to fetch transaction summaries' });
  }
});

/**
 * GET /api/cross-platform/events
 * Get event processing status by platform
 */
router.get('/events', async (req, res) => {
  try {
    const timeframe = req.query.timeframe || '24h';
    let timeCondition = '';
    
    switch (timeframe) {
      case '1h':
        timeCondition = "AND e.created_at >= NOW() - INTERVAL '1 hour'";
        break;
      case '7d':
        timeCondition = "AND e.created_at >= NOW() - INTERVAL '7 days'";
        break;
      case '30d':
        timeCondition = "AND e.created_at >= NOW() - INTERVAL '30 days'";
        break;
      default:
        timeCondition = "AND e.created_at >= NOW() - INTERVAL '24 hours'";
    }

    const query = `
      WITH event_stats AS (
        SELECT 
          e.platform_name as platform,
          e.event_type,
          COUNT(*) as total_events,
          COUNT(CASE WHEN e.status = 'processed' THEN 1 END) as processed_events,
          COUNT(CASE WHEN e.status = 'failed' THEN 1 END) as failed_events,
          COUNT(CASE WHEN e.status = 'pending' THEN 1 END) as pending_events,
          AVG(EXTRACT(epoch FROM (e.processed_at - e.created_at))) as avg_processing_time
        FROM tax_event_queue e
        WHERE e.created_at IS NOT NULL ${timeCondition}
        GROUP BY e.platform_name, e.event_type
      )
      SELECT 
        *,
        CASE WHEN total_events > 0 THEN (processed_events::float / total_events * 100) ELSE 100 END as success_rate
      FROM event_stats
      ORDER BY platform, event_type
    `;

    const result = await pool.query(query);
    
    const eventStatuses: EventProcessingStatus[] = result.rows.map(row => ({
      platform: row.platform,
      eventType: row.event_type,
      totalEvents: parseInt(row.total_events),
      processedEvents: parseInt(row.processed_events),
      failedEvents: parseInt(row.failed_events),
      pendingEvents: parseInt(row.pending_events),
      successRate: parseFloat(row.success_rate),
      avgProcessingTime: parseFloat(row.avg_processing_time) || 0
    }));

    res.json({ eventStatuses });
  } catch (error) {
    console.error('Error fetching event processing status:', error);
    res.status(500).json({ error: 'Failed to fetch event processing status' });
  }
});

/**
 * GET /api/cross-platform/syncs
 * Get recent sync operation status
 */
router.get('/syncs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;

    const query = `
      SELECT 
        s.id,
        s.platform_name,
        s.sync_type,
        s.status,
        s.started_at,
        s.completed_at,
        s.transactions_processed,
        s.errors_encountered
      FROM platform_sync_status s
      ORDER BY s.started_at DESC
      LIMIT $1
    `;

    const result = await pool.query(query, [limit]);
    const syncStatuses = result.rows;

    res.json({ syncStatuses });
  } catch (error) {
    console.error('Error fetching sync statuses:', error);
    res.status(500).json({ error: 'Failed to fetch sync statuses' });
  }
});

/**
 * POST /api/cross-platform/sync/:platformName
 * Trigger manual sync for a platform
 */
router.post('/sync/:platformName', async (req, res) => {
  try {
    const { platformName } = req.params;
    const { syncType = 'incremental' } = req.body;
    
    // Check if user has sync permissions
    const user = (req as any).user;
    if (!user.permissions?.includes('platform.sync') && !user.roles?.includes('admin')) {
      return res.status(403).json({ error: 'Insufficient permissions to trigger sync' });
    }

    // Verify platform exists
    const platformCheck = await pool.query(
      'SELECT id FROM platform_configurations WHERE name = $1 AND enabled = true',
      [platformName]
    );

    if (platformCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Platform not found or disabled' });
    }

    // Check if sync is already running
    const runningSyncCheck = await pool.query(
      'SELECT id FROM platform_sync_status WHERE platform_name = $1 AND status = $2',
      [platformName, 'running']
    );

    if (runningSyncCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Sync already running for this platform' });
    }

    // Create sync record
    const syncResult = await pool.query(`
      INSERT INTO platform_sync_status (
        platform_name, 
        sync_type, 
        status, 
        started_at, 
        triggered_by
      ) VALUES ($1, $2, $3, NOW(), $4)
      RETURNING id, started_at
    `, [platformName, syncType, 'running', user.userId]);

    const syncId = syncResult.rows[0].id;

    // In a real implementation, you would queue this for background processing
    // For now, we'll just return the sync ID
    console.log(`Manual sync triggered for platform: ${platformName}, sync ID: ${syncId}`);

    res.json({
      message: 'Sync initiated successfully',
      syncId: syncId,
      platform: platformName,
      syncType: syncType,
      startedAt: syncResult.rows[0].started_at
    });
  } catch (error) {
    console.error('Error triggering manual sync:', error);
    res.status(500).json({ error: 'Failed to trigger sync' });
  }
});

/**
 * GET /api/cross-platform/metrics
 * Get aggregated metrics for dashboard summary
 */
router.get('/metrics', async (req, res) => {
  try {
    const timeframe = req.query.timeframe || '24h';
    let timeCondition = '';
    
    switch (timeframe) {
      case '1h':
        timeCondition = "AND t.created_at >= NOW() - INTERVAL '1 hour'";
        break;
      case '7d':
        timeCondition = "AND t.created_at >= NOW() - INTERVAL '7 days'";
        break;
      case '30d':
        timeCondition = "AND t.created_at >= NOW() - INTERVAL '30 days'";
        break;
      default:
        timeCondition = "AND t.created_at >= NOW() - INTERVAL '24 hours'";
    }

    const metricsQuery = `
      SELECT 
        COUNT(*) as total_transactions,
        COALESCE(SUM(t.amount), 0) as total_revenue,
        COALESCE(SUM(t.tax_amount), 0) as total_tax_collected,
        COUNT(DISTINCT t.platform_name) as active_platforms,
        CASE WHEN SUM(t.amount) > 0 THEN (SUM(t.tax_amount) / SUM(t.amount) * 100) ELSE 0 END as overall_tax_rate
      FROM normalized_transactions t
      WHERE 1=1 ${timeCondition}
    `;

    const healthQuery = `
      SELECT 
        COUNT(*) as total_platforms,
        COUNT(CASE WHEN health_status = 'healthy' THEN 1 END) as healthy_platforms,
        COUNT(CASE WHEN enabled = true THEN 1 END) as enabled_platforms
      FROM platform_configurations
    `;

    const [metricsResult, healthResult] = await Promise.all([
      pool.query(metricsQuery),
      pool.query(healthQuery)
    ]);

    const metrics = {
      ...metricsResult.rows[0],
      ...healthResult.rows[0],
      timeframe
    };

    res.json({ metrics });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

/**
 * GET /api/cross-platform/coverage
 * Get detailed coverage statistics by platform
 */
router.get('/coverage', async (req, res) => {
  try {
    const query = `
      WITH platform_coverage AS (
        SELECT 
          platform_name,
          COUNT(*) as total_transactions,
          COUNT(CASE WHEN tax_amount IS NOT NULL THEN 1 END) as transactions_with_tax,
          COUNT(CASE WHEN billing_address IS NOT NULL THEN 1 END) as transactions_with_address,
          COUNT(CASE WHEN jurisdiction_code IS NOT NULL THEN 1 END) as transactions_with_jurisdiction,
          AVG(CASE WHEN tax_amount IS NOT NULL THEN 100.0 ELSE 0.0 END) as tax_coverage_pct,
          AVG(CASE WHEN billing_address IS NOT NULL THEN 100.0 ELSE 0.0 END) as address_coverage_pct,
          AVG(CASE WHEN jurisdiction_code IS NOT NULL THEN 100.0 ELSE 0.0 END) as jurisdiction_coverage_pct
        FROM normalized_transactions 
        WHERE created_at >= NOW() - INTERVAL '24 hours'
        GROUP BY platform_name
      )
      SELECT 
        pc.*,
        p.display_name
      FROM platform_coverage pc
      JOIN platform_configurations p ON pc.platform_name = p.name
      ORDER BY pc.total_transactions DESC
    `;

    const result = await pool.query(query);
    const coverageStats = result.rows;

    res.json({ coverageStats });
  } catch (error) {
    console.error('Error fetching coverage statistics:', error);
    res.status(500).json({ error: 'Failed to fetch coverage statistics' });
  }
});

// ============================================================================
// Error Handling
// ============================================================================

router.use((error: any, req: any, res: any, next: any) => {
  console.error('Cross-platform API error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

export default router;