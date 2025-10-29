#!/usr/bin/env node
/**
 * Smoke tests for staging environment
 */

const http = require('http');
const https = require('https');

const ENVIRONMENT = process.argv[2] || 'staging';
const BASE_URL = ENVIRONMENT === 'staging'
  ? 'https://staging.fanz.eco'
  : 'https://fanz.eco';

console.log(`🔥 Running smoke tests for ${ENVIRONMENT} environment...`);
console.log(`Base URL: ${BASE_URL}`);

const tests = [
  {
    name: 'Health Check',
    path: '/healthz',
    expected: 200
  },
  {
    name: 'API Readiness',
    path: '/readyz',
    expected: 200
  },
  {
    name: 'System Status',
    path: '/system',
    expected: 200
  }
];

async function runTest(test) {
  return new Promise((resolve, reject) => {
    const url = new URL(test.path, BASE_URL);
    const protocol = url.protocol === 'https:' ? https : http;

    protocol.get(url, (res) => {
      if (res.statusCode === test.expected) {
        console.log(`✅ ${test.name} - PASSED`);
        resolve(true);
      } else {
        console.error(`❌ ${test.name} - FAILED (Status: ${res.statusCode})`);
        resolve(false);
      }
    }).on('error', (err) => {
      console.error(`❌ ${test.name} - ERROR: ${err.message}`);
      resolve(false);
    });
  });
}

async function main() {
  const results = await Promise.all(tests.map(runTest));
  const passed = results.filter(r => r).length;
  const total = results.length;

  console.log(`\n📊 Results: ${passed}/${total} tests passed`);

  if (passed === total) {
    console.log('✅ All smoke tests passed!');
    process.exit(0);
  } else {
    console.log('❌ Some smoke tests failed');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Error running smoke tests:', err);
  process.exit(1);
});
