"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LiveStreamStudio;
const react_1 = require("react");
const react_query_1 = require("@tanstack/react-query");
const queryClient_1 = require("@/lib/queryClient");
const card_1 = require("@/components/ui/card");
const button_1 = require("@/components/ui/button");
const badge_1 = require("@/components/ui/badge");
const tabs_1 = require("@/components/ui/tabs");
const use_toast_1 = require("@/hooks/use-toast");
const lucide_react_1 = require("lucide-react");
const CoStarInvite_1 = __importDefault(require("@/components/streaming/CoStarInvite"));
const StreamControls_1 = __importDefault(require("@/components/streaming/StreamControls"));
const StreamChat_1 = __importDefault(require("@/components/streaming/StreamChat"));
const GiftOverlay_1 = __importDefault(require("@/components/streaming/GiftOverlay"));
function LiveStreamStudio() {
    const { toast } = (0, use_toast_1.useToast)();
    const [isStreaming, setIsStreaming] = (0, react_1.useState)(false);
    const [streamSession, setStreamSession] = (0, react_1.useState)(null);
    const [localStream, setLocalStream] = (0, react_1.useState)(null);
    const [remoteStreams, setRemoteStreams] = (0, react_1.useState)(new Map());
    const [videoEnabled, setVideoEnabled] = (0, react_1.useState)(true);
    const [audioEnabled, setAudioEnabled] = (0, react_1.useState)(true);
    const [viewerCount, setViewerCount] = (0, react_1.useState)(0);
    const [streamRevenue, setStreamRevenue] = (0, react_1.useState)(0);
    const [coStars, setCoStars] = (0, react_1.useState)([]);
    const [showGiftOverlay, setShowGiftOverlay] = (0, react_1.useState)(false);
    const [latestGift, setLatestGift] = (0, react_1.useState)(null);
    const videoRef = (0, react_1.useRef)(null);
    const peerConnectionsRef = (0, react_1.useRef)(new Map());
    const wsRef = (0, react_1.useRef)(null);
    // WebRTC configuration
    const rtcConfig = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
        ],
    };
    // Create stream mutation
    const createStreamMutation = (0, react_query_1.useMutation)({
        mutationFn: async (config) => {
            const response = await (0, queryClient_1.apiRequest)('/api/streams/create', {
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
        onError: (error) => {
            toast({
                title: "Error creating stream",
                description: error.message || "Failed to create stream",
                variant: "destructive",
            });
        },
    });
    // Start stream mutation
    const startStreamMutation = (0, react_query_1.useMutation)({
        mutationFn: async (sessionId) => {
            const response = await (0, queryClient_1.apiRequest)(`/api/streams/${sessionId}/start`, {
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
        onError: (error) => {
            toast({
                title: "Error starting stream",
                description: error.message || "Failed to start stream",
                variant: "destructive",
            });
        },
    });
    // End stream mutation
    const endStreamMutation = (0, react_query_1.useMutation)({
        mutationFn: async (sessionId) => {
            const response = await (0, queryClient_1.apiRequest)(`/api/streams/${sessionId}/end`, {
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
        onError: (error) => {
            toast({
                title: "Error ending stream",
                description: error.message || "Failed to end stream",
                variant: "destructive",
            });
        },
    });
    // Get stream analytics
    const { data: analytics } = (0, react_query_1.useQuery)({
        queryKey: ['/api/streams', streamSession === null || streamSession === void 0 ? void 0 : streamSession.streamId, 'analytics'],
        queryFn: async () => {
            if (!streamSession)
                return null;
            const response = await fetch(`/api/streams/${streamSession.streamId}/analytics`);
            return response.json();
        },
        enabled: !!(streamSession === null || streamSession === void 0 ? void 0 : streamSession.streamId),
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
        }
        catch (error) {
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
    const connectWebSocket = (sessionId) => {
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
    const handleWebSocketMessage = (message) => {
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
    const handleWebRTCOffer = async (message) => {
        var _a;
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
        (_a = wsRef.current) === null || _a === void 0 ? void 0 : _a.send(JSON.stringify({
            type: 'webrtc_answer',
            viewerId: message.viewerId,
            answer: answer,
        }));
        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            var _a;
            if (event.candidate) {
                (_a = wsRef.current) === null || _a === void 0 ? void 0 : _a.send(JSON.stringify({
                    type: 'webrtc_ice_candidate',
                    viewerId: message.viewerId,
                    candidate: event.candidate,
                }));
            }
        };
    };
    // Handle WebRTC answer
    const handleWebRTCAnswer = async (message) => {
        const pc = peerConnectionsRef.current.get(message.viewerId);
        if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(message.answer));
        }
    };
    // Handle ICE candidate
    const handleICECandidate = async (message) => {
        const pc = peerConnectionsRef.current.get(message.viewerId);
        if (pc) {
            await pc.addIceCandidate(new RTCIceCandidate(message.candidate));
        }
    };
    // Handle co-star request
    const handleCoStarRequest = (message) => {
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
        }
        catch (error) {
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
    (0, react_1.useEffect)(() => {
        return () => {
            cleanupStream();
        };
    }, []);
    return (React.createElement("div", { className: "container mx-auto p-6 space-y-6" },
        React.createElement("div", { className: "flex justify-between items-center" },
            React.createElement("div", null,
                React.createElement("h1", { className: "text-3xl font-bold", "data-testid": "text-studio-title" }, "Live Stream Studio"),
                React.createElement("p", { className: "text-muted-foreground" }, "Broadcast live to your audience")),
            React.createElement("div", { className: "flex gap-4" },
                !streamSession && (React.createElement(button_1.Button, { onClick: createStream, size: "lg", "data-testid": "button-create-stream" },
                    React.createElement(lucide_react_1.Video, { className: "mr-2" }),
                    "Create Stream")),
                streamSession && !isStreaming && (React.createElement(button_1.Button, { onClick: startStreaming, size: "lg", className: "bg-red-600 hover:bg-red-700", "data-testid": "button-start-stream" },
                    React.createElement(lucide_react_1.Camera, { className: "mr-2" }),
                    "Go Live")),
                isStreaming && (React.createElement(button_1.Button, { onClick: endStreaming, size: "lg", variant: "destructive", "data-testid": "button-end-stream" },
                    React.createElement(lucide_react_1.StopCircle, { className: "mr-2" }),
                    "End Stream")))),
        streamSession && (React.createElement(card_1.Card, null,
            React.createElement(card_1.CardContent, { className: "p-4" },
                React.createElement("div", { className: "flex items-center justify-between" },
                    React.createElement("div", { className: "flex items-center gap-4" },
                        isStreaming ? (React.createElement(badge_1.Badge, { className: "bg-red-600", "data-testid": "badge-live" },
                            React.createElement("span", { className: "animate-pulse mr-2" }, "\u25CF"),
                            "LIVE")) : (React.createElement(badge_1.Badge, { variant: "secondary", "data-testid": "badge-ready" }, "Ready to Stream")),
                        React.createElement("div", { className: "flex items-center gap-6 text-sm" },
                            React.createElement("div", { className: "flex items-center gap-2" },
                                React.createElement(lucide_react_1.Users, { className: "h-4 w-4" }),
                                React.createElement("span", { "data-testid": "text-viewer-count" },
                                    viewerCount,
                                    " viewers")),
                            React.createElement("div", { className: "flex items-center gap-2" },
                                React.createElement(lucide_react_1.DollarSign, { className: "h-4 w-4" }),
                                React.createElement("span", { "data-testid": "text-revenue" },
                                    "$",
                                    streamRevenue.toFixed(2))),
                            React.createElement("div", { className: "flex items-center gap-2" },
                                React.createElement(lucide_react_1.BarChart, { className: "h-4 w-4" }),
                                React.createElement("span", { "data-testid": "text-engagement" },
                                    (analytics === null || analytics === void 0 ? void 0 : analytics.engagement) || 0,
                                    "% engagement")))),
                    React.createElement(button_1.Button, { variant: "outline", size: "sm", "data-testid": "button-share" },
                        React.createElement(lucide_react_1.Share2, { className: "mr-2 h-4 w-4" }),
                        "Share Stream"))))),
        React.createElement("div", { className: "grid grid-cols-12 gap-6" },
            React.createElement("div", { className: "col-span-12 lg:col-span-8" },
                React.createElement(card_1.Card, { className: "h-full" },
                    React.createElement(card_1.CardContent, { className: "p-0 relative" },
                        React.createElement("div", { className: "relative aspect-video bg-black rounded-lg overflow-hidden" },
                            React.createElement("video", { ref: videoRef, autoPlay: true, muted: true, playsInline: true, className: "w-full h-full object-cover", "data-testid": "video-preview" }),
                            streamSession && (React.createElement("div", { className: "absolute bottom-4 left-4 right-4" },
                                React.createElement(StreamControls_1.default, { videoEnabled: videoEnabled, audioEnabled: audioEnabled, onToggleVideo: toggleVideo, onToggleAudio: toggleAudio, sessionId: streamSession.sessionId }))),
                            coStars.length > 0 && (React.createElement("div", { className: "absolute top-4 right-4 space-y-2" }, coStars.map((coStar, index) => (React.createElement("div", { key: coStar.id, className: "w-32 h-24 bg-gray-800 rounded-lg overflow-hidden", "data-testid": `video-costar-${index}` },
                                React.createElement("video", { autoPlay: true, playsInline: true, className: "w-full h-full object-cover" }),
                                React.createElement("div", { className: "absolute bottom-1 left-1 text-xs text-white bg-black/50 px-1 rounded" }, coStar.name)))))),
                            showGiftOverlay && latestGift && (React.createElement(GiftOverlay_1.default, { gift: latestGift }))),
                        streamSession && (React.createElement("div", { className: "p-4 space-y-2" },
                            React.createElement("div", { className: "flex items-center gap-2 text-sm text-muted-foreground" },
                                React.createElement("span", null, "Stream Key:"),
                                React.createElement("code", { className: "bg-secondary px-2 py-1 rounded", "data-testid": "text-stream-key" }, streamSession.streamKey))))))),
            React.createElement("div", { className: "col-span-12 lg:col-span-4" },
                React.createElement(tabs_1.Tabs, { defaultValue: "chat", className: "h-full" },
                    React.createElement(tabs_1.TabsList, { className: "grid w-full grid-cols-3" },
                        React.createElement(tabs_1.TabsTrigger, { value: "chat", "data-testid": "tab-chat" }, "Chat"),
                        React.createElement(tabs_1.TabsTrigger, { value: "costars", "data-testid": "tab-costars" }, "Co-Stars"),
                        React.createElement(tabs_1.TabsTrigger, { value: "settings", "data-testid": "tab-settings" }, "Settings")),
                    React.createElement(tabs_1.TabsContent, { value: "chat", className: "h-[500px]" }, streamSession && (React.createElement(StreamChat_1.default, { streamId: streamSession.streamId, sessionId: streamSession.sessionId }))),
                    React.createElement(tabs_1.TabsContent, { value: "costars" }, streamSession && (React.createElement(CoStarInvite_1.default, { sessionId: streamSession.sessionId, streamId: streamSession.streamId, coStars: coStars, onCoStarAdded: (coStar) => setCoStars(prev => [...prev, coStar]) }))),
                    React.createElement(tabs_1.TabsContent, { value: "settings" },
                        React.createElement(card_1.Card, null,
                            React.createElement(card_1.CardHeader, null,
                                React.createElement(card_1.CardTitle, null, "Stream Settings")),
                            React.createElement(card_1.CardContent, { className: "space-y-4" },
                                React.createElement("div", { className: "space-y-2" },
                                    React.createElement("label", { className: "text-sm font-medium" }, "Privacy"),
                                    React.createElement("select", { className: "w-full p-2 border rounded", "data-testid": "select-privacy" },
                                        React.createElement("option", { value: "public" }, "Public"),
                                        React.createElement("option", { value: "private" }, "Private"),
                                        React.createElement("option", { value: "subscribers" }, "Subscribers Only"))),
                                React.createElement("div", { className: "space-y-2" },
                                    React.createElement("label", { className: "text-sm font-medium" }, "Price per Minute"),
                                    React.createElement("input", { type: "number", className: "w-full p-2 border rounded", placeholder: "5.00", "data-testid": "input-price" })),
                                React.createElement("div", { className: "flex items-center gap-2" },
                                    React.createElement("input", { type: "checkbox", id: "verification", "data-testid": "checkbox-verification" }),
                                    React.createElement("label", { htmlFor: "verification", className: "text-sm" }, "Require age verification")),
                                React.createElement("div", { className: "flex items-center gap-2" },
                                    React.createElement("input", { type: "checkbox", id: "recording", defaultChecked: true, "data-testid": "checkbox-recording" }),
                                    React.createElement("label", { htmlFor: "recording", className: "text-sm" }, "Record stream for later"))))))))));
}
