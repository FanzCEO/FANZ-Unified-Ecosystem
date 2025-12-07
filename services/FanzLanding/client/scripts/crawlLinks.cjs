const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const base = process.env.WEB_APP_URL || 'http://localhost:5000';
const queue = new Set([base]);
const seen = new Set();
const failures = [];

console.log('Starting link crawl from', base);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

// Track console errors
const consoleErrors = [];
page.on('console', msg => {
  if (msg.type() === 'error') {
    consoleErrors.push(msg.text());
  }
});

while (queue.size > 0) {
  const url = [...queue][0];
  queue.delete(url);
  
  if (seen.has(url)) continue;
  seen.add(url);
  
  try {
    console.log('Crawling:', url);
    const response = await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: 10000 
    });
    
    const status = response?.status() || 0;
    
    if (status >= 400 || status === 0) {
      failures.push({ url, status, consoleErrors: [...consoleErrors] });
      consoleErrors.length = 0; // Clear for next page
      continue;
    }
    
    // Find more links to crawl
    const links = await page.$$eval('a[href]', anchors => 
      anchors.map(a => a.href).filter(Boolean)
    );
    
    for (const link of links) {
      if (link.startsWith(base)) {
        const cleanLink = link.split('#')[0]; // Remove hash fragments
        if (!seen.has(cleanLink)) {
          queue.add(cleanLink);
        }
      }
    }
    
    consoleErrors.length = 0; // Clear for next page
    
  } catch (error) {
    failures.push({ 
      url, 
      error: error.message,
      consoleErrors: [...consoleErrors]
    });
    consoleErrors.length = 0;
  }
}

await browser.close();

const report = {
  totalChecked: seen.size,
  failures: failures.length,
  details: failures
};

fs.mkdirSync(path.resolve('client/dist'), { recursive: true });
fs.writeFileSync(
  path.resolve('client/dist/link-report.json'),
  JSON.stringify(report, null, 2)
);

if (failures.length > 0) {
  console.error(`❌ Crawl found ${failures.length} issues:`, failures);
  process.exit(1);
} else {
  console.log(`✅ Crawl passed — checked ${seen.size} URLs, no broken links`);
}