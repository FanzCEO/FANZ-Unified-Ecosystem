"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = EditingPreview;
const react_1 = require("react");
const react_query_1 = require("@tanstack/react-query");
const card_1 = require("@/components/ui/card");
const button_1 = require("@/components/ui/button");
const tabs_1 = require("@/components/ui/tabs");
const badge_1 = require("@/components/ui/badge");
const switch_1 = require("@/components/ui/switch");
const label_1 = require("@/components/ui/label");
const progress_1 = require("@/components/ui/progress");
const slider_1 = require("@/components/ui/slider");
const use_toast_1 = require("@/hooks/use-toast");
const queryClient_1 = require("@/lib/queryClient");
const lucide_react_1 = require("lucide-react");
function EditingPreview({ session }) {
    var _a;
    const [isPlaying, setIsPlaying] = (0, react_1.useState)(false);
    const [selectedVersion, setSelectedVersion] = (0, react_1.useState)(null);
    const [editingOptions, setEditingOptions] = (0, react_1.useState)({
        autoCut: true,
        addBranding: true,
        generateMultipleAspectRatios: true,
        createTrailer: true,
        createGif: true,
        addMusic: false,
        addCaptions: true,
        colorCorrection: true,
        stabilization: true,
    });
    const [volume, setVolume] = (0, react_1.useState)([80]);
    const { toast } = (0, use_toast_1.useToast)();
    // Get editing task status
    const { data: editingTask, isLoading: taskLoading } = (0, react_query_1.useQuery)({
        queryKey: [`/api/creator/content/editing/${session.id}`],
        enabled: !!session.id,
        refetchInterval: (data) => {
            // Poll while processing
            if ((data === null || data === void 0 ? void 0 : data.status) === 'processing') {
                return 2000;
            }
            return false;
        },
    });
    // Get content versions
    const { data: versions = [], isLoading: versionsLoading } = (0, react_query_1.useQuery)({
        queryKey: [`/api/creator/content/versions/${session.id}`],
        enabled: (editingTask === null || editingTask === void 0 ? void 0 : editingTask.status) === 'completed',
    });
    // Get AI pricing suggestions
    const { data: pricingSuggestion } = (0, react_query_1.useQuery)({
        queryKey: [`/api/creator/content/pricing/${session.id}`],
        enabled: (editingTask === null || editingTask === void 0 ? void 0 : editingTask.status) === 'completed',
    });
    // Process content mutation
    const processContentMutation = (0, react_query_1.useMutation)({
        mutationFn: () => (0, queryClient_1.apiRequest)(`/api/creator/content/process/${session.id}`, {
            method: 'POST',
            body: { editingOptions },
        }),
        onSuccess: () => {
            queryClient_1.queryClient.invalidateQueries({ queryKey: [`/api/creator/content/editing/${session.id}`] });
            toast({
                title: 'Processing started',
                description: 'AI is now editing your content. This may take a few minutes.',
            });
        },
    });
    // Download content
    const downloadContent = (version) => {
        const link = document.createElement('a');
        link.href = version.url;
        link.download = `content-${version.aspectRatio.replace(':', 'x')}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    const getAspectRatioIcon = (ratio) => {
        switch (ratio) {
            case '9:16':
                return React.createElement(lucide_react_1.Smartphone, { className: "h-4 w-4" });
            case '16:9':
                return React.createElement(lucide_react_1.Monitor, { className: "h-4 w-4" });
            case '1:1':
                return React.createElement(lucide_react_1.Square, { className: "h-4 w-4" });
            default:
                return React.createElement(lucide_react_1.Film, { className: "h-4 w-4" });
        }
    };
    const getStatusBadge = () => {
        if (!editingTask)
            return null;
        switch (editingTask.status) {
            case 'pending':
                return (React.createElement(badge_1.Badge, { variant: "outline", className: "gap-1" },
                    React.createElement(lucide_react_1.Clock, { className: "h-3 w-3" }),
                    "Pending"));
            case 'processing':
                return (React.createElement(badge_1.Badge, { className: "gap-1" },
                    React.createElement(lucide_react_1.Loader2, { className: "h-3 w-3 animate-spin" }),
                    "Processing"));
            case 'completed':
                return (React.createElement(badge_1.Badge, { variant: "default", className: "gap-1" },
                    React.createElement(lucide_react_1.CheckCircle, { className: "h-3 w-3" }),
                    "Completed"));
            case 'failed':
                return (React.createElement(badge_1.Badge, { variant: "destructive", className: "gap-1" },
                    React.createElement(lucide_react_1.AlertCircle, { className: "h-3 w-3" }),
                    "Failed"));
            default:
                return null;
        }
    };
    (0, react_1.useEffect)(() => {
        // Select first version when available
        if (versions.length > 0 && !selectedVersion) {
            setSelectedVersion(versions[0]);
        }
    }, [versions, selectedVersion]);
    return (React.createElement("div", { className: "space-y-6" },
        React.createElement(card_1.Card, null,
            React.createElement(card_1.CardHeader, null,
                React.createElement("div", { className: "flex justify-between items-center" },
                    React.createElement("div", null,
                        React.createElement(card_1.CardTitle, null, session.title),
                        React.createElement(card_1.CardDescription, null, session.description || 'AI-powered content editing')),
                    getStatusBadge()))),
        (!editingTask || editingTask.status === 'pending') && (React.createElement(card_1.Card, null,
            React.createElement(card_1.CardHeader, null,
                React.createElement(card_1.CardTitle, { className: "flex items-center gap-2" },
                    React.createElement(lucide_react_1.Sparkles, { className: "h-5 w-5" }),
                    "AI Editing Options"),
                React.createElement(card_1.CardDescription, null, "Customize how AI processes your content")),
            React.createElement(card_1.CardContent, { className: "space-y-6" },
                React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4" },
                    React.createElement("div", { className: "flex items-center justify-between" },
                        React.createElement(label_1.Label, { htmlFor: "autoCut", className: "flex items-center gap-2" },
                            React.createElement(lucide_react_1.Scissors, { className: "h-4 w-4" }),
                            "Auto Cut & Trim"),
                        React.createElement(switch_1.Switch, { id: "autoCut", checked: editingOptions.autoCut, onCheckedChange: (checked) => setEditingOptions(Object.assign(Object.assign({}, editingOptions), { autoCut: checked })), "data-testid": "switch-auto-cut" })),
                    React.createElement("div", { className: "flex items-center justify-between" },
                        React.createElement(label_1.Label, { htmlFor: "addBranding", className: "flex items-center gap-2" },
                            React.createElement(lucide_react_1.Type, { className: "h-4 w-4" }),
                            "Add Branding"),
                        React.createElement(switch_1.Switch, { id: "addBranding", checked: editingOptions.addBranding, onCheckedChange: (checked) => setEditingOptions(Object.assign(Object.assign({}, editingOptions), { addBranding: checked })), "data-testid": "switch-branding" })),
                    React.createElement("div", { className: "flex items-center justify-between" },
                        React.createElement(label_1.Label, { htmlFor: "multiAspect", className: "flex items-center gap-2" },
                            React.createElement(lucide_react_1.Monitor, { className: "h-4 w-4" }),
                            "Multiple Aspect Ratios"),
                        React.createElement(switch_1.Switch, { id: "multiAspect", checked: editingOptions.generateMultipleAspectRatios, onCheckedChange: (checked) => setEditingOptions(Object.assign(Object.assign({}, editingOptions), { generateMultipleAspectRatios: checked })), "data-testid": "switch-multi-aspect" })),
                    React.createElement("div", { className: "flex items-center justify-between" },
                        React.createElement(label_1.Label, { htmlFor: "createTrailer", className: "flex items-center gap-2" },
                            React.createElement(lucide_react_1.Film, { className: "h-4 w-4" }),
                            "Create Trailer"),
                        React.createElement(switch_1.Switch, { id: "createTrailer", checked: editingOptions.createTrailer, onCheckedChange: (checked) => setEditingOptions(Object.assign(Object.assign({}, editingOptions), { createTrailer: checked })), "data-testid": "switch-trailer" })),
                    React.createElement("div", { className: "flex items-center justify-between" },
                        React.createElement(label_1.Label, { htmlFor: "createGif", className: "flex items-center gap-2" },
                            React.createElement(lucide_react_1.Image, { className: "h-4 w-4" }),
                            "Create GIF"),
                        React.createElement(switch_1.Switch, { id: "createGif", checked: editingOptions.createGif, onCheckedChange: (checked) => setEditingOptions(Object.assign(Object.assign({}, editingOptions), { createGif: checked })), "data-testid": "switch-gif" })),
                    React.createElement("div", { className: "flex items-center justify-between" },
                        React.createElement(label_1.Label, { htmlFor: "addMusic", className: "flex items-center gap-2" },
                            React.createElement(lucide_react_1.Music, { className: "h-4 w-4" }),
                            "Add Music"),
                        React.createElement(switch_1.Switch, { id: "addMusic", checked: editingOptions.addMusic, onCheckedChange: (checked) => setEditingOptions(Object.assign(Object.assign({}, editingOptions), { addMusic: checked })), "data-testid": "switch-music" })),
                    React.createElement("div", { className: "flex items-center justify-between" },
                        React.createElement(label_1.Label, { htmlFor: "addCaptions", className: "flex items-center gap-2" },
                            React.createElement(lucide_react_1.Type, { className: "h-4 w-4" }),
                            "Auto Captions"),
                        React.createElement(switch_1.Switch, { id: "addCaptions", checked: editingOptions.addCaptions, onCheckedChange: (checked) => setEditingOptions(Object.assign(Object.assign({}, editingOptions), { addCaptions: checked })), "data-testid": "switch-captions" })),
                    React.createElement("div", { className: "flex items-center justify-between" },
                        React.createElement(label_1.Label, { htmlFor: "colorCorrection", className: "flex items-center gap-2" },
                            React.createElement(lucide_react_1.Palette, { className: "h-4 w-4" }),
                            "Color Correction"),
                        React.createElement(switch_1.Switch, { id: "colorCorrection", checked: editingOptions.colorCorrection, onCheckedChange: (checked) => setEditingOptions(Object.assign(Object.assign({}, editingOptions), { colorCorrection: checked })), "data-testid": "switch-color" }))),
                React.createElement(button_1.Button, { onClick: () => processContentMutation.mutate(), disabled: processContentMutation.isPending, className: "w-full", size: "lg", "data-testid": "button-start-processing" }, processContentMutation.isPending ? (React.createElement(React.Fragment, null,
                    React.createElement(lucide_react_1.Loader2, { className: "h-4 w-4 mr-2 animate-spin" }),
                    "Starting...")) : (React.createElement(React.Fragment, null,
                    React.createElement(lucide_react_1.Sparkles, { className: "h-4 w-4 mr-2" }),
                    "Start AI Processing")))))),
        (editingTask === null || editingTask === void 0 ? void 0 : editingTask.status) === 'processing' && (React.createElement(card_1.Card, null,
            React.createElement(card_1.CardContent, { className: "py-8" },
                React.createElement("div", { className: "text-center space-y-4" },
                    React.createElement(lucide_react_1.Loader2, { className: "h-12 w-12 mx-auto animate-spin text-primary" }),
                    React.createElement("h3", { className: "text-lg font-medium" }, "AI is processing your content"),
                    React.createElement("p", { className: "text-muted-foreground" }, "This usually takes 2-5 minutes depending on content length"),
                    editingTask.progress && (React.createElement("div", { className: "max-w-xs mx-auto" },
                        React.createElement(progress_1.Progress, { value: editingTask.progress }),
                        React.createElement("p", { className: "text-sm text-muted-foreground mt-2" },
                            editingTask.progress,
                            "% complete"))))))),
        (editingTask === null || editingTask === void 0 ? void 0 : editingTask.status) === 'completed' && versions.length > 0 && (React.createElement(React.Fragment, null,
            React.createElement(card_1.Card, null,
                React.createElement(card_1.CardHeader, null,
                    React.createElement(card_1.CardTitle, null, "Preview"),
                    React.createElement(card_1.CardDescription, null, "Review your AI-edited content")),
                React.createElement(card_1.CardContent, { className: "space-y-4" }, selectedVersion && (React.createElement(React.Fragment, null,
                    React.createElement("div", { className: "aspect-video bg-black rounded-lg overflow-hidden" },
                        React.createElement("video", { src: selectedVersion.url, controls: true, className: "w-full h-full", "data-testid": "video-player" })),
                    React.createElement("div", { className: "flex items-center gap-4" },
                        React.createElement("div", { className: "flex items-center gap-2 flex-1" },
                            React.createElement(lucide_react_1.Volume2, { className: "h-4 w-4" }),
                            React.createElement(slider_1.Slider, { value: volume, onValueChange: setVolume, max: 100, step: 1, className: "flex-1", "data-testid": "slider-volume" })),
                        React.createElement(button_1.Button, { onClick: () => downloadContent(selectedVersion), "data-testid": "button-download" },
                            React.createElement(lucide_react_1.Download, { className: "h-4 w-4 mr-2" }),
                            "Download")))))),
            React.createElement(card_1.Card, null,
                React.createElement(card_1.CardHeader, null,
                    React.createElement(card_1.CardTitle, null, "Generated Versions"),
                    React.createElement(card_1.CardDescription, null, "AI has created multiple versions optimized for different platforms")),
                React.createElement(card_1.CardContent, null,
                    React.createElement(tabs_1.Tabs, { defaultValue: (_a = versions[0]) === null || _a === void 0 ? void 0 : _a.aspectRatio },
                        React.createElement(tabs_1.TabsList, { className: "grid w-full grid-cols-3" }, versions.map((version) => (React.createElement(tabs_1.TabsTrigger, { key: version.id, value: version.aspectRatio, onClick: () => setSelectedVersion(version), "data-testid": `tab-version-${version.aspectRatio}` },
                            getAspectRatioIcon(version.aspectRatio),
                            React.createElement("span", { className: "ml-2" }, version.aspectRatio))))),
                        versions.map((version) => (React.createElement(tabs_1.TabsContent, { key: version.id, value: version.aspectRatio, className: "space-y-4" },
                            React.createElement("div", { className: "grid grid-cols-2 gap-4 text-sm" },
                                React.createElement("div", null,
                                    React.createElement("p", { className: "text-muted-foreground" }, "Platform"),
                                    React.createElement("p", { className: "font-medium" }, version.platform)),
                                React.createElement("div", null,
                                    React.createElement("p", { className: "text-muted-foreground" }, "File Size"),
                                    React.createElement("p", { className: "font-medium" },
                                        (version.fileSize / (1024 * 1024)).toFixed(2),
                                        " MB")),
                                version.duration && (React.createElement("div", null,
                                    React.createElement("p", { className: "text-muted-foreground" }, "Duration"),
                                    React.createElement("p", { className: "font-medium" },
                                        version.duration,
                                        "s")))),
                            React.createElement(button_1.Button, { variant: "outline", className: "w-full", onClick: () => downloadContent(version), "data-testid": `button-download-${version.aspectRatio}` },
                                React.createElement(lucide_react_1.Download, { className: "h-4 w-4 mr-2" }),
                                "Download ",
                                version.aspectRatio,
                                " Version"))))))),
            pricingSuggestion && (React.createElement(card_1.Card, null,
                React.createElement(card_1.CardHeader, null,
                    React.createElement(card_1.CardTitle, { className: "flex items-center gap-2" },
                        React.createElement(lucide_react_1.Sparkles, { className: "h-5 w-5" }),
                        "AI Pricing Recommendation")),
                React.createElement(card_1.CardContent, null,
                    React.createElement("div", { className: "grid grid-cols-3 gap-4 text-center" },
                        React.createElement("div", null,
                            React.createElement("p", { className: "text-sm text-muted-foreground" }, "Minimum"),
                            React.createElement("p", { className: "text-2xl font-bold", "data-testid": "price-min" },
                                "$",
                                pricingSuggestion.min)),
                        React.createElement("div", { className: "border-2 border-primary rounded-lg p-2" },
                            React.createElement("p", { className: "text-sm font-medium text-primary" }, "Recommended"),
                            React.createElement("p", { className: "text-3xl font-bold text-primary", "data-testid": "price-recommended" },
                                "$",
                                pricingSuggestion.recommended)),
                        React.createElement("div", null,
                            React.createElement("p", { className: "text-sm text-muted-foreground" }, "Maximum"),
                            React.createElement("p", { className: "text-2xl font-bold", "data-testid": "price-max" },
                                "$",
                                pricingSuggestion.max))),
                    React.createElement("p", { className: "text-sm text-muted-foreground text-center mt-4" }, "Based on content quality, duration, and market analysis"))))))));
}
