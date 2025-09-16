/**
 * 🛡️ FANZ Vendor Access Middleware
 * 
 * Express middleware to enforce category-based vendor permissions
 * across all FANZ platform endpoints with real-time validation.
 */

import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'inversify';
import VendorAccessDelegationService, { AccessCategory, AccessLevel } from '../services/vendor-access/VendorAccessDelegationService';
import { AuditLogger } from '../services/security/AuditLogger';
import { FanzDashSecurityCenter } from '..REDACTED_AWS_SECRET_KEYr';

// ============================================
// 🏷️ ROUTE PERMISSION MAPPINGS
// ============================================

interface RoutePermission {
  category: AccessCategory;
  level: AccessLevel;
  description: string;
}

export const ROUTE_PERMISSIONS: Record<string, RoutePermission> = {
  // ============================================
  // 👥 ADMIN PANEL - MEMBERS
  // ============================================
  'GET /admin/members': {
    category: AccessCategory.ADMIN_PANEL_MEMBERS,
    level: AccessLevel.READ_ONLY,
    description: 'View member list and profiles'
  },
  'POST /admin/members/search': {
    category: AccessCategory.ADMIN_PANEL_MEMBERS,
    level: AccessLevel.READ_ONLY,
    description: 'Search member database'
  },
  'PUT /admin/members/:id': {
    category: AccessCategory.ADMIN_PANEL_MEMBERS,
    level: AccessLevel.READ_WRITE,
    description: 'Update member profile'
  },
  'DELETE /admin/members/:id': {
    category: AccessCategory.ADMIN_PANEL_MEMBERS,
    level: AccessLevel.ADMIN,
    description: 'Delete member account'
  },
  'POST /admin/members/:id/suspend': {
    category: AccessCategory.ADMIN_PANEL_MEMBERS,
    level: AccessLevel.ADMIN,
    description: 'Suspend member account'
  },

  // ============================================
  // 👨‍💼 ADMIN PANEL - STAFF
  // ============================================
  'GET /admin/staff': {
    category: AccessCategory.ADMIN_PANEL_STAFF,
    level: AccessLevel.READ_ONLY,
    description: 'View staff list and roles'
  },
  'POST /admin/staff': {
    category: AccessCategory.ADMIN_PANEL_STAFF,
    level: AccessLevel.ADMIN,
    description: 'Create new staff account'
  },
  'PUT /admin/staff/:id/roles': {
    category: AccessCategory.ADMIN_PANEL_STAFF,
    level: AccessLevel.ADMIN,
    description: 'Update staff roles and permissions'
  },
  'DELETE /admin/staff/:id': {
    category: AccessCategory.ADMIN_PANEL_STAFF,
    level: AccessLevel.ADMIN,
    description: 'Remove staff account'
  },

  // ============================================
  // 📝 CONTENT MODERATION
  // ============================================
  'GET /admin/content/queue': {
    category: AccessCategory.CONTENT_MODERATION,
    level: AccessLevel.READ_ONLY,
    description: 'View content moderation queue'
  },
  'POST /admin/content/:id/approve': {
    category: AccessCategory.CONTENT_MODERATION,
    level: AccessLevel.READ_WRITE,
    description: 'Approve flagged content'
  },
  'POST /admin/content/:id/reject': {
    category: AccessCategory.CONTENT_MODERATION,
    level: AccessLevel.READ_WRITE,
    description: 'Reject flagged content'
  },
  'GET /admin/content/appeals': {
    category: AccessCategory.CONTENT_MODERATION_APPEALS,
    level: AccessLevel.READ_ONLY,
    description: 'View content appeals'
  },
  'POST /admin/content/appeals/:id/review': {
    category: AccessCategory.CONTENT_MODERATION_APPEALS,
    level: AccessLevel.READ_WRITE,
    description: 'Review content appeal'
  },

  // ============================================
  // 💰 PAYMENT PROCESSING
  // ============================================
  'GET /admin/payments': {
    category: AccessCategory.ADMIN_PANEL_PAYMENTS,
    level: AccessLevel.READ_ONLY,
    description: 'View payment transactions'
  },
  'POST /admin/payments/:id/refund': {
    category: AccessCategory.ADMIN_PANEL_PAYMENTS,
    level: AccessLevel.READ_WRITE,
    description: 'Process payment refund'
  },
  'GET /admin/payments/disputes': {
    category: AccessCategory.PAYMENT_DISPUTES,
    level: AccessLevel.READ_ONLY,
    description: 'View payment disputes'
  },
  'POST /admin/payments/disputes/:id/resolve': {
    category: AccessCategory.PAYMENT_DISPUTES,
    level: AccessLevel.READ_WRITE,
    description: 'Resolve payment dispute'
  },
  'GET /api/payments/ccbill': {
    category: AccessCategory.PAYMENT_PROCESSING,
    level: AccessLevel.READ_WRITE,
    description: 'Access CCBill payment gateway'
  },
  'GET /api/payments/paxum': {
    category: AccessCategory.PAYMENT_PROCESSING,
    level: AccessLevel.READ_WRITE,
    description: 'Access Paxum payment system'
  },
  'GET /api/payments/segpay': {
    category: AccessCategory.PAYMENT_PROCESSING,
    level: AccessLevel.READ_WRITE,
    description: 'Access Segpay payment gateway'
  },

  // ============================================
  // 📊 ANALYTICS & REPORTS
  // ============================================
  'GET /admin/analytics': {
    category: AccessCategory.ADMIN_PANEL_ANALYTICS,
    level: AccessLevel.READ_ONLY,
    description: 'View platform analytics dashboard'
  },
  'GET /admin/analytics/revenue': {
    category: AccessCategory.FINANCIAL_REPORTS,
    level: AccessLevel.READ_ONLY,
    description: 'View revenue reports'
  },
  'GET /admin/analytics/creators': {
    category: AccessCategory.ANALYTICS_READONLY,
    level: AccessLevel.READ_ONLY,
    description: 'View creator analytics'
  },
  'GET /admin/analytics/platform': {
    category: AccessCategory.PLATFORM_METRICS,
    level: AccessLevel.READ_ONLY,
    description: 'View platform usage metrics'
  },

  // ============================================
  // 🎯 CREATOR RELATIONS
  // ============================================
  'GET /admin/creators': {
    category: AccessCategory.CREATOR_SUPPORT,
    level: AccessLevel.READ_ONLY,
    description: 'View creator accounts'
  },
  'POST /admin/creators/:id/support': {
    category: AccessCategory.CREATOR_SUPPORT,
    level: AccessLevel.READ_WRITE,
    description: 'Provide creator support'
  },
  'GET /admin/creators/payouts': {
    category: AccessCategory.CREATOR_PAYOUTS,
    level: AccessLevel.READ_ONLY,
    description: 'View creator payout queue'
  },
  'POST /admin/creators/payouts/:id/process': {
    category: AccessCategory.CREATOR_PAYOUTS,
    level: AccessLevel.READ_WRITE,
    description: 'Process creator payout'
  },
  'GET /admin/creators/relations': {
    category: AccessCategory.CREATOR_RELATIONS,
    level: AccessLevel.READ_ONLY,
    description: 'View creator partnership programs'
  },

  // ============================================
  // 🎧 CUSTOMER SUPPORT
  // ============================================
  'GET /admin/support/tickets': {
    category: AccessCategory.CUSTOMER_SUPPORT,
    level: AccessLevel.READ_ONLY,
    description: 'View support ticket queue'
  },
  'POST /admin/support/tickets/:id/respond': {
    category: AccessCategory.CUSTOMER_SUPPORT,
    level: AccessLevel.READ_WRITE,
    description: 'Respond to support ticket'
  },
  'GET /admin/support/escalated': {
    category: AccessCategory.CUSTOMER_SUPPORT_ESCALATED,
    level: AccessLevel.READ_ONLY,
    description: 'View escalated support issues'
  },
  'POST /admin/support/escalated/:id/resolve': {
    category: AccessCategory.CUSTOMER_SUPPORT_ESCALATED,
    level: AccessLevel.READ_WRITE,
    description: 'Resolve escalated support issue'
  },

  // ============================================
  // 🔧 SYSTEM MAINTENANCE
  // ============================================
  'GET /admin/system/status': {
    category: AccessCategory.SYSTEM_MAINTENANCE,
    level: AccessLevel.READ_ONLY,
    description: 'View system status and health'
  },
  'POST /admin/system/maintenance': {
    category: AccessCategory.SYSTEM_MAINTENANCE,
    level: AccessLevel.ADMIN,
    description: 'Enable/disable maintenance mode'
  },
  'GET /admin/system/logs': {
    category: AccessCategory.LOG_ANALYSIS,
    level: AccessLevel.READ_ONLY,
    description: 'View system logs'
  },
  'GET /admin/database/readonly': {
    category: AccessCategory.DATABASE_READONLY,
    level: AccessLevel.READ_ONLY,
    description: 'Read-only database access'
  },

  // ============================================
  // 🛡️ SECURITY & COMPLIANCE
  // ============================================
  'GET /admin/security/alerts': {
    category: AccessCategory.SECURITY_MONITORING,
    level: AccessLevel.READ_ONLY,
    description: 'View security alerts and incidents'
  },
  'POST /admin/security/investigate': {
    category: AccessCategory.BREACH_INVESTIGATION,
    level: AccessLevel.READ_WRITE,
    description: 'Investigate security incidents'
  },
  'GET /admin/compliance/2257': {
    category: AccessCategory.COMPLIANCE_AUDIT,
    level: AccessLevel.READ_ONLY,
    description: 'View 2257 compliance records'
  },
  'GET /admin/compliance/audit': {
    category: AccessCategory.COMPLIANCE_AUDIT,
    level: AccessLevel.READ_ONLY,
    description: 'Access compliance audit trails'
  },

  // ============================================
  // 🚨 EMERGENCY ACCESS
  // ============================================
  'POST /admin/emergency/lockdown': {
    category: AccessCategory.EMERGENCY_RESPONSE,
    level: AccessLevel.EMERGENCY,
    description: 'Emergency system lockdown'
  },
  'POST /admin/emergency/restore': {
    category: AccessCategory.EMERGENCY_RESPONSE,
    level: AccessLevel.EMERGENCY,
    description: 'Emergency system restore'
  },

  // ============================================
  // 🔍 API DEBUGGING
  // ============================================
  'GET /admin/api/logs': {
    category: AccessCategory.API_DEBUGGING,
    level: AccessLevel.READ_ONLY,
    description: 'View API request logs'
  },
  'GET /admin/api/errors': {
    category: AccessCategory.API_DEBUGGING,
    level: AccessLevel.READ_ONLY,
    description: 'View API error logs'
  }
};

// ============================================
// 🛡️ VENDOR ACCESS MIDDLEWARE
// ============================================

@injectable()
export class VendorAccessMiddleware {
  constructor(
    @inject('VendorAccessDelegationService') private vendorAccessService: VendorAccessDelegationService,
    @inject('AuditLogger') private auditLogger: AuditLogger,
    @inject('FanzDashSecurityCenter') private securityCenter: FanzDashSecurityCenter
  ) {}

  /**
   * Create middleware function for specific route protection
   */
  requireVendorAccess(category: AccessCategory, level: AccessLevel = AccessLevel.READ_ONLY) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const token = this.extractToken(req);
        if (!token) {
          return this.handleUnauthorized(req, res, 'No vendor access token provided');
        }

        const ipAddress = this.getClientIP(req);
        const endpoint = `${req.method} ${req.route?.path || req.path}`;

        // Validate access
        const validation = await this.vendorAccessService.validateAccess(
          token,
          category,
          level,
          endpoint,
          ipAddress
        );

        if (!validation.valid) {
          return this.handleAccessDenied(req, res, category, level);
        }

        // Add vendor context to request
        req.vendor = {
          id: validation.vendorId!,
          sessionId: validation.sessionId!,
          riskScore: validation.riskScore || 0,
          category,
          level
        };

        // Log access activity
        await this.logVendorActivity(req, validation.vendorId!, endpoint, 'allowed');

        // Check for high-risk activity
        if (validation.riskScore && validation.riskScore > 70) {
          await this.alertHighRiskActivity(validation.vendorId!, endpoint, validation.riskScore, ipAddress);
        }

        next();
      } catch (error) {
        await this.auditLogger.log({
          action: 'vendor_access_middleware_error',
          error: error.message,
          endpoint: `${req.method} ${req.path}`,
          ipAddress: this.getClientIP(req),
          severity: 'HIGH'
        });

        return res.status(500).json({
          error: 'Internal server error during access validation'
        });
      }
    };
  }

  /**
   * Dynamic middleware that determines required permissions from route
   */
  enforceVendorAccess() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const routeKey = `${req.method} ${req.route?.path || req.path}`;
      const permission = ROUTE_PERMISSIONS[routeKey];

      if (!permission) {
        // Route not configured for vendor access - skip middleware
        return next();
      }

      // Use the require middleware with dynamic permissions
      return this.requireVendorAccess(permission.category, permission.level)(req, res, next);
    };
  }

  /**
   * Session management middleware
   */
  manageVendorSession() {
    return async (req: Request, res: Response, next: NextFunction) => {
      if (req.vendor) {
        // Update session activity
        await this.updateSessionActivity(req);

        // Add session termination handler
        res.on('finish', async () => {
          await this.updateSessionLastActivity(req.vendor.sessionId);
        });
      }

      next();
    };
  }

  // ============================================
  // 🔧 HELPER METHODS
  // ============================================

  private extractToken(req: Request): string | null {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7); // Remove 'Bearer ' prefix
  }

  private getClientIP(req: Request): string {
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress || 
           'unknown';
  }

  private async handleUnauthorized(req: Request, res: Response, reason: string) {
    const ipAddress = this.getClientIP(req);
    const endpoint = `${req.method} ${req.path}`;

    await this.auditLogger.log({
      action: 'vendor_access_unauthorized',
      reason,
      endpoint,
      ipAddress,
      severity: 'MEDIUM'
    });

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Valid vendor access token required',
      code: 'VENDOR_TOKEN_REQUIRED'
    });
  }

  private async handleAccessDenied(req: Request, res: Response, category: AccessCategory, level: AccessLevel) {
    const ipAddress = this.getClientIP(req);
    const endpoint = `${req.method} ${req.path}`;

    await this.auditLogger.log({
      action: 'vendor_access_denied',
      requiredCategory: category,
      requiredLevel: level,
      endpoint,
      ipAddress,
      severity: 'MEDIUM'
    });

    return res.status(403).json({
      error: 'Access Denied',
      message: `Insufficient permissions for ${category} at ${level} level`,
      required: {
        category,
        level
      },
      code: 'INSUFFICIENT_VENDOR_PERMISSIONS'
    });
  }

  private async logVendorActivity(req: Request, vendorId: string, endpoint: string, status: string) {
    await this.auditLogger.log({
      action: 'vendor_activity',
      vendorId,
      endpoint,
      method: req.method,
      status,
      userAgent: req.headers['user-agent'],
      ipAddress: this.getClientIP(req),
      severity: 'INFO'
    });
  }

  private async updateSessionActivity(req: Request) {
    // Implementation would update session with current activity
    // This could include tracking specific endpoints, request data, etc.
  }

  private async updateSessionLastActivity(sessionId: string) {
    // Implementation would update session last activity timestamp
  }

  private async alertHighRiskActivity(vendorId: string, endpoint: string, riskScore: number, ipAddress: string) {
    await this.securityCenter.alertHighRiskVendorActivity({
      vendorId,
      endpoint,
      riskScore,
      ipAddress,
      timestamp: new Date()
    });

    await this.auditLogger.log({
      action: 'high_risk_vendor_activity_detected',
      vendorId,
      endpoint,
      riskScore,
      ipAddress,
      severity: 'HIGH'
    });
  }
}

// ============================================
// 🧩 MIDDLEWARE FACTORY FUNCTIONS
// ============================================

/**
 * Factory function to create vendor access middleware
 */
export function createVendorAccessMiddleware(
  vendorService: VendorAccessDelegationService,
  auditLogger: AuditLogger,
  securityCenter: FanzDashSecurityCenter
) {
  const middleware = new VendorAccessMiddleware(vendorService, auditLogger, securityCenter);
  
  return {
    // Require specific access
    requireAccess: (category: AccessCategory, level: AccessLevel = AccessLevel.READ_ONLY) =>
      middleware.requireVendorAccess(category, level),
    
    // Dynamic access based on route mapping
    enforceAccess: () => middleware.enforceVendorAccess(),
    
    // Session management
    manageSession: () => middleware.manageVendorSession(),
    
    // Combined middleware for complete protection
    protect: (category: AccessCategory, level: AccessLevel = AccessLevel.READ_ONLY) => [
      middleware.requireVendorAccess(category, level),
      middleware.manageVendorSession()
    ]
  };
}

// ============================================
// 📝 TYPE EXTENSIONS
// ============================================

declare global {
  namespace Express {
    interface Request {
      vendor?: {
        id: string;
        sessionId: string;
        riskScore: number;
        category: AccessCategory;
        level: AccessLevel;
      };
    }
  }
}

export default VendorAccessMiddleware;