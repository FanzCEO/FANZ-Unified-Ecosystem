import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";
import { type User, type Analytics } from "@shared/schema";

interface ProfileSectionProps {
  user: User;
  analytics: Analytics;
}

export function ProfileSection({ user, analytics }: ProfileSectionProps) {
  return (
    <section className="text-center mb-12">
      <div className="relative inline-block mb-6">
        <img 
          src={user.profileImage || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=400"} 
          alt="Profile Picture" 
          className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-white dark:border-dark-border shadow-xl"
          data-testid="img-profile"
        />
        {user.isVerified === "true" && (
          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-3 border-white dark:border-dark-bg flex items-center justify-center">
            <CheckCircle className="text-white text-xs w-4 h-4" data-testid="icon-verified" />
          </div>
        )}
      </div>
      
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2" data-testid="text-display-name">
        {user.displayName}
      </h1>
      <p className="text-gray-600 dark:text-gray-300 mb-4" data-testid="text-title">
        {user.title}
      </p>
      <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed" data-testid="text-bio">
        {user.bio}
      </p>
      
      {/* Analytics Summary */}
      <div className="flex justify-center space-x-6 mt-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-fanz-purple" data-testid="text-total-clicks">
            {(analytics.totalClicks || 0).toLocaleString()}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Clicks</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-fanz-pink" data-testid="text-monthly-views">
            {(analytics.monthlyViews || 0).toLocaleString()}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">This Month</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-fanz-cyan" data-testid="text-followers">
            {analytics.followers}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Followers</div>
        </div>
      </div>
    </section>
  );
}
