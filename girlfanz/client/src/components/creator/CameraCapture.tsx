import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Camera, Video, Circle, Square, Download,
  Zap, Sun, Palette, RotateCw, X
} from 'lucide-react';

type CameraCaptureProps = {
  onCapture: (session: any) => void;
};

export default function CameraCapture({ onCapture }: CameraCaptureProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [mediaType, setMediaType] = useState<'photo' | 'video'>('photo');
  const [filter, setFilter] = useState('none');
  const [brightness, setBrightness] = useState([100]);
  const [contrast, setContrast] = useState([100]);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const { toast } = useToast();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const filters = [
    { value: 'none', label: 'None' },
    { value: 'grayscale', label: 'Black & White' },
    { value: 'sepia', label: 'Vintage' },
    { value: 'saturate', label: 'Vibrant' },
    { value: 'hue-rotate', label: 'Psychedelic' },
    { value: 'invert', label: 'Invert' },
  ];

  const getFilterStyle = () => {
    let filterString = '';
    if (filter !== 'none') {
      switch (filter) {
        case 'grayscale':
          filterString += 'grayscale(100%) ';
          break;
        case 'sepia':
          filterString += 'sepia(100%) ';
          break;
        case 'saturate':
          filterString += 'saturate(200%) ';
          break;
        case 'hue-rotate':
          filterString += 'hue-rotate(90deg) ';
          break;
        case 'invert':
          filterString += 'invert(100%) ';
          break;
      }
    }
    filterString += `brightness(${brightness[0]}%) contrast(${contrast[0]}%)`;
    return filterString;
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: 'user'
        }, 
        audio: mediaType === 'video' 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      
      setShowCamera(true);
    } catch (error) {
      console.error('Failed to access camera:', error);
      toast({
        title: 'Camera access denied',
        description: 'Please allow camera access in your browser settings.',
        variant: 'destructive',
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
    setIsRecording(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.filter = getFilterStyle();
    ctx.drawImage(video, 0, 0);
    
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      
      const formData = new FormData();
      formData.append('file', blob, 'capture.jpg');
      formData.append('title', `Photo capture ${new Date().toLocaleString()}`);
      formData.append('type', 'photo');
      
      try {
        const response = await apiRequest('/api/creator/content/capture', {
          method: 'POST',
          body: {
            videoData: await blobToBase64(blob),
            options: {
              filter,
              brightness: brightness[0],
              contrast: contrast[0],
            }
          },
        });
        
        onCapture(response);
        stopCamera();
        
        toast({
          title: 'Photo captured!',
          description: 'Your photo has been uploaded for processing.',
        });
      } catch (error) {
        console.error('Failed to upload photo:', error);
        toast({
          title: 'Upload failed',
          description: 'Please try again.',
          variant: 'destructive',
        });
      }
    }, 'image/jpeg');
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    
    const options = { mimeType: 'video/webm;codecs=vp8' };
    mediaRecorderRef.current = new MediaRecorder(streamRef.current, options);
    
    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        setRecordedChunks(prev => [...prev, event.data]);
      }
    };
    
    mediaRecorderRef.current.onstop = async () => {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      
      try {
        const response = await apiRequest('/api/creator/content/capture', {
          method: 'POST',
          body: {
            videoData: await blobToBase64(blob),
            options: {
              filter,
              brightness: brightness[0],
              contrast: contrast[0],
            }
          },
        });
        
        onCapture(response);
        setRecordedChunks([]);
        stopCamera();
        
        toast({
          title: 'Video captured!',
          description: 'Your video has been uploaded for AI processing.',
        });
      } catch (error) {
        console.error('Failed to upload video:', error);
        toast({
          title: 'Upload failed',
          description: 'Please try again.',
          variant: 'destructive',
        });
      }
    };
    
    mediaRecorderRef.current.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const switchCamera = async () => {
    stopCamera();
    // In a real implementation, you'd toggle between front/back camera
    await startCamera();
  };

  if (!showCamera) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button
            variant={mediaType === 'photo' ? 'default' : 'outline'}
            onClick={() => setMediaType('photo')}
            data-testid="button-photo-mode"
          >
            <Camera className="h-4 w-4 mr-2" />
            Photo
          </Button>
          <Button
            variant={mediaType === 'video' ? 'default' : 'outline'}
            onClick={() => setMediaType('video')}
            data-testid="button-video-mode"
          >
            <Video className="h-4 w-4 mr-2" />
            Video
          </Button>
        </div>
        <Button 
          onClick={startCamera} 
          className="w-full"
          data-testid="button-open-camera"
        >
          <Camera className="h-4 w-4 mr-2" />
          Open Camera
        </Button>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-4 space-y-4">
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ filter: getFilterStyle() }}
            data-testid="video-preview"
          />
          <canvas ref={canvasRef} className="hidden" />
          
          {isRecording && (
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full">
              <Circle className="h-3 w-3 animate-pulse fill-current" />
              <span className="text-sm font-medium">Recording</span>
            </div>
          )}
          
          <div className="absolute top-4 right-4 flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={switchCamera}
              data-testid="button-switch-camera"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={stopCamera}
              data-testid="button-close-camera"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Camera Controls */}
        <div className="space-y-4">
          {/* Filters */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Filter</label>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger data-testid="select-filter">
                <SelectValue placeholder="Choose a filter" />
              </SelectTrigger>
              <SelectContent>
                {filters.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Brightness */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4" />
              <label className="text-sm font-medium">Brightness: {brightness[0]}%</label>
            </div>
            <Slider
              value={brightness}
              onValueChange={setBrightness}
              min={0}
              max={200}
              step={10}
              data-testid="slider-brightness"
            />
          </div>

          {/* Contrast */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <label className="text-sm font-medium">Contrast: {contrast[0]}%</label>
            </div>
            <Slider
              value={contrast}
              onValueChange={setContrast}
              min={0}
              max={200}
              step={10}
              data-testid="slider-contrast"
            />
          </div>

          {/* Capture Button */}
          {mediaType === 'photo' ? (
            <Button 
              onClick={capturePhoto} 
              className="w-full" 
              size="lg"
              data-testid="button-capture-photo"
            >
              <Camera className="h-5 w-5 mr-2" />
              Capture Photo
            </Button>
          ) : (
            <Button 
              onClick={isRecording ? stopRecording : startRecording}
              className="w-full" 
              size="lg"
              variant={isRecording ? 'destructive' : 'default'}
              data-testid="button-record-video"
            >
              {isRecording ? (
                <>
                  <Square className="h-5 w-5 mr-2" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Circle className="h-5 w-5 mr-2" />
                  Start Recording
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}