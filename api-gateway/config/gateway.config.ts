/**
 * 🔧 Complete FANZ API Gateway Configuration
 * 
 * Central configuration system for the API Gateway providing:
 * - Service routing and load balancing rules
 * - Security and authentication settings
 * - Rate limiting policies per service and user tier
 * - Monitoring and logging configuration
 * - Environment-specific overrides
 * - Dynamic configuration updates
 * 
 * This configuration drives all gateway behavior and can be updated
 * without service restart for most settings.
 */

import { ServiceConfig } from '../core/UnifiedAPIGateway';
import { MiddlewareConfig } from '../middleware/GatewayMiddleware';
import { DiscoveryConfig } from '../core/ServiceDiscovery';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface GatewayConfiguration {
  // Gateway server settings
  server: {
    port: number;
    host: string;
    ssl: {
      enabled: boolean;
      cert_path?: string;
      key_path?: string;
      port?: number;
    };
    cluster: {
      enabled: boolean;
      workers: number;
    };
  };

  // Service routing configuration
  services: {
    [serviceName: string]: {
      name: string;
      description: string;
      version: string;
      base_path: string;
      upstream: {
        protocol: 'http' | 'https';
        hosts: string[];
        port: number;
        health_check: string;
      };
      routing: {
        methods: string[];
        auth_required: boolean;
        rate_limit_tier: string;
        timeout_ms: number;
        retries: number;
      };
      load_balancing: {
        strategy: 'round_robin' | 'least_connections' | 'weighted' | 'ip_hash';
        weights?: number[];
        health_check_interval: number;
      };
      circuit_breaker: {
        enabled: boolean;
        failure_threshold: number;
        recovery_timeout: number;
        half_open_max_calls: number;
      };
    };
  };

  // Authentication and security
  auth: MiddlewareConfig['auth'];
  security: MiddlewareConfig['security'];
  
  // Rate limiting policies
  rate_limiting: MiddlewareConfig['rate_limiting'];
  
  // Service discovery
  discovery: DiscoveryConfig;
  
  // Logging and monitoring
  logging: MiddlewareConfig['logging'];
  monitoring: MiddlewareConfig['monitoring'] & {
    prometheus: {
      enabled: boolean;
      endpoint: string;
      pushgateway_url?: string;
    };
    jaeger: {
      enabled: boolean;
      endpoint: string;
      service_name: string;
    };
  };

  // Environment-specific overrides
  environments: {
    [env: string]: Partial<GatewayConfiguration>;
  };
}

// =============================================================================
// PRODUCTION CONFIGURATION
// =============================================================================

export const productionConfig: GatewayConfiguration = {
  server: {
    port: 8080,
    host: '0.0.0.0',
    ssl: {
      enabled: true,
      cert_path: '/etc/ssl/certs/gateway.crt',
      key_path: '/etc/ssl/private/gateway.key',
      port: 8443
    },
    cluster: {
      enabled: true,
      workers: 4
    }
  },

  services: {
    // FanzGPT AI Assistant Service
    fanz_gpt: {
      name: 'FanzGPT AI Assistant',
      description: 'Advanced AI-powered content generation and creator assistance',
      version: '1.0.0',
      base_path: '/api/v1/ai',
      upstream: {
        protocol: 'http',
        hosts: ['fanz-gpt-service-1:3001', 'fanz-gpt-service-2:3001'],
        port: 3001,
        health_check: '/health'
      },
      routing: {
        methods: ['GET', 'POST'],
        auth_required: true,
        rate_limit_tier: 'ai_service',
        timeout_ms: 30000,
        retries: 1
      },
      load_balancing: {
        strategy: 'least_connections',
        health_check_interval: 30000
      },
      circuit_breaker: {
        enabled: true,
        failure_threshold: 5,
        recovery_timeout: 60000,
        half_open_max_calls: 3
      }
    },

    // Creator CRM Service
    creator_crm: {
      name: 'Creator CRM & Analytics',
      description: 'Comprehensive creator relationship and analytics management',
      version: '1.0.0',
      base_path: '/api/v1/crm',
      upstream: {
        protocol: 'http',
        hosts: ['creator-crm-service-1:3004', 'creator-crm-service-2:3004'],
        port: 3004,
        health_check: '/health'
      },
      routing: {
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        auth_required: true,
        rate_limit_tier: 'business',
        timeout_ms: 15000,
        retries: 2
      },
      load_balancing: {
        strategy: 'round_robin',
        health_check_interval: 30000
      },
      circuit_breaker: {
        enabled: true,
        failure_threshold: 3,
        recovery_timeout: 45000,
        half_open_max_calls: 2
      }
    },

    // FanzMedia Core Service  
    fanz_media_core: {
      name: 'FanzMedia Core Processing',
      description: 'Advanced media processing, optimization, and content management',
      version: '1.0.0',
      base_path: '/api/v1/media',
      upstream: {
        protocol: 'http',
        hosts: ['fanz-media-core-1:3002', 'fanz-media-core-2:3002'],
        port: 3002,
        health_check: '/health'
      },
      routing: {
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        auth_required: true,
        rate_limit_tier: 'media',
        timeout_ms: 45000,
        retries: 1
      },
      load_balancing: {
        strategy: 'weighted',
        weights: [70, 30], // More traffic to first instance
        health_check_interval: 20000
      },
      circuit_breaker: {
        enabled: true,
        failure_threshold: 3,
        recovery_timeout: 90000,
        half_open_max_calls: 2
      }
    },

    // FanzSocial Network Service
    fanz_social: {
      name: 'FanzSocial Network',
      description: 'Social networking and community features for creators',
      version: '1.0.0',  
      base_path: '/api/v1/social',
      upstream: {
        protocol: 'http',
        hosts: ['fanz-social-1:3003', 'fanz-social-2:3003'],
        port: 3003,
        health_check: '/health'
      },
      routing: {
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        auth_required: true,
        rate_limit_tier: 'social',
        timeout_ms: 10000,
        retries: 2
      },
      load_balancing: {
        strategy: 'round_robin',
        health_check_interval: 15000
      },
      circuit_breaker: {
        enabled: true,
        failure_threshold: 5,
        recovery_timeout: 30000,
        half_open_max_calls: 3
      }
    },

    // ChatSphere Real-time Communication
    chat_sphere: {
      name: 'ChatSphere Communication Hub',
      description: 'Real-time messaging, video calls, and live streaming',
      version: '1.0.0',
      base_path: '/api/v1/chat',
      upstream: {
        protocol: 'http',
        hosts: ['chat-sphere-1:3005', 'chat-sphere-2:3005'],
        port: 3005,
        health_check: '/health'
      },
      routing: {
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        auth_required: true,
        rate_limit_tier: 'realtime',
        timeout_ms: 5000,
        retries: 1
      },
      load_balancing: {
        strategy: 'least_connections',
        health_check_interval: 10000
      },
      circuit_breaker: {
        enabled: true,
        failure_threshold: 7,
        recovery_timeout: 20000,
        half_open_max_calls: 5
      }
    },

    // Backend Core Services
    backend_core: {
      name: 'Backend Core Services',
      description: 'Core platform services including authentication and payments',
      version: '1.0.0',
      base_path: '/api/v1/core',
      upstream: {
        protocol: 'http',
        hosts: ['backend-core-1:3000', 'backend-core-2:3000'],
        port: 3000,
        health_check: '/health'
      },
      routing: {
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        auth_required: false, // Auth handled at this level
        rate_limit_tier: 'core',
        timeout_ms: 20000,
        retries: 2
      },
      load_balancing: {
        strategy: 'round_robin',
        health_check_interval: 15000
      },
      circuit_breaker: {
        enabled: true,
        failure_threshold: 3,
        recovery_timeout: 60000,
        half_open_max_calls: 2
      }
    }
  },

  auth: {
    jwt_secret: process.env.JWT_SECRET || 'your-super-secure-jwt-secret-key-here',
    jwt_expiration: '24h',
    api_key_header: 'x-api-key',
    session_header: 'x-session-id',
    oauth2: {
      enabled: false,
      providers: ['google', 'github'],
      client_id: process.env.OAUTH2_CLIENT_ID || '',
      client_secret: process.env.OAUTH2_CLIENT_SECRET || ''
    }
  },

  security: {
    cors: {
      origins: [
        'https://fanz.network',
        'https://app.fanz.network',
        'https://creator.fanz.network',
        'https://admin.fanz.network'
      ],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      headers: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'X-API-Key',
        'X-Session-ID',
        'X-Request-ID'
      ],
      credentials: true
    },
    headers: {
      hsts: true,
      csp: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' wss: https:;",
      frame_options: 'DENY'
    },
    api_key_validation: {
      required_format: /^fanz_[a-zA-Z0-9]{32}$/,
      encryption_algorithm: 'aes-256-gcm'
    }
  },

  rate_limiting: {
    redis_url: process.env.REDIS_URL || 'redis://localhost:6379',
    default_limit: 1000,
    window_ms: 60000,
    tier_limits: {
      free: {
        requests_per_minute: 100,
        burst_allowance: 10
      },
      premium: {
        requests_per_minute: 500,
        burst_allowance: 50
      },
      enterprise: {
        requests_per_minute: 2000,
        burst_allowance: 200
      },
      ai_service: {
        requests_per_minute: 50, // AI is resource intensive
        burst_allowance: 5
      },
      media: {
        requests_per_minute: 200,
        burst_allowance: 20
      },
      social: {
        requests_per_minute: 300,
        burst_allowance: 30
      },
      realtime: {
        requests_per_minute: 1000, // High for chat/streaming
        burst_allowance: 100
      },
      business: {
        requests_per_minute: 600,
        burst_allowance: 60
      },
      core: {
        requests_per_minute: 800,
        burst_allowance: 80
      }
    },
    endpoints: {
      '/api/v1/ai/generate': { limit: 10, window: 60 },
      '/api/v1/media/upload': { limit: 20, window: 60 },
      '/api/v1/auth/login': { limit: 5, window: 300 }, // 5 login attempts per 5 min
      '/api/v1/payments/process': { limit: 10, window: 60 }
    }
  },

  discovery: {
    registry_backend: 'redis',
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: 1, // Use different DB for service discovery
      key_prefix: 'fanz_services'
    },
    health_check: {
      interval: 30000,
      timeout: 5000,
      max_failures: 3,
      recovery_delay: 10000
    },
    announcement: {
      ttl: 300, // 5 minutes
      heartbeat_interval: 60000, // 1 minute
      cleanup_interval: 120000 // 2 minutes
    },
    load_balancing: {
      default_strategy: 'round_robin',
      health_score_weight: 0.7,
      latency_weight: 0.3
    }
  },

  logging: {
    level: 'info',
    include_request_body: true,
    include_response_body: false, // Too verbose for production
    sensitive_fields: [
      'password',
      'token',
      'api_key',
      'session_id',
      'authorization',
      'credit_card',
      'ssn',
      'email'
    ],
    max_body_size: 10000 // 10KB max
  },

  monitoring: {
    enabled: true,
    collect_metrics: true,
    alert_thresholds: {
      error_rate: 0.05, // 5%
      response_time: 2000 // 2 seconds
    },
    prometheus: {
      enabled: true,
      endpoint: '/metrics',
      pushgateway_url: process.env.PROMETHEUS_PUSHGATEWAY_URL
    },
    jaeger: {
      enabled: false, // Enable for distributed tracing
      endpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces',
      service_name: 'fanz-api-gateway'
    }
  },

  environments: {
    development: {
      server: {
        port: 3000,
        ssl: { enabled: false },
        cluster: { enabled: false, workers: 1 }
      },
      security: {
        cors: {
          origins: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:8080']
        },
        headers: {
          hsts: false
        }
      },
      logging: {
        level: 'debug',
        include_response_body: true
      },
      monitoring: {
        prometheus: { enabled: false }
      }
    },

    staging: {
      server: {
        port: 8080,
        ssl: { enabled: false }
      },
      security: {
        cors: {
          origins: ['https://staging.fanz.network']
        }
      },
      rate_limiting: {
        tier_limits: {
          free: { requests_per_minute: 50, burst_allowance: 5 },
          premium: { requests_per_minute: 200, burst_allowance: 20 }
        }
      }
    },

    production: {
      // Production config is the base config
    }
  }
};

// =============================================================================
// CONFIGURATION UTILITIES
// =============================================================================

export class ConfigurationManager {
  private config: GatewayConfiguration;
  private environment: string;

  constructor(baseConfig: GatewayConfiguration, environment: string = 'production') {
    this.environment = environment;
    this.config = this.mergeEnvironmentConfig(baseConfig, environment);
  }

  private mergeEnvironmentConfig(
    baseConfig: GatewayConfiguration,
    environment: string
  ): GatewayConfiguration {
    const envConfig = baseConfig.environments[environment];
    if (!envConfig) return baseConfig;

    // Deep merge environment-specific overrides
    return {
      ...baseConfig,
      ...envConfig,
      server: { ...baseConfig.server, ...envConfig.server },
      auth: { ...baseConfig.auth, ...envConfig.auth },
      security: {
        ...baseConfig.security,
        ...envConfig.security,
        cors: { ...baseConfig.security.cors, ...envConfig.security?.cors },
        headers: { ...baseConfig.security.headers, ...envConfig.security?.headers }
      },
      rate_limiting: {
        ...baseConfig.rate_limiting,
        ...envConfig.rate_limiting,
        tier_limits: { ...baseConfig.rate_limiting.tier_limits, ...envConfig.rate_limiting?.tier_limits }
      },
      logging: { ...baseConfig.logging, ...envConfig.logging },
      monitoring: { ...baseConfig.monitoring, ...envConfig.monitoring }
    };
  }

  public getConfig(): GatewayConfiguration {
    return this.config;
  }

  public getServiceConfig(serviceName: string): any {
    return this.config.services[serviceName];
  }

  public getMiddlewareConfig(): MiddlewareConfig {
    return {
      auth: this.config.auth,
      rate_limiting: this.config.rate_limiting,
      security: this.config.security,
      logging: this.config.logging,
      monitoring: this.config.monitoring
    };
  }

  public getDiscoveryConfig(): DiscoveryConfig {
    return this.config.discovery;
  }

  public updateConfig(updates: Partial<GatewayConfiguration>): void {
    this.config = { ...this.config, ...updates };
    console.log('🔧 Gateway configuration updated');
  }

  public validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate required environment variables
    if (!process.env.JWT_SECRET && this.config.auth.jwt_secret === 'your-super-secure-jwt-secret-key-here') {
      errors.push('JWT_SECRET environment variable is required');
    }

    // Validate service configurations
    for (const [serviceName, serviceConfig] of Object.entries(this.config.services)) {
      if (!serviceConfig.upstream.hosts.length) {
        errors.push(`Service ${serviceName} has no upstream hosts configured`);
      }

      if (!serviceConfig.upstream.health_check) {
        errors.push(`Service ${serviceName} has no health check endpoint configured`);
      }
    }

    // Validate Redis connection for rate limiting
    if (!this.config.rate_limiting.redis_url) {
      errors.push('Redis URL is required for rate limiting');
    }

    // Validate SSL configuration in production
    if (this.environment === 'production' && this.config.server.ssl.enabled) {
      if (!this.config.server.ssl.cert_path || !this.config.server.ssl.key_path) {
        errors.push('SSL certificate and key paths are required for production');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  public getServiceRoutes(): Array<{ path: string; service: string; methods: string[] }> {
    return Object.entries(this.config.services).map(([serviceName, serviceConfig]) => ({
      path: serviceConfig.base_path,
      service: serviceName,
      methods: serviceConfig.routing.methods
    }));
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export const configManager = new ConfigurationManager(
  productionConfig,
  process.env.NODE_ENV || 'production'
);

export default configManager;