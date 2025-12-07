import { storage } from './storage';
import { monitoringService } from './monitoringService';
import { serviceIntegrationService } from './serviceIntegrationService';
import crypto from 'crypto';

export enum ComplianceStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  UNDER_REVIEW = 'under_review'
}

export enum IDType {
  DRIVERS_LICENSE = 'drivers_license',
  PASSPORT = 'passport',
  CITIZENSHIP = 'citizenship',
  SOCIAL_SECURITY = 'social_security',
  OTHER = 'other'
}

export enum VerificationType {
  PRIMARY_STAR = 'primary_star',
  CO_STAR = 'co_star',
  AGE_VERIFICATION = 'age_verification'
}

export interface ComplianceData {
  legalName: string;
  stageName?: string;
  maidenName?: string;
  previousLegalName?: string;
  otherKnownNames?: string;
  dateOfBirth: Date;
  age: number;
  idType: IDType;
  idNumber: string;
  idState?: string;
  idCountry: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  cellPhone?: string;
  homePhone?: string;
  idImageUrl: string;
  signatureImageUrl?: string;
  verificationType: VerificationType;
}

export interface AuditAction {
  entityType: string;
  entityId: string;
  action: string;
  performedBy: string;
  ipAddress?: string;
  userAgent?: string;
  changes?: any;
  reason?: string;
}

export class ComplianceService {
  // Create new compliance record following US Law 2257
  async createComplianceRecord(
    userId: string,
    complianceData: ComplianceData,
    performedBy: string,
    ipAddress?: string
  ): Promise<{ id: string; status: ComplianceStatus }> {
    const recordId = crypto.randomUUID();

    // Validate age requirement (18+)
    const age = this.calculateAge(complianceData.dateOfBirth);
    if (age < 18) {
      throw new Error('Performer must be 18 years or older');
    }

    // Calculate expiration date (7 years as required by law)
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 7);

    const complianceRecord = {
      id: recordId,
      userId,
      ...complianceData,
      age,
      status: ComplianceStatus.PENDING,
      expiresAt,
      formData: {
        submissionDate: new Date(),
        ipAddress,
        userAgent: 'FanzLab Platform',
        legal2257Statement: 'I swear under penalty of perjury under 28 U.S.C. § 1746 that all information provided is true and correct.',
        termsAccepted: true,
        signatureDate: new Date()
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Store in database
    await storage.createComplianceRecord(complianceRecord);

    // Create audit log entry
    await this.createAuditEntry({
      entityType: 'compliance_records',
      entityId: recordId,
      action: 'created',
      performedBy,
      ipAddress,
      changes: { status: 'created', verificationType: complianceData.verificationType }
    });

    // Initiate age verification with MojoSign if needed
    if (complianceData.verificationType === VerificationType.AGE_VERIFICATION) {
      await this.initiateAgeVerification(userId, complianceData.idType, recordId);
    }

    console.log(`Compliance record created: ${recordId} for user ${userId}`);
    monitoringService.trackBusinessMetric('compliance_record_created', 1, {
      userId,
      verificationType: complianceData.verificationType,
      idType: complianceData.idType
    });

    return { id: recordId, status: ComplianceStatus.PENDING };
  }

  // Approve compliance record
  async approveComplianceRecord(
    recordId: string,
    approvedBy: string,
    reason?: string
  ): Promise<void> {
    const record = await storage.getComplianceRecord(recordId);
    if (!record) {
      throw new Error('Compliance record not found');
    }

    await storage.updateComplianceRecord(recordId, {
      status: ComplianceStatus.APPROVED,
      approvedBy,
      approvedAt: new Date(),
      updatedAt: new Date()
    });

    await this.createAuditEntry({
      entityType: 'compliance_records',
      entityId: recordId,
      action: 'approved',
      performedBy: approvedBy,
      reason: reason || 'Record approved after review',
      changes: { status: 'approved', approvedBy, approvedAt: new Date() }
    });

    // Sync to Perfect CRM
    await serviceIntegrationService.syncUserToCRM(record.userId, {
      ...record,
      isVerified: true,
      complianceStatus: 'approved'
    }, 'update');

    console.log(`Compliance record approved: ${recordId} by ${approvedBy}`);
    monitoringService.trackBusinessMetric('compliance_record_approved', 1, {
      recordId,
      approvedBy,
      verificationType: record.verificationType
    });
  }

  // Reject compliance record
  async rejectComplianceRecord(
    recordId: string,
    rejectedBy: string,
    reason: string
  ): Promise<void> {
    await storage.updateComplianceRecord(recordId, {
      status: ComplianceStatus.REJECTED,
      updatedAt: new Date()
    });

    await this.createAuditEntry({
      entityType: 'compliance_records',
      entityId: recordId,
      action: 'rejected',
      performedBy: rejectedBy,
      reason,
      changes: { status: 'rejected', rejectedBy, rejectedAt: new Date() }
    });

    console.log(`Compliance record rejected: ${recordId} by ${rejectedBy}`);
    monitoringService.trackBusinessMetric('compliance_record_rejected', 1, {
      recordId,
      rejectedBy,
      reason
    });
  }

  // Get compliance status for user
  async getUserComplianceStatus(userId: string): Promise<{
    isCompliant: boolean;
    records: any[];
    expirationDate?: Date;
  }> {
    const records = await storage.getUserComplianceRecords(userId);
    
    const approvedRecords = records.filter(r => 
      r.status === ComplianceStatus.APPROVED && 
      new Date(r.expiresAt) > new Date()
    );

    return {
      isCompliant: approvedRecords.length > 0,
      records: records,
      expirationDate: approvedRecords.length > 0 ? 
        new Date(Math.min(...approvedRecords.map(r => new Date(r.expiresAt).getTime()))) : 
        undefined
    };
  }

  // Verify co-star for post
  async verifyCostarForPost(
    postId: string,
    costarUserId: string,
    primaryCreatorId: string
  ): Promise<boolean> {
    const costarCompliance = await this.getUserComplianceStatus(costarUserId);
    const primaryCompliance = await this.getUserComplianceStatus(primaryCreatorId);

    if (!costarCompliance.isCompliant || !primaryCompliance.isCompliant) {
      return false;
    }

    // Create verification record
    const verificationId = crypto.randomUUID();
    await storage.createCostarVerification({
      id: verificationId,
      primaryCreatorId,
      costarUserId,
      postId,
      contentCreationDate: new Date(),
      status: ComplianceStatus.APPROVED,
      formCompletedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await this.createAuditEntry({
      entityType: 'costar_verifications',
      entityId: verificationId,
      action: 'created',
      performedBy: primaryCreatorId,
      changes: { postId, costarUserId, status: 'approved' }
    });

    return true;
  }

  // Get compliance records requiring review
  async getRecordsForReview(limit: number = 50): Promise<any[]> {
    return await storage.getComplianceRecordsByStatus(ComplianceStatus.PENDING, limit);
  }

  // Enhanced compliance monitoring with international law support
  async checkExpiringRecords(): Promise<void> {
    const expiringRecords = await storage.getExpiringComplianceRecords(30); // 30 days notice
    
    for (const record of expiringRecords) {
      // Multi-notification approach
      await Promise.all([
        serviceIntegrationService.sendPushNotification(
          [record.userId],
          '2257 Compliance Expiring',
          'Your verification documents expire in 30 days. Please renew to continue creating content.',
          { recordId: record.id, expiresAt: record.expiresAt }
        ),
        serviceIntegrationService.sendEmail(
          record.userId,
          'Compliance Renewal Required',
          this.generateComplianceRenewalEmail(record)
        ),
        this.scheduleComplianceReminder(record.userId, 14), // 14-day follow-up
        this.scheduleComplianceReminder(record.userId, 7),  // 7-day follow-up
      ]);
    }
  }

  // Automated compliance auditing
  async performComplianceAudit(userId?: string): Promise<{
    overallScore: number;
    violations: any[];
    recommendations: string[];
    urgentActions: string[];
    nextAuditDate: Date;
  }> {
    const auditResults = {
      overallScore: 0,
      violations: [] as any[],
      recommendations: [] as string[],
      urgentActions: [] as string[],
      nextAuditDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
    };

    // Check 2257 compliance
    const complianceRecords = userId ? 
      await storage.getUserComplianceRecords(userId) : 
      await storage.getAllComplianceRecords();

    let complianceScore = 100;

    for (const record of complianceRecords) {
      // Check document validity
      if (record.status !== 'approved') {
        auditResults.violations.push({
          type: 'unapproved_compliance',
          userId: record.userId,
          severity: 'critical',
          description: 'User has unapproved compliance record'
        });
        complianceScore -= 25;
        auditResults.urgentActions.push(`Review compliance for user ${record.userId}`);
      }

      // Check expiration dates
      const daysUntilExpiry = Math.floor((new Date(record.expiresAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
      if (daysUntilExpiry < 30) {
        auditResults.violations.push({
          type: 'expiring_compliance',
          userId: record.userId,
          severity: 'high',
          description: `Compliance expires in ${daysUntilExpiry} days`
        });
        complianceScore -= 10;
        auditResults.recommendations.push(`Contact user ${record.userId} for renewal`);
      }
    }

    // Check for missing co-star verifications
    const unverifiedContent = await storage.getUnverifiedCostarContent();
    for (const content of unverifiedContent) {
      auditResults.violations.push({
        type: 'unverified_costar',
        contentId: content.id,
        severity: 'high',
        description: 'Content with unverified co-star participants'
      });
      complianceScore -= 15;
      auditResults.urgentActions.push(`Verify co-stars for content ${content.id}`);
    }

    // International compliance check
    const internationalViolations = await this.checkInternationalCompliance();
    auditResults.violations.push(...internationalViolations);

    auditResults.overallScore = Math.max(complianceScore, 0);

    return auditResults;
  }

  // International law compliance checker
  async checkInternationalCompliance(): Promise<any[]> {
    const violations = [];

    // GDPR compliance (EU)
    const gdprViolations = await this.checkGDPRCompliance();
    violations.push(...gdprViolations);

    // PIPEDA compliance (Canada) 
    const pipedaViolations = await this.checkPIPEDACompliance();
    violations.push(...pipedaViolations);

    // Age verification laws by country
    const ageVerificationViolations = await this.checkAgeVerificationByCountry();
    violations.push(...ageVerificationViolations);

    return violations;
  }

  private async checkGDPRCompliance(): Promise<any[]> {
    const violations = [];
    
    // Check for users in EU without explicit consent
    const euUsers = await storage.getUsersByRegion('EU');
    for (const user of euUsers) {
      if (!user.gdprConsent) {
        violations.push({
          type: 'gdpr_consent_missing',
          userId: user.id,
          severity: 'critical',
          description: 'EU user without GDPR consent'
        });
      }

      // Check data retention
      const dataAge = Date.now() - new Date(user.createdAt).getTime();
      const maxRetention = 7 * 365 * 24 * 60 * 60 * 1000; // 7 years
      if (dataAge > maxRetention && !user.activeConsent) {
        violations.push({
          type: 'gdpr_retention_violation',
          userId: user.id,
          severity: 'high',
          description: 'Data retained beyond GDPR limits without active consent'
        });
      }
    }

    return violations;
  }

  private async checkPIPEDACompliance(): Promise<any[]> {
    const violations = [];
    
    const canadianUsers = await storage.getUsersByCountry('CA');
    for (const user of canadianUsers) {
      if (!user.pipedaConsent) {
        violations.push({
          type: 'pipeda_consent_missing',
          userId: user.id,
          severity: 'high',
          description: 'Canadian user without PIPEDA consent'
        });
      }
    }

    return violations;
  }

  private async checkAgeVerificationByCountry(): Promise<any[]> {
    const violations = [];
    
    // Different countries have different age verification requirements
    const countryRequirements = {
      'UK': { minAge: 18, strictVerification: true },
      'AU': { minAge: 18, strictVerification: true },
      'DE': { minAge: 18, strictVerification: true },
      'FR': { minAge: 18, strictVerification: true },
      'US': { minAge: 18, strictVerification: false }
    };

    for (const [country, requirements] of Object.entries(countryRequirements)) {
      const users = await storage.getUsersByCountry(country);
      for (const user of users) {
        if (user.age < requirements.minAge) {
          violations.push({
            type: 'age_verification_violation',
            userId: user.id,
            country,
            severity: 'critical',
            description: `User under minimum age for ${country}`
          });
        }

        if (requirements.strictVerification && !user.strictVerificationCompleted) {
          violations.push({
            type: 'strict_verification_required',
            userId: user.id,
            country,
            severity: 'high',
            description: `Strict age verification required for ${country}`
          });
        }
      }
    }

    return violations;
  }

  private generateComplianceRenewalEmail(record: any): string {
    return `
      <html>
        <body>
          <h2>Important: Compliance Renewal Required</h2>
          <p>Dear Creator,</p>
          <p>Your 2257 compliance documentation is scheduled to expire on ${new Date(record.expiresAt).toLocaleDateString()}.</p>
          <p>To continue creating content on FansLab, please renew your documentation by:</p>
          <ul>
            <li>Uploading updated identification documents</li>
            <li>Completing the new compliance form</li>
            <li>Scheduling a verification call if required</li>
          </ul>
          <p><a href="${process.env.FRONTEND_URL}/compliance/renew?token=${record.id}">Renew Now</a></p>
          <p>If you have questions, contact our compliance team at compliance@fanslab.com</p>
        </body>
      </html>
    `;
  }

  private async scheduleComplianceReminder(userId: string, daysFromNow: number): Promise<void> {
    // Schedule reminder notification
    const reminderDate = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
    
    // In production, this would integrate with a job scheduler
    console.log(`Scheduling compliance reminder for user ${userId} on ${reminderDate}`);
  }

  // Generate 2257 compliance statement
  generateComplianceStatement(baseUrl: string): string {
    return `18 U.S.C. 2257 Record-Keeping Requirements Compliance Statement

All models, actors, actresses and other persons that appear in any visual depiction of actual sexually explicit conduct appearing or otherwise contained in or at this website were over the age of eighteen years at the time of the creation of such depictions.

All other visual depictions displayed on this website are exempt from the provision of 18 U.S.C. Section 2257 and 28 C.F.R. 75 because said visual depictions do not portray conduct as specifically listed in 18 U.S.C Section 2256 (2)(A) through (D), but are merely indicative of the type of content available.

The records required by 18 U.S.C. Section 2257 are kept by the Custodian of Records at:

Fanz™ Unlimited Network (FUN) L.L.C.
Custodian of Records
30 N Gould Street #45302
Sheridan, WY 82801

Records are available for inspection during regular business hours, Monday through Friday, 9:00 AM to 5:00 PM Mountain Time, excluding federal holidays.

This statement and our records are maintained in compliance with federal regulations and are subject to inspection by authorized federal agents.`;
  }

  // Helper methods
  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  private async initiateAgeVerification(
    userId: string,
    idType: IDType,
    recordId: string
  ): Promise<void> {
    const returnUrl = `${process.env.BASE_URL}/compliance/verify-complete?record=${recordId}`;
    
    await serviceIntegrationService.initiateAgeVerification(
      userId,
      idType as any,
      returnUrl
    );
  }

  private async createAuditEntry(auditData: AuditAction): Promise<void> {
    const auditId = crypto.randomUUID();
    
    // Calculate retention date (7 years as required by law)
    const retentionUntil = new Date();
    retentionUntil.setFullYear(retentionUntil.getFullYear() + 7);

    const auditEntry = {
      id: auditId,
      ...auditData,
      timestamp: new Date(),
      retentionUntil
    };

    await storage.createAuditEntry(auditEntry);
  }

  // Database cleanup for expired records
  async cleanupExpiredRecords(): Promise<void> {
    const expiredRecords = await storage.getExpiredAuditEntries();
    
    for (const record of expiredRecords) {
      await storage.deleteAuditEntry(record.id);
    }

    console.log(`Cleaned up ${expiredRecords.length} expired audit entries`);
  }
}

export const complianceService = new ComplianceService();

// Run compliance checks every 24 hours
setInterval(() => {
  complianceService.checkExpiringRecords();
  complianceService.cleanupExpiredRecords();
}, 24 * 60 * 60 * 1000);