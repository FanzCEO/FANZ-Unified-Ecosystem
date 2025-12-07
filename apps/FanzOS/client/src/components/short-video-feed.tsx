import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import ShortVideoPlayer from "./short-video-player";
import {
  Home,
  Users,
  TrendingUp,
  Hash,
  Heart,
  Search,
  Upload
} from "lucide-react";

interface ShortVideoFeedProps {
  initialFeedType?: 'for_you' | 'following' | 'trending';
  className?: string;
}

export default function ShortVideoFeed({ 
  initialFeedType = 'for_you',
  className = "" 
}: ShortVideoFeedProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [feedType, setFeedType] = useState(initialFeedType);
  const [isScrolling, setIsScrolling] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null);

  // Fetch video feed
  const { data: videos = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/short-videos/feed', feedType, selectedHashtag],
    queryFn: async () => {
      const params = new URLSearchParams({
        type: feedType,
        limit: '20'
      });
      
      if (selectedHashtag) {
        params.append('hashtag', selectedHashtag);
      }
      
      const response = await fetch(`/api/short-videos/feed?${params}`);
      return response.json();
    },
    enabled: !!user
  });

  // Fetch trending hashtags
  const { data: trendingHashtags = [] } = useQuery({
    queryKey: ['/api/short-videos/trending-hashtags'],
    queryFn: async () => {
      const response = await fetch('/api/short-videos/trending-hashtags?limit=10');
      return response.json();
    }
  });

  // Handle scroll to navigate videos
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      setIsScrolling(true);
      clearTimeout(scrollTimeout);
      
      scrollTimeout = setTimeout(() => {
        setIsScrolling(false);
        
        const scrollTop = container.scrollTop;
        const videoHeight = container.clientHeight;
        const newIndex = Math.round(scrollTop / videoHeight);
        
        if (newIndex !== currentVideoIndex && newIndex < videos.length) {
          setCurrentVideoIndex(newIndex);
        }
      }, 150);
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [currentVideoIndex, videos.length]);

  // Snap to video after scrolling
  useEffect(() => {
    if (!isScrolling && containerRef.current) {
      const container = containerRef.current;
      const targetScrollTop = currentVideoIndex * container.clientHeight;
      
      container.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth'
      });
    }
  }, [currentVideoIndex, isScrolling]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' && currentVideoIndex > 0) {
        setCurrentVideoIndex(prev => prev - 1);
        e.preventDefault();
      } else if (e.key === 'ArrowDown' && currentVideoIndex < videos.length - 1) {
        setCurrentVideoIndex(prev => prev + 1);
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentVideoIndex, videos.length]);

  // Load more videos when reaching the end
  useEffect(() => {
    if (currentVideoIndex >= videos.length - 3) {
      // Load more videos
      console.log('Loading more videos...');
    }
  }, [currentVideoIndex, videos.length]);

  const handleVideoEnd = () => {
    if (currentVideoIndex < videos.length - 1) {
      setCurrentVideoIndex(prev => prev + 1);
    }
  };

  const handleReaction = (reactionType: string) => {
    // Invalidate feed to refresh counts
    queryClient.invalidateQueries({ queryKey: ['/api/short-videos/feed'] });
  };

  const handleComment = () => {
    setShowComments(true);
  };

  const handleShare = () => {
    const currentVideo = videos[currentVideoIndex];
    if (currentVideo) {
      const shareUrl = `${window.location.origin}/short-videos/${currentVideo.id}`;
      
      if (navigator.share) {
        navigator.share({
          title: currentVideo.title || 'Check out this video!',
          text: currentVideo.description || 'Amazing content on FansLab',
          url: shareUrl
        });
      } else {
        navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Link Copied!",
          description: "Video link copied to clipboard",
        });
      }
    }
  };

  const handleFollow = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/short-videos/feed'] });
  };

  const handleFeedTypeChange = (type: string) => {
    setFeedType(type as any);
    setCurrentVideoIndex(0);
    setSelectedHashtag(null);
  };

  const handleHashtagClick = (hashtag: string) => {
    setSelectedHashtag(hashtag);
    setFeedType('for_you'); // Switch to general feed with hashtag filter
    setCurrentVideoIndex(0);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Login Required</h2>
          <p className="text-muted-foreground mb-4">
            Please login to access the video feed
          </p>
          <Button onClick={() => window.location.href = '/api/login'}>
            Login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full flex flex-col ${className}`} data-testid="short-video-feed">
      {/* Feed Type Tabs */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/50 to-transparent p-4">
        <Tabs value={feedType} onValueChange={handleFeedTypeChange}>
          <TabsList className="bg-black/30 backdrop-blur-sm">
            <TabsTrigger value="for_you" className="flex items-center space-x-2" data-testid="tab-for-you">
              <Home size={16} />
              <span>For You</span>
            </TabsTrigger>
            <TabsTrigger value="following" className="flex items-center space-x-2" data-testid="tab-following">
              <Users size={16} />
              <span>Following</span>
            </TabsTrigger>
            <TabsTrigger value="trending" className="flex items-center space-x-2" data-testid="tab-trending">
              <TrendingUp size={16} />
              <span>Trending</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Hashtag Filter */}
        {selectedHashtag && (
          <div className="mt-2 flex items-center space-x-2">
            <Hash size={16} className="text-primary" />
            <Badge variant="secondary" className="bg-primary/20 text-primary">
              {selectedHashtag}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedHashtag(null)}
              className="text-white hover:bg-white/20"
            >
              Clear
            </Button>
          </div>
        )}
      </div>

      {/* Trending Hashtags Sidebar */}
      <div className="absolute top-20 right-4 z-20 w-48 max-h-96">
        <Card className="bg-black/30 backdrop-blur-sm border-white/20">
          <div className="p-3">
            <h3 className="text-white font-semibold mb-2 flex items-center">
              <TrendingUp size={16} className="mr-2" />
              Trending
            </h3>
            <ScrollArea className="h-48">
              <div className="space-y-1">
                {trendingHashtags.map((trending: any) => (
                  <button
                    key={trending.hashtag.id}
                    onClick={() => handleHashtagClick(trending.hashtag.name)}
                    className="w-full text-left p-2 rounded hover:bg-white/10 transition-colors"
                    data-testid={`trending-hashtag-${trending.hashtag.name}`}
                  >
                    <div className="text-primary text-sm font-medium">
                      #{trending.hashtag.name}
                    </div>
                    <div className="text-gray-400 text-xs">
                      {trending.recentVideosCount} videos • {trending.growthRate.toFixed(0)}% growth
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </Card>
      </div>

      {/* Video Feed */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto snap-y snap-mandatory hide-scrollbar"
        style={{ scrollSnapType: 'y mandatory' }}
        data-testid="video-container"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-white">Loading videos...</div>
          </div>
        ) : videos.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Card className="p-8 text-center bg-black/30 backdrop-blur-sm border-white/20">
              <h3 className="text-white text-xl font-semibold mb-2">No Videos Found</h3>
              <p className="text-gray-400 mb-4">
                {feedType === 'following' 
                  ? "Follow some creators to see their content here"
                  : "Check back later for new content"
                }
              </p>
              <Button onClick={() => refetch()}>Refresh</Button>
            </Card>
          </div>
        ) : (
          videos.map((video: any, index: number) => (
            <div
              key={video.id}
              className="w-full h-full snap-start"
              style={{ minHeight: '100vh' }}
            >
              <ShortVideoPlayer
                video={video}
                isActive={index === currentVideoIndex}
                onVideoEnd={handleVideoEnd}
                onReaction={handleReaction}
                onComment={handleComment}
                onShare={handleShare}
                onFollow={handleFollow}
              />
            </div>
          ))
        )}
      </div>

      {/* Upload Button (for creators) */}
      {user?.role === 'creator' && (
        <div className="absolute bottom-6 left-6 z-20">
          <Button
            size="lg"
            className="rounded-full bg-primary hover:bg-primary/90 shadow-lg"
            onClick={() => window.location.href = '/upload-video'}
            data-testid="upload-video-button"
          >
            <Upload size={24} />
          </Button>
        </div>
      )}

      {/* Video Counter */}
      <div className="absolute bottom-6 right-6 z-20">
        <div className="bg-black/50 backdrop-blur-sm rounded-full px-3 py-1 text-white text-sm">
          {currentVideoIndex + 1} / {videos.length}
        </div>
      </div>
    </div>
  );
}