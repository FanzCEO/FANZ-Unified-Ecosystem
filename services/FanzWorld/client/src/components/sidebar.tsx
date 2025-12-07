import { Home, Compass, Bell, Mail, Bookmark, User, Settings, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { User as UserType } from "@shared/schema";
import { Link, useLocation } from "wouter";

export function Sidebar() {
  const { data: user } = useQuery<UserType>({
    queryKey: ["/api/user"],
  });

  const [location] = useLocation();

  const navigationItems = [
    { icon: Home, label: "Home Feed", color: "text-cyber-blue", testId: "nav-home", path: "/" },
    { icon: Compass, label: "Explore", color: "text-electric-purple", testId: "nav-explore", path: "/explore" },
    { icon: Bell, label: "Notifications", color: "text-neon-pink", count: 3, testId: "nav-notifications", path: "/notifications" },
    { icon: Mail, label: "Messages", color: "text-laser-green", testId: "nav-messages", path: "/messages" },
    { icon: Bookmark, label: "Bookmarks", color: "text-cyber-blue", testId: "nav-bookmarks", path: "/bookmarks" },
    { icon: User, label: "Profile", color: "text-electric-purple", testId: "nav-profile", path: "/profile" },
    { icon: Settings, label: "Settings", color: "text-neon-pink", testId: "nav-settings", path: "/settings" },
  ];

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-black/80 backdrop-blur-lg border-r border-cyber-blue/30 overflow-y-auto">
      <nav className="p-4 space-y-2">
        {/* User Profile */}
        <div className="mb-6">
          <div className="flex items-center space-x-3 p-3 rounded-xl bg-gradient-to-r from-cyber-blue/10 to-electric-purple/10 border border-cyber-blue/30">
            <div className="w-12 h-12 rounded-full border border-cyber-blue overflow-hidden">
              <img
                src={user?.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&h=96&fit=crop&crop=face"}
                alt="User Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="font-semibold text-cyber-blue">
                {user?.displayName || "Alex Chen"}
              </h3>
              <p className="text-sm text-gray-400">
                @{user?.username || "alexchen_dev"}
              </p>
            </div>
          </div>
        </div>
        
        {/* Navigation Items */}
        {navigationItems.map((item) => {
          const isActive = location === item.path;
          return (
            <Link key={item.label} href={item.path}>
              <button
                className={`sidebar-item w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 text-left ${
                  isActive ? 'bg-gradient-to-r from-cyber-blue/20 to-electric-purple/20 border border-cyber-blue/50' : ''
                }`}
                data-testid={item.testId}
              >
                <item.icon className={`w-5 h-5 ${item.color} ${isActive ? 'drop-shadow-neon' : ''}`} />
                <span className={`font-medium ${isActive ? 'text-cyber-blue' : ''}`}>{item.label}</span>
                {item.count && (
                  <span className="ml-auto bg-neon-pink text-black text-xs px-2 py-1 rounded-full font-bold">
                    {item.count}
                  </span>
                )}
              </button>
            </Link>
          );
        })}
        
        {/* Create Post Button */}
        <Button
          className="neon-button w-full mt-6 bg-gradient-to-r from-cyber-blue to-electric-purple text-black font-bold py-3 rounded-xl border-cyber-blue hover:shadow-neon-cyan transition-all duration-300 hover:scale-105"
          data-testid="create-post-button"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Post
        </Button>
      </nav>
    </aside>
  );
}
