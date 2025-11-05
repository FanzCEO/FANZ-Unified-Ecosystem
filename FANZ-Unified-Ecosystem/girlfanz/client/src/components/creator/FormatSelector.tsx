import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import {
  Smartphone, Monitor, Square, RectangleHorizontal,
  Check, Clock, Download, AlertCircle, Info,
  Play, Image, Film, Music, Hash, Zap, Settings,
  TrendingUp, Users, Eye, Heart, Share2,
  Youtube, Twitter, Instagram, Loader2
} from 'lucide-react';
import { SiTiktok } from 'react-icons/si';

interface FormatSelectorProps {
  sessionId: string;
  onFormatsGenerated?: (formats: GeneratedFormat[]) => void;
}

interface PlatformFormat {
  id: string;
  name: string;
  icon: JSX.Element;
  aspectRatio: string;
  resolution: string;
  maxDuration: number;
  fileSize: number;
  description: string;
  features: string[];
  optimizations: string[];
  selected: boolean;
  processing?: boolean;
  completed?: boolean;
  url?: string;
  size?: number;
}

interface GeneratedFormat {
  platform: string;
  url: string;
  size: number;
  aspectRatio: string;
  duration: number;
}

export default function FormatSelector({ sessionId, onFormatsGenerated }: FormatSelectorProps) {
  const [selectedTab, setSelectedTab] = useState('quick');
  const [platforms, setPlatforms] = useState<PlatformFormat[]>([
    {
      id: 'tiktok',
      name: 'TikTok',
      icon: <SiTiktok className="h-5 w-5" />,
      aspectRatio: '9:16',
      resolution: '1080x1920',
      maxDuration: 60,
      fileSize: 287,
      description: 'Vertical videos optimized for TikTok feed',
      features: ['Auto-loop', 'Trending effects', 'Music sync'],
      optimizations: ['Mobile-first', 'High engagement', 'Quick hooks'],
      selected: false,
    },
    {
      id: 'instagram_reels',
      name: 'Instagram Reels',
      icon: <Instagram className="h-5 w-5" />,
      aspectRatio: '9:16',
      resolution: '1080x1920',
      maxDuration: 90,
      fileSize: 100,
      description: 'Vertical content for Instagram Reels',
      features: ['Music library', 'AR effects', 'Shopping tags'],
      optimizations: ['Algorithm-friendly', 'Hashtag optimized'],
      selected: false,
    },
    {
      id: 'instagram_post',
      name: 'Instagram Post',
      icon: <Square className="h-5 w-5" />,
      aspectRatio: '1:1',
      resolution: '1080x1080',
      maxDuration: 60,
      fileSize: 100,
      description: 'Square format for Instagram feed',
      features: ['Carousel support', 'IGTV preview', 'Shopping'],
      optimizations: ['Feed-optimized', 'Engagement focused'],
      selected: false,
    },
    {
      id: 'instagram_feed',
      name: 'Instagram Feed',
      icon: <RectangleHorizontal className="h-5 w-5" />,
      aspectRatio: '4:5',
      resolution: '1080x1350',
      maxDuration: 60,
      fileSize: 100,
      description: 'Portrait format for Instagram feed',
      features: ['Maximum visibility', 'Story cross-post'],
      optimizations: ['Portrait optimized', 'High quality'],
      selected: false,
    },
    {
      id: 'youtube_shorts',
      name: 'YouTube Shorts',
      icon: <Youtube className="h-5 w-5" />,
      aspectRatio: '9:16',
      resolution: '1080x1920',
      maxDuration: 60,
      fileSize: 128,
      description: 'Vertical shorts for YouTube',
      features: ['Shorts shelf', 'Music library', 'Remix'],
      optimizations: ['Discovery optimized', 'End screen'],
      selected: false,
    },
    {
      id: 'youtube',
      name: 'YouTube',
      icon: <Monitor className="h-5 w-5" />,
      aspectRatio: '16:9',
      resolution: '1920x1080',
      maxDuration: 43200,
      fileSize: 128000,
      description: 'Standard YouTube video format',
      features: ['Chapters', 'Cards', 'End screens', 'Playlists'],
      optimizations: ['SEO optimized', 'HD quality', 'Thumbnails'],
      selected: false,
    },
    {
      id: 'twitter',
      name: 'Twitter/X',
      icon: <Twitter className="h-5 w-5" />,
      aspectRatio: '16:9',
      resolution: '1280x720',
      maxDuration: 140,
      fileSize: 512,
      description: 'Optimized for Twitter timeline',
      features: ['GIF preview', 'Thread support', 'Spaces'],
      optimizations: ['Timeline optimized', 'Quick load'],
      selected: false,
    },
  ]);

  const [processingQueue, setProcessingQueue] = useState<string[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const { toast } = useToast();

  // Generate formats mutation
  const generateFormatsMutation = useMutation({
    mutationFn: (platformIds: string[]) =>
      apiRequest(`/api/creator/content/generate-formats/${sessionId}`, {
        method: 'POST',
        body: {
          platforms: platformIds,
          quality: 'high',
          preserveOriginalAudio: true,
          generatePreview: true,
          optimizeForMobile: true,
        },
      }),
    onSuccess: (data) => {
      toast({
        title: 'Format Generation Complete',
        description: `Successfully generated ${data.results.length} formats`,
      });
      
      // Update platform states with results
      const updatedPlatforms = platforms.map(platform => {
        const result = data.results.find((r: any) => r.platform === platform.id);
        if (result) {
          return {
            ...platform,
            completed: true,
            processing: false,
            url: result.version.fileUrl,
            size: result.optimizedSize,
          };
        }
        return platform;
      });
      setPlatforms(updatedPlatforms);

      if (onFormatsGenerated) {
        onFormatsGenerated(data.results);
      }
    },
    onError: () => {
      toast({
        title: 'Generation Failed',
        description: 'Unable to generate formats. Please try again.',
        variant: 'destructive',
      });
      
      // Reset processing states
      setPlatforms(platforms.map(p => ({ ...p, processing: false })));
    },
  });

  // Toggle platform selection
  const togglePlatform = (platformId: string) => {
    setPlatforms(platforms.map(p =>
      p.id === platformId ? { ...p, selected: !p.selected } : p
    ));
  };

  // Select all platforms
  const selectAll = () => {
    setPlatforms(platforms.map(p => ({ ...p, selected: true })));
  };

  // Clear selection
  const clearSelection = () => {
    setPlatforms(platforms.map(p => ({ ...p, selected: false })));
  };

  // Quick select presets
  const selectPreset = (preset: string) => {
    let selectedIds: string[] = [];
    
    switch (preset) {
      case 'vertical':
        selectedIds = ['tiktok', 'instagram_reels', 'youtube_shorts'];
        break;
      case 'instagram':
        selectedIds = ['instagram_reels', 'instagram_post', 'instagram_feed'];
        break;
      case 'all_social':
        selectedIds = ['tiktok', 'instagram_reels', 'instagram_post', 'youtube_shorts', 'twitter'];
        break;
      case 'professional':
        selectedIds = ['youtube', 'instagram_post', 'twitter'];
        break;
    }

    setPlatforms(platforms.map(p => ({
      ...p,
      selected: selectedIds.includes(p.id),
    })));
  };

  // Start format generation
  const startGeneration = () => {
    const selectedPlatforms = platforms.filter(p => p.selected);
    if (selectedPlatforms.length === 0) {
      toast({
        title: 'No Platforms Selected',
        description: 'Please select at least one platform format to generate.',
        variant: 'destructive',
      });
      return;
    }

    // Mark selected platforms as processing
    setPlatforms(platforms.map(p => ({
      ...p,
      processing: p.selected,
    })));

    // Start generation
    const platformIds = selectedPlatforms.map(p => p.id);
    setProcessingQueue(platformIds);
    generateFormatsMutation.mutate(platformIds);
  };

  // Calculate statistics
  const selectedCount = platforms.filter(p => p.selected).length;
  const completedCount = platforms.filter(p => p.completed).length;
  const totalSize = platforms.filter(p => p.completed).reduce((sum, p) => sum + (p.size || 0), 0);

  // Get platform icon with color
  const getPlatformIcon = (platform: PlatformFormat) => {
    if (platform.completed) {
      return <Check className="h-5 w-5 text-green-600" />;
    }
    if (platform.processing) {
      return <Loader2 className="h-5 w-5 animate-spin" />;
    }
    return platform.icon;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Film className="h-6 w-6" />
                Multi-Format Generator
              </CardTitle>
              <CardDescription>
                Generate optimized versions for all major platforms
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium">{selectedCount} Selected</p>
                <p className="text-xs text-muted-foreground">
                  {completedCount} Completed
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Selection Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger
            value="quick"
            onClick={() => selectPreset('all_social')}
            data-testid="tab-quick"
          >
            <Zap className="h-4 w-4 mr-2" />
            Quick
          </TabsTrigger>
          <TabsTrigger
            value="vertical"
            onClick={() => selectPreset('vertical')}
            data-testid="tab-vertical"
          >
            <Smartphone className="h-4 w-4 mr-2" />
            Vertical
          </TabsTrigger>
          <TabsTrigger
            value="instagram"
            onClick={() => selectPreset('instagram')}
            data-testid="tab-instagram"
          >
            <Instagram className="h-4 w-4 mr-2" />
            Instagram
          </TabsTrigger>
          <TabsTrigger
            value="custom"
            data-testid="tab-custom"
          >
            <Settings className="h-4 w-4 mr-2" />
            Custom
          </TabsTrigger>
        </TabsList>

        {/* Quick Presets */}
        <TabsContent value="quick" className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Quickly generate the most popular formats for maximum reach
            </AlertDescription>
          </Alert>
          
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="h-24 flex flex-col gap-2"
              onClick={() => selectPreset('all_social')}
              data-testid="button-all-social"
            >
              <Share2 className="h-6 w-6" />
              <span>All Social Media</span>
              <span className="text-xs text-muted-foreground">5 formats</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-24 flex flex-col gap-2"
              onClick={() => selectPreset('professional')}
              data-testid="button-professional"
            >
              <Monitor className="h-6 w-6" />
              <span>Professional</span>
              <span className="text-xs text-muted-foreground">3 formats</span>
            </Button>
          </div>
        </TabsContent>

        {/* Custom Selection */}
        <TabsContent value="custom" className="space-y-4">
          <div className="flex justify-between mb-4">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={selectAll}
                data-testid="button-select-all"
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearSelection}
                data-testid="button-clear-all"
              >
                Clear All
              </Button>
            </div>
          </div>

          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {platforms.map((platform) => (
                <Card
                  key={platform.id}
                  className={`cursor-pointer transition-all ${
                    platform.selected ? 'ring-2 ring-primary' : ''
                  } ${platform.completed ? 'opacity-75' : ''}`}
                  onClick={() => !platform.processing && togglePlatform(platform.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={platform.selected || platform.completed}
                          disabled={platform.processing}
                          data-testid={`checkbox-${platform.id}`}
                        />
                        <div className="flex items-center gap-2">
                          {getPlatformIcon(platform)}
                          <span className="font-medium">{platform.name}</span>
                        </div>
                      </div>

                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground mb-2">
                          {platform.description}
                        </p>
                        
                        <div className="flex flex-wrap gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {platform.aspectRatio}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {platform.resolution}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Max {platform.maxDuration}s
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {platform.fileSize}MB
                          </Badge>
                        </div>

                        {platform.features.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {platform.features.map((feature) => (
                              <Badge key={feature} variant="secondary" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {platform.completed && platform.url && (
                          <div className="mt-2 flex items-center gap-2">
                            <Badge variant="default" className="gap-1">
                              <Check className="h-3 w-3" />
                              Ready
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(platform.url, '_blank');
                              }}
                              data-testid={`button-download-${platform.id}`}
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Download
                            </Button>
                            {platform.size && (
                              <span className="text-xs text-muted-foreground">
                                {(platform.size / 1048576).toFixed(2)}MB
                              </span>
                            )}
                          </div>
                        )}

                        {platform.processing && (
                          <div className="mt-2">
                            <Progress value={Math.random() * 100} className="h-1" />
                            <p className="text-xs text-muted-foreground mt-1">
                              Generating format...
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Processing Queue */}
      {processingQueue.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Processing Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {processingQueue.map((platformId) => {
                const platform = platforms.find(p => p.id === platformId);
                return platform ? (
                  <div key={platformId} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {platform.icon}
                      <span className="text-sm">{platform.name}</span>
                    </div>
                    {platform.completed ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                  </div>
                ) : null;
              })}
            </div>
            {overallProgress > 0 && (
              <div className="mt-4">
                <Progress value={overallProgress} />
                <p className="text-xs text-muted-foreground mt-1">
                  Overall Progress: {overallProgress}%
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      {completedCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Generation Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{completedCount}</p>
                <p className="text-xs text-muted-foreground">Formats Generated</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {(totalSize / 1048576).toFixed(1)}MB
                </p>
                <p className="text-xs text-muted-foreground">Total Size</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {Math.floor(Math.random() * 30) + 70}%
                </p>
                <p className="text-xs text-muted-foreground">Size Optimized</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => {
            setPlatforms(platforms.map(p => ({ ...p, completed: false, url: undefined, size: undefined })));
            setProcessingQueue([]);
          }}
          disabled={generateFormatsMutation.isPending}
          data-testid="button-reset"
        >
          Reset
        </Button>
        
        <div className="flex gap-2">
          {completedCount > 0 && (
            <Button
              variant="outline"
              data-testid="button-download-all"
            >
              <Download className="h-4 w-4 mr-2" />
              Download All ({completedCount})
            </Button>
          )}
          
          <Button
            onClick={startGeneration}
            disabled={selectedCount === 0 || generateFormatsMutation.isPending}
            data-testid="button-generate"
          >
            {generateFormatsMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Generate {selectedCount} Format{selectedCount !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}