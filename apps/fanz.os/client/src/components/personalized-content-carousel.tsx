import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  ChevronLeft, 
  ChevronRight, 
  Heart, 
  MessageCircle, 
  Share, 
  Bookmark,
  Play,
  Clock,
  Star,
  TrendingUp,
  Zap,
  Eye,
  ThumbsUp,
  Gift,
  Sparkles,
  Filter,
  RefreshCw
} from "lucide-react";

interface ContentItem {
  id: string;
  type: 'post' | 'video' | 'live' | 'story' | 'poll';
  title?: string;
  description?: string;
  thumbnail?: string;
  mediaUrl?: string;
  creator: {
    id: string;
    displayName: string;
    username: string;
    avatar?: string;
    isVerified: boolean;
    tier: 'free' | 'premium' | 'vip';
  };
  stats: {
    likes: number;
    comments: number;
    views: number;
    shares: number;
  };
  engagement: {
    userLiked: boolean;
    userBookmarked: boolean;
    userSubscribed: boolean;
  };
  pricing?: {
    isFree: boolean;
    price?: number;
    isPPV: boolean;
  };
  tags: string[];
  duration?: string;
  createdAt: Date;
  recommendationScore: number;
  recommendationReason: string;
}

interface PersonalizedContentCarouselProps {
  userId: string;
  category?: string;
  limit?: number;
  showFilters?: boolean;
  autoPlay?: boolean;
  className?: string;
}

const CONTENT_CATEGORIES = [
  { id: 'for-you', label: 'For You', icon: Sparkles },
  { id: 'trending', label: 'Trending', icon: TrendingUp },
  { id: 'new', label: 'Fresh', icon: Star },
  { id: 'following', label: 'Following', icon: Heart },
  { id: 'live', label: 'Live Now', icon: Play },
  { id: 'premium', label: 'Premium', icon: Gift }
];

const RECOMMENDATION_REASONS = {
  'similar_interests': '🎯 Matches your interests',
  'trending_creator': '🔥 Trending creator',
  'high_engagement': '⚡ High engagement',
  'new_content': '✨ Fresh content',
  'recommended_friend': '👥 Friend recommended',
  'creator_you_follow': '💖 From creators you love',
  'popular_category': '📈 Popular in your area'
};

export function PersonalizedContentCarousel({
  userId,
  category = 'for-you',
  limit = 10,
  showFilters = true,
  autoPlay = false,
  className
}: PersonalizedContentCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(category);
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlay);
  const carouselRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout>();

  // Get personalized content
  const { data: contentData, isLoading, refetch } = useQuery({
    queryKey: [`/api/content/recommendations`, { userId, category: selectedCategory, limit }],
    staleTime: 300000, // 5 minutes
  });

  // Interaction mutations
  const likeMutation = useMutation({
    mutationFn: async ({ contentId, action }: { contentId: string; action: 'like' | 'unlike' }) => {
      const response = await apiRequest('POST', `/api/content/${contentId}/like`, { action });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/content/recommendations`] });
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: async ({ contentId, action }: { contentId: string; action: 'bookmark' | 'unbookmark' }) => {
      const response = await apiRequest('POST', `/api/content/${contentId}/bookmark`, { action });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/content/recommendations`] });
    },
  });

  const trackViewMutation = useMutation({
    mutationFn: async (contentId: string) => {
      await apiRequest('POST', `/api/content/${contentId}/view`);
    },
  });

  const content: ContentItem[] = contentData?.recommendations || [];

  // Auto-play functionality
  useEffect(() => {
    if (isAutoPlaying && content.length > 1) {
      autoPlayRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % content.length);
      }, 5000);
    } else {
      clearInterval(autoPlayRef.current);
    }

    return () => clearInterval(autoPlayRef.current);
  }, [isAutoPlaying, content.length]);

  // Track views when content changes
  useEffect(() => {
    if (content[currentIndex]?.id) {
      trackViewMutation.mutate(content[currentIndex].id);
    }
  }, [currentIndex, content]);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % content.length);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + content.length) % content.length);
  };

  const handleLike = (contentId: string, isLiked: boolean) => {
    likeMutation.mutate({ 
      contentId, 
      action: isLiked ? 'unlike' : 'like' 
    });
  };

  const handleBookmark = (contentId: string, isBookmarked: boolean) => {
    bookmarkMutation.mutate({ 
      contentId, 
      action: isBookmarked ? 'unbookmark' : 'bookmark' 
    });
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return Play;
      case 'live': return Play;
      case 'story': return Eye;
      case 'poll': return ThumbsUp;
      default: return Heart;
    }
  };

  const formatStats = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex justify-between items-center">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="aspect-video bg-gray-200 rounded-t-lg" />
              <CardContent className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!content.length) {
    return (
      <Card className={cn("text-center py-8", className)}>
        <CardContent>
          <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No recommendations yet</h3>
          <p className="text-muted-foreground">
            Start engaging with content to get personalized recommendations!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with filters */}
      {showFilters && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-wrap gap-2">
            {CONTENT_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "transition-all duration-200",
                    selectedCategory === cat.id && "bg-gradient-to-r from-purple-500 to-pink-500"
                  )}
                  data-testid={`category-${cat.id}`}
                >
                  <Icon className="mr-2 h-3 w-3" />
                  {cat.label}
                </Button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              data-testid="refresh-content"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className={isAutoPlaying ? "bg-purple-100" : ""}
              data-testid="toggle-autoplay"
            >
              <Play className={cn("h-4 w-4", isAutoPlaying && "text-purple-600")} />
            </Button>
          </div>
        </div>
      )}

      {/* Main Content Carousel */}
      <div className="relative">
        <div 
          ref={carouselRef}
          className="overflow-hidden rounded-lg"
        >
          <div 
            className="flex transition-transform duration-500 ease-in-out"
            style={{ 
              transform: `translateX(-${currentIndex * 100}%)`,
              width: `${content.length * 100}%`
            }}
          >
            {content.map((item, index) => {
              const ContentIcon = getContentTypeIcon(item.type);
              
              return (
                <div key={item.id} className="w-full flex-shrink-0 px-2">
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                    {/* Media Section */}
                    <div className="relative aspect-video bg-gradient-to-br from-purple-100 to-pink-100">
                      {item.thumbnail ? (
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ContentIcon className="h-16 w-16 text-purple-400" />
                        </div>
                      )}
                      
                      {/* Overlay content */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      
                      {/* Content type badge */}
                      <Badge className="absolute top-2 left-2 bg-black/70 text-white">
                        <ContentIcon className="mr-1 h-3 w-3" />
                        {item.type}
                      </Badge>

                      {/* Duration for videos */}
                      {item.duration && (
                        <Badge className="absolute top-2 right-2 bg-black/70 text-white">
                          <Clock className="mr-1 h-3 w-3" />
                          {item.duration}
                        </Badge>
                      )}

                      {/* Pricing info */}
                      {item.pricing && !item.pricing.isFree && (
                        <Badge className="absolute bottom-2 right-2 bg-yellow-500 text-black">
                          <Gift className="mr-1 h-3 w-3" />
                          ${item.pricing.price}
                        </Badge>
                      )}

                      {/* Creator tier indicator */}
                      <div className="absolute bottom-2 left-2">
                        <Badge 
                          className={cn(
                            "text-xs",
                            item.creator.tier === 'vip' && "bg-purple-600",
                            item.creator.tier === 'premium' && "bg-yellow-600",
                            item.creator.tier === 'free' && "bg-gray-600"
                          )}
                        >
                          {item.creator.tier.toUpperCase()}
                        </Badge>
                      </div>
                    </div>

                    {/* Content Info */}
                    <CardContent className="p-4 space-y-3">
                      {/* Creator info */}
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={item.creator.avatar} />
                          <AvatarFallback>
                            {item.creator.displayName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <p className="font-medium text-sm truncate">
                              {item.creator.displayName}
                            </p>
                            {item.creator.isVerified && (
                              <Star className="h-3 w-3 text-blue-500" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            @{item.creator.username}
                          </p>
                        </div>
                      </div>

                      {/* Content title and description */}
                      {item.title && (
                        <h3 className="font-medium text-sm line-clamp-2">
                          {item.title}
                        </h3>
                      )}
                      
                      {item.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {item.description}
                        </p>
                      )}

                      {/* Recommendation reason */}
                      <div className="flex items-center gap-1 text-xs text-purple-600">
                        <Zap className="h-3 w-3" />
                        {RECOMMENDATION_REASONS[item.recommendationReason as keyof typeof RECOMMENDATION_REASONS] || 'Recommended for you'}
                      </div>

                      {/* Tags */}
                      {item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                          {item.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{item.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      <Separator />

                      {/* Stats and actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {formatStats(item.stats.views)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {formatStats(item.stats.likes)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            {formatStats(item.stats.comments)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleLike(item.id, item.engagement.userLiked)}
                            className={cn(
                              "h-8 w-8 p-0",
                              item.engagement.userLiked && "text-red-500"
                            )}
                            data-testid={`like-${item.id}`}
                          >
                            <Heart className={cn(
                              "h-4 w-4",
                              item.engagement.userLiked && "fill-current"
                            )} />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleBookmark(item.id, item.engagement.userBookmarked)}
                            className={cn(
                              "h-8 w-8 p-0",
                              item.engagement.userBookmarked && "text-yellow-500"
                            )}
                            data-testid={`bookmark-${item.id}`}
                          >
                            <Bookmark className={cn(
                              "h-4 w-4",
                              item.engagement.userBookmarked && "fill-current"
                            )} />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            data-testid={`share-${item.id}`}
                          >
                            <Share className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation arrows */}
        {content.length > 1 && (
          <>
            <Button
              variant="outline"
              size="sm"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 p-0 bg-white/90 hover:bg-white"
              onClick={goToPrev}
              data-testid="carousel-prev"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 p-0 bg-white/90 hover:bg-white"
              onClick={goToNext}
              data-testid="carousel-next"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Dots indicator */}
        {content.length > 1 && (
          <div className="flex justify-center gap-1 mt-4">
            {content.map((_, index) => (
              <button
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-200",
                  index === currentIndex 
                    ? "bg-purple-500 w-6" 
                    : "bg-gray-300 hover:bg-gray-400"
                )}
                onClick={() => setCurrentIndex(index)}
                data-testid={`dot-${index}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}