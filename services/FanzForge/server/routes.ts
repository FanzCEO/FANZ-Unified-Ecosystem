import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { setupAuth, requireAuth, loginUser, registerUser } from "./auth";
import { registerSchema, loginSchema } from "@shared/schema";
import { aiService } from "./ai";
import { vibeSpecParser } from "./vibeSpecParser";
import { buildService } from "./buildService";
import { insertProjectSchema, insertBuildSchema, insertEnvVarSchema, forgotPasswordSchema, resetPasswordSchema } from "@shared/schema";
import { SchemaGenerator } from "./schemaGenerator";
import { ThemeGenerator } from "./themeGenerator";
import { ComponentGenerator } from "./componentGenerator";
import { VisualBuilder } from "./visualBuilder";
import { DeploymentManager } from "./deploymentManager";
import { CollaborationHub } from "./collaborationHub";

// Initialize services
const schemaGenerator = new SchemaGenerator();
const themeGenerator = new ThemeGenerator();
const componentGenerator = new ComponentGenerator();
const visualBuilder = new VisualBuilder();
const deploymentManager = new DeploymentManager();
const collaborationHub = new CollaborationHub();

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Registration endpoint
  app.post('/api/register', async (req, res) => {
    try {
      const userData = registerSchema.parse(req.body);
      const { user, error } = await registerUser(userData);
      
      if (error) {
        return res.status(400).json({ message: error });
      }
      
      // Set session
      (req.session as any).user = user;
      res.json({ user });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Login endpoint
  app.post('/api/login', async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const { user, error } = await loginUser(email, password);
      
      if (error) {
        return res.status(401).json({ message: error });
      }
      
      // Set session
      (req.session as any).user = user;
      res.json({ user });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Logout endpoint
  app.post('/api/logout', (req, res) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out" });
    });
  });

  // Forgot password endpoint
  app.post('/api/forgot-password', async (req, res) => {
    try {
      const { email } = forgotPasswordSchema.parse(req.body);
      
      // Check if user exists
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal whether user exists - always return success
        return res.json({ message: "If your email is registered, you'll receive a password reset link." });
      }
      
      // Generate reset token
      const resetToken = Math.random().toString(36).slice(2) + Date.now().toString(36);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
      
      await storage.createPasswordResetToken(email, resetToken, expiresAt);
      
      // In a real app, you'd send this via email
      // For demo purposes, we'll log it to console
      const resetUrl = `${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}`;
      console.log(`🔐 Password reset link for ${email}: ${resetUrl}`);
      console.log(`Reset token: ${resetToken}`);
      
      res.json({ message: "If your email is registered, you'll receive a password reset link. Check the console for the demo reset link!" });
    } catch (error: any) {
      console.error("Forgot password error:", error);
      res.status(400).json({ message: "Invalid email address" });
    }
  });

  // Reset password endpoint
  app.post('/api/reset-password', async (req, res) => {
    try {
      const { token, newPassword } = resetPasswordSchema.parse(req.body);
      
      // Get and validate token
      const resetToken = await storage.getPasswordResetToken(token);
      if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }
      
      // Update password
      await storage.updatePassword(resetToken.email, newPassword);
      
      // Mark token as used
      await storage.markTokenAsUsed(token);
      
      res.json({ message: "Password has been reset successfully" });
    } catch (error: any) {
      console.error("Reset password error:", error);
      res.status(400).json({ message: "Failed to reset password" });
    }
  });

  // Get current user - this route checks if user is authenticated
  app.get('/api/auth/user', async (req, res) => {
    try {
      const user = (req.session as any)?.user;
      // Return null if no user is logged in (frontend expects this)
      res.json(user || null);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get all plugins
  app.get('/api/plugins', async (req, res) => {
    try {
      const plugins = await storage.getPlugins();
      res.json(plugins);
    } catch (error) {
      console.error("Error fetching plugins:", error);
      res.status(500).json({ message: "Failed to fetch plugins" });
    }
  });

  // Get plugins by type
  app.get('/api/plugins/type/:type', async (req, res) => {
    try {
      const { type } = req.params;
      const plugins = await storage.getPluginsByType(type);
      res.json(plugins);
    } catch (error) {
      console.error("Error fetching plugins by type:", error);
      res.status(500).json({ message: "Failed to fetch plugins" });
    }
  });

  // Initialize payment processor plugins
  app.post('/api/plugins/init-payment-processors', requireAuth, async (req, res) => {
    try {
      const paymentProcessors = [
        {
          name: 'CCBill',
          version: '1.0.0',
          type: 'payment',
          manifest: {
            displayName: 'CCBill',
            description: 'Industry-leading adult payment processor with comprehensive fraud protection',
            category: 'Adult-Friendly',
            fees: '10-15.5%',
            features: ['Industry Leader', 'Fraud Protection', 'Recurring Billing', '45+ Countries', 'Easy Approval'],
            difficulty: 'Beginner',
            setupTime: '5-10 minutes',
            integrationComplexity: 'Low',
            supportedRegions: ['Global'],
            apiDocumentation: 'https://kb.ccbill.com/',
            complianceLevel: 'High',
            chargebackProtection: true,
            recurringBilling: true,
            ageVerification: true,
            discreteBilling: true,
            icon: 'credit-card',
            color: '#0066cc',
            adultFriendly: true,
            recommended: true
          },
          isActive: true
        },
        {
          name: 'Epoch',
          version: '1.0.0',
          type: 'payment',
          manifest: {
            displayName: 'Epoch',
            description: 'Pioneer adult payment processor since 1996 with global reach',
            category: 'Adult-Friendly',
            fees: '8-12%',
            features: ['Pioneer Since 1996', 'Global Reach', 'Subscription Management', 'Alternative Payments', 'Lower Fees'],
            difficulty: 'Intermediate',
            setupTime: '10-15 minutes',
            integrationComplexity: 'Medium',
            supportedRegions: ['Global'],
            apiDocumentation: 'https://epoch.com/support/',
            complianceLevel: 'High',
            chargebackProtection: true,
            recurringBilling: true,
            ageVerification: true,
            discreteBilling: true,
            icon: 'clock',
            color: '#8b5cf6',
            adultFriendly: true,
            recommended: false
          },
          isActive: true
        },
        {
          name: 'Segpay',
          version: '1.0.0',
          type: 'payment',
          manifest: {
            displayName: 'Segpay',
            description: 'Global payment leader since 2005 with strong European presence',
            category: 'Adult-Friendly',
            fees: 'Competitive (varies)',
            features: ['Global Leader', 'European Presence', 'Fraud Mitigation', 'Real-time Processing', 'Partnership Focus'],
            difficulty: 'Advanced',
            setupTime: '15-20 minutes',
            integrationComplexity: 'High',
            supportedRegions: ['Global', 'Europe'],
            apiDocumentation: 'https://segpay.com/support/',
            complianceLevel: 'Very High',
            chargebackProtection: true,
            recurringBilling: true,
            ageVerification: true,
            discreteBilling: true,
            icon: 'shield-check',
            color: '#10b981',
            adultFriendly: true,
            recommended: false
          },
          isActive: true
        },
        {
          name: 'Verotel',
          version: '1.0.0',
          type: 'payment',
          manifest: {
            displayName: 'Verotel',
            description: 'EU-based payment processor with global reach and 50,000+ merchants',
            category: 'Adult-Friendly',
            fees: '12-15%+',
            features: ['EU-Based', 'Global Reach', '50,000+ Merchants', 'Premium & Basic Tiers', 'International Focus'],
            difficulty: 'Intermediate',
            setupTime: '10-15 minutes',
            integrationComplexity: 'Medium',
            supportedRegions: ['Europe', 'Global'],
            apiDocumentation: 'https://www.verotel.com/en/support/',
            complianceLevel: 'High',
            chargebackProtection: true,
            recurringBilling: true,
            ageVerification: true,
            discreteBilling: true,
            icon: 'euro',
            color: '#f59e0b',
            adultFriendly: true,
            recommended: false
          },
          isActive: true
        },
        {
          name: 'Corepay',
          version: '1.0.0',
          type: 'payment',
          manifest: {
            displayName: 'Corepay',
            description: 'Low-fee payment processor for established adult businesses',
            category: 'Adult-Friendly',
            fees: '5-8%',
            features: ['Lowest Fees', 'Direct Merchant Accounts', 'Chargeback Protection', 'Mail/Phone Orders', 'Established Business Focus'],
            difficulty: 'Expert',
            setupTime: '30-60 minutes',
            integrationComplexity: 'Very High',
            supportedRegions: ['US', 'International'],
            apiDocumentation: 'https://corepay.net/support/',
            complianceLevel: 'Very High',
            chargebackProtection: true,
            recurringBilling: true,
            ageVerification: true,
            discreteBilling: true,
            icon: 'trending-down',
            color: '#ef4444',
            adultFriendly: true,
            recommended: false,
            requirements: ['Established Business', 'High Volume', 'Good Processing History']
          },
          isActive: true
        },
        {
          name: 'Paxum',
          version: '1.0.0',
          type: 'payment',
          manifest: {
            displayName: 'Paxum',
            description: 'Multi-currency payment solution with prepaid cards for creators',
            category: 'Creator-Focused',
            fees: '3-8%',
            features: ['50 Countries', '20 Currencies', 'Prepaid Cards', 'Creator Payouts', 'Multi-Currency'],
            difficulty: 'Beginner',
            setupTime: '5-10 minutes',
            integrationComplexity: 'Low',
            supportedRegions: ['50+ Countries'],
            apiDocumentation: 'https://www.paxum.com/payment_en_api.html',
            complianceLevel: 'High',
            chargebackProtection: true,
            recurringBilling: true,
            ageVerification: false,
            discreteBilling: true,
            icon: 'credit-card',
            color: '#06b6d4',
            adultFriendly: true,
            recommended: true,
            specialFeatures: ['Creator Prepaid Cards', 'Multi-Currency Support']
          },
          isActive: true
        },
        {
          name: 'PayKings',
          version: '1.0.0',
          type: 'payment',
          manifest: {
            displayName: 'PayKings',
            description: 'Specialized payment processor for adult content with competitive rates',
            category: 'Adult-Specialized',
            fees: 'Competitive (varies)',
            features: ['Adult Content Specialist', 'Competitive Rates', 'Industry Experience', 'Dedicated Support', 'Custom Solutions'],
            difficulty: 'Intermediate',
            setupTime: '15-20 minutes',
            integrationComplexity: 'Medium',
            supportedRegions: ['US', 'International'],
            apiDocumentation: 'https://paykings.com/support/',
            complianceLevel: 'Very High',
            chargebackProtection: true,
            recurringBilling: true,
            ageVerification: true,
            discreteBilling: true,
            icon: 'crown',
            color: '#8b5cf6',
            adultFriendly: true,
            recommended: false
          },
          isActive: true
        },
        {
          name: 'Payoneer',
          version: '1.0.0',
          type: 'payment',
          manifest: {
            displayName: 'Payoneer',
            description: 'Global payment platform with prepaid cards and adult industry expertise',
            category: 'Creator-Payout',
            fees: 'Variable',
            features: ['Global Platform', 'Prepaid Cards', 'Adult Industry Specialist', 'Mass Payouts', 'Multi-Currency'],
            difficulty: 'Beginner',
            setupTime: '5-10 minutes',
            integrationComplexity: 'Low',
            supportedRegions: ['200+ Countries'],
            apiDocumentation: 'https://payoneer.com/developers/',
            complianceLevel: 'High',
            chargebackProtection: false,
            recurringBilling: false,
            ageVerification: false,
            discreteBilling: true,
            icon: 'banknote',
            color: '#f97316',
            adultFriendly: true,
            recommended: true,
            useCase: 'Creator Payouts'
          },
          isActive: true
        }
      ];

      // Check if plugins already exist
      const existingPlugins = await storage.getPluginsByType('payment');
      const existingNames = existingPlugins.map(p => p.name);

      const newPlugins = [];
      for (const processor of paymentProcessors) {
        if (!existingNames.includes(processor.name)) {
          const plugin = await storage.createPlugin(processor);
          newPlugins.push(plugin);
        }
      }

      res.json({ 
        message: `Initialized ${newPlugins.length} new payment processor plugins`,
        plugins: newPlugins,
        total: paymentProcessors.length,
        existing: existingPlugins.length
      });
    } catch (error) {
      console.error("Error initializing payment processors:", error);
      res.status(500).json({ message: "Failed to initialize payment processors" });
    }
  });

  // Get current user
  app.get('/api/auth/user', requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user) {
        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Project routes
  app.get('/api/projects', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const projects = await storage.getUserProjects(userId);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get('/api/projects/:id', requireAuth, async (req: any, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post('/api/projects', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const projectData = insertProjectSchema.parse(req.body);
      
      // Create default org if needed
      let orgId = req.body.orgId;
      if (!orgId) {
        const org = await storage.createOrg({
          name: `${req.user.firstName || 'User'}'s Workspace`,
          plan: 'free'
        });
        orgId = org.id;
      }

      const project = await storage.createProject({
        ...projectData,
        orgId
      });
      
      res.json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  // Build routes
  app.post('/api/builds', requireAuth, async (req: any, res) => {
    try {
      const buildData = insertBuildSchema.parse(req.body);
      const build = await storage.createBuild(buildData);
      
      // Start build process
      if (buildData.projectId) {
        buildService.startBuild(build.id, buildData.projectId);
      }
      
      res.json(build);
    } catch (error) {
      console.error("Error creating build:", error);
      res.status(500).json({ message: "Failed to create build" });
    }
  });

  app.get('/api/builds/:id', requireAuth, async (req: any, res) => {
    try {
      const build = await storage.getBuild(req.params.id);
      if (!build) {
        return res.status(404).json({ message: "Build not found" });
      }
      res.json(build);
    } catch (error) {
      console.error("Error fetching build:", error);
      res.status(500).json({ message: "Failed to fetch build" });
    }
  });

  // Environment variables
  app.post('/api/env', requireAuth, async (req: any, res) => {
    try {
      const envVarData = insertEnvVarSchema.parse(req.body);
      const envVar = await storage.setEnvVar(envVarData);
      res.json(envVar);
    } catch (error) {
      console.error("Error setting environment variable:", error);
      res.status(500).json({ message: "Failed to set environment variable" });
    }
  });

  app.get('/api/projects/:id/env', requireAuth, async (req: any, res) => {
    try {
      const { scope } = req.query;
      const envVars = await storage.getProjectEnvVars(
        req.params.id, 
        scope as string
      );
      res.json(envVars);
    } catch (error) {
      console.error("Error fetching environment variables:", error);
      res.status(500).json({ message: "Failed to fetch environment variables" });
    }
  });

  // AI routes
  app.post('/api/ai/chat', requireAuth, async (req: any, res) => {
    try {
      const { projectId, prompt, context, unrestricted } = req.body;
      const userId = req.user.id;
      
      const response = await aiService.chat({
        projectId,
        prompt,
        context,
        unrestricted: unrestricted || false
      });
      
      res.json(response);
    } catch (error) {
      console.error("Error in AI chat:", error);
      res.status(500).json({ message: "Failed to process AI request" });
    }
  });

  app.post('/api/ai/generate', requireAuth, async (req: any, res) => {
    try {
      const { vibespec, template } = req.body;
      
      // Parse the VibeSpec - it should already have proper structure
      const parsedSpec = vibeSpecParser.parse(vibespec);
      const generatedCode = await aiService.generateCode(parsedSpec);
      
      res.json({ code: generatedCode });
    } catch (error) {
      console.error("Error generating code:", error);
      res.status(500).json({ message: "Failed to generate code" });
    }
  });

  // VibeSpec routes
  app.post('/api/vibespec/parse', requireAuth, async (req: any, res) => {
    try {
      const { yaml } = req.body;
      const parsed = vibeSpecParser.parse(yaml);
      res.json(parsed);
    } catch (error) {
      console.error("Error parsing VibeSpec:", error);
      res.status(400).json({ message: "Invalid VibeSpec format" });
    }
  });

  // Deployment routes
  app.post('/api/deploy', requireAuth, async (req: any, res) => {
    try {
      const { projectId, environment, domain } = req.body;
      
      const deployment = await buildService.deploy(projectId, environment, domain);
      
      res.json(deployment);
    } catch (error) {
      console.error("Error deploying project:", error);
      res.status(500).json({ message: "Failed to deploy project" });
    }
  });

  // Export routes
  app.post('/api/export/:projectId', requireAuth, async (req: any, res) => {
    try {
      const { projectId } = req.params;
      const exportData = await buildService.exportProject(projectId);
      
      res.json(exportData);
    } catch (error) {
      console.error("Error exporting project:", error);
      res.status(500).json({ message: "Failed to export project" });
    }
  });

  // ===========================================
  // ADVANCED FEATURES - Schema Generator
  // ===========================================
  
  // Generate schema from description
  app.post('/api/schema/generate', requireAuth, async (req, res) => {
    try {
      const { description, context } = req.body;
      if (!description) {
        return res.status(400).json({ message: "Description is required" });
      }
      
      const schema = await schemaGenerator.generateFromDescription(description, context);
      res.json({ schema });
    } catch (error: any) {
      console.error("Error generating schema:", error);
      res.status(500).json({ message: error.message || "Failed to generate schema" });
    }
  });
  
  // Generate preset schema
  app.post('/api/schema/preset/:preset', requireAuth, async (req, res) => {
    try {
      const { preset } = req.params;
      const schema = await schemaGenerator.generatePresetSchema(preset);
      res.json({ schema });
    } catch (error: any) {
      console.error("Error generating preset schema:", error);
      res.status(500).json({ message: error.message || "Failed to generate preset schema" });
    }
  });
  
  // ===========================================
  // THEME GENERATOR
  // ===========================================
  
  // Generate theme from description
  app.post('/api/theme/generate', requireAuth, async (req, res) => {
    try {
      const { description, brand } = req.body;
      if (!description) {
        return res.status(400).json({ message: "Description is required" });
      }
      
      const theme = await themeGenerator.generateFromDescription(description, brand);
      res.json({ theme });
    } catch (error: any) {
      console.error("Error generating theme:", error);
      res.status(500).json({ message: error.message || "Failed to generate theme" });
    }
  });
  
  // Generate preset theme
  app.post('/api/theme/preset/:preset', requireAuth, async (req, res) => {
    try {
      const { preset } = req.params;
      const theme = await themeGenerator.generatePresetTheme(preset);
      res.json({ theme });
    } catch (error: any) {
      console.error("Error generating preset theme:", error);
      res.status(500).json({ message: error.message || "Failed to generate preset theme" });
    }
  });

  // ===========================================
  // COMPONENT GENERATOR
  // ===========================================
  
  // Generate component from description
  app.post('/api/component/generate', requireAuth, async (req, res) => {
    try {
      const { description, framework = 'react', options = {} } = req.body;
      if (!description) {
        return res.status(400).json({ message: "Description is required" });
      }
      
      const component = await componentGenerator.generateFromDescription(description, framework, options);
      res.json({ component });
    } catch (error: any) {
      console.error("Error generating component:", error);
      res.status(500).json({ message: error.message || "Failed to generate component" });
    }
  });
  
  // Generate preset component
  app.post('/api/component/preset/:preset', requireAuth, async (req, res) => {
    try {
      const { preset } = req.params;
      const { customization } = req.body;
      
      const component = await componentGenerator.generatePresetComponent(preset, customization);
      res.json({ component });
    } catch (error: any) {
      console.error("Error generating preset component:", error);
      res.status(500).json({ message: error.message || "Failed to generate preset component" });
    }
  });

  // ===========================================
  // DEPLOYMENT MANAGER
  // ===========================================
  
  // Get available deployment platforms
  app.get('/api/deploy/platforms', requireAuth, async (req, res) => {
    try {
      const platforms = deploymentManager.getAvailablePlatforms();
      res.json({ platforms });
    } catch (error: any) {
      console.error("Error fetching platforms:", error);
      res.status(500).json({ message: "Failed to fetch deployment platforms" });
    }
  });
  
  // Deploy project
  app.post('/api/deploy', requireAuth, async (req, res) => {
    try {
      const { projectId, config } = req.body;
      if (!projectId || !config) {
        return res.status(400).json({ message: "ProjectId and config are required" });
      }
      
      // Validate config
      const validation = deploymentManager.validateConfig(config);
      if (!validation.valid) {
        return res.status(400).json({ message: "Invalid configuration", errors: validation.errors });
      }
      
      const deployment = await deploymentManager.deploy(projectId, config);
      res.json({ deployment });
    } catch (error: any) {
      console.error("Error deploying project:", error);
      res.status(500).json({ message: error.message || "Failed to deploy project" });
    }
  });

  // ===========================================
  // VISUAL BUILDER
  // ===========================================
  
  // Get component library
  app.get('/api/visual/components', requireAuth, async (req, res) => {
    try {
      const library = visualBuilder.getComponentLibrary();
      res.json({ library });
    } catch (error: any) {
      console.error("Error fetching component library:", error);
      res.status(500).json({ message: "Failed to fetch component library" });
    }
  });

  // ===========================================
  // UNIVERSAL AI ASSISTANT
  // ===========================================
  
  // Universal AI endpoint for any development task
  app.post('/api/ai/assist', requireAuth, async (req, res) => {
    try {
      const { task, context, type = 'general' } = req.body;
      if (!task) {
        return res.status(400).json({ message: "Task description is required" });
      }
      
      let result;
      
      switch (type) {
        case 'schema':
          result = await schemaGenerator.generateFromDescription(task, context);
          break;
        case 'theme':
          result = await themeGenerator.generateFromDescription(task, context);
          break;
        case 'component':
          result = await componentGenerator.generateFromDescription(task);
          break;
        case 'general':
        default:
          result = await aiService.generateResponse(task);
          break;
      }
      
      res.json({ result, type });
    } catch (error: any) {
      console.error("Error with AI assistance:", error);
      res.status(500).json({ message: error.message || "Failed to process AI request" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time collaboration
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws, req) => {
    console.log('WebSocket client connected');

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        // Broadcast code updates to other clients in the same project
        if (message.type === 'code_update') {
          wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === client.OPEN) {
              client.send(JSON.stringify(message));
            }
          });
        }
        
        // Handle cursor positions for collaborative editing
        if (message.type === 'cursor_position') {
          wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === client.OPEN) {
              client.send(JSON.stringify(message));
            }
          });
        }
        
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connected',
      message: 'Connected to FANZ Forge'
    }));
  });

  return httpServer;
}
