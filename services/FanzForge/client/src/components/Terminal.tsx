import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface TerminalProps {
  projectId: string;
}

interface LogEntry {
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
  timestamp: Date;
}

export default function Terminal({ projectId }: TerminalProps) {
  const [activeTab, setActiveTab] = useState('console');
  const [logs, setLogs] = useState<LogEntry[]>([
    { type: 'success', message: '✓ Project initialized with FANZ template', timestamp: new Date() },
    { type: 'success', message: '✓ Dependencies installed (React 18, Next.js 14)', timestamp: new Date() },
    { type: 'success', message: '✓ 2257 compliance module configured', timestamp: new Date() },
    { type: 'success', message: '✓ Payment providers (CCBill, NMI) integrated', timestamp: new Date() },
    { type: 'success', message: '✓ Development server started on port 3000', timestamp: new Date() },
    { type: 'info', message: 'Building for production...', timestamp: new Date() },
    { type: 'warning', message: '⚠ Remember to configure age verification flow', timestamp: new Date() },
    { type: 'success', message: '✓ Build completed in 2.3s', timestamp: new Date() },
  ]);
  const [command, setCommand] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    // Simulate real-time logs
    const interval = setInterval(() => {
      if (Math.random() > 0.8) {
        const messages = [
          '✓ Hot reload triggered',
          '✓ TypeScript compilation completed',
          '⚠ ESLint warning in component',
          '✓ Bundle updated successfully'
        ];
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        const type = randomMessage.includes('⚠') ? 'warning' : 'success';
        
        setLogs(prev => [...prev, {
          type: type as LogEntry['type'],
          message: randomMessage,
          timestamp: new Date()
        }]);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return 'terminal-green';
      case 'info': return 'text-primary';
      case 'warning': return 'text-yellow-400';
      case 'error': return 'text-destructive';
      default: return 'text-foreground';
    }
  };

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;
    
    setLogs(prev => [...prev, {
      type: 'info',
      message: `$ ${command}`,
      timestamp: new Date()
    }]);
    
    // Simulate command execution
    setTimeout(() => {
      setLogs(prev => [...prev, {
        type: 'success',
        message: `Command executed successfully`,
        timestamp: new Date()
      }]);
    }, 500);
    
    setCommand('');
  };

  if (isMinimized) {
    return (
      <div className="h-10 bg-card border-t border-border flex items-center px-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsMinimized(false)}
          data-testid="button-expand-terminal"
        >
          <i className="fas fa-terminal mr-2"></i>
          Terminal
          <i className="fas fa-chevron-up ml-2"></i>
        </Button>
      </div>
    );
  }

  return (
    <div className="h-48 bg-card border-t border-border flex flex-col">
      <div className="h-10 bg-muted border-b border-border flex items-center px-4">
        <div className="flex space-x-4">
          <button 
            className={`text-sm ${activeTab === 'console' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'} pb-1`}
            onClick={() => setActiveTab('console')}
            data-testid="tab-console"
          >
            Console
          </button>
          <button 
            className={`text-sm ${activeTab === 'logs' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'} pb-1`}
            onClick={() => setActiveTab('logs')}
            data-testid="tab-logs"
          >
            Build Logs
          </button>
          <button 
            className={`text-sm ${activeTab === 'analytics' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'} pb-1`}
            onClick={() => setActiveTab('analytics')}
            data-testid="tab-analytics"
          >
            Analytics
          </button>
        </div>
        <div className="ml-auto flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLogs([])}
            data-testid="button-clear-logs"
          >
            <i className="fas fa-trash text-xs"></i>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsMinimized(true)}
            data-testid="button-minimize-terminal"
          >
            <i className="fas fa-minus text-xs"></i>
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden">
        {activeTab === 'console' && (
          <div className="h-full flex flex-col">
            <div className="flex-1 p-4 font-mono text-sm overflow-auto" data-testid="terminal-output">
              <div className="space-y-1">
                {logs.map((log, index) => (
                  <div key={index} className={getLogColor(log.type)}>
                    {log.message}
                  </div>
                ))}
                <form onSubmit={handleCommand} className="flex items-center space-x-2 mt-2">
                  <span className="text-primary">$</span>
                  <input
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    className="bg-transparent outline-none border-none text-foreground flex-1"
                    placeholder="Enter command..."
                    data-testid="terminal-input"
                  />
                </form>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'logs' && (
          <div className="p-4 font-mono text-sm overflow-auto" data-testid="build-logs">
            <div className="space-y-1">
              <div className="text-primary">Build started at {new Date().toLocaleTimeString()}</div>
              <div className="terminal-green">✓ TypeScript compilation successful</div>
              <div className="terminal-green">✓ ESLint checks passed</div>
              <div className="terminal-green">✓ Bundle optimization complete</div>
              <div className="text-primary">Build completed successfully</div>
            </div>
          </div>
        )}
        
        {activeTab === 'analytics' && (
          <div className="p-4" data-testid="analytics-panel">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Build Performance</div>
                <div className="text-accent font-mono">2.3s</div>
              </div>
              <div>
                <div className="text-muted-foreground">Bundle Size</div>
                <div className="text-secondary font-mono">1.2MB</div>
              </div>
              <div>
                <div className="text-muted-foreground">Code Coverage</div>
                <div className="text-primary font-mono">94%</div>
              </div>
              <div>
                <div className="text-muted-foreground">Performance Score</div>
                <div className="text-accent font-mono">98/100</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
