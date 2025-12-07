import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Maximize,
  Minimize,
  RotateCcw,
  Move3d,
  Glasses,
  Eye,
  Settings,
  Volume2,
  VolumeX,
} from "lucide-react";

interface VRViewerProps {
  mediaUrl: string;
  vrType: '360_video' | '180_video' | '3d_model' | 'ar_filter';
  resolution?: string;
  stereoscopicMode?: 'mono' | 'stereo_lr' | 'stereo_tb';
  projectionType?: 'equirectangular' | 'cubemap';
  onClose?: () => void;
}

export function VRViewer({
  mediaUrl,
  vrType,
  resolution = '4K',
  stereoscopicMode = 'mono',
  projectionType = 'equirectangular',
  onClose,
}: VRViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isVRMode, setIsVRMode] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  const resetView = () => {
    setRotation({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;

    const deltaX = e.clientX - lastMousePos.current.x;
    const deltaY = e.clientY - lastMousePos.current.y;

    setRotation(prev => ({
      x: Math.max(-90, Math.min(90, prev.x - deltaY * 0.3)),
      y: (prev.y + deltaX * 0.3) % 360,
    }));

    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const enterVRMode = () => {
    setIsVRMode(true);
    toggleFullscreen();
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-black"
      data-testid="vr-viewer-container"
    >
      {/* VR Badges */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <Badge className="bg-gf-cyber/90 backdrop-blur text-white">
          <Glasses className="h-3 w-3 mr-1" />
          {vrType.replace('_', ' ').toUpperCase()}
        </Badge>
        <Badge className="bg-black/70 backdrop-blur text-white">
          {resolution}
        </Badge>
        {stereoscopicMode !== 'mono' && (
          <Badge className="bg-black/70 backdrop-blur text-white">
            <Eye className="h-3 w-3 mr-1" />
            {stereoscopicMode.toUpperCase()}
          </Badge>
        )}
      </div>

      {/* Main Viewer */}
      <div
        className="relative w-full h-full overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {vrType === '360_video' || vrType === '180_video' ? (
          <video
            ref={videoRef}
            src={mediaUrl}
            className="w-full h-full object-cover"
            style={{
              transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
              transformStyle: 'preserve-3d',
            }}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            data-testid="vr-video"
          />
        ) : vrType === '3d_model' ? (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
              transformStyle: 'preserve-3d',
            }}
          >
            {/* 3D Model Placeholder - Would integrate Three.js or similar */}
            <div className="text-gf-snow text-center">
              <Move3d className="h-16 w-16 mx-auto mb-4 text-gf-cyber" />
              <p className="text-lg font-semibold">3D Model Viewer</p>
              <p className="text-sm text-gf-steel mt-2">
                Drag to rotate • Scroll to zoom
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-gf-snow text-center">
              <Glasses className="h-16 w-16 mx-auto mb-4 text-gf-cyber" />
              <p className="text-lg font-semibold">AR Filter</p>
              <p className="text-sm text-gf-steel mt-2">
                Enable camera access to try this filter
              </p>
            </div>
          </div>
        )}

        {/* VR Overlay Grid (for immersion) */}
        {isVRMode && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="w-full h-full grid grid-cols-2 gap-1 opacity-20">
              <div className="border border-gf-cyber"></div>
              <div className="border border-gf-cyber"></div>
            </div>
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-6 z-10">
        <Card className="bg-black/60 backdrop-blur border-gf-steel/20 p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={resetView}
                className="text-white hover:text-gf-cyber"
                data-testid="button-reset-view"
              >
                <RotateCcw className="h-5 w-5" />
              </Button>

              {(vrType === '360_video' || vrType === '180_video') && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMuted(!isMuted)}
                  className="text-white hover:text-gf-cyber"
                  data-testid="button-toggle-mute"
                >
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFullscreen}
                className="text-white hover:text-gf-cyber"
                data-testid="button-toggle-fullscreen"
              >
                {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={enterVRMode}
                className="bg-gradient-to-r from-gf-cyber to-gf-pink hover:opacity-90"
                data-testid="button-enter-vr"
              >
                <Glasses className="h-4 w-4 mr-2" />
                Enter VR
              </Button>

              {onClose && (
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="border-gf-steel/20 text-white"
                  data-testid="button-close-vr"
                >
                  Close
                </Button>
              )}
            </div>
          </div>

          {/* Rotation Info */}
          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gf-steel">
            <span>X: {rotation.x.toFixed(1)}°</span>
            <span>Y: {rotation.y.toFixed(1)}°</span>
            <span className="text-gf-cyber">Drag to look around</span>
          </div>
        </Card>
      </div>

      {/* Instructions Overlay (shows on first load) */}
      {!isVRMode && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center pointer-events-none z-5 animate-fade-in">
          <div className="text-center text-white p-8 bg-gf-charcoal/80 rounded-lg border border-gf-cyber/30 pointer-events-auto max-w-md">
            <Glasses className="h-12 w-12 mx-auto mb-4 text-gf-cyber" />
            <h3 className="text-xl font-bold mb-2">VR/AR Experience</h3>
            <p className="text-gf-steel mb-4">
              Drag to look around • Use VR mode for immersive viewing
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Move3d className="h-4 w-4 text-gf-cyber" />
                <span>Drag to rotate</span>
              </div>
              <div className="flex items-center gap-2">
                <Maximize className="h-4 w-4 text-gf-cyber" />
                <span>Fullscreen</span>
              </div>
              <div className="flex items-center gap-2">
                <Glasses className="h-4 w-4 text-gf-cyber" />
                <span>VR mode</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-gf-cyber" />
                <span>Reset view</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
