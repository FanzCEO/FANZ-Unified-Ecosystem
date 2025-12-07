#!/usr/bin/env node

// Load environment variables FIRST before any other imports
import './env.js';

console.log('🚀 Loading GirlFanz server from start.ts...');

import('./start.js').then(() => {
  console.log('✅ Server initialized');
}).catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
