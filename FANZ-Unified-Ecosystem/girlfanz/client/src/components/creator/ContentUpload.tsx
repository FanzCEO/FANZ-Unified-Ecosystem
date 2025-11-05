import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Upload, File, Film, Image, X, 
  CheckCircle, AlertCircle, Loader2 
} from 'lucide-react';

type ContentUploadProps = {
  onUpload: (session: any) => void;
};

export default function ContentUpload({ onUpload }: ContentUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      'video/*': ['.mp4', '.mov', '.avi', '.wmv', '.webm'],
    },
    maxSize: 500 * 1024 * 1024, // 500MB
    multiple: false,
  });

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-8 w-8" />;
    } else if (file.type.startsWith('video/')) {
      return <Film className="h-8 w-8" />;
    }
    return <File className="h-8 w-8" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast({
        title: 'No file selected',
        description: 'Please select a file to upload.',
        variant: 'destructive',
      });
      return;
    }

    const file = files[0];
    setUploading(true);
    setUploadProgress(0);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 200);

        try {
          const response = await apiRequest('/api/creator/content/upload', {
            method: 'POST',
            body: {
              title: title || `Upload ${new Date().toLocaleString()}`,
              description,
              type: file.type.startsWith('video/') ? 'video' : 'photo',
              file: {
                data: base64.split(',')[1], // Remove data:type/ext;base64, prefix
                name: file.name,
                type: file.type,
              },
            },
          });

          clearInterval(progressInterval);
          setUploadProgress(100);
          
          onUpload(response);
          
          // Reset form
          setFiles([]);
          setTitle('');
          setDescription('');
          setUploadProgress(0);
          
          toast({
            title: 'Upload successful!',
            description: 'Your content is being processed by AI.',
          });
        } catch (error) {
          clearInterval(progressInterval);
          console.error('Upload failed:', error);
          toast({
            title: 'Upload failed',
            description: 'Please try again with a smaller file.',
            variant: 'destructive',
          });
        }
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6 space-y-4">
        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'}
            ${files.length > 0 ? 'bg-gray-50' : ''}
          `}
          data-testid="dropzone-area"
        >
          <input {...getInputProps()} />
          
          {files.length === 0 ? (
            <>
              <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              {isDragActive ? (
                <p className="text-lg font-medium">Drop the file here...</p>
              ) : (
                <>
                  <p className="text-lg font-medium mb-2">
                    Drag & drop your content here
                  </p>
                  <p className="text-sm text-muted-foreground">
                    or click to browse files
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Supports: Images (JPEG, PNG, GIF) and Videos (MP4, MOV) up to 500MB
                  </p>
                </>
              )}
            </>
          ) : (
            <div className="space-y-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border"
                  data-testid={`file-item-${index}`}
                >
                  <div className="flex items-center gap-3">
                    {getFileIcon(file)}
                    <div className="text-left">
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    data-testid={`button-remove-file-${index}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Content Details */}
        {files.length > 0 && (
          <>
            <div className="space-y-2">
              <Label htmlFor="title">Title (optional)</Label>
              <Input
                id="title"
                placeholder="Give your content a title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={uploading}
                data-testid="input-title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Add a description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={uploading}
                rows={3}
                data-testid="textarea-description"
              />
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} data-testid="progress-upload" />
              </div>
            )}

            {/* Upload Button */}
            <Button
              onClick={handleUpload}
              disabled={uploading || files.length === 0}
              className="w-full"
              size="lg"
              data-testid="button-upload"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Content
                </>
              )}
            </Button>
          </>
        )}

        {/* AI Processing Notice */}
        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
          <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-900">AI Processing Included</p>
            <p className="text-blue-700">
              Your content will be automatically edited, optimized for multiple platforms, 
              and prepared for distribution.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}