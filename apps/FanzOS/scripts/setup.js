#!/usr/bin/env node

/**
 * Project Setup and Configuration Script
 * Handles initial setup, dependency management, and environment configuration
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import readline from 'readline';

const execAsync = promisify(exec);

function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

function askQuestion(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function checkPrerequisites() {
  console.log('🔍 Checking prerequisites...');
  
  const checks = [
    { name: 'Node.js', command: 'node --version', required: true },
    { name: 'npm', command: 'npm --version', required: true },
    { name: 'Git', command: 'git --version', required: false },
    { name: 'Go', command: 'go version', required: false }
  ];
  
  for (const check of checks) {
    try {
      const { stdout } = await execAsync(check.command);
      console.log(`✅ ${check.name}: ${stdout.trim()}`);
    } catch (error) {
      if (check.required) {
        console.error(`❌ ${check.name} is required but not found`);
        process.exit(1);
      } else {
        console.log(`⚠️ ${check.name}: Not found (optional)`);
      }
    }
  }
}

async function initializeEnvironment() {
  console.log('⚙️ Setting up environment configuration...');
  
  const envTemplate = `# FansLab Platform Environment Variables
# Copy this to .env and update with your actual values

# ===== REQUIRED =====
DATABASE_URL=postgresql://user:password@localhost:5432/fanslab
SESSION_SECRET=your-super-secret-session-key-here

# ===== AUTHENTICATION =====
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Facebook OAuth  
FACEBOOK_CLIENT_ID=your-facebook-app-id
FACEBOOK_CLIENT_SECRET=your-facebook-app-secret

# Twitter OAuth
TWITTER_CLIENT_ID=your-twitter-client-id
TWITTER_CLIENT_SECRET=your-twitter-client-secret

# ===== EMAIL & SMS =====
# SendGrid Email
SENDGRID_API_KEY=your-sendgrid-api-key

# Twilio SMS
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number

# ===== PUSH NOTIFICATIONS =====
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key

# ===== FILE STORAGE =====
STORAGE_PROVIDER=mojohost
STORAGE_ENDPOINT=https://s3.mojohost.com
STORAGE_ACCESS_KEY=your-storage-access-key
STORAGE_SECRET_KEY=your-storage-secret-key
STORAGE_BUCKET_NAME=fanslab-content

# CDN Configuration
CDN_ENDPOINT=https://cdn.mojohost.com
CDN_PRICE_PER_GB=0.01

# ===== PAYMENT PROCESSING =====
# CCBill (Primary)
CCBILL_CLIENT_ACCOUNT=your-ccbill-account
CCBILL_CLIENT_SUBACC=your-ccbill-subaccount
CCBILL_FLEXFORMS_ID=your-flexforms-id
CCBILL_SALT_KEY=your-salt-key

# NowPayments (Crypto)
NOWPAYMENTS_API_KEY=your-nowpayments-api-key

# Triple-A (Crypto Alternative)
TRIPLEA_CLIENT_ID=your-triplea-client-id
TRIPLEA_CLIENT_SECRET=your-triplea-client-secret

# Authorize.net (Tips & Merchandise)
AUTHNET_API_LOGIN_ID=your-authnet-login
AUTHNET_TRANSACTION_KEY=your-authnet-key

# ===== SERVER CONFIGURATION =====
NODE_ENV=development
PORT=5000
GO_SERVER_URL=http://localhost:8080

# ===== OPTIONAL SERVICES =====
# Redis (Caching)
REDIS_URL=redis://localhost:6379

# Analytics
GOOGLE_ANALYTICS_ID=your-ga-tracking-id
`;

  try {
    await fs.access('.env');
    console.log('⚠️ .env file already exists, skipping creation');
  } catch {
    await fs.writeFile('.env.example', envTemplate);
    console.log('✅ Created .env.example with all configuration options');
    console.log('📝 Copy .env.example to .env and update with your values');
  }
}

async function setupDirectories() {
  console.log('📁 Creating project directories...');
  
  const directories = [
    'logs',
    'backups', 
    'uploads',
    'temp',
    'migrations',
    'public/assets',
    'public/uploads',
    'dist'
  ];
  
  for (const dir of directories) {
    try {
      await fs.access(dir);
      console.log(`✅ Directory exists: ${dir}`);
    } catch {
      await fs.mkdir(dir, { recursive: true });
      console.log(`📁 Created: ${dir}`);
    }
  }
  
  // Create .gitkeep files for empty directories
  const gitkeepDirs = ['logs', 'backups', 'temp', 'uploads'];
  for (const dir of gitkeepDirs) {
    await fs.writeFile(`${dir}/.gitkeep`, '');
  }
}

async function installDependencies() {
  console.log('📦 Installing dependencies...');
  
  try {
    console.log('Installing production dependencies...');
    await execAsync('npm install');
    console.log('✅ Production dependencies installed');
    
    console.log('Installing additional development tools...');
    const devDeps = [
      '@types/web-push',
      '@types/node-cron',
      'dotenv',
      'nodemon'
    ];
    
    for (const dep of devDeps) {
      try {
        await execAsync(`npm install --save-dev ${dep}`);
        console.log(`✅ Installed: ${dep}`);
      } catch (error) {
        console.log(`⚠️ Optional dependency failed: ${dep}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Failed to install dependencies:', error.message);
    process.exit(1);
  }
}

async function initializeDatabase(rl) {
  console.log('🗃️ Database initialization...');
  
  const setupDb = await askQuestion(rl, 'Initialize database schema? (y/n): ');
  
  if (setupDb.toLowerCase() === 'y') {
    try {
      console.log('Setting up database schema...');
      await execAsync('node scripts/db-setup.js init');
      console.log('✅ Database schema initialized');
    } catch (error) {
      console.error('❌ Database setup failed:', error.message);
      console.log('💡 Make sure DATABASE_URL is configured correctly in .env');
    }
  }
}

async function createStartupScripts() {
  console.log('📜 Creating startup scripts...');
  
  const scripts = {
    'start-dev.sh': `#!/bin/bash
# Development startup script
echo "🚀 Starting FansLab in development mode..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Copy .env.example to .env and configure it."
    exit 1
fi

# Start the application
NODE_ENV=development npm run dev
`,
    
    'start-prod.sh': `#!/bin/bash
# Production startup script  
echo "🚀 Starting FansLab in production mode..."

# Build the application
npm run build

# Start production server
NODE_ENV=production npm start
`,
    
    'maintenance.sh': `#!/bin/bash
# Maintenance and health check script
echo "🔧 Running maintenance tasks..."

# Health check
node scripts/health-check.js

# Database optimization
echo "Optimizing database..."
# Add database maintenance commands here

echo "✅ Maintenance completed"
`
  };
  
  for (const [filename, content] of Object.entries(scripts)) {
    await fs.writeFile(filename, content);
    await execAsync(`chmod +x ${filename}`);
    console.log(`✅ Created: ${filename}`);
  }
}

async function displaySetupSummary() {
  console.log('\n🎉 FansLab Setup Complete!');
  console.log('========================');
  console.log('');
  console.log('📁 Project structure created');
  console.log('⚙️ Environment template generated');
  console.log('📦 Dependencies installed');
  console.log('📜 Startup scripts created');
  console.log('');
  console.log('Next Steps:');
  console.log('1. Copy .env.example to .env and configure your environment');
  console.log('2. Set up your database connection');
  console.log('3. Configure external service API keys');
  console.log('4. Run: npm run dev (development) or ./start-prod.sh (production)');
  console.log('');
  console.log('Available Scripts:');
  console.log('- npm run dev          → Start development server');
  console.log('- npm run build        → Build for production');
  console.log('- npm run db:push      → Update database schema');
  console.log('- npm run health       → Run health checks');
  console.log('- ./start-dev.sh       → Development startup');
  console.log('- ./start-prod.sh      → Production startup');
  console.log('- ./maintenance.sh     → Run maintenance tasks');
}

async function main() {
  console.log('🚀 FansLab Platform Setup');
  console.log('=========================');
  console.log('');
  
  const rl = createInterface();
  
  try {
    await checkPrerequisites();
    console.log('');
    
    await setupDirectories();
    console.log('');
    
    await initializeEnvironment();
    console.log('');
    
    await installDependencies();
    console.log('');
    
    await initializeDatabase(rl);
    console.log('');
    
    await createStartupScripts();
    console.log('');
    
    await displaySetupSummary();
    
  } catch (error) {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();