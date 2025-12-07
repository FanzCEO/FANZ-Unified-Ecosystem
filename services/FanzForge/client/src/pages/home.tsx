import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/Header";
import ChatBubble from "@/components/ChatBubble";
import OnboardingTour from "@/components/OnboardingTour";
import TourButton from "@/components/TourButton";
import { useTour, homeTourSteps } from "@/hooks/useTour";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import type { Project } from "@shared/schema";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { isTourActive, completeTour, skipTour } = useTour();

  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    retry: false,
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center mb-4 animate-neon-pulse">
            <i className="fas fa-bolt text-2xl text-primary-foreground"></i>
          </div>
          <div className="text-lg font-medium">Loading FANZ Forge...</div>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <Header />
        <ChatBubble />
        <TourButton />
        <OnboardingTour
          steps={homeTourSteps}
          isActive={isTourActive}
          onComplete={completeTour}
          onSkip={skipTour}
        />
        
        <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Welcome to <span className="neon-text">FANZ Forge</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Build creator economy apps with AI-powered development tools
          </p>
          
          <div className="flex items-center space-x-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="lg"
                  onClick={() => setLocation("/new-project")}
                  className="px-8 py-4 bg-primary text-primary-foreground hover:shadow-lg animate-neon-pulse"
                  data-testid="button-new-project"
                >
                  <i className="fas fa-plus mr-2"></i>
                  New Project
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Create a new project from scratch or using templates</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => setLocation("/templates")}
                  className="px-8 py-4 border-secondary text-secondary hover:bg-secondary/10"
                  data-testid="button-browse-templates"
                >
                  <i className="fas fa-template mr-2"></i>
                  Browse Templates
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Explore our collection of creator economy templates</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="px-8 py-4 border-accent text-accent hover:bg-accent/10"
                  data-testid="button-ai-agent"
                >
                  <i className="fas fa-robot mr-2"></i>
                  Ask AI Agent
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Get AI-powered help with your development needs</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Quick Start Templates */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Quick Start Templates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card 
              className="neon-border hover:shadow-lg transition-all cursor-pointer" 
              onClick={() => setLocation("/new-project?template=creator-paywall-dm")}
              data-testid="card-template-paywall"
            >
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Badge className="bg-primary/20 text-primary border-primary/30">Creator</Badge>
                  <i className="fas fa-credit-card text-primary"></i>
                </div>
                <CardTitle>Creator Paywall + DM</CardTitle>
                <CardDescription>
                  Membership tiers, direct messaging, tip-to-unlock content with 2257 compliance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <i className="fas fa-clock"></i>
                  <span>5 min setup</span>
                  <span>•</span>
                  <i className="fas fa-code"></i>
                  <span>Next.js</span>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="neon-border hover:shadow-lg transition-all cursor-pointer" 
              onClick={() => setLocation("/new-project?template=crud-admin-panel")}
              data-testid="card-template-admin"
            >
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Badge className="bg-secondary/20 text-secondary border-secondary/30">Admin</Badge>
                  <i className="fas fa-table text-secondary"></i>
                </div>
                <CardTitle>CRUD Admin Panel</CardTitle>
                <CardDescription>
                  User management, content moderation, analytics dashboard with compliance tools
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <i className="fas fa-clock"></i>
                  <span>3 min setup</span>
                  <span>•</span>
                  <i className="fas fa-code"></i>
                  <span>FastAPI</span>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="neon-border hover:shadow-lg transition-all cursor-pointer" 
              onClick={() => setLocation("/new-project?template=content-marketplace")}
              data-testid="card-template-marketplace"
            >
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Badge className="bg-accent/20 text-accent border-accent/30">E-commerce</Badge>
                  <i className="fas fa-store text-accent"></i>
                </div>
                <CardTitle>Content Marketplace</CardTitle>
                <CardDescription>
                  Digital storefront with affiliate system, coupons, time-bomb links and payment processing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <i className="fas fa-clock"></i>
                  <span>7 min setup</span>
                  <span>•</span>
                  <i className="fas fa-code"></i>
                  <span>Full-stack</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Projects */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Recent Projects</h2>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setLocation("/templates")}
                  data-testid="button-view-all"
                >
                  View All
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View all your projects and templates</p>
              </TooltipContent>
            </Tooltip>
          </div>
          
          {projectsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-3 bg-muted rounded w-full mb-2"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : projects && projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project: any) => (
                <Card 
                  key={project.id} 
                  className="neon-border hover:shadow-lg transition-all cursor-pointer" 
                  onClick={() => setLocation(`/project/${project.id}`)}
                  data-testid={`card-project-${project.id}`}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={`bg-${project.status === 'deployed' ? 'accent' : 'primary'}/20 text-${project.status === 'deployed' ? 'accent' : 'primary'} border-${project.status === 'deployed' ? 'accent' : 'primary'}/30`}>
                        {project.status === 'deployed' ? 'Live' : 'Building'}
                      </Badge>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${project.status === 'deployed' ? 'bg-accent animate-pulse' : 'bg-primary'}`}></div>
                      </div>
                    </div>
                    <CardTitle>{project.name}</CardTitle>
                    <CardDescription>{project.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <i className="fas fa-code"></i>
                        <span>{project.stack}</span>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocation(`/project/${project.id}`);
                        }}
                        data-testid={`button-open-${project.id}`}
                      >
                        <i className="fas fa-external-link-alt mr-2"></i>
                        Open
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-folder-open text-2xl text-muted-foreground"></i>
                </div>
                <h3 className="text-lg font-medium mb-2">No projects yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first creator app with our AI-powered templates
                </p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      onClick={() => setLocation("/new-project")}
                      data-testid="button-create-first-project"
                    >
                      <i className="fas fa-plus mr-2"></i>
                      Create Your First Project
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Start building your first creator economy application</p>
                  </TooltipContent>
                </Tooltip>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
    </TooltipProvider>
  );
}
