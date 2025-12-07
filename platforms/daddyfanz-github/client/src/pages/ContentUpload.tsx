import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Upload, Image, Video, X, CheckCircle, AlertCircle } from "lucide-react";

interface UploadFormData {
  title: string;
  description: string;
  price: string;
  isPremium: boolean;
  file: File | null;
}

export default function ContentUpload() {
  const [formData, setFormData] = useState<UploadFormData>({
    title: "",
    description: "",
    price: "",
    isPremium: false,
    file: null
  });
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (data: UploadFormData) => {
      if (!data.file) throw new Error("No file selected");
      
      const formDataToSend = new FormData();
      formDataToSend.append("file", data.file);
      formDataToSend.append("title", data.title);
      formDataToSend.append("description", data.description);
      if (data.price) formDataToSend.append("price", data.price);
      formDataToSend.append("isPremium", data.isPremium.toString());

      return new Promise<Response>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        // Track upload progress
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percentComplete);
          }
        });

        // Handle completion
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(new Response(xhr.responseText, {
              status: xhr.status,
              statusText: xhr.statusText,
              headers: new Headers(xhr.getAllResponseHeaders().split('\r\n').reduce((headers: Record<string, string>, line) => {
                const [key, value] = line.split(': ');
                if (key && value) headers[key] = value;
                return headers;
              }, {}))
            }));
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.onabort = () => reject(new Error('Upload aborted'));

        xhr.open('POST', '/api/media');
        xhr.withCredentials = true;
        xhr.send(formDataToSend);
      });
    },
    onMutate: () => {
      setUploadProgress(0);
    },
    onSuccess: async (response) => {
      setUploadProgress(100);
      if (response.ok) {
        toast({
          title: "Upload Successful",
          description: "Your content has been uploaded and is pending moderation."
        });
        queryClient.invalidateQueries({ queryKey: ["/api/media"] });
        setTimeout(() => {
          setLocation("/content-manage");
        }, 1000); // Brief delay to show 100% completion
      } else {
        const error = await response.text();
        throw new Error(error || "Upload failed");
      }
    },
    onError: (error) => {
      setUploadProgress(0);
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFileSelect(file);
    }
  };

  const handleFileSelect = (file: File) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/mov', 'video/avi'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image or video file.",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 500 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "File size must be under 500MB.",
        variant: "destructive"
      });
      return;
    }

    setFormData(prev => ({
      ...prev,
      file,
      title: prev.title || file.name.split('.')[0]
    }));
  };

  const removeFile = () => {
    setFormData(prev => ({ ...prev, file: null }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.file) {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload.",
        variant: "destructive"
      });
      return;
    }

    uploadMutation.mutate(formData);
  };

  const isVideo = formData.file?.type.startsWith('video/');
  const isImage = formData.file?.type.startsWith('image/');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Upload Content</h1>
          <p className="text-slate-300">Share your premium content with subscribers</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* File Upload Area */}
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Upload className="h-5 w-5 text-cyan-400" />
                Upload File
              </CardTitle>
              <CardDescription className="text-slate-400">
                Drag and drop your file here, or click to browse. Max size: 500MB
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!formData.file ? (
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive
                      ? "border-cyan-400 bg-cyan-400/10"
                      : "border-slate-600 hover:border-slate-500"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('file-input')?.click()}
                  data-testid="upload-dropzone"
                >
                  <Upload className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                  <p className="text-lg text-white mb-2">Drop your file here</p>
                  <p className="text-slate-400 mb-4">or click to browse</p>
                  <p className="text-sm text-slate-500">
                    Supports: JPEG, PNG, GIF, WebP, MP4, WebM, MOV, AVI
                  </p>
                  <input
                    id="file-input"
                    type="file"
                    className="hidden"
                    accept="image/*,video/*"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    data-testid="file-input"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-4 p-4 bg-slate-700/50 rounded-lg">
                  {isImage && <Image className="h-8 w-8 text-cyan-400" />}
                  {isVideo && <Video className="h-8 w-8 text-cyan-400" />}
                  <div className="flex-1">
                    <p className="text-white font-medium">{formData.file.name}</p>
                    <p className="text-slate-400 text-sm">
                      {(formData.file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeFile}
                    className="text-slate-400 hover:text-white"
                    data-testid="remove-file"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Content Details */}
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="text-white">Content Details</CardTitle>
              <CardDescription className="text-slate-400">
                Add title, description, and pricing information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-white">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Enter content title..."
                  required
                  data-testid="input-title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-white">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white min-h-[100px]"
                  placeholder="Describe your content..."
                  data-testid="input-description"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-white">Price (Optional)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="0.00"
                    data-testid="input-price"
                  />
                  <p className="text-sm text-slate-400">Leave empty for subscription-only content</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Premium Content</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.isPremium}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPremium: checked }))}
                      data-testid="switch-premium"
                    />
                    <span className="text-slate-300">Premium subscribers only</span>
                  </div>
                  <p className="text-sm text-slate-400">Premium content is only visible to premium subscribers</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upload Progress */}
          {uploadMutation.isPending && (
            <Card className="border-slate-700 bg-slate-800/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">
                        {uploadProgress === 100 ? "Processing..." : "Uploading..."}
                      </span>
                      <span className="text-slate-400 text-sm">{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-sm text-slate-400 mt-2">
                      {uploadProgress < 100 
                        ? "Uploading your content to secure storage..." 
                        : "Upload complete! Starting content moderation..."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/content-manage")}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!formData.file || uploadMutation.isPending}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
              data-testid="button-upload"
            >
              {uploadMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Content
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Upload Guidelines */}
        <Card className="border-slate-700 bg-slate-800/50 mt-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
              Content Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-blue-600 bg-blue-600/10">
              <CheckCircle className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-300">
                All content goes through automated and manual moderation before being published.
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="text-white font-medium">Allowed Content:</h4>
                <ul className="text-slate-400 space-y-1">
                  <li>• Original photos and videos</li>
                  <li>• Age-verified creator content</li>
                  <li>• Properly licensed material</li>
                  <li>• Content following platform guidelines</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-white font-medium">Technical Limits:</h4>
                <ul className="text-slate-400 space-y-1">
                  <li>• Maximum file size: 500MB</li>
                  <li>• Supported formats: JPEG, PNG, GIF, WebP, MP4, WebM, MOV, AVI</li>
                  <li>• Video duration: No limit</li>
                  <li>• Resolution: Up to 4K supported</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}