#!/usr/bin/env node

console.log('🚀 Loading GirlFanz server from start.ts...');

import('./start.js').then(() => {
  console.log('✅ Server initialized');
}).catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
