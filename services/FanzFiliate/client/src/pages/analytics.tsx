import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, MousePointer, DollarSign, Target, BarChart3 } from "lucide-react";
import type { DashboardStats } from "@/types";

export default function Analytics() {
  const [timeRange, setTimeRange] = useState("30");
  
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/analytics/affiliate/aff-1", { days: timeRange }],
  });

  const performanceData = [
    {
      date: "Dec 15",
      clicks: 245,
      conversions: 8,
      earnings: 360.00,
    },
    {
      date: "Dec 14",
      clicks: 189,
      conversions: 5,
      earnings: 175.00,
    },
    {
      date: "Dec 13",
      clicks: 156,
      conversions: 7,
      earnings: 157.50,
    },
    {
      date: "Dec 12",
      clicks: 234,
      conversions: 6,
      earnings: 270.00,
    },
    {
      date: "Dec 11",
      clicks: 198,
      conversions: 4,
      earnings: 140.00,
    },
  ];

  const topOffers = [
    {
      name: "Premium Dating Platform",
      clicks: 1245,
      conversions: 38,
      conversionRate: 3.05,
      earnings: 1710.00,
    },
    {
      name: "Cam Site Membership",
      clicks: 987,
      conversions: 28,
      earnings: 980.00,
      conversionRate: 2.84,
    },
    {
      name: "Content Creator Tools",
      clicks: 654,
      conversions: 27,
      earnings: 607.50,
      conversionRate: 4.13,
    },
  ];

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded mb-2"></div>
          <div className="h-4 bg-muted rounded mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="analytics-page">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics</h2>
          <p className="text-muted-foreground">Detailed performance insights and trends</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40 bg-secondary border-border" data-testid="time-range-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="gradient-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Revenue</p>
                <p className="text-2xl font-bold neon-text">
                  ${stats ? stats.totalEarnings.toFixed(2) : "0.00"}
                </p>
                <div className="flex items-center gap-1 text-xs text-accent">
                  <TrendingUp className="w-3 h-3" />
                  +12.5%
                </div>
              </div>
              <DollarSign className="w-8 h-8 text-primary opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Click Volume</p>
                <p className="text-2xl font-bold">
                  {stats ? stats.totalClicks.toLocaleString() : "0"}
                </p>
                <div className="flex items-center gap-1 text-xs text-accent">
                  <TrendingUp className="w-3 h-3" />
                  +8.3%
                </div>
              </div>
              <MousePointer className="w-8 h-8 text-chart-2 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Conversion Rate</p>
                <p className="text-2xl font-bold">
                  {stats ? stats.conversionRate.toFixed(2) : "0.00"}%
                </p>
                <div className="flex items-center gap-1 text-xs text-chart-5">
                  <TrendingDown className="w-3 h-3" />
                  -0.2%
                </div>
              </div>
              <Target className="w-8 h-8 text-chart-3 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">EPC</p>
                <p className="text-2xl font-bold">
                  ${stats ? stats.epc.toFixed(3) : "0.000"}
                </p>
                <div className="flex items-center gap-1 text-xs text-accent">
                  <TrendingUp className="w-3 h-3" />
                  +$0.012
                </div>
              </div>
              <BarChart3 className="w-8 h-8 text-chart-4 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart */}
      <Card className="gradient-card border-border">
        <CardHeader>
          <CardTitle>Performance Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end gap-4 px-4">
            {performanceData.map((day, index) => (
              <div key={day.date} className="flex-1 flex flex-col items-center">
                <div className="relative w-full bg-secondary rounded-t-lg overflow-hidden mb-2" style={{ height: '200px' }}>
                  <div 
                    className="absolute bottom-0 w-full bg-primary rounded-t-lg transition-all duration-500"
                    style={{ height: `${(day.clicks / 300) * 100}%` }}
                  ></div>
                  <div 
                    className="absolute bottom-0 w-full bg-accent rounded-t-lg transition-all duration-500 opacity-70"
                    style={{ height: `${(day.conversions / 10) * 100}%` }}
                  ></div>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">{day.date}</p>
                  <p className="text-xs font-medium">{day.clicks}</p>
                  <p className="text-xs text-accent">{day.conversions} conv</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary rounded"></div>
              <span className="text-sm text-muted-foreground">Clicks</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-accent rounded"></div>
              <span className="text-sm text-muted-foreground">Conversions</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Offers */}
      <Card className="gradient-card border-border">
        <CardHeader>
          <CardTitle>Top Performing Offers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Offer</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Clicks</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Conversions</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">CR</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Earnings</th>
                </tr>
              </thead>
              <tbody>
                {topOffers.map((offer, index) => (
                  <tr key={index} className="border-b border-border data-row" data-testid={`top-offer-${index}`}>
                    <td className="py-3 px-4 font-medium">{offer.name}</td>
                    <td className="py-3 px-4">{offer.clicks.toLocaleString()}</td>
                    <td className="py-3 px-4">{offer.conversions}</td>
                    <td className="py-3 px-4 text-accent">{offer.conversionRate.toFixed(2)}%</td>
                    <td className="py-3 px-4 font-medium text-primary">${offer.earnings.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
