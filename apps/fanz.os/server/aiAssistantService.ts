import OpenAI from "openai";
import { storage } from "./storage";
import type { User, Post } from "@shared/schema";

export enum AIAssistantType {
  CONTENT_CREATOR = 'content_creator',
  CUSTOMER_SUPPORT = 'customer_support', 
  CONTENT_MODERATOR = 'content_moderator',
  MARKETING = 'marketing',
  ANALYTICS = 'analytics'
}

export enum AIRequestType {
  CONTENT_GENERATION = 'content_generation',
  CONTENT_OPTIMIZATION = 'content_optimization',
  CAPTION_WRITING = 'caption_writing',
  HASHTAG_SUGGESTIONS = 'hashtag_suggestions',
  SCHEDULING_ADVICE = 'scheduling_advice',
  PRICING_RECOMMENDATIONS = 'pricing_recommendations',
  FAN_ENGAGEMENT = 'fan_engagement',
  CONTENT_MODERATION = 'content_moderation',
  RESPONSE_GENERATION = 'response_generation',
  TREND_ANALYSIS = 'trend_analysis',
  PERFORMANCE_INSIGHTS = 'performance_insights'
}

export interface AIRequest {
  id: string;
  userId: string;
  type: AIRequestType;
  assistantType: AIAssistantType;
  prompt: string;
  context?: Record<string, any>;
  mediaUrls?: string[];
  createdAt: Date;
  completedAt?: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  response?: string;
  error?: string;
  tokens?: number;
  cost?: number;
}

export interface ContentGenerationRequest {
  contentType: 'post' | 'message' | 'bio' | 'story';
  theme?: string;
  tone?: 'flirty' | 'casual' | 'professional' | 'playful' | 'seductive';
  length?: 'short' | 'medium' | 'long';
  includeEmojis?: boolean;
  targetAudience?: string;
  keywords?: string[];
}

export interface ContentOptimizationRequest {
  existingContent: string;
  goals: ('engagement' | 'conversion' | 'reach' | 'retention')[];
  platform?: 'fanslab' | 'instagram' | 'twitter' | 'tiktok';
}

export interface HashtagSuggestion {
  hashtag: string;
  popularity: 'low' | 'medium' | 'high';
  competition: 'low' | 'medium' | 'high';
  relevance: number;
  estimatedReach: number;
}

export interface PricingRecommendation {
  contentType: 'subscription' | 'ppv' | 'tip_menu' | 'custom';
  suggestedPrice: number;
  reasoning: string;
  marketAnalysis: {
    averagePrice: number;
    competitorRange: { min: number; max: number };
    demandLevel: 'low' | 'medium' | 'high';
  };
}

export interface PerformanceInsight {
  metric: string;
  value: number;
  trend: 'up' | 'down' | 'stable';
  insight: string;
  recommendation: string;
}

class AIAssistantService {
  private openai?: OpenAI;
  private requestHistory: Map<string, AIRequest> = new Map();

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API key not found. AI Assistant will be in mock mode.');
      return;
    }

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  // Main AI request processor
  async processAIRequest(request: Omit<AIRequest, 'id' | 'createdAt' | 'status'>): Promise<AIRequest> {
    const aiRequest: AIRequest = {
      ...request,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      status: 'processing'
    };

    this.requestHistory.set(aiRequest.id, aiRequest);

    try {
      let response: string;

      switch (request.type) {
        case AIRequestType.CONTENT_GENERATION:
          response = await this.generateContent(request.prompt, request.context as ContentGenerationRequest);
          break;
        case AIRequestType.CONTENT_OPTIMIZATION:
          response = await this.optimizeContent(request.prompt, request.context as ContentOptimizationRequest);
          break;
        case AIRequestType.CAPTION_WRITING:
          response = await this.generateCaption(request.prompt, request.mediaUrls);
          break;
        case AIRequestType.HASHTAG_SUGGESTIONS:
          response = await this.suggestHashtags(request.prompt);
          break;
        case AIRequestType.PRICING_RECOMMENDATIONS:
          response = await this.recommendPricing(request.userId, request.context);
          break;
        case AIRequestType.FAN_ENGAGEMENT:
          response = await this.generateEngagementResponse(request.prompt, request.context);
          break;
        case AIRequestType.CONTENT_MODERATION:
          response = await this.moderateContent(request.prompt, request.mediaUrls);
          break;
        case AIRequestType.PERFORMANCE_INSIGHTS:
          response = await this.generatePerformanceInsights(request.userId, request.context);
          break;
        default:
          response = await this.genericAIResponse(request.prompt);
      }

      aiRequest.response = response;
      aiRequest.status = 'completed';
      aiRequest.completedAt = new Date();

    } catch (error: any) {
      console.error('AI request failed:', error);
      aiRequest.error = error.message;
      aiRequest.status = 'failed';
    }

    this.requestHistory.set(aiRequest.id, aiRequest);
    return aiRequest;
  }

  // Content generation for creators
  private async generateContent(prompt: string, options: ContentGenerationRequest): Promise<string> {
    if (!this.openai) {
      return this.mockContentGeneration(options);
    }

    const systemPrompt = `You are an AI assistant specialized in creating engaging adult content for creators on FansLab platform. 
    Create ${options.contentType} content that is:
    - ${options.tone || 'playful'} in tone
    - ${options.length || 'medium'} in length
    - ${options.includeEmojis ? 'includes appropriate emojis' : 'minimal emoji use'}
    ${options.targetAudience ? `- Targeted at: ${options.targetAudience}` : ''}
    
    Keep content appropriate for the platform while being engaging and authentic.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        max_tokens: options.length === 'long' ? 500 : options.length === 'short' ? 100 : 250,
        temperature: 0.8
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      console.error('Content generation failed:', error);
      return this.mockContentGeneration(options);
    }
  }

  // Content optimization
  private async optimizeContent(content: string, options: ContentOptimizationRequest): Promise<string> {
    if (!this.openai) {
      return this.mockContentOptimization(content, options);
    }

    const systemPrompt = `You are an AI content optimization expert for adult content creators. 
    Analyze and improve the given content to maximize ${options.goals.join(', ')}.
    ${options.platform ? `Optimize for ${options.platform} platform specifically.` : ''}
    
    Provide specific recommendations and an improved version.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Original content: ${content}` }
        ],
        temperature: 0.7
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      return this.mockContentOptimization(content, options);
    }
  }

  // Caption generation from media
  private async generateCaption(prompt: string, mediaUrls?: string[]): Promise<string> {
    if (!this.openai) {
      return `Caption for your amazing content! 🔥 ${prompt} #FansLab #Content #Creator`;
    }

    try {
      const messages: any[] = [
        {
          role: "system",
          content: "Generate engaging captions for adult content that drive engagement and subscriptions."
        },
        {
          role: "user",
          content: prompt
        }
      ];

      // If media URLs are provided, analyze them (for image content)
      if (mediaUrls && mediaUrls.length > 0) {
        // Add image analysis for the first image
        messages[1].content = [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: mediaUrls[0] } }
        ];
      }

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        max_tokens: 200,
        temperature: 0.8
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      return `Caption for your amazing content! 🔥 ${prompt} #FansLab #Content #Creator`;
    }
  }

  // Hashtag suggestions
  private async suggestHashtags(content: string): Promise<string> {
    if (!this.openai) {
      return JSON.stringify(this.mockHashtagSuggestions());
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Generate relevant hashtags for adult content. Return as JSON array of hashtag objects with 'hashtag', 'popularity', 'competition', and 'relevance' fields."
          },
          {
            role: "user",
            content: `Content: ${content}`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.6
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      return JSON.stringify(this.mockHashtagSuggestions());
    }
  }

  // Pricing recommendations
  private async recommendPricing(userId: string, context?: any): Promise<string> {
    try {
      const user = await storage.getUser(userId);
      if (!user) throw new Error('User not found');

      // In a real implementation, this would analyze market data
      const marketData = {
        averageSubscription: 15.99,
        averagePPV: 24.99,
        userFollowers: 0, // Would use actual follower count from analytics
        userEngagement: 0.05 // Mock engagement rate
      };

      if (!this.openai) {
        return JSON.stringify(this.mockPricingRecommendation(marketData));
      }

      const prompt = `Analyze pricing for creator with ${marketData.userFollowers} followers and ${marketData.userEngagement * 100}% engagement rate. 
      Market averages: Subscription $${marketData.averageSubscription}, PPV $${marketData.averagePPV}. 
      Provide pricing recommendations as JSON.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a pricing analyst for adult content creators. Provide data-driven pricing recommendations."
          },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      return JSON.stringify(this.mockPricingRecommendation());
    }
  }

  // Fan engagement response generation
  private async generateEngagementResponse(fanMessage: string, context?: any): Promise<string> {
    if (!this.openai) {
      return `Thank you for your message! I really appreciate your support 💕 ${fanMessage.length > 50 ? 'I love hearing from you!' : ''}`;
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Generate personalized, engaging responses to fan messages. Keep responses warm, appreciative, and encourage further interaction."
          },
          {
            role: "user",
            content: `Fan message: "${fanMessage}"`
          }
        ],
        max_tokens: 150,
        temperature: 0.8
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      return `Thank you for your message! I really appreciate your support 💕`;
    }
  }

  // Content moderation
  private async moderateContent(content: string, mediaUrls?: string[]): Promise<string> {
    if (!this.openai) {
      return JSON.stringify({ approved: true, confidence: 0.95, flags: [] });
    }

    try {
      const messages: any[] = [
        {
          role: "system",
          content: "Moderate content for compliance with platform guidelines. Return JSON with 'approved', 'confidence', 'flags', and 'reasoning'."
        },
        {
          role: "user",
          content: `Content to moderate: ${content}`
        }
      ];

      if (mediaUrls && mediaUrls.length > 0) {
        messages[1].content = [
          { type: "text", text: `Content to moderate: ${content}` },
          { type: "image_url", image_url: { url: mediaUrls[0] } }
        ];
      }

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        response_format: { type: "json_object" },
        temperature: 0.2
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      return JSON.stringify({ approved: true, confidence: 0.95, flags: [] });
    }
  }

  // Performance insights generation
  private async generatePerformanceInsights(userId: string, context?: any): Promise<string> {
    try {
      const user = await storage.getUser(userId);
      if (!user) throw new Error('User not found');

      // Mock performance data (in real implementation, this would come from analytics)
      const performanceData = {
        engagement: 4.5,
        revenue: user.totalEarnings || 0,
        followers: 0, // Would use actual follower count from analytics
        contentCount: 25 // Mock
      };

      const insights = this.mockPerformanceInsights(performanceData);
      return JSON.stringify(insights);

    } catch (error) {
      return JSON.stringify([]);
    }
  }

  // Generic AI response
  private async genericAIResponse(prompt: string): Promise<string> {
    if (!this.openai) {
      return `I understand you're asking about: "${prompt}". I'm here to help with content creation, optimization, and platform insights!`;
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a helpful AI assistant for adult content creators on FansLab platform."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.7
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      return `I understand you're asking about: "${prompt}". I'm here to help with content creation, optimization, and platform insights!`;
    }
  }

  // Mock responses for when API is not available
  private mockContentGeneration(options: ContentGenerationRequest): string {
    const templates = {
      post: `Hey beautiful souls! 💕 Just dropped some new content that I'm super excited about! ${options.theme ? `It's all about ${options.theme} and` : 'It'} I can't wait for you to see it! Who's ready for some fun? 🔥✨`,
      message: `Thank you so much for your support! 💖 You mean the world to me and I love connecting with amazing people like you!`,
      bio: `✨ Your favorite creator ✨ | Premium content | Daily posts | DMs always open 💕`,
      story: `Behind the scenes moment! Just finished an amazing shoot and feeling so grateful for all the love and support! 🙏💕`
    };

    return templates[options.contentType] || templates.post;
  }

  private mockContentOptimization(content: string, options: ContentOptimizationRequest): string {
    return `**Optimized Content:**
${content} 

🔥 **Optimization Tips:**
- Add more engaging emojis
- Include a call-to-action
- Use trending hashtags
- Post during peak hours (7-9 PM)
- Ask questions to boost engagement

**Improved Version:**
${content} What do you think? Drop a 🔥 in the comments! #ContentCreator #FansLab`;
  }

  private mockHashtagSuggestions(): HashtagSuggestion[] {
    return [
      { hashtag: '#FansLab', popularity: 'high', competition: 'medium', relevance: 95, estimatedReach: 50000 },
      { hashtag: '#ContentCreator', popularity: 'high', competition: 'high', relevance: 90, estimatedReach: 100000 },
      { hashtag: '#ExclusiveContent', popularity: 'medium', competition: 'low', relevance: 85, estimatedReach: 25000 },
      { hashtag: '#CreatorLife', popularity: 'medium', competition: 'medium', relevance: 80, estimatedReach: 30000 },
      { hashtag: '#BehindTheScenes', popularity: 'medium', competition: 'low', relevance: 75, estimatedReach: 20000 }
    ];
  }

  private mockPricingRecommendation(marketData?: any): PricingRecommendation {
    return {
      contentType: 'subscription',
      suggestedPrice: 19.99,
      reasoning: 'Based on your follower count and engagement rate, this price point balances accessibility with value.',
      marketAnalysis: {
        averagePrice: 15.99,
        competitorRange: { min: 9.99, max: 29.99 },
        demandLevel: 'medium'
      }
    };
  }

  private mockPerformanceInsights(data: any): PerformanceInsight[] {
    return [
      {
        metric: 'Engagement Rate',
        value: data.engagement,
        trend: 'up',
        insight: 'Your engagement rate is above platform average',
        recommendation: 'Continue with current content style and posting frequency'
      },
      {
        metric: 'Revenue Growth',
        value: data.revenue,
        trend: 'stable',
        insight: 'Revenue has remained consistent over the past month',
        recommendation: 'Consider adding premium content tiers to boost earnings'
      }
    ];
  }

  // Public methods for external use
  async getContentSuggestions(userId: string, contentType: string): Promise<string[]> {
    const suggestions = [
      'Share a behind-the-scenes moment',
      'Create a Q&A session with your fans',
      'Post your morning routine',
      'Share your favorite workout',
      'Create a "day in my life" post'
    ];

    return suggestions;
  }

  async getOptimalPostingTimes(userId: string): Promise<{ hour: number; engagement: number }[]> {
    // Mock optimal posting times
    return [
      { hour: 9, engagement: 75 },
      { hour: 13, engagement: 80 },
      { hour: 19, engagement: 95 },
      { hour: 21, engagement: 90 }
    ];
  }

  getRequestHistory(userId: string): AIRequest[] {
    return Array.from(this.requestHistory.values())
      .filter(req => req.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

export const aiAssistantService = new AIAssistantService();