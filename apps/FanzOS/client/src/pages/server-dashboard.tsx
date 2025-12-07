import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Server, 
  HardDrive, 
  Cpu, 
  MemoryStick, 
  Activity, 
  Terminal, 
  FolderOpen, 
  Users, 
  Settings, 
  Power, 
  PlayCircle, 
  StopCircle,
  RefreshCw,
  Trash2,
  Plus,
  Download,
  Upload,
  Shield,
  Key,
  Monitor,
  Database,
  Wifi,
  Globe
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface SystemInfo {
  hostname: string;
  platform: string;
  arch: string;
  cpus: number;
  totalMemory: number;
  freeMemory: number;
  uptime: number;
  loadAverage: number[];
  nodeVersion: string;
  npmVersion: string;
}

interface ServiceStatus {
  name: string;
  status: 'running' | 'stopped' | 'error';
  pid?: number;
  port?: number;
  uptime?: string;
}

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  service: string;
  message: string;
}

interface FileSystemItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number;
  modified: Date;
  permissions: string;
  owner: string;
}

export default function ServerDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentPath, setCurrentPath] = useState('.');
  const [newDirName, setNewDirName] = useState('');

  // Fetch system information
  const { data: systemInfo } = useQuery<SystemInfo>({
    queryKey: ['/api/server/system-info'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch services status
  const { data: services } = useQuery<ServiceStatus[]>({
    queryKey: ['/api/server/services'],
    refetchInterval: 10000 // Refresh every 10 seconds
  });

  // Fetch logs
  const { data: logs } = useQuery<LogEntry[]>({
    queryKey: ['/api/server/logs'],
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  // Fetch file system
  const { data: fileSystem } = useQuery<FileSystemItem[]>({
    queryKey: ['/api/server/filesystem', currentPath],
  });

  // Setup SSH mutation
  const setupSSHMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/server/setup-ssh'),
    onSuccess: async (response) => {
      const data = await response.json();
      toast({
        title: data.success ? "Success" : "Error",
        description: data.message,
        variant: data.success ? "default" : "destructive"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/server/services'] });
    }
  });

  // Setup FTP mutation
  const setupFTPMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/server/setup-ftp'),
    onSuccess: async (response) => {
      const data = await response.json();
      toast({
        title: data.success ? "Success" : "Error",
        description: data.message,
        variant: data.success ? "default" : "destructive"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/server/services'] });
    }
  });

  // Service control mutations
  const restartServiceMutation = useMutation({
    mutationFn: (serviceName: string) => 
      apiRequest('POST', `/api/server/services/${serviceName}/restart`),
    onSuccess: async (response) => {
      const data = await response.json();
      toast({
        title: data.success ? "Success" : "Error",
        description: data.message,
        variant: data.success ? "default" : "destructive"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/server/services'] });
    }
  });

  // File system mutations
  const createDirectoryMutation = useMutation({
    mutationFn: (dirName: string) => 
      apiRequest('POST', '/api/server/filesystem/directory', { 
        path: `${currentPath}/${dirName}` 
      }),
    onSuccess: async (response) => {
      const data = await response.json();
      toast({
        title: data.success ? "Success" : "Error",
        description: data.message,
        variant: data.success ? "default" : "destructive"
      });
      if (data.success) {
        setNewDirName('');
        queryClient.invalidateQueries({ queryKey: ['/api/server/filesystem', currentPath] });
      }
    }
  });

  const deleteItemMutation = useMutation({
    mutationFn: (itemPath: string) => 
      apiRequest('DELETE', '/api/server/filesystem/item', { path: itemPath }),
    onSuccess: async (response) => {
      const data = await response.json();
      toast({
        title: data.success ? "Success" : "Error",
        description: data.message,
        variant: data.success ? "default" : "destructive"
      });
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['/api/server/filesystem', currentPath] });
      }
    }
  });

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const getServiceStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-500';
      case 'stopped': return 'bg-gray-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-500';
      case 'warn': return 'text-yellow-500';
      case 'info': return 'text-blue-500';
      case 'debug': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Server Management Dashboard
          </h1>
          <p className="text-muted-foreground">
            Complete server control panel for FansLab platform
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => queryClient.invalidateQueries()}
            data-testid="button-refresh"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            Services
          </TabsTrigger>
          <TabsTrigger value="files" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Files
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            Logs
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="network" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Network
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {systemInfo && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                    <Cpu className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{systemInfo.cpus} cores</div>
                    <Progress value={systemInfo.loadAverage[0] * 25} className="mt-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      Load: {systemInfo.loadAverage[0].toFixed(2)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Memory</CardTitle>
                    <MemoryStick className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatBytes(systemInfo.totalMemory - systemInfo.freeMemory)}
                    </div>
                    <Progress 
                      value={((systemInfo.totalMemory - systemInfo.freeMemory) / systemInfo.totalMemory) * 100} 
                      className="mt-2" 
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      of {formatBytes(systemInfo.totalMemory)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Uptime</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatUptime(systemInfo.uptime)}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Since last restart
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Platform</CardTitle>
                    <Server className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{systemInfo.platform}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {systemInfo.arch} • Node {systemInfo.nodeVersion}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>System Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Hostname:</span>
                      <p className="text-muted-foreground">{systemInfo.hostname}</p>
                    </div>
                    <div>
                      <span className="font-medium">Architecture:</span>
                      <p className="text-muted-foreground">{systemInfo.arch}</p>
                    </div>
                    <div>
                      <span className="font-medium">Node Version:</span>
                      <p className="text-muted-foreground">{systemInfo.nodeVersion}</p>
                    </div>
                    <div>
                      <span className="font-medium">NPM Version:</span>
                      <p className="text-muted-foreground">{systemInfo.npmVersion}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="services" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Service Status</CardTitle>
              <CardDescription>
                Monitor and control all platform services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {services?.map((service, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${getServiceStatusColor(service.status)}`} />
                      <div>
                        <h3 className="font-medium">{service.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {service.port && <span>Port: {service.port}</span>}
                          {service.pid && <span>PID: {service.pid}</span>}
                          {service.uptime && <span>Uptime: {service.uptime}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={service.status === 'running' ? 'default' : 'secondary'}>
                        {service.status}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => restartServiceMutation.mutate(service.name.toLowerCase().split(' ')[0])}
                        disabled={restartServiceMutation.isPending}
                        data-testid={`button-restart-${service.name.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>File Manager</CardTitle>
              <CardDescription>
                Browse and manage server files
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Input
                    value={currentPath}
                    onChange={(e) => setCurrentPath(e.target.value)}
                    placeholder="Enter path..."
                    className="flex-1"
                    data-testid="input-current-path"
                  />
                  <Button
                    variant="outline"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/server/filesystem', currentPath] })}
                    data-testid="button-refresh-files"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    value={newDirName}
                    onChange={(e) => setNewDirName(e.target.value)}
                    placeholder="New directory name..."
                    data-testid="input-new-directory"
                  />
                  <Button
                    onClick={() => newDirName && createDirectoryMutation.mutate(newDirName)}
                    disabled={!newDirName || createDirectoryMutation.isPending}
                    data-testid="button-create-directory"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create
                  </Button>
                </div>

                <ScrollArea className="h-96 border rounded-md">
                  <div className="p-4">
                    {fileSystem?.map((item, index) => (
                      <div key={index} className="flex items-center justify-between py-2 px-2 hover:bg-accent rounded-lg">
                        <div className="flex items-center space-x-3">
                          {item.type === 'directory' ? (
                            <FolderOpen className="h-5 w-5 text-blue-500" />
                          ) : (
                            <div className="h-5 w-5" />
                          )}
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.permissions} • {item.owner} • {formatBytes(item.size)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.type === 'directory' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setCurrentPath(item.path)}
                              data-testid={`button-open-${item.name}`}
                            >
                              Open
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteItemMutation.mutate(item.path)}
                            disabled={deleteItemMutation.isPending}
                            data-testid={`button-delete-${item.name}`}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Logs</CardTitle>
              <CardDescription>
                Real-time server and application logs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96 border rounded-md">
                <div className="p-4 space-y-2">
                  {logs?.map((log, index) => (
                    <div key={index} className="flex items-start space-x-3 text-sm">
                      <span className="text-muted-foreground whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span className={`font-medium uppercase whitespace-nowrap ${getLogLevelColor(log.level)}`}>
                        {log.level}
                      </span>
                      <span className="font-medium text-blue-600 whitespace-nowrap">
                        {log.service}
                      </span>
                      <span className="flex-1">{log.message}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  SSH Server
                </CardTitle>
                <CardDescription>
                  Secure shell access configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">SSH Service</p>
                    <p className="text-sm text-muted-foreground">Port 2222</p>
                  </div>
                  <Button
                    onClick={() => setupSSHMutation.mutate()}
                    disabled={setupSSHMutation.isPending}
                    data-testid="button-setup-ssh"
                  >
                    {setupSSHMutation.isPending ? 'Setting up...' : 'Setup SSH'}
                  </Button>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">
                    SSH provides secure command-line access to your server. 
                    Use this for remote administration and file transfers.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  FTP Server
                </CardTitle>
                <CardDescription>
                  File transfer protocol configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">FTP Service</p>
                    <p className="text-sm text-muted-foreground">Port 21 (FTPS enabled)</p>
                  </div>
                  <Button
                    onClick={() => setupFTPMutation.mutate()}
                    disabled={setupFTPMutation.isPending}
                    data-testid="button-setup-ftp"
                  >
                    {setupFTPMutation.isPending ? 'Setting up...' : 'Setup FTP'}
                  </Button>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">
                    FTP provides secure file transfer capabilities with SSL/TLS encryption. 
                    Perfect for bulk uploads and downloads.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="network" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                Network Configuration
              </CardTitle>
              <CardDescription>
                Network services and connectivity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Web Server
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">Port 3000</p>
                  <Badge variant="default" className="mt-2">Running</Badge>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Database
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">PostgreSQL Port 5432</p>
                  <Badge variant="default" className="mt-2">Connected</Badge>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Security
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">SSL/TLS Enabled</p>
                  <Badge variant="default" className="mt-2">Secure</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}