const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function crawlLinks() {
  console.log('🕷️  FanzFiliate Link Crawler');
  console.log('═'.repeat(40));
  
  const report = {
    timestamp: new Date().toISOString(),
    baseUrl: 'http://localhost:5000',
    summary: {
      total: 0,
      successful: 0,
      failed: 0,
      errors: []
    },
    routes: []
  };
  
  // Define expected routes to test
  const routes = [
    { path: '/', name: 'Landing Page' },
    { path: '/dashboard', name: 'Dashboard' },
    { path: '/offers', name: 'Offers Marketplace' },
    { path: '/tracking', name: 'Tracking Links' },
    { path: '/payouts', name: 'Payouts' },
    { path: '/analytics', name: 'Analytics' },
    { path: '/kyc', name: 'KYC Status' },
    { path: '/api/health', name: 'API Health' },
    { path: '/api/offers', name: 'API Offers' },
    { path: '/404-test', name: '404 Test', expectStatus: 404 }
  ];
  
  console.log(`📋 Testing ${routes.length} routes...`);
  
  for (const route of routes) {
    const url = `${report.baseUrl}${route.path}`;
    const expectedStatus = route.expectStatus || 200;
    
    try {
      // Simple fetch test since we can't use Playwright in this environment
      const response = await fetch(url);
      const isSuccess = response.status === expectedStatus;
      
      const routeResult = {
        path: route.path,
        name: route.name,
        url,
        status: response.status,
        expectedStatus,
        success: isSuccess,
        timestamp: new Date().toISOString(),
        details: isSuccess ? 'OK' : `Expected ${expectedStatus}, got ${response.status}`
      };
      
      report.routes.push(routeResult);
      report.summary.total++;
      
      if (isSuccess) {
        report.summary.successful++;
        console.log(`   ✅ ${route.name} (${response.status})`);
      } else {
        report.summary.failed++;
        console.log(`   ❌ ${route.name} - ${routeResult.details}`);
        report.summary.errors.push(`${route.name}: ${routeResult.details}`);
      }
      
    } catch (error) {
      const routeResult = {
        path: route.path,
        name: route.name,
        url,
        status: 0,
        expectedStatus,
        success: false,
        timestamp: new Date().toISOString(),
        details: error.message || 'Network error'
      };
      
      report.routes.push(routeResult);
      report.summary.total++;
      report.summary.failed++;
      
      console.log(`   ❌ ${route.name} - ${routeResult.details}`);
      report.summary.errors.push(`${route.name}: ${routeResult.details}`);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Write report
  const reportPath = path.join(process.cwd(), 'client', 'dist', 'link-report.json');
  
  // Ensure dist directory exists
  const distDir = path.dirname(reportPath);
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\\n📊 Crawl Summary:`);
  console.log(`   Total routes: ${report.summary.total}`);
  console.log(`   Successful: ${report.summary.successful}`);
  console.log(`   Failed: ${report.summary.failed}`);
  console.log(`   Report: ${reportPath}`);
  
  if (report.summary.failed > 0) {
    console.log(`\\n❌ Failed routes:`);
    report.summary.errors.forEach(error => console.log(`   • ${error}`));
    process.exit(1);
  }
  
  console.log(`\\n✅ All routes accessible!`);
}

// Simple fetch polyfill for Node.js if needed
if (!global.fetch) {
  console.log('Installing fetch polyfill...');
  global.fetch = require('node-fetch');
}

// Execute if run directly
if (require.main === module) {
  crawlLinks().catch(error => {
    console.error('❌ Crawl failed:', error);
    process.exit(1);
  });
}

module.exports = { crawlLinks };