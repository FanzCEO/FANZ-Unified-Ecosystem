import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Globe,
  Briefcase,
  Radio,
  Video,
  Smartphone,
  Cpu,
  GraduationCap,
  Link,
  ShoppingCart,
  Sparkles,
  BarChart3,
  ExternalLink,
  Zap,
  Users,
  Bot,
  Play,
} from "lucide-react";
import type { Platform, Service, AiTour } from "@shared/schema";

export default function PlatformsServices() {
  const [selectedTab, setSelectedTab] = useState("platforms");
  const [showAiTour, setShowAiTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  // Query for platforms data
  const { data: platforms, isLoading: platformsLoading } = useQuery<Platform[]>(
    {
      queryKey: ["/api/platforms"],
    },
  );

  // Query for services data
  const { data: services, isLoading: servicesLoading } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  // Query for AI tours data
  const { data: aiTours, isLoading: toursLoading } = useQuery<AiTour[]>({
    queryKey: ["/api/ai-tours"],
  });

  const handleStartTour = () => {
    setShowAiTour(true);
    setTourStep(0);
  };

  const handleNextTourStep = () => {
    if (
      aiTours &&
      aiTours.length > 0 &&
      Array.isArray(aiTours[0].steps) &&
      tourStep < aiTours[0].steps.length - 1
    ) {
      setTourStep(tourStep + 1);
    } else {
      setShowAiTour(false);
      setTourStep(0);
    }
  };

  const handlePlatformVisit = (platform: Platform) => {
    // Open platform in new tab
    window.open(`https://${platform.domain}`, '_blank');
  };

  const handlePlatformAPI = (platform: Platform) => {
    // Open API documentation or dashboard in new tab
    window.open(`https://${platform.domain}/api`, '_blank');
  };

  const handleServiceLaunch = (service: Service) => {
    // Launch service application
    if (service.url) {
      window.open(service.url, '_blank');
    } else {
      // Fallback to service-specific URL pattern
      const serviceUrl = `https://${service.name.toLowerCase()}.fanz.foundation`;
      window.open(serviceUrl, '_blank');
    }
  };

  const handleServiceConnect = (service: Service) => {
    // Connect to service API or configuration
    if (service.apiEndpoint) {
      window.open(service.apiEndpoint, '_blank');
    } else {
      // Fallback to service API pattern
      const apiUrl = `https://api.${service.name.toLowerCase()}.fanz.foundation`;
      window.open(apiUrl, '_blank');
    }
  };

  const getServiceIcon = (serviceName: string) => {
    switch (serviceName.toLowerCase()) {
      case "fanzwork":
        return <Briefcase className="w-6 h-6" />;
      case "fanzradiopod":
        return <Radio className="w-6 h-6" />;
      case "fanztube":
        return <Video className="w-6 h-6" />;
      case "fanzcock":
        return <Smartphone className="w-6 h-6" />;
      case "fanzcentral":
        return <Users className="w-6 h-6" />;
      case "fanzforge":
        return <Cpu className="w-6 h-6" />;
      case "fanzvarsity":
        return <GraduationCap className="w-6 h-6" />;
      case "fanzlink":
        return <Link className="w-6 h-6" />;
      case "fanzcommerce":
        return <ShoppingCart className="w-6 h-6" />;
      case "starzstudio":
        return <Sparkles className="w-6 h-6" />;
      case "fanzsocial":
        return <BarChart3 className="w-6 h-6" />;
      default:
        return <Globe className="w-6 h-6" />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Simple Header */}
      <div className="border-b border-border py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">Platform Ecosystem</h1>
          <p className="text-muted-foreground">
            Discover all platforms and services in the FUN network
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs
          value={selectedTab}
          onValueChange={setSelectedTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="platforms" data-testid="tab-platforms">
              <Globe className="w-4 h-4 mr-2" />
              Platforms
            </TabsTrigger>
            <TabsTrigger value="services" data-testid="tab-services">
              <Zap className="w-4 h-4 mr-2" />
              Services
            </TabsTrigger>
          </TabsList>

          {/* Platforms Tab */}
          <TabsContent value="platforms" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {platformsLoading
                ? [...Array(6)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader>
                        <div className="h-6 bg-muted rounded w-3/4"></div>
                        <div className="h-4 bg-muted rounded w-1/2"></div>
                      </CardHeader>
                      <CardContent>
                        <div className="h-20 bg-muted rounded"></div>
                      </CardContent>
                    </Card>
                  ))
                : platforms?.map((platform) => (
                    <Card
                      key={platform.id}
                      className="border-2 border-purple-500/20 bg-card hover:border-purple-400/40 transition-all"
                      data-testid={`card-platform-${platform.id}`}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg text-purple-400">
                            {platform.name}
                          </CardTitle>
                          <Badge
                            variant="secondary"
                            className="bg-purple-500/20 text-purple-300"
                          >
                            {platform.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {platform.domain}
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm">
                          Network: {platform.targetNetwork}
                        </p>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => handlePlatformVisit(platform)}
                            data-testid={`button-visit-${platform.id}`}
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Visit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => handlePlatformAPI(platform)}
                            data-testid={`button-api-${platform.id}`}
                          >
                            <Zap className="w-4 h-4 mr-2" />
                            API
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
            </div>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {servicesLoading
                ? [...Array(11)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader>
                        <div className="h-6 bg-muted rounded w-3/4"></div>
                        <div className="h-4 bg-muted rounded w-1/2"></div>
                      </CardHeader>
                      <CardContent>
                        <div className="h-20 bg-muted rounded"></div>
                      </CardContent>
                    </Card>
                  ))
                : services?.map((service) => (
                    <Card
                      key={service.id}
                      className="border-2 border-cyan-500/20 bg-card hover:border-cyan-400/40 transition-all"
                      data-testid={`card-service-${service.id}`}
                    >
                      <CardHeader>
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                            {getServiceIcon(service.name)}
                          </div>
                          <div>
                            <CardTitle className="text-lg text-cyan-400">
                              {service.displayName}
                            </CardTitle>
                            <Badge
                              variant="secondary"
                              className="bg-cyan-500/20 text-cyan-300 text-xs"
                            >
                              {service.category}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          {service.description}
                        </p>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => handleServiceLaunch(service)}
                            data-testid={`button-launch-${service.id}`}
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Launch
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleServiceConnect(service)}
                            data-testid={`button-connect-${service.id}`}
                          >
                            <Zap className="w-4 h-4 mr-2" />
                            Connect
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* AI Tour Option */}
        <div className="mt-12 border-t border-border pt-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">
              Need Help Getting Started?
            </h3>
            <p className="text-muted-foreground mb-4">
              Take an AI-guided tour to learn about the platform features
            </p>
            <Button
              variant="outline"
              onClick={handleStartTour}
              data-testid="button-start-tour"
            >
              <Bot className="w-4 h-4 mr-2" />
              Start AI Tour
            </Button>
          </div>
        </div>
      </div>

      {/* AI Tour Dialog */}
      {showAiTour && aiTours && aiTours.length > 0 && (
        <Dialog open={showAiTour} onOpenChange={setShowAiTour}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center text-purple-400">
                <Bot className="w-6 h-6 mr-2" />
                AI Tour Guide - {aiTours[0].name}
              </DialogTitle>
              <DialogDescription>
                Step {tourStep + 1} of{" "}
                {Array.isArray(aiTours[0].steps) ? aiTours[0].steps.length : 0}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {Array.isArray(aiTours[0].steps) &&
                aiTours[0].steps[tourStep] && (
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                    <h3 className="font-semibold text-purple-400 mb-2">
                      {(aiTours[0].steps[tourStep] as any).title}
                    </h3>
                    <p className="text-muted-foreground">
                      {(aiTours[0].steps[tourStep] as any).content}
                    </p>
                  </div>
                )}
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setShowAiTour(false)}
                  data-testid="button-skip-tour"
                >
                  Skip Tour
                </Button>
                <Button
                  onClick={handleNextTourStep}
                  data-testid="button-next-step"
                >
                  {Array.isArray(aiTours[0].steps) &&
                  tourStep < aiTours[0].steps.length - 1
                    ? "Next Step"
                    : "Complete Tour"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
