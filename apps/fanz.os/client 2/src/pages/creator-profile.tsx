import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Heart,
  MessageCircle,
  Share2,
  MoreVertical,
  Bell,
  Star,
  Users,
  Image,
  Video,
  Play,
  Lock,
  DollarSign,
  Gift,
  Trophy,
  Shield,
  CheckCircle,
  Calendar,
  MapPin,
  Link2,
  Twitter,
  Instagram,
  ShoppingBag,
  Zap,
  FileText
} from "lucide-react";
import { Link } from "wouter";
import TipModal from "@/components/tip-modal";
import PaymentSelector from "@/components/payment-selector";

interface CreatorProfile {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatar: string;
  banner: string;
  subscriberCount: number;
  postCount: number;
  likeCount: number;
  subscriptionPrice: number;
  isVerified: boolean;
  isOnline: boolean;
  location?: string;
  joinDate: string;
  socialLinks: {
    twitter?: string;
    instagram?: string;
    website?: string;
  };
  categories: string[];
  isSubscribed: boolean;
  subscriptionTier?: string;
}

interface Post {
  id: string;
  type: "photo" | "video" | "audio" | "text";
  content: string;
  mediaUrl?: string;
  thumbnail?: string;
  isPremium: boolean;
  isPPV: boolean;
  price?: number;
  likes: number;
  comments: number;
  createdAt: string;
  isLiked: boolean;
  isUnlocked: boolean;
}

export default function CreatorProfile() {
  const [, params] = useRoute("/creator/:username");
  const { user } = useAuth() as { user: User | undefined };
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showTipModal, setShowTipModal] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedTab, setSelectedTab] = useState("posts");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // Fetch creator profile
  const { data: profile, isLoading: profileLoading } = useQuery<CreatorProfile>({
    queryKey: ["/api/creators", params?.username],
    enabled: !!params?.username,
  });

  // Fetch creator posts
  const { data: posts, isLoading: postsLoading } = useQuery<Post[]>({
    queryKey: ["/api/creators", params?.username, "posts"],
    enabled: !!params?.username,
  });

  // Mock data for demonstration
  const mockProfile: CreatorProfile = profile || {
    id: "creator1",
    username: params?.username || "emmarose",
    displayName: "Emma Rose",
    bio: "✨ Content Creator | Model | Artist\n🌹 Exclusive content daily\n💕 Top 0.5% Creator\n📍 Los Angeles, CA\n🎨 Custom requests available",
    avatar: "https://images.unsplash.com/photo-1494790108344-b2ee30e40a34?w=200&h=200&fit=crop&crop=face",
    banner: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&h=400&fit=crop",
    subscriberCount: 15234,
    postCount: 342,
    likeCount: 89234,
    subscriptionPrice: 14.99,
    isVerified: true,
    isOnline: true,
    location: "Los Angeles, CA",
    joinDate: "2023-01-15",
    socialLinks: {
      twitter: "emmarose",
      instagram: "emmarose.official",
      website: "emmarose.com"
    },
    categories: ["Model", "Artist", "Lifestyle"],
    isSubscribed: false,
    subscriptionTier: undefined
  };

  const mockPosts: Post[] = posts || [
    {
      id: "1",
      type: "photo",
      content: "New photoshoot just dropped! 📸✨",
      mediaUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=800&fit=crop",
      thumbnail: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=400&fit=crop",
      isPremium: false,
      isPPV: false,
      likes: 1234,
      comments: 89,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      isLiked: false,
      isUnlocked: true
    },
    {
      id: "2",
      type: "video",
      content: "Exclusive behind the scenes from today's shoot 🎬",
      thumbnail: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&h=400&fit=crop",
      isPremium: true,
      isPPV: false,
      likes: 2345,
      comments: 156,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      isLiked: true,
      isUnlocked: false
    },
    {
      id: "3",
      type: "photo",
      content: "Special PPV content - Unlock to view 🔥",
      thumbnail: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=300&h=400&fit=crop",
      isPremium: false,
      isPPV: true,
      price: 9.99,
      likes: 876,
      comments: 45,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      isLiked: false,
      isUnlocked: false
    }
  ];

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/creators/${mockProfile.id}/subscribe`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/creators", params?.username] });
      toast({
        title: "Subscribed successfully",
        description: `You are now subscribed to ${mockProfile.displayName}`,
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
        title: "Failed to subscribe",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const likeMutation = useMutation({
    mutationFn: async (postId: string) => {
      const response = await apiRequest("POST", `/api/posts/${postId}/like`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/creators", params?.username, "posts"] });
    },
  });

  const unlockPPVMutation = useMutation({
    mutationFn: async (postId: string) => {
      const response = await apiRequest("POST", `/api/posts/${postId}/unlock`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/creators", params?.username, "posts"] });
      toast({
        title: "Content unlocked",
        description: "You can now view this content",
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
        title: "Failed to unlock content",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubscribe = () => {
    if (!user) {
      window.location.href = "/api/login";
      return;
    }
    setShowPayment(true);
  };

  const handleUnlockPPV = (post: Post) => {
    if (!user) {
      window.location.href = "/api/login";
      return;
    }
    setSelectedPost(post);
    setShowPayment(true);
  };

  const filteredPosts = mockPosts.filter(post => {
    if (selectedTab === "posts") return !post.isPPV;
    if (selectedTab === "ppv") return post.isPPV;
    if (selectedTab === "media") return post.type !== "text";
    return true;
  });

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Banner */}
      <div className="relative h-64 md:h-80">
        <img
          src={mockProfile.banner}
          alt="Banner"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900" />
      </div>

      {/* Profile Info */}
      <div className="container mx-auto px-4 -mt-20 relative">
        <div className="flex flex-col md:flex-row items-start md:items-end space-y-4 md:space-y-0 md:space-x-6">
          {/* Avatar */}
          <div className="relative">
            <Avatar className="w-32 h-32 border-4 border-gray-900">
              <AvatarImage src={mockProfile.avatar} alt={mockProfile.displayName} />
              <AvatarFallback>{mockProfile.displayName[0]}</AvatarFallback>
            </Avatar>
            {mockProfile.isOnline && (
              <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-gray-900" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl font-bold text-white" data-testid="text-creator-name">
                {mockProfile.displayName}
              </h1>
              {mockProfile.isVerified && (
                <CheckCircle className="w-6 h-6 text-blue-500" />
              )}
            </div>
            <p className="text-gray-400 mb-2">@{mockProfile.username}</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {mockProfile.categories.map((category) => (
                <Badge key={category} variant="secondary" className="bg-gray-700 text-gray-300">
                  {category}
                </Badge>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col space-y-2 w-full md:w-auto">
            {mockProfile.isSubscribed ? (
              <>
                <Link href="/messages">
                  <Button className="w-full bg-gray-700 hover:bg-gray-600">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                </Link>
                <Button
                  onClick={() => setShowTipModal(true)}
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary hover:text-white"
                  data-testid="button-send-tip"
                >
                  <Gift className="w-4 h-4 mr-2" />
                  Send Tip
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={handleSubscribe}
                  className="bg-gradient-to-r from-primary to-secondary hover:from-purple-600 hover:to-pink-600"
                  data-testid="button-subscribe"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Subscribe for ${mockProfile.subscriptionPrice}/month
                </Button>
                <Button
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  data-testid="button-free-follow"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Follow for Free
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex space-x-8 mt-6 mb-4">
          <div>
            <p className="text-2xl font-bold text-white" data-testid="text-post-count">
              {mockProfile.postCount}
            </p>
            <p className="text-sm text-gray-400">Posts</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white" data-testid="text-subscriber-count">
              {mockProfile.subscriberCount.toLocaleString()}
            </p>
            <p className="text-sm text-gray-400">Subscribers</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white" data-testid="text-like-count">
              {mockProfile.likeCount.toLocaleString()}
            </p>
            <p className="text-sm text-gray-400">Likes</p>
          </div>
        </div>

        {/* Bio */}
        <Card className="bg-gray-800 border-gray-700 mb-6">
          <CardContent className="pt-6">
            <p className="text-white whitespace-pre-line">{mockProfile.bio}</p>
            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-400">
              {mockProfile.location && (
                <span className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {mockProfile.location}
                </span>
              )}
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                Joined {new Date(mockProfile.joinDate).toLocaleDateString()}
              </span>
              {mockProfile.socialLinks.twitter && (
                <a
                  href={`https://twitter.com/${mockProfile.socialLinks.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center hover:text-primary"
                >
                  <Twitter className="w-4 h-4 mr-1" />
                  Twitter
                </a>
              )}
              {mockProfile.socialLinks.instagram && (
                <a
                  href={`https://instagram.com/${mockProfile.socialLinks.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center hover:text-primary"
                >
                  <Instagram className="w-4 h-4 mr-1" />
                  Instagram
                </a>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-8">
          <TabsList className="bg-gray-800 border border-gray-700">
            <TabsTrigger value="posts" data-testid="tab-posts">
              <FileText className="w-4 h-4 mr-2" />
              Posts
            </TabsTrigger>
            <TabsTrigger value="media" data-testid="tab-media">
              <Image className="w-4 h-4 mr-2" />
              Media
            </TabsTrigger>
            <TabsTrigger value="ppv" data-testid="tab-ppv">
              <Lock className="w-4 h-4 mr-2" />
              PPV
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab} className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPosts.map((post) => (
                <Card key={post.id} className="bg-gray-800 border-gray-700 overflow-hidden">
                  {/* Post Media */}
                  {post.mediaUrl || post.thumbnail ? (
                    <div className="relative aspect-[3/4]">
                      {post.isPremium && !mockProfile.isSubscribed ? (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                          <div className="text-center">
                            <Lock className="w-12 h-12 text-white mb-2" />
                            <p className="text-white font-semibold">Subscribers Only</p>
                            <Button
                              onClick={handleSubscribe}
                              size="sm"
                              className="mt-2 bg-gradient-to-r from-primary to-secondary"
                              data-testid={`button-subscribe-${post.id}`}
                            >
                              Subscribe to View
                            </Button>
                          </div>
                        </div>
                      ) : post.isPPV && !post.isUnlocked ? (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                          <div className="text-center">
                            <DollarSign className="w-12 h-12 text-white mb-2" />
                            <p className="text-white font-semibold">Pay Per View</p>
                            <Button
                              onClick={() => handleUnlockPPV(post)}
                              size="sm"
                              className="mt-2 bg-gradient-to-r from-primary to-secondary"
                              data-testid={`button-unlock-${post.id}`}
                            >
                              Unlock for ${post.price}
                            </Button>
                          </div>
                        </div>
                      ) : null}
                      <img
                        src={post.thumbnail || post.mediaUrl}
                        alt="Post media"
                        className={`w-full h-full object-cover ${
                          (post.isPremium && !mockProfile.isSubscribed) || (post.isPPV && !post.isUnlocked)
                            ? "blur-lg"
                            : ""
                        }`}
                      />
                      {post.type === "video" && (
                        <div className="absolute top-2 left-2">
                          <Play className="w-6 h-6 text-white drop-shadow-lg" />
                        </div>
                      )}
                    </div>
                  ) : null}

                  {/* Post Content */}
                  <CardContent className="p-4">
                    <p className="text-white mb-3">{post.content}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => likeMutation.mutate(post.id)}
                          className={`flex items-center space-x-1 ${
                            post.isLiked ? "text-pink-500" : "text-gray-400"
                          } hover:text-pink-500 transition-colors`}
                          data-testid={`button-like-${post.id}`}
                        >
                          <Heart className={`w-5 h-5 ${post.isLiked ? "fill-current" : ""}`} />
                          <span className="text-sm">{post.likes}</span>
                        </button>
                        <button className="flex items-center space-x-1 text-gray-400 hover:text-white transition-colors">
                          <MessageCircle className="w-5 h-5" />
                          <span className="text-sm">{post.comments}</span>
                        </button>
                        <button className="text-gray-400 hover:text-white transition-colors">
                          <Share2 className="w-5 h-5" />
                        </button>
                      </div>
                      <button className="text-gray-400 hover:text-white transition-colors">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredPosts.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <p>No content available in this category</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Tip Modal */}
      {showTipModal && (
        <TipModal
          isOpen={showTipModal}
          onClose={() => setShowTipModal(false)}
          recipientId={mockProfile.id}
          recipientName={mockProfile.displayName}
        />
      )}

      {/* Payment Selector */}
      {showPayment && (
        <PaymentSelector
          isOpen={showPayment}
          onClose={() => {
            setShowPayment(false);
            setSelectedPost(null);
          }}
          paymentType={selectedPost ? "ppv" : "subscription"}
          amount={selectedPost ? selectedPost.price! : mockProfile.subscriptionPrice}
          currency="USD"
          creatorId={mockProfile.id}
          description={selectedPost
            ? `Unlock PPV content from ${mockProfile.displayName}`
            : `Subscribe to ${mockProfile.displayName}`}
        />
      )}
    </div>
  );
}