import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Users, 
  Star, 
  MessageCircle, 
  Heart, 
  Zap, 
  Trophy,
  Camera,
  Video,
  Mic,
  Calendar,
  Clock,
  DollarSign,
  TrendingUp,
  Sparkles
} from "lucide-react";

interface Creator {
  id: string;
  displayName: string;
  username: string;
  avatar?: string;
  followers: number;
  specialties: string[];
  collaborationScore: number;
  isOnline: boolean;
  responseTime: string;
  rating: number;
}

interface CollaborationOpportunity {
  id: string;
  type: 'live_stream' | 'content_creation' | 'cross_promotion' | 'event' | 'challenge';
  title: string;
  description: string;
  creators: Creator[];
  requirements: string[];
  duration: string;
  expectedEarnings: number;
  deadline: Date;
  status: 'open' | 'in_progress' | 'completed';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
}

interface DynamicCreatorCollaborationProps {
  currentUserId: string;
  showAvailableOnly?: boolean;
  maxBubbles?: number;
}

const COLLABORATION_TYPES = {
  live_stream: { icon: Video, color: 'bg-red-100 text-red-600', label: 'Live Stream' },
  content_creation: { icon: Camera, color: 'bg-blue-100 text-blue-600', label: 'Content' },
  cross_promotion: { icon: TrendingUp, color: 'bg-green-100 text-green-600', label: 'Promotion' },
  event: { icon: Calendar, color: 'bg-purple-100 text-purple-600', label: 'Event' },
  challenge: { icon: Trophy, color: 'bg-yellow-100 text-yellow-600', label: 'Challenge' }
};

const DIFFICULTY_COLORS = {
  beginner: 'bg-green-100 text-green-700 border-green-200',
  intermediate: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  advanced: 'bg-red-100 text-red-700 border-red-200'
};

export function DynamicCreatorCollaborationBubbles({
  currentUserId,
  showAvailableOnly = false,
  maxBubbles = 6
}: DynamicCreatorCollaborationProps) {
  const [selectedOpportunity, setSelectedOpportunity] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  // Get collaboration opportunities
  const { data: opportunities, isLoading } = useQuery({
    queryKey: ['/api/collaborations/opportunities', { userId: currentUserId, filter, showAvailableOnly }],
    staleTime: 60000, // 1 minute
  });

  // Join collaboration mutation
  const joinMutation = useMutation({
    mutationFn: async (opportunityId: string) => {
      const response = await apiRequest('POST', `/api/collaborations/${opportunityId}/join`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/collaborations/opportunities'] });
    },
  });

  const getTimeRemaining = (deadline: Date) => {
    const now = new Date();
    const diff = new Date(deadline).getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return 'Soon';
  };

  const filteredOpportunities = opportunities?.slice(0, maxBubbles) || [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {['all', 'live_stream', 'content_creation', 'cross_promotion', 'event', 'challenge'].map((type) => (
          <Button
            key={type}
            variant={filter === type ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(type)}
            className={cn(
              "transition-all duration-200",
              filter === type && "bg-gradient-to-r from-purple-500 to-pink-500"
            )}
            data-testid={`filter-${type}`}
          >
            {type === 'all' ? 'All' : COLLABORATION_TYPES[type as keyof typeof COLLABORATION_TYPES]?.label}
          </Button>
        ))}
      </div>

      {/* Collaboration Bubbles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOpportunities.map((opportunity: CollaborationOpportunity) => {
          const TypeIcon = COLLABORATION_TYPES[opportunity.type]?.icon || Users;
          const typeStyle = COLLABORATION_TYPES[opportunity.type]?.color || 'bg-gray-100 text-gray-600';
          
          return (
            <Card 
              key={opportunity.id}
              className={cn(
                "relative overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg border-2",
                selectedOpportunity === opportunity.id && "ring-2 ring-purple-500 border-purple-300",
                opportunity.status === 'open' && "border-green-200",
                opportunity.status === 'in_progress' && "border-yellow-200"
              )}
              onClick={() => setSelectedOpportunity(
                selectedOpportunity === opportunity.id ? null : opportunity.id
              )}
              data-testid={`collaboration-bubble-${opportunity.id}`}
            >
              {/* Status indicator */}
              <div className={cn(
                "absolute top-2 right-2 w-3 h-3 rounded-full",
                opportunity.status === 'open' && "bg-green-400 animate-pulse",
                opportunity.status === 'in_progress' && "bg-yellow-400",
                opportunity.status === 'completed' && "bg-gray-400"
              )} />

              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className={cn("p-2 rounded-lg", typeStyle)}>
                    <TypeIcon className="h-5 w-5" />
                  </div>
                  <Badge className={cn("text-xs", DIFFICULTY_COLORS[opportunity.difficulty])}>
                    {opportunity.difficulty}
                  </Badge>
                </div>
                
                <CardTitle className="text-lg leading-tight">
                  {opportunity.title}
                </CardTitle>
                <CardDescription className="text-sm line-clamp-2">
                  {opportunity.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Creator Avatars */}
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {opportunity.creators.slice(0, 3).map((creator, index) => (
                      <Avatar 
                        key={creator.id} 
                        className={cn(
                          "border-2 border-white h-8 w-8",
                          creator.isOnline && "ring-2 ring-green-400"
                        )}
                      >
                        <AvatarImage src={creator.avatar} />
                        <AvatarFallback className="text-xs">
                          {creator.displayName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {opportunity.creators.length > 3 && (
                      <div className="h-8 w-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center">
                        <span className="text-xs font-medium">+{opportunity.creators.length - 3}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {getTimeRemaining(opportunity.deadline)}
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {opportunity.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs px-2 py-0.5">
                      {tag}
                    </Badge>
                  ))}
                  {opportunity.tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs px-2 py-0.5">
                      +{opportunity.tags.length - 3}
                    </Badge>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3 text-green-500" />
                    <span className="font-medium">${opportunity.expectedEarnings}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-blue-500" />
                    <span>{opportunity.duration}</span>
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedOpportunity === opportunity.id && (
                  <div className="space-y-3 pt-3 border-t animate-in slide-in-from-top-2">
                    <div>
                      <h4 className="font-medium text-sm mb-2">Requirements:</h4>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {opportunity.requirements.map((req, index) => (
                          <li key={index} className="flex items-start gap-1">
                            <span className="text-purple-500">•</span>
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm mb-2">Collaborators:</h4>
                      <div className="space-y-2">
                        {opportunity.creators.map((creator) => (
                          <div key={creator.id} className="flex items-center gap-2 text-xs">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={creator.avatar} />
                              <AvatarFallback className="text-xs">
                                {creator.displayName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{creator.displayName}</span>
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-500" />
                              <span>{creator.rating}</span>
                            </div>
                            {creator.isOnline && (
                              <Badge variant="secondary" className="text-xs">Online</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {opportunity.status === 'open' && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          joinMutation.mutate(opportunity.id);
                        }}
                        disabled={joinMutation.isPending}
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                        data-testid={`join-collaboration-${opportunity.id}`}
                      >
                        {joinMutation.isPending ? (
                          "Joining..."
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Join Collaboration
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredOpportunities.length === 0 && (
        <Card className="text-center py-8">
          <CardContent>
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No collaborations available</h3>
            <p className="text-muted-foreground">
              Check back later for new collaboration opportunities!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Floating collaboration notification
export function CollaborationNotification({ 
  opportunity, 
  onAccept, 
  onDecline 
}: { 
  opportunity: CollaborationOpportunity;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <Card className="fixed bottom-4 right-4 w-80 shadow-lg border-2 border-purple-200 z-50 animate-in slide-in-from-bottom-2">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-sm">New Collaboration!</CardTitle>
            <CardDescription className="text-xs">{opportunity.title}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {opportunity.description}
        </p>
        
        <div className="flex gap-2">
          <Button size="sm" onClick={onAccept} className="flex-1">
            Accept
          </Button>
          <Button size="sm" variant="outline" onClick={onDecline} className="flex-1">
            Decline
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}