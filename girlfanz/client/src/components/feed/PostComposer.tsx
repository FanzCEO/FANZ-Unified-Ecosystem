import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertFeedPostSchema } from "@shared/schema";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ImagePlus, Video, DollarSign, Send, X } from "lucide-react";
import { useDropzone } from "react-dropzone";

const postFormSchema = insertFeedPostSchema.omit({
  id: true,
  creatorId: true,
  createdAt: true,
  updatedAt: true,
});

type PostFormValues = z.infer<typeof postFormSchema>;

interface MediaFile {
  id: string;
  file: File;
  preview: string;
  type: 'image' | 'video';
}

export function PostComposer() {
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<PostFormValues>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      type: "text",
      content: "",
      visibility: "subscriber",
      priceInCents: 0,
      isFreePreview: false,
      requiresAgeVerification: true,
      contentRating: "explicit",
      isPinned: false,
      isPublished: true,
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      preview: URL.createObjectURL(file),
      type: file.type.startsWith('video/') ? 'video' as const : 'image' as const
    }));
    
    setMediaFiles(prev => [...prev, ...newFiles]);
    
    // Auto-set post type based on media
    if (newFiles.length > 0) {
      const hasVideo = newFiles.some(f => f.type === 'video');
      const hasImage = newFiles.some(f => f.type === 'image');
      if (hasVideo && hasImage) {
        form.setValue('type', 'mixed');
      } else if (hasVideo) {
        form.setValue('type', 'video');
      } else {
        form.setValue('type', 'image');
      }
    }
  }, [form]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'video/*': ['.mp4', '.webm', '.mov']
    },
    maxSize: 100 * 1024 * 1024, // 100MB
    multiple: true
  });

  const removeMedia = (id: string) => {
    setMediaFiles(prev => {
      const filtered = prev.filter(f => f.id !== id);
      // Revoke object URL to free memory
      const removed = prev.find(f => f.id === id);
      if (removed) URL.revokeObjectURL(removed.preview);
      return filtered;
    });
  };

  const uploadMedia = async (file: File): Promise<string> => {
    // Get upload URL from backend
    const uploadResponse = await apiRequest("POST", "/api/objects/upload", {});
    const { uploadURL } = await uploadResponse.json();
    
    // Upload file to object storage
    await fetch(uploadURL, {
      method: "PUT",
      body: file,
      headers: {
        'Content-Type': file.type,
      }
    });
    
    return uploadURL.split('?')[0]; // Return URL without query params
  };

  const createPostMutation = useMutation({
    mutationFn: async (data: PostFormValues) => {
      setIsUploading(true);
      
      // Upload media files first
      const mediaUrls: string[] = [];
      for (const mediaFile of mediaFiles) {
        try {
          const url = await uploadMedia(mediaFile.file);
          mediaUrls.push(url);
        } catch (error) {
          console.error('Failed to upload media:', error);
          throw new Error(`Failed to upload ${mediaFile.file.name}`);
        }
      }
      
      // Create post
      const response = await apiRequest("POST", "/api/posts", data);
      const { post } = await response.json();
      
      // Attach media to post
      for (let i = 0; i < mediaUrls.length; i++) {
        await apiRequest("POST", `/api/posts/${post.id}/media`, {
          mediaUrl: mediaUrls[i],
          mediaType: mediaFiles[i].type,
          sortOrder: i,
        });
      }
      
      return post;
    },
    onSuccess: () => {
      toast({
        title: "Post created",
        description: "Your post has been published successfully",
      });
      form.reset();
      setMediaFiles([]);
      setIsExpanded(false);
      setIsUploading(false);
      queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
    },
    onError: (error: Error) => {
      setIsUploading(false);
      toast({
        title: "Error",
        description: error.message || "Failed to create post",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PostFormValues) => {
    if (isUploading) return;
    createPostMutation.mutate(data);
  };

  const visibility = form.watch("visibility");
  const isPaid = visibility === "paid";

  return (
    <Card className="bg-gf-charcoal/50 border-gf-steel/20" data-testid="card-post-composer">
      <CardContent className="p-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Content */}
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Share something with your fans..."
                      className="bg-gf-ink/50 border-gf-steel/20 text-gf-snow min-h-[100px] resize-none focus:ring-gf-cyber focus:border-gf-cyber"
                      onFocus={() => setIsExpanded(true)}
                      data-testid="input-post-content"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isExpanded && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Post Type */}
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gf-snow">Content Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-gf-ink/50 border-gf-steel/20 text-gf-snow" data-testid="select-post-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="text">📝 Text</SelectItem>
                          <SelectItem value="image">🖼️ Image</SelectItem>
                          <SelectItem value="video">🎬 Video</SelectItem>
                          <SelectItem value="mixed">📸 Mixed Media</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Visibility */}
                <FormField
                  control={form.control}
                  name="visibility"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gf-snow">Visibility</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-gf-ink/50 border-gf-steel/20 text-gf-snow" data-testid="select-visibility">
                            <SelectValue placeholder="Who can see this?" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="free">🌍 Everyone (Free)</SelectItem>
                          <SelectItem value="subscriber">⭐ Subscribers Only</SelectItem>
                          <SelectItem value="paid">💰 Paid Unlock</SelectItem>
                          <SelectItem value="followers">👥 Followers Only</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Price (only if paid) */}
                {isPaid && (
                  <FormField
                    control={form.control}
                    name="priceInCents"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gf-snow">
                          Unlock Price (cents)
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gf-steel" />
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value) || 0)
                              }
                              className="pl-10 bg-gf-ink/50 border-gf-steel/20 text-gf-snow focus:ring-gf-cyber focus:border-gf-cyber"
                              placeholder="100"
                              data-testid="input-price"
                            />
                          </div>
                        </FormControl>
                        <p className="text-xs text-gf-steel">
                          ${((field.value || 0) / 100).toFixed(2)} USD
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Free Preview Toggle */}
                <FormField
                  control={form.control}
                  name="isFreePreview"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border border-gf-steel/20 p-3 bg-gf-ink/30">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm text-gf-snow">
                          Free Preview
                        </FormLabel>
                        <p className="text-xs text-gf-steel">
                          Allow non-subscribers to preview this post
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-gf-cyber"
                          data-testid="switch-free-preview"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Content Rating */}
                <FormField
                  control={form.control}
                  name="contentRating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gf-snow">Content Rating</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-gf-ink/50 border-gf-steel/20 text-gf-snow" data-testid="select-content-rating">
                            <SelectValue placeholder="Select rating" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="safe">Safe</SelectItem>
                          <SelectItem value="suggestive">Suggestive</SelectItem>
                          <SelectItem value="explicit">Explicit (18+)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Media Preview Grid */}
                {mediaFiles.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {mediaFiles.map((media) => (
                      <div
                        key={media.id}
                        className="relative group rounded-lg overflow-hidden bg-gf-ink border border-gf-steel/20"
                      >
                        {media.type === 'image' ? (
                          <img
                            src={media.preview}
                            alt="Preview"
                            className="w-full h-32 object-cover"
                          />
                        ) : (
                          <video
                            src={media.preview}
                            className="w-full h-32 object-cover"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => removeMedia(media.id)}
                          className="absolute top-2 right-2 bg-red-500/90 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                          <p className="text-xs text-white truncate">
                            {media.file.name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Drag and Drop Zone */}
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                    isDragActive
                      ? 'border-gf-cyber bg-gf-cyber/5'
                      : 'border-gf-steel/20 hover:border-gf-cyber/50'
                  }`}
                  data-testid="div-media-dropzone"
                >
                  <input {...getInputProps()} />
                  <ImagePlus className="h-8 w-8 text-gf-steel mx-auto mb-2" />
                  <p className="text-sm text-gf-steel">
                    {isDragActive
                      ? 'Drop files here...'
                      : 'Drag & drop media, or click to browse'}
                  </p>
                  <p className="text-xs text-gf-steel/70 mt-1">
                    Images & videos up to 100MB
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
                      className="text-gf-steel hover:text-gf-cyber hover:bg-gf-cyber/10"
                      data-testid="button-add-image"
                    >
                      <ImagePlus className="h-5 w-5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
                      className="text-gf-steel hover:text-gf-cyber hover:bg-gf-cyber/10"
                      data-testid="button-add-video"
                    >
                      <Video className="h-5 w-5" />
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        form.reset();
                        setIsExpanded(false);
                      }}
                      className="text-gf-steel hover:text-gf-snow"
                      data-testid="button-cancel"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createPostMutation.isPending}
                      className="bg-gradient-to-r from-gf-cyber to-gf-pink hover:opacity-90 text-white"
                      data-testid="button-publish"
                    >
                      {createPostMutation.isPending ? (
                        <>Publishing...</>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Publish
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
