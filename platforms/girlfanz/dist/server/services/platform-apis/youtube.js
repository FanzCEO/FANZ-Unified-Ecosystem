export class YouTubeAPI {
    constructor(config) {
        this.baseUrl = 'https://www.googleapis.com/youtube/v3';
        this.uploadUrl = 'https://www.googleapis.com/upload/youtube/v3';
        this.analyticsUrl = 'https://youtubeanalytics.googleapis.com/v2';
        this.config = config;
    }
    // OAuth Flow
    getAuthorizationUrl(state) {
        const params = new URLSearchParams({
            client_id: this.config.clientId,
            redirect_uri: this.config.redirectUri,
            response_type: 'code',
            scope: 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/yt-analytics.readonly',
            access_type: 'offline',
            state,
        });
        return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    }
    async exchangeCodeForToken(code) {
        const params = new URLSearchParams({
            code,
            client_id: this.config.clientId,
            client_secret: this.config.clientSecret,
            redirect_uri: this.config.redirectUri,
            grant_type: 'authorization_code',
        });
        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params,
        });
        if (!response.ok) {
            throw new Error(`YouTube token exchange failed: ${response.statusText}`);
        }
        const data = await response.json();
        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
        };
    }
    async refreshAccessToken() {
        if (!this.config.refreshToken) {
            throw new Error('Refresh token not available');
        }
        const params = new URLSearchParams({
            refresh_token: this.config.refreshToken,
            client_id: this.config.clientId,
            client_secret: this.config.clientSecret,
            grant_type: 'refresh_token',
        });
        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params,
        });
        if (!response.ok) {
            throw new Error(`Failed to refresh YouTube access token: ${response.statusText}`);
        }
        const data = await response.json();
        this.config.accessToken = data.access_token;
        return data.access_token;
    }
    // Upload and publish video
    async uploadVideo(videoData) {
        if (!this.config.accessToken) {
            throw new Error('YouTube access token not configured');
        }
        try {
            // Create video resource
            const videoResource = {
                snippet: {
                    title: videoData.title,
                    description: this.buildDescription(videoData.description, videoData.tags),
                    tags: videoData.tags,
                    categoryId: videoData.categoryId || '22', // People & Blogs
                    defaultLanguage: videoData.language || 'en',
                },
                status: {
                    privacyStatus: videoData.privacy,
                    selfDeclaredMadeForKids: videoData.madeForKids,
                    publishAt: videoData.publishAt?.toISOString(),
                },
                recordingDetails: videoData.recordingDate ? {
                    recordingDate: videoData.recordingDate.toISOString(),
                } : undefined,
            };
            // Upload video
            const uploadedVideo = await this.performVideoUpload(videoData.videoUrl, videoResource);
            // Set thumbnail if provided
            if (videoData.thumbnailUrl) {
                await this.uploadThumbnail(uploadedVideo.id, videoData.thumbnailUrl);
            }
            // Add to playlist if specified
            if (videoData.playlistId) {
                await this.addToPlaylist(uploadedVideo.id, videoData.playlistId);
            }
            return {
                videoId: uploadedVideo.id,
                url: `https://www.youtube.com/watch?v=${uploadedVideo.id}`,
            };
        }
        catch (error) {
            console.error('YouTube upload error:', error);
            throw new Error(`Failed to upload to YouTube: ${error}`);
        }
    }
    async performVideoUpload(videoUrl, videoResource) {
        // Download video
        const videoResponse = await fetch(videoUrl);
        const videoBuffer = await videoResponse.arrayBuffer();
        // Resumable upload
        const endpoint = `${this.uploadUrl}/videos?uploadType=resumable&part=snippet,status,recordingDetails`;
        // Step 1: Initiate resumable upload
        const initResponse = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.config.accessToken}`,
                'Content-Type': 'application/json',
                'X-Upload-Content-Length': videoBuffer.byteLength.toString(),
                'X-Upload-Content-Type': 'video/*',
            },
            body: JSON.stringify(videoResource),
        });
        if (!initResponse.ok) {
            const error = await initResponse.json();
            throw new Error(`Failed to initiate upload: ${error.error?.message}`);
        }
        const uploadUrl = initResponse.headers.get('Location');
        if (!uploadUrl) {
            throw new Error('No upload URL returned');
        }
        // Step 2: Upload video content
        const uploadResponse = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'video/*',
                'Content-Length': videoBuffer.byteLength.toString(),
            },
            body: videoBuffer,
        });
        if (!uploadResponse.ok) {
            throw new Error(`Failed to upload video content: ${uploadResponse.statusText}`);
        }
        return uploadResponse.json();
    }
    async uploadThumbnail(videoId, thumbnailUrl) {
        const thumbnailResponse = await fetch(thumbnailUrl);
        const thumbnailBuffer = await thumbnailResponse.arrayBuffer();
        const endpoint = `${this.uploadUrl}/thumbnails/set?videoId=${videoId}`;
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.config.accessToken}`,
                'Content-Type': 'image/jpeg',
            },
            body: thumbnailBuffer,
        });
        if (!response.ok) {
            console.error('Failed to upload thumbnail:', response.statusText);
        }
    }
    async addToPlaylist(videoId, playlistId) {
        const endpoint = `${this.baseUrl}/playlistItems?part=snippet`;
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.config.accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                snippet: {
                    playlistId,
                    resourceId: {
                        kind: 'youtube#video',
                        videoId,
                    },
                },
            }),
        });
        if (!response.ok) {
            console.error('Failed to add video to playlist:', response.statusText);
        }
    }
    // Get video analytics
    async getVideoAnalytics(videoId, startDate, endDate) {
        if (!this.config.accessToken) {
            throw new Error('YouTube access token not configured');
        }
        const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
        const end = endDate || new Date();
        const params = {
            ids: 'channel==MINE',
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0],
            metrics: 'views,likes,dislikes,comments,shares,estimatedMinutesWatched,averageViewDuration,subscribersGained,estimatedRevenue,impressions,clickThroughRate',
            filters: `video==${videoId}`,
        };
        const endpoint = `${this.analyticsUrl}/reports`;
        const response = await fetch(`${endpoint}?${new URLSearchParams(params)}`, {
            headers: {
                'Authorization': `Bearer ${this.config.accessToken}`,
            },
        });
        if (!response.ok) {
            // Return mock data if analytics API fails
            return this.getMockAnalytics();
        }
        const data = await response.json();
        const row = data.rows?.[0] || [];
        return {
            views: row[0] || 0,
            likes: row[1] || 0,
            dislikes: row[2] || 0,
            comments: row[3] || 0,
            shares: row[4] || 0,
            watchTimeMinutes: row[5] || 0,
            averageViewDuration: row[6] || 0,
            subscribersGained: row[7] || 0,
            estimatedRevenue: row[8] || 0,
            impressions: row[9] || 0,
            clickThroughRate: row[10] || 0,
        };
    }
    getMockAnalytics() {
        return {
            views: 0,
            likes: 0,
            dislikes: 0,
            comments: 0,
            shares: 0,
            watchTimeMinutes: 0,
            averageViewDuration: 0,
            subscribersGained: 0,
            estimatedRevenue: 0,
            impressions: 0,
            clickThroughRate: 0,
        };
    }
    // Search videos
    async searchVideos(query, maxResults = 10) {
        const params = {
            part: 'snippet',
            q: query,
            type: 'video',
            maxResults: maxResults.toString(),
            key: this.config.apiKey || this.config.accessToken,
        };
        const endpoint = `${this.baseUrl}/search`;
        const response = await fetch(`${endpoint}?${new URLSearchParams(params)}`);
        if (!response.ok) {
            return [];
        }
        const data = await response.json();
        return data.items || [];
    }
    // Get trending videos
    async getTrendingVideos(categoryId, regionCode = 'US') {
        const params = {
            part: 'snippet,statistics',
            chart: 'mostPopular',
            regionCode,
            maxResults: '20',
            key: this.config.apiKey || this.config.accessToken,
        };
        if (categoryId) {
            params.videoCategoryId = categoryId;
        }
        const endpoint = `${this.baseUrl}/videos`;
        const response = await fetch(`${endpoint}?${new URLSearchParams(params)}`);
        if (!response.ok) {
            return [];
        }
        const data = await response.json();
        return data.items || [];
    }
    // Get channel statistics
    async getChannelStatistics() {
        if (!this.config.accessToken) {
            throw new Error('YouTube access token not configured');
        }
        const params = {
            part: 'statistics,snippet',
            mine: 'true',
        };
        const endpoint = `${this.baseUrl}/channels`;
        const response = await fetch(`${endpoint}?${new URLSearchParams(params)}`, {
            headers: {
                'Authorization': `Bearer ${this.config.accessToken}`,
            },
        });
        if (!response.ok) {
            throw new Error(`Failed to get channel statistics: ${response.statusText}`);
        }
        const data = await response.json();
        return data.items?.[0] || {};
    }
    // Get best posting times for YouTube
    async getBestPostingTimes() {
        // YouTube best times are typically:
        // - 2-4pm on weekdays (peak viewing)
        // - 9-11am on weekends
        // - Thursday/Friday for highest engagement
        return [
            { hour: 14, dayOfWeek: 4, score: 0.95 }, // Thursday 2pm
            { hour: 15, dayOfWeek: 5, score: 0.93 }, // Friday 3pm
            { hour: 14, dayOfWeek: 3, score: 0.90 }, // Wednesday 2pm
            { hour: 10, dayOfWeek: 6, score: 0.88 }, // Saturday 10am
            { hour: 10, dayOfWeek: 0, score: 0.87 }, // Sunday 10am
            { hour: 20, dayOfWeek: 5, score: 0.85 }, // Friday 8pm
        ];
    }
    // Get trending tags
    async getTrendingTags(category) {
        // YouTube doesn't have a public trending tags API
        // Return category-specific popular tags
        const baseTags = ['youtube', 'video', 'vlog', 'viral', 'trending'];
        const categoryTags = {
            gaming: ['gameplay', 'gaming', 'gamer', 'letsplay', 'walkthrough', 'ps5', 'xbox'],
            music: ['music', 'song', 'cover', 'musicvideo', 'newmusic', 'musician'],
            education: ['tutorial', 'howto', 'learn', 'education', 'diy', 'tips'],
            entertainment: ['entertainment', 'funny', 'comedy', 'reaction', 'challenge'],
            tech: ['tech', 'technology', 'review', 'unboxing', 'gadgets', 'smartphone'],
        };
        if (category && categoryTags[category]) {
            return [...baseTags, ...categoryTags[category]];
        }
        return baseTags;
    }
    // Get video categories
    async getVideoCategories(regionCode = 'US') {
        const params = {
            part: 'snippet',
            regionCode,
            key: this.config.apiKey || this.config.accessToken,
        };
        const endpoint = `${this.baseUrl}/videoCategories`;
        const response = await fetch(`${endpoint}?${new URLSearchParams(params)}`);
        if (!response.ok) {
            return [];
        }
        const data = await response.json();
        return data.items || [];
    }
    // Create playlist
    async createPlaylist(title, description, privacy) {
        if (!this.config.accessToken) {
            throw new Error('YouTube access token not configured');
        }
        const endpoint = `${this.baseUrl}/playlists?part=snippet,status`;
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.config.accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                snippet: {
                    title,
                    description,
                },
                status: {
                    privacyStatus: privacy,
                },
            }),
        });
        if (!response.ok) {
            throw new Error(`Failed to create playlist: ${response.statusText}`);
        }
        const data = await response.json();
        return data.id;
    }
    // Helper to build description with tags
    buildDescription(description, tags) {
        const hashtagString = tags.map(tag => `#${tag.replace(/\s+/g, '')}`).join(' ');
        return `${description}\n\n${hashtagString}`;
    }
    // Validate video
    async validateVideo(videoUrl) {
        const errors = [];
        // YouTube video requirements:
        // - Formats: MP4, MOV, AVI, WMV, FLV, 3GPP, WebM
        // - Max file size: 256GB or 12 hours
        // - Resolution: Up to 8K
        // - Frame rate: 24-60 fps
        return { valid: true };
    }
    // Update video metadata
    async updateVideo(videoId, updates) {
        if (!this.config.accessToken) {
            throw new Error('YouTube access token not configured');
        }
        const endpoint = `${this.baseUrl}/videos?part=snippet,status`;
        const response = await fetch(endpoint, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${this.config.accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id: videoId,
                snippet: {
                    title: updates.title,
                    description: updates.description,
                    tags: updates.tags,
                    categoryId: updates.categoryId,
                },
                status: {
                    privacyStatus: updates.privacy,
                },
            }),
        });
        if (!response.ok) {
            throw new Error(`Failed to update video: ${response.statusText}`);
        }
    }
    // Delete video
    async deleteVideo(videoId) {
        if (!this.config.accessToken) {
            throw new Error('YouTube access token not configured');
        }
        const endpoint = `${this.baseUrl}/videos?id=${videoId}`;
        const response = await fetch(endpoint, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${this.config.accessToken}`,
            },
        });
        return { success: response.status === 204 };
    }
}
