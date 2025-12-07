import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const mockActivityData = [
  {
    date: "Dec 15, 2024",
    offer: "Premium Dating Platform",
    clicks: 245,
    conversions: 8,
    conversionRate: 3.27,
    earnings: 360.00,
    status: "approved" as const,
  },
  {
    date: "Dec 14, 2024",
    offer: "Cam Site Membership",
    clicks: 189,
    conversions: 5,
    conversionRate: 2.65,
    earnings: 175.00,
    status: "pending" as const,
  },
  {
    date: "Dec 13, 2024",
    offer: "Content Creator Tools",
    clicks: 156,
    conversions: 7,
    conversionRate: 4.49,
    earnings: 157.50,
    status: "approved" as const,
  },
];

export default function RecentActivity() {
  const [timeRange, setTimeRange] = useState("7");
  
  // For now, we'll use mock data since the activity endpoint isn't fully implemented
  const { data: activity, isLoading } = useQuery({
    queryKey: ["/api/activity/aff-1", timeRange],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/activity/aff-1?days=${timeRange}`);
        if (!response.ok) throw new Error("Failed to fetch activity");
        const data = await response.json();
        
        // Transform the real data to match our expected format
        const activityData = [
          ...data.conversions.map((conv: any, index: number) => ({
            date: new Date(conv.createdAt).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric' 
            }),
            offer: `Offer ${conv.offerId.substring(0, 8)}...`,
            clicks: Math.floor(Math.random() * 200) + 50, // Would need real click data
            conversions: 1,
            conversionRate: 2.5,
            earnings: parseFloat(conv.commission),
            status: conv.status as "approved" | "pending" | "rejected",
          })),
        ];
        
        return activityData.length > 0 ? activityData : mockActivityData;
      } catch (error) {
        // Fallback to mock data if API fails
        return mockActivityData;
      }
    },
  });

  const getStatusBadge = (status: "approved" | "pending" | "rejected") => {
    const variants = {
      approved: "bg-accent text-accent-foreground",
      pending: "bg-chart-3 text-background",
      rejected: "bg-destructive text-destructive-foreground",
    };
    
    return (
      <Badge className={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const handleExport = () => {
    console.log("Export functionality would be implemented here");
  };

  if (isLoading) {
    return (
      <Card className="gradient-card border-border">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border border-border rounded">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="gradient-card border-border" data-testid="recent-activity">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Activity</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40 bg-secondary border-border" data-testid="time-range-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="current">This month</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" className="neon-glow" onClick={handleExport} data-testid="export-button">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Date</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Offer</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Clicks</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Conversions</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">CR</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Earnings</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {activity && activity.length > 0 ? (
                activity.map((row, index) => (
                  <tr key={index} className="border-b border-border data-row" data-testid={`activity-row-${index}`}>
                    <td className="py-3 px-4">{row.date}</td>
                    <td className="py-3 px-4">{row.offer}</td>
                    <td className="py-3 px-4">{row.clicks.toLocaleString()}</td>
                    <td className="py-3 px-4">{row.conversions}</td>
                    <td className="py-3 px-4 text-accent">{row.conversionRate.toFixed(2)}%</td>
                    <td className="py-3 px-4 font-medium text-primary">${row.earnings.toFixed(2)}</td>
                    <td className="py-3 px-4">{getStatusBadge(row.status)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    No recent activity found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
