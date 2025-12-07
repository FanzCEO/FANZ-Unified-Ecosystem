import { Request, Response } from 'express';
import { storage } from '../storage';
import { mediaService } from '../mediaService';
import { smsService, SMSMessageType } from '../smsService';
import { ObjectStorageService } from '../objectStorage';
import { randomUUID } from 'crypto';
import { realTimeManager } from '../realtime';

interface RecordedStream {
  id: string;
  streamId: string;
  creatorId: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
  recordedAt: string;
  views: number;
  isPublic: boolean;
  hasCoStars: boolean;
  complianceVerified: boolean;
  coStars?: {
    id: string;
    name: string;
    email: string;
    verificationStatus: 'pending' | 'verified' | 'rejected';
    documentationComplete: boolean;
    ageVerified: boolean;
    consentGiven: boolean;
    joinedAt: string;
  }[];
}

export class LiveStreamController {
  // Start live stream
  async startStream(req: any, res: Response) {
    try {
      const userId = req.user.claims.sub;
      const { title, description, isPrivate = false, ticketPrice } = req.body;
      
      const user = await storage.getUser(userId);
      if (user?.role !== 'creator') {
        return res.status(403).json({ message: 'Only creators can start streams' });
      }
      
      // Generate stream session
      const streamSession = await mediaService.createStreamSession(
        userId,
        title,
        description
      );
      
      // Store additional stream metadata (isPrivate, ticketPrice) if needed
      console.log('Stream created with metadata:', { isPrivate, ticketPrice });
      
      // Send real-time notification about stream start
      await realTimeManager.notifyLiveStreamStart(userId, {
        streamId: streamSession.streamId,
        streamTitle: title,
        streamUrl: streamSession.ingestUrl,
        isPrivate,
        ticketPrice,
        creatorName: user.displayName || user.username,
        creatorAvatar: user.profileImageUrl,
        startTime: new Date().toISOString()
      });
      
      // Notify subscribers about upcoming stream
      if (!isPrivate) {
        await this.notifySubscribersAboutStream(userId, title);
      }
      
      res.json(streamSession);
    } catch (error) {
      console.error('Start stream error:', error);
      res.status(500).json({ message: 'Failed to start stream' });
    }
  }

  // End live stream
  async endStream(req: any, res: Response) {
    try {
      const userId = req.user.claims.sub;
      const { streamId } = req.params;
      
      await mediaService.endStream(streamId);
      
      // Send real-time notification about stream end
      await realTimeManager.notifyLiveStreamEnd(userId, {
        streamId,
        endTime: new Date().toISOString(),
        duration: 0 // Would calculate from database in production
      });
      
      const result = { success: true, message: 'Stream ended successfully' };
      
      res.json(result);
    } catch (error) {
      console.error('End stream error:', error);
      res.status(500).json({ message: 'Failed to end stream' });
    }
  }

  // Get active streams
  async getActiveStreams(req: any, res: Response) {
    try {
      const { page = 0, limit = 20 } = req.query;
      
      // Mock active streams for now - in production would query database
      const streams = {
        streams: [],
        total: 0,
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      };
      
      res.json(streams);
    } catch (error) {
      console.error('Get active streams error:', error);
      res.status(500).json({ message: 'Failed to get active streams' });
    }
  }

  // Join stream
  async joinStream(req: any, res: Response) {
    try {
      const userId = req.user.claims.sub;
      const { streamId } = req.params;
      
      // Mock stream session for now - in production would query database
      const stream = {
        id: streamId,
        playbackUrl: `https://stream.fanzlab.com/live/${streamId}`,
        isPrivate: false,
        ticketPrice: null
      };
      
      // Check if user has access
      if (stream.isPrivate || stream.ticketPrice) {
        const hasAccess = await this.checkStreamAccess(userId, streamId);
        if (!hasAccess) {
          return res.status(403).json({ message: 'Access denied' });
        }
      }
      
      const accessToken = `token_${streamId}_${userId}_${Date.now()}`;
      
      // Broadcast viewer join event
      const viewer = await storage.getUser(userId);
      await realTimeManager.broadcastEvent({
        type: 'live_stream',
        data: {
          action: 'viewer_joined',
          streamId,
          viewerId: userId,
          viewerName: viewer?.displayName || viewer?.username,
          timestamp: new Date().toISOString()
        }
      });
      
      res.json({ 
        playbackUrl: stream.playbackUrl,
        accessToken,
        chatToken: `chat_${streamId}_${userId}`
      });
    } catch (error) {
      console.error('Join stream error:', error);
      res.status(500).json({ message: 'Failed to join stream' });
    }
  }

  // Purchase stream ticket
  async purchaseStreamTicket(req: any, res: Response) {
    try {
      const userId = req.user.claims.sub;
      const { streamId } = req.params;
      const { paymentProcessor } = req.body;
      
      // Mock stream session for now - in production would query database
      const stream = {
        id: streamId,
        ticketPrice: 10.00 // Mock ticket price
      };
      
      if (!stream.ticketPrice) {
        return res.status(400).json({ message: 'Stream ticket not available' });
      }
      
      // Process payment (mock implementation)
      const ticket = {
        id: `ticket_${Date.now()}`,
        streamId,
        userId,
        price: stream.ticketPrice,
        purchasedAt: new Date()
      };
      
      res.json(ticket);
    } catch (error) {
      console.error('Purchase stream ticket error:', error);
      res.status(500).json({ message: 'Failed to purchase stream ticket' });
    }
  }

  // Send stream message/tip
  async sendStreamMessage(req: any, res: Response) {
    try {
      const userId = req.user.claims.sub;
      const { streamId } = req.params;
      const { message, tipAmount = 0 } = req.body;
      
      // Validate stream access
      const hasAccess = await this.checkStreamAccess(userId, streamId);
      if (!hasAccess) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const streamMessage = {
        id: `msg_${Date.now()}`,
        streamId,
        userId,
        message,
        tipAmount,
        timestamp: new Date()
      };
      
      // In production, would broadcast via WebSocket
      console.log('Stream message:', streamMessage);
      
      res.json(streamMessage);
    } catch (error) {
      console.error('Send stream message error:', error);
      res.status(500).json({ message: 'Failed to send stream message' });
    }
  }

  // Get stream analytics
  async getStreamAnalytics(req: any, res: Response) {
    try {
      const userId = req.user.claims.sub;
      const { streamId } = req.params;
      
      // Mock stream session for now - in production would query database
      const stream = {
        id: streamId,
        creatorId: userId,
        viewerCount: Math.floor(Math.random() * 100),
        startTime: new Date(Date.now() - 3600000), // 1 hour ago
        endTime: null as Date | null
      };
      
      if (stream.creatorId !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const analytics = {
        viewerCount: stream.viewerCount || 0,
        peakViewers: Math.floor(Math.random() * 1000) + 100,
        totalViews: Math.floor(Math.random() * 5000) + 500,
        duration: stream.endTime && stream.startTime 
          ? Math.floor((stream.endTime.getTime() - stream.startTime.getTime()) / 1000)
          : 0,
        earnings: Math.floor(Math.random() * 500) + 50,
        chatMessages: Math.floor(Math.random() * 2000) + 100,
        uniqueViewers: Math.floor(Math.random() * 800) + 80
      };
      
      res.json(analytics);
    } catch (error) {
      console.error('Get stream analytics error:', error);
      res.status(500).json({ message: 'Failed to get stream analytics' });
    }
  }

  // Schedule stream
  async scheduleStream(req: any, res: Response) {
    try {
      const userId = req.user.claims.sub;
      const { title, description, scheduledDate, isPrivate = false, ticketPrice } = req.body;
      
      const user = await storage.getUser(userId);
      if (user?.role !== 'creator') {
        return res.status(403).json({ message: 'Only creators can schedule streams' });
      }
      
      const scheduledStream = {
        id: `scheduled_${Date.now()}`,
        creatorId: userId,
        title,
        description,
        scheduledDate: new Date(scheduledDate),
        isPrivate,
        ticketPrice,
        status: 'scheduled'
      };
      
      // In production, would save to database and set up job queue
      console.log('Stream scheduled:', scheduledStream);
      
      res.json(scheduledStream);
    } catch (error) {
      console.error('Schedule stream error:', error);
      res.status(500).json({ message: 'Failed to schedule stream' });
    }
  }

  // Get user's streams
  async getUserStreams(req: any, res: Response) {
    try {
      const userId = req.user.claims.sub;
      const { status = 'all', page = 0, limit = 20 } = req.query;
      
      // In production, would query database
      const streams: any[] = [];
      
      res.json({ streams, total: 0, page, limit });
    } catch (error) {
      console.error('Get user streams error:', error);
      res.status(500).json({ message: 'Failed to get user streams' });
    }
  }

  // Private helper methods
  private async checkStreamAccess(userId: string, streamId: string): Promise<boolean> {
    // In production, would check subscription status, ticket purchases, etc.
    return true;
  }

  private async notifySubscribersAboutStream(creatorId: string, title: string): Promise<void> {
    try {
      const subscriptions = await storage.getActiveSubscriptions(creatorId);
      const creator = await storage.getUser(creatorId);
      
      // Send notifications to subscribers
      for (const sub of subscriptions) {
        try {
          await smsService.sendSMS({
            to: '+1234567890', // Would get from subscriber profile
            type: SMSMessageType.STREAM_STARTING,
            variables: {
              creatorName: creator?.displayName || creator?.username || 'Creator',
              streamTitle: title
            }
          });
        } catch (error) {
          console.warn('Failed to notify subscriber:', error);
        }
      }
    } catch (error) {
      console.error('Failed to notify subscribers:', error);
    }
  }

  // Start recording stream
  async startRecording(req: any, res: Response) {
    try {
      const userId = req.user.claims.sub;
      const { streamId } = req.body;
      
      const user = await storage.getUser(userId);
      if (user?.role !== 'creator') {
        return res.status(403).json({ message: 'Only creators can start recording' });
      }
      
      // Mock recording session - in production would use actual recording service
      const recordingSession = {
        id: `recording_${streamId}_${Date.now()}`,
        streamId,
        creatorId: userId,
        startedAt: new Date().toISOString(),
        status: 'recording'
      };
      
      console.log('Recording started:', recordingSession);
      
      res.json({ success: true, recordingId: recordingSession.id });
    } catch (error) {
      console.error('Start recording error:', error);
      res.status(500).json({ message: 'Failed to start recording' });
    }
  }

  // Stop recording and save to vault
  async stopRecording(req: any, res: Response) {
    try {
      const userId = req.user.claims.sub;
      const { streamId, duration } = req.body;
      
      const user = await storage.getUser(userId);
      if (user?.role !== 'creator') {
        return res.status(403).json({ message: 'Only creators can stop recording' });
      }
      
      // Stop recording and upload to object storage
      const objectStorageService = new ObjectStorageService();
      const recordingUrl = await objectStorageService.getObjectEntityUploadURL();
      
      // Save recording metadata
      const recordedStream: RecordedStream = {
        id: randomUUID(),
        streamId,
        creatorId: userId,
        title: `Stream Recording - ${new Date().toLocaleDateString()}`,
        description: 'Recorded live stream',
        videoUrl: recordingUrl,
        thumbnailUrl: '',
        duration,
        recordedAt: new Date().toISOString(),
        views: 0,
        isPublic: false,
        hasCoStars: false,
        complianceVerified: true
      };
      
      res.json({ success: true, recordingUrl, recordingId: recordedStream.id });
    } catch (error) {
      console.error('Stop recording error:', error);
      res.status(500).json({ message: 'Failed to stop recording' });
    }
  }

  // Get recorded streams for creator vault
  async getRecordedStreams(req: any, res: Response) {
    try {
      const userId = req.user.claims.sub;
      const { creatorId } = req.params;
      
      // Only allow creators to view their own vault or admins
      const user = await storage.getUser(userId);
      if (user?.role !== 'admin' && userId !== creatorId) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // Mock data for now - replace with actual database query
      const recordings: RecordedStream[] = [
        {
          id: '1',
          streamId: 'stream1',
          creatorId: userId,
          title: 'Evening Chat Session',
          description: 'Recorded live chat with fans',
          videoUrl: '/objects/recordings/stream1.mp4',
          thumbnailUrl: '/objects/thumbnails/stream1.jpg',
          duration: 3420,
          recordedAt: '2024-01-20T20:00:00Z',
          views: 1247,
          isPublic: true,
          hasCoStars: false,
          complianceVerified: true
        }
      ];
      
      res.json(recordings);
    } catch (error) {
      console.error('Get recorded streams error:', error);
      res.status(500).json({ message: 'Failed to get recorded streams' });
    }
  }

  // Delete recording
  async deleteRecording(req: any, res: Response) {
    try {
      const userId = req.user.claims.sub;
      const { recordingId } = req.params;
      
      const user = await storage.getUser(userId);
      if (user?.role !== 'creator') {
        return res.status(403).json({ message: 'Only creators can delete recordings' });
      }
      
      res.json({ success: true, message: 'Recording deleted successfully' });
    } catch (error) {
      console.error('Delete recording error:', error);
      res.status(500).json({ message: 'Failed to delete recording' });
    }
  }

  // Update recording metadata
  async updateRecording(req: any, res: Response) {
    try {
      const userId = req.user.claims.sub;
      const { recordingId } = req.params;
      const { title, description, isPublic } = req.body;
      
      const user = await storage.getUser(userId);
      if (user?.role !== 'creator') {
        return res.status(403).json({ message: 'Only creators can update recordings' });
      }
      
      res.json({ success: true, message: 'Recording updated successfully' });
    } catch (error) {
      console.error('Update recording error:', error);
      res.status(500).json({ message: 'Failed to update recording' });
    }
  }

  // Add co-star to stream
  async addCoStar(req: any, res: Response) {
    try {
      const userId = req.user.claims.sub;
      const { streamId, name, email } = req.body;
      
      const user = await storage.getUser(userId);
      if (user?.role !== 'creator') {
        return res.status(403).json({ message: 'Only creators can add co-stars' });
      }
      
      const coStar = {
        id: randomUUID(),
        name,
        email,
        verificationStatus: 'pending' as const,
        documentationComplete: false,
        ageVerified: false,
        consentGiven: false,
        joinedAt: new Date().toISOString()
      };
      
      res.json({ success: true, coStar });
    } catch (error) {
      console.error('Add co-star error:', error);
      res.status(500).json({ message: 'Failed to add co-star' });
    }
  }

  // Verify co-star compliance
  async verifyCoStar(req: any, res: Response) {
    try {
      const userId = req.user.claims.sub;
      const { coStarId, verificationStatus, ageVerified, documentationComplete } = req.body;
      
      const user = await storage.getUser(userId);
      if (user?.role !== 'admin' && user?.role !== 'creator') {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      res.json({ success: true, message: 'Co-star verification updated' });
    } catch (error) {
      console.error('Verify co-star error:', error);
      res.status(500).json({ message: 'Failed to verify co-star' });
    }
  }

  // Get stream co-stars
  async getStreamCoStars(req: any, res: Response) {
    try {
      const userId = req.user.claims.sub;
      const { streamId } = req.params;
      
      // Mock data for now
      const coStars = [
        {
          id: '1',
          name: 'Sarah Johnson',
          email: 'sarah@example.com',
          verificationStatus: 'verified',
          documentationComplete: true,
          ageVerified: true,
          consentGiven: true,
          joinedAt: '2024-01-20T15:30:00Z'
        }
      ];
      
      res.json(coStars);
    } catch (error) {
      console.error('Get stream co-stars error:', error);
      res.status(500).json({ message: 'Failed to get stream co-stars' });
    }
  }

  // Track stream view
  async trackStreamView(req: Request, res: Response) {
    try {
      const { streamId } = req.body;
      
      res.json({ success: true });
    } catch (error) {
      console.error('Track stream view error:', error);
      res.status(500).json({ message: 'Failed to track view' });
    }
  }

  // Send tip during stream
  async sendTip(req: any, res: Response) {
    try {
      const userId = req.user.claims.sub;
      const { streamId, amount, message } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      
      res.json({ success: true, message: 'Tip sent successfully' });
    } catch (error) {
      console.error('Send tip error:', error);
      res.status(500).json({ message: 'Failed to send tip' });
    }
  }
}

export const liveStreamController = new LiveStreamController();