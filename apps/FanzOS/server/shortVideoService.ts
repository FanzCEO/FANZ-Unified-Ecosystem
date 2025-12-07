import { storage } from './storage';
import { mediaService, MediaType } from './mediaService';
import { smsService, SMSMessageType } from './smsService';
import { aiAssistantService, AIRequestType, AIAssistantType } from './aiAssistantService';
import type { 
  ShortVideo, 
  InsertShortVideo, 
  VideoEffect,
  InsertVideoEffect,
  Hashtag,
  ShortVideoReaction,
  ShortVideoView,
  AlgorithmPreferences
} from '@shared/schema';
import crypto from 'crypto';

export enum FeedType {
  FOR_YOU = 'for_you',
  FOLLOWING = 'following',
  TRENDING = 'trending',
  HASHTAG = 'hashtag',
  CREATOR = 'creator',
  LIKED = 'liked'
}

export enum VideoOrientation {
  PORTRAIT = 'portrait',
  LANDSCAPE = 'landscape',
  SQUARE = 'square'
}

export interface ShortVideoUploadRequest {
  videoFile: File | string; // File object or URL
  title?: string;
  description?: string;
  hashtags?: string[];
  isPublic?: boolean;
  allowComments?: boolean;
  allowDuets?: boolean;
  allowRemix?: boolean;
  scheduleAt?: Date;
}

export interface VideoEditingData {
  effects: VideoEffectData[];
  audio?: {
    trackId: string;
    startTime: number;
    volume: number;
  };
  filters?: {
    filterId: string;
    intensity: number;
  }[];
  text?: {
    content: string;
    x: number;
    y: number;
    fontSize: number;
    color: string;
    startTime: number;
    endTime: number;
  }[];
  transitions?: {
    type: string;
    duration: number;
    position: number;
  }[];
}

export interface VideoEffectData {
  effectId: string;
  effectType: 'filter' | 'overlay' | 'transition' | 'text' | 'sticker' | 'music' | 'speed';
  effectName: string;
  startTime: number;
  endTime: number;
  intensity: number;
  parameters: Record<string, any>;
  layerOrder: number;
}

export interface ShortVideoFeedItem extends ShortVideo {
  creator: {
    id: string;
    username: string;
    displayName: string;
    profileImageUrl: string;
    isVerified: boolean;
  };
  hashtags: Hashtag[];
  userReaction?: string;
  isFollowing: boolean;
  isLiked: boolean;
  watchProgress?: number;
}

export interface FeedRequest {
  type: FeedType;
  userId: string;
  page?: number;
  limit?: number;
  hashtag?: string;
  creatorId?: string;
  lastVideoId?: string;
}

export interface TrendingHashtag {
  hashtag: Hashtag;
  recentVideosCount: number;
  growthRate: number;
  engagement: number;
}

export interface VideoAnalytics {
  videoId: string;
  totalViews: number;
  uniqueViews: number;
  avgWatchTime: number;
  completionRate: number;
  engagementRate: number;
  demographics: {
    ageGroups: Record<string, number>;
    genderDistribution: Record<string, number>;
    topCountries: Record<string, number>;
  };
  hourlyViews: { hour: number; views: number }[];
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    reactions: Record<string, number>;
  };
}

export class ShortVideoService {
  private videoCache: Map<string, ShortVideo> = new Map();
  private effectsLibrary: Map<string, VideoEffectData> = new Map();

  constructor() {
    this.initializeEffectsLibrary();
  }

  // Upload and process short video
  async uploadShortVideo(
    userId: string, 
    uploadRequest: ShortVideoUploadRequest,
    editingData?: VideoEditingData
  ): Promise<{ videoId: string; processingJobId: string }> {
    try {
      const videoId = crypto.randomUUID();
      
      // Upload video to media service
      let videoUrl: string;
      if (typeof uploadRequest.videoFile === 'string') {
        videoUrl = uploadRequest.videoFile;
      } else {
        const uploadResult = await mediaService.generateUploadUrl(
          userId,
          'short_video.mp4',
          'video/mp4',
          MediaType.VIDEO
        );
        videoUrl = uploadResult.uploadUrl;
      }

      // Process hashtags
      const hashtagIds = await this.processHashtags(uploadRequest.hashtags || []);

      // Create video record
      const shortVideo: InsertShortVideo = {
        creatorId: userId,
        title: uploadRequest.title || null,
        description: uploadRequest.description || null,
        videoUrl,
        thumbnailUrl: await this.generateThumbnail(videoUrl),
        duration: 60, // Default, will be updated after processing
        isPublic: uploadRequest.isPublic ?? true,
        allowComments: uploadRequest.allowComments ?? true,
        allowDuets: uploadRequest.allowDuets ?? true,
        allowRemix: uploadRequest.allowRemix ?? true,
        status: 'processing'
      };

      // Store video in database
      const savedVideo = await this.saveShortVideo(shortVideo);
      const actualVideoId = savedVideo.id;

      // Link hashtags to video
      for (const hashtagId of hashtagIds) {
        await storage.linkHashtagToVideo(actualVideoId, hashtagId);
      }

      // Apply effects if provided
      if (editingData?.effects) {
        await this.applyVideoEffects(actualVideoId, editingData.effects);
      }

      // Schedule publication if specified
      if (uploadRequest.scheduleAt) {
        await this.schedulePublication(videoId, uploadRequest.scheduleAt);
      }

      // Start AI-powered optimization
      await this.optimizeForAlgorithm(videoId, userId);

      return {
        videoId: actualVideoId,
        processingJobId: `proc_${actualVideoId}`
      };

    } catch (error) {
      console.error('Short video upload failed:', error);
      throw error;
    }
  }

  // Get personalized feed
  async getFeed(request: FeedRequest): Promise<ShortVideoFeedItem[]> {
    try {
      switch (request.type) {
        case FeedType.FOR_YOU:
          return await this.getForYouFeed(request.userId, request.page, request.limit);
        case FeedType.FOLLOWING:
          return await this.getFollowingFeed(request.userId, request.page, request.limit);
        case FeedType.TRENDING:
          return await this.getTrendingFeed(request.page, request.limit);
        case FeedType.HASHTAG:
          return await this.getHashtagFeed(request.hashtag!, request.page, request.limit);
        case FeedType.CREATOR:
          return await this.getCreatorFeed(request.creatorId!, request.page, request.limit);
        case FeedType.LIKED:
          return await this.getLikedFeed(request.userId, request.page, request.limit);
        default:
          return [];
      }
    } catch (error) {
      console.error('Feed generation failed:', error);
      return [];
    }
  }

  // React to video (like, love, fire, etc.)
  async reactToVideo(userId: string, videoId: string, reactionType: string): Promise<boolean> {
    try {
      // Add reaction to database
      await storage.addVideoReaction(userId, videoId, reactionType);

      // Update video engagement score
      await this.updateEngagementScore(videoId);

      // Update algorithm preferences
      await this.updateUserPreferences(userId, { videoLiked: videoId, reactionType });

      // Send notification to creator if it's a strong reaction
      if (['love', 'fire', 'heart_eyes'].includes(reactionType)) {
        await this.notifyCreator(videoId, userId, reactionType);
      }

      return true;
    } catch (error) {
      console.error('Video reaction failed:', error);
      return false;
    }
  }

  // Track video view
  async trackView(
    userId: string | null, 
    videoId: string, 
    watchTime: number,
    deviceInfo?: { type: string; userAgent: string; ipAddress?: string }
  ): Promise<void> {
    try {
      const view = {
        userId,
        shortVideoId: videoId,
        watchTime,
        completedView: watchTime >= 3, // Consider 3+ seconds a completed view
        deviceType: deviceInfo?.type || 'unknown',
        userAgent: deviceInfo?.userAgent || null,
        ipAddress: deviceInfo?.ipAddress || null,
        referrer: null
      };

      // Store view in database
      await storage.trackVideoView(view);

      // Update algorithm preferences if user is logged in
      if (userId) {
        await this.updateUserPreferences(userId, { 
          videoWatched: videoId, 
          watchTime,
          completedView: view.completedView 
        });
      }

    } catch (error) {
      console.error('View tracking failed:', error);
    }
  }

  // Get trending hashtags
  async getTrendingHashtags(limit: number = 10): Promise<TrendingHashtag[]> {
    // Get trending hashtags from database
    const trendingHashtags = await storage.getTrendingHashtags(limit);
    
    // Calculate additional metrics
    const result: TrendingHashtag[] = [];
    for (const hashtag of trendingHashtags) {
      // In production, would calculate these from actual video data
      result.push({
        hashtag,
        recentVideosCount: Math.floor((hashtag.usageCount || 0) * 0.08), // Estimate recent usage
        growthRate: parseFloat(hashtag.trendingScore || '0') * 1.3, // Derive from trending score
        engagement: parseFloat(hashtag.trendingScore || '0') / 10 // Simplified engagement metric
      });
    }
    
    return result;
  }

  // Get video analytics
  async getVideoAnalytics(videoId: string, creatorId: string): Promise<VideoAnalytics> {
    // Mock analytics (in real implementation, would aggregate from database)
    return {
      videoId,
      totalViews: 12540,
      uniqueViews: 10230,
      avgWatchTime: 28.5,
      completionRate: 0.73,
      engagementRate: 0.087,
      demographics: {
        ageGroups: { '18-24': 45, '25-34': 35, '35-44': 15, '45+': 5 },
        genderDistribution: { 'male': 60, 'female': 35, 'other': 5 },
        topCountries: { 'US': 40, 'UK': 15, 'CA': 12, 'AU': 8, 'DE': 7 }
      },
      hourlyViews: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        views: Math.floor(Math.random() * 1000) + 100
      })),
      engagement: {
        likes: 1820,
        comments: 340,
        shares: 125,
        reactions: { 'fire': 450, 'love': 380, 'like': 990 }
      }
    };
  }

  // AI-powered content suggestions
  async getContentSuggestions(userId: string): Promise<string[]> {
    try {
      const request = await aiAssistantService.processAIRequest({
        userId,
        type: AIRequestType.CONTENT_GENERATION,
        assistantType: AIAssistantType.CONTENT_CREATOR,
        prompt: 'Generate 5 trending short video content ideas for adult content creators'
      });

      if (request.response) {
        // Parse AI response and return suggestions
        return request.response.split('\n').filter(line => line.trim().length > 0);
      }

      return this.getDefaultContentSuggestions();
    } catch (error) {
      return this.getDefaultContentSuggestions();
    }
  }

  // Private helper methods
  private async getForYouFeed(userId: string, page: number = 0, limit: number = 20): Promise<ShortVideoFeedItem[]> {
    // Mock personalized feed based on algorithm preferences
    return this.generateMockFeed(limit, 'for_you');
  }

  private async getFollowingFeed(userId: string, page: number = 0, limit: number = 20): Promise<ShortVideoFeedItem[]> {
    return this.generateMockFeed(limit, 'following');
  }

  private async getTrendingFeed(page: number = 0, limit: number = 20): Promise<ShortVideoFeedItem[]> {
    return this.generateMockFeed(limit, 'trending');
  }

  private async getHashtagFeed(hashtag: string, page: number = 0, limit: number = 20): Promise<ShortVideoFeedItem[]> {
    return this.generateMockFeed(limit, 'hashtag');
  }

  private async getCreatorFeed(creatorId: string, page: number = 0, limit: number = 20): Promise<ShortVideoFeedItem[]> {
    return this.generateMockFeed(limit, 'creator');
  }

  private async getLikedFeed(userId: string, page: number = 0, limit: number = 20): Promise<ShortVideoFeedItem[]> {
    return this.generateMockFeed(limit, 'liked');
  }

  private generateMockFeed(limit: number, type: string): ShortVideoFeedItem[] {
    return Array.from({ length: limit }, (_, i) => ({
      id: `video_${i + 1}`,
      creatorId: `creator_${(i % 5) + 1}`,
      title: `Amazing Content ${i + 1}`,
      description: `This is some incredible content that you'll love! #viral #trending`,
      videoUrl: `https://example.com/video_${i + 1}.mp4`,
      thumbnailUrl: `https://example.com/thumb_${i + 1}.jpg`,
      duration: Math.floor(Math.random() * 50) + 15,
      aspectRatio: '9:16',
      resolution: '1080x1920',
      fileSize: Math.floor(Math.random() * 50000000) + 5000000,
      status: 'published' as const,
      isPublic: true,
      allowComments: true,
      allowDuets: true,
      allowRemix: true,
      viewsCount: Math.floor(Math.random() * 100000) + 1000,
      likesCount: Math.floor(Math.random() * 10000) + 100,
      commentsCount: Math.floor(Math.random() * 1000) + 10,
      sharesCount: Math.floor(Math.random() * 500) + 5,
      engagementScore: (Math.random() * 10).toFixed(2),
      algorithmBoost: (Math.random() * 2).toFixed(2),
      createdAt: new Date(Date.now() - Math.random() * 86400000 * 7),
      publishedAt: new Date(Date.now() - Math.random() * 86400000 * 7),
      updatedAt: new Date(),
      creator: {
        id: `creator_${(i % 5) + 1}`,
        username: `creator${(i % 5) + 1}`,
        displayName: `Amazing Creator ${(i % 5) + 1}`,
        profileImageUrl: `https://example.com/avatar_${(i % 5) + 1}.jpg`,
        isVerified: Math.random() > 0.7
      },
      hashtags: [
        { id: '1', name: 'viral', category: 'trending' as const, usageCount: 1000, trendingScore: '95.00', isBlocked: false, createdAt: new Date(), lastUsed: new Date() },
        { id: '2', name: 'foryou', category: 'trending' as const, usageCount: 2000, trendingScore: '98.00', isBlocked: false, createdAt: new Date(), lastUsed: new Date() }
      ],
      userReaction: Math.random() > 0.8 ? ['like', 'love', 'fire'][Math.floor(Math.random() * 3)] : undefined,
      isFollowing: Math.random() > 0.6,
      isLiked: Math.random() > 0.7,
      watchProgress: Math.random()
    }));
  }

  private async processHashtags(hashtags: string[]): Promise<string[]> {
    const hashtagIds: string[] = [];
    
    for (const hashtag of hashtags) {
      const cleanTag = hashtag.replace('#', '').toLowerCase();
      // Find or create hashtag in database
      let dbHashtag = await storage.getHashtagByName(cleanTag);
      if (!dbHashtag) {
        dbHashtag = await storage.createHashtag(cleanTag, 'other');
      }
      hashtagIds.push(dbHashtag.id);
    }

    return hashtagIds;
  }

  private async generateThumbnail(videoUrl: string): Promise<string> {
    // In real implementation, would extract frame from video
    return videoUrl.replace('.mp4', '_thumb.jpg');
  }

  private async saveShortVideo(video: InsertShortVideo): Promise<ShortVideo> {
    // Save to database
    const videoToSave = {
      ...video,
      aspectRatio: video.aspectRatio || '9:16',
      resolution: video.resolution || '1080x1920'
    };
    const saved = await storage.createShortVideo(videoToSave);
    this.videoCache.set(saved.id, saved);
    return saved;
  }

  private async applyVideoEffects(videoId: string, effects: VideoEffectData[]): Promise<void> {
    // Store effects in database
    for (const effect of effects) {
      await storage.addVideoEffect({
        shortVideoId: videoId,
        effectType: effect.effectType as any,
        effectId: effect.effectId,
        effectName: effect.effectName,
        startTime: effect.startTime.toFixed(3),
        endTime: effect.endTime.toFixed(3),
        intensity: effect.intensity.toFixed(2),
        parameters: effect.parameters,
        layerOrder: effect.layerOrder
      });
    }
  }

  private async schedulePublication(videoId: string, publishAt: Date): Promise<void> {
    // In real implementation, would use job queue
    console.log(`Video ${videoId} scheduled for publication at ${publishAt}`);
  }

  private async optimizeForAlgorithm(videoId: string, userId: string): Promise<void> {
    try {
      await aiAssistantService.processAIRequest({
        userId,
        type: AIRequestType.CONTENT_OPTIMIZATION,
        assistantType: AIAssistantType.CONTENT_CREATOR,
        prompt: `Optimize short video ${videoId} for maximum reach and engagement`
      });
    } catch (error) {
      console.warn('Algorithm optimization failed:', error);
    }
  }

  private async removeReaction(userId: string, videoId: string): Promise<void> {
    await storage.removeVideoReaction(userId, videoId);
  }

  private async updateEngagementScore(videoId: string): Promise<void> {
    // Get video stats
    const video = await storage.getShortVideo(videoId);
    if (!video) return;
    
    const reactions = await storage.getVideoReactions(videoId);
    const viewCount = await storage.getVideoViewCount(videoId);
    
    // Calculate engagement score (reactions + comments + shares) / views * 100
    const engagementRate = viewCount > 0 
      ? ((reactions.length + (video.commentsCount || 0) + (video.sharesCount || 0)) / viewCount * 100)
      : 0;
    
    await storage.updateShortVideo(videoId, {
      engagementScore: engagementRate.toFixed(2)
    });
  }

  private async updateUserPreferences(userId: string, activity: Record<string, any>): Promise<void> {
    // Update algorithm preferences based on user activity
    const currentPrefs = await storage.getAlgorithmPreferences(userId);
    
    // Build updated preferences based on activity
    const updates: any = {
      lastUpdated: new Date()
    };
    
    if (activity.videoLiked) {
      // Update interaction weights and affinities
      const interactionWeights = (currentPrefs?.interactionWeights as any) || {};
      interactionWeights[activity.reactionType] = (interactionWeights[activity.reactionType] || 0) + 1;
      updates.interactionWeights = interactionWeights;
    }
    
    await storage.updateAlgorithmPreferences(userId, updates);
  }

  private async notifyCreator(videoId: string, fanUserId: string, reactionType: string): Promise<void> {
    try {
      // Get video and creator info (mock)
      const video = this.videoCache.get(videoId);
      if (!video) return;

      const creator = await storage.getUser(video.creatorId);
      const fan = await storage.getUser(fanUserId);
      
      if (creator && fan) {
        // Send SMS notification (if creator has opted in)
        await smsService.sendSMS({
          to: '+1234567890', // Would get from creator profile
          type: SMSMessageType.NEW_MESSAGE,
          variables: {
            senderName: fan.displayName || fan.firstName || 'A fan',
            message: `reacted with ${reactionType} to your video!`
          }
        });
      }
    } catch (error) {
      console.warn('Creator notification failed:', error);
    }
  }

  private async incrementViewCount(videoId: string): Promise<void> {
    await storage.incrementShortVideoViews(videoId);
    
    // Update cache if exists
    const video = this.videoCache.get(videoId);
    if (video) {
      video.viewsCount = (video.viewsCount || 0) + 1;
      this.videoCache.set(videoId, video);
    }
  }

  private initializeEffectsLibrary(): void {
    // Initialize with popular TikTok-style effects
    const effects = [
      { effectId: 'beauty_1', effectType: 'filter' as const, effectName: 'Beauty Filter', startTime: 0, endTime: 60, intensity: 0.7, parameters: { smoothing: 0.8, brightening: 0.3 }, layerOrder: 1 },
      { effectId: 'vintage_1', effectType: 'filter' as const, effectName: 'Vintage', startTime: 0, endTime: 60, intensity: 0.8, parameters: { sepia: 0.6, vignette: 0.4 }, layerOrder: 1 },
      { effectId: 'speed_2x', effectType: 'speed' as const, effectName: '2x Speed', startTime: 0, endTime: 30, intensity: 2.0, parameters: { multiplier: 2.0 }, layerOrder: 0 },
      { effectId: 'slow_motion', effectType: 'speed' as const, effectName: 'Slow Motion', startTime: 0, endTime: 120, intensity: 0.5, parameters: { multiplier: 0.5 }, layerOrder: 0 }
    ];

    for (const effect of effects) {
      this.effectsLibrary.set(effect.effectId, effect);
    }
  }

  private getDefaultContentSuggestions(): string[] {
    return [
      'Behind-the-scenes content creation',
      'Day in my life as a creator',
      'Q&A with your top fans',
      'Transformation or makeover content',
      'Dancing or choreography videos',
      'Cooking or lifestyle content',
      'Workout or fitness routines',
      'Artistic or creative process videos'
    ];
  }
}

export const shortVideoService = new ShortVideoService();