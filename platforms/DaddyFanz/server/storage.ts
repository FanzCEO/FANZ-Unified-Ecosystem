import {
  users,
  profiles,
  mediaAssets,
  moderationQueue,
  payoutAccounts,
  payoutRequests,
  messages,
  subscriptions,
  auditLogs,
  tickets,
  transactions,
  refundRequests,
  trustScores,
  fanzWallets,
  fanzCards,
  paymentMethods,
  posts,
  postLikes,
  postComments,
  follows,
  storyMoments,
  storyViews,
  fanLevels,
  creatorAnalytics,
  liveStreams,
  streamViewers,
  streamChat,
  streamTips,
  collaborations,
  subscriptionTiers,
  contentBundles,
  virtualGifts,
  giftsSent,
  leaderboards,
  referralCodes,
  referrals,
  scheduledPosts,
  creatorBadges,
  contentWatermarks,
  geoBlockingRules,
  contentTags,
  postTags,
  dmcaClaims,
  twoFactorAuth,
  pushSubscriptions,
  onboardingProgress,
  contentNiches,
  userInterests,
  passwordResetTokens,
  emailRecoveryTokens,
  emailVerificationTokens,
  nftContracts,
  nftMints,
  onchainRoyalties,
  loanPrograms,
  loanApplications,
  loanOffers,
  loanRepayments,
  loanEscrowAccounts,
  aiScanJobs,
  aiScanResults,
  contentFingerprints,
  type User,
  type UpsertUser,
  type InsertUser,
  type InsertNftContract,
  type InsertNftMint,
  type InsertOnchainRoyalty,
  type Profile,
  type InsertProfile,
  type OnboardingProgress,
  type InsertOnboardingProgress,
  type ContentNiche,
  type InsertContentNiche,
  type UserInterest,
  type InsertUserInterest,
  type Collaboration,
  type InsertCollaboration,
  type SubscriptionTier,
  type InsertSubscriptionTier,
  type ContentBundle,
  type InsertContentBundle,
  type VirtualGift,
  type GiftSent,
  type InsertGiftSent,
  type ScheduledPost,
  type InsertScheduledPost,
  type CreatorBadge,
  type InsertCreatorBadge,
  type GeoBlockingRule,
  type InsertGeoBlockingRule,
  type DmcaClaim,
  type InsertDmcaClaim,
  type Leaderboard,
  type ReferralCode,
  type Referral,
  type MediaAsset,
  type InsertMediaAsset,
  type ModerationItem,
  type PayoutAccount,
  type InsertPayoutAccount,
  type Message,
  type InsertMessage,
  type PayoutRequest,
  type Subscription,
  type Ticket,
  type InsertTicket,
  type Transaction,
  type InsertTransaction,
  type RefundRequest,
  type InsertRefundRequest,
  type TrustScore,
  type InsertTrustScore,
  type FanzWallet,
  type InsertFanzWallet,
  type FanzCard,
  type InsertFanzCard,
  type PaymentMethod,
  type InsertPaymentMethod,
  type Post,
  type InsertPost,
  type PostLike,
  type InsertPostLike,
  type PostComment,
  type InsertPostComment,
  type Follow,
  type InsertFollow,
  type StoryMoment,
  type InsertStoryMoment,
  type StoryView,
  type InsertStoryView,
  type FanLevel,
  type InsertFanLevel,
  type CreatorAnalytics,
  type InsertCreatorAnalytics,
  type LiveStream,
  type InsertLiveStream,
  type StreamViewer,
  type InsertStreamViewer,
  type StreamChat,
  type InsertStreamChat,
  type StreamTip,
  type InsertStreamTip,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, inArray, gt, lt, sql as sqlOperator } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<void>;

  // Password reset token operations
  createPasswordResetToken(token: { userId: string; token: string; expiresAt: Date }): Promise<void>;
  invalidatePreviousPasswordResetTokens(userId: string): Promise<void>;
  redeemPasswordResetToken(tokenHash: string): Promise<{ userId: string } | undefined>;

  // Email recovery token operations
  createEmailRecoveryToken(token: { userId: string; token: string; expiresAt: Date }): Promise<void>;
  invalidatePreviousEmailRecoveryTokens(userId: string): Promise<void>;

  // Profile operations
  getProfile(userId: string): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile>;

  // Media operations
  createMediaAsset(asset: InsertMediaAsset): Promise<MediaAsset>;
  getMediaAssets(ownerId: string): Promise<MediaAsset[]>;
  getMediaAsset(id: string): Promise<MediaAsset | undefined>;
  updateMediaAsset(id: string, updates: Partial<MediaAsset>): Promise<MediaAsset>;

  // Moderation operations
  getModerationQueue(): Promise<ModerationItem[]>;
  updateModerationItem(id: string, updates: Partial<ModerationItem>): Promise<ModerationItem>;

  // Payment operations
  createPayoutAccount(account: InsertPayoutAccount): Promise<PayoutAccount>;
  getPayoutAccounts(userId: string): Promise<PayoutAccount[]>;
  createPayoutRequest(request: Omit<PayoutRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<PayoutRequest>;

  // Messaging operations
  createMessage(message: InsertMessage): Promise<Message>;
  getMessages(userId1: string, userId2: string): Promise<Message[]>;
  markMessageAsRead(id: string): Promise<void>;

  // Subscription operations
  getSubscriptions(fanId: string): Promise<Subscription[]>;
  getCreatorSubscriptions(creatorId: string): Promise<Subscription[]>;

  // Audit operations
  createAuditLog(log: Omit<typeof auditLogs.$inferInsert, 'id' | 'timestamp'>): Promise<void>;

  // Support ticket operations
  getSupportTickets(userId: string): Promise<Ticket[]>;
  createSupportTicket(ticket: InsertTicket): Promise<Ticket>;
  updateSupportTicket(id: string, userId: string, updates: Partial<Ticket>): Promise<Ticket | null>;

  // FanzTrust™ Transaction operations
  findTransaction(criteria: Partial<Transaction>): Promise<Transaction | undefined>;
  getTransaction(id: string): Promise<Transaction | undefined>;
  getFanTransactions(fanId: string): Promise<Transaction[]>;
  getCreatorTransactions(creatorId: string): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;

  // FanzTrust™ Refund operations
  findRefundRequest(transactionId: string): Promise<RefundRequest | undefined>;
  getRefundRequest(id: string): Promise<RefundRequest | undefined>;
  getAllRefundRequests(): Promise<RefundRequest[]>;
  getFanRefundRequests(fanId: string): Promise<RefundRequest[]>;
  getCreatorRefundRequests(creatorId: string): Promise<RefundRequest[]>;
  createRefundRequest(request: InsertRefundRequest): Promise<RefundRequest>;
  updateRefundRequest(id: string, updates: Partial<RefundRequest>): Promise<RefundRequest>;
  performAutoRefundCheck(transaction: Transaction, context: any): Promise<any>;

  // FanzTrust™ Trust Score operations
  getTrustScore(userId: string): Promise<TrustScore | undefined>;
  createTrustScore(trustScore: InsertTrustScore): Promise<TrustScore>;
  updateTrustScore(userId: string, updates: Partial<TrustScore>): Promise<TrustScore>;

  // FanzPay Wallet operations
  getFanzWallet(userId: string): Promise<FanzWallet | undefined>;
  createFanzWallet(wallet: InsertFanzWallet): Promise<FanzWallet>;
  updateFanzWallet(userId: string, updates: Partial<FanzWallet>): Promise<FanzWallet>;

  // FanzCard operations
  getFanzCards(userId: string): Promise<FanzCard[]>;
  createFanzCard(card: InsertFanzCard): Promise<FanzCard>;

  // Payment Method operations
  getPaymentMethods(userId: string): Promise<PaymentMethod[]>;
  createPaymentMethod(method: InsertPaymentMethod): Promise<PaymentMethod>;

  // Feed operations (Infinity Scroll)
  getPosts(options: { page: number; limit: number; userId?: string }): Promise<Post[]>;
  getPostById(id: string): Promise<Post | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: string, updates: Partial<Post>): Promise<Post>;
  
  // Post Like operations
  togglePostLike(userId: string, postId: string): Promise<{ liked: boolean }>;
  isPostLikedByUser(userId: string, postId: string): Promise<boolean>;
  
  // Post Comment operations
  addComment(userId: string, postId: string, text: string): Promise<PostComment>;
  getPostComments(postId: string): Promise<PostComment[]>;
  
  // Follow operations
  followCreator(fanId: string, creatorId: string): Promise<Follow>;
  unfollowCreator(fanId: string, creatorId: string): Promise<void>;
  getFollowing(fanId: string): Promise<Follow[]>;
  isFollowing(fanId: string, creatorId: string): Promise<boolean>;

  // Story Moment operations
  getActiveStories(userId?: string): Promise<StoryMoment[]>;
  getCreatorStories(creatorId: string): Promise<StoryMoment[]>;
  createStory(story: InsertStoryMoment): Promise<StoryMoment>;
  viewStory(storyId: string, viewerId: string): Promise<void>;
  getStoryViews(storyId: string): Promise<StoryView[]>;
  deleteExpiredStories(): Promise<void>;

  // Fan Level & Gamification operations
  getFanLevel(userId: string): Promise<FanLevel | undefined>;
  createFanLevel(fanLevel: InsertFanLevel): Promise<FanLevel>;
  updateFanLevel(userId: string, updates: Partial<FanLevel>): Promise<FanLevel>;
  addXP(userId: string, xpAmount: number, reason: string): Promise<FanLevel>;
  updateStreak(userId: string): Promise<FanLevel>;

  // Creator Analytics operations
  getCreatorAnalytics(creatorId: string, period: "daily" | "weekly" | "monthly", limit?: number): Promise<CreatorAnalytics[]>;
  getCurrentAnalytics(creatorId: string): Promise<any>; // Real-time current period stats
  aggregateAnalytics(creatorId: string, period: "daily" | "weekly" | "monthly", startDate: Date, endDate: Date): Promise<CreatorAnalytics>;
  recordView(postId: string, viewerId?: string): Promise<void>;
  recordLike(postId: string, viewerId: string): Promise<void>;
  recordComment(postId: string, viewerId: string): Promise<void>;

  // Live Streaming operations
  createStream(stream: InsertLiveStream): Promise<LiveStream>;
  getStream(streamId: string): Promise<LiveStream | undefined>;
  getCreatorStreams(creatorId: string, status?: "scheduled" | "live" | "ended" | "archived"): Promise<LiveStream[]>;
  getLiveStreams(limit?: number): Promise<LiveStream[]>; // Get all currently live streams
  updateStream(streamId: string, updates: Partial<LiveStream>): Promise<LiveStream>;
  startStream(streamId: string): Promise<LiveStream>;
  endStream(streamId: string): Promise<LiveStream>;
  joinStream(streamId: string, viewerId: string): Promise<void>;
  leaveStream(streamId: string, viewerId: string): Promise<void>;
  getStreamViewers(streamId: string): Promise<StreamViewer[]>;
  sendStreamChat(streamId: string, userId: string, message: string): Promise<StreamChat>;
  getStreamChat(streamId: string, limit?: number): Promise<StreamChat[]>;
  sendStreamTip(tip: InsertStreamTip): Promise<StreamTip>;
  getStreamTips(streamId: string): Promise<StreamTip[]>;

  // Collaboration operations
  createCollaboration(collab: InsertCollaboration): Promise<Collaboration>;
  respondToCollaboration(collabId: string, accept: boolean): Promise<Collaboration>;
  getCollaborations(userId: string): Promise<Collaboration[]>;

  // Subscription Tier operations
  createSubscriptionTier(tier: InsertSubscriptionTier): Promise<SubscriptionTier>;
  getCreatorTiers(creatorId: string): Promise<SubscriptionTier[]>;
  updateSubscriptionTier(tierId: string, updates: Partial<SubscriptionTier>): Promise<SubscriptionTier>;

  // Content Bundle operations
  createContentBundle(bundle: InsertContentBundle): Promise<ContentBundle>;
  getCreatorBundles(creatorId: string): Promise<ContentBundle[]>;
  purchaseBundle(bundleId: string, userId: string): Promise<{ success: boolean }>;

  // Virtual Gift operations
  getVirtualGifts(): Promise<VirtualGift[]>;
  sendGift(gift: InsertGiftSent): Promise<GiftSent>;
  getGiftsReceived(creatorId: string): Promise<GiftSent[]>;

  // Leaderboard operations
  updateLeaderboards(period: string): Promise<void>;
  getLeaderboard(period: string, category: string, limit?: number): Promise<Leaderboard[]>;

  // Referral operations
  createReferralCode(userId: string): Promise<ReferralCode>;
  getReferralCode(userId: string): Promise<ReferralCode | undefined>;
  processReferral(code: string, newUserId: string): Promise<Referral>;

  // Scheduled Post operations
  createScheduledPost(post: InsertScheduledPost): Promise<ScheduledPost>;
  getScheduledPosts(creatorId: string): Promise<ScheduledPost[]>;
  publishScheduledPosts(): Promise<void>;

  // Creator Badge operations
  assignBadge(userId: string, badgeType: string): Promise<CreatorBadge>;
  getUserBadges(userId: string): Promise<CreatorBadge[]>;

  // Geo-blocking operations
  createGeoBlockingRule(rule: InsertGeoBlockingRule): Promise<GeoBlockingRule>;
  getGeoBlockingRules(creatorId: string): Promise<GeoBlockingRule[]>;
  checkGeoAccess(creatorId: string, countryCode: string): Promise<boolean>;

  // Search & Tag operations
  searchContent(query: any): Promise<any[]>;
  addTagsToPost(postId: string, tagIds: string[]): Promise<void>;

  // DMCA operations
  createDmcaClaim(claim: InsertDmcaClaim): Promise<DmcaClaim>;
  getDmcaClaims(status?: string): Promise<DmcaClaim[]>;
  reviewDmcaClaim(claimId: string, approved: boolean, reviewerId: string): Promise<DmcaClaim>;

  // Onboarding operations
  getOnboardingProgress(userId: string): Promise<OnboardingProgress | undefined>;
  createOnboardingProgress(userId: string): Promise<OnboardingProgress>;
  updateOnboardingProgress(userId: string, updates: Partial<OnboardingProgress>): Promise<OnboardingProgress>;
  
  // Content Niche operations
  getContentNiches(): Promise<ContentNiche[]>;
  createContentNiche(niche: InsertContentNiche): Promise<ContentNiche>;
  
  // User Interest operations
  getUserInterests(userId: string): Promise<UserInterest[]>;
  setUserInterests(userId: string, nicheIds: string[]): Promise<void>;
  
  // Profile operations
  updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile>;

  // NFT operations
  deployNftContract(contract: InsertNftContract): Promise<any>;
  getNftContractsByCreator(creatorId: string): Promise<any[]>;
  mintNft(mint: any, creatorId: string): Promise<any>;
  getNftMintsByContract(contractId: string, userId: string): Promise<any[]>;
  recordNftRoyalty(royalty: any, creatorId: string): Promise<any>;
  getNftRoyaltiesByCreator(creatorId: string): Promise<any[]>;
  getNftRoyaltyStats(creatorId: string): Promise<any>;
  getMarketplaceNfts(): Promise<any[]>;
  getNftMintById(nftId: string): Promise<any>;
  purchaseNft(nftId: string, buyerId: string): Promise<any>;

  // Loan operations
  createLoanProgram(program: any): Promise<any>;
  getLoanPrograms(): Promise<any[]>;
  createLoanApplication(application: any): Promise<any>;
  getLoanApplicationsByCreator(creatorId: string): Promise<any[]>;
  createLoanOffer(offer: any): Promise<any>;
  getLoanOffersByLender(lenderId: string): Promise<any[]>;
  acceptLoanOffer(offerId: string, creatorId: string): Promise<any>;
  getLoanRepaymentsByOffer(offerId: string, userId: string): Promise<any[]>;
  payLoanRepayment(repaymentId: string, amount: number, creatorId: string): Promise<any>;

  // AI Moderation operations
  createAiScanJob(job: any): Promise<any>;
  getAiScanJobsByMedia(mediaId: string, userId: string): Promise<any[]>;
  getAiScanQueue(): Promise<any[]>;
  getAiScanResults(jobId: string, userId: string): Promise<any>;
  getAiScanResultsByMedia(mediaId: string, userId: string): Promise<any[]>;
  reviewAiScanResult(id: string, review: any, userId: string): Promise<any>;
  createContentFingerprint(fingerprint: any): Promise<any>;
  getContentFingerprint(mediaId: string, userId: string): Promise<any>;
  verifyContentFingerprint(id: string, verification: any, userId: string): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // Check if user exists by email first
    const existingUser = await this.getUserByEmail(userData.email!);
    
    if (existingUser) {
      // Update existing user with new data
      const updatedUser = await db
        .update(users)
        .set({ 
          ...userData, 
          updatedAt: new Date() 
        })
        .where(eq(users.email, userData.email!))
        .returning();
      return updatedUser[0];
    } else {
      // Create new user
      const newUser = await db
        .insert(users)
        .values(userData)
        .returning();
      return newUser[0];
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    await db
      .update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  // Password reset token operations
  async createPasswordResetToken(token: { userId: string; token: string; expiresAt: Date }): Promise<void> {
    await db.insert(passwordResetTokens).values(token);
  }

  async invalidatePreviousPasswordResetTokens(userId: string): Promise<void> {
    // Invalidate all outstanding (unused) tokens for this user
    await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(
        and(
          eq(passwordResetTokens.userId, userId),
          sqlOperator`${passwordResetTokens.usedAt} IS NULL`
        )
      );
  }

  async redeemPasswordResetToken(tokenHash: string): Promise<{ userId: string } | undefined> {
    // Atomically redeem the token: update and return in one operation
    // This prevents race conditions where multiple requests could use the same token
    const [result] = await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(
        and(
          eq(passwordResetTokens.token, tokenHash),
          sqlOperator`${passwordResetTokens.usedAt} IS NULL`,
          gt(passwordResetTokens.expiresAt, new Date())
        )
      )
      .returning({ userId: passwordResetTokens.userId });
    
    return result;
  }

  // Email recovery token operations
  async createEmailRecoveryToken(token: { userId: string; token: string; expiresAt: Date }): Promise<void> {
    await db.insert(emailRecoveryTokens).values(token);
  }

  async invalidatePreviousEmailRecoveryTokens(userId: string): Promise<void> {
    // Invalidate all outstanding (unused) tokens for this user
    await db
      .update(emailRecoveryTokens)
      .set({ usedAt: new Date() })
      .where(
        and(
          eq(emailRecoveryTokens.userId, userId),
          sqlOperator`${emailRecoveryTokens.usedAt} IS NULL`
        )
      );
  }

  // Profile operations
  async getProfile(userId: string): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    return profile;
  }

  async createProfile(profileData: InsertProfile): Promise<Profile> {
    const [profile] = await db.insert(profiles).values(profileData).returning();
    return profile;
  }

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
    const [profile] = await db
      .update(profiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(profiles.userId, userId))
      .returning();
    return profile;
  }

  // Media operations
  async createMediaAsset(assetData: InsertMediaAsset): Promise<MediaAsset> {
    const [asset] = await db.insert(mediaAssets).values(assetData).returning();
    return asset;
  }

  async getMediaAssets(ownerId: string): Promise<MediaAsset[]> {
    return await db
      .select()
      .from(mediaAssets)
      .where(eq(mediaAssets.ownerId, ownerId))
      .orderBy(desc(mediaAssets.createdAt));
  }

  async getMediaAsset(id: string): Promise<MediaAsset | undefined> {
    const [asset] = await db.select().from(mediaAssets).where(eq(mediaAssets.id, id));
    return asset;
  }

  async updateMediaAsset(id: string, updates: Partial<MediaAsset>): Promise<MediaAsset> {
    const [asset] = await db
      .update(mediaAssets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(mediaAssets.id, id))
      .returning();
    return asset;
  }

  // Moderation operations
  async getModerationQueue(): Promise<ModerationItem[]> {
    return await db
      .select()
      .from(moderationQueue)
      .orderBy(desc(moderationQueue.priority), desc(moderationQueue.createdAt));
  }

  async updateModerationItem(id: string, updates: Partial<ModerationItem>): Promise<ModerationItem> {
    const [item] = await db
      .update(moderationQueue)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(moderationQueue.id, id))
      .returning();
    return item;
  }

  // Payment operations
  async createPayoutAccount(accountData: InsertPayoutAccount): Promise<PayoutAccount> {
    const [account] = await db.insert(payoutAccounts).values(accountData).returning();
    return account;
  }

  async getPayoutAccounts(userId: string): Promise<PayoutAccount[]> {
    return await db
      .select()
      .from(payoutAccounts)
      .where(eq(payoutAccounts.userId, userId));
  }

  async createPayoutRequest(requestData: Omit<PayoutRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<PayoutRequest> {
    const [request] = await db.insert(payoutRequests).values(requestData).returning();
    return request;
  }

  // Messaging operations
  async createMessage(messageData: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(messageData).returning();
    return message;
  }

  async getMessages(userId1: string, userId2: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(
        or(
          and(eq(messages.senderId, userId1), eq(messages.recipientId, userId2)),
          and(eq(messages.senderId, userId2), eq(messages.recipientId, userId1))
        )
      )
      .orderBy(desc(messages.createdAt));
  }

  async markMessageAsRead(id: string): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, id));
  }

  // Subscription operations
  async getSubscriptions(fanId: string): Promise<Subscription[]> {
    return await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.fanId, fanId));
  }

  async getCreatorSubscriptions(creatorId: string): Promise<Subscription[]> {
    return await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.creatorId, creatorId));
  }

  // Audit operations
  async createAuditLog(logData: Omit<typeof auditLogs.$inferInsert, 'id' | 'timestamp'>): Promise<void> {
    await db.insert(auditLogs).values(logData);
  }

  // Support ticket operations
  async getSupportTickets(userId: string): Promise<Ticket[]> {
    return await db
      .select()
      .from(tickets)
      .where(eq(tickets.userId, userId))
      .orderBy(desc(tickets.createdAt));
  }

  async createSupportTicket(ticketData: InsertTicket): Promise<Ticket> {
    const [ticket] = await db.insert(tickets).values(ticketData).returning();
    return ticket;
  }

  async updateSupportTicket(id: string, userId: string, updates: Partial<Ticket>): Promise<Ticket | null> {
    // Verify the ticket belongs to the user
    const existingTicket = await db
      .select()
      .from(tickets)
      .where(and(eq(tickets.id, parseInt(id)), eq(tickets.userId, userId)))
      .limit(1);

    if (existingTicket.length === 0) {
      return null;
    }

    const [updatedTicket] = await db
      .update(tickets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tickets.id, parseInt(id)))
      .returning();

    return updatedTicket;
  }

  // FanzTrust™ Transaction operations
  async findTransaction(criteria: Partial<Transaction>): Promise<Transaction | undefined> {
    const conditions = [];
    if (criteria.fanId) conditions.push(eq(transactions.fanId, criteria.fanId));
    if (criteria.creatorId) conditions.push(eq(transactions.creatorId, criteria.creatorId));
    if (criteria.gateway) conditions.push(eq(transactions.gateway, criteria.gateway));
    if (criteria.txid) conditions.push(eq(transactions.txid, criteria.txid));
    if (criteria.walletAddress) conditions.push(eq(transactions.walletAddress, criteria.walletAddress));

    const [transaction] = await db
      .select()
      .from(transactions)
      .where(and(...conditions))
      .limit(1);

    return transaction;
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id))
      .limit(1);
    return transaction;
  }

  async getFanTransactions(fanId: string): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.fanId, fanId))
      .orderBy(desc(transactions.createdAt));
  }

  async getCreatorTransactions(creatorId: string): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.creatorId, creatorId))
      .orderBy(desc(transactions.createdAt));
  }

  async createTransaction(transactionData: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db.insert(transactions).values(transactionData).returning();
    return transaction;
  }

  // FanzTrust™ Refund operations
  async findRefundRequest(transactionId: string): Promise<RefundRequest | undefined> {
    const [refund] = await db
      .select()
      .from(refundRequests)
      .where(eq(refundRequests.transactionId, transactionId))
      .limit(1);
    return refund;
  }

  async getRefundRequest(id: string): Promise<RefundRequest | undefined> {
    const [refund] = await db
      .select()
      .from(refundRequests)
      .where(eq(refundRequests.id, id))
      .limit(1);
    return refund;
  }

  async getAllRefundRequests(): Promise<RefundRequest[]> {
    return await db
      .select()
      .from(refundRequests)
      .orderBy(desc(refundRequests.createdAt));
  }

  async getFanRefundRequests(fanId: string): Promise<RefundRequest[]> {
    return await db
      .select()
      .from(refundRequests)
      .where(eq(refundRequests.fanId, fanId))
      .orderBy(desc(refundRequests.createdAt));
  }

  async getCreatorRefundRequests(creatorId: string): Promise<RefundRequest[]> {
    return await db
      .select()
      .from(refundRequests)
      .where(eq(refundRequests.creatorId, creatorId))
      .orderBy(desc(refundRequests.createdAt));
  }

  async createRefundRequest(requestData: InsertRefundRequest): Promise<RefundRequest> {
    const [refund] = await db.insert(refundRequests).values(requestData).returning();
    return refund;
  }

  async updateRefundRequest(id: string, updates: Partial<RefundRequest>): Promise<RefundRequest> {
    const [refund] = await db
      .update(refundRequests)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(refundRequests.id, id))
      .returning();
    return refund;
  }

  async performAutoRefundCheck(transaction: Transaction, context: any): Promise<any> {
    // Auto-refund logic based on FanzTrust spec
    const createdTime = transaction.createdAt ? new Date(transaction.createdAt).getTime() : Date.now();
    const hoursSincePurchase = (Date.now() - createdTime) / (1000 * 60 * 60);
    const sameIP = transaction.ipAddress === context.ipAddress;
    const sameDevice = transaction.deviceFingerprint === context.deviceFingerprint;

    const autoApprove = hoursSincePurchase < 1 && sameIP && sameDevice;

    return {
      autoApprove,
      hoursSincePurchase,
      sameIP,
      sameDevice,
      flags: !autoApprove ? ['manual_review_required'] : [],
    };
  }

  // FanzTrust™ Trust Score operations
  async getTrustScore(userId: string): Promise<TrustScore | undefined> {
    const [score] = await db
      .select()
      .from(trustScores)
      .where(eq(trustScores.userId, userId))
      .limit(1);
    return score;
  }

  async createTrustScore(scoreData: InsertTrustScore): Promise<TrustScore> {
    const [score] = await db.insert(trustScores).values(scoreData).returning();
    return score;
  }

  async updateTrustScore(userId: string, updates: Partial<TrustScore>): Promise<TrustScore> {
    // Get current trust score
    const current = await this.getTrustScore(userId);
    
    if (!current) {
      // Create if doesn't exist
      return await this.createTrustScore({ userId, ...updates });
    }

    // Increment counters instead of replacing
    const incrementedUpdates: any = { ...updates, updatedAt: new Date() };
    if (updates.refundAttempts) incrementedUpdates.refundAttempts = (current.refundAttempts || 0) + updates.refundAttempts;
    if (updates.approvedRefunds) incrementedUpdates.approvedRefunds = (current.approvedRefunds || 0) + updates.approvedRefunds;
    if (updates.deniedRefunds) incrementedUpdates.deniedRefunds = (current.deniedRefunds || 0) + updates.deniedRefunds;
    
    // Calculate new score based on metrics
    const totalRefunds = (current.refundAttempts || 0) + (updates.refundAttempts || 0);
    const approved = (current.approvedRefunds || 0) + (updates.approvedRefunds || 0);
    const denied = (current.deniedRefunds || 0) + (updates.deniedRefunds || 0);
    
    let newScore = current.score || 100;
    if (approved > 0) newScore += 10; // Boost for legitimate refunds
    if (denied > 0) newScore -= 25; // Penalty for false claims
    newScore = Math.max(0, Math.min(1000, newScore)); // Clamp 0-1000
    
    incrementedUpdates.score = newScore;

    const [score] = await db
      .update(trustScores)
      .set(incrementedUpdates)
      .where(eq(trustScores.userId, userId))
      .returning();
    return score;
  }

  // FanzPay Wallet operations
  async getFanzWallet(userId: string): Promise<FanzWallet | undefined> {
    const [wallet] = await db
      .select()
      .from(fanzWallets)
      .where(eq(fanzWallets.userId, userId))
      .limit(1);
    return wallet;
  }

  async createFanzWallet(walletData: InsertFanzWallet): Promise<FanzWallet> {
    const [wallet] = await db.insert(fanzWallets).values(walletData).returning();
    return wallet;
  }

  async updateFanzWallet(userId: string, updates: Partial<FanzWallet>): Promise<FanzWallet> {
    const [wallet] = await db
      .update(fanzWallets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(fanzWallets.userId, userId))
      .returning();
    return wallet;
  }

  // FanzCard operations
  async getFanzCards(userId: string): Promise<FanzCard[]> {
    return await db
      .select()
      .from(fanzCards)
      .where(eq(fanzCards.userId, userId))
      .orderBy(desc(fanzCards.createdAt));
  }

  async createFanzCard(cardData: InsertFanzCard): Promise<FanzCard> {
    const [card] = await db.insert(fanzCards).values(cardData).returning();
    return card;
  }

  // Payment Method operations
  async getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    return await db
      .select()
      .from(paymentMethods)
      .where(eq(paymentMethods.userId, userId))
      .orderBy(desc(paymentMethods.createdAt));
  }

  async createPaymentMethod(methodData: InsertPaymentMethod): Promise<PaymentMethod> {
    const [method] = await db.insert(paymentMethods).values(methodData).returning();
    return method;
  }

  // Feed operations (Infinity Scroll)
  async getPosts(options: { page: number; limit: number; userId?: string }): Promise<Post[]> {
    const offset = (options.page - 1) * options.limit;
    
    if (options.userId) {
      // Authenticated user: get personalized feed
      // Get user's subscribed creators
      const userSubs = await db
        .select({ creatorId: subscriptions.creatorId })
        .from(subscriptions)
        .where(and(
          eq(subscriptions.fanId, options.userId),
          eq(subscriptions.status, 'active')
        ));
      
      const subscribedCreatorIds = userSubs.map(s => s.creatorId);
      
      // Get user's followed creators
      const userFollows = await db
        .select({ creatorId: follows.creatorId })
        .from(follows)
        .where(eq(follows.fanId, options.userId));
      
      const followedCreatorIds = userFollows.map(f => f.creatorId);
      
      // Combine all creator IDs
      const relevantCreatorIds = [...new Set([...subscribedCreatorIds, ...followedCreatorIds])];
      
      let feedCondition;
      if (relevantCreatorIds.length > 0) {
        feedCondition = or(
          // Posts from subscribed/followed creators
          inArray(posts.creatorId, relevantCreatorIds),
          // Free posts from age-verified creators
          and(
            eq(posts.isFree, true),
            eq(posts.creatorAllowsFree, true),
            eq(posts.creatorIsAgeVerified, true)
          )
        );
      } else {
        // No subscriptions/follows, only show free posts
        feedCondition = and(
          eq(posts.isFree, true),
          eq(posts.creatorAllowsFree, true),
          eq(posts.creatorIsAgeVerified, true)
        );
      }
      
      return await db
        .select()
        .from(posts)
        .where(feedCondition)
        .orderBy(desc(posts.createdAt))
        .limit(options.limit)
        .offset(offset);
    } else {
      // Unauthenticated user: only free posts
      return await db
        .select()
        .from(posts)
        .where(and(
          eq(posts.isFree, true),
          eq(posts.creatorAllowsFree, true),
          eq(posts.creatorIsAgeVerified, true)
        ))
        .orderBy(desc(posts.createdAt))
        .limit(options.limit)
        .offset(offset);
    }
  }

  async getPostById(id: string): Promise<Post | undefined> {
    const [post] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, id))
      .limit(1);
    return post;
  }

  async createPost(postData: InsertPost): Promise<Post> {
    const [post] = await db.insert(posts).values(postData).returning();
    return post;
  }

  async updatePost(id: string, updates: Partial<Post>): Promise<Post> {
    const [post] = await db
      .update(posts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(posts.id, id))
      .returning();
    return post;
  }

  // Post Like operations
  async togglePostLike(userId: string, postId: string): Promise<{ liked: boolean }> {
    // Check if already liked
    const [existing] = await db
      .select()
      .from(postLikes)
      .where(and(
        eq(postLikes.userId, userId),
        eq(postLikes.postId, postId)
      ))
      .limit(1);

    if (existing) {
      // Unlike
      await db
        .delete(postLikes)
        .where(and(
          eq(postLikes.userId, userId),
          eq(postLikes.postId, postId)
        ));
      // Decrement like count
      await db
        .update(posts)
        .set({ likeCount: sqlOperator`${posts.likeCount} - 1` })
        .where(eq(posts.id, postId));
      return { liked: false };
    } else {
      // Like
      await db.insert(postLikes).values({ userId, postId });
      // Increment like count
      await db
        .update(posts)
        .set({ likeCount: sqlOperator`${posts.likeCount} + 1` })
        .where(eq(posts.id, postId));
      return { liked: true };
    }
  }

  async isPostLikedByUser(userId: string, postId: string): Promise<boolean> {
    const [like] = await db
      .select()
      .from(postLikes)
      .where(and(
        eq(postLikes.userId, userId),
        eq(postLikes.postId, postId)
      ))
      .limit(1);
    return !!like;
  }

  // Post Comment operations
  async addComment(userId: string, postId: string, text: string): Promise<PostComment> {
    const [comment] = await db
      .insert(postComments)
      .values({ userId, postId, text })
      .returning();
    // Increment comment count
    await db
      .update(posts)
      .set({ commentCount: sqlOperator`${posts.commentCount} + 1` })
      .where(eq(posts.id, postId));
    return comment;
  }

  async getPostComments(postId: string): Promise<PostComment[]> {
    return await db
      .select()
      .from(postComments)
      .where(eq(postComments.postId, postId))
      .orderBy(desc(postComments.createdAt));
  }

  // Follow operations
  async followCreator(fanId: string, creatorId: string): Promise<Follow> {
    const [follow] = await db.insert(follows).values({ fanId, creatorId }).returning();
    return follow;
  }

  async unfollowCreator(fanId: string, creatorId: string): Promise<void> {
    await db
      .delete(follows)
      .where(and(
        eq(follows.fanId, fanId),
        eq(follows.creatorId, creatorId)
      ));
  }

  async getFollowing(fanId: string): Promise<Follow[]> {
    return await db
      .select()
      .from(follows)
      .where(eq(follows.fanId, fanId))
      .orderBy(desc(follows.createdAt));
  }

  async isFollowing(fanId: string, creatorId: string): Promise<boolean> {
    const [follow] = await db
      .select()
      .from(follows)
      .where(and(
        eq(follows.fanId, fanId),
        eq(follows.creatorId, creatorId)
      ))
      .limit(1);
    return !!follow;
  }

  // Story Moment operations
  async getActiveStories(userId?: string): Promise<StoryMoment[]> {
    const now = new Date();
    return await db
      .select()
      .from(storyMoments)
      .where(gt(storyMoments.expiresAt, now))
      .orderBy(desc(storyMoments.createdAt));
  }

  async getCreatorStories(creatorId: string): Promise<StoryMoment[]> {
    const now = new Date();
    return await db
      .select()
      .from(storyMoments)
      .where(and(
        eq(storyMoments.creatorId, creatorId),
        gt(storyMoments.expiresAt, now)
      ))
      .orderBy(desc(storyMoments.createdAt));
  }

  async createStory(storyData: InsertStoryMoment): Promise<StoryMoment> {
    const [story] = await db.insert(storyMoments).values(storyData).returning();
    return story;
  }

  async viewStory(storyId: string, viewerId: string): Promise<void> {
    // Check if already viewed
    const [existing] = await db
      .select()
      .from(storyViews)
      .where(and(
        eq(storyViews.storyId, storyId),
        eq(storyViews.viewerId, viewerId)
      ))
      .limit(1);

    if (!existing) {
      await db.insert(storyViews).values({ storyId, viewerId });
      // Increment view count using SQL increment
      await db
        .update(storyMoments)
        .set({ viewCount: sqlOperator`${storyMoments.viewCount} + 1` })
        .where(eq(storyMoments.id, storyId));
    }
  }

  async getStoryViews(storyId: string): Promise<StoryView[]> {
    return await db
      .select()
      .from(storyViews)
      .where(eq(storyViews.storyId, storyId))
      .orderBy(desc(storyViews.viewedAt));
  }

  async deleteExpiredStories(): Promise<void> {
    const now = new Date();
    await db.delete(storyMoments).where(lt(storyMoments.expiresAt, now));
  }

  // Fan Level & Gamification operations
  async getFanLevel(userId: string): Promise<FanLevel | undefined> {
    const [fanLevel] = await db
      .select()
      .from(fanLevels)
      .where(eq(fanLevels.userId, userId))
      .limit(1);
    return fanLevel;
  }

  async createFanLevel(fanLevelData: InsertFanLevel): Promise<FanLevel> {
    const [fanLevel] = await db.insert(fanLevels).values(fanLevelData).returning();
    return fanLevel;
  }

  async updateFanLevel(userId: string, updates: Partial<FanLevel>): Promise<FanLevel> {
    const [fanLevel] = await db
      .update(fanLevels)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(fanLevels.userId, userId))
      .returning();
    return fanLevel;
  }

  async addXP(userId: string, xpAmount: number, reason: string): Promise<FanLevel> {
    let fanLevel = await this.getFanLevel(userId);
    
    if (!fanLevel) {
      fanLevel = await this.createFanLevel({
        userId,
        level: 1,
        xp: 0,
      });
    }

    const newXP = fanLevel.xp + xpAmount;
    const newLevel = Math.floor(newXP / 1000) + 1; // Level up every 1000 XP

    return await this.updateFanLevel(userId, {
      xp: newXP,
      level: newLevel,
    });
  }

  async updateStreak(userId: string): Promise<FanLevel> {
    let fanLevel = await this.getFanLevel(userId);
    
    if (!fanLevel) {
      fanLevel = await this.createFanLevel({
        userId,
        level: 1,
        xp: 0,
        streakDays: 1,
        lastActivityDate: new Date(),
      });
      return fanLevel;
    }

    const lastActivity = fanLevel.lastActivityDate;
    const now = new Date();
    const daysSinceLastActivity = lastActivity 
      ? Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    let newStreak = fanLevel.streakDays || 0;
    if (daysSinceLastActivity === 1) {
      // Continue streak
      newStreak += 1;
    } else if (daysSinceLastActivity > 1) {
      // Streak broken
      newStreak = 1;
    }
    // If daysSinceLastActivity === 0 (same day), keep same streak

    return await this.updateFanLevel(userId, {
      streakDays: newStreak,
      lastActivityDate: now,
    });
  }

  // Creator Analytics operations
  async getCreatorAnalytics(creatorId: string, period: "daily" | "weekly" | "monthly", limit: number = 30): Promise<CreatorAnalytics[]> {
    const analytics = await db
      .select()
      .from(creatorAnalytics)
      .where(
        and(
          eq(creatorAnalytics.creatorId, creatorId),
          eq(creatorAnalytics.period, period)
        )
      )
      .orderBy(desc(creatorAnalytics.startDate))
      .limit(limit);
    
    return analytics;
  }

  async getCurrentAnalytics(creatorId: string): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get ALL posts stats (cumulative)
    const allPostStats = await db
      .select({
        totalViews: sqlOperator<number>`COALESCE(SUM(${posts.viewCount}), 0)`,
        totalLikes: sqlOperator<number>`COALESCE(SUM(${posts.likeCount}), 0)`,
        totalComments: sqlOperator<number>`COALESCE(SUM(${posts.commentCount}), 0)`,
        totalPosts: sqlOperator<number>`COUNT(*)`,
      })
      .from(posts)
      .where(eq(posts.creatorId, creatorId));
    
    // Get today's posts count
    const todayPosts = await db
      .select({
        count: sqlOperator<number>`COUNT(*)`,
      })
      .from(posts)
      .where(
        and(
          eq(posts.creatorId, creatorId),
          gt(posts.createdAt, today)
        )
      );
    
    // Get ALL story stats (cumulative)
    const allStoryStats = await db
      .select({
        totalStories: sqlOperator<number>`COUNT(*)`,
        totalStoryViews: sqlOperator<number>`COALESCE(SUM(${storyMoments.viewCount}), 0)`,
      })
      .from(storyMoments)
      .where(eq(storyMoments.creatorId, creatorId));
    
    // Get active stories (not expired)
    const activeStories = await db
      .select({
        count: sqlOperator<number>`COUNT(*)`,
      })
      .from(storyMoments)
      .where(
        and(
          eq(storyMoments.creatorId, creatorId),
          gt(storyMoments.expiresAt, new Date())
        )
      );
    
    // Get subscriber count (active subscriptions)
    const subCount = await db
      .select({
        count: sqlOperator<number>`COUNT(*)`,
      })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.creatorId, creatorId),
          eq(subscriptions.status, "active")
        )
      );
    
    // Get followers count
    const followerCount = await db
      .select({
        count: sqlOperator<number>`COUNT(*)`,
      })
      .from(follows)
      .where(eq(follows.creatorId, creatorId));
    
    return {
      overall: {
        totalViews: allPostStats[0]?.totalViews || 0,
        totalLikes: allPostStats[0]?.totalLikes || 0,
        totalComments: allPostStats[0]?.totalComments || 0,
        totalPosts: allPostStats[0]?.totalPosts || 0,
        totalStories: allStoryStats[0]?.totalStories || 0,
        totalStoryViews: allStoryStats[0]?.totalStoryViews || 0,
        subscribers: subCount[0]?.count || 0,
        followers: followerCount[0]?.count || 0,
      },
      today: {
        postsCreated: todayPosts[0]?.count || 0,
        activeStories: activeStories[0]?.count || 0,
      },
    };
  }

  async aggregateAnalytics(creatorId: string, period: "daily" | "weekly" | "monthly", startDate: Date, endDate: Date): Promise<CreatorAnalytics> {
    // Calculate metrics for the period
    const postStats = await db
      .select({
        totalViews: sqlOperator<number>`COALESCE(SUM(${posts.viewCount}), 0)`,
        totalLikes: sqlOperator<number>`COALESCE(SUM(${posts.likeCount}), 0)`,
        totalComments: sqlOperator<number>`COALESCE(SUM(${posts.commentCount}), 0)`,
        postsCreated: sqlOperator<number>`COUNT(*)`,
      })
      .from(posts)
      .where(
        and(
          eq(posts.creatorId, creatorId),
          gt(posts.createdAt, startDate),
          lt(posts.createdAt, endDate)
        )
      );
    
    const storyStats = await db
      .select({
        storiesCreated: sqlOperator<number>`COUNT(*)`,
      })
      .from(storyMoments)
      .where(
        and(
          eq(storyMoments.creatorId, creatorId),
          gt(storyMoments.createdAt, startDate),
          lt(storyMoments.createdAt, endDate)
        )
      );
    
    // Create or update analytics record
    const analyticsData: InsertCreatorAnalytics = {
      creatorId,
      period,
      startDate,
      endDate,
      totalViews: postStats[0]?.totalViews || 0,
      totalLikes: postStats[0]?.totalLikes || 0,
      totalComments: postStats[0]?.totalComments || 0,
      postsCreated: postStats[0]?.postsCreated || 0,
      storiesCreated: storyStats[0]?.storiesCreated || 0,
      averageEngagementRate: postStats[0]?.totalViews ? 
        ((postStats[0].totalLikes + postStats[0].totalComments) / postStats[0].totalViews) : 0,
    };
    
    const [analytics] = await db
      .insert(creatorAnalytics)
      .values(analyticsData)
      .returning();
    
    return analytics;
  }

  async recordView(postId: string, viewerId?: string): Promise<void> {
    // Increment view count for the post
    await db
      .update(posts)
      .set({
        viewCount: sqlOperator`${posts.viewCount} + 1`,
      })
      .where(eq(posts.id, postId));
  }

  async recordLike(postId: string, viewerId: string): Promise<void> {
    // Increment like count for the post
    await db
      .update(posts)
      .set({
        likeCount: sqlOperator`${posts.likeCount} + 1`,
      })
      .where(eq(posts.id, postId));
  }

  async recordComment(postId: string, viewerId: string): Promise<void> {
    // Increment comment count for the post
    await db
      .update(posts)
      .set({
        commentCount: sqlOperator`${posts.commentCount} + 1`,
      })
      .where(eq(posts.id, postId));
  }

  // Live Streaming operations
  async createStream(stream: InsertLiveStream): Promise<LiveStream> {
    const [newStream] = await db.insert(liveStreams).values(stream).returning();
    return newStream;
  }

  async getStream(streamId: string): Promise<LiveStream | undefined> {
    const stream = await db.query.liveStreams.findFirst({
      where: eq(liveStreams.id, streamId),
    });
    return stream;
  }

  async getCreatorStreams(creatorId: string, status?: "scheduled" | "live" | "ended" | "archived"): Promise<LiveStream[]> {
    const conditions = [eq(liveStreams.creatorId, creatorId)];
    if (status) {
      conditions.push(eq(liveStreams.status, status));
    }
    
    const streams = await db.query.liveStreams.findMany({
      where: and(...conditions),
      orderBy: (streams, { desc }) => [desc(streams.createdAt)],
    });
    return streams;
  }

  async getLiveStreams(limit = 50): Promise<LiveStream[]> {
    const streams = await db.query.liveStreams.findMany({
      where: eq(liveStreams.status, "live"),
      orderBy: (streams, { desc }) => [desc(streams.viewerCount)],
      limit,
    });
    return streams;
  }

  async updateStream(streamId: string, updates: Partial<LiveStream>): Promise<LiveStream> {
    const [updated] = await db
      .update(liveStreams)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(liveStreams.id, streamId))
      .returning();
    return updated;
  }

  async startStream(streamId: string): Promise<LiveStream> {
    const [updated] = await db
      .update(liveStreams)
      .set({
        status: "live",
        actualStartTime: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(liveStreams.id, streamId))
      .returning();
    return updated;
  }

  async endStream(streamId: string): Promise<LiveStream> {
    const [updated] = await db
      .update(liveStreams)
      .set({
        status: "ended",
        endTime: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(liveStreams.id, streamId))
      .returning();
    return updated;
  }

  async joinStream(streamId: string, viewerId: string): Promise<void> {
    // Check if viewer is already in stream
    const existing = await db.query.streamViewers.findFirst({
      where: and(
        eq(streamViewers.streamId, streamId),
        eq(streamViewers.viewerId, viewerId),
        eq(streamViewers.leftAt, null)
      ),
    });

    if (!existing) {
      await db.insert(streamViewers).values({
        streamId,
        viewerId,
      });

      // Increment viewer count
      await db
        .update(liveStreams)
        .set({
          viewerCount: sqlOperator`${liveStreams.viewerCount} + 1`,
        })
        .where(eq(liveStreams.id, streamId));

      // Update peak viewers if necessary
      const stream = await this.getStream(streamId);
      if (stream && stream.viewerCount > stream.peakViewers) {
        await db
          .update(liveStreams)
          .set({
            peakViewers: stream.viewerCount,
          })
          .where(eq(liveStreams.id, streamId));
      }
    }
  }

  async leaveStream(streamId: string, viewerId: string): Promise<void> {
    const viewer = await db.query.streamViewers.findFirst({
      where: and(
        eq(streamViewers.streamId, streamId),
        eq(streamViewers.viewerId, viewerId),
        eq(streamViewers.leftAt, null)
      ),
    });

    if (viewer) {
      const watchTime = Math.floor((Date.now() - viewer.joinedAt.getTime()) / 1000);
      await db
        .update(streamViewers)
        .set({
          leftAt: new Date(),
          totalWatchTime: watchTime,
        })
        .where(eq(streamViewers.id, viewer.id));

      // Decrement viewer count
      await db
        .update(liveStreams)
        .set({
          viewerCount: sqlOperator`GREATEST(0, ${liveStreams.viewerCount} - 1)`,
        })
        .where(eq(liveStreams.id, streamId));
    }
  }

  async getStreamViewers(streamId: string): Promise<StreamViewer[]> {
    const viewers = await db.query.streamViewers.findMany({
      where: and(
        eq(streamViewers.streamId, streamId),
        eq(streamViewers.leftAt, null)
      ),
    });
    return viewers;
  }

  async sendStreamChat(streamId: string, userId: string, message: string): Promise<StreamChat> {
    const [chat] = await db
      .insert(streamChat)
      .values({
        streamId,
        userId,
        message,
      })
      .returning();
    return chat;
  }

  async getStreamChat(streamId: string, limit = 100): Promise<StreamChat[]> {
    const messages = await db.query.streamChat.findMany({
      where: and(
        eq(streamChat.streamId, streamId),
        eq(streamChat.isDeleted, false)
      ),
      orderBy: (chat, { desc }) => [desc(chat.createdAt)],
      limit,
    });
    return messages.reverse(); // Return in chronological order
  }

  async sendStreamTip(tip: InsertStreamTip): Promise<StreamTip> {
    const [newTip] = await db.insert(streamTips).values(tip).returning();

    // Update stream total tips
    await db
      .update(liveStreams)
      .set({
        totalTips: sqlOperator`${liveStreams.totalTips} + ${tip.amount}`,
      })
      .where(eq(liveStreams.id, tip.streamId));

    return newTip;
  }

  async getStreamTips(streamId: string): Promise<StreamTip[]> {
    const tips = await db.query.streamTips.findMany({
      where: eq(streamTips.streamId, streamId),
      orderBy: (tips, { desc }) => [desc(tips.createdAt)],
    });
    return tips;
  }

  // Collaboration operations
  async createCollaboration(collab: InsertCollaboration): Promise<Collaboration> {
    const [collaboration] = await db.insert(collaborations).values(collab).returning();
    return collaboration;
  }

  async respondToCollaboration(collabId: string, accept: boolean): Promise<Collaboration> {
    const status = accept ? "accepted" : "rejected";
    const [updated] = await db
      .update(collaborations)
      .set({ status, respondedAt: new Date() })
      .where(eq(collaborations.id, collabId))
      .returning();
    return updated;
  }

  async getCollaborations(userId: string): Promise<Collaboration[]> {
    const collabs = await db.query.collaborations.findMany({
      where: or(
        eq(collaborations.primaryCreatorId, userId),
        eq(collaborations.collaboratorId, userId)
      ),
    });
    return collabs;
  }

  // Subscription Tier operations
  async createSubscriptionTier(tier: InsertSubscriptionTier): Promise<SubscriptionTier> {
    const [created] = await db.insert(subscriptionTiers).values(tier).returning();
    return created;
  }

  async getCreatorTiers(creatorId: string): Promise<SubscriptionTier[]> {
    const tiers = await db.query.subscriptionTiers.findMany({
      where: eq(subscriptionTiers.creatorId, creatorId),
      orderBy: (tiers, { asc }) => [asc(tiers.sortOrder)],
    });
    return tiers;
  }

  async updateSubscriptionTier(tierId: string, updates: Partial<SubscriptionTier>): Promise<SubscriptionTier> {
    const [updated] = await db
      .update(subscriptionTiers)
      .set(updates)
      .where(eq(subscriptionTiers.id, tierId))
      .returning();
    return updated;
  }

  // Content Bundle operations
  async createContentBundle(bundle: InsertContentBundle): Promise<ContentBundle> {
    const [created] = await db.insert(contentBundles).values(bundle).returning();
    return created;
  }

  async getCreatorBundles(creatorId: string): Promise<ContentBundle[]> {
    const bundles = await db.query.contentBundles.findMany({
      where: and(
        eq(contentBundles.creatorId, creatorId),
        eq(contentBundles.isActive, true)
      ),
    });
    return bundles;
  }

  async purchaseBundle(bundleId: string, userId: string): Promise<{ success: boolean }> {
    await db
      .update(contentBundles)
      .set({ purchaseCount: sqlOperator`${contentBundles.purchaseCount} + 1` })
      .where(eq(contentBundles.id, bundleId));
    return { success: true };
  }

  // Virtual Gift operations
  async getVirtualGifts(): Promise<VirtualGift[]> {
    const gifts = await db.query.virtualGifts.findMany({
      where: eq(virtualGifts.isActive, true),
    });
    return gifts;
  }

  async sendGift(gift: InsertGiftSent): Promise<GiftSent> {
    const [sent] = await db.insert(giftsSent).values(gift).returning();
    return sent;
  }

  async getGiftsReceived(creatorId: string): Promise<GiftSent[]> {
    const gifts = await db.query.giftsSent.findMany({
      where: eq(giftsSent.toCreatorId, creatorId),
      orderBy: (gifts, { desc }) => [desc(gifts.createdAt)],
      limit: 100,
    });
    return gifts;
  }

  // Leaderboard operations
  async updateLeaderboards(period: string): Promise<void> {
    // Clear existing leaderboards for this period
    await db.delete(leaderboards).where(eq(leaderboards.period, period));

    // Calculate top earners
    const topEarners = await db
      .select({
        userId: transactions.creatorId,
        score: sqlOperator`SUM(${transactions.amountCents})`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.status, "completed"),
          period === "daily" 
            ? gte(transactions.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000))
            : period === "weekly"
            ? gte(transactions.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
            : gte(transactions.createdAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
        )
      )
      .groupBy(transactions.creatorId)
      .orderBy(desc(sqlOperator`SUM(${transactions.amountCents})`))
      .limit(100);

    // Insert top earners into leaderboard
    for (let i = 0; i < topEarners.length; i++) {
      await db.insert(leaderboards).values({
        userId: topEarners[i].userId!,
        category: "top_earners",
        period,
        rank: i + 1,
        score: Number(topEarners[i].score),
      });
    }

    // Calculate top creators by subscriber count
    const topCreators = await db
      .select({
        userId: subscriptions.creatorId,
        score: sqlOperator`COUNT(*)`,
      })
      .from(subscriptions)
      .where(eq(subscriptions.status, "active"))
      .groupBy(subscriptions.creatorId)
      .orderBy(desc(sqlOperator`COUNT(*)`))
      .limit(100);

    for (let i = 0; i < topCreators.length; i++) {
      await db.insert(leaderboards).values({
        userId: topCreators[i].userId,
        category: "top_creators",
        period,
        rank: i + 1,
        score: Number(topCreators[i].score),
      });
    }

    logger.info(`Updated leaderboards for period: ${period}`);
  }

  async getLeaderboard(period: string, category: string, limit = 100): Promise<Leaderboard[]> {
    const board = await db.query.leaderboards.findMany({
      where: and(
        eq(leaderboards.period, period),
        eq(leaderboards.category, category)
      ),
      orderBy: (lb, { asc }) => [asc(lb.rank)],
      limit,
    });
    return board;
  }

  // Referral operations
  async createReferralCode(userId: string): Promise<ReferralCode> {
    const code = `REF${userId.slice(0, 8).toUpperCase()}`;
    const [referral] = await db
      .insert(referralCodes)
      .values({ userId, code })
      .returning();
    return referral;
  }

  async getReferralCode(userId: string): Promise<ReferralCode | undefined> {
    const code = await db.query.referralCodes.findFirst({
      where: eq(referralCodes.userId, userId),
    });
    return code;
  }

  async processReferral(code: string, newUserId: string): Promise<Referral> {
    const referralCode = await db.query.referralCodes.findFirst({
      where: eq(referralCodes.code, code),
    });
    if (!referralCode) throw new Error("Invalid referral code");

    // Check if user has already been referred
    const existingReferral = await db.query.referrals.findFirst({
      where: eq(referrals.referredUserId, newUserId),
    });
    if (existingReferral) throw new Error("User already referred");

    // Create referral record
    const [referral] = await db
      .insert(referrals)
      .values({
        referrerId: referralCode.userId,
        referredUserId: newUserId,
        referralCode: code,
        commissionEarned: "0", // Will be updated when referred user makes purchases
      })
      .returning();

    // Update referral code usage count
    await db
      .update(referralCodes)
      .set({ 
        totalEarnings: sqlOperator`${referralCodes.totalEarnings} + 0`,
        usageCount: sqlOperator`${referralCodes.usageCount} + 1`,
      })
      .where(eq(referralCodes.id, referralCode.id));

    logger.info(`Processed referral: ${code} for user ${newUserId}, referrer ${referralCode.userId}`);
    return referral;
  }

  // Process referral commission when referred user makes a purchase
  async processReferralCommission(transactionId: string, amountCents: number): Promise<void> {
    const transaction = await db.query.transactions.findFirst({
      where: eq(transactions.id, transactionId),
    });
    if (!transaction) return;

    // Check if fan was referred
    const referral = await db.query.referrals.findFirst({
      where: eq(referrals.referredUserId, transaction.fanId),
    });
    if (!referral || referral.isPaid) return;

    // Calculate 5% commission
    const commission = (amountCents * 0.05) / 100; // Convert to decimal dollars

    // Update referral commission
    await db
      .update(referrals)
      .set({
        commissionEarned: sqlOperator`${referrals.commissionEarned} + ${commission}`,
      })
      .where(eq(referrals.id, referral.id));

    // Update referral code total earnings
    const referralCode = await db.query.referralCodes.findFirst({
      where: eq(referralCodes.code, referral.referralCode),
    });
    if (referralCode) {
      await db
        .update(referralCodes)
        .set({
          totalEarnings: sqlOperator`${referralCodes.totalEarnings} + ${commission}`,
        })
        .where(eq(referralCodes.id, referralCode.id));
    }

    logger.info(`Processed referral commission: $${commission.toFixed(2)} for referral ${referral.id}`);
  }

  // Scheduled Post operations
  async createScheduledPost(post: InsertScheduledPost): Promise<ScheduledPost> {
    const [scheduled] = await db.insert(scheduledPosts).values(post).returning();
    return scheduled;
  }

  async getScheduledPosts(creatorId: string): Promise<ScheduledPost[]> {
    const posts = await db.query.scheduledPosts.findMany({
      where: and(
        eq(scheduledPosts.creatorId, creatorId),
        eq(scheduledPosts.isPublished, false)
      ),
      orderBy: (posts, { asc }) => [asc(posts.scheduledFor)],
    });
    return posts;
  }

  async publishScheduledPosts(): Promise<void> {
    // Find all scheduled posts that are ready to be published
    const now = new Date();
    const readyPosts = await db.query.scheduledPosts.findMany({
      where: and(
        eq(scheduledPosts.isPublished, false),
        lte(scheduledPosts.scheduledFor, now)
      ),
    });

    logger.info(`Publishing ${readyPosts.length} scheduled posts`);

    for (const scheduledPost of readyPosts) {
      try {
        // Create the actual post with media asset if needed
        let mediaIds: string[] | undefined;
        
        if (scheduledPost.mediaUrl && scheduledPost.mediaType) {
          // Create media asset from scheduled media
          const [mediaAsset] = await db.insert(mediaAssets).values({
            ownerId: scheduledPost.creatorId,
            s3Key: scheduledPost.mediaUrl,
            mimeType: scheduledPost.mediaType,
            status: "approved",
          }).returning();
          mediaIds = [mediaAsset.id];
        }

        // Create the actual post  
        const [newPost] = await db.insert(posts).values({
          creatorId: scheduledPost.creatorId,
          content: scheduledPost.text || "",
          ...(mediaIds && { mediaIds }),
        }).returning();

        // Mark as published
        await db
          .update(scheduledPosts)
          .set({ 
            isPublished: true,
            publishedPostId: newPost.id,
          })
          .where(eq(scheduledPosts.id, scheduledPost.id));

        logger.info(`Published scheduled post ${scheduledPost.id} as post ${newPost.id}`);
      } catch (error) {
        logger.error(`Failed to publish scheduled post ${scheduledPost.id}`, { error });
      }
    }
  }

  // Creator Badge operations
  async assignBadge(userId: string, badgeType: string): Promise<CreatorBadge> {
    const [badge] = await db
      .insert(creatorBadges)
      .values({ userId, badgeType })
      .returning();
    return badge;
  }

  async getUserBadges(userId: string): Promise<CreatorBadge[]> {
    const badges = await db.query.creatorBadges.findMany({
      where: and(
        eq(creatorBadges.userId, userId),
        eq(creatorBadges.isActive, true)
      ),
    });
    return badges;
  }

  // Geo-blocking operations
  async createGeoBlockingRule(rule: InsertGeoBlockingRule): Promise<GeoBlockingRule> {
    const [created] = await db.insert(geoBlockingRules).values(rule).returning();
    return created;
  }

  async getGeoBlockingRules(creatorId: string): Promise<GeoBlockingRule[]> {
    const rules = await db.query.geoBlockingRules.findMany({
      where: eq(geoBlockingRules.creatorId, creatorId),
    });
    return rules;
  }

  async checkGeoAccess(creatorId: string, countryCode: string): Promise<boolean> {
    const rules = await this.getGeoBlockingRules(creatorId);
    if (rules.length === 0) return true;

    for (const rule of rules) {
      if (rule.isActive) {
        const blocked = (rule.blockedCountries as any[]) || [];
        if (blocked.includes(countryCode)) return false;
      }
    }
    return true;
  }

  // Search & Tag operations
  async searchContent(query: any): Promise<any[]> {
    // Placeholder - would use full-text search
    return [];
  }

  async addTagsToPost(postId: string, tagIds: string[]): Promise<void> {
    const values = tagIds.map(tagId => ({ postId, tagId }));
    await db.insert(postTags).values(values);
  }

  // DMCA operations
  async createDmcaClaim(claim: InsertDmcaClaim): Promise<DmcaClaim> {
    const [created] = await db.insert(dmcaClaims).values(claim).returning();
    return created;
  }

  async getDmcaClaims(status?: string): Promise<DmcaClaim[]> {
    const where = status ? eq(dmcaClaims.status, status) : undefined;
    const claims = await db.query.dmcaClaims.findMany({
      where,
      orderBy: (claims, { desc }) => [desc(claims.createdAt)],
    });
    return claims;
  }

  async reviewDmcaClaim(claimId: string, approved: boolean, reviewerId: string): Promise<DmcaClaim> {
    const status = approved ? "approved" : "rejected";
    const [updated] = await db
      .update(dmcaClaims)
      .set({
        status,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
      })
      .where(eq(dmcaClaims.id, claimId))
      .returning();
    return updated;
  }

  // Onboarding operations
  async getOnboardingProgress(userId: string): Promise<OnboardingProgress | undefined> {
    const progress = await db.query.onboardingProgress.findFirst({
      where: eq(onboardingProgress.userId, userId),
    });
    return progress;
  }

  async createOnboardingProgress(userId: string): Promise<OnboardingProgress> {
    const [progress] = await db
      .insert(onboardingProgress)
      .values({ userId })
      .returning();
    return progress;
  }

  async updateOnboardingProgress(userId: string, updates: Partial<OnboardingProgress>): Promise<OnboardingProgress> {
    const [updated] = await db
      .update(onboardingProgress)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(onboardingProgress.userId, userId))
      .returning();
    return updated;
  }

  // Content Niche operations
  async getContentNiches(): Promise<ContentNiche[]> {
    const niches = await db.query.contentNiches.findMany({
      where: eq(contentNiches.isActive, true),
      orderBy: (niches, { asc }) => [asc(niches.name)],
    });
    return niches;
  }

  async createContentNiche(niche: InsertContentNiche): Promise<ContentNiche> {
    const [created] = await db.insert(contentNiches).values(niche).returning();
    return created;
  }

  // User Interest operations
  async getUserInterests(userId: string): Promise<UserInterest[]> {
    const interests = await db.query.userInterests.findMany({
      where: eq(userInterests.userId, userId),
    });
    return interests;
  }

  async setUserInterests(userId: string, nicheIds: string[]): Promise<void> {
    // Delete existing interests
    await db.delete(userInterests).where(eq(userInterests.userId, userId));
    
    // Insert new interests
    if (nicheIds.length > 0) {
      const values = nicheIds.map(nicheId => ({ userId, nicheId }));
      await db.insert(userInterests).values(values);
    }
  }

  // Profile operations
  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
    const [updated] = await db
      .update(profiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(profiles.userId, userId))
      .returning();
    return updated;
  }

  // NFT operations
  async deployNftContract(contract: InsertNftContract): Promise<any> {
    const [deployed] = await db.insert(nftContracts).values(contract).returning();
    return deployed;
  }

  async getNftContractsByCreator(creatorId: string): Promise<any[]> {
    const contracts = await db.query.nftContracts.findMany({
      where: eq(nftContracts.creatorId, creatorId),
      orderBy: (contracts, { desc }) => [desc(contracts.createdAt)],
    });
    return contracts;
  }

  async mintNft(mint: any, creatorId: string): Promise<any> {
    // Verify the creator owns the contract
    const contract = await db.query.nftContracts.findFirst({
      where: eq(nftContracts.id, mint.contractId),
    });
    
    if (!contract) {
      throw new Error("NFT contract not found");
    }
    
    if (contract.creatorId !== creatorId) {
      throw new Error("Unauthorized: You can only mint NFTs on your own contracts");
    }
    
    const [minted] = await db.insert(nftMints).values(mint).returning();
    return minted;
  }

  async getNftMintsByContract(contractId: string, userId: string): Promise<any[]> {
    // Get the contract to verify ownership
    const contract = await db.query.nftContracts.findFirst({
      where: eq(nftContracts.id, contractId),
    });
    
    if (!contract) {
      throw new Error("NFT contract not found");
    }
    
    if (contract.creatorId !== userId) {
      throw new Error("Unauthorized: You can only view mints for your own NFT contracts");
    }
    
    const mints = await db.query.nftMints.findMany({
      where: eq(nftMints.contractId, contractId),
      orderBy: (mints, { desc }) => [desc(mints.createdAt)],
    });
    return mints;
  }

  async recordNftRoyalty(royalty: any, creatorId: string): Promise<any> {
    // Verify the creator owns the contract
    const contract = await db.query.nftContracts.findFirst({
      where: eq(nftContracts.id, royalty.contractId),
    });
    
    if (!contract) {
      throw new Error("NFT contract not found");
    }
    
    if (contract.creatorId !== creatorId) {
      throw new Error("Unauthorized: You can only record royalties for your own NFT contracts");
    }
    
    const [recorded] = await db.insert(onchainRoyalties).values(royalty).returning();
    return recorded;
  }

  async getNftRoyaltiesByCreator(creatorId: string): Promise<any[]> {
    const royalties = await db.query.onchainRoyalties.findMany({
      where: eq(onchainRoyalties.creatorId, creatorId),
      orderBy: (royalties, { desc }) => [desc(royalties.createdAt)],
    });
    return royalties;
  }

  async getNftRoyaltyStats(creatorId: string): Promise<any> {
    const royalties = await this.getNftRoyaltiesByCreator(creatorId);
    const totalRoyalties = royalties.reduce((sum, r) => sum + (parseFloat(r.royaltyAmount || '0')), 0);
    const totalSales = royalties.length;
    return {
      totalRoyalties,
      totalSales,
      averageRoyalty: totalSales > 0 ? totalRoyalties / totalSales : 0,
      recentRoyalties: royalties.slice(0, 10),
    };
  }

  async getMarketplaceNfts(): Promise<any[]> {
    const nfts = await db.query.nftMints.findMany({
      where: eq(nftMints.status, "minted"),
      columns: {
        id: true,
        tokenId: true,
        tokenUri: true,
        status: true,
        mintPrice: true,
        mintPriceUsd: true,
        txHash: true,
        mintedAt: true,
        createdAt: true,
        ownerId: true,
      },
      with: {
        creator: {
          columns: {
            id: true,
            username: true,
            displayName: true,
          },
        },
        media: {
          columns: {
            id: true,
            title: true,
            description: true,
            thumbnailUrl: true,
            mediaUrl: true,
            mediaType: true,
          },
        },
        contract: {
          columns: {
            id: true,
            blockchain: true,
            contractAddress: true,
            royaltyPercentage: true,
          },
        },
      },
      orderBy: (mints, { desc }) => [desc(mints.mintedAt)],
    });
    
    // Convert Decimal fields to strings for JSON serialization
    return nfts.map(nft => ({
      ...nft,
      mintPrice: nft.mintPrice?.toString() || "0",
      mintPriceUsd: nft.mintPriceUsd?.toString() || "0.00",
    }));
  }

  async getNftMintById(nftId: string): Promise<any> {
    const nft = await db.query.nftMints.findFirst({
      where: eq(nftMints.id, nftId),
    });
    return nft;
  }

  async purchaseNft(nftId: string, buyerId: string): Promise<any> {
    // Atomic conditional update - only succeeds if ownerId is null
    const [purchased] = await db
      .update(nftMints)
      .set({ ownerId: buyerId })
      .where(and(eq(nftMints.id, nftId), sqlOperator`owner_id IS NULL`))
      .returning();
    
    if (!purchased) {
      throw new Error("NFT already sold");
    }
    
    return purchased;
  }

  // Loan operations
  async createLoanProgram(program: any): Promise<any> {
    const [created] = await db.insert(loanPrograms).values(program).returning();
    return created;
  }

  async getLoanPrograms(): Promise<any[]> {
    const programs = await db.query.loanPrograms.findMany({
      where: eq(loanPrograms.isActive, true),
      orderBy: (programs, { asc }) => [asc(programs.name)],
    });
    return programs;
  }

  async createLoanApplication(application: any): Promise<any> {
    const [created] = await db.insert(loanApplications).values(application).returning();
    return created;
  }

  async getLoanApplicationsByCreator(creatorId: string): Promise<any[]> {
    const applications = await db.query.loanApplications.findMany({
      where: eq(loanApplications.creatorId, creatorId),
      orderBy: (apps, { desc }) => [desc(apps.createdAt)],
    });
    return applications;
  }

  async createLoanOffer(offer: any): Promise<any> {
    const [created] = await db.insert(loanOffers).values(offer).returning();
    return created;
  }

  async getLoanOffersByLender(lenderId: string): Promise<any[]> {
    const offers = await db.query.loanOffers.findMany({
      where: eq(loanOffers.lenderId, lenderId),
      orderBy: (offers, { desc }) => [desc(offers.createdAt)],
    });
    return offers;
  }

  async acceptLoanOffer(offerId: string, creatorId: string): Promise<any> {
    // First get the loan offer to verify it exists and get the application
    const offer = await db.query.loanOffers.findFirst({
      where: eq(loanOffers.id, offerId),
    });
    
    if (!offer) {
      throw new Error("Loan offer not found");
    }
    
    // Get the application to verify creator ownership
    const application = await db.query.loanApplications.findFirst({
      where: eq(loanApplications.id, offer.applicationId),
    });
    
    if (!application) {
      throw new Error("Loan application not found");
    }
    
    if (application.creatorId !== creatorId) {
      throw new Error("Unauthorized: You can only accept offers for your own loan applications");
    }
    
    const [updated] = await db
      .update(loanOffers)
      .set({ status: 'approved', approvedAt: new Date() })
      .where(eq(loanOffers.id, offerId))
      .returning();
      
    if (!updated) {
      throw new Error("Failed to accept loan offer");
    }
    
    return updated;
  }

  async getLoanRepaymentsByOffer(offerId: string, userId: string): Promise<any[]> {
    // Get the offer to verify ownership
    const offer = await db.query.loanOffers.findFirst({
      where: eq(loanOffers.id, offerId),
    });
    
    if (!offer) {
      throw new Error("Loan offer not found");
    }
    
    // Get the application to verify creator ownership
    const application = await db.query.loanApplications.findFirst({
      where: eq(loanApplications.id, offer.applicationId),
    });
    
    if (!application) {
      throw new Error("Loan application not found");
    }
    
    // Verify user is either the creator (borrower) or the lender
    if (application.creatorId !== userId && offer.lenderId !== userId) {
      throw new Error("Unauthorized: You can only view repayments for your own loans");
    }
    
    const repayments = await db.query.loanRepayments.findMany({
      where: eq(loanRepayments.offerId, offerId),
      orderBy: (repayments, { asc }) => [asc(repayments.dueDate)],
    });
    return repayments;
  }

  async payLoanRepayment(repaymentId: string, amount: number, creatorId: string): Promise<any> {
    // First get the repayment to verify it exists and get the offer
    const repayment = await db.query.loanRepayments.findFirst({
      where: eq(loanRepayments.id, repaymentId),
    });
    
    if (!repayment) {
      throw new Error("Loan repayment not found");
    }
    
    // Get the offer to get the application
    const offer = await db.query.loanOffers.findFirst({
      where: eq(loanOffers.id, repayment.offerId),
    });
    
    if (!offer) {
      throw new Error("Loan offer not found");
    }
    
    // Get the application to verify creator ownership
    const application = await db.query.loanApplications.findFirst({
      where: eq(loanApplications.id, offer.applicationId),
    });
    
    if (!application) {
      throw new Error("Loan application not found");
    }
    
    if (application.creatorId !== creatorId) {
      throw new Error("Unauthorized: You can only pay your own loan repayments");
    }
    
    const [updated] = await db
      .update(loanRepayments)
      .set({ 
        status: 'paid', 
        paidAt: new Date(),
        paidAmount: amount
      })
      .where(eq(loanRepayments.id, repaymentId))
      .returning();
      
    if (!updated) {
      throw new Error("Failed to pay loan repayment");
    }
    
    return updated;
  }

  // AI Moderation operations
  async createAiScanJob(job: any): Promise<any> {
    const [created] = await db.insert(aiScanJobs).values(job).returning();
    return created;
  }

  async getAiScanJobsByMedia(mediaId: string, userId: string): Promise<any[]> {
    // Verify media ownership by checking if user owns the media asset
    const media = await db.query.mediaAssets.findFirst({
      where: eq(mediaAssets.id, mediaId),
    });
    
    if (!media) {
      throw new Error("Media asset not found");
    }
    
    if (media.userId !== userId) {
      throw new Error("Unauthorized: You can only view scan jobs for your own media");
    }
    
    const jobs = await db.query.aiScanJobs.findMany({
      where: eq(aiScanJobs.mediaId, mediaId),
      orderBy: (jobs, { desc }) => [desc(jobs.queuedAt)],
    });
    return jobs;
  }

  async getAiScanQueue(): Promise<any[]> {
    const queue = await db.query.aiScanJobs.findMany({
      where: or(eq(aiScanJobs.status, 'queued'), eq(aiScanJobs.status, 'processing')),
      orderBy: (jobs, { desc, asc }) => [desc(jobs.priority), asc(jobs.queuedAt)],
      limit: 100,
    });
    return queue;
  }

  async getAiScanResults(jobId: string, userId: string): Promise<any> {
    // Get the job to find the mediaId
    const job = await db.query.aiScanJobs.findFirst({
      where: eq(aiScanJobs.id, jobId),
    });
    
    if (!job) {
      throw new Error("Scan job not found");
    }
    
    // Verify media ownership
    const media = await db.query.mediaAssets.findFirst({
      where: eq(mediaAssets.id, job.mediaId),
    });
    
    if (!media) {
      throw new Error("Media asset not found");
    }
    
    if (media.userId !== userId) {
      throw new Error("Unauthorized: You can only view scan results for your own media");
    }
    
    const result = await db.query.aiScanResults.findFirst({
      where: eq(aiScanResults.scanJobId, jobId),
    });
    return result;
  }

  async createContentFingerprint(fingerprint: any): Promise<any> {
    const [created] = await db.insert(contentFingerprints).values(fingerprint).returning();
    return created;
  }

  async getContentFingerprint(mediaId: string, userId: string): Promise<any> {
    // Verify media ownership
    const media = await db.query.mediaAssets.findFirst({
      where: eq(mediaAssets.id, mediaId),
    });
    
    if (!media) {
      throw new Error("Media asset not found");
    }
    
    if (media.userId !== userId) {
      throw new Error("Unauthorized: You can only view fingerprints for your own media");
    }
    
    const fingerprint = await db.query.contentFingerprints.findFirst({
      where: eq(contentFingerprints.mediaId, mediaId),
    });
    return fingerprint;
  }

  async getAiScanResultsByMedia(mediaId: string, userId: string): Promise<any[]> {
    // Verify media ownership
    const media = await db.query.mediaAssets.findFirst({
      where: eq(mediaAssets.id, mediaId),
    });
    
    if (!media) {
      throw new Error("Media asset not found");
    }
    
    if (media.userId !== userId) {
      throw new Error("Unauthorized: You can only view scan results for your own media");
    }
    
    // Get all scan jobs for this media
    const jobs = await db.query.aiScanJobs.findMany({
      where: eq(aiScanJobs.mediaId, mediaId),
    });
    
    if (jobs.length === 0) {
      return [];
    }
    
    // Get results for all jobs
    const jobIds = jobs.map(job => job.id);
    const results = await db.query.aiScanResults.findMany({
      where: inArray(aiScanResults.scanJobId, jobIds),
    });
    
    return results;
  }

  async reviewAiScanResult(id: string, review: any, userId: string): Promise<any> {
    // Get the result to find the job and media
    const result = await db.query.aiScanResults.findFirst({
      where: eq(aiScanResults.id, id),
    });
    
    if (!result) {
      throw new Error("Scan result not found");
    }
    
    // Get the job to find the media
    const job = await db.query.aiScanJobs.findFirst({
      where: eq(aiScanJobs.id, result.scanJobId),
    });
    
    if (!job) {
      throw new Error("Scan job not found");
    }
    
    // Verify media ownership
    const media = await db.query.mediaAssets.findFirst({
      where: eq(mediaAssets.id, job.mediaId),
    });
    
    if (!media) {
      throw new Error("Media asset not found");
    }
    
    if (media.userId !== userId) {
      throw new Error("Unauthorized: You can only review scan results for your own media");
    }
    
    // Update the result with review data
    const [updated] = await db.update(aiScanResults)
      .set({
        humanReviewStatus: review.humanReviewStatus,
        humanReviewNotes: review.reviewNotes,
        humanReviewedAt: new Date(),
      })
      .where(eq(aiScanResults.id, id))
      .returning();
    
    return updated;
  }

  async verifyContentFingerprint(id: string, verification: any, userId: string): Promise<any> {
    // Get the fingerprint to find the media
    const fingerprint = await db.query.contentFingerprints.findFirst({
      where: eq(contentFingerprints.id, id),
    });
    
    if (!fingerprint) {
      throw new Error("Content fingerprint not found");
    }
    
    // Verify media ownership
    const media = await db.query.mediaAssets.findFirst({
      where: eq(mediaAssets.id, fingerprint.mediaId),
    });
    
    if (!media) {
      throw new Error("Media asset not found");
    }
    
    if (media.userId !== userId) {
      throw new Error("Unauthorized: You can only verify fingerprints for your own media");
    }
    
    // Update the fingerprint with verification data
    const [updated] = await db.update(contentFingerprints)
      .set({
        verificationStatus: verification.isVerified ? 'verified' : 'unverified',
        verificationNotes: verification.verificationNotes,
        verifiedAt: verification.isVerified ? new Date() : null,
      })
      .where(eq(contentFingerprints.id, id))
      .returning();
    
    return updated;
  }
}

export const storage = new DatabaseStorage();
