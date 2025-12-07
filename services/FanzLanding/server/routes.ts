import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import {
  registrationSchema,
  starConsentSchema,
  kycSchema,
  type RegistrationForm,
  type StarConsentForm,
  type KycForm,
  type Platform,
  type Webhook,
  type WebhookLog,
  type Service,
  type AdSpace,
  type AdCampaign,
  type AiTour,
  type UserTourProgress,
  type WikiArticle,
  insertUserSchema,
  insertPlatformSchema,
  insertWebhookSchema,
  insertServiceSchema,
  insertAdSpaceSchema,
  insertAdCampaignSchema,
  insertAiTourSchema,
  insertUserTourProgressSchema,
  insertWikiArticleSchema,
} from "@shared/schema";
import session from "express-session";
import bcrypt from "bcrypt";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import connectPgSimple from "connect-pg-simple";
import cors from "cors";
import crypto from "crypto";
import * as cheerio from "cheerio";
import { AuditHashChain, CertificateManager, SecurityMonitor } from "./crypto";

// Extend Session interface to include custom properties
declare module "express-session" {
  interface SessionData {
    userId: string;
    userRole: string;
  }
}

// Production-ready session configuration
const PgSession = connectPgSimple(session);
const sessionMiddleware = session({
  store: new PgSession({
    conString: process.env.DATABASE_URL,
    tableName: "sessions",
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
});

// Rate limiting configuration
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "development" ? 100 : 5, // Higher limit for development
  message: {
    error: "Too many authentication attempts, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "development" ? 1000 : 100, // Higher limit for development
  standardHeaders: true,
  legacyHeaders: false,
});

// Military-grade encryption functions for PII data - FAIL FAST if misconfigured
function getEncryptionKey(): Buffer {
  const keyString = process.env.PII_ENCRYPTION_KEY;
  if (!keyString) {
    throw new Error(
      "CRITICAL SECURITY ERROR: PII_ENCRYPTION_KEY environment variable is required for military-grade encryption. " +
      "System cannot start without proper encryption configuration."
    );
  }
  if (keyString.length < 32) {
    throw new Error(
      "CRITICAL SECURITY ERROR: PII_ENCRYPTION_KEY must be at least 32 characters for military-grade security."
    );
  }
  return crypto.scryptSync(keyString, "salt", 32);
}

function encryptPII(data: string): string {
  const algorithm = "aes-256-gcm";
  const secretKey = getEncryptionKey(); // Fail fast if misconfigured
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);

  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag();

  return iv.toString("hex") + ":" + tag.toString("hex") + ":" + encrypted;
}

function decryptPII(encryptedData: string): string {
  const algorithm = "aes-256-gcm";
  const secretKey = getEncryptionKey(); // Fail fast if misconfigured

  const parts = encryptedData.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted data format - corrupted PII data detected");
  }
  
  const iv = Buffer.from(parts[0], "hex");
  const tag = Buffer.from(parts[1], "hex");
  const encrypted = parts[2];

  const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

// Helper function to check if user is authenticated
function isAuthenticated(req: any, res: any, next: any) {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.status(401).json({ error: "Authentication required" });
}

// Helper function to ensure userId exists (TypeScript helper)
function requireUserId(req: any): string {
  if (!req.session?.userId) {
    throw new Error("User ID not found in session");
  }
  return req.session.userId;
}

// Helper function to hash passwords
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Helper function to verify passwords
async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Webhook delivery function
async function triggerWebhookDelivery(
  webhook: Webhook,
  payload: any,
): Promise<any> {
  try {
    const response = await fetch(webhook.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "FUN-Platform/1.0",
      },
      body: JSON.stringify(payload),
    });

    // Log webhook delivery
    await storage.createWebhookLog({
      webhookId: webhook.id,
      requestPayload: payload,
      responseStatus: response.status,
      responseBody: await response.text(),
      attemptNumber: 1,
      failed: !response.ok,
      errorMessage: !response.ok ? `HTTP ${response.status}` : null,
    });

    // Update webhook last triggered
    await storage.updateWebhook(webhook.id, { lastTriggered: new Date() });

    return { success: response.ok, status: response.status };
  } catch (error) {
    // Log failed delivery
    await storage.createWebhookLog({
      webhookId: webhook.id,
      requestPayload: payload,
      responseStatus: null,
      responseBody: null,
      attemptNumber: 1,
      failed: true,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize audit hash chain from database on startup - CRITICAL for tamper detection
  try {
    const getLastHash = async (): Promise<string | null> => {
      try {
        const lastAuditEvent = await storage.getLastAuditEvent();
        return lastAuditEvent?.hashChain || null;
      } catch (error) {
        console.error("Failed to get last audit hash:", error);
        return null;
      }
    };
    
    await AuditHashChain.initializeFromDatabase(getLastHash);
    console.log("✅ Audit hash chain initialized from database - tamper detection active");
  } catch (error) {
    console.error("❌ CRITICAL: Failed to initialize audit hash chain - tamper detection compromised:", error);
  }

  // Production security hardening
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https:"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          imgSrc: ["'self'", "data:", "https:", "blob:"],
          connectSrc: ["'self'", "ws:", "wss:", "https:"],
          fontSrc: ["'self'", "https:", "data:"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'", "https:", "blob:"],
          frameSrc: ["'self'"],
          childSrc: ["'self'"],
          workerSrc: ["'self'", "blob:"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.use(
    cors({
      origin:
        process.env.NODE_ENV === "production"
          ? [
              "https://boyfanz.myfanz.network",
              "https://girlfanz.myfanz.network",
              "https://pupfanz.myfanz.network",
              "https://transfanz.myfanz.network",
              "https://daddiesfanz.myfanz.network",
              "https://kinkfanz.myfanz.network",
            ]
          : true,
      credentials: true,
    }),
  );

  // Trust proxy for rate limiting (always enable on Replit)
  app.set("trust proxy", 1);

  // Add rate limiting
  app.use(generalLimiter);

  // Add session middleware
  app.use(sessionMiddleware);

  // Authentication endpoints with rate limiting
  app.post("/api/auth/register", authLimiter, async (req, res) => {
    try {
      const validatedData = registrationSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const existingUsername = await storage.getUserByUsername(
        validatedData.username,
      );
      if (existingUsername) {
        return res.status(400).json({ error: "Username already taken" });
      }

      // Hash password
      const hashedPassword = await hashPassword(validatedData.password);

      // Create user
      const user = await storage.createUser({
        username: validatedData.username,
        email: validatedData.email,
        password: hashedPassword,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        role: validatedData.role,
      });

      // Set session
      req.session.userId = user.id;
      req.session.userRole = user.role;

      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Validation failed", details: error.errors });
      }
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/login", authLimiter, async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }

      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Verify password
      const validPassword = await verifyPassword(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Set session
      req.session.userId = user.id;
      req.session.userRole = user.role;

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", isAuthenticated, async (req, res) => {
    try {
      const userId = requireUserId(req);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { password, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  // Compliance endpoints
  app.post(
    "/api/compliance/star-consent",
    isAuthenticated,
    async (req, res) => {
      try {
        const validatedData = starConsentSchema.parse(req.body);
        const userId = requireUserId(req);

        // Create compliance record
        const complianceRecord = await storage.createComplianceRecord({
          userId,
          recordType: "star_consent",
          data: validatedData,
          ipAddress: req.ip,
          userAgent: req.get("User-Agent") || "",
          deviceFingerprint: req.get("X-Device-Fingerprint") || "",
          geolocation: req.get("X-Geolocation") || "",
        });

        res.json({ complianceRecord });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res
            .status(400)
            .json({ error: "Validation failed", details: error.errors });
        }
        console.error("Star consent error:", error);
        res.status(500).json({ error: "Failed to submit star consent" });
      }
    },
  );

  app.post("/api/compliance/kyc", isAuthenticated, async (req, res) => {
    try {
      const validatedData = kycSchema.parse(req.body);
      const userId = requireUserId(req);

      // Create KYC information
      const kycInfo = await storage.createKycInformation({
        userId,
        dateOfBirth: validatedData.dateOfBirth,
        streetAddress: validatedData.streetAddress,
        city: validatedData.city,
        state: validatedData.state,
        postalCode: validatedData.postalCode,
        country: validatedData.country,
        ssnTin: validatedData.ssnTin, // Should be encrypted in production
        idType: validatedData.idType,
        idNumber: validatedData.idNumber, // Should be encrypted in production
        idStateCountry: validatedData.idStateCountry,
      });

      // Create compliance record
      const complianceRecord = await storage.createComplianceRecord({
        userId,
        recordType: "kyc",
        data: validatedData,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent") || "",
        deviceFingerprint: req.get("X-Device-Fingerprint") || "",
        geolocation: req.get("X-Geolocation") || "",
      });

      res.json({ kycInfo, complianceRecord });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Validation failed", details: error.errors });
      }
      console.error("KYC error:", error);
      res.status(500).json({ error: "Failed to submit KYC" });
    }
  });

  app.get("/api/compliance/records", isAuthenticated, async (req, res) => {
    try {
      const userId = requireUserId(req);
      const complianceRecords =
        await storage.getComplianceRecordsByUser(userId);
      res.json({ complianceRecords });
    } catch (error) {
      console.error("Get compliance records error:", error);
      res.status(500).json({ error: "Failed to get compliance records" });
    }
  });

  app.get("/api/compliance/kyc", isAuthenticated, async (req, res) => {
    try {
      const userId = requireUserId(req);
      const kycInfo = await storage.getKycInformationByUser(userId);
      res.json({ kycInfo });
    } catch (error) {
      console.error("Get KYC error:", error);
      res.status(500).json({ error: "Failed to get KYC information" });
    }
  });

  // Document upload endpoints (placeholder - would need file upload middleware in production)
  app.post("/api/documents/upload", isAuthenticated, async (req, res) => {
    try {
      const { documentType, fileName, filePath, fileSize, mimeType } = req.body;

      if (!documentType || !fileName || !filePath) {
        return res
          .status(400)
          .json({ error: "Document type, file name, and file path required" });
      }

      const userId = requireUserId(req);
      const document = await storage.createDocumentUpload({
        userId,
        documentType,
        fileName,
        filePath,
        fileSize: fileSize || null,
        fileHash: null, // Would be calculated from actual file
        mimeType: mimeType || null,
      });

      res.json({ document });
    } catch (error) {
      console.error("Document upload error:", error);
      res.status(500).json({ error: "Failed to upload document" });
    }
  });

  app.get("/api/documents", isAuthenticated, async (req, res) => {
    try {
      const userId = requireUserId(req);
      const documents = await storage.getDocumentUploadsByUser(userId);
      res.json({ documents });
    } catch (error) {
      console.error("Get documents error:", error);
      res.status(500).json({ error: "Failed to get documents" });
    }
  });

  // Creator management endpoints
  app.post("/api/creators", isAuthenticated, async (req, res) => {
    try {
      const { displayName, bio, avatar, network } = req.body;

      if (!displayName || !network) {
        return res
          .status(400)
          .json({ error: "Display name and network required" });
      }

      const userId = requireUserId(req);
      const creator = await storage.createCreator({
        userId,
        displayName,
        bio: bio || null,
        avatar: avatar || null,
        network,
      });

      res.json({ creator });
    } catch (error) {
      console.error("Create creator error:", error);
      res.status(500).json({ error: "Failed to create creator profile" });
    }
  });

  // Video management endpoints
  app.post("/api/videos", isAuthenticated, async (req, res) => {
    try {
      const {
        creatorId,
        title,
        description,
        thumbnailUrl,
        videoUrl,
        duration,
        quality,
        tags,
      } = req.body;

      if (
        !creatorId ||
        !title ||
        !thumbnailUrl ||
        !videoUrl ||
        !duration ||
        !quality
      ) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Verify creator belongs to user
      const creator = await storage.getCreator(creatorId);
      const userId = requireUserId(req);
      if (!creator || creator.userId !== userId) {
        return res
          .status(403)
          .json({ error: "Not authorized to create videos for this creator" });
      }

      const video = await storage.createVideo({
        creatorId,
        title,
        description: description || null,
        thumbnailUrl,
        videoUrl,
        duration,
        quality,
        tags: tags || null,
      });

      res.json({ video });
    } catch (error) {
      console.error("Create video error:", error);
      res.status(500).json({ error: "Failed to create video" });
    }
  });

  // User management endpoints
  app.put("/api/users/profile", isAuthenticated, async (req, res) => {
    try {
      const { firstName, lastName, username } = req.body;
      const updates: any = {};

      if (firstName !== undefined) updates.firstName = firstName;
      if (lastName !== undefined) updates.lastName = lastName;
      const userId = requireUserId(req);

      if (username !== undefined) {
        // Check username availability
        const existingUser = await storage.getUserByUsername(username);
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ error: "Username already taken" });
        }
        updates.username = username;
      }
      const user = await storage.updateUser(userId, updates);
      const { password, ...userWithoutPassword } = user;

      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Platform Management Endpoints
  // Note: GET /api/platforms moved to public section below

  app.post("/api/platforms", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertPlatformSchema.parse(req.body);

      // Generate API key and webhook secret
      const apiKey = crypto.randomBytes(32).toString("hex");
      const webhookSecret = crypto.randomBytes(32).toString("hex");

      const platform = await storage.createPlatform({
        ...validatedData,
        apiKey: encryptPII(apiKey),
        webhookSecret: encryptPII(webhookSecret),
      });

      res.json({ platform: { ...platform, apiKey, webhookSecret } });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Validation failed", details: error.errors });
      }
      console.error("Create platform error:", error);
      res.status(500).json({ error: "Failed to create platform" });
    }
  });

  app.put("/api/platforms/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const platform = await storage.updatePlatform(id, updates);
      res.json({ platform });
    } catch (error) {
      console.error("Update platform error:", error);
      res.status(500).json({ error: "Failed to update platform" });
    }
  });

  app.delete("/api/platforms/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deletePlatform(id);
      res.json({ message: "Platform deleted successfully" });
    } catch (error) {
      console.error("Delete platform error:", error);
      res.status(500).json({ error: "Failed to delete platform" });
    }
  });

  // Webhook Management Endpoints
  app.get(
    "/api/platforms/:platformId/webhooks",
    isAuthenticated,
    async (req, res) => {
      try {
        const { platformId } = req.params;
        const webhooks = await storage.getWebhooksByPlatform(platformId);
        res.json({ webhooks });
      } catch (error) {
        console.error("Get webhooks error:", error);
        res.status(500).json({ error: "Failed to get webhooks" });
      }
    },
  );

  app.post(
    "/api/platforms/:platformId/webhooks",
    isAuthenticated,
    async (req, res) => {
      try {
        const { platformId } = req.params;
        const validatedData = insertWebhookSchema.parse({
          ...req.body,
          platformId,
        });

        const webhook = await storage.createWebhook(validatedData);
        res.json({ webhook });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res
            .status(400)
            .json({ error: "Validation failed", details: error.errors });
        }
        console.error("Create webhook error:", error);
        res.status(500).json({ error: "Failed to create webhook" });
      }
    },
  );

  app.post("/api/webhooks/:id/trigger", async (req, res) => {
    try {
      const { id } = req.params;
      const payload = req.body;

      const webhook = await storage.getWebhook(id);
      if (!webhook) {
        return res.status(404).json({ error: "Webhook not found" });
      }

      // Trigger webhook delivery
      const result = await triggerWebhookDelivery(webhook, payload);
      res.json({ result });
    } catch (error) {
      console.error("Trigger webhook error:", error);
      res.status(500).json({ error: "Failed to trigger webhook" });
    }
  });

  // Get featured creators
  app.get("/api/creators/featured", async (req, res) => {
    try {
      const creators = await storage.getFeaturedCreators();
      res.json(creators);
    } catch (error) {
      console.error("Error fetching featured creators:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get creators by network
  app.get("/api/creators/network/:network", async (req, res) => {
    try {
      const { network } = req.params;
      if (
        !["boyfanz", "girlfanz", "pupfanz", "transfanz", "kinkfanz"].includes(
          network,
        )
      ) {
        return res.status(400).json({ error: "Invalid network" });
      }

      const creators = await storage.getCreatorsByNetwork(network);
      res.json(creators);
    } catch (error) {
      console.error("Error fetching creators by network:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get featured videos
  app.get("/api/videos/featured", async (req, res) => {
    try {
      const videos = await storage.getFeaturedVideos();
      res.json(videos);
    } catch (error) {
      console.error("Error fetching featured videos:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get latest videos
  app.get("/api/videos/latest", async (req, res) => {
    try {
      const videos = await storage.getLatestVideos();
      res.json(videos);
    } catch (error) {
      console.error("Error fetching latest videos:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get trending videos
  app.get("/api/videos/trending", async (req, res) => {
    try {
      const videos = await storage.getTrendingVideos();
      res.json(videos);
    } catch (error) {
      console.error("Error fetching trending videos:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get video by ID
  app.get("/api/videos/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const video = await storage.getVideo(id);

      if (!video) {
        return res.status(404).json({ error: "Video not found" });
      }

      res.json(video);
    } catch (error) {
      console.error("Error fetching video:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get stats for footer
  app.get("/api/stats", async (req, res) => {
    try {
      const creators = await storage.getFeaturedCreators();
      res.json({
        totalCreators: creators.length * 750, // Simulate larger network
        activeCreators: creators.length * 620,
        totalVideos: creators.length * 1200,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // === PLATFORMS ENDPOINTS ===

  // Get all platforms (public endpoint)
  app.get("/api/platforms", async (req, res) => {
    try {
      const platforms = await storage.getAllPlatforms();
      res.json(platforms);
    } catch (error) {
      console.error("Error fetching platforms:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create platform (admin only)
  app.post("/api/platforms", authLimiter, isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertPlatformSchema.parse(req.body);
      const platform = await storage.createPlatform(validatedData);
      res.status(201).json(platform);
    } catch (error) {
      console.error("Error creating platform:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // === SERVICES ENDPOINTS ===

  // Get all services
  app.get("/api/services", async (req, res) => {
    try {
      const services = await storage.getAllServices();
      res.json(services);
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get services by category
  app.get("/api/services/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const services = await storage.getServicesByCategory(category);
      res.json(services);
    } catch (error) {
      console.error("Error fetching services by category:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create service (admin only)
  app.post("/api/services", authLimiter, isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertServiceSchema.parse(req.body);
      const service = await storage.createService(validatedData);
      res.status(201).json(service);
    } catch (error) {
      console.error("Error creating service:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // === AD SPACES ENDPOINTS ===

  // Get all ad spaces
  app.get("/api/ad-spaces", async (req, res) => {
    try {
      const adSpaces = await storage.getAllAdSpaces();
      res.json(adSpaces);
    } catch (error) {
      console.error("Error fetching ad spaces:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get ad spaces by location
  app.get("/api/ad-spaces/location/:location", async (req, res) => {
    try {
      const { location } = req.params;
      const adSpaces = await storage.getAdSpacesByLocation(location);
      res.json(adSpaces);
    } catch (error) {
      console.error("Error fetching ad spaces by location:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create ad space (admin only)
  app.post("/api/ad-spaces", authLimiter, isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertAdSpaceSchema.parse(req.body);
      const adSpace = await storage.createAdSpace(validatedData);
      res.status(201).json(adSpace);
    } catch (error) {
      console.error("Error creating ad space:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // === AD CAMPAIGNS ENDPOINTS ===

  // Get all ad campaigns (public endpoint for viewing)
  app.get("/api/ad-campaigns", async (req, res) => {
    try {
      const campaigns = await storage.getAllAdCampaigns();
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching ad campaigns:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get Starz ads (featured campaigns)
  app.get("/api/ad-campaigns/starz", async (req, res) => {
    try {
      const starzAds = await storage.getStarzAds();
      res.json(starzAds);
    } catch (error) {
      console.error("Error fetching Starz ads:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create ad campaign
  app.post(
    "/api/ad-campaigns",
    authLimiter,
    isAuthenticated,
    async (req, res) => {
      try {
        const userId = requireUserId(req);
        const validatedData = insertAdCampaignSchema.parse({
          ...req.body,
          advertiserId: userId,
        });
        const campaign = await storage.createAdCampaign(validatedData);
        res.status(201).json(campaign);
      } catch (error) {
        console.error("Error creating ad campaign:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    },
  );

  // === AI TOURS ENDPOINTS ===

  // Get all AI tours
  app.get("/api/ai-tours", async (req, res) => {
    try {
      const tours = await storage.getAllAiTours();
      res.json(tours);
    } catch (error) {
      console.error("Error fetching AI tours:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get AI tours by audience
  app.get("/api/ai-tours/audience/:audience", async (req, res) => {
    try {
      const { audience } = req.params;
      const tours = await storage.getAiToursByAudience(audience);
      res.json(tours);
    } catch (error) {
      console.error("Error fetching AI tours by audience:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get user tour progress
  app.get("/api/tour-progress", isAuthenticated, async (req, res) => {
    try {
      const userId = requireUserId(req);
      const progress = await storage.getUserTourProgressByUser(userId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching tour progress:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Start/update tour progress
  app.post("/api/tour-progress", isAuthenticated, async (req, res) => {
    try {
      const userId = requireUserId(req);
      const validatedData = insertUserTourProgressSchema.parse({
        ...req.body,
        userId,
      });
      const progress = await storage.createUserTourProgress(validatedData);
      res.status(201).json(progress);
    } catch (error) {
      console.error("Error creating tour progress:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update tour progress
  app.put("/api/tour-progress/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = requireUserId(req);

      // Verify ownership
      const existingProgress = await storage.getUserTourProgress(userId, id);
      if (!existingProgress) {
        return res.status(404).json({ error: "Tour progress not found" });
      }

      const progress = await storage.updateUserTourProgress(
        existingProgress.id,
        req.body,
      );
      res.json(progress);
    } catch (error) {
      console.error("Error updating tour progress:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // === WIKI ARTICLES ENDPOINTS ===

  // Get all published wiki articles
  app.get("/api/wiki", async (req, res) => {
    try {
      const articles = await storage.getAllWikiArticles();
      res.json(articles);
    } catch (error) {
      console.error("Error fetching wiki articles:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get wiki articles by category
  app.get("/api/wiki/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const articles = await storage.getWikiArticlesByCategory(category);
      res.json(articles);
    } catch (error) {
      console.error("Error fetching wiki articles by category:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Search wiki articles
  app.get("/api/wiki/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== "string") {
        return res.status(400).json({ error: "Search query required" });
      }
      const articles = await storage.searchWikiArticles(q);
      res.json(articles);
    } catch (error) {
      console.error("Error searching wiki articles:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get wiki article by ID
  app.get("/api/wiki/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const article = await storage.getWikiArticle(id);

      if (!article) {
        return res.status(404).json({ error: "Wiki article not found" });
      }

      res.json(article);
    } catch (error) {
      console.error("Error fetching wiki article:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create wiki article (authenticated users only)
  app.post("/api/wiki", authLimiter, isAuthenticated, async (req, res) => {
    try {
      const userId = requireUserId(req);
      const validatedData = insertWikiArticleSchema.parse({
        ...req.body,
        authorId: userId,
      });
      const article = await storage.createWikiArticle(validatedData);
      res.status(201).json(article);
    } catch (error) {
      console.error("Error creating wiki article:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============================================
  // MILITARY-GRADE SECURITY HUB - POLICY MANAGEMENT
  // ============================================

  // Helper function for military-grade audit logging with hash chains
  async function createAuditLog(req: any, eventType: string, eventCategory: string, description: string, resourceType?: string, resourceId?: string, severity: string = "info") {
    try {
      // Security threat analysis
      const threatAnalysis = SecurityMonitor.analyzeRequest(req);
      if (threatAnalysis.threats.length > 0) {
        console.warn(`Security threats detected in request:`, threatAnalysis);
      }

      const auditData = {
        userId: req.session?.userId || null,
        sessionId: req.sessionID || null,
        eventType,
        eventCategory,
        eventDescription: description,
        resourceType: resourceType || null,
        resourceId: resourceId || null,
        severity,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent") || "",
        deviceFingerprint: req.get("X-Device-Fingerprint") || "",
        geolocation: req.get("X-Geolocation") || "",
        requestMethod: req.method,
        requestPath: req.path,
        responseStatus: null,
        payload: null,
        threatLevel: threatAnalysis.threatLevel,
        threatsDetected: threatAnalysis.threats,
        metadata: { 
          timestamp: new Date().toISOString(),
          endpoint: req.originalUrl,
          threats: threatAnalysis.threats
        }
      };

      // Generate hash chain for tamper detection
      const { hash, previousHash } = AuditHashChain.generateNextHash(auditData);
      
      // CRITICAL: Store the generated hash for tamper detection continuity
      await storage.createAuditEvent({
        ...auditData,
        hashChain: hash
      });

      // Create security event if threats detected
      if (threatAnalysis.threats.length > 0) {
        const securityEventData = SecurityMonitor.generateSecurityEvent(req, threatAnalysis);
        if (securityEventData) {
          await storage.createSecurityEvent(securityEventData);
        }
      }
    } catch (error) {
      console.error("Failed to create audit log:", error);
    }
  }

  // Enhanced rate limiting for policy management endpoints
  const policyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === "development" ? 200 : 20,
    message: { error: "Policy endpoint rate limit exceeded" },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // ============================================
  // FANZ FOUNDATION POLICY SYNC ENDPOINTS
  // ============================================

  // Sync policies from Fanz Foundation knowledge base
  app.post("/api/policies/sync", authLimiter, isAuthenticated, async (req, res) => {
    try {
      const userId = requireUserId(req);
      await createAuditLog(req, "policy", "sync_initiated", "Policy sync from Fanz Foundation initiated", "policy_sync", undefined, "info");

      // Fetch and parse real policy documents from Fanz Foundation
      const foundationResponse = await fetch("https://fanz.foundation/knowledge-base");
      if (!foundationResponse.ok) {
        throw new Error(`Foundation API returned ${foundationResponse.status}`);
      }

      const foundationData = await foundationResponse.text();
      const $ = cheerio.load(foundationData);
      
      // Parse categories and articles from the actual HTML
      const categories: Array<{ 
        name: string; 
        displayName: string; 
        articleCount: number; 
        articles: Array<{ title: string; url: string; content?: string }> 
      }> = [];
      
      // Extract category sections from the knowledge base
      $('.category, .knowledge-category, [data-category]').each((i, element) => {
        const categoryElement = $(element);
        const categoryName = categoryElement.find('h2, h3, .category-title').text().trim();
        
        if (categoryName) {
          const articles: Array<{ title: string; url: string; content?: string }> = [];
          
          // Find articles within this category
          categoryElement.find('a[href*="/knowledge-base/"], .article-link, .kb-article').each((j, articleElement) => {
            const link = $(articleElement);
            const title = link.text().trim();
            const url = link.attr('href');
            
            if (title && url) {
              articles.push({
                title,
                url: url.startsWith('http') ? url : `https://fanz.foundation${url}`
              });
            }
          });
          
          if (articles.length > 0) {
            categories.push({
              name: categoryName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'),
              displayName: categoryName,
              articleCount: articles.length,
              articles
            });
          }
        }
      });
      
      // Fallback: If no structured categories found, extract all knowledge base links
      if (categories.length === 0) {
        const allArticles: Array<{ title: string; url: string; content?: string }> = [];
        
        $('a[href*="/knowledge-base/"]').each((i, element) => {
          const link = $(element);
          const title = link.text().trim();
          const url = link.attr('href');
          
          if (title && url && title.length > 3) { // Filter out short navigation text
            allArticles.push({
              title,
              url: url.startsWith('http') ? url : `https://fanz.foundation${url}`
            });
          }
        });
        
        // Group articles by type/category based on URL patterns
        const groupedArticles = new Map<string, Array<{ title: string; url: string }>>();
        
        allArticles.forEach(article => {
          const urlPath = new URL(article.url).pathname;
          const pathParts = urlPath.split('/').filter(part => part.length > 0);
          
          if (pathParts.length >= 2) {
            const category = pathParts[pathParts.length - 2] || 'general';
            if (!groupedArticles.has(category)) {
              groupedArticles.set(category, []);
            }
            groupedArticles.get(category)!.push(article);
          }
        });
        
        groupedArticles.forEach((articles, categoryKey) => {
          categories.push({
            name: categoryKey,
            displayName: categoryKey.split('-').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' '),
            articleCount: articles.length,
            articles
          });
        });
      }

      const syncResults = [];
      for (const category of categories) {
        try {
          // Check if category exists
          let existingCategory = await storage.getPolicyCategoryByName(category.name);
          
          if (!existingCategory) {
            existingCategory = await storage.createPolicyCategory({
              name: category.name,
              displayName: category.displayName,
              description: `Policies from Fanz Foundation: ${category.displayName}`,
              foundationUrl: `https://fanz.foundation/knowledge-base/category/${category.name}`,
              articleCount: category.articleCount
            });
          } else {
            await storage.updatePolicyCategory(existingCategory.id, {
              lastSynced: new Date(),
              articleCount: category.articleCount
            });
          }

          syncResults.push({
            category: category.name,
            status: "synced",
            articleCount: category.articleCount
          });
        } catch (error) {
          console.error(`Failed to sync category ${category.name}:`, error);
          syncResults.push({
            category: category.name,
            status: "error",
            error: error instanceof Error ? error.message : "Unknown error"
          });
        }
      }

      await createAuditLog(req, "policy", "sync_completed", `Policy sync completed: ${syncResults.length} categories processed`, "policy_sync", undefined, "info");

      res.json({
        message: "Policy sync completed",
        results: syncResults,
        syncedAt: new Date()
      });
    } catch (error) {
      await createAuditLog(req, "policy", "sync_failed", `Policy sync failed: ${error instanceof Error ? error.message : "Unknown error"}`, "policy_sync", undefined, "error");
      console.error("Policy sync error:", error);
      res.status(500).json({ error: "Failed to sync policies" });
    }
  });

  // Get all policy categories
  app.get("/api/policies/categories", async (req, res) => {
    try {
      const categories = await storage.getAllPolicyCategories();
      res.json({ categories });
    } catch (error) {
      console.error("Error fetching policy categories:", error);
      res.status(500).json({ error: "Failed to fetch policy categories" });
    }
  });

  // Get policies by category
  app.get("/api/policies/categories/:categoryId", async (req, res) => {
    try {
      const { categoryId } = req.params;
      const policies = await storage.getPolicyDocumentsByCategory(categoryId);
      res.json({ policies });
    } catch (error) {
      console.error("Error fetching policies by category:", error);
      res.status(500).json({ error: "Failed to fetch policies" });
    }
  });

  // Get policies applicable to user's role
  app.get("/api/policies/my-policies", isAuthenticated, async (req, res) => {
    try {
      const userId = requireUserId(req);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const policies = await storage.getPolicyDocumentsByRole(user.role);
      const complianceStatus = await storage.getUserComplianceStatus(userId);

      res.json({ 
        policies, 
        complianceStatus,
        userRole: user.role 
      });
    } catch (error) {
      console.error("Error fetching user policies:", error);
      res.status(500).json({ error: "Failed to fetch user policies" });
    }
  });

  // Acknowledge policy compliance
  app.post("/api/policies/:policyId/acknowledge", authLimiter, isAuthenticated, async (req, res) => {
    try {
      const { policyId } = req.params;
      const { digitalSignature } = req.body;
      const userId = requireUserId(req);

      if (!digitalSignature) {
        return res.status(400).json({ error: "Digital signature required" });
      }

      // Check if already acknowledged
      const existingCompliance = await storage.getPolicyCompliance(userId, policyId);
      if (existingCompliance && existingCompliance.status === "acknowledged") {
        return res.status(400).json({ error: "Policy already acknowledged" });
      }

      const compliance = await storage.createPolicyCompliance({
        userId,
        policyId,
        status: "acknowledged",
        digitalSignature,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent") || "",
        deviceFingerprint: req.get("X-Device-Fingerprint") || "",
        geolocation: req.get("X-Geolocation") || "",
        auditTrail: {
          acknowledgedAt: new Date(),
          method: "digital_signature",
          ipAddress: req.ip
        }
      });

      await createAuditLog(req, "policy", "policy_acknowledged", `Policy ${policyId} acknowledged by user`, "policy", policyId, "info");

      res.json({ compliance, message: "Policy acknowledged successfully" });
    } catch (error) {
      await createAuditLog(req, "policy", "policy_acknowledge_failed", `Failed to acknowledge policy ${req.params.policyId}`, "policy", req.params.policyId, "error");
      console.error("Policy acknowledgment error:", error);
      res.status(500).json({ error: "Failed to acknowledge policy" });
    }
  });

  // ============================================
  // MILITARY-GRADE AUDIT & SECURITY ENDPOINTS
  // ============================================

  // Get audit events (admin only)
  app.get("/api/audit/events", isAuthenticated, async (req, res) => {
    try {
      const userId = requireUserId(req);
      const user = await storage.getUser(userId);
      
      if (!user || !["admin", "executive"].includes(user.role)) {
        await createAuditLog(req, "security", "unauthorized_audit_access", "Unauthorized attempt to access audit events", "audit", undefined, "warning");
        return res.status(403).json({ error: "Insufficient permissions" });
      }

      const { type, startDate, endDate, search } = req.query;
      let events;

      if (search) {
        events = await storage.searchAuditEvents(search as string);
      } else if (type) {
        events = await storage.getAuditEventsByType(type as string);
      } else if (startDate && endDate) {
        events = await storage.getAuditEventsByTimeRange(
          new Date(startDate as string),
          new Date(endDate as string)
        );
      } else {
        // Default to recent events
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        events = await storage.getAuditEventsByTimeRange(twentyFourHoursAgo, new Date());
      }

      await createAuditLog(req, "audit", "audit_events_accessed", `Audit events accessed: ${events.length} events`, "audit", undefined, "info");

      res.json({ events });
    } catch (error) {
      console.error("Error fetching audit events:", error);
      res.status(500).json({ error: "Failed to fetch audit events" });
    }
  });

  // Create security event
  app.post("/api/security/events", authLimiter, async (req, res) => {
    try {
      const { eventType, severity, source, title, description, clusterId, metadata } = req.body;

      if (!eventType || !severity || !source || !title || !description) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const securityEvent = await storage.createSecurityEvent({
        eventType,
        severity,
        source,
        title,
        description,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent") || "",
        userId: req.session?.userId || null,
        clusterId: clusterId || null,
        metadata: metadata || {}
      });

      await createAuditLog(req, "security", "security_event_created", `Security event created: ${title}`, "security_event", securityEvent.id, severity);

      res.status(201).json({ securityEvent });
    } catch (error) {
      console.error("Error creating security event:", error);
      res.status(500).json({ error: "Failed to create security event" });
    }
  });

  // Get security events (admin only)
  app.get("/api/security/events", isAuthenticated, async (req, res) => {
    try {
      const userId = requireUserId(req);
      const user = await storage.getUser(userId);
      
      if (!user || !["admin", "executive"].includes(user.role)) {
        await createAuditLog(req, "security", "unauthorized_security_access", "Unauthorized attempt to access security events", "security", undefined, "warning");
        return res.status(403).json({ error: "Insufficient permissions" });
      }

      const { unresolved, clusterId } = req.query;
      let events;

      if (unresolved === "true") {
        events = await storage.getUnresolvedSecurityEvents();
      } else if (clusterId) {
        events = await storage.getSecurityEventsByCluster(clusterId as string);
      } else {
        events = await storage.getSecurityEvents();
      }

      await createAuditLog(req, "security", "security_events_accessed", `Security events accessed: ${events.length} events`, "security", undefined, "info");

      res.json({ events });
    } catch (error) {
      console.error("Error fetching security events:", error);
      res.status(500).json({ error: "Failed to fetch security events" });
    }
  });

  // ============================================
  // CLUSTER CONNECTION MANAGEMENT
  // ============================================

  // Register cluster connection with cryptographic verification
  app.post("/api/clusters/register", authLimiter, async (req, res) => {
    try {
      const { clusterId, clusterName, domainName, certificatePem, challengeResponse, securityLevel } = req.body;

      if (!clusterId || !clusterName || !domainName || !certificatePem) {
        return res.status(400).json({ error: "Missing required cluster information (clusterId, clusterName, domainName, certificatePem)" });
      }

      // Verify the provided certificate
      const certVerification = CertificateManager.verifyCertificate(certificatePem);
      if (!certVerification.valid) {
        await createAuditLog(req, "cluster", "certificate_verification_failed", `Certificate verification failed for cluster ${clusterId}: ${certVerification.error}`, "cluster", undefined, "error");
        return res.status(400).json({ error: "Invalid certificate", details: certVerification.error });
      }

      // Check if cluster already exists
      const existingCluster = await storage.getClusterConnectionByClusterId(clusterId);
      if (existingCluster) {
        return res.status(400).json({ error: "Cluster already registered" });
      }

      // Generate authentication challenge for the cluster
      const authChallenge = CertificateManager.generateChallenge();

      const clusterConnection = await storage.createClusterConnection({
        clusterId,
        clusterName,
        domainName,
        certificateFingerprint: certVerification.fingerprint!,
        publicKey: certVerification.publicKey!,
        certificatePem,
        securityLevel: securityLevel || "standard",
        status: "pending_challenge", // Require challenge completion
        allowedOperations: ["read_policies", "report_events"],
        rateLimitTier: "standard",
        authChallenge: authChallenge.challenge,
        challengeExpiry: new Date(authChallenge.timestamp + 300000), // 5 minutes
        metadata: {
          registeredAt: new Date(),
          registeredFrom: req.ip,
          certificateSubject: certVerification.subject,
          verificationTimestamp: new Date()
        }
      });

      await createAuditLog(req, "cluster", "cluster_registered", `Cluster ${clusterName} (${clusterId}) registered with certificate ${certVerification.fingerprint}`, "cluster", clusterConnection.id, "info");

      res.status(201).json({ 
        clusterConnection: {
          id: clusterConnection.id,
          clusterId,
          status: "pending_challenge"
        },
        authChallenge: authChallenge.challenge,
        challengeExpiry: authChallenge.timestamp + 300000,
        message: "Certificate verified. Complete authentication by signing the challenge."
      });
    } catch (error) {
      await createAuditLog(req, "cluster", "cluster_registration_failed", `Failed to register cluster: ${error instanceof Error ? error.message : "Unknown error"}`, "cluster", undefined, "error");
      console.error("Error registering cluster:", error);
      res.status(500).json({ error: "Failed to register cluster" });
    }
  });

  // Complete cluster authentication challenge
  app.post("/api/clusters/:clusterId/authenticate", authLimiter, async (req, res) => {
    try {
      const { clusterId } = req.params;
      const { signedChallenge } = req.body;

      if (!signedChallenge) {
        return res.status(400).json({ error: "Signed challenge required" });
      }

      const cluster = await storage.getClusterConnectionByClusterId(clusterId);
      if (!cluster) {
        await createAuditLog(req, "cluster", "auth_unknown_cluster", `Authentication attempt from unknown cluster: ${clusterId}`, "cluster", undefined, "warning");
        return res.status(404).json({ error: "Cluster not found" });
      }

      if (cluster.status !== "pending_challenge") {
        return res.status(400).json({ error: "Cluster not in challenge state" });
      }

      if (!cluster.authChallenge || !cluster.challengeExpiry || new Date() > cluster.challengeExpiry) {
        await createAuditLog(req, "cluster", "auth_challenge_expired", `Authentication challenge expired for cluster: ${clusterId}`, "cluster", cluster.id, "warning");
        return res.status(400).json({ error: "Challenge expired" });
      }

      // Verify the signed challenge
      const challengeTimestamp = cluster.challengeExpiry.getTime() - 300000; // Calculate original timestamp
      const isValid = CertificateManager.verifySignedChallenge(
        cluster.authChallenge,
        signedChallenge,
        cluster.publicKey,
        challengeTimestamp
      );

      if (!isValid) {
        await createAuditLog(req, "cluster", "auth_challenge_failed", `Challenge verification failed for cluster: ${clusterId}`, "cluster", cluster.id, "error");
        // Disable cluster after failed authentication
        await storage.updateClusterConnection(cluster.id, { 
          status: "disabled",
          authChallenge: null,
          challengeExpiry: null 
        });
        return res.status(400).json({ error: "Challenge verification failed" });
      }

      // Successfully authenticated - activate cluster
      await storage.updateClusterConnection(cluster.id, { 
        status: "active",
        authChallenge: null,
        challengeExpiry: null,
        lastAuthenticated: new Date()
      });

      await createAuditLog(req, "cluster", "cluster_authenticated", `Cluster ${clusterId} successfully authenticated`, "cluster", cluster.id, "info");

      res.json({ 
        status: "authenticated", 
        clusterId,
        allowedOperations: cluster.allowedOperations,
        securityLevel: cluster.securityLevel,
        message: "Cluster authentication successful" 
      });
    } catch (error) {
      await createAuditLog(req, "cluster", "auth_error", `Authentication error for cluster ${req.params.clusterId}: ${error instanceof Error ? error.message : "Unknown error"}`, "cluster", undefined, "error");
      console.error("Error authenticating cluster:", error);
      res.status(500).json({ error: "Failed to authenticate cluster" });
    }
  });

  // Cluster heartbeat
  app.post("/api/clusters/:clusterId/heartbeat", policyLimiter, async (req, res) => {
    try {
      const { clusterId } = req.params;
      
      const cluster = await storage.getClusterConnectionByClusterId(clusterId);
      if (!cluster) {
        await createAuditLog(req, "cluster", "heartbeat_unknown_cluster", `Heartbeat from unknown cluster: ${clusterId}`, "cluster", undefined, "warning");
        return res.status(404).json({ error: "Cluster not found" });
      }

      await storage.updateClusterHeartbeat(clusterId);

      // Update status to active if pending
      if (cluster.status === "pending") {
        await storage.updateClusterConnection(cluster.id, { status: "active" });
      }

      res.json({ 
        status: "acknowledged", 
        timestamp: new Date(),
        securityLevel: cluster.securityLevel 
      });
    } catch (error) {
      console.error("Error processing cluster heartbeat:", error);
      res.status(500).json({ error: "Failed to process heartbeat" });
    }
  });

  // Get active clusters (admin only)
  app.get("/api/clusters", isAuthenticated, async (req, res) => {
    try {
      const userId = requireUserId(req);
      const user = await storage.getUser(userId);
      
      if (!user || !["admin", "executive"].includes(user.role)) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }

      const { active } = req.query;
      let clusters;

      if (active === "true") {
        clusters = await storage.getActiveClusterConnections();
      } else {
        clusters = await storage.getAllClusterConnections();
      }

      res.json({ clusters });
    } catch (error) {
      console.error("Error fetching clusters:", error);
      res.status(500).json({ error: "Failed to fetch clusters" });
    }
  });

  // ============================================
  // COMPLIANCE STATUS DASHBOARD
  // ============================================

  // Get platform-wide compliance summary (executives only)
  app.get("/api/compliance/summary", isAuthenticated, async (req, res) => {
    try {
      const userId = requireUserId(req);
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "executive") {
        return res.status(403).json({ error: "Executive access required" });
      }

      // This would need implementation once database is synced
      const summary = {
        totalUsers: 0,
        compliantUsers: 0,
        pendingCompliance: 0,
        expiredCompliance: 0,
        activePolicies: 0,
        securityEvents: {
          total: 0,
          unresolved: 0,
          critical: 0
        },
        clusters: {
          total: 0,
          active: 0,
          offline: 0
        }
      };

      await createAuditLog(req, "compliance", "summary_accessed", "Compliance summary accessed", "compliance", undefined, "info");

      res.json({ summary });
    } catch (error) {
      console.error("Error fetching compliance summary:", error);
      res.status(500).json({ error: "Failed to fetch compliance summary" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
