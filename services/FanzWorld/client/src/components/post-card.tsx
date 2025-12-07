import { Heart, MessageCircle, Share, Bookmark, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PostWithAuthor } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";

interface PostCardProps {
  post: PostWithAuthor;
}

export function PostCard({ post }: PostCardProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const likeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/posts/${post.id}/like`);
    },
    onSuccess: async (response) => {
      const data = await response.json();
      
      // Update the post in the cache
      queryClient.setQueryData(["/api/posts"], (oldPosts: PostWithAuthor[] = []) => 
        oldPosts.map(p => 
          p.id === post.id 
            ? { ...p, isLiked: data.isLiked, likesCount: data.likesCount }
            : p
        )
      );
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive",
      });
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/posts/${post.id}/bookmark`);
    },
    onSuccess: async (response) => {
      const data = await response.json();
      
      // Update the post in multiple query caches
      const updatePostInCache = (queryKey: any[]) => {
        queryClient.setQueryData(queryKey, (oldPosts: PostWithAuthor[] = []) => 
          oldPosts.map(p => 
            p.id === post.id 
              ? { ...p, isBookmarked: data.isBookmarked }
              : p
          )
        );
      };
      
      updatePostInCache(["/api/posts"]);
      updatePostInCache(["/api/bookmarks"]);
      
      // If removing bookmark, invalidate bookmarks cache to refresh the list
      if (!data.isBookmarked) {
        queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      }
      
      toast({
        title: "Success",
        description: data.isBookmarked ? "Post bookmarked!" : "Bookmark removed",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update bookmark status",
        variant: "destructive",
      });
    },
  });

  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });

  return (
    <article className="post-card p-4 sm:p-6 rounded-xl shadow-glow transition-all duration-300">
      <div className="flex items-start space-x-3 sm:space-x-4">
        <Link href={`/profile/${post.author.username}`}>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-neon-pink overflow-hidden flex-shrink-0 cursor-pointer hover:shadow-glow transition-all duration-300">
            <img
              src={post.author.avatar || `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&h=96&fit=crop&crop=face`}
              alt={post.author.displayName}
              className="w-full h-full object-cover"
            />
          </div>
        </Link>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2 flex-wrap">
            <Link href={`/profile/${post.author.username}`}>
              <h3 className="font-semibold text-neon-pink text-sm sm:text-base hover:text-cyber-blue transition-colors cursor-pointer">
                {post.author.displayName}
              </h3>
            </Link>
            <span className="text-gray-400 text-sm">@{post.author.username}</span>
            <span className="text-gray-500 text-xs sm:text-sm">{timeAgo.replace('about ', '')}</span>
            {post.author.verified && (
              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-cyber-blue" />
            )}
          </div>
          
          <p className="text-white mb-3 sm:mb-4 leading-relaxed text-sm sm:text-base">{post.content}</p>
          
          {post.imageUrl && (
            <div className="rounded-xl overflow-hidden mb-3 sm:mb-4 border border-cyber-blue/30">
              <img
                src={post.imageUrl}
                alt="Post content"
                className="w-full h-48 sm:h-64 object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}
          
          <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-gray-700">
            <Button
              variant="ghost"
              size="sm"
              className={`flex items-center space-x-1 sm:space-x-2 transition-colors group p-1 sm:p-2 ${
                post.isLiked ? 'text-neon-pink' : 'text-gray-400 hover:text-neon-pink'
              }`}
              onClick={() => likeMutation.mutate()}
              disabled={likeMutation.isPending}
              data-testid={`like-button-${post.id}`}
            >
              <div className="p-1 sm:p-2 rounded-full hover:bg-neon-pink/10 transition-colors">
                <Heart className={`w-3 h-3 sm:w-4 sm:h-4 ${post.isLiked ? 'fill-current' : ''}`} />
              </div>
              <span className="text-xs sm:text-sm">{post.likesCount}</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center space-x-1 sm:space-x-2 text-gray-400 hover:text-cyber-blue transition-colors group p-1 sm:p-2"
              data-testid={`comment-button-${post.id}`}
            >
              <div className="p-1 sm:p-2 rounded-full hover:bg-cyber-blue/10 transition-colors">
                <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
              </div>
              <span className="text-xs sm:text-sm">{post.commentsCount}</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center space-x-1 sm:space-x-2 text-gray-400 hover:text-laser-green transition-colors group p-1 sm:p-2"
              data-testid={`share-button-${post.id}`}
            >
              <div className="p-1 sm:p-2 rounded-full hover:bg-laser-green/10 transition-colors">
                <Share className="w-3 h-3 sm:w-4 sm:h-4" />
              </div>
              <span className="text-xs sm:text-sm">{post.sharesCount}</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className={`flex items-center space-x-1 sm:space-x-2 transition-colors group p-1 sm:p-2 ${
                post.isBookmarked ? 'text-electric-purple' : 'text-gray-400 hover:text-electric-purple'
              }`}
              onClick={() => bookmarkMutation.mutate()}
              disabled={bookmarkMutation.isPending}
              data-testid={`bookmark-button-${post.id}`}
            >
              <div className="p-1 sm:p-2 rounded-full hover:bg-electric-purple/10 transition-colors">
                <Bookmark className={`w-3 h-3 sm:w-4 sm:h-4 ${post.isBookmarked ? 'fill-current' : ''}`} />
              </div>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
