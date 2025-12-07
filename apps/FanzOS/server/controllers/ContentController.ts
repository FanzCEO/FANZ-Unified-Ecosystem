import { Request, Response } from 'express';
import { storage } from '../storage';
import { mediaService, MediaType } from '../mediaService';
import { shortVideoService } from '../shortVideoService';
import { aiAssistantService, AIRequestType, AIAssistantType } from '../aiAssistantService';
import { realTimeManager } from '../realtime';

export class ContentController {
  // Upload media content
  async uploadMedia(req: any, res: Response) {
    try {
      const userId = req.user.claims.sub;
      const { fileName, mimeType, mediaType = 'image' } = req.body;
      
      if (!fileName || !mimeType) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      
      const uploadResult = await mediaService.generateUploadUrl(
        userId,
        fileName,
        mimeType,
        mediaType as MediaType
      );
      
      res.json(uploadResult);
    } catch (error) {
      console.error('Media upload error:', error);
      res.status(500).json({ message: 'Failed to generate upload URL' });
    }
  }

  // Process uploaded media
  async processMedia(req: any, res: Response) {
    try {
      const userId = req.user.claims.sub;
      const { mediaId, processingOptions = {} } = req.body;
      
      const result = await mediaService.processMediaFile(mediaId, processingOptions);
      
      res.json(result);
    } catch (error) {
      console.error('Media processing error:', error);
      res.status(500).json({ message: 'Failed to process media' });
    }
  }

  // Get media library
  async getMediaLibrary(req: any, res: Response) {
    try {
      const userId = req.user.claims.sub;
      const { page = 0, limit = 20, type = 'all' } = req.query;
      
      // Get media from storage instead of mediaService
      const media = await storage.getUserContent(userId, parseInt(limit as string), parseInt(page as string) * parseInt(limit as string));
      
      res.json(media);
    } catch (error) {
      console.error('Get media library error:', error);
      res.status(500).json({ message: 'Failed to get media library' });
    }
  }

  // Upload short video
  async uploadShortVideo(req: any, res: Response) {
    try {
      const userId = req.user.claims.sub;
      const uploadRequest = req.body;
      
      const result = await shortVideoService.uploadShortVideo(userId, uploadRequest);
      
      // Notify followers of new content
      const user = await storage.getUser(userId);
      if (user?.role === 'creator') {
        await realTimeManager.notifyNewContent(userId, {
          contentType: 'short_video',
          videoId: result.videoId,
          title: uploadRequest.title,
          thumbnail: uploadRequest.thumbnailUrl,
          creatorName: user.displayName || user.username
        });
      }
      
      res.json(result);
    } catch (error) {
      console.error('Short video upload error:', error);
      res.status(500).json({ message: 'Failed to upload short video' });
    }
  }

  // Get short video feed
  async getShortVideoFeed(req: any, res: Response) {
    try {
      const userId = req.user.claims.sub;
      const { type = 'for_you', page = 0, limit = 20, hashtag, creatorId } = req.query;
      
      const feed = await shortVideoService.getFeed({
        type: type as any,
        userId,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        hashtag: hashtag as string,
        creatorId: creatorId as string
      });
      
      res.json(feed);
    } catch (error) {
      console.error('Get short video feed error:', error);
      res.status(500).json({ message: 'Failed to get video feed' });
    }
  }

  // React to video
  async reactToVideo(req: any, res: Response) {
    try {
      const userId = req.user.claims.sub;
      const { videoId } = req.params;
      const { reactionType } = req.body;
      
      const result = await shortVideoService.reactToVideo(userId, videoId, reactionType);
      
      // Notify creator of new reaction
      const video = await storage.getShortVideo(videoId);
      if (video?.userId) {
        const user = await storage.getUser(userId);
        await realTimeManager.broadcastEvent({
          type: 'comment',
          creatorId: video.userId,
          data: {
            action: 'video_reaction',
            videoId,
            reactionType,
            userName: user?.displayName || user?.username
          }
        });
      }
      
      res.json({ success: result });
    } catch (error) {
      console.error('React to video error:', error);
      res.status(500).json({ message: 'Failed to react to video' });
    }
  }

  // Track video view
  async trackVideoView(req: any, res: Response) {
    try {
      const userId = req.user?.claims?.sub || null;
      const { videoId } = req.params;
      const { watchTime, deviceInfo } = req.body;
      
      await shortVideoService.trackView(userId, videoId, watchTime, deviceInfo);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Track video view error:', error);
      res.status(500).json({ message: 'Failed to track view' });
    }
  }

  // Get trending hashtags
  async getTrendingHashtags(req: any, res: Response) {
    try {
      const { limit = 10 } = req.query;
      
      const hashtags = await shortVideoService.getTrendingHashtags(parseInt(limit as string));
      
      res.json(hashtags);
    } catch (error) {
      console.error('Get trending hashtags error:', error);
      res.status(500).json({ message: 'Failed to get trending hashtags' });
    }
  }

  // Get video analytics
  async getVideoAnalytics(req: any, res: Response) {
    try {
      const userId = req.user.claims.sub;
      const { videoId } = req.params;
      
      const analytics = await shortVideoService.getVideoAnalytics(videoId, userId);
      
      res.json(analytics);
    } catch (error) {
      console.error('Get video analytics error:', error);
      res.status(500).json({ message: 'Failed to get video analytics' });
    }
  }

  // AI content suggestions
  async getContentSuggestions(req: any, res: Response) {
    try {
      const userId = req.user.claims.sub;
      
      const suggestions = await shortVideoService.getContentSuggestions(userId);
      
      res.json({ suggestions });
    } catch (error) {
      console.error('Get content suggestions error:', error);
      res.status(500).json({ message: 'Failed to get content suggestions' });
    }
  }

  // Generate content with AI
  async generateContent(req: any, res: Response) {
    try {
      const userId = req.user.claims.sub;
      const { prompt, type = 'text', assistantType = AIAssistantType.CONTENT_CREATOR } = req.body;
      
      const request = await aiAssistantService.processAIRequest({
        userId,
        type: AIRequestType.CONTENT_GENERATION,
        assistantType,
        prompt
      });
      
      res.json(request);
    } catch (error) {
      console.error('Generate content error:', error);
      res.status(500).json({ message: 'Failed to generate content' });
    }
  }

  // Add comment to post/video
  async addComment(req: any, res: Response) {
    try {
      const userId = req.user.claims.sub;
      const { content, postId, shortVideoId } = req.body;
      
      if (!content || (!postId && !shortVideoId)) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      
      const comment = await storage.createComment({
        userId,
        content,
        postId: postId || null,
        shortVideoId: shortVideoId || null
      });
      
      // Get user info for response
      const user = await storage.getUser(userId);
      
      // Broadcast real-time comment notification
      const contentCreatorId = postId ? 
        (await storage.getPost(postId))?.userId : 
        (await storage.getShortVideo(shortVideoId))?.userId;
      
      if (contentCreatorId) {
        await realTimeManager.notifyComment(postId || shortVideoId, {
          commentId: comment.id,
          commenterName: user?.displayName || user?.username,
          contentType: postId ? 'post' : 'video',
          preview: content.substring(0, 50)
        });
      }
      
      res.json({
        ...comment,
        user: {
          id: user?.id,
          username: user?.username,
          displayName: user?.displayName,
          profileImageUrl: user?.profileImageUrl
        }
      });
    } catch (error) {
      console.error('Add comment error:', error);
      res.status(500).json({ message: 'Failed to add comment' });
    }
  }

  // Get comments for content
  async getComments(req: any, res: Response) {
    try {
      const { postId, videoId } = req.query;
      
      let comments;
      if (postId) {
        comments = await storage.getPostComments(postId as string);
      } else if (videoId) {
        comments = await storage.getVideoComments(videoId as string);
      } else {
        return res.status(400).json({ message: 'Missing content ID' });
      }
      
      // Enrich with user data
      const enrichedComments = await Promise.all(comments.map(async (comment) => {
        const user = await storage.getUser(comment.userId);
        return {
          ...comment,
          user: {
            id: user?.id,
            username: user?.username,
            displayName: user?.displayName,
            profileImageUrl: user?.profileImageUrl
          }
        };
      }));
      
      res.json(enrichedComments);
    } catch (error) {
      console.error('Get comments error:', error);
      res.status(500).json({ message: 'Failed to get comments' });
    }
  }

  // Content moderation
  async moderateContent(req: any, res: Response) {
    try {
      const { entityType, entityId, action = 'approve' } = req.body;
      const userId = req.user.claims.sub;
      
      // Check if user has moderation permissions
      const user = await storage.getUser(userId);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }
      
      let moderationResult = await storage.getModerationResult(entityType, entityId);
      
      if (moderationResult) {
        moderationResult = await storage.updateModerationStatus(
          moderationResult.id,
          action,
          userId
        );
      } else {
        moderationResult = await storage.createModerationResult({
          entityType,
          entityId,
          moderationService: 'manual'
        });
        moderationResult = await storage.updateModerationStatus(
          moderationResult.id,
          action,
          userId
        );
      }
      
      res.json(moderationResult);
    } catch (error) {
      console.error('Moderate content error:', error);
      res.status(500).json({ message: 'Failed to moderate content' });
    }
  }
}

export const contentController = new ContentController();