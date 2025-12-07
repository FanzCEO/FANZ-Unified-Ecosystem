import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background overflow-auto">
      {/* Hero Section */}
      <div className="relative">
        {/* Navigation */}
        <nav className="relative z-10 flex items-center justify-between p-6">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <i className="fas fa-bolt text-sm text-primary-foreground"></i>
            </div>
            <span className="text-xl font-bold neon-text">FANZ Forge</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button className="px-6 py-2 neon-border rounded-md hover:shadow-lg transition-all" data-testid="button-nav-login">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" className="px-6 py-2 border-primary/30 text-primary hover:bg-primary/10" data-testid="button-nav-register">
                Sign Up
              </Button>
            </Link>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
          <div className="text-center">
            <Badge className="mb-6 px-4 py-2 bg-primary/20 text-primary border-primary/30">
              <i className="fas fa-robot mr-2"></i>
              AI-Powered Creator Platform
            </Badge>
            <h1 className="text-6xl font-bold mb-6">
              Build Creator Apps with{" "}
              <span className="neon-text">AI Magic</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              FANZ Forge is the first no-code platform designed specifically for creator economy apps. 
              Build paywalls, DM systems, and content platforms with built-in compliance and AI assistance.
            </p>
            <div className="flex items-center justify-center space-x-4">
              <Link href="/register">
                <Button 
                  size="lg" 
                  className="px-8 py-4 bg-primary text-primary-foreground hover:shadow-lg animate-neon-pulse"
                  data-testid="button-start-building"
                >
                  <i className="fas fa-rocket mr-2"></i>
                  Start Building
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline" 
                className="px-8 py-4 border-secondary text-secondary hover:bg-secondary/10"
                data-testid="button-watch-demo"
              >
                <i className="fas fa-play mr-2"></i>
                Watch Demo
              </Button>
            </div>
          </div>
        </div>

        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-accent/10 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything You Need to Build Creator Apps</h2>
            <p className="text-xl text-muted-foreground">From AI-powered development to one-click deployment</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="neon-border hover:shadow-lg transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-robot text-xl text-primary"></i>
                </div>
                <CardTitle>AI-Powered Development</CardTitle>
                <CardDescription>
                  Generate complete apps from natural language prompts using GPT-4o and Claude Sonnet
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="neon-border hover:shadow-lg transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-palette text-xl text-secondary"></i>
                </div>
                <CardTitle>Visual Composer</CardTitle>
                <CardDescription>
                  Drag-and-drop interface with pre-built blocks for paywalls, chat, and content management
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="neon-border hover:shadow-lg transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-shield-alt text-xl text-accent"></i>
                </div>
                <CardTitle>Built-in Compliance</CardTitle>
                <CardDescription>
                  2257 compliance, age verification, and safety features built into every template
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="neon-border hover:shadow-lg transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-credit-card text-xl text-primary"></i>
                </div>
                <CardTitle>Payment Integration</CardTitle>
                <CardDescription>
                  CCBill, NMI, and Stripe integration with creator-specific monetization features
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="neon-border hover:shadow-lg transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-users text-xl text-secondary"></i>
                </div>
                <CardTitle>Real-time Collaboration</CardTitle>
                <CardDescription>
                  Multiplayer coding with live cursors, chat, and team workspaces
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="neon-border hover:shadow-lg transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-rocket text-xl text-accent"></i>
                </div>
                <CardTitle>One-Click Deploy</CardTitle>
                <CardDescription>
                  Deploy to production with HTTPS, CDN, database, and monitoring in one click
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 px-6 bg-card">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Build the Future of Creator Apps?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of creators building their digital empires with FANZ Forge
          </p>
          <Button 
            size="lg" 
            onClick={() => window.location.href = "/api/login"}
            className="px-12 py-4 bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:shadow-xl transition-all"
          >
            <i className="fas fa-bolt mr-2"></i>
            Get Started Free
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                <i className="fas fa-bolt text-xs text-primary-foreground"></i>
              </div>
              <span className="font-bold neon-text">FANZ Forge</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2025 FANZ Forge. Built for creators, by creators.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
