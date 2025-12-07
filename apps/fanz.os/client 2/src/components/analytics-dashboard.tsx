import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  Treemap,
  Scatter,
  ScatterChart,
  ComposedChart
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Eye,
  Heart,
  MessageCircle,
  Calendar,
  Clock,
  Activity,
  Target,
  Award,
  Zap,
  BarChart3,
  PieChartIcon,
  Map,
  Filter,
  Download,
  RefreshCw,
  Info,
  ChevronUp,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Globe,
  Smartphone,
  Monitor,
  Percent,
  Star,
  Gift,
  CreditCard,
  UserCheck,
  UserX,
  Hash,
  Layers,
  Grid3X3,
  Sparkles,
  Flame,
  AlertCircle,
  CheckCircle,
  Trophy
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface AnalyticsData {
  revenue: {
    current: number;
    previous: number;
    growth: number;
    chart: { date: string; amount: number }[];
    breakdown: { source: string; amount: number; percentage: number }[];
  };
  subscribers: {
    total: number;
    new: number;
    churned: number;
    retained: number;
    growth: number;
    chart: { date: string; count: number; new: number; churned: number }[];
    retention: { cohort: string; month: number; percentage: number }[];
  };
  engagement: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    avgEngagementRate: number;
    chart: { date: string; views: number; engagement: number }[];
    heatmap: { hour: number; day: string; value: number }[];
  };
  content: {
    totalPosts: number;
    avgPostsPerDay: number;
    topPerforming: { id: string; title: string; views: number; earnings: number }[];
    categories: { name: string; posts: number; engagement: number }[];
  };
  audience: {
    demographics: {
      age: { range: string; percentage: number }[];
      gender: { type: string; percentage: number }[];
      location: { country: string; percentage: number; count: number }[];
    };
    behavior: {
      segments: { name: string; count: number; value: number; engagement: number }[];
      devices: { type: string; percentage: number }[];
      peakTimes: { hour: number; activity: number }[];
    };
  };
  milestones: {
    achieved: { title: string; date: string; reward: number }[];
    upcoming: { title: string; progress: number; target: number; reward: number }[];
  };
}

export default function AnalyticsDashboard() {
  const { user } = useAuth() as { user: User | undefined };
  const { toast } = useToast();
  const [realTimeData, setRealTimeData] = useState<any>(null);
  const [predictiveInsights, setPredictiveInsights] = useState<any>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedMetric, setSelectedMetric] = useState("revenue");
  const [compareMode, setCompareMode] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState("all");

  // Fetch analytics data
  const { data: analytics, isLoading, refetch } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics", timeRange, selectedSegment],
  });

  // Mock data for demonstration
  const mockAnalytics: AnalyticsData = analytics || {
    revenue: {
      current: 8456.32,
      previous: 7234.18,
      growth: 16.9,
      chart: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
        amount: Math.floor(Math.random() * 500) + 200
      })),
      breakdown: [
        { source: "Subscriptions", amount: 5234.00, percentage: 62 },
        { source: "Tips", amount: 1876.32, percentage: 22 },
        { source: "PPV", amount: 946.00, percentage: 11 },
        { source: "Merchandise", amount: 400.00, percentage: 5 }
      ]
    },
    subscribers: {
      total: 1847,
      new: 234,
      churned: 45,
      retained: 1568,
      growth: 14.5,
      chart: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
        count: 1500 + Math.floor(Math.random() * 350),
        new: Math.floor(Math.random() * 20) + 5,
        churned: Math.floor(Math.random() * 5)
      })),
      retention: [
        { cohort: "Jan 2024", month: 1, percentage: 100 },
        { cohort: "Jan 2024", month: 2, percentage: 85 },
        { cohort: "Jan 2024", month: 3, percentage: 72 },
        { cohort: "Feb 2024", month: 1, percentage: 100 },
        { cohort: "Feb 2024", month: 2, percentage: 88 }
      ]
    },
    engagement: {
      views: 234567,
      likes: 18934,
      comments: 4567,
      shares: 2341,
      avgEngagementRate: 8.7,
      chart: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
        views: Math.floor(Math.random() * 10000) + 5000,
        engagement: Math.floor(Math.random() * 1000) + 500
      })),
      heatmap: Array.from({ length: 24 * 7 }, (_, i) => ({
        hour: i % 24,
        day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][Math.floor(i / 24)],
        value: Math.random() * 100
      }))
    },
    content: {
      totalPosts: 145,
      avgPostsPerDay: 4.8,
      topPerforming: [
        { id: "1", title: "Exclusive Behind The Scenes", views: 45678, earnings: 1234.56 },
        { id: "2", title: "Q&A Session", views: 34567, earnings: 987.65 },
        { id: "3", title: "Special Announcement", views: 28934, earnings: 765.43 }
      ],
      categories: [
        { name: "Photos", posts: 67, engagement: 8.9 },
        { name: "Videos", posts: 45, engagement: 12.3 },
        { name: "Live Streams", posts: 23, engagement: 15.7 },
        { name: "Stories", posts: 10, engagement: 6.4 }
      ]
    },
    audience: {
      demographics: {
        age: [
          { range: "18-24", percentage: 22 },
          { range: "25-34", percentage: 38 },
          { range: "35-44", percentage: 25 },
          { range: "45+", percentage: 15 }
        ],
        gender: [
          { type: "Male", percentage: 65 },
          { type: "Female", percentage: 30 },
          { type: "Other", percentage: 5 }
        ],
        location: [
          { country: "United States", percentage: 45, count: 831 },
          { country: "United Kingdom", percentage: 15, count: 277 },
          { country: "Canada", percentage: 12, count: 221 },
          { country: "Australia", percentage: 8, count: 148 },
          { country: "Other", percentage: 20, count: 370 }
        ]
      },
      behavior: {
        segments: [
          { name: "VIP Fanz", count: 234, value: 89.45, engagement: 92 },
          { name: "Active Supporters", count: 567, value: 45.23, engagement: 67 },
          { name: "Casual Viewers", count: 890, value: 12.34, engagement: 34 },
          { name: "Lurkers", count: 156, value: 5.67, engagement: 12 }
        ],
        devices: [
          { type: "Mobile", percentage: 68 },
          { type: "Desktop", percentage: 25 },
          { type: "Tablet", percentage: 7 }
        ],
        peakTimes: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          activity: Math.sin((i - 6) * Math.PI / 12) * 50 + 50
        }))
      }
    },
    milestones: {
      achieved: [
        { title: "1K Subscribers", date: "2024-01-15", reward: 100 },
        { title: "Top 10 Creator", date: "2024-01-20", reward: 500 }
      ],
      upcoming: [
        { title: "2K Subscribers", progress: 1847, target: 2000, reward: 200 },
        { title: "$10K Monthly Revenue", progress: 8456, target: 10000, reward: 1000 }
      ]
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getChangeIcon = (value: number) => {
    return value >= 0 ? (
      <ArrowUpRight className="w-4 h-4 text-green-500" />
    ) : (
      <ArrowDownRight className="w-4 h-4 text-red-500" />
    );
  };

  const getChangeColor = (value: number) => {
    return value >= 0 ? "text-green-500" : "text-red-500";
  };

  // Heatmap color scale
  const getHeatmapColor = (value: number) => {
    const intensity = value / 100;
    const r = Math.floor(255 * intensity);
    const g = Math.floor(100 * (1 - intensity));
    const b = Math.floor(255 * (1 - intensity));
    return `rgb(${r}, ${g}, ${b})`;
  };

  const COLORS = ['#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#ef4444'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center">
            <BarChart3 className="w-6 h-6 mr-2 text-primary" />
            Analytics Dashboard
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Track your performance and audience insights
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px] bg-gray-800 border-gray-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={() => refetch()}
            variant="outline"
            className="border-gray-700 text-gray-300 hover:bg-gray-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>

          <Button
            variant="outline"
            className="border-gray-700 text-gray-300 hover:bg-gray-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(mockAnalytics.revenue.current)}
                </p>
                <div className="flex items-center mt-2">
                  {getChangeIcon(mockAnalytics.revenue.growth)}
                  <span className={`text-sm ml-1 ${getChangeColor(mockAnalytics.revenue.growth)}`}>
                    {Math.abs(mockAnalytics.revenue.growth)}%
                  </span>
                  <span className="text-xs text-gray-400 ml-2">vs last period</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-900 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">Total Subscribers</p>
                <p className="text-2xl font-bold text-white">
                  {formatNumber(mockAnalytics.subscribers.total)}
                </p>
                <div className="flex items-center mt-2">
                  {getChangeIcon(mockAnalytics.subscribers.growth)}
                  <span className={`text-sm ml-1 ${getChangeColor(mockAnalytics.subscribers.growth)}`}>
                    {Math.abs(mockAnalytics.subscribers.growth)}%
                  </span>
                  <span className="text-xs text-gray-400 ml-2">growth</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-900 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">Total Views</p>
                <p className="text-2xl font-bold text-white">
                  {formatNumber(mockAnalytics.engagement.views)}
                </p>
                <div className="flex items-center mt-2">
                  <Activity className="w-4 h-4 text-blue-500 mr-1" />
                  <span className="text-sm text-blue-500">
                    {mockAnalytics.engagement.avgEngagementRate}%
                  </span>
                  <span className="text-xs text-gray-400 ml-2">engagement</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-900 rounded-full flex items-center justify-center">
                <Eye className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">Content Created</p>
                <p className="text-2xl font-bold text-white">
                  {mockAnalytics.content.totalPosts}
                </p>
                <div className="flex items-center mt-2">
                  <Sparkles className="w-4 h-4 text-yellow-500 mr-1" />
                  <span className="text-sm text-yellow-500">
                    {mockAnalytics.content.avgPostsPerDay}
                  </span>
                  <span className="text-xs text-gray-400 ml-2">per day</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-yellow-900 rounded-full flex items-center justify-center">
                <Grid3X3 className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList className="bg-gray-800 border border-gray-700">
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
        </TabsList>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={mockAnalytics.revenue.chart}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                      labelStyle={{ color: '#9ca3af' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="#8b5cf6"
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Revenue Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={mockAnalytics.revenue.breakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="amount"
                    >
                      {mockAnalytics.revenue.breakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {mockAnalytics.revenue.breakdown.map((item, index) => (
                    <div key={item.source} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm text-gray-400">{item.source}</span>
                      </div>
                      <span className="text-sm font-semibold text-white">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Engagement Tab with Heatmap */}
        <TabsContent value="engagement" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Activity Heatmap</CardTitle>
              <CardDescription className="text-gray-400">
                Optimal posting times based on audience activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-25 gap-1">
                <div className="col-span-1"></div>
                {Array.from({ length: 24 }, (_, i) => (
                  <div key={i} className="text-xs text-gray-400 text-center">
                    {i}
                  </div>
                ))}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="contents">
                    <div className="text-xs text-gray-400 pr-2">{day}</div>
                    {Array.from({ length: 24 }, (_, hour) => {
                      const item = mockAnalytics.engagement.heatmap.find(
                        h => h.day === day && h.hour === hour
                      );
                      const value = item?.value || 0;
                      return (
                        <div
                          key={`${day}-${hour}`}
                          className="aspect-square rounded-sm cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                          style={{ backgroundColor: getHeatmapColor(value) }}
                          title={`${day} ${hour}:00 - Activity: ${value.toFixed(0)}%`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-center gap-4">
                <span className="text-xs text-gray-400">Low</span>
                <div className="flex gap-1">
                  {[20, 40, 60, 80, 100].map((v) => (
                    <div
                      key={v}
                      className="w-8 h-4 rounded-sm"
                      style={{ backgroundColor: getHeatmapColor(v) }}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-400">High</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audience Segmentation Tab */}
        <TabsContent value="audience" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Audience Segments</CardTitle>
                <CardDescription className="text-gray-400">
                  Behavioral segmentation of your audience
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockAnalytics.audience.behavior.segments.map((segment) => (
                    <div key={segment.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white">{segment.name}</span>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-gray-700">
                            {segment.count} users
                          </Badge>
                          <Badge className="bg-green-900 text-green-400">
                            ${segment.value} avg
                          </Badge>
                        </div>
                      </div>
                      <Progress
                        value={segment.engagement}
                        className="h-2"
                      />
                      <p className="text-xs text-gray-400">
                        {segment.engagement}% engagement rate
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Geographic Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={mockAnalytics.audience.demographics.location}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="country" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                    />
                    <Bar dataKey="count" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Milestones & Achievements */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
            Milestones & Rewards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Achieved</h4>
              <div className="space-y-2">
                {mockAnalytics.milestones.achieved.map((milestone) => (
                  <div key={milestone.title} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-white">{milestone.title}</p>
                        <p className="text-xs text-gray-400">{milestone.date}</p>
                      </div>
                    </div>
                    <Badge className="bg-green-900 text-green-400">
                      +${milestone.reward}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Upcoming</h4>
              <div className="space-y-2">
                {mockAnalytics.milestones.upcoming.map((milestone) => (
                  <div key={milestone.title} className="p-3 bg-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-white">{milestone.title}</p>
                      <Badge className="bg-yellow-900 text-yellow-400">
                        ${milestone.reward}
                      </Badge>
                    </div>
                    <Progress
                      value={(milestone.progress / milestone.target) * 100}
                      className="h-2 mb-1"
                    />
                    <p className="text-xs text-gray-400">
                      {milestone.progress} / {milestone.target} ({((milestone.progress / milestone.target) * 100).toFixed(1)}%)
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}