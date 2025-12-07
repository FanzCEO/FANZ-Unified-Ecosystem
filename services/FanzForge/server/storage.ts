import {
  users,
  orgs,
  projects,
  builds,
  envVars,
  plugins,
  aiSessions,
  passwordResetTokens,
  type User,
  type UpsertUser,
  type RegisterUser,
  type InsertOrg,
  type Org,
  type InsertProject,
  type Project,
  type InsertBuild,
  type Build,
  type InsertEnvVar,
  type EnvVar,
  type Plugin,
  type AISession,
  type PasswordResetToken,
  type InsertPasswordResetToken,
} from "@shared/schema";
import bcrypt from "bcrypt";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: RegisterUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  verifyPassword(email: string, password: string): Promise<User | null>;
  updatePassword(email: string, newPassword: string): Promise<User>;
  
  // Password reset operations
  createPasswordResetToken(email: string, token: string, expiresAt: Date): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markTokenAsUsed(token: string): Promise<void>;
  
  // Organization operations
  createOrg(org: InsertOrg): Promise<Org>;
  getUserOrgs(userId: string): Promise<Org[]>;
  
  // Project operations
  createProject(project: InsertProject & { orgId: string }): Promise<Project>;
  getProject(id: string): Promise<Project | undefined>;
  getUserProjects(userId: string): Promise<Project[]>;
  updateProject(id: string, updates: Partial<Project>): Promise<Project>;
  
  // Build operations
  createBuild(build: InsertBuild): Promise<Build>;
  getBuild(id: string): Promise<Build | undefined>;
  getProjectBuilds(projectId: string): Promise<Build[]>;
  updateBuild(id: string, updates: Partial<Build>): Promise<Build>;
  
  // Environment variables
  setEnvVar(envVar: InsertEnvVar): Promise<EnvVar>;
  getProjectEnvVars(projectId: string, scope?: string): Promise<EnvVar[]>;
  deleteEnvVar(id: string): Promise<void>;
  
  // AI Sessions
  createAISession(session: Omit<AISession, 'id' | 'createdAt' | 'updatedAt'>): Promise<AISession>;
  updateAISession(id: string, messages: any[]): Promise<AISession>;
  getAISession(id: string): Promise<AISession | undefined>;
  
  // Plugin operations
  getPlugins(): Promise<Plugin[]>;
  getPluginsByType(type: string): Promise<Plugin[]>;
  createPlugin(plugin: Omit<Plugin, 'id' | 'createdAt'>): Promise<Plugin>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: RegisterUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        password: hashedPassword,
      })
      .returning();
    return user;
  }

  async verifyPassword(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user?.password) return null;
    
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  async updatePassword(email: string, newPassword: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    const [user] = await db
      .update(users)
      .set({ 
        password: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(users.email, email))
      .returning();
    return user;
  }

  async createPasswordResetToken(email: string, token: string, expiresAt: Date): Promise<PasswordResetToken> {
    const [resetToken] = await db
      .insert(passwordResetTokens)
      .values({
        email,
        token,
        expiresAt,
      })
      .returning();
    return resetToken;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token));
    return resetToken;
  }

  async markTokenAsUsed(token: string): Promise<void> {
    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.token, token));
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

  async createOrg(orgData: InsertOrg): Promise<Org> {
    const [org] = await db.insert(orgs).values(orgData).returning();
    return org;
  }

  async getUserOrgs(userId: string): Promise<Org[]> {
    // For now, return empty array - would need user-org relationship table
    return [];
  }

  async createProject(projectData: InsertProject & { orgId: string }): Promise<Project> {
    const [project] = await db.insert(projects).values(projectData).returning();
    return project;
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async getUserProjects(userId: string): Promise<Project[]> {
    // For now, return all projects - would need proper user-project relationships
    return await db.select().from(projects).orderBy(desc(projects.createdAt));
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const [project] = await db
      .update(projects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return project;
  }

  async createBuild(buildData: InsertBuild): Promise<Build> {
    const [build] = await db.insert(builds).values(buildData).returning();
    return build;
  }

  async getBuild(id: string): Promise<Build | undefined> {
    const [build] = await db.select().from(builds).where(eq(builds.id, id));
    return build;
  }

  async getProjectBuilds(projectId: string): Promise<Build[]> {
    return await db
      .select()
      .from(builds)
      .where(eq(builds.projectId, projectId))
      .orderBy(desc(builds.startedAt));
  }

  async updateBuild(id: string, updates: Partial<Build>): Promise<Build> {
    const [build] = await db
      .update(builds)
      .set(updates)
      .where(eq(builds.id, id))
      .returning();
    return build;
  }

  async setEnvVar(envVarData: InsertEnvVar): Promise<EnvVar> {
    const [envVar] = await db.insert(envVars).values(envVarData).returning();
    return envVar;
  }

  async getProjectEnvVars(projectId: string, scope?: string): Promise<EnvVar[]> {
    if (scope) {
      return await db.select().from(envVars)
        .where(and(eq(envVars.projectId, projectId), eq(envVars.scope, scope)));
    }
    
    return await db.select().from(envVars).where(eq(envVars.projectId, projectId));
  }

  async deleteEnvVar(id: string): Promise<void> {
    await db.delete(envVars).where(eq(envVars.id, id));
  }

  async createAISession(sessionData: Omit<AISession, 'id' | 'createdAt' | 'updatedAt'>): Promise<AISession> {
    const [session] = await db.insert(aiSessions).values(sessionData).returning();
    return session;
  }

  async updateAISession(id: string, messages: any[]): Promise<AISession> {
    const [session] = await db
      .update(aiSessions)
      .set({ messages, updatedAt: new Date() })
      .where(eq(aiSessions.id, id))
      .returning();
    return session;
  }

  async getAISession(id: string): Promise<AISession | undefined> {
    const [session] = await db.select().from(aiSessions).where(eq(aiSessions.id, id));
    return session;
  }

  async getPlugins(): Promise<Plugin[]> {
    return await db.select().from(plugins).where(eq(plugins.isActive, true));
  }

  async getPluginsByType(type: string): Promise<Plugin[]> {
    return await db.select().from(plugins)
      .where(and(eq(plugins.type, type), eq(plugins.isActive, true)));
  }

  async createPlugin(pluginData: Omit<Plugin, 'id' | 'createdAt'>): Promise<Plugin> {
    const [plugin] = await db.insert(plugins).values(pluginData).returning();
    return plugin;
  }
}

export const storage = new DatabaseStorage();
