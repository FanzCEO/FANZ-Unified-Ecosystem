import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, Users, DollarSign, Shield, Star, TrendingUp } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-dark text-white">
      {/* Navigation */}
      <nav className="bg-slate border-b border-gray-700">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                FanzLab
              </h1>
              <span className="text-xs bg-accent text-black px-2 py-1 rounded-full font-semibold">
                BETA
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/api/login'}
                data-testid="button-login"
              >
                Login
              </Button>
              <Button 
                onClick={() => window.location.href = '/api/login'}
                className="bg-gradient-to-r from-primary to-secondary hover:from-purple-600 hover:to-pink-600"
                data-testid="button-signup"
              >
                Join Now
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary/20 to-secondary/20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            The Future of
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent block">
              Creator Economy
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join the most advanced adult content platform. Connect with fanz, monetize your content, 
            and build your empire with cutting-edge tools and features.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => window.location.href = '/api/login'}
              className="bg-gradient-to-r from-primary to-secondary hover:from-purple-600 hover:to-pink-600 text-lg px-8"
              data-testid="button-creator-signup"
            >
              <Crown className="w-5 h-5 mr-2" />
              Join as Creator
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => window.location.href = '/api/login'}
              className="text-lg px-8"
              data-testid="button-fanz-signup"
            >
              <Users className="w-5 h-5 mr-2" />
              Join as Fanz
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">
            Why Choose <span className="text-primary">FanzLab</span>?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <DollarSign className="w-12 h-12 text-success mb-4" />
                <CardTitle>Maximum Earnings</CardTitle>
                <CardDescription>
                  Keep 85% of your earnings with our industry-leading payout rates
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <Shield className="w-12 h-12 text-primary mb-4" />
                <CardTitle>Complete Privacy</CardTitle>
                <CardDescription>
                  Advanced security features and privacy controls to protect your content
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <TrendingUp className="w-12 h-12 text-accent mb-4" />
                <CardTitle>Growth Tools</CardTitle>
                <CardDescription>
                  AI-powered analytics and marketing tools to grow your audience
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Creator Benefits */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">
                Built for <span className="text-secondary">Creators</span>
              </h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <Star className="w-6 h-6 text-accent mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-2">Multiple Revenue Streams</h3>
                    <p className="text-gray-400">
                      Subscriptions, pay-per-view content, tips, live streaming, and more
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <Crown className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-2">VIP Member Program</h3>
                    <p className="text-gray-400">
                      Exclusive features and higher earnings for top performers
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <TrendingUp className="w-6 h-6 text-success mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-2">Real-time Analytics</h3>
                    <p className="text-gray-400">
                      Track your performance and optimize your content strategy
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl p-8">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-4">Start Earning Today</h3>
                <p className="text-gray-300 mb-6">
                  Join thousands of creators who are already building their empire
                </p>
                <Button 
                  size="lg" 
                  onClick={() => window.location.href = '/api/login'}
                  className="bg-gradient-to-r from-primary to-secondary hover:from-purple-600 hover:to-pink-600"
                  data-testid="button-start-earning"
                >
                  Start Creating
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate border-t border-gray-700 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
              FanzLab
            </h3>
            <p className="text-gray-400 mb-6">
              The premier platform for adult content creators and their fanz
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <a href="#" className="text-gray-400 hover:text-white transition-colors" data-testid="link-terms">
                Terms of Service
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors" data-testid="link-privacy">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors" data-testid="link-help">
                Help Center
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors" data-testid="link-contact">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
