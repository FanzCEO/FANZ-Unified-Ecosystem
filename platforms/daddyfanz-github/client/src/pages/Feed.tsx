import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FanzInfinityScrollFeed from "@/components/feed/FanzInfinityScrollFeed";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Users, Sparkles } from "lucide-react";

export default function Feed() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-df-dungeon">
      <Header />
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold neon-heading mb-2">
            Discover Feed
          </h1>
          <p className="text-df-fog">
            {isAuthenticated 
              ? "Personalized content from creators you follow" 
              : "Explore free content from amazing creators"}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Feed */}
          <div className="lg:col-span-2">
            <FanzInfinityScrollFeed adInterval={5} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trending Card */}
            <Card className="card-df" data-testid="card-trending">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-df-snow mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-df-cyan" />
                  Trending Now
                </h3>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-2 hover:bg-df-ink rounded transition-colors cursor-pointer">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-df-cyan to-df-gold flex items-center justify-center text-df-snow font-bold">
                        #{i}
                      </div>
                      <div className="flex-1">
                        <p className="text-df-snow font-medium text-sm">Creator Name</p>
                        <p className="text-df-fog text-xs">1.2K followers</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Suggested Creators Card */}
            <Card className="card-df" data-testid="card-suggested">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-df-snow mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-df-cyan" />
                  Suggested Creators
                </h3>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-df-ink border-2 border-df-steel" />
                        <div>
                          <p className="text-df-snow font-medium text-sm">Creator {i}</p>
                          <p className="text-df-fog text-xs">500 posts</p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        className="btn-primary text-xs"
                        data-testid={`button-follow-suggested-${i}`}
                      >
                        Follow
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Premium CTA */}
            {!isAuthenticated && (
              <Card className="card-df border-df-gold" data-testid="card-premium-cta">
                <CardContent className="p-6 text-center">
                  <Sparkles className="h-12 w-12 text-df-gold mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-df-snow mb-2">
                    Unlock Premium Content
                  </h3>
                  <p className="text-df-fog text-sm mb-4">
                    Sign up to access exclusive content from your favorite creators
                  </p>
                  <Button 
                    className="btn-primary w-full"
                    onClick={() => window.location.href = "/api/login"}
                    data-testid="button-signup-cta"
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
