import { useAuth, Profile, MediaAsset, PayoutAccount } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import StatsCards from "@/components/dashboard/StatsCards";
import ModerationQueue from "@/components/moderation/ModerationQueue";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Plus, TrendingUp, Users, DollarSign } from "lucide-react";

export default function Dashboard() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Redirect to home if not authenticated
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

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/profile"],
    retry: false,
    enabled: isAuthenticated,
  });

  const { data: mediaAssets, isLoading: mediaLoading } = useQuery({
    queryKey: ["/api/media"],
    retry: false,
    enabled: isAuthenticated,
  });

  const { data: payoutAccounts } = useQuery({
    queryKey: ["/api/payments/accounts"],
    retry: false,
    enabled: isAuthenticated && user?.role === "creator",
  });

  if (isLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-df-dungeon flex items-center justify-center">
        <div className="text-xl neon-heading">Loading dashboard...</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null; // Will redirect via useEffect
  }

  const isCreator = user.role === "creator" || user.role === "admin";
  const isAdmin = user.role === "admin";

  return (
    <div className="min-h-screen bg-df-dungeon">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-df-snow mb-2">
            Welcome back, <span className="neon-heading">{profile?.displayName || user.email}</span>
          </h1>
          <p className="text-df-fog">
            {isCreator ? "Manage your content and earnings" : "Discover amazing creators"}
          </p>
        </div>

        {/* Stats Cards */}
        <StatsCards 
          userRole={user.role} 
          mediaAssets={mediaAssets || []}
          payoutAccounts={payoutAccounts || []}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Content Management */}
          {isCreator && (
            <div className="lg:col-span-2">
              <Card className="card-df">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl neon-subheading">
                      Content Management
                    </CardTitle>
                    <Button className="btn-primary" data-testid="button-upload-content">
                      <Plus className="mr-2 h-4 w-4" />
                      Upload Content
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {mediaLoading ? (
                    <div className="text-center py-8">
                      <div className="text-df-fog">Loading content...</div>
                    </div>
                  ) : mediaAssets && mediaAssets.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {mediaAssets.slice(0, 6).map((asset: any) => (
                        <div key={asset.id} className="relative group">
                          <div className="aspect-video bg-df-ink border border-df-steel rounded-md flex items-center justify-center">
                            <span className="text-df-fog text-sm">{asset.mimeType?.split('/')[0] || 'file'}</span>
                          </div>
                          <div className="mt-2">
                            <p className="text-df-snow text-sm font-medium truncate">
                              {asset.title || 'Untitled'}
                            </p>
                            <p className="text-df-fog text-xs">
                              {asset.status === 'approved' ? '✅' : asset.status === 'rejected' ? '❌' : '⏳'} {asset.status}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-df-fog mb-4">No content uploaded yet</div>
                      <Button className="btn-primary" data-testid="button-first-upload">
                        <Plus className="mr-2 h-4 w-4" />
                        Upload Your First Content
                      </Button>
                    </div>
                  )}

                  {/* Content Statistics */}
                  {mediaAssets && mediaAssets.length > 0 && (
                    <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-df-steel">
                      <div className="bg-df-ink p-4 rounded-md border border-df-steel text-center">
                        <p className="text-2xl font-bold text-df-cyan" data-testid="text-total-posts">
                          {mediaAssets.length}
                        </p>
                        <p className="text-df-fog text-sm">Total Posts</p>
                      </div>
                      <div className="bg-df-ink p-4 rounded-md border border-df-steel text-center">
                        <p className="text-2xl font-bold text-df-gold" data-testid="text-premium-posts">
                          {mediaAssets.filter((asset: any) => asset.isPremium).length}
                        </p>
                        <p className="text-df-fog text-sm">Premium</p>
                      </div>
                      <div className="bg-df-ink p-4 rounded-md border border-df-steel text-center">
                        <p className="text-2xl font-bold text-yellow-500" data-testid="text-pending-posts">
                          {mediaAssets.filter((asset: any) => asset.status === 'uploaded').length}
                        </p>
                        <p className="text-df-fog text-sm">Pending</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Profile Overview */}
          <div className={isCreator ? "lg:col-span-1" : "lg:col-span-2"}>
            <Card className="card-df">
              <CardHeader>
                <CardTitle className="text-xl neon-subheading">
                  {isCreator ? "Creator Profile" : "Profile"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center mb-6">
                  <div className="w-20 h-20 bg-df-ink border-4 border-df-cyan rounded-full flex items-center justify-center shadow-glow mb-4">
                    <span className="text-df-cyan text-2xl font-bold">
                      {(profile?.displayName || user.email || 'U')[0].toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-df-snow font-semibold" data-testid="text-display-name">
                    {profile?.displayName || user.email}
                  </h3>
                  <p className="text-df-fog text-sm capitalize">{user.role}</p>
                </div>

                {profile?.bio && (
                  <div className="mb-4">
                    <p className="text-df-fog text-sm" data-testid="text-bio">{profile.bio}</p>
                  </div>
                )}

                {/* Verification Status */}
                <div className="bg-df-ink border border-df-steel rounded-md p-4">
                  <h4 className="text-df-cyan font-semibold mb-3">Verification Status</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-df-fog text-sm">Age Verification</span>
                      <span className="flex items-center text-green-400 text-sm" data-testid="status-age-verification">
                        {profile?.ageVerified ? (
                          <>
                            <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
                            Verified
                          </>
                        ) : (
                          <>
                            <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></span>
                            Pending
                          </>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-df-fog text-sm">KYC Compliance</span>
                      <span className="flex items-center text-green-400 text-sm" data-testid="status-kyc">
                        {profile?.kycStatus === 'verified' ? (
                          <>
                            <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
                            Complete
                          </>
                        ) : (
                          <>
                            <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></span>
                            {profile?.kycStatus || 'Pending'}
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Fan Dashboard */}
          {!isCreator && (
            <div className="lg:col-span-1">
              <Card className="card-df">
                <CardHeader>
                  <CardTitle className="text-xl neon-subheading">
                    Discover Creators
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-df-fog mx-auto mb-4" />
                    <p className="text-df-fog mb-4">Find amazing creators to follow</p>
                    <Button className="btn-primary" data-testid="button-browse-creators">
                      Browse Creators
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Admin Moderation Queue */}
        {isAdmin && <ModerationQueue />}

        {/* System Health Monitoring */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="card-df p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-df-cyan font-semibold text-sm">API Gateway</h4>
              <div className="w-3 h-3 bg-green-400 rounded-full pulse-glow" data-testid="status-api-gateway"></div>
            </div>
            <p className="text-2xl font-bold text-df-snow">99.9%</p>
            <p className="text-df-fog text-xs">Uptime</p>
          </Card>

          <Card className="card-df p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-df-cyan font-semibold text-sm">Database</h4>
              <div className="w-3 h-3 bg-green-400 rounded-full pulse-glow" data-testid="status-database"></div>
            </div>
            <p className="text-2xl font-bold text-df-snow">12ms</p>
            <p className="text-df-fog text-xs">Avg Response</p>
          </Card>

          <Card className="card-df p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-df-cyan font-semibold text-sm">Payments</h4>
              <div className="w-3 h-3 bg-green-400 rounded-full pulse-glow" data-testid="status-payments"></div>
            </div>
            <p className="text-2xl font-bold text-df-snow">98.7%</p>
            <p className="text-df-fog text-xs">Success Rate</p>
          </Card>

          <Card className="card-df p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-df-cyan font-semibold text-sm">Real-time</h4>
              <div className="w-3 h-3 bg-green-400 rounded-full pulse-glow" data-testid="status-websocket"></div>
            </div>
            <p className="text-2xl font-bold text-df-snow">1,247</p>
            <p className="text-df-fog text-xs">Active Users</p>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
