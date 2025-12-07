import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Wallet, 
  ChevronDown, 
  Home, 
  MessageSquare,
  User,
  Plus,
  Menu,
  X
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface NavigationProps {
  unreadCount?: number;
}

export default function Navigation({ unreadCount = 0 }: NavigationProps) {
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  const mobileNavItems = [
    { icon: Home, label: "Home", href: "/", active: true },
    { icon: Search, label: "Search", href: "/search" },
    { icon: Plus, label: "Create", href: "/create" },
    { 
      icon: MessageSquare, 
      label: "Messages", 
      href: "/messages",
      badge: unreadCount > 0 ? unreadCount : undefined
    },
    { icon: User, label: "Profile", href: "/profile" },
  ];

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="bg-slate border-b border-gray-700 sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  FansLab
                </h1>
                <span className="text-xs bg-accent text-black px-2 py-1 rounded-full font-semibold">
                  BETA
                </span>
              </div>
              <div className="hidden md:flex space-x-6">
                <a 
                  href="/" 
                  className="text-white hover:text-secondary transition-colors" 
                  data-testid="nav-link-feed"
                >
                  Feed
                </a>
                <a 
                  href="/discover" 
                  className="text-gray-400 hover:text-white transition-colors"
                  data-testid="nav-link-discover"
                >
                  Discover
                </a>
                <a 
                  href="/events" 
                  className="text-gray-400 hover:text-white transition-colors"
                  data-testid="nav-link-events"
                >
                  Events
                </a>
                <a 
                  href="/shop" 
                  className="text-gray-400 hover:text-white transition-colors"
                  data-testid="nav-link-shop"
                >
                  Shop
                </a>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="hidden md:block relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search creators..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-gray-800 border-gray-700 pl-10 w-64 text-white placeholder-gray-400"
                  data-testid="input-nav-search"
                />
              </div>
              
              {/* Wallet */}
              <div className="flex items-center space-x-2 bg-gray-800 px-3 py-2 rounded-lg">
                <Wallet className="w-5 h-5 text-accent" />
                <span className="font-semibold" data-testid="text-wallet-balance">
                  ${parseFloat(user?.balance || '0').toFixed(2)}
                </span>
              </div>
              
              {/* Profile Dropdown */}
              <div className="flex items-center space-x-3 cursor-pointer" onClick={handleLogout}>
                <img 
                  src={user?.profileImageUrl || 'https://via.placeholder.com/32x32'} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full border-2 border-primary object-cover"
                  data-testid="img-nav-avatar"
                />
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
              
              {/* Mobile Menu */}
              <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="sm" data-testid="button-mobile-menu">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="bg-slate border-gray-700 text-white">
                  <div className="flex flex-col space-y-4 mt-8">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        type="text"
                        placeholder="Search creators..."
                        className="bg-gray-800 border-gray-700 pl-10 text-white placeholder-gray-400"
                        data-testid="input-mobile-search"
                      />
                    </div>
                    <div className="space-y-2">
                      <a href="/" className="block px-4 py-2 hover:bg-gray-700 rounded-lg">Feed</a>
                      <a href="/discover" className="block px-4 py-2 hover:bg-gray-700 rounded-lg">Discover</a>
                      <a href="/messages" className="block px-4 py-2 hover:bg-gray-700 rounded-lg flex items-center justify-between">
                        Messages
                        {unreadCount > 0 && (
                          <Badge className="bg-secondary text-white">{unreadCount}</Badge>
                        )}
                      </a>
                      <a href="/events" className="block px-4 py-2 hover:bg-gray-700 rounded-lg">Events</a>
                      <a href="/shop" className="block px-4 py-2 hover:bg-gray-700 rounded-lg">Shop</a>
                    </div>
                    <Button onClick={handleLogout} variant="outline" className="mt-4">
                      Logout
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate border-t border-gray-700 z-40">
        <div className="flex items-center justify-around py-3">
          {mobileNavItems.map((item, index) => (
            <a
              key={index}
              href={item.href}
              className={`flex flex-col items-center space-y-1 ${
                item.active ? 'text-primary' : 'text-gray-400'
              }`}
              data-testid={`mobile-nav-${item.label.toLowerCase()}`}
            >
              <div className="relative">
                <item.icon className="w-5 h-5" />
                {item.badge && (
                  <Badge className="absolute -top-2 -right-2 bg-secondary text-white text-xs min-w-5 h-5 rounded-full flex items-center justify-center">
                    {item.badge}
                  </Badge>
                )}
              </div>
              <span className="text-xs">{item.label}</span>
            </a>
          ))}
        </div>
      </nav>
    </>
  );
}
