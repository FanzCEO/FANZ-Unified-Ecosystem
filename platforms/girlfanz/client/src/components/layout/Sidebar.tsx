import { Link, useLocation } from "wouter";
import { 
  Home, 
  Image, 
  MessageCircle, 
  BarChart3, 
  CreditCard, 
  Settings,
  Shield,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";

export function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
      current: location === "/dashboard",
    },
    {
      name: "Content",
      href: "/content",
      icon: Image,
      current: location === "/content",
    },
    {
      name: "Messages",
      href: "/messages",
      icon: MessageCircle,
      current: location === "/messages",
      badge: 12,
    },
    {
      name: "Analytics",
      href: "/analytics",
      icon: BarChart3,
      current: location === "/analytics",
    },
    {
      name: "Earnings",
      href: "/earnings",
      icon: CreditCard,
      current: location === "/earnings",
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
      current: location === "/settings",
    },
  ];

  // Add admin routes if user is admin
  if (user?.role === "admin") {
    navigation.push(
      {
        name: "Moderation",
        href: "/moderation",
        icon: Shield,
        current: location === "/moderation",
        badge: 5,
      },
      {
        name: "System Health",
        href: "/health",
        icon: Activity,
        current: location === "/health",
      }
    );
  }

  return (
    <div className="glass-overlay rounded-2xl p-6 sticky top-24">
      {/* Profile Section */}
      <div className="flex items-center space-x-3 mb-8">
        <img
          src={user?.profileImageUrl || "/api/placeholder/48/48"}
          alt="Creator profile"
          className="w-12 h-12 rounded-full"
          data-testid="img-sidebar-profile"
        />
        <div>
          <h3 className="font-display font-semibold text-gf-snow" data-testid="text-display-name">
            {user?.firstName && user?.lastName 
              ? `${user.firstName} ${user.lastName}`
              : user?.username || "User"
            }
          </h3>
          <p className="text-gf-smoke text-sm" data-testid="text-username">
            @{user?.username || "username"}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
                item.current
                  ? "text-gf-pink bg-gf-pink/10"
                  : "text-gf-smoke hover:text-gf-pink"
              )}
              data-testid={`link-${item.name.toLowerCase().replace(" ", "-")}`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.name}</span>
              {item.badge && (
                <Badge className="bg-gf-violet text-xs px-2 py-1 ml-auto">
                  {item.badge}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
