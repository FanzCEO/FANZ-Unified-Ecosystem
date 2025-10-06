import { EventEmitter } from 'events';
import {
  CurationResult,
  ContentItem,
  UserPreferences,
  QualityMetrics,
  TrendingContent,
  PersonalizationProfile,
  CurationAlgorithm
} from '../types';

export class CurationEngine extends EventEmitter {
  private algorithms: Map<string, CurationAlgorithm> = new Map();
  private contentCache: Map<string, ContentItem[]> = new Map();
  private userProfiles: Map<string, PersonalizationProfile> = new Map();
  private trendingContent: TrendingContent[] = [];
  private qualityThreshold = 0.7;

  constructor() {
    super();
    this.initializeAlgorithms();
    this.startTrendingAnalysis();
  }

  private initializeAlgorithms(): void {
    // Initialize curation algorithms
    this.algorithms.set('collaborative', {
      id: 'collaborative',
      name: 'Collaborative Filtering',
      type: 'recommendation',
      accuracy: 0.85,
      weight: 0.3,
      isActive: true,
      config: {
        neighborhoodSize: 50,
        minSimilarity: 0.3,
        decayFactor: 0.9
      }
    });

    this.algorithms.set('content-based', {
      id: 'content-based',
      name: 'Content-Based Filtering',
      type: 'recommendation',
      accuracy: 0.82,
      weight: 0.25,
      isActive: true,
      config: {
        featureWeights: {
          category: 0.4,
          creator: 0.3,
          tags: 0.2,
          quality: 0.1
        }
      }
    });

    this.algorithms.set('trending', {
      id: 'trending',
      name: 'Trending Analysis',
      type: 'discovery',
      accuracy: 0.78,
      weight: 0.2,
      isActive: true,
      config: {
        timeWindow: 24 * 60 * 60 * 1000, // 24 hours
        velocityThreshold: 0.5,
        popularityWeight: 0.6
      }
    });

    this.algorithms.set('ai-enhanced', {
      id: 'ai-enhanced',
      name: 'AI-Enhanced Discovery',
      type: 'ml',
      accuracy: 0.91,
      weight: 0.25,
      isActive: true,
      config: {
        modelVersion: 'v2.1',
        confidenceThreshold: 0.75,
        contextWeight: 0.3
      }
    });

    this.emit('algorithms-initialized', Array.from(this.algorithms.values()));
  }

  async curateContent(
    userId: string,
    preferences: UserPreferences,
    limit: number = 20,
    options?: {
      includeExploration?: boolean;
      categories?: string[];
      timeRange?: 'day' | 'week' | 'month' | 'all';
      quality?: 'high' | 'medium' | 'all';
    }
  ): Promise<CurationResult> {
    const startTime = Date.now();
    
    try {
      // Get or create user profile
      const userProfile = await this.getUserProfile(userId, preferences);
      
      // Fetch candidate content
      const candidates = await this.fetchCandidateContent(userProfile, options);
      
      // Apply curation algorithms
      const scoredContent = await this.scoreContent(candidates, userProfile, preferences);
      
      // Apply quality filters
      const qualityFiltered = await this.filterByQuality(scoredContent, options?.quality || 'medium');
      
      // Diversify results
      const diversified = await this.diversifyResults(qualityFiltered, userProfile);
      
      // Apply final ranking and limit
      const finalResults = diversified
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
      
      const curationResult: CurationResult = {
        userId,
        content: finalResults,
        totalCandidates: candidates.length,
        processingTime: Date.now() - startTime,
        algorithmWeights: this.getAlgorithmWeights(),
        personalizationScore: this.calculatePersonalizationScore(userProfile, finalResults),
        diversityScore: this.calculateDiversityScore(finalResults),
        qualityScore: this.calculateAverageQuality(finalResults),
        freshness: this.calculateFreshness(finalResults),
        timestamp: new Date()
      };
      
      // Update user profile based on curation
      await this.updateUserProfile(userId, finalResults);
      
      this.emit('content-curated', curationResult);
      return curationResult;
      
    } catch (error) {
      this.emit('curation-error', { userId, error });
      throw error;
    }
  }

  async discoverTrending(
    category?: string,
    timeRange: 'hour' | 'day' | 'week' = 'day',
    limit: number = 50
  ): Promise<TrendingContent[]> {
    const trending = this.trendingContent
      .filter(item => {
        const ageMs = Date.now() - item.timestamp.getTime();
        const maxAge = this.getMaxAge(timeRange);
        return ageMs <= maxAge && (!category || item.category === category);
      })
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, limit);

    this.emit('trending-discovered', { category, timeRange, count: trending.length });
    return trending;
  }

  async analyzeContentQuality(content: ContentItem): Promise<QualityMetrics> {
    const metrics: QualityMetrics = {
      contentId: content.id,
      overallScore: 0,
      technicalQuality: await this.assessTechnicalQuality(content),
      engagementPotential: await this.assessEngagementPotential(content),
      originality: await this.assessOriginality(content),
      relevance: await this.assessRelevance(content),
      safetyScore: await this.assessSafety(content),
      completeness: await this.assessCompleteness(content),
      timestamp: new Date()
    };

    // Calculate overall score
    metrics.overallScore = (
      metrics.technicalQuality * 0.2 +
      metrics.engagementPotential * 0.25 +
      metrics.originality * 0.15 +
      metrics.relevance * 0.2 +
      metrics.safetyScore * 0.1 +
      metrics.completeness * 0.1
    );

    this.emit('quality-analyzed', metrics);
    return metrics;
  }

  async personalizeForUser(
    userId: string,
    content: ContentItem[],
    context?: {
      time?: Date;
      location?: string;
      device?: string;
      mood?: string;
    }
  ): Promise<ContentItem[]> {
    const userProfile = await this.getUserProfile(userId);
    
    if (!userProfile) {
      return content; // Return unfiltered if no profile
    }

    // Apply personalization scoring
    const personalizedContent = await Promise.all(
      content.map(async (item) => {
        const personalizationScore = await this.calculatePersonalizationScore(
          userProfile,
          [item],
          context
        );
        
        return {
          ...item,
          score: (item.score || 0.5) * personalizationScore
        };
      })
    );

    // Sort by personalized score
    const sorted = personalizedContent.sort((a, b) => (b.score || 0) - (a.score || 0));
    
    this.emit('content-personalized', { userId, count: sorted.length });
    return sorted;
  }

  async updateUserPreferences(
    userId: string,
    interactions: {
      contentId: string;
      action: 'view' | 'like' | 'share' | 'skip' | 'report';
      duration?: number;
      timestamp: Date;
    }[]
  ): Promise<void> {
    const profile = await this.getUserProfile(userId);
    if (!profile) return;

    for (const interaction of interactions) {
      await this.processInteraction(profile, interaction);
    }

    // Update profile timestamp
    profile.lastUpdated = new Date();
    this.userProfiles.set(userId, profile);
    
    this.emit('preferences-updated', { userId, interactions: interactions.length });
  }

  async getRecommendationExplanation(
    userId: string,
    contentId: string
  ): Promise<{
    reasons: string[];
    confidence: number;
    factors: { factor: string; weight: number; contribution: number }[];
  }> {
    const userProfile = await this.getUserProfile(userId);
    const content = await this.getContentById(contentId);
    
    if (!userProfile || !content) {
      throw new Error('User profile or content not found');
    }

    const factors = [
      {
        factor: 'Similar content preferences',
        weight: 0.3,
        contribution: this.calculateCategoryMatch(userProfile, content)
      },
      {
        factor: 'Creator following patterns',
        weight: 0.25,
        contribution: this.calculateCreatorMatch(userProfile, content)
      },
      {
        factor: 'Trending in your interests',
        weight: 0.2,
        contribution: this.calculateTrendingMatch(userProfile, content)
      },
      {
        factor: 'Quality score',
        weight: 0.15,
        contribution: content.qualityScore || 0.7
      },
      {
        factor: 'Engagement similarity',
        weight: 0.1,
        contribution: this.calculateEngagementMatch(userProfile, content)
      }
    ];

    const confidence = factors.reduce((sum, f) => sum + (f.weight * f.contribution), 0);
    
    const reasons = factors
      .filter(f => f.contribution > 0.6)
      .map(f => this.generateReasonText(f.factor, f.contribution));

    return { reasons, confidence, factors };
  }

  getStats(): {
    algorithmsActive: number;
    totalProfiles: number;
    trendingItems: number;
    cacheSize: number;
    qualityThreshold: number;
  } {
    return {
      algorithmsActive: Array.from(this.algorithms.values()).filter(a => a.isActive).length,
      totalProfiles: this.userProfiles.size,
      trendingItems: this.trendingContent.length,
      cacheSize: Array.from(this.contentCache.values()).reduce((sum, items) => sum + items.length, 0),
      qualityThreshold: this.qualityThreshold
    };
  }

  private async getUserProfile(
    userId: string,
    preferences?: UserPreferences
  ): Promise<PersonalizationProfile> {
    if (this.userProfiles.has(userId)) {
      const profile = this.userProfiles.get(userId)!;
      
      // Update preferences if provided
      if (preferences) {
        profile.preferences = { ...profile.preferences, ...preferences };
        profile.lastUpdated = new Date();
      }
      
      return profile;
    }

    // Create new profile
    const newProfile: PersonalizationProfile = {
      userId,
      preferences: preferences || {
        categories: ['lifestyle', 'entertainment'],
        creators: [],
        tags: [],
        contentTypes: ['video', 'image']
      },
      behaviorHistory: {
        viewedContent: [],
        likedCategories: {},
        skipPatterns: {},
        engagementTimes: [],
        devicePreferences: {}
      },
      interestVector: this.generateInitialInterestVector(preferences),
      lastUpdated: new Date(),
      createdAt: new Date()
    };

    this.userProfiles.set(userId, newProfile);
    return newProfile;
  }

  private async fetchCandidateContent(
    userProfile: PersonalizationProfile,
    options?: any
  ): Promise<ContentItem[]> {
    // Simulate content fetching
    const mockContent: ContentItem[] = [];
    
    for (let i = 0; i < 100; i++) {
      mockContent.push({
        id: `content-${i}`,
        title: `Content Item ${i}`,
        description: `Description for content item ${i}`,
        creatorId: `creator-${Math.floor(i / 10)}`,
        category: ['lifestyle', 'fitness', 'entertainment', 'technology'][i % 4],
        tags: [`tag${i % 5}`, `tag${(i + 1) % 5}`],
        contentType: ['video', 'image', 'text'][i % 3] as any,
        url: `https://example.com/content/${i}`,
        thumbnailUrl: `https://example.com/thumb/${i}`,
        duration: Math.floor(Math.random() * 600) + 60,
        qualityScore: 0.5 + Math.random() * 0.4,
        engagementMetrics: {
          views: Math.floor(Math.random() * 10000),
          likes: Math.floor(Math.random() * 1000),
          shares: Math.floor(Math.random() * 100),
          comments: Math.floor(Math.random() * 200)
        },
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      });
    }

    return mockContent;
  }

  private async scoreContent(
    candidates: ContentItem[],
    userProfile: PersonalizationProfile,
    preferences: UserPreferences
  ): Promise<ContentItem[]> {
    return Promise.all(
      candidates.map(async (content) => {
        let totalScore = 0;
        let totalWeight = 0;

        // Apply each active algorithm
        for (const [id, algorithm] of this.algorithms.entries()) {
          if (!algorithm.isActive) continue;

          let algorithmScore = 0;
          
          switch (algorithm.type) {
            case 'recommendation':
              algorithmScore = await this.applyRecommendationAlgorithm(content, userProfile, algorithm);
              break;
            case 'discovery':
              algorithmScore = await this.applyDiscoveryAlgorithm(content, algorithm);
              break;
            case 'ml':
              algorithmScore = await this.applyMLAlgorithm(content, userProfile, algorithm);
              break;
          }

          totalScore += algorithmScore * algorithm.weight;
          totalWeight += algorithm.weight;
        }

        const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0.5;
        
        return {
          ...content,
          score: finalScore,
          scoringDetails: {
            algorithmScores: {},
            finalScore,
            confidence: Math.min(finalScore + 0.1, 1.0)
          }
        };
      })
    );
  }

  private async filterByQuality(
    content: ContentItem[],
    qualityLevel: 'high' | 'medium' | 'all'
  ): Promise<ContentItem[]> {
    const thresholds = {
      high: 0.8,
      medium: 0.6,
      all: 0.0
    };

    const threshold = thresholds[qualityLevel];
    return content.filter(item => (item.qualityScore || 0.5) >= threshold);
  }

  private async diversifyResults(
    content: ContentItem[],
    userProfile: PersonalizationProfile
  ): Promise<ContentItem[]> {
    const diversified: ContentItem[] = [];
    const categoryCount: { [key: string]: number } = {};
    const creatorCount: { [key: string]: number } = {};
    const maxPerCategory = Math.ceil(content.length * 0.4);
    const maxPerCreator = Math.ceil(content.length * 0.3);

    for (const item of content) {
      const categoryUsage = categoryCount[item.category] || 0;
      const creatorUsage = creatorCount[item.creatorId] || 0;

      if (categoryUsage < maxPerCategory && creatorUsage < maxPerCreator) {
        diversified.push(item);
        categoryCount[item.category] = categoryUsage + 1;
        creatorCount[item.creatorId] = creatorUsage + 1;
      }
    }

    // Fill remaining slots with best remaining content
    const remaining = content.filter(item => !diversified.includes(item));
    const needed = Math.min(remaining.length, content.length - diversified.length);
    diversified.push(...remaining.slice(0, needed));

    return diversified;
  }

  // Algorithm implementations
  private async applyRecommendationAlgorithm(
    content: ContentItem,
    userProfile: PersonalizationProfile,
    algorithm: CurationAlgorithm
  ): Promise<number> {
    if (algorithm.id === 'collaborative') {
      return this.calculateCollaborativeScore(content, userProfile);
    } else if (algorithm.id === 'content-based') {
      return this.calculateContentBasedScore(content, userProfile);
    }
    return 0.5;
  }

  private async applyDiscoveryAlgorithm(
    content: ContentItem,
    algorithm: CurationAlgorithm
  ): Promise<number> {
    if (algorithm.id === 'trending') {
      return this.calculateTrendingScore(content);
    }
    return 0.5;
  }

  private async applyMLAlgorithm(
    content: ContentItem,
    userProfile: PersonalizationProfile,
    algorithm: CurationAlgorithm
  ): Promise<number> {
    // Simulate ML algorithm scoring
    const categoryMatch = userProfile.preferences.categories.includes(content.category) ? 1 : 0;
    const qualityBonus = (content.qualityScore || 0.5) > 0.7 ? 0.2 : 0;
    const engagementScore = this.normalizeEngagement(content.engagementMetrics);
    
    return Math.min((categoryMatch * 0.4) + (qualityBonus * 0.3) + (engagementScore * 0.3), 1.0);
  }

  // Scoring helper methods
  private calculateCollaborativeScore(content: ContentItem, userProfile: PersonalizationProfile): number {
    // Simplified collaborative filtering
    const categoryPreference = userProfile.behaviorHistory.likedCategories[content.category] || 0;
    const creatorPreference = userProfile.preferences.creators.includes(content.creatorId) ? 1 : 0;
    return Math.min((categoryPreference * 0.6) + (creatorPreference * 0.4), 1.0);
  }

  private calculateContentBasedScore(content: ContentItem, userProfile: PersonalizationProfile): number {
    let score = 0;
    const weights = this.algorithms.get('content-based')?.config.featureWeights || {};
    
    // Category match
    if (userProfile.preferences.categories.includes(content.category)) {
      score += weights.category || 0.4;
    }
    
    // Creator match
    if (userProfile.preferences.creators.includes(content.creatorId)) {
      score += weights.creator || 0.3;
    }
    
    // Tag overlap
    const tagOverlap = content.tags.filter(tag => userProfile.preferences.tags.includes(tag)).length;
    const tagScore = Math.min(tagOverlap / Math.max(content.tags.length, 1), 1);
    score += tagScore * (weights.tags || 0.2);
    
    // Quality
    score += (content.qualityScore || 0.5) * (weights.quality || 0.1);
    
    return Math.min(score, 1.0);
  }

  private calculateTrendingScore(content: ContentItem): number {
    const ageHours = (Date.now() - content.createdAt.getTime()) / (1000 * 60 * 60);
    const agePenalty = Math.max(0, 1 - (ageHours / 24)); // Penalty for older content
    const engagementScore = this.normalizeEngagement(content.engagementMetrics);
    
    return (engagementScore * 0.7) + (agePenalty * 0.3);
  }

  private normalizeEngagement(metrics: ContentItem['engagementMetrics']): number {
    // Simple engagement normalization
    const totalEngagement = metrics.likes + metrics.shares + (metrics.comments * 2);
    const engagementRate = totalEngagement / Math.max(metrics.views, 1);
    return Math.min(engagementRate * 10, 1.0); // Scale to 0-1
  }

  // Quality assessment methods
  private async assessTechnicalQuality(content: ContentItem): Promise<number> {
    // Simulate technical quality assessment
    return 0.7 + Math.random() * 0.25;
  }

  private async assessEngagementPotential(content: ContentItem): Promise<number> {
    return this.normalizeEngagement(content.engagementMetrics);
  }

  private async assessOriginality(content: ContentItem): Promise<number> {
    // Simulate originality assessment
    return 0.6 + Math.random() * 0.35;
  }

  private async assessRelevance(content: ContentItem): Promise<number> {
    // Simulate relevance assessment
    return 0.65 + Math.random() * 0.3;
  }

  private async assessSafety(content: ContentItem): Promise<number> {
    // Simulate safety assessment
    return 0.85 + Math.random() * 0.1;
  }

  private async assessCompleteness(content: ContentItem): Promise<number> {
    // Assess if content has all required fields
    const requiredFields = ['title', 'description', 'creatorId', 'category'];
    const completeness = requiredFields.filter(field => 
      content[field as keyof ContentItem] !== undefined && 
      content[field as keyof ContentItem] !== ''
    ).length / requiredFields.length;
    
    return completeness;
  }

  // Utility methods
  private getAlgorithmWeights(): { [key: string]: number } {
    const weights: { [key: string]: number } = {};
    this.algorithms.forEach((algorithm, id) => {
      if (algorithm.isActive) {
        weights[id] = algorithm.weight;
      }
    });
    return weights;
  }

  private calculatePersonalizationScore(
    userProfile: PersonalizationProfile,
    content: ContentItem[],
    context?: any
  ): number {
    if (content.length === 0) return 0;
    
    return content.reduce((sum, item) => {
      let score = 0;
      
      // Category preference
      if (userProfile.preferences.categories.includes(item.category)) {
        score += 0.4;
      }
      
      // Creator following
      if (userProfile.preferences.creators.includes(item.creatorId)) {
        score += 0.3;
      }
      
      // Tag preferences
      const tagOverlap = item.tags.filter(tag => userProfile.preferences.tags.includes(tag)).length;
      score += (tagOverlap / Math.max(item.tags.length, 1)) * 0.3;
      
      return sum + score;
    }, 0) / content.length;
  }

  private calculateDiversityScore(content: ContentItem[]): number {
    if (content.length === 0) return 0;
    
    const categories = new Set(content.map(item => item.category));
    const creators = new Set(content.map(item => item.creatorId));
    const contentTypes = new Set(content.map(item => item.contentType));
    
    const categoryDiversity = categories.size / content.length;
    const creatorDiversity = creators.size / content.length;
    const typeDiversity = contentTypes.size / content.length;
    
    return (categoryDiversity + creatorDiversity + typeDiversity) / 3;
  }

  private calculateAverageQuality(content: ContentItem[]): number {
    if (content.length === 0) return 0;
    
    return content.reduce((sum, item) => sum + (item.qualityScore || 0.5), 0) / content.length;
  }

  private calculateFreshness(content: ContentItem[]): number {
    if (content.length === 0) return 0;
    
    const now = Date.now();
    const avgAge = content.reduce((sum, item) => {
      const ageHours = (now - item.createdAt.getTime()) / (1000 * 60 * 60);
      return sum + ageHours;
    }, 0) / content.length;
    
    // Convert to freshness score (newer = higher score)
    return Math.max(0, 1 - (avgAge / (7 * 24))); // 7 days = 0 freshness
  }

  private async updateUserProfile(userId: string, curatedContent: ContentItem[]): Promise<void> {
    const profile = this.userProfiles.get(userId);
    if (!profile) return;
    
    // Update viewed content
    const contentIds = curatedContent.map(item => item.id);
    profile.behaviorHistory.viewedContent.push(...contentIds);
    
    // Limit history size
    if (profile.behaviorHistory.viewedContent.length > 1000) {
      profile.behaviorHistory.viewedContent = profile.behaviorHistory.viewedContent.slice(-1000);
    }
    
    profile.lastUpdated = new Date();
  }

  private generateInitialInterestVector(preferences?: UserPreferences): number[] {
    // Generate a simple interest vector based on preferences
    const vector = new Array(20).fill(0.1); // 20-dimensional vector
    
    if (preferences) {
      preferences.categories.forEach((category, index) => {
        if (index < vector.length) {
          vector[index] = 0.8 + Math.random() * 0.2;
        }
      });
    }
    
    return vector;
  }

  private startTrendingAnalysis(): void {
    // Update trending content every hour
    setInterval(() => {
      this.updateTrendingContent();
    }, 60 * 60 * 1000);
    
    // Initial update
    this.updateTrendingContent();
  }

  private async updateTrendingContent(): Promise<void> {
    // Simulate trending content discovery
    const mockTrending: TrendingContent[] = [];
    
    for (let i = 0; i < 20; i++) {
      mockTrending.push({
        contentId: `trending-${i}`,
        category: ['lifestyle', 'fitness', 'entertainment', 'technology'][i % 4],
        trendingScore: 0.5 + Math.random() * 0.5,
        velocity: Math.random() * 2,
        timestamp: new Date(),
        metadata: {
          reason: 'High engagement velocity',
          duration: '2h',
          peakTime: new Date(Date.now() - Math.random() * 2 * 60 * 60 * 1000)
        }
      });
    }
    
    this.trendingContent = mockTrending;
    this.emit('trending-updated', { count: mockTrending.length });
  }

  private getMaxAge(timeRange: 'hour' | 'day' | 'week'): number {
    const ranges = {
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000
    };
    return ranges[timeRange];
  }

  private async processInteraction(
    profile: PersonalizationProfile,
    interaction: {
      contentId: string;
      action: 'view' | 'like' | 'share' | 'skip' | 'report';
      duration?: number;
      timestamp: Date;
    }
  ): Promise<void> {
    const content = await this.getContentById(interaction.contentId);
    if (!content) return;
    
    // Update category preferences based on action
    const currentPreference = profile.behaviorHistory.likedCategories[content.category] || 0;
    
    switch (interaction.action) {
      case 'like':
      case 'share':
        profile.behaviorHistory.likedCategories[content.category] = Math.min(currentPreference + 0.1, 1.0);
        break;
      case 'skip':
        profile.behaviorHistory.likedCategories[content.category] = Math.max(currentPreference - 0.05, 0);
        break;
      case 'report':
        profile.behaviorHistory.likedCategories[content.category] = Math.max(currentPreference - 0.2, 0);
        break;
    }
  }

  private async getContentById(contentId: string): Promise<ContentItem | null> {
    // In a real implementation, this would fetch from a database
    // For now, return a mock content item
    return {
      id: contentId,
      title: 'Mock Content',
      description: 'Mock description',
      creatorId: 'mock-creator',
      category: 'lifestyle',
      tags: ['tag1', 'tag2'],
      contentType: 'video',
      url: 'https://example.com/content',
      thumbnailUrl: 'https://example.com/thumb',
      duration: 180,
      qualityScore: 0.8,
      engagementMetrics: {
        views: 1000,
        likes: 100,
        shares: 10,
        comments: 20
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private calculateCategoryMatch(profile: PersonalizationProfile, content: ContentItem): number {
    return profile.preferences.categories.includes(content.category) ? 0.9 : 0.1;
  }

  private calculateCreatorMatch(profile: PersonalizationProfile, content: ContentItem): number {
    return profile.preferences.creators.includes(content.creatorId) ? 0.95 : 0.2;
  }

  private calculateTrendingMatch(profile: PersonalizationProfile, content: ContentItem): number {
    const trending = this.trendingContent.find(t => t.contentId === content.id);
    return trending ? trending.trendingScore : 0.3;
  }

  private calculateEngagementMatch(profile: PersonalizationProfile, content: ContentItem): number {
    return this.normalizeEngagement(content.engagementMetrics);
  }

  private generateReasonText(factor: string, contribution: number): string {
    const intensity = contribution > 0.8 ? 'highly' : contribution > 0.6 ? 'moderately' : 'somewhat';
    
    switch (factor) {
      case 'Similar content preferences':
        return `This content is ${intensity} similar to content you've enjoyed before`;
      case 'Creator following patterns':
        return `You ${intensity} engage with content from this creator`;
      case 'Trending in your interests':
        return `This content is ${intensity} trending in your areas of interest`;
      case 'Quality score':
        return `This content has ${intensity} high quality metrics`;
      case 'Engagement similarity':
        return `This content has ${intensity} similar engagement to your preferences`;
      default:
        return `This content ${intensity} matches your preferences`;
    }
  }
}