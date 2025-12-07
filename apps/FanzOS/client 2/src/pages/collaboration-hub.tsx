import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DynamicCreatorCollaborationBubbles } from "@/components/creator-collaboration-bubbles";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  Sparkles,
  Calendar,
  DollarSign,
  Clock,
  Trophy,
  Camera,
  Video,
  TrendingUp,
  MessageCircle,
  Star,
  Zap
} from "lucide-react";

export default function CollaborationHub() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("browse");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");

  // Create collaboration opportunity state
  const [newOpportunity, setNewOpportunity] = useState({
    type: 'content_creation',
    title: '',
    description: '',
    requirements: [],
    duration: '',
    expectedEarnings: 0,
    deadline: '',
    difficulty: 'intermediate',
    tags: []
  });

  // Get collaboration statistics
  const { data: stats } = useQuery({
    queryKey: [`/api/collaborations/stats/${user?.id}`],
    enabled: !!user?.id,
  });

  // Get user's collaboration history
  const { data: myCollaborations } = useQuery({
    queryKey: [`/api/collaborations/user/${user?.id}`],
    enabled: !!user?.id && activeTab === "my-collaborations",
  });

  // Create collaboration mutation
  const createCollaborationMutation = useMutation({
    mutationFn: async (opportunityData: any) => {
      const response = await apiRequest('POST', '/api/collaborations/create', {
        ...opportunityData,
        creatorId: user?.id
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Collaboration Created!",
        description: "Your collaboration opportunity is now live.",
      });
      setNewOpportunity({
        type: 'content_creation',
        title: '',
        description: '',
        requirements: [],
        duration: '',
        expectedEarnings: 0,
        deadline: '',
        difficulty: 'intermediate',
        tags: []
      });
      queryClient.invalidateQueries({ queryKey: ['/api/collaborations/opportunities'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Sign in Required</h2>
            <p className="text-muted-foreground">
              Please sign in to access the Collaboration Hub
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleCreateCollaboration = () => {
    createCollaborationMutation.mutate(newOpportunity);
  };

  const collaborationTypes = [
    { value: 'live_stream', label: 'Live Stream', icon: Video },
    { value: 'content_creation', label: 'Content Creation', icon: Camera },
    { value: 'cross_promotion', label: 'Cross Promotion', icon: TrendingUp },
    { value: 'event', label: 'Event', icon: Calendar },
    { value: 'challenge', label: 'Challenge', icon: Trophy }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-6">
              <Users className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Collaboration Hub
            </h1>
            <p className="text-xl text-purple-100 mb-6 max-w-2xl mx-auto">
              Connect with fellow creators, join exciting collaborations, and grow your audience together
            </p>
            
            {/* Quick Stats */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Sparkles className="h-5 w-5 text-yellow-300" />
                    <span className="text-2xl font-bold">{stats.activeOpportunities}</span>
                  </div>
                  <p className="text-sm text-purple-100">Active Opportunities</p>
                </div>
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Trophy className="h-5 w-5 text-yellow-300" />
                    <span className="text-2xl font-bold">{stats.completedCollaborations}</span>
                  </div>
                  <p className="text-sm text-purple-100">Completed Collabs</p>
                </div>
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-green-300" />
                    <span className="text-2xl font-bold">${stats.totalEarnings}</span>
                  </div>
                  <p className="text-sm text-purple-100">Earned Together</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-7xl mx-auto">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="browse" className="flex items-center gap-2" data-testid="tab-browse">
              <Search className="h-4 w-4" />
              Browse
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2" data-testid="tab-create">
              <Plus className="h-4 w-4" />
              Create
            </TabsTrigger>
            <TabsTrigger value="my-collaborations" className="flex items-center gap-2" data-testid="tab-my-collaborations">
              <Users className="h-4 w-4" />
              My Collabs
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2" data-testid="tab-messages">
              <MessageCircle className="h-4 w-4" />
              Messages
            </TabsTrigger>
          </TabsList>

          {/* Browse Collaborations */}
          <TabsContent value="browse" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Discover Collaboration Opportunities
                </CardTitle>
                <CardDescription>
                  Find exciting projects to work on with other creators
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Search and Filter Bar */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <Label htmlFor="search">Search Opportunities</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search"
                        placeholder="Search by title, creator, or tags..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                        data-testid="search-collaborations"
                      />
                    </div>
                  </div>
                  
                  <div className="sm:w-48">
                    <Label htmlFor="filter">Filter by Type</Label>
                    <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                      <SelectTrigger data-testid="filter-collaborations">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {collaborationTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <DynamicCreatorCollaborationBubbles
              currentUserId={user.id}
              showAvailableOnly={true}
              maxBubbles={12}
            />
          </TabsContent>

          {/* Create Collaboration */}
          <TabsContent value="create" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Create New Collaboration
                </CardTitle>
                <CardDescription>
                  Post a collaboration opportunity for other creators to join
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="collab-type">Collaboration Type</Label>
                      <Select
                        value={newOpportunity.type}
                        onValueChange={(value) => setNewOpportunity({ ...newOpportunity, type: value })}
                      >
                        <SelectTrigger data-testid="select-collab-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {collaborationTypes.map((type) => {
                            const Icon = type.icon;
                            return (
                              <SelectItem key={type.value} value={type.value}>
                                <div className="flex items-center gap-2">
                                  <Icon className="h-4 w-4" />
                                  {type.label}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="collab-title">Title</Label>
                      <Input
                        id="collab-title"
                        placeholder="Give your collaboration an exciting title"
                        value={newOpportunity.title}
                        onChange={(e) => setNewOpportunity({ ...newOpportunity, title: e.target.value })}
                        data-testid="input-collab-title"
                      />
                    </div>

                    <div>
                      <Label htmlFor="collab-description">Description</Label>
                      <Textarea
                        id="collab-description"
                        placeholder="Describe what the collaboration involves, what you're looking for in a partner, and any specific requirements..."
                        rows={4}
                        value={newOpportunity.description}
                        onChange={(e) => setNewOpportunity({ ...newOpportunity, description: e.target.value })}
                        data-testid="textarea-collab-description"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="collab-duration">Duration</Label>
                      <Input
                        id="collab-duration"
                        placeholder="e.g., 2 hours, 1 week, ongoing"
                        value={newOpportunity.duration}
                        onChange={(e) => setNewOpportunity({ ...newOpportunity, duration: e.target.value })}
                        data-testid="input-collab-duration"
                      />
                    </div>

                    <div>
                      <Label htmlFor="collab-earnings">Expected Earnings (USD)</Label>
                      <Input
                        id="collab-earnings"
                        type="number"
                        placeholder="0"
                        value={newOpportunity.expectedEarnings}
                        onChange={(e) => setNewOpportunity({ ...newOpportunity, expectedEarnings: parseFloat(e.target.value) || 0 })}
                        data-testid="input-collab-earnings"
                      />
                    </div>

                    <div>
                      <Label htmlFor="collab-deadline">Deadline</Label>
                      <Input
                        id="collab-deadline"
                        type="datetime-local"
                        value={newOpportunity.deadline}
                        onChange={(e) => setNewOpportunity({ ...newOpportunity, deadline: e.target.value })}
                        data-testid="input-collab-deadline"
                      />
                    </div>

                    <div>
                      <Label htmlFor="collab-difficulty">Difficulty Level</Label>
                      <Select
                        value={newOpportunity.difficulty}
                        onValueChange={(value) => setNewOpportunity({ ...newOpportunity, difficulty: value })}
                      >
                        <SelectTrigger data-testid="select-collab-difficulty">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner Friendly</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button
                    onClick={handleCreateCollaboration}
                    disabled={!newOpportunity.title || !newOpportunity.description || createCollaborationMutation.isPending}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    data-testid="create-collaboration"
                  >
                    {createCollaborationMutation.isPending ? (
                      "Creating..."
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        Create Collaboration
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Collaborations */}
          <TabsContent value="my-collaborations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  My Collaborations
                </CardTitle>
                <CardDescription>
                  Track your ongoing and completed collaborations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {myCollaborations && myCollaborations.length > 0 ? (
                  <div className="space-y-4">
                    {myCollaborations.map((collab: any) => (
                      <Card key={collab.id} className="border-l-4 border-l-purple-500">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold">{collab.title}</h3>
                                <Badge className={
                                  collab.status === 'completed' ? 'bg-green-100 text-green-700' :
                                  collab.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                  'bg-yellow-100 text-yellow-700'
                                }>
                                  {collab.status.replace('_', ' ')}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {collab.description}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {collab.duration}
                                </span>
                                <span className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  ${collab.expectedEarnings}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {collab.participants?.length || 0} participants
                                </span>
                              </div>
                            </div>
                            
                            <Button size="sm" variant="outline" data-testid={`view-collab-${collab.id}`}>
                              View Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No collaborations yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start by browsing available opportunities or create your own
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button onClick={() => setActiveTab("browse")} variant="outline" data-testid="browse-opportunities">
                        Browse Opportunities
                      </Button>
                      <Button onClick={() => setActiveTab("create")} data-testid="create-opportunity">
                        Create Opportunity
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Collaboration Messages */}
          <TabsContent value="messages" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Collaboration Messages
                </CardTitle>
                <CardDescription>
                  Communicate with your collaboration partners
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Message Center Coming Soon</h3>
                  <p className="text-muted-foreground">
                    Direct messaging with collaboration partners will be available soon
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}