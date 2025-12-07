import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ToolCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  href: string;
  gradient: string;
}

export default function ToolCard({ 
  title, 
  description, 
  icon, 
  badge, 
  badgeColor = "bg-accent", 
  href, 
  gradient 
}: ToolCardProps) {
  return (
    <Card className="hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-purple-200 group h-full bg-white/80 backdrop-blur-sm rounded-3xl creative-shadow card-3d relative overflow-hidden">
      <CardHeader>
        {/* Animated background blob */}
        <div className="absolute -top-10 -right-10 w-20 h-20 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full interactive-blob opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        <div className="flex items-center mb-4">
          <div className={`w-12 h-12 ${gradient} rounded-2xl flex items-center justify-center mr-4 transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 pulse-glow`}>
            {icon}
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg text-main group-hover:text-purple-600 transition-colors duration-300">{title}</CardTitle>
            {badge && (
              <Badge className={`mt-1 text-xs ${badgeColor} text-white transform group-hover:scale-105 transition-transform duration-300`} data-testid={`badge-${title.toLowerCase().replace(/\s+/g, '-')}`}>
                {badge}
              </Badge>
            )}
          </div>
        </div>
        <CardDescription className="text-gray-600 group-hover:text-gray-700 transition-colors duration-300">{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <Link href={href}>
          <Button 
            className="w-full gradient-creator text-white hover:scale-110 hover:rotate-1 transition-all duration-300 font-semibold rounded-2xl group/button relative overflow-hidden"
            data-testid={`button-${title.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <span className="relative z-10">Try Now</span>
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover/button:opacity-100 transition-opacity duration-300 transform -translate-x-full group-hover/button:translate-x-0"></div>
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
