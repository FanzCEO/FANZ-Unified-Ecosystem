import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  Video, 
  Sparkles, 
  Hash, 
  Calendar, 
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw
} from "lucide-react";

const uploadSchema = z.object({
  title: z.string().max(150, "Title must be 150 characters or less"),
  description: z.string().max(500, "Description must be 500 characters or less"),
  hashtags: z.string().optional(),
  isPublic: z.boolean().default(true),
  allowComments: z.boolean().default(true),
  allowDuets: z.boolean().default(true),
  allowRemix: z.boolean().default(true),
  scheduleAt: z.string().optional()
});

type UploadFormData = z.infer<typeof uploadSchema>;

interface ShortVideoUploadProps {
  onUploadComplete?: (videoId: string) => void;
  onCancel?: () => void;
  className?: string;
}

export default function ShortVideoUpload({
  onUploadComplete,
  onCancel,
  className = ""
}: ShortVideoUploadProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [videoPreviewPlaying, setVideoPreviewPlaying] = useState(false);
  const [videoMuted, setVideoMuted] = useState(true);
  const [videoMetadata, setVideoMetadata] = useState<{
    duration: number;
    width: number;
    height: number;
    size: number;
  } | null>(null);

  const form = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      title: "",
      description: "",
      hashtags: "",
      isPublic: true,
      allowComments: true,
      allowDuets: true,
      allowRemix: true,
      scheduleAt: ""
    }
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (data: UploadFormData & { file: File }) => {
      const formData = new FormData();
      formData.append('video', data.file);
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('hashtags', data.hashtags || '');
      formData.append('isPublic', data.isPublic.toString());
      formData.append('allowComments', data.allowComments.toString());
      formData.append('allowDuets', data.allowDuets.toString());
      formData.append('allowRemix', data.allowRemix.toString());
      
      if (data.scheduleAt) {
        formData.append('scheduleAt', data.scheduleAt);
      }

      const response = await fetch('/api/short-videos/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      return response.json();
    },
    onSuccess: (result) => {
      toast({
        title: "Upload Successful! 🎉",
        description: "Your video is being processed and will be live soon.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/short-videos/feed'] });
      onUploadComplete?.(result.videoId);
      
      // Reset form
      setSelectedFile(null);
      setPreviewUrl("");
      setVideoMetadata(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload video",
        variant: "destructive"
      });
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select a video file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Video must be less than 100MB",
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Get video metadata
    const video = document.createElement('video');
    video.onloadedmetadata = () => {
      // Validate duration (max 60 seconds for short videos)
      if (video.duration > 60) {
        toast({
          title: "Video Too Long",
          description: "Short videos must be 60 seconds or less",
          variant: "destructive"
        });
        setSelectedFile(null);
        setPreviewUrl("");
        URL.revokeObjectURL(url);
        return;
      }

      setVideoMetadata({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        size: file.size
      });

      // Auto-generate title from filename if empty
      if (!form.getValues('title')) {
        const nameWithoutExt = file.name.split('.').slice(0, -1).join('.');
        form.setValue('title', nameWithoutExt);
      }
    };
    video.src = url;
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      // Simulate file input change
      const fakeEvent = {
        target: { files: [file] }
      } as React.ChangeEvent<HTMLInputElement>;
      handleFileSelect(fakeEvent);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const removeFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl("");
    setVideoMetadata(null);
  };

  const toggleVideoPreview = () => {
    if (videoRef.current) {
      if (videoPreviewPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setVideoPreviewPlaying(!videoPreviewPlaying);
    }
  };

  const toggleVideoMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoMuted;
      setVideoMuted(!videoMuted);
    }
  };

  const parseHashtags = (hashtagString: string): string[] => {
    return hashtagString
      .split(/[\s,]+/)
      .map(tag => tag.replace(/^#/, '').trim())
      .filter(tag => tag.length > 0);
  };

  const onSubmit = (data: UploadFormData) => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a video file to upload",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    uploadMutation.mutate({ ...data, file: selectedFile });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!user || user.role !== 'creator') {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardContent className="p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">Creator Access Required</h2>
          <p className="text-muted-foreground">
            Only creators can upload videos. Please upgrade your account to creator status.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`max-w-4xl mx-auto p-6 ${className}`} data-testid="video-upload-form">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Video className="text-primary" />
            <span>Upload Short Video</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload Area */}
          {!selectedFile ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-all"
              data-testid="file-upload-area"
            >
              <Upload size={48} className="mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Upload your video</h3>
              <p className="text-muted-foreground mb-4">
                Drag and drop a video file or click to browse
              </p>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Maximum duration: 60 seconds</p>
                <p>• Maximum size: 100MB</p>
                <p>• Supported formats: MP4, MOV, AVI</p>
                <p>• Recommended: 9:16 aspect ratio (vertical)</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
                data-testid="file-input"
              />
            </div>
          ) : (
            /* Video Preview */
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden aspect-[9/16] max-w-sm mx-auto">
                <video
                  ref={videoRef}
                  src={previewUrl}
                  className="w-full h-full object-cover"
                  muted={videoMuted}
                  loop
                  data-testid="video-preview"
                />
                
                {/* Video Controls */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={toggleVideoPreview}
                    className="text-white bg-black/50 hover:bg-black/70 rounded-full"
                    data-testid="preview-play-button"
                  >
                    {videoPreviewPlaying ? <Pause size={32} /> : <Play size={32} />}
                  </Button>
                </div>

                <div className="absolute bottom-4 right-4 flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleVideoMute}
                    className="text-white bg-black/50 hover:bg-black/70 rounded-full"
                    data-testid="preview-mute-button"
                  >
                    {videoMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={removeFile}
                    className="text-white bg-black/50 hover:bg-black/70 rounded-full"
                    data-testid="remove-file-button"
                  >
                    <X size={20} />
                  </Button>
                </div>
              </div>

              {/* Video Metadata */}
              {videoMetadata && (
                <div className="flex flex-wrap gap-2 justify-center">
                  <Badge variant="outline" data-testid="video-duration">
                    {formatDuration(videoMetadata.duration)}
                  </Badge>
                  <Badge variant="outline" data-testid="video-resolution">
                    {videoMetadata.width}×{videoMetadata.height}
                  </Badge>
                  <Badge variant="outline" data-testid="video-size">
                    {formatFileSize(videoMetadata.size)}
                  </Badge>
                  <Badge 
                    variant={videoMetadata.height > videoMetadata.width ? "default" : "secondary"}
                    data-testid="video-orientation"
                  >
                    {videoMetadata.height > videoMetadata.width ? "Vertical ✓" : "Horizontal"}
                  </Badge>
                </div>
              )}
            </div>
          )}

          {/* Upload Form */}
          {selectedFile && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Title */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Give your video a catchy title..."
                          {...field}
                          data-testid="video-title-input"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe your video and add hashtags..."
                          className="min-h-20"
                          {...field}
                          data-testid="video-description-input"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Hashtags */}
                <FormField
                  control={form.control}
                  name="hashtags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-2">
                        <Hash size={16} />
                        <span>Hashtags</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="#viral #fyp #creator"
                          {...field}
                          data-testid="video-hashtags-input"
                        />
                      </FormControl>
                      <div className="text-sm text-muted-foreground">
                        Separate hashtags with spaces or commas. Max 10 hashtags.
                      </div>
                      {field.value && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {parseHashtags(field.value).slice(0, 10).map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Settings */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="isPublic"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <FormLabel>Public Video</FormLabel>
                        <FormControl>
                          <Switch 
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="public-switch"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="allowComments"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <FormLabel>Allow Comments</FormLabel>
                        <FormControl>
                          <Switch 
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="comments-switch"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="allowDuets"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <FormLabel>Allow Duets</FormLabel>
                        <FormControl>
                          <Switch 
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="duets-switch"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="allowRemix"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <FormLabel>Allow Remix</FormLabel>
                        <FormControl>
                          <Switch 
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="remix-switch"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Schedule Publishing */}
                <FormField
                  control={form.control}
                  name="scheduleAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-2">
                        <Calendar size={16} />
                        <span>Schedule (Optional)</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="datetime-local"
                          {...field}
                          data-testid="schedule-input"
                        />
                      </FormControl>
                      <div className="text-sm text-muted-foreground">
                        Leave empty to publish immediately
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Upload Progress */}
                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} data-testid="upload-progress" />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel || (() => removeFile())}
                    disabled={isUploading}
                    data-testid="cancel-button"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isUploading || uploadMutation.isPending}
                    className="min-w-24"
                    data-testid="upload-button"
                  >
                    {isUploading ? (
                      <>
                        <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Publish
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}