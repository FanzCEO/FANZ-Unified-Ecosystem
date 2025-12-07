import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Eye, 
  Heart,
  MessageSquare,
  Share2,
  Lock
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

const COLORS = ['#FF2E7E', '#00E5FF', '#6C2BD9', '#F59E0B'];

export default function CreatorAnalytics() {
  // Fetch analytics data
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['/api/creator/analytics'],
    queryFn: async () => {
      const response = await fetch('/api/creator/analytics', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    },
  });

  const stats = [
    {
      title: "Total Earnings",
      value: "$12,450",
      change: "+23%",
      icon: DollarSign,
      color: "text-green-500"
    },
    {
      title: "Active Subscribers",
      value: "1,234",
      change: "+12%",
      icon: Users,
      color: "text-gf-cyber"
    },
    {
      title: "Total Views",
      value: "45.2K",
      change: "+8%",
      icon: Eye,
      color: "text-gf-pink"
    },
    {
      title: "Engagement Rate",
      value: "78%",
      change: "+5%",
      icon: TrendingUp,
      color: "text-blue-500"
    }
  ];

  const earningsData = [
    { month: 'Jan', earnings: 4200, tips: 800, unlocks: 600 },
    { month: 'Feb', earnings: 5100, tips: 900, unlocks: 700 },
    { month: 'Mar', earnings: 6800, tips: 1200, unlocks: 900 },
    { month: 'Apr', earnings: 8400, tips: 1500, unlocks: 1100 },
    { month: 'May', earnings: 10200, tips: 1800, unlocks: 1400 },
    { month: 'Jun', earnings: 12450, tips: 2100, unlocks: 1650 },
  ];

  const contentPerformance = [
    { type: 'Photos', count: 145, revenue: 5200 },
    { type: 'Videos', count: 67, revenue: 4800 },
    { type: 'Mixed', count: 89, revenue: 2450 },
  ];

  const revenueByType = [
    { name: 'Subscriptions', value: 58 },
    { name: 'Tips', value: 25 },
    { name: 'Unlocks', value: 17 },
  ];

  const topPosts = [
    {
      id: '1',
      title: 'Summer Vibes 🌞',
      views: 12500,
      likes: 2340,
      comments: 456,
      revenue: 890,
      type: 'image'
    },
    {
      id: '2',
      title: 'Behind the Scenes',
      views: 10200,
      likes: 1890,
      comments: 234,
      revenue: 750,
      type: 'video'
    },
    {
      id: '3',
      title: 'Exclusive Collection',
      views: 9800,
      likes: 1750,
      comments: 198,
      revenue: 1200,
      type: 'mixed'
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gf-ink text-gf-snow p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gf-charcoal/50 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-32 bg-gf-charcoal/50 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gf-ink text-gf-snow p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 
              className="text-3xl font-bold bg-gradient-to-r from-gf-cyber to-gf-pink bg-clip-text text-transparent"
              data-testid="text-analytics-title"
            >
              Creator Analytics
            </h1>
            <p className="text-gf-steel mt-1">Track your performance and earnings</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card 
              key={index} 
              className="bg-gf-charcoal/50 border-gf-steel/20"
              data-testid={`card-stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gf-steel">{stat.title}</p>
                    <p className="text-2xl font-bold text-gf-snow mt-2" data-testid={`text-stat-value-${index}`}>
                      {stat.value}
                    </p>
                    <p className={`text-sm mt-1 ${stat.color}`}>
                      {stat.change} from last month
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg bg-gf-ink ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="earnings" className="space-y-4">
          <TabsList className="bg-gf-charcoal/50 border border-gf-steel/20">
            <TabsTrigger value="earnings" data-testid="tab-earnings">Earnings</TabsTrigger>
            <TabsTrigger value="content" data-testid="tab-content">Content Performance</TabsTrigger>
            <TabsTrigger value="audience" data-testid="tab-audience">Audience</TabsTrigger>
            <TabsTrigger value="posts" data-testid="tab-posts">Top Posts</TabsTrigger>
          </TabsList>

          {/* Earnings Tab */}
          <TabsContent value="earnings" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-2 bg-gf-charcoal/50 border-gf-steel/20">
                <CardHeader>
                  <CardTitle className="text-gf-snow">Earnings Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={earningsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="month" stroke="#C7BBD3" />
                      <YAxis stroke="#C7BBD3" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#121214', border: '1px solid #333' }}
                        labelStyle={{ color: '#F5F7FA' }}
                      />
                      <Line type="monotone" dataKey="earnings" stroke="#FF2E7E" strokeWidth={2} />
                      <Line type="monotone" dataKey="tips" stroke="#00E5FF" strokeWidth={2} />
                      <Line type="monotone" dataKey="unlocks" stroke="#6C2BD9" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-gf-charcoal/50 border-gf-steel/20">
                <CardHeader>
                  <CardTitle className="text-gf-snow">Revenue Sources</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={revenueByType}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {revenueByType.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Content Performance Tab */}
          <TabsContent value="content">
            <Card className="bg-gf-charcoal/50 border-gf-steel/20">
              <CardHeader>
                <CardTitle className="text-gf-snow">Content Type Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={contentPerformance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="type" stroke="#C7BBD3" />
                    <YAxis stroke="#C7BBD3" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#121214', border: '1px solid #333' }}
                      labelStyle={{ color: '#F5F7FA' }}
                    />
                    <Bar dataKey="count" fill="#FF2E7E" name="Posts" />
                    <Bar dataKey="revenue" fill="#00E5FF" name="Revenue ($)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Top Posts Tab */}
          <TabsContent value="posts">
            <Card className="bg-gf-charcoal/50 border-gf-steel/20">
              <CardHeader>
                <CardTitle className="text-gf-snow">Top Performing Posts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topPosts.map((post) => (
                    <div 
                      key={post.id}
                      className="flex items-center justify-between p-4 bg-gf-ink rounded-lg border border-gf-steel/20"
                      data-testid={`card-top-post-${post.id}`}
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-gf-snow">{post.title}</h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gf-steel">
                          <span className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            {post.views.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="h-4 w-4" />
                            {post.likes.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4" />
                            {post.comments}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-500">
                          ${post.revenue}
                        </p>
                        <p className="text-xs text-gf-steel mt-1">Revenue</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audience Tab */}
          <TabsContent value="audience">
            <Card className="bg-gf-charcoal/50 border-gf-steel/20">
              <CardHeader>
                <CardTitle className="text-gf-snow">Audience Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gf-steel">Coming soon: Demographics, engagement patterns, and subscriber retention metrics.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
