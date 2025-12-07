import { Shield, Zap, DollarSign, Users, Eye, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const advantages = [
  {
    title: "0% Platform Fees",
    description: "Keep 100% of your earnings",
    detail: "Unlike traditional networks that take 20-40%, you keep every dollar you earn",
    icon: DollarSign,
    highlight: "100% Yours",
    bgColor: "bg-primary/20",
    iconColor: "text-primary",
  },
  {
    title: "Adult-Friendly",
    description: "Built for creators, LGBTQIA+, and sex-positive content",
    detail: "No content restrictions or surprise bans like traditional affiliate networks",
    icon: Shield,
    highlight: "Inclusive",
    bgColor: "bg-chart-3/20", 
    iconColor: "text-chart-3",
  },
  {
    title: "FUN Ecosystem",
    description: "Native integration with BoyFanz, GirlFanz, PupFanz",
    detail: "Deep linking and cross-promotion across the entire FUN platform",
    icon: Zap,
    highlight: "Connected",
    bgColor: "bg-chart-2/20",
    iconColor: "text-chart-2",
  },
  {
    title: "Creator-to-Creator",
    description: "Affiliates can be creators promoting other creators",
    detail: "Community-powered affiliate ecosystem where starz promote starz",
    icon: Users,
    highlight: "Community",
    bgColor: "bg-chart-4/20",
    iconColor: "text-chart-4",
  },
  {
    title: "Multi-Layer Tracking",
    description: "Server-to-server + fingerprinting + geo-validation",
    detail: "Advanced attribution beyond cookie tracking for maximum accuracy",
    icon: Eye,
    highlight: "Precise",
    bgColor: "bg-accent/20",
    iconColor: "text-accent",
  },
  {
    title: "Full Compliance",
    description: "2257 records, age verification, moderation workflow",
    detail: "Built-in compliance tools designed for adult industry standards",
    icon: CheckCircle,
    highlight: "Compliant",
    bgColor: "bg-chart-1/20",
    iconColor: "text-chart-1",
  },
];

export default function CompetitiveAdvantages() {
  return (
    <Card className="gradient-card border-border" data-testid="competitive-advantages">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          Why FanzFiliate vs Traditional Networks
        </CardTitle>
        <p className="text-muted-foreground text-sm">
          The world's first adult-compliant affiliate engine where creators keep 100%
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {advantages.map((advantage) => {
            const Icon = advantage.icon;
            
            return (
              <div 
                key={advantage.title} 
                className="p-4 border border-border rounded-lg hover-neon transition-all duration-200"
                data-testid={`advantage-${advantage.title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 ${advantage.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${advantage.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm">{advantage.title}</h3>
                      <Badge variant="secondary" className="text-xs neon-glow">
                        {advantage.highlight}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {advantage.description}
                    </p>
                    <p className="text-xs text-accent">
                      {advantage.detail}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-primary" />
            <h4 className="font-semibold text-sm neon-text">FanzFiliate vs Traditional Networks</h4>
          </div>
          <p className="text-xs text-muted-foreground">
            While Impact, CJ, Rakuten, and other networks ban adult content and take huge cuts, 
            FanzFiliate is built-in, transparent, and community-powered for the creator economy.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}