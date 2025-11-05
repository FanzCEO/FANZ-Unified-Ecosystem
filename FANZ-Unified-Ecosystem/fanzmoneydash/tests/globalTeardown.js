/**
 * Jest Global Teardown for FANZ Money Dash
 * Runs once after all test suites complete
 */

export default async function globalTeardown() {
  console.log('🧹 Cleaning up test environment...');
  
  // Clean up any global test resources here
  // For example: stop test database, remove test directories, etc.
  
  console.log('✅ Global test cleanup completed');
};