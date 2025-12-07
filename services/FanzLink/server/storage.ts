import { 
  type User, 
  type InsertUser,
  type SocialLink,
  type InsertSocialLink,
  type Product,
  type InsertProduct,
  type Analytics,
  type InsertAnalytics,
  type FanzBrand,
  type InsertFanzBrand,
  users,
  socialLinks,
  products,
  analytics,
  fanzBrands
} from "@shared/schema";
import { randomUUID } from "crypto";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  
  // Social Links methods
  getSocialLinks(userId: string): Promise<SocialLink[]>;
  createSocialLink(socialLink: InsertSocialLink): Promise<SocialLink>;
  updateSocialLink(id: string, socialLink: Partial<InsertSocialLink>): Promise<SocialLink | undefined>;
  deleteSocialLink(id: string): Promise<boolean>;
  
  // Products methods
  getProducts(userId: string): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  
  // Analytics methods
  getAnalytics(userId: string): Promise<Analytics | undefined>;
  updateAnalytics(userId: string, analytics: Partial<InsertAnalytics>): Promise<Analytics>;
  
  // Fanz Brands methods
  getFanzBrands(userId: string): Promise<FanzBrand[]>;
  createFanzBrand(fanzBrand: InsertFanzBrand): Promise<FanzBrand>;
  updateFanzBrand(id: string, fanzBrand: Partial<InsertFanzBrand>): Promise<FanzBrand | undefined>;
}

// Removed MemStorage class - using PostgreSQL only

// Create database connection
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

// PostgreSQL Storage Implementation
export class PostgreSQLStorage implements IStorage {
  private db = db;

  constructor() {
    this.initializeSampleData();
  }

  private async initializeSampleData() {
    try {
      // Check if data already exists
      const existingUser = await this.getUserByUsername("alexrivera");
      if (existingUser) return; // Data already exists

      // Create sample user
      const sampleUser = await this.createUser({
        username: "alexrivera",
        displayName: "Alex Rivera",
        title: "Digital Creator & Entrepreneur",
        bio: "Sharing my journey in tech, lifestyle content, and building amazing products. Join me for daily inspiration! ✨",
        profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=400",
        isVerified: "true",
        theme: "light"
      });

      // Create sample social links
      const socialLinksData = [
        { platform: "Instagram", username: "@alexrivera", url: "https://instagram.com/alexrivera", iconColor: "from-purple-500 to-pink-500" },
        { platform: "YouTube", username: "Alex Rivera", url: "https://youtube.com/alexrivera", iconColor: "bg-red-500" },
        { platform: "TikTok", username: "@alexcreates", url: "https://tiktok.com/@alexcreates", iconColor: "bg-black" },
        { platform: "Twitter", username: "@alexrivera", url: "https://twitter.com/alexrivera", iconColor: "bg-blue-500" },
        { platform: "LinkedIn", username: "Alex Rivera", url: "https://linkedin.com/in/alexrivera", iconColor: "bg-blue-600" },
        { platform: "Twitch", username: "alexstreams", url: "https://twitch.tv/alexstreams", iconColor: "bg-purple-600" },
      ];

      for (let index = 0; index < socialLinksData.length; index++) {
        const link = socialLinksData[index];
        await this.createSocialLink({
          userId: sampleUser.id,
          platform: link.platform,
          username: link.username,
          url: link.url,
          iconColor: link.iconColor,
          isActive: "true",
          orderIndex: index
        });
      }

      // Create sample products
      const productsData = [
        { name: "Premium Sneakers", price: "$129.99", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=200" },
        { name: "Skincare Set", price: "$89.99", image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=200" },
        { name: "Coffee Mug", price: "$24.99", image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=200" },
        { name: "Comfort Hoodie", price: "$59.99", image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=200" },
      ];

      for (let index = 0; index < productsData.length; index++) {
        const product = productsData[index];
        await this.createProduct({
          userId: sampleUser.id,
          name: product.name,
          price: product.price,
          image: product.image,
          description: `High-quality ${product.name.toLowerCase()}`,
          isActive: "true",
          orderIndex: index
        });
      }

      // Create sample analytics
      await this.updateAnalytics(sampleUser.id, {
        totalClicks: 12500,
        monthlyViews: 3200,
        followers: 890,
        weeklyClicks: 2100,
        conversionRate: "4.2",
        topLink: "Instagram"
      });

      // Create sample Fanz Brands
      const fanzBrandsData = [
        { brandName: "FanzMusic", isConnected: "true", icon: "fas fa-music" },
        { brandName: "FanzVideo", isConnected: "false", icon: "fas fa-video" },
        { brandName: "FanzGaming", isConnected: "false", icon: "fas fa-gamepad" },
      ];

      for (const brand of fanzBrandsData) {
        await this.createFanzBrand({
          userId: sampleUser.id,
          brandName: brand.brandName,
          isConnected: brand.isConnected,
          icon: brand.icon
        });
      }
    } catch (error) {
      console.error("Error initializing sample data:", error);
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUser(id: string, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const result = await this.db.update(users).set(updateData).where(eq(users.id, id)).returning();
    return result[0];
  }

  async getSocialLinks(userId: string): Promise<SocialLink[]> {
    return await this.db.select().from(socialLinks)
      .where(eq(socialLinks.userId, userId))
      .orderBy(socialLinks.orderIndex);
  }

  async createSocialLink(insertSocialLink: InsertSocialLink): Promise<SocialLink> {
    const result = await this.db.insert(socialLinks).values(insertSocialLink).returning();
    return result[0];
  }

  async updateSocialLink(id: string, updateData: Partial<InsertSocialLink>): Promise<SocialLink | undefined> {
    const result = await this.db.update(socialLinks).set(updateData).where(eq(socialLinks.id, id)).returning();
    return result[0];
  }

  async deleteSocialLink(id: string): Promise<boolean> {
    const result = await this.db.delete(socialLinks).where(eq(socialLinks.id, id)).returning({ id: socialLinks.id });
    return result.length > 0;
  }

  async getProducts(userId: string): Promise<Product[]> {
    return await this.db.select().from(products)
      .where(eq(products.userId, userId))
      .orderBy(products.orderIndex);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const result = await this.db.insert(products).values(insertProduct).returning();
    return result[0];
  }

  async updateProduct(id: string, updateData: Partial<InsertProduct>): Promise<Product | undefined> {
    const result = await this.db.update(products).set(updateData).where(eq(products.id, id)).returning();
    return result[0];
  }

  async deleteProduct(id: string): Promise<boolean> {
    const result = await this.db.delete(products).where(eq(products.id, id)).returning({ id: products.id });
    return result.length > 0;
  }

  async getAnalytics(userId: string): Promise<Analytics | undefined> {
    const result = await this.db.select().from(analytics).where(eq(analytics.userId, userId));
    return result[0];
  }

  async updateAnalytics(userId: string, updateData: Partial<InsertAnalytics>): Promise<Analytics> {
    const existing = await this.getAnalytics(userId);
    
    if (existing) {
      const result = await this.db.update(analytics)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(analytics.userId, userId))
        .returning();
      return result[0];
    } else {
      const result = await this.db.insert(analytics)
        .values({
          userId,
          totalClicks: 0,
          monthlyViews: 0,
          followers: 0,
          weeklyClicks: 0,
          conversionRate: "0",
          topLink: "",
          ...updateData
        })
        .returning();
      return result[0];
    }
  }

  async getFanzBrands(userId: string): Promise<FanzBrand[]> {
    return await this.db.select().from(fanzBrands).where(eq(fanzBrands.userId, userId));
  }

  async createFanzBrand(insertFanzBrand: InsertFanzBrand): Promise<FanzBrand> {
    const result = await this.db.insert(fanzBrands).values(insertFanzBrand).returning();
    return result[0];
  }

  async updateFanzBrand(id: string, updateData: Partial<InsertFanzBrand>): Promise<FanzBrand | undefined> {
    const result = await this.db.update(fanzBrands).set(updateData).where(eq(fanzBrands.id, id)).returning();
    return result[0];
  }
}

export const storage = new PostgreSQLStorage();
