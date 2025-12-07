import { storage } from './storage';

export interface UserTag {
  id: string;
  username: string;
  displayName: string;
  profileImageUrl?: string;
  isVerified: boolean;
  costarVerifications?: any[];
}

export interface TaggedContent {
  contentId: string;
  contentType: 'post' | 'message' | 'short_video';
  taggedUsers: UserTag[];
  createdAt: Date;
}

export class UserTaggingService {
  
  // Extract @username mentions from content
  extractUserTags(content: string): string[] {
    const mentionRegex = /@([a-zA-Z0-9_]+)/g;
    const mentions: string[] = [];
    let match;
    
    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1].toLowerCase()); // Store lowercase for consistency
    }
    
    return Array.from(new Set(mentions)); // Remove duplicates
  }
  
  // Process tagged users and return user information
  async processUserTags(content: string): Promise<{
    taggedUsers: UserTag[];
    processedContent: string;
  }> {
    const taggedUsernames = this.extractUserTags(content);
    const taggedUsers: UserTag[] = [];
    let processedContent = content;
    
    for (const username of taggedUsernames) {
      const user = await storage.getUserByUsername(username);
      
      if (user) {
        // Get costar verifications for this user if they're a creator
        const costarVerifications = user.role === 'creator' 
          ? await storage.getCostarVerificationsByCreator(user.id)
          : [];
        
        taggedUsers.push({
          id: user.id,
          username: user.username!,
          displayName: user.displayName || user.username!,
          profileImageUrl: user.profileImageUrl,
          isVerified: user.isVerified,
          costarVerifications
        });
      }
    }
    
    return {
      taggedUsers,
      processedContent
    };
  }
  
  // Get user tag information for admin view
  async getUserTagInfo(username: string, requestingUserId: string): Promise<{
    userInfo: UserTag;
    canViewDetails: boolean;
    costarForms: any[];
  } | null> {
    const user = await storage.getUserByUsername(username);
    if (!user) return null;
    
    const requestingUser = await storage.getUser(requestingUserId);
    const canViewDetails = requestingUser?.role === 'admin';
    
    let costarForms: any[] = [];
    
    if (canViewDetails) {
      // Admin can see all costar verification forms
      costarForms = await storage.getCostarVerificationsByCreator(user.id);
      
      // Also get forms where this user was a co-star
      const costarVerifications = await storage.getCostarVerificationsByCostar(user.id);
      costarForms = [...costarForms, ...costarVerifications];
    }
    
    return {
      userInfo: {
        id: user.id,
        username: user.username!,
        displayName: user.displayName || user.username!,
        profileImageUrl: user.profileImageUrl,
        isVerified: user.isVerified,
        costarVerifications: canViewDetails ? costarForms : []
      },
      canViewDetails,
      costarForms: canViewDetails ? costarForms : []
    };
  }
  
  // Create tagged content record
  async createTaggedContent(
    contentId: string,
    contentType: 'post' | 'message' | 'short_video',
    taggedUsers: UserTag[]
  ): Promise<void> {
    // Store tagged content in database for tracking
    const taggedContent: TaggedContent = {
      contentId,
      contentType,
      taggedUsers,
      createdAt: new Date()
    };
    
    await storage.createTaggedContent(taggedContent);
    
    // Send notifications to tagged users
    for (const taggedUser of taggedUsers) {
      await this.sendTagNotification(taggedUser.id, contentId, contentType);
    }
  }
  
  // Get brand logo for regular users (non-admin)
  getBrandLogo(): { logoUrl: string; altText: string } {
    return {
      logoUrl: '/assets/fanz-logo.png',
      altText: 'Fanz Unlimited Network - Verified Co-Star'
    };
  }
  
  // Render tagged username for display
  renderTaggedUsername(
    username: string, 
    userInfo: UserTag | null, 
    viewerRole: 'admin' | 'creator' | 'fanz',
    isClickable: boolean = true
  ): string {
    if (!userInfo) {
      return `@${username}`;
    }
    
    const brandLogo = this.getBrandLogo();
    
    if (viewerRole === 'admin' && isClickable) {
      // Admin sees clickable username that shows costar forms
      return `<span class="tagged-user admin-view" 
                data-username="${username}" 
                data-user-id="${userInfo.id}"
                onclick="showCostarForms('${userInfo.id}')">
                @${username}
                ${userInfo.costarVerifications && userInfo.costarVerifications.length > 0 
                  ? '<span class="verified-costar-badge">⭐</span>' 
                  : ''}
              </span>`;
    } else {
      // Regular users and creators see brand logo
      return `<span class="tagged-user public-view" data-username="${username}">
                @${username}
                <img src="${brandLogo.logoUrl}" 
                     alt="${brandLogo.altText}" 
                     class="brand-logo-small" 
                     width="16" height="16" />
              </span>`;
    }
  }
  
  // Send notification when user is tagged
  private async sendTagNotification(
    userId: string, 
    contentId: string, 
    contentType: string
  ): Promise<void> {
    try {
      // In production, would send push notification or email
      console.log(`Sending tag notification to user ${userId} for ${contentType} ${contentId}`);
    } catch (error) {
      console.error('Error sending tag notification:', error);
    }
  }
  
  // Search users for tagging suggestions
  async searchUsersForTagging(query: string, limit: number = 10): Promise<UserTag[]> {
    if (query.length < 2) return [];
    
    const users = await storage.searchUsersByUsername(query, limit);
    
    return users.map(user => ({
      id: user.id,
      username: user.username!,
      displayName: user.displayName || user.username!,
      profileImageUrl: user.profileImageUrl,
      isVerified: user.isVerified
    }));
  }
}

export const userTaggingService = new UserTaggingService();