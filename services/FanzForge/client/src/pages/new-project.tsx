import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { InsertProject } from "@shared/schema";

const templates = [
  {
    id: 'creator-paywall-dm',
    name: 'Creator Paywall + DM',
    description: 'Membership tiers, direct messaging, tip-to-unlock content with 2257 compliance',
    stack: 'nextjs-node',
    category: 'Creator',
    icon: 'fas fa-credit-card',
    color: 'primary',
    setupTime: '5 min',
    features: ['Membership Tiers', 'Direct Messaging', 'Pay-per-view', '2257 Compliance', 'Payment Processing'],
    popular: true,
  },
  {
    id: 'crud-admin-panel',
    name: 'CRUD Admin Panel',
    description: 'User management, content moderation, analytics dashboard with compliance tools',
    stack: 'fastapi-python',
    category: 'Admin',
    icon: 'fas fa-table',
    color: 'secondary',
    setupTime: '3 min',
    features: ['User Management', 'Content Moderation', 'Analytics Dashboard', 'Admin Auth', 'Audit Logs'],
    popular: false,
  },
  {
    id: 'content-marketplace',
    name: 'Content Marketplace',
    description: 'Digital storefront with affiliate system, coupons, time-bomb links and payment processing',
    stack: 'nextjs-node',
    category: 'E-commerce',
    icon: 'fas fa-store',
    color: 'accent',
    setupTime: '7 min',
    features: ['Digital Storefront', 'Affiliate System', 'Coupon Management', 'Time-bomb Links', 'Analytics'],
    popular: true,
  },
  {
    id: 'adult-tube-platform',
    name: 'Adult Tube Platform',
    description: 'Video tube site with categorization, user uploads, API integration, and 2257 compliance',
    stack: 'nextjs-node',
    category: 'Adult',
    icon: 'fas fa-play-circle',
    color: 'primary',
    setupTime: '12 min',
    features: ['Video Hosting', 'User Uploads', 'Content Categorization', 'API Integration', '2257 Compliance', 'Search & Filtering'],
    popular: true,
  },
  {
    id: 'adult-content-aggregator',
    name: 'Adult Content Aggregator',
    description: 'Multi-source content aggregation with API scraping, auto-categorization, and feed management',
    stack: 'nextjs-node',
    category: 'Adult',
    icon: 'fas fa-rss',
    color: 'accent',
    setupTime: '15 min',
    features: ['Multi-source Scraping', 'Auto-categorization', 'Feed Management', 'API Wrappers', 'Content Syndication', 'Duplicate Detection'],
    popular: true,
  },
  {
    id: 'cam-site-platform',
    name: 'Cam Site Platform',
    description: 'Live streaming platform with tips, private shows, token system, and performer tools',
    stack: 'nextjs-node',
    category: 'Adult',
    icon: 'fas fa-video',
    color: 'primary',
    setupTime: '18 min',
    features: ['Live Streaming', 'Token System', 'Private Shows', 'Performer Dashboard', 'Tip Integration', 'Recording & Playback'],
    popular: true,
  },
  {
    id: 'adult-cms-portal',
    name: 'Adult CMS Portal',
    description: 'Content management system with bulk uploads, metadata editing, and API distribution',
    stack: 'fastapi-python',
    category: 'Adult',
    icon: 'fas fa-edit',
    color: 'secondary',
    setupTime: '10 min',
    features: ['Bulk Content Upload', 'Metadata Management', 'API Distribution', 'Content Scheduling', 'Version Control', 'Access Controls'],
    popular: false,
  },
  {
    id: 'adult-api-scraper',
    name: 'Adult API & Scraper Suite',
    description: 'Multi-platform scraping tools with API wrappers, data normalization, and syndication',
    stack: 'fastapi-python',
    category: 'Adult',
    icon: 'fas fa-code',
    color: 'secondary',
    setupTime: '20 min',
    features: ['Multi-platform Scrapers', 'API Wrappers', 'Data Normalization', 'Rate Limiting', 'Content Syndication', 'Proxy Management'],
    popular: false,
  },
  {
    id: 'adult-affiliate-network',
    name: 'Adult Affiliate Network',
    description: 'Affiliate tracking system with link management, commission tracking, and payout automation',
    stack: 'nextjs-node',
    category: 'Adult',
    icon: 'fas fa-network-wired',
    color: 'accent',
    setupTime: '14 min',
    features: ['Link Management', 'Commission Tracking', 'Payout Automation', 'Performance Analytics', 'Fraud Detection', 'Multi-tier Commissions'],
    popular: false,
  },
  {
    id: 'adult-paywall-system',
    name: 'Adult Paywall System',
    description: 'Advanced paywall with age verification, payment processing, and content protection',
    stack: 'nextjs-node',
    category: 'Adult',
    icon: 'fas fa-lock',
    color: 'primary',
    setupTime: '8 min',
    features: ['Age Verification', 'Payment Processing', 'Content Protection', 'Access Control', 'Subscription Management', 'Anti-piracy'],
    popular: true,
  },
  {
    id: 'adult-clip-store',
    name: 'Adult Clip Store',
    description: 'Digital clip marketplace with preview generation, watermarking, and revenue sharing',
    stack: 'nextjs-node',
    category: 'Adult',
    icon: 'fas fa-film',
    color: 'accent',
    setupTime: '16 min',
    features: ['Clip Marketplace', 'Preview Generation', 'Watermarking', 'Revenue Sharing', 'Digital Rights Management', 'Creator Tools'],
    popular: true,
  },
  {
    id: 'fan-subscription',
    name: 'Fan Subscription Platform',
    description: 'Recurring subscription management with exclusive content and fan interaction features',
    stack: 'nextjs-node',
    category: 'Creator',
    icon: 'fas fa-heart',
    color: 'primary',
    setupTime: '6 min',
    features: ['Subscription Management', 'Exclusive Content', 'Fan Interaction', 'Recurring Billing', 'Creator Dashboard'],
    popular: false,
  },
  {
    id: 'live-streaming',
    name: 'Live Streaming Platform',
    description: 'Real-time streaming with tips, private shows, and viewer interaction',
    stack: 'nextjs-node',
    category: 'Creator',
    icon: 'fas fa-video',
    color: 'primary',
    setupTime: '10 min',
    features: ['Live Streaming', 'Real-time Tips', 'Private Shows', 'Chat System', 'Recording'],
    popular: true,
  },
  {
    id: 'compliance-center',
    name: '2257 Compliance Center',
    description: 'Complete compliance management with age verification, record keeping, and auditing',
    stack: 'fastapi-python',
    category: 'Compliance',
    icon: 'fas fa-shield-alt',
    color: 'secondary',
    setupTime: '4 min',
    features: ['Age Verification', 'Record Keeping', 'Audit Trails', 'Document Management', 'Compliance Reports'],
    popular: false,
  },
];

export default function NewProject() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");

  // Handle URL template parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const templateParam = urlParams.get('template');
    if (templateParam && templates.find(t => t.id === templateParam)) {
      setSelectedTemplate(templateParam);
    }
  }, [location]);

  const createProjectMutation = useMutation({
    mutationFn: async (data: InsertProject) => {
      const response = await apiRequest("POST", "/api/projects", data);
      return await response.json();
    },
    onSuccess: (project: any) => {
      toast({
        title: "Project Created",
        description: `${project.name} has been created successfully!`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setLocation(`/project/${project.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      });
      console.error("Error creating project:", error);
    },
  });

  const handleCreateProject = () => {
    if (!projectName.trim()) {
      toast({
        title: "Project Name Required",
        description: "Please enter a name for your project.",
        variant: "destructive",
      });
      return;
    }

    const template = templates.find(t => t.id === selectedTemplate);
    
    createProjectMutation.mutate({
      name: projectName,
      description: projectDescription || `${template?.name || 'Custom'} project`,
      template: selectedTemplate || 'custom',
      stack: template?.stack || 'nextjs-node',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/")}
            className="mb-4"
            data-testid="button-back"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back to Dashboard
          </Button>
          
          <h1 className="text-3xl font-bold mb-2">Create New Project</h1>
          <p className="text-muted-foreground">
            Choose a template to get started quickly, or create a custom project from scratch.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Template Selection */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Choose Template</h2>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {templates.map((template) => (
                <Card 
                  key={template.id}
                  className={`cursor-pointer transition-all ${
                    selectedTemplate === template.id 
                      ? 'neon-border shadow-lg' 
                      : 'hover:shadow-md border-border'
                  }`}
                  onClick={() => setSelectedTemplate(template.id)}
                  data-testid={`template-${template.id}`}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={`bg-${template.color}/20 text-${template.color} border-${template.color}/30`}>
                        {template.category}
                      </Badge>
                      <i className={`${template.icon} text-${template.color}`}></i>
                    </div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <i className="fas fa-clock"></i>
                      <span>{template.setupTime} setup</span>
                      <span>•</span>
                      <i className="fas fa-code"></i>
                      <span>{template.stack.replace('-', ' ')}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Custom Option */}
              <Card 
                className={`cursor-pointer transition-all ${
                  selectedTemplate === null 
                    ? 'neon-border shadow-lg' 
                    : 'hover:shadow-md border-border'
                }`}
                onClick={() => setSelectedTemplate(null)}
                data-testid="template-custom"
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-muted/20 text-muted-foreground border-muted">
                      Custom
                    </Badge>
                    <i className="fas fa-wrench text-muted-foreground"></i>
                  </div>
                  <CardTitle className="text-lg">Start from Scratch</CardTitle>
                  <CardDescription>
                    Create a blank project and build exactly what you need with AI assistance.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <i className="fas fa-infinity"></i>
                    <span>Custom setup</span>
                    <span>•</span>
                    <i className="fas fa-code"></i>
                    <span>Your choice</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Project Details */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
                <CardDescription>
                  Configure your new project settings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="project-name">Project Name</Label>
                  <Input
                    id="project-name"
                    placeholder="My Creator App"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    data-testid="input-project-name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="project-description">Description (Optional)</Label>
                  <Textarea
                    id="project-description"
                    placeholder="Describe your project..."
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    data-testid="input-project-description"
                  />
                </div>

                {selectedTemplate && (
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Template Features:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {selectedTemplate === 'creator-paywall-dm' && (
                        <>
                          <li>• Membership tier management</li>
                          <li>• Direct messaging system</li>
                          <li>• Pay-per-view content</li>
                          <li>• 2257 compliance tools</li>
                        </>
                      )}
                      {selectedTemplate === 'crud-admin-panel' && (
                        <>
                          <li>• User management dashboard</li>
                          <li>• Content moderation tools</li>
                          <li>• Analytics & reporting</li>
                          <li>• Admin authentication</li>
                        </>
                      )}
                      {selectedTemplate === 'content-marketplace' && (
                        <>
                          <li>• Digital product storefront</li>
                          <li>• Payment processing</li>
                          <li>• Affiliate system</li>
                          <li>• Coupon management</li>
                        </>
                      )}
                    </ul>
                  </div>
                )}

                <Button 
                  className="w-full"
                  onClick={handleCreateProject}
                  disabled={createProjectMutation.isPending}
                  data-testid="button-create-project"
                >
                  {createProjectMutation.isPending ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Creating...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-plus mr-2"></i>
                      Create Project
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}