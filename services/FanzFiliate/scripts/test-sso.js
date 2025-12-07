#!/usr/bin/env node

/**
 * FanzSSO Integration Test
 * Tests the SSO service functionality with mock tokens
 */

import { fanzSSOService } from '../dist/server/services/sso.js';

async function testSSOIntegration() {
  console.log('🧪 FanzSSO Integration Test Suite');
  console.log('=' .repeat(50));
  
  const tests = [];
  
  // Test 1: Valid development token
  try {
    console.log('\n📍 Test 1: Valid development token');
    const result = await fanzSSOService.validateSSOToken('sso_testuser123');
    
    if (result.valid && result.user) {
      console.log('✅ PASS: Token validated successfully');
      console.log(`   User: ${result.user.email} (${result.user.role})`);
      tests.push({ name: 'Valid dev token', passed: true });
    } else {
      console.log('❌ FAIL: Token should be valid');
      tests.push({ name: 'Valid dev token', passed: false });
    }
  } catch (error) {
    console.log(`❌ FAIL: Error - ${error.message}`);
    tests.push({ name: 'Valid dev token', passed: false });
  }
  
  // Test 2: Invalid token
  try {
    console.log('\n📍 Test 2: Invalid token');
    const result = await fanzSSOService.validateSSOToken('invalid_token');
    
    if (!result.valid) {
      console.log('✅ PASS: Invalid token rejected');
      tests.push({ name: 'Invalid token', passed: true });
    } else {
      console.log('❌ FAIL: Invalid token should be rejected');
      tests.push({ name: 'Invalid token', passed: false });
    }
  } catch (error) {
    console.log(`❌ FAIL: Error - ${error.message}`);
    tests.push({ name: 'Invalid token', passed: false });
  }
  
  // Test 3: Admin user token
  try {
    console.log('\n📍 Test 3: Admin user token');
    const result = await fanzSSOService.validateSSOToken('sso_adminuser');
    
    if (result.valid && result.user && result.user.role === 'admin') {
      console.log('✅ PASS: Admin token validated with correct role');
      console.log(`   User: ${result.user.email} (${result.user.role})`);
      tests.push({ name: 'Admin token', passed: true });
    } else {
      console.log('❌ FAIL: Admin token should have admin role');
      tests.push({ name: 'Admin token', passed: false });
    }
  } catch (error) {
    console.log(`❌ FAIL: Error - ${error.message}`);
    tests.push({ name: 'Admin token', passed: false });
  }
  
  // Test 4: KYC approved user
  try {
    console.log('\n📍 Test 4: KYC approved user');
    const result = await fanzSSOService.validateSSOToken('sso_userkyc');
    
    if (result.valid && result.user && result.user.kycStatus === 'approved') {
      console.log('✅ PASS: KYC user validated with approved status');
      console.log(`   User: ${result.user.email} (KYC: ${result.user.kycStatus})`);
      tests.push({ name: 'KYC approved token', passed: true });
    } else {
      console.log('❌ FAIL: KYC token should have approved status');
      tests.push({ name: 'KYC approved token', passed: false });
    }
  } catch (error) {
    console.log(`❌ FAIL: Error - ${error.message}`);
    tests.push({ name: 'KYC approved token', passed: false });
  }
  
  // Test 5: Activity logging (should not throw)
  try {
    console.log('\n📍 Test 5: Activity logging');
    await fanzSSOService.logActivity('testuser123', {
      type: 'test_activity',
      details: {
        action: 'integration_test',
        timestamp: new Date().toISOString(),
      }
    });
    console.log('✅ PASS: Activity logged without errors');
    tests.push({ name: 'Activity logging', passed: true });
  } catch (error) {
    console.log(`❌ FAIL: Error - ${error.message}`);
    tests.push({ name: 'Activity logging', passed: false });
  }
  
  // Test 6: Generate login URL
  try {
    console.log('\n📍 Test 6: Generate login URL');
    // This will fail gracefully if FANZSSO_API_URL is not set
    process.env.FANZSSO_API_URL = 'https://sso.example.com/api';
    const loginUrl = fanzSSOService.generateLoginURL('https://fanzfiliate.com/callback', 'test-state');
    
    if (loginUrl.includes('oauth/authorize') && loginUrl.includes('fanzfiliate')) {
      console.log('✅ PASS: Login URL generated correctly');
      console.log(`   URL: ${loginUrl}`);
      tests.push({ name: 'Generate login URL', passed: true });
    } else {
      console.log('❌ FAIL: Login URL format incorrect');
      tests.push({ name: 'Generate login URL', passed: false });
    }
  } catch (error) {
    console.log(`❌ FAIL: Error - ${error.message}`);
    tests.push({ name: 'Generate login URL', passed: false });
  }
  
  // Test Summary
  console.log('\n' + '=' .repeat(50));
  console.log('📊 Test Summary:');
  
  const passed = tests.filter(t => t.passed).length;
  const total = tests.length;
  
  tests.forEach(test => {
    console.log(`${test.passed ? '✅' : '❌'} ${test.name}`);
  });
  
  console.log(`\n🎯 Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! SSO integration is working correctly.');
    process.exit(0);
  } else {
    console.log('🚨 Some tests failed. Check the output above for details.');
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testSSOIntegration().catch(error => {
    console.error('💥 Test suite crashed:', error);
    process.exit(1);
  });
}

export { testSSOIntegration };
