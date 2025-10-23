import Fastify from 'fastify';
import register from '@fastify/under-pressure';
import client from 'prom-client';

const app = Fastify({ logger: true });
const port = Number(process.env.PORT || 8080);
const version = process.env.VERSION || 'dev';
const featureBanner = process.env.FEATURE_BANNER === 'true';
const serviceName = process.env.SERVICE_NAME || 'golden-api';

// Limit for concurrent /v1/load/:ms requests to prevent resource exhaustion
const MAX_CONCURRENT_LOAD_REQUESTS = 10;
let activeLoadRequests = 0;

// Prometheus metrics setup
const registry = new client.Registry();
client.collectDefaultMetrics({ register: registry });

// Custom metrics
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [registry]
});

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'],
  registers: [registry]
});

// Middleware for metrics collection
app.addHook('onRequest', async (request) => {
  request.startTime = Date.now();
});

app.addHook('onResponse', async (request, reply) => {
  const duration = (Date.now() - (request.startTime || Date.now())) / 1000;
  const route = request.routeOptions?.url || request.url;
  const status = reply.statusCode.toString();
  
  httpRequestsTotal.inc({ method: request.method, route, status });
  httpRequestDuration.observe({ method: request.method, route, status }, duration);
});

// Health endpoints
app.get('/healthz', async () => ({ 
  ok: true, 
  version, 
  service: serviceName,
  timestamp: new Date().toISOString()
}));

app.get('/readyz', async () => ({ 
  ready: true, 
  service: serviceName,
  features: { banner: featureBanner }
}));

app.get('/metrics', async (_, reply) => {
  reply.header('Content-Type', registry.contentType);
  return registry.metrics();
});

// API endpoints
app.get('/v1/ping', async () => ({ 
  pong: true, 
  banner: featureBanner,
  service: serviceName,
  version,
  timestamp: new Date().toISOString()
}));

app.get('/v1/info', async () => ({
  service: serviceName,
  version,
  environment: process.env.NODE_ENV || 'development',
  features: {
    banner: featureBanner
  },
  uptime: process.uptime(),
  memory: process.memoryUsage(),
  timestamp: new Date().toISOString()
}));

// Simulate some load for demo purposes
app.get('/v1/load/:ms', async (request, reply) => {
  if (activeLoadRequests >= MAX_CONCURRENT_LOAD_REQUESTS) {
    reply.code(503);
    return { error: 'Service unavailable: too many concurrent load requests.' };
  }
  activeLoadRequests += 1;
  try {
    const rawMs = request.params.ms;
    const ms = parseInt(rawMs, 10);
    if (
      isNaN(ms) ||
      !isFinite(ms) ||
      ms < 1 ||
      ms > 5000
    ) {
      reply.code(400);
      return { error: 'Bad request: ms must be an integer between 1 and 5000.' };
    }
    await new Promise(resolve => setTimeout(resolve, ms));
    return { delayed: ms, service: serviceName };
  } finally {
    activeLoadRequests -= 1;
  }
});

// Error endpoint for testing error rates
app.get('/v1/error', async (_, reply) => {
  const shouldError = Math.random() < 0.1; // 10% error rate
  if (shouldError) {
    reply.code(500);
    return { error: 'Simulated error for testing', service: serviceName };
  }
  return { success: true, service: serviceName };
});

// Register pressure monitoring
await app.register(register, {
  maxEventLoopDelay: 2000,
  maxHeapUsedBytes: 1_000_000_000,
  pressureHandler: (_req, _rep, type, value) => {
    app.log.warn({ type, value, service: serviceName }, 'System pressure detected');
  }
});

// Graceful shutdown
const shutdown = async () => {
  app.log.info(`Shutting down ${serviceName}...`);
  await app.close();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
app.listen({ port, host: '0.0.0.0' }).then(() => {
  app.log.info(`🚀 ${serviceName} ${version} listening on port ${port}`);
});