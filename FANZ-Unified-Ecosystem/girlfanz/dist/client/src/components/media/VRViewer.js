"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VRViewer = VRViewer;
const react_1 = require("react");
const button_1 = require("@/components/ui/button");
const badge_1 = require("@/components/ui/badge");
const card_1 = require("@/components/ui/card");
const lucide_react_1 = require("lucide-react");
function VRViewer({ mediaUrl, vrType, resolution = '4K', stereoscopicMode = 'mono', projectionType = 'equirectangular', onClose, }) {
    const [isFullscreen, setIsFullscreen] = (0, react_1.useState)(false);
    const [isVRMode, setIsVRMode] = (0, react_1.useState)(false);
    const [isMuted, setIsMuted] = (0, react_1.useState)(false);
    const [rotation, setRotation] = (0, react_1.useState)({ x: 0, y: 0 });
    const containerRef = (0, react_1.useRef)(null);
    const videoRef = (0, react_1.useRef)(null);
    const isDragging = (0, react_1.useRef)(false);
    const lastMousePos = (0, react_1.useRef)({ x: 0, y: 0 });
    (0, react_1.useEffect)(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);
    const toggleFullscreen = async () => {
        if (!containerRef.current)
            return;
        try {
            if (!document.fullscreenElement) {
                await containerRef.current.requestFullscreen();
            }
            else {
                await document.exitFullscreen();
            }
        }
        catch (error) {
            console.error('Fullscreen error:', error);
        }
    };
    const resetView = () => {
        setRotation({ x: 0, y: 0 });
    };
    const handleMouseDown = (e) => {
        isDragging.current = true;
        lastMousePos.current = { x: e.clientX, y: e.clientY };
    };
    const handleMouseMove = (e) => {
        if (!isDragging.current)
            return;
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
    return (React.createElement("div", { ref: containerRef, className: "relative w-full h-full bg-black", "data-testid": "vr-viewer-container" },
        React.createElement("div", { className: "absolute top-4 left-4 z-10 flex gap-2" },
            React.createElement(badge_1.Badge, { className: "bg-gf-cyber/90 backdrop-blur text-white" },
                React.createElement(lucide_react_1.Glasses, { className: "h-3 w-3 mr-1" }),
                vrType.replace('_', ' ').toUpperCase()),
            React.createElement(badge_1.Badge, { className: "bg-black/70 backdrop-blur text-white" }, resolution),
            stereoscopicMode !== 'mono' && (React.createElement(badge_1.Badge, { className: "bg-black/70 backdrop-blur text-white" },
                React.createElement(lucide_react_1.Eye, { className: "h-3 w-3 mr-1" }),
                stereoscopicMode.toUpperCase()))),
        React.createElement("div", { className: "relative w-full h-full overflow-hidden cursor-grab active:cursor-grabbing", onMouseDown: handleMouseDown, onMouseMove: handleMouseMove, onMouseUp: handleMouseUp, onMouseLeave: handleMouseUp },
            vrType === '360_video' || vrType === '180_video' ? (React.createElement("video", { ref: videoRef, src: mediaUrl, className: "w-full h-full object-cover", style: {
                    transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
                    transformStyle: 'preserve-3d',
                }, autoPlay: true, loop: true, muted: isMuted, playsInline: true, "data-testid": "vr-video" })) : vrType === '3d_model' ? (React.createElement("div", { className: "w-full h-full flex items-center justify-center", style: {
                    transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
                    transformStyle: 'preserve-3d',
                } },
                React.createElement("div", { className: "text-gf-snow text-center" },
                    React.createElement(lucide_react_1.Move3d, { className: "h-16 w-16 mx-auto mb-4 text-gf-cyber" }),
                    React.createElement("p", { className: "text-lg font-semibold" }, "3D Model Viewer"),
                    React.createElement("p", { className: "text-sm text-gf-steel mt-2" }, "Drag to rotate \u2022 Scroll to zoom")))) : (React.createElement("div", { className: "w-full h-full flex items-center justify-center" },
                React.createElement("div", { className: "text-gf-snow text-center" },
                    React.createElement(lucide_react_1.Glasses, { className: "h-16 w-16 mx-auto mb-4 text-gf-cyber" }),
                    React.createElement("p", { className: "text-lg font-semibold" }, "AR Filter"),
                    React.createElement("p", { className: "text-sm text-gf-steel mt-2" }, "Enable camera access to try this filter")))),
            isVRMode && (React.createElement("div", { className: "absolute inset-0 pointer-events-none" },
                React.createElement("div", { className: "w-full h-full grid grid-cols-2 gap-1 opacity-20" },
                    React.createElement("div", { className: "border border-gf-cyber" }),
                    React.createElement("div", { className: "border border-gf-cyber" }))))),
        React.createElement("div", { className: "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-6 z-10" },
            React.createElement(card_1.Card, { className: "bg-black/60 backdrop-blur border-gf-steel/20 p-4" },
                React.createElement("div", { className: "flex items-center justify-between gap-4" },
                    React.createElement("div", { className: "flex items-center gap-2" },
                        React.createElement(button_1.Button, { variant: "ghost", size: "icon", onClick: resetView, className: "text-white hover:text-gf-cyber", "data-testid": "button-reset-view" },
                            React.createElement(lucide_react_1.RotateCcw, { className: "h-5 w-5" })),
                        (vrType === '360_video' || vrType === '180_video') && (React.createElement(button_1.Button, { variant: "ghost", size: "icon", onClick: () => setIsMuted(!isMuted), className: "text-white hover:text-gf-cyber", "data-testid": "button-toggle-mute" }, isMuted ? React.createElement(lucide_react_1.VolumeX, { className: "h-5 w-5" }) : React.createElement(lucide_react_1.Volume2, { className: "h-5 w-5" }))),
                        React.createElement(button_1.Button, { variant: "ghost", size: "icon", onClick: toggleFullscreen, className: "text-white hover:text-gf-cyber", "data-testid": "button-toggle-fullscreen" }, isFullscreen ? React.createElement(lucide_react_1.Minimize, { className: "h-5 w-5" }) : React.createElement(lucide_react_1.Maximize, { className: "h-5 w-5" }))),
                    React.createElement("div", { className: "flex items-center gap-2" },
                        React.createElement(button_1.Button, { onClick: enterVRMode, className: "bg-gradient-to-r from-gf-cyber to-gf-pink hover:opacity-90", "data-testid": "button-enter-vr" },
                            React.createElement(lucide_react_1.Glasses, { className: "h-4 w-4 mr-2" }),
                            "Enter VR"),
                        onClose && (React.createElement(button_1.Button, { variant: "outline", onClick: onClose, className: "border-gf-steel/20 text-white", "data-testid": "button-close-vr" }, "Close")))),
                React.createElement("div", { className: "mt-4 flex items-center justify-center gap-4 text-xs text-gf-steel" },
                    React.createElement("span", null,
                        "X: ",
                        rotation.x.toFixed(1),
                        "\u00B0"),
                    React.createElement("span", null,
                        "Y: ",
                        rotation.y.toFixed(1),
                        "\u00B0"),
                    React.createElement("span", { className: "text-gf-cyber" }, "Drag to look around")))),
        !isVRMode && (React.createElement("div", { className: "absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center pointer-events-none z-5 animate-fade-in" },
            React.createElement("div", { className: "text-center text-white p-8 bg-gf-charcoal/80 rounded-lg border border-gf-cyber/30 pointer-events-auto max-w-md" },
                React.createElement(lucide_react_1.Glasses, { className: "h-12 w-12 mx-auto mb-4 text-gf-cyber" }),
                React.createElement("h3", { className: "text-xl font-bold mb-2" }, "VR/AR Experience"),
                React.createElement("p", { className: "text-gf-steel mb-4" }, "Drag to look around \u2022 Use VR mode for immersive viewing"),
                React.createElement("div", { className: "grid grid-cols-2 gap-2 text-sm" },
                    React.createElement("div", { className: "flex items-center gap-2" },
                        React.createElement(lucide_react_1.Move3d, { className: "h-4 w-4 text-gf-cyber" }),
                        React.createElement("span", null, "Drag to rotate")),
                    React.createElement("div", { className: "flex items-center gap-2" },
                        React.createElement(lucide_react_1.Maximize, { className: "h-4 w-4 text-gf-cyber" }),
                        React.createElement("span", null, "Fullscreen")),
                    React.createElement("div", { className: "flex items-center gap-2" },
                        React.createElement(lucide_react_1.Glasses, { className: "h-4 w-4 text-gf-cyber" }),
                        React.createElement("span", null, "VR mode")),
                    React.createElement("div", { className: "flex items-center gap-2" },
                        React.createElement(lucide_react_1.RotateCcw, { className: "h-4 w-4 text-gf-cyber" }),
                        React.createElement("span", null, "Reset view"))))))));
}
