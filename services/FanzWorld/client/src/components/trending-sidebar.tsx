import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const trendingTopics = [
  { topic: "#CyberPunk2024", category: "Technology", postCount: "15.2K" },
  { topic: "#NeuralNetworks", category: "AI", postCount: "8.7K" },
  { topic: "#VirtualReality", category: "Gaming", postCount: "12.4K" },
  { topic: "#FuturisticUI", category: "Design", postCount: "6.1K" },
];

const liveEvents = [
  { title: "CyberSec Summit 2024", viewers: "2.1K", color: "neon-pink" },
  { title: "AI Developer Conference", viewers: "856", color: "cyber-blue" },
];

export function TrendingSidebar() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: suggestedUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/users/suggested"],
  });

  const followMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest("POST", `/api/users/${userId}/follow`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/suggested"] });
      toast({
        title: "Success",
        description: "User followed successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to follow user",
        variant: "destructive",
      });
    },
  });

  return (
    <aside className="fixed right-0 top-16 bottom-0 w-80 bg-black/80 backdrop-blur-lg border-l border-cyber-blue/30 overflow-y-auto">
      <div className="p-3 sm:p-4 space-y-4 sm:space-y-6">
        
        {/* Trending Topics */}
        <div className="post-card scan-line p-4 rounded-xl">
          <h2 className="text-xl font-bold text-cyber-blue mb-4 neon-text">
            Trending in Tech
          </h2>
          <div className="space-y-3">
            {trendingTopics.map((trend) => (
              <div
                key={trend.topic}
                className="hover:bg-gray-800/50 p-3 rounded-lg cursor-pointer transition-colors"
                data-testid={`trend-${trend.topic.replace('#', '')}`}
              >
                <p className="text-sm text-gray-400">Trending in {trend.category}</p>
                <p className="font-semibold text-white">{trend.topic}</p>
                <p className="text-sm text-gray-400">{trend.postCount} posts</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Suggested Users */}
        <div className="post-card p-4 rounded-xl">
          <h2 className="text-xl font-bold text-electric-purple mb-4 neon-text">
            Who to Follow
          </h2>
          <div className="space-y-4">
            {suggestedUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full border border-neon-pink overflow-hidden">
                    <img
                      src={user.avatar || `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face`}
                      alt={user.displayName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{user.displayName}</h4>
                    <p className="text-sm text-gray-400">@{user.username}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => followMutation.mutate(user.id)}
                  disabled={followMutation.isPending}
                  className="bg-gradient-to-r from-cyber-blue to-electric-purple text-black text-sm font-bold px-4 py-1 rounded-full hover:shadow-neon-cyan transition-all duration-300"
                  data-testid={`follow-${user.username}`}
                >
                  Follow
                </Button>
              </div>
            ))}
            
            <Button
              variant="ghost"
              className="w-full mt-4 text-cyber-blue hover:bg-cyber-blue/10 py-2 rounded-lg transition-colors"
              data-testid="show-more-suggestions"
            >
              Show more
            </Button>
          </div>
        </div>
        
        {/* Live Events */}
        <div className="post-card hologram-border p-4 rounded-xl">
          <h2 className="text-xl font-bold text-laser-green mb-4 neon-text">
            Live Events
          </h2>
          <div className="space-y-3">
            {liveEvents.map((event) => (
              <div
                key={event.title}
                className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                  event.color === 'neon-pink' 
                    ? 'border-neon-pink/30 hover:border-neon-pink/60' 
                    : 'border-cyber-blue/30 hover:border-cyber-blue/60'
                }`}
                data-testid={`event-${event.title.replace(/\s+/g, '-').toLowerCase()}`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <div className={`w-2 h-2 rounded-full animate-pulse ${
                    event.color === 'neon-pink' ? 'bg-neon-pink' : 'bg-cyber-blue'
                  }`}></div>
                  <span className={`text-sm font-semibold ${
                    event.color === 'neon-pink' ? 'text-neon-pink' : 'text-cyber-blue'
                  }`}>LIVE</span>
                </div>
                <h4 className="font-semibold text-white mb-1">{event.title}</h4>
                <p className="text-sm text-gray-400">{event.viewers} watching</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Footer */}
        <div className="text-center p-4 text-sm text-gray-500 border-t border-gray-800">
          <p>&copy; 2024 Fanz World. The Future is Social.</p>
          <div className="flex justify-center space-x-4 mt-2">
            <button className="hover:text-cyber-blue transition-colors" data-testid="terms-link">
              Terms
            </button>
            <button className="hover:text-cyber-blue transition-colors" data-testid="privacy-link">
              Privacy
            </button>
            <button className="hover:text-cyber-blue transition-colors" data-testid="help-link">
              Help
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
