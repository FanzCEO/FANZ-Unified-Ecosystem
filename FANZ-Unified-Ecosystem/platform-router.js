/**
 * FANZ Multi-Platform Router
 *
 * Routes incoming requests to the correct platform based on hostname.
 * Supports all 13 FANZ content platforms plus admin services.
 *
 * Architecture: Multi-tenant single deployment
 * Cost: $25/month (vs $325/month for individual deployments)
 */

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3002;

// Platform configuration mapping
const PLATFORMS = {
  // Content Platforms
  'boyfanz.com': {
    dir: './boyfanz/dist',
    backend: './boyfanz/server/index.js',
    cluster: 'boyfanz',
    name: 'BoyFanz'
  },
  'girlfanz.com': {
    dir: './girlfanz/dist',
    backend: './girlfanz/server/index.js',
    cluster: 'girlfanz',
    name: 'GirlFanz'
  },
  'pupfanz.com': {
    dir: './pupfanz/dist',
    backend: './pupfanz/server/index.js',
    cluster: 'pupfanz',
    name: 'PupFanz'
  },
  'gayfanz.com': {
    dir: './gayfanz/dist',
    backend: './gayfanz/server/index.js',
    cluster: 'gayfanz',
    name: 'GayFanz'
  },
  'bearfanz.com': {
    dir: './bearfanz/dist',
    backend: './bearfanz/server/index.js',
    cluster: 'bearfanz',
    name: 'BearFanz'
  },
  'cougarfanz.com': {
    dir: './cougarfanz/dist',
    backend: './cougarfanz/server/index.js',
    cluster: 'cougarfanz',
    name: 'CougarFanz'
  },
  'dlbroz.com': {
    dir: './dlbroz/dist',
    backend: './dlbroz/server/index.js',
    cluster: 'dlbroz',
    name: 'DLBroz'
  },
  'southernfanz.com': {
    dir: './southernfanz/dist',
    backend: './southernfanz/server/index.js',
    cluster: 'southernfanz',
    name: 'SouthernFanz'
  },
  'taboofanz.com': {
    dir: './taboofanz/dist',
    backend: './taboofanz/server/index.js',
    cluster: 'taboofanz',
    name: 'TabooFanz'
  },
  'femmefanz.com': {
    dir: './femmefanz/dist',
    backend: './femmefanz/server/index.js',
    cluster: 'femmefanz',
    name: 'FemmeFanz'
  },
  'fanzuncut.com': {
    dir: './fanzuncut/dist',
    backend: './fanzuncut/server/index.js',
    cluster: 'fanzuncut',
    name: 'FanzUncut'
  },
  'guyz.com': {
    dir: './guyz/dist',
    backend: './guyz/server/index.js',
    cluster: 'guyz',
    name: 'Guyz'
  },
  'transfanz.com': {
    dir: './transfanz/dist',
    backend: './transfanz/server/index.js',
    cluster: 'transfanz',
    name: 'TransFanz'
  },

  // Admin Services
  'dash.fanz.network': {
    dir: './fanzdash/dist',
    backend: './fanzdash/server/index.js',
    cluster: 'admin',
    name: 'FanzDash'
  },
  'money.fanz.network': {
    dir: './fanzmoneydash/dist',
    backend: './fanzmoneydash/server/index.js',
    cluster: 'admin',
    name: 'FanzMoneyDash'
  }
};

// Middleware: Add platform context to request
app.use((req, res, next) => {
  const host = req.hostname.replace('www.', '');
  const platform = PLATFORMS[host];

  if (platform) {
    req.platform = platform;
    req.platformCluster = platform.cluster;
    req.platformName = platform.name;
  }

  next();
});

// Middleware: CORS for cross-platform requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

// Middleware: Security headers
app.use((req, res, next) => {
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'SAMEORIGIN');
  res.header('X-XSS-Protection', '1; mode=block');
  res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    platform: req.platformName || 'unknown',
    cluster: req.platformCluster || 'unknown',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    env: process.env.NODE_ENV
  });
});

// System status endpoint
app.get('/system', (req, res) => {
  const platformsStatus = {};

  for (const [host, config] of Object.entries(PLATFORMS)) {
    const distExists = fs.existsSync(path.join(__dirname, config.dir));
    const backendExists = fs.existsSync(path.join(__dirname, config.backend));

    platformsStatus[host] = {
      name: config.name,
      cluster: config.cluster,
      frontend: distExists ? 'ready' : 'missing',
      backend: backendExists ? 'ready' : 'missing'
    };
  }

  res.json({
    router: 'FANZ Multi-Platform Router',
    version: '1.0.0',
    platforms: Object.keys(PLATFORMS).length,
    platformsStatus,
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: PORT,
      SUPABASE_URL: process.env.SUPABASE_URL ? 'configured' : 'missing',
      SSO_URL: process.env.SSO_URL || 'not set'
    }
  });
});

// API routes - proxy to platform-specific backends
app.use('/api', (req, res, next) => {
  const platform = req.platform;

  if (!platform) {
    return res.status(404).json({
      error: 'Platform not found',
      host: req.hostname
    });
  }

  const backendPath = path.join(__dirname, platform.backend);

  if (fs.existsSync(backendPath)) {
    // Load and execute platform-specific backend
    try {
      const backend = require(backendPath);
      if (typeof backend === 'function') {
        backend(req, res, next);
      } else if (backend.router) {
        backend.router(req, res, next);
      } else {
        next();
      }
    } catch (error) {
      console.error(`[${platform.name}] Backend error:`, error);
      res.status(500).json({
        error: 'Backend error',
        platform: platform.name,
        message: error.message
      });
    }
  } else {
    // No backend, pass through
    next();
  }
});

// Static file serving - platform-specific frontend
app.use((req, res, next) => {
  const platform = req.platform;

  if (!platform) {
    return res.status(404).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>FANZ - Platform Not Found</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              max-width: 600px;
              margin: 100px auto;
              text-align: center;
              padding: 20px;
            }
            h1 { color: #333; }
            p { color: #666; line-height: 1.6; }
            code { background: #f4f4f4; padding: 2px 8px; border-radius: 4px; }
          </style>
        </head>
        <body>
          <h1>Platform Not Found</h1>
          <p>The platform <code>${req.hostname}</code> is not configured.</p>
          <p>Available platforms:</p>
          <ul style="text-align: left; display: inline-block;">
            ${Object.keys(PLATFORMS).map(host => `<li><code>${host}</code></li>`).join('')}
          </ul>
        </body>
      </html>
    `);
  }

  const distPath = path.join(__dirname, platform.dir);

  if (fs.existsSync(distPath)) {
    express.static(distPath)(req, res, next);
  } else {
    res.status(503).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${platform.name} - Building</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              max-width: 600px;
              margin: 100px auto;
              text-align: center;
              padding: 20px;
            }
            h1 { color: #333; }
            p { color: #666; line-height: 1.6; }
            .spinner {
              border: 4px solid #f3f3f3;
              border-top: 4px solid #3498db;
              border-radius: 50%;
              width: 40px;
              height: 40px;
              animation: spin 1s linear infinite;
              margin: 30px auto;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
        </head>
        <body>
          <div class="spinner"></div>
          <h1>${platform.name}</h1>
          <p>Platform is currently building. Please check back in a few minutes.</p>
          <p><small>Cluster: ${platform.cluster}</small></p>
        </body>
      </html>
    `);
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>404 - Page Not Found</title>
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            max-width: 600px;
            margin: 100px auto;
            text-align: center;
            padding: 20px;
          }
          h1 { color: #333; font-size: 72px; margin: 0; }
          h2 { color: #666; font-weight: normal; }
          p { color: #888; line-height: 1.6; }
          a { color: #3498db; text-decoration: none; }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>The page you're looking for doesn't exist on <strong>${req.platformName || 'this platform'}</strong>.</p>
        <p><a href="/">← Back to home</a></p>
      </body>
    </html>
  `);
});

// Error handler
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${req.platformName || 'Router'}:`, err);

  res.status(500).send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>500 - Server Error</title>
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            max-width: 600px;
            margin: 100px auto;
            text-align: center;
            padding: 20px;
          }
          h1 { color: #e74c3c; font-size: 72px; margin: 0; }
          h2 { color: #666; font-weight: normal; }
          p { color: #888; line-height: 1.6; }
          code { background: #f4f4f4; padding: 2px 8px; border-radius: 4px; font-size: 14px; }
        </style>
      </head>
      <body>
        <h1>500</h1>
        <h2>Internal Server Error</h2>
        <p>Something went wrong on <strong>${req.platformName || 'this platform'}</strong>.</p>
        ${process.env.NODE_ENV === 'development' ? `<p><code>${err.message}</code></p>` : ''}
        <p><a href="/">← Back to home</a></p>
      </body>
    </html>
  `);
});

// Start server
app.listen(PORT, () => {
  console.log('========================================');
  console.log('FANZ Multi-Platform Router');
  console.log('========================================');
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Port: ${PORT}`);
  console.log(`Platforms: ${Object.keys(PLATFORMS).length}`);
  console.log(`Started: ${new Date().toISOString()}`);
  console.log('========================================\n');

  console.log('Configured Platforms:');
  for (const [host, config] of Object.entries(PLATFORMS)) {
    const status = fs.existsSync(path.join(__dirname, config.dir)) ? '✅' : '❌';
    console.log(`  ${status} ${config.name.padEnd(20)} → ${host}`);
  }
  console.log('\n========================================\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n[SHUTDOWN] Received SIGTERM signal');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n[SHUTDOWN] Received SIGINT signal');
  process.exit(0);
});

module.exports = app;
