import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Enums
export const userRoleEnum = pgEnum("user_role", ["fan", "creator", "admin", "support"]);
export const userStatusEnum = pgEnum("user_status", ["active", "suspended", "banned"]);
export const authProviderEnum = pgEnum("auth_provider", ["replit", "local"]);
export const kycStatusEnum = pgEnum("kyc_status", ["pending", "verified", "rejected"]);
export const mediaStatusEnum = pgEnum("media_status", ["pending", "approved", "rejected"]);
export const payoutStatusEnum = pgEnum("payout_status", ["pending", "processing", "completed", "failed"]);
export const moderationStatusEnum = pgEnum("moderation_status", ["pending", "approved", "rejected", "flagged"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "cancelled", "expired", "suspended"]);
export const transactionStatusEnum = pgEnum("transaction_status", ["pending", "completed", "failed", "refunded", "chargeback"]);
export const paymentProviderEnum = pgEnum("payment_provider", ["ccbill", "segpay", "stripe"]);
export const contentStatusEnum = pgEnum("content_status", ["draft", "processing", "ready", "published", "archived"]);
export const contentTypeEnum = pgEnum("content_type", ["video", "image", "live_stream", "audio", "gif"]);
export const editingStatusEnum = pgEnum("editing_status", ["pending", "processing", "completed", "failed"]);
export const distributionStatusEnum = pgEnum("distribution_status", ["scheduled", "publishing", "published", "failed", "cancelled"]);
export const socialPlatformEnum = pgEnum("social_platform", ["instagram", "tiktok", "twitter", "snapchat", "youtube"]);
export const aspectRatioEnum = pgEnum("aspect_ratio", ["9:16", "16:9", "1:1", "4:5"]);

// NFT-related enums
export const nftStandardEnum = pgEnum("nft_standard", ["ERC721", "ERC1155"]);
export const nftStatusEnum = pgEnum("nft_status", ["draft", "minting", "minted", "listed", "sold", "transferred", "burned"]);
export const blockchainEnum = pgEnum("blockchain", ["ethereum", "polygon", "solana", "binance"]);
export const royaltyTypeEnum = pgEnum("royalty_type", ["fixed", "decaying", "tiered"]);
export const nftTransactionTypeEnum = pgEnum("nft_transaction_type", ["mint", "sale", "transfer", "royalty", "burn"]);
export const marketplaceEnum = pgEnum("marketplace", ["internal", "opensea", "rarible", "looksrare", "x2y2"]);

// Voice cloning enums
export const voiceProviderEnum = pgEnum("voice_provider", ["elevenlabs", "resemble", "speechify"]);
export const voiceProfileStatusEnum = pgEnum("voice_profile_status", ["pending", "training", "ready", "failed", "disabled"]);
export const voiceCloningTypeEnum = pgEnum("voice_cloning_type", ["instant", "professional", "custom"]);
export const voiceMessageStatusEnum = pgEnum("voice_message_status", ["queued", "generating", "generated", "delivered", "failed"]);
export const voiceCampaignStatusEnum = pgEnum("voice_campaign_status", ["draft", "scheduled", "running", "paused", "completed", "cancelled"]);
export const voiceEmotionEnum = pgEnum("voice_emotion", ["neutral", "happy", "sad", "excited", "calm", "serious", "playful"]);

// AR/VR enums
export const vrSessionStatusEnum = pgEnum("vr_session_status", ["initializing", "active", "paused", "ended", "failed"]);
export const vrDeviceTypeEnum = pgEnum("vr_device_type", ["quest3", "visionpro", "pico4", "index", "psvr2", "browser"]);
export const streamQualityEnum = pgEnum("stream_quality", ["4k", "2k", "1080p", "720p", "adaptive"]);
export const vrRenderingModeEnum = pgEnum("vr_rendering_mode", ["volumetric", "pixel_streaming", "webxr", "cloud"]);

// Dynamic pricing enums
export const pricingStrategyEnum = pgEnum("pricing_strategy", ["dynamic", "fixed", "tiered", "subscription", "promotional"]);
export const priceAdjustmentTypeEnum = pgEnum("price_adjustment_type", ["demand", "competitor", "time", "segment", "inventory"]);
export const pricingModelEnum = pgEnum("pricing_model", ["ml_regression", "reinforcement_learning", "rule_based", "hybrid"]);

// Microlending enums
export const loanStatusEnum = pgEnum("loan_status", ["pending", "approved", "active", "repaid", "defaulted", "cancelled"]);
export const repaymentFrequencyEnum = pgEnum("repayment_frequency", ["daily", "weekly", "biweekly", "monthly"]);
export const creditRatingEnum = pgEnum("credit_rating", ["excellent", "good", "fair", "poor", "unrated"]);
export const loanPurposeEnum = pgEnum("loan_purpose", ["equipment", "production", "marketing", "training", "other"]);

// Deepfake detection enums
export const detectionProviderEnum = pgEnum("detection_provider", ["reality_defender", "sensity", "deepware", "internal"]);
export const authenticityStatusEnum = pgEnum("authenticity_status", ["genuine", "manipulated", "deepfake", "uncertain", "pending"]);
export const contentRiskLevelEnum = pgEnum("content_risk_level", ["safe", "low", "medium", "high", "critical"]);

// Emotional AI enums
export const emotionTypeEnum = pgEnum("emotion_type", ["happy", "sad", "angry", "surprised", "neutral", "excited", "romantic", "playful"]);
export const engagementLevelEnum = pgEnum("engagement_level", ["very_low", "low", "medium", "high", "very_high"]);
export const sentimentScoreEnum = pgEnum("sentiment_score", ["very_negative", "negative", "neutral", "positive", "very_positive"]);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  username: varchar("username").unique(),
  password: varchar("password").notNull(), // Bcrypt hashed password
  role: userRoleEnum("role").default("fan"),
  status: userStatusEnum("status").default("active"),
  authProvider: authProviderEnum("auth_provider").default("local"),
  isCreator: boolean("is_creator").default(false),
  ageVerified: boolean("age_verified").default(false),
  emailVerified: boolean("email_verified").default(false),
  securityQuestion: varchar("security_question"), // For email recovery
  securityAnswer: varchar("security_answer"), // Hashed answer
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Password reset tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Email verification tokens
export const emailVerificationTokens = pgTable("email_verification_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Creator/Fan profiles
export const profiles = pgTable("profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  displayName: varchar("display_name"),
  bio: text("bio"),
  avatarUrl: varchar("avatar_url"),
  bannerUrl: varchar("banner_url"),
  pronouns: varchar("pronouns"),
  niches: text("niches").array(),
  interests: text("interests").array(),
  kycStatus: kycStatusEnum("kyc_status").default("pending"),
  ageVerified: boolean("age_verified").default(false),
  subscriptionPrice: integer("subscription_price"), // in cents
  totalEarnings: integer("total_earnings").default(0),
  fanCount: integer("fan_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Media assets (content management)
export const mediaAssets = pgTable("media_assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title"),
  description: text("description"),
  filename: varchar("filename").notNull(),
  s3Key: varchar("s3_key").notNull(),
  mimeType: varchar("mime_type").notNull(),
  fileSize: integer("file_size"),
  status: mediaStatusEnum("status").default("pending"),
  isPublic: boolean("is_public").default(false),
  price: integer("price"), // in cents, null for free content
  forensicSignature: varchar("forensic_signature"),
  views: integer("views").default(0),
  likes: integer("likes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// KYC Verifications (compliance)
export const kycVerifications = pgTable("kyc_verifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  provider: varchar("provider").notNull(),
  status: kycStatusEnum("status").default("pending"),
  documentType: varchar("document_type"),
  dataJson: jsonb("data_json"),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// 2257 Records (adult industry compliance)
export const records2257 = pgTable("records_2257", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  docType: varchar("doc_type").notNull(),
  s3Key: varchar("s3_key").notNull(),
  checksum: varchar("checksum").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Moderation Queue
export const moderationQueue = pgTable("moderation_queue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mediaId: varchar("media_id").references(() => mediaAssets.id, { onDelete: "cascade" }).notNull(),
  status: moderationStatusEnum("status").default("pending"),
  reviewerId: varchar("reviewer_id").references(() => users.id),
  notes: text("notes"),
  priority: integer("priority").default(1),
  aiConfidence: integer("ai_confidence"), // 0-100
  reportCount: integer("report_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
});

// Payout Accounts (adult-friendly providers only)
export const payoutAccounts = pgTable("payout_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  provider: varchar("provider").notNull(), // Paxum, ePayService, etc.
  accountRef: varchar("account_ref").notNull(),
  status: varchar("status").default("active"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Payout Requests
export const payoutRequests = pgTable("payout_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  accountId: varchar("account_id").references(() => payoutAccounts.id).notNull(),
  amountCents: integer("amount_cents").notNull(),
  currency: varchar("currency").default("USD"),
  status: payoutStatusEnum("status").default("pending"),
  providerRef: varchar("provider_ref"),
  processingFee: integer("processing_fee"),
  createdAt: timestamp("created_at").defaultNow(),
  processedAt: timestamp("processed_at"),
});

// Webhooks (payment notifications)
export const webhooks = pgTable("webhooks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  url: varchar("url").notNull(),
  secret: varchar("secret").notNull(),
  eventsJson: jsonb("events_json"),
  status: varchar("status").default("active"),
  lastPing: timestamp("last_ping"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Subscriptions (for creator tiers, content access)
export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  provider: paymentProviderEnum("provider").notNull(),
  providerSubscriptionId: varchar("provider_subscription_id").unique(),
  status: subscriptionStatusEnum("status").default("active"),
  pricePerMonth: integer("price_per_month").notNull(), // in cents
  currency: varchar("currency").default("USD"),
  billingCycle: varchar("billing_cycle").default("monthly"),
  nextBillingDate: timestamp("next_billing_date"),
  cancelledAt: timestamp("cancelled_at"),
  expiredAt: timestamp("expired_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Transactions (one-time purchases, tips, subscription payments)  
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }),
  mediaId: varchar("media_id").references(() => mediaAssets.id),
  subscriptionId: varchar("subscription_id").references(() => subscriptions.id),
  provider: paymentProviderEnum("provider").notNull(),
  providerTransactionId: varchar("provider_transaction_id").unique(),
  type: varchar("type").notNull(), // subscription, purchase, tip, refund
  status: transactionStatusEnum("status").default("pending"),
  amountCents: integer("amount_cents").notNull(),
  currency: varchar("currency").default("USD"),
  providerFee: integer("provider_fee"),
  platformFee: integer("platform_fee"),
  creatorEarnings: integer("creator_earnings"),
  metadata: jsonb("metadata"), // provider-specific data
  ipAddress: varchar("ip_address"),
  userAgent: varchar("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
  processedAt: timestamp("processed_at"),
});

// Messages
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  receiverId: varchar("receiver_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  content: text("content").notNull(),
  mediaUrl: varchar("media_url"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Audit Logs (compliance tracking)
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  actorId: varchar("actor_id").references(() => users.id),
  action: varchar("action").notNull(),
  targetType: varchar("target_type").notNull(),
  targetId: varchar("target_id"),
  metadata: jsonb("metadata"),
  ipAddress: varchar("ip_address"),
  userAgent: varchar("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Support Tickets System
export const supportTickets = pgTable("support_tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  category: varchar("category").notNull().default("tech"), // tech, billing, moderation, feature, other
  priority: varchar("priority").notNull().default("normal"), // low, normal, high, critical
  status: varchar("status").notNull().default("open"), // open, in_progress, resolved, closed
  assignedTo: varchar("assigned_to").references(() => users.id),
  source: varchar("source").notNull().default("web"), // web, ws, email
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const supportMessages = pgTable("support_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: varchar("ticket_id").references(() => supportTickets.id, { onDelete: "cascade" }).notNull(),
  senderId: varchar("sender_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  body: text("body").notNull(),
  attachments: text("attachments").array(),
  isInternalNote: boolean("is_internal_note").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Knowledge Base / AI Wiki
export const knowledgeArticles = pgTable("knowledge_articles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  summary: text("summary"),
  content: text("content").notNull(),
  tags: text("tags").array(),
  status: varchar("status").notNull().default("draft"), // draft, published, archived
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "cascade" }).notNull(),
  updatedBy: varchar("updated_by").references(() => users.id),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const knowledgeEmbeddings = pgTable("knowledge_embeddings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  articleId: varchar("article_id").references(() => knowledgeArticles.id, { onDelete: "cascade" }).notNull(),
  embedding: text("embedding").notNull(), // JSON string of vector embedding
  chunkIndex: integer("chunk_index").notNull(),
  chunkContent: text("chunk_content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tutorials System
export const tutorials = pgTable("tutorials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  roleTarget: varchar("role_target").notNull().default("all"), // fan, creator, admin, all
  difficulty: varchar("difficulty").notNull().default("beginner"), // beginner, intermediate, advanced
  estimatedMinutes: integer("estimated_minutes").default(10),
  coverImageUrl: varchar("cover_image_url"),
  summary: text("summary"),
  status: varchar("status").notNull().default("draft"), // draft, published, archived
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tutorialSteps = pgTable("tutorial_steps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tutorialId: varchar("tutorial_id").references(() => tutorials.id, { onDelete: "cascade" }).notNull(),
  stepNumber: integer("step_number").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  mediaUrl: varchar("media_url"),
  checklist: text("checklist"), // JSON string of checklist items
  createdAt: timestamp("created_at").defaultNow(),
});

export const tutorialProgress = pgTable("tutorial_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tutorialId: varchar("tutorial_id").references(() => tutorials.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  completedStep: integer("completed_step").default(0),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// ====================================
// INFINITY SCROLL FEED SYSTEM
// ====================================

// Feed-specific enums
export const postTypeEnum = pgEnum("post_type", ["text", "image", "video", "mixed"]);
export const postVisibilityEnum = pgEnum("post_visibility", ["free", "subscriber", "paid", "followers"]);
export const contentRatingEnum = pgEnum("content_rating", ["safe", "suggestive", "explicit"]);

// Feed Posts
export const feedPosts = pgTable("feed_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  type: postTypeEnum("type").default("text"),
  content: text("content"), // Text content or caption
  visibility: postVisibilityEnum("visibility").default("subscriber"),
  priceInCents: integer("price_in_cents"), // For paid posts
  isFreePreview: boolean("is_free_preview").default(false), // Creator allows free preview
  requiresAgeVerification: boolean("requires_age_verification").default(true),
  contentRating: contentRatingEnum("content_rating").default("explicit"),
  isPinned: boolean("is_pinned").default(false),
  isPublished: boolean("is_published").default(true),
  scheduledAt: timestamp("scheduled_at"), // For scheduled posts
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Post Media (ordered media items)
export const postMedia = pgTable("post_media", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").references(() => feedPosts.id, { onDelete: "cascade" }).notNull(),
  mediaUrl: varchar("media_url").notNull(),
  thumbnailUrl: varchar("thumbnail_url"),
  mediaType: varchar("media_type").notNull(), // image, video
  mimeType: varchar("mime_type"),
  duration: integer("duration"), // For videos (seconds)
  width: integer("width"),
  height: integer("height"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Post Engagement Metrics
export const postEngagement = pgTable("post_engagement", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").references(() => feedPosts.id, { onDelete: "cascade" }).notNull(),
  views: integer("views").default(0),
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  shares: integer("shares").default(0),
  unlocks: integer("unlocks").default(0), // For paid posts
  watchTimeSeconds: integer("watch_time_seconds").default(0), // For videos
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User Follows (for following creators without subscribing)
export const userFollows = pgTable("user_follows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  followerId: varchar("follower_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  notificationsEnabled: boolean("notifications_enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Age Verifications (VerifyMy integration cache)
export const ageVerifications = pgTable("age_verifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  provider: varchar("provider").default("verifymyage"), // verifymyage, manual, etc.
  isVerified: boolean("is_verified").default(false),
  verifiedAt: timestamp("verified_at"),
  verificationToken: varchar("verification_token"),
  dateOfBirth: timestamp("date_of_birth"),
  documentType: varchar("document_type"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sponsored Posts / Ads
export const sponsoredPosts = pgTable("sponsored_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  mediaUrl: varchar("media_url"),
  clickUrl: varchar("click_url").notNull(),
  isActive: boolean("is_active").default(true),
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  budget: integer("budget"), // in cents
  spent: integer("spent").default(0), // in cents
  targetAudience: jsonb("target_audience"), // Demographics, interests, etc.
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Post Likes (for tracking individual likes)
export const postLikes = pgTable("post_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").references(() => feedPosts.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Post Unlocks (tracking paid post purchases)
export const postUnlocks = pgTable("post_unlocks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").references(() => feedPosts.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  transactionId: varchar("transaction_id").references(() => transactions.id),
  paidAmount: integer("paid_amount"), // in cents
  createdAt: timestamp("created_at").defaultNow(),
});

// Post Comments (threaded comments system)
export const postComments = pgTable("post_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").references(() => feedPosts.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  parentId: varchar("parent_id"), // For threaded replies
  content: text("content").notNull(),
  likes: integer("likes").default(0),
  isEdited: boolean("is_edited").default(false),
  isPinned: boolean("is_pinned").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Comment Likes
export const commentLikes = pgTable("comment_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  commentId: varchar("comment_id").references(() => postComments.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Live Streams
export const liveStreams = pgTable("live_streams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  thumbnailUrl: varchar("thumbnail_url"),
  streamKey: varchar("stream_key").notNull().unique(),
  playbackUrl: varchar("playback_url"),
  status: varchar("status").default("scheduled"), // scheduled, live, ended
  visibility: postVisibilityEnum("visibility").default("subscriber"),
  priceInCents: integer("price_in_cents"),
  viewerCount: integer("viewer_count").default(0),
  totalViews: integer("total_views").default(0),
  scheduledAt: timestamp("scheduled_at"),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Stream Views (tracking who watched)
export const streamViews = pgTable("stream_views", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamId: varchar("stream_id").references(() => liveStreams.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  watchTimeSeconds: integer("watch_time_seconds").default(0),
  tippedAmount: integer("tipped_amount").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI Recommendation Engine
export const userPreferences = pgTable("user_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  preferredCategories: text("preferred_categories").array(),
  blockedCreators: text("blocked_creators").array(),
  blockedKeywords: text("blocked_keywords").array(),
  contentPreferences: jsonb("content_preferences"), // Detailed preferences JSON
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Content Interactions (for AI recommendations)
export const contentInteractions = pgTable("content_interactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  postId: varchar("post_id").references(() => feedPosts.id, { onDelete: "cascade" }),
  streamId: varchar("stream_id").references(() => liveStreams.id, { onDelete: "cascade" }),
  interactionType: varchar("interaction_type").notNull(), // view, like, comment, share, skip, hide
  watchTimeSeconds: integer("watch_time_seconds"),
  engagementScore: integer("engagement_score"), // 0-100 calculated score
  createdAt: timestamp("created_at").defaultNow(),
});

// VR/AR Content Metadata
export const vrContent = pgTable("vr_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").references(() => feedPosts.id, { onDelete: "cascade" }),
  mediaId: varchar("media_id").references(() => mediaAssets.id, { onDelete: "cascade" }),
  vrType: varchar("vr_type").notNull(), // 360_video, 180_video, 3d_model, ar_filter
  resolution: varchar("resolution"), // 4K, 8K, etc.
  stereoscopicMode: varchar("stereoscopic_mode"), // mono, stereo_lr, stereo_tb
  projectionType: varchar("projection_type"), // equirectangular, cubemap
  modelFormat: varchar("model_format"), // gltf, fbx, obj
  arTrackingType: varchar("ar_tracking_type"), // face, world, image
  metadata: jsonb("metadata"), // Additional VR/AR specific data
  createdAt: timestamp("created_at").defaultNow(),
});

// ====================================
// ENHANCED LIVE STREAMING SYSTEM
// ====================================

// Stream Participants (Co-stars)
export const streamParticipants = pgTable("stream_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamId: varchar("stream_id").references(() => liveStreams.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  role: varchar("role").notNull().default("co-star"), // host, co-star, moderator
  isVerified: boolean("is_verified").default(false),
  verificationStatus: varchar("verification_status").default("pending"), // pending, verified, failed
  verifiedAt: timestamp("verified_at"),
  joinedAt: timestamp("joined_at"),
  leftAt: timestamp("left_at"),
  streamQuality: varchar("stream_quality").default("720p"), // 360p, 720p, 1080p, 4K
  audioEnabled: boolean("audio_enabled").default(true),
  videoEnabled: boolean("video_enabled").default(true),
  screenPosition: jsonb("screen_position"), // {x, y, width, height} for multi-person layout
  createdAt: timestamp("created_at").defaultNow(),
});

// Stream Chat Messages
export const streamChatMessages = pgTable("stream_chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamId: varchar("stream_id").references(() => liveStreams.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  message: text("message").notNull(),
  messageType: varchar("message_type").default("text"), // text, emote, announcement, system
  isPinned: boolean("is_pinned").default(false),
  isModerated: boolean("is_moderated").default(false),
  moderatedBy: varchar("moderated_by").references(() => users.id),
  replyToId: varchar("reply_to_id"), // For threaded messages
  metadata: jsonb("metadata"), // emotes, mentions, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Stream Gifts
export const streamGifts = pgTable("stream_gifts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamId: varchar("stream_id").references(() => liveStreams.id, { onDelete: "cascade" }).notNull(),
  senderId: varchar("sender_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  receiverId: varchar("receiver_id").references(() => users.id, { onDelete: "cascade" }).notNull(), // Can be host or co-star
  giftType: varchar("gift_type").notNull(), // rose, heart, diamond, fireworks, etc.
  giftValue: integer("gift_value").notNull(), // in cents
  quantity: integer("quantity").default(1),
  animationType: varchar("animation_type").default("floating"), // floating, explosion, rain
  message: text("message"),
  isAnonymous: boolean("is_anonymous").default(false),
  transactionId: varchar("transaction_id").references(() => transactions.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Stream Reactions (real-time reactions)
export const streamReactions = pgTable("stream_reactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamId: varchar("stream_id").references(() => liveStreams.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  reactionType: varchar("reaction_type").notNull(), // heart, fire, laugh, wow, clap
  intensity: integer("intensity").default(1), // 1-10 for reaction strength
  timestamp: integer("timestamp"), // Stream timestamp in seconds
  createdAt: timestamp("created_at").defaultNow(),
});

// Stream Highlights (AI-detected or manual)
export const streamHighlights = pgTable("stream_highlights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamId: varchar("stream_id").references(() => liveStreams.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title"),
  startTime: integer("start_time").notNull(), // seconds from stream start
  endTime: integer("end_time").notNull(), // seconds from stream start
  clipUrl: varchar("clip_url"),
  thumbnailUrl: varchar("thumbnail_url"),
  highlightType: varchar("highlight_type").notNull(), // ai_detected, manual, peak_viewers, peak_gifts
  score: integer("score").default(0), // AI confidence score 0-100
  tags: text("tags").array(),
  metadata: jsonb("metadata"), // AI analysis data
  createdAt: timestamp("created_at").defaultNow(),
});

// Stream Recordings
export const streamRecordings = pgTable("stream_recordings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamId: varchar("stream_id").references(() => liveStreams.id, { onDelete: "cascade" }).notNull(),
  recordingUrl: varchar("recording_url").notNull(),
  thumbnailUrl: varchar("thumbnail_url"),
  duration: integer("duration"), // in seconds
  fileSize: integer("file_size"), // in bytes
  resolution: varchar("resolution"), // 1080p, 720p, etc.
  format: varchar("format").default("mp4"), // mp4, webm, etc.
  status: varchar("status").default("processing"), // processing, ready, failed
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Stream Viewers (active viewer tracking)
export const streamViewers = pgTable("stream_viewers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamId: varchar("stream_id").references(() => liveStreams.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
  leftAt: timestamp("left_at"),
  watchTimeSeconds: integer("watch_time_seconds").default(0),
  peakQuality: varchar("peak_quality"), // Highest quality watched
  deviceType: varchar("device_type"), // mobile, desktop, tablet, tv
  location: varchar("location"), // Country/region
  connectionQuality: varchar("connection_quality"), // excellent, good, poor
  bufferingEvents: integer("buffering_events").default(0),
  isActive: boolean("is_active").default(true),
});

// Stream Analytics (aggregated metrics)
export const streamAnalytics = pgTable("stream_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamId: varchar("stream_id").references(() => liveStreams.id, { onDelete: "cascade" }).notNull().unique(),
  peakViewers: integer("peak_viewers").default(0),
  avgViewers: integer("avg_viewers").default(0),
  totalViewers: integer("total_viewers").default(0),
  totalWatchTimeMinutes: integer("total_watch_time_minutes").default(0),
  totalGifts: integer("total_gifts").default(0),
  totalGiftValue: integer("total_gift_value").default(0), // in cents
  totalReactions: integer("total_reactions").default(0),
  totalChatMessages: integer("total_chat_messages").default(0),
  engagementScore: integer("engagement_score").default(0), // 0-100
  viewerRetention: jsonb("viewer_retention"), // {time: percentage} graph data
  demographicsData: jsonb("demographics_data"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, { fields: [users.id], references: [profiles.userId] }),
  mediaAssets: many(mediaAssets),
  kycVerifications: many(kycVerifications),
  payoutAccounts: many(payoutAccounts),
  payoutRequests: many(payoutRequests),
  subscriptionsAsFan: many(subscriptions, { relationName: "subscriber" }),
  subscriptionsAsCreator: many(subscriptions, { relationName: "creator" }),
  transactionsAsBuyer: many(transactions, { relationName: "buyer" }),
  transactionsAsCreator: many(transactions, { relationName: "creator" }),
  sentMessages: many(messages, { relationName: "sender" }),
  receivedMessages: many(messages, { relationName: "receiver" }),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, { fields: [profiles.userId], references: [users.id] }),
}));

export const mediaAssetsRelations = relations(mediaAssets, ({ one, many }) => ({
  owner: one(users, { fields: [mediaAssets.ownerId], references: [users.id] }),
  moderationQueue: many(moderationQueue),
}));

export const moderationQueueRelations = relations(moderationQueue, ({ one }) => ({
  media: one(mediaAssets, { fields: [moderationQueue.mediaId], references: [mediaAssets.id] }),
  reviewer: one(users, { fields: [moderationQueue.reviewerId], references: [users.id] }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  subscriber: one(users, { fields: [subscriptions.userId], references: [users.id], relationName: "subscriber" }),
  creator: one(users, { fields: [subscriptions.creatorId], references: [users.id], relationName: "creator" }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  buyer: one(users, { fields: [transactions.userId], references: [users.id], relationName: "buyer" }),
  creator: one(users, { fields: [transactions.creatorId], references: [users.id], relationName: "creator" }),
  media: one(mediaAssets, { fields: [transactions.mediaId], references: [mediaAssets.id] }),
  subscription: one(subscriptions, { fields: [transactions.subscriptionId], references: [subscriptions.id] }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, { fields: [messages.senderId], references: [users.id], relationName: "sender" }),
  receiver: one(users, { fields: [messages.receiverId], references: [users.id], relationName: "receiver" }),
}));

// Schema types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = typeof profiles.$inferInsert;
export type MediaAsset = typeof mediaAssets.$inferSelect;
export type InsertMediaAsset = typeof mediaAssets.$inferInsert;
export type ModerationItem = typeof moderationQueue.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;
export type PayoutAccount = typeof payoutAccounts.$inferSelect;
export type PayoutRequest = typeof payoutRequests.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;

// New table types
export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = typeof supportTickets.$inferInsert;
export type SupportMessage = typeof supportMessages.$inferSelect;
export type InsertSupportMessage = typeof supportMessages.$inferInsert;
export type KnowledgeArticle = typeof knowledgeArticles.$inferSelect;
export type InsertKnowledgeArticle = typeof knowledgeArticles.$inferInsert;
export type Tutorial = typeof tutorials.$inferSelect;
export type InsertTutorial = typeof tutorials.$inferInsert;
export type TutorialStep = typeof tutorialSteps.$inferSelect;
export type TutorialProgress = typeof tutorialProgress.$inferSelect;
export type KycVerification = typeof kycVerifications.$inferSelect;
export type InsertKycVerification = typeof kycVerifications.$inferInsert;

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
}) as any;

export const insertProfileSchema = createInsertSchema(profiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}) as any;

export const insertMediaAssetSchema = createInsertSchema(mediaAssets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  views: true,
  likes: true,
}) as any;

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  isRead: true,
}) as any;

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}) as any;

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  processedAt: true,
}) as any;

export const insertSupportTicketSchema = createInsertSchema(supportTickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}) as any;

export const insertSupportMessageSchema = createInsertSchema(supportMessages).omit({
  id: true,
  createdAt: true,
}) as any;

export const insertKnowledgeArticleSchema = createInsertSchema(knowledgeArticles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
}) as any;

export const insertTutorialSchema = createInsertSchema(tutorials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}) as any;

// FanzTrust™ Payment & Refund System
export const paymentGatewayEnum = pgEnum("payment_gateway", [
  "metamask", "solana", "tronlink",  // Crypto wallets
  "rocketgate", "segpay", "ccbill",   // Adult-friendly processors
  "fanzpay", "fanztoken", "fanzcoin"  // Fanz native systems
]);

export const refundStatusEnum = pgEnum("refund_status", [
  "pending", "auto_approved", "manual_review", "approved", "denied", "completed"
]);

export const trustScoreEnum = pgEnum("trust_level", [
  "new", "trusted", "verified", "flagged", "banned"
]);

// FanzTrust Transactions
export const fanzTransactions = pgTable("fanz_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fanId: varchar("fan_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  gateway: paymentGatewayEnum("gateway").notNull(),
  txid: varchar("txid"), // Transaction ID from gateway or blockchain
  amount: integer("amount").notNull(), // in cents or smallest unit
  currency: varchar("currency").default("USD"), // USD, SOL, TRX, FANZ, etc.
  walletAddress: varchar("wallet_address"),
  email: varchar("email"),
  last4: varchar("last_4"), // Last 4 digits for card transactions
  status: transactionStatusEnum("status").default("pending"),
  ipAddress: varchar("ip_address"),
  deviceFingerprint: varchar("device_fingerprint"),
  contentAccessed: boolean("content_accessed").default(false),
  subscriptionId: varchar("subscription_id"),
  metadata: jsonb("metadata"), // Additional gateway-specific data
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Refund Requests
export const refundRequests = pgTable("refund_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transactionId: varchar("transaction_id").references(() => fanzTransactions.id, { onDelete: "cascade" }).notNull(),
  fanId: varchar("fan_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  reason: text("reason").notNull(),
  status: refundStatusEnum("status").default("pending"),
  verificationResult: jsonb("verification_result"), // Auto-verification data
  isAutoApproved: boolean("is_auto_approved").default(false),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewNotes: text("review_notes"),
  amount: integer("amount").notNull(),
  ipAddress: varchar("ip_address"),
  deviceFingerprint: varchar("device_fingerprint"),
  fraudScore: integer("fraud_score").default(0), // 0-100
  createdAt: timestamp("created_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  completedAt: timestamp("completed_at"),
});

// FanzPay/FanzToken System
export const fanzWallets = pgTable("fanz_wallets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  fanzTokenBalance: integer("fanz_token_balance").default(0), // FanzToken balance
  fanzCoinBalance: integer("fanz_coin_balance").default(0), // FanzCoin (rewards)
  fanzCreditBalance: integer("fanz_credit_balance").default(0), // Store credit
  totalDeposited: integer("total_deposited").default(0),
  totalSpent: integer("total_spent").default(0),
  totalEarned: integer("total_earned").default(0),
  walletAddress: varchar("wallet_address").unique(), // For crypto withdrawals
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// FanzCard Virtual Cards
export const fanzCards = pgTable("fanz_cards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  cardNumber: varchar("card_number").notNull().unique(), // Encrypted/masked
  cardType: varchar("card_type").default("virtual"), // virtual, physical
  balance: integer("balance").default(0),
  currency: varchar("currency").default("USD"),
  status: varchar("status").default("active"), // active, frozen, cancelled
  expiryDate: varchar("expiry_date"),
  cvv: varchar("cvv"), // Encrypted
  isDefault: boolean("is_default").default(false),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  lastUsedAt: timestamp("last_used_at"),
});

// Wallet Transactions
export const walletTransactions = pgTable("wallet_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletId: varchar("wallet_id").references(() => fanzWallets.id, { onDelete: "cascade" }).notNull(),
  type: varchar("type").notNull(), // deposit, withdrawal, purchase, earning, refund, transfer
  amount: integer("amount").notNull(),
  currency: varchar("currency").default("FANZ"),
  fromUser: varchar("from_user").references(() => users.id),
  toUser: varchar("to_user").references(() => users.id),
  relatedTransactionId: varchar("related_transaction_id"),
  description: text("description"),
  status: varchar("status").default("completed"), // pending, completed, failed
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Fan Trust Scores
export const fanTrustScores = pgTable("fan_trust_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fanId: varchar("fan_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  score: integer("score").default(100), // 0-100
  level: trustScoreEnum("level").default("new"),
  totalTransactions: integer("total_transactions").default(0),
  totalRefunds: integer("total_refunds").default(0),
  falseClaimsCount: integer("false_claims_count").default(0),
  successfulPurchases: integer("successful_purchases").default(0),
  accountAge: integer("account_age").default(0), // days
  lastReviewedAt: timestamp("last_reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Audit Logs for FanzTrust
export const trustAuditLogs = pgTable("trust_audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  action: varchar("action").notNull(), // verify_transaction, request_refund, approve_refund, deny_refund, flag_user
  performedBy: varchar("performed_by").references(() => users.id),
  targetUserId: varchar("target_user_id").references(() => users.id),
  transactionId: varchar("transaction_id").references(() => fanzTransactions.id),
  refundId: varchar("refund_id").references(() => refundRequests.id),
  result: varchar("result"), // success, failure, flagged
  details: jsonb("details"),
  ipAddress: varchar("ip_address"),
  userAgent: varchar("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Creator Refund Policies
export const creatorRefundPolicies = pgTable("creator_refund_policies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  autoApproveEnabled: boolean("auto_approve_enabled").default(true),
  autoApproveTimeLimit: integer("auto_approve_time_limit").default(60), // minutes
  requireContentAccess: boolean("require_content_access").default(true),
  customMessage: text("custom_message"),
  payoutDelayHours: integer("payout_delay_hours").default(24), // Delay for high-risk purchases
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ====================================
// CONTENT CREATION & DISTRIBUTION SYSTEM
// ====================================

// Content Creation Sessions
export const contentCreationSessions = pgTable("content_creation_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title"),
  description: text("description"),
  type: contentTypeEnum("type").notNull(),
  status: contentStatusEnum("status").default("draft"),
  sourceType: varchar("source_type").notNull(), // camera, upload, live_stream, screen_record
  originalFileUrl: varchar("original_file_url"),
  originalFileSize: integer("original_file_size"),
  originalDuration: integer("original_duration"), // in seconds
  originalDimensions: jsonb("original_dimensions"), // {width, height}
  metadata: jsonb("metadata"), // camera settings, filters applied, etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI Editing Tasks
export const editingTasks = pgTable("editing_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").references(() => contentCreationSessions.id, { onDelete: "cascade" }).notNull(),
  creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  status: editingStatusEnum("status").default("pending"),
  editingOptions: jsonb("editing_options"), // {autoCut, addBranding, addIntro, addOutro, stabilize, etc.}
  aiSuggestions: jsonb("ai_suggestions"), // AI-suggested edits
  progress: integer("progress").default(0), // 0-100
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
});

// Generated Content Versions (multiple aspect ratios, formats)
export const contentVersions = pgTable("content_versions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").references(() => contentCreationSessions.id, { onDelete: "cascade" }).notNull(),
  editingTaskId: varchar("editing_task_id").references(() => editingTasks.id),
  aspectRatio: aspectRatioEnum("aspect_ratio").notNull(),
  format: varchar("format").notNull(), // mp4, webm, gif, jpg
  resolution: varchar("resolution"), // 1080p, 720p, etc.
  fileUrl: varchar("file_url").notNull(),
  thumbnailUrl: varchar("thumbnail_url"),
  fileSize: integer("file_size"),
  duration: integer("duration"), // in seconds
  dimensions: jsonb("dimensions"), // {width, height}
  isProcessed: boolean("is_processed").default(false),
  metadata: jsonb("metadata"), // encoding details, bitrate, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Distribution Campaigns
export const distributionCampaigns = pgTable("distribution_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").references(() => contentCreationSessions.id, { onDelete: "cascade" }).notNull(),
  creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name"),
  status: distributionStatusEnum("status").default("scheduled"),
  platforms: text("platforms").array(), // ["instagram", "tiktok", "twitter"]
  publishSchedule: jsonb("publish_schedule"), // {immediate: true, scheduledTime: date, timezone: string}
  distributionSettings: jsonb("distribution_settings"), // {autoHashtags, captions, mentions, etc.}
  qrCodeUrl: varchar("qr_code_url"),
  smartLinkUrl: varchar("smart_link_url"),
  createdAt: timestamp("created_at").defaultNow(),
  scheduledAt: timestamp("scheduled_at"),
  publishedAt: timestamp("published_at"),
});

// Platform Distribution Tasks
export const platformDistributions = pgTable("platform_distributions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").references(() => distributionCampaigns.id, { onDelete: "cascade" }).notNull(),
  contentVersionId: varchar("content_version_id").references(() => contentVersions.id).notNull(),
  platform: socialPlatformEnum("platform").notNull(),
  status: varchar("status").default("pending"), // pending, publishing, published, failed
  platformPostId: varchar("platform_post_id"), // ID from the social platform
  platformUrl: varchar("platform_url"), // Link to the post on the platform
  caption: text("caption"),
  hashtags: text("hashtags").array(),
  mentions: text("mentions").array(),
  errorMessage: text("error_message"),
  platformMetrics: jsonb("platform_metrics"), // views, likes, shares from platform
  createdAt: timestamp("created_at").defaultNow(),
  publishedAt: timestamp("published_at"),
});

// Content Analytics
export const contentAnalytics = pgTable("content_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").references(() => contentCreationSessions.id, { onDelete: "cascade" }).notNull(),
  creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  totalViews: integer("total_views").default(0),
  totalLikes: integer("total_likes").default(0),
  totalShares: integer("total_shares").default(0),
  totalComments: integer("total_comments").default(0),
  totalRevenue: integer("total_revenue").default(0), // in cents
  avgWatchTime: integer("avg_watch_time").default(0), // in seconds
  clickThroughRate: integer("click_through_rate").default(0), // percentage
  conversionRate: integer("conversion_rate").default(0), // percentage
  demographicsData: jsonb("demographics_data"), // age, gender, location breakdown
  platformBreakdown: jsonb("platform_breakdown"), // metrics per platform
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI-Generated Assets (trailers, GIFs, highlights)
export const generatedAssets = pgTable("generated_assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").references(() => contentCreationSessions.id, { onDelete: "cascade" }).notNull(),
  assetType: varchar("asset_type").notNull(), // trailer, gif, highlight, thumbnail
  fileUrl: varchar("file_url").notNull(),
  thumbnailUrl: varchar("thumbnail_url"),
  duration: integer("duration"), // in seconds for video assets
  fileSize: integer("file_size"),
  metadata: jsonb("metadata"), // generation settings, AI parameters
  createdAt: timestamp("created_at").defaultNow(),
});

// Creator Studio Settings
export const creatorStudioSettings = pgTable("creator_studio_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  defaultBranding: jsonb("default_branding"), // logo, watermark, brand colors
  defaultIntroUrl: varchar("default_intro_url"),
  defaultOutroUrl: varchar("default_outro_url"),
  autoEditingEnabled: boolean("auto_editing_enabled").default(true),
  autoDistributionEnabled: boolean("auto_distribution_enabled").default(false),
  preferredPlatforms: text("preferred_platforms").array(),
  defaultHashtags: text("default_hashtags").array(),
  aiPricingSuggestions: boolean("ai_pricing_suggestions").default(true),
  defaultPricePerView: integer("default_price_per_view"), // in cents
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Live Stream Co-Star Verification
export const liveStreamCoStars = pgTable("live_stream_co_stars", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamId: varchar("stream_id").references(() => liveStreams.id, { onDelete: "cascade" }).notNull(),
  coStarId: varchar("co_star_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  verificationStatus: kycStatusEnum("verification_status").default("pending"),
  verifiedAt: timestamp("verified_at"),
  joinedAt: timestamp("joined_at"),
  leftAt: timestamp("left_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ====================================
// VOICE CLONING SYSTEM
// ====================================

// Voice Profiles - Creator voice profiles
export const voiceProfiles = pgTable("voice_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  provider: voiceProviderEnum("provider").notNull(),
  providerVoiceId: varchar("provider_voice_id"), // Voice ID from provider (ElevenLabs, Resemble, etc)
  status: voiceProfileStatusEnum("status").default("pending"),
  cloningType: voiceCloningTypeEnum("cloning_type").default("instant"),
  language: varchar("language").default("en"),
  supportedLanguages: text("supported_languages").array(),
  voiceSettings: jsonb("voice_settings"), // {stability, similarity_boost, style, etc}
  isDefault: boolean("is_default").default(false),
  isPublic: boolean("is_public").default(false),
  consentVerified: boolean("consent_verified").default(false),
  consentDocumentUrl: varchar("consent_document_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Voice Samples - Training audio samples for cloning
export const voiceSamples = pgTable("voice_samples", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  profileId: varchar("profile_id").references(() => voiceProfiles.id, { onDelete: "cascade" }).notNull(),
  creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  sampleType: varchar("sample_type").notNull(), // training, reference, validation
  fileUrl: varchar("file_url").notNull(),
  s3Key: varchar("s3_key").notNull(),
  duration: integer("duration"), // in seconds
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type"),
  transcription: text("transcription"),
  quality: integer("quality"), // 0-100 quality score
  isProcessed: boolean("is_processed").default(false),
  metadata: jsonb("metadata"), // {sample_rate, bit_rate, channels, etc}
  createdAt: timestamp("created_at").defaultNow(),
});

// Voice Messages - Generated voice messages
export const voiceMessages = pgTable("voice_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  profileId: varchar("profile_id").references(() => voiceProfiles.id, { onDelete: "cascade" }).notNull(),
  creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  recipientId: varchar("recipient_id").references(() => users.id),
  recipientName: varchar("recipient_name"),
  messageType: varchar("message_type"), // voicemail, dm, birthday, thank_you, wake_up, custom
  text: text("text").notNull(),
  personalizedText: text("personalized_text"), // Text with personalization variables replaced
  language: varchar("language").default("en"),
  emotion: voiceEmotionEnum("emotion").default("neutral"),
  audioUrl: varchar("audio_url"),
  s3Key: varchar("s3_key"),
  duration: integer("duration"), // in seconds
  fileSize: integer("file_size"),
  status: voiceMessageStatusEnum("status").default("queued"),
  provider: voiceProviderEnum("provider"),
  providerRequestId: varchar("provider_request_id"),
  generationTimeMs: integer("generation_time_ms"),
  creditsCost: integer("credits_cost"),
  errorMessage: text("error_message"),
  watermarkApplied: boolean("watermark_applied").default(true),
  deliveredAt: timestamp("delivered_at"),
  viewedAt: timestamp("viewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Voice Campaigns - Bulk message generation campaigns
export const voiceCampaigns = pgTable("voice_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  profileId: varchar("profile_id").references(() => voiceProfiles.id).notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  status: voiceCampaignStatusEnum("status").default("draft"),
  campaignType: varchar("campaign_type"), // birthday, thank_you, holiday, custom
  targetAudience: jsonb("target_audience"), // {tier: "premium", min_spend: 100, tags: ["vip"]}
  messageTemplate: text("message_template").notNull(), // Template with {{variables}}
  personalizations: jsonb("personalizations"), // {variables: ["name", "amount"], defaults: {}}
  scheduledAt: timestamp("scheduled_at"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  totalRecipients: integer("total_recipients").default(0),
  messagesGenerated: integer("messages_generated").default(0),
  messagesDelivered: integer("messages_delivered").default(0),
  messagesFailed: integer("messages_failed").default(0),
  totalCreditsCost: integer("total_credits_cost").default(0),
  estimatedCost: integer("estimated_cost"), // in cents
  batchSize: integer("batch_size").default(100), // Messages per batch
  retryFailures: boolean("retry_failures").default(true),
  metadata: jsonb("metadata"), // Additional campaign settings
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Voice Analytics - Track message engagement
export const voiceAnalytics = pgTable("voice_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  messageId: varchar("message_id").references(() => voiceMessages.id, { onDelete: "cascade" }).notNull(),
  campaignId: varchar("campaign_id").references(() => voiceCampaigns.id),
  creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  recipientId: varchar("recipient_id").references(() => users.id),
  plays: integer("plays").default(0),
  completions: integer("completions").default(0), // Full listens
  avgListenDuration: integer("avg_listen_duration"), // in seconds
  shares: integer("shares").default(0),
  tips: integer("tips").default(0), // Tips received after listening
  tipAmount: integer("tip_amount").default(0), // Total tip amount in cents
  sentiment: varchar("sentiment"), // positive, neutral, negative (from reactions)
  deviceType: varchar("device_type"), // mobile, desktop
  location: varchar("location"), // Country/region
  lastPlayedAt: timestamp("last_played_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Voice Credits - Track API usage and costs
export const voiceCredits = pgTable("voice_credits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  creditBalance: integer("credit_balance").default(0),
  monthlyAllocation: integer("monthly_allocation").default(1000),
  bonusCredits: integer("bonus_credits").default(0),
  totalUsed: integer("total_used").default(0),
  totalPurchased: integer("total_purchased").default(0),
  lastResetAt: timestamp("last_reset_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Voice Transaction Log
export const voiceTransactions = pgTable("voice_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  transactionType: varchar("transaction_type").notNull(), // credit_purchase, credit_usage, credit_refund
  amount: integer("amount").notNull(), // Credits or cents
  balance: integer("balance"), // Balance after transaction
  description: text("description"),
  metadata: jsonb("metadata"), // {message_id, campaign_id, provider, etc}
  createdAt: timestamp("created_at").defaultNow(),
});

// ====================================
// NFT & BLOCKCHAIN SYSTEM
// ====================================

// Blockchain Wallets
export const blockchainWallets = pgTable("blockchain_wallets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  address: varchar("address").notNull().unique(),
  blockchain: blockchainEnum("blockchain").default("ethereum"),
  isDefault: boolean("is_default").default(false),
  nonce: varchar("nonce"), // For signature verification
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// NFT Collections
export const nftCollections = pgTable("nft_collections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name").notNull(),
  symbol: varchar("symbol"),
  description: text("description"),
  contractAddress: varchar("contract_address").unique(),
  blockchain: blockchainEnum("blockchain").default("ethereum"),
  standard: nftStandardEnum("standard").default("ERC721"),
  maxSupply: integer("max_supply"),
  mintedSupply: integer("minted_supply").default(0),
  baseUri: varchar("base_uri"), // IPFS base URI for metadata
  coverImageUrl: varchar("cover_image_url"),
  bannerImageUrl: varchar("banner_image_url"),
  royaltyBasisPoints: integer("royalty_basis_points").default(750), // 7.5% default
  royaltyReceiver: varchar("royalty_receiver"), // Wallet address for royalties
  isDeployed: boolean("is_deployed").default(false),
  deployedAt: timestamp("deployed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// NFT Tokens
export const nftTokens = pgTable("nft_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  collectionId: varchar("collection_id").references(() => nftCollections.id, { onDelete: "cascade" }).notNull(),
  ownerId: varchar("owner_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  contentId: varchar("content_id").references(() => mediaAssets.id), // Link to existing content
  tokenId: integer("token_id"), // On-chain token ID
  name: varchar("name").notNull(),
  description: text("description"),
  status: nftStatusEnum("status").default("draft"),
  metadataUri: varchar("metadata_uri"), // IPFS URI for metadata
  imageUri: varchar("image_uri"), // IPFS URI for image/video
  attributes: jsonb("attributes"), // NFT attributes/traits
  priceInWei: varchar("price_in_wei"), // BigInt as string
  priceInUsd: integer("price_in_usd"), // USD cents for display
  isListedForSale: boolean("is_listed_for_sale").default(false),
  listingPrice: varchar("listing_price"), // Wei as string
  marketplaces: text("marketplaces").array(), // ["opensea", "rarible", etc]
  txHash: varchar("tx_hash"), // Minting transaction hash
  views: integer("views").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  mintedAt: timestamp("minted_at"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// NFT Transactions
export const nftTransactions = pgTable("nft_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tokenId: varchar("token_id").references(() => nftTokens.id, { onDelete: "cascade" }).notNull(),
  fromUserId: varchar("from_user_id").references(() => users.id),
  toUserId: varchar("to_user_id").references(() => users.id),
  fromAddress: varchar("from_address").notNull(),
  toAddress: varchar("to_address").notNull(),
  type: nftTransactionTypeEnum("type").notNull(),
  priceInWei: varchar("price_in_wei"), // Transaction amount in wei
  priceInUsd: integer("price_in_usd"), // USD cents at time of transaction
  gasUsed: varchar("gas_used"),
  gasPrice: varchar("gas_price"),
  txHash: varchar("tx_hash").notNull().unique(),
  blockNumber: integer("block_number"),
  blockchain: blockchainEnum("blockchain").default("ethereum"),
  marketplace: marketplaceEnum("marketplace"),
  metadata: jsonb("metadata"), // Additional transaction data
  status: varchar("status").default("pending"), // pending, confirmed, failed
  createdAt: timestamp("created_at").defaultNow(),
  confirmedAt: timestamp("confirmed_at"),
});

// Royalty Distributions
export const royaltyDistributions = pgTable("royalty_distributions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transactionId: varchar("transaction_id").references(() => nftTransactions.id, { onDelete: "cascade" }).notNull(),
  tokenId: varchar("token_id").references(() => nftTokens.id, { onDelete: "cascade" }).notNull(),
  recipientId: varchar("recipient_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  recipientAddress: varchar("recipient_address").notNull(),
  recipientType: varchar("recipient_type").notNull(), // creator, co-star, platform
  amountInWei: varchar("amount_in_wei").notNull(),
  amountInUsd: integer("amount_in_usd"), // USD cents
  percentage: integer("percentage"), // Basis points (e.g., 250 = 2.5%)
  royaltyType: royaltyTypeEnum("royalty_type").default("fixed"),
  distributedAt: timestamp("distributed_at"),
  txHash: varchar("tx_hash"),
  status: varchar("status").default("pending"), // pending, distributed, failed
  createdAt: timestamp("created_at").defaultNow(),
});

// NFT Royalty Rules (for complex royalty structures)
export const nftRoyaltyRules = pgTable("nft_royalty_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  collectionId: varchar("collection_id").references(() => nftCollections.id, { onDelete: "cascade" }),
  tokenId: varchar("token_id").references(() => nftTokens.id, { onDelete: "cascade" }),
  recipientId: varchar("recipient_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  recipientAddress: varchar("recipient_address").notNull(),
  recipientType: varchar("recipient_type").notNull(), // creator, co-star, platform
  percentage: integer("percentage").notNull(), // Basis points
  royaltyType: royaltyTypeEnum("royalty_type").default("fixed"),
  decayRate: integer("decay_rate"), // For decaying royalties (basis points per transfer)
  minPercentage: integer("min_percentage"), // Minimum percentage after decay
  maxTransfers: integer("max_transfers"), // Max transfers before royalty expires
  tierThreshold: integer("tier_threshold"), // For tiered royalties (e.g., after X sales)
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// IPFS Storage Records
export const ipfsRecords = pgTable("ipfs_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  tokenId: varchar("token_id").references(() => nftTokens.id),
  ipfsHash: varchar("ipfs_hash").notNull().unique(),
  fileName: varchar("file_name"),
  fileType: varchar("file_type"),
  fileSize: integer("file_size"),
  contentType: varchar("content_type"), // metadata, image, video, etc.
  gateway: varchar("gateway").default("ipfs.io"), // Gateway used
  isEncrypted: boolean("is_encrypted").default(false),
  isPinned: boolean("is_pinned").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Marketplace Integration Settings
export const marketplaceIntegrations = pgTable("marketplace_integrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  marketplace: marketplaceEnum("marketplace").notNull(),
  apiKey: varchar("api_key"), // Encrypted
  apiSecret: varchar("api_secret"), // Encrypted
  walletAddress: varchar("wallet_address"),
  isActive: boolean("is_active").default(true),
  autoList: boolean("auto_list").default(false),
  defaultRoyaltyPercentage: integer("default_royalty_percentage").default(750), // Basis points
  metadata: jsonb("metadata"), // Marketplace-specific settings
  lastSyncedAt: timestamp("last_synced_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Blockchain Event Logs (for tracking blockchain events)
export const blockchainEvents = pgTable("blockchain_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventName: varchar("event_name").notNull(), // Transfer, Sale, Mint, etc.
  contractAddress: varchar("contract_address").notNull(),
  tokenId: varchar("token_id"),
  fromAddress: varchar("from_address"),
  toAddress: varchar("to_address"),
  txHash: varchar("tx_hash").notNull(),
  blockNumber: integer("block_number").notNull(),
  blockchain: blockchainEnum("blockchain").default("ethereum"),
  eventData: jsonb("event_data"), // Raw event data
  processed: boolean("processed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// ====================================
// AR/VR STREAMING SYSTEM
// ====================================

// VR Sessions
export const vrSessions = pgTable("vr_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title"),
  description: text("description"),
  status: vrSessionStatusEnum("status").default("initializing"),
  deviceType: vrDeviceTypeEnum("device_type").default("browser"),
  renderingMode: vrRenderingModeEnum("rendering_mode").default("webxr"),
  quality: streamQualityEnum("quality").default("adaptive"),
  roomCode: varchar("room_code").unique(),
  maxParticipants: integer("max_participants").default(10),
  currentParticipants: integer("current_participants").default(0),
  isPublic: boolean("is_public").default(false),
  price: integer("price"), // in cents
  webrtcSignalingUrl: varchar("webrtc_signaling_url"),
  pixelStreamingUrl: varchar("pixel_streaming_url"),
  volumetricDataUrl: varchar("volumetric_data_url"),
  metadata: jsonb("metadata"), // device capabilities, network stats, etc
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// AR Overlays
export const arOverlays = pgTable("ar_overlays", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").references(() => vrSessions.id, { onDelete: "cascade" }),
  creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name").notNull(),
  type: varchar("type").notNull(), // filter, mask, object, environment
  overlayUrl: varchar("overlay_url").notNull(),
  thumbnailUrl: varchar("thumbnail_url"),
  position: jsonb("position"), // 3D position {x, y, z}
  rotation: jsonb("rotation"), // 3D rotation {x, y, z}
  scale: jsonb("scale"), // 3D scale {x, y, z}
  anchoring: varchar("anchoring"), // face, plane, object
  trackingData: jsonb("tracking_data"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Volumetric Streams
export const volumetricStreams = pgTable("volumetric_streams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").references(() => vrSessions.id, { onDelete: "cascade" }).notNull(),
  streamUrl: varchar("stream_url").notNull(),
  format: varchar("format").notNull(), // ply, obj, gltf, draco
  frameRate: integer("frame_rate").default(30),
  bitrate: integer("bitrate"),
  resolution: varchar("resolution"),
  compression: varchar("compression"), // draco, gzip, none
  pointCloudDensity: integer("point_cloud_density"),
  colorDepth: integer("color_depth").default(8),
  isRecording: boolean("is_recording").default(false),
  recordingUrl: varchar("recording_url"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ====================================
// DYNAMIC PRICING SYSTEM
// ====================================

// Pricing Rules
export const pricingRules = pgTable("pricing_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  contentId: varchar("content_id").references(() => mediaAssets.id),
  name: varchar("name").notNull(),
  strategy: pricingStrategyEnum("strategy").default("dynamic"),
  model: pricingModelEnum("model").default("rule_based"),
  basePrice: integer("base_price").notNull(), // in cents
  minPrice: integer("min_price").notNull(),
  maxPrice: integer("max_price").notNull(),
  adjustmentFactors: jsonb("adjustment_factors"), // {demand: 1.5, time: 0.8, etc}
  segmentRules: jsonb("segment_rules"), // pricing per user segment
  competitorTracking: boolean("competitor_tracking").default(false),
  abTestEnabled: boolean("ab_test_enabled").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Price History
export const priceHistory = pgTable("price_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ruleId: varchar("rule_id").references(() => pricingRules.id, { onDelete: "cascade" }).notNull(),
  contentId: varchar("content_id").references(() => mediaAssets.id),
  previousPrice: integer("previous_price").notNull(),
  newPrice: integer("new_price").notNull(),
  adjustmentType: priceAdjustmentTypeEnum("adjustment_type").notNull(),
  adjustmentReason: text("adjustment_reason"),
  demandScore: integer("demand_score"), // 0-100
  competitorAvgPrice: integer("competitor_avg_price"),
  conversions: integer("conversions").default(0),
  revenue: integer("revenue").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Competitor Prices
export const competitorPrices = pgTable("competitor_prices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  platform: varchar("platform").notNull(),
  competitorId: varchar("competitor_id"),
  competitorName: varchar("competitor_name"),
  contentType: varchar("content_type"),
  price: integer("price").notNull(),
  currency: varchar("currency").default("USD"),
  subscribers: integer("subscribers"),
  engagement: integer("engagement"), // 0-100 score
  scrapedUrl: varchar("scraped_url"),
  metadata: jsonb("metadata"),
  scrapedAt: timestamp("scraped_at").defaultNow(),
});

// ====================================
// MICROLENDING SYSTEM
// ====================================

// Microloans
export const microloans = pgTable("microloans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lenderId: varchar("lender_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  borrowerId: varchar("borrower_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  amount: integer("amount").notNull(), // in cents
  interestRate: integer("interest_rate").notNull(), // basis points (100 = 1%)
  termDays: integer("term_days").notNull(),
  purpose: loanPurposeEnum("purpose").notNull(),
  status: loanStatusEnum("status").default("pending"),
  repaymentFrequency: repaymentFrequencyEnum("repayment_frequency").default("monthly"),
  totalRepaid: integer("total_repaid").default(0),
  nextPaymentDue: timestamp("next_payment_due"),
  smartContractAddress: varchar("smart_contract_address"),
  collateralType: varchar("collateral_type"), // future_earnings, nft, none
  collateralValue: integer("collateral_value"),
  defaultRisk: integer("default_risk"), // 0-100 score
  createdAt: timestamp("created_at").defaultNow(),
  approvedAt: timestamp("approved_at"),
  repaidAt: timestamp("repaid_at"),
  defaultedAt: timestamp("defaulted_at"),
});

// Loan Applications
export const loanApplications = pgTable("loan_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicantId: varchar("applicant_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  requestedAmount: integer("requested_amount").notNull(),
  purpose: loanPurposeEnum("purpose").notNull(),
  purposeDescription: text("purpose_description"),
  requestedTermDays: integer("requested_term_days").notNull(),
  monthlyIncome: integer("monthly_income"),
  existingLoans: integer("existing_loans").default(0),
  businessPlan: text("business_plan"),
  status: varchar("status").default("pending"), // pending, approved, rejected
  rejectionReason: text("rejection_reason"),
  creditCheckResult: jsonb("credit_check_result"),
  createdAt: timestamp("created_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
});

// Loan Repayments
export const loanRepayments = pgTable("loan_repayments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  loanId: varchar("loan_id").references(() => microloans.id, { onDelete: "cascade" }).notNull(),
  amount: integer("amount").notNull(),
  principal: integer("principal").notNull(),
  interest: integer("interest").notNull(),
  lateFee: integer("late_fee").default(0),
  paymentMethod: varchar("payment_method"), // auto_deduct, manual, crypto
  transactionId: varchar("transaction_id").references(() => transactions.id),
  status: varchar("status").default("pending"), // pending, completed, failed
  dueDate: timestamp("due_date").notNull(),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Credit Scores
export const creditScores = pgTable("credit_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  score: integer("score").notNull(), // 300-850
  rating: creditRatingEnum("rating").notNull(),
  factorsJson: jsonb("factors_json"), // {payment_history: 0.35, credit_utilization: 0.3, etc}
  totalLoans: integer("total_loans").default(0),
  totalRepaid: integer("total_repaid").default(0),
  totalDefaulted: integer("total_defaulted").default(0),
  onTimePayments: integer("on_time_payments").default(0),
  latePayments: integer("late_payments").default(0),
  avgLoanAmount: integer("avg_loan_amount"),
  platformActivity: integer("platform_activity"), // 0-100 score
  lastCalculatedAt: timestamp("last_calculated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ====================================
// DEEPFAKE DETECTION SYSTEM
// ====================================

// Detection Results
export const detectionResults = pgTable("detection_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contentId: varchar("content_id").references(() => mediaAssets.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  provider: detectionProviderEnum("provider").notNull(),
  authenticityStatus: authenticityStatusEnum("authenticity_status").notNull(),
  confidence: integer("confidence").notNull(), // 0-100
  riskLevel: contentRiskLevelEnum("risk_level").notNull(),
  detectionDetails: jsonb("detection_details"), // provider-specific details
  manipulationRegions: jsonb("manipulation_regions"), // detected altered regions
  faceSwapDetected: boolean("face_swap_detected").default(false),
  audioManipulated: boolean("audio_manipulated").default(false),
  metadataAltered: boolean("metadata_altered").default(false),
  processingTimeMs: integer("processing_time_ms"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Content Authenticity
export const contentAuthenticity = pgTable("content_authenticity", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contentId: varchar("content_id").references(() => mediaAssets.id, { onDelete: "cascade" }).notNull().unique(),
  isVerified: boolean("is_verified").default(false),
  verificationMethod: varchar("verification_method"), // blockchain, watermark, cryptographic
  watermarkId: varchar("watermark_id").unique(),
  blockchainHash: varchar("blockchain_hash"),
  cryptographicSignature: varchar("cryptographic_signature"),
  certificateUrl: varchar("certificate_url"),
  issuerName: varchar("issuer_name").default("GirlFanz"),
  verifiedAt: timestamp("verified_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Deepfake Verification Logs
export const deepfakeVerificationLogs = pgTable("deepfake_verification_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contentId: varchar("content_id").references(() => mediaAssets.id, { onDelete: "cascade" }).notNull(),
  action: varchar("action").notNull(), // scan_initiated, scan_completed, alert_sent, content_blocked
  userId: varchar("user_id").references(() => users.id),
  details: jsonb("details"),
  ipAddress: varchar("ip_address"),
  userAgent: varchar("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ====================================
// EMOTIONAL AI SYSTEM
// ====================================

// Sentiment Analysis
export const sentimentAnalysis = pgTable("sentiment_analysis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contentId: varchar("content_id").references(() => mediaAssets.id),
  postId: varchar("post_id").references(() => feedPosts.id),
  commentId: varchar("comment_id").references(() => postComments.id),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  sentiment: sentimentScoreEnum("sentiment").notNull(),
  confidence: integer("confidence").notNull(), // 0-100
  emotions: jsonb("emotions"), // {happy: 0.8, sad: 0.1, angry: 0.1}
  dominantEmotion: emotionTypeEnum("dominant_emotion"),
  keywords: text("keywords").array(),
  topics: text("topics").array(),
  language: varchar("language").default("en"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Mood Tags
export const moodTags = pgTable("mood_tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contentId: varchar("content_id").references(() => mediaAssets.id, { onDelete: "cascade" }),
  postId: varchar("post_id").references(() => feedPosts.id, { onDelete: "cascade" }),
  creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  mood: emotionTypeEnum("mood").notNull(),
  intensity: integer("intensity").notNull(), // 1-10
  autoDetected: boolean("auto_detected").default(false),
  userOverride: boolean("user_override").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Engagement Predictions
export const engagementPredictions = pgTable("engagement_predictions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contentId: varchar("content_id").references(() => mediaAssets.id),
  postId: varchar("post_id").references(() => feedPosts.id),
  creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  predictedEngagement: engagementLevelEnum("predicted_engagement").notNull(),
  predictedViews: integer("predicted_views"),
  predictedLikes: integer("predicted_likes"),
  predictedComments: integer("predicted_comments"),
  predictedRevenue: integer("predicted_revenue"), // in cents
  optimalPostTime: timestamp("optimal_post_time"),
  targetAudience: jsonb("target_audience"), // demographic recommendations
  contentRecommendations: jsonb("content_recommendations"),
  confidenceScore: integer("confidence_score"), // 0-100
  modelVersion: varchar("model_version"),
  actualEngagement: engagementLevelEnum("actual_engagement"), // for model training
  actualViews: integer("actual_views"),
  actualLikes: integer("actual_likes"),
  actualComments: integer("actual_comments"),
  actualRevenue: integer("actual_revenue"),
  createdAt: timestamp("created_at").defaultNow(),
  measuredAt: timestamp("measured_at"), // when actuals were recorded
});

// Zod Schemas
export const insertFanzTransactionSchema = createInsertSchema(fanzTransactions).omit({
  id: true,
  createdAt: true,
  completedAt: true,
}) as any;

export const insertRefundRequestSchema = createInsertSchema(refundRequests).omit({
  id: true,
  createdAt: true,
  reviewedAt: true,
  completedAt: true,
}) as any;

export const insertFanzWalletSchema = createInsertSchema(fanzWallets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}) as any;

export const insertWalletTransactionSchema = createInsertSchema(walletTransactions).omit({
  id: true,
  createdAt: true,
}) as any;

// Type Exports
export type FanzTransaction = typeof fanzTransactions.$inferSelect;
export type InsertFanzTransaction = z.infer<typeof insertFanzTransactionSchema>;
export type RefundRequest = typeof refundRequests.$inferSelect;
export type InsertRefundRequest = z.infer<typeof insertRefundRequestSchema>;
export type FanzWallet = typeof fanzWallets.$inferSelect;
export type FanTrustScore = typeof fanTrustScores.$inferSelect;
export type WalletTransaction = typeof walletTransactions.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertSupportTicketForm = z.infer<typeof insertSupportTicketSchema>;
export type InsertKnowledgeArticleForm = z.infer<typeof insertKnowledgeArticleSchema>;
export type InsertTutorialForm = z.infer<typeof insertTutorialSchema>;

// ====================================
// INFINITY SCROLL FEED - Zod Schemas
// ====================================

export const insertFeedPostSchema = createInsertSchema(feedPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}) as any;

export const insertPostMediaSchema = createInsertSchema(postMedia).omit({
  id: true,
  createdAt: true,
}) as any;

export const insertSponsoredPostSchema = createInsertSchema(sponsoredPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  impressions: true,
  clicks: true,
  spent: true,
}) as any;

export const insertUserFollowSchema = createInsertSchema(userFollows).omit({
  id: true,
  createdAt: true,
}) as any;

export const insertAgeVerificationSchema = createInsertSchema(ageVerifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}) as any;

// Feed Type Exports
export type FeedPost = typeof feedPosts.$inferSelect;
export type InsertFeedPost = z.infer<typeof insertFeedPostSchema>;
export type PostMedia = typeof postMedia.$inferSelect;
export type InsertPostMedia = z.infer<typeof insertPostMediaSchema>;
export type PostEngagement = typeof postEngagement.$inferSelect;
export type SponsoredPost = typeof sponsoredPosts.$inferSelect;
export type InsertSponsoredPost = z.infer<typeof insertSponsoredPostSchema>;
export type UserFollow = typeof userFollows.$inferSelect;
export type InsertUserFollow = z.infer<typeof insertUserFollowSchema>;
export type AgeVerification = typeof ageVerifications.$inferSelect;
export type InsertAgeVerification = z.infer<typeof insertAgeVerificationSchema>;
export type PostLike = typeof postLikes.$inferSelect;
export type PostUnlock = typeof postUnlocks.$inferSelect;

// Comments, Streams, AI, VR Zod Schemas
export const insertPostCommentSchema = createInsertSchema(postComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  likes: true,
  isEdited: true,
}) as any;

export const insertLiveStreamSchema = createInsertSchema(liveStreams).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  viewerCount: true,
  totalViews: true,
  streamKey: true,
  playbackUrl: true,
}) as any;

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}) as any;

export const insertContentInteractionSchema = createInsertSchema(contentInteractions).omit({
  id: true,
  createdAt: true,
}) as any;

export const insertVrContentSchema = createInsertSchema(vrContent).omit({
  id: true,
  createdAt: true,
}) as any;

// Extended Type Exports
export type PostComment = typeof postComments.$inferSelect;
export type InsertPostComment = z.infer<typeof insertPostCommentSchema>;
export type CommentLike = typeof commentLikes.$inferSelect;
export type LiveStream = typeof liveStreams.$inferSelect;
export type InsertLiveStream = z.infer<typeof insertLiveStreamSchema>;
export type StreamView = typeof streamViews.$inferSelect;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type ContentInteraction = typeof contentInteractions.$inferSelect;
export type VrContent = typeof vrContent.$inferSelect;
export type InsertVrContent = z.infer<typeof insertVrContentSchema>;

// ====================================
// CONTENT CREATION - Zod Schemas & Types
// ====================================

export const insertContentCreationSessionSchema = createInsertSchema(contentCreationSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}) as any;

export const insertEditingTaskSchema = createInsertSchema(editingTasks).omit({
  id: true,
  createdAt: true,
  startedAt: true,
  completedAt: true,
  progress: true,
}) as any;

export const insertContentVersionSchema = createInsertSchema(contentVersions).omit({
  id: true,
  createdAt: true,
}) as any;

export const insertDistributionCampaignSchema = createInsertSchema(distributionCampaigns).omit({
  id: true,
  createdAt: true,
  publishedAt: true,
}) as any;

export const insertPlatformDistributionSchema = createInsertSchema(platformDistributions).omit({
  id: true,
  createdAt: true,
  publishedAt: true,
}) as any;

export const insertCreatorStudioSettingsSchema = createInsertSchema(creatorStudioSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}) as any;

export const insertGeneratedAssetSchema = createInsertSchema(generatedAssets).omit({
  id: true,
  createdAt: true,
}) as any;

export const insertContentAnalyticsSchema = createInsertSchema(contentAnalytics).omit({
  id: true,
  updatedAt: true,
}) as any;

// Content Creation Type Exports
export type ContentCreationSession = typeof contentCreationSessions.$inferSelect;
export type InsertContentCreationSession = z.infer<typeof insertContentCreationSessionSchema>;
export type EditingTask = typeof editingTasks.$inferSelect;
export type InsertEditingTask = z.infer<typeof insertEditingTaskSchema>;
export type ContentVersion = typeof contentVersions.$inferSelect;
export type InsertContentVersion = z.infer<typeof insertContentVersionSchema>;
export type DistributionCampaign = typeof distributionCampaigns.$inferSelect;
export type InsertDistributionCampaign = z.infer<typeof insertDistributionCampaignSchema>;
export type PlatformDistribution = typeof platformDistributions.$inferSelect;
export type InsertPlatformDistribution = z.infer<typeof insertPlatformDistributionSchema>;
export type CreatorStudioSettings = typeof creatorStudioSettings.$inferSelect;
export type InsertCreatorStudioSettings = z.infer<typeof insertCreatorStudioSettingsSchema>;
export type GeneratedAsset = typeof generatedAssets.$inferSelect;
export type InsertGeneratedAsset = z.infer<typeof insertGeneratedAssetSchema>;
export type ContentAnalytics = typeof contentAnalytics.$inferSelect;
export type InsertContentAnalytics = z.infer<typeof insertContentAnalyticsSchema>;

// ====================================
// NFT & BLOCKCHAIN - Zod Schemas & Types
// ====================================

export const insertBlockchainWalletSchema = createInsertSchema(blockchainWallets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}) as any;

export const insertNftCollectionSchema = createInsertSchema(nftCollections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deployedAt: true,
  mintedSupply: true,
}) as any;

export const insertNftTokenSchema = createInsertSchema(nftTokens).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  mintedAt: true,
  views: true,
}) as any;

export const insertNftTransactionSchema = createInsertSchema(nftTransactions).omit({
  id: true,
  createdAt: true,
  confirmedAt: true,
}) as any;

export const insertRoyaltyDistributionSchema = createInsertSchema(royaltyDistributions).omit({
  id: true,
  createdAt: true,
  distributedAt: true,
}) as any;

export const insertNftRoyaltyRuleSchema = createInsertSchema(nftRoyaltyRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}) as any;

export const insertIpfsRecordSchema = createInsertSchema(ipfsRecords).omit({
  id: true,
  createdAt: true,
}) as any;

export const insertMarketplaceIntegrationSchema = createInsertSchema(marketplaceIntegrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastSyncedAt: true,
}) as any;

export const insertBlockchainEventSchema = createInsertSchema(blockchainEvents).omit({
  id: true,
  createdAt: true,
}) as any;

// NFT Type Exports
export type BlockchainWallet = typeof blockchainWallets.$inferSelect;
export type InsertBlockchainWallet = z.infer<typeof insertBlockchainWalletSchema>;
export type NftCollection = typeof nftCollections.$inferSelect;
export type InsertNftCollection = z.infer<typeof insertNftCollectionSchema>;
export type NftToken = typeof nftTokens.$inferSelect;
export type InsertNftToken = z.infer<typeof insertNftTokenSchema>;
export type NftTransaction = typeof nftTransactions.$inferSelect;
export type InsertNftTransaction = z.infer<typeof insertNftTransactionSchema>;
export type RoyaltyDistribution = typeof royaltyDistributions.$inferSelect;
export type InsertRoyaltyDistribution = z.infer<typeof insertRoyaltyDistributionSchema>;
export type NftRoyaltyRule = typeof nftRoyaltyRules.$inferSelect;
export type InsertNftRoyaltyRule = z.infer<typeof insertNftRoyaltyRuleSchema>;
export type IpfsRecord = typeof ipfsRecords.$inferSelect;
export type InsertIpfsRecord = z.infer<typeof insertIpfsRecordSchema>;
export type MarketplaceIntegration = typeof marketplaceIntegrations.$inferSelect;
export type InsertMarketplaceIntegration = z.infer<typeof insertMarketplaceIntegrationSchema>;
export type BlockchainEvent = typeof blockchainEvents.$inferSelect;
export type InsertBlockchainEvent = z.infer<typeof insertBlockchainEventSchema>;

// ====================================
// VOICE CLONING - Zod Schemas & Types
// ====================================

export const insertVoiceProfileSchema = createInsertSchema(voiceProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}) as any;

export const insertVoiceSampleSchema = createInsertSchema(voiceSamples).omit({
  id: true,
  createdAt: true,
}) as any;

export const insertVoiceMessageSchema = createInsertSchema(voiceMessages).omit({
  id: true,
  deliveredAt: true,
  viewedAt: true,
  createdAt: true,
}) as any;

export const insertVoiceCampaignSchema = createInsertSchema(voiceCampaigns).omit({
  id: true,
  startedAt: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
}) as any;

export const insertVoiceAnalyticsSchema = createInsertSchema(voiceAnalytics).omit({
  id: true,
  lastPlayedAt: true,
  createdAt: true,
  updatedAt: true,
}) as any;

export const insertVoiceCreditsSchema = createInsertSchema(voiceCredits).omit({
  id: true,
  lastResetAt: true,
  createdAt: true,
  updatedAt: true,
}) as any;

export const insertVoiceTransactionSchema = createInsertSchema(voiceTransactions).omit({
  id: true,
  createdAt: true,
}) as any;

// Voice Type Exports
export type VoiceProfile = typeof voiceProfiles.$inferSelect;
export type InsertVoiceProfile = z.infer<typeof insertVoiceProfileSchema>;
export type VoiceSample = typeof voiceSamples.$inferSelect;
export type InsertVoiceSample = z.infer<typeof insertVoiceSampleSchema>;
export type VoiceMessage = typeof voiceMessages.$inferSelect;
export type InsertVoiceMessage = z.infer<typeof insertVoiceMessageSchema>;
export type VoiceCampaign = typeof voiceCampaigns.$inferSelect;
export type InsertVoiceCampaign = z.infer<typeof insertVoiceCampaignSchema>;
export type VoiceAnalytics = typeof voiceAnalytics.$inferSelect;
export type InsertVoiceAnalytics = z.infer<typeof insertVoiceAnalyticsSchema>;
export type VoiceCredits = typeof voiceCredits.$inferSelect;
export type InsertVoiceCredits = z.infer<typeof insertVoiceCreditsSchema>;
export type VoiceTransaction = typeof voiceTransactions.$inferSelect;
export type InsertVoiceTransaction = z.infer<typeof insertVoiceTransactionSchema>;

// ====================================
// FanzTrust™ API Response Types
// ====================================

// Wallet API Response
export const walletResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.string(),
  fanzCoin: z.number().default(0),
  fanzToken: z.number().default(0),
  fanzCredit: z.number().default(0),
  walletAddress: z.string().nullable().optional(),
  cryptoWallets: z.array(z.object({
    provider: z.string(),
    walletAddress: z.string(),
    network: z.string(),
  })).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type WalletResponse = z.infer<typeof walletResponseSchema>;

// Trust Score API Response
export const trustScoreResponseSchema = z.object({
  id: z.string(),
  fanId: z.string(),
  score: z.number(),
  level: z.string(),
  successfulTransactions: z.number(),
  refundsInitiated: z.number(),
  fraudFlags: z.number(),
  lastCalculated: z.date(),
});

export type TrustScoreResponse = z.infer<typeof trustScoreResponseSchema>;

// Transaction List API Response
export const transactionResponseSchema = z.object({
  id: z.string(),
  amount: z.number(),
  currency: z.string(),
  gateway: z.string(),
  status: z.string(),
  type: z.enum(['deposit', 'withdrawal', 'purchase', 'refund']),
  createdAt: z.date(),
  completedAt: z.date().nullable().optional(),
});

export type TransactionResponse = z.infer<typeof transactionResponseSchema>;