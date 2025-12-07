#!/usr/bin/env node

/**
 * Advanced Database Management System
 * Handles schema migrations, optimizations, and maintenance
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';

const execAsync = promisify(exec);

// Database optimization queries
const OPTIMIZATION_QUERIES = [
  // Basic indexes for performance
  `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL;`,
  `CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);`,
  `CREATE INDEX IF NOT EXISTS idx_posts_creator_id ON posts(creator_id);`,
  `CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);`,
  `CREATE INDEX IF NOT EXISTS idx_subscriptions_creator_id ON subscriptions(creator_id);`,
  `CREATE INDEX IF NOT EXISTS idx_subscriptions_created_at ON subscriptions(created_at);`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_creator_id ON transactions(creator_id);`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);`,
  `CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);`,
  `CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);`,
  
  // Composite indexes for common queries
  `CREATE INDEX IF NOT EXISTS idx_posts_creator_visibility ON posts(creator_id, visibility);`,
  `CREATE INDEX IF NOT EXISTS idx_subscriptions_active ON subscriptions(creator_id, is_active) WHERE is_active = true;`,
  `CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;`,
  
  // Performance optimizations
  `VACUUM ANALYZE users;`,
  `VACUUM ANALYZE posts;`,
  `VACUUM ANALYZE subscriptions;`,
  `VACUUM ANALYZE transactions;`,
  `VACUUM ANALYZE messages;`,
  `VACUUM ANALYZE notifications;`
];

// Database maintenance queries
const MAINTENANCE_QUERIES = [
  // Clean up old data
  `DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '90 days' AND is_read = true;`,
  `DELETE FROM sessions WHERE expire < NOW();`,
  `DELETE FROM audit_log WHERE created_at < NOW() - INTERVAL '1 year';`,
  
  // Update statistics
  `ANALYZE users;`,
  `ANALYZE posts;`,
  `ANALYZE subscriptions;`,
  `ANALYZE transactions;`
];

async function executeQuery(query, description) {
  try {
    console.log(`🔄 ${description}...`);
    
    // Using psql command for direct database access
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL environment variable not set');
    }
    
    const { stdout, stderr } = await execAsync(`echo "${query}" | psql "${dbUrl}"`);
    
    if (stderr && !stderr.includes('NOTICE') && !stderr.includes('already exists')) {
      console.log(`⚠️ ${description}: ${stderr.trim()}`);
    } else {
      console.log(`✅ ${description}`);
    }
    
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed: ${error.message}`);
    return false;
  }
}

async function optimizeDatabase() {
  console.log('🚀 Starting database optimization...');
  
  let successCount = 0;
  
  for (const query of OPTIMIZATION_QUERIES) {
    const success = await executeQuery(query, 'Database optimization');
    if (success) successCount++;
  }
  
  console.log(`✅ Database optimization completed: ${successCount}/${OPTIMIZATION_QUERIES.length} operations successful`);
  return successCount;
}

async function performMaintenance() {
  console.log('🧹 Starting database maintenance...');
  
  let successCount = 0;
  
  for (const query of MAINTENANCE_QUERIES) {
    const success = await executeQuery(query, 'Database maintenance');
    if (success) successCount++;
  }
  
  console.log(`✅ Database maintenance completed: ${successCount}/${MAINTENANCE_QUERIES.length} operations successful`);
  return successCount;
}

async function checkDatabaseHealth() {
  console.log('🏥 Checking database health...');
  
  const healthQueries = [
    {
      name: 'Connection Test',
      query: 'SELECT 1 as health_check;'
    },
    {
      name: 'Table Count',
      query: `SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';`
    },
    {
      name: 'User Count',
      query: 'SELECT COUNT(*) as user_count FROM users;'
    },
    {
      name: 'Active Subscriptions',
      query: 'SELECT COUNT(*) as active_subs FROM subscriptions WHERE is_active = true;'
    },
    {
      name: 'Database Size',
      query: `SELECT pg_size_pretty(pg_database_size(current_database())) as db_size;`
    }
  ];
  
  const results = {};
  
  for (const check of healthQueries) {
    try {
      const { stdout } = await execAsync(`echo "${check.query}" | psql "${process.env.DATABASE_URL}" -t`);
      results[check.name] = stdout.trim();
      console.log(`✅ ${check.name}: ${stdout.trim()}`);
    } catch (error) {
      results[check.name] = `Error: ${error.message}`;
      console.error(`❌ ${check.name}: ${error.message}`);
    }
  }
  
  return results;
}

async function backupDatabase() {
  console.log('💾 Creating database backup...');
  
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = `backups/backup-${timestamp}.sql`;
    
    // Create backup using pg_dump
    await execAsync(`pg_dump "${process.env.DATABASE_URL}" > ${backupFile}`);
    
    const stats = await fs.stat(backupFile);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log(`✅ Database backup created: ${backupFile} (${sizeMB}MB)`);
    return backupFile;
  } catch (error) {
    console.error('❌ Database backup failed:', error.message);
    return null;
  }
}

async function generateDatabaseReport() {
  console.log('📊 Generating database report...');
  
  const report = {
    timestamp: new Date().toISOString(),
    health: await checkDatabaseHealth(),
    optimization: null,
    maintenance: null,
    backup: null
  };
  
  // Save report
  const reportFile = `reports/database-report-${new Date().toISOString().split('T')[0]}.json`;
  
  try {
    await fs.mkdir('reports', { recursive: true });
    await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
    console.log(`✅ Database report saved: ${reportFile}`);
  } catch (error) {
    console.error('❌ Failed to save database report:', error.message);
  }
  
  return report;
}

async function main() {
  const command = process.argv[2] || 'optimize';
  
  console.log('🗃️ FansLab Database Manager');
  console.log('===========================');
  console.log('');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }
  
  switch (command) {
    case 'optimize':
      await optimizeDatabase();
      break;
      
    case 'maintain':
      await performMaintenance();
      break;
      
    case 'health':
      await checkDatabaseHealth();
      break;
      
    case 'backup':
      await backupDatabase();
      break;
      
    case 'full':
      await backupDatabase();
      await optimizeDatabase();
      await performMaintenance();
      await generateDatabaseReport();
      break;
      
    case 'report':
      await generateDatabaseReport();
      break;
      
    default:
      console.log('Available commands:');
      console.log('- optimize: Run database optimizations');
      console.log('- maintain: Perform maintenance tasks');
      console.log('- health: Check database health');
      console.log('- backup: Create database backup');
      console.log('- full: Run all operations');
      console.log('- report: Generate comprehensive report');
      break;
  }
  
  console.log('');
  console.log('🎉 Database management completed');
}

main().catch((error) => {
  console.error('💥 Database management failed:', error);
  process.exit(1);
});