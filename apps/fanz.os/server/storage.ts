import {
  users,
  posts,
  subscriptions,
  messages,
  transactions,
  ppvUnlocks,
  likes,
  comments,
  shortVideos,
  hashtags,
  shortVideoHashtags,
  shortVideoReactions,
  shortVideoViews,
  videoEffects,
  algorithmPreferences,
  authProviders,
  type User,
  type UpsertUser,
  type Post,
  type InsertPost,
  type Subscription,
  type InsertSubscription,
  type Message,
  type InsertMessage,
  type Transaction,
  type InsertTransaction,
  type PpvUnlock,
  type ShortVideo,
  type InsertShortVideo,
  type Hashtag,
  type ShortVideoReaction,
  type InsertShortVideoReaction,
  type ShortVideoView,
  type InsertShortVideoView,
  type VideoEffect,
  type InsertVideoEffect,
  type AlgorithmPreferences,
  type InsertAlgorithmPreferences,
  complianceRecords,
  type ComplianceRecord,
  type InsertComplianceRecord,
  moderationResults,
  type ModerationResult,
  type InsertModerationResult,
  type Comment,
  type InsertComment,
  costarVerifications,
  type CostarVerification,
  type InsertCostarVerification,
  costarInvitations,
  type CostarInvitation,
  type InsertCostarInvitation,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, count, sum } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phoneNumber: string): Promise<User | undefined>;
  getUserByAuthProvider(provider: string, providerId: string): Promise<User | undefined>;
  createUser(user: Partial<User>): Promise<User>;
  updateUser(userId: string, data: Partial<User>): Promise<User>;
  updateUserProfile(userId: string, data: Partial<User>): Promise<User>;
  
  // Auth provider operations
  linkAuthProvider(data: {
    userId: string;
    provider: string;
    providerId: string;
    providerEmail?: string;
    accessToken?: string;
    refreshToken?: string;
  }): Promise<void>;

  // Notification operations
  getUserNotifications(userId: string, limit: number, offset: number): Promise<any[]>;
  
  // Analytics operations
  getCreatorEarnings(creatorId: string, startDate: Date): Promise<number>;
  getNewSubscribersCount(creatorId: string, startDate: Date): Promise<number>;
  getContentViews(creatorId: string, startDate: Date): Promise<number>;
  getEngagementStats(creatorId: string, startDate: Date): Promise<any>;
  getTopPerformingContent(creatorId: string, startDate: Date, limit: number): Promise<any[]>;
  
  // Performance tracking
  recordCreatorActivity(creatorId: string, activityType: string, metadata?: any): Promise<void>;
  getCreatorActivities(creatorId: string, days: number): Promise<any[]>;
  updateCreatorPerformanceMetrics(creatorId: string, metrics: any): Promise<void>;
  
  // Scheduled content
  createScheduledPost(data: any): Promise<any>;
  getScheduledPost(jobId: string): Promise<any>;
  updateScheduledPost(jobId: string, updates: any): Promise<void>;
  
  // Engagement features
  createPoll(pollData: any): Promise<any>;
  createContest(contestData: any): Promise<any>;
  getCreatorFans(creatorId: string, accessLevel: string): Promise<any[]>;
  getCreatorSubscribers(creatorId: string): Promise<any[]>;
  
  // Revenue optimization
  getCreatorPricingHistory(creatorId: string): Promise<any>;
  getMarketPricingAverages(): Promise<any>;
  getFanSpendingPatterns(creatorId: string): Promise<any>;

  // Post operations
  createPost(userId: string, post: InsertPost): Promise<Post>;
  getPost(postId: string): Promise<Post | undefined>;
  getFeedPosts(userId: string, limit: number, offset: number): Promise<Post[]>;
  getCreatorPosts(creatorId: string, viewerId?: string): Promise<Post[]>;
  likePost(userId: string, postId: string): Promise<void>;
  unlikePost(userId: string, postId: string): Promise<void>;
  hasLikedPost(userId: string, postId: string): Promise<boolean>;

  // Subscription operations
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  getSubscription(
    fanId: string,
    creatorId: string,
  ): Promise<Subscription | undefined>;
  getActiveSubscriptions(userId: string): Promise<Subscription[]>;
  cancelSubscription(subscriptionId: string): Promise<void>;
  isSubscribed(fanId: string, creatorId: string): Promise<boolean>;

  // Message operations
  sendMessage(senderId: string, message: InsertMessage): Promise<Message>;
  getConversation(userId1: string, userId2: string): Promise<Message[]>;
  getUnreadMessageCount(userId: string): Promise<number>;
  markMessagesAsRead(userId: string, senderId: string): Promise<void>;

  // PPV operations
  unlockPpvContent(
    userId: string,
    postId: string,
    price: number,
  ): Promise<PpvUnlock>;
  hasPpvUnlock(userId: string, postId: string): Promise<boolean>;

  // Transaction operations
  createTransaction(
    userId: string,
    transaction: InsertTransaction,
  ): Promise<Transaction>;
  getUserTransactions(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<Transaction[]>;
  updateUserBalance(userId: string, amount: number): Promise<void>;

  // Analytics
  getCreatorAnalytics(creatorId: string): Promise<{
    totalEarnings: number;
    monthlyEarnings: number;
    subscriberCount: number;
    totalPosts: number;
    totalLikes: number;
  }>;

  getTopCreators(limit: number): Promise<User[]>;

  // Short Video operations
  createShortVideo(video: InsertShortVideo): Promise<ShortVideo>;
  getShortVideo(videoId: string): Promise<ShortVideo | undefined>;
  updateShortVideo(
    videoId: string,
    data: Partial<ShortVideo>,
  ): Promise<ShortVideo>;
  getShortVideosByCreator(
    creatorId: string,
    limit: number,
    offset: number,
  ): Promise<ShortVideo[]>;
  getPublicShortVideos(limit: number, offset: number): Promise<ShortVideo[]>;
  getTrendingShortVideos(limit: number): Promise<ShortVideo[]>;
  incrementShortVideoViews(videoId: string): Promise<void>;

  // Hashtag operations
  createHashtag(name: string, category?: string): Promise<Hashtag>;
  getHashtag(id: string): Promise<Hashtag | undefined>;
  getHashtagByName(name: string): Promise<Hashtag | undefined>;
  getTrendingHashtags(limit: number): Promise<Hashtag[]>;
  incrementHashtagUsage(hashtagId: string): Promise<void>;

  // Short Video Hashtag operations
  linkHashtagToVideo(videoId: string, hashtagId: string): Promise<void>;
  getVideoHashtags(videoId: string): Promise<Hashtag[]>;

  // Short Video Reaction operations
  addVideoReaction(
    userId: string,
    videoId: string,
    reactionType: string,
  ): Promise<ShortVideoReaction>;
  removeVideoReaction(userId: string, videoId: string): Promise<void>;
  getUserVideoReaction(
    userId: string,
    videoId: string,
  ): Promise<ShortVideoReaction | undefined>;
  getVideoReactions(videoId: string): Promise<ShortVideoReaction[]>;

  // Short Video View operations
  trackVideoView(view: InsertShortVideoView): Promise<ShortVideoView>;
  getVideoViews(videoId: string): Promise<ShortVideoView[]>;
  getVideoViewCount(videoId: string): Promise<number>;

  // Video Effect operations
  addVideoEffect(effect: InsertVideoEffect): Promise<VideoEffect>;
  getVideoEffects(videoId: string): Promise<VideoEffect[]>;

  // Algorithm Preferences operations
  getAlgorithmPreferences(
    userId: string,
  ): Promise<AlgorithmPreferences | undefined>;
  updateAlgorithmPreferences(
    userId: string,
    preferences: Partial<AlgorithmPreferences>,
  ): Promise<AlgorithmPreferences>;

  // Compliance operations
  createComplianceRecord(
    record: InsertComplianceRecord,
  ): Promise<ComplianceRecord>;
  getComplianceRecord(userId: string): Promise<ComplianceRecord | undefined>;
  updateComplianceStatus(
    recordId: string,
    status: string,
    approvedBy?: string,
  ): Promise<ComplianceRecord>;

  // Moderation operations
  createModerationResult(
    result: InsertModerationResult,
  ): Promise<ModerationResult>;
  getModerationResult(
    entityType: string,
    entityId: string,
  ): Promise<ModerationResult | undefined>;
  updateModerationStatus(
    resultId: string,
    status: string,
    reviewedBy?: string,
  ): Promise<ModerationResult>;

  // Comments operations
  createComment(comment: InsertComment): Promise<Comment>;
  getPostComments(postId: string): Promise<Comment[]>;
  getVideoComments(videoId: string): Promise<Comment[]>;
  incrementCommentsCount(
    entityType: "post" | "video",
    entityId: string,
  ): Promise<void>;

  // Costar operations
  createCostarInvitation(
    invitation: InsertCostarInvitation,
  ): Promise<CostarInvitation>;
  getCostarInvitation(
    invitationId: string,
  ): Promise<CostarInvitation | undefined>;
  getCostarInvitationByToken(
    token: string,
  ): Promise<CostarInvitation | undefined>;
  updateCostarInvitation(
    invitationId: string,
    data: Partial<CostarInvitation>,
  ): Promise<CostarInvitation>;
  deleteCostarInvitation(invitationId: string): Promise<void>;
  createCostarVerification(
    verification: InsertCostarVerification,
  ): Promise<CostarVerification>;
  getCostarVerificationsByCreator(
    creatorId: string,
  ): Promise<CostarVerification[]>;
  getPendingCostarInvitations(creatorId: string): Promise<CostarInvitation[]>;
  getExpiredCostarInvitations(): Promise<CostarInvitation[]>;
  getUserByEmail(email: string): Promise<string | null>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
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

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.getUser(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return user;
  }

  async getUserByPhone(phoneNumber: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.phoneNumber, phoneNumber));
    return user;
  }

  async getUserByAuthProvider(provider: string, providerId: string): Promise<User | undefined> {
    const [authProvider] = await db
      .select({ userId: authProviders.userId })
      .from(authProviders)
      .where(and(
        eq(authProviders.provider, provider as any),
        eq(authProviders.providerId, providerId)
      ));
    
    if (!authProvider) return undefined;
    
    return this.getUser(authProvider.userId);
  }

  async createUser(user: Partial<User>): Promise<User> {
    const [newUser] = await db
      .insert(users)
      .values(user as any)
      .returning();
    return newUser;
  }

  async updateUser(userId: string, data: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserProfile(userId: string, data: Partial<User>): Promise<User> {
    return this.updateUser(userId, data);
  }

  async linkAuthProvider(data: {
    userId: string;
    provider: string;
    providerId: string;
    providerEmail?: string;
    accessToken?: string;
    refreshToken?: string;
  }): Promise<void> {
    await db
      .insert(authProviders)
      .values({
        userId: data.userId,
        provider: data.provider as any,
        providerId: data.providerId,
        providerEmail: data.providerEmail,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      })
      .onConflictDoUpdate({
        target: [authProviders.userId, authProviders.provider],
        set: {
          providerId: data.providerId,
          providerEmail: data.providerEmail,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          updatedAt: new Date(),
        },
      });
  }

  // Notification operations
  async getUserNotifications(userId: string, limit: number, offset: number): Promise<any[]> {
    // This would query notifications table when implemented
    return [];
  }
  
  // Analytics operations
  async getCreatorEarnings(creatorId: string, startDate: Date): Promise<number> {
    const result = await db
      .select({ total: sql`COALESCE(SUM(${transactions.amount}), 0)` })
      .from(transactions)
      .where(and(
        eq(transactions.recipientId, creatorId),
        sql`${transactions.createdAt} >= ${startDate}`
      ));
    return Number(result[0]?.total) || 0;
  }

  async getNewSubscribersCount(creatorId: string, startDate: Date): Promise<number> {
    const result = await db
      .select({ count: sql`COUNT(*)` })
      .from(subscriptions)
      .where(and(
        eq(subscriptions.creatorId, creatorId),
        eq(subscriptions.isActive, true),
        sql`${subscriptions.createdAt} >= ${startDate}`
      ));
    return Number(result[0]?.count) || 0;
  }

  async getContentViews(creatorId: string, startDate: Date): Promise<number> {
    // This would sum views from posts and short videos
    return 0; // Placeholder
  }

  async getEngagementStats(creatorId: string, startDate: Date): Promise<any> {
    const postsCount = await db
      .select({ count: sql`COUNT(*)` })
      .from(posts)
      .where(and(
        eq(posts.creatorId, creatorId),
        sql`${posts.createdAt} >= ${startDate}`
      ));

    const totalLikes = await db
      .select({ total: sql`COALESCE(SUM(${posts.likesCount}), 0)` })
      .from(posts)
      .where(and(
        eq(posts.creatorId, creatorId),
        sql`${posts.createdAt} >= ${startDate}`
      ));

    const totalComments = await db
      .select({ total: sql`COALESCE(SUM(${posts.commentsCount}), 0)` })
      .from(posts)
      .where(and(
        eq(posts.creatorId, creatorId),
        sql`${posts.createdAt} >= ${startDate}`
      ));

    const posts = Number(postsCount[0]?.count) || 0;
    const likes = Number(totalLikes[0]?.total) || 0;
    const comments = Number(totalComments[0]?.total) || 0;
    
    return {
      posts,
      likes,
      comments,
      engagementRate: posts > 0 ? (likes + comments) / posts : 0
    };
  }

  async getTopPerformingContent(creatorId: string, startDate: Date, limit: number): Promise<any[]> {
    return await db
      .select()
      .from(posts)
      .where(and(
        eq(posts.creatorId, creatorId),
        sql`${posts.createdAt} >= ${startDate}`
      ))
      .orderBy(desc(sql`${posts.likesCount} + ${posts.commentsCount}`))
      .limit(limit);
  }
  
  // Performance tracking
  async recordCreatorActivity(creatorId: string, activityType: string, metadata?: any): Promise<void> {
    // This would insert into creator_activities table when implemented
    console.log(`Activity recorded: ${creatorId} - ${activityType}`, metadata);
  }

  async getCreatorActivities(creatorId: string, days: number): Promise<any[]> {
    // This would query creator_activities table when implemented
    return [];
  }

  async updateCreatorPerformanceMetrics(creatorId: string, metrics: any): Promise<void> {
    // This would update creator performance metrics when implemented
    console.log(`Performance metrics updated for ${creatorId}:`, metrics);
  }
  
  // Scheduled content
  async createScheduledPost(data: any): Promise<any> {
    // This would insert into scheduled_posts table when implemented
    return { id: data.id, ...data };
  }

  async getScheduledPost(jobId: string): Promise<any> {
    // This would query scheduled_posts table when implemented
    return null;
  }

  async updateScheduledPost(jobId: string, updates: any): Promise<void> {
    // This would update scheduled_posts table when implemented
    console.log(`Scheduled post ${jobId} updated:`, updates);
  }
  
  // Engagement features
  async createPoll(pollData: any): Promise<any> {
    // This would insert into polls table when implemented
    return { id: `poll_${Date.now()}`, ...pollData };
  }

  async createContest(contestData: any): Promise<any> {
    // This would insert into contests table when implemented
    return { id: `contest_${Date.now()}`, ...contestData };
  }

  async getCreatorFans(creatorId: string, accessLevel: string): Promise<any[]> {
    if (accessLevel === 'free') {
      // Return all users who follow or have interacted
      return [];
    } else if (accessLevel === 'subscribers') {
      // Return subscribed users
      const subscribers = await db
        .select({ fanId: subscriptions.fanId })
        .from(subscriptions)
        .where(and(
          eq(subscriptions.creatorId, creatorId),
          eq(subscriptions.isActive, true)
        ));
      
      const userIds = subscribers.map(s => s.fanId);
      if (userIds.length === 0) return [];
      
      return await db
        .select()
        .from(users)
        .where(sql`${users.id} IN (${userIds.map(() => '?').join(',')})`);
    }
    return [];
  }

  async getCreatorSubscribers(creatorId: string): Promise<any[]> {
    return await db
      .select()
      .from(subscriptions)
      .where(and(
        eq(subscriptions.creatorId, creatorId),
        eq(subscriptions.isActive, true)
      ));
  }
  
  // Revenue optimization
  async getCreatorPricingHistory(creatorId: string): Promise<any> {
    // This would query pricing history when implemented
    return {};
  }

  async getMarketPricingAverages(): Promise<any> {
    // This would calculate market averages when implemented
    return {
      averageSubscription: 19.99,
      averagePPV: 12.99
    };
  }

  async getFanSpendingPatterns(creatorId: string): Promise<any> {
    // This would analyze fan spending patterns when implemented
    return {};
  }

  async createPost(userId: string, post: InsertPost): Promise<Post> {
    const [newPost] = await db
      .insert(posts)
      .values({ ...post, creatorId: userId })
      .returning();
    return newPost;
  }

  async getPost(postId: string): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, postId));
    return post;
  }

  async getFeedPosts(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<Post[]> {
    // Get posts from subscribed creators and public posts
    const userSubscriptions = await db
      .select({ creatorId: subscriptions.creatorId })
      .from(subscriptions)
      .where(
        and(eq(subscriptions.fanId, userId), eq(subscriptions.isActive, true)),
      );

    const subscribedCreatorIds = userSubscriptions.map((s) => s.creatorId);

    const feedPosts = await db
      .select({
        id: posts.id,
        creatorId: posts.creatorId,
        content: posts.content,
        mediaUrl: posts.mediaUrl,
        mediaType: posts.mediaType,
        postType: posts.postType,
        ppvPrice: posts.ppvPrice,
        likesCount: posts.likesCount,
        commentsCount: posts.commentsCount,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
      })
      .from(posts)
      .where(
        subscribedCreatorIds.length > 0
          ? sql`${posts.creatorId} IN (${subscribedCreatorIds.map(() => "?").join(",")}) OR ${posts.postType} = 'free'`
          : eq(posts.postType, "free"),
      )
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);

    return feedPosts;
  }

  async getCreatorPosts(creatorId: string, viewerId?: string): Promise<Post[]> {
    let query = db
      .select()
      .from(posts)
      .where(eq(posts.creatorId, creatorId))
      .orderBy(desc(posts.createdAt));

    const allPosts = await query;

    // If viewer is not subscribed, only show free posts
    if (viewerId && viewerId !== creatorId) {
      const isSubscribed = await this.isSubscribed(viewerId, creatorId);
      if (!isSubscribed) {
        return allPosts.filter((post) => post.postType === "free");
      }
    }

    return await query;
  }

  async likePost(userId: string, postId: string): Promise<void> {
    await db.insert(likes).values({ userId, postId }).onConflictDoNothing();

    // Update likes count
    await db
      .update(posts)
      .set({ likesCount: sql`${posts.likesCount} + 1` })
      .where(eq(posts.id, postId));
  }

  async unlikePost(userId: string, postId: string): Promise<void> {
    await db
      .delete(likes)
      .where(and(eq(likes.userId, userId), eq(likes.postId, postId)));

    // Update likes count
    await db
      .update(posts)
      .set({ likesCount: sql`GREATEST(${posts.likesCount} - 1, 0)` })
      .where(eq(posts.id, postId));
  }

  async hasLikedPost(userId: string, postId: string): Promise<boolean> {
    const [like] = await db
      .select()
      .from(likes)
      .where(and(eq(likes.userId, userId), eq(likes.postId, postId)));
    return !!like;
  }

  async createSubscription(
    subscription: InsertSubscription,
  ): Promise<Subscription> {
    const [newSubscription] = await db
      .insert(subscriptions)
      .values(subscription)
      .returning();

    // Update creator subscriber count
    await db
      .update(users)
      .set({ subscriberCount: sql`${users.subscriberCount} + 1` })
      .where(eq(users.id, subscription.creatorId));

    return newSubscription;
  }

  async getSubscription(
    fanId: string,
    creatorId: string,
  ): Promise<Subscription | undefined> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.fanId, fanId),
          eq(subscriptions.creatorId, creatorId),
          eq(subscriptions.isActive, true),
        ),
      );
    return subscription;
  }

  async getActiveSubscriptions(userId: string): Promise<Subscription[]> {
    return await db
      .select()
      .from(subscriptions)
      .where(
        and(eq(subscriptions.fanId, userId), eq(subscriptions.isActive, true)),
      );
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    const [subscription] = await db
      .update(subscriptions)
      .set({ isActive: false, endDate: new Date() })
      .where(eq(subscriptions.id, subscriptionId))
      .returning();

    if (subscription) {
      // Update creator subscriber count
      await db
        .update(users)
        .set({
          subscriberCount: sql`GREATEST(${users.subscriberCount} - 1, 0)`,
        })
        .where(eq(users.id, subscription.creatorId));
    }
  }

  async isSubscribed(fanId: string, creatorId: string): Promise<boolean> {
    const subscription = await this.getSubscription(fanId, creatorId);
    return !!subscription;
  }

  async sendMessage(
    senderId: string,
    message: InsertMessage,
  ): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values({ ...message, senderId })
      .returning();
    return newMessage;
  }

  async getConversation(userId1: string, userId2: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(
        sql`(${messages.senderId} = ${userId1} AND ${messages.receiverId} = ${userId2}) OR (${messages.senderId} = ${userId2} AND ${messages.receiverId} = ${userId1})`,
      )
      .orderBy(desc(messages.createdAt));
  }

  async getUnreadMessageCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(messages)
      .where(and(eq(messages.receiverId, userId), eq(messages.isRead, false)));
    return result.count;
  }

  async markMessagesAsRead(userId: string, senderId: string): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(
        and(eq(messages.receiverId, userId), eq(messages.senderId, senderId)),
      );
  }

  async unlockPpvContent(
    userId: string,
    postId: string,
    price: number,
  ): Promise<PpvUnlock> {
    const [unlock] = await db
      .insert(ppvUnlocks)
      .values({ userId, postId, price: price.toString() })
      .returning();

    // Deduct from user balance
    await this.updateUserBalance(userId, -price);

    // Add to creator earnings
    const post = await this.getPost(postId);
    if (post) {
      await this.updateUserBalance(post.creatorId, price);
      await db
        .update(users)
        .set({ totalEarnings: sql`${users.totalEarnings} + ${price}` })
        .where(eq(users.id, post.creatorId));
    }

    return unlock;
  }

  async hasPpvUnlock(userId: string, postId: string): Promise<boolean> {
    const [unlock] = await db
      .select()
      .from(ppvUnlocks)
      .where(and(eq(ppvUnlocks.userId, userId), eq(ppvUnlocks.postId, postId)));
    return !!unlock;
  }

  async createTransaction(
    userId: string,
    transaction: InsertTransaction,
  ): Promise<Transaction> {
    const [newTransaction] = await db
      .insert(transactions)
      .values({ ...transaction, userId })
      .returning();
    return newTransaction;
  }

  async getUserTransactions(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async updateUserBalance(userId: string, amount: number): Promise<void> {
    await db
      .update(users)
      .set({ balance: sql`${users.balance} + ${amount}` })
      .where(eq(users.id, userId));
  }

  async getCreatorAnalytics(creatorId: string): Promise<{
    totalEarnings: number;
    monthlyEarnings: number;
    subscriberCount: number;
    totalPosts: number;
    totalLikes: number;
  }> {
    const user = await this.getUser(creatorId);

    const [monthlyResult] = await db
      .select({ total: sum(transactions.amount) })
      .from(transactions)
      .where(
        and(
          eq(transactions.recipientId, creatorId),
          sql`${transactions.createdAt} >= date_trunc('month', current_date)`,
        ),
      );

    const [postsResult] = await db
      .select({ count: count() })
      .from(posts)
      .where(eq(posts.creatorId, creatorId));

    const [likesResult] = await db
      .select({ total: sum(posts.likesCount) })
      .from(posts)
      .where(eq(posts.creatorId, creatorId));

    return {
      totalEarnings: parseFloat(user?.totalEarnings || "0"),
      monthlyEarnings: parseFloat(monthlyResult?.total || "0"),
      subscriberCount: user?.subscriberCount || 0,
      totalPosts: postsResult.count,
      totalLikes: parseFloat(likesResult?.total || "0"),
    };
  }

  async getTopCreators(limit: number): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.role, "creator"))
      .orderBy(desc(users.subscriberCount))
      .limit(limit);
  }

  // Short Video operations
  async createShortVideo(video: InsertShortVideo): Promise<ShortVideo> {
    const [newVideo] = await db.insert(shortVideos).values(video).returning();
    return newVideo;
  }

  async getShortVideo(videoId: string): Promise<ShortVideo | undefined> {
    const [video] = await db
      .select()
      .from(shortVideos)
      .where(eq(shortVideos.id, videoId));
    return video;
  }

  async updateShortVideo(
    videoId: string,
    data: Partial<ShortVideo>,
  ): Promise<ShortVideo> {
    const [updated] = await db
      .update(shortVideos)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(shortVideos.id, videoId))
      .returning();
    return updated;
  }

  async getShortVideosByCreator(
    creatorId: string,
    limit: number,
    offset: number,
  ): Promise<ShortVideo[]> {
    return await db
      .select()
      .from(shortVideos)
      .where(eq(shortVideos.creatorId, creatorId))
      .orderBy(desc(shortVideos.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getPublicShortVideos(
    limit: number,
    offset: number,
  ): Promise<ShortVideo[]> {
    return await db
      .select()
      .from(shortVideos)
      .where(
        and(
          eq(shortVideos.isPublic, true),
          eq(shortVideos.status, "published"),
        ),
      )
      .orderBy(desc(shortVideos.publishedAt))
      .limit(limit)
      .offset(offset);
  }

  async getTrendingShortVideos(limit: number): Promise<ShortVideo[]> {
    return await db
      .select()
      .from(shortVideos)
      .where(
        and(
          eq(shortVideos.isPublic, true),
          eq(shortVideos.status, "published"),
        ),
      )
      .orderBy(desc(shortVideos.engagementScore))
      .limit(limit);
  }

  async incrementShortVideoViews(videoId: string): Promise<void> {
    await db
      .update(shortVideos)
      .set({ viewsCount: sql`${shortVideos.viewsCount} + 1` })
      .where(eq(shortVideos.id, videoId));
  }

  // Hashtag operations
  async createHashtag(
    name: string,
    category: string = "other",
  ): Promise<Hashtag> {
    const [hashtag] = await db
      .insert(hashtags)
      .values({ name, category: category as any })
      .onConflictDoUpdate({
        target: hashtags.name,
        set: {
          usageCount: sql`${hashtags.usageCount} + 1`,
          lastUsed: new Date(),
        },
      })
      .returning();
    return hashtag;
  }

  async getHashtag(id: string): Promise<Hashtag | undefined> {
    const [hashtag] = await db
      .select()
      .from(hashtags)
      .where(eq(hashtags.id, id));
    return hashtag;
  }

  async getHashtagByName(name: string): Promise<Hashtag | undefined> {
    const [hashtag] = await db
      .select()
      .from(hashtags)
      .where(eq(hashtags.name, name.toLowerCase()));
    return hashtag;
  }

  async getTrendingHashtags(limit: number): Promise<Hashtag[]> {
    return await db
      .select()
      .from(hashtags)
      .where(eq(hashtags.isBlocked, false))
      .orderBy(desc(hashtags.trendingScore))
      .limit(limit);
  }

  async incrementHashtagUsage(hashtagId: string): Promise<void> {
    await db
      .update(hashtags)
      .set({
        usageCount: sql`${hashtags.usageCount} + 1`,
        lastUsed: new Date(),
      })
      .where(eq(hashtags.id, hashtagId));
  }

  // Short Video Hashtag operations
  async linkHashtagToVideo(videoId: string, hashtagId: string): Promise<void> {
    await db
      .insert(shortVideoHashtags)
      .values({ shortVideoId: videoId, hashtagId })
      .onConflictDoNothing();
  }

  async getVideoHashtags(videoId: string): Promise<Hashtag[]> {
    const result = await db
      .select({ hashtag: hashtags })
      .from(shortVideoHashtags)
      .innerJoin(hashtags, eq(shortVideoHashtags.hashtagId, hashtags.id))
      .where(eq(shortVideoHashtags.shortVideoId, videoId));
    return result.map((r) => r.hashtag);
  }

  // Short Video Reaction operations
  async addVideoReaction(
    userId: string,
    videoId: string,
    reactionType: string,
  ): Promise<ShortVideoReaction> {
    // Remove existing reaction first
    await this.removeVideoReaction(userId, videoId);

    const [reaction] = await db
      .insert(shortVideoReactions)
      .values({
        userId,
        shortVideoId: videoId,
        reactionType: reactionType as any,
      })
      .returning();

    // Update likes count if it's a like reaction
    if (reactionType === "like") {
      await db
        .update(shortVideos)
        .set({ likesCount: sql`${shortVideos.likesCount} + 1` })
        .where(eq(shortVideos.id, videoId));
    }

    return reaction;
  }

  async removeVideoReaction(userId: string, videoId: string): Promise<void> {
    const [existing] = await db
      .select()
      .from(shortVideoReactions)
      .where(
        and(
          eq(shortVideoReactions.userId, userId),
          eq(shortVideoReactions.shortVideoId, videoId),
        ),
      );

    if (existing) {
      await db
        .delete(shortVideoReactions)
        .where(
          and(
            eq(shortVideoReactions.userId, userId),
            eq(shortVideoReactions.shortVideoId, videoId),
          ),
        );

      // Update likes count if it was a like reaction
      if (existing.reactionType === "like") {
        await db
          .update(shortVideos)
          .set({ likesCount: sql`GREATEST(${shortVideos.likesCount} - 1, 0)` })
          .where(eq(shortVideos.id, videoId));
      }
    }
  }

  async getUserVideoReaction(
    userId: string,
    videoId: string,
  ): Promise<ShortVideoReaction | undefined> {
    const [reaction] = await db
      .select()
      .from(shortVideoReactions)
      .where(
        and(
          eq(shortVideoReactions.userId, userId),
          eq(shortVideoReactions.shortVideoId, videoId),
        ),
      );
    return reaction;
  }

  async getVideoReactions(videoId: string): Promise<ShortVideoReaction[]> {
    return await db
      .select()
      .from(shortVideoReactions)
      .where(eq(shortVideoReactions.shortVideoId, videoId));
  }

  // Short Video View operations
  async trackVideoView(view: InsertShortVideoView): Promise<ShortVideoView> {
    const [tracked] = await db.insert(shortVideoViews).values(view).returning();

    // Increment view count on the video
    await this.incrementShortVideoViews(view.shortVideoId);

    return tracked;
  }

  async getVideoViews(videoId: string): Promise<ShortVideoView[]> {
    return await db
      .select()
      .from(shortVideoViews)
      .where(eq(shortVideoViews.shortVideoId, videoId))
      .orderBy(desc(shortVideoViews.createdAt));
  }

  async getVideoViewCount(videoId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(shortVideoViews)
      .where(eq(shortVideoViews.shortVideoId, videoId));
    return result.count;
  }

  // Video Effect operations
  async addVideoEffect(effect: InsertVideoEffect): Promise<VideoEffect> {
    const [newEffect] = await db
      .insert(videoEffects)
      .values(effect)
      .returning();
    return newEffect;
  }

  async getVideoEffects(videoId: string): Promise<VideoEffect[]> {
    return await db
      .select()
      .from(videoEffects)
      .where(eq(videoEffects.shortVideoId, videoId))
      .orderBy(videoEffects.layerOrder);
  }

  // Algorithm Preferences operations
  async getAlgorithmPreferences(
    userId: string,
  ): Promise<AlgorithmPreferences | undefined> {
    const [prefs] = await db
      .select()
      .from(algorithmPreferences)
      .where(eq(algorithmPreferences.userId, userId));
    return prefs;
  }

  async updateAlgorithmPreferences(
    userId: string,
    preferences: Partial<AlgorithmPreferences>,
  ): Promise<AlgorithmPreferences> {
    const [updated] = await db
      .insert(algorithmPreferences)
      .values({ ...preferences, userId })
      .onConflictDoUpdate({
        target: algorithmPreferences.userId,
        set: {
          ...preferences,
          lastUpdated: new Date(),
        },
      })
      .returning();
    return updated;
  }

  // Compliance operations
  async createComplianceRecord(
    record: InsertComplianceRecord,
  ): Promise<ComplianceRecord> {
    const [newRecord] = await db
      .insert(complianceRecords)
      .values([record])
      .returning();
    return newRecord;
  }

  async getComplianceRecord(
    userId: string,
  ): Promise<ComplianceRecord | undefined> {
    const [record] = await db
      .select()
      .from(complianceRecords)
      .where(eq(complianceRecords.userId, userId))
      .orderBy(desc(complianceRecords.createdAt))
      .limit(1);
    return record;
  }

  async updateComplianceStatus(
    recordId: string,
    status: string,
    approvedBy?: string,
  ): Promise<ComplianceRecord> {
    const updateData: any = {
      status: status as any,
      updatedAt: new Date(),
    };

    if (approvedBy) {
      updateData.approvedBy = approvedBy;
      updateData.approvedAt = new Date();
    }

    const [updated] = await db
      .update(complianceRecords)
      .set(updateData)
      .where(eq(complianceRecords.id, recordId))
      .returning();
    return updated;
  }

  // Moderation operations
  async createModerationResult(
    result: InsertModerationResult,
  ): Promise<ModerationResult> {
    const [newResult] = await db
      .insert(moderationResults)
      .values(result)
      .returning();
    return newResult;
  }

  async getModerationResult(
    entityType: string,
    entityId: string,
  ): Promise<ModerationResult | undefined> {
    const [result] = await db
      .select()
      .from(moderationResults)
      .where(
        and(
          eq(moderationResults.entityType, entityType),
          eq(moderationResults.entityId, entityId),
        ),
      )
      .orderBy(desc(moderationResults.createdAt))
      .limit(1);
    return result;
  }

  async updateModerationStatus(
    resultId: string,
    status: string,
    reviewedBy?: string,
  ): Promise<ModerationResult> {
    const updateData: any = {
      status: status as any,
      updatedAt: new Date(),
    };

    if (reviewedBy) {
      updateData.reviewedBy = reviewedBy;
      updateData.reviewedAt = new Date();
    }

    const [updated] = await db
      .update(moderationResults)
      .set(updateData)
      .where(eq(moderationResults.id, resultId))
      .returning();
    return updated;
  }

  // Comments operations
  async createComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db.insert(comments).values(comment).returning();

    // Update comment count
    if (comment.postId) {
      await this.incrementCommentsCount("post", comment.postId);
    } else if (comment.shortVideoId) {
      await this.incrementCommentsCount("video", comment.shortVideoId);
    }

    return newComment;
  }

  async getPostComments(postId: string): Promise<Comment[]> {
    return await db
      .select()
      .from(comments)
      .where(eq(comments.postId, postId))
      .orderBy(desc(comments.createdAt));
  }

  async getVideoComments(videoId: string): Promise<Comment[]> {
    return await db
      .select()
      .from(comments)
      .where(eq(comments.shortVideoId, videoId))
      .orderBy(desc(comments.createdAt));
  }

  async incrementCommentsCount(
    entityType: "post" | "video",
    entityId: string,
  ): Promise<void> {
    if (entityType === "post") {
      await db
        .update(posts)
        .set({ commentsCount: sql`${posts.commentsCount} + 1` })
        .where(eq(posts.id, entityId));
    } else {
      await db
        .update(shortVideos)
        .set({ commentsCount: sql`${shortVideos.commentsCount} + 1` })
        .where(eq(shortVideos.id, entityId));
    }
  }

  // Costar operations implementation
  async createCostarInvitation(
    invitation: InsertCostarInvitation,
  ): Promise<CostarInvitation> {
    const [newInvitation] = await db
      .insert(costarInvitations)
      .values(invitation)
      .returning();
    return newInvitation;
  }

  async getCostarInvitation(
    invitationId: string,
  ): Promise<CostarInvitation | undefined> {
    const [invitation] = await db
      .select()
      .from(costarInvitations)
      .where(eq(costarInvitations.id, invitationId));
    return invitation;
  }

  async getCostarInvitationByToken(
    token: string,
  ): Promise<CostarInvitation | undefined> {
    const [invitation] = await db
      .select()
      .from(costarInvitations)
      .where(eq(costarInvitations.inviteToken, token));
    return invitation;
  }

  async updateCostarInvitation(
    invitationId: string,
    data: Partial<CostarInvitation>,
  ): Promise<CostarInvitation> {
    const [updated] = await db
      .update(costarInvitations)
      .set(data)
      .where(eq(costarInvitations.id, invitationId))
      .returning();
    return updated;
  }

  async deleteCostarInvitation(invitationId: string): Promise<void> {
    await db
      .delete(costarInvitations)
      .where(eq(costarInvitations.id, invitationId));
  }

  async createCostarVerification(
    verification: InsertCostarVerification,
  ): Promise<CostarVerification> {
    const [newVerification] = await db
      .insert(costarVerifications)
      .values(verification)
      .returning();
    return newVerification;
  }

  async getCostarVerificationsByCreator(
    creatorId: string,
  ): Promise<CostarVerification[]> {
    return await db
      .select()
      .from(costarVerifications)
      .where(eq(costarVerifications.primaryCreatorId, creatorId));
  }

  async getPendingCostarInvitations(
    creatorId: string,
  ): Promise<CostarInvitation[]> {
    return await db
      .select()
      .from(costarInvitations)
      .where(
        and(
          eq(costarInvitations.primaryCreatorId, creatorId),
          eq(costarInvitations.isUsed, false),
        ),
      );
  }

  async getExpiredCostarInvitations(): Promise<CostarInvitation[]> {
    return await db
      .select()
      .from(costarInvitations)
      .where(
        and(
          eq(costarInvitations.isUsed, false),
          sql`${costarInvitations.expiresAt} < NOW()`,
        ),
      );
  }


}

export const storage = new DatabaseStorage();
