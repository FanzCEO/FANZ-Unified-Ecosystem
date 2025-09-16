/**
 * 🌱 FANZ Vendor Access Seed Data Script
 * 
 * Creates sample vendor profiles, access grants, and test data
 * for development and testing of the vendor access delegation system.
 */

import { Pool } from 'pg';
import { Container } from 'inversify';
import { VendorAccessDelegationService } from '../src/services/vendor-access/VendorAccessDelegationService';
import { createVendorAccessContainer } from '../src/routes/vendor-access';

// ============================================
// 🔧 CONFIGURATION
// ============================================

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'fanz_unified',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password'
};

// ============================================
// 📊 SEED DATA DEFINITIONS
// ============================================

const seedVendors = [
  {
    email: 'support@ccbill.com',
    name: 'CCBill Support Team',
    company: 'CCBill LLC',
    vendorType: 'payment' as const,
    contactInfo: {
      phone: '+1-888-596-6873',
      address: '2353 E Kemper Rd, Cincinnati, OH 45241',
      website: 'https://ccbill.com',
      primaryContact: 'Sarah Johnson',
      emergencyContact: '+1-888-596-6873'
    }
  },
  {
    email: 'tech@paxum.com',
    name: 'Paxum Technical Support',
    company: 'Paxum Inc.',
    vendorType: 'payment' as const,
    contactInfo: {
      phone: '+1-866-729-8601',
      address: 'Suite 2500, 700 W Georgia St, Vancouver, BC V7Y 1B3, Canada',
      website: 'https://paxum.com',
      primaryContact: 'Michael Chen',
      emergencyContact: '+1-866-729-8601'
    }
  },
  {
    email: 'moderation@moderationai.com',
    name: 'Content Moderation AI Team',
    company: 'ModerationAI Solutions',
    vendorType: 'content' as const,
    contactInfo: {
      phone: '+1-555-0199',
      address: '123 Tech Boulevard, San Francisco, CA 94107',
      website: 'https://moderationai.com',
      primaryContact: 'Emma Rodriguez',
      emergencyContact: '+1-555-0199'
    }
  },
  {
    email: 'support@dataanalytics.co',
    name: 'Data Analytics Pro',
    company: 'Analytics Corporation',
    vendorType: 'analytics' as const,
    contactInfo: {
      phone: '+1-555-0167',
      address: '456 Analytics Ave, Austin, TX 73301',
      website: 'https://dataanalytics.co',
      primaryContact: 'James Wilson',
      emergencyContact: '+1-555-0167'
    }
  },
  {
    email: 'help@customersupport.io',
    name: 'Customer Success Team',
    company: 'Support Solutions LLC',
    vendorType: 'support' as const,
    contactInfo: {
      phone: '+1-555-0134',
      address: '789 Support Street, Denver, CO 80202',
      website: 'https://customersupport.io',
      primaryContact: 'Lisa Anderson',
      emergencyContact: '+1-555-0134'
    }
  },
  {
    email: 'compliance@legaltech.com',
    name: 'Compliance & Legal Tech',
    company: 'LegalTech Solutions',
    vendorType: 'compliance' as const,
    contactInfo: {
      phone: '+1-555-0188',
      address: '321 Legal Lane, Washington, DC 20001',
      website: 'https://legaltech.com',
      primaryContact: 'Robert Kim',
      emergencyContact: '+1-555-0188'
    }
  }
];

const adminUser = {
  id: 'admin-joshua-stone',
  email: 'joshua@fanz.com',
  name: 'Joshua Stone'
};

const grantTemplates = [
  {
    categories: ['payment-processing'],
    accessLevel: 'full' as const,
    duration: 168, // 1 week
    reason: 'Payment processor integration and support',
    restrictions: {
      ipWhitelist: ['*'], // Allow from anywhere for payment processors
      maxConcurrentSessions: 3,
      allowedEndpoints: ['/api/payments/*', '/api/transactions/*']
    }
  },
  {
    categories: ['content-moderation'],
    accessLevel: 'read' as const,
    duration: 72, // 3 days
    reason: 'Content review and moderation assistance',
    restrictions: {
      maxConcurrentSessions: 2,
      allowedEndpoints: ['/api/content/moderate', '/api/content/review']
    }
  },
  {
    categories: ['analytics-readonly'],
    accessLevel: 'read' as const,
    duration: 24, // 1 day
    reason: 'Performance analytics review',
    restrictions: {
      maxConcurrentSessions: 1,
      allowedEndpoints: ['/api/analytics/*']
    }
  },
  {
    categories: ['customer-support'],
    accessLevel: 'read' as const,
    duration: 48, // 2 days
    reason: 'Customer support assistance',
    restrictions: {
      maxConcurrentSessions: 5,
      allowedEndpoints: ['/api/users/support', '/api/tickets/*']
    }
  },
  {
    categories: ['admin-panel-staff'],
    accessLevel: 'read' as const,
    duration: 12, // 12 hours
    reason: 'Administrative assistance',
    restrictions: {
      maxConcurrentSessions: 1,
      allowedEndpoints: ['/api/admin/*']
    }
  }
];

// ============================================
// 🌱 SEEDING FUNCTIONS
// ============================================

class VendorAccessSeeder {
  private pool: Pool;
  private container: Container;
  private service: VendorAccessDelegationService;

  constructor() {
    this.pool = new Pool(dbConfig);
    this.container = createVendorAccessContainer(this.pool);
    this.service = this.container.get<VendorAccessDelegationService>(VendorAccessDelegationService);
  }

  async seed(): Promise<void> {
    console.log('🌱 Starting FANZ Vendor Access Seeding...\n');

    try {
      // Test database connection
      await this.testConnection();
      
      // Clean existing seed data
      await this.cleanSeedData();
      
      // Create vendors
      const vendors = await this.seedVendors();
      
      // Verify vendors
      await this.verifyVendors(vendors);
      
      // Create access grants
      await this.seedAccessGrants(vendors);
      
      // Generate some tokens
      await this.generateSampleTokens(vendors);
      
      // Display summary
      await this.displaySummary();
      
      console.log('\n✅ Vendor Access Seeding Completed Successfully!');
      
    } catch (error) {
      console.error('❌ Seeding failed:', error);
      throw error;
    } finally {
      await this.pool.end();
    }
  }

  private async testConnection(): Promise<void> {
    console.log('🔗 Testing database connection...');
    const client = await this.pool.connect();
    try {
      await client.query('SELECT 1');
      console.log('✅ Database connection successful\n');
    } finally {
      client.release();
    }
  }

  private async cleanSeedData(): Promise<void> {
    console.log('🧹 Cleaning existing seed data...');
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Delete in reverse dependency order
      await client.query("DELETE FROM vendor_audit_logs WHERE action LIKE '%seed%'");
      await client.query("DELETE FROM vendor_activities WHERE vendor_id IN (SELECT id FROM vendor_profiles WHERE email LIKE '%@%.com')");
      await client.query("DELETE FROM vendor_sessions WHERE vendor_id IN (SELECT id FROM vendor_profiles WHERE email LIKE '%@%.com')");
      await client.query("DELETE FROM vendor_access_tokens WHERE vendor_id IN (SELECT id FROM vendor_profiles WHERE email LIKE '%@%.com')");
      await client.query("DELETE FROM access_grants WHERE vendor_id IN (SELECT id FROM vendor_profiles WHERE email LIKE '%@%.com')");
      await client.query("DELETE FROM vendor_profiles WHERE email LIKE '%@%.com'");
      
      await client.query('COMMIT');
      console.log('✅ Seed data cleaned\n');
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async seedVendors(): Promise<any[]> {
    console.log('👤 Creating vendor profiles...');
    const createdVendors: any[] = [];
    
    for (const vendorData of seedVendors) {
      try {
        const vendor = await this.service.registerVendor(vendorData);
        createdVendors.push(vendor);
        console.log(`  ✅ Created: ${vendor.name} (${vendor.email})`);
      } catch (error) {
        console.log(`  ❌ Failed to create ${vendorData.name}: ${error}`);
      }
    }
    
    console.log(`\n📊 Created ${createdVendors.length}/${seedVendors.length} vendors\n`);
    return createdVendors;
  }

  private async verifyVendors(vendors: any[]): Promise<void> {
    console.log('✅ Verifying vendor profiles...');
    
    const verificationData = {
      backgroundCheckCompleted: true,
      ndaSigned: true,
      complianceTrainingCompleted: true
    };
    
    for (const vendor of vendors) {
      try {
        await this.service.verifyVendor(vendor.id, verificationData, adminUser.id);
        console.log(`  ✅ Verified: ${vendor.name}`);
      } catch (error) {
        console.log(`  ❌ Failed to verify ${vendor.name}: ${error}`);
      }
    }
    
    console.log(`\n📊 Verified ${vendors.length} vendors\n`);
  }

  private async seedAccessGrants(vendors: any[]): Promise<void> {
    console.log('🎟️ Creating access grants...');
    let grantCount = 0;
    
    for (const vendor of vendors) {
      // Determine appropriate grant template based on vendor type
      const grantTemplate = this.getGrantTemplateForVendor(vendor);
      
      if (grantTemplate) {
        try {
          const grant = await this.service.createAccessGrant({
            vendorId: vendor.id,
            categories: grantTemplate.categories,
            accessLevel: grantTemplate.accessLevel,
            duration: grantTemplate.duration,
            reason: `${grantTemplate.reason} for ${vendor.company}`,
            restrictions: grantTemplate.restrictions
          }, adminUser.id);
          
          // Auto-approve some grants for testing
          if (Math.random() > 0.3) { // 70% approval rate
            await this.service.approveAccessGrant(grant.id, adminUser.id);
            console.log(`  ✅ Created & Approved: ${vendor.name} - ${grantTemplate.categories.join(', ')}`);
          } else {
            console.log(`  📋 Created (Pending): ${vendor.name} - ${grantTemplate.categories.join(', ')}`);
          }
          
          grantCount++;
          
        } catch (error) {
          console.log(`  ❌ Failed to create grant for ${vendor.name}: ${error}`);
        }
      }
    }
    
    console.log(`\n📊 Created ${grantCount} access grants\n`);
  }

  private getGrantTemplateForVendor(vendor: any) {
    switch (vendor.vendorType) {
      case 'payment':
        return grantTemplates[0]; // payment-processing
      case 'content':
        return grantTemplates[1]; // content-moderation
      case 'analytics':
        return grantTemplates[2]; // analytics-readonly
      case 'support':
        return grantTemplates[3]; // customer-support
      case 'compliance':
        return grantTemplates[4]; // admin-panel-staff
      default:
        return grantTemplates[3]; // Default to customer-support
    }
  }

  private async generateSampleTokens(vendors: any[]): Promise<void> {
    console.log('🔑 Generating sample access tokens...');
    let tokenCount = 0;
    
    // Get approved grants
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT ag.*, vp.name as vendor_name 
        FROM access_grants ag 
        JOIN vendor_profiles vp ON ag.vendor_id = vp.id 
        WHERE ag.approved = true AND ag.status = 'active'
        LIMIT 3
      `);
      
      for (const grantRow of result.rows) {
        try {
          const tokenResponse = await this.service.generateAccessToken(grantRow.id, adminUser.id);
          console.log(`  🔑 Token generated for: ${grantRow.vendor_name} (expires: ${new Date(tokenResponse.expiresAt).toLocaleString()})`);
          tokenCount++;
        } catch (error) {
          console.log(`  ❌ Failed to generate token for grant ${grantRow.id}: ${error}`);
        }
      }
      
    } finally {
      client.release();
    }
    
    console.log(`\n📊 Generated ${tokenCount} access tokens\n`);
  }

  private async displaySummary(): Promise<void> {
    console.log('📊 VENDOR ACCESS SYSTEM SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
      const analytics = await this.service.getAnalytics({
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        end: new Date()
      });
      
      console.log(`👥 Total Vendors: ${analytics.totalVendors}`);
      console.log(`✅ Active Vendors: ${analytics.activeVendors}`);
      console.log(`🎟️ Total Grants: ${analytics.totalGrants}`);
      console.log(`🟢 Active Grants: ${analytics.activeGrants}`);
      
      // Get session and token counts
      const client = await this.pool.connect();
      try {
        const sessionResult = await client.query('SELECT COUNT(*) FROM vendor_sessions');
        const tokenResult = await client.query('SELECT COUNT(*) FROM vendor_access_tokens WHERE revoked = false');
        
        console.log(`📱 Active Sessions: ${sessionResult.rows[0].count}`);
        console.log(`🔑 Valid Tokens: ${tokenResult.rows[0].count}`);
        
      } finally {
        client.release();
      }
      
    } catch (error) {
      console.log('❌ Failed to generate summary:', error);
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
}

// ============================================
// 🚀 EXECUTION
// ============================================

async function main() {
  // Load environment variables
  require('dotenv').config();
  
  // Ensure JWT secret is set
  if (!process.env.VENDOR_JWT_SECRET) {
    process.env.VENDOR_JWT_SECRET = 'demo-vendor-jwt-secret-key-for-development';
    console.log('⚠️  Using demo JWT secret. Set VENDOR_JWT_SECRET in production!');
  }
  
  const seeder = new VendorAccessSeeder();
  
  try {
    await seeder.seed();
  } catch (error) {
    console.error('💥 Seeding process failed:', error);
    process.exit(1);
  }
}

// ============================================
// 📋 USAGE INSTRUCTIONS
// ============================================

if (require.main === module) {
  console.log(`
🌱 FANZ Vendor Access Seeding Script
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This script will create sample vendor profiles, access grants,
and tokens for development and testing purposes.

Prerequisites:
1. Database is running and accessible
2. Vendor access tables are created (run migration first)
3. Environment variables are configured

Running:
  npm run seed:vendor-access
  # or
  npx ts-node scripts/seed-vendor-access.ts

What this creates:
• 6 sample vendor profiles (payment, content, analytics, support, compliance)
• Verification records for all vendors
• Access grants with appropriate permissions
• Sample access tokens for testing
• Audit logs and activity records

⚠️  Warning: This will delete existing seed data first!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
  
  main();
}

export default VendorAccessSeeder;