import { storage } from './storage';
import { monitoringService } from './monitoringService';
import crypto from 'crypto';

export enum DelegationRole {
  CONTENT_MANAGER = 'content_manager',
  SOCIAL_MEDIA_MANAGER = 'social_media_manager',
  CUSTOMER_SERVICE = 'customer_service',
  FINANCIAL_MANAGER = 'financial_manager',
  TECHNICAL_SUPPORT = 'technical_support',
  MARKETING_MANAGER = 'marketing_manager',
  FULL_ACCESS = 'full_access'
}

export enum DelegationPermission {
  // Content permissions
  CREATE_POSTS = 'create_posts',
  EDIT_POSTS = 'edit_posts',
  DELETE_POSTS = 'delete_posts',
  MANAGE_PPV = 'manage_ppv',
  MANAGE_SCHEDULE = 'manage_schedule',
  
  // Communication permissions
  READ_MESSAGES = 'read_messages',
  SEND_MESSAGES = 'send_messages',
  MANAGE_SUBSCRIBERS = 'manage_subscribers',
  
  // Financial permissions
  VIEW_EARNINGS = 'view_earnings',
  MANAGE_PRICING = 'manage_pricing',
  PROCESS_WITHDRAWALS = 'process_withdrawals',
  
  // Account permissions
  EDIT_PROFILE = 'edit_profile',
  MANAGE_SETTINGS = 'manage_settings',
  VIEW_ANALYTICS = 'view_analytics',
  
  // Live streaming permissions
  START_BROADCAST = 'start_broadcast',
  MANAGE_GUESTS = 'manage_guests',
  MODERATE_CHAT = 'moderate_chat',
  
  // Admin permissions
  MANAGE_DELEGATIONS = 'manage_delegations',
  FULL_ACCOUNT_ACCESS = 'full_account_access'
}

export interface AccessDelegation {
  id: string;
  creatorId: string;
  delegateUserId: string;
  delegateEmail: string;
  delegateName: string;
  role: DelegationRole;
  permissions: DelegationPermission[];
  isActive: boolean;
  startDate: Date;
  endDate?: Date;
  timeRestrictions?: {
    allowedDays: number[]; // 0-6, Sunday=0
    allowedHours: { start: string; end: string };
    timezone: string;
  };
  ipRestrictions?: string[]; // Allowed IP addresses/ranges
  deviceRestrictions?: {
    maxDevices: number;
    registeredDevices: string[];
  };
  activityLog: DelegationActivity[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DelegationActivity {
  id: string;
  action: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  details: any;
}

export interface DelegationInvite {
  id: string;
  creatorId: string;
  email: string;
  role: DelegationRole;
  permissions: DelegationPermission[];
  inviteToken: string;
  expiresAt: Date;
  isUsed: boolean;
  createdAt: Date;
}

export interface DelegationSession {
  sessionId: string;
  delegationId: string;
  delegateUserId: string;
  creatorId: string;
  startTime: Date;
  lastActivity: Date;
  isActive: boolean;
  ipAddress: string;
  userAgent: string;
}

export class AccessDelegationService {
  private delegations: Map<string, AccessDelegation> = new Map();
  private invites: Map<string, DelegationInvite> = new Map();
  private activeSessions: Map<string, DelegationSession> = new Map();

  // Permission sets for each role
  private rolePermissions: Record<DelegationRole, DelegationPermission[]> = {
    [DelegationRole.CONTENT_MANAGER]: [
      DelegationPermission.CREATE_POSTS,
      DelegationPermission.EDIT_POSTS,
      DelegationPermission.MANAGE_PPV,
      DelegationPermission.MANAGE_SCHEDULE,
      DelegationPermission.VIEW_ANALYTICS
    ],
    [DelegationRole.SOCIAL_MEDIA_MANAGER]: [
      DelegationPermission.CREATE_POSTS,
      DelegationPermission.EDIT_POSTS,
      DelegationPermission.READ_MESSAGES,
      DelegationPermission.SEND_MESSAGES,
      DelegationPermission.MANAGE_SUBSCRIBERS,
      DelegationPermission.VIEW_ANALYTICS
    ],
    [DelegationRole.CUSTOMER_SERVICE]: [
      DelegationPermission.READ_MESSAGES,
      DelegationPermission.SEND_MESSAGES,
      DelegationPermission.MANAGE_SUBSCRIBERS,
      DelegationPermission.VIEW_EARNINGS
    ],
    [DelegationRole.FINANCIAL_MANAGER]: [
      DelegationPermission.VIEW_EARNINGS,
      DelegationPermission.MANAGE_PRICING,
      DelegationPermission.PROCESS_WITHDRAWALS,
      DelegationPermission.VIEW_ANALYTICS
    ],
    [DelegationRole.TECHNICAL_SUPPORT]: [
      DelegationPermission.EDIT_PROFILE,
      DelegationPermission.MANAGE_SETTINGS,
      DelegationPermission.START_BROADCAST,
      DelegationPermission.MANAGE_GUESTS
    ],
    [DelegationRole.MARKETING_MANAGER]: [
      DelegationPermission.CREATE_POSTS,
      DelegationPermission.EDIT_POSTS,
      DelegationPermission.MANAGE_PPV,
      DelegationPermission.MANAGE_PRICING,
      DelegationPermission.VIEW_ANALYTICS,
      DelegationPermission.MANAGE_SUBSCRIBERS
    ],
    [DelegationRole.FULL_ACCESS]: Object.values(DelegationPermission)
  };

  async createDelegationInvite(
    creatorId: string,
    email: string,
    role: DelegationRole,
    customPermissions?: DelegationPermission[]
  ): Promise<DelegationInvite> {
    const inviteId = crypto.randomUUID();
    const inviteToken = crypto.randomBytes(32).toString('hex');

    const permissions = customPermissions || this.rolePermissions[role];

    const invite: DelegationInvite = {
      id: inviteId,
      creatorId,
      email,
      role,
      permissions,
      inviteToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      isUsed: false,
      createdAt: new Date()
    };

    this.invites.set(inviteId, invite);

    // Send invitation email
    await this.sendInvitationEmail(invite);

    console.log(`Created delegation invite for ${email} with role ${role}`);
    monitoringService.trackBusinessMetric('delegation_invite_created', 1, {
      creatorId,
      role,
      permissions: permissions.length
    });

    return invite;
  }

  async acceptDelegationInvite(
    inviteToken: string,
    userId: string,
    userDetails: { name: string; email: string }
  ): Promise<AccessDelegation> {
    const invite = Array.from(this.invites.values()).find(i => 
      i.inviteToken === inviteToken && !i.isUsed && i.expiresAt > new Date()
    );

    if (!invite) {
      throw new Error('Invalid or expired invitation');
    }

    const delegationId = crypto.randomUUID();

    const delegation: AccessDelegation = {
      id: delegationId,
      creatorId: invite.creatorId,
      delegateUserId: userId,
      delegateEmail: userDetails.email,
      delegateName: userDetails.name,
      role: invite.role,
      permissions: invite.permissions,
      isActive: true,
      startDate: new Date(),
      activityLog: [{
        id: crypto.randomUUID(),
        action: 'delegation_accepted',
        timestamp: new Date(),
        ipAddress: '',
        userAgent: '',
        details: { inviteId: invite.id }
      }],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.delegations.set(delegationId, delegation);
    
    // Mark invite as used
    invite.isUsed = true;

    console.log(`Delegation accepted: ${userDetails.name} for creator ${invite.creatorId}`);
    monitoringService.trackBusinessMetric('delegation_accepted', 1, {
      creatorId: invite.creatorId,
      role: invite.role
    });

    return delegation;
  }

  async createDelegationSession(
    delegationId: string,
    delegateUserId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<DelegationSession> {
    const delegation = this.delegations.get(delegationId);
    if (!delegation || !delegation.isActive) {
      throw new Error('Delegation not found or inactive');
    }

    // Check time restrictions
    if (delegation.timeRestrictions && !this.isTimeAllowed(delegation.timeRestrictions)) {
      throw new Error('Access not allowed at this time');
    }

    // Check IP restrictions
    if (delegation.ipRestrictions && !this.isIpAllowed(ipAddress, delegation.ipRestrictions)) {
      throw new Error('Access not allowed from this IP address');
    }

    const sessionId = crypto.randomUUID();

    const session: DelegationSession = {
      sessionId,
      delegationId,
      delegateUserId,
      creatorId: delegation.creatorId,
      startTime: new Date(),
      lastActivity: new Date(),
      isActive: true,
      ipAddress,
      userAgent
    };

    this.activeSessions.set(sessionId, session);

    // Log activity
    this.logDelegationActivity(delegationId, {
      action: 'session_started',
      timestamp: new Date(),
      ipAddress,
      userAgent,
      details: { sessionId }
    });

    return session;
  }

  async validateDelegationAccess(
    sessionId: string,
    requiredPermission: DelegationPermission
  ): Promise<boolean> {
    const session = this.activeSessions.get(sessionId);
    if (!session || !session.isActive) {
      return false;
    }

    const delegation = this.delegations.get(session.delegationId);
    if (!delegation || !delegation.isActive) {
      return false;
    }

    // Update last activity
    session.lastActivity = new Date();

    // Check if permission is granted
    return delegation.permissions.includes(requiredPermission);
  }

  async updateDelegationPermissions(
    creatorId: string,
    delegationId: string,
    permissions: DelegationPermission[]
  ): Promise<AccessDelegation> {
    const delegation = this.delegations.get(delegationId);
    if (!delegation || delegation.creatorId !== creatorId) {
      throw new Error('Delegation not found');
    }

    delegation.permissions = permissions;
    delegation.updatedAt = new Date();

    this.logDelegationActivity(delegationId, {
      action: 'permissions_updated',
      timestamp: new Date(),
      ipAddress: '',
      userAgent: '',
      details: { newPermissions: permissions }
    });

    return delegation;
  }

  async revokeDelegation(creatorId: string, delegationId: string): Promise<void> {
    const delegation = this.delegations.get(delegationId);
    if (!delegation || delegation.creatorId !== creatorId) {
      throw new Error('Delegation not found');
    }

    delegation.isActive = false;
    delegation.endDate = new Date();
    delegation.updatedAt = new Date();

    // End all active sessions for this delegation
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.delegationId === delegationId) {
        session.isActive = false;
        this.activeSessions.delete(sessionId);
      }
    }

    this.logDelegationActivity(delegationId, {
      action: 'delegation_revoked',
      timestamp: new Date(),
      ipAddress: '',
      userAgent: '',
      details: {}
    });

    console.log(`Delegation revoked: ${delegationId}`);
    monitoringService.trackBusinessMetric('delegation_revoked', 1, {
      creatorId,
      delegationId
    });
  }

  async getDelegationsForCreator(creatorId: string): Promise<AccessDelegation[]> {
    return Array.from(this.delegations.values()).filter(d => d.creatorId === creatorId);
  }

  async getDelegationsForUser(userId: string): Promise<AccessDelegation[]> {
    return Array.from(this.delegations.values()).filter(d => 
      d.delegateUserId === userId && d.isActive
    );
  }

  async getActiveSessions(creatorId: string): Promise<DelegationSession[]> {
    return Array.from(this.activeSessions.values()).filter(s => 
      s.creatorId === creatorId && s.isActive
    );
  }

  // Helper methods
  private isTimeAllowed(restrictions: AccessDelegation['timeRestrictions']): boolean {
    if (!restrictions) return true;

    const now = new Date();
    const dayOfWeek = now.getDay();
    const currentTime = now.toLocaleTimeString('en-US', { 
      hour12: false, 
      timeZone: restrictions.timezone 
    });

    // Check day restrictions
    if (!restrictions.allowedDays.includes(dayOfWeek)) {
      return false;
    }

    // Check time restrictions
    if (currentTime < restrictions.allowedHours.start || 
        currentTime > restrictions.allowedHours.end) {
      return false;
    }

    return true;
  }

  private isIpAllowed(ip: string, allowedIps: string[]): boolean {
    return allowedIps.some(allowedIp => {
      if (allowedIp.includes('/')) {
        // CIDR notation - simplified check
        return ip.startsWith(allowedIp.split('/')[0].substring(0, allowedIp.lastIndexOf('.')));
      }
      return ip === allowedIp;
    });
  }

  private logDelegationActivity(
    delegationId: string,
    activity: Omit<DelegationActivity, 'id'>
  ): void {
    const delegation = this.delegations.get(delegationId);
    if (!delegation) return;

    const activityWithId: DelegationActivity = {
      id: crypto.randomUUID(),
      ...activity
    };

    delegation.activityLog.push(activityWithId);

    // Keep only last 1000 activities
    if (delegation.activityLog.length > 1000) {
      delegation.activityLog = delegation.activityLog.slice(-1000);
    }
  }

  private async sendInvitationEmail(invite: DelegationInvite): Promise<void> {
    // In production, this would send an actual email
    console.log(`Sending delegation invitation to ${invite.email}`);
    console.log(`Invitation link: https://fanzlab.com/delegation/accept?token=${invite.inviteToken}`);
  }

  // Cleanup expired sessions
  async cleanupExpiredSessions(): Promise<void> {
    const now = new Date();
    const expiredSessions: string[] = [];

    for (const [sessionId, session] of this.activeSessions.entries()) {
      const inactiveTime = now.getTime() - session.lastActivity.getTime();
      
      // Mark sessions inactive after 24 hours of inactivity
      if (inactiveTime > 24 * 60 * 60 * 1000) {
        session.isActive = false;
        expiredSessions.push(sessionId);
      }
    }

    expiredSessions.forEach(sessionId => {
      this.activeSessions.delete(sessionId);
    });

    if (expiredSessions.length > 0) {
      console.log(`Cleaned up ${expiredSessions.length} expired delegation sessions`);
    }
  }
}

export const accessDelegationService = new AccessDelegationService();

// Run cleanup every hour
setInterval(() => {
  accessDelegationService.cleanupExpiredSessions();
}, 60 * 60 * 1000);