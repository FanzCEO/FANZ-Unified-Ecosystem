import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";

export function Navbar() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { data: credits } = useQuery({
    queryKey: ["/api/user/credits"],
  }) as { data: { credits: number; totalCreditsUsed: number } | undefined };

  const navigation = [
    { name: "Dashboard", href: "/", icon: "fas fa-home" },
    { name: "Generator", href: "/generator", icon: "fas fa-magic" },
    { name: "History", href: "/history", icon: "fas fa-history" },
  ];

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border" data-testid="navbar">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center space-x-2 cursor-pointer" data-testid="logo">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <i className="fas fa-robot text-white text-xl"></i>
              </div>
              <span className="text-2xl font-black gradient-text">FanzAssistant</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link key={item.name} href={item.href}>
                <div
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                    location === item.href
                      ? "text-primary bg-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                  data-testid={`nav-${item.name.toLowerCase()}`}
                >
                  <i className={item.icon}></i>
                  <span>{item.name}</span>
                </div>
              </Link>
            ))}
          </div>

          {/* User Info & Actions */}
          <div className="flex items-center space-x-4">
            {/* Credits Display */}
            <div className="hidden sm:flex items-center space-x-2 bg-primary/20 text-primary px-3 py-2 rounded-lg" data-testid="credits-navbar">
              <i className="fas fa-coins"></i>
              <span className="font-semibold">{credits?.credits || 0}</span>
              <span className="text-xs">credits</span>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-3">
              {(user as any)?.profileImageUrl ? (
                <img
                  src={(user as any).profileImageUrl}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover"
                  data-testid="user-avatar"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <i className="fas fa-user text-white text-sm"></i>
                </div>
              )}
              <div className="hidden md:block">
                <div className="text-sm font-medium text-white">
                  {(user as any)?.firstName || (user as any)?.email?.split('@')[0] || 'User'}
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = "/api/logout"}
                className="text-muted-foreground hover:text-foreground"
                data-testid="button-logout"
              >
                <i className="fas fa-sign-out-alt"></i>
                <span className="hidden md:inline ml-2">Logout</span>
              </Button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            data-testid="button-mobile-menu"
          >
            <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'} text-xl`}></i>
          </Button>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border shadow-lg" data-testid="mobile-menu">
            <div className="container mx-auto px-4 py-4">
              {/* Mobile Navigation Links */}
              <div className="space-y-3 mb-6">
                {navigation.map((item) => (
                  <Link key={item.name} href={item.href}>
                    <div
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors cursor-pointer ${
                        location === item.href
                          ? "text-primary bg-primary/20"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      data-testid={`mobile-nav-${item.name.toLowerCase()}`}
                    >
                      <i className={item.icon}></i>
                      <span className="font-medium">{item.name}</span>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Mobile User Info */}
              <div className="border-t border-border pt-4">
                <div className="flex items-center space-x-3 mb-4">
                  {(user as any)?.profileImageUrl ? (
                    <img
                      src={(user as any).profileImageUrl}
                      alt="Profile"
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                      <i className="fas fa-user text-white"></i>
                    </div>
                  )}
                  <div>
                    <div className="text-white font-medium">
                      {(user as any)?.firstName || (user as any)?.email?.split('@')[0] || 'User'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {credits?.credits || 0} credits remaining
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    window.location.href = "/api/logout";
                  }}
                  data-testid="mobile-logout-button"
                >
                  <i className="fas fa-sign-out-alt mr-2"></i>
                  Logout
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
