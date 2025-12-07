import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  Search, 
  Bell, 
  User, 
  Command,
  ChevronRight,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { 
  mainNavigation, 
  creatorNavigation, 
  supportNavigation, 
  accountNavigation,
  adminNavigation,
  generateBreadcrumbs,
  quickCommands,
  getCommandsForRole,
  type QuickCommand 
} from '@/config/navigation';

export function EnhancedHeader() {
  const [location, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [commandSearch, setCommandSearch] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Generate breadcrumbs for current location
  const breadcrumbs = generateBreadcrumbs(location);
  
  // Get user role
  const userRole = (user as any)?.role || 'fan';
  
  // Filter commands by role
  const availableCommands = getCommandsForRole(userRole);
  
  // Filter commands by search
  const filteredCommands = availableCommands.filter(cmd =>
    cmd.label.toLowerCase().includes(commandSearch.toLowerCase()) ||
    cmd.keywords.some(keyword => 
      keyword.toLowerCase().includes(commandSearch.toLowerCase())
    )
  );

  // Group commands
  const groupedCommands = filteredCommands.reduce((groups, command) => {
    const group = command.group;
    if (!groups[group]) groups[group] = [];
    groups[group].push(command);
    return groups;
  }, {} as Record<string, QuickCommand[]>);

  // Handle command selection
  const handleCommandSelect = (command: QuickCommand) => {
    if (command.href) {
      navigate(command.href);
    } else if (command.action) {
      command.action();
    }
    setIsCommandPaletteOpen(false);
    setCommandSearch('');
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setIsCommandPaletteOpen(true);
      }
      if (event.key === 'Escape') {
        setIsCommandPaletteOpen(false);
        setCommandSearch('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Get all navigation items for current user
  const getAllNavigationForUser = () => {
    const items = [...mainNavigation];
    
    if (userRole === 'creator' || userRole === 'admin') {
      items.push(...creatorNavigation);
    }
    
    items.push(...supportNavigation, ...accountNavigation);
    
    if (userRole === 'admin') {
      items.push(...adminNavigation);
    }
    
    return items;
  };

  const navigationItems = getAllNavigationForUser();

  if (!isAuthenticated) {
    return (
      <header className="bg-gf-ink/95 backdrop-blur-sm border-b border-gf-smoke/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="text-2xl font-bold">
                <span className="bg-gradient-to-r from-gf-pink to-gf-cyan bg-clip-text text-transparent">
                  GirlFanz
                </span>
                <span className="text-xs text-gf-cyan ml-1">™</span>
              </div>
            </Link>
            
            {/* Help Center and Login */}
            <div className="flex items-center space-x-4">
              <Link href="/help">
                <Button 
                  variant="ghost"
                  className="text-gf-snow hover:bg-gf-smoke/20"
                  data-testid="link-help-center"
                >
                  Help Center
                </Button>
              </Link>
              <Button 
                onClick={() => window.location.href = '/api/login'} 
                className="bg-gradient-to-r from-gf-pink to-gf-purple hover:from-gf-pink/90 hover:to-gf-purple/90"
                data-testid="button-login"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      <header className="bg-gf-ink/95 backdrop-blur-sm border-b border-gf-smoke/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main header row */}
          <div className="flex justify-between items-center py-4">
            {/* Logo and mobile menu */}
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden text-gf-snow hover:bg-gf-smoke/20"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                data-testid="button-mobile-menu"
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </Button>
              
              <Link href="/dashboard" className="flex items-center space-x-2">
                <div className="text-2xl font-bold">
                  <span className="bg-gradient-to-r from-gf-pink to-gf-cyan bg-clip-text text-transparent">
                    GirlFanz
                  </span>
                  <span className="text-xs text-gf-cyan ml-1">™</span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-6">
              {mainNavigation.map((item) => (
                <Link key={item.id} href={item.href}>
                  <Button
                    variant={location === item.href ? "default" : "ghost"}
                    className={`text-sm ${
                      location === item.href 
                        ? "bg-gradient-to-r from-gf-pink to-gf-purple" 
                        : "text-gf-snow hover:bg-gf-smoke/20"
                    }`}
                    data-testid={`nav-${item.id}`}
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.label}
                    {item.badge && (
                      <Badge className="ml-2 bg-gf-cyan text-gf-ink text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </Button>
                </Link>
              ))}
            </nav>

            {/* Search and Actions */}
            <div className="flex items-center space-x-4">
              {/* Quick Search */}
              <div className="hidden md:flex items-center">
                <Button
                  variant="ghost"
                  onClick={() => setIsCommandPaletteOpen(true)}
                  className="text-gf-snow hover:bg-gf-smoke/20 text-sm"
                  data-testid="button-command-palette"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search
                  <kbd className="ml-2 text-xs bg-gf-smoke/20 px-2 py-1 rounded">⌘K</kbd>
                </Button>
              </div>

              {/* Notifications */}
              <Button
                variant="ghost"
                size="sm"
                className="text-gf-snow hover:bg-gf-smoke/20 relative"
                data-testid="button-notifications"
              >
                <Bell className="w-5 h-5" />
                <Badge className="absolute -top-2 -right-2 bg-gf-pink text-gf-ink text-xs">
                  3
                </Badge>
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gf-snow hover:bg-gf-smoke/20"
                    data-testid="button-user-menu"
                  >
                    <User className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-gf-ink border-gf-smoke/20">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-gf-snow">{(user as any)?.firstName || (user as any)?.username || 'User'}</p>
                    <p className="text-xs text-gf-smoke">{(user as any)?.email}</p>
                    <Badge className="mt-1 bg-gf-purple text-xs">
                      {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                    </Badge>
                  </div>
                  <DropdownMenuSeparator className="bg-gf-smoke/20" />
                  {accountNavigation.map((item) => (
                    <DropdownMenuItem key={item.id} asChild>
                      <Link href={item.href} className="flex items-center text-gf-snow hover:bg-gf-smoke/20">
                        <item.icon className="w-4 h-4 mr-2" />
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator className="bg-gf-smoke/20" />
                  <DropdownMenuItem 
                    onClick={() => {
                      // For now, redirect to logout - this would integrate with auth service
                      window.location.href = '/api/auth/logout';
                    }}
                    className="text-gf-snow hover:bg-gf-smoke/20"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Breadcrumbs */}
          {breadcrumbs.length > 1 && (
            <div className="flex items-center space-x-2 pb-4">
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.href} className="flex items-center space-x-2">
                  {index > 0 && (
                    <ChevronRight className="w-4 h-4 text-gf-smoke" />
                  )}
                  <Link 
                    href={crumb.href}
                    className={`text-sm ${
                      index === breadcrumbs.length - 1
                        ? "text-gf-snow font-medium"
                        : "text-gf-smoke hover:text-gf-snow"
                    }`}
                  >
                    {crumb.label}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gf-smoke/20 bg-gf-ink">
            <ScrollArea className="h-96">
              <div className="px-4 py-4 space-y-2">
                {navigationItems.map((item) => (
                  <Link key={item.id} href={item.href}>
                    <Button
                      variant="ghost"
                      className={`w-full justify-start text-left ${
                        location === item.href ? "bg-gf-smoke/20" : ""
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <item.icon className="w-5 h-5 mr-3" />
                      {item.label}
                      {item.badge && (
                        <Badge className="ml-auto bg-gf-cyan text-gf-ink text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </Button>
                  </Link>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </header>

      {/* Command Palette */}
      <Dialog open={isCommandPaletteOpen} onOpenChange={setIsCommandPaletteOpen}>
        <DialogContent className="sm:max-w-md bg-gf-ink border-gf-smoke/20">
          <DialogHeader>
            <DialogTitle className="text-gf-snow flex items-center">
              <Command className="w-5 h-5 mr-2" />
              Quick Actions
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <Input
              placeholder="Search commands..."
              value={commandSearch}
              onChange={(e) => setCommandSearch(e.target.value)}
              className="bg-gf-smoke/10 border-gf-smoke/20 text-gf-snow placeholder:text-gf-smoke"
              data-testid="input-command-search"
            />
            
            <ScrollArea className="h-80">
              <div className="space-y-4">
                {Object.entries(groupedCommands).map(([group, commands]) => (
                  <div key={group}>
                    <h4 className="text-sm font-medium text-gf-smoke mb-2 capitalize">
                      {group}
                    </h4>
                    <div className="space-y-1">
                      {commands.map((command) => (
                        <Button
                          key={command.id}
                          variant="ghost"
                          className="w-full justify-start text-left hover:bg-gf-smoke/20"
                          onClick={() => handleCommandSelect(command)}
                          data-testid={`command-${command.id}`}
                        >
                          <command.icon className="w-4 h-4 mr-3" />
                          {command.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
                
                {filteredCommands.length === 0 && (
                  <div className="text-center py-6 text-gf-smoke">
                    No commands found
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}