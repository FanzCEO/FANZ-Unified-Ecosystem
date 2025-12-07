import { Link, useLocation } from "wouter";
import { 
  ChartLine, 
  Handshake, 
  MousePointer, 
  DollarSign, 
  BarChart3, 
  IdCard,
  Zap,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const navigationItems = [
  {
    name: "Dashboard",
    href: "/",
    icon: ChartLine,
  },
  {
    name: "Offers",
    href: "/offers",
    icon: Handshake,
  },
  {
    name: "Tracking",
    href: "/tracking",
    icon: MousePointer,
  },
  {
    name: "Payouts",
    href: "/payouts",
    icon: DollarSign,
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    name: "KYC Status",
    href: "/kyc",
    icon: IdCard,
  },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col" data-testid="sidebar">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-full neon-glow flex items-center justify-center">
            <Zap className="text-primary-foreground w-4 h-4" />
          </div>
          <h1 className="text-xl font-bold neon-text">FanzFiliate</h1>
        </div>
        <div className="mt-4">
          <Select defaultValue="affiliate">
            <SelectTrigger data-testid="role-selector">
              <SelectValue placeholder="Select dashboard" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="affiliate">Affiliate Dashboard</SelectItem>
              <SelectItem value="advertiser">Advertiser Dashboard</SelectItem>
              <SelectItem value="admin">Admin Dashboard</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={cn(
                  "sidebar-nav-item",
                  isActive && "sidebar-nav-active"
                )}
                data-testid={`nav-${item.name.toLowerCase()}`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2" data-testid="user-profile">
          <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
            <User className="text-muted-foreground w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">John Affiliate</p>
            <p className="text-xs text-muted-foreground">ID: AFF-12345</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
