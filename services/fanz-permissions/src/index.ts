/**
 * 🔐 FanzPermissions - Enterprise Authorization System
 * 
 * Comprehensive RBAC/ABAC authorization system for the FANZ Unified Ecosystem
 * Supports all 9 platform clusters with fine-grained permissions and policy enforcement
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import Redis from 'ioredis';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { 
  AuthorizationRequest, 
  AuthorizationResult, 
  UserRole, 
  PolicyDocument,
  ValidationResult,
  UserAttributes
} from './types';
import { PolicyEngine } from './policy/engine';
import { RoleManager } from './rbac/roleManager';
import { AttributeStore } from './abac/attributeStore';
import { PermissionCache } from './cache/permissionCache';
import { AuditService } from './audit/auditService';
import { logger } from './utils/logger';
import { metrics } from './monitoring/metrics';

/**
 * FanzPermissions Service - Main Authorization System
 */
export class FanzPermissionsService {
  private app: express.Application;
  private redis: Redis;
  private policyEngine: PolicyEngine;
  private roleManager: RoleManager;
  private attributeStore: AttributeStore;
  private permissionCache: PermissionCache;
  private auditService: AuditService;

  constructor() {
    this.app = express();
    this.initializeRedis();
    this.initializeComponents();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private initializeRedis(): void {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3
    });

    this.redis.on('connect', () => {
      logger.info('Connected to Redis for permission caching');
    });

    this.redis.on('error', (err) => {
      logger.error('Redis connection error:', err);
    });
  }

  private initializeComponents(): void {
    this.policyEngine = new PolicyEngine();
    this.roleManager = new RoleManager();
    this.attributeStore = new AttributeStore();
    this.permissionCache = new PermissionCache(this.redis);
    this.auditService = new AuditService();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true
    }));

    // Rate limiting
    this.app.use(rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // Limit each IP to 1000 requests per windowMs
      message: 'Too many permission requests from this IP'
    }));

    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use((req, res, next) => {
      const startTime = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        logger.info(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
        metrics.recordRequest(req.method, req.path, res.statusCode, duration);
      });
      next();
    });
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'fanz-permissions',
        version: process.env.VERSION || '1.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });

    // Authorization endpoints
    this.app.post('/authorize', this.handleAuthorization.bind(this));
    this.app.post('/batch-authorize', this.handleBatchAuthorization.bind(this));

    // Role management endpoints
    this.app.post('/roles/:userId/assign', this.handleRoleAssignment.bind(this));
    this.app.delete('/roles/:userId/revoke', this.handleRoleRevocation.bind(this));
    this.app.get('/roles/:userId', this.handleGetUserRoles.bind(this));

    // Permission checking endpoints
    this.app.post('/permissions/check', this.handlePermissionCheck.bind(this));
    this.app.post('/permissions/batch-check', this.handleBatchPermissionCheck.bind(this));

    // Attribute management endpoints
    this.app.post('/attributes/:userId', this.handleSetAttribute.bind(this));
    this.app.get('/attributes/:userId', this.handleGetAttributes.bind(this));

    // Policy management endpoints
    this.app.post('/policies/deploy', this.handlePolicyDeploy.bind(this));
    this.app.post('/policies/validate', this.handlePolicyValidate.bind(this));
    this.app.post('/policies/rollback', this.handlePolicyRollback.bind(this));

    // Cluster-specific permission endpoints
    this.app.get('/clusters/:cluster/permissions', this.handleClusterPermissions.bind(this));
    this.app.get('/clusters/:cluster/roles', this.handleClusterRoles.bind(this));

    // Analytics and monitoring
    this.app.get('/analytics/dashboard', this.handleAnalyticsDashboard.bind(this));
    this.app.get('/audit/logs', this.handleAuditLogs.bind(this));

    // Cache management
    this.app.delete('/cache/invalidate', this.handleCacheInvalidation.bind(this));
    this.app.post('/cache/warm', this.handleCacheWarming.bind(this));
  }

  /**
   * Handle authorization requests with comprehensive policy evaluation
   */
  private async handleAuthorization(req: express.Request, res: express.Response): Promise<void> {
    try {
      const authRequest = req.body as AuthorizationRequest;
      const startTime = Date.now();

      // Validate request
      if (!this.validateAuthorizationRequest(authRequest)) {
        res.status(400).json({
          error: 'Invalid authorization request',
          message: 'Missing required fields in authorization request'
        });
        return;
      }

      // Check cache first
      const cacheKey = this.generateCacheKey(authRequest);
      const cachedResult = await this.permissionCache.get(cacheKey);

      if (cachedResult) {
        await this.auditService.logDecision({
          ...cachedResult,
          cached: true,
          evaluation_time_ms: Date.now() - startTime
        });
        res.json(cachedResult);
        return;
      }

      // Evaluate authorization
      const result = await this.evaluate(authRequest);
      const evaluationTime = Date.now() - startTime;

      // Cache positive results for faster future access
      if (result.allowed) {
        await this.permissionCache.set(cacheKey, result, 300); // 5 min TTL
      }

      // Audit logging
      await this.auditService.logDecision({
        ...result,
        evaluation_time_ms: evaluationTime,
        cached: false
      });

      // Metrics
      metrics.recordAuthorization(result.allowed, evaluationTime);

      res.json(result);
    } catch (error) {
      logger.error('Authorization error:', error);
      res.status(500).json({
        error: 'Authorization service error',
        message: 'Internal error during authorization evaluation'
      });
    }
  }

  /**
   * Core authorization evaluation using RBAC/ABAC policies
   */
  public async evaluate(request: AuthorizationRequest): Promise<AuthorizationResult> {
    const startTime = Date.now();
    const decisionId = this.generateDecisionId();

    try {
      // Step 1: Load user roles and attributes
      const userRoles = await this.roleManager.getUserRoles(request.user.id);
      const userAttributes = await this.attributeStore.getUserAttributes(request.user.id);

      // Step 2: Enhance request with loaded data
      const enhancedRequest = {
        ...request,
        user: {
          ...request.user,
          roles: userRoles.map(role => role.name),
          attributes: { ...request.user.attributes, ...userAttributes }
        }
      };

      // Step 3: Policy engine evaluation
      const policyResult = await this.policyEngine.evaluate(enhancedRequest);

      // Step 4: Apply cluster-specific rules
      const clusterResult = await this.applyClusterRules(enhancedRequest, policyResult);

      // Step 5: Final decision
      const result: AuthorizationResult = {
        allowed: clusterResult.allowed,
        reason: clusterResult.reason,
        obligations: clusterResult.obligations,
        advice: clusterResult.advice,
        decision_id: decisionId,
        cached: false
      };

      logger.debug(`Authorization decision ${decisionId}: ${result.allowed ? 'ALLOW' : 'DENY'}`, {
        userId: request.user.id,
        resource: request.resource.type,
        cluster: request.context.cluster,
        evaluation_time_ms: Date.now() - startTime
      });

      return result;

    } catch (error) {
      logger.error(`Authorization evaluation error for decision ${decisionId}:`, error);
      return {
        allowed: false,
        reason: 'Authorization service error',
        decision_id: decisionId,
        cached: false
      };
    }
  }

  /**
   * Apply cluster-specific authorization rules
   */
  private async applyClusterRules(request: AuthorizationRequest, baseResult: any): Promise<any> {
    const cluster = request.context.cluster;
    
    // Get cluster-specific policies
    const clusterPolicies = await this.policyEngine.getClusterPolicies(cluster);
    
    // Apply additional cluster restrictions
    switch (cluster) {
      case 'taboofanz':
        return this.applyTabooFanzRules(request, baseResult);
      case 'boyfanz':
      case 'girlfanz':
        return this.applyGenderSpecificRules(request, baseResult, cluster);
      case 'daddyfanz':
        return this.applyDaddyFanzRules(request, baseResult);
      case 'fanzcock':
        return this.applyFanzCockRules(request, baseResult);
      default:
        return baseResult;
    }
  }

  private async applyTabooFanzRules(request: AuthorizationRequest, baseResult: any): Promise<any> {
    // Enhanced verification required for TabooFanz
    if (!request.user.attributes.enhanced_verification) {
      return {
        allowed: false,
        reason: 'Enhanced verification required for TabooFanz access'
      };
    }

    // Content warnings mandatory
    if (request.resource.type === 'content' && 
        !request.resource.attributes.content_warnings) {
      return {
        allowed: false,
        reason: 'Content warnings required for TabooFanz content'
      };
    }

    return baseResult;
  }

  private async applyGenderSpecificRules(
    request: AuthorizationRequest, 
    baseResult: any, 
    cluster: string
  ): Promise<any> {
    // Apply gender-specific content creation rules
    if (request.action.operation === 'create' && 
        request.resource.type === 'content') {
      
      const expectedGender = cluster === 'boyfanz' ? 'male' : 'female';
      const userGender = request.user.attributes.gender;
      
      if (userGender && userGender !== expectedGender && userGender !== 'non-binary') {
        return {
          ...baseResult,
          advice: [
            ...(baseResult.advice || []),
            {
              type: 'cluster_mismatch',
              message: `Consider using ${expectedGender === 'male' ? 'BoyFanz' : 'GirlFanz'} for optimal audience targeting`
            }
          ]
        };
      }
    }

    return baseResult;
  }

  private async applyDaddyFanzRules(request: AuthorizationRequest, baseResult: any): Promise<any> {
    // Community leadership roles
    if (request.action.operation === 'community:lead') {
      const hasLeadershipRole = request.user.roles.some(role => 
        role.includes('DaddyFanzDom') || role.includes('CommunityLeader')
      );
      
      if (!hasLeadershipRole) {
        return {
          allowed: false,
          reason: 'Community leadership role required for this action'
        };
      }
    }

    return baseResult;
  }

  private async applyFanzCockRules(request: AuthorizationRequest, baseResult: any): Promise<any> {
    // Short-form content restrictions
    if (request.resource.type === 'video' && 
        request.resource.attributes.duration > 60) {
      return {
        allowed: false,
        reason: 'FanzCock videos must be 60 seconds or less'
      };
    }

    return baseResult;
  }

  /**
   * Handle batch authorization for multiple requests
   */
  private async handleBatchAuthorization(req: express.Request, res: express.Response): Promise<void> {
    try {
      const requests = req.body.requests as AuthorizationRequest[];
      
      if (!Array.isArray(requests) || requests.length === 0) {
        res.status(400).json({ error: 'Invalid batch request format' });
        return;
      }

      const results = await Promise.all(
        requests.map(request => this.evaluate(request))
      );

      res.json({ results });
    } catch (error) {
      logger.error('Batch authorization error:', error);
      res.status(500).json({ error: 'Batch authorization failed' });
    }
  }

  /**
   * Handle role assignment
   */
  private async handleRoleAssignment(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { role, cluster, expiresAt } = req.body;

      await this.roleManager.assignRole(userId, role, cluster, expiresAt);
      
      // Clear user's permission cache
      await this.permissionCache.invalidateUser(userId);

      res.json({ success: true, message: 'Role assigned successfully' });
    } catch (error) {
      logger.error('Role assignment error:', error);
      res.status(500).json({ error: 'Failed to assign role' });
    }
  }

  /**
   * Handle role revocation
   */
  private async handleRoleRevocation(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { role, cluster } = req.body;

      await this.roleManager.revokeRole(userId, role, cluster);
      
      // Clear user's permission cache
      await this.permissionCache.invalidateUser(userId);

      res.json({ success: true, message: 'Role revoked successfully' });
    } catch (error) {
      logger.error('Role revocation error:', error);
      res.status(500).json({ error: 'Failed to revoke role' });
    }
  }

  /**
   * Handle permission checking
   */
  private async handlePermissionCheck(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { userId, permission, resource, cluster } = req.body;

      const hasPermission = await this.hasPermission(userId, permission, resource, cluster);

      res.json({ hasPermission });
    } catch (error) {
      logger.error('Permission check error:', error);
      res.status(500).json({ error: 'Permission check failed' });
    }
  }

  /**
   * Check if user has specific permission
   */
  public async hasPermission(
    userId: string, 
    permission: string, 
    resource?: string, 
    cluster?: string
  ): Promise<boolean> {
    try {
      const authRequest: AuthorizationRequest = {
        user: {
          id: userId,
          authenticated: true,
          roles: [],
          attributes: {}
        },
        resource: {
          type: resource || 'unknown',
          cluster: cluster || 'universal',
          attributes: {}
        },
        action: {
          operation: permission
        },
        context: {
          ip_address: '127.0.0.1',
          user_agent: 'permission-check',
          timestamp: Date.now(),
          cluster: cluster || 'universal',
          service: 'fanz-permissions',
          feature_flags: []
        }
      };

      const result = await this.evaluate(authRequest);
      return result.allowed;
    } catch (error) {
      logger.error('Permission check error:', error);
      return false;
    }
  }

  /**
   * Handle analytics dashboard
   */
  private async handleAnalyticsDashboard(req: express.Request, res: express.Response): Promise<void> {
    try {
      const analytics = await this.auditService.getAnalytics();
      res.json(analytics);
    } catch (error) {
      logger.error('Analytics dashboard error:', error);
      res.status(500).json({ error: 'Failed to load analytics' });
    }
  }

  /**
   * Handle cache invalidation
   */
  private async handleCacheInvalidation(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { pattern, userId, cluster } = req.body;

      if (pattern) {
        await this.permissionCache.invalidatePattern(pattern);
      } else if (userId) {
        await this.permissionCache.invalidateUser(userId);
      } else if (cluster) {
        await this.permissionCache.invalidateCluster(cluster);
      } else {
        await this.permissionCache.flush();
      }

      res.json({ success: true, message: 'Cache invalidated successfully' });
    } catch (error) {
      logger.error('Cache invalidation error:', error);
      res.status(500).json({ error: 'Failed to invalidate cache' });
    }
  }

  /**
   * Utility methods
   */
  private validateAuthorizationRequest(request: AuthorizationRequest): boolean {
    return !!(
      request.user?.id &&
      request.resource?.type &&
      request.action?.operation &&
      request.context?.cluster
    );
  }

  private generateCacheKey(request: AuthorizationRequest): string {
    return `perm:${request.user.id}:${request.resource.type}:${request.action.operation}:${request.context.cluster}`;
  }

  private generateDecisionId(): string {
    return `auth-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start the service
   */
  public start(): void {
    const port = process.env.PORT || 3002;
    
    this.app.listen(port, () => {
      logger.info(`🔐 FanzPermissions service running on port ${port}`);
      logger.info(`🚀 Authorization system ready for ${process.env.NODE_ENV || 'development'} environment`);
    });

    // Graceful shutdown
    process.on('SIGTERM', this.shutdown.bind(this));
    process.on('SIGINT', this.shutdown.bind(this));
  }

  private async shutdown(): Promise<void> {
    logger.info('Shutting down FanzPermissions service...');
    
    await this.redis.quit();
    
    process.exit(0);
  }

  // Additional methods for role management, attribute management, etc.
  async assignRole(userId: string, role: string, cluster?: string): Promise<void> {
    return this.roleManager.assignRole(userId, role, cluster);
  }

  async revokeRole(userId: string, role: string, cluster?: string): Promise<void> {
    return this.roleManager.revokeRole(userId, role, cluster);
  }

  async getUserRoles(userId: string): Promise<UserRole[]> {
    return this.roleManager.getUserRoles(userId);
  }

  async setUserAttribute(userId: string, attribute: string, value: any): Promise<void> {
    return this.attributeStore.setUserAttribute(userId, attribute, value);
  }

  async getUserAttributes(userId: string): Promise<UserAttributes> {
    return this.attributeStore.getUserAttributes(userId);
  }

  async deployPolicy(policy: PolicyDocument): Promise<void> {
    return this.policyEngine.deployPolicy(policy);
  }

  async validatePolicy(policy: PolicyDocument): Promise<ValidationResult> {
    return this.policyEngine.validatePolicy(policy);
  }

  async rollbackPolicy(policyId: string, version: string): Promise<void> {
    return this.policyEngine.rollbackPolicy(policyId, version);
  }
}

// Export singleton instance
export const fanzPermissions = new FanzPermissionsService();

// Auto-start if this is the main module
if (require.main === module) {
  fanzPermissions.start();
}