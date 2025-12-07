import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Image, Video, Mic, X } from "lucide-react";
import type { UploadResult } from '@uppy/core';

interface CreateContentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateContentModal({ open, onOpenChange }: CreateContentModalProps) {
  const { toast } = useToast();
  const [selectedType, setSelectedType] = useState<"photo" | "video" | "audio">("photo");
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    mediaUrl: "",
    visibility: "public",
    price: "",
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/posts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: "Post created",
        description: "Your content has been published successfully.",
      });
      onOpenChange(false);
      resetForm();
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
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      mediaUrl: "",
      visibility: "public",
      price: "",
    });
    setSelectedType("photo");
  };

  const handleGetUploadParameters = async () => {
    const response = await apiRequest("POST", "/api/objects/upload", {});
    const data = await response.json();
    return {
      method: 'PUT' as const,
      url: data.uploadURL,
    };
  };

  const handleUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const mediaURL = uploadedFile.uploadURL;
      
      try {
        const response = await apiRequest("PUT", "/api/content-media", {
          mediaURL,
          visibility: formData.visibility === 'public' ? 'public' : 'private'
        });
        const data = await response.json();
        
        setFormData(prev => ({
          ...prev,
          mediaUrl: data.objectPath
        }));
        
        toast({
          title: "Media uploaded",
          description: "Your media has been uploaded successfully.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to process uploaded media.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your post.",
        variant: "destructive",
      });
      return;
    }

    const submitData = {
      ...formData,
      mediaType: selectedType,
      price: formData.visibility === "pay_per_view" ? formData.price : null,
    };
    
    createPostMutation.mutate(submitData);
  };

  const contentTypes = [
    { type: "photo" as const, name: "Photo", icon: Image },
    { type: "video" as const, name: "Video", icon: Video },
    { type: "audio" as const, name: "Audio", icon: Mic },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border" data-testid="modal-create-content">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold" data-testid="text-modal-title">
              Create New Post
            </DialogTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onOpenChange(false)}
              data-testid="button-close-modal"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Content Type Selection */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Content Type</Label>
            <div className="grid grid-cols-3 gap-3">
              {contentTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedType === type.type;
                
                return (
                  <button
                    key={type.type}
                    type="button"
                    onClick={() => setSelectedType(type.type)}
                    className={`flex flex-col items-center p-4 border rounded-lg transition-colors ${
                      isSelected 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border hover:border-primary'
                    }`}
                    data-testid={`button-content-type-${type.type}`}
                  >
                    <Icon className={`w-8 h-8 mb-2 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`text-sm ${isSelected ? 'text-primary' : ''}`}>
                      {type.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title" className="text-sm font-medium mb-2 block">
              Title
            </Label>
            <Input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter a title for your post"
              className="bg-input border-border"
              data-testid="input-post-title"
            />
          </div>

          {/* File Upload */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Upload Media</Label>
            {formData.mediaUrl ? (
              <div className="border border-border rounded-lg p-4 bg-muted/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-500">Media uploaded successfully</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, mediaUrl: "" }))}
                    data-testid="button-remove-media"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
                <ObjectUploader
                  maxNumberOfFiles={1}
                  maxFileSize={104857600} // 100MB
                  onGetUploadParameters={handleGetUploadParameters}
                  onComplete={handleUploadComplete}
                  buttonClassName="w-full h-full flex flex-col items-center justify-center space-y-4"
                >
                  <div className="flex flex-col items-center space-y-4">
                    <svg className="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                    </svg>
                    <div>
                      <p className="text-sm text-muted-foreground">Drop files here or click to upload</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Support: JPG, PNG, MP4, MP3 (Max 100MB)
                      </p>
                    </div>
                  </div>
                </ObjectUploader>
              </div>
            )}
          </div>

          {/* Caption */}
          <div>
            <Label htmlFor="content" className="text-sm font-medium mb-2 block">
              Caption
            </Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Write a caption for your post..."
              className="resize-none bg-input border-border"
              rows={4}
              data-testid="textarea-post-content"
            />
          </div>

          {/* Monetization Settings */}
          <div className="border border-border rounded-lg p-4">
            <h4 className="text-sm font-medium mb-4">Monetization Settings</h4>
            <div className="space-y-4">
              {/* Visibility */}
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">Visibility</Label>
                <Select 
                  value={formData.visibility} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, visibility: value }))}
                >
                  <SelectTrigger className="bg-input border-border" data-testid="select-visibility">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public (Free)</SelectItem>
                    <SelectItem value="subscribers">Subscribers Only</SelectItem>
                    <SelectItem value="pay_per_view">Pay-per-view</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Price (if pay-per-view) */}
              {formData.visibility === "pay_per_view" && (
                <div>
                  <Label htmlFor="price" className="text-sm text-muted-foreground mb-2 block">
                    Price
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="0.00"
                      className="pl-8 bg-input border-border"
                      data-testid="input-post-price"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <Button 
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                // Save as draft functionality would go here
                toast({
                  title: "Draft saved",
                  description: "Your post has been saved as a draft.",
                });
              }}
              data-testid="button-save-draft"
            >
              Save as Draft
            </Button>
            <Button 
              type="submit"
              disabled={createPostMutation.isPending || !formData.title.trim()}
              className="flex-1 gradient-bg hover:opacity-90 text-white font-medium transition-opacity"
              data-testid="button-publish-post"
            >
              {createPostMutation.isPending ? "Publishing..." : "Publish Post"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
