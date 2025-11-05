import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import {
  Wand2, Scissors, Palette, Music, Type, Camera, Mic,
  Sparkles, Film, Image, Layers, Eye, EyeOff, Zap,
  TrendingUp, Hash, Clock, AlertCircle, CheckCircle,
  Play, Pause, SkipForward, Volume2, Settings,
  Download, Upload, RefreshCw, Save, Loader2
} from 'lucide-react';

interface AIEditorProps {
  sessionId: string;
  onComplete?: () => void;
}

interface ProcessingConfig {
  sceneDetection: boolean;
  faceDetection: boolean;
  audioEnhancement: boolean;
  noiseReduction: boolean;
  stabilization: boolean;
  colorGrading: boolean;
  autoSubtitles: boolean;
  watermark: boolean;
  backgroundReplacement: boolean;
  faceBeautification: boolean;
  beatMatching: boolean;
  transitionEffects: boolean;
  privacyBlur: boolean;
  targetQuality: 'low' | 'medium' | 'high' | 'ultra';
  processingPriority: 'normal' | 'high' | 'premium';
}

interface ProcessingStage {
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
}

export default function AIEditor({ sessionId, onComplete }: AIEditorProps) {
  const [activeTab, setActiveTab] = useState('enhance');
  const [isProcessing, setIsProcessing] = useState(false);
  const [config, setConfig] = useState<ProcessingConfig>({
    sceneDetection: true,
    faceDetection: true,
    audioEnhancement: true,
    noiseReduction: true,
    stabilization: true,
    colorGrading: true,
    autoSubtitles: true,
    watermark: false,
    backgroundReplacement: false,
    faceBeautification: true,
    beatMatching: true,
    transitionEffects: true,
    privacyBlur: false,
    targetQuality: 'high',
    processingPriority: 'normal',
  });

  const [colorGradingStyle, setColorGradingStyle] = useState('cinematic');
  const [transitionStyle, setTransitionStyle] = useState('smooth');
  const [beautificationLevel, setBeautificationLevel] = useState([50]);
  const [audioEnhancementLevel, setAudioEnhancementLevel] = useState([70]);

  const { toast } = useToast();

  // Get processing status
  const { data: processingStatus, isLoading: statusLoading } = useQuery({
    queryKey: [`/api/creator/content/processing-status/${sessionId}`],
    enabled: isProcessing,
    refetchInterval: isProcessing ? 1000 : false,
  });

  // Get content analysis
  const { data: analysis } = useQuery({
    queryKey: [`/api/creator/content/analyze/${sessionId}`],
    enabled: !!sessionId,
  });

  // Start AI processing
  const startProcessingMutation = useMutation({
    mutationFn: () =>
      apiRequest(`/api/creator/content/process-ai/${sessionId}`, {
        method: 'POST',
        body: { config },
      }),
    onSuccess: () => {
      setIsProcessing(true);
      toast({
        title: 'AI Processing Started',
        description: 'Your content is being enhanced with AI magic! ✨',
      });
    },
    onError: () => {
      toast({
        title: 'Processing Failed',
        description: 'Unable to start AI processing. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Apply preset configurations
  const applyPreset = (preset: string) => {
    switch (preset) {
      case 'quick':
        setConfig({
          ...config,
          sceneDetection: false,
          faceDetection: false,
          audioEnhancement: true,
          noiseReduction: true,
          stabilization: false,
          colorGrading: false,
          autoSubtitles: false,
          watermark: false,
          backgroundReplacement: false,
          faceBeautification: false,
          beatMatching: false,
          transitionEffects: false,
          privacyBlur: false,
          targetQuality: 'medium',
          processingPriority: 'high',
        });
        break;
      case 'professional':
        setConfig({
          ...config,
          sceneDetection: true,
          faceDetection: true,
          audioEnhancement: true,
          noiseReduction: true,
          stabilization: true,
          colorGrading: true,
          autoSubtitles: true,
          watermark: true,
          backgroundReplacement: false,
          faceBeautification: true,
          beatMatching: true,
          transitionEffects: true,
          privacyBlur: false,
          targetQuality: 'ultra',
          processingPriority: 'premium',
        });
        break;
      case 'social':
        setConfig({
          ...config,
          sceneDetection: true,
          faceDetection: true,
          audioEnhancement: true,
          noiseReduction: true,
          stabilization: false,
          colorGrading: true,
          autoSubtitles: true,
          watermark: false,
          backgroundReplacement: false,
          faceBeautification: true,
          beatMatching: true,
          transitionEffects: true,
          privacyBlur: false,
          targetQuality: 'high',
          processingPriority: 'normal',
        });
        break;
    }
  };

  const getStageIcon = (stage: string) => {
    const icons: Record<string, JSX.Element> = {
      scene_detection: <Film className="h-4 w-4" />,
      face_tracking: <Camera className="h-4 w-4" />,
      audio_processing: <Mic className="h-4 w-4" />,
      content_enhancement: <Sparkles className="h-4 w-4" />,
      format_conversion: <Layers className="h-4 w-4" />,
      asset_generation: <Image className="h-4 w-4" />,
    };
    return icons[stage] || <Zap className="h-4 w-4" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'processing':
        return 'text-blue-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Presets */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-6 w-6" />
                AI Content Editor
              </CardTitle>
              <CardDescription>
                Enhance your content with powerful AI features
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => applyPreset('quick')}
                disabled={isProcessing}
                data-testid="button-preset-quick"
              >
                Quick Edit
              </Button>
              <Button
                variant="outline"
                onClick={() => applyPreset('social')}
                disabled={isProcessing}
                data-testid="button-preset-social"
              >
                Social Media
              </Button>
              <Button
                variant="outline"
                onClick={() => applyPreset('professional')}
                disabled={isProcessing}
                data-testid="button-preset-professional"
              >
                Professional
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Editor Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="enhance" data-testid="tab-enhance">
            <Sparkles className="h-4 w-4 mr-2" />
            Enhance
          </TabsTrigger>
          <TabsTrigger value="audio" data-testid="tab-audio">
            <Music className="h-4 w-4 mr-2" />
            Audio
          </TabsTrigger>
          <TabsTrigger value="visual" data-testid="tab-visual">
            <Palette className="h-4 w-4 mr-2" />
            Visual
          </TabsTrigger>
          <TabsTrigger value="smart" data-testid="tab-smart">
            <TrendingUp className="h-4 w-4 mr-2" />
            Smart
          </TabsTrigger>
        </TabsList>

        {/* Enhancement Tab */}
        <TabsContent value="enhance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Enhancement Features</CardTitle>
              <CardDescription>
                Select which AI enhancements to apply to your content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="sceneDetection" className="flex items-center gap-2">
                    <Scissors className="h-4 w-4" />
                    Smart Scene Detection
                  </Label>
                  <Switch
                    id="sceneDetection"
                    checked={config.sceneDetection}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, sceneDetection: checked })
                    }
                    disabled={isProcessing}
                    data-testid="switch-scene-detection"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="faceDetection" className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Face Detection & Tracking
                  </Label>
                  <Switch
                    id="faceDetection"
                    checked={config.faceDetection}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, faceDetection: checked })
                    }
                    disabled={isProcessing}
                    data-testid="switch-face-detection"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="stabilization" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Video Stabilization
                  </Label>
                  <Switch
                    id="stabilization"
                    checked={config.stabilization}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, stabilization: checked })
                    }
                    disabled={isProcessing}
                    data-testid="switch-stabilization"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="transitionEffects" className="flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    Transition Effects
                  </Label>
                  <Switch
                    id="transitionEffects"
                    checked={config.transitionEffects}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, transitionEffects: checked })
                    }
                    disabled={isProcessing}
                    data-testid="switch-transitions"
                  />
                </div>
              </div>

              {config.transitionEffects && (
                <div className="space-y-2">
                  <Label>Transition Style</Label>
                  <Select
                    value={transitionStyle}
                    onValueChange={setTransitionStyle}
                    disabled={isProcessing}
                  >
                    <SelectTrigger data-testid="select-transition-style">
                      <SelectValue placeholder="Select transition style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="smooth">Smooth Fade</SelectItem>
                      <SelectItem value="dynamic">Dynamic Cut</SelectItem>
                      <SelectItem value="glitch">Glitch Effect</SelectItem>
                      <SelectItem value="zoom">Zoom Transition</SelectItem>
                      <SelectItem value="slide">Slide</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audio Tab */}
        <TabsContent value="audio" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audio Processing</CardTitle>
              <CardDescription>
                Enhance and optimize audio quality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="audioEnhancement" className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    Audio Enhancement
                  </Label>
                  <Switch
                    id="audioEnhancement"
                    checked={config.audioEnhancement}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, audioEnhancement: checked })
                    }
                    disabled={isProcessing}
                    data-testid="switch-audio-enhancement"
                  />
                </div>

                {config.audioEnhancement && (
                  <div className="space-y-2">
                    <Label>Enhancement Level</Label>
                    <Slider
                      value={audioEnhancementLevel}
                      onValueChange={setAudioEnhancementLevel}
                      min={0}
                      max={100}
                      step={10}
                      disabled={isProcessing}
                      data-testid="slider-audio-level"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Subtle</span>
                      <span>{audioEnhancementLevel[0]}%</span>
                      <span>Maximum</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Label htmlFor="noiseReduction" className="flex items-center gap-2">
                    <Mic className="h-4 w-4" />
                    Noise Reduction
                  </Label>
                  <Switch
                    id="noiseReduction"
                    checked={config.noiseReduction}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, noiseReduction: checked })
                    }
                    disabled={isProcessing}
                    data-testid="switch-noise-reduction"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="beatMatching" className="flex items-center gap-2">
                    <Music className="h-4 w-4" />
                    Beat Matching
                  </Label>
                  <Switch
                    id="beatMatching"
                    checked={config.beatMatching}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, beatMatching: checked })
                    }
                    disabled={isProcessing}
                    data-testid="switch-beat-matching"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="autoSubtitles" className="flex items-center gap-2">
                    <Type className="h-4 w-4" />
                    Auto-Generate Subtitles
                  </Label>
                  <Switch
                    id="autoSubtitles"
                    checked={config.autoSubtitles}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, autoSubtitles: checked })
                    }
                    disabled={isProcessing}
                    data-testid="switch-auto-subtitles"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Visual Tab */}
        <TabsContent value="visual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Visual Effects</CardTitle>
              <CardDescription>
                Apply AI-powered visual enhancements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="colorGrading" className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    AI Color Grading
                  </Label>
                  <Switch
                    id="colorGrading"
                    checked={config.colorGrading}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, colorGrading: checked })
                    }
                    disabled={isProcessing}
                    data-testid="switch-color-grading"
                  />
                </div>

                {config.colorGrading && (
                  <div className="space-y-2">
                    <Label>Color Style</Label>
                    <Select
                      value={colorGradingStyle}
                      onValueChange={setColorGradingStyle}
                      disabled={isProcessing}
                    >
                      <SelectTrigger data-testid="select-color-style">
                        <SelectValue placeholder="Select color style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cinematic">Cinematic</SelectItem>
                        <SelectItem value="vibrant">Vibrant</SelectItem>
                        <SelectItem value="moody">Moody</SelectItem>
                        <SelectItem value="vintage">Vintage</SelectItem>
                        <SelectItem value="natural">Natural</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Label htmlFor="faceBeautification" className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Face Beautification
                  </Label>
                  <Switch
                    id="faceBeautification"
                    checked={config.faceBeautification}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, faceBeautification: checked })
                    }
                    disabled={isProcessing}
                    data-testid="switch-beautification"
                  />
                </div>

                {config.faceBeautification && (
                  <div className="space-y-2">
                    <Label>Beautification Level</Label>
                    <Slider
                      value={beautificationLevel}
                      onValueChange={setBeautificationLevel}
                      min={0}
                      max={100}
                      step={10}
                      disabled={isProcessing}
                      data-testid="slider-beautification"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Natural</span>
                      <span>{beautificationLevel[0]}%</span>
                      <span>Glamour</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Label htmlFor="backgroundReplacement" className="flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    Background Replacement
                  </Label>
                  <Switch
                    id="backgroundReplacement"
                    checked={config.backgroundReplacement}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, backgroundReplacement: checked })
                    }
                    disabled={isProcessing}
                    data-testid="switch-background"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="watermark" className="flex items-center gap-2">
                    <Type className="h-4 w-4" />
                    Add Watermark
                  </Label>
                  <Switch
                    id="watermark"
                    checked={config.watermark}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, watermark: checked })
                    }
                    disabled={isProcessing}
                    data-testid="switch-watermark"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="privacyBlur" className="flex items-center gap-2">
                    <EyeOff className="h-4 w-4" />
                    Privacy Blur
                  </Label>
                  <Switch
                    id="privacyBlur"
                    checked={config.privacyBlur}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, privacyBlur: checked })
                    }
                    disabled={isProcessing}
                    data-testid="switch-privacy-blur"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Smart Analysis Tab */}
        <TabsContent value="smart" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Content Analysis</CardTitle>
              <CardDescription>
                Smart insights and recommendations for your content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {analysis ? (
                <>
                  {/* Engagement Prediction */}
                  <div className="space-y-2">
                    <Label>Engagement Score</Label>
                    <Progress value={analysis.engagement?.score || 0} />
                    <p className="text-sm text-muted-foreground">
                      Predicted engagement: {analysis.engagement?.score || 0}%
                    </p>
                  </div>

                  {/* Content Categories */}
                  <div className="space-y-2">
                    <Label>Content Categories</Label>
                    <div className="flex flex-wrap gap-2">
                      {analysis.categories?.map((cat: any) => (
                        <Badge key={cat.name} variant="secondary">
                          {cat.name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Mood Analysis */}
                  <div className="space-y-2">
                    <Label>Detected Mood</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{analysis.mood?.primary}</Badge>
                      <span className="text-sm text-muted-foreground">
                        Energy: {Math.round((analysis.mood?.energy || 0) * 100)}%
                      </span>
                    </div>
                  </div>

                  {/* Best Platforms */}
                  <div className="space-y-2">
                    <Label>Recommended Platforms</Label>
                    <div className="flex flex-wrap gap-2">
                      {analysis.engagement?.bestPlatforms?.map((platform: string) => (
                        <Badge key={platform} variant="default">
                          {platform}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Trending Elements */}
                  {analysis.trends?.alignedTrends?.length > 0 && (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Aligned Trends
                      </Label>
                      <div className="space-y-1">
                        {analysis.trends.alignedTrends.map((trend: any) => (
                          <div
                            key={trend.name}
                            className="flex justify-between items-center text-sm"
                          >
                            <span>{trend.name}</span>
                            <Badge variant="outline">{trend.platform}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Hashtag Recommendations */}
                  {analysis.recommendations?.hashtags && (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Hash className="h-4 w-4" />
                        Recommended Hashtags
                      </Label>
                      <div className="flex flex-wrap gap-1">
                        {analysis.recommendations.hashtags
                          .slice(0, 10)
                          .map((tag: any) => (
                            <Badge
                              key={tag.tag}
                              variant={tag.trending ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {tag.tag}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Posting Time */}
                  {analysis.recommendations?.postingTime && (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Best Posting Times
                      </Label>
                      <div className="space-y-1">
                        {analysis.recommendations.postingTime.map((time: any) => (
                          <div
                            key={time.platform}
                            className="flex justify-between items-center text-sm"
                          >
                            <span>{time.platform}</span>
                            <span className="text-muted-foreground">
                              {new Date(time.bestTime).toLocaleTimeString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Content analysis will be available after processing</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Processing Status */}
      {isProcessing && processingStatus && (
        <Card>
          <CardHeader>
            <CardTitle>Processing Pipeline</CardTitle>
            <CardDescription>
              AI is enhancing your content across multiple stages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px] pr-4">
              <div className="space-y-3">
                {processingStatus.stages?.map((stage: ProcessingStage) => (
                  <div key={stage.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStageIcon(stage.name)}
                      <div>
                        <p className="text-sm font-medium">
                          {stage.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                        {stage.error && (
                          <p className="text-xs text-red-600">{stage.error}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {stage.status === 'processing' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : stage.status === 'completed' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : stage.status === 'failed' ? (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-gray-400" />
                      )}
                      <span className={`text-sm ${getStatusColor(stage.status)}`}>
                        {stage.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Quality Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Processing Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Quality Level</Label>
              <Select
                value={config.targetQuality}
                onValueChange={(value: any) =>
                  setConfig({ ...config, targetQuality: value })
                }
                disabled={isProcessing}
              >
                <SelectTrigger data-testid="select-quality">
                  <SelectValue placeholder="Select quality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low (Fast)</SelectItem>
                  <SelectItem value="medium">Medium (Balanced)</SelectItem>
                  <SelectItem value="high">High (Recommended)</SelectItem>
                  <SelectItem value="ultra">Ultra (Best Quality)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Processing Priority</Label>
              <Select
                value={config.processingPriority}
                onValueChange={(value: any) =>
                  setConfig({ ...config, processingPriority: value })
                }
                disabled={isProcessing}
              >
                <SelectTrigger data-testid="select-priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="premium">Premium (Fastest)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={isProcessing}
            data-testid="button-save-preset"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Preset
          </Button>
          <Button
            variant="outline"
            disabled={isProcessing}
            data-testid="button-reset"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>

        <div className="flex gap-2">
          {isProcessing ? (
            <Button disabled>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </Button>
          ) : (
            <Button
              onClick={() => startProcessingMutation.mutate()}
              disabled={startProcessingMutation.isPending}
              data-testid="button-start-processing"
            >
              <Wand2 className="h-4 w-4 mr-2" />
              Start AI Processing
            </Button>
          )}
          
          {onComplete && (
            <Button
              variant="default"
              onClick={onComplete}
              disabled={isProcessing}
              data-testid="button-continue"
            >
              Continue
              <SkipForward className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}