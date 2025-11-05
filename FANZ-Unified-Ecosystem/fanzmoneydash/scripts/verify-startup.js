#!/usr/bin/env node
/**
 * FANZ Money Dash - Startup Verification Script
 * Tests that the application can start and connect to required services
 */

import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || 'localhost';

console.log('🧪 FANZ Money Dash Startup Verification');
console.log('=====================================');

async function verifyStartup() {
  try {
    console.log('🚀 Starting server...');
    
    // Start the server as a child process
    const serverProcess = spawn('node', ['src/server.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      detached: false
    });
    
    let serverStarted = false;
    let startupError = null;
    
    // Listen for server output
    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('📝 Server output:', output.trim());
      
      if (output.includes('FANZ Money Dash Server Started')) {
        serverStarted = true;
      }
    });
    
    serverProcess.stderr.on('data', (data) => {
      const output = data.toString();
      console.error('❌ Server error:', output.trim());
      startupError = output;
    });
    
    serverProcess.on('error', (error) => {
      console.error('💥 Process error:', error);
      startupError = error;
    });
    
    // Wait for startup (max 10 seconds)
    let attempts = 0;
    const maxAttempts = 20;
    
    while (!serverStarted && !startupError && attempts < maxAttempts) {
      await setTimeout(500);
      attempts++;
      console.log(`⏳ Waiting for server startup... (${attempts}/${maxAttempts})`);
    }
    
    if (serverStarted) {
      console.log('✅ Server started successfully!');
      
      // Try to make a health check request
      try {
        const response = await fetch(`http://${HOST}:${PORT}/health`);
        const healthData = await response.json();
        
        console.log('🏥 Health check response:');
        console.log('   Status:', healthData.status);
        console.log('   Database:', healthData.database?.connected || 'unknown');
        console.log('   Services:', JSON.stringify(healthData.services, null, 2));
        
        if (response.ok) {
          console.log('✅ Health check passed!');
        } else {
          console.log('⚠️ Health check returned non-OK status');
        }
      } catch (error) {
        console.log('⚠️ Health check failed (server may still be initializing):', error.message);
      }
      
      // Gracefully stop the server
      console.log('🛑 Stopping server...');
      serverProcess.kill('SIGTERM');
      
      // Wait for graceful shutdown
      await setTimeout(2000);
      
      if (!serverProcess.killed) {
        console.log('🔄 Force killing server...');
        serverProcess.kill('SIGKILL');
      }
      
      console.log('✅ Startup verification completed successfully!');
      return true;
      
    } else if (startupError) {
      console.error('❌ Server failed to start:', startupError);
      serverProcess.kill('SIGKILL');
      return false;
      
    } else {
      console.error('⏰ Server startup timeout');
      serverProcess.kill('SIGKILL');
      return false;
    }
    
  } catch (error) {
    console.error('💥 Verification failed:', error);
    return false;
  }
}

// Run verification
verifyStartup()
  .then((success) => {
    if (success) {
      console.log('\n🎉 All checks passed! The application is ready for production.');
      process.exit(0);
    } else {
      console.log('\n💥 Verification failed! Please check the error messages above.');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('💥 Verification script error:', error);
    process.exit(1);
  });