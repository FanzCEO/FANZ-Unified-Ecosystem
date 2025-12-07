import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, jsonb, index, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum('user_role', ['affiliate', 'advertiser', 'admin']);
export const kycStatusEnum = pgEnum('kyc_status', ['unverified', 'initiated', 'in_review', 'approved', 'failed']);
export const offerStatusEnum = pgEnum('offer_status', ['draft', 'submitted', 'in_review', 'approved', 'paused', 'ended', 'banned']);
export const conversionStatusEnum = pgEnum('conversion_status', ['pending', 'approved', 'rejected']);
export const payoutStatusEnum = pgEnum('payout_status', ['pending', 'processing', 'sent', 'failed']);
export const payoutProviderEnum = pgEnum('payout_provider', ['paxum', 'cosmopayment', 'bitsafe', 'usdt', 'wise', 'payoneer']);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ssoUserId: varchar("sso_user_id").unique(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  name: text("name"),
  role: userRoleEnum("role").notNull().default('affiliate'),
  kycStatus: kycStatusEnum("kyc_status").notNull().default('unverified'),
  kycTier: integer("kyc_tier").notNull().default(0),
  kycVerifiedAt: timestamp("kyc_verified_at"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  emailIdx: index("email_idx").on(table.email),
  ssoUserIdIdx: index("sso_user_id_idx").on(table.ssoUserId),
}));

// Offers table
export const offers = pgTable("offers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  advertiserId: varchar("advertiser_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  status: offerStatusEnum("status").notNull().default('draft'),
  payoutAmount: decimal("payout_amount", { precision: 10, scale: 2 }).notNull(),
  payoutCurrency: varchar("payout_currency", { length: 3 }).notNull().default('USD'),
  conversionType: varchar("conversion_type").notNull(), // CPA, CPS, CPL, RevShare
  isAdultContent: boolean("is_adult_content").notNull().default(false),
  allowedTrafficTypes: text("allowed_traffic_types").array(),
  allowedGeos: text("allowed_geos").array(),
  restrictedGeos: text("restricted_geos").array(),
  conversionRate: decimal("conversion_rate", { precision: 5, scale: 2 }),
  landingPageUrl: text("landing_page_url").notNull(),
  trackingDomain: text("tracking_domain"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  advertiserIdIdx: index("advertiser_id_idx").on(table.advertiserId),
  statusIdx: index("offer_status_idx").on(table.status),
  isActiveIdx: index("offer_is_active_idx").on(table.isActive),
}));

// Clicks table
export const clicks = pgTable("clicks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  offerId: varchar("offer_id").notNull().references(() => offers.id),
  affiliateId: varchar("affiliate_id").notNull().references(() => users.id),
  sub1: text("sub1"),
  sub2: text("sub2"),
  sub3: text("sub3"),
  sub4: text("sub4"),
  sub5: text("sub5"),
  ipAddress: text("ip_address").notNull(),
  userAgent: text("user_agent").notNull(),
  referrer: text("referrer"),
  deviceFingerprint: text("device_fingerprint"),
  geoCountry: varchar("geo_country", { length: 2 }),
  geoCity: text("geo_city"),
  trafficType: text("traffic_type"),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  offerIdIdx: index("click_offer_id_idx").on(table.offerId),
  affiliateIdIdx: index("click_affiliate_id_idx").on(table.affiliateId),
  createdAtIdx: index("click_created_at_idx").on(table.createdAt),
  ipAddressIdx: index("click_ip_address_idx").on(table.ipAddress),
}));

// Conversions table
export const conversions = pgTable("conversions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clickId: varchar("click_id").references(() => clicks.id),
  offerId: varchar("offer_id").notNull().references(() => offers.id),
  affiliateId: varchar("affiliate_id").notNull().references(() => users.id),
  txid: text("txid").notNull().unique(),
  status: conversionStatusEnum("status").notNull().default('pending'),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default('USD'),
  commission: decimal("commission", { precision: 10, scale: 2 }).notNull(),
  approvedAt: timestamp("approved_at"),
  rejectedAt: timestamp("rejected_at"),
  rejectionReason: text("rejection_reason"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  clickIdIdx: index("conversion_click_id_idx").on(table.clickId),
  txidIdx: index("conversion_txid_idx").on(table.txid),
  affiliateIdIdx: index("conversion_affiliate_id_idx").on(table.affiliateId),
  statusIdx: index("conversion_status_idx").on(table.status),
  createdAtIdx: index("conversion_created_at_idx").on(table.createdAt),
}));

// Payouts table
export const payouts = pgTable("payouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  affiliateId: varchar("affiliate_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default('USD'),
  provider: payoutProviderEnum("provider").notNull(),
  providerTransactionId: text("provider_transaction_id"),
  status: payoutStatusEnum("status").notNull().default('pending'),
  paymentDetails: jsonb("payment_details"),
  processedAt: timestamp("processed_at"),
  failedAt: timestamp("failed_at"),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  affiliateIdIdx: index("payout_affiliate_id_idx").on(table.affiliateId),
  statusIdx: index("payout_status_idx").on(table.status),
  createdAtIdx: index("payout_created_at_idx").on(table.createdAt),
}));

// Creatives table
export const creatives = pgTable("creatives", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  offerId: varchar("offer_id").notNull().references(() => offers.id),
  name: text("name").notNull(),
  type: varchar("type").notNull(), // banner, widget, text, html
  size: varchar("size"),
  content: text("content").notNull(),
  status: varchar("status").notNull().default('active'),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  offerIdIdx: index("creative_offer_id_idx").on(table.offerId),
  statusIdx: index("creative_status_idx").on(table.status),
}));

// Tracking links table  
export const trackingLinks = pgTable("tracking_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  affiliateId: varchar("affiliate_id").notNull().references(() => users.id),
  offerId: varchar("offer_id").notNull().references(() => offers.id),
  code: varchar("code").notNull().unique(),
  deepLink: text("deep_link").notNull(),
  subId: varchar("sub_id"),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  affiliateIdIdx: index("tracking_link_affiliate_id_idx").on(table.affiliateId),
  offerIdIdx: index("tracking_link_offer_id_idx").on(table.offerId),
  codeIdx: index("tracking_link_code_idx").on(table.code),
}));

// User balances table
export const userBalances = pgTable("user_balances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  availableBalance: decimal("available_balance", { precision: 10, scale: 2 }).notNull().default('0'),
  pendingBalance: decimal("pending_balance", { precision: 10, scale: 2 }).notNull().default('0'),
  totalEarnings: decimal("total_earnings", { precision: 10, scale: 2 }).notNull().default('0'),
  currency: varchar("currency", { length: 3 }).notNull().default('USD'),
  updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  userIdIdx: index("balance_user_id_idx").on(table.userId),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOfferSchema = createInsertSchema(offers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClickSchema = createInsertSchema(clicks).omit({
  id: true,
  createdAt: true,
});

export const insertConversionSchema = createInsertSchema(conversions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPayoutSchema = createInsertSchema(payouts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCreativeSchema = createInsertSchema(creatives).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTrackingLinkSchema = createInsertSchema(trackingLinks).omit({
  id: true,
  createdAt: true,
});

export const insertUserBalanceSchema = createInsertSchema(userBalances).omit({
  id: true,
  updatedAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertOffer = z.infer<typeof insertOfferSchema>;
export type Offer = typeof offers.$inferSelect;
export type InsertClick = z.infer<typeof insertClickSchema>;
export type Click = typeof clicks.$inferSelect;
export type InsertConversion = z.infer<typeof insertConversionSchema>;
export type Conversion = typeof conversions.$inferSelect;
export type InsertPayout = z.infer<typeof insertPayoutSchema>;
export type Payout = typeof payouts.$inferSelect;
export type InsertCreative = z.infer<typeof insertCreativeSchema>;
export type Creative = typeof creatives.$inferSelect;
export type InsertTrackingLink = z.infer<typeof insertTrackingLinkSchema>;
export type TrackingLink = typeof trackingLinks.$inferSelect;
export type InsertUserBalance = z.infer<typeof insertUserBalanceSchema>;
export type UserBalance = typeof userBalances.$inferSelect;
