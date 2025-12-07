import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { EarningsChart } from "@/components/charts/earnings-chart";

export default function Analytics() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

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

  const { data: posts } = useQuery({
    queryKey: ["/api/posts"],
    retry: false,
  });

  const { data: subscribers } = useQuery({
    queryKey: ["/api/subscribers"],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const totalEarnings = (posts || []).reduce((sum: number, post: any) => sum + parseFloat(post.earnings || "0"), 0);
  const subscriptionEarnings = (totalEarnings * 0.66) || 0;
  const tipEarnings = (totalEarnings * 0.23) || 0;
  const payPerViewEarnings = (totalEarnings * 0.11) || 0;

  const topPosts = (posts || []).sort((a: any, b: any) => parseFloat(b.earnings) - parseFloat(a.earnings)).slice(0, 3);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar />
      <MobileNav />
      
      <div className="lg:pl-64 pb-20 lg:pb-0">
        {/* Header */}
        <header className="bg-card border-b border-border px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-page-title">Analytics & Insights</h1>
              <p className="text-sm text-muted-foreground" data-testid="text-page-description">
                Track your performance and optimize your content strategy
              </p>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-6">
          {/* Time Period Selector */}
          <div className="mb-6">
            <div className="flex space-x-2">
              <Button variant="default" size="sm" data-testid="filter-30-days">Last 30 Days</Button>
              <Button variant="outline" size="sm" data-testid="filter-90-days">Last 90 Days</Button>
              <Button variant="outline" size="sm" data-testid="filter-year">Last Year</Button>
            </div>
          </div>

          {/* Detailed Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Revenue Breakdown */}
            <Card className="bg-card border-border" data-testid="section-revenue-breakdown">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Revenue Breakdown</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-primary rounded-full"></div>
                      <span className="text-sm">Subscriptions</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium" data-testid="text-subscription-revenue">
                        ${subscriptionEarnings.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">66%</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-secondary rounded-full"></div>
                      <span className="text-sm">Tips</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium" data-testid="text-tip-revenue">
                        ${tipEarnings.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">23%</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-accent rounded-full"></div>
                      <span className="text-sm">Pay-per-view</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium" data-testid="text-ppv-revenue">
                        ${payPerViewEarnings.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">11%</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subscriber Growth */}
            <Card className="bg-card border-border" data-testid="section-subscriber-growth">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Subscriber Growth</h3>
                <div className="h-48 flex items-end justify-between space-x-1">
                  <div className="flex flex-col items-center">
                    <div className="w-6 bg-primary/30 rounded-t" style={{height: '40px'}}></div>
                    <span className="text-xs text-muted-foreground mt-2">W1</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-6 bg-primary/40 rounded-t" style={{height: '55px'}}></div>
                    <span className="text-xs text-muted-foreground mt-2">W2</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-6 bg-primary/60 rounded-t" style={{height: '75px'}}></div>
                    <span className="text-xs text-muted-foreground mt-2">W3</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-6 bg-primary rounded-t" style={{height: '120px'}}></div>
                    <span className="text-xs text-primary mt-2 font-medium">W4</span>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <p className="text-2xl font-bold text-green-500" data-testid="text-new-subscribers">
                    +{(subscribers || []).length}
                  </p>
                  <p className="text-sm text-muted-foreground">New subscribers this week</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Earnings Chart */}
          <Card className="bg-card border-border mb-8" data-testid="section-earnings-overview">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Earnings Overview</h3>
              <EarningsChart />
            </CardContent>
          </Card>

          {/* Top Content */}
          <Card className="bg-card border-border" data-testid="section-top-content">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Top Performing Content</h3>
              <div className="space-y-4">
                {topPosts.length > 0 ? (
                  topPosts.map((post: any) => (
                    <div key={post.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg" data-testid={`top-content-${post.id}`}>
                      <div className="flex items-center space-x-4">
                        {post.mediaUrl && (
                          <img 
                            src={post.mediaUrl} 
                            alt={post.title} 
                            className="w-12 h-12 rounded-lg object-cover"
                            data-testid={`img-top-content-${post.id}`}
                          />
                        )}
                        <div>
                          <h4 className="font-medium" data-testid={`text-top-content-title-${post.id}`}>
                            {post.title || 'Untitled Post'}
                          </h4>
                          <p className="text-sm text-muted-foreground" data-testid={`text-top-content-stats-${post.id}`}>
                            {post.views} views • {post.likes} likes
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-green-500" data-testid={`text-top-content-revenue-${post.id}`}>
                          ${post.earnings}
                        </p>
                        <p className="text-xs text-muted-foreground">Revenue</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8" data-testid="empty-top-content">
                    <p className="text-muted-foreground">No content data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
