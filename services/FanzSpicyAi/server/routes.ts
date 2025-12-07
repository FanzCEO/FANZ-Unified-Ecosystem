import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { generateAdultContent, generateBulkContent, type GenerateContentRequest } from "./openai";
import { insertContentGenerationSchema } from "@shared/schema";
import { z } from "zod";

const generateContentRequestSchema = z.object({
  prompt: z.string().min(1),
  type: z.enum(['title', 'description', 'script', 'social_post']),
  category: z.string().optional(),
  tone: z.enum(['seductive', 'playful', 'dominant', 'submissive', 'romantic', 'explicit']).optional(),
  length: z.enum(['short', 'medium', 'long']).optional(),
});

const bulkGenerateSchema = z.object({
  requests: z.array(generateContentRequestSchema).max(10), // Limit bulk requests
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Content generation routes
  app.post('/api/generate-content', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const userCredits = user.credits || 0;
      if (userCredits <= 0) {
        return res.status(402).json({ message: "Insufficient credits" });
      }

      const requestData = generateContentRequestSchema.parse(req.body);
      
      // Generate content using OpenAI
      const generatedContent = await generateAdultContent(requestData);
      
      // Save to database
      const contentGeneration = await storage.createContentGeneration({
        userId,
        type: requestData.type,
        prompt: requestData.prompt,
        generatedContent: JSON.stringify(generatedContent),
        creditsUsed: 1,
      });

      // Update user credits
      const newCreditBalance = userCredits - 1;
      await storage.updateUserCredits(userId, newCreditBalance);

      res.json({
        id: contentGeneration.id,
        content: generatedContent,
        creditsRemaining: newCreditBalance,
      });
    } catch (error) {
      console.error("Content generation error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid request data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to generate content: " + (error as Error).message });
      }
    }
  });

  app.post('/api/generate-bulk-content', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { requests } = bulkGenerateSchema.parse(req.body);
      const userCredits = user.credits || 0;
      
      if (userCredits < requests.length) {
        return res.status(402).json({ 
          message: "Insufficient credits", 
          required: requests.length,
          available: userCredits 
        });
      }

      // Generate content in bulk
      const generatedContents = await generateBulkContent(requests);
      
      // Save all generations to database
      const contentGenerations = await Promise.all(
        generatedContents.map(async (content, index) => {
          return await storage.createContentGeneration({
            userId,
            type: requests[index].type,
            prompt: requests[index].prompt,
            generatedContent: JSON.stringify(content),
            creditsUsed: 1,
          });
        })
      );

      // Update user credits
      const newCreditBalance = userCredits - requests.length;
      await storage.updateUserCredits(userId, newCreditBalance);

      res.json({
        generations: contentGenerations.map((gen, index) => ({
          id: gen.id,
          content: generatedContents[index],
        })),
        creditsRemaining: newCreditBalance,
      });
    } catch (error) {
      console.error("Bulk content generation error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid request data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to generate bulk content: " + (error as Error).message });
      }
    }
  });

  // Content history routes
  app.get('/api/content-history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 50;
      
      const history = await storage.getUserContentGenerations(userId, limit);
      
      res.json(history.map(item => ({
        ...item,
        generatedContent: JSON.parse(item.generatedContent),
      })));
    } catch (error) {
      console.error("Error fetching content history:", error);
      res.status(500).json({ message: "Failed to fetch content history" });
    }
  });

  app.get('/api/content-history/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      const content = await storage.getContentGenerationById(id);
      
      if (!content || content.userId !== userId) {
        return res.status(404).json({ message: "Content not found" });
      }

      res.json({
        ...content,
        generatedContent: JSON.parse(content.generatedContent),
      });
    } catch (error) {
      console.error("Error fetching content:", error);
      res.status(500).json({ message: "Failed to fetch content" });
    }
  });

  // Categories routes
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getAllContentCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Credits management
  app.get('/api/user/credits', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        credits: user.credits,
        totalCreditsUsed: user.totalCreditsUsed,
      });
    } catch (error) {
      console.error("Error fetching user credits:", error);
      res.status(500).json({ message: "Failed to fetch credits" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
