import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Copy, Download, RefreshCw, Sparkles, Clock } from "lucide-react";

export default function ContentGenerator() {
  const [formData, setFormData] = useState({
    type: "Blog Post",
    topic: "",
    tone: "Professional",
    length: 500,
    additionalInstructions: ""
  });
  const [generatedContent, setGeneratedContent] = useState("");
  const { toast } = useToast();

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/generate/content", formData);
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedContent(data.content);
      toast({
        title: "Content Generated!",
        description: "Your content has been successfully generated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to generate content. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!formData.topic.trim()) {
      toast({
        title: "Topic Required",
        description: "Please enter a topic for your content.",
        variant: "destructive",
      });
      return;
    }
    generateMutation.mutate();
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent);
    toast({
      title: "Copied!",
      description: "Content copied to clipboard.",
    });
  };

  const tones = ["Professional", "Casual", "Persuasive", "Friendly", "Formal", "Creative"];
  const contentTypes = ["Blog Post", "Sales Copy", "Social Media Post", "Email Template", "Product Description", "Landing Page Copy"];

  return (
    <div className="min-h-screen bg-soft py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold font-poppins text-main mb-4">AI Content Generator</h1>
            <p className="text-gray-600">Create compelling marketing copy, blog posts, and social media content in seconds</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Section */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-main">Content Parameters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2">Content Type</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger className="w-full" data-testid="select-content-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {contentTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2">Topic/Keywords</Label>
                  <Input 
                    type="text" 
                    placeholder="e.g., AI marketing automation tools" 
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    data-testid="input-topic"
                  />
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
                  <Label className="text-sm font-medium text-gray-700 mb-2">Length</Label>
                  <Slider
                    value={[formData.length]}
                    onValueChange={(value) => setFormData({ ...formData, length: value[0] })}
                    min={100}
                    max={2000}
                    step={50}
                    className="w-full"
                    data-testid="slider-length"
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>Short (100 words)</span>
                    <span data-testid="text-word-count">{formData.length} words</span>
                    <span>Long (2000 words)</span>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2">Additional Instructions</Label>
                  <Textarea 
                    placeholder="Any specific requirements or style preferences..."
                    value={formData.additionalInstructions}
                    onChange={(e) => setFormData({ ...formData, additionalInstructions: e.target.value })}
                    rows={3}
                    data-testid="textarea-instructions"
                  />
                </div>

                <Button 
                  onClick={handleGenerate}
                  disabled={generateMutation.isPending}
                  className="w-full bg-primary text-white hover:bg-indigo-600 transition-colors font-semibold"
                  data-testid="button-generate-content"
                >
                  {generateMutation.isPending ? (
                    <RefreshCw className="mr-2 animate-spin" size={20} />
                  ) : (
                    <Sparkles className="mr-2" size={20} />
                  )}
                  {generateMutation.isPending ? "Generating..." : "Generate Content"}
                </Button>
              </CardContent>
            </Card>

            {/* Output Section */}
            <Card className="shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-main">Generated Content</CardTitle>
                  <div className="flex space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={copyToClipboard}
                      disabled={!generatedContent}
                      data-testid="button-copy"
                    >
                      <Copy size={16} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      disabled={!generatedContent}
                      data-testid="button-download"
                    >
                      <Download size={16} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-96 overflow-y-auto bg-gray-50 rounded-lg p-4 text-sm leading-relaxed" data-testid="text-generated-content">
                  {generatedContent ? (
                    <div className="text-gray-700 whitespace-pre-wrap">{generatedContent}</div>
                  ) : (
                    <div className="text-gray-400 italic">Generated content will appear here...</div>
                  )}
                </div>

                {generatedContent && (
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-gray-500 flex items-center">
                      <Clock className="mr-1" size={16} />
                      Generated successfully
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        className="bg-accent text-white hover:bg-green-600"
                        data-testid="button-share"
                      >
                        Share
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={handleGenerate}
                        disabled={generateMutation.isPending}
                        data-testid="button-regenerate"
                      >
                        <RefreshCw className="mr-1" size={16} />
                        Regenerate
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
