import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Heart, MessageCircle, MoreVertical, Send, Pin } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { PostComment } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface PostCommentsProps {
  postId: string;
}

interface CommentWithAuthor extends PostComment {
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
  };
  isLiked: boolean;
  replies?: CommentWithAuthor[];
}

export function PostComments({ postId }: PostCommentsProps) {
  const { toast } = useToast();
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  // Fetch comments
  const { data: comments = [], isLoading } = useQuery<CommentWithAuthor[]>({
    queryKey: ['/api/posts', postId, 'comments'],
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (data: { content: string; parentId?: string }) => {
      const response = await apiRequest("POST", `/api/posts/${postId}/comments`, data);
      return response.json();
    },
    onSuccess: () => {
      setCommentText("");
      setReplyingTo(null);
      queryClient.invalidateQueries({ queryKey: ['/api/posts', postId, 'comments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/feed'] });
      toast({
        title: "Comment posted",
        description: "Your comment has been added",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to post comment",
        variant: "destructive",
      });
    },
  });

  // Like comment mutation
  const likeCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const response = await apiRequest("POST", `/api/comments/${commentId}/like`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts', postId, 'comments'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    
    addCommentMutation.mutate({
      content: commentText.trim(),
      parentId: replyingTo || undefined,
    });
  };

  const renderComment = (comment: CommentWithAuthor, isReply = false) => (
    <div
      key={comment.id}
      className={`flex gap-3 ${isReply ? 'ml-12 mt-3' : 'mt-4'}`}
      data-testid={`comment-${comment.id}`}
    >
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={comment.author.avatarUrl} />
        <AvatarFallback className="bg-gf-cyber/20 text-gf-cyber">
          {comment.author.displayName[0]}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="bg-gf-charcoal/30 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gf-snow text-sm">
                {comment.author.displayName}
              </span>
              <span className="text-gf-steel text-xs">
                @{comment.author.username}
              </span>
              {comment.isPinned && (
                <Pin className="h-3 w-3 text-gf-cyber" />
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-gf-steel hover:text-gf-snow"
              data-testid={`button-comment-options-${comment.id}`}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-gf-snow text-sm whitespace-pre-wrap break-words">
            {comment.content}
          </p>

          {comment.isEdited && (
            <span className="text-gf-steel text-xs italic">
              (edited)
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 mt-2 text-xs">
          <Button
            variant="ghost"
            size="sm"
            className={`h-auto p-0 gap-1 ${
              comment.isLiked ? 'text-gf-pink' : 'text-gf-steel'
            } hover:text-gf-pink`}
            onClick={() => likeCommentMutation.mutate(comment.id)}
            data-testid={`button-like-comment-${comment.id}`}
          >
            <Heart className="h-4 w-4" fill={comment.isLiked ? "currentColor" : "none"} />
            {comment.likes > 0 && <span>{comment.likes}</span>}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 gap-1 text-gf-steel hover:text-gf-cyber"
            onClick={() => setReplyingTo(comment.id)}
            data-testid={`button-reply-comment-${comment.id}`}
          >
            <MessageCircle className="h-4 w-4" />
            Reply
          </Button>

          <span className="text-gf-steel">
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
          </span>
        </div>

        {/* Render replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2">
            {comment.replies.map(reply => renderComment(reply, true))}
          </div>
        )}

        {/* Reply form */}
        {replyingTo === comment.id && (
          <form onSubmit={handleSubmit} className="mt-3">
            <div className="flex gap-2">
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={`Reply to @${comment.author.username}...`}
                className="min-h-[60px] bg-gf-ink border-gf-steel/20 text-gf-snow"
                data-testid="input-reply"
              />
              <div className="flex flex-col gap-2">
                <Button
                  type="submit"
                  size="icon"
                  disabled={!commentText.trim() || addCommentMutation.isPending}
                  className="bg-gradient-to-r from-gf-cyber to-gf-pink hover:opacity-90"
                  data-testid="button-submit-reply"
                >
                  <Send className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => {
                    setReplyingTo(null);
                    setCommentText("");
                  }}
                  className="border-gf-steel/20"
                  data-testid="button-cancel-reply"
                >
                  ×
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="h-8 w-8 bg-gf-charcoal/50 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gf-charcoal/50 rounded w-1/4"></div>
              <div className="h-12 bg-gf-charcoal/50 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-gf-steel/20">
      {/* Comment form */}
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="flex gap-3">
          <Textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment..."
            className="min-h-[80px] bg-gf-ink border-gf-steel/20 text-gf-snow resize-none"
            data-testid="input-comment"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!commentText.trim() || addCommentMutation.isPending}
            className="bg-gradient-to-r from-gf-cyber to-gf-pink hover:opacity-90 h-[80px] w-12"
            data-testid="button-submit-comment"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </form>

      {/* Comments list */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gf-snow">
          Comments ({comments.length})
        </h3>
        
        {comments.length === 0 ? (
          <p className="text-gf-steel text-sm text-center py-8">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          <div className="space-y-4">
            {comments.map(comment => renderComment(comment))}
          </div>
        )}
      </div>
    </div>
  );
}
