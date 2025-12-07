import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Heart, Star, Crown, Users, MessageCircle, DollarSign, TrendingUp } from "lucide-react";
import { useState } from "react";

export default function FanDashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Mock data for now - in real app this would come from API
  const featuredCreators = [
    {
      id: "1",
      name: "Emma Fitness",
      category: "Fitness & Health",
      subscribers: 15420,
      monthlyPrice: "9.99",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=emma",
      isVerified: true,
      lastActive: "2 hours ago",
      description: "Certified personal trainer sharing workout routines and nutrition tips",
      totalPosts: 342,
    },
    {
      id: "2", 
      name: "DJ Neon",
      category: "Music & Audio",
      subscribers: 8930,
      monthlyPrice: "14.99",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=dj",
      isVerified: true,
      lastActive: "Online now",
      description: "Electronic music producer and live DJ performances",
      totalPosts: 156,
    },
    {
      id: "3",
      name: "Art By Luna",
      category: "Art & Design",
      subscribers: 12100,
      monthlyPrice: "7.99",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=luna",
      isVerified: false,
      lastActive: "1 day ago",
      description: "Digital artist creating stunning illustrations and tutorials",
      totalPosts: 289,
    },
  ];

  const mySubscriptions = [
    {
      id: "1",
      creator: "Emma Fitness",
      nextBilling: "2024-02-15",
      price: "9.99",
      status: "active",
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center cyber-grid">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading fan dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white cyber-grid relative overflow-hidden">
      {/* Scanning line animation */}
      <div className="scan-line"></div>
      
      {/* Header */}
      <header className="border-b border-border/20 backdrop-blur-sm bg-black/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-primary neon-text" data-testid="text-logo">
              FANZClub
            </h1>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search creators..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-input border-border w-64 neon-border-animated"
                  data-testid="input-search-creators"
                />
              </div>
              <Button 
                onClick={() => window.location.href = '/api/logout'}
                variant="outline"
                className="border-border text-gray-300 hover:text-white"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-glow-animated mb-2" data-testid="text-welcome">
            Welcome back, {(user as any)?.firstName || 'Fan'}!
          </h2>
          <p className="text-gray-400">Discover amazing creators and exclusive content</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Featured Creators */}
            <Card className="neon-card border-border/30" data-testid="section-featured-creators">
              <CardHeader>
                <CardTitle className="text-xl text-primary flex items-center gap-2">
                  <Crown className="w-5 h-5" />
                  Featured Creators
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {featuredCreators.map((creator) => (
                    <div 
                      key={creator.id}
                      className="neon-card p-6 rounded-lg hover:scale-105 transition-all duration-300 cursor-pointer"
                      data-testid={`card-creator-${creator.id}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="relative">
                          <img 
                            src={creator.avatar}
                            alt={creator.name}
                            className="w-16 h-16 rounded-full"
                          />
                          {creator.isVerified && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                              <Crown className="w-3 h-3 text-black" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-white">{creator.name}</h3>
                            {creator.lastActive === "Online now" && (
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs mb-2 border-primary/50 text-primary">
                            {creator.category}
                          </Badge>
                          <p className="text-sm text-gray-400 mb-3">{creator.description}</p>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {creator.subscribers.toLocaleString()}
                            </span>
                            <span>{creator.totalPosts} posts</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <div className="text-lg font-bold text-primary">
                          ${creator.monthlyPrice}/month
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-secondary text-secondary hover:bg-secondary/10"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm"
                            className="gradient-bg hover:opacity-90 transition-opacity"
                            data-testid={`button-subscribe-${creator.id}`}
                          >
                            <Heart className="w-4 h-4 mr-1" />
                            Subscribe
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Categories */}
            <Card className="neon-card border-border/30" data-testid="section-categories">
              <CardHeader>
                <CardTitle className="text-xl text-secondary flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Browse Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    "Fitness & Health", "Music & Audio", "Art & Design", "Gaming",
                    "Lifestyle", "Comedy", "Education", "Technology",
                    "Food & Cooking", "Fashion", "Travel", "Photography"
                  ].map((category) => (
                    <Button
                      key={category}
                      variant="outline"
                      className="text-sm p-3 h-auto text-left border-border hover:border-primary/50 text-gray-300 hover:text-white transition-all duration-300"
                      data-testid={`button-category-${category.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* My Subscriptions */}
            <Card className="neon-card border-border/30" data-testid="section-my-subscriptions">
              <CardHeader>
                <CardTitle className="text-lg text-accent flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  My Subscriptions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {mySubscriptions.length > 0 ? (
                  <div className="space-y-3">
                    {mySubscriptions.map((sub) => (
                      <div 
                        key={sub.id}
                        className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-primary/20"
                      >
                        <div>
                          <p className="font-medium text-white">{sub.creator}</p>
                          <p className="text-xs text-gray-400">Next: {sub.nextBilling}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-primary">${sub.price}</p>
                          <Badge variant="outline" className="text-xs border-green-500 text-green-500">
                            {sub.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Heart className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-gray-400 mb-3">No subscriptions yet</p>
                    <Button size="sm" className="gradient-bg hover:opacity-90">
                      Discover Creators
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="neon-card border-border/30" data-testid="section-quick-stats">
              <CardHeader>
                <CardTitle className="text-lg text-primary flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Active Subscriptions</span>
                    <span className="font-bold text-primary">{mySubscriptions.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Messages Sent</span>
                    <span className="font-bold text-secondary">47</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Tips Given</span>
                    <span className="font-bold text-accent">$125.50</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Favorite Creators</span>
                    <span className="font-bold text-primary">12</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trending Now */}
            <Card className="neon-card border-border/30" data-testid="section-trending">
              <CardHeader>
                <CardTitle className="text-lg text-secondary flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Trending Now
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-xs font-bold text-primary">
                      1
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Yoga Challenges</p>
                      <p className="text-xs text-gray-400">+245% engagement</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-secondary/20 rounded-full flex items-center justify-center text-xs font-bold text-secondary">
                      2
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Music Production</p>
                      <p className="text-xs text-gray-400">+180% growth</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center text-xs font-bold text-accent">
                      3
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Digital Art</p>
                      <p className="text-xs text-gray-400">+156% new creators</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}