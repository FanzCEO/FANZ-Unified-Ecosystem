import { logger } from '../../utils/logger';
import { PaymentProcessorFactory } from '../payment/PaymentProcessorFactory';
import { ProcessorHealthCheck } from '../payment/types/PaymentTypes';
import { EventEmitter } from 'events';
import cron from 'node-cron';

interface ProcessorMetrics {
  processorName: string;
  responseTime: number;
  successRate: number;
  errorRate: number;
  uptime: number;
  lastDowntime?: Date;
  averageTransactionTime: number;
  totalTransactions: number;
  failedTransactions: number;
  timestamp: Date;
}

interface ProcessorAlert {
  id: string;
  processorName: string;
  alertType: 'health' | 'performance' | 'error_rate' | 'downtime';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  resolved: boolean;
  metadata?: Record<string, any>;
}

interface MonitoringConfig {
  healthCheckInterval: number; // minutes
  performanceTrackingEnabled: boolean;
  alertThresholds: {
    errorRate: number; // percentage
    responseTime: number; // milliseconds
    uptime: number; // percentage
  };
  retryAttempts: number;
  notificationChannels: string[];
}

export class ProcessorMonitoringService extends EventEmitter {
  private config: MonitoringConfig;
  private processorMetrics: Map<string, ProcessorMetrics> = new Map();
  private activeAlerts: Map<string, ProcessorAlert> = new Map();
  private healthCheckJobs: Map<string, any> = new Map();
  private isRunning: boolean = false;

  constructor(config?: Partial<MonitoringConfig>) {
    super();
    this.config = {
      healthCheckInterval: 5, // 5 minutes
      performanceTrackingEnabled: true,
      alertThresholds: {
        errorRate: 5, // 5% error rate threshold
        responseTime: 30000, // 30 seconds
        uptime: 99 // 99% uptime threshold
      },
      retryAttempts: 3,
      notificationChannels: ['email', 'slack', 'webhook'],
      ...config
    };
  }

  /**
   * Start monitoring all available payment processors
   */
  async startMonitoring(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Processor monitoring is already running');
      return;
    }

    logger.info('Starting payment processor monitoring service');
    this.isRunning = true;

    try {
      // Get available processors from factory
      const availableProcessors = await PaymentProcessorFactory.getAvailableProcessors();
      
      for (const processorName of availableProcessors) {
        await this.initializeProcessorMonitoring(processorName);
      }

      // Start periodic health checks
      this.scheduleHealthChecks();
      
      // Start performance monitoring
      if (this.config.performanceTrackingEnabled) {
        this.startPerformanceTracking();
      }

      logger.info('Processor monitoring started successfully', {
        processorsCount: availableProcessors.length,
        processors: availableProcessors
      });

    } catch (error) {
      logger.error('Failed to start processor monitoring', { error });
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * Stop monitoring service
   */
  async stopMonitoring(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    logger.info('Stopping payment processor monitoring service');
    
    // Stop all scheduled health checks
    for (const [processorName, job] of this.healthCheckJobs) {
      if (job && typeof job.destroy === 'function') {
        job.destroy();
      }
    }
    
    this.healthCheckJobs.clear();
    this.isRunning = false;

    logger.info('Processor monitoring stopped');
  }

  /**
   * Perform immediate health check on specific processor
   */
  async checkProcessorHealth(processorName: string): Promise<ProcessorHealthCheck> {
    try {
      const processor = PaymentProcessorFactory.getProcessor(processorName);
      const startTime = Date.now();
      
      const healthResult = await processor.healthCheck();
      const responseTime = Date.now() - startTime;

      // Update metrics
      await this.updateProcessorMetrics(processorName, {
        responseTime,
        isHealthy: healthResult.healthy,
        error: healthResult.healthy ? null : healthResult.message
      });

      // Check for alerts
      await this.evaluateHealthAlerts(processorName, healthResult, responseTime);

      return healthResult;

    } catch (error) {
      logger.error('Health check failed for processor', { processorName, error });
      
      // Update metrics with error
      await this.updateProcessorMetrics(processorName, {
        responseTime: this.config.alertThresholds.responseTime,
        isHealthy: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        processor: processorName,
        healthy: false,
        message: error instanceof Error ? error.message : 'Health check failed',
        responseTime: Date.now(),
        metadata: { error: true }
      };
    }
  }

  /**
   * Get current metrics for all processors
   */
  getProcessorMetrics(): ProcessorMetrics[] {
    return Array.from(this.processorMetrics.values());
  }

  /**
   * Get metrics for specific processor
   */
  getProcessorMetric(processorName: string): ProcessorMetrics | null {
    return this.processorMetrics.get(processorName) || null;
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): ProcessorAlert[] {
    return Array.from(this.activeAlerts.values()).filter(alert => !alert.resolved);
  }

  /**
   * Get processor uptime percentage over time period
   */
  async getProcessorUptime(processorName: string, hours: number = 24): Promise<number> {
    // This would query the processor_health_logs table
    // For now, return the cached uptime
    const metrics = this.processorMetrics.get(processorName);
    return metrics?.uptime || 0;
  }

  /**
   * Record transaction performance metrics
   */
  async recordTransactionMetrics(
    processorName: string, 
    transactionData: {
      success: boolean;
      responseTime: number;
      errorCode?: string;
      amount?: number;
    }
  ): Promise<void> {
    try {
      const metrics = this.processorMetrics.get(processorName);
      if (!metrics) {
        logger.warn('No metrics found for processor', { processorName });
        return;
      }

      // Update transaction counters
      metrics.totalTransactions += 1;
      if (!transactionData.success) {
        metrics.failedTransactions += 1;
      }

      // Update success/error rates
      metrics.successRate = ((metrics.totalTransactions - metrics.failedTransactions) / metrics.totalTransactions) * 100;
      metrics.errorRate = (metrics.failedTransactions / metrics.totalTransactions) * 100;

      // Update average response time
      metrics.averageTransactionTime = (
        (metrics.averageTransactionTime * (metrics.totalTransactions - 1) + transactionData.responseTime) 
        / metrics.totalTransactions
      );

      metrics.timestamp = new Date();

      // Store metrics in database
      await this.storeMetricsInDatabase(processorName, {
        metric_name: 'transaction_performance',
        metric_value: transactionData.responseTime,
        metric_unit: 'milliseconds',
        tags: {
          success: transactionData.success,
          error_code: transactionData.errorCode,
          amount: transactionData.amount
        }
      });

      // Check for performance alerts
      await this.evaluatePerformanceAlerts(processorName, metrics);

    } catch (error) {
      logger.error('Failed to record transaction metrics', { error, processorName });
    }
  }

  /**
   * Generate processor performance report
   */
  async generatePerformanceReport(hours: number = 24): Promise<{
    summary: {
      totalProcessors: number;
      healthyProcessors: number;
      averageUptime: number;
      totalTransactions: number;
      averageResponseTime: number;
    };
    processors: ProcessorMetrics[];
    alerts: ProcessorAlert[];
  }> {
    const metrics = this.getProcessorMetrics();
    const alerts = this.getActiveAlerts();

    const summary = {
      totalProcessors: metrics.length,
      healthyProcessors: metrics.filter(m => m.uptime > this.config.alertThresholds.uptime).length,
      averageUptime: metrics.reduce((sum, m) => sum + m.uptime, 0) / metrics.length,
      totalTransactions: metrics.reduce((sum, m) => sum + m.totalTransactions, 0),
      averageResponseTime: metrics.reduce((sum, m) => sum + m.averageTransactionTime, 0) / metrics.length
    };

    return {
      summary,
      processors: metrics,
      alerts
    };
  }

  // Private methods

  private async initializeProcessorMonitoring(processorName: string): Promise<void> {
    // Initialize metrics for processor
    this.processorMetrics.set(processorName, {
      processorName,
      responseTime: 0,
      successRate: 100,
      errorRate: 0,
      uptime: 100,
      averageTransactionTime: 0,
      totalTransactions: 0,
      failedTransactions: 0,
      timestamp: new Date()
    });

    // Perform initial health check
    await this.checkProcessorHealth(processorName);

    logger.info('Initialized monitoring for processor', { processorName });
  }

  private scheduleHealthChecks(): void {
    // Schedule periodic health checks for all processors
    const cronExpression = `*/${this.config.healthCheckInterval} * * * *`; // Every N minutes

    const job = cron.schedule(cronExpression, async () => {
      logger.debug('Running scheduled health checks');
      
      const processors = Array.from(this.processorMetrics.keys());
      const healthCheckPromises = processors.map(processorName => 
        this.checkProcessorHealth(processorName).catch(error => {
          logger.error('Scheduled health check failed', { processorName, error });
        })
      );

      await Promise.allSettled(healthCheckPromises);
    }, {
      scheduled: false
    });

    job.start();
    this.healthCheckJobs.set('global_health_check', job);

    logger.info('Scheduled health checks started', {
      interval: this.config.healthCheckInterval,
      cronExpression
    });
  }

  private startPerformanceTracking(): void {
    // Set up performance tracking
    logger.info('Performance tracking enabled');

    // Listen for transaction events (would be emitted by payment service)
    this.on('transaction_completed', async (data) => {
      await this.recordTransactionMetrics(data.processorName, data.metrics);
    });
  }

  private async updateProcessorMetrics(
    processorName: string, 
    updateData: {
      responseTime: number;
      isHealthy: boolean;
      error?: string | null;
    }
  ): Promise<void> {
    const metrics = this.processorMetrics.get(processorName);
    if (!metrics) {
      logger.warn('Processor metrics not found', { processorName });
      return;
    }

    // Update response time
    metrics.responseTime = updateData.responseTime;
    metrics.timestamp = new Date();

    // Update uptime tracking
    if (!updateData.isHealthy && metrics.uptime === 100) {
      // First downtime occurrence
      metrics.lastDowntime = new Date();
    }

    // Store health check result in database
    await this.storeHealthCheckResult(processorName, {
      is_healthy: updateData.isHealthy,
      response_time_ms: updateData.responseTime,
      error_message: updateData.error || null,
      checked_at: new Date()
    });

    // Recalculate uptime based on recent health checks
    const uptime = await this.calculateUptime(processorName);
    metrics.uptime = uptime;
  }

  private async evaluateHealthAlerts(
    processorName: string, 
    healthResult: ProcessorHealthCheck, 
    responseTime: number
  ): Promise<void> {
    // Check for downtime alert
    if (!healthResult.healthy) {
      await this.createAlert({
        processorName,
        alertType: 'health',
        severity: 'critical',
        message: `Processor ${processorName} is unhealthy: ${healthResult.message}`,
        metadata: { responseTime, healthResult }
      });
    } else {
      // Resolve any existing health alerts
      await this.resolveAlert(processorName, 'health');
    }

    // Check for response time alert
    if (responseTime > this.config.alertThresholds.responseTime) {
      await this.createAlert({
        processorName,
        alertType: 'performance',
        severity: 'medium',
        message: `Processor ${processorName} response time exceeded threshold: ${responseTime}ms`,
        metadata: { responseTime, threshold: this.config.alertThresholds.responseTime }
      });
    } else {
      await this.resolveAlert(processorName, 'performance');
    }
  }

  private async evaluatePerformanceAlerts(
    processorName: string, 
    metrics: ProcessorMetrics
  ): Promise<void> {
    // Check error rate alert
    if (metrics.errorRate > this.config.alertThresholds.errorRate) {
      await this.createAlert({
        processorName,
        alertType: 'error_rate',
        severity: 'high',
        message: `Processor ${processorName} error rate exceeded threshold: ${metrics.errorRate.toFixed(2)}%`,
        metadata: { errorRate: metrics.errorRate, threshold: this.config.alertThresholds.errorRate }
      });
    } else {
      await this.resolveAlert(processorName, 'error_rate');
    }

    // Check uptime alert
    if (metrics.uptime < this.config.alertThresholds.uptime) {
      await this.createAlert({
        processorName,
        alertType: 'downtime',
        severity: 'high',
        message: `Processor ${processorName} uptime below threshold: ${metrics.uptime.toFixed(2)}%`,
        metadata: { uptime: metrics.uptime, threshold: this.config.alertThresholds.uptime }
      });
    } else {
      await this.resolveAlert(processorName, 'downtime');
    }
  }

  private async createAlert(alertData: Omit<ProcessorAlert, 'id' | 'timestamp' | 'resolved'>): Promise<void> {
    const alertId = `${alertData.processorName}_${alertData.alertType}_${Date.now()}`;
    
    // Check if similar alert already exists
    const existingAlert = Array.from(this.activeAlerts.values()).find(
      alert => alert.processorName === alertData.processorName && 
               alert.alertType === alertData.alertType && 
               !alert.resolved
    );

    if (existingAlert) {
      // Update existing alert instead of creating new one
      existingAlert.message = alertData.message;
      existingAlert.timestamp = new Date();
      existingAlert.metadata = alertData.metadata;
      return;
    }

    const alert: ProcessorAlert = {
      id: alertId,
      timestamp: new Date(),
      resolved: false,
      ...alertData
    };

    this.activeAlerts.set(alertId, alert);

    logger.warn('Processor alert created', alert);

    // Emit alert event
    this.emit('alert_created', alert);

    // Send notifications
    await this.sendAlertNotifications(alert);
  }

  private async resolveAlert(processorName: string, alertType: string): Promise<void> {
    const alert = Array.from(this.activeAlerts.values()).find(
      alert => alert.processorName === processorName && 
               alert.alertType === alertType && 
               !alert.resolved
    );

    if (alert) {
      alert.resolved = true;
      alert.timestamp = new Date();

      logger.info('Processor alert resolved', {
        processorName,
        alertType,
        alertId: alert.id
      });

      this.emit('alert_resolved', alert);
    }
  }

  private async sendAlertNotifications(alert: ProcessorAlert): Promise<void> {
    // Implementation would send notifications via configured channels
    logger.info('Sending alert notifications', {
      alert: alert.id,
      channels: this.config.notificationChannels
    });

    // Example notification methods:
    // - Email
    // - Slack webhook
    // - Custom webhook
    // - SMS (for critical alerts)
  }

  private async calculateUptime(processorName: string, hours: number = 24): Promise<number> {
    // This would query the processor_health_logs table to calculate actual uptime
    // For now, return a simplified calculation
    try {
      // Query recent health checks from database
      const healthChecks = await this.getRecentHealthChecks(processorName, hours);
      
      if (healthChecks.length === 0) {
        return 100; // No data, assume healthy
      }

      const healthyChecks = healthChecks.filter(check => check.is_healthy).length;
      return (healthyChecks / healthChecks.length) * 100;

    } catch (error) {
      logger.error('Failed to calculate uptime', { error, processorName });
      return 0;
    }
  }

  // Database methods (to be implemented with actual DB connection)
  private async storeHealthCheckResult(processorName: string, data: any): Promise<void> {
    // Store health check result in processor_health_logs table
    logger.debug('Storing health check result', { processorName, data });
  }

  private async storeMetricsInDatabase(processorName: string, data: any): Promise<void> {
    // Store metrics in processor_performance_metrics table
    logger.debug('Storing performance metrics', { processorName, data });
  }

  private async getRecentHealthChecks(processorName: string, hours: number): Promise<any[]> {
    // Query processor_health_logs for recent checks
    return []; // Placeholder
  }
}