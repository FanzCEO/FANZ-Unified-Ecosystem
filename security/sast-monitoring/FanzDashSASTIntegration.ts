/**
 * 🛡️ FANZ SAST Security Monitoring Dashboard Integration
 * 
 * This module integrates SAST (Static Application Security Testing) results
 * from CodeQL and Semgrep into the FanzDash security control center.
 * 
 * Features:
 * - Real-time security finding aggregation
 * - SLA tracking and alerting
 * - Security metrics and reporting
 * - Risk assessment and prioritization
 * - Remediation workflow integration
 */

import { EventEmitter } from 'events';
import { Logger } from '../core/Logger';
import { SecurityFinding, SecuritySeverity, SASTProvider } from '../types/SecurityTypes';
import { FanzDashIntegration } from '../integrations/FanzDashIntegration';
import { GitHubIntegration } from '../integrations/GitHubIntegration';

export interface SASTConfiguration {
  githubOrganization: string;
  githubToken: string;
  fanzDashApiUrl: string;
  fanzDashApiKey: string;
  webhookSecret: string;
  slackWebhookUrl?: string;
  emailNotificationEndpoint?: string;
}

export interface SecurityMetrics {
  totalFindings: number;
  criticalFindings: number;
  highFindings: number;
  mediumFindings: number;
  lowFindings: number;
  findingsByRepository: Record<string, number>;
  findingsByProvider: Record<SASTProvider, number>;
  slaCompliance: {
    critical: number; // percentage
    high: number;
    medium: number;
    low: number;
  };
  trendsLast30Days: {
    newFindings: number;
    resolvedFindings: number;
    averageResolutionTime: number; // hours
  };
}

export interface SecurityAlert {
  id: string;
  severity: SecuritySeverity;
  repository: string;
  finding: SecurityFinding;
  slaDeadline: Date;
  assignee?: string;
  escalated: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class FanzDashSASTIntegration extends EventEmitter {
  private readonly logger: Logger;
  private readonly config: SASTConfiguration;
  private readonly fanzDash: FanzDashIntegration;
  private readonly github: GitHubIntegration;
  private findings: Map<string, SecurityFinding> = new Map();
  private alerts: Map<string, SecurityAlert> = new Map();
  private readonly slaHours = {
    CRITICAL: 24,
    HIGH: 72,
    MEDIUM: 14 * 24, // 14 days
    LOW: 30 * 24,    // 30 days
  };

  constructor(config: SASTConfiguration) {
    super();
    this.config = config;
    this.logger = new Logger('FanzDashSASTIntegration');
    this.fanzDash = new FanzDashIntegration({
      apiUrl: config.fanzDashApiUrl,
      apiKey: config.fanzDashApiKey,
    });
    this.github = new GitHubIntegration({
      organization: config.githubOrganization,
      token: config.githubToken,
    });

    this.initializeIntegration();
  }

  private async initializeIntegration(): Promise<void> {
    try {
      this.logger.info('🚀 Initializing FANZ SAST monitoring integration...');

      // Set up GitHub webhook listeners
      await this.setupGitHubWebhooks();

      // Initial scan of existing findings
      await this.performInitialSecurityScan();

      // Start periodic monitoring
      this.startPeriodicMonitoring();

      // Register with FanzDash security center
      await this.registerWithFanzDash();

      this.logger.success('✅ SAST integration initialized successfully');
    } catch (error) {
      this.logger.error('❌ Failed to initialize SAST integration:', error);
      throw error;
    }
  }

  private async setupGitHubWebhooks(): Promise<void> {
    this.logger.info('🔗 Setting up GitHub security webhooks...');

    // Listen for security events
    this.github.on('code_scanning_alert', this.handleCodeScanningAlert.bind(this));
    this.github.on('secret_scanning_alert', this.handleSecretScanningAlert.bind(this));
    this.github.on('dependency_alert', this.handleDependencyAlert.bind(this));

    this.logger.success('GitHub webhooks configured');
  }

  private async performInitialSecurityScan(): Promise<void> {
    this.logger.info('🔍 Performing initial security findings scan...');

    try {
      // Get all repositories in the organization
      const repositories = await this.github.getRepositories();
      
      for (const repo of repositories) {
        this.logger.debug(`Scanning repository: ${repo.name}`);
        
        // Fetch CodeQL findings
        const codeqlFindings = await this.github.getCodeScanningAlerts(repo.name);
        await this.processFindings(codeqlFindings, 'CodeQL', repo.name);

        // Fetch secret scanning findings
        const secretFindings = await this.github.getSecretScanningAlerts(repo.name);
        await this.processFindings(secretFindings, 'SecretScanning', repo.name);

        // Fetch dependency alerts
        const dependencyFindings = await this.github.getDependencyAlerts(repo.name);
        await this.processFindings(dependencyFindings, 'Dependabot', repo.name);
      }

      this.logger.success(`Initial scan completed. Found ${this.findings.size} security findings`);
    } catch (error) {
      this.logger.error('Failed to perform initial security scan:', error);
    }
  }

  private async processFindings(
    findings: any[],
    provider: SASTProvider,
    repository: string
  ): Promise<void> {
    for (const rawFinding of findings) {
      const finding = await this.normalizeSecurityFinding(rawFinding, provider, repository);
      if (finding) {
        await this.procesSecurityFinding(finding);
      }
    }
  }

  private async normalizeSecurityFinding(
    rawFinding: any,
    provider: SASTProvider,
    repository: string
  ): Promise<SecurityFinding | null> {
    try {
      const finding: SecurityFinding = {
        id: `${provider}-${rawFinding.number || rawFinding.id}`,
        provider,
        repository,
        ruleId: rawFinding.rule?.id || rawFinding.type || 'unknown',
        title: rawFinding.rule?.description || rawFinding.summary || 'Security Finding',
        description: rawFinding.rule?.full_description || rawFinding.description || '',
        severity: this.mapSeverity(rawFinding.rule?.security_severity_level || rawFinding.severity),
        confidence: rawFinding.rule?.precision || 'medium',
        category: rawFinding.rule?.tags?.[0] || 'security',
        cweId: rawFinding.rule?.cwe_id || null,
        owaspCategory: this.mapToOWASP(rawFinding.rule?.tags || []),
        location: {
          path: rawFinding.most_recent_instance?.location?.path || rawFinding.path || '',
          startLine: rawFinding.most_recent_instance?.location?.start_line || rawFinding.line || 0,
          endLine: rawFinding.most_recent_instance?.location?.end_line || rawFinding.line || 0,
          startColumn: rawFinding.most_recent_instance?.location?.start_column || 0,
          endColumn: rawFinding.most_recent_instance?.location?.end_column || 0,
        },
        state: rawFinding.state === 'open' ? 'active' : 'resolved',
        createdAt: new Date(rawFinding.created_at),
        updatedAt: new Date(rawFinding.updated_at || rawFinding.created_at),
        dismissedAt: rawFinding.dismissed_at ? new Date(rawFinding.dismissed_at) : undefined,
        dismissReason: rawFinding.dismissed_reason || undefined,
        url: rawFinding.html_url || '',
        metadata: {
          github_alert_number: rawFinding.number,
          github_alert_id: rawFinding.id,
          instances_url: rawFinding.instances_url,
          tool: rawFinding.tool?.name || provider,
        },
      };

      // Add FANZ-specific metadata
      if (this.isFanzSpecificFinding(finding)) {
        finding.metadata.fanz_specific = true;
        finding.metadata.fanz_policy_violation = this.checkPolicyViolation(finding);
      }

      return finding;
    } catch (error) {
      this.logger.error(`Failed to normalize finding from ${provider}:`, error);
      return null;
    }
  }

  private mapSeverity(githubSeverity: string): SecuritySeverity {
    const severityMap: Record<string, SecuritySeverity> = {
      critical: 'CRITICAL',
      high: 'HIGH',
      medium: 'MEDIUM',
      low: 'LOW',
      warning: 'MEDIUM',
      error: 'HIGH',
      note: 'LOW',
    };

    return severityMap[githubSeverity?.toLowerCase() || 'medium'] || 'MEDIUM';
  }

  private mapToOWASP(tags: string[]): string | null {
    const owaspMap: Record<string, string> = {
      'injection': 'A03:2021 – Injection',
      'broken-authentication': 'A07:2021 – Identification and Authentication Failures',
      'sensitive-data-exposure': 'A02:2021 – Cryptographic Failures',
      'xxe': 'A05:2021 – Security Misconfiguration',
      'broken-access-control': 'A01:2021 – Broken Access Control',
      'security-misconfiguration': 'A05:2021 – Security Misconfiguration',
      'xss': 'A03:2021 – Injection',
      'insecure-deserialization': 'A08:2021 – Software and Data Integrity Failures',
      'using-components-with-known-vulnerabilities': 'A06:2021 – Vulnerable and Outdated Components',
      'insufficient-logging-monitoring': 'A09:2021 – Security Logging and Monitoring Failures',
    };

    for (const tag of tags) {
      if (owaspMap[tag]) {
        return owaspMap[tag];
      }
    }

    return null;
  }

  private isFanzSpecificFinding(finding: SecurityFinding): boolean {
    const fanzSpecificRules = [
      'fanz-stripe-paypal-usage',
      'fanz-adult-content-unvalidated-upload',
      'fanz-age-verification-bypass',
      'fanz-payment-card-logging',
      'fanz-weak-jwt-secret',
    ];

    return fanzSpecificRules.includes(finding.ruleId);
  }

  private checkPolicyViolation(finding: SecurityFinding): boolean {
    // Check if finding violates FANZ policies
    const policyViolations = [
      'fanz-stripe-paypal-usage', // Using prohibited payment processors
      'fanz-adult-content-unvalidated-upload', // Adult content compliance
      'fanz-age-verification-bypass', // Age verification bypass
    ];

    return policyViolations.includes(finding.ruleId);
  }

  private async procesSecurityFinding(finding: SecurityFinding): Promise<void> {
    const existingFinding = this.findings.get(finding.id);

    if (existingFinding) {
      // Update existing finding
      if (finding.updatedAt > existingFinding.updatedAt) {
        this.findings.set(finding.id, finding);
        await this.updateSecurityAlert(finding);
      }
    } else {
      // New finding
      this.findings.set(finding.id, finding);
      await this.createSecurityAlert(finding);
    }

    // Emit event for real-time updates
    this.emit('securityFinding', finding);
  }

  private async createSecurityAlert(finding: SecurityFinding): Promise<void> {
    const alert: SecurityAlert = {
      id: `alert-${finding.id}`,
      severity: finding.severity,
      repository: finding.repository,
      finding,
      slaDeadline: this.calculateSLADeadline(finding.severity),
      escalated: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.alerts.set(alert.id, alert);

    // Send to FanzDash
    await this.fanzDash.createSecurityAlert(alert);

    // Send notifications for critical/high severity
    if (finding.severity === 'CRITICAL' || finding.severity === 'HIGH') {
      await this.sendImmediateNotification(alert);
    }

    this.logger.info(`Created security alert: ${alert.id} (${finding.severity})`);
  }

  private async updateSecurityAlert(finding: SecurityFinding): Promise<void> {
    const alertId = `alert-${finding.id}`;
    const existingAlert = this.alerts.get(alertId);

    if (existingAlert) {
      existingAlert.finding = finding;
      existingAlert.updatedAt = new Date();

      // If finding is resolved, close alert
      if (finding.state === 'resolved') {
        await this.resolveSecurityAlert(existingAlert);
      } else {
        await this.fanzDash.updateSecurityAlert(existingAlert);
      }
    }
  }

  private async resolveSecurityAlert(alert: SecurityAlert): Promise<void> {
    this.alerts.delete(alert.id);
    await this.fanzDash.resolveSecurityAlert(alert.id);
    this.logger.info(`Resolved security alert: ${alert.id}`);
  }

  private calculateSLADeadline(severity: SecuritySeverity): Date {
    const hoursToAdd = this.slaHours[severity];
    const deadline = new Date();
    deadline.setHours(deadline.getHours() + hoursToAdd);
    return deadline;
  }

  private async sendImmediateNotification(alert: SecurityAlert): Promise<void> {
    const notification = {
      type: 'CRITICAL_SECURITY_ALERT',
      alert,
      message: `🚨 ${alert.severity} security finding detected in ${alert.repository}`,
      slaDeadline: alert.slaDeadline,
      actionRequired: true,
    };

    // Send to FanzDash notifications
    await this.fanzDash.sendNotification(notification);

    // Send Slack notification if configured
    if (this.config.slackWebhookUrl) {
      await this.sendSlackNotification(alert);
    }
  }

  private async sendSlackNotification(alert: SecurityAlert): Promise<void> {
    // Implementation for Slack notifications
    // This would integrate with Slack API to send formatted alerts
  }

  private startPeriodicMonitoring(): void {
    // Run every 15 minutes
    setInterval(async () => {
      await this.checkSLACompliance();
      await this.updateMetrics();
    }, 15 * 60 * 1000);

    // Daily comprehensive scan
    setInterval(async () => {
      await this.performComprehensiveSecurityScan();
    }, 24 * 60 * 60 * 1000);
  }

  private async checkSLACompliance(): Promise<void> {
    const now = new Date();
    
    for (const [alertId, alert] of this.alerts) {
      if (now > alert.slaDeadline && !alert.escalated) {
        alert.escalated = true;
        alert.updatedAt = now;

        await this.escalateSecurityAlert(alert);
      }
    }
  }

  private async escalateSecurityAlert(alert: SecurityAlert): Promise<void> {
    const escalation = {
      alertId: alert.id,
      severity: alert.severity,
      repository: alert.repository,
      slaBreach: true,
      escalatedAt: new Date(),
    };

    await this.fanzDash.escalateSecurityAlert(escalation);
    await this.sendImmediateNotification(alert);

    this.logger.warning(`⚠️ Escalated security alert due to SLA breach: ${alert.id}`);
  }

  private async updateMetrics(): Promise<void> {
    const metrics = await this.calculateSecurityMetrics();
    await this.fanzDash.updateSecurityMetrics(metrics);
    this.emit('metricsUpdate', metrics);
  }

  private async calculateSecurityMetrics(): Promise<SecurityMetrics> {
    const findingsArray = Array.from(this.findings.values());
    const activeFindings = findingsArray.filter(f => f.state === 'active');

    const metrics: SecurityMetrics = {
      totalFindings: activeFindings.length,
      criticalFindings: activeFindings.filter(f => f.severity === 'CRITICAL').length,
      highFindings: activeFindings.filter(f => f.severity === 'HIGH').length,
      mediumFindings: activeFindings.filter(f => f.severity === 'MEDIUM').length,
      lowFindings: activeFindings.filter(f => f.severity === 'LOW').length,
      findingsByRepository: {},
      findingsByProvider: {
        CodeQL: 0,
        Semgrep: 0,
        SecretScanning: 0,
        Dependabot: 0,
      },
      slaCompliance: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      },
      trendsLast30Days: {
        newFindings: 0,
        resolvedFindings: 0,
        averageResolutionTime: 0,
      },
    };

    // Calculate repository distribution
    for (const finding of activeFindings) {
      if (!metrics.findingsByRepository[finding.repository]) {
        metrics.findingsByRepository[finding.repository] = 0;
      }
      metrics.findingsByRepository[finding.repository]++;
      metrics.findingsByProvider[finding.provider]++;
    }

    // Calculate SLA compliance
    const activeAlerts = Array.from(this.alerts.values());
    for (const severity of ['critical', 'high', 'medium', 'low'] as const) {
      const alertsForSeverity = activeAlerts.filter(a => 
        a.severity.toLowerCase() === severity
      );
      const compliantAlerts = alertsForSeverity.filter(a => 
        new Date() <= a.slaDeadline
      );
      
      if (alertsForSeverity.length > 0) {
        metrics.slaCompliance[severity] = 
          (compliantAlerts.length / alertsForSeverity.length) * 100;
      } else {
        metrics.slaCompliance[severity] = 100;
      }
    }

    return metrics;
  }

  private async performComprehensiveSecurityScan(): Promise<void> {
    this.logger.info('🔍 Performing comprehensive security scan...');
    await this.performInitialSecurityScan();
    
    const metrics = await this.calculateSecurityMetrics();
    this.logger.info(`Comprehensive scan completed. Active findings: ${metrics.totalFindings}`);
  }

  private async registerWithFanzDash(): Promise<void> {
    const registrationData = {
      integrationName: 'FANZ SAST Security Monitor',
      version: '1.0.0',
      capabilities: [
        'security_scanning',
        'vulnerability_detection',
        'sla_monitoring',
        'real_time_alerts',
        'compliance_reporting',
      ],
      endpoints: {
        webhook: '/webhooks/github/security',
        metrics: '/api/security/metrics',
        alerts: '/api/security/alerts',
      },
      supportedProviders: ['CodeQL', 'Semgrep', 'SecretScanning', 'Dependabot'],
    };

    await this.fanzDash.registerSecurityIntegration(registrationData);
  }

  // Public API methods

  public async getSecurityMetrics(): Promise<SecurityMetrics> {
    return await this.calculateSecurityMetrics();
  }

  public async getActiveAlerts(): Promise<SecurityAlert[]> {
    return Array.from(this.alerts.values());
  }

  public async getFindingsByRepository(repository: string): Promise<SecurityFinding[]> {
    return Array.from(this.findings.values())
      .filter(f => f.repository === repository && f.state === 'active');
  }

  public async dismissFinding(findingId: string, reason: string, comment?: string): Promise<void> {
    const finding = this.findings.get(findingId);
    if (!finding) {
      throw new Error(`Finding not found: ${findingId}`);
    }

    // Dismiss in GitHub
    await this.github.dismissSecurityAlert(finding.repository, finding.metadata.github_alert_number, {
      dismissed_reason: reason,
      dismissed_comment: comment,
    });

    // Update local state
    finding.state = 'resolved';
    finding.dismissedAt = new Date();
    finding.dismissReason = reason;

    // Update alert
    const alertId = `alert-${findingId}`;
    const alert = this.alerts.get(alertId);
    if (alert) {
      await this.resolveSecurityAlert(alert);
    }
  }

  // Event handlers for GitHub webhooks

  private async handleCodeScanningAlert(event: any): Promise<void> {
    this.logger.debug('Received CodeQL alert webhook:', event.action);
    
    if (event.action === 'created' || event.action === 'reopened') {
      const finding = await this.normalizeSecurityFinding(
        event.alert,
        'CodeQL',
        event.repository.name
      );
      
      if (finding) {
        await this.procesSecurityFinding(finding);
      }
    } else if (event.action === 'closed_by_user' || event.action === 'fixed') {
      const findingId = `CodeQL-${event.alert.number}`;
      const finding = this.findings.get(findingId);
      
      if (finding) {
        finding.state = 'resolved';
        finding.dismissedAt = new Date();
        await this.procesSecurityFinding(finding);
      }
    }
  }

  private async handleSecretScanningAlert(event: any): Promise<void> {
    this.logger.debug('Received secret scanning alert webhook:', event.action);
    // Similar handling for secret scanning alerts
  }

  private async handleDependencyAlert(event: any): Promise<void> {
    this.logger.debug('Received dependency alert webhook:', event.action);
    // Similar handling for dependency alerts
  }
}

// Export types and main class
export {
  SecurityFinding,
  SecuritySeverity,
  SASTProvider,
  SecurityMetrics,
  SecurityAlert,
} from '../types/SecurityTypes';

export default FanzDashSASTIntegration;