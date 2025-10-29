/**
 * Metrics Collector
 * Collects and tracks application metrics for monitoring and alerting
 */

import { Logger } from '../utils/logger';

const logger = new Logger('MetricsCollector');

export interface Metric {
  name: string;
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
}

export class MetricsCollector {
  private metrics: Map<string, Metric[]> = new Map();

  /**
   * Record a metric
   */
  public record(name: string, value: number, tags?: Record<string, string>): void {
    const metric: Metric = {
      name,
      value,
      timestamp: new Date(),
      tags
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    this.metrics.get(name)!.push(metric);

    logger.debug('Metric recorded', { name, value, tags });
  }

  /**
   * Increment a counter metric
   */
  public increment(name: string, tags?: Record<string, string>): void {
    this.record(name, 1, tags);
  }

  /**
   * Record timing information
   */
  public timing(name: string, durationMs: number, tags?: Record<string, string>): void {
    this.record(`${name}.duration`, durationMs, tags);
  }

  /**
   * Get metrics by name
   */
  public getMetrics(name: string): Metric[] {
    return this.metrics.get(name) || [];
  }

  /**
   * Get all metrics
   */
  public getAllMetrics(): Map<string, Metric[]> {
    return this.metrics;
  }

  /**
   * Clear metrics
   */
  public clear(name?: string): void {
    if (name) {
      this.metrics.delete(name);
    } else {
      this.metrics.clear();
    }
  }

  /**
   * Get metric summary
   */
  public getSummary(name: string): {
    count: number;
    sum: number;
    avg: number;
    min: number;
    max: number;
  } | null {
    const metrics = this.getMetrics(name);

    if (metrics.length === 0) {
      return null;
    }

    const values = metrics.map(m => m.value);
    const sum = values.reduce((a, b) => a + b, 0);

    return {
      count: metrics.length,
      sum,
      avg: sum / metrics.length,
      min: Math.min(...values),
      max: Math.max(...values)
    };
  }
}

// Singleton instance
export const metricsCollector = new MetricsCollector();

export default MetricsCollector;
