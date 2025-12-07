import { useState } from "react";
import { Link } from "wouter";
import { Bell, Search, Menu } from "lucide-react";
import logoUrl from "@/assets/logo.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AuthModal } from "@/components/auth/AuthModal";
import { useAuth } from "@/hooks/useAuth";

export function Header() {
  const { user, isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const navigation = [
    { name: "Discover", href: "/discover" },
    { name: "Following", href: "/following" },
    { name: "Messages", href: "/messages" },
    { name: "Live", href: "/live" },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 glass-overlay border-b border-gf-graphite backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center space-x-2">
                <img 
                  src={logoUrl} 
                  alt="GirlFanz" 
                  className="h-30 w-auto" 
                  data-testid="img-logo"
                />
              </Link>
              
              {/* Desktop Navigation */}
              <nav className="hidden md:flex space-x-6">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-gf-smoke hover:text-gf-pink transition-colors"
                    data-testid={`link-${item.name.toLowerCase()}`}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Right Side */}
            <div className="flex items-center space-x-3">
              {/* Search */}
              <div className="relative hidden sm:block">
                <Input
                  type="text"
                  placeholder="Search creators..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-gf-graphite border-gf-smoke/20 text-gf-snow placeholder-gf-smoke w-64 pl-10 focus:border-gf-pink"
                  data-testid="input-search"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gf-smoke h-4 w-4" />
              </div>

              {isAuthenticated ? (
                <>
                  {/* Notifications */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative text-gf-smoke hover:text-gf-cyan"
                    data-testid="button-notifications"
                  >
                    <Bell className="h-5 w-5" />
                    <Badge className="absolute -top-1 -right-1 bg-gf-pink text-xs h-5 w-5 flex items-center justify-center p-0">
                      3
                    </Badge>
                  </Button>

                  {/* Profile Menu */}
                  <div className="flex items-center space-x-3">
                    <img
                      src={user?.profileImageUrl || "/api/placeholder/40/40"}
                      alt="Profile"
                      className="w-8 h-8 rounded-full"
                      data-testid="img-profile-avatar"
                    />
                    <Button
                      onClick={() => window.location.href = "/api/logout"}
                      variant="outline"
                      className="text-gf-snow border-gf-violet hover:bg-gf-violet/10"
                      data-testid="button-logout"
                    >
                      Sign Out
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {/* Auth Buttons */}
                  <Button
                    onClick={() => setShowAuthModal(true)}
                    className="bg-gf-gradient text-gf-snow hover:shadow-glow-pink"
                    data-testid="button-create-account"
                  >
                    Create Account
                  </Button>
                  <Button
                    onClick={() => setShowAuthModal(true)}
                    variant="outline"
                    className="text-gf-snow border-gf-violet hover:bg-gf-violet/10"
                    data-testid="button-signin"
                  >
                    Sign In
                  </Button>
                </>
              )}

              {/* Mobile Menu */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden text-gf-smoke">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent className="bg-gf-graphite border-gf-smoke/20">
                  <nav className="space-y-4 mt-8">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="block text-gf-smoke hover:text-gf-pink transition-colors py-2"
                      >
                        {item.name}
                      </Link>
                    ))}
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}
