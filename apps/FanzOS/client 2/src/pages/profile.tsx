import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/navigation";
import PostCard from "@/components/post-card";
import SubscriptionButton from "@/components/subscription-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Heart, 
  MessageCircle, 
  MapPin, 
  Calendar, 
  ExternalLink,
  Verified
} from "lucide-react";

interface User {
  id: string;
  username: string;
  displayName?: string;
  bio?: string;
  profileImageUrl?: string;
  subscriberCount: number;
  subscriptionPrice: string;
  role: string;
  isVerified: boolean;
  createdAt: string;
}

export default function Profile() {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profileUser, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/users", username],
    enabled: !!username,
    retry: false,
  });

  const { data: posts = [], isLoading: postsLoading } = useQuery<any[]>({
    queryKey: ["/api/posts/creator", profileUser?.id],
    enabled: !!profileUser?.id,
    retry: false,
  });

  const { data: subscriptionStatus } = useQuery<{ isSubscribed: boolean }>({
    queryKey: ["/api/subscriptions/check", profileUser?.id],
    enabled: !!profileUser?.id && !!currentUser,
    retry: false,
  });

  const { data: unreadCount = 0 } = useQuery<number>({
    queryKey: ["/api/messages/unread/count"],
    enabled: !!currentUser,
    retry: false,
  });

  const likeMutation = useMutation({
    mutationFn: async ({ postId, isLiked }: { postId: string; isLiked: boolean }) => {
      const method = isLiked ? "DELETE" : "POST";
      await apiRequest(method, `/api/posts/${postId}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts/creator"] });
    },
    onError: (error: Error) => {
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
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", "/api/messages", {
        receiverId: profileUser?.id,
        content,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully",
      });
    },
    onError: (error: Error) => {
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
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  if (userLoading || !profileUser) {
    return (
      <div className="min-h-screen bg-dark text-white">
        <Navigation unreadCount={unreadCount} />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading" />
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profileUser.id;
  const isCreator = profileUser.role === 'creator';

  return (
    <div className="min-h-screen bg-dark text-white">
      <Navigation unreadCount={unreadCount} />
      
      <div className="container mx-auto px-4 py-6">
        {/* Profile Header */}
        <Card className="bg-slate border-gray-700 mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Profile Image */}
              <div className="flex-shrink-0">
                <img 
                  src={profileUser.profileImageUrl || 'https://via.placeholder.com/120x120'} 
                  alt={profileUser.displayName || profileUser.username}
                  className="w-32 h-32 rounded-full object-cover border-4 border-primary"
                  data-testid="img-profile-avatar"
                />
              </div>
              
              {/* Profile Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold" data-testid="text-profile-name">
                    {profileUser.displayName || profileUser.username}
                  </h1>
                  {profileUser.isVerified && (
                    <Verified className="w-6 h-6 text-primary" data-testid="icon-verified" />
                  )}
                  {isCreator && (
                    <Badge variant="secondary" className="bg-primary text-white" data-testid="badge-creator">
                      Creator
                    </Badge>
                  )}
                </div>
                
                <p className="text-gray-400 mb-2" data-testid="text-profile-username">@{profileUser.username}</p>
                
                {profileUser.bio && (
                  <p className="text-gray-300 mb-4" data-testid="text-profile-bio">{profileUser.bio}</p>
                )}
                
                <div className="flex items-center gap-6 mb-4 text-sm text-gray-400">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span data-testid="text-subscriber-count">{profileUser.subscriberCount} subscribers</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span data-testid="text-join-date">
                      Joined {new Date(profileUser.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                {/* Action Buttons */}
                {!isOwnProfile && currentUser && (
                  <div className="flex gap-3">
                    {isCreator && (
                      <SubscriptionButton 
                        creatorId={profileUser.id}
                        price={parseFloat(profileUser.subscriptionPrice)}
                        isSubscribed={subscriptionStatus?.isSubscribed}
                      />
                    )}
                    <Button 
                      variant="outline"
                      onClick={() => window.location.href = '/messages'}
                      className="border-gray-600 hover:bg-gray-700"
                      data-testid="button-message"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Message
                    </Button>
                  </div>
                )}
                
                {isOwnProfile && (
                  <Button 
                    onClick={() => window.location.href = '/settings'}
                    className="bg-gradient-to-r from-primary to-secondary hover:from-purple-600 hover:to-pink-600"
                    data-testid="button-edit-profile"
                  >
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Tabs */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate border-gray-700">
            <TabsTrigger value="posts" className="data-[state=active]:bg-primary" data-testid="tab-posts">
              Posts
            </TabsTrigger>
            <TabsTrigger value="about" className="data-[state=active]:bg-primary" data-testid="tab-about">
              About
            </TabsTrigger>
            <TabsTrigger value="media" className="data-[state=active]:bg-primary" data-testid="tab-media">
              Media
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="posts" className="mt-6">
            <div className="space-y-6">
              {postsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" aria-label="Loading posts" />
                </div>
              ) : posts.length === 0 ? (
                <Card className="bg-slate border-gray-700">
                  <CardContent className="text-center py-12">
                    <h3 className="text-xl font-semibold mb-2" data-testid="text-no-posts">No posts yet</h3>
                    <p className="text-gray-400">
                      {isOwnProfile ? "Start creating content to grow your audience" : "This creator hasn't posted anything yet"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                posts.map((post: any) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onLike={() => likeMutation.mutate({ postId: post.id, isLiked: post.hasLiked })}
                    showCreatorInfo={false}
                  />
                ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="about" className="mt-6">
            <Card className="bg-slate border-gray-700">
              <CardHeader>
                <CardTitle>About {profileUser.displayName || profileUser.username}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {profileUser.bio ? (
                    <p className="text-gray-300" data-testid="text-about-bio">{profileUser.bio}</p>
                  ) : (
                    <p className="text-gray-400" data-testid="text-no-bio">No bio available</p>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-5 h-5 text-primary" />
                        <span className="font-semibold">Subscribers</span>
                      </div>
                      <p className="text-2xl font-bold text-primary" data-testid="text-about-subscribers">
                        {profileUser.subscriberCount}
                      </p>
                    </div>
                    
                    {isCreator && (
                      <div className="bg-gray-800 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Heart className="w-5 h-5 text-secondary" />
                          <span className="font-semibold">Subscription</span>
                        </div>
                        <p className="text-2xl font-bold text-secondary" data-testid="text-about-price">
                          ${parseFloat(profileUser.subscriptionPrice).toFixed(2)}/month
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="media" className="mt-6">
            <Card className="bg-slate border-gray-700">
              <CardContent className="text-center py-12">
                <h3 className="text-xl font-semibold mb-2" data-testid="text-no-media">Media Gallery</h3>
                <p className="text-gray-400">Media gallery coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
