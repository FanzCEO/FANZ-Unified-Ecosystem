"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CameraCapture;
const react_1 = require("react");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const select_1 = require("@/components/ui/select");
const slider_1 = require("@/components/ui/slider");
const use_toast_1 = require("@/hooks/use-toast");
const queryClient_1 = require("@/lib/queryClient");
const lucide_react_1 = require("lucide-react");
function CameraCapture({ onCapture }) {
    const [isRecording, setIsRecording] = (0, react_1.useState)(false);
    const [showCamera, setShowCamera] = (0, react_1.useState)(false);
    const [mediaType, setMediaType] = (0, react_1.useState)('photo');
    const [filter, setFilter] = (0, react_1.useState)('none');
    const [brightness, setBrightness] = (0, react_1.useState)([100]);
    const [contrast, setContrast] = (0, react_1.useState)([100]);
    const [recordedChunks, setRecordedChunks] = (0, react_1.useState)([]);
    const { toast } = (0, use_toast_1.useToast)();
    const videoRef = (0, react_1.useRef)(null);
    const canvasRef = (0, react_1.useRef)(null);
    const mediaRecorderRef = (0, react_1.useRef)(null);
    const streamRef = (0, react_1.useRef)(null);
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
        }
        catch (error) {
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
        if (!videoRef.current || !canvasRef.current)
            return;
        const canvas = canvasRef.current;
        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx)
            return;
        ctx.filter = getFilterStyle();
        ctx.drawImage(video, 0, 0);
        canvas.toBlob(async (blob) => {
            if (!blob)
                return;
            const formData = new FormData();
            formData.append('file', blob, 'capture.jpg');
            formData.append('title', `Photo capture ${new Date().toLocaleString()}`);
            formData.append('type', 'photo');
            try {
                const response = await (0, queryClient_1.apiRequest)('/api/creator/content/capture', {
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
            }
            catch (error) {
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
        if (!streamRef.current)
            return;
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
                const response = await (0, queryClient_1.apiRequest)('/api/creator/content/capture', {
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
            }
            catch (error) {
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
    const blobToBase64 = (blob) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
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
        return (React.createElement("div", { className: "space-y-4" },
            React.createElement("div", { className: "flex gap-2" },
                React.createElement(button_1.Button, { variant: mediaType === 'photo' ? 'default' : 'outline', onClick: () => setMediaType('photo'), "data-testid": "button-photo-mode" },
                    React.createElement(lucide_react_1.Camera, { className: "h-4 w-4 mr-2" }),
                    "Photo"),
                React.createElement(button_1.Button, { variant: mediaType === 'video' ? 'default' : 'outline', onClick: () => setMediaType('video'), "data-testid": "button-video-mode" },
                    React.createElement(lucide_react_1.Video, { className: "h-4 w-4 mr-2" }),
                    "Video")),
            React.createElement(button_1.Button, { onClick: startCamera, className: "w-full", "data-testid": "button-open-camera" },
                React.createElement(lucide_react_1.Camera, { className: "h-4 w-4 mr-2" }),
                "Open Camera")));
    }
    return (React.createElement(card_1.Card, { className: "w-full" },
        React.createElement(card_1.CardContent, { className: "p-4 space-y-4" },
            React.createElement("div", { className: "relative aspect-video bg-black rounded-lg overflow-hidden" },
                React.createElement("video", { ref: videoRef, autoPlay: true, playsInline: true, muted: true, className: "w-full h-full object-cover", style: { filter: getFilterStyle() }, "data-testid": "video-preview" }),
                React.createElement("canvas", { ref: canvasRef, className: "hidden" }),
                isRecording && (React.createElement("div", { className: "absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full" },
                    React.createElement(lucide_react_1.Circle, { className: "h-3 w-3 animate-pulse fill-current" }),
                    React.createElement("span", { className: "text-sm font-medium" }, "Recording"))),
                React.createElement("div", { className: "absolute top-4 right-4 flex gap-2" },
                    React.createElement(button_1.Button, { size: "sm", variant: "secondary", onClick: switchCamera, "data-testid": "button-switch-camera" },
                        React.createElement(lucide_react_1.RotateCw, { className: "h-4 w-4" })),
                    React.createElement(button_1.Button, { size: "sm", variant: "secondary", onClick: stopCamera, "data-testid": "button-close-camera" },
                        React.createElement(lucide_react_1.X, { className: "h-4 w-4" })))),
            React.createElement("div", { className: "space-y-4" },
                React.createElement("div", { className: "space-y-2" },
                    React.createElement("label", { className: "text-sm font-medium" }, "Filter"),
                    React.createElement(select_1.Select, { value: filter, onValueChange: setFilter },
                        React.createElement(select_1.SelectTrigger, { "data-testid": "select-filter" },
                            React.createElement(select_1.SelectValue, { placeholder: "Choose a filter" })),
                        React.createElement(select_1.SelectContent, null, filters.map((f) => (React.createElement(select_1.SelectItem, { key: f.value, value: f.value }, f.label)))))),
                React.createElement("div", { className: "space-y-2" },
                    React.createElement("div", { className: "flex items-center gap-2" },
                        React.createElement(lucide_react_1.Sun, { className: "h-4 w-4" }),
                        React.createElement("label", { className: "text-sm font-medium" },
                            "Brightness: ",
                            brightness[0],
                            "%")),
                    React.createElement(slider_1.Slider, { value: brightness, onValueChange: setBrightness, min: 0, max: 200, step: 10, "data-testid": "slider-brightness" })),
                React.createElement("div", { className: "space-y-2" },
                    React.createElement("div", { className: "flex items-center gap-2" },
                        React.createElement(lucide_react_1.Palette, { className: "h-4 w-4" }),
                        React.createElement("label", { className: "text-sm font-medium" },
                            "Contrast: ",
                            contrast[0],
                            "%")),
                    React.createElement(slider_1.Slider, { value: contrast, onValueChange: setContrast, min: 0, max: 200, step: 10, "data-testid": "slider-contrast" })),
                mediaType === 'photo' ? (React.createElement(button_1.Button, { onClick: capturePhoto, className: "w-full", size: "lg", "data-testid": "button-capture-photo" },
                    React.createElement(lucide_react_1.Camera, { className: "h-5 w-5 mr-2" }),
                    "Capture Photo")) : (React.createElement(button_1.Button, { onClick: isRecording ? stopRecording : startRecording, className: "w-full", size: "lg", variant: isRecording ? 'destructive' : 'default', "data-testid": "button-record-video" }, isRecording ? (React.createElement(React.Fragment, null,
                    React.createElement(lucide_react_1.Square, { className: "h-5 w-5 mr-2" }),
                    "Stop Recording")) : (React.createElement(React.Fragment, null,
                    React.createElement(lucide_react_1.Circle, { className: "h-5 w-5 mr-2" }),
                    "Start Recording"))))))));
}
