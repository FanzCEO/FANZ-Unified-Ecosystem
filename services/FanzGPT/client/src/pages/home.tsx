import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Navbar } from "@/components/navbar";

export default function Home() {
  const { user } = useAuth();

  const { data: credits, isLoading: creditsLoading } = useQuery({
    queryKey: ["/api/user/credits"],
  }) as { data: { credits: number; totalCreditsUsed: number } | undefined, isLoading: boolean };

  const { data: recentHistory, isLoading: historyLoading } = useQuery({
    queryKey: ["/api/content-history"],
  }) as { data: any[] | undefined, isLoading: boolean };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-3xl sm:text-4xl font-black gradient-text mb-2" data-testid="welcome-title">
            Welcome back, {(user as any)?.firstName || 'Creator'}!
          </h1>
          <p className="text-muted-foreground text-base md:text-lg">
            Ready to generate some amazing adult content?
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <Card className="bg-card border-border" data-testid="credits-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Available Credits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-white">
                {creditsLoading ? "..." : credits?.credits || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {credits?.totalCreditsUsed || 0} credits used total
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border" data-testid="generations-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Content Generated</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-white">
                {historyLoading ? "..." : recentHistory?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Recent generations
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border" data-testid="status-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Account Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-accent">
                Active
              </div>
              <p className="text-xs text-muted-foreground">
                All systems operational
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
          <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20 hover-glow" data-testid="generate-card">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center mr-4">
                  <i className="fas fa-magic text-white text-xl"></i>
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-white">Generate Content</h3>
                  <p className="text-muted-foreground text-sm md:text-base">Create new titles, descriptions, and scripts</p>
                </div>
              </div>
              <Link href="/generator">
                <Button className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground" data-testid="button-start-generating">
                  Start Generating
                  <i className="fas fa-arrow-right ml-2"></i>
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-accent/10 to-secondary/10 border-accent/20 hover-glow" data-testid="history-card">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-accent to-secondary rounded-xl flex items-center justify-center mr-4">
                  <i className="fas fa-history text-background text-xl"></i>
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-white">Content History</h3>
                  <p className="text-muted-foreground text-sm md:text-base">View and manage your generated content</p>
                </div>
              </div>
              <Link href="/history">
                <Button variant="outline" className="w-full border-accent text-accent hover:bg-accent hover:text-background" data-testid="button-view-history">
                  View History
                  <i className="fas fa-external-link-alt ml-2"></i>
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent Content */}
        <Card className="bg-card border-border" data-testid="recent-content-card">
          <CardHeader>
            <CardTitle className="text-white">Recent Generations</CardTitle>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : recentHistory && recentHistory.length > 0 ? (
              <div className="space-y-4">
                {recentHistory.slice(0, 5).map((item: any) => (
                  <div key={item.id} className="border-l-4 border-primary pl-4" data-testid={`recent-item-${item.id}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-white capitalize">{item.type} Generation</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">{item.prompt}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                        {item.creditsUsed} credit{item.creditsUsed !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8" data-testid="no-content-state">
                <i className="fas fa-file-alt text-4xl text-muted-foreground mb-4"></i>
                <p className="text-muted-foreground">No content generated yet</p>
                <Link href="/generator">
                  <Button className="mt-4 bg-gradient-to-r from-primary to-secondary text-primary-foreground" data-testid="button-generate-first">
                    Generate Your First Content
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
