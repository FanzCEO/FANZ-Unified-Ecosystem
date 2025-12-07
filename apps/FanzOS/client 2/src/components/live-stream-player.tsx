import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Users,
  Heart,
  MessageCircle,
  Share,
  Settings,
  Radio
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface StreamMessage {
  id: string;
  user: string;
  message: string;
  timestamp: Date;
  isHighlighted?: boolean;
}

interface LiveStreamPlayerProps {
  streamId: string;
  streamUrl: string;
  title: string;
  creatorName: string;
  creatorAvatar?: string;
  isLive: boolean;
  viewerCount: number;
  onTip?: () => void;
  onFollow?: () => void;
  onShare?: () => void;
  className?: string;
}

export default function LiveStreamPlayer({
  streamId,
  streamUrl,
  title,
  creatorName,
  creatorAvatar,
  isLive,
  viewerCount,
  onTip,
  onFollow,
  onShare,
  className = ""
}: LiveStreamPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [messages, setMessages] = useState<StreamMessage[]>([
    {
      id: "1",
      user: "fan123",
      message: "Great stream! 🔥",
      timestamp: new Date(Date.now() - 60000),
    },
    {
      id: "2", 
      user: "viewer456",
      message: "Love this content",
      timestamp: new Date(Date.now() - 30000),
    },
    {
      id: "3",
      user: "supporter789",
      message: "You're amazing! 💖",
      timestamp: new Date(Date.now() - 10000),
      isHighlighted: true
    }
  ]);

  useEffect(() => {
    // In a real implementation, this would connect to WebSocket for live chat
    const interval = setInterval(() => {
      const randomMessages = [
        "This is incredible!",
        "Love the energy!",
        "More please! 🔥",
        "You're the best!",
        "Amazing content ✨",
        "Keep it up!",
      ];
      
      const newMessage: StreamMessage = {
        id: Date.now().toString(),
        user: `user${Math.floor(Math.random() * 1000)}`,
        message: randomMessages[Math.floor(Math.random() * randomMessages.length)],
        timestamp: new Date(),
        isHighlighted: Math.random() > 0.8
      };
      
      setMessages(prev => [...prev.slice(-20), newMessage]); // Keep last 20 messages
    }, 5000 + Math.random() * 10000); // Random interval 5-15 seconds

    return () => clearInterval(interval);
  }, []);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      setIsMuted(newMuted);
      videoRef.current.muted = newMuted;
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const sendMessage = () => {
    if (chatMessage.trim()) {
      const newMessage: StreamMessage = {
        id: Date.now().toString(),
        user: "You",
        message: chatMessage,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, newMessage]);
      setChatMessage("");
      
      // In real implementation, send via WebSocket
      console.log("Sending chat message:", newMessage);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-3 gap-4 ${className}`}>
      {/* Video Player */}
      <div className="lg:col-span-2">
        <Card className="bg-black border-gray-700 overflow-hidden">
          <div className="relative aspect-video">
            {/* Live Stream Video */}
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              src={streamUrl}
              autoPlay
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            >
              Your browser does not support the video tag.
            </video>

            {/* Live Indicator */}
            {isLive && (
              <div className="absolute top-4 left-4 z-10">
                <Badge className="bg-red-600 text-white animate-pulse">
                  <Radio className="w-3 h-3 mr-1" />
                  LIVE
                </Badge>
              </div>
            )}

            {/* Viewer Count */}
            <div className="absolute top-4 right-4 z-10">
              <Badge variant="secondary" className="bg-black/50 text-white">
                <Users className="w-3 h-3 mr-1" />
                {viewerCount.toLocaleString()}
              </Badge>
            </div>

            {/* Stream Controls Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={togglePlayPause}
                    className="text-white hover:bg-white/20"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleMute}
                    className="text-white hover:bg-white/20"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </Button>

                  <div className="text-white text-sm font-medium">
                    {title}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onShare}
                    className="text-white hover:bg-white/20"
                  >
                    <Share className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleFullscreen}
                    className="text-white hover:bg-white/20"
                  >
                    <Maximize className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Stream Info */}
        <Card className="bg-gray-800 border-gray-700 mt-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img
                  src={creatorAvatar || "https://images.unsplash.com/photo-1494790108755-2616b5cb229e?w=40&h=40&fit=crop&crop=face"}
                  alt={creatorName}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <h2 className="text-lg font-semibold text-white">{title}</h2>
                  <p className="text-sm text-gray-400">{creatorName}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  onClick={onFollow}
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary hover:text-white"
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Follow
                </Button>

                <Button
                  onClick={onTip}
                  className="bg-gradient-to-r from-primary to-secondary hover:from-purple-600 hover:to-pink-600"
                >
                  💰 Tip
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Chat */}
      <div className="lg:col-span-1">
        <Card className="bg-gray-800 border-gray-700 h-full flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center">
              <MessageCircle className="w-5 h-5 mr-2" />
              Live Chat
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages */}
            <ScrollArea className="flex-1 px-4">
              <div className="space-y-2 pb-4">
                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`text-sm ${
                      msg.isHighlighted 
                        ? 'bg-primary/20 border border-primary/40 rounded p-2' 
                        : ''
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className={`font-semibold ${
                        msg.user === "You" ? "text-primary" : "text-gray-300"
                      }`}>
                        {msg.user}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                    <p className="text-white mt-1">{msg.message}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Chat Input */}
            <div className="p-4 border-t border-gray-700">
              <div className="flex space-x-2">
                <Input
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Say something..."
                  className="bg-gray-700 border-gray-600 text-white"
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!chatMessage.trim()}
                  className="bg-primary hover:bg-primary/80"
                >
                  Send
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}