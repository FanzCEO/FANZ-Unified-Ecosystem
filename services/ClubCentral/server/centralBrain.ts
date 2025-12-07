import { User } from "@shared/schema";

interface CentralUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  platforms: string[];
  createdAt: string;
  updatedAt: string;
}

interface CentralSubscription {
  id: string;
  userId: string;
  creatorId: string;
  platform: string;
  status: string;
  price: string;
  startDate: string;
  endDate?: string;
}

interface PlatformSync {
  action: 'user_created' | 'user_updated' | 'subscription_created' | 'content_created' | 'tip_sent';
  platform: string;
  data: any;
  timestamp: string;
}

export class CentralBrainService {
  private apiKey: string;
  private apiUrl: string;
  private databaseUrl: string;

  constructor() {
    this.apiKey = process.env.CENTRAL_API_KEY!;
    this.apiUrl = process.env.CENTRAL_API_URL!;
    this.databaseUrl = process.env.CENTRAL_DATABASE_URL!;

    if (!this.apiKey || !this.apiUrl || !this.databaseUrl) {
      throw new Error("Central brain configuration missing. Please check environment variables.");
    }
  }

  private async makeRequest(endpoint: string, method: string = 'GET', data?: any) {
    const url = `${this.apiUrl}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'X-Platform': 'fanzclub',
      },
    };

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`Central brain API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Central brain request failed:`, error);
      throw error;
    }
  }

  // User management
  async syncUser(user: User): Promise<CentralUser> {
    console.log(`Syncing user ${user.id} with central brain`);
    
    try {
      // First, try to get existing user
      const existingUser = await this.getCentralUser(user.id);
      
      if (existingUser) {
        // Update existing user
        return await this.makeRequest(`/users/${user.id}`, 'PUT', {
          email: user.email,
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
          profileImageUrl: user.profileImageUrl || undefined,
          platform: 'fanzclub',
        });
      } else {
        // Create new user
        return await this.makeRequest('/users', 'POST', {
          id: user.id,
          email: user.email,
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
          profileImageUrl: user.profileImageUrl || undefined,
          platforms: ['fanzclub'],
        });
      }
    } catch (error) {
      console.error('Failed to sync user with central brain:', error);
      // Don't throw - allow local operation to continue
      return {
        id: user.id,
        email: user.email || '',
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        profileImageUrl: user.profileImageUrl || undefined,
        platforms: ['fanzclub'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  }

  async getCentralUser(userId: string): Promise<CentralUser | null> {
    try {
      return await this.makeRequest(`/users/${userId}`);
    } catch (error) {
      // User doesn't exist in central brain
      return null;
    }
  }

  // Cross-platform user lookup
  async findUserAcrossPlatforms(email: string): Promise<CentralUser | null> {
    try {
      return await this.makeRequest(`/users/search?email=${encodeURIComponent(email)}`);
    } catch (error) {
      console.error('Failed to search user across platforms:', error);
      return null;
    }
  }

  // Subscription coordination
  async syncSubscription(subscription: any, creatorId: string): Promise<void> {
    try {
      await this.makeRequest('/subscriptions', 'POST', {
        id: subscription.id,
        userId: subscription.fanId,
        creatorId: creatorId,
        platform: 'fanzclub',
        status: subscription.status,
        price: subscription.price,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
      });
      
      console.log(`Subscription ${subscription.id} synced with central brain`);
    } catch (error) {
      console.error('Failed to sync subscription:', error);
    }
  }

  // Content coordination
  async syncContent(post: any, creatorId: string): Promise<void> {
    try {
      await this.makeRequest('/content', 'POST', {
        id: post.id,
        creatorId: creatorId,
        platform: 'fanzclub',
        type: post.mediaType || 'text',
        title: post.title,
        visibility: post.visibility,
        price: post.price,
        earnings: post.earnings,
        views: post.views,
        likes: post.likes,
        createdAt: post.createdAt,
      });
      
      console.log(`Content ${post.id} synced with central brain`);
    } catch (error) {
      console.error('Failed to sync content:', error);
    }
  }

  // Tips coordination
  async syncTip(tip: any): Promise<void> {
    try {
      await this.makeRequest('/tips', 'POST', {
        id: tip.id,
        fromUserId: tip.fromUserId,
        toCreatorId: tip.toCreatorId,
        platform: 'fanzclub',
        amount: tip.amount,
        message: tip.message,
        createdAt: tip.createdAt,
      });
      
      console.log(`Tip ${tip.id} synced with central brain`);
    } catch (error) {
      console.error('Failed to sync tip:', error);
    }
  }

  // Platform synchronization events
  async broadcastEvent(event: PlatformSync): Promise<void> {
    try {
      await this.makeRequest('/sync/events', 'POST', event);
      console.log(`Event broadcasted: ${event.action}`);
    } catch (error) {
      console.error('Failed to broadcast event:', error);
    }
  }

  // Get cross-platform analytics
  async getCrossPlateformAnalytics(creatorId: string): Promise<any> {
    try {
      return await this.makeRequest(`/analytics/cross-platform/${creatorId}`);
    } catch (error) {
      console.error('Failed to get cross-platform analytics:', error);
      return {
        totalEarnings: 0,
        totalSubscribers: 0,
        totalContent: 0,
        platforms: [],
      };
    }
  }

  // Get user's activity across all platforms
  async getUserActivity(userId: string): Promise<any> {
    try {
      return await this.makeRequest(`/users/${userId}/activity`);
    } catch (error) {
      console.error('Failed to get user activity:', error);
      return {
        subscriptions: [],
        tips: [],
        content: [],
        platforms: [],
      };
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.makeRequest('/health');
      return true;
    } catch (error) {
      console.error('Central brain health check failed:', error);
      return false;
    }
  }
}

export const centralBrain = new CentralBrainService();