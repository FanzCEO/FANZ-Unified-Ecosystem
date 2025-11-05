#!/usr/bin/env node

// Set JWT secret if not already set
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'development-secret-' + Math.random().toString(36).substring(7);
  console.warn('WARNING: Using generated JWT_SECRET for development. Set JWT_SECRET env variable for production!');
}

// Set port to 5000 if not set
process.env.PORT = process.env.PORT || '5000';

// Run server with tsx
const { execSync } = require('child_process');
const path = require('path');

try {
  execSync('npx tsx --tsconfig ./tsconfig.server.json -r tsconfig-paths/register server/index.ts', {
    stdio: 'inherit',
    env: { ...process.env }
  });
} catch (error) {
  console.error('Failed to start server:', error.message);
  process.exit(1);
}