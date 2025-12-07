#!/usr/bin/env node
"use strict";
console.log('🚀 Loading GirlFanz server from start.ts...');
import('./start.ts').then(() => {
    console.log('✅ Server initialized');
}).catch((err) => {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
});
