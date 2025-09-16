/**
 * 🛡️ Protected Routes Examples
 * 
 * Examples showing how to protect existing FANZ routes with vendor access middleware
 */

import { Router } from 'express';
import { Logger } from '../utils/logger';

const logger = new Logger('ProtectedRoutes');

/**
 * Example of how to add vendor access protection to your existing routes
 * Call this function from your route files to add protection
 */
export function addVendorAccessProtection(app: any, apiV1: string) {
  const vendorMiddleware = app.locals.vendorAccessMiddleware;
  
  if (!vendorMiddleware) {
    logger.warn('Vendor access middleware not available');
    return;
  }

  // ============================================
  // 💰 PAYMENT ROUTES PROTECTION
  // ============================================
  
  // Protect payment dashboard with payment processing access
  app.get(`${apiV1}/payment/dashboard`,
    vendorMiddleware.requirePaymentAccess,
    (req: any, res: any) => {
      res.json({
        message: 'Payment dashboard data',
        vendor: req.vendor,
        permissions: req.vendorPermissions,
        data: {
          totalTransactions: 12543,
          totalRevenue: 2847392.50,
          activePaymentMethods: ['CCBill', 'Paxum', 'Segpay']
        }
      });
    }
  );

  // Protect payment processing endpoints
  app.post(`${apiV1}/payment/process`,
    vendorMiddleware.requirePermission('payment-processing', 'full'),
    (req: any, res: any) => {
      res.json({
        message: 'Payment processing endpoint',
        vendor: req.vendor.name,
        accessLevel: req.vendorAccessLevel
      });
    }
  );

  // ============================================
  // 📊 CONTENT MODERATION PROTECTION
  // ============================================
  
  // Protect content moderation tools
  app.get(`${apiV1}/content/moderate`,
    vendorMiddleware.requireContentMod,
    (req: any, res: any) => {
      res.json({
        message: 'Content moderation tools access granted',
        vendor: req.vendor,
        pendingContent: [
          { id: 1, type: 'image', status: 'pending_review' },
          { id: 2, type: 'video', status: 'flagged' }
        ]
      });
    }
  );

  app.post(`${apiV1}/content/moderate/:contentId`,
    vendorMiddleware.requirePermission('content-moderation', 'write'),
    (req: any, res: any) => {
      const { contentId } = req.params;
      const { action, reason } = req.body;
      
      res.json({
        message: `Content ${action} action processed`,
        contentId,
        action,
        reason,
        moderatedBy: req.vendor.name
      });
    }
  );

  // ============================================
  // 📈 ANALYTICS ROUTES PROTECTION
  // ============================================
  
  // Protect analytics with read-only access
  app.get(`${apiV1}/analytics/dashboard`,
    vendorMiddleware.requireAnalyticsRead,
    (req: any, res: any) => {
      res.json({
        message: 'Analytics dashboard data',
        vendor: req.vendor,
        data: {
          dailyActiveUsers: 45231,
          monthlyRevenue: 892456.78,
          contentUploads: 1205,
          userGrowth: 12.3
        }
      });
    }
  );

  // Advanced analytics requires full access
  app.get(`${apiV1}/analytics/advanced`,
    vendorMiddleware.requirePermission('analytics-readonly', 'full'),
    (req: any, res: any) => {
      res.json({
        message: 'Advanced analytics data',
        vendor: req.vendor,
        sensitiveData: {
          revenueByCategory: { adult: 75, gaming: 15, social: 10 },
          userBehaviorPatterns: 'detailed_analysis_data',
          predictiveMetrics: 'ml_model_predictions'
        }
      });
    }
  );

  // ============================================
  // 👥 USER MANAGEMENT PROTECTION
  // ============================================
  
  // Protect user management with support access
  app.get(`${apiV1}/users/support`,
    vendorMiddleware.requireSupportAccess,
    (req: any, res: any) => {
      res.json({
        message: 'User support tools access',
        vendor: req.vendor,
        supportTickets: [
          { id: 1, user: 'user123', issue: 'payment_issue', priority: 'high' },
          { id: 2, user: 'user456', issue: 'content_upload', priority: 'medium' }
        ]
      });
    }
  );

  // Admin user management requires admin access
  app.get(`${apiV1}/users/admin`,
    vendorMiddleware.requireAdmin,
    (req: any, res: any) => {
      res.json({
        message: 'Admin user management access',
        vendor: req.vendor,
        adminTools: {
          userActions: ['suspend', 'verify', 'delete'],
          bulkOperations: true,
          auditLogs: true
        }
      });
    }
  );

  // ============================================
  // 🏦 FINANCIAL REPORTS PROTECTION
  // ============================================
  
  // Protect financial reports
  app.get(`${apiV1}/financial/reports`,
    vendorMiddleware.requirePermission('financial-reports', 'read'),
    (req: any, res: any) => {
      res.json({
        message: 'Financial reports access',
        vendor: req.vendor,
        reports: {
          monthly: 'financial_summary_march_2024.pdf',
          quarterly: 'q1_2024_report.pdf',
          annual: 'annual_report_2023.pdf'
        }
      });
    }
  );

  // ============================================
  // 🔧 SYSTEM MONITORING PROTECTION
  // ============================================
  
  // Protect system monitoring
  app.get(`${apiV1}/system/monitoring`,
    vendorMiddleware.requirePermission('system-monitoring', 'read'),
    (req: any, res: any) => {
      res.json({
        message: 'System monitoring access',
        vendor: req.vendor,
        metrics: {
          cpuUsage: '45%',
          memoryUsage: '62%',
          diskSpace: '78%',
          networkTraffic: '1.2GB/s',
          activeConnections: 15420
        }
      });
    }
  );

  logger.info('Vendor access protection applied to existing routes');
}

/**
 * Example middleware factory for custom route protection
 */
export function createCustomVendorProtection(app: any) {
  const vendorMiddleware = app.locals.vendorAccessMiddleware;
  
  if (!vendorMiddleware) {
    return (req: any, res: any, next: any) => next();
  }

  return {
    // Custom protection for sensitive operations
    requireHighSecurity: [
      vendorMiddleware.requireAdmin,
      (req: any, res: any, next: any) => {
        // Additional security checks for high-risk operations
        const riskScore = req.vendorSession?.riskScore || 0;
        if (riskScore > 5) {
          return res.status(403).json({
            error: 'Access denied due to high risk score',
            riskScore,
            message: 'Contact administrator for manual approval'
          });
        }
        next();
      }
    ],

    // Protection for time-sensitive operations
    requireRecentAuth: [
      vendorMiddleware.authenticate,
      (req: any, res: any, next: any) => {
        const sessionStart = new Date(req.vendorSession?.startTime);
        const hoursSinceStart = (Date.now() - sessionStart.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceStart > 4) { // Require fresh auth after 4 hours
          return res.status(403).json({
            error: 'Recent authentication required',
            hoursSinceAuth: Math.round(hoursSinceStart),
            message: 'Please re-authenticate for this sensitive operation'
          });
        }
        next();
      }
    ],

    // Protection with IP verification
    requireTrustedIP: [
      vendorMiddleware.authenticate,
      (req: any, res: any, next: any) => {
        const allowedIPs = req.vendorGrant?.restrictions?.ipWhitelist || [];
        const clientIP = req.ip;
        
        if (allowedIPs.length > 0 && !allowedIPs.includes('*') && !allowedIPs.includes(clientIP)) {
          return res.status(403).json({
            error: 'Access denied from this IP address',
            clientIP,
            allowedIPs: allowedIPs.filter(ip => ip !== '*').map(ip => ip.replace(/\d+\.\d+$/, 'x.x'))
          });
        }
        next();
      }
    ]
  };
}

/**
 * Example of adding audit logging to protected routes
 */
export function auditProtectedRoute(routeName: string) {
  return (req: any, res: any, next: any) => {
    if (req.vendor) {
      // Log vendor access
      logger.info(`Vendor route access: ${routeName}`, {
        vendorId: req.vendor.id,
        vendorName: req.vendor.name,
        route: routeName,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      });
    }
    next();
  };
}

export default {
  addVendorAccessProtection,
  createCustomVendorProtection,
  auditProtectedRoute
};