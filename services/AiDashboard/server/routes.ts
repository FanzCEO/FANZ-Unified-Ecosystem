import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateContent, generateImage, generateEmailTemplate, enhanceSocialPost } from "./services/openai";
import { insertContentSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Content generation endpoint
  app.post("/api/generate/content", async (req, res) => {
    try {
      const { type, topic, tone, length, additionalInstructions } = req.body;
      
      if (!type || !topic || !tone || !length) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const content = await generateContent({
        type,
        topic,
        tone,
        length: parseInt(length),
        additionalInstructions,
      });

      // Store the generated content
      const contentRecord = await storage.createContent({
        userId: "demo-user", // In a real app, get from session
        type: "text",
        prompt: `${type} about ${topic}`,
        content,
        metadata: { type, topic, tone, length },
      });

      res.json({ content, id: contentRecord.id });
    } catch (error) {
      console.error("Content generation error:", error);
      res.status(500).json({ message: "Failed to generate content" });
    }
  });

  // Image generation endpoint
  app.post("/api/generate/image", async (req, res) => {
    try {
      const { prompt, style, size } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }

      const result = await generateImage({ prompt, style, size });

      // Store the generated image reference
      await storage.createContent({
        userId: "demo-user",
        type: "image",
        prompt,
        content: result.url,
        metadata: { style, size },
      });

      res.json(result);
    } catch (error) {
      console.error("Image generation error:", error);
      res.status(500).json({ message: "Failed to generate image" });
    }
  });

  // Email template generation endpoint
  app.post("/api/generate/email", async (req, res) => {
    try {
      const { purpose, tone, audience, keyPoints } = req.body;
      
      if (!purpose || !tone || !audience || !keyPoints) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const result = await generateEmailTemplate({
        purpose,
        tone,
        audience,
        keyPoints: Array.isArray(keyPoints) ? keyPoints : [keyPoints],
      });

      // Store the generated email template
      await storage.createContent({
        userId: "demo-user",
        type: "email",
        prompt: `${purpose} email for ${audience}`,
        content: JSON.stringify(result),
        metadata: { purpose, tone, audience, keyPoints },
      });

      res.json(result);
    } catch (error) {
      console.error("Email generation error:", error);
      res.status(500).json({ message: "Failed to generate email template" });
    }
  });

  // Social post enhancement endpoint
  app.post("/api/enhance/social", async (req, res) => {
    try {
      const { content, platform } = req.body;
      
      if (!content || !platform) {
        return res.status(400).json({ message: "Content and platform are required" });
      }

      const enhancedContent = await enhanceSocialPost(content, platform);

      res.json({ content: enhancedContent });
    } catch (error) {
      console.error("Social enhancement error:", error);
      res.status(500).json({ message: "Failed to enhance social post" });
    }
  });

  // Get user's generated content
  app.get("/api/content", async (req, res) => {
    try {
      const content = await storage.getContentByUser("demo-user");
      res.json(content);
    } catch (error) {
      console.error("Content fetch error:", error);
      res.status(500).json({ message: "Failed to fetch content" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
