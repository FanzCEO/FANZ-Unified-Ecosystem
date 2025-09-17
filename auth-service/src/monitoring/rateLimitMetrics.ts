import { Request, Response } from 'express';

// 📊 Rate Limiting Metrics and Observability
// Provides comprehensive monitoring and alerting for rate limiting events

interface RateLimitMetric {
  timestamp: string;
  category: 'sensitive' | 'token' | 'standard';
  endpoint: string;
  ip: string;
  userId?: string;
  limit: number;
  remaining: number;
  resetTime: string;
  userAgent?: string;
  bypassReason?: string;
}

class RateLimitMetrics {
  private metrics: Map<string, number> = new Map();
  private recentEvents: RateLimitMetric[] = [];
  private maxRecentEvents: number = 1000;

  /**
   * Record rate limit exceeded event
   */
  recordRateLimitExceeded(metric: RateLimitMetric): void {
    const key = `rate_limit_exceeded_${metric.category}`;
    this.incrementCounter(key);
    
    // Track by endpoint
    const endpointKey = `rate_limit_exceeded_endpoint_${metric.endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`;
    this.incrementCounter(endpointKey);
    
    // Store recent event
    this.addRecentEvent(metric);
    
    // Emit structured log
    console.warn('[RATE_LIMIT_EXCEEDED]', {
      timestamp: metric.timestamp,
      category: metric.category,
      endpoint: metric.endpoint,
      ip: this.maskIP(metric.ip),
      userId: metric.userId ? this.maskUserId(metric.userId) : undefined,
      limit: metric.limit,
      remaining: metric.remaining,
      resetTime: metric.resetTime,
      userAgent: metric.userAgent ? this.maskUserAgent(metric.userAgent) : undefined
    });
  }

  /**
   * Record rate limit bypass event
   */
  recordRateLimitBypass(endpoint: string, ip: string, reason: string, userId?: string): void {
    const key = 'rate_limit_bypassed';
    this.incrementCounter(key);
    
    const bypassKey = `rate_limit_bypass_reason_${reason.replace(/[^a-zA-Z0-9]/g, '_')}`;
    this.incrementCounter(bypassKey);
    
    console.info('[RATE_LIMIT_BYPASSED]', {
      timestamp: new Date().toISOString(),
      endpoint,
      ip: this.maskIP(ip),
      userId: userId ? this.maskUserId(userId) : undefined,
      reason
    });
  }

  /**
   * Record successful request within limits
   */
  recordRateLimitSuccess(category: string, endpoint: string, remaining: number): void {
    const key = `rate_limit_success_${category}`;
    this.incrementCounter(key);
    
    // Track remaining tokens as gauge
    const gaugeKey = `rate_limit_remaining_${category}`;
    this.setGauge(gaugeKey, remaining);
  }

  /**
   * Get current metrics snapshot
   */
  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics.entries());
  }

  /**
   * Get recent rate limit events
   */
  getRecentEvents(limit: number = 50): RateLimitMetric[] {
    return this.recentEvents.slice(-limit);
  }

  /**
   * Get rate limit health status
   */
  getHealthStatus(): {
    status: 'healthy' | 'warning' | 'critical';
    details: {
      totalExceeded: number;
      exceededLastHour: number;
      topOffendingIPs: Array<{ ip: string; count: number }>;
      categoryBreakdown: Record<string, number>;
    };
  } {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const recentEvents = this.recentEvents.filter(
      event => new Date(event.timestamp) > oneHourAgo
    );
    
    const totalExceeded = (this.metrics.get('rate_limit_exceeded_sensitive') || 0) +
                         (this.metrics.get('rate_limit_exceeded_token') || 0) +
                         (this.metrics.get('rate_limit_exceeded_standard') || 0);
    
    const ipCounts = new Map<string, number>();
    const categoryBreakdown: Record<string, number> = {};
    
    recentEvents.forEach(event => {
      // Count by IP (masked for privacy)
      const maskedIp = this.maskIP(event.ip);
      ipCounts.set(maskedIp, (ipCounts.get(maskedIp) || 0) + 1);
      
      // Count by category
      categoryBreakdown[event.category] = (categoryBreakdown[event.category] || 0) + 1;
    });
    
    const topOffendingIPs = Array.from(ipCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([ip, count]) => ({ ip, count }));
    
    const exceededLastHour = recentEvents.length;
    
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (exceededLastHour > 100) status = 'warning';
    if (exceededLastHour > 500) status = 'critical';
    
    return {
      status,
      details: {
        totalExceeded,
        exceededLastHour,
        topOffendingIPs,
        categoryBreakdown
      }
    };
  }

  /**
   * Generate Prometheus metrics format
   */
  getPrometheusMetrics(): string {
    const metrics: string[] = [];
    
    // Add counters
    this.metrics.forEach((value, key) => {
      if (key.includes('exceeded') || key.includes('bypassed') || key.includes('success')) {
        metrics.push(`# HELP ${key} Total count of ${key.replace(/_/g, ' ')}`);
        metrics.push(`# TYPE ${key} counter`);
        metrics.push(`${key} ${value}`);
        metrics.push('');
      }
    });
    
    // Add gauges for remaining tokens
    this.metrics.forEach((value, key) => {
      if (key.includes('remaining')) {
        metrics.push(`# HELP ${key} Current ${key.replace(/_/g, ' ')}`);
        metrics.push(`# TYPE ${key} gauge`);
        metrics.push(`${key} ${value}`);
        metrics.push('');
      }
    });
    
    return metrics.join('\n');
  }

  /**
   * Reset metrics (useful for testing)
   */
  reset(): void {
    this.metrics.clear();
    this.recentEvents = [];
  }

  private incrementCounter(key: string): void {
    this.metrics.set(key, (this.metrics.get(key) || 0) + 1);
  }

  private setGauge(key: string, value: number): void {
    this.metrics.set(key, value);
  }

  private addRecentEvent(metric: RateLimitMetric): void {
    this.recentEvents.push(metric);
    if (this.recentEvents.length > this.maxRecentEvents) {
      this.recentEvents.shift();
    }
  }

  private maskIP(ip: string): string {
    if (!ip || ip === 'unknown') return 'unknown';
    
    // IPv4: Show first two octets
    if (ip.includes('.')) {
      const parts = ip.split('.');
      if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.***.***.`;
      }
    }
    
    // IPv6: Show first two groups
    if (ip.includes(':')) {
      const parts = ip.split(':');
      if (parts.length >= 2) {
        return `${parts[0]}:${parts[1]}::****`;
      }
    }
    
    return 'masked-ip';
  }

  private maskUserId(userId: string): string {
    if (userId.length <= 6) {
      return '*'.repeat(userId.length);
    }
    return '*'.repeat(userId.length - 4) + userId.slice(-4);
  }

  private maskUserAgent(userAgent: string): string {
    // Extract browser and OS info while removing detailed version info
    const browserMatch = userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera)\/[\d.]+/);
    const osMatch = userAgent.match(/(Windows|Mac OS|Linux|Android|iOS)/);
    
    const browser = browserMatch ? browserMatch[1] : 'Unknown';
    const os = osMatch ? osMatch[1] : 'Unknown';
    
    return `${browser}/${os}`;
  }
}

// Singleton instance
export const rateLimitMetrics = new RateLimitMetrics();

/**
 * Express middleware to expose metrics endpoint
 */
export const metricsEndpoint = (req: Request, res: Response): void => {
  const format = req.query.format as string;
  
  if (format === 'prometheus') {
    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(rateLimitMetrics.getPrometheusMetrics());
  } else {
    res.json({
      metrics: rateLimitMetrics.getMetrics(),
      health: rateLimitMetrics.getHealthStatus(),
      recentEvents: rateLimitMetrics.getRecentEvents(20)
    });
  }
};

/**
 * Health check specifically for rate limiting
 */
export const rateLimitHealthCheck = (req: Request, res: Response): void => {
  const health = rateLimitMetrics.getHealthStatus();
  const statusCode = health.status === 'critical' ? 503 : 
                    health.status === 'warning' ? 200 : 200;
  
  res.status(statusCode).json({
    service: 'rate-limiting',
    status: health.status,
    timestamp: new Date().toISOString(),
    ...health.details
  });
};

export default rateLimitMetrics;