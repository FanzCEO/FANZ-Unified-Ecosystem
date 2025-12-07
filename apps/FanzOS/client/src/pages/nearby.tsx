import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
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
  MapPin,
  Map,
  Navigation,
  MessageCircle,
  Calendar,
  Clock,
  Globe,
  Users,
  CheckCircle,
  Star,
  Send,
  Filter,
  Search,
  ChevronRight,
  Video,
  Phone,
  Mail,
  Heart,
  Shield,
  Zap,
  TrendingUp,
  CalendarDays,
  CalendarClock,
  CalendarPlus,
  CalendarCheck,
  Bell,
  Settings,
  MoreVertical,
  Compass,
  Radio,
  Wifi,
  Signal,
  Plus,
  X,
  ChevronLeft,
  Eye,
  UserPlus,
  Share2,
  Info,
  ExternalLink,
  Maximize2,
  Minimize2,
  RefreshCw,
  Loader2
} from "lucide-react";
import { Link } from "wouter";

interface NearbyCreator {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatar: string;
  banner: string;
  isVerified: boolean;
  isOnline: boolean;
  location: {
    lat: number;
    lng: number;
    city: string;
    country: string;
    distance: number; // in km
  };
  stats: {
    subscribers: number;
    posts: number;
    rating: number;
  };
  subscriptionPrice: number;
  categories: string[];
  nextLiveStream?: {
    title: string;
    scheduledAt: string;
  };
  availableForMeet: boolean;
  meetingPrice?: number;
}

interface CalendarEvent {
  id: string;
  creatorId: string;
  creatorName: string;
  title: string;
  description: string;
  type: "live_stream" | "meet_greet" | "content_drop" | "private_session";
  startTime: string;
  endTime: string;
  location?: string;
  isVirtual: boolean;
  price?: number;
  maxAttendees?: number;
  currentAttendees: number;
  isBooked: boolean;
  meetingLink?: string;
  reminder: boolean;
}

interface ProximityMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  message: string;
  timestamp: string;
  distance: number;
  isAnonymous: boolean;
  expiresAt?: string;
}

export default function Nearby() {
  const { user } = useAuth() as { user: User | undefined };
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedCreator, setSelectedCreator] = useState<NearbyCreator | null>(null);
  const [showScheduler, setShowScheduler] = useState(false);
  const [showMessaging, setShowMessaging] = useState(false);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [selectedTab, setSelectedTab] = useState("map");
  const [searchRadius, setSearchRadius] = useState(50); // km
  const [filterVerified, setFilterVerified] = useState(true);
  const [filterOnline, setFilterOnline] = useState(false);
  const [filterCategory, setFilterCategory] = useState("all");
  const [messageContent, setMessageContent] = useState("");
  const [proximityMessageContent, setProximityMessageContent] = useState("");
  const [proximityMessageRadius, setProximityMessageRadius] = useState(10); // km
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setIsLoadingLocation(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          // Default to a major city if location access denied
          setUserLocation({ lat: 34.0522, lng: -118.2437 }); // Los Angeles
          setIsLoadingLocation(false);
          toast({
            title: "Location access denied",
            description: "Showing creators in Los Angeles area. Enable location for better results.",
            variant: "destructive",
          });
        }
      );
    } else {
      setIsLoadingLocation(false);
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support location services.",
        variant: "destructive",
      });
    }
  }, []);

  // Fetch nearby creators
  const { data: nearbyCreators, isLoading: creatorsLoading, refetch: refetchCreators } = useQuery<NearbyCreator[]>({
    queryKey: ["/api/creators/nearby", userLocation, searchRadius, filterCategory],
    enabled: !!userLocation,
  });

  // Fetch calendar events
  const { data: calendarEvents, isLoading: eventsLoading } = useQuery<CalendarEvent[]>({
    queryKey: ["/api/calendar/events", selectedDate],
    enabled: !!user,
  });

  // Fetch proximity messages
  const { data: proximityMessages } = useQuery<ProximityMessage[]>({
    queryKey: ["/api/messages/proximity", userLocation],
    enabled: !!userLocation,
  });

  // Mock data for demonstration
  const mockCreators: NearbyCreator[] = nearbyCreators || [
    {
      id: "1",
      username: "emmarose",
      displayName: "Emma Rose",
      bio: "✨ Verified Creator | Content daily | LA Based",
      avatar: "https://images.unsplash.com/photo-1494790108344-b2ee30e40a34?w=200&h=200&fit=crop&crop=face",
      banner: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&h=400&fit=crop",
      isVerified: true,
      isOnline: true,
      location: {
        lat: 34.0522,
        lng: -118.2537,
        city: "Los Angeles",
        country: "USA",
        distance: 2.5
      },
      stats: {
        subscribers: 15234,
        posts: 342,
        rating: 4.9
      },
      subscriptionPrice: 14.99,
      categories: ["Model", "Lifestyle"],
      nextLiveStream: {
        title: "Evening Chat & Q&A",
        scheduledAt: new Date(Date.now() + 3600000).toISOString()
      },
      availableForMeet: true,
      meetingPrice: 100
    },
    {
      id: "2",
      username: "sophialuna",
      displayName: "Sophia Luna",
      bio: "🌙 Night owl creator | Dance & Fitness",
      avatar: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=200&h=200&fit=crop&crop=face",
      banner: "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=1200&h=400&fit=crop",
      isVerified: true,
      isOnline: false,
      location: {
        lat: 34.0622,
        lng: -118.2437,
        city: "Hollywood",
        country: "USA",
        distance: 5.8
      },
      stats: {
        subscribers: 8923,
        posts: 234,
        rating: 4.8
      },
      subscriptionPrice: 12.99,
      categories: ["Dance", "Fitness"],
      availableForMeet: false
    },
    {
      id: "3",
      username: "isabellastar",
      displayName: "Isabella Star",
      bio: "⭐ Artist & Creator | Custom content available",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
      banner: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200&h=400&fit=crop",
      isVerified: true,
      isOnline: true,
      location: {
        lat: 34.0195,
        lng: -118.4912,
        city: "Santa Monica",
        country: "USA",
        distance: 12.3
      },
      stats: {
        subscribers: 6543,
        posts: 189,
        rating: 4.7
      },
      subscriptionPrice: 9.99,
      categories: ["Art", "Photography"],
      availableForMeet: true,
      meetingPrice: 75
    }
  ];

  const mockEvents: CalendarEvent[] = calendarEvents || [
    {
      id: "1",
      creatorId: "1",
      creatorName: "Emma Rose",
      title: "Live Q&A Session",
      description: "Join me for an interactive Q&A session",
      type: "live_stream",
      startTime: new Date(Date.now() + 3600000).toISOString(),
      endTime: new Date(Date.now() + 7200000).toISOString(),
      isVirtual: true,
      price: 0,
      maxAttendees: 100,
      currentAttendees: 45,
      isBooked: false,
      reminder: true
    },
    {
      id: "2",
      creatorId: "3",
      creatorName: "Isabella Star",
      title: "Art Workshop - Downtown LA",
      description: "Learn painting techniques in person",
      type: "meet_greet",
      startTime: new Date(Date.now() + 86400000).toISOString(),
      endTime: new Date(Date.now() + 93600000).toISOString(),
      location: "Downtown LA Art Studio",
      isVirtual: false,
      price: 50,
      maxAttendees: 10,
      currentAttendees: 7,
      isBooked: false,
      reminder: false
    },
    {
      id: "3",
      creatorId: "1",
      creatorName: "Emma Rose",
      title: "Exclusive Content Drop",
      description: "New exclusive content release",
      type: "content_drop",
      startTime: new Date(Date.now() + 172800000).toISOString(),
      endTime: new Date(Date.now() + 176400000).toISOString(),
      isVirtual: true,
      isBooked: false,
      reminder: true
    }
  ];

  const mockProximityMessages: ProximityMessage[] = proximityMessages || [
    {
      id: "1",
      senderId: "user1",
      senderName: "NearbyFan",
      senderAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face",
      message: "Anyone interested in a creator meetup this weekend?",
      timestamp: "10 minutes ago",
      distance: 0.8,
      isAnonymous: false,
      expiresAt: new Date(Date.now() + 3600000).toISOString()
    },
    {
      id: "2",
      senderId: "anon1",
      senderName: "Anonymous",
      senderAvatar: "",
      message: "Great content creators in this area! 🌟",
      timestamp: "1 hour ago",
      distance: 2.3,
      isAnonymous: true
    }
  ];

  const sendDirectMessageMutation = useMutation({
    mutationFn: async (data: { creatorId: string; message: string }) => {
      const response = await apiRequest("POST", `/api/messages/send`, data);
      return response.json();
    },
    onSuccess: () => {
      setMessageContent("");
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Failed to send message",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const sendProximityMessageMutation = useMutation({
    mutationFn: async (data: { message: string; radius: number; anonymous: boolean }) => {
      const response = await apiRequest("POST", `/api/messages/proximity`, {
        ...data,
        location: userLocation
      });
      return response.json();
    },
    onSuccess: () => {
      setProximityMessageContent("");
      queryClient.invalidateQueries({ queryKey: ["/api/messages/proximity"] });
      toast({
        title: "Proximity message sent",
        description: `Your message has been broadcast to users within ${proximityMessageRadius}km`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to send proximity message",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const bookEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const response = await apiRequest("POST", `/api/calendar/book/${eventId}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/events"] });
      toast({
        title: "Event booked",
        description: "The event has been added to your calendar",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to book event",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const syncCalendarMutation = useMutation({
    mutationFn: async (provider: "google" | "apple" | "outlook") => {
      const response = await apiRequest("POST", `/api/calendar/sync`, { provider });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.authUrl) {
        window.open(data.authUrl, '_blank');
      }
      toast({
        title: "Calendar sync initiated",
        description: "Follow the prompts to connect your calendar",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to sync calendar",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const getDistanceColor = (distance: number) => {
    if (distance < 5) return "text-green-500";
    if (distance < 15) return "text-yellow-500";
    if (distance < 30) return "text-orange-500";
    return "text-red-500";
  };

  const getEventTypeIcon = (type: string) => {
    switch(type) {
      case "live_stream": return <Video className="w-4 h-4" />;
      case "meet_greet": return <Users className="w-4 h-4" />;
      case "content_drop": return <Zap className="w-4 h-4" />;
      case "private_session": return <Shield className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  const getEventTypeColor = (type: string) => {
    switch(type) {
      case "live_stream": return "bg-blue-900 text-blue-400";
      case "meet_greet": return "bg-purple-900 text-purple-400";
      case "content_drop": return "bg-yellow-900 text-yellow-400";
      case "private_session": return "bg-red-900 text-red-400";
      default: return "bg-gray-700 text-gray-400";
    }
  };

  const filteredCreators = mockCreators.filter(creator => {
    if (filterVerified && !creator.isVerified) return false;
    if (filterOnline && !creator.isOnline) return false;
    if (filterCategory !== "all" && !creator.categories.includes(filterCategory)) return false;
    if (creator.location.distance > searchRadius) return false;
    return true;
  });

  if (isLoadingLocation) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-white">Getting your location...</p>
          <p className="text-sm text-gray-400 mt-2">Please allow location access for best experience</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center" data-testid="text-nearby-title">
                <MapPin className="w-8 h-8 mr-3 text-primary" />
                Nearby Me
              </h1>
              <p className="text-gray-400">Discover verified creators in your area</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
                onClick={() => refetchCreators()}
                data-testid="button-refresh"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button
                className="bg-gradient-to-r from-primary to-secondary hover:from-purple-600 hover:to-pink-600"
                onClick={() => setShowScheduler(true)}
                data-testid="button-calendar"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Calendar
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-gray-800 border-gray-700 mb-6">
          <CardContent className="py-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label className="text-white mb-2 block">Search Radius ({searchRadius}km)</Label>
                <Slider
                  value={[searchRadius]}
                  onValueChange={([value]) => setSearchRadius(value)}
                  max={100}
                  min={1}
                  step={5}
                  className="w-full"
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-full md:w-48 bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Model">Model</SelectItem>
                  <SelectItem value="Lifestyle">Lifestyle</SelectItem>
                  <SelectItem value="Fitness">Fitness</SelectItem>
                  <SelectItem value="Art">Art</SelectItem>
                  <SelectItem value="Dance">Dance</SelectItem>
                  <SelectItem value="Photography">Photography</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filterVerified}
                    onChange={(e) => setFilterVerified(e.target.checked)}
                    className="rounded border-gray-600 bg-gray-700 text-primary focus:ring-primary"
                  />
                  <span className="text-white">Verified Only</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filterOnline}
                    onChange={(e) => setFilterOnline(e.target.checked)}
                    className="rounded border-gray-600 bg-gray-700 text-primary focus:ring-primary"
                  />
                  <span className="text-white">Online Now</span>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="bg-gray-800 border border-gray-700">
            <TabsTrigger value="map" data-testid="tab-map">
              <Map className="w-4 h-4 mr-2" />
              Map View
            </TabsTrigger>
            <TabsTrigger value="list" data-testid="tab-list">
              <Users className="w-4 h-4 mr-2" />
              List View
            </TabsTrigger>
            <TabsTrigger value="proximity" data-testid="tab-proximity">
              <Radio className="w-4 h-4 mr-2" />
              Proximity Chat
            </TabsTrigger>
            <TabsTrigger value="events" data-testid="tab-events">
              <CalendarDays className="w-4 h-4 mr-2" />
              Local Events
            </TabsTrigger>
          </TabsList>

          {/* Map View */}
          <TabsContent value="map" className="space-y-6">
            <Card className={`bg-gray-800 border-gray-700 ${mapExpanded ? 'h-[600px]' : 'h-[400px]'} relative`}>
              <div className="absolute top-4 right-4 z-10 space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setMapExpanded(!mapExpanded)}
                  className="bg-gray-800/90 border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  {mapExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>
              </div>
              <div className="w-full h-full bg-gray-700 rounded-lg flex items-center justify-center">
                {/* Map would be integrated here with Google Maps or Mapbox */}
                <div className="text-center">
                  <Map className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">Interactive map showing {filteredCreators.length} creators</p>
                  <p className="text-sm text-gray-500 mt-2">Map integration would display here</p>
                  {/* In production, this would show actual map with markers */}
                  <div className="mt-4 space-y-2">
                    {filteredCreators.slice(0, 3).map((creator) => (
                      <div key={creator.id} className="flex items-center justify-center space-x-2 text-sm">
                        <MapPin className={`w-4 h-4 ${getDistanceColor(creator.location.distance)}`} />
                        <span className="text-white">{creator.displayName}</span>
                        <span className="text-gray-400">({creator.location.distance}km)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Creator Cards Below Map */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCreators.map((creator) => (
                <Card key={creator.id} className="bg-gray-800 border-gray-700 overflow-hidden">
                  <div className="relative h-32">
                    <img
                      src={creator.banner}
                      alt="Banner"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent" />
                    <Badge className={`absolute top-2 right-2 ${getDistanceColor(creator.location.distance)}`}>
                      <MapPin className="w-3 h-3 mr-1" />
                      {creator.location.distance}km
                    </Badge>
                  </div>
                  <CardContent className="pt-0">
                    <div className="flex items-start -mt-12 relative z-10">
                      <Avatar className="w-20 h-20 border-4 border-gray-800">
                        <AvatarImage src={creator.avatar} alt={creator.displayName} />
                        <AvatarFallback>{creator.displayName[0]}</AvatarFallback>
                      </Avatar>
                      <div className="ml-4 mt-12">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-white">{creator.displayName}</h3>
                          {creator.isVerified && (
                            <CheckCircle className="w-4 h-4 text-blue-500" />
                          )}
                        </div>
                        <p className="text-xs text-gray-400">@{creator.username}</p>
                      </div>
                    </div>
                    <p className="text-gray-300 text-sm mt-3 mb-3">{creator.bio}</p>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="text-gray-400">
                          <Users className="w-4 h-4 inline mr-1" />
                          {creator.stats.subscribers.toLocaleString()}
                        </span>
                        <span className="text-gray-400">
                          <Star className="w-4 h-4 inline mr-1" />
                          {creator.stats.rating}
                        </span>
                      </div>
                      {creator.isOnline && (
                        <Badge className="bg-green-900 text-green-400">Online</Badge>
                      )}
                    </div>
                    {creator.nextLiveStream && (
                      <div className="p-2 bg-gray-700 rounded mb-3">
                        <p className="text-xs text-gray-400">Next Live:</p>
                        <p className="text-sm text-white">{creator.nextLiveStream.title}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(creator.nextLiveStream.scheduledAt).toLocaleString()}
                        </p>
                      </div>
                    )}
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-gradient-to-r from-primary to-secondary hover:from-purple-600 hover:to-pink-600"
                        onClick={() => {
                          setSelectedCreator(creator);
                          setShowMessaging(true);
                        }}
                        data-testid={`button-message-${creator.id}`}
                      >
                        <MessageCircle className="w-4 h-4 mr-1" />
                        Message
                      </Button>
                      <Link href={`/creator/${creator.username}`}>
                        <Button size="sm" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                          <Eye className="w-4 h-4 mr-1" />
                          Profile
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* List View */}
          <TabsContent value="list" className="space-y-4">
            {filteredCreators.map((creator) => (
              <Card key={creator.id} className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={creator.avatar} alt={creator.displayName} />
                      <AvatarFallback>{creator.displayName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-semibold text-white">{creator.displayName}</h3>
                            {creator.isVerified && (
                              <CheckCircle className="w-5 h-5 text-blue-500" />
                            )}
                            {creator.isOnline && (
                              <Badge className="bg-green-900 text-green-400">Online</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-400">@{creator.username}</p>
                          <p className="text-gray-300 mt-2">{creator.bio}</p>
                          <div className="flex items-center space-x-4 mt-3">
                            <span className={`text-sm ${getDistanceColor(creator.location.distance)}`}>
                              <MapPin className="w-4 h-4 inline mr-1" />
                              {creator.location.distance}km away • {creator.location.city}
                            </span>
                            <span className="text-sm text-gray-400">
                              ${creator.subscriptionPrice}/month
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="space-y-1 mb-3">
                            <p className="text-sm text-gray-400">
                              <Users className="w-4 h-4 inline mr-1" />
                              {creator.stats.subscribers.toLocaleString()} subscribers
                            </p>
                            <p className="text-sm text-gray-400">
                              <Star className="w-4 h-4 inline mr-1" />
                              {creator.stats.rating} rating
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Button
                              size="sm"
                              className="w-full bg-gradient-to-r from-primary to-secondary hover:from-purple-600 hover:to-pink-600"
                              onClick={() => {
                                setSelectedCreator(creator);
                                setShowMessaging(true);
                              }}
                            >
                              <MessageCircle className="w-4 h-4 mr-1" />
                              Message
                            </Button>
                            {creator.availableForMeet && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                              >
                                <Calendar className="w-4 h-4 mr-1" />
                                Book Meet
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Proximity Chat */}
          <TabsContent value="proximity" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Broadcast Message</CardTitle>
                <CardDescription className="text-gray-400">
                  Send a message to all users within your selected radius
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label className="text-white mb-2 block">
                      Broadcast Radius ({proximityMessageRadius}km)
                    </Label>
                    <Slider
                      value={[proximityMessageRadius]}
                      onValueChange={([value]) => setProximityMessageRadius(value)}
                      max={50}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  <Textarea
                    placeholder="Type your message..."
                    value={proximityMessageContent}
                    onChange={(e) => setProximityMessageContent(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                    rows={3}
                  />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded border-gray-600 bg-gray-700 text-primary focus:ring-primary"
                      />
                      <span className="text-white">Send anonymously</span>
                    </label>
                    <Button
                      className="bg-gradient-to-r from-primary to-secondary hover:from-purple-600 hover:to-pink-600"
                      onClick={() => sendProximityMessageMutation.mutate({
                        message: proximityMessageContent,
                        radius: proximityMessageRadius,
                        anonymous: false
                      })}
                      disabled={!proximityMessageContent}
                    >
                      <Radio className="w-4 h-4 mr-2" />
                      Broadcast
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Proximity Messages</CardTitle>
                <CardDescription className="text-gray-400">
                  Messages from users near you
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {mockProximityMessages.map((msg) => (
                      <div key={msg.id} className="p-4 bg-gray-700 rounded-lg">
                        <div className="flex items-start space-x-3">
                          {!msg.isAnonymous ? (
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={msg.senderAvatar} alt={msg.senderName} />
                              <AvatarFallback>{msg.senderName[0]}</AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                              <Shield className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-white">
                                {msg.senderName}
                              </span>
                              <span className={`text-xs ${getDistanceColor(msg.distance)}`}>
                                {msg.distance}km away
                              </span>
                            </div>
                            <p className="text-gray-300">{msg.message}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-gray-400">{msg.timestamp}</span>
                              {msg.expiresAt && (
                                <span className="text-xs text-yellow-500">
                                  Expires in {new Date(msg.expiresAt).getHours()}h
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Local Events */}
          <TabsContent value="events" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                {mockEvents.map((event) => (
                  <Card key={event.id} className="bg-gray-800 border-gray-700">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge className={getEventTypeColor(event.type)}>
                              {getEventTypeIcon(event.type)}
                              <span className="ml-1">
                                {event.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </span>
                            </Badge>
                            {event.price === 0 && (
                              <Badge className="bg-green-900 text-green-400">Free</Badge>
                            )}
                          </div>
                          <h3 className="text-lg font-semibold text-white mb-1">{event.title}</h3>
                          <p className="text-sm text-gray-400 mb-2">by {event.creatorName}</p>
                          <p className="text-gray-300 mb-3">{event.description}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <span>
                              <CalendarClock className="w-4 h-4 inline mr-1" />
                              {new Date(event.startTime).toLocaleString()}
                            </span>
                            {event.location && (
                              <span>
                                <MapPin className="w-4 h-4 inline mr-1" />
                                {event.location}
                              </span>
                            )}
                            {event.maxAttendees && (
                              <span>
                                <Users className="w-4 h-4 inline mr-1" />
                                {event.currentAttendees}/{event.maxAttendees}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          {event.price && event.price > 0 && (
                            <p className="text-xl font-bold text-white mb-2">${event.price}</p>
                          )}
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-primary to-secondary hover:from-purple-600 hover:to-pink-600"
                            onClick={() => {
                              setSelectedEvent(event);
                              bookEventMutation.mutate(event.id);
                            }}
                            disabled={event.isBooked}
                          >
                            {event.isBooked ? (
                              <>
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Booked
                              </>
                            ) : (
                              <>
                                <CalendarPlus className="w-4 h-4 mr-1" />
                                Book
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Calendar Sync */}
              <div>
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Calendar Sync</CardTitle>
                    <CardDescription className="text-gray-400">
                      Connect your calendar for automatic event sync
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 justify-start"
                      onClick={() => syncCalendarMutation.mutate("google")}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Google Calendar
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 justify-start"
                      onClick={() => syncCalendarMutation.mutate("apple")}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Apple Calendar
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 justify-start"
                      onClick={() => syncCalendarMutation.mutate("outlook")}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Outlook Calendar
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700 mt-4">
                  <CardHeader>
                    <CardTitle className="text-white">Upcoming Reminders</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {mockEvents.filter(e => e.reminder).map((event) => (
                        <div key={event.id} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                          <div>
                            <p className="text-sm text-white">{event.title}</p>
                            <p className="text-xs text-gray-400">
                              {new Date(event.startTime).toLocaleString()}
                            </p>
                          </div>
                          <Bell className="w-4 h-4 text-yellow-500" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Direct Message Dialog */}
      {showMessaging && selectedCreator && (
        <Dialog open={showMessaging} onOpenChange={setShowMessaging}>
          <DialogContent className="bg-gray-800 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Message {selectedCreator.displayName}</DialogTitle>
              <DialogDescription className="text-gray-400">
                Send a direct message to this creator
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-700 rounded">
                <Avatar>
                  <AvatarImage src={selectedCreator.avatar} alt={selectedCreator.displayName} />
                  <AvatarFallback>{selectedCreator.displayName[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-white font-medium">{selectedCreator.displayName}</p>
                  <p className="text-xs text-gray-400">
                    <MapPin className="w-3 h-3 inline mr-1" />
                    {selectedCreator.location.distance}km away
                  </p>
                </div>
              </div>
              <Textarea
                placeholder="Type your message..."
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowMessaging(false)}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                className="bg-gradient-to-r from-primary to-secondary hover:from-purple-600 hover:to-pink-600"
                onClick={() => sendDirectMessageMutation.mutate({
                  creatorId: selectedCreator.id,
                  message: messageContent
                })}
                disabled={!messageContent}
              >
                <Send className="w-4 h-4 mr-2" />
                Send Message
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Calendar Scheduler Sheet */}
      <Sheet open={showScheduler} onOpenChange={setShowScheduler}>
        <SheetContent className="bg-gray-800 border-gray-700 text-white w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="text-white">Event Calendar</SheetTitle>
            <SheetDescription className="text-gray-400">
              View and manage upcoming events
            </SheetDescription>
          </SheetHeader>
          
          <div className="mt-6">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white mb-4"
            />
            
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-3">
                {mockEvents.map((event) => (
                  <Card key={event.id} className="bg-gray-700 border-gray-600">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <Badge className={getEventTypeColor(event.type)}>
                          {getEventTypeIcon(event.type)}
                          <span className="ml-1 text-xs">
                            {event.type.replace(/_/g, ' ')}
                          </span>
                        </Badge>
                        {event.isBooked && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                      <h4 className="font-semibold text-white mb-1">{event.title}</h4>
                      <p className="text-xs text-gray-400 mb-2">by {event.creatorName}</p>
                      <div className="space-y-1 text-xs text-gray-400">
                        <p>
                          <Clock className="w-3 h-3 inline mr-1" />
                          {new Date(event.startTime).toLocaleTimeString()}
                        </p>
                        {event.location && (
                          <p>
                            <MapPin className="w-3 h-3 inline mr-1" />
                            {event.location}
                          </p>
                        )}
                        {event.price !== undefined && (
                          <p>
                            <DollarSign className="w-3 h-3 inline mr-1" />
                            {event.price === 0 ? 'Free' : `$${event.price}`}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}