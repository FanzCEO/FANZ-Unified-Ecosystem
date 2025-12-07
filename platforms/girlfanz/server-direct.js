#!/usr/bin/env node

// Set critical environment variables
process.env.JWT_SECRET = process.env.JWT_SECRET || 'development-secret-' + Math.random().toString(36).substring(7);
process.env.PORT = process.env.PORT || '5000';
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'session-secret-' + Math.random().toString(36).substring(7);

// Force production mode to skip Vite
process.env.NODE_ENV = 'production';

console.log('Starting GirlFanz server on port', process.env.PORT);
console.log('Environment:', process.env.NODE_ENV);

// Load TypeScript support
require('tsx/cjs');

// Load the server
require('./server/index.ts');