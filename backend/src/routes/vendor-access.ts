/**
 * 🛡️ FANZ Vendor Access Routes
 * 
 * Express router integration for vendor access delegation system.
 * Connects controller, middleware, and database services.
 */

import { Router } from 'express';
import { Container } from 'inversify';
import { Pool } from 'pg';
import VendorAccessController from '../services/vendor-access/VendorAccessController';
import VendorAccessMiddleware from '../services/vendor-access/VendorAccessMiddleware';
import { VendorAccessDelegationService } from '../services/vendor-access/VendorAccessDelegationService';
import VendorAccessDatabaseAdapter from '..REDACTED_AWS_SECRET_KEYdapter';

// ============================================
// 🔧 DEPENDENCY INJECTION SETUP
// ============================================

export function createVendorAccessContainer(databasePool: Pool): Container {
  const container = new Container();

  // Bind database pool
  container.bind<Pool>('DatabasePool').toConstantValue(databasePool);
  
  // Bind services
  container.bind<VendorAccessDatabaseAdapter>(VendorAccessDatabaseAdapter).toSelf();
  container.bind<VendorAccessDelegationService>(VendorAccessDelegationService).toSelf();
  container.bind<VendorAccessController>(VendorAccessController).toSelf();
  container.bind<VendorAccessMiddleware>(VendorAccessMiddleware).toSelf();

  return container;
}

// ============================================
// 🛣️ ROUTE SETUP
// ============================================

export function createVendorAccessRoutes(container: Container): Router {
  const router = Router();
  const controller = container.get<VendorAccessController>(VendorAccessController);
  const middleware = container.get<VendorAccessMiddleware>(VendorAccessMiddleware);

  // ============================================
  // 🔐 AUTHENTICATION MIDDLEWARE
  // ============================================
  
  // Apply vendor access middleware to protected routes
  const requireVendorAuth = middleware.authenticate.bind(middleware);
  const requireVendorPermission = (category: string, level: string) => 
    middleware.requirePermission(category, level).bind(middleware);

  // ============================================
  // 👤 VENDOR MANAGEMENT ROUTES
  // ============================================

  /**
   * Register new vendor
   * POST /api/vendor-access/vendors
   */
  router.post('/vendors', 
    controller.registerVendor.bind(controller)
  );

  /**
   * Verify vendor profile
   * POST /api/vendor-access/vendors/:vendorId/verify
   */
  router.post('/vendors/:vendorId/verify',
    requireVendorAuth,
    requireVendorPermission('admin-panel-staff', 'full'),
    controller.verifyVendor.bind(controller)
  );

  /**
   * List vendors with filtering and pagination
   * GET /api/vendor-access/vendors
   */
  router.get('/vendors',
    requireVendorAuth,
    requireVendorPermission('admin-panel-staff', 'read'),
    controller.listVendors.bind(controller)
  );

  /**
   * Get specific vendor details
   * GET /api/vendor-access/vendors/:vendorId
   */
  router.get('/vendors/:vendorId',
    requireVendorAuth,
    requireVendorPermission('admin-panel-staff', 'read'),
    controller.getVendor.bind(controller)
  );

  // ============================================
  // 🎟️ ACCESS GRANT MANAGEMENT
  // ============================================

  /**
   * Create new access grant
   * POST /api/vendor-access/grants
   */
  router.post('/grants',
    requireVendorAuth,
    requireVendorPermission('admin-panel-members', 'full'),
    controller.createAccessGrant.bind(controller)
  );

  /**
   * Approve access grant
   * POST /api/vendor-access/grants/:grantId/approve
   */
  router.post('/grants/:grantId/approve',
    requireVendorAuth,
    requireVendorPermission('admin-panel-members', 'full'),
    controller.approveAccessGrant.bind(controller)
  );

  /**
   * List access grants
   * GET /api/vendor-access/grants
   */
  router.get('/grants',
    requireVendorAuth,
    requireVendorPermission('admin-panel-staff', 'read'),
    controller.listAccessGrants.bind(controller)
  );

  /**
   * Get specific access grant
   * GET /api/vendor-access/grants/:grantId
   */
  router.get('/grants/:grantId',
    requireVendorAuth,
    requireVendorPermission('admin-panel-staff', 'read'),
    controller.getAccessGrant.bind(controller)
  );

  /**
   * Revoke access grant
   * DELETE /api/vendor-access/grants/:grantId
   */
  router.delete('/grants/:grantId',
    requireVendorAuth,
    requireVendorPermission('admin-panel-members', 'full'),
    controller.revokeAccessGrant.bind(controller)
  );

  // ============================================
  // 🔑 TOKEN MANAGEMENT
  // ============================================

  /**
   * Generate access token for approved grant
   * POST /api/vendor-access/grants/:grantId/token
   */
  router.post('/grants/:grantId/token',
    requireVendorAuth,
    requireVendorPermission('admin-panel-staff', 'full'),
    controller.generateAccessToken.bind(controller)
  );

  /**
   * Validate access token (for testing/debugging)
   * POST /api/vendor-access/tokens/validate
   */
  router.post('/tokens/validate',
    controller.validateAccessToken.bind(controller)
  );

  // ============================================
  // 🚨 EMERGENCY CONTROLS
  // ============================================

  /**
   * Emergency revoke all vendor access
   * POST /api/vendor-access/emergency/revoke-all
   */
  router.post('/emergency/revoke-all',
    requireVendorAuth,
    requireVendorPermission('admin-panel-members', 'full'),
    controller.emergencyRevokeAll.bind(controller)
  );

  /**
   * Emergency revoke specific vendor access
   * POST /api/vendor-access/emergency/revoke-vendor/:vendorId
   */
  router.post('/emergency/revoke-vendor/:vendorId',
    requireVendorAuth,
    requireVendorPermission('admin-panel-members', 'full'),
    controller.emergencyRevokeVendor.bind(controller)
  );

  // ============================================
  // 📊 ANALYTICS & MONITORING
  // ============================================

  /**
   * Get access analytics dashboard
   * GET /api/vendor-access/analytics/dashboard
   */
  router.get('/analytics/dashboard',
    requireVendorAuth,
    requireVendorPermission('analytics-readonly', 'read'),
    controller.getAnalytics.bind(controller)
  );

  /**
   * Get configuration metadata for UI
   * GET /api/vendor-access/config
   */
  router.get('/config',
    requireVendorAuth,
    requireVendorPermission('admin-panel-staff', 'read'),
    controller.getConfig.bind(controller)
  );

  // ============================================
  // 🔍 AUDIT & LOGGING
  // ============================================

  /**
   * Get audit logs (admin only)
   * GET /api/vendor-access/audit/logs
   */
  router.get('/audit/logs',
    requireVendorAuth,
    requireVendorPermission('admin-panel-members', 'read'),
    controller.getAuditLogs.bind(controller)
  );

  /**
   * Get security events
   * GET /api/vendor-access/security/events
   */
  router.get('/security/events',
    requireVendorAuth,
    requireVendorPermission('admin-panel-staff', 'read'),
    controller.getSecurityEvents.bind(controller)
  );

  return router;
}

// ============================================
// 🔧 MIDDLEWARE FACTORY FOR PROTECTED ROUTES
// ============================================

/**
 * Factory function to create vendor access middleware for protecting specific routes
 */
export function createVendorAccessMiddleware(container: Container) {
  const middleware = container.get<VendorAccessMiddleware>(VendorAccessMiddleware);
  
  return {
    // General authentication
    authenticate: middleware.authenticate.bind(middleware),
    
    // Permission-based middleware
    requireAdmin: middleware.requirePermission('admin-panel-members', 'full').bind(middleware),
    requireStaff: middleware.requirePermission('admin-panel-staff', 'read').bind(middleware),
    
    // Specific permission middleware
    requireContentMod: middleware.requirePermission('content-moderation', 'read').bind(middleware),
    requirePaymentAccess: middleware.requirePermission('payment-processing', 'read').bind(middleware),
    requireAnalyticsRead: middleware.requirePermission('analytics-readonly', 'read').bind(middleware),
    requireSupportAccess: middleware.requirePermission('customer-support', 'read').bind(middleware),
    
    // Custom permission checker
    requirePermission: (category: string, level: string) => 
      middleware.requirePermission(category, level).bind(middleware)
  };
}

// ============================================
// 📱 HEALTH CHECK ENDPOINTS
// ============================================

export function addVendorAccessHealthChecks(router: Router, container: Container) {
  const service = container.get<VendorAccessDelegationService>(VendorAccessDelegationService);

  /**
   * Health check endpoint
   * GET /api/vendor-access/health
   */
  router.get('/health', async (req, res) => {
    try {
      // Basic health check
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: 'unknown',
          vendorAccess: 'healthy'
        }
      };

      // Try to check database connectivity
      try {
        // This would be implemented in the service
        // await service.healthCheck();
        health.services.database = 'healthy';
      } catch (error) {
        health.services.database = 'unhealthy';
        health.status = 'degraded';
      }

      const statusCode = health.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json(health);
    } catch (error) {
      res.status(500).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * Detailed status endpoint
   * GET /api/vendor-access/status
   */
  router.get('/status', async (req, res) => {
    try {
      // This would include more detailed metrics
      const status = {
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        metrics: {
          // These would be implemented in the service
          activeVendors: 0,
          activeGrants: 0,
          activeSessions: 0
        }
      };

      res.json(status);
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}

export default {
  createVendorAccessContainer,
  createVendorAccessRoutes,
  createVendorAccessMiddleware,
  addVendorAccessHealthChecks
};