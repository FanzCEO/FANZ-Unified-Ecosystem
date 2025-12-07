import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  Home,
  MessageSquare,
  Plus,
  Compass,
  Radio
} from "lucide-react";

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Explore", href: "/explore", icon: Compass },
  { name: "Create", href: "/content", icon: Plus },
  { name: "Live", href: "/live", icon: Radio },
  { name: "Chats", href: "/messages", icon: MessageSquare },
];

export function MobileNav() {
  const [location] = useLocation();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 neon-card border-t border-primary/30 backdrop-blur-sm z-50" data-testid="nav-mobile">
      <div className="flex justify-around py-2">
        {navigation.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          
          return (
            <Link key={item.name} href={item.href}>
              <a
                className={cn(
                  "flex flex-col items-center p-2 transition-all duration-300 rounded-lg",
                  isActive ? "text-primary neon-glow bg-primary/20" : "text-gray-400 hover:text-primary hover:neon-glow"
                )}
                data-testid={`mobile-nav-${item.name.toLowerCase()}`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs mt-1">{item.name}</span>
                {item.name === "Chats" && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-secondary rounded-full"></span>
                )}
              </a>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
