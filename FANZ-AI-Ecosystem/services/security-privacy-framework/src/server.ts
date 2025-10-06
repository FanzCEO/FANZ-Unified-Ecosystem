import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';
import winston from 'winston';
import dotenv from 'dotenv';

// Security and Privacy Services
import { SecurityManager } from './core/SecurityManager';
import { AuthenticationService } from './core/AuthenticationService';
import { EncryptionService } from './core/EncryptionService';
import { PrivacyManager } from './core/PrivacyManager';
import { FraudDetector } from './fraud/FraudDetector';
import { ComplianceReporter } from './compliance/ComplianceReporter';
import { SecurityMonitor } from './monitoring/SecurityMonitor';

// Route handlers
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import cryptoRoutes from './routes/crypto';
import fraudRoutes from './routes/fraud';
import privacyRoutes from './routes/privacy';
import complianceRoutes from './routes/compliance';
import monitoringRoutes from './routes/monitoring';

// Middleware
import { errorHandler } from './middleware/errorHandler';
import { securityLogger } from './middleware/securityLogger';
import { authMiddleware } from './middleware/authMiddleware';
import { rateLimiter } from './middleware/rateLimiter';
import { validationMiddleware } from './middleware/validation';

// Types
import { SecurityConfiguration, SecurityLevel } from './types';

// Load environment variables
dotenv.config();

class SecurityPrivacyServer {
  private app: Application;
  private logger: winston.Logger;
  private securityManager: SecurityManager;
  private authService: AuthenticationService;
  private encryptionService: EncryptionService;
  private privacyManager: PrivacyManager;
  private fraudDetector: FraudDetector;
  private complianceReporter: ComplianceReporter;
  private securityMonitor: SecurityMonitor;
  private config: SecurityConfiguration;

  constructor() {
    this.app = express();
    this.initializeLogger();
    this.initializeConfiguration();
    this.initializeServices();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeLogger(): void {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: 'fanz-security-framework' },
      transports: [
        new winston.transports.File({ 
          filename: 'logs/security-error.log', 
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 10
        }),
        new winston.transports.File({ 
          filename: 'logs/security-combined.log',
          maxsize: 5242880, // 5MB
          maxFiles: 10
        }),
        new winston.transports.Console({
          format: winston.format.simple()
        })
      ]
    });

    // Handle uncaught exceptions and unhandled rejections
    this.logger.exceptions.handle(
      new winston.transports.File({ filename: 'logs/exceptions.log' })
    );

    this.logger.rejections.handle(
      new winston.transports.File({ filename: 'logs/rejections.log' })
    );
  }

  private initializeConfiguration(): void {
    this.config = {
      global: {
        securityLevel: (process.env.SECURITY_LEVEL as SecurityLevel) || 'standard',
        zeroTrustMode: process.env.ZERO_TRUST_MODE === 'true',
        defaultEncryption: process.env.ENCRYPTION_LEVEL || 'standard',
        sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '3600'),
        maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
        accountLockoutDuration: parseInt(process.env.ACCOUNT_LOCKOUT_DURATION || '300'),
        passwordPolicy: {
          minLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '12'),
          requireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE !== 'false',
          requireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE !== 'false',
          requireNumbers: process.env.PASSWORD_REQUIRE_NUMBERS !== 'false',
          requireSpecialChars: process.env.PASSWORD_REQUIRE_SPECIAL !== 'false',
          preventReuse: parseInt(process.env.PASSWORD_PREVENT_REUSE || '12'),
          maxAge: parseInt(process.env.PASSWORD_MAX_AGE || '90'),
          complexityScore: parseInt(process.env.PASSWORD_COMPLEXITY_SCORE || '80')
        },
        dataRetentionDays: parseInt(process.env.DATA_RETENTION_DAYS || '90'),
        auditLogRetentionDays: parseInt(process.env.AUDIT_LOG_RETENTION_DAYS || '2555')
      },
      authentication: {
        requireMFA: process.env.REQUIRE_MFA === 'true',
        allowBiometric: process.env.ALLOW_BIOMETRIC !== 'false',
        allowHardwareKeys: process.env.ALLOW_HARDWARE_KEYS !== 'false',
        allowSocialLogin: process.env.ALLOW_SOCIAL_LOGIN === 'true',
        sessionConcurrencyLimit: parseInt(process.env.SESSION_CONCURRENCY_LIMIT || '5'),
        deviceTrustDuration: parseInt(process.env.DEVICE_TRUST_DURATION || '30'),
        locationBasedSecurity: process.env.LOCATION_BASED_SECURITY === 'true',
        behavioralAnalysis: process.env.BEHAVIORAL_ANALYSIS === 'true'
      },
      encryption: {
        algorithm: process.env.ENCRYPTION_ALGORITHM || 'AES-256-GCM',
        keySize: parseInt(process.env.KEY_SIZE || '256'),
        keyRotationDays: parseInt(process.env.KEY_ROTATION_DAYS || '90'),
        endToEndEncryption: process.env.E2E_ENCRYPTION !== 'false',
        localEncryption: process.env.LOCAL_ENCRYPTION !== 'false',
        backupEncryption: process.env.BACKUP_ENCRYPTION !== 'false'
      },
      privacy: {
        profileVisibility: 'private',
        searchable: false,
        showOnlineStatus: false,
        allowDirectMessages: true,
        allowLocationSharing: false,
        dataMinimization: true,
        automaticDeletion: true,
        encryptionRequired: true
      },
      compliance: {
        enableGDPR: process.env.GDPR_COMPLIANCE_MODE === 'true',
        enableCCPA: process.env.CCPA_COMPLIANCE_MODE === 'true',
        enableHIPAA: process.env.HIPAA_COMPLIANCE_MODE === 'true',
        dataProcessingBasis: ['consent', 'legitimate_interest', 'contract'],
        consentManagement: true,
        dataPortability: true,
        rightToErasure: true,
        auditTrail: true
      },
      monitoring: {
        enableRealTimeMonitoring: process.env.REAL_TIME_MONITORING !== 'false',
        enableAnomalyDetection: process.env.ANOMALY_DETECTION !== 'false',
        enableThreatIntelligence: process.env.THREAT_INTELLIGENCE === 'true',
        alertThresholds: {
          failedLogins: parseInt(process.env.ALERT_FAILED_LOGINS || '5'),
          unusualLocations: parseInt(process.env.ALERT_UNUSUAL_LOCATIONS || '3'),
          dataAccess: parseInt(process.env.ALERT_DATA_ACCESS || '100'),
          privilegedActions: parseInt(process.env.ALERT_PRIVILEGED_ACTIONS || '10')
        },
        retentionPeriod: parseInt(process.env.MONITORING_RETENTION_DAYS || '365')
      },
      incident: {
        autoResponse: process.env.AUTO_INCIDENT_RESPONSE === 'true',
        escalationRules: [],
        notificationChannels: (process.env.NOTIFICATION_CHANNELS || 'email,slack').split(','),
        quarantineThreshold: parseInt(process.env.QUARANTINE_THRESHOLD || '90'),
        forensicsEnabled: process.env.FORENSICS_ENABLED === 'true'
      }
    };
  }

  private async initializeServices(): Promise<void> {
    try {
      this.logger.info('Initializing security services...');

      // Initialize core services
      this.securityManager = new SecurityManager(this.config, this.logger);
      this.authService = new AuthenticationService(this.config, this.logger);
      this.encryptionService = new EncryptionService(this.config, this.logger);
      this.privacyManager = new PrivacyManager(this.config, this.logger);
      this.fraudDetector = new FraudDetector(this.config, this.logger);
      this.complianceReporter = new ComplianceReporter(this.config, this.logger);
      this.securityMonitor = new SecurityMonitor(this.config, this.logger);

      // Initialize all services
      await Promise.all([
        this.securityManager.initialize(),
        this.authService.initialize(),
        this.encryptionService.initialize(),
        this.privacyManager.initialize(),
        this.fraudDetector.initialize(),
        this.complianceReporter.initialize(),
        this.securityMonitor.initialize()
      ]);

      this.logger.info('All security services initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize security services:', error);
      process.exit(1);
    }
  }

  private initializeMiddleware(): void {
    // Basic security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: true,
      crossOriginOpenerPolicy: true,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      dnsPrefetchControl: true,
      frameguard: { action: 'deny' },
      hidePoweredBy: true,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      },
      ieNoOpen: true,
      noSniff: true,
      originAgentCluster: true,
      permittedCrossDomainPolicies: false,
      referrerPolicy: { policy: 'no-referrer' },
      xssFilter: true
    }));

    // CORS configuration
    this.app.use(cors({
      origin: this.getAllowedOrigins(),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
      exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset']
    }));

    // Compression
    this.app.use(compression());

    // Body parsing with size limits
    this.app.use(express.json({ 
      limit: '10mb',
      verify: (req: any, res: any, buf: Buffer) => {
        req.rawBody = buf;
      }
    }));
    this.app.use(express.urlencoded({ 
      extended: true, 
      limit: '10mb' 
    }));

    // Security logging middleware
    this.app.use(securityLogger(this.logger));

    // Rate limiting
    this.app.use(rateLimiter);

    // Global authentication middleware (excludes public endpoints)
    this.app.use('/api', authMiddleware(this.authService));

    // Request validation middleware
    this.app.use(validationMiddleware);

    // Trust proxy for correct IP detection
    this.app.set('trust proxy', 1);
  }

  private getAllowedOrigins(): string[] {
    const origins = process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001';
    return origins.split(',').map(origin => origin.trim());
  }

  private initializeRoutes(): void {
    // Health check endpoint (public)
    this.app.get('/api/health', (req: Request, res: Response) => {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        services: {
          securityManager: this.securityManager.isHealthy(),
          authService: this.authService.isHealthy(),
          encryptionService: this.encryptionService.isHealthy(),
          privacyManager: this.privacyManager.isHealthy(),
          fraudDetector: this.fraudDetector.isHealthy(),
          complianceReporter: this.complianceReporter.isHealthy(),
          securityMonitor: this.securityMonitor.isHealthy()
        }
      });
    });

    // Security info endpoint (public, limited info)
    this.app.get('/api/security/info', (req: Request, res: Response) => {
      res.status(200).json({
        securityLevel: this.config.global.securityLevel,
        encryptionEnabled: true,
        mfaSupported: this.config.authentication.requireMFA,
        biometricSupported: this.config.authentication.allowBiometric,
        complianceEnabled: {
          gdpr: this.config.compliance.enableGDPR,
          ccpa: this.config.compliance.enableCCPA,
          hipaa: this.config.compliance.enableHIPAA
        },
        lastUpdated: new Date().toISOString()
      });
    });

    // Protected API routes
    this.app.use('/api/v1/auth', authRoutes(this.authService, this.logger));
    this.app.use('/api/v1/users', userRoutes(this.authService, this.logger));
    this.app.use('/api/v1/crypto', cryptoRoutes(this.encryptionService, this.logger));
    this.app.use('/api/v1/fraud', fraudRoutes(this.fraudDetector, this.logger));
    this.app.use('/api/v1/privacy', privacyRoutes(this.privacyManager, this.logger));
    this.app.use('/api/v1/compliance', complianceRoutes(this.complianceReporter, this.logger));
    this.app.use('/api/v1/monitor', monitoringRoutes(this.securityMonitor, this.logger));

    // Catch-all for undefined routes
    this.app.use('*', (req: Request, res: Response) => {
      this.logger.warn(`Undefined route accessed: ${req.method} ${req.originalUrl}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      res.status(404).json({
        success: false,
        error: {
          code: 'ROUTE_NOT_FOUND',
          message: 'The requested endpoint does not exist',
          timestamp: new Date().toISOString(),
          path: req.originalUrl,
          method: req.method
        }
      });
    });
  }

  private initializeErrorHandling(): void {
    // Global error handler
    this.app.use(errorHandler(this.logger));

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      this.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      // Close server gracefully
      this.gracefulShutdown();
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      this.logger.error('Uncaught Exception:', error);
      // Close server gracefully
      this.gracefulShutdown();
    });

    // Graceful shutdown handlers
    process.on('SIGTERM', this.gracefulShutdown.bind(this));
    process.on('SIGINT', this.gracefulShutdown.bind(this));
  }

  private async gracefulShutdown(): Promise<void> {
    this.logger.info('Starting graceful shutdown...');

    try {
      // Stop accepting new connections
      if (this.server) {
        await new Promise<void>((resolve, reject) => {
          this.server.close((err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        });
      }

      // Cleanup services
      await Promise.all([
        this.securityManager.shutdown(),
        this.authService.shutdown(),
        this.encryptionService.shutdown(),
        this.privacyManager.shutdown(),
        this.fraudDetector.shutdown(),
        this.complianceReporter.shutdown(),
        this.securityMonitor.shutdown()
      ]);

      this.logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      this.logger.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  }

  private server: any;

  public async start(port: number = parseInt(process.env.PORT || '3013')): Promise<void> {
    try {
      this.server = this.app.listen(port, () => {
        this.logger.info(`FANZ Security & Privacy Framework server running on port ${port}`);
        this.logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
        this.logger.info(`Security Level: ${this.config.global.securityLevel}`);
        this.logger.info(`Zero Trust Mode: ${this.config.global.zeroTrustMode ? 'Enabled' : 'Disabled'}`);
        this.logger.info(`Encryption Level: ${this.config.global.defaultEncryption}`);
        this.logger.info('All security services active and monitoring');
      });

      // Start security monitoring
      await this.securityMonitor.startMonitoring();

    } catch (error) {
      this.logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  public getApp(): Application {
    return this.app;
  }

  public getLogger(): winston.Logger {
    return this.logger;
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  const server = new SecurityPrivacyServer();
  server.start();
}

export default SecurityPrivacyServer;