import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface AdultAIAgentProps {
  projectId?: string;
  onClose?: () => void;
}

interface Message {
  type: 'user' | 'ai';
  content: string;
  features?: string[];
  suggestions?: string[];
  timestamp: Date;
}

export default function AdultAIAgent({ projectId, onClose }: AdultAIAgentProps) {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      type: 'ai',
      content: "I'm your unrestricted AI assistant for adult content platform development. I can help you with:\n\n• Adult tube sites and video platforms\n• Cam sites and live streaming\n• Content aggregators and scrapers\n• Payment systems and paywalls\n• Age verification and 2257 compliance\n• Adult affiliate networks\n• Content protection and anti-piracy\n\nFeel free to ask anything about building adult platforms - no restrictions!",
      features: ['Unrestricted Content', 'Adult Platform Expertise', 'No Language Filters', 'Technical Implementation'],
      timestamp: new Date()
    }
  ]);

  const { toast } = useToast();

  const aiMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const response = await apiRequest("POST", "/api/ai/chat", {
        projectId: projectId || 'general',
        prompt,
        context: "adult_content_development",
        unrestricted: true
      });
      return response.json();
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, {
        type: 'ai',
        content: data.response,
        features: data.features || [],
        suggestions: data.suggestions || [],
        timestamp: new Date()
      }]);
      setPrompt("");
    },
    onError: (error) => {
      toast({
        title: "AI Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    setMessages(prev => [...prev, { 
      type: 'user', 
      content: prompt,
      timestamp: new Date()
    }]);
    aiMutation.mutate(prompt);
  };

  const quickPrompts = [
    "Create a cam site payment system",
    "Build adult content aggregator API",
    "Implement age verification flow",
    "Set up 2257 compliance system",
    "Create adult affiliate tracking",
    "Build video tube categorization"
  ];

  return (
    <div className="w-96 h-full bg-card border-l border-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center">
              <i className="fas fa-robot text-white text-sm"></i>
            </div>
            <h3 className="font-semibold">Adult AI Agent</h3>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} data-testid="button-close-ai">
              <i className="fas fa-times"></i>
            </Button>
          )}
        </div>
        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
          <i className="fas fa-unlock mr-1"></i>
          Unrestricted Mode
        </Badge>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-lg p-3 ${
                message.type === 'user' 
                  ? 'bg-primary text-primary-foreground ml-auto' 
                  : 'bg-muted'
              }`}>
                <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                
                {message.features && message.features.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {message.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center text-xs text-muted-foreground">
                        <i className="fas fa-check text-accent mr-2"></i>
                        {feature}
                      </div>
                    ))}
                  </div>
                )}
                
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">Suggestions:</div>
                    {message.suggestions.map((suggestion, idx) => (
                      <div key={idx} className="text-xs text-muted-foreground italic">
                        • {suggestion}
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="text-xs text-muted-foreground mt-2">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          
          {aiMutation.isPending && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg p-3 max-w-[85%]">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  <span className="text-sm text-muted-foreground">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Quick Prompts */}
      <div className="p-4 border-t border-border">
        <div className="mb-3">
          <div className="text-xs font-medium text-muted-foreground mb-2">Quick Prompts:</div>
          <div className="grid grid-cols-2 gap-1">
            {quickPrompts.map((quickPrompt, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="text-xs h-auto py-1 px-2 text-left justify-start"
                onClick={() => setPrompt(quickPrompt)}
                data-testid={`quick-prompt-${index}`}
              >
                {quickPrompt}
              </Button>
            ))}
          </div>
        </div>
        
        <Separator className="mb-3" />
        
        {/* Input */}
        <form onSubmit={handleSubmit} className="space-y-2">
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask me anything about adult platforms..."
            disabled={aiMutation.isPending}
            className="text-sm"
            data-testid="input-ai-prompt"
          />
          <Button 
            type="submit" 
            disabled={!prompt.trim() || aiMutation.isPending}
            className="w-full"
            data-testid="button-send-prompt"
          >
            {aiMutation.isPending ? (
              <>
                <i className="fas fa-spinner animate-spin mr-2"></i>
                Thinking...
              </>
            ) : (
              <>
                <i className="fas fa-paper-plane mr-2"></i>
                Send
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}