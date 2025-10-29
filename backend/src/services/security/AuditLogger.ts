import { injectable } from 'inversify';

export interface AuditLogEntry {
  id?: string;
  action: string;
  resource?: string;
  userId?: string;
  vendorId?: string;
  adminUserId?: string;
  approverId?: string;
  details?: any;
  metadata?: any;
  grantId?: string;
  reason?: string;
  severity?: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  ip_address?: string;
  ipAddress?: string; // Alias for ip_address
  user_agent?: string;
  userAgent?: string; // Alias for user_agent
  timestamp?: Date;
  status?: 'success' | 'failure' | 'error';
  error?: string;
  endpoint?: string;
  method?: string;
  requiredCategory?: string;
  requiredLevel?: string;
  riskLevel?: string;
  riskScore?: number;
  activity?: string;
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

  // Alias for logAction to support controller usage
  async log(entry: AuditLogEntry): Promise<void> {
    return this.logAction(entry);
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

  async getAuditLogs(_filters?: any): Promise<{ logs: AuditLogEntry[]; total: number }> {
    // Stub implementation
    return { logs: [], total: 0 };
  }
}