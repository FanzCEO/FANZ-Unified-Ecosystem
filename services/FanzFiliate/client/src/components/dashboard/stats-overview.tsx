import { DollarSign, MousePointer, Handshake, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardStats } from "@/types";

const statCards = [
  {
    title: "Total Earnings (100% Yours)",
    key: "totalEarnings" as keyof DashboardStats,
    icon: DollarSign,
    format: (value: number) => `$${value.toFixed(2)}`,
    change: "0% platform fees • You keep every dollar",
    changeType: "positive",
    bgColor: "bg-primary/20",
    iconColor: "text-primary",
  },
  {
    title: "Total Clicks",
    key: "totalClicks" as keyof DashboardStats,
    icon: MousePointer,
    format: (value: number) => value.toLocaleString(),
    change: "+8.3% from last month",
    changeType: "positive",
    bgColor: "bg-chart-2/20",
    iconColor: "text-chart-2",
  },
  {
    title: "Conversions",
    key: "totalConversions" as keyof DashboardStats,
    icon: Handshake,
    format: (value: number) => value.toLocaleString(),
    change: (stats: DashboardStats) => `${stats.conversionRate.toFixed(2)}% conversion rate`,
    changeType: "neutral",
    bgColor: "bg-chart-3/20",
    iconColor: "text-chart-3",
  },
  {
    title: "EPC",
    key: "epc" as keyof DashboardStats,
    icon: TrendingUp,
    format: (value: number) => `$${value.toFixed(2)}`,
    change: "Earnings per click",
    changeType: "neutral",
    bgColor: "bg-chart-4/20",
    iconColor: "text-chart-4",
  },
];

export default function StatsOverview() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/analytics/affiliate/aff-1"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="gradient-card border-border">
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Unable to load dashboard statistics
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-testid="stats-overview">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        const value = stats[stat.key] as number;
        const change = typeof stat.change === "function" ? stat.change(stats) : stat.change;
        
        return (
          <Card key={stat.title} className="gradient-card border-border hover-neon" data-testid={`stat-${stat.key}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">{stat.title}</p>
                  <p className={`text-2xl font-bold ${stat.key === 'totalEarnings' ? 'neon-text' : ''}`}>
                    {stat.format(value)}
                  </p>
                  <p className="text-xs text-accent">{change}</p>
                </div>
                <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
