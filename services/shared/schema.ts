import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  boolean,
  integer,
  decimal,
  pgEnum,
  primaryKey,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const platformEnum = pgEnum("platform_type", [
  "boyfanz",
  "girlfanz",
  "pupfanz",
  "daddyfanz",
  "tranzfanz",
  "taboofanz",
]);

export const userRoleEnum = pgEnum("user_role", [
  "fan",
  "creator",
  "moderator",
  "admin",
  "super_admin",
]);

export const contentStatusEnum = pgEnum("content_status", [
  "draft",
  "published",
  "archived",
  "flagged",
  "removed",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "cancelled",
  "expired",
  "paused",
]);

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table with SSO support
export const users = pgTable(
  "users",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    email: varchar("email").unique(),
    username: varchar("username").unique(),
    displayName: varchar("display_name"),
    firstName: varchar("first_name"),
    lastName: varchar("last_name"),
    profileImageUrl: varchar("profile_image_url"),
    bannerImageUrl: varchar("banner_image_url"),
    bio: text("bio"),

    // Enterprise security
    role: userRoleEnum("role").default("fan").notNull(),
    isVerified: boolean("is_verified").default(false),
    isActive: boolean("is_active").default(true),
    twoFactorEnabled: boolean("two_factor_enabled").default(false),
    twoFactorSecret: varchar("two_factor_secret"),

    // SSO fields
    ssoProvider: varchar("sso_provider"), // google, facebook, replit, etc
    ssoId: varchar("sso_id"),

    // Platform preferences
    defaultPlatform: platformEnum("default_platform"),
    allowedPlatforms: jsonb("allowed_platforms").$type<string[]>().default([]),

    // Financial
    walletBalance: decimal("wallet_balance", {
      precision: 10,
      scale: 2,
    }).default("0.00"),
    totalEarnings: decimal("total_earnings", {
      precision: 10,
      scale: 2,
    }).default("0.00"),

    // Compliance
    ageVerified: boolean("age_verified").default(false),
    ageVerificationDate: timestamp("age_verification_date"),
    documentsVerified: boolean("documents_verified").default(false),

    // Metadata
    lastLoginAt: timestamp("last_login_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("idx_users_email").on(table.email),
    index("idx_users_username").on(table.username),
    index("idx_users_sso").on(table.ssoProvider, table.ssoId),
  ],
);

// Platform-specific profiles
export const platformProfiles = pgTable(
  "platform_profiles",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    platform: platformEnum("platform").notNull(),

    // Platform-specific settings
    displayName: varchar("display_name"),
    bio: text("bio"),
    profileImageUrl: varchar("profile_image_url"),
    bannerImageUrl: varchar("banner_image_url"),

    // Pricing for creators
    subscriptionPrice: decimal("subscription_price", {
      precision: 10,
      scale: 2,
    }),
    ppvMessagePrice: decimal("ppv_message_price", { precision: 10, scale: 2 }),

    // Stats
    subscriberCount: integer("subscriber_count").default(0),
    postCount: integer("post_count").default(0),

    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    unique("unique_user_platform").on(table.userId, table.platform),
    index("idx_platform_profiles_user").on(table.userId),
    index("idx_platform_profiles_platform").on(table.platform),
  ],
);

// Content/Posts with multi-platform support
export const content = pgTable(
  "content",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    creatorId: varchar("creator_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // Platform targeting
    platforms: jsonb("platforms").$type<string[]>().notNull(), // Which platforms this content appears on
    primaryPlatform: platformEnum("primary_platform").notNull(),

    // Content details
    title: varchar("title"),
    description: text("description"),
    contentType: varchar("content_type").notNull(), // image, video, text, audio
    mediaUrls: jsonb("media_urls").$type<string[]>().default([]),
    thumbnailUrl: varchar("thumbnail_url"),

    // Access control
    isFree: boolean("is_free").default(false),
    isPPV: boolean("is_ppv").default(false),
    ppvPrice: decimal("ppv_price", { precision: 10, scale: 2 }),

    // Moderation
    status: contentStatusEnum("status").default("draft").notNull(),
    isExplicit: boolean("is_explicit").default(true),
    contentWarnings: jsonb("content_warnings").$type<string[]>().default([]),

    // Analytics
    viewCount: integer("view_count").default(0),
    likeCount: integer("like_count").default(0),
    commentCount: integer("comment_count").default(0),

    // Scheduling
    scheduledAt: timestamp("scheduled_at"),
    publishedAt: timestamp("published_at"),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("idx_content_creator").on(table.creatorId),
    index("idx_content_platforms").on(table.primaryPlatform),
    index("idx_content_status").on(table.status),
    index("idx_content_published").on(table.publishedAt),
  ],
);

// Subscriptions with platform support
export const subscriptions = pgTable(
  "subscriptions",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    subscriberId: varchar("subscriber_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    creatorId: varchar("creator_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    platform: platformEnum("platform").notNull(),

    status: subscriptionStatusEnum("status").default("active").notNull(),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),

    // Billing
    billingCycle: varchar("billing_cycle").default("monthly"), // monthly, yearly
    nextBillingDate: timestamp("next_billing_date"),

    // Auto-renewal
    autoRenew: boolean("auto_renew").default(true),

    startedAt: timestamp("started_at").defaultNow(),
    expiresAt: timestamp("expires_at"),
    cancelledAt: timestamp("cancelled_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    unique("unique_subscription").on(
      table.subscriberId,
      table.creatorId,
      table.platform,
    ),
    index("idx_subscriptions_subscriber").on(table.subscriberId),
    index("idx_subscriptions_creator").on(table.creatorId),
    index("idx_subscriptions_platform").on(table.platform),
    index("idx_subscriptions_status").on(table.status),
  ],
);

// Live Streams with platform support
export const liveStreams = pgTable(
  "live_streams",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    creatorId: varchar("creator_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // Platform targeting
    platforms: jsonb("platforms").$type<string[]>().notNull(),
    primaryPlatform: platformEnum("primary_platform").notNull(),

    title: varchar("title").notNull(),
    description: text("description"),
    thumbnailUrl: varchar("thumbnail_url"),

    // Stream details
    streamKey: varchar("stream_key").unique(),
    streamUrl: varchar("stream_url"),
    playbackUrl: varchar("playback_url"),

    // Access control
    isFree: boolean("is_free").default(false),
    price: decimal("price", { precision: 10, scale: 2 }),

    // Status
    isLive: boolean("is_live").default(false),
    viewerCount: integer("viewer_count").default(0),
    peakViewerCount: integer("peak_viewer_count").default(0),

    // Timestamps
    scheduledFor: timestamp("scheduled_for"),
    startedAt: timestamp("started_at"),
    endedAt: timestamp("ended_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("idx_streams_creator").on(table.creatorId),
    index("idx_streams_platform").on(table.primaryPlatform),
    index("idx_streams_live").on(table.isLive),
  ],
);

// Messages with platform context
export const messages = pgTable(
  "messages",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    senderId: varchar("sender_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    receiverId: varchar("receiver_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    platform: platformEnum("platform"), // Platform context for the message

    content: text("content"),
    mediaUrls: jsonb("media_urls").$type<string[]>().default([]),

    // PPV
    isPPV: boolean("is_ppv").default(false),
    ppvPrice: decimal("ppv_price", { precision: 10, scale: 2 }),
    isPurchased: boolean("is_purchased").default(false),

    isRead: boolean("is_read").default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("idx_messages_sender").on(table.senderId),
    index("idx_messages_receiver").on(table.receiverId),
    index("idx_messages_created").on(table.createdAt),
  ],
);

// Transactions
export const transactions = pgTable(
  "transactions",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    type: varchar("type").notNull(), // subscription, ppv, tip, withdrawal, refund
    platform: platformEnum("platform"),

    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    currency: varchar("currency").default("USD"),

    // Related entities
    relatedUserId: varchar("related_user_id").references(() => users.id),
    contentId: varchar("content_id").references(() => content.id),
    subscriptionId: varchar("subscription_id").references(
      () => subscriptions.id,
    ),

    // Payment details
    paymentMethod: varchar("payment_method"),
    paymentProcessor: varchar("payment_processor"),
    externalTransactionId: varchar("external_transaction_id"),

    status: varchar("status").notNull(), // pending, completed, failed, refunded

    metadata: jsonb("metadata"),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("idx_transactions_user").on(table.userId),
    index("idx_transactions_type").on(table.type),
    index("idx_transactions_status").on(table.status),
    index("idx_transactions_created").on(table.createdAt),
  ],
);

// Audit Logs for enterprise security
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id").references(() => users.id),

    action: varchar("action").notNull(), // login, logout, content_upload, payment, etc
    entityType: varchar("entity_type"), // user, content, subscription, etc
    entityId: varchar("entity_id"),

    platform: platformEnum("platform"),

    ipAddress: varchar("ip_address"),
    userAgent: text("user_agent"),

    metadata: jsonb("metadata"),

    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("idx_audit_user").on(table.userId),
    index("idx_audit_action").on(table.action),
    index("idx_audit_created").on(table.createdAt),
  ],
);

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  platformProfiles: many(platformProfiles),
  content: many(content),
  subscriptionsAsCreator: many(subscriptions),
  sentMessages: many(messages),
  receivedMessages: many(messages),
  transactions: many(transactions),
  liveStreams: many(liveStreams),
}));

export const platformProfilesRelations = relations(
  platformProfiles,
  ({ one }) => ({
    user: one(users, {
      fields: [platformProfiles.userId],
      references: [users.id],
    }),
  }),
);

export const contentRelations = relations(content, ({ one }) => ({
  creator: one(users, {
    fields: [content.creatorId],
    references: [users.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  subscriber: one(users, {
    fields: [subscriptions.subscriberId],
    references: [users.id],
  }),
  creator: one(users, {
    fields: [subscriptions.creatorId],
    references: [users.id],
  }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type PlatformProfile = typeof platformProfiles.$inferSelect;
export type Content = typeof content.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type LiveStream = typeof liveStreams.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
