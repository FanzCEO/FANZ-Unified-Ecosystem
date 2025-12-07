import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Play,
  Heart,
  MessageCircle,
  Share2,
  DollarSign,
  Eye,
  Clock,
  TrendingUp,
  Filter,
  Search,
  Star,
  Lock,
  Unlock,
  Volume2,
  VolumeX,
  Maximize2,
  SkipForward,
  Bookmark,
  Download,
  ThumbsUp,
  Gift,
  Sparkles,
  Flame,
  Crown,
  CheckCircle
} from "lucide-react";
import { Link } from "wouter";

interface Video {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  creatorVerified: boolean;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  previewUrl?: string;
  duration: number;
  views: number;
  likes: number;
  comments: number;
  price: number;
  isPaid: boolean;
  isUnlocked: boolean;
  category: string;
  tags: string[];
  uploadedAt: string;
  rating: number;
  isLive?: boolean;
  scheduledAt?: string;
  clips?: {
    id: string;
    timestamp: number;
    title: string;
  }[];
}

interface VideoHubProps {
  featured?: boolean;
  category?: string;
  creatorId?: string;
  maxItems?: number;
}

export default function VideoHub({ featured = false, category, creatorId, maxItems }: VideoHubProps) {
  const { user } = useAuth() as { user: User | undefined };
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [hoveredVideo, setHoveredVideo] = useState<string | null>(null);
  const [autoPlay, setAutoPlay] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("trending");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterPrice, setFilterPrice] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [playbackQueue, setPlaybackQueue] = useState<Video[]>([]);
  const [currentQueueIndex, setCurrentQueueIndex] = useState(0);
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});

  // Fetch videos
  const { data: videos, isLoading } = useQuery<Video[]>({
    queryKey: ["/api/videos", category, creatorId, sortBy, filterCategory, filterPrice],
  });

  // Mock data for demonstration
  const mockVideos: Video[] = videos || [
    {
      id: "1",
      creatorId: "creator1",
      creatorName: "Emma Rose",
      creatorAvatar: "https://images.unsplash.com/photo-1494790108344-b2ee30e40a34?w=100&h=100&fit=crop&crop=face",
      creatorVerified: true,
      title: "Exclusive Behind The Scenes",
      description: "Get an intimate look at my latest photoshoot with exclusive content you won't find anywhere else.",
      thumbnailUrl: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=600&fit=crop",
      videoUrl: "#",
      previewUrl: "#",
      duration: 1234,
      views: 45678,
      likes: 3456,
      comments: 234,
      price: 0,
      isPaid: false,
      isUnlocked: true,
      category: "behind-scenes",
      tags: ["exclusive", "photoshoot", "bts"],
      uploadedAt: "2024-01-20T10:00:00Z",
      rating: 4.8,
      clips: [
        { id: "clip1", timestamp: 120, title: "Best moment" },
        { id: "clip2", timestamp: 456, title: "Fanz favorite" }
      ]
    },
    {
      id: "2",
      creatorId: "creator2",
      creatorName: "Sophia Luna",
      creatorAvatar: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=100&h=100&fit=crop&crop=face",
      creatorVerified: true,
      title: "Premium Dance Performance",
      description: "My latest dance video with special choreography just for my fanz. Unlock to watch the full performance!",
      thumbnailUrl: "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=400&h=600&fit=crop",
      videoUrl: "#",
      duration: 890,
      views: 67890,
      likes: 5678,
      comments: 456,
      price: 9.99,
      isPaid: true,
      isUnlocked: false,
      category: "performance",
      tags: ["dance", "premium", "exclusive"],
      uploadedAt: "2024-01-19T15:30:00Z",
      rating: 4.9,
      isLive: false
    },
    {
      id: "3",
      creatorId: "creator3",
      creatorName: "Isabella Star",
      creatorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
      creatorVerified: false,
      title: "Live Stream Tonight!",
      description: "Join me for an interactive live stream where anything can happen! Tips control the show.",
      thumbnailUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=600&fit=crop",
      videoUrl: "#",
      duration: 0,
      views: 12345,
      likes: 2345,
      comments: 567,
      price: 4.99,
      isPaid: true,
      isUnlocked: false,
      category: "livestream",
      tags: ["live", "interactive", "tips"],
      uploadedAt: "2024-01-21T20:00:00Z",
      rating: 4.7,
      isLive: true,
      scheduledAt: "2024-01-21T22:00:00Z"
    },
    {
      id: "4",
      creatorId: "creator1",
      creatorName: "Emma Rose",
      creatorAvatar: "https://images.unsplash.com/photo-1494790108344-b2ee30e40a34?w=100&h=100&fit=crop&crop=face",
      creatorVerified: true,
      title: "Q&A Session with Fanz",
      description: "Answering all your questions in this intimate Q&A session. Get to know the real me!",
      thumbnailUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=600&fit=crop",
      videoUrl: "#",
      duration: 2345,
      views: 34567,
      likes: 4567,
      comments: 789,
      price: 0,
      isPaid: false,
      isUnlocked: true,
      category: "q&a",
      tags: ["q&a", "personal", "intimate"],
      uploadedAt: "2024-01-18T12:00:00Z",
      rating: 4.6
    }
  ];

  // Handle video hover preview
  const handleVideoHover = (videoId: string) => {
    setHoveredVideo(videoId);
    previewTimeoutRef.current = setTimeout(() => {
      const video = videoRefs.current[videoId];
      if (video && hoveredVideo === videoId) {
        video.play().catch(() => {});
      }
    }, 500);
  };

  const handleVideoLeave = (videoId: string) => {
    setHoveredVideo(null);
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
    }
    const video = videoRefs.current[videoId];
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
  };

  // Like video mutation
  const likeVideoMutation = useMutation({
    mutationFn: async (videoId: string) => {
      const response = await apiRequest("POST", `/api/videos/${videoId}/like`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      toast({
        title: "Video liked",
        description: "Added to your liked videos",
      });
    },
  });

  // Unlock video mutation
  const unlockVideoMutation = useMutation({
    mutationFn: async (videoId: string) => {
      const response = await apiRequest("POST", `/api/videos/${videoId}/unlock`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      toast({
        title: "Video unlocked",
        description: "You can now watch this video",
      });
    },
  });

  // Create clip mutation
  const createClipMutation = useMutation({
    mutationFn: async ({ videoId, timestamp, title }: { videoId: string; timestamp: number; title: string }) => {
      const response = await apiRequest("POST", `/api/videos/${videoId}/clips`, { timestamp, title });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Clip created",
        description: "Your clip has been saved",
      });
    },
  });

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  const filteredVideos = mockVideos
    .filter(video => {
      if (searchQuery && !video.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterCategory !== "all" && video.category !== filterCategory) return false;
      if (filterPrice === "free" && video.isPaid) return false;
      if (filterPrice === "paid" && !video.isPaid) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest": return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
        case "popular": return b.views - a.views;
        case "trending": return (b.likes + b.comments) - (a.likes + a.comments);
        case "rating": return b.rating - a.rating;
        default: return 0;
      }
    })
    .slice(0, maxItems);

  const handlePlayVideo = (video: Video) => {
    if (video.isPaid && !video.isUnlocked) {
      // Show unlock dialog
      return;
    }
    setSelectedVideo(video);
    setShowVideoPlayer(true);
    setPlaybackQueue(filteredVideos.filter(v => v.id !== video.id));
    setCurrentQueueIndex(0);
  };

  const handleNextVideo = () => {
    if (currentQueueIndex < playbackQueue.length - 1) {
      const nextVideo = playbackQueue[currentQueueIndex + 1];
      setSelectedVideo(nextVideo);
      setCurrentQueueIndex(currentQueueIndex + 1);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <Play className="w-6 h-6 mr-2 text-primary" />
            {featured ? "Featured Videos" : "Video Hub"}
          </h2>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("grid")}
              className={viewMode === "grid" ? "bg-gray-700" : ""}
            >
              Grid
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("list")}
              className={viewMode === "list" ? "bg-gray-700" : ""}
            >
              List
            </Button>
          </div>
        </div>

        {/* Search & Filters */}
        {!featured && (
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px] max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search videos..."
                  className="pl-10 bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px] bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="trending">Trending</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="popular">Most Viewed</SelectItem>
                <SelectItem value="rating">Top Rated</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[150px] bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="behind-scenes">Behind Scenes</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
                <SelectItem value="livestream">Live Stream</SelectItem>
                <SelectItem value="q&a">Q&A</SelectItem>
                <SelectItem value="tutorial">Tutorial</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPrice} onValueChange={setFilterPrice}>
              <SelectTrigger className="w-[120px] bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="paid">Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Video Grid/List */}
      <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-4"}>
        {filteredVideos.map((video) => (
          <Card
            key={video.id}
            className={`bg-gray-800 border-gray-700 overflow-hidden cursor-pointer transition-all hover:scale-105 hover:shadow-xl ${
              viewMode === "list" ? "flex" : ""
            }`}
            onMouseEnter={() => handleVideoHover(video.id)}
            onMouseLeave={() => handleVideoLeave(video.id)}
            onClick={() => handlePlayVideo(video)}
          >
            <div className={`relative ${viewMode === "list" ? "w-48" : ""}`}>
              <div className="aspect-[9/16] relative overflow-hidden bg-gray-900">
                {/* Thumbnail */}
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-full h-full object-cover"
                  style={{ display: hoveredVideo === video.id ? 'none' : 'block' }}
                />
                
                {/* Preview Video */}
                {video.previewUrl && (
                  <video
                    ref={(el) => { videoRefs.current[video.id] = el; }}
                    src={video.previewUrl}
                    className="w-full h-full object-cover"
                    style={{ display: hoveredVideo === video.id ? 'block' : 'none' }}
                    muted
                    loop
                  />
                )}

                {/* Overlays */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70" />
                
                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                  {video.isLive && (
                    <Badge className="bg-red-600 text-white">
                      <span className="animate-pulse mr-1">●</span> LIVE
                    </Badge>
                  )}
                  {video.isPaid && !video.isUnlocked && (
                    <Badge className="bg-yellow-600 text-white">
                      <Lock className="w-3 h-3 mr-1" />
                      ${video.price}
                    </Badge>
                  )}
                  {video.creatorVerified && (
                    <Badge className="bg-blue-600 text-white">
                      <CheckCircle className="w-3 h-3" />
                    </Badge>
                  )}
                </div>

                {/* Duration */}
                {!video.isLive && (
                  <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs text-white">
                    {formatDuration(video.duration)}
                  </div>
                )}

                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                    <Play className="w-8 h-8 text-white fill-white" />
                  </div>
                </div>
              </div>
            </div>

            <CardContent className={`p-4 ${viewMode === "list" ? "flex-1" : ""}`}>
              {/* Creator Info */}
              <div className="flex items-center gap-2 mb-2">
                <Link href={`/creator/${video.creatorName.toLowerCase().replace(' ', '')}`}>
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={video.creatorAvatar} alt={video.creatorName} />
                    <AvatarFallback>{video.creatorName[0]}</AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-400 truncate">{video.creatorName}</p>
                </div>
              </div>

              {/* Title & Description */}
              <h3 className="font-semibold text-white mb-1 line-clamp-2">{video.title}</h3>
              {viewMode === "list" && (
                <p className="text-sm text-gray-400 mb-2 line-clamp-2">{video.description}</p>
              )}

              {/* Stats */}
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {formatViews(video.views)}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="w-3 h-3" />
                  {formatViews(video.likes)}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" />
                  {video.comments}
                </span>
                {video.rating > 0 && (
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                    {video.rating.toFixed(1)}
                  </span>
                )}
              </div>

              {/* Actions */}
              {viewMode === "list" && (
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      likeVideoMutation.mutate(video.id);
                    }}
                    className="text-gray-400 hover:text-white"
                  >
                    <ThumbsUp className="w-4 h-4 mr-1" />
                    Like
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-gray-400 hover:text-white"
                  >
                    <Share2 className="w-4 h-4 mr-1" />
                    Share
                  </Button>
                  {video.isPaid && !video.isUnlocked && (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        unlockVideoMutation.mutate(video.id);
                      }}
                      className="bg-gradient-to-r from-primary to-secondary hover:from-purple-600 hover:to-pink-600"
                    >
                      <Unlock className="w-4 h-4 mr-1" />
                      Unlock
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Video Player Dialog */}
      <Dialog open={showVideoPlayer} onOpenChange={setShowVideoPlayer}>
        <DialogContent className="max-w-4xl bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">{selectedVideo?.title}</DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedVideo?.description}
            </DialogDescription>
          </DialogHeader>
          
          {selectedVideo && (
            <div className="space-y-4">
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  src={selectedVideo.videoUrl}
                  controls
                  autoPlay={autoPlay}
                  className="w-full h-full"
                />
              </div>

              {/* Player Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => likeVideoMutation.mutate(selectedVideo.id)}
                    className="text-gray-400 hover:text-white"
                  >
                    <Heart className="w-4 h-4 mr-1" />
                    {formatViews(selectedVideo.likes)}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-gray-400 hover:text-white"
                  >
                    <MessageCircle className="w-4 h-4 mr-1" />
                    {selectedVideo.comments}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-gray-400 hover:text-white"
                  >
                    <Share2 className="w-4 h-4 mr-1" />
                    Share
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-gray-400 hover:text-white"
                  >
                    <Bookmark className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                </div>
                {playbackQueue.length > 0 && (
                  <Button
                    size="sm"
                    onClick={handleNextVideo}
                    className="bg-gray-800 hover:bg-gray-700"
                  >
                    <SkipForward className="w-4 h-4 mr-1" />
                    Next
                  </Button>
                )}
              </div>

              {/* Clips */}
              {selectedVideo.clips && selectedVideo.clips.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-white mb-2">Clips</h4>
                  <div className="flex gap-2">
                    {selectedVideo.clips.map((clip) => (
                      <Button
                        key={clip.id}
                        size="sm"
                        variant="outline"
                        className="border-gray-700 text-gray-300 hover:bg-gray-800"
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        {clip.title}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}