/**
 * Tax Exemption Management Service
 * FANZ Unified Ecosystem - Tax Compliance
 * 
 * Handles exemption certificate uploads, validation workflows, 
 * and runtime exemption processing during tax calculations.
 */

import { Pool } from 'pg';
import { createHash } from 'crypto';

// ============================================
// INTERFACES & TYPES
// ============================================

interface ExemptionCertificate {
  id: string;
  userId: string;
  certificateNumber: string;
  exemptionType: 'resale' | 'nonprofit' | 'government' | 'manufacturing' | 'agriculture' | 'education' | 'medical' | 'other';
  organizationName?: string;
  jurisdictionId: string;
  jurisdictionCode: string;
  validFrom: Date;
  validTo?: Date;
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'suspended';
  fileUrl?: string;
  fileHash?: string;
  fileSize?: number;
  uploadedAt: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
  rejectionReason?: string;
  metadata: {
    uploadSource?: 'web' | 'api' | 'email';
    ipAddress?: string;
    userAgent?: string;
    businessType?: string;
    contactInfo?: {
      phone?: string;
      email?: string;
      address?: string;
    };
    notes?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface ExemptionRule {
  id: string;
  jurisdictionId: string;
  exemptionType: string;
  productCategories: string[]; // Which product categories this exemption applies to
  conditions: {
    requiresCertificate: boolean;
    allowsPartialExemption: boolean;
    maxExemptionAmount?: number;
    validityPeriodMonths?: number;
    requiresRenewal: boolean;
    applicableToDigitalGoods: boolean;
    applicableToServices: boolean;
    applicableToShipping: boolean;
  };
  isActive: boolean;
  effectiveFrom: Date;
  effectiveTo?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface ExemptionValidationRequest {
  userId: string;
  jurisdictionId: string;
  productCategoryId: string;
  transactionAmount: number;
  transactionDate: Date;
}

interface ExemptionValidationResult {
  isExempt: boolean;
  exemptionAmount: number;
  exemptionPercentage: number;
  exemptionType?: string;
  certificateId?: string;
  reason: string;
  warnings: string[];
  metadata: {
    ruleId?: string;
    certificateStatus?: string;
    expirationDate?: Date;
    confidence: number;
  };
}

interface ExemptionAlert {
  id: string;
  type: 'expiry_warning' | 'expired' | 'renewal_required' | 'validation_failed' | 'suspicious_usage';
  severity: 'info' | 'warning' | 'critical';
  certificateId: string;
  userId: string;
  message: string;
  details: Record<string, any>;
  createdAt: Date;
  acknowledged: boolean;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
}

// ============================================
// EXEMPTION MANAGEMENT SERVICE
// ============================================

export class ExemptionManagementService {
  private db: Pool;
  private fileStorage: FileStorageService;
  private notificationService: NotificationService;

  constructor(db: Pool, fileStorage: FileStorageService, notificationService: NotificationService) {
    this.db = db;
    this.fileStorage = fileStorage;
    this.notificationService = notificationService;
  }

  /**
   * Upload exemption certificate
   */
  async uploadCertificate(
    userId: string,
    file: Buffer,
    metadata: {
      certificateNumber: string;
      exemptionType: string;
      organizationName?: string;
      jurisdictionCode: string;
      validFrom: Date;
      validTo?: Date;
      fileName: string;
      mimeType: string;
      uploadSource?: string;
      ipAddress?: string;
      userAgent?: string;
      businessType?: string;
      contactInfo?: any;
      notes?: string;
    }
  ): Promise<ExemptionCertificate> {
    try {
      // Validate file
      this.validateCertificateFile(file, metadata.fileName, metadata.mimeType);

      // Calculate file hash
      const fileHash = createHash('sha256').update(file).digest('hex');

      // Check for duplicate uploads
      const existingCert = await this.checkDuplicateCertificate(userId, metadata.certificateNumber, metadata.jurisdictionCode);
      if (existingCert && existingCert.status !== 'rejected') {
        throw new Error('Certificate already exists for this jurisdiction');
      }

      // Upload file to storage
      const fileUrl = await this.fileStorage.uploadFile(
        `exemption-certificates/${userId}/${Date.now()}-${metadata.fileName}`,
        file,
        {
          contentType: metadata.mimeType,
          metadata: {
            userId,
            certificateNumber: metadata.certificateNumber,
            exemptionType: metadata.exemptionType,
            uploadedAt: new Date().toISOString()
          }
        }
      );

      // Get jurisdiction ID
      const jurisdiction = await this.getJurisdictionByCode(metadata.jurisdictionCode);
      if (!jurisdiction) {
        throw new Error(`Invalid jurisdiction code: ${metadata.jurisdictionCode}`);
      }

      // Create certificate record
      const certificateId = `cert_${Date.now()}_${userId}`;
      
      await this.db.query(`
        INSERT INTO exemption_certificates (
          id, user_id, certificate_number, exemption_type, organization_name,
          jurisdiction_id, jurisdiction_code, valid_from, valid_to, status,
          file_url, file_hash, file_size, uploaded_at, metadata, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), $14, NOW(), NOW())
      `, [
        certificateId,
        userId,
        metadata.certificateNumber,
        metadata.exemptionType,
        metadata.organizationName,
        jurisdiction.id,
        metadata.jurisdictionCode,
        metadata.validFrom,
        metadata.validTo,
        'pending',
        fileUrl,
        fileHash,
        file.length,
        new Date(),
        JSON.stringify({
          uploadSource: metadata.uploadSource,
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
          businessType: metadata.businessType,
          contactInfo: metadata.contactInfo,
          notes: metadata.notes
        })
      ]);

      // Notify reviewers
      await this.notifyReviewersOfNewCertificate(certificateId);

      // Create audit log
      await this.createAuditLog('certificate_uploaded', userId, certificateId, {
        certificateNumber: metadata.certificateNumber,
        jurisdictionCode: metadata.jurisdictionCode,
        exemptionType: metadata.exemptionType
      });

      return this.getCertificateById(certificateId);

    } catch (error) {
      console.error('Failed to upload exemption certificate:', error);
      throw error;
    }
  }

  /**
   * Review and approve/reject certificate
   */
  async reviewCertificate(
    certificateId: string,
    reviewerId: string,
    action: 'approve' | 'reject',
    rejectionReason?: string,
    notes?: string
  ): Promise<ExemptionCertificate> {
    try {
      const certificate = await this.getCertificateById(certificateId);
      if (!certificate) {
        throw new Error(`Certificate not found: ${certificateId}`);
      }

      if (certificate.status !== 'pending') {
        throw new Error(`Certificate is not pending review: ${certificate.status}`);
      }

      const newStatus = action === 'approve' ? 'approved' : 'rejected';

      await this.db.query(`
        UPDATE exemption_certificates 
        SET status = $1, reviewed_by = $2, reviewed_at = NOW(), 
            rejection_reason = $3, updated_at = NOW()
        WHERE id = $4
      `, [newStatus, reviewerId, rejectionReason, certificateId]);

      // Update user tax profile if approved
      if (action === 'approve') {
        await this.updateUserTaxProfileExemption(certificate.userId, certificate.jurisdictionId, true);
      }

      // Send notification to user
      await this.notifyUserOfReviewDecision(certificate.userId, certificateId, action, rejectionReason);

      // Create audit log
      await this.createAuditLog('certificate_reviewed', reviewerId, certificateId, {
        action,
        rejectionReason,
        notes
      });

      return this.getCertificateById(certificateId);

    } catch (error) {
      console.error('Failed to review certificate:', error);
      throw error;
    }
  }

  /**
   * Validate exemption for tax calculation
   */
  async validateExemption(request: ExemptionValidationRequest): Promise<ExemptionValidationResult> {
    try {
      // Get active exemption certificates for user and jurisdiction
      const certificates = await this.getUserCertificates(request.userId, request.jurisdictionId, 'approved');
      
      if (certificates.length === 0) {
        return {
          isExempt: false,
          exemptionAmount: 0,
          exemptionPercentage: 0,
          reason: 'No valid exemption certificate found',
          warnings: [],
          metadata: { confidence: 1.0 }
        };
      }

      // Get exemption rules for jurisdiction and product category
      const rules = await this.getExemptionRules(request.jurisdictionId, request.productCategoryId);
      
      for (const certificate of certificates) {
        const rule = rules.find(r => r.exemptionType === certificate.exemptionType);
        
        if (!rule) {
          continue; // No rule for this exemption type
        }

        // Check if certificate is still valid
        const validationResult = this.validateCertificateValidity(certificate, request.transactionDate);
        if (!validationResult.isValid) {
          continue;
        }

        // Check if exemption applies to this product category
        if (rule.productCategories.length > 0 && !rule.productCategories.includes(request.productCategoryId)) {
          continue;
        }

        // Check product-specific conditions
        const productCheck = this.checkProductCategoryEligibility(rule, request.productCategoryId);
        if (!productCheck.eligible) {
          continue;
        }

        // Calculate exemption amount
        let exemptionAmount = request.transactionAmount;
        let exemptionPercentage = 100;
        
        if (rule.conditions.maxExemptionAmount && exemptionAmount > rule.conditions.maxExemptionAmount) {
          exemptionAmount = rule.conditions.maxExemptionAmount;
          exemptionPercentage = Math.min(100, (rule.conditions.maxExemptionAmount / request.transactionAmount) * 100);
        }

        if (!rule.conditions.allowsPartialExemption && exemptionPercentage < 100) {
          exemptionAmount = 0;
          exemptionPercentage = 0;
        }

        const warnings: string[] = [];
        
        // Check for approaching expiration
        if (certificate.validTo) {
          const daysUntilExpiry = Math.ceil((certificate.validTo.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          if (daysUntilExpiry <= 30) {
            warnings.push(`Certificate expires in ${daysUntilExpiry} days`);
          }
        }

        return {
          isExempt: exemptionAmount > 0,
          exemptionAmount,
          exemptionPercentage,
          exemptionType: certificate.exemptionType,
          certificateId: certificate.id,
          reason: exemptionAmount > 0 ? `Valid ${certificate.exemptionType} exemption` : 'Exemption amount is zero',
          warnings,
          metadata: {
            ruleId: rule.id,
            certificateStatus: certificate.status,
            expirationDate: certificate.validTo,
            confidence: validationResult.confidence
          }
        };
      }

      return {
        isExempt: false,
        exemptionAmount: 0,
        exemptionPercentage: 0,
        reason: 'No applicable exemption found for this product category',
        warnings: [],
        metadata: { confidence: 1.0 }
      };

    } catch (error) {
      console.error('Failed to validate exemption:', error);
      
      return {
        isExempt: false,
        exemptionAmount: 0,
        exemptionPercentage: 0,
        reason: 'Exemption validation failed',
        warnings: ['System error during exemption validation'],
        metadata: { confidence: 0.0 }
      };
    }
  }

  /**
   * Get certificates for a user
   */
  async getUserCertificates(
    userId: string, 
    jurisdictionId?: string, 
    status?: string
  ): Promise<ExemptionCertificate[]> {
    let query = `
      SELECT * FROM exemption_certificates 
      WHERE user_id = $1
    `;
    const params = [userId];

    if (jurisdictionId) {
      query += ` AND jurisdiction_id = $${params.length + 1}`;
      params.push(jurisdictionId);
    }

    if (status) {
      query += ` AND status = $${params.length + 1}`;
      params.push(status);
    }

    query += ` ORDER BY created_at DESC`;

    const result = await this.db.query(query, params);
    return result.rows.map(this.mapRowToCertificate);
  }

  /**
   * Daily job to check for expiring certificates
   */
  async checkExpiringCertificates(): Promise<void> {
    try {
      console.log('Running daily exemption certificate expiry check...');

      // Find certificates expiring in 30 days
      const expiringResult = await this.db.query(`
        SELECT * FROM exemption_certificates
        WHERE status = 'approved'
          AND valid_to IS NOT NULL
          AND valid_to >= CURRENT_DATE
          AND valid_to <= CURRENT_DATE + INTERVAL '30 days'
      `);

      for (const row of expiringResult.rows) {
        const certificate = this.mapRowToCertificate(row);
        await this.createExpiryAlert(certificate, 'expiry_warning');
        await this.notifyUserOfExpiringCertificate(certificate.userId, certificate);
      }

      // Mark expired certificates
      await this.db.query(`
        UPDATE exemption_certificates 
        SET status = 'expired', updated_at = NOW()
        WHERE status = 'approved'
          AND valid_to IS NOT NULL
          AND valid_to < CURRENT_DATE
      `);

      // Update user tax profiles for expired certificates
      const expiredResult = await this.db.query(`
        SELECT DISTINCT user_id, jurisdiction_id FROM exemption_certificates
        WHERE status = 'expired'
          AND updated_at::date = CURRENT_DATE
      `);

      for (const row of expiredResult.rows) {
        await this.updateUserTaxProfileExemption(row.user_id, row.jurisdiction_id, false);
      }

      console.log(`Processed ${expiringResult.rows.length} expiring certificates and marked expired certificates`);

    } catch (error) {
      console.error('Failed to check expiring certificates:', error);
      throw error;
    }
  }

  /**
   * Search certificates (admin function)
   */
  async searchCertificates(filters: {
    userId?: string;
    jurisdictionCode?: string;
    status?: string;
    exemptionType?: string;
    organizationName?: string;
    expiringWithinDays?: number;
    limit?: number;
    offset?: number;
  }): Promise<{ certificates: ExemptionCertificate[]; total: number }> {
    let query = `
      SELECT ec.*, COUNT(*) OVER() as total_count 
      FROM exemption_certificates ec
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.userId) {
      query += ` AND ec.user_id = $${params.length + 1}`;
      params.push(filters.userId);
    }

    if (filters.jurisdictionCode) {
      query += ` AND ec.jurisdiction_code = $${params.length + 1}`;
      params.push(filters.jurisdictionCode);
    }

    if (filters.status) {
      query += ` AND ec.status = $${params.length + 1}`;
      params.push(filters.status);
    }

    if (filters.exemptionType) {
      query += ` AND ec.exemption_type = $${params.length + 1}`;
      params.push(filters.exemptionType);
    }

    if (filters.organizationName) {
      query += ` AND ec.organization_name ILIKE $${params.length + 1}`;
      params.push(`%${filters.organizationName}%`);
    }

    if (filters.expiringWithinDays) {
      query += ` AND ec.valid_to IS NOT NULL 
                 AND ec.valid_to >= CURRENT_DATE 
                 AND ec.valid_to <= CURRENT_DATE + INTERVAL '${filters.expiringWithinDays} days'`;
    }

    query += ` ORDER BY ec.created_at DESC`;
    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(filters.limit || 50, filters.offset || 0);

    const result = await this.db.query(query, params);
    
    return {
      certificates: result.rows.map(this.mapRowToCertificate),
      total: result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0
    };
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  private validateCertificateFile(file: Buffer, fileName: string, mimeType: string): void {
    // File size check (max 10MB)
    if (file.length > 10 * 1024 * 1024) {
      throw new Error('File size exceeds maximum allowed size (10MB)');
    }

    // File type check
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/tiff'];
    if (!allowedTypes.includes(mimeType)) {
      throw new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
    }

    // File name check
    if (fileName.length > 255) {
      throw new Error('File name is too long');
    }
  }

  private async checkDuplicateCertificate(
    userId: string, 
    certificateNumber: string, 
    jurisdictionCode: string
  ): Promise<ExemptionCertificate | null> {
    const result = await this.db.query(`
      SELECT * FROM exemption_certificates
      WHERE user_id = $1 AND certificate_number = $2 AND jurisdiction_code = $3
      ORDER BY created_at DESC
      LIMIT 1
    `, [userId, certificateNumber, jurisdictionCode]);

    return result.rows.length > 0 ? this.mapRowToCertificate(result.rows[0]) : null;
  }

  private async getJurisdictionByCode(jurisdictionCode: string) {
    const result = await this.db.query(`
      SELECT id, name, code FROM tax_jurisdictions 
      WHERE code = $1 AND type = 'state'
    `, [jurisdictionCode]);

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  private async getCertificateById(certificateId: string): Promise<ExemptionCertificate> {
    const result = await this.db.query(`
      SELECT * FROM exemption_certificates WHERE id = $1
    `, [certificateId]);

    if (result.rows.length === 0) {
      throw new Error(`Certificate not found: ${certificateId}`);
    }

    return this.mapRowToCertificate(result.rows[0]);
  }

  private async getExemptionRules(jurisdictionId: string, productCategoryId: string): Promise<ExemptionRule[]> {
    const result = await this.db.query(`
      SELECT * FROM exemption_rules
      WHERE jurisdiction_id = $1 
        AND (product_categories = '{}' OR $2 = ANY(product_categories))
        AND is_active = true
        AND effective_from <= CURRENT_DATE
        AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
    `, [jurisdictionId, productCategoryId]);

    return result.rows.map(row => ({
      id: row.id,
      jurisdictionId: row.jurisdiction_id,
      exemptionType: row.exemption_type,
      productCategories: row.product_categories,
      conditions: row.conditions,
      isActive: row.is_active,
      effectiveFrom: row.effective_from,
      effectiveTo: row.effective_to,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  private validateCertificateValidity(certificate: ExemptionCertificate, transactionDate: Date) {
    if (certificate.status !== 'approved') {
      return { isValid: false, confidence: 0.0, reason: 'Certificate not approved' };
    }

    if (certificate.validFrom > transactionDate) {
      return { isValid: false, confidence: 0.0, reason: 'Certificate not yet effective' };
    }

    if (certificate.validTo && certificate.validTo < transactionDate) {
      return { isValid: false, confidence: 0.0, reason: 'Certificate expired' };
    }

    return { isValid: true, confidence: 1.0, reason: 'Valid certificate' };
  }

  private checkProductCategoryEligibility(rule: ExemptionRule, productCategoryId: string) {
    // Map product categories to rule conditions
    const digitalCategories = ['DIGITAL_DOWNLOAD', 'DIGITAL_STREAM', 'DIGITAL_SUBSCRIPTION'];
    const serviceCategories = ['PLATFORM_FEE', 'CREATOR_SERVICE', 'MEMBERSHIP_FEE'];
    const shippingCategories = ['SHIPPING'];

    let eligible = true;

    if (digitalCategories.includes(productCategoryId) && !rule.conditions.applicableToDigitalGoods) {
      eligible = false;
    }

    if (serviceCategories.includes(productCategoryId) && !rule.conditions.applicableToServices) {
      eligible = false;
    }

    if (shippingCategories.includes(productCategoryId) && !rule.conditions.applicableToShipping) {
      eligible = false;
    }

    return { eligible, reason: eligible ? 'Category eligible' : 'Category not covered by exemption rule' };
  }

  private async updateUserTaxProfileExemption(userId: string, jurisdictionId: string, exempt: boolean): Promise<void> {
    await this.db.query(`
      INSERT INTO user_tax_profiles (user_id, jurisdiction_id, exempt, last_validated_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (user_id, jurisdiction_id)
      DO UPDATE SET exempt = $3, last_validated_at = NOW(), updated_at = NOW()
    `, [userId, jurisdictionId, exempt]);
  }

  private async createExpiryAlert(certificate: ExemptionCertificate, alertType: string): Promise<void> {
    const alertId = `alert_${Date.now()}_${certificate.id}`;
    
    await this.db.query(`
      INSERT INTO exemption_alerts (
        id, type, severity, certificate_id, user_id, message, details, created_at, acknowledged
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), false)
      ON CONFLICT DO NOTHING
    `, [
      alertId,
      alertType,
      'warning',
      certificate.id,
      certificate.userId,
      `Certificate ${certificate.certificateNumber} expires on ${certificate.validTo?.toDateString()}`,
      JSON.stringify({
        certificateNumber: certificate.certificateNumber,
        jurisdictionCode: certificate.jurisdictionCode,
        expirationDate: certificate.validTo,
        daysUntilExpiry: certificate.validTo ? 
          Math.ceil((certificate.validTo.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null
      })
    ]);
  }

  private async createAuditLog(action: string, actorId: string, certificateId: string, details: any): Promise<void> {
    await this.db.query(`
      INSERT INTO exemption_audit_logs (
        id, action, actor_id, certificate_id, details, created_at
      )
      VALUES ($1, $2, $3, $4, $5, NOW())
    `, [
      `log_${Date.now()}_${actorId}`,
      action,
      actorId,
      certificateId,
      JSON.stringify(details)
    ]);
  }

  private mapRowToCertificate(row: any): ExemptionCertificate {
    return {
      id: row.id,
      userId: row.user_id,
      certificateNumber: row.certificate_number,
      exemptionType: row.exemption_type,
      organizationName: row.organization_name,
      jurisdictionId: row.jurisdiction_id,
      jurisdictionCode: row.jurisdiction_code,
      validFrom: row.valid_from,
      validTo: row.valid_to,
      status: row.status,
      fileUrl: row.file_url,
      fileHash: row.file_hash,
      fileSize: row.file_size,
      uploadedAt: row.uploaded_at,
      reviewedBy: row.reviewed_by,
      reviewedAt: row.reviewed_at,
      rejectionReason: row.rejection_reason,
      metadata: row.metadata || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  // Mock notification methods - these would integrate with your notification system
  private async notifyReviewersOfNewCertificate(certificateId: string): Promise<void> {
    console.log(`Notifying reviewers of new certificate: ${certificateId}`);
  }

  private async notifyUserOfReviewDecision(userId: string, certificateId: string, action: string, reason?: string): Promise<void> {
    console.log(`Notifying user ${userId} of certificate ${certificateId} ${action}${reason ? ': ' + reason : ''}`);
  }

  private async notifyUserOfExpiringCertificate(userId: string, certificate: ExemptionCertificate): Promise<void> {
    console.log(`Notifying user ${userId} that certificate ${certificate.certificateNumber} expires on ${certificate.validTo}`);
  }
}

// ============================================
// MOCK SERVICES (replace with actual implementations)
// ============================================

interface FileStorageService {
  uploadFile(path: string, file: Buffer, metadata: any): Promise<string>;
}

interface NotificationService {
  sendNotification(userId: string, message: string, metadata?: any): Promise<void>;
}

export default ExemptionManagementService;
export { 
  ExemptionCertificate, 
  ExemptionRule, 
  ExemptionValidationRequest, 
  ExemptionValidationResult,
  ExemptionAlert 
};