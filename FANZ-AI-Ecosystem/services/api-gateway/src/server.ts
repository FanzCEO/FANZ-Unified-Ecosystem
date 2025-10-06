import { APIGateway, GatewayConfig } from './gateway';
import { Logger } from '../../shared/utils/Logger';

/**
 * FANZ AI Ecosystem API Gateway Server
 * Entry point for the central routing service
 */

const logger = new Logger('APIGatewayServer');

// Configuration from environment variables
const config: GatewayConfig = {
  port: parseInt(process.env.PORT || '8080'),
  services: {
    'ai-intelligence-hub': {
      path: '/api/intelligence',
      target: process.env.AI_INTELLIGENCE_HUB_URL || 'http://ai-intelligence-hub:3000',
      healthCheck: '/health',
      rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 1000 // limit each IP to 1000 requests per windowMs
      }
    },
    'ai-creator-assistant': {
      path: '/api/assistant',
      target: process.env.AI_CREATOR_ASSISTANT_URL || 'http://ai-creator-assistant:3000',
      healthCheck: '/health',
      rateLimit: {
        windowMs: 15 * 60 * 1000,
        max: 500 // Lower limit for AI-intensive operations
      }
    },
    'content-curation-engine': {
      path: '/api/curation',
      target: process.env.CONTENT_CURATION_ENGINE_URL || 'http://content-curation-engine:3000',
      healthCheck: '/health',
      rateLimit: {
        windowMs: 15 * 60 * 1000,
        max: 2000 // Higher limit for content operations
      }
    },
    'content-distribution-network': {
      path: '/api/cdn',
      target: process.env.CONTENT_DISTRIBUTION_NETWORK_URL || 'http://content-distribution-network:3000',
      healthCheck: '/health',
      rateLimit: {
        windowMs: 15 * 60 * 1000,
        max: 5000 // Highest limit for content delivery
      }
    },
    'security-privacy-framework': {
      path: '/api/security',
      target: process.env.SECURITY_PRIVACY_FRAMEWORK_URL || 'http://security-privacy-framework:3000',
      healthCheck: '/health',
      rateLimit: {
        windowMs: 15 * 60 * 1000,
        max: 100 // Strict limit for security operations
      }
    },
    'compliance-accessibility-excellence': {
      path: '/api/compliance',
      target: process.env.COMPLIANCE_ACCESSIBILITY_EXCELLENCE_URL || 'http://compliance-accessibility-excellence:3000',
      healthCheck: '/health',
      rateLimit: {
        windowMs: 15 * 60 * 1000,
        max: 200 // Limited for compliance operations
      }
    }
  },
  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'https://fanz.network',
      'https://*.fanz.network',
      'https://boyfanz.com',
      'https://girlfanz.com',
      'https://pupfanz.com'
    ],
    credentials: true
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10000 // Global limit per IP
  },
  auth: {
    enabled: process.env.AUTH_ENABLED === 'true',
    jwtSecret: process.env.JWT_SECRET || 'your-super-secure-jwt-secret-key'
  },
  monitoring: {
    enabled: true,
    metricsPath: '/metrics'
  }
};

async function startServer(): Promise<void> {
  try {
    logger.info('Starting FANZ AI Ecosystem API Gateway...', {
      port: config.port,
      services: Object.keys(config.services),
      authEnabled: config.auth.enabled,
      corsOrigins: config.cors.origins.length
    });

    const gateway = new APIGateway(config);
    
    // Setup event listeners for service health monitoring
    gateway.on('serviceHealth', ({ serviceName, healthy }) => {
      if (healthy) {
        logger.info(`Service ${serviceName} is healthy`);
      } else {
        logger.warn(`Service ${serviceName} is unhealthy`);
      }
    });

    await gateway.start();

    logger.info('🚀 FANZ AI Ecosystem API Gateway started successfully!', {
      port: config.port,
      environment: process.env.NODE_ENV || 'development'
    });

    // Log service configuration
    Object.entries(config.services).forEach(([name, service]) => {
      logger.info(`Configured service: ${name}`, {
        path: service.path,
        target: service.target,
        rateLimit: service.rateLimit
      });
    });

    // Health check interval logging
    setInterval(() => {
      const metrics = gateway.getMetrics();
      logger.debug('Gateway metrics', {
        uptime: metrics.uptime,
        memoryUsage: Math.round(metrics.memory.heapUsed / 1024 / 1024) + ' MB',
        servicesHealthy: Object.values(metrics.serviceHealth).filter(Boolean).length,
        totalServices: Object.keys(config.services).length
      });
    }, 60000); // Log every minute

  } catch (error) {
    logger.error('Failed to start API Gateway', { error });
    process.exit(1);
  }
}

// Handle uncaught exceptions and rejections
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
  process.exit(1);
});

// Start the server
if (require.main === module) {
  startServer();
}

export { config, startServer };