#!/usr/bin/env node

/**
 * FANZ Unified Ecosystem - Database Migration Runner
 * 
 * Simple migration runner for PostgreSQL database setup
 * Run with: node migrations/run-migrations.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration from environment variables
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'fanz_ecosystem',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
};

console.log('🚀 FANZ Unified Ecosystem - Database Migration Runner');
console.log('================================================');
console.log(`📍 Connecting to: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
console.log(`👤 User: ${dbConfig.user}`);

async function runMigrations() {
  const pool = new Pool(dbConfig);
  
  try {
    // Test connection
    console.log('\n🔌 Testing database connection...');
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    client.release();

    // Get migration files
    const migrationsDir = __dirname;
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Run in alphabetical order

    if (migrationFiles.length === 0) {
      console.log('⚠️  No migration files found');
      return;
    }

    console.log(`\n📋 Found ${migrationFiles.length} migration file(s):`);
    migrationFiles.forEach(file => console.log(`   - ${file}`));

    // Run each migration
    for (const file of migrationFiles) {
      console.log(`\n🔄 Running migration: ${file}`);
      
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      const startTime = Date.now();
      
      try {
        await pool.query(sql);
        const duration = Date.now() - startTime;
        console.log(`✅ Migration completed in ${duration}ms`);
      } catch (error) {
        console.error(`❌ Migration failed: ${error.message}`);
        throw error;
      }
    }

    console.log('\n🎉 All migrations completed successfully!');
    console.log('\n📊 Database status:');
    
    // Show table counts
    const result = await pool.query(`
      SELECT 
        schemaname,
        tablename,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes
      FROM pg_stat_user_tables 
      ORDER BY tablename
    `);
    
    if (result.rows.length > 0) {
      console.log('\n📋 Created tables:');
      result.rows.forEach(row => {
        console.log(`   - ${row.tablename}`);
      });
    }

    // Show admin user info
    try {
      const adminResult = await pool.query(
        "SELECT username, email, role, created_at FROM users WHERE role = 'admin' LIMIT 1"
      );
      
      if (adminResult.rows.length > 0) {
        const admin = adminResult.rows[0];
        console.log('\n👨‍💻 Default admin user:');
        console.log(`   Username: ${admin.username}`);
        console.log(`   Email: ${admin.email}`);
        console.log(`   Role: ${admin.role}`);
        console.log(`   Created: ${admin.created_at}`);
        console.log('\n⚠️  SECURITY WARNING: Change the default admin password immediately!');
        console.log('   Default password: admin123');
      }
    } catch (error) {
      console.log('\n⚠️  Could not fetch admin user info');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
const help = args.includes('--help') || args.includes('-h');

if (help) {
  console.log(`
Usage: node migrations/run-migrations.js [options]

Options:
  -h, --help     Show this help message

Environment Variables:
  DB_HOST        Database host (default: localhost)
  DB_PORT        Database port (default: 5432)
  DB_NAME        Database name (default: fanz_ecosystem)
  DB_USER        Database user (default: postgres)
  DB_PASSWORD    Database password (default: postgres)

Examples:
  # Run with default settings
  node migrations/run-migrations.js
  
  # Run with custom database
  DB_NAME=my_fanz_db DB_USER=myuser node migrations/run-migrations.js
  
  # Load from .env file (if using dotenv)
  npx dotenv -e .env node migrations/run-migrations.js
`);
  process.exit(0);
}

// Run migrations
runMigrations().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});