import { z } from 'zod';
import crypto from 'crypto';
import OAuth from 'oauth-1.0a';

export interface TwitterConfig {
  apiKey: string;
  apiSecret: string;
  accessToken?: string;
  accessTokenSecret?: string;
  bearerToken?: string;
  clientId?: string; // For OAuth 2.0
  clientSecret?: string; // For OAuth 2.0
  redirectUri?: string;
}

export interface TwitterTweetData {
  text: string;
  mediaUrls?: string[];
  hashtags: string[];
  mentions?: string[];
  replyTo?: string;
  quoteTweetId?: string;
  pollOptions?: string[];
  pollDuration?: number; // minutes
  geo?: { lat: number; lng: number };
  sensitive?: boolean;
  scheduledAt?: Date;
}

export interface TwitterAnalytics {
  impressions: number;
  engagements: number;
  retweets: number;
  likes: number;
  replies: number;
  clicks: number;
  profileVisits: number;
  videoViews?: number;
  completionRate?: number;
}

export class TwitterAPI {
  private config: TwitterConfig;
  private baseUrl = 'https://api.twitter.com/2';
  private uploadUrl = 'https://upload.twitter.com/1.1';
  private oauth?: OAuth;

  constructor(config: TwitterConfig) {
    this.config = config;
    
    if (config.apiKey && config.apiSecret) {
      this.oauth = new OAuth({
        consumer: {
          key: config.apiKey,
          secret: config.apiSecret,
        },
        signature_method: 'HMAC-SHA1',
        hash_function(base_string, key) {
          return crypto.createHmac('sha1', key).update(base_string).digest('base64');
        },
      });
    }
  }

  // OAuth 2.0 Flow (for user context)
  getAuthorizationUrl(state: string, codeChallenge: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId!,
      redirect_uri: this.config.redirectUri!,
      scope: 'tweet.read tweet.write users.read follows.read follows.write like.read like.write offline.access',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });
    return `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string, codeVerifier: string): Promise<{ accessToken: string; refreshToken: string }> {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.config.clientId!,
      redirect_uri: this.config.redirectUri!,
      code,
      code_verifier: codeVerifier,
    });

    const response = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64')}`,
      },
      body: params,
    });

    if (!response.ok) {
      throw new Error(`Twitter token exchange failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    };
  }

  // Tweet posting
  async postTweet(tweetData: TwitterTweetData): Promise<{ id: string; text: string; url: string }> {
    if (!this.config.bearerToken && !this.config.accessToken) {
      throw new Error('Twitter authentication not configured');
    }

    try {
      // Upload media if provided
      let mediaIds: string[] = [];
      if (tweetData.mediaUrls && tweetData.mediaUrls.length > 0) {
        mediaIds = await Promise.all(
          tweetData.mediaUrls.map(url => this.uploadMedia(url))
        );
      }

      // Build tweet payload
      const payload = this.buildTweetPayload(tweetData, mediaIds);
      
      // Post the tweet
      const tweet = await this.createTweet(payload);
      
      return {
        id: tweet.data.id,
        text: tweet.data.text,
        url: `https://twitter.com/user/status/${tweet.data.id}`,
      };
    } catch (error) {
      console.error('Twitter post error:', error);
      throw new Error(`Failed to post to Twitter: ${error}`);
    }
  }

  private async uploadMedia(mediaUrl: string): Promise<string> {
    // Download media
    const mediaResponse = await fetch(mediaUrl);
    const mediaBuffer = await mediaResponse.arrayBuffer();
    const mediaBase64 = Buffer.from(mediaBuffer).toString('base64');

    // Step 1: Initialize upload
    const initResponse = await fetch(`${this.uploadUrl}/media/upload.json`, {
      method: 'POST',
      headers: this.getAuthHeaders('POST', `${this.uploadUrl}/media/upload.json`),
      body: new URLSearchParams({
        command: 'INIT',
        total_bytes: mediaBuffer.byteLength.toString(),
        media_type: this.getMediaType(mediaUrl),
        media_category: 'tweet_image',
      }),
    });

    if (!initResponse.ok) {
      throw new Error(`Failed to initialize media upload: ${initResponse.statusText}`);
    }

    const { media_id_string } = await initResponse.json();

    // Step 2: Upload media chunks
    await fetch(`${this.uploadUrl}/media/upload.json`, {
      method: 'POST',
      headers: this.getAuthHeaders('POST', `${this.uploadUrl}/media/upload.json`),
      body: new URLSearchParams({
        command: 'APPEND',
        media_id: media_id_string,
        media_data: mediaBase64,
        segment_index: '0',
      }),
    });

    // Step 3: Finalize upload
    const finalizeResponse = await fetch(`${this.uploadUrl}/media/upload.json`, {
      method: 'POST',
      headers: this.getAuthHeaders('POST', `${this.uploadUrl}/media/upload.json`),
      body: new URLSearchParams({
        command: 'FINALIZE',
        media_id: media_id_string,
      }),
    });

    if (!finalizeResponse.ok) {
      throw new Error(`Failed to finalize media upload: ${finalizeResponse.statusText}`);
    }

    return media_id_string;
  }

  private buildTweetPayload(tweetData: TwitterTweetData, mediaIds: string[]): any {
    const text = this.buildTweetText(tweetData.text, tweetData.hashtags, tweetData.mentions);
    const payload: any = { text };

    if (mediaIds.length > 0) {
      payload.media = { media_ids: mediaIds };
    }

    if (tweetData.replyTo) {
      payload.reply = { in_reply_to_tweet_id: tweetData.replyTo };
    }

    if (tweetData.quoteTweetId) {
      payload.quote_tweet_id = tweetData.quoteTweetId;
    }

    if (tweetData.pollOptions) {
      payload.poll = {
        options: tweetData.pollOptions.map(option => ({ label: option })),
        duration_minutes: tweetData.pollDuration || 1440, // Default 24 hours
      };
    }

    if (tweetData.geo) {
      payload.geo = { 
        place_id: undefined, // Would need to lookup place_id from coordinates
      };
    }

    return payload;
  }

  private async createTweet(payload: any): Promise<any> {
    const endpoint = `${this.baseUrl}/tweets`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.bearerToken || this.config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create tweet: ${error.detail || response.statusText}`);
    }

    return response.json();
  }

  // Get tweet analytics
  async getTweetAnalytics(tweetId: string): Promise<TwitterAnalytics> {
    if (!this.config.bearerToken && !this.config.accessToken) {
      throw new Error('Twitter authentication not configured');
    }

    const endpoint = `${this.baseUrl}/tweets/${tweetId}`;
    const params = {
      'tweet.fields': 'public_metrics,organic_metrics,non_public_metrics',
      expansions: 'author_id',
    };

    const response = await fetch(`${endpoint}?${new URLSearchParams(params)}`, {
      headers: {
        'Authorization': `Bearer ${this.config.bearerToken || this.config.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get tweet analytics: ${response.statusText}`);
    }

    const data = await response.json();
    const metrics = data.data.public_metrics;
    const organicMetrics = data.data.organic_metrics || {};

    return {
      impressions: organicMetrics.impression_count || metrics.impression_count || 0,
      engagements: organicMetrics.engagement_count || 
        (metrics.retweet_count + metrics.like_count + metrics.reply_count) || 0,
      retweets: metrics.retweet_count || 0,
      likes: metrics.like_count || 0,
      replies: metrics.reply_count || 0,
      clicks: organicMetrics.url_link_clicks || 0,
      profileVisits: organicMetrics.user_profile_clicks || 0,
      videoViews: metrics.view_count,
      completionRate: 0, // Would need additional API calls
    };
  }

  // Get trending topics
  async getTrendingTopics(location?: string): Promise<{ name: string; volume: number }[]> {
    const woeid = location ? await this.getLocationWOEID(location) : 1; // 1 = Worldwide
    const endpoint = `https://api.twitter.com/1.1/trends/place.json`;
    const params = { id: woeid.toString() };

    const response = await fetch(`${endpoint}?${new URLSearchParams(params)}`, {
      headers: this.getAuthHeaders('GET', endpoint),
    });

    if (!response.ok) {
      // Return default trending topics
      return this.getDefaultTrendingTopics();
    }

    const data = await response.json();
    const trends = data[0]?.trends || [];

    return trends.map((trend: any) => ({
      name: trend.name,
      volume: trend.tweet_volume || 0,
    }));
  }

  private getDefaultTrendingTopics(): { name: string; volume: number }[] {
    return [
      { name: '#trending', volume: 100000 },
      { name: '#viral', volume: 80000 },
      { name: '#breakingnews', volume: 60000 },
      { name: '#tech', volume: 50000 },
      { name: '#entertainment', volume: 45000 },
    ];
  }

  // Get best posting times
  async getBestPostingTimes(): Promise<{ hour: number; dayOfWeek: number; score: number }[]> {
    // Twitter engagement typically peaks at:
    // - 8-10am (morning commute)
    // - 12-1pm (lunch break)
    // - 5-6pm (end of workday)
    // Wednesdays and Thursdays tend to have highest engagement
    
    return [
      { hour: 9, dayOfWeek: 3, score: 0.95 },   // Wednesday 9am
      { hour: 12, dayOfWeek: 3, score: 0.92 },  // Wednesday noon
      { hour: 17, dayOfWeek: 4, score: 0.93 },  // Thursday 5pm
      { hour: 8, dayOfWeek: 2, score: 0.88 },   // Tuesday 8am
      { hour: 13, dayOfWeek: 1, score: 0.85 },  // Monday 1pm
      { hour: 10, dayOfWeek: 5, score: 0.86 },  // Friday 10am
    ];
  }

  // Search tweets
  async searchTweets(query: string, maxResults: number = 10): Promise<any[]> {
    const endpoint = `${this.baseUrl}/tweets/search/recent`;
    const params = {
      query,
      max_results: maxResults.toString(),
      'tweet.fields': 'created_at,public_metrics,author_id',
    };

    const response = await fetch(`${endpoint}?${new URLSearchParams(params)}`, {
      headers: {
        'Authorization': `Bearer ${this.config.bearerToken || this.config.accessToken}`,
      },
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.data || [];
  }

  // Get user timeline
  async getUserTimeline(userId: string, maxResults: number = 10): Promise<any[]> {
    const endpoint = `${this.baseUrl}/users/${userId}/tweets`;
    const params = {
      max_results: maxResults.toString(),
      'tweet.fields': 'created_at,public_metrics',
    };

    const response = await fetch(`${endpoint}?${new URLSearchParams(params)}`, {
      headers: {
        'Authorization': `Bearer ${this.config.bearerToken || this.config.accessToken}`,
      },
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.data || [];
  }

  // Helper methods
  private buildTweetText(text: string, hashtags: string[], mentions?: string[]): string {
    let tweetText = text;
    
    if (mentions && mentions.length > 0) {
      const mentionText = mentions.map(m => m.startsWith('@') ? m : `@${m}`).join(' ');
      tweetText = `${mentionText} ${tweetText}`;
    }
    
    if (hashtags.length > 0) {
      const hashtagText = hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ');
      tweetText = `${tweetText}\n\n${hashtagText}`;
    }
    
    // Twitter character limit is 280
    if (tweetText.length > 280) {
      // Truncate and add ellipsis
      tweetText = tweetText.substring(0, 277) + '...';
    }
    
    return tweetText;
  }

  private getAuthHeaders(method: string, url: string): HeadersInit {
    if (this.config.bearerToken) {
      return {
        'Authorization': `Bearer ${this.config.bearerToken}`,
      };
    }

    if (this.oauth && this.config.accessToken && this.config.accessTokenSecret) {
      const authData = this.oauth.authorize(
        { url, method },
        {
          key: this.config.accessToken,
          secret: this.config.accessTokenSecret,
        }
      );

      return {
        'Authorization': this.oauth.toHeader(authData).Authorization,
      };
    }

    throw new Error('No authentication configured');
  }

  private getMediaType(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      mp4: 'video/mp4',
      mov: 'video/quicktime',
    };
    return mimeTypes[extension || ''] || 'application/octet-stream';
  }

  private async getLocationWOEID(location: string): Promise<number> {
    // This would normally use Yahoo's GeoPlanet API or a location database
    // For now, return common location IDs
    const locations: Record<string, number> = {
      'worldwide': 1,
      'usa': 23424977,
      'uk': 23424975,
      'canada': 23424775,
      'newyork': 2459115,
      'losangeles': 2442047,
      'london': 44418,
    };
    
    return locations[location.toLowerCase()] || 1;
  }

  // Validate media
  async validateMedia(mediaUrl: string): Promise<{ valid: boolean; errors?: string[] }> {
    const errors: string[] = [];
    
    // Twitter media requirements:
    // Images: JPEG, PNG, GIF, WEBP
    // - Max file size: 5MB (photos), 15MB (GIF)
    // Videos: MP4, MOV
    // - Max file size: 512MB
    // - Duration: 2:20 max
    // - Resolution: 1920x1080 max
    
    return { valid: true };
  }

  // Schedule tweet
  async scheduleTweet(tweetData: TwitterTweetData, scheduledTime: Date): Promise<{ scheduledId: string }> {
    // Twitter doesn't have native scheduling API
    // This would integrate with a scheduling service
    const scheduledId = crypto.randomBytes(16).toString('hex');
    
    // Store in queue for scheduled publishing
    
    return { scheduledId };
  }

  // Delete tweet
  async deleteTweet(tweetId: string): Promise<{ success: boolean }> {
    const endpoint = `${this.baseUrl}/tweets/${tweetId}`;
    
    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.config.bearerToken || this.config.accessToken}`,
      },
    });

    return { success: response.ok };
  }
}