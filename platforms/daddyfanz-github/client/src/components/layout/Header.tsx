import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import daddyFanzLogo from "@assets/daddyfanzlogo1_1759189347461.png";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "wouter";
import { 
  Bell, 
  Settings, 
  LogOut, 
  User, 
  DollarSign, 
  MessageCircle,
  BarChart3,
  Shield,
  Menu,
  X,
  Brain,
  HeadphonesIcon,
  GraduationCap,
  Upload,
  FolderOpen,
  Home
} from "lucide-react";
import { useState } from "react";

export default function Header() {
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["/api/profile"],
    retry: false,
    enabled: isAuthenticated,
  });

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    window.location.href = "/api/logout";
  };

  const navItems = [
    { path: "/", label: "Dashboard", icon: BarChart3 },
    { path: "/feed", label: "Feed", icon: Home },
    { path: "/profile", label: "Profile", icon: User },
    { path: "/content-manage", label: "Content", icon: FolderOpen },
    { path: "/content-upload", label: "Upload", icon: Upload },
    { path: "/messages", label: "Messages", icon: MessageCircle },
    { path: "/ai-wiki", label: "AI Wiki", icon: Brain },
    { path: "/tutorials", label: "Tutorials", icon: GraduationCap },
    { path: "/help-desk", label: "Help Desk", icon: HeadphonesIcon },
    { path: "/settings", label: "Settings", icon: Settings },
  ];

  const isCurrentPath = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <header className="bg-df-brick border-b border-df-steel shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center" data-testid="link-logo">
            <img 
              src={daddyFanzLogo} 
              alt="DaddyFanz" 
              className="h-12 w-auto hover:scale-105 transition-transform duration-200 glow-image"
            />
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <Link 
                key={item.path}
                href={item.path}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                  isCurrentPath(item.path)
                    ? 'neon-heading border-b-2 border-df-cyan bg-df-cyan bg-opacity-10'
                    : 'text-df-fog hover:text-df-cyan hover:bg-df-steel hover:bg-opacity-20'
                }`}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
          
          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <Button 
              variant="ghost" 
              size="sm"
              className="text-df-fog hover:text-df-cyan relative p-2"
              data-testid="button-notifications"
            >
              <Bell className="h-5 w-5" />
              <Badge 
                variant="secondary" 
                className="absolute -top-1 -right-1 bg-df-gold text-df-ink text-xs h-5 w-5 flex items-center justify-center p-0"
              >
                3
              </Badge>
            </Button>
            
            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="flex items-center space-x-3 p-1 hover:bg-df-steel hover:bg-opacity-20"
                  data-testid="button-profile-menu"
                >
                  <Avatar className="h-8 w-8 border-2 border-df-cyan shadow-glow">
                    <AvatarFallback className="bg-df-ink text-df-cyan">
                      {((profile as any)?.displayName || user.email || 'U')[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block text-left">
                    <div className="text-df-snow font-medium text-sm" data-testid="text-display-name">
                      {(profile as any)?.displayName || user.email}
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-df-fog text-xs capitalize">{user.role}</span>
                      {(profile as any)?.ageVerified && (
                        <div className="w-3 h-3 bg-df-gold rounded-full" title="Verified Creator" />
                      )}
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="w-56 bg-df-brick border border-df-steel shadow-glow"
                align="end"
              >
                <DropdownMenuLabel className="text-df-snow">
                  My Account
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-df-steel" />
                
                <DropdownMenuItem asChild>
                  <Link 
                    href="/profile" 
                    className="flex items-center w-full text-df-fog hover:text-df-cyan hover:bg-df-steel hover:bg-opacity-20"
                    data-testid="menu-profile"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                
                {(user.role === "creator" || user.role === "admin") && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link 
                        href="/content-manage" 
                        className="flex items-center w-full text-df-fog hover:text-df-cyan hover:bg-df-steel hover:bg-opacity-20"
                        data-testid="menu-content-manage"
                      >
                        <FolderOpen className="mr-2 h-4 w-4" />
                        Manage Content
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link 
                        href="/content-upload" 
                        className="flex items-center w-full text-df-fog hover:text-df-cyan hover:bg-df-steel hover:bg-opacity-20"
                        data-testid="menu-content-upload"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Content
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link 
                        href="/earnings" 
                        className="flex items-center w-full text-df-fog hover:text-df-cyan hover:bg-df-steel hover:bg-opacity-20"
                        data-testid="menu-earnings"
                      >
                        <DollarSign className="mr-2 h-4 w-4" />
                        Earnings
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                
                <DropdownMenuItem asChild>
                  <Link 
                    href="/messages" 
                    className="flex items-center w-full text-df-fog hover:text-df-cyan hover:bg-df-steel hover:bg-opacity-20"
                    data-testid="menu-messages"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Messages
                  </Link>
                </DropdownMenuItem>
                
                {user.role === "admin" && (
                  <DropdownMenuItem asChild>
                    <Link 
                      href="/admin" 
                      className="flex items-center w-full text-df-fog hover:text-df-cyan hover:bg-df-steel hover:bg-opacity-20"
                      data-testid="menu-admin"
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      Admin Panel
                    </Link>
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuSeparator className="bg-df-steel" />
                
                <DropdownMenuItem asChild>
                  <Link 
                    href="/settings" 
                    className="flex items-center w-full text-df-fog hover:text-df-cyan hover:bg-df-steel hover:bg-opacity-20"
                    data-testid="menu-settings"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator className="bg-df-steel" />
                
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="flex items-center w-full text-red-400 hover:text-red-300 hover:bg-red-900 hover:bg-opacity-20"
                  data-testid="menu-logout"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-df-fog hover:text-df-cyan p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-df-steel">
            <nav className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                    isCurrentPath(item.path)
                      ? 'text-df-cyan bg-df-cyan bg-opacity-10 border-l-4 border-df-cyan'
                      : 'text-df-fog hover:text-df-cyan hover:bg-df-steel hover:bg-opacity-20'
                  }`}
                  data-testid={`mobile-nav-${item.label.toLowerCase()}`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
