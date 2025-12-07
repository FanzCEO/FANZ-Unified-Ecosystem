import { useEffect, useRef, useState, useCallback } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { PostComposer } from "@/components/feed/PostComposer";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, MessageCircle, Share2, Eye, Lock, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface FeedPost {
  id: string;
  creatorId: string;
  type: string;
  content: string;
  visibility: string;
  priceInCents?: number;
  isFreePreview: boolean;
  contentRating: string;
  isPinned: boolean;
  createdAt: string;
  isSponsored?: boolean;
}

interface FeedResponse {
  posts: FeedPost[];
  nextCursor: string | null;
  hasMore: boolean;
}

async function fetchFeed({ pageParam }: { pageParam?: string }): Promise<FeedResponse> {
  const url = pageParam 
    ? `/api/feed?cursor=${pageParam}&limit=20`
    : '/api/feed?limit=20';
  
  const response = await fetch(url, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    if (error.code === 'AGE_VERIFICATION_REQUIRED') {
      throw new Error('AGE_VERIFICATION_REQUIRED');
    }
    throw new Error(error.error || 'Failed to fetch feed');
  }

  return response.json();
}

function PostCard({ post }: { post: FeedPost }) {
  const isLocked = post.visibility === 'paid' && !post.isFreePreview;

  return (
    <Card 
      className={cn(
        "bg-gf-charcoal/50 border-gf-steel/20",
        post.isSponsored && "border-gf-cyber/40"
      )}
      data-testid={`card-post-${post.id}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-gf-cyber/50">
              <AvatarFallback className="bg-gradient-to-br from-gf-cyber to-gf-pink text-white">
                CR
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold text-gf-snow" data-testid={`text-creator-${post.id}`}>
                Creator
              </p>
              <p className="text-xs text-gf-steel">
                {new Date(post.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {post.isSponsored && (
              <Badge className="bg-gf-cyber/20 text-gf-cyber border-gf-cyber/40" data-testid="badge-sponsored">
                <Sparkles className="h-3 w-3 mr-1" />
                Sponsored
              </Badge>
            )}
            {post.visibility === 'paid' && (
              <Badge className="bg-gf-pink/20 text-gf-pink border-gf-pink/40" data-testid="badge-paid">
                💰 ${(post.priceInCents || 0) / 100}
              </Badge>
            )}
            {post.visibility === 'subscriber' && (
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40" data-testid="badge-subscribers">
                ⭐ Subscribers
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Content */}
        <div className={cn(
          "relative",
          isLocked && "blur-sm pointer-events-none"
        )}>
          <p className="text-gf-snow whitespace-pre-wrap" data-testid={`text-content-${post.id}`}>
            {post.content}
          </p>
        </div>

        {/* Unlock Button */}
        {isLocked && (
          <div className="flex justify-center py-4">
            <Button 
              className="bg-gradient-to-r from-gf-cyber to-gf-pink hover:opacity-90 text-white"
              data-testid={`button-unlock-${post.id}`}
            >
              <Lock className="h-4 w-4 mr-2" />
              Unlock for ${(post.priceInCents || 0) / 100}
            </Button>
          </div>
        )}

        {/* Engagement Metrics */}
        <div className="flex items-center gap-4 pt-3 border-t border-gf-steel/20">
          <Button
            variant="ghost"
            size="sm"
            className="text-gf-steel hover:text-gf-pink hover:bg-gf-pink/10"
            data-testid={`button-like-${post.id}`}
          >
            <Heart className="h-4 w-4 mr-1" />
            <span className="text-xs">Like</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-gf-steel hover:text-gf-cyber hover:bg-gf-cyber/10"
            data-testid={`button-comment-${post.id}`}
          >
            <MessageCircle className="h-4 w-4 mr-1" />
            <span className="text-xs">Comment</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-gf-steel hover:text-gf-snow hover:bg-gf-steel/10"
            data-testid={`button-share-${post.id}`}
          >
            <Share2 className="h-4 w-4 mr-1" />
            <span className="text-xs">Share</span>
          </Button>
          <div className="ml-auto flex items-center gap-1 text-gf-steel text-xs">
            <Eye className="h-3 w-3" />
            <span data-testid={`text-views-${post.id}`}>0</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PostSkeleton() {
  return (
    <Card className="bg-gf-charcoal/50 border-gf-steel/20">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-20 w-full" />
        <div className="flex gap-4">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function Feed() {
  const { user } = useAuth();
  const [showAgeVerification, setShowAgeVerification] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: ['/api/feed'],
    queryFn: fetchFeed,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined,
  });

  // Infinite scroll with IntersectionObserver
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    observerRef.current = new IntersectionObserver(handleObserver, {
      threshold: 0.5,
    });

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleObserver]);

  // Check for age verification error
  useEffect(() => {
    if (error?.message === 'AGE_VERIFICATION_REQUIRED') {
      setShowAgeVerification(true);
    }
  }, [error]);

  const allPosts = data?.pages.flatMap((page) => page.posts) ?? [];

  if (showAgeVerification) {
    return (
      <div className="min-h-screen bg-gf-ink text-gf-snow">
        <div className="max-w-4xl mx-auto px-4 py-20">
          <Card className="bg-gf-charcoal/50 border-gf-steel/20 text-center p-12">
            <div className="space-y-4">
              <div className="text-6xl">🔞</div>
              <h2 className="text-2xl font-bold text-gf-cyber">Age Verification Required</h2>
              <p className="text-gf-steel max-w-md mx-auto">
                You must verify your age to access this content. Click below to complete age verification with VerifyMy.
              </p>
              <Button 
                className="bg-gradient-to-r from-gf-cyber to-gf-pink hover:opacity-90 text-white mt-4"
                onClick={() => window.location.href = '/verification'}
                data-testid="button-verify-age"
              >
                Verify Age
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gf-ink text-gf-snow">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Post Composer */}
        {user && <PostComposer />}

        {/* Feed Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-gf-cyber to-gf-pink bg-clip-text text-transparent" data-testid="text-feed-title">
            Your Feed
          </h1>
          <Button
            variant="ghost"
            className="text-gf-steel hover:text-gf-snow"
            data-testid="button-filter"
          >
            Latest
          </Button>
        </div>

        {/* Posts */}
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <PostSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <Card className="bg-gf-charcoal/50 border-gf-steel/20 p-8 text-center">
            <p className="text-gf-steel">
              {error.message || 'Failed to load feed'}
            </p>
          </Card>
        ) : allPosts.length === 0 ? (
          <Card className="bg-gf-charcoal/50 border-gf-steel/20 p-12 text-center">
            <div className="space-y-4">
              <div className="text-6xl">📭</div>
              <h3 className="text-xl font-semibold text-gf-snow">No posts yet</h3>
              <p className="text-gf-steel">
                Follow creators or subscribe to see posts in your feed
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {allPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {/* Load More Trigger */}
        {hasNextPage && (
          <div
            ref={loadMoreRef}
            className="flex justify-center py-8"
            data-testid="div-load-more-trigger"
          >
            {isFetchingNextPage ? (
              <PostSkeleton />
            ) : (
              <Button
                variant="ghost"
                className="text-gf-steel"
                onClick={() => fetchNextPage()}
                data-testid="button-load-more"
              >
                Load more
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
