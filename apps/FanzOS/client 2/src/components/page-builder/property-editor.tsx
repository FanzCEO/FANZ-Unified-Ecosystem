import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ColorPicker } from "react-colorful";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PageComponent } from "@shared/schema";
import { Settings, Palette, Code } from "lucide-react";

interface PropertyEditorProps {
  component: PageComponent | null;
  onUpdateComponent: (componentId: string, updates: Partial<PageComponent>) => void;
}

export function PropertyEditor({ component, onUpdateComponent }: PropertyEditorProps) {
  const [colorPickerOpen, setColorPickerOpen] = useState(false);

  if (!component) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="py-12 text-center">
          <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400" data-testid="text-no-component-selected">
            Select a component to edit its properties
          </p>
        </CardContent>
      </Card>
    );
  }

  const updateConfig = (key: string, value: any) => {
    const newConfig = { ...component.config, [key]: value };
    onUpdateComponent(component.id, { config: newConfig });
  };

  const updateStyle = (key: string, value: any) => {
    const newStyles = { ...component.styles, [key]: value };
    onUpdateComponent(component.id, { styles: newStyles });
  };

  const renderConfigEditor = () => {
    const config = component.config || {};
    
    switch (component.componentType) {
      case "hero":
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-white">Title</Label>
              <Input
                value={config.title || ""}
                onChange={(e) => updateConfig("title", e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="Enter hero title"
                data-testid="input-hero-title"
              />
            </div>
            <div>
              <Label className="text-white">Subtitle</Label>
              <Textarea
                value={config.subtitle || ""}
                onChange={(e) => updateConfig("subtitle", e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="Enter hero subtitle"
                rows={2}
                data-testid="textarea-hero-subtitle"
              />
            </div>
            <div>
              <Label className="text-white">CTA Button Text</Label>
              <Input
                value={config.ctaText || ""}
                onChange={(e) => updateConfig("ctaText", e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="Get Started"
                data-testid="input-hero-cta-text"
              />
            </div>
            <div>
              <Label className="text-white">CTA Button URL</Label>
              <Input
                value={config.ctaUrl || ""}
                onChange={(e) => updateConfig("ctaUrl", e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="https://example.com"
                data-testid="input-hero-cta-url"
              />
            </div>
          </div>
        );

      case "text":
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-white">Heading (Optional)</Label>
              <Input
                value={config.heading || ""}
                onChange={(e) => updateConfig("heading", e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="Enter heading"
                data-testid="input-text-heading"
              />
            </div>
            <div>
              <Label className="text-white">Content</Label>
              <Textarea
                value={config.content || ""}
                onChange={(e) => updateConfig("content", e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="Enter your content..."
                rows={4}
                data-testid="textarea-text-content"
              />
            </div>
          </div>
        );

      case "image":
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-white">Image URL</Label>
              <Input
                value={config.src || ""}
                onChange={(e) => updateConfig("src", e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="https://example.com/image.jpg"
                data-testid="input-image-src"
              />
            </div>
            <div>
              <Label className="text-white">Alt Text</Label>
              <Input
                value={config.alt || ""}
                onChange={(e) => updateConfig("alt", e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="Describe the image"
                data-testid="input-image-alt"
              />
            </div>
            <div>
              <Label className="text-white">Caption (Optional)</Label>
              <Input
                value={config.caption || ""}
                onChange={(e) => updateConfig("caption", e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="Image caption"
                data-testid="input-image-caption"
              />
            </div>
          </div>
        );

      case "cta":
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-white">Title</Label>
              <Input
                value={config.title || ""}
                onChange={(e) => updateConfig("title", e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="Ready to Get Started?"
                data-testid="input-cta-title"
              />
            </div>
            <div>
              <Label className="text-white">Subtitle</Label>
              <Input
                value={config.subtitle || ""}
                onChange={(e) => updateConfig("subtitle", e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="Join thousands of creators"
                data-testid="input-cta-subtitle"
              />
            </div>
            <div>
              <Label className="text-white">Button Text</Label>
              <Input
                value={config.buttonText || ""}
                onChange={(e) => updateConfig("buttonText", e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="Get Started"
                data-testid="input-cta-button-text"
              />
            </div>
            <div>
              <Label className="text-white">Button URL</Label>
              <Input
                value={config.buttonUrl || ""}
                onChange={(e) => updateConfig("buttonUrl", e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="https://example.com"
                data-testid="input-cta-button-url"
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <Code className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">
              Custom configuration for {component.componentType} component
            </p>
          </div>
        );
    }
  };

  const renderStyleEditor = () => {
    const styles = component.styles || {};

    return (
      <div className="space-y-4">
        <div>
          <Label className="text-white">Text Alignment</Label>
          <Select
            value={styles.textAlign || "left"}
            onValueChange={(value) => updateStyle("textAlign", value)}
          >
            <SelectTrigger className="bg-gray-700 border-gray-600 text-white" data-testid="select-text-align">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Left</SelectItem>
              <SelectItem value="center">Center</SelectItem>
              <SelectItem value="right">Right</SelectItem>
              <SelectItem value="justify">Justify</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-white">Padding</Label>
          <Select
            value={styles.padding || "py-8"}
            onValueChange={(value) => updateStyle("padding", value)}
          >
            <SelectTrigger className="bg-gray-700 border-gray-600 text-white" data-testid="select-padding">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="py-4">Small</SelectItem>
              <SelectItem value="py-8">Medium</SelectItem>
              <SelectItem value="py-12">Large</SelectItem>
              <SelectItem value="py-20">Extra Large</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-white">Background Color</Label>
          <Select
            value={styles.backgroundColor || "transparent"}
            onValueChange={(value) => updateStyle("backgroundColor", value)}
          >
            <SelectTrigger className="bg-gray-700 border-gray-600 text-white" data-testid="select-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="transparent">Transparent</SelectItem>
              <SelectItem value="bg-slate">Dark Gray</SelectItem>
              <SelectItem value="bg-gray-800">Medium Gray</SelectItem>
              <SelectItem value="from-primary/20 to-secondary/20">Gradient</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <Settings className="w-5 h-5" />
          <span>Properties</span>
        </CardTitle>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400 capitalize">
            {component.componentType} Component
          </span>
          <div className="flex items-center space-x-2">
            <Label className="text-sm text-gray-400">Visible</Label>
            <Switch
              checked={component.isVisible}
              onCheckedChange={(checked) => 
                onUpdateComponent(component.id, { isVisible: checked })
              }
              data-testid="switch-component-visibility"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-700">
            <TabsTrigger 
              value="content" 
              className="data-[state=active]:bg-primary data-[state=active]:text-white"
              data-testid="tab-content"
            >
              Content
            </TabsTrigger>
            <TabsTrigger 
              value="style" 
              className="data-[state=active]:bg-primary data-[state=active]:text-white"
              data-testid="tab-style"
            >
              Style
            </TabsTrigger>
          </TabsList>
          <TabsContent value="content" className="mt-4">
            {renderConfigEditor()}
          </TabsContent>
          <TabsContent value="style" className="mt-4">
            {renderStyleEditor()}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}