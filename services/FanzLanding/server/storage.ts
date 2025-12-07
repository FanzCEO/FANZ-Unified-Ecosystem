import {
  type User,
  type InsertUser,
  type Creator,
  type InsertCreator,
  type Video,
  type InsertVideo,
  type VideoWithCreator,
  type CreatorWithStats,
  type ComplianceRecord,
  type InsertComplianceRecord,
  type DocumentUpload,
  type InsertDocumentUpload,
  type KycInformation,
  type InsertKycInformation,
  type Platform,
  type InsertPlatform,
  type Webhook,
  type InsertWebhook,
  type WebhookLog,
  type InsertWebhookLog,
  type Service,
  type InsertService,
  type ServiceWithStats,
  type AdSpace,
  type InsertAdSpace,
  type AdCampaign,
  type InsertAdCampaign,
  type AiTour,
  type InsertAiTour,
  type UserTourProgress,
  type InsertUserTourProgress,
  type WikiArticle,
  type InsertWikiArticle,
  type PolicyCategory,
  type InsertPolicyCategory,
  type PolicyDocument,
  type InsertPolicyDocument,
  type PolicyCompliance,
  type InsertPolicyCompliance,
  type AuditEvent,
  type InsertAuditEvent,
  type SecurityEvent,
  type InsertSecurityEvent,
  type ClusterConnection,
  type InsertClusterConnection,
  type PolicyCategoryWithDocuments,
  type PolicyDocumentWithCompliance,
  type UserComplianceStatus,
  users,
  creators,
  videos,
  complianceRecords,
  documentUploads,
  kycInformation,
  platforms,
  webhooks,
  webhookLogs,
  services,
  adSpaces,
  adCampaigns,
  aiTours,
  userTourProgress,
  wikiArticles,
  policyCategories,
  policyDocuments,
  policyCompliance,
  auditEvents,
  securityEvents,
  clusterConnections,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;

  // Creator methods
  getCreator(id: string): Promise<Creator | undefined>;
  getCreatorsByNetwork(network: string): Promise<CreatorWithStats[]>;
  getFeaturedCreators(): Promise<CreatorWithStats[]>;
  createCreator(creator: InsertCreator): Promise<Creator>;

  // Video methods
  getVideo(id: string): Promise<VideoWithCreator | undefined>;
  getFeaturedVideos(): Promise<VideoWithCreator[]>;
  getLatestVideos(): Promise<VideoWithCreator[]>;
  getTrendingVideos(): Promise<VideoWithCreator[]>;
  getVideosByCreator(creatorId: string): Promise<VideoWithCreator[]>;
  createVideo(video: InsertVideo): Promise<Video>;

  // Compliance methods
  createComplianceRecord(
    record: InsertComplianceRecord,
  ): Promise<ComplianceRecord>;
  getComplianceRecord(id: string): Promise<ComplianceRecord | undefined>;
  getComplianceRecordsByUser(userId: string): Promise<ComplianceRecord[]>;
  updateComplianceRecord(
    id: string,
    updates: Partial<ComplianceRecord>,
  ): Promise<ComplianceRecord>;

  // Document upload methods
  createDocumentUpload(document: InsertDocumentUpload): Promise<DocumentUpload>;
  getDocumentUpload(id: string): Promise<DocumentUpload | undefined>;
  getDocumentUploadsByUser(userId: string): Promise<DocumentUpload[]>;

  // KYC methods
  createKycInformation(kyc: InsertKycInformation): Promise<KycInformation>;
  getKycInformation(id: string): Promise<KycInformation | undefined>;
  getKycInformationByUser(userId: string): Promise<KycInformation | undefined>;
  updateKycInformation(
    id: string,
    updates: Partial<KycInformation>,
  ): Promise<KycInformation>;

  // Platform methods
  getAllPlatforms(): Promise<Platform[]>;
  getPlatform(id: string): Promise<Platform | undefined>;
  createPlatform(
    platform: InsertPlatform & { apiKey?: string; webhookSecret?: string },
  ): Promise<Platform>;
  updatePlatform(id: string, updates: Partial<Platform>): Promise<Platform>;
  deletePlatform(id: string): Promise<void>;

  // Webhook methods
  getWebhook(id: string): Promise<Webhook | undefined>;
  getWebhooksByPlatform(platformId: string): Promise<Webhook[]>;
  createWebhook(webhook: InsertWebhook): Promise<Webhook>;
  updateWebhook(id: string, updates: Partial<Webhook>): Promise<Webhook>;
  deleteWebhook(id: string): Promise<void>;

  // Webhook log methods
  createWebhookLog(log: InsertWebhookLog): Promise<WebhookLog>;
  getWebhookLogs(webhookId: string): Promise<WebhookLog[]>;

  // Service methods
  getAllServices(): Promise<Service[]>;
  getService(id: string): Promise<Service | undefined>;
  getServicesByCategory(category: string): Promise<Service[]>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: string, updates: Partial<Service>): Promise<Service>;
  deleteService(id: string): Promise<void>;

  // Ad space methods
  getAllAdSpaces(): Promise<AdSpace[]>;
  getAdSpace(id: string): Promise<AdSpace | undefined>;
  getAdSpacesByLocation(location: string): Promise<AdSpace[]>;
  createAdSpace(adSpace: InsertAdSpace): Promise<AdSpace>;
  updateAdSpace(id: string, updates: Partial<AdSpace>): Promise<AdSpace>;
  deleteAdSpace(id: string): Promise<void>;

  // Ad campaign methods
  getAllAdCampaigns(): Promise<AdCampaign[]>;
  getAdCampaign(id: string): Promise<AdCampaign | undefined>;
  getAdCampaignsByAdvertiser(advertiserId: string): Promise<AdCampaign[]>;
  getStarzAds(): Promise<AdCampaign[]>;
  createAdCampaign(campaign: InsertAdCampaign): Promise<AdCampaign>;
  updateAdCampaign(
    id: string,
    updates: Partial<AdCampaign>,
  ): Promise<AdCampaign>;
  deleteAdCampaign(id: string): Promise<void>;

  // AI tour methods
  getAllAiTours(): Promise<AiTour[]>;
  getAiTour(id: string): Promise<AiTour | undefined>;
  getAiToursByAudience(audience: string): Promise<AiTour[]>;
  createAiTour(tour: InsertAiTour): Promise<AiTour>;
  updateAiTour(id: string, updates: Partial<AiTour>): Promise<AiTour>;
  deleteAiTour(id: string): Promise<void>;

  // User tour progress methods
  getUserTourProgress(
    userId: string,
    tourId: string,
  ): Promise<UserTourProgress | undefined>;
  getUserTourProgressByUser(userId: string): Promise<UserTourProgress[]>;
  createUserTourProgress(
    progress: InsertUserTourProgress,
  ): Promise<UserTourProgress>;
  updateUserTourProgress(
    id: string,
    updates: Partial<UserTourProgress>,
  ): Promise<UserTourProgress>;

  // Wiki article methods
  getAllWikiArticles(): Promise<WikiArticle[]>;
  getWikiArticle(id: string): Promise<WikiArticle | undefined>;
  getWikiArticlesByCategory(category: string): Promise<WikiArticle[]>;
  searchWikiArticles(query: string): Promise<WikiArticle[]>;
  createWikiArticle(article: InsertWikiArticle): Promise<WikiArticle>;
  updateWikiArticle(
    id: string,
    updates: Partial<WikiArticle>,
  ): Promise<WikiArticle>;
  deleteWikiArticle(id: string): Promise<void>;

  // Policy management methods - Military-Grade Security Hub
  getAllPolicyCategories(): Promise<PolicyCategory[]>;
  getPolicyCategory(id: string): Promise<PolicyCategory | undefined>;
  getPolicyCategoryByName(name: string): Promise<PolicyCategory | undefined>;
  createPolicyCategory(category: InsertPolicyCategory): Promise<PolicyCategory>;
  updatePolicyCategory(
    id: string,
    updates: Partial<PolicyCategory>,
  ): Promise<PolicyCategory>;
  deletePolicyCategory(id: string): Promise<void>;

  // Policy document methods
  getAllPolicyDocuments(): Promise<PolicyDocument[]>;
  getPolicyDocument(id: string): Promise<PolicyDocument | undefined>;
  getPolicyDocumentsByCategory(categoryId: string): Promise<PolicyDocument[]>;
  getPolicyDocumentsByRole(role: string): Promise<PolicyDocument[]>;
  createPolicyDocument(document: InsertPolicyDocument): Promise<PolicyDocument>;
  updatePolicyDocument(
    id: string,
    updates: Partial<PolicyDocument>,
  ): Promise<PolicyDocument>;
  deletePolicyDocument(id: string): Promise<void>;

  // Policy compliance methods
  getPolicyCompliance(
    userId: string,
    policyId: string,
  ): Promise<PolicyCompliance | undefined>;
  getPolicyComplianceByUser(userId: string): Promise<PolicyCompliance[]>;
  createPolicyCompliance(
    compliance: InsertPolicyCompliance,
  ): Promise<PolicyCompliance>;
  updatePolicyCompliance(
    id: string,
    updates: Partial<PolicyCompliance>,
  ): Promise<PolicyCompliance>;
  getUserComplianceStatus(userId: string): Promise<UserComplianceStatus>;

  // Military-grade audit logging methods
  createAuditEvent(event: InsertAuditEvent): Promise<AuditEvent>;
  getLastAuditEvent(): Promise<AuditEvent | undefined>;
  getAuditEventsByUser(userId: string): Promise<AuditEvent[]>;
  getAuditEventsByType(eventType: string): Promise<AuditEvent[]>;
  getAuditEventsByTimeRange(
    startDate: Date,
    endDate: Date,
  ): Promise<AuditEvent[]>;
  searchAuditEvents(query: string): Promise<AuditEvent[]>;

  // Security event methods
  createSecurityEvent(event: InsertSecurityEvent): Promise<SecurityEvent>;
  getSecurityEvents(): Promise<SecurityEvent[]>;
  getUnresolvedSecurityEvents(): Promise<SecurityEvent[]>;
  getSecurityEventsByCluster(clusterId: string): Promise<SecurityEvent[]>;
  updateSecurityEvent(
    id: string,
    updates: Partial<SecurityEvent>,
  ): Promise<SecurityEvent>;

  // Cluster connection methods
  getAllClusterConnections(): Promise<ClusterConnection[]>;
  getClusterConnection(id: string): Promise<ClusterConnection | undefined>;
  getClusterConnectionByClusterId(
    clusterId: string,
  ): Promise<ClusterConnection | undefined>;
  createClusterConnection(
    connection: InsertClusterConnection,
  ): Promise<ClusterConnection>;
  updateClusterConnection(
    id: string,
    updates: Partial<ClusterConnection>,
  ): Promise<ClusterConnection>;
  updateClusterHeartbeat(clusterId: string): Promise<void>;
  getActiveClusterConnections(): Promise<ClusterConnection[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        password: insertUser.password, // In production, this should be hashed
      })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getCreator(id: string): Promise<Creator | undefined> {
    const [creator] = await db
      .select()
      .from(creators)
      .where(eq(creators.id, id));
    return creator;
  }

  async getCreatorsByNetwork(network: string): Promise<CreatorWithStats[]> {
    const creatorsResult = await db
      .select({
        id: creators.id,
        userId: creators.userId,
        displayName: creators.displayName,
        bio: creators.bio,
        avatar: creators.avatar,
        network: creators.network,
        isVerified: creators.isVerified,
        followers: creators.followers,
        createdAt: creators.createdAt,
      })
      .from(creators)
      .where(eq(creators.network, network))
      .limit(6);

    const creatorsWithStats = await Promise.all(
      creatorsResult.map(async (creator) => {
        const creatorVideos = await db
          .select()
          .from(videos)
          .where(eq(videos.creatorId, creator.id));
        const videoCount = creatorVideos.length;
        const totalViews = creatorVideos.reduce(
          (sum, video) => sum + (video.views || 0),
          0,
        );

        return {
          ...creator,
          videoCount,
          totalViews,
        };
      }),
    );

    return creatorsWithStats;
  }

  async getFeaturedCreators(): Promise<CreatorWithStats[]> {
    const creatorsResult = await db.select().from(creators).limit(6);

    const creatorsWithStats = await Promise.all(
      creatorsResult.map(async (creator) => {
        const creatorVideos = await db
          .select()
          .from(videos)
          .where(eq(videos.creatorId, creator.id));
        const videoCount = creatorVideos.length;
        const totalViews = creatorVideos.reduce(
          (sum, video) => sum + (video.views || 0),
          0,
        );

        return {
          ...creator,
          videoCount,
          totalViews,
        };
      }),
    );

    return creatorsWithStats;
  }

  async createCreator(insertCreator: InsertCreator): Promise<Creator> {
    const [creator] = await db
      .insert(creators)
      .values(insertCreator)
      .returning();
    return creator;
  }

  async getVideo(id: string): Promise<VideoWithCreator | undefined> {
    const result = await db
      .select({
        id: videos.id,
        creatorId: videos.creatorId,
        title: videos.title,
        description: videos.description,
        thumbnailUrl: videos.thumbnailUrl,
        videoUrl: videos.videoUrl,
        duration: videos.duration,
        quality: videos.quality,
        views: videos.views,
        likes: videos.likes,
        isFeatured: videos.isFeatured,
        tags: videos.tags,
        createdAt: videos.createdAt,
        creator: {
          id: creators.id,
          userId: creators.userId,
          displayName: creators.displayName,
          bio: creators.bio,
          avatar: creators.avatar,
          network: creators.network,
          isVerified: creators.isVerified,
          followers: creators.followers,
          createdAt: creators.createdAt,
        },
      })
      .from(videos)
      .innerJoin(creators, eq(videos.creatorId, creators.id))
      .where(eq(videos.id, id))
      .limit(1);

    if (result.length === 0) return undefined;

    const row = result[0];
    return {
      ...row,
      creator: row.creator,
    };
  }

  async getFeaturedVideos(): Promise<VideoWithCreator[]> {
    const result = await db
      .select({
        id: videos.id,
        creatorId: videos.creatorId,
        title: videos.title,
        description: videos.description,
        thumbnailUrl: videos.thumbnailUrl,
        videoUrl: videos.videoUrl,
        duration: videos.duration,
        quality: videos.quality,
        views: videos.views,
        likes: videos.likes,
        isFeatured: videos.isFeatured,
        tags: videos.tags,
        createdAt: videos.createdAt,
        creator: {
          id: creators.id,
          userId: creators.userId,
          displayName: creators.displayName,
          bio: creators.bio,
          avatar: creators.avatar,
          network: creators.network,
          isVerified: creators.isVerified,
          followers: creators.followers,
          createdAt: creators.createdAt,
        },
      })
      .from(videos)
      .innerJoin(creators, eq(videos.creatorId, creators.id))
      .where(eq(videos.isFeatured, true))
      .orderBy(desc(videos.views));

    return result.map((row) => ({
      ...row,
      creator: row.creator,
    }));
  }

  async getLatestVideos(): Promise<VideoWithCreator[]> {
    const result = await db
      .select({
        id: videos.id,
        creatorId: videos.creatorId,
        title: videos.title,
        description: videos.description,
        thumbnailUrl: videos.thumbnailUrl,
        videoUrl: videos.videoUrl,
        duration: videos.duration,
        quality: videos.quality,
        views: videos.views,
        likes: videos.likes,
        isFeatured: videos.isFeatured,
        tags: videos.tags,
        createdAt: videos.createdAt,
        creator: {
          id: creators.id,
          userId: creators.userId,
          displayName: creators.displayName,
          bio: creators.bio,
          avatar: creators.avatar,
          network: creators.network,
          isVerified: creators.isVerified,
          followers: creators.followers,
          createdAt: creators.createdAt,
        },
      })
      .from(videos)
      .innerJoin(creators, eq(videos.creatorId, creators.id))
      .orderBy(desc(videos.createdAt))
      .limit(8);

    return result.map((row) => ({
      ...row,
      creator: row.creator,
    }));
  }

  async getTrendingVideos(): Promise<VideoWithCreator[]> {
    const result = await db
      .select({
        id: videos.id,
        creatorId: videos.creatorId,
        title: videos.title,
        description: videos.description,
        thumbnailUrl: videos.thumbnailUrl,
        videoUrl: videos.videoUrl,
        duration: videos.duration,
        quality: videos.quality,
        views: videos.views,
        likes: videos.likes,
        isFeatured: videos.isFeatured,
        tags: videos.tags,
        createdAt: videos.createdAt,
        creator: {
          id: creators.id,
          userId: creators.userId,
          displayName: creators.displayName,
          bio: creators.bio,
          avatar: creators.avatar,
          network: creators.network,
          isVerified: creators.isVerified,
          followers: creators.followers,
          createdAt: creators.createdAt,
        },
      })
      .from(videos)
      .innerJoin(creators, eq(videos.creatorId, creators.id))
      .orderBy(desc(videos.views))
      .limit(8);

    return result.map((row) => ({
      ...row,
      creator: row.creator,
    }));
  }

  async getVideosByCreator(creatorId: string): Promise<VideoWithCreator[]> {
    const result = await db
      .select({
        id: videos.id,
        creatorId: videos.creatorId,
        title: videos.title,
        description: videos.description,
        thumbnailUrl: videos.thumbnailUrl,
        videoUrl: videos.videoUrl,
        duration: videos.duration,
        quality: videos.quality,
        views: videos.views,
        likes: videos.likes,
        isFeatured: videos.isFeatured,
        tags: videos.tags,
        createdAt: videos.createdAt,
        creator: {
          id: creators.id,
          userId: creators.userId,
          displayName: creators.displayName,
          bio: creators.bio,
          avatar: creators.avatar,
          network: creators.network,
          isVerified: creators.isVerified,
          followers: creators.followers,
          createdAt: creators.createdAt,
        },
      })
      .from(videos)
      .innerJoin(creators, eq(videos.creatorId, creators.id))
      .where(eq(videos.creatorId, creatorId));

    return result.map((row) => ({
      ...row,
      creator: row.creator,
    }));
  }

  async createVideo(insertVideo: InsertVideo): Promise<Video> {
    const [video] = await db.insert(videos).values(insertVideo).returning();
    return video;
  }

  // Compliance methods
  async createComplianceRecord(
    record: InsertComplianceRecord,
  ): Promise<ComplianceRecord> {
    const [complianceRecord] = await db
      .insert(complianceRecords)
      .values(record)
      .returning();
    return complianceRecord;
  }

  async getComplianceRecord(id: string): Promise<ComplianceRecord | undefined> {
    const [record] = await db
      .select()
      .from(complianceRecords)
      .where(eq(complianceRecords.id, id));
    return record;
  }

  async getComplianceRecordsByUser(
    userId: string,
  ): Promise<ComplianceRecord[]> {
    return await db
      .select()
      .from(complianceRecords)
      .where(eq(complianceRecords.userId, userId));
  }

  async updateComplianceRecord(
    id: string,
    updates: Partial<ComplianceRecord>,
  ): Promise<ComplianceRecord> {
    const [record] = await db
      .update(complianceRecords)
      .set(updates)
      .where(eq(complianceRecords.id, id))
      .returning();
    return record;
  }

  // Document upload methods
  async createDocumentUpload(
    document: InsertDocumentUpload,
  ): Promise<DocumentUpload> {
    const [upload] = await db
      .insert(documentUploads)
      .values(document)
      .returning();
    return upload;
  }

  async getDocumentUpload(id: string): Promise<DocumentUpload | undefined> {
    const [upload] = await db
      .select()
      .from(documentUploads)
      .where(eq(documentUploads.id, id));
    return upload;
  }

  async getDocumentUploadsByUser(userId: string): Promise<DocumentUpload[]> {
    return await db
      .select()
      .from(documentUploads)
      .where(eq(documentUploads.userId, userId));
  }

  // KYC methods
  async createKycInformation(
    kyc: InsertKycInformation,
  ): Promise<KycInformation> {
    const [kycInfo] = await db.insert(kycInformation).values(kyc).returning();
    return kycInfo;
  }

  async getKycInformation(id: string): Promise<KycInformation | undefined> {
    const [kyc] = await db
      .select()
      .from(kycInformation)
      .where(eq(kycInformation.id, id));
    return kyc;
  }

  async getKycInformationByUser(
    userId: string,
  ): Promise<KycInformation | undefined> {
    const [kyc] = await db
      .select()
      .from(kycInformation)
      .where(eq(kycInformation.userId, userId));
    return kyc;
  }

  async updateKycInformation(
    id: string,
    updates: Partial<KycInformation>,
  ): Promise<KycInformation> {
    const [kyc] = await db
      .update(kycInformation)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(kycInformation.id, id))
      .returning();
    return kyc;
  }

  // Platform methods
  async getAllPlatforms(): Promise<Platform[]> {
    return await db.select().from(platforms).orderBy(desc(platforms.createdAt));
  }

  async getPlatform(id: string): Promise<Platform | undefined> {
    const [platform] = await db
      .select()
      .from(platforms)
      .where(eq(platforms.id, id));
    return platform;
  }

  async createPlatform(
    platform: InsertPlatform & { apiKey?: string; webhookSecret?: string },
  ): Promise<Platform> {
    const [newPlatform] = await db
      .insert(platforms)
      .values(platform)
      .returning();
    return newPlatform;
  }

  async updatePlatform(
    id: string,
    updates: Partial<Platform>,
  ): Promise<Platform> {
    const [updatedPlatform] = await db
      .update(platforms)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(platforms.id, id))
      .returning();
    return updatedPlatform;
  }

  async deletePlatform(id: string): Promise<void> {
    await db.delete(platforms).where(eq(platforms.id, id));
  }

  // Webhook methods
  async getWebhook(id: string): Promise<Webhook | undefined> {
    const [webhook] = await db
      .select()
      .from(webhooks)
      .where(eq(webhooks.id, id));
    return webhook;
  }

  async getWebhooksByPlatform(platformId: string): Promise<Webhook[]> {
    return await db
      .select()
      .from(webhooks)
      .where(eq(webhooks.platformId, platformId));
  }

  async createWebhook(webhook: InsertWebhook): Promise<Webhook> {
    const [newWebhook] = await db.insert(webhooks).values(webhook).returning();
    return newWebhook;
  }

  async updateWebhook(id: string, updates: Partial<Webhook>): Promise<Webhook> {
    const [updatedWebhook] = await db
      .update(webhooks)
      .set(updates)
      .where(eq(webhooks.id, id))
      .returning();
    return updatedWebhook;
  }

  async deleteWebhook(id: string): Promise<void> {
    await db.delete(webhooks).where(eq(webhooks.id, id));
  }

  // Webhook log methods
  async createWebhookLog(log: InsertWebhookLog): Promise<WebhookLog> {
    const [newLog] = await db.insert(webhookLogs).values(log).returning();
    return newLog;
  }

  async getWebhookLogs(webhookId: string): Promise<WebhookLog[]> {
    return await db
      .select()
      .from(webhookLogs)
      .where(eq(webhookLogs.webhookId, webhookId))
      .orderBy(desc(webhookLogs.createdAt));
  }

  // Service methods
  async getAllServices(): Promise<Service[]> {
    return await db
      .select()
      .from(services)
      .where(eq(services.isActive, true))
      .orderBy(services.category, services.name);
  }

  async getService(id: string): Promise<Service | undefined> {
    const [service] = await db
      .select()
      .from(services)
      .where(eq(services.id, id));
    return service;
  }

  async getServicesByCategory(category: string): Promise<Service[]> {
    return await db
      .select()
      .from(services)
      .where(and(eq(services.category, category), eq(services.isActive, true)))
      .orderBy(services.name);
  }

  async createService(service: InsertService): Promise<Service> {
    const [newService] = await db.insert(services).values(service).returning();
    return newService;
  }

  async updateService(id: string, updates: Partial<Service>): Promise<Service> {
    const [updatedService] = await db
      .update(services)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(services.id, id))
      .returning();
    return updatedService;
  }

  async deleteService(id: string): Promise<void> {
    await db
      .update(services)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(services.id, id));
  }

  // Ad space methods
  async getAllAdSpaces(): Promise<AdSpace[]> {
    return await db
      .select()
      .from(adSpaces)
      .where(eq(adSpaces.isActive, true))
      .orderBy(desc(adSpaces.priority), adSpaces.name);
  }

  async getAdSpace(id: string): Promise<AdSpace | undefined> {
    const [adSpace] = await db
      .select()
      .from(adSpaces)
      .where(eq(adSpaces.id, id));
    return adSpace;
  }

  async getAdSpacesByLocation(location: string): Promise<AdSpace[]> {
    return await db
      .select()
      .from(adSpaces)
      .where(and(eq(adSpaces.location, location), eq(adSpaces.isActive, true)))
      .orderBy(desc(adSpaces.priority));
  }

  async createAdSpace(adSpace: InsertAdSpace): Promise<AdSpace> {
    const [newAdSpace] = await db.insert(adSpaces).values(adSpace).returning();
    return newAdSpace;
  }

  async updateAdSpace(id: string, updates: Partial<AdSpace>): Promise<AdSpace> {
    const [updatedAdSpace] = await db
      .update(adSpaces)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(adSpaces.id, id))
      .returning();
    return updatedAdSpace;
  }

  async deleteAdSpace(id: string): Promise<void> {
    await db
      .update(adSpaces)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(adSpaces.id, id));
  }

  // Ad campaign methods
  async getAllAdCampaigns(): Promise<AdCampaign[]> {
    return await db
      .select()
      .from(adCampaigns)
      .orderBy(desc(adCampaigns.createdAt));
  }

  async getAdCampaign(id: string): Promise<AdCampaign | undefined> {
    const [campaign] = await db
      .select()
      .from(adCampaigns)
      .where(eq(adCampaigns.id, id));
    return campaign;
  }

  async getAdCampaignsByAdvertiser(
    advertiserId: string,
  ): Promise<AdCampaign[]> {
    return await db
      .select()
      .from(adCampaigns)
      .where(eq(adCampaigns.advertiserId, advertiserId))
      .orderBy(desc(adCampaigns.createdAt));
  }

  async getStarzAds(): Promise<AdCampaign[]> {
    return await db
      .select()
      .from(adCampaigns)
      .where(
        and(eq(adCampaigns.isStarzAd, true), eq(adCampaigns.status, "active")),
      )
      .orderBy(desc(adCampaigns.impressions));
  }

  async createAdCampaign(campaign: InsertAdCampaign): Promise<AdCampaign> {
    const [newCampaign] = await db
      .insert(adCampaigns)
      .values(campaign)
      .returning();
    return newCampaign;
  }

  async updateAdCampaign(
    id: string,
    updates: Partial<AdCampaign>,
  ): Promise<AdCampaign> {
    const [updatedCampaign] = await db
      .update(adCampaigns)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(adCampaigns.id, id))
      .returning();
    return updatedCampaign;
  }

  async deleteAdCampaign(id: string): Promise<void> {
    await db.delete(adCampaigns).where(eq(adCampaigns.id, id));
  }

  // AI tour methods
  async getAllAiTours(): Promise<AiTour[]> {
    return await db
      .select()
      .from(aiTours)
      .where(eq(aiTours.isActive, true))
      .orderBy(desc(aiTours.averageRating), desc(aiTours.completionRate));
  }

  async getAiTour(id: string): Promise<AiTour | undefined> {
    const [tour] = await db.select().from(aiTours).where(eq(aiTours.id, id));
    return tour;
  }

  async getAiToursByAudience(audience: string): Promise<AiTour[]> {
    return await db
      .select()
      .from(aiTours)
      .where(
        and(
          or(
            eq(aiTours.targetAudience, audience),
            eq(aiTours.targetAudience, "all"),
          ),
          eq(aiTours.isActive, true),
        ),
      )
      .orderBy(desc(aiTours.averageRating));
  }

  async createAiTour(tour: InsertAiTour): Promise<AiTour> {
    const [newTour] = await db.insert(aiTours).values(tour).returning();
    return newTour;
  }

  async updateAiTour(id: string, updates: Partial<AiTour>): Promise<AiTour> {
    const [updatedTour] = await db
      .update(aiTours)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(aiTours.id, id))
      .returning();
    return updatedTour;
  }

  async deleteAiTour(id: string): Promise<void> {
    await db
      .update(aiTours)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(aiTours.id, id));
  }

  // User tour progress methods
  async getUserTourProgress(
    userId: string,
    tourId: string,
  ): Promise<UserTourProgress | undefined> {
    const [progress] = await db
      .select()
      .from(userTourProgress)
      .where(
        and(
          eq(userTourProgress.userId, userId),
          eq(userTourProgress.tourId, tourId),
        ),
      );
    return progress;
  }

  async getUserTourProgressByUser(userId: string): Promise<UserTourProgress[]> {
    return await db
      .select()
      .from(userTourProgress)
      .where(eq(userTourProgress.userId, userId))
      .orderBy(desc(userTourProgress.lastActiveAt));
  }

  async createUserTourProgress(
    progress: InsertUserTourProgress,
  ): Promise<UserTourProgress> {
    const [newProgress] = await db
      .insert(userTourProgress)
      .values(progress)
      .returning();
    return newProgress;
  }

  async updateUserTourProgress(
    id: string,
    updates: Partial<UserTourProgress>,
  ): Promise<UserTourProgress> {
    const [updatedProgress] = await db
      .update(userTourProgress)
      .set({ ...updates, lastActiveAt: new Date() })
      .where(eq(userTourProgress.id, id))
      .returning();
    return updatedProgress;
  }

  // Wiki article methods
  async getAllWikiArticles(): Promise<WikiArticle[]> {
    return await db
      .select()
      .from(wikiArticles)
      .where(eq(wikiArticles.isPublished, true))
      .orderBy(desc(wikiArticles.views), desc(wikiArticles.updatedAt));
  }

  async getWikiArticle(id: string): Promise<WikiArticle | undefined> {
    const [article] = await db
      .select()
      .from(wikiArticles)
      .where(eq(wikiArticles.id, id));
    return article;
  }

  async getWikiArticlesByCategory(category: string): Promise<WikiArticle[]> {
    return await db
      .select()
      .from(wikiArticles)
      .where(
        and(
          eq(wikiArticles.category, category),
          eq(wikiArticles.isPublished, true),
        ),
      )
      .orderBy(desc(wikiArticles.views));
  }

  async searchWikiArticles(query: string): Promise<WikiArticle[]> {
    // Note: This is a basic implementation. In production, you'd want to use full-text search
    const searchTerm = `%${query.toLowerCase()}%`;
    return await db
      .select()
      .from(wikiArticles)
      .where(
        and(
          eq(wikiArticles.isPublished, true),
          or(
            // Use SQL lower() function for case-insensitive search
            db
              .select({})
              .from(wikiArticles)
              .where(sql`lower(${wikiArticles.title}) LIKE ${searchTerm}`),
            db
              .select({})
              .from(wikiArticles)
              .where(sql`lower(${wikiArticles.content}) LIKE ${searchTerm}`),
          ),
        ),
      )
      .orderBy(desc(wikiArticles.helpfulVotes));
  }

  async createWikiArticle(article: InsertWikiArticle): Promise<WikiArticle> {
    const [newArticle] = await db
      .insert(wikiArticles)
      .values(article)
      .returning();
    return newArticle;
  }

  async updateWikiArticle(
    id: string,
    updates: Partial<WikiArticle>,
  ): Promise<WikiArticle> {
    const [updatedArticle] = await db
      .update(wikiArticles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(wikiArticles.id, id))
      .returning();
    return updatedArticle;
  }

  async deleteWikiArticle(id: string): Promise<void> {
    await db
      .update(wikiArticles)
      .set({ isPublished: false, updatedAt: new Date() })
      .where(eq(wikiArticles.id, id));
  }

  // Policy management methods - Military-Grade Security Hub
  async getAllPolicyCategories(): Promise<PolicyCategory[]> {
    return await db
      .select()
      .from(policyCategories)
      .where(eq(policyCategories.isActive, true))
      .orderBy(policyCategories.displayName);
  }

  async getPolicyCategory(id: string): Promise<PolicyCategory | undefined> {
    const [category] = await db
      .select()
      .from(policyCategories)
      .where(eq(policyCategories.id, id));
    return category;
  }

  async getPolicyCategoryByName(
    name: string,
  ): Promise<PolicyCategory | undefined> {
    const [category] = await db
      .select()
      .from(policyCategories)
      .where(eq(policyCategories.name, name));
    return category;
  }

  async createPolicyCategory(
    category: InsertPolicyCategory,
  ): Promise<PolicyCategory> {
    const [newCategory] = await db
      .insert(policyCategories)
      .values(category)
      .returning();
    return newCategory;
  }

  async updatePolicyCategory(
    id: string,
    updates: Partial<PolicyCategory>,
  ): Promise<PolicyCategory> {
    const [updatedCategory] = await db
      .update(policyCategories)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(policyCategories.id, id))
      .returning();
    return updatedCategory;
  }

  async deletePolicyCategory(id: string): Promise<void> {
    await db
      .update(policyCategories)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(policyCategories.id, id));
  }

  // Policy document methods
  async getAllPolicyDocuments(): Promise<PolicyDocument[]> {
    return await db
      .select()
      .from(policyDocuments)
      .where(eq(policyDocuments.isActive, true))
      .orderBy(policyDocuments.priority, desc(policyDocuments.effectiveDate));
  }

  async getPolicyDocument(id: string): Promise<PolicyDocument | undefined> {
    const [document] = await db
      .select()
      .from(policyDocuments)
      .where(eq(policyDocuments.id, id));
    return document;
  }

  async getPolicyDocumentsByCategory(
    categoryId: string,
  ): Promise<PolicyDocument[]> {
    return await db
      .select()
      .from(policyDocuments)
      .where(
        and(
          eq(policyDocuments.categoryId, categoryId),
          eq(policyDocuments.isActive, true),
        ),
      )
      .orderBy(policyDocuments.priority, desc(policyDocuments.effectiveDate));
  }

  async getPolicyDocumentsByRole(role: string): Promise<PolicyDocument[]> {
    return await db
      .select()
      .from(policyDocuments)
      .where(
        and(
          sql`${policyDocuments.targetRoles} @> ${[role]}`,
          eq(policyDocuments.isActive, true),
        ),
      )
      .orderBy(policyDocuments.priority, desc(policyDocuments.effectiveDate));
  }

  async createPolicyDocument(
    document: InsertPolicyDocument,
  ): Promise<PolicyDocument> {
    const [newDocument] = await db
      .insert(policyDocuments)
      .values(document)
      .returning();
    return newDocument;
  }

  async updatePolicyDocument(
    id: string,
    updates: Partial<PolicyDocument>,
  ): Promise<PolicyDocument> {
    const [updatedDocument] = await db
      .update(policyDocuments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(policyDocuments.id, id))
      .returning();
    return updatedDocument;
  }

  async deletePolicyDocument(id: string): Promise<void> {
    await db
      .update(policyDocuments)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(policyDocuments.id, id));
  }

  // Policy compliance methods
  async getPolicyCompliance(
    userId: string,
    policyId: string,
  ): Promise<PolicyCompliance | undefined> {
    const [compliance] = await db
      .select()
      .from(policyCompliance)
      .where(
        and(
          eq(policyCompliance.userId, userId),
          eq(policyCompliance.policyId, policyId),
        ),
      );
    return compliance;
  }

  async getPolicyComplianceByUser(
    userId: string,
  ): Promise<PolicyCompliance[]> {
    return await db
      .select()
      .from(policyCompliance)
      .where(eq(policyCompliance.userId, userId))
      .orderBy(desc(policyCompliance.createdAt));
  }

  async createPolicyCompliance(
    compliance: InsertPolicyCompliance,
  ): Promise<PolicyCompliance> {
    const [newCompliance] = await db
      .insert(policyCompliance)
      .values(compliance)
      .returning();
    return newCompliance;
  }

  async updatePolicyCompliance(
    id: string,
    updates: Partial<PolicyCompliance>,
  ): Promise<PolicyCompliance> {
    const [updatedCompliance] = await db
      .update(policyCompliance)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(policyCompliance.id, id))
      .returning();
    return updatedCompliance;
  }

  async getUserComplianceStatus(
    userId: string,
  ): Promise<UserComplianceStatus> {
    // Get user's role for policy filtering
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Get applicable policies for user's role
    const applicablePolicies = await db
      .select()
      .from(policyDocuments)
      .where(
        and(
          sql`${policyDocuments.targetRoles} @> ${[user.role]}`,
          eq(policyDocuments.isActive, true),
          eq(policyDocuments.complianceRequired, true),
        ),
      );

    // Get user's compliance records
    const userCompliance = await this.getPolicyComplianceByUser(userId);

    const totalPolicies = applicablePolicies.length;
    const compliantPolicies = userCompliance.filter(
      (c) => c.status === "compliant" || c.status === "acknowledged",
    ).length;
    const pendingPolicies = userCompliance.filter(
      (c) => c.status === "pending",
    ).length;

    // Check for expired compliance
    const expiredPolicies = userCompliance.filter(
      (c) =>
        c.expirationDate && new Date(c.expirationDate) < new Date(),
    ).length;

    return {
      userId,
      totalPolicies,
      compliantPolicies,
      pendingPolicies,
      expiredPolicies,
      complianceRate: totalPolicies > 0 ? (compliantPolicies / totalPolicies) * 100 : 0,
      lastUpdate: new Date(),
    };
  }

  // Military-grade audit logging methods
  async createAuditEvent(event: InsertAuditEvent): Promise<AuditEvent> {
    let hashChain = event.hashChain;
    
    // Generate hash chain only if not provided (backward compatibility)
    if (!hashChain) {
      const previousEvent = await db
        .select()
        .from(auditEvents)
        .orderBy(desc(auditEvents.createdAt))
        .limit(1);

      const hashData = JSON.stringify({
        ...event,
        previousHash: previousEvent[0]?.hashChain || "genesis",
        timestamp: new Date().toISOString(),
      });

      const crypto = await import("crypto");
      hashChain = crypto.createHash("sha256").update(hashData).digest("hex");
    }

    const [newEvent] = await db
      .insert(auditEvents)
      .values({ ...event, hashChain })
      .returning();
    return newEvent;
  }

  async getLastAuditEvent(): Promise<AuditEvent | undefined> {
    const events = await db
      .select()
      .from(auditEvents)
      .orderBy(desc(auditEvents.createdAt))
      .limit(1);
    
    return events[0];
  }

  async getAuditEventsByUser(userId: string): Promise<AuditEvent[]> {
    return await db
      .select()
      .from(auditEvents)
      .where(eq(auditEvents.userId, userId))
      .orderBy(desc(auditEvents.createdAt))
      .limit(1000);
  }

  async getAuditEventsByType(eventType: string): Promise<AuditEvent[]> {
    return await db
      .select()
      .from(auditEvents)
      .where(eq(auditEvents.eventType, eventType))
      .orderBy(desc(auditEvents.createdAt))
      .limit(1000);
  }

  async getAuditEventsByTimeRange(
    startDate: Date,
    endDate: Date,
  ): Promise<AuditEvent[]> {
    return await db
      .select()
      .from(auditEvents)
      .where(
        and(
          sql`${auditEvents.createdAt} >= ${startDate}`,
          sql`${auditEvents.createdAt} <= ${endDate}`,
        ),
      )
      .orderBy(desc(auditEvents.createdAt))
      .limit(10000);
  }

  async searchAuditEvents(query: string): Promise<AuditEvent[]> {
    return await db
      .select()
      .from(auditEvents)
      .where(
        or(
          sql`${auditEvents.eventDescription} ILIKE ${"%" + query + "%"}`,
          sql`${auditEvents.eventCategory} ILIKE ${"%" + query + "%"}`,
          sql`${auditEvents.resourceType} ILIKE ${"%" + query + "%"}`,
        ),
      )
      .orderBy(desc(auditEvents.createdAt))
      .limit(500);
  }

  // Security event methods
  async createSecurityEvent(event: InsertSecurityEvent): Promise<SecurityEvent> {
    const [newEvent] = await db
      .insert(securityEvents)
      .values(event)
      .returning();
    return newEvent;
  }

  async getSecurityEvents(): Promise<SecurityEvent[]> {
    return await db
      .select()
      .from(securityEvents)
      .orderBy(desc(securityEvents.createdAt))
      .limit(1000);
  }

  async getUnresolvedSecurityEvents(): Promise<SecurityEvent[]> {
    return await db
      .select()
      .from(securityEvents)
      .where(eq(securityEvents.isResolved, false))
      .orderBy(desc(securityEvents.createdAt));
  }

  async getSecurityEventsByCluster(clusterId: string): Promise<SecurityEvent[]> {
    return await db
      .select()
      .from(securityEvents)
      .where(eq(securityEvents.clusterId, clusterId))
      .orderBy(desc(securityEvents.createdAt))
      .limit(500);
  }

  async updateSecurityEvent(
    id: string,
    updates: Partial<SecurityEvent>,
  ): Promise<SecurityEvent> {
    const [updatedEvent] = await db
      .update(securityEvents)
      .set(updates)
      .where(eq(securityEvents.id, id))
      .returning();
    return updatedEvent;
  }

  // Cluster connection methods
  async getAllClusterConnections(): Promise<ClusterConnection[]> {
    return await db
      .select()
      .from(clusterConnections)
      .where(eq(clusterConnections.isActive, true))
      .orderBy(clusterConnections.clusterName);
  }

  async getClusterConnection(id: string): Promise<ClusterConnection | undefined> {
    const [connection] = await db
      .select()
      .from(clusterConnections)
      .where(eq(clusterConnections.id, id));
    return connection;
  }

  async getClusterConnectionByClusterId(
    clusterId: string,
  ): Promise<ClusterConnection | undefined> {
    const [connection] = await db
      .select()
      .from(clusterConnections)
      .where(eq(clusterConnections.clusterId, clusterId));
    return connection;
  }

  async createClusterConnection(
    connection: InsertClusterConnection,
  ): Promise<ClusterConnection> {
    const [newConnection] = await db
      .insert(clusterConnections)
      .values(connection)
      .returning();
    return newConnection;
  }

  async updateClusterConnection(
    id: string,
    updates: Partial<ClusterConnection>,
  ): Promise<ClusterConnection> {
    const [updatedConnection] = await db
      .update(clusterConnections)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(clusterConnections.id, id))
      .returning();
    return updatedConnection;
  }

  async updateClusterHeartbeat(clusterId: string): Promise<void> {
    await db
      .update(clusterConnections)
      .set({ 
        lastHeartbeat: new Date(),
        lastConnectionAttempt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(clusterConnections.clusterId, clusterId));
  }

  async getActiveClusterConnections(): Promise<ClusterConnection[]> {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    return await db
      .select()
      .from(clusterConnections)
      .where(
        and(
          eq(clusterConnections.isActive, true),
          eq(clusterConnections.status, "active"),
          sql`${clusterConnections.lastHeartbeat} > ${thirtyMinutesAgo}`,
        ),
      )
      .orderBy(clusterConnections.clusterName);
  }
}

// Initialize sample data for development if tables are empty
async function initializeSampleData() {
  try {
    // Check if we already have platforms data specifically
    const existingPlatforms = await db.select().from(platforms).limit(1);
    if (existingPlatforms.length > 0) {
      console.log("Sample data already exists, skipping initialization");
      return; // Data already exists
    }

    console.log("Initializing sample data for FUN platform...");

    // Initialize platforms first
    const platformsData = [
      {
        domain: "boyfanz.myfanz.network",
        name: "BoyFanz",
        type: "primary",
        targetNetwork: "boyfanz",
        repositoryName: "boyfanz-web",
        settings: { theme: "purple", primaryColor: "#8B5CF6" },
      },
      {
        domain: "girlfanz.myfanz.network",
        name: "GirlFanz",
        type: "primary",
        targetNetwork: "girlfanz",
        repositoryName: "girlfanz-web",
        settings: { theme: "pink", primaryColor: "#EC4899" },
      },
      {
        domain: "transfanz.myfanz.network",
        name: "TransFanz",
        type: "primary",
        targetNetwork: "transfanz",
        repositoryName: "transfanz-web",
        settings: { theme: "rainbow", primaryColor: "#06B6D4" },
      },
      {
        domain: "pupfanz.myfanz.network",
        name: "PupFanz",
        type: "primary",
        targetNetwork: "pupfanz",
        repositoryName: "pupfanz-web",
        settings: { theme: "orange", primaryColor: "#F97316" },
      },
      {
        domain: "daddiesfanz.myfanz.network",
        name: "DaddyFanz",
        type: "primary",
        targetNetwork: "daddiesfanz",
        repositoryName: "daddiesfanz-web",
        settings: { theme: "dark", primaryColor: "#1F2937" },
      },
      {
        domain: "kinkfanz.myfanz.network",
        name: "KinkFanz",
        type: "primary",
        targetNetwork: "kinkfanz",
        repositoryName: "kinkfanz-web",
        settings: { theme: "red", primaryColor: "#EF4444" },
      },
    ];

    await Promise.all(
      platformsData.map((platform) => db.insert(platforms).values(platform)),
    );

    // Create system user for wiki articles
    const systemUser = await db
      .insert(users)
      .values({
        username: "system",
        email: "system@fanzunlimited.com",
        password: "system_password_hash",
        firstName: "System",
        lastName: "Administrator",
        role: "admin",
        isVerified: true,
        isActive: true,
      })
      .returning();

    // Initialize services
    const servicesData = [
      {
        name: "FanzWork",
        displayName: "FanzWork - Freelancer Marketplace",
        description:
          "Complete freelancer marketplace for content creators, offering gigs, services, and collaboration opportunities across all creative fields.",
        category: "marketplace",
        url: "https://fanzwork.myfanz.network",
        apiEndpoint: "https://api.fanzwork.myfanz.network",
        webhookUrl: "https://webhooks.fanzwork.myfanz.network/events",
        isInternal: true,
        icon: "briefcase",
        features: [
          "Gig marketplace",
          "Service listings",
          "Collaboration tools",
          "Payment processing",
          "Rating system",
        ],
      },
      {
        name: "FanzRadioPod",
        displayName: "FanzRadio - Live Shows & Podcasts",
        description:
          "Live radio shows and podcasts platform for creators to broadcast, record, and distribute audio content with real-time interaction.",
        category: "media",
        url: "https://fanzradio.myfanz.network",
        apiEndpoint: "https://api.fanzradio.myfanz.network",
        webhookUrl: "https://webhooks.fanzradio.myfanz.network/events",
        isInternal: true,
        icon: "radio",
        features: [
          "Live streaming",
          "Podcast hosting",
          "Audio recording",
          "Real-time chat",
          "Episode management",
        ],
      },
      {
        name: "FanzTube",
        displayName: "FanzTube - Aggregated Adult Media",
        description:
          "Comprehensive adult media aggregation platform that curates and organizes content from across the FUN network.",
        category: "media",
        url: "https://fanztube.myfanz.network",
        apiEndpoint: "https://api.fanztube.myfanz.network",
        webhookUrl: "https://webhooks.fanztube.myfanz.network/events",
        isInternal: true,
        icon: "video",
        features: [
          "Content aggregation",
          "Advanced search",
          "Curated playlists",
          "Recommendation engine",
          "Cross-platform sync",
        ],
      },
      {
        name: "FanzCock",
        displayName: "FanzCock - Short-Form Adult Content",
        description:
          "TikTok-style platform for adult media paired with FanzReels, offering short-form vertical video content with engaging interactions.",
        category: "social",
        url: "https://fanzcock.myfanz.network",
        apiEndpoint: "https://api.fanzcock.myfanz.network",
        webhookUrl: "https://webhooks.fanzcock.myfanz.network/events",
        isInternal: true,
        icon: "smartphone",
        features: [
          "Short-form videos",
          "Vertical format",
          "Viral algorithms",
          "Social interactions",
          "FanzReels integration",
        ],
      },
      {
        name: "FanzCentral",
        displayName: "FanzCentral - Creator Platform Hub",
        description:
          "All-in-one app-based platform for content creators from all walks of life, providing comprehensive creator tools and analytics.",
        category: "tools",
        url: "https://fanzcentral.myfanz.network",
        apiEndpoint: "https://api.fanzcentral.myfanz.network",
        webhookUrl: "https://webhooks.fanzcentral.myfanz.network/events",
        isInternal: true,
        icon: "users",
        features: [
          "Creator dashboard",
          "Analytics suite",
          "Content management",
          "Fan engagement tools",
          "Revenue tracking",
        ],
      },
      {
        name: "FanzForge",
        displayName: "FanzForge - App Creator Studio",
        description:
          "Replit-inspired app creator platform that lets users build, deploy, and manage their own applications with ease.",
        category: "development",
        url: "https://fanzforge.myfanz.network",
        apiEndpoint: "https://api.fanzforge.myfanz.network",
        webhookUrl: "https://webhooks.fanzforge.myfanz.network/events",
        isInternal: true,
        icon: "cpu",
        features: [
          "Visual app builder",
          "Cloud deployment",
          "Real-time collaboration",
          "Template library",
          "API integrations",
        ],
      },
      {
        name: "FanzVarsity",
        displayName: "FanzVarsity - Creator Education University",
        description:
          "Comprehensive educational platform offering real courses on content creation, legal compliance, and industry best practices.",
        category: "education",
        url: "https://fanzvarsity.myfanz.network",
        apiEndpoint: "https://api.fanzvarsity.myfanz.network",
        webhookUrl: "https://webhooks.fanzvarsity.myfanz.network/events",
        isInternal: true,
        icon: "graduation-cap",
        features: [
          "Course catalog",
          "Live workshops",
          "Certification programs",
          "Legal compliance training",
          "Industry mentorship",
        ],
      },
      {
        name: "FanzLink",
        displayName: "FanzLink - Link in Bio Hub",
        description:
          "Advanced link-in-bio platform that creates comprehensive landing pages for creators to showcase all their content and services.",
        category: "tools",
        url: "https://fanzlink.myfanz.network",
        apiEndpoint: "https://api.fanzlink.myfanz.network",
        webhookUrl: "https://webhooks.fanzlink.myfanz.network/events",
        isInternal: true,
        icon: "link",
        features: [
          "Custom landing pages",
          "Link management",
          "Analytics tracking",
          "Social media integration",
          "QR code generation",
        ],
      },
      {
        name: "FanzCommerce",
        displayName: "FanzCommerce - POD & Dropship Store",
        description:
          "Complete e-commerce solution similar to Shopify, offering print-on-demand and dropshipping capabilities for creators.",
        category: "commerce",
        url: "https://fanzcommerce.myfanz.network",
        apiEndpoint: "https://api.fanzcommerce.myfanz.network",
        webhookUrl: "https://webhooks.fanzcommerce.myfanz.network/events",
        isInternal: true,
        icon: "shopping-cart",
        features: [
          "Store builder",
          "POD integration",
          "Dropshipping tools",
          "Payment processing",
          "Inventory management",
        ],
      },
      {
        name: "StarzStudio",
        displayName: "Starz Studio - AI Creator Suite",
        description:
          "Comprehensive suite of AI-powered tools and advancements specifically designed to enhance Starz creator capabilities.",
        category: "ai-tools",
        url: "https://starzstudio.myfanz.network",
        apiEndpoint: "https://api.starzstudio.myfanz.network",
        webhookUrl: "https://webhooks.starzstudio.myfanz.network/events",
        isInternal: true,
        icon: "sparkles",
        features: [
          "AI content generation",
          "Smart editing tools",
          "Performance optimization",
          "Automated workflows",
          "Predictive analytics",
        ],
      },
      {
        name: "FanzSocial",
        displayName: "FanzSocial - Social Media Manager",
        description:
          "Complete social media management and marketing platform with auto-posting, SEO optimization, and cross-platform analytics.",
        category: "marketing",
        url: "https://fanzsocial.myfanz.network",
        apiEndpoint: "https://api.fanzsocial.myfanz.network",
        webhookUrl: "https://webhooks.fanzsocial.myfanz.network/events",
        isInternal: true,
        icon: "bar-chart-3",
        features: [
          "Auto-posting",
          "Social scheduling",
          "SEO optimization",
          "Analytics dashboard",
          "Multi-platform management",
        ],
      },
    ];

    await Promise.all(
      servicesData.map((service) => db.insert(services).values(service)),
    );

    // Initialize ad spaces
    const adSpacesData = [
      {
        name: "Header Banner",
        location: "header",
        pageType: "all",
        dimensions: "1200x300",
        maxFileSize: 2000000, // 2MB
        allowedFormats: ["jpg", "png", "gif"],
        pricing: 5000, // $50.00
      },
      {
        name: "Sidebar Ad",
        location: "sidebar",
        pageType: "all",
        dimensions: "300x600",
        maxFileSize: 1000000, // 1MB
        allowedFormats: ["jpg", "png", "gif", "mp4"],
        pricing: 3000, // $30.00
      },
      {
        name: "Inline Content Ad",
        location: "inline",
        pageType: "home",
        dimensions: "728x90",
        maxFileSize: 500000, // 500KB
        allowedFormats: ["jpg", "png"],
        pricing: 2500, // $25.00
      },
      {
        name: "Footer Banner",
        location: "footer",
        pageType: "all",
        dimensions: "1200x200",
        maxFileSize: 1500000, // 1.5MB
        allowedFormats: ["jpg", "png", "gif"],
        pricing: 2000, // $20.00
      },
      {
        name: "Platform Specific - BoyFanz",
        location: "header",
        pageType: "platform",
        platform: "boyfanz",
        dimensions: "1200x300",
        maxFileSize: 2000000,
        allowedFormats: ["jpg", "png", "gif"],
        pricing: 7500, // $75.00
      },
      {
        name: "Platform Specific - GirlFanz",
        location: "header",
        pageType: "platform",
        platform: "girlfanz",
        dimensions: "1200x300",
        maxFileSize: 2000000,
        allowedFormats: ["jpg", "png", "gif"],
        pricing: 7500, // $75.00
      },
    ];

    await Promise.all(
      adSpacesData.map((adSpace) => db.insert(adSpaces).values(adSpace)),
    );

    // Initialize AI tours
    const aiToursData = [
      {
        name: "Platform Introduction",
        description:
          "Get familiar with the FUN ecosystem and learn how to navigate all platforms and services",
        targetAudience: "all",
        steps: [
          {
            title: "Welcome to FUN",
            content:
              "🌟 Welcome to the Fanz Unlimited Network! This comprehensive ecosystem connects creators and fans across 14 specialized clusters. You're about to join the future of content creation where 'Creators > Platforms — you own your magic.'",
          },
          {
            title: "Military-Grade Security",
            content:
              "🛡️ Your safety is our priority. FANZ uses AES-256 encryption, hash chain auditing, and cryptographic authentication. All data is protected with military-grade security measures.",
          },
          {
            title: "Platform Networks",
            content:
              "🌈 Explore our diverse networks: BoyFanz (gay male content), GirlFanz (lesbian content), PupFanz (pet play), and more. Each network is specialized for its community.",
          },
          {
            title: "Service Ecosystem",
            content:
              "⚡ Access 11 powerful services: FanzWork (freelancing), FanzTube (video platform), FanzForge (development tools), FanzVarsity (education), and more. Click 'Launch' buttons to explore!",
          },
          {
            title: "Creator Economy",
            content:
              "💰 Join the creator economy with multiple revenue streams: subscriptions, tips, custom content, and exclusive services. Build your brand across all clusters.",
          },
          {
            title: "Getting Started",
            content:
              "🚀 Ready to begin? Create your account, complete verification, and start exploring. Your AI assistant (that's me!) is always here to help!",
          },
        ],
        completionRate: 85,
        averageRating: 4,
        totalCompletions: 1250,
      },
      {
        name: "Creator Onboarding",
        description:
          "Complete guide for new creators to set up their presence and start monetizing content",
        targetAudience: "star",
        steps: [
          {
            title: "Welcome, Future STAR! ⭐",
            content:
              "🎉 Welcome to STAR creator onboarding! You're about to join an elite community where creators own their content and control their destiny. Let's get you set up for success!",
          },
          {
            title: "Security & Compliance First 🛡️",
            content:
              "🔐 Complete your KYC verification and 2257 compliance. This ensures platform safety and legal protection. Upload government ID, address verification, and sign required documents. Your data is encrypted with military-grade security.",
          },
          {
            title: "Profile That Converts 💫",
            content:
              "✨ Create a compelling profile: Professional photos, engaging bio, clear content categories. Your profile is your storefront - make it irresistible! Set your subscription tiers and pricing strategy.",
          },
          {
            title: "Content Strategy Mastery 🎯",
            content:
              "📈 Plan your content calendar: Mix free teasers, premium content, and exclusive releases. Use analytics to understand what resonates with your audience. Quality > Quantity always wins.",
          },
          {
            title: "Revenue Streams Unlocked 💰",
            content:
              "💸 Multiple income sources: Subscriptions, tips, custom content, live shows, merchandise, and cross-platform integration. Diversify your revenue for stable income growth.",
          },
          {
            title: "Fan Engagement & Growth 🚀",
            content:
              "💬 Build lasting relationships: Respond to messages, create interactive content, host live sessions, and reward loyal fans. Engaged fans become lifelong supporters and advocates.",
          },
          {
            title: "Launch Your Empire! 🌟",
            content:
              "🚀 You're ready to launch! Start posting, engage with fans, and watch your creator empire grow. Remember: You own your magic - the platform is just your tool to share it with the world!",
          },
        ],
        completionRate: 72,
        averageRating: 5,
        totalCompletions: 890,
      },
      {
        name: "Fan Experience Guide",
        description:
          "Learn how to get the most out of your fan experience across all platforms",
        targetAudience: "fanz",
        steps: [
          {
            title: "Welcome to FUN, Fan! 💜",
            content:
              "🎉 Welcome to the ultimate fan experience! You're about to discover incredible creators across 14 specialized networks. Let's maximize your journey and help you connect with amazing content.",
          },
          {
            title: "Discover Your Community 🌈",
            content:
              "🔍 Explore specialized networks: BoyFanz, GirlFanz, PupFanz, and more. Each network has unique creators and content tailored to specific interests. Use search and filters to find your perfect matches.",
          },
          {
            title: "Subscription Mastery 💎",
            content:
              "⭐ Subscription tiers unlock exclusive content: Free followers get teasers, subscribers access premium content, and VIP tiers get custom experiences. Choose what fits your budget and interests.",
          },
          {
            title: "Interaction & Support 💬",
            content:
              "💝 Engage respectfully: Send tips, request custom content, join live streams, and participate in community events. Your support directly empowers creators to keep creating amazing content.",
          },
          {
            title: "Privacy & Safety 🛡️",
            content:
              "🔒 Your privacy matters: Control your visibility, use secure payment methods, and report any inappropriate behavior. Our military-grade security keeps your information safe.",
          },
          {
            title: "Community Standards 🤝",
            content:
              "✅ Be a positive community member: Respect creator boundaries, follow platform guidelines, and contribute to a welcoming environment for everyone. Great fans make great communities!",
          },
        ],
        completionRate: 91,
        averageRating: 4,
        totalCompletions: 2100,
      },
      {
        name: "Security & Privacy Mastery",
        description:
          "Complete guide to FANZ's military-grade security features and privacy protection",
        targetAudience: "all",
        steps: [
          {
            title: "Military-Grade Protection 🛡️",
            content:
              "🔐 FANZ uses AES-256-GCM encryption, the same standard used by military and banks. Your data is protected with cryptographic certificates, hash chain auditing, and real-time threat detection.",
          },
          {
            title: "Account Security Setup 🔑",
            content:
              "🛡️ Secure your account: Use strong, unique passwords, enable two-factor authentication, keep recovery codes safe, and never share login credentials. Your security is our priority.",
          },
          {
            title: "Privacy Controls 👁️",
            content:
              "🔒 Control your privacy: Manage who can see your profile, adjust messaging permissions, control search visibility, and set content sharing preferences. You decide what's visible.",
          },
          {
            title: "Payment Security 💳",
            content:
              "💳 Safe transactions: All payments use secure, encrypted processing. We never store full payment details, use tokenization for recurring charges, and offer dispute protection.",
          },
          {
            title: "Data Protection Rights 📋",
            content:
              "📊 Your data rights: Access your data anytime, request corrections, download your information, or delete your account. Full transparency and control over your digital footprint.",
          },
          {
            title: "Staying Safe Online 🌐",
            content:
              "⚠️ Best practices: Verify URLs before clicking, never share personal info in messages, report suspicious activity, and trust your instincts. We're here to help keep you safe!",
          },
        ],
        completionRate: 95,
        averageRating: 5,
        totalCompletions: 1850,
      },
    ];

    await Promise.all(
      aiToursData.map((tour) => db.insert(aiTours).values(tour)),
    );

    // Initialize wiki articles
    const wikiArticlesData = [
      {
        title: "Getting Started with FUN",
        content:
          "# Getting Started with FUN\n\nWelcome to the Fanz Unlimited Network (FUN)! This comprehensive guide will help you navigate our ecosystem...",
        category: "getting-started",
        tags: ["basics", "introduction", "guide"],
        authorId: systemUser[0].id,
        isPublished: true,
        views: 5420,
        helpfulVotes: 89,
        searchKeywords: [
          "getting started",
          "introduction",
          "basics",
          "new user",
        ],
      },
      {
        title: "2257 Compliance Guide",
        content:
          "# Understanding 2257 Compliance\n\n2257 compliance is crucial for all adult content creators...",
        category: "compliance",
        tags: ["compliance", "legal", "2257", "requirements"],
        authorId: systemUser[0].id,
        isPublished: true,
        views: 3200,
        helpfulVotes: 156,
        searchKeywords: [
          "2257",
          "compliance",
          "legal",
          "requirements",
          "documentation",
        ],
      },
      {
        title: "Maximizing Creator Revenue",
        content:
          "# Revenue Optimization for Creators\n\nLearn proven strategies to maximize your earnings...",
        category: "monetization",
        tags: ["revenue", "monetization", "tips", "strategy"],
        authorId: systemUser[0].id,
        isPublished: true,
        views: 7800,
        helpfulVotes: 234,
        searchKeywords: [
          "revenue",
          "money",
          "earnings",
          "monetization",
          "tips",
        ],
      },
      {
        title: "API Integration Guide",
        content:
          "# FUN API Integration\n\nComplete guide to integrating with FUN platform APIs...",
        category: "technical",
        tags: ["api", "integration", "development", "webhooks"],
        authorId: systemUser[0].id,
        isPublished: true,
        views: 1200,
        helpfulVotes: 45,
        searchKeywords: [
          "api",
          "integration",
          "webhooks",
          "development",
          "technical",
        ],
      },
    ];

    await Promise.all(
      wikiArticlesData.map((article) =>
        db.insert(wikiArticles).values(article),
      ),
    );

    // Create sample creators with sample users
    const sampleUsers = [
      {
        username: "alex_artist",
        email: "alex@example.com",
        password: "hashed_password",
        firstName: "Alex",
        lastName: "Chen",
        role: "star",
      },
      {
        username: "sarah_dancer",
        email: "sarah@example.com",
        password: "hashed_password",
        firstName: "Sarah",
        lastName: "Wilson",
        role: "star",
      },
      {
        username: "mike_model",
        email: "mike@example.com",
        password: "hashed_password",
        firstName: "Mike",
        lastName: "Johnson",
        role: "star",
      },
      {
        username: "emma_fitness",
        email: "emma@example.com",
        password: "hashed_password",
        firstName: "Emma",
        lastName: "Davis",
        role: "star",
      },
      {
        username: "david_musician",
        email: "david@example.com",
        password: "hashed_password",
        firstName: "David",
        lastName: "Brown",
        role: "star",
      },
      {
        username: "luna_artist",
        email: "luna@example.com",
        password: "hashed_password",
        firstName: "Luna",
        lastName: "Garcia",
        role: "star",
      },
    ];

    const createdUsers = await Promise.all(
      sampleUsers.map((user) => db.insert(users).values(user).returning()),
    );

    const sampleCreators = [
      {
        userId: createdUsers[0][0].id,
        displayName: "Alex",
        bio: "Artist, 24",
        avatar:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
        network: "boyfanz",
        isVerified: true,
        followers: 1250,
      },
      {
        userId: createdUsers[1][0].id,
        displayName: "Sarah",
        bio: "Dancer, 22",
        avatar:
          "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
        network: "girlfanz",
        isVerified: true,
        followers: 3200,
      },
      {
        userId: createdUsers[2][0].id,
        displayName: "Mike",
        bio: "Model, 26",
        avatar:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
        network: "boyfanz",
        isVerified: true,
        followers: 890,
      },
      {
        userId: createdUsers[3][0].id,
        displayName: "Emma",
        bio: "Fitness, 25",
        avatar:
          "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face",
        network: "girlfanz",
        isVerified: true,
        followers: 2100,
      },
      {
        userId: createdUsers[4][0].id,
        displayName: "David",
        bio: "Musician, 28",
        avatar:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",
        network: "boyfanz",
        isVerified: false,
        followers: 567,
      },
      {
        userId: createdUsers[5][0].id,
        displayName: "Luna",
        bio: "Artist, 23",
        avatar:
          "https://images.unsplash.com/photo-1494790108755-2616c25c4e55?w=200&h=200&fit=crop&crop=face",
        network: "girlfanz",
        isVerified: false,
        followers: 1890,
      },
    ];

    const createdCreators = await Promise.all(
      sampleCreators.map((creator) =>
        db.insert(creators).values(creator).returning(),
      ),
    );

    // Create sample videos
    const sampleVideos = [
      {
        creatorId: createdCreators[0][0].id,
        title: "Winter Forest",
        description: "Beautiful winter landscape scenery",
        thumbnailUrl:
          "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=250&fit=crop",
        videoUrl: "#",
        duration: 11,
        quality: "4K",
        views: 15420,
        likes: 892,
        isFeatured: true,
        tags: ["artistic", "nature"],
      },
      {
        creatorId: createdCreators[1][0].id,
        title: "Rocks",
        description: "Rocky coastline views",
        thumbnailUrl:
          "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=250&fit=crop",
        videoUrl: "#",
        duration: 22,
        quality: "4K",
        views: 12300,
        likes: 654,
        isFeatured: true,
        tags: ["scenic", "ocean"],
      },
      {
        creatorId: createdCreators[2][0].id,
        title: "City Nights",
        description: "Urban skyline at night",
        thumbnailUrl:
          "https://images.unsplash.com/photo-1496568816309-51d7c20e3b21?w=400&h=250&fit=crop",
        videoUrl: "#",
        duration: 105,
        quality: "HD",
        views: 8900,
        likes: 445,
        isFeatured: true,
        tags: ["urban", "lifestyle"],
      },
      {
        creatorId: createdCreators[3][0].id,
        title: "Abstract Art",
        description: "Colorful abstract art piece",
        thumbnailUrl:
          "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=250&fit=crop",
        videoUrl: "#",
        duration: 33,
        quality: "4K",
        views: 6700,
        likes: 378,
        isFeatured: true,
        tags: ["creative", "artistic"],
      },
      {
        creatorId: createdCreators[0][0].id,
        title: "Castle and Sea",
        description: "Medieval castle by the sea",
        thumbnailUrl:
          "https://images.unsplash.com/photo-1479030160180-b1860951d696?w=400&h=250&fit=crop",
        videoUrl: "#",
        duration: 12,
        quality: "4K",
        views: 9800,
        likes: 512,
        isFeatured: false,
        tags: ["fantasy", "historic"],
      },
      {
        creatorId: createdCreators[1][0].id,
        title: "Spring Nature",
        description: "Spring forest with blooming flowers",
        thumbnailUrl:
          "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=400&h=250&fit=crop",
        videoUrl: "#",
        duration: 21,
        quality: "4K",
        views: 11200,
        likes: 623,
        isFeatured: false,
        tags: ["nature", "seasonal"],
      },
      {
        creatorId: createdCreators[4][0].id,
        title: "Mountain Views",
        description: "Majestic mountain range at sunset",
        thumbnailUrl:
          "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=250&fit=crop",
        videoUrl: "#",
        duration: 22,
        quality: "4K",
        views: 7300,
        likes: 401,
        isFeatured: false,
        tags: ["adventure", "nature"],
      },
      {
        creatorId: createdCreators[5][0].id,
        title: "Architecture",
        description: "Modern glass building architecture",
        thumbnailUrl:
          "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=250&fit=crop",
        videoUrl: "#",
        duration: 75,
        quality: "HD",
        views: 5400,
        likes: 289,
        isFeatured: false,
        tags: ["modern", "design"],
      },
    ];

    await Promise.all(
      sampleVideos.map((video) => db.insert(videos).values(video)),
    );

    // Initialize platform data
    const samplePlatforms = [
      {
        domain: "boyfanz.myfanz.network",
        name: "BoyFanz",
        type: "primary" as const,
        targetNetwork: "boyfanz",
        repositoryName: "boyfanz-web",
        isActive: true,
        settings: { theme: "dark", analytics: true },
      },
      {
        domain: "backdoorboy.com",
        name: "BoyFanz",
        type: "redirect" as const,
        targetNetwork: "boyfanz",
        repositoryName: "boyfanz-web",
        isActive: true,
        settings: { redirectTo: "boyfanz.myfanz.network" },
      },
      {
        domain: "girlfanz.myfanz.network",
        name: "GirlFanz",
        type: "primary" as const,
        targetNetwork: "girlfanz",
        repositoryName: "girlfanz-web",
        isActive: true,
        settings: { theme: "pink", analytics: true },
      },
      {
        domain: "TabooFanz.com",
        name: "BoyFanz",
        type: "redirect" as const,
        targetNetwork: "boyfanz",
        repositoryName: "boyfanz-web",
        isActive: true,
        settings: { redirectTo: "boyfanz.myfanz.network" },
      },
      {
        domain: "transfanz.myfanz.network",
        name: "TransFanz",
        type: "primary" as const,
        targetNetwork: "transfanz",
        repositoryName: "transfanz-web",
        isActive: true,
        settings: { theme: "rainbow", analytics: true },
      },
      {
        domain: "pupfanz.myfanz.network",
        name: "PupFanz",
        type: "primary" as const,
        targetNetwork: "pupfanz",
        repositoryName: "pupfanz-web",
        isActive: true,
        settings: { theme: "brown", analytics: true },
      },
      {
        domain: "kinkfanz.myfanz.network",
        name: "KinkFanz",
        type: "primary" as const,
        targetNetwork: "kinkfanz",
        repositoryName: "kinkfanz-web",
        isActive: true,
        settings: { theme: "black", analytics: true },
      },
    ];

    await Promise.all(
      samplePlatforms.map((platform) =>
        db.insert(platforms).values(platform).onConflictDoNothing(),
      ),
    );

    console.log("Sample data initialized successfully");
  } catch (error) {
    console.error("Failed to initialize sample data:", error);
  }
}

export const storage = new DatabaseStorage();

// Initialize sample data on startup
initializeSampleData();
