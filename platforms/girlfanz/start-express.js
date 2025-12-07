#!/usr/bin/env node

// Set critical environment variables
process.env.JWT_SECRET = process.env.JWT_SECRET || 'development-secret-' + Math.random().toString(36).substring(7);
process.env.PORT = process.env.PORT || '5000';
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'session-secret-' + Math.random().toString(36).substring(7);

console.log('🚀 Starting GirlFanz Express server');
console.log(`🌐 Port: ${process.env.PORT}`);

// Load TypeScript support
require('tsx/cjs');

// For tsconfig-paths support (needed for @shared imports)
require('tsconfig-paths/register');

// Load our custom server entry that bypasses vite.config.ts
try {
  require('./server-entry.ts');
} catch (error) {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
}