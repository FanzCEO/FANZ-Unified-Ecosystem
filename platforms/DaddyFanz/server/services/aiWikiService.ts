// AI-powered knowledge base service using OpenAI integration
// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
import OpenAI from "openai";
import { logger } from "../logger";
import { storage } from "../storage";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export interface WikiEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  lastUpdated: Date;
  viewCount: number;
}

export interface SearchResult {
  entry: WikiEntry;
  relevanceScore: number;
  snippet: string;
}

export class AIWikiService {
  private knowledgeBase: WikiEntry[] = [
    {
      id: "creator-onboarding",
      title: "Creator Onboarding Guide",
      content: "Complete guide for new creators joining DaddyFanz. This covers account setup, age verification, content guidelines, monetization options, and best practices for building a fanbase. Includes steps for identity verification, setting up payment methods with adult-friendly processors like CCBill and Segpay, content creation tips, and subscriber engagement strategies.",
      category: "Getting Started",
      tags: ["onboarding", "creators", "setup", "verification"],
      lastUpdated: new Date(),
      viewCount: 0
    },
    {
      id: "payment-processing",
      title: "Adult-Friendly Payment Processing",
      content: "DaddyFanz uses specialized adult-industry payment processors including CCBill, Segpay, Epoch, Verotel, and Paxum. These processors understand adult content businesses and provide reliable payment processing. We never use mainstream processors like Stripe or PayPal that discriminate against adult content. Creators can set up subscriptions, one-time tips, and premium content pricing. All transactions are secure with industry-standard encryption.",
      category: "Payments",
      tags: ["payments", "ccbill", "segpay", "epoch", "adult-friendly"],
      lastUpdated: new Date(),
      viewCount: 0
    },
    {
      id: "content-moderation",
      title: "Content Moderation and Compliance",
      content: "DaddyFanz maintains strict compliance with adult industry regulations including 2257 record-keeping requirements, age verification, and content filtering. Our enterprise-grade moderation system includes automated content scanning, human review processes, and forensic media signatures. Content is classified by severity levels (critical, high, medium, low) with over 15 flag types including age verification, violence, harassment, copyright, and spam detection.",
      category: "Compliance",
      tags: ["moderation", "compliance", "2257", "age-verification"],
      lastUpdated: new Date(),
      viewCount: 0
    },
    {
      id: "real-time-messaging",
      title: "Real-Time Messaging System",
      content: "DaddyFanz features a comprehensive messaging system with WebSocket-powered real-time communication. Creators can chat directly with subscribers, send media content, and manage conversations. Features include message read receipts, typing indicators, online/offline status, and message encryption. The system supports both individual and group conversations with full multimedia support.",
      category: "Features",
      tags: ["messaging", "websocket", "real-time", "communication"],
      lastUpdated: new Date(),
      viewCount: 0
    },
    {
      id: "subscription-management",
      title: "Subscription and Monetization",
      content: "Creators can set up monthly recurring subscriptions, offer premium content tiers, and receive tips from fans. The platform supports multiple pricing models including free content with premium upgrades, tiered subscriptions, and pay-per-view content. Revenue sharing is transparent with detailed analytics and automated payouts through adult-friendly payment processors.",
      category: "Monetization",
      tags: ["subscriptions", "monetization", "revenue", "pricing"],
      lastUpdated: new Date(),
      viewCount: 0
    },
    {
      id: "multi-platform-integration",
      title: "Multi-Platform Integration",
      content: "DaddyFanz offers cross-platform compatibility with web dashboard, mobile apps (ClubCentral integration), and API access. Creators can manage content, respond to messages, and track analytics across all platforms. The system supports content synchronization, unified messaging, and consistent branding across all touchpoints.",
      category: "Technical",
      tags: ["integration", "mobile", "api", "cross-platform"],
      lastUpdated: new Date(),
      viewCount: 0
    },
    {
      id: "privacy-security",
      title: "Privacy and Security Features",
      content: "DaddyFanz prioritizes creator and subscriber privacy with advanced security features including end-to-end message encryption, secure file storage with DRM protection, content watermarking, screenshot prevention, and comprehensive audit logging. All data is stored in compliance with GDPR and CCPA regulations with regular security audits and penetration testing.",
      category: "Security",
      tags: ["privacy", "security", "encryption", "protection"],
      lastUpdated: new Date(),
      viewCount: 0
    }
  ];

  async searchKnowledge(query: string, userId: string): Promise<SearchResult[]> {
    try {
      logger.info(`AI knowledge search initiated for query: ${query} by user: ${userId}`);

      // Use AI to understand the query intent and generate relevant search terms
      const searchResponse = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are a search assistant for DaddyFanz, an adult content creator platform. Analyze the user's query and extract key search terms and intent. Focus on creator-related topics like payments, content creation, subscriptions, verification, messaging, and platform features. Respond in JSON format with search terms and category suggestions."
          },
          {
            role: "user",
            content: `Search query: "${query}". Provide relevant search terms and categories for an adult content creator platform knowledge base.`
          }
        ],
        response_format: { type: "json_object" }
      });

      const searchAnalysis = JSON.parse(searchResponse.choices[0].message.content || "{}");
      
      // Search through knowledge base entries
      const results: SearchResult[] = [];
      
      for (const entry of this.knowledgeBase) {
        let relevanceScore = 0;
        
        // Check title relevance
        if (entry.title.toLowerCase().includes(query.toLowerCase())) {
          relevanceScore += 30;
        }
        
        // Check content relevance
        if (entry.content.toLowerCase().includes(query.toLowerCase())) {
          relevanceScore += 20;
        }
        
        // Check tags relevance
        for (const tag of entry.tags) {
          if (tag.toLowerCase().includes(query.toLowerCase())) {
            relevanceScore += 15;
          }
        }
        
        // Check category relevance
        if (entry.category.toLowerCase().includes(query.toLowerCase())) {
          relevanceScore += 25;
        }

        if (relevanceScore > 0) {
          // Generate AI-powered snippet
          const snippetResponse = await openai.chat.completions.create({
            model: "gpt-5",
            messages: [
              {
                role: "system",
                content: "Generate a concise, relevant snippet from the following content that best answers the user's query. Keep it under 150 characters and focus on the most relevant information."
              },
              {
                role: "user",
                content: `Query: "${query}"\nContent: "${entry.content}"\n\nGenerate a relevant snippet:`
              }
            ]
          });

          const snippet = snippetResponse.choices[0].message.content || entry.content.substring(0, 150);

          results.push({
            entry,
            relevanceScore,
            snippet
          });
        }
      }

      // Sort by relevance score
      results.sort((a, b) => b.relevanceScore - a.relevanceScore);

      // Update view counts
      for (const result of results.slice(0, 5)) {
        result.entry.viewCount++;
      }

      logger.info(`AI knowledge search completed for query: ${query} by user: ${userId}, found ${results.length} results`);

      return results.slice(0, 10); // Return top 10 results
    } catch (error) {
      logger.error(`AI knowledge search failed for query: ${query} by user: ${userId}: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  async generateAnswer(question: string, userId: string): Promise<string> {
    try {
      logger.info(`AI answer generation initiated for question: ${question} by user: ${userId}`);

      // First, search for relevant knowledge
      const searchResults = await this.searchKnowledge(question, userId);
      const context = searchResults
        .slice(0, 3)
        .map(result => `${result.entry.title}: ${result.entry.content}`)
        .join('\n\n');

      // Generate comprehensive answer using AI
      const answerResponse = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are DaddyFanz AI Assistant, a helpful support bot for an adult content creator platform. Provide accurate, helpful, and professional answers based on the knowledge base context. Be supportive and understanding of creators' needs. Always maintain a professional tone while being informative about adult industry practices. If you don't have enough information, suggest contacting support."
          },
          {
            role: "user",
            content: `Question: "${question}"\n\nRelevant knowledge base context:\n${context}\n\nProvide a comprehensive, helpful answer:`
          }
        ]
      });

      const answer = answerResponse.choices[0].message.content || "I don't have enough information to answer that question. Please contact our support team for assistance.";

      logger.info(`AI answer generation completed for question: ${question} by user: ${userId}, answer length: ${answer.length}`);

      return answer;
    } catch (error) {
      logger.error(`AI answer generation failed for question: ${question} by user: ${userId}: ${error instanceof Error ? error.message : String(error)}`);
      return "I'm having trouble processing your question right now. Please try again later or contact our support team.";
    }
  }

  async getPopularArticles(limit: number = 10): Promise<WikiEntry[]> {
    return this.knowledgeBase
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, limit);
  }

  async getArticlesByCategory(category: string): Promise<WikiEntry[]> {
    return this.knowledgeBase.filter(entry => 
      entry.category.toLowerCase() === category.toLowerCase()
    );
  }

  async getAllCategories(): Promise<string[]> {
    const categories = [...new Set(this.knowledgeBase.map(entry => entry.category))];
    return categories.sort();
  }

  async getArticleById(id: string): Promise<WikiEntry | null> {
    const entry = this.knowledgeBase.find(article => article.id === id);
    if (entry) {
      entry.viewCount++;
    }
    return entry || null;
  }

  async suggestRelatedArticles(currentArticleId: string): Promise<WikiEntry[]> {
    const currentArticle = await this.getArticleById(currentArticleId);
    if (!currentArticle) return [];

    try {
      // Use AI to find related articles
      const relatedResponse = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are helping find related articles in a knowledge base. Based on the current article's content and tags, suggest which other articles would be most relevant. Respond with JSON containing article IDs in order of relevance."
          },
          {
            role: "user",
            content: `Current article: "${currentArticle.title}" with tags: ${currentArticle.tags.join(', ')} and category: ${currentArticle.category}. 
            
            Available articles: ${this.knowledgeBase.map(a => `${a.id}: ${a.title} (${a.category})`).join(', ')}
            
            Suggest the most related article IDs:`
          }
        ],
        response_format: { type: "json_object" }
      });

      const suggestions = JSON.parse(relatedResponse.choices[0].message.content || "{}");
      const relatedIds = suggestions.relatedArticles || [];

      return this.knowledgeBase
        .filter(entry => relatedIds.includes(entry.id) && entry.id !== currentArticleId)
        .slice(0, 5);
    } catch (error) {
      logger.error(`Failed to generate related articles for ${currentArticleId}: ${error instanceof Error ? error.message : String(error)}`);
      
      // Fallback to tag-based matching
      return this.knowledgeBase
        .filter(entry => 
          entry.id !== currentArticleId && 
          (entry.category === currentArticle.category || 
           entry.tags.some(tag => currentArticle.tags.includes(tag)))
        )
        .slice(0, 5);
    }
  }
}

export const aiWikiService = new AIWikiService();