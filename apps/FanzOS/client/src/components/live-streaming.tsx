import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  Users,
  DollarSign,
  Gift,
  Heart,
  MessageCircle,
  Send,
  Settings,
  Share2,
  Eye,
  Star,
  Zap,
  Shield,
  AlertCircle,
  Trophy,
  Target,
  Timer,
  Gamepad2,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Radio,
  Wifi,
  WifiOff,
  Crown,
  Gem,
  Sparkles,
  Flame,
  BellRing,
  Ban,
  UserCheck,
  UserPlus,
  UserX,
  Lock,
  Unlock,
  TrendingUp,
  Activity,
  BarChart3,
  Play,
  Pause,
  Square,
  Circle,
  ChevronRight,
  ChevronDown,
  Hash,
  Award,
  Ticket,
  Coins,
  CreditCard,
  ShoppingBag,
  Package,
  Music,
  Headphones,
  Vibrate,
  Gauge,
  Layers,
  Grid3X3,
  PlusCircle,
  MinusCircle,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  XCircle,
  Info,
  Dice1,
  Dice2,
  Dice3,
  Dice4,
  Dice5,
  Dice6
} from "lucide-react";
import { format } from "date-fns";

interface LiveStream {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  viewerCount: number;
  startedAt: Date;
  isLive: boolean;
  isPrivate: boolean;
  isPremium: boolean;
  ticketPrice?: number;
  thumbnail?: string;
  streamKey?: string;
  streamUrl?: string;
  coHosts?: {
    id: string;
    name: string;
    avatar?: string;
    role: "co-host" | "guest";
  }[];
}

interface StreamGoal {
  id: string;
  title: string;
  description: string;
  currentAmount: number;
  targetAmount: number;
  type: "tips" | "followers" | "likes" | "duration";
  reward: string;
  icon: string;
  color: string;
  completed: boolean;
}

interface LovenseDevice {
  id: string;
  name: string;
  type: "vibrator" | "toy" | "accessory";
  isConnected: boolean;
  intensity: number;
  pattern: string;
  batteryLevel: number;
  isActive: boolean;
}

interface StreamGame {
  id: string;
  name: string;
  description: string;
  type: "wheel" | "dice" | "cards" | "trivia" | "auction";
  minBet: number;
  maxBet: number;
  currentPlayers: number;
  prizes: {
    id: string;
    name: string;
    value: number;
    icon: string;
  }[];
  isActive: boolean;
}

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  userAvatar?: string;
  userBadge?: "vip" | "moderator" | "subscriber" | "tipper";
  message: string;
  timestamp: Date;
  type: "message" | "tip" | "gift" | "system" | "lovense";
  amount?: number;
  giftName?: string;
  intensity?: number;
  duration?: number;
}

interface StreamTip {
  id: string;
  userId: string;
  username: string;
  amount: number;
  message?: string;
  isAnonymous: boolean;
  timestamp: Date;
  lovenseActivation?: {
    intensity: number;
    duration: number;
    pattern: string;
  };
}

interface LiveStreamingProps {
  isStreamer?: boolean;
  streamId?: string;
  onStreamStart?: (stream: LiveStream) => void;
  onStreamEnd?: () => void;
}

export default function LiveStreaming({ 
  isStreamer = false, 
  streamId,
  onStreamStart,
  onStreamEnd 
}: LiveStreamingProps) {
  const { user } = useAuth() as { user: User | undefined };
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Stream state
  const [isStreaming, setIsStreaming] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  const [streamDuration, setStreamDuration] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentGoal, setCurrentGoal] = useState<StreamGoal | null>(null);
  const [activeLovenseDevices, setActiveLovenseDevices] = useState<LovenseDevice[]>([]);
  const [activeGame, setActiveGame] = useState<StreamGame | null>(null);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [showGameDialog, setShowGameDialog] = useState(false);
  const [showLovenseDialog, setShowLovenseDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [selectedTab, setSelectedTab] = useState("chat");
  
  // Form state
  const [streamTitle, setStreamTitle] = useState("Live Stream");
  const [streamDescription, setStreamDescription] = useState("");
  const [streamCategory, setStreamCategory] = useState("general");
  const [streamTags, setStreamTags] = useState<string[]>([]);
  const [isPrivateStream, setIsPrivateStream] = useState(false);
  const [isPremiumStream, setIsPremiumStream] = useState(false);
  const [ticketPrice, setTicketPrice] = useState(9.99);
  const [chatMessage, setChatMessage] = useState("");
  const [tipMenuEnabled, setTipMenuEnabled] = useState(true);
  const [lovenseEnabled, setLovenseEnabled] = useState(false);
  const [multiCreatorMode, setMultiCreatorMode] = useState(false);
  
  // Fetch active streams
  const { data: activeStreams = [] } = useQuery<LiveStream[]>({
    queryKey: ["/api/live-streams/active"],
  });
  
  // Fetch stream details if viewing
  const { data: streamDetails } = useQuery<LiveStream>({
    queryKey: ["/api/live-streams", streamId],
    enabled: !!streamId && !isStreamer,
  });
  
  // Mock data for demonstration
  const mockGoals: StreamGoal[] = [
    {
      id: "1",
      title: "Strip Tease Goal",
      description: "Special show when we reach the goal!",
      currentAmount: 750,
      targetAmount: 1000,
      type: "tips",
      reward: "Strip tease performance",
      icon: "flame",
      color: "text-red-500",
      completed: false
    },
    {
      id: "2",
      title: "New Followers",
      description: "Help us reach 100 new followers!",
      currentAmount: 67,
      targetAmount: 100,
      type: "followers",
      reward: "Extended stream time",
      icon: "users",
      color: "text-blue-500",
      completed: false
    }
  ];
  
  const mockLovenseDevices: LovenseDevice[] = [
    {
      id: "1",
      name: "Lush 3",
      type: "vibrator",
      isConnected: true,
      intensity: 0,
      pattern: "steady",
      batteryLevel: 85,
      isActive: false
    },
    {
      id: "2",
      name: "Domi 2",
      type: "toy",
      isConnected: true,
      intensity: 0,
      pattern: "pulse",
      batteryLevel: 92,
      isActive: false
    }
  ];
  
  const mockGames: StreamGame[] = [
    {
      id: "1",
      name: "Spin the Wheel",
      description: "Spin for prizes and actions!",
      type: "wheel",
      minBet: 10,
      maxBet: 100,
      currentPlayers: 0,
      prizes: [
        { id: "1", name: "Flash", value: 20, icon: "zap" },
        { id: "2", name: "Dance", value: 30, icon: "music" },
        { id: "3", name: "Remove Item", value: 50, icon: "shirt" },
        { id: "4", name: "Your Choice", value: 100, icon: "gift" }
      ],
      isActive: false
    },
    {
      id: "2",
      name: "Roll the Dice",
      description: "Roll for random actions!",
      type: "dice",
      minBet: 5,
      maxBet: 50,
      currentPlayers: 0,
      prizes: [
        { id: "1", name: "Kiss", value: 5, icon: "heart" },
        { id: "2", name: "Spank", value: 10, icon: "hand" },
        { id: "3", name: "Oil Show", value: 25, icon: "droplet" },
        { id: "4", name: "Toy Play", value: 50, icon: "vibrate" }
      ],
      isActive: false
    }
  ];
  
  const mockChatMessages: ChatMessage[] = [
    {
      id: "1",
      userId: "user1",
      username: "VIPFan123",
      userBadge: "vip",
      message: "You look amazing tonight! 😍",
      timestamp: new Date(),
      type: "message"
    },
    {
      id: "2",
      userId: "user2",
      username: "BigTipper",
      userBadge: "tipper",
      message: "Sent 100 tokens",
      timestamp: new Date(),
      type: "tip",
      amount: 100
    },
    {
      id: "3",
      userId: "user3",
      username: "LoyalSub",
      userBadge: "subscriber",
      message: "Lovense activated! Level 5 for 30 seconds",
      timestamp: new Date(),
      type: "lovense",
      intensity: 5,
      duration: 30
    }
  ];
  
  const tipMenu = [
    { amount: 10, action: "PM", icon: "💬" },
    { amount: 25, action: "Flash", icon: "⚡" },
    { amount: 50, action: "Song Request", icon: "🎵" },
    { amount: 100, action: "Lovense Control 1 min", icon: "🎮" },
    { amount: 200, action: "Private Show 5 min", icon: "🔒" },
    { amount: 500, action: "Your Fantasy", icon: "✨" }
  ];
  
  // Start stream mutation
  const startStreamMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/live-streams/start", data);
      return response.json();
    },
    onSuccess: (stream) => {
      setIsStreaming(true);
      toast({
        title: "Stream started",
        description: "You are now live!",
      });
      if (onStreamStart) {
        onStreamStart(stream);
      }
    }
  });
  
  // End stream mutation
  const endStreamMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/live-streams/end");
      return response.json();
    },
    onSuccess: () => {
      setIsStreaming(false);
      toast({
        title: "Stream ended",
        description: `Total earnings: ${formatCurrency(totalEarnings)}`,
      });
      if (onStreamEnd) {
        onStreamEnd();
      }
    }
  });
  
  // Send tip mutation
  const sendTipMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", `/api/live-streams/${streamId}/tip`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Tip sent",
        description: "Your tip has been sent to the creator",
      });
    }
  });
  
  // Activate Lovense mutation
  const activateLovenseMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", `/api/live-streams/${streamId}/lovense`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Lovense activated",
        description: "The toy has been activated!",
      });
    }
  });
  
  // Update stream duration
  useEffect(() => {
    if (isStreaming) {
      const interval = setInterval(() => {
        setStreamDuration(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isStreaming]);
  
  // Simulate chat messages
  useEffect(() => {
    if (isStreaming || streamId) {
      const interval = setInterval(() => {
        const randomMessage = mockChatMessages[Math.floor(Math.random() * mockChatMessages.length)];
        setChatMessages(prev => [...prev.slice(-50), { ...randomMessage, id: Date.now().toString(), timestamp: new Date() }]);
        
        // Update viewer count randomly
        setViewerCount(prev => prev + Math.floor(Math.random() * 10) - 3);
        
        // Update earnings if tip
        if (randomMessage.type === "tip" && randomMessage.amount) {
          setTotalEarnings(prev => prev + randomMessage.amount);
          if (currentGoal && currentGoal.type === "tips") {
            setCurrentGoal(prev => prev ? {
              ...prev,
              currentAmount: Math.min(prev.currentAmount + randomMessage.amount!, prev.targetAmount)
            } : null);
          }
        }
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isStreaming, streamId]);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleStartStream = () => {
    startStreamMutation.mutate({
      title: streamTitle,
      description: streamDescription,
      category: streamCategory,
      tags: streamTags,
      isPrivate: isPrivateStream,
      isPremium: isPremiumStream,
      ticketPrice: isPremiumStream ? ticketPrice : undefined,
      multiCreator: multiCreatorMode,
      lovenseEnabled,
      tipMenuEnabled
    });
  };
  
  const handleEndStream = () => {
    endStreamMutation.mutate();
  };
  
  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      setChatMessages(prev => [...prev, {
        id: Date.now().toString(),
        userId: user?.id || "",
        username: user?.username || "Anonymous",
        message: chatMessage,
        timestamp: new Date(),
        type: "message"
      }]);
      setChatMessage("");
    }
  };
  
  const handleSendTip = (amount: number, message?: string) => {
    sendTipMutation.mutate({
      amount,
      message,
      lovenseActivation: lovenseEnabled ? {
        intensity: Math.min(Math.floor(amount / 20), 10),
        duration: Math.min(amount, 60),
        pattern: "wave"
      } : undefined
    });
  };
  
  const handleLovenseControl = (device: LovenseDevice, intensity: number, duration: number) => {
    activateLovenseMutation.mutate({
      deviceId: device.id,
      intensity,
      duration,
      pattern: device.pattern
    });
    
    // Update device state
    setActiveLovenseDevices(prev => prev.map(d => 
      d.id === device.id ? { ...d, intensity, isActive: true } : d
    ));
    
    // Auto-deactivate after duration
    setTimeout(() => {
      setActiveLovenseDevices(prev => prev.map(d => 
        d.id === device.id ? { ...d, intensity: 0, isActive: false } : d
      ));
    }, duration * 1000);
  };
  
  const handleStartGame = (game: StreamGame) => {
    setActiveGame(game);
    setChatMessages(prev => [...prev, {
      id: Date.now().toString(),
      userId: "system",
      username: "System",
      message: `🎮 ${game.name} has started! Min bet: ${formatCurrency(game.minBet)}`,
      timestamp: new Date(),
      type: "system"
    }]);
  };
  
  const handleSetGoal = (goal: StreamGoal) => {
    setCurrentGoal(goal);
    setChatMessages(prev => [...prev, {
      id: Date.now().toString(),
      userId: "system",
      username: "System",
      message: `🎯 New goal set: ${goal.title} - ${goal.currentAmount}/${goal.targetAmount}`,
      timestamp: new Date(),
      type: "system"
    }]);
  };
  
  // Streamer view
  if (isStreamer) {
    return (
      <div className="space-y-6">
        {!isStreaming ? (
          // Stream Setup
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Radio className="w-5 h-5 mr-2 text-red-500" />
                Start Live Stream
              </CardTitle>
              <CardDescription className="text-gray-400">
                Configure your stream settings and go live
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white">Stream Title</Label>
                <Input
                  value={streamTitle}
                  onChange={(e) => setStreamTitle(e.target.value)}
                  placeholder="Enter stream title..."
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              
              <div>
                <Label className="text-white">Description</Label>
                <Textarea
                  value={streamDescription}
                  onChange={(e) => setStreamDescription(e.target.value)}
                  placeholder="What's happening in your stream?"
                  className="bg-gray-700 border-gray-600 text-white"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Category</Label>
                  <Select value={streamCategory} onValueChange={setStreamCategory}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="gaming">Gaming</SelectItem>
                      <SelectItem value="chatting">Just Chatting</SelectItem>
                      <SelectItem value="dancing">Dancing</SelectItem>
                      <SelectItem value="fitness">Fitness</SelectItem>
                      <SelectItem value="adult">Adult</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-white">Tags</Label>
                  <Input
                    placeholder="Add tags separated by commas..."
                    className="bg-gray-700 border-gray-600 text-white"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const value = e.currentTarget.value.trim();
                        if (value) {
                          setStreamTags([...streamTags, value]);
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-white">Private Stream (Followers Only)</Label>
                  <Switch
                    checked={isPrivateStream}
                    onCheckedChange={setIsPrivateStream}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label className="text-white">Premium Stream (Ticket Required)</Label>
                  <Switch
                    checked={isPremiumStream}
                    onCheckedChange={setIsPremiumStream}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
                
                {isPremiumStream && (
                  <div className="flex items-center gap-2 ml-8">
                    <span className="text-gray-400">Ticket Price: $</span>
                    <Input
                      type="number"
                      value={ticketPrice}
                      onChange={(e) => setTicketPrice(parseFloat(e.target.value) || 0)}
                      className="bg-gray-700 border-gray-600 text-white w-24"
                      step="0.01"
                      min="0"
                    />
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <Label className="text-white">Enable Tip Menu</Label>
                  <Switch
                    checked={tipMenuEnabled}
                    onCheckedChange={setTipMenuEnabled}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label className="text-white">Enable Lovense Integration</Label>
                  <Switch
                    checked={lovenseEnabled}
                    onCheckedChange={setLovenseEnabled}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label className="text-white">Multi-Creator Mode</Label>
                  <Switch
                    checked={multiCreatorMode}
                    onCheckedChange={setMultiCreatorMode}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
              </div>
              
              {streamTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {streamTags.map((tag, index) => (
                    <Badge key={index} className="bg-gray-700 text-gray-300">
                      <Hash className="w-3 h-3 mr-1" />
                      {tag}
                      <button
                        onClick={() => setStreamTags(streamTags.filter((_, i) => i !== index))}
                        className="ml-2 hover:text-white"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleStartStream}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                disabled={startStreamMutation.isPending}
              >
                <Radio className="w-4 h-4 mr-2" />
                Go Live
              </Button>
            </CardFooter>
          </Card>
        ) : (
          // Live Stream Dashboard
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Stream Area */}
            <div className="lg:col-span-2 space-y-4">
              {/* Video Preview */}
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-0">
                  <div className="relative aspect-video bg-black rounded-t-lg">
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      autoPlay
                      muted
                    />
                    
                    {/* Stream Overlay */}
                    <div className="absolute top-4 left-4 right-4 flex justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-red-600 text-white">
                          <Circle className="w-2 h-2 mr-1 fill-white" />
                          LIVE
                        </Badge>
                        <Badge className="bg-gray-900/80 text-white">
                          <Eye className="w-3 h-3 mr-1" />
                          {viewerCount}
                        </Badge>
                        <Badge className="bg-gray-900/80 text-white">
                          <Timer className="w-3 h-3 mr-1" />
                          {formatDuration(streamDuration)}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant={isVideoEnabled ? "default" : "destructive"}
                          onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                          className="bg-gray-900/80"
                        >
                          {isVideoEnabled ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant={isAudioEnabled ? "default" : "destructive"}
                          onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                          className="bg-gray-900/80"
                        >
                          {isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="bg-gray-900/80 text-white"
                          onClick={() => setShowSettings(!showSettings)}
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Current Goal Overlay */}
                    {currentGoal && (
                      <div className="absolute bottom-4 left-4 right-4">
                        <Card className="bg-gray-900/90 border-gray-700">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-semibold text-white">
                                {currentGoal.title}
                              </span>
                              <span className="text-sm text-gray-400">
                                {currentGoal.currentAmount}/{currentGoal.targetAmount}
                              </span>
                            </div>
                            <Progress 
                              value={(currentGoal.currentAmount / currentGoal.targetAmount) * 100}
                              className="h-2"
                            />
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* Stream Controls */}
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => setShowGoalDialog(true)}
                        variant="outline"
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        <Target className="w-4 h-4 mr-2" />
                        Set Goal
                      </Button>
                      <Button
                        onClick={() => setShowGameDialog(true)}
                        variant="outline"
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        <Gamepad2 className="w-4 h-4 mr-2" />
                        Start Game
                      </Button>
                      {lovenseEnabled && (
                        <Button
                          onClick={() => setShowLovenseDialog(true)}
                          variant="outline"
                          className="border-gray-600 text-gray-300 hover:bg-gray-700"
                        >
                          <Vibrate className="w-4 h-4 mr-2" />
                          Lovense
                        </Button>
                      )}
                      {multiCreatorMode && (
                        <Button
                          onClick={() => setShowInviteDialog(true)}
                          variant="outline"
                          className="border-gray-600 text-gray-300 hover:bg-gray-700"
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Invite Co-Host
                        </Button>
                      )}
                    </div>
                    
                    <Button
                      onClick={handleEndStream}
                      variant="destructive"
                      disabled={endStreamMutation.isPending}
                    >
                      <Square className="w-4 h-4 mr-2" />
                      End Stream
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Stream Stats */}
              <div className="grid grid-cols-4 gap-4">
                <Card className="bg-gray-700 border-gray-600">
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <Eye className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-white">{viewerCount}</p>
                      <p className="text-xs text-gray-400">Viewers</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gray-700 border-gray-600">
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <DollarSign className="w-6 h-6 text-green-400 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-white">
                        {formatCurrency(totalEarnings)}
                      </p>
                      <p className="text-xs text-gray-400">Earnings</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gray-700 border-gray-600">
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <Heart className="w-6 h-6 text-red-400 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-white">
                        {Math.floor(Math.random() * 1000)}
                      </p>
                      <p className="text-xs text-gray-400">Likes</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gray-700 border-gray-600">
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <MessageCircle className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-white">
                        {chatMessages.length}
                      </p>
                      <p className="text-xs text-gray-400">Messages</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Active Lovense Devices */}
              {lovenseEnabled && activeLovenseDevices.length > 0 && (
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Active Devices</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {activeLovenseDevices.map(device => (
                        <div key={device.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${device.isConnected ? 'bg-green-500' : 'bg-gray-500'}`} />
                            <div>
                              <p className="text-sm font-semibold text-white">{device.name}</p>
                              <p className="text-xs text-gray-400">
                                Battery: {device.batteryLevel}% | Pattern: {device.pattern}
                              </p>
                            </div>
                          </div>
                          {device.isActive && (
                            <div className="flex items-center gap-2">
                              <Vibrate className="w-4 h-4 text-pink-400 animate-pulse" />
                              <span className="text-sm text-pink-400">
                                Level {device.intensity}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Active Game */}
              {activeGame && (
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white text-lg flex items-center">
                      <Gamepad2 className="w-5 h-5 mr-2 text-primary" />
                      {activeGame.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-400 mb-4">{activeGame.description}</p>
                    <div className="grid grid-cols-2 gap-3">
                      {activeGame.prizes.map(prize => (
                        <div key={prize.id} className="flex items-center justify-between p-2 bg-gray-700 rounded-lg">
                          <span className="text-sm text-white">{prize.name}</span>
                          <Badge className="bg-primary/20 text-primary">
                            {formatCurrency(prize.value)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm text-gray-400">
                        {activeGame.currentPlayers} players
                      </span>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setActiveGame(null)}
                      >
                        End Game
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
            
            {/* Sidebar */}
            <div className="space-y-4">
              {/* Tabs */}
              <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                <TabsList className="bg-gray-800 border border-gray-700 grid grid-cols-3">
                  <TabsTrigger value="chat">Chat</TabsTrigger>
                  <TabsTrigger value="tips">Tips</TabsTrigger>
                  <TabsTrigger value="menu">Menu</TabsTrigger>
                </TabsList>
                
                {/* Chat Tab */}
                <TabsContent value="chat" className="mt-4">
                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-0">
                      <ScrollArea className="h-[400px] p-4">
                        <div className="space-y-2">
                          {chatMessages.map(msg => (
                            <div key={msg.id} className="flex items-start gap-2">
                              {msg.type === "system" ? (
                                <div className="w-full p-2 bg-gray-700 rounded text-center">
                                  <p className="text-xs text-gray-400">{msg.message}</p>
                                </div>
                              ) : (
                                <>
                                  <Avatar className="w-6 h-6">
                                    <AvatarImage src={msg.userAvatar} />
                                    <AvatarFallback>{msg.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-semibold text-white">
                                        {msg.username}
                                      </span>
                                      {msg.userBadge && (
                                        <Badge className="text-xs bg-primary/20 text-primary">
                                          {msg.userBadge}
                                        </Badge>
                                      )}
                                    </div>
                                    {msg.type === "tip" ? (
                                      <div className="mt-1 p-2 bg-green-900/20 border border-green-700 rounded">
                                        <p className="text-sm text-green-400">
                                          Tipped {formatCurrency(msg.amount || 0)}
                                        </p>
                                      </div>
                                    ) : msg.type === "lovense" ? (
                                      <div className="mt-1 p-2 bg-pink-900/20 border border-pink-700 rounded">
                                        <p className="text-sm text-pink-400">
                                          Lovense Level {msg.intensity} for {msg.duration}s
                                        </p>
                                      </div>
                                    ) : (
                                      <p className="text-sm text-gray-300">{msg.message}</p>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      
                      <div className="p-4 border-t border-gray-700">
                        <div className="flex gap-2">
                          <Input
                            value={chatMessage}
                            onChange={(e) => setChatMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Type a message..."
                            className="bg-gray-700 border-gray-600 text-white"
                          />
                          <Button
                            onClick={handleSendMessage}
                            className="bg-primary hover:bg-primary/90"
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Tips Tab */}
                <TabsContent value="tips" className="mt-4">
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">Recent Tips</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[350px]">
                        <div className="space-y-2">
                          {chatMessages
                            .filter(msg => msg.type === "tip")
                            .reverse()
                            .map(tip => (
                              <Card key={tip.id} className="bg-gray-700 border-gray-600">
                                <CardContent className="pt-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Crown className="w-4 h-4 text-yellow-400" />
                                      <span className="text-sm font-semibold text-white">
                                        {tip.username}
                                      </span>
                                    </div>
                                    <span className="text-sm font-bold text-green-400">
                                      {formatCurrency(tip.amount || 0)}
                                    </span>
                                  </div>
                                  {tip.message && (
                                    <p className="text-xs text-gray-400 mt-2">{tip.message}</p>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Tip Menu Tab */}
                <TabsContent value="menu" className="mt-4">
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">Tip Menu</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {tipMenu.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{item.icon}</span>
                              <span className="text-sm text-white">{item.action}</span>
                            </div>
                            <Badge className="bg-green-900 text-green-400">
                              {formatCurrency(item.amount)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
        
        {/* Goal Dialog */}
        <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
          <DialogContent className="bg-gray-800 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Set Stream Goal</DialogTitle>
              <DialogDescription className="text-gray-400">
                Create a goal to motivate your viewers
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {mockGoals.map(goal => (
                <Card key={goal.id} className="bg-gray-700 border-gray-600 cursor-pointer hover:bg-gray-600"
                  onClick={() => {
                    handleSetGoal(goal);
                    setShowGoalDialog(false);
                  }}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-white">{goal.title}</h4>
                      <Badge className={goal.color}>
                        {goal.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-400 mb-2">{goal.description}</p>
                    <p className="text-sm text-gray-300">Reward: {goal.reward}</p>
                    <div className="mt-3">
                      <Progress value={(goal.currentAmount / goal.targetAmount) * 100} className="h-2" />
                      <p className="text-xs text-gray-400 mt-1">
                        {goal.currentAmount}/{goal.targetAmount}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Lovense Dialog */}
        <Dialog open={showLovenseDialog} onOpenChange={setShowLovenseDialog}>
          <DialogContent className="bg-gray-800 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Lovense Devices</DialogTitle>
              <DialogDescription className="text-gray-400">
                Manage your connected devices
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {mockLovenseDevices.map(device => (
                <Card key={device.id} className="bg-gray-700 border-gray-600">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${device.isConnected ? 'bg-green-500' : 'bg-gray-500'}`} />
                        <div>
                          <h4 className="font-semibold text-white">{device.name}</h4>
                          <p className="text-xs text-gray-400">Battery: {device.batteryLevel}%</p>
                        </div>
                      </div>
                      <Badge className="bg-primary/20 text-primary">
                        {device.type}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <Label className="text-white text-xs">Pattern</Label>
                        <Select defaultValue={device.pattern}>
                          <SelectTrigger className="bg-gray-800 border-gray-600 text-white h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-700 border-gray-600">
                            <SelectItem value="steady">Steady</SelectItem>
                            <SelectItem value="pulse">Pulse</SelectItem>
                            <SelectItem value="wave">Wave</SelectItem>
                            <SelectItem value="fireworks">Fireworks</SelectItem>
                            <SelectItem value="earthquake">Earthquake</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setActiveLovenseDevices(prev => [...prev, device]);
                          setShowLovenseDialog(false);
                        }}
                      >
                        Activate Device
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
  
  // Viewer view
  return (
    <div className="space-y-6">
      {/* Stream Discovery */}
      {!streamId && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Live Streams</CardTitle>
            <CardDescription className="text-gray-400">
              Discover live content from your favorite creators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeStreams.map(stream => (
                <Card key={stream.id} className="bg-gray-700 border-gray-600 cursor-pointer hover:bg-gray-600">
                  <CardContent className="p-0">
                    <div className="relative aspect-video">
                      <img
                        src={stream.thumbnail || "https://via.placeholder.com/320x180"}
                        alt={stream.title}
                        className="w-full h-full object-cover rounded-t-lg"
                      />
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-red-600 text-white">
                          <Circle className="w-2 h-2 mr-1 fill-white" />
                          LIVE
                        </Badge>
                      </div>
                      <div className="absolute bottom-2 right-2">
                        <Badge className="bg-gray-900/80 text-white">
                          <Eye className="w-3 h-3 mr-1" />
                          {stream.viewerCount}
                        </Badge>
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={stream.creatorAvatar} />
                          <AvatarFallback>{stream.creatorName.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-semibold text-white">{stream.creatorName}</span>
                      </div>
                      <p className="text-sm text-white font-semibold line-clamp-1">{stream.title}</p>
                      <p className="text-xs text-gray-400">{stream.category}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Viewing Stream */}
      {streamId && streamDetails && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-0">
                <div className="relative aspect-video bg-black rounded-t-lg">
                  <video
                    className="w-full h-full object-cover"
                    autoPlay
                    controls
                  />
                  
                  {/* Stream Info Overlay */}
                  <div className="absolute top-4 left-4 right-4 flex justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-red-600 text-white">
                        <Circle className="w-2 h-2 mr-1 fill-white" />
                        LIVE
                      </Badge>
                      <Badge className="bg-gray-900/80 text-white">
                        <Eye className="w-3 h-3 mr-1" />
                        {streamDetails.viewerCount}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="p-4">
                  <h2 className="text-xl font-bold text-white mb-2">{streamDetails.title}</h2>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Avatar>
                        <AvatarImage src={streamDetails.creatorAvatar} />
                        <AvatarFallback>{streamDetails.creatorName.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-white">{streamDetails.creatorName}</p>
                        <p className="text-xs text-gray-400">{streamDetails.category}</p>
                      </div>
                    </div>
                    
                    <Button className="bg-primary hover:bg-primary/90">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Follow
                    </Button>
                    
                    <Button variant="outline" className="border-gray-600 text-gray-300">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Tip Options */}
            {tipMenuEnabled && (
              <Card className="bg-gray-800 border-gray-700 mt-4">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Send a Tip</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    {tipMenu.map((item, index) => (
                      <Button
                        key={index}
                        onClick={() => handleSendTip(item.amount)}
                        variant="outline"
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        <div className="text-center">
                          <p className="text-lg mb-1">{item.icon}</p>
                          <p className="text-xs">{item.action}</p>
                          <p className="text-xs font-bold text-green-400">
                            {formatCurrency(item.amount)}
                          </p>
                        </div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Chat Sidebar */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-lg">Live Chat</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px] p-4">
                <div className="space-y-2">
                  {chatMessages.map(msg => (
                    <div key={msg.id} className="flex items-start gap-2">
                      {msg.type === "system" ? (
                        <div className="w-full p-2 bg-gray-700 rounded text-center">
                          <p className="text-xs text-gray-400">{msg.message}</p>
                        </div>
                      ) : (
                        <>
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={msg.userAvatar} />
                            <AvatarFallback>{msg.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-white">
                                {msg.username}
                              </span>
                              {msg.userBadge && (
                                <Badge className="text-xs bg-primary/20 text-primary">
                                  {msg.userBadge}
                                </Badge>
                              )}
                            </div>
                            {msg.type === "tip" ? (
                              <div className="mt-1 p-2 bg-green-900/20 border border-green-700 rounded">
                                <p className="text-sm text-green-400">
                                  Tipped {formatCurrency(msg.amount || 0)}
                                </p>
                              </div>
                            ) : msg.type === "lovense" ? (
                              <div className="mt-1 p-2 bg-pink-900/20 border border-pink-700 rounded">
                                <p className="text-sm text-pink-400">
                                  Lovense Level {msg.intensity} for {msg.duration}s
                                </p>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-300">{msg.message}</p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              <div className="p-4 border-t border-gray-700">
                <div className="flex gap-2">
                  <Input
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type a message..."
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                  <Button
                    onClick={handleSendMessage}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}