import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, Users, Eye, Clock, TrendingUp, TrendingDown } from "lucide-react";

interface StatsCardsProps {
  userRole: string;
  mediaAssets: any[];
  payoutAccounts: any[];
}

export default function StatsCards({ userRole, mediaAssets, payoutAccounts }: StatsCardsProps) {
  const isCreator = userRole === "creator" || userRole === "admin";

  // Calculate stats from actual data
  const totalPosts = mediaAssets.length;
  const premiumPosts = mediaAssets.filter(asset => asset.isPremium).length;
  const approvedPosts = mediaAssets.filter(asset => asset.status === "approved").length;
  const pendingPosts = mediaAssets.filter(asset => asset.status === "uploaded").length;

  // Creator stats
  const creatorStats = [
    {
      title: "Total Earnings",
      value: "$12,847",
      icon: DollarSign,
      iconColor: "text-df-gold",
      bgColor: "bg-df-gold bg-opacity-20",
      change: "+12%",
      changeType: "positive" as const,
      testId: "stat-total-earnings"
    },
    {
      title: "Active Subscribers",
      value: "1,247",
      icon: Users,
      iconColor: "text-df-cyan",
      bgColor: "bg-df-cyan bg-opacity-20",
      change: "+47 new",
      changeType: "positive" as const,
      testId: "stat-subscribers"
    },
    {
      title: "Content Views",
      value: "89,432",
      icon: Eye,
      iconColor: "text-df-snow",
      bgColor: "bg-df-steel bg-opacity-20",
      change: "+23%",
      changeType: "positive" as const,
      testId: "stat-views"
    },
    {
      title: "Pending Payout",
      value: "$2,134",
      icon: Clock,
      iconColor: "text-df-gold",
      bgColor: "bg-df-gold bg-opacity-20",
      change: "Friday",
      changeType: "neutral" as const,
      testId: "stat-pending-payout"
    },
  ];

  // Fan stats
  const fanStats = [
    {
      title: "Subscriptions",
      value: "12",
      icon: Users,
      iconColor: "text-df-cyan",
      bgColor: "bg-df-cyan bg-opacity-20",
      change: "+2 this month",
      changeType: "positive" as const,
      testId: "stat-subscriptions"
    },
    {
      title: "Total Spent",
      value: "$487",
      icon: DollarSign,
      iconColor: "text-df-gold",
      bgColor: "bg-df-gold bg-opacity-20",
      change: "+$89 this month",
      changeType: "neutral" as const,
      testId: "stat-total-spent"
    },
    {
      title: "Content Viewed",
      value: "1,234",
      icon: Eye,
      iconColor: "text-df-snow",
      bgColor: "bg-df-steel bg-opacity-20",
      change: "+156 this week",
      changeType: "positive" as const,
      testId: "stat-content-viewed"
    },
    {
      title: "Messages Sent",
      value: "89",
      icon: Clock,
      iconColor: "text-df-cyan",
      bgColor: "bg-df-cyan bg-opacity-20",
      change: "+12 this week",
      changeType: "positive" as const,
      testId: "stat-messages"
    },
  ];

  const stats = isCreator ? creatorStats : fanStats;

  const getChangeIcon = (changeType: "positive" | "negative" | "neutral") => {
    if (changeType === "positive") {
      return <TrendingUp className="h-3 w-3 text-green-400" />;
    } else if (changeType === "negative") {
      return <TrendingDown className="h-3 w-3 text-red-400" />;
    }
    return null;
  };

  const getChangeColor = (changeType: "positive" | "negative" | "neutral") => {
    if (changeType === "positive") return "text-green-400";
    if (changeType === "negative") return "text-red-400";
    return "text-df-cyan";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <Card key={index} className="card-df shadow-inner-glow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-df-fog text-sm font-medium">{stat.title}</p>
                <p 
                  className={`text-3xl font-display font-bold ${stat.iconColor}`}
                  data-testid={stat.testId}
                >
                  {stat.value}
                </p>
              </div>
              <div className={`${stat.bgColor} p-3 rounded-full`}>
                <stat.icon className={`${stat.iconColor} text-xl`} />
              </div>
            </div>
            <div className={`flex items-center space-x-1 mt-2 ${getChangeColor(stat.changeType)}`}>
              {getChangeIcon(stat.changeType)}
              <span className="text-sm">{stat.change}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
