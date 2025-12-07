import { sql, relations } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User roles enum
export const userRoleEnum = pgEnum("user_role", ["fanz", "creator", "admin"]);

// Auth provider enum
export const authProviderEnum = pgEnum("auth_provider", [
  "email",
  "phone",
  "google",
  "facebook",
  "twitter",
  "instagram",
  "reddit",
  "tiktok",
  "discord",
  "apple",
]);

// Notification type enum
export const notificationTypeEnum = pgEnum("notification_type", [
  "new_subscriber",
  "new_message",
  "new_tip",
  "content_liked",
  "content_commented",
  "ppv_purchased",
  "creator_posted",
  "reminder_to_post",
  "account_warning",
  "achievement_unlocked",
  "live_stream_started",
  "payment_received",
  "withdrawal_processed",
]);

// Creator status enum
export const creatorStatusEnum = pgEnum("creator_status", [
  "active",
  "inactive",
  "warning",
  "suspended",
  "top_performer",
]);

// Post types enum
export const postTypeEnum = pgEnum("post_type", [
  "free",
  "ppv",
  "subscription_only",
]);

// Transaction types enum
export const transactionTypeEnum = pgEnum("transaction_type", [
  "subscription",
  "tip",
  "ppv_unlock",
  "withdrawal",
  "deposit",
]);

// Compliance status enum
export const complianceStatusEnum = pgEnum("compliance_status", [
  "pending",
  "approved",
  "rejected",
  "expired",
  "under_review",
]);

// ID types enum
export const idTypeEnum = pgEnum("id_type", [
  "drivers_license",
  "passport",
  "citizenship",
  "social_security",
  "other",
]);

// Verification types enum
export const verificationTypeEnum = pgEnum("verification_type", [
  "primary_star",
  "co_star",
  "age_verification",
]);

// Audit action types enum
export const auditActionEnum = pgEnum("audit_action", [
  "created",
  "updated",
  "deleted",
  "approved",
  "rejected",
  "viewed",
  "exported",
]);

// VerifyMy verification status enum
export const verifyMyStatusEnum = pgEnum("verify_my_status", [
  "pending",
  "in_progress",
  "verified",
  "failed",
  "expired",
  "manual_review",
]);

// Document types enum
export const documentTypeEnum = pgEnum("document_type", [
  "government_id",
  "passport",
  "drivers_license",
  "w9_form",
  "selfie_with_id",
  "proof_of_address",
  "other",
]);

// Moderation status enum
export const moderationStatusEnum = pgEnum("moderation_status", [
  "pending",
  "approved",
  "rejected",
  "flagged",
  "manual_review",
  "appeal_pending",
]);

// Content classification enum
export const contentClassificationEnum = pgEnum("content_classification", [
  "safe",
  "adult_content",
  "explicit_nudity",
  "violence",
  "hate_speech",
  "spam",
  "other_violation",
]);

// Short video enums
export const shortVideoStatusEnum = pgEnum("short_video_status", [
  "draft",
  "processing",
  "published",
  "archived",
  "removed",
]);

export const videoEffectTypeEnum = pgEnum("video_effect_type", [
  "filter",
  "overlay",
  "transition",
  "text",
  "sticker",
  "music",
  "speed",
]);

export const reactionTypeEnum = pgEnum("reaction_type", [
  "like",
  "love",
  "fire",
  "wow",
  "laugh",
  "heart_eyes",
  "tongue",
  "wink",
]);

export const hashtagCategoryEnum = pgEnum("hashtag_category", [
  "trending",
  "adult",
  "lifestyle",
  "fitness",
  "fashion",
  "beauty",
  "food",
  "travel",
  "music",
  "dance",
  "comedy",
  "education",
  "diy",
  "other",
]);

// Users table
export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  phoneNumber: varchar("phone_number").unique(),
  passwordHash: varchar("password_hash"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").default("fanz").notNull(),
  username: varchar("username").unique(),
  displayName: varchar("display_name"),
  bio: text("bio"),
  subscriptionPrice: decimal("subscription_price", {
    precision: 10,
    scale: 2,
  }).default("0.00"),
  isVerified: boolean("is_verified").default(false),
  emailVerified: boolean("email_verified").default(false),
  phoneVerified: boolean("phone_verified").default(false),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  twoFactorSecret: varchar("two_factor_secret"),
  balance: decimal("balance", { precision: 10, scale: 2 }).default("0.00"),
  totalEarnings: decimal("total_earnings", { precision: 10, scale: 2 }).default(
    "0.00",
  ),
  subscriberCount: integer("subscriber_count").default(0),
  creatorStatus: creatorStatusEnum("creator_status").default("active"),
  lastPostDate: timestamp("last_post_date"),
  weeklyPostCount: integer("weekly_post_count").default(0),
  monthlyPostCount: integer("monthly_post_count").default(0),
  pushNotificationToken: varchar("push_notification_token"),
  notificationPreferences: jsonb("notification_preferences").default({
    email: true,
    push: true,
    sms: true,
    reminderToPost: true,
    newSubscriber: true,
    newMessage: true,
    newTip: true,
  }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Posts table
export const posts = pgTable("posts", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id")
    .references(() => users.id)
    .notNull(),
  content: text("content").notNull(),
  mediaUrl: varchar("media_url"),
  mediaType: varchar("media_type"), // image, video, etc
  postType: postTypeEnum("post_type").default("free").notNull(),
  ppvPrice: decimal("ppv_price", { precision: 10, scale: 2 }),
  likesCount: integer("likes_count").default(0),
  commentsCount: integer("comments_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Subscriptions table
export const subscriptions = pgTable("subscriptions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  fanId: varchar("fan_id")
    .references(() => users.id)
    .notNull(),
  creatorId: varchar("creator_id")
    .references(() => users.id)
    .notNull(),
  isActive: boolean("is_active").default(true),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Messages table
export const messages = pgTable("messages", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id")
    .references(() => users.id)
    .notNull(),
  receiverId: varchar("receiver_id")
    .references(() => users.id)
    .notNull(),
  content: text("content").notNull(),
  mediaUrl: varchar("media_url"),
  isRead: boolean("is_read").default(false),
  isPpv: boolean("is_ppv").default(false),
  ppvPrice: decimal("ppv_price", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// PPV Unlocks table
export const ppvUnlocks = pgTable("ppv_unlocks", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .references(() => users.id)
    .notNull(),
  postId: varchar("post_id").references(() => posts.id),
  messageId: varchar("message_id").references(() => messages.id),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Transactions table
export const transactions = pgTable("transactions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .references(() => users.id)
    .notNull(),
  recipientId: varchar("recipient_id").references(() => users.id),
  type: transactionTypeEnum("type").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  postId: varchar("post_id").references(() => posts.id),
  messageId: varchar("message_id").references(() => messages.id),
  subscriptionId: varchar("subscription_id").references(() => subscriptions.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Likes table
export const likes = pgTable("likes", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .references(() => users.id)
    .notNull(),
  postId: varchar("post_id")
    .references(() => posts.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Comments table (will add shortVideoId reference after shortVideos table is defined)
export const comments = pgTable("comments", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .references(() => users.id)
    .notNull(),
  postId: varchar("post_id").references(() => posts.id),
  shortVideoId: varchar("short_video_id"), // reference added later
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Short Videos table
export const shortVideos = pgTable("short_videos", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id")
    .references(() => users.id)
    .notNull(),
  title: varchar("title"),
  description: text("description"),
  videoUrl: varchar("video_url").notNull(),
  thumbnailUrl: varchar("thumbnail_url"),
  duration: integer("duration").notNull(), // in seconds
  aspectRatio: varchar("aspect_ratio").default("9:16"), // vertical by default
  resolution: varchar("resolution").default("1080x1920"),
  fileSize: integer("file_size"), // in bytes
  status: shortVideoStatusEnum("status").default("draft"),
  isPublic: boolean("is_public").default(true),
  allowComments: boolean("allow_comments").default(true),
  allowDuets: boolean("allow_duets").default(true),
  allowRemix: boolean("allow_remix").default(true),
  viewsCount: integer("views_count").default(0),
  likesCount: integer("likes_count").default(0),
  commentsCount: integer("comments_count").default(0),
  sharesCount: integer("shares_count").default(0),
  engagementScore: decimal("engagement_score", {
    precision: 5,
    scale: 2,
  }).default("0.00"),
  algorithmBoost: decimal("algorithm_boost", {
    precision: 3,
    scale: 2,
  }).default("1.00"),
  createdAt: timestamp("created_at").defaultNow(),
  publishedAt: timestamp("published_at"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Video Effects table
export const videoEffects = pgTable("video_effects", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  shortVideoId: varchar("short_video_id")
    .references(() => shortVideos.id)
    .notNull(),
  effectType: videoEffectTypeEnum("effect_type").notNull(),
  effectId: varchar("effect_id").notNull(), // reference to effect library
  effectName: varchar("effect_name").notNull(),
  startTime: decimal("start_time", { precision: 6, scale: 3 }), // seconds with milliseconds
  endTime: decimal("end_time", { precision: 6, scale: 3 }),
  intensity: decimal("intensity", { precision: 3, scale: 2 }).default("1.00"),
  parameters: jsonb("parameters"), // effect-specific settings
  layerOrder: integer("layer_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Hashtags table
export const hashtags = pgTable("hashtags", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: varchar("name").unique().notNull(),
  category: hashtagCategoryEnum("category").default("other"),
  usageCount: integer("usage_count").default(0),
  trendingScore: decimal("trending_score", { precision: 5, scale: 2 }).default(
    "0.00",
  ),
  isBlocked: boolean("is_blocked").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  lastUsed: timestamp("last_used").defaultNow(),
});

// Short Video Hashtags junction table
export const shortVideoHashtags = pgTable("short_video_hashtags", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  shortVideoId: varchar("short_video_id")
    .references(() => shortVideos.id)
    .notNull(),
  hashtagId: varchar("hashtag_id")
    .references(() => hashtags.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Short Video Reactions table
export const shortVideoReactions = pgTable("short_video_reactions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .references(() => users.id)
    .notNull(),
  shortVideoId: varchar("short_video_id")
    .references(() => shortVideos.id)
    .notNull(),
  reactionType: reactionTypeEnum("reaction_type").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Short Video Views table (for analytics)
export const shortVideoViews = pgTable("short_video_views", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  shortVideoId: varchar("short_video_id")
    .references(() => shortVideos.id)
    .notNull(),
  watchTime: integer("watch_time"), // seconds watched
  completedView: boolean("completed_view").default(false),
  deviceType: varchar("device_type"), // mobile, desktop, tablet
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  referrer: varchar("referrer"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Algorithm Preferences table
export const algorithmPreferences = pgTable("algorithm_preferences", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .references(() => users.id)
    .notNull(),
  preferredCategories: jsonb("preferred_categories"), // array of categories
  interactionWeights: jsonb("interaction_weights"), // like: 1.0, comment: 2.0, share: 3.0
  contentTypePreferences: jsonb("content_type_preferences"), // solo, couple, etc.
  creatorAffinities: jsonb("creator_affinities"), // creator_id -> affinity_score
  hashtagAffinities: jsonb("hashtag_affinities"), // hashtag -> affinity_score
  sessionDuration: integer("avg_session_duration"), // average session in minutes
  dailyUsagePattern: jsonb("daily_usage_pattern"), // hourly usage distribution
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// 2257 Compliance Records table
export const complianceRecords = pgTable("compliance_records", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .references(() => users.id)
    .notNull(),
  legalName: varchar("legal_name").notNull(),
  stageName: varchar("stage_name"),
  maidenName: varchar("maiden_name"),
  previousLegalName: varchar("previous_legal_name"),
  otherKnownNames: text("other_known_names"),
  dateOfBirth: timestamp("date_of_birth").notNull(),
  age: integer("age").notNull(),
  idType: idTypeEnum("id_type").notNull(),
  idNumber: varchar("id_number").notNull(),
  idState: varchar("id_state"),
  idCountry: varchar("id_country").default("US"),
  address: text("address").notNull(),
  city: varchar("city").notNull(),
  state: varchar("state").notNull(),
  zipCode: varchar("zip_code").notNull(),
  cellPhone: varchar("cell_phone"),
  homePhone: varchar("home_phone"),
  idImageUrl: varchar("id_image_url").notNull(),
  signatureImageUrl: varchar("signature_image_url"),
  verificationType:
    verificationTypeEnum("verification_type").default("primary_star"),
  status: complianceStatusEnum("status").default("pending"),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  expiresAt: timestamp("expires_at"),
  formData: jsonb("form_data"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Co-Star Verification table
export const costarVerifications = pgTable("costar_verifications", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  primaryCreatorId: varchar("primary_creator_id")
    .references(() => users.id)
    .notNull(),
  costarUserId: varchar("costar_user_id").references(() => users.id),
  costarEmail: varchar("costar_email").notNull(),
  costarName: varchar("costar_name").notNull(),
  complianceRecordId: varchar("compliance_record_id").references(
    () => complianceRecords.id,
  ),
  contentCreationDate: timestamp("content_creation_date").notNull(),
  postId: varchar("post_id").references(() => posts.id),
  status: complianceStatusEnum("status").default("pending"),
  verificationToken: varchar("verification_token").unique(),
  qrCodeUrl: varchar("qr_code_url"),
  inviteEmailSent: boolean("invite_email_sent").default(false),
  formCompletedAt: timestamp("form_completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Co-Star Invitations table
export const costarInvitations = pgTable("costar_invitations", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  primaryCreatorId: varchar("primary_creator_id")
    .references(() => users.id)
    .notNull(),
  costarEmail: varchar("costar_email").notNull(),
  costarName: varchar("costar_name").notNull(),
  inviteToken: varchar("invite_token").unique().notNull(),
  qrCode: text("qr_code"),
  inviteUrl: text("invite_url").notNull(),
  emailSent: boolean("email_sent").default(false),
  isUsed: boolean("is_used").default(false),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Audit Log table
export const auditLog = pgTable("audit_log", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  entityType: varchar("entity_type").notNull(), // posts, compliance_records, users, etc.
  entityId: varchar("entity_id").notNull(),
  action: auditActionEnum("action").notNull(),
  performedBy: varchar("performed_by")
    .references(() => users.id)
    .notNull(),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  changes: jsonb("changes"), // Before/after values
  reason: text("reason"),
  timestamp: timestamp("timestamp").defaultNow(),
  retentionUntil: timestamp("retention_until").notNull(), // 7 years for compliance
});

// Perfect CRM Sync table
export const perfectCrmSync = pgTable("perfect_crm_sync", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  entityType: varchar("entity_type").notNull(), // users, transactions, subscriptions
  entityId: varchar("entity_id").notNull(),
  crmContactId: varchar("crm_contact_id"),
  syncStatus: varchar("sync_status").default("pending"), // pending, synced, failed
  lastSyncAt: timestamp("last_sync_at"),
  syncData: jsonb("sync_data"),
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// VerifyMy Verification table
export const verifyMyVerifications = pgTable("verify_my_verifications", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .references(() => users.id)
    .notNull(),
  verifyMySessionId: varchar("verify_my_session_id").unique(),
  verificationType: varchar("verification_type").notNull(), // age_verification, compliance_2257, costar_verification
  status: verifyMyStatusEnum("status").default("pending"),
  ageVerified: boolean("age_verified").default(false),
  documentsVerified: boolean("documents_verified").default(false),
  identityScore: decimal("identity_score", { precision: 5, scale: 2 }), // 0-100
  riskScore: decimal("risk_score", { precision: 5, scale: 2 }), // 0-100
  verificationData: jsonb("verification_data"), // Full VerifyMy response
  callbackUrl: text("callback_url"),
  expiresAt: timestamp("expires_at"),
  verifiedAt: timestamp("verified_at"),
  failureReason: text("failure_reason"),
  retryCount: integer("retry_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Uploaded Documents table
export const uploadedDocuments = pgTable("uploaded_documents", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .references(() => users.id)
    .notNull(),
  verifyMyVerificationId: varchar("verify_my_verification_id").references(
    () => verifyMyVerifications.id,
  ),
  complianceRecordId: varchar("compliance_record_id").references(
    () => complianceRecords.id,
  ),
  documentType: documentTypeEnum("document_type").notNull(),
  fileName: varchar("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type"),
  isVerified: boolean("is_verified").default(false),
  verificationData: jsonb("verification_data"),
  expiresAt: timestamp("expires_at"), // 7 years for compliance
  createdAt: timestamp("created_at").defaultNow(),
});

// AI Moderation Results table
export const moderationResults = pgTable("moderation_results", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  entityType: varchar("entity_type").notNull(), // posts, messages, users, documents
  entityId: varchar("entity_id").notNull(),
  moderationService: varchar("moderation_service").default("openai"), // openai, verify_my
  status: moderationStatusEnum("status").default("pending"),
  classification: contentClassificationEnum("classification"),
  confidenceScore: decimal("confidence_score", { precision: 5, scale: 2 }), // 0-100
  flaggedCategories: text("flagged_categories").array(), // Array of flagged categories
  moderationData: jsonb("moderation_data"), // Full AI response
  humanReviewRequired: boolean("human_review_required").default(false),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  appealSubmitted: boolean("appeal_submitted").default(false),
  appealData: jsonb("appeal_data"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Content Blur Settings table (for age-gated content)
export const contentBlurSettings = pgTable("content_blur_settings", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .references(() => users.id)
    .notNull(),
  ageVerificationRequired: boolean("age_verification_required").default(true),
  verifyMyCompleted: boolean("verify_my_completed").default(false),
  complianceCompleted: boolean("compliance_completed").default(false),
  contentBlurred: boolean("content_blurred").default(true),
  blurLevel: varchar("blur_level").default("high"), // low, medium, high, complete
  allowedContentTypes: text("allowed_content_types").array().default([]), // Array of allowed content types before verification
  lastVerificationCheck: timestamp("last_verification_check"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Auth providers table
export const authProviders = pgTable("auth_providers", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .references(() => users.id)
    .notNull(),
  provider: authProviderEnum("provider").notNull(),
  providerId: varchar("provider_id").notNull(),
  providerEmail: varchar("provider_email"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .references(() => users.id)
    .notNull(),
  type: notificationTypeEnum("type").notNull(),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  data: jsonb("data"),
  isRead: boolean("is_read").default(false),
  isPushSent: boolean("is_push_sent").default(false),
  isEmailSent: boolean("is_email_sent").default(false),
  isSmsSent: boolean("is_sms_sent").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Creator performance table
export const creatorPerformance = pgTable("creator_performance", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id")
    .references(() => users.id)
    .notNull(),
  weekStartDate: timestamp("week_start_date").notNull(),
  weekEndDate: timestamp("week_end_date").notNull(),
  postsCount: integer("posts_count").default(0),
  likesReceived: integer("likes_received").default(0),
  commentsReceived: integer("comments_received").default(0),
  newSubscribers: integer("new_subscribers").default(0),
  earningsAmount: decimal("earnings_amount", { precision: 10, scale: 2 }).default("0.00"),
  isTopPerformer: boolean("is_top_performer").default(false),
  lastReminderSent: timestamp("last_reminder_sent"),
  reminderCount: integer("reminder_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Verification codes table
export const verificationCodes = pgTable("verification_codes", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .references(() => users.id),
  email: varchar("email"),
  phoneNumber: varchar("phone_number"),
  code: varchar("code").notNull(),
  type: varchar("type").notNull(), // email_verification, phone_verification, password_reset, two_factor
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Media Assets table for processed media files
export const mediaAssets = pgTable("media_assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  originalFilename: varchar("original_filename").notNull(),
  quality: varchar("quality").notNull(), // thumbnail, low, medium, high, original
  format: varchar("format").notNull(),
  size: integer("size").notNull(),
  dimensions: text("dimensions"), // JSON string
  url: varchar("url").notNull(),
  bitrate: integer("bitrate"),
  duration: integer("duration"), // seconds
  processingTime: integer("processing_time"), // milliseconds
  metadata: text("metadata"), // JSON string
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Streaming Metrics table
export const streamingMetrics = pgTable("streaming_metrics", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  mediaId: varchar("media_id"),
  bufferingTime: integer("buffering_time").default(0),
  loadTime: integer("load_time").default(0),
  qualitySwitches: integer("quality_switches").default(0),
  dropouts: integer("dropouts").default(0),
  averageBitrate: integer("average_bitrate").default(0),
  userAgent: text("user_agent"),
  connectionSpeed: integer("connection_speed").default(0),
  timestamp: timestamp("timestamp").defaultNow()
});

// Blog Posts table for SEO-optimized content
export const blogPosts = pgTable("blog_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").references(() => users.id).notNull(),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  slug: varchar("slug").unique().notNull(),
  featuredImage: varchar("featured_image"),
  tags: text("tags"), // JSON array
  categories: text("categories"), // JSON array
  publishedAt: timestamp("published_at"),
  seoOptimization: text("seo_optimization"), // JSON object
  isPublished: boolean("is_published").default(false),
  viewCount: integer("view_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Removed duplicate hashtags table - using the one defined earlier

// SEO Metadata table
export const seoMetadata = pgTable("seo_metadata", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contentId: varchar("content_id").notNull(),
  contentType: varchar("content_type").notNull(), // 'post', 'blog', 'profile'
  title: varchar("title"),
  description: text("description"),
  keywords: text("keywords"), // JSON array
  canonicalUrl: varchar("canonical_url"),
  ogImage: varchar("og_image"),
  structuredData: text("structured_data"), // JSON object
  seoScore: integer("seo_score").default(0),
  lastOptimized: timestamp("last_optimized").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Push subscriptions table
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .references(() => users.id)
    .notNull(),
  endpoint: text("endpoint").notNull(),
  keys: jsonb("keys").notNull(), // p256dh and auth keys
  deviceType: varchar("device_type"), // web, ios, android
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  posts: many(posts),
  subscriptionsAsFan: many(subscriptions, {
    relationName: "fan_subscriptions",
  }),
  subscriptionsAsCreator: many(subscriptions, {
    relationName: "creator_subscriptions",
  }),
  sentMessages: many(messages, { relationName: "sent_messages" }),
  receivedMessages: many(messages, { relationName: "received_messages" }),
  transactions: many(transactions),
  likes: many(likes),
  comments: many(comments),
  ppvUnlocks: many(ppvUnlocks),
  complianceRecords: many(complianceRecords),
  costarVerificationsAsCreator: many(costarVerifications, {
    relationName: "creator_costars",
  }),
  costarVerificationsAsCostar: many(costarVerifications, {
    relationName: "costar_verifications",
  }),
  costarInvitations: many(costarInvitations),
  auditLogEntries: many(auditLog),
  perfectCrmSyncRecords: many(perfectCrmSync),
  verifyMyVerifications: many(verifyMyVerifications),
  uploadedDocuments: many(uploadedDocuments),
  moderationResults: many(moderationResults),
  contentBlurSettings: one(contentBlurSettings),
  authProviders: many(authProviders),
  notifications: many(notifications),
  creatorPerformanceRecords: many(creatorPerformance),
  verificationCodes: many(verificationCodes),
  pushSubscriptions: many(pushSubscriptions),
  mediaAssets: many(mediaAssets),
  blogPosts: many(blogPosts),
  hashtags: many(hashtags),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  creator: one(users, {
    fields: [posts.creatorId],
    references: [users.id],
  }),
  likes: many(likes),
  comments: many(comments),
  ppvUnlocks: many(ppvUnlocks),
  costarVerifications: many(costarVerifications),
}));

export const complianceRecordsRelations = relations(
  complianceRecords,
  ({ one, many }) => ({
    user: one(users, {
      fields: [complianceRecords.userId],
      references: [users.id],
    }),
    approvedByUser: one(users, {
      fields: [complianceRecords.approvedBy],
      references: [users.id],
    }),
    costarVerifications: many(costarVerifications),
  }),
);

export const costarVerificationsRelations = relations(
  costarVerifications,
  ({ one }) => ({
    primaryCreator: one(users, {
      fields: [costarVerifications.primaryCreatorId],
      references: [users.id],
      relationName: "creator_costars",
    }),
    costarUser: one(users, {
      fields: [costarVerifications.costarUserId],
      references: [users.id],
      relationName: "costar_verifications",
    }),
    complianceRecord: one(complianceRecords, {
      fields: [costarVerifications.complianceRecordId],
      references: [complianceRecords.id],
    }),
    post: one(posts, {
      fields: [costarVerifications.postId],
      references: [posts.id],
    }),
  }),
);

export const costarInvitationsRelations = relations(
  costarInvitations,
  ({ one }) => ({
    primaryCreator: one(users, {
      fields: [costarInvitations.primaryCreatorId],
      references: [users.id],
    }),
  }),
);

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  performedByUser: one(users, {
    fields: [auditLog.performedBy],
    references: [users.id],
  }),
}));

export const perfectCrmSyncRelations = relations(perfectCrmSync, ({ one }) => ({
  // No direct relations, entity can be users, posts, etc.
}));

export const verifyMyVerificationsRelations = relations(
  verifyMyVerifications,
  ({ one, many }) => ({
    user: one(users, {
      fields: [verifyMyVerifications.userId],
      references: [users.id],
    }),
    uploadedDocuments: many(uploadedDocuments),
  }),
);

export const uploadedDocumentsRelations = relations(
  uploadedDocuments,
  ({ one }) => ({
    user: one(users, {
      fields: [uploadedDocuments.userId],
      references: [users.id],
    }),
    verifyMyVerification: one(verifyMyVerifications, {
      fields: [uploadedDocuments.verifyMyVerificationId],
      references: [verifyMyVerifications.id],
    }),
    complianceRecord: one(complianceRecords, {
      fields: [uploadedDocuments.complianceRecordId],
      references: [complianceRecords.id],
    }),
  }),
);

export const moderationResultsRelations = relations(
  moderationResults,
  ({ one }) => ({
    reviewedByUser: one(users, {
      fields: [moderationResults.reviewedBy],
      references: [users.id],
    }),
  }),
);

export const contentBlurSettingsRelations = relations(
  contentBlurSettings,
  ({ one }) => ({
    user: one(users, {
      fields: [contentBlurSettings.userId],
      references: [users.id],
    }),
  }),
);

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  fanz: one(users, {
    fields: [subscriptions.fanId],
    references: [users.id],
    relationName: "fan_subscriptions",
  }),
  creator: one(users, {
    fields: [subscriptions.creatorId],
    references: [users.id],
    relationName: "creator_subscriptions",
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "sent_messages",
  }),
  receiver: one(users, {
    fields: [messages.receiverId],
    references: [users.id],
    relationName: "received_messages",
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  role: true,
  username: true,
  displayName: true,
  bio: true,
  subscriptionPrice: true,
});

export const insertPostSchema = createInsertSchema(posts).pick({
  content: true,
  mediaUrl: true,
  mediaType: true,
  postType: true,
  ppvPrice: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).pick({
  fanId: true,
  creatorId: true,
  price: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  receiverId: true,
  content: true,
  mediaUrl: true,
  isPpv: true,
  ppvPrice: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  recipientId: true,
  type: true,
  amount: true,
  description: true,
});

export const insertComplianceRecordSchema = createInsertSchema(
  complianceRecords,
).pick({
  userId: true,
  legalName: true,
  stageName: true,
  maidenName: true,
  previousLegalName: true,
  otherKnownNames: true,
  dateOfBirth: true,
  age: true,
  idType: true,
  idNumber: true,
  idState: true,
  idCountry: true,
  address: true,
  city: true,
  state: true,
  zipCode: true,
  cellPhone: true,
  homePhone: true,
  idImageUrl: true,
  verificationType: true,
});

export const insertCostarVerificationSchema = createInsertSchema(
  costarVerifications,
).pick({
  costarEmail: true,
  costarName: true,
  contentCreationDate: true,
  postId: true,
});

export const insertCostarInvitationSchema = createInsertSchema(
  costarInvitations,
).pick({
  costarEmail: true,
  costarName: true,
});

export const insertVerifyMyVerificationSchema = createInsertSchema(
  verifyMyVerifications,
).pick({
  verificationType: true,
  callbackUrl: true,
});

export const insertUploadedDocumentSchema = createInsertSchema(
  uploadedDocuments,
).pick({
  documentType: true,
  fileName: true,
  fileUrl: true,
  fileSize: true,
  mimeType: true,
});

export const insertModerationResultSchema = createInsertSchema(
  moderationResults,
).pick({
  entityType: true,
  entityId: true,
  moderationService: true,
});

export const insertContentBlurSettingsSchema = createInsertSchema(
  contentBlurSettings,
).pick({
  ageVerificationRequired: true,
  blurLevel: true,
  allowedContentTypes: true,
});

// Insert schemas for new auth and notification tables
export const insertAuthProviderSchema = createInsertSchema(authProviders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  isRead: true,
  isPushSent: true,
  isEmailSent: true,
  isSmsSent: true,
  createdAt: true,
});

export const insertCreatorPerformanceSchema = createInsertSchema(creatorPerformance).omit({
  id: true,
  isTopPerformer: true,
  lastReminderSent: true,
  reminderCount: true,
  createdAt: true,
});

export const insertVerificationCodeSchema = createInsertSchema(verificationCodes).omit({
  id: true,
  isUsed: true,
  createdAt: true,
});

export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).omit({
  id: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema> & { id: string };
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Post = typeof posts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type PpvUnlock = typeof ppvUnlocks.$inferSelect;
export type Like = typeof likes.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type ComplianceRecord = typeof complianceRecords.$inferSelect;
export type InsertComplianceRecord = z.infer<
  typeof insertComplianceRecordSchema
>;
export type CostarVerification = typeof costarVerifications.$inferSelect;
export type InsertCostarVerification = z.infer<
  typeof insertCostarVerificationSchema
>;
export type CostarInvitation = typeof costarInvitations.$inferSelect;
export type InsertCostarInvitation = z.infer<
  typeof insertCostarInvitationSchema
>;
export type AuditLog = typeof auditLog.$inferSelect;
export type PerfectCrmSync = typeof perfectCrmSync.$inferSelect;
export type VerifyMyVerification = typeof verifyMyVerifications.$inferSelect;
export type InsertVerifyMyVerification = z.infer<
  typeof insertVerifyMyVerificationSchema
>;
export type UploadedDocument = typeof uploadedDocuments.$inferSelect;
export type InsertUploadedDocument = z.infer<
  typeof insertUploadedDocumentSchema
>;
export type ModerationResult = typeof moderationResults.$inferSelect;
export type InsertModerationResult = z.infer<
  typeof insertModerationResultSchema
>;
export type ContentBlurSettings = typeof contentBlurSettings.$inferSelect;
export type InsertContentBlurSettings = z.infer<
  typeof insertContentBlurSettingsSchema
>;
export type AuthProvider = typeof authProviders.$inferSelect;
export type InsertAuthProvider = z.infer<typeof insertAuthProviderSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type CreatorPerformance = typeof creatorPerformance.$inferSelect;
export type InsertCreatorPerformance = z.infer<typeof insertCreatorPerformanceSchema>;
export type VerificationCode = typeof verificationCodes.$inferSelect;
export type InsertVerificationCode = z.infer<typeof insertVerificationCodeSchema>;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = z.infer<typeof insertPushSubscriptionSchema>;

// Short Video schemas
export const insertShortVideoSchema = createInsertSchema(shortVideos).omit({
  id: true,
  viewsCount: true,
  likesCount: true,
  commentsCount: true,
  sharesCount: true,
  engagementScore: true,
  algorithmBoost: true,
  createdAt: true,
  publishedAt: true,
  updatedAt: true,
});

export const insertVideoEffectSchema = createInsertSchema(videoEffects).omit({
  id: true,
  createdAt: true,
});

export const insertHashtagSchema = createInsertSchema(hashtags).omit({
  id: true,
  usageCount: true,
  trendingScore: true,
  isBlocked: true,
  createdAt: true,
  lastUsed: true,
});

export const insertShortVideoHashtagSchema = createInsertSchema(
  shortVideoHashtags,
).omit({
  id: true,
  createdAt: true,
});

export const insertShortVideoReactionSchema = createInsertSchema(
  shortVideoReactions,
).omit({
  id: true,
  createdAt: true,
});

export const insertShortVideoViewSchema = createInsertSchema(
  shortVideoViews,
).omit({
  id: true,
  createdAt: true,
});

export const insertAlgorithmPreferencesSchema = createInsertSchema(
  algorithmPreferences,
).omit({
  id: true,
  lastUpdated: true,
  createdAt: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
});

// Page Builder enums
export const pageStatusEnum = pgEnum("page_status", [
  "draft",
  "published",
  "archived",
]);

export const componentTypeEnum = pgEnum("component_type", [
  "hero",
  "features",
  "text",
  "image",
  "video",
  "grid",
  "card",
  "button",
  "form",
  "testimonials",
  "pricing",
  "cta",
  "spacer",
  "divider",
]);

// Page Builder tables
export const pages = pgTable("pages", {
  id: varchar("id").primaryKey(),
  title: varchar("title").notNull(),
  slug: varchar("slug").unique().notNull(),
  description: text("description"),
  status: pageStatusEnum("status").default("draft").notNull(),
  ownerId: varchar("owner_id").references(() => users.id),
  isHomepage: boolean("is_homepage").default(false),
  seoTitle: varchar("seo_title"),
  seoDescription: text("seo_description"),
  customCss: text("custom_css"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const pageComponents = pgTable("page_components", {
  id: varchar("id").primaryKey(),
  pageId: varchar("page_id")
    .references(() => pages.id, { onDelete: "cascade" })
    .notNull(),
  componentType: componentTypeEnum("component_type").notNull(),
  order: integer("order").notNull(),
  config: jsonb("config").notNull(),
  styles: jsonb("styles"),
  isVisible: boolean("is_visible").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const componentLibrary = pgTable("component_library", {
  id: varchar("id").primaryKey(),
  name: varchar("name").notNull(),
  componentType: componentTypeEnum("component_type").notNull(),
  category: varchar("category").notNull(),
  description: text("description"),
  thumbnail: varchar("thumbnail"),
  defaultConfig: jsonb("default_config").notNull(),
  defaultStyles: jsonb("default_styles"),
  isPublic: boolean("is_public").default(true),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Page Builder relations
export const pagesRelations = relations(pages, ({ one, many }) => ({
  owner: one(users, {
    fields: [pages.ownerId],
    references: [users.id],
  }),
  components: many(pageComponents),
}));

export const pageComponentsRelations = relations(pageComponents, ({ one }) => ({
  page: one(pages, {
    fields: [pageComponents.pageId],
    references: [pages.id],
  }),
}));

export const componentLibraryRelations = relations(
  componentLibrary,
  ({ one }) => ({
    creator: one(users, {
      fields: [componentLibrary.createdBy],
      references: [users.id],
    }),
  }),
);

// Page Builder insert schemas
export const insertPageSchema = createInsertSchema(pages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPageComponentSchema = createInsertSchema(
  pageComponents,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertComponentLibrarySchema = createInsertSchema(
  componentLibrary,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Short Video types
export type ShortVideo = typeof shortVideos.$inferSelect;
export type InsertShortVideo = z.infer<typeof insertShortVideoSchema>;
export type VideoEffect = typeof videoEffects.$inferSelect;
export type InsertVideoEffect = z.infer<typeof insertVideoEffectSchema>;
export type Hashtag = typeof hashtags.$inferSelect;
export type InsertHashtag = z.infer<typeof insertHashtagSchema>;
export type ShortVideoHashtag = typeof shortVideoHashtags.$inferSelect;
export type InsertShortVideoHashtag = z.infer<
  typeof insertShortVideoHashtagSchema
>;
export type ShortVideoReaction = typeof shortVideoReactions.$inferSelect;
export type InsertShortVideoReaction = z.infer<
  typeof insertShortVideoReactionSchema
>;
export type ShortVideoView = typeof shortVideoViews.$inferSelect;
export type InsertShortVideoView = z.infer<typeof insertShortVideoViewSchema>;
export type AlgorithmPreferences = typeof algorithmPreferences.$inferSelect;
export type InsertAlgorithmPreferences = z.infer<
  typeof insertAlgorithmPreferencesSchema
>;
export type InsertComment = z.infer<typeof insertCommentSchema>;

// Page Builder types
export type Page = typeof pages.$inferSelect;
export type InsertPage = z.infer<typeof insertPageSchema>;
export type PageComponent = typeof pageComponents.$inferSelect;
export type InsertPageComponent = z.infer<typeof insertPageComponentSchema>;
export type ComponentLibrary = typeof componentLibrary.$inferSelect;
export type InsertComponentLibrary = z.infer<
  typeof insertComponentLibrarySchema
>;

// Platform Settings enums
export const settingTypeEnum = pgEnum("setting_type", [
  "string",
  "number",
  "boolean",
  "json",
]);

export const paymentProcessorEnum = pgEnum("payment_processor", [
  "stripe",
  "ccbill",
  "nowpayments",
  "triple_a",
  "bankful",
  "authorize_net",
]);

// Platform Settings tables
export const platformSettings = pgTable("platform_settings", {
  id: varchar("id").primaryKey(),
  category: varchar("category").notNull(),
  key: varchar("key").notNull(),
  value: text("value"),
  type: settingTypeEnum("type").default("string").notNull(),
  description: text("description"),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const paymentProcessorSettings = pgTable("payment_processor_settings", {
  id: varchar("id").primaryKey(),
  processor: paymentProcessorEnum("processor").notNull(),
  isEnabled: boolean("is_enabled").default(false),
  feePercentage: decimal("fee_percentage", { precision: 5, scale: 2 }).default(
    "0.00",
  ),
  feeFixed: decimal("fee_fixed", { precision: 10, scale: 2 }).default("0.00"),
  minAmount: decimal("min_amount", { precision: 10, scale: 2 }).default("1.00"),
  maxAmount: decimal("max_amount", { precision: 10, scale: 2 }),
  apiKey: text("api_key"),
  apiSecret: text("api_secret"),
  webhookSecret: text("webhook_secret"),
  testMode: boolean("test_mode").default(true),
  supportedCurrencies: text("supported_currencies").array().default(["USD"]),
  config: jsonb("config"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const transactionRefunds = pgTable("transaction_refunds", {
  id: varchar("id").primaryKey(),
  transactionId: varchar("transaction_id")
    .references(() => transactions.id)
    .notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  reason: text("reason"),
  refundedBy: varchar("refunded_by")
    .references(() => users.id)
    .notNull(),
  processorRefundId: varchar("processor_refund_id"),
  status: varchar("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Platform Settings relations
export const transactionRefundsRelations = relations(
  transactionRefunds,
  ({ one }) => ({
    transaction: one(transactions, {
      fields: [transactionRefunds.transactionId],
      references: [transactions.id],
    }),
    refundedByUser: one(users, {
      fields: [transactionRefunds.refundedBy],
      references: [users.id],
    }),
  }),
);

// Platform Settings insert schemas
export const insertPlatformSettingSchema = createInsertSchema(
  platformSettings,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentProcessorSettingSchema = createInsertSchema(
  paymentProcessorSettings,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTransactionRefundSchema = createInsertSchema(
  transactionRefunds,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Platform Settings types
export type PlatformSetting = typeof platformSettings.$inferSelect;
export type InsertPlatformSetting = z.infer<typeof insertPlatformSettingSchema>;
export type PaymentProcessorSetting =
  typeof paymentProcessorSettings.$inferSelect;
export type InsertPaymentProcessorSetting = z.infer<
  typeof insertPaymentProcessorSettingSchema
>;
export type TransactionRefund = typeof transactionRefunds.$inferSelect;
export type InsertTransactionRefund = z.infer<
  typeof insertTransactionRefundSchema
>;
