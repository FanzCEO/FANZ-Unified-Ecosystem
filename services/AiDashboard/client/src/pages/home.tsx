import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import ToolCard from "@/components/tool-card";
import { 
  PenTool, 
  Calendar, 
  Users, 
  Mail, 
  Image, 
  Phone, 
  Rocket, 
  Play,
  Search,
  Sparkles,
  TrendingUp,
  Zap,
  Briefcase,
  Palette,
  Bot
} from "lucide-react";

export default function Home() {
  const featuredTools = [
    {
      title: "AI Text Generator",
      description: "Generate high-quality content instantly with 120+ templates. Blog posts, ads, emails, and more.",
      icon: <PenTool className="text-white" size={20} />,
      badge: "✨ Most Popular",
      badgeColor: "bg-gradient-to-r from-purple-500 to-pink-500",
      href: "/tools/content-generator",
      gradient: "gradient-creator"
    },
    {
      title: "AI Chat Assistant",
      description: "Humanlike conversations with unlimited chatbot personas. Custom training and fine-tuning available.",
      icon: <Bot className="text-white" size={20} />,
      badge: "🤖 AI Powered",
      badgeColor: "bg-gradient-to-r from-blue-500 to-cyan-500",
      href: "/tools/ai-chat",
      gradient: "bg-gradient-to-r from-blue-500 to-cyan-500"
    },
    {
      title: "AI Image Generator",
      description: "Create stunning visuals with DALL-E and Stable Diffusion. Text to image, sketch to image, and more.",
      icon: <Image className="text-white" size={20} />,
      badge: "🎨 Creative",
      badgeColor: "bg-gradient-to-r from-purple-500 to-indigo-500",
      href: "/tools/image-generator",
      gradient: "bg-gradient-to-r from-purple-500 to-pink-500"
    },
    {
      title: "AI Code Generator",
      description: "Code like a pro in any language. Debug, fix, and develop applications with AI assistance.",
      icon: <Briefcase className="text-white" size={20} />,
      badge: "⚡ Developer",
      badgeColor: "bg-gradient-to-r from-green-500 to-blue-500",
      href: "/tools/code-generator",
      gradient: "bg-gradient-to-r from-green-500 to-emerald-500"
    },
    {
      title: "AI Video Generator",
      description: "Transform static images into engaging videos with seamless transitions and professional editing.",
      icon: <Play className="text-white" size={20} />,
      badge: "🎬 Video",
      badgeColor: "bg-gradient-to-r from-red-500 to-orange-500",
      href: "/tools/video-generator",
      gradient: "bg-gradient-to-r from-red-500 to-pink-500"
    },
    {
      title: "AI Voiceover",
      description: "Generate speech in 20+ languages. Voice cloning and advanced speech options with ElevenLabs.",
      icon: <Phone className="text-white" size={20} />,
      badge: "🎙️ Voice",
      badgeColor: "bg-gradient-to-r from-orange-500 to-yellow-500",
      href: "/tools/voiceover",
      gradient: "bg-gradient-to-r from-orange-500 to-yellow-500"
    }
  ];

  const stats = [
    { value: "120+", label: "AI Templates" },
    { value: "15+", label: "AI Models" },
    { value: "30+", label: "Languages" },
    { value: "24/7", label: "AI Assistant" }
  ];

  const categories = ["All Tools", "Marketing", "Content", "Social Media", "Automation"];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 py-20">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-100/30 via-pink-100/30 to-orange-100/30"></div>
        
        {/* Animated floating elements */}
        <div className="absolute top-10 left-10 w-72 h-72 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl float-animation"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-gradient-to-r from-orange-400/20 to-yellow-400/20 rounded-full blur-3xl float-delayed"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-cyan-400/15 to-blue-400/15 rounded-full blur-3xl rotate-slow"></div>
        
        {/* Interactive geometric shapes */}
        <div className="absolute top-20 right-20 w-20 h-20 border-2 border-purple-300/30 rotate-45 bounce-subtle"></div>
        <div className="absolute bottom-32 left-20 w-16 h-16 rounded-full border-2 border-pink-300/40 pulse-glow"></div>
        <div className="absolute top-1/3 right-1/4 w-12 h-12 bg-gradient-to-br from-orange-400/20 to-pink-400/20 transform rotate-45 float-animation" style={{animationDelay: '1s'}}></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="mb-4">
              <span className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4 animate-slide-up">
                ⚡ Ultimate AI Generator
              </span>
            </div>
            <h1 className="text-6xl md:text-7xl font-bold font-poppins text-main mb-6 leading-tight animate-slide-up">
              No-code{" "}
              <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent text-glow gradient-shift">
                AI Builder
              </span>
              <span className="text-4xl md:text-5xl block mt-2">⚡</span>
            </h1>
            <p className="text-2xl text-gray-600 mb-8 leading-relaxed max-w-4xl mx-auto animate-slide-up font-medium" style={{animationDelay: '0.3s'}}>
              All-in-one SaaS platform to generate AI content and start making money in minutes.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 animate-slide-up" style={{animationDelay: '0.6s'}}>
              <Link href="/dashboard">
                <Button 
                  size="lg" 
                  className="px-8 py-4 gradient-creator text-white hover:scale-110 hover:rotate-1 transition-all duration-300 font-semibold text-lg creative-shadow rounded-2xl group"
                  data-testid="button-start-creating"
                >
                  <Rocket className="mr-2 group-hover:rotate-12 transition-transform duration-300" size={20} />
                  Get Started Free
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button 
                  variant="outline" 
                  size="lg"
                  className="px-8 py-4 border-2 creative-border text-purple-600 hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-500 hover:text-white hover:scale-105 hover:-rotate-1 transition-all duration-300 font-semibold text-lg rounded-2xl group"
                  data-testid="button-watch-demo"
                >
                  <Play className="mr-2 group-hover:scale-125 transition-transform duration-300" size={20} />
                  View Dashboard
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center group cursor-pointer" data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
                  <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent mb-1 group-hover:scale-110 transition-transform duration-300 text-glow">{stat.value}</div>
                  <div className="text-sm text-gray-600 group-hover:text-purple-600 transition-colors duration-300">{stat.label}</div>
                  <div className="w-8 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tool Categories */}
      <section id="tools" className="py-16 bg-white relative overflow-hidden">
        {/* Floating decorative elements */}
        <div className="absolute top-10 right-10 w-32 h-32 bg-gradient-to-r from-purple-200/20 to-pink-200/20 rounded-full blur-2xl float-animation"></div>
        <div className="absolute bottom-20 left-20 w-40 h-40 bg-gradient-to-r from-orange-200/20 to-yellow-200/20 rounded-full blur-2xl float-delayed"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold font-poppins text-main mb-4 animate-slide-up">Powered by AI.</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto animate-slide-up" style={{animationDelay: '0.3s'}}>
              Advanced AI models including OpenAI GPT-4, DALL-E, Stable Diffusion, and more integrated into one platform.
            </p>
          </div>

          {/* Search and Filter Bar */}
          <div className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-purple-500 transition-colors duration-300" size={20} />
              <Input 
                type="text" 
                placeholder="Search tools..." 
                className="pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent hover:border-purple-300 transition-all duration-300 glow-on-hover"
                data-testid="input-search-tools"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              {categories.map((category, index) => (
                <Button
                  key={category}
                  variant={index === 0 ? "default" : "outline"}
                  className={index === 0 ? "gradient-creator text-white rounded-2xl hover:scale-105 transition-all duration-300" : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105 hover:text-purple-600 transition-all duration-300 rounded-2xl"}
                  data-testid={`button-filter-${category.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Tools */}
      <section className="py-16 bg-gradient-to-br from-purple-50/50 via-pink-50/50 to-orange-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredTools.map((tool, index) => (
              <div 
                key={index} 
                className="transform hover:scale-105 hover:-rotate-1 transition-all duration-300 card-3d animate-slide-up" 
                style={{animationDelay: `${index * 0.1}s`}}
              >
                <ToolCard {...tool} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 bg-white relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-r from-purple-100/30 to-pink-100/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 float-animation"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-r from-orange-100/30 to-yellow-100/30 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 float-delayed"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold font-poppins text-main mb-4 animate-slide-up">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto animate-slide-up" style={{animationDelay: '0.2s'}}>
              Choose the perfect plan for your freelance business. Scale your client services with AI-powered automation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter Plan */}
            <Card className="bg-gradient-to-br from-white to-purple-50/30 border border-purple-100 hover:border-purple-300 hover:scale-105 hover:-rotate-1 transition-all duration-300 p-8 rounded-3xl creative-shadow card-3d animate-slide-up" style={{animationDelay: '0.4s'}}>
              <CardContent className="p-0">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-main mb-2">Starter</h3>
                  <div className="text-3xl font-bold text-main mb-1">
                    $29<span className="text-lg font-normal text-gray-500">/month</span>
                  </div>
                  <p className="text-gray-600">Perfect for solo freelancers</p>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center">
                    <Sparkles className="text-accent mr-3" size={16} />
                    <span>10 AI tools access</span>
                  </li>
                  <li className="flex items-center">
                    <Sparkles className="text-accent mr-3" size={16} />
                    <span>1,000 monthly generations</span>
                  </li>
                  <li className="flex items-center">
                    <Sparkles className="text-accent mr-3" size={16} />
                    <span>Basic automation</span>
                  </li>
                  <li className="flex items-center">
                    <Sparkles className="text-accent mr-3" size={16} />
                    <span>Email support</span>
                  </li>
                </ul>
                <Button 
                  variant="outline" 
                  className="w-full border-2 creative-border text-purple-600 hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-500 hover:text-white rounded-2xl"
                  data-testid="button-starter-plan"
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>

            {/* Professional Plan */}
            <Card className="bg-white border-2 border-purple-400 creative-shadow relative p-8 rounded-3xl hover:scale-105 hover:rotate-1 transition-all duration-300 card-3d animate-slide-up" style={{animationDelay: '0.6s'}}>
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="gradient-creator text-white px-4 py-1 rounded-full text-sm font-medium">Most Popular</span>
              </div>
              <CardContent className="p-0">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-main mb-2">Professional</h3>
                  <div className="text-3xl font-bold text-main mb-1">
                    $79<span className="text-lg font-normal text-gray-500">/month</span>
                  </div>
                  <p className="text-gray-600">For growing freelance teams</p>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center">
                    <Sparkles className="text-accent mr-3" size={16} />
                    <span>All AI tools access</span>
                  </li>
                  <li className="flex items-center">
                    <Sparkles className="text-accent mr-3" size={16} />
                    <span>10,000 monthly generations</span>
                  </li>
                  <li className="flex items-center">
                    <Sparkles className="text-accent mr-3" size={16} />
                    <span>Advanced automation</span>
                  </li>
                  <li className="flex items-center">
                    <Sparkles className="text-accent mr-3" size={16} />
                    <span>Lead sourcing (500/month)</span>
                  </li>
                  <li className="flex items-center">
                    <Sparkles className="text-accent mr-3" size={16} />
                    <span>Priority support</span>
                  </li>
                </ul>
                <Button 
                  className="w-full gradient-creator text-white hover:scale-105 transition-transform rounded-2xl"
                  data-testid="button-professional-plan"
                >
                  Start Free Trial
                </Button>
              </CardContent>
            </Card>

            {/* Enterprise Plan */}
            <Card className="bg-gradient-to-br from-white to-orange-50/30 border border-orange-100 hover:border-orange-300 hover:scale-105 hover:-rotate-1 transition-all duration-300 p-8 rounded-3xl creative-shadow card-3d animate-slide-up" style={{animationDelay: '0.8s'}}>
              <CardContent className="p-0">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-main mb-2">Enterprise</h3>
                  <div className="text-3xl font-bold text-main mb-1">
                    $199<span className="text-lg font-normal text-gray-500">/month</span>
                  </div>
                  <p className="text-gray-600">For freelance agencies</p>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center">
                    <Sparkles className="text-accent mr-3" size={16} />
                    <span>All features included</span>
                  </li>
                  <li className="flex items-center">
                    <Sparkles className="text-accent mr-3" size={16} />
                    <span>Unlimited generations</span>
                  </li>
                  <li className="flex items-center">
                    <Sparkles className="text-accent mr-3" size={16} />
                    <span>Custom automations</span>
                  </li>
                  <li className="flex items-center">
                    <Sparkles className="text-accent mr-3" size={16} />
                    <span>Unlimited lead sourcing</span>
                  </li>
                  <li className="flex items-center">
                    <Sparkles className="text-accent mr-3" size={16} />
                    <span>Dedicated support</span>
                  </li>
                </ul>
                <Button 
                  variant="outline" 
                  className="w-full border-2 creative-border text-purple-600 hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-500 hover:text-white rounded-2xl"
                  data-testid="button-enterprise-plan"
                >
                  Contact Sales
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">All plans include a 14-day free trial. No credit card required.</p>
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center">
                <Sparkles className="text-accent mr-2" size={16} />
                <span>SSL Secured</span>
              </div>
              <div className="flex items-center">
                <Sparkles className="text-accent mr-2" size={16} />
                <span>Cancel Anytime</span>
              </div>
              <div className="flex items-center">
                <Sparkles className="text-accent mr-2" size={16} />
                <span>24/7 Support</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
