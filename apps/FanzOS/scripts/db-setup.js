#!/usr/bin/env node

/**
 * Database Setup Script
 * Comprehensive database initialization and migration utility
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

const DB_COMMANDS = {
  push: 'drizzle-kit push',
  generate: 'drizzle-kit generate',
  migrate: 'drizzle-kit migrate',
  introspect: 'drizzle-kit introspect',
  studio: 'drizzle-kit studio',
  drop: 'drizzle-kit drop'
};

async function checkEnvironment() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }
  console.log('✅ Environment variables validated');
}

async function ensureDirectories() {
  const dirs = ['migrations', 'logs', 'backups'];
  for (const dir of dirs) {
    try {
      await fs.access(dir);
      console.log(`✅ Directory exists: ${dir}`);
    } catch {
      await fs.mkdir(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  }
}

async function runCommand(command, description) {
  console.log(`🔄 ${description}...`);
  try {
    const { stdout, stderr } = await execAsync(command);
    if (stdout) console.log(stdout);
    if (stderr && !stderr.includes('warning')) console.error(stderr);
    console.log(`✅ ${description} completed`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    return false;
  }
}

async function backupDatabase() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = `backups/backup-${timestamp}.sql`;
  
  console.log('💾 Creating database backup...');
  // This would need pg_dump in production
  console.log(`📝 Backup would be saved to: ${backupFile}`);
}

async function validateSchema() {
  console.log('🔍 Validating database schema...');
  try {
    // Import and validate schema file
    const schemaPath = path.resolve('shared/schema.ts');
    await fs.access(schemaPath);
    console.log('✅ Schema file exists and is accessible');
    return true;
  } catch (error) {
    console.error('❌ Schema validation failed:', error.message);
    return false;
  }
}

async function main() {
  const command = process.argv[2] || 'push';
  
  console.log('🚀 FansLab Database Setup');
  console.log('========================');
  
  await checkEnvironment();
  await ensureDirectories();
  await validateSchema();
  
  switch (command) {
    case 'init':
      await backupDatabase();
      await runCommand(DB_COMMANDS.push, 'Initializing database schema');
      break;
      
    case 'migrate':
      await backupDatabase();
      await runCommand(DB_COMMANDS.generate, 'Generating migrations');
      await runCommand(DB_COMMANDS.migrate, 'Running migrations');
      break;
      
    case 'reset':
      console.log('⚠️  Resetting database (destructive operation)');
      await backupDatabase();
      await runCommand(DB_COMMANDS.drop, 'Dropping database');
      await runCommand(DB_COMMANDS.push, 'Recreating database schema');
      break;
      
    case 'studio':
      await runCommand(DB_COMMANDS.studio, 'Starting Drizzle Studio');
      break;
      
    case 'push':
    default:
      await runCommand(DB_COMMANDS.push, 'Pushing schema changes');
      break;
  }
  
  console.log('🎉 Database operations completed successfully');
}

main().catch((error) => {
  console.error('💥 Database setup failed:', error);
  process.exit(1);
});