import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { 
  Users, Crown, Video, Scissors, DollarSign, ShoppingBag, 
  Trophy, MessageCircle, TrendingUp, Map, Gamepad2, Globe,
  Zap, Star, Eye, Music, Radio, Podcast, Camera, 
  Sparkles, Heart, Gift, Target, Layers, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SystemModule {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: any;
  route: string;
  category: "core" | "monetization" | "engagement" | "analytics" | "entertainment";
  status: "active" | "beta" | "coming-soon";
  userCount?: number;
  revenueImpact?: string;
  gradient: string;
  features: string[];
}

const systemModules: SystemModule[] = [
  {
    id: "fanz",
    name: "Fanz",
    tagline: "Core Social Platform",
    description: "Advanced creator-fan relationship platform with subscription tiers, exclusive content, and community building tools.",
    icon: Users,
    route: "/fanz-dashboard",
    category: "core",
    status: "active",
    userCount: 45000,
    revenueImpact: "+$2.3M",
    gradient: "from-purple-500 via-pink-500 to-rose-500",
    features: ["Multi-tier subscriptions", "Exclusive content feeds", "Fan interaction tools", "Community analytics"]
  },
  {
    id: "fanzfluence",
    name: "FanzFluence", 
    tagline: "MLM & Affiliate Network",
    description: "Multi-level marketing system with affiliate tracking, commission structures, and network growth tools.",
    icon: Crown,
    route: "/fanzfluence",
    category: "monetization",
    status: "active",
    userCount: 12000,
    revenueImpact: "+$890K",
    gradient: "from-amber-500 via-orange-500 to-red-500",
    features: ["MLM hierarchy", "Commission tracking", "Affiliate tools", "Network analytics"]
  },
  {
    id: "fanzstream",
    name: "FanzStream",
    tagline: "Live Broadcasting Suite",
    description: "Professional live streaming platform with interactive features, monetization, and audience engagement.",
    icon: Video,
    route: "/live-streaming",
    category: "entertainment",
    status: "active",
    userCount: 28000,
    revenueImpact: "+$1.7M",
    gradient: "from-blue-500 via-purple-500 to-indigo-500",
    features: ["HD live streaming", "Interactive chat", "Tip integration", "Stream analytics"]
  },
  {
    id: "fanzclips",
    name: "FanzClips",
    tagline: "Short-Form Content Engine",
    description: "TikTok-style short video platform optimized for adult content creators with AI recommendations.",
    icon: Scissors,
    route: "/short-videos",
    category: "entertainment",
    status: "active",
    userCount: 67000,
    revenueImpact: "+$3.1M",
    gradient: "from-teal-500 via-cyan-500 to-blue-500",
    features: ["Short video creation", "AI recommendations", "Viral algorithms", "Monetized views"]
  },
  {
    id: "fanzx",
    name: "FanzX",
    tagline: "Premium Content Vault",
    description: "Secure pay-per-view content library with advanced DRM, watermarking, and access controls.",
    icon: Eye,
    route: "/explore",
    category: "monetization",
    status: "active",
    userCount: 34000,
    revenueImpact: "+$4.2M",
    gradient: "from-violet-500 via-purple-500 to-fuchsia-500",
    features: ["PPV content", "DRM protection", "Watermarking", "Access analytics"]
  },
  {
    id: "fanzshop",
    name: "FanzShop",
    tagline: "Creator Merchandise Hub",
    description: "E-commerce platform for physical and digital merchandise with print-on-demand integration.",
    icon: ShoppingBag,
    route: "/merchandise",
    category: "monetization",
    status: "active",
    userCount: 19000,
    revenueImpact: "+$1.4M",
    gradient: "from-green-500 via-emerald-500 to-teal-500",
    features: ["Print-on-demand", "Digital products", "Inventory management", "Sales analytics"]
  },
  {
    id: "fanzstage",
    name: "FanzStage",
    tagline: "Competition Platform",
    description: "Creator competitions, challenges, and contests with voting, prizes, and community engagement.",
    icon: Trophy,
    route: "/contests",
    category: "engagement",
    status: "active",
    userCount: 23000,
    revenueImpact: "+$650K",
    gradient: "from-yellow-500 via-orange-500 to-red-500",
    features: ["Creator contests", "Fan voting", "Prize distribution", "Leaderboards"]
  },
  {
    id: "fanzversity",
    name: "FanzVersity",
    tagline: "Creator Education Hub",
    description: "Comprehensive learning platform with courses, tutorials, and certification programs for creators.",
    icon: MessageCircle,
    route: "/forum",
    category: "engagement",
    status: "beta",
    userCount: 15000,
    gradient: "from-indigo-500 via-blue-500 to-cyan-500",
    features: ["Creator courses", "Certification programs", "Live workshops", "Skill tracking"]
  },
  {
    id: "fanzrank",
    name: "FanzRank",
    tagline: "Creator Ranking System",
    description: "Sophisticated ranking algorithm considering engagement, revenue, and fan satisfaction metrics.",
    icon: TrendingUp,
    route: "/creator-dashboard",
    category: "analytics",
    status: "active",
    userCount: 41000,
    gradient: "from-pink-500 via-rose-500 to-red-500",
    features: ["Performance rankings", "Trending creators", "Algorithm insights", "Growth tracking"]
  },
  {
    id: "fanzmetaverse",
    name: "FanzMetaVerse",
    tagline: "Virtual Reality Experience",
    description: "Immersive virtual reality platform for creator-fan interactions, virtual events, and 3D content.",
    icon: Gamepad2,
    route: "/games",
    category: "entertainment",
    status: "beta",
    userCount: 8000,
    gradient: "from-cyan-500 via-blue-500 to-purple-500",
    features: ["VR experiences", "Virtual events", "3D content", "Avatar system"]
  },
  {
    id: "fanzreach",
    name: "FanzReach",
    tagline: "Social Media Amplifier",
    description: "Cross-platform social media management and content distribution with analytics.",
    icon: Globe,
    route: "/social-media-tools",
    category: "analytics",
    status: "active",
    userCount: 29000,
    gradient: "from-emerald-500 via-green-500 to-lime-500",
    features: ["Multi-platform posting", "Content scheduling", "Analytics dashboard", "Audience insights"]
  },
  {
    id: "fanzmap",
    name: "FanzMap",
    tagline: "System Navigation Hub",
    description: "Central navigation and control center for all platform modules with real-time system status.",
    icon: Map,
    route: "/system-map",
    category: "core",
    status: "active",
    gradient: "from-slate-500 via-gray-500 to-zinc-500",
    features: ["Module navigation", "System status", "Quick access", "Usage analytics"]
  }
];

export default function SystemMap() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedModule, setSelectedModule] = useState<SystemModule | null>(null);
  const [isGridView, setIsGridView] = useState(true);

  const categories = [
    { id: "all", name: "All Modules", icon: Layers },
    { id: "core", name: "Core Systems", icon: Zap },
    { id: "monetization", name: "Monetization", icon: DollarSign },
    { id: "engagement", name: "Engagement", icon: Heart },
    { id: "analytics", name: "Analytics", icon: TrendingUp },
    { id: "entertainment", name: "Entertainment", icon: Star }
  ];

  const filteredModules = selectedCategory === "all" 
    ? systemModules 
    : systemModules.filter(module => module.category === selectedCategory);

  const totalUsers = systemModules.reduce((sum, module) => sum + (module.userCount || 0), 0);
  const totalRevenue = systemModules
    .filter(module => module.revenueImpact)
    .reduce((sum, module) => {
      const revenue = parseFloat(module.revenueImpact?.replace(/[^0-9.]/g, '') || '0');
      return sum + revenue;
    }, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-4">
            Fanz Operating System
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            A modular, future-proof platform built for infinite scale
          </p>
          
          <div className="flex justify-center gap-8 mb-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400">{totalUsers.toLocaleString()}</div>
              <div className="text-sm text-gray-400">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">${totalRevenue.toFixed(1)}M</div>
              <div className="text-sm text-gray-400">Revenue Impact</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">{systemModules.length}</div>
              <div className="text-sm text-gray-400">Core Modules</div>
            </div>
          </div>
        </motion.div>

        {/* Category Filter */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap justify-center gap-4 mb-8"
        >
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              onClick={() => setSelectedCategory(category.id)}
              className={`${
                selectedCategory === category.id 
                  ? "bg-purple-600 hover:bg-purple-700" 
                  : "border-purple-500/30 hover:border-purple-500/60"
              }`}
              data-testid={`filter-${category.id}`}
            >
              <category.icon className="w-4 h-4 mr-2" />
              {category.name}
            </Button>
          ))}
        </motion.div>

        {/* Module Grid */}
        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12"
        >
          <AnimatePresence>
            {filteredModules.map((module, index) => (
              <motion.div
                key={module.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="group"
              >
                <Link href={module.route}>
                  <Card className="relative overflow-hidden bg-slate-800/50 border-slate-700/50 hover:border-purple-500/50 transition-all duration-300 cursor-pointer h-full">
                    <div className={`absolute inset-0 bg-gradient-to-br ${module.gradient} opacity-10 group-hover:opacity-20 transition-opacity`}></div>
                    
                    <div className="relative p-6 h-full flex flex-col">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-lg bg-gradient-to-br ${module.gradient} shadow-lg`}>
                          <module.icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge 
                            variant={module.status === "active" ? "default" : module.status === "beta" ? "secondary" : "outline"}
                            className="text-xs"
                          >
                            {module.status}
                          </Badge>
                          {module.userCount && (
                            <div className="text-xs text-gray-400">
                              {module.userCount.toLocaleString()} users
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-2">{module.name}</h3>
                        <p className="text-purple-300 text-sm font-medium mb-3">{module.tagline}</p>
                        <p className="text-gray-300 text-sm leading-relaxed mb-4">{module.description}</p>
                      </div>

                      <div className="space-y-3">
                        {module.revenueImpact && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">Revenue Impact</span>
                            <span className="text-green-400 font-semibold">{module.revenueImpact}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between text-purple-300 group-hover:text-purple-200 transition-colors">
                          <span className="text-sm font-medium">Explore Module</span>
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Full System Map Button */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8 py-4 text-lg"
            data-testid="button-full-map"
          >
            <Map className="w-5 h-5 mr-2" />
            View Full System Architecture
          </Button>
        </motion.div>
      </div>
    </div>
  );
}