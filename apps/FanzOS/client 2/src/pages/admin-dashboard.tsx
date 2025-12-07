import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminSettings } from "@/components/admin/admin-settings";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Users, Shield, DollarSign, TrendingUp, Activity, AlertTriangle,
  Settings, Database, Globe, Video, MessageSquare, Ban, CheckCircle,
  FileText, Download, Upload, RefreshCw, Lock, Unlock, Eye, EyeOff,
  BarChart3, PieChart, LineChart, Calendar, Filter, Search, 
  UserPlus, UserMinus, UserCheck, UserX, CreditCard, Zap,
  Cpu, HardDrive, Wifi, Server, Cloud, AlertCircle, Mail,
  Phone, MapPin, Clock, Star, Heart, Share2, Trash2
} from "lucide-react";
import {
  LineChart as RechartsLineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart as RechartsPieChart, Pie, Cell, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";

export default function AdminDashboard() {
  const { user } = useAuth() as { user: any };
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState("7d");
  const [showUserModal, setShowUserModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Check admin access
  if (!user || user.role !== 'admin') {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You must be an administrator to access this dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Platform Statistics Query
  const { data: platformStats = {
    totalUsers: 0,
    activeUsers: 0,
    totalCreators: 0,
    totalFans: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalTransactions: 0,
    totalContent: 0,
    totalVideos: 0,
    totalMessages: 0,
    serverHealth: 100,
    storageUsed: 0,
    bandwidthUsed: 0,
    apiCalls: 0
  }} = useQuery({
    queryKey: ['/api/admin/platform-stats', selectedTimeRange],
    queryFn: async () => {
      const response = await fetch(`/api/admin/platform-stats?range=${selectedTimeRange}`);
      return response.json();
    }
  });

  // Revenue Analytics Query
  const { data: revenueData = [] } = useQuery({
    queryKey: ['/api/admin/revenue-analytics', selectedTimeRange],
    queryFn: async () => {
      const response = await fetch(`/api/admin/revenue-analytics?range=${selectedTimeRange}`);
      return response.json();
    }
  });

  // User Management Query
  const { data: users = [] } = useQuery({
    queryKey: ['/api/admin/users', searchQuery],
    queryFn: async () => {
      const response = await fetch(`/api/admin/users?search=${searchQuery}`);
      return response.json();
    }
  });

  // Content Moderation Query
  const { data: flaggedContent = [] } = useQuery({
    queryKey: ['/api/admin/flagged-content'],
    queryFn: async () => {
      const response = await fetch('/api/admin/flagged-content');
      return response.json();
    }
  });

  // System Health Query
  const { data: systemHealth = {
    cpu: 0,
    memory: 0,
    disk: 0,
    network: 0,
    database: 'healthy',
    cache: 'healthy',
    queue: 0,
    errors: []
  }} = useQuery({
    queryKey: ['/api/admin/system-health'],
    refetchInterval: 30000, // Refresh every 30 seconds
    queryFn: async () => {
      const response = await fetch('/api/admin/system-health');
      return response.json();
    }
  });

  // User Actions Mutations
  const suspendUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("POST", `/api/admin/users/${userId}/suspend`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "User Suspended",
        description: "The user has been suspended successfully."
      });
    }
  });

  const verifyUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("POST", `/api/admin/users/${userId}/verify`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "User Verified",
        description: "The user has been verified successfully."
      });
    }
  });

  const deleteContentMutation = useMutation({
    mutationFn: async (contentId: string) => {
      return await apiRequest("DELETE", `/api/admin/content/${contentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/flagged-content'] });
      toast({
        title: "Content Removed",
        description: "The flagged content has been removed."
      });
    }
  });

  const approveContentMutation = useMutation({
    mutationFn: async (contentId: string) => {
      return await apiRequest("POST", `/api/admin/content/${contentId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/flagged-content'] });
      toast({
        title: "Content Approved",
        description: "The content has been approved."
      });
    }
  });

  // Platform Settings Mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: any) => {
      return await apiRequest("PUT", '/api/admin/settings', settings);
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Platform settings have been updated successfully."
      });
      setShowSettingsModal(false);
    }
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getHealthColor = (value: number) => {
    if (value >= 90) return 'text-green-500';
    if (value >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="container mx-auto p-6 max-w-7xl" data-testid="admin-dashboard">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Complete platform control and analytics
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Button 
          className="h-auto py-4 flex flex-col items-center space-y-2"
          variant="outline"
          onClick={() => setShowUserModal(true)}
          data-testid="button-add-user"
        >
          <UserPlus className="h-5 w-5" />
          <span>Add User</span>
        </Button>
        <Button 
          className="h-auto py-4 flex flex-col items-center space-y-2"
          variant="outline"
          onClick={() => setShowSettingsModal(true)}
          data-testid="button-platform-settings"
        >
          <Settings className="h-5 w-5" />
          <span>Settings</span>
        </Button>
        <Button 
          className="h-auto py-4 flex flex-col items-center space-y-2"
          variant="outline"
          onClick={() => window.location.href = '/api/admin/export'}
          data-testid="button-export-data"
        >
          <Download className="h-5 w-5" />
          <span>Export Data</span>
        </Button>
        <Button 
          className="h-auto py-4 flex flex-col items-center space-y-2"
          variant="outline"
          onClick={() => queryClient.invalidateQueries()}
          data-testid="button-refresh"
        >
          <RefreshCw className="h-5 w-5" />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Time Range Selector */}
      <div className="flex justify-end mb-6">
        <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
          <SelectTrigger className="w-48" data-testid="time-range-selector">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24 Hours</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="90d">Last 90 Days</SelectItem>
            <SelectItem value="1y">Last Year</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(platformStats.totalUsers)}</div>
            <div className="text-xs text-muted-foreground">
              <span className="text-green-500">+12%</span> from last month
            </div>
            <Progress value={75} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(platformStats.totalRevenue)}</div>
            <div className="text-xs text-muted-foreground">
              <span className="text-green-500">+23%</span> from last month
            </div>
            <Progress value={85} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Creators</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(platformStats.totalCreators)}</div>
            <div className="text-xs text-muted-foreground">
              <span className="text-green-500">+18%</span> from last month
            </div>
            <Progress value={65} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getHealthColor(platformStats.serverHealth)}`}>
              {platformStats.serverHealth}%
            </div>
            <div className="text-xs text-muted-foreground">
              All systems operational
            </div>
            <Progress value={platformStats.serverHealth} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="overview" data-testid="tab-overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="users" data-testid="tab-users">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="content" data-testid="tab-content">
            <Video className="h-4 w-4 mr-2" />
            Content
          </TabsTrigger>
          <TabsTrigger value="revenue" data-testid="tab-revenue">
            <DollarSign className="h-4 w-4 mr-2" />
            Revenue
          </TabsTrigger>
          <TabsTrigger value="moderation" data-testid="tab-moderation">
            <Shield className="h-4 w-4 mr-2" />
            Moderation
          </TabsTrigger>
          <TabsTrigger value="system" data-testid="tab-system">
            <Server className="h-4 w-4 mr-2" />
            System
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trends</CardTitle>
                <CardDescription>Platform revenue over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="subscriptions" stroke="#ec4899" fill="#ec4899" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* User Growth Chart */}
            <Card>
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
                <CardDescription>New users and creators</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsLineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="newUsers" stroke="#06b6d4" strokeWidth={2} />
                    <Line type="monotone" dataKey="newCreators" stroke="#10b981" strokeWidth={2} />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Content Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Content Distribution</CardTitle>
                <CardDescription>Types of content on platform</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={[
                        { name: 'Videos', value: 45 },
                        { name: 'Photos', value: 30 },
                        { name: 'Stories', value: 15 },
                        { name: 'Live Streams', value: 10 }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Platform Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Platform Metrics</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Page Views</span>
                    </div>
                    <span className="font-bold">2.4M</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Avg. Session</span>
                    </div>
                    <span className="font-bold">14:32</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Heart className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Engagement Rate</span>
                    </div>
                    <span className="font-bold">68%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Share2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Viral Content</span>
                    </div>
                    <span className="font-bold">142</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Star className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Avg. Rating</span>
                    </div>
                    <span className="font-bold">4.8/5</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
              <CardDescription>Highest earning creators this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
                      <div>
                        <p className="font-semibold">Creator {i}</p>
                        <p className="text-sm text-muted-foreground">@creator{i}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(50000 - i * 5000)}</p>
                      <p className="text-sm text-muted-foreground">{1000 - i * 100} subscribers</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Search and manage platform users</CardDescription>
              <div className="flex items-center space-x-2 mt-4">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by name, email, or username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                  data-testid="search-users"
                />
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-2">
                  {users.map((user: any) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
                        <div>
                          <p className="font-semibold">{user.firstName} {user.lastName}</p>
                          <p className="text-sm text-muted-foreground">@{user.username} • {user.email}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant={user.role === 'creator' ? 'default' : 'secondary'}>
                              {user.role}
                            </Badge>
                            {user.verified && (
                              <Badge variant="outline" className="text-green-500">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                            {user.suspended && (
                              <Badge variant="destructive">
                                <Ban className="h-3 w-3 mr-1" />
                                Suspended
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setSelectedUser(user)}
                          data-testid={`view-user-${user.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {!user.verified && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => verifyUserMutation.mutate(user.id)}
                            data-testid={`verify-user-${user.id}`}
                          >
                            <UserCheck className="h-4 w-4" />
                          </Button>
                        )}
                        {!user.suspended ? (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => suspendUserMutation.mutate(user.id)}
                            data-testid={`suspend-user-${user.id}`}
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => suspendUserMutation.mutate(user.id)}
                            data-testid={`unsuspend-user-${user.id}`}
                          >
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Content Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm">Total Posts</span>
                  <span className="font-bold">{formatNumber(platformStats.totalContent)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Videos</span>
                  <span className="font-bold">{formatNumber(platformStats.totalVideos)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Live Streams</span>
                  <span className="font-bold">42</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Storage Used</span>
                  <span className="font-bold">{formatBytes(platformStats.storageUsed)}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Content Performance</CardTitle>
                <CardDescription>Engagement metrics over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="views" fill="#8b5cf6" />
                    <Bar dataKey="likes" fill="#ec4899" />
                    <Bar dataKey="shares" fill="#06b6d4" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Trending Content</CardTitle>
              <CardDescription>Most popular content this week</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-20 h-20 rounded bg-gradient-to-r from-purple-500 to-pink-500" />
                        <div>
                          <p className="font-semibold">Video Title {i}</p>
                          <p className="text-sm text-muted-foreground">by @creator{i}</p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center">
                              <Eye className="h-3 w-3 mr-1" />
                              {formatNumber(100000 - i * 10000)}
                            </span>
                            <span className="flex items-center">
                              <Heart className="h-3 w-3 mr-1" />
                              {formatNumber(10000 - i * 1000)}
                            </span>
                            <span className="flex items-center">
                              <MessageSquare className="h-3 w-3 mr-1" />
                              {formatNumber(1000 - i * 100)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">View</Button>
                        <Button size="sm" variant="outline">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Total Revenue</CardTitle>
                <CardDescription>All time earnings</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{formatCurrency(platformStats.totalRevenue)}</p>
                <Progress value={85} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue</CardTitle>
                <CardDescription>Current month</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{formatCurrency(platformStats.monthlyRevenue)}</p>
                <p className="text-sm text-green-500">+23% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Transactions</CardTitle>
                <CardDescription>Total processed</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{formatNumber(platformStats.totalTransactions)}</p>
                <p className="text-sm text-muted-foreground">Avg: {formatCurrency(250)}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Breakdown</CardTitle>
              <CardDescription>Revenue sources and distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={[
                  { source: 'Subscriptions', value: 65 },
                  { source: 'PPV Content', value: 45 },
                  { source: 'Tips', value: 30 },
                  { source: 'Live Streams', value: 55 },
                  { source: 'Merchandise', value: 25 },
                  { source: 'Virtual Gifts', value: 40 }
                ]}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="source" />
                  <PolarRadiusAxis />
                  <Radar name="Revenue" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Processors</CardTitle>
              <CardDescription>Transaction volume by processor</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['CCBill', 'NowPayments', 'Triple-A', 'Bankful', 'Authorize.Net'].map((processor) => (
                  <div key={processor} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span>{processor}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-muted-foreground">
                        {formatNumber(Math.floor(Math.random() * 10000))} transactions
                      </span>
                      <span className="font-bold">
                        {formatCurrency(Math.floor(Math.random() * 1000000))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Moderation Tab */}
        <TabsContent value="moderation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content Moderation Queue</CardTitle>
              <CardDescription>Review flagged content</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {flaggedContent.map((content: any) => (
                    <div key={content.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge variant="destructive">{content.reason}</Badge>
                            <span className="text-sm text-muted-foreground">
                              Reported {content.reportCount} times
                            </span>
                          </div>
                          <p className="font-semibold">{content.title}</p>
                          <p className="text-sm text-muted-foreground">by @{content.creator}</p>
                          <p className="text-sm mt-2">{content.description}</p>
                          {content.mediaUrl && (
                            <div className="mt-2 w-40 h-40 bg-muted rounded" />
                          )}
                        </div>
                        <div className="flex flex-col space-y-2 ml-4">
                          <Button 
                            size="sm"
                            variant="outline"
                            className="text-green-500"
                            onClick={() => approveContentMutation.mutate(content.id)}
                            data-testid={`approve-content-${content.id}`}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button 
                            size="sm"
                            variant="outline"
                            className="text-red-500"
                            onClick={() => deleteContentMutation.mutate(content.id)}
                            data-testid={`delete-content-${content.id}`}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                          <Button 
                            size="sm"
                            variant="outline"
                            data-testid={`view-content-${content.id}`}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Moderation Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm">Pending Review</span>
                  <span className="font-bold text-yellow-500">24</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Approved Today</span>
                  <span className="font-bold text-green-500">142</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Removed Today</span>
                  <span className="font-bold text-red-500">18</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Auto-Flagged</span>
                  <span className="font-bold">36</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Report Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <RechartsPieChart>
                    <Pie
                      data={[
                        { name: 'Inappropriate', value: 35 },
                        { name: 'Spam', value: 25 },
                        { name: 'Copyright', value: 20 },
                        { name: 'Harassment', value: 15 },
                        { name: 'Other', value: 5 }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">CPU Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getHealthColor(100 - systemHealth.cpu)}`}>
                  {systemHealth.cpu}%
                </div>
                <Progress value={systemHealth.cpu} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Memory</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getHealthColor(100 - systemHealth.memory)}`}>
                  {systemHealth.memory}%
                </div>
                <Progress value={systemHealth.memory} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Disk Space</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getHealthColor(100 - systemHealth.disk)}`}>
                  {systemHealth.disk}%
                </div>
                <Progress value={systemHealth.disk} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Network</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getHealthColor(100 - systemHealth.network)}`}>
                  {formatBytes(systemHealth.network)}/s
                </div>
                <Progress value={75} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Service Status</CardTitle>
                <CardDescription>All platform services</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { name: 'Database', status: systemHealth.database, icon: Database },
                  { name: 'Cache', status: systemHealth.cache, icon: Cpu },
                  { name: 'CDN', status: 'healthy', icon: Globe },
                  { name: 'Storage', status: 'healthy', icon: HardDrive },
                  { name: 'API Gateway', status: 'healthy', icon: Server },
                  { name: 'WebSocket', status: 'healthy', icon: Wifi }
                ].map((service) => (
                  <div key={service.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <service.icon className="h-4 w-4 text-muted-foreground" />
                      <span>{service.name}</span>
                    </div>
                    <Badge variant={service.status === 'healthy' ? 'default' : 'destructive'}>
                      {service.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Errors</CardTitle>
                <CardDescription>System error log</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {systemHealth.errors.map((error: any, index: number) => (
                      <div key={index} className="p-2 border rounded text-sm">
                        <div className="flex items-center justify-between">
                          <Badge variant="destructive" className="text-xs">
                            {error.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {error.timestamp}
                          </span>
                        </div>
                        <p className="mt-1 text-xs">{error.message}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>System Logs</CardTitle>
              <CardDescription>Real-time system activity</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] bg-black rounded p-4">
                <pre className="text-green-400 text-xs font-mono">
                  {`[2024-08-15 10:23:45] INFO: System startup initiated
[2024-08-15 10:23:46] INFO: Database connection established
[2024-08-15 10:23:47] INFO: Cache service initialized
[2024-08-15 10:23:48] INFO: API Gateway ready
[2024-08-15 10:23:49] INFO: WebSocket server listening on port 3001
[2024-08-15 10:23:50] INFO: All services operational
[2024-08-15 10:24:15] INFO: User authentication successful (user: admin)
[2024-08-15 10:24:32] INFO: Content upload initiated (size: 15.2MB)
[2024-08-15 10:24:45] INFO: Content processing complete
[2024-08-15 10:25:01] INFO: Payment processed successfully
[2024-08-15 10:25:15] WARNING: High memory usage detected (85%)
[2024-08-15 10:25:30] INFO: Garbage collection completed
[2024-08-15 10:25:45] INFO: Memory usage normalized (62%)`}
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* User Details Modal */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
                <div>
                  <h3 className="text-xl font-semibold">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </h3>
                  <p className="text-muted-foreground">@{selectedUser.username}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge>{selectedUser.role}</Badge>
                    {selectedUser.verified && (
                      <Badge variant="outline" className="text-green-500">Verified</Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <p className="text-sm">{selectedUser.email}</p>
                </div>
                <div>
                  <Label>Phone</Label>
                  <p className="text-sm">{selectedUser.phone || 'Not provided'}</p>
                </div>
                <div>
                  <Label>Location</Label>
                  <p className="text-sm">{selectedUser.location || 'Not provided'}</p>
                </div>
                <div>
                  <Label>Joined</Label>
                  <p className="text-sm">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label>Balance</Label>
                  <p className="text-sm font-bold">{formatCurrency(selectedUser.balance || 0)}</p>
                </div>
                <div>
                  <Label>Total Earnings</Label>
                  <p className="text-sm font-bold">{formatCurrency(selectedUser.totalEarnings || 0)}</p>
                </div>
              </div>

              <div>
                <Label>Bio</Label>
                <p className="text-sm">{selectedUser.bio || 'No bio provided'}</p>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedUser(null)}>
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Settings Modal */}
      <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Platform Settings</DialogTitle>
          </DialogHeader>
          <AdminSettings />
        </DialogContent>
      </Dialog>
    </div>
  );
}