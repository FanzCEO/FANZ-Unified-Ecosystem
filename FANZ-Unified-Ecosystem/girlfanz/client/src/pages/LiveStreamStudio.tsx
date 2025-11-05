import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Users, 
  Settings, 
  Send,
  Gift,
  Heart,
  DollarSign,
  BarChart,
  Camera,
  Share2,
  StopCircle,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import CoStarInvite from '@/components/streaming/CoStarInvite';
import StreamControls from '@/components/streaming/StreamControls';
import StreamChat from '@/components/streaming/StreamChat';
import GiftOverlay from '@/components/streaming/GiftOverlay';

interface StreamSession {
  sessionId: string;
  streamId: string;
  streamKey: string;
  rtcConfiguration: RTCConfiguration;
  status: 'waiting' | 'live' | 'ended';
}

export default function LiveStreamStudio() {
  const { toast } = useToast();
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamSession, setStreamSession] = useState<StreamSession | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  const [streamRevenue, setStreamRevenue] = useState(0);
  const [coStars, setCoStars] = useState<any[]>([]);
  const [showGiftOverlay, setShowGiftOverlay] = useState(false);
  const [latestGift, setLatestGift] = useState<any>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const wsRef = useRef<WebSocket | null>(null);

  // WebRTC configuration
  const rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  // Create stream mutation
  const createStreamMutation = useMutation({
    mutationFn: async (config: any) => {
      const response = await apiRequest('/api/streams/create', {
        method: 'POST',
        body: JSON.stringify(config),
      });
      return response;
    },
    onSuccess: (data) => {
      setStreamSession(data);
      toast({
        title: "Stream created",
        description: "Your stream is ready. Start broadcasting when ready!",
      });
      // Connect to WebSocket for streaming
      connectWebSocket(data.sessionId);
    },
    onError: (error: any) => {
      toast({
        title: "Error creating stream",
        description: error.message || "Failed to create stream",
        variant: "destructive",
      });
    },
  });

  // Start stream mutation
  const startStreamMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await apiRequest(`/api/streams/${sessionId}/start`, {
        method: 'POST',
      });
      return response;
    },
    onSuccess: () => {
      setIsStreaming(true);
      toast({
        title: "Stream started",
        description: "You are now live!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error starting stream",
        description: error.message || "Failed to start stream",
        variant: "destructive",
      });
    },
  });

  // End stream mutation
  const endStreamMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await apiRequest(`/api/streams/${sessionId}/end`, {
        method: 'POST',
      });
      return response;
    },
    onSuccess: () => {
      setIsStreaming(false);
      cleanupStream();
      toast({
        title: "Stream ended",
        description: "Your stream has been ended successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error ending stream",
        description: error.message || "Failed to end stream",
        variant: "destructive",
      });
    },
  });

  // Get stream analytics
  const { data: analytics } = useQuery({
    queryKey: ['/api/streams', streamSession?.streamId, 'analytics'],
    queryFn: async () => {
      if (!streamSession) return null;
      const response = await fetch(`/api/streams/${streamSession.streamId}/analytics`);
      return response.json();
    },
    enabled: !!streamSession?.streamId,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Initialize media devices
  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: 'user',
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      
      setLocalStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      toast({
        title: "Camera/Microphone Error",
        description: "Failed to access camera or microphone. Please check permissions.",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Connect to WebSocket for streaming
  const connectWebSocket = (sessionId: string) => {
    const token = localStorage.getItem('authToken') || 'demo-token';
    const ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws?token=${token}&purpose=stream`);
    
    ws.onopen = () => {
      console.log('WebSocket connected for streaming');
      ws.send(JSON.stringify({
        type: 'join_stream',
        sessionId,
        role: 'host',
      }));
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      handleWebSocketMessage(message);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    wsRef.current = ws;
  };

  // Handle WebSocket messages
  const handleWebSocketMessage = (message: any) => {
    switch (message.type) {
      case 'viewer_joined':
        setViewerCount(prev => prev + 1);
        break;
      
      case 'viewer_left':
        setViewerCount(prev => Math.max(0, prev - 1));
        break;
      
      case 'gift_received':
        setLatestGift(message.gift);
        setStreamRevenue(prev => prev + message.gift.amount);
        setShowGiftOverlay(true);
        setTimeout(() => setShowGiftOverlay(false), 5000);
        break;
      
      case 'co_star_request':
        handleCoStarRequest(message);
        break;
      
      case 'webrtc_offer':
        handleWebRTCOffer(message);
        break;
      
      case 'webrtc_answer':
        handleWebRTCAnswer(message);
        break;
      
      case 'webrtc_ice_candidate':
        handleICECandidate(message);
        break;
      
      case 'stream_analytics':
        setViewerCount(message.viewerCount);
        setStreamRevenue(message.revenue);
        break;
    }
  };

  // Handle WebRTC offer from viewer
  const handleWebRTCOffer = async (message: any) => {
    const pc = new RTCPeerConnection(rtcConfig);
    peerConnectionsRef.current.set(message.viewerId, pc);
    
    // Add local stream tracks to peer connection
    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }
    
    // Set remote description
    await pc.setRemoteDescription(new RTCSessionDescription(message.offer));
    
    // Create answer
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    
    // Send answer back
    wsRef.current?.send(JSON.stringify({
      type: 'webrtc_answer',
      viewerId: message.viewerId,
      answer: answer,
    }));
    
    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        wsRef.current?.send(JSON.stringify({
          type: 'webrtc_ice_candidate',
          viewerId: message.viewerId,
          candidate: event.candidate,
        }));
      }
    };
  };

  // Handle WebRTC answer
  const handleWebRTCAnswer = async (message: any) => {
    const pc = peerConnectionsRef.current.get(message.viewerId);
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(message.answer));
    }
  };

  // Handle ICE candidate
  const handleICECandidate = async (message: any) => {
    const pc = peerConnectionsRef.current.get(message.viewerId);
    if (pc) {
      await pc.addIceCandidate(new RTCIceCandidate(message.candidate));
    }
  };

  // Handle co-star request
  const handleCoStarRequest = (message: any) => {
    setCoStars(prev => [...prev, message.coStar]);
    toast({
      title: "Co-star request",
      description: `${message.coStar.name} wants to join your stream`,
    });
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
      }
    }
  };

  // Toggle audio
  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
      }
    }
  };

  // Create stream
  const createStream = async () => {
    try {
      await initializeMedia();
      await createStreamMutation.mutateAsync({
        title: `Live Stream - ${new Date().toLocaleDateString()}`,
        description: "Join me for an exclusive live stream!",
        isPrivate: false,
        pricePerMinute: 5,
        requiresVerification: true,
      });
    } catch (error) {
      console.error('Error creating stream:', error);
    }
  };

  // Start streaming
  const startStreaming = async () => {
    if (streamSession) {
      await startStreamMutation.mutateAsync(streamSession.sessionId);
    }
  };

  // End streaming
  const endStreaming = async () => {
    if (streamSession) {
      await endStreamMutation.mutateAsync(streamSession.sessionId);
    }
  };

  // Cleanup stream
  const cleanupStream = () => {
    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    
    // Close peer connections
    peerConnectionsRef.current.forEach(pc => pc.close());
    peerConnectionsRef.current.clear();
    
    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setStreamSession(null);
    setRemoteStreams(new Map());
    setViewerCount(0);
    setStreamRevenue(0);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupStream();
    };
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-studio-title">Live Stream Studio</h1>
          <p className="text-muted-foreground">Broadcast live to your audience</p>
        </div>
        
        <div className="flex gap-4">
          {!streamSession && (
            <Button onClick={createStream} size="lg" data-testid="button-create-stream">
              <Video className="mr-2" />
              Create Stream
            </Button>
          )}
          
          {streamSession && !isStreaming && (
            <Button onClick={startStreaming} size="lg" className="bg-red-600 hover:bg-red-700" data-testid="button-start-stream">
              <Camera className="mr-2" />
              Go Live
            </Button>
          )}
          
          {isStreaming && (
            <Button onClick={endStreaming} size="lg" variant="destructive" data-testid="button-end-stream">
              <StopCircle className="mr-2" />
              End Stream
            </Button>
          )}
        </div>
      </div>

      {/* Stream Status */}
      {streamSession && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {isStreaming ? (
                  <Badge className="bg-red-600" data-testid="badge-live">
                    <span className="animate-pulse mr-2">●</span>
                    LIVE
                  </Badge>
                ) : (
                  <Badge variant="secondary" data-testid="badge-ready">
                    Ready to Stream
                  </Badge>
                )}
                
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span data-testid="text-viewer-count">{viewerCount} viewers</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <span data-testid="text-revenue">${streamRevenue.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <BarChart className="h-4 w-4" />
                    <span data-testid="text-engagement">{analytics?.engagement || 0}% engagement</span>
                  </div>
                </div>
              </div>
              
              <Button variant="outline" size="sm" data-testid="button-share">
                <Share2 className="mr-2 h-4 w-4" />
                Share Stream
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-12 gap-6">
        {/* Main Video Area */}
        <div className="col-span-12 lg:col-span-8">
          <Card className="h-full">
            <CardContent className="p-0 relative">
              {/* Video Preview */}
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                  data-testid="video-preview"
                />
                
                {/* Stream Controls Overlay */}
                {streamSession && (
                  <div className="absolute bottom-4 left-4 right-4">
                    <StreamControls
                      videoEnabled={videoEnabled}
                      audioEnabled={audioEnabled}
                      onToggleVideo={toggleVideo}
                      onToggleAudio={toggleAudio}
                      sessionId={streamSession.sessionId}
                    />
                  </div>
                )}
                
                {/* Co-stars */}
                {coStars.length > 0 && (
                  <div className="absolute top-4 right-4 space-y-2">
                    {coStars.map((coStar, index) => (
                      <div
                        key={coStar.id}
                        className="w-32 h-24 bg-gray-800 rounded-lg overflow-hidden"
                        data-testid={`video-costar-${index}`}
                      >
                        <video
                          autoPlay
                          playsInline
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-1 left-1 text-xs text-white bg-black/50 px-1 rounded">
                          {coStar.name}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Gift Overlay */}
                {showGiftOverlay && latestGift && (
                  <GiftOverlay gift={latestGift} />
                )}
              </div>
              
              {/* Stream Info */}
              {streamSession && (
                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Stream Key:</span>
                    <code className="bg-secondary px-2 py-1 rounded" data-testid="text-stream-key">
                      {streamSession.streamKey}
                    </code>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="col-span-12 lg:col-span-4">
          <Tabs defaultValue="chat" className="h-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="chat" data-testid="tab-chat">Chat</TabsTrigger>
              <TabsTrigger value="costars" data-testid="tab-costars">Co-Stars</TabsTrigger>
              <TabsTrigger value="settings" data-testid="tab-settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="chat" className="h-[500px]">
              {streamSession && (
                <StreamChat
                  streamId={streamSession.streamId}
                  sessionId={streamSession.sessionId}
                />
              )}
            </TabsContent>
            
            <TabsContent value="costars">
              {streamSession && (
                <CoStarInvite
                  sessionId={streamSession.sessionId}
                  streamId={streamSession.streamId}
                  coStars={coStars}
                  onCoStarAdded={(coStar) => setCoStars(prev => [...prev, coStar])}
                />
              )}
            </TabsContent>
            
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Stream Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Privacy</label>
                    <select className="w-full p-2 border rounded" data-testid="select-privacy">
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                      <option value="subscribers">Subscribers Only</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Price per Minute</label>
                    <input
                      type="number"
                      className="w-full p-2 border rounded"
                      placeholder="5.00"
                      data-testid="input-price"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="verification" data-testid="checkbox-verification" />
                    <label htmlFor="verification" className="text-sm">
                      Require age verification
                    </label>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="recording" defaultChecked data-testid="checkbox-recording" />
                    <label htmlFor="recording" className="text-sm">
                      Record stream for later
                    </label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}