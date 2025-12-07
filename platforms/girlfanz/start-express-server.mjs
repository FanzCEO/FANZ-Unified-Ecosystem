#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set critical environment variables
process.env.JWT_SECRET = process.env.JWT_SECRET || 'development-secret-' + Math.random().toString(36).substring(7);
process.env.PORT = process.env.PORT || '5000';
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'session-secret-' + Math.random().toString(36).substring(7);

// Keep in development mode to enable HMR
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

console.log('🚀 Starting GirlFanz Express server');
console.log(`📦 Environment: ${process.env.NODE_ENV}`);
console.log(`🌐 Port: ${process.env.PORT}`);

// Use tsx with ESM support to handle top-level await
const serverProcess = spawn('npx', [
  'tsx',
  '--tsconfig', './tsconfig.server.json',
  '--experimental-specifier-resolution=node',
  '--loader', 'tsx/esm',
  'server/index.ts'
], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_OPTIONS: '--experimental-loader=tsx/esm --no-warnings'
  },
  shell: true
});

serverProcess.on('error', (err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});

serverProcess.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Server exited with code ${code}`);
    process.exit(code);
  }
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⏹️ Shutting down server...');
  serverProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n⏹️ Shutting down server...');
  serverProcess.kill('SIGTERM');
  process.exit(0);
});