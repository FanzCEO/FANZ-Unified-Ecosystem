import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import {
  Home,
  MessageSquare,
  Plus,
  BarChart3,
  Users,
  DollarSign,
  User,
  Settings,
  Compass,
  Radio,
  ShoppingBag,
  Gift,
  Zap,
  Lock,
  BarChart2,
  Image as ImageIcon
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Explore", href: "/explore", icon: Compass },
  { name: "Stories", href: "/stories", icon: Zap },
  { name: "Create Content", href: "/content", icon: Plus },
  { name: "PPV Content", href: "/ppv", icon: Lock },
  { name: "Polls", href: "/polls", icon: BarChart2 },
  { name: "Go Live", href: "/live", icon: Radio },
  { name: "Messages", href: "/messages", icon: MessageSquare },
  { name: "Shop", href: "/shop", icon: ShoppingBag },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Subscribers", href: "/subscribers", icon: Users },
  { name: "Refer & Earn", href: "/referrals", icon: Gift },
  { name: "Profile", href: "/profile", icon: User },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  return (
    <div className="hidden lg:flex lg:fixed lg:inset-y-0 lg:w-64 lg:flex-col">
      <div className="flex flex-col flex-grow neon-card border-r border-primary/30 backdrop-blur-sm">
        {/* Logo */}
        <div className="flex items-center justify-center h-16 px-4 border-b border-primary/30">
          <h1 className="text-2xl font-bold text-primary neon-text text-glow-animated" data-testid="text-sidebar-logo">
            FANZClub
          </h1>
        </div>
        
        {/* Navigation */}
        <nav className="mt-6 flex-1 px-4 space-y-2" data-testid="nav-sidebar">
          {navigation.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            
            return (
              <Link key={item.name} href={item.href}>
                <a
                  className={cn(
                    "flex items-center px-4 py-3 rounded-lg transition-all duration-300",
                    isActive
                      ? "text-primary bg-primary/20 neon-glow border border-primary/50"
                      : "text-gray-300 hover:text-primary hover:bg-primary/10 hover:neon-glow"
                  )}
                  data-testid={`nav-link-${item.name.toLowerCase().replace(' ', '-')}`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                  {item.name === "Messages" && (
                    <span className="ml-auto bg-secondary text-secondary-foreground text-xs rounded-full px-2 py-1">
                      3
                    </span>
                  )}
                </a>
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-primary/30 neon-border" data-testid="section-user-profile">
          <div className="flex items-center">
            <img 
              src={(user || {}).profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${(user || {}).email}`} 
              alt="Creator profile" 
              className="w-10 h-10 rounded-full object-cover"
              data-testid="img-user-avatar"
            />
            <div className="ml-3">
              <div className="text-sm font-medium" data-testid="text-user-name">
                {(user || {}).firstName} {(user || {}).lastName}
              </div>
              <div className="text-xs text-muted-foreground" data-testid="text-user-email">
                {(user || {}).email}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
