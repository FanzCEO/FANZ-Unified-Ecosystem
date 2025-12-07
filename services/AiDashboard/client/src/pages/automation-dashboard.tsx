import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Rocket, 
  Users, 
  TrendingUp, 
  Brain,
  Play,
  Pause,
  Settings,
  BarChart3,
  Mail,
  Calendar,
  Target
} from "lucide-react";

export default function AutomationDashboard() {
  const campaigns = [
    {
      name: "Summer Product Launch",
      status: "Active",
      statusColor: "bg-accent",
      daysAgo: 5,
      stats: {
        emails: "1,247",
        opens: "34.2%",
        clicks: "8.7%",
        conversions: "47"
      }
    },
    {
      name: "Customer Retention Sequence",
      status: "Running",
      statusColor: "bg-blue-500",
      daysAgo: 12,
      stats: {
        emails: "3,892",
        opens: "28.9%",
        clicks: "12.3%",
        conversions: "156"
      }
    }
  ];

  const weeklyStats = [
    { label: "Total Leads", value: "+127", color: "text-accent" },
    { label: "Email Opens", value: "2,341", color: "text-blue-500" },
    { label: "Social Shares", value: "89", color: "text-purple-500" },
    { label: "Revenue", value: "$4,567", color: "text-primary" }
  ];

  const quickActions = [
    { 
      label: "Launch Campaign", 
      icon: Rocket, 
      gradient: "from-primary to-secondary",
      testId: "button-launch-campaign"
    },
    { 
      label: "Import Leads", 
      icon: Users, 
      gradient: "from-accent to-green-600",
      testId: "button-import-leads"
    },
    { 
      label: "View Analytics", 
      icon: BarChart3, 
      gradient: "from-orange-500 to-red-500",
      testId: "button-view-analytics"
    }
  ];

  return (
    <div className="min-h-screen bg-soft py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="text-4xl font-bold font-poppins text-main mb-4">Marketing Automation Hub</h1>
          <p className="text-xl text-gray-600 max-w-3xl">
            Orchestrate your entire marketing workflow with intelligent automation that works 24/7
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Campaign Overview */}
          <div className="lg:col-span-2">
            <Card className="shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl text-main">Active Campaigns</CardTitle>
                  <Button className="bg-primary text-white hover:bg-indigo-600" data-testid="button-new-campaign">
                    <Plus className="mr-2" size={16} />
                    New Campaign
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {campaigns.map((campaign, index) => (
                  <Card key={index} className="border border-gray-200 hover:border-primary/30 transition-colors p-4" data-testid={`campaign-card-${index}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 ${campaign.statusColor} rounded-full`}></div>
                        <h4 className="font-semibold text-main" data-testid={`campaign-name-${index}`}>
                          {campaign.name}
                        </h4>
                        <Badge 
                          className={`${campaign.statusColor}/10 text-xs`}
                          data-testid={`campaign-status-${index}`}
                        >
                          {campaign.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500" data-testid={`campaign-date-${index}`}>
                        Started {campaign.daysAgo} days ago
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div data-testid={`campaign-emails-${index}`}>
                        <div className="text-lg font-semibold text-main">{campaign.stats.emails}</div>
                        <div className="text-xs text-gray-500">Emails Sent</div>
                      </div>
                      <div data-testid={`campaign-opens-${index}`}>
                        <div className="text-lg font-semibold text-primary">{campaign.stats.opens}</div>
                        <div className="text-xs text-gray-500">Open Rate</div>
                      </div>
                      <div data-testid={`campaign-clicks-${index}`}>
                        <div className="text-lg font-semibold text-accent">{campaign.stats.clicks}</div>
                        <div className="text-xs text-gray-500">Click Rate</div>
                      </div>
                      <div data-testid={`campaign-conversions-${index}`}>
                        <div className="text-lg font-semibold text-orange-500">{campaign.stats.conversions}</div>
                        <div className="text-xs text-gray-500">Conversions</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-end space-x-2 mt-3">
                      <Button variant="ghost" size="sm" data-testid={`button-pause-campaign-${index}`}>
                        <Pause size={14} />
                      </Button>
                      <Button variant="ghost" size="sm" data-testid={`button-settings-campaign-${index}`}>
                        <Settings size={14} />
                      </Button>
                      <Button variant="ghost" size="sm" data-testid={`button-analytics-campaign-${index}`}>
                        <TrendingUp size={14} />
                      </Button>
                    </div>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Performance Overview */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-main">This Week</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {weeklyStats.map((stat, index) => (
                  <div key={index} className="flex items-center justify-between" data-testid={`weekly-stat-${index}`}>
                    <span className="text-gray-600">{stat.label}</span>
                    <span className={`font-semibold ${stat.color}`}>{stat.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-main">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    className={`w-full py-3 bg-gradient-to-r ${action.gradient} text-white hover:shadow-lg transition-all`}
                    data-testid={action.testId}
                  >
                    <action.icon className="mr-2" size={16} />
                    {action.label}
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* AI Insights */}
            <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100">
              <CardHeader>
                <div className="flex items-center">
                  <Brain className="text-purple-500 mr-2" size={20} />
                  <CardTitle className="text-lg text-main">AI Insights</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  Your email open rates are 23% higher on Tuesday mornings. Consider scheduling more campaigns at this time.
                </p>
                <Button variant="link" className="text-purple-600 hover:text-purple-700 font-medium p-0" data-testid="button-view-insights">
                  View All Insights →
                </Button>
              </CardContent>
            </Card>

            {/* Automation Templates */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-main">Automation Templates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { name: "Welcome Series", icon: Mail, description: "Onboard new subscribers" },
                  { name: "Abandoned Cart", icon: Target, description: "Recover lost sales" },
                  { name: "Re-engagement", icon: Calendar, description: "Win back inactive users" }
                ].map((template, index) => (
                  <div 
                    key={index}
                    className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:border-primary/30 cursor-pointer transition-colors"
                    data-testid={`template-${template.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <template.icon className="text-primary" size={16} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-main text-sm">{template.name}</h4>
                      <p className="text-xs text-gray-500">{template.description}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
