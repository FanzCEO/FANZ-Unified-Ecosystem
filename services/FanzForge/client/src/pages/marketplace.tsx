import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PaymentProcessorSelector } from "@/components/PaymentProcessorSelector";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Shield, Zap, Search, CheckCircle } from "lucide-react";

interface Plugin {
  id: string;
  name: string;
  version: string;
  type: string;
  manifest: {
    displayName: string;
    description: string;
    category: string;
    features?: string[];
  };
  isActive: boolean;
}

interface MarketplaceItem {
  id: string;
  name: string;
  description: string;
  category: string;
  price: string;
  rating: number;
  downloads: string;
  author: string;
  image: string;
  features: string[];
  type: 'plugin' | 'module' | 'template' | 'pipeline';
  tags: string[];
}

const marketplaceItems: MarketplaceItem[] = [
  {
    id: 'stripe-payment-gateway',
    name: 'Stripe Payment Gateway',
    description: 'Complete payment processing integration with subscription management and invoice generation',
    category: 'Payments',
    price: '$29',
    rating: 4.8,
    downloads: '2.3k',
    author: 'PaymentPro',
    image: 'fas fa-credit-card',
    features: ['Subscription Management', 'One-time Payments', 'Invoice Generation', 'Webhook Handling'],
    type: 'plugin',
    tags: ['payments', 'stripe', 'subscriptions', 'invoices']
  },
  {
    id: 'ai-content-moderator',
    name: 'AI Content Moderator',
    description: 'Automated content moderation using AI for text, images, and video with compliance reporting',
    category: 'AI & ML',
    price: '$49',
    rating: 4.9,
    downloads: '1.8k',
    author: 'ModerateAI',
    image: 'fas fa-robot',
    features: ['Text Analysis', 'Image Recognition', 'Video Processing', 'Compliance Reports'],
    type: 'module',
    tags: ['ai', 'moderation', 'compliance', 'safety']
  },
  {
    id: 'analytics-dashboard',
    name: 'Advanced Analytics Dashboard',
    description: 'Real-time analytics with custom metrics, user tracking, and revenue insights',
    category: 'Analytics',
    price: '$39',
    rating: 4.7,
    downloads: '3.1k',
    author: 'DataViz Studios',
    image: 'fas fa-chart-line',
    features: ['Real-time Metrics', 'User Tracking', 'Revenue Analytics', 'Custom Reports'],
    type: 'module',
    tags: ['analytics', 'metrics', 'tracking', 'reports']
  },
  {
    id: 'email-automation',
    name: 'Email Marketing Automation',
    description: 'Comprehensive email marketing with campaigns, sequences, and subscriber management',
    category: 'Marketing',
    price: '$35',
    rating: 4.6,
    downloads: '2.7k',
    author: 'EmailFlow',
    image: 'fas fa-envelope',
    features: ['Campaign Builder', 'Automated Sequences', 'Subscriber Segmentation', 'A/B Testing'],
    type: 'plugin',
    tags: ['email', 'marketing', 'automation', 'campaigns']
  },
  {
    id: 'video-streaming-pipeline',
    name: 'Live Video Streaming Pipeline',
    description: 'Complete video streaming solution with encoding, CDN delivery, and chat integration',
    category: 'Media',
    price: '$79',
    rating: 4.9,
    downloads: '1.2k',
    author: 'StreamTech',
    image: 'fas fa-video',
    features: ['Live Encoding', 'CDN Integration', 'Chat System', 'Recording & VOD'],
    type: 'pipeline',
    tags: ['video', 'streaming', 'live', 'cdn']
  },
  {
    id: 'user-auth-system',
    name: 'Multi-Provider Auth System',
    description: 'Authentication system supporting OAuth, SSO, 2FA, and user role management',
    category: 'Authentication',
    price: '$45',
    rating: 4.8,
    downloads: '4.2k',
    author: 'AuthPro',
    image: 'fas fa-shield-alt',
    features: ['OAuth Integration', 'Single Sign-On', 'Two-Factor Auth', 'Role Management'],
    type: 'module',
    tags: ['auth', 'oauth', 'sso', '2fa', 'security']
  },
  {
    id: 'seo-optimizer',
    name: 'SEO Optimization Suite',
    description: 'Complete SEO toolkit with keyword tracking, meta optimization, and performance monitoring',
    category: 'SEO',
    price: '$32',
    rating: 4.5,
    downloads: '1.9k',
    author: 'SEOBoost',
    image: 'fas fa-search',
    features: ['Keyword Tracking', 'Meta Optimization', 'Performance Monitoring', 'Sitemap Generation'],
    type: 'plugin',
    tags: ['seo', 'keywords', 'optimization', 'performance']
  },
  {
    id: 'chat-support-widget',
    name: 'Live Chat Support Widget',
    description: 'Real-time customer support with chat history, file sharing, and agent management',
    category: 'Support',
    price: '$28',
    rating: 4.7,
    downloads: '2.8k',
    author: 'SupportChat',
    image: 'fas fa-comments',
    features: ['Real-time Messaging', 'File Sharing', 'Chat History', 'Agent Dashboard'],
    type: 'plugin',
    tags: ['support', 'chat', 'customer-service', 'real-time']
  },
  {
    id: 'data-pipeline-etl',
    name: 'ETL Data Pipeline Builder',
    description: 'Visual data pipeline builder for extracting, transforming, and loading data from multiple sources',
    category: 'Data',
    price: '$65',
    rating: 4.6,
    downloads: '890',
    author: 'DataFlow Systems',
    image: 'fas fa-database',
    features: ['Visual Builder', 'Multiple Connectors', 'Data Transformation', 'Scheduled Processing'],
    type: 'pipeline',
    tags: ['data', 'etl', 'pipeline', 'automation']
  },
  {
    id: 'social-media-integration',
    name: 'Social Media Integration Hub',
    description: 'Unified social media posting, analytics, and engagement tracking across platforms',
    category: 'Social',
    price: '$42',
    rating: 4.4,
    downloads: '1.6k',
    author: 'SocialConnect',
    image: 'fas fa-share-alt',
    features: ['Multi-platform Posting', 'Engagement Analytics', 'Content Scheduling', 'Audience Insights'],
    type: 'module',
    tags: ['social-media', 'posting', 'analytics', 'engagement']
  }
];

export default function Marketplace() {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedType, setSelectedType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [selectedProcessors, setSelectedProcessors] = useState<string[]>([]);
  const { toast } = useToast();

  const { data: paymentPlugins = [] } = useQuery<Plugin[]>({
    queryKey: ['/api/plugins/type/payment'],
  });

  const initProcessorsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/plugins/init-payment-processors');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/plugins/type/payment'] });
      toast({
        title: 'Payment Processors Initialized',
        description: 'Adult-friendly payment processors have been added to your marketplace.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Initialization Failed',
        description: error.message || 'Failed to initialize payment processors',
        variant: 'destructive',
      });
    },
  });

  // Filter items based on category, type, and search term
  const filteredItems = marketplaceItems.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesType = selectedType === 'all' || item.type === selectedType;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesType && matchesSearch;
  });

  const categories = ['All', ...Array.from(new Set(marketplaceItems.map(item => item.category)))];

  const handleInstall = (itemId: string) => {
    // Installation logic would go here
    console.log(`Installing ${itemId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
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
          
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Marketplace</h1>
              <p className="text-muted-foreground">
                Discover plugins, modules, templates, and data pipelines to enhance your applications.
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">
                <i className="fas fa-download mr-1"></i>
                {marketplaceItems.reduce((total, item) => total + parseFloat(item.downloads.replace('k', '')) * 1000, 0).toLocaleString()} downloads
              </Badge>
              <Badge variant="outline">
                <i className="fas fa-star mr-1"></i>
                {(marketplaceItems.reduce((total, item) => total + item.rating, 0) / marketplaceItems.length).toFixed(1)} avg rating
              </Badge>
            </div>
          </div>

          {/* Search and Filters */}
          <motion.div 
            className="flex flex-col lg:flex-row items-start lg:items-center space-y-4 lg:space-y-0 lg:space-x-4 mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex-1 max-w-md">
              <Input 
                placeholder="Search marketplace..." 
                className="w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search"
              />
            </div>
            
            <Tabs value={selectedType} onValueChange={setSelectedType} className="w-auto">
              <TabsList>
                <TabsTrigger value="all">All Types</TabsTrigger>
                <TabsTrigger value="plugin">Plugins</TabsTrigger>
                <TabsTrigger value="module">Modules</TabsTrigger>
                <TabsTrigger value="template">Templates</TabsTrigger>
                <TabsTrigger value="pipeline">Pipelines</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <motion.div
                  key={category}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    data-testid={`filter-${category.toLowerCase()}`}
                  >
                    {category}
                  </Button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Marketplace Items Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {filteredItems.length === 0 ? (
            <motion.div 
              className="text-center py-12"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <i className="fas fa-search text-4xl text-muted-foreground mb-4"></i>
              <h3 className="text-lg font-medium mb-2">No items found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search terms or filters.
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('All');
                  setSelectedType('all');
                }}
                data-testid="button-reset-search"
              >
                Clear All Filters
              </Button>
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence>
                {filteredItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ 
                      scale: 1.02,
                      y: -4,
                      transition: { duration: 0.2 }
                    }}
                    onHoverStart={() => setHoveredItem(item.id)}
                    onHoverEnd={() => setHoveredItem(null)}
                  >
                    <Card className="hover:shadow-xl hover:shadow-primary/20 transition-all cursor-pointer relative overflow-hidden group bg-card border border-border">
                      {/* Animated background gradient */}
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5"
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      />

                      <CardHeader className="relative z-20">
                        <div className="flex items-center justify-between mb-2">
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Badge className={`
                              ${item.type === 'plugin' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : ''}
                              ${item.type === 'module' ? 'bg-green-500/20 text-green-400 border-green-500/30' : ''}
                              ${item.type === 'template' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : ''}
                              ${item.type === 'pipeline' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : ''}
                            `}>
                              {item.type}
                            </Badge>
                          </motion.div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-primary">{item.price}</div>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <i className="fas fa-star text-yellow-400 mr-1"></i>
                              {item.rating}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3 mb-2">
                          <motion.i 
                            className={`${item.image} text-2xl text-primary`}
                            animate={{ 
                              rotate: hoveredItem === item.id ? 360 : 0,
                              scale: hoveredItem === item.id ? 1.1 : 1
                            }}
                            transition={{ duration: 0.5 }}
                          ></motion.i>
                          <div>
                            <CardTitle className="text-lg group-hover:text-primary transition-colors">{item.name}</CardTitle>
                            <div className="text-sm text-muted-foreground">by {item.author}</div>
                          </div>
                        </div>
                        
                        <CardDescription className="group-hover:text-foreground transition-colors">
                          {item.description}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="relative z-20">
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-1 mb-2">
                            {item.features.slice(0, 2).map((feature, idx) => (
                              <motion.div
                                key={feature}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                              >
                                <Badge variant="outline" className="text-xs hover:bg-primary/10 transition-colors">
                                  {feature}
                                </Badge>
                              </motion.div>
                            ))}
                            {item.features.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{item.features.length - 2} more
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-sm text-muted-foreground">
                              <i className="fas fa-download mr-1"></i>
                              <span>{item.downloads} downloads</span>
                            </div>
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Button 
                                size="sm" 
                                onClick={() => handleInstall(item.id)}
                                className="hover:bg-primary/10"
                              >
                                <i className="fas fa-download mr-2"></i>
                                Install
                              </Button>
                            </motion.div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}