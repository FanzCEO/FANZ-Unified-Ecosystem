import {
  users,
  platformProfiles,
  content,
  subscriptions,
  liveStreams,
  messages,
  transactions,
  auditLogs,
  type User,
  type UpsertUser,
  type PlatformProfile,
  type Content,
  type Subscription,
  type LiveStream,
  type Message,
  type Transaction,
  type AuditLog,
} from "../shared/schema";
import { db } from "./db";
import { eq, and, or, inArray, desc, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Platform profile operations
  getPlatformProfile(
    userId: string,
    platform: string,
  ): Promise<PlatformProfile | undefined>;
  createPlatformProfile(
    profile: Partial<PlatformProfile>,
  ): Promise<PlatformProfile>;
  updatePlatformProfile(
    id: string,
    updates: Partial<PlatformProfile>,
  ): Promise<PlatformProfile>;
  getUserPlatformProfiles(userId: string): Promise<PlatformProfile[]>;

  // Content operations
  createContent(content: Partial<Content>): Promise<Content>;
  getContent(id: string): Promise<Content | undefined>;
  getContentByPlatform(platform: string, limit?: number): Promise<Content[]>;
  getUserContent(userId: string, platform?: string): Promise<Content[]>;
  updateContent(id: string, updates: Partial<Content>): Promise<Content>;

  // Subscription operations
  createSubscription(
    subscription: Partial<Subscription>,
  ): Promise<Subscription>;
  getSubscription(
    subscriberId: string,
    creatorId: string,
    platform: string,
  ): Promise<Subscription | undefined>;
  getUserSubscriptions(userId: string): Promise<Subscription[]>;
  getCreatorSubscribers(
    creatorId: string,
    platform?: string,
  ): Promise<Subscription[]>;
  updateSubscription(
    id: string,
    updates: Partial<Subscription>,
  ): Promise<Subscription>;

  // Live stream operations
  createLiveStream(stream: Partial<LiveStream>): Promise<LiveStream>;
  getLiveStream(id: string): Promise<LiveStream | undefined>;
  getActiveLiveStreams(platform?: string): Promise<LiveStream[]>;
  updateLiveStream(
    id: string,
    updates: Partial<LiveStream>,
  ): Promise<LiveStream>;

  // Message operations
  createMessage(message: Partial<Message>): Promise<Message>;
  getConversation(
    userId1: string,
    userId2: string,
    platform?: string,
  ): Promise<Message[]>;
  markMessagesAsRead(receiverId: string, senderId: string): Promise<void>;

  // Transaction operations
  createTransaction(transaction: Partial<Transaction>): Promise<Transaction>;
  getUserTransactions(
    userId: string,
    platform?: string,
  ): Promise<Transaction[]>;

  // Audit log operations
  createAuditLog(log: Partial<AuditLog>): Promise<AuditLog>;
  getUserAuditLogs(userId: string, limit?: number): Promise<AuditLog[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
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
          lastLoginAt: new Date(),
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Platform profile operations
  async getPlatformProfile(
    userId: string,
    platform: string,
  ): Promise<PlatformProfile | undefined> {
    const [profile] = await db
      .select()
      .from(platformProfiles)
      .where(
        and(
          eq(platformProfiles.userId, userId),
          eq(platformProfiles.platform, platform as any),
        ),
      );
    return profile;
  }

  async createPlatformProfile(
    profile: Partial<PlatformProfile>,
  ): Promise<PlatformProfile> {
    const [newProfile] = await db
      .insert(platformProfiles)
      .values(profile as any)
      .returning();
    return newProfile;
  }

  async updatePlatformProfile(
    id: string,
    updates: Partial<PlatformProfile>,
  ): Promise<PlatformProfile> {
    const [updated] = await db
      .update(platformProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(platformProfiles.id, id))
      .returning();
    return updated;
  }

  async getUserPlatformProfiles(userId: string): Promise<PlatformProfile[]> {
    return db
      .select()
      .from(platformProfiles)
      .where(eq(platformProfiles.userId, userId));
  }

  // Content operations
  async createContent(contentData: Partial<Content>): Promise<Content> {
    const [newContent] = await db
      .insert(content)
      .values(contentData as any)
      .returning();
    return newContent;
  }

  async getContent(id: string): Promise<Content | undefined> {
    const [item] = await db.select().from(content).where(eq(content.id, id));
    return item;
  }

  async getContentByPlatform(
    platform: string,
    limit: number = 50,
  ): Promise<Content[]> {
    return db
      .select()
      .from(content)
      .where(
        and(
          eq(content.primaryPlatform, platform as any),
          eq(content.status, "published"),
        ),
      )
      .orderBy(desc(content.publishedAt))
      .limit(limit);
  }

  async getUserContent(userId: string, platform?: string): Promise<Content[]> {
    const conditions = [eq(content.creatorId, userId)];
    if (platform) {
      conditions.push(eq(content.primaryPlatform, platform as any));
    }

    return db
      .select()
      .from(content)
      .where(and(...conditions))
      .orderBy(desc(content.createdAt));
  }

  async updateContent(id: string, updates: Partial<Content>): Promise<Content> {
    const [updated] = await db
      .update(content)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(content.id, id))
      .returning();
    return updated;
  }

  // Subscription operations
  async createSubscription(
    subscription: Partial<Subscription>,
  ): Promise<Subscription> {
    const [newSub] = await db
      .insert(subscriptions)
      .values(subscription as any)
      .returning();
    return newSub;
  }

  async getSubscription(
    subscriberId: string,
    creatorId: string,
    platform: string,
  ): Promise<Subscription | undefined> {
    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.subscriberId, subscriberId),
          eq(subscriptions.creatorId, creatorId),
          eq(subscriptions.platform, platform as any),
        ),
      );
    return sub;
  }

  async getUserSubscriptions(userId: string): Promise<Subscription[]> {
    return db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.subscriberId, userId));
  }

  async getCreatorSubscribers(
    creatorId: string,
    platform?: string,
  ): Promise<Subscription[]> {
    const conditions = [eq(subscriptions.creatorId, creatorId)];
    if (platform) {
      conditions.push(eq(subscriptions.platform, platform as any));
    }

    return db
      .select()
      .from(subscriptions)
      .where(and(...conditions));
  }

  async updateSubscription(
    id: string,
    updates: Partial<Subscription>,
  ): Promise<Subscription> {
    const [updated] = await db
      .update(subscriptions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(subscriptions.id, id))
      .returning();
    return updated;
  }

  // Live stream operations
  async createLiveStream(stream: Partial<LiveStream>): Promise<LiveStream> {
    const [newStream] = await db
      .insert(liveStreams)
      .values(stream as any)
      .returning();
    return newStream;
  }

  async getLiveStream(id: string): Promise<LiveStream | undefined> {
    const [stream] = await db
      .select()
      .from(liveStreams)
      .where(eq(liveStreams.id, id));
    return stream;
  }

  async getActiveLiveStreams(platform?: string): Promise<LiveStream[]> {
    const conditions = [eq(liveStreams.isLive, true)];
    if (platform) {
      conditions.push(eq(liveStreams.primaryPlatform, platform as any));
    }

    return db
      .select()
      .from(liveStreams)
      .where(and(...conditions))
      .orderBy(desc(liveStreams.viewerCount));
  }

  async updateLiveStream(
    id: string,
    updates: Partial<LiveStream>,
  ): Promise<LiveStream> {
    const [updated] = await db
      .update(liveStreams)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(liveStreams.id, id))
      .returning();
    return updated;
  }

  // Message operations
  async createMessage(message: Partial<Message>): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values(message as any)
      .returning();
    return newMessage;
  }

  async getConversation(
    userId1: string,
    userId2: string,
    platform?: string,
  ): Promise<Message[]> {
    const conditions = [
      or(
        and(eq(messages.senderId, userId1), eq(messages.receiverId, userId2)),
        and(eq(messages.senderId, userId2), eq(messages.receiverId, userId1)),
      ),
    ];

    if (platform) {
      conditions.push(eq(messages.platform, platform as any));
    }

    return db
      .select()
      .from(messages)
      .where(and(...conditions))
      .orderBy(desc(messages.createdAt));
  }

  async markMessagesAsRead(
    receiverId: string,
    senderId: string,
  ): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true, updatedAt: new Date() })
      .where(
        and(
          eq(messages.receiverId, receiverId),
          eq(messages.senderId, senderId),
          eq(messages.isRead, false),
        ),
      );
  }

  // Transaction operations
  async createTransaction(
    transaction: Partial<Transaction>,
  ): Promise<Transaction> {
    const [newTransaction] = await db
      .insert(transactions)
      .values(transaction as any)
      .returning();
    return newTransaction;
  }

  async getUserTransactions(
    userId: string,
    platform?: string,
  ): Promise<Transaction[]> {
    const conditions = [eq(transactions.userId, userId)];
    if (platform) {
      conditions.push(eq(transactions.platform, platform as any));
    }

    return db
      .select()
      .from(transactions)
      .where(and(...conditions))
      .orderBy(desc(transactions.createdAt));
  }

  // Audit log operations
  async createAuditLog(log: Partial<AuditLog>): Promise<AuditLog> {
    const [newLog] = await db
      .insert(auditLogs)
      .values(log as any)
      .returning();
    return newLog;
  }

  async getUserAuditLogs(
    userId: string,
    limit: number = 100,
  ): Promise<AuditLog[]> {
    return db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.userId, userId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
