import { Bell, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Topbar() {
  return (
    <header className="bg-card border-b border-border p-6" data-testid="topbar">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" data-testid="page-title">Affiliate Dashboard</h2>
          <p className="text-muted-foreground" data-testid="page-description">
            Welcome back, manage your campaigns and track performance
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge 
            className="bg-accent text-accent-foreground hover:bg-accent/80" 
            data-testid="kyc-status-badge"
          >
            <div className="w-2 h-2 bg-accent-foreground rounded-full status-pulse mr-2"></div>
            KYC Verified
          </Badge>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative text-muted-foreground hover:text-foreground"
            data-testid="notifications-button"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full text-xs flex items-center justify-center text-destructive-foreground">
              3
            </span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="w-8 h-8 bg-secondary rounded-full text-muted-foreground"
            data-testid="user-menu"
          >
            <User className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
