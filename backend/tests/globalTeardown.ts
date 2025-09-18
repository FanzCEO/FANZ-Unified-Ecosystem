// 🧹 FANZ Backend - Global Test Teardown
export default async function globalTeardown() {
  console.log('🧹 Cleaning up test environment...');
  
  try {
    // Clean up test data
    await cleanupTestData();
    
    // Close any remaining connections
    await closeConnections();
    
    console.log('✅ Test environment cleanup complete');
  } catch (error) {
    console.error('❌ Test cleanup failed:', error);
    // Don't throw error to avoid failing tests due to cleanup issues
  }
}

async function cleanupTestData() {
  // Clean up any test data if needed
  // This could include clearing test database tables, removing test files, etc.
  console.log('📊 Cleaning up test data...');
  
  // Add specific cleanup logic here if needed
  // For example, truncate test database tables
}

async function closeConnections() {
  // Close any remaining database connections, Redis connections, etc.
  console.log('🔌 Closing connections...');
  
  // Force close any remaining handles
  if (process.env.NODE_ENV === 'test') {
    // Allow a brief moment for cleanup
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}