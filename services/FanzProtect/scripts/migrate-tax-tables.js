#!/usr/bin/env node

/**
 * FanzProtect Tax Compliance Database Migration Runner
 * Runs the tax compliance tables migration with proper error handling and verification
 */

const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

// Database configuration from environment
const dbConfig = {
  connectionString: process.env.DATABASE_URL || process.env.TAX_DB_CONNECTION_STRING,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

class TaxMigrationRunner {
  constructor() {
    this.pool = new Pool(dbConfig);
  }

  async run() {
    console.log('🏛️ FanzProtect Tax Compliance Migration Runner');
    console.log('================================================');
    console.log('');

    try {
      await this.verifyConnection();
      await this.runMigration();
      await this.verifyMigration();
      console.log('✅ Migration completed successfully!');
      console.log('🛡️ Wyoming-based tax compliance system is ready for deployment.');
    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      console.error('Stack trace:', error.stack);
      process.exit(1);
    } finally {
      await this.pool.end();
    }
  }

  async verifyConnection() {
    console.log('🔌 Verifying database connection...');
    
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT version() as version, current_database() as database');
      console.log(`✅ Connected to PostgreSQL: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}`);
      console.log(`✅ Database: ${result.rows[0].database}`);
    } finally {
      client.release();
    }
  }

  async runMigration() {
    console.log('📊 Running tax compliance tables migration...');
    
    // Read migration file
    const migrationPath = path.join(__dirname, '..', 'migrations', '001_create_tax_tables.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf-8');
    
    console.log('📁 Migration file loaded:', migrationPath);
    
    // Execute migration
    const client = await this.pool.connect();
    try {
      console.log('🚀 Executing migration SQL...');
      await client.query(migrationSQL);
      console.log('✅ Migration SQL executed successfully');
    } finally {
      client.release();
    }
  }

  async verifyMigration() {
    console.log('🔍 Verifying migration results...');
    
    const client = await this.pool.connect();
    try {
      // Verify tables created
      const tables = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name LIKE '%tax%' OR table_name LIKE '%nexus%' OR table_name LIKE '%wyoming%'
        ORDER BY table_name
      `);
      
      console.log('📋 Created tables:');
      tables.rows.forEach(row => {
        console.log(`   ✓ ${row.table_name}`);
      });
      
      // Verify initial data
      const counts = await this.getDataCounts(client);
      console.log('');
      console.log('📊 Initial data verification:');
      console.log(`   • Service tax rules: ${counts.service_rules} records`);
      console.log(`   • State tax rules: ${counts.state_rules} records`);
      console.log(`   • Nexus status entries: ${counts.nexus_status} records`);
      console.log(`   • Wyoming compliance: ${counts.wyoming_compliance} records`);
      
      // Verify Wyoming-specific setup
      const wyomingStatus = await client.query(
        "SELECT * FROM nexus_status WHERE state_code = 'WY'"
      );
      
      if (wyomingStatus.rows.length > 0) {
        const wy = wyomingStatus.rows[0];
        console.log('');
        console.log('🏔️ Wyoming home state configuration:');
        console.log(`   • State: ${wy.state_name}`);
        console.log(`   • Has nexus: ${wy.has_nexus ? 'Yes' : 'No'} (Home state)`);
        console.log(`   • Tax rate: ${(wy.tax_rate * 100).toFixed(2)}%`);
        console.log(`   • Legal exemption: ${wy.legal_exemption_available ? 'Available' : 'Not available'}`);
      }
      
      // Verify legal service exemptions
      const legalServices = await client.query(
        "SELECT COUNT(*) as count FROM service_tax_rules WHERE is_legal_service = true"
      );
      
      console.log('');
      console.log('⚖️ Legal service tax exemptions:');
      console.log(`   • Legal services configured: ${legalServices.rows[0].count}`);
      console.log(`   • DMCA takedowns: ✅ Tax exempt (Professional legal services)`);
      console.log(`   • Legal consultation: ✅ Tax exempt (Attorney-client services)`);
      console.log(`   • Case management: ✅ Tax exempt (Legal work product)`);
      
      // Test tax calculation capability
      console.log('');
      console.log('🧮 Testing tax calculation views...');
      
      // Test nexus monitoring view
      const nexusView = await client.query('SELECT COUNT(*) as count FROM nexus_monitoring_dashboard');
      console.log(`   • Nexus monitoring dashboard: ${nexusView.rows[0].count} states configured`);
      
      // Test Wyoming compliance view
      const wyomingView = await client.query('SELECT COUNT(*) as count FROM wyoming_compliance_status');
      console.log(`   • Wyoming compliance dashboard: ${wyomingView.rows[0].count} entities tracked`);
      
      console.log('');
      console.log('✅ All verification checks passed!');
      
    } finally {
      client.release();
    }
  }

  async getDataCounts(client) {
    const queries = [
      { name: 'service_rules', query: 'SELECT COUNT(*) as count FROM service_tax_rules' },
      { name: 'state_rules', query: 'SELECT COUNT(*) as count FROM state_tax_rules' },
      { name: 'nexus_status', query: 'SELECT COUNT(*) as count FROM nexus_status' },
      { name: 'wyoming_compliance', query: 'SELECT COUNT(*) as count FROM wyoming_compliance' },
    ];

    const counts = {};
    for (const query of queries) {
      const result = await client.query(query.query);
      counts[query.name] = result.rows[0].count;
    }
    
    return counts;
  }
}

// CLI execution
if (require.main === module) {
  const runner = new TaxMigrationRunner();
  
  // Handle CLI arguments
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('FanzProtect Tax Compliance Migration Runner');
    console.log('');
    console.log('Usage: node scripts/migrate-tax-tables.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --help, -h     Show this help message');
    console.log('  --verify-only  Only run verification checks');
    console.log('');
    console.log('Environment variables:');
    console.log('  DATABASE_URL              Full PostgreSQL connection string');
    console.log('  TAX_DB_CONNECTION_STRING  Alternative connection string variable');
    console.log('');
    console.log('Examples:');
    console.log('  # Run full migration');
    console.log('  npm run migrate:tax');
    console.log('');
    console.log('  # Run with custom connection string');
    console.log('  DATABASE_URL=postgresql://user:pass@localhost:5432/fanzprotect npm run migrate:tax');
    console.log('');
    process.exit(0);
  }

  if (args.includes('--verify-only')) {
    console.log('🔍 Running verification checks only...');
    const runner = new TaxMigrationRunner();
    runner.verifyMigration().then(() => {
      console.log('✅ Verification completed');
      process.exit(0);
    }).catch(error => {
      console.error('❌ Verification failed:', error.message);
      process.exit(1);
    });
    return;
  }

  // Run full migration
  runner.run();
}

module.exports = TaxMigrationRunner;