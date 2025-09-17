const VendorActivityTracker = require('../services/VendorActivityTracker');

/**
 * Middleware to track vendor activity
 */
const trackVendorActivity = async (req, res, next) => {
  // Only track if vendor is authenticated
  if (!req.vendor || !req.vendorAccess) {
    return next();
  }

  const startTime = Date.now();
  const originalSend = res.send;

  // Override res.send to capture response data
  res.send = function(data) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Track the activity asynchronously
    setImmediate(async () => {
      try {
        const activityData = {
          action: determineAction(req.method, req.route?.path || req.url),
          resource: determineResource(req.url),
          method: req.method,
          endpoint: req.url,
          requestData: getRequestData(req),
          responseStatus: res.statusCode,
          responseTimeMs: responseTime,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent')
        };

        const sessionData = {
          tokenId: req.vendorAccess.token_id || null
        };

        await VendorActivityTracker.trackActivity(
          req.vendor,
          sessionData,
          activityData
        );
      } catch (error) {
        console.error('Activity tracking error:', error);
      }
    });

    // Call original send method
    originalSend.call(this, data);
  };

  next();
};

/**
 * Middleware to track admin activity
 */
const trackAdminActivity = async (req, res, next) => {
  // Only track if admin is authenticated
  if (!req.admin) {
    return next();
  }

  const startTime = Date.now();
  const originalSend = res.send;

  // Override res.send to capture response data
  res.send = function(data) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Log admin activity asynchronously
    setImmediate(async () => {
      try {
        await logAdminActivity(req.admin.id, {
          action: determineAction(req.method, req.route?.path || req.url),
          resource_type: determineResource(req.url),
          resource_id: extractResourceId(req),
          details: {
            method: req.method,
            endpoint: req.url,
            response_status: res.statusCode,
            response_time_ms: responseTime,
            request_data: getRequestData(req)
          },
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent')
        });
      } catch (error) {
        console.error('Admin activity logging error:', error);
      }
    });

    // Call original send method
    originalSend.call(this, data);
  };

  next();
};

/**
 * Middleware to handle high-risk vendor activities
 */
const handleHighRiskActivities = () => {
  // Set up event listeners for high-risk activities
  VendorActivityTracker.on('high-risk-activity', async (data) => {
    console.warn(`🚨 HIGH RISK ACTIVITY: ${data.vendor.company} (${data.vendor.name})`);
    console.warn(`   Risk Score: ${data.riskScore.score}/100 (${data.riskScore.level})`);
    console.warn(`   Factors: ${data.riskScore.factors.join(', ')}`);
    console.warn(`   Endpoint: ${data.activity.method} ${data.activity.endpoint}`);
    
    // In production, this would trigger alerts, notifications, etc.
    await notifySecurityTeam(data);
  });

  VendorActivityTracker.on('potential-session-hijacking', async (data) => {
    console.error(`🔒 POTENTIAL SESSION HIJACKING: ${data.vendor.company}`);
    console.error(`   Session ID: ${data.session.id}`);
    console.error(`   Indicators:`, data.indicators);
    
    // In production, immediately terminate session and alert security
    await handleSecurityIncident('session_hijacking', data);
  });

  VendorActivityTracker.on('unusual-access-time', async (data) => {
    console.warn(`🕒 UNUSUAL ACCESS TIME: ${data.vendor.company}`);
    console.warn(`   Current Hour: ${data.currentHour}:00`);
    console.warn(`   Normal Pattern: ${(data.pattern[data.currentHour] * 100).toFixed(1)}%`);
    
    // Log for investigation
    await logSecurityEvent('unusual_access_time', data);
  });

  VendorActivityTracker.on('vendor-session-started', (data) => {
    console.log(`📱 Vendor session started: ${data.vendor.company} from ${data.session.ip_address}`);
  });

  VendorActivityTracker.on('vendor-session-ended', (data) => {
    console.log(`🔚 Vendor session ended: ${data.session.name} (${data.session.company}) - ${data.reason}`);
  });

  VendorActivityTracker.on('risk-trend-alert', async (data) => {
    console.warn(`📈 RISK TREND ALERT: Vendor ${data.vendorId}`);
    console.warn(`   Average Risk: ${data.averageRisk.toFixed(1)}/100`);
    console.warn(`   Activity Count: ${data.activityCount} in last hour`);
    
    await escalateRiskTrend(data);
  });

  return (req, res, next) => next(); // Pass-through middleware
};

/**
 * Determine action from HTTP method and path
 */
function determineAction(method, path) {
  const pathLower = path.toLowerCase();
  
  switch (method.toUpperCase()) {
    case 'GET':
      if (pathLower.includes('/export')) return 'data_export';
      if (pathLower.includes('/download')) return 'file_download';
      return 'data_read';
    
    case 'POST':
      if (pathLower.includes('/login')) return 'authentication';
      if (pathLower.includes('/upload')) return 'file_upload';
      if (pathLower.includes('/create')) return 'data_create';
      return 'data_create';
    
    case 'PUT':
    case 'PATCH':
      return 'data_update';
    
    case 'DELETE':
      return 'data_delete';
    
    default:
      return 'unknown_action';
  }
}

/**
 * Determine resource from URL
 */
function determineResource(url) {
  const segments = url.split('/').filter(Boolean);
  
  if (segments.includes('api')) {
    const apiIndex = segments.indexOf('api');
    if (apiIndex + 1 < segments.length) {
      return segments[apiIndex + 1]; // Return the resource after /api/
    }
  }
  
  return segments[0] || 'unknown';
}

/**
 * Extract resource ID from request
 */
function extractResourceId(req) {
  // Try to get ID from params
  if (req.params && req.params.id) {
    return req.params.id;
  }
  
  // Try to get ID from URL segments
  const segments = req.url.split('/').filter(Boolean);
  for (let segment of segments) {
    // Check if segment looks like UUID
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) {
      return segment;
    }
    // Check if segment is numeric ID
    if (/^\d+$/.test(segment)) {
      return segment;
    }
  }
  
  return null;
}

/**
 * Get sanitized request data
 */
function getRequestData(req) {
  const data = {};
  
  // Include query parameters
  if (req.query && Object.keys(req.query).length > 0) {
    data.query = req.query;
  }
  
  // Include body data (but sanitize sensitive fields)
  if (req.body && Object.keys(req.body).length > 0) {
    data.body = sanitizeRequestBody(req.body);
  }
  
  // Include path parameters
  if (req.params && Object.keys(req.params).length > 0) {
    data.params = req.params;
  }
  
  return Object.keys(data).length > 0 ? data : null;
}

/**
 * Sanitize request body to remove sensitive information
 */
function sanitizeRequestBody(body) {
  const sensitiveFields = [
    'password', 'token', 'secret', 'key', 'authorization',
    'access_token', 'refresh_token', 'api_key', 'client_secret'
  ];
  
  const sanitized = { ...body };
  
  for (let field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
}

/**
 * Log admin activity to database
 */
async function logAdminActivity(adminId, activityData) {
  try {
    const { Pool } = require('pg');
    const dbConnection = new Pool({
      user: process.env.DB_USER || 'fanz_user',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'fanz_unified',
      password: process.env.DB_PASSWORD || 'FanzDB_2024_Secure!',
      port: process.env.DB_PORT || 5432
    });

    await dbConnection.query(
      'INSERT INTO admin_audit_log (admin_id, action, resource_type, resource_id, details, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [
        adminId,
        activityData.action,
        activityData.resource_type,
        activityData.resource_id,
        JSON.stringify(activityData.details),
        activityData.ip_address,
        activityData.user_agent
      ]
    );

    await dbConnection.end();
  } catch (error) {
    console.error('Failed to log admin activity:', error);
  }
}

/**
 * Notify security team of high-risk activity
 */
async function notifySecurityTeam(data) {
  // In production, this would send emails, Slack messages, etc.
  console.log('🚨 Security team notified of high-risk activity');
  
  // Log to security events table
  await logSecurityEvent('high_risk_activity', {
    vendor_id: data.vendor.id,
    session_id: data.session.id,
    activity_id: data.activity.id,
    risk_score: data.riskScore.score,
    risk_factors: data.riskScore.factors
  });
}

/**
 * Handle security incident
 */
async function handleSecurityIncident(type, data) {
  console.error(`🔒 Security incident: ${type}`);
  
  // In production, this would:
  // 1. Immediately terminate the session
  // 2. Block the IP address temporarily
  // 3. Alert security team
  // 4. Create incident report
  
  await VendorActivityTracker.endSession(data.session.id, `security_incident_${type}`);
}

/**
 * Log security event
 */
async function logSecurityEvent(eventType, data) {
  try {
    const { Pool } = require('pg');
    const dbConnection = new Pool({
      user: process.env.DB_USER || 'fanz_user',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'fanz_unified',
      password: process.env.DB_PASSWORD || 'FanzDB_2024_Secure!',
      port: process.env.DB_PORT || 5432
    });

    await dbConnection.query(
      'INSERT INTO vendor_audit_logs (vendor_id, event_type, details, created_at) VALUES ($1, $2, $3, NOW())',
      [
        data.vendor_id || data.vendor?.id || null,
        eventType,
        JSON.stringify(data)
      ]
    );

    await dbConnection.end();
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

/**
 * Escalate risk trend
 */
async function escalateRiskTrend(data) {
  // In production, this would escalate to security team
  console.warn('📈 Risk trend escalated to security team');
  
  // Could trigger additional monitoring, temporary access restrictions, etc.
}

module.exports = {
  trackVendorActivity,
  trackAdminActivity,
  handleHighRiskActivities
};