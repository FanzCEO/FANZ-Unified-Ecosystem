import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { logger } from "./logger";
import { healthEndpoints } from "./health";
import { authService, registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, forgotEmailSchema } from "./auth";
import { paymentService } from "./services/paymentService";
import { moderationService } from "./services/moderationService";
import { notificationService } from "./services/notificationService";
import { apiGatewayService } from "./services/apiGatewayService";
import { aiWikiService } from "./services/aiWikiService";
import { objectStorageService } from "./services/objectStorage";
import { 
  createTicketSchema,
  verifyTransactionSchema,
  requestRefundSchema,
  reviewRefundSchema,
  createPaymentMethodSchema,
  storyMoments,
} from "@shared/schema";
import multer from 'multer';
import { db } from "./db";
import { eq } from "drizzle-orm";
import { authenticateJWT, requireCreator, requireAdmin, requireAuth, optionalAuth, verifyOwnership } from "./middleware/auth";
import { globalRateLimit, authRateLimit, apiRateLimit, uploadRateLimit } from "./middleware/rateLimit";
import { csrfProtection, getCSRFToken } from "./middleware/csrf";
import { 
  validate, 
  profileUpdateSchema, 
  messageSchema, 
  payoutAccountSchema, 
  idParamSchema, 
  createPostSchema, 
  updatePostSchema, 
  creatorIdParamSchema, 
  paginationSchema, 
  createStorySchema, 
  addXPSchema,
  deployNftContractSchema,
  mintNftSchema,
  recordNftRoyaltySchema,
  createLoanProgramSchema,
  createLoanApplicationSchema,
  createLoanOfferSchema,
  payLoanRepaymentSchema,
  createAiScanJobSchema,
  createContentFingerprintSchema,
  reviewAiScanResultSchema,
  verifyContentFingerprintSchema,
  creatorIdPathParamSchema,
  lenderIdPathParamSchema,
  mediaIdPathParamSchema,
  contractIdPathParamSchema,
  jobIdPathParamSchema,
  offerIdPathParamSchema,
} from "./middleware/validation";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Global middleware
  app.use(globalRateLimit);

  // CSRF protection for non-GET requests
  app.use(csrfProtection.middleware());

  // Health endpoints (no auth required)
  app.get("/api/health", healthEndpoints.basic);
  app.get("/api/health/ready", healthEndpoints.ready);
  app.get("/api/health/live", healthEndpoints.live);


  // CSRF token endpoint
  app.get("/api/csrf-token", getCSRFToken);

  // Auth endpoints
  app.get("/api/auth/user", authenticateJWT, async (req: any, res) => {
    try {
      const userId = req.user!.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const profile = await storage.getProfile(userId);
      res.json({ ...user, profile });
    } catch (error) {
      logger.error(`Error fetching user: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Local authentication endpoints
  const signupHandler = async (req: Request, res: Response) => {
    try {
      const result = await authService.register(req.body);
      res.status(201).json(result);
    } catch (error) {
      logger.warn(`Registration failed: ${error instanceof Error ? error.message : String(error)}`);
      res.status(400).json({ message: error instanceof Error ? error.message : "Registration failed" });
    }
  };
  
  app.post("/api/auth/register", authRateLimit, validate({ body: registerSchema }), signupHandler);
  app.post("/api/auth/signup", authRateLimit, validate({ body: registerSchema }), signupHandler);

  app.post("/api/auth/login", authRateLimit, validate({ body: loginSchema }), async (req, res) => {
    try {
      const result = await authService.login(req.body);
      res.json(result);
    } catch (error) {
      logger.warn(`Login failed: ${error instanceof Error ? error.message : String(error)}`);
      res.status(401).json({ message: "Invalid credentials" });
    }
  });

  app.post("/api/auth/refresh", authenticateJWT, async (req, res) => {
    try {
      const token = await authService.refreshToken(req.user!.id);
      res.json({ token });
    } catch (error) {
      logger.warn(`Token refresh failed: ${error instanceof Error ? error.message : String(error)}`);
      res.status(401).json({ message: "Token refresh failed" });
    }
  });

  // Password reset endpoints
  app.post("/api/auth/forgot-password", authRateLimit, validate({ body: forgotPasswordSchema }), async (req, res) => {
    try {
      const result = await authService.requestPasswordReset(req.body.email);
      res.json(result);
    } catch (error) {
      logger.error(`Forgot password failed: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to process password reset request" });
    }
  });

  app.post("/api/auth/reset-password", authRateLimit, validate({ body: resetPasswordSchema }), async (req, res) => {
    try {
      await authService.resetPassword(req.body.token, req.body.password);
      res.json({ message: "Password has been reset successfully" });
    } catch (error) {
      logger.warn(`Password reset failed: ${error instanceof Error ? error.message : String(error)}`);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to reset password" });
    }
  });

  // Email recovery endpoint
  app.post("/api/auth/forgot-email", authRateLimit, validate({ body: forgotEmailSchema }), async (req, res) => {
    try {
      const result = await authService.requestEmailRecovery(req.body.username);
      res.json(result);
    } catch (error) {
      logger.error(`Email recovery failed: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to process email recovery request" });
    }
  });

  // Profile endpoints
  app.get("/api/profile", authenticateJWT, async (req: any, res) => {
    try {
      const userId = req.user!.id;
      let profile = await storage.getProfile(userId);
      
      // Auto-create profile if it doesn't exist for authenticated users
      if (!profile) {
        const user = await storage.getUser(userId);
        if (user) {
          profile = await storage.createProfile({
            userId: userId,
            displayName: user.displayName || `${req.user!.firstName || ''} ${req.user!.lastName || ''}`.trim() || user.email?.split('@')[0] || 'User',
            bio: '',
            subscriptionPrice: '9.99'
          });
        }
      }
      
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      res.json(profile);
    } catch (error) {
      logger.error(`Error fetching profile: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.put("/api/profile", authenticateJWT, validate({ body: profileUpdateSchema }), async (req: any, res) => {
    try {
      const userId = req.user!.id;
      const profile = await storage.updateProfile(userId, req.body);
      res.json(profile);
    } catch (error) {
      logger.error(`Error updating profile: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Media endpoints
  app.get("/api/media", authenticateJWT, async (req: any, res) => {
    try {
      const userId = req.user!.id;
      const media = await storage.getMediaAssets(userId);
      res.json(media);
    } catch (error) {
      logger.error(`Error fetching media: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to fetch media" });
    }
  });

  // Configure multer for file uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 500 * 1024 * 1024, // 500MB limit
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/webm', 'video/mov', 'video/avi'
      ];
      
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`File type ${file.mimetype} not allowed`), false);
      }
    }
  });

  app.post("/api/media", authenticateJWT, uploadRateLimit, upload.single('file'), async (req: any, res) => {
    try {
      const userId = req.user!.id;
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Temporarily bypass configuration check for testing
      if (!objectStorageService.isConfigured()) {
        logger.warn('Object storage not fully configured, but attempting upload anyway');
      }

      // Upload file to object storage
      const uploadResult = await objectStorageService.uploadPrivateFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        userId
      );

      // Create media asset record
      const mediaData = {
        ownerId: userId,
        title: req.body.title || req.file.originalname,
        description: req.body.description || '',
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        s3Key: uploadResult.key,
        url: uploadResult.url,
        price: req.body.price ? parseFloat(req.body.price) : undefined,
        isPremium: req.body.isPremium === 'true',
        status: 'pending' as const,
      };

      const media = await storage.createMediaAsset(mediaData);
      
      // Start moderation process
      await moderationService.moderateContent(media.id, {
        mimeType: media.mimeType!,
        fileSize: media.fileSize || 0,
        ownerId: userId,
        title: media.title,
        description: media.description,
      });

      res.status(201).json(media);
    } catch (error) {
      logger.error(`Error creating media: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to create media" });
    }
  });

  // File serving endpoint for private media
  app.get("/api/media/file/:key(*)", authenticateJWT, async (req: any, res) => {
    try {
      const { key } = req.params;
      const userId = req.user!.id;
      
      // Get media asset to verify ownership/access
      const media = await storage.getMediaAssets(userId);
      const allowedFile = media.find(m => m.s3Key === key);
      
      if (!allowedFile) {
        return res.status(404).json({ message: "File not found" });
      }

      // Get file from object storage
      const fileBuffer = await objectStorageService.getPrivateFile(key);
      
      if (!fileBuffer) {
        return res.status(404).json({ message: "File not found" });
      }

      // Set proper content type and headers
      res.setHeader('Content-Type', allowedFile.mimeType || 'application/octet-stream');
      res.setHeader('Content-Length', fileBuffer.length);
      res.setHeader('Cache-Control', 'private, max-age=3600');
      
      res.send(fileBuffer);
    } catch (error) {
      logger.error(`Error serving file: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to serve file" });
    }
  });

  // Moderation endpoints (admin only)
  app.get("/api/moderation/queue", requireAdmin, async (req, res) => {
    try {
      const queue = await storage.getModerationQueue();
      res.json(queue);
    } catch (error) {
      logger.error(`Error fetching moderation queue: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to fetch moderation queue" });
    }
  });

  app.put("/api/moderation/:id", requireAdmin, validate({ params: idParamSchema }), async (req, res) => {
    try {
      const { id } = req.params;
      const { decision, notes } = req.body;
      const reviewerId = req.user!.id;
      
      await moderationService.processHumanReview(id, decision, reviewerId, notes);
      res.json({ message: "Review processed successfully" });
    } catch (error) {
      logger.error(`Error processing moderation review: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to process review" });
    }
  });

  // Get moderation statistics
  app.get("/api/moderation/stats", requireAdmin, async (req, res) => {
    try {
      const stats = await moderationService.getModerationStats();
      res.json(stats);
    } catch (error) {
      logger.error(`Error fetching moderation stats: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to fetch moderation statistics" });
    }
  });

  // Get moderation configuration
  app.get("/api/moderation/config", requireAdmin, async (req, res) => {
    try {
      const config = moderationService.getModerationConfig();
      res.json(config);
    } catch (error) {
      logger.error(`Error fetching moderation config: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to fetch moderation configuration" });
    }
  });

  // Update moderation configuration
  app.put("/api/moderation/config", requireAdmin, async (req, res) => {
    try {
      const updates = req.body;
      moderationService.updateModerationRules(updates);
      res.json({ message: "Moderation configuration updated successfully" });
    } catch (error) {
      logger.error(`Error updating moderation config: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to update moderation configuration" });
    }
  });

  // Payment endpoints
  app.get("/api/payments/accounts", requireCreator, async (req, res) => {
    try {
      const userId = req.user!.id;
      const accounts = await storage.getPayoutAccounts(userId);
      res.json(accounts);
    } catch (error) {
      logger.error(`Error fetching payout accounts: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to fetch payout accounts" });
    }
  });

  app.post("/api/payments/accounts", requireCreator, validate({ body: payoutAccountSchema }), async (req, res) => {
    try {
      const userId = req.user!.id;
      const accountData = {
        ...req.body,
        userId,
      };
      const account = await storage.createPayoutAccount(accountData);
      res.status(201).json(account);
    } catch (error) {
      logger.error(`Error creating payout account: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to create payout account" });
    }
  });

  app.post("/api/payments/payout", requireCreator, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { amount } = req.body;
      
      const result = await paymentService.processCreatorPayout(userId, amount);
      res.json(result);
    } catch (error) {
      logger.error(`Error processing payout: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to process payout" });
    }
  });

  // Payment webhooks (no auth required)
  app.post("/api/webhooks/:provider", async (req, res) => {
    try {
      const { provider } = req.params;
      await paymentService.handleWebhook(provider, req.body);
      res.status(200).json({ message: "Webhook processed" });
    } catch (error) {
      logger.error(`Error processing webhook from ${req.params.provider}: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to process webhook" });
    }
  });

  // Messaging endpoints
  // Get conversations list
  app.get("/api/messages/conversations", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const conversations = await storage.getConversations(userId);
      res.json(conversations);
    } catch (error) {
      logger.error(`Error fetching conversations: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.get("/api/messages/:userId", requireAuth, async (req, res) => {
    try {
      const currentUserId = req.user!.id;
      const { userId } = req.params;
      const messages = await storage.getMessages(currentUserId, userId);
      res.json(messages);
    } catch (error) {
      logger.error(`Error fetching messages: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", requireAuth, validate({ body: messageSchema }), async (req, res) => {
    try {
      const senderId = req.user!.id;
      const messageData = {
        ...req.body,
        senderId,
      };
      const message = await storage.createMessage(messageData);

      // Broadcast message via WebSocket if connected
      if (global.wsClients) {
        const wsMessage = {
          type: "new_message",
          data: message,
          timestamp: Date.now()
        };
        
        // Send to recipient if connected
        global.wsClients.forEach((client: any, userId: string) => {
          if (userId === req.body.recipientId && client.readyState === 1) {
            client.send(JSON.stringify(wsMessage));
          }
        });
      }
      
      // Send push notification to recipient
      await notificationService.notifyNewMessage(req.body.recipientId, req.user!.firstName || "Someone");
      
      res.status(201).json(message);
    } catch (error) {
      logger.error(`Error sending message: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Mark message as read
  app.patch("/api/messages/:messageId/read", requireAuth, validate({ params: idParamSchema }), async (req, res) => {
    try {
      const { messageId } = req.params;
      const userId = req.user!.id;
      
      await storage.markMessageAsRead(messageId, userId);
      res.json({ message: "Message marked as read" });
    } catch (error) {
      logger.error(`Error marking message as read: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  // AI Wiki endpoints
  app.get("/api/wiki/popular", async (req, res) => {
    try {
      const popularArticles = await aiWikiService.getPopularArticles();
      res.json(popularArticles);
    } catch (error) {
      logger.error(`Error fetching popular articles: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to fetch popular articles" });
    }
  });

  app.get("/api/wiki/categories", async (req, res) => {
    try {
      const categories = await aiWikiService.getAllCategories();
      res.json(categories);
    } catch (error) {
      logger.error(`Error fetching categories: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/wiki/search", requireAuth, async (req, res) => {
    try {
      const { query } = req.body;
      const userId = req.user!.id;
      
      if (!query || typeof query !== "string") {
        return res.status(400).json({ message: "Search query is required" });
      }

      const results = await aiWikiService.searchKnowledge(query, userId);
      res.json(results);
    } catch (error) {
      logger.error(`Error searching wiki: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to search wiki" });
    }
  });

  app.post("/api/wiki/ask", requireAuth, async (req, res) => {
    try {
      const { question } = req.body;
      const userId = req.user!.id;
      
      if (!question || typeof question !== "string") {
        return res.status(400).json({ message: "Question is required" });
      }

      const answer = await aiWikiService.generateAnswer(question, userId);
      res.json({ answer });
    } catch (error) {
      logger.error(`Error generating AI answer: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to generate answer" });
    }
  });

  app.get("/api/wiki/article/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const article = await aiWikiService.getArticleById(id);
      
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }

      const relatedArticles = await aiWikiService.suggestRelatedArticles(id);
      res.json({ article, relatedArticles });
    } catch (error) {
      logger.error(`Error fetching article: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to fetch article" });
    }
  });

  // Onboarding endpoints
  app.get("/api/onboarding/progress", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      let progress = await storage.getOnboardingProgress(userId!);
      
      // Auto-create onboarding progress if it doesn't exist
      if (!progress) {
        progress = await storage.createOnboardingProgress(userId!);
      }
      
      res.json(progress);
    } catch (error) {
      logger.error(`Error fetching onboarding progress: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to fetch onboarding progress" });
    }
  });

  app.post("/api/onboarding/select-role", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { role } = req.body;
      
      if (!role || !['creator', 'fan'].includes(role)) {
        return res.status(400).json({ message: "Invalid role. Must be 'creator' or 'fan'" });
      }

      // Update user role
      await storage.updateUser(userId!, { role });

      // Update onboarding progress
      let progress = await storage.getOnboardingProgress(userId!);
      if (!progress) {
        progress = await storage.createOnboardingProgress(userId!);
      }

      progress = await storage.updateOnboardingProgress(userId!, {
        roleSelected: role,
        currentStep: 'profile_setup',
      });

      res.json({ progress, role });
    } catch (error) {
      logger.error(`Error selecting role: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to select role" });
    }
  });

  app.post("/api/onboarding/setup-profile", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { displayName, stageName, pronouns, bio, avatarUrl, bannerUrl } = req.body;

      // Update profile
      const profile = await storage.updateProfile(userId!, {
        displayName,
        stageName,
        pronouns,
        bio,
        avatarUrl,
        bannerUrl,
      });

      // Update onboarding progress
      const progress = await storage.updateOnboardingProgress(userId!, {
        profileSetupComplete: true,
        currentStep: 'interests_selection',
      });

      res.json({ profile, progress });
    } catch (error) {
      logger.error(`Error setting up profile: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to set up profile" });
    }
  });

  app.post("/api/onboarding/select-interests", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { nicheIds } = req.body;

      if (!Array.isArray(nicheIds)) {
        return res.status(400).json({ message: "nicheIds must be an array" });
      }

      // Save user interests
      await storage.setUserInterests(userId!, nicheIds);

      // Update onboarding progress
      const progress = await storage.updateOnboardingProgress(userId!, {
        interestsSelected: true,
        currentStep: 'verification',
      });

      res.json({ progress });
    } catch (error) {
      logger.error(`Error selecting interests: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to select interests" });
    }
  });

  app.post("/api/onboarding/complete", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;

      // Mark onboarding as complete
      const progress = await storage.updateOnboardingProgress(userId!, {
        onboardingComplete: true,
        currentStep: 'completed',
      });

      res.json({ progress });
    } catch (error) {
      logger.error(`Error completing onboarding: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to complete onboarding" });
    }
  });

  app.get("/api/niches", async (req, res) => {
    try {
      const niches = await storage.getContentNiches();
      res.json(niches);
    } catch (error) {
      logger.error(`Error fetching niches: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to fetch niches" });
    }
  });

  // Feed endpoints (Infinity Scroll)
  app.get("/api/feed", optionalAuth, apiRateLimit, validate({ query: paginationSchema }), async (req, res) => {
    try {
      const { page, limit } = req.query as { page: number; limit: number };
      const userId = req.user!.id;
      
      const posts = await storage.getPosts({ page, limit, userId });
      res.json(posts);
    } catch (error) {
      logger.error(`Error fetching feed: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to fetch feed" });
    }
  });

  app.get("/api/posts/:id", apiRateLimit, validate({ params: idParamSchema }), async (req, res) => {
    try {
      const post = await storage.getPostById(req.params.id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.json(post);
    } catch (error) {
      logger.error(`Error fetching post: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to fetch post" });
    }
  });

  app.post("/api/posts", requireAuth, requireCreator, apiRateLimit, validate({ body: createPostSchema }), async (req, res) => {
    try {
      const userId = req.user!.id;
      const postData = {
        ...req.body,
        creatorId: userId,
      };
      
      const post = await storage.createPost(postData);
      
      // Log post creation
      await storage.createAuditLog({
        actorId: userId,
        action: 'post_created',
        targetType: 'post',
        targetId: post.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      
      res.status(201).json(post);
    } catch (error) {
      logger.error(`Error creating post: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  app.put("/api/posts/:id", requireAuth, requireCreator, apiRateLimit, validate({ params: idParamSchema, body: updatePostSchema }), async (req, res) => {
    try {
      const post = await storage.getPostById(req.params.id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      const userId = req.user!.id;
      if (post.creatorId !== userId) {
        return res.status(403).json({ message: "Not authorized to edit this post" });
      }
      
      const updatedPost = await storage.updatePost(req.params.id, req.body);
      res.json(updatedPost);
    } catch (error) {
      logger.error(`Error updating post: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to update post" });
    }
  });

  // Post Like endpoints
  app.post("/api/posts/:id/like", requireAuth, apiRateLimit, validate({ params: idParamSchema }), async (req, res) => {
    try {
      const userId = req.user!.id;
      const result = await storage.togglePostLike(userId, req.params.id);
      res.json(result);
    } catch (error) {
      logger.error(`Error toggling like: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to toggle like" });
    }
  });

  app.get("/api/posts/:id/liked", requireAuth, apiRateLimit, validate({ params: idParamSchema }), async (req, res) => {
    try {
      const userId = req.user!.id;
      const liked = await storage.isPostLikedByUser(userId, req.params.id);
      res.json({ liked });
    } catch (error) {
      logger.error(`Error checking like status: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to check like status" });
    }
  });

  // Post Comment endpoints
  app.get("/api/posts/:id/comments", apiRateLimit, validate({ params: idParamSchema }), async (req, res) => {
    try {
      const comments = await storage.getPostComments(req.params.id);
      res.json(comments);
    } catch (error) {
      logger.error(`Error fetching comments: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post("/api/posts/:id/comments", requireAuth, apiRateLimit, validate({ params: idParamSchema, body: z.object({ text: z.string().min(1).max(2000) }) }), async (req, res) => {
    try {
      const userId = req.user!.id;
      const { text } = req.body;
      const comment = await storage.addComment(userId, req.params.id, text);
      res.status(201).json(comment);
    } catch (error) {
      logger.error(`Error adding comment: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to add comment" });
    }
  });

  // Follow endpoints
  app.post("/api/follow/:creatorId", requireAuth, apiRateLimit, validate({ params: creatorIdParamSchema }), async (req, res) => {
    try {
      const userId = req.user!.id;
      const { creatorId } = req.params;
      
      // Check if already following
      const isFollowing = await storage.isFollowing(userId, creatorId);
      if (isFollowing) {
        return res.status(400).json({ message: "Already following this creator" });
      }
      
      const follow = await storage.followCreator(userId, creatorId);
      res.status(201).json(follow);
    } catch (error) {
      logger.error(`Error following creator: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to follow creator" });
    }
  });

  app.delete("/api/follow/:creatorId", requireAuth, apiRateLimit, validate({ params: creatorIdParamSchema }), async (req, res) => {
    try {
      const userId = req.user!.id;
      const { creatorId } = req.params;
      
      await storage.unfollowCreator(userId, creatorId);
      res.status(204).send();
    } catch (error) {
      logger.error(`Error unfollowing creator: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to unfollow creator" });
    }
  });

  app.get("/api/following", requireAuth, apiRateLimit, async (req, res) => {
    try {
      const userId = req.user!.id;
      const following = await storage.getFollowing(userId);
      res.json(following);
    } catch (error) {
      logger.error(`Error fetching following: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to fetch following" });
    }
  });

  // Story Moment endpoints
  app.get("/api/stories", optionalAuth, apiRateLimit, async (req, res) => {
    try {
      const userId = req.user!.id;
      const stories = await storage.getActiveStories(userId);
      res.json(stories);
    } catch (error) {
      logger.error(`Error fetching stories: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to fetch stories" });
    }
  });

  app.get("/api/stories/creator/:creatorId", optionalAuth, apiRateLimit, async (req, res) => {
    try {
      const { creatorId } = req.params;
      const stories = await storage.getCreatorStories(creatorId);
      res.json(stories);
    } catch (error) {
      logger.error(`Error fetching creator stories: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to fetch creator stories" });
    }
  });

  app.post("/api/stories", requireAuth, requireCreator, apiRateLimit, validate({ body: createStorySchema }), async (req, res) => {
    try {
      const userId = req.user!.id;
      const { mediaUrl, mediaType, mediaThumbnailUrl, caption, isFree, requiresSubscription } = req.body;
      
      // Set expiration to 24 hours from now
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      const storyData = {
        creatorId: userId,
        mediaUrl,
        mediaType,
        mediaThumbnailUrl,
        caption,
        isFree,
        requiresSubscription,
        expiresAt,
      };
      
      const story = await storage.createStory(storyData);
      
      // Log story creation
      await storage.createAuditLog({
        actorId: userId,
        action: 'story_created',
        targetType: 'story',
        targetId: story.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      
      res.status(201).json(story);
    } catch (error) {
      logger.error(`Error creating story: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to create story" });
    }
  });

  app.post("/api/stories/:id/view", requireAuth, apiRateLimit, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      
      await storage.viewStory(id, userId);
      res.status(204).send();
    } catch (error) {
      logger.error(`Error viewing story: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to view story" });
    }
  });

  app.get("/api/stories/:id/views", requireAuth, apiRateLimit, validate({ params: idParamSchema }), async (req, res) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      
      // Get story to check ownership
      const story = await db.select().from(storyMoments).where(eq(storyMoments.id, id)).limit(1);
      if (!story || story.length === 0) {
        return res.status(404).json({ message: "Story not found" });
      }
      
      // Only creator can view their story's views
      if (story[0].creatorId !== userId) {
        return res.status(403).json({ message: "Not authorized to view story analytics" });
      }
      
      const views = await storage.getStoryViews(id);
      res.json(views);
    } catch (error) {
      logger.error(`Error fetching story views: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to fetch story views" });
    }
  });

  // Fan Level & Gamification endpoints
  app.get("/api/fan-level", requireAuth, apiRateLimit, async (req, res) => {
    try {
      const userId = req.user!.id;
      let fanLevel = await storage.getFanLevel(userId);
      
      if (!fanLevel) {
        // Create default fan level if it doesn't exist
        fanLevel = await storage.createFanLevel({
          userId,
          level: 1,
          xp: 0,
        });
      }
      
      res.json(fanLevel);
    } catch (error) {
      logger.error(`Error fetching fan level: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to fetch fan level" });
    }
  });

  app.post("/api/fan-level/add-xp", requireAuth, apiRateLimit, validate({ body: addXPSchema }), async (req, res) => {
    try {
      const userId = req.user!.id;
      const { amount, reason } = req.body;
      
      const fanLevel = await storage.addXP(userId, amount, reason);
      res.json(fanLevel);
    } catch (error) {
      logger.error(`Error adding XP: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to add XP" });
    }
  });

  app.post("/api/fan-level/update-streak", requireAuth, apiRateLimit, async (req, res) => {
    try {
      const userId = req.user!.id;
      const fanLevel = await storage.updateStreak(userId);
      res.json(fanLevel);
    } catch (error) {
      logger.error(`Error updating streak: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to update streak" });
    }
  });

  // Creator Analytics endpoints
  app.get("/api/analytics/current", requireAuth, requireCreator, apiRateLimit, async (req, res) => {
    try {
      const userId = req.user!.id;
      const analytics = await storage.getCurrentAnalytics(userId);
      res.json(analytics);
    } catch (error) {
      logger.error(`Error fetching current analytics: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  app.get("/api/analytics/:period", requireAuth, requireCreator, apiRateLimit, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { period } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 30;
      
      if (!["daily", "weekly", "monthly"].includes(period)) {
        return res.status(400).json({ message: "Invalid period. Must be daily, weekly, or monthly" });
      }
      
      const analytics = await storage.getCreatorAnalytics(userId, period as "daily" | "weekly" | "monthly", limit);
      res.json(analytics);
    } catch (error) {
      logger.error(`Error fetching analytics: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  app.post("/api/analytics/view/:postId", optionalAuth, apiRateLimit, async (req, res) => {
    try {
      const { postId } = req.params;
      const userId = req.user!.id;
      await storage.recordView(postId, userId);
      res.status(204).send();
    } catch (error) {
      logger.error(`Error recording view: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to record view" });
    }
  });

  app.post("/api/analytics/like/:postId", requireAuth, apiRateLimit, async (req, res) => {
    try {
      const { postId } = req.params;
      const userId = req.user!.id;
      await storage.recordLike(postId, userId);
      res.status(204).send();
    } catch (error) {
      logger.error(`Error recording like: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to record like" });
    }
  });

  app.post("/api/analytics/comment/:postId", requireAuth, apiRateLimit, async (req, res) => {
    try {
      const { postId } = req.params;
      const userId = req.user!.id;
      await storage.recordComment(postId, userId);
      res.status(204).send();
    } catch (error) {
      logger.error(`Error recording comment: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to record comment" });
    }
  });

  // Support ticket endpoints
  app.get("/api/tickets", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const tickets = await storage.getSupportTickets(userId);
      res.json(tickets);
    } catch (error) {
      logger.error(`Error fetching support tickets: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to fetch support tickets" });
    }
  });

  app.post("/api/tickets", requireAuth, validate({ body: createTicketSchema }), async (req, res) => {
    try {
      const userId = req.user!.id;
      const { title, description, category, priority } = req.body;

      const ticketData = {
        userId,
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        status: "open" as const,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const ticket = await storage.createSupportTicket(ticketData);
      res.status(201).json(ticket);
    } catch (error) {
      logger.error(`Error creating support ticket: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to create support ticket" });
    }
  });

  app.patch("/api/tickets/:ticketId", requireAuth, async (req, res) => {
    try {
      const { ticketId } = req.params;
      const userId = req.user!.id;
      const updates = req.body;

      const updatedTicket = await storage.updateSupportTicket(ticketId, userId, updates);
      if (!updatedTicket) {
        return res.status(404).json({ message: "Ticket not found or access denied" });
      }

      res.json(updatedTicket);
    } catch (error) {
      logger.error(`Error updating support ticket: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to update support ticket" });
    }
  });

  // Mobile API endpoints (ClubCentral integration)
  app.post("/api/mobile/auth/login", authRateLimit, async (req, res) => {
    try {
      const result = await authService.login(req.body);
      res.json(result);
    } catch (error) {
      res.status(401).json({ message: "Invalid credentials" });
    }
  });

  app.post("/api/mobile/auth/register", authRateLimit, async (req, res) => {
    try {
      const result = await authService.register(req.body);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Registration failed" });
    }
  });

  app.get("/api/mobile/profile", authenticateJWT, async (req, res) => {
    try {
      const userId = req.user!.id;
      const user = await storage.getUser(userId);
      const profile = await storage.getProfile(userId);
      res.json({ ...user, profile });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.post("/api/mobile/notifications/register", authenticateJWT, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { token, platform } = req.body;
      await notificationService.registerDeviceToken(userId, token, platform);
      res.json({ message: "Device token registered" });
    } catch (error) {
      res.status(500).json({ message: "Failed to register device token" });
    }
  });

  // API Gateway endpoints
  app.get("/api/gateway/health", async (req, res) => {
    try {
      const status = apiGatewayService.getServiceStatus();
      const cacheStats = apiGatewayService.getCacheStats();
      res.json({ services: status, cache: cacheStats });
    } catch (error) {
      res.status(500).json({ message: "Failed to get gateway health" });
    }
  });

  app.post("/api/gateway/route/:service/*", apiRateLimit, async (req, res) => {
    try {
      const { service } = req.params;
      const path = req.params[0];
      
      const result = await apiGatewayService.routeRequest(service, `/${path}`, {
        method: req.method,
        data: req.body,
      });
      
      res.json(result);
    } catch (error) {
      logger.error(`Gateway routing failed for service ${req.params.service}: ${error instanceof Error ? error.message : String(error)}`);
      res.status(503).json({ message: "Service unavailable" });
    }
  });

  // 🔥 FanzTrust™ Payment & Refund System
  
  // Authorization middleware for refund management
  const requireRefundManager = async (req: any, res: any, next: any) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      
      // Load refund request
      const refundRequest = await storage.getRefundRequest(id);
      if (!refundRequest) {
        return res.status(404).json({ message: "Refund request not found" });
      }
      
      // Check authorization
      const user = await storage.getUser(userId);
      const isAuthorized = user?.role === "admin" || 
                          (user?.role === "creator" && refundRequest.creatorId === userId);
      
      if (!isAuthorized) {
        return res.status(403).json({ message: "Not authorized to manage this refund" });
      }
      
      // Attach refund request to req for handler use
      req.refundRequest = refundRequest;
      next();
    } catch (error) {
      logger.error(`Authorization check failed: ${error instanceof Error ? error.message : String(error)}`);
      return res.status(500).json({ message: "Authorization check failed" });
    }
  };
  
  // Transaction verification endpoint
  app.post("/api/fanztrust/verify-transaction", authenticateJWT, validate({ body: verifyTransactionSchema }), async (req: any, res) => {
    try {
      const userId = req.user!.id;
      const { creatorId, gateway, txid, walletAddress, email } = req.body;
      
      // Query transaction from database
      const transaction = await storage.findTransaction({
        fanId: userId,
        creatorId,
        gateway,
        txid,
        walletAddress,
      });
      
      if (!transaction) {
        return res.json({
          status: "not_verified",
          active: false,
          message: "No matching transaction found"
        });
      }
      
      // Check if subscription is active
      const isActive = transaction.status === "completed" && 
                       transaction.subscriptionId !== null;
      
      // Audit log
      await storage.createAuditLog({
        actorId: userId,
        action: "verify_transaction",
        targetType: "transaction",
        targetId: transaction.id,
        metadata: { status: "verified", active: isActive },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({
        status: "verified",
        active: isActive,
        transaction: {
          id: transaction.id,
          amount: transaction.amountCents / 100,
          currency: transaction.currency,
          createdAt: transaction.createdAt,
        }
      });
    } catch (error) {
      logger.error(`Transaction verification failed: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Verification failed" });
    }
  });

  // Request refund endpoint
  app.post("/api/fanztrust/request-refund", authenticateJWT, validate({ body: requestRefundSchema }), async (req: any, res) => {
    try {
      const userId = req.user!.id;
      const { transactionId, reason, verificationData } = req.body;
      
      // Get transaction
      const transaction = await storage.getTransaction(transactionId);
      if (!transaction || transaction.fanId !== userId) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      // Check if already refunded or requested
      const existingRefund = await storage.findRefundRequest(transactionId);
      if (existingRefund) {
        return res.status(400).json({ message: "Refund already requested" });
      }
      
      // Auto-verification logic
      const autoCheckResult = await storage.performAutoRefundCheck(transaction, {
        requestTime: new Date(),
        ipAddress: req.ip,
        deviceFingerprint: req.headers['x-device-fingerprint'],
      });
      
      // Create refund request
      const refundRequest = await storage.createRefundRequest({
        transactionId,
        fanId: userId,
        creatorId: transaction.creatorId,
        reason,
        verificationData,
        autoCheckResult,
        status: autoCheckResult.autoApprove ? "auto_approved" : "pending",
      });
      
      // Update trust score
      await storage.updateTrustScore(userId, { refundAttempts: 1 });

      // Audit log
      await storage.createAuditLog({
        actorId: userId,
        action: "request_refund",
        targetType: "refund_request",
        targetId: refundRequest.id,
        metadata: { transactionId, status: refundRequest.status, reason },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      
      res.json({
        refundRequest,
        status: autoCheckResult.autoApprove ? "auto_approved" : "pending_review",
        message: autoCheckResult.autoApprove 
          ? "Refund automatically approved" 
          : "Refund request submitted for review"
      });
    } catch (error) {
      logger.error(`Refund request failed: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Refund request failed" });
    }
  });

  // Get refund requests (creator view)
  app.get("/api/fanztrust/refund-requests", authenticateJWT, async (req: any, res) => {
    try {
      const userId = req.user!.id;
      const user = await storage.getUser(userId);
      
      let refundRequests;
      if (user?.role === "admin") {
        // Admin sees all
        refundRequests = await storage.getAllRefundRequests();
      } else if (user?.role === "creator") {
        // Creator sees their own
        refundRequests = await storage.getCreatorRefundRequests(userId);
      } else {
        // Fan sees their requests
        refundRequests = await storage.getFanRefundRequests(userId);
      }
      
      res.json(refundRequests);
    } catch (error) {
      logger.error(`Failed to fetch refund requests: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to fetch refund requests" });
    }
  });

  // Approve refund (creator/admin only)
  app.post("/api/fanztrust/refund-requests/:id/approve", authenticateJWT, validate({ body: reviewRefundSchema }), requireRefundManager, async (req: any, res) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { notes } = req.body;
      const refundRequest = req.refundRequest; // Attached by middleware
      
      const updated = await storage.updateRefundRequest(id, {
        status: "approved",
        reviewedBy: userId,
        reviewNotes: notes,
      });
      
      // Update trust score
      await storage.updateTrustScore(refundRequest.fanId, { approvedRefunds: 1 });

      // Audit log
      await storage.createAuditLog({
        actorId: userId,
        action: "approve_refund",
        targetType: "refund_request",
        targetId: id,
        metadata: { fanId: refundRequest.fanId, notes },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      
      res.json(updated);
    } catch (error) {
      logger.error(`Failed to approve refund: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to approve refund" });
    }
  });

  // Deny refund (creator/admin only)
  app.post("/api/fanztrust/refund-requests/:id/deny", authenticateJWT, validate({ body: reviewRefundSchema }), requireRefundManager, async (req: any, res) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { notes } = req.body;
      const refundRequest = req.refundRequest; // Attached by middleware
      
      const updated = await storage.updateRefundRequest(id, {
        status: "denied",
        reviewedBy: userId,
        reviewNotes: notes,
      });
      
      // Update trust score (negative impact for denied refunds)
      await storage.updateTrustScore(refundRequest.fanId, { deniedRefunds: 1 });

      // Audit log
      await storage.createAuditLog({
        actorId: userId,
        action: "deny_refund",
        targetType: "refund_request",
        targetId: id,
        metadata: { fanId: refundRequest.fanId, notes },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      
      res.json(updated);
    } catch (error) {
      logger.error(`Failed to deny refund: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to deny refund" });
    }
  });

  // Get user's FanzWallet
  app.get("/api/fanztrust/wallet", authenticateJWT, async (req: any, res) => {
    try {
      const userId = req.user!.id;
      let wallet = await storage.getFanzWallet(userId);
      
      // Auto-create wallet if it doesn't exist
      if (!wallet) {
        wallet = await storage.createFanzWallet({ userId });
      }
      
      res.json(wallet);
    } catch (error) {
      logger.error(`Failed to fetch wallet: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to fetch wallet" });
    }
  });

  // Get user's trust score
  app.get("/api/fanztrust/trust-score", authenticateJWT, async (req: any, res) => {
    try {
      const userId = req.user!.id;
      let trustScore = await storage.getTrustScore(userId);
      
      // Auto-create trust score if it doesn't exist
      if (!trustScore) {
        trustScore = await storage.createTrustScore({ userId });
      }
      
      res.json(trustScore);
    } catch (error) {
      logger.error(`Failed to fetch trust score: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to fetch trust score" });
    }
  });

  // Get transaction history
  app.get("/api/fanztrust/transactions", authenticateJWT, async (req: any, res) => {
    try {
      const userId = req.user!.id;
      const { type } = req.query; // 'fan' or 'creator'
      
      const transactions = type === "creator" 
        ? await storage.getCreatorTransactions(userId)
        : await storage.getFanTransactions(userId);
      
      res.json(transactions);
    } catch (error) {
      logger.error(`Failed to fetch transactions: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Get payment methods
  app.get("/api/fanztrust/payment-methods", authenticateJWT, async (req: any, res) => {
    try {
      const userId = req.user!.id;
      const paymentMethods = await storage.getPaymentMethods(userId);
      res.json(paymentMethods);
    } catch (error) {
      logger.error(`Failed to fetch payment methods: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to fetch payment methods" });
    }
  });

  // Add payment method
  app.post("/api/fanztrust/payment-methods", authenticateJWT, validate({ body: createPaymentMethodSchema }), async (req: any, res) => {
    try {
      const userId = req.user!.id;
      const { type, gateway, reference, displayName, isDefault, metadata } = req.body;
      
      const paymentMethod = await storage.createPaymentMethod({
        userId,
        type,
        gateway,
        reference,
        displayName,
        isDefault,
        metadata,
      });
      
      res.json(paymentMethod);
    } catch (error) {
      logger.error(`Failed to add payment method: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to add payment method" });
    }
  });

  // ===================
  // Live Streaming Routes
  // ===================

  // Helper to get user ID from either auth method (JWT or Replit OAuth)
  const getUserId = (req: any): string => {
    return req.user?.id;
  };

  // Create new stream
  app.post("/api/streams", authenticateJWT, requireCreator, async (req: any, res) => {
    try {
      const creatorId = getUserId(req);
      const { title, description, thumbnailUrl, scheduledStartTime, requiresSubscription, isRecorded } = req.body;
      
      const streamKey = `stream_${creatorId}_${Date.now()}`;
      
      const stream = await storage.createStream({
        creatorId,
        title,
        description,
        thumbnailUrl,
        scheduledStartTime: scheduledStartTime ? new Date(scheduledStartTime) : null,
        requiresSubscription: requiresSubscription ?? false,
        isRecorded: isRecorded ?? true,
        streamKey,
        status: "scheduled",
      });
      
      res.json(stream);
    } catch (error) {
      logger.error(`Failed to create stream: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to create stream" });
    }
  });

  // Get all live streams
  app.get("/api/streams/live", async (req: any, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 50;
      const streams = await storage.getLiveStreams(limit);
      res.json(streams);
    } catch (error) {
      logger.error(`Failed to fetch live streams: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to fetch live streams" });
    }
  });

  // Get creator's streams
  app.get("/api/streams/creator/:creatorId", async (req: any, res) => {
    try {
      const { creatorId } = req.params;
      const { status } = req.query;
      const streams = await storage.getCreatorStreams(creatorId, status as any);
      res.json(streams);
    } catch (error) {
      logger.error(`Failed to fetch creator streams: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to fetch creator streams" });
    }
  });

  // Get stream details
  app.get("/api/streams/:streamId", async (req: any, res) => {
    try {
      const { streamId } = req.params;
      const stream = await storage.getStream(streamId);
      
      if (!stream) {
        return res.status(404).json({ message: "Stream not found" });
      }
      
      res.json(stream);
    } catch (error) {
      logger.error(`Failed to fetch stream: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to fetch stream" });
    }
  });

  // Start stream (go live)
  app.post("/api/streams/:streamId/start", authenticateJWT, async (req: any, res) => {
    try {
      const { streamId } = req.params;
      const userId = getUserId(req);
      
      const stream = await storage.getStream(streamId);
      if (!stream) {
        return res.status(404).json({ message: "Stream not found" });
      }
      
      if (stream.creatorId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const updatedStream = await storage.startStream(streamId);
      res.json(updatedStream);
    } catch (error) {
      logger.error(`Failed to start stream: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to start stream" });
    }
  });

  // End stream
  app.post("/api/streams/:streamId/end", authenticateJWT, async (req: any, res) => {
    try {
      const { streamId } = req.params;
      const userId = getUserId(req);
      
      const stream = await storage.getStream(streamId);
      if (!stream) {
        return res.status(404).json({ message: "Stream not found" });
      }
      
      if (stream.creatorId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const updatedStream = await storage.endStream(streamId);
      res.json(updatedStream);
    } catch (error) {
      logger.error(`Failed to end stream: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to end stream" });
    }
  });

  // Join stream (viewer)
  app.post("/api/streams/:streamId/join", authenticateJWT, async (req: any, res) => {
    try {
      const { streamId } = req.params;
      const viewerId = getUserId(req);
      
      await storage.joinStream(streamId, viewerId);
      res.json({ message: "Joined stream successfully" });
    } catch (error) {
      logger.error(`Failed to join stream: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to join stream" });
    }
  });

  // Leave stream
  app.post("/api/streams/:streamId/leave", authenticateJWT, async (req: any, res) => {
    try {
      const { streamId } = req.params;
      const viewerId = getUserId(req);
      
      await storage.leaveStream(streamId, viewerId);
      res.json({ message: "Left stream successfully" });
    } catch (error) {
      logger.error(`Failed to leave stream: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to leave stream" });
    }
  });

  // Get stream chat
  app.get("/api/streams/:streamId/chat", async (req: any, res) => {
    try {
      const { streamId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit) : 100;
      const messages = await storage.getStreamChat(streamId, limit);
      res.json(messages);
    } catch (error) {
      logger.error(`Failed to fetch stream chat: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to fetch stream chat" });
    }
  });

  // Send stream chat message
  app.post("/api/streams/:streamId/chat", authenticateJWT, async (req: any, res) => {
    try {
      const { streamId } = req.params;
      const userId = getUserId(req);
      const { message } = req.body;
      
      if (!message || message.trim().length === 0) {
        return res.status(400).json({ message: "Message cannot be empty" });
      }
      
      const chat = await storage.sendStreamChat(streamId, userId, message);
      res.json(chat);
    } catch (error) {
      logger.error(`Failed to send chat message: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to send chat message" });
    }
  });

  // Send stream tip
  app.post("/api/streams/:streamId/tip", authenticateJWT, async (req: any, res) => {
    try {
      const { streamId } = req.params;
      const fromUserId = getUserId(req);
      const { amount, message } = req.body;
      
      const stream = await storage.getStream(streamId);
      if (!stream) {
        return res.status(404).json({ message: "Stream not found" });
      }
      
      const tip = await storage.sendStreamTip({
        streamId,
        fromUserId,
        toCreatorId: stream.creatorId,
        amount: amount.toString(),
        message,
      });
      
      res.json(tip);
    } catch (error) {
      logger.error(`Failed to send tip: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to send tip" });
    }
  });

  // Get stream tips
  app.get("/api/streams/:streamId/tips", async (req: any, res) => {
    try {
      const { streamId } = req.params;
      const tips = await storage.getStreamTips(streamId);
      res.json(tips);
    } catch (error) {
      logger.error(`Failed to fetch stream tips: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to fetch stream tips" });
    }
  });

  // ===================
  // Collaboration Routes
  // ===================
  
  app.post("/api/collaborations", authenticateJWT, requireCreator, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const collab = await storage.createCollaboration({ ...req.body, primaryCreatorId: userId });
      res.json(collab);
    } catch (error) {
      logger.error(`Failed to create collaboration: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to create collaboration" });
    }
  });

  app.post("/api/collaborations/:id/respond", authenticateJWT, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { accept } = req.body;
      const updated = await storage.respondToCollaboration(id, accept);
      res.json(updated);
    } catch (error) {
      logger.error(`Failed to respond to collaboration: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to respond" });
    }
  });

  app.get("/api/collaborations", authenticateJWT, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const collabs = await storage.getCollaborations(userId);
      res.json(collabs);
    } catch (error) {
      logger.error(`Failed to get collaborations: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to get collaborations" });
    }
  });

  // ===================
  // Subscription Tier Routes
  // ===================

  app.post("/api/subscription-tiers", authenticateJWT, requireCreator, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const tier = await storage.createSubscriptionTier({ ...req.body, creatorId: userId });
      res.json(tier);
    } catch (error) {
      logger.error(`Failed to create tier: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to create tier" });
    }
  });

  app.get("/api/subscription-tiers/:creatorId", async (req: any, res) => {
    try {
      const { creatorId } = req.params;
      const tiers = await storage.getCreatorTiers(creatorId);
      res.json(tiers);
    } catch (error) {
      logger.error(`Failed to get tiers: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to get tiers" });
    }
  });

  // ===================
  // Content Bundle Routes
  // ===================

  app.post("/api/bundles", authenticateJWT, requireCreator, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const bundle = await storage.createContentBundle({ ...req.body, creatorId: userId });
      res.json(bundle);
    } catch (error) {
      logger.error(`Failed to create bundle: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to create bundle" });
    }
  });

  app.get("/api/bundles/:creatorId", async (req: any, res) => {
    try {
      const { creatorId } = req.params;
      const bundles = await storage.getCreatorBundles(creatorId);
      res.json(bundles);
    } catch (error) {
      logger.error(`Failed to get bundles: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to get bundles" });
    }
  });

  app.post("/api/bundles/:bundleId/purchase", authenticateJWT, async (req: any, res) => {
    try {
      const { bundleId } = req.params;
      const userId = getUserId(req);
      const result = await storage.purchaseBundle(bundleId, userId);
      res.json(result);
    } catch (error) {
      logger.error(`Failed to purchase bundle: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to purchase bundle" });
    }
  });

  // ===================
  // Virtual Gifts Routes
  // ===================

  app.get("/api/gifts", async (req: any, res) => {
    try {
      const gifts = await storage.getVirtualGifts();
      res.json(gifts);
    } catch (error) {
      logger.error(`Failed to get gifts: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to get gifts" });
    }
  });

  app.post("/api/gifts/send", authenticateJWT, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const sent = await storage.sendGift({ ...req.body, fromUserId: userId });
      res.json(sent);
    } catch (error) {
      logger.error(`Failed to send gift: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to send gift" });
    }
  });

  app.get("/api/gifts/received", authenticateJWT, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const gifts = await storage.getGiftsReceived(userId);
      res.json(gifts);
    } catch (error) {
      logger.error(`Failed to get received gifts: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to get gifts" });
    }
  });

  // ===================
  // Leaderboard Routes
  // ===================

  app.get("/api/leaderboards/:period/:category", async (req: any, res) => {
    try {
      const { period, category } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const leaderboard = await storage.getLeaderboard(period, category, limit);
      res.json(leaderboard);
    } catch (error) {
      logger.error(`Failed to get leaderboard: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to get leaderboard" });
    }
  });

  // ===================
  // Referral Routes
  // ===================

  app.post("/api/referrals/code", authenticateJWT, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const code = await storage.createReferralCode(userId);
      res.json(code);
    } catch (error) {
      logger.error(`Failed to create referral code: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to create code" });
    }
  });

  app.get("/api/referrals/code", authenticateJWT, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const code = await storage.getReferralCode(userId);
      res.json(code);
    } catch (error) {
      logger.error(`Failed to get referral code: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to get code" });
    }
  });

  // ===================
  // Scheduled Posts Routes
  // ===================

  app.post("/api/scheduled-posts", authenticateJWT, requireCreator, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const post = await storage.createScheduledPost({ ...req.body, creatorId: userId });
      res.json(post);
    } catch (error) {
      logger.error(`Failed to schedule post: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to schedule post" });
    }
  });

  app.get("/api/scheduled-posts", authenticateJWT, requireCreator, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const posts = await storage.getScheduledPosts(userId);
      res.json(posts);
    } catch (error) {
      logger.error(`Failed to get scheduled posts: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to get posts" });
    }
  });

  // ===================
  // Creator Badges Routes
  // ===================

  app.get("/api/badges/:userId", async (req: any, res) => {
    try {
      const { userId } = req.params;
      const badges = await storage.getUserBadges(userId);
      res.json(badges);
    } catch (error) {
      logger.error(`Failed to get badges: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to get badges" });
    }
  });

  // ===================
  // Geo-blocking Routes
  // ===================

  app.post("/api/geo-blocking", authenticateJWT, requireCreator, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const rule = await storage.createGeoBlockingRule({ ...req.body, creatorId: userId });
      res.json(rule);
    } catch (error) {
      logger.error(`Failed to create geo-blocking rule: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to create rule" });
    }
  });

  app.get("/api/geo-blocking", authenticateJWT, requireCreator, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const rules = await storage.getGeoBlockingRules(userId);
      res.json(rules);
    } catch (error) {
      logger.error(`Failed to get geo-blocking rules: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to get rules" });
    }
  });

  // ===================
  // Search & Tags Routes
  // ===================

  app.get("/api/search", async (req: any, res) => {
    try {
      const results = await storage.searchContent(req.query);
      res.json(results);
    } catch (error) {
      logger.error(`Search failed: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Search failed" });
    }
  });

  // ===================
  // DMCA Routes
  // ===================

  app.post("/api/dmca/claims", async (req: any, res) => {
    try {
      const claim = await storage.createDmcaClaim(req.body);
      res.json(claim);
    } catch (error) {
      logger.error(`Failed to create DMCA claim: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to create claim" });
    }
  });

  app.get("/api/dmca/claims", authenticateJWT, requireAdmin, async (req: any, res) => {
    try {
      const { status } = req.query;
      const claims = await storage.getDmcaClaims(status as string);
      res.json(claims);
    } catch (error) {
      logger.error(`Failed to get DMCA claims: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to get claims" });
    }
  });

  app.post("/api/dmca/claims/:id/review", authenticateJWT, requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { approved } = req.body;
      const userId = getUserId(req);
      const updated = await storage.reviewDmcaClaim(id, approved, userId);
      res.json(updated);
    } catch (error) {
      logger.error(`Failed to review DMCA claim: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to review claim" });
    }
  });

  // ===================
  // AI Moderation & Deepfake Detection Routes
  // ===================

  app.post("/api/moderation/scan", authenticateJWT, validate({ body: createAiScanJobSchema }), async (req: any, res) => {
    try {
      const job = await storage.createAiScanJob(req.body);
      res.status(201).json(job);
    } catch (error) {
      logger.error(`Failed to create AI scan job: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to create scan job" });
    }
  });

  app.get("/api/moderation/jobs/:mediaId", authenticateJWT, validate({ params: mediaIdPathParamSchema }), async (req: any, res) => {
    try {
      const { mediaId } = req.params;
      const userId = getUserId(req);
      const jobs = await storage.getAiScanJobsByMedia(mediaId, userId);
      res.json(jobs);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to get AI scan jobs: ${errorMessage}`);
      
      if (errorMessage.includes("Unauthorized")) {
        return res.status(403).json({ message: errorMessage });
      } else if (errorMessage.includes("not found")) {
        return res.status(404).json({ message: errorMessage });
      }
      res.status(500).json({ message: "Failed to get scan jobs" });
    }
  });

  app.get("/api/moderation/queue", authenticateJWT, requireAdmin, async (req: any, res) => {
    try {
      const queue = await storage.getAiScanQueue();
      res.json(queue);
    } catch (error) {
      logger.error(`Failed to get scan queue: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to get queue" });
    }
  });

  app.get("/api/moderation/results/:jobId", authenticateJWT, validate({ params: jobIdPathParamSchema }), async (req: any, res) => {
    try {
      const { jobId } = req.params;
      const userId = getUserId(req);
      const results = await storage.getAiScanResults(jobId, userId);
      res.json(results);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to get scan results: ${errorMessage}`);
      
      if (errorMessage.includes("Unauthorized")) {
        return res.status(403).json({ message: errorMessage });
      } else if (errorMessage.includes("not found")) {
        return res.status(404).json({ message: errorMessage });
      }
      res.status(500).json({ message: "Failed to get results" });
    }
  });

  app.post("/api/moderation/fingerprint", authenticateJWT, validate({ body: createContentFingerprintSchema }), async (req: any, res) => {
    try {
      const fingerprint = await storage.createContentFingerprint(req.body);
      res.status(201).json(fingerprint);
    } catch (error) {
      logger.error(`Failed to create content fingerprint: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to create fingerprint" });
    }
  });

  app.get("/api/moderation/fingerprints/:mediaId", authenticateJWT, validate({ params: mediaIdPathParamSchema }), async (req: any, res) => {
    try {
      const { mediaId } = req.params;
      const userId = getUserId(req);
      const fingerprint = await storage.getContentFingerprint(mediaId, userId);
      res.json(fingerprint);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to get content fingerprint: ${errorMessage}`);
      
      if (errorMessage.includes("Unauthorized")) {
        return res.status(403).json({ message: errorMessage });
      } else if (errorMessage.includes("not found")) {
        return res.status(404).json({ message: errorMessage });
      }
      res.status(500).json({ message: "Failed to get fingerprint" });
    }
  });

  app.get("/api/moderation/results/media/:mediaId", authenticateJWT, validate({ params: mediaIdPathParamSchema }), async (req: any, res) => {
    try {
      const { mediaId } = req.params;
      const userId = getUserId(req);
      const results = await storage.getAiScanResultsByMedia(mediaId, userId);
      res.json(results);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to get scan results by media: ${errorMessage}`);
      
      if (errorMessage.includes("Unauthorized")) {
        return res.status(403).json({ message: errorMessage });
      } else if (errorMessage.includes("not found")) {
        return res.status(404).json({ message: errorMessage });
      }
      res.status(500).json({ message: "Failed to get scan results" });
    }
  });

  app.post("/api/moderation/results/:id/review", authenticateJWT, validate({ params: idParamSchema, body: reviewAiScanResultSchema }), async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = getUserId(req);
      const reviewed = await storage.reviewAiScanResult(id, req.body, userId);
      res.json(reviewed);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to review scan result: ${errorMessage}`);
      
      if (errorMessage.includes("Unauthorized")) {
        return res.status(403).json({ message: errorMessage });
      } else if (errorMessage.includes("not found")) {
        return res.status(404).json({ message: errorMessage });
      }
      res.status(500).json({ message: "Failed to review result" });
    }
  });

  app.post("/api/moderation/fingerprints/:id/verify", authenticateJWT, validate({ params: idParamSchema, body: verifyContentFingerprintSchema }), async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = getUserId(req);
      const verified = await storage.verifyContentFingerprint(id, req.body, userId);
      res.json(verified);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to verify fingerprint: ${errorMessage}`);
      
      if (errorMessage.includes("Unauthorized")) {
        return res.status(403).json({ message: errorMessage });
      } else if (errorMessage.includes("not found")) {
        return res.status(404).json({ message: errorMessage });
      }
      res.status(500).json({ message: "Failed to verify fingerprint" });
    }
  });

  // ===================
  // Loan Routes
  // ===================

  app.post("/api/loans/programs", authenticateJWT, requireAdmin, validate({ body: createLoanProgramSchema }), async (req: any, res) => {
    try {
      const program = await storage.createLoanProgram(req.body);
      res.status(201).json(program);
    } catch (error) {
      logger.error(`Failed to create loan program: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to create program" });
    }
  });

  app.get("/api/loans/programs", authenticateJWT, async (req: any, res) => {
    try {
      const programs = await storage.getLoanPrograms();
      res.json(programs);
    } catch (error) {
      logger.error(`Failed to get loan programs: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to get programs" });
    }
  });

  app.post("/api/loans/apply", authenticateJWT, requireCreator, validate({ body: createLoanApplicationSchema }), async (req: any, res) => {
    try {
      const creatorId = getUserId(req);
      const application = await storage.createLoanApplication({ ...req.body, creatorId });
      res.status(201).json(application);
    } catch (error) {
      logger.error(`Failed to apply for loan: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to apply for loan" });
    }
  });

  app.get("/api/loans/applications/:creatorId", authenticateJWT, verifyOwnership("creatorId"), validate({ params: creatorIdPathParamSchema }), async (req: any, res) => {
    try {
      const { creatorId } = req.params;
      const applications = await storage.getLoanApplicationsByCreator(creatorId);
      res.json(applications);
    } catch (error) {
      logger.error(`Failed to get loan applications: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to get applications" });
    }
  });

  app.post("/api/loans/offer", authenticateJWT, validate({ body: createLoanOfferSchema }), async (req: any, res) => {
    try {
      const lenderId = getUserId(req);
      const offer = await storage.createLoanOffer({ ...req.body, lenderId });
      res.status(201).json(offer);
    } catch (error) {
      logger.error(`Failed to create loan offer: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to create offer" });
    }
  });

  app.get("/api/loans/offers/:lenderId", authenticateJWT, verifyOwnership("lenderId"), validate({ params: lenderIdPathParamSchema }), async (req: any, res) => {
    try {
      const { lenderId } = req.params;
      const offers = await storage.getLoanOffersByLender(lenderId);
      res.json(offers);
    } catch (error) {
      logger.error(`Failed to get loan offers: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to get offers" });
    }
  });

  app.post("/api/loans/offers/:id/accept", authenticateJWT, requireCreator, validate({ params: idParamSchema }), async (req: any, res) => {
    try {
      const { id } = req.params;
      const offer = await storage.acceptLoanOffer(id, getUserId(req));
      res.json(offer);
    } catch (error) {
      logger.error(`Failed to accept loan offer: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to accept offer" });
    }
  });

  app.get("/api/loans/repayments/:offerId", authenticateJWT, validate({ params: offerIdPathParamSchema }), async (req: any, res) => {
    try {
      const { offerId } = req.params;
      const userId = getUserId(req);
      const repayments = await storage.getLoanRepaymentsByOffer(offerId, userId);
      res.json(repayments);
    } catch (error) {
      logger.error(`Failed to get loan repayments: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to get repayments" });
    }
  });

  app.post("/api/loans/repayments/:id/pay", authenticateJWT, requireCreator, validate({ params: idParamSchema, body: payLoanRepaymentSchema }), async (req: any, res) => {
    try {
      const { id } = req.params;
      const repayment = await storage.payLoanRepayment(id, req.body.amount, getUserId(req));
      res.json(repayment);
    } catch (error) {
      logger.error(`Failed to pay loan repayment: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to pay repayment" });
    }
  });

  // ===================
  // NFT Routes
  // ===================

  app.post("/api/nft/deploy-contract", authenticateJWT, requireCreator, validate({ body: deployNftContractSchema }), async (req: any, res) => {
    try {
      const creatorId = getUserId(req);
      const contract = await storage.deployNftContract({ ...req.body, creatorId });
      res.status(201).json(contract);
    } catch (error) {
      logger.error(`Failed to deploy NFT contract: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to deploy contract" });
    }
  });

  app.get("/api/nft/contracts/:creatorId", authenticateJWT, verifyOwnership("creatorId"), validate({ params: creatorIdPathParamSchema }), async (req: any, res) => {
    try {
      const { creatorId } = req.params;
      const contracts = await storage.getNftContractsByCreator(creatorId);
      res.json(contracts);
    } catch (error) {
      logger.error(`Failed to get NFT contracts: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to get contracts" });
    }
  });

  app.post("/api/nft/mint", authenticateJWT, requireCreator, validate({ body: mintNftSchema }), async (req: any, res) => {
    try {
      const creatorId = getUserId(req);
      const mint = await storage.mintNft(req.body, creatorId);
      res.status(201).json(mint);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to mint NFT: ${errorMessage}`);
      
      // Return 403 for authorization errors, 404 for not found, 500 for others
      if (errorMessage.includes("Unauthorized")) {
        return res.status(403).json({ message: errorMessage });
      } else if (errorMessage.includes("not found")) {
        return res.status(404).json({ message: errorMessage });
      }
      res.status(500).json({ message: "Failed to mint NFT" });
    }
  });

  app.get("/api/nft/mints/:contractId", authenticateJWT, validate({ params: contractIdPathParamSchema }), async (req: any, res) => {
    try {
      const { contractId } = req.params;
      const userId = getUserId(req);
      const mints = await storage.getNftMintsByContract(contractId, userId);
      res.json(mints);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to get NFT mints: ${errorMessage}`);
      
      // Return 403 for authorization errors, 404 for not found, 500 for others
      if (errorMessage.includes("Unauthorized")) {
        return res.status(403).json({ message: errorMessage });
      } else if (errorMessage.includes("not found")) {
        return res.status(404).json({ message: errorMessage });
      }
      res.status(500).json({ message: "Failed to get mints" });
    }
  });

  app.post("/api/nft/royalty", authenticateJWT, validate({ body: recordNftRoyaltySchema }), async (req: any, res) => {
    try {
      const creatorId = getUserId(req);
      const royalty = await storage.recordNftRoyalty(req.body, creatorId);
      res.status(201).json(royalty);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to record NFT royalty: ${errorMessage}`);
      
      // Return 403 for authorization errors, 404 for not found, 500 for others
      if (errorMessage.includes("Unauthorized")) {
        return res.status(403).json({ message: errorMessage });
      } else if (errorMessage.includes("not found")) {
        return res.status(404).json({ message: errorMessage });
      }
      res.status(500).json({ message: "Failed to record royalty" });
    }
  });

  app.get("/api/nft/royalties/:creatorId", authenticateJWT, verifyOwnership("creatorId"), validate({ params: creatorIdPathParamSchema }), async (req: any, res) => {
    try {
      const { creatorId } = req.params;
      const royalties = await storage.getNftRoyaltiesByCreator(creatorId);
      res.json(royalties);
    } catch (error) {
      logger.error(`Failed to get NFT royalties: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to get royalties" });
    }
  });

  app.get("/api/nft/royalties/stats/:creatorId", authenticateJWT, verifyOwnership("creatorId"), validate({ params: creatorIdPathParamSchema }), async (req: any, res) => {
    try {
      const { creatorId } = req.params;
      const stats = await storage.getNftRoyaltyStats(creatorId);
      res.json(stats);
    } catch (error) {
      logger.error(`Failed to get NFT royalty stats: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to get stats" });
    }
  });

  app.get("/api/nft/marketplace", authenticateJWT, async (req: any, res) => {
    try {
      const nfts = await storage.getMarketplaceNfts();
      res.json(nfts);
    } catch (error) {
      logger.error(`Failed to get marketplace NFTs: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({ message: "Failed to get marketplace NFTs" });
    }
  });

  app.post("/api/nft/purchase", authenticateJWT, validate({ body: z.object({ nftId: z.string().uuid() }) }), async (req: any, res) => {
    try {
      const { nftId } = req.body;
      const userId = req.user.id;
      
      // Get the NFT
      const nft = await storage.getNftMintById(nftId);
      if (!nft) {
        return res.status(404).json({ message: "NFT not found" });
      }
      
      // Check if already owned by anyone
      if (nft.ownerId) {
        if (nft.ownerId === userId) {
          return res.status(400).json({ message: "You already own this NFT" });
        } else {
          return res.status(409).json({ message: "NFT already sold to another user" });
        }
      }
      
      // Simulate purchase (update owner)
      const purchased = await storage.purchaseNft(nftId, userId);
      res.json(purchased);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to purchase NFT: ${errorMessage}`);
      
      if (errorMessage.includes("already sold")) {
        return res.status(409).json({ message: "NFT already sold to another user" });
      } else if (errorMessage.includes("not found")) {
        return res.status(404).json({ message: errorMessage });
      }
      res.status(500).json({ message: "Failed to purchase NFT" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  // WebSocket server for real-time features
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  // Store active connections and their subscriptions
  const clients = new Map<string, { ws: any; userId?: string; rooms: Set<string> }>();

  wss.on("connection", (ws, req) => {
    const clientId = Math.random().toString(36).substring(7);
    clients.set(clientId, { ws, rooms: new Set() });
    
    logger.info(`WebSocket connection established [${clientId}] from ${req.socket.remoteAddress}`);

    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());
        logger.debug(`WebSocket message received from [${clientId}]: ${message.type}`);
        const client = clients.get(clientId);

        switch (message.type) {
          case "ping":
            ws.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
            break;

          case "auth":
            // Authenticate client with userId
            if (message.userId) {
              if (client) {
                client.userId = message.userId;
                ws.send(JSON.stringify({ type: "authenticated", userId: message.userId }));
                logger.info(`Client [${clientId}] authenticated as user ${message.userId}`);
              }
            }
            break;

          case "subscribe":
            // Subscribe to room (user channel, chat, stream, etc.)
            if (message.room && client) {
              client.rooms.add(message.room);
              ws.send(JSON.stringify({ type: "subscribed", room: message.room }));
              logger.debug(`Client [${clientId}] subscribed to room: ${message.room}`);
            }
            break;

          case "unsubscribe":
            // Unsubscribe from room
            if (message.room && client) {
              client.rooms.delete(message.room);
              ws.send(JSON.stringify({ type: "unsubscribed", room: message.room }));
              logger.debug(`Client [${clientId}] unsubscribed from room: ${message.room}`);
            }
            break;

          case "message":
            // Handle real-time chat messages
            if (message.recipientId && message.content && client?.userId) {
              // Save message to database
              const savedMessage = await storage.createMessage({
                senderId: client.userId,
                recipientId: message.recipientId,
                content: message.content,
                mediaUrl: message.mediaUrl,
              });

              // Broadcast to recipient if they're online
              for (const [id, c] of clients) {
                if (c.userId === message.recipientId) {
                  c.ws.send(JSON.stringify({
                    type: "new_message",
                    message: savedMessage,
                  }));
                }
              }

              // Confirm to sender
              ws.send(JSON.stringify({ type: "message_sent", messageId: savedMessage.id }));
              logger.info(`Message sent from ${client.userId} to ${message.recipientId}`);
            }
            break;

          case "broadcast":
            // Broadcast message to a room (e.g., live stream chat)
            if (message.room && message.content && client) {
              const broadcastData = {
                type: "room_message",
                room: message.room,
                from: client.userId,
                content: message.content,
                timestamp: Date.now(),
              };

              // Send to all clients in the same room
              for (const [id, c] of clients) {
                if (c.rooms.has(message.room)) {
                  c.ws.send(JSON.stringify(broadcastData));
                }
              }
              logger.debug(`Broadcast sent to room ${message.room} from [${clientId}]`);
            }
            break;

          default:
            logger.warn(`Unknown WebSocket message type from [${clientId}]: ${message.type}`);
        }
      } catch (error) {
        logger.error(`WebSocket message error [${clientId}]: ${error instanceof Error ? error.message : String(error)}`);
        ws.send(JSON.stringify({ type: "error", message: "Invalid message format" }));
      }
    });

    ws.on("close", () => {
      const client = clients.get(clientId);
      logger.debug(`WebSocket connection closed [${clientId}] ${client?.userId ? `(user ${client.userId})` : ""}`);
      clients.delete(clientId);
    });

    ws.on("error", (error) => {
      logger.error(`WebSocket error [${clientId}]: ${error instanceof Error ? error.message : String(error)}`);
    });

    // Send welcome message
    ws.send(JSON.stringify({ 
      type: "connected", 
      message: "Connected to DaddyFanz real-time server",
      clientId,
      timestamp: Date.now(),
    }));
  });

  logger.info("WebSocket server initialized on path: /ws");

  return httpServer;
}
