/**
 * 🔐 FANZ Vendor Access Delegation Service
 * 
 * Manages time-limited access for vendors, contractors, and support staff
 * with granular permission categories and comprehensive audit logging.
 * 
 * Integrates with FanzDash security dashboard for centralized control.
 */

import { injectable } from 'inversify';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { AuditLogger } from '../security/AuditLogger';
import { FanzDashSecurityCenter } from '../security/FanzDashSecurityCenter';
import { NotificationService } from '../notifications/NotificationService';
import { DatabaseService } from '../database/DatabaseService';

// ============================================
// 🏷️ ACCESS CATEGORIES & PERMISSIONS
// ============================================

export enum AccessCategory {
  // Admin Panel Access
  ADMIN_PANEL_MEMBERS = 'admin-panel-members',           // Member management, profiles
  ADMIN_PANEL_STAFF = 'admin-panel-staff',               // Staff management, roles
  ADMIN_PANEL_CONTENT = 'admin-panel-content',           // Content oversight, policies
  ADMIN_PANEL_PAYMENTS = 'admin-panel-payments',         // Payment processing, refunds
  ADMIN_PANEL_ANALYTICS = 'admin-panel-analytics',       // Platform analytics, reports
  
  // Specialized Access Categories
  CONTENT_MODERATION = 'content-moderation',             // Review flagged content
  CONTENT_MODERATION_APPEALS = 'content-moderation-appeals', // Handle appeals
  PAYMENT_PROCESSING = 'payment-processing',             // CCBill/Paxum/Segpay access
  PAYMENT_DISPUTES = 'payment-disputes',                 // Handle chargebacks, disputes
  
  // Support & Maintenance
  CUSTOMER_SUPPORT = 'customer-support',                 // User support tickets
  CUSTOMER_SUPPORT_ESCALATED = 'customer-support-escalated', // High-priority issues
  SYSTEM_MAINTENANCE = 'system-maintenance',             // Server maintenance, deployments
  SECURITY_MONITORING = 'security-monitoring',           // Security alerts, investigations
  
  // Analytics & Reporting (Read-Only)
  ANALYTICS_READONLY = 'analytics-readonly',             // View-only analytics
  FINANCIAL_REPORTS = 'financial-reports',               // Revenue, payout reports
  COMPLIANCE_AUDIT = 'compliance-audit',                 // Compliance reviews, 2257
  PLATFORM_METRICS = 'platform-metrics',                 // Usage metrics, performance
  
  // Creator Relations
  CREATOR_SUPPORT = 'creator-support',                   // Creator assistance, onboarding
  CREATOR_RELATIONS = 'creator-relations',               // Partnerships, programs
  CREATOR_PAYOUTS = 'creator-payouts',                   // Payout processing, issues
  
  // Technical Support
  API_DEBUGGING = 'api-debugging',                       // API logs, troubleshooting
  DATABASE_READONLY = 'database-readonly',               // Read-only DB access
  LOG_ANALYSIS = 'log-analysis',                         // System logs, error tracking
  
  // Emergency Access
  EMERGENCY_RESPONSE = 'emergency-response',             // Critical incident response
  BREACH_INVESTIGATION = 'breach-investigation',         // Security breach analysis
}

export enum AccessLevel {
  READ_ONLY = 'read-only',
  READ_WRITE = 'read-write',
  ADMIN = 'admin',
  EMERGENCY = 'emergency'
}

export enum VendorType {
  CONTRACTOR = 'contractor',
  CONSULTANT = 'consultant',
  SUPPORT_STAFF = 'support-staff',
  AUDITOR = 'auditor',
  MAINTENANCE = 'maintenance',
  SECURITY_ANALYST = 'security-analyst',
  COMPLIANCE_OFFICER = 'compliance-officer',
  PAYMENT_SPECIALIST = 'payment-specialist'
}

// ============================================
// 📋 DATA INTERFACES
// ============================================

export interface VendorProfile {
  id: string;
  email: string;
  name: string;
  company: string;
  vendorType: VendorType;
  contactInfo: {
    phone: string;
    address: string;
    emergencyContact: string;
  };
  verification: {
    backgroundCheckCompleted: boolean;
    backgroundCheckDate?: Date;
    ndaSigned: boolean;
    ndaSignedDate?: Date;
    complianceTrainingCompleted: boolean;
    complianceTrainingDate?: Date;
  };
  status: 'pending' | 'approved' | 'suspended' | 'terminated';
  createdAt: Date;
  updatedAt: Date;
}

export interface AccessGrant {
  id: string;
  vendorId: string;
  grantedBy: string; // Admin user ID
  categories: AccessCategory[];
  accessLevel: AccessLevel;
  restrictions: {
    ipWhitelist?: string[];
    timeWindows?: TimeWindow[];
    maxConcurrentSessions?: number;
    allowedEndpoints?: string[];
    deniedEndpoints?: string[];
  };
  validity: {
    startTime: Date;
    endTime: Date;
    maxDurationHours: number;
    extendable: boolean;
    autoRenew: boolean;
  };
  approval: {
    requiredApprovers: string[];
    currentApprovals: string[];
    approved: boolean;
    approvedAt?: Date;
    approvedBy?: string;
  };
  status: 'pending' | 'approved' | 'active' | 'expired' | 'revoked';
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeWindow {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  startHour: number; // 0-23
  endHour: number;   // 0-23
  timezone: string;  // e.g., 'America/New_York'
}

export interface AccessToken {
  token: string;
  vendorId: string;
  grantId: string;
  categories: AccessCategory[];
  accessLevel: AccessLevel;
  expiresAt: Date;
  restrictions: any;
}

export interface VendorSession {
  id: string;
  vendorId: string;
  tokenId: string;
  ipAddress: string;
  userAgent: string;
  startTime: Date;
  lastActivity: Date;
  endTime?: Date;
  activities: VendorActivity[];
}

export interface VendorActivity {
  id: string;
  sessionId: string;
  vendorId: string;
  action: string;
  resource: string;
  method: string;
  endpoint: string;
  requestData?: any;
  responseStatus: number;
  timestamp: Date;
  ipAddress: string;
  riskScore: number; // 0-100, calculated risk
}

// ============================================
// 🔐 VENDOR ACCESS DELEGATION SERVICE
// ============================================

@injectable()
export class VendorAccessDelegationService {
  constructor(
    private auditLogger: AuditLogger,
    private securityCenter: FanzDashSecurityCenter,
    private notificationService: NotificationService,
    private databaseService: DatabaseService
  ) {}

  // ============================================
  // 👤 VENDOR MANAGEMENT
  // ============================================

  /**
   * Register a new vendor for access consideration
   */
  async registerVendor(vendorData: Partial<VendorProfile>): Promise<VendorProfile> {
    const vendor: VendorProfile = {
      id: uuidv4(),
      email: vendorData.email!,
      name: vendorData.name!,
      company: vendorData.company!,
      vendorType: vendorData.vendorType!,
      contactInfo: vendorData.contactInfo!,
      verification: {
        backgroundCheckCompleted: false,
        ndaSigned: false,
        complianceTrainingCompleted: false
      },
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.databaseService.insert('vendor_profiles', vendor);

    await this.auditLogger.log({
      action: 'vendor_registered',
      vendorId: vendor.id,
      metadata: { vendorType: vendor.vendorType, company: vendor.company },
      severity: 'INFO'
    });

    // Send vendor onboarding email
    await this.notificationService.sendVendorOnboarding(vendor);

    // Notify security team
    await this.securityCenter.notifyVendorRegistration(vendor);

    return vendor;
  }

  /**
   * Complete vendor verification process
   */
  async completeVendorVerification(
    vendorId: string,
    verificationData: {
      backgroundCheckPassed: boolean;
      ndaSigned: boolean;
      complianceTrainingCompleted: boolean;
    }
  ): Promise<void> {
    const updates = {
      'verification.backgroundCheckCompleted': verificationData.backgroundCheckPassed,
      'verification.backgroundCheckDate': new Date(),
      'verification.ndaSigned': verificationData.ndaSigned,
      'verification.ndaSignedDate': verificationData.ndaSigned ? new Date() : undefined,
      'verification.complianceTrainingCompleted': verificationData.complianceTrainingCompleted,
      'verification.complianceTrainingDate': verificationData.complianceTrainingCompleted ? new Date() : undefined,
      status: (verificationData.backgroundCheckPassed && 
               verificationData.ndaSigned && 
               verificationData.complianceTrainingCompleted) ? 'approved' : 'pending',
      updatedAt: new Date()
    };

    await this.databaseService.update('vendor_profiles', { id: vendorId }, updates);

    await this.auditLogger.log({
      action: 'vendor_verification_completed',
      vendorId,
      metadata: verificationData,
      severity: 'INFO'
    });
  }

  // ============================================
  // 🎟️ ACCESS GRANT MANAGEMENT
  // ============================================

  /**
   * Create a new access grant request
   */
  async createAccessGrant(grantData: {
    vendorId: string;
    grantedBy: string;
    categories: AccessCategory[];
    accessLevel: AccessLevel;
    durationHours: number;
    justification: string;
    restrictions?: any;
    requiredApprovers: string[];
  }): Promise<AccessGrant> {
    // Validate vendor is approved
    const vendor = await this.databaseService.findOne('vendor_profiles', { id: grantData.vendorId });
    if (!vendor || vendor.status !== 'approved') {
      throw new Error('Vendor must be approved before granting access');
    }

    // Check for high-risk combinations
    await this.validateAccessRequest(grantData.categories, grantData.accessLevel);

    const grant: AccessGrant = {
      id: uuidv4(),
      vendorId: grantData.vendorId,
      grantedBy: grantData.grantedBy,
      categories: grantData.categories,
      accessLevel: grantData.accessLevel,
      restrictions: grantData.restrictions || {},
      validity: {
        startTime: new Date(),
        endTime: new Date(Date.now() + (grantData.durationHours * 60 * 60 * 1000)),
        maxDurationHours: grantData.durationHours,
        extendable: grantData.durationHours <= 24, // Only short-term grants are extendable
        autoRenew: false
      },
      approval: {
        requiredApprovers: grantData.requiredApprovers,
        currentApprovals: [],
        approved: grantData.requiredApprovers.length === 0 // Auto-approve if no approvers required
      },
      status: grantData.requiredApprovers.length === 0 ? 'approved' : 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.databaseService.insert('access_grants', grant);

    await this.auditLogger.log({
      action: 'access_grant_created',
      vendorId: grantData.vendorId,
      grantId: grant.id,
      metadata: {
        categories: grantData.categories,
        accessLevel: grantData.accessLevel,
        duration: grantData.durationHours,
        justification: grantData.justification
      },
      severity: 'MEDIUM'
    });

    // Send approval requests if needed
    if (grantData.requiredApprovers.length > 0) {
      await this.notificationService.sendAccessApprovalRequests(grant, grantData.justification);
    }

    return grant;
  }

  /**
   * Approve an access grant
   */
  async approveAccessGrant(grantId: string, approverId: string): Promise<void> {
    const grant = await this.databaseService.findOne('access_grants', { id: grantId });
    if (!grant) {
      throw new Error('Access grant not found');
    }

    if (grant.status !== 'pending') {
      throw new Error('Grant is not pending approval');
    }

    if (!grant.approval.requiredApprovers.includes(approverId)) {
      throw new Error('User not authorized to approve this grant');
    }

    if (grant.approval.currentApprovals.includes(approverId)) {
      throw new Error('User has already approved this grant');
    }

    // Add approval
    const currentApprovals = [...grant.approval.currentApprovals, approverId];
    const approved = currentApprovals.length >= grant.approval.requiredApprovers.length;

    await this.databaseService.update('access_grants', { id: grantId }, {
      'approval.currentApprovals': currentApprovals,
      'approval.approved': approved,
      'approval.approvedAt': approved ? new Date() : undefined,
      'approval.approvedBy': approved ? approverId : undefined,
      status: approved ? 'approved' : 'pending',
      updatedAt: new Date()
    });

    await this.auditLogger.log({
      action: approved ? 'access_grant_approved' : 'access_grant_partial_approval',
      vendorId: grant.vendorId,
      grantId,
      approverId,
      severity: 'HIGH'
    });

    if (approved) {
      // Notify vendor of approval
      const vendor = await this.databaseService.findOne('vendor_profiles', { id: grant.vendorId });
      await this.notificationService.sendAccessGrantApproved(vendor, grant);
    }
  }

  /**
   * Generate access token for approved grant
   */
  async generateAccessToken(grantId: string): Promise<AccessToken> {
    const grant = await this.databaseService.findOne('access_grants', { id: grantId });
    if (!grant || grant.status !== 'approved') {
      throw new Error('Grant is not approved');
    }

    if (new Date() > grant.validity.endTime) {
      throw new Error('Grant has expired');
    }

    const tokenPayload = {
      vendorId: grant.vendorId,
      grantId: grant.id,
      categories: grant.categories,
      accessLevel: grant.accessLevel,
      restrictions: grant.restrictions,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(grant.validity.endTime.getTime() / 1000)
    };

    if (!process.env.VENDOR_JWT_SECRET) {
      throw new Error('VENDOR_JWT_SECRET environment variable is not set');
    }
    // Enforce minimum secret strength: at least 32 chars, must include upper, lower, digit, and symbol
    const secret = process.env.VENDOR_JWT_SECRET;
    const minLength = 32;
    const hasUpper = /[A-Z]/.test(secret);
    const hasLower = /[a-z]/.test(secret);
    const hasDigit = /\d/.test(secret);
    const hasSymbol = /[^A-Za-z0-9]/.test(secret);
    if (
      secret.length < minLength ||
      !hasUpper ||
      !hasLower ||
      !hasDigit ||
      !hasSymbol
    ) {
      throw new Error(
        'VENDOR_JWT_SECRET is too weak. It must be at least 32 characters long and include uppercase, lowercase, digit, and symbol characters.'
      );
    }
    const token = jwt.sign(tokenPayload, secret, {
      issuer: 'fanz-security',
      audience: 'fanz-vendor-access'
    });

    const accessToken: AccessToken = {
      token,
      vendorId: grant.vendorId,
      grantId: grant.id,
      categories: grant.categories,
      accessLevel: grant.accessLevel,
      expiresAt: grant.validity.endTime,
      restrictions: grant.restrictions
    };

    // Store token for tracking
    await this.databaseService.insert('vendor_access_tokens', {
      id: uuidv4(),
      token,
      grantId: grant.id,
      vendorId: grant.vendorId,
      createdAt: new Date(),
      expiresAt: grant.validity.endTime
    });

    await this.auditLogger.log({
      action: 'access_token_generated',
      vendorId: grant.vendorId,
      grantId: grant.id,
      severity: 'HIGH'
    });

    return accessToken;
  }

  // ============================================
  // 🛡️ ACCESS VALIDATION
  // ============================================

  /**
   * Validate vendor access for specific resource
   */
  async validateAccess(
    token: string,
    requiredCategory: AccessCategory,
    requiredLevel: AccessLevel,
    endpoint: string,
    ipAddress: string
  ): Promise<{ valid: boolean; vendorId?: string; sessionId?: string; riskScore?: number }> {
    try {
      // Verify JWT token
      const decoded = jwt.verify(token, process.env.VENDOR_JWT_SECRET!) as any;

      // Check if token is in blacklist
      const tokenRecord = await this.databaseService.findOne('vendor_access_tokens', { token });
      if (!tokenRecord || tokenRecord.revoked) {
        await this.auditLogger.log({
          action: 'access_denied_token_revoked',
          token: token.substring(0, 10) + '...',
          ipAddress,
          endpoint,
          severity: 'HIGH'
        });
        return { valid: false };
      }

      // Check category access
      if (!decoded.categories.includes(requiredCategory)) {
        await this.auditLogger.log({
          action: 'access_denied_insufficient_category',
          vendorId: decoded.vendorId,
          requiredCategory,
          userCategories: decoded.categories,
          endpoint,
          severity: 'MEDIUM'
        });
        return { valid: false };
      }

      // Check access level
      if (!this.hasRequiredAccessLevel(decoded.accessLevel, requiredLevel)) {
        await this.auditLogger.log({
          action: 'access_denied_insufficient_level',
          vendorId: decoded.vendorId,
          requiredLevel,
          userLevel: decoded.accessLevel,
          endpoint,
          severity: 'MEDIUM'
        });
        return { valid: false };
      }

      // Check IP restrictions
      if (decoded.restrictions?.ipWhitelist) {
        if (!decoded.restrictions.ipWhitelist.includes(ipAddress)) {
          await this.auditLogger.log({
            action: 'access_denied_ip_restriction',
            vendorId: decoded.vendorId,
            ipAddress,
            allowedIps: decoded.restrictions.ipWhitelist,
            endpoint,
            severity: 'HIGH'
          });
          return { valid: false };
        }
      }

      // Check endpoint restrictions
      if (decoded.restrictions?.deniedEndpoints?.includes(endpoint)) {
        await this.auditLogger.log({
          action: 'access_denied_endpoint_denied',
          vendorId: decoded.vendorId,
          endpoint,
          severity: 'MEDIUM'
        });
        return { valid: false };
      }

      // Create or update session
      const sessionId = await this.updateVendorSession(decoded.vendorId, token, ipAddress, endpoint);

      // Calculate risk score
      const riskScore = await this.calculateRiskScore(decoded.vendorId, ipAddress, endpoint);

      // Log successful access
      await this.auditLogger.log({
        action: 'access_granted',
        vendorId: decoded.vendorId,
        category: requiredCategory,
        endpoint,
        ipAddress,
        riskScore,
        severity: 'INFO'
      });

      return { 
        valid: true, 
        vendorId: decoded.vendorId, 
        sessionId,
        riskScore 
      };

    } catch (error) {
      await this.auditLogger.log({
        action: 'access_denied_token_invalid',
        error: error.message,
        token: token.substring(0, 10) + '...',
        ipAddress,
        endpoint,
        severity: 'HIGH'
      });
      return { valid: false };
    }
  }

  /**
   * Check if user has required access level
   */
  private hasRequiredAccessLevel(userLevel: AccessLevel, requiredLevel: AccessLevel): boolean {
    const levels = [AccessLevel.READ_ONLY, AccessLevel.READ_WRITE, AccessLevel.ADMIN, AccessLevel.EMERGENCY];
    const userLevelIndex = levels.indexOf(userLevel);
    const requiredLevelIndex = levels.indexOf(requiredLevel);
    return userLevelIndex >= requiredLevelIndex;
  }

  // ============================================
  // 📊 SESSION MANAGEMENT
  // ============================================

  /**
   * Update vendor session activity
   */
  private async updateVendorSession(
    vendorId: string,
    token: string,
    ipAddress: string,
    endpoint: string
  ): Promise<string> {
    // Find active session
    let session = await this.databaseService.findOne('vendor_sessions', {
      vendorId,
      endTime: null // Active sessions have null endTime
    });

    if (!session) {
      // Create new session
      session = {
        id: uuidv4(),
        vendorId,
        tokenId: this.extractTokenId(token),
        ipAddress,
        userAgent: '', // Will be set by middleware
        startTime: new Date(),
        lastActivity: new Date(),
        activities: []
      };
      await this.databaseService.insert('vendor_sessions', session);
    } else {
      // Update last activity
      await this.databaseService.update('vendor_sessions', { id: session.id }, {
        lastActivity: new Date(),
        ipAddress // Update in case of IP change
      });
    }

    return session.id;
  }

  /**
   * End vendor session
   */
  async endVendorSession(sessionId: string): Promise<void> {
    await this.databaseService.update('vendor_sessions', { id: sessionId }, {
      endTime: new Date()
    });

    await this.auditLogger.log({
      action: 'vendor_session_ended',
      sessionId,
      severity: 'INFO'
    });
  }

  /**
   * Calculate risk score for vendor activity
   */
  private async calculateRiskScore(vendorId: string, ipAddress: string, endpoint: string): Promise<number> {
    let riskScore = 0;

    // Check for unusual IP
    const recentSessions = await this.databaseService.find('vendor_sessions', {
      vendorId,
      startTime: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    });

    const knownIps = [...new Set(recentSessions.map(s => s.ipAddress))];
    if (knownIps.length > 0 && !knownIps.includes(ipAddress)) {
      riskScore += 20; // New IP address
    }

    // Check for unusual time
    const currentHour = new Date().getHours();
    if (currentHour < 6 || currentHour > 22) {
      riskScore += 15; // Outside normal hours
    }

    // Check for sensitive endpoint
    const sensitiveEndpoints = [
      '/admin/payments',
      '/admin/users/delete',
      '/admin/system/settings',
      '/admin/vendor-access'
    ];
    if (sensitiveEndpoints.some(path => endpoint.includes(path))) {
      riskScore += 25;
    }

    // Check recent activity volume
    const recentActivity = await this.databaseService.count('vendor_activities', {
      vendorId,
      timestamp: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
    });

    if (recentActivity > 100) {
      riskScore += 30; // High activity volume
    }

    return Math.min(riskScore, 100); // Cap at 100
  }

  // ============================================
  // 🚨 EMERGENCY CONTROLS
  // ============================================

  /**
   * Emergency revocation of all vendor access
   */
  async emergencyRevokeAllAccess(reason: string, revokedBy: string): Promise<void> {
    // Revoke all active grants
    await this.databaseService.updateMany('access_grants', 
      { status: { $in: ['approved', 'active'] } },
      { 
        status: 'revoked',
        revokedAt: new Date(),
        revokedBy,
        revocationReason: `EMERGENCY: ${reason}`,
        updatedAt: new Date()
      }
    );

    // Revoke all tokens
    await this.databaseService.updateMany('vendor_access_tokens',
      { revoked: { $ne: true } },
      {
        revoked: true,
        revokedAt: new Date(),
        revokedBy,
        revocationReason: `EMERGENCY: ${reason}`
      }
    );

    // End all active sessions
    await this.databaseService.updateMany('vendor_sessions',
      { endTime: null },
      { endTime: new Date() }
    );

    await this.auditLogger.log({
      action: 'emergency_revoke_all_access',
      revokedBy,
      reason,
      severity: 'CRITICAL'
    });

    // Alert security team
    await this.securityCenter.alertEmergencyRevocation(reason, revokedBy);
  }

  /**
   * Revoke specific vendor access
   */
  async revokeVendorAccess(vendorId: string, reason: string, revokedBy: string): Promise<void> {
    await this.databaseService.updateMany('access_grants',
      { vendorId, status: { $in: ['approved', 'active'] } },
      {
        status: 'revoked',
        revokedAt: new Date(),
        revokedBy,
        revocationReason: reason,
        updatedAt: new Date()
      }
    );

    await this.databaseService.updateMany('vendor_access_tokens',
      { vendorId, revoked: { $ne: true } },
      {
        revoked: true,
        revokedAt: new Date(),
        revokedBy,
        revocationReason: reason
      }
    );

    await this.databaseService.updateMany('vendor_sessions',
      { vendorId, endTime: null },
      { endTime: new Date() }
    );

    await this.auditLogger.log({
      action: 'vendor_access_revoked',
      vendorId,
      revokedBy,
      reason,
      severity: 'HIGH'
    });
  }

  // ============================================
  // 🔍 VALIDATION & UTILITIES
  // ============================================

  /**
   * Validate access request for high-risk combinations
   */
  private async validateAccessRequest(categories: AccessCategory[], accessLevel: AccessLevel): Promise<void> {
    // High-risk category combinations that require additional approval
    const highRiskCombinations = [
      [AccessCategory.ADMIN_PANEL_PAYMENTS, AccessCategory.PAYMENT_PROCESSING],
      [AccessCategory.ADMIN_PANEL_MEMBERS, AccessCategory.DATABASE_READONLY],
      [AccessCategory.SYSTEM_MAINTENANCE, AccessCategory.DATABASE_READONLY]
    ];

    for (const riskCombo of highRiskCombinations) {
      if (riskCombo.every(cat => categories.includes(cat))) {
        // Require additional approvals for high-risk combinations
        throw new Error(`High-risk category combination requires executive approval: ${riskCombo.join(', ')}`);
      }
    }

    // Emergency access requires special handling
    if (accessLevel === AccessLevel.EMERGENCY) {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const hour = now.getHours();

      // Only allow emergency access outside business hours or on weekends
      if (dayOfWeek !== 0 && dayOfWeek !== 6 && hour >= 9 && hour <= 17) {
        throw new Error('Emergency access only allowed outside business hours');
      }
    }
  }

  /**
   * Extract token ID from JWT
   */
  private extractTokenId(token: string): string {
    try {
      const payload = jwt.decode(token) as any;
      return payload.jti || 'unknown';
    } catch {
      return 'invalid';
    }
  }

  // ============================================
  // 📈 REPORTING & ANALYTICS
  // ============================================

  /**
   * Get vendor access analytics
   */
  async getVendorAccessAnalytics(timeRange: { start: Date; end: Date }) {
    const [
      totalGrants,
      activeGrants,
      totalVendors,
      activeVendors,
      accessByCategory,
      riskDistribution
    ] = await Promise.all([
      this.databaseService.count('access_grants', {
        createdAt: { $gte: timeRange.start, $lte: timeRange.end }
      }),
      this.databaseService.count('access_grants', { status: 'active' }),
      this.databaseService.count('vendor_profiles', {}),
      this.databaseService.count('vendor_profiles', { status: 'approved' }),
      this.getAccessByCategory(timeRange),
      this.getRiskDistribution(timeRange)
    ]);

    return {
      summary: {
        totalGrants,
        activeGrants,
        totalVendors,
        activeVendors
      },
      breakdown: {
        accessByCategory,
        riskDistribution
      },
      generatedAt: new Date()
    };
  }

  private async getAccessByCategory(timeRange: { start: Date; end: Date }) {
    // Implementation would aggregate access by category
    return {};
  }

  private async getRiskDistribution(timeRange: { start: Date; end: Date }) {
    // Implementation would analyze risk scores
    return {};
  }
}

export default VendorAccessDelegationService;