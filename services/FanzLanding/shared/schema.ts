import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  timestamp,
  boolean,
  date,
  json,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  role: text("role").notNull().default("fanz"), // "fanz", "star", "moderator", "admin", "executive"
  isVerified: boolean("is_verified").default(false),
  isActive: boolean("is_active").default(true),
  hasCompletedCompliance: boolean("has_completed_compliance").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const complianceRecords = pgTable("compliance_records", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .references(() => users.id)
    .notNull(),
  recordType: text("record_type").notNull(), // "star_consent", "kyc", "document_upload"
  status: text("status").notNull().default("pending"), // "pending", "submitted", "approved", "rejected"
  data: json("data"), // Store form data as JSON
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  deviceFingerprint: text("device_fingerprint"),
  geolocation: text("geolocation"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  notes: text("notes"),
});

export const documentUploads = pgTable("document_uploads", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .references(() => users.id)
    .notNull(),
  complianceRecordId: varchar("compliance_record_id").references(
    () => complianceRecords.id,
  ),
  documentType: text("document_type").notNull(), // "government_id", "selfie", "w9_form", "address_verification", "contract"
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size"),
  fileHash: text("file_hash"), // SHA-256 hash for integrity
  mimeType: text("mime_type"),
  status: text("status").notNull().default("pending"), // "pending", "verified", "rejected"
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  verifiedAt: timestamp("verified_at"),
  verifiedBy: varchar("verified_by").references(() => users.id),
});

export const kycInformation = pgTable("kyc_information", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .references(() => users.id)
    .notNull(),
  dateOfBirth: date("date_of_birth"),
  streetAddress: text("street_address"),
  city: text("city"),
  state: text("state"),
  postalCode: text("postal_code"),
  country: text("country"),
  ssnTin: text("ssn_tin"), // Encrypted
  idType: text("id_type"), // "passport", "drivers_license", "citizenship", "military_card"
  idNumber: text("id_number"), // Encrypted
  idStateCountry: text("id_state_country"),
  verificationLevel: text("verification_level").default("none"), // "none", "basic", "enhanced", "premium"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Platform configurations table
export const platforms = pgTable("platforms", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  domain: text("domain").notNull().unique(), // e.g., "boyfanz.myfanz.network"
  name: text("name").notNull(), // e.g., "BoyFanz"
  type: text("type").notNull(), // "primary", "redirect"
  targetNetwork: text("target_network").notNull(), // "boyfanz", "girlfanz", "pupfanz", "transfanz", "kinkfanz"
  repositoryName: text("repository_name"), // e.g., "boyfanz-web"
  apiKey: text("api_key"), // Encrypted API key for platform authentication
  webhookSecret: text("webhook_secret"), // Encrypted webhook secret
  isActive: boolean("is_active").default(true),
  settings: json("settings"), // Platform-specific configuration
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Webhook configurations and logs table
export const webhooks = pgTable("webhooks", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  platformId: varchar("platform_id")
    .references(() => platforms.id)
    .notNull(),
  eventType: text("event_type").notNull(), // "user.created", "content.uploaded", "payment.processed", etc.
  endpoint: text("endpoint").notNull(), // Target webhook URL
  isActive: boolean("is_active").default(true),
  lastTriggered: timestamp("last_triggered"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Webhook delivery logs
export const webhookLogs = pgTable("webhook_logs", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  webhookId: varchar("webhook_id")
    .references(() => webhooks.id)
    .notNull(),
  requestPayload: json("request_payload"),
  responseStatus: integer("response_status"),
  responseBody: text("response_body"),
  attemptNumber: integer("attempt_number").default(1),
  deliveredAt: timestamp("delivered_at"),
  failed: boolean("failed").default(false),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const creators = pgTable("creators", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .references(() => users.id)
    .notNull(),
  displayName: text("display_name").notNull(),
  bio: text("bio"),
  avatar: text("avatar"),
  network: text("network").notNull(), // "boyfanz", "girlfanz", "pupfanz", "transfanz", "kinkfanz"
  isVerified: boolean("is_verified").default(false),
  followers: integer("followers").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const videos = pgTable("videos", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id")
    .references(() => creators.id)
    .notNull(),
  title: text("title").notNull(),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url").notNull(),
  videoUrl: text("video_url").notNull(),
  duration: integer("duration").notNull(), // in seconds
  quality: text("quality").notNull(), // "HD", "4K"
  views: integer("views").default(0),
  likes: integer("likes").default(0),
  isFeatured: boolean("is_featured").default(false),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  firstName: true,
  lastName: true,
  role: true,
});

export const insertCreatorSchema = createInsertSchema(creators).pick({
  userId: true,
  displayName: true,
  bio: true,
  avatar: true,
  network: true,
});

export const insertVideoSchema = createInsertSchema(videos).pick({
  creatorId: true,
  title: true,
  description: true,
  thumbnailUrl: true,
  videoUrl: true,
  duration: true,
  quality: true,
  tags: true,
});

export const insertComplianceRecordSchema = createInsertSchema(
  complianceRecords,
).pick({
  userId: true,
  recordType: true,
  data: true,
  ipAddress: true,
  userAgent: true,
  deviceFingerprint: true,
  geolocation: true,
});

export const insertDocumentUploadSchema = createInsertSchema(
  documentUploads,
).pick({
  userId: true,
  complianceRecordId: true,
  documentType: true,
  fileName: true,
  filePath: true,
  fileSize: true,
  fileHash: true,
  mimeType: true,
});

export const insertKycInformationSchema = createInsertSchema(
  kycInformation,
).pick({
  userId: true,
  dateOfBirth: true,
  streetAddress: true,
  city: true,
  state: true,
  postalCode: true,
  country: true,
  ssnTin: true,
  idType: true,
  idNumber: true,
  idStateCountry: true,
});

export const insertPlatformSchema = createInsertSchema(platforms).pick({
  domain: true,
  name: true,
  type: true,
  targetNetwork: true,
  repositoryName: true,
  settings: true,
});

export const insertWebhookSchema = createInsertSchema(webhooks).pick({
  platformId: true,
  eventType: true,
  endpoint: true,
});

export const insertWebhookLogSchema = createInsertSchema(webhookLogs).pick({
  webhookId: true,
  requestPayload: true,
  responseStatus: true,
  responseBody: true,
  attemptNumber: true,
  failed: true,
  errorMessage: true,
});

// Registration form schema with validation
export const registrationSchema = insertUserSchema
  .extend({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    terms: z
      .boolean()
      .refine((val) => val === true, "You must accept the terms"),
    ageConsent: z
      .boolean()
      .refine((val) => val === true, "You must confirm you are 18 or older"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// STAR consent form schema
export const starConsentSchema = z.object({
  creatorName: z.string().min(1, "Creator name is required"),
  creatorStageName: z.string().optional(),
  creatorEmail: z.string().email("Valid email is required"),
  creatorIdType: z.enum([
    "passport",
    "citizenship",
    "drivers_license",
    "military_card",
  ]),
  creatorIdNumber: z.string().min(1, "ID number is required"),
  creatorIdStateCountry: z.string().min(1, "State/Country is required"),
  creatorDob: z.string().min(1, "Date of birth is required"),
  compensationTerms: z.string().optional(),
  hasCostar: z.boolean().default(false),
  ageVerification: z
    .boolean()
    .refine((val) => val === true, "Age verification required"),
  contentConsent: z
    .boolean()
    .refine((val) => val === true, "Content consent required"),
  platformConsent: z
    .boolean()
    .refine((val) => val === true, "Platform consent required"),
  withdrawalUnderstanding: z
    .boolean()
    .refine((val) => val === true, "Withdrawal understanding required"),
  legalAgreement: z
    .boolean()
    .refine((val) => val === true, "Legal agreement required"),
  digitalSignature: z.string().min(1, "Digital signature is required"),
});

// KYC form schema
export const kycSchema = insertKycInformationSchema.extend({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  streetAddress: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string().min(1, "Country is required"),
  ageConsent: z.boolean().refine((val) => val === true, "Age consent required"),
  compliance2257: z
    .boolean()
    .refine((val) => val === true, "2257 compliance required"),
  platformPolicies: z
    .boolean()
    .refine((val) => val === true, "Platform policies required"),
  ndaAgreement: z
    .boolean()
    .refine((val) => val === true, "NDA agreement required"),
  ipAssignment: z
    .boolean()
    .refine((val) => val === true, "IP assignment required"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type RegistrationForm = z.infer<typeof registrationSchema>;

export type InsertCreator = z.infer<typeof insertCreatorSchema>;
export type Creator = typeof creators.$inferSelect;

export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type Video = typeof videos.$inferSelect;

export type InsertComplianceRecord = z.infer<
  typeof insertComplianceRecordSchema
>;
export type ComplianceRecord = typeof complianceRecords.$inferSelect;

export type InsertDocumentUpload = z.infer<typeof insertDocumentUploadSchema>;
export type DocumentUpload = typeof documentUploads.$inferSelect;

export type InsertKycInformation = z.infer<typeof insertKycInformationSchema>;
export type KycInformation = typeof kycInformation.$inferSelect;

export type InsertPlatform = z.infer<typeof insertPlatformSchema>;
export type Platform = typeof platforms.$inferSelect;

export type InsertWebhook = z.infer<typeof insertWebhookSchema>;
export type Webhook = typeof webhooks.$inferSelect;

export type InsertWebhookLog = z.infer<typeof insertWebhookLogSchema>;
export type WebhookLog = typeof webhookLogs.$inferSelect;

export type StarConsentForm = z.infer<typeof starConsentSchema>;
export type KycForm = z.infer<typeof kycSchema>;

export interface VideoWithCreator extends Video {
  creator: Creator;
}

export interface CreatorWithStats extends Creator {
  videoCount: number;
  totalViews: number;
}

// Services table for all FUN platform services
export const services = pgTable("services", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // "FanzWork", "FanzRadio", etc.
  displayName: text("display_name").notNull(), // "FanzWork - Freelancer Marketplace"
  description: text("description").notNull(),
  category: text("category").notNull(), // "marketplace", "media", "tools", "education", etc.
  url: text("url"), // External URL if service is external
  apiEndpoint: text("api_endpoint"), // API endpoint for integration
  webhookUrl: text("webhook_url"), // Webhook URL for service
  isActive: boolean("is_active").default(true),
  isInternal: boolean("is_internal").default(true), // true for FUN-owned services
  icon: text("icon"), // Icon identifier or URL
  features: text("features").array(), // Array of feature descriptions
  settings: json("settings"), // Service-specific configuration
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Ad spaces table for managing advertising
export const adSpaces = pgTable("ad_spaces", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // "Header Banner", "Sidebar", etc.
  location: text("location").notNull(), // "header", "sidebar", "footer", "inline"
  pageType: text("page_type").notNull(), // "home", "platform", "service", "all"
  platform: text("platform"), // Specific platform if not "all"
  dimensions: text("dimensions"), // "1200x300", "300x250", etc.
  maxFileSize: integer("max_file_size"), // in bytes
  allowedFormats: text("allowed_formats").array(), // ["jpg", "png", "gif", "mp4"]
  pricing: integer("pricing"), // price in cents
  isActive: boolean("is_active").default(true),
  priority: integer("priority").default(0), // Higher = more prominent
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Ad campaigns table for tracking ads
export const adCampaigns = pgTable("ad_campaigns", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  advertiserId: varchar("advertiser_id")
    .references(() => users.id)
    .notNull(),
  adSpaceId: varchar("ad_space_id")
    .references(() => adSpaces.id)
    .notNull(),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  videoUrl: text("video_url"),
  linkUrl: text("link_url"), // Where the ad redirects
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  budget: integer("budget"), // Total budget in cents
  spent: integer("spent").default(0), // Amount spent in cents
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  status: text("status").notNull().default("pending"), // "pending", "active", "paused", "completed"
  isStarzAd: boolean("is_starz_ad").default(false), // True for chosen Starz ads
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI tours and tutorials table
export const aiTours = pgTable("ai_tours", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // "Platform Introduction", "Creator Onboarding"
  description: text("description").notNull(),
  targetAudience: text("target_audience").notNull(), // "fanz", "star", "admin", "all"
  steps: json("steps").notNull(), // Array of tour steps with content
  isActive: boolean("is_active").default(true),
  completionRate: integer("completion_rate").default(0), // Percentage of users who complete
  averageRating: integer("average_rating").default(0), // 1-5 star rating
  totalCompletions: integer("total_completions").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User tour progress tracking
export const userTourProgress = pgTable("user_tour_progress", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .references(() => users.id)
    .notNull(),
  tourId: varchar("tour_id")
    .references(() => aiTours.id)
    .notNull(),
  currentStep: integer("current_step").default(0),
  isCompleted: boolean("is_completed").default(false),
  rating: integer("rating"), // 1-5 star rating given by user
  feedback: text("feedback"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  lastActiveAt: timestamp("last_active_at").defaultNow(),
});

// Wiki/help articles table
export const wikiArticles = pgTable("wiki_articles", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(), // Markdown content
  category: text("category").notNull(), // "getting-started", "compliance", "monetization", etc.
  tags: text("tags").array(),
  authorId: varchar("author_id")
    .references(() => users.id)
    .notNull(),
  isPublished: boolean("is_published").default(false),
  views: integer("views").default(0),
  helpfulVotes: integer("helpful_votes").default(0),
  searchKeywords: text("search_keywords").array(), // For AI-powered search
  relatedArticles: text("related_articles").array(), // IDs of related articles
  lastReviewed: timestamp("last_reviewed"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertServiceSchema = createInsertSchema(services).pick({
  name: true,
  displayName: true,
  description: true,
  category: true,
  url: true,
  apiEndpoint: true,
  webhookUrl: true,
  isInternal: true,
  icon: true,
  features: true,
  settings: true,
});

export const insertAdSpaceSchema = createInsertSchema(adSpaces).pick({
  name: true,
  location: true,
  pageType: true,
  platform: true,
  dimensions: true,
  maxFileSize: true,
  allowedFormats: true,
  pricing: true,
  priority: true,
});

export const insertAdCampaignSchema = createInsertSchema(adCampaigns).pick({
  advertiserId: true,
  adSpaceId: true,
  title: true,
  description: true,
  imageUrl: true,
  videoUrl: true,
  linkUrl: true,
  startDate: true,
  endDate: true,
  budget: true,
  isStarzAd: true,
});

export const insertAiTourSchema = createInsertSchema(aiTours).pick({
  name: true,
  description: true,
  targetAudience: true,
  steps: true,
});

export const insertUserTourProgressSchema = createInsertSchema(
  userTourProgress,
).pick({
  userId: true,
  tourId: true,
  currentStep: true,
  rating: true,
  feedback: true,
});

export const insertWikiArticleSchema = createInsertSchema(wikiArticles).pick({
  title: true,
  content: true,
  category: true,
  tags: true,
  authorId: true,
  isPublished: true,
  searchKeywords: true,
  relatedArticles: true,
});

export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof services.$inferSelect;

export type InsertAdSpace = z.infer<typeof insertAdSpaceSchema>;
export type AdSpace = typeof adSpaces.$inferSelect;

export type InsertAdCampaign = z.infer<typeof insertAdCampaignSchema>;
export type AdCampaign = typeof adCampaigns.$inferSelect;

export type InsertAiTour = z.infer<typeof insertAiTourSchema>;
export type AiTour = typeof aiTours.$inferSelect;

export type InsertUserTourProgress = z.infer<
  typeof insertUserTourProgressSchema
>;
export type UserTourProgress = typeof userTourProgress.$inferSelect;

export type InsertWikiArticle = z.infer<typeof insertWikiArticleSchema>;
export type WikiArticle = typeof wikiArticles.$inferSelect;

export interface UserWithCompliance extends User {
  complianceRecords: ComplianceRecord[];
  documentUploads: DocumentUpload[];
  kycInformation?: KycInformation;
}

export interface ServiceWithStats extends Service {
  activeUsers: number;
  totalConnections: number;
}

// Policy Management Tables for Military-Grade Security Hub
export const policyCategories = pgTable("policy_categories", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(), // "legal-and-compliance", "moderation-data-storage", etc.
  displayName: text("display_name").notNull(), // "Legal and Compliance"
  description: text("description"),
  foundationUrl: text("foundation_url"), // URL to the category on fanz.foundation
  articleCount: integer("article_count").default(0),
  isActive: boolean("is_active").default(true),
  lastSynced: timestamp("last_synced"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const policyDocuments = pgTable("policy_documents", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  categoryId: varchar("category_id")
    .references(() => policyCategories.id)
    .notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(), // Full policy content
  foundationUrl: text("foundation_url"), // URL to the policy on fanz.foundation
  version: text("version").default("1.0"),
  effectiveDate: timestamp("effective_date").defaultNow(),
  expirationDate: timestamp("expiration_date"),
  complianceRequired: boolean("compliance_required").default(false),
  targetRoles: text("target_roles").array(), // ["star", "fanz", "admin"] - who must comply
  priority: text("priority").default("medium"), // "low", "medium", "high", "critical"
  checksum: text("checksum"), // Hash for integrity verification
  isActive: boolean("is_active").default(true),
  lastSynced: timestamp("last_synced"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const policyCompliance = pgTable("policy_compliance", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .references(() => users.id)
    .notNull(),
  policyId: varchar("policy_id")
    .references(() => policyDocuments.id)
    .notNull(),
  status: text("status").notNull().default("pending"), // "pending", "acknowledged", "compliant", "non_compliant"
  acknowledgedAt: timestamp("acknowledged_at"),
  complianceDate: timestamp("compliance_date"),
  expirationDate: timestamp("expiration_date"),
  digitalSignature: text("digital_signature"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  deviceFingerprint: text("device_fingerprint"),
  geolocation: text("geolocation"),
  auditTrail: json("audit_trail"), // Track all compliance actions
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Military-Grade Audit Logging System
export const auditEvents = pgTable("audit_events", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  sessionId: text("session_id"),
  eventType: text("event_type").notNull(), // "auth", "policy", "cluster", "security", "data"
  eventCategory: text("event_category").notNull(), // "login", "policy_access", "cluster_connect", etc.
  eventDescription: text("event_description").notNull(),
  resourceType: text("resource_type"), // "user", "policy", "cluster", "platform"
  resourceId: text("resource_id"),
  severity: text("severity").notNull().default("info"), // "info", "warning", "error", "critical"
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  deviceFingerprint: text("device_fingerprint"),
  geolocation: text("geolocation"),
  requestMethod: text("request_method"),
  requestPath: text("request_path"),
  responseStatus: integer("response_status"),
  payload: json("payload"), // Encrypted sensitive data
  metadata: json("metadata"), // Additional context
  hashChain: text("hash_chain"), // For tamper detection
  createdAt: timestamp("created_at").defaultNow(),
});

// Security Events for Real-time Monitoring
export const securityEvents = pgTable("security_events", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  eventType: text("event_type").notNull(), // "intrusion_attempt", "policy_violation", "unauthorized_access"
  severity: text("severity").notNull(), // "low", "medium", "high", "critical"
  source: text("source").notNull(), // "web", "api", "cluster", "internal"
  title: text("title").notNull(),
  description: text("description").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: varchar("user_id").references(() => users.id),
  clusterId: text("cluster_id"),
  mitigationAction: text("mitigation_action"), // What action was taken
  isResolved: boolean("is_resolved").default(false),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: varchar("resolved_by").references(() => users.id),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Cluster Authentication and Connection Management
export const clusterConnections = pgTable("cluster_connections", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  clusterId: text("cluster_id").notNull().unique(), // "boyfanz", "girlfanz", etc.
  clusterName: text("cluster_name").notNull(),
  domainName: text("domain_name").notNull(), // e.g., "boyfanz.myfanz.network"
  certificateFingerprint: text("certificate_fingerprint"), // For cert-based auth
  publicKey: text("public_key"), // Cluster's public key
  lastHeartbeat: timestamp("last_heartbeat"),
  status: text("status").notNull().default("pending"), // "pending", "active", "suspended", "revoked"
  connectionAttempts: integer("connection_attempts").default(0),
  lastConnectionAttempt: timestamp("last_connection_attempt"),
  failedAttempts: integer("failed_attempts").default(0),
  securityLevel: text("security_level").default("standard"), // "standard", "enhanced", "military"
  allowedOperations: text("allowed_operations").array(), // What operations this cluster can perform
  rateLimitTier: text("rate_limit_tier").default("standard"), // "standard", "premium", "enterprise"
  metadata: json("metadata"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schema exports for policy management
export const insertPolicyCategorySchema = createInsertSchema(policyCategories).pick({
  name: true,
  displayName: true,
  description: true,
  foundationUrl: true,
  articleCount: true,
});

export const insertPolicyDocumentSchema = createInsertSchema(policyDocuments).pick({
  categoryId: true,
  title: true,
  content: true,
  foundationUrl: true,
  version: true,
  effectiveDate: true,
  expirationDate: true,
  complianceRequired: true,
  targetRoles: true,
  priority: true,
  checksum: true,
});

export const insertPolicyComplianceSchema = createInsertSchema(policyCompliance).pick({
  userId: true,
  policyId: true,
  status: true,
  digitalSignature: true,
  ipAddress: true,
  userAgent: true,
  deviceFingerprint: true,
  geolocation: true,
  auditTrail: true,
});

export const insertAuditEventSchema = createInsertSchema(auditEvents).pick({
  userId: true,
  sessionId: true,
  eventType: true,
  eventCategory: true,
  eventDescription: true,
  hashChain: true,
  resourceType: true,
  resourceId: true,
  severity: true,
  ipAddress: true,
  userAgent: true,
  deviceFingerprint: true,
  geolocation: true,
  requestMethod: true,
  requestPath: true,
  responseStatus: true,
  payload: true,
  metadata: true,
});

export const insertSecurityEventSchema = createInsertSchema(securityEvents).pick({
  eventType: true,
  severity: true,
  source: true,
  title: true,
  description: true,
  ipAddress: true,
  userAgent: true,
  userId: true,
  clusterId: true,
  mitigationAction: true,
  metadata: true,
});

export const insertClusterConnectionSchema = createInsertSchema(clusterConnections).pick({
  clusterId: true,
  clusterName: true,
  domainName: true,
  certificateFingerprint: true,
  publicKey: true,
  securityLevel: true,
  allowedOperations: true,
  rateLimitTier: true,
  metadata: true,
});

export type InsertPolicyCategory = z.infer<typeof insertPolicyCategorySchema>;
export type PolicyCategory = typeof policyCategories.$inferSelect;

export type InsertPolicyDocument = z.infer<typeof insertPolicyDocumentSchema>;
export type PolicyDocument = typeof policyDocuments.$inferSelect;

export type InsertPolicyCompliance = z.infer<typeof insertPolicyComplianceSchema>;
export type PolicyCompliance = typeof policyCompliance.$inferSelect;

export type InsertAuditEvent = z.infer<typeof insertAuditEventSchema>;
export type AuditEvent = typeof auditEvents.$inferSelect;

export type InsertSecurityEvent = z.infer<typeof insertSecurityEventSchema>;
export type SecurityEvent = typeof securityEvents.$inferSelect;

export type InsertClusterConnection = z.infer<typeof insertClusterConnectionSchema>;
export type ClusterConnection = typeof clusterConnections.$inferSelect;

export interface PolicyCategoryWithDocuments extends PolicyCategory {
  documents: PolicyDocument[];
}

export interface PolicyDocumentWithCompliance extends PolicyDocument {
  complianceRecords: PolicyCompliance[];
  category: PolicyCategory;
}

export interface UserComplianceStatus {
  userId: string;
  totalPolicies: number;
  compliantPolicies: number;
  pendingPolicies: number;
  expiredPolicies: number;
  complianceRate: number;
  lastUpdate: Date;
}
