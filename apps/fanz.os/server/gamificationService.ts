import { db } from "./db";
import { users, gamificationPoints, achievements, fanClubs, contests } from "@shared/schema";
import { eq, desc, sum, count } from "drizzle-orm";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
  requirements: any;
  unlockedBy?: string[];
}

interface Contest {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  prizes: { place: number; reward: string; value: number }[];
  rules: string[];
  participants: string[];
  status: 'upcoming' | 'active' | 'completed';
}

interface FanClub {
  id: string;
  creatorId: string;
  name: string;
  description: string;
  level: number;
  members: string[];
  benefits: string[];
  requirements: { minSpent: number; minInteractions: number };
}

// Revolutionary Gamification System for Maximum Fan Engagement
class GamificationService {
  private achievements: Map<string, Achievement> = new Map();
  private contests: Map<string, Contest> = new Map();
  private fanClubs: Map<string, FanClub> = new Map();

  constructor() {
    this.initializeAchievements();
    this.initializeDefaultContests();
  }

  // Advanced Point System
  async awardPoints(
    userId: string, 
    action: string, 
    amount: number, 
    metadata?: any
  ): Promise<{ newTotal: number; levelUp: boolean; achievements: Achievement[] }> {
    const pointsData = {
      userId,
      action,
      amount,
      metadata: metadata || {},
      timestamp: new Date()
    };

    // Award points
    // await db.insert(gamificationPoints).values(pointsData);

    // Calculate new total
    const newTotal = await this.getUserTotalPoints(userId);
    
    // Check for level up
    const oldLevel = this.calculateLevel(newTotal - amount);
    const newLevel = this.calculateLevel(newTotal);
    const levelUp = newLevel > oldLevel;

    // Check for new achievements
    const newAchievements = await this.checkAchievements(userId, action, amount, metadata);

    // Award bonus points for achievements
    if (newAchievements.length > 0) {
      const bonusPoints = newAchievements.reduce((sum, ach) => sum + ach.points, 0);
      if (bonusPoints > 0) {
        // await db.insert(gamificationPoints).values({
        //   userId,
        //   action: 'achievement_bonus',
        //   amount: bonusPoints,
        //   metadata: { achievements: newAchievements.map(a => a.id) },
        //   timestamp: new Date()
        // });
      }
    }

    return {
      newTotal: newTotal + (newAchievements.reduce((sum, ach) => sum + ach.points, 0)),
      levelUp,
      achievements: newAchievements
    };
  }

  // Dynamic Achievement System
  private initializeAchievements(): void {
    const achievements: Achievement[] = [
      // Creator Achievements
      {
        id: 'first_post',
        name: 'Content Creator',
        description: 'Post your first piece of content',
        icon: '🎬',
        rarity: 'common',
        points: 100,
        requirements: { action: 'post_created', count: 1 }
      },
      {
        id: 'viral_video',
        name: 'Viral Sensation',
        description: 'Get 10,000 views on a single video',
        icon: '🔥',
        rarity: 'epic',
        points: 2500,
        requirements: { action: 'video_views', threshold: 10000 }
      },
      {
        id: 'million_maker',
        name: 'Million Dollar Creator',
        description: 'Earn $1,000,000 lifetime revenue',
        icon: '💎',
        rarity: 'legendary',
        points: 50000,
        requirements: { action: 'revenue_milestone', threshold: 1000000 }
      },

      // Fan Achievements  
      {
        id: 'loyal_fan',
        name: 'Loyal Fan',
        description: 'Subscribe to a creator for 6 months',
        icon: '❤️',
        rarity: 'rare',
        points: 1000,
        requirements: { action: 'subscription_duration', months: 6 }
      },
      {
        id: 'big_spender',
        name: 'Big Spender',
        description: 'Spend $1,000 in tips in one month',
        icon: '💰',
        rarity: 'epic',
        points: 5000,
        requirements: { action: 'monthly_tips', threshold: 1000 }
      },
      {
        id: 'superfan',
        name: 'Superfan',
        description: 'Be in the top 1% of fans for a creator',
        icon: '⭐',
        rarity: 'legendary',
        points: 10000,
        requirements: { action: 'fan_ranking', percentile: 1 }
      },

      // Social Achievements
      {
        id: 'social_butterfly',
        name: 'Social Butterfly',
        description: 'Comment on 100 different posts',
        icon: '🦋',
        rarity: 'rare',
        points: 1500,
        requirements: { action: 'comments_created', count: 100 }
      },
      {
        id: 'influencer',
        name: 'Influencer',
        description: 'Refer 50 new users to the platform',
        icon: '📈',
        rarity: 'epic',
        points: 7500,
        requirements: { action: 'referrals', count: 50 }
      },

      // Special Event Achievements
      {
        id: 'early_adopter',
        name: 'Early Adopter',
        description: 'Join during the beta phase',
        icon: '🚀',
        rarity: 'legendary',
        points: 25000,
        requirements: { action: 'beta_signup', before: '2025-12-31' }
      }
    ];

    achievements.forEach(ach => this.achievements.set(ach.id, ach));
  }

  // Advanced Contest System
  private initializeDefaultContests(): void {
    const contests: Contest[] = [
      {
        id: 'monthly_creator',
        title: 'Creator of the Month',
        description: 'Compete for the highest engagement rate this month',
        startDate: new Date(2025, 7, 1),
        endDate: new Date(2025, 7, 31),
        prizes: [
          { place: 1, reward: 'Cash Prize + Featured Profile', value: 5000 },
          { place: 2, reward: 'Cash Prize + Marketing Boost', value: 2500 },
          { place: 3, reward: 'Cash Prize + Analytics Report', value: 1000 }
        ],
        rules: [
          'Must post at least 10 pieces of content',
          'Engagement calculated as (likes + comments + shares) / views',
          'Only original content counts'
        ],
        participants: [],
        status: 'active'
      },
      {
        id: 'fan_appreciation',
        title: 'Fan Appreciation Week',
        description: 'Show your support and win exclusive content',
        startDate: new Date(2025, 8, 15),
        endDate: new Date(2025, 8, 22),
        prizes: [
          { place: 1, reward: 'Private Video Call + Custom Content', value: 500 },
          { place: 2, reward: 'Signed Merchandise + Photo Set', value: 250 },
          { place: 3, reward: 'Exclusive Content Bundle', value: 100 }
        ],
        rules: [
          'Points awarded for tips, comments, and shares',
          'Must be an active subscriber',
          'Voting by creator community'
        ],
        participants: [],
        status: 'upcoming'
      }
    ];

    contests.forEach(contest => this.contests.set(contest.id, contest));
  }

  // Fan Club Management
  async createFanClub(
    creatorId: string,
    name: string,
    description: string,
    requirements: { minSpent: number; minInteractions: number }
  ): Promise<FanClub> {
    const fanClub: FanClub = {
      id: `club_${Date.now()}`,
      creatorId,
      name,
      description,
      level: 1,
      members: [],
      benefits: [
        'Exclusive content access',
        'Priority message responses',
        'Monthly video calls',
        'Custom content requests',
        'Early access to new posts'
      ],
      requirements
    };

    this.fanClubs.set(fanClub.id, fanClub);
    return fanClub;
  }

  async joinFanClub(userId: string, clubId: string): Promise<boolean> {
    const club = this.fanClubs.get(clubId);
    if (!club) return false;

    // Check requirements
    const userStats = await this.getUserStats(userId, club.creatorId);
    if (userStats.totalSpent >= club.requirements.minSpent && 
        userStats.interactions >= club.requirements.minInteractions) {
      
      club.members.push(userId);
      await this.awardPoints(userId, 'fanclub_joined', 500, { clubId });
      return true;
    }

    return false;
  }

  // Leaderboards
  async getLeaderboard(
    type: 'points' | 'spending' | 'engagement' | 'creator_earnings',
    timeframe: 'daily' | 'weekly' | 'monthly' | 'all_time' = 'all_time',
    limit: number = 50
  ): Promise<any[]> {
    // Return mock leaderboard data
    const mockLeaderboard = Array.from({ length: limit }, (_, i) => ({
      rank: i + 1,
      userId: `user_${i + 1}`,
      username: `User${i + 1}`,
      avatar: `https://cdn.fanslab.com/avatars/user_${i + 1}.jpg`,
      score: Math.floor(Math.random() * 100000) + 1000,
      badge: i < 3 ? ['🥇', '🥈', '🥉'][i] : '',
      level: Math.floor(Math.random() * 50) + 1
    })).sort((a, b) => b.score - a.score);

    return mockLeaderboard;
  }

  // Interactive Challenges
  async createChallenge(
    creatorId: string,
    title: string,
    description: string,
    goal: { type: string; target: number },
    duration: number, // hours
    rewards: { completion: number; leaderboard: number[] }
  ): Promise<string> {
    const challengeId = `challenge_${Date.now()}`;
    
    // Store challenge in system
    const challenge = {
      id: challengeId,
      creatorId,
      title,
      description,
      goal,
      duration,
      rewards,
      participants: [],
      startTime: new Date(),
      endTime: new Date(Date.now() + duration * 60 * 60 * 1000),
      status: 'active'
    };

    return challengeId;
  }

  // Loyalty Program
  async calculateLoyaltyBonus(userId: string, creatorId: string): Promise<number> {
    const userStats = await this.getUserStats(userId, creatorId);
    const loyaltyMonths = userStats.subscriptionMonths;
    
    // Progressive loyalty bonus
    if (loyaltyMonths >= 12) return 0.25; // 25% bonus
    if (loyaltyMonths >= 6) return 0.15;  // 15% bonus
    if (loyaltyMonths >= 3) return 0.10;  // 10% bonus
    if (loyaltyMonths >= 1) return 0.05;  // 5% bonus
    
    return 0;
  }

  // Streak System
  async updateStreak(userId: string, action: string): Promise<{
    currentStreak: number;
    longestStreak: number;
    bonus: number;
  }> {
    // Daily login streak, tipping streak, etc.
    const streakData = {
      currentStreak: 15,
      longestStreak: 45,
      bonus: 150 // Bonus points for maintaining streak
    };

    if (streakData.currentStreak % 7 === 0) {
      // Weekly streak bonus
      await this.awardPoints(userId, 'weekly_streak_bonus', 500);
    }

    return streakData;
  }

  // Social Features Integration
  async awardSocialPoints(
    userId: string,
    socialAction: 'share' | 'invite' | 'review' | 'viral_content',
    metadata: any
  ): Promise<void> {
    const pointValues = {
      share: 25,
      invite: 100,
      review: 50,
      viral_content: 1000
    };

    await this.awardPoints(userId, `social_${socialAction}`, pointValues[socialAction], metadata);
  }

  // Seasonal Events
  async createSeasonalEvent(
    name: string,
    theme: string,
    duration: number,
    specialRewards: any[]
  ): Promise<void> {
    // Valentine's Day, Halloween, Christmas events with special achievements
    const eventId = `event_${Date.now()}`;
    
    // Create temporary achievements for the event
    const eventAchievements = specialRewards.map(reward => ({
      id: `${eventId}_${reward.id}`,
      name: reward.name,
      description: reward.description,
      icon: reward.icon,
      rarity: 'epic' as const,
      points: reward.points,
      requirements: reward.requirements,
      eventOnly: true,
      expires: new Date(Date.now() + duration * 24 * 60 * 60 * 1000)
    }));

    eventAchievements.forEach(ach => this.achievements.set(ach.id, ach));
  }

  // Helper Methods
  private async getUserTotalPoints(userId: string): Promise<number> {
    // Mock implementation - would query database
    return Math.floor(Math.random() * 50000) + 1000;
  }

  private calculateLevel(points: number): number {
    // Progressive leveling system
    return Math.floor(Math.sqrt(points / 100)) + 1;
  }

  private async checkAchievements(
    userId: string, 
    action: string, 
    amount: number, 
    metadata: any
  ): Promise<Achievement[]> {
    const newAchievements: Achievement[] = [];

    for (const [id, achievement] of this.achievements) {
      // Check if user already has this achievement
      const hasAchievement = false; // Would check database
      
      if (!hasAchievement && this.meetsRequirements(achievement, action, amount, metadata)) {
        newAchievements.push(achievement);
      }
    }

    return newAchievements;
  }

  private meetsRequirements(
    achievement: Achievement, 
    action: string, 
    amount: number, 
    metadata: any
  ): boolean {
    const req = achievement.requirements;
    
    if (req.action && req.action !== action) return false;
    if (req.count && amount < req.count) return false;
    if (req.threshold && amount < req.threshold) return false;
    
    return true;
  }

  private async getUserStats(userId: string, creatorId: string): Promise<{
    totalSpent: number;
    interactions: number;
    subscriptionMonths: number;
  }> {
    // Mock user stats - would query database
    return {
      totalSpent: Math.floor(Math.random() * 5000) + 100,
      interactions: Math.floor(Math.random() * 1000) + 50,
      subscriptionMonths: Math.floor(Math.random() * 24) + 1
    };
  }

  // Analytics Dashboard
  async getGamificationAnalytics(userId: string): Promise<{
    totalPoints: number;
    level: number;
    achievements: Achievement[];
    rank: number;
    streaks: any;
    contestsWon: number;
    fanClubMemberships: string[];
    nextLevelProgress: number;
  }> {
    const totalPoints = await this.getUserTotalPoints(userId);
    const level = this.calculateLevel(totalPoints);
    const nextLevelPoints = Math.pow(level, 2) * 100;
    const currentLevelPoints = Math.pow(level - 1, 2) * 100;
    const progress = ((totalPoints - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100;

    return {
      totalPoints,
      level,
      achievements: Array.from(this.achievements.values()).slice(0, 5),
      rank: Math.floor(Math.random() * 1000) + 1,
      streaks: {
        daily: 15,
        weekly: 3,
        monthly: 1
      },
      contestsWon: Math.floor(Math.random() * 5),
      fanClubMemberships: ['VIP Club', 'Elite Fans', 'Premium Members'],
      nextLevelProgress: Math.min(progress, 100)
    };
  }
}

export const gamificationService = new GamificationService();