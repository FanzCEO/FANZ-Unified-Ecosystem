const { Pool } = require('pg');

// Database configuration
const dbConfig = {
  user: process.env.DB_USER || 'fanz_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'fanz_unified',
  password: process.env.DB_PASSWORD || 'FanzDB_2024_Secure!',
  port: process.env.DB_PORT || 5432,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Create connection pool
const pool = new Pool(dbConfig);

// Pool event handlers
pool.on('connect', () => {
  console.log('✅ Database: New client connected to PostgreSQL');
});

pool.on('error', (err, client) => {
  console.error('❌ Database: Unexpected error on idle client', err);
  process.exit(-1);
});

// Database helper functions
const db = {
  // Test connection
  async testConnection() {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT NOW()');
      client.release();
      console.log('✅ Database: Connection test successful');
      return { connected: true, timestamp: result.rows[0].now };
    } catch (error) {
      console.error('❌ Database: Connection test failed:', error.message);
      return { connected: false, error: error.message };
    }
  },

  // Get all vendor profiles
  async getVendorProfiles(limit = 50, offset = 0) {
    try {
      const client = await pool.connect();
      const query = `
        SELECT 
          id, 
          company_name, 
          contact_email, 
          vendor_type, 
          security_clearance_level,
          status,
          created_at,
          updated_at
        FROM vendor_profiles 
        WHERE status = 'active'
        ORDER BY created_at DESC 
        LIMIT $1 OFFSET $2
      `;
      const result = await client.query(query, [limit, offset]);
      
      // Get total count
      const countQuery = `SELECT COUNT(*) FROM vendor_profiles WHERE status = 'active'`;
      const countResult = await client.query(countQuery);
      
      client.release();
      
      return {
        profiles: result.rows,
        total: parseInt(countResult.rows[0].count),
        page: Math.floor(offset / limit) + 1,
        limit: limit
      };
    } catch (error) {
      console.error('❌ Database: Error fetching vendor profiles:', error.message);
      throw error;
    }
  },

  // Get vendor profile by ID
  async getVendorProfileById(id) {
    try {
      const client = await pool.connect();
      const query = `
        SELECT 
          id, 
          company_name, 
          contact_email, 
          vendor_type, 
          security_clearance_level,
          compliance_certifications,
          status,
          created_at,
          updated_at
        FROM vendor_profiles 
        WHERE id = $1
      `;
      const result = await client.query(query, [id]);
      client.release();
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Database: Error fetching vendor profile:', error.message);
      throw error;
    }
  },

  // Get access grants for a vendor
  async getAccessGrantsForVendor(vendorId, limit = 50, offset = 0) {
    try {
      const client = await pool.connect();
      const query = `
        SELECT 
          ag.id,
          ag.vendor_profile_id,
          ag.category,
          ag.access_level,
          ag.granted_by,
          ag.status,
          ag.created_at,
          ag.expires_at,
          vp.company_name
        FROM access_grants ag
        JOIN vendor_profiles vp ON ag.vendor_profile_id = vp.id
        WHERE ag.vendor_profile_id = $1
        ORDER BY ag.created_at DESC
        LIMIT $2 OFFSET $3
      `;
      const result = await client.query(query, [vendorId, limit, offset]);
      client.release();
      
      return result.rows;
    } catch (error) {
      console.error('❌ Database: Error fetching access grants:', error.message);
      throw error;
    }
  },

  // Get database statistics
  async getDatabaseStats() {
    try {
      const client = await pool.connect();
      
      const queries = [
        'SELECT COUNT(*) as count FROM vendor_profiles',
        'SELECT COUNT(*) as count FROM access_grants', 
        'SELECT COUNT(*) as count FROM vendor_access_tokens',
        'SELECT COUNT(*) as count FROM vendor_profiles WHERE status = \'active\'',
        'SELECT COUNT(*) as count FROM access_grants WHERE status = \'active\''
      ];
      
      const results = await Promise.all(
        queries.map(query => client.query(query))
      );
      
      client.release();
      
      return {
        total_vendors: parseInt(results[0].rows[0].count),
        total_grants: parseInt(results[1].rows[0].count),
        total_tokens: parseInt(results[2].rows[0].count),
        active_vendors: parseInt(results[3].rows[0].count),
        active_grants: parseInt(results[4].rows[0].count)
      };
    } catch (error) {
      console.error('❌ Database: Error fetching database stats:', error.message);
      throw error;
    }
  },

  // Close connection pool
  async close() {
    try {
      await pool.end();
      console.log('✅ Database: Connection pool closed');
    } catch (error) {
      console.error('❌ Database: Error closing connection pool:', error.message);
    }
  }
};

module.exports = db;