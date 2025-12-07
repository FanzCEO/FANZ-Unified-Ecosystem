import {
  users,
  creators,
  posts,
  messages,
  subscriptions,
  tips,
  analytics,
  verificationRequests,
  accessCodes,
  moderationQueue,
  type User,
  type UpsertUser,
  type Creator,
  type InsertCreator,
  type Post,
  type InsertPost,
  type Message,
  type InsertMessage,
  type Subscription,
  type InsertSubscription,
  type Tip,
  type InsertTip,
  type Analytics,
  type VerificationRequest,
  type AccessCode,
  type ModerationQueue,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations (required for Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserLastLogin(id: string): Promise<void>;
  updateUserPassword(id: string, password: string): Promise<void>;
  setRememberMeToken(id: string, token: string): Promise<void>;
  setPasswordResetToken(id: string, token: string, expires: Date): Promise<void>;
  clearPasswordResetToken(id: string): Promise<void>;

  // Verification operations
  createPendingUser(userData: any): Promise<string>;
  createVerificationRequest(data: any): Promise<VerificationRequest>;
  addToModerationQueue(data: any): Promise<ModerationQueue>;
  getAccessCode(code: string): Promise<AccessCode | undefined>;
  trackFailedAccessAttempt(email: string, code: string): Promise<void>;
  markAccessCodeUsed(code: string): Promise<void>;
  grantPlatformAccess(userId: string): Promise<void>;
  generateAccessCode(userId: string): Promise<string>;
  invalidateAccessCodesForUser(userId: string): Promise<void>;
  updateUserVerificationStatus(userId: string, updates: any): Promise<void>;
  getModerationQueue(status?: string, queueType?: string): Promise<any[]>;

  // Creator operations
  getCreator(id: string): Promise<Creator | undefined>;
  getCreatorByUserId(userId: string): Promise<Creator | undefined>;
  getCreatorByUsername(username: string): Promise<Creator | undefined>;
  createCreator(creator: InsertCreator): Promise<Creator>;
  updateCreator(id: string, updates: Partial<InsertCreator>): Promise<Creator | undefined>;
  getAllCreators(): Promise<Creator[]>;
  
  // Post operations
  getPost(id: string): Promise<Post | undefined>;
  getPostsByCreator(creatorId: string): Promise<Post[]>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: string, updates: Partial<InsertPost>): Promise<Post | undefined>;
  deletePost(id: string): Promise<boolean>;
  
  // Message operations
  getMessagesBetweenUsers(senderId: string, receiverId: string): Promise<Message[]>;
  getConversationsForUser(userId: string): Promise<Array<{conversation: Message, otherUser: User}>>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: string): Promise<boolean>;
  
  // Subscription operations
  getSubscription(fanId: string, creatorId: string): Promise<Subscription | undefined>;
  getSubscribersByCreator(creatorId: string): Promise<Array<{subscription: Subscription, fan: User}>>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: string, updates: Partial<InsertSubscription>): Promise<Subscription | undefined>;
  
  // Tip operations
  createTip(tip: InsertTip): Promise<Tip>;
  getTipsByCreator(creatorId: string): Promise<Array<{tip: Tip, fan: User}>>;
  
  // Analytics operations
  getAnalyticsByCreator(creatorId: string, startDate?: Date, endDate?: Date): Promise<Analytics[]>;
  createAnalytics(analytics: Omit<Analytics, 'id'>): Promise<Analytics>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.resetPasswordToken, token));
    return user || undefined;
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = await this.getUserByEmail(userData.email!);
    
    if (existingUser) {
      const [updatedUser] = await db
        .update(users)
        .set({
          ...userData,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingUser.id))
        .returning();
      return updatedUser;
    } else {
      return await this.createUser({
        email: userData.email!,
        password: '',
        firstName: userData.firstName ?? null,
        lastName: userData.lastName ?? null,
        profileImageUrl: userData.profileImageUrl ?? null,
        emailVerified: false,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        lastLogin: null,
        rememberMeToken: null,
      });
    }
  }

  async updateUserLastLogin(id: string): Promise<void> {
    await db
      .update(users)
      .set({
        lastLogin: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));
  }

  async updateUserPassword(id: string, password: string): Promise<void> {
    await db
      .update(users)
      .set({
        password,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));
  }

  async setRememberMeToken(id: string, token: string): Promise<void> {
    await db
      .update(users)
      .set({
        rememberMeToken: token,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));
  }

  async setPasswordResetToken(id: string, token: string, expires: Date): Promise<void> {
    await db
      .update(users)
      .set({
        resetPasswordToken: token,
        resetPasswordExpires: expires,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));
  }

  async clearPasswordResetToken(id: string): Promise<void> {
    await db
      .update(users)
      .set({
        resetPasswordToken: null,
        resetPasswordExpires: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));
  }

  // Verification operations
  async createPendingUser(userData: any): Promise<string> {
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        password: '', // No password set yet for pending users
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return user.id;
  }

  async createVerificationRequest(data: any): Promise<VerificationRequest> {
    const [request] = await db
      .insert(verificationRequests)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return request;
  }

  async addToModerationQueue(data: any): Promise<ModerationQueue> {
    const [item] = await db
      .insert(moderationQueue)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return item;
  }

  async getAccessCode(code: string): Promise<AccessCode | undefined> {
    const [accessCode] = await db
      .select()
      .from(accessCodes)
      .where(eq(accessCodes.code, code));
    return accessCode || undefined;
  }

  async trackFailedAccessAttempt(email: string, code: string): Promise<void> {
    // In a production app, you might want to track this in a separate table
    // For now, we'll just increment the attempts counter on the access code if it exists
    const existingCode = await this.getAccessCode(code);
    if (existingCode) {
      await db
        .update(accessCodes)
        .set({
          attempts: (existingCode.attempts || 0) + 1,
        })
        .where(eq(accessCodes.code, code));
    }
  }

  async markAccessCodeUsed(code: string): Promise<void> {
    await db
      .update(accessCodes)
      .set({
        usedAt: new Date(),
      })
      .where(eq(accessCodes.code, code));
  }

  async grantPlatformAccess(userId: string): Promise<void> {
    await db
      .update(users)
      .set({
        platformAccessGranted: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async generateAccessCode(userId: string): Promise<string> {
    // Generate a random 8-character alphanumeric code
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar looking chars
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    // Set expiration to 24 hours from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await db.insert(accessCodes).values({
      userId,
      code,
      expiresAt,
      createdAt: new Date(),
    });

    // Mark user as having access code
    await db
      .update(users)
      .set({
        hasAccessCode: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return code;
  }

  async invalidateAccessCodesForUser(userId: string): Promise<void> {
    // Mark all existing codes for this user as expired
    const now = new Date();
    await db
      .update(accessCodes)
      .set({
        expiresAt: now,
      })
      .where(eq(accessCodes.userId, userId));
  }

  async updateUserVerificationStatus(userId: string, updates: any): Promise<void> {
    await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async getModerationQueue(status?: string, queueType?: string): Promise<any[]> {
    let query = db
      .select({
        queueItem: moderationQueue,
        user: users,
        verificationRequest: verificationRequests,
      })
      .from(moderationQueue)
      .leftJoin(users, eq(moderationQueue.userId, users.id))
      .leftJoin(verificationRequests, eq(moderationQueue.verificationRequestId, verificationRequests.id));

    // Apply filters
    const conditions = [];
    if (status) {
      conditions.push(eq(moderationQueue.status, status));
    }
    if (queueType) {
      conditions.push(eq(moderationQueue.queueType, queueType));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const results = await query.orderBy(desc(moderationQueue.submittedAt));
    return results;
  }

  // Creator operations
  async getCreator(id: string): Promise<Creator | undefined> {
    const [creator] = await db.select().from(creators).where(eq(creators.id, id));
    return creator || undefined;
  }

  async getCreatorByUserId(userId: string): Promise<Creator | undefined> {
    const [creator] = await db.select().from(creators).where(eq(creators.userId, userId));
    return creator || undefined;
  }

  async getCreatorByUsername(username: string): Promise<Creator | undefined> {
    const [creator] = await db.select().from(creators).where(eq(creators.username, username));
    return creator || undefined;
  }

  async createCreator(creatorData: InsertCreator): Promise<Creator> {
    const [creator] = await db
      .insert(creators)
      .values({
        ...creatorData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return creator;
  }

  async updateCreator(id: string, updates: Partial<InsertCreator>): Promise<Creator | undefined> {
    const [creator] = await db
      .update(creators)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(creators.id, id))
      .returning();
    return creator || undefined;
  }

  async getAllCreators(): Promise<Creator[]> {
    return await db.select().from(creators);
  }

  // Post operations
  async getPost(id: string): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    return post || undefined;
  }

  async getPostsByCreator(creatorId: string): Promise<Post[]> {
    return await db
      .select()
      .from(posts)
      .where(eq(posts.creatorId, creatorId))
      .orderBy(desc(posts.createdAt));
  }

  async createPost(postData: InsertPost): Promise<Post> {
    const [post] = await db
      .insert(posts)
      .values({
        ...postData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return post;
  }

  async updatePost(id: string, updates: Partial<InsertPost>): Promise<Post | undefined> {
    const [post] = await db
      .update(posts)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, id))
      .returning();
    return post || undefined;
  }

  async deletePost(id: string): Promise<boolean> {
    const result = await db.delete(posts).where(eq(posts.id, id));
    return result.rowCount! > 0;
  }

  // Message operations
  async getMessagesBetweenUsers(senderId: string, receiverId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.senderId, senderId),
          eq(messages.receiverId, receiverId)
        )
      )
      .orderBy(messages.createdAt);
  }

  async getConversationsForUser(userId: string): Promise<Array<{conversation: Message, otherUser: User}>> {
    // This is a complex query - for now, we'll implement a simplified version
    const allMessages = await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.senderId, userId)
        )
      )
      .orderBy(desc(messages.createdAt));
    
    const conversations = new Map<string, Message>();
    
    for (const message of allMessages) {
      const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
      if (!conversations.has(otherUserId)) {
        conversations.set(otherUserId, message);
      }
    }
    
    const result = [];
    for (const [otherUserId, conversation] of Array.from(conversations.entries())) {
      const otherUser = await this.getUser(otherUserId);
      if (otherUser) {
        result.push({ conversation, otherUser });
      }
    }
    
    return result;
  }

  async createMessage(messageData: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values({
        ...messageData,
        createdAt: new Date(),
      })
      .returning();
    return message;
  }

  async markMessageAsRead(id: string): Promise<boolean> {
    const result = await db
      .update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, id));
    return result.rowCount! > 0;
  }

  // Subscription operations
  async getSubscription(fanId: string, creatorId: string): Promise<Subscription | undefined> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.fanId, fanId),
          eq(subscriptions.creatorId, creatorId),
          eq(subscriptions.status, 'active')
        )
      );
    return subscription || undefined;
  }

  async getSubscribersByCreator(creatorId: string): Promise<Array<{subscription: Subscription, fan: User}>> {
    const subs = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.creatorId, creatorId),
          eq(subscriptions.status, 'active')
        )
      );
    
    const result = [];
    for (const subscription of subs) {
      const fan = await this.getUser(subscription.fanId);
      if (fan) {
        result.push({ subscription, fan });
      }
    }
    
    return result;
  }

  async createSubscription(subscriptionData: InsertSubscription): Promise<Subscription> {
    const [subscription] = await db
      .insert(subscriptions)
      .values({
        ...subscriptionData,
        createdAt: new Date(),
      })
      .returning();
    return subscription;
  }

  async updateSubscription(id: string, updates: Partial<InsertSubscription>): Promise<Subscription | undefined> {
    const [subscription] = await db
      .update(subscriptions)
      .set(updates)
      .where(eq(subscriptions.id, id))
      .returning();
    return subscription || undefined;
  }

  // Tip operations
  async createTip(tipData: InsertTip): Promise<Tip> {
    const [tip] = await db
      .insert(tips)
      .values({
        ...tipData,
        createdAt: new Date(),
      })
      .returning();
    return tip;
  }

  async getTipsByCreator(creatorId: string): Promise<Array<{tip: Tip, fan: User}>> {
    const creatorTips = await db
      .select()
      .from(tips)
      .where(eq(tips.toCreatorId, creatorId))
      .orderBy(desc(tips.createdAt));
    
    const result = [];
    for (const tip of creatorTips) {
      const fan = await this.getUser(tip.fromUserId);
      if (fan) {
        result.push({ tip, fan });
      }
    }
    
    return result;
  }

  // Analytics operations
  async getAnalyticsByCreator(creatorId: string, startDate?: Date, endDate?: Date): Promise<Analytics[]> {
    if (startDate && endDate) {
      return await db
        .select()
        .from(analytics)
        .where(
          and(
            eq(analytics.creatorId, creatorId),
            gte(analytics.date, startDate),
            lte(analytics.date, endDate)
          )
        )
        .orderBy(analytics.date);
    } else if (startDate) {
      return await db
        .select()
        .from(analytics)
        .where(
          and(
            eq(analytics.creatorId, creatorId),
            gte(analytics.date, startDate)
          )
        )
        .orderBy(analytics.date);
    } else if (endDate) {
      return await db
        .select()
        .from(analytics)
        .where(
          and(
            eq(analytics.creatorId, creatorId),
            lte(analytics.date, endDate)
          )
        )
        .orderBy(analytics.date);
    }
    
    return await db
      .select()
      .from(analytics)
      .where(eq(analytics.creatorId, creatorId))
      .orderBy(analytics.date);
  }

  async createAnalytics(analyticsData: Omit<Analytics, 'id'>): Promise<Analytics> {
    const [newAnalytics] = await db
      .insert(analytics)
      .values(analyticsData)
      .returning();
    return newAnalytics;
  }
}

export const storage = new DatabaseStorage();
