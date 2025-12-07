import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
  useNavigate
} from "react-router-dom";
import {
  Layers,
  User,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  MapPin,
  Shield,
  Video,
  DollarSign,
  Megaphone,
  Users,
  Activity,
  TrendingUp,
  Eye,
  BarChart,
  Clock,
  Bell,
  Grid,
  Zap,
  Globe,
  Cpu,
  Database,
  Lock,
  Camera,
  ChevronRight,
  Package,
  School,
  Gamepad2,
  MessageSquare,
  ShoppingBag,
  Radio,
  Brain,
  ShieldCheck,
  LineChart,
  Home,
  Play,
  Heart,
  Star,
  Award,
  Coins,
  Wallet,
  Trophy,
  Target,
  Sparkles,
  Rocket,
  Crown,
  Plus,
  Diamond,
  Gift,
  TrendingDown,
  ArrowRight,
  CheckCircle,
  XCircle,
  Info,
  AlertTriangle,
  Search,
  Filter,
  Download,
  Upload,
  Share2,
  Send,
  Bookmark,
  Hash,
  AtSign,
  Link2,
  ExternalLink,
  Copy,
  Edit,
  Trash2,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ArrowLeft,
  RefreshCw,
  RotateCw,
  Loader,
  CircleDot,
  Circle,
  Square,
  Triangle,
  Hexagon,
  Octagon,
  Pentagon,
  Command,
  Aperture,
  Disc,
  Music,
  Mic,
  Headphones,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Bluetooth,
  Cast,
  Airplay,
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  HardDrive,
  Server,
  Cloud,
  CloudDownload,
  CloudUpload,
  FolderOpen,
  File,
  FileText,
  Image,
  Film,
  Calendar,
  CalendarDays,
  Timer,
  Alarm,
  Watch,
  Hourglass,
  Navigation,
  MapPinned,
  Compass,
  Map,
  Flag,
  Anchor,
  Send as SendIcon,
  Inbox,
  Archive,
  Tag,
  Tags,
  Percent,
  Receipt,
  Banknote,
  CreditCard as CardIcon,
  ShoppingCart,
  Package2,
  Store,
  Building,
  Building2,
  Hotel,
  Landmark,
  Mountain,
  Trees,
  Sunset,
  Moon,
  Sun,
  CloudRain,
  CloudSnow,
  Wind,
  Gauge,
  Sliders,
  ToggleLeft,
  ToggleRight,
  Crosshair,
  Maximize,
  Minimize,
  Expand,
  Shrink,
  Move,
  GitBranch,
  GitCommit,
  GitMerge,
  GitPullRequest,
  Github,
  Gitlab,
  Twitter,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  Twitch,
  // Discord, // Not available in this lucide-react version
  Slack,
  MessagesSquare,
  UserPlus,
  UserMinus,
  UserCheck,
  UserX,
  UsersRound,
  PersonStanding,
  Accessibility,
  Glasses,
  HandMetal,
  ThumbsUp,
  ThumbsDown,
  HeartHandshake,
  Handshake,
  Briefcase,
  Backpack,
  Umbrella,
  Coffee,
  Cookie,
  Pizza,
  Utensils,
  ChefHat,
  Cake,
  Milk,
  Beer,
  Wine,
  Martini,
  Cherry,
  Apple,
  Banana,
  Orange,
  Grape,
  Strawberry,
  Candy,
  IceCream,
  Popcorn,
  Sandwich,
  Soup,
  Salad,
  Fish,
  Egg,
  Drumstick,
  Beef,
  Croissant,
  Baguette,
  Pretzel,
  Bagel,
  Pancakes,
  Waffle,
  Cookie as CookieIcon,
  Donut,
  CupSoda
} from "lucide-react";
import axios from "axios";
import { 
  ColorPaletteGenerator, 
  OnboardingTour, 
  DashboardWidget, 
  AnnotationLayer, 
  MicroInteractions 
} from "./ThemeGenerator";
import ExplorePage from './pages/Explore';
import AdminCategoriesPage from './pages/AdminCategories';
import AdminTodosPage from './pages/AdminTodos';

// Configure axios defaults
axios.defaults.baseURL = "/api/v1";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        const response = await axios.get("/auth/user");
        if (response.data) {
          setUser(response.data);
          setIsAuthenticated(true);
        }
      }
    } catch (error) {
      localStorage.removeItem("token");
      delete axios.defaults.headers.common["Authorization"];
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#6b5f24] to-[#161718]">
        <div className="text-center">
          <Aperture className="h-16 w-16 text-[#6b5f24] animate-spin mx-auto mb-4" />
          <p className="text-white/80">Loading FANZ OS...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={!isAuthenticated ? <LandingPage /> : <Navigate to="/dashboard" />} />
        <Route path="/signup" element={!isAuthenticated ? <SignupPage setIsAuthenticated={setIsAuthenticated} setUser={setUser} /> : <Navigate to="/dashboard" />} />
        <Route path="/login" element={!isAuthenticated ? <LoginPage setIsAuthenticated={setIsAuthenticated} setUser={setUser} /> : <Navigate to="/dashboard" />} />
        <Route path="/dashboard/*" element={isAuthenticated ? <Dashboard user={user} setIsAuthenticated={setIsAuthenticated} /> : <Navigate to="/" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

// State-of-the-Art Landing Page
function LandingPage() {
  const [activeSection, setActiveSection] = useState(0);
  const navigate = useNavigate();

  const platformFeatures = [
    {
      icon: <Video className="h-8 w-8" />,
      title: "FanzFlixxx",
      description: "Short-form video content platform with AI recommendations",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: <Radio className="h-8 w-8" />,
      title: "Live Streaming",
      description: "WebRTC & RTMP streaming with interactive features",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Megaphone className="h-8 w-8" />,
      title: "FANZFluence",
      description: "MLM & affiliate marketing with commission tracking",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      icon: <School className="h-8 w-8" />,
      title: "FANZVersity",
      description: "Creator education platform with certifications",
      gradient: "from-orange-500 to-amber-500"
    },
    {
      icon: <Globe className="h-8 w-8" />,
      title: "FANZMetaVerse",
      description: "VR/AR experiences and virtual worlds",
      gradient: "from-indigo-500 to-purple-500"
    },
    {
      icon: <Trophy className="h-8 w-8" />,
      title: "Gamification",
      description: "Rewards, achievements, and engagement features",
      gradient: "from-red-500 to-pink-500"
    },
    {
      icon: <ShoppingBag className="h-8 w-8" />,
      title: "Merchandise",
      description: "E-commerce with print-on-demand integration",
      gradient: "from-teal-500 to-cyan-500"
    },
    {
      icon: <MessageSquare className="h-8 w-8" />,
      title: "Messaging",
      description: "Real-time chat with PPV messages",
      gradient: "from-violet-500 to-purple-500"
    },
    {
      icon: <Brain className="h-8 w-8" />,
      title: "AI Service",
      description: "Content moderation and recommendations",
      gradient: "from-pink-500 to-rose-500"
    },
    {
      icon: <ShieldCheck className="h-8 w-8" />,
      title: "Military Security",
      description: "AES-256 encryption with intrusion detection",
      gradient: "from-slate-500 to-gray-500"
    },
    {
      icon: <LineChart className="h-8 w-8" />,
      title: "Analytics",
      description: "Enterprise monitoring with real-time metrics",
      gradient: "from-blue-500 to-indigo-500"
    },
    {
      icon: <Wallet className="h-8 w-8" />,
      title: "Multi-Payment",
      description: "Traditional & cryptocurrency payment processing",
      gradient: "from-yellow-500 to-orange-500"
    }
  ];

  const stats = [
    { value: "100%", label: "Creator Earnings", icon: <DollarSign /> },
    { value: "0%", label: "Platform Fees", icon: <Percent /> },
    { value: "256-bit", label: "Encryption", icon: <Shield /> },
    { value: "13", label: "Microservices", icon: <Server /> },
    { value: "24/7", label: "Support", icon: <Clock /> },
    { value: "∞", label: "Scalability", icon: <Rocket /> }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#6b5f24] to-[#161718] text-white overflow-x-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-[#6b5f24] rounded-full filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#161718] rounded-full filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: "2s" }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-[#6b5f24] to-[#161718] rounded-full filter blur-3xl opacity-10 animate-spin-slow"></div>
      </div>

      {/* Premium Navigation */}
      <nav className="relative z-50 backdrop-blur-lg bg-black/20 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Hexagon className="h-10 w-10 text-[#6b5f24]" />
                <div className="absolute inset-0 animate-ping">
                  <Hexagon className="h-10 w-10 text-[#6b5f24] opacity-30" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-[#6b5f24] to-white bg-clip-text text-transparent">
                  FANZ OS
                </h1>
                <p className="text-xs text-white/60 tracking-widest uppercase">Enterprise Platform</p>
              </div>
            </div>
            
            {/* Platform Components Navigation */}
            <div className="hidden lg:flex items-center space-x-2">
              <div className="flex items-center space-x-1 px-4 py-2 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                <button
                  onClick={() => document.getElementById('content-hub').scrollIntoView({ behavior: 'smooth' })}
                  className="px-4 py-2 rounded-lg hover:bg-white/10 transition-all duration-300 flex items-center space-x-2 group"
                >
                  <Video className="h-4 w-4 text-purple-400 group-hover:text-purple-300" />
                  <span className="text-sm font-medium">Content Hub</span>
                </button>
                
                <button
                  onClick={() => document.getElementById('streaming').scrollIntoView({ behavior: 'smooth' })}
                  className="px-4 py-2 rounded-lg hover:bg-white/10 transition-all duration-300 flex items-center space-x-2 group"
                >
                  <Radio className="h-4 w-4 text-red-400 group-hover:text-red-300" />
                  <span className="text-sm font-medium">Live Streaming</span>
                </button>
                
                <button
                  onClick={() => document.getElementById('fanzfluence').scrollIntoView({ behavior: 'smooth' })}
                  className="px-4 py-2 rounded-lg hover:bg-white/10 transition-all duration-300 flex items-center space-x-2 group"
                >
                  <Megaphone className="h-4 w-4 text-green-400 group-hover:text-green-300" />
                  <span className="text-sm font-medium">FANZFluence</span>
                </button>
                
                <button
                  onClick={() => document.getElementById('fanzversity').scrollIntoView({ behavior: 'smooth' })}
                  className="px-4 py-2 rounded-lg hover:bg-white/10 transition-all duration-300 flex items-center space-x-2 group"
                >
                  <School className="h-4 w-4 text-orange-400 group-hover:text-orange-300" />
                  <span className="text-sm font-medium">FANZVersity</span>
                </button>
                
                <button
                  onClick={() => document.getElementById('metaverse').scrollIntoView({ behavior: 'smooth' })}
                  className="px-4 py-2 rounded-lg hover:bg-white/10 transition-all duration-300 flex items-center space-x-2 group"
                >
                  <Globe className="h-4 w-4 text-indigo-400 group-hover:text-indigo-300" />
                  <span className="text-sm font-medium">FANZMetaVerse</span>
                </button>
                
                <button
                  onClick={() => document.getElementById('gamification').scrollIntoView({ behavior: 'smooth' })}
                  className="px-4 py-2 rounded-lg hover:bg-white/10 transition-all duration-300 flex items-center space-x-2 group"
                >
                  <Trophy className="h-4 w-4 text-yellow-400 group-hover:text-yellow-300" />
                  <span className="text-sm font-medium">Gamification</span>
                </button>
                
                <button
                  onClick={() => document.getElementById('merchandise').scrollIntoView({ behavior: 'smooth' })}
                  className="px-4 py-2 rounded-lg hover:bg-white/10 transition-all duration-300 flex items-center space-x-2 group"
                >
                  <ShoppingBag className="h-4 w-4 text-teal-400 group-hover:text-teal-300" />
                  <span className="text-sm font-medium">Merchandise</span>
                </button>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300 flex items-center space-x-2"
              >
                <Lock className="h-4 w-4" />
                <span>Login</span>
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-[#6b5f24] to-[#4a3f1a] hover:from-[#7d6e2a] hover:to-[#5c4d1f] transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Sparkles className="h-4 w-4" />
                <span className="font-semibold">Get Started</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-8">
            <Zap className="h-4 w-4 text-[#6b5f24]" />
            <span className="text-sm font-medium">Military-Grade Adult Content Platform</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              The Future of
            </span>
            <br />
            <span className="bg-gradient-to-r from-[#6b5f24] via-[#8b7f3a] to-[#6b5f24] bg-clip-text text-transparent animate-gradient">
              Adult Content
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/80 mb-12 max-w-3xl mx-auto leading-relaxed">
            Keep 100% of your earnings with zero platform fees. Enterprise-grade security,
            AI-powered features, and comprehensive monetization tools.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button
              onClick={() => navigate('/signup')}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#6b5f24] to-[#4a3f1a] hover:from-[#7d6e2a] hover:to-[#5c4d1f] transition-all duration-300 flex items-center justify-center space-x-3 shadow-xl hover:shadow-2xl transform hover:scale-105 group"
            >
              <Rocket className="h-5 w-5 group-hover:rotate-12 transition-transform" />
              <span className="text-lg font-semibold">Start Earning Now</span>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button
              onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 rounded-xl bg-white/10 backdrop-blur-sm border-2 border-white/20 hover:bg-white/20 transition-all duration-300 flex items-center justify-center space-x-3"
            >
              <Play className="h-5 w-5" />
              <span className="text-lg font-semibold">Watch Demo</span>
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300 transform hover:scale-105"
              >
                <div className="text-[#6b5f24] mb-2 flex justify-center">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-white/60">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                Comprehensive Platform Features
              </span>
            </h2>
            <p className="text-xl text-white/60">Everything you need to succeed in one integrated platform</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {platformFeatures.map((feature, index) => (
              <div
                key={index}
                className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2"
                onMouseEnter={() => setActiveSection(index)}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-500`}></div>
                
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.gradient} mb-4`}>
                  {feature.icon}
                </div>
                
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-white/60 text-sm">{feature.description}</p>
                
                <div className="mt-4 flex items-center text-[#6b5f24] group-hover:text-[#8b7f3a] transition-colors">
                  <span className="text-sm font-medium">Learn more</span>
                  <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Networks */}
      <section className="py-20 px-6 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-[#6b5f24] to-white bg-clip-text text-transparent">
                Multi-Platform Network
              </span>
            </h2>
            <p className="text-xl text-white/60">Choose your platform or operate across all networks</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300">
                <div className="inline-flex p-4 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 mb-6">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-2">BoyFanz</h3>
                <p className="text-white/60 mb-4">Male creator platform with specialized features</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/40">2.3K Active Creators</span>
                  <Badge text="LIVE" color="blue" />
                </div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300">
                <div className="inline-flex p-4 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 mb-6">
                  <Heart className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-2">GirlFanz</h3>
                <p className="text-white/60 mb-4">Female creator platform with premium tools</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/40">5.1K Active Creators</span>
                  <Badge text="LIVE" color="pink" />
                </div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300">
                <div className="inline-flex p-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 mb-6">
                  <Star className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-2">PupFanz</h3>
                <p className="text-white/60 mb-4">Specialized community platform</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/40">1.8K Active Creators</span>
                  <Badge text="LIVE" color="green" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-20 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-red-500/20 border border-red-500/30 mb-6">
                <Shield className="h-4 w-4 text-red-400" />
                <span className="text-sm font-medium text-red-400">Military-Grade Security</span>
              </div>
              
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                  Enterprise Security & Compliance
                </span>
              </h2>
              
              <div className="space-y-4">
                <SecurityFeature
                  icon={<Lock />}
                  title="AES-256 Encryption"
                  description="Military-grade encryption for all data at rest and in transit"
                />
                <SecurityFeature
                  icon={<ShieldCheck />}
                  title="DMCA Protection"
                  description="Advanced content protection with forensic watermarking"
                />
                <SecurityFeature
                  icon={<Eye />}
                  title="2257 Compliance"
                  description="Full regulatory compliance with automated record keeping"
                />
                <SecurityFeature
                  icon={<Database />}
                  title="GDPR/CCPA Ready"
                  description="Complete data privacy compliance for global operations"
                />
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#6b5f24] to-[#161718] rounded-2xl blur-3xl opacity-20"></div>
              <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
                <div className="grid grid-cols-2 gap-4">
                  <MetricCard label="Uptime" value="99.99%" />
                  <MetricCard label="Response Time" value="<50ms" />
                  <MetricCard label="Encryption" value="256-bit" />
                  <MetricCard label="Compliance" value="100%" />
                </div>
                
                <div className="mt-8 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span className="text-green-400 font-medium">All Systems Operational</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 relative">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#6b5f24] to-[#161718] rounded-3xl blur-3xl opacity-30"></div>
            <div className="relative bg-gradient-to-r from-[#6b5f24] to-[#4a3f1a] rounded-3xl p-12 shadow-2xl">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Ready to Keep 100% of Your Earnings?
              </h2>
              <p className="text-xl mb-8 text-white/90">
                Join thousands of creators who've switched to FANZ OS for zero fees and maximum earnings
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/signup')}
                  className="px-8 py-4 rounded-xl bg-white text-[#6b5f24] hover:bg-white/90 transition-all duration-300 flex items-center justify-center space-x-3 shadow-xl hover:shadow-2xl transform hover:scale-105 group font-semibold"
                >
                  <Crown className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                  <span className="text-lg">Start Free Trial</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </button>
                
                <button className="px-8 py-4 rounded-xl bg-white/10 backdrop-blur-sm border-2 border-white/30 hover:bg-white/20 transition-all duration-300 flex items-center justify-center space-x-3 font-semibold">
                  <MessageSquare className="h-5 w-5" />
                  <span className="text-lg">Contact Sales</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Hexagon className="h-8 w-8 text-[#6b5f24]" />
                <span className="text-xl font-bold">FANZ OS</span>
              </div>
              <p className="text-white/60 text-sm">
                Enterprise-grade adult content platform with military security
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <div className="space-y-2">
                <FooterLink href="#" text="Features" />
                <FooterLink href="#" text="Security" />
                <FooterLink href="#" text="Pricing" />
                <FooterLink href="#" text="API Docs" />
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <div className="space-y-2">
                <FooterLink href="#" text="About" />
                <FooterLink href="#" text="Careers" />
                <FooterLink href="#" text="Partners" />
                <FooterLink href="#" text="Press" />
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <div className="space-y-2">
                <FooterLink href="#" text="Terms" />
                <FooterLink href="#" text="Privacy" />
                <FooterLink href="#" text="2257 Compliance" />
                <FooterLink href="#" text="DMCA" />
              </div>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center">
            <p className="text-white/40 text-sm">
              © 2025 FANZ OS. All rights reserved.
            </p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <SocialIcon icon={<Twitter className="h-5 w-5" />} />
              <SocialIcon icon={<Instagram className="h-5 w-5" />} />
              <SocialIcon icon={<MessageSquare className="h-5 w-5" />} />
              <SocialIcon icon={<Github className="h-5 w-5" />} />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// State-of-the-Art Signup Page
function SignupPage({ setIsAuthenticated, setUser }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    accountType: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    dateOfBirth: '',
    platform: '',
    agreeTerms: false,
    agreeAge: false,
    subscribe: false
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateStep = () => {
    const newErrors = {};
    
    if (step === 1) {
      if (!formData.accountType) newErrors.accountType = "Please select an account type";
    } else if (step === 2) {
      if (!formData.username) newErrors.username = "Username is required";
      if (!formData.email) newErrors.email = "Email is required";
      if (!formData.password) newErrors.password = "Password is required";
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords don't match";
      if (formData.password && formData.password.length < 8) newErrors.password = "Password must be at least 8 characters";
    } else if (step === 3) {
      if (!formData.fullName) newErrors.fullName = "Full name is required";
      if (!formData.dateOfBirth) newErrors.dateOfBirth = "Date of birth is required";
      if (!formData.platform) newErrors.platform = "Please select a platform";
    } else if (step === 4) {
      if (!formData.agreeTerms) newErrors.agreeTerms = "You must agree to the terms";
      if (!formData.agreeAge) newErrors.agreeAge = "You must confirm you are 18+";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(step + 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    
    setLoading(true);
    try {
      const response = await axios.post("/auth/register", {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        dateOfBirth: formData.dateOfBirth,
        accountType: formData.accountType,
        platform: formData.platform,
        subscribe: formData.subscribe
      });

      const { token, user } = response.data;
      localStorage.setItem("token", token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      
      setUser(user);
      setIsAuthenticated(true);
      navigate('/dashboard');
    } catch (error) {
      setErrors({ submit: error.response?.data?.error || "Registration failed" });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#6b5f24] to-[#161718] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`flex items-center ${s < 4 ? 'flex-1' : ''}`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                      step >= s
                        ? 'bg-gradient-to-r from-[#6b5f24] to-[#4a3f1a] text-white'
                        : 'bg-white/10 text-white/40'
                    }`}
                  >
                    {step > s ? <CheckCircle className="h-5 w-5" /> : s}
                  </div>
                  {s < 4 && (
                    <div
                      className={`flex-1 h-1 mx-2 rounded transition-all duration-300 ${
                        step > s ? 'bg-[#6b5f24]' : 'bg-white/10'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-sm text-white/60">
              <span>Account Type</span>
              <span>Credentials</span>
              <span>Profile</span>
              <span>Confirm</span>
            </div>
          </div>

          {/* Step Content */}
          <div className="mb-8">
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-2">Choose Your Account Type</h2>
                  <p className="text-white/60">Select how you want to use FANZ OS</p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setFormData({ ...formData, accountType: 'creator' })}
                    className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                      formData.accountType === 'creator'
                        ? 'bg-[#6b5f24]/20 border-[#6b5f24] scale-105'
                        : 'bg-white/5 border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <Camera className="h-12 w-12 mb-4 mx-auto text-[#6b5f24]" />
                    <h3 className="text-xl font-bold mb-2">Content Creator</h3>
                    <p className="text-white/60 text-sm">Share content and earn money</p>
                    <div className="mt-4 space-y-1">
                      <div className="flex items-center text-sm text-white/80">
                        <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                        Keep 100% earnings
                      </div>
                      <div className="flex items-center text-sm text-white/80">
                        <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                        Analytics dashboard
                      </div>
                      <div className="flex items-center text-sm text-white/80">
                        <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                        Live streaming
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setFormData({ ...formData, accountType: 'fan' })}
                    className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                      formData.accountType === 'fan'
                        ? 'bg-[#6b5f24]/20 border-[#6b5f24] scale-105'
                        : 'bg-white/5 border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <Heart className="h-12 w-12 mb-4 mx-auto text-pink-400" />
                    <h3 className="text-xl font-bold mb-2">Fan / Subscriber</h3>
                    <p className="text-white/60 text-sm">Discover and support creators</p>
                    <div className="mt-4 space-y-1">
                      <div className="flex items-center text-sm text-white/80">
                        <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                        Exclusive content
                      </div>
                      <div className="flex items-center text-sm text-white/80">
                        <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                        Direct messaging
                      </div>
                      <div className="flex items-center text-sm text-white/80">
                        <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                        Live interactions
                      </div>
                    </div>
                  </button>
                </div>
                {errors.accountType && (
                  <p className="text-red-400 text-sm text-center">{errors.accountType}</p>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-2">Create Your Account</h2>
                  <p className="text-white/60">Choose your username and secure your account</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:border-[#6b5f24] focus:outline-none focus:ring-2 focus:ring-[#6b5f24]/50 transition-all"
                    placeholder="Choose a unique username"
                  />
                  {errors.username && <p className="text-red-400 text-sm mt-1">{errors.username}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:border-[#6b5f24] focus:outline-none focus:ring-2 focus:ring-[#6b5f24]/50 transition-all"
                    placeholder="your@email.com"
                  />
                  {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:border-[#6b5f24] focus:outline-none focus:ring-2 focus:ring-[#6b5f24]/50 transition-all"
                    placeholder="Minimum 8 characters"
                  />
                  {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Confirm Password</label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:border-[#6b5f24] focus:outline-none focus:ring-2 focus:ring-[#6b5f24]/50 transition-all"
                    placeholder="Re-enter your password"
                  />
                  {errors.confirmPassword && <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-2">Complete Your Profile</h2>
                  <p className="text-white/60">Tell us more about yourself</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:border-[#6b5f24] focus:outline-none focus:ring-2 focus:ring-[#6b5f24]/50 transition-all"
                    placeholder="Your full name"
                  />
                  {errors.fullName && <p className="text-red-400 text-sm mt-1">{errors.fullName}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:border-[#6b5f24] focus:outline-none focus:ring-2 focus:ring-[#6b5f24]/50 transition-all"
                  />
                  {errors.dateOfBirth && <p className="text-red-400 text-sm mt-1">{errors.dateOfBirth}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Choose Your Platform</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['BoyFanz', 'GirlFanz', 'PupFanz'].map((platform) => (
                      <button
                        key={platform}
                        onClick={() => setFormData({ ...formData, platform })}
                        className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                          formData.platform === platform
                            ? 'bg-[#6b5f24]/20 border-[#6b5f24]'
                            : 'bg-white/5 border-white/20 hover:bg-white/10'
                        }`}
                      >
                        <span className="font-medium">{platform}</span>
                      </button>
                    ))}
                  </div>
                  {errors.platform && <p className="text-red-400 text-sm mt-1">{errors.platform}</p>}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-2">Final Step</h2>
                  <p className="text-white/60">Review and confirm your registration</p>
                </div>
                
                <div className="bg-white/5 rounded-xl p-6 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-white/60">Account Type:</span>
                    <span className="font-medium capitalize">{formData.accountType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Username:</span>
                    <span className="font-medium">@{formData.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Email:</span>
                    <span className="font-medium">{formData.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Platform:</span>
                    <span className="font-medium">{formData.platform}</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.agreeTerms}
                      onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })}
                      className="mt-1 w-5 h-5 rounded bg-white/10 border-white/20 text-[#6b5f24] focus:ring-[#6b5f24]"
                    />
                    <span className="text-sm text-white/80">
                      I agree to the Terms of Service and Privacy Policy
                    </span>
                  </label>
                  {errors.agreeTerms && <p className="text-red-400 text-sm">{errors.agreeTerms}</p>}
                  
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.agreeAge}
                      onChange={(e) => setFormData({ ...formData, agreeAge: e.target.checked })}
                      className="mt-1 w-5 h-5 rounded bg-white/10 border-white/20 text-[#6b5f24] focus:ring-[#6b5f24]"
                    />
                    <span className="text-sm text-white/80">
                      I confirm that I am 18 years of age or older
                    </span>
                  </label>
                  {errors.agreeAge && <p className="text-red-400 text-sm">{errors.agreeAge}</p>}
                  
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.subscribe}
                      onChange={(e) => setFormData({ ...formData, subscribe: e.target.checked })}
                      className="mt-1 w-5 h-5 rounded bg-white/10 border-white/20 text-[#6b5f24] focus:ring-[#6b5f24]"
                    />
                    <span className="text-sm text-white/80">
                      Send me updates about new features and promotions
                    </span>
                  </label>
                </div>
                
                {errors.submit && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                    <p className="text-red-400">{errors.submit}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-300 flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
            )}
            
            <div className={`${step === 1 ? 'ml-auto' : ''}`}>
              {step < 4 ? (
                <button
                  onClick={handleNext}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#6b5f24] to-[#4a3f1a] hover:from-[#7d6e2a] hover:to-[#5c4d1f] transition-all duration-300 flex items-center space-x-2"
                >
                  <span>Continue</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#6b5f24] to-[#4a3f1a] hover:from-[#7d6e2a] hover:to-[#5c4d1f] transition-all duration-300 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>Complete Registration</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="text-center mt-6">
            <p className="text-white/60">
              Already have an account?{" "}
              <Link to="/login" className="text-[#6b5f24] hover:text-[#8b7f3a] transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// State-of-the-Art Login Page
function LoginPage({ setIsAuthenticated, setUser }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const response = await axios.post("/auth/login", {
        email: formData.email,
        password: formData.password
      });

      const { token, user } = response.data;
      localStorage.setItem("token", token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      
      setUser(user);
      setIsAuthenticated(true);
      navigate('/dashboard');
    } catch (error) {
      setErrors({ submit: error.response?.data?.error || "Invalid credentials" });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#6b5f24] to-[#161718] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex p-4 rounded-full bg-gradient-to-r from-[#6b5f24] to-[#4a3f1a] mb-4">
              <Hexagon className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Welcome Back</h2>
            <p className="text-white/60">Sign in to access your FANZ OS account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.submit && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <p className="text-red-400 text-sm">{errors.submit}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 pl-11 rounded-xl bg-white/10 border border-white/20 focus:border-[#6b5f24] focus:outline-none focus:ring-2 focus:ring-[#6b5f24]/50 transition-all"
                  placeholder="your@email.com"
                  required
                />
                <AtSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 pl-11 rounded-xl bg-white/10 border border-white/20 focus:border-[#6b5f24] focus:outline-none focus:ring-2 focus:ring-[#6b5f24]/50 transition-all"
                  placeholder="Enter your password"
                  required
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                  className="w-4 h-4 rounded bg-white/10 border-white/20 text-[#6b5f24] focus:ring-[#6b5f24]"
                />
                <span className="text-sm text-white/80">Remember me</span>
              </label>
              
              <a href="#" className="text-sm text-[#6b5f24] hover:text-[#8b7f3a] transition-colors">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-[#6b5f24] to-[#4a3f1a] hover:from-[#7d6e2a] hover:to-[#5c4d1f] transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {loading ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <LogOut className="h-5 w-5" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-transparent text-white/60">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-6">
              <button className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-300 flex items-center justify-center">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </button>
              
              <button className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-300 flex items-center justify-center">
                <Twitter className="h-5 w-5" />
              </button>
              
              <button className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-300 flex items-center justify-center">
                <MessageSquare className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="text-center mt-8">
            <p className="text-white/60">
              Don't have an account?{" "}
              <Link to="/signup" className="text-[#6b5f24] hover:text-[#8b7f3a] transition-colors font-semibold">
                Sign up for free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// State-of-the-Art Dashboard
function Dashboard({ user, setIsAuthenticated }) {
  const [activeModule, setActiveModule] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(!localStorage.getItem('onboardingComplete'));
  const [widgets, setWidgets] = useState([
    { id: 'earnings', title: 'Earnings', icon: <DollarSign className="h-5 w-5" />, size: 'medium' },
    { id: 'subscribers', title: 'Subscribers', icon: <Users className="h-5 w-5" />, size: 'medium' },
    { id: 'views', title: 'Content Views', icon: <Eye className="h-5 w-5" />, size: 'small' },
    { id: 'streaming', title: 'Live Hours', icon: <Radio className="h-5 w-5" />, size: 'small' },
    { id: 'activity', title: 'Recent Activity', icon: <Activity className="h-5 w-5" />, size: 'large' },
    { id: 'analytics', title: 'Analytics', icon: <LineChart className="h-5 w-5" />, size: 'large' }
  ]);
  const [currentTheme, setCurrentTheme] = useState('golden');
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["Authorization"];
    setIsAuthenticated(false);
    navigate('/');
  };

  const modules = [
    { id: 'overview', name: 'Overview', icon: <Home />, color: 'from-blue-500 to-cyan-500' },
    { id: 'explore', name: 'Explore Creators', icon: <Search />, color: 'from-purple-500 to-pink-500' },
    { id: 'content', name: 'Content Hub', icon: <Video />, color: 'from-purple-500 to-pink-500' },
    { id: 'streaming', name: 'Live Streaming', icon: <Radio />, color: 'from-red-500 to-orange-500' },
    { id: 'fanzfluence', name: 'FANZFluence', icon: <Megaphone />, color: 'from-green-500 to-emerald-500' },
    { id: 'fanzversity', name: 'FANZVersity', icon: <School />, color: 'from-orange-500 to-amber-500' },
    { id: 'metaverse', name: 'FANZMetaVerse', icon: <Globe />, color: 'from-indigo-500 to-purple-500' },
    { id: 'gamification', name: 'Gamification', icon: <Trophy />, color: 'from-yellow-500 to-orange-500' },
    { id: 'merchandise', name: 'Merchandise', icon: <ShoppingBag />, color: 'from-teal-500 to-cyan-500' },
    { id: 'messaging', name: 'Messages', icon: <MessageSquare />, color: 'from-violet-500 to-purple-500' },
    { id: 'analytics', name: 'Analytics', icon: <LineChart />, color: 'from-blue-500 to-indigo-500' },
    { id: 'payments', name: 'Payments', icon: <Wallet />, color: 'from-green-500 to-teal-500' },
    { id: 'settings', name: 'Settings', icon: <Settings />, color: 'from-gray-500 to-slate-500' },
    { id: 'admin-categories', name: 'Admin Categories', icon: <Layers />, color: 'from-gray-500 to-slate-500' },
    { id: 'admin-todos', name: 'Developer TODOs', icon: <CheckCircle />, color: 'from-indigo-500 to-purple-500' }
  ];

  const handleWidgetRemove = (widgetId) => {
    setWidgets(widgets.filter(w => w.id !== widgetId));
  };

  const handleWidgetResize = (widgetId, newSize) => {
    setWidgets(widgets.map(w => w.id === widgetId ? { ...w, size: newSize } : w));
  };

  const handleOnboardingComplete = () => {
    localStorage.setItem('onboardingComplete', 'true');
    setShowOnboarding(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--primary-color,#6b5f24)] to-[var(--secondary-color,#161718)] flex">
      {/* Color Palette Generator */}
      <ColorPaletteGenerator onThemeChange={(theme) => setCurrentTheme(theme)} />
      
      {/* Onboarding Tour */}
      {showOnboarding && (
        <OnboardingTour
          onComplete={handleOnboardingComplete}
          steps={[
            {
              target: '.dashboard-overview',
              title: 'Welcome to FANZ OS!',
              content: 'Your command center for managing content and earnings',
              position: 'bottom'
            },
            {
              target: '.sidebar-navigation',
              title: 'Navigation Menu',
              content: 'Access all platform features from here',
              position: 'right'
            },
            {
              target: '.widget-grid',
              title: 'Customizable Widgets',
              content: 'Drag, resize, and customize your dashboard',
              position: 'top'
            }
          ]}
        />
      )}
      
      {/* Sidebar */}
      <div className={`sidebar-navigation ${sidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 bg-black/20 backdrop-blur-xl border-r border-white/10`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-8">
            <div className={`flex items-center space-x-3 ${!sidebarOpen && 'justify-center'}`}>
              <Hexagon className="h-8 w-8 text-[#6b5f24]" />
              {sidebarOpen && (
                <div>
                  <h1 className="text-xl font-bold">FANZ OS</h1>
                  <p className="text-xs text-white/60">Dashboard</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          </div>

          <nav className="space-y-2">
            {modules.map((module) => (
              <button
                key={module.id}
                onClick={() => setActiveModule(module.id)}
                className={`w-full flex items-center ${sidebarOpen ? 'justify-start' : 'justify-center'} space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  activeModule === module.id
                    ? 'bg-gradient-to-r ' + module.color + ' text-white shadow-lg'
                    : 'bg-white/5 hover:bg-white/10 text-white/80'
                }`}
              >
                {module.icon}
                {sidebarOpen && <span className="font-medium">{module.name}</span>}
              </button>
            ))}
          </nav>

          <div className="mt-8 pt-8 border-t border-white/10">
            <button
              onClick={handleLogout}
              className={`w-full flex items-center ${sidebarOpen ? 'justify-start' : 'justify-center'} space-x-3 px-4 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all duration-300`}
            >
              <LogOut className="h-5 w-5" />
              {sidebarOpen && <span className="font-medium">Logout</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-black/20 backdrop-blur-xl border-b border-white/10 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                {modules.find(m => m.id === activeModule)?.name}
              </h2>
              <p className="text-white/60">Welcome back, {user?.username || 'User'}</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              <div className="flex items-center space-x-3 px-4 py-2 rounded-xl bg-white/10">
                <User className="h-8 w-8 p-1.5 rounded-full bg-gradient-to-r from-[#6b5f24] to-[#4a3f1a]" />
                <div>
                  <p className="font-medium">@{user?.username || 'username'}</p>
                  <p className="text-xs text-white/60 capitalize">{user?.accountType || 'Creator'}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Module Content */}
        <div className="p-6 dashboard-overview">
          {activeModule === 'explore' && <ExplorePage />}
          {activeModule === 'admin-categories' && <AdminCategoriesPage />}
          {activeModule === 'admin-todos' && <AdminTodosPage />}
          {activeModule === 'overview' && (
            <div className="widget-grid grid grid-cols-4 gap-6 auto-rows-min">
              {widgets.map((widget) => (
                <MicroInteractions key={widget.id} type="hover">
                  <DashboardWidget
                    id={widget.id}
                    title={widget.title}
                    icon={widget.icon}
                    size={widget.size}
                    onRemove={handleWidgetRemove}
                    onResize={handleWidgetResize}
                    content={<WidgetContent widgetId={widget.id} user={user} />}
                  />
                </MicroInteractions>
              ))}
              
              {/* Add Widget Button */}
              <MicroInteractions type="bounce">
                <button className="col-span-1 row-span-1 min-h-[150px] bg-white/5 backdrop-blur-sm border-2 border-dashed border-white/20 rounded-2xl flex flex-col items-center justify-center hover:bg-white/10 transition-all duration-300 group">
                  <div className="p-3 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors mb-3">
                    <Plus className="h-6 w-6 text-white/60 group-hover:text-white transition-colors" />
                  </div>
                  <span className="text-white/60 group-hover:text-white transition-colors">Add Widget</span>
                </button>
              </MicroInteractions>
            </div>
          )}
          {activeModule === 'content' && (
            <div className="relative">
              <ContentModule />
              <AnnotationLayer contentId="content-main" userId={user?.id || 'user1'} />
            </div>
          )}
          {activeModule === 'streaming' && <StreamingModule />}
          {activeModule === 'fanzfluence' && <FANZFluenceModule />}
          {activeModule === 'fanzversity' && <FANZVersityModule />}
          {activeModule === 'metaverse' && <MetaverseModule />}
          {activeModule === 'gamification' && <GamificationModule />}
          {activeModule === 'merchandise' && <MerchandiseModule />}
          {activeModule === 'messaging' && <MessagingModule />}
          {activeModule === 'analytics' && <AnalyticsModule />}
          {activeModule === 'payments' && <PaymentsModule />}
          {activeModule === 'settings' && <SettingsModule user={user} />}
        </div>
      </div>
    </div>
  );
}

// Widget Content Component
function WidgetContent({ widgetId, user }) {
  const content = {
    earnings: (
      <div>
        <p className="text-3xl font-bold text-white mb-2">$12,450</p>
        <p className="text-sm text-green-400">+15% from last month</p>
      </div>
    ),
    subscribers: (
      <div>
        <p className="text-3xl font-bold text-white mb-2">1,234</p>
        <p className="text-sm text-purple-400">+8% growth</p>
      </div>
    ),
    views: (
      <div>
        <p className="text-2xl font-bold text-white">45.2K</p>
        <p className="text-xs text-blue-400">+23%</p>
      </div>
    ),
    streaming: (
      <div>
        <p className="text-2xl font-bold text-white">142h</p>
        <p className="text-xs text-red-400">This month</p>
      </div>
    ),
    activity: (
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Heart className="h-4 w-4 text-pink-400" />
          <span className="text-sm text-white/80">New subscriber: @user123</span>
        </div>
        <div className="flex items-center space-x-2">
          <DollarSign className="h-4 w-4 text-green-400" />
          <span className="text-sm text-white/80">Tip received: $50</span>
        </div>
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-4 w-4 text-blue-400" />
          <span className="text-sm text-white/80">New message from @fan456</span>
        </div>
      </div>
    ),
    analytics: (
      <div>
        <div className="h-32 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center">
          <LineChart className="h-12 w-12 text-white/40" />
        </div>
        <p className="text-sm text-white/60 mt-2">Performance trending up</p>
      </div>
    )
  };
  
  return content[widgetId] || <div className="text-white/60">Widget content</div>;
}

// Dashboard Modules
function OverviewModule({ user }) {
  const stats = [
    { label: 'Total Earnings', value: '$12,450', change: '+15%', icon: <DollarSign />, color: 'from-green-500 to-emerald-500' },
    { label: 'Subscribers', value: '1,234', change: '+8%', icon: <Users />, color: 'from-purple-500 to-pink-500' },
    { label: 'Content Views', value: '45.2K', change: '+23%', icon: <Eye />, color: 'from-blue-500 to-cyan-500' },
    { label: 'Live Hours', value: '142', change: '+12%', icon: <Radio />, color: 'from-red-500 to-orange-500' }
  ];

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${stat.color} mb-4`}>
              {stat.icon}
            </div>
            <p className="text-white/60 text-sm mb-1">{stat.label}</p>
            <p className="text-3xl font-bold mb-2">{stat.value}</p>
            <p className={`text-sm ${stat.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
              {stat.change} from last month
            </p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
          <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button className="p-4 rounded-xl bg-white/10 hover:bg-white/20 transition-colors flex flex-col items-center space-y-2">
              <Video className="h-6 w-6 text-purple-400" />
              <span className="text-sm">Upload Content</span>
            </button>
            <button className="p-4 rounded-xl bg-white/10 hover:bg-white/20 transition-colors flex flex-col items-center space-y-2">
              <Radio className="h-6 w-6 text-red-400" />
              <span className="text-sm">Go Live</span>
            </button>
            <button className="p-4 rounded-xl bg-white/10 hover:bg-white/20 transition-colors flex flex-col items-center space-y-2">
              <MessageSquare className="h-6 w-6 text-blue-400" />
              <span className="text-sm">Check Messages</span>
            </button>
            <button className="p-4 rounded-xl bg-white/10 hover:bg-white/20 transition-colors flex flex-col items-center space-y-2">
              <LineChart className="h-6 w-6 text-green-400" />
              <span className="text-sm">View Analytics</span>
            </button>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
          <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <ActivityItem
              icon={<Heart className="h-4 w-4 text-pink-400" />}
              text="New subscriber: @username123"
              time="2 minutes ago"
            />
            <ActivityItem
              icon={<DollarSign className="h-4 w-4 text-green-400" />}
              text="Tip received: $50 from @supporter"
              time="15 minutes ago"
            />
            <ActivityItem
              icon={<MessageSquare className="h-4 w-4 text-blue-400" />}
              text="New message from @fan456"
              time="1 hour ago"
            />
            <ActivityItem
              icon={<Star className="h-4 w-4 text-yellow-400" />}
              text="Content rated 5 stars"
              time="3 hours ago"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ContentModule() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold">Content Management</h3>
        <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#6b5f24] to-[#4a3f1a] hover:from-[#7d6e2a] hover:to-[#5c4d1f] transition-all duration-300 flex items-center space-x-2">
          <Upload className="h-5 w-5" />
          <span>Upload Content</span>
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <ContentCard
          title="FanzFlixxx Videos"
          count="24"
          icon={<Play className="h-6 w-6" />}
          color="from-purple-500 to-pink-500"
        />
        <ContentCard
          title="Photo Sets"
          count="156"
          icon={<Image className="h-6 w-6" />}
          color="from-blue-500 to-cyan-500"
        />
        <ContentCard
          title="Scheduled Posts"
          count="8"
          icon={<Calendar className="h-6 w-6" />}
          color="from-green-500 to-emerald-500"
        />
      </div>

      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
        <h4 className="text-xl font-bold mb-4">Recent Uploads</h4>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500"></div>
                <div>
                  <p className="font-medium">Content Title {i}</p>
                  <p className="text-sm text-white/60">Uploaded 2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                  <Edit className="h-4 w-4" />
                </button>
                <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StreamingModule() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl p-8 text-center">
        <Radio className="h-16 w-16 mx-auto mb-4" />
        <h3 className="text-3xl font-bold mb-2">Go Live Now</h3>
        <p className="text-white/90 mb-6">Start streaming to your audience with WebRTC technology</p>
        <button className="px-8 py-3 rounded-xl bg-white text-orange-500 hover:bg-white/90 transition-all duration-300 font-semibold">
          Start Broadcast
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <StreamStat label="Current Viewers" value="0" icon={<Eye />} />
        <StreamStat label="Total Stream Time" value="142h" icon={<Clock />} />
        <StreamStat label="Stream Earnings" value="$3,450" icon={<DollarSign />} />
      </div>
    </div>
  );
}

function FANZFluenceModule() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-8">
        <h3 className="text-2xl font-bold mb-4">MLM & Affiliate Program</h3>
        <p className="text-white/90 mb-4">Earn commissions by referring new creators and fans</p>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white/20 rounded-xl p-4">
            <p className="text-3xl font-bold">12</p>
            <p className="text-sm">Direct Referrals</p>
          </div>
          <div className="bg-white/20 rounded-xl p-4">
            <p className="text-3xl font-bold">$850</p>
            <p className="text-sm">Monthly Commission</p>
          </div>
          <div className="bg-white/20 rounded-xl p-4">
            <p className="text-3xl font-bold">Level 3</p>
            <p className="text-sm">Network Tier</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FANZVersityModule() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-8">
        <School className="h-12 w-12 mb-4" />
        <h3 className="text-2xl font-bold mb-2">Creator Education Platform</h3>
        <p className="text-white/90">Learn, grow, and get certified</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <CourseCard title="Content Creation Mastery" progress={65} />
        <CourseCard title="Marketing & Promotion" progress={30} />
      </div>
    </div>
  );
}

function MetaverseModule() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl p-8 text-center">
        <Globe className="h-16 w-16 mx-auto mb-4" />
        <h3 className="text-3xl font-bold mb-2">Enter the FANZMetaVerse</h3>
        <p className="text-white/90 mb-6">VR/AR experiences and virtual worlds</p>
        <button className="px-8 py-3 rounded-xl bg-white text-purple-500 hover:bg-white/90 transition-all duration-300 font-semibold">
          Launch VR Experience
        </button>
      </div>
    </div>
  );
}

function GamificationModule() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold mb-2">Your Achievements</h3>
            <p className="text-white/90">Level 12 Creator</p>
          </div>
          <Trophy className="h-12 w-12" />
        </div>
        <div className="w-full bg-white/20 rounded-full h-4 mb-2">
          <div className="bg-white h-4 rounded-full" style={{ width: '75%' }}></div>
        </div>
        <p className="text-sm">750 / 1000 XP to Level 13</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <AchievementCard title="First Stream" icon={<Radio />} unlocked={true} />
        <AchievementCard title="100 Subscribers" icon={<Users />} unlocked={true} />
        <AchievementCard title="$10K Earned" icon={<DollarSign />} unlocked={false} />
      </div>
    </div>
  );
}

function MerchandiseModule() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold">Merchandise Store</h3>
        <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 transition-all duration-300 flex items-center space-x-2">
          <Package className="h-5 w-5" />
          <span>Add Product</span>
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <ProductCard name="Custom T-Shirt" price="$29.99" sales={45} />
        <ProductCard name="Signed Photo" price="$19.99" sales={123} />
        <ProductCard name="Premium Calendar" price="$39.99" sales={67} />
      </div>
    </div>
  );
}

function MessagingModule() {
  return (
    <div className="space-y-6">
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl h-[600px] flex">
        <div className="w-1/3 border-r border-white/10 p-4">
          <h3 className="text-xl font-bold mb-4">Conversations</h3>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
                  <div className="flex-1">
                    <p className="font-medium">User {i}</p>
                    <p className="text-sm text-white/60">Last message...</p>
                  </div>
                  {i === 1 && <div className="w-2 h-2 bg-red-500 rounded-full"></div>}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex-1 p-6 flex flex-col">
          <div className="flex-1 flex items-center justify-center text-white/40">
            Select a conversation to start messaging
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalyticsModule() {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-4 gap-6">
        <AnalyticCard label="Page Views" value="125.4K" trend="+15%" />
        <AnalyticCard label="Engagement Rate" value="4.2%" trend="+0.5%" />
        <AnalyticCard label="Avg. Session" value="12m 34s" trend="+2m" />
        <AnalyticCard label="Conversion" value="3.8%" trend="+0.3%" />
      </div>

      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
        <h3 className="text-xl font-bold mb-4">Performance Chart</h3>
        <div className="h-64 flex items-center justify-center text-white/40">
          <LineChart className="h-16 w-16" />
          <p className="ml-4">Chart visualization would go here</p>
        </div>
      </div>
    </div>
  );
}

function PaymentsModule() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-3xl font-bold">$12,450.00</h3>
            <p className="text-white/90">Available Balance</p>
          </div>
          <Wallet className="h-12 w-12" />
        </div>
        <button className="px-6 py-3 rounded-xl bg-white text-green-500 hover:bg-white/90 transition-all duration-300 font-semibold">
          Withdraw Funds
        </button>
      </div>

      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
        <h3 className="text-xl font-bold mb-4">Recent Transactions</h3>
        <div className="space-y-3">
          <TransactionItem type="income" amount="$250.00" description="Subscription payment" date="Today" />
          <TransactionItem type="income" amount="$50.00" description="Tip from @supporter" date="Yesterday" />
          <TransactionItem type="withdrawal" amount="$1,000.00" description="Bank transfer" date="3 days ago" />
        </div>
      </div>
    </div>
  );
}

function SettingsModule({ user }) {
  return (
    <div className="space-y-6">
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
        <h3 className="text-xl font-bold mb-6">Account Settings</h3>
        
        <div className="space-y-4">
          <SettingItem label="Username" value={`@${user?.username || 'username'}`} />
          <SettingItem label="Email" value={user?.email || 'email@example.com'} />
          <SettingItem label="Account Type" value={user?.accountType || 'Creator'} />
          <SettingItem label="Platform" value={user?.platform || 'BoyFanz'} />
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
        <h3 className="text-xl font-bold mb-6">Security Settings</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
            <div className="flex items-center space-x-3">
              <Shield className="h-5 w-5 text-green-400" />
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-white/60">Add an extra layer of security</p>
              </div>
            </div>
            <button className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors">
              Enable
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function Badge({ text, color }) {
  const colors = {
    blue: 'bg-blue-500',
    pink: 'bg-pink-500',
    green: 'bg-green-500'
  };
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-bold ${colors[color]} text-white`}>
      {text}
    </span>
  );
}

function SecurityFeature({ icon, title, description }) {
  return (
    <div className="flex items-start space-x-3">
      <div className="p-2 rounded-lg bg-white/10 text-[#6b5f24]">
        {icon}
      </div>
      <div>
        <h4 className="font-semibold mb-1">{title}</h4>
        <p className="text-sm text-white/60">{description}</p>
      </div>
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="bg-white/10 rounded-xl p-4 text-center">
      <p className="text-2xl font-bold mb-1">{value}</p>
      <p className="text-sm text-white/60">{label}</p>
    </div>
  );
}

function FooterLink({ href, text }) {
  return (
    <a href={href} className="block text-white/60 hover:text-white transition-colors text-sm">
      {text}
    </a>
  );
}

function SocialIcon({ icon }) {
  return (
    <a href="#" className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
      {icon}
    </a>
  );
}

function ActivityItem({ icon, text, time }) {
  return (
    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
      <div className="flex items-center space-x-3">
        {icon}
        <span className="text-sm">{text}</span>
      </div>
      <span className="text-xs text-white/40">{time}</span>
    </div>
  );
}

function ContentCard({ title, count, icon, color }) {
  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
      <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${color} mb-4`}>
        {icon}
      </div>
      <h4 className="text-lg font-bold mb-1">{title}</h4>
      <p className="text-3xl font-bold">{count}</p>
    </div>
  );
}

function StreamStat({ label, value, icon }) {
  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center">
      <div className="inline-flex p-3 rounded-xl bg-red-500/20 mb-3">
        {icon}
      </div>
      <p className="text-2xl font-bold mb-1">{value}</p>
      <p className="text-sm text-white/60">{label}</p>
    </div>
  );
}

function CourseCard({ title, progress }) {
  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
      <h4 className="text-lg font-bold mb-3">{title}</h4>
      <div className="w-full bg-white/20 rounded-full h-2 mb-2">
        <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
      </div>
      <p className="text-sm text-white/60">{progress}% Complete</p>
    </div>
  );
}

function AchievementCard({ title, icon, unlocked }) {
  return (
    <div className={`p-6 rounded-2xl border ${unlocked ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-white/5 border-white/10 opacity-50'}`}>
      <div className="flex justify-center mb-3">
        {icon}
      </div>
      <p className="text-center font-medium">{title}</p>
      {unlocked && <p className="text-center text-xs text-yellow-400 mt-1">Unlocked!</p>}
    </div>
  );
}

function ProductCard({ name, price, sales }) {
  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
      <div className="w-full h-32 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl mb-4"></div>
      <h4 className="font-bold mb-1">{name}</h4>
      <p className="text-2xl font-bold text-teal-400 mb-2">{price}</p>
      <p className="text-sm text-white/60">{sales} sales</p>
    </div>
  );
}

function AnalyticCard({ label, value, trend }) {
  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
      <p className="text-sm text-white/60 mb-1">{label}</p>
      <p className="text-2xl font-bold mb-1">{value}</p>
      <p className={`text-sm ${trend.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>{trend}</p>
    </div>
  );
}

function TransactionItem({ type, amount, description, date }) {
  return (
    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg ${type === 'income' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
          {type === 'income' ? <ArrowDown className="h-4 w-4 text-green-400" /> : <ArrowUp className="h-4 w-4 text-red-400" />}
        </div>
        <div>
          <p className="font-medium">{description}</p>
          <p className="text-sm text-white/60">{date}</p>
        </div>
      </div>
      <p className={`font-bold ${type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
        {type === 'income' ? '+' : '-'}{amount}
      </p>
    </div>
  );
}

function SettingItem({ label, value }) {
  return (
    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
      <span className="text-white/60">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export default App;