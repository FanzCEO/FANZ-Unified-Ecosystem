import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  setupAuth,
  isAuthenticated,
  requireRole,
  requirePlatformAccess,
} from "./replitAuth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Platform profile routes
  app.get(
    "/api/platforms/profile/:platform",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { platform } = req.params;

        const profile = await storage.getPlatformProfile(userId, platform);

        if (!profile) {
          // Create default profile if doesn't exist
          const newProfile = await storage.createPlatformProfile({
            userId,
            platform: platform as any,
            displayName:
              req.user.claims.first_name ||
              req.user.claims.email?.split("@")[0],
            isActive: true,
          });
          return res.json(newProfile);
        }

        res.json(profile);
      } catch (error) {
        console.error("Error fetching platform profile:", error);
        res.status(500).json({ message: "Failed to fetch platform profile" });
      }
    },
  );

  app.post(
    "/api/platforms/profile/:platform",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { platform } = req.params;

        const profile = await storage.createPlatformProfile({
          userId,
          platform: platform as any,
          ...req.body,
        });

        res.json(profile);
      } catch (error) {
        console.error("Error creating platform profile:", error);
        res.status(500).json({ message: "Failed to create platform profile" });
      }
    },
  );

  app.put(
    "/api/platforms/profile/:id",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const { id } = req.params;
        const updated = await storage.updatePlatformProfile(id, req.body);
        res.json(updated);
      } catch (error) {
        console.error("Error updating platform profile:", error);
        res.status(500).json({ message: "Failed to update platform profile" });
      }
    },
  );

  // Content routes with platform support
  app.get("/api/content/platform/:platform", async (req, res) => {
    try {
      const { platform } = req.params;
      const { limit = "50" } = req.query;

      const content = await storage.getContentByPlatform(
        platform,
        parseInt(limit as string),
      );
      res.json(content);
    } catch (error) {
      console.error("Error fetching platform content:", error);
      res.status(500).json({ message: "Failed to fetch content" });
    }
  });

  app.post(
    "/api/content",
    isAuthenticated,
    requireRole(["creator", "admin"]),
    async (req: any, res) => {
      try {
        const creatorId = req.user.claims.sub;

        const content = await storage.createContent({
          creatorId,
          ...req.body,
          status: "draft",
        });

        res.json(content);
      } catch (error) {
        console.error("Error creating content:", error);
        res.status(500).json({ message: "Failed to create content" });
      }
    },
  );

  app.get("/api/content/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const content = await storage.getContent(id);

      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }

      res.json(content);
    } catch (error) {
      console.error("Error fetching content:", error);
      res.status(500).json({ message: "Failed to fetch content" });
    }
  });

  app.put(
    "/api/content/:id",
    isAuthenticated,
    requireRole(["creator", "admin"]),
    async (req: any, res) => {
      try {
        const { id } = req.params;
        const creatorId = req.user.claims.sub;

        // Verify ownership or admin
        const content = await storage.getContent(id);
        if (!content) {
          return res.status(404).json({ message: "Content not found" });
        }

        if (content.creatorId !== creatorId && req.user.role !== "admin") {
          return res.status(403).json({ message: "Unauthorized" });
        }

        const updated = await storage.updateContent(id, req.body);
        res.json(updated);
      } catch (error) {
        console.error("Error updating content:", error);
        res.status(500).json({ message: "Failed to update content" });
      }
    },
  );

  // Subscription routes
  app.post("/api/subscriptions", isAuthenticated, async (req: any, res) => {
    try {
      const subscriberId = req.user.claims.sub;
      const { creatorId, platform, price } = req.body;

      // Check if already subscribed
      const existing = await storage.getSubscription(
        subscriberId,
        creatorId,
        platform,
      );
      if (existing) {
        return res.status(400).json({ message: "Already subscribed" });
      }

      const subscription = await storage.createSubscription({
        subscriberId,
        creatorId,
        platform: platform as any,
        price,
        status: "active",
        billingCycle: "monthly",
        autoRenew: true,
        startedAt: new Date(),
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      });

      res.json(subscription);
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });

  app.get("/api/subscriptions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const subscriptions = await storage.getUserSubscriptions(userId);
      res.json(subscriptions);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      res.status(500).json({ message: "Failed to fetch subscriptions" });
    }
  });

  // Live stream routes
  app.get("/api/streams/live", async (req, res) => {
    try {
      const { platform } = req.query;
      const streams = await storage.getActiveLiveStreams(platform as string);
      res.json(streams);
    } catch (error) {
      console.error("Error fetching live streams:", error);
      res.status(500).json({ message: "Failed to fetch live streams" });
    }
  });

  app.post(
    "/api/streams",
    isAuthenticated,
    requireRole(["creator", "admin"]),
    async (req: any, res) => {
      try {
        const creatorId = req.user.claims.sub;

        const stream = await storage.createLiveStream({
          creatorId,
          ...req.body,
          streamKey: generateStreamKey(),
          isLive: false,
        });

        res.json(stream);
      } catch (error) {
        console.error("Error creating stream:", error);
        res.status(500).json({ message: "Failed to create stream" });
      }
    },
  );

  // Message routes
  app.post("/api/messages", isAuthenticated, async (req: any, res) => {
    try {
      const senderId = req.user.claims.sub;
      const { receiverId, content, platform, isPPV, ppvPrice, mediaUrls } =
        req.body;

      const message = await storage.createMessage({
        senderId,
        receiverId,
        content,
        platform: platform as any,
        isPPV: isPPV || false,
        ppvPrice: ppvPrice || null,
        mediaUrls: mediaUrls || [],
        isRead: false,
      });

      res.json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.get("/api/messages/:userId", isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.claims.sub;
      const { userId } = req.params;
      const { platform } = req.query;

      const messages = await storage.getConversation(
        currentUserId,
        userId,
        platform as string,
      );

      // Mark messages as read
      await storage.markMessagesAsRead(currentUserId, userId);

      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Transaction routes
  app.get("/api/transactions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { platform } = req.query;

      const transactions = await storage.getUserTransactions(
        userId,
        platform as string,
      );
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post("/api/transactions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      const transaction = await storage.createTransaction({
        userId,
        ...req.body,
        status: "pending",
      });

      res.json(transaction);
    } catch (error) {
      console.error("Error creating transaction:", error);
      res.status(500).json({ message: "Failed to create transaction" });
    }
  });

  // Audit logging
  app.post(
    "/api/audit/platform-switch",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { platform } = req.body;

        await storage.createAuditLog({
          userId,
          action: "platform_switch",
          entityType: "platform",
          entityId: platform,
          platform: platform as any,
          metadata: {
            fromPlatform: req.headers.referer,
            toPlatform: platform,
          },
        });

        res.json({ success: true });
      } catch (error) {
        console.error("Error logging platform switch:", error);
        res.status(500).json({ message: "Failed to log platform switch" });
      }
    },
  );

  app.get(
    "/api/audit/logs",
    isAuthenticated,
    requireRole(["admin", "super_admin"]),
    async (req: any, res) => {
      try {
        const { userId, limit = "100" } = req.query;

        const logs = userId
          ? await storage.getUserAuditLogs(
              userId as string,
              parseInt(limit as string),
            )
          : [];

        res.json(logs);
      } catch (error) {
        console.error("Error fetching audit logs:", error);
        res.status(500).json({ message: "Failed to fetch audit logs" });
      }
    },
  );

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({
      status: "healthy",
      service: "fanz-unlimited-backend",
      timestamp: new Date().toISOString(),
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to generate stream key
function generateStreamKey(): string {
  return (
    "stream_" +
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}
