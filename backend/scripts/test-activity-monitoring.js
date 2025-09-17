#!/usr/bin/env node

/**
 * FANZ Activity Monitoring Test Script
 * 
 * This script demonstrates the comprehensive activity monitoring capabilities
 * of the FANZ Enhanced Vendor Management System.
 */

const axios = require('axios');
const { Pool } = require('pg');

const BASE_URL = 'http://localhost:3000/api';
const ADMIN_CREDENTIALS = {
  email: 'admin@fanz.com',
  password: 'admin123'
};

// Database connection for generating test data
const dbConnection = new Pool({
  user: process.env.DB_USER || 'fanz_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'fanz_unified',
  password: process.env.DB_PASSWORD || 'FanzDB_2024_Secure!',
  port: process.env.DB_PORT || 5432,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

let adminToken = null;

/**
 * Test admin authentication
 */
async function authenticateAdmin() {
  console.log('🔐 Authenticating admin...');
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/admin/login`, ADMIN_CREDENTIALS);
    
    if (response.data.success) {
      adminToken = response.data.tokens.access_token;
      console.log('✅ Admin authenticated successfully');
      console.log(`   Token: ${adminToken.substring(0, 20)}...`);
      return true;
    }
  } catch (error) {
    console.error('❌ Admin authentication failed:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Generate some test activity data
 */
async function generateTestData() {
  console.log('\\n🧪 Generating test activity data...');
  
  try {
    // Insert test vendor activities
    const testActivities = [
      {
        vendor_id: 1,
        session_id: 'test-session-001',
        action: 'api_request',
        resource: 'vendor_profiles',
        method: 'GET',
        endpoint: '/api/vendors',
        response_status: 200,
        response_time_ms: 145,
        risk_score: 15,
        risk_factors: ['normal_access'],
        ip_address: '192.168.1.100',
        user_agent: 'FANZ-Client/1.0'
      },
      {
        vendor_id: 1,
        session_id: 'test-session-001',
        action: 'data_access',
        resource: 'sensitive_data',
        method: 'POST',
        endpoint: '/api/admin/grants',
        response_status: 403,
        response_time_ms: 89,
        risk_score: 75,
        risk_factors: ['unauthorized_access', 'admin_endpoint'],
        ip_address: '192.168.1.100',
        user_agent: 'FANZ-Client/1.0'
      },
      {
        vendor_id: 2,
        session_id: 'test-session-002',
        action: 'api_request',
        resource: 'vendor_stats',
        method: 'GET',
        endpoint: '/api/vendors/stats',
        response_status: 200,
        response_time_ms: 234,
        risk_score: 25,
        risk_factors: ['high_frequency'],
        ip_address: '203.0.113.45',
        user_agent: 'VendorBot/2.1'
      },
      {
        vendor_id: 3,
        session_id: 'test-session-003',
        action: 'bulk_request',
        resource: 'vendor_profiles',
        method: 'GET',
        endpoint: '/api/vendors',
        response_status: 429,
        response_time_ms: 1250,
        risk_score: 85,
        risk_factors: ['rate_limiting', 'suspicious_pattern', 'bulk_access'],
        ip_address: '198.51.100.22',
        user_agent: 'Python-requests/2.28'
      }
    ];

    for (const activity of testActivities) {
      await dbConnection.query(`
        INSERT INTO vendor_activities 
        (vendor_id, session_id, action, resource, method, endpoint, response_status, 
         response_time_ms, risk_score, risk_factors, ip_address, user_agent, timestamp)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW() - INTERVAL '${Math.floor(Math.random() * 24)} hours')
        ON CONFLICT DO NOTHING
      `, [
        activity.vendor_id, activity.session_id, activity.action, activity.resource,
        activity.method, activity.endpoint, activity.response_status, activity.response_time_ms,
        activity.risk_score, activity.risk_factors, activity.ip_address, activity.user_agent
      ]);
    }

    // Insert test vendor sessions
    const testSessions = [
      {
        id: 'test-session-001',
        vendor_id: 1,
        token_id: 'token-001',
        ip_address: '192.168.1.100',
        user_agent: 'FANZ-Client/1.0',
        total_requests: 25,
        unique_endpoints: 4,
        risk_score: 35
      },
      {
        id: 'test-session-002',
        vendor_id: 2,
        token_id: 'token-002',
        ip_address: '203.0.113.45',
        user_agent: 'VendorBot/2.1',
        total_requests: 150,
        unique_endpoints: 8,
        risk_score: 45
      },
      {
        id: 'test-session-003',
        vendor_id: 3,
        token_id: 'token-003',
        ip_address: '198.51.100.22',
        user_agent: 'Python-requests/2.28',
        total_requests: 500,
        unique_endpoints: 12,
        risk_score: 85,
        end_time: null // Active session
      }
    ];

    for (const session of testSessions) {
      await dbConnection.query(`
        INSERT INTO vendor_sessions 
        (id, vendor_id, token_id, ip_address, user_agent, start_time, last_activity, 
         total_requests, unique_endpoints, risk_score, end_time, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '30 minutes', 
                $6, $7, $8, $9, NOW() - INTERVAL '2 hours')
        ON CONFLICT (id) DO NOTHING
      `, [
        session.id, session.vendor_id, session.token_id, session.ip_address,
        session.user_agent, session.total_requests, session.unique_endpoints,
        session.risk_score, session.end_time
      ]);
    }

    console.log('✅ Test data generated successfully');
  } catch (error) {
    console.error('❌ Error generating test data:', error.message);
  }
}

/**
 * Test vendor activities endpoint
 */
async function testActivitiesEndpoint() {
  console.log('\\n📋 Testing vendor activities endpoint...');
  
  try {
    const response = await axios.get(`${BASE_URL}/admin/activity/activities?limit=10&risk_level=high`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    if (response.data.success) {
      console.log('✅ Activities retrieved successfully');
      console.log(`   Total activities: ${response.data.pagination.total}`);
      console.log(`   High-risk activities: ${response.data.activities.length}`);
      
      if (response.data.activities.length > 0) {
        const activity = response.data.activities[0];
        console.log(`   Sample activity: ${activity.action} - Risk: ${activity.risk_score}`);
      }
    }
  } catch (error) {
    console.error('❌ Activities endpoint test failed:', error.response?.data || error.message);
  }
}

/**
 * Test vendor sessions endpoint
 */
async function testSessionsEndpoint() {
  console.log('\\n🔗 Testing vendor sessions endpoint...');
  
  try {
    const response = await axios.get(`${BASE_URL}/admin/activity/sessions?active_only=true`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    if (response.data.success) {
      console.log('✅ Sessions retrieved successfully');
      console.log(`   Total sessions: ${response.data.pagination.total}`);
      console.log(`   Active sessions: ${response.data.sessions.length}`);
      
      if (response.data.sessions.length > 0) {
        const session = response.data.sessions[0];
        console.log(`   Sample session: ${session.vendor_name} - Risk: ${session.risk_score}`);
      }
    }
  } catch (error) {
    console.error('❌ Sessions endpoint test failed:', error.response?.data || error.message);
  }
}

/**
 * Test vendor activity summary
 */
async function testActivitySummary() {
  console.log('\\n📊 Testing vendor activity summary...');
  
  try {
    const response = await axios.get(`${BASE_URL}/admin/activity/summary/1?days_back=7`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    if (response.data.success) {
      console.log('✅ Activity summary retrieved successfully');
      console.log(`   Vendor: ${response.data.vendor.name} (${response.data.vendor.company})`);
      console.log(`   Period: ${response.data.period_days} days`);
      console.log(`   High-risk activities: ${response.data.high_risk_activities.length}`);
      console.log(`   Endpoint usage entries: ${response.data.endpoint_usage.length}`);
    }
  } catch (error) {
    console.error('❌ Activity summary test failed:', error.response?.data || error.message);
  }
}

/**
 * Test risk analytics endpoint
 */
async function testRiskAnalytics() {
  console.log('\\n⚠️  Testing risk analytics...');
  
  try {
    const response = await axios.get(`${BASE_URL}/admin/activity/risk-analytics?period=7d`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    if (response.data.success) {
      console.log('✅ Risk analytics retrieved successfully');
      console.log(`   Period: ${response.data.analytics.period}`);
      console.log(`   Risk trends: ${response.data.analytics.risk_trends.length} data points`);
      console.log(`   Top risk factors: ${response.data.analytics.top_risk_factors.length} factors`);
      console.log(`   High-risk vendors: ${response.data.analytics.high_risk_vendors.length} vendors`);
      console.log(`   Risk by endpoint: ${response.data.analytics.risk_by_endpoint.length} endpoints`);
    }
  } catch (error) {
    console.error('❌ Risk analytics test failed:', error.response?.data || error.message);
  }
}

/**
 * Test live feed endpoint
 */
async function testLiveFeed() {
  console.log('\\n📡 Testing live activity feed...');
  
  try {
    const response = await axios.get(`${BASE_URL}/admin/activity/live-feed?minutes_back=60`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    if (response.data.success) {
      console.log('✅ Live feed retrieved successfully');
      console.log(`   Recent activities: ${response.data.live_feed.recent_activities.length}`);
      console.log(`   Active sessions: ${response.data.live_feed.active_sessions_count}`);
      console.log(`   Current risk level: ${response.data.live_feed.current_risk_level.toFixed(1)}`);
      console.log(`   High-risk activities (last hour): ${response.data.live_feed.high_risk_activities_last_hour}`);
    }
  } catch (error) {
    console.error('❌ Live feed test failed:', error.response?.data || error.message);
  }
}

/**
 * Test session termination
 */
async function testSessionTermination() {
  console.log('\\n🔚 Testing session termination...');
  
  try {
    // First, find an active session to terminate
    const sessionsResponse = await axios.get(`${BASE_URL}/admin/activity/sessions?active_only=true&limit=1`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    if (sessionsResponse.data.success && sessionsResponse.data.sessions.length > 0) {
      const sessionId = sessionsResponse.data.sessions[0].id;
      console.log(`   Found active session: ${sessionId}`);
      
      const terminateResponse = await axios.post(`${BASE_URL}/admin/activity/sessions/${sessionId}/end`, 
        { reason: 'test_termination' },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      
      if (terminateResponse.data.success) {
        console.log('✅ Session terminated successfully');
        console.log(`   Terminated session: ${terminateResponse.data.session.vendor_name}`);
        console.log(`   Reason: ${terminateResponse.data.session.reason}`);
      }
    } else {
      console.log('ℹ️  No active sessions found to terminate');
    }
  } catch (error) {
    console.error('❌ Session termination test failed:', error.response?.data || error.message);
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🚀 FANZ Activity Monitoring Test Suite');
  console.log('='.repeat(60));
  
  // Authenticate admin
  const authenticated = await authenticateAdmin();
  if (!authenticated) {
    console.log('❌ Cannot continue without admin authentication');
    process.exit(1);
  }
  
  // Generate test data
  await generateTestData();
  
  // Run endpoint tests
  await testActivitiesEndpoint();
  await testSessionsEndpoint();
  await testActivitySummary();
  await testRiskAnalytics();
  await testLiveFeed();
  await testSessionTermination();
  
  console.log('\\n🎉 Activity monitoring test suite completed!');
  console.log('='.repeat(60));
  
  // Close database connection
  await dbConnection.end();
  process.exit(0);
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\\n🛑 Test suite interrupted');
  await dbConnection.end();
  process.exit(0);
});

// Run the tests
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('💥 Test suite crashed:', error);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  authenticateAdmin,
  generateTestData
};