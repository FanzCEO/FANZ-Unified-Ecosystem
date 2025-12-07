#!/usr/bin/env node

// Set JWT secret if not already set  
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'development-secret-' + Math.random().toString(36).substring(7);
  console.warn('WARNING: Using generated JWT_SECRET for development. Set JWT_SECRET env variable for production!');
}

// Set port to 5000
process.env.PORT = process.env.PORT || '5000';

// Bypass vite.config.ts issues by using Node directly
require('tsx/cjs');
require('./server/index.ts');