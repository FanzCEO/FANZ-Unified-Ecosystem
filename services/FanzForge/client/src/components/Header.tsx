import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AdultAIModal from "@/components/AdultAIModal";

export default function Header() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  return (
    <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4 z-50">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
            <i className="fas fa-bolt text-sm text-primary-foreground"></i>
          </div>
          <span className="text-xl font-bold neon-text">FANZ Forge</span>
        </div>
        <nav className="hidden md:flex items-center space-x-6">
          <button 
            onClick={() => setLocation("/")}
            className="text-muted-foreground hover:text-primary transition-colors" 
            data-testid="nav-projects"
          >
            Projects
          </button>
          <button 
            onClick={() => setLocation("/templates")}
            className="text-muted-foreground hover:text-secondary transition-colors" 
            data-testid="nav-templates"
          >
            Templates
          </button>
          <button 
            onClick={() => setLocation('/marketplace')}
            className="text-muted-foreground hover:text-accent transition-colors" 
            data-testid="nav-marketplace"
          >
            Marketplace
          </button>
          <button 
            onClick={() => setLocation('/analytics')}
            className="text-muted-foreground hover:text-primary transition-colors" 
            data-testid="nav-analytics"
          >
            Analytics
          </button>
        </nav>
      </div>
      <div className="flex items-center space-x-4">
        <Button 
          onClick={() => setLocation("/new-project")}
          className="px-3 py-1.5 bg-muted rounded-md text-sm hover:bg-primary hover:text-primary-foreground transition-colors"
          data-testid="button-new-project"
        >
          <i className="fas fa-plus mr-2"></i>New Project
        </Button>
        <AdultAIModal />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center space-x-2 cursor-pointer" data-testid="dropdown-user-menu">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.firstName || "User"} />
                <AvatarFallback className="bg-gradient-to-r from-secondary to-accent text-xs">
                  {user?.firstName?.[0] || user?.email?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm hidden md:inline">
                {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email}
              </span>
              <i className="fas fa-chevron-down text-xs text-muted-foreground"></i>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem 
              onClick={() => setLocation('/profile')}
              data-testid="menu-profile"
            >
              <i className="fas fa-user mr-2"></i>
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setLocation('/settings')}
              data-testid="menu-settings"
            >
              <i className="fas fa-cog mr-2"></i>
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setLocation('/billing')}
              data-testid="menu-billing"
            >
              <i className="fas fa-credit-card mr-2"></i>
              Billing
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => window.location.href = "/api/logout"}
              data-testid="menu-logout"
            >
              <i className="fas fa-sign-out-alt mr-2"></i>
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
