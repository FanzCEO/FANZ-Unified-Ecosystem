import { type User, type InsertUser, type GeneratedContent, type InsertContent, type Campaign, type InsertCampaign } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Content methods
  createContent(content: InsertContent & { userId: string }): Promise<GeneratedContent>;
  getContentByUser(userId: string): Promise<GeneratedContent[]>;
  getContentById(id: string): Promise<GeneratedContent | undefined>;
  
  // Campaign methods
  createCampaign(campaign: InsertCampaign & { userId: string }): Promise<Campaign>;
  getCampaignsByUser(userId: string): Promise<Campaign[]>;
  updateCampaign(id: string, updates: Partial<Campaign>): Promise<Campaign | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private content: Map<string, GeneratedContent>;
  private campaigns: Map<string, Campaign>;

  constructor() {
    this.users = new Map();
    this.content = new Map();
    this.campaigns = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date() 
    };
    this.users.set(id, user);
    return user;
  }

  async createContent(contentData: InsertContent & { userId: string }): Promise<GeneratedContent> {
    const id = randomUUID();
    const content: GeneratedContent = {
      ...contentData,
      id,
      createdAt: new Date(),
      metadata: contentData.metadata || null,
    };
    this.content.set(id, content);
    return content;
  }

  async getContentByUser(userId: string): Promise<GeneratedContent[]> {
    return Array.from(this.content.values()).filter(
      (content) => content.userId === userId
    );
  }

  async getContentById(id: string): Promise<GeneratedContent | undefined> {
    return this.content.get(id);
  }

  async createCampaign(campaignData: InsertCampaign & { userId: string }): Promise<Campaign> {
    const id = randomUUID();
    const campaign: Campaign = {
      ...campaignData,
      id,
      status: "draft",
      stats: null,
      settings: campaignData.settings || null,
      createdAt: new Date(),
    };
    this.campaigns.set(id, campaign);
    return campaign;
  }

  async getCampaignsByUser(userId: string): Promise<Campaign[]> {
    return Array.from(this.campaigns.values()).filter(
      (campaign) => campaign.userId === userId
    );
  }

  async updateCampaign(id: string, updates: Partial<Campaign>): Promise<Campaign | undefined> {
    const campaign = this.campaigns.get(id);
    if (!campaign) return undefined;
    
    const updatedCampaign = { ...campaign, ...updates };
    this.campaigns.set(id, updatedCampaign);
    return updatedCampaign;
  }
}

export const storage = new MemStorage();
