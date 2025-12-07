import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  emailVerified: boolean("email_verified").default(false),
  resetPasswordToken: varchar("reset_password_token"),
  resetPasswordExpires: timestamp("reset_password_expires"),
  lastLogin: timestamp("last_login"),
  rememberMeToken: varchar("remember_me_token"),
  // Verification and security fields
  verificationStatus: varchar("verification_status").default("pending"), // pending, submitted, approved, rejected
  ageVerified: boolean("age_verified").default(false),
  idVerified: boolean("id_verified").default(false),
  hasAccessCode: boolean("has_access_code").default(false),
  platformAccessGranted: boolean("platform_access_granted").default(false),
  moderationNotes: text("moderation_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Creator profiles
export const creators = pgTable("creators", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  displayName: text("display_name").notNull(),
  username: text("username").notNull().unique(),
  bio: text("bio"),
  profileImageUrl: varchar("profile_image_url"),
  coverImageUrl: varchar("cover_image_url"),
  subscriptionPrice: decimal("subscription_price", { precision: 10, scale: 2 }).default("0.00"),
  isVerified: boolean("is_verified").default(false),
  community: varchar("community").default("general"), // boyfanz, girlfanz, pupfanz, etc.
  freeTrialDays: integer("free_trial_days").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Subscriptions
export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fanId: varchar("fan_id").notNull().references(() => users.id),
  creatorId: varchar("creator_id").notNull().references(() => creators.id),
  status: varchar("status").notNull().default("active"), // active, cancelled, expired
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Content posts
export const posts = pgTable("posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").notNull().references(() => creators.id),
  title: text("title"),
  content: text("content"),
  mediaUrl: varchar("media_url"),
  mediaType: varchar("media_type"), // photo, video, audio
  visibility: varchar("visibility").notNull().default("public"), // public, subscribers, pay_per_view
  price: decimal("price", { precision: 10, scale: 2 }),
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  views: integer("views").default(0),
  earnings: decimal("earnings", { precision: 10, scale: 2 }).default("0.00"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Messages/chats
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  receiverId: varchar("receiver_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  mediaUrl: varchar("media_url"),
  isPaywalled: boolean("is_paywalled").default(false),
  price: decimal("price", { precision: 10, scale: 2 }),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tips
export const tips = pgTable("tips", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromUserId: varchar("from_user_id").notNull().references(() => users.id),
  toCreatorId: varchar("to_creator_id").notNull().references(() => creators.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Analytics data
export const analytics = pgTable("analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").notNull().references(() => creators.id),
  date: timestamp("date").notNull(),
  totalEarnings: decimal("total_earnings", { precision: 10, scale: 2 }).default("0.00"),
  subscriptionEarnings: decimal("subscription_earnings", { precision: 10, scale: 2 }).default("0.00"),
  tipEarnings: decimal("tip_earnings", { precision: 10, scale: 2 }).default("0.00"),
  payPerViewEarnings: decimal("pay_per_view_earnings", { precision: 10, scale: 2 }).default("0.00"),
  newSubscribers: integer("new_subscribers").default(0),
  totalSubscribers: integer("total_subscribers").default(0),
  postViews: integer("post_views").default(0),
  postLikes: integer("post_likes").default(0),
});

// Live streams
export const liveStreams = pgTable("live_streams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").notNull().references(() => creators.id),
  title: text("title").notNull(),
  description: text("description"),
  status: varchar("status").notNull().default("scheduled"), // scheduled, live, ended
  visibility: varchar("visibility").notNull().default("public"), // public, subscribers
  streamUrl: varchar("stream_url"),
  streamKey: varchar("stream_key"),
  viewerCount: integer("viewer_count").default(0),
  totalTips: decimal("total_tips", { precision: 10, scale: 2 }).default("0.00"),
  scheduledFor: timestamp("scheduled_for"),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Referrals/Affiliates
export const referrals = pgTable("referrals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referrerUserId: varchar("referrer_user_id").notNull().references(() => users.id),
  referredUserId: varchar("referred_user_id").references(() => users.id),
  referredCreatorId: varchar("referred_creator_id").references(() => creators.id),
  referralCode: varchar("referral_code").notNull().unique(),
  referralType: varchar("referral_type").notNull(), // fan, creator
  status: varchar("status").notNull().default("pending"), // pending, completed, rewarded
  rewardAmount: decimal("reward_amount", { precision: 10, scale: 2 }).default("0.00"),
  totalSpent: decimal("total_spent", { precision: 10, scale: 2 }).default("0.00"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Promo codes
export const promoCodes = pgTable("promo_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").notNull().references(() => creators.id),
  code: varchar("code").notNull().unique(),
  discountType: varchar("discount_type").notNull(), // percentage, fixed
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  maxUses: integer("max_uses"),
  currentUses: integer("current_uses").default(0),
  validFrom: timestamp("valid_from").defaultNow(),
  validUntil: timestamp("valid_until"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Promo code uses
export const promoCodeUses = pgTable("promo_code_uses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  promoCodeId: varchar("promo_code_id").notNull().references(() => promoCodes.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  usedAt: timestamp("used_at").defaultNow(),
});

// Wishlist items
export const wishlistItems = pgTable("wishlist_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").notNull().references(() => creators.id),
  title: text("title").notNull(),
  description: text("description"),
  url: varchar("url"),
  price: decimal("price", { precision: 10, scale: 2 }),
  isPurchased: boolean("is_purchased").default(false),
  purchasedBy: varchar("purchased_by").references(() => users.id),
  purchasedAt: timestamp("purchased_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Content drops/scheduled posts
export const contentDrops = pgTable("content_drops", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").notNull().references(() => creators.id),
  postId: varchar("post_id").references(() => posts.id),
  title: text("title").notNull(),
  description: text("description"),
  dropType: varchar("drop_type").notNull().default("scheduled"), // scheduled, limited_time, limited_quantity
  scheduledFor: timestamp("scheduled_for"),
  expiresAt: timestamp("expires_at"),
  maxQuantity: integer("max_quantity"),
  currentQuantity: integer("current_quantity").default(0),
  status: varchar("status").notNull().default("pending"), // pending, active, expired, completed
  createdAt: timestamp("created_at").defaultNow(),
});

// Shop/Merchandise
export const shopProducts = pgTable("shop_products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").notNull().references(() => creators.id),
  name: text("name").notNull(),
  description: text("description"),
  productType: varchar("product_type").notNull(), // digital, physical, dropship
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: varchar("image_url"),
  downloadUrl: varchar("download_url"), // for digital products
  stockQuantity: integer("stock_quantity"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Shop orders
export const shopOrders = pgTable("shop_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => shopProducts.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  quantity: integer("quantity").notNull().default(1),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status").notNull().default("pending"), // pending, processing, completed, cancelled
  shippingAddress: jsonb("shipping_address"),
  trackingNumber: varchar("tracking_number"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Fan requests/commissions
export const fanRequests = pgTable("fan_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fanId: varchar("fan_id").notNull().references(() => users.id),
  creatorId: varchar("creator_id").notNull().references(() => creators.id),
  requestType: varchar("request_type").notNull(), // custom_content, shoutout, video, other
  description: text("description").notNull(),
  proposedPrice: decimal("proposed_price", { precision: 10, scale: 2 }),
  agreedPrice: decimal("agreed_price", { precision: 10, scale: 2 }),
  status: varchar("status").notNull().default("pending"), // pending, accepted, in_progress, completed, declined
  deliveryUrl: varchar("delivery_url"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Blast messages
export const blastMessages = pgTable("blast_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").notNull().references(() => creators.id),
  content: text("content").notNull(),
  mediaUrl: varchar("media_url"),
  targetAudience: varchar("target_audience").notNull().default("all"), // all, subscribers, tier
  isPaywalled: boolean("is_paywalled").default(false),
  price: decimal("price", { precision: 10, scale: 2 }),
  sentCount: integer("sent_count").default(0),
  openedCount: integer("opened_count").default(0),
  revenue: decimal("revenue", { precision: 10, scale: 2 }).default("0.00"),
  sentAt: timestamp("sent_at").defaultNow(),
});

// Blast recipients
export const blastRecipients = pgTable("blast_recipients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  blastId: varchar("blast_id").notNull().references(() => blastMessages.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  isOpened: boolean("is_opened").default(false),
  openedAt: timestamp("opened_at"),
  isPurchased: boolean("is_purchased").default(false),
  purchasedAt: timestamp("purchased_at"),
});

// ===== SECURITY & VERIFICATION TABLES =====

// VerifyMy identity verification requests
export const verificationRequests = pgTable("verification_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  verificationType: varchar("verification_type").notNull(), // age, identity, full
  verifyMyRequestId: varchar("verifymу_request_id"), // VerifyMy API request ID
  verifyMyStatus: varchar("verifymу_status").default("pending"), // pending, processing, verified, failed
  documentType: varchar("document_type"), // passport, drivers_license, id_card
  documentFrontUrl: varchar("document_front_url"),
  documentBackUrl: varchar("document_back_url"),
  selfieUrl: varchar("selfie_url"),
  dateOfBirth: timestamp("date_of_birth"),
  fullName: text("full_name"),
  verificationData: jsonb("verification_data"), // Full response from VerifyMy
  rejectionReason: text("rejection_reason"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  verifiedAt: timestamp("verified_at"),
  expiresAt: timestamp("expires_at"),
});

// Access codes for platform entry
export const accessCodes = pgTable("access_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  code: varchar("code").notNull().unique(), // 8-character alphanumeric code
  isUsed: boolean("is_used").default(false),
  usedAt: timestamp("used_at"),
  sentToEmail: varchar("sent_to_email").notNull(),
  sentAt: timestamp("sent_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(), // 24 hours from creation
  attempts: integer("attempts").default(0), // Track failed attempts
  lastAttemptAt: timestamp("last_attempt_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Moderation queue for profile approvals
export const moderationQueue = pgTable("moderation_queue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  queueType: varchar("queue_type").notNull(), // profile_verification, content_report, appeal
  status: varchar("status").notNull().default("pending"), // pending, in_review, approved, rejected
  priority: varchar("priority").default("normal"), // low, normal, high, urgent
  assignedToModeratorId: varchar("assigned_to_moderator_id").references(() => users.id),
  submissionData: jsonb("submission_data"), // Profile data, verification docs, etc.
  moderatorNotes: text("moderator_notes"),
  rejectionReason: text("rejection_reason"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
});

// User privacy settings
export const privacySettings = pgTable("privacy_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  // Profile visibility
  profileVisibility: varchar("profile_visibility").default("public"), // public, subscribers, private
  showOnlineStatus: boolean("show_online_status").default(true),
  showLastActive: boolean("show_last_active").default(false),
  // Search and discovery
  appearInSearch: boolean("appear_in_search").default(true),
  appearInRecommendations: boolean("appear_in_recommendations").default(true),
  // Messaging controls
  whoCanMessage: varchar("who_can_message").default("everyone"), // everyone, subscribers, following, none
  requireTipToMessage: boolean("require_tip_to_message").default(false),
  minimumTipAmount: decimal("minimum_tip_amount", { precision: 10, scale: 2 }).default("0.00"),
  // Content privacy
  watermarkContent: boolean("watermark_content").default(true),
  blockScreenshots: boolean("block_screenshots").default(false), // Feature flag for future implementation
  restrictDownloads: boolean("restrict_downloads").default(true),
  // Geographic restrictions
  geoBlockEnabled: boolean("geo_block_enabled").default(false),
  geoBlockCountries: jsonb("geo_block_countries"), // Array of country codes to block
  geoAllowCountries: jsonb("geo_allow_countries"), // Array of country codes to allow (whitelist mode)
  // Data privacy
  hideFromSocialMedia: boolean("hide_from_social_media").default(false),
  hidePurchaseHistory: boolean("hide_purchase_history").default(true),
  hideSubscriptionList: boolean("hide_subscription_list").default(true),
  // Analytics privacy
  shareAnalyticsData: boolean("share_analytics_data").default(false),
  allowDataExport: boolean("allow_data_export").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User blocks (for blocking other users)
export const userBlocks = pgTable("user_blocks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  blockerId: varchar("blocker_id").notNull().references(() => users.id),
  blockedId: varchar("blocked_id").notNull().references(() => users.id),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Content access logs (for audit trail)
export const contentAccessLogs = pgTable("content_access_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  contentType: varchar("content_type").notNull(), // post, message, live_stream, shop_product
  contentId: varchar("content_id").notNull(),
  accessType: varchar("access_type").notNull(), // view, download, purchase, unlock
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Two-factor authentication
export const twoFactorAuth = pgTable("two_factor_auth", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  isEnabled: boolean("is_enabled").default(false),
  method: varchar("method").default("authenticator"), // authenticator, sms, email
  secret: varchar("secret"), // For TOTP authenticator apps
  backupCodes: jsonb("backup_codes"), // Array of one-time backup codes
  phoneNumber: varchar("phone_number"),
  phoneVerified: boolean("phone_verified").default(false),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ===== ADVANCED ENGAGEMENT FEATURES =====

// Stories (24-hour expiring content like Instagram)
export const stories = pgTable("stories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").notNull().references(() => creators.id),
  mediaType: varchar("media_type").notNull(), // image, video
  mediaUrl: varchar("media_url").notNull(),
  thumbnailUrl: varchar("thumbnail_url"),
  caption: text("caption"),
  duration: integer("duration").default(5), // seconds, for images
  viewCount: integer("view_count").default(0),
  isHighlight: boolean("is_highlight").default(false), // Saved to highlights
  highlightCategory: varchar("highlight_category"), // Category name if in highlights
  expiresAt: timestamp("expires_at").notNull(), // 24 hours from creation
  createdAt: timestamp("created_at").defaultNow(),
});

// Story views tracking
export const storyViews = pgTable("story_views", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storyId: varchar("story_id").notNull().references(() => stories.id),
  viewerId: varchar("viewer_id").notNull().references(() => users.id),
  viewedAt: timestamp("viewed_at").defaultNow(),
});

// Polls for fan engagement
export const polls = pgTable("polls", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").notNull().references(() => creators.id),
  question: text("question").notNull(),
  options: jsonb("options").notNull(), // Array of poll options
  multipleChoice: boolean("multiple_choice").default(false),
  allowSuggestions: boolean("allow_suggestions").default(false),
  endsAt: timestamp("ends_at"),
  totalVotes: integer("total_votes").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Poll votes
export const pollVotes = pgTable("poll_votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pollId: varchar("poll_id").notNull().references(() => polls.id),
  voterId: varchar("voter_id").notNull().references(() => users.id),
  selectedOptions: jsonb("selected_options").notNull(), // Array of selected option indices
  createdAt: timestamp("created_at").defaultNow(),
});

// Pay-per-view content unlocks
export const ppvContent = pgTable("ppv_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").references(() => posts.id),
  messageId: varchar("message_id").references(() => messages.id),
  creatorId: varchar("creator_id").notNull().references(() => creators.id),
  contentType: varchar("content_type").notNull(), // post, message, bundle
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  previewMediaUrl: varchar("preview_media_url"), // Blurred or teaser preview
  description: text("description"),
  purchaseCount: integer("purchase_count").default(0),
  totalRevenue: decimal("total_revenue", { precision: 10, scale: 2 }).default("0.00"),
  createdAt: timestamp("created_at").defaultNow(),
});

// PPV purchases
export const ppvPurchases = pgTable("ppv_purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ppvContentId: varchar("ppv_content_id").notNull().references(() => ppvContent.id),
  purchaserId: varchar("purchaser_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar("payment_method"),
  transactionId: varchar("transaction_id"),
  purchasedAt: timestamp("purchased_at").defaultNow(),
});

// Fan levels/tiers (different from subscriptions - achievement-based)
export const fanLevels = pgTable("fan_levels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").notNull().references(() => creators.id),
  level: integer("level").notNull(),
  name: varchar("name").notNull(), // Bronze, Silver, Gold, Platinum, Diamond
  spendingRequirement: decimal("spending_requirement", { precision: 10, scale: 2 }).notNull(),
  benefits: jsonb("benefits"), // Array of benefit descriptions
  badgeImageUrl: varchar("badge_image_url"),
  color: varchar("color").default("#888888"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User fan level progress
export const userFanLevels = pgTable("user_fan_levels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  creatorId: varchar("creator_id").notNull().references(() => creators.id),
  currentLevel: integer("current_level").default(1),
  totalSpent: decimal("total_spent", { precision: 10, scale: 2 }).default("0.00"),
  lifetimeSpent: decimal("lifetime_spent", { precision: 10, scale: 2 }).default("0.00"),
  nextLevelAt: decimal("next_level_at", { precision: 10, scale: 2 }),
  achievedAt: timestamp("achieved_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Badges and achievements
export const badges = pgTable("badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code").notNull().unique(), // early_supporter, top_tipper, loyal_fan, etc.
  name: varchar("name").notNull(),
  description: text("description"),
  imageUrl: varchar("image_url"),
  category: varchar("category"), // supporter, engagement, milestone, special
  rarity: varchar("rarity").default("common"), // common, rare, epic, legendary
  requirement: jsonb("requirement"), // Criteria to earn this badge
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// User earned badges
export const userBadges = pgTable("user_badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  badgeId: varchar("badge_id").notNull().references(() => badges.id),
  creatorId: varchar("creator_id").references(() => creators.id), // Creator-specific badges
  earnedAt: timestamp("earned_at").defaultNow(),
});

// Voice messages (audio content)
export const voiceMessages = pgTable("voice_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  messageId: varchar("message_id").references(() => messages.id),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  receiverId: varchar("receiver_id").notNull().references(() => users.id),
  audioUrl: varchar("audio_url").notNull(),
  duration: integer("duration").notNull(), // seconds
  waveform: jsonb("waveform"), // Waveform data for visualization
  isListened: boolean("is_listened").default(false),
  listenedAt: timestamp("listened_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Content bundles (package deals)
export const contentBundles = pgTable("content_bundles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").notNull().references(() => creators.id),
  title: varchar("title").notNull(),
  description: text("description"),
  coverImageUrl: varchar("cover_image_url"),
  regularPrice: decimal("regular_price", { precision: 10, scale: 2 }).notNull(),
  bundlePrice: decimal("bundle_price", { precision: 10, scale: 2 }).notNull(),
  discount: integer("discount"), // percentage
  contentCount: integer("content_count").default(0),
  purchaseCount: integer("purchase_count").default(0),
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Bundle content items
export const bundleItems = pgTable("bundle_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bundleId: varchar("bundle_id").notNull().references(() => contentBundles.id),
  postId: varchar("post_id").references(() => posts.id),
  contentType: varchar("content_type").notNull(), // post, video, photoset
  contentUrl: varchar("content_url"),
  thumbnailUrl: varchar("thumbnail_url"),
  description: text("description"),
  order: integer("order").default(0),
});

// Bundle purchases
export const bundlePurchases = pgTable("bundle_purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bundleId: varchar("bundle_id").notNull().references(() => contentBundles.id),
  purchaserId: varchar("purchaser_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar("payment_method"),
  transactionId: varchar("transaction_id"),
  purchasedAt: timestamp("purchased_at").defaultNow(),
});

// Scheduled posts
export const scheduledPosts = pgTable("scheduled_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").notNull().references(() => creators.id),
  postData: jsonb("post_data").notNull(), // Complete post content to be published
  scheduledFor: timestamp("scheduled_for").notNull(),
  status: varchar("status").default("pending"), // pending, published, failed, cancelled
  publishedPostId: varchar("published_post_id").references(() => posts.id),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow(),
  publishedAt: timestamp("published_at"),
});

// Contests and giveaways
export const contests = pgTable("contests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").notNull().references(() => creators.id),
  title: varchar("title").notNull(),
  description: text("description"),
  coverImageUrl: varchar("cover_image_url"),
  prizeDescription: text("prize_description"),
  entryRequirements: jsonb("entry_requirements"), // subscription required, tip amount, etc.
  maxEntries: integer("max_entries"),
  currentEntries: integer("current_entries").default(0),
  winnersCount: integer("winners_count").default(1),
  status: varchar("status").default("active"), // active, ended, winners_announced
  startsAt: timestamp("starts_at").defaultNow(),
  endsAt: timestamp("ends_at").notNull(),
  winnersAnnouncedAt: timestamp("winners_announced_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Contest entries
export const contestEntries = pgTable("contest_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contestId: varchar("contest_id").notNull().references(() => contests.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  entryCount: integer("entry_count").default(1), // Multiple entries possible
  isWinner: boolean("is_winner").default(false),
  prizeAwarded: boolean("prize_awarded").default(false),
  enteredAt: timestamp("entered_at").defaultNow(),
});

// Saved collections (highlights, playlists)
export const collections = pgTable("collections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").notNull().references(() => creators.id),
  title: varchar("title").notNull(),
  description: text("description"),
  coverImageUrl: varchar("cover_image_url"),
  type: varchar("type").default("general"), // general, highlights, playlist, favorites
  itemCount: integer("item_count").default(0),
  isPublic: boolean("is_public").default(true),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Collection items
export const collectionItems = pgTable("collection_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  collectionId: varchar("collection_id").notNull().references(() => collections.id),
  itemType: varchar("item_type").notNull(), // post, story, video
  itemId: varchar("item_id").notNull(), // ID of the referenced content
  postId: varchar("post_id").references(() => posts.id),
  storyId: varchar("story_id").references(() => stories.id),
  order: integer("order").default(0),
  addedAt: timestamp("added_at").defaultNow(),
});

// Advanced notifications
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: varchar("type").notNull(), // new_subscriber, new_tip, new_message, level_up, badge_earned, contest_winner
  title: varchar("title").notNull(),
  message: text("message"),
  imageUrl: varchar("image_url"),
  actionUrl: varchar("action_url"), // Deep link to relevant content
  relatedUserId: varchar("related_user_id").references(() => users.id),
  relatedContentType: varchar("related_content_type"), // post, message, subscription
  relatedContentId: varchar("related_content_id"),
  metadata: jsonb("metadata"), // Additional data
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Leaderboards (top supporters, top tippers, etc.)
export const leaderboardEntries = pgTable("leaderboard_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").notNull().references(() => creators.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  leaderboardType: varchar("leaderboard_type").notNull(), // top_tippers, top_spenders, most_active
  period: varchar("period").notNull(), // daily, weekly, monthly, all_time
  rank: integer("rank").notNull(),
  score: decimal("score", { precision: 10, scale: 2 }).notNull(), // amount or count
  metadata: jsonb("metadata"), // Additional stats
  periodStartDate: timestamp("period_start_date").notNull(),
  periodEndDate: timestamp("period_end_date"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Auto-responders for creators
export const autoResponders = pgTable("auto_responders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").notNull().references(() => creators.id),
  triggerType: varchar("trigger_type").notNull(), // new_subscriber, first_message, tip_received, keyword
  triggerValue: varchar("trigger_value"), // keyword for keyword trigger
  responseType: varchar("response_type").default("text"), // text, media, bundle_offer
  responseText: text("response_text"),
  responseMediaUrl: varchar("response_media_url"),
  responseDelay: integer("response_delay").default(0), // seconds delay before sending
  isActive: boolean("is_active").default(true),
  sendCount: integer("send_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

export const insertCreatorSchema = createInsertSchema(creators).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  likes: true,
  comments: true,
  views: true,
  earnings: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  isRead: true,
  createdAt: true,
});

export const insertTipSchema = createInsertSchema(tips).omit({
  id: true,
  createdAt: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
});

export const insertLiveStreamSchema = createInsertSchema(liveStreams).omit({
  id: true,
  viewerCount: true,
  totalTips: true,
  createdAt: true,
});

export const insertReferralSchema = createInsertSchema(referrals).omit({
  id: true,
  status: true,
  rewardAmount: true,
  totalSpent: true,
  createdAt: true,
});

export const insertPromoCodeSchema = createInsertSchema(promoCodes).omit({
  id: true,
  currentUses: true,
  createdAt: true,
});

export const insertWishlistItemSchema = createInsertSchema(wishlistItems).omit({
  id: true,
  isPurchased: true,
  purchasedBy: true,
  purchasedAt: true,
  createdAt: true,
});

export const insertContentDropSchema = createInsertSchema(contentDrops).omit({
  id: true,
  currentQuantity: true,
  status: true,
  createdAt: true,
});

export const insertShopProductSchema = createInsertSchema(shopProducts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertShopOrderSchema = createInsertSchema(shopOrders).omit({
  id: true,
  status: true,
  createdAt: true,
  completedAt: true,
});

export const insertFanRequestSchema = createInsertSchema(fanRequests).omit({
  id: true,
  status: true,
  createdAt: true,
  completedAt: true,
});

export const insertBlastMessageSchema = createInsertSchema(blastMessages).omit({
  id: true,
  sentCount: true,
  openedCount: true,
  revenue: true,
  sentAt: true,
});

// Security & Verification insert schemas
export const insertVerificationRequestSchema = createInsertSchema(verificationRequests).omit({
  id: true,
  submittedAt: true,
  verifiedAt: true,
});

export const insertAccessCodeSchema = createInsertSchema(accessCodes).omit({
  id: true,
  isUsed: true,
  usedAt: true,
  sentAt: true,
  attempts: true,
  lastAttemptAt: true,
  createdAt: true,
});

export const insertModerationQueueSchema = createInsertSchema(moderationQueue).omit({
  id: true,
  status: true,
  submittedAt: true,
  reviewedAt: true,
});

export const insertPrivacySettingsSchema = createInsertSchema(privacySettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserBlockSchema = createInsertSchema(userBlocks).omit({
  id: true,
  createdAt: true,
});

export const insertContentAccessLogSchema = createInsertSchema(contentAccessLogs).omit({
  id: true,
  createdAt: true,
});

export const insertTwoFactorAuthSchema = createInsertSchema(twoFactorAuth).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Advanced features insert schemas
export const insertStorySchema = createInsertSchema(stories).omit({
  id: true,
  viewCount: true,
  createdAt: true,
});

export const insertPollSchema = createInsertSchema(polls).omit({
  id: true,
  totalVotes: true,
  createdAt: true,
});

export const insertPPVContentSchema = createInsertSchema(ppvContent).omit({
  id: true,
  purchaseCount: true,
  totalRevenue: true,
  createdAt: true,
});

export const insertFanLevelSchema = createInsertSchema(fanLevels).omit({
  id: true,
  createdAt: true,
});

export const insertBadgeSchema = createInsertSchema(badges).omit({
  id: true,
  createdAt: true,
});

export const insertVoiceMessageSchema = createInsertSchema(voiceMessages).omit({
  id: true,
  isListened: true,
  listenedAt: true,
  createdAt: true,
});

export const insertContentBundleSchema = createInsertSchema(contentBundles).omit({
  id: true,
  contentCount: true,
  purchaseCount: true,
  createdAt: true,
});

export const insertScheduledPostSchema = createInsertSchema(scheduledPosts).omit({
  id: true,
  status: true,
  publishedPostId: true,
  error: true,
  createdAt: true,
  publishedAt: true,
});

export const insertContestSchema = createInsertSchema(contests).omit({
  id: true,
  currentEntries: true,
  status: true,
  winnersAnnouncedAt: true,
  createdAt: true,
});

export const insertCollectionSchema = createInsertSchema(collections).omit({
  id: true,
  itemCount: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  isRead: true,
  readAt: true,
  createdAt: true,
});

export const insertAutoResponderSchema = createInsertSchema(autoResponders).omit({
  id: true,
  sendCount: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Creator = typeof creators.$inferSelect;
export type InsertCreator = z.infer<typeof insertCreatorSchema>;
export type Post = typeof posts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Tip = typeof tips.$inferSelect;
export type InsertTip = z.infer<typeof insertTipSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Analytics = typeof analytics.$inferSelect;
export type LiveStream = typeof liveStreams.$inferSelect;
export type InsertLiveStream = z.infer<typeof insertLiveStreamSchema>;
export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type PromoCode = typeof promoCodes.$inferSelect;
export type InsertPromoCode = z.infer<typeof insertPromoCodeSchema>;
export type WishlistItem = typeof wishlistItems.$inferSelect;
export type InsertWishlistItem = z.infer<typeof insertWishlistItemSchema>;
export type ContentDrop = typeof contentDrops.$inferSelect;
export type InsertContentDrop = z.infer<typeof insertContentDropSchema>;
export type ShopProduct = typeof shopProducts.$inferSelect;
export type InsertShopProduct = z.infer<typeof insertShopProductSchema>;
export type ShopOrder = typeof shopOrders.$inferSelect;
export type InsertShopOrder = z.infer<typeof insertShopOrderSchema>;
export type FanRequest = typeof fanRequests.$inferSelect;
export type InsertFanRequest = z.infer<typeof insertFanRequestSchema>;
export type BlastMessage = typeof blastMessages.$inferSelect;
export type InsertBlastMessage = z.infer<typeof insertBlastMessageSchema>;
export type VerificationRequest = typeof verificationRequests.$inferSelect;
export type InsertVerificationRequest = z.infer<typeof insertVerificationRequestSchema>;
export type AccessCode = typeof accessCodes.$inferSelect;
export type InsertAccessCode = z.infer<typeof insertAccessCodeSchema>;
export type ModerationQueue = typeof moderationQueue.$inferSelect;
export type InsertModerationQueue = z.infer<typeof insertModerationQueueSchema>;
export type PrivacySettings = typeof privacySettings.$inferSelect;
export type InsertPrivacySettings = z.infer<typeof insertPrivacySettingsSchema>;
export type UserBlock = typeof userBlocks.$inferSelect;
export type InsertUserBlock = z.infer<typeof insertUserBlockSchema>;
export type ContentAccessLog = typeof contentAccessLogs.$inferSelect;
export type InsertContentAccessLog = z.infer<typeof insertContentAccessLogSchema>;
export type TwoFactorAuth = typeof twoFactorAuth.$inferSelect;
export type InsertTwoFactorAuth = z.infer<typeof insertTwoFactorAuthSchema>;
export type Story = typeof stories.$inferSelect;
export type InsertStory = z.infer<typeof insertStorySchema>;
export type StoryView = typeof storyViews.$inferSelect;
export type Poll = typeof polls.$inferSelect;
export type InsertPoll = z.infer<typeof insertPollSchema>;
export type PollVote = typeof pollVotes.$inferSelect;
export type PPVContent = typeof ppvContent.$inferSelect;
export type InsertPPVContent = z.infer<typeof insertPPVContentSchema>;
export type PPVPurchase = typeof ppvPurchases.$inferSelect;
export type FanLevel = typeof fanLevels.$inferSelect;
export type InsertFanLevel = z.infer<typeof insertFanLevelSchema>;
export type UserFanLevel = typeof userFanLevels.$inferSelect;
export type Badge = typeof badges.$inferSelect;
export type InsertBadge = z.infer<typeof insertBadgeSchema>;
export type UserBadge = typeof userBadges.$inferSelect;
export type VoiceMessage = typeof voiceMessages.$inferSelect;
export type InsertVoiceMessage = z.infer<typeof insertVoiceMessageSchema>;
export type ContentBundle = typeof contentBundles.$inferSelect;
export type InsertContentBundle = z.infer<typeof insertContentBundleSchema>;
export type BundleItem = typeof bundleItems.$inferSelect;
export type BundlePurchase = typeof bundlePurchases.$inferSelect;
export type ScheduledPost = typeof scheduledPosts.$inferSelect;
export type InsertScheduledPost = z.infer<typeof insertScheduledPostSchema>;
export type Contest = typeof contests.$inferSelect;
export type InsertContest = z.infer<typeof insertContestSchema>;
export type ContestEntry = typeof contestEntries.$inferSelect;
export type Collection = typeof collections.$inferSelect;
export type InsertCollection = z.infer<typeof insertCollectionSchema>;
export type CollectionItem = typeof collectionItems.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type LeaderboardEntry = typeof leaderboardEntries.$inferSelect;
export type AutoResponder = typeof autoResponders.$inferSelect;
export type InsertAutoResponder = z.infer<typeof insertAutoResponderSchema>;
