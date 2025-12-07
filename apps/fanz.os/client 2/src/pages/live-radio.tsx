import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import {
  Radio,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Heart,
  MessageCircle,
  Users,
  Mic,
  MicOff,
  Settings,
  Calendar,
  Clock,
  TrendingUp,
  Search,
  Star,
  Gift,
  Share2,
  Headphones,
  Music,
  Zap,
  Crown,
  Globe
} from "lucide-react";
import { Link } from "wouter";

interface RadioStation {
  id: string;
  name: string;
  description: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  coverUrl: string;
  isLive: boolean;
  currentTrack?: string;
  genre: string;
  listeners: number;
  totalListens: number;
  streamUrl: string;
  startedAt?: string;
  scheduledShows: Array<{
    id: string;
    title: string;
    startTime: string;
    duration: number;
  }>;
  tags: string[];
  isPremium: boolean;
  price?: number;
}

interface RadioShow {
  id: string;
  title: string;
  description: string;
  stationId: string;
  stationName: string;
  hostName: string;
  hostAvatar: string;
  coverUrl: string;
  genre: string;
  startTime: string;
  duration: number;
  isLive: boolean;
  listeners: number;
  tags: string[];
}

export default function LiveRadioPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [currentStation, setCurrentStation] = useState<RadioStation | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState([75]);
  const [chatMessage, setChatMessage] = useState("");
  const audioRef = useRef<HTMLAudioElement>(null);
  const queryClient = useQueryClient();

  const { data: radioStations } = useQuery({
    queryKey: ["/api/radio/stations"],
    retry: false,
  });

  const { data: radioShows } = useQuery({
    queryKey: ["/api/radio/shows"],
    retry: false,
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["/api/messages/unread/count"],
    retry: false,
  });

  // Mock data
  const mockStations: RadioStation[] = radioStations || [
    {
      id: "station1",
      name: "Emma's Chill Vibes",
      description: "Relaxing music and intimate conversations for late-night listeners",
      creatorId: "creator1",
      creatorName: "Emma Rose",
      creatorAvatar: "https://images.unsplash.com/photo-1494790108344-b2ee30e40a34?w=100&h=100&fit=crop&crop=face",
      coverUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
      isLive: true,
      currentTrack: "Midnight Conversations",
      genre: "lounge",
      listeners: 234,
      totalListens: 15420,
      streamUrl: "#",
      startedAt: "2024-01-20T22:00:00Z",
      scheduledShows: [
        { id: "show1", title: "Late Night Talks", startTime: "22:00", duration: 120 },
        { id: "show2", title: "Morning Motivation", startTime: "08:00", duration: 60 }
      ],
      tags: ["chill", "talk", "music"],
      isPremium: false
    },
    {
      id: "station2", 
      name: "Sophia's Dance Floor",
      description: "High-energy dance music and exclusive DJ sets",
      creatorId: "creator2",
      creatorName: "Sophia Luna",
      creatorAvatar: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=100&h=100&fit=crop&crop=face",
      coverUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop",
      isLive: true,
      currentTrack: "Deep House Mix #47",
      genre: "electronic",
      listeners: 567,
      totalListens: 28930,
      streamUrl: "#",
      startedAt: "2024-01-20T20:00:00Z",
      scheduledShows: [
        { id: "show3", title: "Friday Night Fever", startTime: "20:00", duration: 180 },
        { id: "show4", title: "Weekend Warmup", startTime: "18:00", duration: 120 }
      ],
      tags: ["dance", "electronic", "dj"],
      isPremium: true,
      price: 4.99
    },
    {
      id: "station3",
      name: "Isabella's Wellness Hour",
      description: "Meditation, wellness tips, and peaceful music for mind and body",
      creatorId: "creator3", 
      creatorName: "Isabella Star",
      creatorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
      coverUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop",
      isLive: false,
      genre: "wellness",
      listeners: 0,
      totalListens: 8450,
      streamUrl: "#",
      scheduledShows: [
        { id: "show5", title: "Morning Meditation", startTime: "07:00", duration: 45 },
        { id: "show6", title: "Evening Reflection", startTime: "19:00", duration: 30 }
      ],
      tags: ["meditation", "wellness", "peaceful"],
      isPremium: false
    }
  ];

  const mockShows: RadioShow[] = radioShows || [
    {
      id: "show1",
      title: "Late Night Confessions",
      description: "Intimate stories and deep conversations under the stars",
      stationId: "station1",
      stationName: "Emma's Chill Vibes",
      hostName: "Emma Rose",
      hostAvatar: "https://images.unsplash.com/photo-1494790108344-b2ee30e40a34?w=100&h=100&fit=crop&crop=face",
      coverUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
      genre: "talk",
      startTime: "2024-01-21T22:00:00Z",
      duration: 120,
      isLive: false,
      listeners: 0,
      tags: ["intimate", "talk", "stories"]
    },
    {
      id: "show2",
      title: "Friday Night Dance Party",
      description: "The hottest tracks and exclusive mixes to get your weekend started",
      stationId: "station2",
      stationName: "Sophia's Dance Floor", 
      hostName: "Sophia Luna",
      hostAvatar: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=100&h=100&fit=crop&crop=face",
      coverUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop",
      genre: "electronic",
      startTime: "2024-01-19T20:00:00Z",
      duration: 180,
      isLive: true,
      listeners: 567,
      tags: ["dance", "party", "weekend"]
    }
  ];

  const genres = [
    { id: "all", name: "All Genres", count: 156 },
    { id: "lounge", name: "Lounge", count: 23 },
    { id: "electronic", name: "Electronic", count: 45 },
    { id: "talk", name: "Talk Shows", count: 34 },
    { id: "wellness", name: "Wellness", count: 18 },
    { id: "music", name: "Music", count: 36 }
  ];

  const handlePlayStation = (station: RadioStation) => {
    if (station.isPremium && !station.isLive) {
      // Handle premium subscription logic
      return;
    }
    
    if (currentStation?.id === station.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentStation(station);
      setIsPlaying(true);
    }
  };

  const sendChatMessage = () => {
    if (!chatMessage.trim()) return;
    // Handle chat message sending
    setChatMessage("");
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume[0] / 100;
    }
  }, [volume]);

  const filteredStations = mockStations.filter(station => {
    if (searchQuery && !station.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (selectedGenre !== "all" && station.genre !== selectedGenre) return false;
    return true;
  });

  const liveShows = mockShows.filter(show => show.isLive);
  const upcomingShows = mockShows.filter(show => !show.isLive);

  return (
    <div className="min-h-screen bg-gray-900">
      <Navigation unreadCount={unreadCount} />
      
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center">
              <Radio className="w-8 h-8 mr-3 text-primary" />
              FanzRadio
            </h1>
            <p className="text-gray-400">Live radio shows and music from your favorite creators</p>
          </div>
          
          {user?.role === 'creator' && (
            <Link href="/creator-dashboard">
              <Button className="bg-gradient-to-r from-primary to-secondary hover:from-purple-600 hover:to-pink-600">
                <Mic className="w-4 h-4 mr-2" />
                Start Broadcasting
              </Button>
            </Link>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search stations, shows, hosts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-gray-800 border-gray-700 pl-12 py-3 text-white placeholder-gray-400 text-lg"
            data-testid="input-radio-search"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="live" className="space-y-6">
              <TabsList className="bg-gray-800 border border-gray-700 p-1">
                <TabsTrigger value="live" className="flex items-center" data-testid="tab-live">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                  Live Now
                </TabsTrigger>
                <TabsTrigger value="stations" className="flex items-center" data-testid="tab-stations">
                  <Radio className="w-4 h-4 mr-2" />
                  All Stations
                </TabsTrigger>
                <TabsTrigger value="shows" className="flex items-center" data-testid="tab-shows">
                  <Calendar className="w-4 h-4 mr-2" />
                  Shows
                </TabsTrigger>
                <TabsTrigger value="trending" className="flex items-center" data-testid="tab-trending">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Trending
                </TabsTrigger>
              </TabsList>

              {/* Live Now Tab */}
              <TabsContent value="live" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredStations.filter(station => station.isLive).map((station) => (
                    <Card key={station.id} className="bg-gray-800 border-gray-700 overflow-hidden hover:shadow-xl transition-all">
                      <div className="relative">
                        <img
                          src={station.coverUrl}
                          alt={station.name}
                          className="w-full h-48 object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                        
                        {/* Live Badge */}
                        <div className="absolute top-3 left-3">
                          <Badge className="bg-red-600 text-white">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-1"></div>
                            LIVE
                          </Badge>
                        </div>

                        {/* Premium Badge */}
                        {station.isPremium && (
                          <div className="absolute top-3 right-3">
                            <Badge className="bg-yellow-600 text-white">
                              <Crown className="w-3 h-3 mr-1" />
                              ${station.price}
                            </Badge>
                          </div>
                        )}

                        {/* Station Info Overlay */}
                        <div className="absolute bottom-3 left-3 right-3">
                          <h3 className="text-white font-semibold text-lg mb-1">{station.name}</h3>
                          {station.currentTrack && (
                            <p className="text-gray-200 text-sm mb-2">♪ {station.currentTrack}</p>
                          )}
                          <div className="flex items-center space-x-4 text-xs text-gray-300">
                            <span className="flex items-center">
                              <Users className="w-3 h-3 mr-1" />
                              {station.listeners} listening
                            </span>
                            <span className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {station.startedAt && new Date(station.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>

                        {/* Play Button Overlay */}
                        <button
                          onClick={() => handlePlayStation(station)}
                          className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/30"
                          data-testid={`play-station-${station.id}`}
                        >
                          <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                            {currentStation?.id === station.id && isPlaying ? (
                              <Pause className="w-8 h-8 text-white" />
                            ) : (
                              <Play className="w-8 h-8 text-white" />
                            )}
                          </div>
                        </button>
                      </div>

                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={station.creatorAvatar} alt={station.creatorName} />
                            <AvatarFallback>{station.creatorName[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-white font-medium">{station.creatorName}</p>
                            <p className="text-gray-400 text-sm">{station.genre}</p>
                          </div>
                        </div>
                        
                        <p className="text-gray-300 text-sm mb-3 line-clamp-2">{station.description}</p>
                        
                        <div className="flex items-center space-x-2">
                          {station.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* All Stations Tab */}
              <TabsContent value="stations" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredStations.map((station) => (
                    <Card key={station.id} className="bg-gray-800 border-gray-700">
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-3 mb-4">
                          <img
                            src={station.coverUrl}
                            alt={station.name}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="text-white font-semibold truncate">{station.name}</h3>
                            <p className="text-gray-400 text-sm">{station.creatorName}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              {station.isLive && (
                                <Badge className="bg-red-600 text-white text-xs">LIVE</Badge>
                              )}
                              <Badge variant="secondary" className="text-xs">{station.genre}</Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
                          <span>{station.totalListens.toLocaleString()} total listens</span>
                          {station.isLive && (
                            <span className="flex items-center text-green-400">
                              <Users className="w-3 h-3 mr-1" />
                              {station.listeners}
                            </span>
                          )}
                        </div>
                        
                        <Button
                          onClick={() => handlePlayStation(station)}
                          className="w-full bg-primary hover:bg-primary/90"
                          data-testid={`play-station-${station.id}`}
                        >
                          {currentStation?.id === station.id && isPlaying ? (
                            <>
                              <Pause className="w-4 h-4 mr-2" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-2" />
                              {station.isLive ? "Listen Live" : "Play Station"}
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Shows Tab */}
              <TabsContent value="shows" className="space-y-6">
                {liveShows.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-3"></div>
                      Live Shows
                    </h3>
                    <div className="grid gap-4">
                      {liveShows.map((show) => (
                        <Card key={show.id} className="bg-gray-800 border-gray-700">
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-4">
                              <img
                                src={show.coverUrl}
                                alt={show.title}
                                className="w-20 h-20 rounded-lg object-cover"
                              />
                              <div className="flex-1">
                                <h4 className="text-white font-semibold mb-1">{show.title}</h4>
                                <p className="text-gray-400 text-sm mb-2">{show.description}</p>
                                <div className="flex items-center space-x-4 text-xs text-gray-400">
                                  <span>{show.hostName}</span>
                                  <span>{show.stationName}</span>
                                  <span className="flex items-center text-green-400">
                                    <Users className="w-3 h-3 mr-1" />
                                    {show.listeners} listening
                                  </span>
                                </div>
                              </div>
                              <Button size="sm" className="bg-primary">
                                <Play className="w-4 h-4 mr-1" />
                                Listen
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">Upcoming Shows</h3>
                  <div className="grid gap-4">
                    {upcomingShows.map((show) => (
                      <Card key={show.id} className="bg-gray-800 border-gray-700">
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-4">
                            <img
                              src={show.coverUrl}
                              alt={show.title}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                            <div className="flex-1">
                              <h4 className="text-white font-semibold mb-1">{show.title}</h4>
                              <p className="text-gray-400 text-sm mb-2">{show.description}</p>
                              <div className="flex items-center space-x-4 text-xs text-gray-400">
                                <span>{show.hostName}</span>
                                <span className="flex items-center">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  {new Date(show.startTime).toLocaleDateString()}
                                </span>
                                <span className="flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {new Date(show.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                            <Button size="sm" variant="outline">
                              <Bell className="w-4 h-4 mr-1" />
                              Remind Me
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Trending Tab */}
              <TabsContent value="trending" className="space-y-6">
                <div className="grid gap-4">
                  {mockStations.slice().sort((a, b) => b.totalListens - a.totalListens).map((station, index) => (
                    <Card key={station.id} className="bg-gray-800 border-gray-700">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-full text-white font-bold">
                            {index + 1}
                          </div>
                          <img
                            src={station.coverUrl}
                            alt={station.name}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                          <div className="flex-1">
                            <h4 className="text-white font-semibold mb-1">{station.name}</h4>
                            <p className="text-gray-400 text-sm">{station.creatorName}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1">
                              <span className="flex items-center">
                                <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                                {station.totalListens.toLocaleString()} listens
                              </span>
                              {station.isLive && (
                                <span className="flex items-center text-red-400">
                                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-1"></div>
                                  LIVE
                                </span>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handlePlayStation(station)}
                            className="bg-primary"
                          >
                            <Play className="w-4 h-4" />
                          </Button>
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
            {/* Genre Filter */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Music className="w-5 h-5 mr-2 text-primary" />
                  Genres
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {genres.map((genre) => (
                  <button
                    key={genre.id}
                    onClick={() => setSelectedGenre(genre.id)}
                    className={`w-full text-left p-2 rounded-lg transition-colors flex items-center justify-between ${
                      selectedGenre === genre.id 
                        ? 'bg-primary text-white' 
                        : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                    }`}
                    data-testid={`genre-${genre.id}`}
                  >
                    <span>{genre.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {genre.count}
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
                  Radio Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Live Stations</span>
                  <span className="font-semibold text-red-400 flex items-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-1"></div>
                    {mockStations.filter(s => s.isLive).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Stations</span>
                  <span className="font-semibold text-white">{mockStations.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Active Listeners</span>
                  <span className="font-semibold text-white">
                    {mockStations.reduce((sum, s) => sum + s.listeners, 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Listens</span>
                  <span className="font-semibold text-white">
                    {(mockStations.reduce((sum, s) => sum + s.totalListens, 0) / 1000).toFixed(0)}K
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Audio Player */}
        {currentStation && (
          <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-4 z-50">
            <div className="container mx-auto">
              <div className="flex items-center space-x-4">
                <img
                  src={currentStation.coverUrl}
                  alt={currentStation.name}
                  className="w-12 h-12 rounded object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold truncate">{currentStation.name}</p>
                  <p className="text-gray-400 text-sm truncate">
                    {currentStation.currentTrack || currentStation.creatorName}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                </div>
                
                <div className="flex items-center space-x-2 min-w-[120px]">
                  <button onClick={() => setVolume([volume[0] === 0 ? 75 : 0])}>
                    {volume[0] === 0 ? (
                      <VolumeX className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  <Slider
                    value={volume}
                    onValueChange={setVolume}
                    max={100}
                    step={1}
                    className="w-20"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-400 flex items-center">
                    <Users className="w-3 h-3 mr-1" />
                    {currentStation.listeners}
                  </span>
                  <Button size="sm" variant="ghost">
                    <Heart className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
            <audio ref={audioRef} src={currentStation.streamUrl} />
          </div>
        )}
      </div>
    </div>
  );
}