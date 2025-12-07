import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, Upload, FileText, ChevronLeft, ChevronRight, RotateCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface IDUploadProps {
  onUpload: (data: {
    type: string;
    frontImage: string;
    backImage?: string;
  }) => void;
  onBack?: () => void;
}

export default function IDUpload({ onUpload, onBack }: IDUploadProps) {
  const [documentType, setDocumentType] = useState<string>('drivers_license');
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [captureMode, setCaptureMode] = useState<'camera' | 'upload'>('camera');
  const [currentSide, setCurrentSide] = useState<'front' | 'back'>('front');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const { toast } = useToast();

  const requiresBackImage = documentType === 'drivers_license' || documentType === 'id_card';

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setIsCameraActive(true);
      }
    } catch (error) {
      console.error('Camera access error:', error);
      toast({
        title: 'Camera Error',
        description: 'Unable to access camera. Please check permissions.',
        variant: 'destructive'
      });
      setCaptureMode('upload');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        
        if (currentSide === 'front') {
          setFrontImage(imageData);
          if (requiresBackImage) {
            setCurrentSide('back');
          } else {
            stopCamera();
          }
        } else {
          setBackImage(imageData);
          stopCamera();
        }
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please upload an image smaller than 10MB',
          variant: 'destructive'
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        if (currentSide === 'front') {
          setFrontImage(imageData);
          if (requiresBackImage) {
            setCurrentSide('back');
            // Reset file input for next upload
            if (fileInputRef.current) fileInputRef.current.value = '';
          }
        } else {
          setBackImage(imageData);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRetake = (side: 'front' | 'back') => {
    if (side === 'front') {
      setFrontImage(null);
      setBackImage(null);
      setCurrentSide('front');
    } else {
      setBackImage(null);
      setCurrentSide('back');
    }
    
    if (captureMode === 'camera' && !isCameraActive) {
      startCamera();
    }
  };

  const handleSubmit = () => {
    if (!frontImage) {
      toast({
        title: 'Missing Document',
        description: 'Please capture or upload the front of your ID',
        variant: 'destructive'
      });
      return;
    }

    if (requiresBackImage && !backImage) {
      toast({
        title: 'Missing Document',
        description: 'Please capture or upload the back of your ID',
        variant: 'destructive'
      });
      return;
    }

    onUpload({
      type: documentType,
      frontImage,
      backImage: requiresBackImage ? backImage : undefined
    });
  };

  const canSubmit = frontImage && (!requiresBackImage || backImage);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Document Type</label>
          <Select value={documentType} onValueChange={setDocumentType}>
            <SelectTrigger data-testid="select-document-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="drivers_license">Driver's License</SelectItem>
              <SelectItem value="passport">Passport</SelectItem>
              <SelectItem value="id_card">National ID Card</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>
            {documentType === 'passport' 
              ? 'Please capture the photo page of your passport'
              : `Please capture both front and back of your ${documentType.replace('_', ' ')}`
            }
          </AlertDescription>
        </Alert>

        {/* Capture mode selection */}
        <div className="flex gap-2">
          <Button
            variant={captureMode === 'camera' ? 'default' : 'outline'}
            onClick={() => setCaptureMode('camera')}
            className="flex-1"
            data-testid="button-camera-mode"
          >
            <Camera className="h-4 w-4 mr-2" />
            Use Camera
          </Button>
          <Button
            variant={captureMode === 'upload' ? 'default' : 'outline'}
            onClick={() => setCaptureMode('upload')}
            className="flex-1"
            data-testid="button-upload-mode"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload File
          </Button>
        </div>

        {/* Camera/Upload Area */}
        {captureMode === 'camera' ? (
          <div className="space-y-4">
            {!frontImage || (requiresBackImage && currentSide === 'back' && !backImage) ? (
              <>
                <Card className="overflow-hidden">
                  <CardContent className="p-0 relative">
                    {isCameraActive ? (
                      <>
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full"
                          data-testid="video-camera"
                        />
                        <canvas ref={canvasRef} className="hidden" />
                        <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded">
                          Capturing {currentSide === 'front' ? 'Front' : 'Back'}
                        </div>
                      </>
                    ) : (
                      <div className="h-64 flex items-center justify-center bg-muted">
                        <Button onClick={startCamera} data-testid="button-start-camera">
                          <Camera className="h-4 w-4 mr-2" />
                          Start Camera
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
                {isCameraActive && (
                  <Button 
                    onClick={capturePhoto}
                    className="w-full"
                    size="lg"
                    data-testid="button-capture-photo"
                  >
                    Capture {currentSide === 'front' ? 'Front' : 'Back'} of ID
                  </Button>
                )}
              </>
            ) : null}
          </div>
        ) : (
          <div className="space-y-4">
            {(!frontImage || (requiresBackImage && currentSide === 'back' && !backImage)) && (
              <Card>
                <CardContent className="py-8">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    data-testid="input-file-upload"
                  />
                  <Button
                    variant="outline"
                    className="w-full h-32 border-dashed"
                    onClick={() => fileInputRef.current?.click()}
                    data-testid="button-select-file"
                  >
                    <div className="text-center">
                      <Upload className="h-8 w-8 mx-auto mb-2" />
                      <div>Click to upload {currentSide} of ID</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        JPG, PNG up to 10MB
                      </div>
                    </div>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Preview Images */}
        {(frontImage || backImage) && (
          <div className="space-y-4">
            {frontImage && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Front of ID</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRetake('front')}
                      data-testid="button-retake-front"
                    >
                      <RotateCw className="h-4 w-4 mr-1" />
                      Retake
                    </Button>
                  </div>
                  <img 
                    src={frontImage} 
                    alt="Front of ID" 
                    className="w-full rounded"
                    data-testid="image-front-preview"
                  />
                </CardContent>
              </Card>
            )}
            
            {backImage && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Back of ID</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRetake('back')}
                      data-testid="button-retake-back"
                    >
                      <RotateCw className="h-4 w-4 mr-1" />
                      Retake
                    </Button>
                  </div>
                  <img 
                    src={backImage} 
                    alt="Back of ID" 
                    className="w-full rounded"
                    data-testid="image-back-preview"
                  />
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        {onBack && (
          <Button 
            variant="outline" 
            onClick={() => {
              stopCamera();
              onBack();
            }}
            data-testid="button-back"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        )}
        <Button 
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="flex-1"
          data-testid="button-continue"
        >
          Continue to Selfie
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}