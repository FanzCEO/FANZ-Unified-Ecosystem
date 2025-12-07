import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { EarningsChart } from "@/components/charts/earnings-chart";
import { CreateContentModal } from "@/components/modals/create-content-modal";
import { useState } from "react";
import { DollarSign, Users, TrendingUp, CreditCard, Plus, Radio, MessageSquare, Settings } from "lucide-react";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);

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

  const { data: creator, isLoading: creatorLoading } = useQuery({
    queryKey: ["/api/creator/profile"],
    retry: false,
  });

  const { data: posts } = useQuery({
    queryKey: ["/api/posts"],
    retry: false,
  });

  const { data: subscribers } = useQuery({
    queryKey: ["/api/subscribers"],
    retry: false,
  });

  const { data: conversations } = useQuery({
    queryKey: ["/api/conversations"],
    retry: false,
  });

  if (isLoading || creatorLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const subscriberCount = (subscribers || []).length;
  const totalEarnings = (posts || []).reduce((sum: number, post: any) => sum + parseFloat(post.earnings || "0"), 0);
  const unreadMessages = (conversations || []).filter((conv: any) => !conv.conversation.isRead).length;

  return (
    <div className="min-h-screen bg-black text-white cyber-grid relative overflow-hidden">
      {/* Scanning line animation */}
      <div className="scan-line"></div>
      <Sidebar />
      <MobileNav />
      
      <div className="lg:pl-64 pb-20 lg:pb-0">
        {/* Header */}
        <header className="neon-card border-b border-primary/20 backdrop-blur-sm bg-black/50 px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="lg:hidden">
              <h1 className="text-xl font-bold text-primary neon-text" data-testid="text-mobile-logo">
                FANZClub
              </h1>
            </div>
            <div className="hidden lg:block">
              <h1 className="text-2xl font-bold text-primary neon-text text-glow-animated" data-testid="text-page-title">Creator Dashboard</h1>
              <p className="text-sm text-secondary" data-testid="text-page-description">
                Manage your content and earnings
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="relative p-2 rounded-lg hover:bg-accent/10 transition-colors" data-testid="button-notifications">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5c-1.5-1.5-2.5-3.5-3-5zM10.5 17H8l-5 5c1.5-1.5 2.5-3.5 3-5zM12 3v4m0 10v4m-8-8h4m12 0h4"></path>
                </svg>
                {unreadMessages > 0 && (
                  <span className="absolute top-0 right-0 w-3 h-3 bg-secondary rounded-full" data-testid="indicator-notifications"></span>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-4 lg:p-6">
          {/* Earnings Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card data-testid="card-total-earnings">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Earnings</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="text-total-earnings">
                      ${totalEarnings.toFixed(2)}
                    </p>
                    <p className="text-xs text-green-500 mt-1">+23% from last month</p>
                  </div>
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <DollarSign className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-subscribers">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Subscribers</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="text-subscriber-count">
                      {subscriberCount}
                    </p>
                    <p className="text-xs text-green-500 mt-1">+127 this week</p>
                  </div>
                  <div className="bg-secondary/10 p-3 rounded-lg">
                    <Users className="w-6 h-6 text-secondary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-monthly-revenue">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">This Month</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="text-monthly-revenue">
                      ${(totalEarnings * 0.3).toFixed(2)}
                    </p>
                    <p className="text-xs text-green-500 mt-1">+18% vs last month</p>
                  </div>
                  <div className="bg-accent/10 p-3 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-available-balance">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Available Balance</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="text-available-balance">
                      ${(totalEarnings * 0.6).toFixed(2)}
                    </p>
                    <button className="text-xs text-primary hover:text-primary/80 mt-1 transition-colors" data-testid="button-request-payout">
                      Request Payout
                    </button>
                  </div>
                  <div className="bg-green-500/10 p-3 rounded-lg">
                    <CreditCard className="w-6 h-6 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Button 
              onClick={() => setShowCreateModal(true)}
              variant="gradient"
              className="rounded-xl p-4 h-auto flex flex-col items-center space-y-2 neon-glow glitch-effect"
              data-testid="button-create-post"
            >
              <Plus className="w-8 h-8" />
              <span className="font-medium">Create Post</span>
            </Button>
            
            <Button 
              variant="neon"
              className="rounded-xl p-4 h-auto flex flex-col items-center space-y-2"
              data-testid="button-go-live"
            >
              <Radio className="w-8 h-8" />
              <span className="font-medium">Go Live</span>
            </Button>
            
            <Button 
              variant="neon-outline"
              className="rounded-xl p-4 h-auto flex flex-col items-center space-y-2"
              data-testid="button-send-blast"
            >
              <MessageSquare className="w-8 h-8" />
              <span className="font-medium">Send Blast</span>
            </Button>
            
            <Button 
              variant="neon-outline"
              className="rounded-xl p-4 h-auto flex flex-col items-center space-y-2"
              data-testid="button-manage-subscription"
            >
              <Settings className="w-8 h-8" />
              <span className="font-medium">Subscription</span>
            </Button>
          </div>

          {/* Recent Activity & Content Management */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Recent Posts */}
            <Card className="lg:col-span-2" data-testid="section-recent-posts">
              <div className="p-6 border-b border-primary/20">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Recent Posts</h2>
                  <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80" data-testid="button-view-all-posts">
                    View All
                  </Button>
                </div>
              </div>
              <CardContent className="p-6 pt-0 space-y-4">
                {(posts || []).length > 0 ? (
                  (posts || []).slice(0, 3).map((post: any) => (
                    <div key={post.id} className="flex items-start space-x-4 p-4 bg-muted/30 rounded-lg" data-testid={`post-${post.id}`}>
                      {post.mediaUrl && (
                        <img 
                          src={post.mediaUrl} 
                          alt={post.title} 
                          className="w-16 h-16 rounded-lg object-cover"
                          data-testid={`img-post-${post.id}`}
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium" data-testid={`text-post-title-${post.id}`}>{post.title}</h3>
                          <span className="text-xs text-muted-foreground" data-testid={`text-post-time-${post.id}`}>
                            {new Date(post.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1" data-testid={`text-post-engagement-${post.id}`}>
                          {post.likes} likes • {post.comments} comments
                        </p>
                        <div className="flex items-center mt-2 space-x-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            post.visibility === 'public' ? 'bg-green-500/10 text-green-500' :
                            post.visibility === 'subscribers' ? 'bg-primary/10 text-primary' :
                            'bg-accent/10 text-accent'
                          }`} data-testid={`badge-post-visibility-${post.id}`}>
                            {post.visibility === 'public' ? 'Public' : 
                             post.visibility === 'subscribers' ? 'Members Only' : 'Pay-per-view'}
                          </span>
                          <span className="text-xs text-green-500" data-testid={`text-post-earnings-${post.id}`}>
                            ${post.earnings} earned
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8" data-testid="empty-posts">
                    <p className="text-muted-foreground">No posts yet. Create your first post to get started!</p>
                    <Button 
                      onClick={() => setShowCreateModal(true)}
                      className="mt-4 gradient-bg"
                      data-testid="button-create-first-post"
                    >
                      Create Your First Post
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats & Actions */}
            <div className="space-y-6">
              {/* Top Fans */}
              <Card data-testid="section-top-fans">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Top Fans</h3>
                  <div className="space-y-3">
                    {(subscribers || []).length > 0 ? (
                      (subscribers || []).slice(0, 3).map((sub: any, index: number) => (
                        <div key={sub.subscription.id} className="flex items-center justify-between" data-testid={`fan-${sub.subscription.id}`}>
                          <div className="flex items-center space-x-3">
                            <img 
                              src={sub.fan.profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sub.fan.email}`} 
                              alt="Fan profile" 
                              className="w-8 h-8 rounded-full object-cover"
                              data-testid={`img-fan-${sub.subscription.id}`}
                            />
                            <div>
                              <p className="text-sm font-medium" data-testid={`text-fan-name-${sub.subscription.id}`}>
                                {sub.fan.firstName} {sub.fan.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground" data-testid={`text-fan-spent-${sub.subscription.id}`}>
                                ${sub.subscription.price} spent
                              </p>
                            </div>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            index === 0 ? 'bg-primary/10 text-primary' : 
                            index === 1 ? 'bg-secondary/10 text-secondary' : 
                            'bg-accent/10 text-accent'
                          }`} data-testid={`badge-fan-tier-${sub.subscription.id}`}>
                            {index === 0 ? 'VIP' : index === 1 ? 'Supporter' : 'Member'}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4" data-testid="empty-fans">
                        <p className="text-sm text-muted-foreground">No subscribers yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Messages */}
              <Card data-testid="section-recent-messages">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Recent Messages</h3>
                    {unreadMessages > 0 && (
                      <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full" data-testid="badge-unread-count">
                        {unreadMessages} new
                      </span>
                    )}
                  </div>
                  <div className="space-y-3">
                    {(conversations || []).length > 0 ? (
                      (conversations || []).slice(0, 3).map((conv: any) => (
                        <div key={conv.conversation.id} className="flex items-start space-x-3" data-testid={`conversation-${conv.conversation.id}`}>
                          <img 
                            src={conv.otherUser.profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.otherUser.email}`} 
                            alt="Fan message" 
                            className="w-8 h-8 rounded-full object-cover"
                            data-testid={`img-conversation-user-${conv.conversation.id}`}
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium" data-testid={`text-conversation-name-${conv.conversation.id}`}>
                                {conv.otherUser.firstName} {conv.otherUser.lastName}
                              </p>
                              <span className="text-xs text-muted-foreground" data-testid={`text-conversation-time-${conv.conversation.id}`}>
                                {new Date(conv.conversation.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground" data-testid={`text-conversation-preview-${conv.conversation.id}`}>
                              {conv.conversation.content}
                            </p>
                          </div>
                          {!conv.conversation.isRead && (
                            <div className="w-2 h-2 bg-secondary rounded-full" data-testid={`indicator-unread-${conv.conversation.id}`}></div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4" data-testid="empty-messages">
                        <p className="text-sm text-muted-foreground">No messages yet</p>
                      </div>
                    )}
                  </div>
                  {(conversations || []).length > 0 && (
                    <Button 
                      variant="ghost" 
                      className="w-full mt-4 text-primary hover:text-primary/80 text-sm transition-colors"
                      data-testid="button-view-all-messages"
                    >
                      View All Messages
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Analytics Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Earnings Chart */}
            <Card className="bg-card border-border" data-testid="section-earnings-chart">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Earnings Overview</h3>
                <EarningsChart />
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Monthly Revenue</span>
                  <span className="text-green-500">↗ 23% increase</span>
                </div>
              </CardContent>
            </Card>

            {/* Content Performance */}
            <Card className="bg-card border-border" data-testid="section-content-performance">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Content Performance</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Posts</span>
                    <span className="text-lg font-semibold" data-testid="text-total-posts">
                      {(posts || []).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Avg. Engagement</span>
                    <span className="text-lg font-semibold text-green-500" data-testid="text-avg-engagement">
                      8.3%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Most Popular</span>
                    <span className="text-sm font-medium" data-testid="text-most-popular">
                      {(posts || []).length > 0 ? (posts || [])[0].mediaType : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Revenue per Post</span>
                    <span className="text-lg font-semibold" data-testid="text-revenue-per-post">
                      ${(posts || []).length > 0 ? (totalEarnings / (posts || []).length).toFixed(2) : '0.00'}
                    </span>
                  </div>
                </div>
                
                {/* Content Types Chart */}
                <div className="mt-6">
                  <h4 className="text-sm font-medium mb-3">Content Mix</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Photos</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 h-2 bg-muted rounded-full">
                          <div className="w-12 h-2 bg-primary rounded-full"></div>
                        </div>
                        <span className="text-xs" data-testid="text-photos-percentage">75%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Videos</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 h-2 bg-muted rounded-full">
                          <div className="w-6 h-2 bg-secondary rounded-full"></div>
                        </div>
                        <span className="text-xs" data-testid="text-videos-percentage">40%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Audio</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 h-2 bg-muted rounded-full">
                          <div className="w-3 h-2 bg-accent rounded-full"></div>
                        </div>
                        <span className="text-xs" data-testid="text-audio-percentage">20%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <CreateContentModal 
        open={showCreateModal} 
        onOpenChange={setShowCreateModal}
      />
    </div>
  );
}
