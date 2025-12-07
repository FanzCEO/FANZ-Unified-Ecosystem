import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import MediaUploader from "@/components/media-uploader";
import { 
  Image, 
  Video, 
  DollarSign, 
  Lock, 
  Users, 
  Wand2,
  X,
  Send,
  Globe,
  Crown
} from "lucide-react";

interface PostCreatorProps {
  onPostCreated?: () => void;
  onClose?: () => void;
  className?: string;
}

export default function PostCreator({ onPostCreated, onClose, className = "" }: PostCreatorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState<"free" | "ppv" | "subscription_only">("free");
  const [ppvPrice, setPpvPrice] = useState("");
  const [uploadedMedia, setUploadedMedia] = useState<any[]>([]);
  const [showMediaUploader, setShowMediaUploader] = useState(false);

  const createPostMutation = useMutation({
    mutationFn: async () => {
      const postData = {
        content: content.trim(),
        postType,
        ppvPrice: postType === "ppv" ? ppvPrice : null,
        mediaUrl: uploadedMedia.length > 0 ? uploadedMedia[0].mediaId : null,
        mediaType: uploadedMedia.length > 0 ? (uploadedMedia[0].file.type.startsWith('video/') ? 'video' : 'image') : null
      };

      const response = await apiRequest("POST", "/api/posts", postData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Post Created",
        description: "Your post has been published successfully!",
      });
      
      // Reset form
      setContent("");
      setPostType("free");
      setPpvPrice("");
      setUploadedMedia([]);
      
      // Refresh feed
      queryClient.invalidateQueries({ queryKey: ["/api/posts/feed"] });
      
      onPostCreated?.();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create Post",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!content.trim() && uploadedMedia.length === 0) {
      toast({
        title: "Content Required",
        description: "Please add some text or media to your post",
        variant: "destructive",
      });
      return;
    }

    if (postType === "ppv" && (!ppvPrice || parseFloat(ppvPrice) <= 0)) {
      toast({
        title: "PPV Price Required",
        description: "Please set a valid price for pay-per-view content",
        variant: "destructive",
      });
      return;
    }

    createPostMutation.mutate();
  };

  const removeMedia = (index: number) => {
    setUploadedMedia(prev => prev.filter((_, i) => i !== index));
  };

  const isCreator = user?.role === 'creator';
  const isVerified = user?.isVerified || false;

  if (!isCreator) {
    return (
      <Card className={`bg-gray-800 border-gray-700 ${className}`}>
        <CardContent className="p-6 text-center">
          <Crown className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-white mb-2">Creator Access Required</h3>
          <p className="text-gray-400 mb-4">
            To create posts and upload content, you need to be a verified creator.
          </p>
          <Button 
            onClick={() => window.location.href = '/api/login'}
            className="bg-gradient-to-r from-primary to-secondary hover:from-purple-600 hover:to-pink-600"
          >
            Become a Creator
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-gray-800 border-gray-700 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center">
            <Wand2 className="w-5 h-5 mr-2 text-primary" />
            Create Post
          </CardTitle>
          {onClose && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        {!isVerified && (
          <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-3">
            <p className="text-yellow-400 text-sm">
              ⚠️ Complete your verification to unlock all creator features
            </p>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Content Input */}
        <div>
          <Textarea
            placeholder="What's on your mind? Share with your fans..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 min-h-[100px] resize-none"
            maxLength={2000}
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-400">
              {content.length}/2000 characters
            </span>
            {content.length > 1800 && (
              <span className="text-xs text-yellow-400">
                {2000 - content.length} characters remaining
              </span>
            )}
          </div>
        </div>

        {/* Media Upload */}
        {!showMediaUploader ? (
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMediaUploader(true)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <Image className="w-4 h-4 mr-2" />
              Add Photos
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMediaUploader(true)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <Video className="w-4 h-4 mr-2" />
              Add Videos
            </Button>
          </div>
        ) : (
          <div>
            <MediaUploader
              maxFiles={1}
              onUploadComplete={(files) => {
                setUploadedMedia(files);
                setShowMediaUploader(false);
              }}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMediaUploader(false)}
              className="mt-2 text-gray-400"
            >
              Cancel Upload
            </Button>
          </div>
        )}

        {/* Uploaded Media Preview */}
        {uploadedMedia.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-gray-400">Uploaded Media:</p>
            {uploadedMedia.map((media, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                <div className="flex items-center space-x-2">
                  {media.file.type.startsWith('video/') ? (
                    <Video className="w-4 h-4 text-purple-400" />
                  ) : (
                    <Image className="w-4 h-4 text-pink-400" />
                  )}
                  <span className="text-sm text-white">{media.file.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeMedia(index)}
                  className="text-red-400 hover:text-red-300"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <Separator className="bg-gray-600" />

        {/* Post Settings */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              Post Type
            </label>
            <Select value={postType} onValueChange={(value: any) => setPostType(value)}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-green-500" />
                    <span>Free - Everyone can see</span>
                  </div>
                </SelectItem>
                <SelectItem value="subscription_only">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-purple-500" />
                    <span>Subscribers Only</span>
                  </div>
                </SelectItem>
                <SelectItem value="ppv">
                  <div className="flex items-center space-x-2">
                    <Lock className="w-4 h-4 text-yellow-500" />
                    <span>Pay-Per-View</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* PPV Price */}
          {postType === "ppv" && (
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                PPV Price
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="number"
                  step="0.01"
                  min="0.99"
                  placeholder="9.99"
                  value={ppvPrice}
                  onChange={(e) => setPpvPrice(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white pl-10"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Minimum $0.99. Fans will pay to unlock this content.
              </p>
            </div>
          )}

          {/* Post Type Info */}
          <div className="flex items-center space-x-2">
            {postType === "free" && (
              <Badge variant="secondary" className="bg-green-900 text-green-400">
                <Globe className="w-3 h-3 mr-1" />
                Public Post
              </Badge>
            )}
            {postType === "subscription_only" && (
              <Badge variant="secondary" className="bg-purple-900 text-purple-400">
                <Users className="w-3 h-3 mr-1" />
                Subscribers Only
              </Badge>
            )}
            {postType === "ppv" && (
              <Badge variant="secondary" className="bg-yellow-900 text-yellow-400">
                <Lock className="w-3 h-3 mr-1" />
                Pay-Per-View ${ppvPrice || "0.00"}
              </Badge>
            )}
          </div>
        </div>

        <Separator className="bg-gray-600" />

        {/* Submit Button */}
        <div className="flex justify-end space-x-2">
          {onClose && (
            <Button 
              variant="outline" 
              onClick={onClose}
              className="border-gray-600 text-gray-300"
            >
              Cancel
            </Button>
          )}
          <Button 
            onClick={handleSubmit}
            disabled={createPostMutation.isPending || (!content.trim() && uploadedMedia.length === 0)}
            className="bg-gradient-to-r from-primary to-secondary hover:from-purple-600 hover:to-pink-600"
          >
            <Send className="w-4 h-4 mr-2" />
            {createPostMutation.isPending ? "Publishing..." : "Publish Post"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}