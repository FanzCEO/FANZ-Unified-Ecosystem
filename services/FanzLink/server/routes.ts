import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertSocialLinkSchema, insertProductSchema, insertAnalyticsSchema, insertFanzBrandSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // User routes
  app.get("/api/user/:username", async (req, res) => {
    try {
      const user = await storage.getUserByUsername(req.params.username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  app.put("/api/user/:id", async (req, res) => {
    try {
      const validatedData = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(req.params.id, validatedData);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  // Social links routes
  app.get("/api/social-links/:userId", async (req, res) => {
    try {
      const socialLinks = await storage.getSocialLinks(req.params.userId);
      res.json(socialLinks);
    } catch (error) {
      res.status(500).json({ message: "Failed to get social links" });
    }
  });

  app.post("/api/social-links", async (req, res) => {
    try {
      const validatedData = insertSocialLinkSchema.parse(req.body);
      const socialLink = await storage.createSocialLink(validatedData);
      res.status(201).json(socialLink);
    } catch (error: any) {
      if (error.code === '23505') { // Unique constraint violation
        res.status(409).json({ message: "Duplicate social link" });
      } else if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid social link data", errors: error.errors });
      } else {
        console.error("Error creating social link:", error);
        res.status(500).json({ message: "Failed to create social link" });
      }
    }
  });

  app.put("/api/social-links/:id", async (req, res) => {
    try {
      const validatedData = insertSocialLinkSchema.partial().parse(req.body);
      const socialLink = await storage.updateSocialLink(req.params.id, validatedData);
      if (!socialLink) {
        return res.status(404).json({ message: "Social link not found" });
      }
      res.json(socialLink);
    } catch (error) {
      res.status(400).json({ message: "Invalid social link data" });
    }
  });

  app.delete("/api/social-links/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteSocialLink(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Social link not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete social link" });
    }
  });

  // Products routes
  app.get("/api/products/:userId", async (req, res) => {
    try {
      const products = await storage.getProducts(req.params.userId);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to get products" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      res.status(201).json(product);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid product data", errors: error.errors });
      } else {
        console.error("Error creating product:", error);
        res.status(500).json({ message: "Failed to create product" });
      }
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const validatedData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(req.params.id, validatedData);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(400).json({ message: "Invalid product data" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteProduct(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Analytics routes
  app.get("/api/analytics/:userId", async (req, res) => {
    try {
      const analytics = await storage.getAnalytics(req.params.userId);
      if (!analytics) {
        return res.status(404).json({ message: "Analytics not found" });
      }
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: "Failed to get analytics" });
    }
  });

  app.put("/api/analytics/:userId", async (req, res) => {
    try {
      const validatedData = insertAnalyticsSchema.parse(req.body);
      const analytics = await storage.updateAnalytics(req.params.userId, validatedData);
      res.json(analytics);
    } catch (error) {
      res.status(400).json({ message: "Invalid analytics data" });
    }
  });

  // Fanz Brands routes
  app.get("/api/fanz-brands/:userId", async (req, res) => {
    try {
      const fanzBrands = await storage.getFanzBrands(req.params.userId);
      res.json(fanzBrands);
    } catch (error) {
      res.status(500).json({ message: "Failed to get Fanz brands" });
    }
  });

  app.post("/api/fanz-brands", async (req, res) => {
    try {
      const validatedData = insertFanzBrandSchema.parse(req.body);
      const fanzBrand = await storage.createFanzBrand(validatedData);
      res.status(201).json(fanzBrand);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid Fanz brand data", errors: error.errors });
      } else {
        console.error("Error creating Fanz brand:", error);
        res.status(500).json({ message: "Failed to create Fanz brand" });
      }
    }
  });

  app.put("/api/fanz-brands/:id", async (req, res) => {
    try {
      const validatedData = insertFanzBrandSchema.partial().parse(req.body);
      const fanzBrand = await storage.updateFanzBrand(req.params.id, validatedData);
      if (!fanzBrand) {
        return res.status(404).json({ message: "Fanz brand not found" });
      }
      res.json(fanzBrand);
    } catch (error) {
      res.status(400).json({ message: "Invalid Fanz brand data" });
    }
  });

  // Analytics tracking endpoint
  app.post("/api/track-click", async (req, res) => {
    try {
      const { userId, platform } = req.body;
      if (!userId || !platform) {
        return res.status(400).json({ message: "Missing userId or platform" });
      }
      
      const analytics = await storage.getAnalytics(userId);
      if (analytics) {
        await storage.updateAnalytics(userId, {
          totalClicks: (analytics.totalClicks || 0) + 1,
          weeklyClicks: (analytics.weeklyClicks || 0) + 1,
        });
      }
      res.status(200).json({ message: "Click tracked" });
    } catch (error) {
      console.error("Error tracking click:", error);
      res.status(500).json({ message: "Failed to track click" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
