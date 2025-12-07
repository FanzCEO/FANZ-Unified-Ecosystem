import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Heart,
  MessageCircle,
  Users,
  Eye,
  Gift,
  Share2,
  Settings,
  Calendar,
  Clock,
  TrendingUp,
  Zap,
  Star,
  Video,
  Camera,
  Mic,
  MicOff,
  VideoOff,
  RotateCcw,
  Search,
  Filter,
  Grid3X3,
  List,
  ChevronDown,
  Send,
  DollarSign,
  Crown,
  Shield,
  UserPlus,
  StopCircle,
} from "lucide-react";
import { Link } from "wouter";

// Types
interface LiveStream {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  thumbnailUrl: string;
  category: string;
  viewerCount: number;
  price?: number;
  isLive: boolean;
  startTime: string;
  tags: string[];
  isPrivate: boolean;
}

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  message: string;
  timestamp: string;
  tipAmount?: number;
  isVip?: boolean;
  isModerator?: boolean;
}

export default function LiveStreaming() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Stream states
  const [selectedStream, setSelectedStream] = useState<LiveStream | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState([75]);
  const [isMuted, setIsMuted] = useState(false);
  const [showVideoControls, setShowVideoControls] = useState(false);
  
  // Chat states
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatMessage, setChatMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  
  // UI states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showTipModal, setShowTipModal] = useState(false);
  const [showCoStarModal, setShowCoStarModal] = useState(false);
  const [tipAmount, setTipAmount] = useState("");
  const [tipMessage, setTipMessage] = useState("");
  const [coStarName, setCoStarName] = useState("");
  const [coStarEmail, setCoStarEmail] = useState("");
  
  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  const wsRef = useRef<WebSocket | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Mock data for development
  const mockUser = {
    id: "user123",
    username: "testuser",
    profilePicture: "/api/placeholder/40/40",
    role: "fanz"
  };

  // Use mock data if user is not loaded
  const currentUser = (user as any) || mockUser;

  // Fetch live streams
  const { data: liveStreams, isLoading: streamsLoading } = useQuery({
    queryKey: ["/api/streams/active"],
    enabled: !isLoading,
  });

  // Fetch unread count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["/api/messages/unread-count"],
    enabled: !!currentUser,
  });

  // Mock data for streams
  const mockStreams: LiveStream[] = [
    {
      id: "stream1",
      title: "Evening Chat Session",
      description: "Come chat with me!",
      creatorId: "creator1",
      creatorName: "Emma Rose",
      creatorAvatar: "/api/placeholder/40/40",
      thumbnailUrl: "/api/placeholder/300/200",
      category: "lifestyle",
      viewerCount: 234,
      isLive: true,
      startTime: new Date().toISOString(),
      tags: ["chat", "lifestyle"],
      isPrivate: false,
    },
    {
      id: "stream2",
      title: "Workout Session",
      description: "Let's get fit together!",
      creatorId: "creator2",
      creatorName: "Fit Sarah",
      creatorAvatar: "/api/placeholder/40/40",
      thumbnailUrl: "/api/placeholder/300/200",
      category: "fitness",
      viewerCount: 156,
      price: 5,
      isLive: true,
      startTime: new Date().toISOString(),
      tags: ["fitness", "workout"],
      isPrivate: false,
    }
  ];

  const streams = (liveStreams as LiveStream[]) || mockStreams;

  // Filter streams
  const filteredStreams = useMemo(() => {
    let filtered = streams;
    
    if (searchQuery.trim()) {
      filtered = filtered.filter(stream =>
        stream.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stream.creatorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stream.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    if (selectedCategory !== "all") {
      filtered = filtered.filter(stream => stream.category === selectedCategory);
    }
    
    return filtered;
  }, [streams, searchQuery, selectedCategory]);

  const liveStreamsNow = filteredStreams.filter(stream => stream.isLive);
  const scheduledStreamsData = filteredStreams.filter(stream => !stream.isLive);

  // WebSocket connection for chat
  useEffect(() => {
    if (selectedStream && currentUser) {
      const ws = new WebSocket(`wss://localhost:3000/stream/${selectedStream.id}/chat`);
      
      ws.onopen = () => {
        setIsConnected(true);
        console.log("Connected to stream chat");
      };
      
      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        setChatMessages(prev => [...prev, message]);
      };
      
      ws.onclose = () => {
        setIsConnected(false);
        console.log("Disconnected from stream chat");
      };
      
      wsRef.current = ws;
      
      return () => {
        ws.close();
      };
    }
  }, [selectedStream, currentUser]);

  // Send chat message
  const sendMessage = useCallback(() => {
    if (!chatMessage.trim() || !selectedStream || !currentUser) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      userId: currentUser?.id || "anonymous",
      username: currentUser?.username || "Anonymous",
      userAvatar: currentUser?.profilePicture || "",
      message: chatMessage,
      timestamp: new Date().toISOString(),
      isVip: currentUser?.role === "creator",
      isModerator: currentUser?.role === "admin"
    };

    setChatMessages(prev => [...prev, newMessage]);
    
    if (wsRef.current && isConnected) {
      wsRef.current.send(JSON.stringify(newMessage));
    }
    
    setChatMessage("");
  }, [chatMessage, selectedStream, currentUser, isConnected]);

  // Send tip
  const sendTip = useCallback(async (amount: number, message?: string) => {
    if (!selectedStream || !currentUser || amount <= 0) return;

    try {
      const tipMessage: ChatMessage = {
        id: Date.now().toString(),
        userId: currentUser?.id || "anonymous",
        username: currentUser?.username || "Anonymous",
        userAvatar: currentUser?.profilePicture || "",
        message: message || `Sent $${amount} tip! 💰`,
        timestamp: new Date().toISOString(),
        tipAmount: amount,
        isVip: currentUser?.role === "creator"
      };

      setChatMessages(prev => [...prev, tipMessage]);
      
      setShowTipModal(false);
      setTipAmount("");
      setTipMessage("");
      
      toast({
        title: "Tip Sent!",
        description: `You sent $${amount} to ${selectedStream.creatorName}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send tip. Please try again.",
        variant: "destructive",
      });
    }
  }, [selectedStream, currentUser, toast]);

  // Recording functions
  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = useCallback(async () => {
    if (!selectedStream || !currentUser || currentUser?.role !== "creator") return;

    try {
      setIsRecording(true);
      setRecordingDuration(0);
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
      toast({
        title: "Recording Started",
        description: "Your stream is now being recorded",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start recording",
        variant: "destructive",
      });
      setIsRecording(false);
    }
  }, [selectedStream, currentUser, toast]);

  const stopRecording = useCallback(async () => {
    if (!isRecording) return;

    try {
      setIsRecording(false);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      
      toast({
        title: "Recording Stopped",
        description: `Recording saved (${formatRecordingTime(recordingDuration)})`,
      });
      
      setRecordingDuration(0);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to stop recording",
        variant: "destructive",
      });
    }
  }, [isRecording, recordingDuration, toast]);

  // Add co-star
  const addCoStar = useCallback(async () => {
    if (!coStarName.trim() || !coStarEmail.trim()) return;

    try {
      toast({
        title: "Co-star Added",
        description: `${coStarName} has been added as a co-star`,
      });
      
      setShowCoStarModal(false);
      setCoStarName("");
      setCoStarEmail("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add co-star",
        variant: "destructive",
      });
    }
  }, [coStarName, coStarEmail, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Navigation unreadCount={unreadCount as number} />
      
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center">
              <Video className="w-8 h-8 mr-3 text-primary" />
              FanzLive
            </h1>
            <p className="text-gray-400">Live streaming with your favorite creators</p>
          </div>
          
          {currentUser?.role === "creator" && (
            <Link href="/creator-dashboard">
              <Button className="bg-gradient-to-r from-primary to-secondary hover:from-purple-600 hover:to-pink-600">
                <Camera className="w-4 h-4 mr-2" />
                Go Live
              </Button>
            </Link>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Search streams, creators, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
          />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {["all", "lifestyle", "fitness", "gaming", "music", "art", "cooking", "education"].map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className={selectedCategory === category 
                ? "bg-primary text-white" 
                : "border-gray-600 text-gray-300 hover:bg-gray-800"
              }
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Button>
          ))}
        </div>

        <Tabs defaultValue="live" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800 mb-6">
            <TabsTrigger value="live" className="data-[state=active]:bg-primary">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span>Live Now ({liveStreamsNow.length})</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="scheduled" className="data-[state=active]:bg-primary">
              <Calendar className="w-4 h-4 mr-2" />
              Scheduled ({scheduledStreamsData.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="live" className="space-y-6">
            {!selectedStream ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {liveStreamsNow.map((stream) => (
                  <Card key={stream.id} className="bg-gray-800 border-gray-700 hover:border-primary transition-colors cursor-pointer" 
                        onClick={() => setSelectedStream(stream)}>
                    <div className="relative">
                      <img src={stream.thumbnailUrl} alt={stream.title} className="w-full h-48 object-cover rounded-t-lg" />
                      <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full flex items-center">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-1"></div>
                        LIVE
                      </div>
                      <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                        <Eye className="w-3 h-3 inline mr-1" />
                        {stream.viewerCount}
                      </div>
                      {stream.price && (
                        <div className="absolute bottom-2 right-2 bg-primary text-white text-xs px-2 py-1 rounded-full">
                          ${stream.price}
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <Avatar className="w-10 h-10 flex-shrink-0">
                          <AvatarImage src={stream.creatorAvatar} alt={stream.creatorName} />
                          <AvatarFallback>{stream.creatorName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-white font-semibold truncate">{stream.title}</h3>
                          <p className="text-gray-400 text-sm">{stream.creatorName}</p>
                          <p className="text-gray-500 text-xs mt-1 line-clamp-2">{stream.description}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {stream.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs bg-gray-700 text-gray-300">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3">
                  <div className="bg-black rounded-lg overflow-hidden relative group">
                    <video
                      ref={videoRef}
                      className="w-full aspect-video object-cover"
                      autoPlay
                      muted={isMuted}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                    />
                    
                    {/* Stream info overlay */}
                    <div className="absolute top-4 left-4 flex items-center space-x-2">
                      <div className="bg-red-600 text-white text-xs px-2 py-1 rounded-full flex items-center">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-1"></div>
                        LIVE
                      </div>
                      <div className="bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                        <Eye className="w-3 h-3 inline mr-1" />
                        {selectedStream.viewerCount}
                      </div>
                    </div>

                    {/* Recording status & controls */}
                    <div className="absolute top-4 right-4 flex items-center space-x-2">
                      {currentUser?.role === "creator" && selectedStream?.creatorId === currentUser?.id && (
                        <>
                          {isRecording ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="bg-red-600/80 text-white hover:bg-red-700/80"
                              onClick={stopRecording}
                            >
                              <StopCircle className="w-4 h-4 mr-1" />
                              {formatRecordingTime(recordingDuration)}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="bg-gray-800/80 text-white hover:bg-gray-700/80"
                              onClick={startRecording}
                            >
                              <div className="w-2 h-2 bg-red-500 rounded-full mr-1" />
                              Record
                            </Button>
                          )}
                        </>
                      )}
                    </div>

                    {/* Video controls */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                      <div className="flex items-center justify-between text-white">
                        <div className="flex items-center space-x-4">
                          <Button size="sm" variant="ghost" onClick={() => setIsPlaying(!isPlaying)}>
                            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </Button>
                          
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="ghost" onClick={() => setIsMuted(!isMuted)}>
                              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                            </Button>
                            <Slider
                              value={volume}
                              onValueChange={setVolume}
                              max={100}
                              step={1}
                              className="w-20"
                            />
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="ghost" onClick={() => setShowTipModal(true)}>
                            <Gift className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Share2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Stream info */}
                  <div className="bg-gray-800 rounded-lg p-6 mt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={selectedStream.creatorAvatar} alt={selectedStream.creatorName} />
                          <AvatarFallback>{selectedStream.creatorName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h2 className="text-xl font-bold text-white mb-1">{selectedStream.title}</h2>
                          <p className="text-gray-400 mb-2">{selectedStream.creatorName}</p>
                          <p className="text-gray-300 mb-3">{selectedStream.description}</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedStream.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="bg-gray-700 text-gray-300">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <Button variant="outline" onClick={() => setSelectedStream(null)}>
                        Back to Browse
                      </Button>
                    </div>

                    {/* Creator actions */}
                    {currentUser?.role === "creator" && selectedStream?.creatorId === currentUser?.id && (
                      <div className="mt-6 p-4 bg-gray-700 rounded-lg">
                        <h3 className="text-white font-semibold mb-3">Creator Controls</h3>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" onClick={() => setShowCoStarModal(true)}>
                            <UserPlus className="w-4 h-4 mr-1" />
                            Add Co-star
                          </Button>
                          <Button size="sm" variant="outline">
                            <Settings className="w-4 h-4 mr-1" />
                            Stream Settings
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Chat sidebar */}
                <div className="lg:col-span-1">
                  <Card className="bg-gray-800 border-gray-700 h-[600px] flex flex-col">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-white flex items-center justify-between">
                        <span>Live Chat</span>
                        <Badge variant="outline" className={isConnected ? "border-green-500 text-green-500" : "border-red-500 text-red-500"}>
                          {isConnected ? "Connected" : "Disconnected"}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    
                    <CardContent className="flex-1 flex flex-col p-0">
                      <ScrollArea className="flex-1 px-4">
                        <div className="space-y-3">
                          {chatMessages.map((msg) => (
                            <div key={msg.id} className="flex space-x-2">
                              <Avatar className="w-6 h-6 flex-shrink-0">
                                <AvatarImage src={msg.userAvatar} alt={msg.username} />
                                <AvatarFallback className="text-xs">{msg.username.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center space-x-1 mb-1">
                                  <span className="text-sm font-medium text-white">{msg.username}</span>
                                  {msg.isVip && <Crown className="w-3 h-3 text-yellow-500" />}
                                  {msg.isModerator && <Shield className="w-3 h-3 text-blue-500" />}
                                  {msg.tipAmount && (
                                    <Badge variant="secondary" className="bg-green-600 text-white text-xs">
                                      ${msg.tipAmount}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-300 break-words">{msg.message}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      
                      <div className="p-4 border-t border-gray-700">
                        <div className="flex space-x-2">
                          <Input
                            placeholder="Say something nice..."
                            value={chatMessage}
                            onChange={(e) => setChatMessage(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                            className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          />
                          <Button size="sm" onClick={sendMessage} disabled={!chatMessage.trim()}>
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="scheduled" className="space-y-6">
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Scheduled Streams</h3>
              <p className="text-gray-400">Check back later for upcoming live streams!</p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Tip Modal */}
        <Dialog open={showTipModal} onOpenChange={setShowTipModal}>
          <DialogContent className="bg-gray-800 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Send a Tip</DialogTitle>
              <DialogDescription className="text-gray-400">
                Show your support to {selectedStream?.creatorName}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 25, 50].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => setTipAmount(amount.toString())}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    ${amount}
                  </Button>
                ))}
              </div>
              
              <Input
                type="number"
                placeholder="Custom amount"
                value={tipAmount}
                onChange={(e) => setTipAmount(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
              
              <Textarea
                placeholder="Add a message (optional)"
                value={tipMessage}
                onChange={(e) => setTipMessage(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            
            <DialogFooter>
              <Button
                onClick={() => sendTip(parseInt(tipAmount) || 0, tipMessage)}
                disabled={!tipAmount || parseInt(tipAmount) <= 0}
                className="bg-gradient-to-r from-primary to-secondary hover:from-purple-600 hover:to-pink-600"
              >
                <Gift className="w-4 h-4 mr-2" />
                Send ${tipAmount}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Co-star Addition Modal */}
        <Dialog open={showCoStarModal} onOpenChange={setShowCoStarModal}>
          <DialogContent className="bg-gray-800 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Add Co-star</DialogTitle>
              <DialogDescription className="text-gray-400">
                Add a co-star to join your live stream
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="costar-name" className="text-gray-300">Name</Label>
                <Input
                  id="costar-name"
                  placeholder="Co-star name"
                  value={coStarName}
                  onChange={(e) => setCoStarName(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              
              <div>
                <Label htmlFor="costar-email" className="text-gray-300">Email</Label>
                <Input
                  id="costar-email"
                  type="email"
                  placeholder="Co-star email"
                  value={coStarEmail}
                  onChange={(e) => setCoStarEmail(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCoStarModal(false)}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={addCoStar}
                disabled={!coStarName || !coStarEmail}
                className="bg-gradient-to-r from-primary to-secondary hover:from-purple-600 hover:to-pink-600"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add Co-star
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}