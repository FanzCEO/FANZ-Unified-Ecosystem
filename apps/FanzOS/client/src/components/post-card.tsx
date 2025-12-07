import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import TipModal from "@/components/tip-modal";
import { 
  Heart, 
  MessageCircle, 
  Share, 
  DollarSign, 
  Lock, 
  MoreVertical 
} from "lucide-react";

interface PostCardProps {
  post: {
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
    hasLiked?: boolean;
    hasUnlocked?: boolean;
  };
  onLike: () => void;
  showCreatorInfo?: boolean;
}

export default function PostCard({ post, onLike, showCreatorInfo = true }: PostCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showTipModal, setShowTipModal] = useState(false);

  const unlockMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/posts/${post.id}/unlock`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: "Content Unlocked",
        description: "You can now view this PPV content",
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
        title: "Error",
        description: "Failed to unlock content. Check your balance.",
        variant: "destructive",
      });
    },
  });

  const handleUnlock = () => {
    if (post.ppvPrice && parseFloat(post.ppvPrice) > parseFloat(user?.balance || '0')) {
      toast({
        title: "Insufficient Balance",
        description: "Please add funds to your wallet to unlock this content",
        variant: "destructive",
      });
      return;
    }
    unlockMutation.mutate();
  };

  const isOwner = user?.id === post.creatorId;
  const canViewContent = post.postType === 'free' || post.hasUnlocked || isOwner;
  const isPpvLocked = post.postType === 'ppv' && !post.hasUnlocked && !isOwner;

  return (
    <>
      <Card className="bg-slate border-gray-700 overflow-hidden">
        {/* Post Header */}
        {showCreatorInfo && (
          <div className="p-6 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img 
                  src={`https://via.placeholder.com/48x48`} 
                  alt="Creator" 
                  className="w-12 h-12 rounded-full object-cover" 
                  data-testid={`img-creator-avatar-${post.id}`}
                />
                <div>
                  <h3 className="font-semibold text-white" data-testid={`text-creator-name-${post.id}`}>
                    Creator Name
                  </h3>
                  <p className="text-sm text-gray-400" data-testid={`text-post-time-${post.id}`}>
                    {new Date(post.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {post.postType === 'ppv' && (
                  <Badge variant="secondary" className="bg-primary bg-opacity-20 text-primary" data-testid={`badge-ppv-${post.id}`}>
                    PPV
                  </Badge>
                )}
                {post.postType === 'subscription_only' && (
                  <Badge variant="secondary" className="bg-secondary bg-opacity-20 text-secondary" data-testid={`badge-exclusive-${post.id}`}>
                    EXCLUSIVE
                  </Badge>
                )}
                <Button variant="ghost" size="sm" className="text-gray-400" data-testid={`button-post-menu-${post.id}`}>
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Post Content */}
        <div className="px-6 pb-4">
          <p className="text-white" data-testid={`text-post-content-${post.id}`}>
            {post.content}
          </p>
        </div>

        {/* Post Media */}
        {post.mediaUrl && (
          <div className="relative">
            <img 
              src={post.mediaUrl} 
              alt="Post content" 
              className="w-full h-96 object-cover" 
              data-testid={`img-post-media-${post.id}`}
            />
            {isPpvLocked && (
              <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                <div className="text-center text-white">
                  <Lock className="w-12 h-12 mx-auto mb-4" />
                  <p className="text-lg font-semibold mb-2" data-testid={`text-ppv-title-${post.id}`}>
                    Pay-Per-View Content
                  </p>
                  <p className="text-gray-200 mb-4" data-testid={`text-ppv-price-${post.id}`}>
                    Unlock for ${parseFloat(post.ppvPrice || '0').toFixed(2)}
                  </p>
                  <Button 
                    onClick={handleUnlock}
                    disabled={unlockMutation.isPending}
                    className="bg-gradient-to-r from-primary to-secondary hover:from-purple-600 hover:to-pink-600"
                    data-testid={`button-unlock-${post.id}`}
                  >
                    {unlockMutation.isPending ? "Unlocking..." : "Unlock Now"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Post Actions */}
        <div className="p-6 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onLike}
                className={`flex items-center space-x-2 ${
                  post.hasLiked ? 'text-red-400' : 'text-gray-400 hover:text-red-400'
                } transition-colors`}
                data-testid={`button-like-${post.id}`}
              >
                <Heart className={`w-5 h-5 ${post.hasLiked ? 'fill-current' : ''}`} />
                <span>{post.likesCount}</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                data-testid={`button-comment-${post.id}`}
              >
                <MessageCircle className="w-5 h-5" />
                <span>{post.commentsCount}</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                data-testid={`button-share-${post.id}`}
              >
                <Share className="w-5 h-5" />
                <span>Share</span>
              </Button>
            </div>
            {!isOwner && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowTipModal(true)}
                className="flex items-center space-x-2 text-accent hover:text-yellow-400 transition-colors"
                data-testid={`button-tip-${post.id}`}
              >
                <DollarSign className="w-5 h-5" />
                <span>Tip</span>
              </Button>
            )}
          </div>
        </div>
      </Card>

      <TipModal
        isOpen={showTipModal}
        onClose={() => setShowTipModal(false)}
        recipientId={post.creatorId}
        recipientName="Creator"
      />
    </>
  );
}
