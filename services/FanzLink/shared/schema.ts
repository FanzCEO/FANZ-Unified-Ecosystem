import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull(),
  title: text("title"),
  bio: text("bio"),
  profileImage: text("profile_image"),
  isVerified: text("is_verified").default("false"),
  theme: text("theme").default("light"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const socialLinks = pgTable("social_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  platform: text("platform").notNull(),
  username: text("username").notNull(),
  url: text("url").notNull(),
  iconColor: text("icon_color"),
  isActive: text("is_active").default("true"),
  orderIndex: integer("order_index").default(0),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  name: text("name").notNull(),
  price: text("price").notNull(),
  image: text("image").notNull(),
  description: text("description"),
  isActive: text("is_active").default("true"),
  orderIndex: integer("order_index").default(0),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const analytics = pgTable("analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  totalClicks: integer("total_clicks").default(0),
  monthlyViews: integer("monthly_views").default(0),
  followers: integer("followers").default(0),
  weeklyClicks: integer("weekly_clicks").default(0),
  conversionRate: text("conversion_rate").default("0"),
  topLink: text("top_link"),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

export const fanzBrands = pgTable("fanz_brands", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  brandName: text("brand_name").notNull(),
  isConnected: text("is_connected").default("false"),
  icon: text("icon"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertSocialLinkSchema = createInsertSchema(socialLinks).omit({
  id: true,
  createdAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
});

export const insertAnalyticsSchema = createInsertSchema(analytics).omit({
  id: true,
  updatedAt: true,
});

export const insertFanzBrandSchema = createInsertSchema(fanzBrands).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertSocialLink = z.infer<typeof insertSocialLinkSchema>;
export type SocialLink = typeof socialLinks.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;
export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;
export type Analytics = typeof analytics.$inferSelect;
export type InsertFanzBrand = z.infer<typeof insertFanzBrandSchema>;
export type FanzBrand = typeof fanzBrands.$inferSelect;
