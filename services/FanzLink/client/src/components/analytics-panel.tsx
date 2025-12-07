import { TrendingUp, BarChart3, ArrowUp } from "lucide-react";
import { type Analytics } from "@shared/schema";

interface AnalyticsPanelProps {
  analytics: Analytics;
}

const recentActivity = [
  { action: "Instagram link clicked", time: "2 mins ago", color: "bg-fanz-purple" },
  { action: "FanzCommerce product viewed", time: "5 mins ago", color: "bg-fanz-pink" },
  { action: "YouTube link clicked", time: "8 mins ago", color: "bg-fanz-cyan" },
];

export function AnalyticsPanel({ analytics }: AnalyticsPanelProps) {
  return (
    <section className="mb-12">
      <div className="bg-white dark:bg-dark-card rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-dark-border">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
          <BarChart3 className="mr-3 text-fanz-cyan" data-testid="icon-analytics" />
          Analytics Dashboard
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-dark-border dark:to-dark-border rounded-xl">
            <div className="text-3xl font-bold text-fanz-cyan mb-2" data-testid="text-weekly-clicks">
              {(analytics.weeklyClicks || 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Clicks This Week</div>
            <div className="text-xs text-green-600 mt-1">
              <ArrowUp className="inline mr-1 w-3 h-3" />+23%
            </div>
          </div>
          
          <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-dark-border dark:to-dark-border rounded-xl">
            <div className="text-3xl font-bold text-fanz-purple mb-2" data-testid="text-top-link">
              {analytics.topLink}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Most Clicked Link</div>
            <div className="text-xs text-fanz-purple mt-1">847 clicks</div>
          </div>
          
          <div className="text-center p-6 bg-gradient-to-br from-pink-50 to-rose-50 dark:from-dark-border dark:to-dark-border rounded-xl">
            <div className="text-3xl font-bold text-fanz-pink mb-2" data-testid="text-conversion-rate">
              {analytics.conversionRate}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Conversion Rate</div>
            <div className="text-xs text-green-600 mt-1">
              <ArrowUp className="inline mr-1 w-3 h-3" />+0.8%
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-dark-border rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
          
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div 
                key={index}
                className="flex items-center justify-between"
                data-testid={`activity-${index}`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 ${activity.color} rounded-full`}></div>
                  <span className="text-sm text-gray-600 dark:text-gray-300">{activity.action}</span>
                </div>
                <span className="text-xs text-gray-500">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
