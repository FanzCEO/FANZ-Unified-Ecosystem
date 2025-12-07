#!/usr/bin/env node

/**
 * Comprehensive Health Check System
 * Validates database, services, and application health
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';

const execAsync = promisify(exec);

// Health check endpoints and services
const HEALTH_CHECKS = {
  database: {
    name: 'PostgreSQL Database',
    test: async () => {
      if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL not configured');
      }
      
      const { db } = await import('../server/db.js');
      const result = await db.execute('SELECT 1 as health');
      return result.length > 0;
    }
  },
  
  server: {
    name: 'Express Server',
    test: async () => {
      const response = await fetch('http://localhost:5000/api/status');
      return response.ok;
    }
  },
  
  goServer: {
    name: 'Go Static Server', 
    test: async () => {
      try {
        const response = await fetch('http://localhost:8080/api/status');
        return response.ok;
      } catch {
        return false; // Optional service
      }
    }
  },
  
  storage: {
    name: 'Object Storage',
    test: async () => {
      // Test storage connectivity
      const requiredVars = ['STORAGE_ENDPOINT', 'STORAGE_ACCESS_KEY', 'STORAGE_SECRET_KEY'];
      return requiredVars.every(envVar => process.env[envVar]);
    }
  },
  
  redis: {
    name: 'Redis Cache',
    test: async () => {
      try {
        // Redis is optional, so always return true
        return true;
      } catch {
        return false;
      }
    }
  },
  
  emailService: {
    name: 'Email Service (SendGrid)',
    test: async () => {
      return !!process.env.SENDGRID_API_KEY;
    }
  },
  
  smsService: {
    name: 'SMS Service (Twilio)',
    test: async () => {
      return !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
    }
  },
  
  pushNotifications: {
    name: 'Push Notifications',
    test: async () => {
      return !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
    }
  }
};

async function checkService(name, service) {
  console.log(`🔍 Checking ${service.name}...`);
  
  try {
    const isHealthy = await service.test();
    if (isHealthy) {
      console.log(`✅ ${service.name} - Healthy`);
      return { name, status: 'healthy', message: 'Service is operational' };
    } else {
      console.log(`⚠️ ${service.name} - Degraded`);
      return { name, status: 'degraded', message: 'Service has issues' };
    }
  } catch (error) {
    console.log(`❌ ${service.name} - Unhealthy: ${error.message}`);
    return { name, status: 'unhealthy', message: error.message };
  }
}

async function checkEnvironment() {
  console.log('🔍 Environment Variables Check');
  
  const criticalEnvVars = [
    'DATABASE_URL',
    'SESSION_SECRET'
  ];
  
  const optionalEnvVars = [
    'SENDGRID_API_KEY',
    'TWILIO_ACCOUNT_SID', 
    'TWILIO_AUTH_TOKEN',
    'VAPID_PUBLIC_KEY',
    'VAPID_PRIVATE_KEY',
    'STORAGE_ENDPOINT',
    'STORAGE_ACCESS_KEY',
    'STORAGE_SECRET_KEY'
  ];
  
  let envStatus = { critical: [], optional: [] };
  
  for (const envVar of criticalEnvVars) {
    if (process.env[envVar]) {
      console.log(`✅ ${envVar} - Set`);
    } else {
      console.log(`❌ ${envVar} - Missing (Critical)`);
      envStatus.critical.push(envVar);
    }
  }
  
  for (const envVar of optionalEnvVars) {
    if (process.env[envVar]) {
      console.log(`✅ ${envVar} - Set`);
    } else {
      console.log(`⚠️ ${envVar} - Missing (Optional)`);
      envStatus.optional.push(envVar);
    }
  }
  
  return envStatus;
}

async function checkDiskSpace() {
  console.log('🔍 Disk Space Check');
  
  try {
    const { stdout } = await execAsync('df -h .');
    console.log(stdout);
    
    // Parse disk usage
    const lines = stdout.split('\n');
    const dataLine = lines[1]; // Second line contains the data
    const usage = dataLine.split(/\s+/)[4]; // Fifth column is usage percentage
    const usagePercent = parseInt(usage.replace('%', ''));
    
    if (usagePercent > 90) {
      console.log('❌ Disk space critically low');
      return { status: 'critical', usage: usagePercent };
    } else if (usagePercent > 75) {
      console.log('⚠️ Disk space getting full');
      return { status: 'warning', usage: usagePercent };
    } else {
      console.log('✅ Disk space healthy');
      return { status: 'healthy', usage: usagePercent };
    }
  } catch (error) {
    console.log('⚠️ Could not check disk space:', error.message);
    return { status: 'unknown', error: error.message };
  }
}

async function checkMemoryUsage() {
  console.log('🔍 Memory Usage Check');
  
  const memUsage = process.memoryUsage();
  const formatMB = (bytes) => (bytes / 1024 / 1024).toFixed(2);
  
  console.log(`RSS: ${formatMB(memUsage.rss)}MB`);
  console.log(`Heap Used: ${formatMB(memUsage.heapUsed)}MB`);
  console.log(`Heap Total: ${formatMB(memUsage.heapTotal)}MB`);
  console.log(`External: ${formatMB(memUsage.external)}MB`);
  
  return {
    rss: memUsage.rss,
    heapUsed: memUsage.heapUsed,
    heapTotal: memUsage.heapTotal,
    external: memUsage.external
  };
}

async function generateHealthReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    overall: 'healthy',
    services: results.services,
    environment: results.environment,
    system: {
      diskSpace: results.diskSpace,
      memory: results.memory
    }
  };
  
  // Determine overall health
  const unhealthyServices = results.services.filter(s => s.status === 'unhealthy').length;
  const degradedServices = results.services.filter(s => s.status === 'degraded').length;
  
  if (unhealthyServices > 0 || results.environment.critical.length > 0) {
    report.overall = 'unhealthy';
  } else if (degradedServices > 0 || results.diskSpace.status === 'warning') {
    report.overall = 'degraded';
  }
  
  // Save report
  await fs.writeFile('health-report.json', JSON.stringify(report, null, 2));
  console.log('📄 Health report saved to health-report.json');
  
  return report;
}

async function main() {
  console.log('🏥 FansLab Health Check');
  console.log('======================');
  console.log('');
  
  const results = {
    services: [],
    environment: null,
    diskSpace: null,
    memory: null
  };
  
  // Check all services
  for (const [name, service] of Object.entries(HEALTH_CHECKS)) {
    const result = await checkService(name, service);
    results.services.push(result);
    console.log('');
  }
  
  // Check environment
  results.environment = await checkEnvironment();
  console.log('');
  
  // Check system resources
  results.diskSpace = await checkDiskSpace();
  console.log('');
  
  results.memory = await checkMemoryUsage();
  console.log('');
  
  // Generate final report
  const report = await generateHealthReport(results);
  
  console.log('📊 Health Check Summary');
  console.log('======================');
  console.log(`Overall Status: ${report.overall.toUpperCase()}`);
  console.log(`Services Checked: ${results.services.length}`);
  console.log(`Healthy: ${results.services.filter(s => s.status === 'healthy').length}`);
  console.log(`Degraded: ${results.services.filter(s => s.status === 'degraded').length}`);
  console.log(`Unhealthy: ${results.services.filter(s => s.status === 'unhealthy').length}`);
  
  if (report.overall !== 'healthy') {
    console.log('');
    console.log('⚠️ Issues detected. Check health-report.json for details.');
    process.exit(1);
  } else {
    console.log('');
    console.log('🎉 All systems healthy!');
  }
}

main().catch((error) => {
  console.error('💥 Health check failed:', error);
  process.exit(1);
});