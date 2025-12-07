import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Trophy, 
  Star, 
  Target, 
  Zap, 
  Crown, 
  Gift,
  TrendingUp,
  Users,
  Heart,
  MessageCircle,
  Camera,
  Video,
  Mic,
  Palette,
  Sparkles,
  Award,
  Medal,
  Rocket,
  Fire,
  Diamond,
  Shield,
  Sword,
  Wand2
} from "lucide-react";

interface Skill {
  id: string;
  name: string;
  category: 'content' | 'engagement' | 'monetization' | 'growth' | 'technical';
  icon: any;
  level: number; // 1-100
  experience: number; // Current XP
  experienceToNext: number; // XP needed for next level
  description: string;
  benefits: string[];
  milestones: Milestone[];
  isUnlocked: boolean;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
}

interface Milestone {
  id: string;
  name: string;
  description: string;
  requirement: number;
  isCompleted: boolean;
  reward: {
    type: 'badge' | 'feature' | 'boost' | 'currency';
    value: string | number;
    description: string;
  };
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: Date;
  isSecret: boolean;
}

interface CreatorStats {
  totalLevel: number;
  totalExperience: number;
  rank: string;
  leaderboardPosition: number;
  achievements: Achievement[];
  weeklyProgress: {
    experienceGained: number;
    skillsImproved: number;
    milestonesCompleted: number;
  };
}

interface GameifiedSkillProgressProps {
  userId: string;
  showLeaderboard?: boolean;
  compact?: boolean;
}

const SKILL_CATEGORIES = {
  content: { label: 'Content Creation', icon: Camera, color: 'bg-blue-100 text-blue-600' },
  engagement: { label: 'Fan Engagement', icon: Heart, color: 'bg-pink-100 text-pink-600' },
  monetization: { label: 'Revenue Skills', icon: Trophy, color: 'bg-yellow-100 text-yellow-600' },
  growth: { label: 'Audience Growth', icon: TrendingUp, color: 'bg-green-100 text-green-600' },
  technical: { label: 'Platform Mastery', icon: Zap, color: 'bg-purple-100 text-purple-600' }
};

const CREATOR_RANKS = [
  { name: 'Newbie Creator', minLevel: 1, icon: Star, color: 'text-gray-500' },
  { name: 'Rising Star', minLevel: 10, icon: Sparkles, color: 'text-blue-500' },
  { name: 'Trending Creator', minLevel: 25, icon: Fire, color: 'text-orange-500' },
  { name: 'Elite Creator', minLevel: 50, icon: Crown, color: 'text-yellow-500' },
  { name: 'Legendary Creator', minLevel: 75, icon: Diamond, color: 'text-purple-500' },
  { name: 'Creator Legend', minLevel: 100, icon: Trophy, color: 'text-gold-500' }
];

const TIER_COLORS = {
  bronze: 'from-orange-300 to-orange-500',
  silver: 'from-gray-300 to-gray-500',
  gold: 'from-yellow-300 to-yellow-500',
  platinum: 'from-purple-300 to-purple-500',
  diamond: 'from-cyan-300 to-cyan-500'
};

export function GameifiedSkillProgressTracker({
  userId,
  showLeaderboard = true,
  compact = false
}: GameifiedSkillProgressProps) {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAchievements, setShowAchievements] = useState(false);

  // Get skill progress data
  const { data: skillData, isLoading } = useQuery({
    queryKey: [`/api/skills/progress/${userId}`],
    staleTime: 300000, // 5 minutes
  });

  // Get leaderboard data
  const { data: leaderboardData } = useQuery({
    queryKey: ['/api/skills/leaderboard'],
    enabled: showLeaderboard,
    staleTime: 600000, // 10 minutes
  });

  // Claim milestone reward mutation
  const claimRewardMutation = useMutation({
    mutationFn: async (milestoneId: string) => {
      const response = await apiRequest('POST', `/api/skills/milestones/${milestoneId}/claim`);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Reward Claimed! 🎉",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/skills/progress/${userId}`] });
    },
  });

  const skills: Skill[] = skillData?.skills || [];
  const stats: CreatorStats = skillData?.stats || {
    totalLevel: 1,
    totalExperience: 0,
    rank: 'Newbie Creator',
    leaderboardPosition: 0,
    achievements: [],
    weeklyProgress: {
      experienceGained: 0,
      skillsImproved: 0,
      milestonesCompleted: 0
    }
  };

  const filteredSkills = selectedCategory === 'all' 
    ? skills 
    : skills.filter(skill => skill.category === selectedCategory);

  const getCurrentRank = () => {
    return CREATOR_RANKS.slice().reverse().find(rank => stats.totalLevel >= rank.minLevel) || CREATOR_RANKS[0];
  };

  const getNextRank = () => {
    return CREATOR_RANKS.find(rank => stats.totalLevel < rank.minLevel);
  };

  const currentRank = getCurrentRank();
  const nextRank = getNextRank();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (compact) {
    return (
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                currentRank.color
              )}>
                <currentRank.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium text-sm">{currentRank.name}</p>
                <p className="text-xs text-muted-foreground">Level {stats.totalLevel}</p>
              </div>
            </div>
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              #{stats.leaderboardPosition}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Progress to {nextRank?.name || 'Max Level'}</span>
              <span>{stats.totalExperience} XP</span>
            </div>
            <Progress 
              value={nextRank ? ((stats.totalLevel - currentRank.minLevel) / (nextRank.minLevel - currentRank.minLevel)) * 100 : 100}
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Creator Stats Overview */}
      <Card className="bg-gradient-to-br from-purple-50 via-white to-pink-50 border-2 border-purple-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br",
                TIER_COLORS.gold
              )}>
                <currentRank.icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">{currentRank.name}</CardTitle>
                <CardDescription>Level {stats.totalLevel} Creator</CardDescription>
              </div>
            </div>
            
            <div className="text-right">
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white mb-1">
                Rank #{stats.leaderboardPosition}
              </Badge>
              <p className="text-sm text-muted-foreground">
                {stats.totalExperience.toLocaleString()} Total XP
              </p>
            </div>
          </div>

          {/* Progress to next rank */}
          {nextRank && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress to {nextRank.name}</span>
                <span>{nextRank.minLevel - stats.totalLevel} levels to go</span>
              </div>
              <Progress 
                value={((stats.totalLevel - currentRank.minLevel) / (nextRank.minLevel - currentRank.minLevel)) * 100}
                className="h-3"
              />
            </div>
          )}
        </CardHeader>

        <CardContent>
          {/* Weekly Progress */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <Zap className="h-8 w-8 text-blue-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-blue-600">
                {stats.weeklyProgress.experienceGained}
              </p>
              <p className="text-xs text-blue-700">XP This Week</p>
            </div>
            
            <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
              <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-green-600">
                {stats.weeklyProgress.skillsImproved}
              </p>
              <p className="text-xs text-green-700">Skills Improved</p>
            </div>
            
            <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
              <Award className="h-8 w-8 text-purple-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-purple-600">
                {stats.weeklyProgress.milestonesCompleted}
              </p>
              <p className="text-xs text-purple-700">Milestones</p>
            </div>
          </div>

          {/* Quick Achievement Showcase */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium mb-1">Recent Achievements</p>
              <div className="flex gap-1">
                {stats.achievements.slice(0, 5).map((achievement) => {
                  const Icon = achievement.icon;
                  return (
                    <div
                      key={achievement.id}
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center border-2",
                        achievement.rarity === 'legendary' && "bg-gradient-to-br from-purple-400 to-pink-400 border-purple-300",
                        achievement.rarity === 'epic' && "bg-gradient-to-br from-blue-400 to-indigo-400 border-blue-300",
                        achievement.rarity === 'rare' && "bg-gradient-to-br from-green-400 to-emerald-400 border-green-300",
                        achievement.rarity === 'common' && "bg-gradient-to-br from-gray-400 to-gray-500 border-gray-300"
                      )}
                      title={achievement.name}
                    >
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                  );
                })}
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAchievements(!showAchievements)}
              data-testid="toggle-achievements"
            >
              <Trophy className="mr-2 h-4 w-4" />
              View All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Skills Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Creator Skills
          </CardTitle>
          <CardDescription>
            Level up your creator abilities and unlock new features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="all" data-testid="tab-all-skills">All</TabsTrigger>
              {Object.entries(SKILL_CATEGORIES).map(([key, category]) => {
                const Icon = category.icon;
                return (
                  <TabsTrigger key={key} value={key} data-testid={`tab-${key}`}>
                    <Icon className="mr-1 h-3 w-3" />
                    <span className="hidden sm:inline">{category.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <TabsContent value={selectedCategory} className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredSkills.map((skill) => {
                  const Icon = skill.icon;
                  const completedMilestones = skill.milestones.filter(m => m.isCompleted).length;
                  const availableRewards = skill.milestones.filter(m => m.isCompleted && !m.reward);
                  
                  return (
                    <Card 
                      key={skill.id} 
                      className={cn(
                        "relative overflow-hidden transition-all duration-200 hover:shadow-md",
                        !skill.isUnlocked && "opacity-60 bg-gray-50"
                      )}
                    >
                      {/* Tier indicator */}
                      <div className={cn(
                        "absolute top-0 right-0 w-0 h-0 border-l-[40px] border-t-[40px] border-l-transparent",
                        skill.tier === 'diamond' && "border-t-cyan-400",
                        skill.tier === 'platinum' && "border-t-purple-400",
                        skill.tier === 'gold' && "border-t-yellow-400",
                        skill.tier === 'silver' && "border-t-gray-400",
                        skill.tier === 'bronze' && "border-t-orange-400"
                      )} />

                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center",
                              SKILL_CATEGORIES[skill.category].color
                            )}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <CardTitle className="text-base">{skill.name}</CardTitle>
                              <CardDescription className="text-xs">
                                Level {skill.level} • {skill.tier.charAt(0).toUpperCase() + skill.tier.slice(1)} Tier
                              </CardDescription>
                            </div>
                          </div>
                          
                          {availableRewards.length > 0 && (
                            <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black animate-pulse">
                              Reward!
                            </Badge>
                          )}
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          {skill.description}
                        </p>

                        {/* XP Progress */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span>Experience</span>
                            <span>{skill.experience} / {skill.experienceToNext} XP</span>
                          </div>
                          <Progress 
                            value={(skill.experience / skill.experienceToNext) * 100}
                            className="h-2"
                          />
                        </div>

                        {/* Milestones */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <p className="text-xs font-medium">Milestones</p>
                            <span className="text-xs text-muted-foreground">
                              {completedMilestones}/{skill.milestones.length}
                            </span>
                          </div>
                          
                          <div className="space-y-1">
                            {skill.milestones.slice(0, 3).map((milestone) => (
                              <div 
                                key={milestone.id}
                                className="flex items-center justify-between text-xs"
                              >
                                <div className={cn(
                                  "flex items-center gap-2",
                                  milestone.isCompleted && "text-green-600"
                                )}>
                                  <div className={cn(
                                    "w-2 h-2 rounded-full",
                                    milestone.isCompleted ? "bg-green-500" : "bg-gray-300"
                                  )} />
                                  <span className={milestone.isCompleted ? "line-through" : ""}>
                                    {milestone.name}
                                  </span>
                                </div>
                                
                                {milestone.isCompleted && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-5 px-2 text-xs"
                                    onClick={() => claimRewardMutation.mutate(milestone.id)}
                                    data-testid={`claim-${milestone.id}`}
                                  >
                                    Claim
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Benefits */}
                        {skill.benefits.length > 0 && (
                          <div>
                            <p className="text-xs font-medium mb-1">Benefits</p>
                            <div className="flex flex-wrap gap-1">
                              {skill.benefits.slice(0, 2).map((benefit, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {benefit}
                                </Badge>
                              ))}
                              {skill.benefits.length > 2 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{skill.benefits.length - 2} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Leaderboard */}
      {showLeaderboard && leaderboardData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Creator Leaderboard
            </CardTitle>
            <CardDescription>
              Top creators this week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leaderboardData.top10.map((creator: any, index: number) => (
                <div 
                  key={creator.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg",
                    index < 3 && "bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200",
                    index >= 3 && "bg-gray-50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                      index === 0 && "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white",
                      index === 1 && "bg-gradient-to-br from-gray-300 to-gray-500 text-white",
                      index === 2 && "bg-gradient-to-br from-orange-400 to-orange-600 text-white",
                      index >= 3 && "bg-gray-200 text-gray-600"
                    )}>
                      {index + 1}
                    </div>
                    
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={creator.avatar} />
                      <AvatarFallback>
                        {creator.displayName.split(' ').map((n: string) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <p className="font-medium text-sm">{creator.displayName}</p>
                      <p className="text-xs text-muted-foreground">
                        Level {creator.level} • {creator.rank}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-medium text-sm">{creator.weeklyXP} XP</p>
                    <p className="text-xs text-muted-foreground">This week</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}