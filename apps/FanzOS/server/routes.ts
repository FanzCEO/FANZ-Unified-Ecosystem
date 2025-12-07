import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, requireRole, sendVerificationCode, verifyCode, verifyTwoFactor, setupTwoFactor, hashPassword } from "./authService";
import { createNotification, subscribeToPush, unsubscribeFromPush, markNotificationRead, getUserNotifications, getUnreadNotificationCount, startCreatorActivityMonitoring } from "./notificationService";
import passport from "passport";
import { 
  insertPostSchema, 
  insertSubscriptionSchema, 
  insertMessageSchema, 
  insertTransactionSchema,
  insertShortVideoSchema,
  insertShortVideoReactionSchema
} from "@shared/schema";
import { z } from "zod";
import { 
  paymentService, 
  PaymentProcessor, 
  PaymentType, 
  type PaymentRequest 
} from "./paymentService";
import { mediaService } from "./mediaService";
import { smsService, SMSMessageType } from "./smsService";
import { aiAssistantService, AIRequestType, AIAssistantType } from "./aiAssistantService";
import { shortVideoService, FeedType } from "./shortVideoService";

// Import all controllers
import { creatorController } from "./controllers/CreatorController";
import { fanController } from "./controllers/FanController";
import { contentController } from "./controllers/ContentController";
import { adminController } from "./controllers/AdminController";
import { messagingController } from "./controllers/MessagingController";
import { complianceController } from "./controllers/ComplianceController";
import { liveStreamController } from "./controllers/LiveStreamController";
import { userTaggingService } from "./userTaggingService";
import { ReplitIntegrationController } from "./controllers/ReplitIntegrationController";
import { replitIntegrations } from "./replitIntegrationsService";
import { realTimeManager } from "./realtime";

// Initialize Replit Integration Controller
const replitController = new ReplitIntegrationController();

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Start creator activity monitoring
  startCreatorActivityMonitoring();

  // ============= AUTHENTICATION ROUTES =============
  
  // Register with email
  app.post('/api/auth/register/email', async (req, res) => {
    try {
      const { email, password, firstName, lastName, role = "fanz" } = req.body;
      
      // Check if user exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }
      
      // Create user
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        email,
        passwordHash: hashedPassword,
        firstName,
        lastName,
        role,
        emailVerified: false,
      });
      
      // Send verification code
      await sendVerificationCode("email", email, user.id);
      
      res.status(201).json({ 
        message: "Registration successful. Please check your email for verification code.",
        userId: user.id 
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Register with phone
  app.post('/api/auth/register/phone', async (req, res) => {
    try {
      const { phoneNumber, password, firstName, lastName, role = "fanz" } = req.body;
      
      // Check if user exists
      const existingUser = await storage.getUserByPhone(phoneNumber);
      if (existingUser) {
        return res.status(400).json({ message: "Phone number already registered" });
      }
      
      // Create user
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        phoneNumber,
        passwordHash: hashedPassword,
        firstName,
        lastName,
        role,
        phoneVerified: false,
      });
      
      // Send verification code
      await sendVerificationCode("phone", phoneNumber, user.id);
      
      res.status(201).json({ 
        message: "Registration successful. Please check your SMS for verification code.",
        userId: user.id 
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Verify email or phone
  app.post('/api/auth/verify', async (req, res) => {
    try {
      const { type, destination, code, userId } = req.body;
      
      const isValid = await verifyCode(type, destination, code);
      if (!isValid) {
        return res.status(400).json({ message: "Invalid or expired verification code" });
      }
      
      // Update user verification status
      if (type === "email") {
        await storage.updateUser(userId, { emailVerified: true });
      } else if (type === "phone") {
        await storage.updateUser(userId, { phoneVerified: true });
      }
      
      res.json({ message: "Verification successful" });
    } catch (error) {
      console.error("Verification error:", error);
      res.status(500).json({ message: "Verification failed" });
    }
  });

  // Login with email
  app.post('/api/auth/login/email', 
    passport.authenticate('local-email'),
    async (req: any, res) => {
      // Check if 2FA is enabled
      if (req.user.twoFactorEnabled) {
        return res.json({ 
          message: "2FA required", 
          requiresTwoFactor: true,
          userId: req.user.id 
        });
      }
      res.json(req.user);
    }
  );

  // Login with phone
  app.post('/api/auth/login/phone',
    passport.authenticate('local-phone'),
    async (req: any, res) => {
      // Check if 2FA is enabled
      if (req.user.twoFactorEnabled) {
        return res.json({ 
          message: "2FA required", 
          requiresTwoFactor: true,
          userId: req.user.id 
        });
      }
      res.json(req.user);
    }
  );

  // Verify 2FA
  app.post('/api/auth/2fa/verify', async (req, res) => {
    try {
      const { userId, token } = req.body;
      
      const isValid = await verifyTwoFactor(userId, token);
      if (!isValid) {
        return res.status(400).json({ message: "Invalid 2FA token" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login failed" });
        }
        res.json(user);
      });
    } catch (error) {
      console.error("2FA verification error:", error);
      res.status(500).json({ message: "2FA verification failed" });
    }
  });

  // Setup 2FA
  app.post('/api/auth/2fa/setup', isAuthenticated, async (req: any, res) => {
    try {
      const { secret, qrCode } = await setupTwoFactor(req.user.id);
      res.json({ secret, qrCode });
    } catch (error) {
      console.error("2FA setup error:", error);
      res.status(500).json({ message: "2FA setup failed" });
    }
  });

  // Enable 2FA
  app.post('/api/auth/2fa/enable', isAuthenticated, async (req: any, res) => {
    try {
      const { token } = req.body;
      
      const isValid = await verifyTwoFactor(req.user.id, token);
      if (!isValid) {
        return res.status(400).json({ message: "Invalid 2FA token" });
      }
      
      await storage.updateUser(req.user.id, { twoFactorEnabled: true });
      res.json({ message: "2FA enabled successfully" });
    } catch (error) {
      console.error("2FA enable error:", error);
      res.status(500).json({ message: "Failed to enable 2FA" });
    }
  });

  // Social auth routes
  app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
  app.get('/api/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/auth' }),
    (req, res) => res.redirect('/')
  );

  app.get('/api/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));
  app.get('/api/auth/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/auth' }),
    (req, res) => res.redirect('/')
  );

  app.get('/api/auth/twitter', passport.authenticate('twitter'));
  app.get('/api/auth/twitter/callback',
    passport.authenticate('twitter', { failureRedirect: '/auth' }),
    (req, res) => res.redirect('/')
  );

  // Logout
  app.post('/api/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Get current user
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // ============= NOTIFICATION ROUTES =============
  
  // Subscribe to push notifications
  app.post('/api/notifications/subscribe', isAuthenticated, async (req: any, res) => {
    try {
      const { subscription, deviceType } = req.body;
      await subscribeToPush(req.user.id, subscription, deviceType);
      res.json({ message: "Subscribed to push notifications" });
    } catch (error) {
      console.error("Push subscription error:", error);
      res.status(500).json({ message: "Failed to subscribe to push notifications" });
    }
  });

  // Unsubscribe from push notifications
  app.post('/api/notifications/unsubscribe', isAuthenticated, async (req: any, res) => {
    try {
      const { endpoint } = req.body;
      await unsubscribeFromPush(req.user.id, endpoint);
      res.json({ message: "Unsubscribed from push notifications" });
    } catch (error) {
      console.error("Push unsubscribe error:", error);
      res.status(500).json({ message: "Failed to unsubscribe from push notifications" });
    }
  });

  // Get user notifications
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;
      const notifications = await getUserNotifications(req.user.id, limit, offset);
      res.json(notifications);
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ message: "Failed to get notifications" });
    }
  });

  // Get unread notification count
  app.get('/api/notifications/unread', isAuthenticated, async (req: any, res) => {
    try {
      const count = await getUnreadNotificationCount(req.user.id);
      res.json({ count });
    } catch (error) {
      console.error("Get unread count error:", error);
      res.status(500).json({ message: "Failed to get unread count" });
    }
  });

  // Mark notification as read
  app.post('/api/notifications/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      await markNotificationRead(req.params.id, req.user.id);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Mark notification read error:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Send test notification
  app.post('/api/notifications/test', isAuthenticated, requireRole(['admin']), async (req: any, res) => {
    try {
      const { userId, title, message, type } = req.body;
      await createNotification(userId, type, title, message);
      res.json({ message: "Test notification sent" });
    } catch (error) {
      console.error("Send test notification error:", error);
      res.status(500).json({ message: "Failed to send test notification" });
    }
  });

  // ============= ANALYTICS ROUTES =============
  
  // Get creator analytics
  app.get('/api/analytics/:creatorId', isAuthenticated, async (req: any, res) => {
    try {
      const { creatorId } = req.params;
      const { period = 'month' } = req.query;
      
      // Check if user can access this creator's analytics
      if (req.user.id !== creatorId && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const { analyticsService } = await import('./enhancedToolsService');
      const analytics = await analyticsService.getCreatorAnalytics(creatorId, period);
      res.json(analytics);
    } catch (error) {
      console.error("Get analytics error:", error);
      res.status(500).json({ message: "Failed to get analytics" });
    }
  });

  // ============= CONTENT MODERATION ROUTES =============
  
  // Moderate content
  app.post('/api/moderate', isAuthenticated, async (req, res) => {
    try {
      const { content, mediaUrls } = req.body;
      const { moderationService } = await import('./enhancedToolsService');
      const result = await moderationService.moderateContent(content, mediaUrls);
      res.json(result);
    } catch (error) {
      console.error("Content moderation error:", error);
      res.status(500).json({ message: "Failed to moderate content" });
    }
  });

  // ============= SCHEDULED CONTENT ROUTES =============
  
  // Schedule a post
  app.post('/api/schedule/post', isAuthenticated, async (req: any, res) => {
    try {
      const { postData, scheduledDate } = req.body;
      const { contentScheduler } = await import('./enhancedToolsService');
      const jobId = await contentScheduler.schedulePost(req.user.id, postData, new Date(scheduledDate));
      res.json({ jobId, message: "Post scheduled successfully" });
    } catch (error) {
      console.error("Schedule post error:", error);
      res.status(500).json({ message: "Failed to schedule post" });
    }
  });

  // Cancel scheduled post
  app.delete('/api/schedule/post/:jobId', isAuthenticated, async (req: any, res) => {
    try {
      const { jobId } = req.params;
      const { contentScheduler } = await import('./enhancedToolsService');
      await contentScheduler.cancelScheduledPost(jobId);
      res.json({ message: "Scheduled post cancelled" });
    } catch (error) {
      console.error("Cancel scheduled post error:", error);
      res.status(500).json({ message: "Failed to cancel scheduled post" });
    }
  });

  // ============= ENGAGEMENT ROUTES =============
  
  // Create poll
  app.post('/api/engagement/poll', isAuthenticated, requireRole(['creator', 'admin']), async (req: any, res) => {
    try {
      const pollData = req.body;
      const { engagementService } = await import('./enhancedToolsService');
      const poll = await engagementService.createPoll(req.user.id, pollData);
      res.json(poll);
    } catch (error) {
      console.error("Create poll error:", error);
      res.status(500).json({ message: "Failed to create poll" });
    }
  });

  // Create contest
  app.post('/api/engagement/contest', isAuthenticated, requireRole(['creator', 'admin']), async (req: any, res) => {
    try {
      const contestData = req.body;
      const { engagementService } = await import('./enhancedToolsService');
      const contest = await engagementService.createContest(req.user.id, contestData);
      res.json(contest);
    } catch (error) {
      console.error("Create contest error:", error);
      res.status(500).json({ message: "Failed to create contest" });
    }
  });

  // ============= REVENUE OPTIMIZATION ROUTES =============
  
  // Get pricing recommendations
  app.get('/api/revenue/optimize/:creatorId', isAuthenticated, async (req: any, res) => {
    try {
      const { creatorId } = req.params;
      
      // Check if user can access this creator's data
      if (req.user.id !== creatorId && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const { revenueOptimizer } = await import('./enhancedToolsService');
      const recommendations = await revenueOptimizer.analyzeOptimalPricing(creatorId);
      res.json(recommendations);
    } catch (error) {
      console.error("Revenue optimization error:", error);
      res.status(500).json({ message: "Failed to get pricing recommendations" });
    }
  });

  // User profile routes
  app.get('/api/users/:username', async (req, res) => {
    try {
      const user = await storage.getUserByUsername(req.params.username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't expose sensitive information
      const { balance, totalEarnings, ...publicUser } = user;
      res.json(publicUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.put('/api/users/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updateData = req.body;
      
      const user = await storage.updateUserProfile(userId, updateData);
      res.json(user);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Post routes - using FanController
  app.get('/api/posts/feed', isAuthenticated, fanController.getFeed.bind(fanController));

  app.get('/api/posts/creator/:creatorId', async (req, res) => {
    try {
      const creatorId = req.params.creatorId;
      const userId = (req as any).user?.claims?.sub;
      
      const posts = await storage.getCreatorPosts(creatorId, userId);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching creator posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.post('/api/posts', isAuthenticated, creatorController.createPost.bind(creatorController));

  app.post('/api/posts/:postId/like', isAuthenticated, fanController.toggleLike.bind(fanController));
  app.delete('/api/posts/:postId/like', isAuthenticated, fanController.toggleLike.bind(fanController));

  // PPV unlock route - using FanController
  app.post('/api/posts/:postId/unlock', isAuthenticated, fanController.purchasePPV.bind(fanController));

  // Subscription routes - using FanController
  app.post('/api/subscriptions/:creatorId', isAuthenticated, fanController.subscribeToCreator.bind(fanController));

  app.get('/api/subscriptions', isAuthenticated, fanController.getSubscriptions.bind(fanController));

  app.delete('/api/subscriptions/:subscriptionId', isAuthenticated, fanController.cancelSubscription.bind(fanController));

  app.get('/api/subscriptions/check/:creatorId', isAuthenticated, async (req: any, res) => {
    try {
      const fanId = req.user.claims.sub;
      const creatorId = req.params.creatorId;
      
      const isSubscribed = await storage.isSubscribed(fanId, creatorId);
      res.json({ isSubscribed });
    } catch (error) {
      console.error("Error checking subscription:", error);
      res.status(500).json({ message: "Failed to check subscription" });
    }
  });

  // Message routes - using MessagingController
  app.post('/api/messages', isAuthenticated, messagingController.sendMessage.bind(messagingController));

  app.get('/api/messages/:otherUserId', isAuthenticated, messagingController.getConversation.bind(messagingController));

  app.get('/api/messages/unread/count', isAuthenticated, messagingController.getUnreadCount.bind(messagingController));

  app.put('/api/messages/:otherUserId/read', isAuthenticated, messagingController.markAsRead.bind(messagingController));

  // Transaction routes
  app.post('/api/transactions/tip', isAuthenticated, fanController.sendTip.bind(fanController));

  app.get('/api/transactions', isAuthenticated, fanController.getPurchaseHistory.bind(fanController));

  // Social Media Tools endpoints
  app.post('/api/ai/generate-social-post', async (req, res) => {
    try {
      const { socialMediaToolsService } = await import('./socialMediaToolsService');
      const result = await socialMediaToolsService.generateSocialMediaPost(req.body);
      res.json(result);
    } catch (error) {
      console.error('Error generating social media post:', error);
      res.status(500).json({ error: 'Failed to generate post' });
    }
  });

  app.post('/api/ai/generate-hashtags', async (req, res) => {
    try {
      const { socialMediaToolsService } = await import('./socialMediaToolsService');
      const result = await socialMediaToolsService.generateHashtags(req.body);
      res.json(result);
    } catch (error) {
      console.error('Error generating hashtags:', error);
      res.status(500).json({ error: 'Failed to generate hashtags' });
    }
  });

  // Server Management endpoints
  app.get('/api/server/system-info', async (req, res) => {
    try {
      const { serverManagementService } = await import('./serverManagementService');
      const systemInfo = await serverManagementService.getSystemInfo();
      res.json(systemInfo);
    } catch (error) {
      console.error('Error getting system info:', error);
      res.status(500).json({ error: 'Failed to get system info' });
    }
  });

  app.get('/api/server/services', async (req, res) => {
    try {
      const { serverManagementService } = await import('./serverManagementService');
      const services = await serverManagementService.getServiceStatus();
      res.json(services);
    } catch (error) {
      console.error('Error getting service status:', error);
      res.status(500).json({ error: 'Failed to get service status' });
    }
  });

  app.get('/api/server/logs', async (req, res) => {
    try {
      const { serverManagementService } = await import('./serverManagementService');
      const limit = parseInt(req.query.limit as string) || 100;
      const logs = serverManagementService.getLogs(limit);
      res.json(logs);
    } catch (error) {
      console.error('Error getting logs:', error);
      res.status(500).json({ error: 'Failed to get logs' });
    }
  });

  app.get('/api/server/filesystem', async (req, res) => {
    try {
      const { serverManagementService } = await import('./serverManagementService');
      const path = req.query.path as string || '.';
      const contents = await serverManagementService.getDirectoryContents(path);
      res.json(contents);
    } catch (error) {
      console.error('Error getting directory contents:', error);
      res.status(500).json({ error: 'Failed to get directory contents' });
    }
  });

  app.post('/api/server/setup-ssh', async (req, res) => {
    try {
      const { serverManagementService } = await import('./serverManagementService');
      const result = await serverManagementService.setupSSHServer();
      res.json(result);
    } catch (error) {
      console.error('Error setting up SSH:', error);
      res.status(500).json({ error: 'Failed to setup SSH' });
    }
  });

  app.post('/api/server/setup-ftp', async (req, res) => {
    try {
      const { serverManagementService } = await import('./serverManagementService');
      const result = await serverManagementService.setupFTPServer();
      res.json(result);
    } catch (error) {
      console.error('Error setting up FTP:', error);
      res.status(500).json({ error: 'Failed to setup FTP' });
    }
  });

  app.post('/api/server/services/:serviceName/restart', async (req, res) => {
    try {
      const { serverManagementService } = await import('./serverManagementService');
      const { serviceName } = req.params;
      const result = await serverManagementService.restartService(serviceName);
      res.json(result);
    } catch (error) {
      console.error('Error restarting service:', error);
      res.status(500).json({ error: 'Failed to restart service' });
    }
  });

  app.post('/api/server/filesystem/directory', async (req, res) => {
    try {
      const { serverManagementService } = await import('./serverManagementService');
      const { path } = req.body;
      const result = await serverManagementService.createDirectory(path);
      res.json(result);
    } catch (error) {
      console.error('Error creating directory:', error);
      res.status(500).json({ error: 'Failed to create directory' });
    }
  });

  app.delete('/api/server/filesystem/item', async (req, res) => {
    try {
      const { serverManagementService } = await import('./serverManagementService');
      const { path } = req.body;
      const result = await serverManagementService.deleteFileOrDirectory(path);
      res.json(result);
    } catch (error) {
      console.error('Error deleting item:', error);
      res.status(500).json({ error: 'Failed to delete item' });
    }
  });

  // Analytics routes - using CreatorController
  app.get('/api/analytics/creator', isAuthenticated, creatorController.getDashboard.bind(creatorController));

  // Discover routes - using FanController
  app.get('/api/creators/top', fanController.discoverCreators.bind(fanController));

  // Payment routes
  app.post('/api/payments/initiate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { 
        processor, 
        type, 
        amount, 
        currency = "USD", 
        creatorId, 
        description 
      } = req.body;

      // Get recommended processor if not specified
      const selectedProcessor = processor || paymentService.getRecommendedProcessor(type, currency);

      const paymentRequest: PaymentRequest = {
        processor: selectedProcessor,
        type,
        amount: parseFloat(amount),
        currency,
        userId,
        creatorId,
        description: description || `FansLab ${type} payment`,
        metadata: {
          userId,
          creatorId,
          type
        }
      };

      const result = await paymentService.processPayment(paymentRequest);
      res.json(result);
    } catch (error) {
      console.error("Error initiating payment:", error);
      res.status(500).json({ message: "Failed to initiate payment" });
    }
  });

  app.get('/api/payments/processors', (req, res) => {
    res.json({
      processors: [
        { 
          id: PaymentProcessor.CCBILL, 
          name: "CCBill", 
          type: "card", 
          currencies: ["USD", "EUR"], 
          recommended: ["subscription", "ppv"] 
        },
        { 
          id: PaymentProcessor.NOWPAYMENTS, 
          name: "NowPayments", 
          type: "crypto", 
          currencies: ["BTC", "ETH", "USDT"], 
          recommended: ["tip", "ppv"] 
        },
        { 
          id: PaymentProcessor.TRIPLEA, 
          name: "Triple-A", 
          type: "crypto", 
          currencies: ["BTC", "ETH", "USDC"], 
          recommended: ["tip", "subscription"] 
        },
        { 
          id: PaymentProcessor.BANKFUL, 
          name: "Bankful", 
          type: "bank", 
          currencies: ["USD", "EUR", "GBP"], 
          recommended: ["subscription", "merchandise"] 
        },
        { 
          id: PaymentProcessor.AUTHORIZE_NET, 
          name: "Authorize.Net", 
          type: "card", 
          currencies: ["USD"], 
          recommended: ["tip", "merchandise"] 
        }
      ]
    });
  });

  // Webhook endpoints for payment processors
  app.post('/webhooks/ccbill', async (req, res) => {
    try {
      const verified = await paymentService.handleWebhook(PaymentProcessor.CCBILL, req.body);
      if (verified) {
        // Process successful payment
        console.log("CCBill webhook verified:", req.body);
        // Update database, send notifications, etc.
        res.status(200).send("OK");
      } else {
        res.status(400).send("Invalid webhook");
      }
    } catch (error) {
      console.error("CCBill webhook error:", error);
      res.status(500).send("Error");
    }
  });

  app.post('/webhooks/nowpayments', async (req, res) => {
    try {
      const verified = await paymentService.handleWebhook(PaymentProcessor.NOWPAYMENTS, req.body);
      if (verified) {
        console.log("NowPayments webhook verified:", req.body);
        res.status(200).send("OK");
      } else {
        res.status(400).send("Invalid webhook");
      }
    } catch (error) {
      console.error("NowPayments webhook error:", error);
      res.status(500).send("Error");
    }
  });

  app.post('/webhooks/triplea', async (req, res) => {
    try {
      const verified = await paymentService.handleWebhook(PaymentProcessor.TRIPLEA, req.body);
      if (verified) {
        console.log("Triple-A webhook verified:", req.body);
        res.status(200).send("OK");
      } else {
        res.status(400).send("Invalid webhook");
      }
    } catch (error) {
      console.error("Triple-A webhook error:", error);
      res.status(500).send("Error");
    }
  });

  app.post('/webhooks/bankful', async (req, res) => {
    try {
      const verified = await paymentService.handleWebhook(PaymentProcessor.BANKFUL, req.body);
      if (verified) {
        console.log("Bankful webhook verified:", req.body);
        res.status(200).send("OK");
      } else {
        res.status(400).send("Invalid webhook");
      }
    } catch (error) {
      console.error("Bankful webhook error:", error);
      res.status(500).send("Error");
    }
  });

  app.post('/webhooks/authorize-net', async (req, res) => {
    try {
      const verified = await paymentService.handleWebhook(PaymentProcessor.AUTHORIZE_NET, req.body);
      if (verified) {
        console.log("Authorize.Net webhook verified:", req.body);
        res.status(200).send("OK");
      } else {
        res.status(400).send("Invalid webhook");
      }
    } catch (error) {
      console.error("Authorize.Net webhook error:", error);
      res.status(500).send("Error");
    }
  });

  // Payment success/cancel routes
  app.get('/api/payments/success', async (req, res) => {
    try {
      const { transactionId, processor } = req.query;
      // Handle successful payment
      console.log(`Payment successful: ${processor} - ${transactionId}`);
      res.redirect(`${process.env.FRONTEND_URL}/payment/success?id=${transactionId}`);
    } catch (error) {
      console.error("Payment success error:", error);
      res.redirect(`${process.env.FRONTEND_URL}/payment/error`);
    }
  });

  app.get('/api/payments/cancel', async (req, res) => {
    try {
      console.log("Payment cancelled:", req.query);
      res.redirect(`${process.env.FRONTEND_URL}/payment/cancel`);
    } catch (error) {
      console.error("Payment cancel error:", error);
      res.redirect(`${process.env.FRONTEND_URL}/payment/error`);
    }
  });

  // Media routes - using ContentController
  app.post('/api/media/upload-url', isAuthenticated, contentController.uploadMedia.bind(contentController));

  app.post('/api/media/upload-complete', isAuthenticated, contentController.processMedia.bind(contentController));

  app.get('/api/media/library', isAuthenticated, contentController.getMediaLibrary.bind(contentController));

  app.get('/api/media/:mediaId', async (req, res) => {
    try {
      const { mediaId } = req.params;
      
      const mediaFile = await mediaService.getMediaFile(mediaId);
      
      if (!mediaFile) {
        return res.status(404).json({ error: "Media not found" });
      }
      
      res.json(mediaFile);
    } catch (error) {
      console.error("Error getting media file:", error);
      res.status(500).json({ error: "Failed to get media file" });
    }
  });

  // Streaming routes
  app.post('/api/streams', isAuthenticated, async (req: any, res) => {
    try {
      const creatorId = req.user.claims.sub;
      const { title, description } = req.body;
      
      const session = await mediaService.createStreamSession(creatorId, title, description);
      res.json(session);
    } catch (error) {
      console.error("Error creating stream:", error);
      res.status(500).json({ error: "Failed to create stream" });
    }
  });

  app.post('/api/streams/:sessionId/start', isAuthenticated, async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      await mediaService.startStream(sessionId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error starting stream:", error);
      res.status(500).json({ error: "Failed to start stream" });
    }
  });

  app.post('/api/streams/:sessionId/end', isAuthenticated, async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      await mediaService.endStream(sessionId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error ending stream:", error);
      res.status(500).json({ error: "Failed to end stream" });
    }
  });

  // Clips routes
  app.post('/api/clips', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { sourceVideoId, startTime, endTime, title } = req.body;
      
      const clip = await mediaService.createClip(
        userId, 
        sourceVideoId, 
        startTime, 
        endTime, 
        title
      );
      
      res.json(clip);
    } catch (error) {
      console.error("Error creating clip:", error);
      res.status(500).json({ error: "Failed to create clip" });
    }
  });

  app.get('/api/media/search', async (req, res) => {
    try {
      const { userId, type, tags, limit = 20, offset = 0 } = req.query;
      
      const media = await mediaService.searchMedia(
        userId as string,
        type as any,
        tags ? (tags as string).split(',') : undefined,
        parseInt(limit as string),
        parseInt(offset as string)
      );
      
      res.json(media);
    } catch (error) {
      console.error("Error searching media:", error);
      res.status(500).json({ error: "Failed to search media" });
    }
  });

  // ==================== SMS ROUTES ====================
  // Send SMS notification
  app.post('/api/sms/send', isAuthenticated, async (req: any, res) => {
    try {
      const { to, type, variables, customMessage } = req.body;
      
      const result = await smsService.sendSMS({
        to,
        type: type as SMSMessageType,
        variables,
        customMessage
      });
      
      res.json(result);
    } catch (error) {
      console.error('SMS send failed:', error);
      res.status(500).json({ message: 'Failed to send SMS' });
    }
  });

  // Get SMS analytics
  app.get('/api/sms/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();
      
      const analytics = smsService.getAnalytics(start, end);
      res.json(analytics);
    } catch (error) {
      console.error('SMS analytics failed:', error);
      res.status(500).json({ message: 'Failed to get SMS analytics' });
    }
  });

  // SMS webhook for status updates
  app.post('/api/webhooks/sms/status', async (req, res) => {
    try {
      const { MessageSid, MessageStatus } = req.body;
      smsService.handleStatusWebhook(MessageSid, MessageStatus);
      res.status(200).send('OK');
    } catch (error) {
      console.error('SMS webhook failed:', error);
      res.status(500).send('Error');
    }
  });

  // ==================== AI ASSISTANT ROUTES ====================
  // Process AI request
  app.post('/api/ai/request', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { type, assistantType, prompt, context, mediaUrls } = req.body;
      
      const aiRequest = await aiAssistantService.processAIRequest({
        userId,
        type: type as AIRequestType,
        assistantType: assistantType as AIAssistantType,
        prompt,
        context,
        mediaUrls
      });
      
      res.json(aiRequest);
    } catch (error) {
      console.error('AI request failed:', error);
      res.status(500).json({ message: 'Failed to process AI request' });
    }
  });

  // Get content suggestions
  app.get('/api/ai/content-suggestions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { contentType } = req.query;
      
      const suggestions = await aiAssistantService.getContentSuggestions(userId, contentType as string);
      res.json(suggestions);
    } catch (error) {
      console.error('Content suggestions failed:', error);
      res.status(500).json({ message: 'Failed to get content suggestions' });
    }
  });

  // Get optimal posting times
  app.get('/api/ai/optimal-times', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const times = await aiAssistantService.getOptimalPostingTimes(userId);
      res.json(times);
    } catch (error) {
      console.error('Optimal times failed:', error);
      res.status(500).json({ message: 'Failed to get optimal times' });
    }
  });

  // Get AI request history
  app.get('/api/ai/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const history = aiAssistantService.getRequestHistory(userId);
      res.json(history);
    } catch (error) {
      console.error('AI history failed:', error);
      res.status(500).json({ message: 'Failed to get AI history' });
    }
  });

  // ==================== SHORT VIDEO ROUTES ====================
  // Upload short video
  app.post('/api/short-videos/upload', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'creator') {
        return res.status(403).json({ message: 'Creator access required' });
      }

      // Handle multipart form data
      const { title, description, hashtags, isPublic, allowComments, allowDuets, allowRemix, scheduleAt } = req.body;
      
      const uploadRequest = {
        videoFile: 'mock_video_url.mp4', // In real implementation, would handle file upload
        title,
        description,
        hashtags: hashtags ? hashtags.split(',').map((tag: string) => tag.trim()) : [],
        isPublic: isPublic === 'true',
        allowComments: allowComments === 'true',
        allowDuets: allowDuets === 'true',
        allowRemix: allowRemix === 'true',
        scheduleAt: scheduleAt ? new Date(scheduleAt) : undefined
      };
      
      const result = await shortVideoService.uploadShortVideo(userId, uploadRequest);
      res.json(result);
    } catch (error) {
      console.error('Video upload failed:', error);
      res.status(500).json({ message: 'Failed to upload video' });
    }
  });

  // Get short video feed
  app.get('/api/short-videos/feed', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { type = 'for_you', page = '0', limit = '20', hashtag, creatorId } = req.query;
      
      const feedRequest = {
        type: type as FeedType,
        userId,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        hashtag: hashtag as string,
        creatorId: creatorId as string
      };
      
      const videos = await shortVideoService.getFeed(feedRequest);
      res.json(videos);
    } catch (error) {
      console.error('Feed generation failed:', error);
      res.status(500).json({ message: 'Failed to get video feed' });
    }
  });

  // React to short video - using ContentController
  app.post('/api/videos/:videoId/react', isAuthenticated, contentController.reactToVideo.bind(contentController));

  // Track video view - using ContentController
  app.post('/api/videos/:videoId/view', contentController.trackVideoView.bind(contentController));

  // Get trending hashtags - using ContentController
  app.get('/api/hashtags/trending', contentController.getTrendingHashtags.bind(contentController));

  // Get video analytics - using ContentController
  app.get('/api/videos/:videoId/analytics', isAuthenticated, contentController.getVideoAnalytics.bind(contentController));

  // Get content suggestions - using ContentController
  app.get('/api/content/suggestions', isAuthenticated, contentController.getContentSuggestions.bind(contentController));

  // Additional Creator routes
  app.get('/api/creator/dashboard', isAuthenticated, creatorController.getDashboard.bind(creatorController));
  app.get('/api/creator/earnings', isAuthenticated, creatorController.getEarnings.bind(creatorController));
  app.post('/api/creator/payout', isAuthenticated, creatorController.requestPayout.bind(creatorController));
  app.get('/api/creator/fans', isAuthenticated, creatorController.getFans.bind(creatorController));
  app.post('/api/creator/schedule-content', isAuthenticated, creatorController.scheduleContent.bind(creatorController));
  app.get('/api/creator/content-analytics', isAuthenticated, creatorController.getContentAnalytics.bind(creatorController));
  app.put('/api/creator/subscription-price', isAuthenticated, creatorController.updateSubscriptionPrice.bind(creatorController));

  // Short Video routes (ContentController)
  app.post('/api/videos/upload', isAuthenticated, contentController.uploadShortVideo.bind(contentController));
  app.get('/api/videos/feed', isAuthenticated, contentController.getShortVideoFeed.bind(contentController));

  // Content and Comments routes
  app.post('/api/comments', isAuthenticated, contentController.addComment.bind(contentController));
  app.get('/api/comments', contentController.getComments.bind(contentController));
  app.post('/api/content/generate', isAuthenticated, contentController.generateContent.bind(contentController));
  app.post('/api/content/moderate', isAuthenticated, contentController.moderateContent.bind(contentController));

  // Live Streaming routes (LiveStreamController)
  app.post('/api/streams/start', isAuthenticated, liveStreamController.startStream.bind(liveStreamController));
  app.post('/api/streams/:streamId/end', isAuthenticated, liveStreamController.endStream.bind(liveStreamController));
  app.get('/api/streams/active', liveStreamController.getActiveStreams.bind(liveStreamController));
  app.post('/api/streams/:streamId/join', isAuthenticated, liveStreamController.joinStream.bind(liveStreamController));
  app.post('/api/streams/:streamId/ticket', isAuthenticated, liveStreamController.purchaseStreamTicket.bind(liveStreamController));
  app.post('/api/streams/:streamId/message', isAuthenticated, liveStreamController.sendStreamMessage.bind(liveStreamController));
  app.get('/api/streams/:streamId/analytics', isAuthenticated, liveStreamController.getStreamAnalytics.bind(liveStreamController));
  app.post('/api/streams/schedule', isAuthenticated, liveStreamController.scheduleStream.bind(liveStreamController));
  app.get('/api/streams/user', isAuthenticated, liveStreamController.getUserStreams.bind(liveStreamController));
  
  // Stream Recording and Vault routes
  app.post('/api/streams/start-recording', isAuthenticated, liveStreamController.startRecording.bind(liveStreamController));
  app.post('/api/streams/stop-recording', isAuthenticated, liveStreamController.stopRecording.bind(liveStreamController));
  app.get('/api/streams/vault/:creatorId', isAuthenticated, liveStreamController.getRecordedStreams.bind(liveStreamController));
  app.delete('/api/streams/recording/:recordingId', isAuthenticated, liveStreamController.deleteRecording.bind(liveStreamController));
  app.patch('/api/streams/recording/:recordingId', isAuthenticated, liveStreamController.updateRecording.bind(liveStreamController));
  
  // Co-star Management routes
  app.post('/api/streams/add-costar', isAuthenticated, liveStreamController.addCoStar.bind(liveStreamController));
  app.post('/api/streams/verify-costar', isAuthenticated, liveStreamController.verifyCoStar.bind(liveStreamController));
  app.get('/api/streams/:streamId/costars', isAuthenticated, liveStreamController.getStreamCoStars.bind(liveStreamController));
  
  // Stream Quality and Analytics
  app.post('/api/streams/view', liveStreamController.trackStreamView.bind(liveStreamController));
  app.post('/api/streams/tip', isAuthenticated, liveStreamController.sendTip.bind(liveStreamController));

  // Messaging routes (additional)
  app.get('/api/conversations', isAuthenticated, messagingController.getConversations.bind(messagingController));
  app.post('/api/messages/mass', isAuthenticated, messagingController.sendMassMessage.bind(messagingController));

  // Compliance routes (ComplianceController)
  app.post('/api/compliance/submit', isAuthenticated, complianceController.submitComplianceRecord.bind(complianceController));
  app.get('/api/compliance/status', isAuthenticated, complianceController.getComplianceStatus.bind(complianceController));
  app.post('/api/compliance/verify-age', isAuthenticated, complianceController.verifyAge.bind(complianceController));
  app.post('/api/compliance/upload-document', isAuthenticated, complianceController.uploadDocument.bind(complianceController));
  
  // Co-star verification routes
  app.post('/api/compliance/costar-verify', isAuthenticated, complianceController.initiateCostarVerification.bind(complianceController));
  app.get('/api/compliance/costar-form/:token', complianceController.getCostarForm.bind(complianceController));
  app.post('/api/compliance/costar-complete/:token', complianceController.completeCostarVerification.bind(complianceController));
  app.get('/api/compliance/creator/costars', isAuthenticated, complianceController.getCreatorCostarVerifications.bind(complianceController));
  app.post('/api/compliance/invitations/:invitationId/resend', isAuthenticated, complianceController.resendCostarInvitation.bind(complianceController));
  app.delete('/api/compliance/invitations/:invitationId', isAuthenticated, complianceController.cancelCostarInvitation.bind(complianceController));
  
  app.get('/api/compliance/requirements', isAuthenticated, complianceController.getComplianceRequirements.bind(complianceController));

  // Admin routes (AdminController)
  app.get('/api/admin/dashboard', isAuthenticated, adminController.getDashboard.bind(adminController));
  app.get('/api/admin/users', isAuthenticated, adminController.getUsers.bind(adminController));
  app.put('/api/admin/users/:targetUserId/status', isAuthenticated, adminController.updateUserStatus.bind(adminController));
  app.get('/api/admin/moderation-queue', isAuthenticated, adminController.getModerationQueue.bind(adminController));
  app.get('/api/admin/compliance-records', isAuthenticated, adminController.getComplianceRecords.bind(adminController));
  app.put('/api/admin/compliance/:recordId/status', isAuthenticated, adminController.updateComplianceStatus.bind(adminController));
  
  // Admin co-star verification routes
  app.get('/api/admin/costar-verifications/pending', isAuthenticated, complianceController.getPendingCostarVerifications.bind(complianceController));
  app.get('/api/admin/costar-verifications/:verificationId', isAuthenticated, complianceController.getCostarVerificationDetails.bind(complianceController));
  app.put('/api/admin/costar-verifications/:verificationId/review', isAuthenticated, complianceController.reviewCostarVerification.bind(complianceController));
  
  app.get('/api/admin/financial-reports', isAuthenticated, adminController.getFinancialReports.bind(adminController));
  app.get('/api/admin/platform-settings', isAuthenticated, adminController.getPlatformSettings.bind(adminController));
  app.put('/api/admin/platform-settings', isAuthenticated, adminController.updatePlatformSettings.bind(adminController));
  app.get('/api/admin/analytics', isAuthenticated, adminController.getAnalytics.bind(adminController));

  // User tagging routes
  app.get('/api/users/search', async (req, res) => {
    try {
      const { q, limit } = req.query;
      if (!q) {
        return res.json([]);
      }
      
      const users = await userTaggingService.searchUsersForTagging(q as string, parseInt(limit as string) || 10);
      res.json(users);
    } catch (error) {
      console.error('Error searching users:', error);
      res.status(500).json({ message: 'Failed to search users' });
    }
  });

  app.get('/api/users/:username/tag-info', isAuthenticated, async (req: any, res) => {
    try {
      const { username } = req.params;
      const requestingUserId = req.user.claims.sub;
      
      const tagInfo = await userTaggingService.getUserTagInfo(username, requestingUserId);
      
      if (!tagInfo) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json(tagInfo);
    } catch (error) {
      console.error('Error getting user tag info:', error);
      res.status(500).json({ message: 'Failed to get user tag information' });
    }
  });

  // Replit Platform Integration Routes
  app.get('/api/replit/status', replitController.getServiceStatus.bind(replitController));
  app.get('/api/replit/environment', replitController.getEnvironmentInfo.bind(replitController));
  app.get('/api/replit/health', replitController.healthCheck.bind(replitController));
  app.get('/api/replit/deployment', replitController.getDeploymentInfo.bind(replitController));
  app.get('/api/replit/storage', replitController.getStorageConfig.bind(replitController));
  app.post('/api/replit/test/filesystem', isAuthenticated, replitController.testFileSystem.bind(replitController));
  app.post('/api/replit/execute', isAuthenticated, replitController.executeCommand.bind(replitController));
  app.post('/api/replit/initialize', isAuthenticated, replitController.initializeIntegrations.bind(replitController));

  // Real-time test routes
  app.post('/api/test/realtime', isAuthenticated, async (req: any, res) => {
    try {
      const { type, message, amount } = req.body;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Simulate different event types
      switch (type) {
        case 'live_stream':
          await realTimeManager.notifyLiveStreamStart(userId, {
            streamTitle: message || 'Test Live Stream',
            viewerCount: Math.floor(Math.random() * 1000),
            streamUrl: 'https://example.com/stream',
            creatorName: user?.displayName || user?.username
          });
          break;
          
        case 'new_content':
          await realTimeManager.notifyNewContent(userId, {
            contentType: 'post',
            contentId: 'test-' + Date.now(),
            title: message || 'New Test Content',
            creatorName: user?.displayName || user?.username
          });
          break;
          
        case 'message':
          await realTimeManager.notifyNewMessage(userId, {
            senderId: 'test-sender',
            senderName: 'Test User',
            preview: message || 'Test message content',
            conversationId: 'test-conv-' + Date.now()
          });
          break;
          
        case 'tip':
          await realTimeManager.notifyTip(userId, {
            fanId: 'test-fan',
            fanName: 'Test Fan',
            amount: amount || 10,
            message: message || 'Thanks for the great content!'
          });
          break;
          
        case 'subscription':
          await realTimeManager.notifySubscription(userId, {
            fanId: 'test-fan',
            fanName: 'Test Subscriber',
            amount: 9.99,
            duration: '30 days'
          });
          break;
          
        case 'follow':
          await realTimeManager.notifyFollow(userId, {
            followerId: 'test-follower',
            followerName: 'New Follower',
            followerAvatar: 'https://example.com/avatar.jpg'
          });
          break;
          
        default:
          await realTimeManager.notifySystemEvent({
            type: 'test',
            message: message || 'Test system event',
            timestamp: new Date().toISOString()
          });
      }
      
      res.json({ success: true, message: 'Test event triggered' });
    } catch (error) {
      console.error('Test real-time error:', error);
      res.status(500).json({ message: 'Failed to trigger test event' });
    }
  });

  const httpServer = createServer(app);

  // Initialize real-time notification system
  const { realTimeNotifications } = await import('./realTimeNotificationService');
  realTimeNotifications.initialize(httpServer);

  // Initialize automated tasks
  const { initializeAutomatedTasks } = await import('./enhancedToolsService');
  initializeAutomatedTasks();

  return httpServer;
}
