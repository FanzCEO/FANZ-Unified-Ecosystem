import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Heart,
  MessageCircle,
  Bell,
  Calendar,
  Star,
  TrendingUp,
  Users,
  Play,
  Image,
  DollarSign,
  ShoppingBag,
  Zap,
  Search,
  Filter,
  MoreHorizontal,
  Clock,
  Bookmark,
  Share2
} from "lucide-react";
import { Link } from "wouter";

interface Subscription {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  price: number;
  status: "active" | "expired" | "cancelled";
  expiresAt: string;
  autoRenew: boolean;
}

interface RecentActivity {
  id: string;
  type: "post" | "live" | "message" | "tip";
  creator: string;
  creatorAvatar: string;
  content: string;
  timestamp: string;
}

interface Recommendation {
  id: string;
  name: string;
  username: string;
  avatar: string;
  subscriberCount: number;
  category: string;
  price: number;
}

export default function FanzDashboard() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch subscriptions
  const { data: subscriptions, isLoading: subsLoading } = useQuery<Subscription[]>({
    queryKey: ["/api/subscriptions"],
    enabled: !!user,
  });

  // Fetch recent activity
  const { data: activity } = useQuery<RecentActivity[]>({
    queryKey: ["/api/activity/recent"],
    enabled: !!user,
  });

  // Fetch recommendations
  const { data: recommendations } = useQuery<Recommendation[]>({
    queryKey: ["/api/creators/recommended"],
    enabled: !!user,
  });

  // Mock data for demonstration
  const mockSubscriptions: Subscription[] = subscriptions || [
    {
      id: "1",
      creatorId: "creator1",
      creatorName: "Emma Rose",
      creatorAvatar: "https://images.unsplash.com/photo-1494790108344-b2ee30e40a34?w=100&h=100&fit=crop&crop=face",
      price: 9.99,
      status: "active",
      expiresAt: "2024-02-15",
      autoRenew: true,
    },
    {
      id: "2",
      creatorId: "creator2",
      creatorName: "Sophia Luna",
      creatorAvatar: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=100&h=100&fit=crop&crop=face",
      price: 14.99,
      status: "active",
      expiresAt: "2024-02-20",
      autoRenew: true,
    },
    {
      id: "3",
      creatorId: "creator3",
      creatorName: "Isabella Star",
      creatorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
      price: 19.99,
      status: "expired",
      expiresAt: "2024-01-10",
      autoRenew: false,
    },
  ];

  const mockActivity: RecentActivity[] = activity || [
    {
      id: "1",
      type: "post",
      creator: "Emma Rose",
      creatorAvatar: "https://images.unsplash.com/photo-1494790108344-b2ee30e40a34?w=100&h=100&fit=crop&crop=face",
      content: "Just posted a new exclusive photoshoot!",
      timestamp: "2 hours ago",
    },
    {
      id: "2",
      type: "live",
      creator: "Sophia Luna",
      creatorAvatar: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=100&h=100&fit=crop&crop=face",
      content: "Going live in 30 minutes - Q&A session!",
      timestamp: "4 hours ago",
    },
    {
      id: "3",
      type: "message",
      creator: "Isabella Star",
      creatorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
      content: "Sent you a private message",
      timestamp: "1 day ago",
    },
  ];

  const mockRecommendations: Recommendation[] = recommendations || [
    {
      id: "4",
      name: "Luna Belle",
      username: "lunabelle",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face",
      subscriberCount: 15234,
      category: "Model",
      price: 12.99,
    },
    {
      id: "5",
      name: "Aria Fox",
      username: "ariafox",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=face",
      subscriberCount: 8567,
      category: "Fitness",
      price: 9.99,
    },
    {
      id: "6",
      name: "Nova Sky",
      username: "novasky",
      avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop&crop=face",
      subscriberCount: 23456,
      category: "Lifestyle",
      price: 14.99,
    },
  ];

  const activeSubscriptions = mockSubscriptions.filter(sub => sub.status === "active");
  const expiredSubscriptions = mockSubscriptions.filter(sub => sub.status === "expired");
  const totalSpent = activeSubscriptions.reduce((sum, sub) => sum + sub.price, 0);

  const getActivityIcon = (type: string) => {
    switch(type) {
      case "post": return <Image className="w-4 h-4" />;
      case "live": return <Play className="w-4 h-4" />;
      case "message": return <MessageCircle className="w-4 h-4" />;
      case "tip": return <Heart className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch(type) {
      case "post": return "text-purple-500";
      case "live": return "text-red-500";
      case "message": return "text-blue-500";
      case "tip": return "text-pink-500";
      default: return "text-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2" data-testid="text-fanz-dashboard-title">
            My Dashboard
          </h1>
          <p className="text-gray-400">Welcome back, {user?.firstName || user?.username || "Fanz"}</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400">Active Subscriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white" data-testid="text-active-subs">
                {activeSubscriptions.length}
              </div>
              <p className="text-xs text-gray-400 mt-1">creators</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400">Monthly Spending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white" data-testid="text-monthly-spending">
                ${totalSpent.toFixed(2)}
              </div>
              <p className="text-xs text-gray-400 mt-1">per month</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400">Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white" data-testid="text-messages">
                3
              </div>
              <p className="text-xs text-gray-400 mt-1">unread</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400">FANZfluence Level</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                <span className="text-2xl font-bold text-white">Bronze</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">2 referrals</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="subscriptions" className="space-y-6">
          <TabsList className="bg-gray-800 border border-gray-700">
            <TabsTrigger value="subscriptions" data-testid="tab-subscriptions">
              <Users className="w-4 h-4 mr-2" />
              Subscriptions
            </TabsTrigger>
            <TabsTrigger value="activity" data-testid="tab-activity">
              <Bell className="w-4 h-4 mr-2" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="discover" data-testid="tab-discover">
              <Search className="w-4 h-4 mr-2" />
              Discover
            </TabsTrigger>
            <TabsTrigger value="saved" data-testid="tab-saved">
              <Bookmark className="w-4 h-4 mr-2" />
              Saved
            </TabsTrigger>
          </TabsList>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions" className="space-y-6">
            {/* Active Subscriptions */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Active Subscriptions</CardTitle>
                <CardDescription className="text-gray-400">
                  Manage your creator subscriptions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activeSubscriptions.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarImage src={sub.creatorAvatar} alt={sub.creatorName} />
                          <AvatarFallback>{sub.creatorName[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-white">{sub.creatorName}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-400">
                            <span className="flex items-center">
                              <DollarSign className="w-3 h-3 mr-1" />
                              ${sub.price}/month
                            </span>
                            <span className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              Renews {new Date(sub.expiresAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {sub.autoRenew && (
                          <Badge variant="secondary" className="bg-green-900 text-green-400">
                            Auto-renew
                          </Badge>
                        )}
                        <Link href={`/creator/${sub.creatorId}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-primary text-primary hover:bg-primary hover:text-white"
                            data-testid={`button-view-creator-${sub.id}`}
                          >
                            View Profile
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Expired Subscriptions */}
            {expiredSubscriptions.length > 0 && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Expired Subscriptions</CardTitle>
                  <CardDescription className="text-gray-400">
                    Renew to regain access
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {expiredSubscriptions.map((sub) => (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg opacity-75"
                      >
                        <div className="flex items-center space-x-4">
                          <Avatar>
                            <AvatarImage src={sub.creatorAvatar} alt={sub.creatorName} />
                            <AvatarFallback>{sub.creatorName[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-white">{sub.creatorName}</p>
                            <p className="text-xs text-gray-400">
                              Expired {new Date(sub.expiresAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-primary to-secondary hover:from-purple-600 hover:to-pink-600"
                          data-testid={`button-renew-${sub.id}`}
                        >
                          Renew
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Recent Activity</CardTitle>
                <CardDescription className="text-gray-400">
                  Updates from your subscribed creators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4">
                    {mockActivity.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start space-x-4 p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors cursor-pointer"
                      >
                        <Avatar>
                          <AvatarImage src={item.creatorAvatar} alt={item.creator} />
                          <AvatarFallback>{item.creator[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className={getActivityColor(item.type)}>
                              {getActivityIcon(item.type)}
                            </span>
                            <p className="font-semibold text-white">{item.creator}</p>
                            <span className="text-xs text-gray-400">{item.timestamp}</span>
                          </div>
                          <p className="text-gray-300">{item.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Discover Tab */}
          <TabsContent value="discover" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Recommended Creators</CardTitle>
                <CardDescription className="text-gray-400">
                  Discover new creators based on your interests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mockRecommendations.map((creator) => (
                    <div
                      key={creator.id}
                      className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors"
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={creator.avatar} alt={creator.name} />
                          <AvatarFallback>{creator.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold text-white">{creator.name}</p>
                          <p className="text-xs text-gray-400">@{creator.username}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                        <span className="flex items-center">
                          <Users className="w-3 h-3 mr-1" />
                          {creator.subscriberCount.toLocaleString()}
                        </span>
                        <Badge variant="secondary">{creator.category}</Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-white font-semibold">
                          ${creator.price}/month
                        </span>
                        <Link href={`/creator/${creator.id}`}>
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-primary to-secondary hover:from-purple-600 hover:to-pink-600"
                            data-testid={`button-view-${creator.id}`}
                          >
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Saved Tab */}
          <TabsContent value="saved" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Saved Content</CardTitle>
                <CardDescription className="text-gray-400">
                  Your bookmarked posts and media
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-400">
                  <Bookmark className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No saved content yet</p>
                  <p className="text-sm mt-2">
                    Save posts and media to view them here later
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}