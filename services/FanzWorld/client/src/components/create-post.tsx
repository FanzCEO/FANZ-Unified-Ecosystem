import { useState } from "react";
import { Image, Video, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/schema";

export function CreatePost() {
  const [content, setContent] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const createPostMutation = useMutation({
    mutationFn: async (postData: { content: string }) => {
      return apiRequest("POST", "/api/posts", postData);
    },
    onSuccess: async () => {
      setContent("");
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: "Success",
        description: "Your post has been published to the universe!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      createPostMutation.mutate({ content: content.trim() });
    }
  };

  return (
    <div className="post-card p-4 sm:p-6 rounded-xl mb-4 sm:mb-6 shadow-glow">
      <form onSubmit={handleSubmit}>
        <div className="flex items-start space-x-3 sm:space-x-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-cyber-blue overflow-hidden flex-shrink-0">
            <img
              src={user?.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&h=96&fit=crop&crop=face"}
              alt="Your Avatar"
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <Textarea
              placeholder="What's happening in your universe?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="cyber-input w-full bg-transparent text-white placeholder-gray-400 resize-none border-none focus:outline-none text-base sm:text-lg min-h-[60px] sm:min-h-[80px] focus:ring-0"
              data-testid="create-post-textarea"
            />
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-700 space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-2 sm:space-x-4 overflow-x-auto w-full sm:w-auto">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-1 sm:space-x-2 text-cyber-blue hover:bg-cyber-blue/10 px-2 sm:px-3 py-1 sm:py-2 rounded-full transition-colors whitespace-nowrap"
                  data-testid="attach-image"
                >
                  <Image className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm">Photo</span>
                </Button>
                
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-1 sm:space-x-2 text-electric-purple hover:bg-electric-purple/10 px-2 sm:px-3 py-1 sm:py-2 rounded-full transition-colors whitespace-nowrap"
                  data-testid="attach-video"
                >
                  <Video className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm">Video</span>
                </Button>
                
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-1 sm:space-x-2 text-laser-green hover:bg-laser-green/10 px-2 sm:px-3 py-1 sm:py-2 rounded-full transition-colors whitespace-nowrap"
                  data-testid="attach-poll"
                >
                  <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm">Poll</span>
                </Button>
              </div>
              
              <Button
                type="submit"
                disabled={!content.trim() || createPostMutation.isPending}
                className="neon-button bg-gradient-to-r from-cyber-blue to-electric-purple text-black font-bold px-4 sm:px-6 py-1.5 sm:py-2 rounded-full border-cyber-blue hover:shadow-neon-cyan transition-all duration-300 disabled:opacity-50 text-sm sm:text-base w-full sm:w-auto"
                data-testid="publish-post"
              >
                {createPostMutation.isPending ? "Posting..." : "Post"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
