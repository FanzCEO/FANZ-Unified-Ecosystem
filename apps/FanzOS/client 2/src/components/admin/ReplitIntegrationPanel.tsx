import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// Note: Alert component not available in current setup, will use Card instead
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Server, 
  Database, 
  HardDrive, 
  Cloud,
  Activity,
  Settings,
  Terminal,
  Eye
} from 'lucide-react';

interface ServiceStatus {
  auth: boolean;
  database: boolean;
  objectStorage: boolean;
  deployment: boolean;
}

interface HealthData {
  status: string;
  timestamp: string;
  services: ServiceStatus;
  deployment: {
    isDeployed: boolean;
    replId: string;
    domains: string[];
    environment: string;
    uptime: number;
  };
  uptime: number;
}

interface StorageConfig {
  bucketId: string | null;
  publicPaths: string[];
  privateDir: string | null;
  configured: boolean;
  error?: string;
}

export function ReplitIntegrationPanel() {
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus | null>(null);
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [storageConfig, setStorageConfig] = useState<StorageConfig | null>(null);
  const [environment, setEnvironment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const { toast } = useToast();

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [statusData, healthResponse, storageResponse, envData] = await Promise.all([
        apiRequest('/api/replit/status'),
        apiRequest('/api/replit/health'),
        apiRequest('/api/replit/storage'),
        apiRequest('/api/replit/environment')
      ]);

      const status = statusData as any;
      const health = healthResponse as any;
      const storage = storageResponse as any;
      const env = envData as any;

      setServiceStatus(status.services);
      setHealthData(health.health);
      setStorageConfig(storage.storage);
      setEnvironment(env.environment);
    } catch (error: any) {
      console.error('Error loading Replit integration data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load integration status',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(loadAllData, 30000);
    return () => clearInterval(interval);
  }, []);

  const initializeIntegrations = async () => {
    setIsInitializing(true);
    try {
      await apiRequest('/api/replit/initialize', {
        method: 'POST'
      });

      toast({
        title: 'Success',
        description: 'Replit integrations initialized successfully'
      });

      await loadAllData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to initialize integrations',
        variant: 'destructive'
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const testFileSystem = async () => {
    try {
      const response: any = await apiRequest('/api/replit/test/filesystem', {
        method: 'POST'
      });

      toast({
        title: response.fileSystemAccess ? 'Success' : 'Warning',
        description: response.message,
        variant: response.fileSystemAccess ? 'default' : 'destructive'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to test file system access',
        variant: 'destructive'
      });
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getStatusIcon = (status: boolean) => {
    return status ? 
      <CheckCircle className="w-4 h-4 text-green-500" /> : 
      <XCircle className="w-4 h-4 text-red-500" />;
  };

  const getStatusBadge = (status: boolean) => {
    return (
      <Badge variant={status ? 'default' : 'destructive'}>
        {status ? 'Connected' : 'Failed'}
      </Badge>
    );
  };

  return (
    <div className="space-y-6" data-testid="replit-integration-panel">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Replit Platform Integrations</h2>
          <p className="text-gray-600">Monitor and manage Replit service connections</p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={loadAllData} 
            disabled={isLoading}
            variant="outline"
            data-testid="button-refresh"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button 
            onClick={initializeIntegrations}
            disabled={isInitializing}
            data-testid="button-initialize"
          >
            <Settings className="w-4 h-4 mr-2" />
            {isInitializing ? 'Initializing...' : 'Initialize'}
          </Button>
        </div>
      </div>

      {/* Health Status Card */}
      {healthData && (
        <Card className={healthData.status === 'healthy' ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />
              System Health: {healthData.status.toUpperCase()}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <p className="text-sm text-gray-600">
              Uptime: {formatUptime(healthData.uptime)} | Last Check: {new Date(healthData.timestamp).toLocaleTimeString()}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Auth Service */}
        <Card data-testid="auth-service-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Server className="w-4 h-4" />
              Replit Auth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              {getStatusIcon(serviceStatus?.auth || false)}
              {getStatusBadge(serviceStatus?.auth || false)}
            </div>
          </CardContent>
        </Card>

        {/* Database Service */}
        <Card data-testid="database-service-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="w-4 h-4" />
              SQL Database
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              {getStatusIcon(serviceStatus?.database || false)}
              {getStatusBadge(serviceStatus?.database || false)}
            </div>
          </CardContent>
        </Card>

        {/* Object Storage Service */}
        <Card data-testid="storage-service-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <HardDrive className="w-4 h-4" />
              Object Storage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              {getStatusIcon(serviceStatus?.objectStorage || false)}
              {getStatusBadge(serviceStatus?.objectStorage || false)}
            </div>
          </CardContent>
        </Card>

        {/* Deployment Service */}
        <Card data-testid="deployment-service-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Cloud className="w-4 h-4" />
              Deployment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              {getStatusIcon(serviceStatus?.deployment || false)}
              {getStatusBadge(serviceStatus?.deployment || false)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Environment Info */}
        {environment && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Environment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Repl ID:</strong> {environment.replId}</div>
                <div><strong>Environment:</strong> {environment.nodeEnv}</div>
                <div><strong>Port:</strong> {environment.port}</div>
                <div><strong>Database:</strong> {environment.databaseUrl}</div>
              </div>
              
              {environment.replitDomains && environment.replitDomains.length > 0 && (
                <div>
                  <strong>Domains:</strong>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {environment.replitDomains.map((domain: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {domain}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Storage Configuration */}
        {storageConfig && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="w-4 h-4" />
                Storage Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {storageConfig.configured ? (
                <>
                  <div className="text-sm space-y-2">
                    <div><strong>Bucket ID:</strong> {storageConfig.bucketId}</div>
                    <div><strong>Private Directory:</strong> {storageConfig.privateDir}</div>
                  </div>
                  
                  {storageConfig.publicPaths.length > 0 && (
                    <div>
                      <strong>Public Paths:</strong>
                      <div className="mt-1 space-y-1">
                        {storageConfig.publicPaths.map((path, index) => (
                          <div key={index} className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                            {path}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-red-600 text-sm">
                  Storage not configured: {storageConfig.error}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Test Functions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="w-4 h-4" />
            System Tests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button 
              onClick={testFileSystem}
              variant="outline"
              size="sm"
              data-testid="button-test-filesystem"
            >
              Test File System
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}