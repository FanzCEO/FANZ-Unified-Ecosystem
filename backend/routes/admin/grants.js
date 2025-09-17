const express = require('express');
const { Pool } = require('pg');
const { authenticateAdmin, requirePermissions } = require('../../middleware/auth-middleware');

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
 * Create New Access Grant
 * POST /api/admin/grants
 */
router.post('/',
  authenticateAdmin,
  requirePermissions(['vendor:manage']),
  async (req, res) => {
    try {
      const {
        vendor_id,
        categories,
        access_level,
        restrictions = {},
        start_time,
        end_time,
        max_duration_hours,
        extendable = false,
        auto_renew = false,
        required_approvers = []
      } = req.body;

      // Validate required fields
      if (!vendor_id || !categories || !access_level || !end_time || !max_duration_hours) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: 'vendor_id, categories, access_level, end_time, and max_duration_hours are required',
          timestamp: new Date().toISOString()
        });
      }

      // Validate vendor exists and is approved
      const vendorCheck = await dbConnection.query(
        'SELECT id, name, company, status FROM vendor_profiles WHERE id = $1',
        [vendor_id]
      );

      if (vendorCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Vendor not found',
          message: 'Specified vendor does not exist',
          timestamp: new Date().toISOString()
        });
      }

      const vendor = vendorCheck.rows[0];
      if (vendor.status !== 'approved') {
        return res.status(400).json({
          success: false,
          error: 'Vendor not approved',
          message: 'Access grants can only be created for approved vendors',
          timestamp: new Date().toISOString()
        });
      }

      // Validate access level
      const validAccessLevels = ['read-only', 'read-write', 'admin', 'emergency'];
      if (!validAccessLevels.includes(access_level)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid access level',
          message: `access_level must be one of: ${validAccessLevels.join(', ')}`,
          timestamp: new Date().toISOString()
        });
      }

      // Validate categories
      const validCategories = [
        'user-management', 'payment-processing', 'content-moderation', 
        'analytics', 'security-monitoring', 'system-admin', 'compliance'
      ];
      
      if (!Array.isArray(categories) || categories.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid categories',
          message: 'categories must be a non-empty array',
          timestamp: new Date().toISOString()
        });
      }

      const invalidCategories = categories.filter(cat => !validCategories.includes(cat));
      if (invalidCategories.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid categories',
          message: `Invalid categories: ${invalidCategories.join(', ')}. Valid categories: ${validCategories.join(', ')}`,
          timestamp: new Date().toISOString()
        });
      }

      // Create access grant
      const createQuery = `
        INSERT INTO access_grants 
        (vendor_id, granted_by, categories, access_level, restrictions, start_time, 
         end_time, max_duration_hours, extendable, auto_renew, required_approvers, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending')
        RETURNING id, vendor_id, categories, access_level, start_time, end_time, 
                  max_duration_hours, extendable, auto_renew, status, created_at
      `;

      const result = await dbConnection.query(createQuery, [
        vendor_id,
        req.admin.id,
        categories,
        access_level,
        JSON.stringify(restrictions),
        start_time || new Date(),
        end_time,
        max_duration_hours,
        extendable,
        auto_renew,
        required_approvers
      ]);

      const newGrant = result.rows[0];

      // Log admin action
      await logAdminAction(req.admin.id, 'grant_create', 'access_grant', newGrant.id, {
        vendor_id: vendor_id,
        vendor_name: vendor.name,
        company: vendor.company,
        categories: categories,
        access_level: access_level,
        duration_hours: max_duration_hours
      }, req.ip, req.get('User-Agent'));

      console.log(`🔑 New access grant created for ${vendor.company} (${vendor.name}) by admin ${req.admin.email}`);

      res.status(201).json({
        success: true,
        message: 'Access grant created successfully',
        grant: {
          ...newGrant,
          vendor: {
            id: vendor.id,
            name: vendor.name,
            company: vendor.company
          }
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Access grant creation error:', error);
      res.status(500).json({
        success: false,
        error: 'Access grant creation failed',
        message: 'Internal server error during grant creation',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * Get All Access Grants
 * GET /api/admin/grants
 */
router.get('/',
  authenticateAdmin,
  requirePermissions(['vendor:view', 'vendor:manage']),
  async (req, res) => {
    try {
      const {
        limit = 50,
        offset = 0,
        status,
        access_level,
        vendor_id,
        category,
        sort_by = 'created_at',
        sort_order = 'DESC'
      } = req.query;

      // Build dynamic WHERE clause
      let whereConditions = [];
      let queryParams = [];
      let paramCount = 0;

      if (status) {
        paramCount++;
        whereConditions.push(`ag.status = $${paramCount}`);
        queryParams.push(status);
      }

      if (access_level) {
        paramCount++;
        whereConditions.push(`ag.access_level = $${paramCount}`);
        queryParams.push(access_level);
      }

      if (vendor_id) {
        paramCount++;
        whereConditions.push(`ag.vendor_id = $${paramCount}`);
        queryParams.push(vendor_id);
      }

      if (category) {
        paramCount++;
        whereConditions.push(`$${paramCount} = ANY(ag.categories)`);
        queryParams.push(category);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Validate sort parameters
      const validSortColumns = ['created_at', 'updated_at', 'start_time', 'end_time', 'status'];
      const validSortOrders = ['ASC', 'DESC'];
      
      const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'created_at';
      const sortOrder = validSortOrders.includes(sort_order.toUpperCase()) ? sort_order.toUpperCase() : 'DESC';

      // Add limit and offset to params
      queryParams.push(parseInt(limit), parseInt(offset));

      const grantsQuery = `
        SELECT ag.id, ag.vendor_id, ag.categories, ag.access_level, ag.restrictions,
               ag.start_time, ag.end_time, ag.max_duration_hours, ag.extendable, 
               ag.auto_renew, ag.approved, ag.approved_at, ag.approved_by, ag.status,
               ag.created_at, ag.updated_at,
               vp.name as vendor_name, vp.company as vendor_company,
               aa.email as approved_by_email
        FROM access_grants ag
        JOIN vendor_profiles vp ON ag.vendor_id = vp.id
        LEFT JOIN admin_users aa ON ag.approved_by = aa.id
        ${whereClause}
        ORDER BY ag.${sortColumn} ${sortOrder}
        LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}
      `;

      const grants = await dbConnection.query(grantsQuery, queryParams);

      // Get total count with same filters
      const countQuery = `
        SELECT COUNT(*) as count 
        FROM access_grants ag
        JOIN vendor_profiles vp ON ag.vendor_id = vp.id
        ${whereClause}
      `;
      const countParams = queryParams.slice(0, -2); // Remove limit and offset
      const total = await dbConnection.query(countQuery, countParams);

      res.json({
        success: true,
        grants: grants.rows,
        pagination: {
          total: parseInt(total.rows[0].count),
          limit: parseInt(limit),
          offset: parseInt(offset),
          has_more: (parseInt(offset) + grants.rows.length) < parseInt(total.rows[0].count)
        },
        filters: {
          status,
          access_level,
          vendor_id,
          category,
          sort_by: sortColumn,
          sort_order: sortOrder
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error fetching access grants:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch access grants',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * Get Access Grant by ID
 * GET /api/admin/grants/:id
 */
router.get('/:id',
  authenticateAdmin,
  requirePermissions(['vendor:view', 'vendor:manage']),
  async (req, res) => {
    try {
      const { id } = req.params;

      const grantQuery = `
        SELECT ag.id, ag.vendor_id, ag.granted_by, ag.categories, ag.access_level,
               ag.restrictions, ag.start_time, ag.end_time, ag.max_duration_hours,
               ag.extendable, ag.auto_renew, ag.required_approvers, ag.current_approvals,
               ag.approved, ag.approved_at, ag.approved_by, ag.status, ag.revoked_at,
               ag.revoked_by, ag.revocation_reason, ag.created_at, ag.updated_at,
               vp.name as vendor_name, vp.company as vendor_company, vp.email as vendor_email,
               gb.email as granted_by_email,
               ab.email as approved_by_email,
               rb.email as revoked_by_email
        FROM access_grants ag
        JOIN vendor_profiles vp ON ag.vendor_id = vp.id
        JOIN admin_users gb ON ag.granted_by = gb.id
        LEFT JOIN admin_users ab ON ag.approved_by = ab.id
        LEFT JOIN admin_users rb ON ag.revoked_by = rb.id
        WHERE ag.id = $1
      `;

      const result = await dbConnection.query(grantQuery, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Access grant not found',
          message: 'Specified access grant does not exist',
          timestamp: new Date().toISOString()
        });
      }

      // Get associated tokens
      const tokensQuery = `
        SELECT id, issued_at, expires_at, last_used, usage_count, revoked, revoked_at
        FROM vendor_access_tokens
        WHERE grant_id = $1
        ORDER BY issued_at DESC
      `;
      const tokens = await dbConnection.query(tokensQuery, [id]);

      const grant = result.rows[0];

      res.json({
        success: true,
        grant: {
          ...grant,
          associated_tokens: tokens.rows
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error fetching access grant:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch access grant',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * Approve Access Grant
 * POST /api/admin/grants/:id/approve
 */
router.post('/:id/approve',
  authenticateAdmin,
  requirePermissions(['vendor:manage']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { approval_comment } = req.body;

      // Check if grant exists and is pending
      const grantCheck = await dbConnection.query(`
        SELECT ag.id, ag.vendor_id, ag.status, ag.approved, 
               vp.name as vendor_name, vp.company as vendor_company
        FROM access_grants ag
        JOIN vendor_profiles vp ON ag.vendor_id = vp.id
        WHERE ag.id = $1
      `, [id]);

      if (grantCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Access grant not found',
          timestamp: new Date().toISOString()
        });
      }

      const grant = grantCheck.rows[0];

      if (grant.approved) {
        return res.status(400).json({
          success: false,
          error: 'Grant already approved',
          message: 'This access grant has already been approved',
          timestamp: new Date().toISOString()
        });
      }

      if (grant.status !== 'pending') {
        return res.status(400).json({
          success: false,
          error: 'Invalid grant status',
          message: `Cannot approve grant with status: ${grant.status}`,
          timestamp: new Date().toISOString()
        });
      }

      // Approve the grant
      const approveQuery = `
        UPDATE access_grants 
        SET approved = true, approved_at = NOW(), approved_by = $1, 
            status = 'approved', updated_at = NOW()
        WHERE id = $2
        RETURNING id, status, approved_at
      `;

      const result = await dbConnection.query(approveQuery, [req.admin.id, id]);
      const approvedGrant = result.rows[0];

      // Log admin action
      await logAdminAction(req.admin.id, 'grant_approve', 'access_grant', id, {
        vendor_id: grant.vendor_id,
        vendor_name: grant.vendor_name,
        company: grant.vendor_company,
        approval_comment: approval_comment
      }, req.ip, req.get('User-Agent'));

      console.log(`✅ Access grant approved for ${grant.vendor_company} by admin ${req.admin.email}`);

      res.json({
        success: true,
        message: 'Access grant approved successfully',
        grant: {
          id: approvedGrant.id,
          status: approvedGrant.status,
          approved_at: approvedGrant.approved_at,
          approved_by: req.admin.email
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Grant approval error:', error);
      res.status(500).json({
        success: false,
        error: 'Grant approval failed',
        message: 'Internal server error during grant approval',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * Revoke Access Grant
 * POST /api/admin/grants/:id/revoke
 */
router.post('/:id/revoke',
  authenticateAdmin,
  requirePermissions(['vendor:manage']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { revocation_reason } = req.body;

      if (!revocation_reason) {
        return res.status(400).json({
          success: false,
          error: 'Revocation reason required',
          message: 'A reason must be provided for revoking access',
          timestamp: new Date().toISOString()
        });
      }

      // Check if grant exists
      const grantCheck = await dbConnection.query(`
        SELECT ag.id, ag.vendor_id, ag.status, 
               vp.name as vendor_name, vp.company as vendor_company
        FROM access_grants ag
        JOIN vendor_profiles vp ON ag.vendor_id = vp.id
        WHERE ag.id = $1
      `, [id]);

      if (grantCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Access grant not found',
          timestamp: new Date().toISOString()
        });
      }

      const grant = grantCheck.rows[0];

      if (grant.status === 'revoked') {
        return res.status(400).json({
          success: false,
          error: 'Grant already revoked',
          message: 'This access grant has already been revoked',
          timestamp: new Date().toISOString()
        });
      }

      // Revoke the grant
      const revokeQuery = `
        UPDATE access_grants 
        SET status = 'revoked', revoked_at = NOW(), revoked_by = $1, 
            revocation_reason = $2, updated_at = NOW()
        WHERE id = $3
        RETURNING id, status, revoked_at
      `;

      const result = await dbConnection.query(revokeQuery, [req.admin.id, revocation_reason, id]);
      const revokedGrant = result.rows[0];

      // Also revoke any active tokens for this grant
      await dbConnection.query(`
        UPDATE vendor_access_tokens 
        SET revoked = true, revoked_at = NOW(), revoked_by = $1, 
            revocation_reason = 'Access grant revoked'
        WHERE grant_id = $2 AND revoked = false
      `, [req.admin.id, id]);

      // Log admin action
      await logAdminAction(req.admin.id, 'grant_revoke', 'access_grant', id, {
        vendor_id: grant.vendor_id,
        vendor_name: grant.vendor_name,
        company: grant.vendor_company,
        revocation_reason: revocation_reason
      }, req.ip, req.get('User-Agent'));

      console.log(`❌ Access grant revoked for ${grant.vendor_company} by admin ${req.admin.email}: ${revocation_reason}`);

      res.json({
        success: true,
        message: 'Access grant revoked successfully',
        grant: {
          id: revokedGrant.id,
          status: revokedGrant.status,
          revoked_at: revokedGrant.revoked_at,
          revoked_by: req.admin.email,
          revocation_reason: revocation_reason
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Grant revocation error:', error);
      res.status(500).json({
        success: false,
        error: 'Grant revocation failed',
        message: 'Internal server error during grant revocation',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * Extend Access Grant
 * POST /api/admin/grants/:id/extend
 */
router.post('/:id/extend',
  authenticateAdmin,
  requirePermissions(['vendor:manage']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { new_end_time, extension_reason, additional_hours } = req.body;

      if (!new_end_time && !additional_hours) {
        return res.status(400).json({
          success: false,
          error: 'Extension details required',
          message: 'Either new_end_time or additional_hours must be provided',
          timestamp: new Date().toISOString()
        });
      }

      // Check if grant exists and is extendable
      const grantCheck = await dbConnection.query(`
        SELECT ag.id, ag.vendor_id, ag.status, ag.extendable, ag.end_time,
               vp.name as vendor_name, vp.company as vendor_company
        FROM access_grants ag
        JOIN vendor_profiles vp ON ag.vendor_id = vp.id
        WHERE ag.id = $1
      `, [id]);

      if (grantCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Access grant not found',
          timestamp: new Date().toISOString()
        });
      }

      const grant = grantCheck.rows[0];

      if (!grant.extendable) {
        return res.status(400).json({
          success: false,
          error: 'Grant not extendable',
          message: 'This access grant is not configured to be extendable',
          timestamp: new Date().toISOString()
        });
      }

      if (grant.status !== 'approved' && grant.status !== 'active') {
        return res.status(400).json({
          success: false,
          error: 'Invalid grant status',
          message: `Cannot extend grant with status: ${grant.status}`,
          timestamp: new Date().toISOString()
        });
      }

      // Calculate new end time
      let finalEndTime = new_end_time;
      if (additional_hours) {
        const currentEndTime = new Date(grant.end_time);
        finalEndTime = new Date(currentEndTime.getTime() + (additional_hours * 60 * 60 * 1000));
      }

      // Extend the grant
      const extendQuery = `
        UPDATE access_grants 
        SET end_time = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING id, end_time, updated_at
      `;

      const result = await dbConnection.query(extendQuery, [finalEndTime, id]);
      const extendedGrant = result.rows[0];

      // Log admin action
      await logAdminAction(req.admin.id, 'grant_extend', 'access_grant', id, {
        vendor_id: grant.vendor_id,
        vendor_name: grant.vendor_name,
        company: grant.vendor_company,
        old_end_time: grant.end_time,
        new_end_time: finalEndTime,
        extension_reason: extension_reason,
        additional_hours: additional_hours
      }, req.ip, req.get('User-Agent'));

      console.log(`⏰ Access grant extended for ${grant.vendor_company} by admin ${req.admin.email}`);

      res.json({
        success: true,
        message: 'Access grant extended successfully',
        grant: {
          id: extendedGrant.id,
          old_end_time: grant.end_time,
          new_end_time: extendedGrant.end_time,
          extended_by: req.admin.email,
          extension_reason: extension_reason
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Grant extension error:', error);
      res.status(500).json({
        success: false,
        error: 'Grant extension failed',
        message: 'Internal server error during grant extension',
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