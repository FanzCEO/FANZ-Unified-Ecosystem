"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CreatorStudio;
const react_1 = require("react");
const react_query_1 = require("@tanstack/react-query");
const card_1 = require("@/components/ui/card");
const button_1 = require("@/components/ui/button");
const tabs_1 = require("@/components/ui/tabs");
const alert_1 = require("@/components/ui/alert");
const badge_1 = require("@/components/ui/badge");
const use_toast_1 = require("@/hooks/use-toast");
const queryClient_1 = require("@/lib/queryClient");
const lucide_react_1 = require("lucide-react");
const CameraCapture_1 = __importDefault(require("@/components/creator/CameraCapture"));
const ContentUpload_1 = __importDefault(require("@/components/creator/ContentUpload"));
const EditingPreview_1 = __importDefault(require("@/components/creator/EditingPreview"));
const DistributionSettings_1 = __importDefault(require("@/components/creator/DistributionSettings"));
const ContentAnalytics_1 = __importDefault(require("@/components/creator/ContentAnalytics"));
const VerificationModal_1 = __importDefault(require("@/components/verification/VerificationModal"));
const VerificationBadge_1 = __importDefault(require("@/components/verification/VerificationBadge"));
function CreatorStudio() {
    const [activeTab, setActiveTab] = (0, react_1.useState)('create');
    const [selectedSession, setSelectedSession] = (0, react_1.useState)(null);
    const [showVerificationAlert, setShowVerificationAlert] = (0, react_1.useState)(false);
    const [showVerificationModal, setShowVerificationModal] = (0, react_1.useState)(false);
    const { toast } = (0, use_toast_1.useToast)();
    // Check verification status
    const { data: profile } = (0, react_query_1.useQuery)({
        queryKey: ['/api/user/profile'],
    });
    // Get verification status
    const { data: verificationStatus } = (0, react_query_1.useQuery)({
        queryKey: ['/api/verification/status'],
    });
    // Get studio settings
    const { data: settings, isLoading: settingsLoading } = (0, react_query_1.useQuery)({
        queryKey: ['/api/creator/studio/settings'],
    });
    // Get content sessions
    const { data: sessions = [], isLoading: sessionsLoading, refetch: refetchSessions } = (0, react_query_1.useQuery)({
        queryKey: ['/api/creator/content/sessions'],
    });
    // Update settings mutation
    const updateSettingsMutation = (0, react_query_1.useMutation)({
        mutationFn: (newSettings) => (0, queryClient_1.apiRequest)('/api/creator/studio/settings', {
            method: 'POST',
            body: newSettings,
        }),
        onSuccess: () => {
            queryClient_1.queryClient.invalidateQueries({ queryKey: ['/api/creator/studio/settings'] });
            toast({
                title: 'Settings updated',
                description: 'Your studio preferences have been saved.',
            });
        },
    });
    // Delete session mutation
    const deleteSessionMutation = (0, react_query_1.useMutation)({
        mutationFn: (sessionId) => (0, queryClient_1.apiRequest)(`/api/creator/content/sessions/${sessionId}`, {
            method: 'DELETE',
        }),
        onSuccess: () => {
            refetchSessions();
            toast({
                title: 'Content deleted',
                description: 'The content session has been removed.',
            });
        },
    });
    // Check if user is verified
    (0, react_1.useEffect)(() => {
        if (verificationStatus && !verificationStatus.verified) {
            setShowVerificationAlert(true);
        }
        else if (verificationStatus === null || verificationStatus === void 0 ? void 0 : verificationStatus.verified) {
            setShowVerificationAlert(false);
        }
    }, [verificationStatus]);
    // Handle verification success
    const handleVerificationSuccess = () => {
        setShowVerificationModal(false);
        setShowVerificationAlert(false);
        queryClient_1.queryClient.invalidateQueries({ queryKey: ['/api/verification/status'] });
        queryClient_1.queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
        toast({
            title: 'Verification Complete!',
            description: 'You can now access all creator features.',
        });
    };
    const handleContentCreated = (session) => {
        setSelectedSession(session);
        refetchSessions();
        if (settings === null || settings === void 0 ? void 0 : settings.autoEditingEnabled) {
            // Automatically start processing
            processContent(session.id);
        }
        toast({
            title: 'Content uploaded successfully',
            description: (settings === null || settings === void 0 ? void 0 : settings.autoEditingEnabled)
                ? 'AI processing has started automatically.'
                : 'Your content is ready for editing.',
        });
    };
    const processContent = async (sessionId) => {
        try {
            await (0, queryClient_1.apiRequest)(`/api/creator/content/process/${sessionId}`, {
                method: 'POST',
                body: {
                    editingOptions: {
                        autoCut: true,
                        addBranding: true,
                        generateMultipleAspectRatios: true,
                        createTrailer: true,
                        createGif: true,
                    },
                },
            });
            refetchSessions();
        }
        catch (error) {
            console.error('Failed to process content:', error);
        }
    };
    const getStatusIcon = (status) => {
        switch (status) {
            case 'processing':
                return React.createElement(lucide_react_1.Clock, { className: "h-4 w-4 animate-spin" });
            case 'ready':
                return React.createElement(lucide_react_1.CheckCircle, { className: "h-4 w-4 text-green-500" });
            case 'distributed':
                return React.createElement(lucide_react_1.Share2, { className: "h-4 w-4 text-blue-500" });
            case 'failed':
                return React.createElement(lucide_react_1.AlertCircle, { className: "h-4 w-4 text-red-500" });
            default:
                return null;
        }
    };
    const getSessionStats = () => {
        const totalViews = sessions.reduce((acc, s) => { var _a; return acc + (((_a = s.analytics) === null || _a === void 0 ? void 0 : _a.views) || 0); }, 0);
        const totalRevenue = sessions.reduce((acc, s) => { var _a; return acc + (((_a = s.analytics) === null || _a === void 0 ? void 0 : _a.revenue) || 0); }, 0);
        const activeCount = sessions.filter(s => s.status === 'distributed').length;
        return { totalViews, totalRevenue, activeCount };
    };
    const stats = getSessionStats();
    return (React.createElement("div", { className: "container mx-auto py-6 space-y-6" },
        React.createElement("div", { className: "flex justify-between items-center" },
            React.createElement("div", null,
                React.createElement("h1", { className: "text-3xl font-bold", "data-testid": "title-creator-studio" }, "Creator Studio"),
                React.createElement("p", { className: "text-muted-foreground" }, "Create, edit, and distribute your content with AI automation")),
            React.createElement("div", { className: "flex gap-2" },
                React.createElement(button_1.Button, { variant: "outline", onClick: () => setActiveTab('analytics'), "data-testid": "button-analytics" },
                    React.createElement(lucide_react_1.TrendingUp, { className: "h-4 w-4 mr-2" }),
                    "Analytics"),
                React.createElement(button_1.Button, { variant: "outline", onClick: () => setActiveTab('settings'), "data-testid": "button-settings" },
                    React.createElement(lucide_react_1.Settings, { className: "h-4 w-4 mr-2" }),
                    "Settings"))),
        showVerificationAlert && !(verificationStatus === null || verificationStatus === void 0 ? void 0 : verificationStatus.verified) && (React.createElement(alert_1.Alert, { className: "border-yellow-500 bg-yellow-50" },
            React.createElement(lucide_react_1.AlertCircle, { className: "h-4 w-4" }),
            React.createElement(alert_1.AlertDescription, { "data-testid": "alert-verification" },
                React.createElement("div", { className: "flex items-center justify-between" },
                    React.createElement("div", null,
                        React.createElement("strong", null, "Verification Required:"),
                        " Complete your ID verification to unlock all creator features.",
                        React.createElement("p", { className: "text-sm mt-1" }, "Verification ensures compliance with 18 U.S.C. \u00A72257 requirements.")),
                    React.createElement(button_1.Button, { size: "sm", onClick: () => setShowVerificationModal(true), "data-testid": "button-verify-now" },
                        React.createElement(lucide_react_1.Shield, { className: "h-4 w-4 mr-2" }),
                        "Verify Now"))))),
        (verificationStatus === null || verificationStatus === void 0 ? void 0 : verificationStatus.verified) && (React.createElement("div", { className: "flex items-center gap-2 text-green-600" },
            React.createElement(lucide_react_1.CheckCircle, { className: "h-5 w-5" }),
            React.createElement("span", { className: "font-medium" }, "Identity Verified"),
            React.createElement(VerificationBadge_1.default, { showText: true }))),
        React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4" },
            React.createElement(card_1.Card, null,
                React.createElement(card_1.CardHeader, { className: "pb-3" },
                    React.createElement(card_1.CardTitle, { className: "text-sm font-medium" }, "Active Content")),
                React.createElement(card_1.CardContent, null,
                    React.createElement("div", { className: "text-2xl font-bold", "data-testid": "stat-active-content" }, stats.activeCount))),
            React.createElement(card_1.Card, null,
                React.createElement(card_1.CardHeader, { className: "pb-3" },
                    React.createElement(card_1.CardTitle, { className: "text-sm font-medium" }, "Total Views")),
                React.createElement(card_1.CardContent, null,
                    React.createElement("div", { className: "text-2xl font-bold", "data-testid": "stat-total-views" }, stats.totalViews.toLocaleString()))),
            React.createElement(card_1.Card, null,
                React.createElement(card_1.CardHeader, { className: "pb-3" },
                    React.createElement(card_1.CardTitle, { className: "text-sm font-medium" }, "Revenue")),
                React.createElement(card_1.CardContent, null,
                    React.createElement("div", { className: "text-2xl font-bold", "data-testid": "stat-revenue" },
                        "$",
                        (stats.totalRevenue / 100).toFixed(2)))),
            React.createElement(card_1.Card, null,
                React.createElement(card_1.CardHeader, { className: "pb-3" },
                    React.createElement(card_1.CardTitle, { className: "text-sm font-medium" }, "Auto Mode")),
                React.createElement(card_1.CardContent, null,
                    React.createElement("div", { className: "flex items-center gap-2" }, (settings === null || settings === void 0 ? void 0 : settings.autoEditingEnabled) && (settings === null || settings === void 0 ? void 0 : settings.autoDistributionEnabled) ? (React.createElement(React.Fragment, null,
                        React.createElement(lucide_react_1.Sparkles, { className: "h-5 w-5 text-green-500" }),
                        React.createElement("span", { className: "text-green-500 font-medium", "data-testid": "status-auto-mode" }, "Full Auto"))) : (React.createElement(React.Fragment, null,
                        React.createElement(lucide_react_1.Settings, { className: "h-5 w-5 text-gray-500" }),
                        React.createElement("span", { className: "text-gray-500", "data-testid": "status-manual-mode" }, "Manual"))))))),
        React.createElement(tabs_1.Tabs, { value: activeTab, onValueChange: setActiveTab },
            React.createElement(tabs_1.TabsList, { className: "grid w-full grid-cols-5" },
                React.createElement(tabs_1.TabsTrigger, { value: "create", "data-testid": "tab-create" }, "Create"),
                React.createElement(tabs_1.TabsTrigger, { value: "content", "data-testid": "tab-content" }, "Content"),
                React.createElement(tabs_1.TabsTrigger, { value: "edit", "data-testid": "tab-edit" }, "Edit"),
                React.createElement(tabs_1.TabsTrigger, { value: "distribute", "data-testid": "tab-distribute" }, "Distribute"),
                React.createElement(tabs_1.TabsTrigger, { value: "analytics", "data-testid": "tab-analytics" }, "Analytics")),
            React.createElement(tabs_1.TabsContent, { value: "create", className: "space-y-4" },
                React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4" },
                    React.createElement(card_1.Card, { className: "cursor-pointer hover:shadow-lg transition-shadow" },
                        React.createElement(card_1.CardHeader, null,
                            React.createElement(card_1.CardTitle, { className: "flex items-center gap-2" },
                                React.createElement(lucide_react_1.Camera, { className: "h-5 w-5" }),
                                "Film with Camera"),
                            React.createElement(card_1.CardDescription, null, "Use built-in camera with filters and effects")),
                        React.createElement(card_1.CardContent, null,
                            React.createElement(CameraCapture_1.default, { onCapture: handleContentCreated }))),
                    React.createElement(card_1.Card, { className: "cursor-pointer hover:shadow-lg transition-shadow" },
                        React.createElement(card_1.CardHeader, null,
                            React.createElement(card_1.CardTitle, { className: "flex items-center gap-2" },
                                React.createElement(lucide_react_1.Upload, { className: "h-5 w-5" }),
                                "Upload Content"),
                            React.createElement(card_1.CardDescription, null, "Drag and drop or select files")),
                        React.createElement(card_1.CardContent, null,
                            React.createElement(ContentUpload_1.default, { onUpload: handleContentCreated }))),
                    React.createElement(card_1.Card, { className: "cursor-pointer hover:shadow-lg transition-shadow" },
                        React.createElement(card_1.CardHeader, null,
                            React.createElement(card_1.CardTitle, { className: "flex items-center gap-2" },
                                React.createElement(lucide_react_1.Radio, { className: "h-5 w-5" }),
                                "Go Live"),
                            React.createElement(card_1.CardDescription, null, "Start a live stream with co-stars")),
                        React.createElement(card_1.CardContent, null,
                            React.createElement(button_1.Button, { className: "w-full", variant: "outline", onClick: () => toast({ title: 'Live streaming coming soon!' }), "data-testid": "button-go-live" },
                                React.createElement(lucide_react_1.Radio, { className: "h-4 w-4 mr-2" }),
                                "Start Live Stream"))))),
            React.createElement(tabs_1.TabsContent, { value: "content", className: "space-y-4" },
                React.createElement(card_1.Card, null,
                    React.createElement(card_1.CardHeader, null,
                        React.createElement(card_1.CardTitle, null, "Your Content Sessions"),
                        React.createElement(card_1.CardDescription, null, "Manage your uploaded and created content")),
                    React.createElement(card_1.CardContent, null,
                        React.createElement("div", { className: "space-y-4" }, sessionsLoading ? (React.createElement("p", null, "Loading sessions...")) : sessions.length === 0 ? (React.createElement("div", { className: "text-center py-8" },
                            React.createElement(lucide_react_1.Film, { className: "h-12 w-12 mx-auto text-gray-400 mb-2" }),
                            React.createElement("p", { className: "text-gray-500" }, "No content yet. Start creating!"))) : (sessions.map((session) => (React.createElement(card_1.Card, { key: session.id, "data-testid": `card-session-${session.id}` },
                            React.createElement(card_1.CardContent, { className: "flex items-center justify-between p-4" },
                                React.createElement("div", { className: "flex-1" },
                                    React.createElement("div", { className: "flex items-center gap-2 mb-1" },
                                        React.createElement("h3", { className: "font-medium" }, session.title),
                                        React.createElement(badge_1.Badge, { variant: "outline" }, session.type),
                                        getStatusIcon(session.status)),
                                    React.createElement("p", { className: "text-sm text-muted-foreground" },
                                        "Created ",
                                        new Date(session.createdAt).toLocaleDateString()),
                                    session.analytics && (React.createElement("div", { className: "flex gap-4 mt-2 text-sm" },
                                        React.createElement("span", { className: "flex items-center gap-1" },
                                            React.createElement(lucide_react_1.Eye, { className: "h-3 w-3" }),
                                            session.analytics.views),
                                        React.createElement("span", { className: "flex items-center gap-1" },
                                            React.createElement(lucide_react_1.Heart, { className: "h-3 w-3" }),
                                            session.analytics.likes),
                                        React.createElement("span", { className: "flex items-center gap-1" },
                                            React.createElement(lucide_react_1.DollarSign, { className: "h-3 w-3" }),
                                            "$",
                                            (session.analytics.revenue / 100).toFixed(2))))),
                                React.createElement("div", { className: "flex gap-2" },
                                    React.createElement(button_1.Button, { size: "sm", variant: "outline", onClick: () => setSelectedSession(session), disabled: session.status === 'processing', "data-testid": `button-view-${session.id}` }, "View"),
                                    React.createElement(button_1.Button, { size: "sm", variant: "ghost", onClick: () => deleteSessionMutation.mutate(session.id), "data-testid": `button-delete-${session.id}` }, "Delete"))))))))))),
            React.createElement(tabs_1.TabsContent, { value: "edit" }, selectedSession ? (React.createElement(EditingPreview_1.default, { session: selectedSession })) : (React.createElement(card_1.Card, null,
                React.createElement(card_1.CardContent, { className: "text-center py-12" },
                    React.createElement(lucide_react_1.Sparkles, { className: "h-12 w-12 mx-auto text-gray-400 mb-2" }),
                    React.createElement("p", { className: "text-gray-500" }, "Select content to edit"))))),
            React.createElement(tabs_1.TabsContent, { value: "distribute" }, selectedSession ? (React.createElement(DistributionSettings_1.default, { sessionId: selectedSession.id, onDistribute: () => refetchSessions() })) : (React.createElement(card_1.Card, null,
                React.createElement(card_1.CardContent, { className: "text-center py-12" },
                    React.createElement(lucide_react_1.Share2, { className: "h-12 w-12 mx-auto text-gray-400 mb-2" }),
                    React.createElement("p", { className: "text-gray-500" }, "Select content to distribute"))))),
            React.createElement(tabs_1.TabsContent, { value: "analytics" },
                React.createElement(ContentAnalytics_1.default, { sessions: sessions }))),
        React.createElement(VerificationModal_1.default, { open: showVerificationModal, onClose: () => setShowVerificationModal(false), onSuccess: handleVerificationSuccess, mandatory: false, userType: "creator" })));
}
