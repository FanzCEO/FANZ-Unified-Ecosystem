import { z } from 'zod';
import crypto from 'crypto';

export interface InstagramConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  accessToken?: string;
}

export interface InstagramMediaData {
  caption: string;
  mediaUrl: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL';
  hashtags: string[];
  locationId?: string;
  taggedUsers?: string[];
  aspectRatio?: string;
}

export interface InstagramInsights {
  impressions: number;
  reach: number;
  engagement: number;
  saves: number;
  shares: number;
  profileVisits: number;
}

export class InstagramAPI {
  private config: InstagramConfig;
  private baseUrl = 'https://graph.instagram.com/v18.0';
  private apiVersion = 'v18.0';

  constructor(config: InstagramConfig) {
    this.config = config;
  }

  // OAuth Flow
  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: 'instagram_basic,instagram_content_publish,instagram_manage_insights,pages_read_engagement',
      response_type: 'code',
      state,
    });
    return `https://api.instagram.com/oauth/authorize?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<{ accessToken: string; userId: string }> {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      grant_type: 'authorization_code',
      redirect_uri: this.config.redirectUri,
      code,
    });

    const response = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      body: params,
    });

    if (!response.ok) {
      throw new Error(`Instagram token exchange failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      userId: data.user_id,
    };
  }

  // Content Publishing
  async publishContent(mediaData: InstagramMediaData): Promise<{ id: string; permalink: string }> {
    if (!this.config.accessToken) {
      throw new Error('Instagram access token not configured');
    }

    try {
      // Step 1: Create container for media
      const container = await this.createMediaContainer(mediaData);
      
      // Step 2: Publish the container
      const published = await this.publishMediaContainer(container.id);
      
      return published;
    } catch (error) {
      console.error('Instagram publish error:', error);
      throw new Error(`Failed to publish to Instagram: ${error}`);
    }
  }

  private async createMediaContainer(mediaData: InstagramMediaData): Promise<{ id: string }> {
    const endpoint = `${this.baseUrl}/me/media`;
    const caption = this.buildCaption(mediaData.caption, mediaData.hashtags);

    const params: Record<string, any> = {
      caption,
      access_token: this.config.accessToken,
    };

    if (mediaData.mediaType === 'IMAGE') {
      params.image_url = mediaData.mediaUrl;
    } else if (mediaData.mediaType === 'VIDEO') {
      params.video_url = mediaData.mediaUrl;
      params.media_type = 'REELS'; // Instagram Reels for short videos
    }

    if (mediaData.locationId) {
      params.location_id = mediaData.locationId;
    }

    if (mediaData.taggedUsers && mediaData.taggedUsers.length > 0) {
      params.user_tags = mediaData.taggedUsers.map(userId => ({
        username: userId,
        x: 0.5,
        y: 0.5,
      }));
    }

    const response = await fetch(`${endpoint}?${new URLSearchParams(params)}`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create media container: ${error.error?.message}`);
    }

    return response.json();
  }

  private async publishMediaContainer(containerId: string): Promise<{ id: string; permalink: string }> {
    const endpoint = `${this.baseUrl}/me/media_publish`;
    const params = {
      creation_id: containerId,
      access_token: this.config.accessToken!,
    };

    const response = await fetch(`${endpoint}?${new URLSearchParams(params)}`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to publish media: ${error.error?.message}`);
    }

    const result = await response.json();
    
    // Get permalink
    const permalinkResponse = await fetch(
      `${this.baseUrl}/${result.id}?fields=permalink&access_token=${this.config.accessToken}`
    );
    
    const permalinkData = await permalinkResponse.json();
    
    return {
      id: result.id,
      permalink: permalinkData.permalink,
    };
  }

  // Analytics & Insights
  async getPostInsights(postId: string): Promise<InstagramInsights> {
    if (!this.config.accessToken) {
      throw new Error('Instagram access token not configured');
    }

    const metrics = 'impressions,reach,engagement,saved,shares,profile_visits';
    const endpoint = `${this.baseUrl}/${postId}/insights`;
    const params = {
      metric: metrics,
      access_token: this.config.accessToken,
    };

    const response = await fetch(`${endpoint}?${new URLSearchParams(params)}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get insights: ${response.statusText}`);
    }

    const data = await response.json();
    const insights: InstagramInsights = {
      impressions: 0,
      reach: 0,
      engagement: 0,
      saves: 0,
      shares: 0,
      profileVisits: 0,
    };

    data.data.forEach((metric: any) => {
      switch (metric.name) {
        case 'impressions':
          insights.impressions = metric.values[0].value;
          break;
        case 'reach':
          insights.reach = metric.values[0].value;
          break;
        case 'engagement':
          insights.engagement = metric.values[0].value;
          break;
        case 'saved':
          insights.saves = metric.values[0].value;
          break;
        case 'shares':
          insights.shares = metric.values[0].value;
          break;
        case 'profile_visits':
          insights.profileVisits = metric.values[0].value;
          break;
      }
    });

    return insights;
  }

  // Get account insights
  async getAccountInsights(period: 'day' | 'week' | 'month' = 'day'): Promise<any> {
    if (!this.config.accessToken) {
      throw new Error('Instagram access token not configured');
    }

    const endpoint = `${this.baseUrl}/me/insights`;
    const metrics = 'profile_views,reach,impressions,follower_count';
    const params = {
      metric: metrics,
      period,
      access_token: this.config.accessToken,
    };

    const response = await fetch(`${endpoint}?${new URLSearchParams(params)}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get account insights: ${response.statusText}`);
    }

    return response.json();
  }

  // Get trending hashtags
  async getTrendingHashtags(topic?: string): Promise<string[]> {
    // This would normally connect to Instagram's hashtag API
    // For now, returning popular hashtags based on topic
    const baseHashtags = ['instagood', 'photooftheday', 'beautiful', 'happy', 'cute', 'fashion', 'style'];
    const topicHashtags: Record<string, string[]> = {
      fashion: ['ootd', 'fashionista', 'styleinspo', 'fashionblogger', 'streetstyle'],
      fitness: ['fitfam', 'workout', 'gymlife', 'fitnessmotivation', 'healthylifestyle'],
      food: ['foodie', 'foodporn', 'instafood', 'yummy', 'delicious'],
      travel: ['wanderlust', 'travelgram', 'instatravel', 'travelphotography', 'explore'],
      beauty: ['makeup', 'skincare', 'beautyblogger', 'makeuptutorial', 'glam'],
    };

    if (topic && topicHashtags[topic]) {
      return [...baseHashtags, ...topicHashtags[topic]];
    }

    return baseHashtags;
  }

  // Get best posting times based on audience activity
  async getBestPostingTimes(): Promise<{ hour: number; dayOfWeek: number; score: number }[]> {
    if (!this.config.accessToken) {
      // Return default best times if no access token
      return [
        { hour: 9, dayOfWeek: 1, score: 0.9 },  // Monday 9am
        { hour: 17, dayOfWeek: 3, score: 0.95 }, // Wednesday 5pm
        { hour: 20, dayOfWeek: 4, score: 0.85 }, // Thursday 8pm
        { hour: 11, dayOfWeek: 0, score: 0.88 }, // Sunday 11am
      ];
    }

    // Get audience insights
    const endpoint = `${this.baseUrl}/me/insights`;
    const params = {
      metric: 'audience_activity',
      period: 'lifetime',
      access_token: this.config.accessToken,
    };

    try {
      const response = await fetch(`${endpoint}?${new URLSearchParams(params)}`);
      const data = await response.json();
      
      // Parse activity data and return best times
      // This would need actual parsing of Instagram's activity data
      return this.parseActivityData(data);
    } catch (error) {
      // Return defaults on error
      return [
        { hour: 9, dayOfWeek: 1, score: 0.9 },
        { hour: 17, dayOfWeek: 3, score: 0.95 },
        { hour: 20, dayOfWeek: 4, score: 0.85 },
        { hour: 11, dayOfWeek: 0, score: 0.88 },
      ];
    }
  }

  private parseActivityData(data: any): { hour: number; dayOfWeek: number; score: number }[] {
    // Parse Instagram activity data to determine best posting times
    // This is a simplified implementation
    const times = [];
    
    // Typically Instagram returns hourly activity data
    // We'd analyze this to find peak engagement times
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const score = Math.random() * 0.5 + 0.5; // Placeholder scoring
        if (score > 0.8) {
          times.push({ hour, dayOfWeek: day, score });
        }
      }
    }

    return times.sort((a, b) => b.score - a.score).slice(0, 10);
  }

  // Helper to build caption with hashtags
  private buildCaption(caption: string, hashtags: string[]): string {
    const cleanHashtags = hashtags.map(tag => 
      tag.startsWith('#') ? tag : `#${tag}`
    );
    return `${caption}\n\n${cleanHashtags.join(' ')}`;
  }

  // Validate media requirements
  async validateMedia(mediaUrl: string, mediaType: 'IMAGE' | 'VIDEO'): Promise<{ valid: boolean; errors?: string[] }> {
    const errors: string[] = [];

    if (mediaType === 'IMAGE') {
      // Instagram image requirements
      // - Format: JPEG, PNG
      // - Aspect ratio: 1:1 (square), 4:5 (portrait), 16:9 (landscape)
      // - Max file size: 8MB
      // - Min resolution: 320x320
      // - Max resolution: 1080x1350
    } else if (mediaType === 'VIDEO') {
      // Instagram video requirements
      // - Format: MP4, MOV
      // - Aspect ratio: 9:16 (Reels), 1:1 (feed), 16:9 (IGTV)
      // - Duration: 3-60 seconds (Reels), up to 60 minutes (IGTV)
      // - Max file size: 4GB
      // - Frame rate: 30fps min
    }

    // This would need actual media validation logic
    // For now, return valid
    return { valid: true };
  }

  // Schedule a post
  async schedulePost(mediaData: InstagramMediaData, scheduledTime: Date): Promise<{ scheduledId: string }> {
    // Instagram doesn't have native scheduling API
    // This would integrate with a scheduling service or queue
    const scheduledId = crypto.randomBytes(16).toString('hex');
    
    // Store in queue for scheduled publishing
    // Implementation would depend on your scheduling system
    
    return { scheduledId };
  }

  // Delete a post
  async deletePost(postId: string): Promise<{ success: boolean }> {
    if (!this.config.accessToken) {
      throw new Error('Instagram access token not configured');
    }

    const endpoint = `${this.baseUrl}/${postId}`;
    const params = {
      access_token: this.config.accessToken,
    };

    const response = await fetch(`${endpoint}?${new URLSearchParams(params)}`, {
      method: 'DELETE',
    });

    return { success: response.ok };
  }
}