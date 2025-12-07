import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Eye,
  MessageSquare
} from "lucide-react";

interface Analytics {
  totalEarnings: number;
  monthlyEarnings: number;
  subscriberCount: number;
  totalPosts: number;
  totalLikes: number;
}

interface EarningsOverviewProps {
  analytics?: Analytics;
}

export default function EarningsOverview({ analytics }: EarningsOverviewProps) {
  // Mock recent messages for demonstration
  const recentMessages = [
    {
      id: "1",
      sender: "Mike Johnson",
      preview: "Hey! Love your latest content...",
      time: "2m",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face"
    },
    {
      id: "2", 
      sender: "Alex Rivera",
      preview: "Thank you for the amazing show!",
      time: "15m",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
    },
    {
      id: "3",
      sender: "Sarah Wilson", 
      preview: "When is your next live stream?",
      time: "1h",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b5cb229e?w=40&h=40&fit=crop&crop=face"
    }
  ];

  const topSupporters = [
    {
      id: "1",
      name: "Alex Rivera",
      tier: "VIP Member",
      total: 458,
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face"
    },
    {
      id: "2",
      name: "Mike Johnson", 
      tier: "Premium Fanz",
      total: 342,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face"
    },
    {
      id: "3",
      name: "David Chen",
      tier: "Supporter",
      total: 189,
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=32&h=32&fit=crop&crop=face"
    }
  ];

  // Calculate earnings breakdown
  const subscriptionEarnings = Math.round((analytics?.monthlyEarnings || 0) * 0.65);
  const tipEarnings = Math.round((analytics?.monthlyEarnings || 0) * 0.20);
  const ppvEarnings = Math.round((analytics?.monthlyEarnings || 0) * 0.13);
  const affiliateEarnings = Math.round((analytics?.monthlyEarnings || 0) * 0.02);

  return (
    <div className="p-6 space-y-6">
      {/* Earnings Overview */}
      <Card className="bg-gradient-to-br from-primary to-secondary border-0">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">Monthly Earnings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-white">
            <div className="flex justify-between">
              <span>Subscriptions</span>
              <span className="font-semibold" data-testid="text-earnings-subscriptions">
                ${subscriptionEarnings.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Tips</span>
              <span className="font-semibold" data-testid="text-earnings-tips">
                ${tipEarnings.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>PPV Content</span>
              <span className="font-semibold" data-testid="text-earnings-ppv">
                ${ppvEarnings.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Affiliate</span>
              <span className="font-semibold" data-testid="text-earnings-affiliate">
                ${affiliateEarnings.toFixed(2)}
              </span>
            </div>
            <div className="border-t border-purple-400 pt-3 flex justify-between text-xl font-bold">
              <span>Total</span>
              <span data-testid="text-earnings-total">
                ${(analytics?.monthlyEarnings || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Messages */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-white">Recent Messages</CardTitle>
            <Badge variant="secondary" className="bg-secondary text-white" data-testid="badge-unread-messages">
              12
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentMessages.map((message) => (
              <div 
                key={message.id}
                className="flex items-center space-x-3 p-3 bg-slate rounded-lg hover:bg-gray-700 cursor-pointer transition-colors"
                data-testid={`message-item-${message.id}`}
              >
                <img 
                  src={message.avatar} 
                  alt={message.sender}
                  className="w-10 h-10 rounded-full object-cover" 
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-white" data-testid={`text-message-sender-${message.id}`}>
                    {message.sender}
                  </p>
                  <p className="text-xs text-gray-400 truncate" data-testid={`text-message-preview-${message.id}`}>
                    {message.preview}
                  </p>
                </div>
                <div className="text-xs text-gray-400" data-testid={`text-message-time-${message.id}`}>
                  {message.time}
                </div>
              </div>
            ))}
          </div>
          <Button 
            variant="ghost" 
            className="w-full mt-4 text-primary hover:text-purple-300 text-sm font-semibold transition-colors"
            data-testid="button-view-all-messages"
          >
            View All Messages
          </Button>
        </CardContent>
      </Card>

      {/* Top Supporters */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">Top Supporters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topSupporters.map((supporter) => (
              <div 
                key={supporter.id}
                className="flex items-center justify-between"
                data-testid={`supporter-item-${supporter.id}`}
              >
                <div className="flex items-center space-x-3">
                  <img 
                    src={supporter.avatar} 
                    alt={supporter.name}
                    className="w-8 h-8 rounded-full object-cover" 
                  />
                  <div>
                    <p className="text-sm font-semibold text-white" data-testid={`text-supporter-name-${supporter.id}`}>
                      {supporter.name}
                    </p>
                    <p className="text-xs text-gray-400" data-testid={`text-supporter-tier-${supporter.id}`}>
                      {supporter.tier}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-accent" data-testid={`text-supporter-total-${supporter.id}`}>
                    ${supporter.total}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
