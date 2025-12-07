import EventEmitter from 'events';

// Monitoring and logging service
export class MonitoringService extends EventEmitter {
  private metrics: Map<string, number> = new Map();
  private alerts: Array<{ message: string; level: string; timestamp: Date }> = [];
  private performanceData: Array<{ endpoint: string; duration: number; timestamp: Date }> = [];

  constructor() {
    super();
    this.startHealthChecks();
  }

  // Performance monitoring
  trackPerformance(endpoint: string, duration: number) {
    this.performanceData.push({
      endpoint,
      duration,
      timestamp: new Date()
    });

    // Keep only last 1000 entries
    if (this.performanceData.length > 1000) {
      this.performanceData = this.performanceData.slice(-1000);
    }

    // Alert on slow endpoints
    if (duration > 5000) {
      this.alert(`Slow endpoint detected: ${endpoint} took ${duration}ms`, 'warning');
    }

    this.updateMetric('total_requests', 1);
    this.updateMetric(`${endpoint}_requests`, 1);
    this.updateMetric(`${endpoint}_avg_duration`, duration);
  }

  // Error tracking
  trackError(error: Error, context?: any) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date(),
      count: this.getMetric(`error_${error.message}`) + 1
    };

    console.error('Application Error:', JSON.stringify(errorData));
    
    this.updateMetric('total_errors', 1);
    this.updateMetric(`error_${error.message}`, 1);

    // Alert on critical errors
    if (errorData.count > 5) {
      this.alert(`Frequent error: ${error.message} (${errorData.count} times)`, 'critical');
    }

    this.emit('error', errorData);
  }

  // User activity tracking
  trackUserActivity(userId: string, action: string, metadata?: any) {
    const activityData = {
      userId,
      action,
      metadata,
      timestamp: new Date()
    };

    console.log('User Activity:', JSON.stringify(activityData));
    
    this.updateMetric('total_user_actions', 1);
    this.updateMetric(`action_${action}`, 1);
    this.updateMetric(`user_${userId}_actions`, 1);

    this.emit('userActivity', activityData);
  }

  // Business metrics tracking
  trackBusinessMetric(metric: string, value: number, metadata?: any) {
    const metricData = {
      metric,
      value,
      metadata,
      timestamp: new Date()
    };

    console.log('Business Metric:', JSON.stringify(metricData));
    
    this.updateMetric(metric, value);
    this.emit('businessMetric', metricData);
  }

  // Security event tracking
  trackSecurityEvent(event: string, severity: 'low' | 'medium' | 'high' | 'critical', details: any) {
    const securityData = {
      event,
      severity,
      details,
      timestamp: new Date()
    };

    console.warn('Security Event:', JSON.stringify(securityData));
    
    this.updateMetric('security_events', 1);
    this.updateMetric(`security_${severity}`, 1);

    if (severity === 'critical') {
      this.alert(`Critical security event: ${event}`, 'critical');
    }

    this.emit('securityEvent', securityData);
  }

  // Payment monitoring
  trackPayment(amount: number, processor: string, status: 'success' | 'failed' | 'pending', userId: string) {
    const paymentData = {
      amount,
      processor,
      status,
      userId,
      timestamp: new Date()
    };

    console.log('Payment Event:', JSON.stringify(paymentData));
    
    this.updateMetric('total_payments', 1);
    this.updateMetric(`payments_${status}`, 1);
    this.updateMetric(`payments_${processor}`, 1);
    
    if (status === 'success') {
      this.updateMetric('total_revenue', amount);
    }

    this.emit('payment', paymentData);
  }

  // System health monitoring
  private startHealthChecks() {
    setInterval(() => {
      this.checkSystemHealth();
    }, 60000); // Check every minute
  }

  private async checkSystemHealth() {
    const health = {
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      cpu: process.cpuUsage(),
      timestamp: new Date()
    };

    // Memory usage alerts
    const memoryUsagePercent = health.memory.heapUsed / health.memory.heapTotal;
    if (memoryUsagePercent > 0.8) {
      this.alert(`High memory usage: ${(memoryUsagePercent * 100).toFixed(1)}%`, 'warning');
    }

    // Uptime tracking
    this.updateMetric('uptime_seconds', health.uptime);

    this.emit('healthCheck', health);
  }

  // Real-time dashboard data
  getDashboardData() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Recent performance data
    const recentPerformance = this.performanceData.filter(
      p => p.timestamp > oneHourAgo
    );

    // Calculate average response times
    const endpointPerformance = new Map<string, { count: number; avgDuration: number }>();
    
    recentPerformance.forEach(p => {
      const current = endpointPerformance.get(p.endpoint) || { count: 0, avgDuration: 0 };
      const newCount = current.count + 1;
      const newAvg = (current.avgDuration * current.count + p.duration) / newCount;
      endpointPerformance.set(p.endpoint, { count: newCount, avgDuration: newAvg });
    });

    return {
      metrics: Object.fromEntries(this.metrics),
      recentAlerts: this.alerts.slice(-10),
      endpointPerformance: Object.fromEntries(endpointPerformance),
      systemHealth: {
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        cpu: process.cpuUsage(),
      }
    };
  }

  // Analytics for business intelligence
  getAnalytics(timeframe: 'hour' | 'day' | 'week' | 'month' = 'day') {
    const now = new Date();
    let timeAgo: Date;
    
    switch (timeframe) {
      case 'hour':
        timeAgo = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case 'day':
        timeAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        timeAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        timeAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    // Filter performance data by timeframe
    const relevantPerformance = this.performanceData.filter(
      p => p.timestamp > timeAgo
    );

    return {
      totalRequests: relevantPerformance.length,
      averageResponseTime: relevantPerformance.reduce((sum, p) => sum + p.duration, 0) / relevantPerformance.length || 0,
      slowestEndpoints: this.getSlowestEndpoints(relevantPerformance),
      errorRate: this.calculateErrorRate(timeframe),
      topEndpoints: this.getTopEndpoints(relevantPerformance),
    };
  }

  // Helper methods
  private updateMetric(name: string, value: number) {
    this.metrics.set(name, (this.metrics.get(name) || 0) + value);
  }

  private getMetric(name: string): number {
    return this.metrics.get(name) || 0;
  }

  private alert(message: string, level: 'info' | 'warning' | 'critical') {
    const alert = { message, level, timestamp: new Date() };
    this.alerts.push(alert);
    
    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    console.log(`[${level.toUpperCase()}] ${message}`);
    this.emit('alert', alert);
  }

  private getSlowestEndpoints(performanceData: typeof this.performanceData) {
    const endpointTimes = new Map<string, number[]>();
    
    performanceData.forEach(p => {
      if (!endpointTimes.has(p.endpoint)) {
        endpointTimes.set(p.endpoint, []);
      }
      endpointTimes.get(p.endpoint)!.push(p.duration);
    });

    const slowest = Array.from(endpointTimes.entries())
      .map(([endpoint, times]) => ({
        endpoint,
        avgDuration: times.reduce((sum, t) => sum + t, 0) / times.length,
        maxDuration: Math.max(...times),
        requestCount: times.length
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, 5);

    return slowest;
  }

  private getTopEndpoints(performanceData: typeof this.performanceData) {
    const endpointCounts = new Map<string, number>();
    
    performanceData.forEach(p => {
      endpointCounts.set(p.endpoint, (endpointCounts.get(p.endpoint) || 0) + 1);
    });

    return Array.from(endpointCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([endpoint, count]) => ({ endpoint, count }));
  }

  private calculateErrorRate(timeframe: string): number {
    const totalRequests = this.getMetric('total_requests');
    const totalErrors = this.getMetric('total_errors');
    
    return totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
  }
}

export const monitoringService = new MonitoringService();

// Middleware for automatic performance tracking
export function performanceMiddleware(req: any, res: any, next: any) {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const endpoint = `${req.method} ${req.route?.path || req.path}`;
    
    monitoringService.trackPerformance(endpoint, duration);
    
    // Track user activity if authenticated
    if (req.user?.claims?.sub) {
      monitoringService.trackUserActivity(
        req.user.claims.sub, 
        `${req.method.toLowerCase()}_${req.route?.path || req.path}`,
        { statusCode: res.statusCode, duration }
      );
    }
  });
  
  next();
}