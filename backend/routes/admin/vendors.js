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
 * Create New Vendor Profile
 * POST /api/admin/vendors
 */
router.post('/', 
  authenticateAdmin,
  requirePermissions(['vendor:manage']),
  async (req, res) => {
    try {
      const {
        name,
        company,
        email,
        vendor_type,
        contact_info = {},
        background_check_completed = false,
        nda_signed = false,
        compliance_training_completed = false,
        status = 'pending'
      } = req.body;

      // Validate required fields
      if (!name || !company || !email || !vendor_type) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: 'name, company, email, and vendor_type are required',
          timestamp: new Date().toISOString()
        });
      }

      // Validate vendor_type
      const validTypes = ['contractor', 'consultant', 'support-staff', 'auditor', 'maintenance', 'security-analyst', 'compliance-officer', 'payment-specialist'];
      if (!validTypes.includes(vendor_type)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid vendor type',
          message: `vendor_type must be one of: ${validTypes.join(', ')}`,
          timestamp: new Date().toISOString()
        });
      }

      // Check if email already exists
      const existingVendor = await dbConnection.query(
        'SELECT id FROM vendor_profiles WHERE email = $1',
        [email]
      );

      if (existingVendor.rows.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'Vendor already exists',
          message: 'A vendor with this email already exists',
          timestamp: new Date().toISOString()
        });
      }

      // Create vendor profile
      const createQuery = `
        INSERT INTO vendor_profiles 
        (name, company, email, vendor_type, contact_info, background_check_completed, 
         nda_signed, compliance_training_completed, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, name, company, email, vendor_type, contact_info, status, created_at
      `;

      const result = await dbConnection.query(createQuery, [
        name, company, email, vendor_type, JSON.stringify(contact_info),
        background_check_completed, nda_signed, compliance_training_completed, status
      ]);

      const newVendor = result.rows[0];

      // Log admin action
      await logAdminAction(req.admin.id, 'vendor_create', 'vendor_profile', newVendor.id, {
        vendor_name: name,
        company: company,
        email: email,
        status: status
      }, req.ip, req.get('User-Agent'));

      console.log(`👤 New vendor created: ${company} (${name}) by admin ${req.admin.email}`);

      res.status(201).json({
        success: true,
        message: 'Vendor profile created successfully',
        vendor: newVendor,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Vendor creation error:', error);
      res.status(500).json({
        success: false,
        error: 'Vendor creation failed',
        message: 'Internal server error during vendor creation',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * Get All Vendor Profiles (Admin view with all statuses)
 * GET /api/admin/vendors
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
        vendor_type,
        search,
        sort_by = 'created_at',
        sort_order = 'DESC'
      } = req.query;

      // Build dynamic WHERE clause
      let whereConditions = [];
      let queryParams = [];
      let paramCount = 0;

      if (status) {
        paramCount++;
        whereConditions.push(`status = $${paramCount}`);
        queryParams.push(status);
      }

      if (vendor_type) {
        paramCount++;
        whereConditions.push(`vendor_type = $${paramCount}`);
        queryParams.push(vendor_type);
      }

      if (search) {
        paramCount++;
        whereConditions.push(`(name ILIKE $${paramCount} OR company ILIKE $${paramCount} OR email ILIKE $${paramCount})`);
        queryParams.push(`%${search}%`);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Validate sort parameters
      const validSortColumns = ['created_at', 'updated_at', 'name', 'company', 'status'];
      const validSortOrders = ['ASC', 'DESC'];
      
      const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'created_at';
      const sortOrder = validSortOrders.includes(sort_order.toUpperCase()) ? sort_order.toUpperCase() : 'DESC';

      // Add limit and offset to params
      queryParams.push(parseInt(limit), parseInt(offset));
      
      const vendorsQuery = `
        SELECT id, name, company, email, vendor_type, contact_info, 
               background_check_completed, nda_signed, compliance_training_completed,
               status, created_at, updated_at
        FROM vendor_profiles
        ${whereClause}
        ORDER BY ${sortColumn} ${sortOrder}
        LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}
      `;

      const vendors = await dbConnection.query(vendorsQuery, queryParams);

      // Get total count with same filters
      const countQuery = `
        SELECT COUNT(*) as count 
        FROM vendor_profiles 
        ${whereClause}
      `;
      const countParams = queryParams.slice(0, -2); // Remove limit and offset
      const total = await dbConnection.query(countQuery, countParams);

      res.json({
        success: true,
        vendors: vendors.rows,
        pagination: {
          total: parseInt(total.rows[0].count),
          limit: parseInt(limit),
          offset: parseInt(offset),
          has_more: (parseInt(offset) + vendors.rows.length) < parseInt(total.rows[0].count)
        },
        filters: {
          status,
          vendor_type,
          search,
          sort_by: sortColumn,
          sort_order: sortOrder
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error fetching vendors:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch vendor profiles',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * Get Vendor Profile by ID (Admin view)
 * GET /api/admin/vendors/:id
 */
router.get('/:id',
  authenticateAdmin,
  requirePermissions(['vendor:view', 'vendor:manage']),
  async (req, res) => {
    try {
      const { id } = req.params;

      const vendorQuery = `
        SELECT vp.id, vp.name, vp.company, vp.email, vp.vendor_type, vp.contact_info,
               vp.background_check_completed, vp.background_check_date,
               vp.nda_signed, vp.nda_signed_date,
               vp.compliance_training_completed, vp.compliance_training_date,
               vp.status, vp.created_at, vp.updated_at,
               COUNT(ag.id) as total_grants,
               COUNT(ag.id) FILTER (WHERE ag.status = 'active') as active_grants,
               COUNT(vat.id) as total_tokens,
               COUNT(vat.id) FILTER (WHERE vat.expires_at > NOW() AND vat.revoked = false) as valid_tokens
        FROM vendor_profiles vp
        LEFT JOIN access_grants ag ON vp.id = ag.vendor_id
        LEFT JOIN vendor_access_tokens vat ON vp.id = vat.vendor_id
        WHERE vp.id = $1
        GROUP BY vp.id
      `;

      const result = await dbConnection.query(vendorQuery, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Vendor not found',
          message: 'Vendor profile not found',
          timestamp: new Date().toISOString()
        });
      }

      // Get recent access grants
      const grantsQuery = `
        SELECT id, categories, access_level, status, approved, 
               start_time, end_time, created_at
        FROM access_grants
        WHERE vendor_id = $1
        ORDER BY created_at DESC
        LIMIT 10
      `;
      const grants = await dbConnection.query(grantsQuery, [id]);

      // Get recent activity
      const activityQuery = `
        SELECT action, details, created_at
        FROM vendor_activities
        WHERE vendor_id = $1
        ORDER BY created_at DESC
        LIMIT 10
      `;
      const activities = await dbConnection.query(activityQuery, [id]);

      const vendor = result.rows[0];

      res.json({
        success: true,
        vendor: {
          ...vendor,
          recent_grants: grants.rows,
          recent_activities: activities.rows
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error fetching vendor:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch vendor profile',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * Update Vendor Profile
 * PUT /api/admin/vendors/:id
 */
router.put('/:id',
  authenticateAdmin,
  requirePermissions(['vendor:manage']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const {
        name,
        company,
        email,
        vendor_type,
        contact_info,
        background_check_completed,
        background_check_date,
        nda_signed,
        nda_signed_date,
        compliance_training_completed,
        compliance_training_date,
        status
      } = req.body;

      // Check if vendor exists
      const existingVendor = await dbConnection.query(
        'SELECT id, name, company, status FROM vendor_profiles WHERE id = $1',
        [id]
      );

      if (existingVendor.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Vendor not found',
          message: 'Vendor profile not found',
          timestamp: new Date().toISOString()
        });
      }

      const oldVendor = existingVendor.rows[0];

      // Build dynamic update query
      let updateFields = [];
      let queryParams = [];
      let paramCount = 0;

      if (name !== undefined) {
        paramCount++;
        updateFields.push(`name = $${paramCount}`);
        queryParams.push(name);
      }

      if (company !== undefined) {
        paramCount++;
        updateFields.push(`company = $${paramCount}`);
        queryParams.push(company);
      }

      if (email !== undefined) {
        paramCount++;
        updateFields.push(`email = $${paramCount}`);
        queryParams.push(email);
      }

      if (vendor_type !== undefined) {
        paramCount++;
        updateFields.push(`vendor_type = $${paramCount}`);
        queryParams.push(vendor_type);
      }

      if (contact_info !== undefined) {
        paramCount++;
        updateFields.push(`contact_info = $${paramCount}`);
        queryParams.push(JSON.stringify(contact_info));
      }

      if (background_check_completed !== undefined) {
        paramCount++;
        updateFields.push(`background_check_completed = $${paramCount}`);
        queryParams.push(background_check_completed);
      }

      if (background_check_date !== undefined) {
        paramCount++;
        updateFields.push(`background_check_date = $${paramCount}`);
        queryParams.push(background_check_date);
      }

      if (nda_signed !== undefined) {
        paramCount++;
        updateFields.push(`nda_signed = $${paramCount}`);
        queryParams.push(nda_signed);
      }

      if (nda_signed_date !== undefined) {
        paramCount++;
        updateFields.push(`nda_signed_date = $${paramCount}`);
        queryParams.push(nda_signed_date);
      }

      if (compliance_training_completed !== undefined) {
        paramCount++;
        updateFields.push(`compliance_training_completed = $${paramCount}`);
        queryParams.push(compliance_training_completed);
      }

      if (compliance_training_date !== undefined) {
        paramCount++;
        updateFields.push(`compliance_training_date = $${paramCount}`);
        queryParams.push(compliance_training_date);
      }

      if (status !== undefined) {
        paramCount++;
        updateFields.push(`status = $${paramCount}`);
        queryParams.push(status);
      }

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No fields to update',
          message: 'At least one field must be provided for update',
          timestamp: new Date().toISOString()
        });
      }

      // Add updated_at and id
      paramCount++;
      updateFields.push(`updated_at = NOW()`);
      queryParams.push(id);

      const updateQuery = `
        UPDATE vendor_profiles 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING id, name, company, email, vendor_type, contact_info, status, updated_at
      `;

      const result = await dbConnection.query(updateQuery, queryParams);
      const updatedVendor = result.rows[0];

      // Log admin action
      await logAdminAction(req.admin.id, 'vendor_update', 'vendor_profile', id, {
        old_status: oldVendor.status,
        new_status: status,
        changes: Object.keys(req.body)
      }, req.ip, req.get('User-Agent'));

      console.log(`✏️ Vendor updated: ${updatedVendor.company} by admin ${req.admin.email}`);

      res.json({
        success: true,
        message: 'Vendor profile updated successfully',
        vendor: updatedVendor,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Vendor update error:', error);
      res.status(500).json({
        success: false,
        error: 'Vendor update failed',
        message: 'Internal server error during vendor update',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * Delete Vendor Profile
 * DELETE /api/admin/vendors/:id
 */
router.delete('/:id',
  authenticateAdmin,
  requirePermissions(['vendor:manage']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      // Check if vendor exists
      const existingVendor = await dbConnection.query(
        'SELECT id, name, company, status FROM vendor_profiles WHERE id = $1',
        [id]
      );

      if (existingVendor.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Vendor not found',
          message: 'Vendor profile not found',
          timestamp: new Date().toISOString()
        });
      }

      const vendor = existingVendor.rows[0];

      // Check for active grants or tokens
      const activeItems = await dbConnection.query(`
        SELECT 
          (SELECT COUNT(*) FROM access_grants WHERE vendor_id = $1 AND status = 'active') as active_grants,
          (SELECT COUNT(*) FROM vendor_access_tokens WHERE vendor_id = $1 AND expires_at > NOW() AND revoked = false) as valid_tokens
      `, [id]);

      const { active_grants, valid_tokens } = activeItems.rows[0];

      if (parseInt(active_grants) > 0 || parseInt(valid_tokens) > 0) {
        return res.status(409).json({
          success: false,
          error: 'Cannot delete vendor with active access',
          message: `Vendor has ${active_grants} active grants and ${valid_tokens} valid tokens. Revoke access first.`,
          timestamp: new Date().toISOString()
        });
      }

      // Soft delete by updating status
      await dbConnection.query(
        'UPDATE vendor_profiles SET status = $1, updated_at = NOW() WHERE id = $2',
        ['terminated', id]
      );

      // Log admin action
      await logAdminAction(req.admin.id, 'vendor_delete', 'vendor_profile', id, {
        vendor_name: vendor.name,
        company: vendor.company,
        reason: reason || 'No reason provided'
      }, req.ip, req.get('User-Agent'));

      console.log(`🗑️ Vendor deleted: ${vendor.company} (${vendor.name}) by admin ${req.admin.email}`);

      res.json({
        success: true,
        message: 'Vendor profile deleted successfully',
        vendor: {
          id: vendor.id,
          name: vendor.name,
          company: vendor.company,
          status: 'terminated'
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Vendor deletion error:', error);
      res.status(500).json({
        success: false,
        error: 'Vendor deletion failed',
        message: 'Internal server error during vendor deletion',
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