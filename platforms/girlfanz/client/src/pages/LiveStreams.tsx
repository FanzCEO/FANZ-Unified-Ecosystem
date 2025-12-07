import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Video,
  Users,
  Calendar,
  Clock,
  DollarSign,
  Play,
  Radio,
  Eye,
  Heart,
  MessageCircle
} from "lucide-react";
import type { LiveStream } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface LiveStreamWithCreator extends LiveStream {
  creator: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
  };
}

export default function LiveStreams() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'live' | 'scheduled'>('all');

  // Fetch streams
  const { data: streams = [], isLoading } = useQuery<LiveStreamWithCreator[]>({
    queryKey: ['/api/streams', filter],
  });

  // Create stream mutation
  const createStreamMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      description: string;
      visibility: string;
      priceInCents?: number;
      scheduledAt?: string;
    }) => {
      const response = await apiRequest("POST", "/api/streams", data);
      return response.json();
    },
    onSuccess: () => {
      setIsCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/streams'] });
      toast({
        title: "Stream created",
        description: "Your live stream has been scheduled",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create stream",
        variant: "destructive",
      });
    },
  });

  const liveStreams = streams.filter(s => s.status === 'live');
  const scheduledStreams = streams.filter(s => s.status === 'scheduled');
  const endedStreams = streams.filter(s => s.status === 'ended');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return 'bg-red-500 animate-pulse';
      case 'scheduled':
        return 'bg-blue-500';
      case 'ended':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const StreamCard = ({ stream }: { stream: LiveStreamWithCreator }) => (
    <Card 
      className="bg-gf-charcoal/50 border-gf-steel/20 overflow-hidden hover:border-gf-cyber/50 transition-colors"
      data-testid={`card-stream-${stream.id}`}
    >
      <div className="relative">
        <img
          src={stream.thumbnailUrl || '/placeholder-stream.jpg'}
          alt={stream.title}
          className="w-full h-48 object-cover"
        />
        <Badge className={`absolute top-2 left-2 ${getStatusColor(stream.status)} text-white`}>
          {stream.status === 'live' && <Radio className="h-3 w-3 mr-1" />}
          {stream.status.toUpperCase()}
        </Badge>
        {stream.status === 'live' && (
          <Badge className="absolute top-2 right-2 bg-black/70 text-white">
            <Users className="h-3 w-3 mr-1" />
            {stream.viewerCount}
          </Badge>
        )}
        {stream.priceInCents && stream.priceInCents > 0 && (
          <Badge className="absolute bottom-2 right-2 bg-gf-cyber text-white">
            <DollarSign className="h-3 w-3 mr-1" />
            ${(stream.priceInCents / 100).toFixed(2)}
          </Badge>
        )}
      </div>

      <CardContent className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <img
            src={stream.creator.avatarUrl}
            alt={stream.creator.displayName}
            className="h-10 w-10 rounded-full object-cover"
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-gf-snow font-semibold truncate">{stream.title}</h3>
            <p className="text-gf-steel text-sm">@{stream.creator.username}</p>
          </div>
        </div>

        {stream.description && (
          <p className="text-gf-steel text-sm line-clamp-2 mb-3">
            {stream.description}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-gf-steel mb-3">
          {stream.status === 'scheduled' && stream.scheduledAt ? (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDistanceToNow(new Date(stream.scheduledAt), { addSuffix: true })}
            </div>
          ) : stream.status === 'live' ? (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Live now
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {stream.totalViews} views
            </div>
          )}
        </div>

        <Button
          className={`w-full ${
            stream.status === 'live'
              ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:opacity-90'
              : 'bg-gradient-to-r from-gf-cyber to-gf-pink hover:opacity-90'
          }`}
          data-testid={`button-watch-stream-${stream.id}`}
        >
          {stream.status === 'live' ? (
            <>
              <Play className="h-4 w-4 mr-2" />
              Watch Live
            </>
          ) : stream.status === 'scheduled' ? (
            <>
              <Calendar className="h-4 w-4 mr-2" />
              Set Reminder
            </>
          ) : (
            <>
              <Video className="h-4 w-4 mr-2" />
              Watch Replay
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gf-ink text-gf-snow p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gf-charcoal/50 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-80 bg-gf-charcoal/50 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gf-ink text-gf-snow p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 
              className="text-3xl font-bold bg-gradient-to-r from-gf-cyber to-gf-pink bg-clip-text text-transparent"
              data-testid="text-streams-title"
            >
              Live Streams
            </h1>
            <p className="text-gf-steel mt-1">Watch creators live or catch up on replays</p>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-gradient-to-r from-red-500 to-pink-500 hover:opacity-90"
                data-testid="button-create-stream"
              >
                <Radio className="h-4 w-4 mr-2" />
                Go Live
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gf-charcoal border-gf-steel/20 text-gf-snow">
              <DialogHeader>
                <DialogTitle>Create Live Stream</DialogTitle>
                <DialogDescription className="text-gf-steel">
                  Set up your live stream details
                </DialogDescription>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  createStreamMutation.mutate({
                    title: formData.get('title') as string,
                    description: formData.get('description') as string,
                    visibility: formData.get('visibility') as string,
                    priceInCents: formData.get('price') ? parseInt(formData.get('price') as string) * 100 : undefined,
                  });
                }}
                className="space-y-4"
              >
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    name="title"
                    required
                    placeholder="My Amazing Stream"
                    className="bg-gf-ink border-gf-steel/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    name="description"
                    placeholder="What will you be streaming?"
                    className="bg-gf-ink border-gf-steel/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Visibility</label>
                  <select
                    name="visibility"
                    className="w-full p-2 rounded bg-gf-ink border border-gf-steel/20"
                  >
                    <option value="free">Free (Anyone)</option>
                    <option value="subscriber">Subscribers Only</option>
                    <option value="paid">Pay-Per-View</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Price (PPV only)</label>
                  <Input
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="bg-gf-ink border-gf-steel/20"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-gf-cyber to-gf-pink"
                  disabled={createStreamMutation.isPending}
                >
                  {createStreamMutation.isPending ? "Creating..." : "Create Stream"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            className={filter === 'all' ? 'bg-gf-cyber' : 'border-gf-steel/20'}
            data-testid="button-filter-all"
          >
            All Streams
          </Button>
          <Button
            variant={filter === 'live' ? 'default' : 'outline'}
            onClick={() => setFilter('live')}
            className={filter === 'live' ? 'bg-red-500' : 'border-gf-steel/20'}
            data-testid="button-filter-live"
          >
            <Radio className="h-4 w-4 mr-2" />
            Live ({liveStreams.length})
          </Button>
          <Button
            variant={filter === 'scheduled' ? 'default' : 'outline'}
            onClick={() => setFilter('scheduled')}
            className={filter === 'scheduled' ? 'bg-blue-500' : 'border-gf-steel/20'}
            data-testid="button-filter-scheduled"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Scheduled ({scheduledStreams.length})
          </Button>
        </div>

        {/* Streams Grid */}
        {streams.length === 0 ? (
          <Card className="bg-gf-charcoal/50 border-gf-steel/20">
            <CardContent className="p-12 text-center">
              <Video className="h-12 w-12 text-gf-steel mx-auto mb-4" />
              <h3 className="text-gf-snow font-semibold mb-2">No streams found</h3>
              <p className="text-gf-steel">Check back later for live content!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {streams.map(stream => (
              <StreamCard key={stream.id} stream={stream} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
