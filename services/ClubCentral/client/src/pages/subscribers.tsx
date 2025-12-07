import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Users, Search, Crown, Heart, Star } from "lucide-react";
import { useState } from "react";

export default function Subscribers() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
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

  const { data: subscribers, isLoading: subscribersLoading } = useQuery({
    queryKey: ["/api/subscribers"],
    retry: false,
  });

  const { data: tips } = useQuery({
    queryKey: ["/api/tips"],
    retry: false,
  });

  if (isLoading || subscribersLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading subscribers...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Calculate fan metrics
  const subscriberMetrics = (subscribers as any[])?.map((sub: any) => {
    const fanTips = (tips as any[])?.filter((tip: any) => tip.tip.fromUserId === sub.fan.id) || [];
    const totalTips = fanTips.reduce((sum: number, tip: any) => sum + parseFloat(tip.tip.amount), 0);
    const totalSpent = parseFloat(sub.subscription.price) + totalTips;
    
    return {
      ...sub,
      totalSpent,
      totalTips,
      tipCount: fanTips.length,
    };
  }) || [];

  // Sort by total spent (highest first)
  const sortedSubscribers = subscriberMetrics.sort((a: any, b: any) => b.totalSpent - a.totalSpent);

  // Filter subscribers based on search
  const filteredSubscribers = sortedSubscribers.filter((sub: any) =>
    sub.fan.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.fan.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.fan.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get tier for subscriber based on total spent
  const getTier = (totalSpent: number, index: number) => {
    if (totalSpent > 200 || index === 0) return { name: "VIP", icon: Crown, color: "text-primary bg-primary/10" };
    if (totalSpent > 100 || index === 1) return { name: "Supporter", icon: Heart, color: "text-secondary bg-secondary/10" };
    return { name: "Member", icon: Star, color: "text-accent bg-accent/10" };
  };

  const stats = {
    total: (subscribers as any[])?.length || 0,
    vip: sortedSubscribers.filter((_: any, index: number) => index === 0 || sortedSubscribers[index].totalSpent > 200).length,
    supporters: sortedSubscribers.filter((_: any, index: number) => index === 1 || (sortedSubscribers[index].totalSpent > 100 && sortedSubscribers[index].totalSpent <= 200)).length,
    totalRevenue: sortedSubscribers.reduce((sum: number, sub: any) => sum + sub.totalSpent, 0),
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar />
      <MobileNav />
      
      <div className="lg:pl-64 pb-20 lg:pb-0">
        {/* Header */}
        <header className="bg-card border-b border-border px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-page-title">Subscribers</h1>
              <p className="text-sm text-muted-foreground" data-testid="text-page-description">
                Manage your fan community and relationships
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search subscribers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-input border-border w-64"
                  data-testid="input-search-subscribers"
                />
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-card border-border" data-testid="card-total-subscribers">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Subscribers</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="text-total-subscribers">
                      {stats.total}
                    </p>
                    <p className="text-xs text-green-500 mt-1">Active members</p>
                  </div>
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border" data-testid="card-vip-subscribers">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">VIP Members</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="text-vip-count">
                      {stats.vip}
                    </p>
                    <p className="text-xs text-primary mt-1">Top supporters</p>
                  </div>
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <Crown className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border" data-testid="card-supporter-subscribers">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Supporters</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="text-supporter-count">
                      {stats.supporters}
                    </p>
                    <p className="text-xs text-secondary mt-1">Regular tippers</p>
                  </div>
                  <div className="bg-secondary/10 p-3 rounded-lg">
                    <Heart className="w-6 h-6 text-secondary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border" data-testid="card-total-revenue">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="text-total-revenue">
                      ${stats.totalRevenue.toFixed(2)}
                    </p>
                    <p className="text-xs text-green-500 mt-1">All time</p>
                  </div>
                  <div className="bg-green-500/10 p-3 rounded-lg">
                    <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Subscribers List */}
          <Card className="bg-card border-border" data-testid="section-subscribers-list">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Your Subscribers</h2>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" data-testid="filter-all">All</Button>
                  <Button variant="ghost" size="sm" data-testid="filter-vip">VIP</Button>
                  <Button variant="ghost" size="sm" data-testid="filter-supporters">Supporters</Button>
                </div>
              </div>

              {filteredSubscribers.length > 0 ? (
                <div className="space-y-4" data-testid="list-subscribers">
                  {filteredSubscribers.map((sub: any, index: number) => {
                    const tier = getTier(sub.totalSpent, index);
                    const TierIcon = tier.icon;
                    
                    return (
                      <div 
                        key={sub.subscription.id} 
                        className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                        data-testid={`subscriber-item-${sub.subscription.id}`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <img 
                              src={sub.fan.profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sub.fan.email}`} 
                              alt="Subscriber" 
                              className="w-12 h-12 rounded-full object-cover"
                              data-testid={`img-subscriber-${sub.subscription.id}`}
                            />
                            {index < 3 && (
                              <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground">
                                {index + 1}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <p className="font-medium" data-testid={`text-subscriber-name-${sub.subscription.id}`}>
                                {sub.fan.firstName} {sub.fan.lastName}
                              </p>
                              <span className={`text-xs px-2 py-1 rounded-full flex items-center space-x-1 ${tier.color}`}>
                                <TierIcon className="w-3 h-3" />
                                <span>{tier.name}</span>
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground" data-testid={`text-subscriber-email-${sub.subscription.id}`}>
                              {sub.fan.email}
                            </p>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className="text-xs text-muted-foreground">
                                Subscribed: {new Date(sub.subscription.startDate).toLocaleDateString()}
                              </span>
                              {sub.tipCount > 0 && (
                                <span className="text-xs text-green-500">
                                  {sub.tipCount} tips sent
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-lg font-bold text-green-500" data-testid={`text-subscriber-total-${sub.subscription.id}`}>
                            ${sub.totalSpent.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">Total spent</p>
                          <div className="mt-1 text-xs text-muted-foreground">
                            <div>Subscription: ${sub.subscription.price}</div>
                            {sub.totalTips > 0 && (
                              <div>Tips: ${sub.totalTips.toFixed(2)}</div>
                            )}
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            data-testid={`button-message-${sub.subscription.id}`}
                          >
                            Message
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            data-testid={`button-more-${sub.subscription.id}`}
                          >
                            •••
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16" data-testid="empty-subscribers">
                  <div className="bg-muted/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    {searchQuery ? "No subscribers found" : "No subscribers yet"}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {searchQuery 
                      ? "Try adjusting your search terms" 
                      : "Start creating content to attract your first subscribers"
                    }
                  </p>
                  {!searchQuery && (
                    <Button 
                      className="gradient-bg hover:opacity-90 transition-opacity"
                      data-testid="button-create-content"
                    >
                      Create Content
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
