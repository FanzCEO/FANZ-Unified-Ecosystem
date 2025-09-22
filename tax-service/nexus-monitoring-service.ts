/**
 * Economic Nexus Monitoring Service
 * FANZ Unified Ecosystem - Tax Compliance
 * 
 * Monitors transaction volumes and revenue by jurisdiction to determine
 * when economic nexus thresholds are reached and tax registration is required.
 */

import { Pool } from 'pg';

// ============================================
// INTERFACES & TYPES
// ============================================

interface NexusThreshold {
  jurisdictionId: string;
  jurisdictionName: string;
  jurisdictionCode: string;
  thresholdType: 'revenue' | 'transactions' | 'both';
  revenueThreshold?: number; // e.g., $100,000
  transactionThreshold?: number; // e.g., 200 transactions
  lookbackPeriod: 'current_year' | 'rolling_12_months' | 'calendar_year';
  effectiveDate: Date;
  isActive: boolean;
  metadata: {
    remoteSellerLaw?: string;
    marketplaceFacilitatorLaw?: string;
    notes?: string;
    source?: string;
    lastUpdated: Date;
  };
}

interface NexusMetrics {
  jurisdictionId: string;
  periodStart: Date;
  periodEnd: Date;
  totalRevenue: number;
  totalTransactions: number;
  totalTaxCollected: number;
  uniqueCustomers: number;
  platformBreakdown: Record<string, {
    revenue: number;
    transactions: number;
    taxCollected: number;
  }>;
  lastUpdated: Date;
}

interface NexusStatus {
  jurisdictionId: string;
  jurisdictionName: string;
  jurisdictionCode: string;
  thresholdMet: boolean;
  registrationRequired: boolean;
  registrationStatus: 'not_required' | 'required' | 'pending' | 'registered' | 'expired';
  currentMetrics: {
    revenue: number;
    transactions: number;
    revenueProgress: number; // Percentage of threshold
    transactionProgress: number; // Percentage of threshold
  };
  thresholds: {
    revenue?: number;
    transactions?: number;
  };
  projectedThresholdDate?: Date;
  registrationDeadline?: Date;
  lastEvaluated: Date;
  alerts: NexusAlert[];
}

interface NexusAlert {
  id: string;
  type: 'threshold_warning' | 'threshold_exceeded' | 'registration_required' | 'deadline_approaching';
  severity: 'info' | 'warning' | 'critical';
  jurisdictionId: string;
  message: string;
  details: Record<string, any>;
  createdAt: Date;
  acknowledged: boolean;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
}

interface NexusRegistration {
  id: string;
  jurisdictionId: string;
  jurisdictionName: string;
  registrationNumber?: string;
  registrationDate?: Date;
  expirationDate?: Date;
  status: 'not_required' | 'required' | 'pending' | 'registered' | 'expired' | 'cancelled';
  filingFrequency?: 'monthly' | 'quarterly' | 'annually';
  nextFilingDue?: Date;
  contactInfo?: {
    registeredAgent?: string;
    businessAddress?: string;
    phoneNumber?: string;
    email?: string;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// NEXUS MONITORING SERVICE
// ============================================

export class NexusMonitoringService {
  private db: Pool;
  private thresholds: Map<string, NexusThreshold> = new Map();

  constructor(db: Pool) {
    this.db = db;
    this.loadThresholds();
  }

  /**
   * Load nexus thresholds from database
   */
  private async loadThresholds(): Promise<void> {
    try {
      const result = await this.db.query(`
        SELECT 
          jurisdiction_id,
          jurisdiction_name,
          jurisdiction_code,
          threshold_type,
          revenue_threshold,
          transaction_threshold,
          lookback_period,
          effective_date,
          is_active,
          metadata
        FROM nexus_thresholds 
        WHERE is_active = true
        ORDER BY jurisdiction_code
      `);

      this.thresholds.clear();
      for (const row of result.rows) {
        const threshold: NexusThreshold = {
          jurisdictionId: row.jurisdiction_id,
          jurisdictionName: row.jurisdiction_name,
          jurisdictionCode: row.jurisdiction_code,
          thresholdType: row.threshold_type,
          revenueThreshold: row.revenue_threshold,
          transactionThreshold: row.transaction_threshold,
          lookbackPeriod: row.lookback_period,
          effectiveDate: row.effective_date,
          isActive: row.is_active,
          metadata: row.metadata
        };
        
        this.thresholds.set(row.jurisdiction_id, threshold);
      }

      console.log(`Loaded ${this.thresholds.size} nexus thresholds`);

    } catch (error) {
      console.error('Failed to load nexus thresholds:', error);
      throw error;
    }
  }

  /**
   * Daily aggregation job to update nexus metrics
   */
  async runDailyAggregation(): Promise<void> {
    try {
      console.log('Starting daily nexus metrics aggregation...');

      const jurisdictions = Array.from(this.thresholds.keys());
      
      for (const jurisdictionId of jurisdictions) {
        await this.updateJurisdictionMetrics(jurisdictionId);
      }

      // Evaluate all nexus statuses after metrics update
      await this.evaluateAllNexusStatuses();

      console.log('Daily nexus aggregation completed successfully');

    } catch (error) {
      console.error('Daily nexus aggregation failed:', error);
      throw error;
    }
  }

  /**
   * Update metrics for a specific jurisdiction
   */
  private async updateJurisdictionMetrics(jurisdictionId: string): Promise<void> {
    const threshold = this.thresholds.get(jurisdictionId);
    if (!threshold) return;

    try {
      // Calculate date range based on lookback period
      const { periodStart, periodEnd } = this.calculatePeriodRange(threshold.lookbackPeriod);

      // Aggregate transaction data for the jurisdiction
      const result = await this.db.query(`
        WITH jurisdiction_transactions AS (
          SELECT 
            tc.id,
            tc.subtotal_amount,
            tc.tax_amount,
            tc.total_amount,
            tc.currency,
            tc.created_at,
            tcl.customer_id,
            tcl.platform,
            tcl.metadata
          FROM tax_calculations tc
          JOIN tax_calculation_lines tcl ON tc.id = tcl.tax_calculation_id
          JOIN tax_transaction_links ttl ON tc.id = ttl.tax_calculation_id
          WHERE tcl.jurisdiction_id = $1
            AND tc.status = 'committed'
            AND tc.created_at >= $2
            AND tc.created_at <= $3
        ),
        platform_metrics AS (
          SELECT 
            jt.platform,
            SUM(jt.subtotal_amount) as revenue,
            COUNT(*) as transactions,
            SUM(jt.tax_amount) as tax_collected
          FROM jurisdiction_transactions jt
          GROUP BY jt.platform
        )
        SELECT 
          SUM(jt.subtotal_amount) as total_revenue,
          COUNT(*) as total_transactions,
          SUM(jt.tax_amount) as total_tax_collected,
          COUNT(DISTINCT jt.customer_id) as unique_customers,
          COALESCE(
            json_object_agg(
              pm.platform, 
              json_build_object(
                'revenue', pm.revenue,
                'transactions', pm.transactions,
                'taxCollected', pm.tax_collected
              )
            ) FILTER (WHERE pm.platform IS NOT NULL),
            '{}'::json
          ) as platform_breakdown
        FROM jurisdiction_transactions jt
        LEFT JOIN platform_metrics pm ON jt.platform = pm.platform
      `, [jurisdictionId, periodStart, periodEnd]);

      const row = result.rows[0];
      if (!row || !row.total_revenue) {
        // No transactions for this jurisdiction in this period
        console.log(`No transactions found for jurisdiction ${jurisdictionId}`);
        return;
      }

      const metrics: NexusMetrics = {
        jurisdictionId,
        periodStart,
        periodEnd,
        totalRevenue: parseFloat(row.total_revenue) || 0,
        totalTransactions: parseInt(row.total_transactions) || 0,
        totalTaxCollected: parseFloat(row.total_tax_collected) || 0,
        uniqueCustomers: parseInt(row.unique_customers) || 0,
        platformBreakdown: row.platform_breakdown || {},
        lastUpdated: new Date()
      };

      // Upsert metrics
      await this.db.query(`
        INSERT INTO nexus_metrics (
          jurisdiction_id,
          period_start,
          period_end,
          total_revenue,
          total_transactions,
          total_tax_collected,
          unique_customers,
          platform_breakdown,
          last_updated
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (jurisdiction_id, period_start, period_end)
        DO UPDATE SET
          total_revenue = EXCLUDED.total_revenue,
          total_transactions = EXCLUDED.total_transactions,
          total_tax_collected = EXCLUDED.total_tax_collected,
          unique_customers = EXCLUDED.unique_customers,
          platform_breakdown = EXCLUDED.platform_breakdown,
          last_updated = EXCLUDED.last_updated
      `, [
        metrics.jurisdictionId,
        metrics.periodStart,
        metrics.periodEnd,
        metrics.totalRevenue,
        metrics.totalTransactions,
        metrics.totalTaxCollected,
        metrics.uniqueCustomers,
        JSON.stringify(metrics.platformBreakdown),
        metrics.lastUpdated
      ]);

      console.log(`Updated metrics for ${jurisdictionId}: $${metrics.totalRevenue}, ${metrics.totalTransactions} transactions`);

    } catch (error) {
      console.error(`Failed to update metrics for jurisdiction ${jurisdictionId}:`, error);
      throw error;
    }
  }

  /**
   * Calculate period range based on lookback configuration
   */
  private calculatePeriodRange(lookbackPeriod: string): { periodStart: Date; periodEnd: Date } {
    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date = now;

    switch (lookbackPeriod) {
      case 'current_year':
        periodStart = new Date(now.getFullYear(), 0, 1); // Jan 1st of current year
        break;
      
      case 'calendar_year':
        periodStart = new Date(now.getFullYear(), 0, 1); // Jan 1st of current year
        periodEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59); // Dec 31st of current year
        break;
      
      case 'rolling_12_months':
      default:
        periodStart = new Date(now);
        periodStart.setFullYear(periodStart.getFullYear() - 1); // 12 months ago
        break;
    }

    return { periodStart, periodEnd };
  }

  /**
   * Evaluate nexus status for all jurisdictions
   */
  async evaluateAllNexusStatuses(): Promise<NexusStatus[]> {
    const statuses: NexusStatus[] = [];

    for (const [jurisdictionId, threshold] of this.thresholds) {
      try {
        const status = await this.evaluateNexusStatus(jurisdictionId);
        statuses.push(status);

        // Generate alerts if thresholds are approaching or exceeded
        await this.generateNexusAlerts(status);

      } catch (error) {
        console.error(`Failed to evaluate nexus status for ${jurisdictionId}:`, error);
      }
    }

    return statuses;
  }

  /**
   * Evaluate nexus status for a specific jurisdiction
   */
  async evaluateNexusStatus(jurisdictionId: string): Promise<NexusStatus> {
    const threshold = this.thresholds.get(jurisdictionId);
    if (!threshold) {
      throw new Error(`No threshold found for jurisdiction ${jurisdictionId}`);
    }

    // Get current metrics
    const metricsResult = await this.db.query(`
      SELECT 
        total_revenue,
        total_transactions,
        period_start,
        period_end,
        last_updated
      FROM nexus_metrics
      WHERE jurisdiction_id = $1
      ORDER BY last_updated DESC
      LIMIT 1
    `, [jurisdictionId]);

    const metrics = metricsResult.rows[0];
    const currentRevenue = metrics ? parseFloat(metrics.total_revenue) : 0;
    const currentTransactions = metrics ? parseInt(metrics.total_transactions) : 0;

    // Calculate progress percentages
    const revenueProgress = threshold.revenueThreshold ? 
      Math.min(100, (currentRevenue / threshold.revenueThreshold) * 100) : 0;
    
    const transactionProgress = threshold.transactionThreshold ? 
      Math.min(100, (currentTransactions / threshold.transactionThreshold) * 100) : 0;

    // Determine if thresholds are met
    let thresholdMet = false;
    if (threshold.thresholdType === 'revenue' && threshold.revenueThreshold) {
      thresholdMet = currentRevenue >= threshold.revenueThreshold;
    } else if (threshold.thresholdType === 'transactions' && threshold.transactionThreshold) {
      thresholdMet = currentTransactions >= threshold.transactionThreshold;
    } else if (threshold.thresholdType === 'both') {
      const revenueThresholdMet = threshold.revenueThreshold ? currentRevenue >= threshold.revenueThreshold : false;
      const transactionThresholdMet = threshold.transactionThreshold ? currentTransactions >= threshold.transactionThreshold : false;
      thresholdMet = revenueThresholdMet || transactionThresholdMet;
    }

    // Get registration status
    const registrationResult = await this.db.query(`
      SELECT status, registration_date, expiration_date
      FROM nexus_registrations
      WHERE jurisdiction_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `, [jurisdictionId]);

    const registration = registrationResult.rows[0];
    const registrationStatus = registration ? registration.status : 'not_required';
    const registrationRequired = thresholdMet && registrationStatus === 'not_required';

    // Get existing alerts
    const alertsResult = await this.db.query(`
      SELECT id, type, severity, message, details, created_at, acknowledged
      FROM nexus_alerts
      WHERE jurisdiction_id = $1 
        AND acknowledged = false
      ORDER BY created_at DESC
    `, [jurisdictionId]);

    const alerts = alertsResult.rows.map(row => ({
      id: row.id,
      type: row.type,
      severity: row.severity,
      jurisdictionId,
      message: row.message,
      details: row.details,
      createdAt: row.created_at,
      acknowledged: row.acknowledged,
      acknowledgedAt: row.acknowledged_at,
      acknowledgedBy: row.acknowledged_by
    }));

    // Project when threshold might be reached (if not already met)
    let projectedThresholdDate: Date | undefined;
    if (!thresholdMet && metrics) {
      projectedThresholdDate = this.projectThresholdDate(
        currentRevenue,
        currentTransactions,
        threshold,
        new Date(metrics.period_start),
        new Date(metrics.last_updated)
      );
    }

    const status: NexusStatus = {
      jurisdictionId,
      jurisdictionName: threshold.jurisdictionName,
      jurisdictionCode: threshold.jurisdictionCode,
      thresholdMet,
      registrationRequired,
      registrationStatus,
      currentMetrics: {
        revenue: currentRevenue,
        transactions: currentTransactions,
        revenueProgress,
        transactionProgress
      },
      thresholds: {
        revenue: threshold.revenueThreshold,
        transactions: threshold.transactionThreshold
      },
      projectedThresholdDate,
      registrationDeadline: registrationRequired ? this.calculateRegistrationDeadline(jurisdictionId) : undefined,
      lastEvaluated: new Date(),
      alerts
    };

    return status;
  }

  /**
   * Project when threshold might be reached based on current trends
   */
  private projectThresholdDate(
    currentRevenue: number,
    currentTransactions: number,
    threshold: NexusThreshold,
    periodStart: Date,
    lastUpdate: Date
  ): Date | undefined {
    const daysSinceStart = Math.ceil((lastUpdate.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceStart <= 0) return undefined;

    const dailyRevenueRate = currentRevenue / daysSinceStart;
    const dailyTransactionRate = currentTransactions / daysSinceStart;

    let daysToThreshold: number | undefined;

    if (threshold.thresholdType === 'revenue' && threshold.revenueThreshold && dailyRevenueRate > 0) {
      const remainingRevenue = threshold.revenueThreshold - currentRevenue;
      if (remainingRevenue > 0) {
        daysToThreshold = Math.ceil(remainingRevenue / dailyRevenueRate);
      }
    } else if (threshold.thresholdType === 'transactions' && threshold.transactionThreshold && dailyTransactionRate > 0) {
      const remainingTransactions = threshold.transactionThreshold - currentTransactions;
      if (remainingTransactions > 0) {
        daysToThreshold = Math.ceil(remainingTransactions / dailyTransactionRate);
      }
    } else if (threshold.thresholdType === 'both') {
      const revenueDays = threshold.revenueThreshold && dailyRevenueRate > 0 ? 
        Math.ceil((threshold.revenueThreshold - currentRevenue) / dailyRevenueRate) : Infinity;
      
      const transactionDays = threshold.transactionThreshold && dailyTransactionRate > 0 ? 
        Math.ceil((threshold.transactionThreshold - currentTransactions) / dailyTransactionRate) : Infinity;
      
      daysToThreshold = Math.min(revenueDays, transactionDays);
      if (daysToThreshold === Infinity) daysToThreshold = undefined;
    }

    if (daysToThreshold) {
      const projectedDate = new Date();
      projectedDate.setDate(projectedDate.getDate() + daysToThreshold);
      return projectedDate;
    }

    return undefined;
  }

  /**
   * Calculate registration deadline (typically 30 days after threshold is met)
   */
  private calculateRegistrationDeadline(jurisdictionId: string): Date {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 30); // Default 30 days
    return deadline;
  }

  /**
   * Generate alerts based on nexus status
   */
  private async generateNexusAlerts(status: NexusStatus): Promise<void> {
    const alerts: Omit<NexusAlert, 'id' | 'createdAt' | 'acknowledged'>[] = [];

    // Threshold warning (80% of threshold)
    if (!status.thresholdMet) {
      if (status.currentMetrics.revenueProgress >= 80 || status.currentMetrics.transactionProgress >= 80) {
        alerts.push({
          type: 'threshold_warning',
          severity: 'warning',
          jurisdictionId: status.jurisdictionId,
          message: `Approaching nexus threshold in ${status.jurisdictionName}`,
          details: {
            revenueProgress: status.currentMetrics.revenueProgress,
            transactionProgress: status.currentMetrics.transactionProgress,
            projectedDate: status.projectedThresholdDate
          }
        });
      }
    }

    // Threshold exceeded
    if (status.thresholdMet && status.registrationStatus === 'not_required') {
      alerts.push({
        type: 'threshold_exceeded',
        severity: 'critical',
        jurisdictionId: status.jurisdictionId,
        message: `Economic nexus threshold exceeded in ${status.jurisdictionName}`,
        details: {
          currentRevenue: status.currentMetrics.revenue,
          currentTransactions: status.currentMetrics.transactions,
          registrationDeadline: status.registrationDeadline
        }
      });
    }

    // Registration required
    if (status.registrationRequired) {
      alerts.push({
        type: 'registration_required',
        severity: 'critical',
        jurisdictionId: status.jurisdictionId,
        message: `Tax registration required in ${status.jurisdictionName}`,
        details: {
          deadline: status.registrationDeadline,
          thresholdMetDate: new Date() // When threshold was met
        }
      });
    }

    // Registration deadline approaching
    if (status.registrationDeadline && status.registrationStatus === 'required') {
      const daysUntilDeadline = Math.ceil(
        (status.registrationDeadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilDeadline <= 7) {
        alerts.push({
          type: 'deadline_approaching',
          severity: 'critical',
          jurisdictionId: status.jurisdictionId,
          message: `Registration deadline approaching in ${status.jurisdictionName} (${daysUntilDeadline} days)`,
          details: {
            deadline: status.registrationDeadline,
            daysRemaining: daysUntilDeadline
          }
        });
      } else if (daysUntilDeadline <= 14) {
        alerts.push({
          type: 'deadline_approaching',
          severity: 'warning',
          jurisdictionId: status.jurisdictionId,
          message: `Registration deadline in ${status.jurisdictionName} (${daysUntilDeadline} days)`,
          details: {
            deadline: status.registrationDeadline,
            daysRemaining: daysUntilDeadline
          }
        });
      }
    }

    // Insert new alerts (avoiding duplicates)
    for (const alert of alerts) {
      try {
        await this.db.query(`
          INSERT INTO nexus_alerts (
            type, severity, jurisdiction_id, message, details, created_at, acknowledged
          )
          SELECT $1, $2, $3, $4, $5, $6, $7
          WHERE NOT EXISTS (
            SELECT 1 FROM nexus_alerts 
            WHERE jurisdiction_id = $3 
              AND type = $1 
              AND acknowledged = false
              AND created_at > NOW() - INTERVAL '24 hours'
          )
        `, [
          alert.type,
          alert.severity,
          alert.jurisdictionId,
          alert.message,
          JSON.stringify(alert.details),
          new Date(),
          false
        ]);
      } catch (error) {
        console.error(`Failed to create alert for ${status.jurisdictionId}:`, error);
      }
    }
  }

  /**
   * Get nexus status for all jurisdictions
   */
  async getAllNexusStatuses(): Promise<NexusStatus[]> {
    return this.evaluateAllNexusStatuses();
  }

  /**
   * Get nexus status for a specific jurisdiction
   */
  async getNexusStatus(jurisdictionId: string): Promise<NexusStatus> {
    return this.evaluateNexusStatus(jurisdictionId);
  }

  /**
   * Get all unacknowledged alerts
   */
  async getUnacknowledgedAlerts(): Promise<NexusAlert[]> {
    const result = await this.db.query(`
      SELECT 
        id, type, severity, jurisdiction_id, message, details, 
        created_at, acknowledged, acknowledged_at, acknowledged_by
      FROM nexus_alerts
      WHERE acknowledged = false
      ORDER BY severity DESC, created_at DESC
    `);

    return result.rows.map(row => ({
      id: row.id,
      type: row.type,
      severity: row.severity,
      jurisdictionId: row.jurisdiction_id,
      message: row.message,
      details: row.details,
      createdAt: row.created_at,
      acknowledged: row.acknowledged,
      acknowledgedAt: row.acknowledged_at,
      acknowledgedBy: row.acknowledged_by
    }));
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<void> {
    await this.db.query(`
      UPDATE nexus_alerts 
      SET acknowledged = true, acknowledged_at = NOW(), acknowledged_by = $2
      WHERE id = $1
    `, [alertId, acknowledgedBy]);
  }

  /**
   * Update registration status
   */
  async updateRegistrationStatus(
    jurisdictionId: string,
    status: string,
    registrationData: Partial<NexusRegistration>
  ): Promise<void> {
    await this.db.query(`
      INSERT INTO nexus_registrations (
        jurisdiction_id,
        jurisdiction_name,
        registration_number,
        registration_date,
        expiration_date,
        status,
        filing_frequency,
        next_filing_due,
        contact_info,
        notes,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      ON CONFLICT (jurisdiction_id)
      DO UPDATE SET
        registration_number = EXCLUDED.registration_number,
        registration_date = EXCLUDED.registration_date,
        expiration_date = EXCLUDED.expiration_date,
        status = EXCLUDED.status,
        filing_frequency = EXCLUDED.filing_frequency,
        next_filing_due = EXCLUDED.next_filing_due,
        contact_info = EXCLUDED.contact_info,
        notes = EXCLUDED.notes,
        updated_at = NOW()
    `, [
      jurisdictionId,
      registrationData.jurisdictionName || '',
      registrationData.registrationNumber,
      registrationData.registrationDate,
      registrationData.expirationDate,
      status,
      registrationData.filingFrequency,
      registrationData.nextFilingDue,
      registrationData.contactInfo ? JSON.stringify(registrationData.contactInfo) : null,
      registrationData.notes
    ]);
  }
}

export default NexusMonitoringService;
export { 
  NexusThreshold, 
  NexusMetrics, 
  NexusStatus, 
  NexusAlert, 
  NexusRegistration 
};