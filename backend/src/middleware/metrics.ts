import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';
import { config } from '../config';

// Create a Registry for metrics
const register = new client.Registry();

// Add default metrics
client.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
  registers: [register]
});

const httpRequestsInProgress = new client.Gauge({
  name: 'http_requests_in_progress',
  help: 'Number of HTTP requests currently being processed',
  registers: [register]
});

const activeConnections = new client.Gauge({
  name: 'active_connections_total',
  help: 'Number of active connections',
  registers: [register]
});

const databaseConnectionsTotal = new client.Gauge({
  name: 'database_connections_total',
  help: 'Total number of database connections',
  registers: [register]
});

const databaseConnectionsActive = new client.Gauge({
  name: 'database_connections_active',
  help: 'Number of active database connections',
  registers: [register]
});

const redisConnectionsTotal = new client.Gauge({
  name: 'redis_connections_total',
  help: 'Total number of Redis connections',
  registers: [register]
});

const cacheHitRate = new client.Counter({
  name: 'cache_operations_total',
  help: 'Total number of cache operations',
  labelNames: ['operation', 'result'],
  registers: [register]
});

const businessMetrics = new client.Counter({
  name: 'business_events_total',
  help: 'Total number of business events',
  labelNames: ['event_type', 'user_role'],
  registers: [register]
});

// WebSocket metrics
const websocketConnections = new client.Gauge({
  name: 'websocket_connections_total',
  help: 'Total number of WebSocket connections',
  registers: [register]
});

const websocketMessages = new client.Counter({
  name: 'websocket_messages_total',
  help: 'Total number of WebSocket messages',
  labelNames: ['direction', 'event_type'],
  registers: [register]
});

// Blockchain metrics
const blockchainTransactions = new client.Counter({
  name: 'blockchain_transactions_total',
  help: 'Total number of blockchain transactions',
  labelNames: ['type', 'status'],
  registers: [register]
});

const blockchainGasUsed = new client.Histogram({
  name: 'blockchain_gas_used',
  help: 'Gas used for blockchain transactions',
  labelNames: ['type'],
  buckets: [21000, 50000, 100000, 200000, 500000, 1000000],
  registers: [register]
});

// Extract route pattern from request
function getRoutePattern(req: Request): string {
  if (req.route) {
    return req.route.path;
  }
  
  // Try to extract pattern from original URL
  const url = req.originalUrl.split('?')[0]; // Remove query params
  
  // Replace UUIDs with :id
  const uuidRegex = /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
  const withoutUuids = url.replace(uuidRegex, '/:id');
  
  // Replace numeric IDs with :id
  const numericIdRegex = /\/\d+/g;
  const withoutNumericIds = withoutUuids.replace(numericIdRegex, '/:id');
  
  return withoutNumericIds || url;
}

// Metrics middleware
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Increment in-progress requests
  httpRequestsInProgress.inc();
  
  // Handle response end to record metrics
  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    const route = getRoutePattern(req);
    const statusCode = res.statusCode.toString();
    
    // Record metrics
    httpRequestsTotal.inc({
      method: req.method,
      route,
      status_code: statusCode
    });
    
    httpRequestDuration.observe({
      method: req.method,
      route,
      status_code: statusCode
    }, duration);
    
    // Decrement in-progress requests
    httpRequestsInProgress.dec();
  });
  
  next();
};

// Metrics collection functions
export class MetricsCollector {
  // Database metrics
  static updateDatabaseMetrics(total: number, active: number) {
    databaseConnectionsTotal.set(total);
    databaseConnectionsActive.set(active);
  }
  
  // Redis metrics
  static updateRedisMetrics(connections: number) {
    redisConnectionsTotal.set(connections);
  }
  
  // Cache metrics
  static recordCacheOperation(operation: 'get' | 'set' | 'del', result: 'hit' | 'miss' | 'success' | 'error') {
    cacheHitRate.inc({ operation, result });
  }
  
  // Business metrics
  static recordBusinessEvent(eventType: string, userRole?: string) {
    businessMetrics.inc({
      event_type: eventType,
      user_role: userRole || 'anonymous'
    });
  }
  
  // WebSocket metrics
  static updateWebSocketConnections(count: number) {
    websocketConnections.set(count);
  }
  
  static recordWebSocketMessage(direction: 'inbound' | 'outbound', eventType: string) {
    websocketMessages.inc({ direction, event_type: eventType });
  }
  
  // Blockchain metrics
  static recordBlockchainTransaction(type: string, status: 'success' | 'failed' | 'pending') {
    blockchainTransactions.inc({ type, status });
  }
  
  static recordGasUsed(type: string, gasUsed: number) {
    blockchainGasUsed.observe({ type }, gasUsed);
  }
  
  // Active connections
  static updateActiveConnections(count: number) {
    activeConnections.set(count);
  }
}

// Setup metrics endpoint
export const setupMetrics = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.path === '/metrics') {
      res.set('Content-Type', register.contentType);
      res.end(register.metrics());
      return;
    }
    next();
  };
};

// Health check metrics
const healthCheckGauge = new client.Gauge({
  name: 'health_check_status',
  help: 'Health check status (1 = healthy, 0 = unhealthy)',
  labelNames: ['component'],
  registers: [register]
});

export const updateHealthMetrics = (component: string, isHealthy: boolean) => {
  healthCheckGauge.set({ component }, isHealthy ? 1 : 0);
};

export { register };
export default metricsMiddleware;