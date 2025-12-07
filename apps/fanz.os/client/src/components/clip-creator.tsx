import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Scissors, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward,
  Check,
  X
} from "lucide-react";

interface ClipCreatorProps {
  videoId: string;
  videoUrl: string;
  videoDuration: number;
  onClipCreated?: (clip: any) => void;
  onCancel?: () => void;
}

export default function ClipCreator({
  videoId,
  videoUrl,
  videoDuration,
  onClipCreated,
  onCancel
}: ClipCreatorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(Math.min(30, videoDuration)); // Default 30s clip
  const [clipTitle, setClipTitle] = useState("");
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const clipDuration = endTime - startTime;
  const maxClipDuration = 60; // 60 seconds max

  const createClipMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/clips", {
        sourceVideoId: videoId,
        startTime,
        endTime,
        title: clipTitle || `Clip from ${formatTime(startTime)} to ${formatTime(endTime)}`
      });
      return response.json();
    },
    onSuccess: (clip) => {
      toast({
        title: "Clip Created!",
        description: `Your ${clipDuration.toFixed(1)}s clip has been created successfully.`,
      });
      onClipCreated?.(clip);
    },
    onError: (error) => {
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
        title: "Failed to Create Clip",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update current time from video
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // Set start time to current position
  const setStartTimeToCurrent = () => {
    setStartTime(currentTime);
    if (currentTime + 5 > endTime) {
      setEndTime(Math.min(currentTime + 30, videoDuration));
    }
  };

  // Set end time to current position
  const setEndTimeToCurrent = () => {
    if (currentTime > startTime) {
      setEndTime(currentTime);
    }
  };

  // Jump to start of clip
  const jumpToStart = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = startTime;
    }
  };

  // Jump to end of clip
  const jumpToEnd = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = endTime;
    }
  };

  // Preview the clip
  const previewClip = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = startTime;
      videoRef.current.play();
      setIsPreviewMode(true);
      setIsPlaying(true);
    }
  };

  // Stop preview when reaching end time
  useEffect(() => {
    if (isPreviewMode && currentTime >= endTime) {
      if (videoRef.current) {
        videoRef.current.pause();
        setIsPlaying(false);
        setIsPreviewMode(false);
      }
    }
  }, [currentTime, endTime, isPreviewMode]);

  // Toggle play/pause
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
        setIsPreviewMode(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  // Seek to specific time
  const seekTo = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  // Handle start time change
  const handleStartTimeChange = (value: number[]) => {
    const newStartTime = value[0];
    setStartTime(newStartTime);
    
    // Ensure minimum clip duration of 3 seconds
    if (endTime - newStartTime < 3) {
      setEndTime(Math.min(newStartTime + 3, videoDuration));
    }
    
    // Ensure maximum clip duration
    if (endTime - newStartTime > maxClipDuration) {
      setEndTime(newStartTime + maxClipDuration);
    }
  };

  // Handle end time change
  const handleEndTimeChange = (value: number[]) => {
    const newEndTime = value[0];
    
    // Ensure minimum clip duration of 3 seconds
    if (newEndTime - startTime >= 3) {
      setEndTime(newEndTime);
    }
  };

  // Format time for display
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const milliseconds = Math.floor((time % 1) * 100);
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Video Player */}
      <Card className="bg-black border-gray-700 overflow-hidden">
        <div className="relative aspect-video">
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            src={videoUrl}
            onTimeUpdate={handleTimeUpdate}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onClick={togglePlayPause}
          >
            <source src={videoUrl} type="video/mp4" />
          </video>

          {/* Clip Markers Overlay */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-black/50 rounded-lg p-2">
              <div className="relative h-2 bg-gray-600 rounded">
                {/* Progress bar */}
                <div 
                  className="absolute h-full bg-white rounded"
                  style={{ width: `${(currentTime / videoDuration) * 100}%` }}
                />
                
                {/* Clip start marker */}
                <div 
                  className="absolute top-0 w-1 h-full bg-green-500"
                  style={{ left: `${(startTime / videoDuration) * 100}%` }}
                />
                
                {/* Clip end marker */}
                <div 
                  className="absolute top-0 w-1 h-full bg-red-500"
                  style={{ left: `${(endTime / videoDuration) * 100}%` }}
                />
                
                {/* Clip duration highlight */}
                <div 
                  className="absolute top-0 h-full bg-primary/30"
                  style={{ 
                    left: `${(startTime / videoDuration) * 100}%`,
                    width: `${((endTime - startTime) / videoDuration) * 100}%`
                  }}
                />
              </div>
            </div>
          </div>

          {/* Play/Pause Overlay */}
          <div 
            className="absolute inset-0 flex items-center justify-center cursor-pointer"
            onClick={togglePlayPause}
          >
            {!isPlaying && (
              <div className="bg-black/50 rounded-full p-4 backdrop-blur-sm">
                <Play className="w-12 h-12 text-white fill-white" />
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Clip Controls */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center">
            <Scissors className="w-5 h-5 mr-2" />
            Create Clip
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Clip Title */}
          <div>
            <Label htmlFor="clip-title" className="text-white">Clip Title</Label>
            <Input
              id="clip-title"
              value={clipTitle}
              onChange={(e) => setClipTitle(e.target.value)}
              placeholder="Enter clip title..."
              className="bg-gray-700 border-gray-600 text-white mt-1"
            />
          </div>

          {/* Timeline Controls */}
          <div className="grid grid-cols-2 gap-4">
            {/* Start Time */}
            <div>
              <Label className="text-white">Start Time: {formatTime(startTime)}</Label>
              <div className="mt-2">
                <Slider
                  value={[startTime]}
                  max={videoDuration - 3}
                  step={0.1}
                  className="w-full"
                  onValueChange={handleStartTimeChange}
                />
              </div>
              <div className="flex space-x-2 mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={setStartTimeToCurrent}
                  className="text-xs"
                >
                  Set to Current
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={jumpToStart}
                  className="text-xs"
                >
                  Jump to Start
                </Button>
              </div>
            </div>

            {/* End Time */}
            <div>
              <Label className="text-white">End Time: {formatTime(endTime)}</Label>
              <div className="mt-2">
                <Slider
                  value={[endTime]}
                  min={startTime + 3}
                  max={Math.min(startTime + maxClipDuration, videoDuration)}
                  step={0.1}
                  className="w-full"
                  onValueChange={handleEndTimeChange}
                />
              </div>
              <div className="flex space-x-2 mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={setEndTimeToCurrent}
                  disabled={currentTime <= startTime}
                  className="text-xs"
                >
                  Set to Current
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={jumpToEnd}
                  className="text-xs"
                >
                  Jump to End
                </Button>
              </div>
            </div>
          </div>

          {/* Clip Info */}
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-gray-400 text-sm">Duration</div>
                <div className="text-white font-semibold">{clipDuration.toFixed(1)}s</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">Start</div>
                <div className="text-white font-semibold">{formatTime(startTime)}</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">End</div>
                <div className="text-white font-semibold">{formatTime(endTime)}</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              onClick={previewClip}
              variant="outline"
              className="flex-1 border-primary text-primary hover:bg-primary hover:text-white"
            >
              <Play className="w-4 h-4 mr-2" />
              Preview Clip
            </Button>
            
            <Button
              onClick={() => createClipMutation.mutate()}
              disabled={createClipMutation.isPending || clipDuration < 3 || clipDuration > maxClipDuration}
              className="flex-1 bg-gradient-to-r from-primary to-secondary hover:from-purple-600 hover:to-pink-600"
            >
              {createClipMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Create Clip
                </>
              )}
            </Button>
            
            {onCancel && (
              <Button
                onClick={onCancel}
                variant="outline"
                className="border-gray-600 hover:bg-gray-700"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            )}
          </div>

          {/* Validation Messages */}
          {clipDuration < 3 && (
            <p className="text-red-400 text-sm">
              Clip must be at least 3 seconds long
            </p>
          )}
          
          {clipDuration > maxClipDuration && (
            <p className="text-red-400 text-sm">
              Clip cannot be longer than {maxClipDuration} seconds
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}