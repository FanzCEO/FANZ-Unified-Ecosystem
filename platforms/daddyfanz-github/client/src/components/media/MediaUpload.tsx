import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  Image, 
  Video, 
  File, 
  X, 
  DollarSign, 
  Shield,
  AlertTriangle,
  CheckCircle
} from "lucide-react";

interface UploadData {
  title: string;
  description: string;
  price: string;
  isPremium: boolean;
}

export default function MediaUpload() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [uploadData, setUploadData] = useState<UploadData>({
    title: "",
    description: "",
    price: "",
    isPremium: false,
  });
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const createMediaMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/media", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      toast({
        title: "Content Uploaded",
        description: "Your content has been submitted for review.",
      });
      
      // Reset form
      setUploadData({
        title: "",
        description: "",
        price: "",
        isPremium: false,
      });
      setSelectedFiles([]);
      setUploadProgress(0);
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
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
        title: "Upload Failed",
        description: "Failed to upload content. Please try again.",
        variant: "destructive",
      });
    },
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
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter(file => {
      const validTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/webm', 'video/mov', 'video/avi'
      ];
      const maxSize = 500 * 1024 * 1024; // 500MB
      
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: `${file.name} is not a supported file type.`,
          variant: "destructive",
        });
        return false;
      }
      
      if (file.size > maxSize) {
        toast({
          title: "File Too Large",
          description: `${file.name} exceeds the 500MB limit.`,
          variant: "destructive",
        });
        return false;
      }
      
      return true;
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-8 w-8 text-df-cyan" />;
    } else if (file.type.startsWith('video/')) {
      return <Video className="h-8 w-8 text-df-gold" />;
    } else {
      return <File className="h-8 w-8 text-df-steel" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = () => {
    if (!uploadData.title.trim()) {
      toast({
        title: "Title Required",
        description: "Please provide a title for your content.",
        variant: "destructive",
      });
      return;
    }

    if (selectedFiles.length === 0) {
      toast({
        title: "No Files Selected",
        description: "Please select files to upload.",
        variant: "destructive",
      });
      return;
    }

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('file', selectedFiles[0]);
    formData.append('title', uploadData.title);
    formData.append('description', uploadData.description);
    if (uploadData.price) {
      formData.append('price', uploadData.price);
    }
    formData.append('isPremium', uploadData.isPremium.toString());

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    // Upload file with FormData
    createMediaMutation.mutate(formData);
    
    // Complete progress
    setTimeout(() => {
      setUploadProgress(100);
      clearInterval(progressInterval);
    }, 1000);
  };

  const isCreator = user?.role === "creator" || user?.role === "admin";

  if (!isCreator) {
    return (
      <Card className="card-df">
        <CardContent className="pt-6 text-center">
          <Shield className="h-12 w-12 text-df-fog mx-auto mb-4" />
          <h3 className="text-df-snow text-lg font-semibold mb-2">Creator Access Required</h3>
          <p className="text-df-fog">You need to be a creator to upload content.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Upload Area */}
      <Card className="card-df">
        <CardHeader>
          <CardTitle className="text-xl neon-subheading">
            Upload Content
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* File Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-df-cyan bg-df-cyan bg-opacity-10' 
                : 'border-df-steel hover:border-df-cyan hover:bg-df-steel hover:bg-opacity-10'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            data-testid="file-drop-zone"
          >
            <Upload className="h-12 w-12 text-df-fog mx-auto mb-4" />
            <h3 className="text-df-snow text-lg font-semibold mb-2">
              Drop files here or click to browse
            </h3>
            <p className="text-df-fog text-sm mb-4">
              Supports images and videos up to 500MB
            </p>
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              data-testid="file-input"
            />
            <Button 
              asChild 
              className="btn-primary"
              data-testid="button-browse-files"
            >
              <label htmlFor="file-upload" className="cursor-pointer">
                Browse Files
              </label>
            </Button>
            
            <div className="mt-4 text-df-fog text-xs">
              <p>Supported formats: JPEG, PNG, GIF, WebP, MP4, WebM, MOV, AVI</p>
              <p>Maximum file size: 500MB per file</p>
            </div>
          </div>

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div className="mt-6">
              <h4 className="text-df-snow font-semibold mb-3">Selected Files</h4>
              <div className="space-y-2">
                {selectedFiles.map((file, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between bg-df-ink border border-df-steel rounded-md p-3"
                  >
                    <div className="flex items-center space-x-3">
                      {getFileIcon(file)}
                      <div>
                        <p className="text-df-snow font-medium text-sm" data-testid={`file-name-${index}`}>
                          {file.name}
                        </p>
                        <p className="text-df-fog text-xs">
                          {formatFileSize(file.size)} • {file.type}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => removeFile(index)}
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 hover:bg-red-900 hover:bg-opacity-20"
                      data-testid={`button-remove-file-${index}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-df-snow text-sm">Uploading...</span>
                <span className="text-df-cyan text-sm">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content Details */}
      <Card className="card-df">
        <CardHeader>
          <CardTitle className="text-xl neon-subheading">
            Content Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title" className="text-df-fog">Title *</Label>
            <Input
              id="title"
              type="text"
              value={uploadData.title}
              onChange={(e) => setUploadData(prev => ({ ...prev, title: e.target.value }))}
              className="input-df"
              placeholder="Give your content a catchy title"
              required
              data-testid="input-content-title"
            />
          </div>
          
          <div>
            <Label htmlFor="description" className="text-df-fog">Description</Label>
            <Textarea
              id="description"
              rows={4}
              value={uploadData.description}
              onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
              className="input-df resize-none"
              placeholder="Describe your content..."
              data-testid="textarea-content-description"
            />
          </div>

          {/* Premium Content Toggle */}
          <div className="flex items-center justify-between bg-df-ink border border-df-steel rounded-md p-4">
            <div className="flex items-center space-x-3">
              <DollarSign className="h-5 w-5 text-df-gold" />
              <div>
                <Label className="text-df-snow">Premium Content</Label>
                <p className="text-df-fog text-sm">Require payment to view this content</p>
              </div>
            </div>
            <Switch
              checked={uploadData.isPremium}
              onCheckedChange={(checked) => setUploadData(prev => ({ ...prev, isPremium: checked }))}
              data-testid="switch-premium-content"
            />
          </div>

          {/* Price Input */}
          {uploadData.isPremium && (
            <div>
              <Label htmlFor="price" className="text-df-fog">Price ($)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={uploadData.price}
                onChange={(e) => setUploadData(prev => ({ ...prev, price: e.target.value }))}
                className="input-df"
                placeholder="0.00"
                data-testid="input-content-price"
              />
            </div>
          )}

          {/* Compliance Notice */}
          <div className="bg-yellow-900 bg-opacity-20 border border-yellow-600 rounded-md p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <h4 className="text-yellow-200 font-semibold mb-1">Content Guidelines</h4>
                <ul className="text-yellow-100 text-sm space-y-1">
                  <li>• All content must comply with 18 U.S.C. §2257 requirements</li>
                  <li>• Only verified performers (18+) are allowed</li>
                  <li>• Content will be reviewed before publication</li>
                  <li>• Prohibited content will be rejected and may result in account suspension</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={createMediaMutation.isPending || uploadProgress > 0}
            className="w-full btn-primary"
            data-testid="button-submit-upload"
          >
            {createMediaMutation.isPending ? (
              "Processing..."
            ) : uploadProgress > 0 ? (
              "Uploading..."
            ) : (
              "Upload Content"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
