// FANZ Ecosystem Service Integrations
// This module provides standardized connections to all FANZ ecosystem services

import { logger } from '../../utils/logger.js';

// =============================================
// FANZSSO INTEGRATION - Unified Authentication
// =============================================

interface FanzSSOUser {
  id: string;
  email: string;
  name: string;
  role: string;
  kycStatus: string;
  clearanceLevel: number;
  isVerified: boolean;
}

interface SSOTokenValidationResult {
  valid: boolean;
  user?: FanzSSOUser;
  scopes?: string[];
  error?: string;
}

export class FanzSSOService {
  private apiUrl: string;
  private apiKey: string;
  private clientId: string;
  private clientSecret: string;

  constructor() {
    this.apiUrl = process.env.FANZSSO_API_URL || '';
    this.apiKey = process.env.FANZSSO_API_KEY || '';
    this.clientId = process.env.FANZSSO_CLIENT_ID || 'fanzprotect';
    this.clientSecret = process.env.FANZSSO_CLIENT_SECRET || '';

    if (!this.apiUrl) {
      logger.warn('FanzSSO integration not configured - FANZSSO_API_URL missing');
    }
  }

  async validateToken(token: string): Promise<SSOTokenValidationResult> {
    if (!this.apiUrl) {
      return { valid: false, error: 'SSO service not configured' };
    }

    try {
      const response = await fetch(`${this.apiUrl}/api/auth/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Client-ID': this.clientId
        },
        body: JSON.stringify({ token })
      });

      if (!response.ok) {
        logger.error('FanzSSO token validation failed', { 
          status: response.status,
          statusText: response.statusText 
        });
        return { valid: false, error: 'Token validation failed' };
      }

      const data = await response.json();
      
      return {
        valid: true,
        user: {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          role: data.user.role || 'creator',
          kycStatus: data.user.kycStatus || 'unverified',
          clearanceLevel: data.user.clearanceLevel || 1,
          isVerified: data.user.isVerified || false
        },
        scopes: data.scopes || []
      };

    } catch (error) {
      logger.error('FanzSSO integration error', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return { valid: false, error: 'SSO service unavailable' };
    }
  }

  async getUserProfile(userId: string): Promise<FanzSSOUser | null> {
    if (!this.apiUrl) {
      logger.warn('FanzSSO not configured');
      return null;
    }

    try {
      const response = await fetch(`${this.apiUrl}/api/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Client-ID': this.clientId
        }
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.user;

    } catch (error) {
      logger.error('Failed to fetch user profile from FanzSSO', { userId, error });
      return null;
    }
  }
}

// =============================================
// FANZFINANCE OS INTEGRATION - Billing & Payments
// =============================================

interface FinanceTransaction {
  id: string;
  amount: number;
  currency: string;
  description: string;
  userId: string;
  serviceType: string;
  status: string;
}

interface BillingRequest {
  userId: string;
  amount: number; // in cents
  currency: string;
  serviceType: string;
  description: string;
  metadata?: Record<string, any>;
}

export class FanzFinanceService {
  private apiUrl: string;
  private apiKey: string;
  private webhookSecret: string;

  constructor() {
    this.apiUrl = process.env.FANZFINANCE_API_URL || '';
    this.apiKey = process.env.FANZFINANCE_API_KEY || '';
    this.webhookSecret = process.env.FANZFINANCE_WEBHOOK_SECRET || '';

    if (!this.apiUrl) {
      logger.warn('FanzFinance OS integration not configured - FANZFINANCE_API_URL missing');
    }
  }

  async createTransaction(request: BillingRequest): Promise<FinanceTransaction | null> {
    if (!this.apiUrl) {
      logger.warn('FanzFinance OS not configured');
      return null;
    }

    try {
      const response = await fetch(`${this.apiUrl}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Platform': 'fanzprotect'
        },
        body: JSON.stringify({
          ...request,
          platform: 'fanzprotect',
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        logger.error('Failed to create FanzFinance transaction', { 
          status: response.status,
          request 
        });
        return null;
      }

      const transaction = await response.json();
      
      logger.info('FanzFinance transaction created', { 
        transactionId: transaction.id,
        userId: request.userId,
        amount: request.amount,
        serviceType: request.serviceType
      });

      return transaction;

    } catch (error) {
      logger.error('FanzFinance OS integration error', { error, request });
      return null;
    }
  }

  async recordLedgerEntry(transactionId: string, entries: any[]): Promise<boolean> {
    if (!this.apiUrl) return false;

    try {
      const response = await fetch(`${this.apiUrl}/ledger/entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          transactionId,
          entries,
          platform: 'fanzprotect'
        })
      });

      return response.ok;

    } catch (error) {
      logger.error('Failed to record ledger entry', { error, transactionId });
      return false;
    }
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.webhookSecret) return false;
    
    // TODO: Implement HMAC signature verification
    // This should match the signature algorithm used by FanzFinance OS
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload)
      .digest('hex');
    
    return `sha256=${expectedSignature}` === signature;
  }
}

// =============================================
// FANZMEDIACORE INTEGRATION - Evidence Storage
// =============================================

interface EvidenceUpload {
  file: Buffer;
  fileName: string;
  mimeType: string;
  caseId: string;
  evidenceType: string;
  metadata?: Record<string, any>;
}

interface StorageResult {
  success: boolean;
  filePath?: string;
  fileHash?: string;
  error?: string;
}

export class FanzMediaService {
  private apiUrl: string;
  private apiKey: string;

  constructor() {
    this.apiUrl = process.env.FANZMEDIA_API_URL || '';
    this.apiKey = process.env.FANZMEDIA_API_KEY || '';

    if (!this.apiUrl) {
      logger.warn('FanzMediaCore integration not configured - FANZMEDIA_API_URL missing');
    }
  }

  async uploadEvidence(upload: EvidenceUpload): Promise<StorageResult> {
    if (!this.apiUrl) {
      return { success: false, error: 'Media service not configured' };
    }

    try {
      const formData = new FormData();
      formData.append('file', new Blob([upload.file]), upload.fileName);
      formData.append('caseId', upload.caseId);
      formData.append('evidenceType', upload.evidenceType);
      formData.append('metadata', JSON.stringify(upload.metadata || {}));
      formData.append('platform', 'fanzprotect');

      const response = await fetch(`${this.apiUrl}/evidence/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Chain-Of-Custody': 'enabled'
        },
        body: formData
      });

      if (!response.ok) {
        logger.error('Failed to upload evidence to FanzMediaCore', { 
          status: response.status,
          fileName: upload.fileName
        });
        return { success: false, error: 'Upload failed' };
      }

      const result = await response.json();
      
      logger.info('Evidence uploaded to FanzMediaCore', {
        fileName: upload.fileName,
        filePath: result.filePath,
        fileHash: result.fileHash,
        caseId: upload.caseId
      });

      return {
        success: true,
        filePath: result.filePath,
        fileHash: result.fileHash
      };

    } catch (error) {
      logger.error('FanzMediaCore integration error', { error, fileName: upload.fileName });
      return { success: false, error: 'Media service unavailable' };
    }
  }

  async verifyIntegrity(filePath: string, expectedHash: string): Promise<boolean> {
    if (!this.apiUrl) return false;

    try {
      const response = await fetch(`${this.apiUrl}/evidence/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({ filePath, expectedHash })
      });

      const result = await response.json();
      return result.verified === true;

    } catch (error) {
      logger.error('Failed to verify file integrity', { error, filePath });
      return false;
    }
  }

  async generateSecureUrl(filePath: string, expiresIn: number = 3600): Promise<string | null> {
    if (!this.apiUrl) return null;

    try {
      const response = await fetch(`${this.apiUrl}/evidence/secure-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({ filePath, expiresIn })
      });

      if (!response.ok) return null;

      const result = await response.json();
      return result.url;

    } catch (error) {
      logger.error('Failed to generate secure URL', { error, filePath });
      return null;
    }
  }
}

// =============================================
// FANZDASH INTEGRATION - Admin Dashboard
// =============================================

interface DashboardMetric {
  name: string;
  value: number | string;
  type: 'counter' | 'gauge' | 'histogram';
  timestamp: string;
  platform: string;
}

export class FanzDashService {
  private apiUrl: string;
  private apiKey: string;

  constructor() {
    this.apiUrl = process.env.FANZDASH_API_URL || '';
    this.apiKey = process.env.FANZDASH_API_KEY || '';

    if (!this.apiUrl) {
      logger.warn('FanzDash integration not configured - FANZDASH_API_URL missing');
    }
  }

  async publishMetrics(metrics: DashboardMetric[]): Promise<boolean> {
    if (!this.apiUrl) return false;

    try {
      const response = await fetch(`${this.apiUrl}/metrics/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Platform': 'fanzprotect'
        },
        body: JSON.stringify({ metrics })
      });

      if (response.ok) {
        logger.debug('Metrics published to FanzDash', { count: metrics.length });
        return true;
      } else {
        logger.error('Failed to publish metrics to FanzDash', { status: response.status });
        return false;
      }

    } catch (error) {
      logger.error('FanzDash integration error', { error });
      return false;
    }
  }

  async sendAlert(alert: {
    level: 'info' | 'warning' | 'error' | 'critical';
    title: string;
    message: string;
    metadata?: Record<string, any>;
  }): Promise<boolean> {
    if (!this.apiUrl) return false;

    try {
      const response = await fetch(`${this.apiUrl}/alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Platform': 'fanzprotect'
        },
        body: JSON.stringify({
          ...alert,
          platform: 'fanzprotect',
          timestamp: new Date().toISOString()
        })
      });

      return response.ok;

    } catch (error) {
      logger.error('Failed to send alert to FanzDash', { error });
      return false;
    }
  }
}

// =============================================
// FANZSECURITY INTEGRATION - Compliance & Audit
// =============================================

interface AuditEvent {
  action: string;
  resource: string;
  resourceId?: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export class FanzSecurityService {
  private apiUrl: string;
  private apiKey: string;

  constructor() {
    this.apiUrl = process.env.FANZSECURITY_API_URL || '';
    this.apiKey = process.env.FANZSECURITY_API_KEY || '';

    if (!this.apiUrl) {
      logger.warn('FanzSecurityCompDash integration not configured - FANZSECURITY_API_URL missing');
    }
  }

  async logAuditEvent(event: AuditEvent): Promise<boolean> {
    if (!this.apiUrl) return false;

    try {
      const response = await fetch(`${this.apiUrl}/audit/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Platform': 'fanzprotect'
        },
        body: JSON.stringify({
          ...event,
          platform: 'fanzprotect',
          timestamp: new Date().toISOString()
        })
      });

      return response.ok;

    } catch (error) {
      logger.error('Failed to log audit event', { error });
      return false;
    }
  }

  async reportSecurityIncident(incident: {
    severity: 'low' | 'medium' | 'high' | 'critical';
    type: string;
    description: string;
    affectedResources?: string[];
    metadata?: Record<string, any>;
  }): Promise<boolean> {
    if (!this.apiUrl) return false;

    try {
      const response = await fetch(`${this.apiUrl}/incidents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Platform': 'fanzprotect'
        },
        body: JSON.stringify({
          ...incident,
          platform: 'fanzprotect',
          timestamp: new Date().toISOString()
        })
      });

      return response.ok;

    } catch (error) {
      logger.error('Failed to report security incident', { error });
      return false;
    }
  }
}

// =============================================
// UNIFIED ECOSYSTEM SERVICE MANAGER
// =============================================

export class EcosystemServices {
  public sso: FanzSSOService;
  public finance: FanzFinanceService;
  public media: FanzMediaService;
  public dashboard: FanzDashService;
  public security: FanzSecurityService;

  constructor() {
    this.sso = new FanzSSOService();
    this.finance = new FanzFinanceService();
    this.media = new FanzMediaService();
    this.dashboard = new FanzDashService();
    this.security = new FanzSecurityService();

    logger.info('🔗 FANZ Ecosystem Services initialized', {
      sso: !!process.env.FANZSSO_API_URL,
      finance: !!process.env.FANZFINANCE_API_URL,
      media: !!process.env.FANZMEDIA_API_URL,
      dashboard: !!process.env.FANZDASH_API_URL,
      security: !!process.env.FANZSECURITY_API_URL
    });
  }

  // Health check all ecosystem services
  async healthCheck(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    // Test each service endpoint
    const services = [
      { name: 'sso', url: process.env.FANZSSO_API_URL },
      { name: 'finance', url: process.env.FANZFINANCE_API_URL },
      { name: 'media', url: process.env.FANZMEDIA_API_URL },
      { name: 'dashboard', url: process.env.FANZDASH_API_URL },
      { name: 'security', url: process.env.FANZSECURITY_API_URL }
    ];

    for (const service of services) {
      if (!service.url) {
        results[service.name] = false;
        continue;
      }

      try {
        const response = await fetch(`${service.url}/health`, { 
          method: 'GET',
          timeout: 5000 // 5 second timeout
        });
        results[service.name] = response.ok;
      } catch {
        results[service.name] = false;
      }
    }

    return results;
  }
}

// Export singleton instance
export const ecosystemServices = new EcosystemServices();