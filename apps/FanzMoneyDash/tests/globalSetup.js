/**
 * Jest Global Setup for FANZ Money Dash
 * Runs once before all test suites
 */

export default async function globalSetup() {
  console.log('🧪 Starting FANZ Money Dash test suite...');
  
  // Set global test environment
  process.env.NODE_ENV = 'test';
  
  // Initialize any global test resources here
  // For example: start test database, create test directories, etc.
  
  console.log('✅ Global test setup completed');
};