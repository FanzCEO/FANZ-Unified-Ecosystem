import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Crown, Zap, Star } from "lucide-react";

export default function Landing() {
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
            <div className="flex gap-3">
              <Button 
                onClick={() => window.location.href = '/auth'}
                variant="outline"
                className="neon-button border-secondary text-secondary hover:bg-secondary/10"
                data-testid="button-sign-in"
              >
                <Users className="w-4 h-4 mr-2" />
                Sign In
              </Button>
              <Button 
                onClick={() => window.location.href = '/auth'}
                className="gradient-bg hover:opacity-90 transition-all duration-300 neon-glow"
                data-testid="button-get-started"
              >
                <Crown className="w-4 h-4 mr-2" />
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center relative">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl lg:text-6xl font-bold mb-6 text-glow-animated" data-testid="text-hero-title">
            Monetize Your Content,
            <span className="text-primary neon-text"> Connect With Fans</span>
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto" data-testid="text-hero-description">
            Join thousands of creators earning 100% of their revenue through subscriptions, tips, and exclusive content. 
            Build your community on the most advanced creator platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
            <Button 
              size="lg"
              onClick={() => window.location.href = '/auth'}
              className="gradient-bg hover:opacity-90 transition-all duration-300 text-lg px-8 py-4 neon-glow glitch-effect"
              data-testid="button-creator-start"
            >
              <Crown className="w-5 h-5 mr-2" />
              Start Creating
            </Button>
            <Button 
              size="lg"
              onClick={() => window.location.href = '/auth'}
              className="neon-button text-lg px-8 py-4 border-2 border-secondary text-secondary hover:bg-secondary/10"
              data-testid="button-fan-start"
            >
              <Users className="w-5 h-5 mr-2" />
              Join as Fan
            </Button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
            <div className="neon-card p-6 rounded-lg float-animation">
              <div className="text-3xl font-bold text-primary mb-2">100%</div>
              <div className="text-sm text-gray-400">Creator Revenue</div>
            </div>
            <div className="neon-card p-6 rounded-lg float-animation" style={{animationDelay: '0.5s'}}>
              <div className="text-3xl font-bold text-secondary mb-2">24/7</div>
              <div className="text-sm text-gray-400">Live Support</div>
            </div>
            <div className="neon-card p-6 rounded-lg float-animation" style={{animationDelay: '1s'}}>
              <div className="text-3xl font-bold text-accent mb-2">50K+</div>
              <div className="text-sm text-gray-400">Active Creators</div>
            </div>
            <div className="neon-card p-6 rounded-lg float-animation" style={{animationDelay: '1.5s'}}>
              <div className="text-3xl font-bold text-primary mb-2">$5M+</div>
              <div className="text-sm text-gray-400">Paid to Creators</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold mb-4" data-testid="text-features-title">
            Everything You Need to Succeed
          </h3>
          <p className="text-muted-foreground text-lg" data-testid="text-features-description">
            Powerful tools to grow your audience and maximize your earnings
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="bg-card border-border" data-testid="card-feature-subscriptions">
            <CardContent className="p-6">
              <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-2">Fan Subscriptions</h4>
              <p className="text-muted-foreground">
                Set monthly subscription prices and build a recurring revenue stream with exclusive content for your subscribers.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border" data-testid="card-feature-content">
            <CardContent className="p-6">
              <div className="bg-secondary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-2">Content Monetization</h4>
              <p className="text-muted-foreground">
                Create pay-per-view content, offer tips, and sell exclusive media directly to your most engaged fans.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border" data-testid="card-feature-messaging">
            <CardContent className="p-6">
              <div className="bg-accent/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-2">Direct Messaging</h4>
              <p className="text-muted-foreground">
                Connect personally with your fans through private messages and build stronger relationships.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div data-testid="stat-creators">
              <div className="text-4xl font-bold text-primary mb-2">10,000+</div>
              <div className="text-muted-foreground">Active Creators</div>
            </div>
            <div data-testid="stat-earnings">
              <div className="text-4xl font-bold text-secondary mb-2">$2.5M+</div>
              <div className="text-muted-foreground">Creator Earnings</div>
            </div>
            <div data-testid="stat-retention">
              <div className="text-4xl font-bold text-accent mb-2">100%</div>
              <div className="text-muted-foreground">Creator Revenue</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground" data-testid="text-footer">
            © 2025 FANZClub. Empowering creators worldwide.
          </p>
        </div>
      </footer>
    </div>
  );
}
