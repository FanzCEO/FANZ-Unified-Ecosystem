import { useState } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

interface Template {
  id: string;
  name: string;
  description: string;
  stack: string;
  category: string;
  icon: string;
  color: string;
  setupTime: string;
  features: string[];
  popular: boolean;
}

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
    features: ['Membership Tiers', 'Direct Messaging', 'Pay-per-view', '2257 Compliance', 'Adult Payment Processors'],
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
    features: ['Digital Storefront', 'Affiliate System', 'Coupon Management', 'Time-bomb Links', 'Adult Payment Processors'],
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
    features: ['Subscription Management', 'Exclusive Content', 'Fan Interaction', 'Adult Payment Processors', 'Creator Dashboard'],
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
];

// Template card component with animations
interface TemplateCardProps {
  template: Template;
  index: number;
  hoveredTemplate: string | null;
  setHoveredTemplate: (id: string | null) => void;
  handleUseTemplate: (id: string) => void;
  isPopular?: boolean;
}

const TemplateCard = ({ template, index, hoveredTemplate, setHoveredTemplate, handleUseTemplate, isPopular = false, getCategoryColors, getIconColors }: TemplateCardProps & { getCategoryColors: (category: string) => string; getIconColors: (category: string) => string }) => (
  <motion.div
    key={template.id}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3, delay: index * 0.1 }}
    whileHover={{ 
      scale: 1.02,
      y: -4,
      transition: { duration: 0.2 }
    }}
    onHoverStart={() => setHoveredTemplate(template.id)}
    onHoverEnd={() => setHoveredTemplate(null)}
  >
    <Card 
      className={`${isPopular ? 'neon-border' : ''} hover:shadow-xl hover:shadow-primary/20 transition-all cursor-pointer relative overflow-hidden group bg-card border border-border`}
      onClick={() => handleUseTemplate(template.id)}
      data-testid={isPopular ? `template-${template.id}` : `template-all-${template.id}`}
    >
      {/* Animated background gradient */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Preview overlay */}
      <AnimatePresence>
        {hoveredTemplate === template.id && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 flex items-center justify-center z-10"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="text-center text-white p-4"
            >
              <motion.i 
                className={`${template.icon} text-4xl mb-2 text-white`}
                animate={{ 
                  rotate: 360,
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                  scale: { duration: 1, repeat: Infinity, ease: "easeInOut" }
                }}
              ></motion.i>
              <p className="text-sm mb-2">Interactive Preview</p>
              <div className="text-xs opacity-75 mb-3">
                {template.features.join(' • ')}
              </div>
              <Button 
                size="sm" 
                className="mt-2"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUseTemplate(template.id);
                }}
              >
                <i className="fas fa-rocket mr-2"></i>
                Use Template
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <CardHeader className="relative z-20">
        <div className="flex items-center justify-between mb-2">
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <Badge className={getCategoryColors(template.category)}>
              {template.category}
            </Badge>
          </motion.div>
          <div className="flex items-center space-x-2">
            {isPopular && (
              <motion.div
                animate={{ 
                  rotate: hoveredTemplate === template.id ? 360 : 0,
                  scale: hoveredTemplate === template.id ? 1.1 : 1
                }}
                transition={{ duration: 0.5 }}
              >
                <Badge variant="secondary" className="text-xs">
                  <i className="fas fa-fire mr-1"></i>Popular
                </Badge>
              </motion.div>
            )}
            <motion.i 
              className={`${template.icon} ${getIconColors(template.category)}`}
              animate={{ 
                rotate: hoveredTemplate === template.id ? 360 : 0,
                scale: hoveredTemplate === template.id ? 1.2 : 1
              }}
              transition={{ duration: 0.5 }}
            ></motion.i>
          </div>
        </div>
        <CardTitle className="text-lg group-hover:text-primary transition-colors">{template.name}</CardTitle>
        <CardDescription className="group-hover:text-foreground transition-colors">{template.description}</CardDescription>
      </CardHeader>

      <CardContent className="relative z-20">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1">
            {template.features.slice(0, 3).map((feature: string, idx: number) => (
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
            {template.features.length > 3 && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Badge variant="outline" className="text-xs hover:bg-secondary/10 transition-colors">
                  +{template.features.length - 3} more
                </Badge>
              </motion.div>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
              <motion.i 
                className="fas fa-clock"
                animate={{ rotate: hoveredTemplate === template.id ? 360 : 0 }}
                transition={{ duration: 1 }}
              ></motion.i>
              <span>{template.setupTime} setup</span>
              <span>•</span>
              <i className="fas fa-code"></i>
              <span>{template.stack.replace('-', ' ')}</span>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button size="sm" variant="ghost" className="hover:bg-primary/10">
                Use Template
              </Button>
            </motion.div>
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

export default function Templates() {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);

  // Category color mapping
  const getCategoryColors = (category: string) => {
    switch (category) {
      case 'Creator': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Adult': return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
      case 'Admin': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'E-commerce': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Compliance': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-primary/20 text-primary border-primary/30';
    }
  };

  const getIconColors = (category: string) => {
    switch (category) {
      case 'Creator': return 'text-blue-400';
      case 'Adult': return 'text-pink-400';
      case 'Admin': return 'text-purple-400';
      case 'E-commerce': return 'text-green-400';
      case 'Compliance': return 'text-yellow-400';
      default: return 'text-primary';
    }
  };

  const handleUseTemplate = (templateId: string) => {
    setLocation(`/new-project?template=${templateId}`);
  };

  // Filter templates based on category and search term
  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.features.some(feature => feature.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

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
              <h1 className="text-3xl font-bold mb-2">Project Templates</h1>
              <p className="text-muted-foreground">
                Choose from our curated templates designed specifically for the creator economy.
              </p>
            </div>
            
            <Button 
              onClick={() => setLocation("/new-project")}
              data-testid="button-create-custom"
            >
              <i className="fas fa-plus mr-2"></i>
              Start from Scratch
            </Button>
          </div>

          {/* Search and Filters */}
          <motion.div 
            className="flex items-center space-x-4 mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex-1 max-w-md">
              <Input 
                placeholder="Search templates..." 
                className="w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search"
              />
            </div>
            <div className="flex space-x-2">
              {['All', 'Creator', 'Adult', 'Admin', 'E-commerce', 'Compliance'].map((category) => (
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

        {/* Popular Templates */}
        {filteredTemplates.filter(t => t.popular).length > 0 && (
          <motion.div 
            className="mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="text-xl font-semibold mb-4">
              <i className="fas fa-fire text-orange-500 mr-2"></i>
              Popular Templates
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {filteredTemplates.filter(t => t.popular).map((template, index) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    index={index}
                    hoveredTemplate={hoveredTemplate}
                    setHoveredTemplate={setHoveredTemplate}
                    handleUseTemplate={handleUseTemplate}
                    isPopular={true}
                    getCategoryColors={getCategoryColors}
                    getIconColors={getIconColors}
                  />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* All Templates */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">All Templates</h2>
            {(searchTerm || selectedCategory !== 'All') && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('All');
                }}
                data-testid="button-clear-filters"
              >
                <i className="fas fa-times mr-2"></i>
                Clear Filters
              </Button>
            )}
          </div>
          {filteredTemplates.length === 0 ? (
            <motion.div 
              className="text-center py-12"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <i className="fas fa-search text-4xl text-muted-foreground mb-4"></i>
              <h3 className="text-lg font-medium mb-2">No templates found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search terms or category filters.
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('All');
                }}
                data-testid="button-reset-search"
              >
                Show All Templates
              </Button>
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {filteredTemplates.map((template, index) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    index={index}
                    hoveredTemplate={hoveredTemplate}
                    setHoveredTemplate={setHoveredTemplate}
                    handleUseTemplate={handleUseTemplate}
                    isPopular={false}
                    getCategoryColors={getCategoryColors}
                    getIconColors={getIconColors}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}