import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Music,
  Play,
  Pause,
  Volume2,
  VolumeX,
  MoreHorizontal,
  User,
  Plus
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ShortVideoPlayerProps {
  video: {
    id: string;
    videoUrl: string;
    thumbnailUrl?: string;
    title?: string;
    description?: string;
    duration: number;
    creator: {
      id: string;
      username: string;
      displayName: string;
      profileImageUrl: string;
      isVerified: boolean;
    };
    hashtags: { id: string; name: string }[];
    likesCount: number;
    commentsCount: number;
    sharesCount: number;
    isLiked: boolean;
    isFollowing: boolean;
    userReaction?: string;
  };
  isActive: boolean;
  onVideoEnd?: () => void;
  onReaction?: (reactionType: string) => void;
  onComment?: () => void;
  onShare?: () => void;
  onFollow?: () => void;
  className?: string;
}

export default function ShortVideoPlayer({
  video,
  isActive,
  onVideoEnd,
  onReaction,
  onComment,
  onShare,
  onFollow,
  className = ""
}: ShortVideoPlayerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [isLiked, setIsLiked] = useState(video.isLiked);
  const [likesCount, setLikesCount] = useState(video.likesCount);
  const [isFollowing, setIsFollowing] = useState(video.isFollowing);

  // Auto play when video becomes active
  useEffect(() => {
    if (videoRef.current && isActive) {
      videoRef.current.play().catch(() => {
        // Auto-play failed, user interaction required
      });
      setIsPlaying(true);
    } else if (videoRef.current && !isActive) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isActive]);

  // Track video progress
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      const currentTime = video.currentTime;
      const duration = video.duration;
      const progressPercent = (currentTime / duration) * 100;
      
      setCurrentTime(currentTime);
      setProgress(progressPercent);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(100);
      onVideoEnd?.();
    };

    video.addEventListener('timeupdate', updateProgress);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', updateProgress);
      video.removeEventListener('ended', handleEnded);
    };
  }, [onVideoEnd]);

  // Track view
  const trackViewMutation = useMutation({
    mutationFn: async (watchTime: number) => {
      await apiRequest("POST", "/api/short-videos/track-view", {
        videoId: video.id,
        watchTime,
        deviceInfo: {
          type: 'mobile', // Could detect actual device
          userAgent: navigator.userAgent
        }
      });
    }
  });

  // React to video
  const reactionMutation = useMutation({
    mutationFn: async (reactionType: string) => {
      await apiRequest("POST", "/api/short-videos/react", {
        videoId: video.id,
        reactionType
      });
    },
    onSuccess: (_, reactionType) => {
      if (reactionType === 'like') {
        setIsLiked(!isLiked);
        setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
      }
      onReaction?.(reactionType);
      
      toast({
        title: "Reaction sent! 🔥",
        description: `You reacted with ${reactionType}`,
      });
    }
  });

  // Follow creator
  const followMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/follow", {
        creatorId: video.creator.id
      });
    },
    onSuccess: () => {
      setIsFollowing(!isFollowing);
      onFollow?.();
      
      toast({
        title: isFollowing ? "Unfollowed" : "Following!",
        description: isFollowing 
          ? `You unfollowed ${video.creator.displayName}` 
          : `You're now following ${video.creator.displayName}`,
      });
    }
  });

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVideoClick = () => {
    handlePlayPause();
    setShowControls(true);
    setTimeout(() => setShowControls(false), 2000);
  };

  const handleReaction = (reactionType: string) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to react to videos",
        variant: "destructive"
      });
      return;
    }
    reactionMutation.mutate(reactionType);
  };

  const handleFollow = () => {
    if (!user) {
      toast({
        title: "Login Required", 
        description: "Please login to follow creators",
        variant: "destructive"
      });
      return;
    }
    followMutation.mutate();
  };

  // Extract hashtags from description
  const renderDescription = () => {
    if (!video.description) return null;
    
    const parts = video.description.split(/(#\w+)/g);
    return (
      <p className="text-white text-sm leading-relaxed">
        {parts.map((part, index) => 
          part.startsWith('#') ? (
            <span key={index} className="text-primary font-semibold">
              {part}
            </span>
          ) : (
            <span key={index}>{part}</span>
          )
        )}
      </p>
    );
  };

  // Track view when video starts playing
  useEffect(() => {
    if (isPlaying && currentTime > 3) {
      trackViewMutation.mutate(currentTime);
    }
  }, [currentTime]);

  return (
    <div className={`relative w-full h-full bg-black ${className}`} data-testid={`short-video-${video.id}`}>
      {/* Video Element */}
      <video
        ref={videoRef}
        src={video.videoUrl}
        poster={video.thumbnailUrl}
        className="w-full h-full object-cover"
        muted={isMuted}
        loop
        playsInline
        onClick={handleVideoClick}
        data-testid="video-element"
      />

      {/* Progress Bar */}
      <div 
        ref={progressRef}
        className="absolute bottom-0 left-0 w-full h-1 bg-gray-600 bg-opacity-30"
        data-testid="video-progress"
      >
        <div 
          className="h-full bg-white transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Play/Pause Overlay */}
      {showControls && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 transition-opacity duration-300">
          <Button
            variant="ghost"
            size="lg"
            onClick={handlePlayPause}
            className="text-white hover:bg-white hover:bg-opacity-20"
            data-testid="play-pause-button"
          >
            {isPlaying ? <Pause size={48} /> : <Play size={48} />}
          </Button>
        </div>
      )}

      {/* Video Information Overlay */}
      <div className="absolute inset-0 flex">
        {/* Left Side - Video Info */}
        <div className="flex-1 flex flex-col justify-end p-4 text-white">
          <div className="space-y-3">
            {/* Creator Info */}
            <div className="flex items-center space-x-3">
              <Avatar className="w-12 h-12 border-2 border-white" data-testid={`creator-avatar-${video.creator.id}`}>
                <AvatarImage src={video.creator.profileImageUrl} />
                <AvatarFallback>
                  <User size={20} />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold" data-testid="creator-name">
                    @{video.creator.username}
                  </span>
                  {video.creator.isVerified && (
                    <span className="text-blue-400">✓</span>
                  )}
                </div>
                <p className="text-gray-300 text-sm">{video.creator.displayName}</p>
              </div>
              {!isFollowing && (
                <Button
                  size="sm"
                  onClick={handleFollow}
                  disabled={followMutation.isPending}
                  className="bg-primary hover:bg-primary/90"
                  data-testid="follow-button"
                >
                  <Plus size={16} className="mr-1" />
                  Follow
                </Button>
              )}
            </div>

            {/* Video Title */}
            {video.title && (
              <h3 className="font-semibold text-lg" data-testid="video-title">
                {video.title}
              </h3>
            )}

            {/* Description */}
            {renderDescription()}

            {/* Music/Audio Info */}
            <div className="flex items-center space-x-2 text-sm text-gray-300">
              <Music size={16} />
              <span>Original Audio</span>
            </div>
          </div>
        </div>

        {/* Right Side - Action Buttons */}
        <div className="flex flex-col justify-end p-4 space-y-6">
          {/* Like Button */}
          <div className="flex flex-col items-center space-y-1">
            <Button
              variant="ghost"
              size="lg"
              onClick={() => handleReaction('like')}
              disabled={reactionMutation.isPending}
              className={`p-3 rounded-full ${isLiked ? 'text-red-500 bg-red-500/20' : 'text-white hover:bg-white/20'}`}
              data-testid="like-button"
            >
              <Heart size={28} fill={isLiked ? 'currentColor' : 'none'} />
            </Button>
            <span className="text-white text-xs font-semibold" data-testid="likes-count">
              {likesCount > 1000 ? `${(likesCount / 1000).toFixed(1)}K` : likesCount}
            </span>
          </div>

          {/* Comment Button */}
          <div className="flex flex-col items-center space-y-1">
            <Button
              variant="ghost"
              size="lg"
              onClick={onComment}
              className="text-white hover:bg-white/20 p-3 rounded-full"
              data-testid="comment-button"
            >
              <MessageCircle size={28} />
            </Button>
            <span className="text-white text-xs font-semibold" data-testid="comments-count">
              {video.commentsCount > 1000 ? `${(video.commentsCount / 1000).toFixed(1)}K` : video.commentsCount}
            </span>
          </div>

          {/* Share Button */}
          <div className="flex flex-col items-center space-y-1">
            <Button
              variant="ghost"
              size="lg"
              onClick={onShare}
              className="text-white hover:bg-white/20 p-3 rounded-full"
              data-testid="share-button"
            >
              <Share2 size={28} />
            </Button>
            <span className="text-white text-xs font-semibold" data-testid="shares-count">
              {video.sharesCount > 1000 ? `${(video.sharesCount / 1000).toFixed(1)}K` : video.sharesCount}
            </span>
          </div>

          {/* Mute Button */}
          <div className="flex flex-col items-center">
            <Button
              variant="ghost"
              size="lg"
              onClick={handleMute}
              className="text-white hover:bg-white/20 p-3 rounded-full"
              data-testid="mute-button"
            >
              {isMuted ? <VolumeX size={28} /> : <Volume2 size={28} />}
            </Button>
          </div>

          {/* More Options */}
          <div className="flex flex-col items-center">
            <Button
              variant="ghost"
              size="lg"
              className="text-white hover:bg-white/20 p-3 rounded-full"
              data-testid="more-options-button"
            >
              <MoreHorizontal size={28} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}