import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { centralBrain } from "./centralBrain";
import { paymentService } from "./payments";
import { emailService } from "./email";
import { verifyMyService } from "./verifymy";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import { insertCreatorSchema, insertPostSchema, insertMessageSchema, insertTipSchema, insertSubscriptionSchema } from "@shared/schema";
import { pool } from "./db";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // The auth routes are now handled in setupAuth

  // Health check endpoint
  app.get('/healthz', async (req, res) => {
    try {
      // Check database connection
      let dbStatus = 'unknown';
      try {
        await pool.query('SELECT 1');
        dbStatus = 'connected';
      } catch (error) {
        dbStatus = 'disconnected';
        console.error('Database health check failed:', error);
      }

      const health = {
        status: dbStatus === 'connected' ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        service: 'FANZ Creator App',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        database: dbStatus
      };

      const statusCode = dbStatus === 'connected' ? 200 : 503;
      res.status(statusCode).json(health);
    } catch (error: any) {
      res.status(500).json({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // System metrics endpoint
  app.get('/system', async (req, res) => {
    try {
      // Check database connection
      let dbStatus = 'unknown';
      try {
        await pool.query('SELECT 1');
        dbStatus = 'connected';
      } catch (error) {
        dbStatus = 'disconnected';
        console.error('Database health check failed:', error);
      }

      const system = {
        service: {
          name: 'FANZ Creator App',
          version: process.env.npm_package_version || '1.0.0',
          environment: process.env.NODE_ENV || 'development'
        },
        health: {
          status: 'operational',
          uptime: process.uptime(),
          timestamp: new Date().toISOString()
        },
        metrics: {
          memory: process.memoryUsage(),
          cpu: process.cpuUsage(),
          pid: process.pid
        },
        endpoints: [
          '/healthz',
          '/system',
          '/docs',
          '/version'
        ],
        database: {
          status: dbStatus
        },
        integrations: {
          fanzdash: {
            registered: true,
            lastHeartbeat: new Date().toISOString()
          }
        }
      };

      res.json(system);
    } catch (error: any) {
      res.status(500).json({
        error: error.message
      });
    }
  });

  // Version endpoint
  app.get('/version', (req, res) => {
    const version = {
      service: 'FANZ Creator App',
      version: process.env.npm_package_version || '1.0.0',
      buildDate: process.env.BUILD_DATE || new Date().toISOString(),
      commit: process.env.GIT_COMMIT || 'unknown',
      branch: process.env.GIT_BRANCH || 'main',
      nodeVersion: process.version,
      platform: process.platform
    };

    res.json(version);
  });

  // User profile endpoint for local authentication
  app.get('/api/user', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Check if user has creator profile
      const creator = await storage.getCreatorByUserId(user.id);
      
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        hasCreatorProfile: !!creator,
        userType: creator ? 'creator' : 'fan'
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Creator routes
  app.get('/api/creator/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const creator = await storage.getCreatorByUserId(userId);
      res.json(creator);
    } catch (error) {
      console.error("Error fetching creator profile:", error);
      res.status(500).json({ message: "Failed to fetch creator profile" });
    }
  });

  app.post('/api/creator/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validation = insertCreatorSchema.safeParse({ ...req.body, userId });
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid creator data", errors: validation.error.errors });
      }
      
      const existingCreator = await storage.getCreatorByUserId(userId);
      if (existingCreator) {
        const updated = await storage.updateCreator(existingCreator.id, validation.data);
        return res.json(updated);
      }
      
      const creator = await storage.createCreator(validation.data);
      res.json(creator);
    } catch (error) {
      console.error("Error creating/updating creator profile:", error);
      res.status(500).json({ message: "Failed to save creator profile" });
    }
  });

  app.get('/api/creators', async (req, res) => {
    try {
      const creators = await storage.getAllCreators();
      res.json(creators);
    } catch (error) {
      console.error("Error fetching creators:", error);
      res.status(500).json({ message: "Failed to fetch creators" });
    }
  });

  app.get('/api/creator/:username', async (req, res) => {
    try {
      const creator = await storage.getCreatorByUsername(req.params.username);
      if (!creator) {
        return res.status(404).json({ message: "Creator not found" });
      }
      res.json(creator);
    } catch (error) {
      console.error("Error fetching creator:", error);
      res.status(500).json({ message: "Failed to fetch creator" });
    }
  });

  // Post routes
  app.get('/api/posts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const creator = await storage.getCreatorByUserId(userId);
      
      if (!creator) {
        return res.json([]);  // Return empty array if no creator profile
      }
      
      const posts = await storage.getPostsByCreator(creator.id);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.post('/api/posts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const creator = await storage.getCreatorByUserId(userId);
      
      if (!creator) {
        return res.status(404).json({ message: "Creator profile not found" });
      }
      
      const validation = insertPostSchema.safeParse({ ...req.body, creatorId: creator.id });
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid post data", errors: validation.error.errors });
      }
      
      const post = await storage.createPost(validation.data);
      res.json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  app.get('/api/creator/:creatorId/posts', async (req, res) => {
    try {
      const posts = await storage.getPostsByCreator(req.params.creatorId);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching creator posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  // Message routes
  app.get('/api/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const conversations = await storage.getConversationsForUser(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.get('/api/messages/:otherUserId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const messages = await storage.getMessagesBetweenUsers(userId, req.params.otherUserId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validation = insertMessageSchema.safeParse({ ...req.body, senderId: userId });
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid message data", errors: validation.error.errors });
      }
      
      const message = await storage.createMessage(validation.data);
      res.json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Subscription routes
  app.get('/api/subscribers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const creator = await storage.getCreatorByUserId(userId);
      
      if (!creator) {
        return res.json([]);  // Return empty array if no creator profile
      }
      
      const subscribers = await storage.getSubscribersByCreator(creator.id);
      res.json(subscribers);
    } catch (error) {
      console.error("Error fetching subscribers:", error);
      res.status(500).json({ message: "Failed to fetch subscribers" });
    }
  });

  app.post('/api/subscribe/:creatorId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { creatorId } = req.params;
      
      const creator = await storage.getCreator(creatorId);
      if (!creator) {
        return res.status(404).json({ message: "Creator not found" });
      }
      
      const existingSubscription = await storage.getSubscription(userId, creatorId);
      if (existingSubscription) {
        return res.status(400).json({ message: "Already subscribed" });
      }
      
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);
      
      const subscription = await storage.createSubscription({
        fanId: userId,
        creatorId,
        status: "active",
        startDate: new Date(),
        endDate,
        price: creator.subscriptionPrice || "9.99",
      });

      // Sync with central brain
      try {
        await centralBrain.syncSubscription(subscription, creatorId);
        await centralBrain.broadcastEvent({
          action: 'subscription_created',
          platform: 'fanzclub',
          data: { subscription, creatorId },
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Failed to sync subscription with central brain:', error);
      }
      
      res.json(subscription);
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });

  // Tip routes
  app.post('/api/tips', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validation = insertTipSchema.safeParse({ ...req.body, fromUserId: userId });
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid tip data", errors: validation.error.errors });
      }
      
      const tip = await storage.createTip(validation.data);
      res.json(tip);
    } catch (error) {
      console.error("Error sending tip:", error);
      res.status(500).json({ message: "Failed to send tip" });
    }
  });

  app.get('/api/tips', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const creator = await storage.getCreatorByUserId(userId);
      
      if (!creator) {
        return res.json([]);  // Return empty array if no creator profile
      }
      
      const tips = await storage.getTipsByCreator(creator.id);
      res.json(tips);
    } catch (error) {
      console.error("Error fetching tips:", error);
      res.status(500).json({ message: "Failed to fetch tips" });
    }
  });

  // Analytics routes
  app.get('/api/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const creator = await storage.getCreatorByUserId(userId);
      
      if (!creator) {
        return res.json([]);  // Return empty array if no creator profile
      }
      
      const { startDate, endDate } = req.query;
      const analytics = await storage.getAnalyticsByCreator(
        creator.id,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Object storage routes for file uploads
  app.get("/objects/:objectPath(*)", isAuthenticated, async (req: any, res) => {
    const userId = req.user?.id;
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: ObjectPermission.READ,
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    res.json({ uploadURL });
  });

  app.put("/api/content-media", isAuthenticated, async (req: any, res) => {
    if (!req.body.mediaURL) {
      return res.status(400).json({ error: "mediaURL is required" });
    }

    const userId = req.user?.id;

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.mediaURL,
        {
          owner: userId,
          visibility: req.body.visibility === 'public' ? 'public' : 'private',
        },
      );

      res.status(200).json({
        objectPath: objectPath,
      });
    } catch (error) {
      console.error("Error setting content media:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Payment routes
  app.post('/api/payments/subscription', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { creatorId, period } = req.body;
      
      const creator = await storage.getCreator(creatorId);
      if (!creator) {
        return res.status(404).json({ message: "Creator not found" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const paymentData = paymentService.createSubscriptionPayment({
        creatorId,
        fanId: userId,
        fanName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        fanEmail: user.email || '',
        amount: creator.subscriptionPrice || '9.99',
        period: period || 'monthly',
        description: `Subscription to ${creator.displayName}`
      });
      
      res.json(paymentData);
    } catch (error) {
      console.error("Error creating subscription payment:", error);
      res.status(500).json({ message: "Failed to create subscription payment" });
    }
  });

  app.post('/api/payments/tip', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { creatorId, amount, message } = req.body;
      
      const creator = await storage.getCreator(creatorId);
      if (!creator) {
        return res.status(404).json({ message: "Creator not found" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const paymentData = paymentService.createTipPayment({
        creatorId,
        fanId: userId,
        fanName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        fanEmail: user.email || '',
        amount,
        message
      });
      
      res.json(paymentData);
    } catch (error) {
      console.error("Error creating tip payment:", error);
      res.status(500).json({ message: "Failed to create tip payment" });
    }
  });

  // Payment webhooks
  app.post('/api/webhooks/ccbill', async (req, res) => {
    try {
      const signature = req.headers['x-ccbill-signature'] as string;
      const webhookData = paymentService.processWebhook('ccbill', req.body, signature);
      
      // Process the webhook based on type
      switch (webhookData.type) {
        case 'subscription_success':
          // Create or activate subscription
          // Implementation depends on your business logic
          console.log('Subscription successful:', webhookData);
          break;
        case 'subscription_cancellation':
          // Cancel subscription
          console.log('Subscription cancelled:', webhookData);
          break;
        case 'renewal':
          // Renew subscription
          console.log('Subscription renewed:', webhookData);
          break;
        case 'chargeback':
          // Handle chargeback
          console.log('Chargeback received:', webhookData);
          break;
      }
      
      res.status(200).send('OK');
    } catch (error) {
      console.error("CCBill webhook error:", error);
      res.status(400).json({ message: "Webhook processing failed" });
    }
  });

  app.post('/api/webhooks/paxum', async (req, res) => {
    try {
      const webhookData = paymentService.processWebhook('paxum', req.body);
      
      // Process the webhook based on type
      switch (webhookData.type) {
        case 'payment_success':
        case 'subscription_success':
          // Create or activate subscription/tip
          console.log('Payment successful:', webhookData);
          break;
        case 'payment_failed':
          // Handle failed payment
          console.log('Payment failed:', webhookData);
          break;
        case 'subscription_cancelled':
          // Cancel subscription
          console.log('Subscription cancelled:', webhookData);
          break;
      }
      
      res.status(200).send('OK');
    } catch (error) {
      console.error("Paxum webhook error:", error);
      res.status(400).json({ message: "Webhook processing failed" });
    }
  });

  // Settings routes
  app.get('/api/settings', isAuthenticated, async (req: any, res) => {
    try {
      // Return default settings for now - in a real app this would be stored in database
      const defaultSettings = {
        notifications: {
          newSubscriber: true,
          newMessage: true,
          newTip: true,
          paymentReceived: true,
          emailNotifications: true,
        },
        privacy: {
          profileVisible: true,
          showOnlineStatus: true,
          allowDirectMessages: "subscribers",
        },
        payment: {
          processor: "ccbill",
          defaultPrice: "9.99",
          currency: "USD",
        },
        preferences: {
          theme: "dark",
          language: "en",
          timezone: "UTC",
        },
      };
      res.json(defaultSettings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.put('/api/settings', isAuthenticated, async (req: any, res) => {
    try {
      // In a real app, this would save to database
      console.log('Settings updated:', req.body);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Verification routes
  app.post('/api/verification/submit', async (req, res) => {
    try {
      const {
        firstName,
        lastName,
        email,
        dateOfBirth,
        profilePhotoUrl,
        documentType,
        documentFrontUrl,
        documentBackUrl,
        selfieUrl
      } = req.body;

      // Validate required fields
      if (!firstName || !lastName || !email || !dateOfBirth || !profilePhotoUrl) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Check if user already exists with this email
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Calculate age
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      // Must be 18+
      if (age < 18) {
        return res.status(400).json({ message: "You must be 18 or older to join FANZ" });
      }

      // Create user account in pending state
      const userId = await storage.createPendingUser({
        firstName,
        lastName,
        email,
        dateOfBirth: birthDate,
        profileImageUrl: profilePhotoUrl,
        verificationStatus: 'pending',
        ageVerified: false,
        idVerified: false,
        hasAccessCode: false,
        platformAccessGranted: false
      });

      // Create verification request
      const verificationRequest = await storage.createVerificationRequest({
        userId,
        verificationType: 'identity',
        documentType,
        documentFrontUrl,
        documentBackUrl,
        selfieUrl,
        dateOfBirth: birthDate,
        status: 'pending',
        submittedAt: new Date()
      });

      // Add to moderation queue
      await storage.addToModerationQueue({
        userId,
        verificationRequestId: verificationRequest.id,
        queueType: 'identity_verification',
        priority: 'normal',
        status: 'pending',
        submittedAt: new Date()
      });

      res.json({
        success: true,
        message: "Verification submitted successfully. You'll receive an email once your profile is approved.",
        userId
      });
    } catch (error) {
      console.error("Error submitting verification:", error);
      res.status(500).json({ message: "Failed to submit verification" });
    }
  });

  app.post('/api/verification/validate-code', async (req, res) => {
    try {
      const { email, code } = req.body;

      if (!email || !code) {
        return res.status(400).json({ message: "Email and code are required" });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Validate access code
      const accessCode = await storage.getAccessCode(code);
      if (!accessCode) {
        // Track failed attempt
        await storage.trackFailedAccessAttempt(email, code);
        return res.status(400).json({ message: "Invalid access code" });
      }

      // Check if code belongs to this user
      if (accessCode.userId !== user.id) {
        await storage.trackFailedAccessAttempt(email, code);
        return res.status(400).json({ message: "Invalid access code" });
      }

      // Check if code is expired
      if (new Date() > new Date(accessCode.expiresAt)) {
        return res.status(400).json({ message: "Access code has expired. Please request a new one." });
      }

      // Check if code was already used
      if (accessCode.usedAt) {
        return res.status(400).json({ message: "Access code has already been used" });
      }

      // Mark code as used
      await storage.markAccessCodeUsed(code);

      // Grant platform access to user
      await storage.grantPlatformAccess(user.id);

      res.json({
        success: true,
        message: "Access granted! Welcome to FANZ.",
        userId: user.id
      });
    } catch (error) {
      console.error("Error validating access code:", error);
      res.status(500).json({ message: "Failed to validate access code" });
    }
  });

  app.post('/api/verification/resend-code', async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user is approved
      if (user.verificationStatus !== 'approved') {
        return res.status(400).json({
          message: "Your verification is still pending. You'll receive an access code once approved."
        });
      }

      // Check if user already has access
      if (user.platformAccessGranted) {
        return res.status(400).json({ message: "You already have platform access." });
      }

      // Invalidate old code
      await storage.invalidateAccessCodesForUser(user.id);

      // Generate new access code
      const newCode = await storage.generateAccessCode(user.id);

      // Send email with new code
      await emailService.sendAccessCode(email, user.firstName || 'Creator', newCode);

      res.json({
        success: true,
        message: "A new access code has been sent to your email."
      });
    } catch (error) {
      console.error("Error resending access code:", error);
      res.status(500).json({ message: "Failed to resend access code" });
    }
  });

  app.get('/api/verification/status/:userId', async (req, res) => {
    try {
      const { userId } = req.params;

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        verificationStatus: user.verificationStatus,
        ageVerified: user.ageVerified,
        idVerified: user.idVerified,
        hasAccessCode: user.hasAccessCode,
        platformAccessGranted: user.platformAccessGranted,
        moderationNotes: user.moderationNotes
      });
    } catch (error) {
      console.error("Error fetching verification status:", error);
      res.status(500).json({ message: "Failed to fetch verification status" });
    }
  });

  // Admin/Moderation endpoints
  // TODO: Add proper admin authentication middleware
  app.post('/api/admin/verification/approve/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const { moderatorNotes } = req.body;

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update user verification status
      await storage.updateUserVerificationStatus(userId, {
        verificationStatus: 'approved',
        ageVerified: true,
        idVerified: true,
        moderationNotes
      });

      // Generate access code
      const accessCode = await storage.generateAccessCode(userId);

      // Send approval email with access code
      await emailService.sendVerificationApproved(
        user.email!,
        user.firstName || 'Creator',
        accessCode
      );

      res.json({
        success: true,
        message: "Verification approved and access code sent to user",
        userId,
        accessCode
      });
    } catch (error) {
      console.error("Error approving verification:", error);
      res.status(500).json({ message: "Failed to approve verification" });
    }
  });

  app.post('/api/admin/verification/reject/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const { reasons, moderatorNotes } = req.body;

      if (!reasons || !Array.isArray(reasons) || reasons.length === 0) {
        return res.status(400).json({ message: "Rejection reasons are required" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update user verification status
      await storage.updateUserVerificationStatus(userId, {
        verificationStatus: 'rejected',
        moderationNotes: moderatorNotes || reasons.join('; ')
      });

      // Send rejection email
      await emailService.sendVerificationRejected(
        user.email!,
        user.firstName || 'User',
        reasons
      );

      res.json({
        success: true,
        message: "Verification rejected and user notified",
        userId
      });
    } catch (error) {
      console.error("Error rejecting verification:", error);
      res.status(500).json({ message: "Failed to reject verification" });
    }
  });

  app.get('/api/admin/moderation/queue', async (req, res) => {
    try {
      const { status, queueType } = req.query;

      const queue = await storage.getModerationQueue(
        status as string | undefined,
        queueType as string | undefined
      );

      res.json(queue);
    } catch (error) {
      console.error("Error fetching moderation queue:", error);
      res.status(500).json({ message: "Failed to fetch moderation queue" });
    }
  });

  // Payment success/cancel pages
  app.get('/payment/success', (req, res) => {
    res.redirect('/?payment=success');
  });

  app.get('/payment/cancel', (req, res) => {
    res.redirect('/?payment=cancelled');
  });

  const httpServer = createServer(app);
  return httpServer;
}
