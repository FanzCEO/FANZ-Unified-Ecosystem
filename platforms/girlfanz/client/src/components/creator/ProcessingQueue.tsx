import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import {
  Upload, Play, Pause, SkipForward, Trash2, RefreshCw,
  Clock, CheckCircle, AlertCircle, Loader2, ChevronRight,
  ChevronDown, Zap, Crown, Layers, Settings, Info,
  Download, MoreVertical, Eye, Copy, Share2,
  Film, Music, Image, FileVideo, Hash, TrendingUp
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ProcessingQueueProps {
  creatorId?: string;
  onSessionSelect?: (sessionId: string) => void;
}

interface QueueItem {
  id: string;
  sessionId: string;
  title: string;
  type: 'video' | 'image' | 'audio';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'paused';
  priority: 'normal' | 'high' | 'premium';
  progress: number;
  stages: ProcessingStage[];
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  estimatedTime?: number;
  fileSize: number;
  thumbnailUrl?: string;
  error?: string;
  outputFormats: number;
  generatedAssets: number;
}

interface ProcessingStage {
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  duration?: number;
}

interface QueueStatistics {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  averageTime: number;
  totalProcessed: number;
  totalSize: number;
}

export default function ProcessingQueue({ creatorId, onSessionSelect }: ProcessingQueueProps) {
  const [selectedTab, setSelectedTab] = useState('active');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { toast } = useToast();

  // Mock queue items
  const [queueItems, setQueueItems] = useState<QueueItem[]>([
    {
      id: '1',
      sessionId: 'session_1',
      title: 'Fashion Haul Try-On',
      type: 'video',
      status: 'processing',
      priority: 'premium',
      progress: 65,
      stages: [
        { name: 'AI Analysis', status: 'completed', progress: 100 },
        { name: 'Scene Detection', status: 'completed', progress: 100 },
        { name: 'Format Conversion', status: 'processing', progress: 45 },
        { name: 'Asset Generation', status: 'pending', progress: 0 },
      ],
      createdAt: new Date(Date.now() - 600000),
      startedAt: new Date(Date.now() - 300000),
      estimatedTime: 120,
      fileSize: 156789012,
      outputFormats: 0,
      generatedAssets: 0,
    },
    {
      id: '2',
      sessionId: 'session_2',
      title: 'Makeup Tutorial',
      type: 'video',
      status: 'pending',
      priority: 'high',
      progress: 0,
      stages: [
        { name: 'AI Analysis', status: 'pending', progress: 0 },
        { name: 'Scene Detection', status: 'pending', progress: 0 },
        { name: 'Format Conversion', status: 'pending', progress: 0 },
        { name: 'Asset Generation', status: 'pending', progress: 0 },
      ],
      createdAt: new Date(Date.now() - 300000),
      estimatedTime: 180,
      fileSize: 234567890,
      outputFormats: 0,
      generatedAssets: 0,
    },
    {
      id: '3',
      sessionId: 'session_3',
      title: 'Dance Challenge',
      type: 'video',
      status: 'completed',
      priority: 'normal',
      progress: 100,
      stages: [
        { name: 'AI Analysis', status: 'completed', progress: 100, duration: 15 },
        { name: 'Scene Detection', status: 'completed', progress: 100, duration: 8 },
        { name: 'Format Conversion', status: 'completed', progress: 100, duration: 45 },
        { name: 'Asset Generation', status: 'completed', progress: 100, duration: 22 },
      ],
      createdAt: new Date(Date.now() - 7200000),
      startedAt: new Date(Date.now() - 7000000),
      completedAt: new Date(Date.now() - 6500000),
      fileSize: 98765432,
      thumbnailUrl: '/api/placeholder/400/300',
      outputFormats: 7,
      generatedAssets: 15,
    },
  ]);

  // Get queue statistics
  const statistics: QueueStatistics = {
    total: queueItems.length,
    pending: queueItems.filter(item => item.status === 'pending').length,
    processing: queueItems.filter(item => item.status === 'processing').length,
    completed: queueItems.filter(item => item.status === 'completed').length,
    failed: queueItems.filter(item => item.status === 'failed').length,
    averageTime: 150,
    totalProcessed: 42,
    totalSize: queueItems.reduce((sum, item) => sum + item.fileSize, 0),
  };

  // Filter queue items
  const filteredItems = queueItems.filter(item => {
    if (selectedTab === 'active') {
      return ['pending', 'processing'].includes(item.status);
    } else if (selectedTab === 'completed') {
      return item.status === 'completed';
    } else if (selectedTab === 'failed') {
      return item.status === 'failed';
    }
    return true;
  }).filter(item => {
    if (selectedPriority === 'all') return true;
    return item.priority === selectedPriority;
  });

  // Toggle item expansion
  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  // Process actions
  const pauseProcessing = (itemId: string) => {
    setQueueItems(items =>
      items.map(item =>
        item.id === itemId ? { ...item, status: 'paused' as const } : item
      )
    );
    toast({
      title: 'Processing Paused',
      description: 'You can resume processing at any time.',
    });
  };

  const resumeProcessing = (itemId: string) => {
    setQueueItems(items =>
      items.map(item =>
        item.id === itemId ? { ...item, status: 'processing' as const } : item
      )
    );
    toast({
      title: 'Processing Resumed',
      description: 'Your content is being processed.',
    });
  };

  const cancelProcessing = (itemId: string) => {
    setQueueItems(items => items.filter(item => item.id !== itemId));
    toast({
      title: 'Processing Cancelled',
      description: 'The item has been removed from the queue.',
    });
  };

  const retryProcessing = (itemId: string) => {
    setQueueItems(items =>
      items.map(item =>
        item.id === itemId
          ? { ...item, status: 'pending' as const, progress: 0, error: undefined }
          : item
      )
    );
    toast({
      title: 'Retrying Processing',
      description: 'The item will be processed again.',
    });
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-orange-600" />;
      default:
        return null;
    }
  };

  // Get priority badge
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'premium':
        return (
          <Badge variant="default" className="gap-1 bg-gradient-to-r from-purple-600 to-pink-600">
            <Crown className="h-3 w-3" />
            Premium
          </Badge>
        );
      case 'high':
        return (
          <Badge variant="default" className="gap-1">
            <Zap className="h-3 w-3" />
            High
          </Badge>
        );
      default:
        return <Badge variant="secondary">Normal</Badge>;
    }
  };

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Film className="h-4 w-4" />;
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'audio':
        return <Music className="h-4 w-4" />;
      default:
        return <FileVideo className="h-4 w-4" />;
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    const mb = bytes / 1048576;
    return `${mb.toFixed(1)} MB`;
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Update processing items progress
      setQueueItems(items =>
        items.map(item => {
          if (item.status === 'processing' && item.progress < 100) {
            return { ...item, progress: Math.min(item.progress + 5, 95) };
          }
          return item;
        })
      );
    }, 2000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  return (
    <div className="space-y-6">
      {/* Header with Statistics */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-6 w-6" />
                Processing Queue
              </CardTitle>
              <CardDescription>
                Manage and monitor your batch processing tasks
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                data-testid="button-auto-refresh"
              >
                <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
              </Button>
              <Button variant="default" data-testid="button-add-to-queue">
                <Upload className="h-4 w-4 mr-2" />
                Add to Queue
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{statistics.total}</p>
              <p className="text-xs text-muted-foreground">Total Items</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{statistics.pending}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{statistics.processing}</p>
              <p className="text-xs text-muted-foreground">Processing</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{statistics.completed}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{formatDuration(statistics.averageTime)}</p>
              <p className="text-xs text-muted-foreground">Avg. Time</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter and Tabs */}
      <div className="flex justify-between items-center">
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList>
            <TabsTrigger value="active" data-testid="tab-active">
              Active ({statistics.pending + statistics.processing})
            </TabsTrigger>
            <TabsTrigger value="completed" data-testid="tab-completed">
              Completed ({statistics.completed})
            </TabsTrigger>
            <TabsTrigger value="failed" data-testid="tab-failed">
              Failed ({statistics.failed})
            </TabsTrigger>
            <TabsTrigger value="all" data-testid="tab-all">
              All ({statistics.total})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Select value={selectedPriority} onValueChange={setSelectedPriority}>
          <SelectTrigger className="w-[180px]" data-testid="select-priority">
            <SelectValue placeholder="Filter by priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="premium">Premium Only</SelectItem>
            <SelectItem value="high">High Priority</SelectItem>
            <SelectItem value="normal">Normal Priority</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Queue Items */}
      <ScrollArea className="h-[600px]">
        <div className="space-y-3 pr-4">
          {filteredItems.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Film className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No items in queue</p>
              </CardContent>
            </Card>
          ) : (
            filteredItems.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <CardContent className="p-4">
                  {/* Item Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <button
                        onClick={() => toggleExpanded(item.id)}
                        className="mt-1"
                        data-testid={`button-expand-${item.id}`}
                      >
                        {expandedItems.has(item.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                      
                      <div className="flex items-center gap-2">
                        {getTypeIcon(item.type)}
                        {getStatusIcon(item.status)}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{item.title}</h4>
                          {getPriorityBadge(item.priority)}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{formatFileSize(item.fileSize)}</span>
                          <span>•</span>
                          <span>Created {new Date(item.createdAt).toLocaleTimeString()}</span>
                          {item.estimatedTime && (
                            <>
                              <span>•</span>
                              <span>Est. {formatDuration(item.estimatedTime)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" data-testid={`menu-${item.id}`}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        
                        {item.status === 'processing' && (
                          <DropdownMenuItem onClick={() => pauseProcessing(item.id)}>
                            <Pause className="h-4 w-4 mr-2" />
                            Pause
                          </DropdownMenuItem>
                        )}
                        
                        {item.status === 'paused' && (
                          <DropdownMenuItem onClick={() => resumeProcessing(item.id)}>
                            <Play className="h-4 w-4 mr-2" />
                            Resume
                          </DropdownMenuItem>
                        )}
                        
                        {item.status === 'failed' && (
                          <DropdownMenuItem onClick={() => retryProcessing(item.id)}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Retry
                          </DropdownMenuItem>
                        )}
                        
                        {item.status === 'completed' && (
                          <>
                            <DropdownMenuItem onClick={() => onSessionSelect?.(item.sessionId)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Results
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="h-4 w-4 mr-2" />
                              Download All
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Share2 className="h-4 w-4 mr-2" />
                              Share
                            </DropdownMenuItem>
                          </>
                        )}
                        
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => cancelProcessing(item.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Cancel
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Progress Bar */}
                  {(item.status === 'processing' || item.status === 'paused') && (
                    <div className="mb-3">
                      <Progress value={item.progress} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.progress}% complete
                      </p>
                    </div>
                  )}

                  {/* Error Message */}
                  {item.error && (
                    <Alert variant="destructive" className="mb-3">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{item.error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Expanded Details */}
                  {expandedItems.has(item.id) && (
                    <div className="mt-4 space-y-3">
                      <Separator />
                      
                      {/* Processing Stages */}
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium mb-2">Processing Stages</h5>
                        {item.stages.map((stage, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(stage.status)}
                              <span className="text-sm">{stage.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {stage.duration && (
                                <span className="text-xs text-muted-foreground">
                                  {stage.duration}s
                                </span>
                              )}
                              {stage.status === 'processing' && (
                                <span className="text-xs text-muted-foreground">
                                  {stage.progress}%
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Completion Stats */}
                      {item.status === 'completed' && (
                        <>
                          <Separator />
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Output Formats</p>
                              <p className="font-medium">{item.outputFormats} formats</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Generated Assets</p>
                              <p className="font-medium">{item.generatedAssets} assets</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Processing Time</p>
                              <p className="font-medium">
                                {item.completedAt && item.startedAt
                                  ? formatDuration(
                                      Math.floor(
                                        (item.completedAt.getTime() - item.startedAt.getTime()) / 1000
                                      )
                                    )
                                  : 'N/A'}
                              </p>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Processing Tips */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Tip:</strong> Premium priority items are processed first and up to 3x faster.
          Processing continues in the background - you'll be notified when items complete.
        </AlertDescription>
      </Alert>
    </div>
  );
}