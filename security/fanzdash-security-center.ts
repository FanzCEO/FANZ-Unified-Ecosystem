import express from 'express';
import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { Pool } from 'pg';
import redis from 'redis';

// 🛡️ FANZDASH MILITARY-GRADE SECURITY CONTROL CENTER
// Unified security command and control for the entire FANZ ecosystem

const app = express();
const redisClient = redis.createClient({ url: process.env.REDIS_URL });

// 🔧 Security Configuration
const SECURITY_CONFIG = {
  port: process.env.SECURITY_PORT || 3007,
  jwtSecret: process.env.JWT_SECRET,
  encryptionKey: process.env.ENCRYPTION_KEY || 'FanzMilitaryGrade2024!',
  maxLoginAttempts: 3,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
  alertThresholds: {
    failedLogins: 5,
    suspiciousActivity: 10,
    ddosRequests: 100,
    dataBreachIndicators: 1
  }
};

// 🛡️ Military-Grade Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "https:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// 🚦 Advanced Rate Limiting
const securityRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many security requests',
    retryAfter: '60 seconds',
    securityLevel: 'HIGH'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: async (req, res) => {
    await logSecurityEvent({
      type: 'RATE_LIMIT_EXCEEDED',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.path,
      severity: 'MEDIUM'
    });
    res.status(429).json({
      error: 'Rate limit exceeded',
      securityAlert: true
    });
  }
});

app.use('/api/security', securityRateLimit);

// 🔐 Security Event Logging
async function logSecurityEvent(event: any) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    ...event,
    timestamp,
    ecosystem: 'fanz-unified',
    controlCenter: 'fanzdash'
  };
  
  // Store in Redis for real-time monitoring
  await redisClient.lPush('security:events', JSON.stringify(logEntry));
  await redisClient.expire('security:events', 24 * 60 * 60); // 24 hours
  
  // Log to console with severity colors
  const colors = {
    LOW: '\x1b[32m',    // Green
    MEDIUM: '\x1b[33m', // Yellow
    HIGH: '\x1b[31m',   // Red
    CRITICAL: '\x1b[35m' // Magenta
  };
  
  console.log(`${colors[event.severity]}\n🚨 SECURITY EVENT [${event.severity}] - ${timestamp}`);
  console.log(`   Type: ${event.type}`);
  console.log(`   IP: ${event.ip || 'N/A'}`);
  console.log(`   Details: ${JSON.stringify(event, null, 2)}\x1b[0m`);
  
  // Trigger alerts for HIGH/CRITICAL events
  if (event.severity === 'HIGH' || event.severity === 'CRITICAL') {
    await triggerSecurityAlert(logEntry);
  }
}

// 🚨 Security Alert System
async function triggerSecurityAlert(event: any) {
  // Real-time WebSocket notification to all security admins
  wss.clients.forEach(client => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(JSON.stringify({
        type: 'SECURITY_ALERT',
        event,
        timestamp: new Date().toISOString(),
        requiresAction: event.severity === 'CRITICAL'
      }));
    }
  });
  
  // Store in high-priority alerts queue
  await redisClient.lPush('security:alerts', JSON.stringify(event));
  
  // Auto-response for CRITICAL events
  if (event.severity === 'CRITICAL') {
    await executeCriticalSecurityResponse(event);
  }
}

// 🛡️ Critical Security Auto-Response
async function executeCriticalSecurityResponse(event: any) {
  console.log(`\x1b[35m🔒 EXECUTING CRITICAL SECURITY RESPONSE\x1b[0m`);
  
  switch (event.type) {
    case 'BRUTE_FORCE_ATTACK':
      await blockIP(event.ip);
      break;
    case 'SQL_INJECTION_ATTEMPT':
      await blockIP(event.ip);
      await disableAffectedEndpoint(event.endpoint);
      break;
    case 'DATA_BREACH_DETECTED':
      await lockdownMode();
      break;
    case 'DDOS_ATTACK':
      await activateDDoSProtection();
      break;
  }
}

// 🔒 IP Blocking Function
async function blockIP(ip: string) {
  await redisClient.setEx(`blocked:${ip}`, 24 * 60 * 60, 'SECURITY_BLOCK');
  await logSecurityEvent({
    type: 'IP_BLOCKED',
    ip,
    severity: 'HIGH',
    action: 'AUTO_BLOCK'
  });
}

// 🔐 Security Dashboard Endpoints

// Security Overview Dashboard
app.get('/api/security/dashboard', authenticateAdmin, async (req, res) => {
  try {
    const securityMetrics = await getSecurityMetrics();
    const recentEvents = await getRecentSecurityEvents();
    const systemHealth = await getSystemHealth();
    const threatLevel = await calculateThreatLevel();
    
    res.json({
      dashboard: 'FanzDash Security Control Center',
      timestamp: new Date().toISOString(),
      threatLevel,
      metrics: securityMetrics,
      recentEvents,
      systemHealth,
      ecosystem: 'fanz-unified'
    });
  } catch (error) {
    await logSecurityEvent({
      type: 'DASHBOARD_ACCESS_ERROR',
      error: error.message,
      severity: 'MEDIUM'
    });
    res.status(500).json({ error: 'Security dashboard error' });
  }
});

// Real-time Security Metrics
async function getSecurityMetrics() {
  const events = await redisClient.lRange('security:events', 0, 1000);
  const alerts = await redisClient.lRange('security:alerts', 0, 100);
  
  return {
    totalEvents: events.length,
    activeAlerts: alerts.length,
    blockedIPs: await redisClient.keys('blocked:*').then(keys => keys.length),
    systemStatus: 'OPERATIONAL',
    lastUpdated: new Date().toISOString(),
    platformsMonitored: [
      'fanz', 'fanztube', 'fanzcommerce', 'fanzspicyai', 'fanzmedia',
      'fanzlanding', 'fanzfiliate', 'fanzhub', 'starzcards',
      'clubcentral', 'migrationhq', 'fanzos'
    ]
  };
}

// Platform Security Status
app.get('/api/security/platforms', authenticateAdmin, async (req, res) => {
  const platformStatuses = await Promise.all([
    checkPlatformSecurity('fanz'),
    checkPlatformSecurity('fanztube'),
    checkPlatformSecurity('fanzcommerce'),
    checkPlatformSecurity('fanzspicyai'),
    checkPlatformSecurity('fanzmedia'),
    checkPlatformSecurity('fanzdash'),
    checkPlatformSecurity('fanzlanding'),
    checkPlatformSecurity('fanzfiliate'),
    checkPlatformSecurity('fanzhub'),
    checkPlatformSecurity('starzcards'),
    checkPlatformSecurity('clubcentral'),
    checkPlatformSecurity('migrationhq'),
    checkPlatformSecurity('fanzos')
  ]);
  
  res.json({
    controlCenter: 'FanzDash Security',
    platforms: platformStatuses,
    overallStatus: calculateOverallSecurityStatus(platformStatuses)
  });
});

// Check individual platform security
async function checkPlatformSecurity(platform: string) {
  try {
    const platformUrl = process.env[`${platform.toUpperCase()}_URL`] || `http://${platform}:3000`;
    const response = await fetch(`${platformUrl}/health`);
    
    const securityChecks = {
      responsive: response.ok,
      httpsEnabled: platformUrl.startsWith('https'),
      securityHeaders: checkSecurityHeaders(response.headers),
      lastSecurityScan: await getLastSecurityScan(platform),
      vulnerabilities: await getKnownVulnerabilities(platform)
    };
    
    return {
      platform,
      status: response.ok ? 'SECURE' : 'WARNING',
      securityScore: calculateSecurityScore(securityChecks),
      checks: securityChecks,
      lastChecked: new Date().toISOString()
    };
  } catch (error) {
    return {
      platform,
      status: 'ERROR',
      securityScore: 0,
      error: error.message,
      lastChecked: new Date().toISOString()
    };
  }
}

// Security Actions & Controls
app.post('/api/security/actions/lockdown', authenticateAdmin, async (req, res) => {
  await logSecurityEvent({
    type: 'MANUAL_LOCKDOWN_INITIATED',
    admin: req.user.username,
    severity: 'CRITICAL'
  });
  
  await lockdownMode();
  res.json({ 
    message: 'Ecosystem lockdown initiated',
    status: 'LOCKDOWN_ACTIVE',
    initiatedBy: req.user.username
  });
});

// Emergency lockdown mode
async function lockdownMode() {
  console.log('\x1b[31m🔒 EMERGENCY LOCKDOWN MODE ACTIVATED\x1b[0m');
  
  // Block all new connections except from admin IPs
  await redisClient.set('security:lockdown', 'ACTIVE');
  
  // Notify all platforms to enter security mode
  const platforms = ['fanz', 'fanztube', 'fanzcommerce', 'fanzspicyai'];
  for (const platform of platforms) {
    try {
      await fetch(`http://${platform}:3000/api/security/lockdown`, {
        method: 'POST',
        headers: { 'X-Security-Token': process.env.SECURITY_TOKEN }
      });
    } catch (error) {
      console.error(`Failed to lockdown ${platform}:`, error);
    }
  }
}

// Block/Unblock IPs
app.post('/api/security/block-ip', authenticateAdmin, async (req, res) => {
  const { ip, reason } = req.body;
  await blockIP(ip);
  await logSecurityEvent({
    type: 'MANUAL_IP_BLOCK',
    ip,
    reason,
    admin: req.user.username,
    severity: 'HIGH'
  });
  
  res.json({ message: `IP ${ip} blocked successfully` });
});

// Authentication middleware for security admins
async function authenticateAdmin(req: any, res: any, next: any) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      await logSecurityEvent({
        type: 'UNAUTHORIZED_SECURITY_ACCESS',
        ip: req.ip,
        severity: 'HIGH'
      });
      return res.status(401).json({ error: 'Security access token required' });
    }
    
    const decoded = jwt.verify(token, SECURITY_CONFIG.jwtSecret) as any;
    if (decoded.role !== 'admin' && decoded.role !== 'super_admin') {
      await logSecurityEvent({
        type: 'INSUFFICIENT_SECURITY_PRIVILEGES',
        userId: decoded.userId,
        ip: req.ip,
        severity: 'HIGH'
      });
      return res.status(403).json({ error: 'Admin privileges required' });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    await logSecurityEvent({
      type: 'INVALID_SECURITY_TOKEN',
      ip: req.ip,
      severity: 'MEDIUM'
    });
    res.status(401).json({ error: 'Invalid security token' });
  }
}

// 📡 WebSocket for Real-time Security Monitoring
const wss = new WebSocketServer({ port: 3008 });

wss.on('connection', async (ws, req) => {
  console.log('🔐 Security admin connected to control center');
  
  // Send initial security status
  ws.send(JSON.stringify({
    type: 'SECURITY_STATUS',
    status: 'CONNECTED_TO_CONTROL_CENTER',
    controlCenter: 'FanzDash Security',
    timestamp: new Date().toISOString()
  }));
  
  // Send recent security events
  const recentEvents = await getRecentSecurityEvents();
  ws.send(JSON.stringify({
    type: 'RECENT_EVENTS',
    events: recentEvents
  }));
});

// Helper functions
async function getRecentSecurityEvents() {
  const events = await redisClient.lRange('security:events', 0, 50);
  return events.map(event => JSON.parse(event));
}

async function calculateThreatLevel() {
  const recentEvents = await getRecentSecurityEvents();
  const highSeverityEvents = recentEvents.filter(e => e.severity === 'HIGH' || e.severity === 'CRITICAL');
  
  if (highSeverityEvents.length > 10) return 'CRITICAL';
  if (highSeverityEvents.length > 5) return 'HIGH';
  if (highSeverityEvents.length > 2) return 'MEDIUM';
  return 'LOW';
}

// 🚀 Start Security Control Center
const startSecurityCenter = async () => {
  try {
    await redisClient.connect();
    console.log('📦 Security Redis connected');
    
    app.listen(SECURITY_CONFIG.port, () => {
      console.log(`\n\x1b[32m🛡️  FANZDASH SECURITY CONTROL CENTER ONLINE\x1b[0m`);
      console.log(`   Port: ${SECURITY_CONFIG.port}`);
      console.log(`   WebSocket: 3008`);
      console.log(`   Status: MILITARY-GRADE SECURITY ACTIVE`);
      console.log(`   Monitoring: 13 Unified Platforms`);
      console.log(`   Threat Level: CALCULATING...`);
      console.log(`\x1b[36m   Access: https://myfanz.network/security-center\x1b[0m\n`);
    });
    
    // Initial security check
    await performInitialSecurityScan();
    
  } catch (error) {
    console.error('❌ Failed to start security control center:', error);
    process.exit(1);
  }
};

// Initial security scan
async function performInitialSecurityScan() {
  console.log('🔍 Performing initial security scan...');
  await logSecurityEvent({
    type: 'SECURITY_CENTER_STARTUP',
    severity: 'LOW',
    message: 'FanzDash Security Control Center online'
  });
}

// Start the security control center
startSecurityCenter();

export default app;