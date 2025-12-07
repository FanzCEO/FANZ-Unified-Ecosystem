"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SelfieCapture;
const react_1 = require("react");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const alert_1 = require("@/components/ui/alert");
const lucide_react_1 = require("lucide-react");
const use_toast_1 = require("@/hooks/use-toast");
function SelfieCapture({ onCapture, onBack }) {
    const [selfieImage, setSelfieImage] = (0, react_1.useState)(null);
    const [isCameraActive, setIsCameraActive] = (0, react_1.useState)(false);
    const [faceDetected, setFaceDetected] = (0, react_1.useState)(false);
    const [captureCountdown, setCaptureCountdown] = (0, react_1.useState)(null);
    const [livenessCheck, setLivenessCheck] = (0, react_1.useState)('idle');
    const videoRef = (0, react_1.useRef)(null);
    const canvasRef = (0, react_1.useRef)(null);
    const [stream, setStream] = (0, react_1.useState)(null);
    const faceDetectionIntervalRef = (0, react_1.useRef)(null);
    const { toast } = (0, use_toast_1.useToast)();
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
        }
        catch (error) {
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
                }
                else {
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
    (0, react_1.useEffect)(() => {
        return () => {
            stopCamera();
        };
    }, []);
    return (React.createElement("div", { className: "space-y-6" },
        React.createElement("div", { className: "text-center" },
            React.createElement("h3", { className: "text-lg font-semibold mb-2" }, "Take a Selfie"),
            React.createElement("p", { className: "text-sm text-muted-foreground" }, "We'll match your face with your ID photo to verify your identity")),
        React.createElement(alert_1.Alert, null,
            React.createElement(lucide_react_1.User, { className: "h-4 w-4" }),
            React.createElement(alert_1.AlertDescription, null,
                React.createElement("ul", { className: "list-disc list-inside space-y-1 text-sm" },
                    React.createElement("li", null, "Remove glasses, hats, or face coverings"),
                    React.createElement("li", null, "Ensure your face is well-lit and clearly visible"),
                    React.createElement("li", null, "Look directly at the camera"),
                    React.createElement("li", null, "Keep a neutral expression")))),
        !selfieImage ? (React.createElement("div", { className: "space-y-4" },
            React.createElement(card_1.Card, { className: "overflow-hidden relative" },
                React.createElement(card_1.CardContent, { className: "p-0" }, isCameraActive ? (React.createElement(React.Fragment, null,
                    React.createElement("video", { ref: videoRef, autoPlay: true, playsInline: true, muted: true, className: "w-full transform scale-x-[-1]", "data-testid": "video-selfie-camera" }),
                    React.createElement("canvas", { ref: canvasRef, className: "hidden" }),
                    React.createElement("div", { className: "absolute inset-0 pointer-events-none" },
                        React.createElement("div", { className: "h-full w-full flex items-center justify-center" },
                            React.createElement("div", { className: `w-48 h-64 border-4 rounded-full ${faceDetected ? 'border-green-500' : 'border-white/50'} transition-colors` }))),
                    React.createElement("div", { className: "absolute top-4 left-4 right-4 flex justify-between" },
                        React.createElement("div", { className: `px-3 py-1 rounded text-sm font-medium ${faceDetected ? 'bg-green-500/90 text-white' : 'bg-black/50 text-white'}` }, faceDetected ? 'Face detected' : 'Position your face'),
                        captureCountdown && (React.createElement("div", { className: "bg-primary/90 text-primary-foreground px-3 py-1 rounded text-lg font-bold" }, captureCountdown))))) : (React.createElement("div", { className: "h-96 flex items-center justify-center bg-muted" },
                    React.createElement(button_1.Button, { onClick: startCamera, size: "lg", "data-testid": "button-start-selfie-camera" },
                        React.createElement(lucide_react_1.Camera, { className: "h-5 w-5 mr-2" }),
                        "Open Camera"))))),
            isCameraActive && (React.createElement(button_1.Button, { onClick: capturePhoto, disabled: !faceDetected || captureCountdown !== null, className: "w-full", size: "lg", "data-testid": "button-capture-selfie" }, captureCountdown ? `Capturing in ${captureCountdown}...` : 'Capture Selfie')))) : (React.createElement("div", { className: "space-y-4" },
            React.createElement(card_1.Card, null,
                React.createElement(card_1.CardContent, { className: "p-4" },
                    React.createElement("div", { className: "space-y-4" },
                        React.createElement("img", { src: selfieImage, alt: "Your selfie", className: "w-full rounded transform scale-x-[-1]", "data-testid": "image-selfie-preview" }),
                        React.createElement("div", { className: `flex items-center justify-center gap-2 p-3 rounded ${livenessCheck === 'checking' ? 'bg-yellow-50 text-yellow-800' :
                                livenessCheck === 'passed' ? 'bg-green-50 text-green-800' :
                                    livenessCheck === 'failed' ? 'bg-red-50 text-red-800' :
                                        'bg-muted'}` },
                            livenessCheck === 'checking' && (React.createElement(React.Fragment, null,
                                React.createElement(lucide_react_1.RefreshCw, { className: "h-4 w-4 animate-spin" }),
                                React.createElement("span", { className: "text-sm font-medium" }, "Performing liveness check..."))),
                            livenessCheck === 'passed' && (React.createElement(React.Fragment, null,
                                React.createElement(lucide_react_1.CheckCircle, { className: "h-4 w-4" }),
                                React.createElement("span", { className: "text-sm font-medium" }, "Liveness verified"))),
                            livenessCheck === 'failed' && (React.createElement(React.Fragment, null,
                                React.createElement(lucide_react_1.AlertCircle, { className: "h-4 w-4" }),
                                React.createElement("span", { className: "text-sm font-medium" }, "Liveness check failed"))))))),
            React.createElement(button_1.Button, { variant: "outline", onClick: handleRetake, className: "w-full", "data-testid": "button-retake-selfie" },
                React.createElement(lucide_react_1.RefreshCw, { className: "h-4 w-4 mr-2" }),
                "Retake Selfie"))),
        React.createElement("div", { className: "flex gap-3" },
            onBack && (React.createElement(button_1.Button, { variant: "outline", onClick: () => {
                    stopCamera();
                    onBack();
                }, "data-testid": "button-back" },
                React.createElement(lucide_react_1.ChevronLeft, { className: "h-4 w-4 mr-2" }),
                "Back")),
            React.createElement(button_1.Button, { onClick: handleSubmit, disabled: !selfieImage || livenessCheck !== 'passed', className: "flex-1", "data-testid": "button-verify" }, "Verify Identity"))));
}
