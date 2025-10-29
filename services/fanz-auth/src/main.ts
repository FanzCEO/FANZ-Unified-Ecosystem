/**
 * 🚀 FanzAuth - Unified Identity and User Management Service
 * 
 * Central IdP with OIDC/OAuth2, sessions, 2FA, WebAuthn, device login
 * Unified user/creator/moderator/admin across all platform clusters
 * Cross-cluster SSO via shared OIDC provider and session federation
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from './config/environment';
import { logger } from './utils/logger';
import { DatabaseService } from './services/DatabaseService';
import { AuthService } from './services/AuthService';
import { OIDCService } from './services/OIDCService';
import { SessionService } from './services/SessionService';
import { TwoFactorService } from './services/TwoFactorService';
import { WebAuthnService } from './services/WebAuthnService';
import { SCIMService } from './services/SCIMService';
import { FederationService } from './services/FederationService';
import { authRoutes } from './routes/authRoutes';
import { oidcRoutes } from './routes/oidcRoutes';
import { sessionRoutes } from './routes/sessionRoutes';
import { adminRoutes } from './routes/adminRoutes';
import { scimRoutes } from './routes/scimRoutes';
import { healthRoutes } from './routes/healthRoutes';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { authMiddleware } from './middleware/authMiddleware';

export class FanzAuthService {
  private app: express.Application;
  private databaseService: DatabaseService;
  private authService: AuthService;
  private oidcService: OIDCService;
  private sessionService: SessionService;
  private twoFactorService: TwoFactorService;
  private webAuthnService: WebAuthnService;
  private scimService: SCIMService;
  private federationService: FederationService;

  constructor() {
    this.app = express();
    this.initializeServices();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeServices(): void {
    logger.info('🔧 Initializing FanzAuth services...');
    
    this.databaseService = new DatabaseService(config.database);
    this.sessionService = new SessionService(config.redis);
    this.authService = new AuthService(this.databaseService, this.sessionService);
    this.oidcService = new OIDCService(config.oidc, this.authService);
    this.twoFactorService = new TwoFactorService(this.databaseService);
    this.webAuthnService = new WebAuthnService(config.webauthn);
    this.scimService = new SCIMService(this.databaseService);
    this.federationService = new FederationService(config.federation, this.authService);

    logger.info('✅ FanzAuth services initialized');
  }

  private initializeMiddleware(): void {
    // Security middleware
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
      crossOriginEmbedderPolicy: false,
    }));

    // CORS configuration for cross-cluster communication
    this.app.use(cors({
      origin: config.auth.allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    }));

    // Compression and parsing
    this.app.use(compression());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Rate limiting
    this.app.use(rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.maxRequests,
      message: 'Too many requests from this IP',
      standardHeaders: true,
      legacyHeaders: false,
    }));

    // Request logging
    this.app.use(requestLogger);

    // Authentication middleware (applied selectively)
    this.app.use('/api/auth/protected', authMiddleware(this.authService));
    this.app.use('/api/admin', authMiddleware(this.authService, ['admin']));
  }

  private initializeRoutes(): void {
    logger.info('🛣️  Initializing routes...');

    // Health and status endpoints
    this.app.use('/health', healthRoutes);
    
    // Core authentication endpoints
    this.app.use('/api/auth', authRoutes(this.authService, this.twoFactorService, this.webAuthnService));
    
    // OIDC/OAuth2 endpoints
    this.app.use('/api/oidc', oidcRoutes(this.oidcService));
    
    // Session management
    this.app.use('/api/sessions', sessionRoutes(this.sessionService));
    
    // SCIM provisioning for CreatorCRM integration
    this.app.use('/api/scim', scimRoutes(this.scimService));
    
    // Admin endpoints
    this.app.use('/api/admin', adminRoutes(this.authService, this.federationService));

    // OpenID Configuration
    this.app.get('/.well-known/openid-configuration', (req, res) => {
      res.json(this.oidcService.getOpenIDConfiguration());
    });

    // JWKS endpoint
    this.app.get('/.well-known/jwks.json', (req, res) => {
      res.json(this.oidcService.getJWKS());
    });

    logger.info('✅ Routes initialized');
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      // Initialize database connection
      await this.databaseService.connect();
      logger.info('📊 Database connected');

      // Initialize OIDC service
      await this.oidcService.initialize();
      logger.info('🔑 OIDC service initialized');

      // Start server
      const port = config.server.port || 3001;
      this.app.listen(port, () => {
        logger.info(`🚀 FanzAuth service running on port ${port}`);
        logger.info(`📖 OpenID Configuration: http://localhost:${port}/.well-known/openid-configuration`);
        logger.info(`🔑 JWKS Endpoint: http://localhost:${port}/.well-known/jwks.json`);
        logger.info('🎯 Platform Clusters Supported:');
        logger.info('  • FanzLab (Universal Portal)');
        logger.info('  • BoyFanz (Male Creators)');
        logger.info('  • GirlFanz (Female Creators)');
        logger.info('  • DaddyFanz (Dom/Sub Community)');
        logger.info('  • PupFanz (Pup Community)');
        logger.info('  • TabooFanz (Extreme Content)');
        logger.info('  • TransFanz (Trans Creators)');
        logger.info('  • CougarFanz (Mature Creators)');
        logger.info('  • FanzCock (Adult TikTok)');
      });
    } catch (error) {
      logger.error('❌ Failed to start FanzAuth service:', error);
      process.exit(1);
    }
  }

  public async stop(): Promise<void> {
    logger.info('🛑 Stopping FanzAuth service...');
    
    // Close database connection
    await this.databaseService.disconnect();
    
    logger.info('✅ FanzAuth service stopped gracefully');
  }
}

// Initialize and start the service
const fanzAuth = new FanzAuthService();

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  await fanzAuth.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await fanzAuth.stop();
  process.exit(0);
});

// Start the service
fanzAuth.start();