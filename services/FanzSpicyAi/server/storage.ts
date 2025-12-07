import {
  users,
  contentGenerations,
  contentCategories,
  type User,
  type UpsertUser,
  type ContentGeneration,
  type InsertContentGeneration,
  type ContentCategory,
  type InsertContentCategory,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  updateUserCredits(id: string, credits: number): Promise<User>;
  
  // Content generation operations
  createContentGeneration(generation: InsertContentGeneration): Promise<ContentGeneration>;
  getUserContentGenerations(userId: string, limit?: number): Promise<ContentGeneration[]>;
  getContentGenerationById(id: string): Promise<ContentGeneration | undefined>;
  
  // Content category operations
  getAllContentCategories(): Promise<ContentCategory[]>;
  createContentCategory(category: InsertContentCategory): Promise<ContentCategory>;
}

export class DatabaseStorage implements IStorage {
  // User operations

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async updateUserCredits(id: string, credits: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        credits,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Content generation operations
  async createContentGeneration(generation: InsertContentGeneration): Promise<ContentGeneration> {
    const [result] = await db
      .insert(contentGenerations)
      .values(generation)
      .returning();
    return result;
  }

  async getUserContentGenerations(userId: string, limit: number = 50): Promise<ContentGeneration[]> {
    return await db
      .select()
      .from(contentGenerations)
      .where(eq(contentGenerations.userId, userId))
      .orderBy(desc(contentGenerations.createdAt))
      .limit(limit);
  }

  async getContentGenerationById(id: string): Promise<ContentGeneration | undefined> {
    const [result] = await db
      .select()
      .from(contentGenerations)
      .where(eq(contentGenerations.id, id));
    return result;
  }

  // Content category operations
  async getAllContentCategories(): Promise<ContentCategory[]> {
    return await db
      .select()
      .from(contentCategories)
      .where(eq(contentCategories.isActive, true))
      .orderBy(contentCategories.name);
  }

  async createContentCategory(category: InsertContentCategory): Promise<ContentCategory> {
    const [result] = await db
      .insert(contentCategories)
      .values(category)
      .returning();
    return result;
  }
}

export const storage = new DatabaseStorage();
