import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { RefreshCw, Sparkles, Download, Share } from "lucide-react";

export default function ImageGenerator() {
  const [formData, setFormData] = useState({
    prompt: "",
    style: "realistic",
    size: "1024x1024" as "1024x1024" | "1792x1024" | "1024x1792"
  });
  const [generatedImage, setGeneratedImage] = useState("");
  const { toast } = useToast();

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/generate/image", formData);
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedImage(data.url);
      toast({
        title: "Image Generated!",
        description: "Your image has been successfully generated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to generate image. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!formData.prompt.trim()) {
      toast({
        title: "Prompt Required",
        description: "Please enter a description for your image.",
        variant: "destructive",
      });
      return;
    }
    generateMutation.mutate();
  };

  const styles = [
    { value: "realistic", label: "Realistic" },
    { value: "artistic", label: "Artistic" },
    { value: "cartoon", label: "Cartoon" },
    { value: "abstract", label: "Abstract" },
    { value: "professional", label: "Professional" },
    { value: "minimalist", label: "Minimalist" }
  ];

  const sizes = [
    { value: "1024x1024", label: "Square (1024x1024)" },
    { value: "1792x1024", label: "Landscape (1792x1024)" },
    { value: "1024x1792", label: "Portrait (1024x1792)" }
  ];

  return (
    <div className="min-h-screen bg-soft py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-3xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold font-poppins text-main mb-4">AI Image Studio</h1>
            <p className="text-gray-600">Generate stunning marketing visuals, social media graphics, and product images with AI</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Section */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-main">Image Parameters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2">Image Description</Label>
                  <Input 
                    type="text" 
                    placeholder="e.g., Modern office space with AI technology, professional lighting"
                    value={formData.prompt}
                    onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                    data-testid="input-image-prompt"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2">Style</Label>
                  <Select value={formData.style} onValueChange={(value) => setFormData({ ...formData, style: value })}>
                    <SelectTrigger className="w-full" data-testid="select-style">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {styles.map((style) => (
                        <SelectItem key={style.value} value={style.value}>{style.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2">Size</Label>
                  <Select value={formData.size} onValueChange={(value: any) => setFormData({ ...formData, size: value })}>
                    <SelectTrigger className="w-full" data-testid="select-size">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sizes.map((size) => (
                        <SelectItem key={size.value} value={size.value}>{size.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={handleGenerate}
                  disabled={generateMutation.isPending}
                  className="w-full bg-primary text-white hover:bg-indigo-600 transition-colors font-semibold"
                  data-testid="button-generate-image"
                >
                  {generateMutation.isPending ? (
                    <RefreshCw className="mr-2 animate-spin" size={20} />
                  ) : (
                    <Sparkles className="mr-2" size={20} />
                  )}
                  {generateMutation.isPending ? "Generating..." : "Generate Image"}
                </Button>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">💡 Pro Tips</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Be specific about lighting, colors, and composition</li>
                    <li>• Include style keywords like "professional", "modern", or "minimalist"</li>
                    <li>• Mention the intended use (social media, website, print)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Output Section */}
            <Card className="shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-main">Generated Image</CardTitle>
                  {generatedImage && (
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        data-testid="button-download-image"
                      >
                        <Download size={16} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        data-testid="button-share-image"
                      >
                        <Share size={16} />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-96 bg-gray-50 rounded-lg p-4 flex items-center justify-center" data-testid="image-preview">
                  {generatedImage ? (
                    <img 
                      src={generatedImage} 
                      alt="Generated" 
                      className="max-h-full max-w-full object-contain rounded-lg shadow-lg"
                    />
                  ) : (
                    <div className="text-gray-400 italic text-center">
                      <Sparkles className="mx-auto mb-2" size={48} />
                      <p>Your generated image will appear here</p>
                    </div>
                  )}
                </div>

                {generatedImage && (
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Image generated successfully
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        className="bg-accent text-white hover:bg-green-600"
                        data-testid="button-use-in-project"
                      >
                        Use in Project
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={handleGenerate}
                        disabled={generateMutation.isPending}
                        data-testid="button-regenerate-image"
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
