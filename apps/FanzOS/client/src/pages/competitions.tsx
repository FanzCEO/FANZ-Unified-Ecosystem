import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Trophy,
  Gift,
  Users,
  Clock,
  Calendar,
  Star,
  TrendingUp,
  Search,
  Filter,
  Zap,
  Crown,
  Target,
  Ticket,
  DollarSign,
  Plus,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  PartyPopper,
  Award,
  Medal,
  Flame
} from "lucide-react";
import { Link } from "wouter";

interface Competition {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  coverUrl: string;
  type: "contest" | "raffle" | "giveaway" | "challenge";
  category: string;
  status: "upcoming" | "live" | "ended";
  startDate: string;
  endDate: string;
  totalPrizeValue: number;
  entryFee?: number;
  maxParticipants?: number;
  currentParticipants: number;
  requirements: string[];
  prizes: Array<{
    position: number;
    title: string;
    value: number;
    description: string;
  }>;
  tags: string[];
  isEntered?: boolean;
  isSponsored?: boolean;
  viewCount: number;
  entryCount: number;
}

interface CompetitionEntry {
  id: string;
  competitionId: string;
  userId: string;
  username: string;
  userAvatar: string;
  submissionUrl?: string;
  submissionText?: string;
  submittedAt: string;
  votes: number;
  isWinner?: boolean;
  position?: number;
}

export default function CompetitionsPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null);
  const queryClient = useQueryClient();

  const { data: competitions } = useQuery({
    queryKey: ["/api/competitions"],
    retry: false,
  });

  const { data: myEntries } = useQuery({
    queryKey: ["/api/competitions/my-entries"],
    enabled: !!user,
    retry: false,
  });

  const { data: competitionEntries } = useQuery({
    queryKey: ["/api/competitions/entries", selectedCompetition?.id],
    enabled: !!selectedCompetition,
    retry: false,
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["/api/messages/unread/count"],
    retry: false,
  });

  // Mock data
  const mockCompetitions: Competition[] = competitions || [
    {
      id: "comp1",
      title: "Best Content Creator Photo Contest",
      description: "Show us your most creative and artistic photo! Winner gets $500 cash prize plus feature on our main page.",
      creatorId: "admin",
      creatorName: "FanzLab Official",
      creatorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      coverUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop",
      type: "contest",
      category: "photography",
      status: "live",
      startDate: "2024-01-15T00:00:00Z",
      endDate: "2024-01-30T23:59:59Z",
      totalPrizeValue: 1000,
      entryFee: 5,
      maxParticipants: 500,
      currentParticipants: 234,
      requirements: ["Original photo", "HD quality", "No watermarks", "Must be content creator"],
      prizes: [
        { position: 1, title: "Winner", value: 500, description: "Cash prize + main page feature" },
        { position: 2, title: "Runner-up", value: 300, description: "Cash prize + social media feature" },
        { position: 3, title: "Third Place", value: 200, description: "Cash prize + profile badge" }
      ],
      tags: ["photography", "creative", "featured"],
      isEntered: false,
      isSponsored: true,
      viewCount: 15420,
      entryCount: 234
    },
    {
      id: "comp2",
      title: "Emma's VIP Experience Raffle",
      description: "Win an exclusive 1-on-1 video call with Emma Rose! Only 100 tickets available.",
      creatorId: "creator1",
      creatorName: "Emma Rose",
      creatorAvatar: "https://images.unsplash.com/photo-1494790108344-b2ee30e40a34?w=100&h=100&fit=crop&crop=face",
      coverUrl: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&h=600&fit=crop",
      type: "raffle",
      category: "experience",
      status: "live",
      startDate: "2024-01-20T00:00:00Z",
      endDate: "2024-01-25T23:59:59Z",
      totalPrizeValue: 500,
      entryFee: 10,
      maxParticipants: 100,
      currentParticipants: 67,
      requirements: ["Must be subscribed", "Account older than 30 days"],
      prizes: [
        { position: 1, title: "VIP Winner", value: 500, description: "Private 30-min video call + signed merchandise" }
      ],
      tags: ["vip", "exclusive", "personal"],
      isEntered: true,
      isSponsored: false,
      viewCount: 8930,
      entryCount: 67
    },
    {
      id: "comp3",
      title: "Dance Challenge Giveaway",
      description: "Submit your best dance video using Sophia's signature moves! Multiple winners and amazing prizes.",
      creatorId: "creator2",
      creatorName: "Sophia Luna",
      creatorAvatar: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=100&h=100&fit=crop&crop=face",
      coverUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop",
      type: "challenge",
      category: "dance",
      status: "upcoming",
      startDate: "2024-02-01T00:00:00Z",
      endDate: "2024-02-14T23:59:59Z",
      totalPrizeValue: 2000,
      maxParticipants: 1000,
      currentParticipants: 156,
      requirements: ["Submit video under 60 seconds", "Use original audio", "Include #DanceSophia"],
      prizes: [
        { position: 1, title: "Grand Prize", value: 1000, description: "Cash + collaboration opportunity" },
        { position: 2, title: "Second Place", value: 500, description: "Cash + merchandise bundle" },
        { position: 3, title: "Third Place", value: 300, description: "Cash + exclusive content access" },
        { position: 4, title: "Participation Prize", value: 200, description: "10 random participants get gift cards" }
      ],
      tags: ["dance", "video", "challenge"],
      isEntered: false,
      isSponsored: false,
      viewCount: 12450,
      entryCount: 156
    }
  ];

  const mockEntries: CompetitionEntry[] = competitionEntries || [
    {
      id: "entry1",
      competitionId: "comp1",
      userId: "user1",
      username: "PhotoPro23",
      userAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face",
      submissionUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=600&fit=crop",
      submissionText: "My artistic interpretation of modern beauty",
      submittedAt: "2024-01-18T15:30:00Z",
      votes: 234,
      position: 1
    },
    {
      id: "entry2",
      competitionId: "comp1",
      userId: "user2",
      username: "CreativeVisual",
      userAvatar: "https://images.unsplash.com/photo-1494790108344-b2ee30e40a34?w=50&h=50&fit=crop&crop=face",
      submissionUrl: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=600&fit=crop",
      submissionText: "Capturing the essence of creativity",
      submittedAt: "2024-01-19T10:15:00Z",
      votes: 189,
      position: 2
    }
  ];

  const categories = [
    { id: "all", name: "All Categories", count: 23 },
    { id: "photography", name: "Photography", count: 8 },
    { id: "dance", name: "Dance", count: 5 },
    { id: "experience", name: "Experiences", count: 4 },
    { id: "creative", name: "Creative", count: 6 }
  ];

  const types = [
    { id: "all", name: "All Types", count: 23 },
    { id: "contest", name: "Contests", count: 8 },
    { id: "raffle", name: "Raffles", count: 7 },
    { id: "giveaway", name: "Giveaways", count: 5 },
    { id: "challenge", name: "Challenges", count: 3 }
  ];

  const enterCompetition = (competition: Competition) => {
    // Handle competition entry
    console.log("Entering competition:", competition.id);
  };

  const filteredCompetitions = mockCompetitions.filter(comp => {
    if (searchQuery && !comp.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (selectedCategory !== "all" && comp.category !== selectedCategory) return false;
    if (selectedType !== "all" && comp.type !== selectedType) return false;
    return true;
  });

  const liveCompetitions = filteredCompetitions.filter(comp => comp.status === "live");
  const upcomingCompetitions = filteredCompetitions.filter(comp => comp.status === "upcoming");
  const endedCompetitions = filteredCompetitions.filter(comp => comp.status === "ended");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "live": return "bg-green-600";
      case "upcoming": return "bg-blue-600";
      case "ended": return "bg-gray-600";
      default: return "bg-gray-600";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "contest": return Trophy;
      case "raffle": return Ticket;
      case "giveaway": return Gift;
      case "challenge": return Target;
      default: return Trophy;
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
              <Trophy className="w-8 h-8 mr-3 text-primary" />
              FanzCompete
            </h1>
            <p className="text-gray-400">Competitions, contests, and giveaways from creators</p>
          </div>
          
          {user?.role === 'creator' && (
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-primary to-secondary hover:from-purple-600 hover:to-pink-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Competition
            </Button>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search competitions, creators, prizes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-gray-800 border-gray-700 pl-12 py-3 text-white placeholder-gray-400 text-lg"
            data-testid="input-competition-search"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="live" className="space-y-6">
              <TabsList className="bg-gray-800 border border-gray-700 p-1">
                <TabsTrigger value="live" className="flex items-center" data-testid="tab-live">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                  Live ({liveCompetitions.length})
                </TabsTrigger>
                <TabsTrigger value="upcoming" className="flex items-center" data-testid="tab-upcoming">
                  <Calendar className="w-4 h-4 mr-2" />
                  Upcoming ({upcomingCompetitions.length})
                </TabsTrigger>
                <TabsTrigger value="trending" className="flex items-center" data-testid="tab-trending">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Trending
                </TabsTrigger>
                <TabsTrigger value="my-entries" className="flex items-center" data-testid="tab-my-entries">
                  <Star className="w-4 h-4 mr-2" />
                  My Entries
                </TabsTrigger>
              </TabsList>

              {/* Live Competitions */}
              <TabsContent value="live" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {liveCompetitions.map((competition) => {
                    const TypeIcon = getTypeIcon(competition.type);
                    const daysLeft = Math.ceil((new Date(competition.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    
                    return (
                      <Card key={competition.id} className="bg-gray-800 border-gray-700 overflow-hidden hover:shadow-xl transition-all">
                        <div className="relative">
                          <img
                            src={competition.coverUrl}
                            alt={competition.title}
                            className="w-full h-48 object-cover"
                          />
                          
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                          
                          {/* Status Badge */}
                          <div className="absolute top-3 left-3">
                            <Badge className={`${getStatusColor(competition.status)} text-white`}>
                              <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-1"></div>
                              LIVE
                            </Badge>
                          </div>

                          {/* Type Badge */}
                          <div className="absolute top-3 right-3">
                            <Badge className="bg-primary text-white">
                              <TypeIcon className="w-3 h-3 mr-1" />
                              {competition.type.toUpperCase()}
                            </Badge>
                          </div>

                          {/* Prize Value */}
                          <div className="absolute bottom-3 right-3 bg-black/60 px-3 py-1 rounded-lg">
                            <span className="text-yellow-400 font-bold flex items-center">
                              <DollarSign className="w-4 h-4 mr-1" />
                              {competition.totalPrizeValue.toLocaleString()}
                            </span>
                          </div>

                          {/* Time Left */}
                          <div className="absolute bottom-3 left-3 bg-black/60 px-3 py-1 rounded-lg">
                            <span className="text-white text-sm flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {daysLeft} days left
                            </span>
                          </div>
                        </div>

                        <CardContent className="p-6">
                          <div className="flex items-center space-x-3 mb-4">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={competition.creatorAvatar} alt={competition.creatorName} />
                              <AvatarFallback>{competition.creatorName[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-white font-medium">{competition.creatorName}</p>
                              <p className="text-gray-400 text-sm">{competition.category}</p>
                            </div>
                            {competition.isSponsored && (
                              <Badge className="bg-yellow-600 text-white">
                                <Crown className="w-3 h-3 mr-1" />
                                SPONSORED
                              </Badge>
                            )}
                          </div>
                          
                          <h3 className="text-white font-semibold text-lg mb-2 line-clamp-2">{competition.title}</h3>
                          <p className="text-gray-300 text-sm mb-4 line-clamp-2">{competition.description}</p>
                          
                          {/* Participants Progress */}
                          <div className="mb-4">
                            <div className="flex justify-between text-sm text-gray-400 mb-2">
                              <span>Participants</span>
                              <span>{competition.currentParticipants}{competition.maxParticipants && ` / ${competition.maxParticipants}`}</span>
                            </div>
                            <Progress 
                              value={competition.maxParticipants ? (competition.currentParticipants / competition.maxParticipants) * 100 : 0} 
                              className="h-2"
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-xs text-gray-400">
                              <span className="flex items-center">
                                <Eye className="w-3 h-3 mr-1" />
                                {competition.viewCount.toLocaleString()}
                              </span>
                              <span className="flex items-center">
                                <Users className="w-3 h-3 mr-1" />
                                {competition.entryCount}
                              </span>
                            </div>
                            
                            <Button
                              onClick={() => enterCompetition(competition)}
                              disabled={competition.isEntered}
                              className={competition.isEntered ? "bg-gray-600" : "bg-primary hover:bg-primary/90"}
                              data-testid={`enter-competition-${competition.id}`}
                            >
                              {competition.isEntered ? "Entered" : `Enter ${competition.entryFee ? `($${competition.entryFee})` : "(Free)"}`}
                            </Button>
                          </div>

                          <div className="flex flex-wrap gap-1 mt-3">
                            {competition.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              {/* Upcoming Competitions */}
              <TabsContent value="upcoming" className="space-y-6">
                <div className="grid gap-4">
                  {upcomingCompetitions.map((competition) => {
                    const TypeIcon = getTypeIcon(competition.type);
                    const startsIn = Math.ceil((new Date(competition.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    
                    return (
                      <Card key={competition.id} className="bg-gray-800 border-gray-700">
                        <CardContent className="p-6">
                          <div className="flex items-center space-x-4">
                            <img
                              src={competition.coverUrl}
                              alt={competition.title}
                              className="w-24 h-16 rounded object-cover"
                            />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <Badge className="bg-blue-600 text-white">
                                  <TypeIcon className="w-3 h-3 mr-1" />
                                  {competition.type.toUpperCase()}
                                </Badge>
                                <Badge className="bg-yellow-600 text-white">
                                  <DollarSign className="w-3 h-3 mr-1" />
                                  ${competition.totalPrizeValue.toLocaleString()}
                                </Badge>
                              </div>
                              <h4 className="text-white font-semibold mb-1">{competition.title}</h4>
                              <p className="text-gray-400 text-sm mb-2">{competition.creatorName}</p>
                              <div className="flex items-center space-x-4 text-xs text-gray-400">
                                <span className="flex items-center">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  Starts in {startsIn} days
                                </span>
                                <span className="flex items-center">
                                  <Users className="w-3 h-3 mr-1" />
                                  {competition.currentParticipants} interested
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col space-y-2">
                              <Button size="sm" variant="outline">
                                <Bell className="w-4 h-4 mr-1" />
                                Remind Me
                              </Button>
                              <Button size="sm" className="bg-primary">
                                View Details
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              {/* Trending Competitions */}
              <TabsContent value="trending" className="space-y-6">
                <div className="grid gap-4">
                  {mockCompetitions.slice().sort((a, b) => b.viewCount - a.viewCount).map((competition, index) => {
                    const TypeIcon = getTypeIcon(competition.type);
                    
                    return (
                      <Card key={competition.id} className="bg-gray-800 border-gray-700">
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-full text-white font-bold">
                              {index + 1}
                            </div>
                            <img
                              src={competition.coverUrl}
                              alt={competition.title}
                              className="w-20 h-14 rounded object-cover"
                            />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <TypeIcon className="w-4 h-4 text-primary" />
                                <h4 className="text-white font-semibold">{competition.title}</h4>
                                <Badge className={`${getStatusColor(competition.status)} text-white text-xs`}>
                                  {competition.status.toUpperCase()}
                                </Badge>
                              </div>
                              <p className="text-gray-400 text-sm">{competition.creatorName}</p>
                              <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1">
                                <span className="flex items-center">
                                  <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                                  {competition.viewCount.toLocaleString()} views
                                </span>
                                <span className="flex items-center">
                                  <DollarSign className="w-3 h-3 mr-1 text-yellow-500" />
                                  ${competition.totalPrizeValue.toLocaleString()}
                                </span>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              className="bg-primary"
                              onClick={() => enterCompetition(competition)}
                            >
                              {competition.status === "live" ? "Enter" : "View"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              {/* My Entries */}
              <TabsContent value="my-entries" className="space-y-6">
                {user ? (
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-4">My Competition Entries</h3>
                    <div className="grid gap-4">
                      {mockEntries.map((entry) => {
                        const competition = mockCompetitions.find(c => c.id === entry.competitionId);
                        return (
                          <Card key={entry.id} className="bg-gray-800 border-gray-700">
                            <CardContent className="p-4">
                              <div className="flex items-center space-x-4">
                                {entry.submissionUrl && (
                                  <img
                                    src={entry.submissionUrl}
                                    alt="Entry submission"
                                    className="w-20 h-14 rounded object-cover"
                                  />
                                )}
                                <div className="flex-1">
                                  <h4 className="text-white font-semibold mb-1">{competition?.title}</h4>
                                  <p className="text-gray-400 text-sm mb-2">{entry.submissionText}</p>
                                  <div className="flex items-center space-x-4 text-xs text-gray-400">
                                    <span>Submitted {new Date(entry.submittedAt).toLocaleDateString()}</span>
                                    <span className="flex items-center">
                                      <Heart className="w-3 h-3 mr-1" />
                                      {entry.votes} votes
                                    </span>
                                    {entry.position && (
                                      <Badge className="bg-yellow-600 text-white">
                                        <Medal className="w-3 h-3 mr-1" />
                                        #{entry.position}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <Button size="sm" variant="outline">
                                  View Entry
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-8 text-center">
                      <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">Sign in to track your entries</h3>
                      <p className="text-gray-400 mb-4">
                        Create an account to participate in competitions and track your submissions
                      </p>
                      <Button onClick={() => window.location.href = '/api/login'}>
                        Sign In
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Category Filter */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Filter className="w-5 h-5 mr-2 text-primary" />
                  Categories
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left p-2 rounded-lg transition-colors flex items-center justify-between ${
                      selectedCategory === category.id 
                        ? 'bg-primary text-white' 
                        : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                    }`}
                    data-testid={`category-${category.id}`}
                  >
                    <span>{category.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {category.count}
                    </Badge>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Type Filter */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Trophy className="w-5 h-5 mr-2 text-primary" />
                  Types
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {types.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`w-full text-left p-2 rounded-lg transition-colors flex items-center justify-between ${
                      selectedType === type.id 
                        ? 'bg-primary text-white' 
                        : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                    }`}
                    data-testid={`type-${type.id}`}
                  >
                    <span>{type.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {type.count}
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
                  Competition Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Live Now</span>
                  <span className="font-semibold text-green-400 flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></div>
                    {liveCompetitions.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Prize Pool</span>
                  <span className="font-semibold text-white">
                    ${mockCompetitions.reduce((sum, c) => sum + c.totalPrizeValue, 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Active Participants</span>
                  <span className="font-semibold text-white">
                    {mockCompetitions.reduce((sum, c) => sum + c.currentParticipants, 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Upcoming Events</span>
                  <span className="font-semibold text-blue-400">{upcomingCompetitions.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}