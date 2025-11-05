import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart, TrendingUp, Eye, Heart, Share2, DollarSign,
  Users, Clock, Calendar, ArrowUp, ArrowDown, Minus
} from 'lucide-react';

type ContentAnalyticsProps = {
  sessions: any[];
};

export default function ContentAnalytics({ sessions }: ContentAnalyticsProps) {
  // Calculate analytics
  const getOverallStats = () => {
    const totalViews = sessions.reduce((acc, s) => acc + (s.analytics?.views || 0), 0);
    const totalLikes = sessions.reduce((acc, s) => acc + (s.analytics?.likes || 0), 0);
    const totalShares = sessions.reduce((acc, s) => acc + (s.analytics?.shares || 0), 0);
    const totalRevenue = sessions.reduce((acc, s) => acc + (s.analytics?.revenue || 0), 0);
    
    const avgEngagement = sessions.length > 0
      ? ((totalLikes + totalShares) / totalViews * 100).toFixed(2)
      : '0';
    
    const bestPerforming = sessions.reduce((best, current) => {
      const currentViews = current.analytics?.views || 0;
      const bestViews = best?.analytics?.views || 0;
      return currentViews > bestViews ? current : best;
    }, sessions[0]);

    return {
      totalViews,
      totalLikes,
      totalShares,
      totalRevenue,
      avgEngagement,
      bestPerforming,
    };
  };

  const getTimeBasedStats = () => {
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const recent7 = sessions.filter(s => new Date(s.createdAt) > last7Days);
    const recent30 = sessions.filter(s => new Date(s.createdAt) > last30Days);
    
    return {
      last7Days: {
        count: recent7.length,
        views: recent7.reduce((acc, s) => acc + (s.analytics?.views || 0), 0),
        revenue: recent7.reduce((acc, s) => acc + (s.analytics?.revenue || 0), 0),
      },
      last30Days: {
        count: recent30.length,
        views: recent30.reduce((acc, s) => acc + (s.analytics?.views || 0), 0),
        revenue: recent30.reduce((acc, s) => acc + (s.analytics?.revenue || 0), 0),
      },
    };
  };

  const getPlatformBreakdown = () => {
    // Mock data for platform breakdown
    return [
      { platform: 'Instagram', views: 45200, revenue: 3240, growth: 12.5 },
      { platform: 'TikTok', views: 38900, revenue: 2890, growth: 28.3 },
      { platform: 'Twitter', views: 12300, revenue: 890, growth: -5.2 },
      { platform: 'OnlyFans', views: 8900, revenue: 6780, growth: 45.7 },
    ];
  };

  const getContentPerformance = () => {
    return sessions
      .filter(s => s.analytics)
      .sort((a, b) => (b.analytics?.views || 0) - (a.analytics?.views || 0))
      .slice(0, 5);
  };

  const stats = getOverallStats();
  const timeStats = getTimeBasedStats();
  const platforms = getPlatformBreakdown();
  const topContent = getContentPerformance();

  const getTrendIcon = (value: number) => {
    if (value > 0) return <ArrowUp className="h-4 w-4 text-green-500" />;
    if (value < 0) return <ArrowDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Total Views
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-views">
              {stats.totalViews.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              +12.5% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Total Engagement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-engagement">
              {(stats.totalLikes + stats.totalShares).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.avgEngagement}% avg rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-revenue">
              ${(stats.totalRevenue / 100).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              +28.3% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-conversion">
              4.2%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Views to paid conversions
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="platforms" data-testid="tab-platforms">Platforms</TabsTrigger>
          <TabsTrigger value="content" data-testid="tab-content">Top Content</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Time-based Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>
                Your content performance over time
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Last 7 Days</span>
                    <Badge variant="outline" data-testid="badge-7days">
                      {timeStats.last7Days.count} posts
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Views</span>
                      <span className="font-medium">
                        {timeStats.last7Days.views.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Revenue</span>
                      <span className="font-medium">
                        ${(timeStats.last7Days.revenue / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Last 30 Days</span>
                    <Badge variant="outline" data-testid="badge-30days">
                      {timeStats.last30Days.count} posts
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Views</span>
                      <span className="font-medium">
                        {timeStats.last30Days.views.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Revenue</span>
                      <span className="font-medium">
                        ${(timeStats.last30Days.revenue / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mock Chart Visualization */}
              <div className="h-48 bg-muted/20 rounded-lg flex items-center justify-center">
                <BarChart className="h-12 w-12 text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Chart visualization</span>
              </div>
            </CardContent>
          </Card>

          {/* Best Performing Content */}
          {stats.bestPerforming && (
            <Card>
              <CardHeader>
                <CardTitle>Best Performing Content</CardTitle>
                <CardDescription>
                  Your top content this month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <h3 className="font-medium" data-testid="best-content-title">
                    {stats.bestPerforming.title}
                  </h3>
                  <div className="flex gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {stats.bestPerforming.analytics?.views || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      {stats.bestPerforming.analytics?.likes || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Share2 className="h-3 w-3" />
                      {stats.bestPerforming.analytics?.shares || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      ${((stats.bestPerforming.analytics?.revenue || 0) / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="platforms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Platform Performance</CardTitle>
              <CardDescription>
                Performance breakdown by platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {platforms.map((platform) => (
                <div key={platform.platform} className="space-y-2" data-testid={`platform-${platform.platform}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{platform.platform}</span>
                      <div className="flex items-center gap-1">
                        {getTrendIcon(platform.growth)}
                        <span className={cn(
                          "text-xs",
                          platform.growth > 0 && "text-green-500",
                          platform.growth < 0 && "text-red-500",
                          platform.growth === 0 && "text-gray-500"
                        )}>
                          {Math.abs(platform.growth)}%
                        </span>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      ${(platform.revenue / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <Progress 
                      value={(platform.views / 100000) * 100} 
                      className="h-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{platform.views.toLocaleString()} views</span>
                      <span>
                        {((platform.revenue / platform.views) * 100).toFixed(2)}¢ per view
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Platform Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>AI Recommendations</CardTitle>
              <CardDescription>
                Optimization suggestions based on your data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <Badge className="mt-0.5">TIP</Badge>
                <p className="text-sm">
                  Your TikTok content is growing fastest. Consider posting more frequently there.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Badge className="mt-0.5">TIP</Badge>
                <p className="text-sm">
                  OnlyFans has your highest revenue per view. Focus on premium content there.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Badge className="mt-0.5">TIP</Badge>
                <p className="text-sm">
                  Twitter engagement is declining. Try using more trending hashtags.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Content</CardTitle>
              <CardDescription>
                Your best content ranked by performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topContent.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No content analytics available yet
                  </p>
                ) : (
                  topContent.map((content, index) => (
                    <div
                      key={content.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                      data-testid={`top-content-${index}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-2xl font-bold text-muted-foreground">
                          #{index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{content.title}</p>
                          <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                            <span>{content.type}</span>
                            <span>•</span>
                            <span>{new Date(content.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <div className="text-center">
                          <p className="font-medium">{content.analytics.views}</p>
                          <p className="text-xs text-muted-foreground">views</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium">{content.analytics.likes}</p>
                          <p className="text-xs text-muted-foreground">likes</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium">
                            ${(content.analytics.revenue / 100).toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">earned</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Content Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Content Insights</CardTitle>
              <CardDescription>
                What's working for your audience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Best posting time</span>
                  <span className="font-medium">8:00 PM - 10:00 PM</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Most engaging content type</span>
                  <span className="font-medium">Video</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Average view duration</span>
                  <span className="font-medium">2m 34s</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Top performing hashtags</span>
                  <span className="font-medium">#exclusive #premium #fyp</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}