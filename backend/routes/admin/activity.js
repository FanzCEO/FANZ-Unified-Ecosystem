const express = require('express');
const { Pool } = require('pg');
const { authenticateAdmin, requirePermissions } = require('../../middleware/auth-middleware');
const VendorActivityTracker = require('../../services/VendorActivityTracker');

const router = express.Router();

// Database connection
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

/**
 * Get All Vendor Activities
 * GET /api/admin/activity/activities
 */
router.get('/activities',
  authenticateAdmin,
  requirePermissions(['vendor:view', 'audit:view']),
  async (req, res) => {
    try {
      const {
        limit = 50,
        offset = 0,
        vendor_id,
        session_id,
        risk_level,
        method,
        start_date,
        end_date,
        sort_by = 'timestamp',
        sort_order = 'DESC'
      } = req.query;

      // Build dynamic WHERE clause
      let whereConditions = [];
      let queryParams = [];
      let paramCount = 0;

      if (vendor_id) {
        paramCount++;
        whereConditions.push(`va.vendor_id = $${paramCount}`);
        queryParams.push(vendor_id);
      }

      if (session_id) {
        paramCount++;
        whereConditions.push(`va.session_id = $${paramCount}`);
        queryParams.push(session_id);
      }

      if (risk_level) {
        paramCount++;
        switch (risk_level) {
          case 'critical':
            whereConditions.push(`va.risk_score >= 80`);
            break;
          case 'high':
            whereConditions.push(`va.risk_score >= 60 AND va.risk_score < 80`);
            break;
          case 'medium':
            whereConditions.push(`va.risk_score >= 40 AND va.risk_score < 60`);
            break;
          case 'low':
            whereConditions.push(`va.risk_score >= 20 AND va.risk_score < 40`);
            break;
          case 'minimal':
            whereConditions.push(`va.risk_score < 20`);
            break;
        }
      }

      if (method) {
        paramCount++;
        whereConditions.push(`va.method = $${paramCount}`);
        queryParams.push(method.toUpperCase());
      }

      if (start_date) {
        paramCount++;
        whereConditions.push(`va.timestamp >= $${paramCount}`);
        queryParams.push(start_date);
      }

      if (end_date) {
        paramCount++;
        whereConditions.push(`va.timestamp <= $${paramCount}`);
        queryParams.push(end_date);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Validate sort parameters
      const validSortColumns = ['timestamp', 'risk_score', 'response_time_ms', 'vendor_id'];
      const validSortOrders = ['ASC', 'DESC'];
      
      const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'timestamp';
      const sortOrder = validSortOrders.includes(sort_order.toUpperCase()) ? sort_order.toUpperCase() : 'DESC';

      // Add limit and offset to params
      queryParams.push(parseInt(limit), parseInt(offset));

      const activitiesQuery = `
        SELECT 
          va.id, va.session_id, va.vendor_id, va.action, va.resource, va.method, 
          va.endpoint, va.request_data, va.response_status, va.response_time_ms, 
          va.risk_score, va.risk_factors, va.ip_address, va.user_agent, va.timestamp,
          vp.name as vendor_name, vp.company as vendor_company,
          vs.start_time as session_start
        FROM vendor_activities va
        JOIN vendor_profiles vp ON va.vendor_id = vp.id
        LEFT JOIN vendor_sessions vs ON va.session_id = vs.id
        ${whereClause}
        ORDER BY va.${sortColumn} ${sortOrder}
        LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}
      `;

      const activities = await dbConnection.query(activitiesQuery, queryParams);

      // Get total count with same filters
      const countQuery = `
        SELECT COUNT(*) as count 
        FROM vendor_activities va
        JOIN vendor_profiles vp ON va.vendor_id = vp.id
        LEFT JOIN vendor_sessions vs ON va.session_id = vs.id
        ${whereClause}
      `;
      const countParams = queryParams.slice(0, -2); // Remove limit and offset
      const total = await dbConnection.query(countQuery, countParams);

      res.json({
        success: true,
        activities: activities.rows,
        pagination: {
          total: parseInt(total.rows[0].count),
          limit: parseInt(limit),
          offset: parseInt(offset),
          has_more: (parseInt(offset) + activities.rows.length) < parseInt(total.rows[0].count)
        },
        filters: {
          vendor_id,
          session_id,
          risk_level,
          method,
          start_date,
          end_date,
          sort_by: sortColumn,
          sort_order: sortOrder
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error fetching activities:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch vendor activities',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * Get Vendor Sessions
 * GET /api/admin/activity/sessions
 */
router.get('/sessions',
  authenticateAdmin,
  requirePermissions(['vendor:view', 'audit:view']),
  async (req, res) => {
    try {
      const {
        limit = 50,
        offset = 0,
        vendor_id,
        active_only = false,
        high_risk_only = false,
        start_date,
        end_date,
        sort_by = 'start_time',
        sort_order = 'DESC'
      } = req.query;

      // Build dynamic WHERE clause
      let whereConditions = [];
      let queryParams = [];
      let paramCount = 0;

      if (vendor_id) {
        paramCount++;
        whereConditions.push(`vs.vendor_id = $${paramCount}`);
        queryParams.push(vendor_id);
      }

      if (active_only === 'true') {
        whereConditions.push(`vs.end_time IS NULL`);
      }

      if (high_risk_only === 'true') {
        whereConditions.push(`vs.risk_score >= 60`);
      }

      if (start_date) {
        paramCount++;
        whereConditions.push(`vs.start_time >= $${paramCount}`);
        queryParams.push(start_date);
      }

      if (end_date) {
        paramCount++;
        whereConditions.push(`vs.start_time <= $${paramCount}`);
        queryParams.push(end_date);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Validate sort parameters
      const validSortColumns = ['start_time', 'end_time', 'total_requests', 'risk_score', 'last_activity'];
      const validSortOrders = ['ASC', 'DESC'];
      
      const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'start_time';
      const sortOrder = validSortOrders.includes(sort_order.toUpperCase()) ? sort_order.toUpperCase() : 'DESC';

      // Add limit and offset to params
      queryParams.push(parseInt(limit), parseInt(offset));

      const sessionsQuery = `
        SELECT 
          vs.id, vs.vendor_id, vs.token_id, vs.ip_address, vs.user_agent,
          vs.start_time, vs.last_activity, vs.end_time, vs.total_requests,
          vs.unique_endpoints, vs.risk_score, vs.created_at,
          vp.name as vendor_name, vp.company as vendor_company,
          COUNT(va.id) as activity_count,
          COUNT(va.id) FILTER (WHERE va.risk_score >= 60) as high_risk_count
        FROM vendor_sessions vs
        JOIN vendor_profiles vp ON vs.vendor_id = vp.id
        LEFT JOIN vendor_activities va ON vs.id = va.session_id
        ${whereClause}
        GROUP BY vs.id, vp.name, vp.company
        ORDER BY vs.${sortColumn} ${sortOrder}
        LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}
      `;

      const sessions = await dbConnection.query(sessionsQuery, queryParams);

      // Get total count with same filters
      const countQuery = `
        SELECT COUNT(DISTINCT vs.id) as count 
        FROM vendor_sessions vs
        JOIN vendor_profiles vp ON vs.vendor_id = vp.id
        ${whereClause}
      `;
      const countParams = queryParams.slice(0, -2); // Remove limit and offset
      const total = await dbConnection.query(countQuery, countParams);

      res.json({
        success: true,
        sessions: sessions.rows,
        pagination: {
          total: parseInt(total.rows[0].count),
          limit: parseInt(limit),
          offset: parseInt(offset),
          has_more: (parseInt(offset) + sessions.rows.length) < parseInt(total.rows[0].count)
        },
        filters: {
          vendor_id,
          active_only,
          high_risk_only,
          start_date,
          end_date,
          sort_by: sortColumn,
          sort_order: sortOrder
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error fetching sessions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch vendor sessions',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * Get Vendor Activity Summary
 * GET /api/admin/activity/summary/:vendor_id
 */
router.get('/summary/:vendor_id',
  authenticateAdmin,
  requirePermissions(['vendor:view', 'audit:view']),
  async (req, res) => {
    try {
      const { vendor_id } = req.params;
      const { days_back = 30 } = req.query;

      // Get vendor info
      const vendorInfo = await dbConnection.query(
        'SELECT id, name, company, email, status FROM vendor_profiles WHERE id = $1',
        [vendor_id]
      );

      if (vendorInfo.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Vendor not found',
          timestamp: new Date().toISOString()
        });
      }

      // Get activity summary using the tracker service
      const activitySummary = await VendorActivityTracker.getVendorActivitySummary(
        vendor_id, 
        parseInt(days_back)
      );

      // Get hourly activity pattern
      const hourlyPattern = await VendorActivityTracker.getHourlyAccessPattern(vendor_id);

      // Get recent high-risk activities
      const highRiskActivities = await dbConnection.query(`
        SELECT 
          id, action, endpoint, risk_score, risk_factors, timestamp
        FROM vendor_activities 
        WHERE vendor_id = $1 AND risk_score >= 60
        ORDER BY timestamp DESC 
        LIMIT 20
      `, [vendor_id]);

      // Get endpoint usage
      const endpointUsage = await dbConnection.query(`
        SELECT 
          endpoint, 
          COUNT(*) as request_count,
          AVG(response_time_ms) as avg_response_time,
          AVG(risk_score) as avg_risk_score
        FROM vendor_activities 
        WHERE vendor_id = $1 
          AND timestamp > NOW() - INTERVAL '${parseInt(days_back)} days'
        GROUP BY endpoint 
        ORDER BY request_count DESC 
        LIMIT 15
      `, [vendor_id]);

      res.json({
        success: true,
        vendor: vendorInfo.rows[0],
        activity_summary: activitySummary,
        hourly_pattern: hourlyPattern,
        high_risk_activities: highRiskActivities.rows,
        endpoint_usage: endpointUsage.rows,
        period_days: parseInt(days_back),
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error fetching activity summary:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch activity summary',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * Get Risk Analytics
 * GET /api/admin/activity/risk-analytics
 */
router.get('/risk-analytics',
  authenticateAdmin,
  requirePermissions(['audit:view', 'analytics:view']),
  async (req, res) => {
    try {
      const { period = '7d' } = req.query;
      
      // Define time intervals
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
        default:
          interval = '7 days';
          dateFormat = 'YYYY-MM-DD';
      }

      // Get risk analytics
      const analytics = await Promise.all([
        // Risk score trends
        dbConnection.query(`
          SELECT 
            TO_CHAR(DATE_TRUNC('day', timestamp), $1) as date,
            AVG(risk_score) as avg_risk_score,
            COUNT(*) FILTER (WHERE risk_score >= 80) as critical_count,
            COUNT(*) FILTER (WHERE risk_score >= 60 AND risk_score < 80) as high_count,
            COUNT(*) FILTER (WHERE risk_score >= 40 AND risk_score < 60) as medium_count,
            COUNT(*) as total_activities
          FROM vendor_activities
          WHERE timestamp > NOW() - INTERVAL $2
          GROUP BY DATE_TRUNC('day', timestamp)
          ORDER BY DATE_TRUNC('day', timestamp)
        `, [dateFormat, interval]),

        // Top risk factors
        dbConnection.query(`
          SELECT 
            UNNEST(risk_factors) as risk_factor,
            COUNT(*) as occurrence_count,
            AVG(risk_score) as avg_risk_score
          FROM vendor_activities
          WHERE timestamp > NOW() - INTERVAL $1
            AND risk_factors IS NOT NULL
          GROUP BY risk_factor
          ORDER BY occurrence_count DESC
          LIMIT 10
        `, [interval]),

        // High-risk vendors
        dbConnection.query(`
          SELECT 
            vp.id, vp.name, vp.company,
            AVG(va.risk_score) as avg_risk_score,
            COUNT(va.id) as activity_count,
            COUNT(va.id) FILTER (WHERE va.risk_score >= 80) as critical_activities
          FROM vendor_profiles vp
          JOIN vendor_activities va ON vp.id = va.vendor_id
          WHERE va.timestamp > NOW() - INTERVAL $1
          GROUP BY vp.id, vp.name, vp.company
          HAVING AVG(va.risk_score) > 30
          ORDER BY avg_risk_score DESC
          LIMIT 10
        `, [interval]),

        // Risk by endpoint
        dbConnection.query(`
          SELECT 
            endpoint,
            COUNT(*) as request_count,
            AVG(risk_score) as avg_risk_score,
            COUNT(*) FILTER (WHERE risk_score >= 60) as high_risk_count
          FROM vendor_activities
          WHERE timestamp > NOW() - INTERVAL $1
          GROUP BY endpoint
          ORDER BY avg_risk_score DESC
          LIMIT 15
        `, [interval])
      ]);

      res.json({
        success: true,
        analytics: {
          period: period,
          risk_trends: analytics[0].rows,
          top_risk_factors: analytics[1].rows,
          high_risk_vendors: analytics[2].rows,
          risk_by_endpoint: analytics[3].rows
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Risk analytics error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch risk analytics',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * End Vendor Session
 * POST /api/admin/activity/sessions/:session_id/end
 */
router.post('/sessions/:session_id/end',
  authenticateAdmin,
  requirePermissions(['vendor:manage']),
  async (req, res) => {
    try {
      const { session_id } = req.params;
      const { reason = 'admin_terminated' } = req.body;

      // Get session info before ending
      const sessionInfo = await dbConnection.query(`
        SELECT vs.*, vp.name, vp.company 
        FROM vendor_sessions vs
        JOIN vendor_profiles vp ON vs.vendor_id = vp.id
        WHERE vs.id = $1
      `, [session_id]);

      if (sessionInfo.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Session not found',
          timestamp: new Date().toISOString()
        });
      }

      const session = sessionInfo.rows[0];

      if (session.end_time) {
        return res.status(400).json({
          success: false,
          error: 'Session already ended',
          message: `Session ended at ${session.end_time}`,
          timestamp: new Date().toISOString()
        });
      }

      // End the session
      const result = await VendorActivityTracker.endSession(session_id, reason);

      if (result.success) {
        // Log admin action
        await logAdminAction(req.admin.id, 'session_terminate', 'vendor_session', session_id, {
          vendor_id: session.vendor_id,
          vendor_name: session.name,
          company: session.company,
          reason: reason
        }, req.ip, req.get('User-Agent'));

        console.log(`🔚 Session terminated by admin ${req.admin.email}: ${session.company} (${session.name})`);

        res.json({
          success: true,
          message: 'Session terminated successfully',
          session: {
            id: session.id,
            vendor_name: session.name,
            company: session.company,
            terminated_by: req.admin.email,
            reason: reason
          },
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to terminate session',
          message: result.error,
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      console.error('Session termination error:', error);
      res.status(500).json({
        success: false,
        error: 'Session termination failed',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * Get Real-time Activity Feed
 * GET /api/admin/activity/live-feed
 */
router.get('/live-feed',
  authenticateAdmin,
  requirePermissions(['audit:view']),
  async (req, res) => {
    try {
      const { minutes_back = 30 } = req.query;

      // Get recent activities
      const recentActivities = await dbConnection.query(`
        SELECT 
          va.id, va.action, va.method, va.endpoint, va.response_status,
          va.risk_score, va.risk_factors, va.timestamp,
          vp.name as vendor_name, vp.company as vendor_company,
          vs.ip_address
        FROM vendor_activities va
        JOIN vendor_profiles vp ON va.vendor_id = vp.id
        JOIN vendor_sessions vs ON va.session_id = vs.id
        WHERE va.timestamp > NOW() - INTERVAL '${parseInt(minutes_back)} minutes'
        ORDER BY va.timestamp DESC
        LIMIT 100
      `);

      // Get active sessions count
      const activeSessions = await dbConnection.query(`
        SELECT COUNT(*) as count
        FROM vendor_sessions
        WHERE end_time IS NULL
      `);

      // Get current risk level
      const currentRisk = await dbConnection.query(`
        SELECT 
          AVG(risk_score) as avg_risk,
          COUNT(*) FILTER (WHERE risk_score >= 60) as high_risk_count
        FROM vendor_activities
        WHERE timestamp > NOW() - INTERVAL '1 hour'
      `);

      res.json({
        success: true,
        live_feed: {
          recent_activities: recentActivities.rows,
          active_sessions_count: parseInt(activeSessions.rows[0].count),
          current_risk_level: parseFloat(currentRisk.rows[0].avg_risk) || 0,
          high_risk_activities_last_hour: parseInt(currentRisk.rows[0].high_risk_count),
          minutes_back: parseInt(minutes_back)
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Live feed error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch live feed',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * Helper function to log admin actions
 */
async function logAdminAction(adminId, action, resourceType, resourceId, details, ipAddress, userAgent) {
  try {
    await dbConnection.query(
      'INSERT INTO admin_audit_log (admin_id, action, resource_type, resource_id, details, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [adminId, action, resourceType, resourceId, JSON.stringify(details), ipAddress, userAgent]
    );
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
}

module.exports = router;