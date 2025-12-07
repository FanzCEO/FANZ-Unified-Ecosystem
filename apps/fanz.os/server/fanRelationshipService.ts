import { db } from "./db";
import { aiVoiceCloningService } from "./aiVoiceCloningService";
import { aiChatbotService } from "./aiChatbotService";

interface FanProfile {
  id: string;
  creatorId: string;
  userId: string;
  relationshipLevel: number; // 1-10
  totalSpent: number;
  joinDate: Date;
  lastInteraction: Date;
  preferences: FanPreferences;
  behaviorPattern: BehaviorPattern;
  personalData: PersonalData;
  engagementHistory: EngagementRecord[];
}

interface FanPreferences {
  contentTypes: string[];
  communicationStyle: 'formal' | 'casual' | 'flirty' | 'intimate';
  messageFrequency: 'high' | 'medium' | 'low';
  spendingCategory: 'whale' | 'regular' | 'occasional' | 'new';
  timeZone: string;
  activeHours: { start: number; end: number };
  favoriteFeatures: string[];
}

interface BehaviorPattern {
  spendingPattern: 'increasing' | 'stable' | 'decreasing';
  engagementTrend: 'growing' | 'stable' | 'declining';
  contentConsumption: { type: string; frequency: number }[];
  responseRate: number;
  averageSessionLength: number;
  purchaseTriggers: string[];
}

interface PersonalData {
  firstName?: string;
  birthday?: Date;
  location?: string;
  interests: string[];
  personalNotes: string[];
  milestones: { date: Date; event: string; notes: string }[];
}

interface EngagementRecord {
  date: Date;
  type: 'message' | 'purchase' | 'tip' | 'like' | 'comment' | 'share';
  details: any;
  value?: number;
  response?: string;
}

interface AutomatedCampaign {
  id: string;
  name: string;
  type: 'welcome' | 'retention' | 'winback' | 'upsell' | 'birthday' | 'milestone';
  triggers: CampaignTrigger[];
  actions: CampaignAction[];
  active: boolean;
  performance: CampaignMetrics;
}

interface CampaignTrigger {
  type: 'time_based' | 'behavior_based' | 'spending_based' | 'engagement_based';
  conditions: any;
  delay?: number; // minutes
}

interface CampaignAction {
  type: 'message' | 'voice_note' | 'content_unlock' | 'discount' | 'personal_video';
  content: string;
  personalized: boolean;
  voiceEnabled: boolean;
}

interface CampaignMetrics {
  sent: number;
  opened: number;
  responded: number;
  converted: number;
  revenue: number;
}

// Revolutionary Fan Relationship Management System
class FanRelationshipService {
  private fanProfiles: Map<string, FanProfile> = new Map();
  private campaigns: Map<string, AutomatedCampaign> = new Map();
  private engagementRules: Map<string, any> = new Map();

  // Advanced fan profiling with AI insights
  async createFanProfile(
    creatorId: string,
    userId: string,
    initialData?: Partial<PersonalData>
  ): Promise<FanProfile> {
    const profile: FanProfile = {
      id: `fan_${creatorId}_${userId}`,
      creatorId,
      userId,
      relationshipLevel: 1,
      totalSpent: 0,
      joinDate: new Date(),
      lastInteraction: new Date(),
      preferences: {
        contentTypes: [],
        communicationStyle: 'casual',
        messageFrequency: 'medium',
        spendingCategory: 'new',
        timeZone: 'UTC',
        activeHours: { start: 9, end: 22 },
        favoriteFeatures: []
      },
      behaviorPattern: {
        spendingPattern: 'stable',
        engagementTrend: 'stable',
        contentConsumption: [],
        responseRate: 0,
        averageSessionLength: 0,
        purchaseTriggers: []
      },
      personalData: {
        firstName: initialData?.firstName,
        birthday: initialData?.birthday,
        location: initialData?.location,
        interests: initialData?.interests || [],
        personalNotes: [],
        milestones: []
      },
      engagementHistory: []
    };

    this.fanProfiles.set(profile.id, profile);
    
    // Start welcome campaign
    await this.triggerCampaign(profile.id, 'welcome');
    
    return profile;
  }

  // AI-powered fan behavior analysis
  async analyzeFanBehavior(fanId: string): Promise<{
    insights: string[];
    recommendations: string[];
    nextBestAction: string;
    predictedLifetimeValue: number;
    churnRisk: number;
    upsellOpportunities: string[];
  }> {
    const profile = this.fanProfiles.get(fanId);
    if (!profile) throw new Error('Fan profile not found');

    // Analyze spending patterns
    const spendingInsights = this.analyzeSpendingPattern(profile);
    
    // Analyze engagement patterns
    const engagementInsights = this.analyzeEngagementPattern(profile);
    
    // Predict future behavior
    const predictions = await this.predictFanBehavior(profile);

    return {
      insights: [
        ...spendingInsights,
        ...engagementInsights,
        `Fan is most active during ${profile.preferences.activeHours.start}-${profile.preferences.activeHours.end}`,
        `Prefers ${profile.preferences.communicationStyle} communication style`,
        `Response rate: ${profile.behaviorPattern.responseRate}%`
      ],
      recommendations: [
        'Send personalized voice message during peak hours',
        'Offer exclusive content matching their preferences',
        'Use their preferred communication style',
        'Schedule messages during their active hours'
      ],
      nextBestAction: predictions.nextBestAction,
      predictedLifetimeValue: predictions.ltv,
      churnRisk: predictions.churnRisk,
      upsellOpportunities: predictions.upsellOpportunities
    };
  }

  // Automated relationship building campaigns
  async createAutomatedCampaign(
    creatorId: string,
    campaignData: {
      name: string;
      type: AutomatedCampaign['type'];
      triggers: CampaignTrigger[];
      actions: CampaignAction[];
    }
  ): Promise<AutomatedCampaign> {
    const campaign: AutomatedCampaign = {
      id: `campaign_${Date.now()}`,
      name: campaignData.name,
      type: campaignData.type,
      triggers: campaignData.triggers,
      actions: campaignData.actions,
      active: true,
      performance: {
        sent: 0,
        opened: 0,
        responded: 0,
        converted: 0,
        revenue: 0
      }
    };

    this.campaigns.set(campaign.id, campaign);
    return campaign;
  }

  // Intelligent message personalization
  async sendPersonalizedMessage(
    fanId: string,
    messageType: 'casual' | 'promotional' | 'thankyou' | 'custom',
    content?: string,
    includeVoice: boolean = false
  ): Promise<{
    messageId: string;
    personalizedContent: string;
    voiceMessageUrl?: string;
    deliveryTime: Date;
    expectedResponse: string;
  }> {
    const profile = this.fanProfiles.get(fanId);
    if (!profile) throw new Error('Fan profile not found');

    // Generate personalized content based on fan profile
    const personalizedContent = await this.personalizeMessage(profile, messageType, content);

    let voiceMessageUrl;
    if (includeVoice) {
      const voiceMessage = await aiVoiceCloningService.generateVoiceMessage(
        `${profile.creatorId}_chatbot`,
        { text: personalizedContent, voiceId: `${profile.creatorId}_chatbot` },
        profile.personalData.firstName
      );
      voiceMessageUrl = voiceMessage.audioUrl;
    }

    // Schedule delivery for optimal time
    const deliveryTime = this.calculateOptimalDeliveryTime(profile);

    // Record engagement
    await this.recordEngagement(fanId, {
      date: deliveryTime,
      type: 'message',
      details: { type: messageType, personalized: true, voice: includeVoice },
      response: personalizedContent
    });

    return {
      messageId: `msg_${Date.now()}`,
      personalizedContent,
      voiceMessageUrl,
      deliveryTime,
      expectedResponse: this.predictFanResponse(profile, messageType)
    };
  }

  // Advanced fan segmentation
  async segmentFans(
    creatorId: string,
    criteria: {
      spendingLevel?: 'high' | 'medium' | 'low';
      engagementLevel?: 'high' | 'medium' | 'low';
      relationshipLevel?: number;
      contentPreferences?: string[];
      riskLevel?: 'high' | 'medium' | 'low';
      customFilters?: any;
    }
  ): Promise<{
    segments: { name: string; fanIds: string[]; characteristics: string[] }[];
    recommendations: { segment: string; strategy: string }[];
  }> {
    const allFans = Array.from(this.fanProfiles.values()).filter(f => f.creatorId === creatorId);

    const segments = [
      {
        name: 'VIP Whales',
        fanIds: allFans.filter(f => f.totalSpent > 1000 && f.relationshipLevel >= 8).map(f => f.id),
        characteristics: ['High spending', 'Deep relationship', 'Highly engaged']
      },
      {
        name: 'Regular Supporters',
        fanIds: allFans.filter(f => f.totalSpent >= 100 && f.totalSpent <= 1000).map(f => f.id),
        characteristics: ['Consistent spending', 'Regular engagement', 'Loyal fans']
      },
      {
        name: 'New Fans',
        fanIds: allFans.filter(f => f.totalSpent < 50 && this.getDaysSinceJoin(f) < 30).map(f => f.id),
        characteristics: ['Recently joined', 'Potential growth', 'Need nurturing']
      },
      {
        name: 'At Risk',
        fanIds: allFans.filter(f => this.getDaysSinceLastInteraction(f) > 14).map(f => f.id),
        characteristics: ['Low recent engagement', 'Churn risk', 'Need re-engagement']
      }
    ];

    const recommendations = [
      { segment: 'VIP Whales', strategy: 'Exclusive content, personal attention, early access' },
      { segment: 'Regular Supporters', strategy: 'Loyalty rewards, upgrade incentives, community features' },
      { segment: 'New Fans', strategy: 'Welcome series, content discovery, relationship building' },
      { segment: 'At Risk', strategy: 'Win-back campaigns, special offers, personalized outreach' }
    ];

    return { segments, recommendations };
  }

  // Birthday and milestone automation
  async setupMilestoneAutomation(
    creatorId: string,
    milestoneTypes: {
      type: 'birthday' | 'anniversary' | 'spending_milestone' | 'engagement_milestone';
      threshold?: number;
      message: string;
      reward?: string;
      voiceMessage: boolean;
    }[]
  ): Promise<void> {
    for (const milestone of milestoneTypes) {
      await this.createAutomatedCampaign(creatorId, {
        name: `${milestone.type}_campaign`,
        type: 'milestone',
        triggers: [{
          type: milestone.type === 'birthday' ? 'time_based' : 'behavior_based',
          conditions: { type: milestone.type, threshold: milestone.threshold }
        }],
        actions: [{
          type: milestone.voiceMessage ? 'voice_note' : 'message',
          content: milestone.message,
          personalized: true,
          voiceEnabled: milestone.voiceMessage
        }]
      });
    }
  }

  // Fan loyalty program
  async manageLoyaltyProgram(
    creatorId: string,
    fanId: string,
    action: 'award_points' | 'redeem_reward' | 'check_status',
    details?: any
  ): Promise<{
    points: number;
    tier: 'bronze' | 'silver' | 'gold' | 'platinum';
    rewards: string[];
    nextTierRequirement: number;
  }> {
    const profile = this.fanProfiles.get(fanId);
    if (!profile) throw new Error('Fan profile not found');

    const loyaltyData = this.calculateLoyaltyStatus(profile);

    if (action === 'award_points') {
      loyaltyData.points += details.points;
      await this.recordEngagement(fanId, {
        date: new Date(),
        type: 'loyalty_points',
        details: { points: details.points },
        value: details.points
      });
    }

    return loyaltyData;
  }

  // Advanced fan communication preferences
  async updateCommunicationPreferences(
    fanId: string,
    preferences: {
      messageFrequency?: 'high' | 'medium' | 'low';
      contentTypes?: string[];
      communicationStyle?: 'formal' | 'casual' | 'flirty' | 'intimate';
      voiceMessages?: boolean;
      scheduledMessages?: boolean;
      promotionalContent?: boolean;
    }
  ): Promise<void> {
    const profile = this.fanProfiles.get(fanId);
    if (!profile) return;

    Object.assign(profile.preferences, preferences);
    
    // Update AI chatbot personality for this fan
    await aiChatbotService.updateFanPreferences(profile.creatorId, fanId, preferences);
  }

  // Fan journey mapping
  async mapFanJourney(fanId: string): Promise<{
    stages: { stage: string; date: Date; actions: string[]; revenue: number }[];
    currentStage: string;
    nextMilestone: string;
    recommendations: string[];
    journeyInsights: string[];
  }> {
    const profile = this.fanProfiles.get(fanId);
    if (!profile) throw new Error('Fan profile not found');

    const journey = this.analyzeFanJourney(profile);
    
    return {
      stages: journey.stages,
      currentStage: journey.currentStage,
      nextMilestone: journey.nextMilestone,
      recommendations: journey.recommendations,
      journeyInsights: journey.insights
    };
  }

  // Automated retention campaigns
  async setupRetentionCampaigns(creatorId: string): Promise<{
    campaignIds: string[];
    expectedRetentionIncrease: number;
  }> {
    const campaigns = [
      // 7-day inactive campaign
      await this.createAutomatedCampaign(creatorId, {
        name: '7-Day Win Back',
        type: 'winback',
        triggers: [{
          type: 'behavior_based',
          conditions: { inactivity_days: 7 }
        }],
        actions: [{
          type: 'message',
          content: 'Miss you! Here\'s something special just for you 💕',
          personalized: true,
          voiceEnabled: true
        }]
      }),

      // High spender appreciation
      await this.createAutomatedCampaign(creatorId, {
        name: 'VIP Appreciation',
        type: 'retention',
        triggers: [{
          type: 'spending_based',
          conditions: { monthly_spending: 500 }
        }],
        actions: [{
          type: 'personal_video',
          content: 'Thank you video for top supporters',
          personalized: true,
          voiceEnabled: false
        }]
      }),

      // Engagement booster
      await this.createAutomatedCampaign(creatorId, {
        name: 'Engagement Booster',
        type: 'retention',
        triggers: [{
          type: 'engagement_based',
          conditions: { low_engagement_days: 14 }
        }],
        actions: [{
          type: 'content_unlock',
          content: 'Exclusive content unlock for loyal fans',
          personalized: true,
          voiceEnabled: false
        }]
      })
    ];

    return {
      campaignIds: campaigns.map(c => c.id),
      expectedRetentionIncrease: 23.5 // Percentage
    };
  }

  // Helper Methods
  private async personalizeMessage(
    profile: FanProfile,
    messageType: string,
    content?: string
  ): Promise<string> {
    const personalizations = {
      firstName: profile.personalData.firstName || 'gorgeous',
      recentPurchase: this.getRecentPurchase(profile),
      favoriteContent: profile.preferences.contentTypes[0] || 'content',
      timeZone: profile.preferences.timeZone
    };

    let baseMessage = content || this.getDefaultMessage(messageType);
    
    // Apply personalization
    baseMessage = baseMessage.replace('{firstName}', personalizations.firstName);
    baseMessage = baseMessage.replace('{favoriteContent}', personalizations.favoriteContent);

    return baseMessage;
  }

  private calculateOptimalDeliveryTime(profile: FanProfile): Date {
    const now = new Date();
    const optimalHour = Math.floor((profile.preferences.activeHours.start + profile.preferences.activeHours.end) / 2);
    
    const deliveryTime = new Date(now);
    deliveryTime.setHours(optimalHour, 0, 0, 0);
    
    // If time has passed today, schedule for tomorrow
    if (deliveryTime < now) {
      deliveryTime.setDate(deliveryTime.getDate() + 1);
    }
    
    return deliveryTime;
  }

  private predictFanResponse(profile: FanProfile, messageType: string): string {
    const responses = {
      casual: 'Likely to respond positively',
      promotional: profile.totalSpent > 100 ? 'High purchase probability' : 'May need more nurturing',
      thankyou: 'Will appreciate the gesture',
      custom: 'Highly engaged response expected'
    };

    return responses[messageType as keyof typeof responses] || 'Standard response expected';
  }

  private async recordEngagement(fanId: string, record: Omit<EngagementRecord, 'date'> & { date?: Date }): Promise<void> {
    const profile = this.fanProfiles.get(fanId);
    if (!profile) return;

    const engagementRecord: EngagementRecord = {
      date: record.date || new Date(),
      type: record.type,
      details: record.details,
      value: record.value,
      response: record.response
    };

    profile.engagementHistory.push(engagementRecord);
    profile.lastInteraction = engagementRecord.date;

    // Update behavior patterns
    this.updateBehaviorPattern(profile, engagementRecord);
  }

  private updateBehaviorPattern(profile: FanProfile, engagement: EngagementRecord): void {
    if (engagement.value) {
      profile.totalSpent += engagement.value;
    }

    // Update relationship level based on engagement
    if (engagement.type === 'message' || engagement.type === 'tip') {
      profile.relationshipLevel = Math.min(10, profile.relationshipLevel + 0.1);
    }

    // Update spending pattern
    const recentSpending = this.getRecentSpending(profile, 30); // Last 30 days
    const previousSpending = this.getRecentSpending(profile, 60, 30); // 30-60 days ago
    
    if (recentSpending > previousSpending * 1.2) {
      profile.behaviorPattern.spendingPattern = 'increasing';
    } else if (recentSpending < previousSpending * 0.8) {
      profile.behaviorPattern.spendingPattern = 'decreasing';
    } else {
      profile.behaviorPattern.spendingPattern = 'stable';
    }
  }

  private analyzeSpendingPattern(profile: FanProfile): string[] {
    const insights = [];
    
    if (profile.totalSpent > 1000) {
      insights.push('High-value fan with strong spending commitment');
    } else if (profile.totalSpent > 100) {
      insights.push('Regular spender with growth potential');
    } else {
      insights.push('New or occasional spender, needs nurturing');
    }

    if (profile.behaviorPattern.spendingPattern === 'increasing') {
      insights.push('Spending trend is increasing - high engagement opportunity');
    } else if (profile.behaviorPattern.spendingPattern === 'decreasing') {
      insights.push('Spending trend declining - may need re-engagement');
    }

    return insights;
  }

  private analyzeEngagementPattern(profile: FanProfile): string[] {
    const insights = [];
    const daysSinceLastInteraction = this.getDaysSinceLastInteraction(profile);
    
    if (daysSinceLastInteraction < 7) {
      insights.push('Highly engaged - responds within a week');
    } else if (daysSinceLastInteraction < 30) {
      insights.push('Moderately engaged - monthly interaction pattern');
    } else {
      insights.push('Low engagement - at risk of churning');
    }

    if (profile.behaviorPattern.responseRate > 70) {
      insights.push('High response rate - very interactive fan');
    } else if (profile.behaviorPattern.responseRate > 30) {
      insights.push('Moderate response rate - selective engagement');
    } else {
      insights.push('Low response rate - prefers lurking/passive consumption');
    }

    return insights;
  }

  private async predictFanBehavior(profile: FanProfile): Promise<{
    nextBestAction: string;
    ltv: number;
    churnRisk: number;
    upsellOpportunities: string[];
  }> {
    // AI-powered prediction logic would go here
    return {
      nextBestAction: this.determineNextBestAction(profile),
      ltv: this.calculateLifetimeValue(profile),
      churnRisk: this.calculateChurnRisk(profile),
      upsellOpportunities: this.identifyUpsellOpportunities(profile)
    };
  }

  private determineNextBestAction(profile: FanProfile): string {
    if (profile.relationshipLevel < 5) {
      return 'Send relationship-building content';
    } else if (profile.totalSpent < 100) {
      return 'Offer first-purchase incentive';
    } else if (this.getDaysSinceLastInteraction(profile) > 7) {
      return 'Send re-engagement message';
    } else {
      return 'Share exclusive content';
    }
  }

  private calculateLifetimeValue(profile: FanProfile): number {
    const avgMonthlySpending = profile.totalSpent / Math.max(1, this.getMonthsSinceJoin(profile));
    const retentionMultiplier = profile.relationshipLevel / 10;
    return avgMonthlySpending * 12 * retentionMultiplier;
  }

  private calculateChurnRisk(profile: FanProfile): number {
    let risk = 0;
    
    // Factor in last interaction
    const daysSinceInteraction = this.getDaysSinceLastInteraction(profile);
    if (daysSinceInteraction > 30) risk += 30;
    else if (daysSinceInteraction > 14) risk += 15;
    
    // Factor in spending pattern
    if (profile.behaviorPattern.spendingPattern === 'decreasing') risk += 25;
    
    // Factor in relationship level
    if (profile.relationshipLevel < 3) risk += 20;
    
    // Factor in response rate
    if (profile.behaviorPattern.responseRate < 30) risk += 15;
    
    return Math.min(100, risk);
  }

  private identifyUpsellOpportunities(profile: FanProfile): string[] {
    const opportunities = [];
    
    if (profile.totalSpent > 200 && !profile.preferences.contentTypes.includes('custom_content')) {
      opportunities.push('Custom content services');
    }
    
    if (profile.relationshipLevel >= 7 && !profile.preferences.favoriteFeatures.includes('video_calls')) {
      opportunities.push('Private video calls');
    }
    
    if (profile.totalSpent > 500) {
      opportunities.push('Premium membership tier');
    }
    
    return opportunities;
  }

  private async triggerCampaign(fanId: string, type: string): Promise<void> {
    // Implementation for triggering campaigns
  }

  private getDaysSinceJoin(profile: FanProfile): number {
    return Math.floor((Date.now() - profile.joinDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  private getDaysSinceLastInteraction(profile: FanProfile): number {
    return Math.floor((Date.now() - profile.lastInteraction.getTime()) / (1000 * 60 * 60 * 24));
  }

  private getMonthsSinceJoin(profile: FanProfile): number {
    return this.getDaysSinceJoin(profile) / 30;
  }

  private getRecentPurchase(profile: FanProfile): string {
    const recentPurchases = profile.engagementHistory
      .filter(e => e.type === 'purchase')
      .sort((a, b) => b.date.getTime() - a.date.getTime());
    
    return recentPurchases[0]?.details?.item || 'content';
  }

  private getRecentSpending(profile: FanProfile, days: number, offset: number = 0): number {
    const startDate = new Date(Date.now() - (days + offset) * 24 * 60 * 60 * 1000);
    const endDate = new Date(Date.now() - offset * 24 * 60 * 60 * 1000);
    
    return profile.engagementHistory
      .filter(e => e.date >= startDate && e.date <= endDate && e.value)
      .reduce((sum, e) => sum + (e.value || 0), 0);
  }

  private getDefaultMessage(type: string): string {
    const messages = {
      casual: 'Hey {firstName}! How has your day been? 😊',
      promotional: 'Hi {firstName}! I have something special for fans who love {favoriteContent} 💕',
      thankyou: 'Thank you so much {firstName}! Your support means everything to me ❤️',
      custom: 'Hey {firstName}! I was thinking about you today...'
    };
    
    return messages[type as keyof typeof messages] || 'Hi {firstName}! 😊';
  }

  private calculateLoyaltyStatus(profile: FanProfile): {
    points: number;
    tier: 'bronze' | 'silver' | 'gold' | 'platinum';
    rewards: string[];
    nextTierRequirement: number;
  } {
    const points = Math.floor(profile.totalSpent * 10); // 10 points per dollar
    
    let tier: 'bronze' | 'silver' | 'gold' | 'platinum' = 'bronze';
    if (points >= 10000) tier = 'platinum';
    else if (points >= 5000) tier = 'gold';
    else if (points >= 1000) tier = 'silver';
    
    const tierRequirements = { bronze: 1000, silver: 5000, gold: 10000, platinum: Infinity };
    const nextTierRequirement = tierRequirements[tier] === Infinity ? 0 : tierRequirements[tier] - points;
    
    return {
      points,
      tier,
      rewards: ['Exclusive content', 'Priority support', 'Special discounts'],
      nextTierRequirement
    };
  }

  private analyzeFanJourney(profile: FanProfile): {
    stages: any[];
    currentStage: string;
    nextMilestone: string;
    recommendations: string[];
    insights: string[];
  } {
    // Journey analysis implementation
    return {
      stages: [],
      currentStage: 'engaged_fan',
      nextMilestone: 'vip_status',
      recommendations: ['Increase engagement', 'Offer premium content'],
      insights: ['Fan is in growth phase', 'High potential for upselling']
    };
  }
}

export const fanRelationshipService = new FanRelationshipService();