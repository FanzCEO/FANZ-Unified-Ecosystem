import { useState } from "react";
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
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Crown,
  Star,
  Users,
  Clock,
  Calendar,
  Gift,
  Heart,
  Image,
  Video,
  Play,
  Award,
  Medal,
  Target,
  Flame,
  Sparkles,
  DollarSign,
  Vote,
  TrendingUp,
  Timer,
  Plus,
  Upload,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { Link } from "wouter";

interface Contest {
  id: string;
  title: string;
  description: string;
  type: "photo" | "video" | "popularity" | "creativity" | "themed";
  status: "upcoming" | "active" | "voting" | "ended";
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  banner: string;
  startDate: string;
  endDate: string;
  votingEndDate: string;
  prizePool: number;
  entryFee: number;
  entries: number;
  maxEntries?: number;
  prizes: {
    position: number;
    amount: number;
    description: string;
  }[];
  rules: string[];
  tags: string[];
  userEntered: boolean;
  userVoted: boolean;
}

interface ContestEntry {
  id: string;
  contestId: string;
  userId: string;
  username: string;
  userAvatar: string;
  title: string;
  description: string;
  mediaUrl: string;
  mediaType: "photo" | "video";
  votes: number;
  rank: number;
  submittedAt: string;
  hasVoted: boolean;
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar: string;
  contestsWon: number;
  totalEarnings: number;
  votes: number;
  badge?: string;
}

export default function Contests() {
  const { user } = useAuth() as { user: User | undefined };
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedContest, setSelectedContest] = useState<Contest | null>(null);
  const [showEntryDialog, setShowEntryDialog] = useState(false);
  const [entryTitle, setEntryTitle] = useState("");
  const [entryDescription, setEntryDescription] = useState("");
  const [selectedTab, setSelectedTab] = useState("active");

  // Fetch contests
  const { data: contests, isLoading: contestsLoading } = useQuery<Contest[]>({
    queryKey: ["/api/contests"],
  });

  // Fetch leaderboard
  const { data: leaderboard } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/contests/leaderboard"],
  });

  // Mock data for demonstration
  const mockContests: Contest[] = contests || [
    {
      id: "1",
      title: "Summer Vibes Photo Contest",
      description: "Show us your best summer-themed content! Beach, pool, vacation - anything that captures the summer spirit.",
      type: "photo",
      status: "active",
      creatorId: "creator1",
      creatorName: "Emma Rose",
      creatorAvatar: "https://images.unsplash.com/photo-1494790108344-b2ee30e40a34?w=100&h=100&fit=crop&crop=face",
      banner: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=400&fit=crop",
      startDate: "2024-01-15",
      endDate: "2024-01-30",
      votingEndDate: "2024-02-05",
      prizePool: 1000,
      entryFee: 10,
      entries: 45,
      maxEntries: 100,
      prizes: [
        { position: 1, amount: 500, description: "Grand Prize + Feature" },
        { position: 2, amount: 300, description: "Second Place" },
        { position: 3, amount: 200, description: "Third Place" }
      ],
      rules: [
        "Must be original content",
        "Summer theme required",
        "One entry per person",
        "No explicit content"
      ],
      tags: ["summer", "photo", "beach"],
      userEntered: false,
      userVoted: false
    },
    {
      id: "2",
      title: "Best Dance Video Challenge",
      description: "Show off your moves! Create an original dance video and compete for amazing prizes.",
      type: "video",
      status: "voting",
      creatorId: "creator2",
      creatorName: "Sophia Luna",
      creatorAvatar: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=100&h=100&fit=crop&crop=face",
      banner: "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=1200&h=400&fit=crop",
      startDate: "2024-01-01",
      endDate: "2024-01-20",
      votingEndDate: "2024-01-25",
      prizePool: 2000,
      entryFee: 15,
      entries: 89,
      prizes: [
        { position: 1, amount: 1000, description: "Champion + Collab" },
        { position: 2, amount: 600, description: "Runner Up" },
        { position: 3, amount: 400, description: "Third Place" }
      ],
      rules: [
        "Original choreography",
        "Max 60 seconds",
        "Use contest hashtag",
        "Family-friendly content"
      ],
      tags: ["dance", "video", "challenge"],
      userEntered: true,
      userVoted: false
    },
    {
      id: "3",
      title: "Creative Art Showcase",
      description: "Artists unite! Submit your most creative artwork for a chance to win and be featured.",
      type: "creativity",
      status: "upcoming",
      creatorId: "creator3",
      creatorName: "Isabella Star",
      creatorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
      banner: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200&h=400&fit=crop",
      startDate: "2024-02-01",
      endDate: "2024-02-15",
      votingEndDate: "2024-02-20",
      prizePool: 1500,
      entryFee: 20,
      entries: 0,
      maxEntries: 50,
      prizes: [
        { position: 1, amount: 750, description: "Best Artist Award" },
        { position: 2, amount: 450, description: "Silver Medal" },
        { position: 3, amount: 300, description: "Bronze Medal" }
      ],
      rules: [
        "Any art medium accepted",
        "Must be original work",
        "High-quality submissions only",
        "Artist statement required"
      ],
      tags: ["art", "creative", "showcase"],
      userEntered: false,
      userVoted: false
    }
  ];

  const mockLeaderboard: LeaderboardEntry[] = leaderboard || [
    {
      rank: 1,
      userId: "user1",
      username: "artmaster",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face",
      contestsWon: 12,
      totalEarnings: 5670,
      votes: 23456,
      badge: "🏆"
    },
    {
      rank: 2,
      userId: "user2",
      username: "creativequeen",
      avatar: "https://images.unsplash.com/photo-1494790108344-b2ee30e40a34?w=100&h=100&fit=crop&crop=face",
      contestsWon: 8,
      totalEarnings: 3890,
      votes: 18234,
      badge: "🥈"
    },
    {
      rank: 3,
      userId: "user3",
      username: "photoking",
      avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop&crop=face",
      contestsWon: 6,
      totalEarnings: 2340,
      votes: 15678,
      badge: "🥉"
    }
  ];

  const mockEntries: ContestEntry[] = [
    {
      id: "entry1",
      contestId: "2",
      userId: "user1",
      username: "dancer123",
      userAvatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop&crop=face",
      title: "Sunset Groove",
      description: "My original choreography inspired by sunset vibes",
      mediaUrl: "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=600&h=800&fit=crop",
      mediaType: "video",
      votes: 234,
      rank: 1,
      submittedAt: "2024-01-18",
      hasVoted: false
    },
    {
      id: "entry2",
      contestId: "2",
      userId: "user2",
      username: "moveit",
      userAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
      title: "Electric Energy",
      description: "High energy dance routine",
      mediaUrl: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&h=800&fit=crop",
      mediaType: "video",
      votes: 189,
      rank: 2,
      submittedAt: "2024-01-17",
      hasVoted: false
    }
  ];

  const enterContestMutation = useMutation({
    mutationFn: async (contestId: string) => {
      const response = await apiRequest("POST", `/api/contests/${contestId}/enter`, {
        title: entryTitle,
        description: entryDescription
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contests"] });
      setShowEntryDialog(false);
      setEntryTitle("");
      setEntryDescription("");
      toast({
        title: "Entry submitted",
        description: "Your contest entry has been submitted successfully!",
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
        title: "Failed to enter contest",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const voteForEntryMutation = useMutation({
    mutationFn: async ({ contestId, entryId }: { contestId: string; entryId: string }) => {
      const response = await apiRequest("POST", `/api/contests/${contestId}/vote`, { entryId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contests"] });
      toast({
        title: "Vote submitted",
        description: "Your vote has been recorded!",
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
        title: "Failed to vote",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case "active": return "bg-green-900 text-green-400";
      case "voting": return "bg-blue-900 text-blue-400";
      case "upcoming": return "bg-yellow-900 text-yellow-400";
      case "ended": return "bg-gray-700 text-gray-400";
      default: return "bg-gray-700 text-gray-400";
    }
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case "photo": return <Image className="w-4 h-4" />;
      case "video": return <Video className="w-4 h-4" />;
      case "popularity": return <TrendingUp className="w-4 h-4" />;
      case "creativity": return <Sparkles className="w-4 h-4" />;
      case "themed": return <Star className="w-4 h-4" />;
      default: return <Trophy className="w-4 h-4" />;
    }
  };

  const filteredContests = mockContests.filter(contest => {
    if (selectedTab === "all") return true;
    return contest.status === selectedTab;
  });

  if (contestsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
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
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center" data-testid="text-contests-title">
                <Trophy className="w-8 h-8 mr-3 text-yellow-500" />
                Contests & Challenges
              </h1>
              <p className="text-gray-400">Compete, win prizes, and showcase your talent</p>
            </div>
            {user?.role === "creator" && (
              <Button className="bg-gradient-to-r from-primary to-secondary hover:from-purple-600 hover:to-pink-600">
                <Plus className="w-4 h-4 mr-2" />
                Create Contest
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-white" data-testid="text-active-contests">
                    {mockContests.filter(c => c.status === "active").length}
                  </p>
                  <p className="text-xs text-gray-400">Active Contests</p>
                </div>
                <Flame className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-white" data-testid="text-total-prizes">
                    ${mockContests.reduce((sum, c) => sum + c.prizePool, 0)}
                  </p>
                  <p className="text-xs text-gray-400">Total Prizes</p>
                </div>
                <Gift className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-white" data-testid="text-total-participants">
                    {mockContests.reduce((sum, c) => sum + c.entries, 0)}
                  </p>
                  <p className="text-xs text-gray-400">Participants</p>
                </div>
                <Users className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-white" data-testid="text-your-wins">
                    3
                  </p>
                  <p className="text-xs text-gray-400">Your Wins</p>
                </div>
                <Crown className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contests List */}
          <div className="lg:col-span-2">
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="bg-gray-800 border border-gray-700 mb-6">
                <TabsTrigger value="all" data-testid="tab-all">All</TabsTrigger>
                <TabsTrigger value="active" data-testid="tab-active">Active</TabsTrigger>
                <TabsTrigger value="voting" data-testid="tab-voting">Voting</TabsTrigger>
                <TabsTrigger value="upcoming" data-testid="tab-upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="ended" data-testid="tab-ended">Ended</TabsTrigger>
              </TabsList>

              <div className="space-y-4">
                {filteredContests.map((contest) => (
                  <Card key={contest.id} className="bg-gray-800 border-gray-700 overflow-hidden">
                    <div className="relative h-48">
                      <img
                        src={contest.banner}
                        alt={contest.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent" />
                      <Badge className={`absolute top-4 right-4 ${getStatusColor(contest.status)}`}>
                        {contest.status}
                      </Badge>
                    </div>
                    
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-bold text-white mb-2">{contest.title}</h3>
                          <p className="text-gray-400 text-sm mb-3">{contest.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 mb-4">
                        <div className="flex items-center space-x-2">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={contest.creatorAvatar} alt={contest.creatorName} />
                            <AvatarFallback>{contest.creatorName[0]}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-gray-400">by {contest.creatorName}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-sm text-gray-400">
                          {getTypeIcon(contest.type)}
                          <span className="capitalize">{contest.type}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-2xl font-bold text-green-500">${contest.prizePool}</p>
                          <p className="text-xs text-gray-400">Prize Pool</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-white">{contest.entries}</p>
                          <p className="text-xs text-gray-400">Entries</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-white">${contest.entryFee}</p>
                          <p className="text-xs text-gray-400">Entry Fee</p>
                        </div>
                      </div>

                      {contest.status === "voting" && (
                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-400">Voting Progress</span>
                            <span className="text-white">3 days left</span>
                          </div>
                          <Progress value={60} className="h-2" />
                        </div>
                      )}

                      <div className="flex space-x-2">
                        {contest.status === "active" && !contest.userEntered && (
                          <Dialog open={showEntryDialog && selectedContest?.id === contest.id} onOpenChange={(open) => {
                            setShowEntryDialog(open);
                            if (open) setSelectedContest(contest);
                          }}>
                            <DialogTrigger asChild>
                              <Button className="flex-1 bg-gradient-to-r from-primary to-secondary hover:from-purple-600 hover:to-pink-600">
                                <Trophy className="w-4 h-4 mr-2" />
                                Enter Contest
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-gray-800 border-gray-700">
                              <DialogHeader>
                                <DialogTitle className="text-white">Enter Contest</DialogTitle>
                                <DialogDescription className="text-gray-400">
                                  Submit your entry for {contest.title}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="title" className="text-white">Entry Title</Label>
                                  <Input
                                    id="title"
                                    value={entryTitle}
                                    onChange={(e) => setEntryTitle(e.target.value)}
                                    className="bg-gray-700 border-gray-600 text-white"
                                    placeholder="Give your entry a title"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="description" className="text-white">Description</Label>
                                  <Textarea
                                    id="description"
                                    value={entryDescription}
                                    onChange={(e) => setEntryDescription(e.target.value)}
                                    className="bg-gray-700 border-gray-600 text-white"
                                    placeholder="Describe your entry"
                                    rows={3}
                                  />
                                </div>
                                <div>
                                  <Label className="text-white">Upload Media</Label>
                                  <Button variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-gray-700">
                                    <Upload className="w-4 h-4 mr-2" />
                                    Choose File
                                  </Button>
                                </div>
                                <Button
                                  onClick={() => enterContestMutation.mutate(contest.id)}
                                  className="w-full bg-gradient-to-r from-primary to-secondary hover:from-purple-600 hover:to-pink-600"
                                  disabled={enterContestMutation.isPending}
                                >
                                  Submit Entry (${contest.entryFee} fee)
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                        
                        {contest.status === "voting" && (
                          <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                            <Vote className="w-4 h-4 mr-2" />
                            Vote Now
                          </Button>
                        )}
                        
                        {contest.userEntered && (
                          <Badge variant="secondary" className="bg-green-900 text-green-400">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Entered
                          </Badge>
                        )}
                        
                        <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </Tabs>
          </div>

          {/* Leaderboard */}
          <div>
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Medal className="w-5 h-5 mr-2 text-yellow-500" />
                  Top Competitors
                </CardTitle>
                <CardDescription className="text-gray-400">
                  All-time contest leaders
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {mockLeaderboard.map((entry) => (
                      <div
                        key={entry.userId}
                        className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">
                            {entry.badge || entry.rank}
                          </div>
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={entry.avatar} alt={entry.username} />
                            <AvatarFallback>{entry.username[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-white">@{entry.username}</p>
                            <div className="flex items-center space-x-2 text-xs text-gray-400">
                              <span>{entry.contestsWon} wins</span>
                              <span>•</span>
                              <span>${entry.totalEarnings}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="bg-gray-800 border-gray-700 mt-4">
              <CardHeader>
                <CardTitle className="text-white">Your Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Contests Entered</span>
                    <span className="text-white font-semibold">12</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Contests Won</span>
                    <span className="text-white font-semibold">3</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Total Earnings</span>
                    <span className="text-green-500 font-semibold">$890</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Win Rate</span>
                    <span className="text-white font-semibold">25%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}