const required = [
  'DATABASE_URL',
  'S3_ENDPOINT','S3_REGION','S3_BUCKET','S3_ACCESS_KEY_ID','S3_SECRET_ACCESS_KEY',
  'JWT_ISS','JWT_AUD','JWT_SECRET','JWT_ACCESS_TTL','JWT_REFRESH_TTL',
  'VERIFYMY_API_URL','VERIFYMY_API_KEY',
  'WEB_APP_URL','API_URL','NODE_ENV',
  'PUBLIC_DOMAIN','CLICK_TTL_SECONDS','POSTBACK_SECRET','WEBHOOK_SECRET'
];

console.log('🔧 FanzFiliate Environment Validation');
console.log('═'.repeat(50));

const missing = required.filter(k => !process.env[k]);
const present = required.filter(k => process.env[k]);

console.log(`✅ Present (${present.length}/${required.length}):`);
present.forEach(k => console.log(`   ${k}=${process.env[k] ? '***' : 'undefined'}`));

if (missing.length) {
  console.log(`\n❌ Missing (${missing.length}):`);
  missing.forEach(k => console.log(`   ${k}`));
  console.log('\n🚨 Set missing environment variables in Replit → Tools → Secrets');
  process.exit(1);
}

console.log('\n✅ ENV validation passed - all required variables present');