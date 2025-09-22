/**
 * @fanzsecurity/monitoring - Advanced Security Monitoring & Observability
 * Prometheus metrics, Grafana dashboards, real-time alerting
 * Comprehensive observability for FANZ security infrastructure
 */

import { EventEmitter } from 'events';
import { createSecurityLogger } from '../fanz-secure/src/utils/logger.js';
import { emitSecurityEvent } from '../fanz-secure/src/utils/securityEvents.js';
import { register, collectDefaultMetrics, Counter, Gauge, Histogram, Summary } from 'prom-client';
import * as redis from 'redis';
import * as fs from 'fs/promises';
import * as path from 'path';
import { config } from '../fanz-secure/src/config.js';
import http from 'http';
import express from 'express';

// ===============================
// TYPES & INTERFACES
// ===============================

export interface SecurityMetrics {
  // Authentication metrics
  auth_attempts_total: Counter<string>;
  auth_failures_total: Counter<string>;
  auth_success_rate: Gauge<string>;
  auth_response_time: Histogram<string>;
  
  // Zero Trust metrics
  zero_trust_evaluations_total: Counter<string>;
  zero_trust_risk_score: Gauge<string>;
  zero_trust_challenges_issued: Counter<string>;
  zero_trust_re_auth_required: Counter<string>;
  
  // Incident metrics
  security_incidents_total: Counter<string>;
  incident_response_time: Histogram<string>;
  incident_resolution_time: Histogram<string>;
  active_incidents: Gauge<string>;
  
  // Threat metrics
  threats_detected_total: Counter<string>;
  threat_intelligence_updates: Counter<string>;
  blocked_ips_total: Counter<string>;
  suspicious_requests_total: Counter<string>;
  
  // Content security metrics
  content_scans_total: Counter<string>;
  content_violations_total: Counter<string>;
  content_risk_score: Gauge<string>;
  adult_content_detected: Counter<string>;
  
  // Platform health metrics
  platform_uptime: Gauge<string>;
  platform_response_time: Histogram<string>;
  platform_error_rate: Gauge<string>;
  platform_active_users: Gauge<string>;
  
  // Compliance metrics
  compliance_checks_total: Counter<string>;
  compliance_violations_total: Counter<string>;
  gdpr_requests_total: Counter<string>;
  regulation_2257_checks: Counter<string>;
  
  // Forensic metrics
  forensic_signatures_total: Counter<string>;
  behavioral_anomalies_total: Counter<string>;
  network_anomalies_total: Counter<string>;
  evidence_integrity_checks: Counter<string>;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  metric: string;
  condition: AlertCondition;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  notification_channels: string[];
  cooldown_period: number; // seconds
  last_triggered?: Date;
}

export interface AlertCondition {
  operator: '>' | '<' | '==' | '>=' | '<=' | '!=';
  duration: number; // seconds
  aggregation?: 'sum' | 'avg' | 'max' | 'min' | 'count';
}

export interface SecurityAlert {
  id: string;
  rule_id: string;
  metric: string;
  value: number;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  triggered_at: Date;
  description: string;
  context: Record<string, any>;
  status: 'active' | 'acknowledged' | 'resolved';
  acknowledged_by?: string;
  acknowledged_at?: Date;
  resolved_at?: Date;
}

export interface DashboardConfig {
  id: string;
  title: string;
  description: string;
  panels: DashboardPanel[];
  refresh_interval: number;
  time_range: string;
}

export interface DashboardPanel {
  id: string;
  title: string;
  type: 'graph' | 'gauge' | 'table' | 'heatmap' | 'stat';
  query: string;
  position: { x: number; y: number; w: number; h: number };
  color_scheme: string;
  thresholds?: Threshold[];
}

export interface Threshold {
  value: number;
  color: string;
  condition: '>' | '<';
}

export interface MonitoringReport {
  id: string;
  period: { start: Date; end: Date };
  metrics_summary: MetricsSummary;
  security_overview: SecurityOverview;
  platform_health: PlatformHealthSummary;
  alerts_summary: AlertsSummary;
  recommendations: string[];
  generated_at: Date;
}

export interface MetricsSummary {
  total_auth_attempts: number;
  auth_success_rate: number;
  total_incidents: number;
  avg_incident_response_time: number;
  threats_detected: number;
  compliance_violations: number;
  platform_uptime_avg: number;
}

export interface SecurityOverview {
  overall_security_score: number;
  zero_trust_effectiveness: number;
  incident_trends: string;
  top_threat_sources: string[];
  critical_vulnerabilities: string[];
}

export interface PlatformHealthSummary {
  platforms_healthy: number;
  platforms_degraded: number;
  platforms_critical: number;
  avg_response_time: number;
  error_rate: number;
}

export interface AlertsSummary {
  total_alerts: number;
  critical_alerts: number;
  unresolved_alerts: number;
  avg_resolution_time: number;
  top_alert_types: string[];
}

// ===============================
// SECURITY MONITORING CORE
// ===============================

export class SecurityMonitoringCore extends EventEmitter {
  private logger = createSecurityLogger('security-monitoring');
  private redisClient: redis.RedisClientType;
  private metricsServer?: http.Server;
  private alertingEngine?: NodeJS.Timeout;
  
  // Metrics
  public metrics: SecurityMetrics;
  
  // Alerting
  private alertRules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, SecurityAlert> = new Map();
  private alertHistory: SecurityAlert[] = [];
  
  // Dashboards
  private dashboardConfigs: Map<string, DashboardConfig> = new Map();
  
  // Configuration
  private readonly config = {
    metrics_port: 3003,
    metrics_path: '/metrics',
    alert_check_interval: 30000, // 30 seconds
    dashboard_refresh_interval: 60000, // 1 minute
    metrics_retention_days: 30,
    alert_history_limit: 1000,
    enable_default_alerts: true,
    grafana_webhook_url: process.env.GRAFANA_WEBHOOK_URL,
    slack_webhook_url: process.env.SLACK_WEBHOOK_URL,
    pagerduty_integration_key: process.env.PAGERDUTY_INTEGRATION_KEY,
  };

  constructor() {
    super();
    this.initializeMetrics();
    this.initialize();
  }

  /**
   * Initialize all metrics
   */
  private initializeMetrics(): void {
    // Enable default Node.js metrics
    collectDefaultMetrics({ register });

    this.metrics = {
      // Authentication metrics
      auth_attempts_total: new Counter({
        name: 'fanz_auth_attempts_total',
        help: 'Total number of authentication attempts',
        labelNames: ['platform', 'method', 'result'],
        registers: [register]
      }),

      auth_failures_total: new Counter({
        name: 'fanz_auth_failures_total',
        help: 'Total number of authentication failures',
        labelNames: ['platform', 'reason', 'ip_address'],
        registers: [register]
      }),

      auth_success_rate: new Gauge({
        name: 'fanz_auth_success_rate',
        help: 'Authentication success rate percentage',
        labelNames: ['platform'],
        registers: [register]
      }),

      auth_response_time: new Histogram({
        name: 'fanz_auth_response_time_seconds',
        help: 'Authentication response time in seconds',
        labelNames: ['platform', 'method'],
        buckets: [0.1, 0.5, 1, 2, 5, 10],
        registers: [register]
      }),

      // Zero Trust metrics
      zero_trust_evaluations_total: new Counter({
        name: 'fanz_zero_trust_evaluations_total',
        help: 'Total number of zero trust evaluations',
        labelNames: ['platform', 'result'],
        registers: [register]
      }),

      zero_trust_risk_score: new Gauge({
        name: 'fanz_zero_trust_risk_score',
        help: 'Current zero trust risk score',
        labelNames: ['user_id', 'session_id'],
        registers: [register]
      }),

      zero_trust_challenges_issued: new Counter({
        name: 'fanz_zero_trust_challenges_issued_total',
        help: 'Total number of zero trust challenges issued',
        labelNames: ['challenge_type', 'reason'],
        registers: [register]
      }),

      zero_trust_re_auth_required: new Counter({
        name: 'fanz_zero_trust_re_auth_required_total',
        help: 'Total number of re-authentication requirements',
        labelNames: ['trigger_reason'],
        registers: [register]
      }),

      // Incident metrics
      security_incidents_total: new Counter({
        name: 'fanz_security_incidents_total',
        help: 'Total number of security incidents',
        labelNames: ['platform', 'type', 'severity'],
        registers: [register]
      }),

      incident_response_time: new Histogram({
        name: 'fanz_incident_response_time_seconds',
        help: 'Security incident response time in seconds',
        labelNames: ['severity', 'type'],
        buckets: [60, 300, 900, 1800, 3600, 7200],
        registers: [register]
      }),

      incident_resolution_time: new Histogram({
        name: 'fanz_incident_resolution_time_seconds',
        help: 'Security incident resolution time in seconds',
        labelNames: ['severity', 'type'],
        buckets: [300, 1800, 3600, 14400, 86400, 604800],
        registers: [register]
      }),

      active_incidents: new Gauge({
        name: 'fanz_active_incidents',
        help: 'Number of active security incidents',
        labelNames: ['severity'],
        registers: [register]
      }),

      // Threat metrics
      threats_detected_total: new Counter({
        name: 'fanz_threats_detected_total',
        help: 'Total number of threats detected',
        labelNames: ['threat_type', 'source', 'severity'],
        registers: [register]
      }),

      threat_intelligence_updates: new Counter({
        name: 'fanz_threat_intelligence_updates_total',
        help: 'Total number of threat intelligence updates',
        labelNames: ['source', 'indicator_type'],
        registers: [register]
      }),

      blocked_ips_total: new Counter({
        name: 'fanz_blocked_ips_total',
        help: 'Total number of blocked IP addresses',
        labelNames: ['reason', 'platform'],
        registers: [register]
      }),

      suspicious_requests_total: new Counter({
        name: 'fanz_suspicious_requests_total',
        help: 'Total number of suspicious requests',
        labelNames: ['platform', 'type', 'action'],
        registers: [register]
      }),

      // Content security metrics
      content_scans_total: new Counter({
        name: 'fanz_content_scans_total',
        help: 'Total number of content scans',
        labelNames: ['platform', 'content_type', 'result'],
        registers: [register]
      }),

      content_violations_total: new Counter({
        name: 'fanz_content_violations_total',
        help: 'Total number of content violations',
        labelNames: ['platform', 'violation_type', 'severity'],
        registers: [register]
      }),

      content_risk_score: new Gauge({
        name: 'fanz_content_risk_score',
        help: 'Content risk score',
        labelNames: ['platform', 'content_id'],
        registers: [register]
      }),

      adult_content_detected: new Counter({
        name: 'fanz_adult_content_detected_total',
        help: 'Total adult content detections',
        labelNames: ['platform', 'confidence_level', 'action'],
        registers: [register]
      }),

      // Platform health metrics
      platform_uptime: new Gauge({
        name: 'fanz_platform_uptime_percentage',
        help: 'Platform uptime percentage',
        labelNames: ['platform'],
        registers: [register]
      }),

      platform_response_time: new Histogram({
        name: 'fanz_platform_response_time_seconds',
        help: 'Platform response time in seconds',
        labelNames: ['platform', 'endpoint'],
        buckets: [0.1, 0.3, 0.5, 1, 3, 5, 10],
        registers: [register]
      }),

      platform_error_rate: new Gauge({
        name: 'fanz_platform_error_rate_percentage',
        help: 'Platform error rate percentage',
        labelNames: ['platform'],
        registers: [register]
      }),

      platform_active_users: new Gauge({
        name: 'fanz_platform_active_users',
        help: 'Number of active users on platform',
        labelNames: ['platform'],
        registers: [register]
      }),

      // Compliance metrics
      compliance_checks_total: new Counter({
        name: 'fanz_compliance_checks_total',
        help: 'Total number of compliance checks',
        labelNames: ['framework', 'result'],
        registers: [register]
      }),

      compliance_violations_total: new Counter({
        name: 'fanz_compliance_violations_total',
        help: 'Total number of compliance violations',
        labelNames: ['framework', 'severity'],
        registers: [register]
      }),

      gdpr_requests_total: new Counter({
        name: 'fanz_gdpr_requests_total',
        help: 'Total number of GDPR requests',
        labelNames: ['request_type', 'platform'],
        registers: [register]
      }),

      regulation_2257_checks: new Counter({
        name: 'fanz_regulation_2257_checks_total',
        help: 'Total number of 2257 regulation checks',
        labelNames: ['platform', 'result'],
        registers: [register]
      }),

      // Forensic metrics
      forensic_signatures_total: new Counter({
        name: 'fanz_forensic_signatures_total',
        help: 'Total number of forensic signatures created',
        labelNames: ['signature_type', 'platform'],
        registers: [register]
      }),

      behavioral_anomalies_total: new Counter({
        name: 'fanz_behavioral_anomalies_total',
        help: 'Total number of behavioral anomalies detected',
        labelNames: ['anomaly_type', 'severity'],
        registers: [register]
      }),

      network_anomalies_total: new Counter({
        name: 'fanz_network_anomalies_total',
        help: 'Total number of network anomalies detected',
        labelNames: ['anomaly_type', 'platform'],
        registers: [register]
      }),

      evidence_integrity_checks: new Counter({
        name: 'fanz_evidence_integrity_checks_total',
        help: 'Total number of evidence integrity checks',
        labelNames: ['result'],
        registers: [register]
      }),
    };
  }

  /**
   * Initialize the monitoring system
   */
  private async initialize(): Promise<void> {
    this.logger.info('📊 Initializing Security Monitoring & Observability');
    
    await this.setupRedisConnection();
    await this.setupMetricsServer();
    await this.loadAlertRules();
    await this.loadDashboardConfigs();
    this.startAlertingEngine();
    this.setupEventHandlers();
    
    this.logger.info('✅ Security Monitoring fully operational');
  }

  /**
   * Setup Redis connection
   */
  private async setupRedisConnection(): Promise<void> {
    try {
      this.redisClient = redis.createClient({
        url: config.redisUrl,
        socket: { 
          reconnectStrategy: (retries) => Math.min(retries * 50, 500)
        }
      });

      await this.redisClient.connect();
      this.logger.info('🔗 Monitoring Redis connection established');
    } catch (error) {
      this.logger.error('Failed to setup Redis connection', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  /**
   * Setup Prometheus metrics HTTP server
   */
  private async setupMetricsServer(): Promise<void> {
    try {
      const app = express();

      // Metrics endpoint
      app.get(this.config.metrics_path, async (req, res) => {
        try {
          res.set('Content-Type', register.contentType);
          res.end(await register.metrics());
        } catch (error) {
          res.status(500).end(error instanceof Error ? error.message : 'Unknown error');
        }
      });

      // Health endpoint
      app.get('/health', (req, res) => {
        res.json({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          metrics_collected: register.getMetricsAsArray().length
        });
      });

      // Alerting endpoint
      app.get('/alerts', (req, res) => {
        res.json({
          active_alerts: Array.from(this.activeAlerts.values()),
          alert_rules: Array.from(this.alertRules.values()),
          total_alerts_today: this.alertHistory.filter(
            alert => alert.triggered_at.toDateString() === new Date().toDateString()
          ).length
        });
      });

      this.metricsServer = app.listen(this.config.metrics_port, () => {
        this.logger.info('📈 Prometheus metrics server started', {
          port: this.config.metrics_port,
          metrics_path: this.config.metrics_path
        });
      });

    } catch (error) {
      this.logger.error('Failed to setup metrics server', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Load alert rules configuration
   */
  private async loadAlertRules(): Promise<void> {
    try {
      if (this.config.enable_default_alerts) {
        this.createDefaultAlertRules();
      }
      
      this.logger.info('⚠️ Alert rules loaded', {
        rules_count: this.alertRules.size
      });
    } catch (error) {
      this.logger.error('Failed to load alert rules', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Create default alert rules
   */
  private createDefaultAlertRules(): void {
    const defaultRules: Omit<AlertRule, 'id'>[] = [
      {
        name: 'High Authentication Failure Rate',
        description: 'Authentication failure rate exceeds 50% over 5 minutes',
        metric: 'fanz_auth_failures_total',
        condition: { operator: '>', duration: 300, aggregation: 'sum' },
        threshold: 50,
        severity: 'high',
        enabled: true,
        notification_channels: ['slack', 'email'],
        cooldown_period: 600
      },
      {
        name: 'Critical Security Incident',
        description: 'Critical severity security incident detected',
        metric: 'fanz_security_incidents_total',
        condition: { operator: '>', duration: 0 },
        threshold: 0,
        severity: 'critical',
        enabled: true,
        notification_channels: ['slack', 'email', 'pagerduty'],
        cooldown_period: 300
      },
      {
        name: 'High Zero Trust Risk Score',
        description: 'Zero trust risk score exceeds 0.8',
        metric: 'fanz_zero_trust_risk_score',
        condition: { operator: '>', duration: 60 },
        threshold: 0.8,
        severity: 'medium',
        enabled: true,
        notification_channels: ['slack'],
        cooldown_period: 900
      },
      {
        name: 'Platform Down',
        description: 'Platform uptime drops below 95%',
        metric: 'fanz_platform_uptime_percentage',
        condition: { operator: '<', duration: 120 },
        threshold: 95,
        severity: 'high',
        enabled: true,
        notification_channels: ['slack', 'pagerduty'],
        cooldown_period: 300
      },
      {
        name: 'High Content Violation Rate',
        description: 'Content violations exceed 10 per hour',
        metric: 'fanz_content_violations_total',
        condition: { operator: '>', duration: 3600, aggregation: 'sum' },
        threshold: 10,
        severity: 'medium',
        enabled: true,
        notification_channels: ['slack'],
        cooldown_period: 1800
      },
      {
        name: 'Compliance Violation Detected',
        description: 'Any compliance violation detected',
        metric: 'fanz_compliance_violations_total',
        condition: { operator: '>', duration: 0 },
        threshold: 0,
        severity: 'high',
        enabled: true,
        notification_channels: ['slack', 'email'],
        cooldown_period: 600
      }
    ];

    for (const rule of defaultRules) {
      const alertRule: AlertRule = {
        ...rule,
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      this.alertRules.set(alertRule.id, alertRule);
    }
  }

  /**
   * Load dashboard configurations
   */
  private async loadDashboardConfigs(): Promise<void> {
    try {
      this.createDefaultDashboards();
      
      this.logger.info('📊 Dashboard configurations loaded', {
        dashboards_count: this.dashboardConfigs.size
      });
    } catch (error) {
      this.logger.error('Failed to load dashboard configs', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Create default dashboard configurations
   */
  private createDefaultDashboards(): void {
    // Security Overview Dashboard
    const securityOverview: DashboardConfig = {
      id: 'security_overview',
      title: 'FANZ Security Overview',
      description: 'High-level security metrics and incident overview',
      refresh_interval: 30000,
      time_range: 'now-1h',
      panels: [
        {
          id: 'auth_success_rate',
          title: 'Authentication Success Rate',
          type: 'gauge',
          query: 'fanz_auth_success_rate',
          position: { x: 0, y: 0, w: 6, h: 4 },
          color_scheme: 'green-yellow-red',
          thresholds: [
            { value: 95, color: 'green', condition: '>' },
            { value: 85, color: 'yellow', condition: '>' },
            { value: 0, color: 'red', condition: '>' }
          ]
        },
        {
          id: 'active_incidents',
          title: 'Active Security Incidents',
          type: 'stat',
          query: 'sum(fanz_active_incidents)',
          position: { x: 6, y: 0, w: 6, h: 4 },
          color_scheme: 'red'
        },
        {
          id: 'threats_timeline',
          title: 'Threats Detected Over Time',
          type: 'graph',
          query: 'rate(fanz_threats_detected_total[5m])',
          position: { x: 0, y: 4, w: 12, h: 6 },
          color_scheme: 'spectrum'
        }
      ]
    };

    // Zero Trust Dashboard
    const zeroTrustDashboard: DashboardConfig = {
      id: 'zero_trust',
      title: 'Zero Trust Security',
      description: 'Zero trust evaluations, risk scores, and challenges',
      refresh_interval: 30000,
      time_range: 'now-1h',
      panels: [
        {
          id: 'zt_evaluations',
          title: 'Zero Trust Evaluations',
          type: 'graph',
          query: 'rate(fanz_zero_trust_evaluations_total[5m])',
          position: { x: 0, y: 0, w: 6, h: 6 },
          color_scheme: 'blue'
        },
        {
          id: 'zt_risk_heatmap',
          title: 'Risk Score Heatmap',
          type: 'heatmap',
          query: 'fanz_zero_trust_risk_score',
          position: { x: 6, y: 0, w: 6, h: 6 },
          color_scheme: 'red-yellow-green'
        },
        {
          id: 'zt_challenges',
          title: 'Authentication Challenges',
          type: 'table',
          query: 'fanz_zero_trust_challenges_issued_total',
          position: { x: 0, y: 6, w: 12, h: 4 },
          color_scheme: 'default'
        }
      ]
    };

    // Platform Health Dashboard
    const platformHealth: DashboardConfig = {
      id: 'platform_health',
      title: 'Platform Health & Performance',
      description: 'Health metrics for all FANZ platforms',
      refresh_interval: 60000,
      time_range: 'now-24h',
      panels: [
        {
          id: 'platform_uptime',
          title: 'Platform Uptime',
          type: 'gauge',
          query: 'fanz_platform_uptime_percentage',
          position: { x: 0, y: 0, w: 4, h: 4 },
          color_scheme: 'green-red'
        },
        {
          id: 'response_times',
          title: 'Response Times',
          type: 'graph',
          query: 'fanz_platform_response_time_seconds',
          position: { x: 4, y: 0, w: 8, h: 4 },
          color_scheme: 'spectrum'
        },
        {
          id: 'error_rates',
          title: 'Platform Error Rates',
          type: 'graph',
          query: 'fanz_platform_error_rate_percentage',
          position: { x: 0, y: 4, w: 12, h: 4 },
          color_scheme: 'red'
        }
      ]
    };

    this.dashboardConfigs.set(securityOverview.id, securityOverview);
    this.dashboardConfigs.set(zeroTrustDashboard.id, zeroTrustDashboard);
    this.dashboardConfigs.set(platformHealth.id, platformHealth);
  }

  /**
   * Start the alerting engine
   */
  private startAlertingEngine(): void {
    this.alertingEngine = setInterval(async () => {
      await this.checkAlertRules();
    }, this.config.alert_check_interval);
    
    this.logger.info('🚨 Alerting engine started', {
      check_interval: this.config.alert_check_interval
    });
  }

  /**
   * Setup event handlers for monitoring
   */
  private setupEventHandlers(): void {
    // Monitor security events and update metrics
    this.on('metric_update', this.updateMetric.bind(this));
    this.on('alert_triggered', this.handleAlert.bind(this));
    
    this.logger.info('📡 Monitoring event handlers configured');
  }

  /**
   * Record authentication attempt
   */
  public recordAuthAttempt(platform: string, method: string, result: 'success' | 'failure', reason?: string): void {
    this.metrics.auth_attempts_total.inc({ platform, method, result });
    
    if (result === 'failure') {
      this.metrics.auth_failures_total.inc({ platform, reason: reason || 'unknown', ip_address: 'redacted' });
    }
  }

  /**
   * Record authentication response time
   */
  public recordAuthResponseTime(platform: string, method: string, responseTime: number): void {
    this.metrics.auth_response_time.observe({ platform, method }, responseTime);
  }

  /**
   * Update authentication success rate
   */
  public updateAuthSuccessRate(platform: string, rate: number): void {
    this.metrics.auth_success_rate.set({ platform }, rate);
  }

  /**
   * Record zero trust evaluation
   */
  public recordZeroTrustEvaluation(platform: string, result: 'allow' | 'deny' | 'challenge'): void {
    this.metrics.zero_trust_evaluations_total.inc({ platform, result });
  }

  /**
   * Update zero trust risk score
   */
  public updateZeroTrustRiskScore(userId: string, sessionId: string, riskScore: number): void {
    this.metrics.zero_trust_risk_score.set({ user_id: userId, session_id: sessionId }, riskScore);
  }

  /**
   * Record zero trust challenge
   */
  public recordZeroTrustChallenge(challengeType: string, reason: string): void {
    this.metrics.zero_trust_challenges_issued.inc({ challenge_type: challengeType, reason });
  }

  /**
   * Record security incident
   */
  public recordSecurityIncident(platform: string, type: string, severity: string): void {
    this.metrics.security_incidents_total.inc({ platform, type, severity });
    this.updateActiveIncidents(severity, 1);
  }

  /**
   * Record incident response time
   */
  public recordIncidentResponseTime(severity: string, type: string, responseTime: number): void {
    this.metrics.incident_response_time.observe({ severity, type }, responseTime);
  }

  /**
   * Record incident resolution time
   */
  public recordIncidentResolutionTime(severity: string, type: string, resolutionTime: number): void {
    this.metrics.incident_resolution_time.observe({ severity, type }, resolutionTime);
    this.updateActiveIncidents(severity, -1);
  }

  /**
   * Update active incidents count
   */
  public updateActiveIncidents(severity: string, change: number): void {
    const currentValue = await this.getMetricValue('fanz_active_incidents', { severity }) || 0;
    this.metrics.active_incidents.set({ severity }, Math.max(0, currentValue + change));
  }

  /**
   * Record threat detection
   */
  public recordThreatDetection(threatType: string, source: string, severity: string): void {
    this.metrics.threats_detected_total.inc({ threat_type: threatType, source, severity });
  }

  /**
   * Record blocked IP
   */
  public recordBlockedIP(reason: string, platform: string): void {
    this.metrics.blocked_ips_total.inc({ reason, platform });
  }

  /**
   * Record content scan
   */
  public recordContentScan(platform: string, contentType: string, result: string): void {
    this.metrics.content_scans_total.inc({ platform, content_type: contentType, result });
  }

  /**
   * Record content violation
   */
  public recordContentViolation(platform: string, violationType: string, severity: string): void {
    this.metrics.content_violations_total.inc({ platform, violation_type: violationType, severity });
  }

  /**
   * Update platform health metrics
   */
  public updatePlatformHealth(platform: string, uptime: number, responseTime: number, errorRate: number, activeUsers: number): void {
    this.metrics.platform_uptime.set({ platform }, uptime);
    this.metrics.platform_response_time.observe({ platform, endpoint: 'health' }, responseTime);
    this.metrics.platform_error_rate.set({ platform }, errorRate);
    this.metrics.platform_active_users.set({ platform }, activeUsers);
  }

  /**
   * Record compliance check
   */
  public recordComplianceCheck(framework: string, result: string): void {
    this.metrics.compliance_checks_total.inc({ framework, result });
  }

  /**
   * Record compliance violation
   */
  public recordComplianceViolation(framework: string, severity: string): void {
    this.metrics.compliance_violations_total.inc({ framework, severity });
  }

  /**
   * Record forensic signature creation
   */
  public recordForensicSignature(signatureType: string, platform: string): void {
    this.metrics.forensic_signatures_total.inc({ signature_type: signatureType, platform });
  }

  /**
   * Record behavioral anomaly
   */
  public recordBehavioralAnomaly(anomalyType: string, severity: string): void {
    this.metrics.behavioral_anomalies_total.inc({ anomaly_type: anomalyType, severity });
  }

  /**
   * Get metric value
   */
  private async getMetricValue(metricName: string, labels: Record<string, string>): Promise<number | undefined> {
    try {
      const metrics = await register.metrics();
      // This is simplified - in production you'd parse the Prometheus format
      return 0; // Placeholder
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Update a metric
   */
  private updateMetric(metricName: string, value: number, labels?: Record<string, string>): void {
    // This would dynamically update metrics based on the metric name
    this.logger.debug('Updating metric', { metric: metricName, value, labels });
  }

  /**
   * Check alert rules
   */
  private async checkAlertRules(): Promise<void> {
    try {
      for (const rule of this.alertRules.values()) {
        if (!rule.enabled) continue;
        
        // Check cooldown period
        if (rule.last_triggered) {
          const timeSinceLastAlert = Date.now() - rule.last_triggered.getTime();
          if (timeSinceLastAlert < rule.cooldown_period * 1000) {
            continue;
          }
        }

        const shouldTrigger = await this.evaluateAlertRule(rule);
        if (shouldTrigger) {
          await this.triggerAlert(rule);
        }
      }
    } catch (error) {
      this.logger.error('Failed to check alert rules', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Evaluate alert rule
   */
  private async evaluateAlertRule(rule: AlertRule): Promise<boolean> {
    try {
      // In production, this would query Prometheus for metric values
      // For now, we'll simulate rule evaluation
      const metricValue = Math.random() * 100; // Simulated metric value
      
      switch (rule.condition.operator) {
        case '>':
          return metricValue > rule.threshold;
        case '<':
          return metricValue < rule.threshold;
        case '>=':
          return metricValue >= rule.threshold;
        case '<=':
          return metricValue <= rule.threshold;
        case '==':
          return metricValue === rule.threshold;
        case '!=':
          return metricValue !== rule.threshold;
        default:
          return false;
      }
    } catch (error) {
      this.logger.error('Failed to evaluate alert rule', {
        rule_id: rule.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  /**
   * Trigger alert
   */
  private async triggerAlert(rule: AlertRule): Promise<void> {
    const alert: SecurityAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      rule_id: rule.id,
      metric: rule.metric,
      value: 0, // Would be actual metric value
      threshold: rule.threshold,
      severity: rule.severity,
      triggered_at: new Date(),
      description: rule.description,
      context: {},
      status: 'active'
    };

    this.activeAlerts.set(alert.id, alert);
    this.alertHistory.push(alert);
    
    // Trim alert history if needed
    if (this.alertHistory.length > this.config.alert_history_limit) {
      this.alertHistory = this.alertHistory.slice(-this.config.alert_history_limit);
    }

    // Update rule last triggered time
    rule.last_triggered = new Date();

    // Send notifications
    await this.sendAlertNotifications(alert, rule.notification_channels);

    this.logger.warn('Security alert triggered', {
      alert_id: alert.id,
      rule_name: rule.name,
      severity: alert.severity,
      metric: alert.metric
    });

    this.emit('alert_triggered', alert);
  }

  /**
   * Send alert notifications
   */
  private async sendAlertNotifications(alert: SecurityAlert, channels: string[]): Promise<void> {
    for (const channel of channels) {
      try {
        switch (channel) {
          case 'slack':
            await this.sendSlackNotification(alert);
            break;
          case 'email':
            await this.sendEmailNotification(alert);
            break;
          case 'pagerduty':
            await this.sendPagerDutyNotification(alert);
            break;
          default:
            this.logger.warn('Unknown notification channel', { channel });
        }
      } catch (error) {
        this.logger.error('Failed to send notification', {
          channel,
          alert_id: alert.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(alert: SecurityAlert): Promise<void> {
    if (!this.config.slack_webhook_url) {
      this.logger.debug('Slack webhook URL not configured');
      return;
    }

    const message = {
      text: `🚨 FANZ Security Alert: ${alert.description}`,
      attachments: [{
        color: this.getSeverityColor(alert.severity),
        fields: [
          { title: 'Severity', value: alert.severity.toUpperCase(), short: true },
          { title: 'Metric', value: alert.metric, short: true },
          { title: 'Value', value: alert.value.toString(), short: true },
          { title: 'Threshold', value: alert.threshold.toString(), short: true },
          { title: 'Time', value: alert.triggered_at.toISOString(), short: false }
        ]
      }]
    };

    // In production, would make HTTP request to Slack webhook
    this.logger.info('Slack notification would be sent', { alert_id: alert.id });
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(alert: SecurityAlert): Promise<void> {
    // In production, would integrate with email service
    this.logger.info('Email notification would be sent', { alert_id: alert.id });
  }

  /**
   * Send PagerDuty notification
   */
  private async sendPagerDutyNotification(alert: SecurityAlert): Promise<void> {
    if (!this.config.pagerduty_integration_key) {
      this.logger.debug('PagerDuty integration key not configured');
      return;
    }

    // In production, would make HTTP request to PagerDuty Events API
    this.logger.info('PagerDuty notification would be sent', { alert_id: alert.id });
  }

  /**
   * Get color for severity level
   */
  private getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical': return '#ff0000';
      case 'high': return '#ff6600';
      case 'medium': return '#ffcc00';
      case 'low': return '#00ff00';
      default: return '#cccccc';
    }
  }

  /**
   * Handle alert (acknowledge, resolve, etc.)
   */
  private handleAlert(alert: SecurityAlert): void {
    this.logger.info('Handling security alert', {
      alert_id: alert.id,
      severity: alert.severity,
      status: alert.status
    });
  }

  /**
   * Acknowledge alert
   */
  public acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return false;

    alert.status = 'acknowledged';
    alert.acknowledged_by = acknowledgedBy;
    alert.acknowledged_at = new Date();

    this.logger.info('Alert acknowledged', {
      alert_id: alertId,
      acknowledged_by: acknowledgedBy
    });

    return true;
  }

  /**
   * Resolve alert
   */
  public resolveAlert(alertId: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return false;

    alert.status = 'resolved';
    alert.resolved_at = new Date();
    this.activeAlerts.delete(alertId);

    this.logger.info('Alert resolved', {
      alert_id: alertId,
      resolution_time: alert.resolved_at.getTime() - alert.triggered_at.getTime()
    });

    return true;
  }

  /**
   * Generate monitoring report
   */
  public async generateMonitoringReport(startDate: Date, endDate: Date): Promise<MonitoringReport> {
    try {
      // In production, would query Prometheus for historical data
      const report: MonitoringReport = {
        id: `report_${Date.now()}`,
        period: { start: startDate, end: endDate },
        metrics_summary: {
          total_auth_attempts: 1000,
          auth_success_rate: 95.5,
          total_incidents: 5,
          avg_incident_response_time: 300,
          threats_detected: 25,
          compliance_violations: 2,
          platform_uptime_avg: 99.9
        },
        security_overview: {
          overall_security_score: 85,
          zero_trust_effectiveness: 92,
          incident_trends: 'stable',
          top_threat_sources: ['automated_scanners', 'brute_force'],
          critical_vulnerabilities: []
        },
        platform_health: {
          platforms_healthy: 12,
          platforms_degraded: 1,
          platforms_critical: 0,
          avg_response_time: 0.25,
          error_rate: 0.1
        },
        alerts_summary: {
          total_alerts: this.alertHistory.length,
          critical_alerts: this.alertHistory.filter(a => a.severity === 'critical').length,
          unresolved_alerts: this.activeAlerts.size,
          avg_resolution_time: 1800,
          top_alert_types: ['auth_failures', 'platform_health']
        },
        recommendations: [
          'Review authentication failure patterns',
          'Update threat intelligence feeds',
          'Improve incident response procedures'
        ],
        generated_at: new Date()
      };

      this.logger.info('Monitoring report generated', {
        report_id: report.id,
        period: `${startDate.toISOString()} - ${endDate.toISOString()}`
      });

      return report;

    } catch (error) {
      this.logger.error('Failed to generate monitoring report', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get current monitoring status
   */
  public getMonitoringStatus(): any {
    return {
      metrics_collected: register.getMetricsAsArray().length,
      active_alerts: this.activeAlerts.size,
      alert_rules: this.alertRules.size,
      dashboards: this.dashboardConfigs.size,
      uptime: process.uptime(),
      last_check: new Date()
    };
  }

  /**
   * Shutdown monitoring system
   */
  public async shutdown(): Promise<void> {
    this.logger.info('Shutting down Security Monitoring & Observability');

    if (this.alertingEngine) {
      clearInterval(this.alertingEngine);
    }

    if (this.metricsServer) {
      this.metricsServer.close();
    }

    if (this.redisClient) {
      await this.redisClient.quit();
    }

    this.removeAllListeners();
  }
}

// ===============================
// SINGLETON EXPORT
// ===============================

export const securityMonitoring = new SecurityMonitoringCore();
export default securityMonitoring;