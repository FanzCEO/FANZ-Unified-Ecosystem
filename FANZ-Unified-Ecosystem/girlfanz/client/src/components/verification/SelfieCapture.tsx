import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, ChevronLeft, CheckCircle, AlertCircle, RefreshCw, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SelfieCaptureProps {
  onCapture: (selfieImage: string) => void;
  onBack?: () => void;
}

export default function SelfieCapture({ onCapture, onBack }: SelfieCaptureProps) {
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [captureCountdown, setCaptureCountdown] = useState<number | null>(null);
  const [livenessCheck, setLivenessCheck] = useState<'idle' | 'checking' | 'passed' | 'failed'>('idle');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const faceDetectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setIsCameraActive(true);
        startFaceDetection();
      }
    } catch (error) {
      console.error('Camera access error:', error);
      toast({
        title: 'Camera Error',
        description: 'Unable to access camera. Please check permissions.',
        variant: 'destructive'
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCameraActive(false);
    }
    if (faceDetectionIntervalRef.current) {
      clearInterval(faceDetectionIntervalRef.current);
      faceDetectionIntervalRef.current = null;
    }
  };

  const startFaceDetection = () => {
    // Simulate face detection (in production, use face-api.js or similar)
    let detectionCount = 0;
    faceDetectionIntervalRef.current = setInterval(() => {
      detectionCount++;
      // Simulate face detection after 1-2 seconds
      if (detectionCount > 5) {
        setFaceDetected(true);
      }
    }, 300);
  };

  const performLivenessCheck = async () => {
    setLivenessCheck('checking');
    
    // Simulate liveness detection
    // In production, this would involve multiple captures and AI analysis
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // For demo, always pass liveness check
    setLivenessCheck('passed');
    return true;
  };

  const capturePhoto = async () => {
    if (!faceDetected) {
      toast({
        title: 'No face detected',
        description: 'Please position your face within the frame',
        variant: 'destructive'
      });
      return;
    }

    // Start countdown
    for (let i = 3; i > 0; i--) {
      setCaptureCountdown(i);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    setCaptureCountdown(null);

    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        setSelfieImage(imageData);
        
        // Perform liveness check
        const livenessResult = await performLivenessCheck();
        
        if (livenessResult) {
          stopCamera();
        } else {
          setSelfieImage(null);
          toast({
            title: 'Liveness check failed',
            description: 'Please try again and follow the instructions',
            variant: 'destructive'
          });
        }
      }
    }
  };

  const handleRetake = () => {
    setSelfieImage(null);
    setLivenessCheck('idle');
    setFaceDetected(false);
    startCamera();
  };

  const handleSubmit = () => {
    if (!selfieImage || livenessCheck !== 'passed') {
      toast({
        title: 'Invalid selfie',
        description: 'Please capture a valid selfie with liveness verification',
        variant: 'destructive'
      });
      return;
    }
    
    onCapture(selfieImage);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Take a Selfie</h3>
        <p className="text-sm text-muted-foreground">
          We'll match your face with your ID photo to verify your identity
        </p>
      </div>

      <Alert>
        <User className="h-4 w-4" />
        <AlertDescription>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Remove glasses, hats, or face coverings</li>
            <li>Ensure your face is well-lit and clearly visible</li>
            <li>Look directly at the camera</li>
            <li>Keep a neutral expression</li>
          </ul>
        </AlertDescription>
      </Alert>

      {!selfieImage ? (
        <div className="space-y-4">
          <Card className="overflow-hidden relative">
            <CardContent className="p-0">
              {isCameraActive ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full transform scale-x-[-1]"
                    data-testid="video-selfie-camera"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  
                  {/* Face detection overlay */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="h-full w-full flex items-center justify-center">
                      <div className={`w-48 h-64 border-4 rounded-full ${
                        faceDetected ? 'border-green-500' : 'border-white/50'
                      } transition-colors`} />
                    </div>
                  </div>
                  
                  {/* Status indicators */}
                  <div className="absolute top-4 left-4 right-4 flex justify-between">
                    <div className={`px-3 py-1 rounded text-sm font-medium ${
                      faceDetected ? 'bg-green-500/90 text-white' : 'bg-black/50 text-white'
                    }`}>
                      {faceDetected ? 'Face detected' : 'Position your face'}
                    </div>
                    {captureCountdown && (
                      <div className="bg-primary/90 text-primary-foreground px-3 py-1 rounded text-lg font-bold">
                        {captureCountdown}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="h-96 flex items-center justify-center bg-muted">
                  <Button onClick={startCamera} size="lg" data-testid="button-start-selfie-camera">
                    <Camera className="h-5 w-5 mr-2" />
                    Open Camera
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {isCameraActive && (
            <Button 
              onClick={capturePhoto}
              disabled={!faceDetected || captureCountdown !== null}
              className="w-full"
              size="lg"
              data-testid="button-capture-selfie"
            >
              {captureCountdown ? `Capturing in ${captureCountdown}...` : 'Capture Selfie'}
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                <img 
                  src={selfieImage} 
                  alt="Your selfie" 
                  className="w-full rounded transform scale-x-[-1]"
                  data-testid="image-selfie-preview"
                />
                
                {/* Liveness check status */}
                <div className={`flex items-center justify-center gap-2 p-3 rounded ${
                  livenessCheck === 'checking' ? 'bg-yellow-50 text-yellow-800' :
                  livenessCheck === 'passed' ? 'bg-green-50 text-green-800' :
                  livenessCheck === 'failed' ? 'bg-red-50 text-red-800' :
                  'bg-muted'
                }`}>
                  {livenessCheck === 'checking' && (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span className="text-sm font-medium">Performing liveness check...</span>
                    </>
                  )}
                  {livenessCheck === 'passed' && (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Liveness verified</span>
                    </>
                  )}
                  {livenessCheck === 'failed' && (
                    <>
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Liveness check failed</span>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            variant="outline"
            onClick={handleRetake}
            className="w-full"
            data-testid="button-retake-selfie"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retake Selfie
          </Button>
        </div>
      )}

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
          disabled={!selfieImage || livenessCheck !== 'passed'}
          className="flex-1"
          data-testid="button-verify"
        >
          Verify Identity
        </Button>
      </div>
    </div>
  );
}