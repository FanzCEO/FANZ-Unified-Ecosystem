/**
 * 🗄️ FANZ Vendor Access Database Adapter
 * 
 * Database adapter for vendor access delegation system,
 * implementing the DatabaseService interface for vendor-specific operations.
 */

import { Pool, PoolClient } from 'pg';
import { injectable, inject } from 'inversify';
import crypto from 'crypto';
import { 
  VendorProfile, 
  AccessGrant, 
  VendorSession, 
  VendorActivity 
} from '../vendor-access/VendorAccessDelegationService';

// ============================================
// 🔧 DATABASE INTERFACE
// ============================================

export interface DatabaseQuery {
  text: string;
  values: any[];
}

@injectable()
export class VendorAccessDatabaseAdapter {
  private pool: Pool;

  constructor(
    @inject('DatabasePool') pool: Pool
  ) {
    this.pool = pool;
  }

  // ============================================
  // 🔗 CONNECTION MANAGEMENT
  // ============================================

  async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // ============================================
  // 👤 VENDOR PROFILE OPERATIONS
  // ============================================

  async insertVendor(vendor: VendorProfile): Promise<VendorProfile> {
    const client = await this.getClient();
    try {
      const query = `
        INSERT INTO vendor_profiles (
          id, email, name, company, vendor_type, contact_info,
          background_check_completed, background_check_date,
          nda_signed, nda_signed_date,
          compliance_training_completed, compliance_training_date,
          status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *
      `;

      const values = [
        vendor.id,
        vendor.email,
        vendor.name,
        vendor.company,
        vendor.vendorType,
        JSON.stringify(vendor.contactInfo),
        vendor.verification.backgroundCheckCompleted,
        vendor.verification.backgroundCheckDate,
        vendor.verification.ndaSigned,
        vendor.verification.ndaSignedDate,
        vendor.verification.complianceTrainingCompleted,
        vendor.verification.complianceTrainingDate,
        vendor.status,
        vendor.createdAt,
        vendor.updatedAt
      ];

      const result = await client.query(query, values);
      return this.mapVendorRow(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async updateVendor(id: string, updates: Partial<VendorProfile>): Promise<void> {
    const client = await this.getClient();
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      // Build dynamic update query
      Object.entries(updates).forEach(([key, value]) => {
        if (key === 'verification' && value) {
          // Handle nested verification object
          Object.entries(value).forEach(([verKey, verValue]) => {
            fields.push(`${this.camelToSnake(verKey)} = $${paramCount++}`);
            values.push(verValue);
          });
        } else if (key === 'contactInfo') {
          fields.push(`contact_info = $${paramCount++}`);
          values.push(JSON.stringify(value));
        } else if (key !== 'id' && key !== 'createdAt') {
          fields.push(`${this.camelToSnake(key)} = $${paramCount++}`);
          values.push(value);
        }
      });

      if (fields.length === 0) return;

      // Always update the updated_at timestamp
      fields.push(`updated_at = $${paramCount++}`);
      values.push(new Date());

      // Add ID for WHERE clause
      values.push(id);

      const query = `
        UPDATE vendor_profiles 
        SET ${fields.join(', ')}
        WHERE id = $${paramCount}
      `;

      await client.query(query, values);
    } finally {
      client.release();
    }
  }

  async findVendorById(id: string): Promise<VendorProfile | null> {
    const client = await this.getClient();
    try {
      const query = 'SELECT * FROM vendor_profiles WHERE id = $1';
      const result = await client.query(query, [id]);
      
      return result.rows.length > 0 ? this.mapVendorRow(result.rows[0]) : null;
    } finally {
      client.release();
    }
  }

  async findVendorByEmail(email: string): Promise<VendorProfile | null> {
    const client = await this.getClient();
    try {
      const query = 'SELECT * FROM vendor_profiles WHERE email = $1';
      const result = await client.query(query, [email]);
      
      return result.rows.length > 0 ? this.mapVendorRow(result.rows[0]) : null;
    } finally {
      client.release();
    }
  }

  async findVendors(filters: any = {}, pagination: { page: number; limit: number }): Promise<{ vendors: VendorProfile[]; total: number }> {
    const client = await this.getClient();
    try {
      let whereClause = 'WHERE 1=1';
      const values: any[] = [];
      let paramCount = 1;

      // Build WHERE clause dynamically
      if (filters.status) {
        whereClause += ` AND status = $${paramCount++}`;
        values.push(filters.status);
      }
      if (filters.vendorType) {
        whereClause += ` AND vendor_type = $${paramCount++}`;
        values.push(filters.vendorType);
      }

      // Count total
      const countQuery = `SELECT COUNT(*) FROM vendor_profiles ${whereClause}`;
      const countResult = await client.query(countQuery, values);
      const total = parseInt(countResult.rows[0].count);

      // Get paginated results
      const offset = (pagination.page - 1) * pagination.limit;
      const dataQuery = `
        SELECT * FROM vendor_profiles ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramCount++} OFFSET $${paramCount++}
      `;
      values.push(pagination.limit, offset);

      const dataResult = await client.query(dataQuery, values);
      const vendors = dataResult.rows.map(row => this.mapVendorRow(row));

      return { vendors, total };
    } finally {
      client.release();
    }
  }

  // ============================================
  // 🎟️ ACCESS GRANT OPERATIONS
  // ============================================

  async insertAccessGrant(grant: AccessGrant): Promise<AccessGrant> {
    const client = await this.getClient();
    try {
      const query = `
        INSERT INTO access_grants (
          id, vendor_id, granted_by, categories, access_level, restrictions,
          start_time, end_time, max_duration_hours, extendable, auto_renew,
          required_approvers, current_approvals, approved, approved_at, approved_by,
          status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING *
      `;

      const values = [
        grant.id,
        grant.vendorId,
        grant.grantedBy,
        grant.categories,
        grant.accessLevel,
        JSON.stringify(grant.restrictions),
        grant.validity.startTime,
        grant.validity.endTime,
        grant.validity.maxDurationHours,
        grant.validity.extendable,
        grant.validity.autoRenew,
        grant.approval.requiredApprovers,
        grant.approval.currentApprovals,
        grant.approval.approved,
        grant.approval.approvedAt,
        grant.approval.approvedBy,
        grant.status,
        grant.createdAt,
        grant.updatedAt
      ];

      const result = await client.query(query, values);
      return this.mapGrantRow(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async updateAccessGrant(id: string, updates: Partial<AccessGrant>): Promise<void> {
    const client = await this.getClient();
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      // Handle nested objects
      Object.entries(updates).forEach(([key, value]) => {
        if (key === 'approval' && value) {
          Object.entries(value).forEach(([approvalKey, approvalValue]) => {
            fields.push(`${this.camelToSnake(approvalKey)} = $${paramCount++}`);
            values.push(approvalValue);
          });
        } else if (key === 'restrictions') {
          fields.push(`restrictions = $${paramCount++}`);
          values.push(JSON.stringify(value));
        } else if (key !== 'id' && key !== 'createdAt') {
          fields.push(`${this.camelToSnake(key)} = $${paramCount++}`);
          values.push(value);
        }
      });

      if (fields.length === 0) return;

      fields.push(`updated_at = $${paramCount++}`);
      values.push(new Date());
      values.push(id);

      const query = `
        UPDATE access_grants 
        SET ${fields.join(', ')}
        WHERE id = $${paramCount}
      `;

      await client.query(query, values);
    } finally {
      client.release();
    }
  }

  async findAccessGrantById(id: string): Promise<AccessGrant | null> {
    const client = await this.getClient();
    try {
      const query = 'SELECT * FROM access_grants WHERE id = $1';
      const result = await client.query(query, [id]);
      
      return result.rows.length > 0 ? this.mapGrantRow(result.rows[0]) : null;
    } finally {
      client.release();
    }
  }

  async updateManyAccessGrants(filter: any, updates: any): Promise<void> {
    const client = await this.getClient();
    try {
      let whereClause = 'WHERE 1=1';
      const values: any[] = [];
      let paramCount = 1;

      // Build WHERE clause
      if (filter.vendorId) {
        whereClause += ` AND vendor_id = $${paramCount++}`;
        values.push(filter.vendorId);
      }
      if (filter.status) {
        if (Array.isArray(filter.status)) {
          whereClause += ` AND status = ANY($${paramCount++})`;
          values.push(filter.status);
        } else {
          whereClause += ` AND status = $${paramCount++}`;
          values.push(filter.status);
        }
      }

      // Build SET clause
      const setFields: string[] = [];
      Object.entries(updates).forEach(([key, value]) => {
        setFields.push(`${this.camelToSnake(key)} = $${paramCount++}`);
        values.push(value);
      });

      if (setFields.length === 0) return;

      const query = `
        UPDATE access_grants 
        SET ${setFields.join(', ')}
        ${whereClause}
      `;

      await client.query(query, values);
    } finally {
      client.release();
    }
  }

  // ============================================
  // 🔑 TOKEN OPERATIONS
  // ============================================

  async insertAccessToken(tokenData: {
    id: string;
    token: string;
    grantId: string;
    vendorId: string;
    createdAt: Date;
    expiresAt: Date;
  }): Promise<void> {
    const client = await this.getClient();
    try {
      const tokenHash = crypto.createHash('sha256').update(tokenData.token).digest('hex');
      
      const query = `
        INSERT INTO vendor_access_tokens (
          id, token_hash, grant_id, vendor_id, issued_at, expires_at, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;

      const values = [
        tokenData.id,
        tokenHash,
        tokenData.grantId,
        tokenData.vendorId,
        tokenData.createdAt,
        tokenData.expiresAt,
        tokenData.createdAt
      ];

      await client.query(query, values);
    } finally {
      client.release();
    }
  }

  async findAccessTokenByHash(token: string): Promise<any | null> {
    const client = await this.getClient();
    try {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const query = 'SELECT * FROM vendor_access_tokens WHERE token_hash = $1';
      const result = await client.query(query, [tokenHash]);
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } finally {
      client.release();
    }
  }

  async updateManyTokens(filter: any, updates: any): Promise<void> {
    const client = await this.getClient();
    try {
      let whereClause = 'WHERE 1=1';
      const values: any[] = [];
      let paramCount = 1;

      if (filter.vendorId) {
        whereClause += ` AND vendor_id = $${paramCount++}`;
        values.push(filter.vendorId);
      }
      if (filter.revoked !== undefined) {
        whereClause += ` AND revoked = $${paramCount++}`;
        values.push(filter.revoked);
      }

      const setFields: string[] = [];
      Object.entries(updates).forEach(([key, value]) => {
        setFields.push(`${this.camelToSnake(key)} = $${paramCount++}`);
        values.push(value);
      });

      if (setFields.length === 0) return;

      const query = `
        UPDATE vendor_access_tokens 
        SET ${setFields.join(', ')}
        ${whereClause}
      `;

      await client.query(query, values);
    } finally {
      client.release();
    }
  }

  // ============================================
  // 📊 SESSION OPERATIONS
  // ============================================

  async insertSession(session: VendorSession): Promise<VendorSession> {
    const client = await this.getClient();
    try {
      const query = `
        INSERT INTO vendor_sessions (
          id, vendor_id, token_id, ip_address, user_agent, 
          start_time, last_activity, total_requests, unique_endpoints, risk_score
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;

      const values = [
        session.id,
        session.vendorId,
        session.tokenId,
        session.ipAddress,
        session.userAgent,
        session.startTime,
        session.lastActivity,
        0, // total_requests
        0, // unique_endpoints  
        0  // risk_score
      ];

      const result = await client.query(query, values);
      return this.mapSessionRow(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async findActiveSession(vendorId: string): Promise<VendorSession | null> {
    const client = await this.getClient();
    try {
      const query = 'SELECT * FROM vendor_sessions WHERE vendor_id = $1 AND end_time IS NULL ORDER BY start_time DESC LIMIT 1';
      const result = await client.query(query, [vendorId]);
      
      return result.rows.length > 0 ? this.mapSessionRow(result.rows[0]) : null;
    } finally {
      client.release();
    }
  }

  async updateSession(id: string, updates: any): Promise<void> {
    const client = await this.getClient();
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      Object.entries(updates).forEach(([key, value]) => {
        fields.push(`${this.camelToSnake(key)} = $${paramCount++}`);
        values.push(value);
      });

      if (fields.length === 0) return;

      values.push(id);

      const query = `
        UPDATE vendor_sessions 
        SET ${fields.join(', ')}
        WHERE id = $${paramCount}
      `;

      await client.query(query, values);
    } finally {
      client.release();
    }
  }

  async updateManySessions(filter: any, updates: any): Promise<void> {
    const client = await this.getClient();
    try {
      let whereClause = 'WHERE 1=1';
      const values: any[] = [];
      let paramCount = 1;

      if (filter.vendorId) {
        whereClause += ` AND vendor_id = $${paramCount++}`;
        values.push(filter.vendorId);
      }
      if (filter.endTime === null) {
        whereClause += ` AND end_time IS NULL`;
      }

      const setFields: string[] = [];
      Object.entries(updates).forEach(([key, value]) => {
        setFields.push(`${this.camelToSnake(key)} = $${paramCount++}`);
        values.push(value);
      });

      if (setFields.length === 0) return;

      const query = `
        UPDATE vendor_sessions 
        SET ${setFields.join(', ')}
        ${whereClause}
      `;

      await client.query(query, values);
    } finally {
      client.release();
    }
  }

  // ============================================
  // 📈 ANALYTICS OPERATIONS
  // ============================================

  async getAnalyticsData(timeRange: { start: Date; end: Date }): Promise<any> {
    const client = await this.getClient();
    try {
      const queries = await Promise.all([
        // Total grants in time range
        client.query(
          'SELECT COUNT(*) FROM access_grants WHERE created_at >= $1 AND created_at <= $2',
          [timeRange.start, timeRange.end]
        ),
        // Active grants
        client.query(
          'SELECT COUNT(*) FROM access_grants WHERE status = $1',
          ['active']
        ),
        // Total vendors
        client.query('SELECT COUNT(*) FROM vendor_profiles'),
        // Active vendors
        client.query(
          'SELECT COUNT(*) FROM vendor_profiles WHERE status = $1',
          ['approved']
        )
      ]);

      return {
        totalGrants: parseInt(queries[0].rows[0].count),
        activeGrants: parseInt(queries[1].rows[0].count),
        totalVendors: parseInt(queries[2].rows[0].count),
        activeVendors: parseInt(queries[3].rows[0].count)
      };
    } finally {
      client.release();
    }
  }

  async countRecords(table: string, filter: any = {}): Promise<number> {
    const client = await this.getClient();
    try {
      let whereClause = 'WHERE 1=1';
      const values: any[] = [];
      let paramCount = 1;

      Object.entries(filter).forEach(([key, value]) => {
        whereClause += ` AND ${this.camelToSnake(key)} = $${paramCount++}`;
        values.push(value);
      });

      const query = `SELECT COUNT(*) FROM ${table} ${whereClause}`;
      const result = await client.query(query, values);
      
      return parseInt(result.rows[0].count);
    } finally {
      client.release();
    }
  }

  // ============================================
  // 📝 AUDIT LOG OPERATIONS
  // ============================================

  async insertAuditLog(logEntry: {
    action: string;
    vendorId?: string;
    grantId?: string;
    sessionId?: string;
    adminUserId?: string;
    ipAddress?: string;
    userAgent?: string;
    endpoint?: string;
    metadata?: any;
    riskScore?: number;
    severity?: string;
    success?: boolean;
    errorMessage?: string;
  }): Promise<void> {
    const client = await this.getClient();
    try {
      const query = `
        INSERT INTO vendor_audit_logs (
          action, vendor_id, grant_id, session_id, admin_user_id,
          ip_address, user_agent, endpoint, metadata, risk_score,
          severity, success, error_message, timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `;

      const values = [
        logEntry.action,
        logEntry.vendorId || null,
        logEntry.grantId || null,
        logEntry.sessionId || null,
        logEntry.adminUserId || null,
        logEntry.ipAddress || null,
        logEntry.userAgent || null,
        logEntry.endpoint || null,
        logEntry.metadata ? JSON.stringify(logEntry.metadata) : null,
        logEntry.riskScore || 0,
        logEntry.severity || 'INFO',
        logEntry.success !== false,
        logEntry.errorMessage || null,
        new Date()
      ];

      await client.query(query, values);
    } finally {
      client.release();
    }
  }

  // ============================================
  // 🔧 HELPER METHODS
  // ============================================

  private mapVendorRow(row: any): VendorProfile {
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      company: row.company,
      vendorType: row.vendor_type,
      contactInfo: JSON.parse(row.contact_info || '{}'),
      verification: {
        backgroundCheckCompleted: row.background_check_completed,
        backgroundCheckDate: row.background_check_date,
        ndaSigned: row.nda_signed,
        ndaSignedDate: row.nda_signed_date,
        complianceTrainingCompleted: row.compliance_training_completed,
        complianceTrainingDate: row.compliance_training_date
      },
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapGrantRow(row: any): AccessGrant {
    return {
      id: row.id,
      vendorId: row.vendor_id,
      grantedBy: row.granted_by,
      categories: row.categories,
      accessLevel: row.access_level,
      restrictions: JSON.parse(row.restrictions || '{}'),
      validity: {
        startTime: row.start_time,
        endTime: row.end_time,
        maxDurationHours: row.max_duration_hours,
        extendable: row.extendable,
        autoRenew: row.auto_renew
      },
      approval: {
        requiredApprovers: row.required_approvers || [],
        currentApprovals: row.current_approvals || [],
        approved: row.approved,
        approvedAt: row.approved_at,
        approvedBy: row.approved_by
      },
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapSessionRow(row: any): VendorSession {
    return {
      id: row.id,
      vendorId: row.vendor_id,
      tokenId: row.token_id,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      startTime: row.start_time,
      lastActivity: row.last_activity,
      endTime: row.end_time,
      activities: [] // Activities would be loaded separately if needed
    };
  }

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}

export default VendorAccessDatabaseAdapter;