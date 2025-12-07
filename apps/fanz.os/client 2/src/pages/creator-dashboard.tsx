import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  DollarSign,
  Users,
  Eye,
  Heart,
  MessageCircle,
  TrendingUp,
  Calendar,
  Video,
  Image,
  Play,
  Gift,
  ShoppingBag,
  Award,
  Zap,
  Clock,
  ArrowUp,
  ArrowDown,
  Plus,
  FileText,
  Settings,
  Share2,
  Archive,
  Download,
  Trash2,
  Edit3,
  Shield,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { Link } from "wouter";

interface RecordedStream {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: number;
  recordedAt: string;
  views: number;
  isPublic: boolean;
  hasCoStars: boolean;
  complianceVerified: boolean;
  coStars?: {
    id: string;
    name: string;
    verificationStatus: string;
  }[];
}
import MediaUploader from "@/components/media-uploader";

interface Analytics {
  totalRevenue: number;
  monthlyRevenue: number;
  subscriberCount: number;
  newSubscribersThisMonth: number;
  totalViews: number;
  totalLikes: number;
  averageEngagementRate: number;
  topContentTypes: { type: string; count: number; revenue: number }[];
  revenueHistory: { month: string; revenue: number }[];
  subscriberGrowth: { month: string; subscribers: number }[];
  contentPerformance: { 
    id: string; 
    title: string; 
    type: string; 
    views: number; 
    likes: number; 
    revenue: number; 
  }[];
  upcomingPayouts: { date: string; amount: number; status: string }[];
  affiliateEarnings: number;
  contestWinnings: number;
  merchandiseSales: number;
}

const COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'];

export default function CreatorDashboard() {
  const { user, isLoading: authLoading } = useAuth() as { user: User | undefined; isLoading: boolean };
  const { toast } = useToast();
  const [showUploader, setShowUploader] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState("month");
  const [selectedTab, setSelectedTab] = useState('analytics');
  
  // URL param support for direct tab access
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab && ['analytics', 'content', 'earnings', 'fanzfluence', 'vault'].includes(tab)) {
      setSelectedTab(tab);
    }
  }, []);

  // Redirect if not a creator
  useEffect(() => {
    if (!authLoading && user && user.role !== "creator") {
      window.location.href = "/";
    }
  }, [user, authLoading]);

  // Fetch analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery<Analytics>({
    queryKey: ["/api/analytics/creator"],
    enabled: !!user && user.role === "creator",
  });

  if (authLoading || analyticsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user || user.role !== "creator") {
    return null;
  }

  const mockAnalytics: Analytics = analytics || {
    totalRevenue: 15234.56,
    monthlyRevenue: 4567.89,
    subscriberCount: 1234,
    newSubscribersThisMonth: 89,
    totalViews: 45678,
    totalLikes: 12345,
    averageEngagementRate: 8.5,
    topContentTypes: [
      { type: "Videos", count: 45, revenue: 8900 },
      { type: "Photos", count: 123, revenue: 3400 },
      { type: "Live Streams", count: 12, revenue: 2934.56 },
    ],
    revenueHistory: [
      { month: "Jan", revenue: 3200 },
      { month: "Feb", revenue: 3800 },
      { month: "Mar", revenue: 4100 },
      { month: "Apr", revenue: 3900 },
      { month: "May", revenue: 4300 },
      { month: "Jun", revenue: 4567.89 },
    ],
    subscriberGrowth: [
      { month: "Jan", subscribers: 980 },
      { month: "Feb", subscribers: 1050 },
      { month: "Mar", subscribers: 1100 },
      { month: "Apr", subscribers: 1145 },
      { month: "May", subscribers: 1190 },
      { month: "Jun", subscribers: 1234 },
    ],
    contentPerformance: [
      { id: "1", title: "Exclusive Photoshoot BTS", type: "video", views: 5432, likes: 876, revenue: 456.78 },
      { id: "2", title: "Live Q&A Session", type: "live", views: 3210, likes: 654, revenue: 321.45 },
      { id: "3", title: "Premium Gallery Update", type: "photo", views: 7654, likes: 1234, revenue: 234.56 },
    ],
    upcomingPayouts: [
      { date: "2024-01-15", amount: 2345.67, status: "pending" },
      { date: "2024-02-01", amount: 1890.23, status: "scheduled" },
    ],
    affiliateEarnings: 567.89,
    contestWinnings: 234.56,
    merchandiseSales: 890.12,
  };

  const data = mockAnalytics;
  const revenueChange = ((data.monthlyRevenue / 3900) - 1) * 100; // Compare to previous month
  const subscriberChange = ((data.newSubscribersThisMonth / 45) - 1) * 100; // Compare to previous month

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2" data-testid="text-dashboard-title">
                Creator Dashboard
              </h1>
              <p className="text-gray-400">Welcome back, {user.firstName || user.username}</p>
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={() => setShowUploader(true)}
                className="bg-gradient-to-r from-primary to-secondary hover:from-purple-600 hover:to-pink-600"
                data-testid="button-upload-content"
              >
                <Plus className="w-4 h-4 mr-2" />
                Upload Content
              </Button>
              <Link href="/stream/start">
                <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
                  <Video className="w-4 h-4 mr-2" />
                  Go Live
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-400">Total Revenue</CardTitle>
                <DollarSign className="w-4 h-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white" data-testid="text-total-revenue">
                ${data.totalRevenue.toLocaleString()}
              </div>
              <div className="flex items-center mt-2">
                <Badge variant={revenueChange >= 0 ? "default" : "destructive"} className="text-xs">
                  {revenueChange >= 0 ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                  {Math.abs(revenueChange).toFixed(1)}%
                </Badge>
                <span className="text-xs text-gray-400 ml-2">vs last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-400">Subscribers</CardTitle>
                <Users className="w-4 h-4 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white" data-testid="text-subscribers">
                {data.subscriberCount.toLocaleString()}
              </div>
              <div className="flex items-center mt-2">
                <Badge variant="default" className="text-xs bg-purple-600">
                  <ArrowUp className="w-3 h-3 mr-1" />
                  +{data.newSubscribersThisMonth}
                </Badge>
                <span className="text-xs text-gray-400 ml-2">this month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-400">Total Views</CardTitle>
                <Eye className="w-4 h-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white" data-testid="text-total-views">
                {data.totalViews.toLocaleString()}
              </div>
              <div className="text-xs text-gray-400 mt-2">
                Across all content
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-400">Engagement Rate</CardTitle>
                <Heart className="w-4 h-4 text-pink-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white" data-testid="text-engagement-rate">
                {data.averageEngagementRate}%
              </div>
              <Progress value={data.averageEngagementRate * 10} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="bg-gray-800 border border-gray-700">
            <TabsTrigger value="analytics" data-testid="tab-analytics">
              <BarChart className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="content" data-testid="tab-content">
              <FileText className="w-4 h-4 mr-2" />
              Content
            </TabsTrigger>
            <TabsTrigger value="earnings" data-testid="tab-earnings">
              <DollarSign className="w-4 h-4 mr-2" />
              Earnings
            </TabsTrigger>
            <TabsTrigger value="fanzfluence" data-testid="tab-fanzfluence">
              <Zap className="w-4 h-4 mr-2" />
              FANZfluence
            </TabsTrigger>
            <TabsTrigger value="vault" data-testid="tab-vault">
              <Archive className="w-4 h-4 mr-2" />
              Stream Vault
            </TabsTrigger>
          </TabsList>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Chart */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Revenue Trend</CardTitle>
                  <CardDescription className="text-gray-400">Monthly revenue over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={data.revenueHistory}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
                        labelStyle={{ color: '#9ca3af' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#8b5cf6" 
                        fillOpacity={1} 
                        fill="url(#colorRevenue)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Subscriber Growth */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Subscriber Growth</CardTitle>
                  <CardDescription className="text-gray-400">Monthly subscriber count</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data.subscriberGrowth}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
                        labelStyle={{ color: '#9ca3af' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="subscribers" 
                        stroke="#ec4899" 
                        strokeWidth={2}
                        dot={{ fill: '#ec4899' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Content Type Distribution */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Content Distribution</CardTitle>
                  <CardDescription className="text-gray-400">Revenue by content type</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={data.topContentTypes}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ type, revenue }) => `${type}: $${revenue}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="revenue"
                      >
                        {data.topContentTypes.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
                        labelStyle={{ color: '#9ca3af' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Top Performing Content */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Top Performing Content</CardTitle>
                  <CardDescription className="text-gray-400">Your best content this month</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.contentPerformance.map((content) => (
                      <div key={content.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                        <div className="flex items-center space-x-3">
                          {content.type === "video" && <Video className="w-5 h-5 text-purple-500" />}
                          {content.type === "photo" && <Image className="w-5 h-5 text-pink-500" />}
                          {content.type === "live" && <Play className="w-5 h-5 text-red-500" />}
                          <div>
                            <p className="text-white font-medium">{content.title}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1">
                              <span className="flex items-center">
                                <Eye className="w-3 h-3 mr-1" />
                                {content.views.toLocaleString()}
                              </span>
                              <span className="flex items-center">
                                <Heart className="w-3 h-3 mr-1" />
                                {content.likes.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-green-500 font-semibold">${content.revenue.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Content Management</CardTitle>
                <CardDescription className="text-gray-400">Manage your posts, videos, and galleries</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Button
                    onClick={() => setShowUploader(true)}
                    className="h-32 bg-gray-700 hover:bg-gray-600 flex flex-col items-center justify-center"
                    data-testid="button-upload-photo"
                  >
                    <Image className="w-8 h-8 mb-2" />
                    <span>Upload Photos</span>
                  </Button>
                  <Button
                    onClick={() => setShowUploader(true)}
                    className="h-32 bg-gray-700 hover:bg-gray-600 flex flex-col items-center justify-center"
                    data-testid="button-upload-video"
                  >
                    <Video className="w-8 h-8 mb-2" />
                    <span>Upload Video</span>
                  </Button>
                  <Link href="/stream/start">
                    <Button className="h-32 w-full bg-gray-700 hover:bg-gray-600 flex flex-col items-center justify-center">
                      <Play className="w-8 h-8 mb-2" />
                      <span>Start Live Stream</span>
                    </Button>
                  </Link>
                </div>

                {/* Quick Access Tools */}
                <div className="border-t border-gray-700 pt-6">
                  <h3 className="text-white font-semibold mb-4">Platform Tools</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link href="/social-media-tools" data-testid="link-social-media-tools">
                      <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer bg-gradient-to-br from-purple-600/10 to-pink-600/10 border-purple-500/20">
                        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                          <div className="bg-purple-600/20 p-3 rounded-lg mr-3">
                            <Share2 className="h-5 w-5 text-purple-400" />
                          </div>
                          <div>
                            <CardTitle className="text-lg text-white">Social Media Tools</CardTitle>
                            <p className="text-sm text-gray-400">AI post creator & hashtag generator</p>
                          </div>
                        </CardHeader>
                      </Card>
                    </Link>

                    <Link href="/server-dashboard" data-testid="link-server-dashboard">
                      <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer bg-gradient-to-br from-blue-600/10 to-cyan-600/10 border-blue-500/20">
                        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                          <div className="bg-blue-600/20 p-3 rounded-lg mr-3">
                            <Server className="h-5 w-5 text-blue-400" />
                          </div>
                          <div>
                            <CardTitle className="text-lg text-white">Server Management</CardTitle>
                            <p className="text-sm text-gray-400">cPanel/Plesk-style server control</p>
                          </div>
                        </CardHeader>
                      </Card>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Earnings Tab */}
          <TabsContent value="earnings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Earnings Breakdown</CardTitle>
                  <CardDescription className="text-gray-400">Revenue sources this month</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Users className="w-5 h-5 text-purple-500" />
                        <span className="text-white">Subscriptions</span>
                      </div>
                      <span className="text-green-500 font-semibold">$3,200.00</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Heart className="w-5 h-5 text-pink-500" />
                        <span className="text-white">Tips</span>
                      </div>
                      <span className="text-green-500 font-semibold">$867.89</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <ShoppingBag className="w-5 h-5 text-blue-500" />
                        <span className="text-white">PPV Content</span>
                      </div>
                      <span className="text-green-500 font-semibold">$500.00</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Zap className="w-5 h-5 text-yellow-500" />
                        <span className="text-white">FANZfluence</span>
                      </div>
                      <span className="text-green-500 font-semibold">${data.affiliateEarnings.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Award className="w-5 h-5 text-orange-500" />
                        <span className="text-white">Contests</span>
                      </div>
                      <span className="text-green-500 font-semibold">${data.contestWinnings.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Gift className="w-5 h-5 text-indigo-500" />
                        <span className="text-white">Merchandise</span>
                      </div>
                      <span className="text-green-500 font-semibold">${data.merchandiseSales.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Upcoming Payouts</CardTitle>
                  <CardDescription className="text-gray-400">Scheduled payments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.upcomingPayouts.map((payout, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Clock className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-white font-medium">${payout.amount.toFixed(2)}</p>
                            <p className="text-xs text-gray-400">{new Date(payout.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <Badge variant={payout.status === "pending" ? "secondary" : "default"}>
                          {payout.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* FANZfluence Tab */}
          <TabsContent value="fanzfluence" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">FANZfluence Program</CardTitle>
                <CardDescription className="text-gray-400">Your affiliate marketing performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-400 text-sm mb-1">Affiliate Link Clicks</p>
                    <p className="text-2xl font-bold text-white">1,234</p>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-400 text-sm mb-1">Conversions</p>
                    <p className="text-2xl font-bold text-white">45</p>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-400 text-sm mb-1">Commission Earned</p>
                    <p className="text-2xl font-bold text-green-500">${data.affiliateEarnings.toFixed(2)}</p>
                  </div>
                </div>
                
                <div className="border-t border-gray-700 pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-semibold">Your Referral Link</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-primary text-primary hover:bg-primary hover:text-white"
                      data-testid="button-copy-referral"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Copy Link
                    </Button>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-3">
                    <code className="text-sm text-gray-300">
                      https://fanslab.com/ref/{user.username}
                    </code>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stream Vault Tab */}
          <TabsContent value="vault" className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Stream Vault</h2>
                <p className="text-gray-400">Manage your recorded live streams and ensure compliance</p>
              </div>
              <Badge className="bg-green-600 text-white">
                <Archive className="w-3 h-3 mr-1" />
                {/* Mock data - replace with actual query */}
                12 Recordings
              </Badge>
            </div>

            {/* Vault Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-600/20 rounded-lg">
                      <Archive className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Total Recordings</p>
                      <p className="text-xl font-bold text-white">12</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-600/20 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Compliant</p>
                      <p className="text-xl font-bold text-white">10</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-yellow-600/20 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Pending Review</p>
                      <p className="text-xl font-bold text-white">2</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-600/20 rounded-lg">
                      <Eye className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Total Views</p>
                      <p className="text-xl font-bold text-white">45.2K</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recorded Streams List */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Recorded Streams</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-600 text-gray-300"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export All
                    </Button>
                  </div>
                </div>
                <CardDescription className="text-gray-400">
                  Manage your recorded live streams and verify compliance status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Mock recorded streams - replace with actual data */}
                  {[
                    {
                      id: '1',
                      title: 'Evening Chat Session - January 20th',
                      description: 'Intimate conversation with my fans',
                      thumbnailUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=120&fit=crop',
                      duration: 3420,
                      recordedAt: '2024-01-20T20:00:00Z',
                      views: 1247,
                      isPublic: true,
                      hasCoStars: false,
                      complianceVerified: true
                    },
                    {
                      id: '2',
                      title: 'Dance Performance with Sarah',
                      description: 'Special guest performance',
                      thumbnailUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=120&fit=crop',
                      duration: 2940,
                      recordedAt: '2024-01-19T15:30:00Z',
                      views: 892,
                      isPublic: false,
                      hasCoStars: true,
                      complianceVerified: false,
                      coStars: [{ id: '1', name: 'Sarah Johnson', verificationStatus: 'pending' }]
                    }
                  ].map((stream) => (
                    <div key={stream.id} className="flex items-center space-x-4 p-4 bg-gray-700 rounded-lg">
                      <img
                        src={stream.thumbnailUrl}
                        alt={stream.title}
                        className="w-24 h-14 object-cover rounded"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-semibold truncate">{stream.title}</h4>
                        <p className="text-gray-400 text-sm truncate">{stream.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1">
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {Math.floor(stream.duration / 60)}m {stream.duration % 60}s
                          </span>
                          <span className="flex items-center">
                            <Eye className="w-3 h-3 mr-1" />
                            {stream.views.toLocaleString()} views
                          </span>
                          <span>{new Date(stream.recordedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-2">
                        <div className="flex items-center space-x-2">
                          {stream.hasCoStars && (
                            <Badge 
                              variant="secondary" 
                              className={`text-xs ${
                                stream.complianceVerified ? 'bg-green-600' : 'bg-yellow-600'
                              }`}
                            >
                              <Shield className="w-3 h-3 mr-1" />
                              {stream.complianceVerified ? 'Compliant' : 'Pending'}
                            </Badge>
                          )}
                          <Badge variant={stream.isPublic ? 'default' : 'secondary'} className="text-xs">
                            {stream.isPublic ? 'Public' : 'Private'}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white">
                            <Play className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white">
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white">
                            <Download className="w-4 h-4" />
                          </Button>
                          {!stream.hasCoStars || stream.complianceVerified ? (
                            <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="text-yellow-400 hover:text-yellow-300"
                              onClick={() => {
                                toast({
                                  title: "Compliance Required",
                                  description: "Complete 2257 verification before managing this recording",
                                  variant: "destructive"
                                });
                              }}
                            >
                              <AlertTriangle className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 2257 Compliance Panel */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-primary" />
                  2257 Compliance Management
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Ensure all recorded content with co-stars meets legal requirements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-yellow-900/20 border border-yellow-900/50 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                      <div>
                        <h4 className="text-yellow-200 font-semibold">Compliance Requirements</h4>
                        <p className="text-yellow-200/80 text-sm mt-1">
                          All recorded content featuring co-stars must have completed 2257 compliance documentation.
                          This includes age verification, consent forms, and proper record keeping.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button 
                      variant="outline" 
                      className="justify-start h-auto p-4 border-gray-600"
                      asChild
                    >
                      <Link href="/compliance/2257">
                        <div className="text-left">
                          <div className="font-semibold text-white">Manage 2257 Records</div>
                          <div className="text-sm text-gray-400 mt-1">
                            View and update compliance documentation
                          </div>
                        </div>
                      </Link>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="justify-start h-auto p-4 border-gray-600"
                    >
                      <div className="text-left">
                        <div className="font-semibold text-white">Upload Documentation</div>
                        <div className="text-sm text-gray-400 mt-1">
                          Add new verification documents
                        </div>
                      </div>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Media Uploader Modal */}
        {showUploader && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Upload Content</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowUploader(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </Button>
              </div>
              <MediaUploader
                onUploadComplete={(media) => {
                  toast({
                    title: "Upload Complete",
                    description: "Your content has been uploaded successfully!",
                  });
                  setShowUploader(false);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}