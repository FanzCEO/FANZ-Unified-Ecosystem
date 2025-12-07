import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import VideoHub from "@/components/video-hub";
import Navigation from "@/components/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Play,
  Video,
  TrendingUp,
  Clock,
  Calendar,
  Star,
  Users,
  Search,
  Filter,
  Grid3X3,
  List,
  Flame,
  Crown,
  Eye,
  Heart,
  MessageCircle,
  Upload
} from "lucide-react";
import { Link } from "wouter";

export default function TubePage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState("trending");

  const { data: trendingVideos } = useQuery({
    queryKey: ["/api/videos/trending"],
    retry: false,
  });

  const { data: categories } = useQuery({
    queryKey: ["/api/videos/categories"],
    retry: false,
  });

  const { data: featuredCreators } = useQuery({
    queryKey: ["/api/creators/featured"],
    retry: false,
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["/api/messages/unread/count"],
    retry: false,
  });

  // Mock data for demo
  const mockCategories = categories || [
    { id: "all", name: "All", count: 2543 },
    { id: "behind-scenes", name: "Behind Scenes", count: 456 },
    { id: "performance", name: "Performance", count: 234 },
    { id: "tutorial", name: "Tutorials", count: 189 },
    { id: "livestream", name: "Live Streams", count: 67 },
    { id: "q&a", name: "Q&A", count: 123 },
    { id: "fitness", name: "Fitness", count: 89 },
    { id: "lifestyle", name: "Lifestyle", count: 145 }
  ];

  const mockFeaturedCreators = featuredCreators || [
    {
      id: "1",
      name: "Emma Rose",
      username: "emmarose",
      avatar: "https://images.unsplash.com/photo-1494790108344-b2ee30e40a34?w=100&h=100&fit=crop&crop=face",
      subscriberCount: 125000,
      verified: true,
      category: "Lifestyle",
      totalViews: 5600000
    },
    {
      id: "2", 
      name: "Sophia Luna",
      username: "sophialuna",
      avatar: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=100&h=100&fit=crop&crop=face",
      subscriberCount: 89000,
      verified: true,
      category: "Performance",
      totalViews: 3200000
    },
    {
      id: "3",
      name: "Isabella Star", 
      username: "isabellastar",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
      subscriberCount: 67000,
      verified: false,
      category: "Fitness",
      totalViews: 1800000
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      <Navigation unreadCount={unreadCount} />
      
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center">
              <Video className="w-8 h-8 mr-3 text-primary" />
              FanzTube
            </h1>
            <p className="text-gray-400">Discover exclusive video content from creators</p>
          </div>
          
          {user?.role === 'creator' && (
            <Link href="/creator-dashboard">
              <Button className="bg-gradient-to-r from-primary to-secondary hover:from-purple-600 hover:to-pink-600">
                <Upload className="w-4 h-4 mr-2" />
                Upload Video
              </Button>
            </Link>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search videos, creators, categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-gray-800 border-gray-700 pl-12 py-3 text-white placeholder-gray-400 text-lg"
            data-testid="input-video-search"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="trending" className="space-y-6">
              <TabsList className="bg-gray-800 border border-gray-700 p-1">
                <TabsTrigger value="trending" className="flex items-center" data-testid="tab-trending">
                  <Flame className="w-4 h-4 mr-2" />
                  Trending
                </TabsTrigger>
                <TabsTrigger value="latest" className="flex items-center" data-testid="tab-latest">
                  <Clock className="w-4 h-4 mr-2" />
                  Latest
                </TabsTrigger>
                <TabsTrigger value="top" className="flex items-center" data-testid="tab-top">
                  <Star className="w-4 h-4 mr-2" />
                  Top Rated
                </TabsTrigger>
                <TabsTrigger value="live" className="flex items-center" data-testid="tab-live">
                  <Play className="w-4 h-4 mr-2" />
                  Live Now
                </TabsTrigger>
              </TabsList>

              <TabsContent value="trending" className="space-y-6">
                <VideoHub 
                  featured={false}
                  category={category !== "all" ? category : undefined}
                />
              </TabsContent>

              <TabsContent value="latest" className="space-y-6">
                <VideoHub 
                  featured={false}
                  category={category !== "all" ? category : undefined}
                />
              </TabsContent>

              <TabsContent value="top" className="space-y-6">
                <VideoHub 
                  featured={false}
                  category={category !== "all" ? category : undefined}
                />
              </TabsContent>

              <TabsContent value="live" className="space-y-6">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-3"></div>
                      Live Streams
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Live stream cards would go here */}
                      <div className="text-center text-gray-400 py-8 col-span-full">
                        <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No live streams at the moment</p>
                        <p className="text-sm mt-2">Check back later for live content!</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Categories */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Filter className="w-5 h-5 mr-2 text-primary" />
                  Categories
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {mockCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`w-full text-left p-2 rounded-lg transition-colors flex items-center justify-between ${
                      category === cat.id 
                        ? 'bg-primary text-white' 
                        : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                    }`}
                    data-testid={`category-${cat.id}`}
                  >
                    <span>{cat.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {cat.count}
                    </Badge>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Featured Creators */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Crown className="w-5 h-5 mr-2 text-accent" />
                  Featured Creators
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockFeaturedCreators.map((creator) => (
                  <Link key={creator.id} href={`/creator/${creator.username}`}>
                    <div className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors cursor-pointer">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={creator.avatar} alt={creator.name} />
                        <AvatarFallback>{creator.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-1">
                          <p className="font-semibold text-white text-sm">{creator.name}</p>
                          {creator.verified && (
                            <Crown className="w-3 h-3 text-accent" />
                          )}
                        </div>
                        <p className="text-xs text-gray-400">{creator.category}</p>
                        <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                          <span className="flex items-center">
                            <Users className="w-3 h-3 mr-1" />
                            {(creator.subscriberCount / 1000).toFixed(0)}K
                          </span>
                          <span className="flex items-center">
                            <Eye className="w-3 h-3 mr-1" />
                            {(creator.totalViews / 1000000).toFixed(1)}M
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-primary" />
                  Platform Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Videos</span>
                  <span className="font-semibold text-white">2,543</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Active Creators</span>
                  <span className="font-semibold text-white">1,234</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Views</span>
                  <span className="font-semibold text-white">45.2M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Live Now</span>
                  <span className="font-semibold text-red-400 flex items-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-1"></div>
                    23
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}