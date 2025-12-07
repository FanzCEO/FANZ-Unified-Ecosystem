import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Type, Image, Video, Grid, Star, DollarSign, Users, Layout } from "lucide-react";

interface ComponentTemplate {
  type: string;
  name: string;
  category: string;
  icon: React.ReactNode;
  description: string;
  defaultConfig: Record<string, any>;
  defaultStyles: Record<string, any>;
}

const componentTemplates: ComponentTemplate[] = [
  {
    type: "hero",
    name: "Hero Section",
    category: "Headers",
    icon: <Layout className="w-4 h-4" />,
    description: "Eye-catching header with title, subtitle, and CTA",
    defaultConfig: {
      title: "Welcome to FanzLab",
      subtitle: "The Future of Creator Economy",
      ctaText: "Get Started",
      ctaUrl: "#",
      backgroundImage: "",
    },
    defaultStyles: {
      backgroundColor: "from-primary/20 to-secondary/20",
      textAlign: "center",
      padding: "py-20",
    },
  },
  {
    type: "features",
    name: "Features Grid",
    category: "Content",
    icon: <Grid className="w-4 h-4" />,
    description: "Showcase key features with icons and descriptions",
    defaultConfig: {
      title: "Why Choose Us?",
      features: [
        {
          icon: "DollarSign",
          title: "Maximum Earnings",
          description: "Keep 85% of your earnings",
        },
        {
          icon: "Users",
          title: "Growing Community",
          description: "Join thousands of creators",
        },
        {
          icon: "Star",
          title: "Premium Features",
          description: "Advanced tools and analytics",
        },
      ],
    },
    defaultStyles: {
      backgroundColor: "bg-slate",
      padding: "py-20",
      columns: 3,
    },
  },
  {
    type: "text",
    name: "Text Block",
    category: "Content",
    icon: <Type className="w-4 h-4" />,
    description: "Rich text content with formatting options",
    defaultConfig: {
      content: "Add your text content here...",
      heading: "",
    },
    defaultStyles: {
      textAlign: "left",
      fontSize: "base",
      color: "text-white",
      padding: "py-8",
    },
  },
  {
    type: "image",
    name: "Image Block",
    category: "Media",
    icon: <Image className="w-4 h-4" />,
    description: "Single image with optional caption",
    defaultConfig: {
      src: "",
      alt: "",
      caption: "",
    },
    defaultStyles: {
      width: "full",
      rounded: "lg",
      padding: "py-8",
    },
  },
  {
    type: "video",
    name: "Video Block",
    category: "Media", 
    icon: <Video className="w-4 h-4" />,
    description: "Embedded video with controls",
    defaultConfig: {
      src: "",
      poster: "",
      autoplay: false,
      muted: true,
    },
    defaultStyles: {
      width: "full",
      aspectRatio: "16:9",
      rounded: "lg",
      padding: "py-8",
    },
  },
  {
    type: "cta",
    name: "Call to Action",
    category: "Marketing",
    icon: <Star className="w-4 h-4" />,
    description: "Compelling call-to-action section",
    defaultConfig: {
      title: "Ready to Get Started?",
      subtitle: "Join thousands of successful creators",
      buttonText: "Start Creating",
      buttonUrl: "#",
      secondaryButtonText: "",
      secondaryButtonUrl: "",
    },
    defaultStyles: {
      backgroundColor: "from-primary/20 to-secondary/20",
      textAlign: "center",
      padding: "py-16",
    },
  },
];

interface ComponentLibraryProps {
  onAddComponent: (template: ComponentTemplate) => void;
}

export function ComponentLibrary({ onAddComponent }: ComponentLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", ...Array.from(new Set(componentTemplates.map(c => c.category)))];
  
  const filteredComponents = componentTemplates.filter(component => {
    const matchesSearch = component.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         component.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || component.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Component Library</CardTitle>
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search components..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-gray-700 border-gray-600 pl-10 text-white placeholder-gray-400"
              data-testid="input-component-search"
            />
          </div>
          
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className={`cursor-pointer ${
                  selectedCategory === category
                    ? "bg-primary text-white"
                    : "bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700"
                }`}
                onClick={() => setSelectedCategory(category)}
                data-testid={`category-filter-${category.toLowerCase()}`}
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {filteredComponents.map((template) => (
            <div
              key={template.type}
              className="flex items-start justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors group"
            >
              <div className="flex items-start space-x-3 flex-1">
                <div className="p-2 bg-primary/20 text-primary rounded-lg">
                  {template.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-white text-sm" data-testid={`component-name-${template.type}`}>
                    {template.name}
                  </h4>
                  <p className="text-xs text-gray-400 mt-1" data-testid={`component-description-${template.type}`}>
                    {template.description}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onAddComponent(template)}
                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 hover:bg-primary hover:text-white"
                data-testid={`add-component-${template.type}`}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}