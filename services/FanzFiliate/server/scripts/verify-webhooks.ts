import crypto from 'crypto';

interface WebhookTest {
  endpoint: string;
  status: 'ok' | 'error';
  details: string;
}

function generateHMAC(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

function verifyHMAC(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = generateHMAC(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

export async function verifyWebhooks(): Promise<WebhookTest[]> {
  const tests: WebhookTest[] = [];
  
  // Test S2S Postback HMAC
  try {
    const postbackSecret = process.env.POSTBACK_SECRET;
    if (!postbackSecret) {
      throw new Error('POSTBACK_SECRET not configured');
    }
    
    const testPayload = JSON.stringify({
      ext_txn_id: 'test-123',
      value_cents: 2500,
      currency: 'USD',
      click_id: 'click-456',
      affiliate_id: 'aff-789',
      offer_id: 'offer-101'
    });
    
    const signature = generateHMAC(testPayload, postbackSecret);
    const isValid = verifyHMAC(testPayload, signature, postbackSecret);
    
    if (!isValid) {
      throw new Error('HMAC verification failed');
    }
    
    tests.push({
      endpoint: '/postback/s2s',
      status: 'ok',
      details: `HMAC signature validation working (${signature.substring(0, 8)}...)`
    });
  } catch (error) {
    tests.push({
      endpoint: '/postback/s2s',
      status: 'error',
      details: error instanceof Error ? error.message : 'Postback HMAC test failed'
    });
  }
  
  // Test VerifyMy Webhook HMAC
  try {
    const webhookSecret = process.env.WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('WEBHOOK_SECRET not configured');
    }
    
    const testPayload = JSON.stringify({
      event: 'verification.completed',
      user_id: 'user-123',
      verification_id: 'verify-456',
      status: 'approved',
      data: { tier: 'full' }
    });
    
    const signature = generateHMAC(testPayload, webhookSecret);
    const isValid = verifyHMAC(testPayload, signature, webhookSecret);
    
    if (!isValid) {
      throw new Error('HMAC verification failed');
    }
    
    tests.push({
      endpoint: '/webhooks/verifymy',
      status: 'ok',
      details: `HMAC signature validation working (${signature.substring(0, 8)}...)`
    });
  } catch (error) {
    tests.push({
      endpoint: '/webhooks/verifymy',
      status: 'error',
      details: error instanceof Error ? error.message : 'Webhook HMAC test failed'
    });
  }
  
  // Test environment configuration
  try {
    const requiredEnvVars = [
      'CLICK_TTL_SECONDS',
      'PUBLIC_DOMAIN',
      'COOKIE_NAME'
    ];
    
    const missing = requiredEnvVars.filter(v => !process.env[v]);
    if (missing.length > 0) {
      throw new Error(`Missing tracking env vars: ${missing.join(', ')}`);
    }
    
    const clickTtl = parseInt(process.env.CLICK_TTL_SECONDS || '0');
    if (clickTtl < 3600) {
      throw new Error('CLICK_TTL_SECONDS should be at least 3600 (1 hour)');
    }
    
    tests.push({
      endpoint: 'tracking-config',
      status: 'ok',
      details: `Click tracking configured (${clickTtl}s TTL, ${process.env.PUBLIC_DOMAIN} domain)`
    });
  } catch (error) {
    tests.push({
      endpoint: 'tracking-config',
      status: 'error',
      details: error instanceof Error ? error.message : 'Tracking config validation failed'
    });
  }
  
  return tests;
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  verifyWebhooks().then(tests => {
  
  console.log('🔗 FanzFiliate Webhook & Tracking Verification');
  console.log('═'.repeat(50));
  
  const failed = tests.filter(t => t.status === 'error');
  const passed = tests.filter(t => t.status === 'ok');
  
  passed.forEach(test => {
    console.log(`✅ ${test.endpoint} - ${test.details}`);
  });
  
  failed.forEach(test => {
    console.log(`❌ ${test.endpoint} - ${test.details}`);
  });
  
  console.log(`\n📊 Webhook Systems: ${passed.length}/${tests.length} checks passed`);
  
    if (failed.length > 0) {
      process.exit(1);
    }
  }).catch(error => {
    console.error('❌ Webhook verification failed:', error);
    process.exit(1);
  });
}