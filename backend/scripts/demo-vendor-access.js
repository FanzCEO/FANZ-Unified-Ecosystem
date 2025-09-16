#!/usr/bin/env node

/**
 * 🎮 FANZ Vendor Access Demo Script
 * 
 * Interactive demo showing vendor access delegation system functionality.
 * Tests the complete workflow from vendor registration to access token usage.
 */

const axios = require('axios');
const readline = require('readline');

// Configuration
const API_BASE = process.env.API_BASE || 'http://localhost:3000/api/v1';
const DEMO_ADMIN_TOKEN = 'demo-admin-token-for-testing'; // In production, use real auth

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

class VendorAccessDemo {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    this.demoData = {
      vendor: null,
      grant: null,
      token: null
    };
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  async question(query) {
    return new Promise(resolve => {
      this.rl.question(query, resolve);
    });
  }

  async makeRequest(method, endpoint, data = null, token = null) {
    const config = {
      method,
      url: `${API_BASE}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    if (data) {
      config.data = data;
    }

    try {
      const response = await axios(config);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || error.message,
        status: error.response?.status
      };
    }
  }

  async checkAPIHealth() {
    this.log('\n🔍 Checking API Health...', 'cyan');
    
    const result = await this.makeRequest('GET', '/vendor-access/health');
    
    if (result.success) {
      this.log('✅ API is healthy and vendor access system is running', 'green');
      return true;
    } else {
      this.log('❌ API health check failed:', 'red');
      this.log(JSON.stringify(result.error, null, 2), 'red');
      return false;
    }
  }

  async registerVendor() {
    this.log('\n👤 Step 1: Register Vendor', 'blue');
    
    const vendorData = {
      email: 'demo@ccbill.com',
      name: 'CCBill Demo Support',
      company: 'CCBill LLC',
      vendorType: 'payment',
      contactInfo: {
        phone: '+1-888-596-6873',
        address: 'Demo Address',
        primaryContact: 'Demo Contact'
      }
    };
    
    this.log('Registering vendor with data:', 'yellow');
    this.log(JSON.stringify(vendorData, null, 2), 'yellow');
    
    const result = await this.makeRequest('POST', '/vendor-access/vendors', vendorData);
    
    if (result.success) {
      this.demoData.vendor = result.data.vendor;
      this.log('✅ Vendor registered successfully!', 'green');
      this.log(`   Vendor ID: ${this.demoData.vendor.id}`, 'green');
      this.log(`   Status: ${this.demoData.vendor.status}`, 'green');
      return true;
    } else {
      this.log('❌ Vendor registration failed:', 'red');
      this.log(JSON.stringify(result.error, null, 2), 'red');
      return false;
    }
  }

  async verifyVendor() {
    if (!this.demoData.vendor) {
      this.log('❌ No vendor to verify', 'red');
      return false;
    }

    this.log('\n✅ Step 2: Verify Vendor', 'blue');
    
    const verificationData = {
      backgroundCheckCompleted: true,
      ndaSigned: true,
      complianceTrainingCompleted: true
    };
    
    this.log('Verifying vendor with verification data:', 'yellow');
    this.log(JSON.stringify(verificationData, null, 2), 'yellow');
    
    const result = await this.makeRequest(
      'POST', 
      `/vendor-access/vendors/${this.demoData.vendor.id}/verify`,
      verificationData,
      DEMO_ADMIN_TOKEN
    );
    
    if (result.success) {
      this.log('✅ Vendor verified successfully!', 'green');
      return true;
    } else {
      this.log('❌ Vendor verification failed:', 'red');
      this.log(JSON.stringify(result.error, null, 2), 'red');
      return false;
    }
  }

  async createAccessGrant() {
    if (!this.demoData.vendor) {
      this.log('❌ No vendor for access grant', 'red');
      return false;
    }

    this.log('\n🎟️ Step 3: Create Access Grant', 'blue');
    
    const grantData = {
      vendorId: this.demoData.vendor.id,
      categories: ['payment-processing'],
      accessLevel: 'full',
      duration: 24, // 24 hours
      reason: 'Demo payment processing support',
      restrictions: {
        ipWhitelist: ['*'], // Allow from anywhere for demo
        maxConcurrentSessions: 2
      }
    };
    
    this.log('Creating access grant with data:', 'yellow');
    this.log(JSON.stringify(grantData, null, 2), 'yellow');
    
    const result = await this.makeRequest(
      'POST',
      '/vendor-access/grants',
      grantData,
      DEMO_ADMIN_TOKEN
    );
    
    if (result.success) {
      this.demoData.grant = result.data.grant;
      this.log('✅ Access grant created successfully!', 'green');
      this.log(`   Grant ID: ${this.demoData.grant.id}`, 'green');
      this.log(`   Status: ${this.demoData.grant.status}`, 'green');
      return true;
    } else {
      this.log('❌ Access grant creation failed:', 'red');
      this.log(JSON.stringify(result.error, null, 2), 'red');
      return false;
    }
  }

  async approveAccessGrant() {
    if (!this.demoData.grant) {
      this.log('❌ No grant to approve', 'red');
      return false;
    }

    this.log('\n✅ Step 4: Approve Access Grant', 'blue');
    
    const result = await this.makeRequest(
      'POST',
      `/vendor-access/grants/${this.demoData.grant.id}/approve`,
      {},
      DEMO_ADMIN_TOKEN
    );
    
    if (result.success) {
      this.log('✅ Access grant approved successfully!', 'green');
      return true;
    } else {
      this.log('❌ Access grant approval failed:', 'red');
      this.log(JSON.stringify(result.error, null, 2), 'red');
      return false;
    }
  }

  async generateAccessToken() {
    if (!this.demoData.grant) {
      this.log('❌ No approved grant for token generation', 'red');
      return false;
    }

    this.log('\n🔑 Step 5: Generate Access Token', 'blue');
    
    const result = await this.makeRequest(
      'POST',
      `/vendor-access/grants/${this.demoData.grant.id}/token`,
      {},
      DEMO_ADMIN_TOKEN
    );
    
    if (result.success) {
      this.demoData.token = result.data.token;
      this.log('✅ Access token generated successfully!', 'green');
      this.log(`   Token: ${this.demoData.token.substring(0, 50)}...`, 'green');
      this.log(`   Expires: ${result.data.expiresAt}`, 'green');
      return true;
    } else {
      this.log('❌ Access token generation failed:', 'red');
      this.log(JSON.stringify(result.error, null, 2), 'red');
      return false;
    }
  }

  async testVendorAccess() {
    if (!this.demoData.token) {
      this.log('❌ No token to test access', 'red');
      return false;
    }

    this.log('\n🧪 Step 6: Test Vendor Access', 'blue');
    
    // Test 1: Validate token
    this.log('   Testing token validation...', 'yellow');
    const validateResult = await this.makeRequest(
      'POST',
      '/vendor-access/tokens/validate',
      { token: this.demoData.token }
    );
    
    if (validateResult.success && validateResult.data.valid) {
      this.log('   ✅ Token validation successful', 'green');
    } else {
      this.log('   ❌ Token validation failed', 'red');
      return false;
    }
    
    // Test 2: Access protected endpoint (if available)
    this.log('   Testing protected endpoint access...', 'yellow');
    const protectedResult = await this.makeRequest(
      'GET',
      '/payment/dashboard',
      null,
      this.demoData.token
    );
    
    if (protectedResult.success) {
      this.log('   ✅ Protected endpoint access successful', 'green');
      this.log('   Response:', 'green');
      this.log(JSON.stringify(protectedResult.data, null, 2), 'green');
    } else if (protectedResult.status === 404) {
      this.log('   ℹ️  Protected endpoint not available (expected in demo)', 'yellow');
    } else {
      this.log('   ❌ Protected endpoint access failed:', 'red');
      this.log(JSON.stringify(protectedResult.error, null, 2), 'red');
    }
    
    return true;
  }

  async getAnalytics() {
    this.log('\n📊 Step 7: Get System Analytics', 'blue');
    
    const result = await this.makeRequest(
      'GET',
      '/vendor-access/analytics/dashboard',
      null,
      DEMO_ADMIN_TOKEN
    );
    
    if (result.success) {
      this.log('✅ Analytics retrieved successfully!', 'green');
      this.log('System Statistics:', 'green');
      this.log(JSON.stringify(result.data, null, 2), 'green');
      return true;
    } else {
      this.log('❌ Analytics retrieval failed:', 'red');
      this.log(JSON.stringify(result.error, null, 2), 'red');
      return false;
    }
  }

  async runFullDemo() {
    this.log('🎮 FANZ Vendor Access System Demo', 'bright');
    this.log('=====================================', 'bright');
    this.log('This demo will walk through the complete vendor access workflow.', 'cyan');
    
    // Check if user wants to continue
    const proceed = await this.question('\nProceed with demo? (y/n): ');
    if (proceed.toLowerCase() !== 'y') {
      this.log('Demo cancelled.', 'yellow');
      this.rl.close();
      return;
    }
    
    let success = true;
    
    // Run demo steps
    success = success && await this.checkAPIHealth();
    success = success && await this.registerVendor();
    success = success && await this.verifyVendor();
    success = success && await this.createAccessGrant();
    success = success && await this.approveAccessGrant();
    success = success && await this.generateAccessToken();
    success = success && await this.testVendorAccess();
    success = success && await this.getAnalytics();
    
    // Summary
    this.log('\n📋 Demo Summary', 'bright');
    this.log('===============', 'bright');
    
    if (success) {
      this.log('🎉 All demo steps completed successfully!', 'green');
      this.log('\nWhat was demonstrated:', 'cyan');
      this.log('• Vendor registration and verification', 'cyan');
      this.log('• Access grant creation and approval', 'cyan');
      this.log('• JWT token generation and validation', 'cyan');
      this.log('• Protected endpoint access', 'cyan');
      this.log('• System analytics and monitoring', 'cyan');
    } else {
      this.log('⚠️  Some demo steps failed. This may be expected if:', 'yellow');
      this.log('• Database is not set up', 'yellow');
      this.log('• Backend server is not running', 'yellow');
      this.log('• Migration has not been applied', 'yellow');
    }
    
    this.log('\n🔧 Next Steps:', 'blue');
    this.log('• Run setup script: npm run vendor-access:setup', 'blue');
    this.log('• Start backend server: npm run dev', 'blue');
    this.log('• Check API documentation: VENDOR_ACCESS_SYSTEM.md', 'blue');
    
    this.rl.close();
  }

  async runInteractiveDemo() {
    this.log('🎮 Interactive FANZ Vendor Access Demo', 'bright');
    this.log('======================================', 'bright');
    
    while (true) {
      this.log('\nAvailable Actions:', 'cyan');
      this.log('1. Check API Health', 'cyan');
      this.log('2. Register Vendor', 'cyan');
      this.log('3. Verify Vendor', 'cyan');
      this.log('4. Create Access Grant', 'cyan');
      this.log('5. Approve Access Grant', 'cyan');
      this.log('6. Generate Access Token', 'cyan');
      this.log('7. Test Vendor Access', 'cyan');
      this.log('8. Get Analytics', 'cyan');
      this.log('9. Run Full Demo', 'cyan');
      this.log('0. Exit', 'cyan');
      
      const choice = await this.question('\nSelect action (0-9): ');
      
      switch (choice) {
        case '1': await this.checkAPIHealth(); break;
        case '2': await this.registerVendor(); break;
        case '3': await this.verifyVendor(); break;
        case '4': await this.createAccessGrant(); break;
        case '5': await this.approveAccessGrant(); break;
        case '6': await this.generateAccessToken(); break;
        case '7': await this.testVendorAccess(); break;
        case '8': await this.getAnalytics(); break;
        case '9': await this.runFullDemo(); return;
        case '0': 
          this.log('Demo exited.', 'yellow');
          this.rl.close();
          return;
        default:
          this.log('Invalid choice. Please select 0-9.', 'red');
      }
    }
  }
}

// Main execution
async function main() {
  const demo = new VendorAccessDemo();
  
  const args = process.argv.slice(2);
  const mode = args[0] || 'interactive';
  
  try {
    if (mode === 'full') {
      await demo.runFullDemo();
    } else {
      await demo.runInteractiveDemo();
    }
  } catch (error) {
    console.error('Demo failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = VendorAccessDemo;