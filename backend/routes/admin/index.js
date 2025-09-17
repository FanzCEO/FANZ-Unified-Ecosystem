const express = require('express');
const { Pool } = require('pg');
const { authenticateAdmin, requirePermissions } = require('../../middleware/auth-middleware');

const router = express.Router();

// Import sub-routers
const vendorsRouter = require('./vendors');
const grantsRouter = require('./grants');
const activityRouter = require('./activity');

// Database connection for admin dashboard
const dbConnection = new Pool({
  user: process.env.DB_USER || 'fanz_user',
  host: process.env.DB_HOST || 'localhost', 
  database: process.env.DB_NAME || 'fanz_unified',
  password: process.env.DB_PASSWORD || 'FanzDB_2024_Secure!',
  port: process.env.DB_PORT || 5432,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

// Mount sub-routers
router.use('/vendors', vendorsRouter);
router.use('/grants', grantsRouter);
router.use('/activity', activityRouter);

/**
 * Admin Dashboard Overview
 * GET /api/admin/dashboard
 */
router.get('/dashboard',
  authenticateAdmin,
  requirePermissions(['vendor:view', 'analytics:view']),
  async (req, res) => {
    try {
      // Get comprehensive system statistics
      const dashboardStats = await Promise.all([
        // Vendor statistics
        dbConnection.query(`
          SELECT 
            COUNT(*) as total_vendors,
            COUNT(*) FILTER (WHERE status = 'approved') as approved_vendors,
            COUNT(*) FILTER (WHERE status = 'pending') as pending_vendors,
            COUNT(*) FILTER (WHERE status = 'suspended') as suspended_vendors,
            COUNT(*) FILTER (WHERE status = 'terminated') as terminated_vendors,
            COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as new_this_week,
            COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as new_this_month
          FROM vendor_profiles
        `),

        // Access grants statistics
        dbConnection.query(`
          SELECT 
            COUNT(*) as total_grants,
            COUNT(*) FILTER (WHERE status = 'pending') as pending_grants,
            COUNT(*) FILTER (WHERE status = 'approved') as approved_grants,
            COUNT(*) FILTER (WHERE status = 'active') as active_grants,
            COUNT(*) FILTER (WHERE status = 'expired') as expired_grants,
            COUNT(*) FILTER (WHERE status = 'revoked') as revoked_grants,
            COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as grants_today
          FROM access_grants
        `),

        // Token statistics
        dbConnection.query(`
          SELECT 
            COUNT(*) as total_tokens,
            COUNT(*) FILTER (WHERE expires_at > NOW() AND revoked = false) as valid_tokens,
            COUNT(*) FILTER (WHERE last_used > NOW() - INTERVAL '24 hours') as used_today,
            COUNT(*) FILTER (WHERE revoked = true) as revoked_tokens
          FROM vendor_access_tokens
        `),

        // Admin activity statistics
        dbConnection.query(`
          SELECT 
            COUNT(*) as total_actions,
            COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as actions_today,
            COUNT(DISTINCT admin_id) as active_admins,
            COUNT(*) FILTER (WHERE action LIKE '%create%') as create_actions,
            COUNT(*) FILTER (WHERE action LIKE '%approve%') as approval_actions,
            COUNT(*) FILTER (WHERE action LIKE '%revoke%') as revocation_actions
          FROM admin_audit_log
          WHERE created_at > NOW() - INTERVAL '30 days'
        `)
      ]);

      // Get recent activities
      const recentActivities = await dbConnection.query(`
        SELECT 
          aal.action, aal.resource_type, aal.resource_id, aal.details, aal.created_at,
          au.email as admin_email
        FROM admin_audit_log aal
        JOIN admin_users au ON aal.admin_id = au.id
        ORDER BY aal.created_at DESC
        LIMIT 20
      `);

      // Get pending approvals
      const pendingApprovals = await dbConnection.query(`
        SELECT 
          ag.id, ag.categories, ag.access_level, ag.created_at,
          vp.name as vendor_name, vp.company as vendor_company,
          au.email as requested_by
        FROM access_grants ag
        JOIN vendor_profiles vp ON ag.vendor_id = vp.id
        JOIN admin_users au ON ag.granted_by = au.id
        WHERE ag.status = 'pending'
        ORDER BY ag.created_at ASC
        LIMIT 10
      `);

      // Get system alerts (vendors needing attention)
      const systemAlerts = await Promise.all([
        // Vendors with expired access
        dbConnection.query(`
          SELECT 'expired_access' as alert_type, COUNT(*) as count
          FROM vendor_profiles vp
          WHERE EXISTS (
            SELECT 1 FROM access_grants ag 
            WHERE ag.vendor_id = vp.id AND ag.end_time < NOW() AND ag.status = 'active'
          )
        `),
        
        // Vendors with compliance issues
        dbConnection.query(`
          SELECT 'compliance_issues' as alert_type, COUNT(*) as count
          FROM vendor_profiles
          WHERE status = 'approved' AND (
            background_check_completed = false OR 
            nda_signed = false OR 
            compliance_training_completed = false
          )
        `),

        // High usage vendors (might need attention)
        dbConnection.query(`
          SELECT 'high_usage' as alert_type, COUNT(DISTINCT vendor_id) as count
          FROM vendor_access_tokens
          WHERE last_used > NOW() - INTERVAL '24 hours'
            AND usage_count > 100
        `)
      ]);

      // Prepare response data
      const dashboard = {
        vendor_stats: dashboardStats[0].rows[0],
        grant_stats: dashboardStats[1].rows[0],
        token_stats: dashboardStats[2].rows[0],
        admin_activity: dashboardStats[3].rows[0],
        recent_activities: recentActivities.rows,
        pending_approvals: pendingApprovals.rows,
        system_alerts: systemAlerts.map(alert => alert.rows[0]),
        last_updated: new Date().toISOString()
      };

      res.json({
        success: true,
        dashboard,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Dashboard error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to load dashboard',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * System Health Check (Admin view)
 * GET /api/admin/health
 */
router.get('/health',
  authenticateAdmin,
  requirePermissions(['system:admin']),
  async (req, res) => {
    try {
      // Database health
      const dbHealth = await dbConnection.query('SELECT NOW() as current_time, version() as db_version');
      
      // Table statistics
      const tableStats = await dbConnection.query(`
        SELECT 
          schemaname, tablename, n_tup_ins as inserts, n_tup_upd as updates, 
          n_tup_del as deletes, n_tup_hot_upd as hot_updates, n_live_tup as live_tuples,
          n_dead_tup as dead_tuples, last_vacuum, last_autovacuum, last_analyze
        FROM pg_stat_user_tables
        WHERE tablename IN ('vendor_profiles', 'access_grants', 'vendor_access_tokens', 'admin_users', 'admin_audit_log')
        ORDER BY tablename
      `);

      // Connection statistics
      const connectionStats = await dbConnection.query(`
        SELECT 
          state, COUNT(*) as count
        FROM pg_stat_activity
        WHERE datname = current_database()
        GROUP BY state
      `);

      // Database size
      const dbSize = await dbConnection.query(`
        SELECT 
          pg_database_size(current_database()) as size_bytes,
          pg_size_pretty(pg_database_size(current_database())) as size_human
      `);

      res.json({
        success: true,
        health: {
          status: 'healthy',
          database: {
            connected: true,
            current_time: dbHealth.rows[0].current_time,
            version: dbHealth.rows[0].db_version.split(' ').slice(0, 2).join(' '),
            size: dbSize.rows[0]
          },
          tables: tableStats.rows,
          connections: connectionStats.rows,
          server: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            node_version: process.version,
            environment: process.env.NODE_ENV || 'development'
          }
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Health check error:', error);
      res.status(503).json({
        success: false,
        health: {
          status: 'unhealthy',
          error: error.message
        },
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * Get Admin Activity Log
 * GET /api/admin/audit-log
 */
router.get('/audit-log',
  authenticateAdmin,
  requirePermissions(['audit:view']),
  async (req, res) => {
    try {
      const { 
        limit = 100, 
        offset = 0, 
        admin_id,
        action,
        resource_type,
        start_date,
        end_date,
        sort_by = 'created_at',
        sort_order = 'DESC'
      } = req.query;

      // Build dynamic WHERE clause
      let whereConditions = [];
      let queryParams = [];
      let paramCount = 0;

      if (admin_id) {
        paramCount++;
        whereConditions.push(`aal.admin_id = $${paramCount}`);
        queryParams.push(admin_id);
      }

      if (action) {
        paramCount++;
        whereConditions.push(`aal.action ILIKE $${paramCount}`);
        queryParams.push(`%${action}%`);
      }

      if (resource_type) {
        paramCount++;
        whereConditions.push(`aal.resource_type = $${paramCount}`);
        queryParams.push(resource_type);
      }

      if (start_date) {
        paramCount++;
        whereConditions.push(`aal.created_at >= $${paramCount}`);
        queryParams.push(start_date);
      }

      if (end_date) {
        paramCount++;
        whereConditions.push(`aal.created_at <= $${paramCount}`);
        queryParams.push(end_date);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Validate sort parameters
      const validSortColumns = ['created_at', 'action', 'resource_type', 'admin_id'];
      const validSortOrders = ['ASC', 'DESC'];
      
      const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'created_at';
      const sortOrder = validSortOrders.includes(sort_order.toUpperCase()) ? sort_order.toUpperCase() : 'DESC';

      // Add limit and offset to params
      queryParams.push(parseInt(limit), parseInt(offset));

      const auditQuery = `
        SELECT 
          aal.id, aal.admin_id, aal.action, aal.resource_type, aal.resource_id,
          aal.details, aal.ip_address, aal.user_agent, aal.created_at,
          au.email as admin_email
        FROM admin_audit_log aal
        JOIN admin_users au ON aal.admin_id = au.id
        ${whereClause}
        ORDER BY aal.${sortColumn} ${sortOrder}
        LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}
      `;

      const auditLogs = await dbConnection.query(auditQuery, queryParams);

      // Get total count with same filters
      const countQuery = `
        SELECT COUNT(*) as count 
        FROM admin_audit_log aal
        JOIN admin_users au ON aal.admin_id = au.id
        ${whereClause}
      `;
      const countParams = queryParams.slice(0, -2); // Remove limit and offset
      const total = await dbConnection.query(countQuery, countParams);

      res.json({
        success: true,
        audit_log: auditLogs.rows,
        pagination: {
          total: parseInt(total.rows[0].count),
          limit: parseInt(limit),
          offset: parseInt(offset),
          has_more: (parseInt(offset) + auditLogs.rows.length) < parseInt(total.rows[0].count)
        },
        filters: {
          admin_id,
          action,
          resource_type,
          start_date,
          end_date,
          sort_by: sortColumn,
          sort_order: sortOrder
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Audit log error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch audit log',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * Get System Analytics
 * GET /api/admin/analytics
 */
router.get('/analytics',
  authenticateAdmin,
  requirePermissions(['analytics:view']),
  async (req, res) => {
    try {
      const { period = '30d' } = req.query;
      
      // Define time intervals based on period
      let interval, dateFormat;
      switch (period) {
        case '24h':
          interval = '24 hours';
          dateFormat = 'HH24:00';
          break;
        case '7d':
          interval = '7 days';
          dateFormat = 'YYYY-MM-DD';
          break;
        case '30d':
          interval = '30 days';
          dateFormat = 'YYYY-MM-DD';
          break;
        case '90d':
          interval = '90 days';
          dateFormat = 'YYYY-WW';
          break;
        default:
          interval = '30 days';
          dateFormat = 'YYYY-MM-DD';
      }

      // Get analytics data
      const analytics = await Promise.all([
        // Vendor registration trend
        dbConnection.query(`
          SELECT 
            TO_CHAR(DATE_TRUNC('day', created_at), $1) as date,
            COUNT(*) as new_vendors,
            COUNT(*) FILTER (WHERE status = 'approved') as approved_vendors
          FROM vendor_profiles
          WHERE created_at > NOW() - INTERVAL $2
          GROUP BY DATE_TRUNC('day', created_at)
          ORDER BY DATE_TRUNC('day', created_at)
        `, [dateFormat, interval]),

        // Access grants trend
        dbConnection.query(`
          SELECT 
            TO_CHAR(DATE_TRUNC('day', created_at), $1) as date,
            COUNT(*) as new_grants,
            COUNT(*) FILTER (WHERE approved = true) as approved_grants
          FROM access_grants
          WHERE created_at > NOW() - INTERVAL $2
          GROUP BY DATE_TRUNC('day', created_at)
          ORDER BY DATE_TRUNC('day', created_at)
        `, [dateFormat, interval]),

        // Token usage analytics
        dbConnection.query(`
          SELECT 
            TO_CHAR(DATE_TRUNC('day', last_used), $1) as date,
            COUNT(DISTINCT vendor_id) as active_vendors,
            SUM(usage_count) as total_requests
          FROM vendor_access_tokens
          WHERE last_used > NOW() - INTERVAL $2
          GROUP BY DATE_TRUNC('day', last_used)
          ORDER BY DATE_TRUNC('day', last_used)
        `, [dateFormat, interval]),

        // Top categories
        dbConnection.query(`
          SELECT 
            UNNEST(categories) as category,
            COUNT(*) as grant_count
          FROM access_grants
          WHERE created_at > NOW() - INTERVAL $1
          GROUP BY category
          ORDER BY grant_count DESC
          LIMIT 10
        `, [interval]),

        // Admin activity analytics
        dbConnection.query(`
          SELECT 
            TO_CHAR(DATE_TRUNC('day', created_at), $1) as date,
            COUNT(*) as admin_actions,
            COUNT(DISTINCT admin_id) as active_admins
          FROM admin_audit_log
          WHERE created_at > NOW() - INTERVAL $2
          GROUP BY DATE_TRUNC('day', created_at)
          ORDER BY DATE_TRUNC('day', created_at)
        `, [dateFormat, interval])
      ]);

      res.json({
        success: true,
        analytics: {
          period: period,
          vendor_trends: analytics[0].rows,
          grant_trends: analytics[1].rows,
          usage_trends: analytics[2].rows,
          top_categories: analytics[3].rows,
          admin_activity: analytics[4].rows
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Analytics error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch analytics',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

module.exports = router;