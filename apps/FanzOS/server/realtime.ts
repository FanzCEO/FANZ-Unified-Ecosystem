import { EventEmitter } from 'events';

export interface RealTimeEvent {
  type: 'live_stream' | 'new_content' | 'message' | 'tip' | 'subscription' | 'comment' | 'follow' | 'contest' | 'system';
  userId?: string;
  creatorId?: string;
  data: any;
  priority?: 'high' | 'normal' | 'low';
}

class RealTimeManager extends EventEmitter {
  private static instance: RealTimeManager;
  private goServerUrl: string;

  constructor() {
    super();
    this.goServerUrl = process.env.GO_SERVER_URL || 'http://localhost:8080';
  }

  static getInstance(): RealTimeManager {
    if (!RealTimeManager.instance) {
      RealTimeManager.instance = new RealTimeManager();
    }
    return RealTimeManager.instance;
  }

  // Add broadcast method for backward compatibility
  broadcast(event: any): void {
    this.broadcastEvent({
      type: event.type || 'system',
      data: event.data,
      priority: 'normal'
    });
  }

  async broadcastEvent(event: RealTimeEvent): Promise<void> {
    try {
      const eventPayload = {
        event_type: event.type,
        user_id: event.userId,
        creator_id: event.creatorId,
        data: event.data,
        priority: event.priority || 'normal',
        timestamp: new Date().toISOString()
      };

      const response = await fetch(`${this.goServerUrl}/api/trigger-event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventPayload)
      });

      if (!response.ok) {
        console.error(`Failed to broadcast event: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error broadcasting event:', error);
    }
  }

  async notifyLiveStreamStart(creatorId: string, streamData: any): Promise<void> {
    await this.broadcastEvent({
      type: 'live_stream',
      creatorId,
      data: {
        action: 'stream_started',
        ...streamData
      },
      priority: 'high'
    });
  }

  async notifyLiveStreamEnd(creatorId: string, streamData: any): Promise<void> {
    await this.broadcastEvent({
      type: 'live_stream',
      creatorId,
      data: {
        action: 'stream_ended',
        ...streamData
      }
    });
  }

  async notifyNewContent(creatorId: string, contentData: any): Promise<void> {
    await this.broadcastEvent({
      type: 'new_content',
      creatorId,
      data: {
        action: 'content_published',
        ...contentData
      },
      priority: 'high'
    });
  }

  async notifyNewMessage(userId: string, messageData: any): Promise<void> {
    await this.broadcastEvent({
      type: 'message',
      userId,
      data: {
        action: 'message_received',
        ...messageData
      },
      priority: 'high'
    });
  }

  async notifyTip(creatorId: string, tipData: any): Promise<void> {
    await this.broadcastEvent({
      type: 'tip',
      creatorId,
      data: {
        action: 'tip_received',
        ...tipData
      },
      priority: 'high'
    });
  }

  async notifySubscription(creatorId: string, subscriptionData: any): Promise<void> {
    await this.broadcastEvent({
      type: 'subscription',
      creatorId,
      data: {
        action: 'new_subscription',
        ...subscriptionData
      },
      priority: 'high'
    });
  }

  async notifyComment(contentId: string, commentData: any): Promise<void> {
    await this.broadcastEvent({
      type: 'comment',
      data: {
        action: 'comment_added',
        content_id: contentId,
        ...commentData
      }
    });
  }

  async notifyFollow(creatorId: string, followData: any): Promise<void> {
    await this.broadcastEvent({
      type: 'follow',
      creatorId,
      data: {
        action: 'new_follower',
        ...followData
      }
    });
  }

  async notifyContestUpdate(contestId: string, contestData: any): Promise<void> {
    await this.broadcastEvent({
      type: 'contest',
      data: {
        action: 'contest_update',
        contest_id: contestId,
        ...contestData
      }
    });
  }

  async notifySystemEvent(eventData: any): Promise<void> {
    await this.broadcastEvent({
      type: 'system',
      data: {
        action: 'system_notification',
        ...eventData
      }
    });
  }
}

// Export singleton instance
export const realTimeManager = RealTimeManager.getInstance();
export { RealTimeManager };