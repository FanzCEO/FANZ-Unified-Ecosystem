import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Zap,
  Users,
  DollarSign,
  TrendingUp,
  Trophy,
  Share2,
  Gift,
  Star,
  Award,
  ChevronRight,
  Copy,
  Check,
  Clock,
  Calendar,
  Target,
  Sparkles,
  Coins,
  Crown,
  Gem,
  Link2,
  UserPlus,
  ArrowUp,
  ArrowDown,
  Info,
  ChevronDown,
  ChevronUp,
  CheckCircle
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

interface FANZfluenceData {
  level: "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond";
  points: number;
  pointsToNextLevel: number;
  nextLevel: string;
  referralCode: string;
  referralLink: string;
  totalReferrals: number;
  activeReferrals: number;
  totalEarnings: number;
  monthlyEarnings: number;
  pendingEarnings: number;
  lifetimeEarnings: number;
  commissionRate: number;
  bonusRate: number;
  network: {
    tier1: number;
    tier2: number;
    tier3: number;
    totalNetwork: number;
  };
  referrals: {
    id: string;
    username: string;
    avatar: string;
    joinDate: string;
    status: "active" | "inactive";
    spent: number;
    earned: number;
    referrals: number;
  }[];
  earnings: {
    month: string;
    amount: number;
  }[];
  recentActivity: {
    id: string;
    type: "referral" | "commission" | "bonus" | "milestone";
    description: string;
    amount?: number;
    timestamp: string;
  }[];
  milestones: {
    id: string;
    name: string;
    description: string;
    requirement: number;
    current: number;
    reward: string;
    completed: boolean;
  }[];
}

const LEVEL_COLORS: Record<string, string> = {
  Bronze: "#cd7f32",
  Silver: "#c0c0c0",
  Gold: "#ffd700",
  Platinum: "#e5e4e2",
  Diamond: "#b9f2ff"
};

const COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'];

export default function FANZfluence() {
  const { user } = useAuth() as { user: User | undefined };
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showNetworkDetails, setShowNetworkDetails] = useState(false);

  // Fetch FANZfluence data
  const { data, isLoading } = useQuery<FANZfluenceData>({
    queryKey: ["/api/fanzfluence"],
    enabled: !!user,
  });

  // Mock data for demonstration
  const mockData: FANZfluenceData = data || {
    level: "Gold",
    points: 4250,
    pointsToNextLevel: 750,
    nextLevel: "Platinum",
    referralCode: "FANZ2024",
    referralLink: "https://fanslab.com/ref/FANZ2024",
    totalReferrals: 23,
    activeReferrals: 18,
    totalEarnings: 2345.67,
    monthlyEarnings: 456.78,
    pendingEarnings: 123.45,
    lifetimeEarnings: 8901.23,
    commissionRate: 10,
    bonusRate: 5,
    network: {
      tier1: 23,
      tier2: 67,
      tier3: 145,
      totalNetwork: 235
    },
    referrals: [
      {
        id: "1",
        username: "alexsmith",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
        joinDate: "2024-01-15",
        status: "active",
        spent: 234.56,
        earned: 23.45,
        referrals: 5
      },
      {
        id: "2",
        username: "sarahjones",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
        joinDate: "2024-01-20",
        status: "active",
        spent: 567.89,
        earned: 56.78,
        referrals: 8
      },
      {
        id: "3",
        username: "mikebrown",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
        joinDate: "2024-02-01",
        status: "inactive",
        spent: 89.01,
        earned: 8.90,
        referrals: 2
      }
    ],
    earnings: [
      { month: "Jan", amount: 234.56 },
      { month: "Feb", amount: 345.67 },
      { month: "Mar", amount: 456.78 },
      { month: "Apr", amount: 567.89 },
      { month: "May", amount: 432.10 },
      { month: "Jun", amount: 456.78 }
    ],
    recentActivity: [
      {
        id: "1",
        type: "referral",
        description: "New referral: alexsmith joined",
        timestamp: "2 hours ago"
      },
      {
        id: "2",
        type: "commission",
        description: "Commission earned from sarahjones",
        amount: 12.34,
        timestamp: "1 day ago"
      },
      {
        id: "3",
        type: "bonus",
        description: "Weekly performance bonus",
        amount: 50.00,
        timestamp: "3 days ago"
      },
      {
        id: "4",
        type: "milestone",
        description: "Achieved 20 active referrals",
        amount: 100.00,
        timestamp: "1 week ago"
      }
    ],
    milestones: [
      {
        id: "1",
        name: "First Steps",
        description: "Refer your first user",
        requirement: 1,
        current: 23,
        reward: "$10 bonus",
        completed: true
      },
      {
        id: "2",
        name: "Team Builder",
        description: "Build a network of 10 referrals",
        requirement: 10,
        current: 23,
        reward: "$50 bonus",
        completed: true
      },
      {
        id: "3",
        name: "Network Pro",
        description: "Reach 50 total referrals",
        requirement: 50,
        current: 23,
        reward: "$200 bonus + Platinum status",
        completed: false
      },
      {
        id: "4",
        name: "Empire Builder",
        description: "Build a network of 100+ users",
        requirement: 100,
        current: 235,
        reward: "$500 bonus + Diamond status",
        completed: true
      }
    ]
  };

  const copyToClipboard = (text: string, type: "code" | "link") => {
    navigator.clipboard.writeText(text);
    if (type === "code") {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
    toast({
      title: "Copied to clipboard",
      description: `Your referral ${type} has been copied.`,
    });
  };

  const getLevelIcon = (level: string) => {
    switch(level) {
      case "Bronze": return <Coins className="w-5 h-5" />;
      case "Silver": return <Star className="w-5 h-5" />;
      case "Gold": return <Crown className="w-5 h-5" />;
      case "Platinum": return <Gem className="w-5 h-5" />;
      case "Diamond": return <Sparkles className="w-5 h-5" />;
      default: return <Zap className="w-5 h-5" />;
    }
  };

  const networkData = [
    { name: "Tier 1", value: mockData.network.tier1, color: "#8b5cf6" },
    { name: "Tier 2", value: mockData.network.tier2, color: "#ec4899" },
    { name: "Tier 3", value: mockData.network.tier3, color: "#3b82f6" }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center" data-testid="text-fanzfluence-title">
                <Zap className="w-8 h-8 mr-3 text-yellow-500" />
                FANZfluence Program
              </h1>
              <p className="text-gray-400">Earn rewards by growing the community</p>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2">
                <span style={{ color: LEVEL_COLORS[mockData.level] }}>
                  {getLevelIcon(mockData.level)}
                </span>
                <span className="text-2xl font-bold" style={{ color: LEVEL_COLORS[mockData.level] }}>
                  {mockData.level}
                </span>
              </div>
              <p className="text-sm text-gray-400 mt-1">{mockData.points} points</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-400">Total Earnings</CardTitle>
                <DollarSign className="w-4 h-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white" data-testid="text-total-earnings">
                ${mockData.totalEarnings.toLocaleString()}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                +${mockData.monthlyEarnings.toFixed(2)} this month
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-400">Network Size</CardTitle>
                <Users className="w-4 h-4 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white" data-testid="text-network-size">
                {mockData.network.totalNetwork}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {mockData.activeReferrals} active
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-400">Commission Rate</CardTitle>
                <TrendingUp className="w-4 h-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white" data-testid="text-commission-rate">
                {mockData.commissionRate}%
              </div>
              <p className="text-xs text-gray-400 mt-1">
                +{mockData.bonusRate}% bonus
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-400">Pending</CardTitle>
                <Clock className="w-4 h-4 text-yellow-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white" data-testid="text-pending-earnings">
                ${mockData.pendingEarnings.toFixed(2)}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Next payout in 5 days
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Referral Section */}
        <Card className="bg-gray-800 border-gray-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Your Referral Tools</CardTitle>
            <CardDescription className="text-gray-400">
              Share your unique referral code or link to earn commissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm font-medium text-gray-400 mb-2 block">
                  Referral Code
                </Label>
                <div className="flex space-x-2">
                  <Input
                    value={mockData.referralCode}
                    readOnly
                    className="bg-gray-700 border-gray-600 text-white font-mono"
                    data-testid="input-referral-code"
                  />
                  <Button
                    onClick={() => copyToClipboard(mockData.referralCode, "code")}
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    data-testid="button-copy-code"
                  >
                    {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-400 mb-2 block">
                  Referral Link
                </Label>
                <div className="flex space-x-2">
                  <Input
                    value={mockData.referralLink}
                    readOnly
                    className="bg-gray-700 border-gray-600 text-white text-sm"
                    data-testid="input-referral-link"
                  />
                  <Button
                    onClick={() => copyToClipboard(mockData.referralLink, "link")}
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    data-testid="button-copy-link"
                  >
                    {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex space-x-4 mt-4">
              <Button className="bg-gradient-to-r from-primary to-secondary hover:from-purple-600 hover:to-pink-600">
                <Share2 className="w-4 h-4 mr-2" />
                Share on Social
              </Button>
              <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                <UserPlus className="w-4 h-4 mr-2" />
                Invite via Email
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-gray-800 border border-gray-700">
            <TabsTrigger value="overview" data-testid="tab-overview">
              <TrendingUp className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="referrals" data-testid="tab-referrals">
              <Users className="w-4 h-4 mr-2" />
              Referrals
            </TabsTrigger>
            <TabsTrigger value="earnings" data-testid="tab-earnings">
              <DollarSign className="w-4 h-4 mr-2" />
              Earnings
            </TabsTrigger>
            <TabsTrigger value="milestones" data-testid="tab-milestones">
              <Trophy className="w-4 h-4 mr-2" />
              Milestones
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Level Progress */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Level Progress</CardTitle>
                  <CardDescription className="text-gray-400">
                    Your journey to {mockData.nextLevel}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span style={{ color: LEVEL_COLORS[mockData.level] }}>
                          {getLevelIcon(mockData.level)}
                        </span>
                        <span className="text-xl font-bold" style={{ color: LEVEL_COLORS[mockData.level] }}>
                          {mockData.level}
                        </span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                      <div className="flex items-center space-x-3">
                        <span style={{ color: LEVEL_COLORS[mockData.nextLevel] }}>
                          {getLevelIcon(mockData.nextLevel)}
                        </span>
                        <span className="text-xl font-bold" style={{ color: LEVEL_COLORS[mockData.nextLevel] }}>
                          {mockData.nextLevel}
                        </span>
                      </div>
                    </div>
                    <Progress 
                      value={((mockData.points) / (mockData.points + mockData.pointsToNextLevel)) * 100} 
                      className="h-3"
                    />
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">{mockData.points} points</span>
                      <span className="text-gray-400">{mockData.pointsToNextLevel} to go</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Network Breakdown */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Network Breakdown</CardTitle>
                  <CardDescription className="text-gray-400">
                    Your multi-tier network
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={networkData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {networkData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
                        labelStyle={{ color: '#9ca3af' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    {networkData.map((tier) => (
                      <div key={tier.name} className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: tier.color }} />
                          <span className="text-xs text-gray-400">{tier.name}</span>
                        </div>
                        <p className="text-lg font-bold text-white">{tier.value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Earnings Chart */}
              <Card className="bg-gray-800 border-gray-700 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-white">Earnings Trend</CardTitle>
                  <CardDescription className="text-gray-400">
                    Monthly commission earnings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={mockData.earnings}>
                      <defs>
                        <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
                        labelStyle={{ color: '#9ca3af' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="amount" 
                        stroke="#8b5cf6" 
                        fillOpacity={1} 
                        fill="url(#colorEarnings)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Recent Activity</CardTitle>
                <CardDescription className="text-gray-400">
                  Your latest FANZfluence updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-4">
                    {mockData.recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-700 rounded-lg">
                        <div className={`mt-1 ${
                          activity.type === "referral" ? "text-purple-500" :
                          activity.type === "commission" ? "text-green-500" :
                          activity.type === "bonus" ? "text-yellow-500" :
                          "text-blue-500"
                        }`}>
                          {activity.type === "referral" ? <UserPlus className="w-4 h-4" /> :
                           activity.type === "commission" ? <DollarSign className="w-4 h-4" /> :
                           activity.type === "bonus" ? <Gift className="w-4 h-4" /> :
                           <Trophy className="w-4 h-4" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-white">{activity.description}</p>
                          {activity.amount && (
                            <p className="text-green-500 font-semibold text-sm mt-1">
                              +${activity.amount.toFixed(2)}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">{activity.timestamp}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Referrals Tab */}
          <TabsContent value="referrals" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Your Referrals</CardTitle>
                <CardDescription className="text-gray-400">
                  Users who joined using your referral
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockData.referrals.map((referral) => (
                    <div key={referral.id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarImage src={referral.avatar} alt={referral.username} />
                          <AvatarFallback>{referral.username[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-white">@{referral.username}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1">
                            <span>Joined {new Date(referral.joinDate).toLocaleDateString()}</span>
                            <Badge variant={referral.status === "active" ? "default" : "secondary"}>
                              {referral.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-green-500 font-semibold">+${referral.earned.toFixed(2)}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {referral.referrals} referrals
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Earnings Tab */}
          <TabsContent value="earnings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Earnings Summary</CardTitle>
                  <CardDescription className="text-gray-400">
                    Your commission breakdown
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Lifetime Earnings</span>
                      <span className="text-2xl font-bold text-white">
                        ${mockData.lifetimeEarnings.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Available Balance</span>
                      <span className="text-xl font-semibold text-green-500">
                        ${mockData.totalEarnings.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Pending Earnings</span>
                      <span className="text-lg text-yellow-500">
                        ${mockData.pendingEarnings.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">This Month</span>
                      <span className="text-lg text-white">
                        ${mockData.monthlyEarnings.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <Button className="w-full mt-6 bg-gradient-to-r from-primary to-secondary hover:from-purple-600 hover:to-pink-600">
                    Request Payout
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Commission Structure</CardTitle>
                  <CardDescription className="text-gray-400">
                    Your earning rates per tier
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-3 bg-gray-700 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Tier 1 (Direct)</span>
                        <span className="text-white font-semibold">{mockData.commissionRate}%</span>
                      </div>
                      <Progress value={mockData.commissionRate} className="h-2" />
                    </div>
                    <div className="p-3 bg-gray-700 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Tier 2</span>
                        <span className="text-white font-semibold">{mockData.bonusRate}%</span>
                      </div>
                      <Progress value={mockData.bonusRate} className="h-2" />
                    </div>
                    <div className="p-3 bg-gray-700 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Tier 3</span>
                        <span className="text-white font-semibold">2%</span>
                      </div>
                      <Progress value={2} className="h-2" />
                    </div>
                    <div className="p-3 bg-purple-900/20 border border-purple-600 rounded-lg">
                      <p className="text-xs text-purple-400">
                        <Info className="w-3 h-3 inline mr-1" />
                        Higher levels unlock better commission rates
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Milestones Tab */}
          <TabsContent value="milestones" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Achievements & Milestones</CardTitle>
                <CardDescription className="text-gray-400">
                  Complete goals to earn rewards
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mockData.milestones.map((milestone) => (
                    <div
                      key={milestone.id}
                      className={`p-4 rounded-lg ${
                        milestone.completed ? "bg-green-900/20 border border-green-600" : "bg-gray-700"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          {milestone.completed ? (
                            <CheckCircle className="w-6 h-6 text-green-500" />
                          ) : (
                            <Target className="w-6 h-6 text-gray-400" />
                          )}
                          <div>
                            <p className="font-semibold text-white">{milestone.name}</p>
                            <p className="text-sm text-gray-400 mt-1">{milestone.description}</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Progress</span>
                          <span className="text-white">
                            {Math.min(milestone.current, milestone.requirement)}/{milestone.requirement}
                          </span>
                        </div>
                        <Progress 
                          value={(Math.min(milestone.current, milestone.requirement) / milestone.requirement) * 100} 
                          className="h-2"
                        />
                        <div className="flex items-center justify-between mt-2">
                          <Badge variant={milestone.completed ? "default" : "secondary"}>
                            {milestone.completed ? "Completed" : "In Progress"}
                          </Badge>
                          <span className="text-sm text-yellow-500">
                            <Gift className="w-3 h-3 inline mr-1" />
                            {milestone.reward}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}