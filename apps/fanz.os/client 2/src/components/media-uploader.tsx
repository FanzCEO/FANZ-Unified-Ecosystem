import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  Video, 
  Image, 
  Music, 
  File,
  X,
  Check,
  AlertCircle,
  Play
} from "lucide-react";

interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "processing" | "completed" | "error";
  error?: string;
  mediaId?: string;
  thumbnailUrl?: string;
}

interface MediaUploaderProps {
  onUploadComplete?: (files: UploadFile[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // in bytes
  acceptedTypes?: string[];
  showPreview?: boolean;
}

const MEDIA_TYPES = {
  'image/*': { icon: Image, label: 'Images' },
  'video/*': { icon: Video, label: 'Videos' },
  'audio/*': { icon: Music, label: 'Audio' },
};

const DEFAULT_ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png', 
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/mov',
  'video/avi',
  'video/webm',
  'audio/mp3',
  'audio/wav',
  'audio/aac',
  'audio/ogg'
];

export default function MediaUploader({
  onUploadComplete,
  maxFiles = 10,
  maxFileSize = 500 * 1024 * 1024, // 500MB default
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  showPreview = true
}: MediaUploaderProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);

  const getMediaType = (file: File): string => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    return 'document';
  };

  const getFileIcon = (file: File) => {
    const type = file.type;
    if (type.startsWith('image/')) return Image;
    if (type.startsWith('video/')) return Video;
    if (type.startsWith('audio/')) return Music;
    return File;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const uploadMutation = useMutation({
    mutationFn: async ({ file, uploadFileId }: { file: File; uploadFileId: string }) => {
      // Get upload URL from backend
      const uploadResponse = await apiRequest("POST", "/api/media/upload-url", {
        fileName: file.name,
        mimeType: file.type,
        mediaType: getMediaType(file),
        size: file.size
      });
      const { uploadUrl, mediaId } = await uploadResponse.json();

      // Update file with media ID
      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFileId ? { ...f, mediaId, status: "uploading" } : f
      ));

      // Upload file directly to object storage
      const uploadResult = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResult.ok) {
        throw new Error('Upload failed');
      }

      // Notify backend that upload is complete
      await apiRequest("POST", "/api/media/upload-complete", {
        mediaId,
        fileName: file.name,
        size: file.size
      });

      return { mediaId, uploadFileId };
    },
    onSuccess: ({ mediaId, uploadFileId }) => {
      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFileId 
          ? { ...f, status: "processing", progress: 100 }
          : f
      ));
      
      // Poll for processing completion
      pollProcessingStatus(mediaId, uploadFileId);
    },
    onError: (error, { uploadFileId }) => {
      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFileId 
          ? { ...f, status: "error", error: error.message }
          : f
      ));
      
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
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const pollProcessingStatus = async (mediaId: string, uploadFileId: string) => {
    const maxAttempts = 30; // 30 attempts with 2 second intervals = 1 minute
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await apiRequest("GET", `/api/media/${mediaId}/status`);
        const { status, thumbnailUrl } = await response.json();

        if (status === "completed") {
          setUploadFiles(prev => prev.map(f => 
            f.id === uploadFileId 
              ? { ...f, status: "completed", thumbnailUrl }
              : f
          ));
          
          // Notify parent component
          const completedFiles = uploadFiles.filter(f => f.status === "completed");
          onUploadComplete?.(completedFiles);
          
        } else if (status === "failed") {
          setUploadFiles(prev => prev.map(f => 
            f.id === uploadFileId 
              ? { ...f, status: "error", error: "Processing failed" }
              : f
          ));
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 2000); // Poll every 2 seconds
        } else {
          // Timeout
          setUploadFiles(prev => prev.map(f => 
            f.id === uploadFileId 
              ? { ...f, status: "error", error: "Processing timeout" }
              : f
          ));
        }
      } catch (error) {
        console.error('Error polling processing status:', error);
      }
    };

    poll();
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles.map(file => ({
      id: crypto.randomUUID(),
      file,
      progress: 0,
      status: "pending"
    }));

    setUploadFiles(prev => [...prev, ...newFiles]);

    // Start uploading each file
    newFiles.forEach(uploadFile => {
      uploadMutation.mutate({ 
        file: uploadFile.file, 
        uploadFileId: uploadFile.id 
      });
    });
  }, [uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles,
    maxSize: maxFileSize,
    accept: acceptedTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    disabled: uploadFiles.length >= maxFiles
  });

  const removeFile = (fileId: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case "completed":
        return <Check className="w-4 h-4 text-green-500" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "processing":
        return <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />;
      default:
        return <Upload className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: UploadFile['status']) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "uploading":
        return "Uploading";
      case "processing":
        return "Processing";
      case "completed":
        return "Ready";
      case "error":
        return "Failed";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
          ${isDragActive 
            ? 'border-primary bg-primary/10' 
            : uploadFiles.length >= maxFiles
            ? 'border-gray-600 bg-gray-800/50 cursor-not-allowed opacity-50'
            : 'border-gray-600 hover:border-primary hover:bg-primary/5'
          }
        `}
      >
        <input {...getInputProps()} />
        
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        
        {isDragActive ? (
          <p className="text-lg text-primary">Drop files here...</p>
        ) : uploadFiles.length >= maxFiles ? (
          <p className="text-gray-400">Maximum files reached ({maxFiles})</p>
        ) : (
          <div>
            <p className="text-lg mb-2 text-white">
              Drag & drop media files here, or click to select
            </p>
            <p className="text-sm text-gray-400 mb-4">
              Max {maxFiles} files, up to {formatFileSize(maxFileSize)} each
            </p>
            
            <div className="flex justify-center space-x-4 text-xs text-gray-500">
              {Object.entries(MEDIA_TYPES).map(([type, { icon: Icon, label }]) => (
                <div key={type} className="flex items-center space-x-1">
                  <Icon className="w-3 h-3" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Upload Progress */}
      {uploadFiles.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg text-white">
              Uploads ({uploadFiles.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {uploadFiles.map((uploadFile) => {
                const FileIcon = getFileIcon(uploadFile.file);
                
                return (
                  <div 
                    key={uploadFile.id}
                    className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg"
                  >
                    {/* File Preview/Icon */}
                    <div className="flex-shrink-0">
                      {showPreview && uploadFile.thumbnailUrl ? (
                        <img 
                          src={uploadFile.thumbnailUrl}
                          alt="Preview"
                          className="w-10 h-10 object-cover rounded"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-600 rounded flex items-center justify-center">
                          <FileIcon className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-white truncate">
                          {uploadFile.file.name}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(uploadFile.id)}
                          className="h-6 w-6 p-0 hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>{formatFileSize(uploadFile.file.size)}</span>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(uploadFile.status)}
                          <Badge 
                            variant="secondary"
                            className={`text-xs ${
                              uploadFile.status === "completed" ? "bg-green-600" :
                              uploadFile.status === "error" ? "bg-red-600" :
                              "bg-gray-600"
                            }`}
                          >
                            {getStatusText(uploadFile.status)}
                          </Badge>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {(uploadFile.status === "uploading" || uploadFile.status === "processing") && (
                        <Progress 
                          value={uploadFile.progress} 
                          className="mt-2 h-1"
                        />
                      )}

                      {/* Error Message */}
                      {uploadFile.status === "error" && uploadFile.error && (
                        <p className="text-xs text-red-400 mt-1">
                          {uploadFile.error}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}