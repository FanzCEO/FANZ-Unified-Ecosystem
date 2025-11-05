import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import {
  Sparkles, Scissors, Palette, Music, Type, Wand2,
  Download, Play, Pause, SkipForward, Volume2,
  Smartphone, Monitor, Square, Film, Image, Layers,
  CheckCircle, Clock, AlertCircle, Loader2, TrendingUp,
  Hash, Calendar, ThumbsUp, Eye, Share2, Gift,
  Zap, Settings, Info, Brain, Camera, Mic
} from 'lucide-react';
import AIEditor from './AIEditor';
import FormatSelector from './FormatSelector';
import ProcessingQueue from './ProcessingQueue';

type EditingPreviewProps = {
  session: any;
};

type EditingOptions = {
  autoCut: boolean;
  addBranding: boolean;
  generateMultipleAspectRatios: boolean;
  createTrailer: boolean;
  createGif: boolean;
  addMusic: boolean;
  addCaptions: boolean;
  colorCorrection: boolean;
  stabilization: boolean;
};

type ContentVersion = {
  id: string;
  aspectRatio: string;
  platform: string;
  url: string;
  duration?: number;
  fileSize: number;
};

export default function EditingPreview({ session }: EditingPreviewProps) {
  const [activeTab, setActiveTab] = useState('ai-editor');
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<ContentVersion | null>(null);
  const [editingOptions, setEditingOptions] = useState<EditingOptions>({
    autoCut: true,
    addBranding: true,
    generateMultipleAspectRatios: true,
    createTrailer: true,
    createGif: true,
    addMusic: false,
    addCaptions: true,
    colorCorrection: true,
    stabilization: true,
  });
  const [volume, setVolume] = useState([80]);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const { toast } = useToast();

  // Get editing task status
  const { data: editingTask, isLoading: taskLoading } = useQuery({
    queryKey: [`/api/creator/content/editing/${session.id}`],
    enabled: !!session.id,
    refetchInterval: (data) => {
      // Poll while processing
      if (data?.status === 'processing') {
        return 2000;
      }
      return false;
    },
  });

  // Get content versions
  const { data: versions = [], isLoading: versionsLoading } = useQuery<ContentVersion[]>({
    queryKey: [`/api/creator/content/versions/${session.id}`],
    enabled: editingTask?.status === 'completed',
  });

  // Get AI pricing suggestions
  const { data: pricingSuggestion } = useQuery({
    queryKey: [`/api/creator/content/pricing/${session.id}`],
    enabled: editingTask?.status === 'completed',
  });

  // Get content analysis
  const { data: contentAnalysis } = useQuery({
    queryKey: [`/api/creator/content/analyze/${session.id}`],
    enabled: !!session.id,
  });

  // Get generated assets
  const { data: generatedAssets } = useQuery({
    queryKey: [`/api/creator/content/assets/${session.id}`],
    enabled: editingTask?.status === 'completed',
  });

  // Process content mutation
  const processContentMutation = useMutation({
    mutationFn: () =>
      apiRequest(`/api/creator/content/process/${session.id}`, {
        method: 'POST',
        body: { editingOptions },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/creator/content/editing/${session.id}`] });
      toast({
        title: 'Processing started',
        description: 'AI is now editing your content. This may take a few minutes.',
      });
    },
  });

  // Download content
  const downloadContent = (version: ContentVersion) => {
    const link = document.createElement('a');
    link.href = version.url;
    link.download = `content-${version.aspectRatio.replace(':', 'x')}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getAspectRatioIcon = (ratio: string) => {
    switch (ratio) {
      case '9:16':
        return <Smartphone className="h-4 w-4" />;
      case '16:9':
        return <Monitor className="h-4 w-4" />;
      case '1:1':
        return <Square className="h-4 w-4" />;
      default:
        return <Film className="h-4 w-4" />;
    }
  };

  const getStatusBadge = () => {
    if (!editingTask) return null;

    switch (editingTask.status) {
      case 'pending':
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case 'processing':
        return (
          <Badge className="gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Processing
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="default" className="gap-1">
            <CheckCircle className="h-3 w-3" />
            Completed
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Failed
          </Badge>
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    // Select first version when available
    if (versions.length > 0 && !selectedVersion) {
      setSelectedVersion(versions[0]);
    }
  }, [versions, selectedVersion]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-6 w-6" />
                {session.title || 'AI Content Studio'}
              </CardTitle>
              <CardDescription>
                {session.description || 'Complete AI-powered post-production suite'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge()}
              {contentAnalysis && (
                <Badge variant="outline" className="gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {Math.round(contentAnalysis.engagement?.score || 0)}% Engagement Score
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="ai-editor" data-testid="tab-ai-editor">
            <Brain className="h-4 w-4 mr-2" />
            AI Editor
          </TabsTrigger>
          <TabsTrigger value="formats" data-testid="tab-formats">
            <Layers className="h-4 w-4 mr-2" />
            Formats
          </TabsTrigger>
          <TabsTrigger value="assets" data-testid="tab-assets">
            <Gift className="h-4 w-4 mr-2" />
            Assets
          </TabsTrigger>
          <TabsTrigger value="analysis" data-testid="tab-analysis">
            <TrendingUp className="h-4 w-4 mr-2" />
            Analysis
          </TabsTrigger>
          <TabsTrigger value="queue" data-testid="tab-queue">
            <Layers className="h-4 w-4 mr-2" />
            Queue
          </TabsTrigger>
        </TabsList>

        {/* AI Editor Tab */}
        <TabsContent value="ai-editor" className="space-y-4">
          <AIEditor 
            sessionId={session.id}
            onComplete={() => setActiveTab('formats')}
          />
        </TabsContent>

        {/* Formats Tab */}
        <TabsContent value="formats" className="space-y-4">
          <FormatSelector
            sessionId={session.id}
            onFormatsGenerated={(formats) => {
              toast({
                title: 'Formats Generated!',
                description: `Successfully created ${formats.length} platform-optimized versions`,
              });
              setActiveTab('assets');
            }}
          />
        </TabsContent>

        {/* Assets Tab */}
        <TabsContent value="assets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generated Assets</CardTitle>
              <CardDescription>
                AI has automatically created various assets from your content
              </CardDescription>
            </CardHeader>
            <CardContent>
              {generatedAssets && generatedAssets.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {/* Thumbnails */}
                  <Card>
                    <CardContent className="p-4">
                      <div className="aspect-video bg-muted rounded mb-2"></div>
                      <h4 className="font-medium text-sm">Thumbnails</h4>
                      <p className="text-xs text-muted-foreground">
                        {generatedAssets.filter((a: any) => a.type === 'thumbnail').length} options
                      </p>
                      <Button variant="outline" size="sm" className="w-full mt-2">
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </CardContent>
                  </Card>

                  {/* GIF */}
                  <Card>
                    <CardContent className="p-4">
                      <div className="aspect-video bg-muted rounded mb-2"></div>
                      <h4 className="font-medium text-sm">Animated GIF</h4>
                      <p className="text-xs text-muted-foreground">
                        Perfect for previews
                      </p>
                      <Button variant="outline" size="sm" className="w-full mt-2">
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Highlight Reel */}
                  <Card>
                    <CardContent className="p-4">
                      <div className="aspect-video bg-muted rounded mb-2"></div>
                      <h4 className="font-medium text-sm">Highlight Reel</h4>
                      <p className="text-xs text-muted-foreground">
                        Best moments compiled
                      </p>
                      <Button variant="outline" size="sm" className="w-full mt-2">
                        <Play className="h-3 w-3 mr-1" />
                        Preview
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Teaser */}
                  <Card>
                    <CardContent className="p-4">
                      <div className="aspect-video bg-muted rounded mb-2"></div>
                      <h4 className="font-medium text-sm">Social Teaser</h4>
                      <p className="text-xs text-muted-foreground">
                        15-second preview
                      </p>
                      <Button variant="outline" size="sm" className="w-full mt-2">
                        <Play className="h-3 w-3 mr-1" />
                        Preview
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Meme Clips */}
                  <Card>
                    <CardContent className="p-4">
                      <div className="aspect-video bg-muted rounded mb-2"></div>
                      <h4 className="font-medium text-sm">Meme Clips</h4>
                      <p className="text-xs text-muted-foreground">
                        Ready for viral sharing
                      </p>
                      <Button variant="outline" size="sm" className="w-full mt-2">
                        <Image className="h-3 w-3 mr-1" />
                        View All
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Preview Clips */}
                  <Card>
                    <CardContent className="p-4">
                      <div className="aspect-video bg-muted rounded mb-2"></div>
                      <h4 className="font-medium text-sm">Preview Clips</h4>
                      <p className="text-xs text-muted-foreground">
                        Multiple durations
                      </p>
                      <Button variant="outline" size="sm" className="w-full mt-2">
                        <Play className="h-3 w-3 mr-1" />
                        Preview
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Gift className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Assets will be generated after AI processing completes
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Content Analysis</CardTitle>
              <CardDescription>
                Smart insights and recommendations for maximum engagement
              </CardDescription>
            </CardHeader>
            <CardContent>
              {contentAnalysis ? (
                <div className="space-y-6">
                  {/* Engagement Score */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <Label>Overall Engagement Score</Label>
                      <span className="font-medium">{Math.round(contentAnalysis.engagement?.score || 0)}%</span>
                    </div>
                    <Progress value={contentAnalysis.engagement?.score || 0} />
                  </div>

                  {/* Content Categories */}
                  <div>
                    <Label>Content Categories</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {contentAnalysis.categories?.map((cat: any) => (
                        <Badge key={cat.name} variant="secondary">
                          {cat.name} ({Math.round(cat.confidence * 100)}%)
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Mood Analysis */}
                  <div>
                    <Label>Mood & Energy</Label>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div className="text-center p-3 border rounded">
                        <p className="text-2xl font-bold">{contentAnalysis.mood?.primary}</p>
                        <p className="text-xs text-muted-foreground">Primary Mood</p>
                      </div>
                      <div className="text-center p-3 border rounded">
                        <p className="text-2xl font-bold">{Math.round((contentAnalysis.mood?.energy || 0) * 100)}%</p>
                        <p className="text-xs text-muted-foreground">Energy Level</p>
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div>
                    <Label>AI Recommendations</Label>
                    <ScrollArea className="h-[200px] mt-2">
                      <div className="space-y-2">
                        {/* Hashtags */}
                        <div>
                          <p className="text-sm font-medium mb-1">Recommended Hashtags</p>
                          <div className="flex flex-wrap gap-1">
                            {contentAnalysis.recommendations?.hashtags?.slice(0, 10).map((tag: any) => (
                              <Badge key={tag.tag} variant={tag.trending ? 'default' : 'outline'} className="text-xs">
                                {tag.tag}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Best Posting Times */}
                        <div>
                          <p className="text-sm font-medium mb-1">Best Posting Times</p>
                          <div className="grid grid-cols-2 gap-2">
                            {contentAnalysis.recommendations?.postingTime?.map((time: any) => (
                              <div key={time.platform} className="flex justify-between text-xs">
                                <span>{time.platform}:</span>
                                <span className="text-muted-foreground">
                                  {new Date(time.bestTime).toLocaleTimeString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Improvements */}
                        <div>
                          <p className="text-sm font-medium mb-1">Suggested Improvements</p>
                          <div className="space-y-1">
                            {contentAnalysis.recommendations?.improvements?.map((imp: any, i: number) => (
                              <div key={i} className="text-xs">
                                <Badge variant="outline" className="mr-1">{imp.impact}</Badge>
                                {imp.description}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Analyzing content...
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Queue Tab */}
        <TabsContent value="queue" className="space-y-4">
          <ProcessingQueue
            creatorId={session.creatorId}
            onSessionSelect={(sessionId) => {
              // Handle session selection
              console.log('Selected session:', sessionId);
            }}
          />
        </TabsContent>
      </Tabs>

    </div>
  );
}
