import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Navbar } from "@/components/navbar";
import { isUnauthorizedError } from "@/lib/authUtils";

const generateContentSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  type: z.enum(['title', 'description', 'script', 'social_post']),
  category: z.string().optional(),
  tone: z.enum(['seductive', 'playful', 'dominant', 'submissive', 'romantic', 'explicit']).optional(),
  length: z.enum(['short', 'medium', 'long']).optional(),
});

type GenerateContentForm = z.infer<typeof generateContentSchema>;

export default function Generator() {
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: credits } = useQuery({
    queryKey: ["/api/user/credits"],
  }) as { data: { credits: number; totalCreditsUsed: number } | undefined };

  const form = useForm<GenerateContentForm>({
    resolver: zodResolver(generateContentSchema),
    defaultValues: {
      prompt: "",
      type: "title",
      tone: "seductive",
      length: "medium",
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (data: GenerateContentForm) => {
      const response = await apiRequest("POST", "/api/generate-content", data);
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedContent(data);
      queryClient.invalidateQueries({ queryKey: ["/api/user/credits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/content-history"] });
      toast({
        title: "Content Generated Successfully!",
        description: "Your content has been generated and saved to your history.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate content. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: GenerateContentForm) => {
    if (!credits || credits.credits <= 0) {
      toast({
        title: "Insufficient Credits",
        description: "You need at least 1 credit to generate content.",
        variant: "destructive",
      });
      return;
    }
    
    generateMutation.mutate(data);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Content copied to clipboard.",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy content to clipboard.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-3xl sm:text-4xl font-black gradient-text mb-2" data-testid="generator-title">
            AI Content Generator
          </h1>
          <p className="text-muted-foreground text-base md:text-lg">
            Generate uncensored adult content with our advanced AI
          </p>
          <div className="flex items-center mt-3 md:mt-4">
            <div className="bg-primary/20 text-primary px-3 py-2 rounded-full text-sm font-semibold" data-testid="credits-display">
              {credits?.credits || 0} credits remaining
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* Generation Form */}
          <Card className="bg-card border-border" data-testid="generation-form">
            <CardHeader>
              <CardTitle className="text-white">Generate New Content</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="prompt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Content Prompt</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter your content idea or topic..."
                            className="min-h-32 text-base"
                            data-testid="input-prompt"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Content Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-type" className="h-12">
                              <SelectValue placeholder="Select content type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="title">Title</SelectItem>
                            <SelectItem value="description">Description</SelectItem>
                            <SelectItem value="script">Script</SelectItem>
                            <SelectItem value="social_post">Social Media Post</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="tone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Tone</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-tone" className="h-12">
                                <SelectValue placeholder="Select tone" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="seductive">Seductive</SelectItem>
                              <SelectItem value="playful">Playful</SelectItem>
                              <SelectItem value="dominant">Dominant</SelectItem>
                              <SelectItem value="submissive">Submissive</SelectItem>
                              <SelectItem value="romantic">Romantic</SelectItem>
                              <SelectItem value="explicit">Explicit</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="length"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Length</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-length" className="h-12">
                                <SelectValue placeholder="Select length" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="short">Short</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="long">Long</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Category (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., MILF, Teen, Fetish, etc."
                            className="h-12 text-base"
                            data-testid="input-category"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground h-12 text-base font-semibold"
                    disabled={generateMutation.isPending || !credits || credits.credits <= 0}
                    data-testid="button-generate"
                  >
                    {generateMutation.isPending ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Generating...
                      </>
                    ) : (
                      <>
                        Generate Content
                        <i className="fas fa-magic ml-2"></i>
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Generated Content Display */}
          <Card className="bg-card border-border" data-testid="generated-content">
            <CardHeader>
              <CardTitle className="text-white">Generated Content</CardTitle>
            </CardHeader>
            <CardContent>
              {generateMutation.isPending ? (
                <div className="space-y-4" data-testid="loading-state">
                  <div className="animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-5/6"></div>
                  </div>
                </div>
              ) : generatedContent ? (
                <div className="space-y-6" data-testid="content-result">
                  {/* Main Content */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold text-white">Generated Content</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(generatedContent.content.content)}
                        data-testid="button-copy-content"
                      >
                        <i className="fas fa-copy mr-1"></i>
                        Copy
                      </Button>
                    </div>
                    <div className="bg-muted/20 p-4 rounded-lg">
                      <p className="text-white whitespace-pre-wrap">{generatedContent.content.content}</p>
                    </div>
                  </div>

                  {/* Additional Fields */}
                  {generatedContent.content.title && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-white">Title</h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(generatedContent.content.title)}
                          data-testid="button-copy-title"
                        >
                          <i className="fas fa-copy mr-1"></i>
                          Copy
                        </Button>
                      </div>
                      <div className="bg-muted/20 p-3 rounded-lg">
                        <p className="text-white">{generatedContent.content.title}</p>
                      </div>
                    </div>
                  )}

                  {generatedContent.content.description && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-white">Description</h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(generatedContent.content.description)}
                          data-testid="button-copy-description"
                        >
                          <i className="fas fa-copy mr-1"></i>
                          Copy
                        </Button>
                      </div>
                      <div className="bg-muted/20 p-3 rounded-lg">
                        <p className="text-white">{generatedContent.content.description}</p>
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {generatedContent.content.tags && generatedContent.content.tags.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-white mb-2">SEO Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {generatedContent.content.tags.map((tag: string, index: number) => (
                          <span
                            key={index}
                            className="bg-primary/20 text-primary px-2 py-1 rounded-full text-sm"
                            data-testid={`tag-${index}`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Metadata */}
                  {generatedContent.content.metadata && (
                    <div className="border-t border-border pt-4">
                      <h4 className="font-semibold text-white mb-2">Content Metadata</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Word Count:</span>
                          <span className="text-white ml-2">{generatedContent.content.metadata.wordCount}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Read Time:</span>
                          <span className="text-white ml-2">{generatedContent.content.metadata.estimatedReadTime} min</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground mt-4" data-testid="credits-used">
                    This generation used 1 credit. You have {generatedContent.creditsRemaining} credits remaining.
                  </div>
                </div>
              ) : (
                <div className="text-center py-12" data-testid="empty-state">
                  <i className="fas fa-magic text-4xl text-muted-foreground mb-4"></i>
                  <p className="text-muted-foreground">Generate content to see results here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
