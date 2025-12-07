import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { 
  Sparkles, 
  MessageSquare, 
  TrendingUp, 
  Lightbulb, 
  Clock, 
  Hash,
  BarChart3,
  Wand2,
  Send,
  Copy,
  RefreshCw
} from "lucide-react";

export default function AIAssistantPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("content");

  const form = useForm({
    defaultValues: {
      type: "content_generation",
      assistantType: "content_creator",
      prompt: ""
    }
  });

  // AI Request mutation
  const aiRequestMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/ai/request", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/history'] });
      form.reset();
      toast({
        title: "AI Assistant Response Ready! ✨",
        description: "Your request has been processed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "AI Request Failed",
        description: error.message || "Failed to process AI request",
        variant: "destructive"
      });
    }
  });

  // Get content suggestions
  const { data: contentSuggestions = [] } = useQuery({
    queryKey: ['/api/ai/content-suggestions'],
    queryFn: async () => {
      const response = await fetch('/api/ai/content-suggestions');
      return response.json();
    }
  });

  // Get optimal posting times
  const { data: optimalTimes = [] } = useQuery({
    queryKey: ['/api/ai/optimal-times'],
    queryFn: async () => {
      const response = await fetch('/api/ai/optimal-times');
      return response.json();
    }
  });

  // Get AI request history
  const { data: aiHistory = [] } = useQuery({
    queryKey: ['/api/ai/history'],
    queryFn: async () => {
      const response = await fetch('/api/ai/history');
      return response.json();
    }
  });

  const onSubmit = (data: any) => {
    aiRequestMutation.mutate(data);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to Clipboard!",
      description: "Text has been copied to your clipboard.",
    });
  };

  const quickPrompts = {
    content_generation: [
      "Write a flirty caption for my new photo post",
      "Create 5 engaging story ideas for this week",
      "Generate a seductive message template for new subscribers",
      "Write a bio that converts visitors to subscribers"
    ],
    hashtag_suggestions: [
      "Suggest trending hashtags for adult content creators",
      "Find hashtags for fitness and adult content crossover",
      "Recommend hashtags for couple content",
      "What hashtags work best for PPV posts?"
    ],
    content_optimization: [
      "How can I improve my engagement rates?",
      "Optimize this post for maximum reach",
      "What time should I post for best engagement?",
      "How to price my PPV content effectively?"
    ]
  };

  if (!user || user.role !== 'creator') {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardContent className="p-8 text-center">
            <Sparkles size={64} className="mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Creator AI Assistant</h2>
            <p className="text-muted-foreground">
              This feature is available for creators only. Upgrade your account to access AI-powered content assistance.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl" data-testid="ai-assistant-page">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center space-x-2">
          <Sparkles className="text-primary" />
          <span>AI Assistant</span>
        </h1>
        <p className="text-muted-foreground mt-2">
          Boost your content creation with AI-powered suggestions and optimization
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="content" className="flex items-center space-x-2" data-testid="tab-content">
            <MessageSquare size={16} />
            <span>Content</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2" data-testid="tab-analytics">
            <BarChart3 size={16} />
            <span>Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="flex items-center space-x-2" data-testid="tab-suggestions">
            <Lightbulb size={16} />
            <span>Suggestions</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center space-x-2" data-testid="tab-history">
            <Clock size={16} />
            <span>History</span>
          </TabsTrigger>
        </TabsList>

        {/* Content Generation Tab */}
        <TabsContent value="content" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AI Request Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wand2 className="text-primary" />
                  <span>AI Content Generator</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Request Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="ai-type-select">
                                <SelectValue placeholder="Select request type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="content_generation">Content Generation</SelectItem>
                              <SelectItem value="content_optimization">Content Optimization</SelectItem>
                              <SelectItem value="caption_writing">Caption Writing</SelectItem>
                              <SelectItem value="hashtag_suggestions">Hashtag Suggestions</SelectItem>
                              <SelectItem value="pricing_recommendations">Pricing Advice</SelectItem>
                              <SelectItem value="fan_engagement">Fan Engagement</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="prompt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Request</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe what you need help with..."
                              className="min-h-24"
                              {...field}
                              data-testid="ai-prompt-input"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={aiRequestMutation.isPending}
                      className="w-full"
                      data-testid="submit-ai-request"
                    >
                      {aiRequestMutation.isPending ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Generate
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Quick Prompts */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Prompts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {quickPrompts[form.watch("type") as keyof typeof quickPrompts]?.map((prompt, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full text-left h-auto p-3 whitespace-normal"
                      onClick={() => form.setValue("prompt", prompt)}
                      data-testid={`quick-prompt-${index}`}
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="text-primary" />
                  <span>Optimal Posting Times</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {optimalTimes.map((time: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="font-medium">{time.hour}:00</span>
                      <Badge variant="secondary" data-testid={`optimal-time-${index}`}>
                        {time.engagement}% engagement
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="text-primary" />
                  <span>Performance Insights</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-2">Engagement Rate</h4>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-background rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: "75%" }}></div>
                      </div>
                      <span className="text-sm font-medium">7.5%</span>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-2">Content Performance</h4>
                    <p className="text-sm text-muted-foreground">
                      Your recent posts are performing 23% above average. Keep up the great work!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Suggestions Tab */}
        <TabsContent value="suggestions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lightbulb className="text-primary" />
                <span>Content Ideas</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {contentSuggestions.map((suggestion: string, index: number) => (
                  <div key={index} className="p-4 border rounded-lg hover:bg-muted transition-colors">
                    <p className="text-sm mb-3">{suggestion}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        form.setValue("type", "content_generation");
                        form.setValue("prompt", `Create content based on this idea: ${suggestion}`);
                        setActiveTab("content");
                      }}
                      data-testid={`use-suggestion-${index}`}
                    >
                      Use This Idea
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="text-primary" />
                <span>Request History</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {aiHistory.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No AI requests yet. Start generating content to see your history here.
                    </p>
                  ) : (
                    aiHistory.map((request: any) => (
                      <div key={request.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <Badge variant="outline" className="mb-2">
                              {request.type.replace('_', ' ')}
                            </Badge>
                            <p className="text-sm text-muted-foreground">
                              {request.prompt}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        
                        {request.response && (
                          <div className="bg-muted p-3 rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-sm font-medium">AI Response:</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(request.response)}
                                data-testid={`copy-response-${request.id}`}
                              >
                                <Copy size={14} />
                              </Button>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{request.response}</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}