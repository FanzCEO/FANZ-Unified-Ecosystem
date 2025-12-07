import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

interface MobileUploadProps {
  onPageChange: (page: string) => void;
}

export default function MobileUpload({ onPageChange }: MobileUploadProps) {
  const [uploadStep, setUploadStep] = useState<'capture' | 'metadata' | 'compliance' | 'uploading'>('capture');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [hasCostar, setHasCostar] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);

  const handleCameraCapture = () => {
    // Simulate camera capture
    setSelectedMedia('camera_capture.jpg');
    setUploadStep('metadata');
  };

  const handleGallerySelect = () => {
    // Simulate gallery selection
    setSelectedMedia('gallery_photo.jpg');
    setUploadStep('metadata');
  };

  const handleUpload = () => {
    setUploadStep('uploading');
    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(() => {
          onPageChange('dashboard');
        }, 1000);
      }
      setUploadProgress(progress);
    }, 300);
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => onPageChange('dashboard')}>
          ← Back
        </Button>
        <h1 className="text-lg font-semibold">Upload Content</h1>
        <div className="w-16" /> {/* Spacer */}
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center space-x-2 mb-6">
        {['📷', '📝', '🛡️', '📤'].map((icon, index) => (
          <div key={index} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
              index <= ['capture', 'metadata', 'compliance', 'uploading'].indexOf(uploadStep) 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground'
            }`}>
              {icon}
            </div>
            {index < 3 && <div className="w-4 h-0.5 bg-muted mx-1" />}
          </div>
        ))}
      </div>

      {/* Capture Media */}
      {uploadStep === 'capture' && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6 text-center space-y-4">
              <div className="text-4xl">📷</div>
              <h3 className="text-lg font-semibold">Capture or Select Media</h3>
              <p className="text-sm text-muted-foreground">
                Take a photo/video or select from your gallery
              </p>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Button 
              onClick={handleCameraCapture}
              className="w-full h-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">📸</span>
                <div className="text-left">
                  <div className="font-semibold">Take Photo/Video</div>
                  <div className="text-xs opacity-90">Use device camera</div>
                </div>
              </div>
            </Button>

            <Button 
              onClick={handleGallerySelect}
              variant="outline"
              className="w-full h-16"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🖼️</span>
                <div className="text-left">
                  <div className="font-semibold">Choose from Gallery</div>
                  <div className="text-xs text-muted-foreground">Select existing media</div>
                </div>
              </div>
            </Button>

            <Button 
              variant="outline"
              className="w-full h-16"
              onClick={() => {
                setSelectedMedia('cloud_sync.mp4');
                setUploadStep('metadata');
              }}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">☁️</span>
                <div className="text-left">
                  <div className="font-semibold">Cloud Sync</div>
                  <div className="text-xs text-muted-foreground">Auto-sync from cloud storage</div>
                </div>
              </div>
            </Button>
          </div>

          <Alert>
            <AlertDescription className="text-xs">
              Content will be uploaded directly to your connected FANZ platform accounts.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Metadata */}
      {uploadStep === 'metadata' && (
        <div className="space-y-4">
          {selectedMedia && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white text-xl">
                    📷
                  </div>
                  <div>
                    <p className="font-medium">{selectedMedia}</p>
                    <p className="text-xs text-muted-foreground">Ready to upload</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            <div>
              <Label htmlFor="title" className="text-sm font-medium">Title</Label>
              <Input 
                id="title"
                placeholder="Add a catchy title..."
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="caption" className="text-sm font-medium">Caption</Label>
              <Textarea 
                id="caption"
                placeholder="Write your caption... #hashtags"
                rows={3}
                className="mt-1"
              />
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-muted-foreground">0/280 characters</span>
                <Button variant="ghost" size="sm" className="text-xs">
                  🤖 AI Suggest
                </Button>
              </div>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setUploadStep('capture')}>
              Back
            </Button>
            <Button className="flex-1" onClick={() => setUploadStep('compliance')}>
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* Compliance */}
      {uploadStep === 'compliance' && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center space-x-2">
                <span>🛡️</span>
                <span>Content Compliance</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Co-star in content?</p>
                  <p className="text-xs text-muted-foreground">Required for compliance</p>
                </div>
                <Switch checked={hasCostar} onCheckedChange={setHasCostar} />
              </div>

              {hasCostar && (
                <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                  <Input placeholder="Co-star name" />
                  <Input placeholder="Email or @username" />
                  <Alert>
                    <AlertDescription className="text-xs">
                      Verification link will be sent automatically for compliance.
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Platform Distribution</h4>
                <div className="space-y-2">
                  {['BoyFanz', 'GirlFanz', 'PupFanz'].map((platform) => (
                    <div key={platform} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">{platform}</span>
                      <Switch defaultChecked />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setUploadStep('metadata')}>
              Back
            </Button>
            <Button className="flex-1" onClick={handleUpload}>
              Upload Now
            </Button>
          </div>
        </div>
      )}

      {/* Uploading */}
      {uploadStep === 'uploading' && (
        <div className="space-y-6 text-center">
          <div className="space-y-4">
            <div className="text-6xl animate-pulse">📤</div>
            <div>
              <h3 className="text-lg font-semibold">Uploading to FANZ</h3>
              <p className="text-sm text-muted-foreground">
                Processing and distributing to your platforms...
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Upload Progress</span>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
            <Progress value={uploadProgress} className="h-3" />
          </div>

          <div className="space-y-3 text-left">
            <div className="flex items-center space-x-2 text-sm">
              <span className={uploadProgress > 25 ? '✅' : '⏳'}>
                {uploadProgress > 25 ? '✅' : '⏳'}
              </span>
              <span>Uploading to cloud storage</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <span className={uploadProgress > 50 ? '✅' : '⏳'}>
                {uploadProgress > 50 ? '✅' : '⏳'}
              </span>
              <span>AI content analysis</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <span className={uploadProgress > 75 ? '✅' : '⏳'}>
                {uploadProgress > 75 ? '✅' : '⏳'}
              </span>
              <span>Compliance verification</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <span className={uploadProgress > 90 ? '✅' : '⏳'}>
                {uploadProgress > 90 ? '✅' : '⏳'}
              </span>
              <span>Publishing to platforms</span>
            </div>
          </div>

          {uploadProgress >= 100 && (
            <Alert>
              <AlertDescription className="text-center">
                🎉 Upload successful! Content is now live on your FANZ platforms.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}