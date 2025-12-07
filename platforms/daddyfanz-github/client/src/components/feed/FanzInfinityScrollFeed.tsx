import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Heart, MessageCircle, Share2, UserPlus, UserMinus, Lock, Send } from "lucide-react";

interface Post {
  id: string;
  creatorId: string;
  text: string | null;
  mediaUrl: string | null;
  mediaType: string | null;
  mediaAssetId: string | null;
  isFree: boolean;
  creatorAllowsFree: boolean;
  creatorIsAgeVerified: boolean;
  requiresSubscription: boolean;
  requiresAgeVerification: boolean;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

interface FeedPost extends Post {
  creator: {
    id: string;
    username: string | null;
    email: string | null;
    profileImageUrl: string | null;
    displayName: string | null;
  };
  isFollowing: boolean;
}

interface PostComment {
  id: string;
  postId: string;
  userId: string;
  text: string;
  createdAt: string;
  updatedAt: string;
}

interface FanzInfinityScrollFeedProps {
  adInterval?: number; // Insert ad every N posts
}

export default function FanzInfinityScrollFeed({ adInterval = 5 }: FanzInfinityScrollFeedProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [allPosts, setAllPosts] = useState<FeedPost[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef<HTMLDivElement>(null);
  const [ageVerifiedPosts, setAgeVerifiedPosts] = useState<Set<string>>(new Set());
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");

  const limit = 20;

  const { data, isLoading, isFetching } = useQuery<FeedPost[]>({
    queryKey: [`/api/feed?page=${page}&limit=${limit}`],
    staleTime: 30000,
  });

  // Append new posts when data arrives
  useEffect(() => {
    if (data) {
      if (data.length < limit) {
        setHasMore(false);
      }
      setAllPosts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const newPosts = data.filter((p) => !existingIds.has(p.id));
        return [...prev, ...newPosts];
      });
    }
  }, [data, limit]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isFetching) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.5 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isFetching]);

  // Follow/unfollow mutation
  const followMutation = useMutation({
    mutationFn: async ({ creatorId, isFollowing }: { creatorId: string; isFollowing: boolean }) => {
      if (isFollowing) {
        return apiRequest("DELETE", `/api/follow/${creatorId}`);
      } else {
        return apiRequest("POST", `/api/follow/${creatorId}`);
      }
    },
    onSuccess: (_, variables) => {
      setAllPosts((prev) =>
        prev.map((post) =>
          post.creatorId === variables.creatorId
            ? { ...post, isFollowing: !variables.isFollowing }
            : post
        )
      );
      queryClient.invalidateQueries({ queryKey: ["/api/following"] });
      toast({
        title: variables.isFollowing ? "Unfollowed" : "Followed",
        description: variables.isFollowing
          ? "You've unfollowed this creator"
          : "You're now following this creator",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update follow status",
        variant: "destructive",
      });
    },
  });

  const handleFollow = (creatorId: string, isFollowing: boolean) => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to follow creators",
        variant: "destructive",
      });
      return;
    }
    followMutation.mutate({ creatorId, isFollowing });
  };

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: async (postId: string) => {
      const response = await apiRequest(`/api/posts/${postId}/like`, {
        method: "POST",
      });
      return response as { liked: boolean };
    },
    onSuccess: (data, postId) => {
      // Update the post's like count optimistically
      setAllPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, likeCount: data.liked ? post.likeCount + 1 : post.likeCount - 1 }
            : post
        )
      );
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update like",
        variant: "destructive",
      });
    },
  });

  const handleLike = (postId: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to like posts",
        variant: "destructive",
      });
      return;
    }
    likeMutation.mutate(postId);
  };

  // Comments query
  const { data: comments, refetch: refetchComments } = useQuery<PostComment[]>({
    queryKey: ["/api/posts", selectedPostId, "comments"],
    enabled: !!selectedPostId,
  });

  // Comment mutation
  const commentMutation = useMutation({
    mutationFn: async ({ postId, text }: { postId: string; text: string }) => {
      const response = await apiRequest(`/api/posts/${postId}/comments`, {
        method: "POST",
        body: { text },
      });
      return response as PostComment;
    },
    onSuccess: (_, variables) => {
      setCommentText("");
      refetchComments();
      // Update comment count
      setAllPosts((prev) =>
        prev.map((post) =>
          post.id === variables.postId
            ? { ...post, commentCount: post.commentCount + 1 }
            : post
        )
      );
      toast({
        title: "Comment posted",
        description: "Your comment has been added",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive",
      });
    },
  });

  const handleComment = () => {
    if (!selectedPostId || !commentText.trim()) return;
    commentMutation.mutate({
      postId: selectedPostId,
      text: commentText,
    });
  };

  const handleAgeVerify = (postId: string) => {
    setAgeVerifiedPosts((prev) => new Set([...prev, postId]));
  };

  const renderPost = (post: FeedPost, index: number) => {
    const isOwnPost = user?.id === post.creatorId;
    const needsAgeVerification = post.requiresAgeVerification && !ageVerifiedPosts.has(post.id);
    const isBlurred = needsAgeVerification && !isOwnPost;

    return (
      <Card key={post.id} className="card-df mb-4" data-testid={`card-post-${post.id}`}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="border-2 border-df-cyan">
                <AvatarImage src={post.creator.profileImageUrl || undefined} />
                <AvatarFallback className="bg-df-ink text-df-cyan">
                  {post.creator.displayName?.[0] || post.creator.username?.[0] || "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-df-snow font-semibold" data-testid={`text-creator-name-${post.id}`}>
                  {post.creator.displayName || post.creator.username || "Anonymous"}
                </h3>
                <p className="text-df-fog text-sm">
                  {new Date(post.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            {!isOwnPost && (
              <Button
                variant="outline"
                size="sm"
                className={post.isFollowing ? "btn-secondary" : "btn-primary"}
                onClick={() => handleFollow(post.creatorId, post.isFollowing)}
                disabled={followMutation.isPending}
                data-testid={`button-follow-${post.id}`}
              >
                {post.isFollowing ? (
                  <>
                    <UserMinus className="h-4 w-4 mr-1" />
                    Unfollow
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-1" />
                    Follow
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Post Text */}
          {post.text && (
            <p className="text-df-snow mb-4 whitespace-pre-wrap" data-testid={`text-post-content-${post.id}`}>
              {post.text}
            </p>
          )}

          {/* Post Media */}
          {post.mediaUrl && (
            <div className="relative rounded-lg overflow-hidden mb-4 bg-df-ink">
              {isBlurred ? (
                <div className="relative">
                  <div className="aspect-video w-full bg-df-ink border border-df-steel flex items-center justify-center backdrop-blur-xl">
                    <div className="text-center p-6">
                      <Lock className="h-12 w-12 text-df-cyan mx-auto mb-4" />
                      <h4 className="text-df-snow font-semibold mb-2">
                        Age Verification Required
                      </h4>
                      <p className="text-df-fog mb-4">
                        This content requires age verification to view
                      </p>
                      <Button
                        onClick={() => handleAgeVerify(post.id)}
                        className="btn-primary"
                        data-testid={`button-verify-age-${post.id}`}
                      >
                        I am 18+ years old
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {post.mediaType === "video" ? (
                    <video
                      controls
                      className="w-full"
                      data-testid={`video-media-${post.id}`}
                    >
                      <source src={post.mediaUrl} />
                    </video>
                  ) : (
                    <img
                      src={post.mediaUrl}
                      alt="Post media"
                      className="w-full h-auto"
                      data-testid={`img-media-${post.id}`}
                    />
                  )}
                </>
              )}
            </div>
          )}

          {/* Engagement Stats */}
          <div className="flex items-center gap-6 pt-4 border-t border-df-steel">
            <button
              onClick={() => handleLike(post.id)}
              className="flex items-center gap-2 text-df-fog hover:text-pink-500 transition-colors"
              data-testid={`button-like-${post.id}`}
            >
              <Heart className="h-5 w-5" />
              <span>{post.likeCount}</span>
            </button>
            
            <Dialog
              onOpenChange={(open) => {
                if (open) {
                  setSelectedPostId(post.id);
                  setCommentText("");
                } else {
                  setSelectedPostId(null);
                }
              }}
            >
              <DialogTrigger asChild>
                <button
                  className="flex items-center gap-2 text-df-fog hover:text-df-cyan transition-colors"
                  data-testid={`button-comment-${post.id}`}
                >
                  <MessageCircle className="h-5 w-5" />
                  <span>{post.commentCount}</span>
                </button>
              </DialogTrigger>
              <DialogContent className="bg-df-dungeon border-df-cyan/20 max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-df-cyan">Comments</DialogTitle>
                  <DialogDescription className="text-df-fog">
                    Join the conversation
                  </DialogDescription>
                </DialogHeader>

                <ScrollArea className="h-[400px] pr-4">
                  {!comments || comments.length === 0 ? (
                    <p className="text-df-fog text-center py-8">
                      No comments yet. Be the first to comment!
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {comments.map((comment) => (
                        <div
                          key={comment.id}
                          className="flex gap-3 p-3 rounded-lg bg-df-ink/30"
                          data-testid={`comment-${comment.id}`}
                        >
                          <Avatar className="w-8 h-8 border border-df-cyan/20">
                            <AvatarFallback className="bg-gradient-to-br from-df-cyan to-df-gold text-df-dungeon text-xs">
                              {comment.userId.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm text-df-fog">
                              User {comment.userId.substring(0, 8)}... •{" "}
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-df-snow mt-1">{comment.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                <div className="flex gap-2 mt-4">
                  <Textarea
                    placeholder="Write a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="bg-df-ink border-df-steel resize-none"
                    rows={3}
                    data-testid="input-comment-text"
                  />
                  <Button
                    onClick={handleComment}
                    disabled={!commentText.trim() || commentMutation.isPending}
                    className="btn-primary"
                    data-testid="button-submit-comment"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <button
              className="flex items-center gap-2 text-df-fog hover:text-df-cyan transition-colors"
              data-testid={`button-share-${post.id}`}
            >
              <Share2 className="h-5 w-5" />
              <span>Share</span>
            </button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderAd = (index: number) => {
    return (
      <Card key={`ad-${index}`} className="card-df mb-4 border-df-gold" data-testid={`card-ad-${index}`}>
        <CardContent className="p-6 text-center">
          <div className="bg-gradient-to-r from-df-gold/20 to-df-cyan/20 rounded-lg p-8">
            <p className="text-df-gold font-semibold mb-2">SPONSORED</p>
            <h3 className="text-xl text-df-snow font-bold mb-2 neon-subheading">
              Upgrade to FanzPremium
            </h3>
            <p className="text-df-fog mb-4">
              Get exclusive access to premium creators and unlock special features
            </p>
            <Button className="btn-primary" data-testid={`button-ad-cta-${index}`}>
              Learn More
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading && allPosts.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="card-df">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-4" />
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (allPosts.length === 0 && !isLoading) {
    return (
      <Card className="card-df">
        <CardContent className="p-12 text-center">
          <h3 className="text-xl text-df-snow font-semibold mb-2">No posts yet</h3>
          <p className="text-df-fog">Follow some creators to see their content here</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      {allPosts.map((post, index) => (
        <div key={`wrapper-${index}`}>
          {renderPost(post, index)}
          {/* Insert ad every N posts */}
          {(index + 1) % adInterval === 0 && renderAd(Math.floor(index / adInterval))}
        </div>
      ))}

      {/* Infinite scroll trigger */}
      {hasMore && (
        <div ref={observerTarget} className="py-8 text-center">
          {isFetching ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <p className="text-df-fog">Loading more posts...</p>
            </div>
          ) : (
            <p className="text-df-fog">Scroll to load more</p>
          )}
        </div>
      )}

      {!hasMore && allPosts.length > 0 && (
        <div className="py-8 text-center">
          <p className="text-df-fog">You've reached the end of the feed</p>
        </div>
      )}
    </div>
  );
}
