import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Mic,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Heart,
  MessageCircle,
  Download,
  Share2,
  Clock,
  Calendar,
  TrendingUp,
  Search,
  Filter,
  Star,
  Users,
  Headphones,
  Radio,
  Bookmark,
  Upload,
  Music
} from "lucide-react";
import { Link } from "wouter";

interface Podcast {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  coverUrl: string;
  audioUrl: string;
  duration: number;
  publishedAt: string;
  category: string;
  tags: string[];
  plays: number;
  likes: number;
  comments: number;
  isPremium: boolean;
  price?: number;
  isPlaying?: boolean;
  currentTime?: number;
}

interface PodcastShow {
  id: string;
  title: string;
  description: string;
  creatorName: string;
  creatorAvatar: string;
  coverUrl: string;
  episodeCount: number;
  subscriberCount: number;
  category: string;
  totalPlays: number;
  isSubscribed: boolean;
}

export default function PodcastPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [currentPodcast, setCurrentPodcast] = useState<Podcast | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(75);

  const { data: featuredPodcasts } = useQuery({
    queryKey: ["/api/podcasts/featured"],
    retry: false,
  });

  const { data: podcastShows } = useQuery({
    queryKey: ["/api/podcasts/shows"],
    retry: false,
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["/api/messages/unread/count"],
    retry: false,
  });

  // Mock data
  const mockPodcasts: Podcast[] = featuredPodcasts || [
    {
      id: "1",
      title: "Behind the Scenes: Creating Content",
      description: "Join me as I share the real story behind building my content empire, from struggles to success.",
      creatorId: "creator1",
      creatorName: "Emma Rose",
      creatorAvatar: "https://images.unsplash.com/photo-1494790108344-b2ee30e40a34?w=100&h=100&fit=crop&crop=face",
      coverUrl: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&h=400&fit=crop",
      audioUrl: "#",
      duration: 3420, // 57 minutes
      publishedAt: "2024-01-20T10:00:00Z",
      category: "business",
      tags: ["entrepreneurship", "content creation", "success"],
      plays: 15420,
      likes: 1245,
      comments: 89,
      isPremium: false
    },
    {
      id: "2", 
      title: "Intimate Conversations: Life After Fame",
      description: "A deep dive into mental health, relationships, and finding balance in the spotlight.",
      creatorId: "creator2",
      creatorName: "Sophia Luna",
      creatorAvatar: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=100&h=100&fit=crop&crop=face",
      coverUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
      audioUrl: "#",
      duration: 2940, // 49 minutes
      publishedAt: "2024-01-19T15:30:00Z",
      category: "lifestyle",
      tags: ["mental health", "relationships", "personal growth"],
      plays: 8730,
      likes: 934,
      comments: 156,
      isPremium: true,
      price: 4.99
    },
    {
      id: "3",
      title: "Fitness Journey: Transformation Stories",
      description: "Real talk about body image, fitness struggles, and the journey to self-love.",
      creatorId: "creator3",
      creatorName: "Isabella Star",
      creatorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
      coverUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop",
      audioUrl: "#",
      duration: 4200, // 70 minutes
      publishedAt: "2024-01-18T08:00:00Z",
      category: "health",
      tags: ["fitness", "transformation", "motivation"],
      plays: 12350,
      likes: 1678,
      comments: 203,
      isPremium: false
    }
  ];

  const mockShows: PodcastShow[] = podcastShows || [
    {
      id: "show1",
      title: "Emma's Empire",
      description: "Weekly insights into building a content business, entrepreneurship tips, and exclusive interviews.",
      creatorName: "Emma Rose",
      creatorAvatar: "https://images.unsplash.com/photo-1494790108344-b2ee30e40a34?w=100&h=100&fit=crop&crop=face",
      coverUrl: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&h=400&fit=crop",
      episodeCount: 24,
      subscriberCount: 8950,
      category: "business",
      totalPlays: 245000,
      isSubscribed: false
    },
    {
      id: "show2",
      title: "Sophia's Sanctuary",
      description: "A safe space for deep conversations about life, love, and everything in between.",
      creatorName: "Sophia Luna", 
      creatorAvatar: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=100&h=100&fit=crop&crop=face",
      coverUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
      episodeCount: 18,
      subscriberCount: 6720,
      category: "lifestyle",
      totalPlays: 189000,
      isSubscribed: true
    }
  ];

  const categories = [
    { id: "all", name: "All", count: 156 },
    { id: "business", name: "Business", count: 42 },
    { id: "lifestyle", name: "Lifestyle", count: 38 },
    { id: "health", name: "Health & Fitness", count: 29 },
    { id: "relationships", name: "Relationships", count: 24 },
    { id: "entertainment", name: "Entertainment", count: 23 }
  ];

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handlePlayPodcast = (podcast: Podcast) => {
    if (currentPodcast?.id === podcast.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentPodcast(podcast);
      setIsPlaying(true);
      setCurrentTime(0);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Navigation unreadCount={unreadCount} />
      
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center">
              <Mic className="w-8 h-8 mr-3 text-primary" />
              FanzCast
            </h1>
            <p className="text-gray-400">Discover exclusive podcasts and audio content</p>
          </div>
          
          {user?.role === 'creator' && (
            <Link href="/creator-dashboard">
              <Button className="bg-gradient-to-r from-primary to-secondary hover:from-purple-600 hover:to-pink-600">
                <Upload className="w-4 h-4 mr-2" />
                Upload Podcast
              </Button>
            </Link>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search podcasts, shows, creators..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-gray-800 border-gray-700 pl-12 py-3 text-white placeholder-gray-400 text-lg"
            data-testid="input-podcast-search"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="episodes" className="space-y-6">
              <TabsList className="bg-gray-800 border border-gray-700 p-1">
                <TabsTrigger value="episodes" className="flex items-center" data-testid="tab-episodes">
                  <Headphones className="w-4 h-4 mr-2" />
                  Episodes
                </TabsTrigger>
                <TabsTrigger value="shows" className="flex items-center" data-testid="tab-shows">
                  <Radio className="w-4 h-4 mr-2" />
                  Shows
                </TabsTrigger>
                <TabsTrigger value="trending" className="flex items-center" data-testid="tab-trending">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Trending
                </TabsTrigger>
              </TabsList>

              <TabsContent value="episodes" className="space-y-6">
                <div className="grid gap-6">
                  {mockPodcasts.map((podcast) => (
                    <Card key={podcast.id} className="bg-gray-800 border-gray-700">
                      <CardContent className="p-6">
                        <div className="flex space-x-4">
                          <div className="relative flex-shrink-0">
                            <img
                              src={podcast.coverUrl}
                              alt={podcast.title}
                              className="w-24 h-24 rounded-lg object-cover"
                            />
                            <button
                              onClick={() => handlePlayPodcast(podcast)}
                              className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg opacity-0 hover:opacity-100 transition-opacity"
                              data-testid={`play-podcast-${podcast.id}`}
                            >
                              {currentPodcast?.id === podcast.id && isPlaying ? (
                                <Pause className="w-8 h-8 text-white" />
                              ) : (
                                <Play className="w-8 h-8 text-white" />
                              )}
                            </button>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="text-lg font-semibold text-white mb-1">{podcast.title}</h3>
                                <div className="flex items-center space-x-2 text-sm text-gray-400 mb-2">
                                  <Avatar className="w-6 h-6">
                                    <AvatarImage src={podcast.creatorAvatar} alt={podcast.creatorName} />
                                    <AvatarFallback>{podcast.creatorName[0]}</AvatarFallback>
                                  </Avatar>
                                  <span>{podcast.creatorName}</span>
                                  <span>•</span>
                                  <span>{formatDuration(podcast.duration)}</span>
                                  <span>•</span>
                                  <span>{new Date(podcast.publishedAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                              
                              {podcast.isPremium && (
                                <Badge className="bg-yellow-600 text-white">
                                  Premium ${podcast.price}
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-gray-300 mb-3 line-clamp-2">{podcast.description}</p>
                            
                            <div className="flex items-center space-x-4 text-sm text-gray-400">
                              <span className="flex items-center">
                                <Headphones className="w-4 h-4 mr-1" />
                                {podcast.plays.toLocaleString()} plays
                              </span>
                              <span className="flex items-center">
                                <Heart className="w-4 h-4 mr-1" />
                                {podcast.likes.toLocaleString()}
                              </span>
                              <span className="flex items-center">
                                <MessageCircle className="w-4 h-4 mr-1" />
                                {podcast.comments}
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-2 mt-3">
                              {podcast.tags.map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
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
              </TabsContent>

              <TabsContent value="shows" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {mockShows.map((show) => (
                    <Card key={show.id} className="bg-gray-800 border-gray-700">
                      <CardContent className="p-6">
                        <div className="flex space-x-4">
                          <img
                            src={show.coverUrl}
                            alt={show.title}
                            className="w-20 h-20 rounded-lg object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-white mb-1">{show.title}</h3>
                            <div className="flex items-center space-x-2 text-sm text-gray-400 mb-2">
                              <Avatar className="w-5 h-5">
                                <AvatarImage src={show.creatorAvatar} alt={show.creatorName} />
                                <AvatarFallback>{show.creatorName[0]}</AvatarFallback>
                              </Avatar>
                              <span>{show.creatorName}</span>
                            </div>
                            <p className="text-gray-300 text-sm mb-3 line-clamp-2">{show.description}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3 text-xs text-gray-400">
                                <span>{show.episodeCount} episodes</span>
                                <span>{show.subscriberCount.toLocaleString()} subscribers</span>
                              </div>
                              <Button
                                size="sm"
                                variant={show.isSubscribed ? "outline" : "default"}
                                className={show.isSubscribed ? "border-primary text-primary" : "bg-primary"}
                                data-testid={`subscribe-show-${show.id}`}
                              >
                                {show.isSubscribed ? "Subscribed" : "Subscribe"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="trending" className="space-y-6">
                <div className="grid gap-6">
                  {mockPodcasts.slice().sort((a, b) => b.plays - a.plays).map((podcast) => (
                    <Card key={podcast.id} className="bg-gray-800 border-gray-700">
                      <CardContent className="p-6">
                        <div className="flex space-x-4">
                          <img
                            src={podcast.coverUrl}
                            alt={podcast.title}
                            className="w-24 h-24 rounded-lg object-cover"
                          />
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-white mb-1">{podcast.title}</h3>
                            <p className="text-gray-400 mb-2">{podcast.creatorName}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-400">
                              <span className="flex items-center">
                                <TrendingUp className="w-4 h-4 mr-1 text-green-500" />
                                {podcast.plays.toLocaleString()} plays
                              </span>
                              <span>{formatDuration(podcast.duration)}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Categories */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Filter className="w-5 h-5 mr-2 text-primary" />
                  Categories
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`w-full text-left p-2 rounded-lg transition-colors flex items-center justify-between ${
                      category === cat.id 
                        ? 'bg-primary text-white' 
                        : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                    }`}
                    data-testid={`category-${cat.id}`}
                  >
                    <span>{cat.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {cat.count}
                    </Badge>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Platform Stats */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-primary" />
                  Podcast Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Episodes</span>
                  <span className="font-semibold text-white">1,543</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Active Shows</span>
                  <span className="font-semibold text-white">234</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Listens</span>
                  <span className="font-semibold text-white">2.1M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Hours of Content</span>
                  <span className="font-semibold text-white">3,420</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Audio Player */}
        {currentPodcast && (
          <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-4 z-50">
            <div className="container mx-auto">
              <div className="flex items-center space-x-4">
                <img
                  src={currentPodcast.coverUrl}
                  alt={currentPodcast.title}
                  className="w-12 h-12 rounded object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold truncate">{currentPodcast.title}</p>
                  <p className="text-gray-400 text-sm truncate">{currentPodcast.creatorName}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="ghost">
                    <SkipBack className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <Button size="sm" variant="ghost">
                    <SkipForward className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center space-x-2 min-w-[100px]">
                  <Volume2 className="w-4 h-4 text-gray-400" />
                  <Progress value={volume} className="w-16" />
                </div>
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="ghost">
                    <Heart className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Bookmark className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-2">
                <Progress 
                  value={(currentTime / currentPodcast.duration) * 100} 
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}