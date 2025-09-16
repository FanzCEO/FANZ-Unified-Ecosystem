/**
 * 🌐 Unified API Gateway - Central Hub for All Enterprise Systems
 * Authentication, rate limiting, request routing, load balancing, monitoring
 */

import { EventEmitter } from 'events';
import { Request, Response, NextFunction } from 'express';

interface APIEndpoint {
  id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  service: string;
  version: string;
  auth_required: boolean;
  rate_limit: {
    requests_per_minute: number;
    burst_limit: number;
  };
  permissions: string[];
  cache_ttl?: number;
  timeout_ms: number;
  retry_attempts: number;
}

interface ServiceRegistry {
  id: string;
  name: string;
  base_url: string;
  health_check_url: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'maintenance';
  instances: ServiceInstance[];
  load_balancer_strategy: 'round_robin' | 'least_connections' | 'weighted' | 'ip_hash';
  circuit_breaker: {
    failure_threshold: number;
    recovery_timeout: number;
    half_open_max_calls: number;
  };
}

interface ServiceInstance {
  id: string;
  url: string;
  status: 'active' | 'inactive' | 'draining';
  weight: number;
  current_connections: number;
  response_time_ms: number;
  error_rate: number;
  last_health_check: Date;
}

interface RateLimitBucket {
  user_id?: string;
  ip_address?: string;
  api_key?: string;
  tokens: number;
  last_refill: Date;
  requests_this_window: number;
  blocked_until?: Date;
}

interface APIMetrics {
  total_requests: number;
  requests_by_service: Map<string, number>;
  response_times: Map<string, number[]>;
  error_rates: Map<string, number>;
  rate_limit_violations: number;
  auth_failures: number;
  circuit_breaker_trips: number;
}

export class UnifiedAPIGateway extends EventEmitter {
  private serviceRegistry: Map<string, ServiceRegistry> = new Map();
  private apiEndpoints: Map<string, APIEndpoint> = new Map();
  private rateLimitBuckets: Map<string, RateLimitBucket> = new Map();
  private metrics: APIMetrics = {
    total_requests: 0,
    requests_by_service: new Map(),
    response_times: new Map(),
    error_rates: new Map(),
    rate_limit_violations: 0,
    auth_failures: 0,
    circuit_breaker_trips: 0
  };
  
  constructor() {
    super();
    this.initializeGateway();
  }

  private async initializeGateway(): Promise<void> {
    console.log('🌐 Initializing Unified API Gateway...');
    
    await this.registerEnterpriseServices();
    await this.setupAPIEndpoints();
    await this.startHealthChecks();
    await this.initializeRateLimiting();
    
    console.log('✅ Unified API Gateway initialized successfully');
  }

  private async registerEnterpriseServices(): Promise<void> {
    const services: ServiceRegistry[] = [
      {
        id: 'security_service',
        name: 'Advanced Security & Threat Protection',
        base_url: 'http://security-service:8001',
        health_check_url: '/health',
        status: 'healthy',
        instances: [
          {
            id: 'security-01',
            url: 'http://security-service-01:8001',
            status: 'active',
            weight: 100,
            current_connections: 0,
            response_time_ms: 45,
            error_rate: 0.001,
            last_health_check: new Date()
          }
        ],
        load_balancer_strategy: 'round_robin',
        circuit_breaker: {
          failure_threshold: 5,
          recovery_timeout: 30000,
          half_open_max_calls: 3
        }
      },
      {
        id: 'intelligence_service',
        name: 'Creator Economy Intelligence Hub',
        base_url: 'http://intelligence-service:8002',
        health_check_url: '/health',
        status: 'healthy',
        instances: [
          {
            id: 'intelligence-01',
            url: 'http://intelligence-service-01:8002',
            status: 'active',
            weight: 100,
            current_connections: 0,
            response_time_ms: 120,
            error_rate: 0.002,
            last_health_check: new Date()
          }
        ],
        load_balancer_strategy: 'least_connections',
        circuit_breaker: {
          failure_threshold: 3,
          recovery_timeout: 60000,
          half_open_max_calls: 2
        }
      },
      {
        id: 'web3_service',
        name: 'Blockchain & Web3 Ecosystem',
        base_url: 'http://web3-service:8003',
        health_check_url: '/health',
        status: 'healthy',
        instances: [
          {
            id: 'web3-01',
            url: 'http://web3-service-01:8003',
            status: 'active',
            weight: 100,
            current_connections: 0,
            response_time_ms: 200,
            error_rate: 0.005,
            last_health_check: new Date()
          }
        ],
        load_balancer_strategy: 'weighted',
        circuit_breaker: {
          failure_threshold: 3,
          recovery_timeout: 45000,
          half_open_max_calls: 2
        }
      },
      {
        id: 'cdn_service',
        name: 'Global CDN & Edge Computing',
        base_url: 'http://cdn-service:8004',
        health_check_url: '/health',
        status: 'healthy',
        instances: [
          {
            id: 'cdn-01',
            url: 'http://cdn-service-01:8004',
            status: 'active',
            weight: 100,
            current_connections: 0,
            response_time_ms: 25,
            error_rate: 0.001,
            last_health_check: new Date()
          }
        ],
        load_balancer_strategy: 'round_robin',
        circuit_breaker: {
          failure_threshold: 5,
          recovery_timeout: 20000,
          half_open_max_calls: 5
        }
      },
      {
        id: 'finance_service',
        name: 'FanzFinance OS',
        base_url: 'http://finance-service:8005',
        health_check_url: '/health',
        status: 'healthy',
        instances: [
          {
            id: 'finance-01',
            url: 'http://finance-service-01:8005',
            status: 'active',
            weight: 100,
            current_connections: 0,
            response_time_ms: 80,
            error_rate: 0.001,
            last_health_check: new Date()
          }
        ],
        load_balancer_strategy: 'ip_hash',
        circuit_breaker: {
          failure_threshold: 2,
          recovery_timeout: 60000,
          half_open_max_calls: 1
        }
      },
      {
        id: 'support_service',
        name: 'Customer Success Platform',
        base_url: 'http://support-service:8006',
        health_check_url: '/health',
        status: 'healthy',
        instances: [
          {
            id: 'support-01',
            url: 'http://support-service-01:8006',
            status: 'active',
            weight: 100,
            current_connections: 0,
            response_time_ms: 60,
            error_rate: 0.002,
            last_health_check: new Date()
          }
        ],
        load_balancer_strategy: 'least_connections',
        circuit_breaker: {
          failure_threshold: 3,
          recovery_timeout: 30000,
          half_open_max_calls: 3
        }
      }
    ];

    for (const service of services) {
      this.serviceRegistry.set(service.id, service);
    }

    console.log(`🏗️ Registered ${services.length} enterprise services`);
  }

  private async setupAPIEndpoints(): Promise<void> {
    const endpoints: APIEndpoint[] = [
      // Security Service Endpoints
      {
        id: 'security_status',
        path: '/api/v1/security/status',
        method: 'GET',
        service: 'security_service',
        version: 'v1',
        auth_required: true,
        rate_limit: { requests_per_minute: 100, burst_limit: 10 },
        permissions: ['security:read'],
        cache_ttl: 30,
        timeout_ms: 5000,
        retry_attempts: 2
      },
      {
        id: 'security_scan',
        path: '/api/v1/security/scan',
        method: 'POST',
        service: 'security_service',
        version: 'v1',
        auth_required: true,
        rate_limit: { requests_per_minute: 20, burst_limit: 3 },
        permissions: ['security:scan'],
        timeout_ms: 30000,
        retry_attempts: 1
      },
      
      // Intelligence Service Endpoints
      {
        id: 'analytics_dashboard',
        path: '/api/v1/intelligence/dashboard/:user_id',
        method: 'GET',
        service: 'intelligence_service',
        version: 'v1',
        auth_required: true,
        rate_limit: { requests_per_minute: 60, burst_limit: 10 },
        permissions: ['analytics:read'],
        cache_ttl: 300,
        timeout_ms: 10000,
        retry_attempts: 2
      },
      {
        id: 'predictive_insights',
        path: '/api/v1/intelligence/predictions',
        method: 'POST',
        service: 'intelligence_service',
        version: 'v1',
        auth_required: true,
        rate_limit: { requests_per_minute: 30, burst_limit: 5 },
        permissions: ['analytics:predict'],
        timeout_ms: 15000,
        retry_attempts: 1
      },
      
      // Web3 Service Endpoints
      {
        id: 'nft_collections',
        path: '/api/v1/web3/nft/collections',
        method: 'GET',
        service: 'web3_service',
        version: 'v1',
        auth_required: true,
        rate_limit: { requests_per_minute: 100, burst_limit: 15 },
        permissions: ['web3:read'],
        cache_ttl: 600,
        timeout_ms: 8000,
        retry_attempts: 2
      },
      {
        id: 'token_transfer',
        path: '/api/v1/web3/tokens/transfer',
        method: 'POST',
        service: 'web3_service',
        version: 'v1',
        auth_required: true,
        rate_limit: { requests_per_minute: 10, burst_limit: 2 },
        permissions: ['web3:transfer'],
        timeout_ms: 45000,
        retry_attempts: 0
      },
      
      // CDN Service Endpoints
      {
        id: 'content_optimize',
        path: '/api/v1/cdn/optimize',
        method: 'POST',
        service: 'cdn_service',
        version: 'v1',
        auth_required: true,
        rate_limit: { requests_per_minute: 200, burst_limit: 20 },
        permissions: ['cdn:optimize'],
        timeout_ms: 12000,
        retry_attempts: 2
      },
      {
        id: 'streaming_url',
        path: '/api/v1/cdn/stream/:content_id',
        method: 'GET',
        service: 'cdn_service',
        version: 'v1',
        auth_required: false,
        rate_limit: { requests_per_minute: 1000, burst_limit: 50 },
        permissions: [],
        cache_ttl: 60,
        timeout_ms: 3000,
        retry_attempts: 3
      },
      
      // Finance Service Endpoints
      {
        id: 'payment_process',
        path: '/api/v1/finance/payments',
        method: 'POST',
        service: 'finance_service',
        version: 'v1',
        auth_required: true,
        rate_limit: { requests_per_minute: 50, burst_limit: 5 },
        permissions: ['finance:payment'],
        timeout_ms: 20000,
        retry_attempts: 1
      },
      {
        id: 'payout_request',
        path: '/api/v1/finance/payouts',
        method: 'POST',
        service: 'finance_service',
        version: 'v1',
        auth_required: true,
        rate_limit: { requests_per_minute: 20, burst_limit: 3 },
        permissions: ['finance:payout'],
        timeout_ms: 15000,
        retry_attempts: 1
      },
      
      // Support Service Endpoints
      {
        id: 'support_ticket',
        path: '/api/v1/support/tickets',
        method: 'POST',
        service: 'support_service',
        version: 'v1',
        auth_required: true,
        rate_limit: { requests_per_minute: 30, burst_limit: 5 },
        permissions: ['support:create'],
        timeout_ms: 10000,
        retry_attempts: 2
      },
      {
        id: 'support_dashboard',
        path: '/api/v1/support/dashboard',
        method: 'GET',
        service: 'support_service',
        version: 'v1',
        auth_required: true,
        rate_limit: { requests_per_minute: 100, burst_limit: 10 },
        permissions: ['support:read'],
        cache_ttl: 120,
        timeout_ms: 8000,
        retry_attempts: 2
      }
    ];

    for (const endpoint of endpoints) {
      const routeKey = `${endpoint.method}:${endpoint.path}`;
      this.apiEndpoints.set(routeKey, endpoint);
    }

    console.log(`📋 Configured ${endpoints.length} API endpoints`);
  }

  private async initializeRateLimiting(): Promise<void> {
    // Start rate limit bucket cleanup
    setInterval(() => {
      this.cleanupRateLimitBuckets();
    }, 60000); // Every minute

    console.log('⚡ Rate limiting system initialized');
  }

  private async startHealthChecks(): Promise<void> {
    setInterval(async () => {
      await this.performHealthChecks();
    }, 30000); // Every 30 seconds

    console.log('🏥 Health check monitoring started');
  }

  // Express middleware for API Gateway
  public gatewayMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const startTime = Date.now();
    
    try {
      // 1. Find matching endpoint
      const endpoint = this.findMatchingEndpoint(req);
      if (!endpoint) {
        res.status(404).json({ error: 'Endpoint not found' });
        return;
      }

      // 2. Authentication check
      if (endpoint.auth_required && !await this.authenticateRequest(req)) {
        this.metrics.auth_failures++;
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      // 3. Permission check
      if (endpoint.permissions.length > 0 && !await this.checkPermissions(req, endpoint.permissions)) {
        res.status(403).json({ error: 'Insufficient permissions' });
        return;
      }

      // 4. Rate limiting
      if (!await this.checkRateLimit(req, endpoint)) {
        this.metrics.rate_limit_violations++;
        res.status(429).json({ error: 'Rate limit exceeded' });
        return;
      }

      // 5. Service routing
      const targetService = this.serviceRegistry.get(endpoint.service);
      if (!targetService || targetService.status === 'unhealthy') {
        res.status(503).json({ error: 'Service unavailable' });
        return;
      }

      // 6. Load balancing
      const targetInstance = this.selectServiceInstance(targetService);
      if (!targetInstance) {
        res.status(503).json({ error: 'No healthy service instances' });
        return;
      }

      // 7. Proxy request
      const response = await this.proxyRequest(req, endpoint, targetInstance);
      
      // 8. Update metrics
      const responseTime = Date.now() - startTime;
      this.updateMetrics(endpoint.service, responseTime, response.status >= 400);
      
      res.status(response.status).json(response.data);

    } catch (error) {
      console.error('Gateway error:', error);
      res.status(500).json({ error: 'Internal gateway error' });
      
      // Update error metrics
      const responseTime = Date.now() - startTime;
      this.updateMetrics('gateway', responseTime, true);
    }
  };

  private findMatchingEndpoint(req: Request): APIEndpoint | undefined {
    const routeKey = `${req.method}:${req.path}`;
    let endpoint = this.apiEndpoints.get(routeKey);
    
    if (!endpoint) {
      // Try pattern matching for parameterized routes
      for (const [key, ep] of this.apiEndpoints.entries()) {
        if (this.matchRoute(key, `${req.method}:${req.path}`)) {
          endpoint = ep;
          break;
        }
      }
    }
    
    return endpoint;
  }

  private matchRoute(pattern: string, actual: string): boolean {
    // Simple pattern matching for :param routes
    const patternParts = pattern.split('/');
    const actualParts = actual.split('/');
    
    if (patternParts.length !== actualParts.length) return false;
    
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) continue;
      if (patternParts[i] !== actualParts[i]) return false;
    }
    
    return true;
  }

  private async authenticateRequest(req: Request): Promise<boolean> {
    // Mock authentication - integrate with your auth system
    const authHeader = req.headers.authorization;
    return !!(authHeader && authHeader.startsWith('Bearer '));
  }

  private async checkPermissions(req: Request, requiredPermissions: string[]): Promise<boolean> {
    // Mock permission check - integrate with your permission system
    const userPermissions = req.headers['x-user-permissions'] as string || '';
    const permissions = userPermissions.split(',');
    
    return requiredPermissions.every(perm => permissions.includes(perm));
  }

  private async checkRateLimit(req: Request, endpoint: APIEndpoint): Promise<boolean> {
    const identifier = this.getRateLimitIdentifier(req);
    const bucketKey = `${endpoint.id}:${identifier}`;
    
    let bucket = this.rateLimitBuckets.get(bucketKey);
    if (!bucket) {
      bucket = {
        user_id: req.headers['x-user-id'] as string,
        ip_address: req.ip,
        tokens: endpoint.rate_limit.requests_per_minute,
        last_refill: new Date(),
        requests_this_window: 0
      };
      this.rateLimitBuckets.set(bucketKey, bucket);
    }

    // Refill tokens based on time elapsed
    const now = new Date();
    const timeDiff = now.getTime() - bucket.last_refill.getTime();
    const tokensToAdd = Math.floor(timeDiff / (60000 / endpoint.rate_limit.requests_per_minute));
    
    if (tokensToAdd > 0) {
      bucket.tokens = Math.min(endpoint.rate_limit.burst_limit, bucket.tokens + tokensToAdd);
      bucket.last_refill = now;
    }

    if (bucket.tokens > 0) {
      bucket.tokens--;
      bucket.requests_this_window++;
      return true;
    }

    return false;
  }

  private getRateLimitIdentifier(req: Request): string {
    // Prefer user ID, fallback to API key, then IP
    return req.headers['x-user-id'] as string || 
           req.headers['x-api-key'] as string || 
           req.ip || 'anonymous';
  }

  private selectServiceInstance(service: ServiceRegistry): ServiceInstance | null {
    const healthyInstances = service.instances.filter(inst => inst.status === 'active');
    if (healthyInstances.length === 0) return null;

    switch (service.load_balancer_strategy) {
      case 'round_robin':
        return healthyInstances[Math.floor(Math.random() * healthyInstances.length)];
      
      case 'least_connections':
        return healthyInstances.reduce((best, current) => 
          current.current_connections < best.current_connections ? current : best
        );
      
      case 'weighted':
        const totalWeight = healthyInstances.reduce((sum, inst) => sum + inst.weight, 0);
        const random = Math.random() * totalWeight;
        let weightSum = 0;
        
        for (const instance of healthyInstances) {
          weightSum += instance.weight;
          if (random <= weightSum) return instance;
        }
        return healthyInstances[0];
      
      case 'ip_hash':
        // Simple hash based on first healthy instance
        return healthyInstances[0];
      
      default:
        return healthyInstances[0];
    }
  }

  private async proxyRequest(req: Request, endpoint: APIEndpoint, instance: ServiceInstance): Promise<any> {
    // Mock proxy response - would use actual HTTP client
    const mockResponse = {
      status: 200,
      data: {
        service: endpoint.service,
        endpoint: endpoint.path,
        instance: instance.id,
        timestamp: new Date().toISOString(),
        success: true
      }
    };

    // Simulate response time
    await new Promise(resolve => setTimeout(resolve, instance.response_time_ms));
    
    return mockResponse;
  }

  private updateMetrics(service: string, responseTime: number, isError: boolean): void {
    this.metrics.total_requests++;
    
    const serviceRequests = this.metrics.requests_by_service.get(service) || 0;
    this.metrics.requests_by_service.set(service, serviceRequests + 1);
    
    const responseTimes = this.metrics.response_times.get(service) || [];
    responseTimes.push(responseTime);
    this.metrics.response_times.set(service, responseTimes.slice(-100)); // Keep last 100
    
    if (isError) {
      const errorRate = this.metrics.error_rates.get(service) || 0;
      this.metrics.error_rates.set(service, errorRate + 1);
    }
  }

  private cleanupRateLimitBuckets(): void {
    const now = new Date();
    const cutoff = now.getTime() - 5 * 60 * 1000; // 5 minutes ago
    
    for (const [key, bucket] of this.rateLimitBuckets.entries()) {
      if (bucket.last_refill.getTime() < cutoff) {
        this.rateLimitBuckets.delete(key);
      }
    }
  }

  private async performHealthChecks(): Promise<void> {
    for (const service of this.serviceRegistry.values()) {
      for (const instance of service.instances) {
        try {
          // Mock health check - would make actual HTTP request
          const isHealthy = Math.random() > 0.05; // 95% uptime simulation
          
          if (isHealthy) {
            instance.status = 'active';
            instance.response_time_ms = 50 + Math.random() * 100;
            instance.error_rate = Math.random() * 0.01;
          } else {
            instance.status = 'inactive';
            instance.error_rate = Math.min(1.0, instance.error_rate + 0.1);
          }
          
          instance.last_health_check = new Date();
          
        } catch (error) {
          instance.status = 'inactive';
          console.error(`Health check failed for ${instance.id}:`, error);
        }
      }
      
      // Update service status based on instances
      const healthyInstances = service.instances.filter(inst => inst.status === 'active').length;
      const totalInstances = service.instances.length;
      
      if (healthyInstances === 0) {
        service.status = 'unhealthy';
      } else if (healthyInstances < totalInstances * 0.5) {
        service.status = 'degraded';
      } else {
        service.status = 'healthy';
      }
    }
  }

  public getGatewayStatus(): {
    services: { [key: string]: any };
    metrics: {
      total_requests: number;
      avg_response_time: number;
      error_rate: number;
      rate_limit_violations: number;
    };
    health: {
      healthy_services: number;
      total_services: number;
      uptime_percentage: number;
    };
  } {
    const services: { [key: string]: any } = {};
    let healthyServices = 0;
    
    for (const [id, service] of this.serviceRegistry.entries()) {
      if (service.status === 'healthy') healthyServices++;
      
      services[id] = {
        name: service.name,
        status: service.status,
        instances: service.instances.length,
        healthy_instances: service.instances.filter(i => i.status === 'active').length,
        avg_response_time: service.instances.reduce((sum, i) => sum + i.response_time_ms, 0) / service.instances.length
      };
    }

    const totalResponseTimes = Array.from(this.metrics.response_times.values()).flat();
    const avgResponseTime = totalResponseTimes.length > 0 ? 
      totalResponseTimes.reduce((a, b) => a + b, 0) / totalResponseTimes.length : 0;

    const totalErrors = Array.from(this.metrics.error_rates.values()).reduce((a, b) => a + b, 0);
    const errorRate = this.metrics.total_requests > 0 ? totalErrors / this.metrics.total_requests : 0;

    return {
      services,
      metrics: {
        total_requests: this.metrics.total_requests,
        avg_response_time: Math.round(avgResponseTime),
        error_rate: Number(errorRate.toFixed(4)),
        rate_limit_violations: this.metrics.rate_limit_violations
      },
      health: {
        healthy_services: healthyServices,
        total_services: this.serviceRegistry.size,
        uptime_percentage: Number((healthyServices / this.serviceRegistry.size * 100).toFixed(2))
      }
    };
  }
}

export const unifiedAPIGateway = new UnifiedAPIGateway();
export default unifiedAPIGateway;