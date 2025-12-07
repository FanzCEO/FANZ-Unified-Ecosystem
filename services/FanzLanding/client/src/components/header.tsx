import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Bell } from "lucide-react";

interface HeaderProps {
  activeNetwork: string;
  onNetworkChange: (network: string) => void;
}

export default function Header({
  activeNetwork,
  onNetworkChange,
}: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const networks = [
    { id: "boyfanz", label: "BoyFanz" },
    { id: "girlfanz", label: "GirlFanz" },
    { id: "pupfanz", label: "PupFanz" },
    { id: "transfanz", label: "TransFanz" },
    { id: "kinkfanz", label: "KinkFanz" },
  ];

  return (
    <header className="bg-card border-b border-border sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="text-2xl font-black" data-testid="logo-text">
              FUN
            </div>
          </div>

          {/* Network Navigation Tabs */}
          <div className="flex items-center space-x-1 bg-secondary rounded-lg p-1">
            {networks.map((network) => (
              <button
                key={network.id}
                onClick={() => onNetworkChange(network.id)}
                className={`network-tab ${
                  activeNetwork === network.id ? "tab-active" : ""
                }`}
                data-testid={`tab-${network.id}`}
              >
                {network.label}
              </button>
            ))}
          </div>

          {/* Search and Profile */}
          <div className="flex items-center space-x-4">
            <div className="relative hidden md:block">
              <Input
                type="search"
                placeholder="Search creators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-secondary border-border pl-10 w-64 focus:ring-2 focus:ring-primary"
                data-testid="input-search"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="p-2"
              data-testid="button-notifications"
            >
              <Bell className="h-4 w-4" />
            </Button>
            <Button
              className="bg-accent text-accent-foreground hover:bg-opacity-90"
              data-testid="button-join-now"
            >
              Join Portal
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
