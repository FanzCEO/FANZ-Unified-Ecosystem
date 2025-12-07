import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/navigation";
import PostCard from "@/components/post-card";
import PostCreator from "@/components/post-creator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, TrendingUp, Users, Star, Play } from "lucide-react";
import VideoHub from "@/components/video-hub";

interface Post {
  id: string;
  creatorId: string;
  content: string;
  mediaUrl?: string;
  mediaType?: string;
  postType: "free" | "ppv" | "subscription_only";
  ppvPrice?: string;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  hasLiked: boolean;
  hasUnlocked: boolean;
}

interface Creator {
  id: string;
  displayName: string;
  username: string;
  profileImageUrl?: string;
  subscriberCount: number;
}

export default function Home() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: posts = [], isLoading: postsLoading } = useQuery<Post[]>({
    queryKey: ["/api/posts/feed"],
    retry: false,
  });

  const { data: topCreators = [] } = useQuery<Creator[]>({
    queryKey: ["/api/creators/top", { limit: 5 }],
    retry: false,
  });

  const { data: unreadCount = 0 } = useQuery<number>({
    queryKey: ["/api/messages/unread/count"],
    retry: false,
  });

  const likeMutation = useMutation({
    mutationFn: async ({ postId, isLiked }: { postId: string; isLiked: boolean }) => {
      const method = isLiked ? "DELETE" : "POST";
      await apiRequest(method, `/api/posts/${postId}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts/feed"] });
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
        title: "Error",
        description: "Failed to update like",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
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
  }, [user, authLoading, toast]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark text-white">
      <Navigation unreadCount={unreadCount} />
      
      <div className="flex min-h-screen">
        {/* Main Content */}
        <main className="flex-1 max-w-4xl mx-auto p-6">
          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search creators, content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate border-gray-700 pl-10 text-white placeholder-gray-400"
              data-testid="input-search"
            />
          </div>

          {/* Content Creator - Show for verified creators */}
          {user?.role === 'creator' && (
            <div className="mb-6">
              <PostCreator
                onPostCreated={() => {
                  queryClient.invalidateQueries({ queryKey: ["/api/posts/feed"] });
                  toast({
                    title: "Post Created",
                    description: "Your post is now live on your feed!",
                  });
                }}
                data-testid="post-creator-main"
              />
            </div>
          )}

          {/* Video Hub Section */}
          <Card className="bg-gray-800 border-gray-700 mb-6">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Play className="w-5 h-5 mr-2 text-primary" />
                Trending Videos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <VideoHub featured={true} maxItems={4} />
            </CardContent>
          </Card>

          {/* Feed Posts */}
          <div className="space-y-6">
            {postsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" aria-label="Loading posts" />
              </div>
            ) : posts.length === 0 ? (
              <Card className="bg-slate border-gray-700">
                <CardContent className="text-center py-12">
                  <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2" data-testid="text-no-posts">No posts to show</h3>
                  <p className="text-gray-400 mb-4">
                    Start following creators to see their content in your feed
                  </p>
                  <Button 
                    onClick={() => window.location.href = '/discover'}
                    className="bg-gradient-to-r from-primary to-secondary"
                    data-testid="button-discover"
                  >
                    Discover Creators
                  </Button>
                </CardContent>
              </Card>
            ) : (
              posts.map((post: Post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLike={() => likeMutation.mutate({ postId: post.id, isLiked: post.hasLiked })}
                />
              ))
            )}
          </div>
        </main>

        {/* Right Sidebar */}
        <aside className="w-80 bg-slate border-l border-gray-700 p-6 hidden xl:block">
          {/* Top Creators */}
          <Card className="bg-gray-800 border-gray-700 mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-accent" />
                <span>Top Creators</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topCreators.map((creator: Creator) => (
                  <div key={creator.id} className="flex items-center space-x-3 p-3 bg-slate rounded-lg hover:bg-gray-700 cursor-pointer transition-colors">
                    <img 
                      src={creator.profileImageUrl || 'https://via.placeholder.com/40x40'} 
                      alt={creator.displayName} 
                      className="w-10 h-10 rounded-full object-cover" 
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-sm" data-testid={`text-creator-name-${creator.id}`}>
                        {creator.displayName || creator.username}
                      </p>
                      <p className="text-xs text-gray-400" data-testid={`text-creator-subscribers-${creator.id}`}>
                        {creator.subscriberCount} subscribers
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-primary" />
                <span>Your Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Following</span>
                  <span className="font-semibold" data-testid="text-following-count">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Subscriptions</span>
                  <span className="font-semibold" data-testid="text-subscription-count">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Wallet Balance</span>
                  <span className="font-semibold text-accent" data-testid="text-wallet-balance">
                    ${parseFloat(user.balance || '0').toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
