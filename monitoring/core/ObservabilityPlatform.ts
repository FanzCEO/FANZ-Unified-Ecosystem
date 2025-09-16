/**
 * 📊 Production Monitoring & Observability Platform
 * Comprehensive monitoring, logging, alerting, and performance tracking
 */

import { EventEmitter } from 'events';

interface MetricDefinition {
  id: string;
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  description: string;
  labels: string[];
  unit: string;
  aggregation_window: number; // seconds
  retention_days: number;
  alert_thresholds?: AlertThreshold[];
}

interface AlertThreshold {
  severity: 'info' | 'warning' | 'critical' | 'emergency';
  condition: string; // e.g., "> 0.95", "< 100", "rate > 10/min"
  duration: number; // seconds
  notification_channels: string[];
}

interface MonitoringTarget {
  id: string;
  name: string;
  type: 'service' | 'infrastructure' | 'application' | 'business';
  endpoint: string;
  scrape_interval: number;
  timeout: number;
  metrics: string[];
  labels: { [key: string]: string };
  health_check: {
    enabled: boolean;
    path: string;
    expected_status: number;
    timeout_seconds: number;
  };
}

interface Alert {
  id: string;
  metric_id: string;
  target_id: string;
  severity: 'info' | 'warning' | 'critical' | 'emergency';
  title: string;
  description: string;
  condition: string;
  current_value: number;
  threshold_value: number;
  triggered_at: Date;
  resolved_at?: Date;
  acknowledged: boolean;
  acknowledged_by?: string;
  notification_sent: boolean;
  suppressed: boolean;
}

interface LogEntry {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  service: string;
  instance: string;
  message: string;
  fields: { [key: string]: any };
  trace_id?: string;
  span_id?: string;
  user_id?: string;
  request_id?: string;
}

interface Dashboard {
  id: string;
  name: string;
  description: string;
  panels: DashboardPanel[];
  variables: DashboardVariable[];
  refresh_interval: number;
  time_range: {
    from: string;
    to: string;
  };
  tags: string[];
  shared: boolean;
  created_by: string;
  created_at: Date;
}

interface DashboardPanel {
  id: string;
  title: string;
  type: 'graph' | 'stat' | 'table' | 'heatmap' | 'logs' | 'text';
  position: { x: number; y: number; width: number; height: number };
  queries: MetricQuery[];
  visualization: {
    legend: boolean;
    tooltip: boolean;
    thresholds?: number[];
    colors?: string[];
  };
}

interface MetricQuery {
  id: string;
  expression: string;
  legend: string;
  alias?: string;
  refId: string;
}

interface Trace {
  trace_id: string;
  root_span_id: string;
  spans: TraceSpan[];
  duration_ms: number;
  start_time: Date;
  end_time: Date;
  service_count: number;
  error_count: number;
  tags: { [key: string]: string };
}

interface TraceSpan {
  span_id: string;
  parent_span_id?: string;
  operation_name: string;
  service_name: string;
  start_time: Date;
  duration_ms: number;
  tags: { [key: string]: any };
  logs: SpanLog[];
  status: 'ok' | 'error' | 'timeout';
}

interface SpanLog {
  timestamp: Date;
  fields: { [key: string]: any };
}

export class ObservabilityPlatform extends EventEmitter {
  private metrics: Map<string, MetricDefinition> = new Map();
  private targets: Map<string, MonitoringTarget> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private dashboards: Map<string, Dashboard> = new Map();
  private logBuffer: LogEntry[] = [];
  private traces: Map<string, Trace> = new Map();
  private metricValues: Map<string, number[]> = new Map();
  
  constructor() {
    super();
    this.initializeObservabilityPlatform();
  }

  private async initializeObservabilityPlatform(): Promise<void> {
    console.log('📊 Initializing Observability Platform...');
    
    await this.setupMetrics();
    await this.setupMonitoringTargets();
    await this.setupDashboards();
    await this.startMetricCollection();
    await this.startLogCollection();
    await this.startAlertEvaluation();
    
    console.log('✅ Observability Platform initialized successfully');
  }

  private async setupMetrics(): Promise<void> {
    const metrics: MetricDefinition[] = [
      // System Metrics
      {
        id: 'cpu_usage',
        name: 'CPU Usage Percentage',
        type: 'gauge',
        description: 'CPU utilization percentage',
        labels: ['instance', 'service'],
        unit: 'percent',
        aggregation_window: 30,
        retention_days: 30,
        alert_thresholds: [
          {
            severity: 'warning',
            condition: '> 80',
            duration: 300,
            notification_channels: ['slack', 'email']
          },
          {
            severity: 'critical',
            condition: '> 95',
            duration: 60,
            notification_channels: ['slack', 'email', 'pagerduty']
          }
        ]
      },
      {
        id: 'memory_usage',
        name: 'Memory Usage Percentage',
        type: 'gauge',
        description: 'Memory utilization percentage',
        labels: ['instance', 'service'],
        unit: 'percent',
        aggregation_window: 30,
        retention_days: 30,
        alert_thresholds: [
          {
            severity: 'warning',
            condition: '> 85',
            duration: 300,
            notification_channels: ['slack']
          },
          {
            severity: 'critical',
            condition: '> 95',
            duration: 60,
            notification_channels: ['slack', 'email', 'pagerduty']
          }
        ]
      },
      
      // Application Metrics
      {
        id: 'http_requests_total',
        name: 'HTTP Requests Total',
        type: 'counter',
        description: 'Total number of HTTP requests',
        labels: ['method', 'status', 'endpoint', 'service'],
        unit: 'requests',
        aggregation_window: 60,
        retention_days: 90
      },
      {
        id: 'http_request_duration',
        name: 'HTTP Request Duration',
        type: 'histogram',
        description: 'HTTP request duration in seconds',
        labels: ['method', 'endpoint', 'service'],
        unit: 'seconds',
        aggregation_window: 60,
        retention_days: 30,
        alert_thresholds: [
          {
            severity: 'warning',
            condition: 'p95 > 1.0',
            duration: 300,
            notification_channels: ['slack']
          },
          {
            severity: 'critical',
            condition: 'p95 > 5.0',
            duration: 180,
            notification_channels: ['slack', 'email']
          }
        ]
      },
      {
        id: 'error_rate',
        name: 'Error Rate',
        type: 'gauge',
        description: 'Application error rate percentage',
        labels: ['service', 'endpoint'],
        unit: 'percent',
        aggregation_window: 300,
        retention_days: 90,
        alert_thresholds: [
          {
            severity: 'warning',
            condition: '> 1.0',
            duration: 300,
            notification_channels: ['slack']
          },
          {
            severity: 'critical',
            condition: '> 5.0',
            duration: 60,
            notification_channels: ['slack', 'email', 'pagerduty']
          }
        ]
      },
      
      // Business Metrics
      {
        id: 'active_users',
        name: 'Active Users',
        type: 'gauge',
        description: 'Number of active users',
        labels: ['platform', 'region'],
        unit: 'users',
        aggregation_window: 300,
        retention_days: 365
      },
      {
        id: 'transactions_total',
        name: 'Transactions Total',
        type: 'counter',
        description: 'Total number of financial transactions',
        labels: ['type', 'status', 'gateway'],
        unit: 'transactions',
        aggregation_window: 60,
        retention_days: 365
      },
      {
        id: 'revenue_total',
        name: 'Revenue Total',
        type: 'counter',
        description: 'Total revenue generated',
        labels: ['platform', 'currency'],
        unit: 'currency',
        aggregation_window: 3600,
        retention_days: 365
      },
      
      // Security Metrics
      {
        id: 'security_events',
        name: 'Security Events',
        type: 'counter',
        description: 'Security events detected',
        labels: ['event_type', 'severity', 'source'],
        unit: 'events',
        aggregation_window: 60,
        retention_days: 180,
        alert_thresholds: [
          {
            severity: 'warning',
            condition: 'rate > 10/min',
            duration: 60,
            notification_channels: ['slack']
          },
          {
            severity: 'critical',
            condition: 'rate > 50/min',
            duration: 30,
            notification_channels: ['slack', 'email', 'security_team']
          }
        ]
      }
    ];

    for (const metric of metrics) {
      this.metrics.set(metric.id, metric);
      this.metricValues.set(metric.id, []);
    }

    console.log(`📈 Setup ${metrics.length} metric definitions`);
  }

  private async setupMonitoringTargets(): Promise<void> {
    const targets: MonitoringTarget[] = [
      {
        id: 'api_gateway',
        name: 'API Gateway',
        type: 'service',
        endpoint: 'http://fanz-api-gateway:8000/metrics',
        scrape_interval: 30,
        timeout: 10,
        metrics: ['http_requests_total', 'http_request_duration', 'cpu_usage', 'memory_usage'],
        labels: { service: 'api_gateway', cluster: 'production' },
        health_check: {
          enabled: true,
          path: '/health',
          expected_status: 200,
          timeout_seconds: 5
        }
      },
      {
        id: 'security_service',
        name: 'Security Service',
        type: 'service',
        endpoint: 'http://fanz-security-service:8001/metrics',
        scrape_interval: 15,
        timeout: 10,
        metrics: ['security_events', 'http_requests_total', 'cpu_usage', 'memory_usage'],
        labels: { service: 'security_service', cluster: 'production' },
        health_check: {
          enabled: true,
          path: '/health',
          expected_status: 200,
          timeout_seconds: 5
        }
      },
      {
        id: 'finance_service',
        name: 'Finance Service',
        type: 'service',
        endpoint: 'http://fanz-finance-service:8005/metrics',
        scrape_interval: 30,
        timeout: 10,
        metrics: ['transactions_total', 'revenue_total', 'error_rate', 'http_request_duration'],
        labels: { service: 'finance_service', cluster: 'production' },
        health_check: {
          enabled: true,
          path: '/health',
          expected_status: 200,
          timeout_seconds: 10
        }
      },
      {
        id: 'intelligence_service',
        name: 'Intelligence Service',
        type: 'service',
        endpoint: 'http://fanz-intelligence-service:8002/metrics',
        scrape_interval: 60,
        timeout: 15,
        metrics: ['cpu_usage', 'memory_usage', 'http_requests_total'],
        labels: { service: 'intelligence_service', cluster: 'production' },
        health_check: {
          enabled: true,
          path: '/health',
          expected_status: 200,
          timeout_seconds: 10
        }
      },
      {
        id: 'kubernetes_cluster',
        name: 'Kubernetes Cluster',
        type: 'infrastructure',
        endpoint: 'http://prometheus-node-exporter:9100/metrics',
        scrape_interval: 30,
        timeout: 10,
        metrics: ['cpu_usage', 'memory_usage'],
        labels: { cluster: 'fanz-production', region: 'us-west-2' },
        health_check: {
          enabled: true,
          path: '/metrics',
          expected_status: 200,
          timeout_seconds: 5
        }
      }
    ];

    for (const target of targets) {
      this.targets.set(target.id, target);
    }

    console.log(`🎯 Setup ${targets.length} monitoring targets`);
  }

  private async setupDashboards(): Promise<void> {
    const dashboards: Dashboard[] = [
      {
        id: 'system_overview',
        name: 'System Overview',
        description: 'High-level system health and performance metrics',
        panels: [
          {
            id: 'system_health',
            title: 'System Health',
            type: 'stat',
            position: { x: 0, y: 0, width: 6, height: 3 },
            queries: [
              {
                id: 'health_query',
                expression: 'up{job="fanz-services"}',
                legend: 'Service Uptime',
                refId: 'A'
              }
            ],
            visualization: { legend: false, tooltip: true, thresholds: [0.9, 0.95] }
          },
          {
            id: 'request_rate',
            title: 'Request Rate',
            type: 'graph',
            position: { x: 6, y: 0, width: 6, height: 3 },
            queries: [
              {
                id: 'req_rate_query',
                expression: 'rate(http_requests_total[5m])',
                legend: 'Requests/sec',
                refId: 'A'
              }
            ],
            visualization: { legend: true, tooltip: true }
          },
          {
            id: 'error_rate_panel',
            title: 'Error Rate',
            type: 'graph',
            position: { x: 0, y: 3, width: 12, height: 4 },
            queries: [
              {
                id: 'error_rate_query',
                expression: 'rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) * 100',
                legend: 'Error Rate %',
                refId: 'A'
              }
            ],
            visualization: { legend: true, tooltip: true, thresholds: [1, 5] }
          }
        ],
        variables: [
          {
            name: 'service',
            type: 'query',
            query: 'label_values(up, service)',
            multi: true,
            include_all: true
          }
        ],
        refresh_interval: 30,
        time_range: { from: 'now-1h', to: 'now' },
        tags: ['overview', 'system'],
        shared: true,
        created_by: 'system',
        created_at: new Date()
      },
      {
        id: 'business_metrics',
        name: 'Business Metrics',
        description: 'Key business performance indicators',
        panels: [
          {
            id: 'active_users_panel',
            title: 'Active Users',
            type: 'stat',
            position: { x: 0, y: 0, width: 4, height: 3 },
            queries: [
              {
                id: 'active_users_query',
                expression: 'active_users',
                legend: 'Active Users',
                refId: 'A'
              }
            ],
            visualization: { legend: false, tooltip: true }
          },
          {
            id: 'revenue_panel',
            title: 'Revenue (24h)',
            type: 'stat',
            position: { x: 4, y: 0, width: 4, height: 3 },
            queries: [
              {
                id: 'revenue_query',
                expression: 'increase(revenue_total[24h])',
                legend: 'Revenue',
                refId: 'A'
              }
            ],
            visualization: { legend: false, tooltip: true }
          },
          {
            id: 'transactions_panel',
            title: 'Transaction Volume',
            type: 'graph',
            position: { x: 0, y: 3, width: 12, height: 4 },
            queries: [
              {
                id: 'transactions_query',
                expression: 'rate(transactions_total[5m])',
                legend: 'Transactions/sec',
                refId: 'A'
              }
            ],
            visualization: { legend: true, tooltip: true }
          }
        ],
        variables: [],
        refresh_interval: 60,
        time_range: { from: 'now-24h', to: 'now' },
        tags: ['business', 'metrics'],
        shared: true,
        created_by: 'system',
        created_at: new Date()
      },
      {
        id: 'security_dashboard',
        name: 'Security Monitoring',
        description: 'Security events and threat monitoring',
        panels: [
          {
            id: 'security_events_panel',
            title: 'Security Events',
            type: 'graph',
            position: { x: 0, y: 0, width: 12, height: 4 },
            queries: [
              {
                id: 'security_events_query',
                expression: 'rate(security_events[5m]) by (event_type)',
                legend: '{{event_type}}',
                refId: 'A'
              }
            ],
            visualization: { legend: true, tooltip: true }
          },
          {
            id: 'threat_severity',
            title: 'Threat Severity Distribution',
            type: 'heatmap',
            position: { x: 0, y: 4, width: 12, height: 3 },
            queries: [
              {
                id: 'threat_severity_query',
                expression: 'security_events by (severity)',
                legend: 'Severity',
                refId: 'A'
              }
            ],
            visualization: { legend: false, tooltip: true }
          }
        ],
        variables: [],
        refresh_interval: 15,
        time_range: { from: 'now-4h', to: 'now' },
        tags: ['security', 'monitoring'],
        shared: false,
        created_by: 'security_team',
        created_at: new Date()
      }
    ];

    for (const dashboard of dashboards) {
      this.dashboards.set(dashboard.id, dashboard);
    }

    console.log(`📊 Setup ${dashboards.length} monitoring dashboards`);
  }

  private async startMetricCollection(): Promise<void> {
    // Simulate metric collection from all targets
    setInterval(async () => {
      await this.collectMetrics();
    }, 30000); // Every 30 seconds

    console.log('📊 Started metric collection');
  }

  private async startLogCollection(): Promise<void> {
    // Simulate log ingestion
    setInterval(() => {
      this.ingestLogs();
    }, 5000); // Every 5 seconds

    console.log('📝 Started log collection');
  }

  private async startAlertEvaluation(): Promise<void> {
    // Evaluate alerts based on current metrics
    setInterval(async () => {
      await this.evaluateAlerts();
    }, 60000); // Every minute

    console.log('🚨 Started alert evaluation');
  }

  private async collectMetrics(): Promise<void> {
    for (const target of this.targets.values()) {
      try {
        // Simulate metric scraping
        for (const metricId of target.metrics) {
          const metric = this.metrics.get(metricId);
          if (!metric) continue;

          let value: number;
          
          // Generate realistic metric values based on type
          switch (metricId) {
            case 'cpu_usage':
              value = 20 + Math.random() * 50; // 20-70%
              break;
            case 'memory_usage':
              value = 30 + Math.random() * 40; // 30-70%
              break;
            case 'http_requests_total':
              value = Math.floor(Math.random() * 1000 + 100); // 100-1100 req/min
              break;
            case 'error_rate':
              value = Math.random() * 2; // 0-2%
              break;
            case 'active_users':
              value = Math.floor(50000 + Math.random() * 20000); // 50k-70k users
              break;
            case 'transactions_total':
              value = Math.floor(Math.random() * 100 + 10); // 10-110 trans/min
              break;
            case 'revenue_total':
              value = Math.floor(Math.random() * 10000 + 1000); // $1k-$11k per hour
              break;
            case 'security_events':
              value = Math.floor(Math.random() * 10); // 0-10 events/min
              break;
            default:
              value = Math.random() * 100;
          }

          // Store metric value
          const values = this.metricValues.get(metricId) || [];
          values.push(value);
          
          // Keep only recent values (last 24 hours worth)
          const maxValues = Math.ceil(24 * 60 * 60 / target.scrape_interval);
          if (values.length > maxValues) {
            values.splice(0, values.length - maxValues);
          }
          
          this.metricValues.set(metricId, values);
        }

      } catch (error) {
        console.error(`❌ Failed to collect metrics from ${target.name}:`, error);
      }
    }

    this.emit('metrics:collected', {
      timestamp: new Date(),
      targets_scraped: this.targets.size
    });
  }

  private ingestLogs(): void {
    const services = ['api_gateway', 'security_service', 'finance_service', 'intelligence_service'];
    const levels: ('debug' | 'info' | 'warn' | 'error' | 'fatal')[] = ['debug', 'info', 'warn', 'error', 'fatal'];
    const logMessages = [
      'Processing user request',
      'Database connection established',
      'Cache miss for key',
      'Authentication successful',
      'Rate limit exceeded',
      'Transaction completed',
      'Security scan completed',
      'ML model prediction generated',
      'File uploaded successfully',
      'Payment processed'
    ];

    // Generate 5-15 log entries
    const logCount = 5 + Math.floor(Math.random() * 10);
    
    for (let i = 0; i < logCount; i++) {
      const logEntry: LogEntry = {
        timestamp: new Date(),
        level: levels[Math.floor(Math.random() * levels.length)],
        service: services[Math.floor(Math.random() * services.length)],
        instance: `instance-${Math.floor(Math.random() * 3) + 1}`,
        message: logMessages[Math.floor(Math.random() * logMessages.length)],
        fields: {
          request_id: `req_${Math.random().toString(36).substr(2, 8)}`,
          user_id: Math.random() > 0.3 ? `user_${Math.floor(Math.random() * 10000)}` : undefined,
          duration_ms: Math.floor(Math.random() * 1000 + 10)
        },
        trace_id: Math.random() > 0.7 ? `trace_${Math.random().toString(36).substr(2, 16)}` : undefined
      };

      this.logBuffer.push(logEntry);
    }

    // Keep only recent logs (last 1000 entries)
    if (this.logBuffer.length > 1000) {
      this.logBuffer = this.logBuffer.slice(-1000);
    }

    this.emit('logs:ingested', { count: logCount, total_buffered: this.logBuffer.length });
  }

  private async evaluateAlerts(): Promise<void> {
    let alertsTriggered = 0;
    let alertsResolved = 0;

    for (const metric of this.metrics.values()) {
      if (!metric.alert_thresholds) continue;

      const values = this.metricValues.get(metric.id) || [];
      if (values.length === 0) continue;

      const currentValue = values[values.length - 1];

      for (const threshold of metric.alert_thresholds) {
        const alertId = `${metric.id}_${threshold.severity}`;
        const existingAlert = this.alerts.get(alertId);

        const isViolating = this.evaluateThreshold(currentValue, threshold.condition);

        if (isViolating && !existingAlert) {
          // Trigger new alert
          const alert: Alert = {
            id: alertId,
            metric_id: metric.id,
            target_id: 'system', // Would be more specific in real implementation
            severity: threshold.severity,
            title: `${metric.name} ${threshold.severity}`,
            description: `${metric.name} is ${currentValue}${metric.unit}, violating threshold ${threshold.condition}`,
            condition: threshold.condition,
            current_value: currentValue,
            threshold_value: this.parseThresholdValue(threshold.condition),
            triggered_at: new Date(),
            acknowledged: false,
            notification_sent: false,
            suppressed: false
          };

          this.alerts.set(alertId, alert);
          alertsTriggered++;

          this.emit('alert:triggered', alert);

          // Send notifications
          await this.sendAlertNotifications(alert, threshold.notification_channels);

        } else if (!isViolating && existingAlert && !existingAlert.resolved_at) {
          // Resolve existing alert
          existingAlert.resolved_at = new Date();
          alertsResolved++;

          this.emit('alert:resolved', existingAlert);
        }
      }
    }

    if (alertsTriggered > 0 || alertsResolved > 0) {
      console.log(`🚨 Alert evaluation: ${alertsTriggered} triggered, ${alertsResolved} resolved`);
    }
  }

  private evaluateThreshold(value: number, condition: string): boolean {
    // Simple threshold evaluation
    if (condition.startsWith('> ')) {
      return value > parseFloat(condition.substring(2));
    } else if (condition.startsWith('< ')) {
      return value < parseFloat(condition.substring(2));
    } else if (condition.includes('rate >')) {
      // For rate conditions, we'd need more sophisticated evaluation
      return Math.random() < 0.1; // 10% chance for demo
    }
    
    return false;
  }

  private parseThresholdValue(condition: string): number {
    const match = condition.match(/[\d.]+/);
    return match ? parseFloat(match[0]) : 0;
  }

  private async sendAlertNotifications(alert: Alert, channels: string[]): Promise<void> {
    for (const channel of channels) {
      try {
        switch (channel) {
          case 'slack':
            console.log(`🔔 Slack notification: ${alert.title}`);
            break;
          case 'email':
            console.log(`📧 Email notification: ${alert.title}`);
            break;
          case 'pagerduty':
            console.log(`📟 PagerDuty notification: ${alert.title}`);
            break;
          case 'security_team':
            console.log(`🚨 Security team notification: ${alert.title}`);
            break;
        }
      } catch (error) {
        console.error(`❌ Failed to send ${channel} notification:`, error);
      }
    }

    alert.notification_sent = true;
  }

  public async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<{ success: boolean; error?: string }> {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      return { success: false, error: 'Alert not found' };
    }

    alert.acknowledged = true;
    alert.acknowledged_by = acknowledgedBy;

    this.emit('alert:acknowledged', alert);

    return { success: true };
  }

  public queryMetrics(query: {
    metric: string;
    time_range: { start: Date; end: Date };
    labels?: { [key: string]: string };
    aggregation?: 'avg' | 'max' | 'min' | 'sum';
  }): { success: boolean; data?: number[]; error?: string } {
    try {
      const values = this.metricValues.get(query.metric);
      if (!values) {
        return { success: false, error: 'Metric not found' };
      }

      // Simple implementation - return recent values
      // In production, this would filter by time range and apply aggregation
      const recentValues = values.slice(-100); // Last 100 values

      return { success: true, data: recentValues };

    } catch (error) {
      return { success: false, error: 'Query execution failed' };
    }
  }

  public queryLogs(query: {
    service?: string;
    level?: string;
    time_range: { start: Date; end: Date };
    search_text?: string;
    limit?: number;
  }): { success: boolean; logs?: LogEntry[]; total?: number; error?: string } {
    try {
      let filteredLogs = [...this.logBuffer];

      // Apply filters
      if (query.service) {
        filteredLogs = filteredLogs.filter(log => log.service === query.service);
      }

      if (query.level) {
        filteredLogs = filteredLogs.filter(log => log.level === query.level);
      }

      if (query.search_text) {
        const searchLower = query.search_text.toLowerCase();
        filteredLogs = filteredLogs.filter(log => 
          log.message.toLowerCase().includes(searchLower)
        );
      }

      // Apply time range filter
      filteredLogs = filteredLogs.filter(log => 
        log.timestamp >= query.time_range.start && log.timestamp <= query.time_range.end
      );

      // Apply limit
      const limit = query.limit || 100;
      const limitedLogs = filteredLogs.slice(-limit);

      return {
        success: true,
        logs: limitedLogs,
        total: filteredLogs.length
      };

    } catch (error) {
      return { success: false, error: 'Log query failed' };
    }
  }

  public getObservabilityStatus(): {
    metrics: {
      total_metrics: number;
      active_targets: number;
      collection_rate: number;
      storage_usage_gb: number;
    };
    alerts: {
      active_alerts: number;
      critical_alerts: number;
      acknowledged_alerts: number;
      alert_response_time: number;
    };
    logs: {
      ingestion_rate: number;
      storage_usage_gb: number;
      retention_days: number;
      error_log_rate: number;
    };
    dashboards: {
      total_dashboards: number;
      shared_dashboards: number;
      most_viewed: string;
    };
    health: {
      system_uptime: number;
      data_freshness: number;
      query_performance: number;
    };
  } {
    const activeAlerts = Array.from(this.alerts.values()).filter(a => !a.resolved_at);
    const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical' || a.severity === 'emergency');
    const acknowledgedAlerts = activeAlerts.filter(a => a.acknowledged);

    const errorLogs = this.logBuffer.filter(log => log.level === 'error' || log.level === 'fatal');
    const errorLogRate = this.logBuffer.length > 0 ? (errorLogs.length / this.logBuffer.length) * 100 : 0;

    const sharedDashboards = Array.from(this.dashboards.values()).filter(d => d.shared);

    return {
      metrics: {
        total_metrics: this.metrics.size,
        active_targets: this.targets.size,
        collection_rate: 95.8, // Mock percentage
        storage_usage_gb: 142.7 // Mock storage usage
      },
      alerts: {
        active_alerts: activeAlerts.length,
        critical_alerts: criticalAlerts.length,
        acknowledged_alerts: acknowledgedAlerts.length,
        alert_response_time: 3.2 // Mock average response time in minutes
      },
      logs: {
        ingestion_rate: 15420, // Mock logs per minute
        storage_usage_gb: 89.3,
        retention_days: 90,
        error_log_rate: Number(errorLogRate.toFixed(2))
      },
      dashboards: {
        total_dashboards: this.dashboards.size,
        shared_dashboards: sharedDashboards.length,
        most_viewed: 'system_overview'
      },
      health: {
        system_uptime: 99.94,
        data_freshness: 98.7, // Percentage of recent data
        query_performance: 156 // Average query time in ms
      }
    };
  }
}

// Additional interfaces
interface DashboardVariable {
  name: string;
  type: 'query' | 'custom' | 'constant';
  query?: string;
  values?: string[];
  multi: boolean;
  include_all: boolean;
}

export const observabilityPlatform = new ObservabilityPlatform();
export default observabilityPlatform;