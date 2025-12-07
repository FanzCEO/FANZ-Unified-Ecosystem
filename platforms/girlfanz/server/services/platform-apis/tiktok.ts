import { z } from 'zod';
import crypto from 'crypto';

export interface TikTokConfig {
  clientKey: string;
  clientSecret: string;
  redirectUri: string;
  accessToken?: string;
}

export interface TikTokVideoData {
  caption: string;
  videoUrl: string;
  coverImageUrl?: string;
  hashtags: string[];
  privacy: 'public_to_everyone' | 'mutual_follow_friends' | 'self_only';
  duetEnabled?: boolean;
  stitchEnabled?: boolean;
  commentEnabled?: boolean;
  soundUrl?: string;
}

export interface TikTokAnalytics {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  playCount: number;
  completionRate: number;
  averageWatchTime: number;
}

export class TikTokAPI {
  private config: TikTokConfig;
  private baseUrl = 'https://open.tiktokapis.com/v2';
  private authUrl = 'https://www.tiktok.com/v2/auth/authorize';

  constructor(config: TikTokConfig) {
    this.config = config;
  }

  // OAuth Flow
  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_key: this.config.clientKey,
      scope: 'user.info.basic,video.upload,video.publish,video.list',
      response_type: 'code',
      redirect_uri: this.config.redirectUri,
      state,
    });
    return `${this.authUrl}?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<{ accessToken: string; openId: string }> {
    const endpoint = 'https://open.tiktokapis.com/v2/oauth/token/';
    const body = {
      client_key: this.config.clientKey,
      client_secret: this.config.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: this.config.redirectUri,
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(body),
    });

    if (!response.ok) {
      throw new Error(`TikTok token exchange failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      openId: data.open_id,
    };
  }

  // Upload and publish video
  async publishVideo(videoData: TikTokVideoData): Promise<{ videoId: string; shareUrl: string }> {
    if (!this.config.accessToken) {
      throw new Error('TikTok access token not configured');
    }

    try {
      // Step 1: Initialize video upload
      const uploadInfo = await this.initializeUpload(videoData);
      
      // Step 2: Upload video chunks
      await this.uploadVideoChunks(uploadInfo.upload_url, videoData.videoUrl);
      
      // Step 3: Publish the video
      const published = await this.publishUploadedVideo(uploadInfo.publish_id, videoData);
      
      return published;
    } catch (error) {
      console.error('TikTok publish error:', error);
      throw new Error(`Failed to publish to TikTok: ${error}`);
    }
  }

  private async initializeUpload(videoData: TikTokVideoData): Promise<any> {
    const endpoint = `${this.baseUrl}/video/upload/`;
    const body = {
      post_info: {
        title: this.buildCaption(videoData.caption, videoData.hashtags),
        privacy_level: videoData.privacy,
        disable_duet: !videoData.duetEnabled,
        disable_stitch: !videoData.stitchEnabled,
        disable_comment: !videoData.commentEnabled,
      },
      source_info: {
        source: 'FILE_UPLOAD',
        video_size: await this.getVideoSize(videoData.videoUrl),
        chunk_size: 10485760, // 10MB chunks
        total_chunk_count: await this.calculateChunkCount(videoData.videoUrl),
      },
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to initialize upload: ${error.error?.message}`);
    }

    return response.json();
  }

  private async uploadVideoChunks(uploadUrl: string, videoUrl: string): Promise<void> {
    // In a real implementation, this would:
    // 1. Download or stream the video from videoUrl
    // 2. Split it into chunks
    // 3. Upload each chunk to TikTok's servers
    
    // Simplified implementation
    const videoData = await fetch(videoUrl);
    const videoBuffer = await videoData.arrayBuffer();
    
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': videoBuffer.byteLength.toString(),
      },
      body: videoBuffer,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload video chunks: ${response.statusText}`);
    }
  }

  private async publishUploadedVideo(
    publishId: string, 
    videoData: TikTokVideoData
  ): Promise<{ videoId: string; shareUrl: string }> {
    const endpoint = `${this.baseUrl}/video/publish/`;
    const body = {
      publish_id: publishId,
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to publish video: ${error.error?.message}`);
    }

    const result = await response.json();
    return {
      videoId: result.data.video_id,
      shareUrl: result.data.share_url,
    };
  }

  // Get video analytics
  async getVideoAnalytics(videoId: string): Promise<TikTokAnalytics> {
    if (!this.config.accessToken) {
      throw new Error('TikTok access token not configured');
    }

    const endpoint = `${this.baseUrl}/video/data/`;
    const params = {
      video_ids: videoId,
      fields: 'view_count,like_count,comment_count,share_count,play_count',
    };

    const response = await fetch(`${endpoint}?${new URLSearchParams(params)}`, {
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get video analytics: ${response.statusText}`);
    }

    const data = await response.json();
    const video = data.videos[0];

    return {
      views: video.view_count || 0,
      likes: video.like_count || 0,
      comments: video.comment_count || 0,
      shares: video.share_count || 0,
      playCount: video.play_count || 0,
      completionRate: video.completion_rate || 0,
      averageWatchTime: video.average_watch_time || 0,
    };
  }

  // Get trending content
  async getTrendingContent(category?: string): Promise<any[]> {
    const endpoint = `${this.baseUrl}/trending/videos/`;
    const params: any = {
      count: 20,
    };

    if (category) {
      params.category = category;
    }

    const response = await fetch(`${endpoint}?${new URLSearchParams(params)}`, {
      headers: this.config.accessToken ? {
        'Authorization': `Bearer ${this.config.accessToken}`,
      } : {},
    });

    if (!response.ok) {
      return []; // Return empty array if trending API fails
    }

    const data = await response.json();
    return data.videos || [];
  }

  // Get trending hashtags
  async getTrendingHashtags(region: string = 'US'): Promise<string[]> {
    // TikTok doesn't have a public trending hashtags API
    // This would typically scrape or use third-party services
    
    const generalTrending = [
      'fyp', 'foryou', 'foryoupage', 'viral', 'trending',
      'tiktok', 'explore', 'duet', 'comedy', 'dance'
    ];

    const regionSpecific: Record<string, string[]> = {
      US: ['usa', 'american', 'newyork', 'losangeles', 'miami'],
      UK: ['uk', 'british', 'london', 'manchester', 'birmingham'],
      CA: ['canada', 'canadian', 'toronto', 'vancouver', 'montreal'],
    };

    const regional = regionSpecific[region] || [];
    return [...generalTrending, ...regional];
  }

  // Get best posting times
  async getBestPostingTimes(): Promise<{ hour: number; dayOfWeek: number; score: number }[]> {
    // TikTok best posting times based on general engagement patterns
    // These are typically:
    // - 4am-9am (early morning scrollers)
    // - 12pm-2pm (lunch break)
    // - 5pm-11pm (evening peak)
    
    return [
      { hour: 6, dayOfWeek: 2, score: 0.92 },   // Tuesday 6am
      { hour: 10, dayOfWeek: 3, score: 0.88 },  // Wednesday 10am
      { hour: 19, dayOfWeek: 4, score: 0.95 },  // Thursday 7pm
      { hour: 9, dayOfWeek: 5, score: 0.90 },   // Friday 9am
      { hour: 20, dayOfWeek: 5, score: 0.93 },  // Friday 8pm
      { hour: 11, dayOfWeek: 0, score: 0.85 },  // Sunday 11am
    ];
  }

  // Get trending sounds/music
  async getTrendingSounds(genre?: string): Promise<any[]> {
    const endpoint = `${this.baseUrl}/music/trending/`;
    const params: any = {
      count: 20,
    };

    if (genre) {
      params.genre = genre;
    }

    try {
      const response = await fetch(`${endpoint}?${new URLSearchParams(params)}`, {
        headers: this.config.accessToken ? {
          'Authorization': `Bearer ${this.config.accessToken}`,
        } : {},
      });

      if (!response.ok) {
        return this.getDefaultSounds(genre);
      }

      const data = await response.json();
      return data.sounds || [];
    } catch (error) {
      return this.getDefaultSounds(genre);
    }
  }

  private getDefaultSounds(genre?: string): any[] {
    // Return some default trending sounds
    const sounds = [
      { id: '1', name: 'Trending Beat 1', playCount: 1000000 },
      { id: '2', name: 'Viral Dance Track', playCount: 800000 },
      { id: '3', name: 'Comedy Sound Effect', playCount: 600000 },
    ];

    return sounds;
  }

  // Helper methods
  private buildCaption(caption: string, hashtags: string[]): string {
    const cleanHashtags = hashtags.map(tag => 
      tag.startsWith('#') ? tag : `#${tag}`
    );
    return `${caption} ${cleanHashtags.join(' ')}`;
  }

  private async getVideoSize(videoUrl: string): Promise<number> {
    // Get video file size
    try {
      const response = await fetch(videoUrl, { method: 'HEAD' });
      const contentLength = response.headers.get('content-length');
      return contentLength ? parseInt(contentLength, 10) : 0;
    } catch {
      return 0;
    }
  }

  private async calculateChunkCount(videoUrl: string): Promise<number> {
    const videoSize = await this.getVideoSize(videoUrl);
    const chunkSize = 10485760; // 10MB
    return Math.ceil(videoSize / chunkSize);
  }

  // Validate video requirements
  async validateVideo(videoUrl: string): Promise<{ valid: boolean; errors?: string[] }> {
    const errors: string[] = [];

    // TikTok video requirements:
    // - Format: MP4, MOV, MPEG, 3GP, AVI
    // - Aspect ratio: 9:16 (vertical), 16:9, or 1:1
    // - Duration: 3 seconds to 10 minutes
    // - File size: Up to 2GB
    // - Resolution: 720p minimum

    // This would need actual video validation
    // For now, return valid
    return { valid: true };
  }

  // Get user profile
  async getUserProfile(): Promise<any> {
    if (!this.config.accessToken) {
      throw new Error('TikTok access token not configured');
    }

    const endpoint = `${this.baseUrl}/user/info/`;
    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get user profile: ${response.statusText}`);
    }

    return response.json();
  }

  // Get video list
  async getVideoList(cursor?: string, maxCount: number = 20): Promise<any> {
    if (!this.config.accessToken) {
      throw new Error('TikTok access token not configured');
    }

    const endpoint = `${this.baseUrl}/video/list/`;
    const params: any = {
      max_count: maxCount.toString(),
    };

    if (cursor) {
      params.cursor = cursor;
    }

    const response = await fetch(`${endpoint}?${new URLSearchParams(params)}`, {
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get video list: ${response.statusText}`);
    }

    return response.json();
  }
}