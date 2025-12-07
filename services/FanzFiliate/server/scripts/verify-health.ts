import { storage } from '../storage.js';

interface HealthCheck {
  service: string;
  status: 'ok' | 'error';
  details?: string;
  latency?: number;
}

export async function verifyHealth(): Promise<HealthCheck[]> {
  const checks: HealthCheck[] = [];
  
  // Database health check
  try {
    const start = Date.now();
    
    // Simple query to test connection
    await storage.getUser('health-check');
    
    checks.push({
      service: 'database',
      status: 'ok',
      latency: Date.now() - start,
      details: 'PostgreSQL connection healthy'
    });
  } catch (error) {
    checks.push({
      service: 'database',
      status: 'error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
  
  // JWT validation check
  try {
    const jwt = process.env.JWT_SECRET;
    if (!jwt || jwt.length < 32) {
      throw new Error('JWT_SECRET too short or missing');
    }
    
    checks.push({
      service: 'jwt',
      status: 'ok',
      details: `JWT secret configured (${jwt.length} chars)`
    });
  } catch (error) {
    checks.push({
      service: 'jwt',
      status: 'error',
      details: error instanceof Error ? error.message : 'JWT validation failed'
    });
  }
  
  // S3/Storage check
  try {
    const requiredS3Vars = ['S3_ENDPOINT', 'S3_BUCKET', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY'];
    const missingS3 = requiredS3Vars.filter(v => !process.env[v]);
    
    if (missingS3.length > 0) {
      throw new Error(`Missing S3 vars: ${missingS3.join(', ')}`);
    }
    
    checks.push({
      service: 's3',
      status: 'ok',
      details: 'S3 configuration present'
    });
  } catch (error) {
    checks.push({
      service: 's3',
      status: 'error',
      details: error instanceof Error ? error.message : 'S3 check failed'
    });
  }
  
  // Webhook/Postback secrets check
  try {
    const postbackSecret = process.env.POSTBACK_SECRET;
    const webhookSecret = process.env.WEBHOOK_SECRET;
    
    if (!postbackSecret || !webhookSecret) {
      throw new Error('Missing POSTBACK_SECRET or WEBHOOK_SECRET');
    }
    
    checks.push({
      service: 'webhooks',
      status: 'ok',
      details: 'Postback and webhook secrets configured'
    });
  } catch (error) {
    checks.push({
      service: 'webhooks',
      status: 'error',
      details: error instanceof Error ? error.message : 'Webhook validation failed'
    });
  }
  
  return checks;
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  verifyHealth().then(checks => {
  
  console.log('🏥 FanzFiliate Health Check');
  console.log('═'.repeat(40));
  
  const failed = checks.filter(c => c.status === 'error');
  const passed = checks.filter(c => c.status === 'ok');
  
  passed.forEach(check => {
    const latency = check.latency ? ` (${check.latency}ms)` : '';
    console.log(`✅ ${check.service}${latency} - ${check.details}`);
  });
  
  failed.forEach(check => {
    console.log(`❌ ${check.service} - ${check.details}`);
  });
  
  console.log(`\n📊 Health: ${passed.length}/${checks.length} services healthy`);
  
    if (failed.length > 0) {
      process.exit(1);
    }
  }).catch(error => {
    console.error('❌ Health check failed:', error);
    process.exit(1);
  });
}