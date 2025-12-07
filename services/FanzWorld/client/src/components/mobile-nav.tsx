import { Home, Compass, Bell, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";

export function MobileNav() {
  const [location] = useLocation();

  const navigationItems = [
    { icon: Home, label: "Home", color: "text-cyber-blue", testId: "mobile-nav-home", path: "/" },
    { icon: Compass, label: "Explore", color: "text-electric-purple", testId: "mobile-nav-explore", path: "/explore" },
    { icon: Bell, label: "Notifications", color: "text-neon-pink", count: 3, testId: "mobile-nav-notifications", path: "/notifications" },
    { icon: Mail, label: "Messages", color: "text-laser-green", testId: "mobile-nav-messages", path: "/messages" },
    { icon: User, label: "Profile", color: "text-cyber-blue", testId: "mobile-nav-profile", path: "/profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-lg border-t border-cyber-blue/30 lg:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {navigationItems.map((item) => {
          const isActive = location === item.path;
          return (
            <Link key={item.label} href={item.path}>
              <Button
                variant="ghost"
                size="sm"
                className={`relative flex flex-col items-center space-y-1 p-2 min-w-0 flex-1 ${
                  isActive ? 'bg-cyber-blue/20' : ''
                }`}
                data-testid={item.testId}
              >
                <div className="relative">
                  <item.icon className={`w-5 h-5 ${item.color} ${isActive ? 'drop-shadow-neon' : ''}`} />
                  {item.count && (
                    <span className="absolute -top-2 -right-2 bg-neon-pink text-black text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold text-[10px]">
                      {item.count}
                    </span>
                  )}
                </div>
                <span className={`text-xs ${item.color} truncate ${isActive ? 'font-bold' : ''}`}>{item.label}</span>
              </Button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}