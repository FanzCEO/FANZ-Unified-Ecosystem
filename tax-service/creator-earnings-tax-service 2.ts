/**
 * Creator Earnings Tax Service
 * FANZ Unified Ecosystem - Tax Compliance
 * 
 * Handles creator earnings tax obligations including W-9/W-8 collection,
 * backup withholding, 1099 generation, and information reporting.
 */

import { Pool } from 'pg';
import { createHash } from 'crypto';

// ============================================
// INTERFACES & TYPES
// ============================================

interface CreatorTaxProfile {
  creatorId: string;
  tinType: 'ssn' | 'ein' | 'itin' | 'atin';
  tinStatus: 'pending' | 'validated' | 'invalid' | 'missing';
  encryptedTin?: string;
  tinHash?: string; // For duplicate detection without exposing TIN
  businessName?: string;
  legalName: string;
  businessType: 'individual' | 'sole_proprietorship' | 'partnership' | 'corporation' | 's_corporation' | 'llc' | 'estate_trust' | 'nonprofit';
  taxClassification: string;
  foreignStatus: 'us_person' | 'foreign_person' | 'unknown';
  w9FormData?: W9FormData;
  w8FormData?: W8FormData;
  backupWithholdingExempt: boolean;
  backupWithholdingCertified: boolean;
  fatcaExempt: boolean;
  consentDate?: Date;
  consentSource: 'web_form' | 'api' | 'email' | 'paper';
  verificationLevel: 'unverified' | 'basic' | 'enhanced' | 'identity_verified';
  riskScore: number; // 0-100, higher = higher risk
  createdAt: Date;
  updatedAt: Date;
}

interface W9FormData {
  name: string;
  businessName?: string;
  federalTaxClassification: string;
  exemptPayeeCode?: string;
  exemptFromFatca?: boolean;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zipCode: string;
  };
  accountNumbers?: string[];
  requesterNameAndAddress?: string;
  certificationDate: Date;
  perjuryStatement: boolean;
}

interface W8FormData {
  formType: 'W8BEN' | 'W8BEN_E' | 'W8ECI' | 'W8EXP' | 'W8IMY';
  name: string;
  countryOfCitizenship: string;
  foreignTaxIdentifyingNumber?: string;
  referenceNumber?: string;
  dateOfBirth?: Date;
  permanentResidenceAddress: {
    line1: string;
    line2?: string;
    city: string;
    stateOrProvince?: string;
    country: string;
    postalCode: string;
  };
  treatyBenefits?: {
    country: string;
    article: string;
    rate: number;
    typeOfIncome: string;
  };
  certificationDate: Date;
}

interface CreatorEarningsRecord {
  id: string;
  creatorId: string;
  payoutId: string;
  taxYear: number;
  quarter: number;
  earningsType: 'content_sales' | 'subscriptions' | 'tips' | 'donations' | 'platform_incentives' | 'referral_bonus';
  grossEarnings: number;
  platformFee: number;
  netEarnings: number;
  taxableAmount: number;
  backupWithheldAmount: number;
  federalTaxWithheldAmount: number;
  stateTaxWithheldAmount: number;
  paymentDate: Date;
  jurisdiction: string;
  metadata: {
    platformSource: string;
    transactionCount: number;
    averageTransactionAmount: number;
    paymentMethod: string;
    businessClassification?: string;
  };
  createdAt: Date;
}

interface InformationReturn {
  id: string;
  formType: '1099NEC' | '1099MISC' | '1099K';
  taxYear: number;
  creatorId: string;
  payerInfo: {
    name: string;
    address: string;
    tinType: string;
    tin: string;
  };
  payeeInfo: {
    name: string;
    address: string;
    tinType: string;
    tin?: string;
  };
  amounts: {
    box1?: number; // Non-employee compensation (1099-NEC)
    box2?: number; // Rents (1099-MISC)
    box3?: number; // Prizes and awards (1099-MISC)
    box4?: number; // Federal income tax withheld
    box5?: number; // Fishing boat proceeds (1099-MISC)
    box6?: number; // Medical and health care payments (1099-MISC)
    box7?: number; // Substitute payments (1099-MISC)
    // ... more boxes as needed
  };
  corrections: {
    isCorrection: boolean;
    originalReturnId?: string;
    correctionReason?: string;
  };
  transmissionInfo: {
    transmitterId: string;
    transmissionDate?: Date;
    controlCode?: string;
    batchId?: string;
    acknowledgmentReceived: boolean;
    acknowledgmentDate?: Date;
    errors: string[];
  };
  status: 'draft' | 'ready' | 'transmitted' | 'acknowledged' | 'rejected';
  filingDeadline: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface BackupWithholdingCalculation {
  creatorId: string;
  payoutAmount: number;
  withholdingRate: number; // Default 24%
  withholdingAmount: number;
  reason: 'no_tin' | 'incorrect_tin' | 'payee_notification' | 'reportable_payment';
  exemptionApplied: boolean;
  exemptionReason?: string;
  calculatedAt: Date;
}

interface TaxYearThresholds {
  taxYear: number;
  form1099NEC: {
    threshold: number; // $600 for non-employee compensation
    description: 'Non-employee compensation threshold';
  };
  form1099MISC: {
    threshold: number; // Various thresholds for different boxes
    description: 'Miscellaneous income thresholds';
  };
  form1099K: {
    threshold: number; // $20,000 and 200 transactions (changing to $600 in future)
    transactionThreshold: number;
    description: 'Payment card and third-party network transactions';
  };
  backupWithholding: {
    rate: number; // 24%
    description: 'Backup withholding rate';
  };
}

// ============================================
// CREATOR EARNINGS TAX SERVICE
// ============================================

export class CreatorEarningsTaxService {
  private db: Pool;
  private encryptionKey: string;

  constructor(db: Pool, encryptionKey: string) {
    this.db = db;
    this.encryptionKey = encryptionKey;
  }

  /**
   * Create or update creator tax profile
   */
  async createOrUpdateCreatorTaxProfile(
    creatorId: string,
    profileData: Partial<CreatorTaxProfile>
  ): Promise<CreatorTaxProfile> {
    try {
      console.log(`Creating/updating tax profile for creator: ${creatorId}`);

      // Encrypt TIN if provided
      let encryptedTin: string | undefined;
      let tinHash: string | undefined;
      
      if (profileData.tinType && profileData.encryptedTin) {
        encryptedTin = await this.encryptTin(profileData.encryptedTin);
        tinHash = this.createTinHash(profileData.encryptedTin);
      }

      // Check for duplicate TIN
      if (tinHash) {
        const existingProfile = await this.findCreatorByTinHash(tinHash);
        if (existingProfile && existingProfile.creatorId !== creatorId) {
          throw new Error('TIN already exists for another creator');
        }
      }

      // Calculate risk score
      const riskScore = this.calculateRiskScore(profileData);

      const profileId = await this.db.query(`
        INSERT INTO creator_tax_profiles (
          creator_id, tin_type, tin_status, encrypted_tin, tin_hash, business_name,
          legal_name, business_type, tax_classification, foreign_status, w9_form_data,
          w8_form_data, backup_withholding_exempt, backup_withholding_certified,
          fatca_exempt, consent_date, consent_source, verification_level, risk_score,
          created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW(), NOW())
        ON CONFLICT (creator_id)
        DO UPDATE SET
          tin_type = COALESCE($2, creator_tax_profiles.tin_type),
          tin_status = COALESCE($3, creator_tax_profiles.tin_status),
          encrypted_tin = COALESCE($4, creator_tax_profiles.encrypted_tin),
          tin_hash = COALESCE($5, creator_tax_profiles.tin_hash),
          business_name = COALESCE($6, creator_tax_profiles.business_name),
          legal_name = COALESCE($7, creator_tax_profiles.legal_name),
          business_type = COALESCE($8, creator_tax_profiles.business_type),
          tax_classification = COALESCE($9, creator_tax_profiles.tax_classification),
          foreign_status = COALESCE($10, creator_tax_profiles.foreign_status),
          w9_form_data = COALESCE($11, creator_tax_profiles.w9_form_data),
          w8_form_data = COALESCE($12, creator_tax_profiles.w8_form_data),
          backup_withholding_exempt = COALESCE($13, creator_tax_profiles.backup_withholding_exempt),
          backup_withholding_certified = COALESCE($14, creator_tax_profiles.backup_withholding_certified),
          fatca_exempt = COALESCE($15, creator_tax_profiles.fatca_exempt),
          consent_date = COALESCE($16, creator_tax_profiles.consent_date),
          consent_source = COALESCE($17, creator_tax_profiles.consent_source),
          verification_level = COALESCE($18, creator_tax_profiles.verification_level),
          risk_score = $19,
          updated_at = NOW()
        RETURNING *
      `, [
        creatorId,
        profileData.tinType,
        profileData.tinStatus,
        encryptedTin,
        tinHash,
        profileData.businessName,
        profileData.legalName,
        profileData.businessType,
        profileData.taxClassification,
        profileData.foreignStatus,
        profileData.w9FormData ? JSON.stringify(profileData.w9FormData) : null,
        profileData.w8FormData ? JSON.stringify(profileData.w8FormData) : null,
        profileData.backupWithholdingExempt,
        profileData.backupWithholdingCertified,
        profileData.fatcaExempt,
        profileData.consentDate,
        profileData.consentSource,
        profileData.verificationLevel,
        riskScore
      ]);

      // Create audit log
      await this.createAuditLog('profile_updated', creatorId, {
        changedFields: Object.keys(profileData),
        riskScore
      });

      return this.mapRowToCreatorTaxProfile(profileId.rows[0]);

    } catch (error) {
      console.error('Failed to create/update creator tax profile:', error);
      throw error;
    }
  }

  /**
   * Record creator earnings for tax purposes
   */
  async recordCreatorEarnings(
    creatorId: string,
    earningsData: Omit<CreatorEarningsRecord, 'id' | 'creatorId' | 'createdAt'>
  ): Promise<CreatorEarningsRecord> {
    try {
      console.log(`Recording earnings for creator: ${creatorId}`);

      const earningsId = `earnings_${Date.now()}_${creatorId}`;

      // Get creator tax profile to determine withholding requirements
      const profile = await this.getCreatorTaxProfile(creatorId);
      
      // Calculate backup withholding if required
      let backupWithheldAmount = earningsData.backupWithheldAmount;
      if (this.requiresBackupWithholding(profile)) {
        const withholding = this.calculateBackupWithholding(creatorId, earningsData.taxableAmount);
        backupWithheldAmount = withholding.withholdingAmount;
      }

      const result = await this.db.query(`
        INSERT INTO creator_earnings_records (
          id, creator_id, payout_id, tax_year, quarter, earnings_type,
          gross_earnings, platform_fee, net_earnings, taxable_amount,
          backup_withheld_amount, federal_tax_withheld_amount, state_tax_withheld_amount,
          payment_date, jurisdiction, metadata, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())
        RETURNING *
      `, [
        earningsId,
        creatorId,
        earningsData.payoutId,
        earningsData.taxYear,
        earningsData.quarter,
        earningsData.earningsType,
        earningsData.grossEarnings,
        earningsData.platformFee,
        earningsData.netEarnings,
        earningsData.taxableAmount,
        backupWithheldAmount,
        earningsData.federalTaxWithheldAmount,
        earningsData.stateTaxWithheldAmount,
        earningsData.paymentDate,
        earningsData.jurisdiction,
        JSON.stringify(earningsData.metadata)
      ]);

      // Update aggregated earnings for faster reporting
      await this.updateAggregatedEarnings(creatorId, earningsData.taxYear, earningsData.quarter);

      return this.mapRowToEarningsRecord(result.rows[0]);

    } catch (error) {
      console.error('Failed to record creator earnings:', error);
      throw error;
    }
  }

  /**
   * Generate 1099 forms for tax year
   */
  async generate1099Forms(taxYear: number): Promise<InformationReturn[]> {
    try {
      console.log(`Generating 1099 forms for tax year: ${taxYear}`);

      const thresholds = await this.getTaxYearThresholds(taxYear);
      const forms: InformationReturn[] = [];

      // Get creators with earnings above thresholds
      const creatorsWithEarnings = await this.getCreatorsAboveThreshold(taxYear, thresholds);

      for (const creator of creatorsWithEarnings) {
        const profile = await this.getCreatorTaxProfile(creator.creatorId);
        
        // Determine form type
        const formType = this.determineFormType(creator.totalEarnings, creator.earningsBreakdown);
        
        // Generate appropriate form
        let form: InformationReturn;
        
        switch (formType) {
          case '1099NEC':
            form = await this.generate1099NEC(creator, profile, taxYear);
            break;
          case '1099MISC':
            form = await this.generate1099MISC(creator, profile, taxYear);
            break;
          case '1099K':
            form = await this.generate1099K(creator, profile, taxYear);
            break;
          default:
            continue; // Skip if no form required
        }

        forms.push(form);
      }

      console.log(`Generated ${forms.length} 1099 forms for ${taxYear}`);
      return forms;

    } catch (error) {
      console.error('Failed to generate 1099 forms:', error);
      throw error;
    }
  }

  /**
   * Generate 1099-NEC form for non-employee compensation
   */
  private async generate1099NEC(
    creatorEarnings: any,
    profile: CreatorTaxProfile,
    taxYear: number
  ): Promise<InformationReturn> {
    const formId = `1099nec_${taxYear}_${creatorEarnings.creatorId}`;

    const form: InformationReturn = {
      id: formId,
      formType: '1099NEC',
      taxYear,
      creatorId: creatorEarnings.creatorId,
      payerInfo: {
        name: 'FANZ Technologies, Inc.',
        address: '123 Business St, San Francisco, CA 94105',
        tinType: 'ein',
        tin: '12-3456789' // This would be FANZ's EIN
      },
      payeeInfo: {
        name: profile.legalName,
        address: this.formatAddress(profile.w9FormData?.address || profile.w8FormData?.permanentResidenceAddress),
        tinType: profile.tinType,
        tin: profile.tinStatus === 'validated' ? await this.decryptTin(profile.encryptedTin!) : undefined
      },
      amounts: {
        box1: creatorEarnings.nonEmployeeCompensation, // Non-employee compensation
        box4: creatorEarnings.backupWithheld || 0 // Federal income tax withheld
      },
      corrections: {
        isCorrection: false
      },
      transmissionInfo: {
        transmitterId: 'FANZ001',
        acknowledgmentReceived: false,
        errors: []
      },
      status: 'draft',
      filingDeadline: new Date(`${taxYear + 1}-01-31`),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save to database
    await this.saveInformationReturn(form);
    
    return form;
  }

  /**
   * Calculate backup withholding requirements
   */
  private calculateBackupWithholding(
    creatorId: string,
    payoutAmount: number
  ): BackupWithholdingCalculation {
    const withholdingRate = 0.24; // 24% backup withholding rate
    const withholdingAmount = Math.round(payoutAmount * withholdingRate * 100) / 100;

    return {
      creatorId,
      payoutAmount,
      withholdingRate,
      withholdingAmount,
      reason: 'no_tin', // This would be determined by actual conditions
      exemptionApplied: false,
      calculatedAt: new Date()
    };
  }

  /**
   * Check if backup withholding is required
   */
  private requiresBackupWithholding(profile: CreatorTaxProfile): boolean {
    // Backup withholding is required if:
    // 1. No TIN provided
    // 2. Incorrect TIN
    // 3. IRS notified payer to withhold
    // 4. Payee failed to certify TIN

    if (profile.backupWithholdingExempt) {
      return false;
    }

    if (profile.tinStatus === 'missing' || profile.tinStatus === 'invalid') {
      return true;
    }

    if (!profile.backupWithholdingCertified) {
      return true;
    }

    return false;
  }

  /**
   * Validate TIN format and check digit
   */
  async validateTin(tin: string, tinType: string): Promise<{ valid: boolean; reason?: string }> {
    try {
      // Remove any formatting
      const cleanTin = tin.replace(/\D/g, '');

      switch (tinType) {
        case 'ssn':
          return this.validateSSN(cleanTin);
        case 'ein':
          return this.validateEIN(cleanTin);
        case 'itin':
          return this.validateITIN(cleanTin);
        case 'atin':
          return this.validateATIN(cleanTin);
        default:
          return { valid: false, reason: 'Invalid TIN type' };
      }

    } catch (error) {
      console.error('TIN validation failed:', error);
      return { valid: false, reason: 'Validation error' };
    }
  }

  /**
   * Get creator tax profile
   */
  async getCreatorTaxProfile(creatorId: string): Promise<CreatorTaxProfile | null> {
    const result = await this.db.query(`
      SELECT * FROM creator_tax_profiles WHERE creator_id = $1
    `, [creatorId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToCreatorTaxProfile(result.rows[0]);
  }

  /**
   * Get earnings summary for creator and tax year
   */
  async getCreatorEarningsSummary(
    creatorId: string,
    taxYear: number
  ): Promise<{
    totalEarnings: number;
    totalTaxableAmount: number;
    totalBackupWithheld: number;
    earningsByType: Record<string, number>;
    quarterlyBreakdown: Array<{
      quarter: number;
      earnings: number;
      taxableAmount: number;
    }>;
  }> {
    const result = await this.db.query(`
      SELECT 
        SUM(gross_earnings) as total_earnings,
        SUM(taxable_amount) as total_taxable_amount,
        SUM(backup_withheld_amount) as total_backup_withheld,
        earnings_type,
        quarter,
        SUM(gross_earnings) as quarterly_earnings,
        SUM(taxable_amount) as quarterly_taxable
      FROM creator_earnings_records
      WHERE creator_id = $1 AND tax_year = $2
      GROUP BY earnings_type, quarter
    `, [creatorId, taxYear]);

    const earningsByType: Record<string, number> = {};
    const quarterlyBreakdown: Array<{
      quarter: number;
      earnings: number;
      taxableAmount: number;
    }> = [];

    let totalEarnings = 0;
    let totalTaxableAmount = 0;
    let totalBackupWithheld = 0;

    for (const row of result.rows) {
      totalEarnings += parseFloat(row.total_earnings) || 0;
      totalTaxableAmount += parseFloat(row.total_taxable_amount) || 0;
      totalBackupWithheld += parseFloat(row.total_backup_withheld) || 0;

      earningsByType[row.earnings_type] = (earningsByType[row.earnings_type] || 0) + 
        (parseFloat(row.total_earnings) || 0);

      const existingQuarter = quarterlyBreakdown.find(q => q.quarter === row.quarter);
      if (existingQuarter) {
        existingQuarter.earnings += parseFloat(row.quarterly_earnings) || 0;
        existingQuarter.taxableAmount += parseFloat(row.quarterly_taxable) || 0;
      } else {
        quarterlyBreakdown.push({
          quarter: row.quarter,
          earnings: parseFloat(row.quarterly_earnings) || 0,
          taxableAmount: parseFloat(row.quarterly_taxable) || 0
        });
      }
    }

    return {
      totalEarnings,
      totalTaxableAmount,
      totalBackupWithheld,
      earningsByType,
      quarterlyBreakdown: quarterlyBreakdown.sort((a, b) => a.quarter - b.quarter)
    };
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  private async encryptTin(tin: string): Promise<string> {
    // Implement secure encryption using this.encryptionKey
    // This is a mock implementation
    return Buffer.from(tin).toString('base64');
  }

  private async decryptTin(encryptedTin: string): Promise<string> {
    // Implement secure decryption using this.encryptionKey
    // This is a mock implementation
    return Buffer.from(encryptedTin, 'base64').toString();
  }

  private createTinHash(tin: string): string {
    return createHash('sha256').update(tin + this.encryptionKey).digest('hex');
  }

  private async findCreatorByTinHash(tinHash: string): Promise<CreatorTaxProfile | null> {
    const result = await this.db.query(`
      SELECT * FROM creator_tax_profiles WHERE tin_hash = $1
    `, [tinHash]);

    return result.rows.length > 0 ? this.mapRowToCreatorTaxProfile(result.rows[0]) : null;
  }

  private calculateRiskScore(profileData: Partial<CreatorTaxProfile>): number {
    let score = 0;

    // Higher risk for missing/invalid TIN
    if (!profileData.tinStatus || profileData.tinStatus === 'missing') score += 40;
    if (profileData.tinStatus === 'invalid') score += 30;

    // Higher risk for foreign persons
    if (profileData.foreignStatus === 'foreign_person') score += 20;

    // Higher risk for unverified profiles
    if (!profileData.verificationLevel || profileData.verificationLevel === 'unverified') score += 20;

    // Higher risk for certain business types
    if (profileData.businessType === 'individual' && !profileData.businessName) score += 10;

    return Math.min(100, score);
  }

  private validateSSN(ssn: string): { valid: boolean; reason?: string } {
    if (ssn.length !== 9) {
      return { valid: false, reason: 'SSN must be 9 digits' };
    }

    // Additional SSN validation rules
    if (ssn === '000000000' || ssn === '123456789') {
      return { valid: false, reason: 'Invalid SSN pattern' };
    }

    if (ssn.startsWith('000') || ssn.startsWith('666') || ssn.startsWith('9')) {
      return { valid: false, reason: 'Invalid SSN area number' };
    }

    return { valid: true };
  }

  private validateEIN(ein: string): { valid: boolean; reason?: string } {
    if (ein.length !== 9) {
      return { valid: false, reason: 'EIN must be 9 digits' };
    }

    // EIN format: XX-XXXXXXX
    const validPrefixes = ['01', '02', '03', '04', '05', '06', '10', '11', '12', '13', '14', '15', '16', '20', '21', '22', '23', '24', '25', '26', '27', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48', '50', '51', '52', '53', '54', '55', '56', '57', '58', '59', '60', '61', '62', '63', '64', '65', '66', '67', '68', '71', '72', '73', '74', '75', '76', '77', '81', '82', '83', '84', '85', '86', '87', '88', '90', '91', '92', '93', '94', '95', '98', '99'];

    const prefix = ein.substring(0, 2);
    if (!validPrefixes.includes(prefix)) {
      return { valid: false, reason: 'Invalid EIN prefix' };
    }

    return { valid: true };
  }

  private validateITIN(itin: string): { valid: boolean; reason?: string } {
    if (itin.length !== 9) {
      return { valid: false, reason: 'ITIN must be 9 digits' };
    }

    // ITIN format: 9XX-XX-XXXX where middle digits are 70-88, 90-92, 94-99
    if (!itin.startsWith('9')) {
      return { valid: false, reason: 'ITIN must start with 9' };
    }

    const middleDigits = parseInt(itin.substring(3, 5));
    if (!((middleDigits >= 70 && middleDigits <= 88) || 
          (middleDigits >= 90 && middleDigits <= 92) || 
          (middleDigits >= 94 && middleDigits <= 99))) {
      return { valid: false, reason: 'Invalid ITIN middle digits' };
    }

    return { valid: true };
  }

  private validateATIN(atin: string): { valid: boolean; reason?: string } {
    if (atin.length !== 9) {
      return { valid: false, reason: 'ATIN must be 9 digits' };
    }

    // ATIN format: 9XX-XX-XXXX where middle digits are 50-65, 80-88
    if (!atin.startsWith('9')) {
      return { valid: false, reason: 'ATIN must start with 9' };
    }

    const middleDigits = parseInt(atin.substring(3, 5));
    if (!((middleDigits >= 50 && middleDigits <= 65) || 
          (middleDigits >= 80 && middleDigits <= 88))) {
      return { valid: false, reason: 'Invalid ATIN middle digits' };
    }

    return { valid: true };
  }

  private mapRowToCreatorTaxProfile(row: any): CreatorTaxProfile {
    return {
      creatorId: row.creator_id,
      tinType: row.tin_type,
      tinStatus: row.tin_status,
      encryptedTin: row.encrypted_tin,
      tinHash: row.tin_hash,
      businessName: row.business_name,
      legalName: row.legal_name,
      businessType: row.business_type,
      taxClassification: row.tax_classification,
      foreignStatus: row.foreign_status,
      w9FormData: row.w9_form_data ? JSON.parse(row.w9_form_data) : undefined,
      w8FormData: row.w8_form_data ? JSON.parse(row.w8_form_data) : undefined,
      backupWithholdingExempt: row.backup_withholding_exempt,
      backupWithholdingCertified: row.backup_withholding_certified,
      fatcaExempt: row.fatca_exempt,
      consentDate: row.consent_date,
      consentSource: row.consent_source,
      verificationLevel: row.verification_level,
      riskScore: row.risk_score,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapRowToEarningsRecord(row: any): CreatorEarningsRecord {
    return {
      id: row.id,
      creatorId: row.creator_id,
      payoutId: row.payout_id,
      taxYear: row.tax_year,
      quarter: row.quarter,
      earningsType: row.earnings_type,
      grossEarnings: parseFloat(row.gross_earnings),
      platformFee: parseFloat(row.platform_fee),
      netEarnings: parseFloat(row.net_earnings),
      taxableAmount: parseFloat(row.taxable_amount),
      backupWithheldAmount: parseFloat(row.backup_withheld_amount),
      federalTaxWithheldAmount: parseFloat(row.federal_tax_withheld_amount),
      stateTaxWithheldAmount: parseFloat(row.state_tax_withheld_amount),
      paymentDate: row.payment_date,
      jurisdiction: row.jurisdiction,
      metadata: JSON.parse(row.metadata),
      createdAt: row.created_at
    };
  }

  private formatAddress(address: any): string {
    if (!address) return '';
    
    let formatted = address.line1;
    if (address.line2) formatted += `, ${address.line2}`;
    formatted += `, ${address.city}`;
    if (address.state || address.stateOrProvince) {
      formatted += `, ${address.state || address.stateOrProvince}`;
    }
    formatted += ` ${address.zipCode || address.postalCode}`;
    if (address.country && address.country !== 'US') {
      formatted += `, ${address.country}`;
    }
    
    return formatted;
  }

  // Mock implementations for complex operations
  private async getTaxYearThresholds(taxYear: number): Promise<TaxYearThresholds> {
    return {
      taxYear,
      form1099NEC: {
        threshold: 600,
        description: 'Non-employee compensation threshold'
      },
      form1099MISC: {
        threshold: 600,
        description: 'Miscellaneous income thresholds'
      },
      form1099K: {
        threshold: 20000,
        transactionThreshold: 200,
        description: 'Payment card and third-party network transactions'
      },
      backupWithholding: {
        rate: 0.24,
        description: 'Backup withholding rate'
      }
    };
  }

  private async getCreatorsAboveThreshold(taxYear: number, thresholds: TaxYearThresholds): Promise<any[]> {
    // Mock implementation - would query database for creators above thresholds
    return [];
  }

  private determineFormType(totalEarnings: number, earningsBreakdown: any): string {
    // Logic to determine which form type to generate
    return '1099NEC';
  }

  private async generate1099MISC(creator: any, profile: CreatorTaxProfile, taxYear: number): Promise<InformationReturn> {
    // Implementation for 1099-MISC generation
    throw new Error('Not implemented');
  }

  private async generate1099K(creator: any, profile: CreatorTaxProfile, taxYear: number): Promise<InformationReturn> {
    // Implementation for 1099-K generation
    throw new Error('Not implemented');
  }

  private async saveInformationReturn(form: InformationReturn): Promise<void> {
    // Save form to database
    console.log(`Saving ${form.formType} for creator ${form.creatorId}`);
  }

  private async updateAggregatedEarnings(creatorId: string, taxYear: number, quarter: number): Promise<void> {
    // Update aggregated earnings table for faster reporting
    console.log(`Updating aggregated earnings for creator ${creatorId}, ${taxYear} Q${quarter}`);
  }

  private async createAuditLog(action: string, creatorId: string, details: any): Promise<void> {
    await this.db.query(`
      INSERT INTO creator_tax_audit_logs (
        id, action, creator_id, details, created_at
      )
      VALUES ($1, $2, $3, $4, NOW())
    `, [
      `log_${Date.now()}_${creatorId}`,
      action,
      creatorId,
      JSON.stringify(details)
    ]);
  }
}

export default CreatorEarningsTaxService;
export { 
  CreatorTaxProfile,
  W9FormData,
  W8FormData,
  CreatorEarningsRecord,
  InformationReturn,
  BackupWithholdingCalculation,
  TaxYearThresholds
};