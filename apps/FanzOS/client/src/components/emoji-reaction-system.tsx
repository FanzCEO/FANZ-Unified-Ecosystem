import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Heart, Smile, ThumbsUp, Fire, Star, Zap, Eye, Gift } from "lucide-react";

interface EmojiReaction {
  id: string;
  emoji: string;
  label: string;
  color: string;
  icon: any;
  count: number;
  userReacted: boolean;
}

interface TextualEmojiReactionProps {
  contentId: string;
  contentType: 'post' | 'comment' | 'message' | 'video';
  initialReactions?: EmojiReaction[];
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  animated?: boolean;
}

const EMOJI_REACTIONS = [
  { emoji: '❤️', label: 'Love', color: 'text-red-500', icon: Heart },
  { emoji: '😍', label: 'Amazing', color: 'text-pink-500', icon: Smile },
  { emoji: '👍', label: 'Like', color: 'text-blue-500', icon: ThumbsUp },
  { emoji: '🔥', label: 'Fire', color: 'text-orange-500', icon: Fire },
  { emoji: '⭐', label: 'Star', color: 'text-yellow-500', icon: Star },
  { emoji: '⚡', label: 'Electric', color: 'text-purple-500', icon: Zap },
  { emoji: '👀', label: 'Eyes', color: 'text-green-500', icon: Eye },
  { emoji: '🎁', label: 'Gift', color: 'text-indigo-500', icon: Gift },
];

export function TextualEmojiReactionSystem({
  contentId,
  contentType,
  initialReactions = [],
  size = 'md',
  showLabels = true,
  animated = true
}: TextualEmojiReactionProps) {
  const [reactions, setReactions] = useState<EmojiReaction[]>([]);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // Get reactions for this content
  const { data: reactionData, isLoading } = useQuery({
    queryKey: [`/api/reactions/${contentType}/${contentId}`],
    staleTime: 30000, // 30 seconds
  });

  // Add or remove reaction mutation
  const reactionMutation = useMutation({
    mutationFn: async ({ emoji, action }: { emoji: string; action: 'add' | 'remove' }) => {
      const response = await apiRequest('POST', `/api/reactions/${contentType}/${contentId}`, {
        emoji,
        action
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/reactions/${contentType}/${contentId}`] });
    },
  });

  useEffect(() => {
    if (reactionData?.reactions) {
      const processedReactions = EMOJI_REACTIONS.map(emojiDef => {
        const reactionCount = reactionData.reactions.filter((r: any) => r.emoji === emojiDef.emoji).length;
        const userReacted = reactionData.userReactions?.some((r: any) => r.emoji === emojiDef.emoji) || false;
        
        return {
          id: `${contentId}-${emojiDef.emoji}`,
          ...emojiDef,
          count: reactionCount,
          userReacted
        };
      }).filter(r => r.count > 0 || r.userReacted);
      
      setReactions(processedReactions);
    }
  }, [reactionData, contentId]);

  const handleReaction = (emoji: string) => {
    const existingReaction = reactions.find(r => r.emoji === emoji);
    const action = existingReaction?.userReacted ? 'remove' : 'add';
    
    reactionMutation.mutate({ emoji, action });
    setIsPopoverOpen(false);
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          button: 'h-6 px-2 text-xs',
          emoji: 'text-sm',
          icon: 'h-3 w-3'
        };
      case 'lg':
        return {
          button: 'h-10 px-4 text-base',
          emoji: 'text-lg',
          icon: 'h-5 w-5'
        };
      default:
        return {
          button: 'h-8 px-3 text-sm',
          emoji: 'text-base',
          icon: 'h-4 w-4'
        };
    }
  };

  const sizeClasses = getSizeClasses();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
        <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Existing reactions */}
      {reactions.map((reaction) => {
        const Icon = reaction.icon;
        return (
          <Button
            key={reaction.id}
            variant={reaction.userReacted ? "default" : "outline"}
            size="sm"
            className={cn(
              sizeClasses.button,
              "transition-all duration-200",
              reaction.userReacted && "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0",
              !reaction.userReacted && "hover:scale-105",
              animated && reaction.userReacted && "animate-pulse"
            )}
            onClick={() => handleReaction(reaction.emoji)}
            data-testid={`reaction-${reaction.emoji}`}
          >
            <span className={cn(sizeClasses.emoji, "mr-1")}>
              {reaction.emoji}
            </span>
            {showLabels && (
              <span className="hidden sm:inline">{reaction.label}</span>
            )}
            <Badge 
              variant="secondary" 
              className={cn(
                "ml-1 px-1.5 py-0.5 text-xs",
                reaction.userReacted && "bg-white/20 text-white"
              )}
            >
              {reaction.count}
            </Badge>
          </Button>
        );
      })}

      {/* Add reaction popover */}
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              sizeClasses.button,
              "hover:scale-105 transition-transform border-dashed"
            )}
            data-testid="add-reaction-button"
          >
            <Smile className={cn(sizeClasses.icon, "mr-1")} />
            <span className="hidden sm:inline">React</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-3" data-testid="reaction-popover">
          <div className="grid grid-cols-4 gap-2">
            {EMOJI_REACTIONS.map((emojiDef) => {
              const Icon = emojiDef.icon;
              const isSelected = reactions.find(r => r.emoji === emojiDef.emoji)?.userReacted;
              
              return (
                <Button
                  key={emojiDef.emoji}
                  variant={isSelected ? "default" : "ghost"}
                  className={cn(
                    "flex flex-col items-center gap-1 h-16 p-2",
                    "hover:scale-105 transition-all duration-200",
                    isSelected && "bg-gradient-to-br from-purple-500 to-pink-500 text-white"
                  )}
                  onClick={() => handleReaction(emojiDef.emoji)}
                  data-testid={`emoji-option-${emojiDef.label.toLowerCase()}`}
                >
                  <span className="text-lg">{emojiDef.emoji}</span>
                  <span className="text-xs font-medium">{emojiDef.label}</span>
                </Button>
              );
            })}
          </div>
          
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-muted-foreground text-center">
              Express how this content makes you feel!
            </p>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Animated reaction burst effect
export function ReactionBurst({ emoji, onComplete }: { emoji: string; onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-50">
      <div className="animate-ping">
        <span className="text-6xl">{emoji}</span>
      </div>
    </div>
  );
}

// Quick reaction bar for posts
export function QuickReactionBar({ contentId, contentType }: { contentId: string; contentType: string }) {
  const quickReactions = ['❤️', '😍', '🔥', '👍'];
  
  return (
    <div className="flex items-center gap-1 p-2 bg-white/80 backdrop-blur-sm rounded-full border shadow-sm">
      {quickReactions.map((emoji) => (
        <Button
          key={emoji}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:scale-125 transition-transform rounded-full"
          data-testid={`quick-reaction-${emoji}`}
        >
          <span className="text-lg">{emoji}</span>
        </Button>
      ))}
    </div>
  );
}