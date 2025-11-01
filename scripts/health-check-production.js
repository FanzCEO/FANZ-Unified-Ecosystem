#!/usr/bin/env node
/**
 * Production health check script
 */

const https = require('https');

const REGIONS = [
  { name: 'US East', url: 'https://us-east.fanz.eco/healthz' },
  { name: 'US West', url: 'https://us-west.fanz.eco/healthz' },
  { name: 'EU West', url: 'https://eu-west.fanz.eco/healthz' },
  { name: 'Asia Pacific', url: 'https://asia.fanz.eco/healthz' }
];

console.log('🏥 Running production health checks across all regions...\n');

async function checkRegion(region) {
  return new Promise((resolve) => {
    const url = new URL(region.url);
    https.get(url, (res) => {
      if (res.statusCode === 200) {
        console.log(`✅ ${region.name} - HEALTHY`);
        resolve(true);
      } else {
        console.error(`❌ ${region.name} - UNHEALTHY (Status: ${res.statusCode})`);
        resolve(false);
      }
    }).on('error', (err) => {
      console.error(`❌ ${region.name} - ERROR: ${err.message}`);
      resolve(false);
    });
  });
}

async function main() {
  const results = await Promise.all(REGIONS.map(checkRegion));
  const healthy = results.filter(r => r).length;
  const total = results.length;

  console.log(`\n📊 Health Status: ${healthy}/${total} regions healthy`);

  if (healthy === total) {
    console.log('✅ All regions are healthy!');
    process.exit(0);
  } else {
    console.log('❌ Some regions are unhealthy');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Error running health checks:', err);
  process.exit(1);
});
