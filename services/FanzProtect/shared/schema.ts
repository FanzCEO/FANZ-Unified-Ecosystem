import { pgTable, varchar, text, integer, boolean, timestamp, jsonb, uuid, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// =============================================
// CORE LEGAL PROTECTION SCHEMA
// =============================================

// Users table - Creators and legal professionals
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fanzSsoId: varchar("fanz_sso_id").notNull().unique(),
  email: varchar("email").notNull().unique(),
  name: varchar("name").notNull(),
  role: varchar("role").notNull().default("creator"), // creator, verified_creator, legal_counsel, support_agent, admin
  clearanceLevel: integer("clearance_level").notNull().default(1), // 1-5, higher = more access
  businessName: varchar("business_name"),
  address: text("address"),
  phone: varchar("phone"),
  isVerified: boolean("is_verified").default(false),
  kycStatus: varchar("kyc_status").default("unverified"), // unverified, pending, verified
  billingPlan: varchar("billing_plan").default("starter"), // starter, pro, enterprise
  subscriptionStatus: varchar("subscription_status").default("active"), // active, cancelled, suspended
  lastActiveAt: timestamp("last_active_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
}, (table) => ({
  emailIdx: index("users_email_idx").on(table.email),
  ssoIdIdx: index("users_sso_id_idx").on(table.fanzSsoId),
  roleIdx: index("users_role_idx").on(table.role),
}));

// Legal Cases - Core case management
export const legalCases = pgTable("legal_cases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caseNumber: varchar("case_number").notNull().unique(), // Auto-generated case reference
  creatorId: varchar("creator_id").notNull().references(() => users.id),
  caseType: varchar("case_type").notNull(), // dmca, demand_letter, cease_desist, harassment, trademark
  status: varchar("status").notNull().default("draft"), // draft, submitted, in_progress, escalated, resolved, closed
  priority: varchar("priority").notNull().default("medium"), // low, medium, high, urgent
  title: varchar("title").notNull(),
  description: text("description"),
  
  // Target information
  targetPlatform: varchar("target_platform"), // YouTube, Instagram, TikTok, etc.
  infringingUrl: text("infringing_url"),
  originalContentUrl: text("original_content_url"),
  targetUserHandle: varchar("target_user_handle"),
  targetEmail: varchar("target_email"),
  
  // Legal details
  jurisdiction: varchar("jurisdiction").default("US"),
  applicableLaws: jsonb("applicable_laws"), // Array of relevant laws/statutes
  requestedAction: text("requested_action"),
  deadline: timestamp("deadline"),
  
  // Case management
  assignedCounsel: varchar("assigned_counsel").references(() => users.id),
  estimatedValue: integer("estimated_value"), // Damage amount in cents
  billingType: varchar("billing_type").default("subscription"), // subscription, usage, hourly
  
  // Timestamps
  submittedAt: timestamp("submitted_at"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
}, (table) => ({
  creatorIdx: index("legal_cases_creator_idx").on(table.creatorId),
  statusIdx: index("legal_cases_status_idx").on(table.status),
  typeIdx: index("legal_cases_type_idx").on(table.caseType),
  priorityIdx: index("legal_cases_priority_idx").on(table.priority),
  deadlineIdx: index("legal_cases_deadline_idx").on(table.deadline),
  caseNumberIdx: index("legal_cases_number_idx").on(table.caseNumber),
}));

// DMCA-Specific Cases
export const dmcaCases = pgTable("dmca_cases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  legalCaseId: varchar("legal_case_id").notNull().references(() => legalCases.id, { onDelete: "cascade" }),
  noticeType: varchar("notice_type").notNull(), // takedown, counter_notice
  
  // Platform submission details
  platformNotificationMethod: varchar("platform_notification_method"), // email, form, api
  platformContactEmail: varchar("platform_contact_email"),
  platformApiEndpoint: varchar("platform_api_endpoint"),
  
  // DMCA notice details
  copyrightOwner: varchar("copyright_owner"),
  copyrightRegistration: varchar("copyright_registration"),
  originalWorkDate: timestamp("original_work_date"),
  infringementDate: timestamp("infringement_date"),
  
  // Submission tracking
  noticeSubmittedAt: timestamp("notice_submitted_at"),
  submissionConfirmation: varchar("submission_confirmation"),
  platformResponseAt: timestamp("platform_response_at"),
  platformResponseType: varchar("platform_response_type"), // removed, rejected, counter_claimed, pending
  responseDetails: text("response_details"),
  
  // Follow-up tracking
  contentRestored: boolean("content_restored").default(false),
  followUpRequired: boolean("follow_up_required").default(false),
  nextFollowUpAt: timestamp("next_follow_up_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
}, (table) => ({
  legalCaseIdx: index("dmca_cases_legal_case_idx").on(table.legalCaseId),
  noticeTypeIdx: index("dmca_cases_notice_type_idx").on(table.noticeType),
  submittedIdx: index("dmca_cases_submitted_idx").on(table.noticeSubmittedAt),
  responseIdx: index("dmca_cases_response_idx").on(table.platformResponseAt),
}));

// Evidence Management
export const evidenceItems = pgTable("evidence_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  legalCaseId: varchar("legal_case_id").notNull().references(() => legalCases.id, { onDelete: "cascade" }),
  evidenceType: varchar("evidence_type").notNull(), // screenshot, video, url_archive, document, email, social_post
  
  // File information
  fileName: varchar("file_name"),
  filePath: varchar("file_path"), // Storage path in FanzMediaCore
  fileHash: varchar("file_hash").notNull(), // SHA-256 hash for integrity
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type"),
  
  // Evidence metadata
  title: varchar("title"),
  description: text("description"),
  capturedAt: timestamp("captured_at"),
  captureMethod: varchar("capture_method"), // manual, automated, api
  originalUrl: text("original_url"),
  
  // Technical metadata
  deviceInfo: jsonb("device_info"), // Browser, OS, screen resolution
  geoLocation: jsonb("geo_location"), // Geographic data
  networkInfo: jsonb("network_info"), // IP, ISP information
  
  // Chain of custody
  chainOfCustodyLog: jsonb("chain_of_custody_log"), // Audit trail array
  isVerified: boolean("is_verified").default(false),
  verifiedAt: timestamp("verified_at"),
  verifiedBy: varchar("verified_by").references(() => users.id),
  
  // Storage and backup
  storageProvider: varchar("storage_provider").default("fanzmedia"),
  backupLocations: jsonb("backup_locations"), // Array of backup storage locations
  retentionPolicy: varchar("retention_policy").default("permanent"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
}, (table) => ({
  legalCaseIdx: index("evidence_legal_case_idx").on(table.legalCaseId),
  typeIdx: index("evidence_type_idx").on(table.evidenceType),
  hashIdx: index("evidence_hash_idx").on(table.fileHash),
  capturedIdx: index("evidence_captured_idx").on(table.capturedAt),
}));

// Document Templates
export const documentTemplates = pgTable("document_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateType: varchar("template_type").notNull(), // dmca_notice, demand_letter, cease_desist, counter_notice
  platformSpecific: varchar("platform_specific"), // youtube, instagram, tiktok, generic
  jurisdiction: varchar("jurisdiction").default("US"),
  
  // Template details
  templateName: varchar("template_name").notNull(),
  templateContent: text("template_content").notNull(), // Markdown template with variables
  variables: jsonb("variables"), // Available template variables and descriptions
  
  // Template metadata
  category: varchar("category"), // standard, premium, custom
  language: varchar("language").default("en"),
  legalReviewRequired: boolean("legal_review_required").default(false),
  
  // Versioning
  version: varchar("version").default("1.0"),
  previousVersionId: varchar("previous_version_id").references(() => documentTemplates.id),
  isActive: boolean("is_active").default(true),
  
  // Usage tracking
  usageCount: integer("usage_count").default(0),
  successRate: integer("success_rate").default(0), // Percentage
  averageResponseTime: integer("average_response_time"), // Days
  
  // Legal compliance
  complianceNotes: text("compliance_notes"),
  lastLegalReview: timestamp("last_legal_review"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
}, (table) => ({
  typeIdx: index("templates_type_idx").on(table.templateType),
  platformIdx: index("templates_platform_idx").on(table.platformSpecific),
  activeIdx: index("templates_active_idx").on(table.isActive),
  jurisdictionIdx: index("templates_jurisdiction_idx").on(table.jurisdiction),
}));

// Generated Documents
export const generatedDocuments = pgTable("generated_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  legalCaseId: varchar("legal_case_id").notNull().references(() => legalCases.id, { onDelete: "cascade" }),
  templateId: varchar("template_id").references(() => documentTemplates.id),
  
  // Document details
  documentType: varchar("document_type").notNull(),
  title: varchar("title").notNull(),
  content: text("content").notNull(), // Rendered document content
  variables: jsonb("variables"), // Variables used for rendering
  
  // File information
  fileName: varchar("file_name"),
  filePath: varchar("file_path"), // Storage path for PDF/DOC
  fileFormat: varchar("file_format").default("pdf"), // pdf, docx, html
  fileHash: varchar("file_hash"),
  fileSize: integer("file_size"),
  
  // Digital signature
  isSigned: boolean("is_signed").default(false),
  signatureData: jsonb("signature_data"),
  signedAt: timestamp("signed_at"),
  signedBy: varchar("signed_by").references(() => users.id),
  
  // Document status
  status: varchar("status").default("draft"), // draft, final, sent, received_confirmation
  sentAt: timestamp("sent_at"),
  deliveryConfirmation: boolean("delivery_confirmation").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
}, (table) => ({
  legalCaseIdx: index("documents_legal_case_idx").on(table.legalCaseId),
  templateIdx: index("documents_template_idx").on(table.templateId),
  statusIdx: index("documents_status_idx").on(table.status),
  typeIdx: index("documents_type_idx").on(table.documentType),
}));

// Case Timeline & Activities
export const caseActivities = pgTable("case_activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  legalCaseId: varchar("legal_case_id").notNull().references(() => legalCases.id, { onDelete: "cascade" }),
  
  // Activity details
  activityType: varchar("activity_type").notNull(), // created, updated, submitted, response_received, escalated, resolved
  title: varchar("title").notNull(),
  description: text("description"),
  
  // Actor information
  performedBy: varchar("performed_by"), // User ID or 'system'
  performedByName: varchar("performed_by_name"),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  
  // Activity metadata
  metadata: jsonb("metadata"), // Additional structured data
  visibility: varchar("visibility").default("internal"), // internal, client, public
  
  // Notifications
  notificationSent: boolean("notification_sent").default(false),
  notificationMethod: varchar("notification_method"), // email, sms, websocket
  
  createdAt: timestamp("created_at").defaultNow()
}, (table) => ({
  legalCaseIdx: index("activities_legal_case_idx").on(table.legalCaseId),
  typeIdx: index("activities_type_idx").on(table.activityType),
  performedByIdx: index("activities_performed_by_idx").on(table.performedBy),
  createdIdx: index("activities_created_idx").on(table.createdAt),
}));

// Billing Integration with FanzFinance OS
export const caseBilling = pgTable("case_billing", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  legalCaseId: varchar("legal_case_id").references(() => legalCases.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  
  // FanzFinance OS integration
  financeTransactionId: varchar("finance_transaction_id"), // Reference to FanzFinance OS
  ledgerEntryId: varchar("ledger_entry_id"), // Double-entry ledger reference
  
  // Billing details
  serviceType: varchar("service_type").notNull(), // dmca_basic, dmca_expedited, legal_consultation, document_review
  description: text("description"),
  amount: integer("amount").notNull(), // Amount in cents
  currency: varchar("currency").default("USD"),
  
  // Billing status
  status: varchar("status").notNull().default("pending"), // pending, authorized, captured, refunded, failed
  billingDate: timestamp("billing_date").defaultNow(),
  paidAt: timestamp("paid_at"),
  refundedAt: timestamp("refunded_at"),
  
  // Payment metadata
  paymentMethod: varchar("payment_method"), // paxum, ccbill, crypto, wire
  paymentReference: varchar("payment_reference"),
  
  // Usage tracking
  usageMetrics: jsonb("usage_metrics"), // Hours, documents, notices, etc.
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
}, (table) => ({
  legalCaseIdx: index("billing_legal_case_idx").on(table.legalCaseId),
  userIdx: index("billing_user_idx").on(table.userId),
  statusIdx: index("billing_status_idx").on(table.status),
  serviceTypeIdx: index("billing_service_type_idx").on(table.serviceType),
  financeTransactionIdx: index("billing_finance_transaction_idx").on(table.financeTransactionId),
}));

// Platform Registry - External platforms and their contact details
export const platformRegistry = pgTable("platform_registry", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  platformName: varchar("platform_name").notNull().unique(),
  displayName: varchar("display_name").notNull(),
  platformType: varchar("platform_type").notNull(), // social, video, commerce, forum
  
  // Contact information
  dmcaEmail: varchar("dmca_email"),
  abuseEmail: varchar("abuse_email"),
  legalEmail: varchar("legal_email"),
  supportUrl: text("support_url"),
  dmcaFormUrl: text("dmca_form_url"),
  
  // API integration
  hasApi: boolean("has_api").default(false),
  apiEndpoint: text("api_endpoint"),
  apiDocumentation: text("api_documentation"),
  authMethod: varchar("auth_method"), // none, api_key, oauth
  
  // Platform characteristics
  responseTime: integer("response_time"), // Average response time in hours
  successRate: integer("success_rate"), // Percentage of successful takedowns
  requiresNotarization: boolean("requires_notarization").default(false),
  acceptsCounterNotices: boolean("accepts_counter_notices").default(true),
  
  // Rate limiting
  dailyLimit: integer("daily_limit"),
  monthlyLimit: integer("monthly_limit"),
  rateLimitReset: varchar("rate_limit_reset"), // daily, weekly, monthly
  
  // Platform status
  isActive: boolean("is_active").default(true),
  lastTested: timestamp("last_tested"),
  
  // Template associations
  preferredTemplates: jsonb("preferred_templates"), // Array of template IDs
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
}, (table) => ({
  nameIdx: index("platform_registry_name_idx").on(table.platformName),
  typeIdx: index("platform_registry_type_idx").on(table.platformType),
  activeIdx: index("platform_registry_active_idx").on(table.isActive),
}));

// Notification Preferences
export const notificationPreferences = pgTable("notification_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Notification channels
  emailEnabled: boolean("email_enabled").default(true),
  smsEnabled: boolean("sms_enabled").default(false),
  pushEnabled: boolean("push_enabled").default(true),
  websocketEnabled: boolean("websocket_enabled").default(true),
  
  // Event preferences
  caseCreated: boolean("case_created").default(true),
  caseUpdated: boolean("case_updated").default(true),
  documentGenerated: boolean("document_generated").default(true),
  deadlineApproaching: boolean("deadline_approaching").default(true),
  platformResponse: boolean("platform_response").default(true),
  paymentRequired: boolean("payment_required").default(true),
  
  // Frequency settings
  digestFrequency: varchar("digest_frequency").default("immediate"), // immediate, hourly, daily, weekly
  quietHours: jsonb("quiet_hours"), // Start and end times for quiet hours
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
}, (table) => ({
  userIdx: index("notifications_user_idx").on(table.userId),
}));

// =============================================
// ZOD SCHEMAS FOR VALIDATION
// =============================================

// User schemas
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export type User = z.infer<typeof selectUserSchema>;
export type NewUser = z.infer<typeof insertUserSchema>;

// Legal case schemas
export const insertLegalCaseSchema = createInsertSchema(legalCases);
export const selectLegalCaseSchema = createSelectSchema(legalCases);
export type LegalCase = z.infer<typeof selectLegalCaseSchema>;
export type NewLegalCase = z.infer<typeof insertLegalCaseSchema>;

// DMCA case schemas
export const insertDmcaCaseSchema = createInsertSchema(dmcaCases);
export const selectDmcaCaseSchema = createSelectSchema(dmcaCases);
export type DmcaCase = z.infer<typeof selectDmcaCaseSchema>;
export type NewDmcaCase = z.infer<typeof insertDmcaCaseSchema>;

// Evidence schemas
export const insertEvidenceItemSchema = createInsertSchema(evidenceItems);
export const selectEvidenceItemSchema = createSelectSchema(evidenceItems);
export type EvidenceItem = z.infer<typeof selectEvidenceItemSchema>;
export type NewEvidenceItem = z.infer<typeof insertEvidenceItemSchema>;

// Document template schemas
export const insertDocumentTemplateSchema = createInsertSchema(documentTemplates);
export const selectDocumentTemplateSchema = createSelectSchema(documentTemplates);
export type DocumentTemplate = z.infer<typeof selectDocumentTemplateSchema>;
export type NewDocumentTemplate = z.infer<typeof insertDocumentTemplateSchema>;

// Generated document schemas
export const insertGeneratedDocumentSchema = createInsertSchema(generatedDocuments);
export const selectGeneratedDocumentSchema = createSelectSchema(generatedDocuments);
export type GeneratedDocument = z.infer<typeof selectGeneratedDocumentSchema>;
export type NewGeneratedDocument = z.infer<typeof insertGeneratedDocumentSchema>;

// Case activity schemas
export const insertCaseActivitySchema = createInsertSchema(caseActivities);
export const selectCaseActivitySchema = createSelectSchema(caseActivities);
export type CaseActivity = z.infer<typeof selectCaseActivitySchema>;
export type NewCaseActivity = z.infer<typeof insertCaseActivitySchema>;

// Billing schemas
export const insertCaseBillingSchema = createInsertSchema(caseBilling);
export const selectCaseBillingSchema = createSelectSchema(caseBilling);
export type CaseBilling = z.infer<typeof selectCaseBillingSchema>;
export type NewCaseBilling = z.infer<typeof insertCaseBillingSchema>;

// Platform registry schemas
export const insertPlatformRegistrySchema = createInsertSchema(platformRegistry);
export const selectPlatformRegistrySchema = createSelectSchema(platformRegistry);
export type PlatformRegistry = z.infer<typeof selectPlatformRegistrySchema>;
export type NewPlatformRegistry = z.infer<typeof insertPlatformRegistrySchema>;

// Notification preference schemas
export const insertNotificationPreferencesSchema = createInsertSchema(notificationPreferences);
export const selectNotificationPreferencesSchema = createSelectSchema(notificationPreferences);
export type NotificationPreferences = z.infer<typeof selectNotificationPreferencesSchema>;
export type NewNotificationPreferences = z.infer<typeof insertNotificationPreferencesSchema>;

// =============================================
// CUSTOM VALIDATION SCHEMAS
// =============================================

export const createLegalCaseSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(2000),
  caseType: z.enum(["dmca", "demand_letter", "cease_desist", "harassment", "trademark"]),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  targetPlatform: z.string().optional(),
  infringingUrl: z.string().url().optional(),
  originalContentUrl: z.string().url().optional(),
  targetUserHandle: z.string().optional(),
  jurisdiction: z.string().default("US"),
  requestedAction: z.string(),
  deadline: z.date().optional()
});

export const createDmcaNoticeSchema = z.object({
  copyrightOwner: z.string().min(2).max(100),
  copyrightRegistration: z.string().optional(),
  originalWorkDate: z.date(),
  infringementDate: z.date(),
  platformNotificationMethod: z.enum(["email", "form", "api"]).default("email")
});

export const uploadEvidenceSchema = z.object({
  evidenceType: z.enum(["screenshot", "video", "url_archive", "document", "email", "social_post"]),
  title: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  originalUrl: z.string().url().optional(),
  captureMethod: z.enum(["manual", "automated", "api"]).default("manual")
});

export const renderTemplateSchema = z.object({
  templateId: z.string().uuid(),
  variables: z.record(z.any()),
  format: z.enum(["html", "pdf", "docx"]).default("pdf")
});