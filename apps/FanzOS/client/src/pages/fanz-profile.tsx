import { useState } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  User as UserIcon,
  Calendar,
  MapPin,
  Link2,
  Shield,
  Star,
  Trophy,
  Zap,
  Users,
  Heart,
  MessageCircle,
  ShoppingBag,
  Gift,
  TrendingUp,
  Award,
  Edit,
  Settings,
  Share2,
  MoreVertical
} from "lucide-react";
import { Link } from "wouter";

interface FanzProfile {
  id: string;
  username: string;
  displayName: string;
  bio?: string;
  avatar: string;
  banner?: string;
  joinDate: string;
  location?: string;
  website?: string;
  subscriptionCount: number;
  followingCount: number;
  likesGiven: number;
  commentsCount: number;
  fanzfluenceLevel: string;
  fanzfluencePoints: number;
  referralCount: number;
  badges: {
    id: string;
    name: string;
    icon: string;
    description: string;
    earnedAt: string;
  }[];
  recentActivity: {
    id: string;
    type: "subscription" | "like" | "comment" | "tip" | "referral";
    description: string;
    timestamp: string;
  }[];
  favoriteCreators: {
    id: string;
    name: string;
    username: string;
    avatar: string;
  }[];
  stats: {
    totalSpent: number;
    tipsGiven: number;
    ppvUnlocked: number;
    contestsEntered: number;
  };
}

export default function FanzProfile() {
  const [, params] = useRoute("/fanz/:username");
  const { user: currentUser } = useAuth() as { user: User | undefined };
  const [selectedTab, setSelectedTab] = useState("activity");

  // Check if this is the current user's profile
  const isOwnProfile = currentUser?.username === params?.username;

  // Fetch fanz profile
  const { data: profile, isLoading: profileLoading } = useQuery<FanzProfile>({
    queryKey: ["/api/fanz", params?.username],
    enabled: !!params?.username,
  });

  // Mock data for demonstration
  const mockProfile: FanzProfile = profile || {
    id: "fanz1",
    username: params?.username || "johndoe",
    displayName: "John Doe",
    bio: "🎨 Art enthusiast | 📸 Photography lover | Supporting amazing creators",
    avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200&h=200&fit=crop&crop=face",
    banner: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&h=400&fit=crop",
    joinDate: "2023-06-15",
    location: "New York, NY",
    website: "johndoe.com",
    subscriptionCount: 12,
    followingCount: 45,
    likesGiven: 1234,
    commentsCount: 567,
    fanzfluenceLevel: "Gold",
    fanzfluencePoints: 2450,
    referralCount: 8,
    badges: [
      {
        id: "1",
        name: "Early Supporter",
        icon: "⭐",
        description: "Joined in the first month",
        earnedAt: "2023-06-15"
      },
      {
        id: "2",
        name: "Top Fanz",
        icon: "🏆",
        description: "Subscribed to 10+ creators",
        earnedAt: "2023-08-20"
      },
      {
        id: "3",
        name: "Big Tipper",
        icon: "💎",
        description: "Tipped over $500 total",
        earnedAt: "2023-10-05"
      },
      {
        id: "4",
        name: "FANZfluencer",
        icon: "⚡",
        description: "Referred 5+ new users",
        earnedAt: "2023-11-12"
      }
    ],
    recentActivity: [
      {
        id: "1",
        type: "subscription",
        description: "Subscribed to Emma Rose",
        timestamp: "2 hours ago"
      },
      {
        id: "2",
        type: "tip",
        description: "Sent a $50 tip to Sophia Luna",
        timestamp: "1 day ago"
      },
      {
        id: "3",
        type: "referral",
        description: "Invited a new user to the platform",
        timestamp: "3 days ago"
      },
      {
        id: "4",
        type: "like",
        description: "Liked 5 posts from Isabella Star",
        timestamp: "5 days ago"
      }
    ],
    favoriteCreators: [
      {
        id: "creator1",
        name: "Emma Rose",
        username: "emmarose",
        avatar: "https://images.unsplash.com/photo-1494790108344-b2ee30e40a34?w=100&h=100&fit=crop&crop=face"
      },
      {
        id: "creator2",
        name: "Sophia Luna",
        username: "sophialuna",
        avatar: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=100&h=100&fit=crop&crop=face"
      },
      {
        id: "creator3",
        name: "Isabella Star",
        username: "isabellastar",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face"
      }
    ],
    stats: {
      totalSpent: 3456.78,
      tipsGiven: 892.50,
      ppvUnlocked: 23,
      contestsEntered: 5
    }
  };

  const getFanzfluenceLevelColor = (level: string) => {
    switch(level.toLowerCase()) {
      case "bronze": return "text-orange-600";
      case "silver": return "text-gray-400";
      case "gold": return "text-yellow-500";
      case "platinum": return "text-purple-400";
      case "diamond": return "text-cyan-400";
      default: return "text-gray-400";
    }
  };

  const getActivityIcon = (type: string) => {
    switch(type) {
      case "subscription": return <Users className="w-4 h-4" />;
      case "like": return <Heart className="w-4 h-4" />;
      case "comment": return <MessageCircle className="w-4 h-4" />;
      case "tip": return <Gift className="w-4 h-4" />;
      case "referral": return <Zap className="w-4 h-4" />;
      default: return <Star className="w-4 h-4" />;
    }
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Banner */}
      <div className="relative h-48 md:h-64">
        {mockProfile.banner ? (
          <img
            src={mockProfile.banner}
            alt="Banner"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-primary to-secondary" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900" />
      </div>

      {/* Profile Info */}
      <div className="container mx-auto px-4 -mt-16 relative">
        <div className="flex flex-col md:flex-row items-start md:items-end space-y-4 md:space-y-0 md:space-x-6">
          {/* Avatar */}
          <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-gray-900">
            <AvatarImage src={mockProfile.avatar} alt={mockProfile.displayName} />
            <AvatarFallback>{mockProfile.displayName[0]}</AvatarFallback>
          </Avatar>

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2" data-testid="text-fanz-name">
              {mockProfile.displayName}
            </h1>
            <p className="text-gray-400 mb-2">@{mockProfile.username}</p>
            {mockProfile.bio && (
              <p className="text-white mb-3">{mockProfile.bio}</p>
            )}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                Joined {new Date(mockProfile.joinDate).toLocaleDateString()}
              </span>
              {mockProfile.location && (
                <span className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {mockProfile.location}
                </span>
              )}
              {mockProfile.website && (
                <a
                  href={`https://${mockProfile.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center hover:text-primary"
                >
                  <Link2 className="w-4 h-4 mr-1" />
                  {mockProfile.website}
                </a>
              )}
            </div>
          </div>

          {/* Actions */}
          {isOwnProfile ? (
            <div className="flex space-x-2">
              <Link href="/settings">
                <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </Link>
              <Button variant="ghost" className="text-gray-400 hover:text-white">
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          ) : (
            <div className="flex space-x-2">
              <Link href="/messages">
                <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message
                </Button>
              </Link>
              <Button variant="ghost" className="text-gray-400 hover:text-white">
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 mb-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="pt-4 pb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-white" data-testid="text-subscriptions">
                  {mockProfile.subscriptionCount}
                </p>
                <p className="text-xs text-gray-400">Subscriptions</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="pt-4 pb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-white" data-testid="text-following">
                  {mockProfile.followingCount}
                </p>
                <p className="text-xs text-gray-400">Following</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="pt-4 pb-4">
              <div className="text-center">
                <p className={`text-2xl font-bold ${getFanzfluenceLevelColor(mockProfile.fanzfluenceLevel)}`}>
                  {mockProfile.fanzfluenceLevel}
                </p>
                <p className="text-xs text-gray-400">FANZfluence</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="pt-4 pb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-white" data-testid="text-referrals">
                  {mockProfile.referralCount}
                </p>
                <p className="text-xs text-gray-400">Referrals</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-8">
          <TabsList className="bg-gray-800 border border-gray-700">
            <TabsTrigger value="activity" data-testid="tab-activity">
              <TrendingUp className="w-4 h-4 mr-2" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="badges" data-testid="tab-badges">
              <Award className="w-4 h-4 mr-2" />
              Badges
            </TabsTrigger>
            <TabsTrigger value="creators" data-testid="tab-creators">
              <Users className="w-4 h-4 mr-2" />
              Creators
            </TabsTrigger>
            <TabsTrigger value="stats" data-testid="tab-stats">
              <Trophy className="w-4 h-4 mr-2" />
              Stats
            </TabsTrigger>
          </TabsList>

          {/* Activity Tab */}
          <TabsContent value="activity" className="mt-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Recent Activity</CardTitle>
                <CardDescription className="text-gray-400">
                  Latest interactions on the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {mockProfile.recentActivity.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start space-x-3 p-3 bg-gray-700 rounded-lg"
                      >
                        <div className={`mt-1 ${
                          activity.type === "subscription" ? "text-purple-500" :
                          activity.type === "tip" ? "text-green-500" :
                          activity.type === "referral" ? "text-yellow-500" :
                          activity.type === "like" ? "text-pink-500" :
                          "text-blue-500"
                        }`}>
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1">
                          <p className="text-white">{activity.description}</p>
                          <p className="text-xs text-gray-400 mt-1">{activity.timestamp}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Badges Tab */}
          <TabsContent value="badges" className="mt-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Achievements</CardTitle>
                <CardDescription className="text-gray-400">
                  Badges earned on the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mockProfile.badges.map((badge) => (
                    <div
                      key={badge.id}
                      className="flex items-start space-x-4 p-4 bg-gray-700 rounded-lg"
                    >
                      <div className="text-3xl">{badge.icon}</div>
                      <div className="flex-1">
                        <p className="font-semibold text-white">{badge.name}</p>
                        <p className="text-sm text-gray-400 mt-1">{badge.description}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          Earned {new Date(badge.earnedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Creators Tab */}
          <TabsContent value="creators" className="mt-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Favorite Creators</CardTitle>
                <CardDescription className="text-gray-400">
                  Creators this user supports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mockProfile.favoriteCreators.map((creator) => (
                    <Link key={creator.id} href={`/creator/${creator.username}`}>
                      <div className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors cursor-pointer">
                        <Avatar>
                          <AvatarImage src={creator.avatar} alt={creator.name} />
                          <AvatarFallback>{creator.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-white">{creator.name}</p>
                          <p className="text-xs text-gray-400">@{creator.username}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Platform Stats</CardTitle>
                  <CardDescription className="text-gray-400">
                    Overall activity metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Total Spent</span>
                      <span className="text-green-500 font-semibold">
                        ${mockProfile.stats.totalSpent.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Tips Given</span>
                      <span className="text-white font-semibold">
                        ${mockProfile.stats.tipsGiven.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">PPV Unlocked</span>
                      <span className="text-white font-semibold">
                        {mockProfile.stats.ppvUnlocked}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Contests Entered</span>
                      <span className="text-white font-semibold">
                        {mockProfile.stats.contestsEntered}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">FANZfluence Progress</CardTitle>
                  <CardDescription className="text-gray-400">
                    Affiliate program status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center py-4">
                      <Zap className={`w-16 h-16 mx-auto mb-2 ${getFanzfluenceLevelColor(mockProfile.fanzfluenceLevel)}`} />
                      <p className={`text-2xl font-bold ${getFanzfluenceLevelColor(mockProfile.fanzfluenceLevel)}`}>
                        {mockProfile.fanzfluenceLevel}
                      </p>
                      <p className="text-gray-400 text-sm mt-1">
                        {mockProfile.fanzfluencePoints} points
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Referrals</span>
                        <span className="text-white">{mockProfile.referralCount}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Next Level</span>
                        <span className="text-white">
                          {mockProfile.fanzfluenceLevel === "Gold" ? "Platinum" : "Diamond"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Points to Next</span>
                        <span className="text-white">
                          {3000 - mockProfile.fanzfluencePoints}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}