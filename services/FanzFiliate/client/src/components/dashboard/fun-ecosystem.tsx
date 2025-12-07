import { Link2, Users, Zap, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const funPlatforms = [
  {
    name: "BoyFanz",
    description: "Male content creators",
    status: "Connected",
    color: "bg-blue-500/20 text-blue-400",
    users: "12.5K",
  },
  {
    name: "GirlFanz",
    description: "Female content creators", 
    status: "Connected",
    color: "bg-pink-500/20 text-pink-400",
    users: "18.2K",
  },
  {
    name: "PupFanz",
    description: "Pet play & kink community",
    status: "Connected", 
    color: "bg-purple-500/20 text-purple-400",
    users: "6.8K",
  },
  {
    name: "FanzCommerce",
    description: "Creator storefronts",
    status: "Connected",
    color: "bg-green-500/20 text-green-400",
    users: "3.1K",
  },
];

export default function FunEcosystem() {
  return (
    <Card className="gradient-card border-border" data-testid="fun-ecosystem">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          FUN Ecosystem Integration
        </CardTitle>
        <p className="text-muted-foreground text-sm">
          Native deep-linking across all FUN platforms
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {funPlatforms.map((platform) => (
            <div 
              key={platform.name}
              className="p-3 border border-border rounded-lg hover-neon transition-all duration-200"
              data-testid={`platform-${platform.name.toLowerCase()}`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm">{platform.name}</h3>
                <Badge className={platform.color}>
                  {platform.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-1">
                {platform.description}
              </p>
              <div className="flex items-center gap-2">
                <Users className="w-3 h-3 text-accent" />
                <span className="text-xs text-accent">{platform.users} creators</span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
          <Link2 className="w-4 h-4" />
          <span>Generate tracking links for any FUN platform page</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs"
            data-testid="cross-promo-button"
          >
            <Globe className="w-3 h-3 mr-1" />
            Cross-Promote
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs"
            data-testid="deep-link-button"
          >
            <Link2 className="w-3 h-3 mr-1" />
            Deep Link Generator
          </Button>
        </div>
        
        <div className="mt-4 p-3 bg-accent/10 border border-accent/20 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong className="text-accent">Exclusive:</strong> Unlike traditional affiliate networks, 
            promote creator-to-creator collaborations across the entire FUN ecosystem.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}