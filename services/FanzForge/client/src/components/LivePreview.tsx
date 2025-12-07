import { Button } from "@/components/ui/button";

interface LivePreviewProps {
  projectId: string;
}

export default function LivePreview({ projectId }: LivePreviewProps) {
  return (
    <div className="w-96 bg-muted border-l border-border flex flex-col">
      <div className="h-12 bg-card border-b border-border flex items-center justify-between px-4">
        <span className="text-sm font-medium" data-testid="text-preview-title">Live Preview</span>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
          <Button variant="ghost" size="sm" className="p-1 hover:bg-muted rounded" data-testid="button-open-preview">
            <i className="fas fa-external-link-alt text-xs text-muted-foreground"></i>
          </Button>
        </div>
      </div>
      
      {/* Mobile Preview Frame */}
      <div className="flex-1 p-4">
        <div className="w-full h-full bg-gradient-to-br from-purple-900 to-blue-900 rounded-lg overflow-hidden relative" data-testid="preview-frame">
          {/* Creator Studio Preview */}
          <div className="p-4">
            <h1 className="text-2xl font-bold text-center mb-6 neon-text" data-testid="preview-title">Creator Studio</h1>
            
            {/* Paywall Component Preview */}
            <div className="neon-border rounded-lg p-4 mb-4" data-testid="preview-paywall">
              <h3 className="text-lg font-bold text-primary mb-3">Unlock Premium Content</h3>
              <div className="space-y-3">
                <div className="p-3 bg-card rounded border border-primary/30" data-testid="tier-bronze">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Bronze Tier</span>
                    <span className="text-primary font-bold">$9.99/mo</span>
                  </div>
                </div>
                <div className="p-3 bg-card rounded border border-secondary/30" data-testid="tier-silver">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Silver Tier</span>
                    <span className="text-secondary font-bold">$19.99/mo</span>
                  </div>
                </div>
                <div className="p-3 bg-card rounded border border-accent/30" data-testid="tier-gold">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Gold Tier</span>
                    <span className="text-accent font-bold">$39.99/mo</span>
                  </div>
                </div>
              </div>
              <Button className="w-full mt-4 px-4 py-2 bg-primary text-primary-foreground rounded font-medium" data-testid="button-subscribe">
                Subscribe Now
              </Button>
            </div>

            {/* DM Chat Preview */}
            <div className="neon-border rounded-lg p-4" data-testid="preview-chat">
              <h3 className="text-lg font-bold text-secondary mb-3">Private Messages</h3>
              <div className="space-y-2 mb-3">
                <div className="p-2 bg-muted rounded text-sm" data-testid="message-creator">
                  Hey! Thanks for subscribing 💕
                </div>
                <div className="p-2 bg-primary text-primary-foreground rounded text-sm ml-8" data-testid="message-user">
                  Love your content!
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input 
                  type="text" 
                  placeholder="Send tip message..." 
                  className="flex-1 px-2 py-1 bg-input rounded text-sm"
                  data-testid="input-message"
                />
                <Button size="sm" className="px-2 py-1 bg-accent text-accent-foreground rounded text-sm" data-testid="button-tip">
                  <i className="fas fa-dollar-sign"></i>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
