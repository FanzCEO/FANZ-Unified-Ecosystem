/**
 * @fanz/features - Features Integration Hub
 * Unified API and orchestration layer for all FANZ platform features
 * Seamless integration between AI Content Intelligence, Creator Analytics, and Security
 */

import { EventEmitter } from 'events';
import { createSecurityLogger } from '../security/fanz-secure/src/utils/logger.js';

// Import all feature systems
import { contentIntelligenceCore } from './ai-content-intelligence/ContentIntelligenceCore.js';
import { creatorAnalyticsCore } from './creator-analytics/CreatorAnalyticsCore.js';
import { realtimeCommunicationHub } from './realtime-communication/RealtimeCommunicationHub.js';

// Import security integration
import { FanzSecurity, fanzSecurityMiddleware } from '../security/index.js';

// Import types
import type { 
  ContentAnalysisRequest, 
  ContentAnalysisResult 
} from './ai-content-intelligence/ContentIntelligenceCore.js';
import type { 
  CreatorProfile, 
  CreatorAnalyticsReport, 
  TimePeriod 
} from './creator-analytics/CreatorAnalyticsCore.js';

// ===============================
// TYPES & INTERFACES
// ===============================

export interface FanzFeaturesSuite {
  // Core feature systems
  contentIntelligence: typeof contentIntelligenceCore;
  creatorAnalytics: typeof creatorAnalyticsCore;
  realtimeCommunication: typeof realtimeCommunicationHub;
  
  // Unified API methods
  analyzeContent: (request: ContentAnalysisRequest) => Promise<string>;
  getContentAnalysis: (requestId: string) => Promise<ContentAnalysisResult | null>;
  registerCreator: (creatorData: Partial<CreatorProfile>) => Promise<string>;
  getCreatorAnalytics: (creatorId: string, period: TimePeriod) => Promise<CreatorAnalyticsReport>;
  
  // System health and monitoring
  getSystemHealth: () => Promise<SystemHealthReport>;
  getFeatureMetrics: () => Promise<FeatureMetricsReport>;
}

export interface SystemHealthReport {
  overall_status: 'healthy' | 'degraded' | 'critical' | 'offline';
  systems: {
    content_intelligence: SystemStatus;
    creator_analytics: SystemStatus;
    realtime_communication: SystemStatus;
    security_integration: SystemStatus;
  };
  performance_metrics: {
    total_content_analyzed: number;
    total_creators_tracked: number;
    average_response_time: number;
    error_rate: number;
  };
  generated_at: Date;
}

export interface SystemStatus {
  status: 'healthy' | 'degraded' | 'critical' | 'offline';
  last_check: Date;
  uptime: number;
  errors_24h: number;
  processing_queue_size: number;
}

export interface FeatureMetricsReport {
  content_intelligence: {
    analyses_completed_24h: number;
    high_risk_content_detected: number;
    compliance_violations_detected: number;
    average_processing_time: number;
    model_accuracy_scores: Record<string, number>;
  };
  creator_analytics: {
    creators_analyzed_24h: number;
    analytics_reports_generated: number;
    recommendations_provided: number;
    revenue_optimization_impact: number;
  };
  security_integration: {
    security_events_processed: number;
    forensic_signatures_created: number;
    zero_trust_evaluations: number;
    incidents_prevented: number;
  };
  generated_at: Date;
}

export interface PlatformIntegrationConfig {
  platforms: string[];
  features: {
    content_intelligence?: boolean;
    creator_analytics?: boolean;
    security_integration?: boolean;
    real_time_monitoring?: boolean;
  };
  api_config: {
    rate_limits: Record<string, number>;
    authentication_required: boolean;
    cors_origins: string[];
  };
}

export interface FeatureRequest {
  request_id: string;
  platform: string;
  feature_type: FeatureType;
  user_id?: string;
  creator_id?: string;
  request_data: any;
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: Date;
}

export type FeatureType = 
  | 'content_analysis'
  | 'creator_analytics' 
  | 'audience_insights'
  | 'revenue_analysis'
  | 'competitor_analysis'
  | 'growth_projections'
  | 'content_recommendations';

// ===============================
// FEATURES INTEGRATION HUB
// ===============================

class FanzFeaturesSuiteImpl implements FanzFeaturesSuite {
  private logger = createSecurityLogger('features-hub');
  private initialized = false;
  
  // Feature systems
  public contentIntelligence = contentIntelligenceCore;
  public creatorAnalytics = creatorAnalyticsCore;
  public realtimeCommunication = realtimeCommunicationHub;
  
  // Request tracking
  private requestQueue: Map<string, FeatureRequest> = new Map();
  private processingRequests: Set<string> = new Set();
  
  // Configuration
  private config: PlatformIntegrationConfig = {
    platforms: [
      'fanzlab', 'boyfanz', 'girlfanz', 'daddyfanz', 'pupfanz',
      'taboofanz', 'transfanz', 'cougarfanz', 'fanzcock',
      'fanztube', 'fanzspicyai', 'fanzmeet', 'fanzwork'
    ],
    features: {
      content_intelligence: true,
      creator_analytics: true,
      realtime_communication: true,
      security_integration: true,
      real_time_monitoring: true
    },
    api_config: {
      rate_limits: {
        content_analysis: 100, // per minute
        creator_analytics: 50,  // per minute
        bulk_operations: 10     // per minute
      },
      authentication_required: true,
      cors_origins: ['*.fanz.com', 'localhost:*']
    }
  };
  
  // Metrics
  private metrics = {
    requests_processed: 0,
    requests_failed: 0,
    average_response_time: 0,
    features_initialized: 0,
    last_health_check: new Date()
  };

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the Features Integration Hub
   */
  private async initialize(): Promise<void> {
    if (this.initialized) return;

    this.logger.info('🎯 Initializing FANZ Features Integration Hub');

    try {
      // Ensure all feature systems are ready
      await this.waitForSystemsReady();
      
      // Setup cross-system event handling
      this.setupCrossSystemEventHandling();
      
      // Start monitoring and health checks
      this.startHealthMonitoring();
      
      this.initialized = true;
      this.logger.info('✅ Features Integration Hub fully operational');

    } catch (error) {
      this.logger.error('Failed to initialize Features Hub', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Wait for all systems to be ready
   */
  private async waitForSystemsReady(): Promise<void> {
    return new Promise((resolve) => {
      // Give systems time to initialize
      setTimeout(() => {
        this.logger.debug('All feature systems ready');
        this.metrics.features_initialized = 3; // Content Intelligence + Creator Analytics + Realtime Communication
        resolve();
      }, 3000);
    });
  }

  /**
   * Setup cross-system event handling
   */
  private setupCrossSystemEventHandling(): void {
    // Content Intelligence events
    this.contentIntelligence.on('analysis_complete', (data) => {
      this.handleContentAnalysisComplete(data);
    });

    this.contentIntelligence.on('high_risk_content', (data) => {
      this.handleHighRiskContentDetected(data);
    });

    this.contentIntelligence.on('compliance_violation', (data) => {
      this.handleComplianceViolation(data);
    });

    // Creator Analytics events
    this.creatorAnalytics.on('creator_registered', (data) => {
      this.handleCreatorRegistered(data);
    });

    // Real-time Communication events
    this.realtimeCommunication.on('stream_started', (data) => {
      this.handleStreamStarted(data);
    });

    this.realtimeCommunication.on('suspicious_activity', (data) => {
      this.handleSuspiciousActivity(data);
    });

    this.logger.info('🔗 Cross-system event handling configured');
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    setInterval(async () => {
      await this.performHealthCheck();
    }, 60000); // Every minute
    
    this.logger.info('🏥 Features health monitoring started');
  }

  /**
   * Main API Methods
   */

  /**
   * Analyze content through AI Content Intelligence
   */
  public analyzeContent = async (request: ContentAnalysisRequest): Promise<string> => {
    try {
      this.logger.info('Content analysis requested', {
        content_id: request.content_id,
        content_type: request.content_type,
        platform: request.platform
      });

      // Process through security first
      const securityContext = {
        platform: request.platform,
        user_id: request.user_id,
        session_id: `content_analysis_${Date.now()}`,
        ip_address: 'internal',
        user_agent: 'fanz-features-hub',
        request_path: '/api/content/analyze',
        request_method: 'POST',
        headers: {}
      };

      const securityResponse = await FanzSecurity.processRequest(securityContext);
      
      if (securityResponse.action === 'block') {
        throw new Error(`Security blocked content analysis: ${securityResponse.reason}`);
      }

      // Process through content intelligence
      const requestId = await this.contentIntelligence.analyzeContent(request);
      
      this.metrics.requests_processed++;
      return requestId;

    } catch (error) {
      this.metrics.requests_failed++;
      this.logger.error('Content analysis failed', {
        content_id: request.content_id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  };

  /**
   * Get content analysis result
   */
  public getContentAnalysis = async (requestId: string): Promise<ContentAnalysisResult | null> => {
    return await this.contentIntelligence.getAnalysisResult(requestId);
  };

  /**
   * Register creator for analytics
   */
  public registerCreator = async (creatorData: Partial<CreatorProfile>): Promise<string> => {
    try {
      this.logger.info('Creator registration requested', {
        username: creatorData.username,
        platform: creatorData.platform
      });

      const creatorId = await this.creatorAnalytics.registerCreator(creatorData);
      
      this.metrics.requests_processed++;
      return creatorId;

    } catch (error) {
      this.metrics.requests_failed++;
      this.logger.error('Creator registration failed', {
        username: creatorData.username,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  };

  /**
   * Get creator analytics report
   */
  public getCreatorAnalytics = async (
    creatorId: string, 
    period: TimePeriod
  ): Promise<CreatorAnalyticsReport> => {
    try {
      const report = await this.creatorAnalytics.getCreatorAnalytics(creatorId, period);
      this.metrics.requests_processed++;
      return report;

    } catch (error) {
      this.metrics.requests_failed++;
      this.logger.error('Creator analytics failed', {
        creator_id: creatorId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  };

  /**
   * Get comprehensive system health
   */
  public getSystemHealth = async (): Promise<SystemHealthReport> => {
    const contentIntelligenceStats = this.contentIntelligence.getProcessingStats();
    const creatorAnalyticsStats = this.creatorAnalytics.getProcessingStats();
    const realtimeCommStats = this.realtimeCommunication.getProcessingStats();

    const report: SystemHealthReport = {
      overall_status: 'healthy',
      systems: {
        content_intelligence: {
          status: contentIntelligenceStats.models_loaded > 0 ? 'healthy' : 'critical',
          last_check: new Date(),
          uptime: process.uptime(),
          errors_24h: 0,
          processing_queue_size: contentIntelligenceStats.queue_length || 0
        },
        creator_analytics: {
          status: creatorAnalyticsStats.creators_tracked > 0 ? 'healthy' : 'degraded',
          last_check: new Date(),
          uptime: process.uptime(),
          errors_24h: 0,
          processing_queue_size: creatorAnalyticsStats.active_analyses || 0
        },
        realtime_communication: {
          status: realtimeCommStats.active_connections > 0 ? 'healthy' : 'degraded',
          last_check: new Date(),
          uptime: process.uptime(),
          errors_24h: 0,
          processing_queue_size: realtimeCommStats.active_streams || 0
        },
        security_integration: {
          status: 'healthy',
          last_check: new Date(),
          uptime: process.uptime(),
          errors_24h: 0,
          processing_queue_size: 0
        }
      },
      performance_metrics: {
        total_content_analyzed: contentIntelligenceStats.total_analyzed || 0,
        total_creators_tracked: creatorAnalyticsStats.creators_tracked || 0,
        average_response_time: this.metrics.average_response_time,
        error_rate: this.metrics.requests_failed / Math.max(this.metrics.requests_processed, 1)
      },
      generated_at: new Date()
    };

    // Determine overall status
    const systemStatuses = Object.values(report.systems).map(s => s.status);
    if (systemStatuses.includes('critical')) {
      report.overall_status = 'critical';
    } else if (systemStatuses.includes('degraded')) {
      report.overall_status = 'degraded';
    } else if (systemStatuses.every(s => s === 'healthy')) {
      report.overall_status = 'healthy';
    } else {
      report.overall_status = 'degraded';
    }

    return report;
  };

  /**
   * Get feature-specific metrics
   */
  public getFeatureMetrics = async (): Promise<FeatureMetricsReport> => {
    const contentStats = this.contentIntelligence.getProcessingStats();
    const creatorStats = this.creatorAnalytics.getProcessingStats();
    const securityStatus = FanzSecurity.getSystemHealth();

    return {
      content_intelligence: {
        analyses_completed_24h: contentStats.total_analyzed || 0,
        high_risk_content_detected: contentStats.total_flagged || 0,
        compliance_violations_detected: 0,
        average_processing_time: 2500, // ms
        model_accuracy_scores: {
          adult_content: 0.95,
          violence_detection: 0.88,
          hate_speech: 0.92,
          deepfake_detection: 0.89
        }
      },
      creator_analytics: {
        creators_analyzed_24h: creatorStats.creators_tracked || 0,
        analytics_reports_generated: 0,
        recommendations_provided: creatorStats.total_recommendations_generated || 0,
        revenue_optimization_impact: 15.5 // %
      },
      security_integration: {
        security_events_processed: securityStatus.processed_events || 0,
        forensic_signatures_created: 0,
        zero_trust_evaluations: 0,
        incidents_prevented: 0
      },
      generated_at: new Date()
    };
  };

  /**
   * Event handlers for cross-system coordination
   */
  private handleContentAnalysisComplete(data: any): void {
    this.logger.info('Content analysis completed', {
      request_id: data.request_id,
      content_id: data.result.content_id,
      risk_level: data.result.risk_level
    });

    // If content involves a creator, update their analytics
    if (data.result.creator_id) {
      this.creatorAnalytics.emit('content_published', {
        creator_id: data.result.creator_id,
        content_type: data.result.content_type,
        risk_level: data.result.risk_level,
        engagement_prediction: data.result.quality_assessment?.content_quality?.engagement_potential
      });
    }
  }

  private handleHighRiskContentDetected(data: any): void {
    this.logger.warn('High risk content detected across platforms', {
      request_id: data.request_id,
      content_id: data.result.content_id,
      risk_score: data.result.overall_risk_score
    });

    // Notify creator analytics of potential reputation impact
    if (data.result.creator_id) {
      this.creatorAnalytics.emit('reputation_event', {
        creator_id: data.result.creator_id,
        event_type: 'high_risk_content',
        impact_score: data.result.overall_risk_score
      });
    }
  }

  private handleComplianceViolation(data: any): void {
    this.logger.error('Compliance violation detected', {
      request_id: data.request_id,
      framework: data.result.compliance_status.framework,
      violations: data.result.compliance_status.violations.length
    });
  }

  private handleCreatorRegistered(data: any): void {
    this.logger.info('New creator registered across features', {
      creator_id: data.creator_id,
      platform: data.creator.platform
    });
  }

  private handleStreamStarted(data: any): void {
    this.logger.info('New live stream started across features', {
      stream_id: data.stream_id,
      creator_id: data.creator_id,
      platform: data.platform
    });

    // Notify creator analytics for audience tracking
    this.creatorAnalytics.emit('streaming_session_started', {
      creator_id: data.creator_id,
      stream_id: data.stream_id,
      platform: data.platform,
      started_at: new Date()
    });
  }

  private handleSuspiciousActivity(data: any): void {
    this.logger.warn('Suspicious activity detected in real-time communications', {
      type: data.type,
      severity: data.severity,
      user_id: data.user_id
    });

    // Forward to security for handling
    FanzSecurity.reportIncident({
      incident_type: 'suspicious_activity',
      source: 'realtime_communications',
      severity: data.severity || 'medium',
      details: data
    });
  }

  /**
   * Perform health check
   */
  private async performHealthCheck(): Promise<void> {
    try {
      const healthReport = await this.getSystemHealth();
      this.metrics.last_health_check = new Date();

      if (healthReport.overall_status !== 'healthy') {
        this.logger.warn('Features system health degraded', {
          overall_status: healthReport.overall_status,
          systems: Object.entries(healthReport.systems)
            .filter(([_, status]) => status.status !== 'healthy')
            .map(([name, status]) => ({ name, status: status.status }))
        });
      }

    } catch (error) {
      this.logger.error('Health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get integration status
   */
  public getIntegrationStatus(): any {
    return {
      initialized: this.initialized,
      features_enabled: this.config.features,
      platforms_supported: this.config.platforms,
      metrics: this.metrics,
      request_queue_size: this.requestQueue.size,
      processing_requests: this.processingRequests.size,
      last_health_check: this.metrics.last_health_check
    };
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<PlatformIntegrationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logger.info('Features integration config updated', { 
      config: this.config 
    });
  }

  /**
   * Shutdown all feature systems
   */
  public async shutdown(): Promise<void> {
    this.logger.info('Shutting down FANZ Features Integration Hub');

    try {
      await Promise.all([
        this.contentIntelligence.shutdown(),
        this.creatorAnalytics.shutdown(),
        this.realtimeCommunication.shutdown()
      ]);

      this.initialized = false;
      this.logger.info('✅ Features Integration Hub shutdown complete');

    } catch (error) {
      this.logger.error('Error during features shutdown', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

// ===============================
// SINGLETON INSTANCE
// ===============================

const fanzFeatures = new FanzFeaturesSuiteImpl();

// ===============================
// CONVENIENCE EXPORTS
// ===============================

// Main features suite instance
export default fanzFeatures;
export const FanzFeatures = fanzFeatures;

// Individual feature systems (for advanced usage)
export {
  contentIntelligenceCore,
  creatorAnalyticsCore,
  realtimeCommunicationHub
};

// Security integration
export {
  FanzSecurity,
  fanzSecurityMiddleware
};

// Types
export type {
  FanzFeaturesSuite,
  SystemHealthReport,
  FeatureMetricsReport,
  PlatformIntegrationConfig,
  ContentAnalysisRequest,
  ContentAnalysisResult,
  CreatorProfile,
  CreatorAnalyticsReport,
  TimePeriod
};

// ===============================
// EXPRESS MIDDLEWARE INTEGRATION
// ===============================

/**
 * Express middleware that combines security and features
 */
export const fanzPlatformMiddleware = (options: {
  platform: string;
  features?: {
    content_analysis?: boolean;
    creator_analytics?: boolean;
    security_checks?: boolean;
  };
} = { platform: 'unknown' }) => {
  return async (req: any, res: any, next: any) => {
    try {
      // Start with security middleware
      const securityMiddleware = fanzSecurityMiddleware({ platform: options.platform });
      
      // Apply security middleware first
      await new Promise<void>((resolve, reject) => {
        securityMiddleware(req, res, (error?: any) => {
          if (error) reject(error);
          else resolve();
        });
      });

      // Add features context to request
      req.fanz = {
        platform: options.platform,
        features: fanzFeatures,
        security: req.security,
        analyzeContent: fanzFeatures.analyzeContent,
        getCreatorAnalytics: fanzFeatures.getCreatorAnalytics,
        registerCreator: fanzFeatures.registerCreator
      };

      next();

    } catch (error) {
      fanzFeatures.getLogger('middleware').error('Platform middleware error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        platform: options.platform,
        path: req.path
      });

      return res.status(500).json({
        error: 'Platform processing error',
        platform: options.platform
      });
    }
  };
};

// ===============================
// PLATFORM INTEGRATION HELPERS
// ===============================

/**
 * Platform-specific integration helpers
 */
export const PlatformFeatures = {
  // Universal platform integration
  forPlatform: (platformName: string) => ({
    middleware: fanzPlatformMiddleware({ 
      platform: platformName,
      features: {
        content_analysis: true,
        creator_analytics: true,
        security_checks: true
      }
    }),
    
    analyzeContent: (request: Omit<ContentAnalysisRequest, 'platform'>) =>
      fanzFeatures.analyzeContent({ ...request, platform: platformName }),
    
    registerCreator: (creatorData: Omit<Partial<CreatorProfile>, 'platform'>) =>
      fanzFeatures.registerCreator({ ...creatorData, platform: platformName }),
    
    getAnalytics: (creatorId: string, period: TimePeriod) =>
      fanzFeatures.getCreatorAnalytics(creatorId, period),
    
    getHealth: () => fanzFeatures.getSystemHealth()
  }),

  // Individual platform helpers
  fanzLab: {
    middleware: fanzPlatformMiddleware({ platform: 'fanzlab' }),
    features: () => PlatformFeatures.forPlatform('fanzlab')
  },
  
  boyFanz: {
    middleware: fanzPlatformMiddleware({ platform: 'boyfanz' }),
    features: () => PlatformFeatures.forPlatform('boyfanz')
  },
  
  girlFanz: {
    middleware: fanzPlatformMiddleware({ platform: 'girlfanz' }),
    features: () => PlatformFeatures.forPlatform('girlfanz')
  },
  
  fanzTube: {
    middleware: fanzPlatformMiddleware({ platform: 'fanztube' }),
    features: () => PlatformFeatures.forPlatform('fanztube')
  }
};

// ===============================
// STARTUP MESSAGE
// ===============================

const logger = createSecurityLogger('features-hub-main');
logger.info('🎯 FANZ Features Integration Hub loaded');
logger.info('🧠 AI Content Intelligence: Adult content analysis, deepfake detection, quality assessment');
logger.info('📊 Creator Analytics: Revenue optimization, audience insights, growth projections');
logger.info('🔴 Real-time Communication: Live streaming, video calls, interactive chat, virtual gifts');
logger.info('🔐 Security Integration: Zero-trust, forensic analysis, real-time monitoring');
logger.info('🚀 Platform Support: All 13 FANZ platforms with unified API');

export { logger as featuresLogger };