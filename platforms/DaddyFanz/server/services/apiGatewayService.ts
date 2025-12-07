import { logger } from "../logger";

interface ServiceConfig {
  name: string;
  url: string;
  healthPath: string;
  weight: number;
  timeout: number;
}

interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: "closed" | "open" | "half-open";
}

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

class APIGatewayService {
  private services = new Map<string, ServiceConfig>();
  private circuitBreakers = new Map<string, CircuitBreakerState>();
  private cache = new Map<string, CacheEntry>();
  private readonly failureThreshold = 5;
  private readonly openStateTimeout = 60000; // 60 seconds
  private readonly cacheMaxSize = 1000;

  constructor() {
    this.registerDefaultServices();
    // Only start health checks in production when microservices are available
    if (process.env.NODE_ENV === 'production' && process.env.ENABLE_MICROSERVICES === 'true') {
      this.startHealthChecks();
    }
    this.startCacheCleanup();
  }

  private registerDefaultServices() {
    const services: ServiceConfig[] = [
      {
        name: "infrastructure",
        url: process.env.INFRASTRUCTURE_SERVICE_URL || "http://localhost:5001",
        healthPath: "/health",
        weight: 1,
        timeout: 5000,
      },
      {
        name: "security",
        url: process.env.SECURITY_SERVICE_URL || "http://localhost:5002",
        healthPath: "/health",
        weight: 1,
        timeout: 5000,
      },
      {
        name: "mobile",
        url: process.env.MOBILE_SERVICE_URL || "http://localhost:5003",
        healthPath: "/health",
        weight: 1,
        timeout: 3000,
      },
      {
        name: "monitoring",
        url: process.env.MONITORING_SERVICE_URL || "http://localhost:5004",
        healthPath: "/health",
        weight: 1,
        timeout: 5000,
      },
      {
        name: "payments",
        url: process.env.PAYMENTS_SERVICE_URL || "http://localhost:5005",
        healthPath: "/health",
        weight: 1,
        timeout: 10000,
      },
      {
        name: "media",
        url: process.env.MEDIA_SERVICE_URL || "http://localhost:5006",
        healthPath: "/health",
        weight: 1,
        timeout: 15000,
      },
    ];

    services.forEach(service => {
      this.services.set(service.name, service);
      this.circuitBreakers.set(service.name, {
        failures: 0,
        lastFailureTime: 0,
        state: "closed",
      });
    });
  }

  private startHealthChecks() {
    setInterval(async () => {
      for (const [name, service] of this.services) {
        try {
          await this.checkServiceHealth(name);
        } catch (error) {
          logger.warn(`Health check failed for service: ${name}`, { error });
        }
      }
    }, 30000); // Every 30 seconds
  }

  private startCacheCleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache) {
        if (now - entry.timestamp > entry.ttl) {
          this.cache.delete(key);
        }
      }

      // Maintain cache size limit
      if (this.cache.size > this.cacheMaxSize) {
        const entries = Array.from(this.cache.entries());
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        const toDelete = entries.slice(0, entries.length - this.cacheMaxSize);
        toDelete.forEach(([key]) => this.cache.delete(key));
      }
    }, 60000); // Every minute
  }

  private async checkServiceHealth(serviceName: string): Promise<boolean> {
    const service = this.services.get(serviceName);
    const breaker = this.circuitBreakers.get(serviceName);
    
    if (!service || !breaker) return false;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), service.timeout);

      const response = await fetch(`${service.url}${service.healthPath}`, {
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        // Reset circuit breaker on success
        breaker.failures = 0;
        breaker.state = "closed";
        logger.debug(`Service ${serviceName} health check passed`);
        return true;
      } else {
        throw new Error(`Health check failed with status: ${response.status}`);
      }
    } catch (error) {
      this.recordFailure(serviceName);
      logger.warn(`Service ${serviceName} health check failed`, { error });
      return false;
    }
  }

  private recordFailure(serviceName: string) {
    const breaker = this.circuitBreakers.get(serviceName);
    if (!breaker) return;

    breaker.failures++;
    breaker.lastFailureTime = Date.now();

    if (breaker.failures >= this.failureThreshold) {
      breaker.state = "open";
      logger.warn(`Circuit breaker opened for service: ${serviceName}`, {
        failures: breaker.failures,
      });
    }
  }

  private canMakeRequest(serviceName: string): boolean {
    const breaker = this.circuitBreakers.get(serviceName);
    if (!breaker) return false;

    if (breaker.state === "closed") return true;
    if (breaker.state === "open") {
      if (Date.now() - breaker.lastFailureTime > this.openStateTimeout) {
        breaker.state = "half-open";
        return true;
      }
      return false;
    }
    if (breaker.state === "half-open") return true;

    return false;
  }

  private getCacheKey(method: string, url: string, data?: any): string {
    return `${method}:${url}:${data ? JSON.stringify(data) : ""}`;
  }

  private getFromCache(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  private setCache(key: string, data: any, ttl: number = 300000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  async routeRequest(
    serviceName: string,
    path: string,
    options: {
      method?: string;
      data?: any;
      useCache?: boolean;
      cacheTtl?: number;
    } = {}
  ): Promise<any> {
    const { method = "GET", data, useCache = true, cacheTtl = 300000 } = options;
    
    if (!this.canMakeRequest(serviceName)) {
      throw new Error(`Service ${serviceName} is currently unavailable (circuit breaker open)`);
    }

    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }

    // Check cache for GET requests
    if (method === "GET" && useCache) {
      const cacheKey = this.getCacheKey(method, `${service.url}${path}`, data);
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        logger.debug(`Cache hit for ${serviceName}${path}`);
        return cached;
      }
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), service.timeout);

      const response = await fetch(`${service.url}${path}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Request failed with status: ${response.status}`);
      }

      const result = await response.json();

      // Cache successful GET responses
      if (method === "GET" && useCache) {
        const cacheKey = this.getCacheKey(method, `${service.url}${path}`, data);
        this.setCache(cacheKey, result, cacheTtl);
      }

      // Reset circuit breaker on success
      const breaker = this.circuitBreakers.get(serviceName);
      if (breaker && breaker.state === "half-open") {
        breaker.state = "closed";
        breaker.failures = 0;
      }

      return result;
    } catch (error) {
      this.recordFailure(serviceName);
      logger.error(`Request to service ${serviceName} failed`, { error, path });
      throw error;
    }
  }

  getServiceStatus(): Record<string, any> {
    const status: Record<string, any> = {};
    
    for (const [name, service] of this.services) {
      const breaker = this.circuitBreakers.get(name);
      status[name] = {
        url: service.url,
        state: breaker?.state || "unknown",
        failures: breaker?.failures || 0,
        lastFailureTime: breaker?.lastFailureTime || null,
      };
    }

    return status;
  }

  getCacheStats(): { size: number; maxSize: number; hitRate?: number } {
    return {
      size: this.cache.size,
      maxSize: this.cacheMaxSize,
    };
  }
}

export const apiGatewayService = new APIGatewayService();
