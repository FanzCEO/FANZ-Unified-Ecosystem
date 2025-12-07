// FanzProtect Tax Compliance Database Schema
// Track tax calculations, compliance, and reporting for Wyoming-based legal services

import { pgTable, varchar, decimal, boolean, timestamp, text, jsonb, integer } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

// Tax calculations table - store all tax calculations for audit
export const taxCalculations = pgTable('tax_calculations', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  
  // Customer information
  customerId: varchar('customer_id', { length: 128 }).notNull(),
  customerState: varchar('customer_state', { length: 2 }).notNull(),
  customerCity: varchar('customer_city', { length: 100 }),
  customerZipCode: varchar('customer_zip_code', { length: 10 }),
  
  // Service information
  serviceType: varchar('service_type', { length: 50 }).notNull(),
  serviceTier: varchar('service_tier', { length: 20 }), // basic, professional, enterprise
  billingPeriod: varchar('billing_period', { length: 20 }).notNull(), // monthly, annual, etc.
  
  // Pricing breakdown
  basePrice: decimal('base_price', { precision: 10, scale: 2 }).notNull(),
  taxRate: decimal('tax_rate', { precision: 6, scale: 4 }).notNull(), // e.g., 0.0825 for 8.25%
  taxAmount: decimal('tax_amount', { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
  
  // Tax jurisdiction and compliance
  taxJurisdiction: varchar('tax_jurisdiction', { length: 50 }).notNull(),
  exemptionApplied: boolean('exemption_applied').default(false).notNull(),
  exemptionReason: text('exemption_reason'),
  nexusRequired: boolean('nexus_required').default(false).notNull(),
  
  // Compliance notes and metadata
  complianceNotes: jsonb('compliance_notes').$type<string[]>(),
  calculationMetadata: jsonb('calculation_metadata'),
  
  // Audit fields
  calculatedAt: timestamp('calculated_at').defaultNow().notNull(),
  calculatedBy: varchar('calculated_by', { length: 128 }), // system or user ID
  invoiceId: varchar('invoice_id', { length: 128 }), // Link to invoice
  transactionId: varchar('transaction_id', { length: 128 }), // Link to actual payment
});

// State nexus tracking - monitor when we establish nexus in each state
export const stateNexusStatus = pgTable('state_nexus_status', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  
  state: varchar('state', { length: 2 }).notNull().unique(),
  
  // Nexus thresholds for this state
  salesThreshold: decimal('sales_threshold', { precision: 15, scale: 2 }),
  transactionThreshold: integer('transaction_threshold'),
  
  // Current year tracking
  currentYearSales: decimal('current_year_sales', { precision: 15, scale: 2 }).default('0').notNull(),
  currentYearTransactions: integer('current_year_transactions').default(0).notNull(),
  
  // Nexus status
  hasNexus: boolean('has_nexus').default(false).notNull(),
  nexusEstablishedDate: timestamp('nexus_established_date'),
  nexusReason: text('nexus_reason'),
  
  // Tax collection status
  collectingTax: boolean('collecting_tax').default(false).notNull(),
  taxCollectionStartDate: timestamp('tax_collection_start_date'),
  
  // State tax rates
  stateTaxRate: decimal('state_tax_rate', { precision: 6, scale: 4 }),
  averageLocalRate: decimal('average_local_rate', { precision: 6, scale: 4 }),
  combinedRate: decimal('combined_rate', { precision: 6, scale: 4 }),
  
  // Legal service exemptions for this state
  dmcaExempt: boolean('dmca_exempt').default(true).notNull(),
  legalAdviceExempt: boolean('legal_advice_exempt').default(true).notNull(),
  documentPrepExempt: boolean('document_prep_exempt').default(false).notNull(),
  
  // Audit fields
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
  lastReviewed: timestamp('last_reviewed'),
  reviewedBy: varchar('reviewed_by', { length: 128 }),
  notes: text('notes'),
});

// Tax filings and payments - track when we file and pay taxes
export const taxFilings = pgTable('tax_filings', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  
  // Filing information
  state: varchar('state', { length: 2 }).notNull(),
  filingPeriod: varchar('filing_period', { length: 20 }).notNull(), // monthly, quarterly
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  
  // Tax amounts
  grossSales: decimal('gross_sales', { precision: 15, scale: 2 }).notNull(),
  taxableAmount: decimal('taxable_amount', { precision: 15, scale: 2 }).notNull(),
  exemptAmount: decimal('exempt_amount', { precision: 15, scale: 2 }).default('0').notNull(),
  taxOwed: decimal('tax_owed', { precision: 10, scale: 2 }).notNull(),
  
  // Filing status
  filingStatus: varchar('filing_status', { length: 20 }).notNull(), // draft, filed, paid, overdue
  filedDate: timestamp('filed_date'),
  dueDate: timestamp('due_date').notNull(),
  paidDate: timestamp('paid_date'),
  
  // Payment information
  paymentAmount: decimal('payment_amount', { precision: 10, scale: 2 }),
  paymentMethod: varchar('payment_method', { length: 50 }),
  confirmationNumber: varchar('confirmation_number', { length: 100 }),
  
  // Additional fees and penalties
  lateFees: decimal('late_fees', { precision: 10, scale: 2 }).default('0').notNull(),
  penalties: decimal('penalties', { precision: 10, scale: 2 }).default('0').notNull(),
  interest: decimal('interest', { precision: 10, scale: 2 }).default('0').notNull(),
  
  // Filing metadata
  filingMethod: varchar('filing_method', { length: 50 }), // online, paper, accountant
  filingReference: varchar('filing_reference', { length: 100 }),
  
  // Audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  filedBy: varchar('filed_by', { length: 128 }), // user or system that filed
  notes: text('notes'),
});

// Wyoming business registration and compliance
export const wyomingCompliance = pgTable('wyoming_compliance', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  
  // Wyoming business registration
  businessName: varchar('business_name', { length: 200 }).notNull(),
  registrationNumber: varchar('registration_number', { length: 50 }),
  ein: varchar('ein', { length: 20 }), // Federal EIN
  
  // Registration status
  registrationStatus: varchar('registration_status', { length: 20 }).notNull(), // active, inactive, dissolved
  registrationDate: timestamp('registration_date'),
  renewalDate: timestamp('renewal_date'),
  
  // Wyoming-specific requirements
  annualReportFiled: boolean('annual_report_filed').default(false).notNull(),
  annualReportDueDate: timestamp('annual_report_due_date'),
  annualReportFiledDate: timestamp('annual_report_filed_date'),
  
  registeredAgent: varchar('registered_agent', { length: 200 }),
  registeredAddress: text('registered_address'),
  
  // Business license information
  businessLicense: varchar('business_license', { length: 100 }),
  licenseExpiration: timestamp('license_expiration'),
  
  // Legal practice authorization (if providing legal services)
  legalPracticeAuth: varchar('legal_practice_auth', { length: 100 }),
  barAdmission: varchar('bar_admission', { length: 100 }),
  
  // Audit fields
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
  updatedBy: varchar('updated_by', { length: 128 }),
  complianceNotes: text('compliance_notes'),
});

// Tax compliance audit log
export const taxComplianceAudit = pgTable('tax_compliance_audit', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  
  // Audit event information
  eventType: varchar('event_type', { length: 50 }).notNull(), // calculation, filing, nexus_check, etc.
  entityType: varchar('entity_type', { length: 50 }).notNull(), // tax_calculation, state_nexus, filing
  entityId: varchar('entity_id', { length: 128 }).notNull(),
  
  // Changes made
  previousValues: jsonb('previous_values'),
  newValues: jsonb('new_values'),
  changesSummary: text('changes_summary'),
  
  // Audit context
  triggeredBy: varchar('triggered_by', { length: 50 }).notNull(), // user, system, scheduler
  userId: varchar('user_id', { length: 128 }),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  
  // Compliance context
  complianceReason: text('compliance_reason'),
  regulatoryReference: varchar('regulatory_reference', { length: 200 }),
  
  // Timestamp
  auditTimestamp: timestamp('audit_timestamp').defaultNow().notNull(),
  
  // Additional metadata
  metadata: jsonb('metadata'),
  severity: varchar('severity', { length: 20 }).default('info').notNull(), // info, warning, error, critical
});

// Export types
export type TaxCalculation = typeof taxCalculations.$inferSelect;
export type NewTaxCalculation = typeof taxCalculations.$inferInsert;

export type StateNexusStatus = typeof stateNexusStatus.$inferSelect;
export type NewStateNexusStatus = typeof stateNexusStatus.$inferInsert;

export type TaxFiling = typeof taxFilings.$inferSelect;
export type NewTaxFiling = typeof taxFilings.$inferInsert;

export type WyomingCompliance = typeof wyomingCompliance.$inferSelect;
export type NewWyomingCompliance = typeof wyomingCompliance.$inferInsert;

export type TaxComplianceAudit = typeof taxComplianceAudit.$inferSelect;
export type NewTaxComplianceAudit = typeof taxComplianceAudit.$inferInsert;