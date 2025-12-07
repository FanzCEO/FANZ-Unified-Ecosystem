import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  uuid,
  varchar,
  text,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  isEmailVerified: boolean("is_email_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Password reset tokens table
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull(),
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Organizations for team collaboration
export const orgs = pgTable("orgs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  plan: varchar("plan").default("free"),
  billingId: varchar("billing_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Project status enum
export const projectStatusEnum = pgEnum("project_status", [
  "creating",
  "building", 
  "deploying",
  "deployed",
  "failed"
]);

// Projects table
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: uuid("org_id").references(() => orgs.id),
  name: varchar("name").notNull(),
  description: text("description"),
  template: varchar("template"),
  stack: varchar("stack").default("nextjs-node"),
  status: projectStatusEnum("status").default("creating"),
  vibespec: jsonb("vibespec"),
  repoUrl: varchar("repo_url"),
  deployUrl: varchar("deploy_url"),
  previewUrl: varchar("preview_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Builds table for CI/CD tracking
export const builds = pgTable("builds", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: uuid("project_id").references(() => projects.id),
  gitRef: varchar("git_ref").default("main"),
  dockerImage: varchar("docker_image"),
  status: varchar("status").default("pending"),
  logsUrl: varchar("logs_url"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Environment variables for projects
export const envVars = pgTable("env_vars", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: uuid("project_id").references(() => projects.id),
  key: varchar("key").notNull(),
  valueRef: text("value_ref"), // Encrypted reference
  scope: varchar("scope").default("development"), // development, preview, production
  createdAt: timestamp("created_at").defaultNow(),
});

// Plugins/blocks marketplace
export const plugins = pgTable("plugins", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  version: varchar("version").notNull(),
  type: varchar("type"), // payment, auth, media, compliance
  manifest: jsonb("manifest"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Audit logs for compliance
export const audits = pgTable("audits", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  actor: varchar("actor").notNull(), // user ID
  action: varchar("action").notNull(), // created, updated, deployed, etc.
  target: varchar("target").notNull(), // project, build, user, etc.
  targetId: varchar("target_id"),
  ip: varchar("ip"),
  userAgent: text("user_agent"),
  diff: jsonb("diff"), // JSON patch format
  createdAt: timestamp("created_at").defaultNow(),
});

// AI chat sessions
export const aiSessions = pgTable("ai_sessions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: uuid("project_id").references(() => projects.id),
  userId: varchar("user_id").references(() => users.id),
  messages: jsonb("messages"),
  context: varchar("context"), // code_generation, debugging, deployment
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schema exports
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const registerSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  firstName: true,
  lastName: true,
}).extend({
  password: z.string().min(8, "Password must be at least 8 characters"),
  email: z.string().email("Invalid email address")
});
export type RegisterUser = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required")
});
export type LoginUser = z.infer<typeof loginSchema>;

export type InsertOrg = typeof orgs.$inferInsert;
export type Org = typeof orgs.$inferSelect;

export const insertProjectSchema = createInsertSchema(projects).pick({
  name: true,
  description: true,
  template: true,
  stack: true,
  vibespec: true,
});
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export const insertBuildSchema = createInsertSchema(builds).pick({
  projectId: true,
  gitRef: true,
});
export type InsertBuild = z.infer<typeof insertBuildSchema>;
export type Build = typeof builds.$inferSelect;

export const insertEnvVarSchema = createInsertSchema(envVars).pick({
  projectId: true,
  key: true,
  valueRef: true,
  scope: true,
});
export type InsertEnvVar = z.infer<typeof insertEnvVarSchema>;
export type EnvVar = typeof envVars.$inferSelect;

export type Plugin = typeof plugins.$inferSelect;
export type Audit = typeof audits.$inferSelect;
export type AISession = typeof aiSessions.$inferSelect;

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;

// Forgot password schema
export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address")
});
export type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;

// Reset password schema  
export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters")
});
export type ResetPasswordData = z.infer<typeof resetPasswordSchema>;
