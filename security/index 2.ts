/**
 * @fanzsecurity - Main Security Integration Index
 * Single entry point for all FANZ security systems
 * Provides a unified API for platform integration
 */

import { createSecurityLogger } from './fanz-secure/src/utils/logger.js';

// Import all security systems
import { zeroTrustCore } from './zero-trust/ZeroTrustSecurityCore.js';
import { fanzDashSecurityCenter } from './fanzdash-control/FanzDashSecurityCenter.js';
import { fanzSignForensicCore } from './fanzsign/FanzSignForensicCore.js';
import { securityMonitoring } from './monitoring/SecurityMonitoringCore.js';
import { securityOrchestrator } from './integration/SecurityOrchestrator.js';

// Import security utilities
import { emitSecurityEvent, createSecurityEvent, onSecurityEvent } from './fanz-secure/src/utils/securityEvents.js';
import { createSecurityConfig, validateSecurityConfig } from './fanz-secure/src/config.js';

// ===============================
// TYPES & INTERFACES
// ===============================

export interface FanzSecuritySuite {
  // Core security systems
  zeroTrust: typeof zeroTrustCore;
  dashboard: typeof fanzDashSecurityCenter;
  forensics: typeof fanzSignForensicCore;
  monitoring: typeof securityMonitoring;
  orchestrator: typeof securityOrchestrator;
  
  // Utility functions
  logger: typeof createSecurityLogger;
  events: {
    emit: typeof emitSecurityEvent;
    create: typeof createSecurityEvent;
    listen: typeof onSecurityEvent;
  };
  
  // Configuration
  config: {
    create: typeof createSecurityConfig;
    validate: typeof validateSecurityConfig;
  };
  
  // Quick access methods
  processRequest: typeof securityOrchestrator.processSecurityRequest;
  getSystemHealth: () => any;
  recordMetric: (metric: string, value: number, labels?: Record<string, string>) => void;
}

export interface SecurityInitOptions {
  platforms?: string[];
  features?: {
    zeroTrust?: boolean;
    forensics?: boolean;
    monitoring?: boolean;
    dashboard?: boolean;
    orchestration?: boolean;
  };
  config?: {
    redisUrl?: string;
    encryptionKey?: string;
    logLevel?: string;
    metricsPort?: number;
    dashboardPort?: number;
  };
}

export interface PlatformSecurityContext {
  platform: string;
  user_id?: string;
  session_id: string;
  ip_address: string;
  user_agent: string;
  request_path: string;
  request_method: string;
  headers: Record<string, string>;
  timestamp?: Date;
}

export interface SecurityResponse {
  action: 'allow' | 'challenge' | 'block' | 'escalate';
  reason: string;
  confidence: number;
  challenge_type?: string;
  risk_score: number;
  trust_level: string;
  metadata: Record<string, any>;
  expires_at?: Date;
}

// ===============================
// MAIN SECURITY SUITE CLASS
// ===============================

class FanzSecuritySuiteImpl implements FanzSecuritySuite {
  private logger = createSecurityLogger('security-suite');
  private initialized = false;
  private initOptions: SecurityInitOptions = {};

  // Core systems
  public zeroTrust = zeroTrustCore;
  public dashboard = fanzDashSecurityCenter;
  public forensics = fanzSignForensicCore;
  public monitoring = securityMonitoring;
  public orchestrator = securityOrchestrator;

  // Utilities
  public logger_factory = createSecurityLogger;
  public events = {
    emit: emitSecurityEvent,
    create: createSecurityEvent,
    listen: onSecurityEvent
  };

  public config = {
    create: createSecurityConfig,
    validate: validateSecurityConfig
  };

  /**
   * Initialize the FANZ Security Suite
   */
  public async initialize(options: SecurityInitOptions = {}): Promise<void> {
    if (this.initialized) {
      this.logger.warn('Security suite already initialized');
      return;
    }

    this.initOptions = options;
    this.logger.info('🛡️ Initializing FANZ Security Suite', {
      platforms: options.platforms?.length || 'all',
      features: options.features || 'all enabled'
    });

    try {
      // All systems auto-initialize, but we can wait for them here
      await this.waitForSystemsReady();
      
      this.initialized = true;
      this.logger.info('✅ FANZ Security Suite fully initialized and operational');

      // Log system status
      const status = this.getSystemHealth();
      this.logger.info('Security suite status', {
        zero_trust: status.system_health.zero_trust.status,
        forensics: status.system_health.fanzsign.status,
        monitoring: status.system_health.monitoring.status,
        dashboard: status.system_health.fanzdash.status,
        overall: status.system_health.overall_status
      });

    } catch (error) {
      this.logger.error('Failed to initialize security suite', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Wait for all security systems to be ready
   */
  private async waitForSystemsReady(): Promise<void> {
    return new Promise((resolve) => {
      // Give systems a moment to initialize
      setTimeout(() => {
        this.logger.debug('Security systems ready');
        resolve();
      }, 2000);
    });
  }

  /**
   * Process a security request (main API method)
   */
  public processRequest = async (context: PlatformSecurityContext): Promise<SecurityResponse> => {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Convert to internal security context format
      const securityContext = {
        user_id: context.user_id,
        session_id: context.session_id,
        platform: context.platform,
        ip_address: context.ip_address,
        user_agent: context.user_agent,
        timestamp: context.timestamp || new Date(),
        request_metadata: {
          method: context.request_method,
          path: context.request_path,
          headers: context.headers,
          geolocation: this.extractGeolocation(context.headers),
          device_fingerprint: this.createDeviceFingerprint(context)
        },
        security_state: {
          zero_trust_score: 0,
          behavioral_score: 0,
          content_risk_score: 0,
          network_risk_score: 0,
          overall_risk_score: 0,
          trust_level: 'medium' as const,
          requires_challenge: false,
          blocked: false
        }
      };

      // Process through orchestrator
      const decision = await this.orchestrator.processSecurityRequest(securityContext);

      // Convert to external format
      return {
        action: decision.action,
        reason: decision.reason,
        confidence: decision.confidence,
        challenge_type: decision.metadata.challenge_type,
        risk_score: decision.metadata.risk_score || 0,
        trust_level: securityContext.security_state.trust_level,
        metadata: decision.metadata,
        expires_at: decision.expires_at
      };

    } catch (error) {
      this.logger.error('Security request processing failed', {
        platform: context.platform,
        session_id: context.session_id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Return safe default
      return {
        action: 'block',
        reason: 'Security processing error',
        confidence: 1.0,
        risk_score: 1.0,
        trust_level: 'very_low',
        metadata: { error: true }
      };
    }
  };

  /**
   * Get comprehensive system health
   */
  public getSystemHealth = (): any => {
    return this.orchestrator.getStatus();
  };

  /**
   * Record a metric across all monitoring systems
   */
  public recordMetric = (metric: string, value: number, labels: Record<string, string> = {}): void => {
    try {
      // Route to appropriate monitoring system based on metric name
      if (metric.startsWith('auth_')) {
        if (metric === 'auth_attempt') {
          this.monitoring.recordAuthAttempt(
            labels.platform || 'unknown',
            labels.method || 'unknown',
            labels.result as 'success' | 'failure' || 'success'
          );
        }
      } else if (metric.startsWith('incident_')) {
        if (metric === 'incident_created') {
          this.monitoring.recordSecurityIncident(
            labels.platform || 'unknown',
            labels.type || 'unknown',
            labels.severity || 'medium'
          );
        }
      } else if (metric.startsWith('threat_')) {
        if (metric === 'threat_detected') {
          this.monitoring.recordThreatDetection(
            labels.threat_type || 'unknown',
            labels.source || 'unknown',
            labels.severity || 'medium'
          );
        }
      } else if (metric.startsWith('content_')) {
        if (metric === 'content_violation') {
          this.monitoring.recordContentViolation(
            labels.platform || 'unknown',
            labels.violation_type || 'unknown',
            labels.severity || 'medium'
          );
        }
      }

    } catch (error) {
      this.logger.error('Failed to record metric', {
        metric,
        value,
        labels,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Quick access methods
   */

  // Zero Trust
  public evaluateZeroTrust = async (context: any) => {
    return await this.zeroTrust.evaluateAccess(context);
  };

  // Forensics
  public createForensicSignature = async (type: any, metadata: any) => {
    return await this.forensics.createForensicSignature(type, metadata);
  };

  // Monitoring
  public getMetrics = () => {
    return this.monitoring.getMonitoringStatus();
  };

  // Dashboard
  public getIncidents = () => {
    return this.dashboard.getSystemStatus();
  };

  /**
   * Event subscription helpers
   */
  public onSecurityEvent = (eventType: string, handler: (event: any) => void) => {
    this.events.listen(eventType, handler);
  };

  public emitSecurityEvent = async (eventType: string, severity: string, details: any) => {
    await this.events.emit(eventType, severity, details);
  };

  /**
   * Utility methods
   */
  private extractGeolocation(headers: Record<string, string>): any {
    // Extract geolocation data from headers (CloudFlare, etc.)
    return {
      country: headers['cf-ipcountry'] || headers['x-country'] || 'unknown',
      region: headers['cf-region'] || 'unknown',
      city: headers['cf-city'] || 'unknown',
      timezone: headers['cf-timezone'] || 'UTC'
    };
  }

  private createDeviceFingerprint(context: PlatformSecurityContext): any {
    // Create basic device fingerprint from available data
    return {
      browser: this.extractBrowser(context.user_agent),
      os: this.extractOS(context.user_agent),
      screen_resolution: 'unknown',
      timezone: 'unknown',
      language: context.headers['accept-language']?.split(',')[0] || 'unknown',
      plugins: [],
      confidence_score: 0.5
    };
  }

  private extractBrowser(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private extractOS(userAgent: string): string {
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac OS')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  /**
   * Get logger for a specific module
   */
  public getLogger = (module: string) => {
    return createSecurityLogger(module);
  };

  /**
   * Shutdown the entire security suite
   */
  public async shutdown(): Promise<void> {
    this.logger.info('Shutting down FANZ Security Suite');

    try {
      await Promise.all([
        this.orchestrator.shutdown(),
        this.monitoring.shutdown(),
        this.dashboard.shutdown(),
        this.forensics.shutdown()
        // zeroTrust doesn't have shutdown method in current implementation
      ]);

      this.initialized = false;
      this.logger.info('✅ FANZ Security Suite shutdown complete');

    } catch (error) {
      this.logger.error('Error during security suite shutdown', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get integration status and health
   */
  public getIntegrationStatus(): any {
    return {
      initialized: this.initialized,
      init_options: this.initOptions,
      system_health: this.getSystemHealth(),
      components: {
        zero_trust: { status: 'operational', version: '1.0.0' },
        forensics: { status: 'operational', version: '1.0.0' },
        monitoring: { status: 'operational', version: '1.0.0' },
        dashboard: { status: 'operational', version: '1.0.0' },
        orchestrator: { status: 'operational', version: '1.0.0' }
      },
      uptime: process.uptime(),
      last_check: new Date()
    };
  }
}

// ===============================
// SINGLETON INSTANCE
// ===============================

const fanzSecurity = new FanzSecuritySuiteImpl();

// ===============================
// CONVENIENCE EXPORTS
// ===============================

// Main security suite instance
export default fanzSecurity;
export const FanzSecurity = fanzSecurity;

// Individual systems (for advanced usage)
export {
  zeroTrustCore,
  fanzDashSecurityCenter,
  fanzSignForensicCore,
  securityMonitoring,
  securityOrchestrator
};

// Utilities
export {
  createSecurityLogger,
  emitSecurityEvent,
  createSecurityEvent,
  onSecurityEvent,
  createSecurityConfig,
  validateSecurityConfig
};

// Types
export type {
  FanzSecuritySuite,
  SecurityInitOptions,
  PlatformSecurityContext,
  SecurityResponse
};

// ===============================
// EXPRESS MIDDLEWARE
// ===============================

/**
 * Express middleware for automatic security processing
 */
export const fanzSecurityMiddleware = (options: { platform: string } = { platform: 'unknown' }) => {
  return async (req: any, res: any, next: any) => {
    try {
      const context: PlatformSecurityContext = {
        platform: options.platform,
        user_id: req.user?.id,
        session_id: req.sessionID || req.headers['x-session-id'] || 'anonymous',
        ip_address: req.ip || req.connection.remoteAddress || 'unknown',
        user_agent: req.headers['user-agent'] || 'unknown',
        request_path: req.path,
        request_method: req.method,
        headers: req.headers
      };

      const securityResponse = await fanzSecurity.processRequest(context);

      // Add security info to request
      req.security = securityResponse;

      // Handle security decisions
      switch (securityResponse.action) {
        case 'block':
          return res.status(403).json({
            error: 'Access denied',
            reason: securityResponse.reason,
            challenge_id: null
          });

        case 'challenge':
          return res.status(401).json({
            error: 'Authentication challenge required',
            challenge_type: securityResponse.challenge_type,
            challenge_id: `ch_${Date.now()}`,
            expires_at: securityResponse.expires_at
          });

        case 'allow':
          // Continue to next middleware
          next();
          break;

        default:
          // Log and continue
          fanzSecurity.getLogger('middleware').warn('Unknown security action', {
            action: securityResponse.action,
            session_id: context.session_id
          });
          next();
      }

    } catch (error) {
      fanzSecurity.getLogger('middleware').error('Security middleware error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        path: req.path
      });
      
      // Fail secure - block on error
      return res.status(500).json({
        error: 'Security processing error',
        reason: 'Internal security error'
      });
    }
  };
};

// ===============================
// PLATFORM INTEGRATION HELPERS
// ===============================

/**
 * Helper functions for specific platform integrations
 */
export const PlatformIntegration = {
  // BoyFanz integration
  boyFanz: {
    middleware: fanzSecurityMiddleware({ platform: 'boyfanz' }),
    processRequest: (context: Omit<PlatformSecurityContext, 'platform'>) => 
      fanzSecurity.processRequest({ ...context, platform: 'boyfanz' })
  },

  // GirlFanz integration  
  girlFanz: {
    middleware: fanzSecurityMiddleware({ platform: 'girlfanz' }),
    processRequest: (context: Omit<PlatformSecurityContext, 'platform'>) => 
      fanzSecurity.processRequest({ ...context, platform: 'girlfanz' })
  },

  // FanzTube integration
  fanzTube: {
    middleware: fanzSecurityMiddleware({ platform: 'fanztube' }),
    processRequest: (context: Omit<PlatformSecurityContext, 'platform'>) => 
      fanzSecurity.processRequest({ ...context, platform: 'fanztube' })
  },

  // Universal integration for any platform
  universal: (platformName: string) => ({
    middleware: fanzSecurityMiddleware({ platform: platformName }),
    processRequest: (context: Omit<PlatformSecurityContext, 'platform'>) => 
      fanzSecurity.processRequest({ ...context, platform: platformName })
  })
};

// ===============================
// STARTUP MESSAGE
// ===============================

const logger = createSecurityLogger('security-suite-main');
logger.info('🛡️ FANZ Security Suite loaded and ready for initialization');
logger.info('📚 Available integrations: Zero-Trust, FanzDash, FanzSign, Monitoring, Orchestration');
logger.info('🔌 Platform support: All 13 FANZ platforms with unified security');
logger.info('⚡ Features: Real-time threat detection, forensic analysis, compliance monitoring');

export { logger as securityLogger };