/**
 * 🧪 FANZ Vendor Access Test Suite
 * 
 * Comprehensive tests for vendor access delegation system
 * covering service logic, middleware, controller, and database operations.
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { Pool } from 'pg';
import { Container } from 'inversify';
import request from 'supertest';
import { createApp } from '../../src/server-integration-example';
import { VendorAccessDelegationService } from '../../src/services/vendor-access/VendorAccessDelegationService';
import VendorAccessDatabaseAdapter from '../../src/services/database/VendorAccessDatabaseAdapter';
import { createVendorAccessContainer } from '../../src/routes/vendor-access';

// ============================================
// 🔧 TEST SETUP
// ============================================

// Test database configuration
const testDbConfig = {
  host: process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT || '5432'),
  database: process.env.TEST_DB_NAME || 'fanz_unified_test',
  user: process.env.TEST_DB_USER || 'postgres',
  password: process.env.TEST_DB_PASSWORD || 'password',
  max: 5
};

let testPool: Pool;
let container: Container;
let app: any;
let vendorService: VendorAccessDelegationService;
let dbAdapter: VendorAccessDatabaseAdapter;

// Test data
const testVendor = {
  email: 'test@vendor.com',
  name: 'Test Vendor',
  company: 'Test Company',
  vendorType: 'support' as const,
  contactInfo: {
    phone: '+1-555-0123',
    address: '123 Test Street'
  }
};

const testAdmin = {
  id: 'admin-123',
  email: 'admin@fanz.com',
  name: 'Test Admin'
};

// ============================================
// 🏗️ TEST LIFECYCLE
// ============================================

beforeAll(async () => {
  // Create test database pool
  testPool = new Pool(testDbConfig);
  
  // Create container and services
  container = createVendorAccessContainer(testPool);
  vendorService = container.get<VendorAccessDelegationService>(VendorAccessDelegationService);
  dbAdapter = container.get<VendorAccessDatabaseAdapter>(VendorAccessDatabaseAdapter);
  
  // Create Express app
  process.env.DB_NAME = testDbConfig.database;
  process.env.DB_HOST = testDbConfig.host;
  process.env.DB_PORT = testDbConfig.port.toString();
  process.env.DB_USER = testDbConfig.user;
  process.env.DB_PASSWORD = testDbConfig.password;
  process.env.VENDOR_JWT_SECRET = 'test-secret-key-for-vendor-tokens';
  
  app = createApp();
  
  // Wait for database to be ready
  try {
    const client = await testPool.connect();
    client.release();
    console.log('✅ Test database connected');
  } catch (error) {
    console.error('❌ Test database connection failed:', error);
    throw error;
  }
});

afterAll(async () => {
  if (testPool) {
    await testPool.end();
  }
});

beforeEach(async () => {
  // Clean up test data before each test
  await cleanTestData();
});

afterEach(async () => {
  // Clean up test data after each test
  await cleanTestData();
});

async function cleanTestData() {
  try {
    const client = await testPool.connect();
    await client.query('DELETE FROM vendor_audit_logs WHERE vendor_id LIKE $1', ['test-%']);
    await client.query('DELETE FROM vendor_activities WHERE vendor_id LIKE $1', ['test-%']);
    await client.query('DELETE FROM vendor_sessions WHERE vendor_id LIKE $1', ['test-%']);
    await client.query('DELETE FROM vendor_access_tokens WHERE vendor_id LIKE $1', ['test-%']);
    await client.query('DELETE FROM access_grants WHERE vendor_id LIKE $1', ['test-%']);
    await client.query('DELETE FROM vendor_profiles WHERE id LIKE $1', ['test-%']);
    client.release();
  } catch (error) {
    console.warn('Warning: Failed to clean test data:', error);
  }
}

// ============================================
// 🧪 VENDOR PROFILE TESTS
// ============================================

describe('Vendor Profile Management', () => {
  it('should register a new vendor', async () => {
    const vendor = await vendorService.registerVendor(testVendor);
    
    expect(vendor).toBeDefined();
    expect(vendor.email).toBe(testVendor.email);
    expect(vendor.name).toBe(testVendor.name);
    expect(vendor.company).toBe(testVendor.company);
    expect(vendor.status).toBe('pending');
    expect(vendor.id).toMatch(/^test-/);
  });

  it('should prevent duplicate vendor registration', async () => {
    // Register first vendor
    await vendorService.registerVendor(testVendor);
    
    // Try to register same email again
    await expect(vendorService.registerVendor(testVendor))
      .rejects.toThrow('Vendor with this email already exists');
  });

  it('should verify vendor profile', async () => {
    const vendor = await vendorService.registerVendor(testVendor);
    
    const verificationData = {
      backgroundCheckCompleted: true,
      ndaSigned: true,
      complianceTrainingCompleted: true
    };
    
    await vendorService.verifyVendor(vendor.id, verificationData, testAdmin.id);
    
    const updatedVendor = await dbAdapter.findVendorById(vendor.id);
    expect(updatedVendor?.status).toBe('approved');
    expect(updatedVendor?.verification.backgroundCheckCompleted).toBe(true);
  });

  it('should list vendors with pagination', async () => {
    // Create multiple vendors
    for (let i = 0; i < 5; i++) {
      await vendorService.registerVendor({
        ...testVendor,
        email: `test${i}@vendor.com`,
        name: `Test Vendor ${i}`
      });
    }
    
    const result = await vendorService.listVendors(
      { status: 'pending' },
      { page: 1, limit: 3 }
    );
    
    expect(result.vendors).toHaveLength(3);
    expect(result.total).toBe(5);
    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(2);
  });
});

// ============================================
// 🎟️ ACCESS GRANT TESTS
// ============================================

describe('Access Grant Management', () => {
  let testVendorId: string;
  
  beforeEach(async () => {
    const vendor = await vendorService.registerVendor(testVendor);
    testVendorId = vendor.id;
    
    // Verify the vendor
    await vendorService.verifyVendor(testVendorId, {
      backgroundCheckCompleted: true,
      ndaSigned: true,
      complianceTrainingCompleted: true
    }, testAdmin.id);
  });

  it('should create access grant', async () => {
    const grantRequest = {
      vendorId: testVendorId,
      categories: ['content-moderation', 'customer-support'],
      accessLevel: 'read' as const,
      duration: 24, // 24 hours
      reason: 'Content review assistance',
      restrictions: {
        ipWhitelist: ['192.168.1.100'],
        maxConcurrentSessions: 1
      }
    };
    
    const grant = await vendorService.createAccessGrant(grantRequest, testAdmin.id);
    
    expect(grant).toBeDefined();
    expect(grant.vendorId).toBe(testVendorId);
    expect(grant.categories).toEqual(grantRequest.categories);
    expect(grant.accessLevel).toBe('read');
    expect(grant.status).toBe('pending_approval');
  });

  it('should approve access grant', async () => {
    // Create grant
    const grant = await vendorService.createAccessGrant({
      vendorId: testVendorId,
      categories: ['analytics-readonly'],
      accessLevel: 'read' as const,
      duration: 8,
      reason: 'Analytics review'
    }, testAdmin.id);
    
    // Approve grant
    await vendorService.approveAccessGrant(grant.id, testAdmin.id);
    
    const updatedGrant = await dbAdapter.findAccessGrantById(grant.id);
    expect(updatedGrant?.approval.approved).toBe(true);
    expect(updatedGrant?.status).toBe('active');
  });

  it('should generate access token for approved grant', async () => {
    // Create and approve grant
    const grant = await vendorService.createAccessGrant({
      vendorId: testVendorId,
      categories: ['content-moderation'],
      accessLevel: 'read' as const,
      duration: 4,
      reason: 'Emergency content review'
    }, testAdmin.id);
    
    await vendorService.approveAccessGrant(grant.id, testAdmin.id);
    
    // Generate token
    const tokenResponse = await vendorService.generateAccessToken(grant.id, testAdmin.id);
    
    expect(tokenResponse.token).toBeDefined();
    expect(tokenResponse.expiresAt).toBeDefined();
    expect(tokenResponse.grantId).toBe(grant.id);
  });

  it('should validate access token', async () => {
    // Create approved grant and token
    const grant = await vendorService.createAccessGrant({
      vendorId: testVendorId,
      categories: ['analytics-readonly'],
      accessLevel: 'read' as const,
      duration: 2,
      reason: 'Data analysis'
    }, testAdmin.id);
    
    await vendorService.approveAccessGrant(grant.id, testAdmin.id);
    const tokenResponse = await vendorService.generateAccessToken(grant.id, testAdmin.id);
    
    // Validate token
    const validation = await vendorService.validateAccessToken(tokenResponse.token);
    
    expect(validation.valid).toBe(true);
    expect(validation.vendor?.id).toBe(testVendorId);
    expect(validation.grant?.categories).toContain('analytics-readonly');
  });

  it('should revoke access grant', async () => {
    // Create approved grant
    const grant = await vendorService.createAccessGrant({
      vendorId: testVendorId,
      categories: ['customer-support'],
      accessLevel: 'read' as const,
      duration: 12,
      reason: 'Support assistance'
    }, testAdmin.id);
    
    await vendorService.approveAccessGrant(grant.id, testAdmin.id);
    
    // Revoke grant
    await vendorService.revokeAccessGrant(grant.id, testAdmin.id, 'No longer needed');
    
    const revokedGrant = await dbAdapter.findAccessGrantById(grant.id);
    expect(revokedGrant?.status).toBe('revoked');
  });
});

// ============================================
// 🚨 EMERGENCY CONTROLS TESTS
// ============================================

describe('Emergency Controls', () => {
  let testVendorId: string;
  let approvedGrantId: string;
  
  beforeEach(async () => {
    // Create and approve vendor with grant
    const vendor = await vendorService.registerVendor(testVendor);
    testVendorId = vendor.id;
    
    await vendorService.verifyVendor(testVendorId, {
      backgroundCheckCompleted: true,
      ndaSigned: true,
      complianceTrainingCompleted: true
    }, testAdmin.id);
    
    const grant = await vendorService.createAccessGrant({
      vendorId: testVendorId,
      categories: ['content-moderation'],
      accessLevel: 'read' as const,
      duration: 8,
      reason: 'Regular access'
    }, testAdmin.id);
    
    await vendorService.approveAccessGrant(grant.id, testAdmin.id);
    approvedGrantId = grant.id;
  });

  it('should emergency revoke all vendor access', async () => {
    // Generate token first
    await vendorService.generateAccessToken(approvedGrantId, testAdmin.id);
    
    // Emergency revoke all
    await vendorService.emergencyRevokeAll(testAdmin.id, 'Security breach detected');
    
    // Check that grant was revoked
    const grant = await dbAdapter.findAccessGrantById(approvedGrantId);
    expect(grant?.status).toBe('revoked');
  });

  it('should emergency revoke specific vendor access', async () => {
    // Generate token first
    await vendorService.generateAccessToken(approvedGrantId, testAdmin.id);
    
    // Emergency revoke vendor
    await vendorService.emergencyRevokeVendor(testVendorId, testAdmin.id, 'Suspicious activity');
    
    // Check that vendor's grants were revoked
    const grant = await dbAdapter.findAccessGrantById(approvedGrantId);
    expect(grant?.status).toBe('revoked');
  });
});

// ============================================
// 📊 ANALYTICS TESTS
// ============================================

describe('Analytics and Reporting', () => {
  beforeEach(async () => {
    // Create some test data
    const vendor = await vendorService.registerVendor(testVendor);
    
    await vendorService.verifyVendor(vendor.id, {
      backgroundCheckCompleted: true,
      ndaSigned: true,
      complianceTrainingCompleted: true
    }, testAdmin.id);
    
    const grant = await vendorService.createAccessGrant({
      vendorId: vendor.id,
      categories: ['analytics-readonly'],
      accessLevel: 'read' as const,
      duration: 4,
      reason: 'Analytics review'
    }, testAdmin.id);
    
    await vendorService.approveAccessGrant(grant.id, testAdmin.id);
  });

  it('should get access analytics', async () => {
    const analytics = await vendorService.getAnalytics({
      start: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
      end: new Date()
    });
    
    expect(analytics).toBeDefined();
    expect(analytics.totalVendors).toBeGreaterThan(0);
    expect(analytics.totalGrants).toBeGreaterThan(0);
  });
});

// ============================================
// 🌐 API ENDPOINT TESTS
// ============================================

describe('API Endpoints', () => {
  it('should register vendor via API', async () => {
    const response = await request(app)
      .post('/api/vendor-access/vendors')
      .send(testVendor)
      .expect(201);
    
    expect(response.body.vendor.email).toBe(testVendor.email);
    expect(response.body.vendor.status).toBe('pending');
  });

  it('should get health status', async () => {
    const response = await request(app)
      .get('/api/vendor-access/health')
      .expect(200);
    
    expect(response.body.status).toBe('healthy');
    expect(response.body.services).toBeDefined();
  });

  it('should require authentication for protected routes', async () => {
    await request(app)
      .get('/api/vendor-access/vendors')
      .expect(401);
  });

  it('should validate vendor access token in API', async () => {
    // Create vendor and approved grant
    const vendor = await vendorService.registerVendor(testVendor);
    await vendorService.verifyVendor(vendor.id, {
      backgroundCheckCompleted: true,
      ndaSigned: true,
      complianceTrainingCompleted: true
    }, testAdmin.id);
    
    const grant = await vendorService.createAccessGrant({
      vendorId: vendor.id,
      categories: ['content-moderation'],
      accessLevel: 'read' as const,
      duration: 2,
      reason: 'API test'
    }, testAdmin.id);
    
    await vendorService.approveAccessGrant(grant.id, testAdmin.id);
    const tokenResponse = await vendorService.generateAccessToken(grant.id, testAdmin.id);
    
    // Test token validation endpoint
    const response = await request(app)
      .post('/api/vendor-access/tokens/validate')
      .send({ token: tokenResponse.token })
      .expect(200);
    
    expect(response.body.valid).toBe(true);
    expect(response.body.vendor.id).toBe(vendor.id);
  });
});

// ============================================
// 🛡️ MIDDLEWARE TESTS
// ============================================

describe('Vendor Access Middleware', () => {
  let validToken: string;
  let testVendorId: string;
  
  beforeEach(async () => {
    // Create vendor with approved grant and token
    const vendor = await vendorService.registerVendor(testVendor);
    testVendorId = vendor.id;
    
    await vendorService.verifyVendor(testVendorId, {
      backgroundCheckCompleted: true,
      ndaSigned: true,
      complianceTrainingCompleted: true
    }, testAdmin.id);
    
    const grant = await vendorService.createAccessGrant({
      vendorId: testVendorId,
      categories: ['analytics-readonly'],
      accessLevel: 'read' as const,
      duration: 1,
      reason: 'Middleware test'
    }, testAdmin.id);
    
    await vendorService.approveAccessGrant(grant.id, testAdmin.id);
    const tokenResponse = await vendorService.generateAccessToken(grant.id, testAdmin.id);
    validToken = tokenResponse.token;
  });

  it('should allow access with valid token and permission', async () => {
    const response = await request(app)
      .get('/api/analytics/advanced')
      .set('Authorization', `Bearer ${validToken}`)
      .expect(200);
    
    expect(response.body.message).toBe('Advanced analytics data');
  });

  it('should deny access without token', async () => {
    await request(app)
      .get('/api/analytics/advanced')
      .expect(401);
  });

  it('should deny access with invalid token', async () => {
    await request(app)
      .get('/api/analytics/advanced')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);
  });

  it('should deny access with insufficient permissions', async () => {
    // This endpoint requires 'full' access but vendor only has 'read'
    await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${validToken}`)
      .expect(403);
  });
});

// ============================================
// 🗄️ DATABASE ADAPTER TESTS
// ============================================

describe('Database Adapter', () => {
  it('should insert and retrieve vendor', async () => {
    const vendorData = {
      id: 'test-db-vendor-1',
      email: 'dbtest@vendor.com',
      name: 'DB Test Vendor',
      company: 'Test DB Company',
      vendorType: 'support' as const,
      contactInfo: { phone: '+1-555-0123' },
      verification: {
        backgroundCheckCompleted: false,
        backgroundCheckDate: null,
        ndaSigned: false,
        ndaSignedDate: null,
        complianceTrainingCompleted: false,
        complianceTrainingDate: null
      },
      status: 'pending' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const inserted = await dbAdapter.insertVendor(vendorData);
    expect(inserted.email).toBe(vendorData.email);
    
    const retrieved = await dbAdapter.findVendorById(vendorData.id);
    expect(retrieved?.email).toBe(vendorData.email);
  });

  it('should handle database transactions', async () => {
    const result = await dbAdapter.transaction(async (client) => {
      // Perform multiple operations in transaction
      await client.query('SELECT 1');
      return { success: true };
    });
    
    expect(result.success).toBe(true);
  });

  it('should count records correctly', async () => {
    // Insert test vendor
    await vendorService.registerVendor({
      ...testVendor,
      email: 'count-test@vendor.com'
    });
    
    const count = await dbAdapter.countRecords('vendor_profiles', { status: 'pending' });
    expect(count).toBeGreaterThan(0);
  });
});

// ============================================
// 🧹 CLEANUP AND VALIDATION TESTS
// ============================================

describe('System Cleanup and Validation', () => {
  it('should clean up expired tokens', async () => {
    // Create vendor and grant
    const vendor = await vendorService.registerVendor({
      ...testVendor,
      email: 'cleanup-test@vendor.com'
    });
    
    await vendorService.verifyVendor(vendor.id, {
      backgroundCheckCompleted: true,
      ndaSigned: true,
      complianceTrainingCompleted: true
    }, testAdmin.id);
    
    // Create grant with very short duration
    const grant = await vendorService.createAccessGrant({
      vendorId: vendor.id,
      categories: ['customer-support'],
      accessLevel: 'read' as const,
      duration: 0.001, // Very short duration
      reason: 'Cleanup test'
    }, testAdmin.id);
    
    await vendorService.approveAccessGrant(grant.id, testAdmin.id);
    const tokenResponse = await vendorService.generateAccessToken(grant.id, testAdmin.id);
    
    // Wait for token to expire
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Token should now be invalid
    const validation = await vendorService.validateAccessToken(tokenResponse.token);
    expect(validation.valid).toBe(false);
    expect(validation.reason).toContain('expired');
  });

  it('should maintain audit trail', async () => {
    const vendor = await vendorService.registerVendor({
      ...testVendor,
      email: 'audit-test@vendor.com'
    });
    
    // Verify audit log was created
    const client = await testPool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM vendor_audit_logs WHERE vendor_id = $1 AND action = $2',
        [vendor.id, 'vendor_registered']
      );
      expect(result.rows.length).toBeGreaterThan(0);
    } finally {
      client.release();
    }
  });
});

console.log('🧪 Vendor Access Test Suite Loaded');