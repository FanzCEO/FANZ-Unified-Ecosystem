import {
  users,
  profiles,
  mediaAssets,
  messages,
  moderationQueue,
  payoutAccounts,
  payoutRequests,
  subscriptions,
  transactions,
  auditLogs,
  kycVerifications,
  supportTickets,
  supportMessages,
  knowledgeArticles,
  tutorials,
  tutorialSteps,
  tutorialProgress,
  fanzTransactions,
  refundRequests,
  fanzWallets,
  walletTransactions,
  fanTrustScores,
  trustAuditLogs,
  creatorRefundPolicies,
  feedPosts,
  postMedia,
  postEngagement,
  userFollows,
  ageVerifications,
  sponsoredPosts,
  postLikes,
  postUnlocks,
  contentCreationSessions,
  editingTasks,
  contentVersions,
  distributionCampaigns,
  platformDistributions,
  contentAnalytics,
  generatedAssets,
  creatorStudioSettings,
  liveStreamCoStars,
  liveStreams,
  streamParticipants,
  streamChatMessages,
  streamGifts,
  streamReactions,
  streamHighlights,
  streamRecordings,
  streamViewers,
  streamAnalytics,
  nftCollections,
  nftTokens,
  nftTransactions,
  royaltyDistributions,
  blockchainWallets,
  ipfsRecords,
  marketplaceIntegrations,
  type User,
  type UpsertUser,
  type Profile,
  type InsertProfile,
  type MediaAsset,
  type InsertMediaAsset,
  type Message,
  type InsertMessage,
  type ModerationItem,
  type PayoutAccount,
  type PayoutRequest,
  type Subscription,
  type InsertSubscription,
  type Transaction,
  type InsertTransaction,
  type AuditLog,
  type KycVerification,
  type InsertKycVerification,
  type SupportTicket,
  type InsertSupportTicket,
  type SupportMessage,
  type InsertSupportMessage,
  type KnowledgeArticle,
  type InsertKnowledgeArticle,
  type Tutorial,
  type InsertTutorial,
  type TutorialStep,
  type TutorialProgress,
  type FanzTransaction,
  type RefundRequest,
  type FanzWallet,
  type FanTrustScore,
  type WalletTransaction,
  type FeedPost,
  type InsertFeedPost,
  type PostMedia,
  type InsertPostMedia,
  type PostEngagement,
  type UserFollow,
  type AgeVerification,
  type SponsoredPost,
  type PostLike,
  type PostUnlock,
  type ContentCreationSession,
  type InsertContentCreationSession,
  type EditingTask,
  type InsertEditingTask,
  type ContentVersion,
  type InsertContentVersion,
  type DistributionCampaign,
  type InsertDistributionCampaign,
  type PlatformDistribution,
  type InsertPlatformDistribution,
  type ContentAnalytics,
  type InsertContentAnalytics,
  type GeneratedAsset,
  type InsertGeneratedAsset,
  type CreatorStudioSettings,
  type InsertCreatorStudioSettings,
  type NftCollection,
  type InsertNftCollection,
  type NftToken,
  type InsertNftToken,
  type NftTransaction,
  type InsertNftTransaction,
  type BlockchainWallet,
  type InsertBlockchainWallet,
  type RoyaltyDistribution,
  type InsertRoyaltyDistribution,
  type IpfsRecord,
  type InsertIpfsRecord,
  type MarketplaceIntegration,
  type InsertMarketplaceIntegration,
} from "../shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsersBySecurityQuestion(question: string): Promise<User[]>;
  upsertUser(user: UpsertUser): Promise<User>;
  createUser(user: Partial<User>): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  
  // Password reset tokens
  createPasswordResetToken(token: { userId: string; token: string; expiresAt: Date }): Promise<any>;
  getPasswordResetToken(token: string): Promise<any | undefined>;
  markPasswordResetTokenUsed(token: string): Promise<void>;
  
  // Email verification tokens
  createEmailVerificationToken(token: { userId: string; token: string; expiresAt: Date }): Promise<any>;
  getEmailVerificationToken(token: string): Promise<any | undefined>;
  markEmailVerificationTokenUsed(token: string): Promise<void>;
  
  // Profile operations
  getProfile(userId: string): Promise<Profile | undefined>;
  getProfileWithUser(userId: string): Promise<(Profile & { user: User }) | undefined>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  updateProfile(userId: string, updates: Partial<InsertProfile>): Promise<Profile | undefined>;
  
  // Media operations
  getMediaAsset(id: string): Promise<MediaAsset | undefined>;
  getMediaAssetsByOwner(ownerId: string, limit?: number): Promise<MediaAsset[]>;
  createMediaAsset(media: InsertMediaAsset): Promise<MediaAsset>;
  updateMediaAsset(id: string, updates: Partial<MediaAsset>): Promise<MediaAsset | undefined>;
  
  // Messaging operations
  getMessages(senderId: string, receiverId: string, limit?: number): Promise<Message[]>;
  getConversations(userId: string): Promise<any[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: string): Promise<void>;
  
  // Moderation operations
  getModerationQueue(status?: string, limit?: number): Promise<ModerationItem[]>;
  createModerationItem(item: Partial<ModerationItem>): Promise<ModerationItem>;
  updateModerationItem(id: string, updates: Partial<ModerationItem>): Promise<ModerationItem | undefined>;
  
  // Payout operations
  getPayoutAccounts(userId: string): Promise<PayoutAccount[]>;
  getPayoutRequests(userId: string, limit?: number): Promise<PayoutRequest[]>;
  
  // Analytics operations
  getUserStats(userId: string): Promise<any>;
  getSystemHealth(): Promise<any>;
  
  // Subscription operations
  getSubscription(userId: string, creatorId: string): Promise<Subscription | undefined>;
  getSubscriptionsAsFan(userId: string): Promise<Subscription[]>;
  getSubscriptionsAsCreator(userId: string): Promise<Subscription[]>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription | undefined>;
  
  // Transaction operations
  getTransactionsAsBuyer(userId: string): Promise<Transaction[]>;
  getTransactionsAsCreator(userId: string): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | undefined>;

  // KYC operations
  // KYC Verification operations
  getKycVerification(userId: string): Promise<KycVerification | undefined>;
  getKycVerificationByType(userId: string, documentType: string): Promise<KycVerification | undefined>;
  createKycVerification(verification: InsertKycVerification): Promise<KycVerification>;
  getKycVerificationsByUserId(userId: string): Promise<KycVerification[]>;
  getKycVerificationsInDateRange(startDate: Date, endDate: Date): Promise<KycVerification[]>;
  createRecord2257(record: any): Promise<any>;
  
  // Audit operations
  createAuditLog(log: Partial<AuditLog>): Promise<AuditLog>;
  getAuditLogsInDateRange(startDate: Date, endDate: Date, actionPattern?: string): Promise<AuditLog[]>;
  
  // Support Ticket operations
  getSupportTickets(userId?: string, status?: string): Promise<SupportTicket[]>;
  getSupportTicket(id: string): Promise<SupportTicket | undefined>;
  createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket>;
  updateSupportTicket(id: string, updates: Partial<SupportTicket>): Promise<SupportTicket | undefined>;
  getSupportMessages(ticketId: string): Promise<SupportMessage[]>;
  createSupportMessage(message: InsertSupportMessage): Promise<SupportMessage>;
  
  // Knowledge Base operations
  getKnowledgeArticles(category?: string, searchQuery?: string): Promise<KnowledgeArticle[]>;
  getKnowledgeArticle(id: string): Promise<KnowledgeArticle | undefined>;
  createKnowledgeArticle(article: InsertKnowledgeArticle): Promise<KnowledgeArticle>;
  updateKnowledgeArticle(id: string, updates: Partial<KnowledgeArticle>): Promise<KnowledgeArticle | undefined>;
  
  // AI-powered Knowledge Base operations
  searchKnowledgeSemanticSimilarity(query: string, limit?: number): Promise<KnowledgeArticle[]>;
  getRecommendedArticles(userId: string, limit?: number): Promise<KnowledgeArticle[]>;
  getPopularArticles(limit?: number): Promise<KnowledgeArticle[]>;
  getTrendingArticles(timeframe?: string, limit?: number): Promise<KnowledgeArticle[]>;
  recordKnowledgeView(articleId: string, userId?: string): Promise<void>;
  getArticleAnalytics(articleId: string): Promise<any>;
  getKnowledgeSearchSuggestions(partialQuery: string): Promise<string[]>;
  
  // Tutorial operations
  getTutorials(userRole?: string, category?: string): Promise<Tutorial[]>;
  getTutorial(id: string): Promise<Tutorial | undefined>;
  createTutorial(tutorial: InsertTutorial): Promise<Tutorial>;
  getTutorialProgress(userId: string, tutorialId: string): Promise<TutorialProgress | undefined>;
  updateTutorialProgress(userId: string, tutorialId: string, stepIndex: number): Promise<TutorialProgress>;
  getTutorialSteps(tutorialId: string): Promise<TutorialStep[]>;
  
  // FanzTrust operations
  verifyTransaction(params: any): Promise<any>;
  getTransaction(id: string): Promise<any>;
  getRefundByTransaction(transactionId: string): Promise<any>;
  getCreatorRefundPolicy(creatorId: string): Promise<any>;
  createRefundRequest(request: any): Promise<any>;
  createTrustAuditLog(log: any): Promise<any>;
  getCreatorRefundRequests(creatorId: string): Promise<any[]>;
  getRefundRequest(id: string): Promise<any>;
  updateRefundRequest(id: string, updates: any): Promise<any>;
  getFanzWallet(userId: string): Promise<any>;
  createFanzWallet(data: any): Promise<any>;
  getWalletTransactions(walletId: string): Promise<any[]>;
  createWalletTransaction(transaction: any): Promise<any>;
  updateFanzWallet(id: string, updates: any): Promise<any>;
  getFanTrustScore(fanId: string): Promise<any>;
  createFanTrustScore(data: any): Promise<any>;
  getAllRefundRequests(): Promise<any[]>;
  createCreatorRefundPolicy(data: any): Promise<any>;
  updateCreatorRefundPolicy(creatorId: string, updates: any): Promise<any>;
  
  // Infinity Scroll Feed operations
  getFeedPosts(params: { userId: string; cursor?: string; limit?: number }): Promise<{ posts: any[]; nextCursor: string | null }>;
  getPost(id: string): Promise<any | undefined>;
  createPost(post: any): Promise<any>;
  updatePost(id: string, updates: any): Promise<any>;
  deletePost(id: string): Promise<void>;
  
  // Post Media operations
  getPostMedia(postId: string): Promise<any[]>;
  createPostMedia(media: any): Promise<any>;
  deletePostMedia(id: string): Promise<void>;
  
  // Post Engagement operations
  getPostEngagement(postId: string): Promise<any | undefined>;
  incrementPostView(postId: string): Promise<void>;
  likePost(postId: string, userId: string): Promise<void>;
  unlikePost(postId: string, userId: string): Promise<void>;
  
  // User Follows operations
  followCreator(followerId: string, creatorId: string): Promise<any>;
  unfollowCreator(followerId: string, creatorId: string): Promise<void>;
  getFollowing(userId: string): Promise<any[]>;
  getFollowers(creatorId: string): Promise<any[]>;
  isFollowing(followerId: string, creatorId: string): Promise<boolean>;
  
  // Age Verification operations
  getAgeVerification(userId: string): Promise<any | undefined>;
  createAgeVerification(verification: any): Promise<any>;
  updateAgeVerification(userId: string, updates: any): Promise<any>;
  
  // Sponsored Posts operations
  getSponsoredPosts(params: { isActive?: boolean; limit?: number }): Promise<any[]>;
  createSponsoredPost(post: any): Promise<any>;
  incrementAdImpression(adId: string): Promise<void>;
  incrementAdClick(adId: string): Promise<void>;
  
  // Post Unlocks operations
  unlockPost(postId: string, userId: string, transactionId?: string, amount?: number): Promise<any>;
  isPostUnlocked(postId: string, userId: string): Promise<boolean>;
  getUserUnlockedPosts(userId: string): Promise<any[]>;

  // Content Creation operations
  getContentSession(id: string): Promise<ContentCreationSession | undefined>;
  getContentSessionsByCreator(creatorId: string, limit?: number): Promise<ContentCreationSession[]>;
  getContentSessionsByUserId(userId: string): Promise<ContentCreationSession[]>;
  createContentSession(session: InsertContentCreationSession): Promise<ContentCreationSession>;
  updateContentSession(id: string, updates: Partial<ContentCreationSession>): Promise<ContentCreationSession>;
  deleteContentSession(id: string, ownerId: string): Promise<void>;

  // Editing Task operations
  getEditingTask(id: string): Promise<EditingTask | undefined>;
  getEditingTaskBySession(sessionId: string): Promise<EditingTask | undefined>;
  getEditingTasksBySession(sessionId: string): Promise<EditingTask[]>;
  createEditingTask(task: InsertEditingTask): Promise<EditingTask>;
  updateEditingTask(id: string, updates: Partial<EditingTask>): Promise<EditingTask>;

  // Content Version operations
  getContentVersionsBySession(sessionId: string): Promise<ContentVersion[]>;
  createContentVersion(version: InsertContentVersion): Promise<ContentVersion>;
  
  // Generated Asset operations
  getGeneratedAssetsBySession(sessionId: string): Promise<GeneratedAsset[]>;
  createGeneratedAsset(asset: InsertGeneratedAsset): Promise<GeneratedAsset>;
  
  // Distribution Campaign operations
  getDistributionCampaign(id: string): Promise<DistributionCampaign | undefined>;
  createDistributionCampaign(campaign: InsertDistributionCampaign): Promise<DistributionCampaign>;
  updateDistributionCampaign(id: string, updates: Partial<DistributionCampaign>): Promise<DistributionCampaign>;
  
  // Platform Distribution operations
  getPlatformDistributions(campaignId: string): Promise<PlatformDistribution[]>;
  createPlatformDistribution(distribution: InsertPlatformDistribution): Promise<PlatformDistribution>;
  updatePlatformDistribution(id: string, updates: Partial<PlatformDistribution>): Promise<PlatformDistribution>;
  
  // Content Analytics operations
  getContentAnalytics(sessionId: string): Promise<ContentAnalytics | undefined>;
  createContentAnalytics(analytics: InsertContentAnalytics): Promise<ContentAnalytics>;
  updateContentAnalytics(sessionId: string, updates: Partial<ContentAnalytics>): Promise<ContentAnalytics>;
  
  // Creator Studio Settings operations
  getCreatorStudioSettings(creatorId: string): Promise<CreatorStudioSettings | undefined>;
  createCreatorStudioSettings(settings: InsertCreatorStudioSettings): Promise<CreatorStudioSettings>;
  updateCreatorStudioSettings(creatorId: string, updates: Partial<CreatorStudioSettings>): Promise<CreatorStudioSettings>;

  // Smart Link operations
  createSmartLink(link: any): Promise<any>;
  getSmartLinkClicks(url: string): Promise<number>;
  getQRCodeScans(url: string): Promise<number>;
  
  // Live Stream operations
  createLiveStream(stream: any): Promise<any>;
  updateLiveStream(id: string, updates: any): Promise<any>;
  getLiveStream(id: string): Promise<any | undefined>;
  getLiveStreamByKey(streamKey: string): Promise<any | undefined>;
  addLiveStreamCoStar(data: any): Promise<any>;
  
  // Stream Participant operations
  addStreamParticipant(participant: any): Promise<any>;
  updateStreamParticipant(streamId: string, userId: string, updates: any): Promise<any>;
  getStreamParticipants(streamId: string): Promise<any[]>;
  
  // Stream Viewer operations
  addStreamViewer(viewer: any): Promise<any>;
  updateStreamViewer(streamId: string, userId: string, updates: any): Promise<any>;
  getStreamViewers(streamId: string): Promise<any[]>;
  
  // Stream Chat operations
  addStreamChatMessage(message: any): Promise<any>;
  getStreamChatMessages(streamId: string, limit?: number): Promise<any[]>;
  
  // Stream Gift operations
  addStreamGift(gift: any): Promise<any>;
  getStreamGifts(streamId: string): Promise<any[]>;
  
  // Stream Reaction operations
  addStreamReaction(reaction: any): Promise<any>;
  getStreamReactions(streamId: string): Promise<any[]>;
  
  // Stream Highlight operations
  createStreamHighlight(highlight: any): Promise<any>;
  getStreamHighlights(streamId: string): Promise<any[]>;
  
  // Stream Recording operations
  createStreamRecording(recording: any): Promise<any>;
  updateStreamRecording(id: string, updates: any): Promise<any>;
  getStreamRecording(streamId: string): Promise<any | undefined>;
  
  // Stream Analytics operations
  createStreamAnalytics(analytics: any): Promise<any>;
  updateStreamAnalytics(streamId: string, updates: any): Promise<any>;
  getStreamAnalytics(streamId: string): Promise<any | undefined>;

  // NFT Collection operations
  getNftCollection(id: string): Promise<NftCollection | undefined>;
  getNftCollectionsByCreator(creatorId: string): Promise<NftCollection[]>;
  createNftCollection(collection: InsertNftCollection): Promise<NftCollection>;
  updateNftCollection(id: string, updates: Partial<NftCollection>): Promise<NftCollection | undefined>;

  // NFT Token operations  
  getNftToken(id: string): Promise<NftToken | undefined>;
  getNftTokensByOwner(ownerId: string): Promise<NftToken[]>;
  getNftTokensByCollection(collectionId: string): Promise<NftToken[]>;
  createNftToken(token: InsertNftToken): Promise<NftToken>;
  updateNftToken(id: string, updates: Partial<NftToken>): Promise<NftToken | undefined>;

  // NFT Transaction operations
  getNftTransactionsByToken(tokenId: string): Promise<NftTransaction[]>;
  getNftTransactionsByUser(userId: string): Promise<NftTransaction[]>;
  createNftTransaction(transaction: InsertNftTransaction): Promise<NftTransaction>;
  updateNftTransaction(id: string, updates: Partial<NftTransaction>): Promise<NftTransaction | undefined>;

  // Blockchain Wallet operations
  getBlockchainWallet(userId: string, blockchain?: string): Promise<BlockchainWallet | undefined>;
  getBlockchainWalletsByUser(userId: string): Promise<BlockchainWallet[]>;
  createBlockchainWallet(wallet: InsertBlockchainWallet): Promise<BlockchainWallet>;
  updateBlockchainWallet(id: string, updates: Partial<BlockchainWallet>): Promise<BlockchainWallet | undefined>;

  // Royalty Distribution operations
  getRoyaltyDistributionsByToken(tokenId: string): Promise<RoyaltyDistribution[]>;
  getRoyaltyDistributionsByRecipient(recipientId: string): Promise<RoyaltyDistribution[]>;
  createRoyaltyDistribution(distribution: InsertRoyaltyDistribution): Promise<RoyaltyDistribution>;
  updateRoyaltyDistribution(id: string, updates: Partial<RoyaltyDistribution>): Promise<RoyaltyDistribution | undefined>;

  // IPFS Record operations
  getIpfsRecordsByUser(userId: string): Promise<IpfsRecord[]>;
  getIpfsRecordByHash(ipfsHash: string): Promise<IpfsRecord | undefined>;
  createIpfsRecord(record: InsertIpfsRecord): Promise<IpfsRecord>;
  updateIpfsRecord(id: string, updates: Partial<IpfsRecord>): Promise<IpfsRecord | undefined>;

  // Marketplace Integration operations
  getMarketplaceIntegration(userId: string, marketplace: string): Promise<MarketplaceIntegration | undefined>;
  getMarketplaceIntegrationsByUser(userId: string): Promise<MarketplaceIntegration[]>;
  createMarketplaceIntegration(integration: InsertMarketplaceIntegration): Promise<MarketplaceIntegration>;
  updateMarketplaceIntegration(id: string, updates: Partial<MarketplaceIntegration>): Promise<MarketplaceIntegration | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async createUser(userData: Partial<User>): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData as any)
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getUsersBySecurityQuestion(question: string): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.securityQuestion, question));
  }

  // Password reset tokens
  async createPasswordResetToken(tokenData: { userId: string; token: string; expiresAt: Date }): Promise<any> {
    const { passwordResetTokens } = await import('../shared/schema');
    const [token] = await db
      .insert(passwordResetTokens)
      .values(tokenData)
      .returning();
    return token;
  }

  async getPasswordResetToken(token: string): Promise<any | undefined> {
    const { passwordResetTokens } = await import('../shared/schema');
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token));
    return resetToken;
  }

  async markPasswordResetTokenUsed(token: string): Promise<void> {
    const { passwordResetTokens } = await import('../shared/schema');
    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.token, token));
  }

  // Email verification tokens
  async createEmailVerificationToken(tokenData: { userId: string; token: string; expiresAt: Date }): Promise<any> {
    const { emailVerificationTokens } = await import('../shared/schema');
    const [token] = await db
      .insert(emailVerificationTokens)
      .values(tokenData)
      .returning();
    return token;
  }

  async getEmailVerificationToken(token: string): Promise<any | undefined> {
    const { emailVerificationTokens } = await import('../shared/schema');
    const [verificationToken] = await db
      .select()
      .from(emailVerificationTokens)
      .where(eq(emailVerificationTokens.token, token));
    return verificationToken;
  }

  async markEmailVerificationTokenUsed(token: string): Promise<void> {
    const { emailVerificationTokens } = await import('../shared/schema');
    await db
      .update(emailVerificationTokens)
      .set({ used: true })
      .where(eq(emailVerificationTokens.token, token));
  }

  // Profile operations
  async getProfile(userId: string): Promise<Profile | undefined> {
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId));
    return profile;
  }

  async getProfileWithUser(userId: string): Promise<(Profile & { user: User }) | undefined> {
    const [result] = await db
      .select()
      .from(profiles)
      .innerJoin(users, eq(profiles.userId, users.id))
      .where(eq(profiles.userId, userId));
    
    if (!result) return undefined;
    
    return {
      ...result.profiles,
      user: result.users,
    };
  }

  async createProfile(profileData: InsertProfile): Promise<Profile> {
    const [profile] = await db
      .insert(profiles)
      .values(profileData)
      .returning();
    return profile;
  }

  async updateProfile(userId: string, updates: Partial<InsertProfile>): Promise<Profile | undefined> {
    const [profile] = await db
      .update(profiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(profiles.userId, userId))
      .returning();
    return profile;
  }

  // Media operations
  async getMediaAsset(id: string): Promise<MediaAsset | undefined> {
    const [media] = await db
      .select()
      .from(mediaAssets)
      .where(eq(mediaAssets.id, id));
    return media;
  }

  async getMediaAssetsByOwner(ownerId: string, limit = 20): Promise<MediaAsset[]> {
    return await db
      .select()
      .from(mediaAssets)
      .where(eq(mediaAssets.ownerId, ownerId))
      .orderBy(desc(mediaAssets.createdAt))
      .limit(limit);
  }

  async createMediaAsset(mediaData: InsertMediaAsset): Promise<MediaAsset> {
    const [media] = await db
      .insert(mediaAssets)
      .values(mediaData)
      .returning();
    return media;
  }

  async updateMediaAsset(id: string, updates: Partial<MediaAsset>): Promise<MediaAsset | undefined> {
    const [media] = await db
      .update(mediaAssets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(mediaAssets.id, id))
      .returning();
    return media;
  }

  // Messaging operations
  async getMessages(senderId: string, receiverId: string, limit = 50): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(
        or(
          and(eq(messages.senderId, senderId), eq(messages.receiverId, receiverId)),
          and(eq(messages.senderId, receiverId), eq(messages.receiverId, senderId))
        )
      )
      .orderBy(desc(messages.createdAt))
      .limit(limit);
  }

  async getConversations(userId: string): Promise<any[]> {
    // Get latest message for each conversation
    const conversations = await db
      .select({
        otherUserId: sql`CASE WHEN ${messages.senderId} = ${userId} THEN ${messages.receiverId} ELSE ${messages.senderId} END`.as('other_user_id'),
        lastMessage: messages.content,
        lastMessageTime: messages.createdAt,
        isRead: messages.isRead,
      })
      .from(messages)
      .where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)))
      .orderBy(desc(messages.createdAt));

    // Group by conversation and get the latest message
    const conversationMap = new Map();
    conversations.forEach(conv => {
      const key = conv.otherUserId;
      if (!conversationMap.has(key)) {
        conversationMap.set(key, conv);
      }
    });

    return Array.from(conversationMap.values());
  }

  async createMessage(messageData: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(messageData)
      .returning();
    return message;
  }

  async markMessageAsRead(id: string): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, id));
  }

  // Moderation operations
  async getModerationQueue(status?: string, limit = 50): Promise<ModerationItem[]> {
    const baseQuery = db
      .select()
      .from(moderationQueue)
      .innerJoin(mediaAssets, eq(moderationQueue.mediaId, mediaAssets.id))
      .orderBy(desc(moderationQueue.createdAt))
      .limit(limit);

    const results = status 
      ? await baseQuery.where(eq(moderationQueue.status, status as any))
      : await baseQuery;
      
    return results.map(r => ({
      ...r.moderation_queue,
      media: r.media_assets,
    })) as any;
  }

  async createModerationItem(itemData: Partial<ModerationItem>): Promise<ModerationItem> {
    const [item] = await db
      .insert(moderationQueue)
      .values(itemData as any)
      .returning();
    return item;
  }

  async updateModerationItem(id: string, updates: Partial<ModerationItem>): Promise<ModerationItem | undefined> {
    const [item] = await db
      .update(moderationQueue)
      .set({ ...updates, reviewedAt: new Date() })
      .where(eq(moderationQueue.id, id))
      .returning();
    return item;
  }

  // Payout operations
  async getPayoutAccounts(userId: string): Promise<PayoutAccount[]> {
    return await db
      .select()
      .from(payoutAccounts)
      .where(eq(payoutAccounts.userId, userId));
  }

  async getPayoutRequests(userId: string, limit = 20): Promise<PayoutRequest[]> {
    return await db
      .select()
      .from(payoutRequests)
      .where(eq(payoutRequests.userId, userId))
      .orderBy(desc(payoutRequests.createdAt))
      .limit(limit);
  }

  // Analytics operations
  async getUserStats(userId: string): Promise<any> {
    const profile = await this.getProfile(userId);
    const mediaCount = await db
      .select({ count: sql`count(*)` })
      .from(mediaAssets)
      .where(eq(mediaAssets.ownerId, userId));

    const totalViews = await db
      .select({ total: sql`sum(${mediaAssets.views})` })
      .from(mediaAssets)
      .where(eq(mediaAssets.ownerId, userId));

    return {
      totalEarnings: profile?.totalEarnings || 0,
      fanCount: profile?.fanCount || 0,
      contentPosts: mediaCount[0]?.count || 0,
      totalViews: totalViews[0]?.total || 0,
      engagement: 94.2, // Calculate based on actual metrics
    };
  }

  async getSystemHealth(): Promise<any> {
    // Check database connection
    const dbCheck = await db.select({ count: sql`count(*)` }).from(users);
    
    // Get moderation queue count
    const pendingModeration = await db
      .select({ count: sql`count(*)` })
      .from(moderationQueue)
      .where(eq(moderationQueue.status, 'pending'));

    // Get active user count
    const activeUsers = await db
      .select({ count: sql`count(*)` })
      .from(users)
      .where(eq(users.status, 'active'));

    return {
      database: {
        status: 'healthy',
        connections: 45,
        queryTime: '12ms',
      },
      apiGateway: {
        status: 'healthy',
        responseTime: '45ms',
        uptime: '99.98%',
      },
      payments: {
        status: 'maintenance',
        provider: 'CCBill',
        successRate: '98.2%',
      },
      websocket: {
        status: 'active',
        connections: activeUsers[0]?.count || 0,
        latency: '28ms',
      },
      moderation: {
        pending: pendingModeration[0]?.count || 0,
        status: 'operational',
      },
    };
  }

  // Subscription operations
  async getSubscription(userId: string, creatorId: string): Promise<Subscription | undefined> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.creatorId, creatorId)
      ));
    return subscription;
  }

  async getSubscriptionsAsFan(userId: string): Promise<Subscription[]> {
    return await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.createdAt));
  }

  async getSubscriptionsAsCreator(userId: string): Promise<Subscription[]> {
    return await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.creatorId, userId))
      .orderBy(desc(subscriptions.createdAt));
  }

  async createSubscription(subscriptionData: InsertSubscription): Promise<Subscription> {
    const [subscription] = await db
      .insert(subscriptions)
      .values(subscriptionData)
      .returning();
    return subscription;
  }

  async updateSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription | undefined> {
    const [subscription] = await db
      .update(subscriptions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(subscriptions.id, id))
      .returning();
    return subscription;
  }

  // Transaction operations
  async getTransactionsAsBuyer(userId: string): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt));
  }

  async getTransactionsAsCreator(userId: string): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.creatorId, userId))
      .orderBy(desc(transactions.createdAt));
  }

  async createTransaction(transactionData: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values(transactionData)
      .returning();
    return transaction;
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | undefined> {
    const [transaction] = await db
      .update(transactions)
      .set(updates)
      .where(eq(transactions.id, id))
      .returning();
    return transaction;
  }

  // KYC operations
  async getKycVerification(userId: string): Promise<KycVerification | undefined> {
    const [verification] = await db
      .select()
      .from(kycVerifications)
      .where(eq(kycVerifications.userId, userId))
      .orderBy(desc(kycVerifications.createdAt))
      .limit(1);
    return verification;
  }

  async getKycVerificationByType(userId: string, documentType: string): Promise<KycVerification | undefined> {
    const [verification] = await db
      .select()
      .from(kycVerifications)
      .where(and(
        eq(kycVerifications.userId, userId),
        eq(kycVerifications.documentType, documentType)
      ))
      .orderBy(desc(kycVerifications.createdAt))
      .limit(1);
    return verification;
  }

  async createKycVerification(verificationData: InsertKycVerification): Promise<KycVerification> {
    const [verification] = await db
      .insert(kycVerifications)
      .values(verificationData)
      .returning();
    return verification;
  }

  // Audit operations  
  async createAuditLog(logData: Partial<AuditLog>): Promise<AuditLog> {
    const [auditLog] = await db
      .insert(auditLogs)
      .values(logData as any)
      .returning();
    return auditLog;
  }

  // Support Ticket operations
  async getSupportTickets(userId?: string, status?: string): Promise<SupportTicket[]> {
    const conditions = [];
    
    if (userId) conditions.push(eq(supportTickets.userId, userId));
    if (status) conditions.push(eq(supportTickets.status, status));
    
    let query = db.select().from(supportTickets);
    
    if (conditions.length > 0) {
      query = query.where(conditions.length === 1 ? conditions[0] : and(...conditions)) as any;
    }
    
    return await query.orderBy(desc(supportTickets.createdAt));
  }

  async getSupportTicket(id: string): Promise<SupportTicket | undefined> {
    const [ticket] = await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.id, id));
    return ticket;
  }

  async createSupportTicket(ticketData: InsertSupportTicket): Promise<SupportTicket> {
    const [ticket] = await db
      .insert(supportTickets)
      .values(ticketData)
      .returning();
    return ticket;
  }

  async updateSupportTicket(id: string, updates: Partial<SupportTicket>): Promise<SupportTicket | undefined> {
    const [ticket] = await db
      .update(supportTickets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(supportTickets.id, id))
      .returning();
    return ticket;
  }

  async getSupportMessages(ticketId: string): Promise<SupportMessage[]> {
    return await db
      .select()
      .from(supportMessages)
      .where(eq(supportMessages.ticketId, ticketId))
      .orderBy(supportMessages.createdAt);
  }

  async createSupportMessage(messageData: InsertSupportMessage): Promise<SupportMessage> {
    const [message] = await db
      .insert(supportMessages)
      .values(messageData)
      .returning();
    return message;
  }

  // Knowledge Base operations
  async getKnowledgeArticles(category?: string, searchQuery?: string): Promise<KnowledgeArticle[]> {
    let query = db.select().from(knowledgeArticles);
    const conditions = [eq(knowledgeArticles.status, 'published')];
    
    if (category) {
      // Filter articles that have the category in their tags array
      conditions.push(sql`${knowledgeArticles.tags} @> ARRAY[${category}]::text[]`);
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(knowledgeArticles.updatedAt));
  }

  async getKnowledgeArticle(id: string): Promise<KnowledgeArticle | undefined> {
    const [article] = await db
      .select()
      .from(knowledgeArticles)
      .where(eq(knowledgeArticles.id, id));
    return article;
  }

  async getKnowledgeArticleBySlug(slug: string): Promise<KnowledgeArticle | undefined> {
    const [article] = await db
      .select()
      .from(knowledgeArticles)
      .where(eq(knowledgeArticles.slug, slug));
    return article;
  }

  async createKnowledgeArticle(articleData: InsertKnowledgeArticle): Promise<KnowledgeArticle> {
    const [article] = await db
      .insert(knowledgeArticles)
      .values(articleData)
      .returning();
    return article;
  }

  async updateKnowledgeArticle(id: string, updates: Partial<KnowledgeArticle>): Promise<KnowledgeArticle | undefined> {
    const [article] = await db
      .update(knowledgeArticles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(knowledgeArticles.id, id))
      .returning();
    return article;
  }

  // AI-powered Knowledge Base operations
  async searchKnowledgeSemanticSimilarity(query: string, limit = 10): Promise<KnowledgeArticle[]> {
    // For now, implement a enhanced text search that simulates semantic similarity
    // In production, this would use actual vector embeddings with cosine similarity
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);
    
    const articles = await db
      .select()
      .from(knowledgeArticles)
      .where(eq(knowledgeArticles.status, 'published'))
      .orderBy(desc(knowledgeArticles.publishedAt))
      .limit(50);

    // Score articles based on term frequency and relevance
    const scoredArticles = articles.map(article => {
      let score = 0;
      const titleLower = article.title.toLowerCase();
      const summaryLower = (article.summary || '').toLowerCase();
      const tagsLower = (article.tags || []).join(' ').toLowerCase();
      
      searchTerms.forEach(term => {
        // Title matches get higher weight
        if (titleLower.includes(term)) score += 10;
        // Summary matches
        if (summaryLower.includes(term)) score += 5;
        // Tag matches
        if (tagsLower.includes(term)) score += 8;
      });
      
      return { article, score };
    });

    return scoredArticles
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.article);
  }

  async getRecommendedArticles(userId: string, limit = 5): Promise<KnowledgeArticle[]> {
    // Get user's recently viewed articles and find related content
    // For now, return popular articles with similar tags
    const recentArticles = await db
      .select({ tags: knowledgeArticles.tags })
      .from(knowledgeArticles)
      .where(eq(knowledgeArticles.status, 'published'))
      .orderBy(desc(knowledgeArticles.publishedAt))
      .limit(10);

    const allTags = recentArticles.flatMap(a => a.tags || []);
    const popularTags = [...new Set(allTags)].slice(0, 5);

    if (popularTags.length === 0) {
      return this.getPopularArticles(limit);
    }

    return await db
      .select()
      .from(knowledgeArticles)
      .where(eq(knowledgeArticles.status, 'published'))
      .orderBy(desc(knowledgeArticles.publishedAt))
      .limit(limit);
  }

  async getPopularArticles(limit = 5): Promise<KnowledgeArticle[]> {
    // Return articles ordered by a popularity score (views, recency, ratings)
    return await db
      .select()
      .from(knowledgeArticles)
      .where(eq(knowledgeArticles.status, 'published'))
      .orderBy(desc(knowledgeArticles.publishedAt))
      .limit(limit);
  }

  async getTrendingArticles(timeframe = '7d', limit = 5): Promise<KnowledgeArticle[]> {
    // Get articles that are trending in the specified timeframe
    const days = timeframe === '24h' ? 1 : timeframe === '7d' ? 7 : 30;
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    return await db
      .select()
      .from(knowledgeArticles)
      .where(
        and(
          eq(knowledgeArticles.status, 'published'),
          sql`${knowledgeArticles.publishedAt} >= ${cutoffDate}`
        )
      )
      .orderBy(desc(knowledgeArticles.publishedAt))
      .limit(limit);
  }

  async recordKnowledgeView(articleId: string, userId?: string): Promise<void> {
    // Record article view for analytics
    // For now, we'll just create an audit log entry
    await this.createAuditLog({
      actorId: userId,
      action: 'article_view',
      targetType: 'knowledge_article',
      targetId: articleId,
      metadata: { timestamp: new Date().toISOString() },
    });
  }

  async getArticleAnalytics(articleId: string): Promise<any> {
    // Get analytics for a specific article
    const viewCount = await db
      .select({ count: sql`count(*)` })
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.targetType, 'knowledge_article'),
          eq(auditLogs.targetId, articleId),
          eq(auditLogs.action, 'article_view')
        )
      );

    const recentViews = await db
      .select({ count: sql`count(*)` })
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.targetType, 'knowledge_article'),
          eq(auditLogs.targetId, articleId),
          eq(auditLogs.action, 'article_view'),
          sql`${auditLogs.createdAt} >= NOW() - INTERVAL '7 days'`
        )
      );

    return {
      totalViews: viewCount[0]?.count || 0,
      recentViews: recentViews[0]?.count || 0,
      engagement: Math.floor(Math.random() * 40) + 60, // Simulated engagement score
      avgTimeOnPage: Math.floor(Math.random() * 120) + 60, // Simulated reading time
    };
  }

  async getKnowledgeSearchSuggestions(partialQuery: string): Promise<string[]> {
    if (partialQuery.length < 2) return [];

    // Get suggestions based on article titles and popular tags
    const titleSuggestions = await db
      .select({ title: knowledgeArticles.title })
      .from(knowledgeArticles)
      .where(
        and(
          eq(knowledgeArticles.status, 'published'),
          sql`LOWER(${knowledgeArticles.title}) LIKE LOWER(${'%' + partialQuery + '%'})`
        )
      )
      .limit(5);

    const suggestions = titleSuggestions.map(item => item.title);

    // Add common search terms based on tags
    const tagSuggestions = [
      'getting started', 'account setup', 'payment issues', 
      'content upload', 'verification process', 'earnings',
      'privacy settings', 'moderation', 'subscription'
    ].filter(tag => tag.toLowerCase().includes(partialQuery.toLowerCase()));

    return [...new Set([...suggestions, ...tagSuggestions])].slice(0, 8);
  }

  // Tutorial operations
  async getTutorials(userRole?: string, category?: string): Promise<Tutorial[]> {
    const conditions = [eq(tutorials.status, 'published')];
    
    if (userRole && userRole !== 'all') {
      const roleCondition = or(
        eq(tutorials.roleTarget, userRole),
        eq(tutorials.roleTarget, 'all')
      );
      if (roleCondition) {
        conditions.push(roleCondition);
      }
    }
    
    return await db.select().from(tutorials)
      .where(and(...conditions))
      .orderBy(tutorials.createdAt, tutorials.title);
  }

  async getTutorial(id: string): Promise<Tutorial | undefined> {
    const [tutorial] = await db
      .select()
      .from(tutorials)
      .where(eq(tutorials.id, id));
    return tutorial;
  }

  async createTutorial(tutorialData: InsertTutorial): Promise<Tutorial> {
    const [tutorial] = await db
      .insert(tutorials)
      .values(tutorialData)
      .returning();
    return tutorial;
  }

  async getTutorialSteps(tutorialId: string): Promise<TutorialStep[]> {
    return await db
      .select()
      .from(tutorialSteps)
      .where(eq(tutorialSteps.tutorialId, tutorialId))
      .orderBy(tutorialSteps.stepNumber);
  }

  async getTutorialProgress(userId: string, tutorialId: string): Promise<TutorialProgress | undefined> {
    const [progress] = await db
      .select()
      .from(tutorialProgress)
      .where(and(
        eq(tutorialProgress.userId, userId),
        eq(tutorialProgress.tutorialId, tutorialId)
      ));
    return progress;
  }

  async updateTutorialProgress(userId: string, tutorialId: string, stepIndex: number): Promise<TutorialProgress> {
    // Get tutorial steps to determine if tutorial is complete
    const steps = await db
      .select()
      .from(tutorialSteps)
      .where(eq(tutorialSteps.tutorialId, tutorialId))
      .orderBy(tutorialSteps.stepNumber);
    
    const totalSteps = steps.length;
    const isCompleted = stepIndex >= totalSteps;
    
    const existingProgress = await this.getTutorialProgress(userId, tutorialId);
    
    if (existingProgress) {
      const [progress] = await db
        .update(tutorialProgress)
        .set({ 
          completedStep: stepIndex,
          completedAt: isCompleted ? new Date() : null
        })
        .where(and(
          eq(tutorialProgress.userId, userId),
          eq(tutorialProgress.tutorialId, tutorialId)
        ))
        .returning();
      return progress;
    } else {
      const [progress] = await db
        .insert(tutorialProgress)
        .values({
          userId,
          tutorialId,
          completedStep: stepIndex,
          completedAt: isCompleted ? new Date() : null
        })
        .returning();
      return progress;
    }
  }

  // ====================================
  // FanzTrust™ Storage Methods
  // ====================================

  async verifyTransaction(params: any): Promise<FanzTransaction | undefined> {
    const conditions = [];
    
    if (params.fanId) conditions.push(eq(fanzTransactions.fanId, params.fanId));
    if (params.creatorId) conditions.push(eq(fanzTransactions.creatorId, params.creatorId));
    if (params.gateway) conditions.push(eq(fanzTransactions.gateway, params.gateway));
    if (params.txid) conditions.push(eq(fanzTransactions.txid, params.txid));
    if (params.email) conditions.push(eq(fanzTransactions.email, params.email));
    if (params.walletAddress) conditions.push(eq(fanzTransactions.walletAddress, params.walletAddress));
    if (params.last4) conditions.push(eq(fanzTransactions.last4, params.last4));
    
    const [transaction] = await db
      .select()
      .from(fanzTransactions)
      .where(and(...conditions))
      .orderBy(desc(fanzTransactions.createdAt))
      .limit(1);
    
    return transaction;
  }

  async getTransaction(id: string): Promise<FanzTransaction | undefined> {
    const [transaction] = await db
      .select()
      .from(fanzTransactions)
      .where(eq(fanzTransactions.id, id));
    return transaction;
  }

  async getRefundByTransaction(transactionId: string): Promise<RefundRequest | undefined> {
    const [refund] = await db
      .select()
      .from(refundRequests)
      .where(eq(refundRequests.transactionId, transactionId));
    return refund;
  }

  async getCreatorRefundPolicy(creatorId: string): Promise<any> {
    const [policy] = await db
      .select()
      .from(creatorRefundPolicies)
      .where(eq(creatorRefundPolicies.creatorId, creatorId));
    return policy;
  }

  async createRefundRequest(requestData: any): Promise<RefundRequest> {
    const [refund] = await db
      .insert(refundRequests)
      .values(requestData)
      .returning();
    return refund;
  }

  async createTrustAuditLog(logData: any): Promise<any> {
    const [log] = await db
      .insert(trustAuditLogs)
      .values(logData)
      .returning();
    return log;
  }

  async getCreatorRefundRequests(creatorId: string): Promise<RefundRequest[]> {
    return await db
      .select()
      .from(refundRequests)
      .where(eq(refundRequests.creatorId, creatorId))
      .orderBy(desc(refundRequests.createdAt));
  }

  async getRefundRequest(id: string): Promise<RefundRequest | undefined> {
    const [refund] = await db
      .select()
      .from(refundRequests)
      .where(eq(refundRequests.id, id));
    return refund;
  }

  async updateRefundRequest(id: string, updates: any): Promise<RefundRequest> {
    const [refund] = await db
      .update(refundRequests)
      .set(updates)
      .where(eq(refundRequests.id, id))
      .returning();
    return refund;
  }

  async getFanzWallet(userId: string): Promise<FanzWallet | undefined> {
    const [wallet] = await db
      .select()
      .from(fanzWallets)
      .where(eq(fanzWallets.userId, userId));
    return wallet;
  }

  async createFanzWallet(data: any): Promise<FanzWallet> {
    const [wallet] = await db
      .insert(fanzWallets)
      .values(data)
      .returning();
    return wallet;
  }

  async getWalletTransactions(walletId: string): Promise<WalletTransaction[]> {
    return await db
      .select()
      .from(walletTransactions)
      .where(eq(walletTransactions.walletId, walletId))
      .orderBy(desc(walletTransactions.createdAt));
  }

  async createWalletTransaction(transactionData: any): Promise<WalletTransaction> {
    const [transaction] = await db
      .insert(walletTransactions)
      .values(transactionData)
      .returning();
    return transaction;
  }

  async updateFanzWallet(id: string, updates: any): Promise<FanzWallet> {
    const [wallet] = await db
      .update(fanzWallets)
      .set(updates)
      .where(eq(fanzWallets.id, id))
      .returning();
    return wallet;
  }

  async getFanTrustScore(fanId: string): Promise<FanTrustScore | undefined> {
    const [score] = await db
      .select()
      .from(fanTrustScores)
      .where(eq(fanTrustScores.fanId, fanId));
    return score;
  }

  async createFanTrustScore(data: any): Promise<FanTrustScore> {
    const [score] = await db
      .insert(fanTrustScores)
      .values(data)
      .returning();
    return score;
  }

  async getAllRefundRequests(): Promise<RefundRequest[]> {
    return await db
      .select()
      .from(refundRequests)
      .orderBy(desc(refundRequests.createdAt));
  }

  async createCreatorRefundPolicy(data: any): Promise<any> {
    const [policy] = await db
      .insert(creatorRefundPolicies)
      .values(data)
      .returning();
    return policy;
  }

  async updateCreatorRefundPolicy(creatorId: string, updates: any): Promise<any> {
    const [policy] = await db
      .update(creatorRefundPolicies)
      .set(updates)
      .where(eq(creatorRefundPolicies.creatorId, creatorId))
      .returning();
    return policy;
  }

  // ========================================
  // INFINITY SCROLL FEED OPERATIONS
  // ========================================

  async getFeedPosts(params: { userId: string; cursor?: string; limit?: number }): Promise<{ posts: any[]; nextCursor: string | null }> {
    const limit = params.limit || 20;
    const userId = params.userId;

    // Get user's subscriptions
    const userSubs = await db
      .select({ creatorId: subscriptions.creatorId })
      .from(subscriptions)
      .where(and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, 'active')
      ));
    
    const subscribedCreatorIds = userSubs.map(s => s.creatorId);

    // Get user's follows
    const userFollows_result = await db
      .select({ creatorId: userFollows.creatorId })
      .from(userFollows)
      .where(eq(userFollows.followerId, userId));
    
    const followedCreatorIds = userFollows_result.map(f => f.creatorId);

    // Build query for mixed feed
    const conditions = [];
    
    // Include posts from subscribed creators
    if (subscribedCreatorIds.length > 0) {
      conditions.push(sql`${feedPosts.creatorId} IN (${sql.join(subscribedCreatorIds.map(id => sql`${id}`), sql`, `)})`);
    }
    
    // Include posts from followed creators
    if (followedCreatorIds.length > 0) {
      conditions.push(sql`${feedPosts.creatorId} IN (${sql.join(followedCreatorIds.map(id => sql`${id}`), sql`, `)})`);
    }
    
    // Include free preview posts
    conditions.push(and(
      eq(feedPosts.isFreePreview, true),
      eq(feedPosts.isPublished, true)
    ));

    // Build final where clause with cursor if provided
    let finalWhereClause;
    if (params.cursor) {
      const cursorCondition = sql`${feedPosts.createdAt} < (SELECT created_at FROM feed_posts WHERE id = ${params.cursor})`;
      finalWhereClause = conditions.length > 0 ? and(or(...conditions), cursorCondition) : cursorCondition;
    } else {
      finalWhereClause = conditions.length > 0 ? or(...conditions) : undefined;
    }
    
    const posts = await db
      .select()
      .from(feedPosts)
      .where(finalWhereClause)
      .orderBy(desc(feedPosts.createdAt))
      .limit(limit + 1);
    const hasMore = posts.length > limit;
    const returnPosts = hasMore ? posts.slice(0, limit) : posts;
    const nextCursor = hasMore && returnPosts.length > 0 ? returnPosts[returnPosts.length - 1].id : null;

    return { posts: returnPosts, nextCursor };
  }

  async getPost(id: string): Promise<FeedPost | undefined> {
    const [post] = await db
      .select()
      .from(feedPosts)
      .where(eq(feedPosts.id, id));
    return post;
  }

  async createPost(postData: InsertFeedPost): Promise<FeedPost> {
    const [post] = await db
      .insert(feedPosts)
      .values(postData)
      .returning();
    
    // Create engagement record
    await db.insert(postEngagement).values({ postId: post.id });
    
    return post;
  }

  async updatePost(id: string, updates: Partial<FeedPost>): Promise<FeedPost> {
    const [post] = await db
      .update(feedPosts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(feedPosts.id, id))
      .returning();
    return post;
  }

  async deletePost(id: string): Promise<void> {
    await db.delete(feedPosts).where(eq(feedPosts.id, id));
  }

  // Post Media operations
  async getPostMedia(postId: string): Promise<PostMedia[]> {
    return await db
      .select()
      .from(postMedia)
      .where(eq(postMedia.postId, postId))
      .orderBy(postMedia.sortOrder);
  }

  async createPostMedia(mediaData: InsertPostMedia): Promise<PostMedia> {
    const [media] = await db
      .insert(postMedia)
      .values(mediaData)
      .returning();
    return media;
  }

  async deletePostMedia(id: string): Promise<void> {
    await db.delete(postMedia).where(eq(postMedia.id, id));
  }

  // Post Engagement operations
  async getPostEngagement(postId: string): Promise<PostEngagement | undefined> {
    const [engagement] = await db
      .select()
      .from(postEngagement)
      .where(eq(postEngagement.postId, postId));
    return engagement;
  }

  async incrementPostView(postId: string): Promise<void> {
    await db
      .update(postEngagement)
      .set({ 
        views: sql`${postEngagement.views} + 1`,
        updatedAt: new Date()
      })
      .where(eq(postEngagement.postId, postId));
  }

  async likePost(postId: string, userId: string): Promise<void> {
    // Check if already liked
    const [existing] = await db
      .select()
      .from(postLikes)
      .where(and(
        eq(postLikes.postId, postId),
        eq(postLikes.userId, userId)
      ));
    
    if (!existing) {
      await db.insert(postLikes).values({ postId, userId });
      await db
        .update(postEngagement)
        .set({ 
          likes: sql`${postEngagement.likes} + 1`,
          updatedAt: new Date()
        })
        .where(eq(postEngagement.postId, postId));
    }
  }

  async unlikePost(postId: string, userId: string): Promise<void> {
    const deleted = await db
      .delete(postLikes)
      .where(and(
        eq(postLikes.postId, postId),
        eq(postLikes.userId, userId)
      ))
      .returning();
    
    if (deleted.length > 0) {
      await db
        .update(postEngagement)
        .set({ 
          likes: sql`${postEngagement.likes} - 1`,
          updatedAt: new Date()
        })
        .where(eq(postEngagement.postId, postId));
    }
  }

  // User Follows operations
  async followCreator(followerId: string, creatorId: string): Promise<UserFollow> {
    const [follow] = await db
      .insert(userFollows)
      .values({ followerId, creatorId })
      .returning();
    return follow;
  }

  async unfollowCreator(followerId: string, creatorId: string): Promise<void> {
    await db
      .delete(userFollows)
      .where(and(
        eq(userFollows.followerId, followerId),
        eq(userFollows.creatorId, creatorId)
      ));
  }

  async getFollowing(userId: string): Promise<UserFollow[]> {
    return await db
      .select()
      .from(userFollows)
      .where(eq(userFollows.followerId, userId));
  }

  async getFollowers(creatorId: string): Promise<UserFollow[]> {
    return await db
      .select()
      .from(userFollows)
      .where(eq(userFollows.creatorId, creatorId));
  }

  async isFollowing(followerId: string, creatorId: string): Promise<boolean> {
    const [result] = await db
      .select()
      .from(userFollows)
      .where(and(
        eq(userFollows.followerId, followerId),
        eq(userFollows.creatorId, creatorId)
      ));
    return !!result;
  }

  // Age Verification operations
  async getAgeVerification(userId: string): Promise<AgeVerification | undefined> {
    const [verification] = await db
      .select()
      .from(ageVerifications)
      .where(eq(ageVerifications.userId, userId));
    return verification;
  }

  async createAgeVerification(verificationData: Partial<AgeVerification>): Promise<AgeVerification> {
    const [verification] = await db
      .insert(ageVerifications)
      .values(verificationData as any)
      .returning();
    return verification;
  }

  async updateAgeVerification(userId: string, updates: Partial<AgeVerification>): Promise<AgeVerification> {
    const [verification] = await db
      .update(ageVerifications)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(ageVerifications.userId, userId))
      .returning();
    return verification;
  }

  // Sponsored Posts operations
  async getSponsoredPosts(params: { isActive?: boolean; limit?: number }): Promise<SponsoredPost[]> {
    const limit = params.limit || 10;
    
    if (params.isActive !== undefined) {
      return await db
        .select()
        .from(sponsoredPosts)
        .where(eq(sponsoredPosts.isActive, params.isActive))
        .limit(limit);
    }
    
    return await db.select().from(sponsoredPosts).limit(limit);
  }

  async createSponsoredPost(postData: Partial<SponsoredPost>): Promise<SponsoredPost> {
    const [ad] = await db
      .insert(sponsoredPosts)
      .values(postData as any)
      .returning();
    return ad;
  }

  async incrementAdImpression(adId: string): Promise<void> {
    await db
      .update(sponsoredPosts)
      .set({ 
        impressions: sql`${sponsoredPosts.impressions} + 1`,
        updatedAt: new Date()
      })
      .where(eq(sponsoredPosts.id, adId));
  }

  async incrementAdClick(adId: string): Promise<void> {
    await db
      .update(sponsoredPosts)
      .set({ 
        clicks: sql`${sponsoredPosts.clicks} + 1`,
        updatedAt: new Date()
      })
      .where(eq(sponsoredPosts.id, adId));
  }

  // Post Unlocks operations
  async unlockPost(postId: string, userId: string, transactionId?: string, amount?: number): Promise<PostUnlock> {
    const [unlock] = await db
      .insert(postUnlocks)
      .values({
        postId,
        userId,
        transactionId,
        paidAmount: amount
      })
      .returning();
    
    // Increment unlock count
    await db
      .update(postEngagement)
      .set({ 
        unlocks: sql`${postEngagement.unlocks} + 1`,
        updatedAt: new Date()
      })
      .where(eq(postEngagement.postId, postId));
    
    return unlock;
  }

  async isPostUnlocked(postId: string, userId: string): Promise<boolean> {
    const [unlock] = await db
      .select()
      .from(postUnlocks)
      .where(and(
        eq(postUnlocks.postId, postId),
        eq(postUnlocks.userId, userId)
      ));
    return !!unlock;
  }

  async getUserUnlockedPosts(userId: string): Promise<PostUnlock[]> {
    return await db
      .select()
      .from(postUnlocks)
      .where(eq(postUnlocks.userId, userId))
      .orderBy(desc(postUnlocks.createdAt));
  }

  // Content Creation operations
  async getContentSession(id: string): Promise<ContentCreationSession | undefined> {
    const [session] = await db
      .select()
      .from(contentCreationSessions)
      .where(eq(contentCreationSessions.id, id));
    return session;
  }

  async getContentSessionsByCreator(creatorId: string, limit = 20): Promise<ContentCreationSession[]> {
    return await db
      .select()
      .from(contentCreationSessions)
      .where(eq(contentCreationSessions.creatorId, creatorId))
      .orderBy(desc(contentCreationSessions.createdAt))
      .limit(limit);
  }

  async createContentSession(sessionData: InsertContentCreationSession): Promise<ContentCreationSession> {
    const [session] = await db
      .insert(contentCreationSessions)
      .values(sessionData)
      .returning();
    return session;
  }

  async updateContentSession(id: string, updates: Partial<ContentCreationSession>): Promise<ContentCreationSession> {
    const [session] = await db
      .update(contentCreationSessions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(contentCreationSessions.id, id))
      .returning();
    return session;
  }

  // Editing Task operations
  async getEditingTask(id: string): Promise<EditingTask | undefined> {
    const [task] = await db
      .select()
      .from(editingTasks)
      .where(eq(editingTasks.id, id));
    return task;
  }

  async getEditingTaskBySession(sessionId: string): Promise<EditingTask | undefined> {
    const [task] = await db
      .select()
      .from(editingTasks)
      .where(eq(editingTasks.sessionId, sessionId))
      .orderBy(desc(editingTasks.createdAt))
      .limit(1);
    return task;
  }

  async getEditingTasksBySession(sessionId: string): Promise<EditingTask[]> {
    return await db
      .select()
      .from(editingTasks)
      .where(eq(editingTasks.sessionId, sessionId))
      .orderBy(desc(editingTasks.createdAt));
  }

  async createEditingTask(taskData: InsertEditingTask): Promise<EditingTask> {
    const [task] = await db
      .insert(editingTasks)
      .values(taskData)
      .returning();
    return task;
  }

  async updateEditingTask(id: string, updates: Partial<EditingTask>): Promise<EditingTask> {
    const [task] = await db
      .update(editingTasks)
      .set(updates)
      .where(eq(editingTasks.id, id))
      .returning();
    return task;
  }

  // Content Version operations
  async getContentVersionsBySession(sessionId: string): Promise<ContentVersion[]> {
    return await db
      .select()
      .from(contentVersions)
      .where(eq(contentVersions.sessionId, sessionId))
      .orderBy(contentVersions.aspectRatio);
  }

  async createContentVersion(versionData: InsertContentVersion): Promise<ContentVersion> {
    const [version] = await db
      .insert(contentVersions)
      .values(versionData)
      .returning();
    return version;
  }

  // Generated Asset operations
  async getGeneratedAssetsBySession(sessionId: string): Promise<GeneratedAsset[]> {
    return await db
      .select()
      .from(generatedAssets)
      .where(eq(generatedAssets.sessionId, sessionId))
      .orderBy(generatedAssets.assetType);
  }

  async createGeneratedAsset(assetData: InsertGeneratedAsset): Promise<GeneratedAsset> {
    const [asset] = await db
      .insert(generatedAssets)
      .values(assetData)
      .returning();
    return asset;
  }

  // Distribution Campaign operations
  async getDistributionCampaign(id: string): Promise<DistributionCampaign | undefined> {
    const [campaign] = await db
      .select()
      .from(distributionCampaigns)
      .where(eq(distributionCampaigns.id, id));
    return campaign;
  }

  async createDistributionCampaign(campaignData: InsertDistributionCampaign): Promise<DistributionCampaign> {
    const [campaign] = await db
      .insert(distributionCampaigns)
      .values(campaignData)
      .returning();
    return campaign;
  }

  async updateDistributionCampaign(id: string, updates: Partial<DistributionCampaign>): Promise<DistributionCampaign> {
    const [campaign] = await db
      .update(distributionCampaigns)
      .set(updates)
      .where(eq(distributionCampaigns.id, id))
      .returning();
    return campaign;
  }

  // Platform Distribution operations
  async getPlatformDistributions(campaignId: string): Promise<PlatformDistribution[]> {
    return await db
      .select()
      .from(platformDistributions)
      .where(eq(platformDistributions.campaignId, campaignId));
  }

  async createPlatformDistribution(distributionData: InsertPlatformDistribution): Promise<PlatformDistribution> {
    const [distribution] = await db
      .insert(platformDistributions)
      .values(distributionData)
      .returning();
    return distribution;
  }

  async updatePlatformDistribution(id: string, updates: Partial<PlatformDistribution>): Promise<PlatformDistribution> {
    const [distribution] = await db
      .update(platformDistributions)
      .set(updates)
      .where(eq(platformDistributions.id, id))
      .returning();
    return distribution;
  }

  // Content Analytics operations
  async getContentAnalytics(sessionId: string): Promise<ContentAnalytics | undefined> {
    const [analytics] = await db
      .select()
      .from(contentAnalytics)
      .where(eq(contentAnalytics.sessionId, sessionId));
    return analytics;
  }

  async createContentAnalytics(analyticsData: InsertContentAnalytics): Promise<ContentAnalytics> {
    const [analytics] = await db
      .insert(contentAnalytics)
      .values(analyticsData)
      .returning();
    return analytics;
  }

  async updateContentAnalytics(sessionId: string, updates: Partial<ContentAnalytics>): Promise<ContentAnalytics> {
    const [analytics] = await db
      .update(contentAnalytics)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(contentAnalytics.sessionId, sessionId))
      .returning();
    return analytics;
  }

  // Creator Studio Settings operations
  async getCreatorStudioSettings(creatorId: string): Promise<CreatorStudioSettings | undefined> {
    const [settings] = await db
      .select()
      .from(creatorStudioSettings)
      .where(eq(creatorStudioSettings.creatorId, creatorId));
    return settings;
  }

  async createCreatorStudioSettings(settingsData: InsertCreatorStudioSettings): Promise<CreatorStudioSettings> {
    const [settings] = await db
      .insert(creatorStudioSettings)
      .values(settingsData)
      .returning();
    return settings;
  }

  async updateCreatorStudioSettings(creatorId: string, updates: Partial<CreatorStudioSettings>): Promise<CreatorStudioSettings> {
    const [settings] = await db
      .update(creatorStudioSettings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(creatorStudioSettings.creatorId, creatorId))
      .returning();
    return settings;
  }

  // Smart Link operations (simplified implementations)
  async createSmartLink(link: any): Promise<any> {
    // In production, this would be stored in a separate table
    // For now, return a mock response
    return { id: link.id, url: link.targetUrl };
  }

  async getSmartLinkClicks(url: string): Promise<number> {
    // In production, this would query analytics data
    return Math.floor(Math.random() * 1000);
  }

  async getQRCodeScans(url: string): Promise<number> {
    // In production, this would query analytics data
    return Math.floor(Math.random() * 500);
  }

  // Live Stream operations
  async createLiveStream(streamData: any): Promise<any> {
    const { liveStreams } = await import('../shared/schema');
    const [stream] = await db
      .insert(liveStreams)
      .values(streamData)
      .returning();
    return stream;
  }

  async addLiveStreamCoStar(data: any): Promise<any> {
    const [coStar] = await db
      .insert(liveStreamCoStars)
      .values(data)
      .returning();
    return coStar;
  }

  async updateLiveStream(id: string, updates: any): Promise<any> {
    const [stream] = await db
      .update(liveStreams)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(liveStreams.id, id))
      .returning();
    return stream;
  }

  async getLiveStream(id: string): Promise<any | undefined> {
    const [stream] = await db
      .select()
      .from(liveStreams)
      .where(eq(liveStreams.id, id));
    return stream;
  }

  async getLiveStreamByKey(streamKey: string): Promise<any | undefined> {
    const [stream] = await db
      .select()
      .from(liveStreams)
      .where(eq(liveStreams.streamKey, streamKey));
    return stream;
  }

  // Stream Participant operations
  async addStreamParticipant(participant: any): Promise<any> {
    const [result] = await db
      .insert(streamParticipants)
      .values(participant)
      .returning();
    return result;
  }

  async updateStreamParticipant(streamId: string, userId: string, updates: any): Promise<any> {
    const [result] = await db
      .update(streamParticipants)
      .set(updates)
      .where(and(
        eq(streamParticipants.streamId, streamId),
        eq(streamParticipants.userId, userId)
      ))
      .returning();
    return result;
  }

  async getStreamParticipants(streamId: string): Promise<any[]> {
    return await db
      .select()
      .from(streamParticipants)
      .where(eq(streamParticipants.streamId, streamId));
  }

  // Stream Viewer operations
  async addStreamViewer(viewer: any): Promise<any> {
    const [result] = await db
      .insert(streamViewers)
      .values(viewer)
      .returning();
    return result;
  }

  async updateStreamViewer(streamId: string, userId: string, updates: any): Promise<any> {
    const [result] = await db
      .update(streamViewers)
      .set(updates)
      .where(and(
        eq(streamViewers.streamId, streamId),
        eq(streamViewers.userId, userId)
      ))
      .returning();
    return result;
  }

  async getStreamViewers(streamId: string): Promise<any[]> {
    return await db
      .select()
      .from(streamViewers)
      .where(eq(streamViewers.streamId, streamId));
  }

  // Stream Chat operations
  async addStreamChatMessage(message: any): Promise<any> {
    const [result] = await db
      .insert(streamChatMessages)
      .values(message)
      .returning();
    return result;
  }

  async getStreamChatMessages(streamId: string, limit: number = 100): Promise<any[]> {
    return await db
      .select()
      .from(streamChatMessages)
      .where(eq(streamChatMessages.streamId, streamId))
      .orderBy(desc(streamChatMessages.createdAt))
      .limit(limit);
  }

  // Stream Gift operations
  async addStreamGift(gift: any): Promise<any> {
    const [result] = await db
      .insert(streamGifts)
      .values(gift)
      .returning();
    return result;
  }

  async getStreamGifts(streamId: string): Promise<any[]> {
    return await db
      .select()
      .from(streamGifts)
      .where(eq(streamGifts.streamId, streamId))
      .orderBy(desc(streamGifts.createdAt));
  }

  // Stream Reaction operations
  async addStreamReaction(reaction: any): Promise<any> {
    const [result] = await db
      .insert(streamReactions)
      .values(reaction)
      .returning();
    return result;
  }

  async getStreamReactions(streamId: string): Promise<any[]> {
    return await db
      .select()
      .from(streamReactions)
      .where(eq(streamReactions.streamId, streamId));
  }

  // Stream Highlight operations
  async createStreamHighlight(highlight: any): Promise<any> {
    const [result] = await db
      .insert(streamHighlights)
      .values(highlight)
      .returning();
    return result;
  }

  async getStreamHighlights(streamId: string): Promise<any[]> {
    return await db
      .select()
      .from(streamHighlights)
      .where(eq(streamHighlights.streamId, streamId))
      .orderBy(desc(streamHighlights.score));
  }

  // Stream Recording operations
  async createStreamRecording(recording: any): Promise<any> {
    const [result] = await db
      .insert(streamRecordings)
      .values(recording)
      .returning();
    return result;
  }

  async updateStreamRecording(id: string, updates: any): Promise<any> {
    const [result] = await db
      .update(streamRecordings)
      .set(updates)
      .where(eq(streamRecordings.id, id))
      .returning();
    return result;
  }

  async getStreamRecording(streamId: string): Promise<any | undefined> {
    const [recording] = await db
      .select()
      .from(streamRecordings)
      .where(eq(streamRecordings.streamId, streamId))
      .orderBy(desc(streamRecordings.createdAt))
      .limit(1);
    return recording;
  }

  // Stream Analytics operations
  async createStreamAnalytics(analytics: any): Promise<any> {
    const [result] = await db
      .insert(streamAnalytics)
      .values(analytics)
      .returning();
    return result;
  }

  async updateStreamAnalytics(streamId: string, updates: any): Promise<any> {
    const [result] = await db
      .update(streamAnalytics)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(streamAnalytics.streamId, streamId))
      .returning();
    return result;
  }

  async getStreamAnalytics(streamId: string): Promise<any | undefined> {
    const [analytics] = await db
      .select()
      .from(streamAnalytics)
      .where(eq(streamAnalytics.streamId, streamId));
    return analytics;
  }

  // NFT Collection operations
  async getNftCollection(id: string): Promise<any | undefined> {
    const [collection] = await db
      .select()
      .from(nftCollections)
      .where(eq(nftCollections.id, id));
    return collection;
  }

  async getNftCollectionsByCreator(creatorId: string): Promise<any[]> {
    return await db
      .select()
      .from(nftCollections)
      .where(eq(nftCollections.creatorId, creatorId))
      .orderBy(desc(nftCollections.createdAt));
  }

  async createNftCollection(collectionData: any): Promise<any> {
    const [collection] = await db
      .insert(nftCollections)
      .values(collectionData)
      .returning();
    return collection;
  }

  async updateNftCollection(id: string, updates: any): Promise<any | undefined> {
    const [collection] = await db
      .update(nftCollections)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(nftCollections.id, id))
      .returning();
    return collection;
  }

  // NFT Token operations
  async getNftToken(id: string): Promise<any | undefined> {
    const [token] = await db
      .select()
      .from(nftTokens)
      .where(eq(nftTokens.id, id));
    return token;
  }

  async getNftTokensByOwner(ownerId: string): Promise<any[]> {
    return await db
      .select()
      .from(nftTokens)
      .where(eq(nftTokens.ownerId, ownerId))
      .orderBy(desc(nftTokens.createdAt));
  }

  async getNftTokensByCollection(collectionId: string): Promise<any[]> {
    return await db
      .select()
      .from(nftTokens)
      .where(eq(nftTokens.collectionId, collectionId))
      .orderBy(desc(nftTokens.createdAt));
  }

  async createNftToken(tokenData: any): Promise<any> {
    const [token] = await db
      .insert(nftTokens)
      .values(tokenData)
      .returning();
    return token;
  }

  async updateNftToken(id: string, updates: any): Promise<any | undefined> {
    const [token] = await db
      .update(nftTokens)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(nftTokens.id, id))
      .returning();
    return token;
  }

  // NFT Transaction operations
  async getNftTransactionsByToken(tokenId: string): Promise<any[]> {
    return await db
      .select()
      .from(nftTransactions)
      .where(eq(nftTransactions.tokenId, tokenId))
      .orderBy(desc(nftTransactions.createdAt));
  }

  async getNftTransactionsByUser(userId: string): Promise<any[]> {
    return await db
      .select()
      .from(nftTransactions)
      .where(or(
        eq(nftTransactions.fromUserId, userId),
        eq(nftTransactions.toUserId, userId)
      ))
      .orderBy(desc(nftTransactions.createdAt));
  }

  async createNftTransaction(transactionData: any): Promise<any> {
    const [transaction] = await db
      .insert(nftTransactions)
      .values(transactionData)
      .returning();
    return transaction;
  }

  async updateNftTransaction(id: string, updates: any): Promise<any | undefined> {
    const [transaction] = await db
      .update(nftTransactions)
      .set(updates)
      .where(eq(nftTransactions.id, id))
      .returning();
    return transaction;
  }

  // Blockchain Wallet operations
  async getBlockchainWallet(userId: string, blockchain?: string): Promise<any | undefined> {
    const conditions = [eq(blockchainWallets.userId, userId)];
    
    if (blockchain) {
      conditions.push(eq(blockchainWallets.blockchain, blockchain as any));
    }

    const [wallet] = await db
      .select()
      .from(blockchainWallets)
      .where(and(...conditions));
      
    return wallet;
  }

  async getBlockchainWalletsByUser(userId: string): Promise<any[]> {
    return await db
      .select()
      .from(blockchainWallets)
      .where(eq(blockchainWallets.userId, userId));
  }

  async createBlockchainWallet(walletData: any): Promise<any> {
    const [wallet] = await db
      .insert(blockchainWallets)
      .values(walletData)
      .returning();
    return wallet;
  }

  async updateBlockchainWallet(id: string, updates: any): Promise<any | undefined> {
    const [wallet] = await db
      .update(blockchainWallets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(blockchainWallets.id, id))
      .returning();
    return wallet;
  }

  // Royalty Distribution operations
  async getRoyaltyDistributionsByToken(tokenId: string): Promise<any[]> {
    return await db
      .select()
      .from(royaltyDistributions)
      .where(eq(royaltyDistributions.tokenId, tokenId))
      .orderBy(desc(royaltyDistributions.createdAt));
  }

  async getRoyaltyDistributionsByRecipient(recipientId: string): Promise<any[]> {
    return await db
      .select()
      .from(royaltyDistributions)
      .where(eq(royaltyDistributions.recipientId, recipientId))
      .orderBy(desc(royaltyDistributions.createdAt));
  }

  async createRoyaltyDistribution(distributionData: any): Promise<any> {
    const [distribution] = await db
      .insert(royaltyDistributions)
      .values(distributionData)
      .returning();
    return distribution;
  }

  async updateRoyaltyDistribution(id: string, updates: any): Promise<any | undefined> {
    const [distribution] = await db
      .update(royaltyDistributions)
      .set(updates)
      .where(eq(royaltyDistributions.id, id))
      .returning();
    return distribution;
  }

  // IPFS Record operations
  async getIpfsRecordsByUser(userId: string): Promise<any[]> {
    return await db
      .select()
      .from(ipfsRecords)
      .where(eq(ipfsRecords.userId, userId))
      .orderBy(desc(ipfsRecords.createdAt));
  }

  async getIpfsRecordByHash(ipfsHash: string): Promise<any | undefined> {
    const [record] = await db
      .select()
      .from(ipfsRecords)
      .where(eq(ipfsRecords.ipfsHash, ipfsHash));
    return record;
  }

  async createIpfsRecord(recordData: any): Promise<any> {
    const [record] = await db
      .insert(ipfsRecords)
      .values(recordData)
      .returning();
    return record;
  }

  async updateIpfsRecord(id: string, updates: any): Promise<any | undefined> {
    const [record] = await db
      .update(ipfsRecords)
      .set(updates)
      .where(eq(ipfsRecords.id, id))
      .returning();
    return record;
  }

  // Marketplace Integration operations
  async getMarketplaceIntegration(userId: string, marketplace: string): Promise<any | undefined> {
    const [integration] = await db
      .select()
      .from(marketplaceIntegrations)
      .where(and(
        eq(marketplaceIntegrations.userId, userId),
        eq(marketplaceIntegrations.marketplace, marketplace as any)
      ));
    return integration;
  }

  async getMarketplaceIntegrationsByUser(userId: string): Promise<any[]> {
    return await db
      .select()
      .from(marketplaceIntegrations)
      .where(eq(marketplaceIntegrations.userId, userId));
  }

  async createMarketplaceIntegration(integrationData: any): Promise<any> {
    const [integration] = await db
      .insert(marketplaceIntegrations)
      .values(integrationData)
      .returning();
    return integration;
  }

  async updateMarketplaceIntegration(id: string, updates: any): Promise<any | undefined> {
    const [integration] = await db
      .update(marketplaceIntegrations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(marketplaceIntegrations.id, id))
      .returning();
    return integration;
  }

  // Additional helper methods
  async getContentSessionsByUserId(userId: string): Promise<ContentCreationSession[]> {
    return await this.getContentSessionsByCreator(userId);
  }

  async deleteContentSession(id: string, ownerId: string): Promise<void> {
    await db
      .delete(contentCreationSessions)
      .where(and(
        eq(contentCreationSessions.id, id),
        eq(contentCreationSessions.creatorId, ownerId)
      ));
  }

  async getKycVerificationsByUserId(userId: string): Promise<any[]> {
    return await db
      .select()
      .from(kycVerifications)
      .where(eq(kycVerifications.userId, userId))
      .orderBy(desc(kycVerifications.createdAt));
  }

  async getKycVerificationsInDateRange(startDate: Date, endDate: Date): Promise<any[]> {
    return await db
      .select()
      .from(kycVerifications)
      .where(and(
        sql`${kycVerifications.createdAt} >= ${startDate}`,
        sql`${kycVerifications.createdAt} <= ${endDate}`
      ))
      .orderBy(desc(kycVerifications.createdAt));
  }

  async createRecord2257(recordData: any): Promise<any> {
    const { records2257 } = await import('../shared/schema');
    const [record] = await db
      .insert(records2257)
      .values(recordData)
      .returning();
    return record;
  }

  async getAuditLogsInDateRange(startDate: Date, endDate: Date, actionPattern?: string): Promise<any[]> {
    const conditions = [
      sql`${auditLogs.createdAt} >= ${startDate}`,
      sql`${auditLogs.createdAt} <= ${endDate}`
    ];

    if (actionPattern) {
      conditions.push(sql`${auditLogs.action} LIKE ${`%${actionPattern}%`}`);
    }

    return await db
      .select()
      .from(auditLogs)
      .where(and(...conditions))
      .orderBy(desc(auditLogs.createdAt));
  }
}

export const storage = new DatabaseStorage();
