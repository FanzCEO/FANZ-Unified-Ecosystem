import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import type { Project } from "@shared/schema";

interface ProjectSidebarProps {
  projectId: string;
}

export default function ProjectSidebar({ projectId }: ProjectSidebarProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['app', 'components']));

  const { data: project } = useQuery<Project>({
    queryKey: ["/api/projects", projectId],
    retry: false,
  });

  const toggleFolder = (folder: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folder)) {
      newExpanded.delete(folder);
    } else {
      newExpanded.add(folder);
    }
    setExpandedFolders(newExpanded);
  };

  const fileTree = [
    { type: 'folder', name: 'app', icon: 'fas fa-folder', color: 'text-primary' },
    { type: 'file', name: 'layout.tsx', icon: 'fas fa-file-code', color: 'text-secondary', parent: 'app' },
    { type: 'file', name: 'page.tsx', icon: 'fas fa-file-code', color: 'text-accent', parent: 'app', active: true },
    { type: 'folder', name: 'components', icon: 'fas fa-folder', color: 'text-primary' },
    { type: 'file', name: 'Paywall.tsx', icon: 'fas fa-file-code', color: 'text-secondary', parent: 'components' },
    { type: 'file', name: 'DMChat.tsx', icon: 'fas fa-file-code', color: 'text-accent', parent: 'components' },
    { type: 'file', name: 'vibespec.yaml', icon: 'fas fa-file', color: 'text-yellow-400' },
  ];

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col">
      {/* Project Info */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-primary" data-testid="text-project-name">
            {project?.name || 'Creator Paywall DM'}
          </h3>
          <i className="fas fa-cog text-muted-foreground hover:text-primary cursor-pointer" data-testid="button-project-settings"></i>
        </div>
        <div className="text-xs text-muted-foreground mb-2" data-testid="text-project-stack">
          {project?.stack || 'Next.js • FANZ Stack'}
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
          <span className="text-accent" data-testid="status-live-preview">Live Preview</span>
        </div>
      </div>

      {/* File Explorer */}
      <div className="flex-1 p-4">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Files</h4>
        <div className="space-y-1">
          {fileTree.map((item, index) => {
            if (item.type === 'folder') {
              const isExpanded = expandedFolders.has(item.name);
              return (
                <div key={index}>
                  <div 
                    className="flex items-center space-x-2 p-2 rounded hover:bg-muted cursor-pointer"
                    onClick={() => toggleFolder(item.name)}
                    data-testid={`folder-${item.name}`}
                  >
                    <i className={`fas ${isExpanded ? 'fa-folder-open' : 'fa-folder'} ${item.color} text-sm`}></i>
                    <span className="text-sm">{item.name}</span>
                    <i className={`fas fa-chevron-${isExpanded ? 'down' : 'right'} text-xs text-muted-foreground ml-auto`}></i>
                  </div>
                  {isExpanded && fileTree
                    .filter(file => file.parent === item.name)
                    .map((file, fileIndex) => (
                      <div 
                        key={fileIndex}
                        className={`flex items-center space-x-2 p-2 rounded cursor-pointer ml-4 ${
                          file.active ? 'bg-muted' : 'hover:bg-muted'
                        }`}
                        data-testid={`file-${file.name}`}
                      >
                        <i className={`${file.icon} ${file.color} text-sm`}></i>
                        <span className="text-sm">{file.name}</span>
                      </div>
                    ))
                  }
                </div>
              );
            } else if (!item.parent) {
              return (
                <div 
                  key={index}
                  className={`flex items-center space-x-2 p-2 rounded cursor-pointer ${
                    item.active ? 'bg-muted' : 'hover:bg-muted'
                  }`}
                  data-testid={`file-${item.name}`}
                >
                  <i className={`${item.icon} ${item.color} text-sm`}></i>
                  <span className="text-sm">{item.name}</span>
                </div>
              );
            }
            return null;
          })}
        </div>

        {/* FANZ Tools */}
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 mt-6">FANZ Tools</h4>
        <div className="space-y-1">
          <div className="flex items-center space-x-2 p-2 rounded hover:bg-muted cursor-pointer" data-testid="tool-compliance">
            <i className="fas fa-shield-alt text-primary text-sm"></i>
            <span className="text-sm">2257 Compliance</span>
          </div>
          <div className="flex items-center space-x-2 p-2 rounded hover:bg-muted cursor-pointer" data-testid="tool-payments">
            <i className="fas fa-credit-card text-secondary text-sm"></i>
            <span className="text-sm">Payment Setup</span>
          </div>
          <div className="flex items-center space-x-2 p-2 rounded hover:bg-muted cursor-pointer" data-testid="tool-members">
            <i className="fas fa-users text-accent text-sm"></i>
            <span className="text-sm">Member Tiers</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-t border-border">
        <Button 
          className="w-full px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:shadow-lg transition-all"
          onClick={() => {
            // Deploy functionality will be implemented
            console.log('Deploy clicked for project:', projectId);
          }}
          data-testid="button-deploy"
        >
          <i className="fas fa-rocket mr-2"></i>Deploy to Production
        </Button>
      </div>
    </aside>
  );
}
