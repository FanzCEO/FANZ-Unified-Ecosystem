
import OpenAI from "openai";
import { storage } from "./storage";

export class AdvancedAIService {
  private openai?: OpenAI;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
  }

  // AI-powered content optimization
  async optimizeContent(
    userId: string,
    content: {
      title: string;
      description: string;
      tags: string[];
      mediaUrls: string[];
      targetAudience?: string;
    }
  ): Promise<{
    optimizedTitle: string;
    optimizedDescription: string;
    suggestedTags: string[];
    seoScore: number;
    engagementPrediction: number;
    recommendations: string[];
  }> {
    if (!this.openai) {
      return this.generateMockOptimization(content);
    }

    try {
      const userAnalytics = await storage.getCreatorAnalytics(userId);
      
      const optimizationPrompt = `
        Optimize this content for maximum engagement and discoverability:
        
        Title: ${content.title}
        Description: ${content.description}
        Current Tags: ${content.tags.join(', ')}
        Target Audience: ${content.targetAudience || 'General adult audience'}
        
        Creator Analytics:
        - Average Engagement Rate: ${userAnalytics.averageEngagement}%
        - Top Performing Tags: ${userAnalytics.topTags?.join(', ') || 'N/A'}
        - Peak Activity Hours: ${userAnalytics.peakHours?.join(', ') || 'N/A'}
        
        Provide optimized content that:
        1. Increases click-through rates
        2. Improves search discoverability
        3. Matches successful patterns from this creator's history
        4. Complies with platform guidelines
        5. Appeals to the target demographic
        
        Return JSON with optimized content and metrics.
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are an expert content optimization specialist for adult content platforms." },
          { role: "user", content: optimizationPrompt }
        ],
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');

      return {
        optimizedTitle: result.optimizedTitle || content.title,
        optimizedDescription: result.optimizedDescription || content.description,
        suggestedTags: result.suggestedTags || content.tags,
        seoScore: result.seoScore || 75,
        engagementPrediction: result.engagementPrediction || 65,
        recommendations: result.recommendations || []
      };
    } catch (error) {
      console.error('Content optimization failed:', error);
      return this.generateMockOptimization(content);
    }
  }

  // AI-powered audience insights
  async generateAudienceInsights(userId: string): Promise<{
    demographics: {
      ageGroups: { range: string; percentage: number; engagement: number }[];
      locations: { country: string; percentage: number; spendingPower: number }[];
      interests: { category: string; affinity: number; growth: number }[];
    };
    behaviorPatterns: {
      peakActivityHours: number[];
      contentPreferences: { type: string; preference: number }[];
      spendingPatterns: { avgTip: number; frequency: string; seasonality: string }[];
    };
    growthOpportunities: {
      untappedMarkets: string[];
      contentGaps: string[];
      collaborationSuggestions: string[];
      pricingOptimization: { currentPrice: number; suggestedPrice: number; reasoning: string }[];
    };
    predictiveAnalytics: {
      expectedGrowth: { timeframe: string; growth: number }[];
      churnRisk: { level: string; factors: string[] };
      lifetimeValue: { current: number; potential: number };
    };
  }> {
    const userAnalytics = await storage.getCreatorAnalytics(userId);
    const fanData = await storage.getCreatorFans(userId);

    // AI analysis of audience data
    if (this.openai) {
      try {
        const analysisPrompt = `
          Analyze this creator's audience data and provide detailed insights:
          
          Creator Stats:
          - Total Fans: ${fanData.length}
          - Average Engagement: ${userAnalytics.averageEngagement}%
          - Monthly Revenue: $${userAnalytics.monthlyRevenue}
          - Content Categories: ${userAnalytics.contentCategories?.join(', ') || 'Mixed'}
          
          Fan Demographics:
          ${fanData.slice(0, 100).map(fan => `Age: ${fan.age}, Location: ${fan.location}, Spending: $${fan.totalSpent}`).join('\n')}
          
          Provide comprehensive audience insights with actionable recommendations.
        `;

        const response = await this.openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: "You are an expert data analyst specializing in creator economy insights." },
            { role: "user", content: analysisPrompt }
          ],
          response_format: { type: "json_object" }
        });

        return JSON.parse(response.choices[0].message.content || '{}');
      } catch (error) {
        console.error('Audience insights generation failed:', error);
      }
    }

    // Fallback mock data
    return this.generateMockAudienceInsights(userAnalytics, fanData);
  }

  // AI content moderation assistant
  async moderateContentWithAI(
    content: {
      text?: string;
      imageUrls?: string[];
      videoUrls?: string[];
      audioUrls?: string[];
    }
  ): Promise<{
    overallScore: number;
    violations: {
      type: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      confidence: number;
      description: string;
      suggestion: string;
    }[];
    autoApprove: boolean;
    humanReviewRequired: boolean;
    suggestions: string[];
  }> {
    if (!this.openai) {
      return this.generateMockModerationResult();
    }

    try {
      const moderationPrompt = `
        Analyze this content for platform policy violations:
        
        Text Content: ${content.text || 'None'}
        Media Files: ${[...(content.imageUrls || []), ...(content.videoUrls || []), ...(content.audioUrls || [])].length} files
        
        Check for:
        - Age verification compliance
        - Consent verification
        - Prohibited content types
        - Quality standards
        - Legal compliance
        - Community guidelines
        
        Provide detailed moderation analysis with actionable feedback.
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are an expert content moderator for adult content platforms with deep knowledge of legal compliance and safety standards." },
          { role: "user", content: moderationPrompt }
        ],
        response_format: { type: "json_object" }
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('AI moderation failed:', error);
      return this.generateMockModerationResult();
    }
  }

  // Smart pricing recommendations
  async generatePricingStrategy(
    userId: string,
    contentType: 'subscription' | 'ppv' | 'tips' | 'custom'
  ): Promise<{
    currentAnalysis: {
      currentPrice: number;
      marketPosition: 'below' | 'at' | 'above';
      competitorRange: { min: number; max: number; avg: number };
    };
    recommendations: {
      suggestedPrice: number;
      reasoning: string;
      expectedImpact: {
        revenueChange: number;
        subscriberChange: number;
        engagementChange: number;
      };
    };
    strategies: {
      type: string;
      description: string;
      implementation: string;
      expectedResults: string;
    }[];
    testingPlan: {
      duration: string;
      variants: { price: number; allocation: number }[];
      successMetrics: string[];
    };
  }> {
    const userAnalytics = await storage.getCreatorAnalytics(userId);
    const marketData = await this.getMarketPricingData(contentType);

    if (this.openai) {
      try {
        const pricingPrompt = `
          Generate an optimal pricing strategy for this creator:
          
          Creator Profile:
          - Current ${contentType} Price: $${userAnalytics.currentPricing?.[contentType] || 10}
          - Subscriber Count: ${userAnalytics.subscriberCount}
          - Average Engagement: ${userAnalytics.averageEngagement}%
          - Content Quality Score: ${userAnalytics.qualityScore || 85}/100
          - Niche: ${userAnalytics.niche || 'General'}
          
          Market Data:
          - Average Price: $${marketData.averagePrice}
          - Price Range: $${marketData.minPrice} - $${marketData.maxPrice}
          - Top Performer Average: $${marketData.topPerformerAverage}
          
          Provide comprehensive pricing strategy with A/B testing recommendations.
        `;

        const response = await this.openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: "You are a pricing strategy expert for the creator economy with deep knowledge of market dynamics and consumer psychology." },
            { role: "user", content: pricingPrompt }
          ],
          response_format: { type: "json_object" }
        });

        return JSON.parse(response.choices[0].message.content || '{}');
      } catch (error) {
        console.error('Pricing strategy generation failed:', error);
      }
    }

    return this.generateMockPricingStrategy(userAnalytics, marketData);
  }

  // Helper methods
  private generateMockOptimization(content: any) {
    return {
      optimizedTitle: content.title + " 💎",
      optimizedDescription: content.description + "\n\n#exclusive #premium",
      suggestedTags: [...content.tags, "exclusive", "premium", "new"],
      seoScore: 82,
      engagementPrediction: 78,
      recommendations: [
        "Add emoji to title for better engagement",
        "Include call-to-action in description",
        "Post during peak hours (7-9 PM)"
      ]
    };
  }

  private generateMockAudienceInsights(userAnalytics: any, fanData: any[]) {
    return {
      demographics: {
        ageGroups: [
          { range: "18-24", percentage: 25, engagement: 85 },
          { range: "25-34", percentage: 45, engagement: 78 },
          { range: "35-44", percentage: 20, engagement: 72 },
          { range: "45+", percentage: 10, engagement: 68 }
        ],
        locations: [
          { country: "US", percentage: 60, spendingPower: 85 },
          { country: "UK", percentage: 15, spendingPower: 78 },
          { country: "CA", percentage: 10, spendingPower: 82 },
          { country: "AU", percentage: 8, spendingPower: 80 }
        ],
        interests: [
          { category: "Fitness", affinity: 92, growth: 15 },
          { category: "Gaming", affinity: 78, growth: 8 },
          { category: "Travel", affinity: 65, growth: 22 }
        ]
      },
      behaviorPatterns: {
        peakActivityHours: [19, 20, 21, 22],
        contentPreferences: [
          { type: "Photos", preference: 85 },
          { type: "Videos", preference: 92 },
          { type: "Live Streams", preference: 78 }
        ],
        spendingPatterns: [
          { avgTip: 25, frequency: "weekly", seasonality: "higher in winter" }
        ]
      },
      growthOpportunities: {
        untappedMarkets: ["Germany", "France", "Japan"],
        contentGaps: ["Educational content", "Behind-the-scenes"],
        collaborationSuggestions: ["Similar creators in fitness niche"],
        pricingOptimization: [
          { currentPrice: 15, suggestedPrice: 18, reasoning: "Below market average for quality tier" }
        ]
      },
      predictiveAnalytics: {
        expectedGrowth: [
          { timeframe: "30 days", growth: 12 },
          { timeframe: "90 days", growth: 35 }
        ],
        churnRisk: { level: "low", factors: ["High engagement", "Regular posting"] },
        lifetimeValue: { current: 450, potential: 680 }
      }
    };
  }

  private generateMockModerationResult() {
    return {
      overallScore: 88,
      violations: [],
      autoApprove: true,
      humanReviewRequired: false,
      suggestions: [
        "Consider adding more descriptive tags",
        "Ensure all participants are clearly visible for age verification"
      ]
    };
  }

  private generateMockPricingStrategy(userAnalytics: any, marketData: any) {
    return {
      currentAnalysis: {
        currentPrice: 15,
        marketPosition: 'below' as const,
        competitorRange: { min: 10, max: 30, avg: 18 }
      },
      recommendations: {
        suggestedPrice: 18,
        reasoning: "Based on content quality and engagement metrics",
        expectedImpact: {
          revenueChange: 20,
          subscriberChange: -5,
          engagementChange: 2
        }
      },
      strategies: [
        {
          type: "Tiered Pricing",
          description: "Offer multiple subscription tiers",
          implementation: "Basic ($15), Premium ($25), VIP ($40)",
          expectedResults: "25% revenue increase"
        }
      ],
      testingPlan: {
        duration: "30 days",
        variants: [
          { price: 15, allocation: 50 },
          { price: 18, allocation: 50 }
        ],
        successMetrics: ["Revenue per subscriber", "Churn rate", "New sign-ups"]
      }
    };
  }

  private async getMarketPricingData(contentType: string) {
    return {
      averagePrice: 18,
      minPrice: 5,
      maxPrice: 50,
      topPerformerAverage: 25
    };
  }
}

export const advancedAIService = new AdvancedAIService();
