import { useEffect, useState, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { 
  Bell, 
  Video, 
  MessageSquare, 
  DollarSign, 
  Users, 
  Heart, 
  Zap,
  X
} from 'lucide-react';

interface NotificationEvent {
  id: string;
  type: string;
  title: string;
  message: string;
  icon?: React.ReactNode;
  timestamp: string;
  priority?: 'high' | 'normal' | 'low';
  data?: any;
}

export function RealTimeNotifications() {
  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'live_stream': return <Video className="h-4 w-4 text-red-500" />;
      case 'message': return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'tip': return <DollarSign className="h-4 w-4 text-green-500" />;
      case 'subscription': return <Users className="h-4 w-4 text-purple-500" />;
      case 'follow': return <Heart className="h-4 w-4 text-pink-500" />;
      case 'new_content': return <Zap className="h-4 w-4 text-yellow-500" />;
      default: return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const parseEventToNotification = (event: any): NotificationEvent | null => {
    const data = event.data || event;
    const eventType = data.event_type || data.type || 'system';
    
    let title = '';
    let message = '';
    
    switch (eventType) {
      case 'live_stream':
        if (data.action === 'stream_started') {
          title = 'Live Stream Started';
          message = `${data.creatorName || 'A creator'} just went live: ${data.streamTitle || 'Live Stream'}`;
        } else if (data.action === 'stream_ended') {
          title = 'Stream Ended';
          message = 'The live stream has ended';
        }
        break;
        
      case 'message':
        title = 'New Message';
        message = `${data.senderName || 'Someone'} sent you a message`;
        break;
        
      case 'tip':
        title = 'New Tip!';
        message = `${data.fanName || 'Someone'} sent you $${data.amount || '0'}`;
        if (data.message) message += `: ${data.message}`;
        break;
        
      case 'subscription':
        title = 'New Subscriber!';
        message = `${data.fanName || 'Someone'} subscribed to your content`;
        break;
        
      case 'follow':
        title = 'New Follower';
        message = `${data.followerName || 'Someone'} started following you`;
        break;
        
      case 'new_content':
        title = 'New Content';
        message = `${data.creatorName || 'A creator'} posted new content`;
        break;
        
      case 'comment':
        title = 'New Comment';
        message = `${data.userName || 'Someone'} commented on your content`;
        break;
        
      default:
        if (data.message) {
          title = 'Notification';
          message = data.message;
        } else {
          return null;
        }
    }
    
    return {
      id: data.id || Date.now().toString(),
      type: eventType,
      title,
      message,
      icon: getNotificationIcon(eventType),
      timestamp: data.timestamp || new Date().toISOString(),
      priority: data.priority || 'normal',
      data
    };
  };

  useEffect(() => {
    if (!user) return;

    const connectToSSE = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const eventSource = new EventSource('http://localhost:8080/events');

      eventSource.onopen = () => {
        setIsConnected(true);
        console.log('Connected to real-time notifications');
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const notification = parseEventToNotification(data);
          
          if (notification) {
            // Add to notifications list
            setNotifications(prev => [notification, ...prev].slice(0, 50));
            
            // Show toast for high-priority notifications
            if (notification.priority === 'high') {
              toast({
                title: notification.title,
                description: notification.message,
              });
            }
          }
        } catch (error) {
          console.error('Error parsing notification:', error);
        }
      };

      eventSource.onerror = () => {
        setIsConnected(false);
        console.error('SSE connection error');
        
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          if (user) {
            connectToSSE();
          }
        }, 5000);
      };

      eventSourceRef.current = eventSource;
    };

    connectToSSE();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [user, toast]);

  const unreadCount = notifications.filter(n => !n.data?.read).length;

  return (
    <>
      {/* Notification Bell Icon */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        data-testid="button-notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        {isConnected && (
          <span className="absolute bottom-1 right-1 h-2 w-2 bg-green-500 rounded-full animate-pulse" />
        )}
      </button>

      {/* Notification Panel */}
      {showPanel && (
        <Card className="absolute right-0 top-12 w-96 max-h-[500px] overflow-hidden shadow-xl z-50">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold">Notifications</h3>
            <button
              onClick={() => setShowPanel(false)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              data-testid="button-close-notifications"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="overflow-y-auto max-h-[400px]">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No notifications yet
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                    data-testid={`notification-${notification.id}`}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 pt-1">
                        {notification.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{notification.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(notification.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {notifications.length > 0 && (
            <div className="p-3 border-t">
              <button
                onClick={() => setNotifications([])}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                data-testid="button-clear-notifications"
              >
                Clear all notifications
              </button>
            </div>
          )}
        </Card>
      )}
    </>
  );
}