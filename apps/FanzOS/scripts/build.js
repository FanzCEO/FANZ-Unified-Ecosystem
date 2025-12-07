#!/usr/bin/env node

/**
 * Enhanced Build Script for FansLab Platform
 * Handles frontend, backend, and static asset compilation
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

// Build configuration
const BUILD_CONFIG = {
  frontend: {
    command: 'npx vite build',
    outputDir: 'dist',
    description: 'Frontend React application'
  },
  backend: {
    command: 'npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --sourcemap',
    outputDir: 'dist',
    description: 'Backend Express server'
  },
  goServer: {
    command: 'go build -o dist/go-server server.go',
    outputDir: 'dist/go-server',
    description: 'Go static file server'
  }
};

async function ensureBuildDir() {
  try {
    await fs.access('dist');
  } catch {
    await fs.mkdir('dist', { recursive: true });
    console.log('📁 Created dist directory');
  }
}

async function runBuildStep(name, config) {
  console.log(`🔨 Building ${config.description}...`);
  
  try {
    const startTime = Date.now();
    const { stdout, stderr } = await execAsync(config.command);
    
    if (stdout) console.log(stdout);
    if (stderr && !stderr.includes('warning')) console.error(stderr);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ ${config.description} built successfully in ${duration}s`);
    
    return true;
  } catch (error) {
    console.error(`❌ Failed to build ${config.description}:`, error.message);
    return false;
  }
}

async function validateBuild() {
  console.log('🔍 Validating build output...');
  
  const requiredFiles = [
    'dist/index.html',     // Frontend
    'dist/index.js'        // Backend
  ];
  
  let allValid = true;
  
  for (const file of requiredFiles) {
    try {
      const stats = await fs.stat(file);
      console.log(`✅ ${file} (${(stats.size / 1024).toFixed(1)}KB)`);
    } catch {
      console.error(`❌ Missing: ${file}`);
      allValid = false;
    }
  }
  
  return allValid;
}

async function copyAssets() {
  console.log('📋 Copying additional assets...');
  
  const assetsToCopy = [
    { from: 'package.json', to: 'dist/package.json' },
    { from: 'README.md', to: 'dist/README.md' },
    { from: 'attached_assets', to: 'dist/assets', optional: true }
  ];
  
  for (const asset of assetsToCopy) {
    try {
      await fs.copyFile(asset.from, asset.to);
      console.log(`✅ Copied ${asset.from}`);
    } catch (error) {
      if (!asset.optional) {
        console.error(`❌ Failed to copy ${asset.from}:`, error.message);
      }
    }
  }
}

async function createProductionEnv() {
  console.log('⚙️ Creating production environment template...');
  
  const envTemplate = `# Production Environment Variables
# Copy this file to .env and update with your values

# Database
DATABASE_URL=your_database_url_here

# Authentication
SESSION_SECRET=your_session_secret_here

# Email Services
SENDGRID_API_KEY=your_sendgrid_key_here

# SMS Services  
TWILIO_ACCOUNT_SID=your_twilio_sid_here
TWILIO_AUTH_TOKEN=your_twilio_token_here

# Push Notifications
VAPID_PUBLIC_KEY=your_vapid_public_key_here
VAPID_PRIVATE_KEY=your_vapid_private_key_here

# Storage Services
STORAGE_PROVIDER=mojohost
STORAGE_ENDPOINT=your_storage_endpoint_here
STORAGE_ACCESS_KEY=your_access_key_here
STORAGE_SECRET_KEY=your_secret_key_here

# Server Configuration
NODE_ENV=production
PORT=5000
GO_SERVER_URL=http://localhost:8080
`;

  await fs.writeFile('dist/.env.template', envTemplate);
  console.log('✅ Created production environment template');
}

async function generateBuildInfo() {
  const buildInfo = {
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    gitCommit: process.env.REPL_ID || 'development',
    buildDuration: Date.now() - buildStartTime
  };
  
  await fs.writeFile('dist/build-info.json', JSON.stringify(buildInfo, null, 2));
  console.log('📝 Generated build information');
}

// Main build process
async function main() {
  const buildTarget = process.argv[2] || 'all';
  const buildStartTime = Date.now();
  
  console.log('🚀 FansLab Build Process');
  console.log('=======================');
  console.log(`Target: ${buildTarget}`);
  console.log('');
  
  await ensureBuildDir();
  
  let success = true;
  
  switch (buildTarget) {
    case 'frontend':
      success = await runBuildStep('frontend', BUILD_CONFIG.frontend);
      break;
      
    case 'backend': 
      success = await runBuildStep('backend', BUILD_CONFIG.backend);
      break;
      
    case 'go':
      success = await runBuildStep('go', BUILD_CONFIG.goServer);
      break;
      
    case 'all':
    default:
      success = await runBuildStep('frontend', BUILD_CONFIG.frontend) &&
                await runBuildStep('backend', BUILD_CONFIG.backend);
      
      // Try building Go server (optional)
      try {
        await runBuildStep('go', BUILD_CONFIG.goServer);
      } catch {
        console.log('ℹ️ Go server build skipped (optional)');
      }
      break;
  }
  
  if (success) {
    await validateBuild();
    await copyAssets();
    await createProductionEnv();
    await generateBuildInfo();
    
    const totalTime = ((Date.now() - buildStartTime) / 1000).toFixed(2);
    console.log('');
    console.log(`🎉 Build completed successfully in ${totalTime}s`);
    console.log('📦 Ready for production deployment');
  } else {
    console.log('');
    console.log('💥 Build failed');
    process.exit(1);
  }
}

const buildStartTime = Date.now();

main().catch((error) => {
  console.error('💥 Build process failed:', error);
  process.exit(1);
});