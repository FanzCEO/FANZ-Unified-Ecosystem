import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, TrendingDown, Users, DollarSign, Heart, Eye, 
  MessageCircle, Share2, Crown, Fire, Target, Award, 
  Calendar, Clock, Zap, Star, Trophy, Gift
} from 'lucide-react';

interface AnalyticsMetric {
  label: string;
  value: number;
  change: number;
  changeType: 'increase' | 'decrease';
  icon: any;
  format: 'number' | 'currency' | 'percentage';
}

interface GamificationLevel {
  level: number;
  title: string;
  xp: number;
  maxXp: number;
  rewards: string[];
  badges: string[];
}

interface CreatorInsight {
  id: string;
  type: 'achievement' | 'opportunity' | 'warning' | 'milestone';
  title: string;
  description: string;
  action?: string;
  value?: number;
  impact: 'high' | 'medium' | 'low';
}

export function CreatorAnalyticsDashboard() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [currentStreak, setCurrentStreak] = useState(12);
  const [creatorLevel, setCreatorLevel] = useState<GamificationLevel>({
    level: 8,
    title: 'Rising Star',
    xp: 2840,
    maxXp: 3500,
    rewards: ['Premium Analytics', 'Custom Emoji Pack', 'Priority Support'],
    badges: ['Early Adopter', 'Content Creator', 'Fan Favorite', 'Consistent Poster']
  });

  // Mock analytics data - in production this would come from API
  const analyticsMetrics: AnalyticsMetric[] = [
    { label: 'Total Earnings', value: 2847.50, change: 12.5, changeType: 'increase', icon: DollarSign, format: 'currency' },
    { label: 'New Subscribers', value: 184, change: 8.3, changeType: 'increase', icon: Users, format: 'number' },
    { label: 'Content Views', value: 15420, change: 15.7, changeType: 'increase', icon: Eye, format: 'number' },
    { label: 'Engagement Rate', value: 7.2, change: -2.1, changeType: 'decrease', icon: Heart, format: 'percentage' },
    { label: 'Messages Received', value: 67, change: 23.4, changeType: 'increase', icon: MessageCircle, format: 'number' },
    { label: 'Content Shares', value: 142, change: 31.2, changeType: 'increase', icon: Share2, format: 'number' }
  ];

  const insights: CreatorInsight[] = [
    {
      id: '1',
      type: 'achievement',
      title: 'Milestone Unlocked!',
      description: 'You reached 500 total subscribers! Your fanbase is growing strong.',
      impact: 'high'
    },
    {
      id: '2',
      type: 'opportunity',
      title: 'Peak Engagement Window',
      description: 'Your fans are most active between 8-10 PM. Consider posting during this time.',
      action: 'Schedule Posts',
      impact: 'medium'
    },
    {
      id: '3',
      type: 'warning',
      title: 'Engagement Dip',
      description: 'Your engagement rate dropped 15% this week. Try mixing up your content types.',
      action: 'View Content Tips',
      impact: 'medium'
    },
    {
      id: '4',
      type: 'milestone',
      title: 'Revenue Goal Progress',
      description: 'You\'re 73% towards your monthly goal of $4,000!',
      value: 73,
      impact: 'high'
    }
  ];

  const weeklyGoals = [
    { name: 'Post 5 times', current: 3, target: 5, icon: Target },
    { name: 'Gain 50 subscribers', current: 32, target: 50, icon: Users },
    { name: 'Earn $500', current: 347, target: 500, icon: DollarSign },
    { name: 'Respond to 20 messages', current: 16, target: 20, icon: MessageCircle }
  ];

  const formatValue = (value: number, format: string) => {
    switch (format) {
      case 'currency':
        return `$${value.toLocaleString()}`;
      case 'percentage':
        return `${value}%`;
      default:
        return value.toLocaleString();
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'achievement': return 'bg-green-500';
      case 'opportunity': return 'bg-blue-500';
      case 'warning': return 'bg-orange-500';
      case 'milestone': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'achievement': return Trophy;
      case 'opportunity': return Zap;
      case 'warning': return Target;
      case 'milestone': return Award;
      default: return Star;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6" data-testid="creator-analytics-dashboard">
      {/* Header with Gamification */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-xl p-6 text-white"
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Creator Dashboard</h1>
            <p className="text-pink-100">Track your progress and unlock new achievements</p>
          </div>
          
          {/* Level Progress */}
          <div className="bg-white/10 backdrop-blur rounded-lg p-4 min-w-80">
            <div className="flex items-center gap-3 mb-2">
              <Crown className="text-yellow-300" size={24} />
              <div>
                <h3 className="font-semibold">Level {creatorLevel.level}</h3>
                <p className="text-sm text-pink-100">{creatorLevel.title}</p>
              </div>
            </div>
            <Progress 
              value={(creatorLevel.xp / creatorLevel.maxXp) * 100} 
              className="h-3 mb-2"
              data-testid="progress-level"
            />
            <p className="text-sm text-pink-100">
              {creatorLevel.xp.toLocaleString()} / {creatorLevel.maxXp.toLocaleString()} XP
            </p>
          </div>
        </div>
      </motion.div>

      {/* Time Range Selector */}
      <div className="flex gap-2">
        {['24h', '7d', '30d', '90d'].map(range => (
          <Button
            key={range}
            variant={selectedTimeRange === range ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedTimeRange(range)}
            data-testid={`button-timerange-${range}`}
          >
            {range === '24h' ? '24 Hours' : 
             range === '7d' ? '7 Days' : 
             range === '30d' ? '30 Days' : '90 Days'}
          </Button>
        ))}
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="goals">Goals & Rewards</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {analyticsMetrics.map((metric, index) => {
              const Icon = metric.icon;
              return (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card data-testid={`metric-card-${metric.label.toLowerCase().replace(' ', '-')}`}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {metric.label}
                          </p>
                          <p className="text-2xl font-bold">
                            {formatValue(metric.value, metric.format)}
                          </p>
                          <div className="flex items-center gap-1 text-sm">
                            {metric.changeType === 'increase' ? (
                              <TrendingUp size={16} className="text-green-500" />
                            ) : (
                              <TrendingDown size={16} className="text-red-500" />
                            )}
                            <span className={metric.changeType === 'increase' ? 'text-green-500' : 'text-red-500'}>
                              {metric.change > 0 ? '+' : ''}{metric.change}%
                            </span>
                            <span className="text-gray-500">vs last period</span>
                          </div>
                        </div>
                        <div className="p-3 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full">
                          <Icon size={24} className="text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Insights Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fire className="text-orange-500" />
                Smart Insights
              </CardTitle>
              <CardDescription>
                AI-powered recommendations to grow your audience and earnings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {insights.map((insight) => {
                const InsightIcon = getInsightIcon(insight.type);
                return (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start gap-4 p-4 rounded-lg border bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700"
                    data-testid={`insight-${insight.id}`}
                  >
                    <div className={`p-2 rounded-full ${getInsightColor(insight.type)}`}>
                      <InsightIcon size={20} className="text-white" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{insight.title}</h4>
                        <Badge variant={insight.impact === 'high' ? 'default' : 'secondary'}>
                          {insight.impact} impact
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {insight.description}
                      </p>
                      {insight.value && (
                        <Progress value={insight.value} className="h-2" />
                      )}
                      {insight.action && (
                        <Button size="sm" variant="outline" data-testid={`button-action-${insight.id}`}>
                          {insight.action}
                        </Button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Engagement Tab */}
        <TabsContent value="engagement" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Engagement Chart Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Engagement Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/20 dark:to-purple-900/20 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">Engagement Chart Visualization</p>
                </div>
              </CardContent>
            </Card>

            {/* Top Content */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { title: 'Beach Day Photoshoot', views: 2840, likes: 186 },
                  { title: 'Behind the Scenes Video', views: 2103, likes: 142 },
                  { title: 'Q&A Session', views: 1967, likes: 128 }
                ].map((content, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div>
                      <h4 className="font-medium">{content.title}</h4>
                      <p className="text-sm text-gray-500">{content.views.toLocaleString()} views</p>
                    </div>
                    <Badge variant="secondary">{content.likes} ❤️</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">Revenue Chart Visualization</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Income Sources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { source: 'Subscriptions', amount: 1420, percentage: 65 },
                  { source: 'Tips', amount: 680, percentage: 25 },
                  { source: 'PPV Content', amount: 320, percentage: 10 }
                ].map((source) => (
                  <div key={source.source} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">{source.source}</span>
                      <span>${source.amount}</span>
                    </div>
                    <Progress value={source.percentage} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Goals & Rewards Tab */}
        <TabsContent value="goals" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Goals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="text-blue-500" />
                  Weekly Goals
                </CardTitle>
                <CardDescription>Complete goals to earn XP and unlock rewards</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {weeklyGoals.map((goal) => {
                  const Icon = goal.icon;
                  const progress = (goal.current / goal.target) * 100;
                  const isCompleted = goal.current >= goal.target;
                  
                  return (
                    <div key={goal.name} className="space-y-2" data-testid={`goal-${goal.name.toLowerCase().replace(' ', '-')}`}>
                      <div className="flex items-center gap-3">
                        <Icon size={20} className={isCompleted ? 'text-green-500' : 'text-gray-400'} />
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{goal.name}</span>
                            <span className="text-sm text-gray-500">
                              {goal.current}/{goal.target}
                            </span>
                          </div>
                          <Progress value={progress} className="h-2 mt-1" />
                        </div>
                        {isCompleted && <Award className="text-yellow-500" size={20} />}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Achievements & Badges */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="text-yellow-500" />
                  Achievements
                </CardTitle>
                <CardDescription>Your earned badges and milestones</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {creatorLevel.badges.map((badge, index) => (
                    <motion.div
                      key={badge}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-2 p-3 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-lg text-white font-medium text-sm"
                      data-testid={`badge-${badge.toLowerCase().replace(' ', '-')}`}
                    >
                      <Award size={16} />
                      {badge}
                    </motion.div>
                  ))}
                </div>
                
                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-3">Unlocked Rewards</h4>
                  <div className="space-y-2">
                    {creatorLevel.rewards.map((reward, index) => (
                      <div key={reward} className="flex items-center gap-2 text-sm">
                        <Gift size={16} className="text-green-500" />
                        {reward}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Streak Counter */}
          <Card>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-6xl"
                >
                  🔥
                </motion.div>
                <div>
                  <h3 className="text-2xl font-bold">{currentStreak} Day Streak!</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Keep posting daily to maintain your streak and earn bonus XP
                  </p>
                </div>
                <Button 
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  data-testid="button-post-now"
                >
                  Post Something Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}