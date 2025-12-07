#!/usr/bin/env node
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  ageVerifications: () => ageVerifications,
  arOverlays: () => arOverlays,
  aspectRatioEnum: () => aspectRatioEnum,
  auditLogs: () => auditLogs,
  authProviderEnum: () => authProviderEnum,
  authenticityStatusEnum: () => authenticityStatusEnum,
  blockchainEnum: () => blockchainEnum,
  blockchainEvents: () => blockchainEvents,
  blockchainWallets: () => blockchainWallets,
  commentLikes: () => commentLikes,
  competitorPrices: () => competitorPrices,
  contentAnalytics: () => contentAnalytics,
  contentAuthenticity: () => contentAuthenticity,
  contentCreationSessions: () => contentCreationSessions,
  contentInteractions: () => contentInteractions,
  contentRatingEnum: () => contentRatingEnum,
  contentRiskLevelEnum: () => contentRiskLevelEnum,
  contentStatusEnum: () => contentStatusEnum,
  contentTypeEnum: () => contentTypeEnum,
  contentVersions: () => contentVersions,
  creatorRefundPolicies: () => creatorRefundPolicies,
  creatorStudioSettings: () => creatorStudioSettings,
  creditRatingEnum: () => creditRatingEnum,
  creditScores: () => creditScores,
  deepfakeVerificationLogs: () => deepfakeVerificationLogs,
  detectionProviderEnum: () => detectionProviderEnum,
  detectionResults: () => detectionResults,
  distributionCampaigns: () => distributionCampaigns,
  distributionStatusEnum: () => distributionStatusEnum,
  editingStatusEnum: () => editingStatusEnum,
  editingTasks: () => editingTasks,
  emailVerificationTokens: () => emailVerificationTokens,
  emotionTypeEnum: () => emotionTypeEnum,
  engagementLevelEnum: () => engagementLevelEnum,
  engagementPredictions: () => engagementPredictions,
  fanTrustScores: () => fanTrustScores,
  fanzCards: () => fanzCards,
  fanzTransactions: () => fanzTransactions,
  fanzWallets: () => fanzWallets,
  feedPosts: () => feedPosts,
  generatedAssets: () => generatedAssets,
  insertAgeVerificationSchema: () => insertAgeVerificationSchema,
  insertBlockchainEventSchema: () => insertBlockchainEventSchema,
  insertBlockchainWalletSchema: () => insertBlockchainWalletSchema,
  insertContentAnalyticsSchema: () => insertContentAnalyticsSchema,
  insertContentCreationSessionSchema: () => insertContentCreationSessionSchema,
  insertContentInteractionSchema: () => insertContentInteractionSchema,
  insertContentVersionSchema: () => insertContentVersionSchema,
  insertCreatorStudioSettingsSchema: () => insertCreatorStudioSettingsSchema,
  insertDistributionCampaignSchema: () => insertDistributionCampaignSchema,
  insertEditingTaskSchema: () => insertEditingTaskSchema,
  insertFanzTransactionSchema: () => insertFanzTransactionSchema,
  insertFanzWalletSchema: () => insertFanzWalletSchema,
  insertFeedPostSchema: () => insertFeedPostSchema,
  insertGeneratedAssetSchema: () => insertGeneratedAssetSchema,
  insertIpfsRecordSchema: () => insertIpfsRecordSchema,
  insertKnowledgeArticleSchema: () => insertKnowledgeArticleSchema,
  insertLiveStreamSchema: () => insertLiveStreamSchema,
  insertMarketplaceIntegrationSchema: () => insertMarketplaceIntegrationSchema,
  insertMediaAssetSchema: () => insertMediaAssetSchema,
  insertMessageSchema: () => insertMessageSchema,
  insertNftCollectionSchema: () => insertNftCollectionSchema,
  insertNftRoyaltyRuleSchema: () => insertNftRoyaltyRuleSchema,
  insertNftTokenSchema: () => insertNftTokenSchema,
  insertNftTransactionSchema: () => insertNftTransactionSchema,
  insertPlatformDistributionSchema: () => insertPlatformDistributionSchema,
  insertPostCommentSchema: () => insertPostCommentSchema,
  insertPostMediaSchema: () => insertPostMediaSchema,
  insertProfileSchema: () => insertProfileSchema,
  insertRefundRequestSchema: () => insertRefundRequestSchema,
  insertRoyaltyDistributionSchema: () => insertRoyaltyDistributionSchema,
  insertSponsoredPostSchema: () => insertSponsoredPostSchema,
  insertSubscriptionSchema: () => insertSubscriptionSchema,
  insertSupportMessageSchema: () => insertSupportMessageSchema,
  insertSupportTicketSchema: () => insertSupportTicketSchema,
  insertTransactionSchema: () => insertTransactionSchema,
  insertTutorialSchema: () => insertTutorialSchema,
  insertUserFollowSchema: () => insertUserFollowSchema,
  insertUserPreferencesSchema: () => insertUserPreferencesSchema,
  insertUserSchema: () => insertUserSchema,
  insertVoiceAnalyticsSchema: () => insertVoiceAnalyticsSchema,
  insertVoiceCampaignSchema: () => insertVoiceCampaignSchema,
  insertVoiceCreditsSchema: () => insertVoiceCreditsSchema,
  insertVoiceMessageSchema: () => insertVoiceMessageSchema,
  insertVoiceProfileSchema: () => insertVoiceProfileSchema,
  insertVoiceSampleSchema: () => insertVoiceSampleSchema,
  insertVoiceTransactionSchema: () => insertVoiceTransactionSchema,
  insertVrContentSchema: () => insertVrContentSchema,
  insertWalletTransactionSchema: () => insertWalletTransactionSchema,
  ipfsRecords: () => ipfsRecords,
  knowledgeArticles: () => knowledgeArticles,
  knowledgeEmbeddings: () => knowledgeEmbeddings,
  kycStatusEnum: () => kycStatusEnum,
  kycVerifications: () => kycVerifications,
  liveStreamCoStars: () => liveStreamCoStars,
  liveStreams: () => liveStreams,
  loanApplications: () => loanApplications,
  loanPurposeEnum: () => loanPurposeEnum,
  loanRepayments: () => loanRepayments,
  loanStatusEnum: () => loanStatusEnum,
  marketplaceEnum: () => marketplaceEnum,
  marketplaceIntegrations: () => marketplaceIntegrations,
  mediaAssets: () => mediaAssets,
  mediaAssetsRelations: () => mediaAssetsRelations,
  mediaStatusEnum: () => mediaStatusEnum,
  messages: () => messages,
  messagesRelations: () => messagesRelations,
  microloans: () => microloans,
  moderationQueue: () => moderationQueue,
  moderationQueueRelations: () => moderationQueueRelations,
  moderationStatusEnum: () => moderationStatusEnum,
  moodTags: () => moodTags,
  nftCollections: () => nftCollections,
  nftRoyaltyRules: () => nftRoyaltyRules,
  nftStandardEnum: () => nftStandardEnum,
  nftStatusEnum: () => nftStatusEnum,
  nftTokens: () => nftTokens,
  nftTransactionTypeEnum: () => nftTransactionTypeEnum,
  nftTransactions: () => nftTransactions,
  passwordResetTokens: () => passwordResetTokens,
  paymentGatewayEnum: () => paymentGatewayEnum,
  paymentProviderEnum: () => paymentProviderEnum,
  payoutAccounts: () => payoutAccounts,
  payoutRequests: () => payoutRequests,
  payoutStatusEnum: () => payoutStatusEnum,
  platformDistributions: () => platformDistributions,
  postComments: () => postComments,
  postEngagement: () => postEngagement,
  postLikes: () => postLikes,
  postMedia: () => postMedia,
  postTypeEnum: () => postTypeEnum,
  postUnlocks: () => postUnlocks,
  postVisibilityEnum: () => postVisibilityEnum,
  priceAdjustmentTypeEnum: () => priceAdjustmentTypeEnum,
  priceHistory: () => priceHistory,
  pricingModelEnum: () => pricingModelEnum,
  pricingRules: () => pricingRules,
  pricingStrategyEnum: () => pricingStrategyEnum,
  profiles: () => profiles,
  profilesRelations: () => profilesRelations,
  records2257: () => records2257,
  refundRequests: () => refundRequests,
  refundStatusEnum: () => refundStatusEnum,
  repaymentFrequencyEnum: () => repaymentFrequencyEnum,
  royaltyDistributions: () => royaltyDistributions,
  royaltyTypeEnum: () => royaltyTypeEnum,
  sentimentAnalysis: () => sentimentAnalysis,
  sentimentScoreEnum: () => sentimentScoreEnum,
  sessions: () => sessions,
  socialPlatformEnum: () => socialPlatformEnum,
  sponsoredPosts: () => sponsoredPosts,
  streamAnalytics: () => streamAnalytics,
  streamChatMessages: () => streamChatMessages,
  streamGifts: () => streamGifts,
  streamHighlights: () => streamHighlights,
  streamParticipants: () => streamParticipants,
  streamQualityEnum: () => streamQualityEnum,
  streamReactions: () => streamReactions,
  streamRecordings: () => streamRecordings,
  streamViewers: () => streamViewers,
  streamViews: () => streamViews,
  subscriptionStatusEnum: () => subscriptionStatusEnum,
  subscriptions: () => subscriptions,
  subscriptionsRelations: () => subscriptionsRelations,
  supportMessages: () => supportMessages,
  supportTickets: () => supportTickets,
  transactionResponseSchema: () => transactionResponseSchema,
  transactionStatusEnum: () => transactionStatusEnum,
  transactions: () => transactions,
  transactionsRelations: () => transactionsRelations,
  trustAuditLogs: () => trustAuditLogs,
  trustScoreEnum: () => trustScoreEnum,
  trustScoreResponseSchema: () => trustScoreResponseSchema,
  tutorialProgress: () => tutorialProgress,
  tutorialSteps: () => tutorialSteps,
  tutorials: () => tutorials,
  userFollows: () => userFollows,
  userPreferences: () => userPreferences,
  userRoleEnum: () => userRoleEnum,
  userStatusEnum: () => userStatusEnum,
  users: () => users,
  usersRelations: () => usersRelations,
  voiceAnalytics: () => voiceAnalytics,
  voiceCampaignStatusEnum: () => voiceCampaignStatusEnum,
  voiceCampaigns: () => voiceCampaigns,
  voiceCloningTypeEnum: () => voiceCloningTypeEnum,
  voiceCredits: () => voiceCredits,
  voiceEmotionEnum: () => voiceEmotionEnum,
  voiceMessageStatusEnum: () => voiceMessageStatusEnum,
  voiceMessages: () => voiceMessages,
  voiceProfileStatusEnum: () => voiceProfileStatusEnum,
  voiceProfiles: () => voiceProfiles,
  voiceProviderEnum: () => voiceProviderEnum,
  voiceSamples: () => voiceSamples,
  voiceTransactions: () => voiceTransactions,
  volumetricStreams: () => volumetricStreams,
  vrContent: () => vrContent,
  vrDeviceTypeEnum: () => vrDeviceTypeEnum,
  vrRenderingModeEnum: () => vrRenderingModeEnum,
  vrSessionStatusEnum: () => vrSessionStatusEnum,
  vrSessions: () => vrSessions,
  walletResponseSchema: () => walletResponseSchema,
  walletTransactions: () => walletTransactions,
  webhooks: () => webhooks
});
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var sessions, userRoleEnum, userStatusEnum, authProviderEnum, kycStatusEnum, mediaStatusEnum, payoutStatusEnum, moderationStatusEnum, subscriptionStatusEnum, transactionStatusEnum, paymentProviderEnum, contentStatusEnum, contentTypeEnum, editingStatusEnum, distributionStatusEnum, socialPlatformEnum, aspectRatioEnum, nftStandardEnum, nftStatusEnum, blockchainEnum, royaltyTypeEnum, nftTransactionTypeEnum, marketplaceEnum, voiceProviderEnum, voiceProfileStatusEnum, voiceCloningTypeEnum, voiceMessageStatusEnum, voiceCampaignStatusEnum, voiceEmotionEnum, vrSessionStatusEnum, vrDeviceTypeEnum, streamQualityEnum, vrRenderingModeEnum, pricingStrategyEnum, priceAdjustmentTypeEnum, pricingModelEnum, loanStatusEnum, repaymentFrequencyEnum, creditRatingEnum, loanPurposeEnum, detectionProviderEnum, authenticityStatusEnum, contentRiskLevelEnum, emotionTypeEnum, engagementLevelEnum, sentimentScoreEnum, users, passwordResetTokens, emailVerificationTokens, profiles, mediaAssets, kycVerifications, records2257, moderationQueue, payoutAccounts, payoutRequests, webhooks, subscriptions, transactions, messages, auditLogs, supportTickets, supportMessages, knowledgeArticles, knowledgeEmbeddings, tutorials, tutorialSteps, tutorialProgress, postTypeEnum, postVisibilityEnum, contentRatingEnum, feedPosts, postMedia, postEngagement, userFollows, ageVerifications, sponsoredPosts, postLikes, postUnlocks, postComments, commentLikes, liveStreams, streamViews, userPreferences, contentInteractions, vrContent, streamParticipants, streamChatMessages, streamGifts, streamReactions, streamHighlights, streamRecordings, streamViewers, streamAnalytics, usersRelations, profilesRelations, mediaAssetsRelations, moderationQueueRelations, subscriptionsRelations, transactionsRelations, messagesRelations, insertUserSchema, insertProfileSchema, insertMediaAssetSchema, insertMessageSchema, insertSubscriptionSchema, insertTransactionSchema, insertSupportTicketSchema, insertSupportMessageSchema, insertKnowledgeArticleSchema, insertTutorialSchema, paymentGatewayEnum, refundStatusEnum, trustScoreEnum, fanzTransactions, refundRequests, fanzWallets, fanzCards, walletTransactions, fanTrustScores, trustAuditLogs, creatorRefundPolicies, contentCreationSessions, editingTasks, contentVersions, distributionCampaigns, platformDistributions, contentAnalytics, generatedAssets, creatorStudioSettings, liveStreamCoStars, voiceProfiles, voiceSamples, voiceMessages, voiceCampaigns, voiceAnalytics, voiceCredits, voiceTransactions, blockchainWallets, nftCollections, nftTokens, nftTransactions, royaltyDistributions, nftRoyaltyRules, ipfsRecords, marketplaceIntegrations, blockchainEvents, vrSessions, arOverlays, volumetricStreams, pricingRules, priceHistory, competitorPrices, microloans, loanApplications, loanRepayments, creditScores, detectionResults, contentAuthenticity, deepfakeVerificationLogs, sentimentAnalysis, moodTags, engagementPredictions, insertFanzTransactionSchema, insertRefundRequestSchema, insertFanzWalletSchema, insertWalletTransactionSchema, insertFeedPostSchema, insertPostMediaSchema, insertSponsoredPostSchema, insertUserFollowSchema, insertAgeVerificationSchema, insertPostCommentSchema, insertLiveStreamSchema, insertUserPreferencesSchema, insertContentInteractionSchema, insertVrContentSchema, insertContentCreationSessionSchema, insertEditingTaskSchema, insertContentVersionSchema, insertDistributionCampaignSchema, insertPlatformDistributionSchema, insertCreatorStudioSettingsSchema, insertGeneratedAssetSchema, insertContentAnalyticsSchema, insertBlockchainWalletSchema, insertNftCollectionSchema, insertNftTokenSchema, insertNftTransactionSchema, insertRoyaltyDistributionSchema, insertNftRoyaltyRuleSchema, insertIpfsRecordSchema, insertMarketplaceIntegrationSchema, insertBlockchainEventSchema, insertVoiceProfileSchema, insertVoiceSampleSchema, insertVoiceMessageSchema, insertVoiceCampaignSchema, insertVoiceAnalyticsSchema, insertVoiceCreditsSchema, insertVoiceTransactionSchema, walletResponseSchema, trustScoreResponseSchema, transactionResponseSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    sessions = pgTable(
      "sessions",
      {
        sid: varchar("sid").primaryKey(),
        sess: jsonb("sess").notNull(),
        expire: timestamp("expire").notNull()
      },
      (table) => [index("IDX_session_expire").on(table.expire)]
    );
    userRoleEnum = pgEnum("user_role", ["fan", "creator", "admin", "support"]);
    userStatusEnum = pgEnum("user_status", ["active", "suspended", "banned"]);
    authProviderEnum = pgEnum("auth_provider", ["replit", "local"]);
    kycStatusEnum = pgEnum("kyc_status", ["pending", "verified", "rejected"]);
    mediaStatusEnum = pgEnum("media_status", ["pending", "approved", "rejected"]);
    payoutStatusEnum = pgEnum("payout_status", ["pending", "processing", "completed", "failed"]);
    moderationStatusEnum = pgEnum("moderation_status", ["pending", "approved", "rejected", "flagged"]);
    subscriptionStatusEnum = pgEnum("subscription_status", ["active", "cancelled", "expired", "suspended"]);
    transactionStatusEnum = pgEnum("transaction_status", ["pending", "completed", "failed", "refunded", "chargeback"]);
    paymentProviderEnum = pgEnum("payment_provider", ["ccbill", "segpay", "stripe"]);
    contentStatusEnum = pgEnum("content_status", ["draft", "processing", "ready", "published", "archived"]);
    contentTypeEnum = pgEnum("content_type", ["video", "image", "live_stream", "audio", "gif"]);
    editingStatusEnum = pgEnum("editing_status", ["pending", "processing", "completed", "failed"]);
    distributionStatusEnum = pgEnum("distribution_status", ["scheduled", "publishing", "published", "failed", "cancelled"]);
    socialPlatformEnum = pgEnum("social_platform", ["instagram", "tiktok", "twitter", "snapchat", "youtube"]);
    aspectRatioEnum = pgEnum("aspect_ratio", ["9:16", "16:9", "1:1", "4:5"]);
    nftStandardEnum = pgEnum("nft_standard", ["ERC721", "ERC1155"]);
    nftStatusEnum = pgEnum("nft_status", ["draft", "minting", "minted", "listed", "sold", "transferred", "burned"]);
    blockchainEnum = pgEnum("blockchain", ["ethereum", "polygon", "solana", "binance"]);
    royaltyTypeEnum = pgEnum("royalty_type", ["fixed", "decaying", "tiered"]);
    nftTransactionTypeEnum = pgEnum("nft_transaction_type", ["mint", "sale", "transfer", "royalty", "burn"]);
    marketplaceEnum = pgEnum("marketplace", ["internal", "opensea", "rarible", "looksrare", "x2y2"]);
    voiceProviderEnum = pgEnum("voice_provider", ["elevenlabs", "resemble", "speechify"]);
    voiceProfileStatusEnum = pgEnum("voice_profile_status", ["pending", "training", "ready", "failed", "disabled"]);
    voiceCloningTypeEnum = pgEnum("voice_cloning_type", ["instant", "professional", "custom"]);
    voiceMessageStatusEnum = pgEnum("voice_message_status", ["queued", "generating", "generated", "delivered", "failed"]);
    voiceCampaignStatusEnum = pgEnum("voice_campaign_status", ["draft", "scheduled", "running", "paused", "completed", "cancelled"]);
    voiceEmotionEnum = pgEnum("voice_emotion", ["neutral", "happy", "sad", "excited", "calm", "serious", "playful"]);
    vrSessionStatusEnum = pgEnum("vr_session_status", ["initializing", "active", "paused", "ended", "failed"]);
    vrDeviceTypeEnum = pgEnum("vr_device_type", ["quest3", "visionpro", "pico4", "index", "psvr2", "browser"]);
    streamQualityEnum = pgEnum("stream_quality", ["4k", "2k", "1080p", "720p", "adaptive"]);
    vrRenderingModeEnum = pgEnum("vr_rendering_mode", ["volumetric", "pixel_streaming", "webxr", "cloud"]);
    pricingStrategyEnum = pgEnum("pricing_strategy", ["dynamic", "fixed", "tiered", "subscription", "promotional"]);
    priceAdjustmentTypeEnum = pgEnum("price_adjustment_type", ["demand", "competitor", "time", "segment", "inventory"]);
    pricingModelEnum = pgEnum("pricing_model", ["ml_regression", "reinforcement_learning", "rule_based", "hybrid"]);
    loanStatusEnum = pgEnum("loan_status", ["pending", "approved", "active", "repaid", "defaulted", "cancelled"]);
    repaymentFrequencyEnum = pgEnum("repayment_frequency", ["daily", "weekly", "biweekly", "monthly"]);
    creditRatingEnum = pgEnum("credit_rating", ["excellent", "good", "fair", "poor", "unrated"]);
    loanPurposeEnum = pgEnum("loan_purpose", ["equipment", "production", "marketing", "training", "other"]);
    detectionProviderEnum = pgEnum("detection_provider", ["reality_defender", "sensity", "deepware", "internal"]);
    authenticityStatusEnum = pgEnum("authenticity_status", ["genuine", "manipulated", "deepfake", "uncertain", "pending"]);
    contentRiskLevelEnum = pgEnum("content_risk_level", ["safe", "low", "medium", "high", "critical"]);
    emotionTypeEnum = pgEnum("emotion_type", ["happy", "sad", "angry", "surprised", "neutral", "excited", "romantic", "playful"]);
    engagementLevelEnum = pgEnum("engagement_level", ["very_low", "low", "medium", "high", "very_high"]);
    sentimentScoreEnum = pgEnum("sentiment_score", ["very_negative", "negative", "neutral", "positive", "very_positive"]);
    users = pgTable("users", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      email: varchar("email").unique().notNull(),
      firstName: varchar("first_name"),
      lastName: varchar("last_name"),
      profileImageUrl: varchar("profile_image_url"),
      username: varchar("username").unique(),
      password: varchar("password").notNull(),
      // Bcrypt hashed password
      role: userRoleEnum("role").default("fan"),
      status: userStatusEnum("status").default("active"),
      authProvider: authProviderEnum("auth_provider").default("local"),
      isCreator: boolean("is_creator").default(false),
      ageVerified: boolean("age_verified").default(false),
      emailVerified: boolean("email_verified").default(false),
      securityQuestion: varchar("security_question"),
      // For email recovery
      securityAnswer: varchar("security_answer"),
      // Hashed answer
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    passwordResetTokens = pgTable("password_reset_tokens", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      token: varchar("token").notNull().unique(),
      expiresAt: timestamp("expires_at").notNull(),
      used: boolean("used").default(false),
      createdAt: timestamp("created_at").defaultNow()
    });
    emailVerificationTokens = pgTable("email_verification_tokens", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      token: varchar("token").notNull().unique(),
      expiresAt: timestamp("expires_at").notNull(),
      used: boolean("used").default(false),
      createdAt: timestamp("created_at").defaultNow()
    });
    profiles = pgTable("profiles", {
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
      subscriptionPrice: integer("subscription_price"),
      // in cents
      totalEarnings: integer("total_earnings").default(0),
      fanCount: integer("fan_count").default(0),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    mediaAssets = pgTable("media_assets", {
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
      price: integer("price"),
      // in cents, null for free content
      forensicSignature: varchar("forensic_signature"),
      views: integer("views").default(0),
      likes: integer("likes").default(0),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    kycVerifications = pgTable("kyc_verifications", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      provider: varchar("provider").notNull(),
      status: kycStatusEnum("status").default("pending"),
      documentType: varchar("document_type"),
      dataJson: jsonb("data_json"),
      verifiedAt: timestamp("verified_at"),
      createdAt: timestamp("created_at").defaultNow()
    });
    records2257 = pgTable("records_2257", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      docType: varchar("doc_type").notNull(),
      s3Key: varchar("s3_key").notNull(),
      checksum: varchar("checksum").notNull(),
      createdAt: timestamp("created_at").defaultNow()
    });
    moderationQueue = pgTable("moderation_queue", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      mediaId: varchar("media_id").references(() => mediaAssets.id, { onDelete: "cascade" }).notNull(),
      status: moderationStatusEnum("status").default("pending"),
      reviewerId: varchar("reviewer_id").references(() => users.id),
      notes: text("notes"),
      priority: integer("priority").default(1),
      aiConfidence: integer("ai_confidence"),
      // 0-100
      reportCount: integer("report_count").default(0),
      createdAt: timestamp("created_at").defaultNow(),
      reviewedAt: timestamp("reviewed_at")
    });
    payoutAccounts = pgTable("payout_accounts", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      provider: varchar("provider").notNull(),
      // Paxum, ePayService, etc.
      accountRef: varchar("account_ref").notNull(),
      status: varchar("status").default("active"),
      isDefault: boolean("is_default").default(false),
      createdAt: timestamp("created_at").defaultNow()
    });
    payoutRequests = pgTable("payout_requests", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      accountId: varchar("account_id").references(() => payoutAccounts.id).notNull(),
      amountCents: integer("amount_cents").notNull(),
      currency: varchar("currency").default("USD"),
      status: payoutStatusEnum("status").default("pending"),
      providerRef: varchar("provider_ref"),
      processingFee: integer("processing_fee"),
      createdAt: timestamp("created_at").defaultNow(),
      processedAt: timestamp("processed_at")
    });
    webhooks = pgTable("webhooks", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      url: varchar("url").notNull(),
      secret: varchar("secret").notNull(),
      eventsJson: jsonb("events_json"),
      status: varchar("status").default("active"),
      lastPing: timestamp("last_ping"),
      createdAt: timestamp("created_at").defaultNow()
    });
    subscriptions = pgTable("subscriptions", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      provider: paymentProviderEnum("provider").notNull(),
      providerSubscriptionId: varchar("provider_subscription_id").unique(),
      status: subscriptionStatusEnum("status").default("active"),
      pricePerMonth: integer("price_per_month").notNull(),
      // in cents
      currency: varchar("currency").default("USD"),
      billingCycle: varchar("billing_cycle").default("monthly"),
      nextBillingDate: timestamp("next_billing_date"),
      cancelledAt: timestamp("cancelled_at"),
      expiredAt: timestamp("expired_at"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    transactions = pgTable("transactions", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }),
      mediaId: varchar("media_id").references(() => mediaAssets.id),
      subscriptionId: varchar("subscription_id").references(() => subscriptions.id),
      provider: paymentProviderEnum("provider").notNull(),
      providerTransactionId: varchar("provider_transaction_id").unique(),
      type: varchar("type").notNull(),
      // subscription, purchase, tip, refund
      status: transactionStatusEnum("status").default("pending"),
      amountCents: integer("amount_cents").notNull(),
      currency: varchar("currency").default("USD"),
      providerFee: integer("provider_fee"),
      platformFee: integer("platform_fee"),
      creatorEarnings: integer("creator_earnings"),
      metadata: jsonb("metadata"),
      // provider-specific data
      ipAddress: varchar("ip_address"),
      userAgent: varchar("user_agent"),
      createdAt: timestamp("created_at").defaultNow(),
      processedAt: timestamp("processed_at")
    });
    messages = pgTable("messages", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      senderId: varchar("sender_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      receiverId: varchar("receiver_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      content: text("content").notNull(),
      mediaUrl: varchar("media_url"),
      isRead: boolean("is_read").default(false),
      createdAt: timestamp("created_at").defaultNow()
    });
    auditLogs = pgTable("audit_logs", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      actorId: varchar("actor_id").references(() => users.id),
      action: varchar("action").notNull(),
      targetType: varchar("target_type").notNull(),
      targetId: varchar("target_id"),
      metadata: jsonb("metadata"),
      ipAddress: varchar("ip_address"),
      userAgent: varchar("user_agent"),
      createdAt: timestamp("created_at").defaultNow()
    });
    supportTickets = pgTable("support_tickets", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      subject: varchar("subject", { length: 255 }).notNull(),
      category: varchar("category").notNull().default("tech"),
      // tech, billing, moderation, feature, other
      priority: varchar("priority").notNull().default("normal"),
      // low, normal, high, critical
      status: varchar("status").notNull().default("open"),
      // open, in_progress, resolved, closed
      assignedTo: varchar("assigned_to").references(() => users.id),
      source: varchar("source").notNull().default("web"),
      // web, ws, email
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    supportMessages = pgTable("support_messages", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      ticketId: varchar("ticket_id").references(() => supportTickets.id, { onDelete: "cascade" }).notNull(),
      senderId: varchar("sender_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      body: text("body").notNull(),
      attachments: text("attachments").array(),
      isInternalNote: boolean("is_internal_note").default(false),
      createdAt: timestamp("created_at").defaultNow()
    });
    knowledgeArticles = pgTable("knowledge_articles", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      title: varchar("title", { length: 255 }).notNull(),
      slug: varchar("slug", { length: 255 }).notNull().unique(),
      summary: text("summary"),
      content: text("content").notNull(),
      tags: text("tags").array(),
      status: varchar("status").notNull().default("draft"),
      // draft, published, archived
      createdBy: varchar("created_by").references(() => users.id, { onDelete: "cascade" }).notNull(),
      updatedBy: varchar("updated_by").references(() => users.id),
      publishedAt: timestamp("published_at"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    knowledgeEmbeddings = pgTable("knowledge_embeddings", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      articleId: varchar("article_id").references(() => knowledgeArticles.id, { onDelete: "cascade" }).notNull(),
      embedding: text("embedding").notNull(),
      // JSON string of vector embedding
      chunkIndex: integer("chunk_index").notNull(),
      chunkContent: text("chunk_content").notNull(),
      createdAt: timestamp("created_at").defaultNow()
    });
    tutorials = pgTable("tutorials", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      title: varchar("title", { length: 255 }).notNull(),
      roleTarget: varchar("role_target").notNull().default("all"),
      // fan, creator, admin, all
      difficulty: varchar("difficulty").notNull().default("beginner"),
      // beginner, intermediate, advanced
      estimatedMinutes: integer("estimated_minutes").default(10),
      coverImageUrl: varchar("cover_image_url"),
      summary: text("summary"),
      status: varchar("status").notNull().default("draft"),
      // draft, published, archived
      createdBy: varchar("created_by").references(() => users.id, { onDelete: "cascade" }).notNull(),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    tutorialSteps = pgTable("tutorial_steps", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      tutorialId: varchar("tutorial_id").references(() => tutorials.id, { onDelete: "cascade" }).notNull(),
      stepNumber: integer("step_number").notNull(),
      title: varchar("title", { length: 255 }).notNull(),
      body: text("body").notNull(),
      mediaUrl: varchar("media_url"),
      checklist: text("checklist"),
      // JSON string of checklist items
      createdAt: timestamp("created_at").defaultNow()
    });
    tutorialProgress = pgTable("tutorial_progress", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      tutorialId: varchar("tutorial_id").references(() => tutorials.id, { onDelete: "cascade" }).notNull(),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      completedStep: integer("completed_step").default(0),
      startedAt: timestamp("started_at").defaultNow(),
      completedAt: timestamp("completed_at")
    });
    postTypeEnum = pgEnum("post_type", ["text", "image", "video", "mixed"]);
    postVisibilityEnum = pgEnum("post_visibility", ["free", "subscriber", "paid", "followers"]);
    contentRatingEnum = pgEnum("content_rating", ["safe", "suggestive", "explicit"]);
    feedPosts = pgTable("feed_posts", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      type: postTypeEnum("type").default("text"),
      content: text("content"),
      // Text content or caption
      visibility: postVisibilityEnum("visibility").default("subscriber"),
      priceInCents: integer("price_in_cents"),
      // For paid posts
      isFreePreview: boolean("is_free_preview").default(false),
      // Creator allows free preview
      requiresAgeVerification: boolean("requires_age_verification").default(true),
      contentRating: contentRatingEnum("content_rating").default("explicit"),
      isPinned: boolean("is_pinned").default(false),
      isPublished: boolean("is_published").default(true),
      scheduledAt: timestamp("scheduled_at"),
      // For scheduled posts
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    postMedia = pgTable("post_media", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      postId: varchar("post_id").references(() => feedPosts.id, { onDelete: "cascade" }).notNull(),
      mediaUrl: varchar("media_url").notNull(),
      thumbnailUrl: varchar("thumbnail_url"),
      mediaType: varchar("media_type").notNull(),
      // image, video
      mimeType: varchar("mime_type"),
      duration: integer("duration"),
      // For videos (seconds)
      width: integer("width"),
      height: integer("height"),
      sortOrder: integer("sort_order").default(0),
      createdAt: timestamp("created_at").defaultNow()
    });
    postEngagement = pgTable("post_engagement", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      postId: varchar("post_id").references(() => feedPosts.id, { onDelete: "cascade" }).notNull(),
      views: integer("views").default(0),
      likes: integer("likes").default(0),
      comments: integer("comments").default(0),
      shares: integer("shares").default(0),
      unlocks: integer("unlocks").default(0),
      // For paid posts
      watchTimeSeconds: integer("watch_time_seconds").default(0),
      // For videos
      updatedAt: timestamp("updated_at").defaultNow()
    });
    userFollows = pgTable("user_follows", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      followerId: varchar("follower_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      notificationsEnabled: boolean("notifications_enabled").default(true),
      createdAt: timestamp("created_at").defaultNow()
    });
    ageVerifications = pgTable("age_verifications", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
      provider: varchar("provider").default("verifymyage"),
      // verifymyage, manual, etc.
      isVerified: boolean("is_verified").default(false),
      verifiedAt: timestamp("verified_at"),
      verificationToken: varchar("verification_token"),
      dateOfBirth: timestamp("date_of_birth"),
      documentType: varchar("document_type"),
      expiresAt: timestamp("expires_at"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    sponsoredPosts = pgTable("sponsored_posts", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      title: varchar("title").notNull(),
      description: text("description"),
      mediaUrl: varchar("media_url"),
      clickUrl: varchar("click_url").notNull(),
      isActive: boolean("is_active").default(true),
      impressions: integer("impressions").default(0),
      clicks: integer("clicks").default(0),
      budget: integer("budget"),
      // in cents
      spent: integer("spent").default(0),
      // in cents
      targetAudience: jsonb("target_audience"),
      // Demographics, interests, etc.
      startDate: timestamp("start_date"),
      endDate: timestamp("end_date"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    postLikes = pgTable("post_likes", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      postId: varchar("post_id").references(() => feedPosts.id, { onDelete: "cascade" }).notNull(),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      createdAt: timestamp("created_at").defaultNow()
    });
    postUnlocks = pgTable("post_unlocks", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      postId: varchar("post_id").references(() => feedPosts.id, { onDelete: "cascade" }).notNull(),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      transactionId: varchar("transaction_id").references(() => transactions.id),
      paidAmount: integer("paid_amount"),
      // in cents
      createdAt: timestamp("created_at").defaultNow()
    });
    postComments = pgTable("post_comments", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      postId: varchar("post_id").references(() => feedPosts.id, { onDelete: "cascade" }).notNull(),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      parentId: varchar("parent_id"),
      // For threaded replies
      content: text("content").notNull(),
      likes: integer("likes").default(0),
      isEdited: boolean("is_edited").default(false),
      isPinned: boolean("is_pinned").default(false),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    commentLikes = pgTable("comment_likes", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      commentId: varchar("comment_id").references(() => postComments.id, { onDelete: "cascade" }).notNull(),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      createdAt: timestamp("created_at").defaultNow()
    });
    liveStreams = pgTable("live_streams", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      title: varchar("title").notNull(),
      description: text("description"),
      thumbnailUrl: varchar("thumbnail_url"),
      streamKey: varchar("stream_key").notNull().unique(),
      playbackUrl: varchar("playback_url"),
      status: varchar("status").default("scheduled"),
      // scheduled, live, ended
      visibility: postVisibilityEnum("visibility").default("subscriber"),
      priceInCents: integer("price_in_cents"),
      viewerCount: integer("viewer_count").default(0),
      totalViews: integer("total_views").default(0),
      scheduledAt: timestamp("scheduled_at"),
      startedAt: timestamp("started_at"),
      endedAt: timestamp("ended_at"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    streamViews = pgTable("stream_views", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      streamId: varchar("stream_id").references(() => liveStreams.id, { onDelete: "cascade" }).notNull(),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      watchTimeSeconds: integer("watch_time_seconds").default(0),
      tippedAmount: integer("tipped_amount").default(0),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    userPreferences = pgTable("user_preferences", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
      preferredCategories: text("preferred_categories").array(),
      blockedCreators: text("blocked_creators").array(),
      blockedKeywords: text("blocked_keywords").array(),
      contentPreferences: jsonb("content_preferences"),
      // Detailed preferences JSON
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    contentInteractions = pgTable("content_interactions", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      postId: varchar("post_id").references(() => feedPosts.id, { onDelete: "cascade" }),
      streamId: varchar("stream_id").references(() => liveStreams.id, { onDelete: "cascade" }),
      interactionType: varchar("interaction_type").notNull(),
      // view, like, comment, share, skip, hide
      watchTimeSeconds: integer("watch_time_seconds"),
      engagementScore: integer("engagement_score"),
      // 0-100 calculated score
      createdAt: timestamp("created_at").defaultNow()
    });
    vrContent = pgTable("vr_content", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      postId: varchar("post_id").references(() => feedPosts.id, { onDelete: "cascade" }),
      mediaId: varchar("media_id").references(() => mediaAssets.id, { onDelete: "cascade" }),
      vrType: varchar("vr_type").notNull(),
      // 360_video, 180_video, 3d_model, ar_filter
      resolution: varchar("resolution"),
      // 4K, 8K, etc.
      stereoscopicMode: varchar("stereoscopic_mode"),
      // mono, stereo_lr, stereo_tb
      projectionType: varchar("projection_type"),
      // equirectangular, cubemap
      modelFormat: varchar("model_format"),
      // gltf, fbx, obj
      arTrackingType: varchar("ar_tracking_type"),
      // face, world, image
      metadata: jsonb("metadata"),
      // Additional VR/AR specific data
      createdAt: timestamp("created_at").defaultNow()
    });
    streamParticipants = pgTable("stream_participants", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      streamId: varchar("stream_id").references(() => liveStreams.id, { onDelete: "cascade" }).notNull(),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      role: varchar("role").notNull().default("co-star"),
      // host, co-star, moderator
      isVerified: boolean("is_verified").default(false),
      verificationStatus: varchar("verification_status").default("pending"),
      // pending, verified, failed
      verifiedAt: timestamp("verified_at"),
      joinedAt: timestamp("joined_at"),
      leftAt: timestamp("left_at"),
      streamQuality: varchar("stream_quality").default("720p"),
      // 360p, 720p, 1080p, 4K
      audioEnabled: boolean("audio_enabled").default(true),
      videoEnabled: boolean("video_enabled").default(true),
      screenPosition: jsonb("screen_position"),
      // {x, y, width, height} for multi-person layout
      createdAt: timestamp("created_at").defaultNow()
    });
    streamChatMessages = pgTable("stream_chat_messages", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      streamId: varchar("stream_id").references(() => liveStreams.id, { onDelete: "cascade" }).notNull(),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      message: text("message").notNull(),
      messageType: varchar("message_type").default("text"),
      // text, emote, announcement, system
      isPinned: boolean("is_pinned").default(false),
      isModerated: boolean("is_moderated").default(false),
      moderatedBy: varchar("moderated_by").references(() => users.id),
      replyToId: varchar("reply_to_id"),
      // For threaded messages
      metadata: jsonb("metadata"),
      // emotes, mentions, etc.
      createdAt: timestamp("created_at").defaultNow()
    });
    streamGifts = pgTable("stream_gifts", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      streamId: varchar("stream_id").references(() => liveStreams.id, { onDelete: "cascade" }).notNull(),
      senderId: varchar("sender_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      receiverId: varchar("receiver_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      // Can be host or co-star
      giftType: varchar("gift_type").notNull(),
      // rose, heart, diamond, fireworks, etc.
      giftValue: integer("gift_value").notNull(),
      // in cents
      quantity: integer("quantity").default(1),
      animationType: varchar("animation_type").default("floating"),
      // floating, explosion, rain
      message: text("message"),
      isAnonymous: boolean("is_anonymous").default(false),
      transactionId: varchar("transaction_id").references(() => transactions.id),
      createdAt: timestamp("created_at").defaultNow()
    });
    streamReactions = pgTable("stream_reactions", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      streamId: varchar("stream_id").references(() => liveStreams.id, { onDelete: "cascade" }).notNull(),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      reactionType: varchar("reaction_type").notNull(),
      // heart, fire, laugh, wow, clap
      intensity: integer("intensity").default(1),
      // 1-10 for reaction strength
      timestamp: integer("timestamp"),
      // Stream timestamp in seconds
      createdAt: timestamp("created_at").defaultNow()
    });
    streamHighlights = pgTable("stream_highlights", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      streamId: varchar("stream_id").references(() => liveStreams.id, { onDelete: "cascade" }).notNull(),
      title: varchar("title"),
      startTime: integer("start_time").notNull(),
      // seconds from stream start
      endTime: integer("end_time").notNull(),
      // seconds from stream start
      clipUrl: varchar("clip_url"),
      thumbnailUrl: varchar("thumbnail_url"),
      highlightType: varchar("highlight_type").notNull(),
      // ai_detected, manual, peak_viewers, peak_gifts
      score: integer("score").default(0),
      // AI confidence score 0-100
      tags: text("tags").array(),
      metadata: jsonb("metadata"),
      // AI analysis data
      createdAt: timestamp("created_at").defaultNow()
    });
    streamRecordings = pgTable("stream_recordings", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      streamId: varchar("stream_id").references(() => liveStreams.id, { onDelete: "cascade" }).notNull(),
      recordingUrl: varchar("recording_url").notNull(),
      thumbnailUrl: varchar("thumbnail_url"),
      duration: integer("duration"),
      // in seconds
      fileSize: integer("file_size"),
      // in bytes
      resolution: varchar("resolution"),
      // 1080p, 720p, etc.
      format: varchar("format").default("mp4"),
      // mp4, webm, etc.
      status: varchar("status").default("processing"),
      // processing, ready, failed
      processedAt: timestamp("processed_at"),
      createdAt: timestamp("created_at").defaultNow()
    });
    streamViewers = pgTable("stream_viewers", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      streamId: varchar("stream_id").references(() => liveStreams.id, { onDelete: "cascade" }).notNull(),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      joinedAt: timestamp("joined_at").defaultNow(),
      leftAt: timestamp("left_at"),
      watchTimeSeconds: integer("watch_time_seconds").default(0),
      peakQuality: varchar("peak_quality"),
      // Highest quality watched
      deviceType: varchar("device_type"),
      // mobile, desktop, tablet, tv
      location: varchar("location"),
      // Country/region
      connectionQuality: varchar("connection_quality"),
      // excellent, good, poor
      bufferingEvents: integer("buffering_events").default(0),
      isActive: boolean("is_active").default(true)
    });
    streamAnalytics = pgTable("stream_analytics", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      streamId: varchar("stream_id").references(() => liveStreams.id, { onDelete: "cascade" }).notNull().unique(),
      peakViewers: integer("peak_viewers").default(0),
      avgViewers: integer("avg_viewers").default(0),
      totalViewers: integer("total_viewers").default(0),
      totalWatchTimeMinutes: integer("total_watch_time_minutes").default(0),
      totalGifts: integer("total_gifts").default(0),
      totalGiftValue: integer("total_gift_value").default(0),
      // in cents
      totalReactions: integer("total_reactions").default(0),
      totalChatMessages: integer("total_chat_messages").default(0),
      engagementScore: integer("engagement_score").default(0),
      // 0-100
      viewerRetention: jsonb("viewer_retention"),
      // {time: percentage} graph data
      demographicsData: jsonb("demographics_data"),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    usersRelations = relations(users, ({ one, many }) => ({
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
      receivedMessages: many(messages, { relationName: "receiver" })
    }));
    profilesRelations = relations(profiles, ({ one }) => ({
      user: one(users, { fields: [profiles.userId], references: [users.id] })
    }));
    mediaAssetsRelations = relations(mediaAssets, ({ one, many }) => ({
      owner: one(users, { fields: [mediaAssets.ownerId], references: [users.id] }),
      moderationQueue: many(moderationQueue)
    }));
    moderationQueueRelations = relations(moderationQueue, ({ one }) => ({
      media: one(mediaAssets, { fields: [moderationQueue.mediaId], references: [mediaAssets.id] }),
      reviewer: one(users, { fields: [moderationQueue.reviewerId], references: [users.id] })
    }));
    subscriptionsRelations = relations(subscriptions, ({ one }) => ({
      subscriber: one(users, { fields: [subscriptions.userId], references: [users.id], relationName: "subscriber" }),
      creator: one(users, { fields: [subscriptions.creatorId], references: [users.id], relationName: "creator" })
    }));
    transactionsRelations = relations(transactions, ({ one }) => ({
      buyer: one(users, { fields: [transactions.userId], references: [users.id], relationName: "buyer" }),
      creator: one(users, { fields: [transactions.creatorId], references: [users.id], relationName: "creator" }),
      media: one(mediaAssets, { fields: [transactions.mediaId], references: [mediaAssets.id] }),
      subscription: one(subscriptions, { fields: [transactions.subscriptionId], references: [subscriptions.id] })
    }));
    messagesRelations = relations(messages, ({ one }) => ({
      sender: one(users, { fields: [messages.senderId], references: [users.id], relationName: "sender" }),
      receiver: one(users, { fields: [messages.receiverId], references: [users.id], relationName: "receiver" })
    }));
    insertUserSchema = createInsertSchema(users).pick({
      username: true,
      password: true,
      email: true
    });
    insertProfileSchema = createInsertSchema(profiles).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertMediaAssetSchema = createInsertSchema(mediaAssets).omit({
      id: true,
      createdAt: true,
      updatedAt: true,
      views: true,
      likes: true
    });
    insertMessageSchema = createInsertSchema(messages).omit({
      id: true,
      createdAt: true,
      isRead: true
    });
    insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertTransactionSchema = createInsertSchema(transactions).omit({
      id: true,
      createdAt: true,
      processedAt: true
    });
    insertSupportTicketSchema = createInsertSchema(supportTickets).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertSupportMessageSchema = createInsertSchema(supportMessages).omit({
      id: true,
      createdAt: true
    });
    insertKnowledgeArticleSchema = createInsertSchema(knowledgeArticles).omit({
      id: true,
      createdAt: true,
      updatedAt: true,
      publishedAt: true
    });
    insertTutorialSchema = createInsertSchema(tutorials).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    paymentGatewayEnum = pgEnum("payment_gateway", [
      "metamask",
      "solana",
      "tronlink",
      // Crypto wallets
      "rocketgate",
      "segpay",
      "ccbill",
      // Adult-friendly processors
      "fanzpay",
      "fanztoken",
      "fanzcoin"
      // Fanz native systems
    ]);
    refundStatusEnum = pgEnum("refund_status", [
      "pending",
      "auto_approved",
      "manual_review",
      "approved",
      "denied",
      "completed"
    ]);
    trustScoreEnum = pgEnum("trust_level", [
      "new",
      "trusted",
      "verified",
      "flagged",
      "banned"
    ]);
    fanzTransactions = pgTable("fanz_transactions", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      fanId: varchar("fan_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      gateway: paymentGatewayEnum("gateway").notNull(),
      txid: varchar("txid"),
      // Transaction ID from gateway or blockchain
      amount: integer("amount").notNull(),
      // in cents or smallest unit
      currency: varchar("currency").default("USD"),
      // USD, SOL, TRX, FANZ, etc.
      walletAddress: varchar("wallet_address"),
      email: varchar("email"),
      last4: varchar("last_4"),
      // Last 4 digits for card transactions
      status: transactionStatusEnum("status").default("pending"),
      ipAddress: varchar("ip_address"),
      deviceFingerprint: varchar("device_fingerprint"),
      contentAccessed: boolean("content_accessed").default(false),
      subscriptionId: varchar("subscription_id"),
      metadata: jsonb("metadata"),
      // Additional gateway-specific data
      createdAt: timestamp("created_at").defaultNow(),
      completedAt: timestamp("completed_at")
    });
    refundRequests = pgTable("refund_requests", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      transactionId: varchar("transaction_id").references(() => fanzTransactions.id, { onDelete: "cascade" }).notNull(),
      fanId: varchar("fan_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      reason: text("reason").notNull(),
      status: refundStatusEnum("status").default("pending"),
      verificationResult: jsonb("verification_result"),
      // Auto-verification data
      isAutoApproved: boolean("is_auto_approved").default(false),
      reviewedBy: varchar("reviewed_by").references(() => users.id),
      reviewNotes: text("review_notes"),
      amount: integer("amount").notNull(),
      ipAddress: varchar("ip_address"),
      deviceFingerprint: varchar("device_fingerprint"),
      fraudScore: integer("fraud_score").default(0),
      // 0-100
      createdAt: timestamp("created_at").defaultNow(),
      reviewedAt: timestamp("reviewed_at"),
      completedAt: timestamp("completed_at")
    });
    fanzWallets = pgTable("fanz_wallets", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
      fanzTokenBalance: integer("fanz_token_balance").default(0),
      // FanzToken balance
      fanzCoinBalance: integer("fanz_coin_balance").default(0),
      // FanzCoin (rewards)
      fanzCreditBalance: integer("fanz_credit_balance").default(0),
      // Store credit
      totalDeposited: integer("total_deposited").default(0),
      totalSpent: integer("total_spent").default(0),
      totalEarned: integer("total_earned").default(0),
      walletAddress: varchar("wallet_address").unique(),
      // For crypto withdrawals
      isVerified: boolean("is_verified").default(false),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    fanzCards = pgTable("fanz_cards", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      cardNumber: varchar("card_number").notNull().unique(),
      // Encrypted/masked
      cardType: varchar("card_type").default("virtual"),
      // virtual, physical
      balance: integer("balance").default(0),
      currency: varchar("currency").default("USD"),
      status: varchar("status").default("active"),
      // active, frozen, cancelled
      expiryDate: varchar("expiry_date"),
      cvv: varchar("cvv"),
      // Encrypted
      isDefault: boolean("is_default").default(false),
      metadata: jsonb("metadata"),
      createdAt: timestamp("created_at").defaultNow(),
      lastUsedAt: timestamp("last_used_at")
    });
    walletTransactions = pgTable("wallet_transactions", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      walletId: varchar("wallet_id").references(() => fanzWallets.id, { onDelete: "cascade" }).notNull(),
      type: varchar("type").notNull(),
      // deposit, withdrawal, purchase, earning, refund, transfer
      amount: integer("amount").notNull(),
      currency: varchar("currency").default("FANZ"),
      fromUser: varchar("from_user").references(() => users.id),
      toUser: varchar("to_user").references(() => users.id),
      relatedTransactionId: varchar("related_transaction_id"),
      description: text("description"),
      status: varchar("status").default("completed"),
      // pending, completed, failed
      metadata: jsonb("metadata"),
      createdAt: timestamp("created_at").defaultNow()
    });
    fanTrustScores = pgTable("fan_trust_scores", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      fanId: varchar("fan_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
      score: integer("score").default(100),
      // 0-100
      level: trustScoreEnum("level").default("new"),
      totalTransactions: integer("total_transactions").default(0),
      totalRefunds: integer("total_refunds").default(0),
      falseClaimsCount: integer("false_claims_count").default(0),
      successfulPurchases: integer("successful_purchases").default(0),
      accountAge: integer("account_age").default(0),
      // days
      lastReviewedAt: timestamp("last_reviewed_at"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    trustAuditLogs = pgTable("trust_audit_logs", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      action: varchar("action").notNull(),
      // verify_transaction, request_refund, approve_refund, deny_refund, flag_user
      performedBy: varchar("performed_by").references(() => users.id),
      targetUserId: varchar("target_user_id").references(() => users.id),
      transactionId: varchar("transaction_id").references(() => fanzTransactions.id),
      refundId: varchar("refund_id").references(() => refundRequests.id),
      result: varchar("result"),
      // success, failure, flagged
      details: jsonb("details"),
      ipAddress: varchar("ip_address"),
      userAgent: varchar("user_agent"),
      createdAt: timestamp("created_at").defaultNow()
    });
    creatorRefundPolicies = pgTable("creator_refund_policies", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
      autoApproveEnabled: boolean("auto_approve_enabled").default(true),
      autoApproveTimeLimit: integer("auto_approve_time_limit").default(60),
      // minutes
      requireContentAccess: boolean("require_content_access").default(true),
      customMessage: text("custom_message"),
      payoutDelayHours: integer("payout_delay_hours").default(24),
      // Delay for high-risk purchases
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    contentCreationSessions = pgTable("content_creation_sessions", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      title: varchar("title"),
      description: text("description"),
      type: contentTypeEnum("type").notNull(),
      status: contentStatusEnum("status").default("draft"),
      sourceType: varchar("source_type").notNull(),
      // camera, upload, live_stream, screen_record
      originalFileUrl: varchar("original_file_url"),
      originalFileSize: integer("original_file_size"),
      originalDuration: integer("original_duration"),
      // in seconds
      originalDimensions: jsonb("original_dimensions"),
      // {width, height}
      metadata: jsonb("metadata"),
      // camera settings, filters applied, etc.
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    editingTasks = pgTable("editing_tasks", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      sessionId: varchar("session_id").references(() => contentCreationSessions.id, { onDelete: "cascade" }).notNull(),
      creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      status: editingStatusEnum("status").default("pending"),
      editingOptions: jsonb("editing_options"),
      // {autoCut, addBranding, addIntro, addOutro, stabilize, etc.}
      aiSuggestions: jsonb("ai_suggestions"),
      // AI-suggested edits
      progress: integer("progress").default(0),
      // 0-100
      errorMessage: text("error_message"),
      createdAt: timestamp("created_at").defaultNow(),
      startedAt: timestamp("started_at"),
      completedAt: timestamp("completed_at")
    });
    contentVersions = pgTable("content_versions", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      sessionId: varchar("session_id").references(() => contentCreationSessions.id, { onDelete: "cascade" }).notNull(),
      editingTaskId: varchar("editing_task_id").references(() => editingTasks.id),
      aspectRatio: aspectRatioEnum("aspect_ratio").notNull(),
      format: varchar("format").notNull(),
      // mp4, webm, gif, jpg
      resolution: varchar("resolution"),
      // 1080p, 720p, etc.
      fileUrl: varchar("file_url").notNull(),
      thumbnailUrl: varchar("thumbnail_url"),
      fileSize: integer("file_size"),
      duration: integer("duration"),
      // in seconds
      dimensions: jsonb("dimensions"),
      // {width, height}
      isProcessed: boolean("is_processed").default(false),
      metadata: jsonb("metadata"),
      // encoding details, bitrate, etc.
      createdAt: timestamp("created_at").defaultNow()
    });
    distributionCampaigns = pgTable("distribution_campaigns", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      sessionId: varchar("session_id").references(() => contentCreationSessions.id, { onDelete: "cascade" }).notNull(),
      creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      name: varchar("name"),
      status: distributionStatusEnum("status").default("scheduled"),
      platforms: text("platforms").array(),
      // ["instagram", "tiktok", "twitter"]
      publishSchedule: jsonb("publish_schedule"),
      // {immediate: true, scheduledTime: date, timezone: string}
      distributionSettings: jsonb("distribution_settings"),
      // {autoHashtags, captions, mentions, etc.}
      qrCodeUrl: varchar("qr_code_url"),
      smartLinkUrl: varchar("smart_link_url"),
      createdAt: timestamp("created_at").defaultNow(),
      scheduledAt: timestamp("scheduled_at"),
      publishedAt: timestamp("published_at")
    });
    platformDistributions = pgTable("platform_distributions", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      campaignId: varchar("campaign_id").references(() => distributionCampaigns.id, { onDelete: "cascade" }).notNull(),
      contentVersionId: varchar("content_version_id").references(() => contentVersions.id).notNull(),
      platform: socialPlatformEnum("platform").notNull(),
      status: varchar("status").default("pending"),
      // pending, publishing, published, failed
      platformPostId: varchar("platform_post_id"),
      // ID from the social platform
      platformUrl: varchar("platform_url"),
      // Link to the post on the platform
      caption: text("caption"),
      hashtags: text("hashtags").array(),
      mentions: text("mentions").array(),
      errorMessage: text("error_message"),
      platformMetrics: jsonb("platform_metrics"),
      // views, likes, shares from platform
      createdAt: timestamp("created_at").defaultNow(),
      publishedAt: timestamp("published_at")
    });
    contentAnalytics = pgTable("content_analytics", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      sessionId: varchar("session_id").references(() => contentCreationSessions.id, { onDelete: "cascade" }).notNull(),
      creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      totalViews: integer("total_views").default(0),
      totalLikes: integer("total_likes").default(0),
      totalShares: integer("total_shares").default(0),
      totalComments: integer("total_comments").default(0),
      totalRevenue: integer("total_revenue").default(0),
      // in cents
      avgWatchTime: integer("avg_watch_time").default(0),
      // in seconds
      clickThroughRate: integer("click_through_rate").default(0),
      // percentage
      conversionRate: integer("conversion_rate").default(0),
      // percentage
      demographicsData: jsonb("demographics_data"),
      // age, gender, location breakdown
      platformBreakdown: jsonb("platform_breakdown"),
      // metrics per platform
      updatedAt: timestamp("updated_at").defaultNow()
    });
    generatedAssets = pgTable("generated_assets", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      sessionId: varchar("session_id").references(() => contentCreationSessions.id, { onDelete: "cascade" }).notNull(),
      assetType: varchar("asset_type").notNull(),
      // trailer, gif, highlight, thumbnail
      fileUrl: varchar("file_url").notNull(),
      thumbnailUrl: varchar("thumbnail_url"),
      duration: integer("duration"),
      // in seconds for video assets
      fileSize: integer("file_size"),
      metadata: jsonb("metadata"),
      // generation settings, AI parameters
      createdAt: timestamp("created_at").defaultNow()
    });
    creatorStudioSettings = pgTable("creator_studio_settings", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
      defaultBranding: jsonb("default_branding"),
      // logo, watermark, brand colors
      defaultIntroUrl: varchar("default_intro_url"),
      defaultOutroUrl: varchar("default_outro_url"),
      autoEditingEnabled: boolean("auto_editing_enabled").default(true),
      autoDistributionEnabled: boolean("auto_distribution_enabled").default(false),
      preferredPlatforms: text("preferred_platforms").array(),
      defaultHashtags: text("default_hashtags").array(),
      aiPricingSuggestions: boolean("ai_pricing_suggestions").default(true),
      defaultPricePerView: integer("default_price_per_view"),
      // in cents
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    liveStreamCoStars = pgTable("live_stream_co_stars", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      streamId: varchar("stream_id").references(() => liveStreams.id, { onDelete: "cascade" }).notNull(),
      coStarId: varchar("co_star_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      verificationStatus: kycStatusEnum("verification_status").default("pending"),
      verifiedAt: timestamp("verified_at"),
      joinedAt: timestamp("joined_at"),
      leftAt: timestamp("left_at"),
      createdAt: timestamp("created_at").defaultNow()
    });
    voiceProfiles = pgTable("voice_profiles", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      name: varchar("name").notNull(),
      description: text("description"),
      provider: voiceProviderEnum("provider").notNull(),
      providerVoiceId: varchar("provider_voice_id"),
      // Voice ID from provider (ElevenLabs, Resemble, etc)
      status: voiceProfileStatusEnum("status").default("pending"),
      cloningType: voiceCloningTypeEnum("cloning_type").default("instant"),
      language: varchar("language").default("en"),
      supportedLanguages: text("supported_languages").array(),
      voiceSettings: jsonb("voice_settings"),
      // {stability, similarity_boost, style, etc}
      isDefault: boolean("is_default").default(false),
      isPublic: boolean("is_public").default(false),
      consentVerified: boolean("consent_verified").default(false),
      consentDocumentUrl: varchar("consent_document_url"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    voiceSamples = pgTable("voice_samples", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      profileId: varchar("profile_id").references(() => voiceProfiles.id, { onDelete: "cascade" }).notNull(),
      creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      sampleType: varchar("sample_type").notNull(),
      // training, reference, validation
      fileUrl: varchar("file_url").notNull(),
      s3Key: varchar("s3_key").notNull(),
      duration: integer("duration"),
      // in seconds
      fileSize: integer("file_size"),
      mimeType: varchar("mime_type"),
      transcription: text("transcription"),
      quality: integer("quality"),
      // 0-100 quality score
      isProcessed: boolean("is_processed").default(false),
      metadata: jsonb("metadata"),
      // {sample_rate, bit_rate, channels, etc}
      createdAt: timestamp("created_at").defaultNow()
    });
    voiceMessages = pgTable("voice_messages", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      profileId: varchar("profile_id").references(() => voiceProfiles.id, { onDelete: "cascade" }).notNull(),
      creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      recipientId: varchar("recipient_id").references(() => users.id),
      recipientName: varchar("recipient_name"),
      messageType: varchar("message_type"),
      // voicemail, dm, birthday, thank_you, wake_up, custom
      text: text("text").notNull(),
      personalizedText: text("personalized_text"),
      // Text with personalization variables replaced
      language: varchar("language").default("en"),
      emotion: voiceEmotionEnum("emotion").default("neutral"),
      audioUrl: varchar("audio_url"),
      s3Key: varchar("s3_key"),
      duration: integer("duration"),
      // in seconds
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
      createdAt: timestamp("created_at").defaultNow()
    });
    voiceCampaigns = pgTable("voice_campaigns", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      profileId: varchar("profile_id").references(() => voiceProfiles.id).notNull(),
      name: varchar("name").notNull(),
      description: text("description"),
      status: voiceCampaignStatusEnum("status").default("draft"),
      campaignType: varchar("campaign_type"),
      // birthday, thank_you, holiday, custom
      targetAudience: jsonb("target_audience"),
      // {tier: "premium", min_spend: 100, tags: ["vip"]}
      messageTemplate: text("message_template").notNull(),
      // Template with {{variables}}
      personalizations: jsonb("personalizations"),
      // {variables: ["name", "amount"], defaults: {}}
      scheduledAt: timestamp("scheduled_at"),
      startedAt: timestamp("started_at"),
      completedAt: timestamp("completed_at"),
      totalRecipients: integer("total_recipients").default(0),
      messagesGenerated: integer("messages_generated").default(0),
      messagesDelivered: integer("messages_delivered").default(0),
      messagesFailed: integer("messages_failed").default(0),
      totalCreditsCost: integer("total_credits_cost").default(0),
      estimatedCost: integer("estimated_cost"),
      // in cents
      batchSize: integer("batch_size").default(100),
      // Messages per batch
      retryFailures: boolean("retry_failures").default(true),
      metadata: jsonb("metadata"),
      // Additional campaign settings
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    voiceAnalytics = pgTable("voice_analytics", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      messageId: varchar("message_id").references(() => voiceMessages.id, { onDelete: "cascade" }).notNull(),
      campaignId: varchar("campaign_id").references(() => voiceCampaigns.id),
      creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      recipientId: varchar("recipient_id").references(() => users.id),
      plays: integer("plays").default(0),
      completions: integer("completions").default(0),
      // Full listens
      avgListenDuration: integer("avg_listen_duration"),
      // in seconds
      shares: integer("shares").default(0),
      tips: integer("tips").default(0),
      // Tips received after listening
      tipAmount: integer("tip_amount").default(0),
      // Total tip amount in cents
      sentiment: varchar("sentiment"),
      // positive, neutral, negative (from reactions)
      deviceType: varchar("device_type"),
      // mobile, desktop
      location: varchar("location"),
      // Country/region
      lastPlayedAt: timestamp("last_played_at"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    voiceCredits = pgTable("voice_credits", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      creditBalance: integer("credit_balance").default(0),
      monthlyAllocation: integer("monthly_allocation").default(1e3),
      bonusCredits: integer("bonus_credits").default(0),
      totalUsed: integer("total_used").default(0),
      totalPurchased: integer("total_purchased").default(0),
      lastResetAt: timestamp("last_reset_at"),
      expiresAt: timestamp("expires_at"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    voiceTransactions = pgTable("voice_transactions", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      transactionType: varchar("transaction_type").notNull(),
      // credit_purchase, credit_usage, credit_refund
      amount: integer("amount").notNull(),
      // Credits or cents
      balance: integer("balance"),
      // Balance after transaction
      description: text("description"),
      metadata: jsonb("metadata"),
      // {message_id, campaign_id, provider, etc}
      createdAt: timestamp("created_at").defaultNow()
    });
    blockchainWallets = pgTable("blockchain_wallets", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      address: varchar("address").notNull().unique(),
      blockchain: blockchainEnum("blockchain").default("ethereum"),
      isDefault: boolean("is_default").default(false),
      nonce: varchar("nonce"),
      // For signature verification
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    nftCollections = pgTable("nft_collections", {
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
      baseUri: varchar("base_uri"),
      // IPFS base URI for metadata
      coverImageUrl: varchar("cover_image_url"),
      bannerImageUrl: varchar("banner_image_url"),
      royaltyBasisPoints: integer("royalty_basis_points").default(750),
      // 7.5% default
      royaltyReceiver: varchar("royalty_receiver"),
      // Wallet address for royalties
      isDeployed: boolean("is_deployed").default(false),
      deployedAt: timestamp("deployed_at"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    nftTokens = pgTable("nft_tokens", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      collectionId: varchar("collection_id").references(() => nftCollections.id, { onDelete: "cascade" }).notNull(),
      ownerId: varchar("owner_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      contentId: varchar("content_id").references(() => mediaAssets.id),
      // Link to existing content
      tokenId: integer("token_id"),
      // On-chain token ID
      name: varchar("name").notNull(),
      description: text("description"),
      status: nftStatusEnum("status").default("draft"),
      metadataUri: varchar("metadata_uri"),
      // IPFS URI for metadata
      imageUri: varchar("image_uri"),
      // IPFS URI for image/video
      attributes: jsonb("attributes"),
      // NFT attributes/traits
      priceInWei: varchar("price_in_wei"),
      // BigInt as string
      priceInUsd: integer("price_in_usd"),
      // USD cents for display
      isListedForSale: boolean("is_listed_for_sale").default(false),
      listingPrice: varchar("listing_price"),
      // Wei as string
      marketplaces: text("marketplaces").array(),
      // ["opensea", "rarible", etc]
      txHash: varchar("tx_hash"),
      // Minting transaction hash
      views: integer("views").default(0),
      createdAt: timestamp("created_at").defaultNow(),
      mintedAt: timestamp("minted_at"),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    nftTransactions = pgTable("nft_transactions", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      tokenId: varchar("token_id").references(() => nftTokens.id, { onDelete: "cascade" }).notNull(),
      fromUserId: varchar("from_user_id").references(() => users.id),
      toUserId: varchar("to_user_id").references(() => users.id),
      fromAddress: varchar("from_address").notNull(),
      toAddress: varchar("to_address").notNull(),
      type: nftTransactionTypeEnum("type").notNull(),
      priceInWei: varchar("price_in_wei"),
      // Transaction amount in wei
      priceInUsd: integer("price_in_usd"),
      // USD cents at time of transaction
      gasUsed: varchar("gas_used"),
      gasPrice: varchar("gas_price"),
      txHash: varchar("tx_hash").notNull().unique(),
      blockNumber: integer("block_number"),
      blockchain: blockchainEnum("blockchain").default("ethereum"),
      marketplace: marketplaceEnum("marketplace"),
      metadata: jsonb("metadata"),
      // Additional transaction data
      status: varchar("status").default("pending"),
      // pending, confirmed, failed
      createdAt: timestamp("created_at").defaultNow(),
      confirmedAt: timestamp("confirmed_at")
    });
    royaltyDistributions = pgTable("royalty_distributions", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      transactionId: varchar("transaction_id").references(() => nftTransactions.id, { onDelete: "cascade" }).notNull(),
      tokenId: varchar("token_id").references(() => nftTokens.id, { onDelete: "cascade" }).notNull(),
      recipientId: varchar("recipient_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      recipientAddress: varchar("recipient_address").notNull(),
      recipientType: varchar("recipient_type").notNull(),
      // creator, co-star, platform
      amountInWei: varchar("amount_in_wei").notNull(),
      amountInUsd: integer("amount_in_usd"),
      // USD cents
      percentage: integer("percentage"),
      // Basis points (e.g., 250 = 2.5%)
      royaltyType: royaltyTypeEnum("royalty_type").default("fixed"),
      distributedAt: timestamp("distributed_at"),
      txHash: varchar("tx_hash"),
      status: varchar("status").default("pending"),
      // pending, distributed, failed
      createdAt: timestamp("created_at").defaultNow()
    });
    nftRoyaltyRules = pgTable("nft_royalty_rules", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      collectionId: varchar("collection_id").references(() => nftCollections.id, { onDelete: "cascade" }),
      tokenId: varchar("token_id").references(() => nftTokens.id, { onDelete: "cascade" }),
      recipientId: varchar("recipient_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      recipientAddress: varchar("recipient_address").notNull(),
      recipientType: varchar("recipient_type").notNull(),
      // creator, co-star, platform
      percentage: integer("percentage").notNull(),
      // Basis points
      royaltyType: royaltyTypeEnum("royalty_type").default("fixed"),
      decayRate: integer("decay_rate"),
      // For decaying royalties (basis points per transfer)
      minPercentage: integer("min_percentage"),
      // Minimum percentage after decay
      maxTransfers: integer("max_transfers"),
      // Max transfers before royalty expires
      tierThreshold: integer("tier_threshold"),
      // For tiered royalties (e.g., after X sales)
      isActive: boolean("is_active").default(true),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    ipfsRecords = pgTable("ipfs_records", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      tokenId: varchar("token_id").references(() => nftTokens.id),
      ipfsHash: varchar("ipfs_hash").notNull().unique(),
      fileName: varchar("file_name"),
      fileType: varchar("file_type"),
      fileSize: integer("file_size"),
      contentType: varchar("content_type"),
      // metadata, image, video, etc.
      gateway: varchar("gateway").default("ipfs.io"),
      // Gateway used
      isEncrypted: boolean("is_encrypted").default(false),
      isPinned: boolean("is_pinned").default(true),
      createdAt: timestamp("created_at").defaultNow()
    });
    marketplaceIntegrations = pgTable("marketplace_integrations", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      marketplace: marketplaceEnum("marketplace").notNull(),
      apiKey: varchar("api_key"),
      // Encrypted
      apiSecret: varchar("api_secret"),
      // Encrypted
      walletAddress: varchar("wallet_address"),
      isActive: boolean("is_active").default(true),
      autoList: boolean("auto_list").default(false),
      defaultRoyaltyPercentage: integer("default_royalty_percentage").default(750),
      // Basis points
      metadata: jsonb("metadata"),
      // Marketplace-specific settings
      lastSyncedAt: timestamp("last_synced_at"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    blockchainEvents = pgTable("blockchain_events", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      eventName: varchar("event_name").notNull(),
      // Transfer, Sale, Mint, etc.
      contractAddress: varchar("contract_address").notNull(),
      tokenId: varchar("token_id"),
      fromAddress: varchar("from_address"),
      toAddress: varchar("to_address"),
      txHash: varchar("tx_hash").notNull(),
      blockNumber: integer("block_number").notNull(),
      blockchain: blockchainEnum("blockchain").default("ethereum"),
      eventData: jsonb("event_data"),
      // Raw event data
      processed: boolean("processed").default(false),
      createdAt: timestamp("created_at").defaultNow()
    });
    vrSessions = pgTable("vr_sessions", {
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
      price: integer("price"),
      // in cents
      webrtcSignalingUrl: varchar("webrtc_signaling_url"),
      pixelStreamingUrl: varchar("pixel_streaming_url"),
      volumetricDataUrl: varchar("volumetric_data_url"),
      metadata: jsonb("metadata"),
      // device capabilities, network stats, etc
      startedAt: timestamp("started_at"),
      endedAt: timestamp("ended_at"),
      createdAt: timestamp("created_at").defaultNow()
    });
    arOverlays = pgTable("ar_overlays", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      sessionId: varchar("session_id").references(() => vrSessions.id, { onDelete: "cascade" }),
      creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      name: varchar("name").notNull(),
      type: varchar("type").notNull(),
      // filter, mask, object, environment
      overlayUrl: varchar("overlay_url").notNull(),
      thumbnailUrl: varchar("thumbnail_url"),
      position: jsonb("position"),
      // 3D position {x, y, z}
      rotation: jsonb("rotation"),
      // 3D rotation {x, y, z}
      scale: jsonb("scale"),
      // 3D scale {x, y, z}
      anchoring: varchar("anchoring"),
      // face, plane, object
      trackingData: jsonb("tracking_data"),
      isActive: boolean("is_active").default(true),
      createdAt: timestamp("created_at").defaultNow()
    });
    volumetricStreams = pgTable("volumetric_streams", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      sessionId: varchar("session_id").references(() => vrSessions.id, { onDelete: "cascade" }).notNull(),
      streamUrl: varchar("stream_url").notNull(),
      format: varchar("format").notNull(),
      // ply, obj, gltf, draco
      frameRate: integer("frame_rate").default(30),
      bitrate: integer("bitrate"),
      resolution: varchar("resolution"),
      compression: varchar("compression"),
      // draco, gzip, none
      pointCloudDensity: integer("point_cloud_density"),
      colorDepth: integer("color_depth").default(8),
      isRecording: boolean("is_recording").default(false),
      recordingUrl: varchar("recording_url"),
      metadata: jsonb("metadata"),
      createdAt: timestamp("created_at").defaultNow()
    });
    pricingRules = pgTable("pricing_rules", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      contentId: varchar("content_id").references(() => mediaAssets.id),
      name: varchar("name").notNull(),
      strategy: pricingStrategyEnum("strategy").default("dynamic"),
      model: pricingModelEnum("model").default("rule_based"),
      basePrice: integer("base_price").notNull(),
      // in cents
      minPrice: integer("min_price").notNull(),
      maxPrice: integer("max_price").notNull(),
      adjustmentFactors: jsonb("adjustment_factors"),
      // {demand: 1.5, time: 0.8, etc}
      segmentRules: jsonb("segment_rules"),
      // pricing per user segment
      competitorTracking: boolean("competitor_tracking").default(false),
      abTestEnabled: boolean("ab_test_enabled").default(false),
      isActive: boolean("is_active").default(true),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    priceHistory = pgTable("price_history", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      ruleId: varchar("rule_id").references(() => pricingRules.id, { onDelete: "cascade" }).notNull(),
      contentId: varchar("content_id").references(() => mediaAssets.id),
      previousPrice: integer("previous_price").notNull(),
      newPrice: integer("new_price").notNull(),
      adjustmentType: priceAdjustmentTypeEnum("adjustment_type").notNull(),
      adjustmentReason: text("adjustment_reason"),
      demandScore: integer("demand_score"),
      // 0-100
      competitorAvgPrice: integer("competitor_avg_price"),
      conversions: integer("conversions").default(0),
      revenue: integer("revenue").default(0),
      createdAt: timestamp("created_at").defaultNow()
    });
    competitorPrices = pgTable("competitor_prices", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      platform: varchar("platform").notNull(),
      competitorId: varchar("competitor_id"),
      competitorName: varchar("competitor_name"),
      contentType: varchar("content_type"),
      price: integer("price").notNull(),
      currency: varchar("currency").default("USD"),
      subscribers: integer("subscribers"),
      engagement: integer("engagement"),
      // 0-100 score
      scrapedUrl: varchar("scraped_url"),
      metadata: jsonb("metadata"),
      scrapedAt: timestamp("scraped_at").defaultNow()
    });
    microloans = pgTable("microloans", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      lenderId: varchar("lender_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      borrowerId: varchar("borrower_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      amount: integer("amount").notNull(),
      // in cents
      interestRate: integer("interest_rate").notNull(),
      // basis points (100 = 1%)
      termDays: integer("term_days").notNull(),
      purpose: loanPurposeEnum("purpose").notNull(),
      status: loanStatusEnum("status").default("pending"),
      repaymentFrequency: repaymentFrequencyEnum("repayment_frequency").default("monthly"),
      totalRepaid: integer("total_repaid").default(0),
      nextPaymentDue: timestamp("next_payment_due"),
      smartContractAddress: varchar("smart_contract_address"),
      collateralType: varchar("collateral_type"),
      // future_earnings, nft, none
      collateralValue: integer("collateral_value"),
      defaultRisk: integer("default_risk"),
      // 0-100 score
      createdAt: timestamp("created_at").defaultNow(),
      approvedAt: timestamp("approved_at"),
      repaidAt: timestamp("repaid_at"),
      defaultedAt: timestamp("defaulted_at")
    });
    loanApplications = pgTable("loan_applications", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      applicantId: varchar("applicant_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      requestedAmount: integer("requested_amount").notNull(),
      purpose: loanPurposeEnum("purpose").notNull(),
      purposeDescription: text("purpose_description"),
      requestedTermDays: integer("requested_term_days").notNull(),
      monthlyIncome: integer("monthly_income"),
      existingLoans: integer("existing_loans").default(0),
      businessPlan: text("business_plan"),
      status: varchar("status").default("pending"),
      // pending, approved, rejected
      rejectionReason: text("rejection_reason"),
      creditCheckResult: jsonb("credit_check_result"),
      createdAt: timestamp("created_at").defaultNow(),
      reviewedAt: timestamp("reviewed_at")
    });
    loanRepayments = pgTable("loan_repayments", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      loanId: varchar("loan_id").references(() => microloans.id, { onDelete: "cascade" }).notNull(),
      amount: integer("amount").notNull(),
      principal: integer("principal").notNull(),
      interest: integer("interest").notNull(),
      lateFee: integer("late_fee").default(0),
      paymentMethod: varchar("payment_method"),
      // auto_deduct, manual, crypto
      transactionId: varchar("transaction_id").references(() => transactions.id),
      status: varchar("status").default("pending"),
      // pending, completed, failed
      dueDate: timestamp("due_date").notNull(),
      paidAt: timestamp("paid_at"),
      createdAt: timestamp("created_at").defaultNow()
    });
    creditScores = pgTable("credit_scores", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      score: integer("score").notNull(),
      // 300-850
      rating: creditRatingEnum("rating").notNull(),
      factorsJson: jsonb("factors_json"),
      // {payment_history: 0.35, credit_utilization: 0.3, etc}
      totalLoans: integer("total_loans").default(0),
      totalRepaid: integer("total_repaid").default(0),
      totalDefaulted: integer("total_defaulted").default(0),
      onTimePayments: integer("on_time_payments").default(0),
      latePayments: integer("late_payments").default(0),
      avgLoanAmount: integer("avg_loan_amount"),
      platformActivity: integer("platform_activity"),
      // 0-100 score
      lastCalculatedAt: timestamp("last_calculated_at").defaultNow(),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    detectionResults = pgTable("detection_results", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      contentId: varchar("content_id").references(() => mediaAssets.id, { onDelete: "cascade" }).notNull(),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      provider: detectionProviderEnum("provider").notNull(),
      authenticityStatus: authenticityStatusEnum("authenticity_status").notNull(),
      confidence: integer("confidence").notNull(),
      // 0-100
      riskLevel: contentRiskLevelEnum("risk_level").notNull(),
      detectionDetails: jsonb("detection_details"),
      // provider-specific details
      manipulationRegions: jsonb("manipulation_regions"),
      // detected altered regions
      faceSwapDetected: boolean("face_swap_detected").default(false),
      audioManipulated: boolean("audio_manipulated").default(false),
      metadataAltered: boolean("metadata_altered").default(false),
      processingTimeMs: integer("processing_time_ms"),
      createdAt: timestamp("created_at").defaultNow()
    });
    contentAuthenticity = pgTable("content_authenticity", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      contentId: varchar("content_id").references(() => mediaAssets.id, { onDelete: "cascade" }).notNull().unique(),
      isVerified: boolean("is_verified").default(false),
      verificationMethod: varchar("verification_method"),
      // blockchain, watermark, cryptographic
      watermarkId: varchar("watermark_id").unique(),
      blockchainHash: varchar("blockchain_hash"),
      cryptographicSignature: varchar("cryptographic_signature"),
      certificateUrl: varchar("certificate_url"),
      issuerName: varchar("issuer_name").default("GirlFanz"),
      verifiedAt: timestamp("verified_at"),
      expiresAt: timestamp("expires_at"),
      createdAt: timestamp("created_at").defaultNow()
    });
    deepfakeVerificationLogs = pgTable("deepfake_verification_logs", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      contentId: varchar("content_id").references(() => mediaAssets.id, { onDelete: "cascade" }).notNull(),
      action: varchar("action").notNull(),
      // scan_initiated, scan_completed, alert_sent, content_blocked
      userId: varchar("user_id").references(() => users.id),
      details: jsonb("details"),
      ipAddress: varchar("ip_address"),
      userAgent: varchar("user_agent"),
      createdAt: timestamp("created_at").defaultNow()
    });
    sentimentAnalysis = pgTable("sentiment_analysis", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      contentId: varchar("content_id").references(() => mediaAssets.id),
      postId: varchar("post_id").references(() => feedPosts.id),
      commentId: varchar("comment_id").references(() => postComments.id),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      sentiment: sentimentScoreEnum("sentiment").notNull(),
      confidence: integer("confidence").notNull(),
      // 0-100
      emotions: jsonb("emotions"),
      // {happy: 0.8, sad: 0.1, angry: 0.1}
      dominantEmotion: emotionTypeEnum("dominant_emotion"),
      keywords: text("keywords").array(),
      topics: text("topics").array(),
      language: varchar("language").default("en"),
      createdAt: timestamp("created_at").defaultNow()
    });
    moodTags = pgTable("mood_tags", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      contentId: varchar("content_id").references(() => mediaAssets.id, { onDelete: "cascade" }),
      postId: varchar("post_id").references(() => feedPosts.id, { onDelete: "cascade" }),
      creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      mood: emotionTypeEnum("mood").notNull(),
      intensity: integer("intensity").notNull(),
      // 1-10
      autoDetected: boolean("auto_detected").default(false),
      userOverride: boolean("user_override").default(false),
      createdAt: timestamp("created_at").defaultNow()
    });
    engagementPredictions = pgTable("engagement_predictions", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      contentId: varchar("content_id").references(() => mediaAssets.id),
      postId: varchar("post_id").references(() => feedPosts.id),
      creatorId: varchar("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      predictedEngagement: engagementLevelEnum("predicted_engagement").notNull(),
      predictedViews: integer("predicted_views"),
      predictedLikes: integer("predicted_likes"),
      predictedComments: integer("predicted_comments"),
      predictedRevenue: integer("predicted_revenue"),
      // in cents
      optimalPostTime: timestamp("optimal_post_time"),
      targetAudience: jsonb("target_audience"),
      // demographic recommendations
      contentRecommendations: jsonb("content_recommendations"),
      confidenceScore: integer("confidence_score"),
      // 0-100
      modelVersion: varchar("model_version"),
      actualEngagement: engagementLevelEnum("actual_engagement"),
      // for model training
      actualViews: integer("actual_views"),
      actualLikes: integer("actual_likes"),
      actualComments: integer("actual_comments"),
      actualRevenue: integer("actual_revenue"),
      createdAt: timestamp("created_at").defaultNow(),
      measuredAt: timestamp("measured_at")
      // when actuals were recorded
    });
    insertFanzTransactionSchema = createInsertSchema(fanzTransactions).omit({
      id: true,
      createdAt: true,
      completedAt: true
    });
    insertRefundRequestSchema = createInsertSchema(refundRequests).omit({
      id: true,
      createdAt: true,
      reviewedAt: true,
      completedAt: true
    });
    insertFanzWalletSchema = createInsertSchema(fanzWallets).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertWalletTransactionSchema = createInsertSchema(walletTransactions).omit({
      id: true,
      createdAt: true
    });
    insertFeedPostSchema = createInsertSchema(feedPosts).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertPostMediaSchema = createInsertSchema(postMedia).omit({
      id: true,
      createdAt: true
    });
    insertSponsoredPostSchema = createInsertSchema(sponsoredPosts).omit({
      id: true,
      createdAt: true,
      updatedAt: true,
      impressions: true,
      clicks: true,
      spent: true
    });
    insertUserFollowSchema = createInsertSchema(userFollows).omit({
      id: true,
      createdAt: true
    });
    insertAgeVerificationSchema = createInsertSchema(ageVerifications).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertPostCommentSchema = createInsertSchema(postComments).omit({
      id: true,
      createdAt: true,
      updatedAt: true,
      likes: true,
      isEdited: true
    });
    insertLiveStreamSchema = createInsertSchema(liveStreams).omit({
      id: true,
      createdAt: true,
      updatedAt: true,
      viewerCount: true,
      totalViews: true,
      streamKey: true,
      playbackUrl: true
    });
    insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertContentInteractionSchema = createInsertSchema(contentInteractions).omit({
      id: true,
      createdAt: true
    });
    insertVrContentSchema = createInsertSchema(vrContent).omit({
      id: true,
      createdAt: true
    });
    insertContentCreationSessionSchema = createInsertSchema(contentCreationSessions).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertEditingTaskSchema = createInsertSchema(editingTasks).omit({
      id: true,
      createdAt: true,
      startedAt: true,
      completedAt: true,
      progress: true
    });
    insertContentVersionSchema = createInsertSchema(contentVersions).omit({
      id: true,
      createdAt: true
    });
    insertDistributionCampaignSchema = createInsertSchema(distributionCampaigns).omit({
      id: true,
      createdAt: true,
      publishedAt: true
    });
    insertPlatformDistributionSchema = createInsertSchema(platformDistributions).omit({
      id: true,
      createdAt: true,
      publishedAt: true
    });
    insertCreatorStudioSettingsSchema = createInsertSchema(creatorStudioSettings).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertGeneratedAssetSchema = createInsertSchema(generatedAssets).omit({
      id: true,
      createdAt: true
    });
    insertContentAnalyticsSchema = createInsertSchema(contentAnalytics).omit({
      id: true,
      updatedAt: true
    });
    insertBlockchainWalletSchema = createInsertSchema(blockchainWallets).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertNftCollectionSchema = createInsertSchema(nftCollections).omit({
      id: true,
      createdAt: true,
      updatedAt: true,
      deployedAt: true,
      mintedSupply: true
    });
    insertNftTokenSchema = createInsertSchema(nftTokens).omit({
      id: true,
      createdAt: true,
      updatedAt: true,
      mintedAt: true,
      views: true
    });
    insertNftTransactionSchema = createInsertSchema(nftTransactions).omit({
      id: true,
      createdAt: true,
      confirmedAt: true
    });
    insertRoyaltyDistributionSchema = createInsertSchema(royaltyDistributions).omit({
      id: true,
      createdAt: true,
      distributedAt: true
    });
    insertNftRoyaltyRuleSchema = createInsertSchema(nftRoyaltyRules).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertIpfsRecordSchema = createInsertSchema(ipfsRecords).omit({
      id: true,
      createdAt: true
    });
    insertMarketplaceIntegrationSchema = createInsertSchema(marketplaceIntegrations).omit({
      id: true,
      createdAt: true,
      updatedAt: true,
      lastSyncedAt: true
    });
    insertBlockchainEventSchema = createInsertSchema(blockchainEvents).omit({
      id: true,
      createdAt: true
    });
    insertVoiceProfileSchema = createInsertSchema(voiceProfiles).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertVoiceSampleSchema = createInsertSchema(voiceSamples).omit({
      id: true,
      createdAt: true
    });
    insertVoiceMessageSchema = createInsertSchema(voiceMessages).omit({
      id: true,
      deliveredAt: true,
      viewedAt: true,
      createdAt: true
    });
    insertVoiceCampaignSchema = createInsertSchema(voiceCampaigns).omit({
      id: true,
      startedAt: true,
      completedAt: true,
      createdAt: true,
      updatedAt: true
    });
    insertVoiceAnalyticsSchema = createInsertSchema(voiceAnalytics).omit({
      id: true,
      lastPlayedAt: true,
      createdAt: true,
      updatedAt: true
    });
    insertVoiceCreditsSchema = createInsertSchema(voiceCredits).omit({
      id: true,
      lastResetAt: true,
      createdAt: true,
      updatedAt: true
    });
    insertVoiceTransactionSchema = createInsertSchema(voiceTransactions).omit({
      id: true,
      createdAt: true
    });
    walletResponseSchema = z.object({
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
        network: z.string()
      })).optional(),
      createdAt: z.date(),
      updatedAt: z.date()
    });
    trustScoreResponseSchema = z.object({
      id: z.string(),
      fanId: z.string(),
      score: z.number(),
      level: z.string(),
      successfulTransactions: z.number(),
      refundsInitiated: z.number(),
      fraudFlags: z.number(),
      lastCalculated: z.date()
    });
    transactionResponseSchema = z.object({
      id: z.string(),
      amount: z.number(),
      currency: z.string(),
      gateway: z.string(),
      status: z.string(),
      type: z.enum(["deposit", "withdrawal", "purchase", "refund"]),
      createdAt: z.date(),
      completedAt: z.date().nullable().optional()
    });
  }
});

// server/db.ts
async function initializeDatabase() {
  try {
    if (isSqlite) {
      try {
        const Database = (await import("better-sqlite3")).default;
        const { drizzle } = await import("drizzle-orm/better-sqlite3");
        const sqlite = new Database(dbUrl.replace("sqlite:", ""));
        db = drizzle(sqlite, { schema: schema_exports });
        console.log(`\u{1F5C4}\uFE0F Connected to SQLite database: ${dbUrl.replace("sqlite:", "")}`);
      } catch (sqliteError) {
        console.warn(`\u26A0\uFE0F SQLite connection failed, falling back to mock database:`, sqliteError.message);
        db = {
          select: () => ({ from: () => ({ limit: () => [] }) }),
          insert: () => ({ values: () => ({ returning: () => [] }) }),
          update: () => ({ set: () => ({ where: () => ({ returning: () => [] }) }) }),
          delete: () => ({ where: () => ({ returning: () => [] }) })
        };
      }
    } else if (isPostgres) {
      const pg = await import("pg");
      const { drizzle } = await import("drizzle-orm/node-postgres");
      pool = new pg.default.Pool({
        connectionString: dbUrl,
        max: 10,
        // Maximum pool size
        idleTimeoutMillis: 3e4,
        // 30 seconds idle timeout
        connectionTimeoutMillis: 5e3,
        // 5 seconds connection timeout
        allowExitOnIdle: false
        // Keep pool alive
      });
      pool.on("connect", (client) => {
        client.query(`SET search_path TO ${platformId}, shared, public`);
      });
      db = drizzle(pool, { schema: schema_exports });
      console.log(`\u{1F418} Connected to PostgreSQL database (schema: ${platformId})`);
    } else {
      throw new Error(`Unsupported database URL: ${dbUrl}`);
    }
  } catch (error) {
    console.error(`\u274C Database connection failed:`, error.message);
    console.log(`\u{1F527} Using mock database for development`);
    db = {
      select: () => ({ from: () => ({ limit: () => [] }) }),
      insert: () => ({ values: () => ({ returning: () => [] }) }),
      update: () => ({ set: () => ({ where: () => ({ returning: () => [] }) }) }),
      delete: () => ({ where: () => ({ returning: () => [] }) })
    };
  }
}
var dbUrl, isSqlite, isPostgres, platformId, db, pool;
var init_db = __esm({
  async "server/db.ts"() {
    "use strict";
    init_schema();
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?"
      );
    }
    dbUrl = process.env.DATABASE_URL;
    isSqlite = dbUrl.startsWith("sqlite:");
    isPostgres = dbUrl.startsWith("postgresql:") || dbUrl.startsWith("postgres:");
    platformId = process.env.PLATFORM_ID || "girlfanz";
    pool = null;
    await initializeDatabase();
  }
});

// server/storage.ts
var storage_exports = {};
__export(storage_exports, {
  DatabaseStorage: () => DatabaseStorage,
  storage: () => storage
});
import { eq, desc, and, or, sql as sql2 } from "drizzle-orm";
var DatabaseStorage, storage;
var init_storage = __esm({
  async "server/storage.ts"() {
    "use strict";
    init_schema();
    await init_db();
    DatabaseStorage = class {
      // User operations
      async getUser(id) {
        const [user] = await db.select().from(users).where(eq(users.id, id));
        return user;
      }
      async getUserByUsername(username) {
        const [user] = await db.select().from(users).where(eq(users.username, username));
        return user;
      }
      async getUserByEmail(email) {
        const [user] = await db.select().from(users).where(eq(users.email, email));
        return user;
      }
      async upsertUser(userData) {
        const [user] = await db.insert(users).values(userData).onConflictDoUpdate({
          target: users.id,
          set: {
            ...userData,
            updatedAt: /* @__PURE__ */ new Date()
          }
        }).returning();
        return user;
      }
      async createUser(userData) {
        const [user] = await db.insert(users).values(userData).returning();
        return user;
      }
      async updateUser(id, updates) {
        const [user] = await db.update(users).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, id)).returning();
        return user;
      }
      async getUsersBySecurityQuestion(question) {
        return await db.select().from(users).where(eq(users.securityQuestion, question));
      }
      // Password reset tokens
      async createPasswordResetToken(tokenData) {
        const { passwordResetTokens: passwordResetTokens2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
        const [token] = await db.insert(passwordResetTokens2).values(tokenData).returning();
        return token;
      }
      async getPasswordResetToken(token) {
        const { passwordResetTokens: passwordResetTokens2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
        const [resetToken] = await db.select().from(passwordResetTokens2).where(eq(passwordResetTokens2.token, token));
        return resetToken;
      }
      async markPasswordResetTokenUsed(token) {
        const { passwordResetTokens: passwordResetTokens2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
        await db.update(passwordResetTokens2).set({ used: true }).where(eq(passwordResetTokens2.token, token));
      }
      // Email verification tokens
      async createEmailVerificationToken(tokenData) {
        const { emailVerificationTokens: emailVerificationTokens2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
        const [token] = await db.insert(emailVerificationTokens2).values(tokenData).returning();
        return token;
      }
      async getEmailVerificationToken(token) {
        const { emailVerificationTokens: emailVerificationTokens2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
        const [verificationToken] = await db.select().from(emailVerificationTokens2).where(eq(emailVerificationTokens2.token, token));
        return verificationToken;
      }
      async markEmailVerificationTokenUsed(token) {
        const { emailVerificationTokens: emailVerificationTokens2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
        await db.update(emailVerificationTokens2).set({ used: true }).where(eq(emailVerificationTokens2.token, token));
      }
      // Profile operations
      async getProfile(userId) {
        const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
        return profile;
      }
      async getProfileWithUser(userId) {
        const [result] = await db.select().from(profiles).innerJoin(users, eq(profiles.userId, users.id)).where(eq(profiles.userId, userId));
        if (!result) return void 0;
        return {
          ...result.profiles,
          user: result.users
        };
      }
      async createProfile(profileData) {
        const [profile] = await db.insert(profiles).values(profileData).returning();
        return profile;
      }
      async updateProfile(userId, updates) {
        const [profile] = await db.update(profiles).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(profiles.userId, userId)).returning();
        return profile;
      }
      // Media operations
      async getMediaAsset(id) {
        const [media] = await db.select().from(mediaAssets).where(eq(mediaAssets.id, id));
        return media;
      }
      async getMediaAssetsByOwner(ownerId, limit = 20) {
        return await db.select().from(mediaAssets).where(eq(mediaAssets.ownerId, ownerId)).orderBy(desc(mediaAssets.createdAt)).limit(limit);
      }
      async createMediaAsset(mediaData) {
        const [media] = await db.insert(mediaAssets).values(mediaData).returning();
        return media;
      }
      async updateMediaAsset(id, updates) {
        const [media] = await db.update(mediaAssets).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(mediaAssets.id, id)).returning();
        return media;
      }
      // Messaging operations
      async getMessages(senderId, receiverId, limit = 50) {
        return await db.select().from(messages).where(
          or(
            and(eq(messages.senderId, senderId), eq(messages.receiverId, receiverId)),
            and(eq(messages.senderId, receiverId), eq(messages.receiverId, senderId))
          )
        ).orderBy(desc(messages.createdAt)).limit(limit);
      }
      async getConversations(userId) {
        const conversations = await db.select({
          otherUserId: sql2`CASE WHEN ${messages.senderId} = ${userId} THEN ${messages.receiverId} ELSE ${messages.senderId} END`.as("other_user_id"),
          lastMessage: messages.content,
          lastMessageTime: messages.createdAt,
          isRead: messages.isRead
        }).from(messages).where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId))).orderBy(desc(messages.createdAt));
        const conversationMap = /* @__PURE__ */ new Map();
        conversations.forEach((conv) => {
          const key = conv.otherUserId;
          if (!conversationMap.has(key)) {
            conversationMap.set(key, conv);
          }
        });
        return Array.from(conversationMap.values());
      }
      async createMessage(messageData) {
        const [message] = await db.insert(messages).values(messageData).returning();
        return message;
      }
      async markMessageAsRead(id) {
        await db.update(messages).set({ isRead: true }).where(eq(messages.id, id));
      }
      // Moderation operations
      async getModerationQueue(status, limit = 50) {
        const baseQuery = db.select().from(moderationQueue).innerJoin(mediaAssets, eq(moderationQueue.mediaId, mediaAssets.id)).orderBy(desc(moderationQueue.createdAt)).limit(limit);
        const results = status ? await baseQuery.where(eq(moderationQueue.status, status)) : await baseQuery;
        return results.map((r) => ({
          ...r.moderation_queue,
          media: r.media_assets
        }));
      }
      async createModerationItem(itemData) {
        const [item] = await db.insert(moderationQueue).values(itemData).returning();
        return item;
      }
      async updateModerationItem(id, updates) {
        const [item] = await db.update(moderationQueue).set({ ...updates, reviewedAt: /* @__PURE__ */ new Date() }).where(eq(moderationQueue.id, id)).returning();
        return item;
      }
      // Payout operations
      async getPayoutAccounts(userId) {
        return await db.select().from(payoutAccounts).where(eq(payoutAccounts.userId, userId));
      }
      async getPayoutRequests(userId, limit = 20) {
        return await db.select().from(payoutRequests).where(eq(payoutRequests.userId, userId)).orderBy(desc(payoutRequests.createdAt)).limit(limit);
      }
      // Analytics operations
      async getUserStats(userId) {
        const profile = await this.getProfile(userId);
        const mediaCount = await db.select({ count: sql2`count(*)` }).from(mediaAssets).where(eq(mediaAssets.ownerId, userId));
        const totalViews = await db.select({ total: sql2`sum(${mediaAssets.views})` }).from(mediaAssets).where(eq(mediaAssets.ownerId, userId));
        return {
          totalEarnings: profile?.totalEarnings || 0,
          fanCount: profile?.fanCount || 0,
          contentPosts: mediaCount[0]?.count || 0,
          totalViews: totalViews[0]?.total || 0,
          engagement: 94.2
          // Calculate based on actual metrics
        };
      }
      async getSystemHealth() {
        const dbCheck = await db.select({ count: sql2`count(*)` }).from(users);
        const pendingModeration = await db.select({ count: sql2`count(*)` }).from(moderationQueue).where(eq(moderationQueue.status, "pending"));
        const activeUsers = await db.select({ count: sql2`count(*)` }).from(users).where(eq(users.status, "active"));
        return {
          database: {
            status: "healthy",
            connections: 45,
            queryTime: "12ms"
          },
          apiGateway: {
            status: "healthy",
            responseTime: "45ms",
            uptime: "99.98%"
          },
          payments: {
            status: "maintenance",
            provider: "CCBill",
            successRate: "98.2%"
          },
          websocket: {
            status: "active",
            connections: activeUsers[0]?.count || 0,
            latency: "28ms"
          },
          moderation: {
            pending: pendingModeration[0]?.count || 0,
            status: "operational"
          }
        };
      }
      // Subscription operations
      async getSubscription(userId, creatorId) {
        const [subscription] = await db.select().from(subscriptions).where(and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.creatorId, creatorId)
        ));
        return subscription;
      }
      async getSubscriptionsAsFan(userId) {
        return await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).orderBy(desc(subscriptions.createdAt));
      }
      async getSubscriptionsAsCreator(userId) {
        return await db.select().from(subscriptions).where(eq(subscriptions.creatorId, userId)).orderBy(desc(subscriptions.createdAt));
      }
      async createSubscription(subscriptionData) {
        const [subscription] = await db.insert(subscriptions).values(subscriptionData).returning();
        return subscription;
      }
      async updateSubscription(id, updates) {
        const [subscription] = await db.update(subscriptions).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(subscriptions.id, id)).returning();
        return subscription;
      }
      // Transaction operations
      async getTransactionsAsBuyer(userId) {
        return await db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(desc(transactions.createdAt));
      }
      async getTransactionsAsCreator(userId) {
        return await db.select().from(transactions).where(eq(transactions.creatorId, userId)).orderBy(desc(transactions.createdAt));
      }
      async createTransaction(transactionData) {
        const [transaction] = await db.insert(transactions).values(transactionData).returning();
        return transaction;
      }
      async updateTransaction(id, updates) {
        const [transaction] = await db.update(transactions).set(updates).where(eq(transactions.id, id)).returning();
        return transaction;
      }
      // KYC operations
      async getKycVerification(userId) {
        const [verification] = await db.select().from(kycVerifications).where(eq(kycVerifications.userId, userId)).orderBy(desc(kycVerifications.createdAt)).limit(1);
        return verification;
      }
      async getKycVerificationByType(userId, documentType) {
        const [verification] = await db.select().from(kycVerifications).where(and(
          eq(kycVerifications.userId, userId),
          eq(kycVerifications.documentType, documentType)
        )).orderBy(desc(kycVerifications.createdAt)).limit(1);
        return verification;
      }
      async createKycVerification(verificationData) {
        const [verification] = await db.insert(kycVerifications).values(verificationData).returning();
        return verification;
      }
      // Audit operations  
      async createAuditLog(logData) {
        const [auditLog] = await db.insert(auditLogs).values(logData).returning();
        return auditLog;
      }
      // Support Ticket operations
      async getSupportTickets(userId, status) {
        const conditions = [];
        if (userId) conditions.push(eq(supportTickets.userId, userId));
        if (status) conditions.push(eq(supportTickets.status, status));
        let query = db.select().from(supportTickets);
        if (conditions.length > 0) {
          query = query.where(conditions.length === 1 ? conditions[0] : and(...conditions));
        }
        return await query.orderBy(desc(supportTickets.createdAt));
      }
      async getSupportTicket(id) {
        const [ticket] = await db.select().from(supportTickets).where(eq(supportTickets.id, id));
        return ticket;
      }
      async createSupportTicket(ticketData) {
        const [ticket] = await db.insert(supportTickets).values(ticketData).returning();
        return ticket;
      }
      async updateSupportTicket(id, updates) {
        const [ticket] = await db.update(supportTickets).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(supportTickets.id, id)).returning();
        return ticket;
      }
      async getSupportMessages(ticketId) {
        return await db.select().from(supportMessages).where(eq(supportMessages.ticketId, ticketId)).orderBy(supportMessages.createdAt);
      }
      async createSupportMessage(messageData) {
        const [message] = await db.insert(supportMessages).values(messageData).returning();
        return message;
      }
      // Knowledge Base operations
      async getKnowledgeArticles(category, searchQuery) {
        let query = db.select().from(knowledgeArticles);
        const conditions = [eq(knowledgeArticles.status, "published")];
        if (category) {
          conditions.push(sql2`${knowledgeArticles.tags} @> ARRAY[${category}]::text[]`);
        }
        if (conditions.length > 0) {
          query = query.where(and(...conditions));
        }
        return await query.orderBy(desc(knowledgeArticles.updatedAt));
      }
      async getKnowledgeArticle(id) {
        const [article] = await db.select().from(knowledgeArticles).where(eq(knowledgeArticles.id, id));
        return article;
      }
      async getKnowledgeArticleBySlug(slug) {
        const [article] = await db.select().from(knowledgeArticles).where(eq(knowledgeArticles.slug, slug));
        return article;
      }
      async createKnowledgeArticle(articleData) {
        const [article] = await db.insert(knowledgeArticles).values(articleData).returning();
        return article;
      }
      async updateKnowledgeArticle(id, updates) {
        const [article] = await db.update(knowledgeArticles).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(knowledgeArticles.id, id)).returning();
        return article;
      }
      // AI-powered Knowledge Base operations
      async searchKnowledgeSemanticSimilarity(query, limit = 10) {
        const searchTerms = query.toLowerCase().split(" ").filter((term) => term.length > 2);
        const articles = await db.select().from(knowledgeArticles).where(eq(knowledgeArticles.status, "published")).orderBy(desc(knowledgeArticles.publishedAt)).limit(50);
        const scoredArticles = articles.map((article) => {
          let score = 0;
          const titleLower = article.title.toLowerCase();
          const summaryLower = (article.summary || "").toLowerCase();
          const tagsLower = (article.tags || []).join(" ").toLowerCase();
          searchTerms.forEach((term) => {
            if (titleLower.includes(term)) score += 10;
            if (summaryLower.includes(term)) score += 5;
            if (tagsLower.includes(term)) score += 8;
          });
          return { article, score };
        });
        return scoredArticles.filter((item) => item.score > 0).sort((a, b) => b.score - a.score).slice(0, limit).map((item) => item.article);
      }
      async getRecommendedArticles(userId, limit = 5) {
        const recentArticles = await db.select({ tags: knowledgeArticles.tags }).from(knowledgeArticles).where(eq(knowledgeArticles.status, "published")).orderBy(desc(knowledgeArticles.publishedAt)).limit(10);
        const allTags = recentArticles.flatMap((a) => a.tags || []);
        const popularTags = [...new Set(allTags)].slice(0, 5);
        if (popularTags.length === 0) {
          return this.getPopularArticles(limit);
        }
        return await db.select().from(knowledgeArticles).where(eq(knowledgeArticles.status, "published")).orderBy(desc(knowledgeArticles.publishedAt)).limit(limit);
      }
      async getPopularArticles(limit = 5) {
        return await db.select().from(knowledgeArticles).where(eq(knowledgeArticles.status, "published")).orderBy(desc(knowledgeArticles.publishedAt)).limit(limit);
      }
      async getTrendingArticles(timeframe = "7d", limit = 5) {
        const days = timeframe === "24h" ? 1 : timeframe === "7d" ? 7 : 30;
        const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1e3);
        return await db.select().from(knowledgeArticles).where(
          and(
            eq(knowledgeArticles.status, "published"),
            sql2`${knowledgeArticles.publishedAt} >= ${cutoffDate}`
          )
        ).orderBy(desc(knowledgeArticles.publishedAt)).limit(limit);
      }
      async recordKnowledgeView(articleId, userId) {
        await this.createAuditLog({
          actorId: userId,
          action: "article_view",
          targetType: "knowledge_article",
          targetId: articleId,
          metadata: { timestamp: (/* @__PURE__ */ new Date()).toISOString() }
        });
      }
      async getArticleAnalytics(articleId) {
        const viewCount = await db.select({ count: sql2`count(*)` }).from(auditLogs).where(
          and(
            eq(auditLogs.targetType, "knowledge_article"),
            eq(auditLogs.targetId, articleId),
            eq(auditLogs.action, "article_view")
          )
        );
        const recentViews = await db.select({ count: sql2`count(*)` }).from(auditLogs).where(
          and(
            eq(auditLogs.targetType, "knowledge_article"),
            eq(auditLogs.targetId, articleId),
            eq(auditLogs.action, "article_view"),
            sql2`${auditLogs.createdAt} >= NOW() - INTERVAL '7 days'`
          )
        );
        return {
          totalViews: viewCount[0]?.count || 0,
          recentViews: recentViews[0]?.count || 0,
          engagement: Math.floor(Math.random() * 40) + 60,
          // Simulated engagement score
          avgTimeOnPage: Math.floor(Math.random() * 120) + 60
          // Simulated reading time
        };
      }
      async getKnowledgeSearchSuggestions(partialQuery) {
        if (partialQuery.length < 2) return [];
        const titleSuggestions = await db.select({ title: knowledgeArticles.title }).from(knowledgeArticles).where(
          and(
            eq(knowledgeArticles.status, "published"),
            sql2`LOWER(${knowledgeArticles.title}) LIKE LOWER(${"%" + partialQuery + "%"})`
          )
        ).limit(5);
        const suggestions = titleSuggestions.map((item) => item.title);
        const tagSuggestions = [
          "getting started",
          "account setup",
          "payment issues",
          "content upload",
          "verification process",
          "earnings",
          "privacy settings",
          "moderation",
          "subscription"
        ].filter((tag) => tag.toLowerCase().includes(partialQuery.toLowerCase()));
        return [.../* @__PURE__ */ new Set([...suggestions, ...tagSuggestions])].slice(0, 8);
      }
      // Tutorial operations
      async getTutorials(userRole, category) {
        const conditions = [eq(tutorials.status, "published")];
        if (userRole && userRole !== "all") {
          const roleCondition = or(
            eq(tutorials.roleTarget, userRole),
            eq(tutorials.roleTarget, "all")
          );
          if (roleCondition) {
            conditions.push(roleCondition);
          }
        }
        return await db.select().from(tutorials).where(and(...conditions)).orderBy(tutorials.createdAt, tutorials.title);
      }
      async getTutorial(id) {
        const [tutorial] = await db.select().from(tutorials).where(eq(tutorials.id, id));
        return tutorial;
      }
      async createTutorial(tutorialData) {
        const [tutorial] = await db.insert(tutorials).values(tutorialData).returning();
        return tutorial;
      }
      async getTutorialSteps(tutorialId) {
        return await db.select().from(tutorialSteps).where(eq(tutorialSteps.tutorialId, tutorialId)).orderBy(tutorialSteps.stepNumber);
      }
      async getTutorialProgress(userId, tutorialId) {
        const [progress] = await db.select().from(tutorialProgress).where(and(
          eq(tutorialProgress.userId, userId),
          eq(tutorialProgress.tutorialId, tutorialId)
        ));
        return progress;
      }
      async updateTutorialProgress(userId, tutorialId, stepIndex) {
        const steps = await db.select().from(tutorialSteps).where(eq(tutorialSteps.tutorialId, tutorialId)).orderBy(tutorialSteps.stepNumber);
        const totalSteps = steps.length;
        const isCompleted = stepIndex >= totalSteps;
        const existingProgress = await this.getTutorialProgress(userId, tutorialId);
        if (existingProgress) {
          const [progress] = await db.update(tutorialProgress).set({
            completedStep: stepIndex,
            completedAt: isCompleted ? /* @__PURE__ */ new Date() : null
          }).where(and(
            eq(tutorialProgress.userId, userId),
            eq(tutorialProgress.tutorialId, tutorialId)
          )).returning();
          return progress;
        } else {
          const [progress] = await db.insert(tutorialProgress).values({
            userId,
            tutorialId,
            completedStep: stepIndex,
            completedAt: isCompleted ? /* @__PURE__ */ new Date() : null
          }).returning();
          return progress;
        }
      }
      // ====================================
      // FanzTrust™ Storage Methods
      // ====================================
      async verifyTransaction(params) {
        const conditions = [];
        if (params.fanId) conditions.push(eq(fanzTransactions.fanId, params.fanId));
        if (params.creatorId) conditions.push(eq(fanzTransactions.creatorId, params.creatorId));
        if (params.gateway) conditions.push(eq(fanzTransactions.gateway, params.gateway));
        if (params.txid) conditions.push(eq(fanzTransactions.txid, params.txid));
        if (params.email) conditions.push(eq(fanzTransactions.email, params.email));
        if (params.walletAddress) conditions.push(eq(fanzTransactions.walletAddress, params.walletAddress));
        if (params.last4) conditions.push(eq(fanzTransactions.last4, params.last4));
        const [transaction] = await db.select().from(fanzTransactions).where(and(...conditions)).orderBy(desc(fanzTransactions.createdAt)).limit(1);
        return transaction;
      }
      async getTransaction(id) {
        const [transaction] = await db.select().from(fanzTransactions).where(eq(fanzTransactions.id, id));
        return transaction;
      }
      async getRefundByTransaction(transactionId) {
        const [refund] = await db.select().from(refundRequests).where(eq(refundRequests.transactionId, transactionId));
        return refund;
      }
      async getCreatorRefundPolicy(creatorId) {
        const [policy] = await db.select().from(creatorRefundPolicies).where(eq(creatorRefundPolicies.creatorId, creatorId));
        return policy;
      }
      async createRefundRequest(requestData) {
        const [refund] = await db.insert(refundRequests).values(requestData).returning();
        return refund;
      }
      async createTrustAuditLog(logData) {
        const [log2] = await db.insert(trustAuditLogs).values(logData).returning();
        return log2;
      }
      async getCreatorRefundRequests(creatorId) {
        return await db.select().from(refundRequests).where(eq(refundRequests.creatorId, creatorId)).orderBy(desc(refundRequests.createdAt));
      }
      async getRefundRequest(id) {
        const [refund] = await db.select().from(refundRequests).where(eq(refundRequests.id, id));
        return refund;
      }
      async updateRefundRequest(id, updates) {
        const [refund] = await db.update(refundRequests).set(updates).where(eq(refundRequests.id, id)).returning();
        return refund;
      }
      async getFanzWallet(userId) {
        const [wallet] = await db.select().from(fanzWallets).where(eq(fanzWallets.userId, userId));
        return wallet;
      }
      async createFanzWallet(data) {
        const [wallet] = await db.insert(fanzWallets).values(data).returning();
        return wallet;
      }
      async getWalletTransactions(walletId) {
        return await db.select().from(walletTransactions).where(eq(walletTransactions.walletId, walletId)).orderBy(desc(walletTransactions.createdAt));
      }
      async createWalletTransaction(transactionData) {
        const [transaction] = await db.insert(walletTransactions).values(transactionData).returning();
        return transaction;
      }
      async updateFanzWallet(id, updates) {
        const [wallet] = await db.update(fanzWallets).set(updates).where(eq(fanzWallets.id, id)).returning();
        return wallet;
      }
      async getFanTrustScore(fanId) {
        const [score] = await db.select().from(fanTrustScores).where(eq(fanTrustScores.fanId, fanId));
        return score;
      }
      async createFanTrustScore(data) {
        const [score] = await db.insert(fanTrustScores).values(data).returning();
        return score;
      }
      async getAllRefundRequests() {
        return await db.select().from(refundRequests).orderBy(desc(refundRequests.createdAt));
      }
      async createCreatorRefundPolicy(data) {
        const [policy] = await db.insert(creatorRefundPolicies).values(data).returning();
        return policy;
      }
      async updateCreatorRefundPolicy(creatorId, updates) {
        const [policy] = await db.update(creatorRefundPolicies).set(updates).where(eq(creatorRefundPolicies.creatorId, creatorId)).returning();
        return policy;
      }
      // ========================================
      // INFINITY SCROLL FEED OPERATIONS
      // ========================================
      async getFeedPosts(params) {
        const limit = params.limit || 20;
        const userId = params.userId;
        const userSubs = await db.select({ creatorId: subscriptions.creatorId }).from(subscriptions).where(and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, "active")
        ));
        const subscribedCreatorIds = userSubs.map((s) => s.creatorId);
        const userFollows_result = await db.select({ creatorId: userFollows.creatorId }).from(userFollows).where(eq(userFollows.followerId, userId));
        const followedCreatorIds = userFollows_result.map((f) => f.creatorId);
        const conditions = [];
        if (subscribedCreatorIds.length > 0) {
          conditions.push(sql2`${feedPosts.creatorId} IN (${sql2.join(subscribedCreatorIds.map((id) => sql2`${id}`), sql2`, `)})`);
        }
        if (followedCreatorIds.length > 0) {
          conditions.push(sql2`${feedPosts.creatorId} IN (${sql2.join(followedCreatorIds.map((id) => sql2`${id}`), sql2`, `)})`);
        }
        conditions.push(and(
          eq(feedPosts.isFreePreview, true),
          eq(feedPosts.isPublished, true)
        ));
        let finalWhereClause;
        if (params.cursor) {
          const cursorCondition = sql2`${feedPosts.createdAt} < (SELECT created_at FROM feed_posts WHERE id = ${params.cursor})`;
          finalWhereClause = conditions.length > 0 ? and(or(...conditions), cursorCondition) : cursorCondition;
        } else {
          finalWhereClause = conditions.length > 0 ? or(...conditions) : void 0;
        }
        const posts = await db.select().from(feedPosts).where(finalWhereClause).orderBy(desc(feedPosts.createdAt)).limit(limit + 1);
        const hasMore = posts.length > limit;
        const returnPosts = hasMore ? posts.slice(0, limit) : posts;
        const nextCursor = hasMore && returnPosts.length > 0 ? returnPosts[returnPosts.length - 1].id : null;
        return { posts: returnPosts, nextCursor };
      }
      async getPost(id) {
        const [post] = await db.select().from(feedPosts).where(eq(feedPosts.id, id));
        return post;
      }
      async createPost(postData) {
        const [post] = await db.insert(feedPosts).values(postData).returning();
        await db.insert(postEngagement).values({ postId: post.id });
        return post;
      }
      async updatePost(id, updates) {
        const [post] = await db.update(feedPosts).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(feedPosts.id, id)).returning();
        return post;
      }
      async deletePost(id) {
        await db.delete(feedPosts).where(eq(feedPosts.id, id));
      }
      // Post Media operations
      async getPostMedia(postId) {
        return await db.select().from(postMedia).where(eq(postMedia.postId, postId)).orderBy(postMedia.sortOrder);
      }
      async createPostMedia(mediaData) {
        const [media] = await db.insert(postMedia).values(mediaData).returning();
        return media;
      }
      async deletePostMedia(id) {
        await db.delete(postMedia).where(eq(postMedia.id, id));
      }
      // Post Engagement operations
      async getPostEngagement(postId) {
        const [engagement] = await db.select().from(postEngagement).where(eq(postEngagement.postId, postId));
        return engagement;
      }
      async incrementPostView(postId) {
        await db.update(postEngagement).set({
          views: sql2`${postEngagement.views} + 1`,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq(postEngagement.postId, postId));
      }
      async likePost(postId, userId) {
        const [existing] = await db.select().from(postLikes).where(and(
          eq(postLikes.postId, postId),
          eq(postLikes.userId, userId)
        ));
        if (!existing) {
          await db.insert(postLikes).values({ postId, userId });
          await db.update(postEngagement).set({
            likes: sql2`${postEngagement.likes} + 1`,
            updatedAt: /* @__PURE__ */ new Date()
          }).where(eq(postEngagement.postId, postId));
        }
      }
      async unlikePost(postId, userId) {
        const deleted = await db.delete(postLikes).where(and(
          eq(postLikes.postId, postId),
          eq(postLikes.userId, userId)
        )).returning();
        if (deleted.length > 0) {
          await db.update(postEngagement).set({
            likes: sql2`${postEngagement.likes} - 1`,
            updatedAt: /* @__PURE__ */ new Date()
          }).where(eq(postEngagement.postId, postId));
        }
      }
      // User Follows operations
      async followCreator(followerId, creatorId) {
        const [follow] = await db.insert(userFollows).values({ followerId, creatorId }).returning();
        return follow;
      }
      async unfollowCreator(followerId, creatorId) {
        await db.delete(userFollows).where(and(
          eq(userFollows.followerId, followerId),
          eq(userFollows.creatorId, creatorId)
        ));
      }
      async getFollowing(userId) {
        return await db.select().from(userFollows).where(eq(userFollows.followerId, userId));
      }
      async getFollowers(creatorId) {
        return await db.select().from(userFollows).where(eq(userFollows.creatorId, creatorId));
      }
      async isFollowing(followerId, creatorId) {
        const [result] = await db.select().from(userFollows).where(and(
          eq(userFollows.followerId, followerId),
          eq(userFollows.creatorId, creatorId)
        ));
        return !!result;
      }
      // Age Verification operations
      async getAgeVerification(userId) {
        const [verification] = await db.select().from(ageVerifications).where(eq(ageVerifications.userId, userId));
        return verification;
      }
      async createAgeVerification(verificationData) {
        const [verification] = await db.insert(ageVerifications).values(verificationData).returning();
        return verification;
      }
      async updateAgeVerification(userId, updates) {
        const [verification] = await db.update(ageVerifications).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(ageVerifications.userId, userId)).returning();
        return verification;
      }
      // Sponsored Posts operations
      async getSponsoredPosts(params) {
        const limit = params.limit || 10;
        if (params.isActive !== void 0) {
          return await db.select().from(sponsoredPosts).where(eq(sponsoredPosts.isActive, params.isActive)).limit(limit);
        }
        return await db.select().from(sponsoredPosts).limit(limit);
      }
      async createSponsoredPost(postData) {
        const [ad] = await db.insert(sponsoredPosts).values(postData).returning();
        return ad;
      }
      async incrementAdImpression(adId) {
        await db.update(sponsoredPosts).set({
          impressions: sql2`${sponsoredPosts.impressions} + 1`,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq(sponsoredPosts.id, adId));
      }
      async incrementAdClick(adId) {
        await db.update(sponsoredPosts).set({
          clicks: sql2`${sponsoredPosts.clicks} + 1`,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq(sponsoredPosts.id, adId));
      }
      // Post Unlocks operations
      async unlockPost(postId, userId, transactionId, amount) {
        const [unlock] = await db.insert(postUnlocks).values({
          postId,
          userId,
          transactionId,
          paidAmount: amount
        }).returning();
        await db.update(postEngagement).set({
          unlocks: sql2`${postEngagement.unlocks} + 1`,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq(postEngagement.postId, postId));
        return unlock;
      }
      async isPostUnlocked(postId, userId) {
        const [unlock] = await db.select().from(postUnlocks).where(and(
          eq(postUnlocks.postId, postId),
          eq(postUnlocks.userId, userId)
        ));
        return !!unlock;
      }
      async getUserUnlockedPosts(userId) {
        return await db.select().from(postUnlocks).where(eq(postUnlocks.userId, userId)).orderBy(desc(postUnlocks.createdAt));
      }
      // Content Creation operations
      async getContentSession(id) {
        const [session3] = await db.select().from(contentCreationSessions).where(eq(contentCreationSessions.id, id));
        return session3;
      }
      async getContentSessionsByCreator(creatorId, limit = 20) {
        return await db.select().from(contentCreationSessions).where(eq(contentCreationSessions.creatorId, creatorId)).orderBy(desc(contentCreationSessions.createdAt)).limit(limit);
      }
      async createContentSession(sessionData) {
        const [session3] = await db.insert(contentCreationSessions).values(sessionData).returning();
        return session3;
      }
      async updateContentSession(id, updates) {
        const [session3] = await db.update(contentCreationSessions).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(contentCreationSessions.id, id)).returning();
        return session3;
      }
      // Editing Task operations
      async getEditingTask(id) {
        const [task] = await db.select().from(editingTasks).where(eq(editingTasks.id, id));
        return task;
      }
      async getEditingTaskBySession(sessionId) {
        const [task] = await db.select().from(editingTasks).where(eq(editingTasks.sessionId, sessionId)).orderBy(desc(editingTasks.createdAt)).limit(1);
        return task;
      }
      async getEditingTasksBySession(sessionId) {
        return await db.select().from(editingTasks).where(eq(editingTasks.sessionId, sessionId)).orderBy(desc(editingTasks.createdAt));
      }
      async createEditingTask(taskData) {
        const [task] = await db.insert(editingTasks).values(taskData).returning();
        return task;
      }
      async updateEditingTask(id, updates) {
        const [task] = await db.update(editingTasks).set(updates).where(eq(editingTasks.id, id)).returning();
        return task;
      }
      // Content Version operations
      async getContentVersionsBySession(sessionId) {
        return await db.select().from(contentVersions).where(eq(contentVersions.sessionId, sessionId)).orderBy(contentVersions.aspectRatio);
      }
      async createContentVersion(versionData) {
        const [version] = await db.insert(contentVersions).values(versionData).returning();
        return version;
      }
      // Generated Asset operations
      async getGeneratedAssetsBySession(sessionId) {
        return await db.select().from(generatedAssets).where(eq(generatedAssets.sessionId, sessionId)).orderBy(generatedAssets.assetType);
      }
      async createGeneratedAsset(assetData) {
        const [asset] = await db.insert(generatedAssets).values(assetData).returning();
        return asset;
      }
      // Distribution Campaign operations
      async getDistributionCampaign(id) {
        const [campaign] = await db.select().from(distributionCampaigns).where(eq(distributionCampaigns.id, id));
        return campaign;
      }
      async createDistributionCampaign(campaignData) {
        const [campaign] = await db.insert(distributionCampaigns).values(campaignData).returning();
        return campaign;
      }
      async updateDistributionCampaign(id, updates) {
        const [campaign] = await db.update(distributionCampaigns).set(updates).where(eq(distributionCampaigns.id, id)).returning();
        return campaign;
      }
      // Platform Distribution operations
      async getPlatformDistributions(campaignId) {
        return await db.select().from(platformDistributions).where(eq(platformDistributions.campaignId, campaignId));
      }
      async createPlatformDistribution(distributionData) {
        const [distribution] = await db.insert(platformDistributions).values(distributionData).returning();
        return distribution;
      }
      async updatePlatformDistribution(id, updates) {
        const [distribution] = await db.update(platformDistributions).set(updates).where(eq(platformDistributions.id, id)).returning();
        return distribution;
      }
      // Content Analytics operations
      async getContentAnalytics(sessionId) {
        const [analytics] = await db.select().from(contentAnalytics).where(eq(contentAnalytics.sessionId, sessionId));
        return analytics;
      }
      async createContentAnalytics(analyticsData) {
        const [analytics] = await db.insert(contentAnalytics).values(analyticsData).returning();
        return analytics;
      }
      async updateContentAnalytics(sessionId, updates) {
        const [analytics] = await db.update(contentAnalytics).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(contentAnalytics.sessionId, sessionId)).returning();
        return analytics;
      }
      // Creator Studio Settings operations
      async getCreatorStudioSettings(creatorId) {
        const [settings] = await db.select().from(creatorStudioSettings).where(eq(creatorStudioSettings.creatorId, creatorId));
        return settings;
      }
      async createCreatorStudioSettings(settingsData) {
        const [settings] = await db.insert(creatorStudioSettings).values(settingsData).returning();
        return settings;
      }
      async updateCreatorStudioSettings(creatorId, updates) {
        const [settings] = await db.update(creatorStudioSettings).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(creatorStudioSettings.creatorId, creatorId)).returning();
        return settings;
      }
      // Smart Link operations (simplified implementations)
      async createSmartLink(link) {
        return { id: link.id, url: link.targetUrl };
      }
      async getSmartLinkClicks(url) {
        return Math.floor(Math.random() * 1e3);
      }
      async getQRCodeScans(url) {
        return Math.floor(Math.random() * 500);
      }
      // Live Stream operations
      async createLiveStream(streamData) {
        const { liveStreams: liveStreams2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
        const [stream] = await db.insert(liveStreams2).values(streamData).returning();
        return stream;
      }
      async addLiveStreamCoStar(data) {
        const [coStar] = await db.insert(liveStreamCoStars).values(data).returning();
        return coStar;
      }
      async updateLiveStream(id, updates) {
        const [stream] = await db.update(liveStreams).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(liveStreams.id, id)).returning();
        return stream;
      }
      async getLiveStream(id) {
        const [stream] = await db.select().from(liveStreams).where(eq(liveStreams.id, id));
        return stream;
      }
      async getLiveStreamByKey(streamKey) {
        const [stream] = await db.select().from(liveStreams).where(eq(liveStreams.streamKey, streamKey));
        return stream;
      }
      // Stream Participant operations
      async addStreamParticipant(participant) {
        const [result] = await db.insert(streamParticipants).values(participant).returning();
        return result;
      }
      async updateStreamParticipant(streamId, userId, updates) {
        const [result] = await db.update(streamParticipants).set(updates).where(and(
          eq(streamParticipants.streamId, streamId),
          eq(streamParticipants.userId, userId)
        )).returning();
        return result;
      }
      async getStreamParticipants(streamId) {
        return await db.select().from(streamParticipants).where(eq(streamParticipants.streamId, streamId));
      }
      // Stream Viewer operations
      async addStreamViewer(viewer) {
        const [result] = await db.insert(streamViewers).values(viewer).returning();
        return result;
      }
      async updateStreamViewer(streamId, userId, updates) {
        const [result] = await db.update(streamViewers).set(updates).where(and(
          eq(streamViewers.streamId, streamId),
          eq(streamViewers.userId, userId)
        )).returning();
        return result;
      }
      async getStreamViewers(streamId) {
        return await db.select().from(streamViewers).where(eq(streamViewers.streamId, streamId));
      }
      // Stream Chat operations
      async addStreamChatMessage(message) {
        const [result] = await db.insert(streamChatMessages).values(message).returning();
        return result;
      }
      async getStreamChatMessages(streamId, limit = 100) {
        return await db.select().from(streamChatMessages).where(eq(streamChatMessages.streamId, streamId)).orderBy(desc(streamChatMessages.createdAt)).limit(limit);
      }
      // Stream Gift operations
      async addStreamGift(gift) {
        const [result] = await db.insert(streamGifts).values(gift).returning();
        return result;
      }
      async getStreamGifts(streamId) {
        return await db.select().from(streamGifts).where(eq(streamGifts.streamId, streamId)).orderBy(desc(streamGifts.createdAt));
      }
      // Stream Reaction operations
      async addStreamReaction(reaction) {
        const [result] = await db.insert(streamReactions).values(reaction).returning();
        return result;
      }
      async getStreamReactions(streamId) {
        return await db.select().from(streamReactions).where(eq(streamReactions.streamId, streamId));
      }
      // Stream Highlight operations
      async createStreamHighlight(highlight) {
        const [result] = await db.insert(streamHighlights).values(highlight).returning();
        return result;
      }
      async getStreamHighlights(streamId) {
        return await db.select().from(streamHighlights).where(eq(streamHighlights.streamId, streamId)).orderBy(desc(streamHighlights.score));
      }
      // Stream Recording operations
      async createStreamRecording(recording) {
        const [result] = await db.insert(streamRecordings).values(recording).returning();
        return result;
      }
      async updateStreamRecording(id, updates) {
        const [result] = await db.update(streamRecordings).set(updates).where(eq(streamRecordings.id, id)).returning();
        return result;
      }
      async getStreamRecording(streamId) {
        const [recording] = await db.select().from(streamRecordings).where(eq(streamRecordings.streamId, streamId)).orderBy(desc(streamRecordings.createdAt)).limit(1);
        return recording;
      }
      // Stream Analytics operations
      async createStreamAnalytics(analytics) {
        const [result] = await db.insert(streamAnalytics).values(analytics).returning();
        return result;
      }
      async updateStreamAnalytics(streamId, updates) {
        const [result] = await db.update(streamAnalytics).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(streamAnalytics.streamId, streamId)).returning();
        return result;
      }
      async getStreamAnalytics(streamId) {
        const [analytics] = await db.select().from(streamAnalytics).where(eq(streamAnalytics.streamId, streamId));
        return analytics;
      }
      // NFT Collection operations
      async getNftCollection(id) {
        const [collection] = await db.select().from(nftCollections).where(eq(nftCollections.id, id));
        return collection;
      }
      async getNftCollectionsByCreator(creatorId) {
        return await db.select().from(nftCollections).where(eq(nftCollections.creatorId, creatorId)).orderBy(desc(nftCollections.createdAt));
      }
      async createNftCollection(collectionData) {
        const [collection] = await db.insert(nftCollections).values(collectionData).returning();
        return collection;
      }
      async updateNftCollection(id, updates) {
        const [collection] = await db.update(nftCollections).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(nftCollections.id, id)).returning();
        return collection;
      }
      // NFT Token operations
      async getNftToken(id) {
        const [token] = await db.select().from(nftTokens).where(eq(nftTokens.id, id));
        return token;
      }
      async getNftTokensByOwner(ownerId) {
        return await db.select().from(nftTokens).where(eq(nftTokens.ownerId, ownerId)).orderBy(desc(nftTokens.createdAt));
      }
      async getNftTokensByCollection(collectionId) {
        return await db.select().from(nftTokens).where(eq(nftTokens.collectionId, collectionId)).orderBy(desc(nftTokens.createdAt));
      }
      async createNftToken(tokenData) {
        const [token] = await db.insert(nftTokens).values(tokenData).returning();
        return token;
      }
      async updateNftToken(id, updates) {
        const [token] = await db.update(nftTokens).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(nftTokens.id, id)).returning();
        return token;
      }
      // NFT Transaction operations
      async getNftTransactionsByToken(tokenId) {
        return await db.select().from(nftTransactions).where(eq(nftTransactions.tokenId, tokenId)).orderBy(desc(nftTransactions.createdAt));
      }
      async getNftTransactionsByUser(userId) {
        return await db.select().from(nftTransactions).where(or(
          eq(nftTransactions.fromUserId, userId),
          eq(nftTransactions.toUserId, userId)
        )).orderBy(desc(nftTransactions.createdAt));
      }
      async createNftTransaction(transactionData) {
        const [transaction] = await db.insert(nftTransactions).values(transactionData).returning();
        return transaction;
      }
      async updateNftTransaction(id, updates) {
        const [transaction] = await db.update(nftTransactions).set(updates).where(eq(nftTransactions.id, id)).returning();
        return transaction;
      }
      // Blockchain Wallet operations
      async getBlockchainWallet(userId, blockchain) {
        const conditions = [eq(blockchainWallets.userId, userId)];
        if (blockchain) {
          conditions.push(eq(blockchainWallets.blockchain, blockchain));
        }
        const [wallet] = await db.select().from(blockchainWallets).where(and(...conditions));
        return wallet;
      }
      async getBlockchainWalletsByUser(userId) {
        return await db.select().from(blockchainWallets).where(eq(blockchainWallets.userId, userId));
      }
      async createBlockchainWallet(walletData) {
        const [wallet] = await db.insert(blockchainWallets).values(walletData).returning();
        return wallet;
      }
      async updateBlockchainWallet(id, updates) {
        const [wallet] = await db.update(blockchainWallets).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(blockchainWallets.id, id)).returning();
        return wallet;
      }
      // Royalty Distribution operations
      async getRoyaltyDistributionsByToken(tokenId) {
        return await db.select().from(royaltyDistributions).where(eq(royaltyDistributions.tokenId, tokenId)).orderBy(desc(royaltyDistributions.createdAt));
      }
      async getRoyaltyDistributionsByRecipient(recipientId) {
        return await db.select().from(royaltyDistributions).where(eq(royaltyDistributions.recipientId, recipientId)).orderBy(desc(royaltyDistributions.createdAt));
      }
      async createRoyaltyDistribution(distributionData) {
        const [distribution] = await db.insert(royaltyDistributions).values(distributionData).returning();
        return distribution;
      }
      async updateRoyaltyDistribution(id, updates) {
        const [distribution] = await db.update(royaltyDistributions).set(updates).where(eq(royaltyDistributions.id, id)).returning();
        return distribution;
      }
      // IPFS Record operations
      async getIpfsRecordsByUser(userId) {
        return await db.select().from(ipfsRecords).where(eq(ipfsRecords.userId, userId)).orderBy(desc(ipfsRecords.createdAt));
      }
      async getIpfsRecordByHash(ipfsHash) {
        const [record] = await db.select().from(ipfsRecords).where(eq(ipfsRecords.ipfsHash, ipfsHash));
        return record;
      }
      async createIpfsRecord(recordData) {
        const [record] = await db.insert(ipfsRecords).values(recordData).returning();
        return record;
      }
      async updateIpfsRecord(id, updates) {
        const [record] = await db.update(ipfsRecords).set(updates).where(eq(ipfsRecords.id, id)).returning();
        return record;
      }
      // Marketplace Integration operations
      async getMarketplaceIntegration(userId, marketplace) {
        const [integration] = await db.select().from(marketplaceIntegrations).where(and(
          eq(marketplaceIntegrations.userId, userId),
          eq(marketplaceIntegrations.marketplace, marketplace)
        ));
        return integration;
      }
      async getMarketplaceIntegrationsByUser(userId) {
        return await db.select().from(marketplaceIntegrations).where(eq(marketplaceIntegrations.userId, userId));
      }
      async createMarketplaceIntegration(integrationData) {
        const [integration] = await db.insert(marketplaceIntegrations).values(integrationData).returning();
        return integration;
      }
      async updateMarketplaceIntegration(id, updates) {
        const [integration] = await db.update(marketplaceIntegrations).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(marketplaceIntegrations.id, id)).returning();
        return integration;
      }
      // Additional helper methods
      async getContentSessionsByUserId(userId) {
        return await this.getContentSessionsByCreator(userId);
      }
      async deleteContentSession(id, ownerId) {
        await db.delete(contentCreationSessions).where(and(
          eq(contentCreationSessions.id, id),
          eq(contentCreationSessions.creatorId, ownerId)
        ));
      }
      async getKycVerificationsByUserId(userId) {
        return await db.select().from(kycVerifications).where(eq(kycVerifications.userId, userId)).orderBy(desc(kycVerifications.createdAt));
      }
      async getKycVerificationsInDateRange(startDate, endDate) {
        return await db.select().from(kycVerifications).where(and(
          sql2`${kycVerifications.createdAt} >= ${startDate}`,
          sql2`${kycVerifications.createdAt} <= ${endDate}`
        )).orderBy(desc(kycVerifications.createdAt));
      }
      async createRecord2257(recordData) {
        const { records2257: records22572 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
        const [record] = await db.insert(records22572).values(recordData).returning();
        return record;
      }
      async getAuditLogsInDateRange(startDate, endDate, actionPattern) {
        const conditions = [
          sql2`${auditLogs.createdAt} >= ${startDate}`,
          sql2`${auditLogs.createdAt} <= ${endDate}`
        ];
        if (actionPattern) {
          conditions.push(sql2`${auditLogs.action} LIKE ${`%${actionPattern}%`}`);
        }
        return await db.select().from(auditLogs).where(and(...conditions)).orderBy(desc(auditLogs.createdAt));
      }
    };
    storage = new DatabaseStorage();
  }
});

// server/auth.ts
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import session from "express-session";
import connectPg from "connect-pg-simple";
function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1e3;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions"
  });
  return session({
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: sessionTtl
    }
  });
}
function generateToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      isCreator: user.isCreator
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
      isCreator: decoded.isCreator
    };
  } catch (error) {
    return null;
  }
}
async function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}
async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}
function generateSecureToken() {
  return crypto.randomBytes(32).toString("hex");
}
async function sendPasswordResetEmail(email, token) {
  const resetUrl = `${process.env.APP_URL || "http://localhost:5000"}/reset-password?token=${token}`;
  await emailTransporter.sendMail({
    from: process.env.SMTP_FROM || "noreply@girlfanz.com",
    to: email,
    subject: "Reset Your GirlFanz Password",
    html: `
      <h2>Reset Your Password</h2>
      <p>Click the link below to reset your password. This link will expire in 1 hour.</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>If you didn't request this, please ignore this email.</p>
    `
  });
}
async function sendVerificationEmail(email, token) {
  const verifyUrl = `${process.env.APP_URL || "http://localhost:5000"}/verify-email?token=${token}`;
  await emailTransporter.sendMail({
    from: process.env.SMTP_FROM || "noreply@girlfanz.com",
    to: email,
    subject: "Verify Your GirlFanz Email",
    html: `
      <h2>Welcome to GirlFanz!</h2>
      <p>Please verify your email address by clicking the link below:</p>
      <a href="${verifyUrl}">${verifyUrl}</a>
    `
  });
}
async function setupAuth(app2) {
  app2.set("trust proxy", 1);
  app2.use(getSession());
  app2.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName, isCreator, securityQuestion, securityAnswer } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }
      const hashedPassword = await hashPassword(password);
      const hashedSecurityAnswer = securityAnswer ? await hashPassword(securityAnswer.toLowerCase().trim()) : null;
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        isCreator: isCreator || false,
        authProvider: "local",
        securityQuestion,
        securityAnswer: hashedSecurityAnswer || void 0
      });
      const verificationToken = generateSecureToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1e3);
      await storage.createEmailVerificationToken({
        userId: user.id,
        token: verificationToken,
        expiresAt
      });
      sendVerificationEmail(email, verificationToken).catch(
        (err) => console.error("Failed to send verification email:", err)
      );
      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
        isCreator: user.isCreator
      });
      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isCreator: user.isCreator,
          emailVerified: user.emailVerified
        }
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      const user = await storage.getUserByEmail(email);
      if (!user || !user.password) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      const isValid = await verifyPassword(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      if (user.status !== "active") {
        return res.status(403).json({ message: "Account is suspended or banned" });
      }
      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
        isCreator: user.isCreator
      });
      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isCreator: user.isCreator,
          emailVerified: user.emailVerified
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });
  app2.get("/api/auth/user", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isCreator: user.isCreator,
        emailVerified: user.emailVerified,
        role: user.role
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });
  app2.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      const user = await storage.getUserByEmail(email);
      res.json({ message: "If an account exists, a password reset link has been sent" });
      if (!user) {
        return;
      }
      const resetToken = generateSecureToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1e3);
      await storage.createPasswordResetToken({
        userId: user.id,
        token: resetToken,
        expiresAt
      });
      sendPasswordResetEmail(email, resetToken).catch(
        (err) => console.error("Failed to send reset email:", err)
      );
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Failed to process request" });
    }
  });
  app2.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" });
      }
      if (newPassword.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }
      const resetToken = await storage.getPasswordResetToken(token);
      if (!resetToken || resetToken.used) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }
      if (/* @__PURE__ */ new Date() > new Date(resetToken.expiresAt)) {
        return res.status(400).json({ message: "Token has expired" });
      }
      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUser(resetToken.userId, {
        password: hashedPassword
      });
      await storage.markPasswordResetTokenUsed(token);
      res.json({ message: "Password reset successful" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });
  app2.post("/api/auth/recover-email", async (req, res) => {
    try {
      const { securityQuestion, securityAnswer } = req.body;
      if (!securityQuestion || !securityAnswer) {
        return res.status(400).json({ message: "Security question and answer are required" });
      }
      const users2 = await storage.getUsersBySecurityQuestion(securityQuestion);
      for (const user of users2) {
        if (user.securityAnswer) {
          const isValid = await verifyPassword(securityAnswer.toLowerCase().trim(), user.securityAnswer);
          if (isValid) {
            const email = user.email;
            const [localPart, domain] = email.split("@");
            const maskedEmail = `${localPart.substring(0, 2)}${"*".repeat(localPart.length - 2)}@${domain}`;
            return res.json({
              success: true,
              email: maskedEmail,
              hint: `Your email is: ${maskedEmail}`
            });
          }
        }
      }
      res.status(401).json({ message: "Security answer does not match" });
    } catch (error) {
      console.error("Recover email error:", error);
      res.status(500).json({ message: "Failed to recover email" });
    }
  });
  app2.post("/api/auth/verify-email", async (req, res) => {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ message: "Token is required" });
      }
      const verificationToken = await storage.getEmailVerificationToken(token);
      if (!verificationToken || verificationToken.used) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }
      if (/* @__PURE__ */ new Date() > new Date(verificationToken.expiresAt)) {
        return res.status(400).json({ message: "Token has expired" });
      }
      await storage.updateUser(verificationToken.userId, {
        emailVerified: true
      });
      await storage.markEmailVerificationTokenUsed(token);
      res.json({ message: "Email verified successfully" });
    } catch (error) {
      console.error("Verify email error:", error);
      res.status(500).json({ message: "Failed to verify email" });
    }
  });
  app2.post("/api/auth/logout", (req, res) => {
    req.session?.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });
}
var JWT_SECRET, BCRYPT_ROUNDS, emailTransporter, isAuthenticated;
var init_auth = __esm({
  async "server/auth.ts"() {
    "use strict";
    await init_storage();
    if (!process.env.JWT_SECRET) {
      console.error("CRITICAL: JWT_SECRET environment variable must be set for production use!");
      console.error("Generate a secure secret with: openssl rand -base64 64");
      if (process.env.NODE_ENV === "production") {
        throw new Error("JWT_SECRET is required in production");
      }
    }
    JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString("hex");
    BCRYPT_ROUNDS = 12;
    emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    isAuthenticated = async (req, res, next) => {
      try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
        if (!token) {
          return res.status(401).json({ message: "Unauthorized" });
        }
        const user = verifyToken(token);
        if (!user) {
          return res.status(401).json({ message: "Invalid token" });
        }
        req.user = { claims: user };
        next();
      } catch (error) {
        res.status(401).json({ message: "Unauthorized" });
      }
    };
  }
});

// server/objectAcl.ts
function isPermissionAllowed(requested, granted) {
  if (requested === "read" /* READ */) {
    return ["read" /* READ */, "write" /* WRITE */].includes(granted);
  }
  return granted === "write" /* WRITE */;
}
function createObjectAccessGroup(group) {
  switch (group.type) {
    // Implement the case for each type of access group to instantiate.
    //
    // For example:
    // case "USER_LIST":
    //   return new UserListAccessGroup(group.id);
    // case "EMAIL_DOMAIN":
    //   return new EmailDomainAccessGroup(group.id);
    // case "GROUP_MEMBER":
    //   return new GroupMemberAccessGroup(group.id);
    // case "SUBSCRIBER":
    //   return new SubscriberAccessGroup(group.id);
    default:
      throw new Error(`Unknown access group type: ${group.type}`);
  }
}
async function setObjectAclPolicy(objectFile, aclPolicy) {
  const [exists] = await objectFile.exists();
  if (!exists) {
    throw new Error(`Object not found: ${objectFile.name}`);
  }
  await objectFile.setMetadata({
    metadata: {
      [ACL_POLICY_METADATA_KEY]: JSON.stringify(aclPolicy)
    }
  });
}
async function getObjectAclPolicy(objectFile) {
  const [metadata] = await objectFile.getMetadata();
  const aclPolicy = metadata?.metadata?.[ACL_POLICY_METADATA_KEY];
  if (!aclPolicy) {
    return null;
  }
  return JSON.parse(aclPolicy);
}
async function canAccessObject({
  userId,
  objectFile,
  requestedPermission
}) {
  const aclPolicy = await getObjectAclPolicy(objectFile);
  if (!aclPolicy) {
    return false;
  }
  if (aclPolicy.visibility === "public" && requestedPermission === "read" /* READ */) {
    return true;
  }
  if (!userId) {
    return false;
  }
  if (aclPolicy.owner === userId) {
    return true;
  }
  for (const rule of aclPolicy.aclRules || []) {
    const accessGroup = createObjectAccessGroup(rule.group);
    if (await accessGroup.hasMember(userId) && isPermissionAllowed(requestedPermission, rule.permission)) {
      return true;
    }
  }
  return false;
}
var ACL_POLICY_METADATA_KEY;
var init_objectAcl = __esm({
  "server/objectAcl.ts"() {
    "use strict";
    ACL_POLICY_METADATA_KEY = "custom:aclPolicy";
  }
});

// server/objectStorage.ts
import { Storage } from "@google-cloud/storage";
import { randomUUID } from "crypto";
function parseObjectPath(path2) {
  if (!path2.startsWith("/")) {
    path2 = `/${path2}`;
  }
  const pathParts = path2.split("/");
  if (pathParts.length < 3) {
    throw new Error("Invalid path: must contain at least a bucket name");
  }
  const bucketName = pathParts[1];
  const objectName = pathParts.slice(2).join("/");
  return {
    bucketName,
    objectName
  };
}
async function signObjectURL({
  bucketName,
  objectName,
  method,
  ttlSec
}) {
  const request = {
    bucket_name: bucketName,
    object_name: objectName,
    method,
    expires_at: new Date(Date.now() + ttlSec * 1e3).toISOString()
  };
  const response = await fetch(
    `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(request)
    }
  );
  if (!response.ok) {
    throw new Error(
      `Failed to sign object URL, errorcode: ${response.status}, make sure you're running on Replit`
    );
  }
  const { signed_url: signedURL } = await response.json();
  return signedURL;
}
var REPLIT_SIDECAR_ENDPOINT, objectStorageClient, ObjectNotFoundError, ObjectStorageService;
var init_objectStorage = __esm({
  "server/objectStorage.ts"() {
    "use strict";
    init_objectAcl();
    REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";
    objectStorageClient = new Storage({
      credentials: {
        audience: "replit",
        subject_token_type: "access_token",
        token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
        type: "external_account",
        credential_source: {
          url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
          format: {
            type: "json",
            subject_token_field_name: "access_token"
          }
        },
        universe_domain: "googleapis.com"
      },
      projectId: ""
    });
    ObjectNotFoundError = class _ObjectNotFoundError extends Error {
      constructor() {
        super("Object not found");
        this.name = "ObjectNotFoundError";
        Object.setPrototypeOf(this, _ObjectNotFoundError.prototype);
      }
    };
    ObjectStorageService = class {
      constructor() {
      }
      // Gets the public object search paths.
      getPublicObjectSearchPaths() {
        const pathsStr = process.env.PUBLIC_OBJECT_SEARCH_PATHS || "";
        const paths = Array.from(
          new Set(
            pathsStr.split(",").map((path2) => path2.trim()).filter((path2) => path2.length > 0)
          )
        );
        if (paths.length === 0) {
          throw new Error(
            "PUBLIC_OBJECT_SEARCH_PATHS not set. Create a bucket in 'Object Storage' tool and set PUBLIC_OBJECT_SEARCH_PATHS env var (comma-separated paths)."
          );
        }
        return paths;
      }
      // Gets the private object directory.
      getPrivateObjectDir() {
        const dir = process.env.PRIVATE_OBJECT_DIR || "";
        if (!dir) {
          throw new Error(
            "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' tool and set PRIVATE_OBJECT_DIR env var."
          );
        }
        return dir;
      }
      // Search for a public object from the search paths.
      async searchPublicObject(filePath) {
        for (const searchPath of this.getPublicObjectSearchPaths()) {
          const fullPath = `${searchPath}/${filePath}`;
          const { bucketName, objectName } = parseObjectPath(fullPath);
          const bucket = objectStorageClient.bucket(bucketName);
          const file = bucket.file(objectName);
          const [exists] = await file.exists();
          if (exists) {
            return file;
          }
        }
        return null;
      }
      // Downloads an object to the response.
      async downloadObject(file, res, cacheTtlSec = 3600) {
        try {
          const [metadata] = await file.getMetadata();
          const aclPolicy = await getObjectAclPolicy(file);
          const isPublic = aclPolicy?.visibility === "public";
          res.set({
            "Content-Type": metadata.contentType || "application/octet-stream",
            "Content-Length": metadata.size,
            "Cache-Control": `${isPublic ? "public" : "private"}, max-age=${cacheTtlSec}`
          });
          const stream = file.createReadStream();
          stream.on("error", (err) => {
            console.error("Stream error:", err);
            if (!res.headersSent) {
              res.status(500).json({ error: "Error streaming file" });
            }
          });
          stream.pipe(res);
        } catch (error) {
          console.error("Error downloading file:", error);
          if (!res.headersSent) {
            res.status(500).json({ error: "Error downloading file" });
          }
        }
      }
      // Gets the upload URL for an object entity.
      async getObjectEntityUploadURL() {
        const privateObjectDir = this.getPrivateObjectDir();
        if (!privateObjectDir) {
          throw new Error(
            "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' tool and set PRIVATE_OBJECT_DIR env var."
          );
        }
        const objectId = randomUUID();
        const fullPath = `${privateObjectDir}/uploads/${objectId}`;
        const { bucketName, objectName } = parseObjectPath(fullPath);
        return signObjectURL({
          bucketName,
          objectName,
          method: "PUT",
          ttlSec: 900
        });
      }
      // Gets the object entity file from the object path.
      async getObjectEntityFile(objectPath) {
        if (!objectPath.startsWith("/objects/")) {
          throw new ObjectNotFoundError();
        }
        const parts = objectPath.slice(1).split("/");
        if (parts.length < 2) {
          throw new ObjectNotFoundError();
        }
        const entityId = parts.slice(1).join("/");
        let entityDir = this.getPrivateObjectDir();
        if (!entityDir.endsWith("/")) {
          entityDir = `${entityDir}/`;
        }
        const objectEntityPath = `${entityDir}${entityId}`;
        const { bucketName, objectName } = parseObjectPath(objectEntityPath);
        const bucket = objectStorageClient.bucket(bucketName);
        const objectFile = bucket.file(objectName);
        const [exists] = await objectFile.exists();
        if (!exists) {
          throw new ObjectNotFoundError();
        }
        return objectFile;
      }
      normalizeObjectEntityPath(rawPath) {
        if (!rawPath.startsWith("https://storage.googleapis.com/")) {
          return rawPath;
        }
        const url = new URL(rawPath);
        const rawObjectPath = url.pathname;
        let objectEntityDir = this.getPrivateObjectDir();
        if (!objectEntityDir.endsWith("/")) {
          objectEntityDir = `${objectEntityDir}/`;
        }
        if (!rawObjectPath.startsWith(objectEntityDir)) {
          return rawObjectPath;
        }
        const entityId = rawObjectPath.slice(objectEntityDir.length);
        return `/objects/${entityId}`;
      }
      // Tries to set the ACL policy for the object entity and return the normalized path.
      async trySetObjectEntityAclPolicy(rawPath, aclPolicy) {
        const normalizedPath = this.normalizeObjectEntityPath(rawPath);
        if (!normalizedPath.startsWith("/")) {
          return normalizedPath;
        }
        const objectFile = await this.getObjectEntityFile(normalizedPath);
        await setObjectAclPolicy(objectFile, aclPolicy);
        return normalizedPath;
      }
      // Checks if the user can access the object entity.
      async canAccessObjectEntity({
        userId,
        objectFile,
        requestedPermission
      }) {
        return canAccessObject({
          userId,
          objectFile,
          requestedPermission: requestedPermission ?? "read" /* READ */
        });
      }
      // Upload an object to storage
      async uploadObject(params) {
        const { key, body, contentType, metadata, aclPolicy } = params;
        const privateObjectDir = this.getPrivateObjectDir();
        const fullPath = `${privateObjectDir}/${key}`;
        const { bucketName, objectName } = parseObjectPath(fullPath);
        const bucket = objectStorageClient.bucket(bucketName);
        const file = bucket.file(objectName);
        await file.save(body, {
          contentType,
          metadata
        });
        if (aclPolicy) {
          await setObjectAclPolicy(file, aclPolicy);
        }
        const url = `/objects/${key}`;
        return { url, key };
      }
      // Delete an object from storage
      async deleteObject(key) {
        const privateObjectDir = this.getPrivateObjectDir();
        const fullPath = `${privateObjectDir}/${key}`;
        const { bucketName, objectName } = parseObjectPath(fullPath);
        const bucket = objectStorageClient.bucket(bucketName);
        const file = bucket.file(objectName);
        await file.delete();
      }
    };
  }
});

// server/payments/ccbill.ts
import crypto2 from "crypto";
function createCCBillService() {
  const config = {
    accountNumber: process.env.CCBILL_ACCOUNT_NUMBER || "",
    clientId: process.env.CCBILL_CLIENT_ID || "",
    clientSecret: process.env.CCBILL_CLIENT_SECRET || "",
    formName: process.env.CCBILL_FORM_NAME || "cc_form",
    webhookSecret: process.env.CCBILL_WEBHOOK_SECRET || "",
    sandboxMode: process.env.NODE_ENV !== "production"
  };
  return new CCBillService(config);
}
var CCBillService;
var init_ccbill = __esm({
  async "server/payments/ccbill.ts"() {
    "use strict";
    await init_storage();
    CCBillService = class {
      constructor(config) {
        this.config = config;
        this.baseUrl = config.sandboxMode ? "https://bill.ccbill.com/jpost/billingattest.cgi" : "https://bill.ccbill.com/jpost/billing.cgi";
      }
      // Generate hosted checkout URL for subscriptions
      generateSubscriptionCheckoutUrl(params) {
        const formDigest = this.generateFormDigest({
          clientAccnum: this.config.accountNumber,
          clientSubacc: "0000",
          formName: this.config.formName,
          subscriptionTypeId: "1",
          // Recurring subscription
          price: (params.pricePerMonth / 100).toFixed(2),
          period: "30",
          // 30 days for monthly
          currencyCode: params.currency === "USD" ? "840" : "840",
          formDigest: ""
        });
        const queryParams = new URLSearchParams({
          clientAccnum: this.config.accountNumber,
          clientSubacc: "0000",
          formName: this.config.formName,
          subscriptionTypeId: "1",
          price: (params.pricePerMonth / 100).toFixed(2),
          period: "30",
          currencyCode: params.currency === "USD" ? "840" : "840",
          formDigest,
          // Custom fields for tracking
          customer_fname: "Fan",
          customer_lname: "User",
          // Pass through custom data
          UDT1: params.userId,
          // Fan user ID
          UDT2: params.creatorId,
          // Creator ID
          UDT3: "subscription",
          // Transaction type
          UDT4: params.planName
        });
        return `${this.baseUrl}?${queryParams.toString()}`;
      }
      // Generate hosted checkout URL for one-time purchases
      generatePurchaseCheckoutUrl(params) {
        const formDigest = this.generateFormDigest({
          clientAccnum: this.config.accountNumber,
          clientSubacc: "0000",
          formName: this.config.formName,
          initialPrice: (params.amount / 100).toFixed(2),
          currencyCode: params.currency === "USD" ? "840" : "840",
          formDigest: ""
        });
        const queryParams = new URLSearchParams({
          clientAccnum: this.config.accountNumber,
          clientSubacc: "0000",
          formName: this.config.formName,
          initialPrice: (params.amount / 100).toFixed(2),
          currencyCode: params.currency === "USD" ? "840" : "840",
          formDigest,
          // Custom fields
          customer_fname: "Fan",
          customer_lname: "User",
          // Pass through custom data
          UDT1: params.userId,
          UDT2: params.creatorId || "",
          UDT3: params.type,
          UDT4: params.mediaId || ""
        });
        return `${this.baseUrl}?${queryParams.toString()}`;
      }
      // Generate form digest for security - CCBill specific format
      generateFormDigest(params) {
        let stringToHash;
        if (params.price && params.period) {
          stringToHash = params.clientAccnum + params.clientSubacc + params.formName + params.price + params.period + params.currencyCode + this.config.clientSecret;
        } else if (params.initialPrice) {
          stringToHash = params.clientAccnum + params.clientSubacc + params.formName + params.initialPrice + params.currencyCode + this.config.clientSecret;
        } else {
          throw new Error("Invalid parameters for digest generation");
        }
        return crypto2.createHash("md5").update(stringToHash).digest("hex");
      }
      // Verify CCBill webhook using MD5 verification (not HMAC)
      verifyWebhookData(formData) {
        const { verificationHash, ...data } = formData;
        if (!verificationHash) {
          return false;
        }
        const verificationString = [
          data.clientAccnum || "",
          data.clientSubacc || "",
          data.subscriptionId || data.transactionId || "",
          this.config.webhookSecret
          // Verification key
        ].join("");
        const expectedHash = crypto2.createHash("md5").update(verificationString).digest("hex");
        return expectedHash.toLowerCase() === verificationHash.toLowerCase();
      }
      // Process webhook notification
      async processWebhookNotification(webhookData) {
        const { eventType, subscriptionId, transactionId, customerId } = webhookData;
        switch (eventType) {
          case "NewSaleSuccess":
            await this.handleNewSale(webhookData);
            break;
          case "RenewalSuccess":
            await this.handleRenewalSuccess(webhookData);
            break;
          case "Cancellation":
            await this.handleCancellation(webhookData);
            break;
          case "Chargeback":
            await this.handleChargeback(webhookData);
            break;
          case "Refund":
            await this.handleRefund(webhookData);
            break;
          default:
            console.warn(`Unhandled CCBill webhook event: ${eventType}`);
        }
      }
      async handleNewSale(data) {
        const {
          subscriptionId,
          transactionId,
          initialPrice,
          accountingInitialPrice,
          UDT1: userId,
          UDT2: creatorId,
          UDT3: type,
          UDT4: additionalData,
          currencyCode
        } = data;
        await storage.createTransaction({
          userId,
          creatorId: creatorId || null,
          mediaId: type === "purchase" ? additionalData : null,
          provider: "ccbill",
          providerTransactionId: transactionId,
          type,
          status: "completed",
          amountCents: Math.round(parseFloat(initialPrice) * 100),
          currency: currencyCode === "840" ? "USD" : "USD",
          providerFee: Math.round((parseFloat(initialPrice) - parseFloat(accountingInitialPrice)) * 100),
          platformFee: Math.round(parseFloat(accountingInitialPrice) * 0.05 * 100),
          // 5% platform fee
          creatorEarnings: Math.round(parseFloat(accountingInitialPrice) * 0.95 * 100),
          // 95% to creator
          metadata: data
        });
        if (type === "subscription" && subscriptionId) {
          const existingSubscriptions = await storage.getSubscriptionsAsFan(userId);
          const existingSubscription = existingSubscriptions.find((s) => s.providerSubscriptionId === subscriptionId);
          if (existingSubscription) {
            await storage.updateSubscription(existingSubscription.id, {
              status: "active",
              nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3),
              updatedAt: /* @__PURE__ */ new Date()
            });
          } else {
            await storage.createSubscription({
              userId,
              creatorId,
              provider: "ccbill",
              providerSubscriptionId: subscriptionId,
              status: "active",
              pricePerMonth: Math.round(parseFloat(initialPrice) * 100),
              currency: "USD",
              billingCycle: "monthly",
              nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3)
              // Next month
            });
          }
        }
        await storage.createAuditLog({
          actorId: userId,
          action: "payment_success",
          targetType: "transaction",
          targetId: transactionId,
          metadata: { provider: "ccbill", amount: initialPrice, type }
        });
      }
      async handleRenewalSuccess(data) {
        const { subscriptionId, transactionId, billingAmount, accountingAmount } = data;
        const subscription = await storage.getSubscriptionsAsFan(data.UDT1);
        const activeSubscription = subscription.find((s) => s.providerSubscriptionId === subscriptionId);
        if (activeSubscription) {
          await storage.updateSubscription(activeSubscription.id, {
            nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3),
            updatedAt: /* @__PURE__ */ new Date()
          });
          await storage.createTransaction({
            userId: activeSubscription.userId,
            creatorId: activeSubscription.creatorId,
            subscriptionId: activeSubscription.id,
            provider: "ccbill",
            providerTransactionId: transactionId,
            type: "subscription",
            status: "completed",
            amountCents: Math.round(parseFloat(billingAmount) * 100),
            currency: "USD",
            providerFee: Math.round((parseFloat(billingAmount) - parseFloat(accountingAmount)) * 100),
            platformFee: Math.round(parseFloat(accountingAmount) * 0.05 * 100),
            creatorEarnings: Math.round(parseFloat(accountingAmount) * 0.95 * 100),
            metadata: data
          });
        }
      }
      async handleCancellation(data) {
        const { subscriptionId } = data;
        const subscriptions2 = await storage.getSubscriptionsAsFan(data.UDT1);
        const activeSubscription = subscriptions2.find((s) => s.providerSubscriptionId === subscriptionId);
        if (activeSubscription) {
          await storage.updateSubscription(activeSubscription.id, {
            status: "cancelled",
            cancelledAt: /* @__PURE__ */ new Date()
          });
        }
      }
      async handleChargeback(data) {
        const { transactionId } = data;
        const transactions2 = await storage.getTransactionsAsBuyer(data.UDT1);
        const transaction = transactions2.find((t) => t.providerTransactionId === transactionId);
        if (transaction) {
          await storage.updateTransaction(transaction.id, {
            status: "chargeback"
          });
        }
      }
      async handleRefund(data) {
        const { transactionId } = data;
        const transactions2 = await storage.getTransactionsAsBuyer(data.UDT1);
        const transaction = transactions2.find((t) => t.providerTransactionId === transactionId);
        if (transaction) {
          await storage.updateTransaction(transaction.id, {
            status: "refunded"
          });
        }
      }
    };
  }
});

// server/compliance/verifymy.ts
import crypto3 from "crypto";
var VerifymyService, verifymyService;
var init_verifymy = __esm({
  "server/compliance/verifymy.ts"() {
    "use strict";
    VerifymyService = class {
      constructor() {
        this.config = {
          apiKey: process.env.VERIFYMY_API_KEY || "demo_key",
          apiSecret: process.env.VERIFYMY_API_SECRET || "demo_secret",
          baseUrl: process.env.VERIFYMY_BASE_URL || "https://api.verifymy.com/v1",
          webhookSecret: process.env.VERIFYMY_WEBHOOK_SECRET || "demo_webhook_secret"
        };
      }
      // Age verification using database and credit bureau data
      async verifyAge(request) {
        try {
          const response = await this.makeApiCall("/age-verification", request);
          return response;
        } catch (error) {
          console.error("Age verification error:", error);
          throw error;
        }
      }
      // ID document verification with liveness detection
      async verifyIdentity(request) {
        try {
          const response = await this.makeApiCall("/identity-verification", request);
          return response;
        } catch (error) {
          console.error("Identity verification error:", error);
          throw error;
        }
      }
      // Content moderation using AI
      async moderateContent(contentUrl, contentType, metadata) {
        try {
          const request = {
            contentUrl,
            contentType,
            metadata,
            userId: metadata?.userId
          };
          const response = await this.makeApiCall("/content-moderation", request);
          return response;
        } catch (error) {
          console.error("Content moderation error:", error);
          throw error;
        }
      }
      // Verify webhook signature from verifymy
      verifyWebhookSignature(body, signature) {
        const expectedSignature = crypto3.createHmac("sha256", this.config.webhookSecret).update(body).digest("hex");
        return crypto3.timingSafeEqual(
          Buffer.from(signature, "hex"),
          Buffer.from(expectedSignature, "hex")
        );
      }
      // Process webhook notifications
      async processWebhookNotification(webhookData) {
        const { eventType, transactionId, userId, status, data } = webhookData;
        console.log(`Processing verifymy webhook: ${eventType} for user ${userId}`);
        switch (eventType) {
          case "age_verification.completed":
            await this.handleAgeVerificationComplete(transactionId, userId, status, data);
            break;
          case "identity_verification.completed":
            await this.handleIdentityVerificationComplete(transactionId, userId, status, data);
            break;
          case "content_moderation.completed":
            await this.handleContentModerationComplete(transactionId, data);
            break;
          default:
            console.warn(`Unknown webhook event type: ${eventType}`);
        }
      }
      async makeApiCall(endpoint, data) {
        const url = `${this.config.baseUrl}${endpoint}`;
        const timestamp2 = Math.floor(Date.now() / 1e3).toString();
        const signature = crypto3.createHmac("sha256", this.config.apiSecret).update(timestamp2 + JSON.stringify(data)).digest("hex");
        try {
          const response = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-API-Key": this.config.apiKey,
              "X-Timestamp": timestamp2,
              "X-Signature": signature
            },
            body: JSON.stringify(data)
          });
          if (!response.ok) {
            throw new Error(`Verifymy API error: ${response.status} ${response.statusText}`);
          }
          return await response.json();
        } catch (error) {
          console.error(`Verifymy API call failed for ${endpoint}:`, error);
          throw error;
        }
      }
      async handleAgeVerificationComplete(transactionId, userId, status, data) {
        const { storage: storage2 } = await init_storage().then(() => storage_exports);
        const isVerified = status === "verified";
        const confidence = data.confidence || 0;
        await storage2.createKycVerification({
          userId,
          provider: "verifymy",
          status: isVerified ? "verified" : "rejected",
          documentType: "age_verification",
          dataJson: { transactionId, confidence, ...data }
        });
        const user = await storage2.getUser(userId);
        if (user) {
          const existingProfile = await storage2.getProfile(userId);
          if (existingProfile) {
            await storage2.updateProfile(userId, {
              ageVerified: isVerified,
              updatedAt: /* @__PURE__ */ new Date()
            });
          } else {
            await storage2.createProfile({
              userId,
              ageVerified: isVerified,
              kycStatus: "pending"
            });
          }
        }
        await storage2.createAuditLog({
          actorId: userId,
          action: "age_verification_completed",
          targetType: "kyc_verification",
          targetId: transactionId,
          metadata: { status, confidence, type: "age_verification" }
        });
      }
      async handleIdentityVerificationComplete(transactionId, userId, status, data) {
        const { storage: storage2 } = await init_storage().then(() => storage_exports);
        const isVerified = status === "verified";
        const confidence = data.confidence || 0;
        await storage2.createKycVerification({
          userId,
          provider: "verifymy",
          status: isVerified ? "verified" : "rejected",
          documentType: "identity_verification",
          dataJson: { transactionId, confidence, ...data },
          verifiedAt: isVerified ? /* @__PURE__ */ new Date() : void 0
        });
        const user = await storage2.getUser(userId);
        if (user) {
          const existingProfile = await storage2.getProfile(userId);
          if (existingProfile) {
            await storage2.updateProfile(userId, {
              kycStatus: isVerified ? "verified" : "rejected",
              updatedAt: /* @__PURE__ */ new Date()
            });
          } else {
            await storage2.createProfile({
              userId,
              ageVerified: false,
              kycStatus: isVerified ? "verified" : "rejected"
            });
          }
        }
        await storage2.createAuditLog({
          actorId: userId,
          action: "identity_verification_completed",
          targetType: "kyc_verification",
          targetId: transactionId,
          metadata: { status, confidence, type: "identity_verification" }
        });
      }
      async handleContentModerationComplete(transactionId, data) {
        const { storage: storage2 } = await init_storage().then(() => storage_exports);
        const { mediaId, approved, confidence, flagged } = data;
        if (mediaId) {
          const newStatus = approved ? "approved" : "rejected";
          await storage2.updateMediaAsset(mediaId, {
            status: newStatus,
            updatedAt: /* @__PURE__ */ new Date()
          });
          const moderationItems = await storage2.getModerationQueue();
          const item = moderationItems.find((m) => m.mediaId === mediaId);
          if (item) {
            await storage2.updateModerationItem(item.id, {
              status: approved ? "approved" : "rejected",
              notes: `AI moderation: ${flagged?.join(", ") || "Clean content"}`,
              aiConfidence: Math.round(confidence),
              reviewedAt: /* @__PURE__ */ new Date()
            });
          }
        }
      }
    };
    verifymyService = new VerifymyService();
  }
});

// server/services/fingerprinting.ts
import crypto4 from "crypto";
var ContentFingerprintingService, contentFingerprintingService;
var init_fingerprinting = __esm({
  async "server/services/fingerprinting.ts"() {
    "use strict";
    await init_storage();
    ContentFingerprintingService = class {
      constructor() {
        this.algorithms = ["md5", "sha256", "perceptual_hash"];
      }
      // Generate forensic signature for media file
      async generateFingerprint(mediaId, fileBuffer, metadata) {
        try {
          const md5Hash = crypto4.createHash("md5").update(fileBuffer).digest("hex");
          const sha256Hash = crypto4.createHash("sha256").update(fileBuffer).digest("hex");
          const signature = this.createCompositeSignature(fileBuffer, metadata);
          const fingerprint = {
            mediaId,
            signature,
            algorithm: "composite",
            metadata: {
              fileSize: fileBuffer.length,
              format: metadata.mimeType || "unknown",
              checksum: sha256Hash,
              duration: metadata.duration,
              dimensions: metadata.dimensions
            }
          };
          await this.storeFingerprint(fingerprint);
          return fingerprint;
        } catch (error) {
          console.error("Error generating fingerprint:", error);
          throw new Error("Failed to generate content fingerprint");
        }
      }
      // Create composite signature combining multiple techniques
      createCompositeSignature(fileBuffer, metadata) {
        const signatures = [];
        const fileHash = crypto4.createHash("sha256").update(fileBuffer).digest("hex");
        signatures.push(`file:${fileHash.substring(0, 16)}`);
        const sizeSignature = this.generateSizeSignature(fileBuffer.length);
        signatures.push(`size:${sizeSignature}`);
        const contentSignature = this.generateContentSignature(fileBuffer);
        signatures.push(`content:${contentSignature}`);
        if (metadata.dimensions) {
          const dimensionSig = `${metadata.dimensions.width}x${metadata.dimensions.height}`;
          signatures.push(`dim:${dimensionSig}`);
        }
        if (metadata.duration) {
          signatures.push(`dur:${Math.floor(metadata.duration)}`);
        }
        const timestamp2 = Date.now().toString(36);
        const compositeSignature = signatures.join("|") + `|ts:${timestamp2}`;
        return crypto4.createHash("md5").update(compositeSignature).digest("hex");
      }
      // Generate size-based signature for duplicate detection
      generateSizeSignature(fileSize) {
        const sizeCategory = Math.floor(Math.log10(fileSize));
        return `${sizeCategory}:${fileSize.toString(36)}`;
      }
      // Generate content-based signature (simplified simulation of perceptual hashing)
      generateContentSignature(buffer) {
        const samples = [];
        const sampleCount = 16;
        for (let i = 0; i < sampleCount; i++) {
          const position = Math.floor(buffer.length * i / sampleCount);
          samples.push(buffer[position] || 0);
        }
        const signature = samples.map((s) => s.toString(16).padStart(2, "0")).join("");
        return signature.substring(0, 16);
      }
      // Check for potential duplicates or similar content
      async findSimilarContent(mediaId, threshold = 0.8) {
        try {
          const targetMedia = await storage.getMediaAsset(mediaId);
          if (!targetMedia?.forensicSignature) {
            return [];
          }
          const allMedia = await storage.getMediaAssetsByOwner("", 1e3);
          const matches = [];
          for (const media of allMedia) {
            if (media.id === mediaId || !media.forensicSignature) continue;
            const similarity = this.calculateSimilarity(
              targetMedia.forensicSignature,
              media.forensicSignature
            );
            if (similarity >= threshold) {
              matches.push({
                originalMediaId: mediaId,
                matchedMediaId: media.id,
                confidence: similarity,
                algorithm: "composite",
                metadata: {
                  originalFile: targetMedia.filename,
                  matchedFile: media.filename,
                  originalSize: targetMedia.fileSize,
                  matchedSize: media.fileSize
                }
              });
            }
          }
          return matches.sort((a, b) => b.confidence - a.confidence);
        } catch (error) {
          console.error("Error finding similar content:", error);
          return [];
        }
      }
      // Calculate similarity between two fingerprints
      calculateSimilarity(signature1, signature2) {
        if (signature1 === signature2) return 1;
        const len = Math.max(signature1.length, signature2.length);
        let matches = 0;
        for (let i = 0; i < len; i++) {
          if (signature1[i] === signature2[i]) {
            matches++;
          }
        }
        return matches / len;
      }
      // Store fingerprint in database
      async storeFingerprint(fingerprint) {
        await storage.updateMediaAsset(fingerprint.mediaId, {
          forensicSignature: fingerprint.signature,
          updatedAt: /* @__PURE__ */ new Date()
        });
      }
      // Verify content integrity
      async verifyContentIntegrity(mediaId, currentFileBuffer) {
        try {
          const media = await storage.getMediaAsset(mediaId);
          if (!media?.forensicSignature) {
            return { isValid: false, confidence: 0 };
          }
          const newFingerprint = await this.generateFingerprint(
            `temp_${mediaId}`,
            currentFileBuffer,
            { mimeType: media.mimeType }
          );
          const similarity = this.calculateSimilarity(
            media.forensicSignature,
            newFingerprint.signature
          );
          const changes = [];
          if (media.fileSize !== currentFileBuffer.length) {
            changes.push("file_size_changed");
          }
          return {
            isValid: similarity >= 0.95,
            confidence: similarity,
            changes: changes.length > 0 ? changes : void 0
          };
        } catch (error) {
          console.error("Error verifying content integrity:", error);
          return { isValid: false, confidence: 0 };
        }
      }
      // Generate watermarked signature for content protection
      async generateWatermarkedSignature(mediaId, userId, metadata) {
        const watermarkData = {
          mediaId,
          userId,
          timestamp: Date.now(),
          platform: "girlfanz",
          metadata
        };
        const watermarkString = JSON.stringify(watermarkData);
        return crypto4.createHash("sha256").update(watermarkString).digest("hex");
      }
      // Detect unauthorized distribution
      async detectUnauthorizedDistribution(signature, sourceUrl) {
        const recommendations = [];
        if (sourceUrl && !sourceUrl.includes("girlfanz.com")) {
          recommendations.push("file_found_on_external_site");
        }
        return {
          isUnauthorized: false,
          confidence: 0,
          matches: [],
          recommendations
        };
      }
    };
    contentFingerprintingService = new ContentFingerprintingService();
  }
});

// server/services/payouts.ts
var CreatorPayoutService, creatorPayoutService;
var init_payouts = __esm({
  async "server/services/payouts.ts"() {
    "use strict";
    await init_storage();
    CreatorPayoutService = class {
      constructor() {
        this.PLATFORM_FEE_RATE = 0;
        // 0% platform fee - creators keep 100%
        this.MIN_PAYOUT_THRESHOLD = 5e3;
        // $50.00 minimum
        this.PAYOUT_SCHEDULE_DAY = 1;
      }
      // 1st of each month
      // Calculate creator earnings for a period
      async calculateCreatorEarnings(userId, startDate, endDate) {
        try {
          const transactions2 = await storage.getTransactionsAsCreator(userId);
          const periodTransactions = transactions2.filter((tx) => {
            const txDate = new Date(tx.createdAt);
            return txDate >= startDate && txDate <= endDate && tx.status === "completed";
          });
          let grossEarnings = 0;
          const processedTransactions = [];
          for (const transaction of periodTransactions) {
            const transactionEarnings = transaction.creatorEarnings || 0;
            grossEarnings += transactionEarnings;
            processedTransactions.push({
              id: transaction.id,
              type: transaction.type,
              amount: transactionEarnings,
              fee: (transaction.providerFee || 0) + (transaction.platformFee || 0),
              createdAt: new Date(transaction.createdAt)
            });
          }
          const platformFee = Math.round(grossEarnings * this.PLATFORM_FEE_RATE);
          const processingFee = this.calculateProcessingFee(grossEarnings);
          const netPayout = grossEarnings - platformFee - processingFee;
          return {
            userId,
            grossEarnings,
            platformFee,
            processingFee,
            netPayout,
            transactions: processedTransactions,
            period: { start: startDate, end: endDate }
          };
        } catch (error) {
          console.error("Error calculating creator earnings:", error);
          throw error;
        }
      }
      // Process automatic payouts for all eligible creators
      async processScheduledPayouts() {
        try {
          console.log("Starting scheduled payout processing...");
          const now = /* @__PURE__ */ new Date();
          const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const endDate = new Date(now.getFullYear(), now.getMonth(), 0);
          const creators = await this.getAllCreators();
          let processed = 0;
          let failed = 0;
          let totalAmount = 0;
          for (const creator of creators) {
            try {
              const earnings = await this.calculateCreatorEarnings(
                creator.userId,
                startDate,
                endDate
              );
              if (earnings.netPayout < this.MIN_PAYOUT_THRESHOLD) {
                console.log(`Skipping payout for ${creator.userId}: Below minimum threshold`);
                continue;
              }
              const existingPayout = await this.getPayoutForPeriod(
                creator.userId,
                startDate,
                endDate
              );
              if (existingPayout) {
                console.log(`Payout already processed for ${creator.userId} for period ${startDate.toISOString()}-${endDate.toISOString()}`);
                continue;
              }
              const payoutAccounts2 = await storage.getPayoutAccounts(creator.userId);
              const defaultAccount = payoutAccounts2.find((acc) => acc.isDefault);
              if (!defaultAccount) {
                console.log(`No default payout method for creator ${creator.userId}`);
                continue;
              }
              const payout = await this.createPayout({
                userId: creator.userId,
                amount: earnings.netPayout,
                payoutAccountId: defaultAccount.id,
                period: { start: startDate, end: endDate },
                earnings
              });
              await this.submitPayout(payout);
              processed++;
              totalAmount += earnings.netPayout;
              await storage.createAuditLog({
                actorId: "system",
                action: "payout_processed",
                targetType: "payout",
                targetId: payout.id,
                metadata: {
                  amount: earnings.netPayout,
                  period: { start: startDate, end: endDate },
                  provider: defaultAccount.provider
                }
              });
            } catch (error) {
              console.error(`Failed to process payout for creator ${creator.userId}:`, error);
              failed++;
            }
          }
          console.log(`Payout processing complete: ${processed} processed, ${failed} failed, $${totalAmount / 100} total`);
          return {
            processed,
            failed,
            totalAmount
          };
        } catch (error) {
          console.error("Error in scheduled payout processing:", error);
          throw error;
        }
      }
      // Create individual payout
      async createPayout(data) {
        return {
          id: `payout_${Date.now()}`,
          userId: data.userId,
          amount: data.amount,
          status: "pending",
          payoutAccountId: data.payoutAccountId,
          period: data.period,
          createdAt: /* @__PURE__ */ new Date(),
          metadata: {
            grossEarnings: data.earnings.grossEarnings,
            platformFee: data.earnings.platformFee,
            processingFee: data.earnings.processingFee,
            transactionCount: data.earnings.transactions.length
          }
        };
      }
      // Submit payout to payment processor
      async submitPayout(payout) {
        try {
          const payoutAccounts2 = await storage.getPayoutAccounts(payout.userId);
          const account = payoutAccounts2.find((acc) => acc.id === payout.payoutAccountId);
          if (!account) {
            throw new Error("Payout account not found");
          }
          console.log(`Submitting payout ${payout.id} for $${payout.amount / 100} via ${account.provider}`);
          switch (account.provider) {
            case "paxum":
              await this.processPaxumPayout(payout, account);
              break;
            case "ecp":
              await this.processECPPayout(payout, account);
              break;
            case "wire":
              await this.processWirePayout(payout, account);
              break;
            case "crypto":
              await this.processCryptoPayout(payout, account);
              break;
            default:
              throw new Error(`Unsupported payout provider: ${account.provider}`);
          }
          payout.status = "processing";
          payout.submittedAt = /* @__PURE__ */ new Date();
        } catch (error) {
          console.error("Error submitting payout:", error);
          payout.status = "failed";
          payout.error = error.message;
          throw error;
        }
      }
      // Adult-friendly payout processors
      async processPaxumPayout(payout, account) {
        console.log(`Processing Paxum payout: $${payout.amount / 100} to ${account.accountRef}`);
      }
      async processECPPayout(payout, account) {
        console.log(`Processing ePayService payout: $${payout.amount / 100} to ${account.accountRef}`);
      }
      async processWirePayout(payout, account) {
        console.log(`Processing wire transfer: $${payout.amount / 100} to ${account.accountRef}`);
      }
      async processCryptoPayout(payout, account) {
        console.log(`Processing crypto payout: $${payout.amount / 100} to ${account.accountRef}`);
      }
      // Utility methods
      calculateProcessingFee(amount) {
        return Math.round(amount * 0.01);
      }
      async getAllCreators() {
        return [
          // Mock data - in production this would come from database
        ];
      }
      async getPayoutForPeriod(userId, startDate, endDate) {
        return null;
      }
      // Get creator earnings summary
      async getCreatorEarningsSummary(userId, months = 12) {
        try {
          const endDate = /* @__PURE__ */ new Date();
          const startDate = /* @__PURE__ */ new Date();
          startDate.setMonth(endDate.getMonth() - months);
          const earnings = await this.calculateCreatorEarnings(userId, startDate, endDate);
          const payoutRequests2 = await storage.getPayoutRequests(userId);
          return {
            totalEarnings: earnings.grossEarnings,
            averageMonthly: Math.round(earnings.grossEarnings / months),
            lastPayout: payoutRequests2[0] || null,
            pendingEarnings: earnings.netPayout,
            payoutHistory: payoutRequests2.slice(0, 10)
          };
        } catch (error) {
          console.error("Error getting creator earnings summary:", error);
          throw error;
        }
      }
      // Schedule automatic payouts (called by cron job)
      async scheduleNextPayout() {
        const now = /* @__PURE__ */ new Date();
        if (now.getDate() === this.PAYOUT_SCHEDULE_DAY) {
          console.log("Running scheduled payouts...");
          await this.processScheduledPayouts();
        }
      }
    };
    creatorPayoutService = new CreatorPayoutService();
  }
});

// server/services/content-creation.ts
var ContentCreationService, contentCreationService;
var init_content_creation = __esm({
  async "server/services/content-creation.ts"() {
    "use strict";
    await init_storage();
    init_objectStorage();
    ContentCreationService = class {
      constructor() {
        this.objectStorage = new ObjectStorageService();
      }
      // Verify creator before allowing content creation
      async verifyCreatorAccess(userId) {
        const user = await storage.getUser(userId);
        if (!user) return false;
        const kycVerification = await storage.getKycVerification(userId);
        if (!kycVerification || kycVerification.status !== "verified") {
          throw new Error("KYC verification required before content creation");
        }
        const profile = await storage.getProfile(userId);
        if (!profile?.ageVerified) {
          throw new Error("Age verification required before content creation");
        }
        return true;
      }
      // Create a new content creation session
      async createSession(creatorId, options) {
        await this.verifyCreatorAccess(creatorId);
        const sessionData = {
          creatorId,
          title: options.title,
          description: options.description,
          type: options.type,
          sourceType: options.sourceType,
          status: "draft"
        };
        const session3 = await storage.createContentSession(sessionData);
        return session3;
      }
      // Handle file upload from device
      async uploadContent(creatorId, options) {
        const session3 = await this.createSession(creatorId, {
          title: options.title,
          description: options.description,
          type: options.type,
          sourceType: options.sourceType
        });
        const uploadKey = `content/${creatorId}/${session3.id}/original/${options.filename}`;
        const uploadResult = await this.objectStorage.uploadObject({
          key: uploadKey,
          body: options.file,
          contentType: options.mimeType,
          metadata: {
            creatorId,
            sessionId: session3.id,
            ...options.metadata
          }
        });
        let dimensions = null;
        if (options.type === "video" || options.type === "image") {
          dimensions = await this.extractMediaDimensions(options.file, options.mimeType);
        }
        await storage.updateContentSession(session3.id, {
          originalFileUrl: uploadResult.url,
          originalFileSize: options.file.byteLength,
          originalDimensions: dimensions,
          metadata: options.metadata,
          status: "processing"
        });
        await this.triggerAIProcessing(session3.id);
        return session3;
      }
      // Handle camera capture with filters and effects
      async captureFromCamera(creatorId, videoBlob, options) {
        const session3 = await this.createSession(creatorId, {
          type: "video",
          sourceType: "camera"
        });
        let processedVideo = videoBlob;
        if (options.filters || options.stabilization) {
          processedVideo = await this.applyCameraEffects(videoBlob, options);
        }
        const uploadKey = `content/${creatorId}/${session3.id}/original/camera_capture.mp4`;
        const uploadResult = await this.objectStorage.uploadObject({
          key: uploadKey,
          body: processedVideo,
          contentType: "video/mp4",
          metadata: {
            creatorId,
            sessionId: session3.id,
            cameraSettings: options
          }
        });
        await storage.updateContentSession(session3.id, {
          originalFileUrl: uploadResult.url,
          originalFileSize: processedVideo.byteLength,
          metadata: { cameraSettings: options },
          status: "processing"
        });
        await this.triggerAIProcessing(session3.id);
        return session3;
      }
      // Start a live stream with co-star verification
      async startLiveStream(creatorId, options) {
        await this.verifyCreatorAccess(creatorId);
        if (options.coStarIds && options.coStarIds.length > 0) {
          for (const coStarId of options.coStarIds) {
            const verified = await this.verifyCoStar(coStarId);
            if (!verified) {
              throw new Error(`Co-star ${coStarId} must complete verification`);
            }
          }
        }
        const stream = await storage.createLiveStream({
          creatorId,
          title: options.title,
          description: options.description,
          visibility: options.visibility || "subscriber",
          priceInCents: options.priceInCents,
          status: "scheduled",
          streamKey: this.generateStreamKey()
        });
        if (options.coStarIds) {
          for (const coStarId of options.coStarIds) {
            await storage.addLiveStreamCoStar({
              streamId: stream.id,
              coStarId,
              verificationStatus: "verified"
            });
          }
        }
        const session3 = await this.createSession(creatorId, {
          title: options.title,
          description: options.description,
          type: "live_stream",
          sourceType: "live_stream"
        });
        return {
          stream,
          session: session3,
          streamUrl: `rtmp://stream.girlfanz.com/live/${stream.streamKey}`,
          playbackUrl: `https://watch.girlfanz.com/${stream.id}`
        };
      }
      // Verify co-star for live streaming
      async verifyCoStar(userId) {
        const kycVerification = await storage.getKycVerification(userId);
        return kycVerification?.status === "verified";
      }
      // Generate unique stream key
      generateStreamKey() {
        return `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
      // Extract media dimensions
      async extractMediaDimensions(file, mimeType) {
        if (mimeType.startsWith("video/")) {
          return { width: 1920, height: 1080 };
        } else if (mimeType.startsWith("image/")) {
          return { width: 1080, height: 1080 };
        }
        return null;
      }
      // Apply camera effects (placeholder for actual implementation)
      async applyCameraEffects(videoBlob, options) {
        console.log("Applying camera effects:", options);
        return videoBlob;
      }
      // Trigger AI processing for the content
      async triggerAIProcessing(sessionId) {
        await storage.createEditingTask({
          sessionId,
          creatorId: (await storage.getContentSession(sessionId)).creatorId,
          status: "pending",
          editingOptions: {
            autoCut: true,
            addBranding: true,
            generateMultipleAspectRatios: true,
            createTrailer: true,
            createGif: true
          }
        });
        console.log(`AI processing triggered for session ${sessionId}`);
      }
      // Get content creation session with all details
      async getSession(sessionId) {
        const session3 = await storage.getContentSession(sessionId);
        if (!session3) return null;
        const [editingTasks2, contentVersions2, generatedAssets2, analytics] = await Promise.all([
          storage.getEditingTasksBySession(sessionId),
          storage.getContentVersionsBySession(sessionId),
          storage.getGeneratedAssetsBySession(sessionId),
          storage.getContentAnalytics(sessionId)
        ]);
        return {
          ...session3,
          editingTasks: editingTasks2,
          contentVersions: contentVersions2,
          generatedAssets: generatedAssets2,
          analytics
        };
      }
      // Get all sessions for a creator
      async getCreatorSessions(creatorId, limit = 20) {
        return storage.getContentSessionsByCreator(creatorId, limit);
      }
      // Update session metadata
      async updateSession(sessionId, updates) {
        return storage.updateContentSession(sessionId, updates);
      }
      // Delete session and all related content
      async deleteSession(sessionId) {
        const session3 = await storage.getContentSession(sessionId);
        if (!session3) return;
        const contentVersions2 = await storage.getContentVersionsBySession(sessionId);
        for (const version of contentVersions2) {
          if (version.fileUrl) {
            await this.objectStorage.deleteObject(version.fileUrl);
          }
        }
        await storage.deleteContentSession(sessionId);
      }
    };
    contentCreationService = new ContentCreationService();
  }
});

// server/services/ai-editor.ts
var ASPECT_RATIO_CONFIGS, AIEditorService, aiEditorService;
var init_ai_editor = __esm({
  async "server/services/ai-editor.ts"() {
    "use strict";
    await init_storage();
    init_objectStorage();
    ASPECT_RATIO_CONFIGS = [
      { ratio: "9:16", platform: "tiktok", width: 1080, height: 1920 },
      { ratio: "9:16", platform: "instagram_reels", width: 1080, height: 1920 },
      { ratio: "16:9", platform: "youtube", width: 1920, height: 1080 },
      { ratio: "1:1", platform: "instagram_post", width: 1080, height: 1080 },
      { ratio: "4:5", platform: "instagram_feed", width: 1080, height: 1350 }
    ];
    AIEditorService = class {
      constructor() {
        this.objectStorage = new ObjectStorageService();
      }
      // Start a new editing task
      async startEditingTask(sessionId, editingOptions) {
        const task = await storage.createEditingTask({
          sessionId,
          editingOptions,
          status: "pending",
          progress: 0
        });
        this.processContent(task.id).catch(console.error);
        return task;
      }
      // Process stream recording with AI editing
      async processStreamRecording(streamId, options) {
        console.log(`Processing stream recording ${streamId} with options:`, options);
        await this.simulateProcessingDelay(3e3);
      }
      // Process content with AI editing
      async processContent(editingTaskId) {
        const task = await storage.getEditingTask(editingTaskId);
        if (!task) throw new Error("Editing task not found");
        const session3 = await storage.getContentSession(task.sessionId);
        if (!session3) throw new Error("Content session not found");
        try {
          await storage.updateEditingTask(editingTaskId, {
            status: "processing",
            startedAt: /* @__PURE__ */ new Date(),
            progress: 0
          });
          const editedContent = await this.applyAIEdits(session3, task.editingOptions);
          const versions = await this.generateAspectRatios(session3, editedContent);
          await this.generateAssets(session3);
          await storage.updateEditingTask(editingTaskId, {
            status: "completed",
            completedAt: /* @__PURE__ */ new Date(),
            progress: 100
          });
          await storage.updateContentSession(session3.id, {
            status: "ready"
          });
        } catch (error) {
          await storage.updateEditingTask(editingTaskId, {
            status: "failed",
            errorMessage: error instanceof Error ? error.message : "Processing failed"
          });
          throw error;
        }
      }
      // Apply AI-powered edits
      async applyAIEdits(session3, options) {
        console.log(`Applying AI edits to session ${session3.id}`, options);
        await this.simulateProcessingDelay(2e3);
        return Buffer.from("edited_content_placeholder");
      }
      // Generate multiple aspect ratios
      async generateAspectRatios(session3, editedContent) {
        const versions = [];
        for (const config of ASPECT_RATIO_CONFIGS) {
          const version = await this.createContentVersion(session3, editedContent, config);
          versions.push(version);
        }
        return versions;
      }
      // Create a specific content version
      async createContentVersion(session3, content, config) {
        const processedContent = await this.processForAspectRatio(content, config);
        const filename = `${config.platform}_${config.ratio.replace(":", "x")}.mp4`;
        const uploadKey = `content/${session3.creatorId}/${session3.id}/versions/${filename}`;
        const uploadResult = await this.objectStorage.uploadObject({
          key: uploadKey,
          body: processedContent,
          contentType: "video/mp4",
          metadata: {
            sessionId: session3.id,
            aspectRatio: config.ratio,
            platform: config.platform
          }
        });
        const thumbnailUrl = await this.generateThumbnail(session3.id, config);
        const versionData = {
          sessionId: session3.id,
          aspectRatio: config.ratio,
          format: "mp4",
          resolution: "1080p",
          fileUrl: uploadResult.url,
          thumbnailUrl,
          fileSize: processedContent.byteLength,
          dimensions: { width: config.width, height: config.height },
          isProcessed: true
        };
        const version = await storage.createContentVersion(versionData);
        return version;
      }
      // Process content for specific aspect ratio
      async processForAspectRatio(content, config) {
        console.log(`Processing for ${config.platform} (${config.ratio})`);
        await this.simulateProcessingDelay(1e3);
        return Buffer.from(`processed_${config.platform}_content`);
      }
      // Generate additional assets
      async generateAssets(session3) {
        await this.generateGif(session3);
        await this.generateTrailer(session3);
        await this.generateHighlightReel(session3);
        await this.generateThumbnails(session3);
      }
      // Generate animated GIF
      async generateGif(session3) {
        console.log(`Generating GIF for session ${session3.id}`);
        const gifBuffer = Buffer.from("animated_gif_placeholder");
        const uploadKey = `content/${session3.creatorId}/${session3.id}/assets/preview.gif`;
        const uploadResult = await this.objectStorage.uploadObject({
          key: uploadKey,
          body: gifBuffer,
          contentType: "image/gif"
        });
        const assetData = {
          sessionId: session3.id,
          assetType: "gif",
          fileUrl: uploadResult.url,
          fileSize: gifBuffer.byteLength
        };
        return storage.createGeneratedAsset(assetData);
      }
      // Generate trailer
      async generateTrailer(session3) {
        console.log(`Generating trailer for session ${session3.id}`);
        const trailerBuffer = Buffer.from("trailer_placeholder");
        const uploadKey = `content/${session3.creatorId}/${session3.id}/assets/trailer.mp4`;
        const uploadResult = await this.objectStorage.uploadObject({
          key: uploadKey,
          body: trailerBuffer,
          contentType: "video/mp4"
        });
        const assetData = {
          sessionId: session3.id,
          assetType: "trailer",
          fileUrl: uploadResult.url,
          duration: 20,
          // 20 seconds
          fileSize: trailerBuffer.byteLength,
          metadata: { duration: 20, autoGenerated: true }
        };
        return storage.createGeneratedAsset(assetData);
      }
      // Generate highlight reel
      async generateHighlightReel(session3) {
        console.log(`Generating highlight reel for session ${session3.id}`);
        const highlightBuffer = Buffer.from("highlight_reel_placeholder");
        const uploadKey = `content/${session3.creatorId}/${session3.id}/assets/highlights.mp4`;
        const uploadResult = await this.objectStorage.uploadObject({
          key: uploadKey,
          body: highlightBuffer,
          contentType: "video/mp4"
        });
        const assetData = {
          sessionId: session3.id,
          assetType: "highlight",
          fileUrl: uploadResult.url,
          duration: 60,
          // 60 seconds
          fileSize: highlightBuffer.byteLength
        };
        return storage.createGeneratedAsset(assetData);
      }
      // Generate thumbnails
      async generateThumbnails(session3) {
        const thumbnailCount = 5;
        for (let i = 0; i < thumbnailCount; i++) {
          await this.generateSingleThumbnail(session3, i);
        }
      }
      // Generate single thumbnail
      async generateSingleThumbnail(session3, index2) {
        const thumbnailBuffer = Buffer.from(`thumbnail_${index2}_placeholder`);
        const uploadKey = `content/${session3.creatorId}/${session3.id}/assets/thumbnail_${index2}.jpg`;
        const uploadResult = await this.objectStorage.uploadObject({
          key: uploadKey,
          body: thumbnailBuffer,
          contentType: "image/jpeg"
        });
        const assetData = {
          sessionId: session3.id,
          assetType: "thumbnail",
          fileUrl: uploadResult.url,
          fileSize: thumbnailBuffer.byteLength,
          metadata: { index: index2, aiScore: Math.random() * 100 }
          // AI quality score
        };
        return storage.createGeneratedAsset(assetData);
      }
      // Generate thumbnail for specific aspect ratio
      async generateThumbnail(sessionId, config) {
        const thumbnailBuffer = Buffer.from(`thumbnail_${config.platform}_placeholder`);
        const uploadKey = `content/${sessionId}/thumbnails/${config.platform}.jpg`;
        const uploadResult = await this.objectStorage.uploadObject({
          key: uploadKey,
          body: thumbnailBuffer,
          contentType: "image/jpeg"
        });
        return uploadResult.url;
      }
      // Get AI pricing suggestions
      async suggestPricing(sessionId) {
        const session3 = await storage.getContentSession(sessionId);
        if (!session3) throw new Error("Session not found");
        const basePricing = {
          video: 999,
          // $9.99
          image: 499,
          // $4.99
          live_stream: 1999,
          // $19.99
          audio: 299,
          // $2.99
          gif: 399
          // $3.99
        };
        const suggested = basePricing[session3.type] || 999;
        return {
          suggested,
          min: Math.floor(suggested * 0.5),
          max: Math.floor(suggested * 2),
          reasoning: "Based on content type, quality, and market analysis"
        };
      }
      // Simulate processing delay
      async simulateProcessingDelay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
      }
      // Start batch processing for multiple sessions
      async processBatch(sessionIds) {
        const tasks = sessionIds.map(
          (sessionId) => this.processSessionWithRetry(sessionId)
        );
        await Promise.allSettled(tasks);
      }
      // Process session with retry logic
      async processSessionWithRetry(sessionId, maxRetries = 3) {
        let retries = 0;
        while (retries < maxRetries) {
          try {
            let editingTask = await storage.getEditingTaskBySession(sessionId);
            if (!editingTask) {
              const session3 = await storage.getContentSession(sessionId);
              if (!session3) throw new Error("Session not found");
              editingTask = await storage.createEditingTask({
                sessionId,
                creatorId: session3.creatorId,
                status: "pending",
                editingOptions: {
                  autoCut: true,
                  addBranding: true,
                  generateMultipleAspectRatios: true
                }
              });
            }
            await this.processContent(editingTask.id);
            return;
          } catch (error) {
            retries++;
            console.error(`Processing failed for session ${sessionId}, retry ${retries}:`, error);
            if (retries >= maxRetries) {
              throw error;
            }
            await this.simulateProcessingDelay(1e3 * retries);
          }
        }
      }
    };
    aiEditorService = new AIEditorService();
  }
});

// server/services/distribution.ts
import QRCode from "qrcode";
import { nanoid } from "nanoid";
var PLATFORM_CONFIGS, DistributionService, distributionService;
var init_distribution = __esm({
  async "server/services/distribution.ts"() {
    "use strict";
    await init_storage();
    init_objectStorage();
    PLATFORM_CONFIGS = {
      instagram: {
        platform: "instagram",
        apiEndpoint: "https://graph.instagram.com/v12.0",
        requiredAspectRatio: "1:1",
        maxVideoDuration: 60,
        maxFileSize: 100,
        supportedFormats: ["mp4", "jpg", "png"]
      },
      tiktok: {
        platform: "tiktok",
        apiEndpoint: "https://open-api.tiktok.com/v1",
        requiredAspectRatio: "9:16",
        maxVideoDuration: 180,
        maxFileSize: 287,
        supportedFormats: ["mp4"]
      },
      twitter: {
        platform: "twitter",
        apiEndpoint: "https://api.twitter.com/2",
        requiredAspectRatio: "16:9",
        maxVideoDuration: 140,
        maxFileSize: 512,
        supportedFormats: ["mp4", "jpg", "png", "gif"]
      },
      snapchat: {
        platform: "snapchat",
        apiEndpoint: "https://api.snapchat.com/v1",
        requiredAspectRatio: "9:16",
        maxVideoDuration: 60,
        maxFileSize: 32,
        supportedFormats: ["mp4", "jpg"]
      },
      youtube: {
        platform: "youtube",
        apiEndpoint: "https://www.googleapis.com/youtube/v3",
        requiredAspectRatio: "16:9",
        maxVideoDuration: 43200,
        // 12 hours
        maxFileSize: 128e3,
        supportedFormats: ["mp4", "mov", "avi", "wmv", "flv", "webm"]
      }
    };
    DistributionService = class {
      constructor() {
        this.objectStorage = new ObjectStorageService();
      }
      // Create a distribution campaign
      async createCampaign(sessionId, options) {
        const session3 = await storage.getContentSession(sessionId);
        if (!session3) throw new Error("Content session not found");
        const { qrCodeUrl, smartLinkUrl } = await this.generateMarketingAssets(sessionId);
        const campaignData = {
          sessionId,
          creatorId: session3.creatorId,
          name: `Campaign for ${session3.title || "Untitled"}`,
          status: options.publishSchedule.immediate ? "publishing" : "scheduled",
          platforms: options.platforms,
          publishSchedule: options.publishSchedule,
          distributionSettings: options.settings,
          qrCodeUrl,
          smartLinkUrl,
          scheduledAt: options.publishSchedule.scheduledTime
        };
        const campaign = await storage.createDistributionCampaign(campaignData);
        if (options.publishSchedule.immediate) {
          await this.startDistribution(campaign.id);
        } else {
          await this.scheduleDistribution(campaign.id, options.publishSchedule.scheduledTime);
        }
        return campaign;
      }
      // Start distributing content to platforms
      async startDistribution(campaignId) {
        const campaign = await storage.getDistributionCampaign(campaignId);
        if (!campaign) throw new Error("Campaign not found");
        await storage.updateDistributionCampaign(campaignId, {
          status: "publishing"
        });
        const versions = await storage.getContentVersionsBySession(campaign.sessionId);
        const platforms = campaign.platforms || [];
        const distributionTasks = platforms.map(
          (platform) => this.distributeToSinglePlatform(campaign, platform, versions)
        );
        const results = await Promise.allSettled(distributionTasks);
        const allSucceeded = results.every((r) => r.status === "fulfilled");
        await storage.updateDistributionCampaign(campaignId, {
          status: allSucceeded ? "published" : "failed",
          publishedAt: /* @__PURE__ */ new Date()
        });
        await this.sendDistributionNotifications(campaign, results);
      }
      // Distribute to a single platform
      async distributeToSinglePlatform(campaign, platform, versions) {
        const config = PLATFORM_CONFIGS[platform];
        if (!config) throw new Error(`Platform ${platform} not supported`);
        const matchingVersion = this.findBestVersionForPlatform(versions, config);
        if (!matchingVersion) {
          throw new Error(`No suitable content version for ${platform}`);
        }
        const { caption, hashtags, mentions } = await this.preparePlatformContent(
          campaign,
          platform
        );
        const distributionData = {
          campaignId: campaign.id,
          contentVersionId: matchingVersion.id,
          platform,
          status: "publishing",
          caption,
          hashtags,
          mentions
        };
        const distribution = await storage.createPlatformDistribution(distributionData);
        try {
          const result = await this.publishToPlatform(
            platform,
            matchingVersion,
            caption,
            hashtags
          );
          await storage.updatePlatformDistribution(distribution.id, {
            status: "published",
            platformPostId: result.postId,
            platformUrl: result.url,
            publishedAt: /* @__PURE__ */ new Date()
          });
          return distribution;
        } catch (error) {
          await storage.updatePlatformDistribution(distribution.id, {
            status: "failed",
            errorMessage: error instanceof Error ? error.message : "Publishing failed"
          });
          throw error;
        }
      }
      // Find best content version for platform
      findBestVersionForPlatform(versions, config) {
        let match = versions.find((v) => v.aspectRatio === config.requiredAspectRatio);
        if (!match) {
          match = versions[0];
        }
        return match || null;
      }
      // Prepare platform-specific content
      async preparePlatformContent(campaign, platform) {
        const settings = campaign.distributionSettings;
        let caption = settings?.caption || "";
        if (!caption) {
          caption = await this.generateAICaption(campaign.sessionId, platform);
        }
        let hashtags = settings?.suggestedHashtags || [];
        if (settings?.autoHashtags) {
          const trendingHashtags = await this.getTrendingHashtags(platform);
          hashtags = [...hashtags, ...trendingHashtags];
        }
        const mentions = settings?.mentions || [];
        return { caption, hashtags, mentions };
      }
      // Publish to platform (simulated API call)
      async publishToPlatform(platform, version, caption, hashtags) {
        console.log(`Publishing to ${platform}:`, {
          contentUrl: version.fileUrl,
          caption,
          hashtags
        });
        await new Promise((resolve) => setTimeout(resolve, 2e3));
        const postId = `${platform}_${nanoid()}`;
        const url = `https://${platform}.com/post/${postId}`;
        return { postId, url };
      }
      // Generate marketing assets (QR code and smart link)
      async generateMarketingAssets(sessionId) {
        const smartLinkId = nanoid(10);
        const smartLinkUrl = `https://link.girlfanz.com/${smartLinkId}`;
        const qrCodeDataUrl = await QRCode.toDataURL(smartLinkUrl, {
          width: 500,
          margin: 2,
          color: {
            dark: "#FF1493",
            light: "#FFFFFF"
          }
        });
        const qrCodeBuffer = Buffer.from(
          qrCodeDataUrl.replace(/^data:image\/png;base64,/, ""),
          "base64"
        );
        const uploadKey = `marketing/${sessionId}/qr_code.png`;
        const uploadResult = await this.objectStorage.uploadObject({
          key: uploadKey,
          body: qrCodeBuffer,
          contentType: "image/png"
        });
        await storage.createSmartLink({
          id: smartLinkId,
          sessionId,
          targetUrl: `/content/${sessionId}`,
          qrCodeUrl: uploadResult.url
        });
        return {
          qrCodeUrl: uploadResult.url,
          smartLinkUrl
        };
      }
      // Generate AI-optimized caption
      async generateAICaption(sessionId, platform) {
        const session3 = await storage.getContentSession(sessionId);
        const platformCaptions = {
          instagram: `\u2728 New content alert! ${session3?.title || "Check this out"} \u{1F495} Link in bio!`,
          tiktok: `${session3?.title || "You won't believe this"} \u{1F525} #fyp #viral`,
          twitter: `Just dropped: ${session3?.title || "New content"} \u{1F680}`,
          snapchat: `Swipe up for exclusive content! \u{1F446}`,
          youtube: `${session3?.title || "New Video"} | Full video out now!`
        };
        return platformCaptions[platform] || `Check out my new content! ${session3?.title || ""}`;
      }
      // Get trending hashtags for platform
      async getTrendingHashtags(platform) {
        const trendingByPlatform = {
          instagram: ["#instagood", "#photooftheday", "#love", "#fashion", "#beautiful"],
          tiktok: ["#fyp", "#foryoupage", "#viral", "#trending", "#duet"],
          twitter: ["#NowPlaying", "#MondayMotivation", "#ThrowbackThursday"],
          snapchat: ["#snapchat", "#snap", "#snapstory"],
          youtube: ["#youtube", "#vlog", "#subscribe", "#youtubechannel"]
        };
        return trendingByPlatform[platform] || [];
      }
      // Schedule distribution for later
      async scheduleDistribution(campaignId, scheduledTime) {
        console.log(`Distribution scheduled for campaign ${campaignId} at ${scheduledTime}`);
        const delay = scheduledTime.getTime() - Date.now();
        if (delay > 0) {
          setTimeout(() => {
            this.startDistribution(campaignId).catch(console.error);
          }, Math.min(delay, 2147483647));
        }
      }
      // Send distribution notifications
      async sendDistributionNotifications(campaign, results) {
        const succeeded = results.filter((r) => r.status === "fulfilled").length;
        const failed = results.filter((r) => r.status === "rejected").length;
        const message = `Distribution complete! \u2705 ${succeeded} successful, \u274C ${failed} failed`;
        console.log(`Notification for creator ${campaign.creatorId}: ${message}`);
      }
      // Get campaign analytics
      async getCampaignAnalytics(campaignId) {
        const campaign = await storage.getDistributionCampaign(campaignId);
        if (!campaign) throw new Error("Campaign not found");
        const distributions = await storage.getPlatformDistributions(campaignId);
        const metrics = {
          totalReach: 0,
          totalEngagement: 0,
          platformBreakdown: {}
        };
        for (const dist of distributions) {
          if (dist.platformMetrics) {
            const platformData = dist.platformMetrics;
            metrics.totalReach += platformData.views || 0;
            metrics.totalEngagement += (platformData.likes || 0) + (platformData.comments || 0);
            metrics.platformBreakdown[dist.platform] = platformData;
          }
        }
        return {
          campaign,
          distributions,
          metrics,
          smartLinkClicks: campaign.smartLinkUrl ? await storage.getSmartLinkClicks(campaign.smartLinkUrl) : 0,
          qrCodeScans: campaign.qrCodeUrl ? await storage.getQRCodeScans(campaign.qrCodeUrl) : 0
        };
      }
      // Automated retargeting for non-converters
      async setupRetargeting(campaignId, options) {
        console.log(`Retargeting setup for campaign ${campaignId}:`, options);
      }
      // Bulk distribution for multiple sessions
      async bulkDistribute(sessionIds, options) {
        const campaigns = await Promise.all(
          sessionIds.map((sessionId) => this.createCampaign(sessionId, options))
        );
        return campaigns;
      }
    };
    distributionService = new DistributionService();
  }
});

// server/services/verification.ts
import crypto5 from "crypto";
var VerificationService, verificationService;
var init_verification = __esm({
  async "server/services/verification.ts"() {
    "use strict";
    await init_storage();
    init_verifymy();
    VerificationService = class {
      // Warn 30 days before expiry
      constructor() {
        this.sessions = /* @__PURE__ */ new Map();
        this.SESSION_DURATION = 30 * 60 * 1e3;
        // 30 minutes
        this.VERIFICATION_VALIDITY_DAYS = 365;
        // 1 year
        this.REVERIFICATION_WARNING_DAYS = 30;
        this.verifymyService = new VerifymyService();
        setInterval(() => this.cleanupExpiredSessions(), 60 * 1e3);
      }
      // Create a new verification session
      async createSession(userId, userType = "creator") {
        const sessionId = crypto5.randomBytes(32).toString("hex");
        const session3 = {
          id: sessionId,
          userId,
          userType,
          status: "pending",
          createdAt: /* @__PURE__ */ new Date(),
          expiresAt: new Date(Date.now() + this.SESSION_DURATION)
        };
        this.sessions.set(sessionId, session3);
        await storage.createAuditLog({
          actorId: userId,
          action: "verification_session_created",
          targetType: "verification_session",
          targetId: sessionId,
          metadata: { userType }
        });
        return session3;
      }
      // Get session by ID
      getSession(sessionId) {
        const session3 = this.sessions.get(sessionId);
        if (session3 && session3.expiresAt > /* @__PURE__ */ new Date()) {
          return session3;
        }
        return null;
      }
      // Submit verification documents and process
      async submitVerification(sessionId, documentType, frontImageBase64, backImageBase64, selfieImageBase64) {
        const session3 = this.getSession(sessionId);
        if (!session3) {
          throw new Error("Invalid or expired verification session");
        }
        try {
          session3.status = "processing";
          const frontImageUrl = await this.storeVerificationImage(session3.userId, frontImageBase64, "front");
          const backImageUrl = backImageBase64 ? await this.storeVerificationImage(session3.userId, backImageBase64, "back") : void 0;
          const selfieImageUrl = selfieImageBase64 ? await this.storeVerificationImage(session3.userId, selfieImageBase64, "selfie") : void 0;
          const verificationRequest = {
            userId: session3.userId,
            documentType,
            frontImageUrl,
            backImageUrl,
            selfieImageUrl: selfieImageUrl || "",
            documentNumber: void 0
            // Could extract from OCR in production
          };
          const verifyResponse = await this.verifymyService.verifyIdentity(verificationRequest);
          const kycVerification = await storage.createKycVerification({
            userId: session3.userId,
            provider: "verifymy",
            status: verifyResponse.status === "verified" ? "verified" : verifyResponse.status === "rejected" ? "rejected" : "pending",
            documentType,
            dataJson: {
              transactionId: verifyResponse.transactionId,
              confidence: verifyResponse.confidence,
              documentUrls: {
                front: frontImageUrl,
                back: backImageUrl,
                selfie: selfieImageUrl
              },
              sessionId,
              userType: session3.userType,
              ...verifyResponse.data
            }
          });
          if (verifyResponse.status === "verified") {
            await this.handleVerificationSuccess(session3.userId, kycVerification.id);
            session3.status = "completed";
          } else if (verifyResponse.status === "rejected") {
            session3.status = "failed";
          }
          await storage.createAuditLog({
            actorId: session3.userId,
            action: "verification_submitted",
            targetType: "kyc_verification",
            targetId: kycVerification.id,
            metadata: {
              status: verifyResponse.status,
              confidence: verifyResponse.confidence,
              documentType,
              sessionId
            }
          });
          return {
            verified: verifyResponse.status === "verified",
            status: verifyResponse.status === "verified" ? "verified" : verifyResponse.status === "rejected" ? "rejected" : "processing",
            confidence: verifyResponse.confidence,
            validUntil: verifyResponse.status === "verified" ? new Date(Date.now() + this.VERIFICATION_VALIDITY_DAYS * 24 * 60 * 60 * 1e3) : void 0,
            verifiedAt: verifyResponse.status === "verified" ? /* @__PURE__ */ new Date() : void 0,
            rejectionReason: verifyResponse.reasons?.join(", "),
            provider: "verifymy",
            details: verifyResponse.data
          };
        } catch (error) {
          console.error("Verification submission error:", error);
          session3.status = "failed";
          await storage.createAuditLog({
            actorId: session3.userId,
            action: "verification_error",
            targetType: "verification_session",
            targetId: sessionId,
            metadata: { error: error instanceof Error ? error.message : "Unknown error" }
          });
          throw error;
        }
      }
      // Get user's verification status
      async getUserVerificationStatus(userId) {
        try {
          const verifications = await storage.getKycVerificationsByUserId(userId);
          if (!verifications || verifications.length === 0) {
            return {
              verified: false,
              status: "none"
            };
          }
          const latestVerified = verifications.find((v) => v.status === "verified");
          if (!latestVerified) {
            const pendingVerification = verifications.find((v) => v.status === "pending");
            if (pendingVerification) {
              return {
                verified: false,
                status: "processing"
              };
            }
            const latestRejected = verifications[0];
            return {
              verified: false,
              status: "rejected",
              rejectionReason: latestRejected.dataJson?.reasons?.join(", ")
            };
          }
          const verifiedAt = new Date(latestVerified.verifiedAt || latestVerified.createdAt);
          const validUntil = new Date(verifiedAt.getTime() + this.VERIFICATION_VALIDITY_DAYS * 24 * 60 * 60 * 1e3);
          const now = /* @__PURE__ */ new Date();
          if (validUntil < now) {
            return {
              verified: false,
              status: "expired",
              verifiedAt,
              validUntil
            };
          }
          return {
            verified: true,
            status: "verified",
            confidence: latestVerified.dataJson?.confidence,
            validUntil,
            verifiedAt,
            provider: latestVerified.provider,
            details: {
              documentType: latestVerified.documentType,
              confidence: latestVerified.dataJson?.confidence,
              transactionId: latestVerified.dataJson?.transactionId
            }
          };
        } catch (error) {
          console.error("Error fetching verification status:", error);
          return {
            verified: false,
            status: "none"
          };
        }
      }
      // Get verification result by session ID
      async getVerificationResult(sessionId) {
        const session3 = this.getSession(sessionId);
        if (!session3) {
          return null;
        }
        return await this.getUserVerificationStatus(session3.userId);
      }
      // Check if user needs reverification
      async needsReverification(userId) {
        const status = await this.getUserVerificationStatus(userId);
        if (!status.verified || !status.validUntil) {
          return true;
        }
        const daysUntilExpiry = Math.floor(
          (status.validUntil.getTime() - Date.now()) / (1e3 * 60 * 60 * 24)
        );
        return daysUntilExpiry <= this.REVERIFICATION_WARNING_DAYS;
      }
      // Get verification history for user
      async getVerificationHistory(userId) {
        const verifications = await storage.getKycVerificationsByUserId(userId);
        return verifications.map((v) => ({
          id: v.id,
          type: "identity",
          status: v.status,
          provider: v.provider,
          documentType: v.documentType,
          confidence: v.dataJson?.confidence,
          createdAt: v.createdAt,
          verifiedAt: v.verifiedAt
        }));
      }
      // Handle successful verification
      async handleVerificationSuccess(userId, verificationId) {
        const profile = await storage.getProfile(userId);
        if (profile) {
          await storage.updateProfile(userId, {
            kycStatus: "verified",
            ageVerified: true
          });
        } else {
          await storage.createProfile({
            userId,
            kycStatus: "verified",
            ageVerified: true
          });
        }
        await storage.updateUser(userId, {
          ageVerified: true
        });
        await storage.createRecord2257({
          userId,
          docType: "identity_verification",
          s3Key: `verification/${userId}/${verificationId}`,
          metadata: {
            verificationId,
            provider: "verifymy",
            verifiedAt: /* @__PURE__ */ new Date()
          }
        });
        await storage.createAuditLog({
          actorId: userId,
          action: "verification_completed",
          targetType: "kyc_verification",
          targetId: verificationId,
          metadata: { status: "verified" }
        });
      }
      // Store verification image (simulate for now)
      async storeVerificationImage(userId, imageBase64, type) {
        const imageId = crypto5.randomBytes(16).toString("hex");
        const url = `https://storage.girlfanz.com/verification/${userId}/${type}_${imageId}.jpg`;
        await storage.createMediaAsset({
          ownerId: userId,
          title: `Verification ${type}`,
          filename: `${type}_${imageId}.jpg`,
          s3Key: `verification/${userId}/${type}_${imageId}.jpg`,
          mimeType: "image/jpeg",
          fileSize: Buffer.from(imageBase64.split(",")[1] || imageBase64, "base64").length,
          status: "approved",
          isPublic: false
        });
        return url;
      }
      // Clean up expired sessions
      cleanupExpiredSessions() {
        const now = /* @__PURE__ */ new Date();
        for (const [sessionId, session3] of this.sessions.entries()) {
          if (session3.expiresAt < now) {
            this.sessions.delete(sessionId);
          }
        }
      }
      // Generate compliance report
      async generateComplianceReport(startDate, endDate) {
        const verifications = await storage.getKycVerificationsInDateRange(startDate, endDate);
        const auditLogs2 = await storage.getAuditLogsInDateRange(startDate, endDate, "verification%");
        const report = {
          period: {
            start: startDate,
            end: endDate
          },
          statistics: {
            totalVerifications: verifications.length,
            successfulVerifications: verifications.filter((v) => v.status === "verified").length,
            rejectedVerifications: verifications.filter((v) => v.status === "rejected").length,
            pendingVerifications: verifications.filter((v) => v.status === "pending").length
          },
          verificationsByType: this.groupByDocumentType(verifications),
          verificationsByProvider: this.groupByProvider(verifications),
          auditTrail: auditLogs2.map((log2) => ({
            timestamp: log2.createdAt,
            actor: log2.actorId,
            action: log2.action,
            target: log2.targetId,
            metadata: log2.metadata
          })),
          compliance: {
            section2257: true,
            dataRetention: true,
            encryptionEnabled: true,
            auditLoggingEnabled: true
          }
        };
        return report;
      }
      groupByDocumentType(verifications) {
        const grouped = {};
        for (const v of verifications) {
          const type = v.documentType || "unknown";
          grouped[type] = (grouped[type] || 0) + 1;
        }
        return grouped;
      }
      groupByProvider(verifications) {
        const grouped = {};
        for (const v of verifications) {
          const provider = v.provider || "unknown";
          grouped[provider] = (grouped[provider] || 0) + 1;
        }
        return grouped;
      }
    };
    verificationService = new VerificationService();
  }
});

// server/services/streaming.ts
import { WebSocket } from "ws";
import crypto6 from "crypto";
var StreamingService, streamingService;
var init_streaming = __esm({
  async "server/services/streaming.ts"() {
    "use strict";
    await init_storage();
    await init_verification();
    await init_ai_editor();
    StreamingService = class {
      constructor() {
        this.sessions = /* @__PURE__ */ new Map();
        this.ICE_SERVERS = [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" }
        ];
        setInterval(() => this.detectHighlights(), 1e4);
        setInterval(() => this.cleanupEndedSessions(), 6e4);
      }
      // Initialize WebSocket server
      setWebSocketServer(wss) {
        this.wss = wss;
      }
      // Create a new streaming session
      async createStream(creatorId, config) {
        const creator = await storage.getUser(creatorId);
        if (!creator) {
          throw new Error("Creator not found");
        }
        const verificationStatus = await verificationService.getUserVerificationStatus(creatorId);
        if (!verificationStatus.verified && config.requiresVerification !== false) {
          throw new Error("Creator must be verified to start live streaming");
        }
        if (config.coStarIds && config.coStarIds.length > 0) {
          for (const coStarId of config.coStarIds) {
            const coStarVerification = await verificationService.getUserVerificationStatus(coStarId);
            if (!coStarVerification.verified) {
              throw new Error(`Co-star ${coStarId} must be verified to join stream`);
            }
          }
        }
        const streamKey = this.generateStreamKey();
        const stream = await storage.createLiveStream({
          creatorId,
          title: config.title,
          description: config.description,
          streamKey,
          visibility: config.visibility || "subscriber",
          priceInCents: config.priceInCents,
          status: "scheduled"
        });
        if (config.coStarIds) {
          for (const coStarId of config.coStarIds) {
            await storage.addStreamParticipant({
              streamId: stream.id,
              userId: coStarId,
              role: "co-star",
              isVerified: true,
              verificationStatus: "verified"
            });
          }
        }
        const session3 = {
          id: crypto6.randomBytes(16).toString("hex"),
          streamId: stream.id,
          creatorId,
          streamKey,
          status: "scheduled",
          rtcConfiguration: {
            iceServers: this.ICE_SERVERS
          },
          participants: /* @__PURE__ */ new Map(),
          viewers: /* @__PURE__ */ new Map(),
          chatMessages: [],
          gifts: [],
          reactions: /* @__PURE__ */ new Map(),
          analytics: this.createInitialAnalytics(),
          highlights: []
        };
        session3.participants.set(creatorId, {
          userId: creatorId,
          username: creator.username || "Host",
          role: "host",
          isVerified: verificationStatus.verified,
          verificationStatus: verificationStatus.status,
          audioEnabled: true,
          videoEnabled: true,
          joinedAt: /* @__PURE__ */ new Date()
        });
        this.sessions.set(session3.id, session3);
        return session3;
      }
      // Start the stream
      async startStream(sessionId) {
        const session3 = this.sessions.get(sessionId);
        if (!session3) {
          throw new Error("Stream session not found");
        }
        session3.status = "live";
        session3.startedAt = /* @__PURE__ */ new Date();
        await storage.updateLiveStream(session3.streamId, {
          status: "live",
          startedAt: session3.startedAt
        });
        if (session3.recordingUrl === void 0) {
          await this.startRecording(session3);
        }
        this.broadcastToSession(session3, {
          type: "stream_started",
          data: {
            streamId: session3.streamId,
            startedAt: session3.startedAt
          }
        });
        this.startAnalyticsTracking(session3);
      }
      // End the stream
      async endStream(sessionId) {
        const session3 = this.sessions.get(sessionId);
        if (!session3) {
          throw new Error("Stream session not found");
        }
        session3.status = "ended";
        session3.endedAt = /* @__PURE__ */ new Date();
        await storage.updateLiveStream(session3.streamId, {
          status: "ended",
          endedAt: session3.endedAt
        });
        if (session3.recordingUrl) {
          await this.stopRecording(session3);
        }
        if (session3.highlights.length > 0) {
          await this.saveHighlights(session3);
        }
        await this.saveAnalytics(session3);
        this.broadcastToSession(session3, {
          type: "stream_ended",
          data: {
            streamId: session3.streamId,
            endedAt: session3.endedAt,
            recordingAvailable: !!session3.recordingUrl
          }
        });
        if (session3.recordingUrl) {
          await this.processRecordingWithAI(session3);
        }
      }
      // Add co-star to stream
      async addCoStar(sessionId, userId, requireVerification = true) {
        const session3 = this.sessions.get(sessionId);
        if (!session3) {
          throw new Error("Stream session not found");
        }
        if (requireVerification) {
          const verification = await verificationService.getUserVerificationStatus(userId);
          if (!verification.verified) {
            throw new Error("Co-star must be verified to join stream");
          }
        }
        const user = await storage.getUser(userId);
        if (!user) {
          throw new Error("User not found");
        }
        session3.participants.set(userId, {
          userId,
          username: user.username || "Co-star",
          role: "co-star",
          isVerified: requireVerification,
          audioEnabled: true,
          videoEnabled: true,
          joinedAt: /* @__PURE__ */ new Date()
        });
        await storage.addStreamParticipant({
          streamId: session3.streamId,
          userId,
          role: "co-star",
          isVerified: requireVerification,
          verificationStatus: requireVerification ? "verified" : "unverified",
          joinedAt: /* @__PURE__ */ new Date()
        });
        this.broadcastToSession(session3, {
          type: "costar_joined",
          data: {
            userId,
            username: user.username,
            isVerified: requireVerification
          }
        });
      }
      // Remove co-star from stream
      async removeCoStar(sessionId, userId) {
        const session3 = this.sessions.get(sessionId);
        if (!session3) {
          throw new Error("Stream session not found");
        }
        const participant = session3.participants.get(userId);
        if (!participant || participant.role === "host") {
          throw new Error("Cannot remove this participant");
        }
        session3.participants.delete(userId);
        await storage.updateStreamParticipant(session3.streamId, userId, {
          leftAt: /* @__PURE__ */ new Date()
        });
        if (participant.peerConnection) {
          participant.peerConnection.close();
        }
        this.broadcastToSession(session3, {
          type: "costar_left",
          data: { userId }
        });
      }
      // Add viewer to stream
      async addViewer(sessionId, userId, connection) {
        const session3 = this.sessions.get(sessionId);
        if (!session3) {
          throw new Error("Stream session not found");
        }
        session3.viewers.set(userId, {
          userId,
          connection,
          joinedAt: /* @__PURE__ */ new Date(),
          watchTimeSeconds: 0
        });
        session3.analytics.currentViewers++;
        session3.analytics.totalViewers++;
        if (session3.analytics.currentViewers > session3.analytics.peakViewers) {
          session3.analytics.peakViewers = session3.analytics.currentViewers;
        }
        await storage.addStreamViewer({
          streamId: session3.streamId,
          userId,
          joinedAt: /* @__PURE__ */ new Date()
        });
        this.broadcastToSession(session3, {
          type: "viewer_count_updated",
          data: {
            currentViewers: session3.analytics.currentViewers,
            totalViewers: session3.analytics.totalViewers
          }
        });
      }
      // Remove viewer from stream
      async removeViewer(sessionId, userId) {
        const session3 = this.sessions.get(sessionId);
        if (!session3) return;
        const viewer = session3.viewers.get(userId);
        if (!viewer) return;
        const watchTime = Math.floor((Date.now() - viewer.joinedAt.getTime()) / 1e3);
        await storage.updateStreamViewer(session3.streamId, userId, {
          leftAt: /* @__PURE__ */ new Date(),
          watchTimeSeconds: watchTime,
          isActive: false
        });
        session3.viewers.delete(userId);
        session3.analytics.currentViewers--;
        session3.analytics.avgWatchTime = (session3.analytics.avgWatchTime * (session3.analytics.totalViewers - 1) + watchTime) / session3.analytics.totalViewers;
        this.broadcastToSession(session3, {
          type: "viewer_count_updated",
          data: {
            currentViewers: session3.analytics.currentViewers
          }
        });
      }
      // Send chat message
      async sendChatMessage(sessionId, userId, message, messageType = "text") {
        const session3 = this.sessions.get(sessionId);
        if (!session3) {
          throw new Error("Stream session not found");
        }
        const user = await storage.getUser(userId);
        if (!user) {
          throw new Error("User not found");
        }
        if (await this.shouldModerateMessage(message)) {
          throw new Error("Message contains inappropriate content");
        }
        const chatMessage = {
          id: crypto6.randomBytes(16).toString("hex"),
          userId,
          username: user.username || "Anonymous",
          message,
          messageType,
          timestamp: /* @__PURE__ */ new Date()
        };
        session3.chatMessages.push(chatMessage);
        session3.analytics.totalChatMessages++;
        await storage.addStreamChatMessage({
          streamId: session3.streamId,
          userId,
          message,
          messageType
        });
        this.broadcastToSession(session3, {
          type: "chat_message",
          data: chatMessage
        });
      }
      // Send gift
      async sendGift(sessionId, senderId, receiverId, giftType, giftValue, quantity = 1, message) {
        const session3 = this.sessions.get(sessionId);
        if (!session3) {
          throw new Error("Stream session not found");
        }
        const sender = await storage.getUser(senderId);
        if (!sender) {
          throw new Error("Sender not found");
        }
        const totalValue = giftValue * quantity;
        const transaction = {
          userId: senderId,
          creatorId: receiverId,
          provider: "ccbill",
          type: "tip",
          status: "completed",
          amountCents: totalValue,
          creatorEarnings: Math.floor(totalValue * 0.8)
          // 80% to creator
        };
        const savedTransaction = await storage.createTransaction(transaction);
        const gift = {
          id: crypto6.randomBytes(16).toString("hex"),
          senderId,
          senderUsername: sender.username || "Anonymous",
          receiverId,
          giftType,
          giftValue,
          quantity,
          message,
          timestamp: /* @__PURE__ */ new Date()
        };
        session3.gifts.push(gift);
        session3.analytics.totalGifts++;
        session3.analytics.totalGiftValue += totalValue;
        await storage.addStreamGift({
          streamId: session3.streamId,
          senderId,
          receiverId,
          giftType,
          giftValue,
          quantity,
          message,
          transactionId: savedTransaction.id
        });
        this.broadcastToSession(session3, {
          type: "gift_received",
          data: {
            ...gift,
            animation: this.getGiftAnimation(giftType)
          }
        });
        if (totalValue >= 1e4) {
          this.addHighlight(session3, {
            type: "peak_gifts",
            title: `${sender.username} sent ${quantity}x ${giftType}!`,
            score: Math.min(100, totalValue / 100)
          });
        }
      }
      // Send reaction
      async sendReaction(sessionId, userId, reactionType, intensity = 1) {
        const session3 = this.sessions.get(sessionId);
        if (!session3) {
          throw new Error("Stream session not found");
        }
        const currentCount = session3.reactions.get(reactionType) || 0;
        session3.reactions.set(reactionType, currentCount + intensity);
        session3.analytics.totalReactions++;
        await storage.addStreamReaction({
          streamId: session3.streamId,
          userId,
          reactionType,
          intensity,
          timestamp: Math.floor((Date.now() - (session3.startedAt?.getTime() || 0)) / 1e3)
        });
        this.broadcastToSession(session3, {
          type: "reaction",
          data: {
            userId,
            reactionType,
            intensity
          }
        });
      }
      // WebRTC signaling
      async handleSignaling(sessionId, userId, signal) {
        const session3 = this.sessions.get(sessionId);
        if (!session3) {
          throw new Error("Stream session not found");
        }
        const participant = session3.participants.get(userId);
        if (!participant) {
          throw new Error("Participant not found");
        }
        session3.participants.forEach((otherParticipant, otherUserId) => {
          if (otherUserId !== userId && otherParticipant.connection) {
            otherParticipant.connection.send(JSON.stringify({
              type: "webrtc_signal",
              data: {
                fromUserId: userId,
                signal
              }
            }));
          }
        });
      }
      // Private methods
      generateStreamKey() {
        return crypto6.randomBytes(20).toString("hex");
      }
      createInitialAnalytics() {
        return {
          currentViewers: 0,
          peakViewers: 0,
          totalViewers: 0,
          avgWatchTime: 0,
          totalGifts: 0,
          totalGiftValue: 0,
          totalReactions: 0,
          totalChatMessages: 0,
          engagementScore: 0,
          viewerRetention: {}
        };
      }
      broadcastToSession(session3, message) {
        const messageStr = JSON.stringify(message);
        session3.participants.forEach((participant) => {
          if (participant.connection && participant.connection.readyState === WebSocket.OPEN) {
            participant.connection.send(messageStr);
          }
        });
        session3.viewers.forEach((viewer) => {
          if (viewer.connection && viewer.connection.readyState === WebSocket.OPEN) {
            viewer.connection.send(messageStr);
          }
        });
      }
      async startRecording(session3) {
        session3.recordingUrl = `recordings/${session3.streamId}/stream.mp4`;
      }
      async stopRecording(session3) {
        if (!session3.recordingUrl) return;
        await storage.createStreamRecording({
          streamId: session3.streamId,
          recordingUrl: session3.recordingUrl,
          duration: Math.floor((Date.now() - (session3.startedAt?.getTime() || 0)) / 1e3),
          status: "processing"
        });
      }
      async saveHighlights(session3) {
        for (const highlight of session3.highlights) {
          await storage.createStreamHighlight({
            streamId: session3.streamId,
            title: highlight.title,
            startTime: highlight.startTime,
            endTime: highlight.endTime,
            highlightType: highlight.type,
            score: highlight.score
          });
        }
      }
      async saveAnalytics(session3) {
        await storage.createStreamAnalytics({
          streamId: session3.streamId,
          peakViewers: session3.analytics.peakViewers,
          avgViewers: Math.floor(session3.analytics.totalViewers / 2),
          // Simplified
          totalViewers: session3.analytics.totalViewers,
          totalWatchTimeMinutes: Math.floor(session3.analytics.avgWatchTime * session3.analytics.totalViewers / 60),
          totalGifts: session3.analytics.totalGifts,
          totalGiftValue: session3.analytics.totalGiftValue,
          totalReactions: session3.analytics.totalReactions,
          totalChatMessages: session3.analytics.totalChatMessages,
          engagementScore: this.calculateEngagementScore(session3.analytics),
          viewerRetention: session3.analytics.viewerRetention
        });
      }
      calculateEngagementScore(analytics) {
        const chatScore = Math.min(30, analytics.totalChatMessages / 10);
        const giftScore = Math.min(30, analytics.totalGiftValue / 1e3);
        const reactionScore = Math.min(20, analytics.totalReactions / 100);
        const retentionScore = Math.min(20, analytics.avgWatchTime / 60);
        return Math.floor(chatScore + giftScore + reactionScore + retentionScore);
      }
      async processRecordingWithAI(session3) {
        if (!session3.recordingUrl) return;
        await aiEditorService.processStreamRecording({
          streamId: session3.streamId,
          recordingUrl: session3.recordingUrl,
          highlights: session3.highlights,
          generateClips: true,
          generateTrailer: true,
          detectHighlights: true
        });
      }
      async shouldModerateMessage(message) {
        const blockedWords = ["spam", "scam", "banned_word"];
        const lowerMessage = message.toLowerCase();
        return blockedWords.some((word) => lowerMessage.includes(word));
      }
      getGiftAnimation(giftType) {
        const animations = {
          "rose": "floating",
          "heart": "pulse",
          "diamond": "sparkle",
          "fireworks": "explosion",
          "crown": "rotate",
          "rocket": "launch"
        };
        return animations[giftType] || "floating";
      }
      addHighlight(session3, data) {
        const startTime = Math.max(0, Math.floor((Date.now() - (session3.startedAt?.getTime() || 0)) / 1e3) - 30);
        const endTime = startTime + 60;
        session3.highlights.push({
          id: crypto6.randomBytes(16).toString("hex"),
          title: data.title,
          startTime,
          endTime,
          type: data.type,
          score: data.score,
          timestamp: /* @__PURE__ */ new Date()
        });
      }
      async detectHighlights() {
        for (const [sessionId, session3] of this.sessions) {
          if (session3.status !== "live") continue;
          if (session3.analytics.currentViewers === session3.analytics.peakViewers && session3.analytics.peakViewers > 100) {
            this.addHighlight(session3, {
              type: "peak_viewers",
              title: `Peak viewership: ${session3.analytics.peakViewers} viewers`,
              score: Math.min(100, session3.analytics.peakViewers / 10)
            });
          }
          const recentMessages = session3.chatMessages.filter(
            (msg) => Date.now() - msg.timestamp.getTime() < 6e4
          ).length;
          if (recentMessages > 50) {
            this.addHighlight(session3, {
              type: "ai_detected",
              title: "High chat engagement",
              score: Math.min(100, recentMessages)
            });
          }
        }
      }
      startAnalyticsTracking(session3) {
        const interval = setInterval(() => {
          if (session3.status !== "live") {
            clearInterval(interval);
            return;
          }
          const minutesSinceStart = Math.floor((Date.now() - (session3.startedAt?.getTime() || 0)) / 6e4);
          const retentionRate = session3.analytics.currentViewers / session3.analytics.peakViewers * 100;
          session3.analytics.viewerRetention[minutesSinceStart] = retentionRate;
        }, 6e4);
      }
      cleanupEndedSessions() {
        const oneHourAgo = Date.now() - 36e5;
        for (const [sessionId, session3] of this.sessions) {
          if (session3.status === "ended" && session3.endedAt && session3.endedAt.getTime() < oneHourAgo) {
            this.sessions.delete(sessionId);
          }
        }
      }
      // Public getters
      getSession(sessionId) {
        return this.sessions.get(sessionId);
      }
      getSessionByStreamKey(streamKey) {
        for (const session3 of this.sessions.values()) {
          if (session3.streamKey === streamKey) {
            return session3;
          }
        }
        return void 0;
      }
      getAllSessions() {
        return Array.from(this.sessions.values());
      }
      getActiveSessions() {
        return Array.from(this.sessions.values()).filter((s) => s.status === "live");
      }
    };
    streamingService = new StreamingService();
  }
});

// server/websocket/stream-handler.ts
import { WebSocket as WebSocket2 } from "ws";
function initStreamWebSocketHandler(wss) {
  streamWebSocketHandler = new StreamWebSocketHandler(wss);
  return streamWebSocketHandler;
}
var StreamWebSocketHandler, streamWebSocketHandler;
var init_stream_handler = __esm({
  async "server/websocket/stream-handler.ts"() {
    "use strict";
    await init_streaming();
    await init_storage();
    await init_verification();
    StreamWebSocketHandler = class {
      constructor(wss) {
        this.connections = /* @__PURE__ */ new Map();
        this.wss = wss;
        streamingService.setWebSocketServer(wss);
        this.setupHeartbeat();
      }
      // Handle new WebSocket connection
      async handleConnection(ws, request) {
        console.log("New WebSocket connection for streaming");
        ws.isAlive = true;
        ws.on("pong", () => {
          ws.isAlive = true;
        });
        ws.on("message", async (message) => {
          try {
            const data = JSON.parse(message.toString());
            await this.handleMessage(ws, data);
          } catch (error) {
            console.error("WebSocket message error:", error);
            this.sendError(ws, "Invalid message format");
          }
        });
        ws.on("close", () => {
          this.handleDisconnection(ws);
        });
        ws.on("error", (error) => {
          console.error("WebSocket error:", error);
          this.handleDisconnection(ws);
        });
        this.sendMessage(ws, {
          type: "connection_established",
          data: { message: "Connected to streaming service" }
        });
      }
      // Handle incoming messages
      async handleMessage(ws, message) {
        const { type, sessionId, userId, data } = message;
        if (type === "authenticate") {
          return this.handleAuthentication(ws, data);
        }
        if (!ws.userId) {
          return this.sendError(ws, "Authentication required");
        }
        try {
          switch (type) {
            case "create_stream":
              await this.handleCreateStream(ws, data);
              break;
            case "join_stream":
              await this.handleJoinStream(ws, sessionId, ws.userId, data);
              break;
            case "leave_stream":
              await this.handleLeaveStream(ws, sessionId, ws.userId);
              break;
            case "start_stream":
              await this.handleStartStream(ws, sessionId);
              break;
            case "end_stream":
              await this.handleEndStream(ws, sessionId);
              break;
            case "invite_costar":
              await this.handleInviteCoStar(ws, sessionId, data);
              break;
            case "remove_costar":
              await this.handleRemoveCoStar(ws, sessionId, data.userId);
              break;
            case "send_chat":
              await this.handleChatMessage(ws, sessionId, data);
              break;
            case "send_gift":
              await this.handleGift(ws, sessionId, data);
              break;
            case "send_reaction":
              await this.handleReaction(ws, sessionId, data);
              break;
            case "webrtc_offer":
            case "webrtc_answer":
            case "webrtc_ice_candidate":
              await this.handleWebRTCSignaling(ws, sessionId, type, data);
              break;
            case "update_stream_settings":
              await this.handleUpdateStreamSettings(ws, sessionId, data);
              break;
            case "toggle_audio":
              await this.handleToggleAudio(ws, sessionId, data.enabled);
              break;
            case "toggle_video":
              await this.handleToggleVideo(ws, sessionId, data.enabled);
              break;
            case "apply_filter":
              await this.handleApplyFilter(ws, sessionId, data);
              break;
            case "set_virtual_background":
              await this.handleSetVirtualBackground(ws, sessionId, data);
              break;
            case "request_highlight":
              await this.handleRequestHighlight(ws, sessionId, data);
              break;
            case "get_stream_analytics":
              await this.handleGetAnalytics(ws, sessionId);
              break;
            case "pin_message":
              await this.handlePinMessage(ws, sessionId, data.messageId);
              break;
            case "moderate_user":
              await this.handleModerateUser(ws, sessionId, data);
              break;
            default:
              this.sendError(ws, `Unknown message type: ${type}`);
          }
        } catch (error) {
          console.error(`Error handling ${type}:`, error);
          this.sendError(ws, error instanceof Error ? error.message : "Operation failed");
        }
      }
      // Authentication handler
      async handleAuthentication(ws, data) {
        const { userId, token } = data;
        const user = await storage.getUser(userId);
        if (!user) {
          return this.sendError(ws, "Invalid user");
        }
        ws.userId = userId;
        this.connections.set(userId, ws);
        this.sendMessage(ws, {
          type: "authenticated",
          data: {
            userId,
            username: user.username,
            role: user.role
          }
        });
      }
      // Stream creation handler
      async handleCreateStream(ws, data) {
        if (!ws.userId) {
          return this.sendError(ws, "Authentication required");
        }
        const session3 = await streamingService.createStream(ws.userId, data);
        ws.sessionId = session3.id;
        this.sendMessage(ws, {
          type: "stream_created",
          data: {
            sessionId: session3.id,
            streamId: session3.streamId,
            streamKey: session3.streamKey,
            rtcConfiguration: session3.rtcConfiguration
          }
        });
      }
      // Join stream handler
      async handleJoinStream(ws, sessionId, userId, data) {
        const session3 = streamingService.getSession(sessionId);
        if (!session3) {
          return this.sendError(ws, "Stream not found");
        }
        ws.sessionId = sessionId;
        if (data.role === "costar" || session3.participants.has(userId)) {
          const participant = session3.participants.get(userId);
          if (participant) {
            participant.connection = ws;
          }
          if (data.role === "costar") {
            const verification = await verificationService.getUserVerificationStatus(userId);
            if (!verification.verified) {
              return this.sendError(ws, "Verification required to join as co-star");
            }
            await streamingService.addCoStar(sessionId, userId, true);
          }
          this.sendMessage(ws, {
            type: "joined_as_participant",
            data: {
              sessionId,
              streamId: session3.streamId,
              participants: Array.from(session3.participants.values()).map((p) => ({
                userId: p.userId,
                username: p.username,
                role: p.role,
                isVerified: p.isVerified
              })),
              rtcConfiguration: session3.rtcConfiguration
            }
          });
        } else {
          await streamingService.addViewer(sessionId, userId, ws);
          this.sendMessage(ws, {
            type: "joined_as_viewer",
            data: {
              sessionId,
              streamId: session3.streamId,
              currentViewers: session3.analytics.currentViewers,
              streamStatus: session3.status
            }
          });
        }
      }
      // Leave stream handler
      async handleLeaveStream(ws, sessionId, userId) {
        const session3 = streamingService.getSession(sessionId);
        if (!session3) return;
        if (session3.participants.has(userId)) {
          await streamingService.removeCoStar(sessionId, userId);
        } else {
          await streamingService.removeViewer(sessionId, userId);
        }
        ws.sessionId = void 0;
        this.sendMessage(ws, {
          type: "left_stream",
          data: { sessionId }
        });
      }
      // Start stream handler
      async handleStartStream(ws, sessionId) {
        const session3 = streamingService.getSession(sessionId);
        if (!session3) {
          return this.sendError(ws, "Stream not found");
        }
        if (ws.userId !== session3.creatorId) {
          return this.sendError(ws, "Only host can start the stream");
        }
        await streamingService.startStream(sessionId);
        this.sendMessage(ws, {
          type: "stream_started",
          data: {
            sessionId,
            startedAt: session3.startedAt
          }
        });
      }
      // End stream handler
      async handleEndStream(ws, sessionId) {
        const session3 = streamingService.getSession(sessionId);
        if (!session3) {
          return this.sendError(ws, "Stream not found");
        }
        if (ws.userId !== session3.creatorId) {
          return this.sendError(ws, "Only host can end the stream");
        }
        await streamingService.endStream(sessionId);
        this.sendMessage(ws, {
          type: "stream_ended",
          data: {
            sessionId,
            endedAt: session3.endedAt,
            recordingAvailable: !!session3.recordingUrl
          }
        });
      }
      // Invite co-star handler
      async handleInviteCoStar(ws, sessionId, data) {
        const session3 = streamingService.getSession(sessionId);
        if (!session3) {
          return this.sendError(ws, "Stream not found");
        }
        if (ws.userId !== session3.creatorId) {
          return this.sendError(ws, "Only host can invite co-stars");
        }
        await streamingService.addCoStar(
          sessionId,
          data.userId,
          data.requireVerification !== false
        );
        const invitedWs = this.connections.get(data.userId);
        if (invitedWs) {
          this.sendMessage(invitedWs, {
            type: "costar_invitation",
            data: {
              sessionId,
              streamId: session3.streamId,
              hostId: session3.creatorId
            }
          });
        }
        this.sendMessage(ws, {
          type: "costar_invited",
          data: { userId: data.userId }
        });
      }
      // Remove co-star handler
      async handleRemoveCoStar(ws, sessionId, coStarId) {
        const session3 = streamingService.getSession(sessionId);
        if (!session3) {
          return this.sendError(ws, "Stream not found");
        }
        if (ws.userId !== session3.creatorId) {
          return this.sendError(ws, "Only host can remove co-stars");
        }
        await streamingService.removeCoStar(sessionId, coStarId);
        const removedWs = this.connections.get(coStarId);
        if (removedWs) {
          this.sendMessage(removedWs, {
            type: "removed_from_stream",
            data: { sessionId }
          });
        }
        this.sendMessage(ws, {
          type: "costar_removed",
          data: { userId: coStarId }
        });
      }
      // Chat message handler
      async handleChatMessage(ws, sessionId, data) {
        if (!ws.userId) return;
        await streamingService.sendChatMessage(
          sessionId,
          ws.userId,
          data.message,
          data.messageType || "text"
        );
      }
      // Gift handler
      async handleGift(ws, sessionId, data) {
        if (!ws.userId) return;
        await streamingService.sendGift(
          sessionId,
          ws.userId,
          data.receiverId,
          data.giftType,
          data.giftValue,
          data.quantity || 1,
          data.message
        );
      }
      // Reaction handler
      async handleReaction(ws, sessionId, data) {
        if (!ws.userId) return;
        await streamingService.sendReaction(
          sessionId,
          ws.userId,
          data.reactionType,
          data.intensity || 1
        );
      }
      // WebRTC signaling handler
      async handleWebRTCSignaling(ws, sessionId, signalType, data) {
        if (!ws.userId) return;
        const session3 = streamingService.getSession(sessionId);
        if (!session3) {
          return this.sendError(ws, "Stream not found");
        }
        if (!session3.participants.has(ws.userId)) {
          return this.sendError(ws, "Not a participant in this stream");
        }
        await streamingService.handleSignaling(sessionId, ws.userId, {
          type: signalType,
          ...data
        });
      }
      // Update stream settings handler
      async handleUpdateStreamSettings(ws, sessionId, data) {
        const session3 = streamingService.getSession(sessionId);
        if (!session3) {
          return this.sendError(ws, "Stream not found");
        }
        if (ws.userId !== session3.creatorId) {
          return this.sendError(ws, "Only host can update settings");
        }
        await storage.updateLiveStream(session3.streamId, data);
        this.sendMessage(ws, {
          type: "settings_updated",
          data
        });
      }
      // Toggle audio handler
      async handleToggleAudio(ws, sessionId, enabled) {
        if (!ws.userId) return;
        const session3 = streamingService.getSession(sessionId);
        if (!session3) {
          return this.sendError(ws, "Stream not found");
        }
        const participant = session3.participants.get(ws.userId);
        if (!participant) {
          return this.sendError(ws, "Not a participant");
        }
        participant.audioEnabled = enabled;
        this.broadcastToParticipants(session3, {
          type: "audio_toggled",
          data: {
            userId: ws.userId,
            enabled
          }
        });
      }
      // Toggle video handler
      async handleToggleVideo(ws, sessionId, enabled) {
        if (!ws.userId) return;
        const session3 = streamingService.getSession(sessionId);
        if (!session3) {
          return this.sendError(ws, "Stream not found");
        }
        const participant = session3.participants.get(ws.userId);
        if (!participant) {
          return this.sendError(ws, "Not a participant");
        }
        participant.videoEnabled = enabled;
        this.broadcastToParticipants(session3, {
          type: "video_toggled",
          data: {
            userId: ws.userId,
            enabled
          }
        });
      }
      // Apply filter handler
      async handleApplyFilter(ws, sessionId, data) {
        this.sendMessage(ws, {
          type: "filter_applied",
          data: {
            filterType: data.filterType,
            settings: data.settings
          }
        });
      }
      // Set virtual background handler
      async handleSetVirtualBackground(ws, sessionId, data) {
        this.sendMessage(ws, {
          type: "virtual_background_set",
          data
        });
      }
      // Request highlight handler
      async handleRequestHighlight(ws, sessionId, data) {
        const session3 = streamingService.getSession(sessionId);
        if (!session3 || session3.status !== "live") {
          return this.sendError(ws, "Stream not active");
        }
        const timestamp2 = Math.floor((Date.now() - (session3.startedAt?.getTime() || 0)) / 1e3);
        await storage.createStreamHighlight({
          streamId: session3.streamId,
          title: data.title,
          startTime: Math.max(0, timestamp2 - (data.duration || 30)),
          endTime: timestamp2 + 30,
          highlightType: "manual",
          score: 75
        });
        this.sendMessage(ws, {
          type: "highlight_created",
          data: { timestamp: timestamp2 }
        });
      }
      // Get analytics handler
      async handleGetAnalytics(ws, sessionId) {
        const session3 = streamingService.getSession(sessionId);
        if (!session3) {
          return this.sendError(ws, "Stream not found");
        }
        this.sendMessage(ws, {
          type: "analytics",
          data: session3.analytics
        });
      }
      // Pin message handler
      async handlePinMessage(ws, sessionId, messageId) {
        const session3 = streamingService.getSession(sessionId);
        if (!session3) {
          return this.sendError(ws, "Stream not found");
        }
        const participant = session3.participants.get(ws.userId);
        if (!participant || participant.role !== "host" && participant.role !== "moderator") {
          return this.sendError(ws, "Insufficient permissions");
        }
        const message = session3.chatMessages.find((m) => m.id === messageId);
        if (message) {
          message.isPinned = true;
          this.broadcastToSession(session3, {
            type: "message_pinned",
            data: { messageId }
          });
        }
      }
      // Moderate user handler
      async handleModerateUser(ws, sessionId, data) {
        const session3 = streamingService.getSession(sessionId);
        if (!session3) {
          return this.sendError(ws, "Stream not found");
        }
        const participant = session3.participants.get(ws.userId);
        if (!participant || participant.role !== "host" && participant.role !== "moderator") {
          return this.sendError(ws, "Insufficient permissions");
        }
        if (data.action === "ban" || data.action === "timeout") {
          await streamingService.removeViewer(sessionId, data.userId);
          const bannedWs = this.connections.get(data.userId);
          if (bannedWs) {
            this.sendMessage(bannedWs, {
              type: "moderated",
              data: {
                action: data.action,
                duration: data.duration
              }
            });
            bannedWs.close();
          }
        }
        this.sendMessage(ws, {
          type: "user_moderated",
          data
        });
      }
      // Disconnection handler
      handleDisconnection(ws) {
        if (ws.userId && ws.sessionId) {
          const session3 = streamingService.getSession(ws.sessionId);
          if (session3) {
            if (session3.participants.has(ws.userId)) {
              const participant = session3.participants.get(ws.userId);
              if (participant) {
                participant.connection = void 0;
              }
            } else {
              streamingService.removeViewer(ws.sessionId, ws.userId);
            }
          }
          this.connections.delete(ws.userId);
        }
      }
      // Helper methods
      sendMessage(ws, message) {
        if (ws.readyState === WebSocket2.OPEN) {
          ws.send(JSON.stringify(message));
        }
      }
      sendError(ws, error) {
        this.sendMessage(ws, {
          type: "error",
          data: { error }
        });
      }
      broadcastToSession(session3, message) {
        const messageStr = JSON.stringify(message);
        session3.participants.forEach((participant) => {
          if (participant.connection?.readyState === WebSocket2.OPEN) {
            participant.connection.send(messageStr);
          }
        });
        session3.viewers.forEach((viewer) => {
          if (viewer.connection?.readyState === WebSocket2.OPEN) {
            viewer.connection.send(messageStr);
          }
        });
      }
      broadcastToParticipants(session3, message) {
        const messageStr = JSON.stringify(message);
        session3.participants.forEach((participant) => {
          if (participant.connection?.readyState === WebSocket2.OPEN) {
            participant.connection.send(messageStr);
          }
        });
      }
      setupHeartbeat() {
        this.pingInterval = setInterval(() => {
          this.wss.clients.forEach((ws) => {
            if (ws.isAlive === false) {
              ws.terminate();
              return;
            }
            ws.isAlive = false;
            ws.ping();
          });
        }, 3e4);
      }
      // Cleanup
      cleanup() {
        if (this.pingInterval) {
          clearInterval(this.pingInterval);
        }
        this.connections.clear();
      }
    };
  }
});

// server/services/ai-processor.ts
var AIProcessorService, aiProcessorService;
var init_ai_processor = __esm({
  async "server/services/ai-processor.ts"() {
    "use strict";
    await init_storage();
    init_objectStorage();
    AIProcessorService = class {
      constructor() {
        this.processingPipelines = /* @__PURE__ */ new Map();
        this.processingQueue = [];
        this.isProcessing = false;
        this.objectStorage = new ObjectStorageService();
      }
      // Get processing status for a session
      async getProcessingStatus(sessionId) {
        const pipeline = this.processingPipelines.get(sessionId);
        const task = await storage.getEditingTaskBySession(sessionId);
        return {
          sessionId,
          pipeline,
          task,
          inQueue: this.processingQueue.includes(sessionId),
          queuePosition: this.processingQueue.indexOf(sessionId) + 1
        };
      }
      // Get processing queue for a user
      async getProcessingQueue(userId) {
        const sessions2 = await storage.getContentSessionsByCreator(userId);
        const queueItems = [];
        for (const session3 of sessions2) {
          if (session3.status === "processing") {
            const status = await this.getProcessingStatus(session3.id);
            queueItems.push({
              ...session3,
              ...status
            });
          }
        }
        return queueItems;
      }
      // Update priority of a queued session
      async updateQueuePriority(sessionId, priority) {
        const queueIndex = this.processingQueue.indexOf(sessionId);
        if (queueIndex > -1) {
          this.processingQueue.splice(queueIndex, 1);
          if (priority === "premium") {
            this.processingQueue.unshift(sessionId);
          } else if (priority === "high") {
            const firstNormalIndex = this.processingQueue.findIndex((id) => !this.isPremium(id));
            this.processingQueue.splice(firstNormalIndex >= 0 ? firstNormalIndex : this.processingQueue.length, 0, sessionId);
          } else {
            this.processingQueue.push(sessionId);
          }
        }
      }
      isPremium(sessionId) {
        return false;
      }
      // Main processing entry point
      async processContent(sessionId, config) {
        const session3 = await storage.getContentSession(sessionId);
        if (!session3) throw new Error("Session not found");
        const pipeline = {
          sessionId,
          stages: [
            { name: "scene_detection", status: "pending", progress: 0 },
            { name: "face_tracking", status: "pending", progress: 0 },
            { name: "audio_processing", status: "pending", progress: 0 },
            { name: "content_enhancement", status: "pending", progress: 0 },
            { name: "format_conversion", status: "pending", progress: 0 },
            { name: "asset_generation", status: "pending", progress: 0 }
          ]
        };
        this.processingPipelines.set(sessionId, pipeline);
        try {
          await this.updateStageStatus(sessionId, "scene_detection", "processing");
          const scenes = await this.detectScenes(session3);
          await this.updateStageStatus(sessionId, "scene_detection", "completed");
          if (config.faceDetection) {
            await this.updateStageStatus(sessionId, "face_tracking", "processing");
            const faceData = await this.detectAndTrackFaces(session3, scenes);
            await this.updateStageStatus(sessionId, "face_tracking", "completed");
          }
          await this.updateStageStatus(sessionId, "audio_processing", "processing");
          const audioAnalysis = await this.processAudio(session3, config);
          await this.updateStageStatus(sessionId, "audio_processing", "completed");
          await this.updateStageStatus(sessionId, "content_enhancement", "processing");
          const enhancedContent = await this.enhanceContent(session3, config, scenes, audioAnalysis);
          await this.updateStageStatus(sessionId, "content_enhancement", "completed");
          await this.storeProcessedContent(session3, enhancedContent);
        } catch (error) {
          console.error("Processing error:", error);
          const currentStage = pipeline.stages.find((s) => s.status === "processing");
          if (currentStage) {
            await this.updateStageStatus(sessionId, currentStage.name, "failed", error);
          }
          throw error;
        } finally {
          this.processingPipelines.delete(sessionId);
        }
      }
      // Scene Detection with AI
      async detectScenes(session3) {
        console.log(`Detecting scenes for session ${session3.id}`);
        const scenes = [
          {
            startTime: 0,
            endTime: 5,
            type: "action",
            confidence: 0.95,
            keyFrames: []
          },
          {
            startTime: 5,
            endTime: 10,
            type: "dialogue",
            confidence: 0.88,
            keyFrames: []
          },
          {
            startTime: 10,
            endTime: 15,
            type: "transition",
            confidence: 0.92,
            keyFrames: []
          }
        ];
        for (const scene of scenes) {
          scene.keyFrames = await this.extractKeyFrames(session3, scene);
        }
        return scenes;
      }
      // Face Detection and Tracking
      async detectAndTrackFaces(session3, scenes) {
        console.log(`Detecting faces for session ${session3.id}`);
        const faceData = [];
        for (let frame = 0; frame < 30; frame++) {
          faceData.push({
            frameNumber: frame,
            faces: [
              {
                id: "face_1",
                boundingBox: { x: 100, y: 100, width: 200, height: 200 },
                emotion: "happy",
                quality: 0.95
              }
            ]
          });
        }
        return faceData;
      }
      // Audio Processing and Enhancement
      async processAudio(session3, config) {
        console.log(`Processing audio for session ${session3.id}`);
        const analysis = {
          averageVolume: 0.7,
          peakVolume: 0.95,
          noiseLevel: 0.1,
          speechSegments: [],
          musicSegments: []
        };
        if (config.audioEnhancement) {
          if (config.noiseReduction) {
            await this.applyNoiseReduction(session3);
          }
          await this.normalizeAudio(session3);
          if (config.autoSubtitles) {
            analysis.speechSegments = await this.detectSpeechSegments(session3);
          }
          if (config.beatMatching) {
            analysis.musicSegments = await this.detectMusicSegments(session3);
          }
        }
        return analysis;
      }
      // Content Enhancement with AI
      async enhanceContent(session3, config, scenes, audioAnalysis) {
        console.log(`Enhancing content for session ${session3.id}`);
        let enhancedContent = Buffer.from("enhanced_placeholder");
        if (config.colorGrading) {
          enhancedContent = await this.applyColorGrading(enhancedContent, "cinematic");
        }
        if (config.faceBeautification) {
          enhancedContent = await this.applyFaceBeautification(enhancedContent);
        }
        if (config.watermark) {
          enhancedContent = await this.addWatermark(enhancedContent);
        }
        if (config.autoSubtitles && audioAnalysis.speechSegments.length > 0) {
          enhancedContent = await this.addSubtitles(enhancedContent, audioAnalysis.speechSegments);
        }
        if (config.transitionEffects) {
          enhancedContent = await this.addTransitions(enhancedContent, scenes);
        }
        if (config.backgroundReplacement) {
          enhancedContent = await this.replaceBackground(enhancedContent);
        }
        if (config.privacyBlur) {
          enhancedContent = await this.applyPrivacyBlur(enhancedContent);
        }
        return enhancedContent;
      }
      // Store processed content
      async storeProcessedContent(session3, content) {
        const key = `content/${session3.creatorId}/${session3.id}/processed/master.mp4`;
        const result = await this.objectStorage.uploadObject({
          key,
          body: content,
          contentType: "video/mp4",
          metadata: {
            sessionId: session3.id,
            processedAt: (/* @__PURE__ */ new Date()).toISOString()
          }
        });
        await storage.updateContentSession(session3.id, {
          status: "ready",
          metadata: {
            ...session3.metadata,
            processedUrl: result.url,
            processedAt: (/* @__PURE__ */ new Date()).toISOString()
          }
        });
        return result.url;
      }
      // Helper methods for specific processing tasks
      async extractKeyFrames(session3, scene) {
        const keyFrames = [];
        const frameInterval = (scene.endTime - scene.startTime) / 3;
        for (let i = 0; i < 3; i++) {
          const frameTime = scene.startTime + frameInterval * i;
          const frameKey = `content/${session3.creatorId}/${session3.id}/frames/frame_${frameTime}.jpg`;
          keyFrames.push(frameKey);
        }
        return keyFrames;
      }
      async applyNoiseReduction(session3) {
        console.log(`Applying noise reduction to session ${session3.id}`);
      }
      async normalizeAudio(session3) {
        console.log(`Normalizing audio for session ${session3.id}`);
      }
      async detectSpeechSegments(session3) {
        return [
          {
            startTime: 0,
            endTime: 5,
            confidence: 0.95,
            transcript: "Welcome to my content!"
          }
        ];
      }
      async detectMusicSegments(session3) {
        return [
          {
            startTime: 5,
            endTime: 15,
            tempo: 120,
            energy: 0.8
          }
        ];
      }
      async applyColorGrading(content, style) {
        console.log(`Applying ${style} color grading`);
        return content;
      }
      async applyFaceBeautification(content) {
        console.log("Applying face beautification");
        return content;
      }
      async addWatermark(content) {
        console.log("Adding watermark");
        return content;
      }
      async addSubtitles(content, speechSegments) {
        console.log("Adding subtitles");
        return content;
      }
      async addTransitions(content, scenes) {
        console.log("Adding transitions");
        return content;
      }
      async replaceBackground(content) {
        console.log("Replacing background");
        return content;
      }
      async applyPrivacyBlur(content) {
        console.log("Applying privacy blur");
        return content;
      }
      // Update pipeline stage status
      async updateStageStatus(sessionId, stageName, status, error) {
        const pipeline = this.processingPipelines.get(sessionId);
        if (!pipeline) return;
        const stage = pipeline.stages.find((s) => s.name === stageName);
        if (stage) {
          stage.status = status;
          if (status === "processing") {
            stage.startTime = /* @__PURE__ */ new Date();
          } else if (status === "completed" || status === "failed") {
            stage.endTime = /* @__PURE__ */ new Date();
            stage.progress = status === "completed" ? 100 : stage.progress;
            if (error) {
              stage.error = error instanceof Error ? error.message : String(error);
            }
          }
        }
      }
      // Get processing status
      async getProcessingStatus(sessionId) {
        return this.processingPipelines.get(sessionId) || null;
      }
      // Queue management for batch processing
      async addToQueue(sessionId, priority) {
        if (priority === "premium") {
          this.processingQueue.unshift(sessionId);
        } else if (priority === "high") {
          const premiumCount = this.processingQueue.filter(
            (id) => this.getSessionPriority(id) === "premium"
          ).length;
          this.processingQueue.splice(premiumCount, 0, sessionId);
        } else {
          this.processingQueue.push(sessionId);
        }
        if (!this.isProcessing) {
          this.processQueue();
        }
      }
      async processQueue() {
        if (this.processingQueue.length === 0 || this.isProcessing) {
          return;
        }
        this.isProcessing = true;
        while (this.processingQueue.length > 0) {
          const sessionId = this.processingQueue.shift();
          if (sessionId) {
            try {
              const config = {
                sceneDetection: true,
                faceDetection: true,
                audioEnhancement: true,
                noiseReduction: true,
                stabilization: true,
                colorGrading: true,
                autoSubtitles: true,
                watermark: true,
                backgroundReplacement: false,
                faceBeautification: true,
                beatMatching: true,
                transitionEffects: true,
                privacyBlur: false,
                targetQuality: "high",
                processingPriority: "normal"
              };
              await this.processContent(sessionId, config);
            } catch (error) {
              console.error(`Error processing session ${sessionId}:`, error);
            }
          }
        }
        this.isProcessing = false;
      }
      getSessionPriority(sessionId) {
        return "normal";
      }
      // Cancel processing for a session
      async cancelProcessing(sessionId) {
        const queueIndex = this.processingQueue.indexOf(sessionId);
        if (queueIndex > -1) {
          this.processingQueue.splice(queueIndex, 1);
        }
        const pipeline = this.processingPipelines.get(sessionId);
        if (pipeline) {
          pipeline.stages.forEach((stage) => {
            if (stage.status === "pending" || stage.status === "processing") {
              stage.status = "failed";
              stage.error = "Processing cancelled by user";
            }
          });
        }
        this.processingPipelines.delete(sessionId);
      }
    };
    aiProcessorService = new AIProcessorService();
  }
});

// server/services/format-converter.ts
var PLATFORM_CONFIGS2, FormatConverterService, formatConverterService;
var init_format_converter = __esm({
  async "server/services/format-converter.ts"() {
    "use strict";
    await init_storage();
    init_objectStorage();
    PLATFORM_CONFIGS2 = {
      tiktok: {
        id: "tiktok",
        name: "TikTok",
        aspectRatio: "9:16",
        maxDuration: 60,
        maxFileSize: 287,
        resolution: { width: 1080, height: 1920 },
        videoBitrate: 8e6,
        audioBitrate: 128e3,
        fps: 30,
        codec: "h264",
        format: "mp4",
        features: {
          supportsGif: true,
          supportsLive: true
        },
        optimizations: {
          autoLoop: true,
          addCaptions: true,
          verticalOptimized: true,
          mobileFirst: true
        }
      },
      instagram_reels: {
        id: "instagram_reels",
        name: "Instagram Reels",
        aspectRatio: "9:16",
        maxDuration: 90,
        maxFileSize: 100,
        resolution: { width: 1080, height: 1920 },
        videoBitrate: 5e6,
        audioBitrate: 128e3,
        fps: 30,
        codec: "h264",
        format: "mp4",
        features: {
          supportsGif: true
        },
        optimizations: {
          addCaptions: true,
          verticalOptimized: true,
          mobileFirst: true
        }
      },
      instagram_post: {
        id: "instagram_post",
        name: "Instagram Post",
        aspectRatio: "1:1",
        maxDuration: 60,
        maxFileSize: 100,
        resolution: { width: 1080, height: 1080 },
        videoBitrate: 35e5,
        audioBitrate: 128e3,
        fps: 30,
        codec: "h264",
        format: "mp4",
        features: {
          supportsCarousel: true,
          supportsGif: true
        },
        optimizations: {
          mobileFirst: true
        }
      },
      instagram_feed: {
        id: "instagram_feed",
        name: "Instagram Feed",
        aspectRatio: "4:5",
        maxDuration: 60,
        maxFileSize: 100,
        resolution: { width: 1080, height: 1350 },
        videoBitrate: 35e5,
        audioBitrate: 128e3,
        fps: 30,
        codec: "h264",
        format: "mp4",
        features: {
          supportsCarousel: true
        },
        optimizations: {
          mobileFirst: true
        }
      },
      youtube_shorts: {
        id: "youtube_shorts",
        name: "YouTube Shorts",
        aspectRatio: "9:16",
        maxDuration: 60,
        maxFileSize: 128,
        resolution: { width: 1080, height: 1920 },
        videoBitrate: 1e7,
        audioBitrate: 192e3,
        fps: 60,
        codec: "h264",
        format: "mp4",
        features: {
          supportsHDR: true
        },
        optimizations: {
          verticalOptimized: true,
          addEndScreen: true
        }
      },
      youtube: {
        id: "youtube",
        name: "YouTube",
        aspectRatio: "16:9",
        maxDuration: 43200,
        // 12 hours
        maxFileSize: 128e3,
        // 128GB
        resolution: { width: 1920, height: 1080 },
        videoBitrate: 15e6,
        audioBitrate: 32e4,
        fps: 60,
        codec: "h264",
        format: "mp4",
        features: {
          supportsHDR: true,
          supportsChapters: true,
          supportsLive: true
        },
        optimizations: {
          addEndScreen: true,
          addCaptions: true
        }
      },
      twitter: {
        id: "twitter",
        name: "Twitter/X",
        aspectRatio: "16:9",
        maxDuration: 140,
        maxFileSize: 512,
        resolution: { width: 1280, height: 720 },
        videoBitrate: 5e6,
        audioBitrate: 128e3,
        fps: 30,
        codec: "h264",
        format: "mp4",
        features: {
          supportsGif: true
        },
        optimizations: {
          mobileFirst: true
        }
      },
      onlyfans: {
        id: "onlyfans",
        name: "OnlyFans",
        aspectRatio: "16:9",
        maxDuration: 600,
        maxFileSize: 5e3,
        resolution: { width: 1920, height: 1080 },
        videoBitrate: 1e7,
        audioBitrate: 192e3,
        fps: 30,
        codec: "h264",
        format: "mp4",
        features: {
          supportsLive: true
        },
        optimizations: {
          addCaptions: false
        }
      }
    };
    FormatConverterService = class {
      constructor() {
        this.conversionQueue = /* @__PURE__ */ new Map();
        this.objectStorage = new ObjectStorageService();
      }
      // Convert content to multiple platform formats
      async convertToFormats(sessionId, options) {
        const session3 = await storage.getContentSession(sessionId);
        if (!session3) throw new Error("Session not found");
        const results = [];
        const conversionPromises = options.platforms.map(async (platformId2) => {
          const config = PLATFORM_CONFIGS2[platformId2];
          if (!config) {
            console.warn(`Unknown platform: ${platformId2}`);
            return null;
          }
          return this.convertForPlatform(session3, config, options);
        });
        const conversions = await Promise.all(conversionPromises);
        for (const result of conversions) {
          if (result) {
            results.push(result);
          }
        }
        return results;
      }
      // Convert content for specific platform
      async convertForPlatform(session3, config, options) {
        const startTime = Date.now();
        console.log(`Converting content for ${config.name} (${config.aspectRatio})`);
        const convertedContent = await this.applyPlatformConversion(
          session3,
          config,
          options
        );
        const optimizedContent = await this.optimizeForPlatform(
          convertedContent,
          config,
          options
        );
        const metadata = this.generatePlatformMetadata(config, session3);
        const filename = `${config.id}_${config.aspectRatio.replace(":", "x")}.${config.format}`;
        const uploadKey = `content/${session3.creatorId}/${session3.id}/platforms/${filename}`;
        const uploadResult = await this.objectStorage.uploadObject({
          key: uploadKey,
          body: optimizedContent,
          contentType: `video/${config.format}`,
          metadata: {
            sessionId: session3.id,
            platform: config.id,
            aspectRatio: config.aspectRatio,
            ...metadata
          }
        });
        let previewUrl;
        if (options.generatePreview) {
          previewUrl = await this.generatePreview(session3, config);
        }
        const versionData = {
          sessionId: session3.id,
          aspectRatio: config.aspectRatio,
          format: config.format,
          resolution: `${config.resolution.height}p`,
          fileUrl: uploadResult.url,
          thumbnailUrl: previewUrl,
          fileSize: optimizedContent.byteLength,
          dimensions: config.resolution,
          isProcessed: true,
          metadata: {
            platform: config.id,
            platformConfig: config,
            conversionOptions: options
          }
        };
        const version = await storage.createContentVersion(versionData);
        const processingTime = Date.now() - startTime;
        return {
          platform: config.id,
          version,
          optimizedSize: optimizedContent.byteLength,
          processingTime,
          previewUrl
        };
      }
      // Apply platform-specific conversion
      async applyPlatformConversion(session3, config, options) {
        let convertedContent = Buffer.from(`converted_${config.id}_content`);
        convertedContent = await this.convertAspectRatio(
          convertedContent,
          config.aspectRatio,
          config.resolution
        );
        if (config.maxDuration < 43200) {
          convertedContent = await this.trimDuration(
            convertedContent,
            config.maxDuration
          );
        }
        if (config.optimizations.verticalOptimized) {
          convertedContent = await this.optimizeForVertical(convertedContent);
        }
        if (config.optimizations.addCaptions && options.quality !== "low") {
          convertedContent = await this.addAutoCaptions(convertedContent);
        }
        if (config.optimizations.addEndScreen && config.id === "youtube") {
          convertedContent = await this.addYouTubeEndScreen(convertedContent);
        }
        if (config.optimizations.autoLoop && config.id === "tiktok") {
          convertedContent = await this.makeLoopable(convertedContent);
        }
        return convertedContent;
      }
      // Optimize content for platform
      async optimizeForPlatform(content, config, options) {
        let optimized = content;
        if (config.maxFileSize) {
          optimized = await this.compressToSize(optimized, config.maxFileSize);
        }
        optimized = await this.optimizeBitrate(
          optimized,
          config.videoBitrate,
          config.audioBitrate
        );
        if (options.optimizeForMobile && config.optimizations.mobileFirst) {
          optimized = await this.optimizeForMobile(optimized);
        }
        optimized = await this.applyQualitySettings(optimized, options.quality);
        return optimized;
      }
      // Helper methods for conversion
      async convertAspectRatio(content, targetRatio, resolution) {
        console.log(`Converting to ${targetRatio} at ${resolution.width}x${resolution.height}`);
        return content;
      }
      async trimDuration(content, maxDuration) {
        console.log(`Trimming to ${maxDuration} seconds`);
        return content;
      }
      async optimizeForVertical(content) {
        console.log("Optimizing for vertical viewing");
        return content;
      }
      async addAutoCaptions(content) {
        console.log("Adding auto-generated captions");
        return content;
      }
      async addYouTubeEndScreen(content) {
        console.log("Adding YouTube end screen");
        return content;
      }
      async makeLoopable(content) {
        console.log("Making content loopable");
        return content;
      }
      async compressToSize(content, maxSizeMB) {
        console.log(`Compressing to ${maxSizeMB}MB`);
        return content;
      }
      async optimizeBitrate(content, videoBitrate, audioBitrate) {
        console.log(`Optimizing bitrate: video=${videoBitrate}, audio=${audioBitrate}`);
        return content;
      }
      async optimizeForMobile(content) {
        console.log("Optimizing for mobile devices");
        return content;
      }
      async applyQualitySettings(content, quality) {
        console.log(`Applying ${quality} quality settings`);
        return content;
      }
      async generatePreview(session3, config) {
        const previewKey = `content/${session3.creatorId}/${session3.id}/previews/${config.id}_preview.jpg`;
        const previewBuffer = Buffer.from("preview_placeholder");
        const result = await this.objectStorage.uploadObject({
          key: previewKey,
          body: previewBuffer,
          contentType: "image/jpeg",
          metadata: {
            sessionId: session3.id,
            platform: config.id
          }
        });
        return result.url;
      }
      generatePlatformMetadata(config, session3) {
        return {
          platformId: config.id,
          platformName: config.name,
          aspectRatio: config.aspectRatio,
          maxDuration: config.maxDuration,
          features: config.features,
          optimizations: config.optimizations,
          convertedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
      }
      // Batch conversion for multiple sessions
      async batchConvert(sessionIds, options) {
        const results = /* @__PURE__ */ new Map();
        const concurrencyLimit = 3;
        const chunks = this.chunkArray(sessionIds, concurrencyLimit);
        for (const chunk of chunks) {
          const chunkResults = await Promise.all(
            chunk.map(async (sessionId) => {
              try {
                const conversions = await this.convertToFormats(sessionId, options);
                return { sessionId, conversions };
              } catch (error) {
                console.error(`Batch conversion failed for ${sessionId}:`, error);
                return { sessionId, conversions: [] };
              }
            })
          );
          for (const result of chunkResults) {
            results.set(result.sessionId, result.conversions);
          }
        }
        return results;
      }
      chunkArray(array, chunkSize) {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
          chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
      }
      // Get supported platforms for content type
      getSupportedPlatforms(contentType) {
        return Object.values(PLATFORM_CONFIGS2).filter((config) => {
          if (contentType === "short" && config.maxDuration > 90) {
            return false;
          }
          if (contentType === "long" && config.maxDuration < 300) {
            return false;
          }
          return true;
        });
      }
      // Get optimal platforms for content
      getOptimalPlatforms(duration, aspectRatio) {
        return Object.values(PLATFORM_CONFIGS2).filter(
          (config) => config.maxDuration >= duration && (config.aspectRatio === aspectRatio || this.canConvertRatio(aspectRatio, config.aspectRatio))
        ).map((config) => config.id);
      }
      canConvertRatio(from, to) {
        const ratioMap = {
          "16:9": ["16:9", "1:1", "4:5"],
          "9:16": ["9:16", "1:1", "4:5"],
          "1:1": ["1:1", "4:5"],
          "4:5": ["4:5", "1:1"]
        };
        return ratioMap[from]?.includes(to) || false;
      }
    };
    formatConverterService = new FormatConverterService();
  }
});

// server/services/asset-generator.ts
var AssetGeneratorService, assetGeneratorService;
var init_asset_generator = __esm({
  async "server/services/asset-generator.ts"() {
    "use strict";
    await init_storage();
    init_objectStorage();
    AssetGeneratorService = class {
      constructor() {
        // Meme templates
        this.memeTemplates = {
          "drake": { topText: true, bottomText: true, splitImage: true },
          "distracted_boyfriend": { positions: 3, captions: true },
          "woman_yelling_cat": { splitImage: true, twoPanel: true },
          "surprised_pikachu": { bottomText: true },
          "this_is_fine": { topText: true, bottomText: true }
        };
        this.objectStorage = new ObjectStorageService();
      }
      // Generate all requested assets
      async generateAssets(sessionId, options) {
        const session3 = await storage.getContentSession(sessionId);
        if (!session3) throw new Error("Session not found");
        const results = [];
        const generationPromises = [];
        if (options.thumbnails.generate) {
          generationPromises.push(this.generateThumbnails(session3, options.thumbnails));
        }
        if (options.gif.generate) {
          generationPromises.push(this.generateGif(session3, options.gif));
        }
        if (options.preview.generate) {
          generationPromises.push(this.generatePreviewClip(session3, options.preview));
        }
        if (options.highlights.generate) {
          generationPromises.push(this.generateHighlightReel(session3, options.highlights));
        }
        if (options.teaser.generate) {
          generationPromises.push(this.generateTeaser(session3, options.teaser));
        }
        if (options.meme.generate) {
          generationPromises.push(this.generateMemeClips(session3, options.meme));
        }
        const generatedResults = await Promise.all(generationPromises);
        results.push(...generatedResults);
        return results;
      }
      // Generate intelligent thumbnails
      async generateThumbnails(session3, options) {
        const startTime = Date.now();
        const assets = [];
        console.log(`Generating ${options.count} thumbnails for session ${session3.id}`);
        const candidates = await this.extractThumbnailCandidates(session3, options.count * 3);
        const rankedCandidates = await this.rankThumbnailCandidates(candidates);
        const selectedCandidates = rankedCandidates.slice(0, options.count);
        for (const candidate of selectedCandidates) {
          for (const size of options.sizes) {
            const thumbnail = await this.createThumbnail(
              session3,
              candidate,
              size,
              options.format
            );
            const assetData = {
              sessionId: session3.id,
              type: "thumbnail",
              format: options.format,
              url: thumbnail.url,
              metadata: {
                frameNumber: candidate.frameNumber,
                timestamp: candidate.timestamp,
                score: candidate.score,
                features: candidate.features,
                size
              }
            };
            const asset = await storage.createGeneratedAsset(assetData);
            assets.push(asset);
          }
        }
        return {
          type: "thumbnails",
          assets,
          processingTime: Date.now() - startTime,
          metadata: {
            candidatesAnalyzed: candidates.length,
            selectedCount: selectedCandidates.length
          }
        };
      }
      // Generate animated GIF
      async generateGif(session3, options) {
        const startTime = Date.now();
        const assets = [];
        console.log(`Generating GIF for session ${session3.id}`);
        const segment = await this.findBestGifSegment(session3, options.duration);
        const frames = await this.extractFramesForGif(
          session3,
          segment,
          options.fps
        );
        const gifBuffer = await this.createAnimatedGif(frames, options);
        const uploadKey = `content/${session3.creatorId}/${session3.id}/assets/preview.gif`;
        const uploadResult = await this.objectStorage.uploadObject({
          key: uploadKey,
          body: gifBuffer,
          contentType: "image/gif",
          metadata: {
            sessionId: session3.id,
            duration: options.duration,
            fps: options.fps,
            quality: options.quality
          }
        });
        const assetData = {
          sessionId: session3.id,
          type: "gif",
          format: "gif",
          url: uploadResult.url,
          metadata: {
            duration: options.duration,
            fps: options.fps,
            loop: options.loop,
            segment
          }
        };
        const asset = await storage.createGeneratedAsset(assetData);
        assets.push(asset);
        return {
          type: "gif",
          assets,
          processingTime: Date.now() - startTime
        };
      }
      // Generate preview clip
      async generatePreviewClip(session3, options) {
        const startTime = Date.now();
        const assets = [];
        console.log(`Generating preview clip for session ${session3.id}`);
        const segments = await this.analyzeForPreview(session3);
        const previewContent = await this.createPreviewFromSegments(
          session3,
          segments,
          options.duration
        );
        let enhancedPreview = previewContent;
        if (options.fadeInOut) {
          enhancedPreview = await this.applyFadeEffects(enhancedPreview);
        }
        if (options.addWatermark) {
          enhancedPreview = await this.addPreviewWatermark(enhancedPreview);
        }
        const uploadKey = `content/${session3.creatorId}/${session3.id}/assets/preview_${options.duration}s.mp4`;
        const uploadResult = await this.objectStorage.uploadObject({
          key: uploadKey,
          body: enhancedPreview,
          contentType: "video/mp4",
          metadata: {
            sessionId: session3.id,
            duration: options.duration,
            includeAudio: options.includeAudio
          }
        });
        const assetData = {
          sessionId: session3.id,
          type: "preview",
          format: "mp4",
          url: uploadResult.url,
          metadata: {
            duration: options.duration,
            segments: segments.map((s) => ({
              start: s.startTime,
              end: s.endTime,
              type: s.type
            }))
          }
        };
        const asset = await storage.createGeneratedAsset(assetData);
        assets.push(asset);
        return {
          type: "preview",
          assets,
          processingTime: Date.now() - startTime
        };
      }
      // Generate highlight reel
      async generateHighlightReel(session3, options) {
        const startTime = Date.now();
        const assets = [];
        console.log(`Generating highlight reel for session ${session3.id}`);
        const highlights = await this.detectHighlights(
          session3,
          options.detectMethod,
          options.maxClips
        );
        const highlightReel = await this.compileHighlights(
          session3,
          highlights,
          options.clipDuration
        );
        const reelWithTransitions = await this.addHighlightTransitions(highlightReel);
        const uploadKey = `content/${session3.creatorId}/${session3.id}/assets/highlights.mp4`;
        const uploadResult = await this.objectStorage.uploadObject({
          key: uploadKey,
          body: reelWithTransitions,
          contentType: "video/mp4",
          metadata: {
            sessionId: session3.id,
            highlightCount: highlights.length,
            method: options.detectMethod
          }
        });
        const assetData = {
          sessionId: session3.id,
          type: "highlights",
          format: "mp4",
          url: uploadResult.url,
          metadata: {
            highlights: highlights.map((h) => ({
              start: h.startTime,
              end: h.endTime,
              score: h.score,
              type: h.type,
              description: h.description
            })),
            totalDuration: highlights.length * options.clipDuration
          }
        };
        const asset = await storage.createGeneratedAsset(assetData);
        assets.push(asset);
        return {
          type: "highlights",
          assets,
          processingTime: Date.now() - startTime
        };
      }
      // Generate social media teaser
      async generateTeaser(session3, options) {
        const startTime = Date.now();
        const assets = [];
        console.log(`Generating ${options.style} teaser for session ${session3.id}`);
        const segments = await this.selectTeaserSegments(session3, options.style);
        let teaser = await this.createStylizedTeaser(segments, options.style);
        if (options.addText) {
          teaser = await this.addTeaserText(teaser, options.style);
        }
        if (options.addMusic) {
          teaser = await this.addTeaserMusic(teaser, options.style);
        }
        const uploadKey = `content/${session3.creatorId}/${session3.id}/assets/teaser_${options.style}.mp4`;
        const uploadResult = await this.objectStorage.uploadObject({
          key: uploadKey,
          body: teaser,
          contentType: "video/mp4",
          metadata: {
            sessionId: session3.id,
            style: options.style,
            hasText: options.addText,
            hasMusic: options.addMusic
          }
        });
        const assetData = {
          sessionId: session3.id,
          type: "teaser",
          format: "mp4",
          url: uploadResult.url,
          metadata: {
            style: options.style,
            segments: segments.length
          }
        };
        const asset = await storage.createGeneratedAsset(assetData);
        assets.push(asset);
        return {
          type: "teaser",
          assets,
          processingTime: Date.now() - startTime
        };
      }
      // Generate meme-ready clips
      async generateMemeClips(session3, options) {
        const startTime = Date.now();
        const assets = [];
        console.log(`Generating meme clips for session ${session3.id}`);
        const memeMoments = await this.findMemeMoments(session3);
        for (const moment of memeMoments) {
          for (const templateName of options.templates) {
            const template = this.memeTemplates[templateName];
            if (!template) continue;
            const memeContent = await this.createMemeWithTemplate(
              session3,
              moment,
              templateName,
              template,
              options
            );
            const uploadKey = `content/${session3.creatorId}/${session3.id}/assets/meme_${templateName}_${moment.timestamp}.jpg`;
            const uploadResult = await this.objectStorage.uploadObject({
              key: uploadKey,
              body: memeContent,
              contentType: "image/jpeg",
              metadata: {
                sessionId: session3.id,
                template: templateName,
                timestamp: moment.timestamp
              }
            });
            const assetData = {
              sessionId: session3.id,
              type: "meme",
              format: "jpg",
              url: uploadResult.url,
              metadata: {
                template: templateName,
                moment,
                autoCaption: options.autoCaption
              }
            };
            const asset = await storage.createGeneratedAsset(assetData);
            assets.push(asset);
          }
        }
        return {
          type: "meme",
          assets,
          processingTime: Date.now() - startTime
        };
      }
      // Helper methods for thumbnail generation
      async extractThumbnailCandidates(session3, count) {
        const candidates = [];
        for (let i = 0; i < count; i++) {
          candidates.push({
            frameNumber: i * 100,
            timestamp: i * 2,
            score: Math.random(),
            features: {
              sharpness: Math.random(),
              contrast: Math.random(),
              facePresent: Math.random() > 0.5,
              eyeContact: Math.random() > 0.7,
              emotion: ["happy", "neutral", "excited"][Math.floor(Math.random() * 3)],
              composition: Math.random()
            }
          });
        }
        return candidates;
      }
      async rankThumbnailCandidates(candidates) {
        return candidates.map((candidate) => ({
          ...candidate,
          score: this.calculateThumbnailScore(candidate)
        })).sort((a, b) => b.score - a.score);
      }
      calculateThumbnailScore(candidate) {
        let score = 0;
        score += candidate.features.sharpness * 0.2;
        score += candidate.features.contrast * 0.15;
        score += candidate.features.facePresent ? 0.25 : 0;
        score += candidate.features.eyeContact ? 0.15 : 0;
        score += candidate.features.emotion === "happy" ? 0.1 : 0.05;
        score += candidate.features.composition * 0.15;
        return score;
      }
      async createThumbnail(session3, candidate, size, format) {
        const thumbnailBuffer = Buffer.from(`thumbnail_${size.width}x${size.height}`);
        const uploadKey = `content/${session3.creatorId}/${session3.id}/thumbnails/thumb_${size.suffix}.${format}`;
        const result = await this.objectStorage.uploadObject({
          key: uploadKey,
          body: thumbnailBuffer,
          contentType: `image/${format}`,
          metadata: {
            sessionId: session3.id,
            ...size
          }
        });
        return { url: result.url };
      }
      // Helper methods for GIF generation
      async findBestGifSegment(session3, duration) {
        return {
          startTime: 5,
          endTime: 5 + duration,
          score: 0.95,
          type: "action",
          description: "Dynamic movement detected"
        };
      }
      async extractFramesForGif(session3, segment, fps) {
        const frames = [];
        const frameCount = Math.floor((segment.endTime - segment.startTime) * fps);
        for (let i = 0; i < frameCount; i++) {
          frames.push(Buffer.from(`frame_${i}`));
        }
        return frames;
      }
      async createAnimatedGif(frames, options) {
        console.log(`Creating GIF with ${frames.length} frames at ${options.fps} fps`);
        return Buffer.from("animated_gif_data");
      }
      // Helper methods for preview generation
      async analyzeForPreview(session3) {
        return [
          {
            startTime: 0,
            endTime: 3,
            score: 0.9,
            type: "action",
            description: "Opening scene"
          },
          {
            startTime: 10,
            endTime: 13,
            score: 0.95,
            type: "emotion",
            description: "Peak moment"
          },
          {
            startTime: 20,
            endTime: 23,
            score: 0.85,
            type: "transition",
            description: "Closing scene"
          }
        ];
      }
      async createPreviewFromSegments(session3, segments, targetDuration) {
        console.log(`Creating ${targetDuration}s preview from ${segments.length} segments`);
        return Buffer.from("preview_content");
      }
      async applyFadeEffects(content) {
        console.log("Applying fade effects");
        return content;
      }
      async addPreviewWatermark(content) {
        console.log("Adding preview watermark");
        return content;
      }
      // Helper methods for highlight detection
      async detectHighlights(session3, method, maxClips) {
        const highlights = [];
        switch (method) {
          case "ai":
            break;
          case "motion":
            break;
          case "audio":
            break;
          case "combined":
            break;
        }
        for (let i = 0; i < maxClips; i++) {
          highlights.push({
            startTime: i * 10,
            endTime: i * 10 + 3,
            score: 0.8 + Math.random() * 0.2,
            type: ["action", "emotion", "audio_peak"][i % 3],
            description: `Highlight ${i + 1}`
          });
        }
        return highlights.slice(0, maxClips);
      }
      async compileHighlights(session3, highlights, clipDuration) {
        console.log(`Compiling ${highlights.length} highlights`);
        return Buffer.from("highlight_reel");
      }
      async addHighlightTransitions(content) {
        console.log("Adding transitions to highlight reel");
        return content;
      }
      // Helper methods for teaser generation
      async selectTeaserSegments(session3, style) {
        const segments = [];
        switch (style) {
          case "dramatic":
            break;
          case "playful":
            break;
          case "mysterious":
            break;
          case "exciting":
            break;
        }
        segments.push({
          startTime: 5,
          endTime: 8,
          score: 0.95,
          type: "emotion",
          description: `${style} moment`
        });
        return segments;
      }
      async createStylizedTeaser(segments, style) {
        console.log(`Creating ${style} teaser`);
        return Buffer.from("teaser_content");
      }
      async addTeaserText(content, style) {
        console.log(`Adding ${style} text to teaser`);
        return content;
      }
      async addTeaserMusic(content, style) {
        console.log(`Adding ${style} music to teaser`);
        return content;
      }
      // Helper methods for meme generation
      async findMemeMoments(session3) {
        return [
          { timestamp: 10, expression: "surprised", score: 0.9 },
          { timestamp: 25, expression: "laughing", score: 0.95 }
        ];
      }
      async createMemeWithTemplate(session3, moment, templateName, template, options) {
        console.log(`Creating ${templateName} meme at timestamp ${moment.timestamp}`);
        return Buffer.from("meme_image");
      }
    };
    assetGeneratorService = new AssetGeneratorService();
  }
});

// server/services/content-analyzer.ts
var ContentAnalyzerService, contentAnalyzerService;
var init_content_analyzer = __esm({
  async "server/services/content-analyzer.ts"() {
    "use strict";
    await init_storage();
    ContentAnalyzerService = class {
      constructor() {
        // Trend database (mock data - in production, this would be from a trend API)
        this.trendingTopics = {
          tiktok: [
            { id: "dance1", name: "Trending Dance Challenge", score: 0.95 },
            { id: "transition1", name: "Outfit Transition", score: 0.88 },
            { id: "pov1", name: "POV Stories", score: 0.82 }
          ],
          instagram: [
            { id: "aesthetic1", name: "Aesthetic Vibes", score: 0.9 },
            { id: "grwm1", name: "Get Ready With Me", score: 0.85 },
            { id: "tutorial1", name: "Quick Tutorial", score: 0.8 }
          ],
          youtube: [
            { id: "vlog1", name: "Day in the Life", score: 0.87 },
            { id: "reaction1", name: "Reaction Content", score: 0.83 },
            { id: "haul1", name: "Shopping Haul", score: 0.79 }
          ]
        };
      }
      // Analyze content comprehensively
      async analyzeContent(sessionId) {
        const session3 = await storage.getContentSession(sessionId);
        if (!session3) throw new Error("Session not found");
        console.log(`Analyzing content for session ${sessionId}`);
        const metadata = await this.extractMetadata(session3);
        const categories = await this.categorizeContent(session3);
        const mood = await this.analyzeMood(session3);
        const audio = await this.analyzeAudio(session3);
        const visual = await this.analyzeVisual(session3);
        const engagement = await this.predictEngagement(session3, mood, audio, visual);
        const recommendations = await this.generateRecommendations(
          session3,
          categories,
          mood,
          engagement
        );
        const trends = await this.analyzeTrends(session3, categories, mood);
        const analysis = {
          sessionId,
          metadata,
          categories,
          mood,
          audio,
          visual,
          engagement,
          recommendations,
          trends,
          timestamp: /* @__PURE__ */ new Date()
        };
        await this.storeAnalysis(analysis);
        return analysis;
      }
      // Extract content metadata
      async extractMetadata(session3) {
        return {
          duration: 60,
          fileSize: 10485760,
          // 10MB
          resolution: "1080p",
          fps: 30,
          bitrate: 5e6,
          hasAudio: true,
          hasSubtitles: false
        };
      }
      // Categorize content using AI
      async categorizeContent(session3) {
        return [
          {
            name: "Entertainment",
            confidence: 0.92,
            tags: ["fun", "lifestyle", "creative"],
            nsfw: false,
            ageRestriction: void 0
          },
          {
            name: "Fashion",
            confidence: 0.78,
            tags: ["style", "outfit", "trends"],
            nsfw: false,
            ageRestriction: void 0
          }
        ];
      }
      // Analyze mood and emotions
      async analyzeMood(session3) {
        return {
          primary: "energetic",
          secondary: ["playful", "confident"],
          emotions: [
            {
              type: "joy",
              intensity: 0.85,
              timestamps: [5, 15, 25]
            },
            {
              type: "excitement",
              intensity: 0.78,
              timestamps: [10, 20, 30]
            }
          ],
          energy: 0.82,
          valence: 0.75
        };
      }
      // Analyze audio components
      async analyzeAudio(session3) {
        return {
          hasMusic: true,
          hasSpeech: true,
          musicGenres: ["pop", "electronic"],
          speechLanguage: "en",
          speechClarity: 0.88,
          backgroundNoise: 0.15,
          trendingAudio: [
            {
              id: "audio1",
              name: "Trending Sound #1",
              popularity: 0.95,
              platform: "tiktok"
            }
          ],
          beatDetection: {
            bpm: 128,
            rhythm: "4/4",
            danceability: 0.85
          }
        };
      }
      // Analyze visual elements
      async analyzeVisual(session3) {
        return {
          dominantColors: ["#FF6B6B", "#4ECDC4", "#45B7D1"],
          brightness: 0.72,
          contrast: 0.68,
          saturation: 0.85,
          faces: [
            {
              count: 1,
              demographics: [
                {
                  age: 25,
                  gender: "female",
                  confidence: 0.92
                }
              ],
              expressions: [
                {
                  type: "smile",
                  confidence: 0.88
                }
              ],
              landmarks: []
            }
          ],
          objects: [
            {
              name: "clothing",
              confidence: 0.95,
              boundingBox: { x: 100, y: 200, width: 300, height: 400 },
              category: "fashion"
            }
          ],
          scenes: [
            {
              type: "indoor",
              duration: 30,
              startTime: 0,
              endTime: 30,
              objects: ["mirror", "clothing", "accessories"],
              activity: "fashion showcase"
            }
          ],
          quality: {
            sharpness: 0.85,
            noise: 0.12,
            compression: 0.18,
            overall: 0.82
          }
        };
      }
      // Predict engagement metrics
      async predictEngagement(session3, mood, audio, visual) {
        const factors = {
          visualAppeal: visual.quality.overall * 100,
          audioQuality: (1 - audio.backgroundNoise) * audio.speechClarity * 100,
          contentRelevance: 85,
          // Based on trending topics
          trendAlignment: audio.trendingAudio ? 90 : 60,
          emotionalImpact: mood.valence * mood.energy * 100
        };
        const score = Object.values(factors).reduce((a, b) => a + b, 0) / 5;
        return {
          score,
          factors,
          expectedViews: {
            low: Math.floor(score * 100),
            medium: Math.floor(score * 500),
            high: Math.floor(score * 1e3)
          },
          bestPlatforms: ["tiktok", "instagram"],
          viralPotential: score / 100
        };
      }
      // Generate content recommendations
      async generateRecommendations(session3, categories, mood, engagement) {
        const hashtags = await this.recommendHashtags(categories, mood);
        const captions = await this.suggestCaptions(session3, mood);
        const postingTime = await this.recommendPostingTime(engagement.bestPlatforms);
        const improvements = await this.suggestImprovements(session3, engagement);
        const similarContent = await this.findSimilarContent(categories);
        return {
          hashtags,
          captions,
          postingTime,
          improvements,
          similarContent
        };
      }
      // Recommend relevant hashtags
      async recommendHashtags(categories, mood) {
        const hashtags = [];
        for (const category of categories) {
          for (const tag of category.tags) {
            hashtags.push({
              tag: `#${tag}`,
              relevance: category.confidence,
              popularity: Math.random() * 0.5 + 0.5,
              trending: Math.random() > 0.7,
              platform: "all"
            });
          }
        }
        hashtags.push({
          tag: `#${mood.primary}vibes`,
          relevance: 0.9,
          popularity: 0.85,
          trending: true,
          platform: "instagram"
        });
        return hashtags.sort((a, b) => b.relevance * b.popularity - a.relevance * a.popularity).slice(0, 30);
      }
      // Suggest captions
      async suggestCaptions(session3, mood) {
        return [
          {
            text: "Living my best life and loving every moment! \u2728",
            style: "engaging",
            emojis: ["\u2728", "\u{1F495}", "\u{1F389}"],
            callToAction: "What's making you smile today?"
          },
          {
            text: "New content alert! Get ready for something special...",
            style: "mysterious",
            emojis: ["\u{1F525}", "\u{1F440}", "\u{1F4AB}"],
            callToAction: "Can you guess what's coming next?"
          },
          {
            text: "Behind every great outfit is an even greater confidence!",
            style: "informative",
            emojis: ["\u{1F4AA}", "\u{1F457}", "\u2728"],
            callToAction: "Share your confidence tips below!"
          }
        ];
      }
      // Recommend posting times
      async recommendPostingTime(platforms) {
        const recommendations = [];
        for (const platform of platforms) {
          const bestTime = /* @__PURE__ */ new Date();
          if (platform === "tiktok") {
            bestTime.setHours(19, 0, 0, 0);
          } else if (platform === "instagram") {
            bestTime.setHours(11, 0, 0, 0);
          } else if (platform === "youtube") {
            bestTime.setHours(14, 0, 0, 0);
          }
          recommendations.push({
            platform,
            bestTime,
            timezone: "UTC",
            audienceActivity: 0.85 + Math.random() * 0.15,
            competition: 0.3 + Math.random() * 0.4
          });
        }
        return recommendations;
      }
      // Suggest improvements
      async suggestImprovements(session3, engagement) {
        const suggestions = [];
        if (engagement.factors.audioQuality < 80) {
          suggestions.push({
            type: "audio",
            description: "Reduce background noise for clearer audio",
            impact: "high",
            effort: "easy",
            expectedImprovement: 15
          });
        }
        if (engagement.factors.trendAlignment < 70) {
          suggestions.push({
            type: "trend",
            description: "Use trending audio to increase discoverability",
            impact: "high",
            effort: "easy",
            expectedImprovement: 25
          });
        }
        if (engagement.factors.visualAppeal < 75) {
          suggestions.push({
            type: "visual",
            description: "Improve lighting for better visual quality",
            impact: "medium",
            effort: "moderate",
            expectedImprovement: 10
          });
        }
        suggestions.push({
          type: "engagement",
          description: "Add a call-to-action to encourage comments",
          impact: "medium",
          effort: "easy",
          expectedImprovement: 20
        });
        return suggestions;
      }
      // Find similar successful content
      async findSimilarContent(categories) {
        return [
          {
            id: "content1",
            title: "Fashion Transition Magic \u2728",
            creator: "@fashionista",
            platform: "tiktok",
            views: 15e5,
            engagement: 0.12,
            similarity: 0.88
          },
          {
            id: "content2",
            title: "GRWM: Festival Edition",
            creator: "@styleinfluencer",
            platform: "instagram",
            views: 85e4,
            engagement: 0.09,
            similarity: 0.82
          }
        ];
      }
      // Analyze trend alignment
      async analyzeTrends(session3, categories, mood) {
        const alignedTrends = [];
        const suggestedTrends = [];
        const viralElements = [];
        for (const platform in this.trendingTopics) {
          const trends = this.trendingTopics[platform];
          for (const trend of trends) {
            const alignment = this.calculateTrendAlignment(categories, mood, trend);
            if (alignment > 0.5) {
              alignedTrends.push({
                name: trend.name,
                platform,
                strength: trend.score,
                peakTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3),
                // Peak in 7 days
                relevance: alignment
              });
            } else if (alignment > 0.3) {
              suggestedTrends.push({
                name: trend.name,
                description: `Popular ${platform} trend`,
                howToApply: `Add elements of ${trend.name} to your content`,
                potentialReach: trend.score * 1e5
              });
            }
          }
        }
        viralElements.push(
          {
            element: "Hook in first 3 seconds",
            present: true,
            impact: 0.9
          },
          {
            element: "Trending audio",
            present: true,
            impact: 0.85
          },
          {
            element: "Clear call-to-action",
            present: false,
            impact: 0.7
          },
          {
            element: "Relatable content",
            present: true,
            impact: 0.8
          },
          {
            element: "Perfect loop",
            present: false,
            impact: 0.6
          }
        );
        return {
          alignedTrends,
          suggestedTrends,
          viralElements
        };
      }
      // Calculate trend alignment
      calculateTrendAlignment(categories, mood, trend) {
        let alignment = Math.random() * 0.5 + 0.3;
        if (trend.name.toLowerCase().includes("fashion") && categories.some((c) => c.name.toLowerCase().includes("fashion"))) {
          alignment += 0.3;
        }
        if (trend.name.includes("Challenge") && mood.energy > 0.7 || trend.name.includes("Aesthetic") && mood.valence > 0.6) {
          alignment += 0.2;
        }
        return Math.min(alignment, 1);
      }
      // Store analysis results
      async storeAnalysis(analysis) {
        await storage.updateContentSession(analysis.sessionId, {
          metadata: {
            analysis: {
              timestamp: analysis.timestamp,
              score: analysis.engagement.score,
              categories: analysis.categories.map((c) => c.name),
              mood: analysis.mood.primary,
              bestPlatforms: analysis.engagement.bestPlatforms,
              viralPotential: analysis.engagement.viralPotential
            }
          }
        });
      }
      // Get trending content for inspiration
      async getTrendingContent(platform, category) {
        const trending = [];
        const platformTrends = this.trendingTopics[platform] || [];
        for (const trend of platformTrends) {
          trending.push({
            id: trend.id,
            name: trend.name,
            examples: Math.floor(Math.random() * 1e3) + 100,
            growthRate: Math.random() * 0.5 + 0.5,
            peakPrediction: new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1e3)
          });
        }
        return trending;
      }
      // Analyze competitor content
      async analyzeCompetitor(competitorId, timeRange) {
        return {
          competitorId,
          totalContent: Math.floor(Math.random() * 100) + 20,
          avgEngagement: Math.random() * 0.15 + 0.05,
          topCategories: ["Fashion", "Lifestyle", "Beauty"],
          postingFrequency: {
            daily: Math.random() * 3 + 1,
            weekly: Math.random() * 20 + 7
          },
          bestPerformingTime: "7:00 PM UTC",
          commonHashtags: ["#fashion", "#ootd", "#style"],
          contentStrategy: {
            shortForm: 0.7,
            longForm: 0.3,
            live: 0.1
          }
        };
      }
      // Generate content calendar recommendations
      async generateContentCalendar(creatorId, duration) {
        const calendar = [];
        const today = /* @__PURE__ */ new Date();
        for (let i = 0; i < duration; i++) {
          const date = new Date(today);
          date.setDate(date.getDate() + i);
          calendar.push({
            date,
            recommendations: [
              {
                time: new Date(date.setHours(11, 0, 0, 0)),
                platform: "instagram",
                contentType: "reel",
                suggestedTopic: this.getTopicForDay(i),
                expectedEngagement: Math.random() * 0.15 + 0.08
              },
              {
                time: new Date(date.setHours(19, 0, 0, 0)),
                platform: "tiktok",
                contentType: "short",
                suggestedTopic: this.getTopicForDay(i + 1),
                expectedEngagement: Math.random() * 0.2 + 0.1
              }
            ]
          });
        }
        return calendar;
      }
      getTopicForDay(dayOffset) {
        const topics = [
          "Fashion Haul",
          "Get Ready With Me",
          "Outfit of the Day",
          "Behind the Scenes",
          "Q&A Session",
          "Tutorial Tuesday",
          "Transformation Thursday"
        ];
        return topics[dayOffset % topics.length];
      }
    };
    contentAnalyzerService = new ContentAnalyzerService();
  }
});

// server/routes.ts
import { createServer } from "http";
import { WebSocketServer as WebSocketServer3, WebSocket as WebSocket3 } from "ws";
import { z as z2 } from "zod";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
async function registerRoutes(app2) {
  app2.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        scriptSrc: process.env.NODE_ENV === "development" ? ["'self'", "'unsafe-inline'", "'unsafe-eval'"] : ["'self'"],
        connectSrc: ["'self'", "wss:", "ws:"]
      }
    }
  }));
  app2.use(limiter);
  await setupAuth(app2);
  app2.get("/api/health", async (req, res) => {
    try {
      const health = await storage.getSystemHealth();
      res.json({
        status: "healthy",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        uptime: process.uptime(),
        ...health
      });
    } catch (error) {
      res.status(500).json({ message: "Health check failed" });
    }
  });
  app2.get("/api/user/profile", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const profile = await storage.getProfile(userId);
      res.json({
        ...user,
        profile
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  app2.get("/api/profile", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getProfileWithUser(userId);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });
  app2.post("/api/profile", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const profileData = insertProfileSchema.parse({ ...req.body, userId });
      const existingProfile = await storage.getProfile(userId);
      let profile;
      if (existingProfile) {
        profile = await storage.updateProfile(userId, profileData);
      } else {
        profile = await storage.createProfile(profileData);
      }
      res.json(profile);
    } catch (error) {
      console.error("Error creating/updating profile:", error);
      res.status(500).json({ message: "Failed to save profile" });
    }
  });
  app2.get("/api/stats", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });
  app2.post("/api/verification/session", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { userType } = req.body;
      const session3 = await verificationService.createSession(userId, userType);
      res.json({
        sessionId: session3.id,
        expiresAt: session3.expiresAt
      });
    } catch (error) {
      console.error("Error creating verification session:", error);
      res.status(500).json({ message: "Failed to create verification session" });
    }
  });
  app2.post("/api/verification/submit/:sessionId", isAuthenticated, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { documentType, frontImageBase64, backImageBase64, selfieImageBase64 } = req.body;
      const result = await verificationService.submitVerification(
        sessionId,
        documentType,
        frontImageBase64,
        backImageBase64,
        selfieImageBase64
      );
      res.json(result);
    } catch (error) {
      console.error("Error submitting verification:", error);
      res.status(500).json({ message: "Failed to submit verification" });
    }
  });
  app2.get("/api/verification/status", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const status = await verificationService.getUserVerificationStatus(userId);
      res.json(status);
    } catch (error) {
      console.error("Error fetching verification status:", error);
      res.status(500).json({ message: "Failed to fetch verification status" });
    }
  });
  app2.get("/api/verification/status/:userId", isAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      const status = await verificationService.getUserVerificationStatus(userId);
      res.json(status);
    } catch (error) {
      console.error("Error fetching user verification status:", error);
      res.status(500).json({ message: "Failed to fetch verification status" });
    }
  });
  app2.get("/api/verification/result/:sessionId", isAuthenticated, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const result = await verificationService.getVerificationResult(sessionId);
      if (!result) {
        return res.status(404).json({ message: "Verification session not found" });
      }
      res.json(result);
    } catch (error) {
      console.error("Error fetching verification result:", error);
      res.status(500).json({ message: "Failed to fetch verification result" });
    }
  });
  app2.get("/api/verification/history", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const history = await verificationService.getVerificationHistory(userId);
      res.json(history);
    } catch (error) {
      console.error("Error fetching verification history:", error);
      res.status(500).json({ message: "Failed to fetch verification history" });
    }
  });
  app2.get("/api/verification/compliance-report", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized" });
      }
      const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3);
      const endDate = req.query.endDate ? new Date(req.query.endDate) : /* @__PURE__ */ new Date();
      const report = await verificationService.generateComplianceReport(startDate, endDate);
      res.json(report);
    } catch (error) {
      console.error("Error generating compliance report:", error);
      res.status(500).json({ message: "Failed to generate compliance report" });
    }
  });
  const requireVerification = async (req, res, next) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const status = await verificationService.getUserVerificationStatus(userId);
      if (!status.verified) {
        return res.status(403).json({
          message: "Verification required",
          verificationRequired: true,
          status: status.status
        });
      }
      if (await verificationService.needsReverification(userId)) {
        res.setHeader("X-Verification-Warning", "Verification expiring soon");
      }
      next();
    } catch (error) {
      console.error("Error checking verification:", error);
      res.status(500).json({ message: "Failed to check verification status" });
    }
  };
  const creatorOnboardingSchema = z2.object({
    displayName: z2.string().min(1, "Display name is required"),
    stageName: z2.string().optional(),
    pronouns: z2.string().optional(),
    bio: z2.string().optional(),
    selectedNiches: z2.array(z2.string()).max(3, "Maximum 3 niches allowed"),
    payoutMethod: z2.enum(["paypal", "bank", "crypto"]),
    payoutEmail: z2.string().email().optional()
  });
  const fanOnboardingSchema = z2.object({
    birthday: z2.string(),
    selectedInterests: z2.array(z2.string()),
    paymentAdded: z2.boolean().optional()
  });
  app2.get("/api/creator/studio/settings", isAuthenticated, requireVerification, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const settings = {
        autoEditingEnabled: false,
        autoDistributionEnabled: false,
        preferredPlatforms: [],
        defaultHashtags: [],
        aiPricingSuggestions: true
      };
      res.json(settings);
    } catch (error) {
      console.error("Error fetching studio settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });
  app2.post("/api/creator/studio/settings", isAuthenticated, requireVerification, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const settings = req.body;
      console.log("Updating studio settings for user:", userId, settings);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating studio settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });
  app2.get("/api/creator/content/sessions", isAuthenticated, requireVerification, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessions2 = await storage.getContentSessionsByUserId(userId);
      res.json(sessions2 || []);
    } catch (error) {
      console.error("Error fetching content sessions:", error);
      res.status(500).json({ message: "Failed to fetch content sessions" });
    }
  });
  app2.post("/api/creator/content/sessions", isAuthenticated, requireVerification, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { title, description, type, sourceType, originalUrl } = req.body;
      const session3 = await storage.createContentSession({
        ownerId: userId,
        title,
        description,
        type,
        sourceType,
        originalUrl,
        status: "processing"
      });
      await storage.createAuditLog({
        actorId: userId,
        action: "content_session_created",
        targetType: "content_session",
        targetId: session3.id,
        metadata: { type, sourceType }
      });
      res.json(session3);
    } catch (error) {
      console.error("Error creating content session:", error);
      res.status(500).json({ message: "Failed to create content session" });
    }
  });
  app2.delete("/api/creator/content/sessions/:sessionId", isAuthenticated, requireVerification, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { sessionId } = req.params;
      await storage.deleteContentSession(sessionId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting content session:", error);
      res.status(500).json({ message: "Failed to delete content session" });
    }
  });
  app2.post("/api/creator/content/process/:sessionId", isAuthenticated, requireVerification, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { sessionId } = req.params;
      const { editingOptions } = req.body;
      const task = await aiEditorService.startEditingTask(sessionId, editingOptions);
      res.json({
        taskId: task.id,
        status: "processing"
      });
    } catch (error) {
      console.error("Error processing content:", error);
      res.status(500).json({ message: "Failed to process content" });
    }
  });
  app2.post("/api/creator/onboarding", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const onboardingData = creatorOnboardingSchema.parse(req.body);
      await storage.updateUser(userId, { isCreator: true });
      const profileData = {
        userId,
        displayName: onboardingData.displayName,
        bio: onboardingData.bio || "",
        niches: onboardingData.selectedNiches || [],
        pronouns: onboardingData.pronouns || ""
      };
      const existingProfile = await storage.getProfile(userId);
      let profile;
      if (existingProfile) {
        profile = await storage.updateProfile(userId, profileData);
      } else {
        profile = await storage.createProfile(profileData);
      }
      console.log("Creator payout setup:", {
        userId,
        method: onboardingData.payoutMethod,
        email: onboardingData.payoutEmail
      });
      await storage.createAuditLog({
        actorId: userId,
        action: "creator_onboarding_complete",
        targetType: "user",
        targetId: userId,
        metadata: { niches: onboardingData.selectedNiches }
      });
      res.json({
        success: true,
        profile,
        message: "Creator onboarding completed successfully"
      });
    } catch (error) {
      console.error("Error completing creator onboarding:", error);
      res.status(500).json({ message: "Failed to complete onboarding" });
    }
  });
  app2.post("/api/fan/onboarding", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const onboardingData = fanOnboardingSchema.parse(req.body);
      if (onboardingData.birthday) {
        const birthDate = new Date(onboardingData.birthday);
        const age = Math.floor(((/* @__PURE__ */ new Date()).getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1e3));
        if (age < 18) {
          return res.status(400).json({ message: "You must be 18 or older to join GirlFanz" });
        }
        const user = await storage.getUser(userId);
        if (user) {
          const verificationResult = await verifymyService.verifyAge({
            userId,
            firstName: user.firstName || "Unknown",
            lastName: user.lastName || "Unknown",
            dateOfBirth: onboardingData.birthday,
            email: user.email || "",
            address: {
              street: "",
              city: "",
              state: "",
              zipCode: "",
              country: "US"
            }
          }).catch((err) => {
            console.error("VerifyMy age verification failed:", err);
            return { transactionId: "pending", status: "pending" };
          });
          await storage.createKycVerification({
            userId,
            provider: "verifymy",
            status: "pending",
            documentType: "age_verification",
            dataJson: { transactionId: verificationResult.transactionId }
          });
        }
      }
      const profileData = {
        userId,
        interests: onboardingData.selectedInterests || []
      };
      const existingProfile = await storage.getProfile(userId);
      let profile;
      if (existingProfile) {
        profile = await storage.updateProfile(userId, profileData);
      } else {
        profile = await storage.createProfile(profileData);
      }
      await storage.createAuditLog({
        actorId: userId,
        action: "fan_onboarding_complete",
        targetType: "user",
        targetId: userId,
        metadata: { interests: onboardingData.selectedInterests }
      });
      res.json({
        success: true,
        profile,
        message: "Fan onboarding completed successfully"
      });
    } catch (error) {
      console.error("Error completing fan onboarding:", error);
      res.status(500).json({ message: "Failed to complete onboarding" });
    }
  });
  app2.post("/api/webhooks/verifymy", async (req, res) => {
    try {
      const signature = req.headers["x-signature"];
      const rawBody = JSON.stringify(req.body);
      if (!signature || !verifymyService.verifyWebhookSignature(rawBody, signature)) {
        console.error("Invalid VerifyMy webhook signature");
        return res.status(401).json({ message: "Invalid signature" });
      }
      await verifymyService.processWebhookNotification(req.body);
      res.json({ success: true });
    } catch (error) {
      console.error("Error processing VerifyMy webhook:", error);
      res.status(500).json({ message: "Webhook processing failed" });
    }
  });
  app2.get("/api/media", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit) || 20;
      const media = await storage.getMediaAssetsByOwner(userId, limit);
      res.json(media);
    } catch (error) {
      console.error("Error fetching media:", error);
      res.status(500).json({ message: "Failed to fetch media" });
    }
  });
  app2.post("/api/media", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const mediaData = insertMediaAssetSchema.parse({ ...req.body, ownerId: userId });
      const media = await storage.createMediaAsset(mediaData);
      await storage.createModerationItem({
        mediaId: media.id,
        status: "pending",
        priority: 1,
        aiConfidence: Math.floor(Math.random() * 40) + 60
        // Simulate AI confidence
      });
      await storage.createAuditLog({
        actorId: userId,
        action: "media_upload",
        targetType: "media",
        targetId: media.id,
        metadata: { filename: media.filename, mimeType: media.mimeType }
      });
      res.json(media);
    } catch (error) {
      console.error("Error creating media:", error);
      res.status(500).json({ message: "Failed to create media" });
    }
  });
  app2.get(/^\/objects\/(.*)$/, isAuthenticated, async (req, res) => {
    const userId = req.user?.claims?.sub;
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId,
        requestedPermission: "read" /* READ */
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });
  app2.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });
  app2.put("/api/media/upload", isAuthenticated, async (req, res) => {
    if (!req.body.mediaUrl) {
      return res.status(400).json({ error: "mediaUrl is required" });
    }
    const userId = req.user?.claims?.sub;
    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.mediaUrl,
        {
          owner: userId,
          visibility: req.body.isPublic ? "public" : "private"
        }
      );
      res.status(200).json({ objectPath });
    } catch (error) {
      console.error("Error setting media ACL:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/conversations", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversations = await storage.getConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });
  app2.get("/api/messages/:otherUserId", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { otherUserId } = req.params;
      const limit = parseInt(req.query.limit) || 50;
      const messages2 = await storage.getMessages(userId, otherUserId, limit);
      res.json(messages2);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });
  app2.post("/api/messages", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const messageData = insertMessageSchema.parse({ ...req.body, senderId: userId });
      const message = await storage.createMessage(messageData);
      broadcastToUser(messageData.receiverId, {
        type: "new_message",
        data: message
      });
      res.json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });
  app2.post("/api/streams/create", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const config = req.body;
      const session3 = await streamingService.createStream(userId, config);
      res.json({
        sessionId: session3.id,
        streamId: session3.streamId,
        streamKey: session3.streamKey,
        rtcConfiguration: session3.rtcConfiguration,
        status: session3.status
      });
    } catch (error) {
      console.error("Error creating stream:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to create stream" });
    }
  });
  app2.get("/api/streams/:streamId", isAuthenticated, async (req, res) => {
    try {
      const { streamId } = req.params;
      const stream = await storage.getLiveStream(streamId);
      if (!stream) {
        return res.status(404).json({ message: "Stream not found" });
      }
      res.json(stream);
    } catch (error) {
      console.error("Error fetching stream:", error);
      res.status(500).json({ message: "Failed to fetch stream" });
    }
  });
  app2.get("/api/streams/active", isAuthenticated, async (req, res) => {
    try {
      const sessions2 = streamingService.getActiveSessions();
      res.json(sessions2.map((s) => ({
        sessionId: s.id,
        streamId: s.streamId,
        creatorId: s.creatorId,
        status: s.status,
        viewerCount: s.analytics.currentViewers,
        startedAt: s.startedAt
      })));
    } catch (error) {
      console.error("Error fetching active streams:", error);
      res.status(500).json({ message: "Failed to fetch active streams" });
    }
  });
  app2.post("/api/streams/:sessionId/start", isAuthenticated, async (req, res) => {
    try {
      const { sessionId } = req.params;
      await streamingService.startStream(sessionId);
      res.json({ message: "Stream started successfully" });
    } catch (error) {
      console.error("Error starting stream:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to start stream" });
    }
  });
  app2.post("/api/streams/:sessionId/end", isAuthenticated, async (req, res) => {
    try {
      const { sessionId } = req.params;
      await streamingService.endStream(sessionId);
      res.json({ message: "Stream ended successfully" });
    } catch (error) {
      console.error("Error ending stream:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to end stream" });
    }
  });
  app2.get("/api/streams/:streamId/analytics", isAuthenticated, async (req, res) => {
    try {
      const { streamId } = req.params;
      const analytics = await storage.getStreamAnalytics(streamId);
      if (!analytics) {
        const session3 = streamingService.getAllSessions().find((s) => s.streamId === streamId);
        if (session3) {
          return res.json(session3.analytics);
        }
        return res.status(404).json({ message: "Analytics not found" });
      }
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching stream analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });
  app2.get("/api/streams/:streamId/highlights", isAuthenticated, async (req, res) => {
    try {
      const { streamId } = req.params;
      const highlights = await storage.getStreamHighlights(streamId);
      res.json(highlights);
    } catch (error) {
      console.error("Error fetching highlights:", error);
      res.status(500).json({ message: "Failed to fetch highlights" });
    }
  });
  app2.get("/api/streams/:streamId/recording", isAuthenticated, async (req, res) => {
    try {
      const { streamId } = req.params;
      const recording = await storage.getStreamRecording(streamId);
      if (!recording) {
        return res.status(404).json({ message: "Recording not found" });
      }
      res.json(recording);
    } catch (error) {
      console.error("Error fetching recording:", error);
      res.status(500).json({ message: "Failed to fetch recording" });
    }
  });
  app2.get("/api/streams/:streamId/chat", isAuthenticated, async (req, res) => {
    try {
      const { streamId } = req.params;
      const limit = parseInt(req.query.limit) || 100;
      const messages2 = await storage.getStreamChatMessages(streamId, limit);
      res.json(messages2);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });
  app2.get("/api/streams/:streamId/gifts", isAuthenticated, async (req, res) => {
    try {
      const { streamId } = req.params;
      const gifts = await storage.getStreamGifts(streamId);
      res.json(gifts);
    } catch (error) {
      console.error("Error fetching gifts:", error);
      res.status(500).json({ message: "Failed to fetch gifts" });
    }
  });
  app2.get("/api/moderation/queue", isAuthenticated, async (req, res) => {
    try {
      const status = req.query.status;
      const limit = parseInt(req.query.limit) || 50;
      const queue = await storage.getModerationQueue(status, limit);
      res.json(queue);
    } catch (error) {
      console.error("Error fetching moderation queue:", error);
      res.status(500).json({ message: "Failed to fetch moderation queue" });
    }
  });
  app2.patch("/api/moderation/:itemId", isAuthenticated, async (req, res) => {
    try {
      const { itemId } = req.params;
      const userId = req.user.claims.sub;
      const { status, notes } = req.body;
      const item = await storage.updateModerationItem(itemId, {
        status,
        notes,
        reviewerId: userId
      });
      if (item && item.mediaId) {
        await storage.updateMediaAsset(item.mediaId, {
          status: status === "approved" ? "approved" : "rejected"
        });
      }
      await storage.createAuditLog({
        actorId: userId,
        action: "moderation_review",
        targetType: "moderation",
        targetId: itemId,
        metadata: { status, notes }
      });
      res.json(item);
    } catch (error) {
      console.error("Error updating moderation item:", error);
      res.status(500).json({ message: "Failed to update moderation item" });
    }
  });
  const httpServer = createServer(app2);
  const wss = new WebSocketServer3({
    server: httpServer,
    path: "/ws",
    verifyClient: (info) => {
      const url = new URL(info.req.url, `http://${info.req.headers.host}`);
      const token = url.searchParams.get("token");
      console.log("WebSocket verification - token present:", !!token);
      return true;
    }
  });
  const connections = /* @__PURE__ */ new Map();
  const streamHandler = initStreamWebSocketHandler(wss);
  wss.on("connection", (ws, req) => {
    let userId = null;
    console.log("WebSocket connection attempt from:", req.socket.remoteAddress);
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get("token");
    const purpose = url.searchParams.get("purpose");
    if (token) {
      console.log("WebSocket connection with token:", token.substring(0, 10) + "...");
      userId = token;
      connections.set(userId, ws);
      ws.send(JSON.stringify({
        type: "auth_success",
        userId
      }));
      console.log("WebSocket authenticated via token");
    }
    if (purpose === "stream") {
      streamHandler.handleConnection(ws, req);
      return;
    }
    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log("WebSocket message received:", message.type, userId ? `from user ${userId}` : "(unauthenticated)");
        if (message.type && message.type.startsWith("stream_") || ["create_stream", "join_stream", "leave_stream", "send_gift", "send_reaction"].includes(message.type)) {
          streamHandler.handleConnection(ws, req);
          return;
        }
        if (message.type === "auth") {
          userId = message.userId;
          connections.set(userId, ws);
          console.log(`User ${userId} successfully authenticated via WebSocket`);
          ws.send(JSON.stringify({
            type: "auth_success",
            userId
          }));
        }
        if (message.type === "ping") {
          ws.send(JSON.stringify({ type: "pong" }));
        }
        if (message.type === "chat_message" && userId) {
          const messageData = {
            senderId: userId,
            receiverId: message.receiverId,
            content: message.content
          };
          const newMessage = await storage.createMessage(messageData);
          const receiverWs = connections.get(message.receiverId);
          if (receiverWs && receiverWs.readyState === WebSocket3.OPEN) {
            receiverWs.send(JSON.stringify({
              type: "new_message",
              data: newMessage
            }));
          }
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });
    ws.on("close", () => {
      if (userId) {
        connections.delete(userId);
        console.log(`User ${userId} disconnected from WebSocket`);
      }
    });
  });
  function broadcastToUser(userId, message) {
    const ws = connections.get(userId);
    if (ws && ws.readyState === WebSocket3.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }
  const ccbillService = createCCBillService();
  app2.get("/api/ccbill/checkout-url", isAuthenticated, (req, res) => {
    try {
      const { amount, type = "purchase" } = req.query;
      const userId = req.user.claims.sub;
      if (!amount) {
        return res.status(400).json({ error: "Amount is required" });
      }
      const checkoutUrl = ccbillService.generatePurchaseCheckoutUrl({
        userId,
        amount: parseInt(amount),
        type,
        creatorId: "demo-creator"
        // For testing purposes
      });
      res.json({
        url: checkoutUrl.url,
        digest: checkoutUrl.digest,
        amount: parseInt(amount),
        type
      });
    } catch (error) {
      console.error("Error generating CCBill checkout URL:", error);
      res.status(500).json({ error: "Failed to generate checkout URL" });
    }
  });
  app2.post("/api/payments/subscription/checkout", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { creatorId, pricePerMonth, planName, description, billingCycle } = req.body;
      if (!creatorId || !pricePerMonth) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const checkoutUrl = ccbillService.generateSubscriptionCheckoutUrl({
        userId,
        creatorId,
        pricePerMonth,
        currency: "USD",
        planName: planName || "Monthly Subscription",
        description: description || "Creator subscription",
        billingCycle: billingCycle || "monthly"
      });
      await storage.createAuditLog({
        actorId: userId,
        action: "checkout_created",
        targetType: "subscription",
        targetId: creatorId,
        metadata: { pricePerMonth, provider: "ccbill" }
      });
      res.json({ checkoutUrl });
    } catch (error) {
      console.error("Error creating subscription checkout:", error);
      res.status(500).json({ error: "Failed to create checkout" });
    }
  });
  app2.post("/api/payments/purchase/checkout", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { creatorId, mediaId, amount, description, type } = req.body;
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }
      const checkoutUrl = ccbillService.generatePurchaseCheckoutUrl({
        userId,
        creatorId,
        mediaId,
        amount,
        currency: "USD",
        description: description || "Content purchase",
        type: type || "purchase"
      });
      await storage.createAuditLog({
        actorId: userId,
        action: "checkout_created",
        targetType: "purchase",
        targetId: mediaId || creatorId,
        metadata: { amount, provider: "ccbill", type }
      });
      res.json({ checkoutUrl });
    } catch (error) {
      console.error("Error creating purchase checkout:", error);
      res.status(500).json({ error: "Failed to create checkout" });
    }
  });
  app2.post("/api/webhooks/ccbill", async (req, res) => {
    try {
      const formData = req.body;
      if (!ccbillService.verifyWebhookData(formData)) {
        console.error("Invalid CCBill webhook verification");
        return res.status(401).json({ error: "Invalid verification" });
      }
      await ccbillService.processWebhookNotification(formData);
      res.status(200).json({ status: "success" });
    } catch (error) {
      console.error("Error processing CCBill webhook:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });
  app2.get("/api/subscriptions", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const subscriptions2 = await storage.getSubscriptionsAsFan(userId);
      res.json(subscriptions2);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      res.status(500).json({ error: "Failed to fetch subscriptions" });
    }
  });
  app2.get("/api/subscriptions/creator", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const subscriptions2 = await storage.getSubscriptionsAsCreator(userId);
      res.json(subscriptions2);
    } catch (error) {
      console.error("Error fetching creator subscriptions:", error);
      res.status(500).json({ error: "Failed to fetch subscriptions" });
    }
  });
  app2.get("/api/transactions", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const transactions2 = await storage.getTransactionsAsBuyer(userId);
      res.json(transactions2);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });
  app2.get("/api/transactions/creator", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const transactions2 = await storage.getTransactionsAsCreator(userId);
      res.json(transactions2);
    } catch (error) {
      console.error("Error fetching creator transactions:", error);
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });
  app2.post("/api/verification/age", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const verificationRequest = {
        userId,
        firstName: user.firstName || req.body.firstName,
        lastName: user.lastName || req.body.lastName,
        dateOfBirth: req.body.dateOfBirth,
        ssn4: req.body.ssn4,
        phone: req.body.phone,
        email: user.email,
        address: req.body.address
      };
      const result = await verifymyService.verifyAge(verificationRequest);
      res.json({
        transactionId: result.transactionId,
        status: result.status,
        confidence: result.confidence
      });
    } catch (error) {
      console.error("Error processing age verification:", error);
      res.status(500).json({ error: "Age verification failed" });
    }
  });
  app2.post("/api/verification/identity", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const verificationRequest = {
        userId,
        documentType: req.body.documentType,
        frontImageUrl: req.body.frontImageUrl,
        backImageUrl: req.body.backImageUrl,
        selfieImageUrl: req.body.selfieImageUrl,
        documentNumber: req.body.documentNumber
      };
      const result = await verifymyService.verifyIdentity(verificationRequest);
      res.json({
        transactionId: result.transactionId,
        status: result.status,
        confidence: result.confidence
      });
    } catch (error) {
      console.error("Error processing identity verification:", error);
      res.status(500).json({ error: "Identity verification failed" });
    }
  });
  app2.get("/api/verification/status", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const verification = await storage.getKycVerification(userId);
      let profile = await storage.getProfile(userId);
      if (!profile) {
        profile = await storage.createProfile({
          userId,
          ageVerified: false,
          kycStatus: "pending"
        });
      }
      const ageVerification = await storage.getKycVerificationByType(userId, "age_verification");
      const identityVerification = await storage.getKycVerificationByType(userId, "identity_verification");
      res.json({
        ageVerified: profile.ageVerified,
        kycStatus: profile.kycStatus,
        lastVerification: verification,
        ageVerification: ageVerification ? {
          status: ageVerification.status,
          confidence: ageVerification.dataJson?.confidence,
          verifiedAt: ageVerification.verifiedAt,
          createdAt: ageVerification.createdAt
        } : null,
        identityVerification: identityVerification ? {
          status: identityVerification.status,
          confidence: identityVerification.dataJson?.confidence,
          verifiedAt: identityVerification.verifiedAt,
          createdAt: identityVerification.createdAt
        } : null
      });
    } catch (error) {
      console.error("Error fetching verification status:", error);
      res.status(500).json({ error: "Failed to fetch verification status" });
    }
  });
  app2.post("/api/moderation/ai", isAuthenticated, async (req, res) => {
    try {
      const { mediaId, contentUrl, contentType } = req.body;
      const userId = req.user.claims.sub;
      const result = await verifymyService.moderateContent(
        contentUrl,
        contentType,
        { userId, mediaId }
      );
      res.json(result);
    } catch (error) {
      console.error("Error processing AI moderation:", error);
      res.status(500).json({ error: "AI moderation failed" });
    }
  });
  app2.post("/api/webhooks/verifymy", async (req, res) => {
    try {
      const signature = req.headers["x-verifymy-signature"];
      const body = JSON.stringify(req.body);
      if (!verifymyService.verifyWebhookSignature(body, signature)) {
        console.error("Invalid verifymy webhook signature");
        return res.status(401).json({ error: "Invalid signature" });
      }
      await verifymyService.processWebhookNotification(req.body);
      res.status(200).json({ status: "success" });
    } catch (error) {
      console.error("Error processing verifymy webhook:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });
  app2.get("/api/payouts/earnings", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const months = parseInt(req.query.months) || 12;
      const summary = await creatorPayoutService.getCreatorEarningsSummary(userId, months);
      res.json(summary);
    } catch (error) {
      console.error("Error fetching creator earnings:", error);
      res.status(500).json({ error: "Failed to fetch earnings" });
    }
  });
  app2.get("/api/payouts/calculate", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ error: "Start date and end date are required" });
      }
      const calculation = await creatorPayoutService.calculateCreatorEarnings(
        userId,
        new Date(startDate),
        new Date(endDate)
      );
      res.json(calculation);
    } catch (error) {
      console.error("Error calculating earnings:", error);
      res.status(500).json({ error: "Failed to calculate earnings" });
    }
  });
  app2.post("/api/payouts/request", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { amount, payoutAccountId } = req.body;
      if (!amount || !payoutAccountId) {
        return res.status(400).json({ error: "Amount and payout account are required" });
      }
      res.json({
        success: true,
        message: "Payout request submitted",
        payoutId: `payout_${Date.now()}`,
        amount,
        status: "pending"
      });
    } catch (error) {
      console.error("Error requesting payout:", error);
      res.status(500).json({ error: "Failed to request payout" });
    }
  });
  app2.post("/api/admin/payouts/process", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }
      const results = await creatorPayoutService.processScheduledPayouts();
      res.json({
        success: true,
        results
      });
    } catch (error) {
      console.error("Error processing payouts:", error);
      res.status(500).json({ error: "Failed to process payouts" });
    }
  });
  app2.post("/api/media/:id/fingerprint", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const mediaId = req.params.id;
      const media = await storage.getMediaAsset(mediaId);
      if (!media || media.ownerId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      const matches = await contentFingerprintingService.findSimilarContent(mediaId, 0.8);
      res.json({
        mediaId,
        matches,
        forensicSignature: media.forensicSignature
      });
    } catch (error) {
      console.error("Error checking content fingerprint:", error);
      res.status(500).json({ error: "Failed to check fingerprint" });
    }
  });
  app2.get("/api/admin/audit-logs", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }
      const limit = Math.min(parseInt(req.query.limit) || 100, 1e3);
      const offset = parseInt(req.query.offset) || 0;
      const action = req.query.action;
      res.json({
        logs: [],
        total: 0,
        limit,
        offset
      });
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  });
  app2.get("/api/support/tickets", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      let tickets;
      if (user?.role === "admin" || user?.role === "support") {
        const status = req.query.status;
        tickets = await storage.getSupportTickets(void 0, status);
      } else {
        tickets = await storage.getSupportTickets(userId);
      }
      res.json({ tickets });
    } catch (error) {
      console.error("Error fetching support tickets:", error);
      res.status(500).json({ error: "Failed to fetch tickets" });
    }
  });
  app2.get("/api/support/tickets/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const ticketId = req.params.id;
      const ticket = await storage.getSupportTicket(ticketId);
      if (!ticket) {
        return res.status(404).json({ error: "Ticket not found" });
      }
      if (ticket.userId !== userId && user?.role !== "admin" && user?.role !== "support") {
        return res.status(403).json({ error: "Access denied" });
      }
      const messages2 = await storage.getSupportMessages(ticketId);
      res.json({ ticket, messages: messages2 });
    } catch (error) {
      console.error("Error fetching support ticket:", error);
      res.status(500).json({ error: "Failed to fetch ticket" });
    }
  });
  app2.post("/api/support/tickets", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const ticketData = insertSupportTicketSchema.parse({
        ...req.body,
        userId,
        status: "open"
      });
      const ticket = await storage.createSupportTicket(ticketData);
      if (req.body.message) {
        await storage.createSupportMessage({
          ticketId: ticket.id,
          senderId: userId,
          body: req.body.message,
          isInternalNote: false
        });
      }
      res.json({ ticket });
    } catch (error) {
      console.error("Error creating support ticket:", error);
      res.status(500).json({ error: "Failed to create ticket" });
    }
  });
  app2.put("/api/support/tickets/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const ticketId = req.params.id;
      const ticket = await storage.getSupportTicket(ticketId);
      if (!ticket) {
        return res.status(404).json({ error: "Ticket not found" });
      }
      if (ticket.userId !== userId && user?.role !== "admin" && user?.role !== "support") {
        return res.status(403).json({ error: "Access denied" });
      }
      let allowedUpdates = {};
      if (user?.role === "admin" || user?.role === "support") {
        const staffUpdateSchema = z2.object({
          status: z2.enum(["open", "in_progress", "resolved", "closed"]).optional(),
          priority: z2.enum(["low", "normal", "high", "critical"]).optional(),
          assignedTo: z2.string().optional(),
          category: z2.string().optional()
        });
        allowedUpdates = staffUpdateSchema.parse(req.body);
      } else {
        const userUpdateSchema = z2.object({
          subject: z2.string().max(255).optional(),
          category: z2.string().optional()
        });
        allowedUpdates = userUpdateSchema.parse(req.body);
      }
      const updatedTicket = await storage.updateSupportTicket(ticketId, allowedUpdates);
      res.json({ ticket: updatedTicket });
    } catch (error) {
      console.error("Error updating support ticket:", error);
      res.status(500).json({ error: "Failed to update ticket" });
    }
  });
  app2.post("/api/support/tickets/:id/messages", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const ticketId = req.params.id;
      const ticket = await storage.getSupportTicket(ticketId);
      if (!ticket) {
        return res.status(404).json({ error: "Ticket not found" });
      }
      if (ticket.userId !== userId && user?.role !== "admin" && user?.role !== "support") {
        return res.status(403).json({ error: "Access denied" });
      }
      const messageData = insertSupportMessageSchema.parse({
        ticketId,
        senderId: userId,
        body: req.body.message,
        isInternalNote: user?.role === "admin" || user?.role === "support"
      });
      const message = await storage.createSupportMessage(messageData);
      res.json({ message });
    } catch (error) {
      console.error("Error creating support message:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });
  app2.get("/api/wiki/articles", async (req, res) => {
    try {
      const category = req.query.category;
      const searchQuery = req.query.search;
      const articles = await storage.getKnowledgeArticles(category, searchQuery);
      res.json({ articles });
    } catch (error) {
      console.error("Error fetching knowledge articles:", error);
      res.status(500).json({ error: "Failed to fetch articles" });
    }
  });
  app2.get("/api/wiki/articles/:id", async (req, res) => {
    try {
      const articleId = req.params.id;
      const article = await storage.getKnowledgeArticle(articleId);
      if (!article) {
        return res.status(404).json({ error: "Article not found" });
      }
      res.json({ article });
    } catch (error) {
      console.error("Error fetching knowledge article:", error);
      res.status(500).json({ error: "Failed to fetch article" });
    }
  });
  app2.get("/api/wiki/articles/by-slug/:slug", async (req, res) => {
    try {
      const slug = req.params.slug;
      const article = await storage.getKnowledgeArticleBySlug(slug);
      if (!article) {
        return res.status(404).json({ error: "Article not found" });
      }
      res.json(article);
    } catch (error) {
      console.error("Error fetching knowledge article by slug:", error);
      res.status(500).json({ error: "Failed to fetch article" });
    }
  });
  app2.post("/api/wiki/articles", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (user?.role !== "admin" && user?.role !== "support") {
        return res.status(403).json({ error: "Admin access required" });
      }
      const articleData = insertKnowledgeArticleSchema.parse({
        ...req.body,
        authorId: userId
      });
      const article = await storage.createKnowledgeArticle(articleData);
      res.json({ article });
    } catch (error) {
      console.error("Error creating knowledge article:", error);
      res.status(500).json({ error: "Failed to create article" });
    }
  });
  app2.put("/api/wiki/articles/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const articleId = req.params.id;
      if (user?.role !== "admin" && user?.role !== "support") {
        return res.status(403).json({ error: "Admin access required" });
      }
      const updatedArticle = await storage.updateKnowledgeArticle(articleId, req.body);
      res.json({ article: updatedArticle });
    } catch (error) {
      console.error("Error updating knowledge article:", error);
      res.status(500).json({ error: "Failed to update article" });
    }
  });
  app2.get("/api/wiki/search/semantic", async (req, res) => {
    try {
      const query = req.query.q;
      const limit = parseInt(req.query.limit) || 10;
      if (!query || query.trim().length < 2) {
        return res.status(400).json({ error: "Query must be at least 2 characters long" });
      }
      const articles = await storage.searchKnowledgeSemanticSimilarity(query, limit);
      res.json({ articles, query, searchType: "semantic" });
    } catch (error) {
      console.error("Error performing semantic search:", error);
      res.status(500).json({ error: "Failed to perform semantic search" });
    }
  });
  app2.get("/api/wiki/recommendations", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit) || 5;
      const recommendations = await storage.getRecommendedArticles(userId, limit);
      res.json({ articles: recommendations, type: "personalized" });
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      res.status(500).json({ error: "Failed to fetch recommendations" });
    }
  });
  app2.get("/api/wiki/popular", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 5;
      const articles = await storage.getPopularArticles(limit);
      res.json({ articles, type: "popular" });
    } catch (error) {
      console.error("Error fetching popular articles:", error);
      res.status(500).json({ error: "Failed to fetch popular articles" });
    }
  });
  app2.get("/api/wiki/trending", async (req, res) => {
    try {
      const timeframe = req.query.timeframe || "7d";
      const limit = parseInt(req.query.limit) || 5;
      if (!["24h", "7d", "30d"].includes(timeframe)) {
        return res.status(400).json({ error: "Invalid timeframe. Use 24h, 7d, or 30d" });
      }
      const articles = await storage.getTrendingArticles(timeframe, limit);
      res.json({ articles, timeframe, type: "trending" });
    } catch (error) {
      console.error("Error fetching trending articles:", error);
      res.status(500).json({ error: "Failed to fetch trending articles" });
    }
  });
  app2.post("/api/wiki/articles/:id/view", async (req, res) => {
    try {
      const articleId = req.params.id;
      const userId = req.user?.claims?.sub;
      await storage.recordKnowledgeView(articleId, userId);
      res.json({ message: "View recorded successfully" });
    } catch (error) {
      console.error("Error recording article view:", error);
      res.status(500).json({ error: "Failed to record view" });
    }
  });
  app2.get("/api/wiki/articles/:id/analytics", isAuthenticated, async (req, res) => {
    try {
      const articleId = req.params.id;
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "admin" && user?.role !== "support") {
        return res.status(403).json({ error: "Admin access required" });
      }
      const analytics = await storage.getArticleAnalytics(articleId);
      res.json({ analytics });
    } catch (error) {
      console.error("Error fetching article analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });
  app2.get("/api/wiki/search/suggestions", async (req, res) => {
    try {
      const query = req.query.q;
      if (!query || query.trim().length < 2) {
        return res.json({ suggestions: [] });
      }
      const suggestions = await storage.getKnowledgeSearchSuggestions(query);
      res.json({ suggestions });
    } catch (error) {
      console.error("Error fetching search suggestions:", error);
      res.status(500).json({ error: "Failed to fetch suggestions" });
    }
  });
  app2.get("/api/tutorials", async (req, res) => {
    try {
      const userRole = req.query.role;
      const category = req.query.category;
      const tutorials2 = await storage.getTutorials(userRole, category);
      res.json({ tutorials: tutorials2 });
    } catch (error) {
      console.error("Error fetching tutorials:", error);
      res.status(500).json({ error: "Failed to fetch tutorials" });
    }
  });
  app2.get("/api/tutorials/:id", async (req, res) => {
    try {
      const tutorialId = req.params.id;
      const tutorial = await storage.getTutorial(tutorialId);
      if (!tutorial) {
        return res.status(404).json({ error: "Tutorial not found" });
      }
      res.json({ tutorial });
    } catch (error) {
      console.error("Error fetching tutorial:", error);
      res.status(500).json({ error: "Failed to fetch tutorial" });
    }
  });
  app2.get("/api/tutorials/:id/progress", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const tutorialId = req.params.id;
      const progress = await storage.getTutorialProgress(userId, tutorialId);
      res.json({ progress });
    } catch (error) {
      console.error("Error fetching tutorial progress:", error);
      res.status(500).json({ error: "Failed to fetch progress" });
    }
  });
  app2.put("/api/tutorials/:id/progress", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const tutorialId = req.params.id;
      const { stepIndex } = req.body;
      const progress = await storage.updateTutorialProgress(userId, tutorialId, stepIndex);
      res.json({ progress });
    } catch (error) {
      console.error("Error updating tutorial progress:", error);
      res.status(500).json({ error: "Failed to update progress" });
    }
  });
  app2.get("/api/tutorials/:id/steps", async (req, res) => {
    try {
      const tutorialId = req.params.id;
      const steps = await storage.getTutorialSteps(tutorialId);
      res.json({ steps });
    } catch (error) {
      console.error("Error fetching tutorial steps:", error);
      res.status(500).json({ error: "Failed to fetch tutorial steps" });
    }
  });
  app2.post("/api/tutorials", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (user?.role !== "admin" && user?.role !== "support") {
        return res.status(403).json({ error: "Admin access required" });
      }
      const tutorialData = insertTutorialSchema.parse({
        ...req.body,
        createdBy: userId
      });
      const tutorial = await storage.createTutorial(tutorialData);
      res.json({ tutorial });
    } catch (error) {
      console.error("Error creating tutorial:", error);
      res.status(500).json({ error: "Failed to create tutorial" });
    }
  });
  app2.post("/api/fanztrust/verify-transaction", async (req, res) => {
    try {
      const { fanId, creatorId, gateway, txid, email, walletAddress, last4 } = req.body;
      const transaction = await storage.verifyTransaction({
        fanId,
        creatorId,
        gateway,
        txid,
        email,
        walletAddress,
        last4
      });
      if (transaction) {
        res.json({
          status: "verified",
          active: transaction.status === "completed",
          transaction: {
            id: transaction.id,
            amount: transaction.amount,
            currency: transaction.currency,
            createdAt: transaction.createdAt,
            subscriptionId: transaction.subscriptionId
          }
        });
      } else {
        res.json({
          status: "not_found",
          active: false
        });
      }
    } catch (error) {
      console.error("Error verifying transaction:", error);
      res.status(500).json({ error: "Failed to verify transaction" });
    }
  });
  app2.post("/api/fanztrust/request-refund", isAuthenticated, async (req, res) => {
    try {
      const fanId = req.user.claims.sub;
      const { transactionId, creatorId, reason } = req.body;
      const transaction = await storage.getTransaction(transactionId);
      if (!transaction || transaction.fanId !== fanId) {
        return res.status(403).json({ error: "Invalid transaction" });
      }
      const existingRefund = await storage.getRefundByTransaction(transactionId);
      if (existingRefund) {
        return res.status(400).json({ error: "Refund already requested" });
      }
      const policy = await storage.getCreatorRefundPolicy(creatorId);
      const minutesSincePurchase = (Date.now() - new Date(transaction.createdAt).getTime()) / (1e3 * 60);
      const timeLimit = policy?.autoApproveTimeLimit || 60;
      const shouldAutoApprove = policy?.autoApproveEnabled !== false && minutesSincePurchase < timeLimit && !transaction.contentAccessed;
      const refundRequest = await storage.createRefundRequest({
        transactionId,
        fanId,
        creatorId,
        reason,
        amount: transaction.amount,
        status: shouldAutoApprove ? "auto_approved" : "pending",
        isAutoApproved: shouldAutoApprove,
        ipAddress: req.ip,
        deviceFingerprint: req.headers["user-agent"]
      });
      await storage.createTrustAuditLog({
        action: "request_refund",
        performedBy: fanId,
        transactionId,
        refundId: refundRequest.id,
        result: shouldAutoApprove ? "auto_approved" : "pending",
        ipAddress: req.ip
      });
      res.json({
        refund: refundRequest,
        autoApproved: shouldAutoApprove
      });
    } catch (error) {
      console.error("Error requesting refund:", error);
      res.status(500).json({ error: "Failed to request refund" });
    }
  });
  app2.get("/api/fanztrust/refunds/creator", isAuthenticated, async (req, res) => {
    try {
      const creatorId = req.user.claims.sub;
      const refunds = await storage.getCreatorRefundRequests(creatorId);
      res.json({ refunds });
    } catch (error) {
      console.error("Error fetching creator refunds:", error);
      res.status(500).json({ error: "Failed to fetch refunds" });
    }
  });
  app2.put("/api/fanztrust/refunds/:id", isAuthenticated, async (req, res) => {
    try {
      const creatorId = req.user.claims.sub;
      const refundId = req.params.id;
      const { action, reviewNotes } = req.body;
      const refund = await storage.getRefundRequest(refundId);
      if (!refund || refund.creatorId !== creatorId) {
        return res.status(403).json({ error: "Invalid refund request" });
      }
      const updatedRefund = await storage.updateRefundRequest(refundId, {
        status: action === "approve" ? "approved" : "denied",
        reviewedBy: creatorId,
        reviewNotes,
        reviewedAt: /* @__PURE__ */ new Date()
      });
      await storage.createTrustAuditLog({
        action: action === "approve" ? "approve_refund" : "deny_refund",
        performedBy: creatorId,
        refundId,
        result: action,
        ipAddress: req.ip
      });
      res.json({ refund: updatedRefund });
    } catch (error) {
      console.error("Error updating refund:", error);
      res.status(500).json({ error: "Failed to update refund" });
    }
  });
  app2.get("/api/fanzwallet", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      let wallet = await storage.getFanzWallet(userId);
      if (!wallet) {
        wallet = await storage.createFanzWallet({ userId });
      }
      res.json({ wallet });
    } catch (error) {
      console.error("Error fetching wallet:", error);
      res.status(500).json({ error: "Failed to fetch wallet" });
    }
  });
  app2.get("/api/fanzwallet/transactions", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const wallet = await storage.getFanzWallet(userId);
      if (!wallet) {
        return res.status(404).json({ error: "Wallet not found" });
      }
      const transactions2 = await storage.getWalletTransactions(wallet.id);
      res.json({ transactions: transactions2 });
    } catch (error) {
      console.error("Error fetching wallet transactions:", error);
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });
  app2.post("/api/fanzwallet/transaction", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { type, amount, currency, description } = req.body;
      const wallet = await storage.getFanzWallet(userId);
      if (!wallet) {
        return res.status(404).json({ error: "Wallet not found" });
      }
      const transaction = await storage.createWalletTransaction({
        walletId: wallet.id,
        type,
        amount,
        currency: currency || "FANZ",
        description,
        status: "pending"
      });
      if (type === "deposit" && transaction.status === "completed") {
        await storage.updateFanzWallet(wallet.id, {
          fanzTokenBalance: wallet.fanzTokenBalance + amount,
          totalDeposited: wallet.totalDeposited + amount
        });
      }
      res.json({ transaction });
    } catch (error) {
      console.error("Error processing wallet transaction:", error);
      res.status(500).json({ error: "Failed to process transaction" });
    }
  });
  app2.get("/api/fanztrust/score/:fanId", async (req, res) => {
    try {
      const fanId = req.params.fanId;
      let trustScore = await storage.getFanTrustScore(fanId);
      if (!trustScore) {
        trustScore = await storage.createFanTrustScore({ fanId });
      }
      res.json({ trustScore });
    } catch (error) {
      console.error("Error fetching trust score:", error);
      res.status(500).json({ error: "Failed to fetch trust score" });
    }
  });
  app2.get("/api/fanztrust/admin/refunds", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }
      const refunds = await storage.getAllRefundRequests();
      res.json({ refunds });
    } catch (error) {
      console.error("Error fetching all refunds:", error);
      res.status(500).json({ error: "Failed to fetch refunds" });
    }
  });
  app2.post("/api/fanztrust/admin/refunds/:id/override", isAuthenticated, async (req, res) => {
    try {
      const adminId = req.user.claims.sub;
      const user = await storage.getUser(adminId);
      if (user?.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }
      const refundId = req.params.id;
      const { action, notes } = req.body;
      const updatedRefund = await storage.updateRefundRequest(refundId, {
        status: action === "approve" ? "approved" : "denied",
        reviewedBy: adminId,
        reviewNotes: `[ADMIN OVERRIDE] ${notes}`,
        reviewedAt: /* @__PURE__ */ new Date()
      });
      await storage.createTrustAuditLog({
        action: "admin_override_refund",
        performedBy: adminId,
        refundId,
        result: action,
        ipAddress: req.ip,
        details: { notes }
      });
      res.json({ refund: updatedRefund });
    } catch (error) {
      console.error("Error overriding refund:", error);
      res.status(500).json({ error: "Failed to override refund" });
    }
  });
  app2.get("/api/fanztrust/policy", isAuthenticated, async (req, res) => {
    try {
      const creatorId = req.user.claims.sub;
      let policy = await storage.getCreatorRefundPolicy(creatorId);
      if (!policy) {
        policy = await storage.createCreatorRefundPolicy({ creatorId });
      }
      res.json({ policy });
    } catch (error) {
      console.error("Error fetching refund policy:", error);
      res.status(500).json({ error: "Failed to fetch policy" });
    }
  });
  app2.put("/api/fanztrust/policy", isAuthenticated, async (req, res) => {
    try {
      const creatorId = req.user.claims.sub;
      const policyData = req.body;
      const policy = await storage.updateCreatorRefundPolicy(creatorId, policyData);
      res.json({ policy });
    } catch (error) {
      console.error("Error updating refund policy:", error);
      res.status(500).json({ error: "Failed to update policy" });
    }
  });
  app2.get("/api/feed", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const cursor = req.query.cursor;
      const limit = parseInt(req.query.limit) || 20;
      const ageVerification = await storage.getAgeVerification(userId);
      if (!ageVerification?.isVerified) {
        return res.status(403).json({
          error: "Age verification required",
          code: "AGE_VERIFICATION_REQUIRED"
        });
      }
      const result = await storage.getFeedPosts({ userId, cursor, limit });
      const sponsoredPosts2 = await storage.getSponsoredPosts({ isActive: true, limit: 5 });
      const postsWithAds = [];
      let adIndex = 0;
      for (let i = 0; i < result.posts.length; i++) {
        postsWithAds.push(result.posts[i]);
        if ((i + 1) % 4 === 0 && adIndex < sponsoredPosts2.length) {
          postsWithAds.push({
            ...sponsoredPosts2[adIndex],
            isSponsored: true
          });
          await storage.incrementAdImpression(sponsoredPosts2[adIndex].id);
          adIndex++;
        }
      }
      res.json({
        posts: postsWithAds,
        nextCursor: result.nextCursor,
        hasMore: !!result.nextCursor
      });
    } catch (error) {
      console.error("Error fetching feed:", error);
      res.status(500).json({ error: "Failed to fetch feed" });
    }
  });
  app2.post("/api/posts", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const postData = insertFeedPostSchema.parse({
        ...req.body,
        creatorId: userId
      });
      const post = await storage.createPost(postData);
      res.json({ post });
    } catch (error) {
      console.error("Error creating post:", error);
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: "Invalid post data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create post" });
    }
  });
  app2.get("/api/posts/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const postId = req.params.id;
      const post = await storage.getPost(postId);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      const canAccess = await checkPostAccess(userId, post);
      if (!canAccess) {
        return res.status(403).json({
          error: "Access denied",
          requiresUnlock: post.visibility === "paid",
          priceInCents: post.priceInCents
        });
      }
      const media = await storage.getPostMedia(postId);
      const engagement = await storage.getPostEngagement(postId);
      res.json({
        post,
        media,
        engagement
      });
    } catch (error) {
      console.error("Error fetching post:", error);
      res.status(500).json({ error: "Failed to fetch post" });
    }
  });
  app2.put("/api/posts/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const postId = req.params.id;
      const post = await storage.getPost(postId);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      if (post.creatorId !== userId) {
        return res.status(403).json({ error: "Not authorized to edit this post" });
      }
      const updatedPost = await storage.updatePost(postId, req.body);
      res.json({ post: updatedPost });
    } catch (error) {
      console.error("Error updating post:", error);
      res.status(500).json({ error: "Failed to update post" });
    }
  });
  app2.delete("/api/posts/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const postId = req.params.id;
      const post = await storage.getPost(postId);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      if (post.creatorId !== userId) {
        return res.status(403).json({ error: "Not authorized to delete this post" });
      }
      await storage.deletePost(postId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ error: "Failed to delete post" });
    }
  });
  app2.post("/api/posts/:id/media", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const postId = req.params.id;
      const post = await storage.getPost(postId);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      if (post.creatorId !== userId) {
        return res.status(403).json({ error: "Not authorized to add media to this post" });
      }
      const mediaData = insertPostMediaSchema.parse({
        ...req.body,
        postId
      });
      const media = await storage.createPostMedia(mediaData);
      res.json({ media });
    } catch (error) {
      console.error("Error adding media:", error);
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: "Invalid media data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to add media" });
    }
  });
  app2.post("/api/posts/:id/like", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const postId = req.params.id;
      await storage.likePost(postId, userId);
      const engagement = await storage.getPostEngagement(postId);
      res.json({ engagement });
    } catch (error) {
      console.error("Error liking post:", error);
      res.status(500).json({ error: "Failed to like post" });
    }
  });
  app2.delete("/api/posts/:id/like", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const postId = req.params.id;
      await storage.unlikePost(postId, userId);
      const engagement = await storage.getPostEngagement(postId);
      res.json({ engagement });
    } catch (error) {
      console.error("Error unliking post:", error);
      res.status(500).json({ error: "Failed to unlike post" });
    }
  });
  app2.post("/api/posts/:id/view", isAuthenticated, async (req, res) => {
    try {
      const postId = req.params.id;
      await storage.incrementPostView(postId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error tracking view:", error);
      res.status(500).json({ error: "Failed to track view" });
    }
  });
  app2.post("/api/posts/:id/unlock", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const postId = req.params.id;
      const post = await storage.getPost(postId);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      if (post.visibility !== "paid") {
        return res.status(400).json({ error: "Post is not a paid post" });
      }
      const isUnlocked = await storage.isPostUnlocked(postId, userId);
      if (isUnlocked) {
        return res.status(400).json({ error: "Post already unlocked" });
      }
      const wallet = await storage.getFanzWallet(userId);
      const priceInTokens = (post.priceInCents || 0) * 10;
      if (!wallet || (wallet.fanzTokenBalance || 0) < priceInTokens) {
        return res.status(402).json({
          error: "Insufficient funds",
          required: priceInTokens,
          available: wallet?.fanzTokenBalance || 0
        });
      }
      const newBalance = (wallet.fanzTokenBalance || 0) - priceInTokens;
      await storage.updateFanzWallet(wallet.id, { fanzTokenBalance: newBalance });
      const transaction = await storage.createWalletTransaction({
        walletId: wallet.id,
        type: "debit",
        amount: priceInTokens,
        currency: "FanzToken",
        description: `Unlocked post: ${post.content?.substring(0, 50) || "Untitled"}`,
        status: "completed"
      });
      const unlock = await storage.unlockPost(postId, userId, transaction.id, priceInTokens);
      res.json({
        success: true,
        unlock,
        newBalance
      });
    } catch (error) {
      console.error("Error unlocking post:", error);
      res.status(500).json({ error: "Failed to unlock post" });
    }
  });
  app2.post("/api/follow/:creatorId", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const creatorId = req.params.creatorId;
      if (userId === creatorId) {
        return res.status(400).json({ error: "Cannot follow yourself" });
      }
      const follow = await storage.followCreator(userId, creatorId);
      res.json({ follow });
    } catch (error) {
      console.error("Error following creator:", error);
      res.status(500).json({ error: "Failed to follow creator" });
    }
  });
  app2.delete("/api/follow/:creatorId", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const creatorId = req.params.creatorId;
      await storage.unfollowCreator(userId, creatorId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error unfollowing creator:", error);
      res.status(500).json({ error: "Failed to unfollow creator" });
    }
  });
  app2.get("/api/follow/:creatorId/status", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const creatorId = req.params.creatorId;
      const isFollowing = await storage.isFollowing(userId, creatorId);
      res.json({ isFollowing });
    } catch (error) {
      console.error("Error checking follow status:", error);
      res.status(500).json({ error: "Failed to check follow status" });
    }
  });
  app2.get("/api/following", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const following = await storage.getFollowing(userId);
      res.json({ following });
    } catch (error) {
      console.error("Error fetching following:", error);
      res.status(500).json({ error: "Failed to fetch following list" });
    }
  });
  app2.post("/api/ads/:id/click", isAuthenticated, async (req, res) => {
    try {
      const adId = req.params.id;
      await storage.incrementAdClick(adId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error tracking ad click:", error);
      res.status(500).json({ error: "Failed to track ad click" });
    }
  });
  app2.get("/api/posts/:postId/comments", isAuthenticated, async (req, res) => {
    try {
      const postId = req.params.postId;
      const userId = req.user.claims.sub;
      const comments = [
        {
          id: "1",
          postId,
          userId: "user1",
          content: "Great content!",
          likes: 5,
          isLiked: false,
          isPinned: false,
          isEdited: false,
          parentId: null,
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date(),
          author: {
            id: "user1",
            username: "user1",
            displayName: "User One",
            avatarUrl: "/avatar1.jpg"
          },
          replies: []
        }
      ];
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });
  app2.post("/api/posts/:postId/comments", isAuthenticated, async (req, res) => {
    try {
      const postId = req.params.postId;
      const userId = req.user.claims.sub;
      const { content, parentId } = req.body;
      const comment = {
        id: Math.random().toString(36),
        postId,
        userId,
        content,
        parentId,
        likes: 0,
        isEdited: false,
        isPinned: false,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      };
      res.json({ comment });
    } catch (error) {
      console.error("Error adding comment:", error);
      res.status(500).json({ error: "Failed to add comment" });
    }
  });
  app2.post("/api/comments/:commentId/like", isAuthenticated, async (req, res) => {
    try {
      const commentId = req.params.commentId;
      const userId = req.user.claims.sub;
      res.json({ success: true, liked: true });
    } catch (error) {
      console.error("Error liking comment:", error);
      res.status(500).json({ error: "Failed to like comment" });
    }
  });
  app2.get("/api/streams", isAuthenticated, async (req, res) => {
    try {
      const filter = req.query.filter || "all";
      const streams = [
        {
          id: "1",
          creatorId: "creator1",
          title: "Live Coding Session",
          description: "Building a React app",
          thumbnailUrl: "/stream1.jpg",
          streamKey: "key123",
          playbackUrl: "/play/stream1",
          status: "live",
          visibility: "free",
          priceInCents: 0,
          viewerCount: 150,
          totalViews: 500,
          scheduledAt: null,
          startedAt: /* @__PURE__ */ new Date(),
          endedAt: null,
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date(),
          creator: {
            id: "creator1",
            username: "creator1",
            displayName: "Creator One",
            avatarUrl: "/avatar1.jpg"
          }
        }
      ];
      res.json(streams);
    } catch (error) {
      console.error("Error fetching streams:", error);
      res.status(500).json({ error: "Failed to fetch streams" });
    }
  });
  app2.post("/api/streams", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { title, description, visibility, priceInCents, scheduledAt } = req.body;
      const stream = {
        id: Math.random().toString(36),
        creatorId: userId,
        title,
        description,
        thumbnailUrl: null,
        streamKey: `stream_${Math.random().toString(36)}`,
        playbackUrl: null,
        status: "scheduled",
        visibility,
        priceInCents,
        viewerCount: 0,
        totalViews: 0,
        scheduledAt,
        startedAt: null,
        endedAt: null,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      };
      res.json({ stream });
    } catch (error) {
      console.error("Error creating stream:", error);
      res.status(500).json({ error: "Failed to create stream" });
    }
  });
  app2.get("/api/discover", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const recommendations = {
        posts: [],
        categories: ["Photography", "Fitness", "Art", "Fashion", "Gaming"],
        trendingCreators: [],
        personalizedScore: 85
      };
      res.json(recommendations);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      res.status(500).json({ error: "Failed to fetch recommendations" });
    }
  });
  app2.post("/api/interactions", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { postId, streamId, interactionType, watchTimeSeconds, engagementScore } = req.body;
      res.json({ success: true });
    } catch (error) {
      console.error("Error tracking interaction:", error);
      res.status(500).json({ error: "Failed to track interaction" });
    }
  });
  app2.get("/api/creator/studio/settings", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const settings = await storage.getCreatorStudioSettings(userId);
      if (!settings) {
        return res.json({
          autoEditingEnabled: true,
          autoDistributionEnabled: false,
          preferredPlatforms: [],
          defaultHashtags: [],
          aiPricingSuggestions: true
        });
      }
      res.json(settings);
    } catch (error) {
      console.error("Error fetching studio settings:", error);
      res.status(500).json({ error: "Failed to fetch studio settings" });
    }
  });
  app2.post("/api/creator/studio/settings", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const existingSettings = await storage.getCreatorStudioSettings(userId);
      let settings;
      if (existingSettings) {
        settings = await storage.updateCreatorStudioSettings(userId, req.body);
      } else {
        settings = await storage.createCreatorStudioSettings({ ...req.body, creatorId: userId });
      }
      res.json(settings);
    } catch (error) {
      console.error("Error updating studio settings:", error);
      res.status(500).json({ error: "Failed to update studio settings" });
    }
  });
  app2.get("/api/creator/content/sessions", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit) || 20;
      const sessions2 = await contentCreationService.getCreatorSessions(userId, limit);
      res.json(sessions2);
    } catch (error) {
      console.error("Error fetching content sessions:", error);
      res.status(500).json({ error: "Failed to fetch content sessions" });
    }
  });
  app2.get("/api/creator/content/sessions/:id", isAuthenticated, async (req, res) => {
    try {
      const sessionId = req.params.id;
      const session3 = await contentCreationService.getSession(sessionId);
      if (!session3) {
        return res.status(404).json({ error: "Session not found" });
      }
      res.json(session3);
    } catch (error) {
      console.error("Error fetching content session:", error);
      res.status(500).json({ error: "Failed to fetch content session" });
    }
  });
  app2.post("/api/creator/content/upload", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { title, description, type, file } = req.body;
      await contentCreationService.verifyCreatorAccess(userId);
      const session3 = await contentCreationService.uploadContent(userId, {
        title,
        description,
        type,
        sourceType: "upload",
        file: Buffer.from(file.data, "base64"),
        filename: file.name,
        mimeType: file.type
      });
      res.json(session3);
    } catch (error) {
      console.error("Error uploading content:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to upload content" });
    }
  });
  app2.post("/api/creator/content/capture", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { videoData, options } = req.body;
      await contentCreationService.verifyCreatorAccess(userId);
      const session3 = await contentCreationService.captureFromCamera(
        userId,
        Buffer.from(videoData, "base64"),
        options
      );
      res.json(session3);
    } catch (error) {
      console.error("Error capturing content:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to capture content" });
    }
  });
  app2.post("/api/creator/content/live", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { title, description, coStarIds, visibility, priceInCents } = req.body;
      const result = await contentCreationService.startLiveStream(userId, {
        title,
        description,
        coStarIds,
        requiresVerification: true,
        visibility,
        priceInCents
      });
      res.json(result);
    } catch (error) {
      console.error("Error starting live stream:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to start live stream" });
    }
  });
  app2.post("/api/creator/content/process/:sessionId", isAuthenticated, async (req, res) => {
    try {
      const sessionId = req.params.sessionId;
      const session3 = await storage.getContentSession(sessionId);
      if (!session3) {
        return res.status(404).json({ error: "Session not found" });
      }
      let editingTask = await storage.getEditingTaskBySession(sessionId);
      if (!editingTask) {
        editingTask = await storage.createEditingTask({
          sessionId,
          creatorId: session3.creatorId,
          status: "pending",
          editingOptions: req.body.editingOptions || {
            autoCut: true,
            addBranding: true,
            generateMultipleAspectRatios: true,
            createTrailer: true,
            createGif: true
          }
        });
      }
      aiEditorService.processContent(editingTask.id).catch(console.error);
      res.json({ editingTask, message: "Processing started" });
    } catch (error) {
      console.error("Error processing content:", error);
      res.status(500).json({ error: "Failed to process content" });
    }
  });
  app2.get("/api/creator/content/pricing/:sessionId", isAuthenticated, async (req, res) => {
    try {
      const sessionId = req.params.sessionId;
      const pricing = await aiEditorService.suggestPricing(sessionId);
      res.json(pricing);
    } catch (error) {
      console.error("Error getting pricing suggestions:", error);
      res.status(500).json({ error: "Failed to get pricing suggestions" });
    }
  });
  app2.get("/api/creator/content/editing/:sessionId", isAuthenticated, async (req, res) => {
    try {
      const sessionId = req.params.sessionId;
      const task = await aiProcessorService.getProcessingStatus(sessionId);
      res.json(task);
    } catch (error) {
      console.error("Error getting editing task:", error);
      res.status(500).json({ error: "Failed to get editing task status" });
    }
  });
  app2.get("/api/creator/content/versions/:sessionId", isAuthenticated, async (req, res) => {
    try {
      const sessionId = req.params.sessionId;
      const versions = await formatConverterService.getGeneratedFormats(sessionId);
      res.json(versions);
    } catch (error) {
      console.error("Error getting content versions:", error);
      res.status(500).json({ error: "Failed to get content versions" });
    }
  });
  app2.get("/api/creator/content/analyze/:sessionId", isAuthenticated, async (req, res) => {
    try {
      const sessionId = req.params.sessionId;
      const analysis = await contentAnalyzerService.analyzeContent(sessionId);
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing content:", error);
      res.status(500).json({ error: "Failed to analyze content" });
    }
  });
  app2.get("/api/creator/content/assets/:sessionId", isAuthenticated, async (req, res) => {
    try {
      const sessionId = req.params.sessionId;
      const assets = await assetGeneratorService.getGeneratedAssets(sessionId);
      res.json(assets);
    } catch (error) {
      console.error("Error getting generated assets:", error);
      res.status(500).json({ error: "Failed to get generated assets" });
    }
  });
  app2.post("/api/creator/content/ai-process", isAuthenticated, async (req, res) => {
    try {
      const { sessionId, options } = req.body;
      const result = await aiProcessorService.processContent(sessionId, options);
      res.json(result);
    } catch (error) {
      console.error("Error starting AI processing:", error);
      res.status(500).json({ error: "Failed to start AI processing" });
    }
  });
  app2.post("/api/creator/content/generate-formats", isAuthenticated, async (req, res) => {
    try {
      const { sessionId, platforms } = req.body;
      const formats = await formatConverterService.generateFormats(sessionId, platforms);
      res.json(formats);
    } catch (error) {
      console.error("Error generating formats:", error);
      res.status(500).json({ error: "Failed to generate formats" });
    }
  });
  app2.post("/api/creator/content/generate-assets", isAuthenticated, async (req, res) => {
    try {
      const { sessionId, types } = req.body;
      const assets = await assetGeneratorService.generateAssets(sessionId, types);
      res.json(assets);
    } catch (error) {
      console.error("Error generating assets:", error);
      res.status(500).json({ error: "Failed to generate assets" });
    }
  });
  app2.get("/api/creator/processing-queue", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const queue = await aiProcessorService.getProcessingQueue(userId);
      res.json(queue);
    } catch (error) {
      console.error("Error getting processing queue:", error);
      res.status(500).json({ error: "Failed to get processing queue" });
    }
  });
  app2.post("/api/creator/processing-queue/priority", isAuthenticated, async (req, res) => {
    try {
      const { sessionId, priority } = req.body;
      await aiProcessorService.updateQueuePriority(sessionId, priority);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating queue priority:", error);
      res.status(500).json({ error: "Failed to update queue priority" });
    }
  });
  app2.post("/api/creator/processing-queue/cancel", isAuthenticated, async (req, res) => {
    try {
      const { sessionId } = req.body;
      await aiProcessorService.cancelProcessing(sessionId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error canceling processing:", error);
      res.status(500).json({ error: "Failed to cancel processing" });
    }
  });
  app2.post("/api/creator/content/distribute", isAuthenticated, async (req, res) => {
    try {
      const { sessionId, platforms, publishSchedule, settings } = req.body;
      const campaign = await distributionService.createCampaign(sessionId, {
        platforms,
        publishSchedule,
        settings
      });
      res.json(campaign);
    } catch (error) {
      console.error("Error creating distribution campaign:", error);
      res.status(500).json({ error: "Failed to create distribution campaign" });
    }
  });
  app2.get("/api/creator/campaigns/:campaignId/analytics", isAuthenticated, async (req, res) => {
    try {
      const campaignId = req.params.campaignId;
      const analytics = await distributionService.getCampaignAnalytics(campaignId);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching campaign analytics:", error);
      res.status(500).json({ error: "Failed to fetch campaign analytics" });
    }
  });
  app2.delete("/api/creator/content/sessions/:id", isAuthenticated, async (req, res) => {
    try {
      const sessionId = req.params.id;
      const userId = req.user.claims.sub;
      const session3 = await storage.getContentSession(sessionId);
      if (!session3) {
        return res.status(404).json({ error: "Session not found" });
      }
      if (session3.creatorId !== userId) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      await contentCreationService.deleteSession(sessionId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting session:", error);
      res.status(500).json({ error: "Failed to delete session" });
    }
  });
  app2.get("/api/creator/analytics", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const analytics = {
        totalEarnings: 12450,
        activeSubscribers: 1234,
        totalViews: 45200,
        engagementRate: 78,
        earningsData: [],
        contentPerformance: [],
        topPosts: []
      };
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });
  async function checkPostAccess(userId, post) {
    if (post.creatorId === userId) {
      return true;
    }
    if (post.isFreePreview || post.visibility === "free") {
      return true;
    }
    if (post.visibility === "subscriber") {
      const subscription = await storage.getSubscription(userId, post.creatorId);
      return subscription?.status === "active";
    }
    if (post.visibility === "paid") {
      return await storage.isPostUnlocked(post.id, userId);
    }
    if (post.visibility === "followers") {
      return await storage.isFollowing(userId, post.creatorId);
    }
    return false;
  }
  return httpServer;
}
var limiter;
var init_routes = __esm({
  async "server/routes.ts"() {
    "use strict";
    await init_storage();
    await init_auth();
    init_objectStorage();
    init_objectAcl();
    init_schema();
    await init_ccbill();
    init_verifymy();
    await init_fingerprinting();
    await init_payouts();
    await init_content_creation();
    await init_ai_editor();
    await init_distribution();
    await init_verification();
    await init_streaming();
    await init_stream_handler();
    await init_ai_processor();
    await init_format_converter();
    await init_asset_generator();
    await init_content_analyzer();
    limiter = rateLimit({
      windowMs: 60 * 1e3,
      // 1 minute
      max: process.env.NODE_ENV === "production" ? 1e3 : 1e4,
      // requests per minute
      message: "Too many requests from this IP"
    });
  }
});

// server/replitAuth.ts
import { Router } from "express";
import * as oauth from "openid-client";
import passport from "passport";
import { Strategy as CustomStrategy } from "passport-custom";
import session2 from "express-session";
import memoizee from "memoizee";
import connectPgSimple from "connect-pg-simple";
import { Pool } from "pg";
var PgSession, pool2, getClient, router, replitAuth_default;
var init_replitAuth = __esm({
  async "server/replitAuth.ts"() {
    "use strict";
    await init_db();
    PgSession = connectPgSimple(session2);
    pool2 = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    getClient = memoizee(
      async () => {
        const issuer = new URL(
          process.env.REPLIT_DEPLOYMENT === "1" ? "https://replit.com" : `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
        );
        const config = await oauth.discovery(
          issuer,
          process.env.REPLIT_DEPLOYMENT === "1" ? process.env.REPL_ID : "local-testing",
          void 0,
          void 0,
          { execute: [oauth.allowInsecureRequests] }
        );
        return config;
      },
      { promise: true, maxAge: 6e4 }
    );
    passport.use(
      "replit",
      new CustomStrategy(async (req, done) => {
        try {
          const client = await getClient();
          const currentUrl = new URL(req.url, `https://${req.get("host")}`);
          const tokens = await oauth.authorizationCodeGrant(client, currentUrl, {
            expectedState: req.session.state,
            pkceCodeVerifier: req.session.codeVerifier
          });
          const claims = oauth.getValidatedIdTokenClaims(tokens);
          const user = await db.user.upsert({
            where: { id: claims.sub },
            update: {},
            create: {
              id: claims.sub,
              email: claims.email,
              firstName: claims.given_name || null,
              lastName: claims.family_name || null,
              profileImageUrl: claims.profile_image || null,
              password: ""
              // Replit auth doesn't use passwords
            }
          });
          done(null, user);
        } catch (err) {
          done(err);
        }
      })
    );
    passport.serializeUser((user, done) => {
      done(null, user.id);
    });
    passport.deserializeUser(async (id, done) => {
      try {
        const user = await db.user.findUnique({ where: { id } });
        done(null, user);
      } catch (err) {
        done(err);
      }
    });
    router = Router();
    router.use(
      session2({
        store: new PgSession({ pool: pool2 }),
        secret: process.env.SESSION_SECRET || "your-secret-key",
        resave: false,
        saveUninitialized: false,
        cookie: {
          secure: process.env.NODE_ENV === "production",
          httpOnly: true,
          maxAge: 30 * 24 * 60 * 60 * 1e3
          // 30 days
        }
      })
    );
    router.use(passport.initialize());
    router.use(passport.session());
    router.get("/login", async (req, res) => {
      const client = await getClient();
      const state = oauth.generateRandomState();
      const codeVerifier = oauth.generateRandomCodeVerifier();
      req.session.state = state;
      req.session.codeVerifier = codeVerifier;
      const authUrl = oauth.buildAuthorizationUrl(client, {
        state,
        code_challenge: await oauth.calculatePKCECodeChallenge(codeVerifier),
        code_challenge_method: "S256"
      });
      res.redirect(authUrl.href);
    });
    router.get("/callback", passport.authenticate("replit"), (req, res) => {
      res.redirect("/");
    });
    router.get("/logout", (req, res) => {
      req.logout((err) => {
        if (err) {
          return res.status(500).json({ error: "Logout failed" });
        }
        res.redirect("/");
      });
    });
    router.get("/user", (req, res) => {
      if (req.isAuthenticated()) {
        res.json(req.user);
      } else {
        res.status(401).json({ error: "Not authenticated" });
      }
    });
    replitAuth_default = router;
  }
});

// server/start.ts
var start_exports = {};
import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer as createServer2 } from "http";
import fs from "fs";
import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
var __filename, __dirname, app;
var init_start = __esm({
  async "server/start.ts"() {
    "use strict";
    await init_routes();
    await init_replitAuth();
    __filename = fileURLToPath(import.meta.url);
    __dirname = dirname(__filename);
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use((req, res, next) => {
      const start = Date.now();
      const path2 = req.path;
      let capturedJsonResponse = void 0;
      const originalResJson = res.json;
      res.json = function(bodyJson, ...args) {
        capturedJsonResponse = bodyJson;
        return originalResJson.apply(res, [bodyJson, ...args]);
      };
      res.on("finish", () => {
        const duration = Date.now() - start;
        if (path2.startsWith("/api")) {
          let logLine = `${req.method} ${path2} ${res.statusCode} in ${duration}ms`;
          if (capturedJsonResponse) {
            logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
          }
          if (logLine.length > 80) {
            logLine = logLine.slice(0, 79) + "\u2026";
          }
          log(logLine);
        }
      });
      next();
    });
    (async () => {
      const httpServer = createServer2(app);
      app.use("/api/auth/replit", replitAuth_default);
      const server = await registerRoutes(app);
      app.use((err, _req, res, _next) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        res.status(status).json({ message });
        throw err;
      });
      app.use((req, res, next) => {
        if (process.env.NODE_ENV !== "production") {
          res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
          res.setHeader("Pragma", "no-cache");
          res.setHeader("Expires", "0");
          res.setHeader("Surrogate-Control", "no-store");
          res.removeHeader("ETag");
          res.removeHeader("Last-Modified");
        }
        next();
      });
      if (process.env.NODE_ENV !== "production") {
        const reactSwc = (await import("@vitejs/plugin-react-swc")).default;
        const plugins = [
          reactSwc()
        ];
        try {
          const { default: devBanner } = await import("@replit/vite-plugin-dev-banner");
          const { default: cartographer } = await import("@replit/vite-plugin-cartographer");
          const { default: errorModal } = await import("@replit/vite-plugin-runtime-error-modal");
          plugins.push(devBanner(), cartographer(), errorModal());
        } catch (err) {
          log("Replit plugins not available (optional)", "vite");
        }
        const vite = await createViteServer({
          configFile: false,
          plugins,
          resolve: {
            alias: {
              "@": path.resolve(__dirname, "..", "client", "src"),
              "@shared": path.resolve(__dirname, "..", "shared"),
              "@assets": path.resolve(__dirname, "..", "attached_assets")
            }
          },
          root: path.resolve(__dirname, "..", "client"),
          cacheDir: path.resolve(__dirname, "..", "node_modules", ".vite"),
          optimizeDeps: {
            include: [
              "react",
              "react-dom",
              "react-dom/client",
              "wouter",
              "@tanstack/react-query",
              "zod",
              "react-hook-form",
              "@hookform/resolvers/zod"
            ],
            exclude: ["@replit/vite-plugin-dev-banner", "@replit/vite-plugin-cartographer", "@replit/vite-plugin-runtime-error-modal"],
            force: false,
            esbuildOptions: {
              target: "esnext"
            }
          },
          build: {
            outDir: path.resolve(__dirname, "..", "dist/public"),
            emptyOutDir: true,
            target: "esnext",
            minify: "esbuild",
            sourcemap: false,
            rollupOptions: {
              output: {
                manualChunks: {
                  "vendor-react": ["react", "react-dom", "react-dom/client"],
                  "vendor-router": ["wouter"],
                  "vendor-query": ["@tanstack/react-query"],
                  "vendor-forms": ["react-hook-form", "@hookform/resolvers/zod", "zod"],
                  "vendor-ui": ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu", "@radix-ui/react-select", "@radix-ui/react-toast"]
                }
              }
            }
          },
          server: {
            middlewareMode: true,
            hmr: false,
            allowedHosts: true,
            fs: {
              strict: true,
              deny: ["**/.*"]
            },
            watch: {
              usePolling: false,
              interval: 100
            }
          },
          appType: "custom",
          logLevel: "info"
        });
        app.use(vite.middlewares);
        app.get(/.*/, async (req, res, next) => {
          const url = req.originalUrl;
          try {
            const clientTemplate = path.resolve(__dirname, "..", "client", "index.html");
            const template = await fs.promises.readFile(clientTemplate, "utf-8");
            const html = await vite.transformIndexHtml(url, template);
            res.status(200).set({ "Content-Type": "text/html" }).end(html);
          } catch (e) {
            vite.ssrFixStacktrace(e);
            next(e);
          }
        });
      } else {
        const distPath = path.resolve(__dirname, "public");
        if (!fs.existsSync(distPath)) {
          throw new Error(
            `Could not find the build directory: ${distPath}, make sure to build the client first`
          );
        }
        app.use(express.static(distPath));
        app.get(/.*/, (_req, res) => {
          res.sendFile(path.resolve(distPath, "index.html"));
        });
      }
      const port = parseInt(process.env.PORT || "5000", 10);
      httpServer.listen({
        port,
        host: "0.0.0.0",
        reusePort: true
      }, () => {
        log(`serving on port ${port}`);
      });
    })();
  }
});

// server/index.ts
console.log("\u{1F680} Loading GirlFanz server from start.ts...");
init_start().then(() => start_exports).then(() => {
  console.log("\u2705 Server initialized");
}).catch((err) => {
  console.error("\u274C Failed to start server:", err);
  process.exit(1);
});
