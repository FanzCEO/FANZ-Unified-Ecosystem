// 🔧 FANZ Backend - Global Test Setup
import { config } from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export default async function globalSetup() {
  console.log('🚀 Setting up test environment...');
  
  // Load test environment variables
  config({ path: '.env.test' });
  
  try {
    // Set up test database if needed
    await setupTestDatabase();
    
    // Start test services (Redis, etc.)
    await startTestServices();
    
    console.log('✅ Test environment setup complete');
  } catch (error) {
    console.error('❌ Test setup failed:', error);
    throw error;
  }
}

async function setupTestDatabase() {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl || dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1')) {
    console.log('📊 Setting up test database...');
    
    try {
      // Create test database if it doesn't exist
      const dbName = process.env.DATABASE_NAME || 'fanz_test';
      
      // Check if database exists, create if not
      await execAsync(`createdb ${dbName} 2>/dev/null || echo "Database ${dbName} already exists"`);
      
      console.log('✅ Test database ready');
    } catch (error) {
      console.warn('⚠️ Could not create test database, assuming it exists:', error);
    }
  }
}

async function startTestServices() {
  // Check if Redis is available for tests
  const redisUrl = process.env.REDIS_URL;
  
  if (redisUrl && (redisUrl.includes('localhost') || redisUrl.includes('127.0.0.1'))) {
    console.log('🔴 Checking Redis availability...');
    
    try {
      // Try to connect to Redis
      await execAsync('redis-cli ping');
      console.log('✅ Redis is available');
    } catch (error) {
      console.log('⚠️ Redis not available, tests will use in-memory cache');
    }
  }
}