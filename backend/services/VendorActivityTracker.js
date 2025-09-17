const { Pool } = require('pg');
const EventEmitter = require('events');

class VendorActivityTracker extends EventEmitter {
  constructor() {
    super();
    
    // Database connection
    this.dbConnection = new Pool({
      user: process.env.DB_USER || 'fanz_user',
      host: process.env.DB_HOST || 'localhost', 
      database: process.env.DB_NAME || 'fanz_unified',
      password: process.env.DB_PASSWORD || 'FanzDB_2024_Secure!',
      port: process.env.DB_PORT || 5432,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000
    });

    // Risk scoring thresholds
    this.riskThresholds = {
      HIGH_FREQUENCY_REQUESTS: 100,  // requests per hour
      SUSPICIOUS_ENDPOINTS: ['/api/admin', '/api/users', '/api/payments'],
      UNUSUAL_HOURS: { start: 22, end: 6 }, // 10 PM to 6 AM
      MAX_FAILED_ATTEMPTS: 5,
      GEOGRAPHIC_ANOMALY_THRESHOLD: 0.8
    };

    // Activity patterns cache
    this.activityPatterns = new Map();
    this.sessionCache = new Map();
    
    // Start background monitoring
    this.startBackgroundMonitoring();
  }

  /**
   * Track vendor activity
   */
  async trackActivity(vendorData, sessionData, activityData) {
    try {
      const {
        action,
        resource,
        method,
        endpoint,
        requestData,
        responseStatus,
        responseTimeMs,
        ipAddress,
        userAgent
      } = activityData;

      // Get or create session
      const session = await this.getOrCreateSession(vendorData, ipAddress, userAgent, sessionData.tokenId);
      
      // Calculate risk score
      const riskScore = await this.calculateRiskScore(vendorData, session, activityData);
      
      // Record activity
      const activity = await this.recordActivity({
        sessionId: session.id,
        vendorId: vendorData.id,
        action,
        resource,
        method,
        endpoint,
        requestData: requestData ? JSON.stringify(requestData) : null,
        responseStatus,
        responseTimeMs,
        riskScore: riskScore.score,
        riskFactors: riskScore.factors,
        ipAddress,
        userAgent
      });

      // Update session statistics
      await this.updateSessionStats(session.id, endpoint, riskScore.score);

      // Emit events for high-risk activities
      if (riskScore.score >= 70) {
        this.emit('high-risk-activity', {
          vendor: vendorData,
          session: session,
          activity: activity,
          riskScore: riskScore
        });
      }

      // Check for anomalies
      await this.checkForAnomalies(vendorData, session, activity);

      return {
        success: true,
        activity,
        riskScore,
        session
      };
    } catch (error) {
      console.error('Activity tracking error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get or create vendor session
   */
  async getOrCreateSession(vendorData, ipAddress, userAgent, tokenId) {
    try {
      // Check for existing active session
      const existingSession = await this.dbConnection.query(`
        SELECT * FROM vendor_sessions 
        WHERE vendor_id = $1 AND ip_address = $2 AND end_time IS NULL
        ORDER BY start_time DESC 
        LIMIT 1
      `, [vendorData.id, ipAddress]);

      if (existingSession.rows.length > 0) {
        const session = existingSession.rows[0];
        
        // Update last activity
        await this.dbConnection.query(`
          UPDATE vendor_sessions 
          SET last_activity = NOW(), token_id = COALESCE($1, token_id)
          WHERE id = $2
        `, [tokenId, session.id]);

        return { ...session, last_activity: new Date() };
      }

      // Create new session
      const newSession = await this.dbConnection.query(`
        INSERT INTO vendor_sessions 
        (vendor_id, token_id, ip_address, user_agent, start_time, last_activity)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING *
      `, [vendorData.id, tokenId, ipAddress, userAgent]);

      const session = newSession.rows[0];
      
      // Emit session started event
      this.emit('vendor-session-started', {
        vendor: vendorData,
        session: session
      });

      return session;
    } catch (error) {
      console.error('Session management error:', error);
      throw error;
    }
  }

  /**
   * Record activity in database
   */
  async recordActivity(activityData) {
    try {
      const result = await this.dbConnection.query(`
        INSERT INTO vendor_activities 
        (session_id, vendor_id, action, resource, method, endpoint, request_data, 
         response_status, response_time_ms, risk_score, risk_factors, ip_address, user_agent)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `, [
        activityData.sessionId,
        activityData.vendorId,
        activityData.action,
        activityData.resource,
        activityData.method,
        activityData.endpoint,
        activityData.requestData,
        activityData.responseStatus,
        activityData.responseTimeMs,
        activityData.riskScore,
        activityData.riskFactors,
        activityData.ipAddress,
        activityData.userAgent
      ]);

      return result.rows[0];
    } catch (error) {
      console.error('Activity recording error:', error);
      throw error;
    }
  }

  /**
   * Calculate risk score for activity
   */
  async calculateRiskScore(vendorData, session, activityData) {
    try {
      let score = 0;
      const factors = [];

      // 1. Check for suspicious endpoints
      if (this.riskThresholds.SUSPICIOUS_ENDPOINTS.some(endpoint => 
        activityData.endpoint.includes(endpoint))) {
        score += 30;
        factors.push('suspicious_endpoint');
      }

      // 2. Check request frequency
      const recentActivities = await this.getRecentActivities(vendorData.id, 60); // Last hour
      if (recentActivities.length > this.riskThresholds.HIGH_FREQUENCY_REQUESTS) {
        score += 25;
        factors.push('high_frequency');
      }

      // 3. Check unusual hours
      const currentHour = new Date().getHours();
      const { start, end } = this.riskThresholds.UNUSUAL_HOURS;
      if (currentHour >= start || currentHour <= end) {
        score += 15;
        factors.push('unusual_hours');
      }

      // 4. Check for failed requests
      if (activityData.responseStatus >= 400) {
        score += 10;
        factors.push('failed_request');
        
        // Count recent failures
        const recentFailures = recentActivities.filter(a => a.response_status >= 400);
        if (recentFailures.length > this.riskThresholds.MAX_FAILED_ATTEMPTS) {
          score += 20;
          factors.push('multiple_failures');
        }
      }

      // 5. Check response time anomalies
      if (activityData.responseTimeMs > 5000) { // > 5 seconds
        score += 10;
        factors.push('slow_response');
      }

      // 6. Check for IP address changes
      const recentSessions = await this.getRecentSessions(vendorData.id, 24); // Last 24 hours
      const uniqueIPs = new Set(recentSessions.map(s => s.ip_address));
      if (uniqueIPs.size > 3) {
        score += 20;
        factors.push('multiple_ips');
      }

      // 7. Check for user agent changes
      const recentUserAgents = new Set(recentSessions.map(s => s.user_agent).filter(Boolean));
      if (recentUserAgents.size > 2) {
        score += 15;
        factors.push('user_agent_variation');
      }

      // 8. Check for data exfiltration patterns
      if (activityData.method === 'GET' && activityData.endpoint.includes('/export')) {
        score += 25;
        factors.push('data_export');
      }

      // Cap the score at 100
      score = Math.min(score, 100);

      return {
        score,
        factors,
        level: this.getRiskLevel(score)
      };
    } catch (error) {
      console.error('Risk calculation error:', error);
      return { score: 0, factors: [], level: 'low' };
    }
  }

  /**
   * Get risk level from score
   */
  getRiskLevel(score) {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    if (score >= 20) return 'low';
    return 'minimal';
  }

  /**
   * Get recent activities for a vendor
   */
  async getRecentActivities(vendorId, hoursBack = 1) {
    try {
      const result = await this.dbConnection.query(`
        SELECT * FROM vendor_activities 
        WHERE vendor_id = $1 AND timestamp > NOW() - INTERVAL '${hoursBack} hours'
        ORDER BY timestamp DESC
      `, [vendorId]);

      return result.rows;
    } catch (error) {
      console.error('Recent activities fetch error:', error);
      return [];
    }
  }

  /**
   * Get recent sessions for a vendor
   */
  async getRecentSessions(vendorId, hoursBack = 24) {
    try {
      const result = await this.dbConnection.query(`
        SELECT * FROM vendor_sessions 
        WHERE vendor_id = $1 AND start_time > NOW() - INTERVAL '${hoursBack} hours'
        ORDER BY start_time DESC
      `, [vendorId]);

      return result.rows;
    } catch (error) {
      console.error('Recent sessions fetch error:', error);
      return [];
    }
  }

  /**
   * Update session statistics
   */
  async updateSessionStats(sessionId, endpoint, riskScore) {
    try {
      await this.dbConnection.query(`
        UPDATE vendor_sessions 
        SET 
          total_requests = total_requests + 1,
          unique_endpoints = (
            SELECT COUNT(DISTINCT endpoint) 
            FROM vendor_activities 
            WHERE session_id = $1
          ),
          risk_score = GREATEST(risk_score, $2),
          last_activity = NOW()
        WHERE id = $1
      `, [sessionId, riskScore]);
    } catch (error) {
      console.error('Session stats update error:', error);
    }
  }

  /**
   * Check for activity anomalies
   */
  async checkForAnomalies(vendorData, session, activity) {
    try {
      // Check for session hijacking indicators
      const sessionActivities = await this.dbConnection.query(`
        SELECT DISTINCT ip_address, user_agent 
        FROM vendor_activities 
        WHERE session_id = $1
      `, [session.id]);

      if (sessionActivities.rows.length > 1) {
        this.emit('potential-session-hijacking', {
          vendor: vendorData,
          session: session,
          activity: activity,
          indicators: sessionActivities.rows
        });
      }

      // Check for unusual access patterns
      const hourlyPattern = await this.getHourlyAccessPattern(vendorData.id);
      const currentHour = new Date().getHours();
      
      if (hourlyPattern[currentHour] < 0.1) { // Less than 10% of usual activity
        this.emit('unusual-access-time', {
          vendor: vendorData,
          session: session,
          activity: activity,
          currentHour: currentHour,
          pattern: hourlyPattern
        });
      }
    } catch (error) {
      console.error('Anomaly detection error:', error);
    }
  }

  /**
   * Get hourly access pattern for vendor
   */
  async getHourlyAccessPattern(vendorId) {
    try {
      const result = await this.dbConnection.query(`
        SELECT 
          EXTRACT(HOUR FROM timestamp) as hour,
          COUNT(*) as activity_count
        FROM vendor_activities 
        WHERE vendor_id = $1 
          AND timestamp > NOW() - INTERVAL '30 days'
        GROUP BY EXTRACT(HOUR FROM timestamp)
        ORDER BY hour
      `, [vendorId]);

      const pattern = new Array(24).fill(0);
      const totalActivities = result.rows.reduce((sum, row) => sum + parseInt(row.activity_count), 0);

      result.rows.forEach(row => {
        const hour = parseInt(row.hour);
        const percentage = parseInt(row.activity_count) / totalActivities;
        pattern[hour] = percentage;
      });

      return pattern;
    } catch (error) {
      console.error('Hourly pattern analysis error:', error);
      return new Array(24).fill(0.04); // Default uniform distribution
    }
  }

  /**
   * End vendor session
   */
  async endSession(sessionId, reason = 'normal_logout') {
    try {
      await this.dbConnection.query(`
        UPDATE vendor_sessions 
        SET end_time = NOW()
        WHERE id = $1 AND end_time IS NULL
      `, [sessionId]);

      // Get session data for event
      const sessionData = await this.dbConnection.query(`
        SELECT vs.*, vp.name, vp.company 
        FROM vendor_sessions vs
        JOIN vendor_profiles vp ON vs.vendor_id = vp.id
        WHERE vs.id = $1
      `, [sessionId]);

      if (sessionData.rows.length > 0) {
        this.emit('vendor-session-ended', {
          session: sessionData.rows[0],
          reason: reason
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Session end error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get vendor activity summary
   */
  async getVendorActivitySummary(vendorId, daysBack = 30) {
    try {
      const summary = await this.dbConnection.query(`
        SELECT 
          COUNT(*) as total_activities,
          COUNT(DISTINCT session_id) as total_sessions,
          AVG(response_time_ms) as avg_response_time,
          COUNT(*) FILTER (WHERE response_status >= 400) as failed_requests,
          COUNT(*) FILTER (WHERE risk_score >= 60) as high_risk_activities,
          COUNT(DISTINCT endpoint) as unique_endpoints,
          COUNT(DISTINCT ip_address) as unique_ips,
          MIN(timestamp) as first_activity,
          MAX(timestamp) as last_activity
        FROM vendor_activities 
        WHERE vendor_id = $1 
          AND timestamp > NOW() - INTERVAL '${daysBack} days'
      `, [vendorId]);

      const riskDistribution = await this.dbConnection.query(`
        SELECT 
          CASE 
            WHEN risk_score >= 80 THEN 'critical'
            WHEN risk_score >= 60 THEN 'high'
            WHEN risk_score >= 40 THEN 'medium'
            WHEN risk_score >= 20 THEN 'low'
            ELSE 'minimal'
          END as risk_level,
          COUNT(*) as count
        FROM vendor_activities 
        WHERE vendor_id = $1 
          AND timestamp > NOW() - INTERVAL '${daysBack} days'
        GROUP BY 
          CASE 
            WHEN risk_score >= 80 THEN 'critical'
            WHEN risk_score >= 60 THEN 'high'
            WHEN risk_score >= 40 THEN 'medium'
            WHEN risk_score >= 20 THEN 'low'
            ELSE 'minimal'
          END
      `, [vendorId]);

      return {
        summary: summary.rows[0],
        risk_distribution: riskDistribution.rows,
        period_days: daysBack
      };
    } catch (error) {
      console.error('Activity summary error:', error);
      throw error;
    }
  }

  /**
   * Start background monitoring
   */
  startBackgroundMonitoring() {
    // Clean up old sessions every hour
    setInterval(async () => {
      try {
        await this.cleanupOldSessions();
      } catch (error) {
        console.error('Session cleanup error:', error);
      }
    }, 60 * 60 * 1000); // 1 hour

    // Risk pattern analysis every 15 minutes
    setInterval(async () => {
      try {
        await this.analyzeRiskPatterns();
      } catch (error) {
        console.error('Risk analysis error:', error);
      }
    }, 15 * 60 * 1000); // 15 minutes

    console.log('🔍 Vendor Activity Tracker: Background monitoring started');
  }

  /**
   * Clean up old sessions
   */
  async cleanupOldSessions() {
    try {
      // End sessions inactive for more than 8 hours
      const result = await this.dbConnection.query(`
        UPDATE vendor_sessions 
        SET end_time = NOW()
        WHERE last_activity < NOW() - INTERVAL '8 hours' 
          AND end_time IS NULL
        RETURNING id, vendor_id
      `);

      if (result.rows.length > 0) {
        console.log(`🧹 Cleaned up ${result.rows.length} inactive sessions`);
      }
    } catch (error) {
      console.error('Session cleanup error:', error);
    }
  }

  /**
   * Analyze risk patterns
   */
  async analyzeRiskPatterns() {
    try {
      // Find vendors with increasing risk scores
      const riskTrends = await this.dbConnection.query(`
        SELECT 
          vendor_id,
          AVG(risk_score) as avg_risk,
          COUNT(*) as activity_count
        FROM vendor_activities 
        WHERE timestamp > NOW() - INTERVAL '1 hour'
        GROUP BY vendor_id
        HAVING AVG(risk_score) > 50
      `);

      riskTrends.rows.forEach(trend => {
        this.emit('risk-trend-alert', {
          vendorId: trend.vendor_id,
          averageRisk: parseFloat(trend.avg_risk),
          activityCount: parseInt(trend.activity_count)
        });
      });
    } catch (error) {
      console.error('Risk pattern analysis error:', error);
    }
  }

  /**
   * Close database connection
   */
  async close() {
    try {
      await this.dbConnection.end();
      console.log('✅ Vendor Activity Tracker: Database connection closed');
    } catch (error) {
      console.error('❌ Vendor Activity Tracker: Error closing database connection:', error);
    }
  }
}

module.exports = new VendorActivityTracker();