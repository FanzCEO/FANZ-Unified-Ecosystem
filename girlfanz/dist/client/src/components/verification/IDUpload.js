"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = IDUpload;
const react_1 = require("react");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const select_1 = require("@/components/ui/select");
const alert_1 = require("@/components/ui/alert");
const lucide_react_1 = require("lucide-react");
const use_toast_1 = require("@/hooks/use-toast");
function IDUpload({ onUpload, onBack }) {
    const [documentType, setDocumentType] = (0, react_1.useState)('drivers_license');
    const [frontImage, setFrontImage] = (0, react_1.useState)(null);
    const [backImage, setBackImage] = (0, react_1.useState)(null);
    const [captureMode, setCaptureMode] = (0, react_1.useState)('camera');
    const [currentSide, setCurrentSide] = (0, react_1.useState)('front');
    const videoRef = (0, react_1.useRef)(null);
    const canvasRef = (0, react_1.useRef)(null);
    const fileInputRef = (0, react_1.useRef)(null);
    const [stream, setStream] = (0, react_1.useState)(null);
    const [isCameraActive, setIsCameraActive] = (0, react_1.useState)(false);
    const { toast } = (0, use_toast_1.useToast)();
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
        }
        catch (error) {
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
                    }
                    else {
                        stopCamera();
                    }
                }
                else {
                    setBackImage(imageData);
                    stopCamera();
                }
            }
        }
    };
    const handleFileUpload = (event) => {
        var _a;
        const file = (_a = event.target.files) === null || _a === void 0 ? void 0 : _a[0];
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
                var _a;
                const imageData = (_a = e.target) === null || _a === void 0 ? void 0 : _a.result;
                if (currentSide === 'front') {
                    setFrontImage(imageData);
                    if (requiresBackImage) {
                        setCurrentSide('back');
                        // Reset file input for next upload
                        if (fileInputRef.current)
                            fileInputRef.current.value = '';
                    }
                }
                else {
                    setBackImage(imageData);
                }
            };
            reader.readAsDataURL(file);
        }
    };
    const handleRetake = (side) => {
        if (side === 'front') {
            setFrontImage(null);
            setBackImage(null);
            setCurrentSide('front');
        }
        else {
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
    return (React.createElement("div", { className: "space-y-6" },
        React.createElement("div", { className: "space-y-4" },
            React.createElement("div", null,
                React.createElement("label", { className: "text-sm font-medium mb-2 block" }, "Document Type"),
                React.createElement(select_1.Select, { value: documentType, onValueChange: setDocumentType },
                    React.createElement(select_1.SelectTrigger, { "data-testid": "select-document-type" },
                        React.createElement(select_1.SelectValue, null)),
                    React.createElement(select_1.SelectContent, null,
                        React.createElement(select_1.SelectItem, { value: "drivers_license" }, "Driver's License"),
                        React.createElement(select_1.SelectItem, { value: "passport" }, "Passport"),
                        React.createElement(select_1.SelectItem, { value: "id_card" }, "National ID Card")))),
            React.createElement(alert_1.Alert, null,
                React.createElement(lucide_react_1.FileText, { className: "h-4 w-4" }),
                React.createElement(alert_1.AlertDescription, null, documentType === 'passport'
                    ? 'Please capture the photo page of your passport'
                    : `Please capture both front and back of your ${documentType.replace('_', ' ')}`)),
            React.createElement("div", { className: "flex gap-2" },
                React.createElement(button_1.Button, { variant: captureMode === 'camera' ? 'default' : 'outline', onClick: () => setCaptureMode('camera'), className: "flex-1", "data-testid": "button-camera-mode" },
                    React.createElement(lucide_react_1.Camera, { className: "h-4 w-4 mr-2" }),
                    "Use Camera"),
                React.createElement(button_1.Button, { variant: captureMode === 'upload' ? 'default' : 'outline', onClick: () => setCaptureMode('upload'), className: "flex-1", "data-testid": "button-upload-mode" },
                    React.createElement(lucide_react_1.Upload, { className: "h-4 w-4 mr-2" }),
                    "Upload File")),
            captureMode === 'camera' ? (React.createElement("div", { className: "space-y-4" }, !frontImage || (requiresBackImage && currentSide === 'back' && !backImage) ? (React.createElement(React.Fragment, null,
                React.createElement(card_1.Card, { className: "overflow-hidden" },
                    React.createElement(card_1.CardContent, { className: "p-0 relative" }, isCameraActive ? (React.createElement(React.Fragment, null,
                        React.createElement("video", { ref: videoRef, autoPlay: true, playsInline: true, muted: true, className: "w-full", "data-testid": "video-camera" }),
                        React.createElement("canvas", { ref: canvasRef, className: "hidden" }),
                        React.createElement("div", { className: "absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded" },
                            "Capturing ",
                            currentSide === 'front' ? 'Front' : 'Back'))) : (React.createElement("div", { className: "h-64 flex items-center justify-center bg-muted" },
                        React.createElement(button_1.Button, { onClick: startCamera, "data-testid": "button-start-camera" },
                            React.createElement(lucide_react_1.Camera, { className: "h-4 w-4 mr-2" }),
                            "Start Camera"))))),
                isCameraActive && (React.createElement(button_1.Button, { onClick: capturePhoto, className: "w-full", size: "lg", "data-testid": "button-capture-photo" },
                    "Capture ",
                    currentSide === 'front' ? 'Front' : 'Back',
                    " of ID")))) : null)) : (React.createElement("div", { className: "space-y-4" }, (!frontImage || (requiresBackImage && currentSide === 'back' && !backImage)) && (React.createElement(card_1.Card, null,
                React.createElement(card_1.CardContent, { className: "py-8" },
                    React.createElement("input", { ref: fileInputRef, type: "file", accept: "image/*", onChange: handleFileUpload, className: "hidden", "data-testid": "input-file-upload" }),
                    React.createElement(button_1.Button, { variant: "outline", className: "w-full h-32 border-dashed", onClick: () => { var _a; return (_a = fileInputRef.current) === null || _a === void 0 ? void 0 : _a.click(); }, "data-testid": "button-select-file" },
                        React.createElement("div", { className: "text-center" },
                            React.createElement(lucide_react_1.Upload, { className: "h-8 w-8 mx-auto mb-2" }),
                            React.createElement("div", null,
                                "Click to upload ",
                                currentSide,
                                " of ID"),
                            React.createElement("div", { className: "text-sm text-muted-foreground mt-1" }, "JPG, PNG up to 10MB")))))))),
            (frontImage || backImage) && (React.createElement("div", { className: "space-y-4" },
                frontImage && (React.createElement(card_1.Card, null,
                    React.createElement(card_1.CardContent, { className: "p-4" },
                        React.createElement("div", { className: "flex justify-between items-center mb-2" },
                            React.createElement("span", { className: "text-sm font-medium" }, "Front of ID"),
                            React.createElement(button_1.Button, { size: "sm", variant: "ghost", onClick: () => handleRetake('front'), "data-testid": "button-retake-front" },
                                React.createElement(lucide_react_1.RotateCw, { className: "h-4 w-4 mr-1" }),
                                "Retake")),
                        React.createElement("img", { src: frontImage, alt: "Front of ID", className: "w-full rounded", "data-testid": "image-front-preview" })))),
                backImage && (React.createElement(card_1.Card, null,
                    React.createElement(card_1.CardContent, { className: "p-4" },
                        React.createElement("div", { className: "flex justify-between items-center mb-2" },
                            React.createElement("span", { className: "text-sm font-medium" }, "Back of ID"),
                            React.createElement(button_1.Button, { size: "sm", variant: "ghost", onClick: () => handleRetake('back'), "data-testid": "button-retake-back" },
                                React.createElement(lucide_react_1.RotateCw, { className: "h-4 w-4 mr-1" }),
                                "Retake")),
                        React.createElement("img", { src: backImage, alt: "Back of ID", className: "w-full rounded", "data-testid": "image-back-preview" }))))))),
        React.createElement("div", { className: "flex gap-3" },
            onBack && (React.createElement(button_1.Button, { variant: "outline", onClick: () => {
                    stopCamera();
                    onBack();
                }, "data-testid": "button-back" },
                React.createElement(lucide_react_1.ChevronLeft, { className: "h-4 w-4 mr-2" }),
                "Back")),
            React.createElement(button_1.Button, { onClick: handleSubmit, disabled: !canSubmit, className: "flex-1", "data-testid": "button-continue" },
                "Continue to Selfie",
                React.createElement(lucide_react_1.ChevronRight, { className: "h-4 w-4 ml-2" })))));
}
