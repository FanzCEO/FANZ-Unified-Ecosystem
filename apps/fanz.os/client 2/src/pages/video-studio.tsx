import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Film, Video, Scissors, Wand2, Music, Mic, Image, Type, Layers,
  Play, Pause, SkipBack, SkipForward, Volume2, Maximize, Download,
  Upload, Save, Undo, Redo, Copy, Trash2, Plus, Minus, ZoomIn, ZoomOut,
  Settings, Palette, Sparkles, Clock, FileVideo, FileAudio, FileImage,
  ChevronLeft, ChevronRight, Grid, List, Folder, Share2, Cloud,
  Cpu, Zap, Bot, Subtitles, AudioWaveform, Camera, Monitor,
  Podcast, Headphones, Radio, Megaphone, Tv, Youtube, Instagram,
  Facebook, Twitter, TrendingUp, BarChart3, PieChart, Activity,
  Anchor, Aperture, Box, Compass, Crosshair, Disc, Eye, Focus,
  GitBranch, GitMerge, Hash, Hexagon, Lightbulb, Link, Lock,
  Map, Move, Navigation, Package, PenTool, Pocket, Repeat,
  RotateCw, Shield, Shuffle, Sliders, Square, Star, Sun, Tag,
  Target, Terminal, Tool, Unlock, Users, Wind, Zap as Lightning
} from "lucide-react";

// Professional video editing studio interface
export default function VideoStudio() {
  const { user } = useAuth() as { user: any };
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State management
  const [activeTab, setActiveTab] = useState("editor");
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedTool, setSelectedTool] = useState("select");
  const [selectedLayer, setSelectedLayer] = useState<number | null>(null);
  const [zoom, setZoom] = useState(100);
  const [showGrid, setShowGrid] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [renderProgress, setRenderProgress] = useState(0);
  const [isRendering, setIsRendering] = useState(false);

  // Refs
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // AI Features state
  const [aiProcessing, setAiProcessing] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [captions, setCaptions] = useState<any[]>([]);
  const [audioEnhanced, setAudioEnhanced] = useState(false);

  // Load projects
  const { data: projects = [] } = useQuery({
    queryKey: ['/api/video-studio/projects'],
    queryFn: async () => {
      const response = await fetch('/api/video-studio/projects');
      return response.json();
    }
  });

  // Load media library
  const { data: mediaLibrary = [] } = useQuery({
    queryKey: ['/api/video-studio/media'],
    queryFn: async () => {
      const response = await fetch('/api/video-studio/media');
      return response.json();
    }
  });

  // Load effects and transitions
  const { data: effects = [] } = useQuery({
    queryKey: ['/api/video-studio/effects'],
    queryFn: async () => {
      const response = await fetch('/api/video-studio/effects');
      return response.json();
    }
  });

  // Save project mutation
  const saveProjectMutation = useMutation({
    mutationFn: async (projectData: any) => {
      return await apiRequest("POST", "/api/video-studio/save", projectData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/video-studio/projects'] });
      toast({
        title: "Project Saved",
        description: "Your project has been saved successfully."
      });
    }
  });

  // Render video mutation
  const renderVideoMutation = useMutation({
    mutationFn: async (renderSettings: any) => {
      setIsRendering(true);
      setRenderProgress(0);
      
      // Simulate rendering progress
      const interval = setInterval(() => {
        setRenderProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsRendering(false);
            return 100;
          }
          return prev + 5;
        });
      }, 500);

      return await apiRequest("POST", "/api/video-studio/render", renderSettings);
    },
    onSuccess: (result) => {
      toast({
        title: "Render Complete! 🎬",
        description: "Your video has been rendered successfully."
      });
    }
  });

  // AI Caption generation
  const generateCaptionsMutation = useMutation({
    mutationFn: async (videoUrl: string) => {
      setAiProcessing(true);
      return await apiRequest("POST", "/api/video-studio/ai/captions", { videoUrl });
    },
    onSuccess: (result) => {
      setCaptions(result.captions);
      setAiProcessing(false);
      toast({
        title: "Captions Generated",
        description: "AI has generated captions for your video."
      });
    }
  });

  // AI Audio enhancement (Adobe Podcast style)
  const enhanceAudioMutation = useMutation({
    mutationFn: async (audioUrl: string) => {
      setAiProcessing(true);
      return await apiRequest("POST", "/api/video-studio/ai/enhance-audio", { audioUrl });
    },
    onSuccess: () => {
      setAudioEnhanced(true);
      setAiProcessing(false);
      toast({
        title: "Audio Enhanced",
        description: "AI has enhanced your audio quality."
      });
    }
  });

  // Auto-edit mutation (Gling/FireCut style)
  const autoEditMutation = useMutation({
    mutationFn: async (settings: any) => {
      setAiProcessing(true);
      return await apiRequest("POST", "/api/video-studio/ai/auto-edit", settings);
    },
    onSuccess: (result) => {
      setTimeline(result.timeline);
      setAiProcessing(false);
      toast({
        title: "Auto-Edit Complete",
        description: "AI has automatically edited your video."
      });
    }
  });

  // Generate clips mutation (Opus Clip style)
  const generateClipsMutation = useMutation({
    mutationFn: async (videoUrl: string) => {
      setAiProcessing(true);
      return await apiRequest("POST", "/api/video-studio/ai/generate-clips", { videoUrl });
    },
    onSuccess: (result) => {
      setAiProcessing(false);
      toast({
        title: "Clips Generated",
        description: `AI generated ${result.clips.length} viral clips from your video.`
      });
    }
  });

  // Timeline tools
  const tools = [
    { id: "select", icon: Navigation, name: "Select" },
    { id: "blade", icon: Scissors, name: "Blade" },
    { id: "position", icon: Move, name: "Position" },
    { id: "crop", icon: Crosshair, name: "Crop" },
    { id: "pen", icon: PenTool, name: "Pen" },
    { id: "text", icon: Type, name: "Text" },
    { id: "effects", icon: Sparkles, name: "Effects" },
    { id: "transitions", icon: GitMerge, name: "Transitions" },
    { id: "color", icon: Palette, name: "Color" },
    { id: "audio", icon: AudioWaveform, name: "Audio" }
  ];

  // Export formats
  const exportFormats = [
    { id: "mp4", name: "MP4 (H.264)", icon: FileVideo, quality: ["4K", "1080p", "720p", "480p"] },
    { id: "mov", name: "MOV (ProRes)", icon: FileVideo, quality: ["ProRes 422", "ProRes 4444"] },
    { id: "avi", name: "AVI", icon: FileVideo, quality: ["Uncompressed", "Compressed"] },
    { id: "webm", name: "WebM", icon: FileVideo, quality: ["VP9", "VP8"] },
    { id: "gif", name: "GIF", icon: Image, quality: ["High", "Medium", "Low"] },
    { id: "mp3", name: "MP3 (Audio Only)", icon: FileAudio, quality: ["320kbps", "256kbps", "128kbps"] },
    { id: "wav", name: "WAV (Audio Only)", icon: FileAudio, quality: ["48kHz", "44.1kHz"] },
    { id: "srt", name: "SRT (Subtitles)", icon: Subtitles, quality: ["Standard"] },
    { id: "sticker", name: "Animated Sticker", icon: Star, quality: ["APNG", "WebP", "Lottie"] }
  ];

  // Professional effects categories
  const effectCategories = [
    {
      name: "Color Grading",
      effects: ["LUT", "Color Wheels", "Curves", "HSL", "Vignette", "Film Grain"]
    },
    {
      name: "Transitions",
      effects: ["Cross Dissolve", "Dip to Black", "Wipe", "Push", "Slide", "Zoom", "Glitch", "Morph"]
    },
    {
      name: "Motion",
      effects: ["Ken Burns", "Speed Ramp", "Time Remapping", "Stabilization", "Motion Blur", "Slow Motion"]
    },
    {
      name: "Audio",
      effects: ["EQ", "Compressor", "Noise Reduction", "Reverb", "Echo", "Pitch Shift", "Auto-Tune"]
    },
    {
      name: "Visual Effects",
      effects: ["Chroma Key", "Rotoscoping", "Tracking", "3D Camera", "Particles", "Light Leaks"]
    },
    {
      name: "AI Enhanced",
      effects: ["Background Removal", "Object Removal", "Face Blur", "Voice Clone", "Style Transfer", "Upscale"]
    }
  ];

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch(e.key) {
          case 's':
            e.preventDefault();
            saveProjectMutation.mutate({ timeline, selectedProject });
            break;
          case 'z':
            e.preventDefault();
            // Undo logic
            break;
          case 'y':
            e.preventDefault();
            // Redo logic
            break;
          case 'c':
            e.preventDefault();
            // Copy logic
            break;
          case 'v':
            e.preventDefault();
            // Paste logic
            break;
          case 'x':
            e.preventDefault();
            // Cut logic
            break;
        }
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying(!isPlaying);
      } else if (e.key === 'b') {
        setSelectedTool('blade');
      } else if (e.key === 'v') {
        setSelectedTool('select');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, timeline, selectedProject]);

  return (
    <div className="h-screen bg-background flex flex-col" data-testid="video-studio">
      {/* Top Toolbar */}
      <div className="border-b bg-card p-2 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Professional Video Studio
          </h1>
          
          {selectedProject && (
            <div className="flex items-center space-x-2">
              <Badge variant="outline">{selectedProject.name}</Badge>
              {autoSave && (
                <Badge variant="secondary" className="text-xs">
                  <Cloud className="h-3 w-3 mr-1" />
                  Auto-saving
                </Badge>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Button size="sm" variant="ghost" onClick={() => saveProjectMutation.mutate({ timeline, selectedProject })}>
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
          <Button size="sm" variant="ghost">
            <Undo className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost">
            <Redo className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Button size="sm" variant="ghost">
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Export Video</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Format</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {exportFormats.map((format) => (
                      <Card key={format.id} className="cursor-pointer hover:border-primary">
                        <CardContent className="p-4 flex items-center space-x-2">
                          <format.icon className="h-5 w-5" />
                          <span className="text-sm">{format.name}</span>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Quality</Label>
                    <Select defaultValue="1080p">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="4k">4K (3840×2160)</SelectItem>
                        <SelectItem value="1080p">1080p (1920×1080)</SelectItem>
                        <SelectItem value="720p">720p (1280×720)</SelectItem>
                        <SelectItem value="480p">480p (854×480)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Frame Rate</Label>
                    <Select defaultValue="30">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24">24 fps (Cinema)</SelectItem>
                        <SelectItem value="30">30 fps (Standard)</SelectItem>
                        <SelectItem value="60">60 fps (Smooth)</SelectItem>
                        <SelectItem value="120">120 fps (High Speed)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {isRendering && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Rendering...</span>
                      <span>{renderProgress}%</span>
                    </div>
                    <Progress value={renderProgress} />
                  </div>
                )}

                <DialogFooter>
                  <Button 
                    onClick={() => renderVideoMutation.mutate({ format: 'mp4', quality: '1080p' })}
                    disabled={isRendering}
                  >
                    {isRendering ? "Rendering..." : "Start Export"}
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Sidebar - Media & Effects */}
        <div className="w-80 border-r bg-card">
          <Tabs defaultValue="media" className="h-full flex flex-col">
            <TabsList className="w-full rounded-none">
              <TabsTrigger value="media" className="flex-1">
                <Folder className="h-4 w-4 mr-1" />
                Media
              </TabsTrigger>
              <TabsTrigger value="effects" className="flex-1">
                <Sparkles className="h-4 w-4 mr-1" />
                Effects
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex-1">
                <Bot className="h-4 w-4 mr-1" />
                AI Tools
              </TabsTrigger>
            </TabsList>

            {/* Media Library */}
            <TabsContent value="media" className="flex-1 p-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Input placeholder="Search media..." className="flex-1" />
                  <Button size="sm">
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
                
                <ScrollArea className="h-[400px]">
                  <div className="grid grid-cols-2 gap-2">
                    {mediaLibrary.map((media: any, index: number) => (
                      <Card key={index} className="cursor-pointer hover:border-primary">
                        <CardContent className="p-2">
                          <div className="aspect-video bg-muted rounded mb-1" />
                          <p className="text-xs truncate">{media.name || `Media ${index + 1}`}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            {/* Effects */}
            <TabsContent value="effects" className="flex-1 p-4">
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {effectCategories.map((category) => (
                    <div key={category.name}>
                      <h3 className="font-semibold mb-2">{category.name}</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {category.effects.map((effect) => (
                          <Card key={effect} className="cursor-pointer hover:border-primary">
                            <CardContent className="p-3">
                              <p className="text-xs text-center">{effect}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* AI Tools */}
            <TabsContent value="ai" className="flex-1 p-4">
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center">
                      <Subtitles className="h-4 w-4 mr-2" />
                      AI Captions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      className="w-full" 
                      size="sm"
                      onClick={() => generateCaptionsMutation.mutate("")}
                      disabled={aiProcessing}
                    >
                      Generate Captions
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center">
                      <Headphones className="h-4 w-4 mr-2" />
                      Audio Enhancement
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      className="w-full" 
                      size="sm"
                      onClick={() => enhanceAudioMutation.mutate("")}
                      disabled={aiProcessing}
                    >
                      Enhance Audio (Adobe Podcast)
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center">
                      <Scissors className="h-4 w-4 mr-2" />
                      Auto Edit
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button 
                      className="w-full" 
                      size="sm"
                      onClick={() => autoEditMutation.mutate({ removeFillers: true })}
                      disabled={aiProcessing}
                    >
                      Remove Filler Words (Gling)
                    </Button>
                    <Button 
                      className="w-full" 
                      size="sm"
                      onClick={() => autoEditMutation.mutate({ multicam: true })}
                      disabled={aiProcessing}
                    >
                      Multi-cam Edit (FireCut)
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center">
                      <Zap className="h-4 w-4 mr-2" />
                      Viral Clips
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      className="w-full" 
                      size="sm"
                      onClick={() => generateClipsMutation.mutate("")}
                      disabled={aiProcessing}
                    >
                      Generate Clips (Opus Clip)
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center">
                      <Mic className="h-4 w-4 mr-2" />
                      Transcription
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      className="w-full" 
                      size="sm"
                      disabled={aiProcessing}
                    >
                      Transcribe (Descript)
                    </Button>
                  </CardContent>
                </Card>

                {aiProcessing && (
                  <Alert>
                    <AlertDescription className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                      AI is processing your request...
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Center - Video Preview & Timeline */}
        <div className="flex-1 flex flex-col">
          {/* Video Preview */}
          <div className="flex-1 bg-black relative">
            <video
              ref={videoPreviewRef}
              className="w-full h-full object-contain"
              controls={false}
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 pointer-events-none"
            />
            
            {/* Overlay Controls */}
            <div className="absolute top-4 right-4 flex items-center space-x-2">
              <Button size="sm" variant="secondary">
                <Grid className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="secondary">
                <Maximize className="h-4 w-4" />
              </Button>
            </div>

            {/* Playback Controls */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-black/50 backdrop-blur rounded-lg p-2">
              <Button size="sm" variant="ghost" className="text-white">
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className="text-white"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>
              <Button size="sm" variant="ghost" className="text-white">
                <SkipForward className="h-4 w-4" />
              </Button>
              <div className="text-white text-xs">
                {Math.floor(currentTime / 60)}:{(currentTime % 60).toString().padStart(2, '0')} / 
                {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
              </div>
              <Volume2 className="h-4 w-4 text-white" />
              <Slider className="w-20" defaultValue={[100]} max={100} />
            </div>
          </div>

          {/* Tools Bar */}
          <div className="border-t border-b bg-card p-2 flex items-center justify-between">
            <div className="flex items-center space-x-1">
              {tools.map((tool) => (
                <Button
                  key={tool.id}
                  size="sm"
                  variant={selectedTool === tool.id ? "default" : "ghost"}
                  onClick={() => setSelectedTool(tool.id)}
                  title={tool.name}
                >
                  <tool.icon className="h-4 w-4" />
                </Button>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <Button size="sm" variant="ghost" onClick={() => setZoom(Math.max(25, zoom - 25))}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm w-12 text-center">{zoom}%</span>
              <Button size="sm" variant="ghost" onClick={() => setZoom(Math.min(200, zoom + 25))}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <Button size="sm" variant="ghost" onClick={() => setShowGrid(!showGrid)}>
                <Grid className={`h-4 w-4 ${showGrid ? 'text-primary' : ''}`} />
              </Button>
              <Button size="sm" variant="ghost">
                <Lock className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Timeline */}
          <div className="h-64 bg-background border-t" ref={timelineRef}>
            <div className="h-full flex">
              {/* Track Headers */}
              <div className="w-32 bg-card border-r">
                <div className="p-2 space-y-1">
                  <div className="h-8 bg-muted rounded px-2 flex items-center justify-between">
                    <span className="text-xs">V1</span>
                    <div className="flex space-x-1">
                      <Eye className="h-3 w-3" />
                      <Lock className="h-3 w-3" />
                    </div>
                  </div>
                  <div className="h-8 bg-muted rounded px-2 flex items-center justify-between">
                    <span className="text-xs">V2</span>
                    <div className="flex space-x-1">
                      <Eye className="h-3 w-3" />
                      <Lock className="h-3 w-3" />
                    </div>
                  </div>
                  <div className="h-8 bg-muted rounded px-2 flex items-center justify-between">
                    <span className="text-xs">A1</span>
                    <div className="flex space-x-1">
                      <Volume2 className="h-3 w-3" />
                      <Lock className="h-3 w-3" />
                    </div>
                  </div>
                  <div className="h-8 bg-muted rounded px-2 flex items-center justify-between">
                    <span className="text-xs">A2</span>
                    <div className="flex space-x-1">
                      <Volume2 className="h-3 w-3" />
                      <Lock className="h-3 w-3" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline Tracks */}
              <div className="flex-1 relative overflow-x-auto">
                <div className="absolute inset-0">
                  {/* Time ruler */}
                  <div className="h-6 bg-card border-b flex">
                    {Array.from({ length: 60 }, (_, i) => (
                      <div key={i} className="flex-shrink-0 w-20 border-r">
                        <span className="text-xs text-muted-foreground px-1">
                          {i}:00
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Video tracks */}
                  <div className="space-y-1 p-2">
                    <div className="h-8 bg-purple-500/20 rounded border border-purple-500 flex items-center px-2">
                      <span className="text-xs">Clip 1</span>
                    </div>
                    <div className="h-8 bg-pink-500/20 rounded border border-pink-500 flex items-center px-2">
                      <span className="text-xs">Overlay</span>
                    </div>
                    <div className="h-8 bg-blue-500/20 rounded border border-blue-500 flex items-center px-2">
                      <span className="text-xs">Audio 1</span>
                    </div>
                    <div className="h-8 bg-green-500/20 rounded border border-green-500 flex items-center px-2">
                      <span className="text-xs">Music</span>
                    </div>
                  </div>

                  {/* Playhead */}
                  <div 
                    className="absolute top-6 bottom-0 w-0.5 bg-red-500 z-10"
                    style={{ left: `${(currentTime / duration) * 100}%` }}
                  >
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-red-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Properties & Inspector */}
        <div className="w-80 border-l bg-card">
          <Tabs defaultValue="inspector" className="h-full flex flex-col">
            <TabsList className="w-full rounded-none">
              <TabsTrigger value="inspector" className="flex-1">
                <Settings className="h-4 w-4 mr-1" />
                Inspector
              </TabsTrigger>
              <TabsTrigger value="color" className="flex-1">
                <Palette className="h-4 w-4 mr-1" />
                Color
              </TabsTrigger>
              <TabsTrigger value="audio" className="flex-1">
                <AudioWaveform className="h-4 w-4 mr-1" />
                Audio
              </TabsTrigger>
            </TabsList>

            {/* Inspector */}
            <TabsContent value="inspector" className="flex-1 p-4">
              <div className="space-y-4">
                <div>
                  <Label>Position</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <Label className="text-xs">X</Label>
                      <Input type="number" defaultValue="0" />
                    </div>
                    <div>
                      <Label className="text-xs">Y</Label>
                      <Input type="number" defaultValue="0" />
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Scale</Label>
                  <Slider defaultValue={[100]} max={200} className="mt-2" />
                </div>

                <div>
                  <Label>Rotation</Label>
                  <Slider defaultValue={[0]} min={-180} max={180} className="mt-2" />
                </div>

                <div>
                  <Label>Opacity</Label>
                  <Slider defaultValue={[100]} max={100} className="mt-2" />
                </div>

                <Separator />

                <div>
                  <Label>Blend Mode</Label>
                  <Select defaultValue="normal">
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="multiply">Multiply</SelectItem>
                      <SelectItem value="screen">Screen</SelectItem>
                      <SelectItem value="overlay">Overlay</SelectItem>
                      <SelectItem value="add">Add</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Speed</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <Slider defaultValue={[100]} min={25} max={400} className="flex-1" />
                    <span className="text-sm w-12">100%</span>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Color Correction */}
            <TabsContent value="color" className="flex-1 p-4">
              <div className="space-y-4">
                <div>
                  <Label>Exposure</Label>
                  <Slider defaultValue={[0]} min={-100} max={100} className="mt-2" />
                </div>

                <div>
                  <Label>Contrast</Label>
                  <Slider defaultValue={[0]} min={-100} max={100} className="mt-2" />
                </div>

                <div>
                  <Label>Highlights</Label>
                  <Slider defaultValue={[0]} min={-100} max={100} className="mt-2" />
                </div>

                <div>
                  <Label>Shadows</Label>
                  <Slider defaultValue={[0]} min={-100} max={100} className="mt-2" />
                </div>

                <div>
                  <Label>Saturation</Label>
                  <Slider defaultValue={[100]} max={200} className="mt-2" />
                </div>

                <div>
                  <Label>Temperature</Label>
                  <Slider defaultValue={[0]} min={-100} max={100} className="mt-2" />
                </div>

                <div>
                  <Label>Tint</Label>
                  <Slider defaultValue={[0]} min={-100} max={100} className="mt-2" />
                </div>

                <Separator />

                <div>
                  <Label>LUT</Label>
                  <Select>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select LUT" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="cinematic">Cinematic</SelectItem>
                      <SelectItem value="vintage">Vintage</SelectItem>
                      <SelectItem value="blackwhite">Black & White</SelectItem>
                      <SelectItem value="fuji">Fuji</SelectItem>
                      <SelectItem value="kodak">Kodak</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            {/* Audio */}
            <TabsContent value="audio" className="flex-1 p-4">
              <div className="space-y-4">
                <div>
                  <Label>Volume</Label>
                  <Slider defaultValue={[100]} max={150} className="mt-2" />
                </div>

                <div>
                  <Label>Fade In</Label>
                  <Slider defaultValue={[0]} max={5000} className="mt-2" />
                </div>

                <div>
                  <Label>Fade Out</Label>
                  <Slider defaultValue={[0]} max={5000} className="mt-2" />
                </div>

                <Separator />

                <div>
                  <Label>EQ Preset</Label>
                  <Select>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select preset" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flat">Flat</SelectItem>
                      <SelectItem value="voice">Voice</SelectItem>
                      <SelectItem value="music">Music</SelectItem>
                      <SelectItem value="bass">Bass Boost</SelectItem>
                      <SelectItem value="treble">Treble Boost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Noise Reduction</Label>
                  <Slider defaultValue={[0]} max={100} className="mt-2" />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Remove Background Noise</Label>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Normalize Audio</Label>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Auto Duck Music</Label>
                  <Switch />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}