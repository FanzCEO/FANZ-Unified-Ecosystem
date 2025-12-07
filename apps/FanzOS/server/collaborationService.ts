import { storage } from './storage';
import { createNotification } from './notificationService';

export interface CollaborationOpportunity {
  id: string;
  type: 'live_stream' | 'content_creation' | 'cross_promotion' | 'event' | 'challenge';
  title: string;
  description: string;
  creatorId: string;
  requirements: string[];
  duration: string;
  expectedEarnings: number;
  deadline: Date;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  maxParticipants?: number;
  currentParticipants: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CollaborationApplication {
  id: string;
  opportunityId: string;
  applicantId: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
}

export interface CollaborationStats {
  activeOpportunities: number;
  completedCollaborations: number;
  totalEarnings: number;
  successRate: number;
}

class CollaborationService {
  async createOpportunity(opportunityData: Partial<CollaborationOpportunity>): Promise<CollaborationOpportunity> {
    try {
      const opportunity = {
        ...opportunityData,
        id: `collab_${Date.now()}`,
        status: 'open' as const,
        currentParticipants: [opportunityData.creatorId!],
        createdAt: new Date(),
        updatedAt: new Date()
      } as CollaborationOpportunity;

      const savedOpportunity = await storage.createCollaborationOpportunity(opportunity);
      
      // Notify relevant users about the new opportunity
      await this.notifyPotentialCollaborators(savedOpportunity);
      
      return savedOpportunity;
    } catch (error) {
      console.error('Error creating collaboration opportunity:', error);
      throw new Error('Failed to create collaboration opportunity');
    }
  }

  async getOpportunities(filters?: {
    type?: string;
    userId?: string;
    status?: string;
    limit?: number;
  }): Promise<CollaborationOpportunity[]> {
    try {
      let opportunities = await storage.getCollaborationOpportunities();
      
      // Apply filters
      if (filters?.type && filters.type !== 'all') {
        opportunities = opportunities.filter(opp => opp.type === filters.type);
      }
      
      if (filters?.status) {
        opportunities = opportunities.filter(opp => opp.status === filters.status);
      }
      
      // Exclude opportunities created by the current user from discovery
      if (filters?.userId) {
        opportunities = opportunities.filter(opp => opp.creatorId !== filters.userId);
      }
      
      // Sort by creation date (newest first) and apply limit
      opportunities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      if (filters?.limit) {
        opportunities = opportunities.slice(0, filters.limit);
      }
      
      return opportunities;
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      throw new Error('Failed to fetch collaboration opportunities');
    }
  }

  async joinOpportunity(opportunityId: string, userId: string, message?: string): Promise<void> {
    try {
      const opportunity = await storage.getCollaborationOpportunity(opportunityId);
      if (!opportunity) {
        throw new Error('Opportunity not found');
      }
      
      if (opportunity.status !== 'open') {
        throw new Error('This opportunity is no longer accepting applications');
      }
      
      if (opportunity.currentParticipants.includes(userId)) {
        throw new Error('You have already applied to this opportunity');
      }
      
      // Create application
      const application: CollaborationApplication = {
        id: `app_${Date.now()}`,
        opportunityId,
        applicantId: userId,
        message: message || '',
        status: 'pending',
        createdAt: new Date()
      };
      
      await storage.createCollaborationApplication(application);
      
      // Notify the opportunity creator
      await createNotification(
        opportunity.creatorId,
        'collaboration_application',
        'New Collaboration Application',
        `Someone wants to join your "${opportunity.title}" collaboration!`
      );
      
    } catch (error) {
      console.error('Error joining opportunity:', error);
      throw error;
    }
  }

  async getUserCollaborations(userId: string): Promise<CollaborationOpportunity[]> {
    try {
      // Get opportunities created by user and opportunities they've joined
      const allOpportunities = await storage.getCollaborationOpportunities();
      
      const userCollaborations = allOpportunities.filter(opp => 
        opp.creatorId === userId || opp.currentParticipants.includes(userId)
      );
      
      return userCollaborations.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    } catch (error) {
      console.error('Error fetching user collaborations:', error);
      throw new Error('Failed to fetch user collaborations');
    }
  }

  async getCollaborationStats(userId: string): Promise<CollaborationStats> {
    try {
      const userCollaborations = await this.getUserCollaborations(userId);
      
      const stats: CollaborationStats = {
        activeOpportunities: userCollaborations.filter(c => c.status === 'open' || c.status === 'in_progress').length,
        completedCollaborations: userCollaborations.filter(c => c.status === 'completed').length,
        totalEarnings: userCollaborations
          .filter(c => c.status === 'completed')
          .reduce((sum, c) => sum + c.expectedEarnings, 0),
        successRate: 0
      };
      
      // Calculate success rate
      const totalParticipated = userCollaborations.filter(c => c.status !== 'open').length;
      if (totalParticipated > 0) {
        stats.successRate = (stats.completedCollaborations / totalParticipated) * 100;
      }
      
      return stats;
    } catch (error) {
      console.error('Error calculating collaboration stats:', error);
      return {
        activeOpportunities: 0,
        completedCollaborations: 0,
        totalEarnings: 0,
        successRate: 0
      };
    }
  }

  async acceptApplication(applicationId: string, creatorId: string): Promise<void> {
    try {
      const application = await storage.getCollaborationApplication(applicationId);
      if (!application) {
        throw new Error('Application not found');
      }
      
      const opportunity = await storage.getCollaborationOpportunity(application.opportunityId);
      if (!opportunity || opportunity.creatorId !== creatorId) {
        throw new Error('Access denied');
      }
      
      // Update application status
      await storage.updateCollaborationApplication(applicationId, { status: 'accepted' });
      
      // Add participant to opportunity
      const updatedParticipants = [...opportunity.currentParticipants, application.applicantId];
      await storage.updateCollaborationOpportunity(application.opportunityId, {
        currentParticipants: updatedParticipants,
        status: 'in_progress',
        updatedAt: new Date()
      });
      
      // Notify the accepted participant
      await createNotification(
        application.applicantId,
        'collaboration_accepted',
        'Collaboration Accepted!',
        `Your application for "${opportunity.title}" has been accepted!`
      );
      
    } catch (error) {
      console.error('Error accepting application:', error);
      throw error;
    }
  }

  async rejectApplication(applicationId: string, creatorId: string): Promise<void> {
    try {
      const application = await storage.getCollaborationApplication(applicationId);
      if (!application) {
        throw new Error('Application not found');
      }
      
      const opportunity = await storage.getCollaborationOpportunity(application.opportunityId);
      if (!opportunity || opportunity.creatorId !== creatorId) {
        throw new Error('Access denied');
      }
      
      // Update application status
      await storage.updateCollaborationApplication(applicationId, { status: 'rejected' });
      
      // Notify the rejected participant
      await createNotification(
        application.applicantId,
        'collaboration_rejected',
        'Collaboration Application Update',
        `Thank you for your interest in "${opportunity.title}". We've chosen to move forward with other candidates.`
      );
      
    } catch (error) {
      console.error('Error rejecting application:', error);
      throw error;
    }
  }

  private async notifyPotentialCollaborators(opportunity: CollaborationOpportunity): Promise<void> {
    try {
      // In a real implementation, this would use AI to find relevant creators
      // based on their interests, collaboration history, and compatibility
      
      // For now, we'll just notify recent active creators
      const activeCreators = await storage.getActiveCreators(24); // Last 24 hours
      
      const relevantCreators = activeCreators
        .filter(creator => creator.id !== opportunity.creatorId)
        .slice(0, 5); // Limit notifications
      
      for (const creator of relevantCreators) {
        await createNotification(
          creator.id,
          'new_collaboration_opportunity',
          'New Collaboration Opportunity',
          `New ${opportunity.type.replace('_', ' ')} collaboration: "${opportunity.title}"`
        );
      }
    } catch (error) {
      console.error('Error notifying potential collaborators:', error);
      // Don't throw here as this is a non-critical operation
    }
  }

  async generateRecommendations(userId: string): Promise<CollaborationOpportunity[]> {
    try {
      // Get user's profile and preferences
      const user = await storage.getUser(userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      // Get all available opportunities
      const opportunities = await this.getOpportunities({
        status: 'open',
        userId: userId // Exclude user's own opportunities
      });
      
      // Simple scoring algorithm based on:
      // - User's role and experience
      // - Previous collaboration success
      // - Matching interests (if available)
      
      const scored = opportunities.map(opp => ({
        ...opp,
        recommendationScore: this.calculateRecommendationScore(opp, user),
        recommendationReason: this.getRecommendationReason(opp, user)
      }));
      
      // Sort by score and return top recommendations
      return scored
        .sort((a, b) => b.recommendationScore - a.recommendationScore)
        .slice(0, 10);
        
    } catch (error) {
      console.error('Error generating recommendations:', error);
      throw new Error('Failed to generate recommendations');
    }
  }

  private calculateRecommendationScore(opportunity: CollaborationOpportunity, user: any): number {
    let score = 50; // Base score
    
    // Boost score for opportunities that match user's activity level
    if (user.weeklyPostCount > 5 && opportunity.difficulty === 'advanced') {
      score += 20;
    } else if (user.weeklyPostCount <= 2 && opportunity.difficulty === 'beginner') {
      score += 15;
    }
    
    // Boost for reasonable earnings
    if (opportunity.expectedEarnings > 0) {
      score += Math.min(opportunity.expectedEarnings / 10, 20);
    }
    
    // Boost for recent opportunities
    const daysSinceCreated = (Date.now() - opportunity.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreated < 1) score += 15;
    else if (daysSinceCreated < 3) score += 10;
    
    // Boost for certain collaboration types
    if (opportunity.type === 'content_creation') score += 10;
    if (opportunity.type === 'cross_promotion') score += 8;
    
    return Math.min(Math.max(score, 0), 100);
  }

  private getRecommendationReason(opportunity: CollaborationOpportunity, user: any): string {
    if (opportunity.expectedEarnings > 100) return 'high_earnings';
    if (opportunity.type === 'content_creation') return 'matches_interests';
    if (opportunity.difficulty === 'beginner') return 'beginner_friendly';
    
    const daysSinceCreated = (Date.now() - opportunity.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreated < 1) return 'new_opportunity';
    
    return 'recommended_for_you';
  }
}

export const collaborationService = new CollaborationService();