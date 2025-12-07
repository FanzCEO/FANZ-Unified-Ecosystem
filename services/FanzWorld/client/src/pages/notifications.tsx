import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { User, NotificationWithActor } from "@shared/schema";
import { Heart, MessageCircle, UserPlus, Repeat, Settings, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";


const getNotificationIcon = (type: string) => {
  switch (type) {
    case "like":
      return <Heart className="w-5 h-5 text-neon-pink" />;
    case "comment":
      return <MessageCircle className="w-5 h-5 text-cyber-blue" />;
    case "follow":
      return <UserPlus className="w-5 h-5 text-laser-green" />;
    case "repost":
      return <Repeat className="w-5 h-5 text-electric-purple" />;
    default:
      return <Heart className="w-5 h-5 text-neon-pink" />;
  }
};

export default function Notifications() {
  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });
  
  const { data: notifications = [], isLoading } = useQuery<NotificationWithActor[]>({
    queryKey: ["/api/notifications"],
  });
  
  const getNotificationContent = (notification: NotificationWithActor) => {
    const actorName = notification.actor?.displayName || "Someone";
    
    switch (notification.type) {
      case "like":
        return `liked your post`;
      case "follow":
        return `started following you`;
      case "comment":
        return `commented on your post`;
      case "repost":
        return `reposted your post`;
      default:
        return notification.content || "New notification";
    }
  };
  
  const getTimeAgo = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  return (
    <div className="min-h-screen bg-black text-white cyber-grid">
      <Header />
      
      <div className="flex flex-col lg:flex-row pt-14 sm:pt-16 pb-16 lg:pb-0">
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        
        <main className="flex-1 lg:ml-64 max-w-full lg:max-w-2xl mx-auto p-3 sm:p-4 lg:p-6">
          {/* Header */}
          <div className="post-card p-6 rounded-xl mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-cyber-blue neon-text">
                Notifications
              </h1>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-cyber-blue transition-colors"
                data-testid="notification-settings"
              >
                <Settings className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="flex space-x-4">
              <Button
                className="flex-1 bg-cyber-blue/20 text-cyber-blue hover:bg-cyber-blue hover:text-black transition-colors py-2 rounded-lg"
                data-testid="all-notifications"
              >
                All
              </Button>
              <Button
                variant="ghost"
                className="flex-1 text-gray-400 hover:text-electric-purple hover:bg-electric-purple/10 transition-colors py-2 rounded-lg"
                data-testid="mentions-notifications"
              >
                Mentions
              </Button>
              <Button
                variant="ghost"
                className="flex-1 text-gray-400 hover:text-neon-pink hover:bg-neon-pink/10 transition-colors py-2 rounded-lg"
                data-testid="verified-notifications"
              >
                Verified
              </Button>
            </div>
          </div>
          
          {/* Notifications List */}
          <div className="space-y-1 mb-20 lg:mb-0">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="w-6 h-6 border-2 border-cyber-blue border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-2 text-gray-400">Loading notifications...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="post-card p-8 rounded-xl text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-cyber-blue/20 to-electric-purple/20 flex items-center justify-center border border-cyber-blue/30">
                  <MessageCircle className="w-8 h-8 text-cyber-blue" />
                </div>
                <h3 className="text-lg font-semibold text-cyber-blue mb-2">No notifications yet</h3>
                <p className="text-gray-400 text-sm max-w-sm mx-auto">
                  When someone likes, comments, or follows you, you'll see it here!
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`post-card p-4 sm:p-6 rounded-xl transition-all duration-300 hover:shadow-glow cursor-pointer ${
                    !notification.read ? 'border-l-4 border-cyber-blue' : ''
                  }`}
                  data-testid={`notification-${notification.id}`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-neon-pink overflow-hidden flex-shrink-0">
                      <img
                        src={notification.actor?.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&h=96&fit=crop&crop=face"}
                        alt={notification.actor?.displayName || "Unknown"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-white text-sm sm:text-base">
                            <span className="font-semibold text-neon-pink">
                              {notification.actor?.displayName || "Unknown User"}
                            </span>
                            <span className="text-gray-400 ml-1">
                              @{notification.actor?.username || "unknown"}
                            </span>
                            <span className="ml-2">{getNotificationContent(notification)}</span>
                          </p>
                          <p className="text-gray-500 text-xs sm:text-sm mt-1">
                            {getTimeAgo(notification.createdAt)}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          {!notification.read && (
                            <div className="w-2 h-2 bg-cyber-blue rounded-full"></div>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1 text-gray-400 hover:text-cyber-blue transition-colors"
                            data-testid={`mark-read-${notification.id}`}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {notifications.length > 0 && (
              <div className="text-center py-6">
                <Button
                  variant="ghost"
                  className="text-cyber-blue hover:bg-cyber-blue/10 transition-colors"
                  data-testid="load-more-notifications"
                >
                  Load more notifications
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
      
      <MobileNav />
    </div>
  );
}