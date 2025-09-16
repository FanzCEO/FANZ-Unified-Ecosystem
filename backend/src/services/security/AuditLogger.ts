import { injectable } from 'inversify';

export interface AuditLogEntry {
  id?: string;
  action: string;
  resource: string;
  userId?: string;
  vendorId?: string;
  adminUserId?: string;
  details?: any;
  ip_address?: string;
  user_agent?: string;
  timestamp?: Date;
  status: 'success' | 'failure' | 'error';
}

@injectable()
export class AuditLogger {
  constructor() {}

  async logAction(entry: AuditLogEntry): Promise<void> {
    // Stub implementation - just console log for now
    console.log('AUDIT LOG:', {
      timestamp: new Date().toISOString(),
      ...entry
    });
  }

  async logVendorAccess(action: string, vendorId: string, resource: string, details?: any): Promise<void> {
    await this.logAction({
      action,
      resource,
      vendorId,
      details,
      status: 'success'
    });
  }

  async logAdminAction(action: string, adminUserId: string, resource: string, details?: any): Promise<void> {
    await this.logAction({
      action,
      resource,
      adminUserId,
      details,
      status: 'success'
    });
  }

  async logSecurityEvent(action: string, details?: any): Promise<void> {
    await this.logAction({
      action,
      resource: 'security',
      details,
      status: 'success'
    });
  }

  async getAuditLogs(filters?: any): Promise<{ logs: AuditLogEntry[]; total: number }> {
    // Stub implementation
    return { logs: [], total: 0 };
  }
}