import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CloudUpload } from "lucide-react";
import { ObjectUploader } from "@/components/ObjectUploader";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UploadResult } from "@uppy/core";

interface MediaUploadData {
  title: string;
  description: string;
  postType: string;
  price: number;
  isPublic: boolean;
  addWatermark: boolean;
  scheduleForLater: boolean;
}

export function MediaUpload() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadData, setUploadData] = useState<MediaUploadData>({
    title: "",
    description: "",
    postType: "public",
    price: 0,
    isPublic: true,
    addWatermark: false,
    scheduleForLater: false,
  });

  const createMediaMutation = useMutation({
    mutationFn: async (mediaData: any) => {
      const response = await apiRequest("POST", "/api/media", mediaData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your content has been uploaded and is now in review.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      // Reset form
      setUploadData({
        title: "",
        description: "",
        postType: "public",
        price: 0,
        isPublic: true,
        addWatermark: false,
        scheduleForLater: false,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to upload content. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGetUploadParameters = async () => {
    const response = await apiRequest("POST", "/api/objects/upload", {});
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

  const handleUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (!result.successful || result.successful.length === 0) {
      toast({
        title: "Error",
        description: "No files were uploaded successfully.",
        variant: "destructive",
      });
      return;
    }

    const uploadedFile = result.successful[0];
    const mediaUrl = uploadedFile.uploadURL;

    try {
      // Set ACL policy for the uploaded file
      await apiRequest("PUT", "/api/media/upload", {
        mediaUrl,
        isPublic: uploadData.isPublic,
      });

      // Create media record
      const mediaData = {
        title: uploadData.title,
        description: uploadData.description,
        filename: uploadedFile.name || "unknown",
        s3Key: mediaUrl,
        mimeType: uploadedFile.type || "application/octet-stream",
        fileSize: uploadedFile.size || 0,
        isPublic: uploadData.isPublic,
        price: uploadData.postType === "premium" ? Math.round(uploadData.price * 100) : null,
      };

      createMediaMutation.mutate(mediaData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process uploaded file.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="glass-overlay border-gf-smoke/20">
      <CardContent className="p-8">
        <h2 className="font-display font-bold text-2xl text-gf-snow mb-6">Create New Post</h2>

        <form className="space-y-6">
          {/* Content Input */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-gf-smoke">Title</Label>
            <Input
              id="title"
              placeholder="Give your content a catchy title..."
              value={uploadData.title}
              onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
              className="bg-gf-graphite border-gf-smoke/20 text-gf-snow placeholder-gf-smoke focus:border-gf-pink"
              data-testid="input-content-title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-gf-smoke">Description</Label>
            <Textarea
              id="description"
              placeholder="What's on your mind? Share your thoughts with your fans..."
              value={uploadData.description}
              onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
              className="bg-gf-graphite border-gf-smoke/20 text-gf-snow placeholder-gf-smoke resize-none h-32 focus:border-gf-pink"
              data-testid="textarea-content-description"
            />
          </div>

          {/* Media Upload Area */}
          <div className="border-2 border-dashed border-gf-smoke/30 rounded-lg p-8 text-center hover:border-gf-pink transition-colors">
            <CloudUpload className="mx-auto h-12 w-12 text-gf-smoke mb-4" />
            <p className="text-gf-smoke mb-2">Drag & drop your media here, or click to browse</p>
            <p className="text-sm text-gf-smoke/70 mb-4">Supports images, videos, and audio files up to 100MB</p>
            
            <ObjectUploader
              maxNumberOfFiles={5}
              maxFileSize={100 * 1024 * 1024} // 100MB
              onGetUploadParameters={handleGetUploadParameters}
              onComplete={handleUploadComplete}
              buttonClassName="bg-gf-violet text-gf-snow hover:bg-gf-violet/80"
            >
              Choose Files
            </ObjectUploader>
          </div>

          {/* Post Settings */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="postType" className="text-gf-smoke">Post Type</Label>
              <Select
                value={uploadData.postType}
                onValueChange={(value) => setUploadData({ 
                  ...uploadData, 
                  postType: value,
                  isPublic: value === "public"
                })}
              >
                <SelectTrigger className="bg-gf-graphite border-gf-smoke/20 text-gf-snow focus:border-gf-pink">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gf-graphite border-gf-smoke/20">
                  <SelectItem value="public">Public Post</SelectItem>
                  <SelectItem value="fan-only">Fan-Only Post</SelectItem>
                  <SelectItem value="premium">Premium Content</SelectItem>
                  <SelectItem value="live">Live Stream</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {uploadData.postType === "premium" && (
              <div className="space-y-2">
                <Label htmlFor="price" className="text-gf-smoke">Price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gf-smoke">$</span>
                  <Input
                    id="price"
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    value={uploadData.price}
                    onChange={(e) => setUploadData({ ...uploadData, price: parseFloat(e.target.value) || 0 })}
                    className="bg-gf-graphite border-gf-smoke/20 pl-8 text-gf-snow placeholder-gf-smoke focus:border-gf-pink"
                    data-testid="input-content-price"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Options */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6 text-sm text-gf-smoke">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="schedule"
                  checked={uploadData.scheduleForLater}
                  onCheckedChange={(checked) => setUploadData({ ...uploadData, scheduleForLater: !!checked })}
                />
                <Label htmlFor="schedule">Schedule for later</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="watermark"
                  checked={uploadData.addWatermark}
                  onCheckedChange={(checked) => setUploadData({ ...uploadData, addWatermark: !!checked })}
                />
                <Label htmlFor="watermark">Add watermark</Label>
              </div>
            </div>

            <Button
              type="submit"
              disabled={createMediaMutation.isPending || !uploadData.title.trim()}
              className="bg-gf-gradient text-gf-snow hover:shadow-glow-pink"
              data-testid="button-publish-post"
            >
              {createMediaMutation.isPending ? "Publishing..." : "Publish Post"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
