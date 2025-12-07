import { useParams } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import Header from "@/components/Header";
import ProjectSidebar from "@/components/ProjectSidebar";
import CodeEditor from "@/components/CodeEditor";
import LivePreview from "@/components/LivePreview";
import AIAgent from "@/components/AIAgent";
import Terminal from "@/components/Terminal";
import FloatingButtons from "@/components/FloatingButtons";

export default function Project() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const { socket, isConnected } = useWebSocket();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      <Header />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <ProjectSidebar projectId={id!} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Tab Bar */}
          <div className="h-12 bg-muted border-b border-border flex items-center px-4">
            <div className="flex space-x-1">
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-card rounded-t-md border-b-2 border-primary">
                <i className="fas fa-file-code text-primary text-sm"></i>
                <span className="text-sm">page.tsx</span>
                <i className="fas fa-times text-xs text-muted-foreground hover:text-foreground cursor-pointer"></i>
              </div>
              <div className="flex items-center space-x-2 px-3 py-1.5 hover:bg-card rounded-t-md cursor-pointer">
                <i className="fas fa-eye text-accent text-sm"></i>
                <span className="text-sm">Visual Editor</span>
              </div>
              <div className="flex items-center space-x-2 px-3 py-1.5 hover:bg-card rounded-t-md cursor-pointer">
                <i className="fas fa-cog text-secondary text-sm"></i>
                <span className="text-sm">vibespec.yaml</span>
              </div>
            </div>
            <div className="ml-auto flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-accent animate-pulse' : 'bg-muted-foreground'}`}></div>
                <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
              </div>
              <button className="px-2 py-1 text-xs text-muted-foreground hover:text-primary">
                <i className="fas fa-history mr-1"></i>History
              </button>
            </div>
          </div>

          <div className="flex-1 flex">
            {/* Code Editor */}
            <CodeEditor projectId={id!} socket={socket} />

            {/* Live Preview */}
            <LivePreview projectId={id!} />
          </div>

          {/* Bottom Terminal */}
          <Terminal projectId={id!} />
        </div>

        {/* Right Sidebar - AI Agent & Tools */}
        <AIAgent projectId={id!} socket={socket} />
      </div>

      {/* Floating Action Buttons */}
      <FloatingButtons />
    </div>
  );
}
