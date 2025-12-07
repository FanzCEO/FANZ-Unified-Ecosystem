import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  uuid,
  decimal,
  serial,
  numeric,
  real,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums
export const userRoleEnum = pgEnum("user_role", ["fan", "creator", "admin"]);
export const authProviderEnum = pgEnum("auth_provider", ["replit", "local"]);
export const userStatusEnum = pgEnum("user_status", ["active", "suspended", "banned"]);
export const kycStatusEnum = pgEnum("kyc_status", ["pending", "verified", "rejected"]);
export const mediaStatusEnum = pgEnum("media_status", ["uploaded", "processing", "approved", "rejected"]);
export const moderationStatusEnum = pgEnum("moderation_status", ["pending", "approved", "rejected"]);
export const payoutStatusEnum = pgEnum("payout_status", ["pending", "processing", "completed", "failed"]);
export const webhookStatusEnum = pgEnum("webhook_status", ["active", "inactive"]);
export const transactionStatusEnum = pgEnum("transaction_status", ["pending", "completed", "failed", "refunded", "disputed"]);
export const transactionTypeEnum = pgEnum("transaction_type", ["subscription", "tip", "content_purchase", "token_purchase"]);
export const paymentGatewayEnum = pgEnum("payment_gateway", ["rocketgate", "segpay", "ccbill", "solana", "ethereum", "tron", "fanzpay"]);
export const refundStatusEnum = pgEnum("refund_status", ["pending", "auto_approved", "manual_review", "approved", "denied", "processed"]);
export const trustScoreTierEnum = pgEnum("trust_score_tier", ["new", "bronze", "silver", "gold", "platinum", "banned"]);

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table (email/password authentication)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").unique(),
  email: varchar("email").unique(),
  password: text("password"), // required for new users, nullable for migration
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").default("fan"),
  authProvider: authProviderEnum("auth_provider").default("local"),
  status: userStatusEnum("status").default("active"),
  emailVerified: boolean("email_verified").default(false),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_users_email").on(table.email),
  index("idx_users_status").on(table.status),
  index("idx_users_last_login").on(table.lastLoginAt),
]);

// Password Reset Tokens (for forgot password flow)
// Token column stores SHA-256 hash, not plaintext
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(), // Stores SHA-256 hash
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_password_reset_token").on(table.token),
  index("idx_password_reset_user").on(table.userId),
  index("idx_password_reset_expires").on(table.expiresAt),
]);

// Email Recovery Tokens (for forgot email flow)
// Token column stores SHA-256 hash, not plaintext
export const emailRecoveryTokens = pgTable("email_recovery_tokens", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(), // Stores SHA-256 hash
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_email_recovery_token").on(table.token),
  index("idx_email_recovery_user").on(table.userId),
  index("idx_email_recovery_expires").on(table.expiresAt),
]);

// Email Verification Tokens (for email verification)
export const emailVerificationTokens = pgTable("email_verification_tokens", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_email_verification_token").on(table.token),
  index("idx_email_verification_user").on(table.userId),
  index("idx_email_verification_expires").on(table.expiresAt),
]);

// Profiles (creator/fan profiles)
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  displayName: varchar("display_name"),
  stageName: varchar("stage_name"), // creator's stage/performer name
  pronouns: varchar("pronouns"), // user's preferred pronouns
  bio: text("bio"),
  avatarUrl: varchar("avatar_url"),
  bannerUrl: varchar("banner_url"),
  kycStatus: kycStatusEnum("kyc_status").default("pending"),
  ageVerified: boolean("age_verified").default(false),
  complianceNotes: text("compliance_notes"),
  subscriptionPrice: decimal("subscription_price", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Onboarding Progress (track user onboarding steps)
export const onboardingStepEnum = pgEnum("onboarding_step", [
  "role_selection",
  "profile_setup",
  "interests_selection",
  "verification",
  "monetization",
  "completed"
]);

export const onboardingProgress = pgTable("onboarding_progress", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  currentStep: onboardingStepEnum("current_step").default("role_selection"),
  completedSteps: jsonb("completed_steps").default([]), // array of completed step names
  roleSelected: varchar("role_selected"), // "creator" or "fan"
  profileSetupComplete: boolean("profile_setup_complete").default(false),
  interestsSelected: boolean("interests_selected").default(false),
  verificationComplete: boolean("verification_complete").default(false),
  monetizationSetupComplete: boolean("monetization_setup_complete").default(false),
  onboardingComplete: boolean("onboarding_complete").default(false),
  firstPostCreated: boolean("first_post_created").default(false), // milestone
  firstTipSent: boolean("first_tip_sent").default(false), // milestone
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_onboarding_user").on(table.userId),
  index("idx_onboarding_step").on(table.currentStep),
]);

// Content Niches (predefined categories/tags)
export const contentNiches = pgTable("content_niches", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(),
  slug: varchar("slug").notNull().unique(),
  description: text("description"),
  iconUrl: varchar("icon_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// User Interests (fan interests and creator niches)
export const userInterests = pgTable("user_interests", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  nicheId: uuid("niche_id").references(() => contentNiches.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_user_interests").on(table.userId),
  index("idx_niche_users").on(table.nicheId),
]);

// Media Assets (content management)
export const mediaAssets = pgTable("media_assets", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").references(() => users.id).notNull(),
  title: varchar("title"),
  description: text("description"),
  s3Key: varchar("s3_key").notNull(),
  mimeType: varchar("mime_type"),
  fileSize: integer("file_size"),
  duration: integer("duration"), // for videos in seconds
  status: mediaStatusEnum("status").default("uploaded"),
  forensicSignature: text("forensic_signature"), // for piracy protection
  price: decimal("price", { precision: 10, scale: 2 }),
  isPremium: boolean("is_premium").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Posts (infinity scroll feed content)
export const posts = pgTable("posts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").references(() => users.id).notNull(),
  text: text("text"),
  mediaUrl: varchar("media_url"), // URL to media asset
  mediaType: varchar("media_type"), // image, video, etc.
  mediaAssetId: uuid("media_asset_id").references(() => mediaAssets.id), // optional link to mediaAssets
  isFree: boolean("is_free").default(false), // this specific post is free
  creatorAllowsFree: boolean("creator_allows_free").default(false), // creator has enabled free previews
  creatorIsAgeVerified: boolean("creator_is_age_verified").default(false), // creator passed age verification
  requiresSubscription: boolean("requires_subscription").default(true),
  requiresAgeVerification: boolean("requires_age_verification").default(true),
  viewCount: integer("view_count").default(0),
  likeCount: integer("like_count").default(0),
  commentCount: integer("comment_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Indexes for feed queries
  index("idx_creator_posts").on(table.creatorId, table.createdAt),
  index("idx_free_posts").on(table.isFree, table.createdAt),
  index("idx_post_created").on(table.createdAt),
  index("idx_subscription_posts").on(table.requiresSubscription, table.createdAt),
]);

// Post Likes (user likes on posts)
export const postLikes = pgTable("post_likes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: uuid("post_id").references(() => posts.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_post_likes_post").on(table.postId),
  index("idx_post_likes_user").on(table.userId),
  index("idx_unique_post_like").on(table.postId, table.userId),
]);

// Post Comments (user comments on posts)
export const postComments = pgTable("post_comments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: uuid("post_id").references(() => posts.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_post_comments_post").on(table.postId, table.createdAt),
  index("idx_post_comments_user").on(table.userId),
]);

// Follows (fan follows creator for free content)
export const follows = pgTable("follows", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  fanId: varchar("fan_id").references(() => users.id).notNull(),
  creatorId: varchar("creator_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  // Unique constraint: fan can only follow a creator once
  index("idx_unique_follow").on(table.fanId, table.creatorId),
]);

// Story Moments (24-hour expiring content)
export const storyMoments = pgTable("story_moments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").references(() => users.id).notNull(),
  mediaUrl: varchar("media_url").notNull(),
  mediaType: varchar("media_type").notNull(), // image, video
  mediaThumbnailUrl: varchar("media_thumbnail_url"),
  caption: text("caption"),
  isFree: boolean("is_free").default(false),
  requiresSubscription: boolean("requires_subscription").default(true),
  viewCount: integer("view_count").default(0),
  expiresAt: timestamp("expires_at").notNull(), // Auto-delete after 24h
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_story_creator").on(table.creatorId, table.createdAt),
  index("idx_story_expires").on(table.expiresAt),
  index("idx_story_active").on(table.creatorId, table.expiresAt),
]);

// Story Views (track who viewed stories)
export const storyViews = pgTable("story_views", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  storyId: uuid("story_id").references(() => storyMoments.id).notNull(),
  viewerId: varchar("viewer_id").references(() => users.id).notNull(),
  viewedAt: timestamp("viewed_at").defaultNow(),
}, (table) => [
  index("idx_story_view_unique").on(table.storyId, table.viewerId),
]);

// Fan Levels & Gamification
export const fanLevels = pgTable("fan_levels", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  level: integer("level").default(1),
  xp: integer("xp").default(0),
  totalSpentCents: integer("total_spent_cents").default(0),
  totalTips: integer("total_tips").default(0),
  totalSubscriptions: integer("total_subscriptions").default(0),
  streakDays: integer("streak_days").default(0),
  lastActivityDate: timestamp("last_activity_date"),
  badges: jsonb("badges").default([]), // array of badge IDs
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_fan_level").on(table.level),
  index("idx_fan_xp").on(table.xp),
]);

// Creator Analytics - Real-time metrics dashboard
export const creatorAnalytics = pgTable("creator_analytics", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").references(() => users.id).notNull(),
  period: varchar("period").notNull(), // "daily", "weekly", "monthly"
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  totalViews: integer("total_views").default(0),
  uniqueViewers: integer("unique_viewers").default(0),
  totalLikes: integer("total_likes").default(0),
  totalComments: integer("total_comments").default(0),
  totalShares: integer("total_shares").default(0),
  newSubscribers: integer("new_subscribers").default(0),
  totalSubscribers: integer("total_subscribers").default(0),
  subscriptionRevenue: integer("subscription_revenue").default(0), // cents
  tipsRevenue: integer("tips_revenue").default(0), // cents
  contentRevenue: integer("content_revenue").default(0), // cents
  totalRevenue: integer("total_revenue").default(0), // cents
  postsCreated: integer("posts_created").default(0),
  storiesCreated: integer("stories_created").default(0),
  averageEngagementRate: real("average_engagement_rate").default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_analytics_creator_period").on(table.creatorId, table.period, table.startDate),
]);

// KYC Verifications (compliance)
export const kycVerifications = pgTable("kyc_verifications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  provider: varchar("provider"), // VerifyMy, AgeChecker, etc.
  status: kycStatusEnum("status").default("pending"),
  dataJson: jsonb("data_json"), // verification data
  documentUrls: jsonb("document_urls"), // array of document URLs
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 2257 Records (adult industry compliance)
export const records2257 = pgTable("records_2257", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  docType: varchar("doc_type").notNull(), // government_id, secondary_id, etc.
  s3Key: varchar("s3_key").notNull(),
  checksum: varchar("checksum").notNull(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Enhanced NSFW level enum for content moderation
export const nsfwLevelEnum = pgEnum("nsfw_level", ["safe", "suggestive", "explicit", "illegal"]);

// Moderation Queue
export const moderationQueue = pgTable("moderation_queue", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  mediaId: uuid("media_id").references(() => mediaAssets.id).notNull(),
  status: moderationStatusEnum("status").default("pending"),
  reviewerId: varchar("reviewer_id").references(() => users.id),
  notes: text("notes"),
  priority: integer("priority").default(0),
  autoFlags: jsonb("auto_flags"), // automated moderation flags
  
  // Enhanced AI detection fields
  nsfwLevel: nsfwLevelEnum("nsfw_level"),
  nsfwScore: real("nsfw_score"), // 0.0 to 1.0 confidence score
  deepfakeDetected: boolean("deepfake_detected").default(false),
  deepfakeConfidence: real("deepfake_confidence"), // 0.0 to 1.0
  aiLabels: jsonb("ai_labels"), // detected objects/scenes
  facesDetected: integer("faces_detected").default(0),
  minorsDetected: boolean("minors_detected").default(false),
  violenceDetected: boolean("violence_detected").default(false),
  weaponsDetected: boolean("weapons_detected").default(false),
  drugsDetected: boolean("drugs_detected").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Audit Logs (compliance tracking)
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  actorId: varchar("actor_id").references(() => users.id),
  action: varchar("action").notNull(),
  targetType: varchar("target_type").notNull(),
  targetId: varchar("target_id").notNull(),
  metadata: jsonb("metadata"),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Payout Accounts (adult-friendly providers only)
export const payoutAccounts = pgTable("payout_accounts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  provider: varchar("provider").notNull(), // Paxum, ePayService, etc.
  accountRef: varchar("account_ref").notNull(), // email or account ID
  status: varchar("status").default("active"),
  metadata: jsonb("metadata"), // provider-specific data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payout Requests
export const payoutRequests = pgTable("payout_requests", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  payoutAccountId: uuid("payout_account_id").references(() => payoutAccounts.id).notNull(),
  amountCents: integer("amount_cents").notNull(),
  currency: varchar("currency").default("USD"),
  status: payoutStatusEnum("status").default("pending"),
  providerRef: varchar("provider_ref"), // provider transaction ID
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Webhooks (payment notifications)
export const webhooks = pgTable("webhooks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  url: varchar("url").notNull(),
  secret: varchar("secret").notNull(),
  eventsJson: jsonb("events_json").notNull(), // array of event types
  status: webhookStatusEnum("status").default("active"),
  lastTriggered: timestamp("last_triggered"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Subscriptions
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  fanId: varchar("fan_id").references(() => users.id).notNull(),
  creatorId: varchar("creator_id").references(() => users.id).notNull(),
  status: varchar("status").default("active"),
  priceAtPurchase: decimal("price_at_purchase", { precision: 10, scale: 2 }),
  expiresAt: timestamp("expires_at"),
  autoRenew: boolean("auto_renew").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Messages (for real-time chat)
export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").references(() => users.id).notNull(),
  recipientId: varchar("recipient_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  mediaUrl: varchar("media_url"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// FanzTrust™ Transactions (all payment gateway transactions)
export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  fanId: varchar("fan_id").references(() => users.id).notNull(),
  creatorId: varchar("creator_id").references(() => users.id).notNull(),
  gateway: paymentGatewayEnum("gateway").notNull(),
  txid: varchar("txid").notNull(), // transaction ID from gateway or blockchain
  type: transactionTypeEnum("type").notNull(),
  status: transactionStatusEnum("status").default("pending"),
  amountCents: integer("amount_cents").notNull(),
  currency: varchar("currency").default("USD"),
  subscriptionId: uuid("subscription_id").references(() => subscriptions.id),
  metadata: jsonb("metadata"), // gateway-specific data (last 4 digits, etc.)
  ipAddress: varchar("ip_address"),
  deviceFingerprint: varchar("device_fingerprint"),
  walletAddress: varchar("wallet_address"), // for crypto transactions
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Unique constraint on gateway + txid to prevent duplicate transactions
  index("idx_gateway_txid").on(table.gateway, table.txid),
  // Indexes for common query patterns
  index("idx_fan_transactions").on(table.fanId, table.createdAt),
  index("idx_creator_transactions").on(table.creatorId, table.createdAt),
  index("idx_transaction_status").on(table.status),
]);

// FanzTrust™ Refund Requests
export const refundRequests = pgTable("refund_requests", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  transactionId: uuid("transaction_id").references(() => transactions.id).notNull().unique(), // One refund per transaction
  fanId: varchar("fan_id").references(() => users.id).notNull(),
  creatorId: varchar("creator_id").references(() => users.id).notNull(),
  status: refundStatusEnum("status").default("pending"),
  reason: text("reason"),
  verificationData: jsonb("verification_data"), // proof submitted by fan
  autoCheckResult: jsonb("auto_check_result"), // auto-verification results
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewNotes: text("review_notes"),
  refundedAmountCents: integer("refunded_amount_cents"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Indexes for query patterns
  index("idx_fan_refunds").on(table.fanId, table.status),
  index("idx_creator_refunds").on(table.creatorId, table.status),
  index("idx_refund_status").on(table.status),
]);

// FanzTrust™ Trust Scores (fan reputation system)
export const trustScores = pgTable("trust_scores", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  score: integer("score").default(100), // 0-1000 scale
  tier: trustScoreTierEnum("tier").default("new"),
  totalTransactions: integer("total_transactions").default(0),
  successfulTransactions: integer("successful_transactions").default(0),
  disputedTransactions: integer("disputed_transactions").default(0),
  refundAttempts: integer("refund_attempts").default(0),
  approvedRefunds: integer("approved_refunds").default(0),
  deniedRefunds: integer("denied_refunds").default(0),
  abuseFlags: integer("abuse_flags").default(0),
  lastActivityAt: timestamp("last_activity_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// FanzPay Wallets (proprietary token system)
export const fanzWallets = pgTable("fanz_wallets", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  fanzTokenBalance: integer("fanz_token_balance").default(0), // FanzToken balance in cents
  fanzCoinBalance: integer("fanz_coin_balance").default(0), // FanzCoin balance (loyalty points)
  fanzCreditBalance: integer("fanz_credit_balance").default(0), // FanzCredit (promotional credits)
  lifetimeEarnings: integer("lifetime_earnings").default(0),
  lifetimeSpent: integer("lifetime_spent").default(0),
  status: varchar("status").default("active"), // active, frozen, suspended
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// FanzCard Virtual Cards (fan payment cards)
export const fanzCards = pgTable("fanz_cards", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  cardToken: varchar("card_token").notNull().unique(), // tokenized card reference
  last4: varchar("last_4").notNull(),
  brand: varchar("brand"), // visa, mastercard, etc.
  expiryMonth: integer("expiry_month"),
  expiryYear: integer("expiry_year"),
  billingZip: varchar("billing_zip"),
  isDefault: boolean("is_default").default(false),
  status: varchar("status").default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payment Methods (saved payment info for fans)
export const paymentMethods = pgTable("payment_methods", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  type: varchar("type").notNull(), // card, crypto_wallet, fanzpay
  gateway: paymentGatewayEnum("gateway").notNull(),
  reference: varchar("reference").notNull(), // wallet address or card token
  displayName: varchar("display_name"), // e.g., "Visa ••••1234" or "Solana Wallet"
  isDefault: boolean("is_default").default(false),
  metadata: jsonb("metadata"), // extra gateway-specific info
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles),
  mediaAssets: many(mediaAssets),
  posts: many(posts),
  kycVerifications: many(kycVerifications),
  records2257: many(records2257),
  payoutAccounts: many(payoutAccounts),
  payoutRequests: many(payoutRequests),
  webhooks: many(webhooks),
  sentMessages: many(messages, { relationName: "sentMessages" }),
  receivedMessages: many(messages, { relationName: "receivedMessages" }),
  fanSubscriptions: many(subscriptions, { relationName: "fanSubscriptions" }),
  creatorSubscriptions: many(subscriptions, { relationName: "creatorSubscriptions" }),
  fanTransactions: many(transactions, { relationName: "fanTransactions" }),
  creatorTransactions: many(transactions, { relationName: "creatorTransactions" }),
  fanRefundRequests: many(refundRequests, { relationName: "fanRefundRequests" }),
  creatorRefundRequests: many(refundRequests, { relationName: "creatorRefundRequests" }),
  trustScore: one(trustScores),
  fanzWallet: one(fanzWallets),
  fanzCards: many(fanzCards),
  paymentMethods: many(paymentMethods),
  following: many(follows, { relationName: "fanFollows" }),
  followers: many(follows, { relationName: "creatorFollows" }),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, { fields: [profiles.userId], references: [users.id] }),
}));

export const mediaAssetsRelations = relations(mediaAssets, ({ one, many }) => ({
  owner: one(users, { fields: [mediaAssets.ownerId], references: [users.id] }),
  moderationItems: many(moderationQueue),
  posts: many(posts),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  creator: one(users, { fields: [posts.creatorId], references: [users.id] }),
  mediaAsset: one(mediaAssets, { fields: [posts.mediaAssetId], references: [mediaAssets.id] }),
}));

export const followsRelations = relations(follows, ({ one }) => ({
  fan: one(users, { fields: [follows.fanId], references: [users.id], relationName: "fanFollows" }),
  creator: one(users, { fields: [follows.creatorId], references: [users.id], relationName: "creatorFollows" }),
}));

export const moderationQueueRelations = relations(moderationQueue, ({ one }) => ({
  media: one(mediaAssets, { fields: [moderationQueue.mediaId], references: [mediaAssets.id] }),
  reviewer: one(users, { fields: [moderationQueue.reviewerId], references: [users.id] }),
}));

export const payoutAccountsRelations = relations(payoutAccounts, ({ one, many }) => ({
  user: one(users, { fields: [payoutAccounts.userId], references: [users.id] }),
  payoutRequests: many(payoutRequests),
}));

export const payoutRequestsRelations = relations(payoutRequests, ({ one }) => ({
  user: one(users, { fields: [payoutRequests.userId], references: [users.id] }),
  payoutAccount: one(payoutAccounts, { fields: [payoutRequests.payoutAccountId], references: [payoutAccounts.id] }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  fan: one(users, { fields: [subscriptions.fanId], references: [users.id], relationName: "fanSubscriptions" }),
  creator: one(users, { fields: [subscriptions.creatorId], references: [users.id], relationName: "creatorSubscriptions" }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, { fields: [messages.senderId], references: [users.id], relationName: "sentMessages" }),
  recipient: one(users, { fields: [messages.recipientId], references: [users.id], relationName: "receivedMessages" }),
}));

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  fan: one(users, { fields: [transactions.fanId], references: [users.id], relationName: "fanTransactions" }),
  creator: one(users, { fields: [transactions.creatorId], references: [users.id], relationName: "creatorTransactions" }),
  subscription: one(subscriptions, { fields: [transactions.subscriptionId], references: [subscriptions.id] }),
  refundRequests: many(refundRequests),
}));

export const refundRequestsRelations = relations(refundRequests, ({ one }) => ({
  transaction: one(transactions, { fields: [refundRequests.transactionId], references: [transactions.id] }),
  fan: one(users, { fields: [refundRequests.fanId], references: [users.id], relationName: "fanRefundRequests" }),
  creator: one(users, { fields: [refundRequests.creatorId], references: [users.id], relationName: "creatorRefundRequests" }),
  reviewer: one(users, { fields: [refundRequests.reviewedBy], references: [users.id] }),
}));

export const trustScoresRelations = relations(trustScores, ({ one }) => ({
  user: one(users, { fields: [trustScores.userId], references: [users.id] }),
}));

export const fanzWalletsRelations = relations(fanzWallets, ({ one }) => ({
  user: one(users, { fields: [fanzWallets.userId], references: [users.id] }),
}));

export const fanzCardsRelations = relations(fanzCards, ({ one }) => ({
  user: one(users, { fields: [fanzCards.userId], references: [users.id] }),
}));

export const paymentMethodsRelations = relations(paymentMethods, ({ one }) => ({
  user: one(users, { fields: [paymentMethods.userId], references: [users.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const upsertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
  id: true,
  createdAt: true,
  usedAt: true,
});

export const insertEmailRecoveryTokenSchema = createInsertSchema(emailRecoveryTokens).omit({
  id: true,
  createdAt: true,
  usedAt: true,
});

export const insertEmailVerificationTokenSchema = createInsertSchema(emailVerificationTokens).omit({
  id: true,
  createdAt: true,
  usedAt: true,
});

export const insertProfileSchema = createInsertSchema(profiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMediaAssetSchema = createInsertSchema(mediaAssets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPayoutAccountSchema = createInsertSchema(payoutAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

// FanzTrust™ Insert Schemas
export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRefundRequestSchema = createInsertSchema(refundRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTrustScoreSchema = createInsertSchema(trustScores).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFanzWalletSchema = createInsertSchema(fanzWallets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFanzCardSchema = createInsertSchema(fanzCards).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentMethodSchema = createInsertSchema(paymentMethods).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
export type EmailRecoveryToken = typeof emailRecoveryTokens.$inferSelect;
export type InsertEmailRecoveryToken = z.infer<typeof insertEmailRecoveryTokenSchema>;
export type EmailVerificationToken = typeof emailVerificationTokens.$inferSelect;
export type InsertEmailVerificationToken = z.infer<typeof insertEmailVerificationTokenSchema>;
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type MediaAsset = typeof mediaAssets.$inferSelect;
export type InsertMediaAsset = z.infer<typeof insertMediaAssetSchema>;
export type PayoutAccount = typeof payoutAccounts.$inferSelect;
export type InsertPayoutAccount = z.infer<typeof insertPayoutAccountSchema>;
export type Message = z.infer<typeof insertMessageSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type ModerationItem = typeof moderationQueue.$inferSelect;
export type PayoutRequest = typeof payoutRequests.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;

// FanzTrust™ Types
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type RefundRequest = typeof refundRequests.$inferSelect;
export type InsertRefundRequest = z.infer<typeof insertRefundRequestSchema>;
export type TrustScore = typeof trustScores.$inferSelect;
export type InsertTrustScore = z.infer<typeof insertTrustScoreSchema>;
export type FanzWallet = typeof fanzWallets.$inferSelect;
export type InsertFanzWallet = z.infer<typeof insertFanzWalletSchema>;
export type FanzCard = typeof fanzCards.$inferSelect;
export type InsertFanzCard = z.infer<typeof insertFanzCardSchema>;
export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type InsertPaymentMethod = z.infer<typeof insertPaymentMethodSchema>;

// FanzTrust™ Request Validation Schemas
export const verifyTransactionSchema = z.object({
  creatorId: z.string().min(1, "Creator ID is required"),
  gateway: z.enum(["rocketgate", "segpay", "ccbill", "solana", "ethereum", "tron", "fanzpay"]),
  txid: z.string().min(1, "Transaction ID is required"),
  walletAddress: z.string().optional(),
  email: z.string().email().optional(),
});

export const requestRefundSchema = z.object({
  transactionId: z.string().uuid("Invalid transaction ID"),
  reason: z.string().min(10, "Reason must be at least 10 characters").max(1000),
  verificationData: z.record(z.any()).optional(),
});

export const reviewRefundSchema = z.object({
  notes: z.string().min(1, "Review notes are required").max(2000),
});

export const createPaymentMethodSchema = z.object({
  type: z.enum(["card", "crypto_wallet", "fanzpay"]),
  gateway: z.enum(["rocketgate", "segpay", "ccbill", "solana", "ethereum", "tron", "fanzpay"]),
  reference: z.string().min(1, "Payment reference is required"),
  displayName: z.string().min(1, "Display name is required").max(100),
  isDefault: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
});

export type VerifyTransactionRequest = z.infer<typeof verifyTransactionSchema>;
export type RequestRefundRequest = z.infer<typeof requestRefundSchema>;
export type ReviewRefundRequest = z.infer<typeof reviewRefundSchema>;
export type CreatePaymentMethodRequest = z.infer<typeof createPaymentMethodSchema>;

// Help desk tickets
export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category").notNull(), // "technical", "payment", "content", "account", "feature"
  priority: varchar("priority").default("medium"), // "low", "medium", "high", "urgent"
  status: varchar("status").default("open"), // "open", "in_progress", "resolved", "closed"
  assignedTo: varchar("assigned_to").references(() => users.id),
  tags: text("tags").array().default([]),
  attachments: jsonb("attachments"),
  lastResponseAt: timestamp("last_response_at"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Ticket responses/comments
export const ticketResponses = pgTable("ticket_responses", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").references(() => tickets.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  isInternal: boolean("is_internal").default(false), // Staff-only notes
  attachments: jsonb("attachments"),
  createdAt: timestamp("created_at").defaultNow()
});

// Wiki articles
export const wikiArticles = pgTable("wiki_articles", {
  id: varchar("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  category: varchar("category").notNull(),
  tags: text("tags").array().default([]),
  authorId: varchar("author_id").references(() => users.id),
  status: varchar("status").default("published"), // "draft", "published", "archived"
  viewCount: integer("view_count").default(0),
  helpfulVotes: integer("helpful_votes").default(0),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow()
});

// Tutorial content
export const tutorials = pgTable("tutorials", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  content: text("content").notNull(),
  category: varchar("category").notNull(), // "getting-started", "content-creation", "monetization", "technical"
  difficulty: varchar("difficulty").default("beginner"), // "beginner", "intermediate", "advanced"
  estimatedTime: integer("estimated_time"), // in minutes
  tags: text("tags").array().default([]),
  authorId: varchar("author_id").references(() => users.id),
  status: varchar("status").default("published"),
  viewCount: integer("view_count").default(0),
  completionCount: integer("completion_count").default(0),
  rating: numeric("rating", { precision: 3, scale: 2 }).default("0"),
  ratingCount: integer("rating_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Tutorial steps
export const tutorialSteps = pgTable("tutorial_steps", {
  id: serial("id").primaryKey(),
  tutorialId: integer("tutorial_id").references(() => tutorials.id).notNull(),
  stepNumber: integer("step_number").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  mediaUrl: varchar("media_url"),
  actionType: varchar("action_type"), // "click", "input", "navigate", "wait"
  targetSelector: varchar("target_selector"), // CSS selector for interactive elements
  createdAt: timestamp("created_at").defaultNow()
});

// User tutorial progress
export const tutorialProgress = pgTable("tutorial_progress", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  tutorialId: integer("tutorial_id").references(() => tutorials.id).notNull(),
  currentStep: integer("current_step").default(1),
  completedSteps: integer("completed_steps").array().default([]),
  status: varchar("status").default("started"), // "started", "completed", "abandoned"
  completedAt: timestamp("completed_at"),
  startedAt: timestamp("started_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// FAQ entries
export const faqEntries = pgTable("faq_entries", {
  id: serial("id").primaryKey(),
  question: varchar("question", { length: 500 }).notNull(),
  answer: text("answer").notNull(),
  category: varchar("category").notNull(),
  order: integer("order").default(0),
  isPublished: boolean("is_published").default(true),
  viewCount: integer("view_count").default(0),
  helpfulVotes: integer("helpful_votes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Relations for new tables
export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  user: one(users, { fields: [tickets.userId], references: [users.id] }),
  assignee: one(users, { fields: [tickets.assignedTo], references: [users.id] }),
  responses: many(ticketResponses),
}));

export const ticketResponsesRelations = relations(ticketResponses, ({ one }) => ({
  ticket: one(tickets, { fields: [ticketResponses.ticketId], references: [tickets.id] }),
  user: one(users, { fields: [ticketResponses.userId], references: [users.id] }),
}));

export const wikiArticlesRelations = relations(wikiArticles, ({ one }) => ({
  author: one(users, { fields: [wikiArticles.authorId], references: [users.id] }),
}));

export const tutorialsRelations = relations(tutorials, ({ one, many }) => ({
  author: one(users, { fields: [tutorials.authorId], references: [users.id] }),
  steps: many(tutorialSteps),
  progress: many(tutorialProgress),
}));

export const tutorialStepsRelations = relations(tutorialSteps, ({ one }) => ({
  tutorial: one(tutorials, { fields: [tutorialSteps.tutorialId], references: [tutorials.id] }),
}));

export const tutorialProgressRelations = relations(tutorialProgress, ({ one }) => ({
  user: one(users, { fields: [tutorialProgress.userId], references: [users.id] }),
  tutorial: one(tutorials, { fields: [tutorialProgress.tutorialId], references: [tutorials.id] }),
}));

// Insert schemas for new tables
export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Client-side ticket creation schema (only fields sent by frontend)
export const createTicketSchema = insertTicketSchema.omit({
  userId: true,
  status: true,
  assignedTo: true,
  tags: true,
  attachments: true,
  lastResponseAt: true,
  resolvedAt: true,
});

export const insertTicketResponseSchema = createInsertSchema(ticketResponses).omit({
  id: true,
  createdAt: true,
});

export const insertWikiArticleSchema = createInsertSchema(wikiArticles).omit({
  createdAt: true,
});

export const insertTutorialSchema = createInsertSchema(tutorials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTutorialStepSchema = createInsertSchema(tutorialSteps).omit({
  id: true,
  createdAt: true,
});

export const insertFaqEntrySchema = createInsertSchema(faqEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  viewCount: true,
  likeCount: true,
  commentCount: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPostLikeSchema = createInsertSchema(postLikes).omit({
  id: true,
  createdAt: true,
});

export const insertPostCommentSchema = createInsertSchema(postComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFollowSchema = createInsertSchema(follows).omit({
  id: true,
  createdAt: true,
});

export const insertStoryMomentSchema = createInsertSchema(storyMoments).omit({
  id: true,
  viewCount: true,
  createdAt: true,
});

export const insertStoryViewSchema = createInsertSchema(storyViews).omit({
  id: true,
  viewedAt: true,
});

export const insertFanLevelSchema = createInsertSchema(fanLevels).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCreatorAnalyticsSchema = createInsertSchema(creatorAnalytics).omit({
  id: true,
  createdAt: true,
});

// Live Streaming tables
export const streamStatusEnum = pgEnum("stream_status", ["scheduled", "live", "ended", "archived"]);

export const liveStreams = pgTable("live_streams", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").references(() => users.id).notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  thumbnailUrl: varchar("thumbnail_url"),
  status: streamStatusEnum("status").default("scheduled"),
  scheduledStartTime: timestamp("scheduled_start_time"),
  actualStartTime: timestamp("actual_start_time"),
  endTime: timestamp("end_time"),
  streamKey: varchar("stream_key"), // for RTMP streaming
  viewerCount: integer("viewer_count").default(0),
  peakViewers: integer("peak_viewers").default(0),
  totalTips: decimal("total_tips", { precision: 10, scale: 2 }).default("0"),
  requiresSubscription: boolean("requires_subscription").default(false),
  isRecorded: boolean("is_recorded").default(true), // whether to save VOD
  recordingUrl: varchar("recording_url"), // URL to saved recording
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_stream_creator").on(table.creatorId, table.createdAt),
  index("idx_stream_status").on(table.status),
]);

export const streamViewers = pgTable("stream_viewers", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  streamId: uuid("stream_id").references(() => liveStreams.id).notNull(),
  viewerId: varchar("viewer_id").references(() => users.id).notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
  leftAt: timestamp("left_at"),
  totalWatchTime: integer("total_watch_time").default(0), // in seconds
}, (table) => [
  index("idx_stream_viewers").on(table.streamId, table.viewerId),
]);

export const streamChat = pgTable("stream_chat", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  streamId: uuid("stream_id").references(() => liveStreams.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  message: text("message").notNull(),
  isPinned: boolean("is_pinned").default(false),
  isDeleted: boolean("is_deleted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_stream_chat").on(table.streamId, table.createdAt),
]);

export const streamTips = pgTable("stream_tips", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  streamId: uuid("stream_id").references(() => liveStreams.id).notNull(),
  fromUserId: varchar("from_user_id").references(() => users.id).notNull(),
  toCreatorId: varchar("to_creator_id").references(() => users.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  message: text("message"),
  isHighlighted: boolean("is_highlighted").default(false), // show prominently in stream
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_stream_tips").on(table.streamId, table.createdAt),
  index("idx_tips_creator").on(table.toCreatorId),
]);

// Insert schemas for live streaming
export const insertLiveStreamSchema = createInsertSchema(liveStreams).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  viewerCount: true,
  peakViewers: true,
  totalTips: true,
});

export const insertStreamViewerSchema = createInsertSchema(streamViewers).omit({
  id: true,
  joinedAt: true,
  totalWatchTime: true,
});

export const insertStreamChatSchema = createInsertSchema(streamChat).omit({
  id: true,
  createdAt: true,
  isPinned: true,
  isDeleted: true,
});

export const insertStreamTipSchema = createInsertSchema(streamTips).omit({
  id: true,
  createdAt: true,
  isHighlighted: true,
});

// Creator Collaboration System
export const collaborationStatusEnum = pgEnum("collaboration_status", ["invited", "accepted", "rejected", "active", "completed"]);

export const collaborations = pgTable("collaborations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  contentId: uuid("content_id"), // post or media asset
  contentType: varchar("content_type").notNull(), // "post", "media", "stream"
  primaryCreatorId: varchar("primary_creator_id").references(() => users.id).notNull(),
  collaboratorId: varchar("collaborator_id").references(() => users.id).notNull(),
  status: collaborationStatusEnum("status").default("invited"),
  revenueSplitPercent: integer("revenue_split_percent").default(50), // collaborator's percentage
  invitedAt: timestamp("invited_at").defaultNow(),
  respondedAt: timestamp("responded_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_collab_creator").on(table.primaryCreatorId),
  index("idx_collab_collaborator").on(table.collaboratorId),
]);

// Subscription Tiers
export const subscriptionTiers = pgTable("subscription_tiers", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").references(() => users.id).notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  priceMonthly: decimal("price_monthly", { precision: 10, scale: 2 }).notNull(),
  benefits: jsonb("benefits"), // array of benefit descriptions
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_tier_creator").on(table.creatorId),
]);

// Content Bundles
export const contentBundles = pgTable("content_bundles", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").references(() => users.id).notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  discountPercent: integer("discount_percent").default(0),
  thumbnailUrl: varchar("thumbnail_url"),
  contentIds: jsonb("content_ids").notNull(), // array of media asset IDs
  purchaseCount: integer("purchase_count").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_bundle_creator").on(table.creatorId),
]);

// Virtual Gifts
export const virtualGifts = pgTable("virtual_gifts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  animationUrl: varchar("animation_url"),
  iconUrl: varchar("icon_url").notNull(),
  category: varchar("category"), // "basic", "premium", "exclusive"
  creatorRevenuePercent: integer("creator_revenue_percent").default(80),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const giftsSent = pgTable("gifts_sent", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  giftId: uuid("gift_id").references(() => virtualGifts.id).notNull(),
  fromUserId: varchar("from_user_id").references(() => users.id).notNull(),
  toCreatorId: varchar("to_creator_id").references(() => users.id).notNull(),
  postId: uuid("post_id").references(() => posts.id),
  streamId: uuid("stream_id").references(() => liveStreams.id),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_gifts_sent_to").on(table.toCreatorId, table.createdAt),
  index("idx_gifts_sent_from").on(table.fromUserId),
]);

// Leaderboards
export const leaderboards = pgTable("leaderboards", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  period: varchar("period").notNull(), // "daily", "weekly", "monthly", "all-time"
  category: varchar("category").notNull(), // "top_creators", "top_fans", "top_spenders"
  userId: varchar("user_id").references(() => users.id).notNull(),
  score: integer("score").notNull(),
  rank: integer("rank"),
  metadata: jsonb("metadata"), // additional stats
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_leaderboard_period_category").on(table.period, table.category, table.rank),
]);

// Referral Program
export const referralCodes = pgTable("referral_codes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  code: varchar("code").notNull().unique(),
  commissionPercent: integer("commission_percent").default(10),
  totalReferrals: integer("total_referrals").default(0),
  totalEarnings: decimal("total_earnings", { precision: 10, scale: 2 }).default("0"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const referrals = pgTable("referrals", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  referrerId: varchar("referrer_id").references(() => users.id).notNull(),
  referredUserId: varchar("referred_user_id").references(() => users.id).notNull(),
  referralCode: varchar("referral_code").notNull(),
  commissionEarned: decimal("commission_earned", { precision: 10, scale: 2 }).default("0"),
  isPaid: boolean("is_paid").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_referral_referrer").on(table.referrerId),
]);

// Scheduled Content
export const scheduledPosts = pgTable("scheduled_posts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").references(() => users.id).notNull(),
  text: text("text"),
  mediaUrl: varchar("media_url"),
  mediaType: varchar("media_type"),
  scheduledFor: timestamp("scheduled_for").notNull(),
  isPublished: boolean("is_published").default(false),
  publishedPostId: uuid("published_post_id").references(() => posts.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_scheduled_creator").on(table.creatorId, table.scheduledFor),
  index("idx_scheduled_pending").on(table.isPublished, table.scheduledFor),
]);

// Creator Badges
export const creatorBadges = pgTable("creator_badges", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  badgeType: varchar("badge_type").notNull(), // "verified", "top_creator", "exclusive", "partner"
  isActive: boolean("is_active").default(true),
  verifiedBy: varchar("verified_by").references(() => users.id),
  verifiedAt: timestamp("verified_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_badge_user").on(table.userId),
]);

// Content Watermarks
export const contentWatermarks = pgTable("content_watermarks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  mediaId: uuid("media_id").references(() => mediaAssets.id).notNull().unique(),
  watermarkSignature: text("watermark_signature").notNull(),
  viewerFingerprint: text("viewer_fingerprint"),
  generatedAt: timestamp("generated_at").defaultNow(),
});

// Geo-blocking Rules
export const geoBlockingRules = pgTable("geo_blocking_rules", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").references(() => users.id).notNull(),
  contentType: varchar("content_type"), // "all", "posts", "streams", etc.
  blockedCountries: jsonb("blocked_countries").notNull(), // array of country codes
  allowedCountries: jsonb("allowed_countries"), // optional whitelist
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_geoblocking_creator").on(table.creatorId),
]);

// Content Tags (for advanced search)
export const contentTags = pgTable("content_tags", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(),
  category: varchar("category"), // "genre", "activity", "niche"
  usageCount: integer("usage_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const postTags = pgTable("post_tags", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: uuid("post_id").references(() => posts.id).notNull(),
  tagId: uuid("tag_id").references(() => contentTags.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_post_tag").on(table.postId, table.tagId),
]);

// DMCA Takedown Claims
export const dmcaClaims = pgTable("dmca_claims", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  claimantName: varchar("claimant_name").notNull(),
  claimantEmail: varchar("claimant_email").notNull(),
  claimantAddress: text("claimant_address"),
  contentUrl: varchar("content_url").notNull(),
  mediaId: uuid("media_id").references(() => mediaAssets.id),
  description: text("description").notNull(),
  status: varchar("status").default("pending"), // pending, approved, rejected, counter_claimed
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  actionTaken: text("action_taken"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_dmca_status").on(table.status, table.createdAt),
]);

// ============================================================
// PHASE 1: BLOCKCHAIN, LOANS, AND DEEPFAKE DETECTION
// ============================================================

// NFT Blockchain Content Ownership
export const blockchainEnum = pgEnum("blockchain", ["ethereum", "polygon", "solana", "base"]);
export const nftStatusEnum = pgEnum("nft_status", ["pending", "minting", "minted", "failed", "burned"]);

export const nftContracts = pgTable("nft_contracts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  blockchain: blockchainEnum("blockchain").default("polygon"),
  contractAddress: varchar("contract_address").notNull().unique(),
  name: varchar("name").notNull(),
  symbol: varchar("symbol").notNull(),
  royaltyPercent: integer("royalty_percent").default(10), // 10% royalty
  isActive: boolean("is_active").default(true),
  deployedAt: timestamp("deployed_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_nft_contract_creator_created").on(table.creatorId, table.createdAt),
  index("idx_nft_contract_address").on(table.contractAddress),
]);

export const nftMints = pgTable("nft_mints", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: uuid("contract_id").references(() => nftContracts.id, { onDelete: "cascade" }).notNull(),
  mediaId: uuid("media_id").references(() => mediaAssets.id, { onDelete: "cascade" }).notNull(),
  creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  ownerId: varchar("owner_id").references(() => users.id, { onDelete: "set null" }), // current owner
  tokenId: varchar("token_id"), // on-chain token ID
  tokenUri: text("token_uri"), // metadata URI
  status: nftStatusEnum("status").default("pending"),
  blockchain: blockchainEnum("blockchain").default("polygon"),
  mintPrice: decimal("mint_price", { precision: 18, scale: 8 }), // crypto price
  mintPriceUsd: decimal("mint_price_usd", { precision: 10, scale: 2 }), // USD equivalent
  txHash: varchar("tx_hash"), // blockchain transaction hash
  mintedAt: timestamp("minted_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_nft_mint_contract").on(table.contractId),
  index("idx_nft_mint_media").on(table.mediaId),
  index("idx_nft_mint_creator").on(table.creatorId),
  index("idx_nft_mint_creator_created").on(table.creatorId, table.createdAt),
  index("idx_nft_mint_status_created").on(table.status, table.createdAt),
  index("idx_nft_mint_owner").on(table.ownerId),
  index("idx_nft_mint_token").on(table.tokenId),
]);

export const onchainRoyalties = pgTable("onchain_royalties", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  nftMintId: uuid("nft_mint_id").references(() => nftMints.id, { onDelete: "cascade" }).notNull(),
  creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  salePrice: decimal("sale_price", { precision: 18, scale: 8 }), // crypto
  royaltyAmount: decimal("royalty_amount", { precision: 18, scale: 8 }),
  royaltyPercent: integer("royalty_percent").notNull(),
  blockchain: blockchainEnum("blockchain").default("polygon"),
  txHash: varchar("tx_hash").notNull(),
  paidAt: timestamp("paid_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_royalty_creator_created").on(table.creatorId, table.createdAt),
  index("idx_royalty_nft").on(table.nftMintId),
]);

// Fan-to-Creator Microlending System
export const loanStatusEnum = pgEnum("loan_status", ["pending", "approved", "active", "repaid", "defaulted", "cancelled"]);
export const repaymentStatusEnum = pgEnum("repayment_status", ["pending", "paid", "late", "missed"]);

export const loanPrograms = pgTable("loan_programs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  minLoanAmount: integer("min_loan_amount").notNull(), // cents
  maxLoanAmount: integer("max_loan_amount").notNull(), // cents
  interestRatePercent: decimal("interest_rate_percent", { precision: 5, scale: 2 }).notNull(),
  termMonths: integer("term_months").notNull(),
  platformFeePercent: decimal("platform_fee_percent", { precision: 5, scale: 2 }).default("5.00"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const loanApplications = pgTable("loan_applications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  programId: uuid("program_id").references(() => loanPrograms.id, { onDelete: "cascade" }).notNull(),
  requestedAmount: integer("requested_amount").notNull(), // cents
  purpose: text("purpose").notNull(),
  businessPlan: text("business_plan"),
  status: loanStatusEnum("status").default("pending"),
  kycVerified: boolean("kyc_verified").default(false),
  creditScore: integer("credit_score"), // internal FanzTrust score
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_loan_app_creator_created").on(table.creatorId, table.createdAt),
  index("idx_loan_app_status_created").on(table.status, table.createdAt),
  index("idx_loan_app_program").on(table.programId),
]);

export const loanOffers = pgTable("loan_offers", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: uuid("application_id").references(() => loanApplications.id, { onDelete: "cascade" }).notNull(),
  lenderId: varchar("lender_id").references(() => users.id, { onDelete: "cascade" }).notNull(), // fan providing the loan
  creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  offeredAmount: integer("offered_amount").notNull(), // cents
  interestRate: decimal("interest_rate", { precision: 5, scale: 2 }).notNull(),
  termMonths: integer("term_months").notNull(),
  status: varchar("status").default("pending"), // pending, accepted, rejected, expired
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_loan_offer_app").on(table.applicationId),
  index("idx_loan_offer_lender_created").on(table.lenderId, table.createdAt),
  index("idx_loan_offer_creator_created").on(table.creatorId, table.createdAt),
  index("idx_loan_offer_status_created").on(table.status, table.createdAt),
]);

export const loanRepayments = pgTable("loan_repayments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  offerId: uuid("offer_id").references(() => loanOffers.id, { onDelete: "cascade" }).notNull(),
  creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  lenderId: varchar("lender_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  installmentNumber: integer("installment_number").notNull(),
  dueDate: timestamp("due_date").notNull(),
  amountDue: integer("amount_due").notNull(), // cents
  amountPaid: integer("amount_paid").default(0),
  status: repaymentStatusEnum("status").default("pending"),
  paidAt: timestamp("paid_at"),
  transactionId: uuid("transaction_id").references(() => transactions.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_repayment_offer").on(table.offerId),
  index("idx_repayment_creator_due").on(table.creatorId, table.dueDate),
  index("idx_repayment_status_due").on(table.status, table.dueDate),
  index("idx_repayment_lender_due").on(table.lenderId, table.dueDate),
]);

export const loanEscrowAccounts = pgTable("loan_escrow_accounts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  offerId: uuid("offer_id").references(() => loanOffers.id, { onDelete: "cascade" }).notNull().unique(),
  balanceCents: integer("balance_cents").default(0),
  released: boolean("released").default(false),
  releasedAt: timestamp("released_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Enhanced Deepfake & AI Content Detection
export const scanStatusEnum = pgEnum("scan_status", ["queued", "processing", "completed", "failed"]);
export const contentRiskEnum = pgEnum("content_risk", ["low", "medium", "high", "critical"]);

export const aiScanJobs = pgTable("ai_scan_jobs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  mediaId: uuid("media_id").references(() => mediaAssets.id, { onDelete: "cascade" }).notNull(),
  scanType: varchar("scan_type").notNull(), // "deepfake", "nsfw", "prohibited", "all"
  status: scanStatusEnum("status").default("queued"),
  provider: varchar("provider"), // "hive", "reality_defender", "aws_rekognition"
  jobId: varchar("job_id"), // external provider job ID
  priority: integer("priority").default(0),
  queuedAt: timestamp("queued_at").defaultNow(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
}, (table) => [
  index("idx_scan_media").on(table.mediaId),
  index("idx_scan_status_priority").on(table.status, table.priority),
  index("idx_scan_status_queued").on(table.status, table.queuedAt),
]);

export const aiScanResults = pgTable("ai_scan_results", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  scanJobId: uuid("scan_job_id").references(() => aiScanJobs.id, { onDelete: "cascade" }).notNull(),
  mediaId: uuid("media_id").references(() => mediaAssets.id, { onDelete: "cascade" }).notNull(),
  
  // Deepfake Detection
  isDeepfake: boolean("is_deepfake").default(false),
  deepfakeConfidence: real("deepfake_confidence"), // 0.0 to 1.0
  deepfakeIndicators: jsonb("deepfake_indicators"), // technical details
  
  // NSFW & Content Classification
  nsfwLevel: nsfwLevelEnum("nsfw_level"),
  nsfwConfidence: real("nsfw_confidence"),
  contentLabels: jsonb("content_labels"), // detected scenes/objects
  
  // Prohibited Content Detection
  minorsDetected: boolean("minors_detected").default(false),
  minorsConfidence: real("minors_confidence"),
  violenceDetected: boolean("violence_detected").default(false),
  violenceConfidence: real("violence_confidence"),
  weaponsDetected: boolean("weapons_detected").default(false),
  drugsDetected: boolean("drugs_detected").default(false),
  
  // Face Analysis
  facesDetected: integer("faces_detected").default(0),
  faceData: jsonb("face_data"), // detailed face analysis
  
  // Overall Risk Assessment
  riskLevel: contentRiskEnum("risk_level").default("low"),
  requiresHumanReview: boolean("requires_human_review").default(false),
  
  // Raw Results
  rawResults: jsonb("raw_results"), // full API response
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_scan_result_media").on(table.mediaId),
  index("idx_scan_result_risk_created").on(table.riskLevel, table.createdAt),
  index("idx_scan_result_review_created").on(table.requiresHumanReview, table.createdAt),
  index("idx_scan_result_job").on(table.scanJobId),
]);

export const contentFingerprints = pgTable("content_fingerprints", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  mediaId: uuid("media_id").references(() => mediaAssets.id, { onDelete: "cascade" }).notNull().unique(),
  creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  
  // Perceptual Hashing
  phashVideo: varchar("phash_video"), // video perceptual hash
  phashAudio: varchar("phash_audio"), // audio fingerprint
  phashFrames: jsonb("phash_frames"), // key frame hashes
  
  // Forensic Watermarking
  watermarkId: varchar("watermark_id").notNull().unique(),
  watermarkEmbedded: boolean("watermark_embedded").default(false),
  
  // DMCA Protection
  copyrightRegistered: boolean("copyright_registered").default(false),
  registrationNumber: varchar("registration_number"),
  
  // Provenance Chain
  originalUploadHash: varchar("original_upload_hash").notNull(),
  blockchainAnchor: varchar("blockchain_anchor"), // IPFS or blockchain proof
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_fingerprint_creator_created").on(table.creatorId, table.createdAt),
  index("idx_fingerprint_watermark").on(table.watermarkId),
  index("idx_fingerprint_media").on(table.mediaId),
]);

// Two-Factor Authentication
export const twoFactorAuth = pgTable("two_factor_auth", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  secret: text("secret").notNull(),
  isEnabled: boolean("is_enabled").default(false),
  backupCodes: jsonb("backup_codes"), // encrypted array of backup codes
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Push Notification Subscriptions
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  endpoint: text("endpoint").notNull(),
  keys: jsonb("keys").notNull(),
  deviceInfo: jsonb("device_info"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_push_user").on(table.userId),
]);

// Phase 1 Relations
export const nftContractsRelations = relations(nftContracts, ({ one, many }) => ({
  creator: one(users, { fields: [nftContracts.creatorId], references: [users.id] }),
  mints: many(nftMints),
}));

export const nftMintsRelations = relations(nftMints, ({ one, many }) => ({
  contract: one(nftContracts, { fields: [nftMints.contractId], references: [nftContracts.id] }),
  media: one(mediaAssets, { fields: [nftMints.mediaId], references: [mediaAssets.id] }),
  creator: one(users, { fields: [nftMints.creatorId], references: [users.id] }),
  owner: one(users, { fields: [nftMints.ownerId], references: [users.id] }),
  royalties: many(onchainRoyalties),
}));

export const onchainRoyaltiesRelations = relations(onchainRoyalties, ({ one }) => ({
  nftMint: one(nftMints, { fields: [onchainRoyalties.nftMintId], references: [nftMints.id] }),
  creator: one(users, { fields: [onchainRoyalties.creatorId], references: [users.id] }),
}));

export const loanProgramsRelations = relations(loanPrograms, ({ many }) => ({
  applications: many(loanApplications),
}));

export const loanApplicationsRelations = relations(loanApplications, ({ one, many }) => ({
  creator: one(users, { fields: [loanApplications.creatorId], references: [users.id] }),
  program: one(loanPrograms, { fields: [loanApplications.programId], references: [loanPrograms.id] }),
  reviewer: one(users, { fields: [loanApplications.reviewedBy], references: [users.id] }),
  offers: many(loanOffers),
}));

export const loanOffersRelations = relations(loanOffers, ({ one, many }) => ({
  application: one(loanApplications, { fields: [loanOffers.applicationId], references: [loanApplications.id] }),
  lender: one(users, { fields: [loanOffers.lenderId], references: [users.id] }),
  creator: one(users, { fields: [loanOffers.creatorId], references: [users.id] }),
  repayments: many(loanRepayments),
  escrowAccount: one(loanEscrowAccounts),
}));

export const loanRepaymentsRelations = relations(loanRepayments, ({ one }) => ({
  offer: one(loanOffers, { fields: [loanRepayments.offerId], references: [loanOffers.id] }),
  creator: one(users, { fields: [loanRepayments.creatorId], references: [users.id] }),
  lender: one(users, { fields: [loanRepayments.lenderId], references: [users.id] }),
  transaction: one(transactions, { fields: [loanRepayments.transactionId], references: [transactions.id] }),
}));

export const loanEscrowAccountsRelations = relations(loanEscrowAccounts, ({ one }) => ({
  offer: one(loanOffers, { fields: [loanEscrowAccounts.offerId], references: [loanOffers.id] }),
}));

export const aiScanJobsRelations = relations(aiScanJobs, ({ one, many }) => ({
  media: one(mediaAssets, { fields: [aiScanJobs.mediaId], references: [mediaAssets.id] }),
  results: many(aiScanResults),
}));

export const aiScanResultsRelations = relations(aiScanResults, ({ one }) => ({
  scanJob: one(aiScanJobs, { fields: [aiScanResults.scanJobId], references: [aiScanJobs.id] }),
  media: one(mediaAssets, { fields: [aiScanResults.mediaId], references: [mediaAssets.id] }),
}));

export const contentFingerprintsRelations = relations(contentFingerprints, ({ one }) => ({
  media: one(mediaAssets, { fields: [contentFingerprints.mediaId], references: [mediaAssets.id] }),
  creator: one(users, { fields: [contentFingerprints.creatorId], references: [users.id] }),
}));

// Insert schemas
export const insertCollaborationSchema = createInsertSchema(collaborations).omit({
  id: true,
  invitedAt: true,
  createdAt: true,
});

export const insertSubscriptionTierSchema = createInsertSchema(subscriptionTiers).omit({
  id: true,
  createdAt: true,
});

export const insertContentBundleSchema = createInsertSchema(contentBundles).omit({
  id: true,
  purchaseCount: true,
  createdAt: true,
});

export const insertVirtualGiftSchema = createInsertSchema(virtualGifts).omit({
  id: true,
  createdAt: true,
});

export const insertGiftSentSchema = createInsertSchema(giftsSent).omit({
  id: true,
  createdAt: true,
});

export const insertScheduledPostSchema = createInsertSchema(scheduledPosts).omit({
  id: true,
  isPublished: true,
  createdAt: true,
});

export const insertCreatorBadgeSchema = createInsertSchema(creatorBadges).omit({
  id: true,
  createdAt: true,
});

export const insertGeoBlockingRuleSchema = createInsertSchema(geoBlockingRules).omit({
  id: true,
  createdAt: true,
});

export const insertDmcaClaimSchema = createInsertSchema(dmcaClaims).omit({
  id: true,
  createdAt: true,
});

export const insertOnboardingProgressSchema = createInsertSchema(onboardingProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContentNicheSchema = createInsertSchema(contentNiches).omit({
  id: true,
  createdAt: true,
});

export const insertUserInterestSchema = createInsertSchema(userInterests).omit({
  id: true,
  createdAt: true,
});

// Phase 1 Insert Schemas
export const insertNftContractSchema = createInsertSchema(nftContracts).omit({
  id: true,
  createdAt: true,
});

export const insertNftMintSchema = createInsertSchema(nftMints).omit({
  id: true,
  createdAt: true,
});

export const insertOnchainRoyaltySchema = createInsertSchema(onchainRoyalties).omit({
  id: true,
  paidAt: true,
  createdAt: true,
});

export const insertLoanProgramSchema = createInsertSchema(loanPrograms).omit({
  id: true,
  createdAt: true,
});

export const insertLoanApplicationSchema = createInsertSchema(loanApplications).omit({
  id: true,
  createdAt: true,
});

export const insertLoanOfferSchema = createInsertSchema(loanOffers).omit({
  id: true,
  createdAt: true,
});

export const insertLoanRepaymentSchema = createInsertSchema(loanRepayments).omit({
  id: true,
  createdAt: true,
});

export const insertLoanEscrowAccountSchema = createInsertSchema(loanEscrowAccounts).omit({
  id: true,
  createdAt: true,
});

export const insertAiScanJobSchema = createInsertSchema(aiScanJobs).omit({
  id: true,
  queuedAt: true,
});

export const insertAiScanResultSchema = createInsertSchema(aiScanResults).omit({
  id: true,
  createdAt: true,
});

export const insertContentFingerprintSchema = createInsertSchema(contentFingerprints).omit({
  id: true,
  createdAt: true,
});

// Types for new tables
export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type TicketResponse = typeof ticketResponses.$inferSelect;
export type InsertTicketResponse = z.infer<typeof insertTicketResponseSchema>;
export type WikiArticle = typeof wikiArticles.$inferSelect;
export type InsertWikiArticle = z.infer<typeof insertWikiArticleSchema>;
export type Tutorial = typeof tutorials.$inferSelect;
export type InsertTutorial = z.infer<typeof insertTutorialSchema>;
export type TutorialStep = typeof tutorialSteps.$inferSelect;
export type InsertTutorialStep = z.infer<typeof insertTutorialStepSchema>;
export type TutorialProgress = typeof tutorialProgress.$inferSelect;
export type FaqEntry = typeof faqEntries.$inferSelect;
export type InsertFaqEntry = z.infer<typeof insertFaqEntrySchema>;
export type Post = typeof posts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type PostLike = typeof postLikes.$inferSelect;
export type InsertPostLike = z.infer<typeof insertPostLikeSchema>;
export type PostComment = typeof postComments.$inferSelect;
export type InsertPostComment = z.infer<typeof insertPostCommentSchema>;
export type Follow = typeof follows.$inferSelect;
export type InsertFollow = z.infer<typeof insertFollowSchema>;
export type StoryMoment = typeof storyMoments.$inferSelect;
export type InsertStoryMoment = z.infer<typeof insertStoryMomentSchema>;
export type StoryView = typeof storyViews.$inferSelect;
export type InsertStoryView = z.infer<typeof insertStoryViewSchema>;
export type FanLevel = typeof fanLevels.$inferSelect;
export type InsertFanLevel = z.infer<typeof insertFanLevelSchema>;
export type CreatorAnalytics = typeof creatorAnalytics.$inferSelect;
export type InsertCreatorAnalytics = z.infer<typeof insertCreatorAnalyticsSchema>;
export type LiveStream = typeof liveStreams.$inferSelect;
export type InsertLiveStream = z.infer<typeof insertLiveStreamSchema>;
export type StreamViewer = typeof streamViewers.$inferSelect;
export type InsertStreamViewer = z.infer<typeof insertStreamViewerSchema>;
export type StreamChat = typeof streamChat.$inferSelect;
export type InsertStreamChat = z.infer<typeof insertStreamChatSchema>;
export type StreamTip = typeof streamTips.$inferSelect;
export type InsertStreamTip = z.infer<typeof insertStreamTipSchema>;
export type Collaboration = typeof collaborations.$inferSelect;
export type InsertCollaboration = z.infer<typeof insertCollaborationSchema>;
export type SubscriptionTier = typeof subscriptionTiers.$inferSelect;
export type InsertSubscriptionTier = z.infer<typeof insertSubscriptionTierSchema>;
export type ContentBundle = typeof contentBundles.$inferSelect;
export type InsertContentBundle = z.infer<typeof insertContentBundleSchema>;
export type VirtualGift = typeof virtualGifts.$inferSelect;
export type InsertVirtualGift = z.infer<typeof insertVirtualGiftSchema>;
export type GiftSent = typeof giftsSent.$inferSelect;
export type InsertGiftSent = z.infer<typeof insertGiftSentSchema>;
export type ScheduledPost = typeof scheduledPosts.$inferSelect;
export type InsertScheduledPost = z.infer<typeof insertScheduledPostSchema>;
export type CreatorBadge = typeof creatorBadges.$inferSelect;
export type InsertCreatorBadge = z.infer<typeof insertCreatorBadgeSchema>;
export type GeoBlockingRule = typeof geoBlockingRules.$inferSelect;
export type InsertGeoBlockingRule = z.infer<typeof insertGeoBlockingRuleSchema>;
export type DmcaClaim = typeof dmcaClaims.$inferSelect;
export type InsertDmcaClaim = z.infer<typeof insertDmcaClaimSchema>;
export type Leaderboard = typeof leaderboards.$inferSelect;
export type ReferralCode = typeof referralCodes.$inferSelect;
export type Referral = typeof referrals.$inferSelect;
export type OnboardingProgress = typeof onboardingProgress.$inferSelect;
export type InsertOnboardingProgress = z.infer<typeof insertOnboardingProgressSchema>;
export type ContentNiche = typeof contentNiches.$inferSelect;
export type InsertContentNiche = z.infer<typeof insertContentNicheSchema>;
export type UserInterest = typeof userInterests.$inferSelect;
export type InsertUserInterest = z.infer<typeof insertUserInterestSchema>;

// Phase 1 Types
export type NftContract = typeof nftContracts.$inferSelect;
export type InsertNftContract = z.infer<typeof insertNftContractSchema>;
export type NftMint = typeof nftMints.$inferSelect;
export type InsertNftMint = z.infer<typeof insertNftMintSchema>;
export type OnchainRoyalty = typeof onchainRoyalties.$inferSelect;
export type InsertOnchainRoyalty = z.infer<typeof insertOnchainRoyaltySchema>;
export type LoanProgram = typeof loanPrograms.$inferSelect;
export type InsertLoanProgram = z.infer<typeof insertLoanProgramSchema>;
export type LoanApplication = typeof loanApplications.$inferSelect;
export type InsertLoanApplication = z.infer<typeof insertLoanApplicationSchema>;
export type LoanOffer = typeof loanOffers.$inferSelect;
export type InsertLoanOffer = z.infer<typeof insertLoanOfferSchema>;
export type LoanRepayment = typeof loanRepayments.$inferSelect;
export type InsertLoanRepayment = z.infer<typeof insertLoanRepaymentSchema>;
export type LoanEscrowAccount = typeof loanEscrowAccounts.$inferSelect;
export type InsertLoanEscrowAccount = z.infer<typeof insertLoanEscrowAccountSchema>;
export type AiScanJob = typeof aiScanJobs.$inferSelect;
export type InsertAiScanJob = z.infer<typeof insertAiScanJobSchema>;
export type AiScanResult = typeof aiScanResults.$inferSelect;
export type InsertAiScanResult = z.infer<typeof insertAiScanResultSchema>;
export type ContentFingerprint = typeof contentFingerprints.$inferSelect;
export type InsertContentFingerprint = z.infer<typeof insertContentFingerprintSchema>;
