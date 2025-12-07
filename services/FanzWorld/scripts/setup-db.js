#!/usr/bin/env node

/**
 * Database setup script for FanzWorld
 * This script helps initialize the database with the required schema
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';

const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkEnvFile() {
  try {
    const envPath = join(process.cwd(), '.env');
    const envContent = readFileSync(envPath, 'utf8');
    
    if (!envContent.includes('DATABASE_URL=')) {
      throw new Error('DATABASE_URL not found in .env file');
    }
    
    if (!envContent.includes('SESSION_SECRET=')) {
      log('⚠️  SESSION_SECRET not found in .env file. This is required for production.', colors.yellow);
    }
    
    log('✅ Environment file found and configured', colors.green);
    return true;
  } catch (error) {
    log('❌ .env file not found or misconfigured', colors.red);
    log('Please copy .env.example to .env and configure your DATABASE_URL', colors.yellow);
    return false;
  }
}

function setupDatabase() {
  try {
    log('🗃️  Setting up database schema...', colors.blue);
    execSync('npm run db:push', { stdio: 'inherit' });
    log('✅ Database schema created successfully', colors.green);
    return true;
  } catch (error) {
    log('❌ Failed to setup database schema', colors.red);
    log('Make sure your DATABASE_URL is correct and the database is accessible', colors.yellow);
    log('If you\'re using a local PostgreSQL database, ensure it\'s running:', colors.yellow);
    log('  - Start PostgreSQL: pg_ctl start or brew services start postgresql', colors.yellow);
    log('  - Create database: createdb fanzworld', colors.yellow);
    return false;
  }
}

function main() {
  log('🚀 FanzWorld Database Setup', colors.blue);
  log('==============================', colors.blue);
  
  if (!checkEnvFile()) {
    process.exit(1);
  }
  
  if (!setupDatabase()) {
    process.exit(1);
  }
  
  log('', colors.reset);
  log('🎉 Database setup completed successfully!', colors.green);
  log('', colors.reset);
  log('Next steps:', colors.blue);
  log('1. Run "npm run dev" to start the development server', colors.reset);
  log('2. Open http://localhost:5000 in your browser', colors.reset);
  log('', colors.reset);
}

main();