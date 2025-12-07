import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { 
  DollarSign, 
  Users, 
  Camera, 
  MessageCircle, 
  Shield, 
  TrendingUp,
  CheckCircle,
  Star,
  Crown
} from "lucide-react";

export default function CreatorGuide() {
  const { user } = useAuth();

  const steps = [
    {
      icon: Shield,
      title: "Complete Verification",
      description: "Verify your identity and age to ensure platform compliance",
      link: "/verification",
      status: "pending"
    },
    {
      icon: Camera,
      title: "Create Your First Post",
      description: "Share premium content with your subscribers",
      link: "/",
      status: "ready"
    },
    {
      icon: Users,
      title: "Build Your Following",
      description: "Engage with fans and grow your subscriber base",
      link: "/profile",
      status: "ready"
    },
    {
      icon: DollarSign,
      title: "Start Earning",
      description: "Set up subscriptions and premium content pricing",
      link: "/settings",
      status: "ready"
    }
  ];

  const features = [
    {
      icon: Crown,
      title: "Premium Subscriptions",
      description: "Monthly recurring revenue from dedicated fans"
    },
    {
      icon: MessageCircle,
      title: "Direct Messaging",
      description: "Personal connection with your subscribers"
    },
    {
      icon: TrendingUp,
      title: "Analytics Dashboard", 
      description: "Track your performance and earnings"
    },
    {
      icon: Star,
      title: "Content Protection",
      description: "Advanced DRM and watermarking technology"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Creator Guide</h1>
                <p className="text-slate-300">Welcome to DaddyFanz - Start your creator journey</p>
              </div>
            </div>
            <Link href="/" data-testid="link-back-home">
              <Button variant="outline" className="border-cyan-400/30 text-cyan-300 hover:bg-cyan-400/10">
                Back to Feed
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Welcome Section */}
        <Card className="border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl text-white flex items-center justify-center gap-3">
              <Crown className="h-8 w-8 text-yellow-400" />
              Welcome, {user?.firstName || 'Creator'}!
            </CardTitle>
            <CardDescription className="text-lg text-slate-300">
              Ready to monetize your content and build a loyal fanbase? Follow these steps to get started.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Getting Started Steps */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-cyan-400" />
            Getting Started
          </h2>
          
          <div className="grid gap-4 md:grid-cols-2">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              return (
                <Card key={index} className="border-slate-700/50 bg-slate-800/50 backdrop-blur-sm hover:bg-slate-800/70 transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center">
                          <IconComponent className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-white text-lg">{step.title}</CardTitle>
                          <Badge variant={step.status === 'ready' ? 'default' : 'secondary'} className="mt-1">
                            {step.status === 'ready' ? 'Ready' : 'Pending'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-300 mb-4">{step.description}</p>
                    <Link href={step.link}>
                      <Button 
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                        data-testid={`button-${step.title.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {step.status === 'ready' ? 'Get Started' : 'Complete Setup'}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Platform Features */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Star className="h-6 w-6 text-yellow-400" />
            Platform Features
          </h2>
          
          <div className="grid gap-6 md:grid-cols-2">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card key={index} className="border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 rounded-lg bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center">
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-white">{feature.title}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-300">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <Card className="border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white text-xl">Ready to Start Creating?</CardTitle>
            <CardDescription className="text-slate-300">
              Jump straight into creating content and building your fanbase.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4">
            <Link href="/" className="flex-1">
              <Button 
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                data-testid="button-create-first-post"
              >
                <Camera className="h-4 w-4 mr-2" />
                Create Your First Post
              </Button>
            </Link>
            <Link href="/settings" className="flex-1">
              <Button 
                variant="outline" 
                className="w-full border-cyan-400/30 text-cyan-300 hover:bg-cyan-400/10"
                data-testid="button-setup-monetization"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Setup Monetization
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}