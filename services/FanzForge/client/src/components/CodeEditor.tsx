import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CodeEditorProps {
  projectId: string;
  socket?: WebSocket | null;
}

export default function CodeEditor({ projectId, socket }: CodeEditorProps) {
  const [code, setCode] = useState(`import { PaywallComponent } from '@/components/Paywall'
import { DMChat } from '@/components/DMChat'
import { useAuth } from '@/hooks/useAuth'

export default function CreatorPage() {
  const { user, isSubscribed } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-900">
      <header className="p-6 border-b border-neon-pink">
        <h1 className="text-4xl font-bold neon-text">Creator Studio</h1>
      </header>

      {!isSubscribed ? (
        <PaywallComponent tiers={membershipTiers} />
      ) : (
        <DMChat userId={user.id} enableTips />
      )}
    </div>
  )
}`);

  const [showAISuggestion, setShowAISuggestion] = useState(true);

  useEffect(() => {
    if (socket) {
      socket.addEventListener('message', (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'code_update' && data.projectId === projectId) {
          setCode(data.code);
        }
      });
    }
  }, [socket, projectId]);

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'code_update',
        projectId,
        code: newCode
      }));
    }
  };

  const lines = code.split('\n');

  return (
    <div className="flex-1 code-editor relative">
      <div className="absolute top-4 left-4 flex items-center space-x-2 z-10">
        <Badge className="bg-primary/20 text-primary border-primary/30" data-testid="badge-typescript">
          TypeScript
        </Badge>
        <Badge className="bg-secondary/20 text-secondary border-secondary/30" data-testid="badge-react">
          React
        </Badge>
      </div>
      
      <div className="p-6 font-mono text-sm h-full overflow-auto">
        {/* Line numbers */}
        <div className="flex">
          <div className="select-none text-muted-foreground text-right pr-4 space-y-0 leading-6 min-w-12">
            {lines.map((_, index) => (
              <div key={index}>{index + 1}</div>
            ))}
          </div>
          <div className="flex-1 leading-6">
            <textarea
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              className="w-full h-full bg-transparent text-foreground resize-none outline-none border-none font-mono"
              style={{ minHeight: '600px' }}
              data-testid="code-editor-textarea"
            />
          </div>
        </div>
      </div>

      {/* AI Assistant Suggestions */}
      {showAISuggestion && (
        <div className="absolute bottom-4 right-4 floating-panel rounded-lg border border-primary/30 p-3 max-w-sm" data-testid="ai-suggestion">
          <div className="flex items-center space-x-2 mb-2">
            <i className="fas fa-robot text-primary"></i>
            <span className="text-sm font-medium">AI Assistant</span>
          </div>
          <p className="text-xs text-muted-foreground mb-2">Suggested improvement:</p>
          <p className="text-xs">Add 2257 compliance check before content upload</p>
          <div className="flex space-x-2 mt-2">
            <Button 
              size="sm" 
              className="px-2 py-1 bg-primary text-primary-foreground text-xs rounded"
              data-testid="button-apply-suggestion"
            >
              Apply
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="px-2 py-1 text-xs rounded"
              onClick={() => setShowAISuggestion(false)}
              data-testid="button-dismiss-suggestion"
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
