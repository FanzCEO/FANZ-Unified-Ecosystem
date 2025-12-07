import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LayoutDashboard, 
  PenTool, 
  Bot, 
  Image, 
  Code, 
  Play,
  Phone,
  FileText,
  Mic,
  Settings,
  BarChart3,
  Users,
  CreditCard,
  Star,
  Zap,
  Sparkles,
  Menu,
  X,
  Crown,
  Calendar,
  MessageSquare,
  TrendingUp,
  Palette
} from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sidebarItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", active: true },
    { icon: PenTool, label: "AI Writer", href: "/tools/content-generator" },
    { icon: Bot, label: "AI Chat", href: "/tools/ai-chat" },
    { icon: Image, label: "AI Image", href: "/tools/image-generator" },
    { icon: Code, label: "AI Code", href: "/tools/code-generator" },
    { icon: Play, label: "AI Video", href: "/tools/video-generator" },
    { icon: Phone, label: "AI Voiceover", href: "/tools/voiceover" },
    { icon: Mic, label: "Speech to Text", href: "/tools/speech-to-text" },
    { icon: FileText, label: "AI Editor", href: "/tools/ai-editor" },
    { icon: Palette, label: "Templates", href: "/tools/templates" },
    { icon: BarChart3, label: "Analytics", href: "/analytics" },
    { icon: Users, label: "Team", href: "/team" },
    { icon: CreditCard, label: "Billing", href: "/billing" },
    { icon: Settings, label: "Settings", href: "/settings" }
  ];

  const aiTools = [
    {
      title: "AI Text Generator",
      description: "Create content with 120+ templates",
      icon: <PenTool className="text-white" size={24} />,
      gradient: "from-purple-500 to-pink-500",
      href: "/tools/content-generator",
      stats: "1.2k generated"
    },
    {
      title: "AI Chat Assistant", 
      description: "Intelligent conversations and support",
      icon: <Bot className="text-white" size={24} />,
      gradient: "from-blue-500 to-cyan-500",
      href: "/tools/ai-chat",
      stats: "847 chats"
    },
    {
      title: "AI Image Studio",
      description: "Generate stunning visuals instantly",
      icon: <Image className="text-white" size={24} />,
      gradient: "from-pink-500 to-orange-500",
      href: "/tools/image-generator", 
      stats: "324 images"
    },
    {
      title: "AI Code Generator",
      description: "Code in any programming language",
      icon: <Code className="text-white" size={24} />,
      gradient: "from-green-500 to-emerald-500",
      href: "/tools/code-generator",
      stats: "156 snippets"
    },
    {
      title: "AI Video Creator",
      description: "Transform images into engaging videos",
      icon: <Play className="text-white" size={24} />,
      gradient: "from-red-500 to-pink-500",
      href: "/tools/video-generator",
      stats: "89 videos"
    },
    {
      title: "AI Voiceover",
      description: "Natural speech in 30+ languages",
      icon: <Phone className="text-white" size={24} />,
      gradient: "from-orange-500 to-yellow-500",
      href: "/tools/voiceover",
      stats: "267 voices"
    }
  ];

  const recentActivity = [
    { action: "Generated blog post", tool: "AI Writer", time: "2 minutes ago" },
    { action: "Created product image", tool: "AI Image", time: "5 minutes ago" },
    { action: "Generated code snippet", tool: "AI Code", time: "12 minutes ago" },
    { action: "Chat conversation", tool: "AI Chat", time: "18 minutes ago" }
  ];

  const quickStats = [
    { label: "Words Generated", value: "24,847", change: "+12%", icon: PenTool },
    { label: "Images Created", value: "1,234", change: "+8%", icon: Image },
    { label: "Chat Messages", value: "5,678", change: "+15%", icon: MessageSquare },
    { label: "API Calls", value: "89,234", change: "+23%", icon: Zap }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center">
              <Sparkles className="text-white" size={20} />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">MagicAI</span>
          </div>
          
          <nav className="space-y-2">
            {sidebarItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <Link key={index} href={item.href}>
                  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${
                    item.active 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}>
                    <Icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="absolute bottom-6 left-6 right-6">
          <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Crown size={20} />
                <span className="font-semibold">Upgrade to Pro</span>
              </div>
              <p className="text-sm opacity-90 mb-3">Unlock unlimited AI generations</p>
              <Button className="w-full bg-white text-purple-600 hover:bg-gray-100">
                Upgrade Now
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600">Welcome back! Here's what's happening with your AI workspace.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 px-4 py-2 rounded-full">
                <span className="text-sm font-medium text-purple-700">✨ 1,250 credits remaining</span>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">JD</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {quickStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                        <p className="text-sm text-green-600 font-medium">{stat.change} this month</p>
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                        <Icon className="text-white" size={24} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* AI Tools Grid */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">AI Tools</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {aiTools.map((tool, index) => (
                <Link key={index} href={tool.href}>
                  <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer group">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 bg-gradient-to-r ${tool.gradient} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          {tool.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">{tool.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">{tool.description}</p>
                          <p className="text-xs text-gray-500">{tool.stats}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp size={20} />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{activity.action}</p>
                        <p className="text-sm text-gray-600">{activity.tool} • {activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar size={20} />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button className="w-full justify-start bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                    <PenTool className="mr-2" size={16} />
                    Create New Content
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Image className="mr-2" size={16} />
                    Generate Image
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Bot className="mr-2" size={16} />
                    Start AI Chat
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Code className="mr-2" size={16} />
                    Generate Code
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}