import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AIAgentProps {
  projectId: string;
  socket?: WebSocket | null;
}

export default function AIAgent({ projectId, socket }: AIAgentProps) {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([
    {
      type: 'user',
      content: 'Add a subscription tier with custom pricing'
    },
    {
      type: 'ai',
      content: "I'll add a custom pricing tier to your PaywallComponent. This will include:",
      features: [
        'Dynamic pricing input',
        '2257 compliance integration', 
        'Payment provider setup'
      ]
    }
  ]);

  const { toast } = useToast();

  const aiMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const response = await apiRequest("POST", "/api/ai/chat", {
        projectId,
        prompt,
        context: "code_generation"
      });
      return response.json();
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, {
        type: 'ai',
        content: data.response,
        features: data.features || []
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
    
    setMessages(prev => [...prev, { type: 'user', content: prompt }]);
    aiMutation.mutate(prompt);
  };

  const recentActivity = [
    { icon: 'fas fa-code', color: 'bg-primary', action: 'PaywallComponent updated', time: '2 minutes ago' },
    { icon: 'fas fa-rocket', color: 'bg-secondary', action: 'Deployed to preview', time: '5 minutes ago' },
    { icon: 'fas fa-shield-alt', color: 'bg-accent', action: '2257 compliance verified', time: '10 minutes ago' },
  ];

  return (
    <aside className="w-80 bg-card border-l border-border flex flex-col">
      {/* AI Agent Panel */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center animate-neon-pulse">
            <i className="fas fa-robot text-sm text-primary-foreground"></i>
          </div>
          <h3 className="font-semibold" data-testid="text-ai-agent-title">FANZ AI Agent</h3>
        </div>
        
        <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
          {messages.map((message, index) => (
            <div key={index} className={`p-3 rounded-lg ${
              message.type === 'user' 
                ? 'bg-muted' 
                : 'bg-primary/10 border border-primary/30'
            }`} data-testid={`message-${message.type}-${index}`}>
              <div className="text-xs mb-1" style={{color: message.type === 'user' ? 'var(--muted-foreground)' : 'var(--primary)'}}>
                {message.type === 'user' ? 'You' : 'AI Agent'}
              </div>
              <div className="text-sm">{message.content}</div>
              {message.features && (
                <ul className="text-xs mt-2 space-y-1 text-muted-foreground">
                  {message.features.map((feature, i) => (
                    <li key={i}>• {feature}</li>
                  ))}
                </ul>
              )}
              {message.type === 'ai' && (
                <div className="flex space-x-2 mt-3">
                  <Button size="sm" className="px-3 py-1 bg-primary text-primary-foreground text-xs rounded" data-testid="button-apply-changes">
                    Apply Changes
                  </Button>
                  <Button size="sm" variant="outline" className="px-3 py-1 text-xs rounded" data-testid="button-modify">
                    Modify
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <form onSubmit={handleSubmit} className="relative">
          <Input
            type="text"
            placeholder="Describe what you want to build..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm pr-10"
            disabled={aiMutation.isPending}
            data-testid="input-ai-prompt"
          />
          <Button 
            type="submit"
            size="sm"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-primary"
            disabled={aiMutation.isPending || !prompt.trim()}
            data-testid="button-send-prompt"
          >
            {aiMutation.isPending ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : (
              <i className="fas fa-paper-plane"></i>
            )}
          </Button>
        </form>
      </div>

      {/* Visual Composer */}
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold mb-3" data-testid="text-visual-composer-title">Visual Composer</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 bg-muted rounded hover:bg-primary/20 hover:border-primary border border-transparent cursor-pointer transition-all" data-testid="block-paywall">
            <i className="fas fa-credit-card text-primary mb-2"></i>
            <div className="text-xs">Paywall Block</div>
          </div>
          <div className="p-3 bg-muted rounded hover:bg-secondary/20 hover:border-secondary border border-transparent cursor-pointer transition-all" data-testid="block-dm-chat">
            <i className="fas fa-comments text-secondary mb-2"></i>
            <div className="text-xs">DM Chat</div>
          </div>
          <div className="p-3 bg-muted rounded hover:bg-accent/20 hover:border-accent border border-transparent cursor-pointer transition-all" data-testid="block-media-upload">
            <i className="fas fa-upload text-accent mb-2"></i>
            <div className="text-xs">Media Upload</div>
          </div>
          <div className="p-3 bg-muted rounded hover:bg-yellow-400/20 hover:border-yellow-400 border border-transparent cursor-pointer transition-all" data-testid="block-2257-form">
            <i className="fas fa-shield-alt text-yellow-400 mb-2"></i>
            <div className="text-xs">2257 Form</div>
          </div>
        </div>
      </div>

      {/* Project Analytics */}
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold mb-3" data-testid="text-analytics-title">Analytics</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Build Time</span>
            <span className="text-sm text-primary" data-testid="metric-build-time">2.3s</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Bundle Size</span>
            <span className="text-sm text-secondary" data-testid="metric-bundle-size">1.2MB</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Performance</span>
            <span className="text-sm text-accent" data-testid="metric-performance">98/100</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Compliance</span>
            <span className="text-sm text-green-400" data-testid="metric-compliance">✓ 2257 Ready</span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="flex-1 p-4">
        <h3 className="font-semibold mb-3" data-testid="text-activity-title">Recent Activity</h3>
        <div className="space-y-3">
          {recentActivity.map((activity, index) => (
            <div key={index} className="flex items-start space-x-3" data-testid={`activity-${index}`}>
              <div className={`w-6 h-6 ${activity.color} rounded-full flex items-center justify-center flex-shrink-0`}>
                <i className={`${activity.icon} text-xs text-white`}></i>
              </div>
              <div>
                <div className="text-sm">{activity.action}</div>
                <div className="text-xs text-muted-foreground">{activity.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
