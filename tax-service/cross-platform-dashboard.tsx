/**
 * FANZ Unified Ecosystem - Cross-Platform Tax Integration Dashboard
 * 
 * Monitoring dashboard for viewing tax integration status across all 13 platforms
 * within the FanzDash admin interface.
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Badge,
  Progress,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Alert,
  AlertDescription,
} from '@/components/ui';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  RefreshCw,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface PlatformStatus {
  platformName: string;
  displayName: string;
  enabled: boolean;
  healthStatus: 'healthy' | 'degraded' | 'unhealthy' | 'disabled' | 'never_synced' | 'stale';
  lastSync: Date | null;
  transactionsToday: number;
  eventsProcessed: number;
  errors: number;
  taxCoverage: number;
  addressCoverage: number;
}

interface TransactionSummary {
  platform: string;
  totalTransactions: number;
  capturedTransactions: number;
  taxableTransactions: number;
  totalRevenue: number;
  taxCollected: number;
  avgTaxRate: number;
  latestTransaction: Date;
}

interface EventProcessingStatus {
  platform: string;
  eventType: string;
  totalEvents: number;
  processedEvents: number;
  failedEvents: number;
  pendingEvents: number;
  successRate: number;
  avgProcessingTime: number;
}

interface SyncStatus {
  id: string;
  platformName: string;
  syncType: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: Date;
  completedAt?: Date;
  transactionsProcessed: number;
  errorsEncountered: number;
}

// ============================================================================
// Main Dashboard Component
// ============================================================================

export function CrossPlatformTaxDashboard() {
  const [platformStatuses, setPlatformStatuses] = useState<PlatformStatus[]>([]);
  const [transactionSummaries, setTransactionSummaries] = useState<TransactionSummary[]>([]);
  const [eventStatuses, setEventStatuses] = useState<EventProcessingStatus[]>([]);
  const [syncStatuses, setSyncStatuses] = useState<SyncStatus[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, [selectedTimeframe]);

  const loadDashboardData = async () => {
    try {
      // Mock data - replace with actual API calls
      setPlatformStatuses([
        {
          platformName: 'fanz',
          displayName: 'FANZ Core',
          enabled: true,
          healthStatus: 'healthy',
          lastSync: new Date(Date.now() - 15 * 60 * 1000),
          transactionsToday: 1234,
          eventsProcessed: 1200,
          errors: 2,
          taxCoverage: 98.5,
          addressCoverage: 95.2
        },
        {
          platformName: 'fanztube',
          displayName: 'FanzTube',
          enabled: true,
          healthStatus: 'healthy',
          lastSync: new Date(Date.now() - 8 * 60 * 1000),
          transactionsToday: 856,
          eventsProcessed: 850,
          errors: 0,
          taxCoverage: 99.1,
          addressCoverage: 87.3
        },
        {
          platformName: 'fanzcommerce',
          displayName: 'FanzCommerce',
          enabled: true,
          healthStatus: 'degraded',
          lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000),
          transactionsToday: 432,
          eventsProcessed: 420,
          errors: 15,
          taxCoverage: 92.8,
          addressCoverage: 98.7
        },
        {
          platformName: 'fanzspicyai',
          displayName: 'FanzSpicyAI',
          enabled: true,
          healthStatus: 'healthy',
          lastSync: new Date(Date.now() - 5 * 60 * 1000),
          transactionsToday: 678,
          eventsProcessed: 675,
          errors: 1,
          taxCoverage: 97.2,
          addressCoverage: 89.5
        },
        {
          platformName: 'starzcards',
          displayName: 'StarzCards',
          enabled: false,
          healthStatus: 'disabled',
          lastSync: null,
          transactionsToday: 0,
          eventsProcessed: 0,
          errors: 0,
          taxCoverage: 0,
          addressCoverage: 0
        }
      ]);

      setTransactionSummaries([
        {
          platform: 'fanz',
          totalTransactions: 1234,
          capturedTransactions: 1200,
          taxableTransactions: 980,
          totalRevenue: 45678.90,
          taxCollected: 3654.32,
          avgTaxRate: 8.0,
          latestTransaction: new Date(Date.now() - 2 * 60 * 1000)
        },
        {
          platform: 'fanztube',
          totalTransactions: 856,
          capturedTransactions: 850,
          taxableTransactions: 720,
          totalRevenue: 28945.67,
          taxCollected: 2315.65,
          avgTaxRate: 8.0,
          latestTransaction: new Date(Date.now() - 1 * 60 * 1000)
        },
        {
          platform: 'fanzcommerce',
          totalTransactions: 432,
          capturedTransactions: 420,
          taxableTransactions: 410,
          totalRevenue: 18234.50,
          taxCollected: 1458.76,
          avgTaxRate: 8.0,
          latestTransaction: new Date(Date.now() - 5 * 60 * 1000)
        }
      ]);

      setEventStatuses([
        {
          platform: 'fanz',
          eventType: 'transaction.captured',
          totalEvents: 1200,
          processedEvents: 1195,
          failedEvents: 3,
          pendingEvents: 2,
          successRate: 99.6,
          avgProcessingTime: 1.2
        },
        {
          platform: 'fanztube',
          eventType: 'transaction.captured',
          totalEvents: 850,
          processedEvents: 850,
          failedEvents: 0,
          pendingEvents: 0,
          successRate: 100.0,
          avgProcessingTime: 0.8
        }
      ]);

      setSyncStatuses([
        {
          id: '1',
          platformName: 'fanz',
          syncType: 'incremental',
          status: 'completed',
          startedAt: new Date(Date.now() - 15 * 60 * 1000),
          completedAt: new Date(Date.now() - 14 * 60 * 1000),
          transactionsProcessed: 45,
          errorsEncountered: 0
        },
        {
          id: '2',
          platformName: 'fanzcommerce',
          syncType: 'incremental',
          status: 'running',
          startedAt: new Date(Date.now() - 3 * 60 * 1000),
          transactionsProcessed: 12,
          errorsEncountered: 2
        }
      ]);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'unhealthy':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'disabled':
        return <Clock className="w-4 h-4 text-gray-500" />;
      case 'stale':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getHealthStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      healthy: 'default',
      degraded: 'secondary',
      unhealthy: 'destructive',
      disabled: 'outline',
      stale: 'secondary',
      never_synced: 'destructive'
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const totalTransactions = transactionSummaries.reduce((sum, platform) => sum + platform.totalTransactions, 0);
  const totalRevenue = transactionSummaries.reduce((sum, platform) => sum + platform.totalRevenue, 0);
  const totalTaxCollected = transactionSummaries.reduce((sum, platform) => sum + platform.taxCollected, 0);
  const healthyPlatforms = platformStatuses.filter(p => p.healthStatus === 'healthy').length;

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin" />
          <span className="ml-2">Loading dashboard data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Cross-Platform Tax Integration</h1>
          <p className="text-gray-600">Monitor tax compliance across all FANZ platforms</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={loadDashboardData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTransactions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Today across all platforms</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Today across all platforms</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tax Collected</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalTaxCollected.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {((totalTaxCollected / totalRevenue) * 100).toFixed(1)}% effective rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Health</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthyPlatforms}/{platformStatuses.length}</div>
            <p className="text-xs text-muted-foreground">Platforms healthy</p>
          </CardContent>
        </Card>
      </div>

      {/* Platform Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Status</CardTitle>
          <CardDescription>Real-time health and performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Platform</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Sync</TableHead>
                <TableHead>Transactions</TableHead>
                <TableHead>Tax Coverage</TableHead>
                <TableHead>Address Coverage</TableHead>
                <TableHead>Errors</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {platformStatuses.map((platform) => (
                <TableRow key={platform.platformName}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      {getHealthStatusIcon(platform.healthStatus)}
                      <span>{platform.displayName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getHealthStatusBadge(platform.healthStatus)}
                  </TableCell>
                  <TableCell>
                    {platform.lastSync ? (
                      <span className="text-sm">
                        {Math.round((Date.now() - platform.lastSync.getTime()) / 60000)}m ago
                      </span>
                    ) : (
                      <span className="text-gray-500">Never</span>
                    )}
                  </TableCell>
                  <TableCell>{platform.transactionsToday.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Progress value={platform.taxCoverage} className="w-16" />
                      <span className="text-sm">{platform.taxCoverage.toFixed(1)}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Progress value={platform.addressCoverage} className="w-16" />
                      <span className="text-sm">{platform.addressCoverage.toFixed(1)}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {platform.errors > 0 ? (
                      <Badge variant="destructive">{platform.errors}</Badge>
                    ) : (
                      <Badge variant="secondary">0</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Platform */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Platform</CardTitle>
            <CardDescription>Today's revenue breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={transactionSummaries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="platform" />
                <YAxis />
                <Tooltip formatter={(value: any) => `$${value.toLocaleString()}`} />
                <Bar dataKey="totalRevenue" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tax Collection Rates */}
        <Card>
          <CardHeader>
            <CardTitle>Tax Collection Rates</CardTitle>
            <CardDescription>Effective tax rates by platform</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={transactionSummaries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="platform" />
                <YAxis />
                <Tooltip formatter={(value: any) => `${value.toFixed(2)}%`} />
                <Bar dataKey="avgTaxRate" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Event Processing Status */}
      <Card>
        <CardHeader>
          <CardTitle>Event Processing Status</CardTitle>
          <CardDescription>Tax event processing performance</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Platform</TableHead>
                <TableHead>Event Type</TableHead>
                <TableHead>Total Events</TableHead>
                <TableHead>Processed</TableHead>
                <TableHead>Failed</TableHead>
                <TableHead>Success Rate</TableHead>
                <TableHead>Avg Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {eventStatuses.map((event, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{event.platform}</TableCell>
                  <TableCell>{event.eventType}</TableCell>
                  <TableCell>{event.totalEvents.toLocaleString()}</TableCell>
                  <TableCell>{event.processedEvents.toLocaleString()}</TableCell>
                  <TableCell>
                    {event.failedEvents > 0 ? (
                      <Badge variant="destructive">{event.failedEvents}</Badge>
                    ) : (
                      <Badge variant="secondary">0</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Progress value={event.successRate} className="w-16" />
                      <span className="text-sm">{event.successRate.toFixed(1)}%</span>
                    </div>
                  </TableCell>
                  <TableCell>{event.avgProcessingTime.toFixed(1)}s</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Sync Operations */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sync Operations</CardTitle>
          <CardDescription>Latest platform synchronization status</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Platform</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Transactions</TableHead>
                <TableHead>Errors</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {syncStatuses.map((sync) => (
                <TableRow key={sync.id}>
                  <TableCell className="font-medium">{sync.platformName}</TableCell>
                  <TableCell>{sync.syncType}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        sync.status === 'completed' ? 'default' :
                        sync.status === 'running' ? 'secondary' :
                        sync.status === 'failed' ? 'destructive' : 'outline'
                      }
                    >
                      {sync.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {Math.round((Date.now() - sync.startedAt.getTime()) / 60000)}m ago
                  </TableCell>
                  <TableCell>
                    {sync.completedAt ? (
                      `${Math.round((sync.completedAt.getTime() - sync.startedAt.getTime()) / 1000)}s`
                    ) : (
                      sync.status === 'running' ? 'Running...' : 'N/A'
                    )}
                  </TableCell>
                  <TableCell>{sync.transactionsProcessed.toLocaleString()}</TableCell>
                  <TableCell>
                    {sync.errorsEncountered > 0 ? (
                      <Badge variant="destructive">{sync.errorsEncountered}</Badge>
                    ) : (
                      <Badge variant="secondary">0</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Alerts and Issues */}
      {platformStatuses.some(p => p.healthStatus === 'unhealthy' || p.errors > 5) && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Some platforms are experiencing issues. Check the platform status above for details.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default CrossPlatformTaxDashboard;