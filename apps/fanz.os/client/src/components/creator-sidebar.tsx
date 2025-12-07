import { useAuth } from "@/hooks/useAuth";
import { 
  BarChart3, 
  Upload, 
  Users, 
  MessageSquare,
  Video,
  Trophy,
  Store,
  Calendar,
  Crown
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CreatorSidebar() {
  const { user } = useAuth();

  const creatorNavItems = [
    { icon: BarChart3, label: "Analytics", href: "/dashboard", active: true },
    { icon: Upload, label: "Upload Content", href: "/upload" },
    { icon: Users, label: "Subscribers", href: "/subscribers" },
    { icon: MessageSquare, label: "Messages", href: "/messages" },
  ];

  const platformFeatures = [
    { icon: Video, label: "Live Stream", href: "/live" },
    { icon: Trophy, label: "Contests", href: "/contests" },
    { icon: Store, label: "Merch Shop", href: "/shop" },
    { icon: Calendar, label: "Events", href: "/events" },
  ];

  return (
    <aside className="w-64 bg-slate border-r border-gray-700 hidden lg:block">
      <div className="p-6">
        <div className="space-y-6">
          {/* Creator Dashboard */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Creator Hub
            </h3>
            <nav className="space-y-2">
              {creatorNavItems.map((item, index) => (
                <a
                  key={index}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    item.active
                      ? 'text-white bg-primary bg-opacity-20'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                  data-testid={`creator-nav-${item.label.toLowerCase().replace(' ', '-')}`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </a>
              ))}
            </nav>
          </div>

          {/* Platform Features */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Platform
            </h3>
            <nav className="space-y-2">
              {platformFeatures.map((item, index) => (
                <a
                  key={index}
                  href={item.href}
                  className="flex items-center space-x-3 text-gray-400 hover:text-white hover:bg-gray-800 px-3 py-2 rounded-lg transition-colors"
                  data-testid={`platform-nav-${item.label.toLowerCase().replace(' ', '-')}`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </a>
              ))}
            </nav>
          </div>

          {/* VIP Section */}
          <Card className="bg-gradient-to-br from-primary to-secondary border-0">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Crown className="w-5 h-5 text-white" />
                <h3 className="font-semibold text-white">Upgrade to VIP</h3>
              </div>
              <p className="text-sm text-purple-100 mb-3">
                Access exclusive clips and earn 2x rewards
              </p>
              <Button 
                className="w-full bg-white text-primary font-semibold hover:bg-gray-100 transition-colors"
                data-testid="button-get-vip"
              >
                Get VIP Card
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </aside>
  );
}
