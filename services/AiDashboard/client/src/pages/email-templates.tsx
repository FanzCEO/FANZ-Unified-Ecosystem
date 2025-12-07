import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Copy, RefreshCw, Sparkles, Mail, Send, Plus, X } from "lucide-react";

export default function EmailTemplates() {
  const [formData, setFormData] = useState({
    purpose: "",
    tone: "Professional",
    audience: "",
    keyPoints: [""]
  });
  const [generatedTemplate, setGeneratedTemplate] = useState<{ subject: string; body: string } | null>(null);
  const { toast } = useToast();

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/generate/email", formData);
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedTemplate(data);
      toast({
        title: "Email Template Generated!",
        description: "Your email template has been successfully created.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to generate email template. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!formData.purpose.trim() || !formData.audience.trim()) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in the purpose and audience fields.",
        variant: "destructive",
      });
      return;
    }
    generateMutation.mutate();
  };

  const addKeyPoint = () => {
    setFormData({ ...formData, keyPoints: [...formData.keyPoints, ""] });
  };

  const removeKeyPoint = (index: number) => {
    const newKeyPoints = formData.keyPoints.filter((_, i) => i !== index);
    setFormData({ ...formData, keyPoints: newKeyPoints });
  };

  const updateKeyPoint = (index: number, value: string) => {
    const newKeyPoints = [...formData.keyPoints];
    newKeyPoints[index] = value;
    setFormData({ ...formData, keyPoints: newKeyPoints });
  };

  const copyTemplate = () => {
    if (generatedTemplate) {
      const fullTemplate = `Subject: ${generatedTemplate.subject}\n\n${generatedTemplate.body}`;
      navigator.clipboard.writeText(fullTemplate);
      toast({
        title: "Copied!",
        description: "Email template copied to clipboard.",
      });
    }
  };

  const purposes = [
    "Welcome Email",
    "Product Launch",
    "Sales Outreach",
    "Newsletter",
    "Follow-up",
    "Promotional Campaign",
    "Event Invitation",
    "Customer Support",
    "Re-engagement",
    "Thank You"
  ];

  const tones = ["Professional", "Friendly", "Persuasive", "Formal", "Casual", "Urgent"];
  const audiences = ["New Customers", "Existing Customers", "Prospects", "Business Partners", "Subscribers", "VIP Customers"];

  return (
    <div className="min-h-screen bg-soft py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-3xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold font-poppins text-main mb-4">Email Campaign Generator</h1>
            <p className="text-gray-600">Create personalized email campaigns with AI-generated subject lines and compelling content</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Section */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-main">Email Parameters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2">Email Purpose</Label>
                  <Select value={formData.purpose} onValueChange={(value) => setFormData({ ...formData, purpose: value })}>
                    <SelectTrigger className="w-full" data-testid="select-purpose">
                      <SelectValue placeholder="Select email purpose" />
                    </SelectTrigger>
                    <SelectContent>
                      {purposes.map((purpose) => (
                        <SelectItem key={purpose} value={purpose}>{purpose}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2">Target Audience</Label>
                  <Select value={formData.audience} onValueChange={(value) => setFormData({ ...formData, audience: value })}>
                    <SelectTrigger className="w-full" data-testid="select-audience">
                      <SelectValue placeholder="Select target audience" />
                    </SelectTrigger>
                    <SelectContent>
                      {audiences.map((audience) => (
                        <SelectItem key={audience} value={audience}>{audience}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2">Tone</Label>
                  <div className="flex flex-wrap gap-2">
                    {tones.map((tone) => (
                      <Button
                        key={tone}
                        variant={formData.tone === tone ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFormData({ ...formData, tone })}
                        className={formData.tone === tone ? "bg-primary text-white" : ""}
                        data-testid={`button-tone-${tone.toLowerCase()}`}
                      >
                        {tone}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2">Key Points to Include</Label>
                  <div className="space-y-2">
                    {formData.keyPoints.map((point, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={point}
                          onChange={(e) => updateKeyPoint(index, e.target.value)}
                          placeholder={`Key point ${index + 1}`}
                          className="flex-1"
                          data-testid={`input-key-point-${index}`}
                        />
                        {formData.keyPoints.length > 1 && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => removeKeyPoint(index)}
                            data-testid={`button-remove-point-${index}`}
                          >
                            <X size={16} />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addKeyPoint}
                      className="w-full"
                      data-testid="button-add-key-point"
                    >
                      <Plus className="mr-2" size={16} />
                      Add Key Point
                    </Button>
                  </div>
                </div>

                <Button 
                  onClick={handleGenerate}
                  disabled={generateMutation.isPending}
                  className="w-full bg-primary text-white hover:bg-indigo-600 transition-colors font-semibold"
                  data-testid="button-generate-email"
                >
                  {generateMutation.isPending ? (
                    <RefreshCw className="mr-2 animate-spin" size={20} />
                  ) : (
                    <Mail className="mr-2" size={20} />
                  )}
                  {generateMutation.isPending ? "Generating..." : "Generate Email Template"}
                </Button>
              </CardContent>
            </Card>

            {/* Output Section */}
            <Card className="shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-main">Generated Email Template</CardTitle>
                  {generatedTemplate && (
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={copyTemplate}
                        data-testid="button-copy-template"
                      >
                        <Copy size={16} />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {generatedTemplate ? (
                  <div className="space-y-4" data-testid="email-template-output">
                    {/* Subject Line */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <Label className="text-sm font-semibold text-blue-800">Subject Line</Label>
                      <p className="text-blue-700 font-medium mt-1" data-testid="text-email-subject">
                        {generatedTemplate.subject}
                      </p>
                    </div>

                    {/* Email Body */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <Label className="text-sm font-semibold text-gray-700">Email Body</Label>
                      <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed" data-testid="text-email-body">
                        {generatedTemplate.body}
                      </div>
                    </div>

                    {/* Template Actions */}
                    <div className="flex space-x-2">
                      <Button 
                        className="flex-1 bg-accent text-white hover:bg-green-600"
                        data-testid="button-use-template"
                      >
                        <Send className="mr-2" size={16} />
                        Use Template
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={handleGenerate}
                        disabled={generateMutation.isPending}
                        data-testid="button-regenerate-email"
                      >
                        <RefreshCw className="mr-1" size={16} />
                        Regenerate
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="h-96 bg-gray-50 rounded-lg p-4 flex items-center justify-center text-center">
                    <div className="text-gray-400 italic">
                      <Mail className="mx-auto mb-2" size={48} />
                      <p>Your email template will appear here</p>
                      <p className="text-sm mt-1">Fill in the parameters and click generate</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Templates */}
          <div className="mt-8">
            <h3 className="text-xl font-semibold text-main mb-4">Quick Start Templates</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { title: "Welcome Series", description: "Onboard new customers", badge: "Popular" },
                { title: "Product Launch", description: "Announce new features", badge: "New" },
                { title: "Re-engagement", description: "Win back inactive users", badge: "Effective" }
              ].map((template, index) => (
                <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow" data-testid={`template-${template.title.toLowerCase().replace(/\s+/g, '-')}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-main">{template.title}</h4>
                      <Badge variant="secondary" className="text-xs">{template.badge}</Badge>
                    </div>
                    <p className="text-sm text-gray-600">{template.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
