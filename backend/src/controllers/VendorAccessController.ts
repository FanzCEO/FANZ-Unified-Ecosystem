/**
 * 🔐 FANZ Vendor Access Management Controller
 * 
 * REST API endpoints for managing vendor access delegation,
 * integrated with FanzDash security dashboard.
 */

import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import VendorAccessDelegationService, { 
  AccessCategory, 
  AccessLevel, 
  VendorType 
} from '../services/vendor-access/VendorAccessDelegationService';
import { AuditLogger } from '../services/security/AuditLogger';
import { validateRequiredFields, validateEnum, validateArray } from '../utils/validation';

@injectable()
export class VendorAccessController {
  constructor(
    @inject('VendorAccessDelegationService') private vendorAccessService: VendorAccessDelegationService,
    @inject('AuditLogger') private auditLogger: AuditLogger
  ) {}

  // ============================================
  // 👤 VENDOR MANAGEMENT ENDPOINTS
  // ============================================

  /**
   * Register a new vendor
   * POST /api/admin/vendor-access/vendors
   */
  async registerVendor(req: Request, res: Response) {
    try {
      const { email, name, company, vendorType, contactInfo } = req.body;

      // Validate required fields
      validateRequiredFields({ email, name, company, vendorType, contactInfo }, ['email', 'name', 'company', 'vendorType', 'contactInfo']);
      validateEnum(vendorType, VendorType, 'vendorType');

      const vendor = await this.vendorAccessService.registerVendor({
        email,
        name,
        company,
        vendorType,
        contactInfo
      });

      await this.auditLogger.log({
        action: 'vendor_registration_api',
        vendorId: vendor.id,
        adminUserId: req.user?.userId,
        metadata: { email, company, vendorType },
        severity: 'INFO'
      });

      res.status(201).json({
        success: true,
        vendor: {
          id: vendor.id,
          email: vendor.email,
          name: vendor.name,
          company: vendor.company,
          vendorType: vendor.vendorType,
          status: vendor.status
        }
      });
    } catch (error) {
      res.status(400).json({
        error: 'Failed to register vendor',
        message: error.message
      });
    }
  }

  /**
   * Complete vendor verification
   * PUT /api/admin/vendor-access/vendors/:id/verify
   */
  async completeVerification(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { backgroundCheckPassed, ndaSigned, complianceTrainingCompleted } = req.body;

      validateRequiredFields({ backgroundCheckPassed, ndaSigned, complianceTrainingCompleted }, ['backgroundCheckPassed', 'ndaSigned', 'complianceTrainingCompleted']);

      await this.vendorAccessService.completeVendorVerification(id, {
        backgroundCheckPassed: Boolean(backgroundCheckPassed),
        ndaSigned: Boolean(ndaSigned),
        complianceTrainingCompleted: Boolean(complianceTrainingCompleted)
      });

      await this.auditLogger.log({
        action: 'vendor_verification_api',
        vendorId: id,
        adminUserId: req.user?.userId,
        metadata: { backgroundCheckPassed, ndaSigned, complianceTrainingCompleted },
        severity: 'MEDIUM'
      });

      res.json({
        success: true,
        message: 'Vendor verification completed'
      });
    } catch (error) {
      res.status(400).json({
        error: 'Failed to complete verification',
        message: error.message
      });
    }
  }

  /**
   * List all vendors
   * GET /api/admin/vendor-access/vendors
   */
  async listVendors(req: Request, res: Response) {
    try {
      const { _status, _vendorType, page = 1, limit = 50 } = req.query;
      
      // Implementation would use database service to fetch vendors
      // This is a placeholder for the actual implementation
      
      res.json({
        success: true,
        vendors: [],
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: 0
        }
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch vendors',
        message: error.message
      });
    }
  }

  // ============================================
  // 🎟️ ACCESS GRANT ENDPOINTS
  // ============================================

  /**
   * Create access grant request
   * POST /api/admin/vendor-access/grants
   */
  async createAccessGrant(req: Request, res: Response) {
    try {
      const { 
        vendorId, 
        categories, 
        accessLevel, 
        durationHours, 
        justification, 
        restrictions,
        requiredApprovers 
      } = req.body;

      // Validate required fields
      validateRequiredFields({ vendorId, categories, accessLevel, durationHours, justification }, ['vendorId', 'categories', 'accessLevel', 'durationHours', 'justification']);
      validateArray(categories, 'categories');
      validateEnum(accessLevel, AccessLevel, 'accessLevel');

      // Validate categories
      categories.forEach((category: string) => {
        validateEnum(category, AccessCategory, 'category');
      });

      const grant = await this.vendorAccessService.createAccessGrant({
        vendorId,
        grantedBy: req.user!.userId,
        categories,
        accessLevel,
        durationHours: Number(durationHours),
        justification,
        restrictions: restrictions || {},
        requiredApprovers: requiredApprovers || []
      });

      await this.auditLogger.log({
        action: 'access_grant_created_api',
        vendorId,
        grantId: grant.id,
        adminUserId: req.user?.userId,
        metadata: { categories, accessLevel, durationHours, justification },
        severity: 'HIGH'
      });

      res.status(201).json({
        success: true,
        grant: {
          id: grant.id,
          vendorId: grant.vendorId,
          categories: grant.categories,
          accessLevel: grant.accessLevel,
          status: grant.status,
          validity: grant.validity,
          approval: grant.approval
        }
      });
    } catch (error) {
      res.status(400).json({
        error: 'Failed to create access grant',
        message: error.message
      });
    }
  }

  /**
   * Approve access grant
   * POST /api/admin/vendor-access/grants/:id/approve
   */
  async approveGrant(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const approverId = req.user!.userId;

      await this.vendorAccessService.approveAccessGrant(id, approverId);

      await this.auditLogger.log({
        action: 'access_grant_approved_api',
        grantId: id,
        approverId,
        severity: 'HIGH'
      });

      res.json({
        success: true,
        message: 'Access grant approved'
      });
    } catch (error) {
      res.status(400).json({
        error: 'Failed to approve grant',
        message: error.message
      });
    }
  }

  /**
   * Generate access token
   * POST /api/admin/vendor-access/grants/:id/token
   */
  async generateToken(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const accessToken = await this.vendorAccessService.generateAccessToken(id, req.user!.userId);

      await this.auditLogger.log({
        action: 'access_token_generated_api',
        grantId: id,
        vendorId: accessToken.vendorId,
        adminUserId: req.user?.userId,
        severity: 'HIGH'
      });

      res.json({
        success: true,
        token: accessToken.token,
        expiresAt: accessToken.expires_at,
        message: 'Token generated successfully. Share securely with vendor.'
      });
    } catch (error) {
      res.status(400).json({
        error: 'Failed to generate token',
        message: error.message
      });
    }
  }

  /**
   * List access grants
   * GET /api/admin/vendor-access/grants
   */
  async listGrants(req: Request, res: Response) {
    try {
      const { _vendorId, _status, page = 1, limit = 50 } = req.query;
      
      // Implementation placeholder - would fetch from database
      
      res.json({
        success: true,
        grants: [],
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: 0
        }
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch grants',
        message: error.message
      });
    }
  }

  // ============================================
  // 🚨 EMERGENCY CONTROLS
  // ============================================

  /**
   * Emergency revoke all vendor access
   * POST /api/admin/vendor-access/emergency/revoke-all
   */
  async emergencyRevokeAll(req: Request, res: Response) {
    try {
      const { reason } = req.body;
      validateRequiredFields({ reason }, ['reason']);

      await this.vendorAccessService.emergencyRevokeAllAccess(
        reason,
        req.user!.userId
      );

      await this.auditLogger.log({
        action: 'emergency_revoke_all_api',
        adminUserId: req.user?.userId,
        reason,
        severity: 'CRITICAL'
      });

      res.json({
        success: true,
        message: 'All vendor access has been revoked immediately'
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to revoke access',
        message: error.message
      });
    }
  }

  /**
   * Revoke specific vendor access
   * POST /api/admin/vendor-access/vendors/:id/revoke
   */
  async revokeVendorAccess(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      validateRequiredFields({ reason }, ['reason']);

      await this.vendorAccessService.revokeAccess(id, req.user!.userId);

      await this.auditLogger.log({
        action: 'vendor_access_revoked_api',
        vendorId: id,
        adminUserId: req.user?.userId,
        reason,
        severity: 'HIGH'
      });

      res.json({
        success: true,
        message: 'Vendor access has been revoked'
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to revoke vendor access',
        message: error.message
      });
    }
  }

  // ============================================
  // 📊 ANALYTICS & REPORTING
  // ============================================

  /**
   * Get vendor access analytics
   * GET /api/admin/vendor-access/analytics
   */
  async getAnalytics(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      
      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();

      const analytics = await this.vendorAccessService.getVendorAccessAnalytics({
        start,
        end
      });

      res.json({
        success: true,
        analytics,
        timeRange: { start, end }
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch analytics',
        message: error.message
      });
    }
  }

  /**
   * Get access categories and levels for UI
   * GET /api/admin/vendor-access/config
   */
  async getAccessConfig(req: Request, res: Response) {
    try {
      res.json({
        success: true,
        config: {
          categories: Object.values(AccessCategory).map(category => ({
            value: category,
            label: category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            description: this.getCategoryDescription(category)
          })),
          levels: Object.values(AccessLevel).map(level => ({
            value: level,
            label: level.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            description: this.getLevelDescription(level)
          })),
          vendorTypes: Object.values(VendorType).map(type => ({
            value: type,
            label: type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
          }))
        }
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch config',
        message: error.message
      });
    }
  }

  // ============================================
  // 🔧 HELPER METHODS
  // ============================================

  private getCategoryDescription(category: AccessCategory): string {
    const descriptions: Record<AccessCategory, string> = {
      // Core categories
      [AccessCategory.USER_MANAGEMENT]: 'Manage user accounts and profiles',
      [AccessCategory.CONTENT_MODERATION]: 'Review and moderate flagged content',
      [AccessCategory.FINANCIAL_REPORTS]: 'Access revenue and financial reports',
      [AccessCategory.PLATFORM_SETTINGS]: 'Configure platform settings and policies',
      [AccessCategory.SECURITY_AUDIT]: 'Conduct security audits and reviews',
      // Extended categories
      [AccessCategory.ADMIN_PANEL_MEMBERS]: 'Manage member accounts, profiles, and settings',
      [AccessCategory.ADMIN_PANEL_STAFF]: 'Manage staff accounts, roles, and permissions',
      [AccessCategory.ADMIN_PANEL_CONTENT]: 'Oversee content policies and moderation rules',
      [AccessCategory.ADMIN_PANEL_PAYMENTS]: 'View and manage payment transactions',
      [AccessCategory.ADMIN_PANEL_ANALYTICS]: 'Access platform analytics and dashboards',
      [AccessCategory.CONTENT_MODERATION_APPEALS]: 'Handle content moderation appeals',
      [AccessCategory.PAYMENT_PROCESSING]: 'Access payment gateway integrations (CCBill/Paxum/Segpay)',
      [AccessCategory.PAYMENT_DISPUTES]: 'Handle payment disputes and chargebacks',
      [AccessCategory.CUSTOMER_SUPPORT]: 'Handle customer support tickets and inquiries',
      [AccessCategory.CUSTOMER_SUPPORT_ESCALATED]: 'Handle escalated customer support issues',
      [AccessCategory.SYSTEM_MAINTENANCE]: 'Perform system maintenance and deployments',
      [AccessCategory.SECURITY_MONITORING]: 'Monitor security alerts and incidents',
      [AccessCategory.ANALYTICS_READONLY]: 'View-only access to analytics data',
      [AccessCategory.COMPLIANCE_AUDIT]: 'Access compliance records and audit trails',
      [AccessCategory.PLATFORM_METRICS]: 'View platform usage and performance metrics',
      [AccessCategory.CREATOR_SUPPORT]: 'Provide support to content creators',
      [AccessCategory.CREATOR_RELATIONS]: 'Manage creator partnerships and programs',
      [AccessCategory.CREATOR_PAYOUTS]: 'Process creator payouts and earnings',
      [AccessCategory.API_DEBUGGING]: 'Access API logs and debugging information',
      [AccessCategory.DATABASE_READONLY]: 'Read-only access to database queries',
      [AccessCategory.LOG_ANALYSIS]: 'Analyze system logs and error tracking',
      [AccessCategory.EMERGENCY_RESPONSE]: 'Emergency system controls and incident response',
      [AccessCategory.BREACH_INVESTIGATION]: 'Investigate security breaches and incidents'
    };
    
    return descriptions[category] || 'Access to specific platform functionality';
  }

  private getLevelDescription(level: AccessLevel): string {
    const descriptions: Record<AccessLevel, string> = {
      [AccessLevel.READ_ONLY]: 'View-only access, cannot modify data',
      [AccessLevel.READ_WRITE]: 'Can view and modify data within scope',
      [AccessLevel.ADMIN]: 'Full administrative access within scope',
      [AccessLevel.FULL_ACCESS]: 'Complete access with all privileges',
      [AccessLevel.EMERGENCY]: 'Emergency access with elevated privileges'
    };
    
    return descriptions[level] || 'Standard access level';
  }
}

export default VendorAccessController;